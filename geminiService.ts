import { SkinAnalysis } from "./types";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

// 1. UPDATED MODEL LIST (Prioritize Llama 4 Scout)
const VISION_MODELS = [
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "llama-3.2-90b-vision-preview",   
  "llama-3.2-11b-vision-preview"       
];

// 2. HELPER: Compress Image
async function compressImage(base64Str: string, maxWidth = 1024, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str.startsWith("data:") ? base64Str : `data:image/jpeg;base64,${base64Str}`;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(base64Str);
  });
}

// 3. API CALL LOOP
async function tryGroqAnalysis(payload: any) {
  let lastError = null;
  for (const modelName of VISION_MODELS) {
    try {
      console.log(`Trying model: ${modelName}...`);
      const currentPayload = { ...payload, model: modelName };
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(currentPayload)
      });
      if (!response.ok) {
        const errText = await response.text();
        if (response.status === 401 || response.status === 403) throw new Error("CRITICAL: API Key Restricted.");
        if (response.status === 400 || response.status === 404) continue;
        throw new Error(`Groq Error (${response.status}): ${errText}`);
      }
      return await response.json();
    } catch (e: any) {
      lastError = e;
      if (e.message.includes("API Key")) throw e;
    }
  }
  throw lastError;
}

export const analyzeSkinImage = async (base64Image: string): Promise<SkinAnalysis> => {
  if (!GROQ_API_KEY) {
    alert("CRITICAL: Groq API Key is missing.");
    return { isSkin: false, isHealthy: false, diseaseName: "Error", description: "Key Missing" } as SkinAnalysis;
  }

  const compressedImage = await compressImage(base64Image);

  try {
    const payload = {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `You are a professional dermatologist. Analyze this image with extreme sensitivity to texture.

            STEP 0: IS THIS HUMAN SKIN? 
            - If it is a wall, fabric, or blurry object, return "isSkin": false.
            - If "isSkin": false, YOU MUST still fill "reasons" (why it failed) and "precautions" (how to take a better photo). Do not leave arrays empty.

            STEP 1: SENSITIVITY CHECK (Even for "Healthy" Skin)
            - Do NOT simply say "Healthy Skin" if there are minor imperfections.
            - Detect: Mild Acne, Enlarged Pores, Dehydration, Sebum/Oiliness, Fine Lines, Minor Scars, Hyper-pigmentation, or Scratch marks.
            - If no *disease* exists but these issues exist, set "isHealthy": true, but set "diseaseName" to the imperfection (e.g., "Healthy Skin - Mild Dehydration" or "Healthy Skin - Enlarged Pores").

            STEP 2: CONTENT FILLING (Crucial)
            - NEVER leave symptoms, reasons, treatments, or precautions empty.
            - If Healthy: List maintenance tips, sun protection, and hydration advice in "treatments" and "precautions".
            - If Not Skin: List tips for camera focus and lighting.

            Return ONLY valid JSON. Structure:
            {
              "isSkin": boolean,
              "isHealthy": boolean,
              "diseaseName": "string", 
              "description": "string",
              "symptoms": ["string"],
              "reasons": ["string"],
              "treatments": ["string"],
              "medicines": ["string"],
              "healingPeriod": "string",
              "precautions": ["string"],
              "prevention": ["string"]
            }` },
            { type: "image_url", image_url: { url: compressedImage } }
          ]
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    };

    const data = await tryGroqAnalysis(payload);
    const content = data.choices[0].message.content;
    const result = JSON.parse(content);

    // FIX: Ensure arrays are never empty to prevent UI blank spots
    const defaultAdvice = ["Maintain daily hygiene", "Use sunscreen (SPF 50)", "Drink 3L water daily"];
    if (!result.symptoms?.length) result.symptoms = ["No critical symptoms detected.", "Standard skin texture observed."];
    if (!result.reasons?.length) result.reasons = ["Genetics", "Environmental factors", "Lifestyle choices"];
    if (!result.precautions?.length) result.precautions = defaultAdvice;
    if (!result.prevention?.length) result.prevention = defaultAdvice;

    // Handle Non-Skin logic
    if (result.isSkin === false) {
       return {
         ...result,
         isHealthy: false,
         diseaseName: "No Skin Detected",
         description: "The AI could not clearly identify human skin. This may be due to lighting, blur, or the object not being skin.",
         symptoms: ["Image blur", "Poor lighting", "Non-skin object"],
         reasons: ["Camera not focused", "Object is too far", "Shadows obscuring details"],
         precautions: ["Use natural lighting", "Hold camera steady", "Focus on the skin area"]
       };
    }

    return result;

  } catch (error: any) {
    console.error("Analysis Failed:", error);
    alert(`Analysis Failed: ${error.message}`);
    return { isSkin: false, isHealthy: false, diseaseName: "Analysis Error", description: error.message } as SkinAnalysis;
  }
};
