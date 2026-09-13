import { EmployeesService } from '../services/employees.service';
import { ListUsersQueryDto } from '../dto/list-users-query.dto';
export declare class UsersController {
    private readonly employeesService;
    constructor(employeesService: EmployeesService);
    listUsers(query: ListUsersQueryDto): Promise<{
        items: {
            hasEmployeeProfile: boolean;
            id: string;
            createdAt: Date;
            email: string;
            firstName: string;
            lastName: string;
        }[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
}
