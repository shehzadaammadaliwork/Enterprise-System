import { useState, type SubmitEvent } from 'react';
import { Check, Copy, KeyRound } from 'lucide-react';
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '../api/hooks';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Modal } from '../../../shared/components/Modal';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import type { CreatedApiKey } from '../api/types';

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

function keyStatus(key: { revokedAt: string | null; expiresAt: string | null }) {
  if (key.revokedAt) return { label: 'Revoked', variant: 'destructive' as const };
  if (key.expiresAt && new Date(key.expiresAt) < new Date()) return { label: 'Expired', variant: 'outline' as const };
  return { label: 'Active', variant: 'secondary' as const };
}

export function ApiKeysTab() {
  const { data: keys, isLoading } = useApiKeys();
  const createMutation = useCreateApiKey();
  const revokeMutation = useRevokeApiKey();

  const [showCreate, setShowCreate] = useState(false);
  const [label, setLabel] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<CreatedApiKey | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  function handleCreate(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    createMutation.mutate(
      { label },
      {
        onSuccess: (key) => {
          setShowCreate(false);
          setLabel('');
          setCreatedKey(key);
          setCopied(false);
          setCopyFailed(false);
        },
        onError: (error) => setErrorMessage(extractApiErrorMessage(error, 'Could not create API key.')),
      },
    );
  }

  function handleRevoke(id: string, keyLabel: string) {
    if (!confirm(`Revoke API key "${keyLabel}"? Anything using it will stop working immediately.`)) return;
    revokeMutation.mutate(id);
  }

  async function copyKey() {
    if (!createdKey) return;
    // navigator.clipboard.writeText can reject in plenty of real, non-buggy
    // situations (denied permission, insecure context, older browser) — the
    // key must still be dismissable afterward (select-and-copy manually
    // from the readonly input below), not permanently stuck behind a
    // browser API that didn't cooperate.
    try {
      await navigator.clipboard.writeText(createdKey.plaintextKey);
      setCopyFailed(false);
    } catch {
      setCopyFailed(true);
    }
    setCopied(true);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Keys authenticate with the <code>X-Api-Key</code> header. The full key is shown only once, right after
          creation.
        </p>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          Generate key
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !keys || keys.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          <KeyRound className="mx-auto mb-2 size-6" />
          No API keys yet.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last used</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((key) => {
              const status = keyStatus(key);
              return (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.label}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{key.keyPrefix}…</TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell>{formatDateTime(key.lastUsedAt)}</TableCell>
                  <TableCell>{formatDateTime(key.createdAt)}</TableCell>
                  <TableCell>
                    {!key.revokedAt && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={revokeMutation.isPending}
                        onClick={() => handleRevoke(key.id, key.label)}
                      >
                        Revoke
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {showCreate && (
        <Modal title="Generate API key" onClose={() => setShowCreate(false)}>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="keyLabel">Label</Label>
              <Input
                id="keyLabel"
                required
                placeholder="e.g. Zapier integration"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Generating…' : 'Generate'}
            </Button>
          </form>
        </Modal>
      )}

      {/* Deliberately not using the shared Modal adapter here — this one
          case needs to block backdrop/Escape dismissal until the user
          explicitly acknowledges the key won't be shown again. */}
      <Dialog open={!!createdKey} onOpenChange={() => {}}>
        <DialogContent
          showCloseButton={false}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Your new API key</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertDescription>
              Copy this key now — it will not be shown again. Only a prefix is kept for display afterward.
            </AlertDescription>
          </Alert>
          <div className="flex items-center gap-2">
            <Input readOnly value={createdKey?.plaintextKey ?? ''} className="font-mono text-xs" />
            <Button type="button" variant="outline" size="icon" onClick={copyKey} aria-label="Copy key">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>
          {copyFailed && (
            <p className="text-xs text-muted-foreground">
              Couldn't copy automatically — select the text above and copy it manually.
            </p>
          )}
          <Button type="button" onClick={() => setCreatedKey(null)} disabled={!copied}>
            {copied ? "I've copied it — close" : 'Copy the key to continue'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
