import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useEmployees } from '../../employees/api/hooks';
import {
  useFinanceOverviewReport,
  useHrReport,
  useSalesPerformanceReport,
} from '../api/hooks';
import * as api from '../api/reports.api';
import type { ReportExportFormat } from '../api/types';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { formatMoney } from '../../finance/lib/format';

function firstOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function ExportButtons({
  onExport,
  disabled,
}: {
  onExport: (format: ReportExportFormat) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex gap-2">
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => onExport('pdf')}>
        <Download className="size-4" />
        Export PDF
      </Button>
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => onExport('excel')}>
        <Download className="size-4" />
        Export Excel
      </Button>
    </div>
  );
}

export function ReportsHubPage() {
  const [dateFrom, setDateFrom] = useState(firstOfMonth());
  const [dateTo, setDateTo] = useState(today());
  const [assignedToUserId, setAssignedToUserId] = useState<string | undefined>(undefined);

  const dateFilters = dateFrom && dateTo ? { dateFrom, dateTo } : undefined;
  const salesFilters = dateFilters ? { ...dateFilters, assignedToUserId } : undefined;

  const { data: employees } = useEmployees();
  const repOptions = useMemo(
    () => (employees?.data ?? []).map((e) => ({ userId: e.user.id, name: `${e.user.firstName} ${e.user.lastName}` })),
    [employees],
  );

  const { data: sales, isLoading: salesLoading } = useSalesPerformanceReport(salesFilters);
  const { data: hr, isLoading: hrLoading } = useHrReport(dateFilters);
  const { data: finance, isLoading: financeLoading } = useFinanceOverviewReport(dateFilters);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Reports &amp; Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sales performance, HR, and finance reports for a date range — export any of them as PDF or Excel.
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
      </div>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Sales performance</TabsTrigger>
          <TabsTrigger value="hr">HR</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reportRep">Rep</Label>
              <Select
                value={assignedToUserId ?? '__all__'}
                onValueChange={(value) => setAssignedToUserId(value === '__all__' ? undefined : value)}
              >
                <SelectTrigger id="reportRep" className="w-56">
                  <SelectValue>
                    {repOptions.find((r) => r.userId === assignedToUserId)?.name ?? 'All reps'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All reps</SelectItem>
                  {repOptions.map((rep) => (
                    <SelectItem key={rep.userId} value={rep.userId}>
                      {rep.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ExportButtons
              disabled={!salesFilters}
              onExport={(format) => salesFilters && api.exportSalesPerformanceReport(salesFilters, format)}
            />
          </div>

          {salesLoading || !sales ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <>
              <div className="mb-6 grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total deals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold">{sales.totalDeals}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Won value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold">{formatMoney(sales.wonValue)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Win rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatPercent(sales.winRate)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Open deals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold">{sales.openDeals}</div>
                  </CardContent>
                </Card>
              </div>

              {sales.byRep.length === 0 ? (
                <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                  No deals created in this range.
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rep</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Won</TableHead>
                        <TableHead>Lost</TableHead>
                        <TableHead>Open</TableHead>
                        <TableHead>Won value</TableHead>
                        <TableHead>Win rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.byRep.map((rep) => (
                        <TableRow key={rep.assignedToUserId ?? 'unassigned'}>
                          <TableCell className="font-medium">{rep.displayName}</TableCell>
                          <TableCell>{rep.totalDeals}</TableCell>
                          <TableCell>{rep.wonDeals}</TableCell>
                          <TableCell>{rep.lostDeals}</TableCell>
                          <TableCell>{rep.openDeals}</TableCell>
                          <TableCell className="text-muted-foreground">{formatMoney(rep.wonValue)}</TableCell>
                          <TableCell className="text-muted-foreground">{formatPercent(rep.winRate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="hr" className="mt-6">
          <div className="mb-4 flex justify-end">
            <ExportButtons
              disabled={!dateFilters}
              onExport={(format) => dateFilters && api.exportHrReport(dateFilters, format)}
            />
          </div>

          {hrLoading || !hr ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <>
              <div className="mb-6 grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Active headcount</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold">{hr.headcount}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Attendance days</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold">{hr.totalAttendanceDays}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Leave requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{hr.totalLeaveRequests}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <h2 className="mb-3 text-sm font-semibold text-foreground">Daily attendance</h2>
                  {hr.dailyAttendance.length === 0 ? (
                    <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                      No attendance records in this range.
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Present</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {hr.dailyAttendance.map((row) => (
                            <TableRow key={row.date}>
                              <TableCell>{row.date}</TableCell>
                              <TableCell>{row.present}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="mb-3 text-sm font-semibold text-foreground">Leave by type</h2>
                  {hr.leaveByType.length === 0 ? (
                    <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                      No leave requests overlapping this range.
                    </div>
                  ) : (
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Pending</TableHead>
                            <TableHead>Approved</TableHead>
                            <TableHead>Rejected</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {hr.leaveByType.map((row) => (
                            <TableRow key={row.leaveType}>
                              <TableCell className="font-medium">{row.leaveType}</TableCell>
                              <TableCell>{row.pending}</TableCell>
                              <TableCell>{row.approved}</TableCell>
                              <TableCell>{row.rejected}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="finance" className="mt-6">
          <div className="mb-4 flex justify-end">
            <ExportButtons
              disabled={!dateFilters}
              onExport={(format) => dateFilters && api.exportFinanceOverviewReport(dateFilters, format)}
            />
          </div>

          {financeLoading || !finance ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <>
              <div className="mb-6 grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Income</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold">{formatMoney(finance.income)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Expenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold">{formatMoney(finance.expenses)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Net profit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${finance.netProfit < 0 ? 'text-destructive' : ''}`}>
                      {formatMoney(finance.netProfit)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding invoices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold">
                      {finance.outstandingInvoicesCount} &middot; {formatMoney(finance.outstandingInvoicesTotal)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {finance.byCategory.length === 0 ? (
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
                      {finance.byCategory.map((row) => (
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
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
