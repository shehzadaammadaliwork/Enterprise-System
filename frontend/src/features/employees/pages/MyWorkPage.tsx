import { useState, type SubmitEvent } from 'react';
import { Navigate } from 'react-router-dom';
import {
  useCheckIn,
  useCheckOut,
  useCreateLeaveRequest,
  useMyAttendance,
  useMyEmployeeProfile,
  useMyLeaveRequests,
  useMyPayslips,
  useMyPerformanceReviews,
} from '../api/hooks';
import { useCreatePurchaseRequest, useMyPurchaseRequests } from '../../purchasing/api/hooks';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import type { LeaveType } from '../api/types';
import type { PurchaseRequestCategory } from '../../purchasing/api/types';

const LEAVE_TYPES: LeaveType[] = ['SICK', 'CASUAL', 'ANNUAL', 'UNPAID', 'OTHER'];
const PURCHASE_REQUEST_CATEGORIES: PurchaseRequestCategory[] = ['EQUIPMENT', 'SOFTWARE_SUBSCRIPTION', 'OTHER'];

const PURCHASE_REQUEST_STATUS_BADGE_VARIANT: Record<string, 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'outline',
  APPROVED: 'secondary',
  PURCHASED: 'secondary',
  REJECTED: 'destructive',
};

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function MyWorkPage() {
  const { data: profile, isLoading: profileLoading, error: profileError } = useMyEmployeeProfile();

  if (profileLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  // No Employee profile (States B/C) — the nav item is hidden in both, so
  // this page shouldn't normally be reached; if hit directly by URL, bounce
  // to the Dashboard rather than showing a dead-end message here.
  if (profileError) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">My work</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {profile!.designation}
          {profile!.department ? ` · ${profile!.department.name}` : ''}
        </p>
      </div>

      <div className="mb-8 grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
        <AttendanceWidget />
      </div>

      <div className="flex flex-col gap-8">
        <LeaveSection />
        <PurchaseRequestsSection />
        <PayslipsSection />
        <ReviewsSection />
      </div>
    </div>
  );
}

function AttendanceWidget() {
  const { data, isLoading } = useMyAttendance();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const today = data?.data[0];
  const isToday = today && new Date(today.date).toDateString() === new Date().toDateString();
  const canCheckIn = !isToday || !today?.checkInAt;
  const canCheckOut = isToday && today?.checkInAt && !today?.checkOutAt;

  function handleCheckIn() {
    setErrorMessage(null);
    checkInMutation.mutate(undefined, { onError: (e) => setErrorMessage(extractApiErrorMessage(e)) });
  }

  function handleCheckOut() {
    setErrorMessage(null);
    checkOutMutation.mutate(undefined, { onError: (e) => setErrorMessage(extractApiErrorMessage(e)) });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Today's attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{isToday && today?.checkInAt ? formatTime(today.checkInAt) : '—'}</div>
        <p className="mt-1 mb-3 text-sm text-muted-foreground">
          {isToday && today?.checkOutAt ? `Checked out ${formatTime(today.checkOutAt)}` : 'Not checked out'}
        </p>
        {errorMessage && (
          <Alert variant="destructive" className="mb-3">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        {!isLoading && (
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleCheckIn}
              disabled={!canCheckIn || checkInMutation.isPending}
            >
              Check in
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCheckOut}
              disabled={!canCheckOut || checkOutMutation.isPending}
            >
              Check out
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LeaveSection() {
  const { data, isLoading } = useMyLeaveRequests();
  const createMutation = useCreateLeaveRequest();
  const [showForm, setShowForm] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>('CASUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    createMutation.mutate(
      { leaveType, startDate, endDate, reason: reason || undefined },
      {
        onSuccess: () => {
          setShowForm(false);
          setStartDate('');
          setEndDate('');
          setReason('');
        },
        onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not submit leave request.')),
      },
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Leave requests</h2>
        <Button type="button" variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : 'Request leave'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4">
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="leaveType">Type</Label>
                  <Select value={leaveType} onValueChange={(value) => setLeaveType(value as LeaveType)}>
                    <SelectTrigger id="leaveType" className="w-full">
                      <SelectValue>{leaveType}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {LEAVE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="startDate">Start date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="endDate">End date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reason">Reason</Label>
                <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
              <Button type="submit" size="sm" className="w-fit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Submitting…' : 'Submit request'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.data.length ? (
        <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
          No leave requests yet.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>{req.leaveType}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(req.startDate)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(req.endDate)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{req.status}</Badge>
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

function PurchaseRequestsSection() {
  const { data, isLoading } = useMyPurchaseRequests();
  const createMutation = useCreatePurchaseRequest();
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState<PurchaseRequestCategory>('EQUIPMENT');
  const [description, setDescription] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    createMutation.mutate(
      { description, category, estimatedCost: Number(estimatedCost), reason },
      {
        onSuccess: () => {
          setShowForm(false);
          setDescription('');
          setEstimatedCost('');
          setReason('');
        },
        onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not submit purchase request.')),
      },
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Purchase requests</h2>
        <Button type="button" variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : 'New request'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4">
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pr-category">Category</Label>
                  <Select value={category} onValueChange={(value) => setCategory(value as PurchaseRequestCategory)}>
                    <SelectTrigger id="pr-category" className="w-full">
                      <SelectValue>{category}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {PURCHASE_REQUEST_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pr-cost">Estimated cost</Label>
                  <Input
                    id="pr-cost"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pr-description">What do you need?</Label>
                <Input id="pr-description" required value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pr-reason">Reason</Label>
                <Input id="pr-reason" required value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
              <Button type="submit" size="sm" className="w-fit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Submitting…' : 'Submit request'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.data.length ? (
        <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
          No purchase requests yet.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Estimated cost</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>#{request.number}</TableCell>
                  <TableCell className="text-muted-foreground">{request.description}</TableCell>
                  <TableCell className="text-muted-foreground">{request.category}</TableCell>
                  <TableCell className="text-muted-foreground">{formatMoney(request.estimatedCost)}</TableCell>
                  <TableCell>
                    <Badge variant={PURCHASE_REQUEST_STATUS_BADGE_VARIANT[request.status]}>{request.status}</Badge>
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

function PayslipsSection() {
  const { data, isLoading } = useMyPayslips();

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-foreground">My payslips</h2>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.data.length ? (
        <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
          No payslips yet.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Base Pay</TableHead>
                <TableHead>Bonus</TableHead>
                <TableHead>Deduction</TableHead>
                <TableHead>Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((payslip) => (
                <TableRow key={payslip.id}>
                  <TableCell>
                    {payslip.payrollRun?.month}/{payslip.payrollRun?.year}
                  </TableCell>
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

function ReviewsSection() {
  const { data, isLoading } = useMyPerformanceReviews();

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-foreground">My performance reviews</h2>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.data.length ? (
        <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
          No performance reviews yet.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    {formatDate(review.periodStart)} – {formatDate(review.periodEnd)}
                  </TableCell>
                  <TableCell className="text-amber-500">{'★'.repeat(review.rating)}</TableCell>
                  <TableCell className="text-muted-foreground">{review.notes ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
