'use client';

import React, { useEffect, useState, useCallback } from 'react';
import type {
  WeekAnalysis,
  ErrorCategoryBreakdown,
  DisruptionBreakdown,
  AppealSummary,
  DefectAvoidanceEntry,
} from '../../models/audit-types';
import type {
  MonthlySummary,
  CommonFindingsResult,
  ErrorDetailRecord,
  UserRole,
  AssociateSummaryRow,
  WeekSummaryTableRow,
  RepeatedDefaulter,
} from '../../models/dashboard-types';
import { DashboardLayout } from './components/DashboardLayout';
import { PerformanceSummary } from './components/PerformanceSummary';
import { TrendChart } from './components/TrendChart';
import { ErrorBreakdownChart } from './components/ErrorBreakdownChart';
import { ErrorDetailTable } from './components/ErrorDetailTable';
import { CommonFindingsPanel } from './components/CommonFindingsPanel';
import { BestPracticesPanel } from './components/BestPracticesPanel';
import { DisruptionBreakdownTable } from './components/DisruptionBreakdownTable';
import { AdminUploadPanel } from './components/AdminUploadPanel';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { EmptyState } from './components/EmptyState';
import { WeekMonthSelector } from './components/WeekMonthSelector';
import { WeekSummaryTable } from './components/WeekSummaryTable';
import { AssociateSummaryTable } from './components/AssociateSummaryTable';
import { RepeatedDefaulterPanel } from './components/RepeatedDefaulterPanel';
import { ProcessLevelFindings } from './components/ProcessLevelFindings';
import { InsightsPanel } from './components/InsightsPanel';

