'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { BrandDealManagement } from './brand-deal-management';
import { ContentPipeline } from './content-pipeline';
import { MediaAssetManagement } from './media-asset-management';
import { BrandConflictDetection } from './brand-conflict-detection';
import { ScriptWriter } from './script-writer';
import { ProductionMode } from './production-mode';
import { Package, BarChart3, Users, DollarSign, FileText, Video } from 'lucide-react';

type ActiveTab = 'pipeline' | 'deals' | 'media' | 'brands' | 'scripts' | 'production';

export function InfluencerManagement() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pipeline');

  const tabs = [
    {
      id: 'pipeline' as ActiveTab,
      label: 'Content Pipeline',
      icon: <BarChart3 className="h-4 w-4" />,
      description: 'Track content from ideation to invoice',
    },
    {
      id: 'deals' as ActiveTab,
      label: 'Brand Deals',
      icon: <Package className="h-4 w-4" />,
      description: 'Manage brand partnerships and campaigns',
    },
    {
      id: 'media' as ActiveTab,
      label: 'Media Assets',
      icon: <DollarSign className="h-4 w-4" />,
      description: 'Manage content assets and performance metrics',
    },
    {
      id: 'brands' as ActiveTab,
      label: 'Brand Database',
      icon: <Users className="h-4 w-4" />,
      description: 'Manage brand relationships and conflicts',
    },
    {
      id: 'scripts' as ActiveTab,
      label: 'Script Writer',
      icon: <FileText className="h-4 w-4" />,
      description: 'Create and manage content scripts',
    },
    {
      id: 'production' as ActiveTab,
      label: 'Production Mode',
      icon: <Video className="h-4 w-4" />,
      description: 'Professional content creation workspace',
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'pipeline':
        return <ContentPipeline />;
      case 'deals':
        return <BrandDealManagement />;
      case 'media':
        return <MediaAssetManagement />;
      case 'brands':
        return <BrandConflictDetection />;
      case 'scripts':
        return <ScriptWriter />;
      case 'production':
        return <ProductionMode />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Influencer CRM</h1>
        <p className="text-gray-600 mt-2">
          Manage your influencer business with brand deals, content pipeline, and analytics
        </p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
        {renderContent()}
      </div>
    </div>
  );
}