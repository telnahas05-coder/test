import { GoogleGenAI } from "@google/genai";

// Declare process to avoid TypeScript errors and handle browser environments where it might be missing
declare var process: any;

/**
 * Helper to get the AI client instance.
 * Initializing lazily prevents top-level crashes if process.env is not ready immediately.
 * Added safety check for 'process' to prevent ReferenceError in browser environments.
 */
const getAiClient = () => {
  const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
  if (!apiKey) {
    console.warn("API Key is missing or process.env is not accessible.");
  }
  return new GoogleGenAI({ apiKey: apiKey });
};

/**
 * Restores, colorizes, or modifies the background of a photo.
 * Uses gemini-2.5-flash-image for high-fidelity photo manipulation.
 */
export const processPhoto = async (
  baseImageBase64: string, 
  prompt: string, 
  theme?: string
): Promise<string> => {
  try {
    const ai = getAiClient();
    let fullPrompt;
    
    if (theme) {
        // Initial generation based on a selected theme/preset
        if (theme === 'Restore & Colorize') {
             fullPrompt = `Act as a professional photo restorer. Task: Restore this image with a focus on NATURAL FACE HEALING.
             1. FACE RECOVERY: Restore facial details to be sharp and high-definition. 
             2. SKIN TEXTURE: CRITICAL - Do NOT make skin look plastic, waxy, or overly smoothed. Preserve natural skin texture, pores, and realistic shading.
             3. FEATURES: Enhance clarity of eyes (iris/pupil) and lips naturally.
             4. DEFECTS: Remove scratches, dust, noise, and blur from faces and clothing.
             5. COLOR: If black and white, colorize with subtle, realistic skin tones and accurate fabric colors.
             Output: High-quality, photorealistic restored image with lifelike, naturally healed faces.`;
        } else if (theme === 'AI Smart Edit') {
             fullPrompt = `Act as a creative art director and expert photo retoucher.
             1. ANALYZE: Look at the people in the photo, their clothes, pose, and expression. Determine the absolute best setting/background.
             2. NATURAL RESTORATION: Heal faces naturally. Remove blur/noise but keep skin texture realistic. Avoid "AI face" look.
             3. COMPOSE: Place them in that perfect setting.
             4. LIGHTING: Match the lighting perfectly to the new background.
             Output: The final best-possible version of this image that looks stunning and authentic.`;
        } else if (theme === 'Passport Photo') {
             fullPrompt = `Act as a STRICT biometric passport photography expert.
             Task: Generate a compliant standard Passport/ID photo from the source image.

             STRICT RULES (ZERO CREATIVITY ALLOWED):
             1. BACKGROUND: MUST be 100% SOLID WHITE. No shadows, no gradients, no patterns.
             2. FACE: Preserving exact identity is #1 priority. Do NOT beautify. Do NOT change features.
             3. POSE: Face must be straight towards the camera. Eyes open, mouth closed (neutral expression).
             4. LIGHTING: Flat, even lighting. NO shadows on the face or background.
             5. ATTIRE: Keep the person's clothing professional. If the original clothing is casual, neaten it up but keep it realistic.
             6. QUALITY: High resolution, sharp focus on the eyes.
             
             NEGATIVE PROMPT constraints: Do not generate a new person. Do not add makeup. Do not use artistic lighting. Do not crop the head too tight.
             
             Output: A formal, official biometric passport photo.`;
        } else if (theme.startsWith('Age:')) {
             const ageTarget = theme.replace('Age: ', '');
             let ageDesc = "";
             if(ageTarget === 'Child') ageDesc = "a child (approx 5-8 years old). Features: larger eyes, softer jawline, smooth skin, youthful innocence";
             if(ageTarget === 'Young') ageDesc = "a young adult (approx 20-25 years old). Features: peak youth, smooth skin, no wrinkles, vibrant look";
             if(ageTarget === 'Middle-aged') ageDesc = "middle-aged (approx 45-50 years old). Features: subtle maturity lines, dignified look, professional aura";
             if(ageTarget === 'Old') ageDesc = "elderly (approx 75+ years old). Features: wrinkles, grey/white hair, realistic skin texture changes, wise look";

             fullPrompt = `Act as a VFX expert in age progression and regression. 
             Task: Transform the person in the photo to look like ${ageDesc}.
             
             CRITICAL RULES:
             1. IDENTITY PRESERVATION: The person must be recognizable. Do NOT swap the face for a different person. Keep the same eye color, basic bone structure, and clothing style.
             2. REALISM: The aging/de-aging must look photorealistic, not cartoony.
             3. RESTORATION: Also remove any scratches or blur from the original photo to ensure the output is high definition.
             4. BACKGROUND: Keep the background same or similar to original, focus on the person.
             Output: A high-quality photorealistic portrait.`;
        } else {
             fullPrompt = `Act as a professional photo editor. Task: Restore the subject and change the background to: ${theme}.
             1. SEGMENTATION: Perfectly preserve the people/subjects in the foreground. Maintain their exact identity, face features, and natural skin texture.
             2. RESTORATION: Heal faces naturally (remove scratches/blur) without altering the person's look or over-smoothing.
             3. BACKGROUND: Replace the original background with a realistic, high-quality ${theme} scene. Ensure lighting on the subject matches the new background (cast shadows, color grading).
             Output: Photorealistic composite image.`;
        }
    } else {
        // Iterative edit mode via Chat
        fullPrompt = `Act as an expert photo editor. Task: Edit the provided image to exactly fulfill this request: "${prompt}".
        
        Strict Editing Guidelines:
        1. PRESERVE IDENTITY: You must NOT change the faces or identity of the people in the photo unless explicitly asked.
        2. NATURAL FACES: If restoring, keep skin texture realistic. Avoid plastic-looking skin.
        3. TARGETED EDITING: Only modify specific elements mentioned.
        4. RESTORATION: Maintain high sharpness and remove noise.
        5. COLORIZATION: If the prompt asks to "colorize", apply realistic colors to a B&W image.
        
        Output: A single high-quality, photorealistic image.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: baseImageBase64
            }
          },
          { text: fullPrompt }
        ]
      }
    });

    // Extract image from response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Error processing photo:", error);
    throw error;
  }
};

/**
 * Chat with Google Search grounding to find photo restoration tips or history.
 */
export const chatWithSearch = async (
  query: string, 
  contextImageBase64?: string
): Promise<{ text: string; sources: Array<{ uri: string; title: string }> }> => {
  try {
    const ai = getAiClient();
    // Add instruction to reply in Persian if the input is Persian or if not specified.
    const parts: any[] = [{ text: `Answer the following user query. If the user writes in Persian, reply in Persian. Query: ${query}` }];
    
    if (contextImageBase64) {
        parts.unshift({
            inlineData: {
                mimeType: 'image/jpeg',
                data: contextImageBase64
            }
        });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "I couldn't find specific information on that.";
    
    // Extract sources from grounding metadata
    const sources: Array<{ uri: string; title: string }> = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({ uri: chunk.web.uri, title: chunk.web.title });
        }
      });
    }

    return { text, sources };
  } catch (error) {
    console.error("Error in chat search:", error);
    throw error;
  }
};