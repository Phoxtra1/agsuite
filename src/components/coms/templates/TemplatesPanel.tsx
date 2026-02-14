import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  FileText, 
  Mail, 
  Bell, 
  Megaphone,
  Edit,
  Copy,
  Trash2,
  Eye,
  Settings,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '@/api/templatesApi';

interface Template {
  id: string;
  name: string;
  type: 'transactional' | 'notification' | 'marketing';
  category: string;
  description: string;
  subject: string;
  body: string;
  variables: string[];
  lastUpdated: string;
  usageCount: number;
}

interface TemplateFormData {
  name: string;
  type: 'transactional' | 'notification' | 'marketing';
  category: string;
  description: string;
  subject: string;
  body: string;
}

const initialFormData: TemplateFormData = {
  name: '',
  type: 'transactional',
  category: '',
  description: '',
  subject: '',
  body: '',
};

const typeIcons: Record<string, React.ReactNode> = {
  transactional: <Mail className="h-4 w-4" />,
  notification: <Bell className="h-4 w-4" />,
  marketing: <Megaphone className="h-4 w-4" />,
};

const typeColors: Record<string, string> = {
  transactional: 'bg-blue-500',
  notification: 'bg-amber-500',
  marketing: 'bg-emerald-500',
};

export function TemplatesPanel() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(initialFormData);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Fetch templates on mount
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const data = await getTemplates();
        setTemplates(data);
      } catch (err) {
        toast.error("Failed to load templates");
        console.error(err);
      }
    }
    fetchTemplates();
  }, []);

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setFormData(initialFormData);
    setIsEditDialogOpen(true);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setFormData({ ...template });
    setIsEditDialogOpen(true);
  };

  const handlePreviewTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setActiveTab('preview');
    setIsPreviewDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!formData.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    const variables = formData.body.match(/\{\{[^}]+\}\}/g) || [];

    try {
      if (editingTemplate) {
        const updated = await updateTemplate(editingTemplate.id, {
          ...formData,
          variables,
          lastUpdated: new Date().toISOString().split('T')[0],
        });
        setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? updated : t));
        toast.success('Template updated');
      } else {
        const newTemplate = await createTemplate({
          ...formData,
          variables,
          lastUpdated: new Date().toISOString().split('T')[0],
          usageCount: 0,
        });
        setTemplates(prev => [...prev, newTemplate]);
        toast.success('Template created');
      }
      setIsEditDialogOpen(false);
    } catch (err) {
      toast.error('Failed to save template');
      console.error(err);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteTemplate(templateId);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      toast.success('Template deleted');
    } catch (err) {
      toast.error('Failed to delete template');
      console.error(err);
    }
  };

  const handleDuplicateTemplate = async (template: Template) => {
    try {
      const newTemplate = await createTemplate({
        ...template,
        id: undefined,
        name: `${template.name} (Copy)`,
        lastUpdated: new Date().toISOString().split('T')[0],
        usageCount: 0,
      });
      setTemplates(prev => [...prev, newTemplate]);
      toast.success('Template duplicated');
    } catch (err) {
      toast.error('Failed to duplicate template');
      console.error(err);
    }
  };

  const filteredTemplates = filterCategory === 'all' 
    ? templates 
    : templates.filter(t => t.type === filterCategory);

  return (
    <div className="space-y-4">
      {/* Header and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Email & Notification Templates</h3>
          <p className="text-sm text-muted-foreground">
            Manage global templates for emails, notifications, and campaigns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 text-foreground border-border" onClick={() => setIsSettingsDialogOpen(true)}>
            <Settings className="h-4 w-4" /> Settings
          </Button>
          <Button className="gap-2" onClick={handleNewTemplate}>
            <Plus className="h-4 w-4" /> New Template
          </Button>
        </div>
      </div>

      {/* Template Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={filterCategory === 'all' ? 'default' : 'secondary'} className="cursor-pointer" onClick={() => setFilterCategory('all')}>
          All Templates ({templates.length})
        </Badge>
        <Badge variant={filterCategory === 'transactional' ? 'default' : 'outline'} className="cursor-pointer text-foreground border-border" onClick={() => setFilterCategory('transactional')}>
          <Mail className="h-3 w-3 mr-1" /> Transactional ({templates.filter(t => t.type === 'transactional').length})
        </Badge>
        <Badge variant={filterCategory === 'notification' ? 'default' : 'outline'} className="cursor-pointer text-foreground border-border" onClick={() => setFilterCategory('notification')}>
          <Bell className="h-3 w-3 mr-1" /> Notifications ({templates.filter(t => t.type === 'notification').length})
        </Badge>
        <Badge variant={filterCategory === 'marketing' ? 'default' : 'outline'} className="cursor-pointer text-foreground border-border" onClick={() => setFilterCategory('marketing')}>
          <Megaphone className="h-3 w-3 mr-1" /> Marketing ({templates.filter(t => t.type === 'marketing').length})
        </Badge>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white ${typeColors[template.type]}`}>
                    {typeIcons[template.type]}
                  </div>
                  <div>
                    <CardTitle className="text-sm text-foreground">{template.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{template.category}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/80" onClick={() => handleDeleteTemplate(template.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{template.description}</p>
              <div className="flex flex-wrap gap-1">
                {template.variables.slice(0, 3).map(v => (
                  <Badge key={v} variant="outline" className="text-xs font-mono text-foreground border-border">{v}</Badge>
                ))}
                {template.variables.length > 3 && (
                  <Badge variant="outline" className="text-xs text-foreground border-border">
                    +{template.variables.length - 3} more
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                <span>Used {template.usageCount.toLocaleString()} times</span>
                <span>Updated {template.lastUpdated}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm"
