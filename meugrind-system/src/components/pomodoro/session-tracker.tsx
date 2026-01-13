'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Calendar, Clock, Target, TrendingUp, Award } from 'lucide-react';
import { pomodoroService } from '../../lib/pomodoro-service';
import { PomodoroSession, PomodoroStats, StudyStreak } from '../../types/pomodoro';

interface SessionTrackerProps {
  onProjectSelect?: (projectId: string) => void;
}

export function SessionTracker({ onProjectSelect }: SessionTrackerProps) {
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [stats, setStats] = useState<PomodoroStats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<PomodoroStats[]>([]);
  const [studyStreaks, setStudyStreaks] = useState<StudyStreak[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [newStudyCategory, setNewStudyCategory] = useState('');
  const [studyTime, setStudyTime] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load sessions
      const sessionHistory = await pomodoroService.getSessionHistory(50);
      setSessions(sessionHistory);

      // Load stats based on selected period
      if (selectedPeriod === 'today') {
        const todayStats = await pomodoroService.getStats();
        setStats(todayStats);
      } else if (selectedPeriod === 'week') {
        const weekly = await pomodoroService.getWeeklyStats();
        setWeeklyStats(weekly);
        
        // Calculate week totals
        const weekTotal = weekly.reduce((acc, day) => ({
          id: 'week-total',
          date: new Date(),
          completedSessions: acc.completedSessions + day.completedSessions,
          totalFocusTime: acc.totalFocusTime + day.totalFocusTime,
          averageSessionLength: 0,
          interruptions: acc.interruptions + day.interruptions,
          categories: [],
          productivity: {
            focusScore: 0,
            consistency: 0,
            streak: 0,
            weeklyGoal: 20,
            weeklyProgress: acc.completedSessions + day.completedSessions
          }
        }), {
          completedSessions: 0,
          totalFocusTime: 0,
          interruptions: 0
        } as any);
        
        weekTotal.averageSessionLength = weekTotal.totalFocusTime / (weekTotal.completedSessions || 1);
        setStats(weekTotal);
      }

      // Load study streaks
      const streaks = await pomodoroService.getStudyStreaks();
      setStudyStreaks(streaks);
    } catch (error) {
      console.error('Failed to load tracking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogStudyTime = async () => {
    if (!newStudyCategory.trim() || !studyTime.trim()) {
      alert('Please enter both category and time');
      return;
    }

    try {
      const timeInMinutes = parseInt(studyTime);
      if (isNaN(timeInMinutes) || timeInMinutes <= 0) {
        alert('Please enter a valid time in minutes');
        return;
      }

      await pomodoroService.logStudyTime(newStudyCategory.trim(), timeInMinutes);
      setNewStudyCategory('');
      setStudyTime('');
      loadData(); // Refresh data
    } catch (error) {
      console.error('Failed to log study time:', error);
      alert('Failed to log study time. Please try again.');
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getProductivityColor = (score: number): string => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const categoryChartData = stats?.categories.map((cat, index) => ({
    name: cat.category,
    sessions: cat.sessions,
    time: cat.totalTime,
    color: chartColors[index % chartColors.length]
  })) || [];

  const weeklyChartData = weeklyStats.map(day => ({
    date: day.date.toLocaleDateString('en-US', { weekday: 'short' }),
    sessions: day.completedSessions,
    focusTime: day.totalFocusTime
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading session data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center gap-4">
        <Label>View Period:</Label>
        <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.completedSessions}</div>
                  <div className="text-sm text-gray-600">Sessions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{formatDuration(stats.totalFocusTime)}</div>
                  <div className="text-sm text-gray-600">Focus Time</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{formatDuration(stats.averageSessionLength)}</div>
                  <div className="text-sm text-gray-600">Avg Session</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className={`text-2xl font-bold ${getProductivityColor(stats.productivity.focusScore)}`}>
                    {stats.productivity.focusScore.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Focus Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        {categoryChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Time by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="time"
                    label={({ name, value }) => `${name}: ${formatDuration(value)}`}
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatDuration(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Weekly Progress */}
        {selectedPeriod === 'week' && weeklyChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Weekly Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="#3B82F6" name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Study Streaks */}
      {studyStreaks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Study Streaks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studyStreaks.map((streak) => (
                <div key={streak.category} className="p-4 border rounded-lg">
                  <div className="font-semibold">{streak.category}</div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Current Streak: {streak.currentStreak} days</div>
                    <div>Longest Streak: {streak.longestStreak} days</div>
                    <div>Total Hours: {streak.totalHours.toFixed(1)}h</div>
                    <div>Last Study: {streak.lastStudyDate.toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Study Time Entry */}
      <Card>
        <CardHeader>
          <CardTitle>Log Study Time</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="studyCategory">Category</Label>
              <Input
                id="studyCategory"
                value={newStudyCategory}
                onChange={(e) => setNewStudyCategory(e.target.value)}
                placeholder="e.g., Programming, Design, Marketing"
              />
            </div>
            <div>
              <Label htmlFor="studyTime">Time (minutes)</Label>
              <Input
                id="studyTime"
                type="number"
                value={studyTime}
                onChange={(e) => setStudyTime(e.target.value)}
                placeholder="60"
                min="1"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleLogStudyTime} className="w-full">
                Log Time
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sessions.slice(0, 10).map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={session.completed ? 'default' : 'secondary'}>
                    {session.completed ? 'Completed' : 'Incomplete'}
                  </Badge>
                  <div>
                    <div className="font-medium">{session.taskCategory}</div>
                    {session.projectId && (
                      <div className="text-sm text-gray-600">{session.projectId}</div>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <div>{formatDuration(session.duration)}</div>
                  <div>{session.startTime.toLocaleDateString()}</div>
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No sessions recorded yet. Start your first Pomodoro session!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}