import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  const { imagenBase64 } = await req.json();
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Analiza este ticket. Extrae los productos y agrúpalos por: Alimentación, Limpieza, Salud, Mascotas u Otros. 
  Responde SOLO en este formato JSON: 
  {"desglose": [{"producto": "nombre", "precio": 0.00, "categoria": "nombre"}], "mensajeRose": "Tu mensaje gótico aquí"}`;

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: imagenBase64, mimeType: "image/jpeg" } }
  ]);

  return new Response(result.response.text());
}