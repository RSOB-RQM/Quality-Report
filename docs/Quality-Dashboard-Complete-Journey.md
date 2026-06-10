# RSOB Quality Performance Dashboard — Complete Journey

## Summary of Everything Built & Discussed

---

## 1. PROJECT OVERVIEW

**What:** A self-service Quality Performance Dashboard for the RSOB process (NA & EU regions) that allows associates, managers, and admins to view audit quality data without manual sharing.

**Why:** Eliminate weekly manual sharing of quality updates. Give everyone role-based visibility into their own performance.

**Live URL:** https://RSOB-RQM.github.io/Quality-Report/

---

## 2. DATA SOURCES

| File | Content | Weeks |
|------|---------|-------|
| `WoW Report-RSOB (2).xlsx` → "Raw" sheet | Primary audit data (same format as original 2026-RQM.xlsx) | Weeks 1-16 |
| `Rsob Week 18 report (1).xlsx` → "Data" sheet | Zeus export format (different column structure) | Week 18 |
| Week 17 | **Missing** — not available in any file | — |

**Total Records:** 6,708 | **Total Defects:** 371 (5.5%)

---

## 3. KEY BUSINESS RULES

### Defect Detection
- **Overall% column:** 1.0 (100%) = No defect. Below 1.0 = Defect.
- Each transaction = 1 audit count.
- **Defect Rate** = (Audits with Defects ÷ Total Audits) × 100

### Appeal Override (Correction Applied)
- If **SPOC Response** = "Appeal Accepted" → NOT a defect
- If **Appeal Lead Decision** contains "Accepted" (but NOT "Not Accepted") → NOT a defect
- **23 records** were overridden by this rule

### Color Coding
- 🟢 Green: ≤5%
- 🟡 Yellow: 5-10%
- 🔴 Red: >10%

### Repeated Defaulters
- Rolling last 5 weeks
- Threshold: 3+ weeks with defects

---

## 4. ROLE-BASED ACCESS CONTROL

| Role | Who | What They See |
|------|-----|---------------|
| **Admin** | mpuranik, poojajsh, sohamp, vishaala | Process View + Team View + Leadership Report |
| **L5 Manager** | sahigour, shrmaam, padakank | Their reporting L4 managers' data |
| **L4 Manager** | 23 managers (ahujadiv, aksjais, etc.) | Their team's summary (no case-level data) + Raw Data link |
| **Associate** | All others | Only their own data with case-level detail |

### Security
- Login validated against role mapping AND audit data
- Password hashed (SHA-256) and stored in `data/password-hashes.json`
- Session stored in sessionStorage (clears on browser close)
- Users not in the system get "Login not found" error

---

## 5. DASHBOARD FEATURES

### Navigation Order
- **All users:** Glossary → Dashboard → Raw Data
- **Admin only:** Glossary → Dashboard → Raw Data → Leadership Report

### Glossary Page (Landing Page)
- Visual cards for each quality attribute (ADM, RA, RRC, ACC, RV)
- Full descriptions, audit questions, business impact
- Live error counts from last 4 weeks
- Scoring methodology explanation
- **Actions & Impact section** — shows W12-14 spike reasons and post-W14 improvement actions

### Dashboard Page
- **Admin Process View:** Region-wise summary, week comparison, error breakdown, common findings, repeated defaulters, best practices
- **Admin Team View:** Same as manager view but for admin's own team
- **Manager View:** Associate-wise summary, defect type breakdown, week-wise comparison table, repeated defaulters. NO case-level data. Link to Raw Data.
- **Associate View:** Personal performance, case-level detail, common defects, best practices

### Filters Available
- Region (NA/EU/Both)
- Week preset (Last 4, Last 8, All, or specific week)
- Month dropdown
- All tables have CSV download option

### Raw Data Page
- Full transaction-level data
- Managers see their team's data
- Associates see only their own records
- Search, filter by region/week/month
- Pagination

### Leadership Report (Admin Only)
- Region-wise performance with trend
- Monthly summary
- Manager comparison
- Shift-wise performance
- Defect reason trend (Tool Controllable vs Associate Controllable)
- Appeal summary
- Copy to clipboard + Export CSV

---

