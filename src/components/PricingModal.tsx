import React, { useState } from 'react';
import { Check, Sparkles, Shirt, Zap, CreditCard, X, Star, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (tier: 'premium') => void;
  onDowngrade: (tier: 'basic') => void;
  currentTier: 'basic' | 'premium';
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onUpgrade, onDowngrade, currentTier }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onUpgrade('premium');
      setIsProcessing(false);
      onClose();
    }, 1500);
  };

  const handleDowngrade = () => {
    if (confirm('Are you sure you want to downgrade to the Basic plan? You will lose access to premium features.')) {
      setIsProcessing(true);
      setTimeout(() => {
        onDowngrade('basic');
        setIsProcessing(false);
        onClose();
      }, 1500);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-card rounded-[2.5rem] overflow-hidden max-w-4xl w-full flex flex-col md:flex-row shadow-2xl transition-colors duration-300"
      >
        {/* Left Side: Info */}
        <div className="md:w-1/2 p-8 md:p-12 bg-bg flex flex-col justify-between transition-colors duration-300">
          <div>
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
              <Star size={24} fill="currentColor" />
            </div>
            <h2 className="text-3xl font-bold text-text mb-4">Elevate Your Style Journey</h2>
            <p className="text-text/50 mb-8 leading-relaxed">
              Unlock the full potential of your digital wardrobe with Premium features designed for the ultimate style enthusiast.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-primary text-bg rounded-full p-0.5">
                  <Check size={14} />
                </div>
                <div>
                  <p className="font-semibold text-text">Unlimited Wardrobe</p>
                  <p className="text-sm text-text/50">Add as many items as you want. No more limits.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-primary text-bg rounded-full p-0.5">
                  <Check size={14} />
                </div>
                <div>
                  <p className="font-semibold text-text">Priority AI Insights</p>
                  <p className="text-sm text-text/50">Unlimited style recommendations and faster processing.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-primary text-bg rounded-full p-0.5">
                  <Check size={14} />
                </div>
                <div>
                  <p className="font-semibold text-text">Exclusive Lab Templates</p>
                  <p className="text-sm text-text/50">Access advanced upcycling guides and visualizers.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-primary text-bg rounded-full p-0.5">
                  <Check size={14} />
                </div>
                <div>
                  <p className="font-semibold text-text">Zero Transaction Fees</p>
                  <p className="text-sm text-text/50">Keep 100% of your marketplace sales.</p>
                </div>
              </div>
            </div>
          </div>
          
          <button onClick={onClose} className="mt-8 text-text/40 hover:text-text/60 text-sm font-medium transition-colors">
            Maybe later
          </button>
        </div>

        {/* Right Side: Pricing */}
        <div className="md:w-1/2 p-8 md:p-12 bg-card flex flex-col justify-center relative transition-colors duration-300">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-bg rounded-full transition-colors"
          >
            <X size={20} />
          </button>

          <div className="text-center mb-8">
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
              currentTier === 'premium' ? 'bg-orange text-primary' : 'bg-primary/10 text-primary'
            }`}>
              {currentTier === 'premium' ? 'Premium Member' : 'Upgrade Available'}
            </span>
            {currentTier === 'premium' ? (
              <div className="mt-4">
                <h3 className="text-3xl font-black text-text mb-2">Manage Your Plan</h3>
                <p className="text-text/50">Switch plans or cancel anytime.</p>
              </div>
            ) : (
              <div className="mt-4">
                <h3 className="text-5xl font-black text-text mb-2">
                  $9.99<span className="text-lg font-medium text-text/40">/mo</span>
                </h3>
                <p className="text-text/50">Cancel anytime. No hidden fees.</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className={`p-4 rounded-2xl border-2 flex items-center justify-between ${
              currentTier === 'premium' 
                ? 'border-orange bg-orange/5' 
                : 'border-primary bg-primary/5'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  currentTier === 'premium' ? 'bg-orange text-primary' : 'bg-primary text-bg'
                }`}>
                  <Zap size={20} />
                </div>
                <div>
                  <p className="font-bold text-text">Premium Plan</p>
                  <p className="text-xs text-text/50">Full access to all features</p>
                </div>
              </div>
              <div className={currentTier === 'premium' ? 'text-orange' : 'text-primary'}>
                {currentTier === 'premium' ? <CheckCircle2 size={24} /> : <span className="text-xs font-bold">UPGRADE</span>}
              </div>
            </div>

            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              currentTier === 'basic' 
                ? 'border-primary bg-primary/5' 
                : 'border-primary/10'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  currentTier === 'basic' ? 'bg-primary text-bg' : 'bg-bg text-text/50'
                }`}>
                  <Shirt size={20} />
                </div>
                <div>
                  <p className="font-bold text-text">Basic Plan</p>
                  <p className="text-xs text-text/50">Limited wardrobe & AI</p>
                </div>
              </div>
              <div className={currentTier === 'basic' ? 'text-primary' : 'text-text/40'}>
                {currentTier === 'basic' ? <CheckCircle2 size={24} /> : <span className="text-xs font-bold">DOWNGRADE</span>}
              </div>
            </div>
          </div>

          {currentTier === 'premium' ? (
            <div className="mt-8 space-y-3">
              <button
                onClick={handleDowngrade}
                disabled={isProcessing}
                className="w-full bg-red-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <RefreshCw className="animate-spin" size={20} />
                ) : (
                  <X size={20} />
                )}
                {isProcessing ? 'Processing...' : 'Downgrade to Basic'}
              </button>
              <p className="text-center text-[10px] text-zinc-400">
                You'll lose access to premium features but keep your saved data.
              </p>
            </div>
          ) : (
            <div className="mt-8">
              <button
                onClick={handleUpgrade}
                disabled={isProcessing}
                className="w-full bg-primary text-bg py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-primary/10 disabled:opacity-50"
              >
                {isProcessing ? (
                  <RefreshCw className="animate-spin" size={20} />
                ) : (
                  <CreditCard size={20} />
                )}
                {isProcessing ? 'Processing Payment...' : 'Upgrade Now'}
              </button>
              
              <p className="mt-4 text-center text-[10px] text-zinc-400 px-4">
                By clicking "Upgrade Now", you agree to our Terms of Service and Privacy Policy. This is a simulated payment for demonstration purposes.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const CheckCircle2 = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);
