'use client';

import { useIsMobile } from '@/components/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Plus } from '@phosphor-icons/react';
import { useMemo } from 'react';
import { AccountForm } from './account-form';
import { ArchiveAlert } from './archive-alert';
import { useAccountDrawerContext } from './drawer-context';
import { ReactivateAlert } from './reactivate-alert';
import { DeleteAccountAlert } from './delete-account-alert';

export const AddAccountButton = ({ countryCode }: { countryCode: string }) => {
  const { setOpen } = useAccountDrawerContext();
  const { formValues, setFormValues } = useAccountDrawerContext();

  const handleClick = () => {
    setFormValues({
      ...formValues,
      countryCode: countryCode,
    });
    setOpen(true);
  };

  return (
    <Button variant="outline" size="icon" onClick={handleClick}>
      <Plus size={24} />
    </Button>
  );
};

const DrawerContent = () => {
  const { mode } = useAccountDrawerContext();

  switch (mode) {
    case 'delete':
      return <DeleteAccountAlert />;
    case 'archive':
      return <ArchiveAlert />;
    case 'reactivate':
      return <ReactivateAlert />;
    default:
      return <AccountForm />;
  }
};

export const AccountDrawer = () => {
  const { open, setOpen, mode, setMode, setFormValues, setAccount } = useAccountDrawerContext();
  const isMobile = useIsMobile();

  const modalTitle = useMemo(() => {
    switch (mode) {
      case 'add':
        return 'Add an account';
      case 'edit':
        return 'Edit the account';
      case 'archive':
        return 'Archive the account';
      case 'reactivate':
        return 'Reactivate the account';
      case 'delete':
        return 'Delete the account';
      default:
        throw new Error('Invalid mode');
    }
  }, [mode]);

  function handleOpenChange(open: boolean) {
    if (!open) {
      // Reset the form and mode on close
      setFormValues(undefined);
      setAccount(undefined);
      setMode('add');
    }
    setOpen(open);
  }

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" closeBtnOnHeader={false} className="gap-1">
          <SheetHeader>
            <SheetTitle className="text-xl">{modalTitle}</SheetTitle>
          </SheetHeader>
          <DrawerContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[540px]">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <DrawerContent />
      </DialogContent>
    </Dialog>
  );
};
