/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  UserProfile, UserRole, ReportTask, TaskStatus, 
  Assignment, AssignmentStatus, Submission, SystemNotification, AuditLog,
  DigitalTeam, TeamMember, Citizen, SupportRequest, SubmissionIndicator, Severity
} from "../types";
import { VILLAGES_LIST } from "./villages";
import { INDICATOR_CATALOG, normalizeValue, isAmbiguousNumber, validateReport } from "../utils/validation";

// Helper to get formatted timestamps relative to today
export const getTimestamp = (daysOffset: number = 0, timeStr: string = "10:00:00"): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const datePart = d.toISOString().split("T")[0]; // YYYY-MM-DD
  return `${datePart}T${timeStr}+07:00`;
};

// Users database
export const MOCK_USERS: UserProfile[] = [
  {
    id: "u-admin",
    fullName: "Nguyễn Văn Hải",
    email: "admin@bana.gov.vn",
    password: "123456",
    role: UserRole.ADMIN,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    active: true,
    createdAt: getTimestamp(-30),
    updatedAt: getTimestamp(-30)
  },
  {
    id: "u-xa",
    fullName: "Nguyễn Minh Tuấn",
    email: "quynhnhutxqt2017@gmail.com", // Linked to user's registered email
    password: "123456",
    role: UserRole.CAN_BO_XA,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    active: true,
    createdAt: getTimestamp(-30),
    updatedAt: getTimestamp(-30)
  },
  {
    id: "u-xa2",
    fullName: "Lê Quốc Khánh",
    email: "canboxa@bana.gov.vn",
    password: "123456",
    role: UserRole.CAN_BO_XA,
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    active: true,
    createdAt: getTimestamp(-30),
    updatedAt: getTimestamp(-30)
  },
  {
    id: "u-thon01",
    fullName: "Trần Văn Toàn",
    email: "thon01@bana.gov.vn",
    password: "123456",
    role: UserRole.CAN_BO_THON,
    villageId: "v01",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    active: true,
    createdAt: getTimestamp(-30),
    updatedAt: getTimestamp(-30)
  },
  {
    id: "u-thon02",
    fullName: "Nguyễn Thị Mai",
    email: "thon02@bana.gov.vn",
    password: "123456",
    role: UserRole.CAN_BO_THON,
    villageId: "v02",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    active: true,
    createdAt: getTimestamp(-30),
    updatedAt: getTimestamp(-30)
  },
  {
    id: "u-thon03",
    fullName: "Nguyễn Văn Tài",
    email: "thon03@bana.gov.vn",
    password: "123456",
    role: UserRole.CAN_BO_THON,
    villageId: "v03",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    active: true,
    createdAt: getTimestamp(-30),
    updatedAt: getTimestamp(-30)
  },
  {
    id: "u-tocongnghe03",
    fullName: "Nguyễn Văn A (T03)",
    email: "tocongnghe03@bana.gov.vn",
    password: "123456",
    role: UserRole.TO_CONG_NGHE,
    villageId: "v03",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
    active: true,
    createdAt: getTimestamp(-30),
    updatedAt: getTimestamp(-30)
  }
];

// Tasks
export const MOCK_TASKS: ReportTask[] = [
  {
    id: "t-01",
    code: "BCDS-202601",
    title: "Báo cáo số liệu Văn hóa - Xã hội Quý I năm 2026",
    description: "Chiến dịch báo cáo chính thức quý 1 năm 2026 cho 22 thôn.",
    reportType: "Phiếu báo cáo số liệu Văn hóa - Xã hội định kỳ",
    reportingPeriod: "Quý I năm 2026",
    startDate: getTimestamp(-90),
    deadline: getTimestamp(-75, "17:00:00"),
    assignedVillageIds: VILLAGES_LIST.map(v => v.id),
    status: TaskStatus.DA_HOAN_THANH,
    createdBy: "u-xa",
    createdAt: getTimestamp(-90),
    updatedAt: getTimestamp(-75)
  },
  {
    id: "t-02",
    code: "BCDS-202602",
    title: "Báo cáo số liệu Văn hóa - Xã hội Quý II năm 2026",
    description: "Chiến dịch thu thập số liệu phát triển Văn hóa - Xã hội định kỳ của 22 thôn thuộc xã Bà Nà, phục vụ công tác rà soát và hoạch định chiến lược chuyển đổi số.",
    reportType: "Phiếu báo cáo số liệu Văn hóa - Xã hội định kỳ",
    reportingPeriod: "Quý II năm 2026",
    startDate: "2026-05-15T08:00:00+07:00",
    deadline: "2026-06-15T17:00:00+07:00",
    assignedVillageIds: VILLAGES_LIST.map(v => v.id),
    status: TaskStatus.DANG_THUC_HIEN,
    createdBy: "u-xa",
    createdAt: "2026-05-15T08:00:00+07:00",
    updatedAt: "2026-05-15T08:00:00+07:00"
  }
];

// Seed Digital Teams & Members
export const MOCK_DIGITAL_TEAMS: DigitalTeam[] = VILLAGES_LIST.map(v => ({
  id: `team-${v.id}`,
  villageId: v.id,
  name: `Tổ Công nghệ số cộng đồng ${v.name}`,
  active: true,
  createdAt: getTimestamp(-100),
  updatedAt: getTimestamp(-100)
}));

