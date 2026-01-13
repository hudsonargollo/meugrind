'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ContentAsset } from '../../types/influencer';
import { influencerService } from '../../lib/influencer-service';
import { 
  Lightbulb, 
  FileText, 
  Video, 
  CheckCircle, 
  Share, 
  Receipt,
  Plus,
  Eye,
  Heart,
  MessageCircle,
  BarChart3
} from 'lucide-react';

interface PipelineStage {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  assets: ContentAsset[];
}

export function ContentPipeline() {
  const [pipeline, setPipeline] = useState<{ [key: string]: ContentAsset[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPipeline();
  }, []);

  const loadPipeline = async () => {
    try {
      const pipelineData = await influencerService.getContentPipeline();
      setPipeline(pipelineData);
    } catch (error) {
      console.error('Failed to load content pipeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const moveContent = async (contentId: string, newStage: string) => {
    try {
      await influencerService.moveContentToStage(contentId, newStage);
      await loadPipeline();
    } catch (error) {
      console.error('Failed to move content:', error);
    }
  };

  const stages: PipelineStage[] = [
    {
      id: 'ideation',
      title: 'Ideation',
      icon: <Lightbulb className="h-5 w-5" />,
      color: 'bg-yellow-100 border-yellow-200 text-yellow-800',
      assets: pipeline.ideation || [],
    },
    {
      id: 'scripting',
      title: 'Scripting',
      icon: <FileText className="h-5 w-5" />,
      color: 'bg-blue-100 border-blue-200 text-blue-800',
      assets: pipeline.scripting || [],
    },
    {
      id: 'filming',
      title: 'Filming',
      icon: <Video className="h-5 w-5" />,
      color: 'bg-purple-100 border-purple-200 text-purple-800',
      assets: pipeline.filming || [],
    },
    {
      id: 'approval',
      title: 'Approval',
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'bg-orange-100 border-orange-200 text-orange-800',
      assets: pipeline.approval || [],
    },
    {
      id: 'posted',
      title: 'Posted',
      icon: <Share className="h-5 w-5" />,
      color: 'bg-green-100 border-green-200 text-green-800',
      assets: pipeline.posted || [],
    },
    {
      id: 'invoice_sent',
      title: 'Invoice Sent',
      icon: <Receipt className="h-5 w-5" />,
      color: 'bg-emerald-100 border-emerald-200 text-emerald-800',
      assets: pipeline.invoice_sent || [],
    },
  ];

  const formatMetrics = (metrics: ContentAsset['metrics']) => {
    const formatNumber = (num: number) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
      return num.toString();
    };

    return {
      views: formatNumber(metrics.views),
      likes: formatNumber(metrics.likes),
      comments: formatNumber(metrics.comments),
      engagement: `${(metrics.engagement * 100).toFixed(1)}%`,
    };
  };

  const getPlatformColor = (platform: string) => {
    const colors: { [key: string]: string } = {
      instagram: 'bg-pink-100 text-pink-800',
      tiktok: 'bg-black text-white',
      youtube: 'bg-red-100 text-red-800',
      twitter: 'bg-blue-100 text-blue-800',
      website: 'bg-gray-100 text-gray-800',
    };
    return colors[platform] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      story: <Share className="h-4 w-4" />,
      post: <Eye className="h-4 w-4" />,
      reel: <Video className="h-4 w-4" />,
      video: <Video className="h-4 w-4" />,
      blog: <FileText className="h-4 w-4" />,
    };
    return icons[type] || <Eye className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Content Pipeline</h2>
          <p className="text-gray-600">Track your content from ideation to invoice</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Content
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 overflow-x-auto">
        {stages.map((stage) => (
          <div key={stage.id} className="min-w-[280px]">
            <Card className={`${stage.color} border-2`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  {stage.icon}
                  {stage.title}
                  <Badge variant="secondary" className="ml-auto">
                    {stage.assets.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
            </Card>

            <div className="space-y-3 mt-3">
              {stage.assets.map((asset) => (
                <Card key={asset.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(asset.type)}
                        <span className="font-medium text-sm">
                          {asset.title || `${asset.type.charAt(0).toUpperCase() + asset.type.slice(1)}`}
                        </span>
                      </div>
                      <Badge className={getPlatformColor(asset.platform)} variant="secondary">
                        {asset.platform}
                      </Badge>
                    </div>

                    {asset.description && (
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {asset.description}
                      </p>
                    )}

                    {asset.publishedAt && (
                      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{formatMetrics(asset.metrics).views}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          <span>{formatMetrics(asset.metrics).likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          <span>{formatMetrics(asset.metrics).comments}</span>
                        </div>
                      </div>
                    )}

                    {asset.publishedAt && (
                      <div className="flex items-center gap-1 mb-3 text-xs text-gray-500">
                        <BarChart3 className="h-3 w-3" />
                        <span>Engagement: {formatMetrics(asset.metrics).engagement}</span>
                      </div>
                    )}

                    <div className="flex gap-1">
                      {stage.id !== 'ideation' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs px-2 py-1 h-auto"
                          onClick={() => {
                            const currentIndex = stages.findIndex(s => s.id === stage.id);
                            if (currentIndex > 0) {
                              moveContent(asset.id, stages[currentIndex - 1].id);
                            }
                          }}
                        >
                          ←
                        </Button>
                      )}
                      {stage.id !== 'invoice_sent' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs px-2 py-1 h-auto"
                          onClick={() => {
                            const currentIndex = stages.findIndex(s => s.id === stage.id);
                            if (currentIndex < stages.length - 1) {
                              moveContent(asset.id, stages[currentIndex + 1].id);
                            }
                          }}
                        >
                          →
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {stage.assets.length === 0 && (
                <Card className="border-dashed border-2 border-gray-200">
                  <CardContent className="p-8 text-center">
                    <div className="text-gray-400 mb-2">{stage.icon}</div>
                    <p className="text-sm text-gray-500">No content in {stage.title.toLowerCase()}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ))}
      </div>

      {Object.values(pipeline).every(stage => stage.length === 0) && (
        <Card>
          <CardContent className="p-12 text-center">
            <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content in pipeline</h3>
            <p className="text-gray-600 mb-4">Start creating content to see it move through your pipeline</p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Content
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}