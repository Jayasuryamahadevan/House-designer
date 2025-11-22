
import { GoogleGenAI, Type } from "@google/genai";
import { VendorProduct, AIResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getDesignAdvice = async (
  userPrompt: string, 
  currentMaterials?: Record<string, VendorProduct>
): Promise<AIResponse> => {
  try {
    const model = 'gemini-2.5-flash';
    
    // Construct context string from applied materials
    let contextDescription = "The user has currently designed their room with: ";
    if (currentMaterials && Object.keys(currentMaterials).length > 0) {
      const materials = Object.values(currentMaterials);
      const materialList = materials.map(m => `${m.name} (${m.category}) by ${m.vendor}`).join(', ');
      contextDescription += materialList + ".";
    } else {
      contextDescription += "No materials applied yet.";
    }

    const systemInstruction = `You are an expert interior and exterior home designer assisting with a 3D Home Designer app.
    
    Context: ${contextDescription}

    The 3D House Model has the following zones:
    1. Exterior: The outer facade of the villa.
    2. Interior: Distinct rooms including Living Room, Kitchen, Dining, Master Bedroom, and Bathroom.

    Your Goal: Answer design questions and perform actions.
    
    CRITICALLY:
    - Distinguish between "Outside" (Exterior) and "Inside" (Interior).
    - If user says "Paint the outside white", use 'exterior_walls'.
    - If user says "Paint the inside warm grey", use 'interior_walls'.
    - If user specifies a room (e.g., "Living room walls"), use specific targets like 'living_walls'.
    - Always return a valid Hex Code for colors.

    Available Targets:
    - 'exterior_walls' (Facade, outer shell)
    - 'interior_walls' (Partition walls, inner dividers)
    - 'all_walls', 'all_floors'
    - 'living_walls', 'living_floor'
    - 'kitchen_walls', 'kitchen_floor', 'kitchen_island'
    - 'dining_walls', 'dining_floor'
    - 'bed_walls', 'bed_floor', 'bed_furniture'
    - 'bath_walls', 'bath_floor'
    - 'sofa', 'stairs'

    Output Format: JSON
    {
      "message": "Conversational response...",
      "actions": [
        { "target": "exterior_walls", "hexColor": "#FFFFFF", "explanation": "Modern White Facade" }
      ]
    }
    `;

    const response = await ai.models.generateContent({
      model,
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING },
            actions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  target: { 
                    type: Type.STRING, 
                    enum: [
                      'all_walls', 'all_floors',
                      'exterior_walls', 'interior_walls',
                      'living_walls', 'living_floor',
                      'kitchen_walls', 'kitchen_floor', 'kitchen_island',
                      'dining_walls', 'dining_floor',
                      'bed_walls', 'bed_floor', 'bed_furniture',
                      'bath_walls', 'bath_floor',
                      'sofa', 'stairs'
                    ] 
                  },
                  hexColor: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["target", "hexColor"]
              }
            }
          },
          required: ["message"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    
    return JSON.parse(text) as AIResponse;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      message: "I'm having trouble connecting to the design engine right now. Please try again."
    };
  }
};
