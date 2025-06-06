import { useIsMobile } from '@/components/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { SheetClose, SheetFooter } from '@/components/ui/sheet';
import { DBBackupUtil } from '@/db/db-backup-util';
import { PGliteWorker } from '@/db/pglite-web-worker';
import { cn } from '@/lib/utils';
import { LoaderCircle } from 'lucide-react';
import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type RefObject,
} from 'react';
import { useSettingsDrawerContext } from '../../settings-drawer-context';

const RestoreButton = ({
  fileInputRef,
  handleFileChange,
  isFilePathValid,
  ...props
}: ComponentProps<typeof Button> & {
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  isFilePathValid: boolean;
}) => {
  const { isProcessing } = useSettingsDrawerContext();

  return (
    <div className="flex flex-row items-center gap-2">
      <Input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        multiple={false}
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="destructive"
        disabled={!isFilePathValid || isProcessing}
        {...props}
      >
        {isProcessing ? (
          <LoaderCircle className={cn('h-4 w-4 animate-spin')} />
        ) : (
          <span>Restore</span>
        )}
      </Button>
    </div>
  );
};

export const RestoreAlert = () => {
  const { setIsProcessing } = useSettingsDrawerContext();
  const isMobile = useIsMobile();
  const CANCEL_BUTTON_LABEL = 'Cancel';

  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isFilePathValid = useMemo(
    () => !!file && file.type === 'application/x-zip-compressed',
    [file],
  );

  function handleFileChange() {
    const selectedFile = fileInputRef.current?.files?.[0] ?? null;
    setFile(selectedFile);
  }

  async function handleRestore() {
    if (!file) return;

    setIsProcessing(true);
    try {
      const pg = await PGliteWorker.createNewInstance();
      const backupUtil = new DBBackupUtil(pg);
      await backupUtil.restoreDatabase(file);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <>
      <div className={cn('break-keep', isMobile ? 'px-4 py-2' : '')}>
        <p className="mb-2 text-pretty">
          Are you sure you want to restore your data from the previous backup?
        </p>
        <p className="mb-2 text-pretty">
          All data will be overriden by the backup and the current data will be{' '}
          <span className="text-destructive font-bold">
            permanently deleted and cannot be restored.
          </span>
        </p>
        <div></div>
      </div>
      {isMobile ? (
        <SheetFooter>
          <RestoreButton
            onClick={handleRestore}
            fileInputRef={fileInputRef}
            handleFileChange={handleFileChange}
            isFilePathValid={isFilePathValid}
          />
          <SheetClose asChild>
            <Button variant="outline">{CANCEL_BUTTON_LABEL}</Button>
          </SheetClose>
        </SheetFooter>
      ) : (
        <DialogFooter className="mt-4">
          <RestoreButton
            className="w-20"
            onClick={handleRestore}
            fileInputRef={fileInputRef}
            handleFileChange={handleFileChange}
            isFilePathValid={isFilePathValid}
          />
          <DialogClose asChild>
            <Button variant="outline">{CANCEL_BUTTON_LABEL}</Button>
          </DialogClose>
        </DialogFooter>
      )}
    </>
  );
};
