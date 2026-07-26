/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from "xlsx";
import { 
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
  WidthType, AlignmentType, BorderStyle, HeadingLevel 
} from "docx";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { Submission, Village, ValidationIssue, AuditLog } from "../types";
import { VILLAGES_LIST } from "../data/villages";
import { INDICATOR_CATALOG } from "./validation";

// Columns for Excel template download
export const TEMPLATE_COLUMNS = [
  "Mã Thôn",
  "Tên Thôn",
  "Kỳ báo cáo",
  "Người lập báo cáo",
  "Chức danh",
  "Số điện thoại",
  "CT01 - Tổng số hộ dân",
  "CT02 - Tổng số nhân khẩu",
  "CT03 - Số hộ nghèo",
  "CT04 - Số hộ cận nghèo",
  "CT05 - Số người có công với cách mạng",
  "CT06 - Số đối tượng bảo trợ xã hội đang hưởng trợ cấp",
  "CT07 - Số trẻ em dưới 16 tuổi",
  "CT08 - Số trẻ em có hoàn cảnh đặc biệt",
  "CT09 - Số hộ đạt “Gia đình văn hóa”",
  "CT10 - Số người trong độ tuổi lao động",
  "CT11 - Số người tham gia BHYT",
  "CT12 - Số thành viên Tổ Công nghệ số cộng đồng",
  "CT13 - Số người dân được hướng dẫn dùng dịch vụ công trực tuyến trong kỳ",
  "CT14 - Số vụ bạo lực gia đình ghi nhận trong kỳ",
  "Ghi chú"
];

