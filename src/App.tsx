import React, { useState, useEffect, useRef } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
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
} from "firebase/firestore";
import { Garment, Outfit, OutfitItem } from "./types";
import { Stage, Layer, Rect } from "react-konva";
import ReactMarkdown from "react-markdown";
import {
  Heart,
  MessageSquare,
  Users,
  Grid as GridIcon,
  ShoppingBag,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Image as ImageIcon,
  Save,
  Download,
  Share2,
  X,
  Search,
  Bell,
  Settings,
  MoreVertical,
  Minus,
  Maximize2,
  RotateCcw,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Layout,
  User as LucideUser,
  ArrowLeft,
  Filter,
  Package,
  Check,
  TrendingUp,
  Award,
  Zap,
  Star,
  ExternalLink,
  Edit2,
  LogOut,
  CheckCircle2,
  CreditCard,
  Layers,
  Palette,
  ArrowUpRight,
  Grid,
  List,
  RefreshCw,
  Camera,
  Info,
  Tag,
  Video,
  Shirt,
  LayoutGrid
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getStyleRecommendations, getSummary, generateStyleVisual } from "./services/geminiService";
import { Sidebar } from "./components/Sidebar";
import { ProfileView } from "./components/ProfileView";
import { URLImage } from "./components/URLImage";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import logoLight from "./assets/logo-2.png";
import logoDark from "./assets/logo-1.png";
import "./index.css";


function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { CommunityView } from "./components/CommunityView";
import { UpcycleLab } from "./components/UpcycleLab";
import { Marketplace } from "./components/Marketplace";
import { CommentsSection } from "./components/CommentsSection";
import { CropModal } from "./components/CropModal";
import { PricingModal } from "./components/PricingModal";
import { HomeView } from "./components/HomeView";
import { ContactView } from "./components/ContactView";
import { PrivacyView } from "./components/PrivacyView";
import { TermsView } from "./components/TermsView";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RatingModal } from "./components/RatingModal";
import { compressImage, downloadOutfit, generateOutfitPreview } from "./utils/image";
import { UserProfile, UserTier } from "./types";

import { Footer } from "./components/Footer";
import { useToast } from "./components/Toast";

// --- Main App ---

