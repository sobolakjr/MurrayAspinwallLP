'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface ApiConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  apiName?: string;
  estimatedCost?: string;
}

export function ApiConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = 'API Request Confirmation',
  description,
  apiName = 'Rentcast API',
  estimatedCost = '$0.01 per request',
}: ApiConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              {description ||
                `This action will make a request to the ${apiName}, which incurs a cost.`}
            </p>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-amber-800">
              <div className="font-medium">Cost Information</div>
              <div className="text-sm mt-1">
                API: {apiName}
                <br />
                Estimated cost: {estimatedCost}
              </div>
            </div>
            <p className="text-sm">Do you want to proceed with this request?</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Proceed with Request
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
