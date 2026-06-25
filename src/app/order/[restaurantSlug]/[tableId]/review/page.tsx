'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, Send, UtensilsCrossed, ArrowLeft, Phone, User, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { demoRestaurant, demoReviews } from '@/lib/demo-data';

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    // Save to localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('qrestro_reviews');
      let reviewsList = [];
      if (stored) {
        try {
          reviewsList = JSON.parse(stored);
        } catch {}
      } else {
        reviewsList = [...demoReviews];
      }

      const newReview = {
        id: `rev-new-${Date.now()}`,
        session_id: null,
        restaurant_id: demoRestaurant.id,
        rating: rating,
        comment: comment.trim(),
        customer_name: customerName.trim() || 'Anonymous Diner',
        customer_phone: customerPhone.trim() || undefined,
        created_at: new Date().toISOString()
      };

      const updatedReviews = [newReview, ...reviewsList];
      localStorage.setItem('qrestro_reviews', JSON.stringify(updatedReviews));
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center animate-fade-in-up">
          <div className="w-20 h-20 bg-sage-400/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-sage-500" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-ink-900 mb-2">Thank You!</h2>
          <p className="text-ink-500 mb-8">
            Your feedback helps us serve you better. We appreciate your visit to {demoRestaurant.name}!
          </p>
          <div className="flex items-center justify-center gap-1 mb-8">
            {[1, 2, 3, 4, 5].map(star => (
              <Star key={star} className={cn('w-8 h-8', star <= rating ? 'fill-gold-400 text-gold-400' : 'text-cream-300')} />
            ))}
          </div>
          <button
            onClick={() => router.push(`/order/${params.restaurantSlug}/${params.tableId}`)}
            className="btn-primary text-base px-8 py-3"
          >
            <UtensilsCrossed className="w-4 h-4" /> Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <header className="bg-cream-50/90 backdrop-blur-md border-b border-cream-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg text-ink-400 hover:text-ink-600 hover:bg-cream-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-heading text-lg font-bold text-ink-900">Leave a Review</h1>
            <p className="text-xs text-ink-400">{demoRestaurant.name}</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
          {/* Rating */}
          <div className="card text-center py-8">
            <p className="text-ink-500 mb-4 font-medium">How was your experience?</p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-125 active:scale-95"
                >
                  <Star className={cn(
                    'w-10 h-10 transition-colors',
                    star <= (hoveredRating || rating)
                      ? 'fill-gold-400 text-gold-400'
                      : 'text-cream-300'
                  )} />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gold-500 font-medium mt-3 animate-fade-in">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent!'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">
              Tell us more (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you enjoy? What could be better?"
              className="input-field resize-none h-28"
            />
          </div>

          {/* Contact info */}
          <div className="card bg-cream-100/50">
            <p className="text-sm font-medium text-ink-700 mb-3">Your details (optional)</p>
            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Your name"
                  className="input-field pl-10 text-sm"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Phone number (for future offers)"
                  className="input-field pl-10 text-sm"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>
            <p className="text-xs text-ink-400 mt-2">
              📱 We&apos;ll send you exclusive offers and updates
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={rating === 0}
            className="btn-primary w-full py-4 rounded-xl text-base disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" /> Submit Review
          </button>
        </form>
      </div>
    </div>
  );
}
