/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  Home, Check, Lock, Plus, Search, RefreshCw, Eye, Pencil, 
  MoreHorizontal, ChevronLeft, ChevronRight, X, Info, FileSpreadsheet, 
  Trash2, AlertCircle, HelpCircle
} from "lucide-react";
import { Village, UserRole } from "../types";

interface VillageManagerProps {
  currentUser: any;
  systemData: any;
  onUpdateState: (newState: any) => void;
  onFlashNotification: (msg: string, type?: "INFO" | "SUCCESS" | "WARNING") => void;
}

export default function VillageManager({ 
  currentUser, 
  systemData, 
  onUpdateState, 
  onFlashNotification 
}: VillageManagerProps) {
  // Local list of villages sourced from system state
  const villagesList: Village[] = useMemo(() => {
    return systemData?.villages || [];
  }, [systemData]);

  // UI States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState("Tất cả khu vực");
  const [selectedStatus, setSelectedStatus] = useState("Tất cả trạng thái");
  const [selectedLeader, setSelectedLeader] = useState("Tất cả");
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Drawer Panel States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingVillage, setEditingVillage] = useState<Village | null>(null);

  // Form States for Add / Edit
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formArea, setFormArea] = useState("");
  const [formLeader, setFormLeader] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formStatus, setFormStatus] = useState("Đang hoạt động");
  const [formAllowsReporting, setFormAllowsReporting] = useState(true);
  const [formNotes, setFormNotes] = useState("");

  // Context dropdown inside table
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Computed summary metrics
  const totalVillagesCount = villagesList.length;
  const activeVillagesCount = villagesList.filter(v => v.active).length;
  const lockedVillagesCount = villagesList.filter(v => !v.active).length;
  const newVillagesCount = villagesList.filter(v => v.isNew).length;

  const activePercentage = totalVillagesCount > 0 ? ((activeVillagesCount / totalVillagesCount) * 100).toFixed(1) : "0";
  const lockedPercentage = totalVillagesCount > 0 ? ((lockedVillagesCount / totalVillagesCount) * 100).toFixed(1) : "0";

  // Reset filter inputs
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedArea("Tất cả khu vực");
    setSelectedStatus("Tất cả trạng thái");
    setSelectedLeader("Tất cả");
    setCurrentPage(1);
    onFlashNotification("🔄 Đã làm mới các bộ lọc tìm kiếm.", "INFO");
  };

  // Open drawer for adding a new village
  const handleOpenAddDrawer = () => {
    setEditingVillage(null);
    setFormCode(`T${totalVillagesCount + 1 >= 10 ? totalVillagesCount + 1 : "0" + (totalVillagesCount + 1)}`);
    setFormName("");
    setFormArea("Khu vực 1");
    setFormLeader("");
    setFormPhone("");
    setFormEmail("");
    setFormStatus("Đang hoạt động");
    setFormAllowsReporting(true);
    setFormNotes("");
    setIsDrawerOpen(true);
  };

  // Open drawer for editing an existing village
  const handleOpenEditDrawer = (village: Village) => {
    setEditingVillage(village);
    setFormCode(village.code || `T${village.id.replace("v", "")}`);
    setFormName(village.name);
    setFormArea(village.area || "Khu vực 1");
    setFormLeader(village.leaderName);
    setFormPhone(village.phone);
    setFormEmail(village.email);
    setFormStatus(village.active ? "Đang hoạt động" : "Tạm khóa");
    setFormAllowsReporting(village.allowsReporting !== false);
    setFormNotes(village.notes || "");
    setIsDrawerOpen(true);
  };

  // Handle Form Submission (Save Village)
  const handleSaveVillage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode || !formName || !formArea || !formLeader || !formPhone) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc (*)");
      return;
    }

    const updatedVillages = [...villagesList];
    const isNew = !editingVillage;
    const villageId = editingVillage ? editingVillage.id : `v${Date.now()}`;

    const villageData: Village = {
      id: villageId,
      code: formCode,
      name: formName,
      area: formArea,
      leaderName: formLeader,
      phone: formPhone,
      email: formEmail || `${formCode.toLowerCase()}@bana.gov.vn`,
      active: formStatus === "Đang hoạt động",
      allowsReporting: formAllowsReporting,
      notes: formNotes,
      isNew: isNew ? true : editingVillage?.isNew,
      assignedTasksCount: editingVillage?.assignedTasksCount || 10,
      completedTasksCount: editingVillage?.completedTasksCount || 8
    };

    if (isNew) {
      updatedVillages.push(villageData);
    } else {
      const idx = updatedVillages.findIndex(v => v.id === editingVillage.id);
      if (idx >= 0) {
        updatedVillages[idx] = villageData;
      }
    }

    // Add Audit Log
    const newAuditLog = {
      id: `log-${Date.now()}`,
      userId: currentUser?.id || "system",
      userName: currentUser?.fullName || "Cán bộ chuyên trách",
      userRole: currentUser?.role || UserRole.CAN_BO_XA,
      action: isNew ? "Thêm mới thôn" : "Cập nhật thôn",
      entityType: "VILLAGE",
      entityId: villageId,
      details: `${isNew ? "Thêm mới" : "Cập nhật"} đơn vị thôn ${formName} (${formCode}) thuộc ${formArea}.`,
      createdAt: new Date().toISOString()
    };

    // Update system notifications
    const newNotification = {
      id: `n-${Date.now()}`,
      type: "SYSTEM",
      title: isNew ? "Thôn mới đã được thành lập" : "Thông tin thôn đã thay đổi",
      message: `Hệ thống vừa cập nhật dữ liệu của thôn ${formName} (${formCode}).`,
      read: false,
      createdAt: new Date().toISOString()
    };

    const newState = {
      ...systemData,
      villages: updatedVillages,
      auditLogs: [newAuditLog, ...(systemData.auditLogs || [])],
      notifications: [newNotification, ...(systemData.notifications || [])]
    };

    onUpdateState(newState);
    setIsDrawerOpen(false);
    onFlashNotification(
      isNew 
        ? `🎉 Đã tạo thành công thôn mới: ${formName} (${formCode})` 
        : `💾 Đã lưu thay đổi thông tin của thôn ${formName}`, 
      "SUCCESS"
    );
  };

  // Delete village handler
  const handleDeleteVillage = (id: string, name: string) => {
    if (confirm(`Đồng chí có chắc chắn muốn xóa đơn vị thôn "${name}" ra khỏi hệ thống quản lý?`)) {
      const updatedVillages = villagesList.filter(v => v.id !== id);
      
      const newAuditLog = {
        id: `log-${Date.now()}`,
        userId: currentUser?.id || "system",
        userName: currentUser?.fullName || "Cán bộ chuyên trách",
        userRole: currentUser?.role || UserRole.CAN_BO_XA,
        action: "Xóa đơn vị thôn",
        entityType: "VILLAGE",
        entityId: id,
        details: `Đã xóa đơn vị hành chính cấp thôn: ${name}.`,
        createdAt: new Date().toISOString()
      };

      const newState = {
        ...systemData,
        villages: updatedVillages,
        auditLogs: [newAuditLog, ...(systemData.auditLogs || [])]
      };

      onUpdateState(newState);
      onFlashNotification(`🗑️ Đã xóa thôn ${name} khỏi danh sách quản lý.`, "WARNING");
    }
  };

  // Simulated Excel file upload triggering new mock village creations
  const handleExcelImportSimulated = () => {
    const confirmImport = confirm(
      "📥 Đồng chí có muốn nạp dữ liệu thôn hàng loạt từ file Excel biểu mẫu (Mẫu 02-QLT.xlsx)?"
    );
    if (confirmImport) {
      // Simulate adding 2 more villages
      const mock1: Village = {
        id: `v29`,
        code: "T29",
        name: "Thôn 29 (Mới)",
        area: "Khu vực 6",
        leaderName: "Trương Quốc Khánh",
        phone: "0919 222 555",
        email: "thon29@bana.gov.vn",
        active: true,
        allowsReporting: true,
        isNew: true,
        assignedTasksCount: 0,
        completedTasksCount: 0
      };
      const mock2: Village = {
        id: `v30`,
        code: "T30",
        name: "Thôn 30 (Mới)",
        area: "Khu vực 6",
        leaderName: "Nguyễn Thị Kim",
        phone: "0919 444 888",
        email: "thon30@bana.gov.vn",
        active: true,
        allowsReporting: true,
        isNew: true,
        assignedTasksCount: 0,
        completedTasksCount: 0
      };

      const updatedVillages = [...villagesList, mock1, mock2];

      const newAuditLog = {
        id: `log-${Date.now()}`,
        userId: currentUser?.id || "system",
        userName: currentUser?.fullName || "Cán bộ chuyên trách",
        userRole: currentUser?.role || UserRole.CAN_BO_XA,
        action: "Nhập Excel đồng bộ",
        entityType: "VILLAGE",
        entityId: "batch",
        details: `Đã nhập và đồng bộ hóa thành công 2 đơn vị thôn mới từ bảng tính Excel.`,
        createdAt: new Date().toISOString()
      };

      const newState = {
        ...systemData,
        villages: updatedVillages,
        auditLogs: [newAuditLog, ...(systemData.auditLogs || [])]
      };

      onUpdateState(newState);
      onFlashNotification("📊 Nhập Excel thành công! Đã thêm Thôn 29 và Thôn 30 vào cơ sở dữ liệu.", "SUCCESS");
    }
  };

  // Filter and Search Logic
  const filteredVillages = useMemo(() => {
    return villagesList.filter((village) => {
      // Search Box (Matches Code, Name, Leader Name, Phone)
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = query === "" || 
        (village.code || "").toLowerCase().includes(query) ||
        village.name.toLowerCase().includes(query) ||
        village.leaderName.toLowerCase().includes(query) ||
        village.phone.includes(query);

      // Area Filter
      const matchesArea = selectedArea === "Tất cả khu vực" || village.area === selectedArea;

      // Status Filter
      const matchesStatus = selectedStatus === "Tất cả trạng thái" || 
        (selectedStatus === "Đang hoạt động" && village.active) || 
        (selectedStatus === "Tạm khóa" && !village.active);

      // Leader Filter
      const matchesLeader = selectedLeader === "Tất cả" || village.leaderName === selectedLeader;

      return matchesSearch && matchesArea && matchesStatus && matchesLeader;
    });
  }, [villagesList, searchQuery, selectedArea, selectedStatus, selectedLeader]);

  // Pagination Computation
  const paginatedVillages = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredVillages.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredVillages, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredVillages.length / itemsPerPage) || 1;

  // Active Area list from actual data
  const areas = ["Tất cả khu vực", "Khu vực 1", "Khu vực 2", "Khu vực 3", "Khu vực 4", "Khu vực 5", "Khu vực 6"];

  return (
    <div id="village-manager-container" className="flex flex-col lg:flex-row gap-6 font-sans">
      
      {/* LEFT SECTION: MAIN DASHBOARD & TABLE LIST */}
      <div className="flex-1 min-w-0 space-y-6">
        
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              Quản lý thôn & đơn vị
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Danh sách các đơn vị thôn, ban điều hành và tình trạng kết nối báo cáo số liệu.</p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={handleOpenAddDrawer}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 focus:outline-none"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Thêm thôn mới
            </button>
            
            <button
              onClick={handleExcelImportSimulated}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 hover:border-blue-300 font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 focus:outline-none"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Nhập Excel
            </button>
          </div>
        </div>

        {/* 4 Summary Stats Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Tổng số thôn */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4.5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-150">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Home className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng số thôn</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">{totalVillagesCount}</h3>
            </div>
          </div>

          {/* Card 2: Đang hoạt động */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4.5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-150">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Check className="w-6 h-6 stroke-[3.5]" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đang hoạt động</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{activeVillagesCount}</h3>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 py-0.5 rounded-md">{activePercentage}%</span>
              </div>
            </div>
          </div>

          {/* Card 3: Tạm khóa */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4.5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-150">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Lock className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tạm khóa</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{lockedVillagesCount}</h3>
                <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1 py-0.5 rounded-md">{lockedPercentage}%</span>
              </div>
            </div>
          </div>

          {/* Card 4: Thêm mới */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4.5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-150">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thêm mới tháng này</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">{newVillagesCount}</h3>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4.5 shadow-sm space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search inputs */}
            <div className="md:col-span-4 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm kiếm mã, tên thôn, trưởng thôn..."
                className="w-full pl-3 pr-9 py-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none text-slate-700 transition-colors placeholder:text-slate-400 font-medium"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3.5" />
            </div>

            {/* Area select */}
            <div className="md:col-span-3">
              <select
                value={selectedArea}
                onChange={(e) => {
                  setSelectedArea(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:border-blue-500 focus:outline-none font-semibold cursor-pointer"
              >
                {areas.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            {/* Status select */}
            <div className="md:col-span-3">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:border-blue-500 focus:outline-none font-semibold cursor-pointer"
              >
                <option value="Tất cả trạng thái">Tất cả trạng thái</option>
                <option value="Đang hoạt động">Đang hoạt động</option>
                <option value="Tạm khóa">Tạm khóa</option>
              </select>
            </div>

            {/* Refresh action */}
            <div className="md:col-span-2 flex gap-2">
              <button
                onClick={handleResetFilters}
                className="w-full py-2.5 text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl border border-slate-200 hover:border-slate-300 flex items-center justify-center gap-1.5 focus:outline-none active:scale-95 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                Làm mới
              </button>
            </div>
          </div>
        </div>

        {/* Data Table Container */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4 font-extrabold">Mã thôn</th>
                  <th className="px-6 py-4 font-extrabold">Tên thôn</th>
                  <th className="px-6 py-4 font-extrabold">Khu vực</th>
                  <th className="px-6 py-4 font-extrabold">Trưởng thôn</th>
                  <th className="px-6 py-4 font-extrabold">SĐT</th>
                  <th className="px-6 py-4 font-extrabold">Trạng thái</th>
                  <th className="px-6 py-4 font-extrabold text-center">Số nhiệm vụ</th>
                  <th className="px-6 py-4 font-extrabold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {paginatedVillages.length > 0 ? (
                  paginatedVillages.map((village) => (
                    <tr key={village.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Mã thôn with Optional New badge */}
                      <td className="px-6 py-3.5 font-bold text-slate-700">
                        <div className="flex items-center gap-2">
                          <span>{village.code || `T${village.id.replace("v", "")}`}</span>
                          {village.isNew && (
                            <span className="px-1.5 py-0.5 bg-blue-50 text-[8px] font-extrabold text-blue-600 border border-blue-100 rounded-md uppercase tracking-wide">
                              Mới
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tên thôn */}
                      <td className="px-6 py-3.5 font-bold text-slate-800">
                        {village.name}
                      </td>

                      {/* Khu vực */}
                      <td className="px-6 py-3.5 text-slate-500 font-medium">
                        {village.area || "Khu vực hành chính"}
                      </td>

                      {/* Trưởng thôn */}
                      <td className="px-6 py-3.5 font-bold text-slate-700">
                        {village.leaderName}
                      </td>

                      {/* SĐT */}
                      <td className="px-6 py-3.5 font-mono text-slate-500">
                        {village.phone}
                      </td>

                      {/* Trạng thái Badge */}
                      <td className="px-6 py-3.5">
                        {village.active ? (
                          <span className="px-2.5 py-0.5 inline-flex items-center gap-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 inline-flex items-center gap-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                            <span className="w-1 h-1 rounded-full bg-amber-500" />
                            Tạm khóa
                          </span>
                        )}
                      </td>

                      {/* Số nhiệm vụ */}
                      <td className="px-6 py-3.5 text-center font-bold text-slate-600">
                        {village.assignedTasksCount ?? (village.id === "v22" ? 10 : 12)}
                      </td>

                      {/* Thao tác action icons */}
                      <td className="px-6 py-3.5 text-right relative">
                        <div className="flex items-center justify-end gap-2.5">
                          {/* Eye trigger detail alert */}
                          <button
                            onClick={() => {
                              alert(
                                `🔍 CHI TIẾT ĐƠN VỊ HÀNH CHÍNH:\n` +
                                `-----------------------------------\n` +
                                `• Mã thôn: ${village.code || "N/A"}\n` +
                                `• Tên thôn: ${village.name}\n` +
                                `• Địa bàn quản lý: ${village.area || "Xã Bà Nà"}\n` +
                                `• Cán bộ phụ trách: ${village.leaderName}\n` +
                                `• Điện thoại liên hệ: ${village.phone}\n` +
                                `• Thư điện tử công vụ: ${village.email}\n` +
                                `• Số nhiệm vụ giao: ${village.assignedTasksCount ?? 12}\n` +
                                `• Tiếp nhận báo cáo: ${village.allowsReporting !== false ? "Có" : "Không"}\n` +
                                `• Ghi chú: ${village.notes || "Không có"}`
                              );
                            }}
                            title="Xem chi tiết"
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Pencil Edit trigger */}
                          <button
                            onClick={() => handleOpenEditDrawer(village)}
                            title="Sửa thông tin"
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* More Option action panel */}
                          <div className="relative">
                            <button
                              onClick={() => {
                                setActiveDropdownId(activeDropdownId === village.id ? null : village.id);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {activeDropdownId === village.id && (
                              <>
                                <div 
                                  onClick={() => setActiveDropdownId(null)}
                                  className="fixed inset-0 z-10"
                                />
                                <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-100 rounded-xl shadow-xl z-20 overflow-hidden text-left py-1">
                                  <button
                                    onClick={() => {
                                      handleOpenEditDrawer(village);
                                      setActiveDropdownId(null);
                                    }}
                                    className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <Pencil className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Hiệu chỉnh thôn</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      const updated = villagesList.map(v => v.id === village.id ? { ...v, active: !v.active } : v);
                                      const logAct = village.active ? "Tạm khóa thôn" : "Kích hoạt lại thôn";
                                      
                                      const newLog = {
                                        id: `log-${Date.now()}`,
                                        userId: currentUser?.id || "system",
                                        userName: currentUser?.fullName || "Cán bộ chuyên trách",
                                        userRole: currentUser?.role || UserRole.CAN_BO_XA,
                                        action: logAct,
                                        entityType: "VILLAGE" as any,
                                        entityId: village.id,
                                        details: `Đã thay đổi trạng thái hoạt động của ${village.name}.`,
                                        createdAt: new Date().toISOString()
                                      };

                                      onUpdateState({
                                        ...systemData,
                                        villages: updated,
                                        auditLogs: [newLog, ...(systemData.auditLogs || [])]
                                      });
                                      onFlashNotification(`⚡ Đã chuyển trạng thái ${village.name} thành công.`, "SUCCESS");
                                      setActiveDropdownId(null);
                                    }}
                                    className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{village.active ? "Tạm khóa thôn" : "Mở khóa thôn"}</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleDeleteVillage(village.id, village.name);
                                      setActiveDropdownId(null);
                                    }}
                                    className="w-full px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                    <span>Xóa thôn</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-semibold">
                      <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      Không tìm thấy thôn nào phù hợp với điều kiện lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Section */}
          <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
            <div>
              Hiển thị <span className="text-slate-800">{filteredVillages.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> - <span className="text-slate-800">{Math.min(currentPage * itemsPerPage, filteredVillages.length)}</span> trong tổng số <span className="text-slate-800">{filteredVillages.length}</span> thôn
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span>Số hàng hiển thị:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold focus:outline-none focus:border-blue-500"
                >
                  <option value={10}>10 / trang</option>
                  <option value={20}>20 / trang</option>
                  <option value={50}>50 / trang</option>
                </select>
              </div>

              {/* Prev and Next buttons */}
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-1.5 rounded-lg border bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, idx) => (
                  <button
                    key={idx + 1}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`w-7.5 h-7.5 flex items-center justify-center rounded-lg text-xs font-bold transition-all border ${
                      currentPage === idx + 1 
                        ? "bg-blue-600 text-white border-blue-600" 
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="p-1.5 rounded-lg border bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE PANEL: DETAILED SLIDE-IN DRAWER FORM */}
      {isDrawerOpen && (
        <div id="drawer-right-container" className="w-full lg:w-90 bg-white border border-slate-200 rounded-2xl shadow-2xl p-5 flex flex-col space-y-4 self-start flex-shrink-0 animate-fade-in duration-200">
          
          {/* Drawer Title Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">
                {editingVillage ? "Cập nhật thôn" : "Thêm thôn mới"}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Nhập biểu mẫu bên dưới để cấu hình đơn vị.</p>
            </div>
            
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Main Input fields form */}
          <form onSubmit={handleSaveVillage} className="space-y-3.5 text-left text-xs font-semibold text-slate-600">
            {/* Field: Mã thôn */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <span>Mã thôn</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="Nhập mã thôn (VD: T29)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none text-slate-700 transition-colors"
              />
            </div>

            {/* Field: Tên thôn */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <span>Tên thôn</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nhập tên thôn"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none text-slate-700 transition-colors font-bold text-slate-800"
              />
            </div>

            {/* Field: Khu vực */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <span>Khu vực</span>
                <span className="text-red-500">*</span>
              </label>
              <select
                value={formArea}
                onChange={(e) => setFormArea(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none text-slate-700 font-semibold"
              >
                <option value="Khu vực 1">Khu vực 1</option>
                <option value="Khu vực 2">Khu vực 2</option>
                <option value="Khu vực 3">Khu vực 3</option>
                <option value="Khu vực 4">Khu vực 4</option>
                <option value="Khu vực 5">Khu vực 5</option>
                <option value="Khu vực 6">Khu vực 6</option>
              </select>
            </div>

            {/* Field: Người phụ trách */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <span>Người phụ trách (Trưởng thôn)</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formLeader}
                onChange={(e) => setFormLeader(e.target.value)}
                placeholder="Chọn hoặc nhập tên người phụ trách"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none text-slate-700 transition-colors font-bold text-slate-800"
              />
            </div>

            {/* Field: Số điện thoại */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <span>Số điện thoại</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="Nhập số điện thoại liên hệ"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none text-slate-700 transition-colors"
              />
            </div>

            {/* Field: Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Thư điện tử công vụ (Email)
              </label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="Nhập hòm thư công vụ"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none text-slate-700 transition-colors"
              />
            </div>

            {/* Field: Trạng thái */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Trạng thái hoạt động
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none text-slate-700 font-semibold"
              >
                <option value="Đang hoạt động">Đang hoạt động</option>
                <option value="Tạm khóa">Tạm khóa</option>
              </select>
            </div>

            {/* Field: Cho phép nhận nhiệm vụ Toggle Switch */}
            <div className="flex items-center justify-between py-2 border-t border-b border-slate-100 my-2">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <span>Nhận nhiệm vụ báo cáo</span>
                  <HelpCircle className="w-3 h-3 text-slate-400 cursor-help" title="Cho phép nhận nhiệm vụ tự động khi xã phát hành" />
                </span>
                <p className="text-[9px] text-slate-400 leading-tight">Có cho phép nộp biểu mẫu trực tuyến?</p>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={formAllowsReporting}
                  onChange={(e) => setFormAllowsReporting(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Field: Ghi chú */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                <span>Ghi chú thêm</span>
                <span className="text-slate-400 font-normal">{formNotes.length}/300</span>
              </label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value.slice(0, 300))}
                placeholder="Nhập ghi chú (nếu có)"
                rows={3}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none text-slate-700 transition-colors text-xs resize-none"
              />
            </div>

            {/* Circular Info callout badge */}
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex gap-2.5 items-start">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                Thôn mới sau khi tạo sẽ có thể được phân nhiệm vụ báo cáo và theo dõi tiến độ ngay lập tức.
              </p>
            </div>

            {/* Action buttons drawer */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 font-bold text-xs rounded-xl focus:outline-none"
              >
                Hủy
              </button>
              
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors focus:outline-none"
              >
                Lưu thôn
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
