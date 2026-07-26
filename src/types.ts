/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  ADMIN = "ADMIN",
  CAN_BO_XA = "CAN_BO_XA",
  CAN_BO_THON = "CAN_BO_THON",
  TO_CONG_NGHE = "TO_CONG_NGHE"
}

export enum TaskStatus {
  NHAP = "NHAP",
  DA_PHAT_HANH = "DA_PHAT_HANH",
  DANG_THUC_HIEN = "DANG_THUC_HIEN",
  DA_HOAN_THANH = "DA_HOAN_THANH",
  DA_DONG = "DA_DONG"
}

export enum AssignmentStatus {
  CHUA_XEM = "CHUA_XEM",
  DA_XEM = "DA_XEM",
  DANG_THUC_HIEN = "DANG_THUC_HIEN",
  BAN_NHAP = "BAN_NHAP",
  CO_LOI_CAN_SUA = "CO_LOI_CAN_SUA",
  DA_NOP = "DA_NOP",
  YEU_CAU_CHINH_SUA = "YEU_CAU_CHINH_SUA",
  DA_DUYET = "DA_DUYET",
  NOP_QUA_HAN = "NOP_QUA_HAN",
  OVERDUE_NOT_SUBMITTED = "OVERDUE_NOT_SUBMITTED"
}

export enum Severity {
  ERROR = "ERROR", // Red: Must fix to submit
  WARNING = "WARNING", // Yellow: Can submit after confirming
  VALID = "VALID", // Green: Valid data
  AMBIGUOUS_NUMBER = "AMBIGUOUS_NUMBER" // Orange: Needs verification
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  role: UserRole;
  villageId?: string; // Optional if Admin or Xa
  avatarUrl: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Village {
  id: string;
  code: string;
  name: string;
  area: string;
  leaderName: string;
  reporterName?: string;
  reporterTitle?: string;
  phone: string;
  email: string;
  active: boolean;
  digitalTeamId?: string;
  allowReportAssignment?: boolean;
  createdAt?: string;
  updatedAt?: string;

  // Optional admin features
  isNew?: boolean;
  allowsReporting?: boolean;
  notes?: string;
  assignedTasksCount?: number;
  completedTasksCount?: number;
}

export interface IndicatorCatalogItem {
  code: string;
  name: string;
  unit: string;
  dataType: "integer" | "decimal" | "string";
  required: boolean;
  minValue: number;
  validationRules?: string;
  warningRules?: string;
  displayOrder: number;
  active: boolean;
}

export interface SubmissionIndicator {
  id: string;
  submissionId: string;
  indicatorCode: string;
  rawValue: string; // original string value from file/input
  normalizedValue: number; // parsed or normalized number
  correctedValue?: number; // corrected by user
  approvedValue?: number; // approved by commune officer
  dataType: "integer" | "decimal" | "string";
  unit: string;
  sourceFile?: string;
  sourceSheet?: string;
  sourceRow?: number;
  sourceColumn?: string;
  validationStatus: "VALID" | "ERROR" | "WARNING" | "AMBIGUOUS_NUMBER";
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportTask {
  id: string;
  code: string;
  title: string;
  description: string;
  reportType: string;
  reportingPeriod: string; // e.g., "Quý II năm 2026"
  startDate: string;
  deadline: string;
  assignedVillageIds: string[];
  status: TaskStatus;
  templateMetadata?: {
    columns: string[];
    sampleRow: Record<string, string | number>;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  taskId: string;
  villageId: string;
  status: AssignmentStatus;
  viewedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  dueStatus: "DUNG_HAN" | "SAP_HET_HAN" | "QUA_HAN";
  currentSubmissionId?: string;
  lateDays?: number;
}

export interface Submission {
  id: string;
  taskId: string;
  villageId: string;
  version: number;
  status: AssignmentStatus;
  formData: Record<string, any>; // maps CT01 -> 120, etc. General properties also: reporterName, reporterPhone, etc.
  indicators: SubmissionIndicator[];
  uploadedFileName?: string;
  validationSummary?: {
    hasErrors: boolean;
    hasWarnings: boolean;
    errorCount: number;
    warningCount: number;
  };
  anomalyConfirmations?: {
    field: string;
    reason: string;
  }[];
  submittedBy: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationIssue {
  id: string;
  submissionId: string;
  field: string; // indicatorCode or other field
  villageCode?: string;
  villageName?: string;
  value: string | number;
  type: string; // e.g., "REQUIRED", "FORMAT", "LOGIC", "ANOMALY", "AMBIGUOUS_NUMBER"
  severity: Severity;
  message: string;
  suggestion: string;
  resolved: boolean;
  sourceFile?: string;
  sourceRow?: number;
  sourceColumn?: string;
  correctedValue?: number;
  handlerName?: string;
  handledAt?: string;
}

export interface SystemNotification {
  id: string;
  receiverUserId?: string;
  receiverVillageId?: string;
  taskId?: string;
  type: "TASK_NEW" | "REMINDER" | "SUBMITTED" | "APPROVED" | "REJECTED" | "WARNING";
  title: string;
  message: string;
  read: boolean;
  channel: "SYSTEM" | "ZALO_SIMULATED";
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: "USER" | "VILLAGE" | "TASK" | "SUBMISSION" | "EXPORT" | "SYSTEM";
  entityId: string;
  details: string;
  createdAt: string;
}

// Digital Team Models
export interface DigitalTeam {
  id: string;
  villageId: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  fullName: string;
  role: string; // e.g., "Tổ trưởng", "Tổ phó", "Thành viên"
  phone: string;
  status: "Đang hoạt động" | "Tạm nghỉ";
  createdAt: string;
  updatedAt: string;
}

export interface Citizen {
  id: string;
  fullName: string;
  phone: string;
  citizenId: string;
  villageId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportRequest {
  id: string;
  citizenId: string;
  citizenName: string;
  citizenPhone?: string;
  villageId: string;
  category: "PUBLIC_SERVICE_ONLINE" | "VNEID" | "PAYMENT" | "OTHER";
  status: "PENDING" | "COMPLETED" | "IN_PROGRESS";
  content: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportPeriod {
  id: string;
  name: string; // "Quý II năm 2026"
  startDate: string;
  endDate: string;
}
