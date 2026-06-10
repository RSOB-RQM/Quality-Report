# RS Site Utilization Deep Dive
## May 2026 Update (Weeks 17-18)

---

### About Site Utilization

Site Utilization measures how effectively loads (VRIDs) are being filled before dispatch. It is calculated as the ratio of actual freight loaded (fill_cube_num) against the planned capacity (target_cube_den). A load dispatched below 60% utilization is classified as **underutilized** — meaning the truck departed without sufficient freight, resulting in wasted capacity and avoidable cost.

This analysis focuses exclusively on loads created through **Flintstones (FMC)** and **CASA_UI** platforms — the two platforms operated by our team. Data covers Weeks 17-18 (Week 19 excluded due to partial data — single day only).

### How is Utilization Calculated?

**= (fill_cube_num / target_cube_den) × 100 = XX%**

- **≥60%** = Properly utilized (acceptable)
- **<60%** = Underutilized (needs correction)

---

### Problem Statement

Across Weeks 17-18, **a significant portion of dispatched loads are leaving underutilized** (below 60% fill). The network average sits at ~51% — itself below the proper utilization threshold. CASA-created loads are the primary contributor, averaging just 29.8% utilization compared to FMC at 60.5%.

Multiple high-volume sites are consistently dispatching loads at 25-35% fill rates, indicating systemic issues in load creation timing, volume availability, and platform behavior that need structured intervention.

---

### What are we planning to achieve?

Identify sites consistently dispatching underutilized loads, determine root causes through structured deep dives, and implement corrective actions to bring site-level utilization above the 60% threshold. The goal is to build a **repeatable mechanism** — not a one-time fix — that tracks, corrects, and sustains improvement across the network.

**Targets:**
- Reduce underutilized load count from 59.9% → below 45% within 12 weeks
- Bring top 5 priority sites above 40% utilization within 4 weeks
- Establish weekly tracking cadence with site POCs for sustained improvement

---

### Performance Update (Weeks 17-18, 2026)

| Metric | Value |
|--------|-------|
| Metric | Value |
|--------|-------|
| Total Active Loads Analyzed | 23,922 |
| Overall Utilization | ~51% |
| FMC Utilization | 60.5% (16,500+ loads) |
| CASA Utilization | 29.8% (6,900+ loads) |
| Sites Below 60% (20+ loads) | 230+ |
| Sites Below 40% (Severely Underutilized) | 90+ |

**Key Observation:** FMC loads are at the proper utilization threshold (60.5%). CASA loads at 29.8% are the primary drag — across every adhoc bucket, CASA underperforms FMC by 20-33 percentage points, indicating loads are being created before sufficient volume accumulates.

---

### Top 5 Priority Sites (Immediate Deep Dive)

#### 1. LGA9 — 26.4% Utilization (175 loads)

| Week 17 | Week 18 | Trend |
|---------|---------|-------|
| 23.6% | 29.1% | ↑ Slight improvement |

- **CASA:** 20.6% (43 loads) | **FMC:** 28.4% (132 loads)
- **Observation:** Both platforms underperforming — site-level issue, not just CASA
- **Top Buckets:** Not Adhoc (25.2%, 98 loads), Disruption Mgmt (35.3%, 23 loads), FC Underutilized (13.2%, 22 loads)
- **Hypothesis:** Low freight availability at origin + loads being created regardless

#### 2. LGB3 — 29.0% Utilization (202 loads)

| Week 17 | Week 18 | Trend |
|---------|---------|-------|
| 25.9% | 31.5% | ↑ Improving |

- **CASA:** 16.5% (79 loads) | **FMC:** 37.2% (123 loads)
- **Observation:** CASA loads at 16.5% — nearly empty trucks being dispatched via manual creation
- **Top Buckets:** FC Underutilized (11.1%, 51 loads), Scheduling/Planning (22.3%, 31 loads), Not Adhoc (55.9%, 31 loads)
- **Hypothesis:** Premature CASA load creation + scheduling timing mismatch

#### 3. SCK6 — 32.1% Utilization (213 loads)

| Week 17 | Week 18 | Trend |
|---------|---------|-------|
| 35.1% | 30.6% | ↓ Declining |

- **CASA:** 16.8% (114 loads) | **FMC:** 50.3% (99 loads)
- **Observation:** CASA is 53% of this site's loads but running at 16.8% — FMC is fine at 50.3%
- **Top Buckets:** FC Underutilized (13.9%, 65 loads), Not Adhoc (68.3%, 37 loads), Scheduling/Planning (22.0%, 27 loads)
- **Hypothesis:** CASA creating loads tagged "FC Underutilized" when no freight exists

