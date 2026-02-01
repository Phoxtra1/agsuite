import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Eye
} from 'lucide-react';

// Mock templates data
const mockTemplates = [
  {
    id: '1',
    name: 'Welcome Email',
    type: 'transactional',
    category: 'onboarding',
    description: 'Sent to new users after registration',
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
    variables: ['{{name}}', '{{month}}', '{{featured_products}}'],
    lastUpdated: '2025-01-15',
    usageCount: 12,
  },
  {
    id: '6',
    name: 'Promotional Campaign',
    type: 'marketing',
    category: 'promotion',
    description: 'General promotional email template',
    variables: ['{{name}}', '{{discount}}', '{{promo_code}}', '{{expiry}}'],
    lastUpdated: '2025-01-18',
    usageCount: 8,
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

export function TemplatesPanel() {
  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Email & Notification Templates</h3>
          <p className="text-sm text-muted-foreground">
            Manage global templates for emails, notifications, and campaigns
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Template Categories */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
          All Templates ({mockTemplates.length})
        </Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-muted">
          <Mail className="h-3 w-3 mr-1" />
          Transactional (3)
        </Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-muted">
          <Bell className="h-3 w-3 mr-1" />
          Notifications (1)
        </Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-muted">
          <Megaphone className="h-3 w-3 mr-1" />
          Marketing (2)
        </Badge>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockTemplates.map((template) => (
          <Card key={template.id} className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white ${typeColors[template.type]}`}>
                    {typeIcons[template.type]}
                  </div>
                  <div>
                    <CardTitle className="text-sm">{template.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{template.category}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
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
                <Button variant="outline" size="sm" className="flex-1 gap-1">
                  <Eye className="h-3 w-3" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1">
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
