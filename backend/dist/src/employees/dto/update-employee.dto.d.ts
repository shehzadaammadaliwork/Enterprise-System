import { EmploymentStatus } from '@prisma/client';
export declare class UpdateEmployeeDto {
    departmentId?: string | null;
    designation?: string;
    joiningDate?: string;
    reportingManagerId?: string | null;
    salary?: number;
    status?: EmploymentStatus;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelation?: string;
}
