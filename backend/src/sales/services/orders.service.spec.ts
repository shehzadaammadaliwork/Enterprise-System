import { OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../common/prisma/prisma.service';

/// Everything mocked (no real DB), same style as Finance/Calendar's service
/// specs. Covers the order-cancellation bug: an Order should only be
/// blocked from cancelling by an invoice that's still active, not one
/// that's already been Voided.
describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: {
    order: { findUnique: jest.Mock; update: jest.Mock };
  };

  const BASE_ORDER = {
    id: 'order-1',
    status: 'PENDING',
    items: [],
  };

  beforeEach(() => {
    prisma = {
      order: { findUnique: jest.fn(), update: jest.fn() },
    };
    service = new OrdersService(prisma as unknown as PrismaService);
  });

  describe('updateOrder — cancellation vs. invoice status', () => {
    it('blocks cancellation when the order has an active (non-Void) invoice', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...BASE_ORDER,
        invoice: { id: 'inv-1', status: 'UNPAID' },
      });

      await expect(
        service.updateOrder('order-1', { status: OrderStatus.CANCELLED }),
      ).rejects.toMatchObject({ response: { code: 'ORDER_ALREADY_INVOICED' } });
      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('allows cancellation once the linked invoice has been Voided', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...BASE_ORDER,
        invoice: { id: 'inv-1', status: 'VOID' },
      });
      prisma.order.update.mockResolvedValue({
        ...BASE_ORDER,
        status: 'CANCELLED',
        invoice: { id: 'inv-1', status: 'VOID' },
      });

      await service.updateOrder('order-1', { status: OrderStatus.CANCELLED });
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'CANCELLED' } }),
      );
    });

    it('allows cancellation when there is no invoice at all', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...BASE_ORDER,
        invoice: null,
      });
      prisma.order.update.mockResolvedValue({
        ...BASE_ORDER,
        status: 'CANCELLED',
        invoice: null,
      });

      await service.updateOrder('order-1', { status: OrderStatus.CANCELLED });
      expect(prisma.order.update).toHaveBeenCalled();
    });
  });
});
