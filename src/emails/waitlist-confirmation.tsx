import * as React from 'react';

interface WaitlistConfirmationEmailProps {
 name: string;
}

export const WaitlistConfirmationEmail: React.FC<WaitlistConfirmationEmailProps> = ({
 name,
}) => (
 <html>
 <head>
 <meta charSet="UTF-8" />
 <meta name="viewport" content="width=device-width, initial-scale=1.0" />
 <title>Welcome to Ausaguide</title>
 </head>
 <body style={{
 margin: 0,
 padding: 0,
 fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
 backgroundColor: '#f9fafb',
 }}>
 <table align="center" border={0} cellPadding={0} cellSpacing={0} width="100%" style={{
 maxWidth: 600,
 margin: '40px auto',
 backgroundColor: '#ffffff',
 borderRadius: 16,
 boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
 }}>
 <tr>
 <td style={{ padding: '48px 40px' }}>
 {/* Logo */}
 <table width="100%" cellPadding={0} cellSpacing={0} border={0}>
 <tr>
 <td style={{ paddingBottom: 32, borderBottom: '1px solid #f0f0f0' }}>
 <span style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.5px' }}>
 AUSAGUIDE
 </span>
 </td>
 </tr>
 </table>

 {/* Greeting */}
 <h1 style={{ fontSize: 28, fontWeight: 600, color: '#1a1a1a', margin: '32px 0 8px 0', letterSpacing: '-0.5px' }}>
 Welcome to the community.
 </h1>
 <p style={{ fontSize: 18, color: '#4b5563', lineHeight: 1.6, margin: '8px 0 24px 0' }}>
 You're officially on the Ausaguide waitlist, {name}.
 </p>

 <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', margin: '24px 0' }} />

 {/* What happens next */}
 <p style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', margin: '0 0 16px 0' }}>
 What happens next:
 </p>
 <table width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ marginBottom: 24 }}>
 <tr>
 <td style={{ padding: '8px 0', fontSize: 15, color: '#4b5563', lineHeight: 1.5 }}>
 <span style={{ display: 'inline-block', width: 20, color: '#10b981', fontWeight: 700 }}>◆</span>
 Notified when we launch on <strong>October 10, 2026</strong>
 </td>
 </tr>
 <tr>
 <td style={{ padding: '8px 0', fontSize: 15, color: '#4b5563', lineHeight: 1.5 }}>
 <span style={{ display: 'inline-block', width: 20, color: '#10b981', fontWeight: 700 }}>◆</span>
 Early access to Kenya's best local experiences
 </td>
 </tr>
 <tr>
 <td style={{ padding: '8px 0', fontSize: 15, color: '#4b5563', lineHeight: 1.5 }}>
 <span style={{ display: 'inline-block', width: 20, color: '#10b981', fontWeight: 700 }}>◆</span>
 Exclusive launch discount for waitlist members
 </td>
 </tr>
 </table>

 <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', margin: '24px 0' }} />

 {/* CTA Section */}
 <p style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', margin: '0 0 8px 0' }}>
 While you wait, explore what's coming:
 </p>
 <table width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ margin: '20px 0 8px 0' }}>
 <tr>
 <td align="center">
 <a href="https://ausaguide.com" style={{
 display: 'inline-block',
 backgroundColor: '#1a1a1a',
 color: '#ffffff',
 fontSize: 16,
 fontWeight: 600,
 textDecoration: 'none',
 padding: '14px 40px',
 borderRadius: 8,
 letterSpacing: '0.3px',
 }}>
 Continue Exploring
 </a>
 </td>
 </tr>
 </table>

 <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', margin: '32px 0 24px 0' }} />

 {/* Share Section */}
 <p style={{ fontSize: 14, color: '#9ca3af', margin: '0 0 8px 0', textAlign: 'center' }}>
 Share the waitlist with friends
 </p>
 <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', margin: 0 }}>
 <a href="https://ausaguide.com/waitlist" style={{ color: '#1a1a1a', textDecoration: 'underline' }}>
 https://ausaguide.com/waitlist
 </a>
 </p>

 <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', margin: '32px 0 24px 0' }} />

 {/* Footer */}
 <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', margin: '0 0 4px 0', lineHeight: 1.6 }}>
 Ausaguide — Be a Local. Share Your World.
 </p>
 </td>
 </tr>
 </table>
 </body>
 </html>
);

export default WaitlistConfirmationEmail;
