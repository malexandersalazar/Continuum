export default function LearningLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Learning</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Aprende con un tutor IA adaptativo basado en los 9 eventos de Gagné.
        </p>
      </header>
      {children}
    </div>
  );
}
