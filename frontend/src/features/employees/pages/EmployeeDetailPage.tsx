import { useState, type SubmitEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  useCreatePerformanceReview,
  useDeactivateEmployee,
  useEmployee,
  useEmployeeAttendance,
  useEmployeePerformanceReviews,
  useEmployees,
  useUpdateEmployee,
} from '../api/hooks';
import { useDepartmentTree } from '../../organization/api/hooks';
import type { DepartmentTreeNode } from '../../organization/api/types';
import { EmployeeAccessSection } from '../components/EmployeeAccessSection';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { useAuthStore } from '../../../shared/stores/auth.store';
import { DocumentsSection } from '../../documents/components/DocumentsSection';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Modal } from '../../../shared/components/Modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import type { UpdateEmployeeInput } from '../api/employees.api';

const NO_DEPARTMENT = '__none__';
const NO_MANAGER = '__none__';

function flattenDepartments(nodes: DepartmentTreeNode[], depth = 0): { id: string; name: string; depth: number }[] {
  return nodes.flatMap((node) => [
    { id: node.id, name: node.name, depth },
    ...flattenDepartments(node.children, depth + 1),
  ]);
}

interface EditForm {
  departmentId: string;
  designation: string;
  joiningDate: string;
  reportingManagerId: string;
  salary: string;
  city: string;
  country: string;
  emergencyContactName: string;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: employee, isLoading } = useEmployee(id);
  const { data: attendance } = useEmployeeAttendance(id);
  const { data: reviews } = useEmployeePerformanceReviews(id);
  const deactivateMutation = useDeactivateEmployee();
  const createReviewMutation = useCreatePerformanceReview();
  const updateMutation = useUpdateEmployee();
  const canEdit = useAuthStore((state) => state.hasPermission('employees', 'EDIT'));
  const canEditSalary = useAuthStore((state) => state.hasPermission('payroll', 'EDIT'));
  const { data: departmentTree } = useDepartmentTree();
  const { data: managerCandidates } = useEmployees(undefined, 'ACTIVE', 100);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [rating, setRating] = useState(3);
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showEditForm, setShowEditForm] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editErrorMessage, setEditErrorMessage] = useState<string | null>(null);

  if (isLoading || !employee) return <p className="text-sm text-muted-foreground">Loading…</p>;

  function handleDeactivate() {
    if (!id || !confirm(`Deactivate ${employee!.user.firstName} ${employee!.user.lastName}?`)) return;
    deactivateMutation.mutate(id);
  }

  function openEdit() {
    setEditForm({
      departmentId: employee!.departmentId ?? NO_DEPARTMENT,
      designation: employee!.designation,
      joiningDate: employee!.joiningDate.slice(0, 10),
      reportingManagerId: employee!.reportingManagerId ?? NO_MANAGER,
      salary: employee!.salary !== undefined ? String(employee!.salary) : '',
      city: employee!.city ?? '',
      country: employee!.country ?? '',
      emergencyContactName: employee!.emergencyContactName ?? '',
    });
    setEditErrorMessage(null);
    setShowEditForm(true);
  }

  function handleEditSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id || !editForm) return;
    setEditErrorMessage(null);
    const input: UpdateEmployeeInput = {
      departmentId: editForm.departmentId === NO_DEPARTMENT ? null : editForm.departmentId,
      designation: editForm.designation,
      joiningDate: editForm.joiningDate,
      reportingManagerId: editForm.reportingManagerId === NO_MANAGER ? null : editForm.reportingManagerId,
      city: editForm.city || undefined,
      country: editForm.country || undefined,
      emergencyContactName: editForm.emergencyContactName || undefined,
    };
    if (canEditSalary) {
      input.salary = Number(editForm.salary) || 0;
    }
    updateMutation.mutate(
      { id, input },
      {
        onSuccess: () => setShowEditForm(false),
        onError: (e) => setEditErrorMessage(extractApiErrorMessage(e, 'Could not save changes.')),
      },
    );
  }

  const flatDepartments = departmentTree ? flattenDepartments(departmentTree) : [];
  const managers = (managerCandidates?.data ?? []).filter((candidate) => candidate.id !== id);

  function handleSubmitReview(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;
    setErrorMessage(null);
    createReviewMutation.mutate(
      { employeeId: id, input: { periodStart, periodEnd, rating, notes: notes || undefined } },
      {
        onSuccess: () => {
          setShowReviewForm(false);
          setPeriodStart('');
          setPeriodEnd('');
          setNotes('');
        },
        onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not save review.')),
      },
    );
  }

  return (
    <div>
      <Link to="/employees" className="mb-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="size-3.5" />
        Back to employees
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {employee.user.firstName} {employee.user.lastName}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {employee.designation} {employee.department ? `· ${employee.department.name}` : ''}
            <Badge variant="outline">{employee.status}</Badge>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {canEdit && (
            <Button type="button" variant="outline" onClick={openEdit}>
              Edit
            </Button>
          )}
          {employee.status !== 'TERMINATED' && (
            <Button type="button" variant="outline" onClick={handleDeactivate} disabled={deactivateMutation.isPending}>
              Deactivate
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        {employee.salary !== undefined && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Salary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employee.salary.toLocaleString()}</div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Joined</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{formatDate(employee.joiningDate)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reporting manager</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {employee.reportingManager
                ? `${employee.reportingManager.user.firstName} ${employee.reportingManager.user.lastName}`
                : '—'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Emergency contact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{employee.emergencyContactName ?? '—'}</div>
            <p className="mt-0.5 text-sm text-muted-foreground">{employee.emergencyContactPhone ?? ''}</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-3 text-lg font-semibold text-foreground">Attendance history</h2>
      {!attendance?.data.length ? (
        <div className="mb-6 rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
          No attendance records yet.
        </div>
      ) : (
        <div className="mb-6 rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Check in</TableHead>
                <TableHead>Check out</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.data.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{formatDate(record.date)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {record.checkInAt ? new Date(record.checkInAt).toLocaleTimeString() : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {record.checkOutAt ? new Date(record.checkOutAt).toLocaleTimeString() : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Performance reviews</h2>
        <Button type="button" variant="outline" size="sm" onClick={() => setShowReviewForm((v) => !v)}>
          {showReviewForm ? 'Cancel' : 'Add review'}
        </Button>
      </div>

      {showReviewForm && (
        <Card className="mb-4">
          <CardContent>
            <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="periodStart">Period start</Label>
                  <Input
                    id="periodStart"
                    type="date"
                    required
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="periodEnd">Period end</Label>
                  <Input
                    id="periodEnd"
                    type="date"
                    required
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="rating">Rating (1-5)</Label>
                  <Input
                    id="rating"
                    type="number"
                    min={1}
                    max={5}
                    required
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <Button type="submit" size="sm" className="w-fit" disabled={createReviewMutation.isPending}>
                {createReviewMutation.isPending ? 'Saving…' : 'Save review'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {!reviews?.data.length ? (
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
              {reviews.data.map((review) => (
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

      <div className="mt-8">
        <EmployeeAccessSection employeeId={employee.id} userId={employee.userId} />
      </div>

      <div className="mt-8">
        <DocumentsSection entityType="Employee" entityId={employee.id} />
      </div>

      {showEditForm && editForm && (
        <Modal title={`Edit ${employee.user.firstName} ${employee.user.lastName}`} onClose={() => setShowEditForm(false)}>
          {editErrorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{editErrorMessage}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="editDesignation">Designation</Label>
              <Input
                id="editDesignation"
                required
                value={editForm.designation}
                onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="editDepartment">Department</Label>
                <Select
                  value={editForm.departmentId}
                  onValueChange={(value) => setEditForm({ ...editForm, departmentId: value })}
                >
                  <SelectTrigger id="editDepartment" className="w-full">
                    <SelectValue>
                      {editForm.departmentId === NO_DEPARTMENT
                        ? 'No department'
                        : (flatDepartments.find((d) => d.id === editForm.departmentId)?.name ?? 'No department')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_DEPARTMENT}>No department</SelectItem>
                    {flatDepartments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {'—'.repeat(dept.depth)} {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="editManager">Reporting manager</Label>
                <Select
                  value={editForm.reportingManagerId}
                  onValueChange={(value) => setEditForm({ ...editForm, reportingManagerId: value })}
                >
                  <SelectTrigger id="editManager" className="w-full">
                    <SelectValue>
                      {editForm.reportingManagerId === NO_MANAGER
                        ? 'No manager'
                        : (() => {
                            const manager = managers.find((m) => m.id === editForm.reportingManagerId);
                            return manager ? `${manager.user.firstName} ${manager.user.lastName}` : 'No manager';
                          })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_MANAGER}>No manager</SelectItem>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.user.firstName} {manager.user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="editJoiningDate">Joining date</Label>
                <Input
                  id="editJoiningDate"
                  type="date"
                  required
                  value={editForm.joiningDate}
                  onChange={(e) => setEditForm({ ...editForm, joiningDate: e.target.value })}
                />
              </div>
              {canEditSalary && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="editSalary">Salary</Label>
                  <Input
                    id="editSalary"
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={editForm.salary}
                    onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="editCity">City</Label>
                <Input id="editCity" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="editCountry">Country</Label>
                <Input
                  id="editCountry"
                  value={editForm.country}
                  onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="editEmergencyName">Emergency contact</Label>
              <Input
                id="editEmergencyName"
                value={editForm.emergencyContactName}
                onChange={(e) => setEditForm({ ...editForm, emergencyContactName: e.target.value })}
              />
            </div>

            <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
