import type { FoodEntry, DailyGoals } from "@shared/schema";

const STORAGE_KEYS = {
  FOOD_ENTRIES: 'nutritrack_food_entries',
  DAILY_GOALS: 'nutritrack_daily_goals',
} as const;

export interface StoredFoodEntry extends Omit<FoodEntry, 'timestamp'> {
  timestamp: string;
}

export const localStorage = {
  // Food Entries
  getFoodEntries: (date: string): StoredFoodEntry[] => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.FOOD_ENTRIES);
      if (!stored) return [];
      
      const allEntries: StoredFoodEntry[] = JSON.parse(stored);
      return allEntries.filter(entry => entry.date === date);
    } catch {
      return [];
    }
  },

  addFoodEntry: (entry: Omit<FoodEntry, 'id'> & { id?: number }): void => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.FOOD_ENTRIES);
      const allEntries: StoredFoodEntry[] = stored ? JSON.parse(stored) : [];
      
      const newEntry: StoredFoodEntry = {
        ...entry,
        id: entry.id || Date.now(),
        timestamp: new Date().toISOString(),
      };
      
      allEntries.push(newEntry);
      window.localStorage.setItem(STORAGE_KEYS.FOOD_ENTRIES, JSON.stringify(allEntries));
    } catch (error) {
      console.error('Failed to save food entry:', error);
    }
  },

  deleteFoodEntry: (id: number): void => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.FOOD_ENTRIES);
      if (!stored) return;
      
      const allEntries: StoredFoodEntry[] = JSON.parse(stored);
      const filteredEntries = allEntries.filter(entry => entry.id !== id);
      
      window.localStorage.setItem(STORAGE_KEYS.FOOD_ENTRIES, JSON.stringify(filteredEntries));
    } catch (error) {
      console.error('Failed to delete food entry:', error);
    }
  },

  clearFoodEntries: (date: string): void => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.FOOD_ENTRIES);
      if (!stored) return;
      
      const allEntries: StoredFoodEntry[] = JSON.parse(stored);
      const filteredEntries = allEntries.filter(entry => entry.date !== date);
      
      window.localStorage.setItem(STORAGE_KEYS.FOOD_ENTRIES, JSON.stringify(filteredEntries));
    } catch (error) {
      console.error('Failed to clear food entries:', error);
    }
  },

  // Daily Goals
  getDailyGoals: (): DailyGoals => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.DAILY_GOALS);
      if (!stored) {
        return { id: 1, calories: 2000, carbs: 250, protein: 120, fat: 78 };
      }
      return JSON.parse(stored);
    } catch {
      return { id: 1, calories: 2000, carbs: 250, protein: 120, fat: 78 };
    }
  },

  setDailyGoals: (goals: DailyGoals): void => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.DAILY_GOALS, JSON.stringify(goals));
    } catch (error) {
      console.error('Failed to save daily goals:', error);
    }
  },

  // Export data
  exportData: () => {
    try {
      const foodEntries = window.localStorage.getItem(STORAGE_KEYS.FOOD_ENTRIES);
      const dailyGoals = window.localStorage.getItem(STORAGE_KEYS.DAILY_GOALS);
      
      const exportData = {
        foodEntries: foodEntries ? JSON.parse(foodEntries) : [],
        dailyGoals: dailyGoals ? JSON.parse(dailyGoals) : null,
        exportDate: new Date().toISOString(),
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `nutritrack-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  },
};
