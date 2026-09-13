import { CompanyProfileTab } from '../components/CompanyProfileTab';
import { BranchesTab } from '../components/BranchesTab';
import { DepartmentsTab } from '../components/DepartmentsTab';
import { HolidaysTab } from '../components/HolidaysTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';

export function OrganizationPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Organization</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Company profile, branches, department hierarchy and holidays.
        </p>
      </div>

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company">Company profile</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="holidays">Holidays</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-4">
          <CompanyProfileTab />
        </TabsContent>
        <TabsContent value="branches" className="mt-4">
          <BranchesTab />
        </TabsContent>
        <TabsContent value="departments" className="mt-4">
          <DepartmentsTab />
        </TabsContent>
        <TabsContent value="holidays" className="mt-4">
          <HolidaysTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
