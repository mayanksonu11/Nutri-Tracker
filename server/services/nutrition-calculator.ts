import type { CalculateGoalsRequest, NutritionData } from "@shared/schema";

interface CalculatedGoals {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  bmr: number;
  tdee: number;
  weightChangePerWeek: number;
  calorieAdjustment: number;
}

// Activity level multipliers for TDEE calculation
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2, // Little or no exercise
  lightly_active: 1.375, // Light exercise 1-3 days per week
  moderately_active: 1.55, // Moderate exercise 3-5 days per week
  very_active: 1.725, // Hard exercise 6-7 days per week
  extremely_active: 1.9, // Very hard exercise, physical job
};

// Safe weight loss/gain rates (kg per week)
const SAFE_WEIGHT_CHANGE_RATES = {
  maxWeightLossPerWeek: 1.0, // 1kg per week max
  maxWeightGainPerWeek: 0.5, // 0.5kg per week max
  minWeightLossPerWeek: 0.25, // 0.25kg per week min
  minWeightGainPerWeek: 0.25, // 0.25kg per week min
};

/**
 * Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
 */
function calculateBMR(weight: number, height: number, age: number, gender: 'male' | 'female'): number {
  const baseBMR = 10 * weight + 6.25 * height - 5 * age;
  return gender === 'male' ? baseBMR + 5 : baseBMR - 161;
}

/**
 * Calculate Total Daily Energy Expenditure (TDEE)
 */
function calculateTDEE(bmr: number, activityLevel: string): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel as keyof typeof ACTIVITY_MULTIPLIERS] || 1.2;
  return bmr * multiplier;
}

/**
 * Calculate safe weight change rate based on goal and timeframe
 */
function calculateWeightChangeRate(currentWeight: number, targetWeight: number, timeframeMonths: number): number {
  const totalWeightChange = targetWeight - currentWeight;
  const timeframeWeeks = timeframeMonths * 4.33; // Average weeks per month
  const desiredWeeklyChange = totalWeightChange / timeframeWeeks;
  
  const isWeightLoss = totalWeightChange < 0;
  const absDesiredChange = Math.abs(desiredWeeklyChange);
  
  if (isWeightLoss) {
    // Cap weight loss at safe maximum
    const safeWeeklyLoss = Math.min(
      Math.max(absDesiredChange, SAFE_WEIGHT_CHANGE_RATES.minWeightLossPerWeek),
      SAFE_WEIGHT_CHANGE_RATES.maxWeightLossPerWeek
    );
    return -safeWeeklyLoss;
  } else {
    // Cap weight gain at safe maximum
    const safeWeeklyGain = Math.min(
      Math.max(absDesiredChange, SAFE_WEIGHT_CHANGE_RATES.minWeightGainPerWeek),
      SAFE_WEIGHT_CHANGE_RATES.maxWeightGainPerWeek
    );
    return safeWeeklyGain;
  }
}

/**
 * Calculate calorie adjustment needed for weight goal
 * 1kg of body weight ≈ 7700 calories
 */
function calculateCalorieAdjustment(weeklyWeightChange: number): number {
  const caloriesPerKg = 7700;
  const dailyCalorieChange = (weeklyWeightChange * caloriesPerKg) / 7;
  return Math.round(dailyCalorieChange);
}

/**
 * Calculate macronutrient distribution
 */
function calculateMacronutrients(totalCalories: number, targetWeight: number, isWeightLoss: boolean): { carbs: number; protein: number; fat: number } {
  // Protein: 1.6-2.2g per kg of target body weight (higher for weight loss to preserve muscle)
  const proteinPerKg = isWeightLoss ? 2.0 : 1.8;
  const proteinGrams = targetWeight * proteinPerKg;
  const proteinCalories = proteinGrams * 4; // 4 calories per gram of protein
  
  // Fat: 20-35% of total calories (aim for 25-30%)
  const fatPercentage = 0.28;
  const fatCalories = totalCalories * fatPercentage;
  const fatGrams = fatCalories / 9; // 9 calories per gram of fat
  
  // Carbs: Remaining calories
  const remainingCalories = totalCalories - proteinCalories - fatCalories;
  const carbGrams = Math.max(remainingCalories / 4, 0); // 4 calories per gram of carbs
  
  return {
    carbs: Math.round(carbGrams),
    protein: Math.round(proteinGrams),
    fat: Math.round(fatGrams),
  };
}

/**
 * Main function to calculate personalized nutrition goals
 */
export function calculatePersonalizedGoals(request: CalculateGoalsRequest): CalculatedGoals {
  const { age, gender, currentWeight, targetWeight, height, activityLevel, timeframe } = request;
  
  // Calculate BMR
  const bmr = calculateBMR(currentWeight, height, age, gender);
  
  // Calculate TDEE (maintenance calories)
  const tdee = calculateTDEE(bmr, activityLevel);
  
  // Calculate safe weight change rate
  const weeklyWeightChange = calculateWeightChangeRate(currentWeight, targetWeight, timeframe);
  
  // Calculate calorie adjustment
  const calorieAdjustment = calculateCalorieAdjustment(weeklyWeightChange);
  
  // Calculate target calories
  const targetCalories = Math.round(tdee + calorieAdjustment);
  
  // Ensure minimum calorie intake (1200 for women, 1500 for men)
  const minimumCalories = gender === 'female' ? 1200 : 1500;
  const finalCalories = Math.max(targetCalories, minimumCalories);
  
  // Calculate macronutrients
  const isWeightLoss = targetWeight < currentWeight;
  const macros = calculateMacronutrients(finalCalories, targetWeight, isWeightLoss);
  
  return {
    calories: finalCalories,
    carbs: macros.carbs,
    protein: macros.protein,
    fat: macros.fat,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    weightChangePerWeek: Math.round(weeklyWeightChange * 100) / 100,
    calorieAdjustment,
  };
}

/**
 * Get activity level descriptions for the frontend
 */
export const ACTIVITY_DESCRIPTIONS = {
  sedentary: "Little or no exercise (desk job)",
  lightly_active: "Light exercise 1-3 days/week",
  moderately_active: "Moderate exercise 3-5 days/week", 
  very_active: "Hard exercise 6-7 days/week",
  extremely_active: "Very hard exercise + physical job",
};