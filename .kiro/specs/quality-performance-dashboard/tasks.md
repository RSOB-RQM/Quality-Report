# Implementation Plan: Quality Performance Dashboard

## Overview

Build a self-service Next.js dashboard that surfaces RQM audit data with role-based access control. Implementation proceeds bottom-up: data models and types first, then core services (parsing, persistence, aggregation), then access control and auth, then API routes, and finally UI components. Each layer is tested before the next is built on top of it.

## Tasks

- [x] 1. Define new types and extend data models
  - [x] 1.1 Create new shared types for the dashboard
    - Add `MonthlySummary`, `WeekComparisonResult`, `CommonFindingsResult`, `ErrorDetailRecord`, `RoleMappingEntry`, `UserRole`, `AuthenticatedUser`, `ExcelParseResult`, `ExcelParseWarning`, `UploadResult` interfaces to `src/models/dashboard-types.ts`
    - Reuse existing types from `src/models/audit-types.ts` (AuditRecord, WeekAnalysis, ErrorCategoryBreakdown, DisruptionBreakdown, AppealSummary, DefectAvoidanceEntry)
    - _Requirements: 5.2, 5.3, 12.2, 8.1, 6.2, 1.1_

- [x] 2. Implement Auth Module
  - [x] 2.1 Create Auth Module with role resolution
    - Create `src/auth/auth.ts` implementing the `AuthModule` interface
    - Read role mapping from `data/role-mapping.json`
    - Resolve user role from mapping; default to `associate` if login not found
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 2.2 Write property test for role resolution (Property 1)
    - **Property 1: Role Resolution**
    - For any login and valid role mapping, the Auth module resolves to the mapped role or defaults to `associate`
    - Create `src/auth/__tests__/auth.property.test.ts`
    - **Validates: Requirements 1.1**

  - [ ]* 2.3 Write unit tests for Auth Module
    - Test redirect for unauthenticated users
    - Test auth failure error messages
    - Create `src/auth/__tests__/auth.test.ts`
    - _Requirements: 1.2, 1.3_

- [x] 3. Implement Access Control
  - [x] 3.1 Create Access Control filter logic
    - Create `src/access-control/access-control.ts` implementing the `AccessControl` interface
    - Admin filter: `() => true` (no filtering)
    - Manager filter: `(r) => r.supervisorLogin === user.login`
    - Associate filter: `(r) => r.associateLogin === user.login`
    - _Requirements: 2.1, 2.2, 3.1, 4.1_

  - [ ]* 3.2 Write property test for access control filter correctness (Property 2)
    - **Property 2: Access Control Filter Correctness**
    - For any array of AuditRecords and any authenticated user, the filter returns exactly the authorized subset
    - Create `src/access-control/__tests__/access-control.property.test.ts`
    - **Validates: Requirements 2.1, 2.2, 3.1, 4.1**

  - [ ]* 3.3 Write unit tests for Access Control edge cases
    - Test associate accessing another associate's data returns 403
    - Test manager accessing out-of-team data returns 403
    - Create `src/access-control/__tests__/access-control.test.ts`
    - _Requirements: 2.3, 3.4_

- [x] 4. Checkpoint — Auth and Access Control
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Excel Adapter
  - [x] 5.1 Create Excel Parser and Printer
    - Create `src/adapters/excel-adapter.ts` following the existing adapter pattern
    - Implement `parse(buffer: Buffer): ExcelParseResult` — convert .xlsx rows to AuditRecord[]
    - Implement `print(records: AuditRecord[]): Buffer` — serialize AuditRecord[] to .xlsx
    - Skip rows missing required fields (`associateLogin`, `supervisorLogin`, `transactionWeek`, `defectFlag`) and record warnings
    - Handle empty spreadsheets (return empty array, zero warnings)
    - Handle corrupted cell data (skip row, add warning)
    - _Requirements: 10.2, 10.3, 11.1, 11.2, 11.4_

  - [ ]* 5.2 Write property test for parser skipping invalid rows (Property 13)
    - **Property 13: Parser Skips Invalid Rows**
    - For any spreadsheet with rows missing required fields, the parser excludes them and produces warnings with row number and missing field names
    - Create `src/adapters/__tests__/excel-adapter.property.test.ts`
    - **Validates: Requirements 10.3**

  - [ ]* 5.3 Write property test for Excel parse/print round-trip (Property 14)
    - **Property 14: Excel Parse/Print Round-Trip**
    - For any valid AuditRecord[], print then parse produces an equivalent array
    - Add to `src/adapters/__tests__/excel-adapter.property.test.ts`
    - **Validates: Requirements 11.1, 11.2, 11.3**

