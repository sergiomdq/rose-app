import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { mensaje, estadisticas } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Eres Rose, una asistente empática y directa de Silent Hill que analiza gastos personales.

CONTEXTO DEL USUARIO:
- Gastos totales: $${estadisticas.totalGastos}
- Ingresos mensuales: $${estadisticas.totalIngresos}
- Porcentaje ahorrado: ${estadisticas.porcentajeAhorrado.toFixed(1)}%
- Desglose por categoría: ${JSON.stringify(estadisticas.categoriasDesglose)}

IMPORTANTE:
1. El usuario NO come carne - sugiere alternativas vegetarianas/veganas
2. Responde en 2-3 párrafos máximo
3. Sé motivador pero realista
4. Usa un tono misterioso pero accesible (Silent Hill theme)
5. NO uses markdown, solo texto plano

Mensaje del usuario: "${mensaje}"

Responde directamente sin preámbulos.`;

    const result = await model.generateContent(prompt);
    const respuesta = result.response.text();

    return Response.json({ respuesta });
  } catch (error) {
    console.error("Error:", error);
    return Response.json(
      { respuesta: "La niebla impidió escuchar... intenta de nuevo." },
      { status: 500 }
    );
  }
}
