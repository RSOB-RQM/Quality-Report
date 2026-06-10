import { describe, it, expect } from 'vitest';
import { resolveRole } from '../auth';
import type { RoleMappingEntry } from '../../models/dashboard-types';

describe('resolveRole', () => {
  const mapping: RoleMappingEntry[] = [
    { login: 'admin01', role: 'admin' },
    { login: 'mgr_jones', role: 'manager' },
    { login: 'assoc_doe', role: 'associate' },
  ];

  it('returns the mapped role when login exists', () => {
    expect(resolveRole('admin01', mapping)).toBe('admin');
    expect(resolveRole('mgr_jones', mapping)).toBe('manager');
    expect(resolveRole('assoc_doe', mapping)).toBe('associate');
  });

  it('defaults to associate when login is not in the mapping', () => {
    expect(resolveRole('unknown_user', mapping)).toBe('associate');
  });

  it('defaults to associate when mapping is empty', () => {
    expect(resolveRole('anyone', [])).toBe('associate');
  });
});
