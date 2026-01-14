import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, Construction } from 'lucide-react';

interface ComingSoonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName?: string;
}

export function ComingSoonModal({ open, onOpenChange, productName }: ComingSoonModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
            <Construction className="w-8 h-8 text-accent" />
          </div>
          <DialogTitle className="text-xl">
            {productName || 'This Product'} is Coming Soon
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            This product is not yet available. It is currently under development.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="text-sm">We'll notify you when it's ready</span>
        </div>
        
        <div className="flex justify-center">
          <Button 
            onClick={() => onOpenChange(false)}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}