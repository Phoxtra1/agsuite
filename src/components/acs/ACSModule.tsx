// src/components/acs/ACSModule.tsx
// PURPOSE: Amineva Central Server — real-time intelligence infrastructure
// Tabs: Monitor | Data Lake | Intelligence | Alerts | Connection

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Brain, Bell, Plug, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Radio } from 'lucide-react';
import BackendManager from '@/core/backend/BackendManager';
import { toast } from 'sonner';
import { ACSMonitorTab } from './tabs/ACSMonitorTab';
import { ACSDataLakeTab } from './tabs/ACSDataLakeTab';
import { ACSIntelligenceTab } from './tabs/ACSIntelligenceTab';
import { ACSAlertsTab } from './tabs/ACSAlertsTab';
import { ACSConnectionPanel } from './ACSConnectionPanel';
import { acs } from '@/core/backend';
import { startACSEmitter, stopACSEmitter, ACSEmitter } from '@/core/acs/emitter';

export function ACSModule() {
  const [topTab, setTopTab] = useState<string>('monitor');
  const [currentBackend, setCurrentBackend] = useState(BackendManager.getBackend());
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    const unsub = BackendManager.onChange((b) => {
      setCurrentBackend(b);
      toast.info(`Backend switched to ${b}. Reloading ACS data…`);
    });
    return unsub;
  }, []);

  // ACS Emitter — auto-ingest data from all platforms
  useEffect(() => {
    startACSEmitter();
    return () => stopACSEmitter();
  }, []);

  // Realtime subscription
  useEffect(() => {
    setRealtimeConnected(true);
    const unsub = acs.subscribeEvents(() => {
      setLiveCount((c) => c + 1);
    });
    return () => {
      setRealtimeConnected(false);
      unsub();
    };
  }, [currentBackend]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" /> Amineva Central Server
          </h2>
          <p className="text-muted-foreground">
            Real-time intelligence infrastructure across all Amineva platforms
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 text-xs border-muted-foreground/50 text-muted-foreground">
            {currentBackend === 'lovable' ? 'Cloud' : 'Appwrite'}
          </Badge>
          {realtimeConnected ? (
            <Badge variant="outline" className="gap-1 text-xs border-primary text-primary">
              <Wifi className="h-3 w-3" /> Live
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-xs border-destructive text-destructive">
              <WifiOff className="h-3 w-3" /> Offline
            </Badge>
          )}
          {liveCount > 0 && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Radio className="h-3 w-3 animate-pulse" /> {liveCount} new
            </Badge>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={topTab} onValueChange={setTopTab}>
        <TabsList>
          <TabsTrigger value="monitor" className="gap-2">
            <Activity className="h-4 w-4" /> Monitor
          </TabsTrigger>
          <TabsTrigger value="datalake" className="gap-2">
            <Database className="h-4 w-4" /> Data Lake
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="gap-2">
            <Brain className="h-4 w-4" /> Intelligence
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <Bell className="h-4 w-4" /> Alerts
          </TabsTrigger>
          <TabsTrigger value="connection" className="gap-2">
            <Plug className="h-4 w-4" /> Connection
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitor" className="mt-4">
          <ACSMonitorTab currentBackend={currentBackend} />
        </TabsContent>

        <TabsContent value="datalake" className="mt-4">
          <ACSDataLakeTab currentBackend={currentBackend} />
        </TabsContent>

        <TabsContent value="intelligence" className="mt-4">
          <ACSIntelligenceTab currentBackend={currentBackend} />
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <ACSAlertsTab currentBackend={currentBackend} />
        </TabsContent>

        <TabsContent value="connection" className="mt-4">
          <ACSConnectionPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