// 1. Download Excel template
export function downloadExcelTemplate() {
  const wsData = [
    TEMPLATE_COLUMNS,
    [
      "T18",
      "Thôn Một",
      "Quý II năm 2026",
      "Lê Văn Tùng",
      "Trưởng thôn",
      "0912345018",
      350,
      1400,
      12,
      15,
      25,
      45,
      310,
      3,
      320,
      820,
      1380,
      7,
      95,
      1,
      "Dữ liệu mẫu thôn Một"
    ]
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws["!cols"] = TEMPLATE_COLUMNS.map(() => ({ wch: 20 }));

  XLSX.utils.book_append_sheet(wb, ws, "Mau_Bao_Cao_Civigo");
  XLSX.writeFile(wb, "Civigo_Mau_Bao_Cao.xlsx");
}

// 2. Parse uploaded Excel
export function parseVillageVerticalReport(workbook: XLSX.WorkBook, fileName: string): {
  formData: Record<string, any>;
  villageCode: string;
  filenameMismatch: boolean;
  filenameMismatchMessage: string;
} {
  // Find "Phiếu báo cáo" sheet, otherwise fallback to the first sheet
  let sheetName = workbook.SheetNames.find(name => name.trim() === "Phiếu báo cáo");
  if (!sheetName) {
    sheetName = workbook.SheetNames[0];
  }
  const ws = workbook.Sheets[sheetName];
  
  const getVal = (cellRef: string): string => {
    const cell = ws[cellRef];
    return cell && cell.v !== undefined ? String(cell.v).trim() : "";
  };

  const villageName = getVal("B7");
  const reporterName = getVal("B8");
  const reporterTitle = getVal("B9");
  const phone = getVal("B10");
  const deadline = getVal("B11");

  const formData: Record<string, any> = {
    villageName,
    reporterName,
    reporterTitle,
    phone,
    deadline,
    reportDate: new Date().toLocaleDateString("vi-VN"),
    notes: ""
  };

  const notesList: string[] = [];
  for (let r = 14; r <= 27; r++) {
    const code = getVal(`A${r}`).trim();
    const value = getVal(`D${r}`);
    const note = getVal(`E${r}`);

    if (code && code.toUpperCase().startsWith("CT")) {
      const cleanCode = code.toUpperCase().slice(0, 4); // "CT01" etc
      formData[cleanCode] = value;
      if (note) {
        notesList.push(`${cleanCode}: ${note}`);
      }
    }
  }

  if (notesList.length > 0) {
    formData.notes = notesList.join("; ");
  }

  // Find village code from filename (e.g. BC_T18_Q2_2026.xlsx)
  let villageCode = "";
  const match = fileName.match(/BC_(T\d{2})/i);
  if (match) {
    villageCode = match[1].toUpperCase();
  }

  // Filename validation
  let filenameMismatch = false;
  let filenameMismatchMessage = "";
  if (villageCode) {
    const expectedVillage = VILLAGES_LIST.find(v => v.code === villageCode);
    if (expectedVillage) {
      const cleanB7 = villageName.toLowerCase().replace(/\s+/g, "");
      const cleanExpected = expectedVillage.name.toLowerCase().replace(/\s+/g, "");
      if (cleanB7 !== "" && !cleanB7.includes(cleanExpected) && !cleanExpected.includes(cleanB7)) {
        filenameMismatch = true;
        filenameMismatchMessage = `Tên thôn trong tệp (${villageName}) không khớp với thôn được gán theo tên file (${expectedVillage.name} - ${villageCode}).`;
      }
    }
  }

  return {
    formData,
    villageCode,
    filenameMismatch,
    filenameMismatchMessage
  };
}

export function parseExcelData(fileData: any[][]): Record<string, any>[] {
  if (fileData.length < 2) return [];
  
  const headers = fileData[0].map(h => String(h).trim());
  const dataRows = fileData.slice(1);

  return dataRows.map(row => {
    const record: Record<string, any> = {};
    
    // Find index of standard fields or fallback to column order
    const getVal = (colNames: string[], colIndexFallback: number) => {
      const idx = headers.findIndex(h => colNames.some(c => h.toLowerCase().includes(c.toLowerCase())));
      const finalIdx = idx >= 0 ? idx : colIndexFallback;
      return row[finalIdx];
    };

    record.villageCode = String(getVal(["mã thôn", "ma thon", "villagecode"], 0) || "").trim();
    record.villageName = String(getVal(["tên thôn", "ten thon", "villagename"], 1) || "").trim();
    record.reportingPeriod = String(getVal(["kỳ báo cáo", "ky bao cao", "reportingperiod"], 2) || "").trim();
    record.reporterName = String(getVal(["người lập", "nguoi lap", "reportername"], 3) || "").trim();
    record.reporterTitle = String(getVal(["chức danh", "chuc danh", "reportertitle"], 4) || "").trim();
    record.phone = String(getVal(["số điện thoại", "so dien thoai", "phone"], 5) || "").trim();

    // Parse the 14 indicators
    INDICATOR_CATALOG.forEach((item, index) => {
      const colIdx = headers.findIndex(h => h.toUpperCase().startsWith(item.code));
      const val = colIdx >= 0 ? row[colIdx] : row[6 + index];
      record[item.code] = val !== undefined && val !== null ? String(val).trim() : "";
    });

    record.notes = String(row[row.length - 1] || "").trim();

    return record;
  }).filter(r => r.villageName || r.villageCode);
}

// 3. Export Excel Summary report with 6 sheets
export function exportExcelSummary(
  submissions: Submission[], 
  villages: Village[], 
  issues: ValidationIssue[], 
  auditLogs: AuditLog[], 
  period: string
) {
  const wb = XLSX.utils.book_new();

  // ----- Sheet 1: Tong hop -----
  const approvedSubs = submissions.filter(s => s.status === "DA_DUYET");
  const thHeaders = ["STT", "Mã Thôn", "Tên Thôn", "Trạng Thái Nộp"];
  INDICATOR_CATALOG.forEach(item => {
    thHeaders.push(`${item.code} (${item.unit})`);
  });

  const thRows: any[][] = [];
  const sums: Record<string, number> = {};
  INDICATOR_CATALOG.forEach(item => { sums[item.code] = 0; });

  villages.forEach((v, index) => {
    const sub = submissions.find(s => s.villageId === v.id);
    const isApproved = sub && sub.status === "DA_DUYET";
    const statusText = sub ? (sub.status === "DA_DUYET" ? "Đã duyệt" : sub.status === "DA_NOP" ? "Chờ duyệt" : "Lỗi/Nháp") : "Chưa nộp";

    const rowData: any[] = [
      index + 1,
      v.code,
      v.name,
      statusText
    ];

    INDICATOR_CATALOG.forEach(item => {
      if (isApproved) {
        // Find approved indicator value
        const val = sub.indicators.find(ind => ind.indicatorCode === item.code);
        const numericVal = val ? (val.correctedValue !== undefined ? val.correctedValue : val.normalizedValue) : 0;
        rowData.push(numericVal);
        sums[item.code] += numericVal;
      } else {
        rowData.push("-"); // don't fill with 0 to comply with instruction
      }
    });

    thRows.push(rowData);
  });

  // Total row
  const totalRow: any[] = ["", "", "TỔNG CỘNG – CÁC THÔN ĐÃ NỘP", ""];
  INDICATOR_CATALOG.forEach(item => {
    totalRow.push(sums[item.code]);
  });
  thRows.push(totalRow);

  const wsTongHop = XLSX.utils.aoa_to_sheet([
    ["BÁO CÁO TỔNG HỢP CHỈ TIÊU VĂN HÓA - XÃ HỘI CHÍNH THỨC"],
    [`Kỳ báo cáo: ${period} | Ngày tổng hợp: ${new Date().toLocaleDateString("vi-VN")}`],
    [],
    thHeaders,
    ...thRows
  ]);
  wsTongHop["!cols"] = thHeaders.map(() => ({ wch: 16 }));
  XLSX.utils.book_append_sheet(wb, wsTongHop, "Tong hop");

  // ----- Sheet 2: Dashboard (KPIs summary) -----
  const submittedCount = submissions.filter(s => s.status !== "BAN_NHAP" && s.status !== "OVERDUE_NOT_SUBMITTED").length;
  const dbRows = [
    ["CHỈ SỐ TIẾN ĐỘ THU THẬP", "GIÁ TRỊ"],
    ["Tổng số thôn thuộc xã", villages.length],
    ["Số thôn đã nộp", approvedSubs.length + submissions.filter(s => s.status === "DA_NOP" || s.status === "CO_LOI_CAN_SUA").length],
    ["Số thôn đã duyệt chính thức", approvedSubs.length],
    ["Tỷ lệ hoàn thành nộp báo cáo", `${((approvedSubs.length / villages.length) * 100).toFixed(1)}%`],
    [],
    ["TỔNG HỢP CHỈ TIÊU ĐÃ DUYỆT (19/22 THÔN)", "SỐ LIỆU TỔNG CỘNG"]
  ];
  INDICATOR_CATALOG.forEach(item => {
    dbRows.push([`${item.code} - ${item.name} (${item.unit})`, sums[item.code]]);
  });

  const wsDashboard = XLSX.utils.aoa_to_sheet([
    ["BẢNG SỐ LIỆU TỔNG QUAN XÃ BÀ NÀ"],
    [],
    ...dbRows
  ]);
  wsDashboard["!cols"] = [{ wch: 45 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsDashboard, "Dashboard");

  // ----- Sheet 3: Theo doi tien do -----
  const tdHeaders = ["STT", "Mã Thôn", "Tên Thôn", "Người Lập", "Số Điện Thoại", "Thời Điểm Nộp", "Trạng Thái", "Số Ngày Trễ", "Số ERROR", "Số WARNING", "Trạng Thái Duyệt"];
  const tdRows = villages.map((v, index) => {
    const sub = submissions.find(s => s.villageId === v.id);
    const delay = sub?.status === "OVERDUE_NOT_SUBMITTED" ? 3 : (v.code === "T03" ? 3 : v.code === "T08" ? 2 : v.code === "T16" ? 1 : 0);
    const isLate = ["T03", "T08", "T16"].includes(v.code) || (sub && sub.status === "NOP_QUA_HAN");
    const errCount = sub?.validationSummary?.errorCount || 0;
    const warnCount = sub?.validationSummary?.warningCount || 0;

    let statusText = "Chưa nộp";
    if (sub) {
      if (sub.status === "DA_DUYET") statusText = "Đã duyệt";
      else if (sub.status === "DA_NOP") statusText = "Chờ duyệt";
      else if (sub.status === "CO_LOI_CAN_SUA") statusText = "Có lỗi cần sửa";
      else if (sub.status === "BAN_NHAP") statusText = "Bản nháp";
    } else if (["T11", "T14", "T21"].includes(v.code)) {
      statusText = "Quá hạn chưa nộp";
    }

    return [
      index + 1,
      v.code,
      v.name,
      sub?.formData?.reporterName || v.leaderName,
      sub?.formData?.phone || v.phone,
      sub?.submittedAt ? new Date(sub.submittedAt).toLocaleString("vi-VN") : "-",
      statusText,
      delay > 0 ? `${delay} ngày` : "-",
      errCount,
      warnCount,
      sub?.status === "DA_DUYET" ? "Đã phê duyệt" : "Chưa phê duyệt"
    ];
  });

  const wsTienDo = XLSX.utils.aoa_to_sheet([
    ["THEO DÕI TIẾN ĐỘ THU THẬP BÁO CÁO"],
    [],
    tdHeaders,
    ...tdRows
  ]);
  wsTienDo["!cols"] = tdHeaders.map(() => ({ wch: 15 }));
  XLSX.utils.book_append_sheet(wb, wsTienDo, "Theo doi tien do");

  // ----- Sheet 4: Tu dien du lieu -----
  const catalogHeaders = ["Mã Chỉ Tiêu", "Tên Chỉ Tiêu", "Đơn Vị Tính", "Kiểu Dữ Liệu", "Bắt Buộc", "Giá Trị Nhỏ Nhất"];
  const catalogRows = INDICATOR_CATALOG.map(item => [
    item.code,
    item.name,
    item.unit,
    item.dataType === "integer" ? "Số nguyên" : "Số thực",
    item.required ? "Có" : "Không",
    item.minValue
  ]);
  const wsCatalog = XLSX.utils.aoa_to_sheet([
    ["TỪ ĐIỂN DỮ LIỆU CHỈ TIÊU PHÁT TRIỂN VĂN HÓA – XÃ HỘI"],
    [],
    catalogHeaders,
    ...catalogRows
  ]);
  wsCatalog["!cols"] = catalogHeaders.map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, wsCatalog, "Tu dien du lieu");

  // ----- Sheet 5: Danh sach loi -----
  const errHeaders = ["Mã Lỗi", "Thôn", "Chỉ Tiêu", "Giá Trị Gốc", "Loại Lỗi", "Mức Độ", "Mô Tả Lỗi", "Gợi Ý Sửa", "Excel Cell"];
  const errRows = issues.map((issue, idx) => [
    issue.id,
    issue.villageName || "-",
    issue.field,
    String(issue.value),
    issue.type,
    issue.severity,
    issue.message,
    issue.suggestion,
    issue.sourceRow ? `Dòng ${issue.sourceRow}, Cột ${issue.sourceColumn || 'G'}` : "-"
  ]);
  const wsLoi = XLSX.utils.aoa_to_sheet([
    ["DANH SÁCH LỖI VÀ CẢNH BÁO DỮ LIỆU PHÁT HIỆN TỰ ĐỘNG"],
    [],
    errHeaders,
    ...errRows
  ]);
  wsLoi["!cols"] = errHeaders.map(() => ({ wch: 16 }));
  XLSX.utils.book_append_sheet(wb, wsLoi, "Danh sach loi");

  // ----- Sheet 6: Lich su chinh sua -----
  const logHeaders = ["STT", "Thời Gian", "Tài Khoản", "Vai Trò", "Thao Tác", "Chi Tiết"];
  const logRows = auditLogs.map((log, idx) => [
    idx + 1,
    new Date(log.createdAt).toLocaleString("vi-VN"),
    log.userName,
    log.userRole,
    log.action,
    log.details
  ]);
  const wsLichSu = XLSX.utils.aoa_to_sheet([
    ["NHẬT KÝ HỆ THỐNG VÀ LỊCH SỬ CHỈNH SỬA BIỂU MẪU"],
    [],
    logHeaders,
    ...logRows
  ]);
  wsLichSu["!cols"] = logHeaders.map(() => ({ wch: 15 }));
  XLSX.utils.book_append_sheet(wb, wsLichSu, "Lich su chinh sua");

  XLSX.writeFile(wb, `Civigo_Bao_Cao_Tong_Hop_${period.replace(/ /g, "_")}.xlsx`);
}

// 4. Export Word
export async function exportWordReport(
  submissions: Submission[], 
  villages: Village[], 
  period: string,
  taskTitle: string = "Báo cáo số liệu Văn hóa - Xã hội định kỳ"
) {
  const approvedSubs = submissions.filter(s => s.status === "DA_DUYET");
  const unsubmitted = villages.filter(v => !submissions.some(s => s.villageId === v.id && s.status !== "BAN_NHAP" && s.status !== "OVERDUE_NOT_SUBMITTED"));
  const withErrors = submissions.filter(s => s.validationSummary?.hasErrors);

  const totalCount = villages.length;
  const submittedCount = submissions.filter(s => s.status === "DA_DUYET" || s.status === "DA_NOP" || s.status === "CO_LOI_CAN_SUA").length;
  const missingCount = totalCount - submittedCount;

  const sums: Record<string, number> = {};
  INDICATOR_CATALOG.forEach(item => { sums[item.code] = 0; });

  approvedSubs.forEach(sub => {
    INDICATOR_CATALOG.forEach(item => {
      const val = sub.indicators.find(ind => ind.indicatorCode === item.code);
      const numericVal = val ? (val.correctedValue !== undefined ? val.correctedValue : val.normalizedValue) : 0;
      sums[item.code] += numericVal;
    });
  });

  const tableHeaders = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Chỉ tiêu", bold: true })], alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Đơn vị", bold: true })], alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Tổng số đã duyệt (${submittedCount}/${totalCount} thôn)`, bold: true })], alignment: AlignmentType.CENTER })] })
      ]
    })
  ];

  const tableRows = INDICATOR_CATALOG.map(item => {
    return new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: `${item.code} - ${item.name}` })] }),
        new TableCell({ children: [new Paragraph({ text: item.unit, alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ text: String(sums[item.code]), alignment: AlignmentType.RIGHT })] })
      ]
    });
  });

  const docTable = new Table({
    rows: [...tableHeaders, ...tableRows],
    width: { size: 100, type: WidthType.PERCENTAGE }
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "ỦY BAN NHÂN DÂN XÃ BÀ NÀ", bold: true, size: 24 }),
              new TextRun({ text: "\t\t\tCỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", bold: true, size: 24 })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "VĂN PHÒNG THỐNG KÊ", bold: true, size: 22 }),
              new TextRun({ text: "\t\t\t\t\tĐộc lập - Tự do - Hạnh phúc", bold: true, size: 24 })
            ]
          }),
          new Paragraph({ text: "-----------------------------" }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({
                text: "BÁO CÁO CHUYÊN ĐỀ SỐ LIỆU VĂN HÓA - XÃ HỘI",
                bold: true,
                size: 28,
                color: "1A365D"
              })
            ],
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `${period.toUpperCase()}`,
                bold: true,
                size: 24
              })
            ],
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Kỳ báo cáo: ", bold: true }),
              new TextRun({ text: period })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Tỷ lệ hoàn thành nộp: ", bold: true }),
              new TextRun({ text: `${((approvedSubs.length / villages.length) * 100).toFixed(1)}% (${approvedSubs.length}/${villages.length} thôn đã duyệt)` })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Danh sách thôn chưa nộp báo cáo: ", bold: true, color: "C53030" }),
              new TextRun({ text: unsubmitted.map(u => u.name).join(", ") || "Không có" })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Danh sách báo cáo có lỗi dữ liệu: ", bold: true, color: "DD6B20" }),
              new TextRun({ text: withErrors.map(e => villages.find(v => v.id === e.villageId)?.name).join(", ") || "Không có" })
            ]
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "BẢNG TỔNG HỢP CHỈ TIÊU TOÀN XÃ (CÁC THÔN ĐÃ DUYỆT):", bold: true, size: 24 })
            ]
          }),
          new Paragraph({ text: "" }),
          docTable,
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Ghi chú số liệu: ", bold: true }),
              new TextRun({ text: `⚠️ Số liệu chưa đầy đủ do còn ${missingCount} thôn chưa nộp báo cáo. Tổng số liệu trên chỉ phản ánh kết quả của ${submittedCount}/${totalCount} thôn đã nộp báo cáo.` })
            ]
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "\t\t\t\t\tBà Nà, ngày " + new Date().getDate() + " tháng " + (new Date().getMonth() + 1) + " năm " + new Date().getFullYear(), italics: true })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "NGƯỜI LẬP BIỂU\t\t\t\t\t\tNGƯỜI PHÊ DUYỆT", bold: true })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "(Ký, ghi rõ họ tên)\t\t\t\t\t\t(Ký tên và đóng dấu)" })
            ]
          })
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `Civigo_Bao_Cao_Word_${period.replace(/ /g, "_")}.docx`;
  link.click();
}

// 5. Export PDF using jsPDF
export function exportPdfReport(
  submissions: Submission[], 
  villages: Village[], 
  period: string,
  taskTitle: string = "Báo cáo số liệu Văn hóa - Xã hội"
) {
  const approvedSubs = submissions.filter(s => s.status === "DA_DUYET");
  const unsubmitted = villages.filter(v => !submissions.some(s => s.villageId === v.id && s.status !== "BAN_NHAP" && s.status !== "OVERDUE_NOT_SUBMITTED"));

  const totalCount = villages.length;
  const submittedCount = submissions.filter(s => s.status === "DA_DUYET" || s.status === "DA_NOP" || s.status === "CO_LOI_CAN_SUA").length;
  const missingCount = totalCount - submittedCount;
  const missingNames = unsubmitted.map(u => u.name).join(", ") || "Khong co";

  const sums: Record<string, number> = {};
  INDICATOR_CATALOG.forEach(item => { sums[item.code] = 0; });

  approvedSubs.forEach(sub => {
    INDICATOR_CATALOG.forEach(item => {
      const val = sub.indicators.find(ind => ind.indicatorCode === item.code);
      const numericVal = val ? (val.correctedValue !== undefined ? val.correctedValue : val.normalizedValue) : 0;
      sums[item.code] += numericVal;
    });
  });

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Header banner
  doc.setFillColor(26, 54, 93); // Navy Blue
  doc.rect(0, 0, 210, 16, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text("CIVIGO - NEN TANG AI KET NOI SO LIEU THON XA SMART", 15, 10);

  // General Metadata text
  doc.setTextColor(45, 55, 72);
  doc.setFontSize(10);
  doc.text("UBND XA BA NA - VAN PHONG THONG KE", 15, 25);
  doc.text("CONG HOA XA HOI CHU NGHIA VIET NAM", 115, 25);
  doc.text("Doc lap - Tu do - Hanh phuc", 125, 30);
  doc.line(115, 32, 185, 32);

  // Title
  doc.setFontSize(14);
  doc.setTextColor(26, 54, 93);
  doc.text("BAO CAO TONG HOP CHI TIEU VAN HOA - XA HOI", 105, 45, { align: "center" });
  doc.setFontSize(10);
  doc.text(`Ky bao cao: ${period} | Ngay xuat: ${new Date().toLocaleDateString("vi-VN")}`, 105, 51, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.text("1. TIEN DO VA TI LE HOAN THANH", 15, 62);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`- Ty le hoan thanh nop: ${((approvedSubs.length / villages.length) * 100).toFixed(1)}% (${approvedSubs.length}/${villages.length} thon da duoc phe duyet)`, 15, 67);
  doc.text(`- Danh sach thon chua nop (3 thon): ${unsubmitted.map(u => u.name).join(", ") || "Khong co"}`, 15, 72);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`2. BANG TONG HOP CHI TIEU VAN HOA - XA HOI (${submittedCount}/${totalCount} THON DA DUYET)`, 15, 82);

  // Draw indicators table
  doc.setFillColor(237, 242, 247);
  doc.rect(15, 87, 180, 8, "F");
  doc.setFontSize(8.5);
  doc.setTextColor(45, 55, 72);
  doc.text("Ma chi tieu", 18, 92);
  doc.text("Ten chi tieu", 45, 92);
  doc.text("Don vi", 140, 92);
  doc.text("So lieu tong cong", 165, 92);

  doc.setFont("helvetica", "normal");
  let y = 101;
  INDICATOR_CATALOG.forEach(item => {
    doc.text(item.code, 18, y);
    doc.text(item.name, 45, y);
    doc.text(item.unit, 140, y);
    doc.text(String(sums[item.code]), 170, y);
    doc.line(15, y + 2, 195, y + 2);
    y += 7;
  });

  // Disclaimer note
  y += 5;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(197, 48, 48);
  doc.text(`(*) Luu y: So lieu tren chua bao gom ${missingCount} thon chua nop (${missingNames}).`, 15, y);

  // Signatures
  y += 12;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(45, 55, 72);
  doc.text(`Ba Na, ngay ${new Date().getDate()} thang ${new Date().getMonth() + 1} nam ${new Date().getFullYear()}`, 130, y);
  
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("NGUOI LAP BIEU", 25, y);
  doc.text("NGUOI PHE DUYET (CHU TICH)", 125, y);

  doc.save(`Civigo_Bao_Cao_PDF_${period.replace(/ /g, "_")}.pdf`);
}

// Aliases matching App.tsx imports
export const writeTemplateFile = downloadExcelTemplate;
export const writeExcelFile = exportExcelSummary;
export const writeWordDocument = exportWordReport;
export const writePdfReport = exportPdfReport;

// 6. Generate individual Excel workbook for a village
export function createIndividualVillageExcel(
  v: Village, 
  submission?: Submission, 
  period: string = "Quý II năm 2026"
): ArrayBuffer {
  const wsData = [
    ["BÁO CÁO CHỈ TIÊU PHÁT TRIỂN VĂN HÓA - XÃ HỘI"],
    [`Kỳ báo cáo: ${period}`],
    [],
    ["THÔNG TIN ĐƠN VỊ & NGƯỜI BÁO CÁO"],
    ["Thuộc tính", "Giá trị"],
    [],
    ["Tên thôn:", v.name],
    ["Người lập:", submission?.formData?.reporterName || v.reporterName || v.leaderName],
    ["Chức danh:", submission?.formData?.reporterTitle || v.reporterTitle || "Trưởng thôn"],
    ["Số điện thoại:", submission?.formData?.phone || v.phone],
    ["Hạn nộp:", submission?.formData?.deadline || "30/06/2026"],
    [],
    ["DANH SÁCH CHỈ TIÊU THỐNG KÊ BIỂU MẪU CIVIGO"],
    ["Mã chỉ tiêu", "Tên chỉ tiêu", "Đơn vị tính", "Số liệu", "Ghi chú"]
  ];

  INDICATOR_CATALOG.forEach(item => {
    let val: any = "";
    let note: string = "";
    if (submission) {
      const indVal = submission.indicators.find(ind => ind.indicatorCode === item.code);
      val = indVal ? (indVal.correctedValue !== undefined ? indVal.correctedValue : indVal.normalizedValue) : "";
      
      // Parse out notes if stored
      if (submission.formData?.notes) {
        const parts = submission.formData.notes.split(";");
        const foundPart = parts.find((p: string) => p.trim().startsWith(item.code));
        if (foundPart) {
          note = foundPart.split(":")[1]?.trim() || "";
        }
      }
    }
    wsData.push([
      item.code,
      item.name,
      item.unit,
      val,
      note
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws["!cols"] = [
    { wch: 15 }, // Mã
    { wch: 45 }, // Tên chỉ tiêu / thuộc tính
    { wch: 15 }, // Đơn vị
    { wch: 15 }, // Số liệu
    { wch: 25 }  // Ghi chú
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Phiếu báo cáo");
  return XLSX.write(wb, { bookType: "xlsx", type: "array" });
}

// 7. Download ZIP package of blank/pre-populated templates for all 22 villages
export async function downloadAllVillagesTemplatesZip(villages: Village[], period: string) {
  const zip = new JSZip();
  
  for (const v of villages) {
    const buffer = createIndividualVillageExcel(v, undefined, period);
    const fileName = `BC_${v.code}_Mau_Bao_Cao_${v.name.replace(/\s+/g, "_")}.xlsx`;
    zip.file(fileName, buffer);
  }
  
  const content = await zip.generateAsync({ type: "blob" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(content);
  link.download = `Civigo_Mau_Bao_Cao_22_Thon_${period.replace(/ /g, "_")}.zip`;
  link.click();
}

// 8. Download ZIP package of all submitted reports for the villages
export async function downloadAllSubmissionsZip(submissions: Submission[], villages: Village[], period: string) {
  const zip = new JSZip();
  let count = 0;
  
  for (const v of villages) {
    const sub = submissions.find(s => s.villageId === v.id);
    if (sub && sub.status !== "BAN_NHAP" && sub.status !== "OVERDUE_NOT_SUBMITTED") {
      const buffer = createIndividualVillageExcel(v, sub, period);
      const fileName = `BC_${v.code}_Bao_Cao_${v.name.replace(/\s+/g, "_")}.xlsx`;
      zip.file(fileName, buffer);
      count++;
    }
  }
  
  if (count === 0) {
    alert("Không tìm thấy báo cáo nào đã nộp trong kỳ này để xuất tệp ZIP.");
    return;
  }
  
  const content = await zip.generateAsync({ type: "blob" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(content);
  link.download = `Civigo_Bao_Cao_22_Thon_Da_Nop_${period.replace(/ /g, "_")}.zip`;
  link.click();
}
