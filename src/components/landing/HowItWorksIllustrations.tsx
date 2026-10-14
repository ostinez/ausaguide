
// Exact brand colors required:
// Deep teal: #0A5F5F
// Warm orange: #E87A3D
// White: #FFFFFF
// Light cream: #F5F1EA
// Supporting palette: #113B3A, #184948, #235E5D, #B7E6E5, #00A34F (M-Pesa)

interface IllustrationProps {
  className?: string
}

/* ─────────────────────────────────────────────────────────────────────────────
   TRAVELER ILLUSTRATIONS (1 - 6)
───────────────────────────────────────────────────────────────────────────── */

// Step 1: Search real experiences
export function TravelerSearchIllustration({ className = "" }: IllustrationProps) {
  return (
    <div className={`w-full h-full bg-[#0c1f1f] text-white flex flex-col p-4 select-none relative overflow-hidden ${className}`}>
      {/* Phone Header / Status Bar */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-[#B7E6E5] pb-3 border-b border-[#235E5D]/40">
        <span className="font-mono">09:41</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] bg-[#0A5F5F] px-1.5 py-0.5 rounded text-[#F5F1EA] font-bold">5G</span>
          <div className="w-4 h-2 rounded-sm border border-[#B7E6E5] p-0.5 flex items-center">
            <div className="w-full h-full bg-[#E87A3D] rounded-xs" />
          </div>
        </div>
      </div>

      {/* Brand Mini Header */}
      <div className="pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-[#E87A3D] flex items-center justify-center font-black text-white text-xs">
            A
          </div>
          <div>
            <div className="text-xs font-bold text-[#F5F1EA]">Ausaguide Kenya</div>
            <div className="text-[10px] text-[#B7E6E5]/70 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>42 Hosts Live Now</span>
            </div>
          </div>
        </div>
        <span className="text-[10px] font-bold bg-[#E87A3D]/20 text-[#E87A3D] border border-[#E87A3D]/40 px-2 py-0.5 rounded-full">
          Live Tours
        </span>
      </div>

      {/* Search Bar */}
      <div className="mt-2 relative">
        <div className="w-full bg-[#184948] border border-[#235E5D] rounded-xl px-3 py-2.5 flex items-center gap-2 text-xs text-[#F5F1EA] shadow-inner">
          <svg className="size-4 text-[#E87A3D] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="font-medium text-white/90">Nairobi street food tours...</span>
          <span className="ml-auto text-[10px] bg-[#0A5F5F] px-1.5 py-0.5 rounded text-[#B7E6E5] font-mono">KE</span>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-1.5 mt-2.5 overflow-x-hidden">
        <span className="text-[10px] font-bold bg-[#E87A3D] text-white px-2.5 py-1 rounded-full whitespace-nowrap shadow-sm">
          ● Live Now
        </span>
        <span className="text-[10px] font-medium bg-[#184948] text-[#B7E6E5] border border-[#235E5D] px-2.5 py-1 rounded-full whitespace-nowrap">
          Street Food
        </span>
        <span className="text-[10px] font-medium bg-[#184948] text-[#B7E6E5] border border-[#235E5D] px-2.5 py-1 rounded-full whitespace-nowrap">
          Maasai Culture
        </span>
      </div>

      {/* Experience Cards */}
      <div className="mt-3 space-y-2 flex-1 flex flex-col justify-center">
        {/* Card 1 */}
        <div className="bg-[#184948] border-2 border-[#E87A3D]/60 rounded-xl p-2.5 relative shadow-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wide bg-[#E87A3D] text-white px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-white animate-ping" />
              Live Streaming
            </span>
            <span className="text-xs font-black text-[#F5F1EA] font-mono">KSh 1,200</span>
          </div>
          <div className="text-xs font-bold text-white mt-1">Old Town Mombasa Spice Walk</div>
          <div className="text-[10px] text-[#B7E6E5] flex items-center justify-between mt-1">
            <span>Host: Juma K. (Verified Local)</span>
            <span className="text-[#E87A3D] font-bold">★ 4.95</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#113B3A]/80 border border-[#235E5D] rounded-xl p-2.5 opacity-90">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-[#B7E6E5] bg-[#0A5F5F] px-2 py-0.5 rounded-full">
              Starts in 15m
            </span>
            <span className="text-xs font-black text-[#F5F1EA] font-mono">KSh 1,500</span>
          </div>
          <div className="text-xs font-bold text-white">Nairobi Hidden Rooftops & Art</div>
          <div className="text-[10px] text-[#B7E6E5] flex items-center justify-between mt-1">
            <span>Host: Austin M. (Top Host)</span>
            <span className="text-[#E87A3D] font-bold">★ 5.0</span>
          </div>
        </div>
      </div>

      {/* Bottom helper */}
      <div className="mt-auto pt-2 text-center text-[10px] font-medium text-[#B7E6E5]/80 bg-[#113B3A]/60 py-1.5 rounded-lg border border-[#235E5D]/40">
        🔎 Tap any card to test the live stream
      </div>
    </div>
  )
}

// Step 2: See exact price in KSh
export function TravelerPriceIllustration({ className = "" }: IllustrationProps) {
  return (
    <div className={`w-full h-full bg-[#0c1f1f] text-white flex flex-col p-4 select-none relative overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-[#B7E6E5] pb-2 border-b border-[#235E5D]/40">
        <span className="font-mono">Exact Pricing</span>
        <span className="text-[10px] bg-[#10B981]/20 text-[#10B981] font-bold px-2 py-0.5 rounded-full border border-[#10B981]/40">
          100% Transparent
        </span>
      </div>

      {/* Giant Price Card */}
      <div className="mt-3 bg-gradient-to-br from-[#184948] to-[#0A5F5F] border-2 border-[#E87A3D] rounded-2xl p-4 text-center shadow-lg relative">
        <div className="text-[10px] uppercase font-bold tracking-widest text-[#B7E6E5]">Total You Pay</div>
        <div className="text-3xl font-black text-white mt-1 font-mono tracking-tight flex items-center justify-center gap-1.5">
          <span className="text-lg text-[#E87A3D]">KSh</span>
          <span>1,200</span>
        </div>
        <div className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-[#E87A3D] bg-[#E87A3D]/10 px-2.5 py-0.5 rounded-full border border-[#E87A3D]/30">
          ✓ No Surprise Fees at Checkout
        </div>
      </div>

      {/* Line Item Breakdown */}
      <div className="mt-3 bg-[#113B3A] border border-[#235E5D] rounded-xl p-3 space-y-2 text-xs">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#B7E6E5]/80 border-b border-[#235E5D]/50 pb-1">
          Where your money goes:
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white font-medium flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#E87A3D]" />
            Local Host Direct (80%)
          </span>
          <span className="font-mono font-bold text-white">KSh 960</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white font-medium flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#10B981]" />
            Trees & Impact Fund (10%)
          </span>
          <span className="font-mono font-bold text-white">KSh 120</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white font-medium flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#B7E6E5]" />
            Platform & Video Link (10%)
          </span>
          <span className="font-mono font-bold text-white">KSh 120</span>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-[#235E5D]/60 text-[#10B981] font-bold">
          <span>Card & M-PESA Processing</span>
          <span>FREE (KSh 0)</span>
        </div>
      </div>

      {/* Guarantee seal */}
      <div className="mt-auto bg-[#0A5F5F]/60 border border-[#235E5D] rounded-xl p-2.5 flex items-center gap-2.5">
        <div className="size-7 rounded-full bg-[#E87A3D] flex items-center justify-center shrink-0 text-white font-bold text-xs">
          🛡️
        </div>
        <div className="text-[10px] leading-tight">
          <div className="font-bold text-white">Ausaguide Price Guarantee</div>
          <div className="text-[#B7E6E5]">Hosts set their rates. Zero traveler surcharge.</div>
        </div>
      </div>
    </div>
  )
}

// Step 3: Book in seconds
export function TravelerBookIllustration({ className = "" }: IllustrationProps) {
  return (
    <div className={`w-full h-full bg-[#0c1f1f] text-white flex flex-col p-4 select-none relative overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-[#B7E6E5] pb-2 border-b border-[#235E5D]/40">
        <span className="font-mono">Instant Booking</span>
        <span className="text-[10px] bg-[#E87A3D]/20 text-[#E87A3D] font-bold px-2 py-0.5 rounded-full border border-[#E87A3D]/30 flex items-center gap-1">
          ⚡ No Account Needed
        </span>
      </div>

      {/* Form Card */}
      <div className="mt-3 bg-[#184948] border border-[#235E5D] rounded-2xl p-3.5 space-y-3 shadow-md">
        {/* Name input */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#B7E6E5]">Your Name</label>
          <div className="mt-1 w-full bg-[#113B3A] border border-[#235E5D] rounded-lg px-3 py-2 text-xs font-semibold text-white flex items-center gap-2">
            <span>👤</span>
            <span>Amina Mwangi</span>
          </div>
        </div>

        {/* Phone Input with M-PESA Flag */}
        <div>
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#B7E6E5]">M-PESA Phone Number</label>
            <span className="text-[9px] text-[#10B981] font-bold">Kenya (+254)</span>
          </div>
          <div className="mt-1 w-full bg-[#113B3A] border-2 border-[#E87A3D] rounded-lg px-3 py-2 text-xs font-mono font-bold text-white flex items-center gap-2 shadow-sm">
            <span className="text-sm">🇰🇪</span>
            <span className="text-[#E87A3D]">+254</span>
            <span className="text-white">712 345 678</span>
            <span className="ml-auto text-[10px] bg-[#10B981] text-white px-1.5 py-0.2 rounded font-sans">✓ Ready</span>
          </div>
        </div>

        {/* Selected Tour Pill */}
        <div className="bg-[#0A5F5F]/60 rounded-lg p-2 border border-[#235E5D]/80 flex items-center justify-between text-[11px]">
          <div>
            <div className="font-bold text-white">Nairobi Coffee & Street Walk</div>
            <div className="text-[10px] text-[#B7E6E5]">Today • 4:00 PM • 1 Guest</div>
          </div>
          <span className="font-mono font-bold text-[#E87A3D]">KSh 1,200</span>
        </div>
      </div>

      {/* Instant CTA Button */}
      <div className="mt-3">
        <div className="w-full bg-[#E87A3D] hover:bg-[#E87A3D]/90 text-white font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#E87A3D]/25">
          <span>Continue to M-PESA Push</span>
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      </div>

      {/* Security footer */}
      <div className="mt-auto text-center text-[10px] text-[#B7E6E5]/70 flex items-center justify-center gap-1.5">
        <span>🔒</span>
        <span>No password needed • PIN prompt sent directly to your phone</span>
      </div>
    </div>
  )
}

// Step 4: Pay securely with M-PESA
export function TravelerMpesaIllustration({ className = "" }: IllustrationProps) {
  return (
    <div className={`w-full h-full bg-[#0c1f1f] text-white flex flex-col p-4 select-none relative overflow-hidden ${className}`}>
      {/* Status Bar */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-[#B7E6E5] pb-2 border-b border-[#235E5D]/40">
        <span className="font-mono">STK Push Received</span>
        <span className="text-[10px] bg-[#00A34F]/30 text-[#00A34F] font-bold px-2 py-0.5 rounded-full border border-[#00A34F]/50 flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-[#00A34F] animate-ping" />
          Safaricom M-PESA
        </span>
      </div>

      {/* Authentic M-PESA STK Push Modal */}
      <div className="mt-4 bg-[#F5F1EA] text-[#113B3A] rounded-2xl p-4 shadow-2xl border-4 border-[#00A34F] relative">
        {/* Safaricom Green Banner */}
        <div className="flex items-center justify-between pb-2 border-b border-[#113B3A]/20">
          <div className="flex items-center gap-1.5 font-black text-xs text-[#00A34F] tracking-wide">
            <div className="size-4 rounded bg-[#00A34F] text-white flex items-center justify-center text-[10px] font-bold">M</div>
            <span>SIM TOOLKIT</span>
          </div>
          <span className="text-[9px] font-mono font-bold text-gray-500">PAYBILL 400200</span>
        </div>

        {/* Prompt Body */}
        <div className="py-3 text-center space-y-1">
          <p className="text-xs font-bold text-gray-800 leading-snug">
            Do you want to pay <span className="font-black text-[#00A34F]">KSh 1,200</span> to <span className="font-black">AUSAGUIDE</span>?
          </p>
          <p className="text-[10px] text-gray-600 font-mono">Ref: BK_AG7829 (Nairobi Tour)</p>
        </div>

        {/* PIN Entry Box */}
        <div className="my-2 bg-white rounded-lg border border-gray-300 p-2 text-center">
          <div className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1">Enter M-PESA PIN</div>
          <div className="flex items-center justify-center gap-2">
            <span className="size-2.5 rounded-full bg-[#113B3A]" />
            <span className="size-2.5 rounded-full bg-[#113B3A]" />
            <span className="size-2.5 rounded-full bg-[#113B3A]" />
            <span className="size-2.5 rounded-full bg-[#113B3A] animate-pulse" />
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-gray-200">
          <div className="py-2 text-center text-xs font-bold text-gray-600 bg-gray-200 rounded-lg">
            Cancel
          </div>
          <div className="py-2 text-center text-xs font-extrabold text-white bg-[#00A34F] rounded-lg shadow-sm">
            Send / OK
          </div>
        </div>
      </div>

      {/* Confirmation Pill Below */}
      <div className="mt-auto bg-[#184948] border border-[#235E5D] rounded-xl p-2.5 flex items-center gap-2.5">
        <div className="size-6 rounded-full bg-[#10B981] flex items-center justify-center text-white text-xs font-bold">
          ✓
        </div>
        <div className="text-[10px] text-[#F5F1EA]">
          <span className="font-bold text-white">Instant confirmation.</span> You will be redirected immediately upon entering your PIN.
        </div>
      </div>
    </div>
  )
}

// Step 5: Meet your host live
export function TravelerVideoIllustration({ className = "" }: IllustrationProps) {
  return (
    <div className={`w-full h-full bg-[#081515] text-white flex flex-col select-none relative overflow-hidden ${className}`}>
      {/* Top Live Bar */}
      <div className="absolute top-0 inset-x-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase bg-[#E87A3D] text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <span className="size-1.5 rounded-full bg-white animate-ping" />
            LIVE
          </span>
          <span className="text-xs font-bold text-white drop-shadow">Austin Mbote (Host)</span>
        </div>
        <span className="text-[10px] font-mono bg-black/50 px-2 py-0.5 rounded text-[#B7E6E5]">
          14:32
        </span>
      </div>

      {/* Main Video View Canvas (Host camera) */}
      <div className="relative flex-1 bg-gradient-to-b from-[#0A5F5F] via-[#113B3A] to-[#0c1f1f] flex flex-col justify-end p-4">
        {/* Background Graphic depicting live Nairobi city & market scene */}
        <div className="absolute inset-0 opacity-40">
          <svg className="w-full h-full" viewBox="0 0 300 400" preserveAspectRatio="none">
            <rect width="300" height="400" fill="#0A5F5F" />
            {/* Skyline & Acacias */}
            <path d="M 0 250 L 50 210 L 100 240 L 170 190 L 230 230 L 300 180 L 300 400 L 0 400 Z" fill="#0c1f1f" />
            <circle cx="230" cy="120" r="35" fill="#E87A3D" opacity="0.3" />
            {/* Market umbrella shapes */}
            <path d="M 40 310 Q 80 270 120 310 Z" fill="#E87A3D" opacity="0.5" />
            <path d="M 160 300 Q 200 260 240 300 Z" fill="#184948" opacity="0.7" />
          </svg>
        </div>

        {/* Live Host Speaking Indicator */}
        <div className="absolute top-12 left-4 z-10 bg-[#0c1f1f]/85 border border-[#235E5D] rounded-xl p-2 flex items-center gap-2 backdrop-blur-sm max-w-[200px]">
          <div className="size-7 rounded-full bg-[#E87A3D] text-white font-black text-xs flex items-center justify-center shrink-0">
            AM
          </div>
          <div className="text-[10px] leading-tight">
            <div className="font-bold text-white">Austin (in Westlands)</div>
            <div className="text-[#B7E6E5] truncate">“Walking past the art gallery now!”</div>
          </div>
        </div>

        {/* Floating User PIP (Traveler camera) */}
        <div className="absolute top-12 right-4 z-10 size-16 rounded-2xl border-2 border-[#E87A3D] overflow-hidden bg-[#184948] shadow-xl flex flex-col items-center justify-center text-center">
          <span className="text-xl">👩🏾</span>
          <span className="text-[8px] font-bold text-white bg-black/60 px-1 rounded mt-0.5">You</span>
        </div>

        {/* Interactive Chat Bubble */}
        <div className="relative z-10 bg-black/60 backdrop-blur-md border border-white/20 rounded-xl p-2.5 text-xs text-white mb-2">
          <div className="text-[10px] font-bold text-[#E87A3D]">You asked:</div>
          <div className="text-[11px] text-[#F5F1EA]">“Can you show me the coffee roasting station?”</div>
        </div>

        {/* Bottom Call Controls */}
        <div className="relative z-10 flex items-center justify-center gap-3 pt-1">
          <div className="size-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-sm">
            🎤
          </div>
          <div className="size-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-sm">
            📹
          </div>
          <div className="size-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-sm">
            🔄
          </div>
          <div className="size-8 rounded-full bg-[#FF5252] flex items-center justify-center text-xs font-bold text-white shadow-md">
            ✕
          </div>
        </div>
      </div>
    </div>
  )
}

// Step 6: Rate and rebook
export function TravelerReviewIllustration({ className = "" }: IllustrationProps) {
  return (
    <div className={`w-full h-full bg-[#0c1f1f] text-white flex flex-col p-4 select-none relative overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-[#B7E6E5] pb-2 border-b border-[#235E5D]/40">
        <span className="font-mono">Tour Complete</span>
        <span className="text-[10px] bg-[#10B981]/20 text-[#10B981] font-bold px-2 py-0.5 rounded-full border border-[#10B981]/40">
          Verified Experience
        </span>
      </div>

      {/* Host Avatar & Name */}
      <div className="text-center mt-3">
        <div className="inline-block relative">
          <div className="size-14 rounded-full bg-gradient-to-br from-[#E87A3D] to-[#0A5F5F] flex items-center justify-center text-2xl shadow-lg border-2 border-white">
            🧑🏾‍💼
          </div>
          <span className="absolute bottom-0 right-0 size-4 rounded-full bg-[#10B981] border-2 border-[#0c1f1f] flex items-center justify-center text-[8px] text-white font-bold">
            ✓
          </span>
        </div>
        <div className="text-sm font-black text-white mt-1">Austin Mbote</div>
        <div className="text-[10px] text-[#B7E6E5]">Local Host • Nairobi, Kenya</div>
      </div>

      {/* 5-Star Rating Picker */}
      <div className="mt-2.5 bg-[#184948] border border-[#235E5D] rounded-2xl p-3 text-center shadow-md">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#B7E6E5]">Your Rating</div>
        <div className="flex justify-center gap-1.5 my-1 text-2xl text-[#E87A3D]">
          <span>★</span>
          <span>★</span>
          <span>★</span>
          <span>★</span>
          <span>★</span>
        </div>
        <div className="text-[11px] font-bold text-[#F5F1EA]">“Outstanding 5.0 Tour”</div>
      </div>

      {/* Honest Review Snippet */}
      <div className="mt-2 bg-[#113B3A] border border-[#235E5D] rounded-xl p-2.5 text-xs text-[#F5F1EA] italic leading-snug">
        “Austin showed us local coffee spots we would never have found on our own. Absolutely authentic!”
      </div>

      {/* Rebook 1-Click Action */}
      <div className="mt-3">
        <div className="w-full bg-[#E87A3D] hover:bg-[#E87A3D]/90 text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#E87A3D]/25">
          <span>Rebook Austin Anytime</span>
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      </div>

      <div className="mt-auto text-center text-[10px] text-[#B7E6E5]/70">
        ⭐ Verified reviews help top Kenyan hosts grow their earnings
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   HOST ILLUSTRATIONS (1 - 6)
───────────────────────────────────────────────────────────────────────────── */

// Host Step 1: Sign up as a local host
export function HostSignupIllustration({ className = "" }: IllustrationProps) {
  return (
    <div className={`w-full h-full bg-[#0c1f1f] text-white flex flex-col p-4 select-none relative overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-[#B7E6E5] pb-2 border-b border-[#235E5D]/40">
        <span className="font-mono">Ausaguide Host Portal</span>
        <span className="text-[10px] bg-[#E87A3D]/20 text-[#E87A3D] font-bold px-2 py-0.5 rounded-full border border-[#E87A3D]/30">
          Earn from Home
        </span>
      </div>

      {/* Welcome Banner */}
      <div className="mt-3 bg-gradient-to-r from-[#184948] to-[#0A5F5F] border border-[#235E5D] rounded-2xl p-3 text-center">
        <div className="text-sm font-black text-white">Join the Host Circle</div>
        <div className="text-[10px] text-[#B7E6E5] mt-0.5">Show your corner of Kenya to the world</div>
      </div>

      {/* Select Category Grid */}
      <div className="mt-2.5 space-y-1.5 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#B7E6E5]">Choose who you are:</div>

        <div className="bg-[#184948] border-2 border-[#E87A3D] rounded-xl p-2 flex items-center justify-between text-xs font-bold text-white shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-base">🎓</span>
            <div>
              <div className="leading-tight">Student / Creator</div>
              <div className="text-[9px] font-normal text-[#B7E6E5]">Share campus, trends & local life</div>
            </div>
          </div>
          <span className="size-4 rounded-full bg-[#E87A3D] text-white flex items-center justify-center text-[10px]">✓</span>
        </div>

        <div className="bg-[#113B3A] border border-[#235E5D] rounded-xl p-2 flex items-center justify-between text-xs font-bold text-white/90">
          <div className="flex items-center gap-2">
            <span className="text-base">🍲</span>
            <div>
              <div className="leading-tight">Foodie / Cook</div>
              <div className="text-[9px] font-normal text-[#B7E6E5]">Swahili dishes, street food & markets</div>
            </div>
          </div>
          <span className="size-4 rounded-full border border-[#235E5D]" />
        </div>

        <div className="bg-[#113B3A] border border-[#235E5D] rounded-xl p-2 flex items-center justify-between text-xs font-bold text-white/90">
          <div className="flex items-center gap-2">
            <span className="text-base">🧭</span>
            <div>
              <div className="leading-tight">Certified Safari Guide</div>
              <div className="text-[9px] font-normal text-[#B7E6E5]">Wildlife, reserves & nature walks</div>
            </div>
          </div>
          <span className="size-4 rounded-full border border-[#235E5D]" />
        </div>
      </div>

      {/* Host CTA */}
      <div className="mt-auto">
        <div className="w-full bg-[#E87A3D] text-white font-extrabold text-xs py-2.5 rounded-xl text-center shadow-lg shadow-[#E87A3D]/25">
          Start Hosting in 24 Hours →
        </div>
      </div>
    </div>
  )
}

// Host Step 2: Create your tour
export function HostCreateIllustration({ className = "" }: IllustrationProps) {
  return (
    <div className={`w-full h-full bg-[#0c1f1f] text-white flex flex-col p-4 select-none relative overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-[#B7E6E5] pb-2 border-b border-[#235E5D]/40">
        <span className="font-mono">Tour Studio</span>
        <span className="text-[10px] bg-[#0A5F5F] text-[#B7E6E5] font-bold px-2 py-0.5 rounded-full border border-[#235E5D]">
          Step 2 of 3
        </span>
      </div>

      {/* Studio Form */}
      <div className="mt-3 bg-[#184948] border border-[#235E5D] rounded-2xl p-3 space-y-2.5 text-xs">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#B7E6E5]">Tour Title</label>
          <div className="mt-1 bg-[#113B3A] border border-[#235E5D] rounded-lg px-2.5 py-1.5 font-bold text-white truncate">
            Secret Rooftops & Art of Nairobi
          </div>
        </div>

        {/* Format Selector */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#B7E6E5]">Format</label>
          <div className="grid grid-cols-2 gap-1.5 mt-1">
            <div className="bg-[#E87A3D] text-white rounded-lg py-1 px-2 text-[10px] font-bold text-center flex items-center justify-center gap-1">
              <span>📹</span>
              <span>Live Video (45m)</span>
            </div>
            <div className="bg-[#113B3A] border border-[#235E5D] text-[#B7E6E5] rounded-lg py-1 px-2 text-[10px] font-medium text-center flex items-center justify-center gap-1">
              <span>🚶</span>
              <span>In-Person Walk</span>
            </div>
          </div>
        </div>

        {/* Set Your Price */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#B7E6E5]">Your Price</label>
            <span className="text-xs font-mono font-black text-[#E87A3D]">KSh 1,500</span>
          </div>
          <div className="w-full bg-[#113B3A] h-2 rounded-full mt-1 relative overflow-hidden">
            <div className="bg-[#E87A3D] h-full w-[65%] rounded-full" />
          </div>
          <div className="flex justify-between text-[9px] text-[#B7E6E5]/70 mt-0.5 font-mono">
            <span>KSh 500</span>
            <span>You receive: KSh 1,200 (80%)</span>
            <span>KSh 5,000</span>
          </div>
        </div>
      </div>

      {/* Uploaded Photos Preview */}
      <div className="mt-2.5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#B7E6E5] mb-1">Preview Photos</div>
        <div className="grid grid-cols-3 gap-1.5">
          <div className="h-12 rounded-lg bg-[#0A5F5F] border border-[#235E5D] flex items-center justify-center text-xs">
            🏙️
          </div>
          <div className="h-12 rounded-lg bg-[#E87A3D]/40 border border-[#E87A3D] flex items-center justify-center text-xs">
            ☕
          </div>
          <div className="h-12 rounded-lg bg-[#113B3A] border border-dashed border-[#B7E6E5]/40 flex items-center justify-center text-xs text-[#B7E6E5]">
            + Add
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <div className="w-full bg-[#0A5F5F] hover:bg-[#0A5F5F]/90 text-white font-extrabold text-xs py-2 rounded-xl text-center border border-[#B7E6E5]/30">
          Publish Tour to Marketplace ✓
        </div>
      </div>
    </div>
  )
}

// Host Step 3: Get discovered
export function HostDiscoverIllustration({ className = "" }: IllustrationProps) {
  return (
    <div className={`w-full h-full bg-[#0c1f1f] text-white flex flex-col p-4 select-none relative overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-[#B7E6E5] pb-2 border-b border-[#235E5D]/40">
        <span className="font-mono">Marketplace Feed</span>
        <span className="text-[10px] bg-[#E87A3D] text-white font-black px-2 py-0.5 rounded-full">
          #1 Ranked Guide
        </span>
      </div>

      {/* Discovery Metrics */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="bg-[#184948] border border-[#235E5D] rounded-xl p-2 text-center">
          <div className="text-lg font-black text-white font-mono">482</div>
          <div className="text-[9px] uppercase font-bold text-[#B7E6E5]">Views This Week</div>
        </div>
        <div className="bg-[#184948] border border-[#235E5D] rounded-xl p-2 text-center">
          <div className="text-lg font-black text-[#E87A3D] font-mono">18</div>
          <div className="text-[9px] uppercase font-bold text-[#B7E6E5]">Live Bookings</div>
        </div>
      </div>

      {/* Incoming Booking Notification Card */}
      <div className="mt-3 bg-gradient-to-br from-[#184948] to-[#0A5F5F] border-2 border-[#E87A3D] rounded-2xl p-3 shadow-lg relative">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold text-[#E87A3D] uppercase tracking-wide flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-[#E87A3D] animate-ping" />
            New Booking Alert
          </span>
          <span className="text-xs font-black text-white font-mono">KSh 1,500</span>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div className="size-8 rounded-full bg-[#F5F1EA] text-[#113B3A] font-bold text-xs flex items-center justify-center shrink-0">
            🇬🇧
          </div>
          <div>
            <div className="text-xs font-bold text-white">Sarah Jenkins (London, UK)</div>
            <div className="text-[10px] text-[#B7E6E5]">Tomorrow at 2:00 PM • Live Video</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-[#235E5D]/60">
          <div className="py-1.5 text-center text-[10px] font-bold bg-[#0A5F5F] text-[#B7E6E5] rounded-lg border border-[#235E5D]">
            View Details
          </div>
          <div className="py-1.5 text-center text-[10px] font-extrabold bg-[#E87A3D] text-white rounded-lg shadow-sm">
            Accept & Host ✓
          </div>
        </div>
      </div>

      {/* Discovery tag */}
      <div className="mt-auto bg-[#113B3A] border border-[#235E5D] rounded-xl p-2 text-center text-[10px] text-[#B7E6E5]">
        🌍 Travelers discover verified Kenyan hosts directly via search & featured stories
      </div>
    </div>
  )
}

// Host Step 4: Get paid to your M-PESA
export function HostPayoutIllustration({ className = "" }: IllustrationProps) {
  return (
    <div className={`w-full h-full bg-[#0c1f1f] text-white flex flex-col p-4 select-none relative overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-[#B7E6E5] pb-2 border-b border-[#235E5D]/40">
        <span className="font-mono">Host Earnings</span>
        <span className="text-[10px] bg-[#10B981]/20 text-[#10B981] font-bold px-2 py-0.5 rounded-full border border-[#10B981]/40">
          Instant Payout Active
        </span>
      </div>

      {/* Wallet Balance Card */}
      <div className="mt-3 bg-gradient-to-br from-[#184948] to-[#0A5F5F] border-2 border-[#10B981] rounded-2xl p-4 text-center shadow-lg">
        <div className="text-[10px] uppercase font-bold tracking-widest text-[#B7E6E5]">Available to Withdraw</div>
        <div className="text-3xl font-black text-white mt-1 font-mono tracking-tight flex items-center justify-center gap-1.5">
          <span className="text-lg text-[#10B981]">KSh</span>
          <span>24,800</span>
        </div>
        <div className="mt-1 text-[10px] text-[#B7E6E5]">
          You keep <span className="text-[#E87A3D] font-bold">80%</span> of every tour booking
        </div>
      </div>

      {/* Recent M-PESA Transactions */}
      <div className="mt-3 space-y-2 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#B7E6E5]">Recent Payouts:</div>

        <div className="bg-[#113B3A] border border-[#235E5D] rounded-xl p-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="size-6 rounded-full bg-[#00A34F] text-white text-[10px] font-bold flex items-center justify-center">
              M
            </span>
            <div>
              <div className="font-bold text-white">Sent to 0722•••567</div>
              <div className="text-[9px] text-[#10B981]">Completed in 4 mins ✓</div>
            </div>
          </div>
          <span className="font-mono font-bold text-[#10B981]">+KSh 9,600</span>
        </div>

        <div className="bg-[#113B3A] border border-[#235E5D] rounded-xl p-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="size-6 rounded-full bg-[#00A34F] text-white text-[10px] font-bold flex items-center justify-center">
              M
            </span>
            <div>
              <div className="font-bold text-white">Sent to 0722•••567</div>
              <div className="text-[9px] text-[#10B981]">Yesterday • Auto-Transfer</div>
            </div>
          </div>
          <span className="font-mono font-bold text-[#10B981]">+KSh 7,200</span>
        </div>
      </div>

      {/* Withdraw Button */}
      <div className="mt-auto">
        <div className="w-full bg-[#00A34F] hover:bg-[#00A34F]/90 text-white font-extrabold text-xs py-2.5 rounded-xl text-center shadow-lg flex items-center justify-center gap-2">
          <span>Withdraw to M-PESA Now</span>
          <span>⚡</span>
        </div>
      </div>
    </div>
  )
}

// Host Step 5: Host live video tours
export function HostLiveIllustration({ className = "" }: IllustrationProps) {
  return (
    <div className={`w-full h-full bg-[#081515] text-white flex flex-col select-none relative overflow-hidden ${className}`}>
      {/* Top Broadcasting status */}
      <div className="absolute top-0 inset-x-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase bg-[#E87A3D] text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <span className="size-1.5 rounded-full bg-white animate-ping" />
            BROADCASTING
          </span>
          <span className="text-xs font-bold text-white drop-shadow">Live Stream #42</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono bg-black/50 px-2 py-0.5 rounded text-[#10B981]">
          <span>👥 14 Viewers</span>
        </div>
      </div>

      {/* Host Camera Stream Viewfinder */}
      <div className="relative flex-1 bg-gradient-to-b from-[#0A5F5F] via-[#184948] to-[#0c1f1f] flex flex-col justify-end p-4">
        {/* Viewfinder brackets */}
        <div className="absolute inset-8 border border-white/20 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
          <div className="flex justify-between text-[9px] font-mono text-[#B7E6E5]">
            <span>[+] 4K 60FPS</span>
            <span>STABILIZED</span>
          </div>
          <div className="self-center size-8 border border-white/40 rounded-full flex items-center justify-center">
            <div className="size-1 bg-[#E87A3D] rounded-full" />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-[#B7E6E5]">
            <span>ISO 200</span>
            <span>BATTERY 88%</span>
          </div>
        </div>

        {/* Live Incoming Question Banner */}
        <div className="relative z-10 bg-black/75 backdrop-blur-md border border-[#E87A3D]/80 rounded-xl p-2.5 mb-2 shadow-xl">
          <div className="flex items-center justify-between text-[10px] text-[#E87A3D] font-bold">
            <span>💬 Live Question from Sarah (UK):</span>
            <span className="bg-[#E87A3D] text-white px-1.5 rounded text-[9px]">Tap to answer</span>
          </div>
          <div className="text-xs text-white font-medium mt-0.5">
            “Can you ask the woodcarver what timber he is using?”
          </div>
        </div>

        {/* Floating Tip Badge */}
        <div className="relative z-10 bg-[#10B981] text-white rounded-lg px-2.5 py-1 text-[10px] font-bold flex items-center justify-between mb-2 shadow-md">
          <span>🎉 Tip received from David (US):</span>
          <span className="font-mono font-black">+ KSh 500</span>
        </div>

        {/* Bottom Stream Controls */}
        <div className="relative z-10 flex items-center justify-center gap-3 pt-1">
          <div className="size-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xs">
            💡
          </div>
          <div className="size-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xs">
            🔄
          </div>
          <div className="size-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xs">
            🎙️
          </div>
          <div className="size-8 rounded-full bg-[#E87A3D] flex items-center justify-center text-xs font-black text-white shadow-md">
            HD
          </div>
        </div>
      </div>
    </div>
  )
}

// Host Step 6: Build your reputation
export function HostReputationIllustration({ className = "" }: IllustrationProps) {
  return (
    <div className={`w-full h-full bg-[#0c1f1f] text-white flex flex-col p-4 select-none relative overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-[#B7E6E5] pb-2 border-b border-[#235E5D]/40">
        <span className="font-mono">Host Reputation</span>
        <span className="text-[10px] bg-[#E87A3D] text-white font-black px-2 py-0.5 rounded-full flex items-center gap-1">
          🏅 Superhost
        </span>
      </div>

      {/* Superhost Card */}
      <div className="mt-3 bg-gradient-to-br from-[#184948] to-[#0A5F5F] border-2 border-[#E87A3D] rounded-2xl p-3.5 text-center shadow-lg relative">
        <div className="text-2xl mb-1">🏆</div>
        <div className="text-sm font-black text-white">Top 5% Guide in Kenya</div>
        <div className="flex justify-center items-center gap-1 my-1 text-sm text-[#E87A3D] font-bold">
          <span>★★★★★</span>
          <span className="text-white font-mono font-black text-xs ml-1">4.98</span>
          <span className="text-[10px] text-[#B7E6E5] font-normal">(124 reviews)</span>
        </div>
        <div className="text-[10px] text-[#F5F1EA]">
          100% On-Time Start • 98% 5-Star Traveler Ratings
        </div>
      </div>

      {/* Income Growth Chart Representation */}
      <div className="mt-2.5 bg-[#113B3A] border border-[#235E5D] rounded-xl p-3">
        <div className="flex items-center justify-between text-[10px] font-bold text-[#B7E6E5]">
          <span>Monthly Income Growth</span>
          <span className="text-[#10B981] font-mono">+184%</span>
        </div>

        {/* Stylized Bar Chart */}
        <div className="flex items-end justify-between gap-2 h-14 mt-2 pt-1 border-b border-[#235E5D]/60 pb-1">
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-[#0A5F5F] h-4 rounded-t-sm" />
            <span className="text-[8px] font-mono text-[#B7E6E5]">M1</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-[#184948] h-7 rounded-t-sm" />
            <span className="text-[8px] font-mono text-[#B7E6E5]">M2</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-[#0A5F5F] h-10 rounded-t-sm" />
            <span className="text-[8px] font-mono text-[#B7E6E5]">M3</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-[#E87A3D] h-13 rounded-t-sm shadow-sm" />
            <span className="text-[8px] font-mono text-[#E87A3D] font-bold">M4</span>
          </div>
        </div>
      </div>

      {/* Verified Traveler Badge */}
      <div className="mt-auto bg-[#184948] border border-[#235E5D] rounded-xl p-2 flex items-center gap-2">
        <span className="text-base">💬</span>
        <div className="text-[10px] text-[#F5F1EA] italic leading-tight">
          “Juma helped us discover authentic Nairobi culture safely. We rebook every visit!”
        </div>
      </div>
    </div>
  )
}
