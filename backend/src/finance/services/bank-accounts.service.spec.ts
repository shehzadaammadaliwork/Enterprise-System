import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import { BankAccountsService } from './bank-accounts.service';
import { PrismaService } from '../../common/prisma/prisma.service';

/// Balance is never stored — it's openingBalance + approved income -
/// approved expense, computed fresh on every read (see the comment on
/// BankAccountsService.computeBalance). These tests exercise that
/// computation directly against a mocked Prisma, plus the
/// can't-delete-an-in-use-account guard.
describe('BankAccountsService', () => {
  let service: BankAccountsService;
  let prisma: {
    bankAccount: { findUnique: jest.Mock; delete: jest.Mock };
    transaction: { aggregate: jest.Mock; count: jest.Mock };
  };

  const ACCOUNT = {
    id: 'acc-1',
    name: 'Operating Account',
    bankName: null,
    accountNumber: null,
    openingBalance: new Prisma.Decimal(1000),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma = {
      bankAccount: { findUnique: jest.fn(), delete: jest.fn() },
      transaction: { aggregate: jest.fn(), count: jest.fn() },
    };
    service = new BankAccountsService(prisma as unknown as PrismaService);
  });

  describe('getAccount (balance computation)', () => {
    it('is openingBalance + approved income - approved expense', async () => {
      prisma.bankAccount.findUnique.mockResolvedValue(ACCOUNT);
      prisma.transaction.aggregate.mockImplementation(
        ({ where }: { where: { type: TransactionType } }) =>
          Promise.resolve({
            _sum: {
              amount:
                where.type === TransactionType.INCOME
                  ? new Prisma.Decimal(500)
                  : new Prisma.Decimal(200),
            },
          }),
      );

      const result = await service.getAccount('acc-1');

      expect(result.balance).toBe(1300); // 1000 + 500 - 200
      expect(result.openingBalance).toBe(1000);
    });

    it('only sums APPROVED transactions (aggregate is called with status: APPROVED)', async () => {
      prisma.bankAccount.findUnique.mockResolvedValue(ACCOUNT);
      prisma.transaction.aggregate.mockResolvedValue({
        _sum: { amount: null },
      });

      await service.getAccount('acc-1');

      expect(prisma.transaction.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: TransactionStatus.APPROVED,
          }),
        }),
      );
    });

    it('treats no matching transactions as zero, not an error', async () => {
      prisma.bankAccount.findUnique.mockResolvedValue(ACCOUNT);
      prisma.transaction.aggregate.mockResolvedValue({
        _sum: { amount: null },
      });

      const result = await service.getAccount('acc-1');
      expect(result.balance).toBe(1000);
    });
  });

  describe('deleteAccount', () => {
    it('refuses to delete an account with transactions recorded against it', async () => {
      prisma.bankAccount.findUnique.mockResolvedValue(ACCOUNT);
      prisma.transaction.count.mockResolvedValue(3);

      await expect(service.deleteAccount('acc-1')).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'BANK_ACCOUNT_IN_USE' }),
      });
      expect(prisma.bankAccount.delete).not.toHaveBeenCalled();
    });

    it('deletes an account with no transactions', async () => {
      prisma.bankAccount.findUnique.mockResolvedValue(ACCOUNT);
      prisma.transaction.count.mockResolvedValue(0);

      await service.deleteAccount('acc-1');
      expect(prisma.bankAccount.delete).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
      });
    });
  });

  describe('requireActiveAccount', () => {
    it('rejects an inactive account', async () => {
      prisma.bankAccount.findUnique.mockResolvedValue({
        ...ACCOUNT,
        isActive: false,
      });

      await expect(service.requireActiveAccount('acc-1')).rejects.toMatchObject(
        {
          response: expect.objectContaining({ code: 'BANK_ACCOUNT_INACTIVE' }),
        },
      );
    });

    it('rejects a non-existent account', async () => {
      prisma.bankAccount.findUnique.mockResolvedValue(null);

      await expect(
        service.requireActiveAccount('missing'),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'BANK_ACCOUNT_NOT_FOUND' }),
      });
    });
  });
});
