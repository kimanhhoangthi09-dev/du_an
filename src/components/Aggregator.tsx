/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  FileSpreadsheet, FileText, Download, Printer, RefreshCw, 
  Users, Home, AlertCircle, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight, Check
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { VILLAGES_LIST } from "../data/villages";

interface AggregatorProps {
  submissions: any[];
  villages?: any[];
  task: any;
  onExportExcel: (selectedVillageIds: string[]) => void;
  onExportWord: (selectedVillageIds: string[]) => void;
  onExportPdf: (selectedVillageIds: string[]) => void;
}

export default function Aggregator({
  submissions,
  villages,
  task,
  onExportExcel,
  onExportWord,
  onExportPdf
}: AggregatorProps) {
  const villagesList = villages || VILLAGES_LIST;
  const [selectedTask, setSelectedTask] = useState("Báo cáo dân số - hộ tịch");
  const [selectedPeriod, setSelectedPeriod] = useState("Tháng 07/2026");
  const [selectedVillageFilter, setSelectedVillageFilter] = useState("Tất cả thôn");
  const [selectedMetricFilter, setSelectedMetricFilter] = useState("Tất cả chi tiêu");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 1. Dynamic Villages Data Calculation
  const villagesData = villagesList.map((v, index) => {
    // Find active submission for Quý II (t-02)
    const sub = submissions.find(
      s => s.villageId === v.id && s.taskId === "t-02"
    );

    const households = sub ? Number(sub.formData.CT01) || 0 : 0;
    const population = sub ? Number(sub.formData.CT02) || 0 : 0;
    const poorHouseholds = sub ? Number(sub.formData.CT03) || 0 : 0;
    const nearPoorHouseholds = sub ? Number(sub.formData.CT04) || 0 : 0;
    const ct05 = sub ? Number(sub.formData.CT05) || 0 : 0;
    const ct06 = sub ? Number(sub.formData.CT06) || 0 : 0;
    const ct07 = sub ? Number(sub.formData.CT07) || 0 : 0;
    const ct11 = sub ? Number(sub.formData.CT11) || 0 : 0;

    let statusLabel = "Chưa nộp";
    if (sub) {
      if (sub.status === "DA_DUYET" || sub.status === "Đã duyệt") {
        statusLabel = "Đã duyệt";
      } else if (sub.status === "CO_LOI_CAN_SUA") {
        statusLabel = "Có lỗi";
      } else {
        statusLabel = "Chờ duyệt";
      }
    }

    return {
      stt: index + 1,
      id: v.id,
      code: v.code,
      name: v.name,
      households,
      population,
      poorHouseholds,
      nearPoorHouseholds,
      ct05,
      ct06,
      ct07,
      ct11,
      status: statusLabel,
      approvedTime: sub?.reviewedAt ? new Date(sub.reviewedAt).toLocaleDateString("vi-VN") + " " + new Date(sub.reviewedAt).toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'}) : "Chưa duyệt"
    };
  });

  // Filter villages based on dropdown
  const filteredVillages = villagesData.filter(v => {
    if (selectedVillageFilter !== "Tất cả thôn") {
      return v.name === selectedVillageFilter;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredVillages.length / itemsPerPage);
  const paginatedVillages = filteredVillages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 2. Live Dynamic Metrics Calculations
  const totalH = filteredVillages.reduce((sum, v) => sum + v.households, 0);
  const totalPop = filteredVillages.reduce((sum, v) => sum + v.population, 0);
  const totalPoor = filteredVillages.reduce((sum, v) => sum + v.poorHouseholds, 0);
  const totalNearPoor = filteredVillages.reduce((sum, v) => sum + v.nearPoorHouseholds, 0);
  const totalCt05 = filteredVillages.reduce((sum, v) => sum + v.ct05, 0);
  const totalCt06 = filteredVillages.reduce((sum, v) => sum + v.ct06, 0);

  const approvedCount = villagesData.filter(v => v.status === "Đã duyệt").length;

  // Previous Q1 submissions
  const q1Subs = submissions.filter(s => s.taskId === "t-01");
  const q1TotalH = q1Subs.reduce((sum, s) => sum + (Number(s.formData.CT01) || 0), 0) || 5112;
  const q1TotalPop = q1Subs.reduce((sum, s) => sum + (Number(s.formData.CT02) || 0), 0) || 20386;
  const q1TotalPoor = q1Subs.reduce((sum, s) => sum + (Number(s.formData.CT03) || 0), 0) || 219;
  const q1TotalNearPoor = q1Subs.reduce((sum, s) => sum + (Number(s.formData.CT04) || 0), 0) || 356;

  // Percentage changes
  const pctH = (((totalH - q1TotalH) / q1TotalH) * 100).toFixed(2);
  const pctPop = (((totalPop - q1TotalPop) / q1TotalPop) * 100).toFixed(2);
  const pctPoor = (((totalPoor - q1TotalPoor) / q1TotalPoor) * 100).toFixed(2);
  const pctNearPoor = (((totalNearPoor - q1TotalNearPoor) / q1TotalNearPoor) * 100).toFixed(2);

  const handleResetFilters = () => {
    setSelectedTask("Báo cáo dân số - hộ tịch");
    setSelectedPeriod("Tháng 07/2026");
    setSelectedVillageFilter("Tất cả thôn");
    setSelectedMetricFilter("Tất cả chi tiêu");
    setCurrentPage(1);
  };

  // Chart 1: households by village
  const chart1Data = villagesData.map(v => ({
    name: v.code,
    "Số hộ": v.households
  }));

  // Chart 2: Poor / Near-Poor / Non-Poor Ratios
  const normalHouseholds = Math.max(0, totalH - totalPoor - totalNearPoor);
  const pieData = [
    { name: "Hộ nghèo", value: totalPoor },
    { name: "Hộ cận nghèo", value: totalNearPoor },
    { name: "Hộ bình thường", value: normalHouseholds }
  ];
  const PIE_COLORS = ["#EF4444", "#F59E0B", "#10B981"];

  // Chart 3: fluctuations vs Q1
  const comparisonData = [
    { name: "Tổng số hộ", "Kỳ này": totalH, "Kỳ trước": q1TotalH },
    { name: "Tổng dân số", "Kỳ này": totalPop, "Kỳ trước": q1TotalPop },
    { name: "Hộ nghèo", "Kỳ này": totalPoor, "Kỳ trước": q1TotalPoor },
    { name: "Hộ cận nghèo", "Kỳ này": totalNearPoor, "Kỳ trước": q1TotalNearPoor }
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. TOP HEADER ACTION ROW WITH EXPORT BUTTONS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Tổng hợp dữ liệu báo cáo</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Tổng hợp, thống kê và phân tích dữ liệu thực tế từ 19/22 thôn đã nộp số liệu Quý II năm 2026
          </p>
        </div>

        {/* Action icons row */}
        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
          <button 
            onClick={() => onExportExcel(villagesData.map(v => v.id))}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-sm focus:outline-none"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>
          
          <button 
            onClick={() => onExportWord(villagesData.map(v => v.id))}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-blue-50 text-blue-700 hover:text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-sm focus:outline-none"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Xuất Word</span>
          </button>

          <button 
            onClick={() => onExportPdf(villagesData.map(v => v.id))}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-red-50 text-red-700 hover:text-red-800 border border-red-200 rounded-xl text-xs font-bold transition-all shadow-sm focus:outline-none"
          >
            <FileText className="w-4 h-4 text-red-600" />
            <span>Xuất PDF</span>
          </button>

          <button 
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm focus:outline-none"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>In báo cáo</span>
          </button>
        </div>
      </div>

      {/* 2. FILTERS SELECTOR PANEL BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        {/* Filter: Nhiệm vụ */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nhiệm vụ</label>
          <div className="relative">
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              className="w-full pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer appearance-none"
            >
              <option>Báo cáo dân số - hộ tịch</option>
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
              <option>Tháng 07/2026</option>
            </select>
            <div className="absolute right-3 top-3.5 pointer-events-none w-1.5 h-1.5 border-b-2 border-r-2 border-slate-400 transform rotate-45 -translate-y-1" />
          </div>
        </div>

        {/* Filter: Chọn thôn */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Chọn thôn</label>
          <div className="relative">
            <select
              value={selectedVillageFilter}
              onChange={(e) => {
                setSelectedVillageFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer appearance-none"
            >
              <option>Tất cả thôn</option>
              {villagesList.map(v => (
                <option key={v.id} value={v.name}>{v.name}</option>
              ))}
            </select>
            <div className="absolute right-3 top-3.5 pointer-events-none w-1.5 h-1.5 border-b-2 border-r-2 border-slate-400 transform rotate-45 -translate-y-1" />
          </div>
        </div>

        {/* Filter: Chỉ tiêu */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Chi tiêu</label>
          <div className="relative">
            <select
              value={selectedMetricFilter}
              onChange={(e) => setSelectedMetricFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer appearance-none"
            >
              <option>Tất cả chi tiêu</option>
              <option>Hộ nghèo & Cận nghèo</option>
            </select>
            <div className="absolute right-3 top-3.5 pointer-events-none w-1.5 h-1.5 border-b-2 border-r-2 border-slate-400 transform rotate-45 -translate-y-1" />
          </div>
        </div>

        {/* Reset filters button */}
        <button
          onClick={handleResetFilters}
          className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 font-extrabold text-xs rounded-xl border border-blue-100 transition-colors focus:outline-none"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* 3. METRICS CARDS ROW (5 COLUMNS BLOCK) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Card 1: Tổng số hộ */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tổng số hộ</p>
            <p className="text-lg font-extrabold text-slate-800 tracking-tight mt-0.5">{totalH.toLocaleString("vi-VN")}</p>
            <span className={`flex items-center gap-0.5 text-[10px] font-bold mt-1 ${Number(pctH) >= 0 ? "text-green-600" : "text-red-500"}`}>
              {Number(pctH) >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>{Math.abs(Number(pctH))}% so với kỳ trước</span>
            </span>
          </div>
        </div>

        {/* Card 2: Tổng dân số */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-3">
          <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tổng dân số</p>
            <p className="text-lg font-extrabold text-slate-800 tracking-tight mt-0.5">{totalPop.toLocaleString("vi-VN")}</p>
            <span className={`flex items-center gap-0.5 text-[10px] font-bold mt-1 ${Number(pctPop) >= 0 ? "text-green-600" : "text-red-500"}`}>
              {Number(pctPop) >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>{Math.abs(Number(pctPop))}% so với kỳ trước</span>
            </span>
          </div>
        </div>

        {/* Card 3: Số hộ nghèo */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Số hộ nghèo</p>
            <p className="text-lg font-extrabold text-red-600 tracking-tight mt-0.5">{totalPoor.toLocaleString("vi-VN")}</p>
            <span className={`flex items-center gap-0.5 text-[10px] font-bold mt-1 ${Number(pctPoor) <= 0 ? "text-green-600" : "text-red-500"}`}>
              {Number(pctPoor) <= 0 ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
              <span>{Number(pctPoor)}% so với kỳ trước</span>
            </span>
          </div>
        </div>

        {/* Card 4: Số hộ cận nghèo */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Số hộ cận nghèo</p>
            <p className="text-lg font-extrabold text-amber-600 tracking-tight mt-0.5">{totalNearPoor.toLocaleString("vi-VN")}</p>
            <span className={`flex items-center gap-0.5 text-[10px] font-bold mt-1 ${Number(pctNearPoor) <= 0 ? "text-green-600" : "text-red-500"}`}>
              {Number(pctNearPoor) <= 0 ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
              <span>{Number(pctNearPoor)}% so với kỳ trước</span>
            </span>
          </div>
        </div>

        {/* Card 5: Số thôn đã duyệt */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-3 col-span-2 md:col-span-1">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Số thôn đã duyệt</p>
            <p className="text-lg font-extrabold text-slate-800 tracking-tight mt-0.5">{approvedCount} / 22</p>
            <span className="text-[10px] text-green-600 font-extrabold block mt-1">
              {((approvedCount / 22) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* 4. MAIN SPLIT COLUMNS SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Data list by village table (Span 7) */}
        <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h3 className="font-extrabold text-slate-800 text-sm">Tổng hợp số liệu đã duyệt theo thôn</h3>

          {/* Table Container scroll */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                  <th className="py-3 px-2">STT</th>
                  <th className="py-3 px-2">Thôn</th>
                  <th className="py-3 px-2 text-right">Tổng hộ (CT01)</th>
                  <th className="py-3 px-2 text-right">Nhân khẩu (CT02)</th>
                  <th className="py-3 px-2 text-right">Hộ nghèo (CT03)</th>
                  <th className="py-3 px-2 text-right">Hộ cận nghèo (CT04)</th>
                  <th className="py-3 px-2 text-right">Người có công (CT05)</th>
                  <th className="py-3 px-2 text-right">Bảo trợ XH (CT06)</th>
                  <th className="py-3 px-2 text-center">Trạng thái</th>
                  <th className="py-3 px-2 text-center">Thời gian duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                {paginatedVillages.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-2 text-slate-400">{v.stt}</td>
                    <td className="py-3 px-2 font-bold text-slate-800">{v.name}</td>
                    <td className="py-3 px-2 text-right font-semibold font-mono">{v.status === "Chưa nộp" ? "-" : v.households.toLocaleString("vi-VN")}</td>
                    <td className="py-3 px-2 text-right font-semibold font-mono">{v.status === "Chưa nộp" ? "-" : v.population.toLocaleString("vi-VN")}</td>
                    <td className="py-3 px-2 text-right font-semibold font-mono">{v.status === "Chưa nộp" ? "-" : v.poorHouseholds.toLocaleString("vi-VN")}</td>
                    <td className="py-3 px-2 text-right font-semibold font-mono">{v.status === "Chưa nộp" ? "-" : v.nearPoorHouseholds.toLocaleString("vi-VN")}</td>
                    <td className="py-3 px-2 text-right font-semibold font-mono">{v.status === "Chưa nộp" ? "-" : v.ct05.toLocaleString("vi-VN")}</td>
                    <td className="py-3 px-2 text-right font-semibold font-mono">{v.status === "Chưa nộp" ? "-" : v.ct06.toLocaleString("vi-VN")}</td>
                    <td className="py-3 px-2 text-center">
                      <span className={`px-2 py-0.5 font-bold rounded-full text-[9px] border ${
                        v.status === "Đã duyệt" ? "bg-green-50 text-green-700 border-green-100" :
                        v.status === "Có lỗi" ? "bg-red-50 text-red-700 border-red-100" :
                        v.status === "Chờ duyệt" ? "bg-blue-50 text-blue-700 border-blue-100" :
                        "bg-gray-50 text-gray-400 border-gray-100"
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-[10px] text-slate-400">{v.approvedTime}</td>
                  </tr>
                ))}

                {/* SUMS ROW */}
                <tr className="bg-slate-50 font-bold text-slate-800 border-t border-slate-100">
                  <td className="py-3 px-2" colSpan={2}>Tổng cộng (Thực tế)</td>
                  <td className="py-3 px-2 text-right font-mono">{totalH.toLocaleString("vi-VN")}</td>
                  <td className="py-3 px-2 text-right font-mono">{totalPop.toLocaleString("vi-VN")}</td>
                  <td className="py-3 px-2 text-right font-mono">{totalPoor.toLocaleString("vi-VN")}</td>
                  <td className="py-3 px-2 text-right font-mono">{totalNearPoor.toLocaleString("vi-VN")}</td>
                  <td className="py-3 px-2 text-right font-mono">{totalCt05.toLocaleString("vi-VN")}</td>
                  <td className="py-3 px-2 text-right font-mono">{totalCt06.toLocaleString("vi-VN")}</td>
                  <td className="py-3 px-2" colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
            <span>Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredVillages.length)}/{filteredVillages.length} thôn</span>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-2.5 py-1 rounded font-bold ${
                    currentPage === page ? "bg-blue-600 text-white" : "border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RECHARTS COMPONENT GRAPHICS (Span 5) */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* Chart 1: Bar chart showing households by village */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-extrabold text-slate-800 text-xs">Tổng số hộ theo thôn (CT01)</h4>
              <span className="text-[10px] text-slate-400 font-bold">Thôn</span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart1Data} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ fontSize: 11, borderRadius: 12, border: "1px solid #E2E8F0" }} 
                    formatter={(value: any) => [`${value} hộ`, "Số hộ"]} 
                  />
                  <Bar dataKey="Số hộ" fill="#3B82F6" radius={[2, 2, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Horizontal side-by-side splits for Ratio and Variations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Chart 2: Pie chart representing households categorizations */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 flex flex-col justify-between">
              <h4 className="font-extrabold text-slate-800 text-xs text-center">Phân loại hộ dân</h4>
              
              <div className="h-32 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={55}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute text-center select-none pointer-events-none">
                  <p className="text-[8px] font-bold uppercase text-slate-400">Tổng số hộ</p>
                  <p className="text-sm font-extrabold text-slate-800 font-mono tracking-tight leading-tight mt-0.5">{totalH.toLocaleString("vi-VN")}</p>
                </div>
              </div>

              {/* Legends list */}
              <div className="space-y-1.5 text-[10px] font-semibold text-slate-600 px-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                    <span>Nghèo</span>
                  </div>
                  <span className="font-mono text-slate-700">{totalPoor}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                    <span>Cận nghèo</span>
                  </div>
                  <span className="font-mono text-slate-700">{totalNearPoor}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                    <span>Hộ thường</span>
                  </div>
                  <span className="font-mono text-slate-700">{normalHouseholds}</span>
                </div>
              </div>
            </div>

            {/* Chart 3: Fluctuation chart versus Q1 */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 flex flex-col justify-between">
              <h4 className="font-extrabold text-slate-800 text-xs">Biến động với kỳ trước</h4>

              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 5, right: 0, left: -32, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" tick={{ fontSize: 8, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 8, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 10, borderRadius: 10 }} />
                    <Bar dataKey="Kỳ này" fill="#3B82F6" barSize={8} radius={[1.5, 1.5, 0, 0]} />
                    <Bar dataKey="Kỳ trước" fill="#94A3B8" barSize={8} radius={[1.5, 1.5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Quick statistics row */}
              <div className="grid grid-cols-2 gap-1 text-[8px] font-bold text-center border-t border-slate-50 pt-2.5">
                <div className="p-1 bg-blue-50/50 rounded border border-blue-50 text-blue-700">
                  <p>Hộ: {totalH - q1TotalH >= 0 ? "+" : ""}{totalH - q1TotalH}</p>
                </div>
                <div className="p-1 bg-green-50/50 rounded border border-green-50 text-green-700">
                  <p>Dân: {totalPop - q1TotalPop >= 0 ? "+" : ""}{totalPop - q1TotalPop}</p>
                </div>
                <div className="p-1 bg-red-50/50 rounded border border-red-50 text-red-700">
                  <p>Nghèo: {totalPoor - q1TotalPoor >= 0 ? "+" : ""}{totalPoor - q1TotalPoor}</p>
                </div>
                <div className="p-1 bg-orange-50/50 rounded border border-orange-50 text-orange-700">
                  <p>Cận nghèo: {totalNearPoor - q1TotalNearPoor >= 0 ? "+" : ""}{totalNearPoor - q1TotalNearPoor}</p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 5. AI AUTOMATED INSIGHTS COMMENTS BLOCK */}
      <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="relative flex items-center justify-center p-3.5 bg-blue-50 border border-blue-100 rounded-2xl text-blue-600 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-yellow-300 flex items-center justify-center font-bold text-sm shadow-inner animate-pulse">
              🤖
            </div>
            <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
          </div>

          <div className="space-y-2">
            <h4 className="font-extrabold text-sm text-slate-800 leading-snug">Nhận xét tự động hệ thống</h4>
            
            <ul className="space-y-1.5 text-xs font-semibold text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                <span>
                  Tổng dân số thực tế tăng <strong className="text-blue-900 font-extrabold">{totalPop - q1TotalPop} người ({pctPop}%)</strong> so với kỳ trước.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                <span>
                  Tổng số hộ thực tế tăng <strong className="text-blue-900 font-extrabold">{totalH - q1TotalH} hộ ({pctH}%)</strong> so với kỳ trước.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                <span>
                  Số hộ nghèo biến động <strong className="text-red-600 font-extrabold">{totalPoor - q1TotalPoor} hộ ({pctPoor}%)</strong> so với kỳ trước.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                <span>
                  Số thôn nộp báo cáo: <strong className="text-blue-900 font-extrabold">{villagesData.filter(v => v.status !== "Chưa nộp").length} / 22 thôn</strong> (Tỷ lệ 86,4%).
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Call to action button */}
        <button className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-blue-600 font-extrabold text-xs rounded-xl shadow-sm transition-all whitespace-nowrap self-start md:self-center focus:outline-none">
          <span>Xem phân tích chi tiết</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
