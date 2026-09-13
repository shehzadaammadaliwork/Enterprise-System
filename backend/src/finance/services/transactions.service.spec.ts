import { TransactionStatus, TransactionType } from '@prisma/client';
import { TransactionsService } from './transactions.service';
import { BankAccountsService } from './bank-accounts.service';
import { PrismaService } from '../../common/prisma/prisma.service';

/// Unit tests for the business rules that matter most here: which
/// transactions are auto-approved vs go through the workflow, and which
/// ones can still be edited/deleted/decided afterwards. Prisma is mocked
/// (no real DB) — these are pure service-logic tests, not integration
/// tests against the schema.
describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: {
    transaction: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let bankAccountsService: { requireActiveAccount: jest.Mock };

  const BANK_ACCOUNT_ID = 'bank-account-1';
  const INCLUDE = { bankAccount: { select: { id: true, name: true } } };

  beforeEach(() => {
    prisma = {
      transaction: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    bankAccountsService = {
      requireActiveAccount: jest
        .fn()
        .mockResolvedValue({ id: BANK_ACCOUNT_ID }),
    };
    service = new TransactionsService(
      prisma as unknown as PrismaService,
      bankAccountsService as unknown as BankAccountsService,
    );
  });

  describe('createTransaction', () => {
    it('auto-approves INCOME (no workflow for income)', async () => {
      prisma.transaction.create.mockResolvedValue({
        id: 't1',
        type: TransactionType.INCOME,
        status: TransactionStatus.APPROVED,
        amount: 100,
      });

      await service.createTransaction(
        {
          type: TransactionType.INCOME,
          category: 'Sales Revenue',
          amount: 100,
          transactionDate: '2026-08-01',
          bankAccountId: BANK_ACCOUNT_ID,
        },
        'user-1',
      );

      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: TransactionStatus.APPROVED }),
        }),
      );
    });

    it('leaves EXPENSE PENDING until decided', async () => {
      prisma.transaction.create.mockResolvedValue({
        id: 't2',
        type: TransactionType.EXPENSE,
        status: TransactionStatus.PENDING,
        amount: 50,
      });

      await service.createTransaction(
        {
          type: TransactionType.EXPENSE,
          category: 'Office Supplies',
          amount: 50,
          transactionDate: '2026-08-01',
          bankAccountId: BANK_ACCOUNT_ID,
        },
        'user-1',
      );

      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: TransactionStatus.PENDING }),
        }),
      );
    });

    it('validates the bank account is active before creating', async () => {
      bankAccountsService.requireActiveAccount.mockRejectedValue(
        new Error('inactive'),
      );

      await expect(
        service.createTransaction(
          {
            type: TransactionType.INCOME,
            category: 'Sales Revenue',
            amount: 100,
            transactionDate: '2026-08-01',
            bankAccountId: BANK_ACCOUNT_ID,
          },
          'user-1',
        ),
      ).rejects.toThrow('inactive');
      expect(prisma.transaction.create).not.toHaveBeenCalled();
    });
  });

  describe('createPreApprovedExpense', () => {
    it('creates the expense already APPROVED, stamped with the given decidedByUserId', async () => {
      prisma.transaction.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 't-preapproved', ...data }),
      );

      const result = await service.createPreApprovedExpense(
        {
          category: 'Equipment',
          amount: 950,
          description: 'Purchase Request #7: New laptop',
          transactionDate: '2026-08-01',
          bankAccountId: BANK_ACCOUNT_ID,
        },
        'buyer-1',
        'approver-1',
      );

      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: TransactionType.EXPENSE,
            status: TransactionStatus.APPROVED,
            createdByUserId: 'buyer-1',
            decidedByUserId: 'approver-1',
            decidedAt: expect.any(Date),
          }),
          include: INCLUDE,
        }),
      );
      expect(result.status).toBe(TransactionStatus.APPROVED);
    });

    it('validates the bank account is active before creating', async () => {
      bankAccountsService.requireActiveAccount.mockRejectedValue(
        new Error('inactive'),
      );

      await expect(
        service.createPreApprovedExpense(
          {
            category: 'Equipment',
            amount: 950,
            description: 'Purchase Request #7: New laptop',
            transactionDate: '2026-08-01',
            bankAccountId: BANK_ACCOUNT_ID,
          },
          'buyer-1',
          'approver-1',
        ),
      ).rejects.toThrow('inactive');
      expect(prisma.transaction.create).not.toHaveBeenCalled();
    });
  });

  describe('updateTransaction / deleteTransaction — editability', () => {
    it('allows editing a PENDING expense', async () => {
      prisma.transaction.findUnique.mockResolvedValue({
        id: 't3',
        type: TransactionType.EXPENSE,
        status: TransactionStatus.PENDING,
      });
      prisma.transaction.update.mockResolvedValue({
        id: 't3',
        type: TransactionType.EXPENSE,
        status: TransactionStatus.PENDING,
        amount: 75,
      });

      await service.updateTransaction('t3', { amount: 75 });
      expect(prisma.transaction.update).toHaveBeenCalled();
    });

    it('rejects editing an already-decided (APPROVED) expense', async () => {
      prisma.transaction.findUnique.mockResolvedValue({
        id: 't4',
        type: TransactionType.EXPENSE,
        status: TransactionStatus.APPROVED,
      });

      await expect(
        service.updateTransaction('t4', { amount: 75 }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 'TRANSACTION_ALREADY_DECIDED',
        }),
      });
      expect(prisma.transaction.update).not.toHaveBeenCalled();
    });

    it('allows editing an APPROVED income (income has no workflow to protect)', async () => {
      prisma.transaction.findUnique.mockResolvedValue({
        id: 't5',
        type: TransactionType.INCOME,
        status: TransactionStatus.APPROVED,
      });
      prisma.transaction.update.mockResolvedValue({
        id: 't5',
        type: TransactionType.INCOME,
        status: TransactionStatus.APPROVED,
        amount: 200,
      });

      await service.updateTransaction('t5', { amount: 200 });
      expect(prisma.transaction.update).toHaveBeenCalled();
    });

    it('rejects deleting an already-decided (REJECTED) expense', async () => {
      prisma.transaction.findUnique.mockResolvedValue({
        id: 't6',
        type: TransactionType.EXPENSE,
        status: TransactionStatus.REJECTED,
      });

      await expect(service.deleteTransaction('t6')).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 'TRANSACTION_ALREADY_DECIDED',
        }),
      });
      expect(prisma.transaction.delete).not.toHaveBeenCalled();
    });
  });

  describe('decide', () => {
    it('rejects deciding an INCOME transaction (income never goes through the workflow)', async () => {
      prisma.transaction.findUnique.mockResolvedValue({
        id: 't7',
        type: TransactionType.INCOME,
        status: TransactionStatus.APPROVED,
      });

      await expect(service.decide('t7', 'user-1', true)).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 'TRANSACTION_NOT_APPROVABLE',
        }),
      });
    });

    it('rejects deciding an expense that was already decided', async () => {
      prisma.transaction.findUnique.mockResolvedValue({
        id: 't8',
        type: TransactionType.EXPENSE,
        status: TransactionStatus.APPROVED,
      });

      await expect(service.decide('t8', 'user-1', true)).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 'TRANSACTION_ALREADY_DECIDED',
        }),
      });
    });

    it('approves a PENDING expense and stamps decidedByUserId/decidedAt', async () => {
      prisma.transaction.findUnique.mockResolvedValue({
        id: 't9',
        type: TransactionType.EXPENSE,
        status: TransactionStatus.PENDING,
      });
      prisma.transaction.update.mockImplementation(({ data }) =>
        Promise.resolve({
          id: 't9',
          type: TransactionType.EXPENSE,
          amount: 10,
          ...data,
        }),
      );

      const result = await service.decide('t9', 'approver-1', true);

      expect(prisma.transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 't9' },
          data: expect.objectContaining({
            status: TransactionStatus.APPROVED,
            decidedByUserId: 'approver-1',
          }),
          include: INCLUDE,
        }),
      );
      expect(result.status).toBe(TransactionStatus.APPROVED);
    });

    it('rejects a PENDING expense when approve=false', async () => {
      prisma.transaction.findUnique.mockResolvedValue({
        id: 't10',
        type: TransactionType.EXPENSE,
        status: TransactionStatus.PENDING,
      });
      prisma.transaction.update.mockImplementation(({ data }) =>
        Promise.resolve({
          id: 't10',
          type: TransactionType.EXPENSE,
          amount: 10,
          ...data,
        }),
      );

      const result = await service.decide('t10', 'approver-1', false);
      expect(result.status).toBe(TransactionStatus.REJECTED);
    });
  });
});
