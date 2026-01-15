import { SkinAnalysis } from "./types";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

// 1. UPDATED MODEL LIST (Prioritize Llama 4 Scout)
const VISION_MODELS = [
  "llama-3.2-90b-vision-preview",
  "meta-llama/llama-4-scout-17b-16e-instruct",   // Best for logic & vision
  "llama-3.2-11b-vision-preview"       // Weak backup
];

// 2. HELPER: Compress Image to prevent API Errors (Max 4MB)
async function compressImage(base64Str: string, maxWidth = 1024, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str.startsWith("data:") ? base64Str : `data:image/jpeg;base64,${base64Str}`;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // Resize logic
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
    img.onerror = () => resolve(base64Str); // Return original if fail
  });
}

// 3. API CALL LOOP (Handles Retries)
async function tryGroqAnalysis(payload: any) {
  let lastError = null;

  for (const modelName of VISION_MODELS) {
    try {
      console.log(`Trying model: ${modelName}...`);
      const currentPayload = { ...payload, model: modelName };

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(currentPayload)
      });

      if (!response.ok) {
        const errText = await response.text();
        // Check for Account Ban/Invalid Key immediately
        if (response.status === 401 || response.status === 403) {
           throw new Error("CRITICAL: API Key Restricted or Invalid.");
        }
        // If Model Not Found (404) or Bad Request (400), try next model
        if (response.status === 400 || response.status === 404) {
          console.warn(`Model ${modelName} failed: ${errText}`);
          continue; 
        }
        throw new Error(`Groq Error (${response.status}): ${errText}`);
      }

      return await response.json();
    } catch (e: any) {
      lastError = e;
      if (e.message.includes("API Key")) throw e; // Stop if key is dead
    }
  }
  throw lastError;
}

export const analyzeSkinImage = async (base64Image: string): Promise<SkinAnalysis> => {
  if (!GROQ_API_KEY) {
    alert("CRITICAL: Groq API Key is missing.");
    return { isSkin: false, isHealthy: false, diseaseName: "Error", description: "Key Missing" } as SkinAnalysis;
  }

  // COMPRESS BEFORE SENDING
  const compressedImage = await compressImage(base64Image);

  try {
    const payload = {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `You are a professional dermatologist.
            
            STEP 0: IS THIS HUMAN SKIN? 
            - If the image shows a wall, fabric, object, blurred mess, or face with no clear skin details, return "isSkin": false.
            - If it is clearly human skin, proceed to Step 1.

            STEP 1: Check for REAL abnormalities (rashes, lesions, severe acne, infections).
            STEP 2: Ignore normal features like pores, slight texture, goosebumps, or small harmless moles.
            STEP 3: If the skin looks generally normal, you MUST classify it as:
            "isHealthy": true
            "diseaseName": "Healthy Skin"

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

    // LOGIC FIX: Handle Non-Skin Results specifically
    if (result.isSkin === false) {
       // Alert the user as requested
       alert("Analysis Warning: No human skin detected in this image.");
       
       return {
         ...result,
         isHealthy: false,
         diseaseName: "No Skin Detected",
         description: "The AI could not identify human skin texture in this image. Please upload a clear, close-up photo of the affected area."
       };
    }

    return result;

  } catch (error: any) {
    console.error("Analysis Failed:", error);
    alert(`Analysis Failed: ${error.message}`);
    return { isSkin: false, isHealthy: false, diseaseName: "Analysis Error", description: error.message } as SkinAnalysis;
  }
};

export const compareProgression = async (img1: string, img2: string): Promise<string> => {
  return "Progression analysis is currently simplified for this demo.";
};
