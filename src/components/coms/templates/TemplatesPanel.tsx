import React, { useEffect, useState } from 'react';
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
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '@/api/templatesApi';

/* ================= TYPES ================= */

type TemplateType = 'transactional' | 'notification' | 'marketing';

interface Template {
  id: string;
  name: string;
  type: TemplateType;
  category: string;
  description: string;
  subject: string;
  body: string;
  variables: string[];
  lastUpdated: string;
  usageCount: number;
}

interface TemplateInput {
  name: string;
  type: TemplateType;
  category: string;
  description: string;
  subject: string;
  body: string;
}

/* ================= HELPERS ================= */

const today = (): string => {
  return new Date().toISOString().split('T')[0];
};

const extractVariables = (text: string): string[] => {
  const matches = text.match(/\{\{[^}]+\}\}/g);
  return matches ? matches : [];
};

const initialFormState: TemplateInput = {
  name: '',
  type: 'transactional',
  category: '',
  description: '',
  subject: '',
  body: '',
};

/* ================= COMPONENT ================= */

export function TemplatesPanel() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [formData, setFormData] = useState<TemplateInput>(initialFormState);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const [filter, setFilter] = useState<'all' | TemplateType>('all');

  /* ================= LOAD ================= */

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data: Template[] = await getTemplates();
        setTemplates(data);
      } catch (error) {
        toast.error('Failed to load templates');
        console.error(error);
      }
    };

    loadTemplates();
  }, []);

  /* ================= ACTIONS ================= */

  const openCreate = () => {
    setEditingTemplate(null);
    setFormData(initialFormState);
    setIsEditOpen(true);
  };

  const openEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      category: template.category,
      description: template.description,
      subject: template.subject,
      body: template.body,
    });
    setIsEditOpen(true);
  };

  const openPreview = (template: Template) => {
    setPreviewTemplate(template);
    setActiveTab('preview');
    setIsPreviewOpen(true);
  };

  const saveTemplate = async () => {
    if (!formData.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    const variables = extractVariables(formData.body);

    try {
      if (editingTemplate) {
        const updated = await updateTemplate(editingTemplate.id, {
          ...formData,
          variables,
          lastUpdated: today(),
        });

        setTemplates(prev =>
          prev.map(t => (t.id === editingTemplate.id ? updated : t))
        );

        toast.success('Template updated');
      } else {
        const created = await createTemplate({
          ...formData,
          variables,
          lastUpdated: today(),
          usageCount: 0,
        });

        setTemplates(prev => [...prev, created]);
        toast.success('Template created');
      }

      setIsEditOpen(false);
    } catch (error) {
      toast.error('Failed to save template');
      console.error(error);
    }
  };

  const removeTemplate = async (id: string) => {
    try {
      await deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template deleted');
    } catch (error) {
      toast.error('Failed to delete template');
      console.error(error);
    }
  };

  const duplicateTemplate = async (template: Template) => {
    try {
      const created = await createTemplate({
        name: `${template.name} (Copy)`,
        type: template.type,
        category: template.category,
        description: template.description,
        subject: template.subject,
        body: template.body,
        variables: template.variables,
        lastUpdated: today(),
        usageCount: 0,
      });

      setTemplates(prev => [...prev, created]);
      toast.success('Template duplicated');
    } catch (error) {
      toast.error('Failed to duplicate template');
      console.error(error);
    }
  };

  /* ================= FILTER ================= */

  const visibleTemplates =
    filter === 'all'
      ? templates
      : templates.filter(t => t.type === filter);

  /* ================= UI ================= */

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Email & Notification Templates</h3>
          <p className="text-sm text-muted-foreground">
            Manage your global templates
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>

          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            New Template
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Badge
          variant={filter === 'all' ? 'default' : 'secondary'}
          className="cursor-pointer"
          onClick={() => setFilter('all')}
        >
          All ({templates.length})
        </Badge>

        {(['transactional', 'notification', 'marketing'] as TemplateType[]).map(type => (
          <Badge
            key={type}
            variant={filter === type ? 'default' : 'outline'}
            className="cursor-pointer capitalize"
            onClick={() => setFilter(type)}
          >
            {type}
          </Badge>
        ))}
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleTemplates.map(template => (
          <Card key={template.id}>
            <CardHeader>
              <CardTitle className="text-sm">{template.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{template.category}</p>
            </CardHeader>

            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>

              <div className="flex gap-1 flex-wrap">
                {template.variables.slice(0, 3).map(variable => (
                  <Badge key={variable} variant="outline" className="text-xs font-mono">
                    {variable}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => openPreview(template)}>
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </Button>

                <Button size="sm" variant="outline" onClick={() => openEdit(template)}>
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>

                <Button size="sm" variant="ghost" onClick={() => duplicateTemplate(template)}>
                  <Copy className="h-3 w-3" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => removeTemplate(template.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
            <DialogDescription>
              Configure template details below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              placeholder="Template Name"
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
            />

            <Input
              placeholder="Category"
              value={formData.category}
              onChange={e =>
                setFormData(prev => ({ ...prev, category: e.target.value }))
              }
            />

            <Textarea
              placeholder="Subject"
              value={formData.subject}
              onChange={e =>
                setFormData(prev => ({ ...prev, subject: e.target.value }))
              }
            />

            <Textarea
              placeholder="Body"
              value={formData.body}
              onChange={e =>
                setFormData(prev => ({ ...prev, body: e.target.value }))
              }
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveTemplate}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
