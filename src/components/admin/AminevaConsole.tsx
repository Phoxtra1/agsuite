import React, { useEffect, useMemo, useState } from 'react';
import { AdminProductLinks } from './AdminProductLinks';
import { AdminPanel } from './AdminPanel';
import { CategoryManager } from './CategoryManager';
import { AuthDiagnosticsPanel } from './AuthDiagnosticsPanel';
import { EmailDeliveryPanel } from './EmailDeliveryPanel';
import UserAppAccessManager from './UserAppAccessManager';
import { DiscoveryLibraryPanel } from './DiscoveryLibraryPanel';
import { HardwareIntegrationPanel } from './HardwareIntegrationPanel';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminProducts, useCategoryProducts } from '@/hooks/useProducts';
import { getSealSession } from '@/lib/sealAuth';
import {
  LayoutDashboard,
  Settings,
  FolderTree,
  ShieldCheck,
  Mail,
  KeyRound,
  Boxes,
  CircleDot,
  Clock,
  LibraryBig,
} from 'lucide-react';

type SectionId =
  | 'overview'
  | 'products'
  | 'categories'
  | 'auth-diagnostics'
  | 'email-delivery'
  | 'app-access'
  | 'discovery-library'
  | 'hardware-integrations';

const SECTIONS: { id: SectionId; label: string; icon: React.ElementType; hint: string }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, hint: 'Live snapshot' },
  { id: 'products', label: 'Product Registry', icon: Settings, hint: 'Internal registry' },
  { id: 'categories', label: 'Category Management', icon: FolderTree, hint: 'Homepage listing' },
  { id: 'auth-diagnostics', label: 'Live Auth Diagnostics', icon: ShieldCheck, hint: 'Real-time telemetry' },
  { id: 'email-delivery', label: 'Email Delivery', icon: Mail, hint: 'Delivery statuses' },
  { id: 'app-access', label: 'User Access', icon: KeyRound, hint: 'Per-app grants' },
  { id: 'discovery-library', label: 'Discovery Library', icon: LibraryBig, hint: 'Publication review' },
  { id: 'hardware-integrations', label: 'Hardware & Integrations', icon: Boxes, hint: 'Shared product integration framework' },
];

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {sub && <p className="text-[11px] text-muted-foreground/80 mt-0.5 truncate">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function AminevaConsole() {
  const [section, setSection] = useState<SectionId>('overview');
  const { products: adminProducts } = useAdminProducts();
  const { products: categoryProducts } = useCategoryProducts();
  const [now, setNow] = useState(() => new Date());
  const seal = getSealSession();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const liveCount = useMemo(
    () => categoryProducts.filter((p) => p.status === 'live').length,
    [categoryProducts]
  );
  const categoryCount = useMemo(
    () => new Set(categoryProducts.map((p) => p.category).filter(Boolean)).size,
    [categoryProducts]
  );

  const active = SECTIONS.find((s) => s.id === section) || SECTIONS[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Amineva Console</h2>
          <p className="text-sm text-muted-foreground">
            Central control for products, access, real-time diagnostics and delivery
          </p>
        </div>
        <div className="flex items-center gap-2">
          {seal?.position && <Badge variant="outline">{seal.position}</Badge>}
          {seal?.id && (
            <Badge variant="secondary" className="font-mono text-xs">
              {seal.id}
            </Badge>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Boxes} label="Registry products" value={adminProducts.length} />
        <StatCard icon={FolderTree} label="Homepage products" value={categoryProducts.length} sub={`${categoryCount} categories`} />
        <StatCard icon={CircleDot} label="Live now" value={liveCount} />
        <StatCard
          icon={Clock}
          label="Console time"
          value={now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          sub={now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        />
      </div>

      {/* Dashboard body */}
      <div className="grid gap-6 lg:grid-cols-[240px_1fr] items-start">
        {/* Section nav */}
        <Card className="lg:sticky lg:top-4">
          <CardContent className="p-2">
            <ScrollArea className="max-h-[70vh]">
              <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
                {SECTIONS.map((s) => {
                  const Icon = s.icon;
                  const isActive = s.id === section;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSection(s.id)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{s.label}</span>
                    </button>
                  );
                })}
              </nav>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Section content */}
        <div className="min-w-0 space-y-4">
          <div className="flex items-center gap-2">
            <active.icon className="h-4 w-4 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">{active.label}</h3>
            <span className="text-xs text-muted-foreground">— {active.hint}</span>
          </div>

          {section === 'overview' && (
            <div className="space-y-4">
              <AdminProductLinks />
              <AuthDiagnosticsPanel />
            </div>
          )}
          {section === 'products' && <AdminPanel />}
          {section === 'categories' && <CategoryManager />}
          {section === 'auth-diagnostics' && <AuthDiagnosticsPanel />}
          {section === 'email-delivery' && <EmailDeliveryPanel />}
          {section === 'app-access' && <UserAppAccessManager />}
          {section === 'discovery-library' && <DiscoveryLibraryPanel />}
          {section === 'hardware-integrations' && <HardwareIntegrationPanel />}
        </div>
      </div>
    </div>
  );
}
