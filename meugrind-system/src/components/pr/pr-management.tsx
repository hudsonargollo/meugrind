'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Calendar, MessageSquare, Users, BarChart3 } from 'lucide-react';
import { AppearanceWindowTracking } from './appearance-window-tracking';
import { TalkingPointsRepository } from './talking-points-repository';
import { PREventScheduling } from './pr-event-scheduling';

interface PRManagementProps {
  className?: string;
}

export function PRManagement({ className }: PRManagementProps) {
  const [activeTab, setActiveTab] = useState('windows');

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            PR Management
          </CardTitle>
          <CardDescription>
            Manage reality TV contracts, appearance windows, and approved messaging
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="windows" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Appearance Windows
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                PR Events
              </TabsTrigger>
              <TabsTrigger value="messaging" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Messaging Repository
              </TabsTrigger>
            </TabsList>

            <TabsContent value="windows" className="mt-6">
              <AppearanceWindowTracking />
            </TabsContent>

            <TabsContent value="events" className="mt-6">
              <PREventScheduling />
            </TabsContent>

            <TabsContent value="messaging" className="mt-6">
              <TalkingPointsRepository />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}