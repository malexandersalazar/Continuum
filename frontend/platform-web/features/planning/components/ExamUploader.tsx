"use client";
import { ChangeEvent, useState } from "react";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import type { ExamUpload } from "@/shared/domain/types";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface Props {
  studentId: string;
  onStudentIdChange: (id: string) => void;
  exams: ExamUpload[];
  onAdd: (uploads: ExamUpload[]) => void;
  onRemove: (idx: number) => void;
}

export function ExamUploader({ studentId, onStudentIdChange, exams, onAdd, onRemove }: Props) {
  const [reading, setReading] = useState(false);

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setReading(true);
    try {
      const uploads: ExamUpload[] = await Promise.all(
        files.map(async (f) => ({
          student_id: studentId,
          file_name: f.name,
          file_size: f.size,
          file_content_base64: await fileToBase64(f),
        })),
      );
      onAdd(uploads);
    } finally {
      setReading(false);
      e.target.value = "";
    }
  }

  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Examen del alumno</h3>
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs text-gray-600 dark:text-gray-400">ID del alumno</span>
          <Input
            value={studentId}
            onChange={(e) => onStudentIdChange(e.target.value)}
            placeholder="alu_001"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Adjuntar PDF(s)</span>
          <input
            type="file"
            multiple
            accept="application/pdf"
            onChange={handleFiles}
            disabled={reading}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700 disabled:opacity-50"
          />
          {reading && <p className="text-xs text-gray-500">Leyendo archivos...</p>}
        </label>
        {exams.length > 0 && (
          <ul className="space-y-1 text-sm">
            {exams.map((ex, idx) => (
              <li
                key={`${ex.file_name}-${idx}`}
                className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 dark:border-gray-800"
              >
                <span className="truncate">
                  {ex.file_name}{" "}
                  <span className="text-xs text-gray-500">({Math.round(ex.file_size / 1024)} KB)</span>
                </span>
                <Button variant="ghost" onClick={() => onRemove(idx)}>
                  Quitar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
