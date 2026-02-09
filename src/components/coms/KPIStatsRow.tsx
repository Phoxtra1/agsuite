import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Inbox, Clock, Send, TrendingUp } from 'lucide-react';
import type { ComsKpiStats } from '@/lib/coms/types';

interface KPIStatsRowProps {
  stats: ComsKpiStats;
  loading?: boolean;
}

const cards: Array<{
  key: keyof ComsKpiStats;
  label: string;
  icon: typeof Inbox;
  bgClass: string;
  iconClass: string;
  suffix?: string;
}> = [
  { key: 'unread', label: 'Unread', icon: Inbox, bgClass: 'bg-primary/10', iconClass: 'text-primary' },
  { key: 'pendingReplies', label: 'Pending Replies', icon: Clock, bgClass: 'bg-accent/20', iconClass: 'text-accent-foreground' },
  { key: 'sentToday', label: 'Sent Today', icon: Send, bgClass: 'bg-secondary', iconClass: 'text-secondary-foreground' },
  { key: 'deliveryRate', label: 'Delivery Rate', icon: TrendingUp, bgClass: 'bg-muted', iconClass: 'text-muted-foreground', suffix: '%' },
];

export function KPIStatsRow({ stats, loading }: KPIStatsRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(({ key, label, icon: Icon, bgClass, iconClass, suffix }) => (
        <Card key={key}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                {loading ? (
                  <div className="h-8 w-16 rounded bg-muted animate-pulse mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">
                    {stats[key]}{suffix || ''}
                  </p>
                )}
              </div>
              <div className={`h-10 w-10 rounded-full ${bgClass} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${iconClass}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
