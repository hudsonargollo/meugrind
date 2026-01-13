'use client';

import React, { useState } from 'react';
import { SongManagement } from './song-management';
import { ContractorManagement } from './contractor-management';
import { SetlistBuilder } from './setlist-builder';
import { TechRiderGenerator } from './tech-rider-generator';
import { CallSheetGenerator } from './call-sheet-generator';
import { Button } from '../ui/button';
import { Music, Users, List, FileText, Calendar } from 'lucide-react';

type TabType = 'songs' | 'contractors' | 'setlists' | 'tech-riders' | 'call-sheets';

export function BandManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('songs');

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <Button
            variant={activeTab === 'songs' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('songs')}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <Music className="h-4 w-4" />
            Songs
          </Button>
          <Button
            variant={activeTab === 'setlists' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('setlists')}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <List className="h-4 w-4" />
            Setlists
          </Button>
          <Button
            variant={activeTab === 'tech-riders' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('tech-riders')}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <FileText className="h-4 w-4" />
            Tech Riders
          </Button>
          <Button
            variant={activeTab === 'call-sheets' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('call-sheets')}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <Calendar className="h-4 w-4" />
            Call Sheets
          </Button>
          <Button
            variant={activeTab === 'contractors' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('contractors')}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <Users className="h-4 w-4" />
            Contractors
          </Button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'songs' && <SongManagement />}
        {activeTab === 'setlists' && <SetlistBuilder />}
        {activeTab === 'tech-riders' && <TechRiderGenerator />}
        {activeTab === 'call-sheets' && <CallSheetGenerator />}
        {activeTab === 'contractors' && <ContractorManagement />}
      </div>
    </div>
  );
}