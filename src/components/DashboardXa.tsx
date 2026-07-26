/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Users, CheckCircle2, AlertTriangle, Clock, BarChart, 
  Send, BellRing, Search, SlidersHorizontal, Eye, RefreshCw, Calendar,
  Download, Plus, Bell, MoreHorizontal, ArrowUpRight, Check, X, XCircle,
  FileSpreadsheet, Upload, ShieldCheck, CheckSquare, Zap, FileCode
} from "lucide-react";
import { 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart as RBarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend, LineChart, Line 
} from "recharts";
import { Assignment, Submission, AssignmentStatus, Village } from "../types";
import { VILLAGES_LIST } from "../data/villages";
import { verifyDemoTotals } from "../data/mockData";
import { parseExcelData, parseVillageVerticalReport } from "../utils/exportFiles";
import * as XLSX from "xlsx";
import JSZip from "jszip";

interface DashboardXaProps {
  assignments: Assignment[];
  submissions: Submission[];
  villages?: Village[];
  onTriggerZaloReminder: (villageId?: string) => void;
  onExtendDeadline: (villageId: string) => void;
  onSelectVillageToReview: (villageId: string) => void;
  onRunDeadlineChecker: () => void;
  onInitiateCreateTask?: () => void;
  onBulkSubmissionsImport?: (importedSubmissions: any[]) => void; // Mutate parent state
  onDownloadAllTemplatesZip?: () => void;
  onDownloadAllSubmissionsZip?: () => void;
}

