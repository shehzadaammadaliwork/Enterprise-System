import { useEffect, useState } from 'react';
import {
  useEmployeeAccess,
  useResetAllEmployeeOverrides,
  useResetEmployeeOverride,
  useRoles,
  useSetEmployeeOverride,
  useSetUserRoles,
} from '../../rbac/api/hooks';
import { useAuthStore } from '../../../shared/stores/auth.store';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Checkbox } from '../../../components/ui/checkbox';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import type { PermissionOverrideState } from '../../rbac/api/types';

const OVERRIDE_LABEL: Record<PermissionOverrideState, string> = {
  INHERITED: 'Inherited',
  GRANTED: 'Granted',
  DENIED: 'Denied',
};

function sameIds(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((id, i) => id === sortedB[i]);
}

/// System Access section for the Employee detail page: RBAC roles (edited
/// here, saved via the existing PUT /rbac/users/:userId/roles endpoint) and
/// the per-permission Role Access vs Employee Override breakdown, per the
/// flexible-RBAC spec's Section 7 mockup. Hidden entirely without
/// rbac:VIEW; edit controls additionally require rbac:EDIT and are disabled
/// for the logged-in user's own employee record (the backend enforces the
/// same "cannot modify your own access" rule — this is just the matching
/// preemptive UX, not the real boundary).
export function EmployeeAccessSection({ employeeId, userId }: { employeeId: string; userId: string }) {
  const canView = useAuthStore((state) => state.hasPermission('rbac', 'VIEW'));
  const canEdit = useAuthStore((state) => state.hasPermission('rbac', 'EDIT'));
  const currentUserId = useAuthStore((state) => state.user?.id);
  const isSelf = currentUserId === userId;

  const { data: access, isLoading } = useEmployeeAccess(canView ? employeeId : undefined);
  const { data: roles } = useRoles();
  const setRolesMutation = useSetUserRoles();
  const setOverrideMutation = useSetEmployeeOverride();
  const resetOverrideMutation = useResetEmployeeOverride();
  const resetAllMutation = useResetAllEmployeeOverrides();

  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const savedRoleIds = access?.roles.map((role) => role.id) ?? [];

  // Re-sync local selection only when the server's actual role set changes
  // (initial load, a save elsewhere, another admin's edit) — not on every
  // refetch, so an in-progress unsaved selection isn't silently discarded.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setSelectedRoleIds(savedRoleIds), [savedRoleIds.slice().sort().join(',')]);

  if (!canView) return null;
  if (isLoading || !access) return <p className="text-sm text-muted-foreground">Loading access…</p>;

  const rolesDirty = !sameIds(selectedRoleIds, savedRoleIds);
  const editingDisabled = !canEdit || isSelf;

  function toggleRole(roleId: string, checked: boolean) {
    setSelectedRoleIds((prev) => (checked ? [...prev, roleId] : prev.filter((id) => id !== roleId)));
  }

  function handleSaveRoles() {
    setErrorMessage(null);
    setRolesMutation.mutate(
      { userId, employeeId, roleIds: selectedRoleIds },
      { onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not update roles.')) },
    );
  }

  function handleOverrideChange(permissionId: string, value: string) {
    setErrorMessage(null);
    if (value === 'INHERITED') {
      resetOverrideMutation.mutate(
        { employeeId, permissionId },
        { onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not reset override.')) },
      );
    } else {
      setOverrideMutation.mutate(
        { employeeId, permissionId, state: value as 'GRANTED' | 'DENIED' },
        { onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not update override.')) },
      );
    }
  }

  function handleResetAll() {
    if (
      !confirm(
        'Remove every custom permission override for this employee? Their access will follow their assigned roles again. Roles themselves are not affected.',
      )
    ) {
      return;
    }
    setErrorMessage(null);
    resetAllMutation.mutate(employeeId, {
      onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not reset overrides.')),
    });
  }

  const hasAnyOverride = access.permissions.some((p) => p.override !== 'INHERITED');
  let lastModule = '';

  return (
    <div className="mb-8">
      <h2 className="mb-3 text-lg font-semibold text-foreground">System access</h2>

      {isSelf && (
        <Alert className="mb-4">
          <AlertDescription>You cannot modify your own roles or permission overrides.</AlertDescription>
        </Alert>
      )}
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="mb-6 rounded-lg border p-4">
        <div className="mb-3 flex items-center justify-between">
          <Label>RBAC roles</Label>
          {rolesDirty && (
            <Button size="sm" onClick={handleSaveRoles} disabled={editingDisabled || setRolesMutation.isPending}>
              {setRolesMutation.isPending ? 'Saving…' : 'Save roles'}
            </Button>
          )}
        </div>
        {!roles?.data.length ? (
          <p className="text-sm text-muted-foreground">No roles available.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {roles.data.map((role) => (
              <label key={role.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={selectedRoleIds.includes(role.id)}
                  disabled={editingDisabled}
                  onCheckedChange={(checked) => toggleRole(role.id, checked === true)}
                />
                {role.name}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <Label>Module / permission access</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetAll}
          disabled={editingDisabled || !hasAnyOverride || resetAllMutation.isPending}
        >
          Reset all overrides
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Module</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Role access</TableHead>
              <TableHead>Employee override</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {access.permissions.map((row) => {
              const showModule = row.module !== lastModule;
              lastModule = row.module;
              return (
                <TableRow key={row.permissionId}>
                  <TableCell className={showModule ? 'font-medium' : 'text-muted-foreground'}>
                    {showModule ? row.module : ''}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.action}</TableCell>
                  <TableCell>
                    <Badge variant={row.roleAccess === 'ALLOWED' ? 'secondary' : 'outline'}>{row.roleAccess}</Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={row.override}
                      disabled={editingDisabled}
                      onValueChange={(value) => handleOverrideChange(row.permissionId, value)}
                    >
                      <SelectTrigger size="sm" className="w-36">
                        <SelectValue>{OVERRIDE_LABEL[row.override]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INHERITED">Inherited</SelectItem>
                        <SelectItem value="GRANTED">Granted</SelectItem>
                        <SelectItem value="DENIED">Denied</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
