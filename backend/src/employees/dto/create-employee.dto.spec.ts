import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateEmployeeDto } from './create-employee.dto';

/// Covers the "Add Employee form must not allow save without at least one
/// role — hard validation" requirement, exercised the same way Nest's
/// global ValidationPipe actually validates every incoming DTO.
describe('CreateEmployeeDto', () => {
  const VALID_BASE = {
    userId: '11111111-1111-4111-8111-111111111111',
    designation: 'Sales Executive',
    joiningDate: '2026-01-01',
    salary: 50000,
  };

  it('rejects creation with an empty roleIds array', async () => {
    const dto = plainToInstance(CreateEmployeeDto, {
      ...VALID_BASE,
      roleIds: [],
    });
    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'roleIds')).toBe(true);
  });

  it('rejects creation with roleIds omitted entirely', async () => {
    const dto = plainToInstance(CreateEmployeeDto, { ...VALID_BASE });
    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'roleIds')).toBe(true);
  });

  it('passes with at least one role id', async () => {
    const dto = plainToInstance(CreateEmployeeDto, {
      ...VALID_BASE,
      roleIds: ['22222222-2222-4222-8222-222222222222'],
    });
    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'roleIds')).toBe(false);
  });
});