- [x] 6. Implement Data Access Layer
  - [x] 6.1 Create Data Access Layer with file-based persistence
    - Create `src/data/data-access.ts` implementing the `DataAccess` interface
    - Read/write `data/audit-records.json` atomically
    - Implement `getRecords(filter?)` — read JSON, apply optional filter predicate
    - Implement `upsertRecords(records)` — merge by composite key (`associateLogin` + `transactionDate` + `transactionWeek`), replace matches, append new
    - _Requirements: 15.1, 15.2, 15.3_

  - [ ]* 6.2 Write property test for data upsert correctness (Property 18)
    - **Property 18: Data Upsert Correctness**
    - For any existing and new AuditRecord arrays, upsert appends new keys, replaces matching keys, and preserves unmatched existing records
    - Create `src/data/__tests__/data-access.property.test.ts`
    - **Validates: Requirements 15.1, 15.2**

- [x] 7. Implement Upload Service
  - [x] 7.1 Create Upload Service
    - Create `src/services/upload-service.ts` implementing the `UploadService` interface
    - Validate file is `.xlsx` format; reject with error if not
    - Invoke Excel Parser, then upsert parsed records via Data Access Layer
    - Return `UploadResult` with parsed count, skipped count, warnings, and merge stats
    - _Requirements: 10.1, 10.2, 10.4, 10.5, 10.6_

  - [ ]* 7.2 Write unit tests for Upload Service
    - Test invalid file rejection
    - Test upload summary (parsed count, skipped count)
    - Test non-admin access is blocked
    - Create `src/services/__tests__/upload-service.test.ts`
    - _Requirements: 10.4, 10.5, 10.6_

