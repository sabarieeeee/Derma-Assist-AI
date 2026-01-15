import { SkinAnalysis } from "./types";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

// 1. MODEL LIST 
const VISION_MODELS = [
  "meta-llama/llama-3.2-11b-vision-preview",     
  "llama-3.2-90b-vision-preview",
  "llama-guard-3-8b"        
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
            - If "isSkin": false, YOU MUST generate "reasons" explaining why (e.g., "Blurry", "Too dark") and "precautions" on how to take a better photo.

            STEP 1: IDENTIFY CONDITION
            - Identify the specific condition (e.g., "Cystic Acne", "Eczema", "Healthy Skin").
            - If "Healthy Skin", do NOT leave arrays empty. Instead, generate SPECIFIC maintenance advice based on the skin type seen (e.g., oily, dry).

            STEP 2: CONTENT GENERATION (Strict Rule: NO GENERIC TEXT)
            - Every list item must be directly related to the specific condition identified.
            - "symptoms": List visual indicators seen in the image.
            - "reasons": List specific biological or environmental causes for THIS condition.
            - "precautions": List specific "Do's and Don'ts" for THIS condition.
            - "treatments": List medical or home remedies for THIS condition.

            FORMAT:
            - "title": A short, punchy header (2-4 words).
            - "details": A 1-2 line description that explains the 'why' or 'how' specifically for this disease.

            Return ONLY valid JSON. Structure:
            {
              "isSkin": boolean,
              "isHealthy": boolean,
              "diseaseName": "string", 
              "description": "string",
              "symptoms": [{ "title": "string", "details": "string" }],
              "reasons": [{ "title": "string", "details": "string" }],
              "treatments": [{ "title": "string", "details": "string" }],
              "medicines": [{ "title": "string", "details": "string" }],
              "healingPeriod": "string",
              "precautions": [{ "title": "string", "details": "string" }],
              "prevention": [{ "title": "string", "details": "string" }]
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

    // --- REMOVED ALL DEFAULT HARDCODED FALLBACKS --- 
    // The data returned is now purely what the AI generated.

    // Handle Non-Skin Failure Case purely with AI data or minimal error flags
    if (result.isSkin === false) {
       // We still return the object structure, but we rely on the AI's "reasons" from Step 0.
       // If the AI failed to generate reasons for non-skin, we provide a generic error ONLY then.
       if (!result.reasons || result.reasons.length === 0) {
           result.reasons = [{ title: "Scan Failed", details: "The image quality was too low to identify skin." }];
       }
       return {
         ...result,
         isHealthy: false,
         diseaseName: result.diseaseName || "No Skin Detected",
         description: result.description || "The analysis could not identify human skin.",
         // Ensure arrays exist to prevent crashes, but empty is better than fake data
         symptoms: result.symptoms || [],
         treatments: [],
         medicines: [],
         precautions: result.precautions || [],
         prevention: []
       };
    }

    return result;

  } catch (error: any) {
    console.error("Analysis Failed:", error);
    
    return { 
      isSkin: false, 
      isHealthy: false, 
      diseaseName: "Analysis Failed", 
      description: `The AI could not complete the scan. Reason: ${error.message || "Network Error"}.`,
      symptoms: [],
      reasons: [],
      treatments: [],
      medicines: [],
      precautions: [],
      prevention: [],
      healingPeriod: "Unknown"
    } as SkinAnalysis;
  }
};

export const compareProgression = async (img1: string, img2: string): Promise<string> => {
  return "Progression analysis ready.";
};
