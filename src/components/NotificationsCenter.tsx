/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Bell, AlertTriangle, CheckCircle, Edit3, Clock, Settings, Search,
  Calendar, Check, Copy, FileSpreadsheet, ExternalLink, Send, Bot, User,
  Volume2, Maximize2, X, Paperclip, Mic, ChevronLeft, ChevronRight, MoreVertical
} from "lucide-react";
import { UserProfile, UserRole } from "../types";

interface NotificationsCenterProps {
  currentUser: UserProfile;
  systemData: any;
}

interface NotificationItem {
  id: string;
  type: "reminder" | "error" | "approved" | "edit" | "overdue" | "system";
  title: string;
  message: string;
  category: "Nhắc việc" | "Phản hồi" | "Hệ thống" | "Quá hạn";
  time: string;
  read: boolean;
}

export default function NotificationsCenter({ currentUser, systemData }: NotificationsCenterProps) {
  // 1. Initial High-fidelity notifications state from Screenshot 3
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "notif-1",
      type: "reminder",
      title: "Nhắc nộp báo cáo Quý II/2026",
      message: "Thôn Tà Lang chưa nộp Báo cáo tình hình kinh tế - xã hội Quý II/2026.",
      category: "Nhắc việc",
      time: "08:30",
      read: false
    },
    {
      id: "notif-2",
      type: "error",
      title: "Báo cáo có lỗi dữ liệu",
      message: "Báo cáo của thôn Gò Tà (Quý II/2026) có 2 chỉ tiêu không hợp lệ.",
      category: "Phản hồi",
      time: "Hôm qua, 16:20",
      read: false
    },
    {
      id: "notif-3",
      type: "approved",
      title: "Báo cáo đã được duyệt",
      message: "Báo cáo Quý II/2026 của thôn Pơ Loong đã được duyệt.",
      category: "Phản hồi",
      time: "Hôm qua, 10:15",
      read: true
    },
    {
      id: "notif-4",
      type: "edit",
      title: "Yêu cầu chỉnh sửa báo cáo",
      message: "Báo cáo của thôn Chu Răng (Quý II/2026) cần chỉnh sửa.",
      category: "Phản hồi",
      time: "23/06/2026 14:45",
      read: true
    },
    {
      id: "notif-5",
      type: "overdue",
      title: "Quá hạn nộp báo cáo",
      message: "Thôn Mang Đen đã quá hạn nộp Báo cáo tình hình kinh tế - xã hội Quý II/2026 (5 ngày).",
      category: "Quá hạn",
      time: "23/06/2026 09:05",
      read: true
    },
    {
      id: "notif-6",
      type: "reminder",
      title: "Nhắc nộp báo cáo Quý II/2026",
      message: "Thôn Kon Pin chưa nộp Báo cáo tình hình kinh tế - xã hội Quý II/2026.",
      category: "Nhắc việc",
      time: "22/06/2026 08:30",
      read: true
    },
    {
      id: "notif-7",
      type: "system",
      title: "Cập nhật hệ thống",
      message: "Hệ thống đã cập nhật mẫu biểu báo cáo văn hóa - xã hội từ ngày 20/06/2026.",
      category: "Hệ thống",
      time: "20/06/2026 17:00",
      read: true
    },
    {
      id: "notif-8",
      type: "approved",
      title: "Báo cáo đã được duyệt",
      message: "Báo cáo Quý I/2026 của thôn Đăk Răng đã được duyệt.",
      category: "Phản hồi",
      time: "20/06/2026 11:20",
      read: true
    }
  ]);

  const [activeSubTab, setActiveSubTab] = useState<"all" | "unread" | "reminder" | "response" | "system">("all");
  const [filterType, setFilterType] = useState("Tất cả loại");
  const [dateRange, setDateRange] = useState("01/04/2026 - 30/06/2026");

  // Chatbot state
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      id: "msg-1",
      role: "model",
      content: `Xin chào cán bộ **${currentUser.fullName}**! Tôi là **Trợ lý Ba Na AI**.\n\nTôi có thể giúp gì cho đồng chí hôm nay? Bạn có thể tham khảo một số câu hỏi nhanh ở các gợi ý phía dưới.`,
      time: "10:20"
    },
    {
      id: "msg-2",
      role: "user",
      content: "Thôn nào chưa nộp báo cáo?",
      time: "10:21"
    },
    {
      id: "msg-3",
      role: "model",
      content: `Dựa trên dữ liệu hệ thống đến 10:21 ngày 25/06/2026, các thôn chưa nộp Báo cáo tình hình kinh tế - xã hội Quý II/2026 gồm:

• **Thôn Tà Lang**
• **Thôn Kon Pin**
• **Thôn A Rãh**
• **Thôn Đăk Hring**
• **Thôn Măng Xiêng**

**Tổng cộng: 5 thôn** chưa nộp báo cáo.`,
      time: "10:21",
      hasActions: true
    }
  ]);

  const [chatInput, setChatInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, loadingChat]);

  // Handler to mark all as read
  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Get filtered notifications count
  const counts = {
    all: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    reminder: notifications.filter(n => n.category === "Nhắc việc").length,
    response: notifications.filter(n => n.category === "Phản hồi").length,
    system: notifications.filter(n => n.category === "Hệ thống").length
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeSubTab === "unread") return !n.read;
    if (activeSubTab === "reminder") return n.category === "Nhắc việc";
    if (activeSubTab === "response") return n.category === "Phản hồi";
    if (activeSubTab === "system") return n.category === "Hệ thống";
    return true;
  });

  // Suggestion chips
  const quickQuestions = [
    { text: "Thôn nào chưa nộp báo cáo tháng này?", query: "Thôn nào chưa nộp báo cáo tháng này?" },
    { text: "Báo cáo nào có lỗi dữ liệu?", query: "Báo cáo nào có lỗi dữ liệu?" },
    { text: "Thôn nào thường nộp báo cáo trễ?", query: "Thôn nào thường nộp báo cáo trễ?" },
    { text: "Tổng hợp tiến độ nộp báo cáo tháng này?", query: "Tổng hợp tiến độ nộp báo cáo tháng này?" }
  ];

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || loadingChat) return;

    const timeString = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    
    // Add User Message
    const userMsg = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: userText,
      time: timeString
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setLoadingChat(true);

    try {
      // Formulate context
      const contextData = {
        summary: {
          taskTitle: "Báo cáo dân số và hộ dân Tháng 07/2026",
          period: "Tháng 07/2026",
          unsubmittedCount: 5,
          unsubmittedVillages: ["Thôn Tà Lang", "Thôn Kon Pin", "Thôn A Rãh", "Thôn Đăk Hring", "Thôn Măng Xiêng"],
          errorCount: 2,
          errorVillages: ["Thôn Gò Tà", "Thôn 01"],
          approvedHouseholds: 5236,
          approvedPopulation: 20857
        }
      };

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: userText }],
          dataContext: contextData,
          userRole: currentUser.role,
          userVillage: currentUser.villageId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages(prev => [...prev, {
          id: `msg-${Date.now()}-reply`,
          role: "model",
          content: data.content,
          time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
        }]);
      } else {
        throw new Error("API error");
      }
    } catch (err) {
      // Fallback
      setTimeout(() => {
        let content = "Xin chào đồng chí, hiện tôi đang xử lý số liệu thống kê. ";
        if (userText.includes("chưa nộp")) {
          content = "Đến nay còn 5 thôn chưa nộp báo cáo: Thôn Tà Lang, Thôn Kon Pin, Thôn A Rãh, Thôn Đăk Hring, Thôn Măng Xiêng. Đề nghị cán bộ gửi nhắc nhở qua Zalo.";
        } else if (userText.includes("lỗi")) {
          content = "Hệ thống phát hiện lỗi logic tại thôn Gò Tà (Tháng 05) với 2 chỉ tiêu không khớp, và Thôn 01 (hộ nghèo lớn hơn tổng số hộ).";
        } else {
          content = "Tôi ghi nhận yêu cầu và sẽ truy xuất dữ liệu tổng hợp của 22 thôn phục vụ biểu đồ động cho đồng chí ngay.";
        }

        setChatMessages(prev => [...prev, {
          id: `msg-${Date.now()}-reply`,
          role: "model",
          content: content,
          time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
        }]);
      }, 1000);
    } finally {
      setLoadingChat(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "reminder":
        return <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Bell className="w-5 h-5" /></div>;
      case "error":
        return <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><AlertTriangle className="w-5 h-5" /></div>;
      case "approved":
        return <div className="p-2.5 bg-green-50 text-green-600 rounded-xl"><CheckCircle className="w-5 h-5" /></div>;
      case "edit":
        return <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Edit3 className="w-5 h-5" /></div>;
      case "overdue":
        return <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><Clock className="w-5 h-5" /></div>;
      case "system":
        return <div className="p-2.5 bg-gray-100 text-gray-500 rounded-xl"><Settings className="w-5 h-5" /></div>;
      default:
        return <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Bell className="w-5 h-5" /></div>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      
      {/* LEFT COLUMN: Notification center (Span 7) */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-[calc(100vh-140px)] min-h-[620px]">
        <div>
          {/* Header Area */}
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">Trung tâm thông báo</h2>
            </div>

            {/* Filters Row */}
            <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
              {/* Type Select */}
              <div className="relative">
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="pl-3 pr-8 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none"
                >
                  <option>Tất cả loại</option>
                  <option>Nhắc việc</option>
                  <option>Phản hồi</option>
                  <option>Hệ thống</option>
                </select>
                <div className="absolute right-2 top-3 pointer-events-none w-2 h-2 border-b-2 border-r-2 border-slate-400 transform rotate-45 -translate-y-1" />
              </div>

              {/* Datepicker Mock */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{dateRange}</span>
              </div>

              {/* Mark all as read button */}
              <button 
                onClick={handleMarkAllRead}
                className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-lg transition-all focus:outline-none"
              >
                Đánh dấu tất cả đã đọc
              </button>
            </div>
          </div>

          {/* Sub-Tabs filters matching Screenshot 3 */}
          <div className="px-5 border-b border-gray-100 bg-slate-50/50 flex items-center gap-1.5 overflow-x-auto">
            <button 
              onClick={() => setActiveSubTab("all")}
              className={`px-4 py-3.5 text-xs font-bold border-b-2 transition-all relative ${
                activeSubTab === "all" ? "border-blue-600 text-blue-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Tất cả ({counts.all})
            </button>
            <button 
              onClick={() => setActiveSubTab("unread")}
              className={`px-4 py-3.5 text-xs font-bold border-b-2 transition-all relative ${
                activeSubTab === "unread" ? "border-blue-600 text-blue-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Chưa đọc ({counts.unread})
              {counts.unread > 0 && (
                <span className="absolute top-2 right-1 flex h-1.5 w-1.5 rounded-full bg-blue-600" />
              )}
            </button>
            <button 
              onClick={() => setActiveSubTab("reminder")}
              className={`px-4 py-3.5 text-xs font-bold border-b-2 transition-all relative ${
                activeSubTab === "reminder" ? "border-blue-600 text-blue-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Nhắc việc ({counts.reminder})
            </button>
            <button 
              onClick={() => setActiveSubTab("response")}
              className={`px-4 py-3.5 text-xs font-bold border-b-2 transition-all relative ${
                activeSubTab === "response" ? "border-blue-600 text-blue-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Phản hồi ({counts.response})
            </button>
            <button 
              onClick={() => setActiveSubTab("system")}
              className={`px-4 py-3.5 text-xs font-bold border-b-2 transition-all relative ${
                activeSubTab === "system" ? "border-blue-600 text-blue-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Hệ thống ({counts.system})
            </button>
          </div>

          {/* List of Notifications */}
          <div className="divide-y divide-gray-50 max-h-[calc(100vh-320px)] overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-medium">
                Không có thông báo nào trong danh mục này.
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-4 flex items-start gap-4 hover:bg-slate-50/50 transition-colors relative ${
                    !notif.read ? "bg-blue-50/10" : ""
                  }`}
                >
                  {/* Unread blue dot */}
                  {!notif.read && (
                    <div className="absolute left-1.5 top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full bg-blue-600" />
                  )}

                  {/* Icon */}
                  {getNotificationIcon(notif.type)}

                  {/* Body Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-xs text-slate-800 leading-tight truncate">{notif.title}</h4>
                      
                      {/* Meta information */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border ${
                          notif.category === "Nhắc việc" ? "bg-blue-50 text-blue-700 border-blue-100" :
                          notif.category === "Phản hồi" ? "bg-green-50 text-green-700 border-green-100" :
                          notif.category === "Quá hạn" ? "bg-red-50 text-red-700 border-red-100" :
                          "bg-gray-100 text-gray-600 border-gray-200"
                        }`}>
                          {notif.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{notif.time}</span>
                        <button className="text-slate-400 hover:text-slate-600 focus:outline-none">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{notif.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Area with pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white text-xs text-slate-500 font-medium">
          <span>Hiển thị 1 - {filteredNotifications.length} trong tổng số {filteredNotifications.length} thông báo</span>
          
          <div className="flex items-center gap-1">
            <button className="p-1 border border-slate-200 hover:bg-slate-50 rounded text-slate-400 cursor-not-allowed" disabled>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded">1</button>
            <button className="p-1 border border-slate-200 hover:bg-slate-50 rounded text-slate-400 cursor-not-allowed" disabled>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Trợ lý Ba Na AI Chat box (Span 5) */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-[calc(100vh-140px)] min-h-[620px] overflow-hidden">
        
        {/* Chatbot Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-teal-700 to-blue-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Bot className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-wide">Trợ lý Ba Na AI</h3>
              <p className="text-[10px] text-teal-200 font-semibold uppercase tracking-wider">Đang trực tuyến</p>
            </div>
          </div>

          {/* Window control icons matching Screenshot 3 */}
          <div className="flex items-center gap-1.5 text-white/80">
            <button className="p-1.5 hover:bg-white/10 rounded-full transition-all focus:outline-none">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-white/10 rounded-full transition-all focus:outline-none">
              <Volume2 className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-white/10 rounded-full transition-all focus:outline-none">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Thread container */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 space-y-4">
          {chatMessages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-3 max-w-[90%] ${
                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              {/* Avatar indicator */}
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs ${
                msg.role === "user" ? "bg-blue-100 text-blue-800" : "bg-teal-700 text-yellow-300 shadow-sm"
              }`}>
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4.5 h-4.5" />}
              </div>

              {/* Text speech bubble */}
              <div className="space-y-1">
                <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                  msg.role === "user" 
                    ? "bg-blue-600 text-white rounded-tr-none shadow-sm" 
                    : "bg-white text-slate-800 border border-slate-100 rounded-tl-none shadow-sm whitespace-pre-line"
                }`}>
                  {/* Custom parser for strong formatting ** */}
                  {msg.content.split("\n\n").map((para: string, pIdx: number) => (
                    <p key={pIdx} className={pIdx > 0 ? "mt-2" : ""}>
                      {para.split("**").map((part: string, tIdx: number) => {
                        return tIdx % 2 === 1 ? <strong key={tIdx} className="font-extrabold text-blue-900">{part}</strong> : part;
                      })}
                    </p>
                  ))}

                  {/* Add action buttons matching Screenshot 3 */}
                  {msg.hasActions && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 transition-colors focus:outline-none">
                        <Copy className="w-3 h-3" />
                        <span>Sao chép</span>
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-[10px] font-bold text-green-700 transition-colors focus:outline-none">
                        <FileSpreadsheet className="w-3 h-3" />
                        <span>Xuất Excel</span>
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-[10px] font-bold text-blue-700 transition-colors focus:outline-none">
                        <ExternalLink className="w-3 h-3" />
                        <span>Xem chi tiết thôn</span>
                      </button>
                    </div>
                  )}
                </div>
                {/* Message Timestamp */}
                <span className="text-[9px] text-slate-400 font-semibold font-mono block px-1">{msg.time}</span>
              </div>
            </div>
          ))}

          {loadingChat && (
            <div className="flex gap-3 mr-auto max-w-[90%]">
              <div className="w-8 h-8 rounded-full bg-teal-700 text-yellow-300 flex items-center justify-center animate-spin">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div className="p-3 bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Chips Panel */}
        <div className="p-3 bg-white border-t border-slate-100">
          <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400 mb-2">Gợi ý câu hỏi</p>
          <div className="grid grid-cols-2 gap-2">
            {quickQuestions.map((q, idx) => (
              <button 
                key={idx}
                onClick={() => handleSendMessage(q.query)}
                className="text-left px-3 py-2 bg-slate-50 hover:bg-blue-50/50 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-xl text-[10px] text-slate-600 font-bold transition-all truncate focus:outline-none"
              >
                {q.text}
              </button>
            ))}
          </div>
        </div>

        {/* Input Text Form */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(chatInput);
          }}
          className="p-3 bg-white border-t border-slate-100"
        >
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            {/* Attachment icon */}
            <button type="button" className="text-slate-400 hover:text-slate-600 focus:outline-none">
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Main Input Text */}
            <input 
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Nhập câu hỏi cho Ba Na AI..."
              className="flex-1 bg-transparent border-none text-xs text-slate-700 focus:outline-none placeholder-slate-400 font-medium py-1"
            />

            {/* Mic icon */}
            <button type="button" className="text-slate-400 hover:text-slate-600 focus:outline-none mr-1">
              <Mic className="w-4 h-4" />
            </button>

            {/* Send Paperplane button */}
            <button 
              type="submit" 
              disabled={!chatInput.trim() || loadingChat}
              className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-200 disabled:text-slate-400 rounded-lg transition-colors focus:outline-none"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* AI Disclaimers matches Screenshot 3 */}
          <p className="text-[9px] text-slate-400 mt-2 text-center leading-relaxed">
            Ba Na AI chỉ trả lời dựa trên dữ liệu có sẵn trong hệ thống.<br />Vui lòng kiểm tra lại thông tin trước khi sử dụng.
          </p>
        </form>

      </div>

    </div>
  );
}
