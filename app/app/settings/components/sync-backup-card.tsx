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

const SyncSelect = () => {
  const [value, setValue] = useState<string>('disabled');

  return (
    <Select value={value} onValueChange={setValue}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="sssss" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="disabled">Disabled</SelectItem>
        <SelectItem value="enable">Enable</SelectItem>
      </SelectContent>
    </Select>
  );
};

export const SyncBackupCard = () => {
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
                <Button id="restore-database-btn" type="button" variant="outline">
                  Restore
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        {/* <div className="items-center">
          <Label htmlFor="backup-button">Backup database</Label>
          <Button id="backup-button" type="button" variant="outline">
            Backup
          </Button>
        </div>
        <div className="items-center">
          <Label htmlFor="restore-database" className="mb-2">
            Restore database
          </Label>
          <div className="flex w-full flex-row items-center gap-2">
            <Input id="restore-database" type="file" />
            <Button type="button" variant="default">
              Restore
            </Button>
          </div>
        </div> */}
      </CardContent>
    </Card>
  );
};
