export interface CompanyProfile {
  id: string;
  name: string;
  fiscalYearStartMonth: number;
  workingHoursStart: string;
  workingHoursEnd: string;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  name: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  phone: string | null;
  isHeadquarters: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string | null;
  branchId: string | null;
  branch?: Branch | null;
  parentId: string | null;
  parent?: Department | null;
  managerUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentTreeNode extends Department {
  children: DepartmentTreeNode[];
}

export interface CompanyHoliday {
  id: string;
  name: string;
  date: string;
  description: string | null;
  recurringAnnually: boolean;
  createdAt: string;
  updatedAt: string;
}