interface DashboardData {
  user: { login: string; role: UserRole };
  weeklySummary: WeekAnalysis[];
  monthlySummary: MonthlySummary[];
  errorBreakdown: ErrorCategoryBreakdown;
  disruptionBreakdown: DisruptionBreakdown[];
  appealSummary: AppealSummary;
  commonFindings: CommonFindingsResult;
  errorDetails: ErrorDetailRecord[];
  guidanceHighlights: DefectAvoidanceEntry[];
  associateSummaries: AssociateSummaryRow[];
  weekSummaryTable: WeekSummaryTableRow[];
  repeatedDefaulters: RepeatedDefaulter[];
  processLevelFindings: CommonFindingsResult | null;
  availableWeeks: number[];
  availableMonths: number[];
  availableRegions: string[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [weekPreset, setWeekPreset] = useState<string>('last4');
  const [initialLoad, setInitialLoad] = useState(true);
  // Admin tab: 'process' = full admin view, 'team' = manager-style filtered to admin's team
  const [adminTab, setAdminTab] = useState<'process' | 'team'>('process');

  const fetchData = useCallback(async (weeks: number[], month: number | null, teamFilter: boolean, region: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (weeks.length > 0) params.set('weeks', weeks.join(','));
      if (month !== null) params.set('month', String(month));
      if (teamFilter) params.set('teamFilter', 'true');
      if (region) params.set('region', region);
      const qs = params.toString();
      const url = qs ? `/api/dashboard?${qs}` : '/api/dashboard';
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load dashboard data (${res.status})`);
      }
      const json: DashboardData = await res.json();

      // On initial load, default to last 4 weeks
      if (initialLoad && json.availableWeeks.length > 0 && weeks.length === 0 && month === null) {
        const last4 = json.availableWeeks.slice(-4);
        setSelectedWeeks(last4);
        setInitialLoad(false);
        // Re-fetch with last 4 weeks
        const params2 = new URLSearchParams();
        params2.set('weeks', last4.join(','));
        if (teamFilter) params2.set('teamFilter', 'true');
        if (region) params2.set('region', region);
        const res2 = await fetch(`/api/dashboard?${params2.toString()}`);
        if (res2.ok) {
          const json2: DashboardData = await res2.json();
          // Preserve full availableWeeks/Months from unfiltered fetch
          json2.availableWeeks = json.availableWeeks;
          json2.availableMonths = json.availableMonths;
          setData(json2);
        } else {
          setData(json);
        }
      } else {
        if (initialLoad) setInitialLoad(false);
        setData(json);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [initialLoad]);

  const isTeamView = data?.user.role === 'admin' && adminTab === 'team';

  useEffect(() => {
    fetchData(selectedWeeks, selectedMonth, isTeamView, selectedRegion);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWeeks, selectedMonth, adminTab, selectedRegion]);

  const handleRefresh = useCallback(() => {
    fetchData(selectedWeeks, selectedMonth, isTeamView, selectedRegion);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWeeks, selectedMonth, isTeamView, selectedRegion]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={handleRefresh} />;
  if (!data) return <EmptyState />;

  const { user } = data;
  const hasData = data.weeklySummary.length > 0 || data.monthlySummary.length > 0;

  return (
    <DashboardLayout role={user.role} login={user.login}>
      {/* Admin tab switcher */}
      {user.role === 'admin' && (
        <div style={{ marginBottom: 16 }}>
          <AdminTabBar activeTab={adminTab} onTabChange={setAdminTab} />
        </div>
      )}

      {/* Week/Month Selector — shown for all roles */}
      <div style={{ marginBottom: 24 }}>
        <WeekMonthSelector
          availableWeeks={data.availableWeeks}
          availableMonths={data.availableMonths}
          selectedWeeks={selectedWeeks}
          selectedMonth={selectedMonth}
          onWeeksChange={setSelectedWeeks}
          onMonthChange={setSelectedMonth}
          weekPreset={weekPreset}
          onWeekPresetChange={setWeekPreset}
          selectedRegion={selectedRegion}
          onRegionChange={setSelectedRegion}
          availableRegions={data.availableRegions ?? []}
        />
      </div>

      {!hasData ? (
        <EmptyState />
      ) : (
        <>
          {user.role === 'admin' && adminTab === 'process' && (
            <AdminProcessView data={data} onRefresh={handleRefresh} />
          )}
          {user.role === 'admin' && adminTab === 'team' && (
            <AdminTeamView data={data} />
          )}
          {user.role === 'manager' && <ManagerDashboard data={data} />}
          {user.role === 'associate' && <AssociateDashboard data={data} />}
        </>
      )}
    </DashboardLayout>
  );
}

// =============================================================================
// Admin Tab Bar
// =============================================================================

const tabBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 0,
  borderBottom: '2px solid #e2e8f0',
};

const tabBaseStyle: React.CSSProperties = {
  padding: '10px 24px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  border: 'none',
  backgroundColor: 'transparent',
  color: '#64748b',
  borderBottom: '2px solid transparent',
  marginBottom: -2,
};

const tabActiveStyle: React.CSSProperties = {
  ...tabBaseStyle,
  color: '#1e40af',
  borderBottomColor: '#1e40af',
};

function AdminTabBar({ activeTab, onTabChange }: { activeTab: 'process' | 'team'; onTabChange: (tab: 'process' | 'team') => void }) {
  return (
    <div style={tabBarStyle} role="tablist" aria-label="Admin view toggle">
      <button
        role="tab"
        aria-selected={activeTab === 'process'}
        style={activeTab === 'process' ? tabActiveStyle : tabBaseStyle}
        onClick={() => onTabChange('process')}
      >
        Process View
      </button>
      <button
        role="tab"
        aria-selected={activeTab === 'team'}
        style={activeTab === 'team' ? tabActiveStyle : tabBaseStyle}
        onClick={() => onTabChange('team')}
      >
        Team View
      </button>
    </div>
  );
}

// =============================================================================
// Admin — Process View (full admin dashboard, all data)
// =============================================================================

function AdminProcessView({ data, onRefresh }: { data: DashboardData; onRefresh: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 1. Insights */}
      <InsightsPanel
        weeklySummary={data.weeklySummary}
        errorBreakdown={data.errorBreakdown}
        repeatedDefaulters={data.repeatedDefaulters}
      />
      {/* 2. Performance summary cards (compact) */}
      <PerformanceSummary weeklySummary={data.weeklySummary} monthlySummary={data.monthlySummary} />
      {/* 3. Week-wise summary table */}
      <WeekSummaryTable rows={data.weekSummaryTable} />
      {/* 4. Trend chart */}
      <TrendChart weeklySummary={data.weeklySummary} monthlySummary={data.monthlySummary} />
      {/* 5. Associate-wise summary table */}
      <AssociateSummaryTable summaries={data.associateSummaries} repeatedDefaulters={data.repeatedDefaulters} />
      {/* 6. Repeated defaulters */}
      <RepeatedDefaulterPanel defaulters={data.repeatedDefaulters} />
      {/* 7. Error attribute breakdown */}
      <ErrorBreakdownChart breakdown={data.errorBreakdown} />
      {/* 8. Common findings */}
      <CommonFindingsPanel findings={data.commonFindings} />
      {/* 9. Upload panel (at bottom) */}
      <AdminUploadPanel role={data.user.role} onUploadComplete={onRefresh} />
    </div>
  );
}

// =============================================================================
// Admin — Team View (manager-style, filtered to admin's own team)
// =============================================================================

function AdminTeamView({ data }: { data: DashboardData }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <InsightsPanel
        weeklySummary={data.weeklySummary}
        errorBreakdown={data.errorBreakdown}
        repeatedDefaulters={data.repeatedDefaulters}
      />
      <PerformanceSummary weeklySummary={data.weeklySummary} monthlySummary={data.monthlySummary} />
      <WeekSummaryTable rows={data.weekSummaryTable} />
      <AssociateSummaryTable summaries={data.associateSummaries} repeatedDefaulters={data.repeatedDefaulters} />
      <RepeatedDefaulterPanel defaulters={data.repeatedDefaulters} />
      <ErrorBreakdownChart breakdown={data.errorBreakdown} />
      <CommonFindingsPanel findings={data.commonFindings} />
      <RawDataNote />
    </div>
  );
}

// =============================================================================
// Manager Dashboard
// =============================================================================

function ManagerDashboard({ data }: { data: DashboardData }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 1. Insights */}
      <InsightsPanel
        weeklySummary={data.weeklySummary}
        errorBreakdown={data.errorBreakdown}
        repeatedDefaulters={data.repeatedDefaulters}
      />
      {/* 2. Performance summary cards */}
      <PerformanceSummary weeklySummary={data.weeklySummary} monthlySummary={data.monthlySummary} />
      {/* 3. Week-wise summary table */}
      <WeekSummaryTable rows={data.weekSummaryTable} />
      {/* 4. Associate-wise summary table */}
      <AssociateSummaryTable summaries={data.associateSummaries} repeatedDefaulters={data.repeatedDefaulters} />
      {/* 5. Repeated defaulters */}
      <RepeatedDefaulterPanel defaulters={data.repeatedDefaulters} />
      {/* 6. Error attribute breakdown */}
      <ErrorBreakdownChart breakdown={data.errorBreakdown} />
      {/* 7. Common findings */}
      <CommonFindingsPanel findings={data.commonFindings} />
      {/* 8. Raw data note */}
      <RawDataNote />
    </div>
  );
}

function RawDataNote() {
  return (
    <section
      style={{
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        padding: 16,
        border: '1px solid #e2e8f0',
        textAlign: 'center',
      }}
      aria-label="Raw data reference"
    >
      <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
        📋 Transaction-level detail is available in the{' '}
        <a
          href="/rawdata"
          style={{ color: '#1e40af', fontWeight: 600, textDecoration: 'none' }}
        >
          View Raw Data →
        </a>
      </p>
    </section>
  );
}

// =============================================================================
// Associate Dashboard
// =============================================================================

function AssociateDashboard({ data }: { data: DashboardData }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 1. Insights (personalized) */}
      <InsightsPanel
        weeklySummary={data.weeklySummary}
        errorBreakdown={data.errorBreakdown}
        repeatedDefaulters={data.repeatedDefaulters}
        personalized
      />
      {/* 2. Performance summary cards */}
      <PerformanceSummary weeklySummary={data.weeklySummary} monthlySummary={data.monthlySummary} />
      {/* 3. Week-wise summary table */}
      <WeekSummaryTable rows={data.weekSummaryTable} />
      {/* 4. Trend chart */}
      <TrendChart weeklySummary={data.weeklySummary} monthlySummary={data.monthlySummary} />
      {/* 5. Error attribute breakdown */}
      <ErrorBreakdownChart breakdown={data.errorBreakdown} />
      {/* 6. Process vs Individual findings comparison */}
      {data.processLevelFindings && (
        <ProcessLevelFindings
          processFindings={data.processLevelFindings}
          individualFindings={data.commonFindings}
        />
      )}
      {/* 7. Best practices */}
      <BestPracticesPanel guidance={data.guidanceHighlights} />
      {/* 8. Error detail table (at bottom) */}
      <ErrorDetailTable records={data.errorDetails} />
    </div>
  );
}
