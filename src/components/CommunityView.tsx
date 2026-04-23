import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Search, X, ChevronRight, Trash2, Heart, MessageSquare, Sparkles } from 'lucide-react';
import { Outfit, UserProfile } from '../types';
import { cn } from '../lib/utils';

// Props 
interface CommunityViewProps {
  communityFilter: 'all' | 'following';
  setCommunityFilter: (filter: 'all' | 'following') => void;
  userSearchQuery: string;
  setUserSearchQuery: (query: string) => void;
  isSearchingUsers: boolean;
  userSearchResults: UserProfile[];
  filteredOutfits: Outfit[];
  onViewProfile: (uid: string) => void;
  onToggleFavorite: (id: string) => void;
  onSetViewingComments: (comments: { id: string; type: 'outfits' | 'tutorials' } | null) => void;
  onSetItemToDelete: (item: { id: string; type: 'outfit' } | null) => void;
  favoriteIds: string[];
  currentUser: any;
  outfitsCount: number;
}

// Canvas size that the Styler uses

const CANVAS_SIZE = 800;

// OutfitCanvas 
const OutfitCanvas: React.FC<{ outfit: Outfit; className?: string }> = ({ outfit, className }) => {
  if (outfit.previewUrl) {
    return (
      <img
        src={outfit.previewUrl}
        className={cn('w-full h-full object-cover', className)}
        alt="Outfit preview"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className={cn('relative w-full h-full overflow-hidden', className)}
      style={{ backgroundColor: outfit.backgroundColor || '#f4f4f5' }}
    >
      {/*canvas*/}
      <ScaledCanvas outfit={outfit} />
    </div>
  );
};

const ScaledCanvas: React.FC<{ outfit: Outfit }> = ({ outfit }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Measure container on mount + resize
  React.useEffect(() => {
    const el = wrapperRef.current?.parentElement;
    if (!el) return;
    const update = () => setScale(el.clientWidth / CANVAS_SIZE);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'absolute',
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        transformOrigin: 'top left',
        transform: `scale(${scale})`,
      }}
    >
      {outfit.items.map((item, i) => {
        if (!item.imageUrl) return null;
        const scaleX = item.scaleX !== undefined ? item.scaleX : (item.scale ?? 1);
        const scaleY = item.scaleY !== undefined ? item.scaleY : (item.scale ?? 1);
        return (
          <img
            key={i}
            src={item.imageUrl}
            referrerPolicy="no-referrer"
            alt="Outfit item"
            style={{
              position: 'absolute',
              left: item.x,
              top: item.y,
              width: item.width || 200,
              height: item.height || 200,
              transformOrigin: '0 0',
              transform: `scale(${scaleX}, ${scaleY}) rotate(${item.rotation ?? 0}deg)`,
              objectFit: 'cover',
              borderRadius: 4,
            }}
          />
        );
      })}
    </div>
  );
};

//  Aspect ratio helper

function getAspectClass(outfit: Outfit, idx: number): string {
  if (outfit.cardSize === 'small') return 'aspect-[4/3]';
  if (outfit.cardSize === 'large') return 'aspect-[2/3]';
  // Medium / unset: vary for visual rhythm (Pinterest-style)
  const rhythm = idx % 5;
  if (rhythm === 0) return 'aspect-[2/3]';
  if (rhythm === 3) return 'aspect-[4/3]';
  return 'aspect-square';
}

//  CommunityView 

