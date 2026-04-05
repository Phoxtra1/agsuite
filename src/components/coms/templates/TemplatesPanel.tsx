import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  body: string;
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
    subject: 'Welcome to {{product}}, {{name}}!',
    body: 'Hello {{name}},\n\nWelcome to {{product}}! We are excited to have you on board.\n\nYour account has been successfully created with the email {{email}}.\n\nBest regards,\nAmineva Team',
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
    subject: 'Password Reset Request',
    body: 'Hello {{name}},\n\nYou requested a password reset. Use the following OTP: {{otp}}\n\nOr click this link: {{link}}\n\nThis expires in 15 minutes.',
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
    subject: 'Invoice #{{invoice_number}} Ready',
    body: 'Dear {{name}},\n\nYour invoice #{{invoice_number}} for {{amount}} is ready.\n\nDue date: {{due_date}}\n\nPlease find the attached PDF.',
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
    body: 'Attention!\n\nProduct: {{product_name}}\nSKU: {{sku}}\nCurrent Stock: {{current_stock}}\nThreshold: {{threshold}}\n\nPlease reorder soon.',
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
    subject: '{{month}} Newsletter from Amineva',
    body: 'Hello {{name}},\n\nHere is your {{month}} newsletter!\n\nFeatured Products:\n{{featured_products}}\n\nStay tuned for more updates.',
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

