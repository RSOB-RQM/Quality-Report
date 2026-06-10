# Implementation Plan: Dashboard Email Automation & Enhancements

## Overview

All changes target `scripts/build-static.ts` — specifically the template literal that generates `dist/dashboard.html`. New functions are added inside the `<script>` block alongside existing aggregation, rendering, and utility functions. Property-based tests use fast-check with Vitest in `src/services/__tests__/`. After all code changes, the build script is re-run to regenerate the static dashboard.

## Tasks

- [x] 1. Add CSS styles for new UI elements
  - Add styles to the `<style>` block in the template literal for: email action buttons (`.email-btn`, `.email-btn-appreciate`, `.email-btn-feedback`), feedback status badges (`.feedback-badge`, `.feedback-pending`, `.feedback-shared`, `.feedback-completed`), EMS button (`.ems-btn`), leadership report section (`.leadership-section`, `.leadership-table`), copy/export buttons (`.copy-btn`, `.export-btn`), and confirmation toast (`.toast-msg`)
  - _Requirements: 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 7.6_

- [x] 2. Implement week-wise Common Findings
  - [x] 2.1 Replace `computeCommonFindings()` with `computeCommonFindingsByWeek(records)`
    - Group findings by `transactionWeek` first, then by quality attribute within each week
    - Return `WeekFindings[]` sorted by week ascending; within each week, sort findings by attribute group then descending frequency count
    - Omit weeks with zero error findings from the output
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.7_
  - [x] 2.2 Modify `renderCommonFindings()` to accept `WeekFindings[]`
    - Render each week as a subsection with a "Week {N}" header
    - When only a single week is in scope, omit the week header wrapper
    - Display findings grouped by attribute with frequency counts
    - Update `renderDashboard()` to call `computeCommonFindingsByWeek()` instead of `computeCommonFindings()`
    - Update `downloadCommonFindings()` CSV export to use the new week-grouped data structure
    - _Requirements: 1.3, 1.6, 1.8_
  - [ ]* 2.3 Write property test: Week-wise Findings Grouping and Counting
    - **Property 1: Week-wise Findings Grouping and Counting**
    - **Validates: Requirements 1.1, 1.2, 1.7**
  - [ ]* 2.4 Write property test: Week-wise Findings Sort Order
    - **Property 2: Week-wise Findings Sort Order**
    - **Validates: Requirements 1.4, 1.5**

- [x] 3. Implement Mailto Link Generator and Email Builders
  - [x] 3.1 Add `buildMailtoLink(to, subject, body)` utility function
    - Construct `mailto:{to}?subject={encoded}&body={encoded}` using `encodeURIComponent`
    - Encode line breaks as `%0D%0A`
    - Truncate body and append `[Content truncated]` if total URI length exceeds 2000 characters
    - _Requirements: 8.1, 8.2, 8.4, 8.5_
  - [x] 3.2 Add `buildAppreciationEmail(associateLogin, records, weekNumber)` function
    - Return `EmailContent` with `to` as `{associateLogin}@amazon.com`
    - Subject format: `Appreciation — 0% Defect Rate — Week {weekNumber}`
    - Body includes: greeting, audit count, transaction dates (case IDs), disruption types, week number, congratulatory message
    - Use the most recent `transactionWeek` when multiple weeks are selected
    - _Requirements: 2.2, 2.3, 2.4, 2.6_
  - [x] 3.3 Add `buildFeedbackEmail(associateLogin, records, defectRate, weekNumber)` function
    - Return `EmailContent` with `to` as `{associateLogin}@amazon.com`
    - Subject format: `Quality Feedback — Defect Rate {rate}% — Week {weekNumber}`
    - Body includes: defect rate, audit count, transaction dates, disruption types, week number, error details (each failed attribute with auditor finding text)
    - _Requirements: 3.2, 3.3, 3.4, 3.6_
  - [ ]* 3.4 Write property test: Mailto Link Round-Trip Encoding
    - **Property 3: Mailto Link Round-Trip Encoding**
    - **Validates: Requirements 8.3, 8.1, 8.2, 3.6**
  - [ ]* 3.5 Write property test: Mailto Link Truncation
    - **Property 4: Mailto Link Truncation**
    - **Validates: Requirements 8.5**
  - [ ]* 3.6 Write property test: Appreciation Email Content
    - **Property 5: Appreciation Email Content**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.6**
  - [ ]* 3.7 Write property test: Feedback Email Content
    - **Property 6: Feedback Email Content**
    - **Validates: Requirements 3.2, 3.3, 3.4**

- [x] 4. Checkpoint — Verify core utilities
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Feedback Tracker (localStorage state management)
  - [x] 5.1 Add `getFeedbackStatus(managerLogin, weekNumber)`, `setFeedbackShared(managerLogin, weekNumber, associateLogin)`, and `initFeedbackTracker(managerLogin, weekNumber, associateLogins)` functions
    - localStorage key format: `feedback_{managerLogin}_wk{weekNumber}`
    - Value: JSON object mapping `associateLogin` → `"Pending"` | `"Shared"`
    - `initFeedbackTracker` initializes all associates to "Pending" only if no entry exists (preserves existing "Shared" status)
    - `setFeedbackShared` updates a single associate to "Shared"
    - `getFeedbackStatus` reads and returns the status map, returns `{}` if not found
    - Handle `QuotaExceededError`, disabled localStorage (fall back to in-memory), and corrupted JSON (reinitialize)
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.8_
  - [ ]* 5.2 Write property test: Feedback Tracker State Machine
    - **Property 7: Feedback Tracker State Machine**
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.8**

