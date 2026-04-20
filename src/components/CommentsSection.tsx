import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Trash2, 
  User,
  X,
  Loader2
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  increment,
  updateDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Comment } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface CommentsSectionProps {
  parentId: string;
  parentType: 'outfits' | 'tutorials';
  currentUser: any;
  onClose?: () => void;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ 
  parentId, 
  parentType, 
  currentUser,
  onClose 
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const commentsRef = collection(db, parentType, parentId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(commentsData);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, `${parentType}/${parentId}/comments`));

    return () => unsubscribe();
  }, [parentId, parentType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting || !currentUser) return;

    setSubmitting(true);
    try {
      const commentsRef = collection(db, parentType, parentId, 'comments');
      try {
        await addDoc(commentsRef, {
          authorId: currentUser.uid,
          authorName: currentUser.displayName || 'Anonymous',
          authorPhoto: currentUser.photoURL,
          text: newComment.trim(),
          createdAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `${parentType}/${parentId}/comments`);
      }

      // Update parent comment count
      const parentRef = doc(db, parentType, parentId);
      try {
        await updateDoc(parentRef, {
          commentsCount: increment(1)
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${parentType}/${parentId}`);
      }

      setNewComment('');
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const commentRef = doc(db, parentType, parentId, 'comments', commentId);
      try {
        await deleteDoc(commentRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${parentType}/${parentId}/comments/${commentId}`);
      }

      // Update parent comment count
      const parentRef = doc(db, parentType, parentId);
      try {
        await updateDoc(parentRef, {
          commentsCount: increment(-1)
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${parentType}/${parentId}`);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const isIntegrated = !onClose;

  return (
    <div className={cn(
      "flex flex-col h-full overflow-hidden transition-all",
      isIntegrated ? "bg-transparent" : "max-h-[600px] bg-card rounded-3xl shadow-2xl border border-border"
    )}>
      {!isIntegrated && (
        <div className="p-6 border-b border-border flex items-center justify-between bg-card-hover/50">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-emerald-500" size={20} />
            <h3 className="font-bold text-lg text-text">Comments ({comments.length})</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-card-hover rounded-full transition-colors text-text"
          >
            <X size={20} />
          </button>
        </div>
      )}

      <div className={cn(
        "flex-1 overflow-y-auto space-y-6 custom-scrollbar",
        isIntegrated ? "p-0" : "p-6 min-h-[300px]"
      )}>
        {loading ? (
          <div className="flex items-center justify-center h-full py-20">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-6">
            {comments.map((comment) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={comment.id} 
                className="flex gap-4 group"
              >
                <img 
                  src={(comment.authorId === currentUser?.uid ? currentUser.photoURL : comment.authorPhoto) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.authorId}`} 
                  className={cn(
                    "rounded-full border border-border flex-shrink-0",
                    isIntegrated ? "w-12 h-12" : "w-10 h-10"
                  )}
                  alt={comment.authorName} 
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      "font-bold text-text",
                      isIntegrated ? "text-lg" : "text-sm"
                    )}>
                      {comment.authorId === currentUser?.uid ? (currentUser.displayName || comment.authorName) : comment.authorName}
                    </p>
                    {currentUser?.uid === comment.authorId && (
                      <button 
                        onClick={() => handleDelete(comment.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-red-500 transition-all"
                        title="Delete comment"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <p className={cn(
                    "text-text-muted leading-relaxed",
                    isIntegrated ? "text-base" : "text-sm"
                  )}>{comment.text}</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium opacity-50">
                    {comment.createdAt?.toDate ? new Date(comment.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-text-muted space-y-4 py-12">
            <div className="w-16 h-16 rounded-full bg-zinc-50 flex items-center justify-center">
              <MessageSquare size={32} className="opacity-20" />
            </div>
            <p className="text-sm font-medium">No comments yet. Start the conversation!</p>
          </div>
        )}
      </div>

      <div className={cn(
        "border-t border-border",
        isIntegrated ? "pt-6 mt-6" : "p-6 bg-card-hover/50"
      )}>
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className={cn(
              "w-full bg-card border border-border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-text",
              isIntegrated ? "rounded-[1.5rem] px-8 py-5 text-base" : "rounded-2xl pl-6 pr-14 py-4 text-sm"
            )}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center",
              isIntegrated ? "right-3 w-12 h-12" : "right-2 p-3"
            )}
          >
            {submitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
};
