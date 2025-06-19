import { useIsMobile } from '@/components/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useMemo } from 'react';
import { useSettingsDrawerContext } from '../../settings-drawer-context';
import { EnableSyncModal } from './enable-sync-modal';
import { RestoreAlert } from './restore-alert';

const DrawerContent = () => {
  const { mode } = useSettingsDrawerContext();

  switch (mode) {
    case 'sync':
      return <EnableSyncModal />;
    case 'restore':
      return <RestoreAlert />;
    default:
      return <></>;
  }
};

export const SettingsDrawer = () => {
  const { open, setOpen, mode, onClose } = useSettingsDrawerContext();

  const isMobile = useIsMobile();

  const modalTitle = useMemo(() => {
    switch (mode) {
      case 'sync':
        return 'Enable sync';
      case 'backup':
        return 'Backup your data';
      case 'restore':
        return 'Restore the data from a file';
      default:
        throw new Error('Invalid mode');
    }
  }, [mode]);

  function onOpenChange(open: boolean) {
    if (!open) {
      onClose();
    }
  }

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="gap-1 px-4 pt-4 pb-8">
          <SheetHeader className='px-0 py-2'>
            <SheetTitle className="text-xl">{modalTitle}</SheetTitle>
          </SheetHeader>
          <DrawerContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
