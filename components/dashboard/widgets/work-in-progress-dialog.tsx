'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';

export const WorkInProgressDialog = () => {
  const [open, setOpen] = useState(true);

  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🚧 Work in progress: Dashboard</DialogTitle>
          <DialogDescription className="sr-only">
            This dashboard is still under construction. The charts aren&rsquo;t interactive yet and
            aren&rsquo;t connected to your data. We&rsquo;re polishing things up, but feel free to
            look around! In the meantime, you can visit the Accounts or Transactions pages to track
            your spending. Thanks for checking it out &mdash; we&rsquo;d love your feedback!
          </DialogDescription>
        </DialogHeader>
        <div>
          <p className="mb-3 text-gray-700">
            This dashboard is still under construction. The charts aren&rsquo;t interactive yet and
            aren&rsquo;t connected to your data.
          </p>
          <p className="mb-3 text-gray-700">
            We&rsquo;re polishing things up, but feel free to look around!
          </p>
          <p className="mb-3 text-gray-700">
            In the meantime, you can visit the{' '}
            <a href="/app/accounts" className="font-medium text-blue-600 hover:underline">
              Accounts
            </a>{' '}
            or{' '}
            <a href="/app/transactions" className="font-medium text-blue-600 hover:underline">
              Transactions
            </a>{' '}
            pages to track your spending.
          </p>
          <p className="text-gray-700">
            Thanks for checking it out &mdash; we&rsquo;d love your feedback!
          </p>
        </div>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
