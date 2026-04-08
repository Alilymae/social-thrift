import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  updateDoc,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { Garment, Outfit, OutfitItem } from './types';
import { Stage, Layer, Rect } from 'react-konva';
import ReactMarkdown from 'react-markdown';
import { 
  Camera, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Heart, 
  Sparkles, 
  Shirt, 
  Layout, 
  Users,
  ChevronRight,
  ChevronLeft,
  X,
  RefreshCw,
  Save,
  Video,
  Info,
  ExternalLink,
  Edit2,
  ShoppingBag,
  LogOut,
  CheckCircle2,
  CreditCard,
  Download,
  Maximize2,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getStyleRecommendations, generateStyleVisual, getSummary } from './services/geminiService';
import { Sidebar } from './components/Sidebar';
import { ProfileView } from './components/ProfileView';
import { URLImage } from './components/URLImage';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
import { UpcycleLab } from './components/UpcycleLab';
import { Marketplace } from './components/Marketplace';
import { CommentsSection } from './components/CommentsSection';
import { CropModal } from './components/CropModal';
import { PricingModal } from './components/PricingModal';
import { HomeView } from './components/HomeView';
import { ContactView } from './components/ContactView';
import { PrivacyView } from './components/PrivacyView';
import { TermsView } from './components/TermsView';
import { compressImage, downloadOutfit } from './utils/image';
import { UserProfile, UserTier } from './types';

import { Footer } from './components/Footer';

// --- Main App ---

