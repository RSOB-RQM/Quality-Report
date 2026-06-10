# Requirements Document

## Introduction

The Quality Performance Dashboard is a self-service web application that enables associates, managers, and admins to view RQM (Quality Monitoring) performance data without manual distribution. Associates see only their own quality metrics, managers see metrics for their direct reportees, and the admin has full visibility across all associates and managers. The dashboard is fed by weekly Excel uploads of raw RQM audit data and surfaces defect rates, error attribute breakdowns, common findings, best practices, and week-over-week trends.

## Glossary

- **Dashboard**: The Next.js web application that renders quality performance views for authenticated users.
- **Associate**: An individual contributor whose audit records are tracked in the RQM data, identified by `associateLogin`.
- **Manager**: A supervisor responsible for a set of associates, identified by `supervisorLogin`. A Manager can view performance data for all associates whose `supervisorLogin` matches their own login.
- **Admin**: The system administrator with unrestricted access to all data across every associate and manager.
- **RQM_Data**: The raw audit dataset uploaded weekly as an Excel file (`2026-RQM.xlsx` format), containing one row per audited transaction with quality attribute pass/fail results, defect flags, appeal fields, and classification metadata.
- **Audit_Record**: A single row from the RQM_Data file, represented by the `AuditRecord` interface in `src/models/audit-types.ts`.
- **Quality_Attribute**: One of five audited dimensions per transaction — ADM (Associate Decision Making), RA (Right Action / SW Adherence), RRC (Right Reason Code), ACC (Accurate & Complete Communication), RV (Required Validation). Each is "Yes" (pass) or "No" (error).
- **Defect**: An Audit_Record where `defectFlag` is TRUE, indicating a confirmed quality defect.
- **Defect_Rate**: The percentage of Audit_Records that are Defects within a given scope (associate, manager team, or global), calculated as `(totalDefects / totalAudited) * 100`.
- **Error_Attribute_Breakdown**: A frequency distribution showing how many times each Quality_Attribute was marked "No" across a set of Audit_Records.
- **Transaction_Week**: The week number (Column U) assigned to each Audit_Record, used as the primary time dimension for trend analysis.
- **Excel_Parser**: The component responsible for reading an uploaded `.xlsx` file and converting its rows into Audit_Record objects.
- **Excel_Printer**: The component responsible for serializing Audit_Record objects back into a valid `.xlsx` file format.
- **Access_Control**: The authorization layer that restricts data visibility based on the authenticated user's role (Admin, Manager, or Associate).
- **Upload_Service**: The component that accepts an Excel file from the Admin, invokes the Excel_Parser, validates the parsed records, and persists them for dashboard consumption.

## Requirements

### Requirement 1: Role-Based Authentication

**User Story:** As a user, I want to log in with my corporate credentials, so that the Dashboard can identify my role and show me only the data I am authorized to see.

#### Acceptance Criteria

1. WHEN a user authenticates, THE Dashboard SHALL determine the user's role as Admin, Manager, or Associate based on a configured role mapping.
2. IF an unauthenticated user attempts to access any Dashboard route, THEN THE Dashboard SHALL redirect the user to the login page.
3. IF authentication fails, THEN THE Dashboard SHALL display a descriptive error message indicating the reason for failure.

### Requirement 2: Access Control — Associate View

**User Story:** As an associate, I want to see only my own quality performance data, so that my individual metrics remain private.

#### Acceptance Criteria

1. WHILE an Associate is authenticated, THE Access_Control SHALL filter all Audit_Record queries to return only records where `associateLogin` matches the authenticated user's login.
2. WHILE an Associate is authenticated, THE Dashboard SHALL NOT display any data belonging to other associates.
3. IF an Associate attempts to access a URL or API endpoint referencing another associate's data, THEN THE Access_Control SHALL return an authorization error and display no data.

### Requirement 3: Access Control — Manager View

**User Story:** As a manager, I want to see quality performance data for all my direct reportees, so that I can coach and track my team's quality trends.

#### Acceptance Criteria

1. WHILE a Manager is authenticated, THE Access_Control SHALL filter all Audit_Record queries to return only records where `supervisorLogin` matches the authenticated Manager's login.
2. THE Dashboard SHALL display an aggregated team-level summary (total audits, total defects, Defect_Rate) for the Manager's direct reportees.
3. THE Dashboard SHALL allow the Manager to drill down into individual associate performance within their team.
4. IF a Manager attempts to access data for an associate whose `supervisorLogin` does not match the Manager's login, THEN THE Access_Control SHALL return an authorization error and display no data.

### Requirement 4: Access Control — Admin View

**User Story:** As the admin, I want unrestricted access to all quality data across every associate and manager, so that I can monitor the entire program.

#### Acceptance Criteria

