import { supabase } from '../supabase';

type RateLimitConfig = {
  max: number;
  windowMs: number;
};

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + config.windowMs);

  // 1. Fetch current rate limit record for key
  const { data: record, error: fetchErr } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('key', key)
    .maybeSingle();

  if (fetchErr) {
    console.error('Rate limit fetch error:', fetchErr);
    // Safe fallback: allow request if database is down
    return { allowed: true, remaining: config.max, resetAt };
  }

  // 2. If it does not exist, insert and allow
  if (!record) {
    const { error: insertErr } = await supabase
      .from('rate_limits')
      .insert({
        key,
        count: 1,
        reset_at: resetAt.toISOString(),
      })
      .select()
      .single();

    if (insertErr) {
      console.error('Rate limit insert error:', insertErr);
      return { allowed: true, remaining: config.max - 1, resetAt };
    }

    return {
      allowed: true,
      remaining: config.max - 1,
      resetAt,
    };
  }

  // 3. It exists: check if window is expired
  const recordResetAt = new Date(record.reset_at);
  if (now > recordResetAt) {
    // Reset window
    const { error: updateErr } = await supabase
      .from('rate_limits')
      .update({
        count: 1,
        reset_at: resetAt.toISOString(),
      })
      .eq('key', key)
      .select()
      .single();

    if (updateErr) {
      console.error('Rate limit reset error:', updateErr);
      return { allowed: true, remaining: config.max - 1, resetAt };
    }

    return {
      allowed: true,
      remaining: config.max - 1,
      resetAt,
    };
  }

  // 4. Within window: check if count is exceeded
  if (record.count >= config.max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: recordResetAt,
    };
  }

  // 5. Increment count and allow
  const newCount = record.count + 1;
  const { error: incErr } = await supabase
    .from('rate_limits')
    .update({ count: newCount })
    .eq('key', key);

  if (incErr) {
    console.error('Rate limit increment error:', incErr);
  }

  return {
    allowed: true,
    remaining: Math.max(0, config.max - newCount),
    resetAt: recordResetAt,
  };
}

// Helpers
export function getLoginKey(ip: string): string {
  return `login:${ip}`;
}

export function getBookingKey(userId: string): string {
  return `booking:${userId}`;
}

export function getChatKey(userId: string): string {
  return `chat:${userId}`;
}