- [x] 8. Checkpoint — Data Layer and Upload
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Aggregation Functions
  - [x] 9.1 Implement computeDefectRate and computeWeeklySummary
    - Create `src/services/aggregation.ts`
    - `computeDefectRate(totalDefects, totalAudited)` — returns percentage rounded to 2 decimal places, returns 0 when totalAudited is 0
    - `computeWeeklySummary(records)` — groups by transactionWeek, computes totalAudited, totalDefects, totalErrors per week
    - _Requirements: 5.1, 5.3, 3.2_

  - [ ]* 9.2 Write property test for defect rate computation (Property 5)
    - **Property 5: Defect Rate Computation**
    - For any non-negative totalDefects and positive totalAudited where totalDefects <= totalAudited, returns correctly rounded percentage; returns 0 when totalAudited is 0
    - Create `src/services/__tests__/aggregation.property.test.ts`
    - **Validates: Requirements 5.3, 14.2**

  - [ ]* 9.3 Write property test for weekly summary invariants (Property 3)
    - **Property 3: Weekly Summary Invariants**
    - For any AuditRecord[], each week's totalAudited, totalDefects, and totalErrors match the actual counts
    - Add to `src/services/__tests__/aggregation.property.test.ts`
    - **Validates: Requirements 5.1, 3.2**

  - [x] 9.4 Implement computeMonthlySummary
    - Add to `src/services/aggregation.ts`
    - Group records by calendar month derived from `transactionDate`, compute totalAudited, totalDefects, totalErrors, defectRate per month
    - _Requirements: 5.2, 5.3_

  - [ ]* 9.5 Write property test for monthly summary invariants (Property 4)
    - **Property 4: Monthly Summary Invariants**
    - For any AuditRecord[], each month's totals and defectRate match actual counts
    - Add to `src/services/__tests__/aggregation.property.test.ts`
    - **Validates: Requirements 5.2, 5.3**

  - [x] 9.6 Implement error record filtering and ErrorDetailRecord transformation
    - Add `filterErrorRecords(records)` and `toErrorDetailRecord(record)` to `src/services/aggregation.ts`
    - Filter records where at least one quality attribute is "No"
    - Transform to ErrorDetailRecord with failedAttributes and findings arrays
    - _Requirements: 6.1, 6.2_

  - [ ]* 9.7 Write property test for error record filtering (Property 6)
    - **Property 6: Error Record Filtering**
    - For any AuditRecord[], filtering returns exactly records with at least one attribute "No"
    - Add to `src/services/__tests__/aggregation.property.test.ts`
    - **Validates: Requirements 6.1**

  - [ ]* 9.8 Write property test for error detail transformation (Property 7)
    - **Property 7: Error Detail Transformation**
    - For any AuditRecord with errors, transformation produces correct failedAttributes and findings
    - Add to `src/services/__tests__/aggregation.property.test.ts`
    - **Validates: Requirements 6.2**

  - [x] 9.9 Implement error log filtering by attribute and week, and sort order
    - Add `filterErrorLog(records, attribute?, weekRange?)` and `sortErrorLogDesc(records)` to `src/services/aggregation.ts`
    - Filter by selected quality attribute and week range
    - Sort in reverse chronological order (most recent week first)
    - _Requirements: 6.3, 6.5_

  - [ ]* 9.10 Write property test for error log filtering (Property 8)
    - **Property 8: Error Log Filtering by Attribute and Week**
    - For any error records, attribute, and week range, filtered result contains exactly matching records
    - Add to `src/services/__tests__/aggregation.property.test.ts`
    - **Validates: Requirements 6.3**

  - [ ]* 9.11 Write property test for error log sort order (Property 9)
    - **Property 9: Error Log Sort Order**
    - For any error records, sorted result has each record's transactionWeek >= the next record's transactionWeek
    - Add to `src/services/__tests__/aggregation.property.test.ts`
    - **Validates: Requirements 6.5**

  - [x] 9.12 Implement computeErrorBreakdown
    - Add to `src/services/aggregation.ts`
    - Count "No" results per quality attribute, sort descending, compute percentage of total errors
    - Support optional week filter
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 9.13 Write property test for error attribute breakdown (Property 10)
    - **Property 10: Error Attribute Breakdown**
    - For any AuditRecord[] and optional week, counts match actual "No" occurrences, sorted descending, percentages correct
    - Add to `src/services/__tests__/aggregation.property.test.ts`
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

  - [x] 9.14 Implement computeCommonFindings
    - Add to `src/services/aggregation.ts`
    - Group findings by quality attribute, count frequency, sort descending within each group
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 9.15 Write property test for common findings grouping (Property 11)
    - **Property 11: Common Findings Grouping**
    - For any AuditRecord[] with errors, findings are grouped by attribute, frequencies match, sorted descending
    - Add to `src/services/__tests__/aggregation.property.test.ts`
    - **Validates: Requirements 8.1, 8.2, 8.3**

  - [x] 9.16 Implement computeWeekComparison
    - Add to `src/services/aggregation.ts`
    - Compare two weeks: compute WeekAnalysis and ErrorCategoryBreakdown for each, calculate defectRateDelta and direction
    - _Requirements: 12.2, 12.3, 12.4, 12.5_

  - [ ]* 9.17 Write property test for week-over-week comparison (Property 15)
    - **Property 15: Week-Over-Week Comparison**
    - For any AuditRecord[] and two weeks, summaries match independent computation, delta and direction are correct
    - Add to `src/services/__tests__/aggregation.property.test.ts`
    - **Validates: Requirements 12.2, 12.3, 12.4, 12.5**

  - [x] 9.18 Implement computeDisruptionBreakdown
    - Add to `src/services/aggregation.ts`
    - Group defect records by disruptionType + subDisruptionType, count defects, sort descending
    - Support optional week filter
    - _Requirements: 13.1, 13.2, 13.3_

  - [ ]* 9.19 Write property test for disruption breakdown (Property 16)
    - **Property 16: Disruption Breakdown**
    - For any AuditRecord[] and optional week, defect counts per group match actual counts, sorted descending
    - Add to `src/services/__tests__/aggregation.property.test.ts`
    - **Validates: Requirements 13.1, 13.2, 13.3**

  - [x] 9.20 Implement computeAppealSummary
    - Add to `src/services/aggregation.ts`
    - Count appeals by spocResponse, compute acceptanceRate, handle zero appeals
    - _Requirements: 14.1, 14.2, 14.3_

  - [ ]* 9.21 Write property test for appeal summary (Property 17)
    - **Property 17: Appeal Summary**
    - For any AuditRecord[], appeal counts match spocResponse values, acceptanceRate is correct, zero appeals returns 0%
    - Add to `src/services/__tests__/aggregation.property.test.ts`
    - **Validates: Requirements 14.1, 14.2, 14.3**

