import { useState, useEffect } from 'react';

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) setShow(true);
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShow(false);
    // Initialize PostHog, Sentry, etc.
    window.dispatchEvent(new Event('cookies-accepted'));
  };

  const decline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-[#16161A] border border-primary/40 rounded-2xl p-5 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <p className="text-sm text-foreground leading-relaxed">
        We use cookies to improve your experience. By continuing, you agree to our use of cookies.
      </p>
      <div className="flex gap-3 mt-4">
        <button onClick={accept} className="bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold rounded-lg hover:bg-primary/90 transition cursor-pointer">
          Accept
        </button>
        <button onClick={decline} className="border border-border text-foreground px-4 py-2 text-xs font-semibold rounded-lg hover:bg-muted transition cursor-pointer">
          Decline
        </button>
      </div>
    </div>
  );
}