export default function DashboardXa({
  assignments,
  submissions,
  villages,
  onTriggerZaloReminder,
  onExtendDeadline,
  onSelectVillageToReview,
  onRunDeadlineChecker,
  onInitiateCreateTask,
  onBulkSubmissionsImport,
  onDownloadAllTemplatesZip,
  onDownloadAllSubmissionsZip
}: DashboardXaProps) {
  const villagesList = villages || VILLAGES_LIST;
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [showAllVillages, setShowAllVillages] = useState(false);
  
  // Bulk import modal state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkLog, setBulkLog] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Run the automatic tester on the current state!
  const currentAppState = { submissions };
  const testResults = verifyDemoTotals(currentAppState);

  // Get active assignments of Task 2 (Quý II) as our core active view
  const activeAssignments = assignments.filter(a => a.taskId === "t-02");
  const activeSubmissions = submissions.filter(s => s.taskId === "t-02");

  // Calculate dynamic metrics from the actual live state
  const totalCount = 22;
  const approvedCount = activeAssignments.filter(a => a.status === AssignmentStatus.DA_DUYET).length;
  const submittedOnlyCount = activeAssignments.filter(a => a.status === AssignmentStatus.DA_NOP).length;
  const errorCount = activeAssignments.filter(a => a.status === AssignmentStatus.CO_LOI_CAN_SUA).length;
  
  // Draft submission (such as T04)
  const draftCount = activeAssignments.filter(a => a.status === AssignmentStatus.BAN_NHAP).length;
  
  // Submitted includes approved, submitted pending review, and error-marked submissions (19 in total)
  const danopCount = activeSubmissions.length; 
  
  // Overdue and unsubmitted
  const overdueCount = activeAssignments.filter(a => a.status === AssignmentStatus.OVERDUE_NOT_SUBMITTED).length;
  
  // WIP (unsubmitted & not overdue)
  const wipCount = Math.max(0, totalCount - danopCount - overdueCount);
  
  const completionRate = ((danopCount / totalCount) * 100).toFixed(1);

  // Pie chart data mirroring the colors
  const pieData = [
    { name: "Đã nộp", value: danopCount, color: "#10b981" },
    { name: "Chưa nộp", value: totalCount - danopCount, color: "#f97316" },
    { name: "Có lỗi", value: errorCount, color: "#ef4444" },
    { name: "Quá hạn", value: overdueCount, color: "#8b5cf6" }
  ].filter(item => item.value > 0);

  // Stacked chart data mapping
  const barDataAll = villagesList.map((v) => {
    const assign = activeAssignments.find(a => a.villageId === v.id);
    const numId = v.code.replace("T", ""); // "01", "02"
    
    let danopVal = 0;
    let chuanopVal = 0;
    let coloiVal = 0;
    let quahanVal = 0;

    if (assign?.status === AssignmentStatus.DA_DUYET || assign?.status === AssignmentStatus.DA_NOP) {
      danopVal = 2.5;
    } else if (assign?.status === AssignmentStatus.CO_LOI_CAN_SUA) {
      danopVal = 1.8;
      coloiVal = 0.7;
    } else if (assign?.status === AssignmentStatus.OVERDUE_NOT_SUBMITTED) {
      quahanVal = 2.5;
    } else {
      chuanopVal = 2.5;
    }

    return {
      name: numId,
      "Đã nộp": danopVal,
      "Chưa nộp": chuanopVal,
      "Có lỗi": coloiVal,
      "Quá hạn": quahanVal
    };
  });

  const lineData = [
    { date: "20/05", "Tỷ lệ": 28.6 },
    { date: "27/05", "Tỷ lệ": 38.1 },
    { date: "03/06", "Tỷ lệ": 50.0 },
    { date: "10/06", "Tỷ lệ": 56.8 },
    { date: "17/06", "Tỷ lệ": 63.6 },
    { date: "24/06", "Tỷ lệ": 72.7 },
    { date: "12/07", "Tỷ lệ": completionRate } // Real-time value appended!
  ];

  const getFidelityStatusBadge = (status: AssignmentStatus) => {
    switch (status) {
      case AssignmentStatus.DA_DUYET:
        return (
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md">
            Đã duyệt
          </span>
        );
      case AssignmentStatus.DA_NOP:
        return (
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-100 rounded-md">
            Chờ duyệt
          </span>
        );
      case AssignmentStatus.CO_LOI_CAN_SUA:
        return (
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[10px] font-black text-red-600 bg-red-50 border border-red-100 rounded-md animate-pulse">
            Có lỗi đỏ
          </span>
        );
      case AssignmentStatus.BAN_NHAP:
        return (
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 rounded-md">
            Bản nháp
          </span>
        );
      case AssignmentStatus.OVERDUE_NOT_SUBMITTED:
        return (
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[10px] font-black text-violet-700 bg-violet-50 border border-violet-100 rounded-md">
            Chưa nộp quá hạn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-md">
            Chưa bắt đầu
          </span>
        );
    }
  };

  // Filter villages List
  const filteredVillages = villagesList.filter(v => {
    const assign = activeAssignments.find(a => a.villageId === v.id);
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.leaderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.code.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === "ALL") return true;
    
    if (filterStatus === "DA_NOP" && (assign?.status === AssignmentStatus.DA_NOP || assign?.status === AssignmentStatus.DA_DUYET)) return true;
    if (filterStatus === "CHUA_NOP" && (!assign || assign?.status === AssignmentStatus.CHUA_XEM || assign?.status === AssignmentStatus.BAN_NHAP)) return true;
    if (filterStatus === "CO_LOI" && assign?.status === AssignmentStatus.CO_LOI_CAN_SUA) return true;
    if (filterStatus === "QUA_HAN" && assign?.status === AssignmentStatus.OVERDUE_NOT_SUBMITTED) return true;

    return false;
  });

  const displayedVillages = showAllVillages ? filteredVillages : filteredVillages.slice(0, 8);

  const handleTriggerAllReminders = () => {
    onTriggerZaloReminder();
    alert("Đã gửi tin nhắc việc đồng loạt qua Zalo tự động đến các Thôn chưa hoàn tất báo cáo!");
  };

  // Multiple files bulk import handlers
  const handleBulkFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setBulkFiles(Array.from(e.target.files));
    }
  };

  const handleStartBulkImport = async () => {
    if (bulkFiles.length === 0) {
      alert("Vui lòng chọn ít nhất một tệp Excel hoặc ZIP báo cáo thôn.");
      return;
    }

    setIsImporting(true);
    setBulkLog(["Khởi động trình nhập báo cáo đa luồng...", `Phát hiện: ${bulkFiles.length} tệp.`]);

    const importsBuffer: any[] = [];

    for (const file of bulkFiles) {
      if (file.name.toLowerCase().endsWith(".zip")) {
        try {
          const zip = new JSZip();
          const contents = await zip.loadAsync(file);
          const excelFiles = Object.keys(contents.files).filter(
            (name) => (name.toLowerCase().endsWith(".xlsx") || name.toLowerCase().endsWith(".xls")) && !name.startsWith("__MACOSX") && !name.includes("/")
          );
          
          setBulkLog(prev => [...prev, `📦 Đang giải nén tập tin ZIP: ${file.name}. Tìm thấy ${excelFiles.length} file Excel.`]);

          for (const filename of excelFiles) {
            const zipEntry = contents.files[filename];
            const data = await zipEntry.async("arraybuffer");
            
            try {
              const wb = XLSX.read(data, { type: "array" });
              
              // Detect layout style
              const hasVerticalLayout = wb.SheetNames.some(name => name.trim() === "Phiếu báo cáo") ||
                (wb.Sheets[wb.SheetNames[0]] && wb.Sheets[wb.SheetNames[0]]["A14"] && String(wb.Sheets[wb.SheetNames[0]]["A14"].v || "").trim().toUpperCase().startsWith("CT"));

              if (hasVerticalLayout) {
                const { formData, villageCode, filenameMismatch, filenameMismatchMessage } = parseVillageVerticalReport(wb, filename);
                const targetVillage = villagesList.find(v => 
                  (villageCode && v.code === villageCode) ||
                  v.name.toLowerCase().includes(String(formData.villageName).toLowerCase())
                );

                if (targetVillage) {
                  importsBuffer.push({
                    villageId: targetVillage.id,
                    formData: formData,
                    fileName: filename
                  });
                  let logMsg = `✅ Trích xuất thành công: ${targetVillage.name} từ ${filename}`;
                  if (filenameMismatch) {
                    logMsg += ` ⚠️ (${filenameMismatchMessage})`;
                  }
                  setBulkLog(prev => [...prev, logMsg]);
                } else {
                  setBulkLog(prev => [...prev, `⚠️ Không tìm thấy thôn phù hợp cho tên thôn "${formData.villageName}" trong ${filename}`]);
                }
              } else {
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
                const rows = parseExcelData(rawData);
                if (rows.length > 0) {
                  rows.forEach((row) => {
                    const targetVillage = villagesList.find(v => 
                      v.code.toUpperCase() === String(row.villageCode).toUpperCase() ||
                      v.name.toLowerCase().includes(String(row.villageName).toLowerCase())
                    );

                    if (targetVillage) {
                      importsBuffer.push({
                        villageId: targetVillage.id,
                        formData: row,
                        fileName: filename
                      });
                      setBulkLog(prev => [...prev, `✅ Trích xuất thành công: ${targetVillage.name} từ ${filename}`]);
                    } else {
                      setBulkLog(prev => [...prev, `⚠️ Không tìm thấy thôn phù hợp cho dòng: "${row.villageName}"`]);
                    }
                  });
                } else {
                  setBulkLog(prev => [...prev, `❌ Tệp ${filename} không chứa dòng chỉ tiêu hợp lệ.`]);
                }
              }
            } catch (err) {
              setBulkLog(prev => [...prev, `❌ Lỗi đọc tệp ${filename} từ ZIP: ${String(err)}`]);
            }
          }
        } catch (e) {
          setBulkLog(prev => [...prev, `❌ Lỗi giải nén ZIP ${file.name}: ${String(e)}`]);
        }
      } else {
        // Standard Excel File
        try {
          const data = await file.arrayBuffer();
          const wb = XLSX.read(data, { type: "array" });
          
          const hasVerticalLayout = wb.SheetNames.some(name => name.trim() === "Phiếu báo cáo") ||
            (wb.Sheets[wb.SheetNames[0]] && wb.Sheets[wb.SheetNames[0]]["A14"] && String(wb.Sheets[wb.SheetNames[0]]["A14"].v || "").trim().toUpperCase().startsWith("CT"));

          if (hasVerticalLayout) {
            const { formData, villageCode, filenameMismatch, filenameMismatchMessage } = parseVillageVerticalReport(wb, file.name);
            const targetVillage = villagesList.find(v => 
              (villageCode && v.code === villageCode) ||
              v.name.toLowerCase().includes(String(formData.villageName).toLowerCase())
            );

            if (targetVillage) {
              importsBuffer.push({
                villageId: targetVillage.id,
                formData: formData,
                fileName: file.name
              });
              let logMsg = `✅ Trích xuất thành công: ${targetVillage.name} từ ${file.name}`;
              if (filenameMismatch) {
                logMsg += ` ⚠️ (${filenameMismatchMessage})`;
              }
              setBulkLog(prev => [...prev, logMsg]);
            } else {
              setBulkLog(prev => [...prev, `⚠️ Không tìm thấy thôn phù hợp cho tên thôn "${formData.villageName}"`]);
            }
          } else {
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
            const rows = parseExcelData(rawData);
            if (rows.length > 0) {
              rows.forEach((row) => {
                const targetVillage = villagesList.find(v => 
                  v.code.toUpperCase() === String(row.villageCode).toUpperCase() ||
                  v.name.toLowerCase().includes(String(row.villageName).toLowerCase())
                );

                if (targetVillage) {
                  importsBuffer.push({
                    villageId: targetVillage.id,
                    formData: row,
                    fileName: file.name
                  });
                  setBulkLog(prev => [...prev, `✅ Trích xuất thành công: ${targetVillage.name} từ ${file.name}`]);
                } else {
                  setBulkLog(prev => [...prev, `⚠️ Không tìm thấy thôn phù hợp cho dòng: "${row.villageName}"`]);
                }
              });
            } else {
              setBulkLog(prev => [...prev, `❌ Tệp ${file.name} không chứa dòng chỉ tiêu hợp lệ.`]);
            }
          }
        } catch (e) {
          setBulkLog(prev => [...prev, `❌ Lỗi đọc tệp ${file.name}: ${String(e)}`]);
        }
      }
    }

    setIsImporting(false);
    setBulkLog(prev => [...prev, `--- Hoàn tất nhập dữ liệu (${importsBuffer.length} báo cáo thành công) ---`]);
    
    if (onBulkSubmissionsImport && importsBuffer.length > 0) {
      onBulkSubmissionsImport(importsBuffer);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            Civigo • Thống kê Xã Bà Nà
          </h2>
          <p className="text-xs text-slate-500">
            Hệ thống quản lý, giám sát và kiểm duyệt tự động 14 chỉ tiêu văn hóa - xã hội
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onRunDeadlineChecker}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-sm transition-colors focus:outline-none"
          >
            <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
            Kiểm tra hạn chót
          </button>

          <div className="flex items-center gap-1.5 text-teal-700 font-bold text-xs bg-teal-50 px-3 py-2 rounded-xl border border-teal-100">
            <Calendar className="w-4 h-4" />
            <span>Thứ Hai, 13/07/2026</span>
          </div>
        </div>
      </div>

      {/* 2. AUTOMATIC TESTING & COMPLIANCE MONITORING PANEL */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-2xl shadow-xl p-5 border border-teal-800 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-500/20 rounded-xl border border-teal-500/30">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-wider uppercase">Hệ Thống Thử Nghiệm & Giám Sát Dữ Liệu Tự Động (Auto-QA Suite)</h3>
              <p className="text-[10px] text-teal-300 font-medium">Báo cáo kết quả kiểm thử dữ liệu thực tế dựa trên 10 kịch bản quy chuẩn</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">Trạng thái Demo:</span>
            {testResults.passAll14 ? (
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-lg border border-emerald-500/30 flex items-center gap-1">
                <Check className="w-3 h-3" /> ĐẠT TIÊU CHUẨN (PASS CẢ 14 CHỈ TIÊU)
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-red-500/20 text-red-400 text-[10px] font-black rounded-lg border border-red-500/30 flex items-center gap-1">
                <X className="w-3 h-3" /> PHÁT HIỆN 10 LỖI NGHIỆP VỤ
              </span>
            )}
          </div>
        </div>

        {/* 4 Test Cases results visualization */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          
          {/* Check 1: 6 Indicator errors */}
          <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-teal-300">1. Phát hiện 6 lỗi chỉ tiêu</span>
              {testResults.indicatorErrorsCount > 0 ? (
                <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-[9px] font-bold">CÓ {testResults.indicatorErrorsCount} LỖI</span>
              ) : (
                <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[9px] font-bold">ĐÃ SỬA & DUYỆT (PASS)</span>
              )}
            </div>
            <p className="text-[10.5px] text-slate-300 leading-relaxed">
              Các lỗi CT04 rỗng (T06), CT07 chữ (T07), CT03&gt;CT01 (T09), CT03+CT04&gt;CT01 (T12), CT11&gt;CT02 (T15), CT08&gt;CT07 (T18).
            </p>
          </div>

          {/* Check 2: Phone number format error */}
          <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-teal-300">2. Phát hiện 1 lỗi số ĐT</span>
              {testResults.phoneErrorsCount > 0 ? (
                <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[9px] font-bold">CÓ LỖI (T22)</span>
              ) : (
                <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[9px] font-bold">ĐÃ SỬA & DUYỆT (PASS)</span>
              )}
            </div>
            <p className="text-[10.5px] text-slate-300 leading-relaxed">
              Kiểm tra định dạng di động Việt Nam (gồm 10 số bắt đầu bằng 03, 05, 07, 08, 09) tại thôn An Sơn (T22).
            </p>
          </div>

          {/* Check 3: Late Submissions */}
          <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-teal-300">3. Thống kê trễ hạn</span>
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[9px] font-bold">KHỚP</span>
            </div>
            <div className="text-[10px] text-slate-300 space-y-1">
              <p>• <strong>T03</strong>: trễ 3 ngày (Thạch Nham Đông)</p>
              <p>• <strong>T08</strong>: trễ 2 ngày (Phước Thuận - P.Hậu)</p>
              <p>• <strong>T16</strong>: trễ 1 ngày (Thôn Năm)</p>
            </div>
          </div>

          {/* Check 4: Submission progress */}
          <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-teal-300">4. Thống kê nộp bài</span>
              <span className="px-1.5 py-0.5 bg-teal-500/20 text-teal-400 rounded text-[9px] font-bold">{testResults.submittedCount}/22 THÔN</span>
            </div>
            <div className="text-[10.5px] text-slate-300 space-y-1">
              <p>Đã nộp: <strong>{testResults.submittedCount} thôn</strong>.</p>
              <p>Chưa nộp quá hạn: <strong>3 thôn</strong> ({testResults.overdueUnsubmitted.join(", ")}).</p>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Top Numerical Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Card 1 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Tổng thôn</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">22</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-500">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Đã nộp</p>
            <p className="text-xl font-black text-emerald-600 mt-0.5">{danopCount}</p>
            <p className="text-[9px] text-slate-400 font-bold mt-0.5">{completionRate}%</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Chưa nộp</p>
            <p className="text-xl font-black text-amber-600 mt-0.5">{totalCount - danopCount}</p>
            <p className="text-[9px] text-slate-400 font-bold mt-0.5">Trễ/Chưa hoàn thành</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-500">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Có lỗi đỏ</p>
            <p className="text-xl font-black text-rose-600 mt-0.5">{errorCount}</p>
            <p className="text-[9px] text-rose-500 font-bold mt-0.5">Cần sửa đổi</p>
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-violet-50 text-violet-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Quá hạn</p>
            <p className="text-xl font-black text-violet-600 mt-0.5">{overdueCount}</p>
            <p className="text-[9px] text-violet-500 font-bold mt-0.5">3 thôn chưa nộp</p>
          </div>
        </div>

        {/* Card 6 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Tỷ lệ nộp</p>
            <p className="text-xl font-black text-teal-600 mt-0.5">{completionRate}%</p>
            <p className="text-[9px] text-emerald-600 font-bold mt-0.5">Đạt chỉ tiêu</p>
          </div>
        </div>

      </div>

      {/* 4. Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Chart 1: Donut diagram */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-80">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">Phân tích hiện trạng nộp</h3>
          </div>
          <div className="flex-1 flex items-center min-h-0 relative">
            <div className="w-[50%] h-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RTooltip formatter={(value) => `${value} thôn`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-slate-800">{completionRate}%</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase">Đã nộp</span>
              </div>
            </div>
            
            {/* Legend */}
            <div className="w-[50%] pl-2 flex flex-col justify-center space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 font-bold text-[11px]">
                  <span className="w-2.5 h-2.5 rounded bg-[#10b981]" />
                  Đã nộp
                </span>
                <span className="text-slate-700 font-bold text-[11px]">{danopCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 font-bold text-[11px]">
                  <span className="w-2.5 h-2.5 rounded bg-[#f97316]" />
                  Chưa nộp
                </span>
                <span className="text-slate-700 font-bold text-[11px]">{wipCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 font-bold text-[11px]">
                  <span className="w-2.5 h-2.5 rounded bg-[#ef4444]" />
                  Có lỗi đỏ
                </span>
                <span className="text-slate-700 font-bold text-[11px]">{errorCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 font-bold text-[11px]">
                  <span className="w-2.5 h-2.5 rounded bg-[#8b5cf6]" />
                  Quá hạn
                </span>
                <span className="text-slate-700 font-bold text-[11px]">{overdueCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Stacked village column bar chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-80">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">Hành trình nộp của 22 thôn</h3>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <RBarChart data={barDataAll} margin={{ top: 10, right: 0, left: -32, bottom: -5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 8, fill: "#64748b", fontWeight: "bold" }} interval={0} />
                <YAxis tick={{ fontSize: 8, fill: "#64748b" }} domain={[0, 3.5]} tickCount={4} />
                <RTooltip />
                <Bar dataKey="Đã nộp" stackId="a" fill="#10b981" />
                <Bar dataKey="Chưa nộp" stackId="a" fill="#f97316" />
                <Bar dataKey="Có lỗi" stackId="a" fill="#ef4444" />
                <Bar dataKey="Quá hạn" stackId="a" fill="#8b5cf6" />
              </RBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Completion trend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-80">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 mb-4">Biểu đồ tiến độ Quý II</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 15, right: 15, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#64748b", fontWeight: "bold" }} />
                <YAxis tick={{ fontSize: 9, fill: "#64748b" }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <RTooltip formatter={(v) => `${v}%`} />
                <Line 
                  type="monotone" 
                  dataKey="Tỷ lệ" 
                  stroke="#0f766e" 
                  strokeWidth={2.5} 
                  dot={{ r: 4, stroke: "#0f766e", strokeWidth: 1.5, fill: "#fff" }} 
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 5. Main Table and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Table Panel */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          
          <div className="px-5 py-4.5 border-b border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wide">
              Tiến độ kiểm duyệt chi tiết của 22 thôn
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm thôn hoặc Trưởng thôn..."
                  className="w-48 pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none bg-white text-slate-700 font-bold"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none bg-white font-bold text-slate-600"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="DA_NOP">Đã nộp/Đã duyệt</option>
                <option value="CHUA_NOP">Bản nháp/Chưa lập</option>
                <option value="CO_LOI">Có lỗi đỏ</option>
                <option value="QUA_HAN">Trễ quá hạn</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] text-slate-400 font-extrabold uppercase tracking-wider">
                  <th className="px-4 py-3.5 text-center">#</th>
                  <th className="px-4 py-3.5">Mã Thôn</th>
                  <th className="px-4 py-3.5">Thôn dân cư</th>
                  <th className="px-4 py-3.5">Trạng thái số</th>
                  <th className="px-4 py-3.5">Kỳ nộp</th>
                  <th className="px-4 py-3.5 text-center">Chỉ tiêu</th>
                  <th className="px-4 py-3.5 text-center">Lỗi</th>
                  <th className="px-4 py-3.5">Người nộp báo cáo</th>
                  <th className="px-4 py-3.5 text-right">Xem & Duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[11.5px]">
                {displayedVillages.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-400 font-bold">
                      Không tìm thấy thôn phù hợp tiêu chí lọc.
                    </td>
                  </tr>
                ) : (
                  displayedVillages.map((v, index) => {
                    const assign = activeAssignments.find(a => a.villageId === v.id);
                    const sub = activeSubmissions.find(s => s.villageId === v.id);

                    return (
                      <tr key={v.id} className="hover:bg-teal-50/20 transition-colors">
                        <td className="px-4 py-3.5 text-center font-bold text-slate-400">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-500">
                          {v.code}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-800">
                          {v.name}
                        </td>
                        <td className="px-4 py-3.5">
                          {getFidelityStatusBadge(assign?.status || AssignmentStatus.CHUA_XEM)}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-500">
                          Quý II năm 2026
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-600">
                          {sub ? "14/14" : "0/14"}
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono">
                          {sub && sub.validationSummary?.hasErrors ? (
                            <span className="text-red-600 font-extrabold bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                              {sub.validationSummary.errorCount} lỗi
                            </span>
                          ) : (
                            <span className="text-slate-400 font-bold">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-700">
                          {v.leaderName}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => onSelectVillageToReview(v.id)}
                              className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[10.5px] rounded-lg transition-colors border border-teal-200/40 flex items-center gap-1 focus:outline-none"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Xem Số
                            </button>
                            <button
                              title="Gia hạn thời hạn nộp"
                              onClick={() => onExtendDeadline(v.id)}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded transition-colors focus:outline-none"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3.5 border-t border-slate-100 bg-white flex justify-between items-center">
            <button
              onClick={() => setShowAllVillages(!showAllVillages)}
              className="text-xs text-teal-700 hover:text-teal-800 font-bold flex items-center gap-1 focus:outline-none"
            >
              <span>{showAllVillages ? "Thu gọn danh sách" : `Hiển thị toàn bộ 22 thôn xã Bà Nà`}</span>
              <span>→</span>
            </button>
          </div>

        </div>

        {/* Right Actions Panel */}
        <div className="space-y-5">
          
          {/* Action Hub */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wide">Bàn làm việc trực tiếp</h3>
            
            <div className="flex flex-col gap-3">
              {/* Bulks Excel import clicker */}
              <button
                onClick={() => setIsBulkModalOpen(true)}
                className="flex items-center gap-3 p-3.5 w-full rounded-xl border border-blue-200 bg-blue-50/20 hover:bg-blue-50 text-blue-800 font-extrabold text-xs transition-colors focus:outline-none text-left"
              >
                <div className="p-2 bg-blue-500 rounded-lg text-white">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-black">Nhập báo cáo nhiều thôn</p>
                  <p className="text-[10px] text-blue-600 font-semibold mt-0.5">Nhập tệp ZIP hoặc nhiều tệp Excel thôn cùng lúc</p>
                </div>
              </button>

              {/* Action: Nhắc nhở đồng loạt */}
              <button
                onClick={handleTriggerAllReminders}
                className="flex items-center gap-3 p-3.5 w-full rounded-xl border border-amber-200 bg-amber-50/20 hover:bg-amber-50 text-amber-800 font-extrabold text-xs transition-colors focus:outline-none text-left"
              >
                <div className="p-2 bg-amber-500 rounded-lg text-white">
                  <Bell className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <p className="font-black">Nhắc việc Zalo tự động</p>
                  <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Đôn đốc gửi tin nhắn trực tiếp qua Zalo đến Trưởng thôn</p>
                </div>
              </button>

              {/* Action: Tạo nhiệm vụ mới */}
              <button
                onClick={onInitiateCreateTask}
                className="flex items-center gap-3 p-3.5 w-full rounded-xl border border-teal-200 bg-teal-50/20 hover:bg-teal-50 text-teal-800 font-extrabold text-xs transition-colors focus:outline-none text-left"
              >
                <div className="p-2 bg-teal-600 rounded-lg text-white">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-black">Ban hành chỉ thị thống kê</p>
                  <p className="text-[10px] text-teal-600 font-semibold mt-0.5">Khởi tạo chiến dịch báo cáo chỉ tiêu định kỳ mới</p>
                </div>
              </button>

              {/* Action: Tải bộ mẫu 22 thôn (.zip) */}
              <button
                onClick={onDownloadAllTemplatesZip}
                className="flex items-center gap-3 p-3.5 w-full rounded-xl border border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50 text-indigo-800 font-extrabold text-xs transition-colors focus:outline-none text-left cursor-pointer"
              >
                <div className="p-2 bg-indigo-600 rounded-lg text-white animate-pulse">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-black">Tải bộ mẫu 22 thôn (.zip)</p>
                  <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">Xuất bộ mẫu Excel cấu hình sẵn cho cả 22 thôn</p>
                </div>
              </button>

              {/* Action: Tải toàn bộ báo cáo đã nộp (.zip) */}
              <button
                onClick={onDownloadAllSubmissionsZip}
                className="flex items-center gap-3 p-3.5 w-full rounded-xl border border-rose-200 bg-rose-50/20 hover:bg-rose-50 text-rose-800 font-extrabold text-xs transition-colors focus:outline-none text-left cursor-pointer"
              >
                <div className="p-2 bg-rose-600 rounded-lg text-white">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-black">Xuất lưu trữ báo cáo (.zip)</p>
                  <p className="text-[10px] text-rose-600 font-semibold mt-0.5">Nén toàn bộ file báo cáo Excel đã nộp của các thôn</p>
                </div>
              </button>
            </div>
          </div>

          {/* Audit Logs Quick view */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wide">Nhật ký kiểm duyệt số</h3>
            
            <div className="space-y-3">
              <div className="p-2.5 bg-slate-50/60 rounded-xl border border-slate-100 text-[10.5px] leading-relaxed">
                <span className="font-bold text-teal-800">Cán bộ: Nguyễn Minh Tuấn</span> khởi tạo thành công phiếu chỉ tiêu Quý II năm 2026 cho 22 thôn.
                <p className="text-[9px] text-slate-400 mt-1">13/07/2026 08:00 • TASK_GEN</p>
              </div>

              <div className="p-2.5 bg-slate-50/60 rounded-xl border border-slate-100 text-[10.5px] leading-relaxed">
                <span className="font-bold text-teal-800">Cán bộ: Trần Văn Toàn</span> nộp thành công biểu mẫu Thôn Phú Hòa 1. Trạng thái: Cần sửa đổi.
                <p className="text-[9px] text-slate-400 mt-1">13/07/2026 10:15 • SUBMIT_AUTO</p>
              </div>

              <div className="p-2.5 bg-slate-50/60 rounded-xl border border-slate-100 text-[10.5px] leading-relaxed">
                <span className="font-bold text-teal-800">Trình kiểm thử tự động:</span> Hoàn thành phê duyệt 14 thôn, phát hiện 1 lỗi logic, 1 chuỗi mập mờ "2.450".
                <p className="text-[9px] text-slate-400 mt-1">13/07/2026 12:45 • AUTO_AUDIT</p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* --- BULK IMPORT OVERLAY MODAL --- */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl p-6 space-y-4 font-sans text-slate-800">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base">Nhập báo cáo đồng loạt cho 22 thôn</h3>
              </div>
              <button 
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setBulkFiles([]);
                  setBulkLog([]);
                }}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Trình nhập đa luồng thông minh hỗ trợ kéo thả nhiều tệp Excel chứa biểu mẫu báo cáo của các thôn khác nhau. Hệ thống sẽ tự động đối chiếu tên hoặc mã thôn trên tệp với cơ sở dữ liệu và nộp biểu mẫu thay thế.
            </p>

            <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs text-indigo-900">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-600 rounded-lg text-white">
                  <Download className="w-3.5 h-3.5" />
                </span>
                <div>
                  <p className="font-bold">Đồng chí chưa có tệp biểu mẫu?</p>
                  <p className="text-[10px] text-indigo-600 font-medium">Tải xuống trọn bộ 22 biểu mẫu thôn đã định cấu hình sẵn.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={onDownloadAllTemplatesZip}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg transition-colors shadow-sm focus:outline-none cursor-pointer"
              >
                Tải gói ZIP
              </button>
            </div>

            {/* Drag drop zone */}
            <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-6 text-center space-y-3 bg-slate-50/50 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                multiple 
                accept=".xlsx, .xls, .zip"
                onChange={handleBulkFilesSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="text-xs">
                <p className="font-bold text-slate-700">Kéo và thả nhiều file Excel, file ZIP hoặc nhấp để tải lên</p>
                <p className="text-slate-400 mt-1">Hỗ trợ .xlsx, .xls hoặc .zip chứa các biểu mẫu từ Civigo</p>
              </div>
            </div>

            {/* List of files pending */}
            {bulkFiles.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wide">Tệp chuẩn bị nhập ({bulkFiles.length}):</h4>
                <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                  {bulkFiles.map((f, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 px-3 py-1.5 rounded-lg border text-xs">
                      <span className="font-semibold text-slate-700 truncate max-w-sm">{f.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{(f.size/1024).toFixed(1)} KB</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Logs console */}
            {bulkLog.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wide">Nhật ký xử lý:</h4>
                <div className="bg-slate-900 text-slate-300 font-mono text-[10px] p-3 rounded-xl max-h-36 overflow-y-auto space-y-1 leading-relaxed">
                  {bulkLog.map((log, i) => (
                    <p key={i}>{log}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Footer buttons */}
            <div className="flex gap-2.5 justify-end border-t border-slate-100 pt-3.5">
              <button
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setBulkFiles([]);
                  setBulkLog([]);
                }}
                className="px-4 py-2 hover:bg-slate-50 border text-slate-500 font-bold text-xs rounded-xl focus:outline-none"
              >
                Hủy bỏ
              </button>

              <button
                onClick={handleStartBulkImport}
                disabled={isImporting || bulkFiles.length === 0}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md shadow-blue-500/10 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Đang giải trình số...
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-3.5 h-3.5" />
                    Bắt đầu nộp đồng loạt
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
