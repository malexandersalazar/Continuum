import { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

type Tone = "blue" | "green" | "amber" | "gray" | "red";

const tones: Record<Tone, string> = {
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  green: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  gray: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  red: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
};

export function Badge({
  tone = "gray",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
