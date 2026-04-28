import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Plus, X, Tag, DollarSign, Search, Trash2, ExternalLink, Star, Camera, User as UserIcon, Package, ChevronRight, Sparkles, RefreshCw, Heart, Recycle, AlertTriangle } from 'lucide-react';

const ITEM_CONDITIONS = [
  { value: 'Brand New',   label: 'Brand New',   emoji: '✨', description: 'Never worn, tags on',         color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700' },
  { value: 'Like New',    label: 'Like New',     emoji: '🌟', description: 'Worn once or twice',          color: 'text-sky-600 bg-sky-50 border-sky-200 dark:bg-sky-900/20 dark:border-sky-700' },
  { value: 'Thrifted',    label: 'Thrifted',     emoji: '♻️', description: 'Pre-loved, found at thrift',  color: 'text-violet-600 bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-700' },
  { value: 'Second Hand', label: 'Second Hand',  emoji: '🤝', description: 'Used, good condition',        color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700' },
  { value: 'Well Loved',  label: 'Well Loved',   emoji: '💛', description: 'Visible wear, charming',      color: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-700' },
  { value: 'For Parts',   label: 'For Parts',    emoji: '🔧', description: 'Damaged, sold as-is',         color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700' },
] as const;

type ItemCondition = typeof ITEM_CONDITIONS[number]['value'];
import { Listing, UserTier } from '../types';
import { compressImage } from '../utils/image';
import { cn } from '../utils/cn';

interface MarketplaceProps {
  user: User;
  userTier?: UserTier;
  onAddToCart: (item: Listing) => void;
  onDeleteItem?: (id: string, type: 'listing') => void;
}

export const Marketplace = ({ user, userTier, onAddToCart, onDeleteItem }: MarketplaceProps) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Added garmentDetails and sellerBio to state
  const [newListing, setNewListing] = useState({
    title: '',
    description: '',
    garmentDetails: '',
    sellerBio: '',
    price: '',
    category: '',
    imageUrl: '',
    qualityRating: 'Brand New'
  });

  useEffect(() => {
    const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Listing));
      setListings(lList);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'listings'));

    return () => unsubscribe();
  }, []);

  const handlePostListing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const sellerDoc = await getDoc(doc(db, 'users', user.uid));
      const sellerData = sellerDoc.exists() ? sellerDoc.data() : {};

      await addDoc(collection(db, 'listings'), {
        sellerId: user.uid,
        sellerName: user.displayName || 'Anonymous',
        sellerTier: userTier || 'basic',
        sellerRating: sellerData.sellerRating || 5.0,
        sellerReviewCount: sellerData.sellerReviewCount || 0,
        title: newListing.title,
        description: newListing.description,
        garmentDetails: newListing.garmentDetails, // Pushing detail to DB
        sellerBio: newListing.sellerBio,           // Pushing detail to DB
        price: parseFloat(newListing.price),
        category: newListing.category,
        imageUrl: newListing.imageUrl,
        qualityRating: newListing.qualityRating,
        status: 'available',
        createdAt: serverTimestamp()
      });
      setIsPosting(false);
      setNewListing({ title: '', description: '', garmentDetails: '', sellerBio: '', price: '', category: '', imageUrl: '', qualityRating: 'Brand New' });
    } catch (error) {
      console.error("Failed to post listing", error);
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (onDeleteItem) {
      onDeleteItem(id, 'listing');
    } else {
      try {
        await deleteDoc(doc(db, 'listings', id));
      } catch (error) {
        console.error("Failed to delete listing", error);
      }
    }
  };

  const handleAddToCartFromDetail = (listing: Listing) => {
    onAddToCart(listing);
    setSelectedListing(null);
  };

  const filteredListings = listings.filter(l => 
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCondition = (value: string) =>
    ITEM_CONDITIONS.find(c => c.value === value) ?? ITEM_CONDITIONS[0];

  return (
    <div className="space-y-12">
      {/* Marketplace Hero Banner */}
      <div className="relative rounded-[2.5rem] overflow-hidden mb-8 bg-orange dark:bg-[#724C00] border-2 border-primary dark:border-orange" style={{ minHeight: 200 }}>
        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 39px, var(--grid-color) 39px, var(--grid-color) 40px),
              repeating-linear-gradient(90deg, transparent, transparent 39px, var(--grid-color) 39px, var(--grid-color) 40px)
            `
          }}
        />
        <motion.div className="absolute -right-10 bottom-0 w-40 h-50 bg-primary/10 dark:bg-orange/10 rounded-full" />
        <motion.div className="absolute right-30 -bottom-4 w-40 h-30 bg-primary/10 dark:bg-orange/10 rounded-full rotate-40" />
        <motion.div className="absolute right-33 top-5 w-15 h-16 bg-primary/10 dark:bg-orange/10 rounded-full" />
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-primary dark:text-orange">
              <ShoppingBag size={14} className="text-primary dark:text-orange" />
              <span className="text-primary dark:text-orange text-xs font-bold uppercase tracking-[0.3em]">Conscious Market</span>
            </div>
            <h2 className="text-6xl md:text-7xl font-heading text-primary dark:text-cream-support leading-none">Marketplace</h2>
            <p className="text-dark/70 dark:text-orange text-sm font-medium max-w-xl">Give pre-loved fashion a second life. Buy and sell within our conscious community.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 dark:text-orange/60" size={18} />
              <input 
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card/80 backdrop-blur-md border border-border rounded-full pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text"
              />
            </div>
            <button 
              onClick={() => setIsPosting(true)}
              className="bg-primary dark:bg-orange text-bg dark:text-dark px-8 py-3.5 rounded-full font-heading text-xl flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl retro-shadow-marketplace"
            >
              <Plus size={20} />
              Sell Item
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {loading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse space-y-4">
              <div className="aspect-[4/5] bg-zinc-100 rounded-3xl" />
              <div className="h-4 bg-zinc-100 rounded w-2/3" />
              <div className="h-4 bg-zinc-100 rounded w-1/3" />
            </div>
          ))
        ) : filteredListings.length > 0 ? (
          filteredListings.map((listing) => (
            <motion.div 
              layout
              key={listing.id}
              className="group bg-card rounded-[2.5rem] border border-border overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer"
              onClick={() => setSelectedListing(listing)}
            >
              <div className="aspect-[4/5] relative overflow-hidden">
                <img 
                  src={listing.imageUrl} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  alt={listing.title} 
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-card/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-primary shadow-sm border border-border">
                    {listing.category}
                  </span>
                </div>
                {/* Hover overlay: show "View Details" cue */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <div className="bg-card text-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl">
                    <ExternalLink size={16} />
                    View Details
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-text group-hover:text-primary transition-colors line-clamp-1">{listing.title}</h3>
                    <p className="text-xs text-text-muted flex items-center gap-1 mt-1">
                      by <span className="font-medium text-text">{listing.sellerName}</span>
                      {listing.sellerTier === 'premium' && <Star size={10} className="text-amber-400 fill-amber-400" />}
                      {listing.sellerRating !== undefined && (
                        <span className="flex items-center gap-0.5 ml-1 text-amber-500 font-bold">
                          <Star size={10} fill="currentColor" />
                          {listing.sellerRating.toFixed(1)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-xl font-heading text-primary">
                    ${listing.price.toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(() => { const c = getCondition(typeof listing.qualityRating === 'string' ? listing.qualityRating : 'Brand New'); return (
                    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border', c.color)}>
                      <span>{c.emoji}</span>{c.label}
                    </span>
                  ); })()}
                </div>
                {listing.sellerId === user.uid && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteListing(listing.id); }}
                    className="w-full mt-2 py-2 text-xs font-bold text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} />
                    Remove Listing
                  </button>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-card-hover rounded-full flex items-center justify-center mx-auto text-text-muted">
              <Search size={40} />
            </div>
            <div className="space-y-1">
              <p className="text-xl font-bold text-text">No items found</p>
              <p className="text-text-muted">Try adjusting your search or category filters.</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Item Detail Popup ── */}
      <AnimatePresence>
        {selectedListing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={() => setSelectedListing(null)}
          >
            <motion.div
              initial={{ scale: 0.93, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.93, y: 24, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className="bg-card rounded-[2rem] max-w-5xl w-full shadow-2xl relative overflow-hidden my-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Accent bar */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-orange to-primary" />

              <div className="flex flex-col sm:flex-row max-h-[85vh] overflow-y-auto">
                {/* Image panel */}
                <div className="sm:w-[45%] aspect-[4/5] sm:aspect-auto relative flex-shrink-0 bg-card-hover">
                  <img
                    src={selectedListing.imageUrl}
                    alt={selectedListing.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Category badge */}
                  <span className="absolute top-4 left-4 bg-card/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-primary shadow-sm border border-border">
                    {selectedListing.category}
                  </span>
                </div>

                {/* Content panel */}
                <div className="flex-1 p-6 flex flex-col gap-5 overflow-y-auto">
                  {/* Close button & Price Header */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-heading text-primary leading-tight">{selectedListing.title}</h3>
                      <p className="text-3xl font-heading text-primary/90">${selectedListing.price.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => setSelectedListing(null)}
                      className="p-1.5 hover:bg-card-hover rounded-full transition-colors text-text-muted hover:text-text"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Condition */}
                  {(() => { const c = getCondition(typeof selectedListing.qualityRating === 'string' ? selectedListing.qualityRating : 'Brand New'); return (
                    <div className={cn('flex items-center gap-2.5 p-3 rounded-xl border', c.color)}>
                      <span className="text-xl leading-none">{c.emoji}</span>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Condition</p>
                        <p className="font-bold text-sm">{c.label} <span className="font-normal opacity-70">— {c.description}</span></p>
                      </div>
                    </div>
                  ); })()}

                  {/* Main descriptions block */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-1">
                        <Tag size={12} /> Overview
                      </p>
                      <p className="text-sm text-text leading-relaxed">
                        {selectedListing.description || 'No description provided.'}
                      </p>
                    </div>
                    
                    {/* NEW: Deep Details (Garment Measurements) */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-1">
                        <Package size={12} /> Garment Details & Measurements
                      </p>
                      <p className="text-sm text-text leading-relaxed bg-card-hover p-3 rounded-xl">
                        {/* @ts-ignore - To support older Listing interfaces lacking this property temporarily */}
                        {selectedListing.garmentDetails || 'No precise measurements or detailed fabric information provided for this item.'}
                      </p>
                    </div>
                  </div>

                  {/* Seller info */}
                  <div className="space-y-1.5 mt-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-1">
                      <UserIcon size={12} /> About The Seller
                    </p>
                    <div className="flex flex-col gap-2.5 p-4 bg-card-hover rounded-xl border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <UserIcon size={18} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-text truncate">{selectedListing.sellerName}</p>
                            {selectedListing.sellerTier === 'premium' && (
                              <Star size={11} className="text-amber-400 fill-amber-400 flex-shrink-0" />
                            )}
                          </div>
                          {selectedListing.sellerRating !== undefined && (
                            <div className="flex items-center gap-1 text-amber-500 font-bold text-xs mt-0.5">
                              <Star size={12} fill="currentColor" />
                              {selectedListing.sellerRating.toFixed(1)}
                              {selectedListing.sellerReviewCount > 0 && (
                                <span className="text-text-muted text-[10px] font-normal ml-0.5">
                                  ({selectedListing.sellerReviewCount} reviews)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed pl-1 italic">
                        {/* @ts-ignore */}
                        "{selectedListing.sellerBio || 'This seller has not provided a bio.'}"
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-border">
                    {selectedListing.sellerId !== user.uid ? (
                      <button
                        onClick={() => handleAddToCartFromDetail(selectedListing)}
                        className="w-full bg-primary text-bg py-3.5 rounded-xl font-heading text-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-lg retro-shadow-pink"
                      >
                        <ShoppingBag size={18} />
                        Add to Cart
                      </button>
                    ) : (
                      <button
                        onClick={() => { setSelectedListing(null); handleDeleteListing(selectedListing.id); }}
                        className="w-full py-3.5 text-sm font-bold text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-200"
                      >
                        <Trash2 size={16} />
                        Remove My Listing
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Post Listing Popup ── */}
      <AnimatePresence>
        {isPosting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsPosting(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-orange" />
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-heading text-primary">Sell an Item</h3>
                <button onClick={() => setIsPosting(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handlePostListing} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Title</label>
                    <input 
                      required
                      type="text"
                      value={newListing.title}
                      onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
                      className="w-full bg-card-hover border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Vintage Denim Jacket"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Price ($)</label>
                    <input 
                      required
                      type="number"
                      value={newListing.price}
                      onChange={(e) => setNewListing({ ...newListing, price: e.target.value })}
                      className="w-full bg-card-hover border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="45"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Category</label>
                  <select 
                    required
                    value={newListing.category}
                    onChange={(e) => setNewListing({ ...newListing, category: e.target.value })}
                    className="w-full bg-card-hover border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                  >
                    <option value="">Select Category</option>
                    <option value="Tops">Tops</option>
                    <option value="Bottoms">Bottoms</option>
                    <option value="Outerwear">Outerwear</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Shoes">Shoes</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">Overview Description</label>
                  <textarea 
                    required
                    value={newListing.description}
                    onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                    className="w-full bg-card-hover border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[80px]"
                    placeholder="Tell us about the item's history and general condition..."
                  />
                </div>

                {/* NEW: Detailed Info Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1 flex items-center gap-1">
                    <Package size={12} /> Garment Details & Measurements
                  </label>
                  <textarea 
                    required
                    value={newListing.garmentDetails}
                    onChange={(e) => setNewListing({ ...newListing, garmentDetails: e.target.value })}
                    className="w-full bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all min-h-[80px]"
                    placeholder="E.g., Pit-to-pit: 20 inches, Length: 28 inches. Material: 100% Cotton. Made in Italy."
                  />
                </div>

                {/* NEW: Seller Bio Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1 flex items-center gap-1">
                    <UserIcon size={12} /> About You (Seller Profile)
                  </label>
                  <textarea 
                    required
                    value={newListing.sellerBio}
                    onChange={(e) => setNewListing({ ...newListing, sellerBio: e.target.value })}
                    className="w-full bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all min-h-[80px]"
                    placeholder="Hi! I'm a fashion enthusiast who loves finding vintage 90s streetwear..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">Item Condition</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ITEM_CONDITIONS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setNewListing({ ...newListing, qualityRating: c.value })}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2 rounded-2xl border-2 text-left transition-all',
                          newListing.qualityRating === c.value
                            ? cn(c.color, 'border-current scale-[1.02] shadow-sm')
                            : 'bg-card-hover border-border hover:border-primary/30 text-text'
                        )}
                      >
                        <span className="text-xl leading-none mt-0.5">{c.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold leading-tight">{c.label}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-1.5 pb-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">Image URL</label>
                  <div className="flex gap-2">
                    <input
                      required
                      type="url"
                      value={newListing.imageUrl}
                      onChange={(e) => setNewListing({ ...newListing, imageUrl: e.target.value })}
                      className="flex-1 bg-card-hover border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="https://..."
                    />
                    <label className="bg-zinc-100 p-3 rounded-2xl cursor-pointer hover:bg-zinc-200 transition-colors">
                      <Camera size={24} className="text-zinc-500" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = async () => {
                              const compressed = await compressImage(reader.result as string, 800, 800, 0.7);
                              setNewListing({ ...newListing, imageUrl: compressed });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-primary text-bg py-4 rounded-full font-heading text-xl hover:scale-[1.02] transition-all shadow-xl retro-shadow-pink"
                >
                  Post Listing
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};