/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Users, CheckCircle2, AlertTriangle, Clock, MapPin, Shield, 
  Plus, Search, MessageSquare, Calendar as CalendarIcon, ChevronRight, Sparkles, 
  Link as LinkIcon, Download, HelpCircle, Edit2, Check, Activity, FileText, 
  BarChart2, Trash2, X, AlertCircle, FileSpreadsheet, Send, FilePlus, Heart, Settings
} from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { UserProfile, SystemNotification } from "../types";

interface DashboardToCongNgheProps {
  currentUser: UserProfile;
  activeTab: string;
  systemData?: any;
  onUpdateState?: (state: any) => void;
  onFlashNotification: (msg: string, type?: "INFO" | "SUCCESS" | "WARNING") => void;
}

export default function DashboardToCongNghe({ 
  currentUser, 
  activeTab, 
  systemData,
  onUpdateState,
  onFlashNotification 
}: DashboardToCongNgheProps) {
  // --- 1. STATE DEFINITIONS & DYNAMIC INITIALIZATION ---
  const villageId = currentUser.villageId || "v03";

  const [teamProfile, setTeamProfile] = useState({
    name: "TỔ CÔNG NGHỆ SỐ CỘNG ĐỒNG THÔN THẠCH NHAM ĐÔNG",
    commune: "Xã Bà Nà",
    district: "Huyện Hòa Vang",
    province: "Thành phố Đà Nẵng",
    foundDate: "15/05/2026",
    leader: "Nguyễn Văn Tài",
    memberCount: 6,
    scope: "Thôn Thạch Nham Đông",
    phone: "0906234567",
    email: "thachnhamdong@bana.gov.vn",
    objective: "Hỗ trợ người dân tiếp cận kỹ năng số, sử dụng dịch vụ công trực tuyến và phổ biến kiến thức chuyển đổi số."
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({ ...teamProfile });

  const [members, setMembers] = useState<any[]>([]);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({ name: "", role: "Thành viên", phone: "", status: "Đang hoạt động" });

  const [supportRequests, setSupportRequests] = useState<any[]>([]);
  const [supportFilter, setSupportFilter] = useState("Tất cả");
  const [supportSearch, setSupportSearch] = useState("");
  const [isAddingSupport, setIsAddingSupport] = useState(false);
  const [newSupportForm, setNewSupportForm] = useState({ name: "", content: "", status: "Chờ xử lý" });

  // Sync state with systemData dynamically
  React.useEffect(() => {
    if (systemData) {
      const village = systemData.villages?.find((v: any) => v.id === villageId);
      const vName = village?.name || "Thôn Thạch Nham Đông";
      const leader = systemData.teamMembers?.find((m: any) => m.teamId === `team-${villageId}` && m.role === "Tổ trưởng")?.fullName || village?.leaderName || "Nguyễn Văn Tài";
      const activeCount = systemData.teamMembers?.filter((m: any) => m.teamId === `team-${villageId}` && m.status === "Đang hoạt động").length || 0;

      setTeamProfile({
        name: `TỔ CÔNG NGHỆ SỐ CỘNG ĐỒNG ${vName.toUpperCase()}`,
        commune: "Xã Bà Nà",
        district: "Huyện Hòa Vang",
        province: "Thành phố Đà Nẵng",
        foundDate: "15/05/2026",
        leader: leader,
        memberCount: activeCount,
        scope: vName,
        phone: village?.phone || "0906234567",
        email: village?.email || "thachnhamdong@bana.gov.vn",
        objective: "Hỗ trợ người dân tiếp cận kỹ năng số, sử dụng dịch vụ công trực tuyến và phổ biến kiến thức chuyển đổi số."
      });

      const teamM = systemData.teamMembers?.filter((m: any) => m.teamId === `team-${villageId}`) || [];
      setMembers(teamM.map((m: any) => ({
        id: m.id,
        name: m.fullName,
        role: m.role,
        phone: m.phone,
        status: m.status === "Đang hoạt động" ? "Đang hoạt động" : "Tạm nghỉ"
      })));

      const reqs = systemData.supportRequests?.filter((r: any) => r.villageId === villageId) || [];
      setSupportRequests(reqs.map((r: any) => ({
        id: r.id,
        name: r.citizenName,
        content: r.content,
        status: r.status === "COMPLETED" ? "Hoàn thành" : r.status === "IN_PROGRESS" ? "Đang hỗ trợ" : "Chờ xử lý",
        time: r.completedAt ? new Date(r.completedAt).toLocaleString("vi-VN") : new Date(r.createdAt || "").toLocaleString("vi-VN")
      })));
    }
  }, [systemData, villageId]);

  const syncWithSystem = (newMembers: any[], newSupportRequests?: any[]) => {
    if (!systemData || !onUpdateState) return;
    const updated = { ...systemData };
    
    if (newMembers) {
      const otherMembers = updated.teamMembers.filter((m: any) => m.teamId !== `team-${villageId}`);
      const mappedMembers = newMembers.map((m: any) => {
        const existing = updated.teamMembers.find((em: any) => em.id === m.id);
        return {
          id: m.id || `m-${villageId}-${Date.now()}`,
          teamId: `team-${villageId}`,
          fullName: m.name,
          role: m.role,
          phone: m.phone,
          status: m.status === "Đang hoạt động" ? "Đang hoạt động" : "Tạm nghỉ",
          createdAt: existing?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      });
      updated.teamMembers = [...otherMembers, ...mappedMembers];
    }

    if (newSupportRequests) {
      const otherRequests = updated.supportRequests.filter((r: any) => r.villageId !== villageId);
      const mappedRequests = newSupportRequests.map((r: any) => {
        const existing = updated.supportRequests.find((er: any) => er.id === r.id);
        return {
          id: r.id || `req-${villageId}-${Date.now()}`,
          citizenId: existing?.citizenId || `citizen-${villageId}-${Date.now()}`,
          citizenName: r.name,
          citizenPhone: existing?.citizenPhone || "0912345678",
          villageId: villageId,
          category: "PUBLIC_SERVICE_ONLINE",
          status: r.status === "Hoàn thành" ? "COMPLETED" : r.status === "Đang hỗ trợ" ? "IN_PROGRESS" : "PENDING",
          content: r.content,
          completedAt: r.status === "Hoàn thành" ? new Date().toISOString() : undefined,
          createdAt: existing?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      });
      updated.supportRequests = [...otherRequests, ...mappedRequests];
    }

    onUpdateState(updated);
  };

  // D. Online Public Services State
  const [publicServices, setPublicServices] = useState([
    { id: 1, name: "Đăng ký khai sinh", level: "Cấp xã", icon: "👶", count: 42 },
    { id: 2, name: "Đăng ký kết hôn", level: "Cấp xã", icon: "💍", count: 18 },
    { id: 3, name: "Cấp lại CCCD", level: "Cấp tỉnh", icon: "🪪", count: 35 },
    { id: 4, name: "Đổi giấy phép lái xe", level: "Cấp tỉnh", icon: "🚗", count: 12 },
    { id: 5, name: "Đăng ký hộ khẩu thường trú", level: "Cấp xã", icon: "🏠", count: 25 }
  ]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("Tất cả");
  const [isPerformingService, setIsPerformingService] = useState<any>(null);
  const [performServiceForm, setPerformServiceForm] = useState({ citizenName: "", citizenPhone: "", citizenId: "" });

  // E. Digital Transformation Knowledge State
  const [knowledgeSearch, setKnowledgeSearch] = useState("");
  const [knowledgeFilter, setKnowledgeFilter] = useState("Tất cả");
  const knowledgeItems = [
    { id: 1, title: "Hướng dẫn sử dụng VNeID", type: "Video", duration: "Video – 5 phút", read: false },
    { id: 2, title: "Thanh toán không dùng tiền mặt", type: "Bài viết", duration: "Bài viết – 7 phút đọc", read: false },
    { id: 3, title: "Cách phòng tránh lừa đảo trên mạng", type: "Video", duration: "Video – 8 phút", read: false },
    { id: 4, title: "Cài đặt và sử dụng VssID", type: "Bài viết", duration: "Bài viết – 6 phút đọc", read: false },
    { id: 5, title: "An toàn thông tin trên không gian mạng", type: "Infographic", duration: "Infographic", read: false }
  ];

  // F. Activities / Events State
  const [events, setEvents] = useState([
    { id: 1, name: "Hướng dẫn cài VNeID", date: "15/06/2024", location: "Nhà văn hóa thôn", status: "Đã hoàn thành" },
    { id: 2, name: "Tập huấn kỹ năng số", date: "20/06/2024", location: "UBND Xã Bà Nà", status: "Sắp diễn ra" },
    { id: 3, name: "Hỗ trợ nộp hồ sơ online", date: "25/06/2024", location: "Nhà văn hóa thôn", status: "Sắp diễn ra" },
    { id: 4, name: "Tuyên truyền ATTT", date: "30/06/2024", location: "Trường tiểu học", status: "Sắp diễn ra" }
  ]);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEventForm, setNewEventForm] = useState({ name: "", date: "", location: "", status: "Sắp diễn ra" });

  // G. Work Calendar (Lịch làm việc) State
  const [selectedDay, setSelectedDay] = useState(23);
  const calendarSchedules: Record<number, { time: string, action: string }[]> = {
    23: [
      { time: "07:30 - 09:30", action: "Hỗ trợ người dân cài đặt VNeID" },
      { time: "10:00 - 11:30", action: "Hướng dẫn thanh toán online" },
      { time: "14:00 - 16:00", action: "Hỗ trợ nộp hồ sơ dịch vụ công" }
    ],
    24: [
      { time: "08:00 - 11:00", action: "Tuyên truyền chuyển đổi số hộ kinh doanh" },
      { time: "15:00 - 17:00", action: "Họp sơ kết hoạt động Tổ Công nghệ" }
    ],
    25: [
      { time: "09:00 - 11:00", action: "Tập huấn trực tuyến kỹ năng số" },
      { time: "14:00 - 16:30", action: "Đi từng ngõ hướng dẫn mở tài khoản thanh toán điện nước" }
    ]
  };

  // H. Feedback State
  const [feedbacks, setFeedbacks] = useState([
    { id: 1, content: "Đường mạng yếu tại điểm công cộng", sender: "Nguyễn Văn Hòa", status: "Đã xử lý", date: "20/05/2024" },
    { id: 2, content: "Khó đăng nhập VNeID bằng khuôn mặt", sender: "Trần Thị Lan", status: "Đang xử lý", date: "20/05/2024" },
    { id: 3, content: "Lỗi kết nối khi thanh toán hóa đơn online", sender: "Lê Văn Nam", status: "Đã xử lý", date: "19/05/2024" }
  ]);
  const [feedbackSearch, setFeedbackSearch] = useState("");
  const [feedbackFilter, setFeedbackFilter] = useState("Tất cả");

  // I. Settings State
  const [accountSettings, setAccountSettings] = useState({
    name: "Nguyễn Văn A",
    email: "tocongnghe@bana.gov.vn",
    phone: "0912 345 678",
    notifications: true,
    autoBackup: false
  });

  // --- 2. CALCULATED STATS FOR TOP METRICS ROW ---
  const countCompletedSupport = supportRequests.filter(s => s.status === "Hoàn thành").length;
  const totalSupportCount = supportRequests.length;
  const countEventsThisMonth = events.length;
  const satisfactionRate = 98; // hardcoded high rating

  // --- 3. EVENT HANDLERS ---

  // Profile Edit
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setTeamProfile(editProfileForm);
    setIsEditingProfile(false);
    onFlashNotification("💾 Đã cập nhật thành công hồ sơ tổ công nghệ số!", "SUCCESS");
  };

  // Add Member
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberForm.name || !newMemberForm.phone) {
      alert("Vui lòng điền đầy đủ họ tên và SĐT");
      return;
    }
    const newM = {
      id: `m-added-${Date.now()}`,
      ...newMemberForm
    };
    const nextMembers = [...members, newM];
    setMembers(nextMembers);
    syncWithSystem(nextMembers, undefined);
    setNewMemberForm({ name: "", role: "Thành viên", phone: "", status: "Đang hoạt động" });
    setIsAddingMember(false);
    onFlashNotification(`👤 Đã thêm thành viên: ${newM.name}`, "SUCCESS");
  };

  // Toggle member status
  const toggleMemberStatus = (id: any) => {
    const nextMembers = members.map(m => {
      if (m.id === id) {
        const nextStatus = m.status === "Đang hoạt động" ? "Tạm nghỉ" : "Đang hoạt động";
        onFlashNotification(`Trạng thái của ${m.name} đổi thành: ${nextStatus}`, "INFO");
        return { ...m, status: nextStatus };
      }
      return m;
    });
    setMembers(nextMembers);
    syncWithSystem(nextMembers, undefined);
  };

  // Add Citizen Support Request
  const handleAddSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupportForm.name || !newSupportForm.content) {
      alert("Vui lòng điền họ tên và nội dung hỗ trợ");
      return;
    }
    const nowStr = new Date().toLocaleString("vi-VN").slice(0, 16);
    const newS = {
      id: `req-added-${Date.now()}`,
      name: newSupportForm.name,
      content: newSupportForm.content,
      status: newSupportForm.status,
      time: nowStr
    };
    const nextSupport = [newS, ...supportRequests];
    setSupportRequests(nextSupport);
    syncWithSystem(undefined, nextSupport);
    setNewSupportForm({ name: "", content: "", status: "Chờ xử lý" });
    setIsAddingSupport(false);
    onFlashNotification(`✅ Đã tiếp nhận yêu cầu hỗ trợ cho người dân: ${newS.name}`, "SUCCESS");
  };

  // Update Support Status
  const cycleSupportStatus = (id: any) => {
    const nextSupport = supportRequests.map(s => {
      if (s.id === id) {
        let nextStatus = "Chờ xử lý";
        if (s.status === "Chờ xử lý") nextStatus = "Đang hỗ trợ";
        else if (s.status === "Đang hỗ trợ") nextStatus = "Hoàn thành";
        onFlashNotification(`Cập nhật yêu cầu của ${s.name} thành: ${nextStatus}`, "SUCCESS");
        return { ...s, status: nextStatus };
      }
      return s;
    });
    setSupportRequests(nextSupport);
    syncWithSystem(undefined, nextSupport);
  };

  // Perform Online Public Service
  const handlePerformService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!performServiceForm.citizenName) {
      alert("Vui lòng điền họ tên người dân");
      return;
    }
    
    // Increment service count
    setPublicServices(publicServices.map(ps => {
      if (ps.id === isPerformingService.id) {
        return { ...ps, count: ps.count + 1 };
      }
      return ps;
    }));

    // Auto-create a support log entry
    const nowStr = new Date().toLocaleString("vi-VN").slice(0, 16);
    const newSupportEntry = {
      id: `req-serviced-${Date.now()}`,
      name: performServiceForm.citizenName,
      content: `Thực hiện ${isPerformingService.name} (${isPerformingService.level})`,
      status: "Hoàn thành",
      time: nowStr
    };
    const nextSupport = [newSupportEntry, ...supportRequests];
    setSupportRequests(nextSupport);
    syncWithSystem(undefined, nextSupport);

    onFlashNotification(`🔥 Thực hiện công ích trực tuyến thành công cho công dân ${performServiceForm.citizenName}!`, "SUCCESS");
    setIsPerformingService(null);
    setPerformServiceForm({ citizenName: "", citizenPhone: "", citizenId: "" });
  };

  // Add event activity
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventForm.name || !newEventForm.date || !newEventForm.location) {
      alert("Vui lòng điền đầy đủ tên, ngày và địa điểm hoạt động!");
      return;
    }
    const newE = {
      id: Date.now(),
      ...newEventForm
    };
    setEvents([...events, newE]);
    setNewEventForm({ name: "", date: "", location: "", status: "Sắp diễn ra" });
    setIsAddingEvent(false);
    onFlashNotification(`📅 Đã xếp lịch hoạt động: ${newE.name}`, "SUCCESS");
  };

  // Update feedback status
  const toggleFeedbackStatus = (id: number) => {
    setFeedbacks(feedbacks.map(f => {
      if (f.id === id) {
        const nextStatus = f.status === "Đã xử lý" ? "Đang xử lý" : "Đã xử lý";
        onFlashNotification(`Đã chuyển phản ánh thành: ${nextStatus}`, "SUCCESS");
        return { ...f, status: nextStatus };
      }
      return f;
    }));
  };

  // Mock download template files
  const handleDownloadDoc = (fileName: string) => {
    onFlashNotification(`📥 Bắt đầu tải tài liệu xuống: ${fileName}`, "SUCCESS");
  };

  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      // 1. Members sheet
      const membersData = members.map((m, i) => ({
        "STT": i + 1,
        "Họ và tên": m.name,
        "Chức vụ": m.role,
        "Số điện thoại": m.phone,
        "Trạng thái": m.status
      }));
      const wsMembers = XLSX.utils.json_to_sheet(membersData);
      XLSX.utils.book_append_sheet(wb, wsMembers, "Thành viên tổ");
      
      // 2. Support requests sheet
      const supportData = supportRequests.map((s, i) => ({
        "STT": i + 1,
        "Tên công dân": s.name,
        "Nội dung hỗ trợ": s.content,
        "Trạng thái": s.status,
        "Thời gian": s.time
      }));
      const wsSupport = XLSX.utils.json_to_sheet(supportData);
      XLSX.utils.book_append_sheet(wb, wsSupport, "Danh sách hỗ trợ");

      // 3. Public services sheet
      const servicesData = publicServices.map((ps, i) => ({
        "STT": i + 1,
        "Dịch vụ công": ps.name,
        "Cấp hành chính": ps.level,
        "Số lượt đã thực hiện": ps.count
      }));
      const wsServices = XLSX.utils.json_to_sheet(servicesData);
      XLSX.utils.book_append_sheet(wb, wsServices, "Dịch vụ công trực tuyến");

      XLSX.writeFile(wb, `Bao_cao_To_Cong_Nghe_So_${villageId.toUpperCase()}_Q2_2026.xlsx`);
      onFlashNotification("🟢 Đã xuất thành công báo cáo Excel (.xlsx)!", "SUCCESS");
    } catch (e: any) {
      console.error(e);
      onFlashNotification("❌ Có lỗi xảy ra khi xuất Excel: " + e.message, "WARNING");
    }
  };

  const handleExportWord = () => {
    try {
      const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <title>Báo cáo hoạt động Tổ CNSCĐ</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; line-height: 1.6; padding: 20px; }
            h1 { text-align: center; color: #0f172a; text-transform: uppercase; font-size: 18pt; margin-bottom: 5px; }
            h2 { text-align: center; font-size: 14pt; font-weight: normal; margin-top: 0; margin-bottom: 30px; }
            h3 { color: #1e3a8a; font-size: 14pt; border-bottom: 1px solid #1e3a8a; padding-bottom: 5px; margin-top: 25px; }
            p { font-size: 12pt; text-indent: 1.5cm; text-align: justify; margin: 6px 0; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #94a3b8; padding: 8px; text-align: left; font-size: 11pt; }
            th { background-color: #f1f5f9; font-weight: bold; }
            .header-table { border: none; margin-bottom: 30px; }
            .header-table td { border: none; padding: 0; font-size: 11pt; }
            .signature-table { border: none; margin-top: 50px; }
            .signature-table td { border: none; text-align: center; font-size: 12pt; }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td style="width: 50%; text-align: center;">
                <b>ỦY BAN NHÂN DÂN XÃ BÀ NÀ</b><br>
                <b>TỔ CÔNG NGHỆ SỐ CỘNG ĐỒNG</b><br>
                ---
              </td>
              <td style="width: 50%; text-align: center;">
                <b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br>
                <b>Độc lập - Tự do - Hạnh phúc</b><br>
                ---
              </td>
            </tr>
          </table>

          <h1>BÁO CÁO KẾT QUẢ HOẠT ĐỘNG</h1>
          <h2>TỔ CÔNG NGHỆ SỐ CỘNG ĐỒNG QUÝ II NĂM 2026</h2>

          <p>Căn cứ tình hình thực tế hoạt động công nghệ số cộng đồng tại Thôn Thạch Nham Đông, xã Bà Nà, huyện Hòa Vang, thành phố Đà Nẵng.</p>
          <p>Tổ công nghệ số cộng đồng xin kính trình báo cáo kết quả hoạt động trong Quý II năm 2026 cụ thể như sau:</p>

          <h3>I. THÔNG TIN HỒ SƠ TỔ</h3>
          <p><b>Tên tổ:</b> ${teamProfile.name}</p>
          <p><b>Ngày thành lập:</b> ${teamProfile.foundDate}</p>
          <p><b>Tổ trưởng phụ trách:</b> ${teamProfile.leader}</p>
          <p><b>Mục tiêu hoạt động:</b> ${teamProfile.objective}</p>

          <h3>II. DANH SÁCH THÀNH VIÊN TỔ</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 10%">STT</th>
                <th style="width: 40%">Họ và tên</th>
                <th style="width: 25%">Chức vụ</th>
                <th style="width: 25%">SĐT liên hệ</th>
              </tr>
            </thead>
            <tbody>
              ${members.map((m, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><b>${m.name}</b></td>
                  <td>${m.role}</td>
                  <td>${m.phone}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <h3>III. KẾT QUẢ HỖ TRỢ NGƯỜI DÂN</h3>
          <p>Trong quý vừa qua, Tổ đã tổ chức nhiều hoạt động tiếp cận người dân trực tiếp tại các nhà văn hóa thôn, "đi từng ngõ, gõ từng nhà" để hỗ trợ cài đặt các nền tảng số công, nâng cao tỷ lệ tiếp cận dịch vụ công trực tuyến quốc gia.</p>
          <p><b>Tổng số hộ dân được hỗ trợ tiếp cận dịch vụ số:</b> 256 hộ dân.</p>
          <p><b>Tổng số yêu cầu hỗ trợ từ người dân đã tiếp nhận và xử lý thành công:</b> ${supportRequests.filter(s => s.status === "Hoàn thành" || s.status === "Hoàn thành").length} trường hợp (trong tổng số ${supportRequests.length} yêu cầu).</p>
          <p><b>Tỷ lệ người dân đánh giá hài lòng:</b> 95%.</p>

          <h3>IV. DANH SÁCH HỒ SƠ HỖ TRỢ GẦN ĐÂY</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 10%">STT</th>
                <th style="width: 25%">Tên công dân</th>
                <th style="width: 45%">Nội dung hỗ trợ</th>
                <th style="width: 20%">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              ${supportRequests.slice(0, 10).map((s, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${s.name}</td>
                  <td>${s.content}</td>
                  <td>${s.status}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <table class="signature-table">
            <tr>
              <td style="width: 50%;">
                <b>NGƯỜI LẬP BIỂU</b><br><br><br><br>
                <i>(Ký và ghi rõ họ tên)</i>
              </td>
              <td style="width: 50%;">
                <i>Bà Nà, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm 2026</i><br>
                <b>TỔ TRƯỞNG TỔ CNS</b><br><br><br><br>
                <b>${teamProfile.leader}</b>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Bao_cao_To_Cong_Nghe_So_${villageId.toUpperCase()}_Q2_2026.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      onFlashNotification("🔵 Đã xuất thành công biên bản Word (.doc)!", "SUCCESS");
    } catch (e: any) {
      console.error(e);
      onFlashNotification("❌ Có lỗi xảy ra khi xuất Word: " + e.message, "WARNING");
    }
  };

  const handleExportPdf = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("UBND XA BA NA - TO CONG NGHE SO CONG DONG", 105, 15, { align: "center" });
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("CONG HOA XA HOI CHU NGHIA VIET NAM - DOC LAP - TU DO - HANH PHUC", 105, 21, { align: "center" });
      doc.line(20, 25, 190, 25);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`BAO CAO HOAT DONG TO CONG NGHE SO - QUY II / 2026`, 105, 35, { align: "center" });
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Ten To: ${teamProfile.name}`, 20, 45);
      doc.text(`To truong: ${teamProfile.leader} | SDT: ${teamProfile.phone}`, 20, 51);
      doc.text(`Email: ${teamProfile.email}`, 20, 57);

      doc.setFont("helvetica", "bold");
      doc.text("1. DANH SACH THANH VIEN TO", 20, 68);
      doc.setFont("helvetica", "normal");
      let currentY = 74;
      members.forEach((m, idx) => {
        doc.text(`${idx + 1}. ${m.name} - ${m.role} - ${m.phone} (${m.status})`, 25, currentY);
        currentY += 6;
      });

      doc.setFont("helvetica", "bold");
      doc.text("2. KET QUA HOAT DONG QUY II / 2026", 20, currentY + 5);
      doc.setFont("helvetica", "normal");
      doc.text(`- Tong so ho dan da duoc tiep can ho tro: 256 ho.`, 25, currentY + 11);
      doc.text(`- Tong so yeu cau ho tro da hoan thanh: ${supportRequests.filter(s => s.status === "Hoàn thành" || s.status === "Hoàn thành").length} / ${supportRequests.length} yeu cau.`, 25, currentY + 17);
      doc.text(`- Ty le nguoi dan danh gia hai long: 95%.`, 25, currentY + 23);

      doc.text("Dai dien To Cong Nghe So ky ten,", 140, currentY + 45);
      doc.setFont("helvetica", "bold");
      doc.text(teamProfile.leader, 140, currentY + 60);

      doc.save(`Bao_cao_To_Cong_Nghe_So_${villageId.toUpperCase()}_Q2_2026.pdf`);
      onFlashNotification("🔴 Đã xuất thành công tài liệu PDF (.pdf)!", "SUCCESS");
    } catch (e: any) {
      console.error(e);
      onFlashNotification("❌ Có lỗi xảy ra khi xuất PDF: " + e.message, "WARNING");
    }
  };

  // --- 4. RENDER METHOD ---

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-12">
      
      {/* SECTION A: TOP BANNER (MATCHES HEAD IN THE SCREENSHOT) */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white p-6 md:p-8 shadow-md">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold text-blue-100 uppercase tracking-widest border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              Giao diện Tổ Công Nghệ Số Cộng Đồng Tại Thôn
            </div>
            
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight uppercase">
              {teamProfile.name}
            </h1>
            <p className="text-blue-100 font-medium text-xs md:text-sm flex items-center gap-1">
              <MapPin className="w-4 h-4 text-emerald-400" />
              {teamProfile.commune} – {teamProfile.district} – {teamProfile.province}
            </p>
            <p className="text-sm italic text-blue-200 mt-1">
              &ldquo;Đi từng ngõ, gõ từng nhà, hướng dẫn từng người&rdquo;
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-xl text-left min-w-[200px] flex items-center gap-3">
            <img 
              src={currentUser.avatarUrl} 
              alt="Avatar" 
              className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-400"
            />
            <div>
              <p className="text-xs text-blue-200 font-bold uppercase tracking-wider">Tổ trưởng</p>
              <p className="text-sm font-extrabold text-white">{currentUser.fullName}</p>
              <span className="inline-block mt-1 px-1.5 py-0.5 bg-emerald-500/30 text-emerald-300 text-[9px] font-black uppercase rounded">
                Trực tuyến
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION B: TOP METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hộ dân được hỗ trợ</p>
            <h3 className="text-2xl font-black text-slate-800 mt-0.5">256</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Lượt hỗ trợ trong tháng</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hồ sơ dịch vụ công</p>
            <h3 className="text-2xl font-black text-slate-800 mt-0.5">112</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Hồ sơ đã thực hiện</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hoạt động - sự kiện</p>
            <h3 className="text-2xl font-black text-slate-800 mt-0.5">{countEventsThisMonth}</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Trong tháng này</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-pink-50 text-pink-600 rounded-xl">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Người dân hài lòng</p>
            <h3 className="text-2xl font-black text-slate-800 mt-0.5">{satisfactionRate}%</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Đánh giá tích cực</p>
          </div>
        </div>
      </div>

      {/* SECTION C: BENTO GRID HOUSING ALL PANELS (FAITHFUL TO IMAGES) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (Width: 5/12) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* 1. Hồ sơ tổ (Căn cứ theo Ảnh 1 góc dưới bên trái) */}
          {(activeTab === "dashboard" || activeTab === "profile") && (
            <div id="ho-so-to" className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Shield className="w-4 h-4" />
                  </div>
                  <h2 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Hồ sơ tổ</h2>
                </div>
                {!isEditingProfile && (
                  <button 
                    onClick={() => {
                      setEditProfileForm({ ...teamProfile });
                      setIsEditingProfile(true);
                    }}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1 text-[11px] font-bold"
                  >
                    <Edit2 className="w-3 h-3" />
                    Chỉnh sửa
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Tên tổ công nghệ số</label>
                    <input 
                      type="text" 
                      value={editProfileForm.name} 
                      onChange={e => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                      className="w-full p-2 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:border-blue-500 font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Tổ trưởng</label>
                      <input 
                        type="text" 
                        value={editProfileForm.leader} 
                        onChange={e => setEditProfileForm({ ...editProfileForm, leader: e.target.value })}
                        className="w-full p-2 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">SĐT liên hệ</label>
                      <input 
                        type="text" 
                        value={editProfileForm.phone} 
                        onChange={e => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                        className="w-full p-2 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Địa chỉ email</label>
                    <input 
                      type="email" 
                      value={editProfileForm.email} 
                      onChange={e => setEditProfileForm({ ...editProfileForm, email: e.target.value })}
                      className="w-full p-2 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Mục tiêu hoạt động</label>
                    <textarea 
                      rows={2}
                      value={editProfileForm.objective} 
                      onChange={e => setEditProfileForm({ ...editProfileForm, objective: e.target.value })}
                      className="w-full p-2 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button 
                      type="button" 
                      onClick={() => setIsEditingProfile(false)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
                    >
                      Hủy
                    </button>
                    <button 
                      type="submit" 
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2.5 text-xs">
                  <div>
                    <p className="font-extrabold text-blue-900 text-sm">{teamProfile.name}</p>
                    <p className="text-slate-400 mt-0.5">{teamProfile.commune} – {teamProfile.district} – {teamProfile.province}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2.5 text-slate-600">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Ngày thành lập</span>
                      <strong className="text-slate-700">{teamProfile.foundDate}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Tổ trưởng</span>
                      <strong className="text-slate-700">{teamProfile.leader}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">SĐT liên hệ</span>
                      <strong className="text-slate-700 font-mono">{teamProfile.phone}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Email chính thức</span>
                      <strong className="text-slate-700 font-mono truncate block">{teamProfile.email}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Số thành viên</span>
                      <strong className="text-slate-700">{members.length} người</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Phạm vi hoạt động</span>
                      <strong className="text-slate-700">{teamProfile.scope}</strong>
                    </div>
                  </div>
                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-50/50">
                    <span className="text-[10px] font-bold text-blue-700 block uppercase mb-1">Mục tiêu cốt lõi:</span>
                    <p className="text-slate-600 leading-relaxed font-semibold">{teamProfile.objective}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Thành viên Tổ (Căn cứ theo Ảnh 1 giữa dưới) */}
          {(activeTab === "dashboard" || activeTab === "members") && (
            <div id="thanh-vien-to" className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Users className="w-4 h-4" />
                  </div>
                  <h2 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Thành viên tổ</h2>
                </div>
                <button 
                  onClick={() => setIsAddingMember(!isAddingMember)}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm thành viên
                </button>
              </div>

              {isAddingMember && (
                <form onSubmit={handleAddMember} className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-[11px] font-bold uppercase text-slate-600">Thêm thành viên mới</h4>
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      placeholder="Họ và tên..." 
                      value={newMemberForm.name} 
                      onChange={e => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                      className="w-full p-2 text-xs bg-white border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select 
                        value={newMemberForm.role}
                        onChange={e => setNewMemberForm({ ...newMemberForm, role: e.target.value })}
                        className="p-2 text-xs bg-white border rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <option value="Tổ trưởng">Tổ trưởng</option>
                        <option value="Tổ phó">Tổ phó</option>
                        <option value="Thành viên">Thành viên</option>
                      </select>
                      <input 
                        type="text" 
                        placeholder="Số điện thoại..." 
                        value={newMemberForm.phone} 
                        onChange={e => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                        className="w-full p-2 text-xs bg-white border rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 text-xs font-bold">
                    <button 
                      type="button" 
                      onClick={() => setIsAddingMember(false)}
                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg"
                    >
                      Hủy
                    </button>
                    <button 
                      type="submit" 
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      Thêm mới
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5">STT</th>
                      <th className="py-2.5">Họ và tên</th>
                      <th className="py-2.5">Chức vụ</th>
                      <th className="py-2.5">SĐT</th>
                      <th className="py-2.5 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium">
                    {members.map((member, index) => (
                      <tr key={member.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-mono text-slate-400">{index + 1}</td>
                        <td className="py-2.5 font-bold text-slate-800">{member.name}</td>
                        <td className="py-2.5 text-slate-500">{member.role}</td>
                        <td className="py-2.5 font-mono text-slate-500">{member.phone}</td>
                        <td className="py-2.5 text-right">
                          <button 
                            onClick={() => toggleMemberStatus(member.id)}
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border ${
                              member.status === "Đang hoạt động" 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                : "bg-red-50 text-red-700 border-red-100"
                            }`}
                          >
                            {member.status}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. Lịch làm việc (Cán sự theo Lịch làm việc trong Ảnh 1 góc dưới bên trái) */}
          {(activeTab === "dashboard" || activeTab === "schedule") && (
            <div id="lich-lam-viec" className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h2 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Lịch làm việc</h2>
                </div>
                <span className="text-[10px] font-bold text-blue-600 uppercase">Tháng 06/2024</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Simulated Interactive Calendar Grid */}
                <div className="md:col-span-6 border-r border-slate-100/80 pr-2">
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase mb-2">
                    <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs text-slate-500 font-bold">
                    {/* Padding first days */}
                    <span className="text-slate-200">27</span>
                    <span className="text-slate-200">28</span>
                    <span className="text-slate-200">29</span>
                    <span className="text-slate-200">30</span>
                    <span className="text-slate-200">31</span>
                    <span>1</span><span>2</span>
                    <span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span>
                    <span>10</span><span>11</span><span>12</span><span>13</span><span>14</span><span>15</span><span>16</span>
                    <span>17</span><span>18</span><span>19</span><span>20</span><span>21</span><span>22</span>
                    {/* Active selected date highlight */}
                    <button 
                      onClick={() => setSelectedDay(23)}
                      className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center font-bold text-xs ${
                        selectedDay === 23 ? "bg-blue-600 text-white shadow-md shadow-blue-500/25" : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      23
                    </button>
                    <button 
                      onClick={() => setSelectedDay(24)}
                      className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center font-bold text-xs ${
                        selectedDay === 24 ? "bg-blue-600 text-white shadow-md shadow-blue-500/25" : "hover:bg-slate-100"
                      }`}
                    >
                      24
                    </button>
                    <button 
                      onClick={() => setSelectedDay(25)}
                      className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center font-bold text-xs ${
                        selectedDay === 25 ? "bg-blue-600 text-white shadow-md shadow-blue-500/25" : "hover:bg-slate-100"
                      }`}
                    >
                      25
                    </button>
                    <span>26</span><span>27</span><span>28</span><span>29</span><span>30</span>
                  </div>
                </div>

                {/* Selected Day Schedule Actions */}
                <div className="md:col-span-6 space-y-2.5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1 bg-slate-50 p-1 px-2 rounded-lg">
                    <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                    Lịch ngày {selectedDay}/06/2024
                  </p>

                  <div className="space-y-2">
                    {calendarSchedules[selectedDay]?.map((sch, i) => (
                      <div key={i} className="p-2 border border-slate-100 rounded-xl bg-slate-50/50 space-y-1">
                        <span className="font-mono text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                          {sch.time}
                        </span>
                        <p className="text-xs font-bold text-slate-700 leading-tight">
                          {sch.action}
                        </p>
                      </div>
                    )) || (
                      <p className="text-xs text-slate-400 italic py-4 text-center">Trống lịch, hãy chọn ngày khác.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Width: 7/12) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 4. Hỗ trợ người dân (Căn sự theo Ảnh 1 góc trên bên phải) */}
          {(activeTab === "dashboard" || activeTab === "citizen_support") && (
            <div id="ho-tro-nguoi-dan" className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <h2 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Hỗ trợ người dân</h2>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Search support input */}
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm..." 
                      value={supportSearch}
                      onChange={e => setSupportSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                  
                  <button 
                    onClick={() => setIsAddingSupport(!isAddingSupport)}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm hỗ trợ
                  </button>
                </div>
              </div>

              {/* Support filter tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {["Tất cả", "Chờ xử lý", "Đang hỗ trợ", "Hoàn thành"].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setSupportFilter(tab)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      supportFilter === tab 
                        ? "bg-blue-600 text-white shadow-sm" 
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {isAddingSupport && (
                <form onSubmit={handleAddSupport} className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-3 text-xs">
                  <h4 className="font-bold uppercase text-slate-600 text-[10px]">Tạo yêu cầu hỗ trợ mới</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      placeholder="Họ tên công dân..." 
                      value={newSupportForm.name} 
                      onChange={e => setNewSupportForm({ ...newSupportForm, name: e.target.value })}
                      className="p-2 bg-white border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                    <select 
                      value={newSupportForm.status}
                      onChange={e => setNewSupportForm({ ...newSupportForm, status: e.target.value })}
                      className="p-2 bg-white border rounded-lg focus:outline-none focus:border-blue-500 font-bold"
                    >
                      <option value="Chờ xử lý">Chờ xử lý</option>
                      <option value="Đang hỗ trợ">Đang hỗ trợ</option>
                      <option value="Hoàn thành">Hoàn thành</option>
                    </select>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Nội dung hỗ trợ (Ví dụ: Đăng ký tài khoản VNeID, nộp hồ sơ, ...)" 
                    value={newSupportForm.content} 
                    onChange={e => setNewSupportForm({ ...newSupportForm, content: e.target.value })}
                    className="w-full p-2 bg-white border rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex justify-end gap-2 font-bold">
                    <button 
                      type="button" 
                      onClick={() => setIsAddingSupport(false)}
                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg"
                    >
                      Hủy
                    </button>
                    <button 
                      type="submit" 
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      Tiếp nhận
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5">STT</th>
                      <th className="py-2.5">Họ và tên</th>
                      <th className="py-2.5">Nội dung hỗ trợ</th>
                      <th className="py-2.5">Trạng thái</th>
                      <th className="py-2.5 text-right">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium">
                    {supportRequests
                      .filter(s => {
                        const matchesSearch = s.name.toLowerCase().includes(supportSearch.toLowerCase()) || 
                                              s.content.toLowerCase().includes(supportSearch.toLowerCase());
                        const matchesFilter = supportFilter === "Tất cả" || s.status === supportFilter;
                        return matchesSearch && matchesFilter;
                      })
                      .map((s, index) => (
                        <tr key={s.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 font-mono text-slate-400">{index + 1}</td>
                          <td className="py-2.5 font-bold text-slate-800">{s.name}</td>
                          <td className="py-2.5 text-slate-600">{s.content}</td>
                          <td className="py-2.5">
                            <button 
                              onClick={() => cycleSupportStatus(s.id)}
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border transition-colors ${
                                s.status === "Hoàn thành" 
                                  ? "bg-green-50 text-green-700 border-green-100 hover:bg-green-100" 
                                  : (s.status === "Đang hỗ trợ" 
                                    ? "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100" 
                                    : "bg-red-50 text-red-700 border-red-100 hover:bg-red-100")
                              }`}
                              title="Click để chuyển đổi nhanh trạng thái"
                            >
                              {s.status}
                            </button>
                          </td>
                          <td className="py-2.5 font-mono text-slate-400 text-right">{s.time}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. Dịch vụ công trực tuyến (Cán sự theo Dịch vụ công trực tuyến trong Ảnh 1 góc trên bên phải) */}
          {(activeTab === "dashboard" || activeTab === "public_services") && (
            <div id="dich-vu-cong" className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <h2 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Dịch vụ công trực tuyến</h2>
                </div>
                
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Tìm dịch vụ công..." 
                    value={serviceSearch}
                    onChange={e => setServiceSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Transaction Modal (Interactive execution) */}
              {isPerformingService && (
                <div className="bg-blue-50/70 border border-blue-200/50 p-4 rounded-xl space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <p className="font-extrabold text-blue-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Hồ sơ: {isPerformingService.name} ({isPerformingService.level})
                    </p>
                    <button onClick={() => setIsPerformingService(null)} className="p-1 hover:bg-blue-100 rounded-full text-blue-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handlePerformService} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Tên công dân</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Nguyễn Văn B" 
                        value={performServiceForm.citizenName}
                        onChange={e => setPerformServiceForm({ ...performServiceForm, citizenName: e.target.value })}
                        className="w-full p-2 bg-white border rounded-lg focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase">SĐT công dân</label>
                      <input 
                        type="text" 
                        placeholder="0911 222 333" 
                        value={performServiceForm.citizenPhone}
                        onChange={e => setPerformServiceForm({ ...performServiceForm, citizenPhone: e.target.value })}
                        className="w-full p-2 bg-white border rounded-lg focus:outline-none focus:border-blue-500 font-semibold"
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg text-xs flex items-center justify-center gap-1 shadow-md shadow-blue-500/10"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Nộp hồ sơ ngay
                    </button>
                  </form>
                </div>
              )}

              <div className="space-y-2">
                {publicServices
                  .filter(ps => ps.name.toLowerCase().includes(serviceSearch.toLowerCase()))
                  .map(ps => (
                    <div key={ps.id} className="p-3 bg-slate-50/50 border border-slate-100/70 hover:border-blue-200 hover:bg-blue-50/10 rounded-xl flex items-center justify-between gap-4 transition-all">
                      <div className="flex items-center gap-3">
                        <span className="text-xl bg-white p-1.5 rounded-lg border shadow-sm">{ps.icon}</span>
                        <div>
                          <h4 className="font-bold text-xs text-slate-800">{ps.name}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">Trình độ: <span className="font-bold text-slate-500">{ps.level}</span> | Đã làm: {ps.count} lượt</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setIsPerformingService(ps);
                          setPerformServiceForm({ citizenName: "", citizenPhone: "", citizenId: "" });
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-sm focus:outline-none transition-colors"
                      >
                        Thực hiện
                      </button>
                    </div>
                  ))}
              </div>
              <div className="text-center pt-1">
                <span className="text-[10px] text-slate-400 font-bold hover:text-blue-600 cursor-pointer transition-colors block">
                  Xem thêm dịch vụ trực tuyến xã Bà Nà...
                </span>
              </div>
            </div>
          )}

          {/* 6. Kiến thức chuyển đổi số */}
          {(activeTab === "dashboard" || activeTab === "digital_knowledge") && (
            <div id="kien-thuc-so" className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h2 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Kiến thức chuyển đổi số</h2>
                </div>
                
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Tìm tài liệu, video..." 
                    value={knowledgeSearch}
                    onChange={e => setKnowledgeSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {["Tất cả", "Bài viết", "Video", "Infographic"].map(f => (
                  <button 
                    key={f}
                    onClick={() => setKnowledgeFilter(f)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${
                      knowledgeFilter === f 
                        ? "bg-blue-600 text-white" 
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {knowledgeItems
                  .filter(ki => {
                    const matchS = ki.title.toLowerCase().includes(knowledgeSearch.toLowerCase());
                    const matchF = knowledgeFilter === "Tất cả" || ki.type === knowledgeFilter;
                    return matchS && matchF;
                  })
                  .map(ki => (
                    <div 
                      key={ki.id} 
                      onClick={() => onFlashNotification(`📖 Đang mở kiến thức: ${ki.title}`, "INFO")}
                      className="p-3 bg-white border border-slate-100 hover:border-blue-300 rounded-xl flex justify-between items-center gap-3 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          ki.type === "Video" ? "bg-red-500" : (ki.type === "Bài viết" ? "bg-blue-500" : "bg-purple-500")
                        }`} />
                        <div>
                          <h4 className="font-bold text-xs text-slate-800 hover:text-blue-600 transition-colors">{ki.title}</h4>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{ki.duration}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 7. Hoạt động - sự kiện (Góc phải giữa Ảnh 1) */}
          {(activeTab === "dashboard" || activeTab === "events") && (
            <div id="hoat-dong-su-kien" className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Activity className="w-4 h-4" />
                  </div>
                  <h2 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Hoạt động - sự kiện</h2>
                </div>
                <button 
                  onClick={() => setIsAddingEvent(!isAddingEvent)}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm hoạt động
                </button>
              </div>

              {isAddingEvent && (
                <form onSubmit={handleAddEvent} className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-3 text-xs">
                  <h4 className="font-bold uppercase text-slate-600 text-[10px]">Tạo hoạt động mới của Tổ</h4>
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      required
                      placeholder="Tên chiến dịch/hoạt động..." 
                      value={newEventForm.name} 
                      onChange={e => setNewEventForm({ ...newEventForm, name: e.target.value })}
                      className="w-full p-2 bg-white border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        required
                        placeholder="Ngày (Ví dụ: 25/06/2024)..." 
                        value={newEventForm.date} 
                        onChange={e => setNewEventForm({ ...newEventForm, date: e.target.value })}
                        className="p-2 bg-white border rounded-lg focus:outline-none focus:border-blue-500"
                      />
                      <input 
                        type="text" 
                        required
                        placeholder="Địa điểm..." 
                        value={newEventForm.location} 
                        onChange={e => setNewEventForm({ ...newEventForm, location: e.target.value })}
                        className="p-2 bg-white border rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 font-bold">
                    <button 
                      type="button" 
                      onClick={() => setIsAddingEvent(false)}
                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg"
                    >
                      Hủy
                    </button>
                    <button 
                      type="submit" 
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      Xếp lịch
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5">Tên hoạt động</th>
                      <th className="py-2.5">Thời gian</th>
                      <th className="py-2.5">Địa điểm</th>
                      <th className="py-2.5 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium">
                    {events.map(ev => (
                      <tr key={ev.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-bold text-slate-800">{ev.name}</td>
                        <td className="py-2.5 font-mono text-slate-500">{ev.date}</td>
                        <td className="py-2.5 text-slate-500">{ev.location}</td>
                        <td className="py-2.5 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
                            ev.status === "Đã hoàn thành" 
                              ? "bg-green-50 text-green-700 border-green-100" 
                              : "bg-amber-50 text-amber-700 border-amber-100 animate-pulse"
                          }`}>
                            {ev.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 8. Phản ánh - góp ý */}
          {(activeTab === "dashboard" || activeTab === "feedback") && (
            <div id="phan-anh" className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <h2 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Phản ánh - góp ý</h2>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Tìm phản ánh..." 
                      value={feedbackSearch}
                      onChange={e => setFeedbackSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {["Tất cả", "Chờ xử lý", "Đang xử lý", "Đã xử lý"].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setFeedbackFilter(tab)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      feedbackFilter === tab 
                        ? "bg-blue-600 text-white shadow-sm" 
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5">STT</th>
                      <th className="py-2.5">Nội dung</th>
                      <th className="py-2.5">Người phản ánh</th>
                      <th className="py-2.5">Trạng thái</th>
                      <th className="py-2.5 text-right">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium">
                    {feedbacks
                      .filter(f => {
                        const matchS = f.content.toLowerCase().includes(feedbackSearch.toLowerCase()) || 
                                       f.sender.toLowerCase().includes(feedbackSearch.toLowerCase());
                        const matchF = feedbackFilter === "Tất cả" || f.status === feedbackFilter;
                        return matchS && matchF;
                      })
                      .map((f, idx) => (
                        <tr key={f.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 font-bold text-slate-800">{f.content}</td>
                          <td className="py-2.5 text-slate-500">{f.sender}</td>
                          <td className="py-2.5">
                            <button 
                              onClick={() => toggleFeedbackStatus(f.id)}
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border transition-all ${
                                f.status === "Đã xử lý" 
                                  ? "bg-green-50 text-green-700 border-green-100" 
                                  : "bg-amber-50 text-amber-700 border-amber-100 animate-pulse"
                              }`}
                              title="Click để giải quyết phản ánh"
                            >
                              {f.status}
                            </button>
                          </td>
                          <td className="py-2.5 font-mono text-slate-400 text-right">{f.date}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 9. Tài liệu - biểu mẫu (Thư mục tài liệu góc dưới Ảnh 1) */}
          {(activeTab === "dashboard" || activeTab === "templates") && (
            <div id="tai-lieu" className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h2 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Tài liệu - biểu mẫu</h2>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Kho tài liệu Tổ TS</span>
              </div>

              <div className="space-y-3.5">
                {[
                  { name: "Hướng dẫn sử dụng VNeID.pdf", size: "2.3 MB" },
                  { name: "Mẫu đơn đề nghị cấp CCCD.docx", size: "1.1 MB" },
                  { name: "Hướng dẫn nộp hồ sơ online.pdf", size: "3.4 MB" },
                  { name: "Quy trình hỗ trợ người dân.docx", size: "1.8 MB" },
                  { name: "Tài liệu tập huấn kỹ năng số.pptx", size: "5.2 MB" }
                ].map((doc, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50/50 hover:bg-slate-50 border border-slate-100/50 p-3 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg border text-red-500">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-700">{doc.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{doc.size}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDownloadDoc(doc.name)}
                      className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 11. Thống kê - báo cáo (Xuất báo cáo hoạt động hình 5) */}
          {(activeTab === "dashboard" || activeTab === "statistics") && (
            <div id="thong-ke-bao-cao" className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <h2 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Thống kê & Xuất báo cáo hoạt động</h2>
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Số liệu Quý II/2026</span>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Thành viên hoạt động</span>
                  <p className="text-xl font-black text-slate-700">{members.filter(m => m.status === "Đang hoạt động").length} / {members.length}</p>
                  <p className="text-[9px] text-emerald-600 font-bold">100% Sẵn sàng hỗ trợ</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Hộ dân tiếp cận hỗ trợ</span>
                  <p className="text-xl font-black text-slate-700 font-mono">256 hộ</p>
                  <p className="text-[9px] text-blue-600 font-bold">~80% Tổng số hộ thôn</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Yêu cầu hoàn thành</span>
                  <p className="text-xl font-black text-slate-700 font-mono">{supportRequests.filter(s => s.status === "Hoàn thành" || s.status === "Hoàn thành" || s.status === "COMPLETED").length} / {supportRequests.length}</p>
                  <p className="text-[9px] text-emerald-600 font-bold">Tỷ lệ xử lý: {supportRequests.length ? ((supportRequests.filter(s => s.status === "Hoàn thành" || s.status === "COMPLETED").length / supportRequests.length) * 100).toFixed(0) : 0}%</p>
                </div>
              </div>

              {/* Graphical representation */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100/50">
                <h3 className="font-bold text-xs text-slate-700">Tiến độ cài đặt & Kích hoạt định danh số</h3>
                <div className="space-y-2.5">
                  {[
                    { label: "Cài đặt & Kích hoạt định danh VNeID mức 2", current: 184, total: 200, color: "bg-blue-600" },
                    { label: "Đăng ký tài khoản Cổng Dịch vụ công quốc gia", current: 142, total: 200, color: "bg-emerald-600" },
                    { label: "Mở tài khoản thanh toán số không tiền mặt", current: 112, total: 200, color: "bg-indigo-600" },
                    { label: "Cài đặt ứng dụng tương tác chính quyền", current: 165, total: 200, color: "bg-amber-600" }
                  ].map((item, idx) => {
                    const percent = (item.current / item.total) * 100;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-slate-600">{item.label}</span>
                          <span className="text-slate-800">{item.current}/{item.total} ({percent.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-slate-200/60 rounded-full h-2 overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Export Panel (Faithful to Image 5) */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl space-y-3">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-xs text-blue-900 uppercase">Xuất báo cáo kết quả hoạt động</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Chọn định dạng để kết xuất toàn bộ số liệu hồ sơ tổ, danh sách thành viên và nhật ký hỗ trợ người dân của Thôn Thạch Nham Đông lên hệ thống quản lý xã.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button 
                    onClick={handleExportExcel}
                    className="flex items-center justify-center gap-2 p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/10 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Xuất Excel (.xlsx)</span>
                  </button>
                  <button 
                    onClick={handleExportWord}
                    className="flex items-center justify-center gap-2 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Xuất Word (.doc)</span>
                  </button>
                  <button 
                    onClick={handleExportPdf}
                    className="flex items-center justify-center gap-2 p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/10 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Xuất PDF (.pdf)</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-blue-100/50 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <span className="text-[9px] text-slate-400 font-bold">Lần xuất cuối: Vừa xong</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onFlashNotification("📤 Đã gửi báo cáo kết quả thành công lên Cán bộ xã!", "SUCCESS")}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase shadow-sm shadow-indigo-600/10 cursor-pointer"
                    >
                      Nộp báo cáo lên xã
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 10. Cài đặt tài khoản Tổ */}
          {activeTab === "settings" && (
            <div id="cai-dat" className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Settings className="w-4 h-4" />
                  </div>
                  <h2 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Cài đặt tài khoản</h2>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); onFlashNotification("💾 Đã lưu tùy chọn cài đặt thành công!", "SUCCESS"); }} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Họ và tên cán bộ</label>
                    <input 
                      type="text" 
                      value={accountSettings.name}
                      onChange={e => setAccountSettings({ ...accountSettings, name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">SĐT công vụ</label>
                    <input 
                      type="text" 
                      value={accountSettings.phone}
                      onChange={e => setAccountSettings({ ...accountSettings, phone: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Địa chỉ Email</label>
                  <input 
                    type="email" 
                    disabled
                    value={accountSettings.email}
                    className="w-full p-2.5 bg-slate-100 text-slate-400 border rounded-xl cursor-not-allowed font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block font-medium">Do phòng nhân sự Ủy ban xã cung cấp định danh trực tuyến.</span>
                </div>

                <div className="space-y-3 pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-700">Thông báo SMS Zalo tự động</p>
                      <p className="text-[10px] text-slate-400 font-medium">Nhận cảnh báo trực tuyến khi Ủy ban xã phát tin nhắc nhở hoặc biểu mẫu.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={accountSettings.notifications}
                      onChange={e => setAccountSettings({ ...accountSettings, notifications: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-700">Tự động đồng bộ cục bộ</p>
                      <p className="text-[10px] text-slate-400 font-medium">Tự động sao lưu dữ liệu hỗ trợ công dân định kỳ mỗi tuần.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={accountSettings.autoBackup}
                      onChange={e => setAccountSettings({ ...accountSettings, autoBackup: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/15"
                  >
                    Lưu các thiết lập
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
