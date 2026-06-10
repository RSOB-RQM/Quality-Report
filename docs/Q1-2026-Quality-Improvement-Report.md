# Q1 2026 — Quality Improvement Report
## RSOB Process — NA & EU

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Audits** | 5,236 |
| **Total Defects** | 323 |
| **Q1 Defect Rate** | 6.17% |
| **Goal** | ≤5% |
| **Gap to Goal** | 1.17% |

**Key Insight:** Q1 defect rate of 6.17% is above the 5% target. January started strong at 4.4%, but February spiked to 8.1% before partially recovering to 6.2% in March. The process needs focused intervention on the top 2 error attributes (RA and RRC) which account for **81% of all errors**.

---

## Monthly Trend

| Month | Audits | Defects | Defect Rate | Status |
|-------|--------|---------|-------------|--------|
| January | 1,917 | 85 | 4.4% | 🟢 Below goal |
| February | 1,714 | 139 | 8.1% | 🔴 Above goal |
| March | 1,605 | 99 | 6.2% | 🟡 Improving but above goal |

**Trajectory:** February saw a significant spike (+3.7pp from January). March showed recovery (-1.9pp) but still above the 5% target.

---

## Region Performance

| Region | Audits | Defects | Rate | Status |
|--------|--------|---------|------|--------|
| EU | 3,639 | 199 | 5.5% | 🟡 Slightly above goal |
| NA | 1,597 | 124 | 7.8% | 🔴 Needs attention |

**Action:** NA region is 2.3pp higher than EU. Focused coaching needed for NA teams.

---

## Error Attribute Breakdown

| Attribute | Full Name | Errors | % of Total | Priority |
|-----------|-----------|--------|------------|----------|
| **RA** | SW Adherence - Right Action | 138 | 42.6% | 🔴 Critical |
| **RRC** | Right Reason Code | 125 | 38.6% | 🔴 Critical |
| **ADM** | Associate Decision Making | 42 | 13.0% | 🟡 Medium |
| **RV** | Required Validation | 10 | 3.1% | 🟢 Low |
| **ACC** | Accurate & Complete Communication | 9 | 2.8% | 🟢 Low |

**Key Takeaway:** RA + RRC = **81.2% of all errors**. Fixing these two attributes alone would bring the defect rate close to the 5% goal.

---

## Top Findings (Root Causes)

| # | Finding | Count | Attribute |
|---|---------|-------|-----------|
| 1 | Should have annotated details of RS tool validator | 61 | RA |
| 2 | Should have selected correct reason code while resolving Case | 84 | RRC |
| 3 | Should have selected correct cancel reason code while actioning on Case | 33 | RRC |
| 4 | Others (unclassified) | 26 | RA |
| 5 | Should've used the recent RS validator tool version | 16 | RA |
| 6 | Should have utilized RS validator tool | 16 | RA |
| 7 | Should have transferred the case to correct queue | 8 | ADM |
| 8 | Should have followed SW under special case guideline | 7 | ADM |

---

## Improvement Actions (Recommended)

### 🔴 Priority 1: RA (Right Action) — 42.6% of errors

**Root Cause:** Associates not annotating RS tool validator details and not using the latest validator tool version.

**Actions:**
1. **RS Tool Validator Refresher Training** — Mandatory session for all associates on proper annotation of RS tool validator details
2. **Tool Version Compliance Check** — Weekly audit to ensure associates are using the latest RS validator tool version
3. **Quick Reference Card** — Create a 1-page visual guide showing correct RS tool annotation steps
4. **Buddy System** — Pair repeated defaulters with top performers for 2 weeks

### 🔴 Priority 2: RRC (Right Reason Code) — 38.6% of errors

**Root Cause:** Incorrect reason code selection during case resolution and cancellation.

**Actions:**
1. **Reason Code Decision Tree** — Create a visual flowchart mapping disruption types to correct reason codes
2. **Pre-shift Huddle Focus** — Dedicate 5 minutes in daily huddles to review common reason code mistakes
3. **System Enhancement Request** — Explore if reason code dropdown can be filtered based on disruption type to reduce selection errors
4. **Weekly Quiz** — Short 5-question quiz on reason code selection scenarios

### 🟡 Priority 3: ADM (Decision Making) — 13.0% of errors

**Root Cause:** Incorrect queue transfers and not following SW under special case guidelines.

