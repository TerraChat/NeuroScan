// geminiService.js

// Import the GoogleGenAI from a reliable CDN
// NOTE: This MUST be the working CDN URL for the Google GenAI SDK
import { GoogleGenAI, Type } from "https://cdn.jsdelivr.net/npm/@google/genai@^1.30.0/dist/index.js";

// **WARNING: API KEY EMBEDDED DIRECTLY**
// This key is publicly visible. This is a fix for your constraint of 
// having only two static files, but is not recommended for security.
const apiKey = "AIzaSyCO3vw58VDZyHaIQ9yOMni5fepndQ29zJ4"; 

// Initialize the client
const ai = new GoogleGenAI({ apiKey });

// Define the response schema
// Using a JavaScript object literal equivalent of the TypeScript Schema
const scanResponseSchema = {
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

/**
 * Analyzes a base64 image string using the Gemini model.
 * @param {string} base64Image - The base64 encoded image data.
 * @returns {Promise<Array<{question: string, answer: string, category: string, confidence: number}>>}
 */
export const analyzeScreenFrame = async (base64Image) => {
  if (!apiKey) {
    console.error("API Key is missing");
    throw new Error("API Key is missing");
  }

  try {
    // Remove data URL prefix if present (e.g., "data:image/png;base64,")
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanBase64
          }
        },
        {
          text: "Analyze this screen capture. Identify any multiple choice questions, quiz questions, or technical queries visible. For each, provide the question text and the correct answer. Be extremely concise and factual. If no questions are clearly visible, return an empty array."
        }
      ],
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

// Expose the function globally so the React script (transpiled by Babel) can call it
window.analyzeScreenFrame = analyzeScreenFrame;
