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

export const analyzeFoodSchema = z.object({
  description: z.string().min(1, "Food description is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type FoodEntry = typeof foodEntries.$inferSelect;
export type InsertFoodEntry = z.infer<typeof insertFoodEntrySchema>;
export type DailyGoals = typeof dailyGoals.$inferSelect;
export type InsertDailyGoals = z.infer<typeof insertDailyGoalsSchema>;
export type AnalyzeFoodRequest = z.infer<typeof analyzeFoodSchema>;

export interface NutritionData {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}
