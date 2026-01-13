'use client';

import React, { useState } from 'react';
import { performanceMonitor } from '../../lib/performance-monitor';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface PerformanceTestResults {
  baselineReport: any;
  throttledReport: any;
  recommendations: string[];
}

export function PerformanceTesting() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<PerformanceTestResults | null>(null);
  const [currentReport, setCurrentReport] = useState<any>(null);

  const runPerformanceTest = async () => {
    setIsRunning(true);
    setResults(null);
    
    try {
      const testResults = await performanceMonitor.testRuralConnectivity();
      setResults(testResults);
    } catch (error) {
      console.error('Performance test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getCurrentReport = () => {
    const report = performanceMonitor.getReport(60000); // Last minute
    setCurrentReport(report);
  };

  const clearMetrics = () => {
    performanceMonitor.clear();
    setCurrentReport(null);
    setResults(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Performance Testing</h2>
        <div className="flex gap-2">
          <Button onClick={getCurrentReport} variant="outline">
            Get Current Report
          </Button>
          <Button onClick={clearMetrics} variant="outline">
            Clear Metrics
          </Button>
          <Button 
            onClick={runPerformanceTest} 
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? 'Running Test...' : 'Run Rural Connectivity Test'}
          </Button>
        </div>
      </div>

      {/* Current Performance Report */}
      {currentReport && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Current Performance Report</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {currentReport.totalOperations}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Operations
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {currentReport.averageResponseTime.toFixed(1)}ms
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Average Response Time
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className={`text-2xl font-bold ${
                currentReport.sub200msPercentage >= 95 ? 'text-green-600' : 'text-red-600'
              }`}>
                {currentReport.sub200msPercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Sub-200ms Operations
              </div>
            </div>
          </div>

          {/* Operations by Type */}
          <div className="mt-6">
            <h4 className="font-semibold mb-3">Operations by Type</h4>
            <div className="space-y-2">
              {Object.entries(currentReport.operationsByType).map(([type, stats]: [string, any]) => (
                <div key={type} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="font-medium">{type}</span>
                  <div className="text-right">
                    <div className="text-sm">
                      {stats.count} ops, avg {stats.averageTime.toFixed(1)}ms
                    </div>
                    <div className={`text-xs ${
                      stats.averageTime <= 200 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats.averageTime <= 200 ? '✓ Fast' : '⚠ Slow'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Test Results */}
      {results && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Rural Connectivity Test Results</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Baseline Results */}
              <div>
                <h4 className="font-semibold mb-3 text-green-600">Baseline Performance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Operations:</span>
                    <span className="font-medium">{results.baselineReport.totalOperations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Response:</span>
                    <span className="font-medium">{results.baselineReport.averageResponseTime.toFixed(1)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sub-200ms Operations:</span>
                    <span className={`font-medium ${
                      results.baselineReport.sub200msPercentage >= 95 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {results.baselineReport.sub200msPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Throttled Results */}
              <div>
                <h4 className="font-semibold mb-3 text-orange-600">Rural Connectivity Performance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Operations:</span>
                    <span className="font-medium">{results.throttledReport.totalOperations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Response:</span>
                    <span className="font-medium">{results.throttledReport.averageResponseTime.toFixed(1)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sub-200ms Operations:</span>
                    <span className={`font-medium ${
                      results.throttledReport.sub200msPercentage >= 80 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {results.throttledReport.sub200msPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Recommendations */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Recommendations</h3>
            <div className="space-y-2">
              {results.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-blue-600 mt-0.5">💡</span>
                  <span className="text-sm">{recommendation}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Performance Requirements */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Requirements</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-green-500 rounded-full"></span>
            <span className="text-sm">
              <strong>Sub-200ms Response Time:</strong> All local operations must complete within 200ms
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-blue-500 rounded-full"></span>
            <span className="text-sm">
              <strong>Offline-First:</strong> Core functionality must work without internet connectivity
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-orange-500 rounded-full"></span>
            <span className="text-sm">
              <strong>Rural Connectivity:</strong> System must remain usable with intermittent/slow internet
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-purple-500 rounded-full"></span>
            <span className="text-sm">
              <strong>Battery Optimization:</strong> Minimize battery usage in eco mode
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}