import { users, foodEntries, dailyGoals, type User, type InsertUser, type FoodEntry, type InsertFoodEntry, type DailyGoals, type InsertDailyGoals } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Food entries
  createFoodEntry(entry: InsertFoodEntry & { date: string }): Promise<FoodEntry>;
  getFoodEntriesByDate(date: string): Promise<FoodEntry[]>;
  deleteFoodEntry(id: number): Promise<void>;
  
  // Daily goals
  getDailyGoals(): Promise<DailyGoals>;
  updateDailyGoals(goals: InsertDailyGoals): Promise<DailyGoals>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private foodEntries: Map<number, FoodEntry>;
  private dailyGoals: DailyGoals;
  private currentUserId: number;
  private currentFoodEntryId: number;

  constructor() {
    this.users = new Map();
    this.foodEntries = new Map();
    this.currentUserId = 1;
    this.currentFoodEntryId = 1;
    this.dailyGoals = {
      id: 1,
      calories: 2000,
      carbs: 250,
      protein: 120,
      fat: 78,
    };
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createFoodEntry(entry: InsertFoodEntry & { date: string }): Promise<FoodEntry> {
    const id = this.currentFoodEntryId++;
    const foodEntry: FoodEntry = {
      ...entry,
      id,
      timestamp: new Date(),
    };
    this.foodEntries.set(id, foodEntry);
    return foodEntry;
  }

  async getFoodEntriesByDate(date: string): Promise<FoodEntry[]> {
    return Array.from(this.foodEntries.values()).filter(
      (entry) => entry.date === date
    );
  }

  async deleteFoodEntry(id: number): Promise<void> {
    this.foodEntries.delete(id);
  }

  async getDailyGoals(): Promise<DailyGoals> {
    return this.dailyGoals;
  }

  async updateDailyGoals(goals: InsertDailyGoals): Promise<DailyGoals> {
    this.dailyGoals = { ...this.dailyGoals, ...goals };
    return this.dailyGoals;
  }
}

export const storage = new MemStorage();
