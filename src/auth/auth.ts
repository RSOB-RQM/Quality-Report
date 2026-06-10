// =============================================================================
// Auth Module — Quality Performance Dashboard
// =============================================================================

import { readFile } from 'fs/promises';
import path from 'path';
import type {
  AuthenticatedUser,
  RoleMappingEntry,
  UserRole,
} from '../models/dashboard-types';

// Re-export types for convenience
export type { AuthenticatedUser, RoleMappingEntry, UserRole };

// =============================================================================
// Role Resolution (exported separately for testability)
// =============================================================================

/**
 * Resolves a user's role from the role mapping array.
 * Returns the mapped role if the login is found, otherwise defaults to 'associate'.
 */
export function resolveRole(
  login: string,
  mapping: RoleMappingEntry[],
): UserRole {
  const entry = mapping.find((m) => m.login === login);
  return entry?.role ?? 'associate';
}

// =============================================================================
// Role Mapping Loader
// =============================================================================

const ROLE_MAPPING_PATH = path.resolve(
  process.cwd(),
  'data',
  'role-mapping.json',
);

/**
 * Reads the role mapping configuration from disk.
 * Returns an empty array if the file is missing or unparseable.
 */
export async function loadRoleMapping(): Promise<RoleMappingEntry[]> {
  try {
    const raw = await readFile(ROLE_MAPPING_PATH, 'utf-8');
    return JSON.parse(raw) as RoleMappingEntry[];
  } catch {
    return [];
  }
}

// =============================================================================
// Auth Module
// =============================================================================

export interface AuthModule {
  /** Resolves the authenticated user from the request context. Returns null if unauthenticated. */
  getUser(request: Request): Promise<AuthenticatedUser | null>;
}

/**
 * Creates the default Auth module backed by the on-disk role mapping file.
 */
export function createAuthModule(): AuthModule {
  return { getUser };
}

/**
 * Resolves the authenticated user from the incoming request.
 *
 * Reads the login from the `x-user-login` header (or falls back to the
 * `user_login` cookie). If neither is present the user is unauthenticated
 * and `null` is returned.
 *
 * The email is read from the `x-user-email` header (or `user_email` cookie),
 * defaulting to `<login>@example.com` when absent.
 */
async function getUser(request: Request): Promise<AuthenticatedUser | null> {
  const login = getHeaderOrCookie(request, 'x-user-login', 'user_login');
  if (!login) return null;

  const email =
    getHeaderOrCookie(request, 'x-user-email', 'user_email') ??
    `${login}@example.com`;

  const mapping = await loadRoleMapping();
  const role = resolveRole(login, mapping);

  return { login, email, role };
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Reads a value from a request header first, falling back to a named cookie.
 */
function getHeaderOrCookie(
  request: Request,
  headerName: string,
  cookieName: string,
): string | null {
  // Try header first
  const headerVal = request.headers.get(headerName);
  if (headerVal) return headerVal;

  // Fall back to cookie
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${cookieName}=`));

  return match ? decodeURIComponent(match.split('=')[1]) : null;
}
