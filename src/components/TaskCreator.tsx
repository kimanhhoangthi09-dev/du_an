/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { 
  Home, FilePlus, Calendar, Users, AlertCircle, Sparkles, Plus, Check, X, 
  FileText, UploadCloud, Info, AlertTriangle, ArrowLeft, Trash2, HelpCircle,
  FileSpreadsheet, Sliders, ChevronRight, CheckSquare, Square, Settings, Send, Save
} from "lucide-react";
import { ReportTask, TaskStatus, Village } from "../types";
import { VILLAGES_LIST } from "../data/villages";

interface TaskCreatorProps {
  villages?: Village[];
  onPublishTask: (task: Partial<ReportTask>) => void;
  onCancel: () => void;
}

interface CustomRule {
  id: string;
  type: "required" | "number" | "logic" | "anomaly" | "custom";
  label: string;
  text: string;
  colorClass: string;
  icon: React.ReactNode;
}

export default function TaskCreator({ villages: parentVillages, onPublishTask, onCancel }: TaskCreatorProps) {
  // 1. Task form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reportType, setReportType] = useState("");
  const [reportingPeriod, setReportingPeriod] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [note, setNote] = useState("");
  const [assignee, setAssignee] = useState("");

  // 2. Village list states (initializing 22 standard + 6 new villages)
  const initialVillages: (Village & { isNew?: boolean })[] = [
    ...(parentVillages || VILLAGES_LIST).map(v => ({ ...v, isNew: false })),
    { id: "v23", code: "T23", name: "Thôn 23", area: "Khu vực I", leaderName: "Phùng Gia Bảo", reporterName: "Phùng Gia Bảo", reporterTitle: "Trưởng thôn", phone: "0912345023", email: "thon23@bana.gov.vn", active: true, allowReportAssignment: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isNew: true },
    { id: "v24", code: "T24", name: "Thôn 24", area: "Khu vực I", leaderName: "Nguyễn Thị Kim", reporterName: "Nguyễn Thị Kim", reporterTitle: "Trưởng thôn", phone: "0912345024", email: "thon24@bana.gov.vn", active: true, allowReportAssignment: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isNew: true },
    { id: "v25", code: "T25", name: "Thôn 25", area: "Khu vực I", leaderName: "Trần Thế Vinh", reporterName: "Trần Thế Vinh", reporterTitle: "Trưởng thôn", phone: "0912345025", email: "thon25@bana.gov.vn", active: true, allowReportAssignment: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isNew: true },
    { id: "v26", code: "T26", name: "Thôn 26", area: "Khu vực I", leaderName: "Lê Minh Tuấn", reporterName: "Lê Minh Tuấn", reporterTitle: "Trưởng thôn", phone: "0912345026", email: "thon26@bana.gov.vn", active: true, allowReportAssignment: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isNew: true },
    { id: "v27", code: "T27", name: "Thôn 27", area: "Khu vực I", leaderName: "Vũ Hải Đăng", reporterName: "Vũ Hải Đăng", reporterTitle: "Trưởng thôn", phone: "0912345027", email: "thon27@bana.gov.vn", active: true, allowReportAssignment: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isNew: true },
    { id: "v28", code: "T28", name: "Thôn 28", area: "Khu vực I", leaderName: "Hoàng Minh Triết", reporterName: "Hoàng Minh Triết", reporterTitle: "Trưởng thôn", phone: "0912345028", email: "thon28@bana.gov.vn", active: true, allowReportAssignment: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isNew: true }
  ];

  const [villages, setVillages] = useState<(Village & { isNew?: boolean })[]>(initialVillages);
  
  // Set default assigned villages mimicking the 21/28 checked state
  // Thôn 22 is unchecked. Thôn 01 to 21 checked, Thôn 23 to 28 checked.
  // 21 checked total: let's select v01-v15 and v23-v28 (exactly 21 selected!)
  const [assignedVillageIds, setAssignedVillageIds] = useState<string[]>([
    "v01", "v02", "v03", "v04", "v05", "v06", "v07", "v08", "v09", "v10",
    "v11", "v12", "v13", "v14", "v15", "v23", "v24", "v25", "v26", "v27", "v28"
  ]);

  // 3. Thêm nhanh thôn state
  const [newVillageCode, setNewVillageCode] = useState("");
  const [newVillageName, setNewVillageName] = useState("");
  const [newVillageRegion, setNewVillageRegion] = useState("");

  // 4. File uploads state
  const [guideFile, setGuideFile] = useState<File | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  
  const guideInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);

  // 5. Custom Rules list state
  const [rules, setRules] = useState<CustomRule[]>([
    {
      id: "r1",
      type: "required",
      label: "Bắt buộc",
      text: "Kiểm tra các trường bắt buộc không để trống",
      colorClass: "bg-rose-50 text-rose-700 border-rose-100",
      icon: <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
    },
    {
      id: "r2",
      type: "number",
      label: "Định dạng số",
      text: "Kiểm tra định dạng số là số nguyên/dương",
      colorClass: "bg-amber-50 text-amber-700 border-amber-100",
      icon: <Sliders className="w-3.5 h-3.5 text-amber-500" />
    },
    {
      id: "r3",
      type: "logic",
      label: "Kiểm tra logic",
      text: "Kiểm tra mối quan hệ giữa các chỉ tiêu",
      colorClass: "bg-emerald-50 text-emerald-700 border-emerald-100",
      icon: <Check className="w-3.5 h-3.5 text-emerald-500" />
    },
    {
      id: "r4",
      type: "anomaly",
      label: "Phát hiện bất thường >30%",
      text: "Cảnh báo khi giá trị thay đổi quá 30% so với kỳ trước",
      colorClass: "bg-violet-50 text-violet-700 border-violet-100",
      icon: <Sparkles className="w-3.5 h-3.5 text-violet-500" />
    }
  ]);

  // Select all / Deselect all
  const handleSelectAll = () => {
    setAssignedVillageIds(villages.map(v => v.id));
  };

  const handleDeselectAll = () => {
    setAssignedVillageIds([]);
  };

  const handleToggleVillage = (id: string) => {
    if (assignedVillageIds.includes(id)) {
      setAssignedVillageIds(assignedVillageIds.filter(vId => vId !== id));
    } else {
      setAssignedVillageIds([...assignedVillageIds, id]);
    }
  };

  // Add new village from "Thêm nhanh thôn" panel
  const handleAddNewVillage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVillageName.trim()) {
      alert("Vui lòng nhập tên thôn!");
      return;
    }

    const nextNumber = villages.length + 1;
    const paddingNum = nextNumber < 10 ? `0${nextNumber}` : `${nextNumber}`;
    const newId = `v${paddingNum}`;
    const code = newVillageCode.trim() || `TH${paddingNum}`;

    const newVillage: Village & { isNew?: boolean } = {
      id: newId,
      code: code,
      name: newVillageName.trim().startsWith("Thôn") ? newVillageName.trim() : `Thôn ${newVillageName.trim()}`,
      area: newVillageRegion || "Khu vực I",
      leaderName: "Chưa phân công",
      reporterName: "Chưa phân công",
      reporterTitle: "Trưởng thôn",
      phone: "0912345000",
      email: `${newId}@bana.gov.vn`,
      active: true,
      allowReportAssignment: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isNew: true
    };

    setVillages([...villages, newVillage]);
    setAssignedVillageIds([...assignedVillageIds, newId]); // auto check newly added village
    
    // reset form
    setNewVillageCode("");
    setNewVillageName("");
    setNewVillageRegion("");
    
    alert(`Đã thêm thành công đơn vị ${newVillage.name} vào danh sách!`);
  };

  // Add a new validation rule
  const handleAddRule = () => {
    const ruleTexts = [
      "Kiểm tra tính logic giữa tổng số hộ nghèo và cận nghèo",
      "Xác minh số lượng trẻ em đi học khớp với báo cáo hộ gia đình",
      "Đối chiếu tỉ lệ gia tăng dân số cơ học so với quý trước",
      "Cảnh báo khi nhập sai mã định danh cá nhân hoặc căn cước công dân"
    ];
    const labels = ["Kiểm tra bổ sung", "Rà soát thông tin", "Đối chiếu cơ sở", "Cảnh báo bảo mật"];
    const types: ("required" | "number" | "logic" | "anomaly" | "custom")[] = ["required", "number", "logic", "anomaly", "custom"];
    const colorClasses = [
      "bg-blue-50 text-blue-700 border-blue-100",
      "bg-purple-50 text-purple-700 border-purple-100",
      "bg-pink-50 text-pink-700 border-pink-100",
      "bg-indigo-50 text-indigo-700 border-indigo-100"
    ];

    const randomIdx = Math.floor(Math.random() * ruleTexts.length);
    const newRule: CustomRule = {
      id: `r-${Date.now()}`,
      type: types[randomIdx % types.length],
      label: labels[randomIdx % labels.length],
      text: ruleTexts[randomIdx],
      colorClass: colorClasses[randomIdx % colorClasses.length],
      icon: <Sliders className="w-3.5 h-3.5 text-blue-500" />
    };

    setRules([...rules, newRule]);
  };

  // Remove validation rule
  const handleRemoveRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Đồng chí hãy nhập Tên nhiệm vụ báo cáo!");
      return;
    }
    if (assignedVillageIds.length === 0) {
      alert("Đồng chí cần chỉ định ít nhất 1 thôn nhận nhiệm vụ!");
      return;
    }

    onPublishTask({
      title: title.trim(),
      description: description.trim() || "Nhiệm vụ thu thập dữ liệu định kỳ cho UBND Xã.",
      reportType: reportType || "Báo cáo dân số và hộ dân định kỳ",
      reportingPeriod: reportingPeriod || "Tháng 07/2026",
      startDate: startDate || new Date().toISOString().split("T")[0],
      deadline: deadline || "2026-07-25",
      assignedVillageIds,
      status: TaskStatus.DA_PHAT_HANH
    });
  };

  const handleSaveDraftLocal = () => {
    alert("Đã lưu bản nháp nhiệm vụ báo cáo thành công vào danh sách nháp!");
    onCancel();
  };

  return (
    <div className="space-y-6 font-sans pb-12 animate-fade-in">
      
      {/* Breadcrumbs matching image */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mb-1 select-none">
        <Home className="w-3.5 h-3.5 text-blue-600" />
        <span>/</span>
        <span className="hover:text-blue-600 cursor-pointer">Nhiệm vụ báo cáo</span>
        <span>/</span>
        <span className="text-slate-700">Tạo nhiệm vụ</span>
      </div>

      {/* Page Title */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Tạo nhiệm vụ báo cáo</h2>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Form Info (5 cols) */}
        <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="border-b border-slate-50 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-slate-600 tracking-wider">Thông tin nhiệm vụ</h3>
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          </div>

          <div className="space-y-4.5 text-xs">
            {/* Row 1: Tên nhiệm vụ & Mã nhiệm vụ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên nhiệm vụ <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tên nhiệm vụ báo cáo"
                  className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-blue-500 rounded-xl bg-white focus:outline-none font-semibold text-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã nhiệm vụ <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  disabled
                  value="Hệ thống tự động sinh mã"
                  className="w-full px-3.5 py-2.5 border border-slate-100 bg-slate-50 rounded-xl text-slate-400 font-semibold cursor-not-allowed text-center"
                />
              </div>
            </div>

            {/* Row 2: Mô tả */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block font-bold text-slate-700">Mô tả <span className="text-red-500">*</span></label>
                <span className="text-[10px] text-slate-400 font-bold">{description.length}/500</span>
              </div>
              <textarea
                rows={4}
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả nhiệm vụ, mục tiêu, yêu cầu nội dung báo cáo..."
                className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-blue-500 rounded-xl bg-white focus:outline-none text-slate-700 leading-relaxed"
              />
            </div>

            {/* Row 3: Ngày bắt đầu & Hạn nộp */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ngày bắt đầu <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-blue-500 rounded-xl bg-white focus:outline-none text-slate-600 font-semibold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hạn nộp <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-blue-500 rounded-xl bg-white focus:outline-none text-rose-600 font-bold font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Loại báo cáo & Người phụ trách */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Loại báo cáo <span className="text-red-500">*</span></label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 focus:border-blue-500 rounded-xl bg-white focus:outline-none font-bold text-slate-600"
                >
                  <option value="">Chọn loại báo cáo</option>
                  <option value="Báo cáo dân số và hộ dân định kỳ">Biểu mẫu 1: Dân số và Hộ dân định kỳ</option>
                  <option value="Báo cáo hộ nghèo phát sinh">Biểu mẫu 2: Hộ nghèo và Đối tượng chính sách</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Người phụ trách <span className="text-red-500">*</span></label>
                <select
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 focus:border-blue-500 rounded-xl bg-white focus:outline-none font-bold text-slate-600"
                >
                  <option value="">Chọn người phụ trách</option>
                  <option value="Nguyễn Văn Hùng">Nguyễn Văn Hùng (Cán bộ xã)</option>
                  <option value="Trần Văn Nam">Trần Văn Nam (Thư ký thống kê)</option>
                  <option value="Lê Thị Hoa">Lê Thị Hoa (Chuyên viên xã)</option>
                </select>
              </div>
            </div>

            {/* Row 5: Kỳ báo cáo & Ghi chú */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kỳ báo cáo <span className="text-red-500">*</span></label>
                <select
                  value={reportingPeriod}
                  onChange={(e) => setReportingPeriod(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 focus:border-blue-500 rounded-xl bg-white focus:outline-none font-bold text-slate-600"
                >
                  <option value="">Chọn kỳ báo cáo</option>
                  <option value="Tháng 07/2026">Tháng 07/2026</option>
                  <option value="Tháng 08/2026">Tháng 08/2026</option>
                  <option value="Quý III/2026">Quý III/2026</option>
                  <option value="Năm 2026">Năm 2026</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block font-bold text-slate-700">Ghi chú</label>
                  <span className="text-[10px] text-slate-400 font-bold">{note.length}/300</span>
                </div>
                <input
                  type="text"
                  maxLength={300}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nhập ghi chú (nếu có)"
                  className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-blue-500 rounded-xl bg-white focus:outline-none font-semibold text-slate-700"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Center Column: Assigned Villages Ledger (4 cols) */}
        <div className="xl:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="border-b border-slate-50 pb-3 flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase text-slate-600 tracking-wider">
              Chọn thôn nhận nhiệm vụ ({villages.length} thôn)
            </h3>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>

          {/* Actions Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-blue-200 text-blue-600 hover:bg-blue-50 font-bold text-[11px] rounded-lg focus:outline-none transition-colors"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                Chọn tất cả
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-[11px] rounded-lg focus:outline-none transition-colors"
              >
                <Square className="w-3.5 h-3.5" />
                Bỏ chọn tất cả
              </button>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-extrabold text-[11px] rounded-lg focus:outline-none transition-colors border border-blue-100"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm thôn
            </button>
          </div>

          {/* Scrollable Checkboxes Grid */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl h-[335px] overflow-y-auto border border-slate-100">
            {villages.map(v => {
              const isChecked = assignedVillageIds.includes(v.id);
              return (
                <label 
                  key={v.id} 
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all text-xs select-none ${
                    isChecked 
                      ? v.isNew 
                        ? "bg-emerald-50 text-emerald-900 font-bold border border-emerald-200 shadow-sm" 
                        : "bg-blue-50 text-blue-900 font-bold border border-blue-200 shadow-sm"
                      : "bg-white border border-slate-100 text-slate-600 hover:bg-slate-100/50 hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleVillage(v.id)}
                      className={`w-3.5 h-3.5 rounded focus:ring-0 ${v.isNew ? "accent-emerald-600" : "accent-blue-600"}`}
                    />
                    <span className="font-semibold">{v.name}</span>
                  </div>
                  {v.isNew && (
                    <span className="px-1.5 py-0.5 text-[8.5px] font-black uppercase text-emerald-600 bg-emerald-100 rounded-md border border-emerald-200 tracking-wider">
                      Mới
                    </span>
                  )}
                </label>
              );
            })}
          </div>

          {/* Bottom helper statuses */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1 font-bold text-slate-500">
              <Info className="w-3.5 h-3.5 text-blue-500" />
              <span>Đã chọn {assignedVillageIds.length} / {villages.length} thôn</span>
            </div>
            <div className="flex items-center gap-1 font-bold text-emerald-600">
              <Check className="w-3.5 h-3.5" />
              <span>Quản lý thôn linh hoạt</span>
            </div>
          </div>
        </div>

        {/* Right Column: Thêm nhanh thôn (3 cols) */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="border-b border-slate-50 pb-3 flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase text-slate-600 tracking-wider">Thêm nhanh thôn</h3>
            <button 
              type="button" 
              onClick={() => {
                setNewVillageCode("");
                setNewVillageName("");
                setNewVillageRegion("");
              }}
              className="text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAddNewVillage} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Mã thôn <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={newVillageCode}
                onChange={(e) => setNewVillageCode(e.target.value)}
                placeholder="Ví dụ: TH29"
                className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-blue-500 rounded-xl bg-white focus:outline-none font-semibold text-slate-700"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tên thôn <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={newVillageName}
                onChange={(e) => setNewVillageName(e.target.value)}
                placeholder="Nhập tên thôn"
                className="w-full px-3.5 py-2.5 border border-slate-200 focus:border-blue-500 rounded-xl bg-white focus:outline-none font-semibold text-slate-700"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Khu vực <span className="text-red-500">*</span></label>
              <select
                value={newVillageRegion}
                onChange={(e) => setNewVillageRegion(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 focus:border-blue-500 rounded-xl bg-white focus:outline-none font-bold text-slate-600"
              >
                <option value="">Chọn khu vực</option>
                <option value="Khu vực I">Khu vực I (Trung tâm)</option>
                <option value="Khu vực II">Khu vực II (Bán sơn địa)</option>
                <option value="Khu vực III">Khu vực III (Vùng cao đặc biệt khó khăn)</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/10 transition-colors flex items-center justify-center gap-2 focus:outline-none"
              >
                <Plus className="w-4 h-4" />
                Thêm vào danh sách
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Bottom Section: 3 Columns Grid (File Hướng dẫn, File Excel mẫu, Quy tắc dữ liệu) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        
        {/* Card 1: File hướng dẫn */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-1">
              <h4 className="text-sm font-extrabold text-slate-800">File hướng dẫn</h4>
            </div>
            <p className="text-[11px] text-slate-500 mb-4">Tải lên tài liệu hướng dẫn chi tiết cho đơn vị thực hiện</p>
            
            {/* Upload Area */}
            <div 
              onClick={() => guideInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/20"
            >
              <input 
                type="file" 
                ref={guideInputRef} 
                onChange={(e) => setGuideFile(e.target.files?.[0] || null)}
                className="hidden" 
                accept=".pdf,.docx,.doc,.pptx"
              />
              <UploadCloud className="w-8 h-8 text-blue-500 mb-2" />
              <p className="text-xs font-semibold text-slate-600">Kéo thả file vào đây hoặc</p>
              <span className="mt-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] rounded-lg shadow">
                Chọn file
              </span>
              
              {guideFile && (
                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                  <Check className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[150px]">{guideFile.name}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setGuideFile(null);
                    }}
                    className="text-slate-400 hover:text-rose-500 ml-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-1 text-[10px] font-bold text-slate-400">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>Hỗ trợ: PDF, DOCX, DOC, PPTX. Dung lượng tối đa 20MB</span>
          </div>
        </div>

        {/* Card 2: File Excel mẫu */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-extrabold text-slate-800">File Excel mẫu</h4>
            <p className="text-[11px] text-slate-500 mb-4">Tải lên file Excel mẫu để các thôn điền dữ liệu báo cáo</p>
            
            {/* Upload Area */}
            <div 
              onClick={() => templateInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/20"
            >
              <input 
                type="file" 
                ref={templateInputRef} 
                onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                className="hidden" 
                accept=".xlsx,.xls"
              />
              <FileSpreadsheet className="w-8 h-8 text-blue-500 mb-2" />
              <p className="text-xs font-semibold text-slate-600">Kéo thả file vào đây hoặc</p>
              <span className="mt-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] rounded-lg shadow">
                Chọn file
              </span>

              {templateFile && (
                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                  <Check className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[150px]">{templateFile.name}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setTemplateFile(null);
                    }}
                    className="text-slate-400 hover:text-rose-500 ml-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-1 text-[10px] font-bold text-slate-400">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>Hỗ trợ: XLSX, XLS. Dung lượng tối đa 20MB</span>
          </div>
        </div>

        {/* Card 3: Quy tắc kiểm tra dữ liệu */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-slate-800">Quy tắc kiểm tra dữ liệu</h4>
            <p className="text-[11px] text-slate-500">Thiết lập các quy tắc để hệ thống tự động kiểm tra khi nhận báo cáo</p>
            
            {/* Rules List Container */}
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {rules.length === 0 ? (
                <div className="p-4 border border-slate-100 rounded-xl bg-slate-50 text-center text-slate-400 text-[11px] font-semibold">
                  Chưa thiết lập quy tắc nào. Click Thêm quy tắc để bắt đầu.
                </div>
              ) : (
                rules.map((rule) => (
                  <div 
                    key={rule.id} 
                    className={`flex items-center justify-between p-2 rounded-xl border text-[11px] transition-all font-sans ${rule.colorClass}`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="p-1 rounded-lg bg-white/80 shadow-xs shrink-0">
                        {rule.icon}
                      </div>
                      <div className="truncate">
                        <span className="font-extrabold mr-1">{rule.label}</span>
                        <span className="text-[10px] text-slate-600 font-medium">{rule.text}</span>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleRemoveRule(rule.id)}
                      className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors focus:outline-none"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Rule Button */}
            <button
              type="button"
              onClick={handleAddRule}
              className="w-full py-2.5 border-2 border-dashed border-blue-200 hover:border-blue-400 text-blue-600 font-bold text-xs rounded-xl hover:bg-blue-50/30 transition-all flex items-center justify-center gap-1.5 focus:outline-none"
            >
              <Plus className="w-4 h-4" />
              Thêm quy tắc
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
            <Check className="w-3.5 h-3.5" />
            <span>Có thể quản lý thêm thôn mới bất cứ lúc nào</span>
          </div>
        </div>

      </div>

      {/* Bottom Full-Width Action Footer Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4.5 flex justify-end items-center gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 border border-slate-200 text-slate-500 font-extrabold text-xs rounded-xl hover:bg-slate-50 transition-colors focus:outline-none"
        >
          Hủy bỏ
        </button>

        <button
          type="button"
          onClick={handleSaveDraftLocal}
          className="px-5 py-2.5 border border-slate-200 text-blue-600 hover:bg-blue-50 font-extrabold text-xs rounded-xl transition-colors flex items-center gap-1.5 focus:outline-none"
        >
          <Save className="w-3.5 h-3.5" />
          Lưu bản nháp
        </button>

        <button
          type="button"
          onClick={handlePublish}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-500/15 transition-all flex items-center gap-1.5 focus:outline-none"
        >
          <Send className="w-3.5 h-3.5" />
          Phát hành nhiệm vụ
        </button>
      </div>

    </div>
  );
}
