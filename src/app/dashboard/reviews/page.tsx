'use client';

import { useState, useEffect } from 'react';
import { Star, Phone, Calendar, MessageSquare } from 'lucide-react';
import { demoReviews } from '@/lib/demo-data';
import { formatDate } from '@/lib/utils';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('qrestro_reviews');
      if (stored) {
        try {
          setReviews(JSON.parse(stored));
        } catch {
          setReviews(demoReviews);
        }
      } else {
        setReviews(demoReviews);
        localStorage.setItem('qrestro_reviews', JSON.stringify(demoReviews));
      }
    }
  }, []);

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percent: reviews.length > 0 ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 : 0,
  }));

  return (
    <div className="space-y-6 animate-simple-fade">
      <div>
        <h1 className="font-heading text-3xl font-bold text-ink-900">Customer Reviews</h1>
        <p className="text-ink-500 mt-1">Feedback from your diners</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-cream-100 text-center">
          <p className="font-heading text-4xl font-bold text-gold-500">{avgRating.toFixed(1)}</p>
          <div className="flex items-center justify-center gap-0.5 my-2">
            {[1, 2, 3, 4, 5].map(star => (
              <Star key={star} className={`w-5 h-5 ${star <= Math.round(avgRating) ? 'fill-gold-400 text-gold-400' : 'text-cream-300'}`} />
            ))}
          </div>
          <p className="text-sm text-ink-500">{reviews.length} reviews</p>
        </div>

        <div className="card bg-cream-100 md:col-span-2">
          <h3 className="text-sm font-medium text-ink-700 mb-3">Rating Distribution</h3>
          <div className="space-y-2">
            {ratingDistribution.map(({ rating, count, percent }) => (
              <div key={rating} className="flex items-center gap-3 text-sm">
                <span className="w-8 text-ink-500 text-right">{rating}★</span>
                <div className="flex-1 bg-cream-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gold-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-6 text-ink-400 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-4 stagger-children">
        {reviews.map((review) => (
          <div key={review.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold-500/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-gold-600">
                    {review.customer_name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-ink-900">{review.customer_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {review.customer_phone && (
                      <span className="text-xs text-ink-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {review.customer_phone}
                      </span>
                    )}
                    <span className="text-xs text-ink-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {formatDate(review.created_at)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'fill-gold-400 text-gold-400' : 'text-cream-300'}`} />
                ))}
              </div>
            </div>
            {review.comment && (
              <div className="bg-cream-50 rounded-xl p-3 border border-cream-200/50">
                <p className="text-sm text-ink-700 leading-relaxed flex gap-2">
                  <MessageSquare className="w-4 h-4 text-ink-300 flex-shrink-0 mt-0.5" />
                  {review.comment}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
