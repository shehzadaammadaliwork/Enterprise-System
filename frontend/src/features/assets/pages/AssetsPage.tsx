import { useState, type SubmitEvent } from 'react';
import { Link } from 'react-router-dom';
import { useChangeAssetStatus, useCreateAsset, useAssets } from '../api/hooks';
import { useEmployees } from '../../employees/api/hooks';
import { nextAssetStatuses } from '../lib/transitions';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Modal } from '../../../shared/components/Modal';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Textarea } from '../../../components/ui/textarea';
import { cn } from '../../../lib/utils';
import type { AssetInput } from '../api/assets.api';
import type { Asset, AssetCategory, AssetStatus } from '../api/types';

type Tab = 'ACTIVE' | 'UNDER_REPAIR' | 'RETIRED' | 'ALL';

const TABS: { label: string; value: Tab }[] = [
  { label: 'Assigned + Available', value: 'ACTIVE' },
  { label: 'Under Repair', value: 'UNDER_REPAIR' },
  { label: 'Retired', value: 'RETIRED' },
  { label: 'All', value: 'ALL' },
];

const CATEGORIES: AssetCategory[] = ['LAPTOP', 'MONITOR', 'PHONE', 'OTHER_EQUIPMENT'];

const EMPTY_FORM: AssetInput = { name: '', category: 'LAPTOP', serialNumber: '', notes: '' };

function matchesTab(asset: Asset, tab: Tab): boolean {
  if (tab === 'ALL') return true;
  if (tab === 'ACTIVE') return asset.status === 'ASSIGNED' || asset.status === 'AVAILABLE';
  return asset.status === tab;
}

export function AssetsPage() {
  const [tab, setTab] = useState<Tab>('ACTIVE');
  const { data, isLoading } = useAssets({});
  const { data: employees } = useEmployees();
  const createMutation = useCreateAsset();
  const statusMutation = useChangeAssetStatus();
  const [statusErrorMessage, setStatusErrorMessage] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AssetInput>(EMPTY_FORM);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pending target needing extra input before it commits (Assigned needs
  // an employee, Retired offers an optional reason) — everything else in
  // nextAssetStatuses commits immediately from the inline dropdown.
  const [pendingAssign, setPendingAssign] = useState<Asset | null>(null);
  const [pendingRetire, setPendingRetire] = useState<Asset | null>(null);
  const [assignEmployeeId, setAssignEmployeeId] = useState('');
  const [retirementReason, setRetirementReason] = useState('');

  const assets = (data?.data ?? []).filter((asset) => matchesTab(asset, tab));

  function openCreate() {
    setForm(EMPTY_FORM);
    setErrorMessage(null);
    setShowForm(true);
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    createMutation.mutate(form, {
      onSuccess: () => setShowForm(false),
      onError: (error) => setErrorMessage(extractApiErrorMessage(error, 'Could not create asset.')),
    });
  }

  function handleStatusChange(asset: Asset, status: AssetStatus) {
    if (status === 'ASSIGNED') {
      setAssignEmployeeId('');
      setPendingAssign(asset);
      return;
    }
    if (status === 'RETIRED') {
      setRetirementReason('');
      setPendingRetire(asset);
      return;
    }
    commitStatus(asset.id, { status });
  }

  function commitStatus(id: string, input: Parameters<typeof statusMutation.mutate>[0]['input']) {
    setStatusErrorMessage(null);
    statusMutation.mutate(
      { id, input },
      { onError: (e) => setStatusErrorMessage(extractApiErrorMessage(e, 'Could not update asset status.')) },
    );
  }

  function confirmAssign() {
    if (!pendingAssign || !assignEmployeeId) return;
    commitStatus(pendingAssign.id, { status: 'ASSIGNED', assignedEmployeeId: assignEmployeeId });
    setPendingAssign(null);
  }

  function confirmRetire() {
    if (!pendingRetire) return;
    commitStatus(pendingRetire.id, { status: 'RETIRED', retirementReason: retirementReason || undefined });
    setPendingRetire(null);
  }

  function employeeName(employeeId: string | null) {
    if (!employeeId) return '—';
    const employee = employees?.data.find((e) => e.id === employeeId);
    return employee ? `${employee.user.firstName} ${employee.user.lastName}` : '—';
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Assets</h1>
          <p className="mt-1 text-sm text-muted-foreground">Company-owned equipment issued to employees.</p>
        </div>
        <Button type="button" size="sm" onClick={openCreate}>
          Add asset
        </Button>
      </div>

      <div className="mb-5 inline-flex flex-wrap items-center gap-0.5 rounded-lg bg-muted p-0.75">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={cn(
              'rounded-md px-3 py-1 text-sm font-medium transition-colors',
              tab === t.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="mb-4 text-sm text-muted-foreground">{assets.length} asset(s)</p>

      {statusErrorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{statusErrorMessage}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !assets.length ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          No assets here.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="font-medium">
                    <Link to={`/assets/${asset.id}`} className="text-primary hover:underline">
                      {asset.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{asset.category}</TableCell>
                  <TableCell className="text-muted-foreground">{employeeName(asset.assignedEmployeeId)}</TableCell>
                  <TableCell>
                    <Select
                      value={asset.status}
                      disabled={nextAssetStatuses(asset.status).length === 0 || statusMutation.isPending}
                      onValueChange={(value) => handleStatusChange(asset, value as AssetStatus)}
                    >
                      <SelectTrigger size="sm" className="w-40">
                        <SelectValue>{asset.status}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={asset.status}>{asset.status}</SelectItem>
                        {nextAssetStatuses(asset.status).map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {showForm && (
        <Modal title="Add asset" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="asset-name">Name</Label>
              <Input
                id="asset-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="asset-category">Category</Label>
              <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value as AssetCategory })}>
                <SelectTrigger id="asset-category" className="w-full">
                  <SelectValue>{form.category}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="asset-serial">Serial number</Label>
              <Input
                id="asset-serial"
                value={form.serialNumber}
                onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="asset-notes">Notes</Label>
              <Textarea id="asset-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving…' : 'Add asset'}
            </Button>
          </form>
        </Modal>
      )}

      {pendingAssign && (
        <Modal title={`Assign ${pendingAssign.name}`} onClose={() => setPendingAssign(null)}>
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
            <Button type="button" className="w-full" onClick={confirmAssign} disabled={!assignEmployeeId}>
              Assign
            </Button>
          </div>
        </Modal>
      )}

      {pendingRetire && (
        <Modal title={`Retire ${pendingRetire.name}`} onClose={() => setPendingRetire(null)}>
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
            <Button type="button" variant="destructive" className="w-full" onClick={confirmRetire}>
              Retire asset
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
