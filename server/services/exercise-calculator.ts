import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface ExerciseAnalysisData {
  activity: string;
  caloriesBurned: number;
  duration: number;
}

export async function analyzeExerciseDescription(description: string, weight: number = 70): Promise<ExerciseAnalysisData> {
  try {
    const systemPrompt = `You are a fitness expert who analyzes exercise descriptions and determines both duration and calories burned.

Given an exercise description and user's weight in kg, determine:
1. The most likely duration for this exercise session (in minutes)
2. Calculate calories burned using standard METs values

Use standard METs (Metabolic Equivalent of Task) values for accurate calculations:
- Formula: Calories = METs × weight(kg) × duration(hours)

Common MET values and typical durations:
- Walking (3 mph): 3.5 METs, typical 30-60 min
- Running (6 mph): 10 METs, typical 20-45 min
- Cycling (moderate): 8 METs, typical 30-60 min
- Swimming: 8 METs, typical 30-45 min
- Weight training: 6 METs, typical 45-60 min
- Yoga: 3 METs, typical 60-90 min
- Basketball: 8 METs, typical 30-60 min
- Soccer: 7 METs, typical 60-90 min
- HIIT workout: 8 METs, typical 20-30 min
- Pilates: 3 METs, typical 45-60 min

Estimate realistic duration based on:
- Type of exercise (cardio vs strength vs flexibility)
- Intensity mentioned in description
- Common workout patterns
- Context clues in the description

Respond with JSON in this exact format:
{
  "activity": "brief descriptive name of the activity",
  "duration": number_in_minutes,
  "caloriesBurned": number
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            activity: { type: "string" },
            duration: { type: "number" },
            caloriesBurned: { type: "number" },
          },
          required: ["activity", "duration", "caloriesBurned"],
        },
      },
      contents: `Exercise: ${description}\nUser weight: ${weight} kg\n\nAnalyze this exercise, estimate realistic duration, and calculate calories burned.`,
    });

    const rawJson = response.text;

    if (rawJson) {
      const data: ExerciseAnalysisData = JSON.parse(rawJson);
      return {
        activity: data.activity,
        duration: Math.round(data.duration),
        caloriesBurned: Math.round(data.caloriesBurned),
      };
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