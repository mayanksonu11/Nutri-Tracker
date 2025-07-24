import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface ExerciseCalorieData {
  caloriesBurned: number;
  exerciseType: string;
  intensity: string;
}

export async function analyzeExerciseDescription(description: string, duration: number, weight: number = 70): Promise<ExerciseCalorieData> {
  try {
    const systemPrompt = `You are a fitness expert. Analyze the exercise description and calculate calories burned.

Please provide the exercise analysis in JSON format with the following structure:
{
  "caloriesBurned": number,
  "exerciseType": string,
  "intensity": string
}

Calculate calories burned based on:
- Exercise description: "${description}"
- Duration: ${duration} minutes
- Body weight: ${weight} kg (if not specified, assume 70kg)

Values should be:
- caloriesBurned: total calories burned as a number (be realistic based on exercise type, intensity, and duration)
- exerciseType: simplified exercise category (e.g., "Running", "Weight Training", "Cycling", "Swimming", "Walking")
- intensity: intensity level ("Low", "Moderate", "High", "Very High")

Use standard MET (Metabolic Equivalent) values for accuracy:
- Walking (3 mph): 3.5 METs
- Running (6 mph): 10 METs
- Cycling (moderate): 8 METs
- Swimming: 8-11 METs
- Weight training: 6 METs
- Yoga: 3 METs

Formula: Calories = METs × weight(kg) × duration(hours)`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            caloriesBurned: { type: "number" },
            exerciseType: { type: "string" },
            intensity: { type: "string" },
          },
          required: ["caloriesBurned", "exerciseType", "intensity"],
        },
      },
      contents: `Analyze this exercise: ${description} for ${duration} minutes`,
    });

    const rawJson = response.text;

    if (rawJson) {
      const data: ExerciseCalorieData = JSON.parse(rawJson);
      return data;
    } else {
      throw new Error("Empty response from Gemini AI");
    }
  } catch (error) {
    console.error("Failed to analyze exercise description:", error);
    throw new Error(`Failed to analyze exercise description: ${error}`);
  }
}

// Common exercise MET values for fallback calculations
export const EXERCISE_METS = {
  walking: 3.5,
  jogging: 7,
  running: 10,
  cycling: 8,
  swimming: 8,
  weightlifting: 6,
  yoga: 3,
  dancing: 4.5,
  basketball: 8,
  soccer: 7,
  tennis: 7,
  hiking: 6,
} as const;

export function calculateCaloriesFromMET(met: number, weightKg: number, durationMinutes: number): number {
  const durationHours = durationMinutes / 60;
  return Math.round(met * weightKg * durationHours);
}