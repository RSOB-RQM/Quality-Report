# Quality Performance Dashboard — Preview

---

## 🔹 ASSOCIATE VIEW — Login: `johndoe`

### Performance Summary (2026)

| Period | Total Audits | Defects | Defect Rate | Total Errors |
|--------|-------------|---------|-------------|--------------|
| **January** | 42 | 4 | 9.52% | 6 |
| **February** | 38 | 3 | 7.89% | 4 |
| **March** | 35 | 3 | 8.57% | 5 |
| **April** | 30 | 1 | **3.33%** ✅ | 2 |
| **YTD Total** | **145** | **11** | **7.59%** | **17** |

### Weekly Trend (April — Wk 13–16)

| Week | Audits | Defects | Defect Rate | Trend |
|------|--------|---------|-------------|-------|
| Wk 13 | 8 | 1 | 12.50% | 🔴 |
| Wk 14 | 8 | 0 | 0.00% | 🟢 |
| Wk 15 | 7 | 0 | 0.00% | 🟢 |
| Wk 16 | 7 | 0 | **0.00%** | 🟢 |

### Error Attribute Breakdown (YTD)

| Attribute | What It Checks | Errors | % of Total | Bar |
|-----------|---------------|--------|-----------|-----|
| **RRC** — Right Reason Code | Was the right reason code used? | 8 | 47.1% | ████████░░ |
| **ADM** — Decision Making | Was SW followed for add/cancel/deny decision? | 4 | 23.5% | ████░░░░░░ |
| **RA** — Right Action | Was the right action taken per SW outcome? | 3 | 17.6% | ███░░░░░░░ |
| **ACC** — Communication | Was required info shared with site? | 1 | 5.9% | █░░░░░░░░░ |
| **RV** — Necessary Checks | Were all necessary checks done? | 1 | 5.9% | █░░░░░░░░░ |

### My Error Detail Log (2026)

| Week | Date | Disruption Type | Failed Attribute(s) | Auditor Finding |
|------|------|----------------|---------------------|-----------------|
| Wk 16 | — | — | — | ✅ No errors this week |
| Wk 15 | — | — | — | ✅ No errors this week |
| Wk 13 | 2026-03-24 | Cancel Validation | RRC | Wrong reason code selected — should have used "Carrier Initiated" |
| Wk 11 | 2026-03-10 | ADHOC Validation | ADM, RRC | Incorrect decision on BID approval; Wrong sub-reason code |
| Wk 9 | 2026-02-25 | Cancel Validation | RA | Did not follow SOP step 4 — missed annotation |
| Wk 7 | 2026-02-11 | ADHOC Validation | RRC | Used outdated RS Validator tool version |
| Wk 4 | 2026-01-21 | Cancel Validation | RRC, ACC | Wrong reason code; Incomplete communication to carrier |
| Wk 2 | 2026-01-07 | ADHOC Validation | ADM | Approved BID without required validation |

### Common Findings (Top 3)

| # | Finding | Count |
|---|---------|-------|
| 1 | Wrong reason code selected | 5 |
| 2 | Incorrect BID approval decision | 2 |
| 3 | Missing SOP annotation | 2 |

### Best Practices for You

Based on your error pattern (RRC is 47% of your errors):

> **🎯 Reason Code Selection**
> - Always cross-check the disruption type before selecting the reason code
> - Refer to the updated SOP quick-reference card for CARs vs NON-CARs mapping
> - Use the Hawkeye script flag as a second check before submission

> **🎯 Decision Making (ADM)**
> - Verify BID eligibility criteria before approval
> - When in doubt, escalate rather than approve

### Appeal Summary

| Metric | Value |
|--------|-------|
| Total Appeals | 2 |
| Accepted | 1 |
| Not Accepted | 1 |
| Acceptance Rate | 50.00% |


---

## 🔹 MANAGER VIEW — Login: `kampatis`

### Team Performance Summary (2026)

| Period | Total Audits | Defects | Defect Rate | Total Errors |
|--------|-------------|---------|-------------|--------------|
| **January** | 228 | 18 | 7.89% | 26 |
| **February** | 198 | 13 | 6.57% | 19 |
| **March** | 183 | 16 | 8.74% | 22 |
| **April** | 157 | 8 | **5.10%** | 12 |
| **YTD Total** | **766** | **55** | **7.18%** | **79** |

### Team Weekly Trend (April — Wk 13–16)

| Week | Audits | Defects | Defect Rate | Trend |
|------|--------|---------|-------------|-------|
| Wk 13 | 45 | 4 | 8.89% | 🔴 |
| Wk 14 | 38 | 2 | 5.26% | 🟡 |
| Wk 15 | 38 | 1 | 2.63% | 🟢 |
| Wk 16 | 36 | 1 | **2.78%** | 🟢 |

### Associate-Level Drill Down

| Associate | Audits (YTD) | Defects | Defect Rate | Top Error | Trend |
|-----------|-------------|---------|-------------|-----------|-------|
| johndoe | 145 | 11 | 7.59% | RRC (47%) | 📉 Improving |
| janedoe | 152 | 9 | 5.92% | ADM (44%) | 📉 Improving |
| smithr | 138 | 12 | 8.70% | RRC (50%) | 📈 Needs attention |
| kumarv | 168 | 10 | 5.95% | RA (40%) | ➡️ Stable |
| pateln | 163 | 13 | 7.98% | RRC (54%) | 📉 Improving |

### Team Error Attribute Breakdown (YTD)

| Attribute | What It Checks | Errors | % of Total | Bar |
|-----------|---------------|--------|-----------|-----|
| **RRC** — Right Reason Code | Was the right reason code used? | 38 | 48.1% | █████████░ |
| **ADM** — Decision Making | Was SW followed for add/cancel/deny decision? | 18 | 22.8% | ████░░░░░░ |
| **RA** — Right Action | Was the right action taken per SW outcome? | 12 | 15.2% | ███░░░░░░░ |
| **ACC** — Communication | Was required info shared with site? | 6 | 7.6% | █░░░░░░░░░ |
| **RV** — Necessary Checks | Were all necessary checks done? | 5 | 6.3% | █░░░░░░░░░ |

### Week-Over-Week Comparison (Wk 15 vs Wk 16)

| Metric | Wk 15 | Wk 16 | Delta |
|--------|-------|-------|-------|
| Total Audits | 38 | 36 | -2 |
| Total Defects | 1 | 1 | 0 |
| Defect Rate | 2.63% | 2.78% | +0.15 pp ⚠️ |
| Top Error | RRC | RRC | — |

### Disruption Type Breakdown (YTD)

| Disruption Type | Sub Type | Defects | Error Count |
|----------------|----------|---------|-------------|
| Cancel Validation | CARs | 22 | 31 |
| ADHOC Validation | NON-CARs | 18 | 28 |
| Cancel Validation | NON-CARs | 10 | 14 |
| ADHOC Validation | CARs | 5 | 6 |

### Team Appeal Summary

| Metric | Value |
|--------|-------|
| Total Appeals | 12 |
| Accepted | 5 |
| Not Accepted | 6 |
| Pending | 1 |
| Acceptance Rate | 41.67% |

---

> **Note:** This is a mock preview using sample data based on the actual RQM data structure and metrics from the 2026 goals document. Real data will populate once the dashboard is built and the Excel upload is configured.
