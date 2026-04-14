"use client";
import { useEffect, useRef, useState } from "react";
import type { FaceLandmarker as FaceLandmarkerType } from "@mediapipe/tasks-vision";
import type { FaceSignal } from "@/shared/domain/types";
import { DrowsinessAnalyzer } from "../lib/drowsinessAnalyzer";
import { classifyFaceState } from "../lib/faceStateClassifier";
import { calculateEAR, LEFT_EYE_INDICES, RIGHT_EYE_INDICES, type EyePoint } from "../lib/earCalculator";

/**
 * Must match the installed @mediapipe/tasks-vision version (0.10.34).
 * For production: copy node_modules/@mediapipe/tasks-vision/wasm/ to public/ and use a local path.
 */
const WASM_BASE_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm";

/**
 * Face Landmarker v2 model — 478 landmarks, float16.
 * To serve locally: download to public/mediapipe/models/ and update this path.
 */
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export function useFaceSignal(): { signal: FaceSignal | null; enabled: boolean } {
  const [signal, setSignal] = useState<FaceSignal | null>(null);
  const [enabled, setEnabled] = useState(false);
  const rafRef = useRef<number>(0);
  // Kept as ref so the cleanup closure can call close() without capturing stale state
  const landmarkerRef = useRef<FaceLandmarkerType | null>(null);

  useEffect(() => {
    let active = true;
    let stream: MediaStream | null = null;

    async function init() {
      // Dynamic import keeps MediaPipe out of the SSR bundle
      let FaceLandmarker: typeof import("@mediapipe/tasks-vision").FaceLandmarker;
      let FilesetResolver: typeof import("@mediapipe/tasks-vision").FilesetResolver;
      try {
        ({ FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision"));
      } catch {
        return;
      }
      if (!active) return;

      // Request webcam
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      } catch {
        return; // Camera denied or unavailable — stay disabled silently
      }
      if (!active) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      // Off-screen video element — no DOM attachment needed for getUserMedia streams
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      try {
        await video.play();
      } catch {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      if (!active) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      // Initialize FaceLandmarker — the typed `landmarker` is captured in the processFrame closure
      let landmarker: FaceLandmarkerType;
      try {
        const fileset = await FilesetResolver.forVisionTasks(WASM_BASE_URL);
        landmarker = await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL },
          runningMode: "VIDEO",
          numFaces: 1,
        });
        landmarkerRef.current = landmarker;
      } catch {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      if (!active) {
        landmarker.close();
        landmarkerRef.current = null;
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      setEnabled(true);
      const analyzer = new DrowsinessAnalyzer();
      let lastTs = -1;

      function processFrame(): void {
        if (!active) return;

        const ts = performance.now();

        // Skip if timestamp hasn't advanced or video isn't ready
        if (ts <= lastTs || video.readyState < 2 || video.videoWidth === 0) {
          rafRef.current = requestAnimationFrame(processFrame);
          return;
        }
        lastTs = ts;

        const detection = landmarker.detectForVideo(video, ts);

        if (detection.faceLandmarks && detection.faceLandmarks.length > 0) {
          const lm = detection.faceLandmarks[0];
          const w = video.videoWidth;
          const h = video.videoHeight;

          // Scale normalized coords to pixel space for accurate EAR computation
          const toPixel = (idx: number): EyePoint => [lm[idx].x * w, lm[idx].y * h];
          const leftEAR = calculateEAR(LEFT_EYE_INDICES.map(toPixel));
          const rightEAR = calculateEAR(RIGHT_EYE_INDICES.map(toPixel));
          const ear = (leftEAR + rightEAR) / 2;

          analyzer.addSample(ear, Date.now());
          const { state, confidence } = classifyFaceState({ drowsiness: analyzer.analyze() });

          setSignal({ state, confidence, timestamp: new Date().toISOString(), metrics: { ear } });
        } else {
          // No face in frame
          setSignal((prev) => ({
            state: "neutral" as const,
            confidence: 0.9,
            timestamp: new Date().toISOString(),
            metrics: prev?.metrics,
          }));
        }

        rafRef.current = requestAnimationFrame(processFrame);
      }

      rafRef.current = requestAnimationFrame(processFrame);
    }

    void init();

    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
      stream?.getTracks().forEach((t) => t.stop());
      setEnabled(false);
    };
  }, []);

  return { signal, enabled };
}