// helper to generate random values
const rand = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};
const BackgroundBubbles = () => {
  const bubbles = [
    { color1: "#B1A1ED", size: 400, top: "-15%", left: "-10%" },
    { color1: "#F7D550", size: 400, top: "60%", left: "80%" },
    { color1: "#3D7337", size: 400, top: "-20%", left: "70%" },
    { color1: "#FF86A4", size: 400, top: "62%", left: "0%" },
    { color1: "#70ACDE", size: 400, top: "20%", left: "22%" },
    { color1: "#AC3B61", size: 400, top: "-15%", left: "40%" },
    { color1: "#FFBD59", size: 400, top: "35%", left: "47%" },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
      {bubbles.map((b, i) => {
        const xValues = [0, rand(-50, 50), rand(-80, 80), 0];
        const yValues = [0, rand(-50, 50), rand(-80, 80), 0];
        const scaleValues = [1, rand(1.05, 1.15), 1];
        const rotateValues = [0, rand(-20, 20), rand(-20, 20), 0];

        return (
          <motion.div
            key={i}
            className="absolute rounded-full blur-3xl opacity-50"
            style={{
              width: b.size,
              height: b.size,
              top: b.top,
              left: b.left,
              background: `radial-gradient(circle, ${b.color1} 45%, transparent 55%)`,
            }}
            animate={{
              x: xValues,
              y: yValues,
              scale: scaleValues,
              rotate: rotateValues,
            }}
            transition={{
              duration: rand(10, 20),
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
      })}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"home" | "wardrobe" | "styler" | "lab" | "community" | "upcycle" | "market" | "profile" | "contact" | "privacy" | "terms">("home");
  const [communityFilter, setCommunityFilter] = useState<"all" | "following">("all");
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
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isSavingRecommendation, setIsSavingRecommendation] = useState(false);
  const [isPublicRecommendation, setIsPublicRecommendation] = useState(true);
  const [isPublicOutfit, setIsPublicOutfit] = useState(true);
  const [isImageGenEnabled, setIsImageGenEnabled] = useState(false);
  const [isGeneratingVisual, setIsGeneratingVisual] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const GeminiIcon = ({ size = 24, fill = "none", className }: { size?: number; fill?: string; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill === "currentColor" ? "currentColor" : "none"} xmlns="http://www.w3.org/2000/svg" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3L14.5 9.5L21 12L14.5 14.5L12 21L9.5 14.5L3 12L9.5 9.5L12 3Z" />
    </svg>
  );

  // Styler State
  const [stylerItems, setStylerItems] = useState<OutfitItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [stylerBgColor, setStylerBgColor] = useState("#ffffff");
  const [croppingImage, setCroppingImage] = useState<string | null>(null);
  const [wardrobeView, setWardrobeView] = useState<"grid" | "list">("grid");
  const [wardrobeFilter, setWardrobeFilter] = useState("all");
  const [stylerSearch, setStylerSearch] = useState("");
  const [stylerCategoryFilter, setStylerCategoryFilter] = useState("all");
  const [wardrobeVisibleCount, setWardrobeVisibleCount] = useState(12);

  useEffect(() => {
    setWardrobeVisibleCount(12);
  }, [wardrobeFilter]);

  const moveItem = (direction: "up" | "down" | "front" | "back") => {
    if (selectedId === null) return;
    const items = [...stylerItems];
    let newId = selectedId;

    if (direction === "up") newId = selectedId + 1;
    else if (direction === "down") newId = selectedId - 1;
    else if (direction === "front") newId = items.length - 1;
    else if (direction === "back") newId = 0;

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
  const [editGarmentData, setEditGarmentData] = useState({ category: "", tags: "" });
  const [upcycleTag, setUpcycleTag] = useState<string | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "payment" | "success">("cart");
  const [paymentData, setPaymentData] = useState({ cardNumber: "", expiry: "", cvc: "", name: "" });
  const [ratingTarget, setRatingTarget] = useState<{ orderId: string; sellerId: string; sellerName: string } | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<UserProfile[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  useEffect(() => {
    if (!userSearchQuery.trim()) {
      setUserSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const searchLower = userSearchQuery.toLowerCase();

        const qLower = query(
          collection(db, "users"),
          where("displayNameLower", ">=", searchLower),
          where("displayNameLower", "<=", searchLower + "\uf8ff")
        );

        const qNormal = query(
          collection(db, "users"),
          where("displayName", ">=", userSearchQuery),
          where("displayName", "<=", userSearchQuery + "\uf8ff")
        );

        const [snapshotLower, snapshotNormal] = await Promise.all([
          getDocs(qLower),
          getDocs(qNormal)
        ]);

        const usersMap = new Map<string, UserProfile>();
        snapshotLower.docs.forEach(doc => {
          const data = doc.data() as UserProfile;
          usersMap.set(data.uid, data);
        });
        snapshotNormal.docs.forEach(doc => {
          const data = doc.data() as UserProfile;
          usersMap.set(data.uid, data);
        });

        const users = Array.from(usersMap.values());
        setUserSearchResults(users.filter(u => u.uid !== user?.uid));
      } catch (error) {
        console.error("User search failed", error);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [userSearchQuery, user?.uid]);

  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: "outfit" | "garment" | "listing" } | null>(null);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [limitReached, setLimitReached] = useState<"wardrobe" | "ai" | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark" ||
        (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    return false;
  });

  const { addToast } = useToast();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userRef = doc(db, "users", u.uid);

        unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data() as any;
            const profile: UserProfile = {
              ...userData,
              tier: userData.tier || "basic"
            };
            setUserProfile(profile);
            setFavoriteIds(userData.favorites || []);
            setLoading(false);
          } else {
            const newProfile: UserProfile = {
              uid: u.uid,
              displayName: u.displayName || "Anonymous",
              displayNameLower: (u.displayName || "Anonymous").toLowerCase(),
              photoURL: u.photoURL || "",
              coverPhotoURL: "",
              bio: "",
              favorites: [],
              tier: "basic",
              createdAt: new Date().toISOString()
            };
            setDoc(userRef, {
              ...newProfile,
              createdAt: serverTimestamp()
            }).then(() => {
              setUserProfile(newProfile);
              setFavoriteIds([]);
              setLoading(false);
            }).catch(err => {
              console.error("Profile creation failed", err);
              setLoading(false);
            });
          }
        }, (error) => {
          console.error("Profile listener failed", error);
          setLoading(false);
        });
      } else {
        setUserProfile(null);
        setFavoriteIds([]);
        if (unsubscribeProfile) unsubscribeProfile();
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const [viewingComments, setViewingComments] = useState<{ id: string; type: "outfits" | "tutorials" } | null>(null);
  const [selectedCardSize, setSelectedCardSize] = useState<"small" | "medium" | "large">("medium");
  const [temporaryOutfit, setTemporaryOutfit] = useState<Outfit | null>(null);

  useEffect(() => {
    if (viewingComments?.type === 'outfits') {
      const id = viewingComments.id;
      const found = outfits.find(o => o.id === id);
      if (!found && !viewingOutfit) {
        getDoc(doc(db, "outfits", id)).then(snap => {
          if (snap.exists()) {
            setTemporaryOutfit({ ...snap.data(), id: snap.id } as Outfit);
          }
        }).catch(err => console.error("Error fetching outfit detail:", err));
      } else {
        setTemporaryOutfit(null);
      }
    } else {
      setTemporaryOutfit(null);
    }
  }, [viewingComments, outfits, viewingOutfit]);

  const canvasDimensions = React.useMemo(() => {
    switch (selectedCardSize) {
      case 'small': return { width: 800, height: 600 };
      case 'large': return { width: 533, height: 800 };
      default: return { width: 800, height: 800 };
    }
  }, [selectedCardSize]);

  useEffect(() => {
    if (!user) return;

    const garmentsQuery = query(
      collection(db, "garments"),
      where("ownerId", "==", user.uid)
    );
    const unsubscribeGarments = onSnapshot(garmentsQuery, (snapshot) => {
      const gList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Garment));
      gList.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setGarments(gList);
    }, (error) => handleFirestoreError(error, OperationType.GET, "garments"));

    const outfitsQuery = query(
      collection(db, "outfits"),
      where("isPublic", "==", true)
    );
    const unsubscribeOutfits = onSnapshot(outfitsQuery, (snapshot) => {
      const oList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Outfit));
      oList.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setOutfits(oList);
    }, (error) => handleFirestoreError(error, OperationType.GET, "outfits"));

    return () => {
      unsubscribeGarments();
      unsubscribeOutfits();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "follows"), where("followerId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFollowedUserIds(snapshot.docs.map(d => d.data().followingId));
    }, (error) => handleFirestoreError(error, OperationType.GET, "follows"));
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
      if (authMode === "signup") {
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
        await updateDoc(doc(db, "users", user.uid), { tier });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
      setUserProfile(prev => prev ? { ...prev, tier } : null);
      addToast(tier === "premium" ? "Welcome to Premium!" : "Subscription cancelled.", "success");
    } catch (error) {
      console.error("Upgrade failed", error);
      addToast("Failed to update subscription.", "error");
    }
  };

  const handleCheckout = async () => {
    if (!user || cart.length === 0) return;
    setIsCheckingOut(true);

    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const orderPromises = cart.map(async (item) => {
        const orderData = {
          buyerId: user.uid,
          sellerId: item.sellerId,
          listingId: item.id,
          title: item.title,
          price: item.price,
          imageUrl: item.imageUrl,
          status: "completed",
          createdAt: serverTimestamp()
        };

        const orderRef = await addDoc(collection(db, "orders"), orderData);
        await updateDoc(doc(db, "listings", item.id), { status: "sold" });

        return orderRef;
      });

      await Promise.all(orderPromises);

      setCart([]);
      setCheckoutStep("success");
      addToast("Order placed successfully!", "success");
    } catch (error) {
      console.error("Checkout failed", error);
      addToast("Checkout failed. Please try again.", "error");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleRatingSubmit = async (rating: number, comment: string) => {
    if (!user || !ratingTarget) return;

    try {
      await addDoc(collection(db, "ratings"), {
        orderId: ratingTarget.orderId,
        reviewerId: user.uid,
        targetUserId: ratingTarget.sellerId,
        rating,
        comment,
        createdAt: serverTimestamp()
      });

      const sellerRef = doc(db, "users", ratingTarget.sellerId);
      const sellerSnap = await getDoc(sellerRef);
      if (sellerSnap.exists()) {
        const sellerData = sellerSnap.data();
        const currentRating = sellerData.sellerRating || 0;
        const currentCount = sellerData.sellerReviewCount || 0;

        const newCount = currentCount + 1;
        const newRating = (currentRating * currentCount + rating) / newCount;

        await updateDoc(sellerRef, {
          sellerRating: newRating,
          sellerReviewCount: newCount
        });
      }

      addToast("Review submitted! Thank you.", "success");
      setRatingTarget(null);
    } catch (error) {
      console.error("Rating submission failed", error);
      addToast("Failed to submit review.", "error");
    }
  };

  const handleLogout = () => signOut(auth);

  const handleAddGarment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (userProfile?.tier === "basic" && garments.length >= 10) {
      setLimitReached("wardrobe");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCroppingImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropComplete = async (croppedImage: string) => {
    if (!user) return;
    setCroppingImage(null);

    try {
      try {
        await addDoc(collection(db, "garments"), {
          ownerId: user.uid,
          imageUrl: croppedImage,
          category: "Uncategorized",
          tags: [],
          createdAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, "garments");
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
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(imageUrl);

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

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

          const dist = Math.sqrt(
            Math.pow(r - bgR, 2) +
            Math.pow(g - bgG, 2) +
            Math.pow(b - bgB, 2)
          );

          if (dist < 30 || (r > 230 && g > 230 && b > 230)) {
            data[i + 3] = 0;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve(imageUrl);
    });
  };

  const handleUpdateGarment = async () => {
    if (!selectedGarment) return;
    try {
      const garmentRef = doc(db, "garments", selectedGarment.id);
      try {
        await updateDoc(garmentRef, {
          category: editGarmentData.category,
          tags: editGarmentData.tags.split(",").map(t => t.trim()).filter(t => t !== "")
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
      const userRef = doc(db, "users", user.uid);
      if (isFavorite) {
        try {
          await updateDoc(userRef, { favorites: arrayRemove(outfitId) });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
        }
        setFavoriteIds(prev => prev.filter(id => id !== outfitId));
      } else {
        try {
          await updateDoc(userRef, { favorites: arrayUnion(outfitId) });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
        }
        setFavoriteIds(prev => [...prev, outfitId]);
      }

      const outfitRef = doc(db, "outfits", outfitId);
      try {
        await updateDoc(outfitRef, { likesCount: increment(isFavorite ? -1 : 1) });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `outfits/${outfitId}`);
      }
    } catch (error) {
      console.error("Favorite toggle failed", error);
    }
  };

  const handleAnalyze = async () => {
    if (!aiImage || isAnalyzing || !user) return;

    if (userProfile?.lastGenerationAt) {
      const lastGen = new Date(userProfile.lastGenerationAt).getTime();
      const now = new Date().getTime();
      if (now - lastGen < 10000) {
        addToast("Please wait 10 seconds between AI requests to prevent spam.", "info");
        return;
      }
    }

    const quota = userProfile?.tier === "premium" ? 5 : 0;
    const currentCount = userProfile?.generationCount || 0;

    if (isImageGenEnabled && currentCount >= quota) {
      addToast(`You've reached your ${userProfile?.tier} limit of ${quota} image generations. Upgrade to Premium for more!`, "error");
      return;
    }

    setIsAnalyzing(true);
    setRecommendations(null);
    setVisualRecommendation(null);
    setIsGeneratingVisual(false);

    try {
      const textResult = await getStyleRecommendations(aiImage);
      setRecommendations(textResult);

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { lastGenerationAt: new Date().toISOString() });

      if (isImageGenEnabled && userProfile?.tier === "premium") {
        setIsGeneratingVisual(true);
        try {
          const visualResult = await generateStyleVisual(textResult, aiImage);
          setVisualRecommendation(visualResult || null);
          await updateDoc(userRef, { generationCount: increment(1) });
        } catch (err: any) {
          console.error("Visual generation failed", err);
          addToast(err.message || "Failed to generate AI visual.", "error");
        } finally {
          setIsGeneratingVisual(false);
        }
      }
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveRecommendation = async () => {
    if (!user || !recommendations || !aiImage) {
      console.warn("Missing data for saving recommendation", { user: !!user, recs: !!recommendations, aiImage: !!aiImage });
      return;
    }
    setIsSavingRecommendation(true);
    try {
      console.log("Saving recommendation...");
      const summaryResult = await getSummary(recommendations);
      console.log("Summary generated:", summaryResult);

      if (!visualRecommendation) {
        addToast("Please wait for the AI to generate the visual recommendation before saving.", "info");
        return;
      }
      const imageToSave = visualRecommendation;
      const compressedImage = await compressImage(imageToSave, 800, 800, 0.8);

      let docRef;
      try {
        docRef = await addDoc(collection(db, "saved_recommendations"), {
          userId: user.uid,
          userName: user.displayName || "Anonymous",
          userPhoto: user.photoURL || "",
          imageUrl: compressedImage,
          summary: summaryResult,
          isPublic: isPublicRecommendation,
          createdAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, "saved_recommendations");
      }

      if (docRef) {
        console.log("Recommendation saved with ID:", docRef.id);
        addToast("Style recommendation saved to your profile!", "success");
      }
    } catch (error) {
      console.error("Failed to save recommendation", error);
      addToast("Failed to save recommendation. Please try again.", "error");
    } finally {
      setIsSavingRecommendation(false);
    }
  };

  const handleSaveOutfit = async () => {
    if (!user || stylerItems.length === 0) return;
    setIsSaving(true);
    try {
      const allTags = new Set<string>();
      stylerItems.forEach(item => {
        const garment = garments.find(g => g.id === item.garmentId);
        if (garment && garment.tags) {
          garment.tags.forEach(t => allTags.add(t.toLowerCase()));
        }
      });

      const previewUrl = await generateOutfitPreview({
        items: stylerItems,
        backgroundColor: stylerBgColor
      });

      const optimizedItems = stylerItems.map(item => ({
        ...item,
        imageUrl: ""
      }));

      try {
        await addDoc(collection(db, "outfits"), {
          authorId: user.uid,
          authorName: user.displayName || "Anonymous",
          authorPhoto: user.photoURL || "",
          items: optimizedItems,
          previewUrl,
          backgroundColor: stylerBgColor,
          likesCount: 0,
          commentsCount: 0,
          isPublic: isPublicOutfit,
          tags: Array.from(allTags),
          cardSize: isPublicOutfit ? selectedCardSize : "medium",
          createdAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, "outfits");
      }
      setStylerItems([]);
      if (isPublicOutfit) {
        setActiveTab("community");
      } else {
        setActiveTab("profile");
      }
      addToast(isPublicOutfit ? "Outfit posted to community!" : "Outfit saved privately to your profile!", "success");
    } catch (error) {
      console.error("Failed to save outfit", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOutfit = async (outfitId: string) => {
    try {
      const commentsRef = collection(db, "outfits", outfitId, "comments");
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

      try {
        await deleteDoc(doc(db, "outfits", outfitId));
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
    setCheckoutStep("cart");
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };


  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <RefreshCw className="animate-spin text-emerald-500" size={32} />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-cream dark:bg-dark flex flex-col items-center justify-center p-6 font-body relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[30%] aspect-square bg-lavender-support rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] aspect-square bg-orange rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[70%] w-[30%] aspect-square bg-light-green rounded-full blur-[120px] animate-pulse" />
      <div className="absolute top-[-20%] right-[10%] w-[30%] aspect-square bg-pink rounded-full blur-[120px] animate-pulse" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-cream-support dark:bg-[#111110] backdrop-blur-xl p-10 rounded-[3rem] shadow-2xl relative z-10 retro-shadow-primary"
      >
        <div className="relative z-10">
          <div className="w-full h-full flex items-center justify-center mx-auto mb-5 hover:rotate-12 transition-transform">
            <div className="flex items-center gap-2">
              <img src={logoLight} alt="Social Thrift Logo" className="h-20 w-auto object-contain dark:hidden" />
              <img src={logoDark} alt="Social Thrift Logo" className="h-20 w-auto object-contain dark:block hidden border-dark/10 dark:border-white/10" />
            </div>
          </div>
          <p className="text-dark/50 dark:text-primary/50 font-alt text-center mb-8 text-lg font-medium leading-tight">
            {authMode === "login" ? '"Turning Second Chances into First Choices."' : '"Your Ex\'s Clothes? Upgrade Them."'}
          </p>

          <form onSubmit={handleEmailAuth} className="space-y-6 mb-8">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-primary uppercase tracking-[0.2em] px-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-bg/50 dark:bg-[#F7D550]/10 border-2 border-primary/10 rounded-4xl px-6 py-5 text-dark dark:text-primary/50 focus:outline-none focus:border-primary transition-all"
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
                className="w-full bg-bg/50 dark:bg-[#F7D550]/10 border-2 border-primary/10 rounded-4xl px-6 py-5 text-dark dark:text-primary/50 focus:outline-none focus:border-primary transition-all"
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
              className="w-full bg-yellow-support dark:bg-[#024A34] text-primary dark:text-primary rounded-4xl py-5 font-heading text-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl retro-shadow-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAuthenticating ? "Wait a sec..." : (authMode === "login" ? "Sign In" : "Create Account")}
            </button>
          </form>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-primary/10 py-3"></div>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={isAuthenticating}
            className="w-full bg-pink dark:bg-dark text-dark dark:text-text rounded-4xl py-5 font-heading text-xl flex items-center justify-center gap-3 transition-all retro-shadow-text hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
            Continue with Google
          </button>

          <p className="mt-10 text-center text-dark/60 dark:text-cream-support/60 font-medium">
            {authMode === "login" ? "New here?" : "Already a member?"}
            <button
              onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
              className="ml-2 text-primary font-bold hover:underline underline-offset-4"
            >
              {authMode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </motion.div>

      <div className="mt-12 text-dark/30 text-[10px] font-bold uppercase tracking-[0.4em] relative z-10">
        © 2026 Social Thrift • RE:Thriva
      </div>
    </div>
  );

  const filteredOutfits = (communityFilter === "all"
    ? outfits
    : outfits.filter(o => followedUserIds.includes(o.authorId))
  ).filter(o => {
    if (!userSearchQuery.trim()) return true;
    const query = userSearchQuery.toLowerCase();
    const matchesAuthor = o.authorName.toLowerCase().includes(query);
    const matchesTags = o.tags?.some(t => t.toLowerCase().includes(query));
    return matchesAuthor || matchesTags;
  });

  return (
    <ErrorBoundary>
      <div className={cn("min-h-screen transition-colors duration-300", darkMode ? "dark" : "")}>
        <BackgroundBubbles />

        <Sidebar
          user={user}
          userUserProfile={userProfile}
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

        <main className="md:pl-[120px] transition-all duration-300 min-h-screen">
          <header className="sticky top-0 z-40 p-6 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-4 pointer-events-auto px-6 py-3">
              <div className="flex items-center gap-3">
                <img src={logoLight} alt="Social Thrift Logo" className="h-15 w-auto object-contain dark:hidden" />
                <img src={logoDark} alt="Social Thrift Logo" className="h-15 w-auto object-contain dark:block hidden border-dark/10 dark:border-white/10" />
              </div>
              <div className="h-6 w-px bg-primary/10 mx-1" />
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-[10px] font-bold px-3 py-1 rounded-full w-fit uppercase tracking-widest shadow-sm",
                    userProfile?.tier === "premium"
                      ? "bg-orange text-primary dark:text-dark-green"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  {userProfile?.tier === "premium" ? "Premium" : "Free"}
                </span>

                {userProfile?.tier !== "premium" && (
                  <button
                    onClick={() => setIsPricingOpen(true)}
                    className="text-[10px] font-bold text-primary hover:underline transition-all dark:text-yellow-support"
                  >
                    Upgrade
                  </button>
                )}
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto p-4 md:p-4 pb-24 md:pb-4">
            <AnimatePresence mode="wait">
              {activeTab === "home" && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <HomeView
                    userName={user.displayName || "Friend"}
                    setActiveTab={(tab) => setActiveTab(tab as any)}
                  />
                </motion.div>
              )}

              {activeTab === "lab" && (
                <motion.div
                  key="lab"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-4xl mx-auto space-y-4 pb-16"
                >
                  {/* AI Lab Hero Banner */}
                  <div className="relative rounded-[2.5rem] overflow-hidden mb-8 bg-light-green dark:bg-[#024A34] border-2 border-primary dark:border-yellow-support/50" style={{ minHeight: 200 }}>
                    <div
                      className="absolute inset-0 opacity-[0.10]"
                      style={{
                        backgroundImage: `
                          repeating-linear-gradient(0deg, transparent, transparent 39px, var(--grid-color) 39px, var(--grid-color) 40px),
                          repeating-linear-gradient(90deg, transparent, transparent 39px, var(--grid-color) 39px, var(--grid-color) 40px)
                        `
                      }}
                    />
                    <motion.div className="absolute -right-10 bottom-0 w-40 h-50 bg-primary/10 rounded-full" />
                    <motion.div className="absolute right-30 -bottom-4 w-40 h-30 bg-primary/10 rounded-full rotate-40" />
                    <motion.div className="absolute right-33 top-5 w-15 h-16 bg-primary/10 rounded-full" />
                    <div className="relative z-10 p-8 md:p-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-primary dark:text-yellow-support">
                          <GeminiIcon size={14} className="text-primary dark:text-yellow-support" />
                          <span className="text-primary dark:text-yellow-support text-xs font-bold uppercase tracking-[0.3em]">AI Powered</span>
                        </div>
                        <h2 className="text-6xl md:text-7xl font-heading text-primary dark:text-yellow-support leading-none">Style Lab</h2>
                        <p className="text-dark/70 dark:text-yellow-support text-sm font-medium max-w-lg">Discover new ways to wear your favorites and get instant thrift tips.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
                    <div className="md:col-span-5 space-y-6">
                      <div
                        className={cn(
                          "aspect-[3/4] rounded-[2.5rem] border-2 border-dashed border-primary/50 dark:border-light-green/80 hover:border-primary/70 dark:hover:border-light-green bg-card shadow-sm flex flex-col items-center justify-center overflow-hidden relative group transition-all",
                          aiImage && "border-none shadow-2xl"
                        )}
                      >
                        {aiImage ? (
                          <>
                            <img src={aiImage} className="w-full h-full object-cover" alt="To analyze" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                onClick={() => setAiImage(null)}
                                className="p-4 bg-card text-text rounded-2xl shadow-xl hover:scale-110 transition-transform"
                              >
                                <X size={24} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-8 space-y-6">
                            <div className="w-20 h-20 bg-primary/10 text-bg hover rounded-full flex items-center justify-center mx-auto text-text-muted group-hover:scale-110 transition-transform">
                              <Camera size={32} />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xl font-bold text-text">Upload Outfit</p>
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
                              className="bg-pink dark:bg-[#024A34] text-primary dark:text-yellow-support px-8 py-4 rounded-full text-lg font-heading hover:scale-105 transition-all retro-shadow-primary"
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
                          className="w-full bg-pink dark:bg-[#024A34] text-primary py-5 rounded-full font-heading text-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all disabled:opacity-50 retro-shadow-primary"
                        >
                          {isAnalyzing ? <RefreshCw className="animate-spin" /> : <GeminiIcon size={20} />}
                          {isAnalyzing ? "Analyzing Style..." : "Get Recommendations"}
                        </button>
                      )}
                    </div>

                    <div className="md:col-span-7 bg-card rounded-[2.5rem] p-8 border border-border min-h-[500px] flex flex-col shadow-xl">
                      <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                        <div className="flex items-center gap-6">
                          <h3 className="text-xl font-heading flex items-center gap-3 text-primary dark:text-yellow-support">
                            <GeminiIcon className="text-primary dark:text-yellow-support" size={24} />
                            Style Insights
                          </h3>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                if (userProfile?.tier === "premium") {
                                  setIsImageGenEnabled(!isImageGenEnabled);
                                } else {
                                  setIsPricingOpen(true);
                                }
                              }}
                              className={cn(
                                "w-10 h-5 rounded-full transition-colors relative",
                                isImageGenEnabled && userProfile?.tier === "premium" ? "bg-primary" : "bg-zinc-200",
                                userProfile?.tier !== "premium" && "opacity-50 cursor-not-allowed"
                              )}
                              title={userProfile?.tier === "premium" ? "Toggle AI Image Generation" : "Premium Feature"}
                            >
                              <motion.div
                                animate={{ x: isImageGenEnabled && userProfile?.tier === "premium" ? 22 : 2 }}
                                className="w-3.5 h-3.5 bg-card rounded-full absolute top-[3px]"
                              />
                            </button>
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                                AI Visual: {isImageGenEnabled && userProfile?.tier === "premium" ? "ON" : "OFF"}
                              </span>
                              {userProfile?.tier !== "premium" && (
                                <span className="text-[7px] font-bold text-primary uppercase">Premium Only</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {recommendations && !isAnalyzing && (
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setIsPublicRecommendation(!isPublicRecommendation)}
                                className={cn(
                                  "w-10 h-5 rounded-full transition-colors relative",
                                  isPublicRecommendation ? "bg-emerald-500" : "bg-zinc-200"
                                )}
                              >
                                <motion.div
                                  animate={{ x: isPublicRecommendation ? 22 : 2 }}
                                  className="w-3.5 h-3.5 bg-card rounded-full absolute top-[3px]"
                                />
                              </button>
                              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                                {isPublicRecommendation ? "Public" : "Private"}
                              </span>
                            </div>
                            <button
                              onClick={handleSaveRecommendation}
                              disabled={isSavingRecommendation || (isImageGenEnabled && !visualRecommendation)}
                              className="p-2.5 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 shadow-lg"
                              title={isImageGenEnabled && !visualRecommendation ? "Generating visual..." : "Save to Profile"}
                            >
                              {isSavingRecommendation ? <RefreshCw className="animate-spin" size={16} /> : (
                                isImageGenEnabled && !visualRecommendation ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-8 overflow-y-auto max-h-[600px] pr-4 custom-scrollbar">
                        {isGeneratingVisual && (
                          <div className="aspect-video rounded-3xl bg-card-hover flex flex-col items-center justify-center space-y-4 border border-border">
                            <RefreshCw className="animate-spin text-primary" size={32} />
                            <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Generating DALL-E Visual...</p>
                          </div>
                        )}

                        {visualRecommendation && !isGeneratingVisual && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="aspect-video rounded-3xl overflow-hidden border border-border shadow-lg relative group"
                          >
                            <img src={visualRecommendation} className="w-full h-full object-cover" alt="AI Recommendation" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                              <button
                                onClick={() => setFullscreenImage(visualRecommendation)}
                                className="p-3 bg-card text-text rounded-full hover:scale-110 transition-transform shadow-xl border border-border"
                              >
                                <Maximize2 size={24} />
                              </button>
                              <a
                                href={visualRecommendation}
                                download="style-recommendation.png"
                                className="p-3 bg-card text-text rounded-full hover:scale-110 transition-transform shadow-xl border border-border"
                              >
                                <Download size={24} />
                              </a>
                            </div>
                          </motion.div>
                        )}

                        {recommendations ? (
                          <div className="prose prose-zinc prose-lg max-w-none">
                            <div className="text-primary/70 leading-relaxed font-medium">
                              <ReactMarkdown>{recommendations}</ReactMarkdown>
                            </div>
                          </div>
                        ) : (
                          !isAnalyzing && (
                            <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-6">
                              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-text-muted">
                                <GeminiIcon size={40} />
                              </div>
                              <div className="space-y-2">
                                <p className="text-xl font-bold text-text">No Insights Yet</p>
                                <p className="text-zinc-400 font-medium max-w-xs mx-auto">Upload a photo to see AI-powered style recommendations here.</p>
                              </div>
                            </div>
                          )
                        )}

                        {isAnalyzing && (
                          <div className="h-full flex flex-col items-center justify-center py-20 space-y-8">
                            <div className="relative">
                              <RefreshCw className="animate-spin text-primary" size={48} />
                              <GeminiIcon className="absolute -top-3 -right-3 text-pink animate-pulse" size={24} />
                            </div>
                            <div className="text-center space-y-2">
                              <p className="text-xl font-bold text-text">Analyzing Your Style</p>
                              <p className="text-zinc-400 font-medium animate-pulse">Consulting our AI fashion experts...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* WARDROBE TAB */}
              {activeTab === "wardrobe" && (
                <motion.div
                  key="wardrobe"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  className="pb-40"
                >
                  {/* Hero banner */}
                  <div className="relative rounded-[2.5rem] overflow-hidden mb-8 bg-pink dark:bg-[#AC3B61] border-2 border-primary dark:border-pink" style={{ minHeight: 200 }}>
                    <div
                      className="absolute inset-0 opacity-[0.10]"
                      style={{
                        backgroundImage: `
                          repeating-linear-gradient(0deg, transparent, transparent 39px, var(--grid-color) 39px, var(--grid-color) 40px),
                          repeating-linear-gradient(90deg, transparent, transparent 39px, var(--grid-color) 39px, var(--grid-color) 40px)
                        `
                      }}
                    />
                    <motion.div className="absolute -right-10 bottom-0 w-40 h-50 bg-primary/10 dark:bg-pink/10 rounded-full" />
                    <motion.div className="absolute right-30 -bottom-4 w-40 h-30 bg-primary/10 dark:bg-pink/10 rounded-full rotate-40" />
                    <motion.div className="absolute right-33 top-5 w-15 h-16 bg-primary/10 dark:bg-pink/10 rounded-full" />
                    <div className="relative z-10 p-8 md:p-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-pink">
                          <Shirt size={14} className="text-dark dark:text-pink" />
                          <span className="text-dark dark:text-pink text-xs font-bold uppercase tracking-[0.3em]">Personal Collection</span>
                        </div>
                        <h2 className="text-6xl md:text-7xl font-heading text-primary dark:text-cream-support leading-none">My Wardrobe</h2>
                        <p className="text-dark/70 dark:text-pink text-sm font-medium">{garments.length} {garments.length === 1 ? "piece" : "pieces"} in your collection</p>
                      </div>
                      <label className="bg-primary dark:bg-cream-support text-[#FFD7E1] dark:text-[#AC3B61] px-7 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest cursor-pointer flex items-center gap-2 hover:bg-cream-support hover:text-primary dark:hover:bg-[#024A34] dark:hover:text-pink retro-shadow-wardrobe transition-all shadow-xl w-fit">
                        <Plus size={16} strokeWidth={3} />
                        Add Item
                        <input type="file" accept="image/*" className="hidden" onChange={handleAddGarment} />
                      </label>
                    </div>
                  </div>

                  {/* filter bar */}
                  <div className="flex items-center gap-2 mb-6 bg-primary dark:bg-cream-support rounded-full p-1.5 border border-black/5 shadow-sm w-full">
                    {/* scrollable category pills */}
                    <div className="flex items-center gap-1 flex-1 overflow-x-auto scroll-smooth min-w-0">
                      {(["all", ...Array.from(new Set(garments.map(g => g.category)))]).map(cat => (
                        <button
                          key={cat}
                          onClick={() => setWardrobeFilter(cat)}
                          className={cn(
                            "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex-shrink-0",
                            wardrobeFilter === cat
                              ? "bg-pink dark:bg-[#AC3B61] text-primary dark:text-white shadow-md"
                              : "text-light-green hover:text-pink dark:text-[#AC3B61] dark:hover:text-dark"
                          )}
                        >
                          {cat === "all" ? "All Items" : cat}
                        </button>
                      ))}
                    </div>
                    {/* divider */}
                    <div className="w-px h-5 bg-light-green/30 dark:bg-[#AC3B61]/30 flex-shrink-0 mx-1" />
                    {/* view toggle pinned to the right */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setWardrobeView("grid")}
                        className={cn(
                          "p-2.5 rounded-full transition-all",
                          wardrobeView === "grid"
                            ? "bg-pink dark:bg-[#AC3B61] text-primary dark:text-white shadow-sm"
                            : "text-light-green dark:text-[#AC3B61] hover:text-pink"
                        )}
                      >
                        <Grid size={15} />
                      </button>
                      <button
                        onClick={() => setWardrobeView("list")}
                        className={cn(
                          "p-2.5 rounded-full transition-all",
                          wardrobeView === "list"
                            ? "bg-pink dark:bg-[#AC3B61] text-primary dark:text-white shadow-sm"
                            : "text-light-green dark:text-[#AC3B61] hover:text-pink"
                        )}
                      >
                        <List size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Items */}
                  {(() => {
                    const filteredGarments = garments.filter(g => wardrobeFilter === "all" || g.category === wardrobeFilter);
                    const visibleGarments = filteredGarments.slice(0, wardrobeVisibleCount);

                    if (garments.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-40 space-y-6 text-center">
                          <div className="w-28 h-28 rounded-[2rem] bg-cream-support border border-black/5 shadow-xl flex items-center justify-center text-primary dark:text-[#AC3B61]">
                            <Shirt size={52} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-2xl font-bold text-primary dark:text-cream-support">Your wardrobe is empty</p>
                            <p className="text-dark/50 dark:text-cream-support/50 text-sm">Start adding items to build your digital collection!</p>
                          </div>
                          <label className="bg-primary dark:bg-cream-support text-white dark:text-[#AC3B61] px-8 py-3.5 rounded-full retro-shadow-wardrobe font-bold text-sm uppercase tracking-widest cursor-pointer flex items-center gap-2 hover:bg-cream-support dark:hover:bg-[#024A34] hover:text-primary dark:hover:text-pink transition-all shadow-lg shadow-primary/20">
                            <Plus size={16} strokeWidth={3} /> Add First Item
                            <input type="file" accept="image/*" className="hidden" onChange={handleAddGarment} />
                          </label>
                        </div>
                      );
                    }

                    return (
                      <>
                        <div className="pr-2">
                          {wardrobeView === "grid" ? (
                            // canvass ──
                            <div className="rounded-[2rem] border-2 border-dashed border-primary/40 dark:border-cream-support/30 p-4 checkerboard max-h-[80vh] overflow-y-auto custom-scrollbar">
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {visibleGarments.map((garment, idx) => (
                                  <motion.div
                                    layout
                                    key={garment.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.03 }}
                                    whileHover={{ y: -6 }}
                                    onClick={() => setSelectedGarment(garment)}
                                    className="group relative aspect-[3/4] bg-primary dark:bg-cream-support checkerboard rounded-[1.75rem] overflow-hidden border border-primary/5 hover:shadow-2xl shadow-primary/20 dark:shadow-cream-support/20 transition-all duration-400 cursor-pointer"
                                  >
                                    <img src={garment.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Garment" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                                      <p className="text-light-green dark:text-cream-support font-bold text-sm leading-tight translate-y-2 group-hover:translate-y-0 transition-transform duration-300">{garment.category}</p>
                                      {garment.tags.length > 0 && (
                                        <p className="text-white/60 text-[10px] mt-0.5 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">#{garment.tags[0]}</p>
                                      )}
                                    </div>
                                    <div className="absolute top-2.5 right-2.5 w-6 h-6 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                      <ArrowUpRight size={12} className="text-primary" />
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                              {visibleGarments.map((garment, idx) => (
                                <motion.div
                                  key={garment.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.04 }}
                                  onClick={() => setSelectedGarment(garment)}
                                  className="group flex items-center gap-5 bg-cream-support dark:bg-dark rounded-2xl p-4 border border-black/5 hover:border-primary/70 dark:hover:border-pink/70 hover:shadow-lg transition-all cursor-pointer"
                                >
                                  <div className="w-14 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-50 checkerboard" style={{ height: 72 }}>
                                    <img src={garment.imageUrl} className="w-full h-full object-cover" alt="Garment" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-primary dark:text-cream-support text-sm">{garment.category}</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {garment.tags.slice(0, 3).map((tag, i) => (
                                        <span key={i} className="text-[10px] font-bold text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded-md border border-zinc-100">#{tag}</span>
                                      ))}
                                    </div>
                                  </div>
                                  <ChevronRight size={16} className="text-zinc-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>

                        {filteredGarments.length > wardrobeVisibleCount && (
                          <div className="flex justify-center mt-12 mb-8">
                            <button
                              onClick={() => setWardrobeVisibleCount(prev => prev + 12)}
                              className="group relative px-10 py-5 bg-primary dark:bg-pink text-white rounded-[2rem] font-heading text-xl tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/30 flex items-center gap-4"
                            >
                              <div className="flex items-center justify-center transition-transform duration-700 group-hover:rotate-180">
                                <Plus size={24} strokeWidth={3} />
                              </div>
                              Load More Styles
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}

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
                          className="bg-bg border-2 border-primary dark:border-pink rounded-[3rem] overflow-hidden max-w-4xl w-full flex flex-col md:flex-row shadow-2xl shadow-primary/20 dark:shadow-pink/20 relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="md:w-1/2 aspect-[3/4] bg-zinc-50 checkerboard relative group">
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
                                    className="text-3xl font-heading text-primary dark:text-pink bg-card border-2 border-primary/50 dark:border-[#AC3B61]/50 rounded-2xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  />
                                ) : (
                                  <h3 className="text-4xl font-heading text-primary dark:text-cream-support leading-tight">{selectedGarment.category}</h3>
                                )}
                                <p className="text-primary/50 dark:text-cream-support/50 text-sm font-medium">Added {selectedGarment.createdAt && typeof selectedGarment.createdAt.toDate === "function" ? selectedGarment.createdAt.toDate().toLocaleDateString() : "Just now"}</p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    if (isEditingGarment) {
                                      handleUpdateGarment();
                                    } else {
                                      setEditGarmentData({
                                        category: selectedGarment.category,
                                        tags: selectedGarment.tags.join(", ")
                                      });
                                      setIsEditingGarment(true);
                                    }
                                  }}
                                  className="p-3 hover:bg-pink/50 dark:hover:bg-cream-support/50 rounded-full text-primary dark:text-pink hover:text-primary dark:hover:text-pink transition-colors"
                                >
                                  {isEditingGarment ? <Save size={24} /> : <Edit2 size={24} />}
                                </button>
                                <button onClick={() => { setSelectedGarment(null); setIsEditingGarment(false); }} className="p-3 hover:bg-pink/50 dark:hover:bg-cream-support/50 rounded-full text-primary dark:text-pink hover:text-primary dark:hover:text-pink">
                                  <X size={28} />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-6 flex-1">
                              <div className="space-y-3">
                                <p className="text-xs font-bold uppercase tracking-widest text-primary/80 dark:text-cream-support/80 flex items-center gap-2">
                                  <Tag size={14} />
                                  Tags
                                </p>
                                {isEditingGarment ? (
                                  <input
                                    type="text"
                                    value={editGarmentData.tags}
                                    onChange={(e) => setEditGarmentData({ ...editGarmentData, tags: e.target.value })}
                                    className="w-full bg-cream-support dark:bg-card/50 border-2 border-primary/20 dark:border-[#AC3B61]/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="e.g., color, type, style, brand"
                                  />
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {selectedGarment.tags.length > 0 ? (
                                      selectedGarment.tags.map((tag, i) => (
                                        <span key={`${tag}-${i}`} className="px-4 py-1.5 bg-cream-support dark:bg-[#FFD7E1] text-primary dark:text-text rounded-full text-xs font-bold border border-primary/50 dark:border-cream-support/50">
                                          #{tag}
                                        </span>
                                      ))
                                    ) : (
                                      <p className="text-primary/50 dark:text-cream-support/50 text-sm italic">No tags added yet.</p>
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
                                  setActiveTab("upcycle");
                                  setSelectedGarment(null);
                                }}
                                className="w-full bg-primary dark:bg-cream-support text-[#FFD7E1] dark:text-[#AC3B61] py-5 rounded-full font-heading text-2xl flex items-center justify-center gap-3 hover:bg-cream-support hover:text-primary dark:hover:bg-[#024A34] dark:hover:text-pink transition-all shadow-xl retro-shadow-wardrobe"
                              >
                                <Video size={24} />
                                Upcycle This Item
                              </button>
                              <button
                                onClick={async () => {
                                  setItemToDelete({ id: selectedGarment.id, type: "garment" });
                                }}
                                className="w-full bg-red-500 text-cream-support py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-[#780000] transition-colors"
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

              {/* STYLER TAB */}
              {activeTab === "styler" && (
                <motion.div
                  key="styler"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  {/* Styler Hero Banner */}
                  <div className="relative rounded-[2.5rem] overflow-hidden mb-8 bg-green-support dark:bg-primary border-2 border-primary dark:border-dark" style={{ minHeight: 200 }}>
                    <div
                      className="absolute inset-0 opacity-[0.10]"
                      style={{
                        backgroundImage: `
                          repeating-linear-gradient(0deg, transparent, transparent 39px, var(--grid-color-2) 39px, var(--grid-color-2) 40px),
                          repeating-linear-gradient(90deg, transparent, transparent 39px, var(--grid-color-2) 39px, var(--grid-color-2) 40px)
                        `
                      }}
                    />
                    <motion.div className="absolute -right-10 bottom-0 w-40 h-50 bg-primary/10 dark:bg-green-support/20 rounded-full" />
                    <motion.div className="absolute right-30 -bottom-4 w-40 h-30 bg-primary/10 dark:bg-green-support/20 rounded-full rotate-40" />
                    <motion.div className="absolute right-33 top-5 w-15 h-16 bg-primary/10 dark:bg-green-support/20 rounded-full" />
                    <div className="relative z-10 p-8 md:p-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-cream-support/70 dark:text-dark/60">
                          <LayoutGrid size={14} className="text-cream-support/70 dark:text-dark/60" />
                          <span className="text-cream-support/70 dark:text-dark/60 text-xs font-bold uppercase tracking-[0.3em]">Creative Canvas</span>
                        </div>
                        <h2 className="text-6xl md:text-7xl font-heading text-bg dark:text-dark leading-none">Wardrobe Styler</h2>
                        <p className="text-cream-support/70 dark:text-dark/60 text-sm font-medium max-w-lg">Drag and drop items to create your perfect look.</p>
                      </div>
                    </div>
                  </div>

                  {/* toolbar */}
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    {/* Left group */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* public / private toggle */}
                      <div className="flex items-center gap-2 bg-card p-2 rounded-full border border-border shadow-lg">
                        <button
                          onClick={() => setIsPublicOutfit(true)}
                          className={`px-7 py-2 rounded-full text-sm font-heading transition-all ${isPublicOutfit ? "bg-green-support text-cream-support dark:bg-primary dark:text-dark text-bg shadow-xl" : "text-primary/40 hover:text-primary"}`}
                        >
                          Public
                        </button>
                        <button
                          onClick={() => setIsPublicOutfit(false)}
                          className={`px-7 py-2 rounded-full text-sm font-heading transition-all ${!isPublicOutfit ? "bg-green-support text-cream-support dark:bg-primary text-bg dark:text-dark shadow-xl" : "text-primary/40 hover:text-primary"}`}
                        >
                          Private
                        </button>
                      </div>

                      {/* Color picker + clear */}
                      <div className="flex items-center gap-3 bg-card px-5 py-2 rounded-full border border-border shadow-lg">
                        <input
                          type="color"
                          value={stylerBgColor}
                          onChange={(e) => setStylerBgColor(e.target.value)}
                          className="w-8 h-8 rounded-xl cursor-pointer border-none bg-transparent"
                          title="Canvas Background Color"
                        />
                        <button
                          onClick={() => setStylerItems([])}
                          className="p-2 hover:bg-card-hover rounded-full text-text-muted hover:text-red-500 transition-colors"
                          title="Clear Canvas"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>

                      {/* Card size */}
                      <div className="flex bg-card p-2 rounded-[1.75rem] border border-border shadow-lg">
                        {(["small", "medium", "large"] as const).map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedCardSize(size)}
                            className={cn(
                              "px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                              selectedCardSize === size
                                ? "bg-green-support dark:bg-primary text-cream-support dark:text-bg shadow-md"
                                : "text-primary/40 hover:text-primary hover:bg-primary/5"
                            )}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Right: Publish button */}
                    <button
                      onClick={handleSaveOutfit}
                      disabled={isSaving || stylerItems.length === 0}
                      className="bg-green-support dark:bg-primary text-cream-support dark:text-dark px-8 py-4 rounded-full font-heading text-xl flex items-center gap-3 hover:scale-105 transition-all disabled:opacity-50 shadow-2xl retro-shadow-pink ml-auto"
                    >
                      {isSaving ? <RefreshCw className="animate-spin" /> : <Save size={22} />}
                      {isPublicOutfit ? "Publish Outfit" : "Save Private"}
                    </button>
                  </div>

                  {/* CANVAS + PANEL ROW */}
                  <div className="flex flex-col lg:flex-row gap-8" style={{ height: 620 }}>

                    {/* CANVAS AREA */}
                    <div className="flex-1 relative bg-card-hover rounded-[2rem] border border-border overflow-hidden shadow-2xl flex items-center justify-center">
                      {/* Actual Konva stage — no extra rounded wrapper so corners are always visible */}
                      <div
                        className="shadow-2xl border border-border/50"
                        style={{
                          backgroundColor: stylerBgColor,
                          width: canvasDimensions.width,
                          height: canvasDimensions.height,
                          maxWidth: "100%",
                          maxHeight: "100%",
                        }}
                      >
                        <Stage
                          width={canvasDimensions.width}
                          height={canvasDimensions.height}
                          onClick={(e) => {
                            if (e.target === e.target.getStage()) setSelectedId(null);
                          }}
                        >
                          <Layer>
                            <Rect width={canvasDimensions.width} height={canvasDimensions.height} fill={stylerBgColor} />
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

                      {/* Layer controls — float top-left */}
                      <AnimatePresence>
                        {selectedId !== null && (
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="absolute top-6 left-6 flex flex-col gap-2 bg-card/90 backdrop-blur-md p-3 rounded-[1.5rem] shadow-2xl border border-border z-10"
                          >
                            <button onClick={() => moveItem("front")} disabled={selectedId === stylerItems.length - 1} className="p-3 hover:bg-zinc-100 rounded-2xl text-zinc-600 disabled:opacity-30 transition-colors" title="Bring to Front">
                              <ChevronRight className="-rotate-90 scale-125" size={20} />
                            </button>
                            <button onClick={() => moveItem("up")} disabled={selectedId === stylerItems.length - 1} className="p-3 hover:bg-zinc-100 rounded-2xl text-zinc-600 disabled:opacity-30 transition-colors" title="Bring Forward">
                              <ChevronRight className="-rotate-90" size={20} />
                            </button>
                            <button onClick={() => moveItem("down")} disabled={selectedId === 0} className="p-3 hover:bg-zinc-100 rounded-2xl text-zinc-600 disabled:opacity-30 transition-colors" title="Send Backward">
                              <ChevronLeft className="-rotate-90" size={20} />
                            </button>
                            <button onClick={() => moveItem("back")} disabled={selectedId === 0} className="p-3 hover:bg-zinc-100 rounded-2xl text-zinc-600 disabled:opacity-30 transition-colors" title="Send to Back">
                              <ChevronLeft className="-rotate-90 scale-125" size={20} />
                            </button>
                            <div className="h-px bg-zinc-200 mx-2" />
                            <button onClick={deleteStylerItem} className="p-3 hover:bg-red-50 rounded-2xl text-red-500 transition-colors" title="Remove Item">
                              <Trash2 size={20} />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Empty state */}
                      {stylerItems.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-300 pointer-events-none">
                          <div className="text-center space-y-4">
                            <div className="w-24 h-24 bg-card rounded-full flex items-center justify-center mx-auto shadow-xl">
                              <Layout size={40} className="opacity-20" />
                            </div>
                            <p className="text-lg font-bold text-text-muted">Select items from the panel to start styling</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* WARDROBE PANEL */}
                    <div className="w-full lg:w-96 bg-card rounded-[2rem] border border-border overflow-hidden shadow-xl flex flex-col">
                      {/* Panel header */}
                      <div className="p-6 pb-4 border-b border-border space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-text uppercase text-xs tracking-widest">Wardrobe Items</h3>
                          <span className="text-[10px] font-bold text-text-muted bg-card-hover px-2 py-1 rounded-lg border border-border">{garments.length} items</span>
                        </div>

                        {/* Search */}
                        <div className="flex items-center gap-2 bg-card-hover rounded-xl px-3 py-2.5 border border-border">
                          <Search size={13} className="text-text-muted flex-shrink-0" />
                          <input
                            type="text"
                            value={stylerSearch}
                            onChange={(e) => setStylerSearch(e.target.value)}
                            placeholder="Search by name or tag…"
                            className="bg-transparent text-xs text-text placeholder:text-text-muted focus:outline-none w-full"
                          />
                          {stylerSearch && (
                            <button onClick={() => setStylerSearch("")} className="text-text-muted hover:text-text transition-colors flex-shrink-0">
                              <X size={12} />
                            </button>
                          )}
                        </div>

                        {/* Category chips */}
                        <div className="flex gap-1.5 flex-wrap">
                          {["all", ...Array.from(new Set(garments.map(g => g.category)))].map(cat => (
                            <button
                              key={cat}
                              onClick={() => setStylerCategoryFilter(cat)}
                              className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                                stylerCategoryFilter === cat
                                  ? "bg-green-support dark:bg-primary text-cream-support dark:text-bg shadow-sm"
                                  : "bg-card-hover text-text-muted hover:text-text border border-border"
                              )}
                            >
                              {cat === "all" ? "All" : cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Scrollable garment grid */}
                      <div className="flex-1 overflow-y-auto p-4">
                        {(() => {
                          const filtered = garments
                            .filter(g => stylerCategoryFilter === "all" || g.category === stylerCategoryFilter)
                            .filter(g =>
                              !stylerSearch ||
                              g.category.toLowerCase().includes(stylerSearch.toLowerCase()) ||
                              g.tags.some(t => t.toLowerCase().includes(stylerSearch.toLowerCase()))
                            );

                          if (filtered.length === 0) {
                            return (
                              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                                <Search size={28} className="text-text-muted opacity-30" />
                                <p className="text-xs font-bold text-text-muted uppercase tracking-widest">No items found</p>
                              </div>
                            );
                          }

                          return (
                            <div className="grid grid-cols-3 lg:grid-cols-2 gap-3">
                              {filtered.map((garment) => (
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
                                  className="aspect-square rounded-2xl overflow-hidden border border-border hover:border-primary hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-lg"
                                >
                                  <img src={garment.imageUrl} className="w-full h-full object-cover" alt="Garment" />
                                </button>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "community" && (
                <CommunityView
                  communityFilter={communityFilter}
                  setCommunityFilter={setCommunityFilter}
                  userSearchQuery={userSearchQuery}
                  setUserSearchQuery={setUserSearchQuery}
                  isSearchingUsers={isSearchingUsers}
                  userSearchResults={userSearchResults}
                  filteredOutfits={filteredOutfits}
                  onViewProfile={(uid) => {
                    setViewingProfileId(uid);
                    setActiveTab("profile");
                  }}
                  onToggleFavorite={handleToggleFavorite}
                  onSetViewingComments={setViewingComments}
                  onSetItemToDelete={setItemToDelete}
                  favoriteIds={favoriteIds}
                  currentUser={userProfile || user}
                  outfitsCount={outfits.length}
                />
              )}

              {activeTab === "profile" && (
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
                          className="flex items-center gap-2 text-text-muted hover:text-text transition-colors"
                        >
                          <ChevronLeft size={20} />
                          Back to My Profile
                        </button>
                      )}
                      <ProfileView
                        user={user}
                        targetUserId={viewingProfileId || undefined}
                        onUpgrade={() => setIsPricingOpen(true)}
                        onRateSeller={(orderId, sellerId, sellerName) => setRatingTarget({ orderId, sellerId, sellerName })}
                      />
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "upcycle" && (
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
                        setActiveTab("profile");
                      }}
                    />
                  )}
                </motion.div>
              )}

              {activeTab === "market" && (
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

              {activeTab === "contact" && (
                <motion.div key="contact" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <ContactView />
                </motion.div>
              )}

              {activeTab === "privacy" && (
                <motion.div key="privacy" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <PrivacyView />
                </motion.div>
              )}

              {activeTab === "terms" && (
                <motion.div key="terms" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <TermsView />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Delete confirmation modal */}
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
                    className="bg-card rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6"
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
                      <button onClick={() => setItemToDelete(null)} className="flex-1 px-6 py-3 rounded-2xl font-medium text-zinc-600 hover:bg-zinc-100 transition-colors">
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          if (itemToDelete.type === "outfit") {
                            await handleDeleteOutfit(itemToDelete.id);
                          } else if (itemToDelete.type === "listing") {
                            try {
                              try {
                                await deleteDoc(doc(db, "listings", itemToDelete.id));
                              } catch (error) {
                                handleFirestoreError(error, OperationType.DELETE, `listings/${itemToDelete.id}`);
                              }
                              setItemToDelete(null);
                            } catch (error) {
                              handleFirestoreError(error, OperationType.DELETE, `listings/${itemToDelete.id}`);
                            }
                          } else {
                            try {
                              const listingsRef = collection(db, "listings");
                              const q = query(listingsRef, where("garmentId", "==", itemToDelete.id));
                              let listingsSnap;
                              try {
                                listingsSnap = await getDocs(q);
                              } catch (error) {
                                handleFirestoreError(error, OperationType.GET, "listings");
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

                              try {
                                await deleteDoc(doc(db, "garments", itemToDelete.id));
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

            {/* Cart / Checkout modal */}
            <AnimatePresence>
              {isCartOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-end p-4 bg-black/60 backdrop-blur-sm"
                  onClick={() => { setIsCartOpen(false); setCheckoutStep("cart"); }}
                >
                  <motion.div
                    initial={{ x: 400 }}
                    animate={{ x: 0 }}
                    exit={{ x: 400 }}
                    className="bg-card w-full max-w-md h-full rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-6 border-b border-border flex justify-between items-center bg-card-hover/50">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="text-text" size={24} />
                        <h3 className="text-xl font-bold text-text">
                          {checkoutStep === "cart" ? "Your Cart" : checkoutStep === "payment" ? "Secure Payment" : "Order Confirmed"}
                        </h3>
                      </div>
                      <button onClick={() => { setIsCartOpen(false); setCheckoutStep("cart"); }} className="p-2 hover:bg-card-hover rounded-full transition-colors text-text">
                        <X size={24} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {checkoutStep === "cart" && (
                        <>
                          {cart.length > 0 ? (
                            <div className="space-y-4">
                              {cart.map((item, idx) => (
                                <div key={idx} className="flex gap-4 p-4 bg-card-hover rounded-2xl border border-border group">
                                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-border flex-shrink-0">
                                    <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.title} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-text truncate">{item.title}</h4>
                                    <p className="text-text-muted text-sm">{item.category}</p>
                                    <p className="text-text font-bold mt-1">${item.price.toFixed(2)}</p>
                                  </div>
                                  <button onClick={() => removeFromCart(idx)} className="p-2 text-text-muted hover:text-red-500 transition-colors self-start">
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

                      {checkoutStep === "payment" && (
                        <div className="space-y-8 py-4">
                          <div className="bg-zinc-900 text-white p-6 rounded-3xl space-y-8 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                            <div className="flex justify-between items-start">
                              <div className="w-12 h-8 bg-amber-400/20 rounded-md border border-amber-400/30" />
                              <CreditCard size={24} className="opacity-50" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] uppercase tracking-[0.2em] opacity-50">Card Number</p>
                              <p className="text-xl font-mono tracking-widest">
                                {paymentData.cardNumber ? paymentData.cardNumber.replace(/(\d{4})/g, "$1 ").trim() : "•••• •••• •••• ••••"}
                              </p>
                            </div>
                            <div className="flex justify-between items-end">
                              <div className="space-y-1">
                                <p className="text-[10px] uppercase tracking-[0.2em] opacity-50">Card Holder</p>
                                <p className="text-sm font-bold uppercase tracking-wider">{paymentData.name || "Your Name"}</p>
                              </div>
                              <div className="space-y-1 text-right">
                                <p className="text-[10px] uppercase tracking-[0.2em] opacity-50">Expires</p>
                                <p className="text-sm font-bold">{paymentData.expiry || "MM/YY"}</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Cardholder Name</label>
                              <input type="text" value={paymentData.name} onChange={(e) => setPaymentData({ ...paymentData, name: e.target.value })} className="w-full bg-card-hover border border-border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text" placeholder="JOHN DOE" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Card Number</label>
                              <input type="text" maxLength={16} value={paymentData.cardNumber} onChange={(e) => setPaymentData({ ...paymentData, cardNumber: e.target.value.replace(/\D/g, "") })} className="w-full bg-card-hover border border-border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono text-text" placeholder="0000 0000 0000 0000" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Expiry Date</label>
                                <input type="text" maxLength={5} value={paymentData.expiry} onChange={(e) => { let val = e.target.value.replace(/\D/g, ""); if (val.length > 2) val = val.slice(0, 2) + "/" + val.slice(2); setPaymentData({ ...paymentData, expiry: val }); }} className="w-full bg-card-hover border border-border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono text-text" placeholder="MM/YY" />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">CVC</label>
                                <input type="text" maxLength={3} value={paymentData.cvc} onChange={(e) => setPaymentData({ ...paymentData, cvc: e.target.value.replace(/\D/g, "") })} className="w-full bg-card-hover border border-border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono text-text" placeholder="000" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {checkoutStep === "success" && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-10">
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                            <CheckCircle2 size={40} />
                          </motion.div>
                          <div className="space-y-2">
                            <h4 className="text-2xl font-bold text-text">Order Confirmed!</h4>
                            <p className="text-text-muted">Your sustainable style is on its way.</p>
                          </div>
                          <button onClick={() => { setIsCartOpen(false); setCheckoutStep("cart"); setActiveTab("profile"); }} className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold">
                            View Order History
                          </button>
                        </div>
                      )}
                    </div>

                    {cart.length > 0 && checkoutStep !== "success" && (
                      <div className="p-6 border-t border-border bg-card-hover/50 space-y-4">
                        <div className="flex justify-between items-center text-lg">
                          <span className="text-text-muted font-medium">Total Amount</span>
                          <span className="text-text font-bold">${cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
                        </div>
                        {checkoutStep === "cart" ? (
                          <button onClick={() => setCheckoutStep("payment")} className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors shadow-lg">
                            Proceed to Payment <ChevronRight size={20} />
                          </button>
                        ) : (
                          <div className="flex gap-3">
                            <button onClick={() => setCheckoutStep("cart")} className="flex-1 bg-card text-text-muted py-4 rounded-2xl font-bold border border-border hover:bg-card-hover transition-all">Back</button>
                            <button onClick={handleCheckout} disabled={isCheckingOut || !paymentData.cardNumber || !paymentData.expiry || !paymentData.cvc} className="flex-[2] bg-zinc-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors shadow-lg disabled:opacity-50">
                              {isCheckingOut ? <RefreshCw className="animate-spin mx-auto" /> : "Pay Now"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Outfit / Content detail modal */}
            <AnimatePresence>
              {(viewingOutfit || viewingComments) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4"
                  onClick={() => { setViewingOutfit(null); setViewingComments(null); }}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-bg border-4 border-primary/20 rounded-[4rem] overflow-hidden max-w-6xl w-full flex flex-col md:flex-row shadow-2xl relative h-[90vh]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      className="md:w-3/5 relative group flex items-center justify-center overflow-hidden border-r border-border"
                      style={{
                        backgroundColor: (() => {
                          const o = viewingOutfit || temporaryOutfit || outfits.find(o => o.id === viewingComments?.id);
                          return o?.backgroundColor || '#111110';
                        })()
                      }}
                    >
                      {(viewingOutfit || viewingComments?.type === 'outfits') ? (() => {
                        const currentOutfit = viewingOutfit || temporaryOutfit || outfits.find(o => o.id === viewingComments?.id);
                        if (!currentOutfit) {
                          return (
                            <div className="flex flex-col items-center gap-4 p-8">
                              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary" />
                              <p className="text-text-muted text-xs font-bold uppercase tracking-widest">Retrieving Style...</p>
                            </div>
                          );
                        }

                        if (currentOutfit.previewUrl) {
                          return <img src={currentOutfit.previewUrl} className="w-full h-full object-contain" alt="Outfit preview" referrerPolicy="no-referrer" />;
                        }

                        return (
                          <div className="absolute inset-0" style={{ backgroundColor: currentOutfit.backgroundColor || '#ffffff' }}>
                            {currentOutfit.items.map((item: any, i: number) =>
                              item.imageUrl ? (
                                <img
                                  key={i}
                                  src={item.imageUrl}
                                  referrerPolicy="no-referrer"
                                  alt="Outfit item"
                                  style={{
                                    position: 'absolute',
                                    left: `${(item.x / 800) * 100}%`,
                                    top: `${(item.y / 800) * 100}%`,
                                    width: `${((item.width || 200) / 800) * 100}%`,
                                    height: `${((item.height || 200) / 800) * 100}%`,
                                    transformOrigin: '0 0',
                                    transform: `scale(${item.scaleX ?? item.scale ?? 1}, ${item.scaleY ?? item.scale ?? 1}) rotate(${item.rotation ?? 0}deg)`,
                                    objectFit: 'cover',
                                    borderRadius: 4,
                                  }}
                                />
                              ) : null
                            )}
                          </div>
                        );
                      })() : (
                        <div className="flex items-center justify-center h-full">
                          <MessageSquare size={64} className="text-primary opacity-20" />
                        </div>
                      )}

                      {(viewingOutfit || temporaryOutfit || outfits.find(o => o.id === viewingComments?.id)) && (
                        <button
                          onClick={() => {
                            const o = viewingOutfit || temporaryOutfit || outfits.find(o => o.id === viewingComments?.id);
                            if (o) downloadOutfit(o);
                          }}
                          className="absolute bottom-8 right-8 p-5 bg-white/90 backdrop-blur-md text-primary rounded-[2rem] shadow-2xl hover:scale-110 active:scale-95 transition-all z-10"
                        >
                          <Download size={28} />
                        </button>
                      )}
                    </div>

                    <div className="md:w-2/5 flex flex-col h-full bg-[#111110] text-[#E9E3FF]">
                      <div className="p-8 border-b border-white/10 space-y-6">
                        <div className="flex justify-between items-start">
                          {(() => {
                            const currentObject = viewingOutfit || temporaryOutfit || outfits.find(o => o.id === viewingComments?.id);
                            if (!currentObject) return null;
                            return (
                              <button
                                onClick={() => {
                                  setViewingProfileId(currentObject.authorId);
                                  setActiveTab("profile");
                                  setViewingOutfit(null);
                                  setViewingComments(null);
                                }}
                                className="flex items-center gap-4 group/author"
                              >
                                <img
                                  src={(currentObject.authorId === user?.uid ? user.photoURL : currentObject.authorPhoto) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentObject.authorId}`}
                                  className="w-14 h-14 rounded-full border-2 border-white/20 shadow-xl group-hover/author:scale-105 transition-transform"
                                  alt="Author"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="text-left">
                                  <p className="font-heading text-xl text-white leading-tight">
                                    {currentObject.authorId === user?.uid ? (user.displayName || currentObject.authorName) : currentObject.authorName}
                                  </p>
                                  <p className="text-[10px] text-primary/50 font-bold uppercase tracking-[0.2em]">Verified Stylist</p>
                                </div>
                              </button>
                            );
                          })()}
                          <button
                            onClick={(e) => { e.stopPropagation(); setViewingOutfit(null); setViewingComments(null); }}
                            className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-white/50 transition-all"
                          >
                            <X size={24} />
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          {(() => {
                            const currentId = viewingOutfit?.id || temporaryOutfit?.id || viewingComments?.id;
                            if (!currentId) return null;
                            const curr = viewingOutfit || temporaryOutfit || outfits.find(o => o.id === currentId);
                            const likes = curr?.likesCount || 0;
                            const isLiked = favoriteIds.includes(currentId);
                            return (
                              <button
                                onClick={() => handleToggleFavorite(currentId)}
                                className={cn(
                                  "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg",
                                  isLiked ? "bg-red-500 text-white" : "bg-white/5 text-white/50 hover:bg-white/10 border border-white/10"
                                )}
                              >
                                <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                                <span className="text-sm">{likes}</span>
                              </button>
                            );
                          })()}

                          <div className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-white/5 text-white/50 border border-white/10 shadow-lg">
                            <MessageSquare size={20} />
                            <span className="text-sm">
                              {viewingOutfit?.commentsCount || temporaryOutfit?.commentsCount || outfits.find(o => o.id === viewingComments?.id)?.commentsCount || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                          <CommentsSection
                            parentId={(viewingOutfit?.id || viewingComments?.id)!}
                            parentType={(viewingComments?.type || "outfits") as "outfits" | "tutorials"}
                            currentUser={userProfile || user}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
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
                    <button onClick={() => setFullscreenImage(null)} className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors backdrop-blur-md">
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
                    <a href={fullscreenImage} download="style-recommendation.png" className="bg-card text-text px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-card-hover transition-colors shadow-xl border border-border" onClick={(e) => e.stopPropagation()}>
                      <Download size={20} />
                      Download Result
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {croppingImage && (
                <CropModal image={croppingImage} onCropComplete={handleCropComplete} onClose={() => setCroppingImage(null)} />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isPricingOpen && (
                <PricingModal isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} onUpgrade={handleUpgrade} currentTier={userProfile?.tier || "basic"} />
              )}
            </AnimatePresence>

            <RatingModal isOpen={!!ratingTarget} onClose={() => setRatingTarget(null)} onSubmit={handleRatingSubmit} targetName={ratingTarget?.sellerName || ""} />

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
                    className="bg-card rounded-[2rem] p-8 max-w-md w-full text-center shadow-2xl"
                  >
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      {limitReached === "wardrobe" ? <Shirt size={32} /> : <Sparkles size={32} />}
                    </div>
                    <h3 className="text-2xl font-bold text-text mb-2">
                      {limitReached === "wardrobe" ? "Wardrobe Limit Reached" : "Daily AI Limit Reached"}
                    </h3>
                    <p className="text-zinc-500 mb-8">
                      {limitReached === "wardrobe"
                        ? "Basic users can store up to 10 items. Upgrade to Premium for unlimited space!"
                        : "You've used your daily style insights. Upgrade to Premium for unlimited AI power!"}
                    </p>
                    <div className="space-y-3">
                      <button onClick={() => { setLimitReached(null); setIsPricingOpen(true); }} className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200">
                        View Premium Plans
                      </button>
                      <button onClick={() => setLimitReached(null)} className="w-full bg-zinc-100 text-zinc-600 py-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all">
                        Close
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="h-20" />
          <Footer onNavigate={(tab: any) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }} />
        </main>
      </div>
    </ErrorBoundary>
  );
}

// i hate typescript but it hates me more