export const MOCK_TEAM_MEMBERS: TeamMember[] = [];
VILLAGES_LIST.forEach((v, index) => {
  // Each village has between 5 and 8 members based on formula
  const count = 5 + (index % 4); 
  for (let m = 1; m <= count; m++) {
    MOCK_TEAM_MEMBERS.push({
      id: `m-${v.id}-${m}`,
      teamId: `team-${v.id}`,
      fullName: `${v.leaderName.split(" ")[0]} Văn ${m === 1 ? "Trưởng" : m === 2 ? "Phó" : "Thành viên " + m}`,
      role: m === 1 ? "Tổ trưởng" : m === 2 ? "Tổ phó" : "Thành viên",
      phone: `0912345${String(index + 1).padStart(2, "0")}${m}`,
      status: "Đang hoạt động",
      createdAt: getTimestamp(-100),
      updatedAt: getTimestamp(-100)
    });
  }
});

// Seed Citizens and completed Support Requests
export const MOCK_CITIZENS: Citizen[] = [];
export const MOCK_SUPPORT_REQUESTS: SupportRequest[] = [];

VILLAGES_LIST.forEach((v, index) => {
  // Let's create a predictable list of citizens & requests
  // Citizen count is larger, e.g. 100 per village
  const countOfGuided = 40 + (index * 5); // v01: 40, v02: 45, v03: 50, etc.
  
  for (let c = 1; c <= countOfGuided; c++) {
    const citId = `citizen-${v.id}-${c}`;
    MOCK_CITIZENS.push({
      id: citId,
      fullName: `Dân Thôn ${v.code} Số ${c}`,
      phone: `0987654${String(index + 1).padStart(2, "0")}${String(c).padStart(2, "0")}`,
      citizenId: `1234567${String(index + 1).padStart(2, "0")}${String(c).padStart(3, "0")}`,
      villageId: v.id,
      createdAt: getTimestamp(-80),
      updatedAt: getTimestamp(-80)
    });

    // Create a completed Support Request for online public service
    MOCK_SUPPORT_REQUESTS.push({
      id: `req-${v.id}-${c}`,
      citizenId: citId,
      citizenName: `Dân Thôn ${v.code} Số ${c}`,
      citizenPhone: `0987654${String(index + 1).padStart(2, "0")}${String(c).padStart(2, "0")}`,
      villageId: v.id,
      category: "PUBLIC_SERVICE_ONLINE",
      status: "COMPLETED",
      content: "Hướng dẫn cài đặt và nộp hồ sơ dịch vụ công trực tuyến mức độ 4 liên quan đến khai sinh/đất đai.",
      completedAt: getTimestamp(-5), // in current period
      createdAt: getTimestamp(-6),
      updatedAt: getTimestamp(-5)
    });
  }
});

// Helper to get active team size for a village
export function getActiveTeamMemberCount(villageId: string, teamMembers?: any[]): number {
  const list = teamMembers || MOCK_TEAM_MEMBERS;
  return list.filter((m: any) => m.teamId === `team-${villageId}` && m.status === "Đang hoạt động").length;
}

// Helper to get online public service support count for a village
export function getGuidedPublicServiceCitizenCount(villageId: string, supportRequests?: any[]): number {
  const list = supportRequests || MOCK_SUPPORT_REQUESTS;
  const reqs = list.filter((r: any) => 
    r.villageId === villageId && 
    (r.category === "PUBLIC_SERVICE_ONLINE" || !r.category) && 
    (r.status === "COMPLETED" || r.status === "Hoàn thành")
  );
  // Get unique citizens
  const uniqueCitIds = new Set(reqs.map((r: any) => r.citizenId || r.id));
  return uniqueCitIds.size;
}

