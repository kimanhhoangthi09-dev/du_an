/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Save, CheckSquare, RefreshCw, Download, Upload, 
  AlertOctagon, CheckCircle2, MessageSquare, AlertTriangle, HelpCircle, Users, CheckSquare as CheckIcon
} from "lucide-react";
import * as XLSX from "xlsx";
import { Submission, ValidationIssue, Severity, ReportTask } from "../types";
import { validateReport, INDICATOR_CATALOG, normalizeValue, isAmbiguousNumber } from "../utils/validation";
import { parseExcelData, parseVillageVerticalReport } from "../utils/exportFiles";

interface ReportFormProps {
  task: ReportTask;
  villageId: string;
  villageName: string;
  leaderName: string;
  previousSubmission?: Submission;
  currentSubmissionDraft?: Submission;
  activeDigitalTeamMemberCount: number;
  activeOnlineSupportCitizenCount: number;
  onSaveDraft: (formData: Record<string, any>) => void;
  onSubmitReport: (formData: Record<string, any>, fileUploadedName?: string) => void;
  onCancel: () => void;
  onDownloadTemplate: () => void;
}

export default function ReportForm({
  task,
  villageId,
  villageName,
  leaderName,
  previousSubmission,
  currentSubmissionDraft,
  activeDigitalTeamMemberCount,
  activeOnlineSupportCitizenCount,
  onSaveDraft,
  onSubmitReport,
  onCancel,
  onDownloadTemplate
}: ReportFormProps) {
  
  // Setup default state for 14 indicators based on draft, template or empty values
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {
      villageName: villageName,
      reportingPeriod: task.reportingPeriod,
      reporterName: currentSubmissionDraft?.formData?.reporterName || leaderName,
      reporterTitle: currentSubmissionDraft?.formData?.reporterTitle || "Trưởng thôn",
      phone: currentSubmissionDraft?.formData?.phone || "0912345001",
      reportDate: currentSubmissionDraft?.formData?.reportDate || new Date().toLocaleDateString("vi-VN"),
      notes: currentSubmissionDraft?.formData?.notes || ""
    };

    // Pre-fill CT01-CT14
    INDICATOR_CATALOG.forEach(item => {
      let draftValue = currentSubmissionDraft?.formData?.[item.code];
      if (draftValue === undefined && currentSubmissionDraft?.indicators) {
        const ind = currentSubmissionDraft.indicators.find(i => i.indicatorCode === item.code);
        draftValue = ind?.rawValue;
      }
      
      // Auto pre-fill CT12 and CT13 as guidance if empty
      if (draftValue === undefined || draftValue === "") {
        if (item.code === "CT12") draftValue = activeDigitalTeamMemberCount;
        else if (item.code === "CT13") draftValue = activeOnlineSupportCitizenCount;
        else draftValue = "";
      }

      initial[item.code] = draftValue;
    });

    return initial;
  });

  const [validationResult, setValidationResult] = useState<{
    issues: ValidationIssue[];
    severity: Severity;
  } | null>(null);

  const [uploadedFileName, setUploadedFileName] = useState<string | undefined>(
    currentSubmissionDraft?.uploadedFileName
  );

  const [isDragOver, setIsDragOver] = useState(false);
  const [anomalyAccepted, setAnomalyAccepted] = useState(false);

  // Auto pre-check validation on mount or draft load
  useEffect(() => {
    handleCheckValidation(false);
  }, []);

  const handleCheckValidation = (showAlert = true) => {
    const prevData = previousSubmission?.formData;
    const result = validateReport(formData, prevData, "temp", {
      activeDigitalTeamMemberCount,
      activeOnlineSupportCitizenCount
    });
    setValidationResult(result);
    if (showAlert) {
      if (result.severity === Severity.ERROR) {
        alert("Phát hiện lỗi logic nghiêm trọng! Vui lòng kiểm tra chi tiết ở cột bên phải.");
      } else if (result.severity === Severity.WARNING) {
        alert("Số liệu có cảnh báo biến động hoặc lệch tham chiếu. Đồng chí vui lòng giải trình cụ thể trước khi nộp.");
      } else {
        alert("Dữ liệu hoàn toàn hợp lệ! Đồng chí có thể nộp báo cáo.");
      }
    }
  };

  const handleFieldChange = (code: string, val: string) => {
    setFormData(prev => ({ ...prev, [code]: val }));
  };

  // Preset CT12 and CT13 directly from actual system totals
  const handleSyncRefData = (code: "CT12" | "CT13") => {
    if (code === "CT12") {
      handleFieldChange("CT12", String(activeDigitalTeamMemberCount));
    } else {
      handleFieldChange("CT13", String(activeOnlineSupportCitizenCount));
    }
  };

  // Upload Excel handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processExcelFile(files[0]);
    }
  };

  const processExcelFile = (file: File) => {
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });

        // Detect layout style
        const hasVerticalLayout = wb.SheetNames.some(name => name.trim() === "Phiếu báo cáo") ||
          (wb.Sheets[wb.SheetNames[0]] && wb.Sheets[wb.SheetNames[0]]["A14"] && String(wb.Sheets[wb.SheetNames[0]]["A14"].v || "").trim().toUpperCase().startsWith("CT"));

        let fileFormData: Record<string, any>;

        if (hasVerticalLayout) {
          const { formData: verticalData, filenameMismatch, filenameMismatchMessage } = parseVillageVerticalReport(wb, file.name);
          if (filenameMismatch) {
            alert(`⚠️ CẢNH BÁO: ${filenameMismatchMessage}`);
          }
          fileFormData = verticalData;
        } else {
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
          const parsedList = parseExcelData(data);
          if (parsedList.length === 0) {
            alert("Không tìm thấy dữ liệu dòng nào phù hợp trong tệp Excel nộp.");
            return;
          }
          fileFormData = parsedList.find(r => 
            String(r.villageCode).toUpperCase() === villageId.toUpperCase() ||
            String(r.villageName).toLowerCase().includes(villageName.toLowerCase())
          ) || parsedList[0];
        }

        const newFormData = {
          villageName: villageName,
          reportingPeriod: task.reportingPeriod,
          reporterName: fileFormData.reporterName || formData.reporterName,
          reporterTitle: fileFormData.reporterTitle || formData.reporterTitle,
          phone: fileFormData.phone || formData.phone,
          reportDate: fileFormData.reportDate || formData.reportDate,
          notes: fileFormData.notes || `Được tải từ tệp: ${file.name}`
        };

        // Fill CT01-CT14
        INDICATOR_CATALOG.forEach(item => {
          (newFormData as Record<string, any>)[item.code] = fileFormData[item.code] !== undefined ? fileFormData[item.code] : "";
        });

        setFormData(newFormData);

        // Trigger validation check on imported values
        const prevData = previousSubmission?.formData;
        const result = validateReport(newFormData, prevData, "temp", {
          activeDigitalTeamMemberCount,
          activeOnlineSupportCitizenCount
        });
        setValidationResult(result);

        alert(`Đã nhập thành công số liệu 14 chỉ tiêu từ file Excel của thôn. Vui lòng rà soát lại kết quả phân tích bên phải.`);
      } catch (err) {
        console.error(err);
        alert("Lỗi đọc tệp Excel. Vui lòng sử dụng đúng biểu mẫu tải về.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const prevData = previousSubmission?.formData;
    const result = validateReport(formData, prevData, "temp", {
      activeDigitalTeamMemberCount,
      activeOnlineSupportCitizenCount
    });
    setValidationResult(result);

    if (result.severity === Severity.ERROR) {
      alert("Hệ thống phát hiện lỗi logic nghiêm trọng! Trưởng thôn bắt buộc phải sửa đổi trước khi nộp báo cáo.");
      return;
    }

    if (result.severity === Severity.WARNING && !anomalyAccepted) {
      alert("Có cảnh báo số liệu bất thường! Trưởng thôn phải tích chọn cam kết số liệu đúng thực tế và ghi lý do giải trình.");
      return;
    }

    if (window.confirm("Xác nhận nộp PHIẾU BÁO CÁO SỐ LIỆU VĂN HÓA - XÃ HỘI chính thức lên Ủy ban xã? Số liệu sẽ được kiểm toán tự động.")) {
      onSubmitReport(formData, uploadedFileName);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors focus:outline-none"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-extrabold text-gray-900 tracking-tight">Khai báo Phiếu báo cáo định kỳ</h2>
            <p className="text-xs text-gray-500 mt-0.5">{task.title}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <button
            onClick={onDownloadTemplate}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold border border-emerald-200/50 transition-colors focus:outline-none"
          >
            <Download className="w-3.5 h-3.5" />
            Tải Mẫu Excel
          </button>

          <label className="flex items-center gap-1.5 px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl font-bold border border-blue-200/50 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            Nộp File Excel
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Indicators input block */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="font-bold text-sm text-gray-800 uppercase tracking-wide">Phiếu báo cáo số liệu Văn hóa - Xã hội định kỳ</h3>
            <p className="text-xs text-gray-400 mt-0.5">Vui lòng điền giá trị số nguyên không âm cho toàn bộ 14 chỉ tiêu bắt buộc dưới đây.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Metadata Fields */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50/50 border border-gray-100 rounded-xl">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Thôn báo cáo</label>
                <input
                  type="text"
                  disabled
                  value={formData.villageName}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-100 font-bold text-gray-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Người lập biểu *</label>
                <input
                  type="text"
                  required
                  value={formData.reporterName}
                  onChange={(e) => handleFieldChange("reporterName", e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 focus:border-teal-500 rounded-lg bg-white focus:outline-none font-semibold text-gray-700"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Chức danh *</label>
                <input
                  type="text"
                  required
                  value={formData.reporterTitle}
                  onChange={(e) => handleFieldChange("reporterTitle", e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 focus:border-teal-500 rounded-lg bg-white focus:outline-none font-semibold text-gray-700"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Số điện thoại *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  placeholder="0912345678"
                  className="w-full px-3 py-2 text-xs border border-gray-200 focus:border-teal-500 rounded-lg bg-white focus:outline-none font-semibold text-gray-700 font-mono"
                />
              </div>
            </div>

            {/* 14 Indicators grid */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-xs text-teal-800 uppercase tracking-wide">Chi tiết 14 Chỉ tiêu văn hóa - xã hội định kỳ:</h4>
              
              <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 overflow-hidden">
                {INDICATOR_CATALOG.map((item, idx) => {
                  const val = formData[item.code];
                  const isAmb = isAmbiguousNumber(val);

                  // Reference buttons for CT12 and CT13
                  const isCT12 = item.code === "CT12";
                  const isCT13 = item.code === "CT13";

                  return (
                    <div key={item.code} className="p-3.5 hover:bg-gray-50/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1 md:max-w-md">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-teal-50 text-teal-800 text-[10px] font-extrabold rounded font-mono">
                            {item.code}
                          </span>
                          <span className="font-semibold text-xs text-gray-800">
                            {item.name}
                          </span>
                        </div>
                        {isCT12 && (
                          <div className="flex items-center gap-1 text-[10px] text-blue-600 font-medium">
                            <Users className="w-3 h-3 text-blue-500" />
                            Danh sách thực tế: <strong className="text-blue-800 font-bold">{activeDigitalTeamMemberCount} thành viên</strong> đang hoạt động.
                            <button
                              type="button"
                              onClick={() => handleSyncRefData("CT12")}
                              className="underline text-blue-600 hover:text-blue-800 font-bold ml-1"
                            >
                              [Lấy số liệu]
                            </button>
                          </div>
                        )}
                        {isCT13 && (
                          <div className="flex items-center gap-1 text-[10px] text-blue-600 font-medium">
                            <Users className="w-3 h-3 text-blue-500" />
                            Đăng ký duy nhất kỳ này: <strong className="text-blue-800 font-bold">{activeOnlineSupportCitizenCount} người dân</strong>.
                            <button
                              type="button"
                              onClick={() => handleSyncRefData("CT13")}
                              className="underline text-blue-600 hover:text-blue-800 font-bold ml-1"
                            >
                              [Lấy số liệu]
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3.5 flex-shrink-0">
                        {/* Unit badge */}
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md min-w-[40px] text-center">
                          {item.unit}
                        </span>

                        <div className="relative">
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => handleFieldChange(item.code, e.target.value)}
                            className={`w-36 px-3 py-1.5 text-xs border rounded-lg focus:outline-none font-mono font-bold text-right ${
                              isAmb 
                                ? "border-amber-300 bg-amber-50 text-amber-900 focus:border-amber-500" 
                                : "border-gray-200 focus:border-teal-500 bg-white text-gray-800"
                            }`}
                            placeholder="Nhập giá trị"
                          />
                          {isAmb && (
                            <span className="absolute -top-2.5 -right-2 p-0.5 bg-amber-500 rounded-full text-white" title="Định dạng số mơ hồ, ví dụ: 2.450">
                              <HelpCircle className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Note & Explanation */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">Giải trình bổ sung / Ghi chú biến động:</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => handleFieldChange("notes", e.target.value)}
                placeholder="Trường hợp số liệu biến động >30% (màu vàng), trưởng thôn vui lòng nhập giải trình lý do sáp nhập, biến động cư dân tại đây..."
                className="w-full px-4.5 py-3 text-xs border border-gray-200 focus:border-teal-500 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-teal-500/20"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2.5 justify-end border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => onSaveDraft(formData)}
                className="px-4.5 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 focus:outline-none"
              >
                <Save className="w-4 h-4 text-gray-500" />
                Lưu Nháp
              </button>

              <button
                type="button"
                onClick={() => handleCheckValidation(true)}
                className="px-4.5 py-2.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 focus:outline-none"
              >
                <RefreshCw className="w-4 h-4 text-teal-700" />
                Kiểm Tra Số Liệu
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-teal-700/10 transition-colors flex items-center gap-1.5 focus:outline-none"
              >
                <CheckSquare className="w-4 h-4 text-white" />
                Nộp Lên Xã Duyệt
              </button>
            </div>
          </form>
        </div>

        {/* Realtime validator side panel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 h-fit">
          <div className="border-b border-gray-50 pb-3 flex items-center gap-1.5">
            <AlertOctagon className="w-4.5 h-4.5 text-teal-600" />
            <h3 className="font-bold text-sm text-gray-800 uppercase tracking-wider">Hệ thống Kiểm duyệt số</h3>
          </div>

          {!validationResult ? (
            <div className="py-12 text-center space-y-2">
              <RefreshCw className="w-8 h-8 text-gray-300 mx-auto animate-pulse" />
              <p className="text-[11px] text-gray-400 font-medium px-4 leading-relaxed">
                Đồng chí vui lòng cập nhật số liệu và bấm "Kiểm Tra Số Liệu" để hệ thống tự động kiểm toán công thức.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Severity summary card */}
              {validationResult.severity === Severity.VALID && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs text-emerald-800">Dữ liệu Hợp lệ</h4>
                    <p className="text-[10px] text-emerald-600 mt-0.5">Tuyệt vời! Không phát hiện lỗi logic nào. Số liệu đồng nhất.</p>
                  </div>
                </div>
              )}

              {validationResult.severity === Severity.WARNING && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs text-amber-800">Cảnh báo Biến động / Sai lệch</h4>
                      <p className="text-[10px] text-amber-600 mt-0.5">Phát hiện biến động vượt 30% so với kỳ trước hoặc sai lệch dữ liệu Tổ CNS thực tế. Đồng chí cần cam kết giải trình để gửi đi.</p>
                    </div>
                  </div>

                  <label className="flex items-start gap-2 p-2 bg-white/80 rounded-lg cursor-pointer text-[10px] font-bold text-gray-700 select-none">
                    <input
                      type="checkbox"
                      checked={anomalyAccepted}
                      onChange={(e) => setAnomalyAccepted(e.target.checked)}
                      className="accent-amber-600 w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                    />
                    <span>Tôi xin chịu trách nhiệm tính chính xác của số liệu này và đã giải trình lý do ở ô Ghi chú.</span>
                  </label>
                </div>
              )}

              {validationResult.severity === Severity.ERROR && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
                  <AlertOctagon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-black text-xs text-red-800 uppercase">Khóa nộp: Số liệu có lỗi đỏ</h4>
                    <p className="text-[10px] text-red-600 mt-0.5">Có lỗi định dạng, giá trị âm, hoặc sai lệch quan hệ logic giữa các chỉ tiêu. Đồng chí bắt buộc phải sửa lỗi đỏ.</p>
                  </div>
                </div>
              )}

              {/* Display list of issues */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {validationResult.issues.map(issue => (
                  <div 
                    key={issue.id} 
                    className={`p-3.5 border rounded-xl text-xs space-y-2 ${
                      issue.severity === Severity.ERROR 
                        ? "bg-red-50/40 border-red-100" 
                        : "bg-amber-50/40 border-amber-100"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`px-2 py-0.5 font-bold text-[9px] uppercase rounded ${
                        issue.severity === Severity.ERROR ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {issue.severity === Severity.ERROR ? "Lỗi bắt buộc" : "Cảnh báo vàng"}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono font-bold">{issue.field}</span>
                    </div>

                    <p className="font-semibold text-gray-800 leading-relaxed">{issue.message}</p>
                    <div className="p-2 bg-white/80 border rounded-lg text-[10px] text-gray-600 leading-relaxed">
                      <span className="font-bold text-teal-800">Chỉ dẫn khắc phục:</span> {issue.suggestion}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