**Actions:**
1. **Case Routing SOP Review** — Refresh training on correct queue transfer logic
2. **Special Case Scenarios Workshop** — Monthly session covering edge cases (TR, ACC, CORR, CC, post-CPT)

---

## Repeated Defaulters — Coaching Plan

### Critical (6-7 weeks with defects in Q1):

| Associate | Weeks with Defects | Recommended Action |
|-----------|-------------------|-------------------|
| ctdavid | 7 | Formal PIP + daily quality check |
| hemkakii | 6 | Intensive 1:1 coaching + side-by-side |
| bondisri | 6 | Intensive 1:1 coaching + side-by-side |
| temzjona | 6 | Intensive 1:1 coaching + side-by-side |

### High (4 weeks with defects):

| Associate | Weeks with Defects | Recommended Action |
|-----------|-------------------|-------------------|
| abuzars | 4 | Weekly coaching + error review |
| beautwne | 4 | Weekly coaching + error review |
| moizu | 4 | Weekly coaching + error review |
| medaashr | 4 | Weekly coaching + error review |
| menduy | 4 | Weekly coaching + error review |
| srinmath | 4 | Weekly coaching + error review |
| samagys | 4 | Weekly coaching + error review |
| sancdodd | 4 | Weekly coaching + error review |
| smadhavy | 4 | Weekly coaching + error review |
| shivayvc | 4 | Weekly coaching + error review |

### Moderate (3 weeks with defects): 23 associates
- Targeted feedback + monitor in Q2

---

## Manager Performance

### Needs Improvement (>7% defect rate):

| Manager | Audits | Defects | Rate | Action |
|---------|--------|---------|------|--------|
| hussm | 233 | 24 | 10.3% | 🔴 Immediate coaching plan needed |
| mrinshah | 272 | 25 | 9.2% | 🔴 Focus on RA/RRC training |
| mpuranik | 237 | 21 | 8.9% | 🟡 Self-improvement focus |
| mkumrtq | 250 | 22 | 8.8% | 🔴 Team-level intervention |
| kurmagad | 228 | 20 | 8.8% | 🔴 Team-level intervention |
| nmmylava | 244 | 19 | 7.8% | 🟡 Monitor closely |

### Best Performers (≤5% defect rate):

| Manager | Audits | Defects | Rate |
|---------|--------|---------|------|
| padakank | 50 | 1 | 2.0% |
| nsreerag | 279 | 10 | 3.6% |
| kampatis | 307 | 11 | 3.6% |
| augubabu | 229 | 9 | 3.9% |
| subhekum | 416 | 18 | 4.3% |
| bossayan | 297 | 13 | 4.4% |
| aksjais | 314 | 14 | 4.5% |
| ahujadiv | 267 | 13 | 4.9% |

**Best Practice Sharing:** Arrange knowledge-sharing sessions where top-performing managers (nsreerag, kampatis, augubabu) share their coaching methods with underperforming teams.

---

## Q2 Targets & Milestones

| Milestone | Target | Timeline |
|-----------|--------|----------|
| Overall defect rate | ≤5.0% | End of Q2 (Week 26) |
| RA errors reduction | -30% (from 138 to ≤97) | By Week 20 |
| RRC errors reduction | -25% (from 125 to ≤94) | By Week 22 |
| Repeated defaulters | Reduce from 37 to ≤15 | By Week 24 |
| NA region rate | ≤6.0% (from 7.8%) | By Week 22 |

---

## Weekly Governance Cadence

| Day | Activity | Owner |
|-----|----------|-------|
| Monday | Review previous week's defect data | Process Lead |
| Tuesday | 1:1 coaching for repeated defaulters | Managers |
| Wednesday | Team huddle — error pattern review | Managers |
| Thursday | Best practice sharing session | Top performers |
| Friday | Weekly quality scorecard publish | Process Lead |

---

## Summary

Q1 ended at **6.17%** against a **5% goal**. The gap is addressable — 81% of errors come from just 2 attributes (RA and RRC) with clear, actionable root causes. With focused training on RS tool annotation and reason code selection, combined with targeted coaching for 37 repeated defaulters, the process can achieve the 5% target by mid-Q2.

---
*Report generated: May 2026 | Data source: RQM Audit Records (Weeks 1-13)*
