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
        { nivel: "avanzado", enunciado: "Reducir: M = -5a + 10b - 16a + 27a - 10b", respuesta: "6a" },
      ],
      aplicaciones_reales: [
        "Fórmulas de perímetros y áreas con medidas desconocidas",
        "Modelar costos variables en una pequeña empresa",
      ],
      mnemotecnia: "Sin igual no hay ecuación, solo expresión.",
    },
  },
  {
    topic_id: "mat.alg.funciones",
    tenant_id: DEMO_TENANT_ID,
    curso: "Matemáticas",
    modulo: "Álgebra",
    titulo: "Evaluación de funciones",
    prerequisitos: ["mat.alg.expresiones"],
    secciones: {
      concepto:
        "Una función asigna a cada valor de la variable independiente (x) exactamente un valor de la variable dependiente f(x). Evaluar una función significa sustituir la variable por un valor dado y calcular el resultado.",
      ejemplos: [
        {
          enunciado: "Si f(x) = 3x + 2, hallar f(4)",
          solucion: "f(4) = 14",
          paso_a_paso: ["Sustituir x por 4: f(4) = 3(4) + 2", "Multiplicar: 12 + 2", "Sumar: f(4) = 14"],
        },
        {
          enunciado: "Si f(x) = 5x² - x + 7, hallar f(2)",
          solucion: "f(2) = 25",
          paso_a_paso: [
            "Sustituir x por 2: f(2) = 5(2)² - 2 + 7",
            "Calcular potencia: 5(4) - 2 + 7",
            "Multiplicar: 20 - 2 + 7",
            "Operar: f(2) = 25",
          ],
        },
      ],
      contraejemplos: ["x² + y² = 1 NO es función de x (a un x le pueden corresponder dos valores de y)"],
      ejercicios: [
        { nivel: "basico", enunciado: "Si f(x) = 2x + 1, hallar f(3)", respuesta: "f(3) = 7" },
        { nivel: "intermedio", enunciado: "Si f(x) = x² - 4x + 3, hallar f(5)", respuesta: "f(5) = 8" },
        { nivel: "avanzado", enunciado: "Si f(x) = 2x³ - x² + 3, hallar f(-1)", respuesta: "f(-1) = 0" },
      ],
      aplicaciones_reales: [
        "Calcular el costo total en función de la cantidad de productos",
        "Convertir temperaturas entre Celsius y Fahrenheit con f(C) = 1.8C + 32",
      ],
      mnemotecnia: "Una función es una máquina: entra un número, sale exactamente otro.",
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
