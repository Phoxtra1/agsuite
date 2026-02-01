import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Play, 
  Pause, 
  MoreHorizontal, 
  Mail, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'scheduled' | 'completed' | 'draft' | 'paused';
  type: 'marketing' | 'newsletter' | 'transactional' | 'announcement';
  audience: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  scheduledAt: string | null;
  createdAt: string;
  subject: string;
  content: string;
}

const initialCampaigns: Campaign[] = [
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
    subject: 'Exclusive February Deals Inside!',
    content: 'Hello {{name}}, check out our exclusive February promotions...',
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
    subject: 'Introducing Our Latest Product',
    content: 'Dear {{name}}, we are excited to announce...',
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
    subject: 'Weekly Digest - Issue #42',
    content: 'Hello {{name}}, here is your weekly update...',
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
    subject: 'We Value Your Feedback',
    content: 'Dear {{name}}, please take a moment to complete our survey...',
  },
];

const audienceGroups = [
  { id: 'all', name: 'All Users', count: 12500 },
  { id: 'agstock', name: 'AGStock Users', count: 3420 },
  { id: 'agis', name: 'AGIS Users', count: 1890 },
  { id: 'newsletter', name: 'Newsletter Subscribers', count: 8560 },
  { id: 'premium', name: 'Premium Users', count: 450 },
];

const statusStyles: Record<string, { color: string; icon: React.ReactNode }> = {
  active: { color: 'bg-emerald-500', icon: <Play className="h-3 w-3" /> },
  scheduled: { color: 'bg-blue-500', icon: <Clock className="h-3 w-3" /> },
  completed: { color: 'bg-gray-500', icon: <CheckCircle className="h-3 w-3" /> },
  draft: { color: 'bg-amber-500', icon: <XCircle className="h-3 w-3" /> },
  paused: { color: 'bg-red-500', icon: <Pause className="h-3 w-3" /> },
};

interface CampaignFormData {
  name: string;
  type: Campaign['type'];
  subject: string;
  content: string;
  audienceId: string;
  scheduledAt: string;
}

const initialFormData: CampaignFormData = {
  name: '',
  type: 'marketing',
  subject: '',
  content: '',
  audienceId: 'all',
  scheduledAt: '',
};

