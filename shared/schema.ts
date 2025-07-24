import { pgTable, text, serial, integer, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const foodEntries = pgTable("food_entries", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  calories: real("calories").notNull(),
  carbs: real("carbs").notNull(),
  protein: real("protein").notNull(),
  fat: real("fat").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  date: text("date").notNull(), // YYYY-MM-DD format
});

export const dailyGoals = pgTable("daily_goals", {
  id: serial("id").primaryKey(),
  calories: real("calories").notNull().default(2000),
  carbs: real("carbs").notNull().default(250),
  protein: real("protein").notNull().default(120),
  fat: real("fat").notNull().default(78),
});

export const userProfile = pgTable("user_profile", {
  id: serial("id").primaryKey(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(), // 'male' or 'female'
  currentWeight: real("current_weight").notNull(), // in kg
  targetWeight: real("target_weight").notNull(), // in kg
  height: real("height").notNull(), // in cm
  activityLevel: text("activity_level").notNull(), // 'sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'
  timeframe: integer("timeframe").notNull().default(6), // months to reach goal
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const exerciseEntries = pgTable("exercise_entries", {
  id: serial("id").primaryKey(),
  activity: text("activity").notNull(),
  caloriesBurned: real("calories_burned").notNull(),
  duration: integer("duration").notNull(), // in minutes
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  date: text("date").notNull(), // YYYY-MM-DD format
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFoodEntrySchema = createInsertSchema(foodEntries).omit({
  id: true,
  timestamp: true,
  date: true,
});

export const insertDailyGoalsSchema = createInsertSchema(dailyGoals).omit({
  id: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfile).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExerciseEntrySchema = createInsertSchema(exerciseEntries).omit({
  id: true,
  timestamp: true,
  date: true,
});

export const analyzeFoodSchema = z.object({
  description: z.string().min(1, "Food description is required"),
});

export const analyzeExerciseSchema = z.object({
  description: z.string().min(1, "Exercise description is required"),
});

export const calculateGoalsSchema = z.object({
  age: z.number().min(1).max(120),
  gender: z.enum(['male', 'female']),
  currentWeight: z.number().min(1).max(500),
  targetWeight: z.number().min(1).max(500),
  height: z.number().min(50).max(300),
  activityLevel: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active']),
  timeframe: z.number().min(1).max(24),
});

export const manualGoalsSchema = z.object({
  calories: z.number().min(800).max(10000, "Calories must be between 800 and 10000"),
  carbs: z.number().min(20).max(1000, "Carbs must be between 20 and 1000 grams"),
  protein: z.number().min(20).max(500, "Protein must be between 20 and 500 grams"),
  fat: z.number().min(20).max(300, "Fat must be between 20 and 300 grams"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type FoodEntry = typeof foodEntries.$inferSelect;
export type InsertFoodEntry = z.infer<typeof insertFoodEntrySchema>;
export type ExerciseEntry = typeof exerciseEntries.$inferSelect;
export type InsertExerciseEntry = z.infer<typeof insertExerciseEntrySchema>;
export type DailyGoals = typeof dailyGoals.$inferSelect;
export type InsertDailyGoals = z.infer<typeof insertDailyGoalsSchema>;
export type UserProfile = typeof userProfile.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type AnalyzeFoodRequest = z.infer<typeof analyzeFoodSchema>;
export type AnalyzeExerciseRequest = z.infer<typeof analyzeExerciseSchema>;
export type CalculateGoalsRequest = z.infer<typeof calculateGoalsSchema>;
export type ManualGoalsRequest = z.infer<typeof manualGoalsSchema>;

export interface NutritionData {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}
