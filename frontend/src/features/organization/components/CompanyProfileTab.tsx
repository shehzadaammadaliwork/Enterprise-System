import { useEffect, useState, type SubmitEvent } from 'react';
import { useCompanyProfile, useUpdateCompanyProfile } from '../api/hooks';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function CompanyProfileTab() {
  const { data: profile, isLoading } = useCompanyProfile();
  const updateMutation = useUpdateCompanyProfile();

  const [name, setName] = useState('');
  const [fiscalYearStartMonth, setFiscalYearStartMonth] = useState(1);
  const [workingHoursStart, setWorkingHoursStart] = useState('09:00');
  const [workingHoursEnd, setWorkingHoursEnd] = useState('18:00');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name);
    setFiscalYearStartMonth(profile.fiscalYearStartMonth);
    setWorkingHoursStart(profile.workingHoursStart);
    setWorkingHoursEnd(profile.workingHoursEnd);
  }, [profile]);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSaved(false);
    updateMutation.mutate(
      { name, fiscalYearStartMonth, workingHoursStart, workingHoursEnd },
      {
        onSuccess: () => setSaved(true),
        onError: (error) => setErrorMessage(extractApiErrorMessage(error, 'Could not save company profile.')),
      },
    );
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <Card className="max-w-120">
      <CardContent>
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        {saved && (
          <Alert className="mb-4 border-primary/30 bg-primary/5">
            <AlertDescription>Company profile saved.</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="companyName">Company name</Label>
            <Input id="companyName" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fiscalYear">Fiscal year starts in</Label>
            <Select
              value={String(fiscalYearStartMonth)}
              onValueChange={(value) => setFiscalYearStartMonth(Number(value))}
            >
              <SelectTrigger id="fiscalYear" className="w-full">
                <SelectValue>{MONTHS[fiscalYearStartMonth - 1]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, index) => (
                  <SelectItem key={month} value={String(index + 1)}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hoursStart">Working hours start</Label>
              <Input
                id="hoursStart"
                type="time"
                value={workingHoursStart}
                onChange={(e) => setWorkingHoursStart(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hoursEnd">Working hours end</Label>
              <Input
                id="hoursEnd"
                type="time"
                value={workingHoursEnd}
                onChange={(e) => setWorkingHoursEnd(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" size="sm" className="w-fit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
