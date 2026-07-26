/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Users, MapPin, History, Shield, UserPlus, ToggleLeft, ToggleRight, 
  Trash2, Search, SlidersHorizontal, AlertTriangle, PlayCircle, ShieldCheck, Mail
} from "lucide-react";
import { UserProfile, Village, AuditLog, UserRole } from "../types";

interface DashboardAdminProps {
  users: UserProfile[];
  villages: Village[];
  auditLogs: AuditLog[];
  onAddUser: (user: Partial<UserProfile>) => void;
  onToggleUserActive: (userId: string) => void;
  onToggleVillageActive: (villageId: string) => void;
}

export default function DashboardAdmin({
  users,
  villages,
  auditLogs,
  onAddUser,
  onToggleUserActive,
  onToggleVillageActive
}: DashboardAdminProps) {
  const [activeSubTab, setActiveSubTab] = useState<"users" | "villages" | "logs">("users");
  
  // User creation states
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>(UserRole.CAN_BO_THON);
  const [newVillageId, setNewVillageId] = useState("v01");
  const [showAddForm, setShowAddForm] = useState(false);

  // Search states
  const [userSearch, setUserSearch] = useState("");
  const [villageSearch, setVillageSearch] = useState("");
  const [logSearch, setLogSearch] = useState("");

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim()) return;

    onAddUser({
      fullName: newFullName,
      email: newEmail,
      role: newRole,
      villageId: (newRole === UserRole.CAN_BO_THON || newRole === UserRole.TO_CONG_NGHE) ? newVillageId : undefined,
      avatarUrl: `https://images.unsplash.com/photo-${(newRole === UserRole.CAN_BO_THON || newRole === UserRole.TO_CONG_NGHE) ? "1500648767791-00dcc994a43e" : "1534528741775-53994a69daeb"}?w=150`,
      active: true,
    });

    // Reset Form
    setNewFullName("");
    setNewEmail("");
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Title & Tab Selector bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-5 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="w-5.5 h-5.5 text-purple-600" />
            Bảng Quản trị Hệ thống
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Thiết lập người dùng, phân quyền truy cập, danh mục 22 thôn và truy xuất kiểm toán nhật ký.
          </p>
        </div>

        {/* Subtabs selector buttons */}
        <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-200/50">
          <button
            onClick={() => setActiveSubTab("users")}
            className={`flex items-center gap-1.5 px-4 py-2 font-bold text-xs rounded-lg transition-colors focus:outline-none ${
              activeSubTab === "users" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Users className="w-4 h-4" />
            Tài khoản ({users.length})
          </button>
          
          <button
            onClick={() => setActiveSubTab("villages")}
            className={`flex items-center gap-1.5 px-4 py-2 font-bold text-xs rounded-lg transition-colors focus:outline-none ${
              activeSubTab === "villages" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <MapPin className="w-4 h-4" />
            Danh mục thôn ({villages.length})
          </button>
          
          <button
            onClick={() => setActiveSubTab("logs")}
            className={`flex items-center gap-1.5 px-4 py-2 font-bold text-xs rounded-lg transition-colors focus:outline-none ${
              activeSubTab === "logs" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <History className="w-4 h-4" />
            Kiểm toán Log ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* MULTIPANEL LAYOUT */}

      {/* Panel 1: User Management */}
      {activeSubTab === "users" && (
        <div className="space-y-5">
          {/* Action bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Tìm tên, email..."
                className="w-full pl-8 pr-4 py-2 text-xs border border-gray-200 focus:border-purple-500 rounded-xl focus:outline-none font-medium bg-white"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors focus:outline-none"
            >
              <UserPlus className="w-4 h-4" />
              Thêm tài khoản mới
            </button>
          </div>

          {/* Add User Form block */}
          {showAddForm && (
            <form onSubmit={handleAddUserSubmit} className="bg-purple-50/50 border border-purple-100 p-5 rounded-2xl space-y-4">
              <h4 className="font-bold text-xs text-purple-900 flex items-center gap-1">
                <UserPlus className="w-4 h-4" />
                Điền thông tin tài khoản mới
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-purple-800 uppercase mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:border-purple-500 rounded-xl bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-purple-800 uppercase mb-1">Địa chỉ Email *</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="thon03@bana.gov.vn"
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:border-purple-500 rounded-xl bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-purple-800 uppercase mb-1">Vai trò</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 focus:border-purple-500 rounded-xl bg-white focus:outline-none font-semibold text-gray-700"
                  >
                    <option value={UserRole.CAN_BO_THON}>Cán bộ Thôn</option>
                    <option value={UserRole.TO_CONG_NGHE}>Tổ trưởng Công nghệ số</option>
                    <option value={UserRole.CAN_BO_XA}>Cán bộ Xã</option>
                    <option value={UserRole.ADMIN}>Quản trị viên</option>
                  </select>
                </div>

                {(newRole === UserRole.CAN_BO_THON || newRole === UserRole.TO_CONG_NGHE) && (
                  <div>
                    <label className="block text-[10px] font-bold text-purple-800 uppercase mb-1">Thôn quản lý</label>
                    <select
                      value={newVillageId}
                      onChange={(e) => setNewVillageId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-200 focus:border-purple-500 rounded-xl bg-white focus:outline-none font-semibold text-gray-700"
                    >
                      {villages.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 font-bold text-xs rounded-xl hover:bg-gray-50 focus:outline-none"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-md focus:outline-none"
                >
                  Phát hành Tài khoản
                </button>
              </div>
            </form>
          )}

          {/* User List Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-400 font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5">Người dùng</th>
                    <th className="px-6 py-3.5">Email</th>
                    <th className="px-6 py-3.5">Cơ cấu quyền</th>
                    <th className="px-6 py-3.5">Trạng thái hoạt động</th>
                    <th className="px-6 py-3.5 text-right">Khóa/Mở</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {users.filter(u => 
                    u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
                    u.email.toLowerCase().includes(userSearch.toLowerCase())
                  ).map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img src={u.avatarUrl} alt={u.fullName} className="w-8 h-8 rounded-full object-cover border" />
                        <div>
                          <p className="font-bold text-gray-800">{u.fullName}</p>
                          <p className="text-[10px] text-gray-400">ID: {u.id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-gray-600">
                        {u.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border ${
                          u.role === UserRole.ADMIN ? "bg-purple-50 text-purple-700 border-purple-200" :
                          (u.role === UserRole.CAN_BO_XA ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-green-50 text-green-700 border-green-200")
                        }`}>
                          {u.role === UserRole.ADMIN ? "QTV" : (u.role === UserRole.CAN_BO_XA ? "CÁN BỘ XÃ" : `THÔN (${u.villageId ? u.villageId.replace("v", "") : "-"})`)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 font-bold ${u.active ? "text-green-600" : "text-red-500"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.active ? "bg-green-500 animate-pulse" : "bg-red-400"}`} />
                          {u.active ? "Đang hoạt động" : "Bị vô hiệu hóa"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => onToggleUserActive(u.id)}
                          className={`p-1.5 rounded-lg border transition-colors focus:outline-none ${
                            u.active 
                              ? "bg-red-50 text-red-600 border-red-100 hover:bg-red-100" 
                              : "bg-green-50 text-green-600 border-green-100 hover:bg-green-100"
                          }`}
                        >
                          {u.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Panel 2: Village Directories */}
      {activeSubTab === "villages" && (
        <div className="space-y-4">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={villageSearch}
              onChange={(e) => setVillageSearch(e.target.value)}
              placeholder="Tìm thôn, trưởng thôn..."
              className="w-full pl-8 pr-4 py-2 text-xs border border-gray-200 focus:border-purple-500 rounded-xl focus:outline-none font-medium bg-white"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-400 font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5">Mã Thôn</th>
                    <th className="px-6 py-3.5">Tên Thôn</th>
                    <th className="px-6 py-3.5">Người đại diện phụ trách</th>
                    <th className="px-6 py-3.5">Số điện thoại</th>
                    <th className="px-6 py-3.5">Trạng thái báo cáo</th>
                    <th className="px-6 py-3.5 text-right">Ngắt/Bật kết nối</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {villages.filter(v => 
                    v.name.toLowerCase().includes(villageSearch.toLowerCase()) ||
                    v.leaderName.toLowerCase().includes(villageSearch.toLowerCase())
                  ).map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-purple-700">
                        {v.id.toUpperCase()}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-800">
                        {v.name}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-700">
                        {v.leaderName}
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-500">
                        {v.phone}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 font-bold ${v.active ? "text-green-600" : "text-amber-500"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${v.active ? "bg-green-500" : "bg-amber-400"}`} />
                          {v.active ? "Hạ tầng kết nối" : "Ngắt kết nối"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => onToggleVillageActive(v.id)}
                          className={`p-1 text-xs font-bold rounded-lg px-2.5 py-1.5 border transition-colors focus:outline-none ${
                            v.active 
                              ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" 
                              : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          }`}
                        >
                          {v.active ? "Đóng tạm thời" : "Kích hoạt"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Panel 3: Activity Audit Logs */}
      {activeSubTab === "logs" && (
        <div className="space-y-4">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              placeholder="Lọc hoạt động, tài khoản..."
              className="w-full pl-8 pr-4 py-2 text-xs border border-gray-200 focus:border-purple-500 rounded-xl focus:outline-none font-medium bg-white"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 max-h-[480px] overflow-y-auto">
            {auditLogs.filter(log => 
              log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
              log.userName.toLowerCase().includes(logSearch.toLowerCase()) ||
              log.details.toLowerCase().includes(logSearch.toLowerCase())
            ).map((log) => {
              return (
                <div key={log.id} className="flex gap-4 items-start border-b border-gray-50 pb-3 text-xs last:border-b-0 last:pb-0">
                  <div className="p-2 bg-purple-50 text-purple-700 rounded-lg flex-shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                      <span className="font-bold text-gray-800">
                        {log.userName} 
                        <span className="font-normal text-gray-400 text-[10px] ml-1.5 uppercase tracking-wider px-1.5 py-0.5 bg-gray-100 rounded border">
                          {log.userRole}
                        </span>
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(log.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <p className="font-semibold text-purple-800 mt-1">{log.action}</p>
                    <p className="text-gray-500 mt-0.5">{log.details}</p>
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

// Minimal missing import helper from sidebar
const Activity = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);
