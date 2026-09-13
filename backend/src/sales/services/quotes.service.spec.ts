import { QuotesService } from './quotes.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CustomersService } from '../../crm/services/customers.service';
import { DealsService } from '../../crm/services/deals.service';

/// Everything mocked (no real DB), same style as Finance/Calendar's service
/// specs. Covers: line items always pricing from client-supplied
/// unitPrice/taxRatePercent (the catalog carries no pricing at all), the
/// Draft-only line-item-editing lock, and Deal.value syncing to the quote
/// total on (and only on) Accept.
describe('QuotesService', () => {
  let service: QuotesService;
  let prisma: {
    product: { findMany: jest.Mock };
    quote: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    quoteItem: { deleteMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let customersService: { getCustomer: jest.Mock };
  let dealsService: { getDeal: jest.Mock; updateDeal: jest.Mock };

  const PRODUCT = {
    id: 'product-1',
    name: 'Widget',
  };

  beforeEach(() => {
    prisma = {
      product: { findMany: jest.fn().mockResolvedValue([PRODUCT]) },
      quote: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      quoteItem: { deleteMany: jest.fn() },
      $transaction: jest.fn((fn) => fn(prisma)),
    };
    customersService = {
      getCustomer: jest.fn().mockResolvedValue({ id: 'cust-1' }),
    };
    dealsService = {
      getDeal: jest
        .fn()
        .mockResolvedValue({ id: 'deal-1', customerId: 'cust-1' }),
      updateDeal: jest.fn().mockResolvedValue({ id: 'deal-1', value: 0 }),
    };
    service = new QuotesService(
      prisma as unknown as PrismaService,
      customersService as unknown as CustomersService,
      dealsService as unknown as DealsService,
    );
  });

  describe('createQuote — line item pricing', () => {
    it('always uses the caller-supplied unitPrice and taxRatePercent (the catalog carries no pricing)', async () => {
      prisma.quote.create.mockResolvedValue({
        id: 'quote-1',
        customerId: 'cust-1',
        dealId: null,
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            unitPrice: 80,
            taxRatePercent: 5,
            lineTotal: 168,
          },
        ],
      });

      await service.createQuote(
        {
          customerId: 'cust-1',
          items: [
            {
              productId: 'product-1',
              quantity: 2,
              unitPrice: 80,
              taxRatePercent: 5,
            },
          ],
        },
        'user-1',
      );

      expect(prisma.quote.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            items: {
              create: [
                expect.objectContaining({
                  unitPrice: 80,
                  quantity: 2,
                  taxRatePercent: 5,
                }),
              ],
            },
          }),
        }),
      );
    });

    it('rejects a line item referencing a product that does not exist', async () => {
      prisma.product.findMany.mockResolvedValueOnce([]);

      await expect(
        service.createQuote(
          {
            customerId: 'cust-1',
            items: [
              {
                productId: 'missing-product',
                quantity: 1,
                unitPrice: 10,
                taxRatePercent: 0,
              },
            ],
          },
          'user-1',
        ),
      ).rejects.toMatchObject({ response: { code: 'PRODUCT_NOT_FOUND' } });
    });
  });

  describe('updateQuote — line items locked once past Draft', () => {
    it('rejects an items update on a SENT quote', async () => {
      prisma.quote.findUnique.mockResolvedValue({
        id: 'quote-1',
        status: 'SENT',
        customerId: 'cust-1',
        dealId: null,
      });

      await expect(
        service.updateQuote('quote-1', {
          items: [
            {
              productId: 'product-1',
              quantity: 1,
              unitPrice: 10,
              taxRatePercent: 0,
            },
          ],
        }),
      ).rejects.toMatchObject({ response: { code: 'QUOTE_ITEMS_LOCKED' } });
      expect(prisma.quoteItem.deleteMany).not.toHaveBeenCalled();
    });

    it('allows an items update while the quote is still Draft', async () => {
      prisma.quote.findUnique.mockResolvedValue({
        id: 'quote-1',
        status: 'DRAFT',
        customerId: 'cust-1',
        dealId: null,
      });
      prisma.quoteItem.deleteMany.mockResolvedValue(undefined);
      const updatedQuote = {
        id: 'quote-1',
        dealId: null,
        status: 'DRAFT',
        items: [],
      };
      prisma.quote.update = jest.fn().mockResolvedValue(updatedQuote);

      await service.updateQuote('quote-1', {
        items: [
          {
            productId: 'product-1',
            quantity: 3,
            unitPrice: 10,
            taxRatePercent: 0,
          },
        ],
      });
      expect(prisma.quoteItem.deleteMany).toHaveBeenCalledWith({
        where: { quoteId: 'quote-1' },
      });
    });
  });

  describe('updateQuote — Deal.value sync on Accept', () => {
    const acceptedQuote = {
      id: 'quote-1',
      dealId: 'deal-1',
      status: 'ACCEPTED',
      items: [
        {
          productId: 'product-1',
          quantity: 2,
          unitPrice: 100,
          taxRatePercent: 10,
          lineTotal: 220,
        },
      ],
    };

    beforeEach(() => {
      prisma.quote.update = jest.fn().mockResolvedValue(acceptedQuote);
    });

    it('syncs Deal.value to the quote total when a SENT quote is Accepted', async () => {
      prisma.quote.findUnique.mockResolvedValue({
        id: 'quote-1',
        status: 'SENT',
        customerId: 'cust-1',
        dealId: 'deal-1',
      });

      await service.updateQuote('quote-1', { status: 'ACCEPTED' } as never);

      expect(dealsService.updateDeal).toHaveBeenCalledWith('deal-1', {
        value: 220,
      });
    });

    it('does not sync Deal.value on Send (DRAFT -> SENT)', async () => {
      prisma.quote.findUnique.mockResolvedValue({
        id: 'quote-1',
        status: 'DRAFT',
        customerId: 'cust-1',
        dealId: 'deal-1',
      });
      prisma.quote.update = jest
        .fn()
        .mockResolvedValue({ ...acceptedQuote, status: 'SENT' });

      await service.updateQuote('quote-1', { status: 'SENT' } as never);
      expect(dealsService.updateDeal).not.toHaveBeenCalled();
    });

    it('does not sync Deal.value on Reject', async () => {
      prisma.quote.findUnique.mockResolvedValue({
        id: 'quote-1',
        status: 'SENT',
        customerId: 'cust-1',
        dealId: 'deal-1',
      });
      prisma.quote.update = jest
        .fn()
        .mockResolvedValue({ ...acceptedQuote, status: 'REJECTED' });

      await service.updateQuote('quote-1', { status: 'REJECTED' } as never);
      expect(dealsService.updateDeal).not.toHaveBeenCalled();
    });

    it('does not re-sync on a redundant no-op re-save of an already-Accepted quote', async () => {
      prisma.quote.findUnique.mockResolvedValue({
        id: 'quote-1',
        status: 'ACCEPTED',
        customerId: 'cust-1',
        dealId: 'deal-1',
      });

      await service.updateQuote('quote-1', { status: 'ACCEPTED' } as never);
      expect(dealsService.updateDeal).not.toHaveBeenCalled();
    });

    it('does not sync when the accepted quote has no linked deal', async () => {
      prisma.quote.findUnique.mockResolvedValue({
        id: 'quote-1',
        status: 'SENT',
        customerId: 'cust-1',
        dealId: null,
      });
      prisma.quote.update = jest
        .fn()
        .mockResolvedValue({ ...acceptedQuote, dealId: null });

      await service.updateQuote('quote-1', { status: 'ACCEPTED' } as never);
      expect(dealsService.updateDeal).not.toHaveBeenCalled();
    });
  });
});
