import React from 'react';
import { AdminProductLinks } from './AdminProductLinks';
import { AdminPanel } from './AdminPanel';
import { CategoryManager } from './CategoryManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, FolderTree } from 'lucide-react';

export function AminevaConsole() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Amineva Console</h2>
        <p className="text-muted-foreground">
          Manage products, categories, and access administrative dashboards
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
        </TabsList>

        <TabsContent value="products">
          <AdminPanel />
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