const BackgroundBubbles = () => {
  const bubbles = [
    { color: '#FFACC1', size: '300px', top: '10%', left: '5%' },
    { color: '#FFBD59', size: '400px', top: '60%', left: '80%' },
    { color: '#024A34', size: '250px', top: '20%', left: '70%' },
    { color: '#FFACC1', size: '350px', top: '80%', left: '10%' },
    { color: '#FFBD59', size: '200px', top: '40%', left: '30%' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
      {bubbles.map((b, i) => (
        <div
          key={i}
          className="bubble"
          style={{
            width: b.size,
            height: b.size,
            top: b.top,
            left: b.left,
            background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
          }}
        />
      ))}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'wardrobe' | 'styler' | 'lab' | 'community' | 'upcycle' | 'market' | 'profile' | 'contact' | 'privacy' | 'terms'>('home');
  const [communityFilter, setCommunityFilter] = useState<'all' | 'following'>('all');
  const [followedUserIds, setFollowedUserIds] = useState<string[]>([]);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [viewingOutfit, setViewingOutfit] = useState<Outfit | null>(null);
  const [garments, setGarments] = useState<Garment[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Lab State
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [visualRecommendation, setVisualRecommendation] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isSavingRecommendation, setIsSavingRecommendation] = useState(false);
  const [isPublicRecommendation, setIsPublicRecommendation] = useState(true);
  const [isPublicOutfit, setIsPublicOutfit] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Styler State
  const [stylerItems, setStylerItems] = useState<OutfitItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [stylerBgColor, setStylerBgColor] = useState('#ffffff');
  const [croppingImage, setCroppingImage] = useState<string | null>(null);

  const moveItem = (direction: 'up' | 'down' | 'front' | 'back') => {
    if (selectedId === null) return;
    const items = [...stylerItems];
    let newId = selectedId;
    
    if (direction === 'up') newId = selectedId + 1;
    else if (direction === 'down') newId = selectedId - 1;
    else if (direction === 'front') newId = items.length - 1;
    else if (direction === 'back') newId = 0;

    if (newId < 0 || newId >= items.length || newId === selectedId) return;
    
    const [removed] = items.splice(selectedId, 1);
    items.splice(newId, 0, removed);
    
    setStylerItems(items);
    setSelectedId(newId);
  };

  const deleteStylerItem = () => {
    if (selectedId === null) return;
    setStylerItems(stylerItems.filter((_, i) => i !== selectedId));
    setSelectedId(null);
  };

  // Garment Detail State
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);
  const [isEditingGarment, setIsEditingGarment] = useState(false);
  const [editGarmentData, setEditGarmentData] = useState({ category: '', tags: '' });
  const [upcycleTag, setUpcycleTag] = useState<string | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'payment' | 'success'>('cart');

  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'outfit' | 'garment' | 'listing' } | null>(null);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [limitReached, setLimitReached] = useState<'wardrobe' | 'ai' | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Scroll to top when user switches tabs
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Sync user profile to Firestore
        try {
          const userRef = doc(db, 'users', u.uid);
          let userSnap;
          try {
            userSnap = await getDoc(userRef);
          } catch (error) {
            handleFirestoreError(error, OperationType.GET, `users/${u.uid}`);
          }
          
          if (userSnap && !userSnap.exists()) {
            const newProfile: UserProfile = {
              uid: u.uid,
              displayName: u.displayName || 'Anonymous',
              photoURL: u.photoURL || '',
              coverPhotoURL: '',
              bio: '',
              favorites: [],
              tier: 'basic',
              createdAt: new Date().toISOString()
            };
            try {
              await setDoc(userRef, {
                ...newProfile,
                createdAt: serverTimestamp()
              });
            } catch (error) {
              handleFirestoreError(error, OperationType.WRITE, `users/${u.uid}`);
            }
            setUserProfile(newProfile);
            setFavoriteIds([]);
          } else if (userSnap) {
            const userData = userSnap.data() as UserProfile;
            const profile: UserProfile = {
              ...userData,
              tier: userData.tier || 'basic'
            };
            setUserProfile(profile);
            setFavoriteIds(userData.favorites || []);
          }
        } catch (error) {
          console.error("User sync failed", error);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const [viewingComments, setViewingComments] = useState<{ id: string; type: 'outfits' | 'tutorials' } | null>(null);

  useEffect(() => {
    if (!user) return;

    // Real-time garments
    const garmentsQuery = query(
      collection(db, 'garments'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeGarments = onSnapshot(garmentsQuery, (snapshot) => {
      const gList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Garment));
      setGarments(gList);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'garments'));

    // Real-time outfits
    const outfitsQuery = query(
      collection(db, 'outfits'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeOutfits = onSnapshot(outfitsQuery, (snapshot) => {
      const oList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Outfit));
      setOutfits(oList);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'outfits'));

    return () => {
      unsubscribeGarments();
      unsubscribeOutfits();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'follows'), where('followerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFollowedUserIds(snapshot.docs.map(d => d.data().followingId));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'follows'));
    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    setAuthError(null);
    setIsAuthenticating(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login failed", error);
      setAuthError(error.message || "Login failed");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      if (authMode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error("Email auth failed", error);
      setAuthError(error.message || "Authentication failed");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleUpgrade = async (tier: UserTier) => {
    if (!user) return;
    try {
      try {
        await updateDoc(doc(db, 'users', user.uid), { tier });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
      setUserProfile(prev => prev ? { ...prev, tier } : null);
    } catch (error) {
      console.error("Upgrade failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleAddGarment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Enforce Wardrobe Limit for Basic Users
    if (userProfile?.tier === 'basic' && garments.length >= 10) {
      setLimitReached('wardrobe');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCroppingImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be selected again
    e.target.value = '';
  };

  const handleCropComplete = async (croppedImage: string) => {
    if (!user) return;
    setCroppingImage(null);
    
    try {
      try {
        await addDoc(collection(db, 'garments'), {
          ownerId: user.uid,
          imageUrl: croppedImage,
          category: 'Uncategorized',
          tags: [],
          createdAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'garments');
      }
    } catch (error) {
      console.error("Failed to add garment", error);
    }
  };

  const removeBackground = async (imageUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(imageUrl);

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Improved background removal (handles near-white and greyish backgrounds)
        // We sample the corners to get a better idea of the background color
        const corners = [
          [0, 0], [canvas.width - 1, 0], [0, canvas.height - 1], [canvas.width - 1, canvas.height - 1]
        ];
        let bgR = 0, bgG = 0, bgB = 0;
        corners.forEach(([x, y]) => {
          const i = (y * canvas.width + x) * 4;
          bgR += data[i];
          bgG += data[i + 1];
          bgB += data[i + 2];
        });
        bgR /= 4; bgG /= 4; bgB /= 4;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Distance from background color
          const dist = Math.sqrt(
            Math.pow(r - bgR, 2) + 
            Math.pow(g - bgG, 2) + 
            Math.pow(b - bgB, 2)
          );

          // If pixel is close to background color or very bright, make it transparent
          if (dist < 30 || (r > 230 && g > 230 && b > 230)) {
            data[i + 3] = 0;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(imageUrl);
    });
  };

  const handleUpdateGarment = async () => {
    if (!selectedGarment) return;
    try {
      const garmentRef = doc(db, 'garments', selectedGarment.id);
      try {
        await updateDoc(garmentRef, {
          category: editGarmentData.category,
          tags: editGarmentData.tags.split(',').map(t => t.trim()).filter(t => t !== '')
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `garments/${selectedGarment.id}`);
      }
      setSelectedGarment(null);
      setIsEditingGarment(false);
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  const handleToggleFavorite = async (outfitId: string) => {
    if (!user) return;
    const isFavorite = favoriteIds.includes(outfitId);
    try {
      const userRef = doc(db, 'users', user.uid);
      if (isFavorite) {
        try {
          await updateDoc(userRef, {
            favorites: arrayRemove(outfitId)
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
        }
        setFavoriteIds(prev => prev.filter(id => id !== outfitId));
      } else {
        try {
          await updateDoc(userRef, {
            favorites: arrayUnion(outfitId)
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
        }
        setFavoriteIds(prev => [...prev, outfitId]);
      }
      
      // Update likesCount on the outfit
      const outfitRef = doc(db, 'outfits', outfitId);
      try {
        await updateDoc(outfitRef, {
          likesCount: increment(isFavorite ? -1 : 1)
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `outfits/${outfitId}`);
      }
    } catch (error) {
      console.error("Favorite toggle failed", error);
    }
  };

  const handleAnalyze = async () => {
    if (!aiImage || isAnalyzing) return;
    
    // Enforce AI Limit for Basic Users
    if (userProfile?.tier === 'basic' && Math.random() > 0.7) {
      setLimitReached('ai');
      return;
    }

    setIsAnalyzing(true);
    setRecommendations(null);
    setVisualRecommendation(null);
    try {
      const textResult = await getStyleRecommendations(aiImage);
      setRecommendations(textResult);
      const visualResult = await generateStyleVisual(aiImage, textResult);
      setVisualRecommendation(visualResult);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveRecommendation = async () => {
    if (!user || !visualRecommendation || !recommendations || !aiImage) {
      console.warn("Missing data for saving recommendation", { user: !!user, visual: !!visualRecommendation, recs: !!recommendations, aiImage: !!aiImage });
      return;
    }
    setIsSavingRecommendation(true);
    try {
      // Check if basic user has reached the limit
      if (userProfile?.tier === 'basic') {
        const savedRecsQuery = query(collection(db, 'saved_recommendations'), where('userId', '==', user.uid));
        const savedRecsSnapshot = await getDocs(savedRecsQuery);
        if (savedRecsSnapshot.size >= 6) {
          alert("Free users can save up to 6 AI Lab recommendations. Upgrade to Premium for unlimited saves!");
          setIsSavingRecommendation(false);
          return;
        }
      }

      console.log("Saving recommendation...");
      const summaryResult = await getSummary(recommendations);
      console.log("Summary generated:", summaryResult);

      // Compress image to ensure it fits in Firestore (1MB limit)
      const compressedImage = await compressImage(visualRecommendation, 600, 600, 0.6);

      let docRef;
      try {
        docRef = await addDoc(collection(db, 'saved_recommendations'), {
          userId: user.uid,
          userName: user.displayName || 'Anonymous',
          userPhoto: user.photoURL || '',
          imageUrl: compressedImage,
          summary: summaryResult,
          isPublic: isPublicRecommendation,
          createdAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'saved_recommendations');
      }
      
      if (docRef) {
        console.log("Recommendation saved with ID:", docRef.id);
        alert("Style recommendation saved to your profile!");
      }
    } catch (error) {
      console.error("Failed to save recommendation", error);
      alert("Failed to save recommendation. Please try again.");
    } finally {
      setIsSavingRecommendation(false);
    }
  };

  const handleSaveOutfit = async () => {
    if (!user || stylerItems.length === 0) return;
    setIsSaving(true);
    try {
      try {
        await addDoc(collection(db, 'outfits'), {
          authorId: user.uid,
          authorName: user.displayName || 'Anonymous',
          authorPhoto: user.photoURL || '',
          items: stylerItems,
          backgroundColor: stylerBgColor,
          likesCount: 0,
          commentsCount: 0,
          isPublic: isPublicOutfit,
          createdAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'outfits');
      }
      setStylerItems([]);
      if (isPublicOutfit) {
        setActiveTab('community');
      } else {
        setActiveTab('profile');
      }
      alert(isPublicOutfit ? "Outfit posted to community!" : "Outfit saved privately to your profile!");
    } catch (error) {
      console.error("Failed to save outfit", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOutfit = async (outfitId: string) => {
    try {
      // Delete comments first
      const commentsRef = collection(db, 'outfits', outfitId, 'comments');
      let commentsSnap;
      try {
        commentsSnap = await getDocs(commentsRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `outfits/${outfitId}/comments`);
      }
      
      if (commentsSnap) {
        const deletePromises = commentsSnap.docs.map(async (doc) => {
          try {
            await deleteDoc(doc.ref);
          } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, `outfits/${outfitId}/comments/${doc.id}`);
          }
        });
        await Promise.all(deletePromises);
      }

      // Delete the outfit itself
      try {
        await deleteDoc(doc(db, 'outfits', outfitId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `outfits/${outfitId}`);
      }
      setItemToDelete(null);
      setOutfits(prev => prev.filter(o => o.id !== outfitId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `outfits/${outfitId}`);
    }
  };

  const addToCart = (item: any) => {
    setCart(prev => [...prev, item]);
    setIsCartOpen(true);
    setCheckoutStep('cart');
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setCheckoutStep('payment');
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setCheckoutStep('success');
    setIsCheckingOut(false);
    setCart([]);
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <RefreshCw className="animate-spin text-emerald-500" size={32} />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 font-body relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] aspect-square bg-pink/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] aspect-square bg-orange/20 rounded-full blur-[120px] animate-pulse" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/80 backdrop-blur-xl p-10 rounded-[3.5rem] shadow-2xl border-4 border-primary/5 relative z-10 retro-shadow-pink"
      >
        <div className="relative z-10">
          <div className="w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl rotate-3 hover:rotate-12 transition-transform">
            <Sparkles className="text-cream" size={48} fill="currentColor" />
          </div>
          <h1 className="text-5xl font-heading text-primary text-center mb-2 tracking-tighter italic">Social Thrift</h1>
          <p className="text-dark/50 text-center mb-10 text-lg font-medium leading-tight">
            {authMode === 'login' ? 'Welcome back to your creative style sanctuary.' : 'Join the conscious fashion revolution today.'}
          </p>

          <form onSubmit={handleEmailAuth} className="space-y-6 mb-8">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-primary uppercase tracking-[0.2em] px-2">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-cream/50 border-2 border-primary/10 rounded-2xl px-6 py-5 text-dark focus:outline-none focus:border-primary transition-all font-medium"
                placeholder="name@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-primary uppercase tracking-[0.2em] px-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-cream/50 border-2 border-primary/10 rounded-2xl px-6 py-5 text-dark focus:outline-none focus:border-primary transition-all font-medium"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            
            {authError && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 text-red-600 text-sm p-4 rounded-2xl flex items-center gap-3 border border-red-100"
              >
                <Info size={18} />
                {authError}
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={isAuthenticating}
              className="w-full bg-primary text-cream rounded-2xl py-5 font-heading text-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl retro-shadow-pink disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAuthenticating ? 'Wait a sec...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-primary/5"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em] font-bold">
              <span className="bg-white px-4 text-dark/20">Vintage & Sustainable</span>
            </div>
          </div>

          <button 
            onClick={handleLogin}
            disabled={isAuthenticating}
            className="w-full bg-white border-2 border-primary/10 text-primary rounded-2xl py-5 font-heading text-xl flex items-center justify-center gap-3 hover:bg-cream/50 transition-all disabled:opacity-50 shadow-md"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
            Continue with Google
          </button>

          <p className="mt-10 text-center text-dark/60 font-medium">
            {authMode === 'login' ? "New here?" : "Already a member?"}
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="ml-2 text-primary font-bold hover:underline underline-offset-4"
            >
              {authMode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </motion.div>
      
      <div className="mt-12 text-dark/30 text-[10px] font-bold uppercase tracking-[0.4em] relative z-10">
        © 2026 Social Thrift • RE:Thriva
      </div>
    </div>
  );

  const filteredOutfits = communityFilter === 'all' 
    ? outfits 
    : outfits.filter(o => followedUserIds.includes(o.authorId));

  return (
    <div className={cn("min-h-screen transition-colors duration-300", darkMode ? "dark" : "")}>
      <BackgroundBubbles />
      
      <Sidebar 
        user={user} 
        tier={userProfile?.tier}
        onLogout={handleLogout} 
        onUpgrade={() => setIsPricingOpen(true)}
        activeTab={activeTab} 
        setActiveTab={(tab) => setActiveTab(tab as any)} 
        cartCount={cart.length}
        onOpenCart={() => setIsCartOpen(true)}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
      
      <main className="lg:pl-[120px] transition-all duration-300 min-h-screen">
        {/* Top Header for Logo & Badge */}
        <header className="sticky top-0 z-40 p-6 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-4 pointer-events-auto bg-card/40 backdrop-blur-md px-6 py-3 rounded-3xl border border-primary/10 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink rounded-xl flex items-center justify-center overflow-hidden shadow-inner border border-primary/5">
                <Sparkles className="text-primary" size={20} fill="currentColor" />
              </div>
              <span className="font-heading italic text-lg text-primary leading-tight">Social Thrift</span>
            </div>
            <div className="h-6 w-px bg-primary/10 mx-1" />
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-[10px] font-bold px-3 py-1 rounded-full w-fit uppercase tracking-widest shadow-sm",
                userProfile?.tier === 'premium' ? "bg-orange text-primary" : "bg-primary/10 text-primary"
              )}>
                {userProfile?.tier === 'premium' ? 'Premium' : 'Free'}
              </span>
              {userProfile?.tier !== 'premium' && (
                <button 
                  onClick={() => setIsPricingOpen(true)}
                  className="text-[10px] font-bold text-primary hover:underline transition-all"
                >
                  Upgrade
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <HomeView 
                userName={user.displayName || 'Friend'} 
                setActiveTab={(tab) => setActiveTab(tab as any)} 
              />
            </motion.div>
          )}

          {activeTab === 'lab' && (
            <motion.div 
              key="lab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <header className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold uppercase tracking-wider border border-emerald-100">
                  <Sparkles size={14} />
                  AI Powered
                </div>
                <h2 className="text-5xl font-heading text-primary leading-tight">Style Lab</h2>
                <p className="text-lg text-dark/50 max-w-lg mx-auto font-medium">
                  Discover new ways to wear your favorites and get instant thrift tips.
                </p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                <div className="md:col-span-5 space-y-6">
                  <div 
                    className={cn(
                      "aspect-[3/4] rounded-[2.5rem] border-2 border-dashed border-primary/10 bg-white shadow-sm flex flex-col items-center justify-center overflow-hidden relative group transition-all hover:border-primary/20",
                      aiImage && "border-none shadow-2xl"
                    )}
                  >
                    {aiImage ? (
                      <>
                        <img src={aiImage} className="w-full h-full object-cover" alt="To analyze" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            onClick={() => setAiImage(null)}
                            className="p-4 bg-white text-zinc-900 rounded-2xl shadow-xl hover:scale-110 transition-transform"
                          >
                            <X size={24} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-8 space-y-6">
                        <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mx-auto text-zinc-300 group-hover:scale-110 transition-transform">
                          <Camera size={32} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xl font-bold text-zinc-900">Upload Outfit</p>
                          <p className="text-zinc-400 text-sm font-medium">Show us your current fit</p>
                        </div>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          ref={fileInputRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = async () => {
                                const compressed = await compressImage(reader.result as string, 800, 800, 0.7);
                                setAiImage(compressed);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-primary text-bg px-8 py-4 rounded-2xl text-lg font-heading hover:scale-105 transition-all shadow-xl shadow-primary/20"
                        >
                          Select Image
                        </button>
                      </div>
                    )}
                  </div>
                  {aiImage && (
                    <button 
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="w-full bg-primary text-bg py-5 rounded-2xl font-heading text-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all disabled:opacity-50 shadow-2xl shadow-primary/20"
                    >
                      {isAnalyzing ? <RefreshCw className="animate-spin" /> : <Sparkles size={20} />}
                      {isAnalyzing ? "Analyzing Style..." : "Get Recommendations"}
                    </button>
                  )}
                </div>

                <div className="md:col-span-7 bg-white rounded-[2.5rem] p-8 border border-black/5 min-h-[500px] flex flex-col shadow-xl">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-black/5">
                    <h3 className="text-xl font-heading flex items-center gap-3 text-primary">
                      <Sparkles className="text-emerald-500" size={24} />
                      Style Insights
                    </h3>
                    {recommendations && !isAnalyzing && (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setIsPublicRecommendation(!isPublicRecommendation)}
                            className={cn(
                              "w-12 h-6 rounded-full transition-colors relative",
                              isPublicRecommendation ? "bg-emerald-500" : "bg-zinc-200"
                            )}
                          >
                            <motion.div 
                              animate={{ x: isPublicRecommendation ? 26 : 2 }}
                              className="w-4 h-4 bg-white rounded-full absolute top-1"
                            />
                          </button>
                          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                            {isPublicRecommendation ? "Public" : "Private"}
                          </span>
                        </div>
                        <button 
                          onClick={handleSaveRecommendation}
                          disabled={isSavingRecommendation}
                          className="p-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 shadow-lg"
                          title="Save to Profile"
                        >
                          {isSavingRecommendation ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-8 overflow-y-auto max-h-[600px] pr-4 custom-scrollbar">
                    {visualRecommendation && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="aspect-video rounded-3xl overflow-hidden border border-black/5 shadow-lg relative group"
                      >
                        <img src={visualRecommendation} className="w-full h-full object-cover" alt="AI Recommendation" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <button 
                            onClick={() => setFullscreenImage(visualRecommendation)}
                            className="p-3 bg-white text-zinc-900 rounded-full hover:scale-110 transition-transform shadow-xl"
                          >
                            <Maximize2 size={24} />
                          </button>
                          <a 
                            href={visualRecommendation} 
                            download="style-recommendation.png"
                            className="p-3 bg-white text-zinc-900 rounded-full hover:scale-110 transition-transform shadow-xl"
                          >
                            <Download size={24} />
                          </a>
                        </div>
                      </motion.div>
                    )}

                    {recommendations ? (
                      <div className="prose prose-zinc prose-lg max-w-none">
                        <div className="text-zinc-600 leading-relaxed font-medium">
                          <ReactMarkdown>{recommendations}</ReactMarkdown>
                        </div>
                      </div>
                    ) : (
                      !isAnalyzing && (
                        <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-6">
                          <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-200">
                            <Sparkles size={40} />
                          </div>
                          <div className="space-y-2">
                            <p className="text-xl font-bold text-zinc-900">No Insights Yet</p>
                            <p className="text-zinc-400 font-medium max-w-xs mx-auto">Upload a photo to see AI-powered style recommendations here.</p>
                          </div>
                        </div>
                      )
                    )}

                    {isAnalyzing && (
                      <div className="h-full flex flex-col items-center justify-center py-20 space-y-8">
                        <div className="relative">
                          <RefreshCw className="animate-spin text-emerald-500" size={48} />
                          <Sparkles className="absolute -top-3 -right-3 text-amber-400 animate-pulse" size={24} />
                        </div>
                        <div className="text-center space-y-2">
                          <p className="text-xl font-bold text-zinc-900">Analyzing Your Style</p>
                          <p className="text-zinc-400 font-medium animate-pulse">Consulting our AI fashion experts...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'wardrobe' && (
            <motion.div 
              key="wardrobe"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold uppercase tracking-wider border border-orange-100">
                    <Shirt size={14} />
                    Personal Collection
                  </div>
                  <h2 className="text-6xl font-heading text-primary leading-none">My Wardrobe</h2>
                  <p className="text-xl text-dark/50 font-medium max-w-xl">
                    Your digital collection of thrifted and upcycled gems.
                  </p>
                </div>
                <label className="bg-primary text-bg px-10 py-5 rounded-3xl font-heading text-2xl cursor-pointer flex items-center gap-3 hover:scale-105 transition-all shadow-2xl retro-shadow-pink">
                  <Plus size={28} />
                  Add Item
                  <input type="file" accept="image/*" className="hidden" onChange={handleAddGarment} />
                </label>
              </header>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {garments.map((garment) => (
                  <motion.div 
                    layout
                    whileHover={{ y: -8 }}
                    key={garment.id}
                    onClick={() => setSelectedGarment(garment)}
                    className="group relative aspect-[3/4] bg-white rounded-[2rem] overflow-hidden border border-black/5 hover:shadow-2xl transition-all duration-500 cursor-pointer"
                  >
                    <img src={garment.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Garment" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
                      <p className="text-white font-bold text-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{garment.category}</p>
                      <div className="flex gap-1 mt-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                        {garment.tags.slice(0, 2).map((tag, i) => (
                          <span key={`${tag}-${i}`} className="text-[10px] text-white/80 font-medium">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {garments.length === 0 && (
                  <div className="col-span-full py-32 text-center space-y-4">
                    <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mx-auto text-zinc-200">
                      <Shirt size={48} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-zinc-900">Your wardrobe is empty</p>
                      <p className="text-zinc-400">Start adding items to build your digital collection!</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Garment Detail Modal */}
              <AnimatePresence>
                {selectedGarment && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setSelectedGarment(null)}
                  >
                    <motion.div 
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 20 }}
                      className="bg-white rounded-[3rem] overflow-hidden max-w-4xl w-full flex flex-col md:flex-row shadow-2xl relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="md:w-1/2 aspect-[3/4] bg-zinc-50 relative group">
                        <img src={selectedGarment.imageUrl} className="w-full h-full object-cover" alt="Garment" />
                      </div>
                      <div className="md:w-1/2 p-10 lg:p-12 space-y-8 flex flex-col">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1 flex-1">
                            {isEditingGarment ? (
                              <input 
                                type="text"
                                value={editGarmentData.category}
                                onChange={(e) => setEditGarmentData({ ...editGarmentData, category: e.target.value })}
                                className="text-3xl font-heading text-primary bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                            ) : (
                              <h3 className="text-4xl font-heading text-primary leading-tight">{selectedGarment.category}</h3>
                            )}
                            <p className="text-zinc-400 text-sm font-medium">Added {selectedGarment.createdAt && typeof selectedGarment.createdAt.toDate === 'function' ? selectedGarment.createdAt.toDate().toLocaleDateString() : 'Just now'}</p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                if (isEditingGarment) {
                                  handleUpdateGarment();
                                } else {
                                  setEditGarmentData({ 
                                    category: selectedGarment.category, 
                                    tags: selectedGarment.tags.join(', ') 
                                  });
                                  setIsEditingGarment(true);
                                }
                              }}
                              className="p-3 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-primary transition-colors"
                            >
                              {isEditingGarment ? <Save size={24} /> : <Edit2 size={24} />}
                            </button>
                            <button onClick={() => { setSelectedGarment(null); setIsEditingGarment(false); }} className="p-3 hover:bg-zinc-100 rounded-full text-zinc-400">
                              <X size={28} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-6 flex-1">
                          <div className="space-y-3">
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                              <Tag size={14} />
                              Tags
                            </p>
                            {isEditingGarment ? (
                              <input 
                                type="text"
                                value={editGarmentData.tags}
                                onChange={(e) => setEditGarmentData({ ...editGarmentData, tags: e.target.value })}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="e.g., vintage, denim, blue"
                              />
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {selectedGarment.tags.length > 0 ? (
                                  selectedGarment.tags.map((tag, i) => (
                                    <span key={`${tag}-${i}`} className="px-4 py-1.5 bg-zinc-50 text-zinc-600 rounded-full text-xs font-bold border border-zinc-100">
                                      #{tag}
                                    </span>
                                  ))
                                ) : (
                                  <p className="text-zinc-400 text-sm italic">No tags added yet.</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <button 
                            onClick={() => {
                              const tag = selectedGarment.tags[0] || selectedGarment.category;
                              setUpcycleTag(tag);
                              setActiveTab('upcycle');
                              setSelectedGarment(null);
                            }}
                            className="w-full bg-green-support text-bg py-5 rounded-2xl font-heading text-2xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-xl retro-shadow-pink"
                          >
                            <Video size={24} />
                            Upcycle This Item
                          </button>
                          <button 
                            onClick={async () => {
                              setItemToDelete({ id: selectedGarment.id, type: 'garment' });
                            }}
                            className="w-full bg-red-50 text-red-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={20} />
                            Remove from Wardrobe
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'styler' && (
            <motion.div 
              key="styler"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-bold uppercase tracking-wider border border-purple-100">
                    <Layout size={14} />
                    Creative Canvas
                  </div>
                  <h2 className="text-6xl font-heading text-primary leading-none">Wardrobe Styler</h2>
                  <p className="text-xl text-dark/50 font-medium max-w-xl">
                    Drag and drop items to create your perfect look.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
                  <div className="flex items-center gap-2 bg-white p-2 rounded-[2rem] border border-black/5 shadow-lg">
                    <button 
                      onClick={() => setIsPublicOutfit(true)}
                      className={`px-8 py-3 rounded-[1.5rem] text-sm font-heading transition-all ${isPublicOutfit ? 'bg-primary text-bg shadow-xl' : 'text-primary/40 hover:text-primary'}`}
                    >
                      Public
                    </button>
                    <button 
                      onClick={() => setIsPublicOutfit(false)}
                      className={`px-8 py-3 rounded-[1.5rem] text-sm font-heading transition-all ${!isPublicOutfit ? 'bg-primary text-bg shadow-xl' : 'text-primary/40 hover:text-primary'}`}
                    >
                      Private
                    </button>
                  </div>
                  <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-black/5 shadow-lg">
                    <input 
                      type="color" 
                      value={stylerBgColor} 
                      onChange={(e) => setStylerBgColor(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border-none bg-transparent"
                      title="Canvas Background Color"
                    />
                    <button 
                      onClick={() => setStylerItems([])}
                      className="p-2 hover:bg-zinc-50 rounded-xl text-zinc-400 hover:text-red-500 transition-colors"
                      title="Clear Canvas"
                    >
                      <Trash2 size={24} />
                    </button>
                  </div>
                  <button 
                    onClick={handleSaveOutfit}
                    disabled={isSaving || stylerItems.length === 0}
                    className="bg-primary text-bg px-10 py-5 rounded-3xl font-heading text-2xl flex items-center gap-3 hover:scale-105 transition-all disabled:opacity-50 shadow-2xl retro-shadow-pink"
                  >
                    {isSaving ? <RefreshCw className="animate-spin" /> : <Save size={28} />}
                    {isPublicOutfit ? 'Publish Outfit' : 'Save Private'}
                  </button>
                </div>
              </header>

              <div className="flex flex-col lg:flex-row gap-12 h-[800px]">
                <div className="flex-1 bg-zinc-50 rounded-[3rem] border-8 border-white overflow-hidden relative shadow-2xl flex items-center justify-center group">
                  <div className="bg-white shadow-2xl border border-black/5" style={{ backgroundColor: stylerBgColor }}>
                    <Stage
                      width={800}
                      height={800}
                      onClick={(e) => {
                        if (e.target === e.target.getStage()) setSelectedId(null);
                      }}
                    >
                      <Layer>
                        <Rect width={800} height={800} fill={stylerBgColor} />
                        {stylerItems.map((item, i) => (
                          <URLImage
                            key={i}
                            item={item}
                            isSelected={i === selectedId}
                            onSelect={() => setSelectedId(i)}
                            onChange={(newAttrs) => {
                              const items = stylerItems.slice();
                              items[i] = newAttrs;
                              setStylerItems(items);
                            }}
                          />
                        ))}
                      </Layer>
                    </Stage>
                  </div>
                  
                  {/* Floating Controls for Selected Item */}
                  <AnimatePresence>
                    {selectedId !== null && (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="absolute top-8 left-8 flex flex-col gap-3 bg-white/90 backdrop-blur-md p-3 rounded-[2rem] shadow-2xl border border-black/5 z-10"
                      >
                        <button 
                          onClick={() => moveItem('front')}
                          disabled={selectedId === stylerItems.length - 1}
                          className="p-3 hover:bg-zinc-100 rounded-2xl text-zinc-600 disabled:opacity-30 transition-colors"
                          title="Bring to Front"
                        >
                          <ChevronRight className="-rotate-90 scale-125" size={24} />
                        </button>
                        <button 
                          onClick={() => moveItem('up')}
                          disabled={selectedId === stylerItems.length - 1}
                          className="p-3 hover:bg-zinc-100 rounded-2xl text-zinc-600 disabled:opacity-30 transition-colors"
                          title="Bring Forward"
                        >
                          <ChevronRight className="-rotate-90" size={24} />
                        </button>
                        <button 
                          onClick={() => moveItem('down')}
                          disabled={selectedId === 0}
                          className="p-3 hover:bg-zinc-100 rounded-2xl text-zinc-600 disabled:opacity-30 transition-colors"
                          title="Send Backward"
                        >
                          <ChevronLeft className="-rotate-90" size={24} />
                        </button>
                        <button 
                          onClick={() => moveItem('back')}
                          disabled={selectedId === 0}
                          className="p-3 hover:bg-zinc-100 rounded-2xl text-zinc-600 disabled:opacity-30 transition-colors"
                          title="Send to Back"
                        >
                          <ChevronLeft className="-rotate-90 scale-125" size={24} />
                        </button>
                        <div className="h-px bg-zinc-200 mx-3" />
                        <button 
                          onClick={deleteStylerItem}
                          className="p-3 hover:bg-red-50 rounded-2xl text-red-500 transition-colors"
                          title="Remove Item"
                        >
                          <Trash2 size={24} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {stylerItems.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-200 pointer-events-none">
                      <div className="text-center space-y-4">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl">
                          <Layout size={48} className="opacity-20" />
                        </div>
                        <p className="text-xl font-bold text-zinc-400">Select items from the right to start styling</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-full lg:w-96 bg-white rounded-[3rem] border border-black/5 p-8 overflow-y-auto space-y-6 shadow-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-zinc-900 uppercase text-xs tracking-widest">Wardrobe Items</h3>
                    <span className="text-[10px] font-bold text-zinc-400 bg-zinc-50 px-2 py-1 rounded-lg border border-zinc-100">{garments.length} items</span>
                  </div>
                  <div className="grid grid-cols-3 lg:grid-cols-2 gap-4">
                    {garments.map((garment) => (
                      <button
                        key={garment.id}
                        onClick={() => {
                          setStylerItems([...stylerItems, {
                            garmentId: garment.id,
                            imageUrl: garment.imageUrl,
                            x: 50,
                            y: 50,
                            width: 300,
                            height: 300,
                            scale: 0.5,
                            rotation: 0
                          }]);
                        }}
                        className="aspect-square rounded-2xl overflow-hidden border border-black/5 hover:border-primary hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-lg"
                      >
                        <img src={garment.imageUrl} className="w-full h-full object-cover" alt="Garment" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'community' && (
            <motion.div 
              key="community"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider border border-blue-100">
                    <Users size={14} />
                    Global Feed
                  </div>
                  <h2 className="text-6xl font-heading text-primary leading-none">Community Feed</h2>
                  <p className="text-xl text-dark/50 font-medium max-w-xl">
                    Get inspired by other stylists and share your feedback.
                  </p>
                </div>
                <div className="flex bg-white p-2 rounded-[2rem] border border-black/5 shadow-lg">
                  <button 
                    onClick={() => setCommunityFilter('all')}
                    className={`px-10 py-3 rounded-[1.5rem] text-lg font-heading transition-all ${
                      communityFilter === 'all' ? 'bg-primary text-bg shadow-xl' : 'text-primary/40 hover:text-primary'
                    }`}
                  >
                    All Posts
                  </button>
                  <button 
                    onClick={() => setCommunityFilter('following')}
                    className={`px-10 py-3 rounded-[1.5rem] text-lg font-heading transition-all ${
                      communityFilter === 'following' ? 'bg-primary text-bg shadow-xl' : 'text-primary/40 hover:text-primary'
                    }`}
                  >
                    Following
                  </button>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredOutfits.map((outfit) => (
                  <motion.div 
                    layout
                    whileHover={{ y: -8 }}
                    key={outfit.id}
                    className="group bg-white rounded-[3rem] border border-black/5 overflow-hidden hover:shadow-2xl transition-all duration-500"
                  >
                    <div 
                      className="aspect-square relative overflow-hidden group-hover:scale-[0.98] transition-transform duration-500 rounded-[2.5rem] m-2"
                      style={{ backgroundColor: outfit.backgroundColor || '#f4f4f5' }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-full h-full">
                          {outfit.items.map((item, i) => (
                            <img 
                              key={i}
                              src={item.imageUrl} 
                              className="absolute shadow-lg"
                              style={{
                                left: `${(item.x / 800) * 100}%`,
                                top: `${(item.y / 800) * 100}%`,
                                width: `${((item.width || 200) / 800) * 100}%`,
                                height: `${((item.height || 200) / 800) * 100}%`,
                                transformOrigin: '0 0',
                                transform: `scale(${item.scaleX !== undefined ? item.scaleX : item.scale}, ${item.scaleY !== undefined ? item.scaleY : item.scale}) rotate(${item.rotation}deg)`,
                                objectFit: 'cover',
                                borderRadius: '8px'
                              }}
                              alt="Outfit item"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="p-8 space-y-6">
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={() => {
                            setViewingProfileId(outfit.authorId);
                            setActiveTab('profile');
                          }}
                          className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                        >
                          <img src={outfit.authorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${outfit.authorId}`} className="w-12 h-12 rounded-full border-2 border-white shadow-md" alt="Author" />
                          <div className="text-left">
                            <p className="font-bold text-lg text-zinc-900">{outfit.authorName}</p>
                            <p className="text-xs text-zinc-400 font-medium">Stylist</p>
                          </div>
                        </button>
                        <div className="flex gap-4 text-zinc-400">
                          {outfit.authorId === user?.uid && (
                            <button 
                              onClick={() => setItemToDelete({ id: outfit.id, type: 'outfit' })}
                              className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
                              title="Delete post"
                            >
                              <Trash2 size={20} />
                            </button>
                          )}
                          <button 
                            onClick={() => handleToggleFavorite(outfit.id)}
                            className={cn(
                              "flex items-center gap-1.5 p-2 rounded-xl transition-all",
                              favoriteIds.includes(outfit.id) ? "bg-red-50 text-red-500" : "hover:bg-red-50 hover:text-red-500"
                            )}
                          >
                            <Heart size={20} fill={favoriteIds.includes(outfit.id) ? "currentColor" : "none"} />
                            <span className="text-sm font-bold">{outfit.likesCount || 0}</span>
                          </button>
                          <button 
                            onClick={() => setViewingComments({ id: outfit.id, type: 'outfits' })}
                            className="flex items-center gap-1.5 p-2 rounded-xl hover:bg-emerald-50 hover:text-emerald-500 transition-all"
                          >
                            <MessageSquare size={20} />
                            <span className="text-sm font-bold">{outfit.commentsCount || 0}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {outfits.length === 0 && (
                  <div className="col-span-full py-32 text-center space-y-4">
                    <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mx-auto text-zinc-200">
                      <Users size={48} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-zinc-900">No outfits published yet</p>
                      <p className="text-zinc-400">Be the first to share your style with the community!</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Comments Modal */}
              <AnimatePresence>
                {viewingComments && viewingComments.type === 'outfits' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setViewingComments(null)}
                  >
                    <motion.div 
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 20 }}
                      className="w-full max-w-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CommentsSection 
                        parentId={viewingComments.id} 
                        parentType="outfits" 
                        currentUser={user} 
                        onClose={() => setViewingComments(null)}
                      />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {user && (
                <div className="space-y-6">
                  {viewingProfileId && viewingProfileId !== user.uid && (
                    <button 
                      onClick={() => setViewingProfileId(null)}
                      className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors"
                    >
                      <ChevronLeft size={20} />
                      Back to My Profile
                    </button>
                  )}
                  <ProfileView 
                    user={user} 
                    targetUserId={viewingProfileId || undefined} 
                    onUpgrade={() => setIsPricingOpen(true)}
                  />
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'upcycle' && (
            <motion.div 
              key="upcycle"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {user && (
                <UpcycleLab 
                  user={user} 
                  initialTag={upcycleTag || undefined} 
                  onViewProfile={(uid) => {
                    setViewingProfileId(uid);
                    setActiveTab('profile');
                  }}
                />
              )}
            </motion.div>
          )}

          {activeTab === 'market' && (
            <motion.div 
              key="market"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {user && (
                <Marketplace 
                  user={user} 
                  userTier={userProfile?.tier}
                  onAddToCart={addToCart} 
                  onDeleteItem={(id, type) => setItemToDelete({ id, type })} 
                />
              )}
            </motion.div>
          )}

          {activeTab === 'contact' && (
            <motion.div 
              key="contact"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ContactView />
            </motion.div>
          )}

          {activeTab === 'privacy' && (
            <motion.div 
              key="privacy"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <PrivacyView />
            </motion.div>
          )}

          {activeTab === 'terms' && (
            <motion.div 
              key="terms"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <TermsView />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cart/Checkout Modal */}
        <AnimatePresence>
          {itemToDelete && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setItemToDelete(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
                  <Trash2 size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Are you sure?</h3>
                  <p className="text-zinc-500 mt-2">This action cannot be undone. This will permanently delete your {itemToDelete.type}.</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setItemToDelete(null)}
                    className="flex-1 px-6 py-3 rounded-2xl font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={async () => {
                      if (itemToDelete.type === 'outfit') {
                        await handleDeleteOutfit(itemToDelete.id);
                      } else if (itemToDelete.type === 'listing') {
                        try {
                          try {
                            await deleteDoc(doc(db, 'listings', itemToDelete.id));
                          } catch (error) {
                            handleFirestoreError(error, OperationType.DELETE, `listings/${itemToDelete.id}`);
                          }
                          setItemToDelete(null);
                        } catch (error) {
                          handleFirestoreError(error, OperationType.DELETE, `listings/${itemToDelete.id}`);
                        }
                      } else {
                        try {
                          // Delete associated listings first
                          const listingsRef = collection(db, 'listings');
                          const q = query(listingsRef, where('garmentId', '==', itemToDelete.id));
                          let listingsSnap;
                          try {
                            listingsSnap = await getDocs(q);
                          } catch (error) {
                            handleFirestoreError(error, OperationType.GET, 'listings');
                          }
                          
                          if (listingsSnap) {
                            const deletePromises = listingsSnap.docs.map(async (doc) => {
                              try {
                                await deleteDoc(doc.ref);
                              } catch (error) {
                                handleFirestoreError(error, OperationType.DELETE, `listings/${doc.id}`);
                              }
                            });
                            await Promise.all(deletePromises);
                          }

                          // Delete the garment
                          try {
                            await deleteDoc(doc(db, 'garments', itemToDelete.id));
                          } catch (error) {
                            handleFirestoreError(error, OperationType.DELETE, `garments/${itemToDelete.id}`);
                          }
                          setSelectedGarment(null);
                          setItemToDelete(null);
                        } catch (error) {
                          handleFirestoreError(error, OperationType.DELETE, `garments/${itemToDelete.id}`);
                        }
                      }
                    }}
                    className="flex-1 bg-red-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-100"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isCartOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-end p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsCartOpen(false)}
            >
              <motion.div 
                initial={{ x: 400 }}
                animate={{ x: 0 }}
                exit={{ x: 400 }}
                className="bg-white w-full max-w-md h-full rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="text-zinc-900" size={24} />
                    <h3 className="text-xl font-bold">Your Cart</h3>
                  </div>
                  <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {checkoutStep === 'cart' && (
                    <>
                      {cart.length > 0 ? (
                        <div className="space-y-4">
                          {cart.map((item, idx) => (
                            <div key={idx} className="flex gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group">
                              <div className="w-20 h-20 rounded-xl overflow-hidden border border-zinc-200 flex-shrink-0">
                                <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.title} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-zinc-900 truncate">{item.title}</h4>
                                <p className="text-zinc-500 text-sm">{item.category}</p>
                                <p className="text-zinc-900 font-bold mt-1">${item.price.toFixed(2)}</p>
                              </div>
                              <button 
                                onClick={() => removeFromCart(idx)}
                                className="p-2 text-zinc-400 hover:text-red-500 transition-colors self-start"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 py-20">
                          <ShoppingBag size={64} className="mb-4 opacity-20" />
                          <p className="text-lg font-medium">Your cart is empty</p>
                          <p className="text-sm">Find something unique in the marketplace!</p>
                        </div>
                      )}
                    </>
                  )}

                  {checkoutStep === 'payment' && (
                    <div className="space-y-8 py-10">
                      <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CreditCard className="text-emerald-600" size={32} />
                        </div>
                        <h4 className="text-xl font-bold">Secure Payment</h4>
                        <p className="text-zinc-500">Processing your transaction...</p>
                      </div>
                      <div className="space-y-4">
                        <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 2 }}
                            className="h-full bg-emerald-500"
                          />
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span className="text-zinc-500">Total Amount</span>
                          <span className="text-zinc-900">${cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {checkoutStep === 'success' && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-10">
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-100"
                      >
                        <CheckCircle2 size={40} />
                      </motion.div>
                      <div className="space-y-2">
                        <h4 className="text-2xl font-bold">Order Confirmed!</h4>
                        <p className="text-zinc-500">Your sustainable style is on its way.</p>
                      </div>
                      <button 
                        onClick={() => setIsCartOpen(false)}
                        className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold"
                      >
                        Back to Shopping
                      </button>
                    </div>
                  )}
                </div>

                {cart.length > 0 && checkoutStep === 'cart' && (
                  <div className="p-6 border-t border-zinc-100 bg-zinc-50 space-y-4">
                    <div className="flex justify-between items-center text-lg">
                      <span className="text-zinc-500 font-medium">Subtotal</span>
                      <span className="text-zinc-900 font-bold">${cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
                    </div>
                    <button 
                      onClick={handleCheckout}
                      className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors shadow-lg"
                    >
                      Checkout Now
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Fullscreen Image Modal */}
        <AnimatePresence>
          {viewingOutfit && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4"
              onClick={() => setViewingOutfit(null)}
            >
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={() => setViewingOutfit(null)}
                  className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors backdrop-blur-md"
                >
                  <X size={24} />
                </button>
              </div>
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="relative w-full max-w-4xl aspect-square bg-white rounded-3xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: viewingOutfit.backgroundColor || '#ffffff' }}>
                  <div className="relative w-full h-full">
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
                          transform: `scale(${item.scaleX !== undefined ? item.scaleX : item.scale}, ${item.scaleY !== undefined ? item.scaleY : item.scale}) rotate(${item.rotation}deg)`,
                          objectFit: 'cover',
                          borderRadius: '4px'
                        }}
                        alt="Outfit item"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadOutfit(viewingOutfit);
                  }}
                  className="bg-white text-zinc-900 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-100 transition-colors shadow-xl"
                >
                  <Download size={20} />
                  Download Outfit
                </button>
              </div>
            </motion.div>
          )}

          {fullscreenImage && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4"
              onClick={() => setFullscreenImage(null)}
            >
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={() => setFullscreenImage(null)}
                  className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors backdrop-blur-md"
                >
                  <X size={24} />
                </button>
              </div>
              <motion.img 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                src={fullscreenImage} 
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
                alt="Fullscreen"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
                <a 
                  href={fullscreenImage} 
                  download="style-recommendation.png"
                  className="bg-white text-zinc-900 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-100 transition-colors shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download size={20} />
                  Download Result
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {croppingImage && (
            <CropModal
              image={croppingImage}
              onCropComplete={handleCropComplete}
              onClose={() => setCroppingImage(null)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isPricingOpen && (
            <PricingModal
              isOpen={isPricingOpen}
              onClose={() => setIsPricingOpen(false)}
              onUpgrade={handleUpgrade}
              onDowngrade={handleUpgrade}
              currentTier={userProfile?.tier || 'basic'}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {limitReached && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-[2rem] p-8 max-w-md w-full text-center shadow-2xl"
              >
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  {limitReached === 'wardrobe' ? <Shirt size={32} /> : <Sparkles size={32} />}
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 mb-2">
                  {limitReached === 'wardrobe' ? 'Wardrobe Limit Reached' : 'Daily AI Limit Reached'}
                </h3>
                <p className="text-zinc-500 mb-8">
                  {limitReached === 'wardrobe' 
                    ? 'Basic users can store up to 10 items. Upgrade to Premium for unlimited space!'
                    : 'You\'ve used your daily style insights. Upgrade to Premium for unlimited AI power!'}
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setLimitReached(null);
                      setIsPricingOpen(true);
                    }}
                    className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
                  >
                    View Premium Plans
                  </button>
                  <button
                    onClick={() => setLimitReached(null)}
                    className="w-full bg-zinc-100 text-zinc-600 py-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
        <Footer onNavigate={(tab: any) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }} />
      </main>
    </div>
  );
}
