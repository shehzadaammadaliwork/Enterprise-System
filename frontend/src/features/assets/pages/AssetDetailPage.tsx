import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAsset, useChangeAssetStatus, useDeleteAsset } from '../api/hooks';
import { useEmployees } from '../../employees/api/hooks';
import { nextAssetStatuses } from '../lib/transitions';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Modal } from '../../../shared/components/Modal';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import type { AssetStatus } from '../api/types';

const STATUS_BADGE_VARIANT: Record<AssetStatus, 'secondary' | 'outline' | 'destructive'> = {
  ASSIGNED: 'secondary',
  AVAILABLE: 'outline',
  UNDER_REPAIR: 'outline',
  RETIRED: 'destructive',
};

function formatMoney(value: number | null) {
  if (value === null) return '—';
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: asset, isLoading } = useAsset(id);
  const { data: employees } = useEmployees();
  const statusMutation = useChangeAssetStatus();
  const deleteMutation = useDeleteAsset();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAssign, setShowAssign] = useState(false);
  const [showRetire, setShowRetire] = useState(false);
  const [assignEmployeeId, setAssignEmployeeId] = useState('');
  const [retirementReason, setRetirementReason] = useState('');

  if (isLoading || !asset) return <p className="text-sm text-muted-foreground">Loading…</p>;

  function commit(input: Parameters<typeof statusMutation.mutate>[0]['input']) {
    if (!id) return;
    setErrorMessage(null);
    statusMutation.mutate(
      { id, input },
      { onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not update this asset.')) },
    );
  }

  function handleDelete() {
    if (!id || !confirm('Delete this asset?')) return;
    deleteMutation.mutate(id, { onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not delete asset.')) });
  }

  function employeeName(employeeId: string | null) {
    if (!employeeId) return '—';
    const employee = employees?.data.find((e) => e.id === employeeId);
    return employee ? `${employee.user.firstName} ${employee.user.lastName}` : '—';
  }

  const next = nextAssetStatuses(asset.status);
  const canAssign = next.includes('ASSIGNED');
  const canReturnToAvailable = next.includes('AVAILABLE');
  const canSendForRepair = next.includes('UNDER_REPAIR');
  const canRetire = next.includes('RETIRED');

  return (
    <div>
      <Link to="/assets" className="mb-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="size-3.5" />
        Back to assets
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{asset.name}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {asset.category}
            <Badge variant={STATUS_BADGE_VARIANT[asset.status]}>{asset.status}</Badge>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canAssign && (
            <Button onClick={() => { setAssignEmployeeId(''); setShowAssign(true); }} disabled={statusMutation.isPending}>
              Assign
            </Button>
          )}
          {canReturnToAvailable && (
            <Button variant="outline" onClick={() => commit({ status: 'AVAILABLE' })} disabled={statusMutation.isPending}>
              Return to Available
            </Button>
          )}
          {canSendForRepair && (
            <Button variant="outline" onClick={() => commit({ status: 'UNDER_REPAIR' })} disabled={statusMutation.isPending}>
              Send for Repair
            </Button>
          )}
          {canRetire && (
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => { setRetirementReason(''); setShowRetire(true); }}
              disabled={statusMutation.isPending}
            >
              Retire
            </Button>
          )}
          {asset.status === 'AVAILABLE' && (
            <Button variant="outline" className="text-destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              Delete
            </Button>
          )}
        </div>
      </div>

      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="mb-8 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assigned to</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{employeeName(asset.assignedEmployeeId)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Serial number</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{asset.serialNumber ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Purchase date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{formatDate(asset.purchaseDate)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Purchase cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{formatMoney(asset.purchaseCost)}</div>
          </CardContent>
        </Card>
      </div>

      {asset.notes && (
        <>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Notes</h2>
          <p className="mb-6 text-sm text-muted-foreground">{asset.notes}</p>
        </>
      )}

      {asset.status === 'RETIRED' && asset.retirementReason && (
        <>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Retirement reason</h2>
          <p className="text-sm text-muted-foreground">{asset.retirementReason}</p>
        </>
      )}

      {showAssign && (
        <Modal title={`Assign ${asset.name}`} onClose={() => setShowAssign(false)}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="assign-employee">Employee</Label>
              <Select value={assignEmployeeId} onValueChange={setAssignEmployeeId}>
                <SelectTrigger id="assign-employee" className="w-full">
                  <SelectValue placeholder="Select an employee">
                    {assignEmployeeId ? employeeName(assignEmployeeId) : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(employees?.data ?? []).map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.user.firstName} {employee.user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              className="w-full"
              disabled={!assignEmployeeId}
              onClick={() => {
                commit({ status: 'ASSIGNED', assignedEmployeeId: assignEmployeeId });
                setShowAssign(false);
              }}
            >
              Assign
            </Button>
          </div>
        </Modal>
      )}

      {showRetire && (
        <Modal title={`Retire ${asset.name}`} onClose={() => setShowRetire(false)}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="retire-reason">Reason (optional)</Label>
              <Textarea
                id="retire-reason"
                value={retirementReason}
                onChange={(e) => setRetirementReason(e.target.value)}
                placeholder="e.g. Damaged beyond repair, lost, obsolete…"
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              onClick={() => {
                commit({ status: 'RETIRED', retirementReason: retirementReason || undefined });
                setShowRetire(false);
              }}
            >
              Retire asset
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
