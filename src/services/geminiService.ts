import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    // In AI Studio, process.env.GEMINI_API_KEY is injected.
    // For local development with Vite, you should use VITE_GEMINI_API_KEY in a .env file.
    const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || 
                   (import.meta.env?.VITE_GEMINI_API_KEY);
    
    if (!apiKey) {
      console.error("Gemini API Key is missing. Please set GEMINI_API_KEY or VITE_GEMINI_API_KEY in your environment.");
      // We return a dummy instance or handle it gracefully in the functions
      // For now, we'll throw a more descriptive error when a function is called
      throw new Error("Gemini API Key is missing. Check your .env file or environment variables.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function getStyleRecommendations(imageBuffer: string) {
  const ai = getAI();
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: "Analyze this person's outfit and provide 3 VERY CONCISE, high-impact style recommendations. Max 15 words per recommendation. Suggest one quick upcycling tip. Keep the entire response under 60 words total." },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBuffer.split(',')[1]
            }
          }
        ]
      }
    ]
  });

  const response = await model;
  return response.text;
}

export async function getMixAndMatchSuggestions(garments: any[]) {
  const ai = getAI();
  const garmentDescriptions = garments.map(g => `${g.category} (${g.tags?.join(', ') || 'no tags'})`).join(', ');
  
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `I have these items in my wardrobe: ${garmentDescriptions}. Suggest 3 unique outfit combinations I can make with them. Focus on creative and trendy styling.`
  });

  const response = await model;
  return response.text;
}

export async function getSummary(analysis: string) {
  const ai = getAI();
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Summarize these style recommendations into a single, punchy, and trendy sentence (max 60 characters): "${analysis}"`
  });

  const response = await model;
  return response.text;
}

export async function generateStyleVisual(imageBuffer: string, analysis: string) {
  const ai = getAI();
  const model = ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [
      {
        parts: [
          { text: `Based on this style analysis: "${analysis}", generate a high-quality fashion photography style image of a person wearing a recommended upcycled and thrifted outfit. The style should be trendy and sustainable.` },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBuffer.split(',')[1]
            }
          }
        ]
      }
    ],
    config: {
      imageConfig: {
        imageSize: "512px"
      }
    }
  });

  const response = await model;
  const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (imagePart?.inlineData) {
    return `data:image/png;base64,${imagePart.inlineData.data}`;
  }
  return null;
}
