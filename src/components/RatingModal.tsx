import React, { useState } from 'react';
import { Star, X, MessageSquare, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  targetName: string;
}

export const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose, onSubmit, targetName }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-3xl font-heading text-primary">Rate Seller</h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-8">
          <div className="text-center space-y-2">
            <p className="text-zinc-500 font-medium">How was your experience with</p>
            <p className="text-xl font-bold text-zinc-900">{targetName}?</p>
          </div>

          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="p-1 transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  size={40}
                  className={cn(
                    "transition-colors duration-200",
                    (hoveredRating || rating) >= star
                      ? "text-amber-400 fill-amber-400"
                      : "text-zinc-200"
                  )}
                />
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1 flex items-center gap-2">
              <MessageSquare size={14} />
              Your Review
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px] text-sm"
              placeholder="Share your thoughts on the item and service..."
            />
          </div>

          <button
            onClick={() => onSubmit(rating, comment)}
            disabled={rating === 0}
            className="w-full bg-primary text-bg py-5 rounded-2xl font-heading text-2xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-xl retro-shadow-pink disabled:opacity-50 disabled:hover:scale-100"
          >
            <Send size={24} />
            Submit Review
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
