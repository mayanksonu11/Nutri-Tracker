import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeFoodSchema, insertFoodEntrySchema, insertDailyGoalsSchema } from "@shared/schema";
import { analyzeFoodDescription } from "./services/gemini";

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

  const httpServer = createServer(app);
  return httpServer;
}