## 6. QUALITY ATTRIBUTES

| Abbreviation | Full Name | Question |
|---|---|---|
| **ADM** | Associate Decision Making | If we have SW, was it followed to arrive at the decision to add truck, cancel truck, or deny? |
| **RA** | SW Adherence - Right Action | Was the right action taken as per SW outcome? |
| **RRC** | Right Reason Code | Was the right reason code used? |
| **ACC** | Accurate & Complete Communication | Was the required information shared with the site? (Not applicable for WIMS) |
| **RV** | Required Validation (Necessary Checks) | Did the associate do all the necessary checks and act accordingly? |

---

## 7. DATA PARSING — COLUMN MAPPING

### WoW Report Format (Weeks 1-16)
| Excel Column | Maps To |
|---|---|
| KR1 | adm (Yes/No) |
| KR1_A1 | admFinding |
| RA | ra (Yes/No) |
| RA1_A1 | raFinding |
| RRC | rrc (Yes/No) |
| RRC_A1 | rrcFinding |
| ACC | acc (Yes/No) |
| ACC_A1 | accFinding |
| RV | rv (Yes/No) |
| RV_A1 | rvFinding |
| Overall% | defectFlag (< 1.0 = defect) |
| Alogin | associateLogin |
| Supervisor Login | supervisorLogin |
| Transaction Week | transactionWeek |
| Region | region |

### Week 18 Zeus Export Format
| Excel Column | Maps To |
|---|---|
| sourceContext.Associate_Decision_Making | If non-empty → adm='No', text = admFinding |
| sourceContext.SW_Adherence_Right_Action | If non-empty → ra='No', text = raFinding |
| sourceContext.Right_Reason_Code | If non-empty → rrc='No', text = rrcFinding |
| sourceContext.Accurate_&_Complete_Communication | If non-empty → acc='No', text = accFinding |
| sourceContext.Required_Validation | If non-empty → rv='No', text = rvFinding |
| sourceContext.Defect_Present | "No" = no defect, anything else = defect |
| sourceContext.Associate_Login | associateLogin |
| assignedUser (fallback: sourceContext.Supervisor) | supervisorLogin |
| sourceContext.WeekNo | transactionWeek |
| sourceContext.Region | region |

---

## 8. DEPLOYMENT & DISTRIBUTION

### GitHub Pages (Live)
- **URL:** https://RSOB-RQM.github.io/Quality-Report/
- **Repo:** https://github.com/RSOB-RQM/Quality-Report
- **Token:** Classic PAT with `repo` scope (ghp_M8O5...)
- **Deploy script:** `scripts/gh-deploy3.mjs`

### Local Access
- `dist/OPEN-DASHBOARD.bat` — starts local HTTP server on port 8080
- Auto-detects Windows username for login

### Credentials
- `dist/CREDENTIALS.txt` — full list of all logins and passwords
- Share individual credentials privately with each user
- Admins: password = `admin2026`
- Managers/Associates: auto-generated 8-char hex passwords

---

## 9. WEEKLY UPDATE PROCESS

To update the dashboard with new week's data:

```
Step 1: Place new Excel file(s) in the project folder
Step 2: Update scripts/load-all-data.mjs if new file format
Step 3: Run: node scripts/load-all-data.mjs
Step 4: Run: npx tsx scripts/build-static.ts
Step 5: Run: node scripts/gh-deploy3.mjs
```

Or use `WEEKLY-UPDATE.bat` for automated execution.

---

## 10. Q1 QUALITY ANALYSIS

### Overall Q1 (Weeks 1-13)
- **Defect Rate:** 6.17% (goal: ≤5%)
- **Top Error:** RA (42.6% of all errors) — RS tool validator annotation
- **#2 Error:** RRC (38.6%) — wrong reason code selection
- **RA + RRC = 81% of all errors**

### Monthly Trend
| Month | Rate | Status |
|-------|------|--------|
| January | 4.4% | 🟢 Below goal |
| February | 8.1% | 🔴 Spike |
| March | 6.2% | 🟡 Recovering |

### Region Gap
- EU: 5.5% | NA: 7.8% (NA is 2.3pp higher)

---

## 11. RRC (REASON CODE) IMPROVEMENT — NA REGION

