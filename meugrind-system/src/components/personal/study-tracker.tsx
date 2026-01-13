'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  personalDashboardService, 
  StudyCategory, 
  StudyProgress 
} from '../../lib/personal-dashboard-service';
import { useAuth } from '../../hooks/use-auth';
import { 
  BookOpen, 
  Clock, 
  TrendingUp, 
  Target, 
  Flame, 
  Plus, 
  Calendar,
  BarChart3,
  Trophy,
  Timer
} from 'lucide-react';

interface StudyTrackerProps {
  className?: string;
}

export function StudyTracker({ className }: StudyTrackerProps) {
  const { isPersonal } = useAuth();
  const [categories] = useState<StudyCategory[]>(personalDashboardService.getStudyCategories());
  const [progress, setProgress] = useState<StudyProgress[]>([]);
  const [statistics, setStatistics] = useState({
    totalHours: 0,
    categoriesStudied: 0,
    longestStreak: 0,
    thisWeekHours: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLogging, setIsLogging] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);

  // Form state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [studyMinutes, setStudyMinutes] = useState('');
  const [studyNotes, setStudyNotes] = useState('');
  const [studyResources, setStudyResources] = useState('');

  useEffect(() => {
    if (isPersonal()) {
      loadStudyData();
    }
  }, [isPersonal]);

  const loadStudyData = async () => {
    try {
      setIsLoading(true);
      const [progressData, statsData] = await Promise.all([
        personalDashboardService.getStudyProgress(),
        personalDashboardService.getStudyStatistics(),
      ]);
      setProgress(progressData);
      setStatistics(statsData);
    } catch (error) {
      console.error('Failed to load study data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogStudy = async () => {
    if (!selectedCategory || !studyMinutes) return;

    try {
      setIsLogging(true);
      const minutes = parseInt(studyMinutes);
      const resources = studyResources.split('\n').filter(r => r.trim());
      
      await personalDashboardService.logStudyTime(
        selectedCategory,
        selectedSubcategory || undefined,
        minutes,
        studyNotes || undefined,
        resources.length > 0 ? resources : undefined
      );

      // Reset form
      setSelectedCategory('');
      setSelectedSubcategory('');
      setStudyMinutes('');
      setStudyNotes('');
      setStudyResources('');
      setShowLogForm(false);

      // Reload data
      await loadStudyData();
    } catch (error) {
      console.error('Failed to log study time:', error);
    } finally {
      setIsLogging(false);
    }
  };

  const formatHours = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${hours.toFixed(1)}h`;
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 7) return 'text-green-600';
    if (streak >= 3) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getProgressPercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  if (!isPersonal) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Study Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Study Tracker
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLogForm(!showLogForm)}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Log Study
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatHours(statistics.totalHours)}
                </div>
                <div className="text-xs text-blue-600">Total Hours</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {statistics.categoriesStudied}
                </div>
                <div className="text-xs text-green-600">Categories</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 flex items-center justify-center gap-1">
                  <Flame className="h-5 w-5" />
                  {statistics.longestStreak}
                </div>
                <div className="text-xs text-orange-600">Best Streak</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {formatHours(statistics.thisWeekHours)}
                </div>
                <div className="text-xs text-purple-600">This Week</div>
              </div>
            </div>

            {/* Log Study Form */}
            {showLogForm && (
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  Log Study Session
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.name} value={category.name}>
                            <span className="flex items-center gap-2">
                              <span>{category.icon}</span>
                              {category.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedCategory && (
                    <div>
                      <Label htmlFor="subcategory">Subcategory (Optional)</Label>
                      <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subcategory" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories
                            .find(c => c.name === selectedCategory)
                            ?.subcategories.map((sub) => (
                              <SelectItem key={sub} value={sub}>
                                {sub}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="minutes">Time Spent (minutes)</Label>
                    <Input
                      id="minutes"
                      type="number"
                      value={studyMinutes}
                      onChange={(e) => setStudyMinutes(e.target.value)}
                      placeholder="60"
                      min="1"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={studyNotes}
                      onChange={(e) => setStudyNotes(e.target.value)}
                      placeholder="What did you learn or work on?"
                      rows={2}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="resources">Resources (Optional)</Label>
                    <Textarea
                      id="resources"
                      value={studyResources}
                      onChange={(e) => setStudyResources(e.target.value)}
                      placeholder="URLs, books, courses (one per line)"
                      rows={2}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={handleLogStudy}
                    disabled={!selectedCategory || !studyMinutes || isLogging}
                    size="sm"
                  >
                    {isLogging ? 'Logging...' : 'Log Study Time'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowLogForm(false)}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="categories" className="space-y-3">
            {categories.map((category) => {
              const categoryProgress = progress.find(p => p.category === category.name);
              return (
                <div
                  key={category.name}
                  className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{category.icon}</span>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {categoryProgress && (
                        <>
                          <Badge variant="outline" className="text-xs">
                            {formatHours(categoryProgress.totalHours)}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getStreakColor(categoryProgress.currentStreak)}`}
                          >
                            <Flame className="h-3 w-3 mr-1" />
                            {categoryProgress.currentStreak}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    {category.subcategories.slice(0, 3).map((sub) => (
                      <Badge key={sub} variant="secondary" className="text-xs">
                        {sub}
                      </Badge>
                    ))}
                    {category.subcategories.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{category.subcategories.length - 3} more
                      </Badge>
                    )}
                  </div>
                  
                  {categoryProgress && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Weekly Progress</span>
                        <span>{formatHours(categoryProgress.weeklyProgress)} / {formatHours(categoryProgress.weeklyGoal)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${getProgressPercentage(categoryProgress.weeklyProgress, categoryProgress.weeklyGoal)}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {progress
                .filter(p => p.totalHours > 0)
                .sort((a, b) => b.totalHours - a.totalHours)
                .map((categoryProgress) => {
                  const category = categories.find(c => c.name === categoryProgress.category);
                  return (
                    <div
                      key={categoryProgress.category}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">{category?.icon}</span>
                        <span className="font-medium">{categoryProgress.category}</span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total Time</span>
                          <span className="font-medium">{formatHours(categoryProgress.totalHours)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Current Streak</span>
                          <span className={`font-medium flex items-center gap-1 ${getStreakColor(categoryProgress.currentStreak)}`}>
                            <Flame className="h-4 w-4" />
                            {categoryProgress.currentStreak} days
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Best Streak</span>
                          <span className="font-medium flex items-center gap-1">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                            {categoryProgress.longestStreak} days
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">This Week</span>
                          <span className="font-medium">{formatHours(categoryProgress.weeklyProgress)}</span>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Weekly Goal</span>
                            <span>{Math.round(getProgressPercentage(categoryProgress.weeklyProgress, categoryProgress.weeklyGoal))}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${getProgressPercentage(categoryProgress.weeklyProgress, categoryProgress.weeklyGoal)}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            
            {progress.filter(p => p.totalHours > 0).length === 0 && (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No study progress yet</p>
                <p className="text-gray-500 text-sm">Start logging your study sessions to see progress here.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}