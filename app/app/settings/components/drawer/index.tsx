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
import { RestoreAlert } from './restore-alert';

const DrawerContent = () => {
  const { mode } = useSettingsDrawerContext();

  switch (mode) {
    case 'restore':
      return <RestoreAlert />;
    default:
      return <></>;
  }
};

export const SettingsDrawer = () => {
  const { open, setOpen, mode } = useSettingsDrawerContext();

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

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
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
