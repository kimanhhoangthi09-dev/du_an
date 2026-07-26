/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ValidationIssue, Severity } from "../types";

export const INDICATOR_CATALOG = [
  { code: "CT01", name: "Tổng số hộ dân", unit: "Hộ", dataType: "integer", required: true, minValue: 0 },
  { code: "CT02", name: "Tổng số nhân khẩu", unit: "Người", dataType: "integer", required: true, minValue: 0 },
  { code: "CT03", name: "Số hộ nghèo", unit: "Hộ", dataType: "integer", required: true, minValue: 0 },
  { code: "CT04", name: "Số hộ cận nghèo", unit: "Hộ", dataType: "integer", required: true, minValue: 0 },
  { code: "CT05", name: "Số người có công với cách mạng", unit: "Người", dataType: "integer", required: true, minValue: 0 },
  { code: "CT06", name: "Số đối tượng bảo trợ xã hội đang hưởng trợ cấp", unit: "Người", dataType: "integer", required: true, minValue: 0 },
  { code: "CT07", name: "Số trẻ em dưới 16 tuổi", unit: "Người", dataType: "integer", required: true, minValue: 0 },
  { code: "CT08", name: "Số trẻ em có hoàn cảnh đặc biệt", unit: "Người", dataType: "integer", required: true, minValue: 0 },
  { code: "CT09", name: "Số hộ đạt “Gia đình văn hóa”", unit: "Hộ", dataType: "integer", required: true, minValue: 0 },
  { code: "CT10", name: "Số người trong độ tuổi lao động", unit: "Người", dataType: "integer", required: true, minValue: 0 },
  { code: "CT11", name: "Số người tham gia BHYT", unit: "Người", dataType: "integer", required: true, minValue: 0 },
  { code: "CT12", name: "Số thành viên Tổ Công nghệ số cộng đồng", unit: "Người", dataType: "integer", required: true, minValue: 0 },
  { code: "CT13", name: "Số người dân được hướng dẫn dùng dịch vụ công trực tuyến trong kỳ", unit: "Người", dataType: "integer", required: true, minValue: 0 },
  { code: "CT14", name: "Số vụ bạo lực gia đình ghi nhận trong kỳ", unit: "Vụ", dataType: "integer", required: true, minValue: 0 }
];

export const oldFieldToCodeMap: Record<string, string> = {
  totalHouseholds: "CT01",
  totalPopulation: "CT02",
  poorHouseholds: "CT03",
  nearPoorHouseholds: "CT04",
  childrenUnder16: "CT07",
  elderlyOver60: "CT06" // map to closest
};

export const codeToOldFieldMap: Record<string, string> = {
  CT01: "totalHouseholds",
  CT02: "totalPopulation",
  CT03: "poorHouseholds",
  CT04: "nearPoorHouseholds",
  CT07: "childrenUnder16",
  CT06: "elderlyOver60"
};

/**
 * Checks if a string representation of a number is ambiguous,
 * e.g., "2.450" (could be 2.45 or 2450).
 */
export function isAmbiguousNumber(value: any): boolean {
  if (value === undefined || value === null) return false;
  const str = String(value).trim();
  // Match patterns like "2.450" or "2,450" (digits followed by dot/comma followed by exactly 3 digits)
  // which are highly ambiguous in Vietnamese contexts (thousands vs decimal separator)
  return /^\d+[\.,]\d{3}$/.test(str);
}

/**
 * Normalizes a value from Excel or input.
 * If ambiguous, we keep it as is until verified.
 * Otherwise, strip dots if they are thousands separators, or convert to number.
 */
