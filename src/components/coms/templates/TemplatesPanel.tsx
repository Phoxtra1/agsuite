import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Plus, 
  FileText, 
  Mail, 
  Bell, 
  Megaphone,
  Edit,
  Copy,
  Trash2,
  MoreHorizontal,
  Eye,
  Settings,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  type: 'transactional' | 'notification' | 'marketing';
  category: string;
  description: string;
  subject: string;
  content: string;
  variables: string[];
  lastUpdated: string;
  usageCount: number;
}

const initialTemplates: Template[] = [
  {
    id: '1',
    name: 'Welcome Email',
    type: 'transactional',
    category: 'onboarding',
    description: 'Sent to new users after registration',
    subject: 'Welcome to Amineva, {{name}}!',
    content: 'Hello {{name}},\n\nWelcome to {{product}}! We are excited to have you on board.\n\nBest regards,\nThe Amineva Team',
    variables: ['{{name}}', '{{email}}', '{{product}}'],
    lastUpdated: '2025-01-28',
    usageCount: 1245,
  },
  {
    id: '2',
    name: 'Password Reset',
    type: 'transactional',
    category: 'security',
    description: 'Password reset link with OTP',
    subject: 'Reset Your Password',
    content: 'Hello {{name}},\n\nYour OTP is: {{otp}}\n\nClick here to reset: {{link}}\n\nThis link expires in 15 minutes.',
    variables: ['{{name}}', '{{otp}}', '{{link}}'],
    lastUpdated: '2025-01-25',
    usageCount: 532,
  },
  {
    id: '3',
    name: 'Invoice Notification',
    type: 'transactional',
    category: 'billing',
    description: 'Invoice ready notification with PDF attachment',
    subject: 'Invoice #{{invoice_number}} is Ready',
    content: 'Hello {{name}},\n\nYour invoice #{{invoice_number}} for {{amount}} is ready.\n\nDue date: {{due_date}}\n\nThank you for your business!',
    variables: ['{{name}}', '{{invoice_number}}', '{{amount}}', '{{due_date}}'],
    lastUpdated: '2025-01-20',
    usageCount: 2103,
  },
  {
    id: '4',
    name: 'Low Stock Alert',
    type: 'notification',
    category: 'system',
    description: 'Alert when product inventory falls below threshold',
    subject: 'Low Stock Alert: {{product_name}}',
    content: 'Alert: {{product_name}} (SKU: {{sku}}) has fallen below the minimum threshold.\n\nCurrent stock: {{current_stock}}\nThreshold: {{threshold}}\n\nPlease reorder soon.',
    variables: ['{{product_name}}', '{{sku}}', '{{current_stock}}', '{{threshold}}'],
    lastUpdated: '2025-01-22',
    usageCount: 456,
  },
  {
    id: '5',
    name: 'Monthly Newsletter',
    type: 'marketing',
    category: 'newsletter',
    description: 'Monthly update with news and promotions',
    subject: '{{month}} Newsletter - What\'s New at Amineva',
    content: 'Hello {{name}},\n\nHere\'s what\'s happening this {{month}}:\n\n{{featured_products}}\n\nStay tuned for more updates!',
    variables: ['{{name}}', '{{month}}', '{{featured_products}}'],
    lastUpdated: '2025-01-15',
    usageCount: 12,
  },
];

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

interface TemplateFormData {
  name: string;
  type: 'transactional' | 'notification' | 'marketing';
  category: string;
  description: string;
  subject: string;
  content: string;
}

const initialFormData: TemplateFormData = {
  name: '',
  type: 'transactional',
  category: '',
  description: '',
  subject: '',
  content: '',
};