export function TemplatesPanel() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(initialFormData);
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Load templates from DB
  useEffect(() => {
    const loadTemplates = async () => {
      const { data } = await supabase
        .from('coms_templates')
        .select('*')
        .order('updated_at', { ascending: false });

      if (data && data.length > 0) {
        setTemplates(data.map(t => ({
          id: t.id,
          name: t.name,
          type: t.type as Template['type'],
          category: t.category,
          description: '',
          subject: t.subject || '',
          body: t.body,
          variables: t.variables || [],
          lastUpdated: t.updated_at.split('T')[0],
          usageCount: t.usage_count,
        })));
      } else {
        // Seed with initial templates if DB is empty
        setTemplates(initialTemplates);
      }
    };
    loadTemplates();
  }, []);

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setFormData(initialFormData);
    setIsEditDialogOpen(true);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      category: template.category,
      description: template.description,
      subject: template.subject,
      body: template.body,
    });
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

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    const variables = formData.body.match(/\{\{[^}]+\}\}/g) || [];

    if (editingTemplate) {
      if (userId) {
        await supabase.from('coms_templates').update({
          name: formData.name,
          type: formData.type,
          category: formData.category,
          subject: formData.subject,
          body: formData.body,
          variables,
        }).eq('id', editingTemplate.id);
      }
      setTemplates(prev => prev.map(t => 
        t.id === editingTemplate.id 
          ? { ...t, ...formData, variables, lastUpdated: new Date().toISOString().split('T')[0] }
          : t
      ));
      toast.success('Template updated');
    } else {
      let newId = `template-${Date.now()}`;
      if (userId) {
        const { data: newRow } = await supabase.from('coms_templates').insert({
          user_id: userId,
          name: formData.name,
          type: formData.type,
          category: formData.category,
          subject: formData.subject,
          body: formData.body,
          variables,
        }).select().single();
        if (newRow) newId = newRow.id;
      }
      const newTemplate: Template = {
        id: newId,
        ...formData,
        variables,
        lastUpdated: new Date().toISOString().split('T')[0],
        usageCount: 0,
      };
      setTemplates(prev => [newTemplate, ...prev]);
      toast.success('Template created');
    }

    setIsEditDialogOpen(false);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    await supabase.from('coms_templates').delete().eq('id', templateId);
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    toast.success('Template deleted');
  };

  const handleDuplicateTemplate = async (template: Template) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    let newId = `template-${Date.now()}`;
    
    if (userId) {
      const { data: newRow } = await supabase.from('coms_templates').insert({
        user_id: userId,
        name: `${template.name} (Copy)`,
        type: template.type,
        category: template.category,
        subject: template.subject,
        body: template.body,
        variables: template.variables,
      }).select().single();
      if (newRow) newId = newRow.id;
    }

    const newTemplate: Template = {
      ...template,
      id: newId,
      name: `${template.name} (Copy)`,
      lastUpdated: new Date().toISOString().split('T')[0],
      usageCount: 0,
    };
    setTemplates(prev => [...prev, newTemplate]);
    toast.success('Template duplicated');
  };

  const filteredTemplates = filterCategory === 'all' 
    ? templates 
    : templates.filter(t => t.type === filterCategory);

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
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 text-foreground border-border"
            onClick={() => setIsSettingsDialogOpen(true)}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button className="gap-2" onClick={handleNewTemplate}>
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        </div>
      </div>

      {/* Template Categories */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge 
          variant={filterCategory === 'all' ? 'default' : 'secondary'} 
          className="cursor-pointer"
          onClick={() => setFilterCategory('all')}
        >
          All Templates ({templates.length})
        </Badge>
        <Badge 
          variant={filterCategory === 'transactional' ? 'default' : 'outline'} 
          className="cursor-pointer text-foreground border-border"
          onClick={() => setFilterCategory('transactional')}
        >
          <Mail className="h-3 w-3 mr-1" />
          Transactional ({templates.filter(t => t.type === 'transactional').length})
        </Badge>
        <Badge 
          variant={filterCategory === 'notification' ? 'default' : 'outline'} 
          className="cursor-pointer text-foreground border-border"
          onClick={() => setFilterCategory('notification')}
        >
          <Bell className="h-3 w-3 mr-1" />
          Notifications ({templates.filter(t => t.type === 'notification').length})
        </Badge>
        <Badge 
          variant={filterCategory === 'marketing' ? 'default' : 'outline'} 
          className="cursor-pointer text-foreground border-border"
          onClick={() => setFilterCategory('marketing')}
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
                    <p className="text-xs text-muted-foreground">{template.category}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive hover:text-destructive/80"
                  onClick={() => handleDeleteTemplate(template.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{template.description}</p>
              
              <div className="flex flex-wrap gap-1">
                {template.variables.slice(0, 3).map((variable) => (
                  <Badge key={variable} variant="outline" className="text-xs font-mono text-foreground border-border">
                    {variable}
                  </Badge>
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 gap-1 text-foreground border-border"
                  onClick={() => handlePreviewTemplate(template)}
                >
                  <Eye className="h-3 w-3" />
                  Preview
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 gap-1 text-foreground border-border"
                  onClick={() => handleEditTemplate(template)}
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-foreground"
                  onClick={() => handleDuplicateTemplate(template)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview/Edit Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <FileText className="h-5 w-5" />
              {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>{selectedTemplate?.description}</DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'preview' | 'edit')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview" className="gap-2 text-foreground">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="edit" className="gap-2 text-foreground">
                <Edit className="h-4 w-4" />
                Edit
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-foreground">Subject</Label>
                <div className="p-3 bg-muted rounded-md text-sm text-foreground">
                  {selectedTemplate?.subject}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Body</Label>
                <div className="p-4 bg-muted rounded-md text-sm whitespace-pre-wrap text-foreground">
                  {selectedTemplate?.body}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Variables</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate?.variables.map((v) => (
                    <Badge key={v} variant="outline" className="font-mono text-foreground border-border">{v}</Badge>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="edit" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-subject" className="text-foreground">Subject</Label>
                <Input 
                  id="edit-subject"
                  value={selectedTemplate?.subject || ''}
                  onChange={(e) => {
                    if (selectedTemplate) {
                      setSelectedTemplate({ ...selectedTemplate, subject: e.target.value });
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-body" className="text-foreground">Body</Label>
                <Textarea 
                  id="edit-body"
                  value={selectedTemplate?.body || ''}
                  onChange={(e) => {
                    if (selectedTemplate) {
                      setSelectedTemplate({ ...selectedTemplate, body: e.target.value });
                    }
                  }}
                  className="min-h-[200px]"
                />
              </div>
              <DialogFooter>
                <Button 
                  onClick={() => {
                    if (selectedTemplate) {
                      const variables = selectedTemplate.body.match(/\{\{[^}]+\}\}/g) || [];
                      setTemplates(prev => prev.map(t => 
                        t.id === selectedTemplate.id 
                          ? { ...selectedTemplate, variables, lastUpdated: new Date().toISOString().split('T')[0] }
                          : t
                      ));
                      toast.success('Template saved');
                      setIsPreviewDialogOpen(false);
                    }
                  }}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* New/Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate ? 'Update template details' : 'Create a new email or notification template'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-foreground">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Template name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-foreground">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., billing, security"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground">Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as any }))}
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

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-foreground">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subject" className="text-foreground">Subject Line</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject with {{variables}}"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="body" className="text-foreground">Template Body</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Template content with {{variables}}..."
                className="min-h-[150px]"
              />
              <p className="text-xs text-muted-foreground">
                Use {"{{variable}}"} syntax for dynamic content
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} className="gap-2">
              <Save className="h-4 w-4" />
              {editingTemplate ? 'Update' : 'Create'} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Settings className="h-5 w-5" />
              Template Settings
            </DialogTitle>
            <DialogDescription>
              Configure global template settings and defaults
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground">Default Sender Name</Label>
              <Input placeholder="Amineva Team" defaultValue="Amineva Team" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Default Reply-To</Label>
              <Input placeholder="support@amineva.com" defaultValue="support@amineva.com" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Footer Text</Label>
              <Textarea 
                placeholder="Email footer text..."
                defaultValue="© 2025 Amineva Global. All rights reserved."
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success('Settings saved');
              setIsSettingsDialogOpen(false);
            }}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
