# Weekly Report - Input Folder Guide

Drop your downloaded CSV files into the appropriate folders below before running the report script.

## Folder Structure

```
weekly-report/
├── input/
│   ├── na-oneview/       ← QuickSight export for NA (Case Count/SL, WIMS Count/SL, VAR Count/SL)
│   ├── eu-oneview/       ← QuickSight export for EU (Case Count/SL, WIMS Count/SL, VAR Count/SL)
│   ├── shrinkage/        ← Connect shrinkage data (NA & EU)
│   ├── lost-hours/       ← Lost Hours Dashboard export
│   ├── rqm-defect/      ← RSOB Defect summary data
│   ├── pkt/             ← Training team PKT data
│   ├── escalation/      ← Escalation Dashboard export
│   ├── rqm-feedback/    ← RQM share drive feedback closure data
│   └── hotw/            ← DWP report (CASA, ACE Eligible, ACE Coverage, Reopen)
├── output/              ← Generated Excel reports appear here
└── README.md
```

## How to Use

1. Download CSVs from each source (QuickSight, Connect, dashboards, emails)
2. Drop each CSV into the matching folder above
3. Run: `node scripts/generate-weekly-report.mjs`
4. Find your formatted Excel in `output/`

## Notes

- Only the latest file in each folder is used (by modified date)
- You can keep old files in the folders — the script always picks the newest one
- Output file is named: `Weekly-Performance-W{week_number}.xlsx`