1. WHILE an Admin is authenticated, THE Access_Control SHALL apply no data filters, returning all Audit_Records regardless of `associateLogin` or `supervisorLogin`.
2. THE Dashboard SHALL allow the Admin to filter data by any Manager or any Associate.
3. THE Dashboard SHALL allow the Admin to view a global summary across all associates and managers.

### Requirement 5: Weekly and Monthly Performance Summary

**User Story:** As a user, I want to see both my weekly and monthly quality performance, so that I can track short-term progress and longer-term trends.

#### Acceptance Criteria

1. THE Dashboard SHALL display a weekly performance view showing Defect_Rate, total audits, total defects, and total errors for each Transaction_Week, scoped to the current calendar year.
2. THE Dashboard SHALL display a monthly performance view that aggregates weekly data into calendar months, showing monthly Defect_Rate, total audits, total defects, and total errors.
3. THE Dashboard SHALL compute monthly Defect_Rate as `(sum of monthly defects / sum of monthly audits) * 100`, rounded to two decimal places.
4. THE Dashboard SHALL display a week-over-week Defect_Rate trend chart, with Transaction_Week on the x-axis and Defect_Rate percentage on the y-axis.
5. THE Dashboard SHALL display a month-over-month Defect_Rate trend chart alongside the weekly chart.
6. THE Dashboard SHALL allow the user to toggle between weekly and monthly views.
7. WHEN fewer than two data points exist for the user's scope in a given view, THE Dashboard SHALL display the available data points without rendering a trend line.

### Requirement 6: Associate Error Detail Report

**User Story:** As an associate, I want to see a clear, detailed list of every error I made this year with the auditor findings, so that I know exactly what went wrong and can avoid repeating the same mistakes.

#### Acceptance Criteria

1. THE Dashboard SHALL display a detailed error log listing every Audit_Record where at least one Quality_Attribute is "No" for the authenticated associate, scoped to the current calendar year.
2. FOR each error record, THE Dashboard SHALL display the Transaction_Week, transaction date, disruption type, the failed Quality_Attribute(s), and the corresponding auditor finding text.
3. THE Dashboard SHALL allow the associate to filter the error log by Quality_Attribute (ADM, RA, RRC, ACC, RV) and by Transaction_Week range.
4. THE Dashboard SHALL display a total error count and a breakdown by Quality_Attribute at the top of the error log.
5. THE Dashboard SHALL sort the error log in reverse chronological order (most recent week first) by default.

### Requirement 7: Error Attribute Breakdown

**User Story:** As a user, I want to see which quality attributes I fail most often, so that I can focus my improvement efforts.

#### Acceptance Criteria

1. THE Dashboard SHALL display an Error_Attribute_Breakdown showing the frequency count of "No" results for each of the five Quality_Attributes (ADM, RA, RRC, ACC, RV).
2. THE Dashboard SHALL sort the Error_Attribute_Breakdown in descending order by frequency count.
3. THE Dashboard SHALL display the percentage each attribute contributes to the total error count.
4. WHEN a user selects a specific Transaction_Week, THE Dashboard SHALL filter the Error_Attribute_Breakdown to show only errors from that week.

### Requirement 8: Common Errors and Findings

**User Story:** As a user, I want to see the most common auditor findings associated with my errors, so that I understand what specific mistakes to avoid.

#### Acceptance Criteria

1. THE Dashboard SHALL display a list of distinct auditor findings grouped by Quality_Attribute, sourced from the finding fields (`admFinding`, `raFinding`, `rrcFinding`, `accFinding`, `rvFinding`) of Audit_Records with errors.
2. THE Dashboard SHALL display the frequency count for each distinct finding.
3. THE Dashboard SHALL sort findings within each Quality_Attribute group in descending order by frequency.
4. WHEN no error findings exist for the user's scope, THE Dashboard SHALL display a message indicating zero errors recorded.

### Requirement 9: Best Practices and Defect Avoidance Guidance

**User Story:** As a user, I want to see actionable best practices and defect avoidance tips relevant to my error patterns, so that I can proactively reduce defects.

#### Acceptance Criteria

1. THE Dashboard SHALL display defect avoidance guidance entries sourced from `DefectAvoidanceEntry` data, grouped by root cause category.
2. WHEN an associate's error pattern includes a specific Quality_Attribute, THE Dashboard SHALL highlight the avoidance guidance relevant to that attribute.
3. THE Dashboard SHALL display the avoidance guidance in a readable format with the category, associated defect reasons, and the actionable avoidance pointer.

### Requirement 10: Weekly RQM Data Upload

**User Story:** As the admin, I want to upload the weekly RQM Excel file through the Dashboard, so that new audit data is available without manual data processing.

#### Acceptance Criteria

