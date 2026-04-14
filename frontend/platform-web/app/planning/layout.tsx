export default function PlanningLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Planning</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Crea planes de nivelación personalizados para tus alumnos.
        </p>
      </header>
      {children}
    </div>
  );
}
