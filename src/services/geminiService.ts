import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    // Correct API Key access for Gemini as per platform requirements
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    console.log("API key loaded:", !!apiKey, apiKey?.slice(0, 8));

    if (!apiKey) {
      console.error("Gemini API Key is missing. Ensure it is set in the Settings menu.");
      throw new Error("Gemini API Key is missing. Please check your AI Studio Settings.");
    }

    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function getStyleRecommendations(imageBuffer: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
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

    return response.text;
  } catch (error: any) {
    const errorMessage = error.message || '';
    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      throw new Error("Gemini API quota exceeded. You may have reached the daily limit. Check your quota at: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas");
    }
    if (errorMessage.includes('403') || errorMessage.includes('PERMISSION_DENIED')) {
      if (errorMessage.includes('API_KEY_SERVICE_BLOCKED')) {
        throw new Error("API Key Blocked: Your API key has 'API Restrictions' in Google Cloud. Please go to Credentials, edit your key, and allow 'Generative Language API' or select 'Don't restrict key'.");
      }
      throw new Error("Gemini API access denied. Please ensure 'Generative Language API' is enabled in your Google Cloud Console.");
    }
    throw error;
  }
}

export async function getMixAndMatchSuggestions(garments: any[]) {
  try {
    const ai = getAI();
    const garmentDescriptions = garments.map(g => `${g.category} (${g.tags?.join(', ') || 'no tags'})`).join(', ');

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview",
      contents: `I have these items in my wardrobe: ${garmentDescriptions}. Suggest 3 unique outfit combinations I can make with them. Focus on creative and trendy styling.`
    });

    return response.text;
  } catch (error: any) {
    const errorMessage = error.message || '';
    if (errorMessage.includes('403') || errorMessage.includes('PERMISSION_DENIED')) {
      if (errorMessage.includes('API_KEY_SERVICE_BLOCKED')) {
        throw new Error("API Key Blocked: Your API key has 'API Restrictions' in Google Cloud. Please go to Credentials, edit your key, and allow 'Generative Language API'.");
      }
      throw new Error("Gemini API access denied. Please ensure 'Generative Language API' is enabled in your Google Cloud Console.");
    }
    throw error;
  }
}

export async function getSummary(analysis: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Summarize these style recommendations into a single, punchy, and trendy sentence (max 60 characters): "${analysis}"`
    });

    return response.text;
  } catch (error: any) {
    const errorMessage = error.message || '';
    if (errorMessage.includes('403') || errorMessage.includes('PERMISSION_DENIED')) {
      if (errorMessage.includes('API_KEY_SERVICE_BLOCKED')) {
        throw new Error("API Key Blocked: Your API key has 'API Restrictions' in Google Cloud. Please go to Credentials, edit your key, and allow 'Generative Language API'.");
      }
      throw new Error("Gemini API access denied. Please ensure 'Generative Language API' is enabled in your Google Cloud Console.");
    }
    throw error;
  }
}

export async function generateStyleVisual(prompt: string, originalImage: string) {
  try {
    const ai = getAI();

    // Using gemini-2.5-flash-image for image-to-image generation to maintain likeness
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: originalImage.split(',')[1],
              mimeType: "image/jpeg",
            },
          },
          {
            text: `Generate a high-quality fashion visual based on the person in this image and these recommendations: "${prompt}". 
            Maintain the person's likeness (hair, skin tone, build) but change their outfit to match the recommendations. 
            Professional photography, high-end editorial look, aesthetic, trendy, 8k resolution, highly detailed.`,
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("Gemini did not return an image part.");
  } catch (error: any) {
    console.error("Gemini Visual Generation Error:", error);

    // Fallback to Pollinations if Gemini fails
    const pollinationsPrompt = encodeURIComponent(`professional fashion photography, high-end editorial look, ${prompt}, aesthetic, trendy, 8k resolution, highly detailed`);
    const seed = Math.floor(Math.random() * 1000000);
    return `https://image.pollinations.ai/prompt/${pollinationsPrompt}?width=1024&height=1024&nologo=true&seed=${seed}`;
  }
}
