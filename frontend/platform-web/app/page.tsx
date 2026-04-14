import Link from "next/link";
import { Card } from "@/shared/ui/Card";

export default function LandingPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-semibold">Bienvenido a Continuum</h1>
        <p className="mt-2 max-w-2xl text-gray-600 dark:text-gray-400">
          Plataforma de nivelación educativa basada en los 9 eventos de Gagné. Los docentes crean
          planes de nivelación personalizados y los estudiantes aprenden con un tutor IA adaptativo.
        </p>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/planning" className="block">
          <Card className="h-full transition-shadow hover:shadow-md">
            <h2 className="text-lg font-semibold">Soy Docente</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Selecciona temas de la Knowledge Base, adjunta exámenes de tus alumnos y genera un
              plan de nivelación personalizado en segundos.
            </p>
            <span className="mt-4 inline-block text-sm font-medium text-blue-600">
              Ir a Planning →
            </span>
          </Card>
        </Link>
        <Link href="/learning" className="block">
          <Card className="h-full transition-shadow hover:shadow-md">
            <h2 className="text-lg font-semibold">Soy Estudiante</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Accede a tu nivelación asignada o explora libremente la Knowledge Base con la ayuda de
              un tutor IA que se adapta a tu ritmo.
            </p>
            <span className="mt-4 inline-block text-sm font-medium text-blue-600">
              Ir a Learning →
            </span>
          </Card>
        </Link>
      </section>
    </div>
  );
}
