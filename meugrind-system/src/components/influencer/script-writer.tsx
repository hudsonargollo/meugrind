'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Script, BrandDeal, ContentAsset } from '../../types/influencer';
import { influencerService } from '../../lib/influencer-service';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Eye, 
  Play,
  Pause,
  RotateCcw,
  Settings,
  Monitor,
  Clock
} from 'lucide-react';

interface ScriptFormData {
  title: string;
  content: string;
  brandDealId: string;
  contentAssetId: string;
  teleprompterSettings: {
    fontSize: number;
    scrollSpeed: number;
    backgroundColor: string;
    textColor: string;
    mirrorMode: boolean;
  };
}

const initialFormData: ScriptFormData = {
  title: '',
  content: '',
  brandDealId: '',
  contentAssetId: '',
  teleprompterSettings: {
    fontSize: 24,
    scrollSpeed: 2,
    backgroundColor: '#000000',
    textColor: '#ffffff',
    mirrorMode: false,
  },
};

export function ScriptWriter() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [brandDeals, setBrandDeals] = useState<BrandDeal[]>([]);
  const [contentAssets, setContentAssets] = useState<ContentAsset[]>([]);
  const [formData, setFormData] = useState<ScriptFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [showTeleprompter, setShowTeleprompter] = useState(false);

  useEffect(() => {
    loadScripts();
    loadBrandDeals();
    loadContentAssets();
  }, []);

  const loadScripts = async () => {
    try {
      const allScripts = await influencerService.getAllScripts();
      setScripts(allScripts);
    } catch (error) {
      console.error('Failed to load scripts:', error);
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

  const loadContentAssets = async () => {
    try {
      const assets = await influencerService.getAllContentAssets();
      setContentAssets(assets);
    } catch (error) {
      console.error('Failed to load content assets:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const scriptData = {
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (editingId) {
        await influencerService.updateScript(editingId, scriptData);
      } else {
        await influencerService.createScript(scriptData);
      }

      await loadScripts();
      resetForm();
    } catch (error) {
      console.error('Failed to save script:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (script: Script) => {
    setFormData({
      title: script.title,
      content: script.content,
      brandDealId: script.brandDealId || '',
      contentAssetId: script.contentAssetId || '',
      teleprompterSettings: script.teleprompterSettings,
    });
    setEditingId(script.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this script?')) {
      try {
        await influencerService.deleteScript(id);
        await loadScripts();
      } catch (error) {
        console.error('Failed to delete script:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setShowForm(false);
  };

  const openTeleprompter = (script: Script) => {
    setSelectedScript(script);
    setShowTeleprompter(true);
  };

  const getWordCount = (content: string) => {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getEstimatedDuration = (content: string) => {
    const wordCount = getWordCount(content);
    const wordsPerMinute = 150; // Average speaking rate
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return minutes;
  };

  const getBrandDealName = (brandDealId: string) => {
    const deal = brandDeals.find(d => d.id === brandDealId);
    return deal ? `${deal.campaignName} - ${deal.brandName}` : '';
  };

  const getContentAssetName = (contentAssetId: string) => {
    const asset = contentAssets.find(a => a.id === contentAssetId);
    return asset ? asset.title || `${asset.type} on ${asset.platform}` : '';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Script Writer</h2>
          <p className="text-gray-600">Create and manage scripts for your content production</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Script
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Script' : 'Create New Script'}</CardTitle>
            <CardDescription>
              Write your script and configure teleprompter settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Script Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter script title"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="contentAssetId">Associated Content Asset (Optional)</Label>
                  <Select value={formData.contentAssetId} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, contentAssetId: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select content asset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No content asset</SelectItem>
                      {contentAssets.map(asset => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.title || `${asset.type} on ${asset.platform}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="content">Script Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your script here..."
                  rows={12}
                  className="font-mono"
                  required
                />
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>Words: {getWordCount(formData.content)}</span>
                  <span>Estimated duration: {getEstimatedDuration(formData.content)} min</span>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Teleprompter Settings</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                  <div>
                    <Label htmlFor="fontSize">Font Size</Label>
                    <Input
                      id="fontSize"
                      type="number"
                      min="12"
                      max="72"
                      value={formData.teleprompterSettings.fontSize}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        teleprompterSettings: {
                          ...prev.teleprompterSettings,
                          fontSize: Number(e.target.value)
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="scrollSpeed">Scroll Speed</Label>
                    <Select 
                      value={formData.teleprompterSettings.scrollSpeed.toString()} 
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        teleprompterSettings: {
                          ...prev.teleprompterSettings,
                          scrollSpeed: Number(value)
                        }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Slow</SelectItem>
                        <SelectItem value="2">Medium</SelectItem>
                        <SelectItem value="3">Fast</SelectItem>
                        <SelectItem value="4">Very Fast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="mirrorMode"
                      checked={formData.teleprompterSettings.mirrorMode}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        teleprompterSettings: {
                          ...prev.teleprompterSettings,
                          mirrorMode: e.target.checked
                        }
                      }))}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="mirrorMode">Mirror Mode</Label>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="backgroundColor">Background Color</Label>
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={formData.teleprompterSettings.backgroundColor}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        teleprompterSettings: {
                          ...prev.teleprompterSettings,
                          backgroundColor: e.target.value
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="textColor">Text Color</Label>
                    <Input
                      id="textColor"
                      type="color"
                      value={formData.teleprompterSettings.textColor}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        teleprompterSettings: {
                          ...prev.teleprompterSettings,
                          textColor: e.target.value
                        }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : (editingId ? 'Update' : 'Create')} Script
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
        {scripts.map((script) => (
          <Card key={script.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{script.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {getWordCount(script.content)} words
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      ~{getEstimatedDuration(script.content)} min
                    </span>
                    <span>Updated: {script.updatedAt.toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openTeleprompter(script)}
                    className="flex items-center gap-2"
                  >
                    <Monitor className="h-4 w-4" />
                    Teleprompter
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(script)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(script.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {script.brandDealId && (
                <div className="mb-3">
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    Brand Deal: {getBrandDealName(script.brandDealId)}
                  </Badge>
                </div>
              )}

              {script.contentAssetId && (
                <div className="mb-3">
                  <Badge variant="outline" className="text-purple-600 border-purple-200">
                    Content: {getContentAssetName(script.contentAssetId)}
                  </Badge>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 line-clamp-3">
                  {script.content.substring(0, 200)}
                  {script.content.length > 200 && '...'}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {scripts.length === 0 && !showForm && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No scripts yet</h3>
            <p className="text-gray-600 mb-4">Create your first script to get started with content production</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Script
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Teleprompter Modal */}
      {showTeleprompter && selectedScript && (
        <TeleprompterModal
          script={selectedScript}
          onClose={() => {
            setShowTeleprompter(false);
            setSelectedScript(null);
          }}
        />
      )}
    </div>
  );
}

interface TeleprompterModalProps {
  script: Script;
  onClose: () => void;
}

function TeleprompterModal({ script, onClose }: TeleprompterModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [settings, setSettings] = useState(script.teleprompterSettings);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setScrollPosition(prev => prev + settings.scrollSpeed);
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, settings.scrollSpeed]);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const resetPosition = () => {
    setScrollPosition(0);
    setIsPlaying(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="w-full h-full flex flex-col">
        {/* Controls */}
        <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">{script.title}</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={togglePlayback}
                className="text-white border-white hover:bg-white hover:text-black"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetPosition}
                className="text-white border-white hover:bg-white hover:text-black"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="teleprompterFontSize" className="text-sm">Font Size:</Label>
              <Input
                id="teleprompterFontSize"
                type="number"
                min="12"
                max="72"
                value={settings.fontSize}
                onChange={(e) => setSettings(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                className="w-20 text-black"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="teleprompterSpeed" className="text-sm">Speed:</Label>
              <Input
                id="teleprompterSpeed"
                type="range"
                min="1"
                max="5"
                value={settings.scrollSpeed}
                onChange={(e) => setSettings(prev => ({ ...prev, scrollSpeed: Number(e.target.value) }))}
                className="w-20"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-white border-white hover:bg-white hover:text-black"
            >
              Close
            </Button>
          </div>
        </div>

        {/* Teleprompter Display */}
        <div 
          className="flex-1 overflow-hidden relative"
          style={{ 
            backgroundColor: settings.backgroundColor,
            transform: settings.mirrorMode ? 'scaleX(-1)' : 'none'
          }}
        >
          <div
            className="absolute inset-0 p-8 whitespace-pre-wrap leading-relaxed"
            style={{
              color: settings.textColor,
              fontSize: `${settings.fontSize}px`,
              transform: `translateY(-${scrollPosition}px)`,
              transition: 'transform 0.1s linear',
            }}
          >
            {script.content}
          </div>
        </div>
      </div>
    </div>
  );
}