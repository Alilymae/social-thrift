import React, { useState, useEffect, useRef } from 'react';
import { User, updateProfile } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  doc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  documentId,
  addDoc,
  deleteDoc,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shirt, Layout, Edit2, Check, Heart, Camera, Image as ImageIcon, 
  Lock, Globe, UserPlus, UserMinus, X as XIcon, Calendar, Clock, 
  Download, Maximize2, Star, Zap, Sparkles, Grid3x3, ShoppingBag,
  MessageSquare
} from 'lucide-react';
import { Garment, Outfit, UserProfile, SavedRecommendation, Order } from '../types';
import { compressImage, downloadOutfit } from '../utils/image';

interface ProfileViewProps {
  user: User;
  targetUserId?: string;
  onUpgrade?: () => void;
  onRateSeller?: (orderId: string, sellerId: string, sellerName: string) => void;
}

// Animation variants
const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } }
};

const fadeIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } }
};

// Reusable stat pill
const StatPill = ({ value, label }: { value: number; label: string }) => (
  <motion.div
    variants={fadeUp}
    className="flex flex-col items-center gap-0.5 px-4 py-3 rounded-2xl bg-primary/5 hover:bg-primary/10 transition-colors cursor-default"
  >
    <span className="text-xl font-bold text-text tabular-nums">{value}</span>
    <span className="text-[10px] text-text/40 uppercase tracking-widest font-medium whitespace-nowrap">{label}</span>
  </motion.div>
);

// Empty state
const EmptyState = ({ icon: Icon, message }: { icon: React.ElementType; message: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.96 }}
    animate={{ opacity: 1, scale: 1 }}
    className="py-20 flex flex-col items-center gap-3 bg-bg rounded-3xl border border-dashed border-primary/10"
  >
    <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center">
      <Icon size={20} className="text-text/30" />
    </div>
    <p className="text-text/40 text-sm italic">{message}</p>
  </motion.div>
);

