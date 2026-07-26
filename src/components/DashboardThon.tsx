/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  FileText, Download, Upload, CheckCircle2, AlertTriangle, Clock, 
  Eye, Edit3, ArrowRight, History, MessageSquare,
  TrendingUp, Users, Home, ClipboardList, ChevronRight, CheckSquare, Bell, Calendar, MapPin, BarChart2
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import * as XLSX from "xlsx";
import { Assignment, Submission, AssignmentStatus, ReportTask } from "../types";

interface DashboardThonProps {
  activeTab: string;
  assignments: Assignment[];
  submissions: Submission[];
  tasks: ReportTask[];
  villageId: string;
  onSelectTaskToReport: (taskId: string) => void;
  onDownloadTemplate: () => void;
  onUploadExcelClick: (taskId: string) => void;
  onSelectTab: (tab: string) => void;
}

export default function DashboardThon({
  activeTab,
  assignments,
  submissions,
  tasks,
  villageId,
  onSelectTaskToReport,
  onDownloadTemplate,
  onUploadExcelClick,
  onSelectTab
}: DashboardThonProps) {
  const [isDragging, setIsDragging] = useState(false);

  // Filter assignments allocated to this specific village
  const myAssignments = assignments.filter(a => a.villageId === villageId);
  
  // Calculate metric values
  const activeTasks = tasks.filter(t => t.status === "DANG_THUC_HIEN");
  const activeCount = activeTasks.length;
  
  const submittedCount = myAssignments.filter(
    a => a.status === AssignmentStatus.DA_NOP || a.status === AssignmentStatus.CO_LOI_CAN_SUA
  ).length;

  const approvedCount = myAssignments.filter(
    a => a.status === AssignmentStatus.DA_DUYET
  ).length;

  const totalAssignedCount = myAssignments.length;
  const completionRate = totalAssignedCount > 0 
    ? Math.round((approvedCount / totalAssignedCount) * 100) 
    : 0;

  // Mock historical data for Thôn 03 - Xã Bà Nà (used for the progress/trend charts)
  const chartData = [
    { name: "Tháng 04", Households: 148, Population: 590, Poor: 8, NearPoor: 12 },
    { name: "Tháng 05", Households: 150, Population: 598, Poor: 8, NearPoor: 12 },
    { name: "Tháng 06", Households: 152, Population: 604, Poor: 7, NearPoor: 11 },
    { name: "Tháng 07", Households: 155, Population: 618, Poor: 6, NearPoor: 10 }
  ];

  // Map state values to user-friendly badge
  const getStatusBadge = (status: AssignmentStatus) => {
    switch (status) {
      case AssignmentStatus.DA_DUYET:
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Số liệu đã được duyệt
          </span>
        );
      case AssignmentStatus.DA_NOP:
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-full flex items-center gap-1 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> Chờ xã phê duyệt
          </span>
        );
      case AssignmentStatus.CO_LOI_CAN_SUA:
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 rounded-full flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Có sai số cần sửa đổi
          </span>
        );
      case AssignmentStatus.YEU_CAU_CHINH_SUA:
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200 rounded-full flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Yêu cầu sửa đổi
          </span>
        );
      case AssignmentStatus.NOP_QUA_HAN:
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-full flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Quá hạn nộp
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold bg-slate-50 text-slate-500 border border-slate-200 rounded-full flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Đang lập báo cáo
          </span>
        );
    }
  };

  // Drag over handlers for Excel upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        onUploadExcelClick(taskId);
      } else {
        alert("Vui lòng chỉ kéo thả file Excel định dạng .xlsx hoặc .xls");
      }
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header context banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Vai trò: Cán bộ Thôn</span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">Trang chủ Thống kê Thôn</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Đồng chí <strong className="text-slate-800">Hồ Văn An</strong> • Trưởng thôn Thôn 03 • Xã Bà Nà • Huyện Hòa Vang
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onDownloadTemplate}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Tải biểu mẫu Excel (.xlsx)
          </button>
          <button
            onClick={() => onSelectTab("input_report")}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Nhập báo cáo mới
          </button>
        </div>
      </div>

      {/* 2. Statistical Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Nhiệm vụ đang thực hiện */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Nhiệm vụ đang mở</span>
            <span className="text-2xl font-black text-amber-500 font-mono">0{activeCount}</span>
            <span className="text-[10px] text-amber-600 font-semibold block bg-amber-50 px-1.5 py-0.5 rounded w-fit">Cần hoàn thành</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Đã nộp & Chờ duyệt */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Đã nộp & Chờ duyệt</span>
            <span className="text-2xl font-black text-blue-500 font-mono">
              {submittedCount < 10 ? `0${submittedCount}` : submittedCount}
            </span>
            <span className="text-[10px] text-blue-600 font-semibold block bg-blue-50 px-1.5 py-0.5 rounded w-fit">Chờ Xã xem xét</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Đã phê duyệt */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Đã phê duyệt lưu sổ</span>
            <span className="text-2xl font-black text-emerald-500 font-mono">
              {approvedCount < 10 ? `0${approvedCount}` : approvedCount}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold block bg-emerald-50 px-1.5 py-0.5 rounded w-fit">Đã vào kho số</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Tỷ lệ hoàn thành */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Tỷ lệ hoàn thành</span>
            <span className="text-2xl font-black text-slate-800 font-mono">{completionRate}%</span>
            <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${completionRate}%` }} />
            </div>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. MULTI-VIEW NAVIGATION PAGES */}
      {activeTab === "dashboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Left: Tasks assigned */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4.5 h-4.5 text-emerald-600" />
                  <h3 className="font-extrabold text-sm text-slate-800">Nhiệm vụ báo cáo đang thực hiện</h3>
                </div>
                <button 
                  onClick={() => onSelectTab("tasks")}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                >
                  Xem tất cả
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {activeTasks.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-1.5">
                  <CheckSquare className="w-10 h-10 text-slate-200 mx-auto" />
                  <p className="text-xs font-semibold">Đồng chí đã hoàn tất tất cả các nhiệm vụ báo cáo!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeTasks.map(task => {
                    const assignment = myAssignments.find(a => a.taskId === task.id);
                    const submission = submissions.find(s => s.taskId === task.id && s.villageId === villageId);
                    const hasError = assignment?.status === AssignmentStatus.CO_LOI_CAN_SUA;

                    return (
                      <div 
                        key={task.id}
                        className={`p-4 border rounded-xl relative overflow-hidden flex flex-col justify-between gap-4 transition-all hover:border-slate-300 ${
                          hasError ? "bg-red-50/20 border-red-200" : "bg-slate-50/50 border-slate-200/80"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="px-2 py-0.5 bg-white border text-slate-500 font-bold font-mono text-[9px] rounded-md">
                              {task.code}
                            </span>
                            {getStatusBadge(assignment?.status || AssignmentStatus.CHUA_XEM)}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-800 leading-snug">{task.title}</h4>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400 font-semibold pt-1">
                            <span>Kỳ báo cáo: <strong className="text-slate-600">{task.reportingPeriod}</strong></span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              Hạn nộp: <strong className="text-red-500 font-bold">11/07/2026</strong>
                            </span>
                          </div>

                          {submission?.reviewComment && (
                            <div className={`p-3 rounded-xl text-xs flex gap-2 items-start mt-2 border ${
                              hasError ? "bg-red-50 border-red-100 text-red-800" : "bg-emerald-50/80 border-emerald-100 text-emerald-800"
                            }`}>
                              <MessageSquare className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <span className="font-extrabold block mb-0.5 text-slate-800">Nhận xét từ cán bộ xã chuyên trách:</span>
                                "{submission.reviewComment}"
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-3 border-t border-slate-100/50">
                          <button
                            onClick={() => onSelectTaskToReport(task.id)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Nhập số liệu trực tuyến
                          </button>
                          <button
                            onClick={() => onUploadExcelClick(task.id)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all"
                          >
                            <Upload className="w-3.5 h-3.5 text-slate-500" />
                            Tải lên file Excel (.xlsx)
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick alert reminder box */}
            <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl flex items-start gap-3 text-xs leading-relaxed">
              <Bell className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-amber-800 block mb-0.5">⚠️ NHẮC NHỞ QUAN TRỌNG:</span>
                <p className="text-slate-600 font-semibold">
                  Cán bộ xã yêu cầu đồng chí trưởng thôn Thôn 03 rà soát chặt chẽ số lượng trẻ em dưới 16 tuổi trong biểu mẫu Tháng 07/2026 này để chuẩn bị tốt cho công tác cấp phát học bổng quý III sắp tới. Mọi sai lệch số liệu phải giải trình rõ ở phần ghi chú.
                </p>
              </div>
            </div>
          </div>

          {/* Main Right: Recharts graph showing village stats */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4.5 h-4.5 text-emerald-600" />
                  <h3 className="font-extrabold text-sm text-slate-800">Biến động Dân số Thôn 03</h3>
                </div>
              </div>

              {/* Area chart representation */}
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="popColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1e293b", borderRadius: "12px", border: "none", color: "#fff", fontSize: "11px" }}
                    />
                    <Area type="monotone" dataKey="Population" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#popColor)" name="Nhân khẩu" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Households column representation */}
              <div className="pt-2 border-t border-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-3.5">Hộ nghèo & Cận nghèo qua các kỳ</p>
                <div className="h-36 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#1e293b", borderRadius: "12px", border: "none", color: "#fff", fontSize: "11px" }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", fontWeight: "bold" }} />
                      <Bar dataKey="Poor" fill="#ef4444" radius={[4, 4, 0, 0]} name="Hộ nghèo" />
                      <Bar dataKey="NearPoor" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Cận nghèo" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Quick Helper guidelines Card */}
            <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 opacity-20 rounded-full blur-xl" />
              <h4 className="font-extrabold text-xs text-emerald-400 uppercase tracking-wider">Cẩm nang Cán bộ Thôn</h4>
              <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                Khi thu thập dữ liệu rà soát, đồng chí lưu ý 3 nguyên tắc vàng:
              </p>
              <ul className="text-[10px] text-slate-400 space-y-2 mt-3 list-decimal list-inside font-medium leading-relaxed">
                <li><strong className="text-slate-200">Khớp đối ứng</strong>: Tổng nam + nữ bắt buộc phải bằng tổng nhân khẩu.</li>
                <li><strong className="text-slate-200">Giải trình biến động</strong>: Số liệu thay đổi quá 30% phải được ghi rõ nguyên nhân.</li>
                <li><strong className="text-slate-200">Chốt đúng hạn</strong>: Báo cáo nộp chậm sau hạn quy định sẽ bị ghi vào nhật ký chậm trễ.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 4. TASKS VIEW PAGE */}
      {activeTab === "tasks" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">Quy trình rà soát và nộp báo cáo Thôn</h3>
              <p className="text-xs text-slate-400 mt-0.5">Vui lòng hoàn thành tuần tự các bước dưới đây để đảm bảo độ chuẩn hóa số liệu số.</p>
            </div>

            {/* Steps layout matches provided flow */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-emerald-600 block">BƯỚC 01</span>
                <span className="font-extrabold text-xs text-slate-800 block">Nhận Chỉ tiêu</span>
                <p className="text-[10px] text-slate-400 leading-snug">Xã phát hành thông tin nhiệm vụ rà soát.</p>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-emerald-600 block">BƯỚC 02</span>
                <span className="font-extrabold text-xs text-slate-800 block">Thu thập thực địa</span>
                <p className="text-[10px] text-slate-400 leading-snug">Ghi nhận thông tin hộ dân thực tế tại thôn.</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl space-y-1 animate-pulse">
                <span className="text-[10px] font-bold text-amber-600 block">BƯỚC 03</span>
                <span className="font-extrabold text-xs text-slate-800 block">Nhập biểu mẫu</span>
                <p className="text-[10px] text-slate-400 leading-snug">Khai trực tuyến hoặc nạp file Excel mẫu.</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block">BƯỚC 04</span>
                <span className="font-extrabold text-xs text-slate-800 block">Kiểm tra Logic</span>
                <p className="text-[10px] text-slate-400 leading-snug">AI kiểm duyệt tự động phát hiện sai số.</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block">BƯỚC 05</span>
                <span className="font-extrabold text-xs text-slate-800 block">Xã ký duyệt</span>
                <p className="text-[10px] text-slate-400 leading-snug">Duyệt dữ liệu chính thức vào kho số dùng chung.</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 pb-3 border-b border-slate-50">Danh sách tất cả nhiệm vụ của thôn</h3>
            
            <div className="space-y-4">
              {myAssignments.map(assign => {
                const task = tasks.find(t => t.id === assign.taskId);
                const submission = submissions.find(s => s.taskId === assign.taskId && s.villageId === villageId);
                if (!task) return null;

                const isApproved = assign.status === AssignmentStatus.DA_DUYET;
                const hasError = assign.status === AssignmentStatus.CO_LOI_CAN_SUA;

                return (
                  <div key={assign.id} className="p-5 bg-slate-50/50 border border-slate-200/60 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-white border text-slate-500 font-bold font-mono text-[9px] rounded-md">{task.code}</span>
                        {getStatusBadge(assign.status)}
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-800">{task.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed max-w-2xl">{task.description}</p>
                      <div className="flex gap-4 text-[10px] text-slate-400 font-bold pt-1">
                        <span>Hạn cuối: <strong className="text-red-500">11/07/2026</strong></span>
                        <span>•</span>
                        <span>Được giao bởi: <strong className="text-slate-600">Cán bộ chuyên trách Xã</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      {!isApproved ? (
                        <>
                          <button
                            onClick={() => onSelectTaskToReport(task.id)}
                            className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all"
                          >
                            Báo cáo số liệu
                          </button>
                          <button
                            onClick={() => onUploadExcelClick(task.id)}
                            className="flex-1 md:flex-none px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all"
                          >
                            Tải file Excel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => onSelectTaskToReport(task.id)}
                          className="w-full md:w-auto px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          Xem dữ liệu đã nộp
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. INPUT REPORT QUICK LAUNCH VIEW */}
      {activeTab === "input_report" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form selection block */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="space-y-1.5 border-b border-slate-50 pb-4">
              <h3 className="font-extrabold text-sm text-slate-800">Nhập báo cáo thống kê trực tuyến</h3>
              <p className="text-xs text-slate-400">Đồng chí hãy chọn nhiệm vụ báo cáo đang mở dưới đây để bắt đầu khai số hoặc nạp file Excel biểu mẫu.</p>
            </div>

            {/* Active task picker banner */}
            {activeTasks.map(task => {
              const assignment = myAssignments.find(a => a.taskId === task.id);
              const submission = submissions.find(s => s.taskId === task.id && s.villageId === villageId);
              const hasError = assignment?.status === AssignmentStatus.CO_LOI_CAN_SUA;

              return (
                <div 
                  key={task.id} 
                  className={`p-5 rounded-2xl border transition-all ${
                    hasError ? "bg-red-50/20 border-red-200" : "bg-slate-50/60 border-slate-200/80"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 bg-white border text-slate-500 font-bold font-mono text-[9px] rounded-md">{task.code}</span>
                        <h4 className="font-extrabold text-sm text-slate-800 leading-snug mt-1.5">{task.title}</h4>
                      </div>
                      {getStatusBadge(assignment?.status || AssignmentStatus.CHUA_XEM)}
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">{task.description}</p>

                    {/* Drag and Drop zone representation inside the launcher */}
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, task.id)}
                      className={`p-6 border-2 border-dashed rounded-xl text-center space-y-2.5 transition-all cursor-pointer ${
                        isDragging 
                          ? "bg-emerald-50 border-emerald-400 text-emerald-800 scale-[1.01]" 
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-500"
                      }`}
                      onClick={() => onSelectTaskToReport(task.id)}
                    >
                      <Upload className="w-8 h-8 text-slate-300 mx-auto animate-pulse" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-700">Kéo thả file Excel (.xlsx) tại đây</p>
                        <p className="text-[10px] text-slate-400 font-medium">Hoặc bấm để mở cửa sổ chọn file & biên soạn chi tiết trực tuyến</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-slate-100/50 justify-between">
                      <button
                        onClick={onDownloadTemplate}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-extrabold flex items-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        Tải biểu mẫu Excel trắng
                      </button>

                      <button
                        onClick={() => onSelectTaskToReport(task.id)}
                        className="px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1"
                      >
                        Bắt đầu điền biểu mẫu trực tuyến
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick FAQ / Helper */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-slate-800 border-b border-slate-50 pb-3">Câu hỏi thường gặp (FAQs)</h3>
              <div className="space-y-4 text-xs font-medium text-slate-600">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Hệ thống báo lỗi đỏ là gì?
                  </h4>
                  <p className="text-slate-500 leading-relaxed pl-2.5">
                    Đó là các sai sót vi phạm nghiêm trọng về logic (ví dụ: số lượng Nam + Nữ lệch so với Tổng nhân khẩu, hoặc Hộ nghèo lớn hơn Tổng số hộ). Bạn bắt buộc phải sửa lỗi đỏ mới có thể nộp.
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Hệ thống cảnh báo màu vàng (&gt;30%)?
                  </h4>
                  <p className="text-slate-500 leading-relaxed pl-2.5">
                    Khi số lượng hộ nghèo, cận nghèo hoặc tổng nhân khẩu thay đổi vượt mức 30% so với kỳ trước, AI sẽ đưa ra cảnh báo. Bạn cần tích chọn cam kết chịu trách nhiệm và giải thích rõ nguyên nhân ở phần Ghi chú (ví dụ: tách hộ hoặc nhập cư khu tái định cư).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. SUBMISSION HISTORY VIEW PAGE */}
      {activeTab === "history" && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
            <History className="w-4.5 h-4.5 text-emerald-600" />
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">Lịch sử biểu mẫu báo cáo đã nộp</h3>
              <p className="text-xs text-slate-400 mt-0.5">Danh sách các sổ liệu lịch sử đã lưu kho lưu trữ của Thôn 03.</p>
            </div>
          </div>

          <div className="space-y-3.5">
            {myAssignments.filter(a => a.status === AssignmentStatus.DA_DUYET).map(assign => {
              const task = tasks.find(t => t.id === assign.taskId);
              const sub = submissions.find(s => s.taskId === assign.taskId && s.villageId === villageId);
              
              if (!task) return null;

              return (
                <div key={assign.id} className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/60 rounded-xl transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm block">{task.title}</span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[9px]">
                        Đã duyệt lưu kho số
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-400 font-bold">
                      <span>Kỳ báo cáo: {task.reportingPeriod}</span>
                      <span>•</span>
                      <span>Tổng dân số: <strong className="text-slate-600">{sub?.formData.totalPopulation || "-"}</strong> nhân khẩu</span>
                      <span>•</span>
                      <span>Tổng số hộ: <strong className="text-slate-600">{sub?.formData.totalHouseholds || "-"}</strong> hộ</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onSelectTaskToReport(task.id)}
                      className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 font-bold text-xs shadow-xs transition-all flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      Xem chi tiết dữ liệu
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
