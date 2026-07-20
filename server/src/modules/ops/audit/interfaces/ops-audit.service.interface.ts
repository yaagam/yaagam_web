export interface AuditLogInput {
  operatorId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

export interface IOpsAuditService {
  log(input: AuditLogInput): Promise<void>;
}
