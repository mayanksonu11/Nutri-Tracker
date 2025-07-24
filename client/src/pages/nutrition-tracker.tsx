import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, subDays, addDays, isToday } from "date-fns";
import { 
  Bell, 
  Settings, 
  Download, 
  Calendar, 
  Utensils, 
  Coffee, 
  Apple, 
  Sparkles, 
  Mic, 
  Plus, 
  Trash2, 
  Flame, 
  Croissant, 
  Ham, 
  Pizza,
  Dumbbell,
  TrendingUp,
  Target,
  Lightbulb,
  Clock,
  Check,
  ChevronLeft,
  ChevronRight,
  Activity,
  Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { analyzeFoodSchema, analyzeExerciseSchema, type FoodEntry, type ExerciseEntry, type DailyGoals, type NutritionData, type UserProfile } from "@shared/schema";
import { cn } from "@/lib/utils";
import ProfileSetup from "@/components/profile-setup";

const NUTRITION_ICONS = {
  calories: Flame,
  carbs: Croissant,
  protein: Ham,
  fat: Pizza,
};

const NUTRITION_COLORS = {
  calories: "bg-orange-500 text-orange-50",
  carbs: "bg-blue-500 text-blue-50", 
  protein: "bg-green-600 text-green-50",
  fat: "bg-yellow-500 text-yellow-50",
};

const NUTRITION_BADGE_COLORS = {
  calories: "bg-orange-100 text-orange-600",
  carbs: "bg-blue-100 text-blue-600",
  protein: "bg-green-100 text-green-600", 
  fat: "bg-yellow-100 text-yellow-600",
};

export default function NutritionTracker() {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingExercise, setIsAnalyzingExercise] = useState(false);
  const [nutritionResult, setNutritionResult] = useState<NutritionData | null>(null);
  const [exerciseResult, setExerciseResult] = useState<{ activity: string; caloriesBurned: number } | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const form = useForm({
    resolver: zodResolver(analyzeFoodSchema),
    defaultValues: {
      description: "",
    },
  });

  const exerciseForm = useForm({
    resolver: zodResolver(analyzeExerciseSchema),
    defaultValues: {
      description: "",
      duration: 30,
    },
  });

  // Get current date string
  const currentDateString = format(currentDate, 'yyyy-MM-dd');
  const isCurrentDateToday = isToday(currentDate);

  // Fetch food entries for current date
  const { data: foodEntries = [], isLoading: entriesLoading } = useQuery<FoodEntry[]>({
    queryKey: ['/api/food/entries', currentDateString],
    queryFn: () => {
      if (isCurrentDateToday) {
        return fetch('/api/food/entries/today').then(res => res.json());
      } else {
        return fetch(`/api/food/entries/${currentDateString}`).then(res => res.json());
      }
    },
  });

  // Fetch exercise entries for current date
  const { data: exerciseEntries = [], isLoading: exerciseEntriesLoading } = useQuery<ExerciseEntry[]>({
    queryKey: ['/api/exercise/entries', currentDateString],
    queryFn: () => {
      if (isCurrentDateToday) {
        return fetch('/api/exercise/entries/today').then(res => res.json());
      } else {
        return fetch(`/api/exercise/entries/${currentDateString}`).then(res => res.json());
      }
    },
  });

  // Fetch daily goals
  const { data: dailyGoals } = useQuery<DailyGoals>({
    queryKey: ['/api/goals'],
  });

  // Fetch user profile
  const { data: userProfile } = useQuery<UserProfile>({
    queryKey: ['/api/profile'],
  });

  // Calculate current totals from food
  const foodTotals = foodEntries.reduce(
    (totals, entry: FoodEntry) => ({
      calories: totals.calories + entry.calories,
      carbs: totals.carbs + entry.carbs,
      protein: totals.protein + entry.protein,
      fat: totals.fat + entry.fat,
    }),
    { calories: 0, carbs: 0, protein: 0, fat: 0 }
  );

  // Calculate total calories burned from exercise
  const totalCaloriesBurned = exerciseEntries.reduce(
    (total, entry: ExerciseEntry) => total + entry.caloriesBurned,
    0
  );

  // Calculate net totals (food calories minus exercise calories)
  const currentTotals = {
    ...foodTotals,
    calories: foodTotals.calories - totalCaloriesBurned,
  };

  // Analyze food mutation
  const analyzeFoodMutation = useMutation({
    mutationFn: async (description: string) => {
      const response = await apiRequest("POST", "/api/food/analyze", { description });
      return response.json();
    },
    onSuccess: (data) => {
      setNutritionResult(data);
      setIsAnalyzing(false);
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze food description",
        variant: "destructive",
      });
    },
  });

  // Add food entry mutation
  const addFoodEntryMutation = useMutation({
    mutationFn: async (data: NutritionData & { description: string }) => {
      const response = await apiRequest("POST", "/api/food/entries", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/food/entries', currentDateString] });
      setNutritionResult(null);
      form.reset();
      toast({
        title: "Food Added Successfully!",
        description: "Your nutrition data has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add food entry",
        variant: "destructive",
      });
    },
  });

  // Delete food entry mutation
  const deleteFoodEntryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/food/entries/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/food/entries', currentDateString] });
      toast({
        title: "Food Entry Deleted",
        description: "The food entry has been removed from your log.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete food entry",
        variant: "destructive",
      });
    },
  });

  // Analyze exercise mutation
  const analyzeExerciseMutation = useMutation({
    mutationFn: async (data: { description: string; duration: number }) => {
      const response = await apiRequest("POST", "/api/exercise/analyze", data);
      return response.json();
    },
    onSuccess: (data) => {
      setExerciseResult(data);
      setIsAnalyzingExercise(false);
    },
    onError: (error) => {
      setIsAnalyzingExercise(false);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze exercise description",
        variant: "destructive",
      });
    },
  });

  // Add exercise entry mutation
  const addExerciseEntryMutation = useMutation({
    mutationFn: async (data: { activity: string; caloriesBurned: number; duration: number }) => {
      const response = await apiRequest("POST", "/api/exercise/entries", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exercise/entries', currentDateString] });
      setExerciseResult(null);
      exerciseForm.reset();
      toast({
        title: "Exercise Added Successfully!",
        description: "Your exercise has been logged.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add exercise entry",
        variant: "destructive",
      });
    },
  });

  // Delete exercise entry mutation
  const deleteExerciseEntryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/exercise/entries/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exercise/entries', currentDateString] });
      toast({
        title: "Exercise Entry Deleted",
        description: "The exercise entry has been removed from your log.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete exercise entry",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: { description: string }) => {
    setIsAnalyzing(true);
    analyzeFoodMutation.mutate(data.description);
  };

  const addToLog = () => {
    if (nutritionResult) {
      addFoodEntryMutation.mutate({
        description: form.getValues().description,
        ...nutritionResult,
      });
    }
  };

  const onExerciseSubmit = async (data: { description: string; duration: number }) => {
    setIsAnalyzingExercise(true);
    analyzeExerciseMutation.mutate(data);
  };

  const addExerciseToLog = () => {
    if (exerciseResult) {
      addExerciseEntryMutation.mutate({
        ...exerciseResult,
        duration: exerciseForm.getValues().duration,
      });
    }
  };

  const deleteEntry = (id: number) => {
    deleteFoodEntryMutation.mutate(id);
  };

  const deleteExerciseEntryHandler = (id: number) => {
    deleteExerciseEntryMutation.mutate(id);
  };

  const clearAll = () => {
    foodEntries.forEach((entry: FoodEntry) => {
      deleteFoodEntryMutation.mutate(entry.id);
    });
  };

  const getProgress = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const getRemaining = (current: number, goal: number) => {
    return Math.max(goal - current, 0);
  };

  // Date navigation functions
  const goToPreviousDay = () => {
    setCurrentDate(subDays(currentDate, 1));
  };

  const goToNextDay = () => {
    setCurrentDate(addDays(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Check if over budget for color coding
  const isOverBudget = dailyGoals && currentTotals.calories > dailyGoals.calories;

  // Show profile setup if no profile exists or if explicitly requested
  if (showProfileSetup || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <ProfileSetup 
          onComplete={() => setShowProfileSetup(false)}
          existingProfile={userProfile}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Utensils className="text-white text-sm" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">NutriTrack</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                <Bell className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setShowProfileSetup(true)}
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header with Date Navigation */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-1">
                {isCurrentDateToday ? "Today's Overview" : "Daily Overview"}
              </h2>
              <p className="text-gray-600">{format(currentDate, "EEEE, MMMM d, yyyy")}</p>
            </div>
            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
              <Button variant="outline" className="text-primary bg-primary/5 border-primary/20 hover:bg-primary/10">
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
              
              {/* Date Navigation */}
              <div className="flex items-center space-x-1 border rounded-lg p-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={goToPreviousDay}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant={isCurrentDateToday ? "default" : "ghost"} 
                  size="sm" 
                  onClick={goToToday}
                  className={cn(
                    "px-3 text-sm font-medium",
                    isOverBudget && isCurrentDateToday ? "bg-red-500 hover:bg-red-600" : "",
                    !isOverBudget && isCurrentDateToday ? "bg-green-500 hover:bg-green-600" : "",
                    !isCurrentDateToday && isOverBudget ? "text-red-600 hover:bg-red-50" : "",
                    !isCurrentDateToday && !isOverBudget ? "text-green-600 hover:bg-green-50" : ""
                  )}
                >
                  {isCurrentDateToday ? "Today" : format(currentDate, "MMM d")}
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={goToNextDay}
                  className="h-8 w-8 p-0"
                  disabled={isCurrentDateToday}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Daily Progress Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {dailyGoals && Object.entries(currentTotals).map(([key, value]) => {
              const nutritionKey = key as keyof typeof currentTotals;
              const Icon = NUTRITION_ICONS[nutritionKey];
              const goal = dailyGoals[nutritionKey];
              const progress = getProgress(value, goal);
              const remaining = getRemaining(value, goal);
              
              return (
                <Card key={key} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", NUTRITION_COLORS[nutritionKey])}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm text-gray-500">
                        {nutritionKey === 'calories' ? 'Daily Goal' : key.charAt(0).toUpperCase() + key.slice(1)}
                      </span>
                    </div>
                    <div className="mb-3">
                      <div className="flex items-baseline space-x-1">
                        <span className="text-2xl font-semibold text-gray-900">
                          {Math.round(value)}
                        </span>
                        <span className="text-gray-500">
                          / {goal}{nutritionKey === 'calories' ? ' kcal' : 'g'}
                        </span>
                      </div>
                    </div>
                    <Progress value={progress} className="mb-2" />
                    <p className="text-sm text-gray-600">
                      {Math.round(remaining)} {nutritionKey === 'calories' ? 'kcal' : 'g'} remaining
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Food Input and Log */}
          <div className="lg:col-span-2">
            {/* Food Input Form */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Add Food Entry</h3>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Describe your food
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., 'I had a grilled chicken breast with steamed broccoli and brown rice for lunch'"
                              className="resize-none"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <p className="text-sm text-gray-500">
                            <Sparkles className="inline mr-1 h-4 w-4" />
                            AI will analyze your description and extract nutritional information
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center space-x-4">
                      <Button 
                        type="submit" 
                        className="flex-1" 
                        disabled={isAnalyzing || !form.watch('description')}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        {isAnalyzing ? 'Analyzing...' : 'Analyze Food'}
                      </Button>
                      <Button type="button" variant="outline" size="icon">
                        <Mic className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </Form>

                {/* Loading State */}
                {isAnalyzing && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
                      <span className="text-blue-700">Analyzing your food with AI...</span>
                    </div>
                  </div>
                )}

                {/* Nutrition Result */}
                {nutritionResult && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-3">
                      <Check className="inline mr-2 h-4 w-4" />
                      Nutrition Analysis Complete
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{Math.round(nutritionResult.calories)}</div>
                        <div className="text-sm text-gray-600">Calories</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{Math.round(nutritionResult.carbs)}g</div>
                        <div className="text-sm text-gray-600">Carbs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{Math.round(nutritionResult.protein)}g</div>
                        <div className="text-sm text-gray-600">Protein</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{Math.round(nutritionResult.fat)}g</div>
                        <div className="text-sm text-gray-600">Fat</div>
                      </div>
                    </div>
                    <Button 
                      onClick={addToLog} 
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={addFoodEntryMutation.isPending}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add to Today's Log
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Food Log */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {isCurrentDateToday ? "Today's Food Log" : `Food Log - ${format(currentDate, "MMM d")}`}
                  </h3>
                  {foodEntries.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAll} className="text-primary hover:text-primary/80">
                      Clear All
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {entriesLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                  ) : foodEntries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Utensils className="mx-auto h-12 w-12 mb-3 opacity-50" />
                      <p>No food entries for {isCurrentDateToday ? 'today' : 'this day'} yet.</p>
                      <p className="text-sm">Start by describing what you ate above!</p>
                    </div>
                  ) : (
                    foodEntries.map((entry: FoodEntry) => {
                      const entryIcon = entry.description.toLowerCase().includes('coffee') ? Coffee :
                                       entry.description.toLowerCase().includes('yogurt') || entry.description.toLowerCase().includes('fruit') ? Apple :
                                       Utensils;
                      const IconComponent = entryIcon;
                      
                      return (
                        <div key={entry.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <IconComponent className="h-5 w-5 text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900 mb-1">
                                  {entry.description}
                                </p>
                                <p className="text-xs text-gray-500">
                                  <Clock className="inline mr-1 h-3 w-3" />
                                  {format(new Date(entry.timestamp), "h:mm a")}
                                </p>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-gray-400 hover:text-red-500"
                                onClick={() => deleteEntry(entry.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className={cn("text-xs px-2 py-1 rounded", NUTRITION_BADGE_COLORS.calories)}>
                                {Math.round(entry.calories)} cal
                              </span>
                              <span className={cn("text-xs px-2 py-1 rounded", NUTRITION_BADGE_COLORS.carbs)}>
                                {Math.round(entry.carbs)}g carbs
                              </span>
                              <span className={cn("text-xs px-2 py-1 rounded", NUTRITION_BADGE_COLORS.protein)}>
                                {Math.round(entry.protein)}g protein
                              </span>
                              <span className={cn("text-xs px-2 py-1 rounded", NUTRITION_BADGE_COLORS.fat)}>
                                {Math.round(entry.fat)}g fat
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Exercise Logging */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-gray-900">Log Exercise</h3>
                </div>

                <Form {...exerciseForm}>
                  <form onSubmit={exerciseForm.handleSubmit(onExerciseSubmit)} className="space-y-4">
                    <FormField
                      control={exerciseForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exercise Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., 30 minute jog in the park, 45 minute weight training session, swimming laps..."
                              className="min-h-[80px] resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={exerciseForm.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="300"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isAnalyzingExercise}
                    >
                      {isAnalyzingExercise ? (
                        <>
                          <Activity className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing Exercise...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Analyze Exercise
                        </>
                      )}
                    </Button>
                  </form>
                </Form>

                {/* Exercise Analysis Result */}
                {exerciseResult && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <Activity className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-900">{exerciseResult.activity}</h4>
                        <p className="text-sm text-green-700">
                          {exerciseResult.caloriesBurned} calories burned
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={addExerciseToLog} 
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={addExerciseEntryMutation.isPending}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add to Exercise Log
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Exercise Log */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Exercise Log</h3>
                  {exerciseEntries.length > 0 && (
                    <span className="text-sm text-gray-500">
                      {totalCaloriesBurned} calories burned
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {exerciseEntriesLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                  ) : exerciseEntries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Dumbbell className="mx-auto h-12 w-12 mb-3 opacity-50" />
                      <p>No exercise entries for {isCurrentDateToday ? 'today' : 'this day'} yet.</p>
                      <p className="text-sm">Log your workout above!</p>
                    </div>
                  ) : (
                    exerciseEntries.map((entry: ExerciseEntry) => (
                      <div key={entry.id} className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Activity className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900 mb-1">
                                {entry.activity}
                              </p>
                              <p className="text-xs text-gray-500">
                                <Timer className="inline mr-1 h-3 w-3" />
                                {entry.duration} minutes • {format(new Date(entry.timestamp), "h:mm a")}
                              </p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-gray-400 hover:text-red-500"
                              onClick={() => deleteExerciseEntryHandler(entry.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-600">
                              -{entry.caloriesBurned} cal
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Quick Actions */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-between text-primary bg-primary/5 border-primary/20 hover:bg-primary/10">
                    <div className="flex items-center space-x-3">
                      <Dumbbell className="h-4 w-4" />
                      <span className="font-medium">Log Exercise</span>
                    </div>
                    <span className="text-sm">→</span>
                  </Button>
                  <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-medium">View Trends</span>
                    </div>
                    <span className="text-sm">→</span>
                  </Button>
                  <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center space-x-3">
                      <Target className="h-4 w-4" />
                      <span className="font-medium">Set Goals</span>
                    </div>
                    <span className="text-sm">→</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Progress */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Average</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Daily Calories</span>
                    <span className="font-semibold text-gray-900">1,923</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Protein Goal</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-green-600">89%</span>
                      <Progress value={89} className="w-16" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Carbs Goal</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-blue-600">76%</span>
                      <Progress value={76} className="w-16" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Fats Goal</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-yellow-600">82%</span>
                      <Progress value={82} className="w-16" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Insights Card */}
            <Card className="bg-gradient-to-br from-primary/5 to-green-50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                    <Lightbulb className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Today's Insight</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  You're doing great with protein intake! Consider adding more fiber-rich vegetables to support digestion and increase satiety.
                </p>
                <div className="flex items-center text-sm text-primary">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  <span>Powered by AI Analysis</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button size="icon" className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl">
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
