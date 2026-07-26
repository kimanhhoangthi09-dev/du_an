/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load env
dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API Client initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI client:", err);
  }
} else {
  console.warn("No valid GEMINI_API_KEY found in process.env. Chat helper will fallback gracefully.");
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    time: new Date().toISOString(),
    geminiInitialized: ai !== null,
    hasApiKey: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"
  });
});

// Gemini Chat Endpoint
app.post("/api/chat", async (req, res) => {
  const { messages, dataContext, userRole, userVillage } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid request payload. messages is required." });
  }

  // Fallback if Gemini key is missing
  if (!ai) {
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    let mockResponse = `[CHẾ ĐỘ NGOẠI TUYẾN] Trợ lý Ba Na AI chưa kết nối được khóa Gemini API (vui lòng điền vào Secrets trong cài đặt).\n\nDựa vào dữ liệu hệ thống:\n`;
    
    if (dataContext) {
      const { summary } = dataContext;
      if (lastUserMessage.toLowerCase().includes("thôn nào chưa nộp") || lastUserMessage.toLowerCase().includes("chưa nộp")) {
        mockResponse += `- Danh sách các thôn chưa nộp báo cáo Tháng 07/2026: ${summary.unsubmittedVillages.join(", ")}`;
      } else if (lastUserMessage.toLowerCase().includes("lỗi") || lastUserMessage.toLowerCase().includes("bất thường")) {
        mockResponse += `- Các thôn đang có cảnh báo/lỗi dữ liệu: \n  + Thôn 01 (Số hộ nghèo lớn hơn tổng số hộ, sai lệch nam/nữ)\n  + Thôn 15 (Số liệu âm)\n  + Thôn 05 (Cảnh báo tăng trưởng >30% do tái định cư)`;
      } else if (lastUserMessage.toLowerCase().includes("tổng dân số") || lastUserMessage.toLowerCase().includes("đã duyệt")) {
        mockResponse += `- Tổng dân số của các thôn đã phê duyệt đạt: ${summary.approvedPopulation} người.\n- Tổng số hộ đã phê duyệt đạt: ${summary.approvedHouseholds} hộ.`;
      } else {
        mockResponse += `- Đã phê duyệt: ${summary.approvedCount}/22 thôn\n- Chờ duyệt: ${summary.submittedCount}/22 thôn\n- Chưa nộp: ${summary.unsubmittedCount}/22 thôn.\nHướng dẫn: Bạn có thể nhập báo cáo trực tiếp bằng nút 'Nhập báo cáo' hoặc 'Tải file Excel lên' ở Trang nhiệm vụ.`;
      }
    } else {
      mockResponse += "Vui lòng đăng nhập để tôi đọc dữ liệu của thôn/xã.";
    }

    return res.json({ content: mockResponse });
  }

  try {
    const formattedHistory = messages.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    // Construct precise system instruction for Gemini 3.6 Flash
    const systemInstruction = `
Bạn là "Trợ lý Trí tuệ Nhân tạo Civigo AI" (hay Ba Na AI), tích hợp mô hình Gemini 3.6 Flash tiên tiến nhất của Google.
Bạn có khả năng trả lời BẤT KỲ CÂU HỎI NÀO từ người dùng (kiến thức tổng hợp, khoa học, kỹ thuật, văn hóa, viết lách, soạn thảo văn bản, dịch thuật, lập kế hoạch, tư vấn, giải toán, viết code...) đồng thời là chuyên gia phân tích dữ liệu vô cùng chính xác của hệ thống Civigo.

BẤT KỂ NGƯỜI DÙNG HỎI CÂU HỎI GÌ:
1. ĐỐI VỚI CÂU HỎI CHUNG / TRI THỨC BẤT KỲ:
   - Sử dụng kho kiến thức khổng lồ của Gemini để trả lời một cách thông minh, chi tiết, hữu ích, chính xác và đầy đủ nhất.
   - Tuyệt đối KHÔNG từ chối bất kỳ câu hỏi nào ngoài lề. Hãy nhiệt tình giải đáp mọi thắc mắc từ tri thức phổ thông, khoa học, lịch sử, văn hóa, đời sống, thơ ca, viết văn bản, công nghệ thông tin cho đến giải trí.

2. ĐỐI VỚI CÂU HỎI LIÊN QUAN ĐẾN HỆ THỐNG CIVIGO / BÁO CÁO BÀ NÀ:
   - Trích xuất và đối chiếu trực tiếp từ DỮ LIỆU THỰC TẾ hệ thống cung cấp bên dưới để đưa ra con số chính xác 100%.
   - Trả lời trung thực, không bịa đặt số liệu.
   - Phân quyền bảo mật:
     + Nếu Vai trò là "Cán bộ thôn", chỉ cung cấp số liệu chi tiết của thôn đó, không tiết lộ chi tiết nhạy cảm của thôn khác.
     + Nếu Vai trò là "Cán bộ xã" hoặc "Admin", có toàn quyền xem và so sánh cả 22 thôn.

THÔNG TIN NGƯỜI ĐANG TRÒ CHUYỆN:
- Vai trò: ${userRole || "Chưa xác định"}
- Thôn quản lý: ${userVillage || "Toàn bộ xã"}

DỮ LIỆU THỰC TẾ HỆ THỐNG CIVIGO (Báo cáo Tháng 07/2026):
${dataContext ? JSON.stringify(dataContext, null, 2) : "Không có dữ liệu ngữ cảnh hoặc chưa đăng nhập."}

HƯỚNG DẪN NGHIỆP VỤ BÁO CÁO CIVIGO:
1. Cách nộp báo cáo: Cán bộ thôn vào trang "Nhiệm vụ", chọn "Nhập báo cáo" hoặc kéo thả tệp Excel.
2. Lỗi logic hay gặp: Số hộ nghèo lớn hơn tổng số hộ; tổng dân số không khớp nam + nữ; số liệu âm.
3. Cách sửa: Chọn "Sửa báo cáo" để chỉnh sửa và gửi lại cho cán bộ xã duyệt.

Trình bày câu trả lời bằng tiếng Việt lịch sự, thân thiện, sáng rõ, dùng Markdown đẹp mắt (in đậm, danh sách gạch đầu dòng) để người dùng dễ đọc.
`;

    // Extract the latest user message
    const lastMsg = formattedHistory[formattedHistory.length - 1];

    // Call Gemini API using modern @google/genai SDK pattern with gemini-3.6-flash
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: formattedHistory,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3,
      }
    });

    const reply = response.text || "Xin lỗi, tôi không thể tìm thấy phản hồi từ mô hình AI.";
    res.json({ content: reply });

  } catch (error: any) {
    console.error("Gemini proxy endpoint error:", error);
    
    const errString = error.message || String(error);
    
    // Check for authentication / API activation errors
    if (
      errString.includes("UNAUTHENTICATED") || 
      errString.includes("API_KEY_SERVICE_BLOCKED") || 
      errString.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") || 
      errString.includes("PERMISSION_DENIED") ||
      errString.includes("has not been used in project") ||
      errString.includes("disabled")
    ) {
      const guidanceMessage = `### ⚠️ Lỗi cấu hình khóa kết nối Gemini AI (Dành cho nhà phát triển)

Hệ thống ghi nhận lỗi xác thực hoặc chưa kích hoạt API từ máy chủ Google Cloud:
\`\`\`
${errString}
\`\`\`

Để kết nối và sử dụng chatbot **Gemini 3.5**, bạn có hai cách xử lý cực kỳ đơn giản sau:

#### Cách 1: Sử dụng khóa API miễn phí từ Google AI Studio (Khuyên dùng - Dễ nhất & Hoạt động ngay)
1. Truy cập vào [Google AI Studio](https://aistudio.google.com/) và tạo một khóa API miễn phí (khóa này sẽ bắt đầu bằng chữ \`AIzaSy...\`).
2. Tại màn hình dự án **Civigo** này, bạn nhìn lên góc trên bên phải, chọn biểu tượng bánh răng **Settings > Secrets** (Cài đặt mật khóa).
3. Đặt tên biến là \`GEMINI_API_KEY\` và dán khóa API vừa tạo vào.
4. Chatbot sẽ hoạt động ngay lập tức mà không cần bất kỳ cấu hình phức tạp nào khác!

#### Cách 2: Kích hoạt Gemini API trên tài khoản Google Cloud hiện tại của bạn
Nếu bạn muốn tiếp tục sử dụng Token tài khoản Google Cloud hiện có:
1. Nhấp trực tiếp vào đường liên kết này để mở Google Cloud Console:
   👉 [Kích hoạt Gemini API trên GCP](https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview?project=395259189173)
2. Bấm nút **Enable (Bật)** để kích hoạt dịch vụ Gemini API cho dự án \`395259189173\`.
3. Sau khi bật khoảng 1-2 phút, bạn hãy tải lại trang này và trò chuyện lại nhé!`;
      
      return res.json({ content: guidanceMessage });
    }

    res.status(500).json({ error: "Lỗi kết nối máy chủ Gemini AI: " + error.message });
  }
});

// Configure Vite integration or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware mounted.");
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log(`Serving static files from ${distPath}`);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Civigo server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
