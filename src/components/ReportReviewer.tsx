/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  ArrowLeft, CheckCircle2, XCircle, FileText, Download, AlertTriangle, 
  MessageSquare, User, Calendar, Clock, ChevronDown, Check, Home, 
  RefreshCw, AlertCircle, Eye, ShieldAlert
} from "lucide-react";
import { Submission, Assignment, ReportTask, Severity } from "../types";
import { validateReport, INDICATOR_CATALOG } from "../utils/validation";

interface ReportReviewerProps {
  submission: Submission;
  assignment: Assignment;
  task: ReportTask;
  previousSubmission?: Submission;
  onApprove: (reviewComment: string) => void;
  onReject: (reviewComment: string) => void;
  onCancel: () => void;
  onExportWord: () => void;
  onExportPdf: () => void;
}

export default function ReportReviewer({
  submission,
  assignment,
  task,
  previousSubmission,
  onApprove,
  onReject,
  onCancel,
  onExportWord,
  onExportPdf
}: ReportReviewerProps) {
  const [reviewComment, setReviewComment] = useState("");
  
  const villageName = submission?.formData?.villageName || "Thôn của bạn";
  const leaderName = submission?.formData?.reporterName || "Người lập báo cáo";
  const reporterTitle = submission?.formData?.reporterTitle || "Trưởng thôn";
  const phone = submission?.formData?.phone || "Chưa cung cấp";

  // Run dynamic validation on current formData
  const valResult = validateReport(submission?.formData || {}, undefined, submission?.id);
  
  const indicatorErrors = valResult.issues.filter(i => i.severity === Severity.ERROR && i.field !== "phone");
  const phoneErrors = valResult.issues.filter(i => i.severity === Severity.ERROR && i.field === "phone");
  const warnings = valResult.issues.filter(i => i.severity === Severity.WARNING);

  const errorCount = indicatorErrors.length + phoneErrors.length;
  const warningCount = warnings.length;

  const handleApprove = () => {
    onApprove(reviewComment || "Báo cáo số liệu đầy đủ, hợp lệ và đã được phê duyệt thành công.");
  };

  const handleReject = () => {
    onReject(reviewComment || "Báo cáo còn một số sai sót số liệu cần được rà soát và nộp bản điều chỉnh.");
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Breadcrumbs & Navigation Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span className="hover:text-blue-600 cursor-pointer flex items-center gap-1" onClick={onCancel}>
              <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500">Thẩm định chi tiết</span>
          </div>
          {/* Title */}
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight mt-1">
            Thẩm định báo cáo: {villageName}
          </h2>
        </div>

        {/* Action Button Headers (Word/PDF download) */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportWord}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200 transition-colors shadow-sm focus:outline-none"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Xuất thuyết minh (.docx)</span>
          </button>
          
          <button
            onClick={onExportPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100/80 text-rose-700 font-extrabold text-xs rounded-xl border border-rose-100 transition-colors shadow-sm focus:outline-none"
          >
            <Download className="w-4 h-4 text-rose-600" />
            <span>Tải PDF (.pdf)</span>
          </button>
        </div>
      </div>

      {/* Metadata Strip at the Top */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        
        {/* Nhiệm vụ */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-3">
          <div className="p-2 bg-blue-50/80 rounded-xl flex-shrink-0">
            <FileText className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Kỳ báo cáo</p>
            <p className="text-xs font-extrabold text-slate-800 truncate mt-0.5">
              Quý II năm 2026
            </p>
          </div>
        </div>

        {/* Thôn nộp */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-3">
          <div className="p-2 bg-blue-50/80 rounded-xl flex-shrink-0">
            <Home className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Thôn nộp</p>
            <p className="text-xs font-extrabold text-blue-700 mt-0.5">
              {villageName}
            </p>
          </div>
        </div>

        {/* Trạng thái */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-3">
          <div className="p-2 bg-blue-50/80 rounded-xl flex-shrink-0">
            <Clock className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Trạng thái</p>
            <div className="mt-0.5">
              <span className={`inline-flex items-center justify-center px-2.5 py-0.5 text-[10px] font-extrabold rounded-full ${
                assignment.status === "DA_DUYET" ? "text-green-700 bg-green-50 border border-green-100" :
                assignment.status === "CO_LOI_CAN_SUA" ? "text-red-700 bg-red-50 border border-red-100" :
                "text-blue-700 bg-blue-50 border border-blue-100 animate-pulse"
              }`}>
                {assignment.status === "DA_DUYET" ? "Đã duyệt" :
                 assignment.status === "CO_LOI_CAN_SUA" ? "Có lỗi" : "Chờ duyệt"}
              </span>
            </div>
          </div>
        </div>

        {/* Thời gian nộp */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-3">
          <div className="p-2 bg-blue-50/80 rounded-xl flex-shrink-0">
            <Clock className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Thời gian nộp</p>
            <p className="text-xs font-bold text-slate-600 font-mono mt-0.5">
              {submission?.submittedAt ? new Date(submission.submittedAt).toLocaleDateString("vi-VN") + " " + new Date(submission.submittedAt).toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'}) : "Chưa nộp"}
            </p>
          </div>
        </div>

        {/* Người nộp */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-3">
          <div className="p-2 bg-blue-50/80 rounded-xl flex-shrink-0">
            <User className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Người nộp</p>
            <p className="text-xs font-black text-blue-700 truncate mt-0.5">
              {leaderName}
            </p>
            <p className="text-[9px] text-slate-400 font-semibold leading-tight">{reporterTitle}</p>
          </div>
        </div>

        {/* Điện thoại */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-3">
          <div className="p-2 bg-blue-50/80 rounded-xl flex-shrink-0">
            <User className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Số điện thoại</p>
            <p className={`text-xs font-black truncate mt-0.5 ${phoneErrors.length > 0 ? "text-red-600 animate-pulse font-mono" : "text-slate-600"}`}>
              {phone}
            </p>
            {phoneErrors.length > 0 && (
              <span className="text-[8px] text-red-500 font-bold block leading-none">Lỗi định dạng SĐT</span>
            )}
          </div>
        </div>

      </div>

      {/* Split Columns Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Report Content (span 7) */}
        <div className="xl:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">
                Bảng 14 chỉ tiêu báo cáo chính thức
              </h3>
              <span className="text-[10px] font-bold text-slate-400">Đơn vị tính: Trực tiếp</span>
            </div>

            {/* Parameter list mapping */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-100 text-[10px] text-slate-400 font-black uppercase tracking-wider select-none">
                    <th className="px-4 py-2.5 text-center w-12">Mã</th>
                    <th className="px-4 py-2.5">Chỉ tiêu</th>
                    <th className="px-4 py-2.5 w-16">ĐVT</th>
                    <th className="px-4 py-2.5 text-right w-24">Báo cáo quý này</th>
                    <th className="px-4 py-2.5 text-right w-24">Báo cáo Q1 (Trước)</th>
                    <th className="px-4 py-2.5 text-right w-16">Biến động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60 text-[11px] font-semibold text-slate-600">
                  {INDICATOR_CATALOG.map((ind) => {
                    const currentVal = submission?.formData?.[ind.code];
                    const prevVal = previousSubmission?.formData?.[ind.code];
                    
                    const numCurrent = Number(currentVal) || 0;
                    const numPrev = Number(prevVal) || 0;
                    const diff = numCurrent - numPrev;

                    // Check if there is an issue on this specific field
                    const fieldIssue = valResult.issues.find(i => i.field === ind.code);

                    return (
                      <React.Fragment key={ind.code}>
                        <tr className={`hover:bg-slate-50/40 transition-colors ${fieldIssue ? "bg-red-50/10" : ""}`}>
                          <td className="px-4 py-3 text-center font-bold font-mono text-slate-400">{ind.code}</td>
                          <td className="px-4 py-3 font-bold text-slate-800">
                            <div>
                              <span>{ind.name}</span>
                              {ind.code === "CT12" && (
                                <span className="text-[9px] text-teal-600 block font-normal mt-0.5">Liên kết dữ liệu Tổ CNSCĐ</span>
                              )}
                              {ind.code === "CT13" && (
                                <span className="text-[9px] text-teal-600 block font-normal mt-0.5">Liên kết người dân được HD trực tuyến</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{ind.unit}</td>
                          <td className={`px-4 py-3 text-right font-black font-mono ${fieldIssue ? "text-red-600" : "text-slate-800"}`}>
                            {currentVal !== undefined && currentVal !== "" ? currentVal.toLocaleString("vi-VN") : <span className="text-red-400 italic font-normal text-[10px]">Trống</span>}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold font-mono text-slate-400">
                            {prevVal !== undefined && prevVal !== "" ? prevVal.toLocaleString("vi-VN") : "-"}
                          </td>
                          <td className={`px-4 py-3 text-right font-black font-mono ${diff > 0 ? "text-emerald-600" : diff < 0 ? "text-rose-500" : "text-slate-400"}`}>
                            {diff > 0 ? `+${diff}` : diff < 0 ? diff : "0"}
                          </td>
                        </tr>
                        {fieldIssue && (
                          <tr className="bg-red-50/20">
                            <td />
                            <td colSpan={5} className="px-4 py-1.5 text-[10px] text-red-600 font-bold bg-red-50/50">
                              <span className="inline-flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                {fieldIssue.message}
                              </span>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Results check, feedback (span 5) */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* Box: Kết quả kiểm tra & duyệt */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 space-y-5">
            
            <div className="border-b border-slate-50 pb-3">
              <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">
                Kết quả kiểm định tự động (Auto-QA)
              </h3>
            </div>

            {/* Metric Blocks Grid */}
            <div className="grid grid-cols-3 gap-3">
              
              {/* Lỗi chỉ tiêu */}
              <div className="bg-[#FFFDFD] border border-red-100/50 p-2.5 rounded-xl text-center flex flex-col justify-between h-[82px]">
                <div className="flex justify-center">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    indicatorErrors.length > 0 ? "bg-red-500 text-white" : "bg-green-500 text-white"
                  }`}>
                    {indicatorErrors.length > 0 ? "!" : "✓"}
                  </span>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight truncate">Lỗi chỉ số</p>
                  <p className="text-lg font-black text-red-600 font-mono mt-0.5">{indicatorErrors.length}</p>
                  <p className="text-[8px] text-red-500 font-bold">{indicatorErrors.length > 0 ? "Cần rà soát" : "Hợp lệ"}</p>
                </div>
              </div>

              {/* Lỗi SĐT */}
              <div className="bg-[#FFFDF7] border border-amber-100/50 p-2.5 rounded-xl text-center flex flex-col justify-between h-[82px]">
                <div className="flex justify-center">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    phoneErrors.length > 0 ? "bg-amber-500 text-white" : "bg-green-500 text-white"
                  }`}>
                    {phoneErrors.length > 0 ? "!" : "✓"}
                  </span>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight truncate">Lỗi liên hệ SĐT</p>
                  <p className="text-lg font-black text-amber-600 font-mono mt-0.5">{phoneErrors.length}</p>
                  <p className="text-[8px] text-amber-500 font-bold">{phoneErrors.length > 0 ? "Sai định dạng" : "Hợp lệ"}</p>
                </div>
              </div>

              {/* Cảnh báo (Anomalies) */}
              <div className="bg-[#FFFDF7] border border-amber-100/50 p-2.5 rounded-xl text-center flex flex-col justify-between h-[82px]">
                <div className="flex justify-center">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    warningCount > 0 ? "bg-amber-500 text-white" : "bg-blue-500 text-white"
                  }`}>
                    !
                  </span>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight truncate">Cảnh báo / Đột biến</p>
                  <p className="text-lg font-black text-amber-600 font-mono mt-0.5">{warningCount}</p>
                  <p className="text-[8px] text-amber-500 font-bold">Biến động vượt ±30%</p>
                </div>
              </div>

            </div>

            {/* Chi tiết lỗi list */}
            {errorCount > 0 && (
              <div className="space-y-3.5">
                <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  Chi tiết lỗi cần khắc phục ({errorCount})
                </h4>

                <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                  {valResult.issues.filter(i => i.severity === Severity.ERROR).map((issue, idx) => (
                    <div key={idx} className="p-3 bg-red-50/30 border border-red-100/60 rounded-xl flex items-start justify-between gap-3 text-[11px]">
                      <div className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="font-extrabold text-slate-800">
                            Lỗi phát hiện tại {issue.field === "phone" ? "Thông tin liên hệ" : `Chỉ tiêu ${issue.field}`}
                          </p>
                          <p className="text-slate-500 mt-0.5">
                            {issue.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chi tiết cảnh báo list */}
            {warningCount > 0 && (
              <div className="space-y-3.5 pt-1">
                <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  Danh sách cảnh báo ({warningCount})
                </h4>

                <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                  {warnings.map((issue, idx) => (
                    <div key={idx} className="p-3 bg-amber-50/30 border border-amber-100/60 rounded-xl flex items-start justify-between gap-3 text-[11px]">
                      <div className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="font-extrabold text-slate-800">
                            Chỉ tiêu {issue.field} biến động mạnh
                          </p>
                          <p className="text-slate-500 mt-0.5">
                            {issue.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback & Actions */}
            <div className="pt-2 space-y-3">
              <label className="block text-xs font-black text-slate-700">Ý kiến chỉ đạo / Phản hồi cho Trưởng thôn</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Nhập ý kiến chỉ đạo hoặc yêu cầu điều chỉnh gửi trực tiếp về Zalo Trưởng thôn..."
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none placeholder-slate-400"
              />

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handleReject}
                  disabled={assignment.status === "DA_DUYET"}
                  className="py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-extrabold text-xs rounded-xl border border-red-100 transition-colors flex items-center justify-center gap-1.5 shadow-xs focus:outline-none disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Yêu cầu sửa lại
                </button>

                <button
                  onClick={handleApprove}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-emerald-500/15 transition-colors flex items-center justify-center gap-1.5 focus:outline-none"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Duyệt báo cáo
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
