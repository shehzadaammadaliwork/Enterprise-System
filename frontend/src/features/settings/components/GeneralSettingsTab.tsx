import { useEffect, useState, type SubmitEvent } from 'react';
import { useSettings, useUpdateSettings, useUploadLogo, useDeleteLogo } from '../api/hooks';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';

export function GeneralSettingsTab() {
  const { data: settings, isLoading } = useSettings();
  const updateMutation = useUpdateSettings();
  const uploadLogoMutation = useUploadLogo();
  const deleteLogoMutation = useDeleteLogo();

  const [brandPrimaryColor, setBrandPrimaryColor] = useState('#2563eb');
  const [timezone, setTimezone] = useState('UTC');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [currencyLocale, setCurrencyLocale] = useState('en-US');
  const [backupSchedule, setBackupSchedule] = useState('');
  const [backupRetentionCount, setBackupRetentionCount] = useState(7);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setBrandPrimaryColor(settings.brandPrimaryColor ?? '#2563eb');
    setTimezone(settings.timezone);
    setCurrencyCode(settings.currencyCode);
    setCurrencyLocale(settings.currencyLocale);
    setBackupSchedule(settings.backupSchedule ?? '');
    setBackupRetentionCount(settings.backupRetentionCount);
  }, [settings]);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSaved(false);
    updateMutation.mutate(
      {
        brandPrimaryColor,
        timezone,
        currencyCode,
        currencyLocale,
        backupSchedule: backupSchedule.trim() === '' ? null : backupSchedule.trim(),
        backupRetentionCount,
      },
      {
        onSuccess: () => setSaved(true),
        onError: (error) => setErrorMessage(extractApiErrorMessage(error, 'Could not save settings.')),
      },
    );
  }

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);
    uploadLogoMutation.mutate(file, {
      onError: (error) => setErrorMessage(extractApiErrorMessage(error, 'Could not upload logo.')),
    });
    event.target.value = '';
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="flex flex-col gap-6">
      <Card className="max-w-160">
        <CardContent>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          {saved && (
            <Alert className="mb-4 border-primary/30 bg-primary/5">
              <AlertDescription>Settings saved.</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Company logo</Label>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {settings?.brandLogoKey ? 'A logo is currently uploaded.' : 'No logo uploaded yet.'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleLogoChange}
                  disabled={uploadLogoMutation.isPending}
                  className="max-w-80"
                />
                {settings?.brandLogoKey && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={deleteLogoMutation.isPending}
                    onClick={() => deleteLogoMutation.mutate()}
                  >
                    Remove logo
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="brandColor">Brand primary color</Label>
              <Input
                id="brandColor"
                type="color"
                className="h-10 w-20 p-1"
                value={brandPrimaryColor}
                onChange={(e) => setBrandPrimaryColor(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  placeholder="e.g. America/New_York"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="currencyCode">Currency code</Label>
                <Input
                  id="currencyCode"
                  placeholder="e.g. USD"
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="currencyLocale">Currency locale</Label>
                <Input
                  id="currencyLocale"
                  placeholder="e.g. en-US"
                  value={currencyLocale}
                  onChange={(e) => setCurrencyLocale(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="backupSchedule">Scheduled backup (cron)</Label>
                <Input
                  id="backupSchedule"
                  placeholder="e.g. 0 2 * * * (empty = disabled)"
                  value={backupSchedule}
                  onChange={(e) => setBackupSchedule(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="backupRetention">Scheduled backups to keep</Label>
                <Input
                  id="backupRetention"
                  type="number"
                  min={1}
                  max={90}
                  value={backupRetentionCount}
                  onChange={(e) => setBackupRetentionCount(Number(e.target.value))}
                />
              </div>
            </div>

            <Button type="submit" size="sm" className="w-fit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