export function normalizeValue(val: any): { numericValue: number; status: "VALID" | "AMBIGUOUS" | "ERROR"; errorMsg?: string } {
  if (val === undefined || val === null || String(val).trim() === "") {
    return { numericValue: 0, status: "ERROR", errorMsg: "Giá trị trống" };
  }

  const str = String(val).trim();

  if (isAmbiguousNumber(str)) {
    return { numericValue: NaN, status: "AMBIGUOUS", errorMsg: "Mơ hồ về định dạng số" };
  }

  // If it's a normal Vietnamese number with dots, like 1.234.567 or similar, or 1234
  // If there are multiple dots, it's definitely a thousands separator.
  // If there is a single dot but not followed by 3 digits, we can treat as decimal or throw.
  let cleaned = str;
  if (/^\d{1,3}(\.\d{3})+$/.test(str)) {
    // Vietnamese dotted thousands: e.g. 1.234 or 1.234.567
    cleaned = str.replace(/\./g, "");
  } else if (/^\d{1,3}(,\d{3})+$/.test(str)) {
    // English comma thousands: e.g. 1,234
    cleaned = str.replace(/,/g, "");
  } else if (str.includes(",") && !str.includes(".")) {
    // Vietnamese decimal comma, e.g. "12,5" -> "12.5"
    cleaned = str.replace(",", ".");
  }

  const num = Number(cleaned);
  if (isNaN(num)) {
    return { numericValue: NaN, status: "ERROR", errorMsg: "Không phải định dạng số" };
  }

  return { numericValue: num, status: "VALID" };
}

interface ValidationOptions {
  activeDigitalTeamMemberCount?: number;
  activeOnlineSupportCitizenCount?: number;
}

