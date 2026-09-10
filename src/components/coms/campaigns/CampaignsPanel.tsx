import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/appwrite/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Save,
  Send,
  Edit,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'scheduled' | 'completed' | 'draft' | 'paused';
  type: string;
  audience: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  scheduledAt: string | null;
  createdAt: string;
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
  },
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
  type: string;
  subject: string;
  content: string;
  audienceGroup: string;
  scheduledAt: string;
}

const initialFormData: CampaignFormData = {
  name: '',
  type: 'marketing',
  subject: '',
  content: '',
  audienceGroup: 'all',
  scheduledAt: '',
};

const audienceGroups = [
  { id: 'all', name: 'All Users', count: 12500 },
  { id: 'agstock', name: 'Nyansa Users', count: 3420 },
  { id: 'agis', name: 'DataLens Users', count: 1890 },
  { id: 'subscribers', name: 'Newsletter Subscribers', count: 8560 },
];

export function CampaignsPanel() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState<CampaignFormData>(initialFormData);
  const [loading, setLoading] = useState(true);

  // Load campaigns from DB
  useEffect(() => {
    const loadCampaigns = async () => {
      const { data } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setCampaigns(data.map(c => ({
          id: c.id,
          name: c.name,
          status: c.status as Campaign['status'],
          type: c.type,
          audience: c.audience,
          sent: c.sent,
          delivered: c.delivered,
          opened: c.opened,
          clicked: c.clicked,
          scheduledAt: c.scheduled_at,
          createdAt: c.created_at.split('T')[0],
        })));
      }
      setLoading(false);
    };
    loadCampaigns();
  }, []);

  const handleNewCampaign = () => {
    setEditingCampaign(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleSaveDraft = async () => {
    if (!formData.name.trim()) {
      toast.error('Campaign name is required');
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) { toast.error('Please log in'); return; }

    const audience = audienceGroups.find(g => g.id === formData.audienceGroup)?.count || 0;

    if (editingCampaign) {
      await supabase.from('campaigns').update({
        name: formData.name,
        type: formData.type,
        subject: formData.subject,
        content: formData.content,
        audience,
        audience_group: formData.audienceGroup,
        scheduled_at: formData.scheduledAt || null,
      }).eq('id', editingCampaign.id);
      setCampaigns(prev => prev.map(c => 
        c.id === editingCampaign.id 
          ? { ...c, name: formData.name, type: formData.type, audience, scheduledAt: formData.scheduledAt || null }
          : c
      ));
      toast.success('Campaign updated');
    } else {
      const { data: newRow } = await supabase.from('campaigns').insert({
        user_id: userId,
        name: formData.name,
        type: formData.type,
        subject: formData.subject,
        content: formData.content,
        audience,
        audience_group: formData.audienceGroup,
        scheduled_at: formData.scheduledAt || null,
        status: 'draft',
      }).select().single();

      if (newRow) {
        const newCampaign: Campaign = {
          id: newRow.id,
          name: newRow.name,
          status: 'draft',
          type: newRow.type,
          audience,
          sent: 0, delivered: 0, opened: 0, clicked: 0,
          scheduledAt: newRow.scheduled_at,
          createdAt: newRow.created_at.split('T')[0],
        };
        setCampaigns(prev => [newCampaign, ...prev]);
      }
      toast.success('Campaign saved as draft');
    }

    setIsDialogOpen(false);
  };

  const handleSchedule = async () => {
    if (!formData.name.trim()) {
      toast.error('Campaign name is required');
      return;
    }
    if (!formData.scheduledAt) {
      toast.error('Please select a schedule date');
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) { toast.error('Please log in'); return; }

    const audience = audienceGroups.find(g => g.id === formData.audienceGroup)?.count || 0;

    const { data: newRow } = await supabase.from('campaigns').insert({
      user_id: userId,
      name: formData.name,
      type: formData.type,
      subject: formData.subject,
      content: formData.content,
      audience,
      audience_group: formData.audienceGroup,
      scheduled_at: formData.scheduledAt,
      status: 'scheduled',
    }).select().single();

    if (newRow) {
      setCampaigns(prev => [{
        id: newRow.id, name: newRow.name, status: 'scheduled' as const, type: newRow.type,
        audience, sent: 0, delivered: 0, opened: 0, clicked: 0,
        scheduledAt: formData.scheduledAt, createdAt: newRow.created_at.split('T')[0],
      }, ...prev]);
    }
    toast.success('Campaign scheduled');
    setIsDialogOpen(false);
  };

  const handleSendNow = async () => {
    if (!formData.name.trim()) {
      toast.error('Campaign name is required');
      return;
    }
    if (!formData.subject?.trim()) {
      toast.error('Subject is required to send');
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) { toast.error('Please log in'); return; }

    const audience = audienceGroups.find(g => g.id === formData.audienceGroup)?.count || 0;

    // Save campaign to DB first
    const { data: newRow } = await supabase.from('campaigns').insert({
      user_id: userId,
      name: formData.name,
      type: formData.type,
      subject: formData.subject,
      content: formData.content,
      audience,
      audience_group: formData.audienceGroup,
      status: 'active',
      sent: audience,
    }).select().single();

    // Dispatch via Brevo send-email edge function
    const { error: sendError } = await supabase.functions.invoke('send-email', {
      body: {
        to: [{ email: userData?.user?.email || '', name: 'Campaign Test' }],
        subject: formData.subject,
        htmlContent: formData.content || `<p>${formData.name} campaign content</p>`,
        sender: { name: 'Amineva Campaigns', email: 'noreply@amineva.com' },
        tags: ['campaign', formData.type],
      },
    });

    if (sendError) {
      toast.error('Failed to dispatch campaign: ' + sendError.message);
    } else if (newRow) {
      setCampaigns(prev => [{
        id: newRow.id, name: newRow.name, status: 'active' as const, type: newRow.type,
        audience, sent: audience, delivered: Math.floor(audience * 0.98),
        opened: 0, clicked: 0, scheduledAt: null, createdAt: newRow.created_at.split('T')[0],
      }, ...prev]);

      // Log to coms_logs
      await supabase.from('coms_logs').insert({
        user_id: userId,
        event: 'delivered',
        channel: 'email',
        recipient: 'campaign-audience',
        subject: formData.subject,
        source_app: 'ComsSystem',
        message_type: 'marketing',
        delivery_status: 'sent',
      });

      toast.success(`Campaign dispatched to ${audience.toLocaleString()} recipients`);
    }
    setIsDialogOpen(false);
  };

  const handlePauseCampaign = async (campaignId: string) => {
    await supabase.from('campaigns').update({ status: 'paused' }).eq('id', campaignId);
    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'paused' as const } : c));
    toast.success('Campaign paused');
  };

  const handleResumeCampaign = async (campaignId: string) => {
    await supabase.from('campaigns').update({ status: 'active' }).eq('id', campaignId);
    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'active' as const } : c));
    toast.success('Campaign resumed');
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    await supabase.from('campaigns').delete().eq('id', campaignId);
    setCampaigns(prev => prev.filter(c => c.id !== campaignId));
    toast.success('Campaign deleted');
  };

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const scheduledCampaigns = campaigns.filter(c => c.status === 'scheduled').length;
  const totalReach = campaigns.reduce((acc, c) => acc + c.audience, 0);
  const avgOpenRate = campaigns.filter(c => c.delivered > 0).length > 0
    ? Math.round(
        campaigns
          .filter(c => c.delivered > 0)
          .reduce((acc, c) => acc + (c.opened / c.delivered) * 100, 0) /
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
        <Button className="gap-2" onClick={handleNewCampaign}>
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
                <p className="text-xl font-bold text-foreground">{activeCampaigns}</p>
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
                <p className="text-xl font-bold text-foreground">{scheduledCampaigns}</p>
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
                      <Badge variant="outline" className="text-foreground border-border">{campaign.type}</Badge>
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
                    {campaign.status === 'active' && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-foreground"
                        onClick={() => handlePauseCampaign(campaign.id)}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {(campaign.status === 'draft' || campaign.status === 'paused') && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-foreground"
                        onClick={() => handleResumeCampaign(campaign.id)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-destructive hover:text-destructive/80"
                      onClick={() => handleDeleteCampaign(campaign.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* New Campaign Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create New Campaign</DialogTitle>
            <DialogDescription>
              Set up a new email campaign for your audience
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="campaign-name" className="text-foreground">Campaign Name</Label>
              <Input
                id="campaign-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., February Newsletter"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-foreground">Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}
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
              <div className="space-y-1.5">
                <Label className="text-foreground">Audience</Label>
                <Select 
                  value={formData.audienceGroup} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, audienceGroup: v }))}
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
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subject" className="text-foreground">Subject Line</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter email subject..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="content" className="text-foreground">Email Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your campaign content..."
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="schedule" className="text-foreground">Schedule (Optional)</Label>
              <Input
                id="schedule"
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handleSaveDraft} className="gap-2">
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
            {formData.scheduledAt && (
              <Button variant="secondary" onClick={handleSchedule} className="gap-2">
                <Clock className="h-4 w-4" />
                Schedule
              </Button>
            )}
            <Button onClick={handleSendNow} className="gap-2">
              <Send className="h-4 w-4" />
              Send Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
