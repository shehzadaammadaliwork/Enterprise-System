import { useState, type SubmitEvent } from 'react';
import {
  useBranches,
  useCreateDepartment,
  useDeleteDepartment,
  useDepartmentTree,
  useUpdateDepartment,
} from '../api/hooks';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Modal } from '../../../shared/components/Modal';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import type { DepartmentTreeNode } from '../api/types';
import type { DepartmentInput } from '../api/organization.api';

const EMPTY_FORM: DepartmentInput = { name: '', code: '', branchId: null, parentId: null };
const NO_BRANCH = '__none__';

interface EditTarget {
  id: string | 'new';
  name: string;
}

function DepartmentNode({
  node,
  depth,
  onEdit,
  onDelete,
  onAddChild,
}: {
  node: DepartmentTreeNode;
  depth: number;
  onEdit: (node: DepartmentTreeNode) => void;
  onDelete: (node: DepartmentTreeNode) => void;
  onAddChild: (parent: DepartmentTreeNode) => void;
}) {
  return (
    <li>
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3.5 py-2.5">
        <div>
          <div className="font-medium text-foreground">{node.name}</div>
          <div className="text-xs text-muted-foreground">
            {node.code ? `${node.code} · ` : ''}
            {node.branch?.name ?? 'No branch'}
          </div>
        </div>
        <div className="flex shrink-0 gap-3 whitespace-nowrap">
          <Button variant="link" className="h-auto p-0" onClick={() => onAddChild(node)}>
            Add sub-department
          </Button>
          <Button variant="link" className="h-auto p-0" onClick={() => onEdit(node)}>
            Edit
          </Button>
          <Button variant="link" className="h-auto p-0 text-destructive" onClick={() => onDelete(node)}>
            Delete
          </Button>
        </div>
      </div>
      {node.children.length > 0 && (
        <ul className="mt-2 flex flex-col gap-2 pl-6">
          {node.children.map((child) => (
            <DepartmentNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function DepartmentsTab() {
  const { data: tree, isLoading } = useDepartmentTree();
  const { data: branchesData } = useBranches();
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();

  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [form, setForm] = useState<DepartmentInput>(EMPTY_FORM);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function openCreate(parentId: string | null = null) {
    setForm({ ...EMPTY_FORM, parentId });
    setErrorMessage(null);
    setEditing({ id: 'new', name: 'department' });
  }

  function openEdit(node: DepartmentTreeNode) {
    setForm({ name: node.name, code: node.code ?? '', branchId: node.branchId, parentId: node.parentId });
    setErrorMessage(null);
    setEditing({ id: node.id, name: node.name });
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    const onError = (error: unknown) => setErrorMessage(extractApiErrorMessage(error, 'Could not save department.'));
    const onSuccess = () => setEditing(null);

    if (editing?.id === 'new') {
      createMutation.mutate(form, { onSuccess, onError });
    } else if (editing) {
      updateMutation.mutate({ id: editing.id, input: form }, { onSuccess, onError });
    }
  }

  function handleDelete(node: DepartmentTreeNode) {
    if (!confirm(`Delete "${node.name}"? Its sub-departments will move up a level.`)) return;
    deleteMutation.mutate(node.id);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const branches = branchesData?.data ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{tree?.length ?? 0} top-level department(s)</p>
        <Button type="button" size="sm" onClick={() => openCreate(null)}>
          Add department
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !tree?.length ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          No departments yet.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {tree.map((node) => (
            <DepartmentNode
              key={node.id}
              node={node}
              depth={0}
              onEdit={openEdit}
              onDelete={handleDelete}
              onAddChild={(parent) => openCreate(parent.id)}
            />
          ))}
        </ul>
      )}

      {editing && (
        <Modal title={editing.id === 'new' ? 'Add department' : `Edit ${editing.name}`} onClose={() => setEditing(null)}>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deptName">Name</Label>
              <Input
                id="deptName"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deptCode">Code</Label>
              <Input
                id="deptCode"
                value={form.code ?? ''}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deptBranch">Branch</Label>
              <Select
                value={form.branchId ?? NO_BRANCH}
                onValueChange={(value) => setForm({ ...form, branchId: value === NO_BRANCH ? null : value })}
              >
                <SelectTrigger id="deptBranch" className="w-full">
                  <SelectValue>
                    {form.branchId ? (branches.find((b) => b.id === form.branchId)?.name ?? 'No branch') : 'No branch'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_BRANCH}>No branch</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
