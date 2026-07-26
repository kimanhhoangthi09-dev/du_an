/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Home, FileText, BarChart2, Database, ShieldAlert, Users, 
  Map, History, Settings, HelpCircle, Activity, LayoutDashboard, Link,
  CheckCircle, Sparkles, Bell, ChevronDown, MapPin, Calendar, MessageSquare
} from "lucide-react";
import { UserRole, UserProfile } from "../types";

interface SidebarProps {
  currentUser: UserProfile;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
}

const VietnamEmblem = () => (
  <svg viewBox="0 0 100 100" className="w-10 h-10 flex-shrink-0 shadow-sm rounded-full">
    {/* Red background circle */}
    <circle cx="50" cy="50" r="48" fill="#da251d" />
    {/* Yellow/gold outer border */}
    <circle cx="50" cy="50" r="46" fill="none" stroke="#fcd116" strokeWidth="2" />
    {/* Dotted inner accent ring */}
    <circle cx="50" cy="50" r="39" fill="none" stroke="#fcd116" strokeWidth="1" strokeDasharray="3 3" />
    {/* Central yellow star */}
    <polygon points="50,22 58,45 82,45 62,59 70,82 50,68 30,82 38,59 18,45 42,45" fill="#fcd116" />
    {/* Rice ears representing agriculture */}
    <path d="M 22,65 C 28,82 50,85 50,85 C 50,85 72,82 78,65" fill="none" stroke="#fcd116" strokeWidth="3" strokeLinecap="round" />
    {/* Industrial cogwheel representing machinery */}
    <rect x="41" y="78" width="18" height="8" rx="2" fill="#fcd116" />
  </svg>
);

