/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Sparkles, AlertCircle, ChevronUp } from "lucide-react";
import { UserProfile, UserRole } from "../types";

interface Message {
  role: "user" | "model";
  content: string;
}

interface AIChatbotProps {
  currentUser: UserProfile;
  systemData: any; // Context feed from main state
}

const parseBold = (text: string) => {
  return text.split("**").map((part, idx) => {
    return idx % 2 === 1 ? <strong key={idx} className="font-bold text-gray-900">{part}</strong> : part;
  });
};

const parseInline = (text: string) => {
  const parts: React.ReactNode[] = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  let lastIndex = 0;

  while ((match = linkRegex.exec(text)) !== null) {
    const textBefore = text.substring(lastIndex, match.index);
    if (textBefore) {
      parts.push(...parseBold(textBefore));
    }
    parts.push(
      <a 
        key={match.index} 
        href={match[2]} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-teal-600 hover:underline font-semibold"
      >
        {match[1]}
      </a>
    );
    lastIndex = linkRegex.lastIndex;
  }
  const textAfter = text.substring(lastIndex);
  if (textAfter) {
    parts.push(...parseBold(textAfter));
  }
  
  return parts.length > 0 ? parts : parseBold(text);
};

const renderMessageContent = (content: string) => {
  return content.split("\n").map((line, lineIdx) => {
    const cleanLine = line.trim();
    
    // Check for Headers
    if (cleanLine.startsWith("#### ")) {
      return (
        <h5 key={lineIdx} className="font-bold text-xs mt-2 mb-1 text-gray-900">
          {parseInline(cleanLine.substring(5))}
        </h5>
      );
    }
    if (cleanLine.startsWith("### ")) {
      return (
        <h4 key={lineIdx} className="font-bold text-sm mt-3 mb-1 text-teal-800">
          {parseInline(cleanLine.substring(4))}
        </h4>
      );
    }
    if (cleanLine.startsWith("## ")) {
      return (
        <h3 key={lineIdx} className="font-bold text-base mt-4 mb-2 text-teal-900">
          {parseInline(cleanLine.substring(3))}
        </h3>
      );
    }

    // Check for lists
    if (cleanLine.startsWith("- ") || cleanLine.startsWith("* ")) {
      return (
        <li key={lineIdx} className="ml-4 list-disc mt-0.5 text-gray-700">
          {parseInline(cleanLine.substring(2))}
        </li>
      );
    }
    
    // Check for numbered lists
    const numMatch = cleanLine.match(/^(\d+)\.\s(.*)/);
    if (numMatch) {
      return (
        <li key={lineIdx} className="ml-4 list-decimal mt-0.5 text-gray-700">
          {parseInline(numMatch[2])}
        </li>
      );
    }

    // Check for code block markers
    if (cleanLine.startsWith("```")) {
      return null;
    }

    // Normal paragraph
    if (cleanLine === "") {
      return <div key={lineIdx} className="h-2" />;
    }

    return (
      <p key={lineIdx} className="mt-1 text-gray-700">
        {parseInline(line)}
      </p>
    );
  });
};

