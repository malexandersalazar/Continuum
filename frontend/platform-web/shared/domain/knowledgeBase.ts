import type { Topic } from "./types";

export const DEMO_TENANT_ID = "demo";

export const KNOWLEDGE_BASE: Topic[] = [
  {
    topic_id: "mat.alg.ec_lineales",
    tenant_id: DEMO_TENANT_ID,
    curso: "Matemáticas",
    modulo: "Álgebra",
    titulo: "Ecuaciones lineales de una variable",
    prerequisitos: ["mat.aritm.operaciones"],
    secciones: {
      concepto:
        "Una ecuación lineal es una igualdad con una incógnita de primer grado. Su forma general es ax + b = c, donde a, b y c son números conocidos y x es la incógnita.",
      ejemplos: [
        {
          enunciado: "Resolver: 2x + 4 = 10",
          solucion: "x = 3",
          paso_a_paso: ["2x = 10 - 4", "2x = 6", "x = 3"],
        },
      ],
      contraejemplos: ["x² + 1 = 0 NO es lineal (grado 2)"],
      ejercicios: [
        { nivel: "basico", enunciado: "Resolver: x + 5 = 9", respuesta: "x = 4" },
        { nivel: "intermedio", enunciado: "Resolver: 3x - 7 = 2x + 1", respuesta: "x = 8" },
        { nivel: "avanzado", enunciado: "Resolver: 4(x - 2) = 2x + 6", respuesta: "x = 7" },
      ],
      aplicaciones_reales: [
        "Calcular cuántos días hasta ahorrar cierta cantidad",
        "Distribuir una cuenta entre amigos con un costo fijo extra",
      ],
      mnemotecnia: "Despejar la x es descubrir el secreto de la ecuación.",
    },
  },
  {
    topic_id: "mat.alg.inecuaciones",
    tenant_id: DEMO_TENANT_ID,
    curso: "Matemáticas",
    modulo: "Álgebra",
    titulo: "Inecuaciones lineales",
    prerequisitos: ["mat.alg.ec_lineales"],
    secciones: {
      concepto:
        "Una inecuación lineal compara dos expresiones con <, >, ≤ o ≥. Se resuelve similar a una ecuación, pero al multiplicar o dividir por un número negativo se invierte el signo de la desigualdad.",
      ejemplos: [
        {
          enunciado: "Resolver: 2x - 3 < 7",
          solucion: "x < 5",
          paso_a_paso: ["2x < 7 + 3", "2x < 10", "x < 5"],
        },
      ],
      contraejemplos: ["2x + 1 = 5 NO es una inecuación (es igualdad)"],
      ejercicios: [
        { nivel: "basico", enunciado: "Resolver: x + 2 > 5", respuesta: "x > 3" },
        { nivel: "intermedio", enunciado: "Resolver: -3x + 6 ≤ 0", respuesta: "x ≥ 2" },
      ],
      aplicaciones_reales: [
        "Cuántas horas trabajar para superar cierto ingreso",
        "Qué cantidades de ingredientes mantienen una receta dentro del presupuesto",
      ],
      mnemotecnia: "Si negativo divide, el signo se invierte.",
    },
  },
  {
    topic_id: "mat.alg.sistemas",
    tenant_id: DEMO_TENANT_ID,
    curso: "Matemáticas",
    modulo: "Álgebra",
    titulo: "Sistemas de ecuaciones",
    prerequisitos: ["mat.alg.ec_lineales"],
    secciones: {
      concepto:
        "Un sistema de ecuaciones es un conjunto de ecuaciones que comparten incógnitas. Para resolverlo se necesitan tantas ecuaciones como incógnitas. Métodos: sustitución, igualación, reducción.",
      ejemplos: [
        {
          enunciado: "Resolver: x + y = 10 ; x - y = 2",
          solucion: "x = 6, y = 4",
          paso_a_paso: [
            "Sumar ecuaciones: 2x = 12",
            "x = 6",
            "Sustituir en la primera: 6 + y = 10, y = 4",
          ],
        },
      ],
      contraejemplos: ["Una sola ecuación con dos incógnitas no tiene solución única"],
      ejercicios: [
        {
          nivel: "basico",
          enunciado: "Resolver: x + y = 7 ; x - y = 1",
          respuesta: "x = 4, y = 3",
        },
        {
          nivel: "intermedio",
          enunciado: "Resolver: 2x + y = 8 ; x + y = 5",
          respuesta: "x = 3, y = 2",
        },
      ],
      aplicaciones_reales: [
        "Mezclar dos productos a diferentes precios para obtener un precio promedio",
        "Determinar velocidad y tiempo a partir de distancia",
      ],
      mnemotecnia: "Dos incógnitas piden dos pistas.",
    },
  },
  {
    topic_id: "mat.alg.expresiones",
    tenant_id: DEMO_TENANT_ID,
    curso: "Matemáticas",
    modulo: "Álgebra",
    titulo: "Expresiones algebraicas",
    prerequisitos: [],
    secciones: {
      concepto:
        "Una expresión algebraica combina números, letras (variables) y operaciones. A diferencia de una ecuación, no lleva signo igual y no se resuelve: se simplifica o evalúa.",
      ejemplos: [
        {
          enunciado: "Simplificar: 3x + 2x - x",
          solucion: "4x",
          paso_a_paso: ["Agrupar términos semejantes", "(3 + 2 - 1)x = 4x"],
        },
      ],
      contraejemplos: ["x + 2 = 5 NO es expresión (es ecuación)"],
      ejercicios: [
        { nivel: "basico", enunciado: "Simplificar: 2a + 3a", respuesta: "5a" },
        { nivel: "intermedio", enunciado: "Simplificar: 4x + 2y - x + y", respuesta: "3x + 3y" },
      ],
      aplicaciones_reales: [
        "Fórmulas de perímetros y áreas con medidas desconocidas",
        "Modelar costos variables en una pequeña empresa",
      ],
      mnemotecnia: "Sin igual no hay ecuación, solo expresión.",
    },
  },
];

export function getTopic(topic_id: string): Topic | undefined {
  return KNOWLEDGE_BASE.find((t) => t.topic_id === topic_id);
}

export function kbByModule(): Record<string, Topic[]> {
  return KNOWLEDGE_BASE.reduce<Record<string, Topic[]>>((acc, t) => {
    const key = `${t.curso} · ${t.modulo}`;
    (acc[key] ||= []).push(t);
    return acc;
  }, {});
}
