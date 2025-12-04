import { GoogleGenAI } from "@google/genai";

export const generateMotivationalQuote = async (name: string, grade: string): Promise<string> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found (set GEMINI_API_KEY in .env.local)");
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Crie uma frase curta, inspiradora e única para um card de Instagram de um aluno.

Nome do aluno: ${name}
Série/Ano escolar: ${grade}

Instruções:
- A frase deve ser em Português do Brasil.
- Deve ser motivacional, celebrando o aprendizado ou o futuro.
- Máximo de 20 palavras.
- Não use aspas na resposta.
- O tom deve ser alegre e educacional.`,
    });

    return response.text?.trim() || "O futuro pertence àqueles que acreditam na beleza de seus sonhos.";
  } catch (error) {
    console.error("Error generating quote:", error);
    return "A educação é a arma mais poderosa que você pode usar para mudar o mundo.";
  }
};
