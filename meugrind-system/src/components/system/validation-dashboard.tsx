/**
 * System Validation Dashboard
 * 
 * Provides a comprehensive dashboard for system validation results,
 * performance monitoring, and health checks.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { systemValidator, type SystemValidationReport } from '../../lib/system-validator';
import { performanceMonitor } from '../../lib/performance-monitor';
import { errorReporting } from '../error/error-boundary';

export function ValidationDashboard() {
  const [report, setReport] = useState<SystemValidationReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runValidation = async () => {
    setIsRunning(true);
    try {
      const validationReport = await systemValidator.validateSystem();
      setReport(validationReport);
      setLastRun(new Date());
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    // Run validation on component mount
    runValidation();
  }, []);

  if (!report && !isRunning) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-center">
          <button
            onClick={runValidation}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Run System Validation
          </button>
        </div>
      </div>
    );
  }

  if (isRunning) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Running system validation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">System Validation Dashboard</h2>
            <p className="text-gray-600">
              Last run: {lastRun?.toLocaleString()}
            </p>
          </div>
          <button
            onClick={runValidation}
            disabled={isRunning}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isRunning ? 'Running...' : 'Run Validation'}
          </button>
        </div>
      </div>

      {report && (
        <>
          {/* Overall Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                report.overallStatus === 'pass' ? 'bg-green-100' :
                report.overallStatus === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                {report.overallStatus === 'pass' ? (
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : report.overallStatus === 'warning' ? (
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  System Status: {report.overallStatus.toUpperCase()}
                </h3>
                <p className="text-gray-600">
                  {report.summary.passed}/{report.summary.totalTests} tests passed
                  {report.summary.warnings > 0 && ` • ${report.summary.warnings} warnings`}
                </p>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-green-600">{report.summary.passed}</div>
              <div className="text-sm text-gray-600">Tests Passed</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-red-600">{report.summary.failed}</div>
              <div className="text-sm text-gray-600">Tests Failed</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-yellow-600">{report.summary.warnings}</div>
              <div className="text-sm text-gray-600">Warnings</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-blue-600">
                {report.performance.averageResponseTime.toFixed(0)}ms
              </div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
            </div>
          </div>

          {/* Test Categories */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Test Results by Category</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {Object.entries(report.categories).map(([category, data]) => (
                <CategorySection key={category} category={category} data={data} />
              ))}
            </div>
          </div>

          {/* Requirements Coverage */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Requirements Coverage</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {Object.entries(report.requirements).map(([requirement, data]) => (
                  <div key={requirement} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{requirement}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          data.status === 'pass' ? 'bg-green-100 text-green-800' :
                          data.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {data.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {data.details.join(' • ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {data.coverage.toFixed(0)}%
                      </div>
                      <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full ${
                            data.coverage === 100 ? 'bg-green-500' :
                            data.coverage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${data.coverage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Performance Recommendations */}
          {report.performance.recommendations.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Performance Recommendations</h3>
              </div>
              <div className="p-6">
                <ul className="space-y-2">
                  {report.performance.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <svg className="w-5 h-5 text-yellow-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-700">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface CategorySectionProps {
  category: string;
  data: {
    status: 'pass' | 'fail' | 'warning';
    tests: Array<{
      test: string;
      passed: boolean;
      message: string;
      duration?: number;
      details?: any;
    }>;
  };
}

function CategorySection({ category, data }: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              data.status === 'pass' ? 'bg-green-500' :
              data.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="font-medium text-gray-900">{category}</span>
            <span className="text-sm text-gray-500">
              {data.tests.filter(t => t.passed).length}/{data.tests.length} passed
            </span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transform transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="space-y-2">
            {data.tests.map((test, index) => (
              <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  {test.passed ? (
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className="text-sm font-medium text-gray-900">{test.test}</span>
                </div>
                <div className="text-right">
                  {test.duration && (
                    <div className="text-xs text-gray-500">{test.duration.toFixed(2)}ms</div>
                  )}
                  {!test.passed && (
                    <div className="text-xs text-red-600">{test.message}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}