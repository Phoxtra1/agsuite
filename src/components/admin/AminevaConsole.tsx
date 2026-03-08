import React from 'react';
import { AdminProductLinks } from './AdminProductLinks';
import { AdminPanel } from './AdminPanel';
import { CategoryManager } from './CategoryManager';
import { AuthDiagnosticsPanel } from './AuthDiagnosticsPanel';
import { EmailDeliveryPanel } from './EmailDeliveryPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, FolderTree, ShieldCheck, Mail } from 'lucide-react';

export function AminevaConsole() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Amineva Console</h2>
        <p className="text-muted-foreground">
          Manage products category
        </p>
      </div>

      <AdminProductLinks />

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products" className="gap-2">
            <Settings className="h-4 w-4" />
            Product Management
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <FolderTree className="h-4 w-4" />
            Category Management
          </TabsTrigger>
          <TabsTrigger value="auth-diagnostics" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Auth Diagnostics
          </TabsTrigger>
          <TabsTrigger value="email-delivery" className="gap-2">
            <Mail className="h-4 w-4" />
            Email Delivery
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <AdminPanel />
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManager />
        </TabsContent>

        <TabsContent value="auth-diagnostics">
          <AuthDiagnosticsPanel />
        </TabsContent>

        <TabsContent value="email-delivery">
          <EmailDeliveryPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
