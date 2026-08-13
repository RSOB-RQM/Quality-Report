export async function GET(): Promise<Response> {
  return new Response(
    JSON.stringify({
      user: { login: 'mpuranik', role: 'admin' },
      weeklySummary: [],
      monthlySummary: [],
      errorBreakdown: [],
      disruptionBreakdown: [],
      appealSummary: { total: 0, approved: 0, rejected: 0, pending: 0 },
      commonFindings: { findings: [] },
      errorDetails: [],
      guidanceHighlights: [],
      associateSummaries: [],
      weekSummaryTable: [],
      repeatedDefaulters: [],
      processLevelFindings: null,
      availableWeeks: [],
      availableMonths: [],
      availableRegions: [],
      allRecords: [],
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}