1. WHILE an Admin is authenticated, THE Dashboard SHALL display a data upload interface that accepts `.xlsx` files.
2. WHEN an Admin uploads an Excel file, THE Upload_Service SHALL invoke the Excel_Parser to convert the file contents into Audit_Record objects.
3. WHEN the Excel_Parser encounters a row with missing required fields (`associateLogin`, `supervisorLogin`, `transactionWeek`, or `defectFlag`), THE Excel_Parser SHALL skip that row and record a parse warning with the row number and missing field names.
4. WHEN parsing completes, THE Upload_Service SHALL display a summary showing the count of successfully parsed records and the count of skipped rows with their warnings.
5. IF the uploaded file is not a valid `.xlsx` file, THEN THE Upload_Service SHALL reject the upload and display an error message indicating the file format is invalid.
6. THE Upload_Service SHALL NOT allow non-Admin users to access the upload interface or API endpoint.

### Requirement 11: Excel Parse and Print Round-Trip

**User Story:** As a developer, I want the Excel parser and printer to be inverses of each other, so that data integrity is preserved through serialization cycles.

#### Acceptance Criteria

1. THE Excel_Parser SHALL parse a valid `.xlsx` file into an array of Audit_Record objects.
2. THE Excel_Printer SHALL serialize an array of Audit_Record objects into a valid `.xlsx` file.
3. FOR ALL valid arrays of Audit_Record objects, parsing the output of the Excel_Printer SHALL produce an array equivalent to the original input (round-trip property).
4. WHEN the Excel_Parser encounters an empty spreadsheet, THE Excel_Parser SHALL return an empty array with zero warnings.

### Requirement 12: Week-Over-Week Comparison

**User Story:** As a user, I want to compare my performance between two specific weeks, so that I can see concrete improvement or regression.

#### Acceptance Criteria

1. THE Dashboard SHALL allow the user to select two Transaction_Weeks for side-by-side comparison.
2. WHEN two weeks are selected, THE Dashboard SHALL display the Defect_Rate, total audits, total defects, and Error_Attribute_Breakdown for each selected week side by side.
3. THE Dashboard SHALL display the delta (change) in Defect_Rate between the two selected weeks, expressed as a percentage point difference.
4. WHEN the Defect_Rate decreases between the earlier and later week, THE Dashboard SHALL display the delta with a positive improvement indicator.
5. WHEN the Defect_Rate increases between the earlier and later week, THE Dashboard SHALL display the delta with a regression indicator.

### Requirement 13: Disruption Type Breakdown

**User Story:** As a user, I want to see defects broken down by disruption type, so that I can identify which transaction categories contribute most to my errors.

#### Acceptance Criteria

1. THE Dashboard SHALL display defect counts grouped by `disruptionType` and `subDisruptionType` fields from the Audit_Records within the user's scope.
2. THE Dashboard SHALL sort the disruption breakdown in descending order by defect count.
3. WHEN a user selects a specific Transaction_Week, THE Dashboard SHALL filter the disruption breakdown to that week.

### Requirement 14: Appeal Summary

**User Story:** As a user, I want to see a summary of my audit appeals and their outcomes, so that I can track the effectiveness of my appeal process.

#### Acceptance Criteria

1. THE Dashboard SHALL display an appeal summary showing total appeals, accepted count, not-accepted count, and pending count within the user's scope.
2. THE Dashboard SHALL compute and display the appeal acceptance rate as `(accepted / totalAppeals) * 100`, rounded to two decimal places.
3. WHEN zero appeals exist for the user's scope, THE Dashboard SHALL display the appeal summary with all counts as zero and acceptance rate as 0%.

### Requirement 15: Data Persistence and Incremental Updates

**User Story:** As the admin, I want uploaded data to be persisted and new uploads to add to the existing dataset, so that historical trends are preserved.

#### Acceptance Criteria

1. WHEN an Admin uploads a new Excel file, THE Upload_Service SHALL append the parsed Audit_Records to the existing dataset.
2. IF the uploaded data contains Audit_Records with the same `associateLogin`, `transactionDate`, and `transactionWeek` as existing records, THEN THE Upload_Service SHALL replace the existing records with the new data for those matching keys.
3. THE Dashboard SHALL reflect newly uploaded data on the next page load after a successful upload.

### Requirement 16: Dashboard Loading and Error States

**User Story:** As a user, I want clear feedback when data is loading or when errors occur, so that I understand the current state of the Dashboard.

#### Acceptance Criteria

1. WHILE data is being fetched, THE Dashboard SHALL display a loading indicator.
2. IF a data fetch fails, THEN THE Dashboard SHALL display an error message describing the failure and offer a retry option.
3. WHEN no Audit_Records exist for the user's scope, THE Dashboard SHALL display a message indicating no data is available for the selected filters.