### Q1 → Week 18: **55.6% reduction**

| Period | RRC Rate |
|--------|----------|
| Q1 (Wk 1-13) | 4.07% |
| Q2 (Wk 14-18) | 1.81% |

### Week-wise NA RRC Trend
- WK11: 6.6% → WK12: 6.1% → WK13: **8.0%** (peak)
- WK14: 2.6% → WK15: 1.8% → WK16: 1.9% → WK18: **1.0%** (lowest)

---

## 12. WEEK 14 SPIKE & IMPROVEMENT ACTIONS

### Why Were Weeks 12-14 High? (7.0-7.2%)
- RA errors spiked — associates not annotating RS tool validator details
- RRC errors elevated — wrong cancel/resolve reason codes
- NA region hit 7.8% in WK14
- Root cause: New SOP updates rolled out in WK11 but associates still using old workflows

### Actions Introduced (Post Week 14)
1. **RS Tool Validator Refresher** — mandatory training on proper annotation
2. **Reason Code Decision Tree** — visual flowchart for correct code selection
3. **Daily Pre-shift Huddles** — 5-min quality focus in every shift handover
4. **1:1 Coaching for Repeated Defaulters** — targeted sessions
5. **Quality Dashboard Launch** — self-service visibility for all
6. **Weekly Error Pattern Sharing** — top 3 errors shared every Monday

### Impact Achieved (Week 15-18)
- Overall: 7.2% → 2.5% (**-65% reduction**)
- RRC in NA: 8.0% → 1.0% (**-56% reduction**)
- RA errors in WK18: **0** (zero)

---

## 13. REPEATED DEFAULTERS (Q1)

### Critical (6-7 weeks with defects)
| Associate | Weeks |
|-----------|-------|
| ctdavid | 7 |
| hemkakii | 6 |
| bondisri | 6 |
| temzjona | 6 |

### High (4 weeks): abuzars, beautwne, moizu, medaashr, menduy, srinmath, samagys, sancdodd, smadhavy, shivayvc

### Moderate (3 weeks): 23 associates

---

## 14. MANAGER PERFORMANCE (Q1)

### Needs Improvement (>7%)
| Manager | Rate |
|---------|------|
| hussm | 10.3% |
| mrinshah | 9.2% |
| mpuranik | 8.9% |
| mkumrtq | 8.8% |
| kurmagad | 8.8% |

### Best Performers (≤5%)
| Manager | Rate |
|---------|------|
| padakank | 2.0% |
| nsreerag | 3.6% |
| kampatis | 3.6% |
| augubabu | 3.9% |
| subhekum | 4.3% |

---

## 15. KEY FILES REFERENCE

| File | Purpose |
|------|---------|
| `scripts/load-all-data.mjs` | Parses all Excel sources, applies appeal override, writes audit-records.json |
| `scripts/build-static.ts` | Builds self-contained HTML dashboard with embedded data |
| `scripts/gh-deploy3.mjs` | Deploys dist/index.html to GitHub Pages |
| `data/audit-records.json` | All parsed audit records (source of truth) |
| `data/role-mapping.json` | Role assignments (admin/l5/manager) |
| `data/password-hashes.json` | SHA-256 hashed passwords |
| `dist/dashboard.html` | Built dashboard (local use) |
| `dist/index.html` | Same file deployed to GitHub Pages |
| `dist/CREDENTIALS.txt` | All login credentials |
| `docs/Q1-2026-Quality-Improvement-Report.md` | Q1 analysis report |

---

## 16. TECHNICAL NOTES

- **Framework:** Static HTML (no server needed) — all data embedded in the HTML file
- **Package type:** ES Module (`"type": "module"` in package.json)
- **Node.js path:** `C:\Users\mpuranik\nodejs` (portable install, prepend to PATH)
- **Port 3000:** Often occupied; use 3001 for Next.js if needed
- **Corporate restrictions:** No admin rights, no Python, HTA/mshta blocked
- **Excel dates:** Serial numbers requiring conversion (days since 1899-12-30)
- **Build output:** ~1.4 MB single HTML file with all data + logic embedded

---

*Document created: May 2026*
*Last updated: Week 18 data load + appeal override correction*
