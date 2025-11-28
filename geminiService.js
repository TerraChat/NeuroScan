import { GoogleGenAI, Type, Schema } from "@google/genai";
import { QuestionResult } from "../types";

// FIX: Hardcoded the key to ensure the API service loads. 
// NOTE: This is insecure. For production, use an environment file (.env).
const apiKey = "AIzaSyCO3vw58VDZyHaIQ9yOMni5fepndQ29zJ4";

// Initialize the client
const ai = new GoogleGenAI({ apiKey });

// Define the response schema
const scanResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    foundQuestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: {
            type: Type.STRING,
            description: "The full text of the question found on the screen."
          },
          answer: {
            type: Type.STRING,
            description: "A very brief, direct answer. No fluff. Max 1-2 sentences."
          },
          category: {
            type: Type.STRING,
            description: "Category of the question (e.g., Math, History, Coding, Logic)."
          },
          confidence: {
            type: Type.NUMBER,
            description: "Confidence score between 0 and 100."
          }
        },
        required: ["question", "answer", "category", "confidence"]
      }
    }
  },
  required: ["foundQuestions"]
};

export const analyzeScreenFrame = async (base64Image: string): Promise<QuestionResult[]> => {
  if (!apiKey) {
    console.error("API Key is missing");
    throw new Error("API Key is missing");
  }

  try {
    // Remove data URL prefix if present (e.g., "data:image/png;base64,")
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
          },
          {
            text: "Analyze this screen capture. Identify any multiple choice questions, quiz questions, or technical queries visible. For each, provide the question text and the correct answer. Be extremely concise. If no questions are clearly visible, return an empty array."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: scanResponseSchema,
        temperature: 0.1, // Low temperature for factual accuracy
      }
    });

    const text = response.text;
    if (!text) return [];

    const data = JSON.parse(text);
    return data.foundQuestions || [];

  } catch (error) {
    console.error("Error analyzing screen:", error);
    // Return empty array on error to keep app stable, but log it
    return [];
  }
};
