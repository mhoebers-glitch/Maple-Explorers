
import { GoogleGenAI, Type } from "@google/genai";
import { GrammarTopic, Question } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateGrammarQuestion(topic: GrammarTopic): Promise<Question> {
  const prompt = `Generate a single A2-level English grammar question for 12-year-olds.
    Topic: ${topic}.
    If the topic is "Arctic Archives (Reading)", provide a very short 2-3 sentence interesting fact about Canada and ask a comprehension question.
    Ensure it's fun and Canadian themed (e.g., using names like Maple, Jasper, or Toronto).`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Provide exactly 4 options for multiple choice questions."
          },
          correctAnswer: { type: Type.STRING },
          explanation: { type: Type.STRING },
          readingPassage: { type: Type.STRING, description: "Only for reading comprehension tasks." }
        },
        required: ["text", "correctAnswer", "explanation"]
      }
    }
  });

  const data = JSON.parse(response.text);
  return {
    id: Math.random().toString(36).substr(2, 9),
    topic,
    ...data
  };
}

export async function generateRegionVisual(regionName: string): Promise<string> {
  const prompt = `A beautiful, stylized, cartoon-like illustration of ${regionName} in Canada, vibrant colors, friendly for children age 12, high quality, panoramic view.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: { aspectRatio: "16:9" }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  return 'https://picsum.photos/800/450';
}
