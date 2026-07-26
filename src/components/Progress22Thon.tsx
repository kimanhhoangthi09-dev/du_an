/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Eye, RefreshCw, Calendar, Send, Info, ChevronDown, Search, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, 
  MoreHorizontal, Download, Ban, Check, CheckCircle2, Clock, AlertTriangle, XCircle
} from "lucide-react";

interface ProgressRowData {
  id: string;
  index: number;
  villageName: string;
  status: "Đã nộp" | "Đang thực hiện" | "Có lỗi" | "Quá hạn" | "Chưa bắt đầu";
  completionRate: string;
  completionRateValue: number;
  timelineActiveDots: number;
  submitTime: string;
  errorsCount: string;
  deadline: string;
  isDeadlineOverdue?: boolean;
  assignee: string;
}

interface Progress22ThonProps {
  onTriggerZaloReminder?: (villageId?: string) => void;
  onExtendDeadline?: (villageId: string) => void;
  onSelectVillageToReview?: (villageId: string) => void;
}

export default function Progress22Thon({
  onTriggerZaloReminder,
  onExtendDeadline,
  onSelectVillageToReview
}: Progress22ThonProps) {
  // Mock Data containing all 22 villages precisely corresponding to the screenshot
  const initialRows: ProgressRowData[] = [
    {
      id: "v01",
      index: 1,
      villageName: "Thôn 01",
      status: "Đã nộp",
      completionRate: "100%",
      completionRateValue: 100,
      timelineActiveDots: 12,
      submitTime: "22/06/2025 09:15",
      errorsCount: "0",
      deadline: "25/06/2025",
      assignee: "Trần Văn Nam"
    },
    {
      id: "v02",
      index: 2,
      villageName: "Thôn 02",
      status: "Đang thực hiện",
      completionRate: "78,6%",
      completionRateValue: 78.6,
      timelineActiveDots: 9,
      submitTime: "-",
      errorsCount: "1",
      deadline: "25/06/2025",
      assignee: "Lê Thị Hoa"
    },
    {
      id: "v03",
      index: 3,
      villageName: "Thôn 03",
      status: "Đang thực hiện",
      completionRate: "63,6%",
      completionRateValue: 63.6,
      timelineActiveDots: 8,
      submitTime: "-",
      errorsCount: "0",
      deadline: "25/06/2025",
      assignee: "Nguyễn Văn Tài"
    },
    {
      id: "v04",
      index: 4,
      villageName: "Thôn 04",
      status: "Có lỗi",
      completionRate: "42,9%",
      completionRateValue: 42.9,
      timelineActiveDots: 5,
      submitTime: "21/06/2025 16:40",
      errorsCount: "2",
      deadline: "25/06/2025",
      assignee: "Phạm Thị Lan"
    },
    {
      id: "v05",
      index: 5,
      villageName: "Thôn 05",
      status: "Quá hạn",
      completionRate: "50,0%",
      completionRateValue: 50.0,
      timelineActiveDots: 6,
      submitTime: "20/06/2025 11:05",
      errorsCount: "1",
      deadline: "20/06/2025",
      isDeadlineOverdue: true,
      assignee: "Đặng Văn Hòa"
    },
    {
      id: "v06",
      index: 6,
      villageName: "Thôn 06",
      status: "Đã nộp",
      completionRate: "100%",
      completionRateValue: 100,
      timelineActiveDots: 12,
      submitTime: "22/06/2025 08:50",
      errorsCount: "0",
      deadline: "25/06/2025",
      assignee: "Hồ Văn Sơn"
    },
    {
      id: "v07",
      index: 7,
      villageName: "Thôn 07",
      status: "Đang thực hiện",
      completionRate: "35,7%",
      completionRateValue: 35.7,
      timelineActiveDots: 4,
      submitTime: "-",
      errorsCount: "0",
      deadline: "25/06/2025",
      assignee: "Vũ Thị Minh"
    },
    {
      id: "v08",
      index: 8,
      villageName: "Thôn 08",
      status: "Đang thực hiện",
      completionRate: "81,8%",
      completionRateValue: 81.8,
      timelineActiveDots: 10,
      submitTime: "-",
      errorsCount: "0",
      deadline: "25/06/2025",
      assignee: "Huỳnh Văn Lợi"
    },
    {
      id: "v09",
      index: 9,
      villageName: "Thôn 09",
      status: "Đã nộp",
      completionRate: "100%",
      completionRateValue: 100,
      timelineActiveDots: 12,
      submitTime: "22/06/2025 10:20",
      errorsCount: "0",
      deadline: "25/06/2025",
      assignee: "Trương Thị Hằng"
    },
    {
      id: "v10",
      index: 10,
      villageName: "Thôn 10",
      status: "Có lỗi",
      completionRate: "57,1%",
      completionRateValue: 57.1,
      timelineActiveDots: 7,
      submitTime: "22/06/2025 14:30",
      errorsCount: "1",
      deadline: "25/06/2025",
      assignee: "Ngô Văn Dũng"
    },
    {
      id: "v11",
      index: 11,
      villageName: "Thôn 11",
      status: "Đã nộp",
      completionRate: "100%",
      completionRateValue: 100,
      timelineActiveDots: 12,
      submitTime: "22/06/2025 15:10",
      errorsCount: "0",
      deadline: "25/06/2025",
      assignee: "Nguyễn Hữu Khang"
    },
    {
      id: "v12",
      index: 12,
      villageName: "Thôn 12",
      status: "Đang thực hiện",
      completionRate: "71,4%",
      completionRateValue: 71.4,
      timelineActiveDots: 8,
      submitTime: "-",
      errorsCount: "0",
      deadline: "25/06/2025",
      assignee: "Phan Thanh Hà"
    },
    {
      id: "v13",
      index: 13,
      villageName: "Thôn 13",
      status: "Đang thực hiện",
      completionRate: "45,5%",
      completionRateValue: 45.5,
      timelineActiveDots: 5,
      submitTime: "-",
      errorsCount: "0",
      deadline: "25/06/2025",
      assignee: "Bùi Thị Lan"
    },
    {
      id: "v14",
      index: 14,
      villageName: "Thôn 14",
      status: "Đã nộp",
      completionRate: "100%",
      completionRateValue: 100,
      timelineActiveDots: 12,
      submitTime: "23/06/2025 09:40",
      errorsCount: "0",
      deadline: "25/06/2025",
      assignee: "Nguyễn Quốc Bảo"
    },
    {
      id: "v15",
      index: 15,
      villageName: "Thôn 15",
      status: "Đang thực hiện",
      completionRate: "50,0%",
      completionRateValue: 50.0,
      timelineActiveDots: 6,
      submitTime: "-",
      errorsCount: "0",
      deadline: "25/06/2025",
      assignee: "Trần Quang Minh"
    },
    {
      id: "v16",
      index: 16,
      villageName: "Thôn 16",
      status: "Đang thực hiện",
      completionRate: "60,0%",
      completionRateValue: 60,
      timelineActiveDots: 7,
      submitTime: "-",
      errorsCount: "0",
      deadline: "25/06/2025",
      assignee: "Phạm Thị Thùy"
    },
    {
      id: "v17",
      index: 17,
      villageName: "Thôn 17",
      status: "Đã nộp",
      completionRate: "100%",
      completionRateValue: 100,
      timelineActiveDots: 12,
      submitTime: "24/06/2025 08:15",
      errorsCount: "0",
      deadline: "25/06/2025",
      assignee: "Vũ Văn Cường"
    },
    {
      id: "v18",
      index: 18,
      villageName: "Thôn 18",
      status: "Đang thực hiện",
      completionRate: "27,3%",
      completionRateValue: 27.3,
      timelineActiveDots: 3,
      submitTime: "-",
      errorsCount: "0",
      deadline: "25/06/2025",
      assignee: "Lê Văn Tùng"
    },
    {
      id: "v19",
      index: 19,
      villageName: "Thôn 19",
      status: "Đã nộp",
      completionRate: "100%",
      completionRateValue: 100,
      timelineActiveDots: 12,
      submitTime: "23/06/2025 16:20",
      errorsCount: "0",
      deadline: "25/06/2025",
      assignee: "Đặng Hồng Nhung"
    },
    {
      id: "v20",
      index: 20,
      villageName: "Thôn 20",
      status: "Đang thực hiện",
      completionRate: "90,9%",
      completionRateValue: 90.9,
      timelineActiveDots: 11,
      submitTime: "-",
      errorsCount: "0",
      deadline: "25/06/2025",
      assignee: "Nguyễn Trung Kiên"
    },
    {
      id: "v21",
      index: 21,
      villageName: "Thôn 21",
      status: "Đã nộp",
      completionRate: "100%",
      completionRateValue: 100,
      timelineActiveDots: 12,
      submitTime: "24/06/2025 14:00",
      errorsCount: "0",
      deadline: "25/06/2025",
      assignee: "Trần Quốc Khánh"
    },
    {
      id: "v22",
      index: 22,
      villageName: "Thôn 22",
      status: "Chưa bắt đầu",
      completionRate: "0,0%",
      completionRateValue: 0,
      timelineActiveDots: 0,
      submitTime: "-",
      errorsCount: "0",
      deadline: "25/06/2025",
      assignee: "Lê Thị Ngọc"
    }
  ];

  // Component States
  const [rows, setRows] = useState<ProgressRowData[]>(initialRows);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [reportingPeriodFilter, setReportingPeriodFilter] = useState("Quý II/2026");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Hardcoded Top Metrics boxes (as per screenshot)
  const metrics = [
    {
      title: "Đã xem",
      value: 22,
      percentage: "100%",
      colorClass: "text-blue-600 bg-blue-50/50 border-blue-100",
      icon: <Eye className="w-5.5 h-5.5 text-blue-600" />
    },
    {
      title: "Đang thực hiện",
      value: 10,
      percentage: "45,5%",
      colorClass: "text-amber-500 bg-amber-50/50 border-amber-100",
      icon: <Clock className="w-5.5 h-5.5 text-amber-500" />
    },
    {
      title: "Đã nộp",
      value: 10,
      percentage: "45,5%",
      colorClass: "text-green-600 bg-green-50/50 border-green-100",
      icon: <CheckCircle2 className="w-5.5 h-5.5 text-green-600" />
    },
    {
      title: "Có lỗi",
      value: 2,
      percentage: "9,1%",
      colorClass: "text-red-500 bg-red-50/50 border-red-100",
      icon: <XCircle className="w-5.5 h-5.5 text-red-500" />
    },
    {
      title: "Quá hạn",
      value: 1,
      percentage: "4,5%",
      colorClass: "text-purple-600 bg-purple-50/50 border-purple-100",
      icon: <AlertTriangle className="w-5.5 h-5.5 text-purple-600" />
    }
  ];

  // Filter Logic
  const filteredRows = rows.filter(row => {
    const matchesSearch = row.villageName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          row.assignee.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (statusFilter === "ALL") return true;
    if (statusFilter === "DA_NOP" && row.status === "Đã nộp") return true;
    if (statusFilter === "DANG_THUC_HIEN" && row.status === "Đang thực hiện") return true;
    if (statusFilter === "CO_LOI" && row.status === "Có lỗi") return true;
    if (statusFilter === "QUA_HAN" && row.status === "Quá hạn") return true;
    if (statusFilter === "CHUA_BAT_DAU" && row.status === "Chưa bắt đầu") return true;

    return false;
  });

  // Pagination Logic
  const totalItems = filteredRows.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const indexOfLastItem = currentPage * pageSize;
  const indexOfFirstItem = indexOfLastItem - pageSize;
  const currentItems = filteredRows.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setReportingPeriodFilter("Quý II/2026");
    setCurrentPage(1);
    setRows(initialRows);
    alert("Hệ thống đã cập nhật dữ liệu tiến độ mới nhất!");
  };

  const handleTriggerRemind = () => {
    if (onTriggerZaloReminder) {
      onTriggerZaloReminder();
    } else {
      alert("Đã gửi tin nhắn nhắc nộp báo cáo Zalo tự động đến tất cả các trưởng thôn chưa hoàn thành!");
    }
  };

  const handleExtend = (villageId: string) => {
    if (onExtendDeadline) {
      onExtendDeadline(villageId);
    } else {
      alert(`Đã thực hiện gia hạn nộp báo cáo cho đơn vị tương ứng.`);
    }
  };

  const handleReview = (villageId: string) => {
    if (onSelectVillageToReview) {
      onSelectVillageToReview(villageId);
    } else {
      alert(`Đang tải chi tiết báo cáo và hồ sơ kiểm định của đơn vị...`);
    }
  };

  // Status Badge Component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Đã nộp":
        return (
          <span className="inline-flex items-center justify-center px-3 py-1 text-[11px] font-bold text-green-700 bg-green-50 border border-green-100/60 rounded-full">
            Đã nộp
          </span>
        );
      case "Đang thực hiện":
        return (
          <span className="inline-flex items-center justify-center px-3 py-1 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-100/60 rounded-full">
            Đang thực hiện
          </span>
        );
      case "Có lỗi":
        return (
          <span className="inline-flex items-center justify-center px-3 py-1 text-[11px] font-bold text-red-600 bg-red-50 border border-red-100/60 rounded-full">
            Có lỗi
          </span>
        );
      case "Quá hạn":
        return (
          <span className="inline-flex items-center justify-center px-3 py-1 text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-100/60 rounded-full">
            Quá hạn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center justify-center px-3 py-1 text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-200/60 rounded-full">
            Chưa bắt đầu
          </span>
        );
    }
  };

  // Timeline render helper
  const renderTimeline = (row: ProgressRowData) => {
    const labels = ["01", "03", "05", "07", "09", "11", "13", "15", "17", "19", "21", "22"];
    
    let dotColorClass = "bg-slate-200 border-slate-300";
    let activeLineColor = "bg-slate-200";

    if (row.status === "Đã nộp") {
      dotColorClass = "bg-green-500 border-green-500";
      activeLineColor = "bg-green-500";
    } else if (row.status === "Đang thực hiện") {
      dotColorClass = "bg-orange-500 border-orange-500";
      activeLineColor = "bg-orange-500";
    } else if (row.status === "Có lỗi") {
      dotColorClass = "bg-red-500 border-red-500";
      activeLineColor = "bg-red-500";
    } else if (row.status === "Quá hạn") {
      dotColorClass = "bg-purple-500 border-purple-500";
      activeLineColor = "bg-purple-500";
    }

    return (
      <div className="relative flex flex-col justify-center py-2 select-none w-full max-w-[270px]">
        {/* Grey background line */}
        <div className="absolute top-[15px] left-[10px] right-[10px] h-[2.5px] bg-slate-200/80 rounded" />
        
        {/* Active colored line segment */}
        {row.timelineActiveDots > 0 && (
          <div 
            className={`absolute top-[15px] left-[10px] h-[2.5px] rounded ${activeLineColor}`}
            style={{
              width: `${((row.timelineActiveDots - 1) / 11) * 100}%`,
              maxWidth: "calc(100% - 20px)"
            }}
          />
        )}

        {/* Nodes and Subtext Labels */}
        <div className="flex justify-between relative z-10">
          {labels.map((lbl, idx) => {
            const isActive = idx < row.timelineActiveDots;
            return (
              <div key={lbl} className="flex flex-col items-center">
                <div 
                  className={`w-2 h-2 rounded-full border transition-all ${
                    isActive 
                      ? `${dotColorClass} shadow-xs`
                      : "bg-white border-slate-300"
                  }`}
                />
                <span className="text-[8.5px] text-slate-400 font-extrabold font-mono mt-1 select-none scale-90">{lbl}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Progress Bar for completion rate column
  const renderProgressBar = (row: ProgressRowData) => {
    let barBg = "bg-slate-200";
    let progressBg = "bg-slate-300";

    if (row.status === "Đã nộp") {
      progressBg = "bg-green-500";
    } else if (row.status === "Đang thực hiện") {
      progressBg = "bg-orange-400";
    } else if (row.status === "Có lỗi") {
      progressBg = "bg-red-500";
    } else if (row.status === "Quá hạn") {
      progressBg = "bg-purple-500";
    }

    return (
      <div className="flex items-center gap-2.5 min-w-[100px]">
        <span className="font-extrabold font-mono text-slate-700 text-xs w-9 text-left">
          {row.completionRate}
        </span>
        <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
          <div 
            className={`h-full rounded-full ${progressBg}`}
            style={{ width: `${row.completionRateValue}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans pb-12 animate-fade-in">
      
      {/* Page Header Area */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Tiến độ 22 thôn</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Theo dõi tiến độ lập và nộp báo cáo của 22 thôn
          </p>
        </div>
        
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4.5 h-4.5 text-blue-600" />
          <span className="text-xs font-extrabold text-blue-700">Thứ Tư, 25/06/2025</span>
        </div>
      </div>

      {/* 5 Top Metrics Grid Box Layout */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {metrics.map((box, i) => (
          <div 
            key={i} 
            className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4 transition-all hover:scale-[1.01]"
          >
            <div className={`p-2.5 rounded-full ${box.colorClass.split(" ")[1]} flex-shrink-0`}>
              {box.icon}
            </div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">{box.title}</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-slate-800 tracking-tight">{box.value}</span>
                <span className="text-xs font-extrabold text-slate-400">{box.percentage}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Blue Shaded Filters Toolbar Container */}
      <div className="bg-[#F8FAFC] border border-slate-200/60 p-4.5 rounded-2xl flex flex-col lg:flex-row items-center justify-between gap-4.5">
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
          {/* Trạng thái filter */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Trạng thái</label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-44 px-3.5 py-2.5 pr-8 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none text-xs font-extrabold text-slate-700 appearance-none cursor-pointer"
              >
                <option value="ALL">Tất cả</option>
                <option value="DA_NOP">Đã nộp</option>
                <option value="DANG_THUC_HIEN">Đang thực hiện</option>
                <option value="CO_LOI">Có lỗi</option>
                <option value="QUA_HAN">Quá hạn</option>
                <option value="CHUA_BAT_DAU">Chưa bắt đầu</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Thời gian */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Thời gian</label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-slate-600 select-none">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>01/04/2026 - 30/06/2026</span>
            </div>
          </div>

          {/* Kỳ báo cáo */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Kỳ báo cáo</label>
            <div className="relative">
              <select
                value={reportingPeriodFilter}
                onChange={(e) => setReportingPeriodFilter(e.target.value)}
                className="w-full sm:w-44 px-3.5 py-2.5 pr-8 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none text-xs font-extrabold text-slate-700 appearance-none cursor-pointer"
              >
                <option value="Quý I/2026">Quý I/2026</option>
                <option value="Quý II/2026">Quý II/2026</option>
                <option value="Quý III/2026">Quý III/2026</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Search, Reset and Reminder actions */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm kiếm thôn, người phụ trách..."
              className="w-full pl-3.5 pr-10 py-2.5 text-xs font-semibold bg-white border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none text-slate-700 placeholder-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          </div>

          <button
            onClick={handleRefresh}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-200 transition-colors focus:outline-none flex items-center justify-center gap-1.5 font-bold text-xs"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          <button
            onClick={handleTriggerRemind}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-500/15 transition-all flex items-center gap-2 focus:outline-none active:scale-[0.98]"
          >
            <Send className="w-4 h-4 text-white" />
            <span>Gửi nhắc việc</span>
          </button>
        </div>
      </div>

      {/* Main Progress Ledger Table Box */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC]/60 border-b border-slate-100 text-[11px] text-slate-400 font-black uppercase tracking-wider select-none">
                <th className="px-5 py-3.5 text-center w-12">#</th>
                <th className="px-5 py-3.5 min-w-[100px]">Thôn</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5">Tỷ lệ hoàn thành</th>
                <th className="px-5 py-3.5 min-w-[280px]">
                  <div className="flex items-center gap-1">
                    <span>Tiến độ 22 ngày</span>
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="px-5 py-3.5">Thời gian nộp</th>
                <th className="px-5 py-3.5 text-center">Số lỗi</th>
                <th className="px-5 py-3.5">Hạn nộp</th>
                <th className="px-5 py-3.5">Người phụ trách</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 text-[11.5px] font-medium text-slate-600">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-16 text-center text-slate-400 font-bold text-xs">
                    Không tìm thấy dữ liệu tiến độ cho bộ lọc tương ứng.
                  </td>
                </tr>
              ) : (
                currentItems.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-5 py-4 text-center font-bold text-slate-400 font-mono">
                      {row.index}
                    </td>
                    
                    <td className="px-5 py-4 font-extrabold text-slate-800 text-xs">
                      {row.villageName}
                    </td>

                    <td className="px-5 py-4">
                      {getStatusBadge(row.status)}
                    </td>

                    <td className="px-5 py-4">
                      {renderProgressBar(row)}
                    </td>

                    <td className="px-5 py-4">
                      {renderTimeline(row)}
                    </td>

                    <td className="px-5 py-4 font-mono text-slate-500">
                      {row.submitTime}
                    </td>

                    <td className="px-5 py-4 text-center font-mono font-bold">
                      {row.errorsCount === "0" ? (
                        <span className="text-slate-400">0</span>
                      ) : row.errorsCount === "-" ? (
                        <span className="text-slate-300">-</span>
                      ) : (
                        <span className="text-red-500 font-black">{row.errorsCount}</span>
                      )}
                    </td>

                    <td className="px-5 py-4 font-mono">
                      <span className={`font-bold ${row.isDeadlineOverdue ? "text-red-500" : "text-slate-500"}`}>
                        {row.deadline}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-extrabold text-slate-700">
                      {row.assignee}
                    </td>

                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleReview(row.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 border border-blue-100 hover:bg-blue-100/50 text-blue-600 font-extrabold text-[10.5px] rounded-lg transition-colors focus:outline-none"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem chi tiết</span>
                        </button>
                        
                        <button
                          onClick={() => handleExtend(row.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
                          title="Thao tác khác / Gia hạn"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Stateful Pagination and Records counts Footer matching Screenshot 2 */}
        <div className="px-5 py-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
          
          <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
            <div className="flex items-center gap-2">
              <span>Hiển thị</span>
              <div className="relative">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 pr-6 border border-slate-200 rounded-lg bg-white text-slate-700 font-extrabold focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                >
                  <option value={5}>5 / trang</option>
                  <option value={10}>10 / trang</option>
                  <option value={22}>22 / trang</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
              </div>
            </div>
            <span>
              Hiển thị {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, totalItems)} trong tổng số {totalItems} thôn
            </span>
          </div>

          {/* Pagination Selector buttons list */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Trang đầu"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border font-extrabold transition-all ${
                    currentPage === page
                      ? "bg-blue-600 border-blue-600 text-white shadow-xs shadow-blue-500/25"
                      : "border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Trang sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Trang cuối"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Horizontal Status Color Legend Bar */}
      <div className="flex flex-wrap items-center gap-5 pt-1 select-none">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span>Đã nộp</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
          <span>Đang thực hiện</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span>Có lỗi</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span>Quá hạn</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span>Chưa bắt đầu</span>
        </div>
      </div>

      {/* Action buttons at bottom right */}
      <div className="flex justify-end items-center gap-3 pt-2">
        <button
          onClick={() => {
            if (onExtendDeadline) {
              onExtendDeadline("v05"); // trigger standard extension flow
            } else {
              alert("Đã mở phiếu gia hạn nộp báo cáo cho các thôn quá hạn.");
            }
          }}
          className="px-5 py-2.5 border border-blue-200 hover:bg-blue-50 text-blue-600 font-extrabold text-xs rounded-xl transition-colors flex items-center gap-2 focus:outline-none"
        >
          <Calendar className="w-4 h-4 text-blue-500" />
          <span>Gia hạn</span>
        </button>

        <button
          onClick={() => alert("Đang xuất toàn bộ bảng số liệu tiến độ 22 thôn dưới dạng Excel...")}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-500/15 transition-all flex items-center gap-2 focus:outline-none"
        >
          <Download className="w-4 h-4 text-white" />
          <span>Xuất Excel</span>
          <ChevronDown className="w-3.5 h-3.5 text-white/80 border-l border-white/20 pl-1" />
        </button>
      </div>

    </div>
  );
}
