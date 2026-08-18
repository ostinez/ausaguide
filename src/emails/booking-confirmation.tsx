// ============================================================
// Ausaguide Booking Confirmation Email Template
// ============================================================

export interface BookingConfirmationEmailProps {
  name: string
  bookingId?: string
  tourTitle?: string
  date?: string
  price?: string
}

export function BookingConfirmationEmail({
  name,
  tourTitle,
  date,
  price,
}: BookingConfirmationEmailProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Booking Confirmed — Ausaguide</title>
      </head>
      <body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#f9fafb", padding: "20px", margin: 0 }}>
        <table align="center" style={{ maxWidth: "600px", width: "100%", backgroundColor: "#ffffff", borderRadius: "16px", padding: "40px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <tbody>
            <tr>
              <td>
                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                  <img src="https://ausaguide.com/logo-primary.png" alt="Ausaguide" style={{ height: "36px", width: "auto" }} />
                </div>

                <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#1a1a1a", margin: "0 0 8px 0", textAlign: "center" }}>
                  Booking Confirmed!
                </h1>
                <p style={{ fontSize: "16px", color: "#4b5563", margin: "0 0 24px 0", textAlign: "center" }}>
                  Hi {name}, your booking {tourTitle ? `for "${tourTitle}"` : ""} has been confirmed by your host.
                </p>

                {(date || price) && (
                  <div style={{ backgroundColor: "#f3f4f6", padding: "16px", borderRadius: "12px", margin: "20px 0" }}>
                    {date && (
                      <p style={{ margin: "4px 0", fontSize: "14px", color: "#374151" }}>
                        <strong>Date:</strong> {date}
                      </p>
                    )}
                    {price && (
                      <p style={{ margin: "4px 0", fontSize: "14px", color: "#059669" }}>
                        <strong>Total:</strong> {price}
                      </p>
                    )}
                  </div>
                )}

                <hr style={{ border: "none", borderTop: "1px solid #f0f0f0", margin: "24px 0" }} />

                {/* Dashboard Button */}
                <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ margin: "20px 0" }}>
                  <tbody>
                    <tr>
                      <td align="center">
                        <a
                          href="https://ausaguide.com/dashboard"
                          style={{
                            display: "inline-block",
                            backgroundColor: "#0D6F73",
                            color: "#ffffff",
                            fontSize: "16px",
                            fontWeight: 600,
                            textDecoration: "none",
                            padding: "14px 40px",
                            borderRadius: "8px",
                            boxShadow: "0 2px 8px rgba(13, 111, 115, 0.3)",
                          }}
                        >
                          Go to Dashboard →
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <p style={{ fontSize: "14px", color: "#6b7280", textAlign: "center", margin: "20px 0 0 0" }}>
                  <a href="https://ausaguide.com/messages" style={{ color: "#0D6F73", textDecoration: "underline", fontWeight: 600 }}>
                    Open Messages & Video Room
                  </a>
                </p>

                <hr style={{ border: "none", borderTop: "1px solid #f0f0f0", margin: "24px 0" }} />

                <p style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center", margin: 0 }}>
                  Ausaguide — Be a Local. Share Your World.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  )
}

export default BookingConfirmationEmail