- [x] 10. Implement Guidance Highlighting
  - [x] 10.1 Create guidance highlighting logic
    - Create `src/services/guidance.ts`
    - Given an associate's failed attributes and DefectAvoidanceEntry[], return highlighted entries matching the associate's error pattern
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* 10.2 Write property test for guidance highlighting (Property 12)
    - **Property 12: Guidance Highlighting Matches Error Pattern**
    - For any set of failed attributes and DefectAvoidanceEntry[], highlighted entries include all matching and exclude all non-matching
    - Create `src/services/__tests__/guidance.property.test.ts`
    - **Validates: Requirements 9.2**

- [x] 11. Checkpoint — All Services and Aggregation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Implement API Routes
  - [x] 12.1 Create dashboard data API route
    - Create `src/app/api/dashboard/route.ts`
    - Authenticate user via Auth Module, apply Access Control filter
    - Fetch scoped records from Data Access Layer
    - Run aggregation functions (weekly summary, monthly summary, error breakdown, disruption breakdown, appeal summary, common findings)
    - Return JSON response with all computed views
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 5.2, 7.1, 8.1, 13.1, 14.1_

  - [x] 12.2 Create upload API route
    - Create `src/app/api/upload/route.ts`
    - Verify user is Admin; return 403 for non-admin
    - Accept .xlsx file, invoke Upload Service
    - Return upload result with parsed count, skipped count, warnings
    - _Requirements: 10.1, 10.2, 10.6_

  - [x] 12.3 Create week comparison API route
    - Create `src/app/api/dashboard/compare/route.ts`
    - Accept weekA and weekB query params
    - Authenticate, filter, compute comparison
    - _Requirements: 12.1, 12.2, 12.3_

  - [ ]* 12.4 Write unit tests for API routes
    - Test unauthenticated access redirects to login
    - Test role-based data scoping
    - Test non-admin upload rejection
    - Create `src/app/api/__tests__/routes.test.ts`
    - _Requirements: 1.2, 2.3, 3.4, 10.6_

