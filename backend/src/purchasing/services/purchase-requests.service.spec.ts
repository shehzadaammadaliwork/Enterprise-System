import { PurchaseRequestCategory, PurchaseRequestStatus } from '@prisma/client';
import { PurchaseRequestsService } from './purchase-requests.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TransactionsService } from '../../finance/services/transactions.service';
import { EmployeesService } from '../../employees/services/employees.service';
import { AssetsService } from '../../assets/services/assets.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { RbacService } from '../../rbac/rbac.service';

/// Unit tests for the two rules that matter most here: approval alone
/// creates neither an Expense nor an Asset, and markPurchased only creates
/// an Asset when the category is Equipment. Everything is mocked (no real
/// DB/cross-module calls), same style as finance's service spec tests.
describe('PurchaseRequestsService', () => {
  let service: PurchaseRequestsService;
  let prisma: {
    purchaseRequest: {
      findUnique: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
    };
  };
  let transactionsService: { createPreApprovedExpense: jest.Mock };
  let employeesService: { getEmployeeByUserId: jest.Mock };
  let assetsService: { createFromPurchase: jest.Mock };
  let notificationsService: { notify: jest.Mock };
  let rbacService: { getUserIdsWithPermission: jest.Mock };

  beforeEach(() => {
    prisma = {
      purchaseRequest: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
    };
    transactionsService = {
      createPreApprovedExpense: jest
        .fn()
        .mockResolvedValue({ id: 'expense-1' }),
    };
    employeesService = {
      getEmployeeByUserId: jest.fn().mockResolvedValue({ id: 'emp-1' }),
    };
    assetsService = {
      createFromPurchase: jest.fn().mockResolvedValue({ id: 'asset-1' }),
    };
    notificationsService = { notify: jest.fn().mockResolvedValue(undefined) };
    rbacService = {
      getUserIdsWithPermission: jest.fn().mockResolvedValue([]),
    };
    service = new PurchaseRequestsService(
      prisma as unknown as PrismaService,
      transactionsService as unknown as TransactionsService,
      employeesService as unknown as EmployeesService,
      assetsService as unknown as AssetsService,
      notificationsService as unknown as NotificationsService,
      rbacService as unknown as RbacService,
    );
  });

  describe('decide', () => {
    it('rejects deciding a request that is not PENDING', async () => {
      prisma.purchaseRequest.findUnique.mockResolvedValue({
        id: 'pr1',
        status: PurchaseRequestStatus.APPROVED,
      });

      await expect(service.decide('pr1', 'user-1', true)).rejects.toMatchObject(
        {
          response: expect.objectContaining({
            code: 'PURCHASE_REQUEST_ALREADY_DECIDED',
          }),
        },
      );
    });
  });

  describe('markPurchased', () => {
    it('rejects marking purchased a request that is not APPROVED', async () => {
      prisma.purchaseRequest.findUnique.mockResolvedValue({
        id: 'pr2',
        status: PurchaseRequestStatus.PENDING,
      });

      await expect(
        service.markPurchased('pr2', 'user-1', {
          actualAmount: 100,
          bankAccountId: 'bank-1',
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 'PURCHASE_REQUEST_NOT_APPROVED',
        }),
      });
      expect(
        transactionsService.createPreApprovedExpense,
      ).not.toHaveBeenCalled();
    });

    it('creates a pre-approved Expense (not Pending) and an Asset for an EQUIPMENT request', async () => {
      prisma.purchaseRequest.findUnique.mockResolvedValue({
        id: 'pr3',
        number: 7,
        description: 'New laptop',
        category: PurchaseRequestCategory.EQUIPMENT,
        status: PurchaseRequestStatus.APPROVED,
        requestedByUserId: 'user-1',
        decidedByUserId: 'approver-1',
      });
      prisma.purchaseRequest.update.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'pr3', estimatedCost: 1000, ...data }),
      );

      const result = await service.markPurchased('pr3', 'buyer-1', {
        actualAmount: 950,
        bankAccountId: 'bank-1',
      });

      // Must go through the pre-approved path, not createTransaction's
      // normal Pending-for-expenses default — the Purchase Request was
      // already approved and the purchase already happened, so this
      // expense must not enter a second approval queue. decidedByUserId
      // is the Purchase Request's own approver (approver-1), not the
      // person who clicked "Mark as Purchased" (buyer-1).
      expect(transactionsService.createPreApprovedExpense).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 950, category: 'Equipment' }),
        'buyer-1',
        'approver-1',
      );
      expect(assetsService.createFromPurchase).toHaveBeenCalledWith(
        expect.objectContaining({
          purchaseCost: 950,
          assignedEmployeeId: 'emp-1',
        }),
      );
      expect(prisma.purchaseRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: PurchaseRequestStatus.PURCHASED,
            linkedExpenseId: 'expense-1',
            linkedAssetId: 'asset-1',
          }),
        }),
      );
      expect(result.status).toBe(PurchaseRequestStatus.PURCHASED);
    });

    it('creates only an Expense (no Asset) for a SOFTWARE_SUBSCRIPTION request', async () => {
      prisma.purchaseRequest.findUnique.mockResolvedValue({
        id: 'pr4',
        number: 8,
        description: 'Figma seats',
        category: PurchaseRequestCategory.SOFTWARE_SUBSCRIPTION,
        status: PurchaseRequestStatus.APPROVED,
        requestedByUserId: 'user-1',
        decidedByUserId: 'approver-1',
      });
      prisma.purchaseRequest.update.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'pr4', estimatedCost: 200, ...data }),
      );

      await service.markPurchased('pr4', 'buyer-1', {
        actualAmount: 200,
        bankAccountId: 'bank-1',
      });

      expect(assetsService.createFromPurchase).not.toHaveBeenCalled();
      expect(prisma.purchaseRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ linkedAssetId: undefined }),
        }),
      );
    });

    it('falls back to an unassigned asset when the requester has no Employee profile', async () => {
      prisma.purchaseRequest.findUnique.mockResolvedValue({
        id: 'pr5',
        number: 9,
        description: 'Spare monitor',
        category: PurchaseRequestCategory.EQUIPMENT,
        status: PurchaseRequestStatus.APPROVED,
        requestedByUserId: 'user-2',
        decidedByUserId: 'approver-2',
      });
      prisma.purchaseRequest.update.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'pr5', estimatedCost: 300, ...data }),
      );
      employeesService.getEmployeeByUserId.mockRejectedValue(
        new Error('NO_EMPLOYEE_PROFILE'),
      );

      await service.markPurchased('pr5', 'buyer-1', {
        actualAmount: 300,
        bankAccountId: 'bank-1',
      });

      expect(assetsService.createFromPurchase).toHaveBeenCalledWith(
        expect.objectContaining({ assignedEmployeeId: undefined }),
      );
    });
  });
});
