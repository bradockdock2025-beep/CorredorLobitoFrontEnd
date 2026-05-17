export type Role =
  | 'admin'
  | 'state' | 'staff' | 'specialist'
  | 'producer' | 'buyer' | 'operator' | 'customs'
  | 'analyst' | 'compliance';

// ── Fase 3A — Analytics types ──────────────────────────────────────

export interface DashboardOverview {
  companies:    Record<string, number>;
  products:     Record<string, number>;
  orders:       Record<string, number>;
  transactions: Record<string, number>;
  shipments:    Record<string, number>;
  reports:      Record<string, number>;
  auditLogs:    { total: number };
  revenue:      { totalCompleted: number; completedCount: number; currency: string };
}

export interface DashboardMetrics {
  generatedAt: string;
  periods:     { last7Days: string; last30Days: string };
  companies:   { total: number; active: number; pending: number; approvalRate: string };
  products:    { total: number; published: number; publishRate: string };
  orders:      { total: number; paid: number; blocked: number; last30Days: number };
  transactions:{ total: number; blocked: number; last30Days: number };
  shipments:   { total: number; approved: number; held: number; approvalRate: string };
  revenue:     {
    allTime:    { total: number; average: number; max: number; min: number; count: number };
    last30Days: { total: number; count: number };
    currency:   string;
  };
  auditActivity: { last7Days: number };
}

export interface RevenueByCountry  { country: string; total: number; count: number; }
export interface RevenueTopProduct { name: string; category: string; total: number; units: number; }
export interface RevenueMonthly    { month: string; total: number; count: number; }

export interface RevenueAnalytics {
  currency:    string;
  allTime:     { total: number; count: number };
  byCountry:   RevenueByCountry[];
  topProducts: RevenueTopProduct[];
  monthly:     RevenueMonthly[];
}

