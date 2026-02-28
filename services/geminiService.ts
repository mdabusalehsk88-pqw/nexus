
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// We create a fresh instance for video generation to handle the API Key selection race conditions
const getAIInstance = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const chatWithGemini = async (
  message: string, 
  history: { role: string; parts: { text: string }[] }[],
  imagePart?: { inlineData: { data: string; mimeType: string } }
) => {
  const ai = getAIInstance();
  const contents = [...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: h.parts }))];
  
  const parts: any[] = [{ text: message }];
  if (imagePart) {
    parts.unshift(imagePart);
  }
  
  contents.push({ role: 'user', parts });

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: contents,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: "You are Nexus, a helpful and highly intelligent AI assistant. Use tools if necessary for current events."
    },
  });

  return {
    text: response.text || "I'm sorry, I couldn't generate a response.",
    groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const generateImage = async (prompt: string, aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" = "1:1") => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
      },
    },
  });

  for (const part of response.candidates?.[0]?.content.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image data returned from Gemini");
};

export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16' = '16:9') => {
  const ai = getAIInstance();
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: aspectRatio
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed or no URI returned.");
  
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export const checkVideoApiKey = async (): Promise<boolean> => {
  // @ts-ignore
  if (typeof window.aistudio === 'undefined') return true; // Fallback if not in environment
  // @ts-ignore
  return await window.aistudio.hasSelectedApiKey();
};

export const openApiKeySelector = async () => {
  // @ts-ignore
  if (typeof window.aistudio !== 'undefined') {
    // @ts-ignore
    await window.aistudio.openSelectKey();
    return true;
  }
  return false;
};
