// File: src/utils/validationHelper.test.ts

import { isValidEmail } from "./validationHelper";

describe("Validation Helper - Hàm isValidEmail", () => {
  // Trường hợp 1: Test với dữ liệu CHUẨN (Happy Path)
  it("Nên trả về true với email hợp lệ", () => {
    const result = isValidEmail("admin@gmail.com");
    expect(result).toBe(true); // Kỳ vọng kết quả phải là true
  });

  // Trường hợp 2: Test với dữ liệu SAI (Unhappy Path)
  it("Nên trả về false nếu email thiếu chữ @", () => {
    const result = isValidEmail("admingmail.com");
    expect(result).toBe(false); // Kỳ vọng hệ thống phải phát hiện sai và trả về false
  });

  // Trường hợp 3: Test với dữ liệu CỰC ĐOAN (Edge Case)
  it("Nên trả về false nếu truyền vào chuỗi rỗng", () => {
    const result = isValidEmail("");
    expect(result).toBe(false);
  });
});
