// =============================================================================
// Access Control — Quality Performance Dashboard
// =============================================================================

import type { AuditRecord } from '../models/audit-types';
import type { AuthenticatedUser } from '../models/dashboard-types';

/**
 * A predicate that determines whether a given audit record is visible
 * to the authenticated user.
 */
export type RecordFilter = (record: AuditRecord) => boolean;

/**
 * Returns a filter predicate based on the user's role.
 */
export interface AccessControl {
  /** Returns a predicate that keeps only records the user is authorized to see. */
  getFilter(user: AuthenticatedUser): RecordFilter;
}

/**
 * Returns a RecordFilter for the given user based on their role:
 * - Admin: sees all records
 * - Manager: sees records where supervisorLogin matches their login
 * - Associate: sees records where associateLogin matches their login
 */
export function getFilter(user: AuthenticatedUser): RecordFilter {
  switch (user.role) {
    case 'admin':
      return () => true;
    case 'manager':
      return (r) => r.supervisorLogin === user.login;
    case 'associate':
      return (r) => r.associateLogin === user.login;
  }
}

/**
 * Factory function that returns an AccessControl instance.
 */
export function createAccessControl(): AccessControl {
  return { getFilter };
}
