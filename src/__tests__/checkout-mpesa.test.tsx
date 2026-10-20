import { describe, it, expect } from "vitest"

describe("M-Pesa STK Push Normalization & Payload Rules", () => {
  function normalizeMpesaPhone(raw: string): string {
    const digits = raw.trim().replace(/\D/g, "")
    if (digits.startsWith("254") && digits.length === 12) {
      return digits
    }
    if (digits.startsWith("0") && digits.length === 10) {
      return "254" + digits.slice(1)
    }
    if (digits.length === 9 && (digits.startsWith("7") || digits.startsWith("1"))) {
      return "254" + digits
    }
    return digits
  }

  function isValidMpesaFormat(formatted: string): boolean {
    return /^254[17]\d{8}$/.test(formatted)
  }

  it("correctly normalizes various Kenyan phone formats to 2547XXXXXXXX or 2541XXXXXXXX", () => {
    // 07 format
    expect(normalizeMpesaPhone("0712345678")).toBe("254712345678")
    expect(isValidMpesaFormat(normalizeMpesaPhone("0712345678"))).toBe(true)

    // 01 format (Airtel / new Safaricom range)
    expect(normalizeMpesaPhone("0112345678")).toBe("254112345678")
    expect(isValidMpesaFormat(normalizeMpesaPhone("0112345678"))).toBe(true)

    // +254 format with spaces
    expect(normalizeMpesaPhone("+254 712 345 678")).toBe("254712345678")
    expect(isValidMpesaFormat(normalizeMpesaPhone("+254 712 345 678"))).toBe(true)

    // 9 digit format
    expect(normalizeMpesaPhone("712345678")).toBe("254712345678")
    expect(isValidMpesaFormat(normalizeMpesaPhone("712345678"))).toBe(true)

    expect(normalizeMpesaPhone("112345678")).toBe("254112345678")
    expect(isValidMpesaFormat(normalizeMpesaPhone("112345678"))).toBe(true)
  })

  it("constructs compliant M-Pesa STK push payload structure", () => {
    const rawPhone = "0712 345 678"
    const bookingUuid = "3f42b3a0-8025-4fc1-a8cf-3081127e7f6e"
    const totalAmount = 35

    const payload = {
      phone: normalizeMpesaPhone(rawPhone),
      amount: Number(totalAmount),
      reference: bookingUuid,
    }

    expect(payload).toEqual({
      phone: "254712345678",
      amount: 35,
      reference: "3f42b3a0-8025-4fc1-a8cf-3081127e7f6e",
    })
    expect(typeof payload.amount).toBe("number")
    expect(payload.phone).toMatch(/^254[17]\d{8}$/)
  })
})
