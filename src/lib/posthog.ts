import posthog from 'posthog-js';

export function initPostHog() {
  const apiKey = import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST;

  if (apiKey && host) {
    posthog.init(apiKey, {
      api_host: host,
      capture_pageview: false,
    });
  }
}

export function trackEvent(eventName: string, properties?: Record<string, any>) {
  posthog.capture(eventName, properties);
}

export function identifyUser(userId: string, traits?: Record<string, any>) {
  posthog.identify(userId, traits);
}