#### 4. BDL3 — 32.8% Utilization (183 loads)

| Week 17 | Week 18 | Trend |
|---------|---------|-------|
| 38.4% | 29.6% | ↓ Declining |

- **CASA:** 10.8% (23 loads) | **FMC:** 36.2% (160 loads)
- **Observation:** CASA at 10.8% (worst of any major site), but FMC also underperforming at 36.2%
- **Top Buckets:** Not Adhoc (37.0%, 110 loads), FC Underutilized (13.7%, 17 loads), Not Enough Volume (33.4%, 15 loads)
- **Hypothesis:** Structural volume shortage at this origin — loads created without available freight

#### 5. MTN1 — 34.5% Utilization (175 loads)

| Week 17 | Week 18 | Trend |
|---------|---------|-------|
| 24.0% | 39.7% | ↑ Improving |

- **CASA:** 18.8% (67 loads) | **FMC:** 44.0% (108 loads)
- **Observation:** Improving trend but still well below threshold. CASA at 18.8% dragging overall.
- **Top Buckets:** FC Underutilized (16.8%, 50 loads), Disruption Mgmt (41.4%, 38 loads), Not Adhoc (65.3%, 35 loads)
- **Hypothesis:** FC Underutilized bucket on CASA = loads created for "spare capacity" that doesn't translate to actual freight

---

### Top Root Causes Identified

| Root Cause | Indicator | Impact |
|------------|-----------|--------|
| **Premature Load Creation (CASA)** | CASA + FC Underutilized + fill <20% | ~35% of underutilized loads |
| **Insufficient Volume at Origin** | Not Enough Volume By TRT + low package count | ~20% of underutilized loads |
| **Scheduling/Timing Mismatch** | Scheduling/Planning bucket + late creation | ~15% of underutilized loads |
| **Disruption Spillover** | DM bucket + low fill (partially expected) | ~10% of underutilized loads |

---

### RS Actions (Planned)

1. **Site POC Engagement (Week 1-2):** Reaching out to top 5 site POCs with site-specific utilization data, requesting observations on why loads are dispatching underutilized and what local factors contribute.

2. **CASA Load Creation Review (Week 2-3):** Analyzing CASA creation patterns — identifying if loads tagged "FC Underutilized" should have been created at all given available freight at time of creation. Proposing minimum fill guardrails.

3. **Bi-weekly Site Syncs (Ongoing):** Establishing 15-min bi-weekly connects with priority site POCs to track progress, share observations, and implement corrective actions.

4. **Weekly Tracking Mechanism (Ongoing):** Building a weekly site-level utilization tracker to monitor trends, flag declining sites, and report progress to leadership.

5. **Monthly Leadership Update:** Providing monthly flash updates with trend data, actions taken, and improvement evidence — similar to DEA reporting cadence.

---

### Appendix

#### Platform Comparison

| Platform | Loads | Utilization | Status |
|----------|-------|-------------|--------|
| Flintstones (FMC) | 17,882 | 60.5% | At threshold |
| CASA_UI | 7,610 | 29.8% | Critical — primary drag |

#### Adhoc Bucket Performance (Sorted by Utilization)

| Bucket | Utilization | Loads | Impact |
|--------|-------------|-------|--------|
| FC Underutilized | 18.8% | 2,421 | Critical |
| Scheduling/Planning | 29.5% | 1,187 | High |
| GTWY Underutilized | 31.4% | 178 | High |
| Rolled Freight | 34.2% | 156 | High |
| Not Enough Volume By TRT | 35.6% | 1,342 | High |
| Future Volume | 39.5% | 126 | Medium |
| New Lane CPT | 39.9% | 241 | Medium |
| SC Underutilized | 46.3% | 519 | Medium |
| Inbound Volume Not Available | 46.5% | 1,508 | Medium |
| Forecast UB | 50.3% | 1,683 | Medium |
| Other Cancel | 56.4% | 1,245 | Low |
| Disruption Management | 59.7% | 3,123 | Low |
| Not Adhoc | 62.9% | 10,109 | Acceptable |

#### Weekly Trend

| Week | Utilization | Loads | Trend |
|------|-------------|-------|-------|
| Week 17 | 51.7% | 11,037 | Baseline |
| Week 18 | 51.1% | 12,885 | ↓ -0.6pp |

---

*Document Owner: [Your Name] | Review Cadence: Monthly | Next Update: Week 23*
*Scope: Flintstones (FMC) & CASA_UI platforms only | Active loads (is_active = 1)*
*Note: Week 19 excluded from analysis — partial data (single day only)*
