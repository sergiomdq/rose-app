import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { mensaje, estadisticas } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Construir contexto de gastos
    const gastosContext = Object.entries(estadisticas.categoriasDesglose)
      .map(([cat, monto]: [string, any]) => `${cat}: $${monto.toFixed(2)}`)
      .join(", ");

    const prompt = `Eres Rose de Silent Hill, una asistente financiera empática pero directa.

CONTEXTO FINANCIERO DEL USUARIO:
- Total Gastos: $${estadisticas.totalGastos.toFixed(2)}
- Total Ingresos: $${estadisticas.totalIngresos.toFixed(2)}
- Porcentaje Ahorrado: ${estadisticas.porcentajeAhorrado.toFixed(1)}%
- Desglose de Gastos: ${gastosContext}

El usuario pregunta: "${mensaje}"

IMPORTANTE:
1. Sé empática pero honesta. Si gasta demasiado, díselo.
2. Dale consejos ESPECÍFICOS basado en sus gastos.
3. Si pregunta sobre COMIDA: Sugiere alternativas SIN CARNE (legumbres, verduras, frutas, granos).
4. Si pregunta sobre PRESUPUESTO: Analiza dónde está gastando más.
5. Si pregunta sobre SALUD FINANCIERA: Sé motivadora pero realista.
6. Responde EN MÁXIMO 2-3 párrafos, directo y útil.
7. Usa emojis ocasionalmente pero sé profesional.
8. Si mencionan una categoría de gasto, analízala.

RESPONDE SOLO CON EL MENSAJE, SIN FORMATO ESPECIAL.`;

    const result = await model.generateContent(prompt);
    const respuesta = result.response.text();

    return Response.json({ respuesta });
  } catch (error) {
    console.error("Error:", error);
    return Response.json(
      { respuesta: "La niebla es demasiado densa... Rose no puede escuchar en este momento." },
      { status: 500 }
    );
  }
}