/**
 * Paystack Frontend Integration Helper
 */

declare global {
 interface Window {
 PaystackPop?: {
 setup: (options: PaystackOptions) => {
 openIframe: () => void
 }
 }
 }
}

export interface PaystackOptions {
 key: string
 email: string
 amount: number // in subunits e.g. kobo or cents (amount * 100)
 currency?: string
 ref?: string
 metadata?: Record<string, any>
 callback?: (response: { reference: string; status: string; trans: string; message: string }) => void
 onClose?: () => void
}

/**
 * Dynamically loads the Paystack Inline JS script if not already present.
 */
export function loadPaystackScript(): Promise<boolean> {
 return new Promise((resolve) => {
 if (window.PaystackPop) {
 resolve(true)
 return
 }

 const script = document.createElement("script")
 script.src = "https://js.paystack.co/v1/inline.js"
 script.async = true
 script.onload = () => resolve(true)
 script.onerror = () => resolve(false)
 document.body.appendChild(script)
 })
}

/**
 * Opens Paystack Inline Popup Payment
 */
export async function initializePaystackPayment(options: PaystackOptions): Promise<boolean> {
 const loaded = await loadPaystackScript()
 if (!loaded || !window.PaystackPop) {
 console.error("Failed to load Paystack Inline JS script")
 return false
 }

 const handler = window.PaystackPop.setup(options)
 handler.openIframe()
 return true
}
