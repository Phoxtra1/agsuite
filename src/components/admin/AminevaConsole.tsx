import React from 'react';
import { AdminProductLinks } from './AdminProductLinks';
import { AdminPanel } from './AdminPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, FolderTree, ExternalLink } from 'lucide-react';

export function AminevaConsole() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Amineva Console</h2>
        <p className="text-muted-foreground">
          Manage products, categories, and access administrative dashboards
        </p>
      </div>

      {/* Quick access to product admin dashboards */}
      <AdminProductLinks />

      {/* Product & Category Management */}
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
        </TabsList>

        <TabsContent value="products">
          <AdminPanel />
        </TabsContent>

        <TabsContent value="categories">
          <div className="text-center py-12 text-muted-foreground">
            <FolderTree className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Category management coming soon.</p>
            <p className="text-sm mt-2">
              For now, categories are defined in the codebase.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
