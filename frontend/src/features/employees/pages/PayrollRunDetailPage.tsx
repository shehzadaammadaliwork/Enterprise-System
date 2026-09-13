import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePayrollRun } from '../api/hooks';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';

const STATUS_VARIANT: Record<string, 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'outline',
  PROCESSING: 'outline',
  COMPLETED: 'secondary',
  FAILED: 'destructive',
};

export function PayrollRunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: run, isLoading } = usePayrollRun(id);

  if (isLoading || !run) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const isBusy = run.status === 'PENDING' || run.status === 'PROCESSING';

  return (
    <div>
      <Link to="/payroll" className="mb-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="size-3.5" />
        Back to payroll
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Payroll — {run.month}/{run.year}
        </h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant={STATUS_VARIANT[run.status] ?? 'outline'}>{run.status}</Badge>
          <span>{run.scope === 'SELECTED' ? `Selected ${run.selectedEmployeeIds.length} employee(s)` : 'All active employees'}</span>
          {isBusy && 'Updating live as the background job runs…'}
        </p>
      </div>

      {run.status === 'FAILED' && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{run.errorMessage}</AlertDescription>
        </Alert>
      )}

      {!run.payslips.length ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          {isBusy ? 'Generating payslips…' : 'No payslips for this run.'}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Base Pay</TableHead>
                <TableHead>Bonus</TableHead>
                <TableHead>Deduction</TableHead>
                <TableHead>Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {run.payslips.map((payslip) => (
                <TableRow key={payslip.id}>
                  <TableCell className="font-medium">
                    {payslip.employee?.user.firstName} {payslip.employee?.user.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{payslip.employee?.designation}</TableCell>
                  <TableCell className="text-muted-foreground">{payslip.basePay.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {payslip.bonus ? `+${payslip.bonus.toLocaleString()}` : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payslip.deduction ? `−${payslip.deduction.toLocaleString()}` : '—'}
                  </TableCell>
                  <TableCell className="font-medium">{payslip.net.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
