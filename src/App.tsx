/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Users, CheckCircle2, AlertTriangle, Clock, MapPin, Shield, 
  Send, Database, History, FileText, LayoutDashboard, LogIn,
  MessageSquare, Sparkles, BellRing, Link, Check, AlertCircle, X, Download,
  RefreshCw, ChevronRight, Lock, Eye, EyeOff, User
} from "lucide-react";

import { 
  UserProfile, UserRole, ReportTask, Assignment, Submission, 
  AuditLog, SystemNotification, AssignmentStatus, TaskStatus
} from "./types";

import { 
  getInitialState, saveState, createNewTask, submitReport, 
  approveReport, rejectReport, extendDeadline, triggerZaloReminder,
  buildSubmissionIndicators, getActiveTeamMemberCount, getGuidedPublicServiceCitizenCount,
  MOCK_USERS
} from "./data/mockData";
import { validateReport } from "./utils/validation";

import { VILLAGES_LIST } from "./data/villages";
import { 
  writeTemplateFile, writeExcelFile, writeWordDocument, writePdfReport,
  downloadAllVillagesTemplatesZip, downloadAllSubmissionsZip
} from "./utils/exportFiles";

// Layout & Sub-Page imports
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DashboardXa from "./components/DashboardXa";
import DashboardThon from "./components/DashboardThon";
import DashboardAdmin from "./components/DashboardAdmin";
import ReportForm from "./components/ReportForm";
import ReportReviewer from "./components/ReportReviewer";
import TaskCreator from "./components/TaskCreator";
import Aggregator from "./components/Aggregator";
import SharedWarehouse from "./components/SharedWarehouse";
import NotificationsCenter from "./components/NotificationsCenter";
import AIChatbot from "./components/AIChatbot";
import Progress22Thon from "./components/Progress22Thon";
import VillageManager from "./components/VillageManager";
import AIChatDashboard from "./components/AIChatDashboard";
import DashboardToCongNghe from "./components/DashboardToCongNghe";

