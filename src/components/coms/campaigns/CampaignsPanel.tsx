import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Play, 
  Pause, 
  MoreHorizontal, 
  Mail, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Calendar
} from 'lucide-react';

// Mock campaigns data
const mockCampaigns = [
  {
    id: '1',
    name: 'February Promo Launch',
    status: 'active',
    type: 'marketing',
    audience: 2340,
    sent: 2340,
    delivered: 2298,
    opened: 982,
    clicked: 234,
    scheduledAt: null,
    createdAt: '2025-01-30',
  },
  {
    id: '2',
    name: 'New Product Announcement',
    status: 'scheduled',
    type: 'marketing',
    audience: 5120,
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    scheduledAt: '2025-02-05 09:00',
    createdAt: '2025-01-29',
  },
  {
    id: '3',
    name: 'Weekly Newsletter #42',
    status: 'completed',
    type: 'newsletter',
    audience: 8450,
    sent: 8450,
    delivered: 8321,
    opened: 4102,
    clicked: 892,
    scheduledAt: null,
    createdAt: '2025-01-24',
  },
  {
    id: '4',
    name: 'Customer Survey Q1',
    status: 'draft',
    type: 'transactional',
    audience: 1200,
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    scheduledAt: null,
    createdAt: '2025-01-28',
  },
];

const statusStyles: Record<string, { color: string; icon: React.ReactNode }> = {
  active: { color: 'bg-emerald-500', icon: <Play className="h-3 w-3" /> },
  scheduled: { color: 'bg-blue-500', icon: <Clock className="h-3 w-3" /> },
  completed: { color: 'bg-gray-500', icon: <CheckCircle className="h-3 w-3" /> },
  draft: { color: 'bg-amber-500', icon: <XCircle className="h-3 w-3" /> },
  paused: { color: 'bg-red-500', icon: <Pause className="h-3 w-3" /> },
};

export function CampaignsPanel() {
  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Email Campaigns</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage bulk email campaigns, newsletters, and announcements
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* Campaign Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Mail className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-xl font-bold">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Scheduled</p>
                <p className="text-xl font-bold">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Reach</p>
                <p className="text-xl font-bold">17.1K</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Open Rate</p>
                <p className="text-xl font-bold">42.3%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Campaigns</CardTitle>
          <CardDescription>Manage your email campaigns and track performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockCampaigns.map((campaign) => {
              const deliveryRate = campaign.sent > 0 
                ? Math.round((campaign.delivered / campaign.sent) * 100) 
                : 0;
              const openRate = campaign.delivered > 0 
                ? Math.round((campaign.opened / campaign.delivered) * 100) 
                : 0;
              const clickRate = campaign.opened > 0 
                ? Math.round((campaign.clicked / campaign.opened) * 100) 
                : 0;

              return (
                <div 
                  key={campaign.id} 
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{campaign.name}</h4>
                      <Badge 
                        className={`text-white gap-1 ${statusStyles[campaign.status]?.color}`}
                      >
                        {statusStyles[campaign.status]?.icon}
                        {campaign.status}
                      </Badge>
                      <Badge variant="outline">{campaign.type}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {campaign.audience.toLocaleString()} recipients
                      </span>
                      {campaign.scheduledAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {campaign.scheduledAt}
                        </span>
                      )}
                    </div>
                    
                    {campaign.sent > 0 && (
                      <div className="grid grid-cols-3 gap-4 mt-3">
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Delivered</span>
                            <span>{deliveryRate}%</span>
                          </div>
                          <Progress value={deliveryRate} className="h-1" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Opened</span>
                            <span>{openRate}%</span>
                          </div>
                          <Progress value={openRate} className="h-1" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Clicked</span>
                            <span>{clickRate}%</span>
                          </div>
                          <Progress value={clickRate} className="h-1" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {campaign.status === 'active' && (
                      <Button variant="ghost" size="icon">
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {campaign.status === 'draft' && (
                      <Button variant="ghost" size="icon">
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