export const CommunityView: React.FC<CommunityViewProps> = ({
  communityFilter,
  setCommunityFilter,
  userSearchQuery,
  setUserSearchQuery,
  isSearchingUsers,
  userSearchResults,
  filteredOutfits,
  onViewProfile,
  onToggleFavorite,
  onSetViewingComments,
  onSetItemToDelete,
  favoriteIds,
  currentUser,
  outfitsCount,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Split into 3 columns for manual masonry
  const col1: Outfit[] = [];
  const col2: Outfit[] = [];
  const col3: Outfit[] = [];
  filteredOutfits.forEach((o, i) => {
    if (i % 3 === 0) col1.push(o);
    else if (i % 3 === 1) col2.push(o);
    else col3.push(o);
  });

  const renderCard = (outfit: Outfit, idx: number) => {
    const isLiked = favoriteIds.includes(outfit.id);
    const isHovered = hoveredId === outfit.id;
    const aspectClass = getAspectClass(outfit, idx);

    return (
      <motion.article
        key={outfit.id}
        layout
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: Math.min(idx * 0.04, 0.3) }}
        className="mb-4 group cursor-pointer"
        onMouseEnter={() => setHoveredId(outfit.id)}
        onMouseLeave={() => setHoveredId(null)}
        onClick={() => onSetViewingComments({ id: outfit.id, type: 'outfits' })}
      >
        <div
          className={cn(
            'relative rounded-[2rem] overflow-hidden',
            'transition-all duration-300',
            isHovered ? 'shadow-2xl shadow-black/20 -translate-y-0.5' : 'shadow-sm'
          )}
          style={{ backgroundColor: outfit.backgroundColor || '#f4f4f5' }}
        >
          {/* Image area */}
          <div className={cn('relative overflow-hidden', aspectClass)}>
            <OutfitCanvas
              outfit={outfit}
              className={cn(
                'transition-transform duration-500',
                isHovered ? 'scale-105' : 'scale-100'
              )}
            />

            {/* Hover scrim */}
            <div
              className={cn(
                'absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent',
                'transition-opacity duration-300',
                isHovered ? 'opacity-100' : 'opacity-0'
              )}
            />

            {/* Action buttons — top right */}
            <div
              className={cn(
                'absolute top-3 right-3 flex gap-1.5',
                'transition-all duration-200',
                isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
              )}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(outfit.id);
                }}
                className={cn(
                  'w-9 h-9 backdrop-blur-md rounded-full flex items-center justify-center transition-all shadow-lg',
                  isLiked
                    ? 'bg-red-500 text-white scale-110'
                    : 'bg-black/60 text-white/70 hover:bg-black/80 hover:text-red-300'
                )}
                aria-label={isLiked ? 'Unlike' : 'Like'}
              >
                <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
              </button>
              {outfit.authorId === currentUser?.uid && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetItemToDelete({ id: outfit.id, type: 'outfit' });
                  }}
                  className="w-9 h-9 bg-black/60 backdrop-blur-md text-red-300 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg"
                  aria-label="Delete outfit"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {/* Author info — bottom on hover */}
            <div
              className={cn(
                'absolute bottom-0 left-0 right-0 p-4',
                'transition-all duration-300',
                isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              )}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewProfile(outfit.authorId);
                }}
                className="flex items-center gap-2.5 group/author"
              >
                <img
                  src={outfit.authorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${outfit.authorId}`}
                  className="w-8 h-8 rounded-full border-2 border-white/30 shadow-md"
                  alt={outfit.authorName}
                  referrerPolicy="no-referrer"
                />
                <div className="text-left">
                  <p className="font-bold text-white text-sm leading-tight group-hover/author:underline underline-offset-2">
                    {outfit.authorName}
                  </p>
                  {outfit.tags && outfit.tags.length > 0 && (
                    <p className="text-white/60 text-[10px] mt-0.5">
                      #{outfit.tags.slice(0, 2).join(' #')}
                    </p>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/*  Card footer */}
          <div className="px-4 py-3 flex items-center justify-between bg-[#70ACDE]/20 dark:bg-[#0A2647] border-t border-border">
            <div className="flex items-center gap-3 text-text-muted text-xs font-semibold">
              <span className={cn('flex items-center gap-1', isLiked && 'text-red-500')}>
                <Heart size={11} fill={isLiked ? 'currentColor' : 'none'} />
                {outfit.likesCount || 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare size={11} />
                {outfit.commentsCount || 0}
              </span>
            </div>

            {/* Small avatar shown when not hovered */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewProfile(outfit.authorId);
              }}
              className={cn(
                'flex items-center gap-1.5 transition-opacity duration-200',
                isHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'
              )}
            >
              <img
                src={outfit.authorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${outfit.authorId}`}
                className="w-6 h-6 rounded-full border border-border"
                alt={outfit.authorName}
                referrerPolicy="no-referrer"
              />
              <span className="text-text-muted text-[10px] font-medium max-w-[80px] truncate">
                {outfit.authorName}
              </span>
            </button>
          </div>
        </div>
      </motion.article>
    );
  };

  return (
    <motion.div
      key="community"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {/*  Hero Banner  */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-[#70ACDE] dark:bg-[#0A2647] border-2 border-primary dark:border-[#70ACDE]" style={{ minHeight: 200 }}>
        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 39px, var(--grid-color) 39px, var(--grid-color) 40px),
              repeating-linear-gradient(90deg, transparent, transparent 39px, var(--grid-color) 39px, var(--grid-color) 40px)
            `
          }}
        />
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-primary dark:text-[#70ACDE]">
              <Users size={14} />
              <span className="text-xs font-bold uppercase tracking-[0.3em]">Global Feed</span>
            </div>
            <h2 className="text-6xl md:text-7xl font-heading text-primary dark:text-cream-support leading-none">
              Community Feed
            </h2>
            <p className="text-dark/70 dark:text-[#70ACDE] text-sm font-medium max-w-xl">
              {outfitsCount} {outfitsCount === 1 ? 'outfit' : 'outfits'} shared · Get inspired and share your feedback.
            </p>
          </div>

          {/* Search + filter pill */}
          <div className="flex items-center gap-3 w-full md:w-auto bg-card/80 backdrop-blur-md p-2 rounded-[2rem] border border-border shadow-xl">
            <div className="relative flex items-center flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 text-text-muted" size={16} />
              <input
                type="text"
                placeholder="Search stylists or tags…"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none rounded-full pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-text placeholder:text-text-muted"
              />
              {userSearchQuery && (
                <button
                  onClick={() => setUserSearchQuery('')}
                  className="absolute right-3 p-0.5 hover:bg-card-hover rounded-full transition-colors"
                >
                  <X size={13} className="text-text-muted" />
                </button>
              )}
            </div>

            <div className="hidden md:block w-px h-7 bg-border" />

            <div className="flex gap-1">
              {(['all', 'following'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setCommunityFilter(f)}
                  className={cn(
                    'px-5 py-2 rounded-full text-sm font-bold transition-all capitalize',
                    communityFilter === f
                      ? 'bg-primary text-bg shadow-md'
                      : 'text-primary/40 hover:text-primary hover:bg-primary/5'
                  )}
                >
                  {f === 'all' ? 'All Posts' : 'Following'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/*  User search results  */}
      <AnimatePresence>
        {userSearchQuery.trim() !== '' && !isSearchingUsers && userSearchResults.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center py-10 bg-card rounded-[2rem] border border-border shadow-xl"
          >
            <Users className="mx-auto text-text-muted mb-3 opacity-20" size={40} />
            <p className="text-text-muted font-medium">No stylists found for "{userSearchQuery}"</p>
            <button onClick={() => setUserSearchQuery('')} className="mt-3 text-primary font-bold hover:underline text-sm">
              Clear search
            </button>
          </motion.div>
        )}

        {userSearchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="bg-card rounded-[2rem] p-6 border border-border shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-heading text-primary">Stylists found</h3>
              <button onClick={() => setUserSearchQuery('')} className="text-sm font-bold text-zinc-400 hover:text-primary transition-colors">
                Clear
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {userSearchResults.map((u) => (
                <motion.div
                  key={u.uid}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-3 bg-card-hover rounded-2xl border border-border cursor-pointer group"
                  onClick={() => { onViewProfile(u.uid); setUserSearchQuery(''); }}
                >
                  <img
                    src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`}
                    className="w-12 h-12 rounded-full border-2 border-white shadow-sm group-hover:border-primary transition-colors"
                    alt={u.displayName}
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-text truncate text-sm">{u.displayName}</p>
                    <p className="text-xs text-zinc-400">View Profile →</p>
                  </div>
                  <ChevronRight size={16} className="text-zinc-300 group-hover:text-primary transition-colors" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/*  Masonry grid  */}
      {filteredOutfits.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          <div className="flex flex-col gap-4 mt-5">
            {col1.map((outfit, i) => renderCard(outfit, i * 3))}
          </div>
          <div className="flex flex-col gap-4 mt-5">
            {col2.map((outfit, i) => renderCard(outfit, i * 3 + 1))}
          </div>
          <div className="hidden lg:flex flex-col gap-4 mt-5">
            {col3.map((outfit, i) => renderCard(outfit, i * 3 + 2))}
          </div>
        </div>
      ) : (
        <div className="py-32 text-center space-y-4">
          <div className="w-24 h-24 bg-card-hover rounded-full flex items-center justify-center mx-auto text-text-muted">
            <Sparkles size={40} className="opacity-30" />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-text">No outfits yet</p>
            <p className="text-text-muted text-sm">
              {communityFilter === 'following'
                ? 'Follow some stylists to see their outfits here.'
                : 'Be the first to share your style!'}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};