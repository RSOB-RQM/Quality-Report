import { describe, it, expect } from 'vitest';
import { getFilter, createAccessControl } from '../access-control';
import type { AuditRecord } from '../../models/audit-types';
import type { AuthenticatedUser } from '../../models/dashboard-types';

/** Minimal AuditRecord stub with the fields relevant to access control. */
function makeRecord(
  overrides: Partial<AuditRecord> & Pick<AuditRecord, 'associateLogin' | 'supervisorLogin'>,
): AuditRecord {
  return {
    team: 'RSOB',
    region: 'NA',
    disruptionType: 'ADHOC Validation',
    subTransactionType: 'Continous Scheduling',
    qaMonitoringDate: '2026-01-10',
    transactionDate: '2026-01-08',
    associateLogin: overrides.associateLogin,
    associateStatus: 'Tenured',
    supervisorLogin: overrides.supervisorLogin,
    supervisorEmail: `${overrides.supervisorLogin}@example.com`,
    transactionWeek: 2,
    subDisruptionType: 'CARs',
    adm: 'Yes', admFinding: '', comments1: '',
    ra: 'Yes', raFinding: '', comments2: '',
    rrc: 'Yes', rrcFinding: '', comments3: '',
    acc: 'Yes', accFinding: '', comments4: '',
    rv: 'Yes', rvFinding: '', comments5: '',
    spResponse: '', spComment: '', spocLogin: '', spocResponse: '',
    spocComment: '', reAppealFlag: '', reAppealComment: '',
    appealLeadLogin: '', appealLeadDecision: '', appealLeadComment: '',
    defectFlag: false,
    ...overrides,
  } as AuditRecord;
}

const records: AuditRecord[] = [
  makeRecord({ associateLogin: 'alice', supervisorLogin: 'bob' }),
  makeRecord({ associateLogin: 'carol', supervisorLogin: 'bob' }),
  makeRecord({ associateLogin: 'dave', supervisorLogin: 'eve' }),
];

describe('getFilter (standalone)', () => {
  it('admin filter returns all records', () => {
    const user: AuthenticatedUser = { login: 'admin1', email: 'a@e.com', role: 'admin' };
    const filter = getFilter(user);
    expect(records.filter(filter)).toHaveLength(3);
  });

  it('manager filter returns only their team records', () => {
    const user: AuthenticatedUser = { login: 'bob', email: 'b@e.com', role: 'manager' };
    const filter = getFilter(user);
    const result = records.filter(filter);
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.supervisorLogin === 'bob')).toBe(true);
  });

  it('associate filter returns only their own records', () => {
    const user: AuthenticatedUser = { login: 'alice', email: 'a@e.com', role: 'associate' };
    const filter = getFilter(user);
    const result = records.filter(filter);
    expect(result).toHaveLength(1);
    expect(result[0].associateLogin).toBe('alice');
  });

  it('associate with no matching records gets empty result', () => {
    const user: AuthenticatedUser = { login: 'nobody', email: 'n@e.com', role: 'associate' };
    const filter = getFilter(user);
    expect(records.filter(filter)).toHaveLength(0);
  });

  it('manager with no matching records gets empty result', () => {
    const user: AuthenticatedUser = { login: 'nobody', email: 'n@e.com', role: 'manager' };
    const filter = getFilter(user);
    expect(records.filter(filter)).toHaveLength(0);
  });
});

describe('createAccessControl factory', () => {
  it('returns an object with getFilter method', () => {
    const ac = createAccessControl();
    expect(typeof ac.getFilter).toBe('function');
  });

  it('factory getFilter behaves identically to standalone', () => {
    const ac = createAccessControl();
    const user: AuthenticatedUser = { login: 'bob', email: 'b@e.com', role: 'manager' };
    const result = records.filter(ac.getFilter(user));
    expect(result).toHaveLength(2);
  });
});
