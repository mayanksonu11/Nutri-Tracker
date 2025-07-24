import { users, foodEntries, dailyGoals, userProfile, type User, type InsertUser, type FoodEntry, type InsertFoodEntry, type DailyGoals, type InsertDailyGoals, type UserProfile, type InsertUserProfile } from "@shared/schema";

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
  
  // User profile
  getUserProfile(): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(profile: Partial<InsertUserProfile>): Promise<UserProfile>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private foodEntries: Map<number, FoodEntry>;
  private dailyGoals: DailyGoals;
  private userProfileData: UserProfile | undefined;
  private currentUserId: number;
  private currentFoodEntryId: number;

  constructor() {
    this.users = new Map();
    this.foodEntries = new Map();
    this.currentUserId = 1;
    this.currentFoodEntryId = 1;
    this.userProfileData = undefined;
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

  async getUserProfile(): Promise<UserProfile | undefined> {
    return this.userProfileData;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const userProfile: UserProfile = {
      ...profile,
      id: 1,
      timeframe: profile.timeframe || 6,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userProfileData = userProfile;
    return userProfile;
  }

  async updateUserProfile(profile: Partial<InsertUserProfile>): Promise<UserProfile> {
    if (!this.userProfileData) {
      throw new Error("No user profile exists");
    }
    this.userProfileData = {
      ...this.userProfileData,
      ...profile,
      updatedAt: new Date(),
    };
    return this.userProfileData;
  }
}

export const storage = new MemStorage();
