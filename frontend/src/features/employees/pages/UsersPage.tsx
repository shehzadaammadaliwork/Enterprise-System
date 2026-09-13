import { useState } from 'react';
import { useUsers } from '../api/hooks';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';

type OnboardFilter = 'ALL' | 'NOT_ONBOARDED' | 'ONBOARDED';

/// Read-only visibility into registered User accounts and whether each one
/// already has a linked Employee profile — the gap this closes: Admin/HR
/// previously had to query the database directly to find a user's id
/// before they could onboard them via "Add employee".
export function UsersPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<OnboardFilter>('ALL');

  const needsOnboarding = filter === 'NOT_ONBOARDED' ? true : filter === 'ONBOARDED' ? false : undefined;
  const { data, isLoading } = useUsers(search || undefined, needsOnboarding, 100);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every registered account and whether it's already been set up as an employee.
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-2">
          <Button type="button" size="sm" variant={filter === 'ALL' ? 'default' : 'outline'} onClick={() => setFilter('ALL')}>
            All
          </Button>
          <Button
            type="button"
            size="sm"
            variant={filter === 'NOT_ONBOARDED' ? 'default' : 'outline'}
            onClick={() => setFilter('NOT_ONBOARDED')}
          >
            Not onboarded
          </Button>
          <Button
            type="button"
            size="sm"
            variant={filter === 'ONBOARDED' ? 'default' : 'outline'}
            onClick={() => setFilter('ONBOARDED')}
          >
            Onboarded
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.data.length ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          No matching users.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={user.hasEmployeeProfile ? 'secondary' : 'outline'}>
                      {user.hasEmployeeProfile ? 'Onboarded' : 'Not onboarded'}
                    </Badge>
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
