export function Spinner({ label = "Cargando..." }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
      {label}
    </span>
  );
}
