'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScriptWriter } from './script-writer';
import { Script, BrandDeal, ContentAsset } from '../../types/influencer';
import { influencerService } from '../../lib/influencer-service';
import { 
  Video, 
  FileText, 
  Play, 
  CheckCircle, 
  Clock, 
  Calendar,
  Monitor,
  Camera,
  Mic,
  Settings
} from 'lucide-react';

interface ProductionSession {
  id: string;
  scriptId: string;
  brandDealId?: string;
  contentAssetId?: string;
  status: 'planning' | 'recording' | 'editing' | 'completed';
  startTime?: Date;
  endTime?: Date;
  notes: string;
}

export function ProductionMode() {
  const [activeTab, setActiveTab] = useState<'scripts' | 'sessions' | 'equipment'>('scripts');
  const [scripts, setScripts] = useState<Script[]>([]);
  const [brandDeals, setBrandDeals] = useState<BrandDeal[]>([]);
  const [contentAssets, setContentAssets] = useState<ContentAsset[]>([]);
  const [productionSessions, setProductionSessions] = useState<ProductionSession[]>([]);
  const [activeSession, setActiveSession] = useState<ProductionSession | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [scriptsData, dealsData, assetsData] = await Promise.all([
        influencerService.getAllScripts(),
        influencerService.getAllBrandDeals(),
        influencerService.getAllContentAssets(),
      ]);
      
      setScripts(scriptsData);
      setBrandDeals(dealsData);
      setContentAssets(assetsData);
    } catch (error) {
      console.error('Failed to load production data:', error);
    }
  };

  const startProductionSession = (script: Script) => {
    const session: ProductionSession = {
      id: `session-${Date.now()}`,
      scriptId: script.id,
      brandDealId: script.brandDealId,
      contentAssetId: script.contentAssetId,
      status: 'recording',
      startTime: new Date(),
      notes: '',
    };
    
    setActiveSession(session);
    setProductionSessions(prev => [...prev, session]);
  };

  const endProductionSession = () => {
    if (activeSession) {
      const updatedSession = {
        ...activeSession,
        status: 'completed' as const,
        endTime: new Date(),
      };
      
      setProductionSessions(prev => 
        prev.map(session => 
          session.id === activeSession.id ? updatedSession : session
        )
      );
      setActiveSession(null);
    }
  };

  const getScriptById = (scriptId: string) => {
    return scripts.find(script => script.id === scriptId);
  };

  const getBrandDealById = (brandDealId?: string) => {
    return brandDealId ? brandDeals.find(deal => deal.id === brandDealId) : null;
  };

  const getContentAssetById = (contentAssetId?: string) => {
    return contentAssetId ? contentAssets.find(asset => asset.id === contentAssetId) : null;
  };

  const getSessionDuration = (session: ProductionSession) => {
    if (!session.startTime) return 0;
    const endTime = session.endTime || new Date();
    return Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000 / 60);
  };

  const renderScriptsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Production Scripts</h3>
          <p className="text-gray-600">Scripts ready for production</p>
        </div>
      </div>

      <div className="grid gap-4">
        {scripts.map((script) => {
          const brandDeal = getBrandDealById(script.brandDealId);
          const contentAsset = getContentAssetById(script.contentAssetId);
          
          return (
            <Card key={script.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold">{script.title}</h4>
                    <div className="flex items-center gap-2 mt-2">
                      {brandDeal && (
                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                          {brandDeal.campaignName}
                        </Badge>
                      )}
                      {contentAsset && (
                        <Badge variant="outline" className="text-purple-600 border-purple-200">
                          {contentAsset.type} - {contentAsset.platform}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startProductionSession(script)}
                      disabled={!!activeSession}
                      className="flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Start Recording
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {script.content.substring(0, 150)}...
                  </p>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {script.content.split(' ').length} words
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    ~{Math.ceil(script.content.split(' ').length / 150)} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {script.updatedAt.toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {scripts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No scripts available</h3>
            <p className="text-gray-600">Create scripts in the Script Writer to start production</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderSessionsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Production Sessions</h3>
          <p className="text-gray-600">Track your recording and production sessions</p>
        </div>
      </div>

      {activeSession && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Video className="h-5 w-5" />
              Active Recording Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">
                  {getScriptById(activeSession.scriptId)?.title}
                </h4>
                <p className="text-sm text-gray-600">
                  Started: {activeSession.startTime?.toLocaleTimeString()}
                </p>
                <p className="text-sm text-gray-600">
                  Duration: {getSessionDuration(activeSession)} minutes
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  onClick={endProductionSession}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  End Session
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {productionSessions.map((session) => {
          const script = getScriptById(session.scriptId);
          const brandDeal = getBrandDealById(session.brandDealId);
          
          return (
            <Card key={session.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold">{script?.title}</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge 
                        variant={session.status === 'completed' ? 'default' : 'secondary'}
                        className={
                          session.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </Badge>
                      {brandDeal && (
                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                          {brandDeal.campaignName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {session.startTime?.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {session.startTime?.toLocaleTimeString()} - {session.endTime?.toLocaleTimeString() || 'Ongoing'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Video className="h-4 w-4" />
                    <span>
                      Duration: {getSessionDuration(session)} minutes
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {productionSessions.length === 0 && !activeSession && (
        <Card>
          <CardContent className="p-12 text-center">
            <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No production sessions</h3>
            <p className="text-gray-600">Start recording a script to create your first session</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderEquipmentTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Production Equipment</h3>
        <p className="text-gray-600">Equipment checklist and setup guides</p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Camera Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span>Camera positioned at eye level</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span>Lighting setup (key light, fill light)</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span>Background clean and branded</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span>Focus and exposure locked</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Audio Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span>Microphone connected and tested</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span>Audio levels checked</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span>Background noise minimized</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span>Backup audio recording ready</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Teleprompter Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span>Teleprompter positioned correctly</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span>Script loaded and formatted</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span>Scroll speed tested</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span>Remote control ready</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Production Mode</h2>
        <p className="text-gray-600">Professional content creation workspace</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'scripts', label: 'Scripts', icon: <FileText className="h-4 w-4" /> },
            { id: 'sessions', label: 'Sessions', icon: <Video className="h-4 w-4" /> },
            { id: 'equipment', label: 'Equipment', icon: <Settings className="h-4 w-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'scripts' && renderScriptsTab()}
        {activeTab === 'sessions' && renderSessionsTab()}
        {activeTab === 'equipment' && renderEquipmentTab()}
      </div>
    </div>
  );
}