export function validateReport(
  formData: Record<string, any>, // should map code (e.g. "CT01") or old fields to values
  previousData?: Record<string, any>,
  submissionId: string = "temp",
  options: ValidationOptions = {}
): { issues: ValidationIssue[]; severity: Severity } {
  const issues: ValidationIssue[] = [];

  // 1. Build values normalized map
  const values: Record<string, number> = {};
  const rawValues: Record<string, any> = {};

  // Map old keys to codes if present
  const unifiedData: Record<string, any> = {};
  INDICATOR_CATALOG.forEach(item => {
    let rawVal = formData[item.code];
    if (rawVal === undefined) {
      const oldField = codeToOldFieldMap[item.code];
      if (oldField && formData[oldField] !== undefined) {
        rawVal = formData[oldField];
      }
    }
    unifiedData[item.code] = rawVal;
    rawValues[item.code] = rawVal;
  });

  // Check general metadata
  if (!formData.reporterName || String(formData.reporterName).trim() === "") {
    issues.push({
      id: `vi-reporter-${Math.random()}`,
      submissionId,
      field: "reporterName",
      value: "",
      type: "REQUIRED",
      severity: Severity.ERROR,
      message: "Họ tên người lập báo cáo không được để trống.",
      suggestion: "Vui lòng nhập họ tên người lập báo cáo.",
      resolved: false
    });
  }

  if (formData.phone && !/^(03|05|07|08|09)\d{8}$/.test(String(formData.phone).trim())) {
    issues.push({
      id: `vi-phone-${Math.random()}`,
      submissionId,
      field: "phone",
      value: formData.phone,
      type: "FORMAT",
      severity: Severity.ERROR,
      message: `Số điện thoại người lập báo cáo (${formData.phone}) không đúng định dạng di động Việt Nam.`,
      suggestion: "Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 03, 05, 07, 08, hoặc 09.",
      resolved: false
    });
  }

  // Validate each indicator in unifiedData
  INDICATOR_CATALOG.forEach(item => {
    const rawVal = unifiedData[item.code];

    if (rawVal === undefined || rawVal === null || String(rawVal).trim() === "") {
      issues.push({
        id: `vi-${item.code}-${Math.random()}`,
        submissionId,
        field: item.code,
        value: "",
        type: "REQUIRED",
        severity: Severity.ERROR,
        message: `Chỉ tiêu ${item.code} (${item.name}) không được để trống.`,
        suggestion: `Vui lòng bổ sung số liệu cho chỉ tiêu ${item.name}.`,
        resolved: false
      });
      return;
    }

    // Check ambiguous format, e.g., "2.450"
    if (isAmbiguousNumber(rawVal)) {
      issues.push({
        id: `vi-${item.code}-ambiguous-${Math.random()}`,
        submissionId,
        field: item.code,
        value: String(rawVal),
        type: "AMBIGUOUS_NUMBER",
        severity: Severity.ERROR,
        message: `Giá trị “${rawVal}” tại chỉ tiêu ${item.code} (${item.name}) có định dạng mơ hồ (có dấu phân tách chữ số dễ nhầm lẫn).`,
        suggestion: `Vui lòng sửa thành giá trị rõ ràng (ví dụ: nhập hẳn "2450" hoặc chọn xác nhận số chính xác).`,
        resolved: false
      });
      return;
    }

    const { numericValue, status, errorMsg } = normalizeValue(rawVal);

    if (status === "ERROR") {
      issues.push({
        id: `vi-${item.code}-format-${Math.random()}`,
        submissionId,
        field: item.code,
        value: String(rawVal),
        type: "FORMAT",
        severity: Severity.ERROR,
        message: `Chỉ tiêu ${item.code} (${item.name}) chứa giá trị không hợp lệ: "${rawVal}". ${errorMsg || ""}.`,
        suggestion: `Vui lòng nhập một số nguyên không âm hợp lệ.`,
        resolved: false
      });
      return;
    }

    // Check bounds
    if (numericValue < 0) {
      issues.push({
        id: `vi-${item.code}-negative-${Math.random()}`,
        submissionId,
        field: item.code,
        value: numericValue,
        type: "FORMAT",
        severity: Severity.ERROR,
        message: `Chỉ tiêu ${item.code} (${item.name}) không được là số âm: ${numericValue}.`,
        suggestion: `Vui lòng nhập giá trị không âm.`,
        resolved: false
      });
      return;
    }

    if (!Number.isInteger(numericValue)) {
      issues.push({
        id: `vi-${item.code}-decimal-${Math.random()}`,
        submissionId,
        field: item.code,
        value: numericValue,
        type: "FORMAT",
        severity: Severity.ERROR,
        message: `Chỉ tiêu ${item.code} (${item.name}) phải là số nguyên: ${numericValue}.`,
        suggestion: `Vui lòng làm tròn thành số nguyên.`,
        resolved: false
      });
      return;
    }

    values[item.code] = numericValue;
  });

  // If there are any primary format errors, stop and return
  if (issues.some(i => i.severity === Severity.ERROR)) {
    return { issues, severity: Severity.ERROR };
  }

  // 2. LOGIC RULE CHECKS BETWEEN INDICATORS
  const getVal = (code: string) => values[code] ?? 0;

  const ct01 = getVal("CT01"); // Hộ dân
  const ct02 = getVal("CT02"); // Nhân khẩu
  const ct03 = getVal("CT03"); // Hộ nghèo
  const ct04 = getVal("CT04"); // Hộ cận nghèo
  const ct07 = getVal("CT07"); // Trẻ em <16
  const ct08 = getVal("CT08"); // Trẻ em hoàn cảnh đặc biệt
  const ct09 = getVal("CT09"); // Gia đình văn hóa
  const ct10 = getVal("CT10"); // Lao động
  const ct11 = getVal("CT11"); // BHYT
  const ct12 = getVal("CT12"); // Tổ CNS
  const ct13 = getVal("CT13"); // DVC trực tuyến

  // CT02/CT01 ratio [3, 4.5]
  if (ct01 > 0) {
    const ratio = ct02 / ct01;
    if (ratio < 3 || ratio > 4.5) {
      issues.push({
        id: `vi-ratio-ct02-ct01-${Math.random()}`,
        submissionId,
        field: "CT02",
        value: ct02,
        type: "ANOMALY",
        severity: Severity.WARNING,
        message: `Tỷ lệ nhân khẩu/hộ dân bất thường: ${(ratio).toFixed(2)} người/hộ (thông thường từ 3.0 đến 4.5).`,
        suggestion: `Vui lòng rà soát lại Tổng số nhân khẩu (${ct02}) và Tổng số hộ dân (${ct01}). Nhập lý do giải trình để bỏ qua.`,
        resolved: false
      });
    }
  }

  // CT03 <= CT01
  if (ct03 > ct01) {
    issues.push({
      id: `vi-ct03-ct01-${Math.random()}`,
      submissionId,
      field: "CT03",
      value: ct03,
      type: "LOGIC",
      severity: Severity.ERROR,
      message: `Số hộ nghèo (${ct03}) không được lớn hơn tổng số hộ dân (${ct01}).`,
      suggestion: `Vui lòng sửa đổi chỉ số hộ nghèo hoặc tổng số hộ dân để đảm bảo tính nhất quán.`,
      resolved: false
    });
  }

  // CT04 <= CT01
  if (ct04 > ct01) {
    issues.push({
      id: `vi-ct04-ct01-${Math.random()}`,
      submissionId,
      field: "CT04",
      value: ct04,
      type: "LOGIC",
      severity: Severity.ERROR,
      message: `Số hộ cận nghèo (${ct04}) không được lớn hơn tổng số hộ dân (${ct01}).`,
      suggestion: `Vui lòng sửa đổi chỉ số hộ cận nghèo.`,
      resolved: false
    });
  }

  // CT03 + CT04 <= CT01
  if (ct03 + ct04 > ct01) {
    issues.push({
      id: `vi-ct034-ct01-${Math.random()}`,
      submissionId,
      field: "CT03",
      value: ct03 + ct04,
      type: "LOGIC",
      severity: Severity.ERROR,
      message: `Tổng số hộ nghèo & cận nghèo (${ct03 + ct04}) vượt quá tổng số hộ dân (${ct01}).`,
      suggestion: `Vui lòng rà soát và cân đối lại hộ nghèo và hộ cận nghèo.`,
      resolved: false
    });
  }

  // CT07 <= CT02
  if (ct07 > ct02) {
    issues.push({
      id: `vi-ct07-ct02-${Math.random()}`,
      submissionId,
      field: "CT07",
      value: ct07,
      type: "LOGIC",
      severity: Severity.ERROR,
      message: `Số trẻ em dưới 16 tuổi (${ct07}) lớn hơn tổng số nhân khẩu (${ct02}).`,
      suggestion: `Vui lòng sửa lại số trẻ em hoặc tổng nhân khẩu.`,
      resolved: false
    });
  }

  // CT08 <= CT07
  if (ct08 > ct07) {
    issues.push({
      id: `vi-ct08-ct07-${Math.random()}`,
      submissionId,
      field: "CT08",
      value: ct08,
      type: "LOGIC",
      severity: Severity.ERROR,
      message: `Số trẻ em có hoàn cảnh đặc biệt (${ct08}) lớn hơn tổng số trẻ em dưới 16 tuổi (${ct07}).`,
      suggestion: `Vui lòng điều chỉnh lại số trẻ em hoàn cảnh đặc biệt hoặc tổng số trẻ em.`,
      resolved: false
    });
  }

  // CT09 <= CT01
  if (ct09 > ct01) {
    issues.push({
      id: `vi-ct09-ct01-${Math.random()}`,
      submissionId,
      field: "CT09",
      value: ct09,
      type: "LOGIC",
      severity: Severity.ERROR,
      message: `Số hộ đạt “Gia đình văn hóa” (${ct09}) vượt quá tổng số hộ dân (${ct01}).`,
      suggestion: `Số gia đình văn hóa tối đa chỉ bằng tổng số hộ dân.`,
      resolved: false
    });
  }

  // CT10 <= CT02
  if (ct10 > ct02) {
    issues.push({
      id: `vi-ct10-ct02-${Math.random()}`,
      submissionId,
      field: "CT10",
      value: ct10,
      type: "LOGIC",
      severity: Severity.ERROR,
      message: `Số người trong độ tuổi lao động (${ct10}) lớn hơn tổng số nhân khẩu (${ct02}).`,
      suggestion: `Vui lòng sửa đổi lại số lao động.`,
      resolved: false
    });
  }

  // CT11 <= CT02
  if (ct11 > ct02) {
    issues.push({
      id: `vi-ct11-ct02-${Math.random()}`,
      submissionId,
      field: "CT11",
      value: ct11,
      type: "LOGIC",
      severity: Severity.ERROR,
      message: `Số người tham gia BHYT (${ct11}) lớn hơn tổng số nhân khẩu (${ct02}).`,
      suggestion: `Vui lòng sửa đổi số tham gia BHYT không vượt quá dân số thôn.`,
      resolved: false
    });
  }

  // CT12 vs digital team members count (warning if mismatch)
  if (options.activeDigitalTeamMemberCount !== undefined && ct12 !== options.activeDigitalTeamMemberCount) {
    issues.push({
      id: `vi-ct12-team-${Math.random()}`,
      submissionId,
      field: "CT12",
      value: ct12,
      type: "ANOMALY",
      severity: Severity.WARNING,
      message: `Số thành viên Tổ CNS (${ct12}) không khớp với danh sách thành viên thực tế của Tổ đang hoạt động tại thôn (${options.activeDigitalTeamMemberCount}).`,
      suggestion: `Vui lòng đối chiếu với dữ liệu hoạt động Tổ CNS hoặc điều chỉnh giá trị nhập tay.`,
      resolved: false
    });
  }

  // CT13 vs support requests completed in period (warning if mismatch)
  if (options.activeOnlineSupportCitizenCount !== undefined && ct13 !== options.activeOnlineSupportCitizenCount) {
    issues.push({
      id: `vi-ct13-support-${Math.random()}`,
      submissionId,
      field: "CT13",
      value: ct13,
      type: "ANOMALY",
      severity: Severity.WARNING,
      message: `Số người dân hướng dẫn DVC trực tuyến (${ct13}) khác với số lượng người dân duy nhất ghi nhận trên hệ thống hỗ trợ Tổ CNS (${options.activeOnlineSupportCitizenCount}).`,
      suggestion: `Vui lòng rà soát lại số liệu người dân thực tế đã hỗ trợ DVC.`,
      resolved: false
    });
  }

  // 3. ANOMALY DETECTION ±30% AGAINST PREVIOUS PERIOD
  if (previousData) {
    INDICATOR_CATALOG.forEach(item => {
      let prevValRaw = previousData[item.code];
      if (prevValRaw === undefined) {
        const oldField = codeToOldFieldMap[item.code];
        if (oldField && previousData[oldField] !== undefined) {
          prevValRaw = previousData[oldField];
        }
      }
      
      const prevVal = Number(prevValRaw);
      const curVal = getVal(item.code);

      if (prevVal > 0 && item.code !== "CT14") { // ignore CT14 domestic violence for 30% warning as it's typically very small or zero
        const diff = Math.abs((curVal - prevVal) / prevVal);
        if (diff > 0.3) {
          const percent = (diff * 100).toFixed(1);
          const direction = curVal > prevVal ? "tăng" : "giảm";
          issues.push({
            id: `vi-${item.code}-growth-${Math.random()}`,
            submissionId,
            field: item.code,
            value: curVal,
            type: "ANOMALY",
            severity: Severity.WARNING,
            message: `Chỉ tiêu ${item.code} (${item.name}) biến động ${direction} lớn (${percent}%) so với kỳ trước (${prevVal} ${item.unit}). Vượt ngưỡng 30%.`,
            suggestion: `Vui lòng nhập giải trình lý do biến động ở ô Ghi chú để gửi duyệt.`,
            resolved: false
          });
        }
      }
    });
  }

  let finalSeverity = Severity.VALID;
  if (issues.some(i => i.severity === Severity.ERROR)) {
    finalSeverity = Severity.ERROR;
  } else if (issues.some(i => i.severity === Severity.WARNING)) {
    finalSeverity = Severity.WARNING;
  }

  return { issues, severity: finalSeverity };
}
