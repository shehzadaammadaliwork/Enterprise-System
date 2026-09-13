import { useState } from 'react';
import { useAuditLogModules, useAuditLogs } from '../api/hooks';
import { Modal } from '../../../shared/components/Modal';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import type { AuditAction, AuditLogEntry } from '../api/types';

const ACTIONS: AuditAction[] = ['CREATE', 'UPDATE', 'DELETE'];
const ALL = '__all__';

const ACTION_BADGE_VARIANT: Record<AuditAction, 'secondary' | 'outline' | 'destructive'> = {
  CREATE: 'secondary',
  UPDATE: 'outline',
  DELETE: 'destructive',
};

interface FilterState {
  userEmail: string;
  module: string;
  action: string;
  entityType: string;
  dateFrom: string;
  dateTo: string;
}

const EMPTY_FILTERS: FilterState = {
  userEmail: '',
  module: '',
  action: '',
  entityType: '',
  dateFrom: '',
  dateTo: '',
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AuditLogsPage() {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const { data: modules } = useAuditLogModules();
  const { data, isLoading } = useAuditLogs({
    page,
    limit: 25,
    userEmail: filters.userEmail || undefined,
    module: filters.module || undefined,
    action: (filters.action || undefined) as AuditAction | undefined,
    entityType: filters.entityType || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  });

  function updateFilter<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  const meta = data?.meta;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Audit logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every create, update and delete across the system, with actor, entity and before/after diff.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="auditUserEmail">User email</Label>
          <Input
            id="auditUserEmail"
            placeholder="Search by email"
            value={filters.userEmail}
            onChange={(e) => updateFilter('userEmail', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="auditModule">Module</Label>
          <Select
            value={filters.module || ALL}
            onValueChange={(value) => updateFilter('module', value === ALL ? '' : value)}
          >
            <SelectTrigger id="auditModule" className="w-full">
              <SelectValue placeholder="All modules">{filters.module || 'All modules'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All modules</SelectItem>
              {(modules ?? []).map((module) => (
                <SelectItem key={module} value={module}>
                  {module}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="auditAction">Action</Label>
          <Select
            value={filters.action || ALL}
            onValueChange={(value) => updateFilter('action', value === ALL ? '' : value)}
          >
            <SelectTrigger id="auditAction" className="w-full">
              <SelectValue placeholder="All actions">{filters.action || 'All actions'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All actions</SelectItem>
              {ACTIONS.map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="auditEntityType">Entity type</Label>
          <Input
            id="auditEntityType"
            placeholder="e.g. Employee"
            value={filters.entityType}
            onChange={(e) => updateFilter('entityType', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="auditDateFrom">From</Label>
          <Input
            id="auditDateFrom"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => updateFilter('dateFrom', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="auditDateTo">To</Label>
          <Input
            id="auditDateTo"
            type="date"
            value={filters.dateTo}
            onChange={(e) => updateFilter('dateTo', e.target.value)}
          />
        </div>
      </div>

      <p className="mb-3 text-sm text-muted-foreground">
        {meta?.total ?? 0} entr{meta?.total === 1 ? 'y' : 'ies'}
      </p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.data.length ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          No audit log entries match these filters.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>IP</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{formatDateTime(entry.createdAt)}</TableCell>
                  <TableCell>{entry.userEmail ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={ACTION_BADGE_VARIANT[entry.action]}>{entry.action}</Badge>
                  </TableCell>
                  <TableCell>{entry.module}</TableCell>
                  <TableCell>
                    {entry.entityType}
                    {entry.entityId ? ` #${entry.entityId.slice(0, 8)}` : ''}
                  </TableCell>
                  <TableCell>{entry.ip ?? '—'}</TableCell>
                  <TableCell>
                    <Button variant="link" className="h-auto p-0" onClick={() => setSelected(entry)}>
                      View diff
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <p className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.totalPages}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}

      {selected && (
        <Modal title={`${selected.action} ${selected.entityType}`} onClose={() => setSelected(null)}>
          <p className="text-sm text-muted-foreground">
            {selected.userEmail ?? 'Unknown user'} · {formatDateTime(selected.createdAt)} · {selected.method}{' '}
            {selected.path}
          </p>
          <div className="flex flex-col gap-1.5">
            <Label>Before</Label>
            <pre className="max-h-56 overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs whitespace-pre-wrap wrap-break-word">
              {selected.before ? JSON.stringify(selected.before, null, 2) : '—'}
            </pre>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>After</Label>
            <pre className="max-h-56 overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs whitespace-pre-wrap wrap-break-word">
              {selected.after ? JSON.stringify(selected.after, null, 2) : '—'}
            </pre>
          </div>
        </Modal>
      )}
    </div>
  );
}
