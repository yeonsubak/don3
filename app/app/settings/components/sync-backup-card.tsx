import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { DBBackupUtil } from '@/db/db-backup-util';
import { PGliteWorker } from '@/db/pglite-web-worker';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useSettingsDrawerContext } from '../settings-drawer-context';

const SyncSelect = () => {
  const [value, setValue] = useState<string>('disabled');
  const { setOpen, setMode } = useSettingsDrawerContext();

  function handleValueChange(value: string) {
    setValue(value);
    if (value === 'enable') {
      setMode('sync');
      setOpen(true);
    }
  }

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="disabled">Disabled</SelectItem>
        <SelectItem value="enable">Enable</SelectItem>
      </SelectContent>
    </Select>
  );
};

export const SyncBackupCard = () => {
  const { setMode, setOpen } = useSettingsDrawerContext();

  const downloadAnchorRef = useRef<HTMLAnchorElement>(null);

  async function handleBackup() {
    if (!downloadAnchorRef.current) {
      return;
    }

    const pg = await PGliteWorker.createNewInstance();
    const backupUtil = new DBBackupUtil(pg);
    const { fileName, url } = await backupUtil.createBackup();

    downloadAnchorRef.current.href = url;
    downloadAnchorRef.current.download = fileName;
    downloadAnchorRef.current.click();
    URL.revokeObjectURL(url);

    toast.success([`Backup database has been completed. File: ${fileName}`], {
      position: 'top-center',
    });
  }

  async function handleRestoreButton() {
    setMode('restore');
    setOpen(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sync & Backup</CardTitle>
        <CardDescription>Description for Sync & Backup</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                <Label htmlFor="backup-database-btn">Sync</Label>
              </TableCell>
              <TableCell>
                <SyncSelect />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Label htmlFor="backup-database-btn">Backup Database</Label>
              </TableCell>
              <TableCell>
                <Button
                  id="backup-database-btn"
                  type="button"
                  variant="outline"
                  onClick={handleBackup}
                >
                  Backup
                </Button>
                <a ref={downloadAnchorRef} className="hidden" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Label htmlFor="restore-database-btn">Restore Database</Label>
              </TableCell>
              <TableCell>
                <Button
                  id="restore-database-btn"
                  type="button"
                  variant="outline"
                  onClick={handleRestoreButton}
                >
                  Restore
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