export default function App() {
  // 1. Core authentication states
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loginEmail, setLoginEmail] = useState("quynhnhutxqt2017@gmail.com");
  const [loginPassword, setLoginPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoleTab, setSelectedRoleTab] = useState<UserRole>(UserRole.CAN_BO_XA);

  const handleSelectRoleTab = (role: UserRole) => {
    setSelectedRoleTab(role);
    if (role === UserRole.CAN_BO_XA) {
      setLoginEmail("quynhnhutxqt2017@gmail.com");
    } else if (role === UserRole.CAN_BO_THON) {
      setLoginEmail("thon03@bana.gov.vn");
    } else if (role === UserRole.TO_CONG_NGHE) {
      setLoginEmail("tocongnghe03@bana.gov.vn");
    } else if (role === UserRole.ADMIN) {
      setLoginEmail("admin@bana.gov.vn");
    }
    setLoginPassword("123456");
  };

  // 2. Data states
  const [appState, setAppState] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 3. Drilldown navigation states
  const [activeReportTaskId, setActiveReportTaskId] = useState<string | null>(null);
  const [reviewVillageId, setReviewVillageId] = useState<string | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // 4. Simulated Zalo SMS HUD Alerts State
  const [zaloAlert, setZaloAlert] = useState<{ message: string; type: "INFO" | "SUCCESS" | "WARNING" } | null>(null);

  // Load state on mount
  useEffect(() => {
    const state = getInitialState();
    setAppState(state);
  }, []);

  // Auto persist state to local storage when changed
  useEffect(() => {
    if (appState) {
      saveState(appState);
    }
  }, [appState]);

  // Flash Zalo SMS alerts
  const flashZaloNotification = (message: string, type: "INFO" | "SUCCESS" | "WARNING" = "INFO") => {
    setZaloAlert({ message, type });
    setTimeout(() => {
      setZaloAlert(null);
    }, 5000);
  };

  // Helper login action
  const handleQuickLogin = (role: UserRole) => {
    if (!appState) return;
    
    let matchedUser: UserProfile | undefined;
    if (role === UserRole.CAN_BO_THON) {
      matchedUser = appState.users.find((u: any) => u.role === UserRole.CAN_BO_THON && u.villageId === "v03")
        || MOCK_USERS.find((u: any) => u.role === UserRole.CAN_BO_THON && u.villageId === "v03");
    } else if (role === UserRole.CAN_BO_XA) {
      matchedUser = appState.users.find((u: any) => u.role === UserRole.CAN_BO_XA)
        || MOCK_USERS.find((u: any) => u.role === UserRole.CAN_BO_XA);
    } else if (role === UserRole.TO_CONG_NGHE) {
      matchedUser = appState.users.find((u: any) => u.role === UserRole.TO_CONG_NGHE && u.villageId === "v03")
        || MOCK_USERS.find((u: any) => u.role === UserRole.TO_CONG_NGHE && u.villageId === "v03");
    } else {
      matchedUser = appState.users.find((u: any) => u.role === UserRole.ADMIN)
        || MOCK_USERS.find((u: any) => u.role === UserRole.ADMIN);
    }

    if (matchedUser) {
      // Sync to appState if not present
      if (!appState.users.some((u: any) => u.id === matchedUser!.id)) {
        const updatedState = {
          ...appState,
          users: [...appState.users, matchedUser]
        };
        setAppState(updatedState);
        saveState(updatedState);
      }
      setCurrentUser(matchedUser);
      setActiveTab("dashboard");
      flashZaloNotification(`🔐 Đăng nhập thành công với vai trò: ${matchedUser.fullName}`, "SUCCESS");
    } else {
      alert("Không tìm thấy thông tin tài khoản tương ứng.");
    }
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appState) return;

    let matched = appState.users.find((u: any) => u.email.toLowerCase() === loginEmail.toLowerCase());
    if (!matched) {
      matched = MOCK_USERS.find((u: any) => u.email.toLowerCase() === loginEmail.toLowerCase());
    }

    if (matched) {
      if (!matched.active) {
        alert("Tài khoản của đồng chí đang bị khóa bởi Quản trị viên.");
        return;
      }
      const expectedPassword = matched.password || "123456";
      if (expectedPassword !== loginPassword) {
        alert("Mật khẩu truy cập không chính xác!");
        return;
      }

      // Sync to appState if not present
      if (!appState.users.some((u: any) => u.id === matched!.id)) {
        const updatedState = {
          ...appState,
          users: [...appState.users, matched]
        };
        setAppState(updatedState);
        saveState(updatedState);
      }

      setCurrentUser(matched);
      setActiveTab("dashboard");
      flashZaloNotification(`🔐 Đăng nhập thành công: ${matched.fullName}`, "SUCCESS");
    } else {
      alert("Email tài khoản không tồn tại trên hệ thống. Thử dùng nút 'Trải nghiệm nhanh' bên dưới.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveReportTaskId(null);
    setReviewVillageId(null);
    setIsCreatingTask(false);
  };

  // 5. CORE WORKFLOW STATE WRITERS / MUTATORS
  
  // Publish report task
  const handlePublishTask = (taskPayload: any) => {
    if (!appState || !currentUser) return;

    const updatedState = createNewTask(appState, taskPayload, currentUser);
    setAppState(updatedState);
    saveState(updatedState);
    setIsCreatingTask(false);
    setActiveTab("tasks");

    flashZaloNotification("📢 Nhiệm vụ báo cáo mới được xuất bản. Đã tự động kích hoạt 22 thôn và bắn cảnh báo Zalo nhắc việc!", "SUCCESS");
  };

  // Save report draft
  const handleSaveDraft = (formData: any) => {
    if (!appState || !currentUser || !currentUser.villageId) return;

    const updatedState = { ...appState };
    const draftIndex = updatedState.submissions.findIndex(
      (s: any) => s.taskId === "t-02" && s.villageId === currentUser.villageId
    );

    const subId = draftIndex >= 0 ? updatedState.submissions[draftIndex].id : `s-${Date.now()}`;
    const submissionData: Submission = {
      id: subId,
      taskId: "t-02",
      villageId: currentUser.villageId,
      version: draftIndex >= 0 ? updatedState.submissions[draftIndex].version : 1,
      status: AssignmentStatus.BAN_NHAP,
      formData,
      indicators: buildSubmissionIndicators(subId, formData),
      validationSummary: {
        hasErrors: false,
        hasWarnings: false,
        errorCount: 0,
        warningCount: 0
      },
      submittedBy: currentUser.id,
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (draftIndex >= 0) {
      updatedState.submissions[draftIndex] = submissionData;
    } else {
      updatedState.submissions.push(submissionData);
    }

    // Update Assignment Status to draft
    const assignIndex = updatedState.assignments.findIndex(
      (a: any) => a.taskId === "t-02" && a.villageId === currentUser.villageId
    );
    if (assignIndex >= 0) {
      updatedState.assignments[assignIndex].status = AssignmentStatus.BAN_NHAP;
    }

    // Create Audit Log
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.fullName,
      userRole: currentUser.role,
      action: "Lưu bản nháp",
      entityType: "SUBMISSION",
      entityId: submissionData.id,
      details: `Lưu nháp báo cáo Tháng 07/2026 thôn ${currentUser.villageId.replace("v", "")}`,
      createdAt: new Date().toISOString()
    };
    updatedState.auditLogs.unshift(newLog);

    setAppState(updatedState);
    saveState(updatedState);
    setActiveReportTaskId(null);

    flashZaloNotification("💾 Đã lưu thành công bản nháp báo cáo lên máy chủ cục bộ.", "SUCCESS");
  };

  // Official Report Submission
  const handleOfficialSubmit = (formData: any, fileUploadedName?: string) => {
    if (!appState || !currentUser || !currentUser.villageId) return;

    const updatedState = submitReport(appState, "t-02", currentUser.villageId, formData, currentUser, fileUploadedName);
    setAppState(updatedState);
    saveState(updatedState);
    setActiveReportTaskId(null);

    flashZaloNotification(`📬 Thôn ${currentUser.villageId.replace("v", "")} đã nộp báo cáo thành công. Cán bộ xã đã nhận được số liệu!`, "SUCCESS");
  };

  // Bulk import multiple submissions
  const handleBulkSubmissionsImport = (imports: any[]) => {
    if (!appState || !currentUser) return;

    const updatedState = { ...appState };

    imports.forEach((item) => {
      const { villageId, formData, fileName } = item;

      const existingSubIndex = updatedState.submissions.findIndex(
        (s: any) => s.taskId === "t-02" && s.villageId === villageId
      );
      const version = existingSubIndex >= 0 ? updatedState.submissions[existingSubIndex].version + 1 : 1;

      const prevSub = updatedState.submissions.find((s: any) => s.taskId === "t-01" && s.villageId === villageId);
      const prevData = prevSub?.formData;

      const teamCount = getActiveTeamMemberCount(villageId);
      const supportCount = getGuidedPublicServiceCitizenCount(villageId);

      const { issues } = validateReport(formData, prevData, `s-02-${villageId}`, {
        activeDigitalTeamMemberCount: teamCount,
        activeOnlineSupportCitizenCount: supportCount
      });

      const hasErrors = issues.some((i: any) => i.severity === "ERROR");
      const hasWarnings = issues.some((i: any) => i.severity === "WARNING");

      // Format clean formData with proper indicators mapped
      const cleanForm: Record<string, any> = {
        villageName: (appState?.villages || VILLAGES_LIST).find((v: any) => v.id === villageId)?.name || "",
        reportingPeriod: "Quý II năm 2026",
        reporterName: formData.reporterName || "Trưởng thôn",
        reporterTitle: formData.reporterTitle || "Trưởng thôn",
        phone: formData.phone || "0912345678",
        reportDate: formData.reportDate || new Date().toLocaleDateString("vi-VN"),
        notes: formData.notes || `Được nhập hàng loạt từ tệp: ${fileName}`
      };

      // Fill indicators
      const codes = ["CT01", "CT02", "CT03", "CT04", "CT05", "CT06", "CT07", "CT08", "CT09", "CT10", "CT11", "CT12", "CT13", "CT14"];
      codes.forEach(code => {
        cleanForm[code] = formData[code] !== undefined ? formData[code] : "";
      });

      const newSubmission: Submission = {
        id: `s-02-${villageId}`,
        taskId: "t-02",
        villageId: villageId,
        version: version,
        status: hasErrors ? AssignmentStatus.CO_LOI_CAN_SUA : AssignmentStatus.DA_NOP,
        formData: cleanForm,
        uploadedFileName: fileName,
        indicators: buildSubmissionIndicators(`s-02-${villageId}`, cleanForm),
        validationSummary: {
          hasErrors,
          hasWarnings,
          errorCount: issues.filter((i: any) => i.severity === "ERROR").length,
          warningCount: issues.filter((i: any) => i.severity === "WARNING").length
        },
        anomalyConfirmations: hasWarnings ? [
          { field: "CT01", reason: cleanForm.notes || "Giải trình biến động số liệu tự động qua tệp nhập đồng loạt." }
        ] : [],
        submittedBy: currentUser.id,
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (existingSubIndex >= 0) {
        updatedState.submissions[existingSubIndex] = newSubmission;
      } else {
        updatedState.submissions.push(newSubmission);
      }

      // Update Assignment status
      const assignIndex = updatedState.assignments.findIndex(
        (a: any) => a.taskId === "t-02" && a.villageId === villageId
      );
      if (assignIndex >= 0) {
        updatedState.assignments[assignIndex] = {
          ...updatedState.assignments[assignIndex],
          status: hasErrors ? AssignmentStatus.CO_LOI_CAN_SUA : AssignmentStatus.DA_NOP,
          submittedAt: new Date().toISOString(),
          currentSubmissionId: `s-02-${villageId}`
        };
      }

      // Audit log
      const vName = (appState?.villages || VILLAGES_LIST).find((v: any) => v.id === villageId)?.name || "Thôn";
      const log: AuditLog = {
        id: `log-${Date.now()}-${villageId}`,
        userId: currentUser.id,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: "Nộp báo cáo đồng loạt",
        entityType: "SUBMISSION",
        entityId: `s-02-${villageId}`,
        details: `Đã nhập và kiểm chéo tệp biểu mẫu ${fileName} cho thôn ${vName}.`,
        createdAt: new Date().toISOString()
      };
      updatedState.auditLogs.unshift(log);
    });

    setAppState(updatedState);
    saveState(updatedState);
    flashZaloNotification(`📂 Đã hoàn tất đối chéo & nhập đồng loạt ${imports.length} báo cáo thôn thành công!`, "SUCCESS");
  };

  // Approve Report
  const handleApproveReport = (comment: string) => {
    if (!appState || !currentUser || !reviewVillageId) return;

    const updatedState = approveReport(appState, "t-02", reviewVillageId, comment, currentUser);
    setAppState(updatedState);
    saveState(updatedState);
    setReviewVillageId(null);

    flashZaloNotification(`✅ Phê duyệt thành công báo cáo Thôn ${reviewVillageId.replace("v", "")}. Hệ thống đã bắn tin nhắn Zalo phản hồi trưởng thôn!`, "SUCCESS");
  };

  // Reject Report (Request revisions)
  const handleRejectReport = (comment: string) => {
    if (!appState || !currentUser || !reviewVillageId) return;

    const updatedState = rejectReport(appState, "t-02", reviewVillageId, comment, currentUser);
    setAppState(updatedState);
    saveState(updatedState);
    setReviewVillageId(null);

    flashZaloNotification(`⚠️ Đã trả hồ sơ Thôn ${reviewVillageId.replace("v", "")}. Yêu cầu sửa đổi kèm lý do: "${comment}"`, "WARNING");
  };

  // simulated single Zalo transmission
  const handleTriggerZaloSingle = (villageId?: string) => {
    if (!appState || !currentUser) return;
    
    const updatedState = triggerZaloReminder(appState, "t-02", villageId, currentUser);
    setAppState(updatedState);
    saveState(updatedState);

    const dest = villageId ? `Thôn ${villageId.replace("v", "")}` : "tất cả các thôn chưa nộp";
    flashZaloNotification(`💬 Giả lập SMS: Đã phát tín hiệu nhắc việc đến trưởng thôn ${dest}.`, "INFO");
  };

  // Deadline manual extensions
  const handleExtendDeadlineSingle = (villageId: string) => {
    if (!appState || !currentUser) return;

    const updatedState = extendDeadline(appState, "t-02", villageId, currentUser);
    setAppState(updatedState);
    saveState(updatedState);

    flashZaloNotification(`⏰ Đã tự động gia hạn thêm 03 ngày nộp báo cáo cho Thôn ${villageId.replace("v", "")}.`, "SUCCESS");
  };

  // Run Cron/Deadline Checker manually on click
  const handleRunDeadlineChecker = () => {
    if (!appState) return;

    const updatedState = { ...appState };
    let overdueCount = 0;

    updatedState.assignments = updatedState.assignments.map((a: any) => {
      if (a.taskId === "t-02" && a.status !== AssignmentStatus.DA_DUYET && a.status !== AssignmentStatus.DA_NOP) {
        overdueCount++;
        return {
          ...a,
          status: AssignmentStatus.NOP_QUA_HAN,
          dueStatus: "QUA_HAN"
        };
      }
      return a;
    });

    if (overdueCount > 0) {
      // Create Audit Log
      const newLog: AuditLog = {
        id: `log-${Date.now()}`,
        userId: "system",
        userName: "Cron Job Tự Động",
        userRole: "Hệ thống" as any,
        action: "Kiểm tra hạn chót",
        entityType: "SYSTEM",
        entityId: "cron",
        details: `Phát hiện ${overdueCount} thôn quá hạn nộp báo cáo Tháng 07/2026. Đã chuyển trạng thái sang Quá Hạn.`,
        createdAt: new Date().toISOString()
      };
      updatedState.auditLogs.unshift(newLog);

      // Create notification
      const newNotif: SystemNotification = {
        id: `notif-${Date.now()}`,
        title: "Kiểm toán hạn chót báo cáo",
        message: `Phát hiện ${overdueCount} thôn quá hạn nộp Tháng 07/2026. Đã tự động gắn thẻ Cảnh báo trễ hạn.`,
        type: "WARNING",
        read: false,
        channel: "SYSTEM",
        createdAt: new Date().toISOString()
      };
      updatedState.notifications.unshift(newNotif);

      setAppState(updatedState);
      saveState(updatedState);
      flashZaloNotification(`🤖 Trình quét tự động: Đã quét hạn chót. Chuyển ${overdueCount} thôn chưa nộp sang trạng thái "Quá Hạn"!`, "WARNING");
    } else {
      flashZaloNotification("🤖 Trình quét tự động: Không có thêm thôn nào bị quá hạn.", "INFO");
    }
  };

  // Notifications clearing
  const handleClearNotifications = () => {
    if (!appState) return;
    const updatedState = { ...appState };
    updatedState.notifications = updatedState.notifications.map((n: any) => ({ ...n, read: true }));
    setAppState(updatedState);
    saveState(updatedState);
  };

  // Add User Profile
  const handleAddUser = (userPayload: Partial<UserProfile>) => {
    if (!appState || !currentUser) return;

    const updatedState = { ...appState };
    const newUser: UserProfile = {
      id: `u-${Date.now()}`,
      fullName: userPayload.fullName || "",
      email: userPayload.email || "",
      role: userPayload.role || UserRole.CAN_BO_THON,
      villageId: userPayload.villageId,
      avatarUrl: userPayload.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    updatedState.users.push(newUser);

    // Audit log
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.fullName,
      userRole: currentUser.role,
      action: "Tạo người dùng",
      entityType: "USER",
      entityId: newUser.id,
      details: `Phát hành tài khoản mới cho cán bộ: ${newUser.fullName} (${newUser.email})`,
      createdAt: new Date().toISOString()
    };
    updatedState.auditLogs.unshift(newLog);

    setAppState(updatedState);
    saveState(updatedState);
    flashZaloNotification(`👤 Thêm tài khoản mới thành công: ${newUser.fullName}`, "SUCCESS");
  };

  // Toggle User Activations
  const handleToggleUserActive = (userId: string) => {
    if (!appState || !currentUser) return;

    const updatedState = { ...appState };
    const userIndex = updatedState.users.findIndex((u: any) => u.id === userId);

    if (userIndex >= 0) {
      const u = updatedState.users[userIndex];
      u.active = !u.active;

      // Audit log
      const newLog: AuditLog = {
        id: `log-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: u.active ? "Mở khóa tài khoản" : "Khóa tài khoản",
        entityType: "USER",
        entityId: userId,
        details: `Cập nhật trạng thái tài khoản cán bộ: ${u.fullName}`,
        createdAt: new Date().toISOString()
      };
      updatedState.auditLogs.unshift(newLog);

      setAppState(updatedState);
      saveState(updatedState);
      flashZaloNotification(`👤 Cập nhật tài khoản cán bộ: ${u.fullName}`, "INFO");
    }
  };

  // Toggle Village connection states
  const handleToggleVillageActive = (villageId: string) => {
    if (!appState || !currentUser) return;

    const updatedState = { ...appState };
    const villageIndex = updatedState.villages.findIndex((v: any) => v.id === villageId);

    if (villageIndex >= 0) {
      const v = updatedState.villages[villageIndex];
      v.active = !v.active;

      // Audit log
      const newLog: AuditLog = {
        id: `log-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: v.active ? "Mở kết nối thôn" : "Hạ liên kết thôn",
        entityType: "VILLAGE",
        entityId: villageId,
        details: `Cập nhật cổng kết nối chỉ số tại đơn vị: ${v.name}`,
        createdAt: new Date().toISOString()
      };
      updatedState.auditLogs.unshift(newLog);

      setAppState(updatedState);
      saveState(updatedState);
      flashZaloNotification(`🗺️ Cập nhật trạng thái kết nối đơn vị: ${v.name}`, "INFO");
    }
  };

  // 6. SPREADSHEET WRITING CALLS (XLSX, DOCX, PDF)

  const handleDownloadTemplateFile = () => {
    writeTemplateFile();
    flashZaloNotification("📥 Đã tải thành công file Excel biểu mẫu (.xlsx) xuống thiết bị.", "SUCCESS");
  };

  const handleExportExcelSummary = (selectedIds: string[]) => {
    if (!appState) return;
    const subs = appState.submissions.filter((s: any) => s.taskId === "t-02" && selectedIds.includes(s.villageId));
    writeExcelFile(subs, appState.villages, appState.issues || [], appState.auditLogs, "Tháng 07/2026");
    flashZaloNotification("📊 Đã biên soạn và tải bảng tổng hợp Excel 22 thôn.", "SUCCESS");
  };

  const handleExportWordNarrative = (selectedIds: string[]) => {
    if (!appState) return;
    const subs = appState.submissions.filter((s: any) => s.taskId === "t-02" && selectedIds.includes(s.villageId));
    writeWordDocument(subs, appState.villages, "Tháng 07/2026", "Báo cáo dân số và hộ dân");
    flashZaloNotification("📝 Đã tổng hợp văn bản thuyết minh Word (.docx) UBND Xã.", "SUCCESS");
  };

  const handleExportPdfMinute = (selectedIds: string[]) => {
    if (!appState) return;
    const subs = appState.submissions.filter((s: any) => s.taskId === "t-02" && selectedIds.includes(s.villageId));
    writePdfReport(subs, appState.villages, "Tháng 07/2026", "Báo cáo dân số và hộ dân");
    flashZaloNotification("📕 Đã xuất bản và tải quyết định PDF phê duyệt có đóng dấu.", "SUCCESS");
  };

  const handleDownloadSingleVillageExcel = (villageId: string) => {
    if (!appState) return;
    const sub = appState.submissions.find((s: any) => s.taskId === "t-01" && s.villageId === villageId);
    if (sub) {
      writeExcelFile([sub], appState.villages, [], appState.auditLogs, "Tháng 06/2026 (Thôn)");
      flashZaloNotification(`📊 Tải thành công lưu trữ Excel Thôn ${villageId.replace("v", "")}`, "SUCCESS");
    } else {
      alert("Không tìm thấy dữ liệu lưu trữ cho thôn này.");
    }
  };

  const handleDownloadAllTemplatesZip = () => {
    if (!appState) return;
    downloadAllVillagesTemplatesZip(appState.villages, "Quý II năm 2026");
    flashZaloNotification("📦 Đã đóng gói và tải thành công bộ mẫu Excel 22 thôn (.zip).", "SUCCESS");
  };

  const handleDownloadAllSubmissionsZip = () => {
    if (!appState) return;
    const t02Subs = appState.submissions.filter((s: any) => s.taskId === "t-02");
    downloadAllSubmissionsZip(t02Subs, appState.villages, "Quý II năm 2026");
    flashZaloNotification("📦 Đã đóng gói và tải thành công toàn bộ báo cáo đã nộp dạng (.zip).", "SUCCESS");
  };

  const handleDownloadCommuneSummaryArchives = (type: "xlsx" | "docx") => {
    if (!appState) return;
    const t01Subs = appState.submissions.filter((s: any) => s.taskId === "t-01");
    if (type === "xlsx") {
      writeExcelFile(t01Subs, appState.villages, [], appState.auditLogs, "Tháng 06/2026");
    } else {
      writeWordDocument(t01Subs, appState.villages, "Tháng 06/2026", "Báo cáo dân số và hộ dân");
    }
    flashZaloNotification(`📁 Đã giải nén lưu trữ Tháng 06/2026 dạng .${type}`, "SUCCESS");
  };


  // 7. VIEW ROUTERS RENDERING

  if (!appState) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 font-sans">
        <div className="text-center space-y-4">
          <RefreshCw className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-gray-500">Đang đồng bộ cơ sở dữ liệu Civigo...</p>
        </div>
      </div>
    );
  }

  // Login View Router
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans overflow-hidden select-none relative animate-fade-in">
        {/* Left Pane - Brand Showcase & Vector Landscape */}
        <div className="lg:w-[42%] bg-[#F4F7FB] border-r border-slate-200/60 p-12 flex flex-col justify-between relative overflow-hidden hidden lg:flex">
          {/* Top Brand Block */}
          <div className="space-y-6">
            <div className="flex items-center gap-3.5">
              {/* Vietnam emblem SVG */}
              <div className="w-11 h-11 bg-white p-1 rounded-xl shadow-md border border-slate-100 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-9 h-9">
                  <circle cx="50" cy="50" r="45" fill="#da251d" />
                  <polygon points="50,15 59,41 86,41 64,57 72,83 50,67 28,83 36,57 14,41 41,41" fill="#ffff00" />
                  <path d="M 25,82 Q 50,92 75,82" stroke="#ffff00" strokeWidth="4" fill="none" />
                </svg>
              </div>
              <div>
                <h1 className="font-extrabold text-sm text-slate-800 tracking-tight uppercase leading-none">Civigo</h1>
                <p className="text-[9px] text-blue-600 font-black uppercase tracking-wider mt-1">Dữ liệu Thôn – Xã Thông Minh</p>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-tight">
                KẾT NỐI DỮ LIỆU – <br/>
                QUẢN LÝ THÔNG MINH
              </h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm">
                Nền tảng AI đồng bộ, thẩm định chỉ tiêu kinh tế - xã hội thời gian thực, thúc đẩy chuyển đổi số cấp cơ sở xã Bà Nà.
              </p>
            </div>
          </div>

          {/* Core App Highlights */}
          <div className="space-y-5 my-6">
            <div className="flex gap-3.5 items-start">
              <div className="p-2 bg-blue-100/60 text-blue-600 rounded-lg mt-0.5">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-800">Quản lý báo cáo tập trung</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Thu thập và đối soát chỉ tiêu hộ tịch, tộc dân từ 22 thôn nhanh chóng.</p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <div className="p-2 bg-blue-100/60 text-blue-600 rounded-lg mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-800">Phát hiện bất thường bằng AI</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Thuật toán thông minh tự động tìm lỗi logic, kiểm chéo dữ liệu đầu vào.</p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <div className="p-2 bg-blue-100/60 text-blue-600 rounded-lg mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-800">Xuất hồ sơ chuẩn hóa tự động</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Tổng hợp báo cáo, xuất file biểu mẫu Excel, Word và PDF theo đúng quy chuẩn.</p>
              </div>
            </div>
          </div>

          {/* Scenic Mountain SVG Vector Illustration */}
          <div className="opacity-90 select-none pointer-events-none mt-auto pt-6 border-t border-slate-200/40">
            <svg viewBox="0 0 400 160" className="w-full h-36">
              {/* Mountain silhouettes */}
              <path d="M -20,160 Q 70,60 160,160" fill="#cbd5e1" opacity="0.35" />
              <path d="M 80,160 Q 180,45 280,160" fill="#94a3b8" opacity="0.25" />
              <path d="M 200,160 Q 300,70 400,160" fill="#cbd5e1" opacity="0.45" />
              
              {/* Cable car cable line */}
              <line x1="0" y1="40" x2="400" y2="85" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
              {/* Cable car cabin */}
              <g transform="translate(190, 52)">
                <rect x="0" y="5" width="16" height="12" rx="2.5" fill="#2563eb" />
                <rect x="2" y="7" width="5" height="4" rx="0.5" fill="#eff6ff" />
                <rect x="9" y="7" width="5" height="4" rx="0.5" fill="#eff6ff" />
                <line x1="8" y1="0" x2="8" y2="5" stroke="#475569" strokeWidth="1.2" />
              </g>
              
              {/* Forest trees outline */}
              <g transform="translate(45, 125)">
                <polygon points="8,0 0,16 16,16" fill="#047857" opacity="0.9" />
                <rect x="6.5" y="16" width="3" height="4" fill="#78350f" />
              </g>
              <g transform="translate(325, 120)">
                <polygon points="8,0 0,16 16,16" fill="#047857" opacity="0.8" />
                <rect x="6.5" y="16" width="3" height="4" fill="#78350f" />
              </g>
              <rect x="0" y="145" width="400" height="15" fill="#cbd5e1" />
            </svg>
          </div>
        </div>

        {/* Right Pane - Standard Login Form & Interactive Demo Roles */}
        <div className="flex-1 p-6 md:p-16 flex flex-col justify-center items-center bg-white relative overflow-y-auto">
          {/* Demonstration Mode Capsulation */}
          <div className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100/60 rounded-full text-[10px] font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>Chế độ trình diễn</span>
          </div>

          <div className="max-w-md w-full space-y-7">
            {/* Logo Mobile Block (Shown only on small screens) */}
            <div className="flex lg:hidden items-center gap-3 justify-center mb-6">
              <div className="w-10 h-10 bg-[#da251d] p-1.5 rounded-lg flex items-center justify-center shadow-md">
                <svg viewBox="0 0 100 100" className="w-8 h-8">
                  <polygon points="50,15 59,41 86,41 64,57 72,83 50,67 28,83 36,57 14,41 41,41" fill="#ffff00" />
                </svg>
              </div>
              <div className="text-left">
                <h1 className="font-extrabold text-sm text-slate-800 uppercase leading-none">Civigo</h1>
                <p className="text-[9px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">Dữ liệu Thôn – Xã Thông Minh</p>
              </div>
            </div>

            {/* Title Greeting Header */}
            <div className="space-y-1.5 text-left">
              <h3 className="text-xl font-extrabold text-slate-800 tracking-tight uppercase">Đăng nhập hệ thống</h3>
              <p className="text-xs text-slate-400 font-semibold">Chào mừng bạn trở lại! Đồng chí vui lòng chọn vai trò làm việc để tiếp tục.</p>
            </div>

            {/* Stateful Role Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 text-left">
              {[
                { role: UserRole.CAN_BO_XA, label: "Cán bộ Xã", desc: "Thẩm định & đôn đốc", color: "blue" },
                { role: UserRole.CAN_BO_THON, label: "Cán bộ Thôn", desc: "Khai báo số liệu", color: "emerald" },
                { role: UserRole.TO_CONG_NGHE, label: "Tổ Công nghệ số", desc: "Hỗ trợ công dân số", color: "indigo" },
                { role: UserRole.ADMIN, label: "Quản trị viên", desc: "Giám sát & cấu hình", color: "slate" }
              ].map((tab) => {
                const isActive = selectedRoleTab === tab.role;
                let activeClass = "";
                if (tab.color === "blue") activeClass = isActive ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/15" : "hover:bg-slate-50 bg-white border-slate-200 text-slate-700";
                if (tab.color === "emerald") activeClass = isActive ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/15" : "hover:bg-slate-50 bg-white border-slate-200 text-slate-700";
                if (tab.color === "indigo") activeClass = isActive ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/15" : "hover:bg-slate-50 bg-white border-slate-200 text-slate-700";
                if (tab.color === "slate") activeClass = isActive ? "bg-slate-700 text-white border-slate-700 shadow-md shadow-slate-700/15" : "hover:bg-slate-50 bg-white border-slate-200 text-slate-700";
                
                return (
                  <button
                    key={tab.role}
                    type="button"
                    onClick={() => handleSelectRoleTab(tab.role)}
                    className={`p-2.5 border rounded-xl text-left transition-all cursor-pointer ${activeClass}`}
                  >
                    <p className="font-extrabold text-xs">{tab.label}</p>
                    <p className="text-[9px] opacity-75 mt-0.5 font-medium">{tab.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Live Form Submissions */}
            <form onSubmit={handleManualLogin} className="space-y-4 text-left">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-blue-600 font-bold text-[10px] uppercase tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                  <span>Quyền hạn vai trò: {selectedRoleTab === UserRole.CAN_BO_XA ? "Cán bộ Xã" : selectedRoleTab === UserRole.CAN_BO_THON ? "Cán bộ Thôn" : selectedRoleTab === UserRole.TO_CONG_NGHE ? "Tổ Công nghệ" : "Quản trị viên"}</span>
                </div>
                <p className="text-slate-500 text-[10px] leading-relaxed font-semibold">
                  {selectedRoleTab === UserRole.CAN_BO_XA && "Thẩm định báo cáo số liệu của 22 thôn, phê duyệt/trả lại biểu mẫu, đôn đốc tiến độ nộp của các trưởng thôn."}
                  {selectedRoleTab === UserRole.CAN_BO_THON && "Khai báo và nộp trực tuyến biểu mẫu 14 chỉ tiêu định kỳ Quý II/2026, xem lịch sử phiên bản báo cáo."}
                  {selectedRoleTab === UserRole.TO_CONG_NGHE && "Cập nhật hồ sơ Tổ CNSCĐ thôn, quản lý thông tin thành viên, ghi nhận lịch sử hoạt động hỗ trợ số."}
                  {selectedRoleTab === UserRole.ADMIN && "Kiểm tra giám sát hệ thống thông qua Audit Logs, phân quyền cán bộ, cài đặt các chỉ tiêu số."}
                </p>
                <div className="pt-2 border-t border-slate-200/50 flex justify-between text-[9px] text-slate-400 font-bold font-mono">
                  <span>Email: {loginEmail}</span>
                  <span>Mật khẩu: 123456</span>
                </div>
              </div>

              {/* Email Input Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email công vụ của đồng chí</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="ví dụ: thon01@bana.gov.vn"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none font-semibold text-slate-700 transition-colors"
                  />
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              {/* Password Input Field with Visibility Toggle */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mật khẩu truy cập</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none font-mono text-slate-700 transition-colors"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 hover:text-slate-600 text-slate-400 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Keep Logged In & Forgot Password */}
              <div className="flex justify-between items-center pt-1 text-[11px]">
                <label className="flex items-center gap-1.5 font-semibold text-slate-500 cursor-pointer select-none">
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                  <span>Ghi nhớ phiên làm việc</span>
                </label>
                <a href="#" className="font-bold text-blue-600 hover:text-blue-700">Quên mật khẩu?</a>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-500/10 transition-all active:scale-[0.99] uppercase tracking-wide flex items-center justify-center gap-1.5 focus:outline-none mt-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập ngay</span>
              </button>
            </form>

            {/* Quick Demo roles layout - matches Screenshot 1 perfectly */}
            <div className="space-y-4 pt-4 border-t border-slate-100 text-left">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Trải nghiệm phân quyền hệ thống:</span>
              
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  onClick={() => handleQuickLogin(UserRole.TO_CONG_NGHE)}
                  className="w-full p-3 bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-blue-300 text-left rounded-xl transition-all flex items-center justify-between shadow-sm border-l-4 border-l-blue-600"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-xs text-slate-800">Tổ trưởng Tổ Công nghệ số T03 (Nguyễn Văn A)</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Hỗ trợ người dân, dịch vụ công trực tuyến, hoạt động tổ.</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleQuickLogin(UserRole.CAN_BO_THON)}
                  className="w-full p-3 bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-slate-300 text-left rounded-xl transition-all flex items-center justify-between shadow-sm border-l-4 border-l-emerald-500"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-xs text-slate-800">Trưởng thôn T03 (Nguyễn Văn Tài)</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Nhập số liệu biểu mẫu dân cư, nhận phản hồi sửa đổi.</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleQuickLogin(UserRole.CAN_BO_XA)}
                  className="w-full p-3 bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-slate-300 text-left rounded-xl transition-all flex items-center justify-between shadow-sm border-l-4 border-l-indigo-500"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-xs text-slate-800">Cán bộ chuyên trách (Cán bộ Xã)</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Thẩm định báo cáo, đôn đốc qua Zalo, xuất file báo cáo.</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleQuickLogin(UserRole.ADMIN)}
                  className="w-full p-3 bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-slate-300 text-left rounded-xl transition-all flex items-center justify-between shadow-sm border-l-4 border-l-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-xs text-slate-800">Quản trị viên (Nguyễn Văn Hải)</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Quản lý tài khoản, kết nối thôn, cấu hình chỉ số.</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>


              </div>
            </div>

            {/* Footer Support Tag */}
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-semibold pt-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Hệ thống hoạt động ổn định trên 22 thôn xã Bà Nà</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Main Logged-In Flow Layout
  return (
    <div className="min-h-screen bg-gray-50/50 flex text-gray-800 font-sans relative">
      
      {/* 1. ZALO SMS HUD Toast Panel */}
      {zaloAlert && (
        <div id="zalo-hud-alert" className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 max-w-lg w-full px-4 animate-bounce-short">
          <div className={`p-3.5 rounded-2xl shadow-2xl border flex items-start gap-3 text-xs leading-relaxed ${
            zaloAlert.type === "SUCCESS" ? "bg-teal-950 text-teal-300 border-teal-800/60" :
            (zaloAlert.type === "WARNING" ? "bg-amber-950 text-amber-300 border-amber-800/60" : "bg-blue-950 text-blue-300 border-blue-800/60")
          }`}>
            <MessageSquare className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-yellow-300" />
            <div className="flex-1">
              <span className="font-extrabold block mb-0.5 text-yellow-300">💬 HỆ THỐNG GIẢ LẬP ZALO ALERT:</span>
              <p className="font-semibold">{zaloAlert.message}</p>
            </div>
            <button onClick={() => setZaloAlert(null)} className="p-1 hover:bg-white/10 rounded-full">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Side Menu Drawer */}
      <Sidebar
        currentUser={currentUser}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          // Reset sub views on tab shifts
          setActiveReportTaskId(null);
          setReviewVillageId(null);
          setIsCreatingTask(false);
          setActiveTab(tab);
          setSidebarOpen(false);
        }}
        isOpen={sidebarOpen}
      />

      {/* Backdrop overlay for mobile sidebars */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}

      {/* 3. Main content body panel */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentUser={currentUser}
          notifications={appState.notifications}
          onLogout={handleLogout}
          onViewNotifications={() => setActiveTab("notifications")}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onClearNotifications={handleClearNotifications}
        />

        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* MULTI ROUTING LOGIC */}

          {/* SECTION A: DRILL-DOWN SUB PAGES */}

          {/* A1: Village direct Web Reporting form */}
          {activeReportTaskId && currentUser.role === UserRole.CAN_BO_THON && (
            <ReportForm
              task={appState.tasks.find((t: any) => t.id === activeReportTaskId)!}
              villageId={currentUser.villageId!}
              villageName={(appState?.villages || VILLAGES_LIST).find((v: any) => v.id === currentUser.villageId)?.name || ""}
              leaderName={currentUser.fullName}
              previousSubmission={appState.submissions.find((s: any) => s.taskId === "t-01" && s.villageId === currentUser.villageId)}
              currentSubmissionDraft={appState.submissions.find((s: any) => s.taskId === activeReportTaskId && s.villageId === currentUser.villageId)}
              activeDigitalTeamMemberCount={getActiveTeamMemberCount(currentUser.villageId!, appState.teamMembers)}
              activeOnlineSupportCitizenCount={getGuidedPublicServiceCitizenCount(currentUser.villageId!, appState.supportRequests)}
              onSaveDraft={handleSaveDraft}
              onSubmitReport={handleOfficialSubmit}
              onCancel={() => setActiveReportTaskId(null)}
              onDownloadTemplate={handleDownloadTemplateFile}
            />
          )}

          {/* A2: Commune report reviewer deck */}
          {reviewVillageId && currentUser.role === UserRole.CAN_BO_XA && (
            <ReportReviewer
              submission={appState.submissions.find((s: any) => s.taskId === "t-02" && s.villageId === reviewVillageId)!}
              assignment={appState.assignments.find((a: any) => a.taskId === "t-02" && a.villageId === reviewVillageId)!}
              task={appState.tasks.find((t: any) => t.id === "t-02")!}
              previousSubmission={appState.submissions.find((s: any) => s.taskId === "t-01" && s.villageId === reviewVillageId)}
              onApprove={handleApproveReport}
              onReject={handleRejectReport}
              onCancel={() => setReviewVillageId(null)}
              onExportWord={() => handleExportWordNarrative([reviewVillageId])}
              onExportPdf={() => handleExportPdfMinute([reviewVillageId])}
            />
          )}

          {/* A3: Create task flow page */}
          {isCreatingTask && currentUser.role === UserRole.CAN_BO_XA && (
            <TaskCreator
              villages={appState.villages}
              onPublishTask={handlePublishTask}
              onCancel={() => setIsCreatingTask(false)}
            />
          )}

          {/* SECTION B: CORE STATIC TAB PAGES */}

          {!activeReportTaskId && !reviewVillageId && !isCreatingTask && (
            <>
              {/* Technology Team (Tổ công nghệ) Dashboard */}
              {currentUser.role === UserRole.TO_CONG_NGHE && (
                <DashboardToCongNghe
                  currentUser={currentUser}
                  activeTab={activeTab}
                  systemData={appState}
                  onUpdateState={setAppState}
                  onFlashNotification={flashZaloNotification}
                />
              )}

              {/* Village Officer Tabs: dashboard, tasks, input_report, history */}
              {currentUser.role === UserRole.CAN_BO_THON && ["dashboard", "tasks", "input_report", "history"].includes(activeTab) && (
                <DashboardThon
                  activeTab={activeTab}
                  assignments={appState.assignments}
                  submissions={appState.submissions}
                  tasks={appState.tasks}
                  villageId={currentUser.villageId!}
                  onSelectTaskToReport={(taskId) => setActiveReportTaskId(taskId)}
                  onDownloadTemplate={handleDownloadTemplateFile}
                  onUploadExcelClick={(taskId) => {
                    setActiveReportTaskId(taskId);
                    alert("Đồng chí hãy kéo thả hoặc chọn file Excel trong cửa sổ chỉnh sửa trực tiếp sắp mở để nạp tự động.");
                  }}
                  onSelectTab={(tab) => {
                    setActiveTab(tab);
                  }}
                />
              )}

              {/* Tab: Dashboard */}
              {activeTab === "dashboard" && (
                <>
                  {currentUser.role === UserRole.CAN_BO_XA && (
                    <DashboardXa
                      assignments={appState.assignments}
                      submissions={appState.submissions}
                      villages={appState.villages}
                      onTriggerZaloReminder={handleTriggerZaloSingle}
                      onExtendDeadline={handleExtendDeadlineSingle}
                      onSelectVillageToReview={(vId) => setReviewVillageId(vId)}
                      onRunDeadlineChecker={handleRunDeadlineChecker}
                      onInitiateCreateTask={() => setIsCreatingTask(true)}
                      onBulkSubmissionsImport={handleBulkSubmissionsImport}
                      onDownloadAllTemplatesZip={handleDownloadAllTemplatesZip}
                      onDownloadAllSubmissionsZip={handleDownloadAllSubmissionsZip}
                    />
                  )}

                  {currentUser.role === UserRole.ADMIN && (
                    <DashboardAdmin
                      users={appState.users}
                      villages={appState.villages}
                      auditLogs={appState.auditLogs}
                      onAddUser={handleAddUser}
                      onToggleUserActive={handleToggleUserActive}
                      onToggleVillageActive={handleToggleVillageActive}
                    />
                  )}
                </>
              )}

              {/* Tab: Task Manager (Cán bộ xã) */}
              {activeTab === "tasks" && currentUser.role === UserRole.CAN_BO_XA && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">Quản lý nhiệm vụ thu chỉ tiêu</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Danh sách chiến dịch nộp chỉ tiêu dân tộc hộ khẩu.</p>
                    </div>

                    <button
                      onClick={() => setIsCreatingTask(true)}
                      className="flex items-center gap-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md focus:outline-none"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Phát hành nhiệm vụ mới
                    </button>
                  </div>

                  <div className="space-y-4">
                    {appState.tasks.map((task: any) => {
                      const countAssigned = appState.assignments.filter((a: any) => a.taskId === task.id).length;
                      return (
                        <div key={task.id} className="p-5 bg-white border border-gray-100 shadow-sm rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                          <div className="space-y-1.5">
                            <span className="px-2 py-0.5 bg-gray-100 border text-gray-500 font-bold font-mono rounded text-[9px]">{task.code}</span>
                            <h4 className="font-extrabold text-sm text-gray-800">{task.title}</h4>
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed max-w-xl">{task.description}</p>
                            <span className="text-[10px] text-gray-400 font-medium block">Kỳ hạn nộp: 11/07/2026 • Giao cho: {countAssigned} thôn liên kết</span>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase border ${
                              task.status === TaskStatus.DA_PHAT_HANH ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-gray-50 text-gray-400"
                            }`}>
                              Đang thực hiện
                            </span>
                            
                            <button
                              onClick={() => {
                                // Navigate to overall dashboard for detail lookup
                                setActiveTab("dashboard");
                              }}
                              className="px-3.5 py-1.5 bg-gray-50 border hover:bg-gray-100 rounded-lg text-gray-600 font-bold text-xs"
                            >
                              Theo dõi tiến độ
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab: Progress list 22 thôn (Cán bộ xã redirection) */}
              {activeTab === "progress" && currentUser.role === UserRole.CAN_BO_XA && (
                <Progress22Thon
                  onTriggerZaloReminder={handleTriggerZaloSingle}
                  onExtendDeadline={handleExtendDeadlineSingle}
                  onSelectVillageToReview={(vId) => setReviewVillageId(vId)}
                />
              )}

              {/* Tab: Review list (Duyệt báo cáo) */}
              {activeTab === "review" && currentUser.role === UserRole.CAN_BO_XA && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">Phê duyệt báo cáo Thôn</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Danh sách các báo cáo số liệu dân tộc, hộ khẩu Tháng 07/2026 đang chờ thẩm duyệt hoặc cần sửa đổi.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(appState?.villages || VILLAGES_LIST).map((v: any) => {
                      const assign = appState.assignments.find((a: any) => a.taskId === "t-02" && a.villageId === v.id);
                      const sub = appState.submissions.find((s: any) => s.taskId === "t-02" && s.villageId === v.id);
                      
                      const isSubmitted = assign?.status === AssignmentStatus.DA_NOP;
                      const isApproved = assign?.status === AssignmentStatus.DA_DUYET;
                      const hasError = assign?.status === AssignmentStatus.CO_LOI_CAN_SUA;
                      
                      return (
                        <div key={v.id} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-sm text-gray-800">{v.name}</h4>
                                <p className="text-[10px] text-gray-400">Trưởng thôn: {v.leaderName}</p>
                              </div>
                              {isApproved ? (
                                <span className="px-2 py-0.5 bg-green-50 text-green-700 font-bold rounded-full text-[9px] border border-green-100">Đã duyệt</span>
                              ) : isSubmitted ? (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-full text-[9px] border border-blue-100 animate-pulse">Chờ duyệt</span>
                              ) : hasError ? (
                                <span className="px-2 py-0.5 bg-red-50 text-red-700 font-bold rounded-full text-[9px] border border-red-100">Có lỗi</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-gray-50 text-gray-400 font-bold rounded-full text-[9px] border border-gray-100">Chưa nộp</span>
                              )}
                            </div>
                            
                            <div className="text-[11px] text-gray-500 space-y-1">
                              <p>Hộ dân: <strong className="text-gray-700">{sub ? sub.formData.totalHouseholds : "-"}</strong> | Nhân khẩu: <strong className="text-gray-700">{sub ? sub.formData.totalPopulation : "-"}</strong></p>
                              <p>Thời gian nộp: <span className="font-mono text-gray-400">{sub ? new Date(sub.submittedAt).toLocaleDateString("vi-VN") : "Chưa có"}</span></p>
                            </div>
                          </div>
                          
                          {sub ? (
                            <button
                              onClick={() => setReviewVillageId(v.id)}
                              className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                                isSubmitted 
                                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm" 
                                  : "bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200"
                              }`}
                            >
                              {isSubmitted ? "Thẩm định & Duyệt ngay" : "Xem chi tiết báo cáo"}
                            </button>
                          ) : (
                            <button
                              disabled
                              className="w-full py-2 bg-gray-100 text-gray-400 text-xs font-bold rounded-xl cursor-not-allowed"
                            >
                              Chưa có báo cáo để duyệt
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab: Aggregation & Export Center */}
              {activeTab === "aggregation" && currentUser.role === UserRole.CAN_BO_XA && (
                <Aggregator
                  submissions={appState.submissions}
                  villages={appState.villages}
                  task={appState.tasks.find((t: any) => t.id === "t-02")!}
                  onExportExcel={handleExportExcelSummary}
                  onExportWord={handleExportWordNarrative}
                  onExportPdf={handleExportPdfMinute}
                />
              )}

              {/* Tab: Shared communal digital warehouse */}
              {activeTab === "warehouse" && (
                <SharedWarehouse
                  currentUser={currentUser}
                  onDownloadTemplate={handleDownloadTemplateFile}
                  onDownloadVillageExcel={handleDownloadSingleVillageExcel}
                  onDownloadCommuneSummary={handleDownloadCommuneSummaryArchives}
                />
              )}

              {/* Tab: Notification Center */}
              {activeTab === "notifications" && (
                <NotificationsCenter
                  currentUser={currentUser}
                  systemData={appState}
                />
              )}

              {/* Tab: Audit logs checking */}
              {activeTab === "audit" && (
                <div className="space-y-4 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-50 mb-3">
                    <History className="w-5 h-5 text-teal-600" />
                    <div>
                      <h3 className="font-bold text-sm text-gray-700">Nhật ký Hoạt động Thống kê</h3>
                      <p className="text-[11px] text-gray-400">Kiểm toán tự động lịch sử thao tác của các cán bộ xã thôn.</p>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {appState.auditLogs.map((log: any) => (
                      <div key={log.id} className="flex gap-4 items-start border-b border-gray-50 pb-3 text-xs last:border-b-0 last:pb-0">
                        <div className="p-2 bg-gray-50 border rounded-lg text-gray-500 flex-shrink-0">
                          <History className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center gap-2">
                            <span className="font-bold text-gray-800">
                              {log.userName} 
                              <span className="font-normal text-gray-400 text-[9px] ml-1.5 uppercase tracking-wider px-1.5 py-0.5 bg-gray-100 rounded border font-bold">
                                {log.userRole}
                              </span>
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {new Date(log.createdAt).toLocaleString("vi-VN")}
                            </span>
                          </div>
                          <p className="font-bold text-teal-800 mt-1">{log.action}</p>
                          <p className="text-gray-500 mt-0.5 leading-relaxed">{log.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Admin User control panel */}
              {activeTab === "users" && currentUser.role === UserRole.ADMIN && (
                <DashboardAdmin
                  users={appState.users}
                  villages={appState.villages}
                  auditLogs={appState.auditLogs}
                  onAddUser={handleAddUser}
                  onToggleUserActive={handleToggleUserActive}
                  onToggleVillageActive={handleToggleVillageActive}
                />
              )}

              {/* Tab: Village Manager */}
              {activeTab === "villages" && (currentUser.role === UserRole.CAN_BO_XA || currentUser.role === UserRole.ADMIN) && (
                <VillageManager
                  currentUser={currentUser}
                  systemData={appState}
                  onUpdateState={(newState) => {
                    setAppState(newState);
                    // Save to local storage if necessary
                    localStorage.setItem("BANASMARTLINK_DATA", JSON.stringify(newState));
                  }}
                  onFlashNotification={flashZaloNotification}
                />
              )}

              {/* Tab: AIChatDashboard */}
              {activeTab === "ai_chat" && (
                <AIChatDashboard
                  currentUser={currentUser}
                  systemData={appState}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* 4. FLOATING CHAT ASSISTANT ROBOT (GEMINI POWERED) */}
      <AIChatbot 
        currentUser={currentUser} 
        systemData={appState} 
      />
    </div>
  );
}

// Minimal missing icon placeholder
const PlusCircle = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </svg>
);
