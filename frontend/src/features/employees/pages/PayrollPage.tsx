import { useEffect, useState, type SubmitEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  usePayrollRuns,
  useTriggerPayrollRun,
  useEmployees,
  usePayrollAdjustments,
  useSavePayrollAdjustments,
} from '../api/hooks';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Checkbox } from '../../../components/ui/checkbox';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Modal } from '../../../shared/components/Modal';
import type { PayrollAdjustmentsResponse, PayrollRunScope } from '../api/types';
import type { PayrollAdjustmentInput } from '../api/employees.api';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Queued',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
};

const STATUS_VARIANT: Record<string, 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'outline',
  PROCESSING: 'outline',
  COMPLETED: 'secondary',
  FAILED: 'destructive',
};

export function PayrollPage() {
  const { data, isLoading } = usePayrollRuns();
  const triggerMutation = useTriggerPayrollRun();

  const [month, setMonth] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [scope, setScope] = useState<PayrollRunScope>('ALL_ACTIVE');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [adjustmentsOpen, setAdjustmentsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: activeEmployees, isLoading: isLoadingEmployees } = useEmployees(undefined, 'ACTIVE', 100);

  function toggleEmployee(id: string) {
    setSelectedEmployeeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  // A period can now have more than one run over time (an initial run plus
  // later top-up runs for whoever wasn't covered yet, e.g. a mid-cycle new
  // hire), so there's no such thing as "this period is already fully
  // blocked" to precompute client-side — the backend determines per
  // employee, at submit time, who still needs a payslip for this period and
  // targets only them. Only checked once Admin has explicitly chosen both
  // fields — otherwise this would act on whatever period happens to be
  // sitting in state before any real choice.
  const periodSelected = month != null && year != null;

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (month == null || year == null) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    const submittedMonth = month;
    const submittedYear = year;
    triggerMutation.mutate(
      { month, year, scope, employeeIds: scope === 'SELECTED' ? selectedEmployeeIds : undefined },
      {
        onSuccess: (result) => {
          const skippedNames = result.skippedEmployeeIds
            .map((employeeId) => activeEmployees?.data.find((e) => e.id === employeeId))
            .filter((e): e is NonNullable<typeof e> => !!e)
            .map((e) => `${e.user.firstName} ${e.user.lastName}`);
          const base = `Payroll run queued for ${MONTHS[submittedMonth - 1]} ${submittedYear}.`;
          setSuccessMessage(
            skippedNames.length > 0
              ? `${base} Skipped ${skippedNames.length} employee(s) who already have a payroll record for this period: ${skippedNames.join(', ')}.`
              : base,
          );
          setMonth(null);
          setYear(null);
          setScope('ALL_ACTIVE');
          setSelectedEmployeeIds([]);
          setAdjustmentsOpen(false);
        },
        onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not start payroll run.')),
      },
    );
  }

  const canRun = scope === 'ALL_ACTIVE' || selectedEmployeeIds.length > 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Payroll</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monthly payroll generation — processed in the background via BullMQ.
        </p>
      </div>

      <Card className="mb-6 max-w-160">
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            {successMessage && (
              <Alert>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="payrollMonth">Month</Label>
                <Select
                  value={month != null ? String(month) : undefined}
                  onValueChange={(value) => setMonth(Number(value))}
                >
                  <SelectTrigger id="payrollMonth" className="w-full">
                    <SelectValue placeholder="Select month">{month != null ? MONTHS[month - 1] : undefined}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((name, index) => (
                      <SelectItem key={name} value={String(index + 1)}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="payrollYear">Year</Label>
                <Input
                  id="payrollYear"
                  type="number"
                  min={2000}
                  max={2100}
                  placeholder=" Type year"
                  value={year ?? ''}
                  onChange={(e) => setYear(e.target.value === '' ? null : Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Employees</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={scope === 'ALL_ACTIVE' ? 'default' : 'outline'}
                  onClick={() => setScope('ALL_ACTIVE')}
                >
                  All active employees
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={scope === 'SELECTED' ? 'default' : 'outline'}
                  onClick={() => setScope('SELECTED')}
                >
                  Select specific employee(s)
                </Button>
              </div>
            </div>

            {scope === 'SELECTED' && (
              <div className="max-h-48 overflow-y-auto rounded-md border p-2">
                {isLoadingEmployees ? (
                  <p className="text-sm text-muted-foreground">Loading employees…</p>
                ) : !activeEmployees?.data.length ? (
                  <p className="text-sm text-muted-foreground">No active employees.</p>
                ) : (
                  activeEmployees.data.map((employee) => (
                    <label key={employee.id} className="flex items-center gap-2 py-1 text-sm">
                      <Checkbox
                        checked={selectedEmployeeIds.includes(employee.id)}
                        onCheckedChange={() => toggleEmployee(employee.id)}
                      />
                      {employee.user.firstName} {employee.user.lastName}
                      <span className="text-muted-foreground">— {employee.designation}</span>
                    </label>
                  ))
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!periodSelected}
                onClick={() => setAdjustmentsOpen(true)}
              >
                Adjustments
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={triggerMutation.isPending || !canRun || !periodSelected}
              >
                {triggerMutation.isPending ? 'Starting…' : 'Run payroll'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {adjustmentsOpen && month != null && year != null && (
        <AdjustmentsModal
          month={month}
          year={year}
          employeeIds={scope === 'SELECTED' ? selectedEmployeeIds : undefined}
          onClose={() => setAdjustmentsOpen(false)}
        />
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.data.length ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          No payroll runs yet.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="font-medium">
                    {MONTHS[run.month - 1]} {run.year}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {run.scope === 'SELECTED' ? `${run.selectedEmployeeIds.length} selected` : 'All active'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[run.status] ?? 'outline'}>
                      {STATUS_LABEL[run.status] ?? run.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{new Date(run.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {run.completedAt ? new Date(run.completedAt).toLocaleString() : '—'}
                  </TableCell>
                  <TableCell>
                    <Button variant="link" className="h-auto p-0" asChild>
                      <Link to={`/payroll/${run.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

interface AdjustmentDraft {
  bonus: string;
  deduction: string;
}

function AdjustmentsModal({
  month,
  year,
  employeeIds,
  onClose,
}: {
  month: number;
  year: number;
  employeeIds?: string[];
  onClose: () => void;
}) {
  const { data, isLoading } = usePayrollAdjustments(month, year, employeeIds);
  const saveMutation = useSavePayrollAdjustments();
  const [drafts, setDrafts] = useState<Record<string, AdjustmentDraft>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setDrafts(
      Object.fromEntries(
        data.items.map((item) => [item.employeeId, { bonus: String(item.bonus), deduction: String(item.deduction) }]),
      ),
    );
  }, [data]);

  function updateDraft(employeeId: string, field: keyof AdjustmentDraft, value: string) {
    setDrafts((prev) => ({ ...prev, [employeeId]: { ...prev[employeeId], [field]: value } }));
  }

  function handleSave(current: PayrollAdjustmentsResponse) {
    setErrorMessage(null);
    const adjustments: PayrollAdjustmentInput[] = current.items.map((item) => {
      const draft = drafts[item.employeeId];
      return {
        employeeId: item.employeeId,
        bonus: Number(draft?.bonus) || 0,
        deduction: Number(draft?.deduction) || 0,
      };
    });
    saveMutation.mutate(
      { month, year, adjustments },
      { onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not save adjustments.')), onSuccess: onClose },
    );
  }

  return (
    <Modal title={`Adjustments — ${MONTHS[month - 1]} ${year}`} onClose={onClose}>
      {isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="flex flex-col gap-4">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          {data.locked && (
            <Alert>
              <AlertDescription>
                This payroll period has already been run and is locked — adjustments can no longer be changed.
              </AlertDescription>
            </Alert>
          )}
          {!data.items.length ? (
            <p className="text-sm text-muted-foreground">No employees to adjust.</p>
          ) : (
            <div className="max-h-96 overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Base Pay</TableHead>
                    <TableHead>Bonus</TableHead>
                    <TableHead>Deduction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item) => (
                    <TableRow key={item.employeeId}>
                      <TableCell className="font-medium">
                        {item.user.firstName} {item.user.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.basePay.toLocaleString()}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          className="h-8 w-28"
                          disabled={data.locked}
                          value={drafts[item.employeeId]?.bonus ?? '0'}
                          onChange={(e) => updateDraft(item.employeeId, 'bonus', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          className="h-8 w-28"
                          disabled={data.locked}
                          value={drafts[item.employeeId]?.deduction ?? '0'}
                          onChange={(e) => updateDraft(item.employeeId, 'deduction', e.target.value)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!data.locked && data.items.length > 0 && (
            <Button type="button" size="sm" className="w-fit" onClick={() => handleSave(data)} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : 'Save adjustments'}
            </Button>
          )}
        </div>
      )}
    </Modal>
  );
}
