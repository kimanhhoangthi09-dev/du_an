/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, Send, Bot, User, Trash2, ArrowRight, Lightbulb, 
  Cpu, BarChart, FileSearch, HelpCircle, RefreshCw 
} from "lucide-react";

interface Message {
  role: "user" | "model";
  content: string;
}

interface AIChatDashboardProps {
  currentUser: any;
  systemData: any;
}

export default function AIChatDashboard({ currentUser, systemData }: AIChatDashboardProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content: `Xin chào đồng chí **${currentUser.fullName}**! Tôi là **Trợ lý Trí tuệ Nhân tạo Ba Na AI**.\n\nTôi sẵn sàng giải đáp **bất kỳ câu hỏi nào** của đồng chí — từ kiến thức tổng hợp, tư vấn soạn thảo công văn, giải đáp thủ tục hành chính, đến phân tích đối soát chính xác dữ liệu báo cáo 22 thôn xã Bà Nà. Hãy hỏi tôi bất kỳ điều gì!`
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const quickPrompts = [
    { text: "Soạn thảo văn bản công văn báo cáo tiến độ?", desc: "Hỗ trợ viết văn bản hành chính theo chuẩn Nghị định 30." },
    { text: "Thôn nào chưa nộp báo cáo Tháng 07/2026?", desc: "Đôn đốc, kiểm tra tiến độ nộp số liệu hành chính." },
    { text: "Tìm hiểu quy trình chuyển đổi số cấp xã?", desc: "Giải đáp kiến thức công nghệ thông tin và cải cách hành chính." },
    { text: "Số liệu thôn nào đang bị lỗi hoặc bất thường?", desc: "Tìm lỗi logic nhập liệu và cảnh báo tăng trưởng đột biến." },
    { text: "Tổng dân số và số hộ nghèo toàn xã Bà Nà?", desc: "Tổng hợp chỉ số gộp của các đơn vị đã phê duyệt." }
  ];

  // Summarize state for model context
  const buildContextFeed = () => {
    if (!systemData) return null;
    
    const { tasks, assignments, submissions, villages } = systemData;
    const currentTask = tasks.find((t: any) => t.id === "t-02"); 

    const t07Assignments = assignments.filter((a: any) => a.taskId === "t-02");
    const t07Submissions = submissions.filter((s: any) => s.taskId === "t-02");

    const unsubmitted = t07Assignments
      .filter((a: any) => ["CHUA_XEM", "DANG_THUC_HIEN", "NOP_QUA_HAN"].includes(a.status))
      .map((a: any) => {
        const v = (villages || []).find((vl: any) => vl.id === a.villageId);
        return v ? v.name : a.villageId;
      });

    const errorVillages = t07Submissions
      .filter((s: any) => s.status === "CO_LOI_CAN_SUA")
      .map((s: any) => {
        const v = (villages || []).find((vl: any) => vl.id === s.villageId);
        return v ? v.name : s.villageId;
      });

    const approvedSubmissions = t07Submissions.filter((s: any) => s.status === "DA_DUYET");
    let approvedH = 0;
    let approvedP = 0;
    approvedSubmissions.forEach((s: any) => {
      approvedH += s.formData.totalHouseholds || 0;
      approvedP += s.formData.totalPopulation || 0;
    });

    return {
      summary: {
        taskTitle: currentTask?.title || "",
        period: "Tháng 07/2026",
        approvedCount: t07Assignments.filter((a: any) => a.status === "DA_DUYET").length,
        submittedCount: t07Assignments.filter((a: any) => a.status === "DA_NOP").length,
        unsubmittedCount: unsubmitted.length,
        unsubmittedVillages: unsubmitted,
        errorCount: errorVillages.length,
        errorVillages: errorVillages,
        approvedHouseholds: approvedH,
        approvedPopulation: approvedP
      },
      villageDetails: t07Submissions.map((s: any) => ({
        villageName: s.formData.villageName,
        status: s.status,
        households: s.formData.totalHouseholds,
        population: s.formData.totalPopulation,
        poorHouseholds: s.formData.poorHouseholds,
        anomalies: s.validationSummary?.hasWarnings ? "Cảnh báo tăng trưởng >30%" : "Không"
      }))
    };
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    setErrorMsg("");
    const userMsg = textToSend;
    setInput("");
    
    // Append user message
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const contextFeed = buildContextFeed();
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMsg }].slice(-10), 
          dataContext: contextFeed,
          userRole: currentUser.role,
          userVillage: currentUser.villageId
        })
      });

      if (!response.ok) {
        throw new Error("Lỗi phản hồi từ máy chủ.");
      }

      const result = await response.json();
      setMessages(prev => [...prev, { role: "model", content: result.content }]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Không thể kết nối với máy chủ AI. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (confirm("Đồng chí có muốn xóa sạch lịch sử hội thoại hiện tại?")) {
      setMessages([
        {
          role: "model",
          content: `Đã dọn dẹp lịch sử trò chuyện. Tôi là **Trợ lý Ba Na AI**, hãy bắt đầu hỏi tôi nhé!`
        }
      ]);
    }
  };

  return (
    <div id="ai-chat-dashboard" className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      
      {/* LEFT COLUMN: MAIN CHAT INTERFACE (8 cols) */}
      <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col h-[650px] overflow-hidden">
        
        {/* Chat top header */}
        <div className="bg-[#F8FAFC] border-b border-slate-50 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Bot className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">Trò chuyện cùng Ba Na AI</h3>
              <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Mô hình: Gemini 3.6 Flash • Trả lời mọi câu hỏi & Phân tích dữ liệu
              </p>
            </div>
          </div>

          <button
            onClick={handleClearChat}
            title="Xóa cuộc trò chuyện"
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:outline-none"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Message Container Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/20">
          {messages.map((msg, index) => {
            const isModel = msg.role === "model";
            return (
              <div 
                key={index} 
                className={`flex gap-3.5 max-w-[85%] ${isModel ? "self-start" : "ml-auto flex-row-reverse"}`}
              >
                {/* Avatar Icon */}
                <div className={`p-2 rounded-xl flex-shrink-0 w-8.5 h-8.5 flex items-center justify-center ${
                  isModel ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700 font-bold text-xs"
                }`}>
                  {isModel ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Bubble box */}
                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed font-semibold ${
                  isModel 
                    ? "bg-white text-slate-700 border border-slate-100 shadow-sm" 
                    : "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                }`}>
                  {/* Parse markdown manually or keep clean display text */}
                  <div className="whitespace-pre-line space-y-1">
                    {msg.content.split("\n").map((line, lIdx) => {
                      // Basic parsing for **bold** text in responses
                      if (line.includes("**")) {
                        const parts = line.split("**");
                        return (
                          <p key={lIdx}>
                            {parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong className="font-extrabold text-blue-900" key={pIdx}>{part}</strong> : part)}
                          </p>
                        );
                      }
                      return <p key={lIdx}>{line}</p>;
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading bubble */}
          {loading && (
            <div className="flex gap-3.5 max-w-[80%] self-start animate-pulse">
              <div className="p-2 bg-blue-600 text-white rounded-xl w-8.5 h-8.5 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 bg-white text-slate-500 border border-slate-100 shadow-sm rounded-2xl text-xs font-semibold flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                <span>Trợ lý Ba Na AI đang đối chiếu dữ liệu và phân tích phản hồi...</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-red-50 text-red-700 border border-red-100 rounded-xl text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Chat input form box */}
        <div className="border-t border-slate-100 p-4 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-center gap-3 relative"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi tôi bất kỳ điều gì... (Ví dụ: 'Soạn công văn báo cáo', 'Thôn nào chưa nộp số liệu Tháng 07?')"
              className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none text-xs font-semibold text-slate-700 transition-all placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2.5 top-2 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors focus:outline-none disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: PRE-PACKED QUICK ACTION CARDS & EXPLANATIONS (4 cols) */}
      <div className="lg:col-span-4 space-y-5 flex flex-col justify-between">
        {/* Box A: Quick Template Questions */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-50 pb-3">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <div>
              <h4 className="font-extrabold text-sm text-slate-800 tracking-tight">Câu hỏi gợi ý nhanh</h4>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Click vào các mẫu dưới đây để hỏi AI nhanh chóng.</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt.text)}
                disabled={loading}
                className="w-full p-3 bg-slate-50 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-100 rounded-xl transition-all text-left group focus:outline-none"
              >
                <div className="flex justify-between items-center gap-2">
                  <span className="font-bold text-slate-700 text-xs group-hover:text-blue-700 transition-colors leading-snug">
                    {prompt.text}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-transform group-hover:translate-x-0.5 flex-shrink-0" />
                </div>
                <p className="text-[9px] text-slate-400 mt-1 leading-normal font-medium">{prompt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Box B: System Capabilities */}
        <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white border border-blue-950 rounded-2xl p-5 shadow-lg space-y-4 flex-1 mt-0 sm:mt-5">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <Cpu className="w-5 h-5 text-blue-400 animate-pulse" />
            <div>
              <h4 className="font-extrabold text-sm tracking-tight text-white">Năng lực rà soát Ba Na AI</h4>
              <p className="text-[10px] text-blue-200/70 font-semibold mt-0.5">Thuật toán tích hợp đối soát tự động.</p>
            </div>
          </div>

          <div className="space-y-3 text-[11px] font-semibold text-blue-100/90 leading-relaxed">
            <div className="flex gap-2.5 items-start">
              <div className="p-1 bg-white/10 text-blue-300 rounded-md mt-0.5">
                <FileSearch className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-white text-xs">Kiểm tra logic lỗi nhập liệu</p>
                <p className="text-[10px] text-blue-200/70 mt-0.5 font-medium">Tự động phát hiện lỗi tổng số nghèo lớn hơn tổng số hộ, hay sai số cộng dồn giới tính nam/nữ.</p>
              </div>
            </div>

            <div className="flex gap-2.5 items-start">
              <div className="p-1 bg-white/10 text-blue-300 rounded-md mt-0.5">
                <BarChart className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-white text-xs">Cảnh báo tăng trưởng bất thường</p>
                <p className="text-[10px] text-blue-200/70 mt-0.5 font-medium">Tìm các đơn vị có tỷ lệ tăng trưởng hộ dân hoặc nhân khẩu tăng đột biến vượt &gt;30% để xác minh.</p>
              </div>
            </div>

            <div className="flex gap-2.5 items-start">
              <div className="p-1 bg-white/10 text-blue-300 rounded-md mt-0.5">
                <HelpCircle className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-white text-xs">Phân tích chéo liên kỳ</p>
                <p className="text-[10px] text-blue-200/70 mt-0.5 font-medium">Đưa ra nhận xét xu hướng, so sánh chỉ số hộ nghèo, tỷ lệ gia đình đồng bào tộc dân qua từng tháng.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