export interface LogisticsPerformance {
  shipments: {
    total:        number;
    byStatus:     Record<string, number>;
    approvalRate: string;
  };
  customs: {
    total:        number;
    approved:     number;
    rejected:     number;
    held:         number;
    pending:      number;
    approvalRate: string;
  };
  topRoutes: Array<{ route: string; count: number }>;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ComplianceScore {
  generatedAt:  string;
  overallScore: number;
  riskLevel:    RiskLevel;
  scores: {
    companies:    { score: number; suspended: number; total: number };
    orders:       { score: number; blocked: number; cancelled: number; total: number };
    transactions: { score: number; blocked: number; total: number };
    shipments:    { score: number; held: number; rejected: number; total: number };
  };
  auditActivity: { last30Days: number; blockedActions30d: number; alertRate: string };
}

export type LicenseStatus =
  | 'pending' | 'under_review' | 'active' | 'rejected' | 'suspended';

export type ProductStatus =
  | 'draft' | 'pending_review' | 'staff_validated' | 'published_official' | 'suspended' | 'rejected';

export type PriceProposalStatus =
  | 'draft' | 'submitted' | 'approved' | 'rejected';

export type OrderStatus =
  | 'draft' | 'confirmed' | 'paid' | 'blocked' | 'cancelled';

export type TransactionStatus =
  | 'completed' | 'blocked' | 'cancelled' | 'refunded' | 'pending';

export type PaymentMethod =
  | 'bank_transfer' | 'cash' | 'credit_card' | 'letter_of_credit' | 'other';

export type ReportStatus = 'draft' | 'submitted' | 'published';

export type ReportType = 'operational' | 'fiscal' | 'strategic' | 'compliance';

export type TargetAudience = 'public' | 'government' | 'internal';

export type ShipmentStatus =
  | 'created' | 'in_transit' | 'at_border'
  | 'customs_approved' | 'customs_rejected' | 'held' | 'delivered';

export type CompanyCountry =
  | 'angola' | 'zambia' | 'drc' | 'tanzania' | 'zimbabwe' | 'mozambique';

export type CompanyType =
  | 'importer' | 'exporter' | 'mixed' | 'producer' | 'logistics';

export type TicketStatus =
  | 'open' | 'in_progress' | 'resolved' | 'escalated' | 'closed';

export type TicketType =
  | 'technical' | 'licensing' | 'billing' | 'compliance' | 'other';

export type DocumentStatus = 'pending' | 'accepted' | 'rejected';

export type DocumentEntityType = 'company' | 'product' | 'shipment' | 'order' | 'report';

export type DocumentType =
  | 'certidao_comercial' | 'certidao_fiscal' | 'alvara_actividade'
  | 'identificacao_representante' | 'comprovativo_morada'
  | 'estatutos' | 'licenca_importacao_exportacao'
  | 'ficha_tecnica_produto' | 'certificado_qualidade' | 'certificado_origem_produto'
  | 'fatura_comercial_embarque' | 'manifesto_carga' | 'certificado_origem_embarque'
  | 'guia_transporte' | 'apolice_seguro' | 'declaracao_aduaneira'
  | 'outro';

export interface Document {
  id:               string;
  cd:               string;
  entityType:       DocumentEntityType;
  entityId:         string;
  type:             DocumentType;
  name:             string;
  fileName:         string;
  mimeType:         string;
  sizeBytes:        number;
  storageUrl:       string;
  storagePath:      string;
  uploadedById:     string;
  status:           DocumentStatus;
  rejectedReason:   string | null;
  validatedById:    string | null;
  validatedAt:      string | null;
  createdAt:        string;
  updatedAt?:       string;
  uploadedBy?:      { id: string; fullName: string; role: string };
  validatedBy?:     { id: string; fullName: string; role: string } | null;
}

export interface PdfDownloadResponse {
  signedUrl: string;
  fileName:  string;
  expiresIn: number;
}

export interface AuthUser {
  id:               string;
  cd?:              string;
  email:            string;
  role:             Role;
  fullName:         string;
  phone?:           string | null;
  status?:          string;
  companyId?:       string | null;
  twoFactorEnabled?: boolean;
  lastLoginAt?:     string | null;
  company?:         { id: string; name: string; licenseStatus: string } | null;
}

export interface DocumentationValidation {
  validatedAt?:  string;
  validatedBy?:  string;
  result:        'approved' | 'rejected';
  notes:         string;
}

export interface Company {
  id:                       string;
  cd:                       string;
  name:                     string;
  country:                  CompanyCountry;
  companyType:              CompanyType | null;
  contactEmail:             string;
  contactPhone:             string | null;
  address:                  string | null;
  licenseStatus:            LicenseStatus;
  licenseNumber:            string | null;
  licenseExpiresAt:         string | null;
  licenseDocumentUrl:       string | null;
  verifiedByState:          boolean;
  documentationValidation:  DocumentationValidation | null;
  rejectionReason:          string | null;
  suspensionReason:         string | null;
  validationNotes:          string | null;
  approvedByStateId:        string | null;
  validatedByStaffId:       string | null;
  createdAt:                string;
  updatedAt:                string;
  documents?:               Document[];
}

export interface SupportTicket {
  id:                string;
  cd:                string;
  userId:            string;
  type:              TicketType;
  status:            TicketStatus;
  subject:           string;
  content:           Record<string, unknown>;
  resolution:        string | null;
  resolvedByStaffId: string | null;
  escalatedToState:  boolean;
  escalatedAt:       string | null;
  resolvedAt:        string | null;
  closedAt:          string | null;
  createdAt:         string;
  updatedAt?:        string;
  user?:             { id: string; fullName: string; email: string; role: string };
}

export interface Product {
  id:              string;
  cd:              string;
  name:            string;
  description:     string | null;
  category:        string;
  producerId:      string;
  companyId:       string;
  status:          ProductStatus;
  metadata:        Record<string, unknown> | null;
  certificateUrl:  string | null;
  rejectionReason: string | null;
  publishedAt:     string | null;
  createdAt:       string;
  updatedAt:       string;
  producer?:       { id: string; fullName: string };
  company?:        { id: string; name: string };
  documents?:      Document[];
}

export interface PriceProposalSnapshot {
  snapshotVersion:  string;
  generatedAt:      string;
  proposalId:       string;
  productId:        string;
  productName:      string;
  productCategory:  string;
  approvedPriceUsd: number;
  currency:         string;
  validFrom:        string | null;
  validTo:          string | null;
  immutable:        true;
}

export interface PriceProposal {
  id:              string;
  cd:              string;
  productId:       string;
  createdById:     string;
  approvedById:    string | null;
  status:          PriceProposalStatus;
  proposedPrice:   string;
  currency:        string;
  justification:   string | null;
  rejectionReason: string | null;
  snapshot:        PriceProposalSnapshot | null;
  submittedAt:     string | null;
  approvedAt:      string | null;
  validFrom:       string | null;
  validTo:         string | null;
  createdAt:       string;
  updatedAt:       string;
  product?:        { id: string; name: string; category: string };
}

export interface OrderLine {
  id:              string;
  cd:              string;
  orderId:         string;
  productId:       string;
  priceProposalId: string;
  qty:             number;
  unitPrice:       string;
  taxRate:         string | null;
  taxAmount:       string | null;
  lineTotal:       string | null;
  snapshotRef:     PriceProposalSnapshot | null;
  product?:        { id: string; name: string };
  priceProposal?:  PriceProposal;
}

export interface Order {
  id:            string;
  cd:            string;
  buyerId:       string;
  companyId:     string;
  status:        OrderStatus;
  totalAmount:   string | null;
  taxAmount:     string | null;
  netAmount:     string | null;
  currency:      string;
  blockedReason: string | null;
  blockedById:   string | null;
  blockedAt:     string | null;
  paidAt:        string | null;
  createdAt:     string;
  updatedAt:     string;
  buyer?:        { id: string; fullName: string };
  company?:      { id: string; name: string; country: CompanyCountry };
  lines?:        OrderLine[];
}

export interface TrackingEvent {
  timestamp: string;
  location:  string;
  status:    ShipmentStatus;
  updatedBy: string;
  notes:     string | null;
}

export interface Shipment {
  id:              string;
  cd:              string;
  orderId:         string;
  operatorId:      string;
  status:          ShipmentStatus;
  origin:          string;
  destination:     string;
  eta:             string | null;
  lastLocation:    string | null;
  trackingEvents:  TrackingEvent[];
  holdReason:      string | null;
  createdAt:       string;
  updatedAt:       string;
  operator?:        { id: string; fullName: string };
  customsDispatch?: CustomsDispatch | null;
  documents?:       Document[];
}

export interface CustomsDispatch {
  id:                  string;
  cd:                  string;
  shipmentId:          string;
  dispatcherId:        string;
  status:              'pending' | 'approved' | 'rejected' | 'held';
  notes:               string | null;
  rejectionReason:     string | null;
  validatedAt:         string | null;
  dispatchDocumentUrl: string | null;
}

export interface Tax {
  id:            string;
  cd:            string;
  name:          string;
  category:      string;
  country:       string;
  rate:          string;
  effectiveFrom: string;
  effectiveTo:   string | null;
  isActive:      boolean;
  createdAt:     string;
}

export interface AuditLog {
  id:         string;
  cd:         string;
  userId:     string;
  role:       string;
  action:     string;
  entity:     string;
  entityId:   string;
  beforeJson: string | null;
  afterJson:  string | null;
  meta:       string | null;
  createdAt:  string;
}

export interface Transaction {
  id:             string;
  cd:             string;
  orderId:        string;
  amount:         string;
  currency:       string;
  method:         PaymentMethod;
  status:         TransactionStatus;
  paidAt:         string | null;
  blockedAt:      string | null;
  blockedById:    string | null;
  blockedReason:  string | null;
  cancelledAt:    string | null;
  invoiceUrl:     string | null;
  receiptUrl:     string | null;
  order?:         { id: string; cd: string; buyerId: string };
}

export interface TransactionSummary {
  counts:  Record<TransactionStatus, number>;
  amounts: Partial<Record<TransactionStatus, string>>;
}

export interface Report {
  id:             string;
  cd:             string;
  title:          string;
  type:           ReportType;
  status:         ReportStatus;
  targetAudience: TargetAudience;
  period:         string | null;
  publishedAt:    string | null;
  content:        object | null;
  createdAt:      string;
  updatedAt:      string;
  author?:        { id: string; fullName: string };
}

export interface ApiError {
  statusCode: number;
  message:    string | string[];
  error:      string;
}

export function toNumber(value: string | null | undefined): number {
  return value ? parseFloat(value) : 0;
}

export function formatRate(rate: string): string {
  return `${(parseFloat(rate) * 100).toFixed(0)}%`;
}

export function getErrorMessage(error: unknown): string {
  const axiosError = error as { response?: { data?: ApiError } };
  const data = axiosError?.response?.data;
  if (!data) return 'Erro de ligação ao servidor';
  if (Array.isArray(data.message)) return data.message.join('. ');
  return (data.message as string) ?? 'Erro desconhecido';
}
