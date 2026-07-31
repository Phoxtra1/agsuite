import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ComsSettingsModal({ open, onOpenChange }: Props) {
  const [emailProvider, setEmailProvider] = useState('brevo');
  const [autoReply, setAutoReply] = useState(true);
  const [defaultSender, setDefaultSender] = useState('noreply@amineva.com');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" /> ComsSystem Settings
          </DialogTitle>
          <DialogDescription>Configure communication channels and preferences</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Email Provider</Label>
            <Input value={emailProvider} onChange={e => setEmailProvider(e.target.value)} disabled />
            <p className="text-xs text-muted-foreground">Brevo (Sendinblue) — configured via edge function secrets</p>
          </div>

          <div className="space-y-2">
            <Label>Default Sender Address</Label>
            <Input value={defaultSender} onChange={e => setDefaultSender(e.target.value)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Dipa AI Auto-Reply</Label>
              <p className="text-xs text-muted-foreground">Automatically reply to high-confidence queries</p>
            </div>
            <Switch checked={autoReply} onCheckedChange={setAutoReply} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onOpenChange(false)}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