- [ ] 6. Add email buttons and feedback status to Associate Summary
  - [x] 6.1 Modify `renderAssociateSummary()` to add an "Actions" column
    - Add "Appreciate" button (green) for rows with 0% defect rate — manager/admin only
    - Add "Feedback" button (orange) for rows with >0% defect rate — manager/admin only
    - Hide email buttons for associate role
    - On button click: call `buildAppreciationEmail` or `buildFeedbackEmail`, then `buildMailtoLink`, set `window.location.href`, and call `setFeedbackShared` to update tracker
    - _Requirements: 2.1, 2.2, 2.5, 3.1, 3.2, 3.5, 4.3_
  - [x] 6.2 Add feedback status badges to `renderAssociateSummary()`
    - Call `initFeedbackTracker` on render for current week
    - Show "Pending" (orange) or "Shared" (green) badge for current week — manager/admin only
    - Show "Completed" (gray) badge for previous weeks ≥ 15
    - Hide feedback indicators for weeks < 15
    - _Requirements: 4.1, 4.5, 4.6, 4.7_

- [ ] 7. Implement EMS Portal Link
  - [x] 7.1 Add `buildEmsLink(associateLogin, records, weekNumber)` function
    - Base URL: `https://share.amazon.com/sites/EMS%202.0/Lists/EMS%2020/Item/newifs.aspx` with List, Source, RootFolder, Web query parameters
    - Query parameters: Team="OB", Week="Week{number}", Associate, Manager (supervisorLogin), Region, Category="Performance", CaseWIMsID (transaction dates), Summary (failed attributes + findings), SkipManager="" (empty)
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  - [x] 7.2 Modify `renderRepeatedDefaulters()` to add "Actions" column with "EMS" button
    - Show EMS button for manager/admin only; hide for associate role
    - On click: open `buildEmsLink()` URL in a new tab via `window.open()`
    - _Requirements: 5.1, 5.8_
  - [ ]* 7.3 Write property test: EMS Link Correctness
    - **Property 8: EMS Link Correctness**
    - **Validates: Requirements 5.2, 5.3, 5.4, 5.5**

- [x] 8. Checkpoint — Verify email automation and EMS features
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement Leadership Report (admin-only)
  - [x] 9.1 Add `computeLeadershipReport(records)` function
    - Compute `regionSummary`: per-region per-week audited/defects/rate + trend (improving/regressing/stable based on last 4 weeks)
    - Compute `managerComparison`: per-supervisor audited/defects/rate
    - Include `repeatedDefaulters` list with defect week counts
    - Include `bestPractices` array with actionable guidance strings
    - _Requirements: 6.3, 6.4, 6.5, 6.6, 6.7_
  - [x] 9.2 Add `renderLeadershipReport(report)` function
    - Render HTML with tables for region summary, manager comparison, repeated defaulters, and best practices
    - Include "Copy to Clipboard" button calling `copyLeadershipReport()`
    - Include "Export CSV" button calling `exportLeadershipCsv(report)`
    - _Requirements: 6.3, 6.4, 6.5, 6.6, 6.7, 7.1, 7.6_
  - [x] 9.3 Add `copyLeadershipReport()` and `exportLeadershipCsv(report)` functions
    - `copyLeadershipReport`: format report as plain text with section headers, aligned columns, line separators; copy via `navigator.clipboard.writeText()`; show "Copied!" toast for 2 seconds; show error message on failure
    - `exportLeadershipCsv`: download `.csv` file with tabular data sections using existing `downloadCsv()` utility
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  - [ ]* 9.4 Write property test: Leadership Report Region Summary
    - **Property 9: Leadership Report Region Summary**
    - **Validates: Requirements 6.3, 6.6**
  - [ ]* 9.5 Write property test: Leadership Report Manager Comparison
    - **Property 10: Leadership Report Manager Comparison**
    - **Validates: Requirements 6.4**
  - [ ]* 9.6 Write property test: Leadership Report Plain Text Formatting
    - **Property 11: Leadership Report Plain Text Formatting**
    - **Validates: Requirements 7.3**

- [ ] 10. Add navigation and state updates for Leadership Report
  - [x] 10.1 Modify `renderNav()` to add "Leadership Report" nav link for admin users only
    - Add a nav button that sets `state.currentView='leadership'` and calls `render()`
    - Hide the link for manager and associate roles
    - _Requirements: 6.1, 6.2_
  - [x] 10.2 Update `state` object and `render()` function
    - Add `'leadership'` to `currentView` options
    - In `render()`, when `currentView === 'leadership'`, call `computeLeadershipReport()` with all records (admin has full access) and render via `renderLeadershipReport()`
    - _Requirements: 6.1_

- [x] 11. Rebuild dashboard
  - Run `npx tsx scripts/build-static.ts` to regenerate `dist/dashboard.html` with all new features
  - Verify the build completes without errors

- [x] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- All new functions are added inside the `<script>` block of the template literal in `scripts/build-static.ts`
- Property-based tests go in `src/services/__tests__/email-automation.property.test.ts` using fast-check + Vitest
- Pure functions (buildMailtoLink, buildAppreciationEmail, etc.) are extracted into a testable module for property testing
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
