export declare class CreateEmployeeDto {
    userId: string;
    roleIds: string[];
    departmentId?: string;
    designation: string;
    joiningDate: string;
    reportingManagerId?: string;
    salary: number;
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
