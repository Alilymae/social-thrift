import React, { useState } from 'react';
import { Heart, Github, Twitter, Instagram, Mail, ArrowUpRight, CheckCircle2, Loader2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './Toast';

interface FooterProps {
  onNavigate: (tab: any) => void;
}

export const Footer = ({ onNavigate }: FooterProps) => {
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'success' | 'error' | 'unsubscribed'>('idle');
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubscribing(true);
    try {
      // Check if already subscribed
      const q = query(collection(db, 'subscribers'), where('email', '==', email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        await addDoc(collection(db, 'subscribers'), {
          email: email.toLowerCase(),
          subscribedAt: serverTimestamp(),
          active: true
        });
      }
      
      setSubscribeStatus('success');
      addToast("Successfully subscribed to newsletter!", "success");
      setEmail('');
      setTimeout(() => setSubscribeStatus('idle'), 5000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'subscribers');
      setSubscribeStatus('error');
      addToast("Failed to subscribe. Please try again.", "error");
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!email) {
      addToast("Please enter your email to unsubscribe.", "info");
      return;
    }

    setIsUnsubscribing(true);
    try {
      const q = query(collection(db, 'subscribers'), where('email', '==', email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        setSubscribeStatus('unsubscribed');
        addToast("Successfully unsubscribed from newsletter.", "info");
        setEmail('');
        setTimeout(() => setSubscribeStatus('idle'), 5000);
      } else {
        addToast("Email not found in our subscription list.", "error");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'subscribers');
      addToast("Failed to unsubscribe. Please try again.", "error");
    } finally {
      setIsUnsubscribing(false);
    }
  };

  return (
    <footer className="bg-white border-t border-black/5 py-20 px-6 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-16 md:gap-12">
          <div className="space-y-8 col-span-1 md:col-span-2 lg:col-span-2">
            <div className="space-y-4">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
                <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-bg font-heading text-xl shadow-lg shadow-primary/20">R</div>
                <span className="text-3xl font-heading text-primary tracking-tighter">RE:Thriva</span>
              </div>
              <p className="text-dark/50 max-w-sm font-medium leading-relaxed text-lg">
                Redefining fashion through conscious consumption and AI-powered creativity. 
                Join the movement to make style sustainable.
              </p>
            </div>
            <div className="flex gap-4">
              {[
                { icon: Twitter, href: "#" },
                { icon: Instagram, href: "#" },
                { icon: Github, href: "#" },
                { icon: Mail, href: "mailto:customerservice.rethriva@gmail.com" }
              ].map((social, i) => (
                <a 
                  key={i}
                  href={social.href} 
                  className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-primary hover:bg-zinc-100 transition-all duration-300 border border-zinc-100"
                >
                  <social.icon size={20} />
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="font-bold text-primary uppercase tracking-widest text-xs">Platform</h4>
            <ul className="space-y-4">
              {[
                { label: 'AI Style Lab', tab: 'lab' },
                { label: 'Upcycle Lab', tab: 'upcycle' },
                { label: 'Marketplace', tab: 'market' },
                { label: 'Community', tab: 'community' }
              ].map((link, i) => (
                <li key={i}>
                  <button 
                    onClick={() => onNavigate(link.tab)}
                    className="text-dark/50 hover:text-primary transition-colors font-medium flex items-center gap-2 group text-left"
                  >
                    {link.label}
                    <ArrowUpRight size={14} className="opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="font-bold text-primary uppercase tracking-widest text-xs">Support</h4>
            <ul className="space-y-4">
              {[
                { label: 'Privacy Policy', tab: 'privacy' },
                { label: 'Terms of Service', tab: 'terms' },
                { label: 'Contact Us', tab: 'contact' }
              ].map((link, i) => (
                <li key={i}>
                  <button 
                    onClick={() => onNavigate(link.tab)}
                    className="text-dark/50 hover:text-primary transition-colors font-medium flex items-center gap-2 group text-left"
                  >
                    {link.label}
                    <ArrowUpRight size={14} className="opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6 lg:col-span-1">
            <h4 className="font-bold text-primary uppercase tracking-widest text-xs">Newsletter</h4>
            <p className="text-dark/50 text-sm font-medium">Stay updated with the latest trends and upcycling tips.</p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="relative">
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button 
                  type="submit"
                  disabled={isSubscribing}
                  className="absolute right-2 top-2 bottom-2 bg-primary text-bg px-4 rounded-xl font-bold text-xs hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSubscribing ? <Loader2 size={14} className="animate-spin" /> : 'Join'}
                </button>
              </div>
              
              <AnimatePresence mode="wait">
                {subscribeStatus === 'success' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 text-green-600 text-xs font-bold"
                  >
                    <CheckCircle2 size={14} />
                    Thank you for subscribing!
                  </motion.div>
                )}
                {subscribeStatus === 'unsubscribed' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 text-orange text-xs font-bold"
                  >
                    <CheckCircle2 size={14} />
                    You have been unsubscribed.
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="button"
                onClick={handleUnsubscribe}
                disabled={isUnsubscribing}
                className="text-[10px] text-dark/30 hover:text-primary transition-colors uppercase tracking-widest font-bold"
              >
                {isUnsubscribing ? 'Processing...' : 'Unsubscribe'}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-20 pt-10 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-dark/40 font-medium">
            © 2026 RE:Thriva. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-dark/40 font-medium">
            Made with <Heart size={16} className="text-pink fill-pink animate-pulse" /> for the planet
          </div>
        </div>
      </div>
    </footer>
  );
};

