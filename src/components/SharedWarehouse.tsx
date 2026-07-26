/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Database, Calendar, RefreshCw, List, Grid, ChevronDown, 
  ArrowUpDown, Download, MoreHorizontal, FileSpreadsheet, FileText, FileDown,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { UserProfile } from "../types";

interface SharedWarehouseProps {
  currentUser: UserProfile;
  onDownloadTemplate: () => void;
  onDownloadVillageExcel: (villageId: string) => void;
  onDownloadCommuneSummary: (type: "xlsx" | "docx") => void;
}

interface ArchiveRecord {
  id: string;
  type: "excel" | "word" | "pdf";
  taskName: string;
  villageName: string;
  period: string;
  version: string;
  status: "Đã duyệt" | "Đã nộp" | "Chờ nộp";
  updatedTime: string;
  author: string;
}

export default function SharedWarehouse({
  currentUser,
  onDownloadTemplate,
  onDownloadVillageExcel,
  onDownloadCommuneSummary
}: SharedWarehouseProps) {
  // 1. High fidelity dataset exactly matching the 10 rows in Screenshot 2
  const initialRecords: ArchiveRecord[] = [
    {
      id: "rec-1",
      type: "excel",
      taskName: "Báo cáo thu – chi ngân sách thôn",
      villageName: "Thôn 01",
      period: "Quý II/2025",
      version: "v1.0",
      status: "Đã duyệt",
      updatedTime: "24/06/2025 16:20",
      author: "Nguyễn Thị Lan"
    },
    {
      id: "rec-2",
      type: "word",
      taskName: "Báo cáo tình hình phát triển kinh tế - xã hội",
      villageName: "Thôn 02",
      period: "Quý II/2025",
      version: "v1.1",
      status: "Đã duyệt",
      updatedTime: "24/06/2025 15:45",
      author: "Trần Văn Nam"
    },
    {
      id: "rec-3",
      type: "excel",
      taskName: "Báo cáo quản lý hộ nghèo, cận nghèo",
      villageName: "Thôn 03",
      period: "Tháng 06/2025",
      version: "v1.0",
      status: "Đã nộp",
      updatedTime: "24/06/2025 10:20",
      author: "Lê Thị Hoa"
    },
    {
      id: "rec-4",
      type: "pdf",
      taskName: "Báo cáo công tác văn hóa, thể thao",
      villageName: "Thôn 04",
      period: "Quý II/2025",
      version: "v1.0",
      status: "Đã duyệt",
      updatedTime: "23/06/2025 17:05",
      author: "Nguyễn Văn Tài"
    },
    {
      id: "rec-5",
      type: "excel",
      taskName: "Báo cáo xây dựng nông thôn mới",
      villageName: "Thôn 05",
      period: "Tháng 06/2025",
      version: "v1.2",
      status: "Đã nộp",
      updatedTime: "23/06/2025 09:15",
      author: "Phạm Thị Lan"
    },
    {
      id: "rec-6",
      type: "word",
      taskName: "Báo cáo an ninh trật tự trên địa bàn",
      villageName: "Thôn 06",
      period: "Tháng 06/2025",
      version: "v1.0",
      status: "Chờ nộp",
      updatedTime: "22/06/2025 14:30",
      author: "Đặng Văn Hòa"
    },
    {
      id: "rec-7",
      type: "excel",
      taskName: "Báo cáo quản lý đất đai, tài nguyên",
      villageName: "Thôn 07",
      period: "Quý II/2025",
      version: "v1.0",
      status: "Đã duyệt",
      updatedTime: "21/06/2025 16:50",
      author: "Hoàng Văn Minh"
    },
    {
      id: "rec-8",
      type: "word",
      taskName: "Báo cáo công tác giáo dục",
      villageName: "Thôn 05",
      period: "Quý II/2025",
      version: "v1.1",
      status: "Đã nộp",
      updatedTime: "21/06/2025 11:05",
      author: "Ngô Thị Hạnh"
    },
    {
      id: "rec-9",
      type: "pdf",
      taskName: "Báo cáo công tác y tế, dân số",
      villageName: "Thôn 09",
      period: "Tháng 06/2025",
      version: "v1.0",
      status: "Chờ nộp",
      updatedTime: "20/06/2025 10:40",
      author: "Võ Thị Ngọc"
    },
    {
      id: "rec-10",
      type: "excel",
      taskName: "Báo cáo thu thuế, phí, lệ phí",
      villageName: "Thôn 10",
      period: "Quý II/2025",
      version: "v1.2",
      status: "Đã duyệt",
      updatedTime: "20/06/2025 09:20",
      author: "Phan Văn Dũng"
    }
  ];

  const [records, setRecords] = useState<ArchiveRecord[]>(initialRecords);
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedType, setSelectedType] = useState("Tất cả");
  const [selectedPeriod, setSelectedPeriod] = useState("Tất cả");
  const [selectedVillage, setSelectedVillage] = useState("Tất cả thôn");
  const [selectedStatus, setSelectedStatus] = useState("Tất cả");

  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const handleResetFilters = () => {
    setSelectedYear("2026");
    setSelectedType("Tất cả");
    setSelectedPeriod("Tất cả");
    setSelectedVillage("Tất cả thôn");
    setSelectedStatus("Tất cả");
    setCurrentPage(1);
  };

  const getFileIcon = (type: "excel" | "word" | "pdf") => {
    switch (type) {
      case "excel":
        return (
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <FileSpreadsheet className="w-4.5 h-4.5" />
          </div>
        );
      case "word":
        return (
          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
            <FileText className="w-4.5 h-4.5" />
          </div>
        );
      case "pdf":
        return (
          <div className="p-2 bg-red-50 text-red-700 rounded-lg">
            <FileDown className="w-4.5 h-4.5" />
          </div>
        );
    }
  };

  const handleDownload = (rec: ArchiveRecord) => {
    if (rec.status === "Chờ nộp") {
      alert("Hồ sơ này chưa được nộp lưu trữ, không thể tải xuống.");
      return;
    }
    // Perform simulated download
    if (rec.type === "excel") {
      onDownloadCommuneSummary("xlsx");
    } else {
      onDownloadCommuneSummary("docx");
    }
  };

  // Filter logic
  const filteredRecords = records.filter(r => {
    if (selectedType !== "Tất cả") {
      if (selectedType === "Excel" && r.type !== "excel") return false;
      if (selectedType === "Word" && r.type !== "word") return false;
      if (selectedType === "PDF" && r.type !== "pdf") return false;
    }
    if (selectedPeriod !== "Tất cả" && r.period !== selectedPeriod) return false;
    if (selectedVillage !== "Tất cả thôn" && r.villageName !== selectedVillage) return false;
    if (selectedStatus !== "Tất cả") {
      if (selectedStatus === "Đã duyệt" && r.status !== "Đã duyệt") return false;
      if (selectedStatus === "Đã nộp" && r.status !== "Đã nộp") return false;
      if (selectedStatus === "Chờ nộp" && r.status !== "Chờ nộp") return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. TOP HEADER WITH CALENDAR TIMESTAMP */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Kho dữ liệu dùng chung</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Tra cứu, xem trước và tải xuống các báo cáo, dữ liệu đã được chia sẻ trong toàn xã.
          </p>
        </div>

        {/* Date Stamp display */}
        <div className="flex items-center gap-2 px-3.5 py-2 bg-blue-50/50 border border-blue-100 rounded-xl text-xs font-bold text-blue-700 self-start md:self-center shadow-sm">
          <Calendar className="w-4 h-4 text-blue-500" />
          <span>Thứ Tư, 24/06/2026</span>
        </div>
      </div>

      {/* 2. DYNAMIC FILTERS DROPDOWNS BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
        {/* Filter: Năm */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Năm</label>
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer appearance-none"
            >
              <option>2026</option>
              <option>2025</option>
            </select>
            <div className="absolute right-3 top-3.5 pointer-events-none w-1.5 h-1.5 border-b-2 border-r-2 border-slate-400 transform rotate-45 -translate-y-1" />
          </div>
        </div>

        {/* Filter: Loại báo cáo */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Loại báo cáo</label>
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer appearance-none"
            >
              <option>Tất cả</option>
              <option>Excel</option>
              <option>Word</option>
              <option>PDF</option>
            </select>
            <div className="absolute right-3 top-3.5 pointer-events-none w-1.5 h-1.5 border-b-2 border-r-2 border-slate-400 transform rotate-45 -translate-y-1" />
          </div>
        </div>

        {/* Filter: Kỳ báo cáo */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kỳ báo cáo</label>
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer appearance-none"
            >
              <option>Tất cả</option>
              <option>Quý II/2026</option>
              <option>Tháng 06/2026</option>
            </select>
            <div className="absolute right-3 top-3.5 pointer-events-none w-1.5 h-1.5 border-b-2 border-r-2 border-slate-400 transform rotate-45 -translate-y-1" />
          </div>
        </div>

        {/* Filter: Thôn */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Thôn</label>
          <div className="relative">
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="w-full pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer appearance-none"
            >
              <option>Tất cả thôn</option>
              <option>Thôn 01</option>
              <option>Thôn 02</option>
              <option>Thôn 03</option>
              <option>Thôn 04</option>
              <option>Thôn 05</option>
              <option>Thôn 06</option>
              <option>Thôn 07</option>
              <option>Thôn 08</option>
              <option>Thôn 09</option>
              <option>Thôn 10</option>
            </select>
            <div className="absolute right-3 top-3.5 pointer-events-none w-1.5 h-1.5 border-b-2 border-r-2 border-slate-400 transform rotate-45 -translate-y-1" />
          </div>
        </div>

        {/* Filter: Trạng thái */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</label>
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer appearance-none"
            >
              <option>Tất cả</option>
              <option>Đã duyệt</option>
              <option>Đã nộp</option>
              <option>Chờ nộp</option>
            </select>
            <div className="absolute right-3 top-3.5 pointer-events-none w-1.5 h-1.5 border-b-2 border-r-2 border-slate-400 transform rotate-45 -translate-y-1" />
          </div>
        </div>

        {/* Reset button */}
        <button
          onClick={handleResetFilters}
          className="flex items-center justify-center gap-1.5 py-2 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 font-extrabold text-xs rounded-xl border border-blue-100 transition-colors focus:outline-none cursor-pointer h-[38px]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Đặt lại</span>
        </button>
      </div>

      {/* 3. LIST SUMMARY ROW WITH LAYOUT SWITCHER BUTTONS */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-700 select-none">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <Database className="w-4 h-4" />
          </div>
          <span>Tổng cộng <strong className="text-blue-600 font-extrabold">128</strong> bản ghi</span>
        </div>

        {/* View mode switcher */}
        <div className="bg-slate-100 p-0.5 rounded-xl flex items-center border border-slate-200">
          <button 
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all focus:outline-none cursor-pointer ${
              viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Dạng danh sách</span>
          </button>
          <button 
            onClick={() => setViewMode("card")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all focus:outline-none cursor-pointer ${
              viewMode === "card" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Dạng thẻ</span>
          </button>
        </div>
      </div>

      {/* 4. MAIN RECORDS CONTAINER (TABLE OR CARDS) */}
      {viewMode === "list" ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4 flex items-center gap-1">Nhiệm vụ <ArrowUpDown className="w-3 h-3" /></th>
                  <th className="py-3 px-4">Thôn <ArrowUpDown className="w-3 h-3" /></th>
                  <th className="py-3 px-4">Kỳ <ArrowUpDown className="w-3 h-3" /></th>
                  <th className="py-3 px-4">Phiên bản <ArrowUpDown className="w-3 h-3" /></th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Ngày cập nhật <ArrowUpDown className="w-3 h-3" /></th>
                  <th className="py-3 px-4 text-center">Tải xuống</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-xs font-medium">
                      Không tìm thấy bản ghi dữ liệu phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Name task with icon */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 max-w-xs md:max-w-md">
                          {getFileIcon(rec.type)}
                          <span className="font-bold text-slate-800 leading-snug truncate">{rec.taskName}</span>
                        </div>
                      </td>

                      {/* Village */}
                      <td className="py-3.5 px-4 text-slate-600">{rec.villageName}</td>

                      {/* Period */}
                      <td className="py-3.5 px-4 font-bold text-slate-600">{rec.period}</td>

                      {/* Version */}
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[10px]">{rec.version}</td>

                      {/* Status badge */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          rec.status === "Đã duyệt" ? "bg-green-50 text-green-700 border-green-100" :
                          rec.status === "Đã nộp" ? "bg-blue-50 text-blue-700 border-blue-100" :
                          "bg-amber-50 text-amber-700 border-amber-100"
                        }`}>
                          {rec.status}
                        </span>
                      </td>

                      {/* Updated Time / Author split */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-mono text-[10px] text-slate-500">{rec.updatedTime}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">{rec.author}</p>
                        </div>
                      </td>

                      {/* Download button icon */}
                      <td className="py-3.5 px-4 text-center">
                        {rec.status !== "Chờ nộp" ? (
                          <button 
                            onClick={() => handleDownload(rec)}
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors focus:outline-none cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            disabled
                            className="p-1.5 bg-slate-100 text-slate-300 rounded-lg cursor-not-allowed"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </td>

                      {/* Option dots */}
                      <td className="py-3.5 px-4">
                        <button className="text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD MATRIX VIEW MODE */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map((rec) => (
            <div key={rec.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {getFileIcon(rec.type)}
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 line-clamp-1">{rec.taskName}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{rec.villageName} • {rec.period}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase border ${
                  rec.status === "Đã duyệt" ? "bg-green-50 text-green-700 border-green-100" :
                  rec.status === "Đã nộp" ? "bg-blue-50 text-blue-700 border-blue-100" :
                  "bg-amber-50 text-amber-700 border-amber-100"
                }`}>
                  {rec.status}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                <div className="text-[9px] text-slate-400">
                  <p>Cập nhật: <span className="font-mono text-slate-500 font-semibold">{rec.updatedTime}</span></p>
                  <p className="mt-0.5">Tác giả: <span className="font-semibold text-slate-500">{rec.author}</span></p>
                </div>

                {rec.status !== "Chờ nộp" ? (
                  <button 
                    onClick={() => handleDownload(rec)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-[10px] rounded-lg transition-colors focus:outline-none cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải xuống</span>
                  </button>
                ) : (
                  <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-50 border border-slate-100 px-2 py-1 rounded">Chờ nộp</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. FOOTER PAGINATION (MATCHING SCREENSHOT 2) */}
      <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-2">
          <span>Hiển thị</span>
          <select 
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>bản ghi trên trang</span>
        </div>

        <div>
          <span>1 - {Math.min(pageSize, filteredRecords.length)} trong tổng số 128 bản ghi</span>
        </div>

        {/* Page selector indexes matching Screenshot 2 */}
        <div className="flex items-center gap-1 flex-wrap">
          <button className="p-1 border border-slate-200 hover:bg-slate-50 rounded text-slate-400" disabled>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          
          <button className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded">1</button>
          <button className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 rounded">2</button>
          <button className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 rounded">3</button>
          <button className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 rounded">4</button>
          <button className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 rounded">5</button>
          <span className="px-1.5 text-slate-400">...</span>
          <button className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 rounded">13</button>

          <button className="p-1 border border-slate-200 hover:bg-slate-50 rounded text-slate-600">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
}
