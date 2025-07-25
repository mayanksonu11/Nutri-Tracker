import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { User, Settings, Calculator, Target, Activity, Calendar, Weight, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { localStorage as localStore } from "@/lib/localStorage";
import { calculateGoalsSchema, type CalculateGoalsRequest, type UserProfile } from "@shared/schema";

interface ProfileSetupProps {
  onComplete: () => void;
  existingProfile?: UserProfile;
}

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary', description: 'Little or no exercise (desk job)' },
  { value: 'lightly_active', label: 'Lightly Active', description: 'Light exercise 1-3 days/week' },
  { value: 'moderately_active', label: 'Moderately Active', description: 'Moderate exercise 3-5 days/week' },
  { value: 'very_active', label: 'Very Active', description: 'Hard exercise 6-7 days/week' },
  { value: 'extremely_active', label: 'Extremely Active', description: 'Very hard exercise + physical job' },
];

export default function ProfileSetup({ onComplete, existingProfile }: ProfileSetupProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [calculatedResults, setCalculatedResults] = useState<any>(null);

  const form = useForm<CalculateGoalsRequest>({
    resolver: zodResolver(calculateGoalsSchema),
    defaultValues: existingProfile ? {
      age: existingProfile.age,
      gender: existingProfile.gender as 'male' | 'female',
      currentWeight: existingProfile.currentWeight,
      targetWeight: existingProfile.targetWeight,
      height: existingProfile.height,
      activityLevel: existingProfile.activityLevel as any,
      timeframe: existingProfile.timeframe,
    } : {
      age: 25,
      gender: 'male',
      currentWeight: 70,
      targetWeight: 70,
      height: 170,
      activityLevel: 'moderately_active',
      timeframe: 6,
    },
  });

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async (data: CalculateGoalsRequest) => {
      const profile: UserProfile = {
        id: 1,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      localStore.setUserProfile(profile);
      return Promise.resolve(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save profile",
        variant: "destructive",
      });
    },
  });

  // Calculate goals mutation
  const calculateGoalsMutation = useMutation({
    mutationFn: async (data: CalculateGoalsRequest) => {
      const response = await apiRequest("POST", "/api/calculate-goals", data);
      const results = await response.json();
      
      // Save calculated goals to localStorage
      localStore.setDailyGoals({
        id: 1,
        calories: results.calories,
        carbs: results.carbs,
        protein: results.protein,
        fat: results.fat,
      });
      
      return results;
    },
    onSuccess: (data) => {
      setCalculatedResults(data);
      queryClient.invalidateQueries({ queryKey: ['daily-goals'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to calculate goals",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: CalculateGoalsRequest) => {
    if (step === 1) {
      setStep(2);
      return;
    }

    try {
      // Save profile and calculate goals
      await saveProfileMutation.mutateAsync(data);
      await calculateGoalsMutation.mutateAsync(data);
      
      toast({
        title: "Profile Saved Successfully!",
        description: "Your personalized nutrition goals have been calculated.",
      });
      
      setStep(3);
    } catch (error) {
      // Error handling is done in mutations
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  const getGoalType = () => {
    const current = form.watch('currentWeight');
    const target = form.watch('targetWeight');
    if (target > current) return 'gain';
    if (target < current) return 'lose';
    return 'maintain';
  };

  const getWeightDifference = () => {
    const current = form.watch('currentWeight');
    const target = form.watch('targetWeight');
    return Math.abs(target - current);
  };

  if (step === 3 && calculatedResults) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-green-600">
            <Target className="h-6 w-6" />
            Your Personalized Goals Are Ready!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{calculatedResults.calories}</div>
              <div className="text-sm text-blue-700">Daily Calories</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{calculatedResults.protein}g</div>
              <div className="text-sm text-green-700">Protein</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{calculatedResults.carbs}g</div>
              <div className="text-sm text-orange-700">Carbs</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{calculatedResults.fat}g</div>
              <div className="text-sm text-yellow-700">Fat</div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Calculation Details:</h3>
            <div className="text-sm space-y-1">
              <div>BMR: {calculatedResults.bmr} calories</div>
              <div>TDEE: {calculatedResults.tdee} calories</div>
              <div>Weekly Weight Change: {calculatedResults.weightChangePerWeek}kg</div>
              <div>Daily Calorie Adjustment: {calculatedResults.calorieAdjustment > 0 ? '+' : ''}{calculatedResults.calorieAdjustment} calories</div>
            </div>
          </div>

          <Button onClick={handleComplete} className="w-full" size="lg">
            Start Tracking Your Nutrition
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <User className="h-6 w-6" />
          {existingProfile ? 'Update Your Profile' : 'Set Up Your Profile'}
        </CardTitle>
        <p className="text-gray-600">
          {step === 1 
            ? "Tell us about yourself to get personalized nutrition goals"
            : "Review your information and calculate your goals"
          }
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Age
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="25" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="currentWeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Weight className="h-4 w-4" />
                          Current Weight (kg)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1"
                            placeholder="70" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetWeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Target Weight (kg)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1"
                            placeholder="65" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Ruler className="h-4 w-4" />
                          Height (cm)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="170" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="activityLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Activity Level
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your activity level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ACTIVITY_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              <div>
                                <div className="font-medium">{level.label}</div>
                                <div className="text-sm text-gray-600">{level.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeframe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timeframe to Reach Goal (months)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          max="24"
                          placeholder="6" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Recommended: 3-12 months for sustainable results
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Review Your Information</h3>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Age:</strong> {form.watch('age')} years</div>
                    <div><strong>Gender:</strong> {form.watch('gender')}</div>
                    <div><strong>Current Weight:</strong> {form.watch('currentWeight')} kg</div>
                    <div><strong>Target Weight:</strong> {form.watch('targetWeight')} kg</div>
                    <div><strong>Height:</strong> {form.watch('height')} cm</div>
                    <div><strong>Timeframe:</strong> {form.watch('timeframe')} months</div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div><strong>Activity Level:</strong> {ACTIVITY_LEVELS.find(l => l.value === form.watch('activityLevel'))?.label}</div>
                    <div className="text-sm text-gray-600">{ACTIVITY_LEVELS.find(l => l.value === form.watch('activityLevel'))?.description}</div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Your Goal</h4>
                  <p className="text-blue-700">
                    {getGoalType() === 'lose' && `Lose ${getWeightDifference()}kg in ${form.watch('timeframe')} months`}
                    {getGoalType() === 'gain' && `Gain ${getWeightDifference()}kg in ${form.watch('timeframe')} months`}
                    {getGoalType() === 'maintain' && `Maintain current weight of ${form.watch('currentWeight')}kg`}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              {step === 2 && (
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
              )}
              <Button 
                type="submit" 
                className="flex-1"
                disabled={saveProfileMutation.isPending || calculateGoalsMutation.isPending}
              >
                {step === 1 ? (
                  'Continue'
                ) : (
                  <>
                    <Calculator className="mr-2 h-4 w-4" />
                    {saveProfileMutation.isPending || calculateGoalsMutation.isPending ? 'Calculating...' : 'Calculate My Goals'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}