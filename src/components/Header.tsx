/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Bell, LogOut, User, Menu, Calendar, Shield, MapPin, CheckCircle, Search, ChevronDown } from "lucide-react";
import { UserProfile, UserRole, SystemNotification } from "../types";

interface HeaderProps {
  currentUser: UserProfile;
  notifications: SystemNotification[];
  onLogout: () => void;
  onViewNotifications: () => void;
  onToggleSidebar: () => void;
  onClearNotifications: () => void;
}

export default function Header({ 
  currentUser, 
  notifications, 
  onLogout, 
  onViewNotifications, 
  onToggleSidebar,
  onClearNotifications
}: HeaderProps) {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const unreadNotifs = notifications.filter(n => !n.read);

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return "Hệ Thống";
      case UserRole.CAN_BO_XA: return "Cán bộ Xã";
      case UserRole.CAN_BO_THON: return "Cán bộ Thôn";
      case UserRole.TO_CONG_NGHE: return "Tổ Công Nghệ";
    }
  };

  const getVillageName = (vId?: string) => {
    if (!vId) return "";
    const num = vId.replace("v", "");
    return `Thôn ${num}`;
  };

  return (
    <header className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-100 shadow-sm relative z-40 font-sans">
      {/* Left section: Hamburger (mobile) + Search input (desktop) */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 hover:bg-slate-100 rounded-lg lg:hidden focus:outline-none"
        >
          <Menu className="w-5 h-5 text-slate-600" />
        </button>

        {/* Global Search Bar - matches Screenshot 2 header */}
        <div className="relative hidden md:block max-w-sm w-full">
          <input
            type="text"
            placeholder="Tìm kiếm báo cáo, thôn, nhiệm vụ..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200/80 focus:border-blue-500 focus:bg-white rounded-full focus:outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Right section: Calendar Indicator + Notif Bell + Profile Card */}
      <div className="flex items-center gap-4">
        {/* Statistics cycle */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-500 font-medium bg-slate-50 border border-slate-100 px-3 py-1 rounded-full">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span>Kỳ thống kê: <strong className="text-slate-700">Tháng 07/2026</strong></span>
          <span className="text-slate-300">|</span>
          <span>Múi giờ: <strong className="text-slate-700">ICT (GMT+7)</strong></span>
        </div>

        {/* Notifications center bell icon */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              setShowUserMenu(false);
            }}
            className="p-2 hover:bg-slate-50 rounded-full transition-colors relative focus:outline-none"
          >
            <Bell className="w-4.5 h-4.5 text-slate-600" />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
                {unreadNotifs.length}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1 animate-fade-in">
              <div className="flex justify-between items-center px-4 py-2.5 border-b border-slate-100">
                <span className="font-bold text-xs text-slate-700">Thông báo ({unreadNotifs.length})</span>
                <button
                  onClick={() => {
                    onClearNotifications();
                    setShowNotifMenu(false);
                  }}
                  className="text-[10px] text-blue-600 hover:text-blue-700 font-bold"
                >
                  Đánh dấu đã đọc
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">Không có thông báo mới</div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`px-4 py-3 hover:bg-slate-50 border-b border-slate-50 text-xs flex gap-2.5 items-start transition-colors cursor-pointer ${
                        !notif.read ? "bg-blue-50/20" : ""
                      }`}
                    >
                      <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                        notif.type === "WARNING" ? "bg-amber-400" : (notif.type === "APPROVED" ? "bg-green-400" : "bg-blue-500")
                      }`} />
                      <div className="flex-1">
                        <p className="font-bold text-slate-800">{notif.title}</p>
                        <p className="text-slate-600 mt-0.5 leading-relaxed text-[11px]">{notif.message}</p>
                        <span className="text-[9px] text-slate-400 mt-1 block font-medium">
                          {notif.channel === "ZALO_SIMULATED" ? "💬 Zalo Alert • " : ""}
                          {new Date(notif.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Vertical Separator */}
        <div className="w-px h-6 bg-slate-100" />

        {/* User profile card & absolute dropdown trigger */}
        <div className="relative">
          <div 
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifMenu(false);
            }}
            className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition-all"
          >
            <div className="hidden md:flex flex-col items-end leading-tight text-right select-none">
              <span className="font-bold text-xs text-slate-800">{currentUser.fullName}</span>
              <div className="flex items-center gap-1 mt-0.5">
                {currentUser.villageId && (
                  <span className="text-[9px] text-slate-500 flex items-center gap-0.5 bg-slate-100 px-1.5 py-0.5 rounded font-bold uppercase">
                    {getVillageName(currentUser.villageId)}
                  </span>
                )}
                <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold uppercase border border-blue-100/50">
                  {getRoleLabel(currentUser.role)}
                </span>
              </div>
            </div>

            <img
              src={currentUser.avatarUrl}
              alt={currentUser.fullName}
              className="w-8.5 h-8.5 rounded-full object-cover border-2 border-blue-500/10 shadow-sm"
            />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {showUserMenu && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden py-1 animate-fade-in">
              <div className="px-4 py-2 border-b border-slate-50 text-left">
                <p className="text-xs font-bold text-slate-800">{currentUser.fullName}</p>
                <p className="text-[9px] text-slate-400 truncate mt-0.5">{currentUser.email}</p>
              </div>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onViewNotifications();
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold text-left"
              >
                <Shield className="w-4 h-4 text-slate-400" />
                <span>Nhật ký bảo mật</span>
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 font-bold border-t border-slate-50 text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất tài khoản</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
