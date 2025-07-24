import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeFoodSchema, insertFoodEntrySchema, insertDailyGoalsSchema, insertUserProfileSchema, calculateGoalsSchema, analyzeExerciseSchema, insertExerciseEntrySchema } from "@shared/schema";
import { analyzeFoodDescription } from "./services/gemini";
import { calculatePersonalizedGoals } from "./services/nutrition-calculator";
import { analyzeExerciseDescription } from "./services/exercise-calculator";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Analyze food description using Gemini AI
  app.post("/api/food/analyze", async (req, res) => {
    try {
      const { description } = analyzeFoodSchema.parse(req.body);
      const nutritionData = await analyzeFoodDescription(description);
      res.json(nutritionData);
    } catch (error) {
      console.error("Error analyzing food:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to analyze food description" 
      });
    }
  });

  // Add food entry
  app.post("/api/food/entries", async (req, res) => {
    try {
      const entryData = insertFoodEntrySchema.parse(req.body);
      const today = new Date().toISOString().split('T')[0];
      const entry = await storage.createFoodEntry({
        ...entryData,
        date: today,
      });
      res.json(entry);
    } catch (error) {
      console.error("Error creating food entry:", error);
      res.status(500).json({ message: "Failed to create food entry" });
    }
  });

  // Get food entries for today
  app.get("/api/food/entries/today", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const entries = await storage.getFoodEntriesByDate(today);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching food entries:", error);
      res.status(500).json({ message: "Failed to fetch food entries" });
    }
  });

  // Get food entries for specific date
  app.get("/api/food/entries/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const entries = await storage.getFoodEntriesByDate(date);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching food entries:", error);
      res.status(500).json({ message: "Failed to fetch food entries" });
    }
  });

  // Delete food entry
  app.delete("/api/food/entries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFoodEntry(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting food entry:", error);
      res.status(500).json({ message: "Failed to delete food entry" });
    }
  });

  // Get daily goals
  app.get("/api/goals", async (req, res) => {
    try {
      const goals = await storage.getDailyGoals();
      res.json(goals);
    } catch (error) {
      console.error("Error fetching daily goals:", error);
      res.status(500).json({ message: "Failed to fetch daily goals" });
    }
  });

  // Update daily goals
  app.put("/api/goals", async (req, res) => {
    try {
      const goalsData = insertDailyGoalsSchema.parse(req.body);
      const goals = await storage.updateDailyGoals(goalsData);
      res.json(goals);
    } catch (error) {
      console.error("Error updating daily goals:", error);
      res.status(500).json({ message: "Failed to update daily goals" });
    }
  });

  // Get user profile
  app.get("/api/profile", async (req, res) => {
    try {
      const profile = await storage.getUserProfile();
      res.json(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Create or update user profile
  app.post("/api/profile", async (req, res) => {
    try {
      const profileData = insertUserProfileSchema.parse(req.body);
      const existingProfile = await storage.getUserProfile();
      
      let profile;
      if (existingProfile) {
        profile = await storage.updateUserProfile(profileData);
      } else {
        profile = await storage.createUserProfile(profileData);
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error saving user profile:", error);
      res.status(500).json({ message: "Failed to save user profile" });
    }
  });

  // Calculate personalized nutrition goals
  app.post("/api/calculate-goals", async (req, res) => {
    try {
      const requestData = calculateGoalsSchema.parse(req.body);
      const calculatedGoals = calculatePersonalizedGoals(requestData);
      
      // Update daily goals with calculated values
      await storage.updateDailyGoals({
        calories: calculatedGoals.calories,
        carbs: calculatedGoals.carbs,
        protein: calculatedGoals.protein,
        fat: calculatedGoals.fat,
      });
      
      res.json(calculatedGoals);
    } catch (error) {
      console.error("Error calculating goals:", error);
      res.status(500).json({ message: "Failed to calculate nutrition goals" });
    }
  });

  // Analyze exercise description using Gemini AI
  app.post("/api/exercise/analyze", async (req, res) => {
    try {
      const { description } = analyzeExerciseSchema.parse(req.body);
      const profile = await storage.getUserProfile();
      const weight = profile?.currentWeight || 70; // Default to 70kg if no profile
      
      const exerciseData = await analyzeExerciseDescription(description, weight);
      res.json(exerciseData);
    } catch (error) {
      console.error("Error analyzing exercise:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to analyze exercise description" 
      });
    }
  });

  // Add exercise entry
  app.post("/api/exercise/entries", async (req, res) => {
    try {
      const entryData = insertExerciseEntrySchema.parse(req.body);
      const today = new Date().toISOString().split('T')[0];
      const entry = await storage.createExerciseEntry({
        ...entryData,
        date: today,
      });
      res.json(entry);
    } catch (error) {
      console.error("Error creating exercise entry:", error);
      res.status(500).json({ message: "Failed to create exercise entry" });
    }
  });

  // Get exercise entries for today
  app.get("/api/exercise/entries/today", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const entries = await storage.getExerciseEntriesByDate(today);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching exercise entries:", error);
      res.status(500).json({ message: "Failed to fetch exercise entries" });
    }
  });

  // Get exercise entries for specific date
  app.get("/api/exercise/entries/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const entries = await storage.getExerciseEntriesByDate(date);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching exercise entries:", error);
      res.status(500).json({ message: "Failed to fetch exercise entries" });
    }
  });

  // Delete exercise entry
  app.delete("/api/exercise/entries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteExerciseEntry(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting exercise entry:", error);
      res.status(500).json({ message: "Failed to delete exercise entry" });
    }
  });

  // Get daily summary for a specific date
  app.get("/api/daily-summary/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const summary = await storage.getDailySummary(date);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching daily summary:", error);
      res.status(500).json({ message: "Failed to fetch daily summary" });
    }
  });

  // Get available dates in a range
  app.get("/api/dates", async (req, res) => {
    try {
      const { start, end } = req.query;
      const startDate = start as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = end as string || new Date().toISOString().split('T')[0];
      
      const dates = await storage.getDateRange(startDate, endDate);
      res.json(dates);
    } catch (error) {
      console.error("Error fetching date range:", error);
      res.status(500).json({ message: "Failed to fetch date range" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
