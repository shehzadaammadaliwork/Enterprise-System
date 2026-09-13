import { useState, type SubmitEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useActivities, useCreateActivity, useCustomer, useDeals } from '../api/hooks';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { NotesSection } from '../components/NotesSection';
import { DocumentsSection } from '../../documents/components/DocumentsSection';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import type { ActivityInput } from '../api/crm.api';
import type { ActivityType } from '../api/types';

const DEAL_STAGE_VARIANT: Record<string, 'secondary' | 'outline' | 'destructive'> = {
  NEW: 'outline',
  QUALIFIED: 'outline',
  PROPOSAL: 'outline',
  NEGOTIATION: 'outline',
  WON: 'secondary',
  LOST: 'destructive',
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: customer, isLoading } = useCustomer(id);
  const { data: deals } = useDeals(id);
  const { data: activities } = useActivities(id ?? '');
  const createActivityMutation = useCreateActivity();

  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityForm, setActivityForm] = useState<Omit<ActivityInput, 'customerId'>>({
    type: 'MEETING',
    subject: '',
    notes: '',
    occurredAt: new Date().toISOString().slice(0, 16),
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (isLoading || !customer) return <p className="text-sm text-muted-foreground">Loading…</p>;

  function handleLogActivity(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;
    setErrorMessage(null);
    createActivityMutation.mutate(
      { ...activityForm, customerId: id, occurredAt: new Date(activityForm.occurredAt).toISOString() },
      {
        onSuccess: () => {
          setShowActivityForm(false);
          setActivityForm({ type: 'MEETING', subject: '', notes: '', occurredAt: new Date().toISOString().slice(0, 16) });
        },
        onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not log activity.')),
      },
    );
  }

  return (
    <div>
      <Link to="/crm/customers" className="mb-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="size-3.5" />
        Back to customers
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">{customer.companyName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{customer.contactName}</p>
      </div>

      <div className="mb-8 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Email</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{customer.email ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Phone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{customer.phone ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {[customer.city, customer.country].filter(Boolean).join(', ') || '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="deals">
        <TabsList>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="activities">Meetings &amp; calls</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="deals" className="mt-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{deals?.meta.total ?? 0} deal(s)</p>
            <Button variant="outline" size="sm" asChild>
              <Link to="/crm/deals">Manage deals</Link>
            </Button>
          </div>
          {!deals?.data.length ? (
            <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
              No deals for this customer yet.
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.data.map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell className="font-medium">{deal.title}</TableCell>
                      <TableCell>
                        <Badge variant={DEAL_STAGE_VARIANT[deal.stage]}>{deal.stage}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {deal.value !== null ? deal.value.toLocaleString(undefined, { style: 'currency', currency: 'USD' }) : '—'}
                      </TableCell>
                      <TableCell>
                        <Button variant="link" className="h-auto p-0" asChild>
                          <Link to={`/crm/deals/${deal.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="activities" className="mt-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{activities?.meta.total ?? 0} logged</p>
            <Button variant="outline" size="sm" onClick={() => setShowActivityForm((v) => !v)}>
              {showActivityForm ? 'Cancel' : 'Log meeting/call'}
            </Button>
          </div>

          {showActivityForm && (
            <Card className="mb-4">
              <CardContent>
                <form onSubmit={handleLogActivity} className="flex flex-col gap-4">
                  {errorMessage && (
                    <Alert variant="destructive">
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="activityType">Type</Label>
                      <Select
                        value={activityForm.type}
                        onValueChange={(value) => setActivityForm({ ...activityForm, type: value as ActivityType })}
                      >
                        <SelectTrigger id="activityType" className="w-full">
                          <SelectValue>{activityForm.type}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MEETING">MEETING</SelectItem>
                          <SelectItem value="CALL">CALL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="occurredAt">When</Label>
                      <Input
                        id="occurredAt"
                        type="datetime-local"
                        required
                        value={activityForm.occurredAt}
                        onChange={(e) => setActivityForm({ ...activityForm, occurredAt: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      required
                      value={activityForm.subject}
                      onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="activityNotes">Notes</Label>
                    <Input
                      id="activityNotes"
                      value={activityForm.notes ?? ''}
                      onChange={(e) => setActivityForm({ ...activityForm, notes: e.target.value })}
                    />
                  </div>
                  <Button type="submit" size="sm" className="w-fit" disabled={createActivityMutation.isPending}>
                    {createActivityMutation.isPending ? 'Saving…' : 'Save'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {!activities?.data.length ? (
            <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
              No meetings or calls logged yet.
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.data.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>{formatDateTime(activity.occurredAt)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{activity.type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{activity.subject}</TableCell>
                      <TableCell className="text-muted-foreground">{activity.notes ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <NotesSection target={{ customerId: customer.id }} />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <DocumentsSection entityType="Customer" entityId={customer.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
