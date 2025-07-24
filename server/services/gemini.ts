import { GoogleGenAI } from "@google/genai";
import type { NutritionData } from "@shared/schema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeFoodDescription(description: string): Promise<NutritionData> {
  try {
    const systemPrompt = `You are a nutrition expert. Analyze the food description and provide accurate nutritional information.
    
Please provide the total nutritional values for the described food in JSON format with the following structure:
{
  "calories": number,
  "carbs": number,
  "protein": number,
  "fat": number
}

Values should be:
- calories: total calories as a number
- carbs: carbohydrates in grams as a number
- protein: protein in grams as a number  
- fat: fat in grams as a number

Be as accurate as possible based on standard nutritional data for the foods described.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            calories: { type: "number" },
            carbs: { type: "number" },
            protein: { type: "number" },
            fat: { type: "number" },
          },
          required: ["calories", "carbs", "protein", "fat"],
        },
      },
      contents: description,
    });

    const rawJson = response.text;

    if (rawJson) {
      const data: NutritionData = JSON.parse(rawJson);
      return data;
    } else {
      throw new Error("Empty response from Gemini AI");
    }
  } catch (error) {
    console.error("Failed to analyze food description:", error);
    throw new Error(`Failed to analyze food description: ${error}`);
  }
}