export const ProfileView = ({ user, targetUserId, onUpgrade, onRateSeller }: ProfileViewProps) => {
  const uid = targetUserId || user.uid;
  const isOwner = uid === user.uid;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userOutfits, setUserOutfits] = useState<Outfit[]>([]);
  const [favorites, setFavorites] = useState<Outfit[]>([]);
  const [savedRecommendations, setSavedRecommendations] = useState<SavedRecommendation[]>([]);
  const [userGarments, setUserGarments] = useState<Garment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<SavedRecommendation | null>(null);
  const [viewingOutfit, setViewingOutfit] = useState<Outfit | null>(null);
  const [isFullscreenRec, setIsFullscreenRec] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [bio, setBio] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'wardrobe' | 'outfits' | 'favorites' | 'lab' | 'orders'>('wardrobe');
  const coverInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);

    const unsubscribeProfile = onSnapshot(doc(db, 'users', uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(data);
        setBio(data.bio || '');
        setDisplayName(data.displayName || '');
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${uid}`));

    // Separate effect-like logic for favorites to ensure proper cleanup
    let unsubscribeFavorites: (() => void) | null = null;

    const unsubscribeProfileForFavs = onSnapshot(doc(db, 'users', uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        if (data.favorites && data.favorites.length > 0) {
          // Cleanup previous favorites subscription if it exists
          if (unsubscribeFavorites) unsubscribeFavorites();

          const favQuery = query(collection(db, 'outfits'), where(documentId(), 'in', data.favorites));
          unsubscribeFavorites = onSnapshot(favQuery, (snapshot) => {
            setFavorites(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Outfit)));
          }, (error) => {
            // Only handle error if user is still logged in
            if (user) {
              handleFirestoreError(error, OperationType.GET, 'outfits/favorites');
            }
          });
        } else {
          setFavorites([]);
        }
      }
    }, (error) => {
      if (user) {
        handleFirestoreError(error, OperationType.GET, `users/${uid}/favorites_sync`);
      }
    });

    const followersQuery = query(collection(db, 'follows'), where('followingId', '==', uid));
    const unsubscribeFollowers = onSnapshot(followersQuery, (snapshot) => {
      setFollowersCount(snapshot.size);
      setIsFollowing(snapshot.docs.some(d => d.data().followerId === user.uid));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'follows/followers'));

    const followingQuery = query(collection(db, 'follows'), where('followerId', '==', uid));
    const unsubscribeFollowing = onSnapshot(followingQuery, (snapshot) => {
      setFollowingCount(snapshot.size);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'follows/following'));

    const outfitsQuery = isOwner
      ? query(collection(db, 'outfits'), where('authorId', '==', uid))
      : query(collection(db, 'outfits'), where('authorId', '==', uid), where('isPublic', '==', true));
    const unsubscribeOutfits = onSnapshot(outfitsQuery, (snapshot) => {
      const oList = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Outfit));
      oList.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setUserOutfits(oList);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'outfits'));

    const garmentsQuery = query(collection(db, 'garments'), where('ownerId', '==', uid));
    const unsubscribeGarments = onSnapshot(garmentsQuery, (snapshot) => {
      const gList = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Garment));
      gList.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setUserGarments(gList);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'garments'));

    const recommendationsQuery = isOwner
      ? query(collection(db, 'saved_recommendations'), where('userId', '==', uid))
      : query(collection(db, 'saved_recommendations'), where('userId', '==', uid), where('isPublic', '==', true));
    const unsubscribeRecommendations = onSnapshot(recommendationsQuery, (snapshot) => {
      const rList = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as SavedRecommendation));
      rList.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setSavedRecommendations(rList);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'saved_recommendations'));

    const ordersQuery = query(collection(db, 'orders'), where('buyerId', '==', uid), orderBy('createdAt', 'desc'));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      setOrders(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Order)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'orders'));

    return () => {
      unsubscribeProfile();
      unsubscribeProfileForFavs();
      if (unsubscribeFavorites) unsubscribeFavorites();
      unsubscribeOutfits();
      unsubscribeGarments();
      unsubscribeRecommendations();
      unsubscribeFollowers();
      unsubscribeFollowing();
      unsubscribeOrders();
    };
  }, [uid, user.uid]);

  const handleSaveBio = async () => {
    try {
      await updateDoc(doc(db, 'users', user.uid), { bio });
      setIsEditingBio(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { 
        displayName: displayName.trim(),
        displayNameLower: displayName.trim().toLowerCase()
      });
      await updateProfile(user, { displayName: displayName.trim() });
      setIsEditingName(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const toggleOutfitPrivacy = async (outfitId: string, currentStatus: boolean) => {
    if (!isOwner) return;
    try {
      await updateDoc(doc(db, 'outfits', outfitId), { isPublic: !currentStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `outfits/${outfitId}`);
    }
  };

  const toggleRecommendationPrivacy = async (recId: string, currentStatus: boolean) => {
    if (!isOwner) return;
    try {
      await updateDoc(doc(db, 'saved_recommendations', recId), { isPublic: !currentStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `saved_recommendations/${recId}`);
    }
  };

  const deleteRecommendation = async (recId: string) => {
    if (!isOwner) return;
    if (!confirm('Delete this recommendation?')) return;
    try {
      await deleteDoc(doc(db, 'saved_recommendations', recId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `saved_recommendations/${recId}`);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result as string, 1200, 400, 0.7);
          await updateDoc(doc(db, 'users', user.uid), { coverPhotoURL: compressed });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
        } finally {
          setIsUploadingCover(false);
        }
      };
      reader.onerror = () => setIsUploadingCover(false);
      reader.readAsDataURL(file);
    } catch {
      setIsUploadingCover(false);
    }
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingProfile(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result as string, 400, 400, 0.7);
          await updateDoc(doc(db, 'users', user.uid), { photoURL: compressed });
          await updateProfile(user, { photoURL: compressed });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
        } finally {
          setIsUploadingProfile(false);
        }
      };
      reader.onerror = () => setIsUploadingProfile(false);
      reader.readAsDataURL(file);
    } catch {
      setIsUploadingProfile(false);
    }
  };

  const handleFollow = async () => {
    if (!user || isOwner) return;
    try {
      await addDoc(collection(db, 'follows'), { followerId: user.uid, followingId: uid, createdAt: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'follows');
    }
  };

  const handleUnfollow = async () => {
    if (!user || isOwner) return;
    try {
      const q = query(collection(db, 'follows'), where('followerId', '==', user.uid), where('followingId', '==', uid));
      const snapshot = await getDocs(q);
      await Promise.all(snapshot.docs.map(d => deleteDoc(doc(db, 'follows', d.id))));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'follows');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary"
      />
    </div>
  );

  const tabs = [
    { id: 'wardrobe' as const, label: 'Wardrobe', icon: Shirt, count: userGarments.length },
    { id: 'outfits' as const, label: 'Outfits', icon: Layout, count: userOutfits.length },
    { id: 'favorites' as const, label: 'Favorites', icon: Heart, count: favorites.length },
    { id: 'lab' as const, label: 'AI Lab', icon: Sparkles, count: savedRecommendations.length },
    ...(isOwner ? [{ id: 'orders' as const, label: 'Orders', icon: ShoppingBag, count: orders.length }] : []),
  ];

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-5 pb-16">

      {/* ── HERO HEADER ── */}
      <motion.section variants={fadeIn} className="relative rounded-3xl overflow-hidden border border-primary/5 shadow-sm bg-card">

        {/* Cover */}
        <div className="relative h-52 md:h-64 bg-bg overflow-hidden">
          {profile?.coverPhotoURL ? (
            <motion.img
              initial={{ scale: 1.06 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] as const }}
              src={profile.coverPhotoURL}
              className="w-full h-full object-cover"
              alt="Cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center relative">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `radial-gradient(ellipse at 25% 60%, var(--color-pink, #ec4899) 0%, transparent 55%),
                                    radial-gradient(ellipse at 75% 30%, var(--color-orange, #f97316) 0%, transparent 50%)`
                }}
              />
              <ImageIcon size={40} className="text-text/20 relative z-10" />
            </div>
          )}

          {/* Bottom gradient fade into card */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-card to-transparent pointer-events-none" />

          {isOwner && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={isUploadingCover}
              className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md flex items-center gap-2 text-xs px-4 py-2 shadow-lg z-20 disabled:opacity-50 transition-colors"
            >
              <Camera size={14} />
              {isUploadingCover ? 'Uploading...' : 'Change Cover'}
            </motion.button>
          )}
          <input type="file" ref={coverInputRef} onChange={handleCoverUpload} className="hidden" accept="image/*" />
        </div>

        {/* Profile info */}
        <div className="px-6 md:px-10 pb-8 -mt-14 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end gap-5">

            {/* Avatar */}
            <div className="relative group/avatar flex-shrink-0">
              <motion.div
                initial={{ scale: 0.78, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }}
                className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-card shadow-xl overflow-hidden bg-card"
              >
                <img
                  src={profile?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                  className="w-full h-full object-cover"
                  alt="Profile"
                />
              </motion.div>
              {isOwner && (
                <button
                  className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[2px]"
                  onClick={() => profileInputRef.current?.click()}
                  disabled={isUploadingProfile}
                >
                  <div className="bg-black/50 p-2.5 rounded-xl"><Camera size={20} /></div>
                </button>
              )}
              <input type="file" ref={profileInputRef} onChange={handleProfilePhotoUpload} className="hidden" accept="image/*" />
            </div>

            {/* Name / bio / actions */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="bg-bg border border-primary/10 rounded-xl px-3 py-1 text-xl font-heading text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      autoFocus
                    />
                    <button onClick={handleSaveName} className="p-1.5 bg-primary text-bg rounded-lg hover:scale-105 transition-all">
                      <Check size={14} />
                    </button>
                    <button onClick={() => { setIsEditingName(false); setDisplayName(profile?.displayName || ''); }} className="p-1.5 bg-zinc-100 text-zinc-400 rounded-lg hover:bg-zinc-200 transition-all">
                      <XIcon size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-heading text-primary truncate">
                      {profile?.displayName || user.displayName}
                    </motion.h2>
                    {isOwner && (
                      <button onClick={() => setIsEditingName(true)} className="p-1 text-text/30 hover:text-primary transition-colors">
                        <Edit2 size={14} />
                      </button>
                    )}
                  </div>
                )}

                {profile?.tier === 'premium' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.45, type: 'spring', stiffness: 300 }}
                    className="bg-orange text-primary text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow border border-primary/10"
                  >
                    <Star size={10} fill="currentColor" />
                  </motion.div>
                )}

                {profile?.sellerRating !== undefined && (
                  <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-full text-[10px] font-bold border border-amber-100">
                    <Star size={10} fill="currentColor" />
                    {profile.sellerRating.toFixed(1)}
                    <span className="text-amber-400 opacity-50 ml-0.5">({profile.sellerReviewCount || 0})</span>
                  </div>
                )}

                {!isOwner && (
                  <motion.button
                    variants={fadeUp}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={isFollowing ? handleUnfollow : handleFollow}
                    className={`px-5 py-1.5 rounded-full font-bold text-sm flex items-center gap-1.5 transition-all ${
                      isFollowing ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-primary text-bg shadow-lg'
                    }`}
                  >
                    {isFollowing ? <UserMinus size={14} /> : <UserPlus size={14} />}
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </motion.button>
                )}

                {isOwner && (
                  <motion.button
                    variants={fadeUp}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onUpgrade}
                    className={`px-5 py-1.5 rounded-full font-bold text-sm shadow-lg flex items-center gap-1.5 ${
                      profile?.tier === 'premium'
                        ? 'bg-orange text-primary'
                        : 'bg-orange text-primary'
                    }`}
                  >
                    <Zap size={14} /> {profile?.tier === 'premium' ? 'Manage Plan' : 'Upgrade'}
                  </motion.button>
                )}
              </div>

              <motion.p variants={fadeUp} className="text-text/40 text-xs font-medium flex items-center gap-1 mb-3">
                <Calendar size={12} />
                Member since {profile?.createdAt
                  ? ((profile.createdAt as any).toDate?.()?.toLocaleDateString() || new Date(profile.createdAt as any).toLocaleDateString())
                  : 'recently'}
              </motion.p>

              <motion.div variants={fadeUp}>
                {isEditingBio ? (
                  <div className="flex gap-2 max-w-lg">
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full bg-bg border border-primary/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-text resize-none"
                      placeholder="Tell us about your style..."
                      rows={2}
                      autoFocus
                    />
                    <button onClick={handleSaveBio} className="self-end p-2.5 bg-primary text-bg rounded-xl hover:scale-105 transition-all flex-shrink-0">
                      <Check size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 max-w-lg">
                    <p className="text-text/60 text-sm italic leading-relaxed">
                      {bio || (isOwner ? 'No bio yet — add one to express your style!' : 'No bio yet.')}
                    </p>
                    {isOwner && (
                      <button onClick={() => setIsEditingBio(true)} className="p-1 text-text/30 hover:text-primary transition-colors flex-shrink-0 mt-0.5">
                        <Edit2 size={13} />
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Stats */}
            <motion.div variants={staggerContainer} className="flex gap-2 flex-wrap md:justify-end">
              <StatPill value={followersCount} label="Followers" />
              <StatPill value={followingCount} label="Following" />
              <StatPill value={userGarments.length} label="Garments" />
              <StatPill value={userOutfits.length} label="Outfits" />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ── BENTO STATS ── */}
      <motion.div variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Wardrobe items', value: userGarments.length, icon: Shirt, color: 'text-orange', bg: 'bg-orange/10' },
          { label: 'Outfits styled', value: userOutfits.length, icon: Grid3x3, color: 'text-pink', bg: 'bg-pink/10' },
          { label: 'Liked outfits', value: favorites.length, icon: Heart, color: 'text-red-400', bg: 'bg-red-400/10' },
          { label: 'AI sessions', value: savedRecommendations.length, icon: Sparkles, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            variants={fadeUp}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="bg-card border border-primary/5 rounded-2xl p-4 flex items-center gap-3 shadow-sm"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
              <stat.icon size={18} className={stat.color} />
            </div>
            <div>
              <p className="text-xl font-bold text-text tabular-nums">{stat.value}</p>
              <p className="text-[10px] text-text/40 uppercase tracking-wider leading-tight">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── TABS ── */}
      <motion.div variants={fadeUp} className="flex gap-1 bg-bg rounded-2xl p-1 border border-primary/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-bold transition-colors ${
              activeTab === tab.id ? 'text-primary' : 'text-text/40 hover:text-text/70'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-bg"
                className="absolute inset-0 bg-card rounded-xl shadow-sm border border-primary/5"
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
            <tab.icon size={15} className="relative z-10 flex-shrink-0" />
            <span className="relative z-10 hidden sm:inline">{tab.label}</span>
            {tab.count > 0 && (
              <span className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-text/10 text-text/40'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* ── TAB CONTENT ── */}
      <AnimatePresence mode="wait">

        {/* WARDROBE */}
        {activeTab === 'wardrobe' && (
          <motion.div
            key="wardrobe"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }}
          >
            {userGarments.length === 0 ? <EmptyState icon={Shirt} message="No garments in wardrobe yet." /> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {userGarments.map((g, i) => (
                  <motion.div
                    key={g.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.035, duration: 0.35 }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className="group aspect-[3/4] rounded-2xl overflow-hidden border border-primary/5 bg-bg relative shadow-sm"
                  >
                    <img src={g.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Garment" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* OUTFITS */}
        {activeTab === 'outfits' && (
          <motion.div
            key="outfits"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }}
            className="space-y-3"
          >
            {userOutfits.length === 0 ? <EmptyState icon={Layout} message="No outfits created yet." /> : (
              userOutfits.map((outfit, i) => (
                <motion.div
                  key={outfit.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.35 }}
                  whileHover={{ x: 4, transition: { duration: 0.2 } }}
                  className="bg-card rounded-2xl p-4 border border-primary/5 flex gap-4 items-center group"
                >
                  <div
                    className="w-16 h-16 md:w-20 md:h-20 rounded-xl relative overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: outfit.backgroundColor || 'var(--bg)' }}
                  >
                    {outfit.items.slice(0, 3).map((item, idx) => (
                      <img
                        key={idx}
                        src={item.imageUrl}
                        className="absolute w-full h-full object-contain opacity-80"
                        style={{ transform: `scale(${0.5 + idx * 0.1})` }}
                        alt="Item"
                      />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-text">Outfit #{outfit.id.slice(-4)}</p>
                    <p className="text-xs text-text/40 truncate">
                      {outfit.items.length} items
                      {outfit.createdAt && typeof outfit.createdAt.toDate === 'function'
                        ? ` · ${outfit.createdAt.toDate().toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      outfit.isPublic ? 'bg-primary/10 text-primary' : 'bg-text/5 text-text/40'
                    }`}>
                      {outfit.isPublic ? <Globe size={10} /> : <Lock size={10} />}
                      {outfit.isPublic ? 'Public' : 'Private'}
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => toggleOutfitPrivacy(outfit.id, outfit.isPublic)}
                        className="text-[10px] font-bold text-text/30 hover:text-primary uppercase tracking-widest transition-colors"
                      >
                        {outfit.isPublic ? 'Make Private' : 'Make Public'}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* FAVORITES */}
        {activeTab === 'favorites' && (
          <motion.div
            key="favorites"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }}
          >
            {favorites.length === 0 ? <EmptyState icon={Heart} message="No favorites saved yet." /> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map((outfit, i) => (
                  <motion.div
                    key={outfit.id}
                    initial={{ opacity: 0, scale: 0.93 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06, duration: 0.35 }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className="bg-card rounded-2xl border border-primary/5 overflow-hidden shadow-sm group"
                  >
                    <div className="aspect-square relative overflow-hidden" style={{ backgroundColor: outfit.backgroundColor || 'var(--bg)' }}>
                      <div className="absolute inset-0">
                        {outfit.items.map((item, idx) => (
                          <img
                            key={idx}
                            src={item.imageUrl}
                            className="absolute"
                            style={{
                              left: `${(item.x / 800) * 100}%`,
                              top: `${(item.y / 800) * 100}%`,
                              width: `${((item.width || 200) / 800) * 100}%`,
                              height: `${((item.height || 200) / 800) * 100}%`,
                              transformOrigin: '0 0',
                              transform: `scale(${item.scaleX ?? item.scale}, ${item.scaleY ?? item.scale}) rotate(${item.rotation}deg)`,
                              objectFit: 'cover',
                              borderRadius: '4px'
                            }}
                            alt="Outfit item"
                          />
                        ))}
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    </div>
                    <div className="p-3 flex items-center gap-2 border-t border-primary/5">
                      <img
                        src={outfit.authorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${outfit.authorId}`}
                        className="w-5 h-5 rounded-full border border-primary/10"
                        alt="Author"
                      />
                      <p className="text-[11px] font-bold text-text/70 truncate flex-1">{outfit.authorName}</p>
                      <Heart size={11} className="text-red-400 flex-shrink-0" fill="currentColor" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* AI LAB */}
        {activeTab === 'lab' && (
          <motion.div
            key="lab"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }}
          >
            {savedRecommendations.filter(r => isOwner || r.isPublic).length === 0 ? (
              <EmptyState icon={Sparkles} message="No AI Lab recommendations saved yet." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {savedRecommendations.map((rec, i) => {
                  if (!isOwner && !rec.isPublic) return null;
                  return (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, scale: 0.93 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.06, duration: 0.35 }}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                      className="bg-card rounded-3xl border border-primary/5 overflow-hidden shadow-sm group"
                    >
                      <div
                        className="aspect-video relative overflow-hidden cursor-pointer"
                        onClick={() => setSelectedRecommendation(rec)}
                      >
                        <img
                          src={rec.imageUrl}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          alt="Recommendation"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        {isOwner && (
                          <div className="absolute top-3 right-3 flex flex-col items-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                              rec.isPublic ? 'bg-primary/90 text-bg' : 'bg-black/70 text-white'
                            }`}>
                              {rec.isPublic ? <Globe size={9} /> : <Lock size={9} />}
                              {rec.isPublic ? 'Public' : 'Private'}
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleRecommendationPrivacy(rec.id, rec.isPublic); }}
                              className="px-2.5 py-1 bg-white/90 hover:bg-white text-zinc-800 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all"
                            >
                              Switch
                            </button>
                          </div>
                        )}
                        <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-[11px] font-bold uppercase tracking-widest">View →</span>
                        </div>
                      </div>
                      <div className="p-5 space-y-2">
                        <p className="text-sm text-text/60 font-medium leading-relaxed italic line-clamp-2">
                          "{rec.summary}"
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-text/30 uppercase tracking-widest">
                            {rec.createdAt && typeof rec.createdAt.toDate === 'function'
                              ? rec.createdAt.toDate().toLocaleDateString() : 'Just now'}
                          </span>
                          <div className="flex items-center gap-3">
                            {isOwner && (
                              <button
                                onClick={() => deleteRecommendation(rec.id)}
                                className="text-[10px] text-red-400/50 hover:text-red-400 uppercase tracking-widest font-bold transition-colors"
                              >
                                Delete
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedRecommendation(rec)}
                              className="text-primary text-[10px] font-bold uppercase tracking-widest hover:underline"
                            >
                              Expand
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ORDERS */}
        {activeTab === 'orders' && isOwner && (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }}
            className="space-y-4"
          >
            {orders.length === 0 ? <EmptyState icon={ShoppingBag} message="No orders yet." /> : (
              orders.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.35 }}
                  className="bg-card rounded-3xl p-5 border border-primary/5 flex flex-col sm:flex-row gap-6 items-center shadow-sm"
                >
                  <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border border-primary/5">
                    <img src={order.imageUrl} className="w-full h-full object-cover" alt={order.title} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <h4 className="font-bold text-text truncate">{order.title}</h4>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-text/40">
                      Order #{order.id.slice(-6).toUpperCase()} · {order.createdAt && typeof order.createdAt.toDate === 'function' ? order.createdAt.toDate().toLocaleDateString() : 'Just now'}
                    </p>
                    <p className="text-primary font-bold">${order.price.toFixed(2)}</p>
                  </div>
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => onRateSeller?.(order.id, order.sellerId, 'Seller')}
                      className="px-6 py-2.5 bg-primary text-bg rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-lg"
                    >
                      <MessageSquare size={14} />
                      Rate Seller
                    </button>
                    <button className="px-6 py-2.5 bg-bg text-text/40 rounded-xl font-bold text-xs border border-primary/5 hover:bg-primary/5 transition-colors">
                      View Details
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODALS ── */}
      <AnimatePresence>
        {viewingOutfit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setViewingOutfit(null)}
          >
            <button
              onClick={() => setViewingOutfit(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors backdrop-blur-md"
            >
              <XIcon size={20} />
            </button>
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full max-w-4xl aspect-square bg-white rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0" style={{ backgroundColor: viewingOutfit.backgroundColor || '#ffffff' }}>
                {viewingOutfit.items.map((item, i) => (
                  <img
                    key={i}
                    src={item.imageUrl}
                    className="absolute"
                    style={{
                      left: `${(item.x / 800) * 100}%`,
                      top: `${(item.y / 800) * 100}%`,
                      width: `${((item.width || 200) / 800) * 100}%`,
                      height: `${((item.height || 200) / 800) * 100}%`,
                      transformOrigin: '0 0',
                      transform: `scale(${item.scaleX ?? item.scale}, ${item.scaleY ?? item.scale}) rotate(${item.rotation}deg)`,
                      objectFit: 'cover',
                      borderRadius: '4px'
                    }}
                    alt="Outfit item"
                  />
                ))}
              </div>
            </motion.div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={(e) => { e.stopPropagation(); downloadOutfit(viewingOutfit); }}
                className="bg-white text-zinc-900 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-100 transition-colors shadow-xl"
              >
                <Download size={18} /> Download
              </motion.button>
            </div>
          </motion.div>
        )}

        {selectedRecommendation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { setSelectedRecommendation(null); setIsFullscreenRec(false); }}
          >
            <motion.div
              initial={{ scale: 0.88, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.88, y: 24, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-card rounded-[2rem] overflow-hidden max-w-2xl w-full shadow-2xl border border-primary/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`relative ${isFullscreenRec ? 'h-[75vh]' : 'aspect-video'} bg-bg transition-all duration-500`}>
                <img
                  src={selectedRecommendation.imageUrl}
                  className={`w-full h-full ${isFullscreenRec ? 'object-contain' : 'object-cover'} cursor-zoom-in`}
                  alt="Recommendation"
                  onClick={() => setIsFullscreenRec(!isFullscreenRec)}
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  {[
                    {
                      icon: Download, title: 'Download',
                      action: () => { const a = document.createElement('a'); a.href = selectedRecommendation.imageUrl; a.download = `rec-${selectedRecommendation.id}.jpg`; a.click(); }
                    },
                    { icon: Maximize2, title: isFullscreenRec ? 'Collapse' : 'Expand', action: () => setIsFullscreenRec(!isFullscreenRec) },
                    { icon: XIcon, title: 'Close', action: () => { setSelectedRecommendation(null); setIsFullscreenRec(false); } },
                  ].map(({ icon: Icon, action, title }) => (
                    <motion.button
                      key={title}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => { e.stopPropagation(); action(); }}
                      className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-colors"
                      title={title}
                    >
                      <Icon size={17} />
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="p-7 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedRecommendation.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedRecommendation.userId}`}
                      className="w-9 h-9 rounded-xl border border-primary/10"
                      alt={selectedRecommendation.userName}
                    />
                    <div>
                      <p className="font-bold text-sm text-text">{selectedRecommendation.userName}</p>
                      <p className="text-[10px] text-text/40 uppercase tracking-widest">AI Lab</p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-text/40 uppercase tracking-widest space-y-0.5">
                    <div className="flex items-center justify-end gap-1">
                      <Calendar size={11} />
                      {selectedRecommendation.createdAt && typeof selectedRecommendation.createdAt.toDate === 'function'
                        ? selectedRecommendation.createdAt.toDate().toLocaleDateString() : 'Today'}
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <Clock size={11} />
                      {selectedRecommendation.createdAt && typeof selectedRecommendation.createdAt.toDate === 'function'
                        ? selectedRecommendation.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </div>
                  </div>
                </div>

                <div className="bg-bg rounded-2xl p-5 border border-primary/5">
                  <p className="text-base text-text/70 font-medium leading-relaxed italic text-center">
                    "{selectedRecommendation.summary}"
                  </p>
                </div>

                <div className="flex justify-center gap-3">
                  {isOwner && (
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        if (confirm('Delete this recommendation?')) {
                          deleteRecommendation(selectedRecommendation.id);
                          setSelectedRecommendation(null);
                        }
                      }}
                      className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm shadow"
                    >
                      Delete
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setSelectedRecommendation(null); setIsFullscreenRec(false); }}
                    className="px-6 py-2.5 bg-primary text-bg rounded-xl font-bold text-sm shadow"
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};