export function CampaignsPanel() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState<CampaignFormData>(initialFormData);

  const handleNewCampaign = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (campaign: Campaign) => {
    setFormData({
      name: campaign.name,
      type: campaign.type,
      subject: campaign.subject,
      content: campaign.content,
      audienceId: 'all',
      scheduledAt: campaign.scheduledAt || '',
    });
    setEditingId(campaign.id);
    setIsEditorOpen(true);
  };

  const handlePreview = (campaign: Campaign) => {
    setPreviewCampaign(campaign);
    setIsPreviewOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Campaign name is required');
      return;
    }
    if (!formData.subject.trim()) {
      toast.error('Subject line is required');
      return;
    }

    const audience = audienceGroups.find(g => g.id === formData.audienceId);
    const audienceCount = audience?.count || 0;

    if (editingId) {
      setCampaigns(prev => prev.map(c => 
        c.id === editingId 
          ? { 
              ...c, 
              name: formData.name,
              type: formData.type,
              subject: formData.subject,
              content: formData.content,
              scheduledAt: formData.scheduledAt || null,
              audience: audienceCount,
            }
          : c
      ));
      toast.success('Campaign updated');
    } else {
      const newCampaign: Campaign = {
        id: `campaign-${Date.now()}`,
        name: formData.name,
        status: formData.scheduledAt ? 'scheduled' : 'draft',
        type: formData.type,
        audience: audienceCount,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        scheduledAt: formData.scheduledAt || null,
        createdAt: new Date().toISOString().split('T')[0],
        subject: formData.subject,
        content: formData.content,
      };
      setCampaigns(prev => [...prev, newCampaign]);
      toast.success('Campaign created');
    }

    setIsEditorOpen(false);
    setEditingId(null);
  };

  const handleToggleStatus = (campaignId: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id !== campaignId) return c;
      if (c.status === 'active') return { ...c, status: 'paused' as const };
      if (c.status === 'paused' || c.status === 'draft') return { ...c, status: 'active' as const };
      return c;
    }));
    toast.success('Campaign status updated');
  };

  const handleDelete = (campaignId: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== campaignId));
    toast.success('Campaign deleted');
  };

  const activeCount = campaigns.filter(c => c.status === 'active').length;
  const scheduledCount = campaigns.filter(c => c.status === 'scheduled').length;
  const totalReach = campaigns.reduce((sum, c) => sum + c.audience, 0);
  const avgOpenRate = campaigns.filter(c => c.delivered > 0).length > 0
    ? Math.round(
        campaigns.filter(c => c.delivered > 0)
          .reduce((sum, c) => sum + (c.opened / c.delivered) * 100, 0) / 
        campaigns.filter(c => c.delivered > 0).length
      )
    : 0;

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Email Campaigns</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage bulk email campaigns, newsletters, and announcements
          </p>
        </div>
        <Button onClick={handleNewCampaign} className="gap-2">
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
                <p className="text-xl font-bold text-foreground">{activeCount}</p>
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
                <p className="text-xl font-bold text-foreground">{scheduledCount}</p>
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
                <p className="text-xl font-bold text-foreground">{(totalReach / 1000).toFixed(1)}K</p>
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
                <p className="text-xl font-bold text-foreground">{avgOpenRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-foreground">All Campaigns</CardTitle>
          <CardDescription>Manage your email campaigns and track performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.map((campaign) => {
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
                      <h4 className="font-medium text-foreground">{campaign.name}</h4>
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
                            <span className="text-foreground">{deliveryRate}%</span>
                          </div>
                          <Progress value={deliveryRate} className="h-1" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Opened</span>
                            <span className="text-foreground">{openRate}%</span>
                          </div>
                          <Progress value={openRate} className="h-1" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Clicked</span>
                            <span className="text-foreground">{clickRate}%</span>
                          </div>
                          <Progress value={clickRate} className="h-1" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handlePreview(campaign)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {(campaign.status === 'active' || campaign.status === 'paused' || campaign.status === 'draft') && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleToggleStatus(campaign.id)}
                      >
                        {campaign.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEdit(campaign)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(campaign.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Campaign Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Mail className="h-5 w-5" />
              {editingId ? 'Edit Campaign' : 'Create New Campaign'}
            </DialogTitle>
            <DialogDescription>
              {editingId ? 'Update the campaign details below' : 'Set up your new email campaign'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Campaign Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., February Newsletter"
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
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                    <SelectItem value="transactional">Transactional</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Target Audience</Label>
                <Select
                  value={formData.audienceId}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, audienceId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {audienceGroups.map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name} ({group.count.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Schedule (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Subject Line</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="e.g., Exciting news from Amineva!"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Email Content</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your email content here. Use {{variable}} for personalization."
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                Variables: {"{{name}}"}, {"{{email}}"}, {"{{product}}"}, {"{{unsubscribe_link}}"}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditorOpen(false)}>Cancel</Button>
            <Button variant="outline" onClick={() => {
              handleSave();
            }}>Save as Draft</Button>
            <Button onClick={() => {
              handleSave();
            }}>
              {formData.scheduledAt ? 'Schedule Campaign' : 'Save Campaign'}
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
              Campaign Preview: {previewCampaign?.name}
            </DialogTitle>
          </DialogHeader>

          {previewCampaign && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">Subject:</span>
                  <span className="text-muted-foreground">{previewCampaign.subject}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">Status:</span>
                  <Badge className={`${statusStyles[previewCampaign.status].color} text-white`}>
                    {previewCampaign.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">Audience:</span>
                  <span className="text-muted-foreground">{previewCampaign.audience.toLocaleString()} recipients</span>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">
                  {previewCampaign.content}
                </pre>
              </div>

              {previewCampaign.sent > 0 && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{previewCampaign.delivered.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Delivered</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{previewCampaign.opened.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Opened</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{previewCampaign.clicked.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Clicked</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Close</Button>
            <Button onClick={() => {
              setIsPreviewOpen(false);
              if (previewCampaign) handleEdit(previewCampaign);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}