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
import { ShoppingBag, Plus, X, Tag, DollarSign, Search, Trash2, ExternalLink, Star, Camera } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [newListing, setNewListing] = useState({
    title: '',
    description: '',
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
      // Fetch current seller rating to include in listing
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
        price: parseFloat(newListing.price),
        category: newListing.category,
        imageUrl: newListing.imageUrl,
        qualityRating: newListing.qualityRating,
        status: 'available',
        createdAt: serverTimestamp()
      });
      setIsPosting(false);
      setNewListing({ title: '', description: '', price: '', category: '', imageUrl: '', qualityRating: 'Brand New' });
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

  const filteredListings = listings.filter(l => 
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              className="group bg-card rounded-[2.5rem] border border-border overflow-hidden hover:shadow-2xl transition-all duration-500"
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
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button 
                    onClick={() => onAddToCart(listing)}
                    className="bg-card text-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-xl"
                  >
                    <ShoppingBag size={18} />
                    Add to Cart
                  </button>
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
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={12} 
                        className={cn(
                          "transition-colors",
                          i < (typeof listing.qualityRating === 'number' ? listing.qualityRating : 5) 
                            ? "text-amber-400 fill-amber-400" 
                            : "text-zinc-200"
                        )} 
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    {typeof listing.qualityRating === 'string' ? listing.qualityRating : 'Condition'}
                  </span>
                </div>
                {listing.sellerId === user.uid && (
                  <button 
                    onClick={() => handleDeleteListing(listing.id)}
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
              className="bg-card rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-orange" />
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-heading text-primary">Sell an Item</h3>
                <button onClick={() => setIsPosting(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handlePostListing} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">Title</label>
                      <input 
                        required
                        type="text"
                        value={newListing.title}
                        onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
                        className="w-full bg-card-hover border border-border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="Vintage Denim Jacket"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">Price ($)</label>
                      <input 
                        required
                        type="number"
                        value={newListing.price}
                        onChange={(e) => setNewListing({ ...newListing, price: e.target.value })}
                        className="w-full bg-card-hover border border-border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="45"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">Category</label>
                    <select 
                      required
                      value={newListing.category}
                      onChange={(e) => setNewListing({ ...newListing, category: e.target.value })}
                      className="w-full bg-card-hover border border-border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
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
                    <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">Description</label>
                    <textarea 
                      required
                      value={newListing.description}
                      onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                      className="w-full bg-card-hover border border-border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px]"
                      placeholder="Tell us about the item's history and condition..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">Image URL</label>
                    <div className="flex gap-2">
                      <input 
                        required
                        type="url"
                        value={newListing.imageUrl}
                        onChange={(e) => setNewListing({ ...newListing, imageUrl: e.target.value })}
                        className="flex-1 bg-card-hover border border-border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
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
                </div>

                <button 
                  type="submit"
                  className="w-full bg-primary text-bg py-5 rounded-2xl font-heading text-2xl hover:scale-[1.02] transition-all shadow-xl retro-shadow-pink"
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