- [x] 13. Implement Dashboard UI Components
  - [x] 13.1 Create DashboardLayout and PerformanceSummary
    - Create `src/app/dashboard/page.tsx` — main dashboard page
    - Create `src/app/dashboard/components/DashboardLayout.tsx` — shell with nav, role indicator, filters
    - Create `src/app/dashboard/components/PerformanceSummary.tsx` — weekly/monthly defect rate cards with toggle
    - _Requirements: 5.1, 5.2, 5.6_

  - [x] 13.2 Create TrendChart component
    - Create `src/app/dashboard/components/TrendChart.tsx`
    - Line chart for week-over-week and month-over-month defect rate trends
    - Handle fewer than 2 data points (show points without trend line)
    - _Requirements: 5.4, 5.5, 5.7_

  - [x] 13.3 Create ErrorBreakdownChart and ErrorDetailTable
    - Create `src/app/dashboard/components/ErrorBreakdownChart.tsx` — bar chart of attribute error frequencies
    - Create `src/app/dashboard/components/ErrorDetailTable.tsx` — filterable table of error records with attribute and week filters, reverse chronological sort
    - Display total error count and breakdown at top
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4_

  - [x] 13.4 Create CommonFindingsPanel and BestPracticesPanel
    - Create `src/app/dashboard/components/CommonFindingsPanel.tsx` — grouped findings by attribute with frequency
    - Create `src/app/dashboard/components/BestPracticesPanel.tsx` — defect avoidance guidance grouped by category
    - Handle empty findings state with "zero errors recorded" message
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3_

  - [x] 13.5 Create WeekComparisonView
    - Create `src/app/dashboard/components/WeekComparisonView.tsx`
    - Week selector for two weeks, side-by-side display of defect rate, audits, defects, error breakdown
    - Show delta with improvement/regression indicator
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 13.6 Create DisruptionBreakdownTable and AppealSummaryCard
    - Create `src/app/dashboard/components/DisruptionBreakdownTable.tsx` — defect counts by disruption/sub-disruption type with week filter
    - Create `src/app/dashboard/components/AppealSummaryCard.tsx` — appeal counts and acceptance rate, handle zero appeals
    - _Requirements: 13.1, 13.2, 13.3, 14.1, 14.2, 14.3_

  - [x] 13.7 Create AdminUploadPanel
    - Create `src/app/dashboard/components/AdminUploadPanel.tsx`
    - File upload widget accepting .xlsx files, visible only to Admin
    - Display upload result summary (parsed count, skipped count, warnings)
    - _Requirements: 10.1, 10.4, 10.6_

  - [x] 13.8 Create loading, error, and empty states
    - Add loading indicator while data is fetched
    - Add error message with retry option on fetch failure
    - Add "no data available" message when no records exist for user's scope
    - _Requirements: 16.1, 16.2, 16.3_

  - [ ]* 13.9 Write unit tests for Dashboard UI components
    - Test Admin filter/drill-down controls render correctly
    - Test chart rendering with insufficient data points
    - Test upload interface visibility by role
    - Test loading, error, and empty state rendering
    - Create `src/app/dashboard/__tests__/components.test.ts`
    - _Requirements: 4.2, 4.3, 5.7, 10.1, 16.1, 16.2, 16.3_

- [x] 14. Wire components together and integrate
  - [x] 14.1 Connect Dashboard page to API routes
    - Wire `src/app/dashboard/page.tsx` to fetch data from `/api/dashboard`
    - Pass scoped data to all child components
    - Wire week comparison to `/api/dashboard/compare`
    - Wire admin upload to `/api/upload`
    - Ensure newly uploaded data reflects on next page load
    - _Requirements: 4.2, 4.3, 5.6, 12.1, 15.3_

  - [x] 14.2 Add login page and auth redirect
    - Create `src/app/login/page.tsx` with login form
    - Redirect unauthenticated users to login page
    - Display auth failure error messages
    - _Requirements: 1.2, 1.3_

  - [ ]* 14.3 Write integration tests
    - Test full upload flow: admin uploads .xlsx → parser → upsert → data available on next load
    - Test role-based data visibility: same dataset, three users, verify each sees correct scope
    - Create `src/__tests__/integration.test.ts`
    - _Requirements: 10.2, 15.3, 2.1, 3.1, 4.1_

- [x] 15. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate the 18 universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All aggregation functions are pure and testable in isolation
- The existing `AuditRecord` model and adapter pattern are reused throughout
