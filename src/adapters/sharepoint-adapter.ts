import type { AuditRecord } from '../models/audit-types';
import type { EmailAutomationEnvConfig } from '../config/env';

// =============================================================================
// SharePoint Adapter Error Types
// =============================================================================

export interface SharePointError {
  type: 'auth_failure' | 'network_error' | 'parse_error';
  message: string;
  url?: string;
  statusCode?: number;
}

// =============================================================================
// SharePointAdapter Interface
// =============================================================================

export interface SharePointAdapter {
  fetchAuditRecords(): Promise<AuditRecord[]>;
}

// =============================================================================
// Column-to-Field Mapping
// =============================================================================

/**
 * Maps SharePoint list item field names to AuditRecord properties.
 * SharePoint REST API returns items with internal column names.
 */
function parseSharePointItem(item: Record<string, unknown>): AuditRecord {
  return {
    team: String(item.Team ?? ''),
    region: String(item.Region ?? ''),
    disruptionType: String(item.DisruptionType ?? ''),
    subTransactionType: String(item.SubTransactionType ?? ''),
    qaMonitoringDate: String(item.QAMonitoringDate ?? ''),
    transactionDate: String(item.TransactionDate ?? ''),
    associateLogin: String(item.Alogin ?? ''),
    associateStatus: String(item.AssociateStatus ?? ''),
    supervisorLogin: String(item.SupervisorLogin ?? ''),
    supervisorEmail: String(item.SupervisorEmail ?? ''),
    transactionWeek: Number(item.TransactionWeek ?? 0),
    subDisruptionType: String(item.SubDisruptionType ?? ''),

    // Quality Audit Attributes
    adm: String(item.ADM ?? ''),
    admFinding: String(item.ADMFinding ?? ''),
    comments1: String(item.Comments1 ?? ''),
    ra: String(item.RA ?? ''),
    raFinding: String(item.RAFinding ?? ''),
    comments2: String(item.Comments2 ?? ''),
    rrc: String(item.RRC ?? ''),
    rrcFinding: String(item.RRCFinding ?? ''),
    comments3: String(item.Comments3 ?? ''),
    acc: String(item.ACC ?? ''),
    accFinding: String(item.ACCFinding ?? ''),
    comments4: String(item.Comments4 ?? ''),
    rv: String(item.RV ?? ''),
    rvFinding: String(item.RVFinding ?? ''),
    comments5: String(item.Comments5 ?? ''),

    // Appeal Fields
    spResponse: String(item.SpResponse ?? ''),
    spComment: String(item.SPComment ?? ''),
    spocLogin: String(item.SPOCLogin ?? ''),
    spocResponse: String(item.SPOCResponse ?? ''),
    spocComment: String(item.SPOCComment ?? ''),
    reAppealFlag: String(item.ReAppealFlag ?? ''),
    reAppealComment: String(item.ReAppealComment ?? ''),
    appealLeadLogin: String(item.AppealLeadLogin ?? ''),
    appealLeadDecision: String(item.AppealLeadDecision ?? ''),
    appealLeadComment: String(item.AppealLeadComment ?? ''),

    // Defect Flag
    defectFlag: item.DefectFlag === true || item.DefectFlag === 'TRUE' || item.DefectFlag === 'true',
  };
}

// =============================================================================
// Concrete Implementation
// =============================================================================

export class SharePointAdapterImpl implements SharePointAdapter {
  private readonly siteUrl: string;
  private readonly listId: string;
  private readonly accessToken: string;

  constructor(config: Pick<EmailAutomationEnvConfig, 'SHAREPOINT_SITE_URL' | 'SHAREPOINT_LIST_ID' | 'SHAREPOINT_ACCESS_TOKEN'>) {
    this.siteUrl = config.SHAREPOINT_SITE_URL;
    this.listId = config.SHAREPOINT_LIST_ID;
    this.accessToken = config.SHAREPOINT_ACCESS_TOKEN;
  }

  /**
   * Fetches audit records from the SharePoint list, parses them into
   * AuditRecord objects, and filters for team === "RSOB".
   */
  async fetchAuditRecords(): Promise<AuditRecord[]> {
    const url = `${this.siteUrl}/_api/web/lists(guid'${this.listId}')/items`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: 'application/json;odata=verbose',
        },
      });
    } catch (err) {
      throw {
        type: 'network_error',
        message: `Failed to connect to SharePoint: ${err instanceof Error ? err.message : String(err)}`,
        url,
      } as SharePointError;
    }

    if (response.status === 401 || response.status === 403) {
      throw {
        type: 'auth_failure',
        message: `SharePoint authentication failed: ${response.status} ${response.statusText}`,
        statusCode: response.status,
      } as SharePointError;
    }

    if (!response.ok) {
      throw {
        type: 'network_error',
        message: `SharePoint API error: ${response.status} ${response.statusText}`,
        url,
        statusCode: response.status,
      } as SharePointError;
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch (err) {
      throw {
        type: 'parse_error',
        message: `Failed to parse SharePoint response as JSON: ${err instanceof Error ? err.message : String(err)}`,
      } as SharePointError;
    }

    let items: Record<string, unknown>[];
    try {
      const body = data as Record<string, unknown>;
      const d = body.d as Record<string, unknown> | undefined;
      if (d && Array.isArray(d.results)) {
        items = d.results as Record<string, unknown>[];
      } else if (Array.isArray((body as Record<string, unknown>).value)) {
        items = (body as Record<string, unknown>).value as Record<string, unknown>[];
      } else {
        throw new Error('Unexpected response structure: missing d.results or value array');
      }
    } catch (err) {
      throw {
        type: 'parse_error',
        message: `Failed to extract items from SharePoint response: ${err instanceof Error ? err.message : String(err)}`,
      } as SharePointError;
    }

    const records = items.map(parseSharePointItem);

    // Filter for RSOB team only
    return records.filter((record) => record.team === 'RSOB');
  }
}

/**
 * Parses a raw SharePoint list item into an AuditRecord.
 * Exported for testing purposes.
 */
export { parseSharePointItem };
