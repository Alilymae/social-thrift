import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { db, handleFirestoreError, OperationType } from "../firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  where,
  increment,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc
} from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { Video, Plus, X, Search, Play, User as UserIcon, Tag, Camera, Image as ImageIcon, ChevronLeft, Trash2, Download, Heart, MessageSquare, Scissors, ChevronRight, RefreshCw, Sparkles, ArrowUpRight } from "lucide-react";
import { Tutorial } from "../types";
import { CommentsSection } from "./CommentsSection";
import { cn } from "../utils/cn";
import { compressImage } from "../utils/image";

interface TutorialOutput {
  id: string;
  tutorialId: string;
  userId: string;
  userName: string;
  userPhoto: string;
  imageUrl: string;
  createdAt: any;
}

interface UpcycleLabProps {
  user: User;
  initialTag?: string;
  onViewProfile?: (userId: string) => void;
}

const getYouTubeThumbnail = (url: string) => {
  if (!url) return null;

  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const id = url.includes("v=")
      ? url.split("v=")[1].split("&")[0]
      : url.split("/").pop();

    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  }

  return null;
};

const isImageUrl = (url: string) =>
  url?.match(/\.(jpeg|jpg|png|webp|gif)$/i);

export const UpcycleLab = ({ user, initialTag, onViewProfile }: UpcycleLabProps) => {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTag, setSearchTag] = useState(initialTag || "");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [outputs, setOutputs] = useState<TutorialOutput[]>([]);
  const [isUploadingOutput, setIsUploadingOutput] = useState(false);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [newTutorial, setNewTutorial] = useState({
    title: "",
    description: "",
    videoUrl: "",
    tags: ""
  });
  const [viewingComments, setViewingComments] = useState<string | null>(null);
  const [likedTutorials, setLikedTutorials] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setLikedTutorials(doc.data().likedTutorials || []);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}`));
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    let q = query(collection(db, "tutorials"), orderBy("createdAt", "desc"));
    if (searchTag) {
      q = query(collection(db, "tutorials"), where("tags", "array-contains", searchTag));
    }
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Tutorial));
      tList.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setTutorials(tList);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, "tutorials"));
    return () => unsubscribe();
  }, [searchTag]);

  useEffect(() => {
    if (!selectedTutorial) { setOutputs([]); return; }
    const q = query(collection(db, "tutorial_outputs"), where("tutorialId", "==", selectedTutorial.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const oList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TutorialOutput));
      oList.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setOutputs(oList);
    }, (error) => handleFirestoreError(error, OperationType.GET, "tutorial_outputs"));
    return () => unsubscribe();
  }, [selectedTutorial]);

  const handlePostTutorial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "tutorials"), {
        authorId: user.uid,
        authorName: user.displayName || "Anonymous",
        authorPhoto: user.photoURL || "",
        title: newTutorial.title,
        description: newTutorial.description,
        videoUrl: newTutorial.videoUrl,
        tags: newTutorial.tags.split(",").map(t => t.trim()).filter(t => t !== ""),
        createdAt: serverTimestamp()
      });
      setIsUploading(false);
      setNewTutorial({ title: "", description: "", videoUrl: "", tags: "" });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "tutorials");
    }
  };

  const handleToggleLike = async (e: React.MouseEvent, tutorialId: string) => {
    e.stopPropagation();
    if (!user) return;
    const isLiked = likedTutorials.includes(tutorialId);
    const userRef = doc(db, "users", user.uid);
    const tutorialRef = doc(db, "tutorials", tutorialId);
    try {
      await updateDoc(userRef, { likedTutorials: isLiked ? arrayRemove(tutorialId) : arrayUnion(tutorialId) });
      await updateDoc(tutorialRef, { likesCount: increment(isLiked ? -1 : 1) });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tutorials/${tutorialId}`);
    }
  };

  const handlePostOutput = async () => {
    if (!selectedTutorial || !outputImage) return;
    setIsUploadingOutput(true);
    try {
      await addDoc(collection(db, "tutorial_outputs"), {
        tutorialId: selectedTutorial.id,
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userPhoto: user.photoURL || "",
        imageUrl: outputImage,
        createdAt: serverTimestamp()
      });
      setOutputImage(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "tutorial_outputs");
    } finally {
      setIsUploadingOutput(false);
    }
  };

  const handleDeleteOutput = async (outputId: string) => {
    try {
      await deleteDoc(doc(db, "tutorial_outputs", outputId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tutorial_outputs/${outputId}`);
    }
  };

  const renderVideo = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const id = url.includes("v=") ? url.split("v=")[1].split("&")[0] : url.split("/").pop();
      return (
        <iframe
          className="w-full aspect-video"
          src={`https://www.youtube.com/embed/${id}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
    return <video src={url} controls className="w-full aspect-video bg-black" />;
  };

  // Alternating card sizes for editorial feel
  const cardSizes = ["lg", "sm", "sm", "lg", "sm", "lg"];

  return (
    <div className="min-h-screen dark:bg-transparent">
      {/* Upcycle Hero Banner */}
      <div className="relative rounded-[2.5rem] overflow-hidden mb-8 bg-[#B1A1ED] dark:bg-[#3B3346] border-2 border-primary dark:border-[#B1A1ED]" style={{ minHeight: 200 }}>
        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 39px, var(--grid-color) 39px, var(--grid-color) 40px),
              repeating-linear-gradient(90deg, transparent, transparent 39px, var(--grid-color) 39px, var(--grid-color) 40px)
            `
          }}
        />
        <motion.div className="absolute -right-10 bottom-0 w-40 h-50 bg-primary/10 dark:bg-[#B1A1ED]/10 rounded-full" />
        <motion.div className="absolute right-30 -bottom-4 w-40 h-30 bg-primary/10 dark:bg-[#B1A1ED]/10 rounded-full rotate-40" />
        <motion.div className="absolute right-33 top-5 w-15 h-16 bg-primary/10 dark:bg-[#B1A1ED]/10 rounded-full" />
        <div className="relative z-10 p-8 md:p-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-primary dark:text-[#B1A1ED]">
                <Scissors size={14} className="text-primary dark:text-[#B1A1ED]" />
                <span className="text-primary dark:text-[#B1A1ED] text-xs font-bold uppercase tracking-[0.3em]">Creative Studio</span>
              </div>
              <h1 className="text-6xl md:text-7xl font-heading text-primary dark:text-cream-support leading-none">
                Upcycle Lab
              </h1>
              <p className="text-dark/70 dark:text-[#B1A1ED] text-sm font-medium max-w-md">Transform what you have into what you love. Learn, share, and inspire the community.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 dark:text-[#B1A1ED]/60" size={16} />
                <input
                  type="text"
                  placeholder="Search tags..."
                  value={searchTag}
                  onChange={(e) => setSearchTag(e.target.value)}
                  className="bg-card/80 backdrop-blur-md border border-border rounded-full pl-10 pr-4 py-3 text-sm text-text placeholder-primary/40 dark:placeholder-lavender-support/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-full sm:w-56"
                />
              </div>
              {/* Share Button */}
              <button
                onClick={() => setIsUploading(true)}
                className="bg-primary dark:bg-[#B1A1ED] text-bg dark:text-dark px-8 py-3 rounded-full font-heading text-xl flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl retro-shadow-upcycle"
              >
                <Plus size={18} />
                Share Tutorial
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row moved outside */}
      <div className="px-8 flex gap-10 mt-4 pb-8 border-b border-primary/10 dark:border-white/5">
        {[
          { label: "Tutorials", value: tutorials.length },
          { label: "Makers", value: "∞" },
          { label: "Inspired", value: "100%" },
        ].map((stat) => (
          <div key={stat.label}>
            <div className="text-3xl font-alt text-primary dark:text-white leading-none">{stat.value}</div>
            <div className="text-primary/40 dark:text-cream-support/40 font-alt text-[10px] uppercase tracking-widest mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tutorial Grid */}
      <div className="px-8 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse bg-white/5 rounded-2xl" style={{ height: i % 3 === 0 ? "400px" : "280px" }} />
            ))}
          </div>
        ) : tutorials.length > 0 ? (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-0">
            {tutorials.map((tutorial, idx) => {
              const isLiked = likedTutorials.includes(tutorial.id);
              const isTall = idx % 3 === 0;
              return (
                <motion.div
                  key={tutorial.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="break-inside-avoid mb-4 group cursor-pointer"
                  onClick={() => setSelectedTutorial(tutorial)}
                >
                  <div className="relative bg-dark-green dark:bg-[#1a1a18] border border-dark-green dark:border-white/50 rounded-2xl overflow-hidden hover:border-[#DDFFE2] dark:hover:border-[#E9E3FF] transition-all duration-500 hover:shadow-2xl hover:shadow-primary dark:hover:shadow-[#E9E3FF]/10">
                    {/* Thumbnail area */}
                    {/* Thumbnail area */}
                    <div
                      className={cn(
                        "relative overflow-hidden bg-cream-support/20 flex items-center justify-center",
                        isTall ? "aspect-[4/5]" : "aspect-video"
                      )}
                    >
                      {(() => {
                        const url = tutorial.videoUrl;
                        const ytThumb = getYouTubeThumbnail(url);

                        // YouTube thumbnail
                        if (ytThumb) {
                          return (
                            <img
                              src={ytThumb}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              alt="video thumbnail"
                            />
                          );
                        }

                        // Image post thumbnail
                        if (isImageUrl(url)) {
                          return (
                            <img
                              src={url}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              alt="image thumbnail"
                            />
                          );
                        }

                        // fallback
                        return (
                          <div className="flex items-center justify-center w-full h-full">
                            <Scissors size={32} className="text-white/10" />
                          </div>
                        );
                      })()}

                      {/* overlay */}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#B1A1ED]/30 to-[#8D77AB]/70 dark:via-pink/20 dark:to-lavender-support/40" />

                      {/* play button */}
                      <div className="absolute w-16 h-16 rounded-full border-2 border-[#E9E3FF]/40 flex items-center justify-center group-hover:border-[#DDFFE2] dark:group-hover:border-[#E9E3FF] group-hover:scale-110 transition-all duration-500">
                        <Play
                          size={24}
                          className="text-[#E9E3FF]/40 group-hover:text-[#DDFFE2] dark:group-hover:text-[#E9E3FF] transition-colors ml-1"
                          fill="currentColor"
                        />
                      </div>

                      {/* Tags overlay */}
                      <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
                        {tutorial.tags.slice(0, 2).map((tag, i) => (
                          <span
                            key={`${tag}-${i}`}
                            className="bg-black/50 backdrop-blur-sm text-[#E9E3FF]/70 dark:text-cream-support/70 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border border-black/10"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-white dark:text-cream-support text-xl leading-tight line-clamp-2 group-hover:text-[#DDFFE2] dark:group-hover:text-[#E9E3FF] transition-colors">
                            {tutorial.title}
                          </h3>
                          <p className="text-[#E9E3FF]/80 dark:text-cream-support/70 text-xs mt-1.5 line-clamp-2 leading-relaxed font-light">
                            {tutorial.description}
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#E9E3FF]/10 dark:bg-[#E9E3FF]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#DDFFE2] dark:group-hover:bg-[#E9E3FF] group-hover:text-black transition-all mt-0.5">
                          <ArrowUpRight size={14} className="text-white/30 group-hover:text-black transition-colors" />
                        </div>
                      </div>

                      {/* Author + stats */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-cream-support/10">
                        <button
                          onClick={(e) => { e.stopPropagation(); onViewProfile?.(tutorial.authorId); }}
                          className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                        >
                          <div className="w-6 h-6 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
                            {tutorial.authorPhoto ? (
                              <img src={tutorial.authorPhoto} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <UserIcon size={12} className="text-white/30" />
                            )}
                          </div>
                          <span className="text-[#E9E3FF]/50 dark:text-cream-support/50 text-xs font-medium truncate max-w-[80px]">{tutorial.authorName}</span>
                        </button>

                        <div className="flex items-center gap-3 text-[#E9E3FF]/50 dark:text-cream-support/50 text-xs font-bold">
                          <span className="flex items-center gap-1">
                            <Heart size={11} className={isLiked ? "text-red-400" : ""} />
                            {tutorial.likesCount || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare size={11} />
                            {tutorial.commentsCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center">
              <Scissors size={32} className="text-dark/50 dark:text-cream-support/50" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-dark dark:text-cream-support text-xl font-black">No tutorials yet</p>
              <p className="text-dark/30 dark:text-cream-support/30 text-sm">Be the first to share your upcycling wisdom</p>
            </div>
            <button
              onClick={() => setIsUploading(true)}
              className="bg-[#8D77AB] dark:bg-pink text-black px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-[#625476] dark:hover:bg-[#AC3B61] transition-colors"
            >
              Share First Tutorial
            </button>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 dark:bg-black/80 backdrop-blur-md"
            onClick={() => setIsUploading(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className=" bg-bg dark:bg-[#1a1a18] border border-primary/20 dark:border-cream-support/20 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* top accent */}
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary dark:via-lavender-support to-transparent" />

              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-3xl font-black text-primary dark:text-cream-support tracking-tight">Share Tutorial</h3>
                  <p className="text-dark dark:text-cream-support/30 text-sm mt-1">Teach the community your upcycling magic</p>
                </div>
                <button onClick={() => setIsUploading(false)} className="w-9 h-9 bg-[#3B3346]/10 hover:bg-lavender-support/10 rounded-full flex items-center justify-center transition-colors">
                  <X size={18} className="text-primary/50 dark:text-white/50" />
                </button>
              </div>

              <form onSubmit={handlePostTutorial} className="space-y-4">
                {[
                  { label: "Title", key: "title", placeholder: "e.g., How to turn jeans into a tote bag", type: "text" },
                  { label: "Video or Image URL", key: "videoUrl", placeholder: "YouTube link or image URL", type: "url" },
                  { label: "Tags (comma separated)", key: "tags", placeholder: "denim, bag, beginner", type: "text" },
                ].map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-dark/80 dark:text-cream-support/30 ml-1">{field.label}</label>
                    <input
                      required
                      type={field.type}
                      value={newTutorial[field.key as keyof typeof newTutorial]}
                      onChange={(e) => setNewTutorial({ ...newTutorial, [field.key]: e.target.value })}
                      className="w-full bg-[#E9E3FF]/20 border border-[#3B3346]/30 dark:border-lavender-support/50 rounded-xl px-4 py-3 text-dark dark:text-cream-support text-sm placeholder-dark/40 dark:placeholder-white/20 focus:outline-none focus:border-[#625476] dark:focus:border-purple-support focus:bg-cream-support/20 transition-all"
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-dark/30 dark:text-cream-support/30 ml-1">Description</label>
                  <textarea
                    required
                    value={newTutorial.description}
                    onChange={(e) => setNewTutorial({ ...newTutorial, description: e.target.value })}
                    className="w-full bg-[#E9E3FF]/20 border border-[#3B3346]/30 dark:border-lavender-support/50 rounded-xl px-4 py-3 text-dark dark:text-cream-support text-sm placeholder-dark/40 dark:placeholder-white/20 focus:outline-none focus:border-[#625476] dark:focus:border-purple-support focus:bg-cream-support/20 transition-all min-h-[100px] resize-none"
                    placeholder="Briefly explain what this tutorial covers..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#8D77AB] dark:bg-lavender-support hover:bg-[#625476] dark:hover:bg-purple-support text-cream dark:text-black py-4 rounded-xl font-black text-sm uppercase tracking-widesttransition-all mt-2"
                >
                  Post Tutorial
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial Detail Modal */}
      <AnimatePresence>
        {selectedTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
            onClick={() => setSelectedTutorial(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="bg-bg dark:bg-[#111110] border border-bg dark:border-lavender-support/50 rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col lg:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Video panel */}
              <div className="lg:w-3/5 bg-black flex items-center justify-center relative">
                {renderVideo(selectedTutorial.videoUrl)}
                <button
                  onClick={() => setSelectedTutorial(null)}
                  className="absolute top-4 left-4 w-9 h-9 bg-dark/10 dark:bg-white/10 backdrop-blur-sm text-dark dark:text-white rounded-full flex items-center justify-center lg:hidden hover:bg-white/20 dark:hover:bg-dark/50  transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Info panel */}
              <div className="lg:w-2/5 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 pb-0 border-b border-dark/10 dark:border-white/10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTutorial.tags.map((tag, i) => (
                        <span key={`${tag}-${i}`} className="bg-[#E9E3FF]/50 dark:bg-lavender-support/50 text-[#3B3346] dark:text-cream-support border border-[#3B3346] dark:border-purple-support px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button onClick={() => setSelectedTutorial(null)} className="w-8 h-8 bg-dark/10 dark:bg-white/5 hover:bg-[#3B3346]/30 rounded-full flex items-center justify-center transition-colors hidden lg:flex">
                      <X size={16} className="text-dark/50 dark:text-lavender-support/50 hover:text-[#E9E3FF]/50 dark: hover:text-[#E9E3FF]/50" />
                    </button>
                  </div>
                  <h3 className="text-2xl font-black text-dark dark:text-cream-support leading-tight">{selectedTutorial.title}</h3>
                  <button
                    onClick={() => onViewProfile?.(selectedTutorial.authorId)}
                    className="flex items-center gap-2 mt-3 mb-5 hover:opacity-70 transition-opacity"
                  >
                    <div className="w-6 h-6 bg-white/10 rounded-full overflow-hidden flex items-center justify-center">
                      {(selectedTutorial.authorId === user.uid ? user.photoURL : selectedTutorial.authorPhoto) ? (
                        <img
                          src={(selectedTutorial.authorId === user.uid ? user.photoURL : selectedTutorial.authorPhoto) || ''}
                          className="w-full h-full object-cover"
                          alt=""
                          referrerPolicy="no-referrer"
                        />
                      ) : <UserIcon size={12} className="text-white/30" />}
                    </div>
                    <span className="text-dark/50 dark:text-cream-support/40 text-xs font-medium">
                      {selectedTutorial.authorId === user.uid ? (user.displayName || selectedTutorial.authorName) : selectedTutorial.authorName}
                    </span>
                  </button>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  <p className="text-dark dark:text-white/50 text-sm leading-relaxed font-light">{selectedTutorial.description}</p>

                  {/* Community Results */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-dark dark:text-cream-support font-black text-sm uppercase tracking-wider">Community Results</span>
                      <button
                        onClick={() => setViewingComments(selectedTutorial.id)}
                        className="text-dark dark:text-lavender-support text-xs font-bold flex items-center gap-1 hover:text-[#625476] dark:hover:text-[purple-support transition-colors"
                      >
                        <MessageSquare size={12} />
                        {selectedTutorial.commentsCount || 0} Comments
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {outputs.map((output) => (
                        <div key={output.id} className="aspect-square rounded-xl overflow-hidden relative group bg-white/5">
                          <img src={output.imageUrl} className="w-full h-full object-cover" alt="Result" />
                          {output.userId === user.uid && (
                            <button
                              onClick={() => handleDeleteOutput(output.id)}
                              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                              <X size={10} />
                            </button>
                          )}
                        </div>
                      ))}
                      <label className="aspect-square rounded-xl border border-dashed border-primary/50 dark:border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-[#625476] dark:hover:border-lavender-support transition-colors group bg-white/[0.02]">
                        {isUploadingOutput
                          ? <RefreshCw className="animate-spin text-primary dark:text-lavender-support" size={18} />
                          : <Plus size={18} className="text-primary/50 group-hover:text-[#625476] dark:text-white/20 dark:group-hover:text-lavender-support transition-colors" />
                        }
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
                                setOutputImage(compressed);
                                handlePostOutput();
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Like button */}
                <div className="p-6 pt-4 border-t border-dark/10 dark:border-white/10">
                  <button
                    onClick={(e) => handleToggleLike(e, selectedTutorial.id)}
                    className={cn(
                      "w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                      likedTutorials.includes(selectedTutorial.id)
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-[#8D77AB]/10 text-dark/50 hover:bg-[#625476] hover:text-bg border border-[#8D77AB]/50 hover:border-[#625476] dark:bg-lavender-support/5 dark:text-lavender-support/50 dark:hover:text-purple-support/50 dark:hover:bg-lavender-support/10 dark:border-purple-support/10 hover:border-lavender-support/20"
                    )}
                  >
                    <Heart size={16} fill={likedTutorials.includes(selectedTutorial.id) ? "currentColor" : "none"} />
                    {likedTutorials.includes(selectedTutorial.id) ? "Liked" : "Like Tutorial"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Image Modal */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-200 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setFullscreenImage(null)}
          >
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute top-6 right-6 w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={fullscreenImage}
              className="max-w-full max-h-full object-contain rounded-2xl"
              alt="Fullscreen"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
              <a
                href={fullscreenImage}
                download="upcycle-result.png"
                className="bg-white text-black px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-widest flex items-center gap-2 hover:bg-amber-400 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Download size={16} />
                Download
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments Modal */}
      <AnimatePresence>
        {viewingComments && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setViewingComments(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <CommentsSection
                parentId={viewingComments}
                parentType="tutorials"
                currentUser={user}
                onClose={() => setViewingComments(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};