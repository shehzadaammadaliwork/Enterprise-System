import { useRef, useState, type SubmitEvent } from 'react';
import {
  useAddDocumentVersion,
  useDeleteDocument,
  useDocuments,
  useRolesForAccessPicker,
  useSetDocumentAccess,
  useUploadDocument,
} from '../api/hooks';
import { useEmployees } from '../../employees/api/hooks';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { downloadDocumentVersion } from '../api/documents.api';
import { useAuthStore } from '../../../shared/stores/auth.store';
import { Modal } from '../../../shared/components/Modal';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Checkbox } from '../../../components/ui/checkbox';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import type { DocumentAccessScope, DocumentSummary } from '../api/types';

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ACCESS_LABEL: Record<DocumentAccessScope, string> = {
  EVERYONE: 'Everyone',
  SPECIFIC_ROLES: 'Specific roles',
  SPECIFIC_USERS: 'Specific users',
};

/// Reusable across any record type — mirrors NotesSection's cross-entity
/// pattern, but backed by its own `documents` RBAC module rather than the
/// host page's module, since the two permission sets are independent (a
/// user might see an Employee's profile without holding documents:VIEW).
export function DocumentsSection({ entityType, entityId }: { entityType: string; entityId: string }) {
  const canView = useAuthStore((s) => s.hasPermission('documents', 'VIEW'));
  const canCreate = useAuthStore((s) => s.hasPermission('documents', 'CREATE'));
  const canEdit = useAuthStore((s) => s.hasPermission('documents', 'EDIT'));
  const canDelete = useAuthStore((s) => s.hasPermission('documents', 'DELETE'));

  const { data, isLoading } = useDocuments(entityType, entityId);
  const uploadMutation = useUploadDocument(entityType, entityId);
  const addVersionMutation = useAddDocumentVersion(entityType, entityId);
  const deleteMutation = useDeleteDocument(entityType, entityId);

  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [accessTargetDoc, setAccessTargetDoc] = useState<DocumentSummary | null>(null);
  const versionInputRef = useRef<HTMLInputElement>(null);
  const [versionTargetId, setVersionTargetId] = useState<string | null>(null);

  if (!canView) return null;

  function handleUpload(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setErrorMessage(null);
    uploadMutation.mutate(
      { entityType, entityId, title, file },
      {
        onSuccess: () => {
          setShowUpload(false);
          setTitle('');
          setFile(null);
        },
        onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not upload document.')),
      },
    );
  }

  function handleAddVersionFile(id: string, selected: File | null) {
    if (!selected) return;
    setErrorMessage(null);
    addVersionMutation.mutate(
      { id, file: selected },
      { onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not upload new version.')) },
    );
  }

  function handleDelete(doc: DocumentSummary) {
    if (!confirm(`Delete "${doc.title}"? This removes all versions.`)) return;
    deleteMutation.mutate(doc.id, {
      onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not delete document.')),
    });
  }

  async function handleDownload(doc: DocumentSummary) {
    if (!doc.latestVersion) return;
    try {
      await downloadDocumentVersion(doc.id, undefined, doc.latestVersion.originalFileName);
    } catch (e) {
      setErrorMessage(extractApiErrorMessage(e, 'Could not download document.'));
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Documents</h2>
        {canCreate && (
          <Button type="button" variant="outline" size="sm" onClick={() => setShowUpload((v) => !v)}>
            {showUpload ? 'Cancel' : 'Upload document'}
          </Button>
        )}
      </div>

      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {showUpload && (
        <form onSubmit={handleUpload} className="mb-4 flex flex-col gap-3 rounded-lg border bg-card p-4">
          <div className="space-y-1.5">
            <Label htmlFor="doc-title">Title</Label>
            <Input id="doc-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-file">File</Label>
            <Input
              id="doc-file"
              type="file"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <Button type="submit" size="sm" className="w-fit" disabled={uploadMutation.isPending}>
            {uploadMutation.isPending ? 'Uploading…' : 'Upload'}
          </Button>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.data.length ? (
        <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
          No documents yet.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.data.map((doc) => (
            <li key={doc.id} className="rounded-lg border bg-card p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{doc.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {doc.latestVersion
                      ? `${doc.latestVersion.originalFileName} · ${formatBytes(doc.latestVersion.sizeBytes)} · v${doc.latestVersion.versionNumber}`
                      : 'No versions'}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Uploaded {formatDateTime(doc.createdAt)}
                    {doc.accessScope !== 'EVERYONE' && (
                      <>
                        {' · '}
                        <Badge variant="outline" className="align-middle">
                          {ACCESS_LABEL[doc.accessScope]}
                        </Badge>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  <Button variant="link" className="h-auto p-0 text-xs" onClick={() => handleDownload(doc)}>
                    Download
                  </Button>
                  {canEdit && (
                    <>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-xs"
                        onClick={() => {
                          setVersionTargetId(doc.id);
                          versionInputRef.current?.click();
                        }}
                      >
                        New version
                      </Button>
                      <Button variant="link" className="h-auto p-0 text-xs" onClick={() => setAccessTargetDoc(doc)}>
                        Restrict access
                      </Button>
                    </>
                  )}
                  {canDelete && (
                    <Button
                      variant="link"
                      className="h-auto p-0 text-xs text-destructive"
                      onClick={() => handleDelete(doc)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Single hidden file input reused for "new version" across every
          row — avoids one <input type=file> per document. */}
      <input
        ref={versionInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          if (versionTargetId) handleAddVersionFile(versionTargetId, e.target.files?.[0] ?? null);
          e.target.value = '';
          setVersionTargetId(null);
        }}
      />

      {accessTargetDoc && (
        <RestrictAccessModal
          document={accessTargetDoc}
          entityType={entityType}
          entityId={entityId}
          onClose={() => setAccessTargetDoc(null)}
        />
      )}
    </div>
  );
}

function RestrictAccessModal({
  document,
  entityType,
  entityId,
  onClose,
}: {
  document: DocumentSummary;
  entityType: string;
  entityId: string;
  onClose: () => void;
}) {
  const setAccessMutation = useSetDocumentAccess(entityType, entityId);
  const { data: roles } = useRolesForAccessPicker();
  const { data: employees } = useEmployees();

  const [scope, setScope] = useState<DocumentAccessScope>(document.accessScope);
  const [roleIds, setRoleIds] = useState<string[]>(
    document.accessGrants.map((g) => g.roleId).filter((v): v is string => !!v),
  );
  const [userIds, setUserIds] = useState<string[]>(
    document.accessGrants.map((g) => g.userId).filter((v): v is string => !!v),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((v) => v !== id) : [...list, id]);
  }

  function handleSave() {
    setErrorMessage(null);
    setAccessMutation.mutate(
      {
        id: document.id,
        input: {
          scope,
          roleIds: scope === 'SPECIFIC_ROLES' ? roleIds : undefined,
          userIds: scope === 'SPECIFIC_USERS' ? userIds : undefined,
        },
      },
      {
        onSuccess: onClose,
        onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not update access.')),
      },
    );
  }

  return (
    <Modal title={`Restrict access — ${document.title}`} onClose={onClose}>
      <div className="space-y-4">
        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="access-scope">Who can see this document</Label>
          <Select value={scope} onValueChange={(v) => setScope(v as DocumentAccessScope)}>
            <SelectTrigger id="access-scope" className="w-full">
              <SelectValue>{ACCESS_LABEL[scope]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EVERYONE">Everyone (with document access)</SelectItem>
              <SelectItem value="SPECIFIC_ROLES">Specific roles</SelectItem>
              <SelectItem value="SPECIFIC_USERS">Specific users</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {scope === 'SPECIFIC_ROLES' && (
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
            {!roles?.data.length ? (
              <p className="text-xs text-muted-foreground">No roles available (requires rbac:VIEW).</p>
            ) : (
              roles.data.map((role) => (
                <label key={role.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={roleIds.includes(role.id)}
                    onCheckedChange={() => toggle(roleIds, setRoleIds, role.id)}
                  />
                  {role.name}
                </label>
              ))
            )}
          </div>
        )}

        {scope === 'SPECIFIC_USERS' && (
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
            {!employees?.data.length ? (
              <p className="text-xs text-muted-foreground">No employees available.</p>
            ) : (
              employees.data.map((employee) => (
                <label key={employee.userId} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={userIds.includes(employee.userId)}
                    onCheckedChange={() => toggle(userIds, setUserIds, employee.userId)}
                  />
                  {employee.user.firstName} {employee.user.lastName}
                </label>
              ))
            )}
          </div>
        )}

        <Button type="button" className="w-full" onClick={handleSave} disabled={setAccessMutation.isPending}>
          {setAccessMutation.isPending ? 'Saving…' : 'Save access'}
        </Button>
      </div>
    </Modal>
  );
}
