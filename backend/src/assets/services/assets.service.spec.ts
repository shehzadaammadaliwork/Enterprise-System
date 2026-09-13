import { AssetStatus } from '@prisma/client';
import { AssetsService, isValidAssetStatusTransition } from './assets.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EmployeesService } from '../../employees/services/employees.service';

/// Unit tests for the two rules that matter most: the status-transition
/// matrix (Under Repair can't jump straight to Assigned; Retired is
/// terminal) and assignment requiring an employee. Prisma/Employees are
/// mocked, same style as finance/services/transactions.service.spec.ts.
describe('isValidAssetStatusTransition', () => {
  it('allows Available -> Assigned/Under Repair/Retired', () => {
    expect(isValidAssetStatusTransition('AVAILABLE', 'ASSIGNED')).toBe(true);
    expect(isValidAssetStatusTransition('AVAILABLE', 'UNDER_REPAIR')).toBe(
      true,
    );
    expect(isValidAssetStatusTransition('AVAILABLE', 'RETIRED')).toBe(true);
  });

  it('rejects Under Repair -> Assigned directly (must return to Available first)', () => {
    expect(isValidAssetStatusTransition('UNDER_REPAIR', 'ASSIGNED')).toBe(
      false,
    );
  });

  it('rejects any transition out of Retired (terminal)', () => {
    expect(isValidAssetStatusTransition('RETIRED', 'AVAILABLE')).toBe(false);
    expect(isValidAssetStatusTransition('RETIRED', 'ASSIGNED')).toBe(false);
  });

  it('rejects a same-status no-op transition', () => {
    expect(isValidAssetStatusTransition('AVAILABLE', 'AVAILABLE')).toBe(false);
  });
});

describe('AssetsService.changeStatus', () => {
  let service: AssetsService;
  let prisma: {
    asset: { findUnique: jest.Mock; update: jest.Mock };
  };
  let employeesService: { requireEmployeeExists: jest.Mock };

  beforeEach(() => {
    prisma = {
      asset: { findUnique: jest.fn(), update: jest.fn() },
    };
    employeesService = {
      requireEmployeeExists: jest.fn().mockResolvedValue(undefined),
    };
    service = new AssetsService(
      prisma as unknown as PrismaService,
      employeesService as unknown as EmployeesService,
    );
  });

  it('rejects assigning without an employee id', async () => {
    prisma.asset.findUnique.mockResolvedValue({
      id: 'a1',
      status: AssetStatus.AVAILABLE,
    });

    await expect(
      service.changeStatus('a1', { status: AssetStatus.ASSIGNED }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'ASSET_ASSIGNMENT_REQUIRES_EMPLOYEE',
      }),
    });
    expect(prisma.asset.update).not.toHaveBeenCalled();
  });

  it('rejects an invalid transition (Under Repair -> Assigned)', async () => {
    prisma.asset.findUnique.mockResolvedValue({
      id: 'a2',
      status: AssetStatus.UNDER_REPAIR,
    });

    await expect(
      service.changeStatus('a2', {
        status: AssetStatus.ASSIGNED,
        assignedEmployeeId: 'emp-1',
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'INVALID_ASSET_STATUS_TRANSITION',
      }),
    });
  });

  it('assigns to a valid employee and clears retirementReason', async () => {
    prisma.asset.findUnique.mockResolvedValue({
      id: 'a3',
      status: AssetStatus.AVAILABLE,
    });
    prisma.asset.update.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'a3', purchaseCost: null, ...data }),
    );

    const result = await service.changeStatus('a3', {
      status: AssetStatus.ASSIGNED,
      assignedEmployeeId: 'emp-1',
    });

    expect(employeesService.requireEmployeeExists).toHaveBeenCalledWith(
      'emp-1',
    );
    expect(prisma.asset.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: AssetStatus.ASSIGNED,
          assignedEmployeeId: 'emp-1',
          retirementReason: null,
        }),
      }),
    );
    expect(result.status).toBe(AssetStatus.ASSIGNED);
  });

  it('clears assignedEmployeeId when moving away from Assigned', async () => {
    prisma.asset.findUnique.mockResolvedValue({
      id: 'a4',
      status: AssetStatus.ASSIGNED,
    });
    prisma.asset.update.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'a4', purchaseCost: null, ...data }),
    );

    await service.changeStatus('a4', { status: AssetStatus.AVAILABLE });

    expect(prisma.asset.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ assignedEmployeeId: null }),
      }),
    );
  });
});
