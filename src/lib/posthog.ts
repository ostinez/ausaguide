import posthog from 'posthog-js';

export function initPostHog() {
  try {
    const apiKey = import.meta.env.VITE_POSTHOG_KEY;
    const host = import.meta.env.VITE_POSTHOG_HOST;

    if (apiKey && host) {
      posthog.init(apiKey, {
        api_host: host,
        capture_pageview: false,
      });
    }
  } catch (e) {
    console.warn("[PostHog] init skipped:", e);
  }
}

export function trackEvent(eventName: string, properties?: Record<string, any>) {
  try {
    posthog.capture(eventName, properties);
  } catch (_) {
    // safe fallback
  }
}

export function identifyUser(userId: string, traits?: Record<string, any>) {
  try {
    posthog.identify(userId, traits);
  } catch (_) {
    // safe fallback
  }
}
