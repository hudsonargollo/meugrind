'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { SalesReport, SalesMetrics } from '../../types/solar';
import { solarService } from '../../lib/solar-service';

interface SalesReportingProps {
  className?: string;
}

export function SalesReporting({ className }: SalesReportingProps) {
  const [report, setReport] = useState<SalesReport | null>(null);
  const [conversionRates, setConversionRates] = useState<{ domestic: number; commercial: number; overall: number } | null>(null);
  const [pipelineValue, setPipelineValue] = useState<{ domestic: number; commercial: number; total: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0], // Today
  });
  const [reportPeriod, setReportPeriod] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Load conversion rates
      const rates = await solarService.getConversionRates();
      setConversionRates(rates);
      
      // Load pipeline value
      const pipeline = await solarService.getPipelineValue();
      setPipelineValue(pipeline);
      
      // Generate report for current date range
      await generateReport();
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      
      let startDate: Date;
      let endDate = new Date();
      
      switch (reportPeriod) {
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'custom':
          startDate = new Date(dateRange.startDate);
          endDate = new Date(dateRange.endDate);
          break;
        default:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }
      
      const salesReport = await solarService.generateSalesReport(startDate, endDate);
      setReport(salesReport);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (period: '7d' | '30d' | '90d' | 'custom') => {
    setReportPeriod(period);
    if (period !== 'custom') {
      generateReport();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  };

  const MetricsCard = ({ title, metrics, color }: { title: string; metrics: SalesMetrics; color: string }) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          {title}
          <Badge variant="outline" className={color}>
            {metrics.leads} leads
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold">{metrics.conversions}</div>
            <div className="text-sm text-gray-600">Conversions</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{formatPercentage(metrics.conversionRate)}</div>
            <div className="text-sm text-gray-600">Conversion Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{formatCurrency(metrics.revenue)}</div>
            <div className="text-sm text-gray-600">Revenue</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{formatCurrency(metrics.averageDealSize)}</div>
            <div className="text-sm text-gray-600">Avg Deal Size</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading && !report) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading sales analytics...</div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sales Reporting & Analytics</h2>
        <Button onClick={loadAnalytics} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Report Period Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Label>Report Period:</Label>
            <Select value={reportPeriod} onValueChange={(value) => handlePeriodChange(value as '7d' | '30d' | '90d' | 'custom')}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            
            {reportPeriod === 'custom' && (
              <>
                <Input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-40"
                />
                <span>to</span>
                <Input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-40"
                />
                <Button onClick={generateReport} disabled={loading}>
                  Generate Report
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Overall Metrics */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{report.metrics.totalLeads}</div>
              <div className="text-sm text-gray-600">Total Leads</div>
              <div className="text-xs text-gray-500 mt-1">
                {formatDate(report.period.start)} - {formatDate(report.period.end)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{report.metrics.contractsSigned}</div>
              <div className="text-sm text-gray-600">Contracts Signed</div>
              <div className="text-xs text-gray-500 mt-1">
                {formatPercentage(report.metrics.conversionRate)} conversion rate
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">{formatCurrency(report.metrics.pipelineValue)}</div>
              <div className="text-sm text-gray-600">Pipeline Value</div>
              <div className="text-xs text-gray-500 mt-1">
                Active opportunities
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-orange-600">{formatCurrency(report.metrics.averageDealSize)}</div>
              <div className="text-sm text-gray-600">Avg Deal Size</div>
              <div className="text-xs text-gray-500 mt-1">
                Per signed contract
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Segment Breakdown */}
      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MetricsCard
            title="Domestic Segment"
            metrics={report.segmentBreakdown.domestic}
            color="bg-blue-100 text-blue-800"
          />
          <MetricsCard
            title="Commercial Segment"
            metrics={report.segmentBreakdown.commercial}
            color="bg-green-100 text-green-800"
          />
        </div>
      )}

      {/* Current Pipeline Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Rates */}
        {conversionRates && (
          <Card>
            <CardHeader>
              <CardTitle>Current Conversion Rates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Overall Conversion Rate</span>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {formatPercentage(conversionRates.overall)}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Domestic</span>
                  <span className="font-medium">{formatPercentage(conversionRates.domestic)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(conversionRates.domestic, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Commercial</span>
                  <span className="font-medium">{formatPercentage(conversionRates.commercial)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(conversionRates.commercial, 100)}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pipeline Value */}
        {pipelineValue && (
          <Card>
            <CardHeader>
              <CardTitle>Current Pipeline Value</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Total Pipeline Value</span>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {formatCurrency(pipelineValue.total)}
                </Badge>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Domestic Pipeline</span>
                  <span className="font-medium">{formatCurrency(pipelineValue.domestic)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Commercial Pipeline</span>
                  <span className="font-medium">{formatCurrency(pipelineValue.commercial)}</span>
                </div>
              </div>
              <div className="pt-2">
                <div className="text-sm text-gray-600 mb-2">Pipeline Distribution</div>
                <div className="flex rounded-full overflow-hidden h-3">
                  <div 
                    className="bg-blue-500" 
                    style={{ 
                      width: pipelineValue.total > 0 
                        ? `${(pipelineValue.domestic / pipelineValue.total) * 100}%` 
                        : '50%' 
                    }}
                  ></div>
                  <div 
                    className="bg-green-500" 
                    style={{ 
                      width: pipelineValue.total > 0 
                        ? `${(pipelineValue.commercial / pipelineValue.total) * 100}%` 
                        : '50%' 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>Domestic</span>
                  <span>Commercial</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sales Funnel */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle>Sales Funnel Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{report.metrics.totalLeads}</div>
                  <div className="text-sm text-gray-600">Total Leads</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-blue-600 h-2 rounded-full w-full"></div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{report.metrics.qualifiedLeads}</div>
                  <div className="text-sm text-gray-600">Qualified</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ 
                        width: report.metrics.totalLeads > 0 
                          ? `${(report.metrics.qualifiedLeads / report.metrics.totalLeads) * 100}%` 
                          : '0%' 
                      }}
                    ></div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{report.metrics.proposalsSent}</div>
                  <div className="text-sm text-gray-600">Proposals Sent</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full" 
                      style={{ 
                        width: report.metrics.totalLeads > 0 
                          ? `${(report.metrics.proposalsSent / report.metrics.totalLeads) * 100}%` 
                          : '0%' 
                      }}
                    ></div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{report.metrics.contractsSigned}</div>
                  <div className="text-sm text-gray-600">Contracts Signed</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ 
                        width: report.metrics.totalLeads > 0 
                          ? `${(report.metrics.contractsSigned / report.metrics.totalLeads) * 100}%` 
                          : '0%' 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}