export default function AIChatbot({ currentUser, systemData }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content: `Xin chào cán bộ **${currentUser.fullName}**! Tôi là **Trợ lý Ba Na AI** (mô hình Gemini 3.6 Flash).\n\nTôi sẵn sàng giải đáp **bất kỳ câu hỏi nào** của đồng chí — từ kiến thức tổng hợp (khoa học, lịch sử, văn bản công vụ, kỹ năng công nghệ) cho đến phân tích chi tiết dữ liệu số báo cáo xã Bà Nà!`
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
    "Soạn thảo công văn báo cáo tiến độ?",
    "Thôn nào chưa nộp báo cáo Tháng 07/2026?",
    "Giải thích giúp tôi về quy trình chuyển đổi số cấp xã?",
    "Số liệu thôn nào đang bị lỗi hoặc bất thường?",
    "Tổng dân số xã Bà Nà đạt bao nhiêu người?"
  ];

  // Summarize state for model context
  const buildContextFeed = () => {
    if (!systemData) return null;
    
    const { tasks, assignments, submissions } = systemData;
    const currentTask = tasks.find((t: any) => t.id === "t-02"); // Month 07
    const prevTask = tasks.find((t: any) => t.id === "t-01"); // Month 06

    const t07Assignments = assignments.filter((a: any) => a.taskId === "t-02");
    const t07Submissions = submissions.filter((s: any) => s.taskId === "t-02");

    // Compute metrics
    const unsubmitted = t07Assignments
      .filter((a: any) => ["CHUA_XEM", "DANG_THUC_HIEN", "NOP_QUA_HAN"].includes(a.status))
      .map((a: any) => {
        const v = VILLAGES_LIST_LOCAL.find(vl => vl.id === a.villageId);
        return v ? v.name : a.villageId;
      });

    const errorVillages = t07Submissions
      .filter((s: any) => s.status === "CO_LOI_CAN_SUA")
      .map((s: any) => {
        const v = VILLAGES_LIST_LOCAL.find(vl => vl.id === s.villageId);
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
          messages: [...messages, { role: "user", content: userMsg }].slice(-10), // send last 10 messages
          dataContext: contextFeed,
          userRole: currentUser.role,
          userVillage: currentUser.villageId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Lỗi phản hồi từ máy chủ.");
      }

      const result = await response.json();
      setMessages(prev => [...prev, { role: "model", content: result.content }]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Không thể kết nối với Trợ lý AI. Vui lòng kiểm tra lại kết nối mạng.");
    } finally {
      setLoading(false);
    }
  };

  // Local helper list of villages to prevent circular import in node/web bundles
  const VILLAGES_LIST_LOCAL = [
    { id: "v01", name: "Thôn 01" }, { id: "v02", name: "Thôn 02" }, { id: "v03", name: "Thôn 03" },
    { id: "v04", name: "Thôn 04" }, { id: "v05", name: "Thôn 05" }, { id: "v06", name: "Thôn 06" },
    { id: "v07", name: "Thôn 07" }, { id: "v08", name: "Thôn 08" }, { id: "v09", name: "Thôn 09" },
    { id: "v10", name: "Thôn 10" }, { id: "v11", name: "Thôn 11" }, { id: "v12", name: "Thôn 12" },
    { id: "v13", name: "Thôn 13" }, { id: "v14", name: "Thôn 14" }, { id: "v15", name: "Thôn 15" },
    { id: "v16", name: "Thôn 16" }, { id: "v17", name: "Thôn 17" }, { id: "v18", name: "Thôn 18" },
    { id: "v19", name: "Thôn 19" }, { id: "v20", name: "Thôn 20" }, { id: "v21", name: "Thôn 21" },
    { id: "v22", name: "Thôn 22" }
  ];

  return (
    <div id="ai-chatbot-root" className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Chat Trigger Button */}
      {!isOpen && (
        <button
          id="btn-trigger-ai"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-blue-400 font-sans border border-blue-500/10"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-5.5 h-5.5 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </div>
          <span className="font-extrabold text-xs tracking-wide">Trợ lý Bà Nà AI</span>
          <ChevronUp className="w-4 h-4 ml-0.5 text-white/90 group-hover:translate-y-[-2px] transition-transform" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div 
          id="ai-chat-window" 
          className="flex flex-col w-[420px] h-[580px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 transform scale-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-teal-700 to-blue-800 text-white">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/10 rounded-lg">
                <Bot className="w-5 h-5 text-yellow-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Trợ lý số Civigo</h3>
                <p className="text-xs text-teal-200">Gemini 3.6 Flash • Trả lời mọi câu hỏi</p>
              </div>
            </div>
            <button
              id="btn-close-chat"
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2.5 max-w-[85%] ${
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    msg.role === "user" ? "bg-teal-100 text-teal-800" : "bg-teal-700 text-white"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4 text-yellow-300" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-teal-600 text-white rounded-tr-none"
                      : "bg-white text-gray-800 border border-gray-200 shadow-sm rounded-tl-none whitespace-pre-wrap"
                  }`}
                >
                  {msg.role === "user" ? (
                    msg.content.split("\n\n").map((para, pIdx) => (
                      <p key={pIdx} className={pIdx > 0 ? "mt-2" : ""}>
                        {para.split("**").map((text, tIdx) => (
                          tIdx % 2 === 1 ? <strong key={tIdx} className="font-bold">{text}</strong> : text
                        ))}
                      </p>
                    ))
                  ) : (
                    renderMessageContent(msg.content)
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 mr-auto max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center animate-spin">
                  <Bot className="w-4 h-4 text-yellow-300" />
                </div>
                <div className="p-3 bg-white border border-gray-200 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="flex gap-2 mx-auto max-w-[95%] p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 items-start">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Lỗi kết nối:</span> {errorMsg}
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick-action prompts */}
          <div className="px-4 py-2 border-t border-gray-100 bg-white">
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1.5">Câu hỏi phổ biến:</p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none max-w-full">
              {quickPrompts.map((p, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => handleSend(p)}
                  className="whitespace-nowrap px-3 py-1 bg-gray-100 hover:bg-teal-50 hover:text-teal-800 border border-gray-200 hover:border-teal-200 rounded-full text-xs text-gray-600 transition-colors focus:outline-none focus:ring-1 focus:ring-teal-300"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-center gap-2 p-3 bg-white border-t border-gray-100"
          >
            <input
              id="input-ai-chat"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi trợ lý dữ liệu..."
              className="flex-1 px-4 py-2 text-sm border border-gray-200 focus:border-teal-500 rounded-full focus:outline-none focus:ring-1 focus:ring-teal-500 bg-gray-50/50"
            />
            <button
              id="btn-send-ai"
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-100 text-white disabled:text-gray-400 rounded-full transition-colors focus:outline-none"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
