import { useState, type SubmitEvent } from 'react';
import { Link } from 'react-router-dom';
import { useCreateEmployee, useEmployees } from '../api/hooks';
import { useRoles } from '../../rbac/api/hooks';
import { useDepartmentTree } from '../../organization/api/hooks';
import type { DepartmentTreeNode } from '../../organization/api/types';
import { UserPicker } from '../components/UserPicker';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Modal } from '../../../shared/components/Modal';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Checkbox } from '../../../components/ui/checkbox';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import type { CreateEmployeeInput } from '../api/employees.api';

const NO_DEPARTMENT = '__none__';
const NO_MANAGER = '__none__';

function flattenDepartments(nodes: DepartmentTreeNode[], depth = 0): { id: string; name: string; depth: number }[] {
  return nodes.flatMap((node) => [
    { id: node.id, name: node.name, depth },
    ...flattenDepartments(node.children, depth + 1),
  ]);
}

const EMPTY_FORM: CreateEmployeeInput = {
  userId: '',
  roleIds: [],
  departmentId: NO_DEPARTMENT,
  designation: '',
  joiningDate: '',
  reportingManagerId: NO_MANAGER,
  salary: 0,
  city: '',
  country: '',
  emergencyContactName: '',
};

export function EmployeesPage() {
  const { data, isLoading } = useEmployees();
  const { data: roles } = useRoles();
  const { data: departmentTree } = useDepartmentTree();
  const { data: managerCandidates } = useEmployees(undefined, 'ACTIVE', 100);
  const createMutation = useCreateEmployee();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateEmployeeInput>(EMPTY_FORM);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const flatDepartments = departmentTree ? flattenDepartments(departmentTree) : [];
  const managers = managerCandidates?.data ?? [];

  function openCreate() {
    setForm(EMPTY_FORM);
    setErrorMessage(null);
    setShowForm(true);
  }

  function toggleRole(roleId: string, checked: boolean) {
    setForm((prev) => ({
      ...prev,
      roleIds: checked ? [...prev.roleIds, roleId] : prev.roleIds.filter((id) => id !== roleId),
    }));
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    // UserPicker isn't a native input, so there's no browser-level
    // `required` to lean on here — check explicitly.
    if (!form.userId) {
      setErrorMessage('Select a user to onboard.');
      return;
    }
    // Hard validation (spec: "must not allow the employee to be saved
    // without at least one assigned role") — the backend also rejects an
    // empty roleIds array, this just avoids a round trip for the common
    // case of forgetting to check one.
    if (form.roleIds.length === 0) {
      setErrorMessage('Select at least one RBAC role.');
      return;
    }
    setErrorMessage(null);
    const input: CreateEmployeeInput = {
      ...form,
      departmentId: form.departmentId === NO_DEPARTMENT ? undefined : form.departmentId,
      reportingManagerId: form.reportingManagerId === NO_MANAGER ? undefined : form.reportingManagerId,
      city: form.city || undefined,
      country: form.country || undefined,
      emergencyContactName: form.emergencyContactName || undefined,
    };
    createMutation.mutate(input, {
      onSuccess: () => setShowForm(false),
      onError: (error) => setErrorMessage(extractApiErrorMessage(error, 'Could not create employee profile.')),
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Employees</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Employee profiles, department assignment and reporting lines.
        </p>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data?.meta.total ?? 0} employee(s)</p>
        <Button type="button" size="sm" onClick={openCreate}>
          Add employee
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.data.length ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          No employee profiles yet.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">
                    {employee.user.firstName} {employee.user.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{employee.designation}</TableCell>
                  <TableCell className="text-muted-foreground">{employee.department?.name ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{employee.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="link" className="h-auto p-0" asChild>
                      <Link to={`/employees/${employee.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {showForm && (
        <Modal
          title="Add employee"
          onClose={() => setShowForm(false)}
          footer={
            <Button
              type="submit"
              form="add-employee-form"
              className="w-full"
              disabled={createMutation.isPending || !form.userId || form.roleIds.length === 0}
            >
              {createMutation.isPending ? 'Creating…' : 'Create profile'}
            </Button>
          }
        >
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <form id="add-employee-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>User</Label>
              <UserPicker value={form.userId} onChange={(userId) => setForm({ ...form, userId })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                required
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={form.departmentId ?? NO_DEPARTMENT}
                  onValueChange={(value) => setForm({ ...form, departmentId: value })}
                >
                  <SelectTrigger id="department" className="w-full">
                    <SelectValue>
                      {form.departmentId === NO_DEPARTMENT || !form.departmentId
                        ? 'No department'
                        : (flatDepartments.find((d) => d.id === form.departmentId)?.name ?? 'No department')}
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
                <Label htmlFor="manager">Reporting manager</Label>
                <Select
                  value={form.reportingManagerId ?? NO_MANAGER}
                  onValueChange={(value) => setForm({ ...form, reportingManagerId: value })}
                >
                  <SelectTrigger id="manager" className="w-full">
                    <SelectValue>
                      {form.reportingManagerId === NO_MANAGER || !form.reportingManagerId
                        ? 'No manager'
                        : (() => {
                            const manager = managers.find((m) => m.id === form.reportingManagerId);
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
                <Label htmlFor="joiningDate">Joining date</Label>
                <Input
                  id="joiningDate"
                  type="date"
                  required
                  value={form.joiningDate}
                  onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={form.city ?? ''} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={form.country ?? ''}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="emergencyContact">Emergency contact</Label>
              <Input
                id="emergencyContact"
                value={form.emergencyContactName ?? ''}
                onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-2 rounded-lg border p-3">
              <Label>
                System access <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Designation is HR information only — select at least one RBAC role to grant actual access.
              </p>
              {!roles?.data.length ? (
                <p className="text-sm text-muted-foreground">No roles available.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {roles.data.map((role) => (
                    <label key={role.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.roleIds.includes(role.id)}
                        onCheckedChange={(checked) => toggleRole(role.id, checked === true)}
                      />
                      {role.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