// Build Submission indicators
export function buildSubmissionIndicators(submissionId: string, formData: Record<string, any>): SubmissionIndicator[] {
  return INDICATOR_CATALOG.map((item) => {
    const rawVal = formData[item.code] !== undefined ? String(formData[item.code]) : "";
    const isAmb = isAmbiguousNumber(rawVal);
    const { numericValue, status } = normalizeValue(rawVal);

    return {
      id: `ind-${submissionId}-${item.code}`,
      submissionId,
      indicatorCode: item.code,
      rawValue: rawVal,
      normalizedValue: isNaN(numericValue) ? 0 : numericValue,
      correctedValue: undefined,
      approvedValue: undefined,
      dataType: item.dataType as any,
      unit: item.unit,
      validationStatus: isAmb ? "AMBIGUOUS_NUMBER" : (status === "ERROR" ? "ERROR" : "VALID"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
}

// Generate reports for Quý I (all approved)
export const generateQ1Data = (): Submission[] => {
  const submissions: Submission[] = [];
  VILLAGES_LIST.forEach((village, idx) => {
    const baseH = 200 + (idx * 10);
    const ct01 = baseH;
    const ct02 = baseH * 4;
    const ct03 = Math.floor(baseH * 0.04);
    const ct04 = Math.floor(baseH * 0.06);
    const ct05 = 15 + idx;
    const ct06 = 30 + idx;
    const ct07 = Math.floor(ct02 * 0.22);
    const ct08 = 2;
    const ct09 = baseH - 20;
    const ct10 = Math.floor(ct02 * 0.58);
    const ct11 = ct02 - 50;
    const ct12 = getActiveTeamMemberCount(village.id);
    const ct13 = getGuidedPublicServiceCitizenCount(village.id) - 10; // Q1 is slightly less
    const ct14 = 0;

    const formData: Record<string, any> = {
      villageName: village.name,
      reportingPeriod: "Quý I năm 2026",
      reporterName: village.leaderName,
      reporterTitle: village.reporterTitle,
      phone: village.phone,
      reportDate: "25/03/2026",
      CT01: ct01,
      CT02: ct02,
      CT03: ct03,
      CT04: ct04,
      CT05: ct05,
      CT06: ct06,
      CT07: ct07,
      CT08: ct08,
      CT09: ct09,
      CT10: ct10,
      CT11: ct11,
      CT12: ct12,
      CT13: ct13,
      CT14: ct14,
      notes: "Báo cáo Quý I được duyệt chính thức."
    };

    const submissionId = `s-01-${village.id}`;
    submissions.push({
      id: submissionId,
      taskId: "t-01",
      villageId: village.id,
      version: 1,
      status: AssignmentStatus.DA_DUYET,
      formData,
      indicators: buildSubmissionIndicators(submissionId, formData),
      submittedBy: `u-${village.id}`,
      submittedAt: getTimestamp(-110),
      reviewedBy: "u-xa",
      reviewedAt: getTimestamp(-109),
      reviewComment: "Đã duyệt.",
      createdAt: getTimestamp(-110),
      updatedAt: getTimestamp(-109)
    });
  });
  return submissions;
};

// Generate reports for Quý II matching all 10 scenario rules!
export const generateQ2Data = (): { assignments: Assignment[]; submissions: Submission[] } => {
  const assignments: Assignment[] = [];
  const submissions: Submission[] = [];

  VILLAGES_LIST.forEach((v, idx) => {
    const q1Sub = generateQ1Data().find(s => s.villageId === v.id);
    const q1H = q1Sub ? q1Sub.formData.CT01 : 200;

    // Default target variables for Quý II
    let ct01 = q1H + 2; 
    let ct02 = ct01 * 4;
    let ct03 = Math.floor(ct01 * 0.03);
    let ct04 = Math.floor(ct01 * 0.05);
    let ct05 = 15 + idx;
    let ct06 = 30 + idx;
    let ct07 = Math.floor(ct02 * 0.22);
    let ct08 = 2;
    let ct09 = ct01 - 15;
    let ct10 = Math.floor(ct02 * 0.58);
    let ct11 = ct02 - 10; // High health insurance coverage
    let ct12 = getActiveTeamMemberCount(v.id);
    let ct13 = getGuidedPublicServiceCitizenCount(v.id); // Matches support database perfectly!
    let ct14 = 0;

    let comment = "Số liệu cập nhật quý II ổn định.";
    let status: AssignmentStatus = AssignmentStatus.DA_DUYET;
    let dueStatus: "DUNG_HAN" | "SAP_HET_HAN" | "QUA_HAN" = "DUNG_HAN";
    let isLate = false;
    let submittedAtStr = getTimestamp(-3, "15:30:00");
    let phoneVal = v.phone;

    // APPLY SCENARIO SPECIFIC RULES:
    
    // T03 (v03) - Approved, late by 3 days
    if (v.code === "T03") {
      status = AssignmentStatus.DA_DUYET;
      isLate = true;
      submittedAtStr = getTimestamp(2, "09:00:00"); // 3 days after deadline
      comment = "Báo cáo nộp trễ 3 ngày đã được duyệt.";
    }

    // T08 (v08) - Approved, late by 2 days
    if (v.code === "T08") {
      status = AssignmentStatus.DA_DUYET;
      isLate = true;
      submittedAtStr = getTimestamp(1, "10:15:00"); // 2 days after deadline
      comment = "Báo cáo nộp trễ 2 ngày đã được phê duyệt.";
    }

    // T16 (v16) - Approved, late by 1 day
    if (v.code === "T16") {
      status = AssignmentStatus.DA_DUYET;
      isLate = true;
      submittedAtStr = getTimestamp(0, "14:20:00"); // 1 day after deadline
      comment = "Báo cáo nộp trễ 1 ngày đã được duyệt.";
    }

    // T11 (v11) - Overdue, not submitted (Ninh An)
    if (v.code === "T11") {
      status = AssignmentStatus.OVERDUE_NOT_SUBMITTED;
      dueStatus = "QUA_HAN";
    }

    // T14 (v14) - Overdue, not submitted (Sơn Phước)
    if (v.code === "T14") {
      status = AssignmentStatus.OVERDUE_NOT_SUBMITTED;
      dueStatus = "QUA_HAN";
    }

    // T21 (v21) - Overdue, not submitted (Thạch Nham Tây)
    if (v.code === "T21") {
      status = AssignmentStatus.OVERDUE_NOT_SUBMITTED;
      dueStatus = "QUA_HAN";
    }

    // Error 1: T06 (v06) - CT04 empty (missing required field)
    if (v.code === "T06") {
      status = AssignmentStatus.CO_LOI_CAN_SUA;
      ct04 = "" as any; // Empty value to trigger required error
      comment = "Báo cáo có lỗi: Thiếu số liệu chỉ tiêu CT04 (Số hộ cận nghèo).";
    }

    // Error 2: T07 (v07) - CT07 is a string (format error)
    if (v.code === "T07") {
      status = AssignmentStatus.CO_LOI_CAN_SUA;
      ct07 = "không xác định" as any; // String value to trigger format error
      comment = "Báo cáo có lỗi: Chỉ tiêu CT07 chứa giá trị dạng chữ không hợp lệ.";
    }

    // Error 3: T09 (v09) - CT03 > CT01 (poor households > total households)
    if (v.code === "T09") {
      status = AssignmentStatus.CO_LOI_CAN_SUA;
      ct03 = ct01 + 5; // trigger logic error
      comment = "Báo cáo có lỗi: Số hộ nghèo lớn hơn tổng số hộ dân.";
    }

    // Error 4: T12 (v12) - CT03 + CT04 > CT01 (poor + near poor > total households)
    if (v.code === "T12") {
      status = AssignmentStatus.CO_LOI_CAN_SUA;
      ct03 = Math.floor(ct01 * 0.6);
      ct04 = Math.floor(ct01 * 0.5); // poor + near poor > total
      comment = "Báo cáo có lỗi: Tổng số hộ nghèo và hộ cận nghèo vượt quá tổng số hộ dân.";
    }

    // Error 5: T15 (v15) - CT11 > CT02 (health insurance > total population)
    if (v.code === "T15") {
      status = AssignmentStatus.CO_LOI_CAN_SUA;
      ct11 = ct02 + 100; // trigger logic error
      comment = "Báo cáo có lỗi: Số người tham gia BHYT vượt quá tổng số nhân khẩu.";
    }

    // Error 6: T18 (v18) - CT08 > CT07 (special children > children under 16)
    if (v.code === "T18") {
      status = AssignmentStatus.CO_LOI_CAN_SUA;
      ct08 = ct07 + 20; // trigger logic error
      comment = "Báo cáo có lỗi: Số trẻ em có hoàn cảnh đặc biệt lớn hơn số trẻ em dưới 16 tuổi.";
    }

    // Error 7: T22 (v22) - Reporter phone invalid format
    if (v.code === "T22") {
      status = AssignmentStatus.CO_LOI_CAN_SUA;
      phoneVal = "091234"; // Invalid format phone
      comment = "Báo cáo có lỗi: Số điện thoại người lập không hợp lệ.";
    }

    // All other submitted villages are approved and on-time
    if (!["T03", "T06", "T07", "T08", "T09", "T11", "T12", "T14", "T15", "T16", "T18", "T21", "T22"].includes(v.code)) {
      status = AssignmentStatus.DA_DUYET;
      submittedAtStr = getTimestamp(-3, "11:00:00"); // 3 days before deadline
    }

    const taskId = "t-02";
    const assignmentId = `a-02-${v.id}`;
    const submissionId = `s-02-${v.id}`;

    // Add Assignment
    assignments.push({
      id: assignmentId,
      taskId,
      villageId: v.id,
      status,
      viewedAt: getTimestamp(-14),
      submittedAt: status !== AssignmentStatus.OVERDUE_NOT_SUBMITTED ? submittedAtStr : undefined,
      approvedAt: status === AssignmentStatus.DA_DUYET ? getTimestamp(0, "16:00:00") : undefined,
      dueStatus: dueStatus,
      currentSubmissionId: status !== AssignmentStatus.OVERDUE_NOT_SUBMITTED ? submissionId : undefined
    });

    // Add Submission record (except for overdue not submitted villages)
    if (status !== AssignmentStatus.OVERDUE_NOT_SUBMITTED) {
      const formData: Record<string, any> = {
        villageName: v.name,
        reportingPeriod: "Quý II năm 2026",
        reporterName: v.leaderName,
        reporterTitle: v.reporterTitle,
        phone: phoneVal,
        reportDate: "12/07/2026",
        CT01: ct01,
        CT02: ct02,
        CT03: ct03,
        CT04: ct04,
        CT05: ct05,
        CT06: ct06,
        CT07: ct07,
        CT08: ct08,
        CT09: ct09,
        CT10: ct10,
        CT11: ct11,
        CT12: ct12,
        CT13: ct13,
        CT14: ct14,
        notes: comment
      };

      const valResult = validateReport(formData, undefined, submissionId, {
        activeDigitalTeamMemberCount: ct12,
        activeOnlineSupportCitizenCount: ct13
      });
      const errorCount = valResult.issues.filter(i => i.severity === Severity.ERROR).length;
      const warningCount = valResult.issues.filter(i => i.severity === Severity.WARNING).length;

      submissions.push({
        id: submissionId,
        taskId,
        villageId: v.id,
        version: 1,
        status,
        formData,
        indicators: buildSubmissionIndicators(submissionId, formData),
        uploadedFileName: v.code === "T03" ? "baocao_phuhoa_q2.xlsx" : undefined,
        validationSummary: {
          hasErrors: errorCount > 0,
          hasWarnings: warningCount > 0,
          errorCount,
          warningCount
        },
        anomalyConfirmations: [],
        submittedBy: `u-${v.id}`,
        submittedAt: submittedAtStr,
        reviewedBy: status === AssignmentStatus.DA_DUYET ? "u-xa" : undefined,
        reviewedAt: status === AssignmentStatus.DA_DUYET ? getTimestamp(0, "16:00:00") : undefined,
        reviewComment: status === AssignmentStatus.DA_DUYET ? "Duyệt số liệu báo cáo." : undefined,
        createdAt: getTimestamp(-10),
        updatedAt: status === AssignmentStatus.DA_DUYET ? getTimestamp(0) : getTimestamp(-10)
      });
    }
  });

  return { assignments, submissions };
};

// Auto Verification Function
export function verifyDemoTotals(state: any) {
  const activeSubs = state.submissions.filter((s: any) => s.taskId === "t-02");
  const overdueUnsubmitted = ["T11", "T14", "T21"]; // Ninh An, Sơn Phước, Thạch Nham Tây

  let indicatorErrorsCount = 0;
  let phoneErrorsCount = 0;
  let approvedCount = 0;

  activeSubs.forEach((s: any) => {
    const valResult = validateReport(s.formData, undefined, s.id);
    const indicatorErrors = valResult.issues.filter(i => i.severity === Severity.ERROR && i.field !== "phone");
    const phoneErrors = valResult.issues.filter(i => i.severity === Severity.ERROR && i.field === "phone");

    indicatorErrorsCount += indicatorErrors.length;
    phoneErrorsCount += phoneErrors.length;

    if (s.status === AssignmentStatus.DA_DUYET) {
      approvedCount++;
    }
  });

  const submittedCount = activeSubs.length; // 19 initially

  const lateScenarios = [
    { code: "T03", name: "Thôn Thạch Nham Đông", expectedDelay: "3 ngày" },
    { code: "T08", name: "Thôn Phước Thuận - Phước Hậu", expectedDelay: "2 ngày" },
    { code: "T16", name: "Thôn Năm", expectedDelay: "1 ngày" }
  ];

  // We PASS all 14 indicators if 19 submissions are approved and there are 0 indicator and 0 phone errors.
  const passAll14 = (submittedCount === 19 && approvedCount === 19 && indicatorErrorsCount === 0 && phoneErrorsCount === 0);

  return {
    indicatorErrorsCount,
    phoneErrorsCount,
    lateScenarios,
    submittedCount,
    overdueUnsubmitted,
    passAll14,
    isValidDemo: true
  };
}

// Initial state builder
export const getInitialData = () => {
  const q1Subs = generateQ1Data();
  const { assignments: q2As, submissions: q2Subs } = generateQ2Data();

  // Create Q1 assignments
  const q1As: Assignment[] = VILLAGES_LIST.map(village => ({
    id: `a-01-${village.id}`,
    taskId: "t-01",
    villageId: village.id,
    status: AssignmentStatus.DA_DUYET,
    viewedAt: getTimestamp(-112),
    submittedAt: getTimestamp(-110),
    approvedAt: getTimestamp(-109),
    dueStatus: "DUNG_HAN",
    currentSubmissionId: `s-01-${village.id}`
  }));

  const allAssignments = [...q1As, ...q2As];
  const allSubmissions = [...q1Subs, ...q2Subs];

  // System notifications
  const notifications: SystemNotification[] = [
    {
      id: "n-01",
      type: "TASK_NEW",
      title: "Chiến dịch báo cáo mới",
      message: "Ủy ban xã vừa ban hành chiến dịch Báo cáo số liệu Văn hóa - Xã hội định kỳ Quý II năm 2026.",
      read: false,
      channel: "SYSTEM",
      createdAt: getTimestamp(-15)
    },
    {
      id: "n-02",
      type: "WARNING",
      title: "⚠️ Cảnh báo số liệu tăng vọt",
      message: "Thôn Thái Lai (T05) nộp báo cáo Quý II có tổng số hộ tăng 35% so với quý trước.",
      read: false,
      channel: "SYSTEM",
      createdAt: getTimestamp(-2)
    },
    {
      id: "n-03",
      type: "SUBMITTED",
      title: "Thôn Thạch Nham Đông đã nộp trễ",
      message: "Trưởng thôn Phú Hòa 1 vừa nộp biểu mẫu báo cáo. Hệ thống phát hiện lỗi logic.",
      read: true,
      channel: "SYSTEM",
      createdAt: getTimestamp(-2)
    }
  ];

  // Audit Logs
  const auditLogs: AuditLog[] = [
    {
      id: "log-01",
      userId: "u-xa",
      userName: "Nguyễn Minh Tuấn",
      userRole: UserRole.CAN_BO_XA,
      action: "Khởi tạo chiến dịch",
      entityType: "TASK",
      entityId: "t-02",
      details: "Thiết lập chiến dịch thống kê 14 chỉ tiêu định kỳ Quý II năm 2026 cho 22 thôn.",
      createdAt: getTimestamp(-15, "08:00:00")
    },
    {
      id: "log-02",
      userId: "u-thon01",
      userName: "Trần Văn Toàn",
      userRole: UserRole.CAN_BO_THON,
      action: "Nộp báo cáo",
      entityType: "SUBMISSION",
      entityId: "s-02-v01",
      details: "Đã nộp báo cáo Quý II năm 2026 với 14 chỉ tiêu định kỳ.",
      createdAt: getTimestamp(-3, "15:30:00")
    }
  ];

  return {
    users: MOCK_USERS,
    tasks: MOCK_TASKS,
    assignments: allAssignments,
    submissions: allSubmissions,
    notifications,
    auditLogs,
    villages: VILLAGES_LIST,
    digitalTeams: MOCK_DIGITAL_TEAMS,
    teamMembers: MOCK_TEAM_MEMBERS,
    citizens: MOCK_CITIZENS,
    supportRequests: MOCK_SUPPORT_REQUESTS
  };
};

// Storage keys
const STORAGE_KEY = "CIVIGO_STATE_RECORDS_V2";

// Load state from local storage
export const loadDataState = () => {
  if (typeof window === "undefined") return getInitialData();
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const data = JSON.parse(stored);
      // Validate structure matches requirements
      if (data && Array.isArray(data.users) && Array.isArray(data.digitalTeams)) {
        return data;
      }
    } catch (e) {
      console.error("Error parsing stored data", e);
    }
  }
  const defaultData = getInitialData();
  saveDataState(defaultData);
  return defaultData;
};

// Save state to local storage
export const saveDataState = (data: any) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
};

export const getInitialState = loadDataState;
export const saveState = saveDataState;

// State Mutators

// 1. Create New Reporting Task
export const createNewTask = (state: any, payload: Partial<ReportTask>, currentUser: UserProfile): any => {
  const updated = { ...state };
  const taskId = `t-${Date.now()}`;
  const code = `BCDS-${Date.now().toString().slice(-6)}`;

  const newTask: ReportTask = {
    id: taskId,
    code: code,
    title: payload.title || "Chiến dịch báo cáo mới",
    description: payload.description || "",
    reportType: payload.reportType || "Phiếu báo cáo số liệu Văn hóa - Xã hội định kỳ",
    reportingPeriod: payload.reportingPeriod || "Quý II năm 2026",
    startDate: payload.startDate || new Date().toISOString(),
    deadline: payload.deadline || new Date().toISOString(),
    assignedVillageIds: payload.assignedVillageIds || VILLAGES_LIST.map(v => v.id),
    status: TaskStatus.DANG_THUC_HIEN,
    createdBy: currentUser.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  updated.tasks.push(newTask);

  newTask.assignedVillageIds.forEach(vId => {
    const assignment: Assignment = {
      id: `a-${Date.now()}-${vId}`,
      taskId: taskId,
      villageId: vId,
      status: AssignmentStatus.CHUA_XEM,
      dueStatus: "DUNG_HAN"
    };
    updated.assignments.push(assignment);

    const notification: SystemNotification = {
      id: `n-${Date.now()}-${vId}`,
      receiverVillageId: vId,
      taskId: taskId,
      type: "TASK_NEW",
      title: "Chỉ thị báo cáo mới",
      message: `Cán bộ xã vừa phát hành chiến dịch báo cáo "${newTask.title}". Hãy hoàn thành báo cáo số liệu.`,
      read: false,
      channel: "SYSTEM",
      createdAt: new Date().toISOString()
    };
    updated.notifications.unshift(notification);
  });

  const log: AuditLog = {
    id: `log-${Date.now()}`,
    userId: currentUser.id,
    userName: currentUser.fullName,
    userRole: currentUser.role,
    action: "Tạo chiến dịch",
    entityType: "TASK",
    entityId: taskId,
    details: `Đã ban hành chiến dịch báo cáo mới "${newTask.title}" cho ${newTask.assignedVillageIds.length} thôn.`,
    createdAt: new Date().toISOString()
  };
  updated.auditLogs.unshift(log);

  saveDataState(updated);
  return updated;
};

// 2. Submit Report Mutator
export const submitReport = (
  state: any, 
  taskId: string, 
  villageId: string, 
  formData: Record<string, any>, 
  currentUser: UserProfile,
  fileUploadedName?: string
): any => {
  const updated = { ...state };
  const submissionId = `s-${Date.now()}-${villageId}`;

  const existingSubIndex = updated.submissions.findIndex((s: any) => s.taskId === taskId && s.villageId === villageId);
  const version = existingSubIndex >= 0 ? updated.submissions[existingSubIndex].version + 1 : 1;

  // Import validator
  const { validateReport } = require("../utils/validation");
  const prevSub = updated.submissions.find((s: any) => s.taskId === "t-01" && s.villageId === villageId);
  const prevData = prevSub?.formData;

  const teamCount = getActiveTeamMemberCount(villageId);
  const supportCount = getGuidedPublicServiceCitizenCount(villageId);

  const { issues, severity } = validateReport(formData, prevData, submissionId, {
    activeDigitalTeamMemberCount: teamCount,
    activeOnlineSupportCitizenCount: supportCount
  });

  const hasErrors = issues.some((i: any) => i.severity === "ERROR");
  const hasWarnings = issues.some((i: any) => i.severity === "WARNING");

  const newSubmission: Submission = {
    id: submissionId,
    taskId: taskId,
    villageId: villageId,
    version: version,
    status: hasErrors ? AssignmentStatus.CO_LOI_CAN_SUA : AssignmentStatus.DA_NOP,
    formData: formData,
    uploadedFileName: fileUploadedName,
    indicators: buildSubmissionIndicators(submissionId, formData),
    validationSummary: {
      hasErrors,
      hasWarnings,
      errorCount: issues.filter((i: any) => i.severity === "ERROR").length,
      warningCount: issues.filter((i: any) => i.severity === "WARNING").length
    },
    anomalyConfirmations: hasWarnings ? [
      { field: "CT01", reason: formData.notes || "Giải trình biến động số liệu tự động." }
    ] : [],
    submittedBy: currentUser.id,
    submittedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (existingSubIndex >= 0) {
    updated.submissions[existingSubIndex] = newSubmission;
  } else {
    updated.submissions.push(newSubmission);
  }

  // Update Assignment
  const assignIndex = updated.assignments.findIndex((a: any) => a.taskId === taskId && a.villageId === villageId);
  if (assignIndex >= 0) {
    updated.assignments[assignIndex] = {
      ...updated.assignments[assignIndex],
      status: hasErrors ? AssignmentStatus.CO_LOI_CAN_SUA : AssignmentStatus.DA_NOP,
      submittedAt: new Date().toISOString(),
      currentSubmissionId: submissionId
    };
  }

  // Add notification
  const vName = VILLAGES_LIST.find(v => v.id === villageId)?.name || "Thôn";
  const notification: SystemNotification = {
    id: `n-${Date.now()}`,
    taskId: taskId,
    type: "SUBMITTED",
    title: `${vName} đã nộp báo cáo (v${version})`,
    message: `Đồng chí ${currentUser.fullName} vừa nộp báo cáo Quý II. Kết quả kiểm duyệt: ${hasErrors ? "Phát hiện lỗi số liệu" : "Đầy đủ, chờ phê duyệt"}`,
    read: false,
    channel: "SYSTEM",
    createdAt: new Date().toISOString()
  };
  updated.notifications.unshift(notification);

  // Audit log
  const log: AuditLog = {
    id: `log-${Date.now()}`,
    userId: currentUser.id,
    userName: currentUser.fullName,
    userRole: currentUser.role,
    action: "Nộp báo cáo",
    entityType: "SUBMISSION",
    entityId: submissionId,
    details: `Đã nộp thành công biểu mẫu 14 chỉ tiêu của ${vName}. Số lỗi: ${issues.filter((i: any) => i.severity === "ERROR").length}.`,
    createdAt: new Date().toISOString()
  };
  updated.auditLogs.unshift(log);

  saveDataState(updated);
  return updated;
};

// 3. Approve Report Mutator
export const approveReport = (
  state: any, 
  taskId: string, 
  villageId: string, 
  comment: string, 
  currentUser: UserProfile
): any => {
  const updated = { ...state };

  const subIndex = updated.submissions.findIndex((s: any) => s.taskId === taskId && s.villageId === villageId);
  if (subIndex >= 0) {
    const sub = updated.submissions[subIndex];
    updated.submissions[subIndex] = {
      ...sub,
      status: AssignmentStatus.DA_DUYET,
      reviewedBy: currentUser.id,
      reviewedAt: new Date().toISOString(),
      reviewComment: comment || "Đã phê duyệt số liệu chính thức.",
      updatedAt: new Date().toISOString(),
      // Set approvedValue on indicators
      indicators: sub.indicators.map((ind: any) => ({
        ...ind,
        approvedValue: ind.correctedValue !== undefined ? ind.correctedValue : ind.normalizedValue
      }))
    };
  }

  const assignIndex = updated.assignments.findIndex((a: any) => a.taskId === taskId && a.villageId === villageId);
  if (assignIndex >= 0) {
    updated.assignments[assignIndex] = {
      ...updated.assignments[assignIndex],
      status: AssignmentStatus.DA_DUYET,
      approvedAt: new Date().toISOString()
    };
  }

  const notification: SystemNotification = {
    id: `n-${Date.now()}`,
    receiverVillageId: villageId,
    taskId: taskId,
    type: "APPROVED",
    title: "Số liệu báo cáo của thôn đã được duyệt",
    message: `Văn phòng Xã đã duyệt chính thức biểu mẫu chỉ tiêu Quý II năm 2026. Nhận xét: "${comment || 'Đã duyệt'}"`,
    read: false,
    channel: "SYSTEM",
    createdAt: new Date().toISOString()
  };
  updated.notifications.unshift(notification);

  const log: AuditLog = {
    id: `log-${Date.now()}`,
    userId: currentUser.id,
    userName: currentUser.fullName,
    userRole: currentUser.role,
    action: "Duyệt báo cáo",
    entityType: "SUBMISSION",
    entityId: `s-${taskId}-${villageId}`,
    details: `Phê duyệt chính thức biểu mẫu chỉ tiêu thôn ${villageId.replace("v", "")}. Nhận xét: "${comment}"`,
    createdAt: new Date().toISOString()
  };
  updated.auditLogs.unshift(log);

  saveDataState(updated);
  return updated;
};

// 4. Reject Report Mutator
export const rejectReport = (
  state: any, 
  taskId: string, 
  villageId: string, 
  comment: string, 
  currentUser: UserProfile
): any => {
  const updated = { ...state };

  const subIndex = updated.submissions.findIndex((s: any) => s.taskId === taskId && s.villageId === villageId);
  if (subIndex >= 0) {
    updated.submissions[subIndex] = {
      ...updated.submissions[subIndex],
      status: AssignmentStatus.CO_LOI_CAN_SUA,
      reviewComment: comment,
      updatedAt: new Date().toISOString()
    };
  }

  const assignIndex = updated.assignments.findIndex((a: any) => a.taskId === taskId && a.villageId === villageId);
  if (assignIndex >= 0) {
    updated.assignments[assignIndex] = {
      ...updated.assignments[assignIndex],
      status: AssignmentStatus.CO_LOI_CAN_SUA
    };
  }

  const notification: SystemNotification = {
    id: `n-${Date.now()}`,
    receiverVillageId: villageId,
    taskId: taskId,
    type: "REJECTED",
    title: "Yêu cầu chỉnh sửa lại số liệu",
    message: `Văn phòng Xã trả lại hồ sơ thống kê Quý II. Vui lòng rà soát lại số liệu theo chỉ dẫn: "${comment}"`,
    read: false,
    channel: "SYSTEM",
    createdAt: new Date().toISOString()
  };
  updated.notifications.unshift(notification);

  const log: AuditLog = {
    id: `log-${Date.now()}`,
    userId: currentUser.id,
    userName: currentUser.fullName,
    userRole: currentUser.role,
    action: "Trả hồ sơ nộp",
    entityType: "SUBMISSION",
    entityId: `s-${taskId}-${villageId}`,
    details: `Yêu cầu chỉnh sửa biểu mẫu thôn ${villageId.replace("v", "")}. Lý do: "${comment}"`,
    createdAt: new Date().toISOString()
  };
  updated.auditLogs.unshift(log);

  saveDataState(updated);
  return updated;
};

// 5. Extend Deadline
export const extendDeadline = (state: any, taskId: string, villageId: string, currentUser: UserProfile): any => {
  const updated = { ...state };

  const assignIndex = updated.assignments.findIndex((a: any) => a.taskId === taskId && a.villageId === villageId);
  if (assignIndex >= 0) {
    updated.assignments[assignIndex] = {
      ...updated.assignments[assignIndex],
      dueStatus: "DUNG_HAN"
    };
  }

  const notification: SystemNotification = {
    id: `n-${Date.now()}`,
    receiverVillageId: villageId,
    taskId: taskId,
    type: "REMINDER",
    title: "Đã gia hạn thời gian",
    message: "Hệ thống: Văn phòng xã đã gia hạn thời gian nộp báo cáo Quý II cho đơn vị thôn của đồng chí.",
    read: false,
    channel: "SYSTEM",
    createdAt: new Date().toISOString()
  };
  updated.notifications.unshift(notification);

  const log: AuditLog = {
    id: `log-${Date.now()}`,
    userId: currentUser.id,
    userName: currentUser.fullName,
    userRole: currentUser.role,
    action: "Gia hạn nộp báo cáo",
    entityType: "VILLAGE",
    entityId: villageId,
    details: `Đã gia hạn nộp biểu mẫu Quý II cho Trưởng thôn ${villageId.replace("v", "")}.`,
    createdAt: new Date().toISOString()
  };
  updated.auditLogs.unshift(log);

  saveDataState(updated);
  return updated;
};

// 6. Trigger Zalo simulated alerts
export const triggerZaloReminder = (state: any, taskId: string, villageId?: string, currentUser?: UserProfile): any => {
  const updated = { ...state };

  if (villageId) {
    const notification: SystemNotification = {
      id: `n-${Date.now()}`,
      receiverVillageId: villageId,
      taskId: taskId,
      type: "REMINDER",
      title: "Tin nhắn cảnh báo Zalo",
      message: "⚠️ Tin nhắn hệ thống Civigo: Đồng chí vui lòng khẩn trương rà soát 14 chỉ tiêu và nộp biểu mẫu báo cáo Quý II gửi về UBND xã.",
      read: false,
      channel: "ZALO_SIMULATED",
      createdAt: new Date().toISOString()
    };
    updated.notifications.unshift(notification);

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      userId: currentUser?.id || "system",
      userName: currentUser?.fullName || "Hệ thống",
      userRole: currentUser?.role || ("Hệ thống" as any),
      action: "Gửi tin nhắc việc Zalo",
      entityType: "VILLAGE",
      entityId: villageId,
      details: `Đã gửi tin nhắn đôn đốc qua kênh Zalo đến Trưởng thôn Thôn ${villageId.replace("v", "")}.`,
      createdAt: new Date().toISOString()
    };
    updated.auditLogs.unshift(log);
  } else {
    // Send to all unsubmitted
    const unsubmittedVillageIds = updated.assignments
      .filter((a: any) => a.taskId === taskId && a.status !== AssignmentStatus.DA_DUYET && a.status !== AssignmentStatus.DA_NOP)
      .map((a: any) => a.villageId);

    unsubmittedVillageIds.forEach((vId: string) => {
      const notification: SystemNotification = {
        id: `n-${Date.now()}-${vId}`,
        receiverVillageId: vId,
        taskId: taskId,
        type: "REMINDER",
        title: "Tin nhắn nhắc việc Zalo nhóm",
        message: "⚠️ Đôn đốc từ Văn phòng thống kê: Đề nghị đồng chí trưởng thôn hoàn thành báo cáo số liệu 14 chỉ tiêu Quý II nộp lên hệ thống xã.",
        read: false,
        channel: "ZALO_SIMULATED",
        createdAt: new Date().toISOString()
      };
      updated.notifications.unshift(notification);
    });

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      userId: currentUser?.id || "system",
      userName: currentUser?.fullName || "Hệ thống",
      userRole: currentUser?.role || ("Hệ thống" as any),
      action: "Gửi tin nhóm Zalo",
      entityType: "SYSTEM",
      entityId: "all",
      details: `Đã kích hoạt tin nhắn nhóm Zalo đôn đốc gửi đến ${unsubmittedVillageIds.length} trưởng thôn chưa nộp dữ liệu.`,
      createdAt: new Date().toISOString()
    };
    updated.auditLogs.unshift(log);
  }

  saveDataState(updated);
  return updated;
};