export default function Sidebar({ currentUser, activeTab, onSelectTab, isOpen }: SidebarProps) {
  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return "QTV Hệ thống";
      case UserRole.CAN_BO_XA: return "VP Thống kê Xã";
      case UserRole.CAN_BO_THON: return "Cán bộ Thôn";
    }
  };

  // Nav arrays depending on roles
  const getNavItems = () => {
    switch (currentUser.role) {
      case UserRole.CAN_BO_XA:
        return [
          { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
          { id: "tasks", label: "Nhiệm vụ báo cáo", icon: FileText },
          { id: "progress", label: "Tiến độ 22 thôn", icon: Activity },
          { id: "review", label: "Duyệt báo cáo", icon: CheckCircle, badge: 2 },
          { id: "aggregation", label: "Tổng hợp dữ liệu", icon: BarChart2 },
          { id: "warehouse", label: "Kho dữ liệu", icon: Database },
          { id: "notifications", label: "Thông báo", icon: Bell, badge: 5 },
          { id: "ai_chat", label: "Trợ lý AI", icon: Sparkles },
          { id: "villages", label: "Quản lý thôn", icon: Home }
        ];
      case UserRole.CAN_BO_THON:
        return [
          { id: "dashboard", label: "Trang chủ", icon: Home },
          { id: "tasks", label: "Nhiệm vụ của tôi", icon: FileText },
          { id: "input_report", label: "Nhập báo cáo", icon: CheckCircle },
          { id: "history", label: "Lịch sử nộp", icon: History },
          { id: "notifications", label: "Thông báo", icon: Bell, badge: 5 },
          { id: "ai_chat", label: "Trợ lý AI", icon: Sparkles }
        ];
      case UserRole.TO_CONG_NGHE:
        return [
          { id: "dashboard", label: "Trang chủ", icon: Home },
          { id: "profile", label: "Hồ sơ tổ", icon: FileText },
          { id: "members", label: "Thành viên", icon: Users },
          { id: "citizen_support", label: "Hỗ trợ người dân", icon: HelpCircle },
          { id: "public_services", label: "Dịch vụ công trực tuyến", icon: Link },
          { id: "digital_knowledge", label: "Kiến thức số", icon: Sparkles },
          { id: "events", label: "Hoạt động - sự kiện", icon: Calendar },
          { id: "schedule", label: "Lịch làm việc", icon: Activity },
          { id: "statistics", label: "Thống kê - báo cáo", icon: BarChart2 },
          { id: "feedback", label: "Phản ánh - góp ý", icon: MessageSquare },
          { id: "templates", label: "Tài liệu - biểu mẫu", icon: Database },
          { id: "settings", label: "Cài đặt", icon: Settings }
        ];
      case UserRole.ADMIN:
        return [
          { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
          { id: "users", label: "Người dùng hệ thống", icon: Users },
          { id: "villages", label: "Quản lý thôn", icon: Home },
          { id: "audit", label: "Nhật ký hoạt động", icon: History }
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside 
      className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white text-slate-800 flex flex-col justify-between font-sans border-r border-slate-100 transition-transform duration-300 transform lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } lg:relative`}
    >
      <div>
        {/* Brand logo header - matching screenshot perfectly */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-50 bg-white">
          <VietnamEmblem />
          <div>
            <h1 className="font-extrabold text-sm text-blue-900 tracking-wide uppercase">Civigo</h1>
            <p className="text-[10px] text-slate-500 font-semibold tracking-tight leading-tight mt-0.5">Nền tảng AI kết nối dữ liệu</p>
            <span className="text-[9px] text-blue-600 font-bold tracking-wider uppercase block mt-0.5">Thôn – Xã thông minh</span>
          </div>
        </div>

        {/* User context badge with clean style */}
        <div className="px-6 py-4 border-b border-slate-50 bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.fullName}
              className="w-9 h-9 rounded-full object-cover border-2 border-blue-500/10 shadow-sm"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-800 truncate leading-snug">{currentUser.fullName}</p>
              <span className="text-[9px] uppercase font-bold tracking-wider text-blue-600 block mt-0.5">
                {getRoleLabel(currentUser.role)}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 relative overflow-hidden group focus:outline-none ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/10 font-bold" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-105 ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700"
                  }`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer card matches Xã Bà Nà card layout */}
      <div className="p-4 border-t border-slate-50 bg-[#F8FAFC]">
        {currentUser.role === UserRole.CAN_BO_THON ? (
          <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm space-y-2 mb-2">
            <div className="h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg overflow-hidden flex items-end p-2 relative shadow-inner">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/30 via-transparent to-transparent" />
              <div className="flex gap-1">
                <span className="w-2 h-3 bg-white/40 rounded-sm animate-pulse" />
                <span className="w-2 h-5 bg-white/50 rounded-sm animate-pulse delay-75" />
                <span className="w-2 h-2.5 bg-white/30 rounded-sm" />
              </div>
              <span className="absolute top-2 right-2 text-[9px] text-white/90 font-bold tracking-widest bg-black/10 px-1.5 py-0.5 rounded">THÔN 03</span>
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                <Home className="w-3 h-3 text-emerald-600" /> Thôn 03 - Xã Bà Nà
              </p>
              <p className="text-[9px] text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-2.5 h-2.5 text-slate-400" /> Huyện Hòa Vang, TP. Đà Nẵng
              </p>
            </div>
          </div>
        ) : currentUser.role === UserRole.TO_CONG_NGHE ? (
          <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm space-y-2 mb-2">
            <div className="h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg overflow-hidden flex items-end p-2 relative shadow-inner">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/30 via-transparent to-transparent" />
              <div className="flex gap-1">
                <span className="w-2 h-3 bg-white/40 rounded-sm animate-pulse" />
                <span className="w-2 h-5 bg-white/50 rounded-sm animate-pulse delay-75" />
                <span className="w-2 h-2.5 bg-white/30 rounded-sm" />
              </div>
              <span className="absolute top-2 right-2 text-[9px] text-white/90 font-bold tracking-widest bg-black/10 px-1.5 py-0.5 rounded">TỔ CÔNG NGHỆ SỐ</span>
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-blue-600" /> Thôn Thạch Nham Đông
              </p>
              <p className="text-[9px] text-slate-500">
                Xã Bà Nà, Huyện Hòa Vang, Đà Nẵng
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm mb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-50 rounded-lg">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.905 0-5.625-.515-8.143-1.452M12 10.5c.373 0 .742-.013 1.109-.039M12 10.5a12.454 12.454 0 00-1.109-.039" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800">Xã Bà Nà</p>
                <p className="text-[9px] text-slate-500">Huyện Bà Nà, TP. Đà Nẵng</p>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
        )}
        <p className="text-[8px] text-slate-400 text-center mt-2 font-medium">
          © 2026 UBND Xã Bà Nà
        </p>
      </div>
    </aside>
  );
}
