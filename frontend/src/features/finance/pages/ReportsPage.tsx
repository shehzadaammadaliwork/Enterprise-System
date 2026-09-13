import { useState } from 'react';
import { useBankAccounts, useCashFlow, useProfitAndLoss } from '../api/hooks';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { formatMoney } from '../lib/format';

function firstOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ReportsPage() {
  const [dateFrom, setDateFrom] = useState(firstOfMonth());
  const [dateTo, setDateTo] = useState(today());
  const [bankAccountId, setBankAccountId] = useState<string | undefined>(undefined);

  const { data: accounts } = useBankAccounts();
  const filters = dateFrom && dateTo ? { dateFrom, dateTo, bankAccountId } : undefined;
  const { data: pnl, isLoading: pnlLoading } = useProfitAndLoss(filters);
  const { data: cashFlow, isLoading: cashFlowLoading } = useCashFlow(filters);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Profit &amp; loss and cash flow for a date range, based on approved transactions.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reportDateFrom">From</Label>
          <Input id="reportDateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reportDateTo">To</Label>
          <Input id="reportDateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reportAccount">Account</Label>
          <Select
            value={bankAccountId ?? '__all__'}
            onValueChange={(value) => setBankAccountId(value === '__all__' ? undefined : value)}
          >
            <SelectTrigger id="reportAccount" className="w-full">
              <SelectValue>{accounts?.data.find((a) => a.id === bankAccountId)?.name ?? 'All accounts'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All accounts</SelectItem>
              {(accounts?.data ?? []).map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-semibold text-foreground">Profit &amp; loss</h2>
      {pnlLoading || !pnl ? (
        <p className="mb-8 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="mb-8">
          <div className="mb-4 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">{formatMoney(pnl.income)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">{formatMoney(pnl.expenses)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Net profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${pnl.netProfit < 0 ? 'text-destructive' : ''}`}>
                  {formatMoney(pnl.netProfit)}
                </div>
              </CardContent>
            </Card>
          </div>

          {pnl.byCategory.length === 0 ? (
            <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
              No approved transactions in this range.
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pnl.byCategory.map((row) => (
                    <TableRow key={`${row.type}-${row.category}`}>
                      <TableCell>
                        <Badge variant={row.type === 'INCOME' ? 'secondary' : 'outline'}>{row.type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{row.category}</TableCell>
                      <TableCell className="text-muted-foreground">{formatMoney(row.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      <h2 className="mb-3 text-lg font-semibold text-foreground">Cash flow</h2>
      {cashFlowLoading || !cashFlow ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Opening balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">{formatMoney(cashFlow.openingBalance)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total inflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">{formatMoney(cashFlow.totalInflow)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total outflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">{formatMoney(cashFlow.totalOutflow)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Closing balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMoney(cashFlow.closingBalance)}</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
