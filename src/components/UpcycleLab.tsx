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
  where,
  increment,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Video, Plus, X, Search, Play, User as UserIcon, Tag, Camera, Image as ImageIcon, ChevronLeft, Trash2, Download, Heart, MessageSquare, Scissors, ChevronRight, RefreshCw } from 'lucide-react';
import { Tutorial } from '../types';
import { CommentsSection } from './CommentsSection';
import { cn } from '../utils/cn';
import { compressImage } from '../utils/image';

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

export const UpcycleLab = ({ user, initialTag, onViewProfile }: UpcycleLabProps) => {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTag, setSearchTag] = useState(initialTag || '');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [outputs, setOutputs] = useState<TutorialOutput[]>([]);
  const [isUploadingOutput, setIsUploadingOutput] = useState(false);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [newTutorial, setNewTutorial] = useState({
    title: '',
    description: '',
    videoUrl: '',
    tags: ''
  });
  const [viewingComments, setViewingComments] = useState<string | null>(null);
  const [likedTutorials, setLikedTutorials] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setLikedTutorials(doc.data().likedTutorials || []);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}`));
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    let q = query(collection(db, 'tutorials'), orderBy('createdAt', 'desc'));
    
    if (searchTag) {
      q = query(
        collection(db, 'tutorials'),
        where('tags', 'array-contains', searchTag)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Tutorial));
      // Sort client-side to avoid index requirement
      tList.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setTutorials(tList);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'tutorials'));

    return () => unsubscribe();
  }, [searchTag]);

  useEffect(() => {
    if (!selectedTutorial) {
      setOutputs([]);
      return;
    }

    const q = query(
      collection(db, 'tutorial_outputs'),
      where('tutorialId', '==', selectedTutorial.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const oList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TutorialOutput));
      // Sort client-side to avoid index requirement
      oList.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setOutputs(oList);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'tutorial_outputs'));

    return () => unsubscribe();
  }, [selectedTutorial]);

  const handlePostTutorial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      try {
        await addDoc(collection(db, 'tutorials'), {
          authorId: user.uid,
          authorName: user.displayName || 'Anonymous',
          authorPhoto: user.photoURL || '',
          title: newTutorial.title,
          description: newTutorial.description,
          videoUrl: newTutorial.videoUrl,
          tags: newTutorial.tags.split(',').map(t => t.trim()).filter(t => t !== ''),
          createdAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'tutorials');
      }
      setIsUploading(false);
      setNewTutorial({ title: '', description: '', videoUrl: '', tags: '' });
    } catch (error) {
      console.error("Failed to post tutorial", error);
    }
  };

  const handleToggleLike = async (e: React.MouseEvent, tutorialId: string) => {
    e.stopPropagation();
    if (!user) return;

    const isLiked = likedTutorials.includes(tutorialId);
    const userRef = doc(db, 'users', user.uid);
    const tutorialRef = doc(db, 'tutorials', tutorialId);

    try {
      if (isLiked) {
        try {
          await updateDoc(userRef, {
            likedTutorials: arrayRemove(tutorialId)
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
        }
        try {
          await updateDoc(tutorialRef, {
            likesCount: increment(-1)
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `tutorials/${tutorialId}`);
        }
      } else {
        try {
          await updateDoc(userRef, {
            likedTutorials: arrayUnion(tutorialId)
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
        }
        try {
          await updateDoc(tutorialRef, {
            likesCount: increment(1)
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `tutorials/${tutorialId}`);
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handlePostOutput = async () => {
    if (!selectedTutorial || !outputImage) return;
    setIsUploadingOutput(true);
    try {
      try {
        await addDoc(collection(db, 'tutorial_outputs'), {
          tutorialId: selectedTutorial.id,
          userId: user.uid,
          userName: user.displayName || 'Anonymous',
          userPhoto: user.photoURL || '',
          imageUrl: outputImage,
          createdAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'tutorial_outputs');
      }
      setOutputImage(null);
    } catch (error) {
      console.error("Failed to post output", error);
    } finally {
      setIsUploadingOutput(false);
    }
  };

  const handleDeleteOutput = async (outputId: string) => {
    try {
      try {
        await deleteDoc(doc(db, 'tutorial_outputs', outputId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `tutorial_outputs/${outputId}`);
      }
    } catch (error) {
      console.error("Failed to delete output", error);
    }
  };

  const renderVideo = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const id = url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('/').pop();
      return (
        <iframe 
          className="w-full aspect-video rounded-2xl"
          src={`https://www.youtube.com/embed/${id}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      );
    }
    return (
      <video src={url} controls className="w-full aspect-video rounded-2xl bg-black" />
    );
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold uppercase tracking-wider border border-emerald-100">
            <Scissors size={14} />
            Creative Studio
          </div>
          <h2 className="text-6xl font-heading text-primary leading-none">Upcycling Lab</h2>
          <p className="text-xl text-dark/50 font-medium max-w-xl">
            Learn how to repurpose your clothes from the community.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <input 
              type="text"
              placeholder="Search by tag..."
              value={searchTag}
              onChange={(e) => setSearchTag(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <button 
            onClick={() => setIsUploading(true)}
            className="bg-green-support text-bg px-8 py-4 rounded-2xl font-heading text-xl flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl retro-shadow-pink"
          >
            <Plus size={24} />
            Share Tutorial
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse space-y-4">
              <div className="aspect-video bg-zinc-100 rounded-3xl" />
              <div className="h-4 bg-zinc-100 rounded w-2/3" />
            </div>
          ))
        ) : tutorials.length > 0 ? (
          tutorials.map((tutorial) => (
            <motion.div 
              layout
              whileHover={{ y: -8 }}
              key={tutorial.id}
              className="group bg-white rounded-[2.5rem] border border-black/5 overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer"
              onClick={() => setSelectedTutorial(tutorial)}
            >
              <div className="aspect-video relative overflow-hidden bg-zinc-100">
                {tutorial.videoUrl ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play size={48} className="text-primary/20 group-hover:scale-110 transition-transform" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video size={48} className="text-primary/10" />
                  </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                  {tutorial.authorId === user.uid && (
                    <button 
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this tutorial?')) {
                          try {
                            await deleteDoc(doc(db, 'tutorials', tutorial.id));
                          } catch (error) {
                            handleFirestoreError(error, OperationType.DELETE, `tutorials/${tutorial.id}`);
                          }
                        }
                      }}
                      className="p-2.5 bg-white/90 text-red-500 rounded-full backdrop-blur-md transition-all shadow-lg hover:bg-red-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <button 
                    onClick={(e) => handleToggleLike(e, tutorial.id)}
                    className={cn(
                      "p-2.5 rounded-full backdrop-blur-md transition-all shadow-lg",
                      likedTutorials.includes(tutorial.id) ? "bg-red-500 text-white" : "bg-white/90 text-zinc-400 hover:text-red-500"
                    )}
                  >
                    <Heart size={18} fill={likedTutorials.includes(tutorial.id) ? "currentColor" : "none"} />
                  </button>
                </div>
                <div className="absolute bottom-4 left-6 right-6">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {tutorial.tags.slice(0, 3).map((tag, i) => (
                      <span key={`${tag}-${i}`} className="bg-white/20 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/10">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-zinc-900 group-hover:text-primary transition-colors line-clamp-1">{tutorial.title}</h3>
                  <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
                    by <span className="font-medium text-zinc-600">{tutorial.authorName}</span>
                  </p>
                </div>
                <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed">{tutorial.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewProfile?.(tutorial.authorId);
                    }}
                    className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                  >
                    <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 overflow-hidden">
                      {tutorial.authorPhoto ? (
                        <img src={tutorial.authorPhoto} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <UserIcon size={16} />
                      )}
                    </div>
                    <span className="text-xs font-medium text-zinc-600">{tutorial.authorName}</span>
                  </button>
                  <div className="flex items-center gap-4 text-xs font-bold text-zinc-400">
                    <span className="flex items-center gap-1"><Heart size={14} /> {tutorial.likesCount || 0}</span>
                    <span className="flex items-center gap-1"><MessageSquare size={14} /> {tutorial.commentsCount || 0}</span>
                  </div>
                  <button className="text-primary font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    View Guide <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto text-zinc-200">
              <Scissors size={40} />
            </div>
            <div className="space-y-1">
              <p className="text-xl font-bold text-zinc-900">No tutorials found</p>
              <p className="text-zinc-400">Be the first to share your upcycling wisdom!</p>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isUploading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsUploading(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-green-support" />
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-heading text-primary">Share Tutorial</h3>
                <button onClick={() => setIsUploading(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handlePostTutorial} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">Title</label>
                    <input 
                      required
                      type="text"
                      value={newTutorial.title}
                      onChange={(e) => setNewTutorial({ ...newTutorial, title: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="e.g., How to turn jeans into a bag"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">Video/Image URL</label>
                    <input 
                      required
                      type="url"
                      value={newTutorial.videoUrl}
                      onChange={(e) => setNewTutorial({ ...newTutorial, videoUrl: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="YouTube link or image URL"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">Tags (comma separated)</label>
                    <input 
                      required
                      type="text"
                      value={newTutorial.tags}
                      onChange={(e) => setNewTutorial({ ...newTutorial, tags: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="denim, bag, beginner"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">Description</label>
                    <textarea 
                      required
                      value={newTutorial.description}
                      onChange={(e) => setNewTutorial({ ...newTutorial, description: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px]"
                      placeholder="Briefly explain what this tutorial covers..."
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-primary text-bg py-5 rounded-2xl font-heading text-2xl hover:scale-[1.02] transition-all shadow-xl retro-shadow-pink"
                >
                  Post Tutorial
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedTutorial && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedTutorial(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              className="bg-white rounded-[3rem] max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col lg:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="lg:w-3/5 bg-black flex items-center justify-center relative">
                {renderVideo(selectedTutorial.videoUrl)}
                <button 
                  onClick={() => setSelectedTutorial(null)}
                  className="absolute top-6 left-6 p-3 bg-white/90 text-zinc-900 rounded-full backdrop-blur-md shadow-lg lg:hidden"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="lg:w-2/5 p-8 lg:p-10 overflow-y-auto custom-scrollbar flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex flex-wrap gap-2">
                    {selectedTutorial.tags.map((tag, i) => (
                      <span key={`${tag}-${i}`} className="bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button onClick={() => setSelectedTutorial(null)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors hidden lg:block">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6 flex-1">
                  <div>
                    <h3 className="text-3xl font-heading text-primary leading-tight">{selectedTutorial.title}</h3>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400">
                        <UserIcon size={16} />
                      </div>
                      <span className="text-sm font-bold text-zinc-600">{selectedTutorial.authorName}</span>
                    </div>
                  </div>

                  <div className="prose prose-zinc prose-sm">
                    <p className="text-zinc-600 leading-relaxed">{selectedTutorial.description}</p>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-zinc-100">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-zinc-900">Community Results</h4>
                      <button 
                        onClick={() => setViewingComments(selectedTutorial.id)}
                        className="text-xs font-bold text-primary flex items-center gap-1"
                      >
                        <MessageSquare size={14} /> {selectedTutorial.commentsCount || 0} Comments
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {outputs.map((output) => (
                        <div key={output.id} className="aspect-square rounded-xl overflow-hidden relative group">
                          <img src={output.imageUrl} className="w-full h-full object-cover" alt="Result" />
                          {output.userId === user.uid && (
                            <button 
                              onClick={() => handleDeleteOutput(output.id)}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={10} />
                            </button>
                          )}
                        </div>
                      ))}
                      <label className="aspect-square rounded-xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary/30 transition-colors group">
                        {isUploadingOutput ? <RefreshCw className="animate-spin text-primary" size={20} /> : <Plus size={20} className="text-zinc-300 group-hover:text-primary transition-colors" />}
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

                <div className="pt-8 mt-auto">
                  <button 
                    onClick={(e) => handleToggleLike(e, selectedTutorial.id)}
                    className={cn(
                      "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all",
                      likedTutorials.includes(selectedTutorial.id) ? "bg-red-500 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    )}
                  >
                    <Heart size={20} fill={likedTutorials.includes(selectedTutorial.id) ? "currentColor" : "none"} />
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
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setFullscreenImage(null)}
          >
            <button 
              onClick={() => setFullscreenImage(null)}
              className="absolute top-8 right-8 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
            >
              <X size={32} />
            </button>
            <motion.img 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={fullscreenImage} 
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              alt="Fullscreen"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
              <a 
                href={fullscreenImage} 
                download="upcycle-result.png"
                className="bg-white text-zinc-900 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-100 transition-colors shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <Download size={20} />
                Download Image
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
