// geminiService.js

// 1. Use a robust import alias for the Google GenAI SDK from a working CDN
import * as GenAIModule from "https://cdn.jsdelivr.net/npm/@google/genai@^1.30.0/dist/index.js";

const GoogleGenAI = GenAIModule.GoogleGenAI;
const Type = GenAIModule.Type;

// **WARNING: API KEY EMBEDDED DIRECTLY**
// This is done to meet your constraint of using only two files.
const apiKey = "AIzaSyCO3vw58VDZyHaIQ9yOMni5fepndQ29zJ4"; 

// Initialize the client
const ai = new GoogleGenAI({ apiKey });

// Define the response schema (Pure JavaScript object using the imported Type constants)
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
 */
const analyzeScreenFrame = async (base64Image) => {
  if (!apiKey) {
    console.error("API Key is missing");
    return [];
  }

  try {
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
        temperature: 0.1,
      }
    });

    const text = response.text;
    if (!text) return [];

    const data = JSON.parse(text);
    return data.foundQuestions || [];

  } catch (error) {
    console.error("Error analyzing screen:", error);
    return [];
  }
};

// 2. EXPOSE THE FUNCTION GLOBALLY so the React script (in index.html) can access it
window.analyzeScreenFrame = analyzeScreenFrame;
