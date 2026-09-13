import { useState, type SubmitEvent } from 'react';
import { DatabaseBackup } from 'lucide-react';
import { useBackups, useRunBackup, useRestoreBackup, useRestoreStatus } from '../api/hooks';
import { downloadBackup } from '../api/settings.api';
import { RESTORE_CONFIRMATION_PHRASE } from '../lib/restore-confirmation';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Modal } from '../../../shared/components/Modal';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import type { BackupJobStatus, BackupRecord, BackupTrigger, BackupType } from '../api/types';

const BACKUP_TYPES: BackupType[] = ['FULL', 'DATABASE', 'STORAGE'];

const STATUS_BADGE_VARIANT: Record<BackupJobStatus, 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'outline',
  RUNNING: 'outline',
  SUCCEEDED: 'secondary',
  FAILED: 'destructive',
};

const TRIGGER_LABEL: Record<BackupTrigger, string> = {
  MANUAL: 'Manual',
  SCHEDULED: 'Scheduled',
  PRE_RESTORE_SAFETY: 'Pre-restore safety',
};

function formatDateTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatBytes(value: string | null) {
  if (!value) return '—';
  const bytes = Number(value);
  if (!Number.isFinite(bytes)) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function BackupsTab() {
  const { data, isLoading } = useBackups();
  const runBackupMutation = useRunBackup();
  const restoreMutation = useRestoreBackup();

  const [runType, setRunType] = useState<BackupType>('FULL');
  const [restoreTarget, setRestoreTarget] = useState<BackupRecord | null>(null);
  const [confirmationText, setConfirmationText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeRestoreId, setActiveRestoreId] = useState<string | null>(null);

  const { data: restoreStatus } = useRestoreStatus(activeRestoreId);

  function handleRunBackup() {
    setErrorMessage(null);
    runBackupMutation.mutate(runType, {
      onError: (error) => setErrorMessage(extractApiErrorMessage(error, 'Could not start backup.')),
    });
  }

  function openRestoreConfirm(backup: BackupRecord) {
    if (
      !confirm(
        `Restore from the backup taken ${formatDateTime(backup.startedAt)}? This will overwrite the live database.`,
      )
    ) {
      return;
    }
    setRestoreTarget(backup);
    setConfirmationText('');
    setErrorMessage(null);
  }

  function handleConfirmRestore(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!restoreTarget) return;
    restoreMutation.mutate(
      { id: restoreTarget.id, confirmationPhrase: confirmationText },
      {
        onSuccess: (restore) => {
          setRestoreTarget(null);
          setActiveRestoreId(restore.id);
        },
        onError: (error) => setErrorMessage(extractApiErrorMessage(error, 'Could not start restore.')),
      },
    );
  }

  return (
    <div>
      {restoreStatus && (restoreStatus.status === 'PENDING' || restoreStatus.status === 'RUNNING') && (
        <Alert className="mb-4 border-amber-500/40 bg-amber-500/5">
          <AlertDescription>
            Restore in progress — the app is briefly unavailable for everything except this page. This can take a
            few minutes.
          </AlertDescription>
        </Alert>
      )}
      {restoreStatus?.status === 'SUCCEEDED' && (
        <Alert className="mb-4 border-primary/30 bg-primary/5">
          <AlertDescription>Restore completed successfully.</AlertDescription>
        </Alert>
      )}
      {restoreStatus?.status === 'FAILED' && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>Restore failed: {restoreStatus.errorMessage ?? 'Unknown error.'}</AlertDescription>
        </Alert>
      )}

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Manual and scheduled backups of the database and file storage.</p>
        <div className="flex items-center gap-2">
          <Select value={runType} onValueChange={(value) => setRunType(value as BackupType)}>
            <SelectTrigger className="w-36">
              <SelectValue>{runType}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {BACKUP_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" disabled={runBackupMutation.isPending} onClick={handleRunBackup}>
            {runBackupMutation.isPending ? 'Starting…' : 'Run backup'}
          </Button>
        </div>
      </div>

      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data || data.data.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          <DatabaseBackup className="mx-auto mb-2 size-6" />
          No backups yet.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Started</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Size</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((backup) => (
              <TableRow key={backup.id}>
                <TableCell>{formatDateTime(backup.startedAt)}</TableCell>
                <TableCell>{backup.type}</TableCell>
                <TableCell>{TRIGGER_LABEL[backup.trigger]}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_BADGE_VARIANT[backup.status]}>{backup.status}</Badge>
                </TableCell>
                <TableCell>{formatBytes(backup.fileSizeBytes)}</TableCell>
                <TableCell className="flex justify-end gap-2">
                  {backup.status === 'SUCCEEDED' && backup.type !== 'STORAGE' && (
                    <Button variant="ghost" size="sm" onClick={() => downloadBackup(backup.id)}>
                      Download
                    </Button>
                  )}
                  {backup.status === 'SUCCEEDED' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => openRestoreConfirm(backup)}
                    >
                      Restore
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {restoreTarget && (
        <Modal title="Confirm restore" onClose={() => setRestoreTarget(null)}>
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              This will overwrite the live database with the backup taken {formatDateTime(restoreTarget.startedAt)}.
              A safety backup of the current state is taken automatically first, but anything created since the
              restored backup and not restorable from it will be lost.
            </AlertDescription>
          </Alert>
          <form onSubmit={handleConfirmRestore} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="restoreConfirmation">
                Type <span className="font-mono">{RESTORE_CONFIRMATION_PHRASE}</span> to confirm
              </Label>
              <Input
                id="restoreConfirmation"
                required
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              variant="destructive"
              disabled={confirmationText !== RESTORE_CONFIRMATION_PHRASE || restoreMutation.isPending}
            >
              {restoreMutation.isPending ? 'Starting restore…' : 'Restore'}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
