'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { ContentAsset, BrandDeal } from '../../types/influencer';
import { influencerService } from '../../lib/influencer-service';
import { 
  Upload, 
  Image, 
  Video, 
  FileText, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share, 
  Trash2, 
  Edit,
  Download,
  BarChart3,
  Calendar
} from 'lucide-react';

interface MediaAssetFormData {
  type: ContentAsset['type'];
  platform: string;
  title: string;
  description: string;
  brandDealId: string;
  mediaUrl: string;
  thumbnailUrl: string;
  status: ContentAsset['status'];
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagement: number;
    reach: number;
    impressions: number;
  };
}

const initialFormData: MediaAssetFormData = {
  type: 'post',
  platform: 'instagram',
  title: '',
  description: '',
  brandDealId: '',
  mediaUrl: '',
  thumbnailUrl: '',
  status: 'draft',
  metrics: {
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    engagement: 0,
    reach: 0,
    impressions: 0,
  },
};

export function MediaAssetManagement() {
  const [assets, setAssets] = useState<ContentAsset[]>([]);
  const [brandDeals, setBrandDeals] = useState<BrandDeal[]>([]);
  const [formData, setFormData] = useState<MediaAssetFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<{
    platform: string;
    status: string;
    brandDeal: string;
  }>({
    platform: 'all',
    status: 'all',
    brandDeal: 'all',
  });

  useEffect(() => {
    loadAssets();
    loadBrandDeals();
  }, []);

  const loadAssets = async () => {
    try {
      const allAssets = await influencerService.getAllContentAssets();
      setAssets(allAssets);
    } catch (error) {
      console.error('Failed to load assets:', error);
    }
  };

  const loadBrandDeals = async () => {
    try {
      const deals = await influencerService.getAllBrandDeals();
      setBrandDeals(deals);
    } catch (error) {
      console.error('Failed to load brand deals:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const assetData: Omit<ContentAsset, 'id'> = {
        ...formData,
        metrics: {
          ...formData.metrics,
          timestamp: new Date(),
        },
        publishedAt: formData.status === 'published' ? new Date() : undefined,
      };

      if (editingId) {
        await influencerService.updateContentAsset(editingId, assetData);
      } else {
        await influencerService.createContentAsset(assetData);
      }

      await loadAssets();
      resetForm();
    } catch (error) {
      console.error('Failed to save asset:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (asset: ContentAsset) => {
    setFormData({
      type: asset.type,
      platform: asset.platform,
      title: asset.title || '',
      description: asset.description || '',
      brandDealId: asset.brandDealId || '',
      mediaUrl: asset.mediaUrl || '',
      thumbnailUrl: asset.thumbnailUrl || '',
      status: asset.status,
      metrics: {
        views: asset.metrics.views,
        likes: asset.metrics.likes,
        comments: asset.metrics.comments,
        shares: asset.metrics.shares,
        engagement: asset.metrics.engagement,
        reach: asset.metrics.reach || 0,
        impressions: asset.metrics.impressions || 0,
      },
    });
    setEditingId(asset.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this media asset?')) {
      try {
        await influencerService.deleteContentAsset(id);
        await loadAssets();
      } catch (error) {
        console.error('Failed to delete asset:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setShowForm(false);
  };

  const getTypeIcon = (type: ContentAsset['type']) => {
    const icons = {
      story: <Share className="h-4 w-4" />,
      post: <Image className="h-4 w-4" />,
      reel: <Video className="h-4 w-4" />,
      video: <Video className="h-4 w-4" />,
      blog: <FileText className="h-4 w-4" />,
    };
    return icons[type] || <Image className="h-4 w-4" />;
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

  const getStatusColor = (status: ContentAsset['status']) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      published: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const filteredAssets = assets.filter(asset => {
    if (filter.platform !== 'all' && asset.platform !== filter.platform) return false;
    if (filter.status !== 'all' && asset.status !== filter.status) return false;
    if (filter.brandDeal !== 'all' && asset.brandDealId !== filter.brandDeal) return false;
    return true;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'mediaUrl' | 'thumbnailUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real implementation, you would upload to a cloud storage service
      // For now, we'll create a local URL
      const url = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, [field]: url }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Media Asset Management</h2>
          <p className="text-gray-600">Manage content assets and track performance metrics</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Add Media Asset
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="platformFilter">Platform</Label>
              <Select value={filter.platform} onValueChange={(value) => 
                setFilter(prev => ({ ...prev, platform: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="statusFilter">Status</Label>
              <Select value={filter.status} onValueChange={(value) => 
                setFilter(prev => ({ ...prev, status: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="brandDealFilter">Brand Deal</Label>
              <Select value={filter.brandDeal} onValueChange={(value) => 
                setFilter(prev => ({ ...prev, brandDeal: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {brandDeals.map(deal => (
                    <SelectItem key={deal.id} value={deal.id}>
                      {deal.campaignName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setFilter({ platform: 'all', status: 'all', brandDeal: 'all' })}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Media Asset' : 'Add New Media Asset'}</CardTitle>
            <CardDescription>
              Upload and manage your content assets with performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Content Type</Label>
                  <Select value={formData.type} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, type: value as ContentAsset['type'] }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="story">Story</SelectItem>
                      <SelectItem value="post">Post</SelectItem>
                      <SelectItem value="reel">Reel</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="blog">Blog</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="platform">Platform</Label>
                  <Select value={formData.platform} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, platform: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Content title"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, status: value as ContentAsset['status'] }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="brandDealId">Associated Brand Deal (Optional)</Label>
                <Select value={formData.brandDealId} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, brandDealId: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a brand deal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No brand deal</SelectItem>
                    {brandDeals.map(deal => (
                      <SelectItem key={deal.id} value={deal.id}>
                        {deal.campaignName} - {deal.brandName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Content description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mediaFile">Media File</Label>
                  <Input
                    id="mediaFile"
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => handleFileUpload(e, 'mediaUrl')}
                  />
                  {formData.mediaUrl && (
                    <p className="text-sm text-gray-600 mt-1">File uploaded</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="thumbnailFile">Thumbnail (Optional)</Label>
                  <Input
                    id="thumbnailFile"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'thumbnailUrl')}
                  />
                  {formData.thumbnailUrl && (
                    <p className="text-sm text-gray-600 mt-1">Thumbnail uploaded</p>
                  )}
                </div>
              </div>

              {formData.status === 'published' && (
                <div>
                  <Label className="text-base font-medium">Performance Metrics</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    <div>
                      <Label htmlFor="views">Views</Label>
                      <Input
                        id="views"
                        type="number"
                        value={formData.metrics.views}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          metrics: { ...prev.metrics, views: Number(e.target.value) }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="likes">Likes</Label>
                      <Input
                        id="likes"
                        type="number"
                        value={formData.metrics.likes}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          metrics: { ...prev.metrics, likes: Number(e.target.value) }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="comments">Comments</Label>
                      <Input
                        id="comments"
                        type="number"
                        value={formData.metrics.comments}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          metrics: { ...prev.metrics, comments: Number(e.target.value) }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="shares">Shares</Label>
                      <Input
                        id="shares"
                        type="number"
                        value={formData.metrics.shares}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          metrics: { ...prev.metrics, shares: Number(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : (editingId ? 'Update' : 'Create')} Asset
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {filteredAssets.map((asset) => (
          <Card key={asset.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  {getTypeIcon(asset.type)}
                  <div>
                    <h3 className="text-lg font-semibold">
                      {asset.title || `${asset.type.charAt(0).toUpperCase() + asset.type.slice(1)}`}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getPlatformColor(asset.platform)}>
                        {asset.platform}
                      </Badge>
                      <Badge className={getStatusColor(asset.status)}>
                        {asset.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(asset)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(asset.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {asset.description && (
                <p className="text-gray-600 mb-4">{asset.description}</p>
              )}

              {asset.brandDealId && (
                <div className="mb-4">
                  <span className="text-sm font-medium text-blue-600">
                    Campaign: {brandDeals.find(d => d.id === asset.brandDealId)?.campaignName}
                  </span>
                </div>
              )}

              {asset.publishedAt && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{formatNumber(asset.metrics.views)}</span>
                    <span className="text-sm text-gray-500">views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-600" />
                    <span className="font-medium">{formatNumber(asset.metrics.likes)}</span>
                    <span className="text-sm text-gray-500">likes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium">{formatNumber(asset.metrics.comments)}</span>
                    <span className="text-sm text-gray-500">comments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Share className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">{formatNumber(asset.metrics.shares)}</span>
                    <span className="text-sm text-gray-500">shares</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">{(asset.metrics.engagement * 100).toFixed(1)}%</span>
                    <span className="text-sm text-gray-500">engagement</span>
                  </div>
                </div>
              )}

              {asset.publishedAt && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>Published: {asset.publishedAt.toLocaleDateString()}</span>
                </div>
              )}

              {asset.mediaUrl && (
                <div className="mt-4">
                  <Button variant="outline" size="sm" asChild>
                    <a href={asset.mediaUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      View Media
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAssets.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No media assets found</h3>
            <p className="text-gray-600 mb-4">
              {assets.length === 0 
                ? "Start by uploading your first media asset" 
                : "No assets match your current filters"
              }
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Add Media Asset
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}