import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

export type Review = Database['public']['Tables']['reviews']['Row'] & {
  traveler?: Database['public']['Tables']['profiles']['Row'];
  traveler_name?: string;
};

export type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];

export async function getVisibleReviewsByHost(hostId: string, page: number = 1, pageSize: number = 10) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('reviews')
    .select('*', { count: 'exact' })
    .eq('host_id', hostId)
    .eq('status', 'visible')
    .order('likes', { ascending: false })
    .range(from, to);

  if (error) throw error;

  const reviews = (data ?? []) as Review[];
  if (reviews.length > 0) {
    const travelerIds = reviews.map(r => r.user_id).filter(Boolean);
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', travelerIds);

    if (!profileError && profiles) {
      const profileMap = new Map(profiles.map(p => [p.id, p]));
      reviews.forEach(r => {
        const p = profileMap.get(r.user_id);
        r.traveler = p;
        r.traveler_name = p?.full_name ?? 'Anonymous';
      });
    }
  }

  return { reviews, total: count ?? 0 };
}

export async function getVisibleReviewsByTour(tourId: string, page: number = 1, pageSize: number = 10) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('reviews')
    .select('*', { count: 'exact' })
    .eq('tour_id', tourId)
    .eq('status', 'visible')
    .order('likes', { ascending: false })
    .range(from, to);

  if (error) throw error;

  const reviews = (data ?? []) as Review[];
  if (reviews.length > 0) {
    const travelerIds = reviews.map(r => r.user_id).filter(Boolean);
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', travelerIds);

    if (!profileError && profiles) {
      const profileMap = new Map(profiles.map(p => [p.id, p]));
      reviews.forEach(r => {
        const p = profileMap.get(r.user_id);
        r.traveler = p;
        r.traveler_name = p?.full_name ?? 'Anonymous';
      });
    }
  }

  return { reviews, total: count ?? 0 };
}

export async function createReview(review: ReviewInsert) {
  const { data, error } = await supabase
    .from('reviews')
    .insert(review)
    .select()
    .single();
  if (error) throw error;
  return data as Review;
}

export async function likeReview(reviewId: string) {
  const { data, error: fetchError } = await supabase
    .from('reviews')
    .select('likes')
    .eq('id', reviewId)
    .single();
  if (fetchError) throw fetchError;
  const currentLikes = data?.likes ?? 0;
  const { error } = await supabase
    .from('reviews')
    .update({ likes: currentLikes + 1 })
    .eq('id', reviewId);
  if (error) throw error;
}

export async function complainReview(reviewId: string) {
  const { data, error: fetchError } = await supabase
    .from('reviews')
    .select('complaints')
    .eq('id', reviewId)
    .single();
  if (fetchError) throw fetchError;
  const currentComplaints = data?.complaints ?? 0;
  const { error } = await supabase
    .from('reviews')
    .update({ complaints: currentComplaints + 1 })
    .eq('id', reviewId);
  if (error) throw error;
}

export async function setReviewStatus(reviewId: string, status: 'visible' | 'hidden' | 'pending') {
  const { error } = await supabase.from('reviews').update({ status }).eq('id', reviewId);
  if (error) throw error;
}