export function TemplatesPanel() {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(initialFormData);
  const [filterType, setFilterType] = useState<string>('all');

  const handleNewTemplate = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (template: Template) => {
    setFormData({
      name: template.name,
      type: template.type,
      category: template.category,
      description: template.description,
      subject: template.subject,
      content: template.content,
    });
    setEditingId(template.id);
    setIsEditorOpen(true);
  };

  const handlePreview = (template: Template) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Template name is required');
      return;
    }
    if (!formData.subject.trim()) {
      toast.error('Subject line is required');
      return;
    }

    // Extract variables from content
    const variableRegex = /\{\{[a-zA-Z_]+\}\}/g;
    const variables = [...new Set([
      ...(formData.subject.match(variableRegex) || []),
      ...(formData.content.match(variableRegex) || [])
    ])];

    if (editingId) {
      setTemplates(prev => prev.map(t => 
        t.id === editingId 
          ? { ...t, ...formData, variables, lastUpdated: new Date().toISOString().split('T')[0] }
          : t
      ));
      toast.success('Template updated');
    } else {
      const newTemplate: Template = {
        id: `template-${Date.now()}`,
        ...formData,
        variables,
        lastUpdated: new Date().toISOString().split('T')[0],
        usageCount: 0,
      };
      setTemplates(prev => [...prev, newTemplate]);
      toast.success('Template created');
    }

    setIsEditorOpen(false);
    setEditingId(null);
  };

  const handleDuplicate = (template: Template) => {
    const newTemplate: Template = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Copy)`,
      usageCount: 0,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    setTemplates(prev => [...prev, newTemplate]);
    toast.success('Template duplicated');
  };

  const handleDelete = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    toast.success('Template deleted');
  };

  const filteredTemplates = filterType === 'all' 
    ? templates 
    : templates.filter(t => t.type === filterType);

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Email & Notification Templates</h3>
          <p className="text-sm text-muted-foreground">
            Manage global templates for emails, notifications, and campaigns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={handleNewTemplate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        </div>
      </div>

      {/* Template Categories */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge 
          variant={filterType === 'all' ? 'default' : 'secondary'} 
          className="cursor-pointer hover:bg-primary/80"
          onClick={() => setFilterType('all')}
        >
          All Templates ({templates.length})
        </Badge>
        <Badge 
          variant={filterType === 'transactional' ? 'default' : 'outline'} 
          className="cursor-pointer hover:bg-muted"
          onClick={() => setFilterType('transactional')}
        >
          <Mail className="h-3 w-3 mr-1" />
          Transactional ({templates.filter(t => t.type === 'transactional').length})
        </Badge>
        <Badge 
          variant={filterType === 'notification' ? 'default' : 'outline'} 
          className="cursor-pointer hover:bg-muted"
          onClick={() => setFilterType('notification')}
        >
          <Bell className="h-3 w-3 mr-1" />
          Notifications ({templates.filter(t => t.type === 'notification').length})
        </Badge>
        <Badge 
          variant={filterType === 'marketing' ? 'default' : 'outline'} 
          className="cursor-pointer hover:bg-muted"
          onClick={() => setFilterType('marketing')}
        >
          <Megaphone className="h-3 w-3 mr-1" />
          Marketing ({templates.filter(t => t.type === 'marketing').length})
        </Badge>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white ${typeColors[template.type]}`}>
                    {typeIcons[template.type]}
                  </div>
                  <div>
                    <CardTitle className="text-sm text-foreground">{template.name}</CardTitle>
                    <p className="text-xs text-muted-foreground capitalize">{template.category}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => handleDelete(template.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{template.description}</p>
              
              <div className="flex flex-wrap gap-1">
                {template.variables.slice(0, 3).map((variable) => (
                  <Badge key={variable} variant="outline" className="text-xs font-mono">
                    {variable}
                  </Badge>
                ))}
                {template.variables.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{template.variables.length - 3} more
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                <span>Used {template.usageCount.toLocaleString()} times</span>
                <span>Updated {template.lastUpdated}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 gap-1"
                  onClick={() => handlePreview(template)}
                >
                  <Eye className="h-3 w-3" />
                  Preview
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 gap-1"
                  onClick={() => handleEdit(template)}
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => handleDuplicate(template)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Template Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <FileText className="h-5 w-5" />
              {editingId ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
            <DialogDescription>
              {editingId ? 'Update the template details below' : 'Fill in the details to create a new template'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Template Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Welcome Email"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as typeof formData.type }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transactional">Transactional</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Category</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., onboarding, billing"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Subject Line</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="e.g., Welcome to Amineva, {{name}}!"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Email Body</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your email content here. Use {{variable}} for dynamic content."
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                Supported variables: {"{{name}}"}, {"{{email}}"}, {"{{product}}"}, {"{{link}}"}, etc.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditorOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>
              {editingId ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Eye className="h-5 w-5" />
              Template Preview: {previewTemplate?.name}
            </DialogTitle>
          </DialogHeader>

          {previewTemplate && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">Subject:</span>
                  <span className="text-muted-foreground">{previewTemplate.subject}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">Type:</span>
                  <Badge className={`${typeColors[previewTemplate.type]} text-white`}>
                    {previewTemplate.type}
                  </Badge>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">
                  {previewTemplate.content}
                </pre>
              </div>

              <div className="flex flex-wrap gap-1">
                <span className="text-sm font-medium text-foreground">Variables:</span>
                {previewTemplate.variables.map((v) => (
                  <Badge key={v} variant="outline" className="font-mono text-xs">{v}</Badge>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Close</Button>
            <Button onClick={() => {
              setIsPreviewOpen(false);
              if (previewTemplate) handleEdit(previewTemplate);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Settings className="h-5 w-5" />
              Template Settings
            </DialogTitle>
            <DialogDescription>
              Configure global template settings and branding
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground">Default Sender Name</Label>
              <Input defaultValue="Amineva Team" placeholder="Sender name" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Default From Email</Label>
              <Input defaultValue="noreply@amineva.com" placeholder="email@domain.com" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Footer Text</Label>
              <Textarea 
                defaultValue="© 2025 Amineva Global. All rights reserved." 
                placeholder="Email footer text"
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              toast.success('Settings saved');
              setIsSettingsOpen(false);
            }}>Save Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}