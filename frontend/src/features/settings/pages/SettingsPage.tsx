import { GeneralSettingsTab } from '../components/GeneralSettingsTab';
import { ApiKeysTab } from '../components/ApiKeysTab';
import { BackupsTab } from '../components/BackupsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';

export function SettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Branding, timezone and currency, API keys, and database/storage backups.
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="api-keys">API keys</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <GeneralSettingsTab />
        </TabsContent>
        <TabsContent value="api-keys" className="mt-4">
          <ApiKeysTab />
        </TabsContent>
        <TabsContent value="backups" className="mt-4">
          <BackupsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
