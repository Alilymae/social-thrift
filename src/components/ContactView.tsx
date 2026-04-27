import React from 'react';
import { Mail, Globe, Users, ArrowRight, MessageSquare, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export const ContactView = () => {
  return (
    <div className="max-w-4xl mx-auto py-20 px-6 space-y-20">
      <header className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold uppercase tracking-widest border border-primary/20">
          <MessageSquare size={16} />
          Get in Touch
        </div>
        <h1 className="text-7xl font-heading text-primary leading-none tracking-tighter">Contact Us</h1>
        <p className="text-2xl text-dark/50 font-medium max-w-2xl mx-auto">
          Have questions or want to collaborate? We're here to help you on your sustainable fashion journey.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div 
          whileHover={{ y: -10 }}
          className="bg-white p-10 rounded-[3rem] border border-black/5 shadow-xl space-y-6 group transition-all duration-500"
        >
          <div className="w-16 h-16 bg-orange/10 text-orange rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Mail size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-primary">Customer Service</h3>
            <p className="text-dark/50 font-medium">For support, feedback, or general inquiries.</p>
          </div>
          <a 
            href="mailto:rethriva.support@gmail.com" 
            className="block text-xl font-bold text-primary hover:text-orange transition-colors"
          >
            rethriva.support@gmail.com
          </a>
        </motion.div>

        <motion.div 
          whileHover={{ y: -10 }}
          className="bg-white p-10 rounded-[3rem] border border-black/5 shadow-xl space-y-6 group transition-all duration-500"
        >
          <div className="w-16 h-16 bg-pink/10 text-pink rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShieldCheck size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-primary">Direct Contact</h3>
            <p className="text-dark/50 font-medium">For business inquiries and partnerships.</p>
          </div>
          <a 
            href="mailto:rethriva.co@gmail.com" 
            className="block text-xl font-bold text-primary hover:text-pink transition-colors"
          >
            rethriva.co@gmail.com
          </a>
        </motion.div>
      </div>

      <div className="bg-primary rounded-[4rem] p-12 md:p-20 text-center space-y-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-bg text-xs font-bold uppercase tracking-widest border border-white/20">
            <Users size={14} />
            Meet the Team
          </div>
          <h2 className="text-5xl md:text-7xl font-heading text-bg leading-none">The Minds Behind <br /> RE:Thriva</h2>
          <p className="text-xl text-bg/70 max-w-2xl mx-auto font-medium">
            RE:Thriva is a project driven by a passionate team dedicated to circular fashion. 
            Want to know more about the individuals behind the vision?
          </p>
          <div className="pt-4">
            <a 
              href="https://rethriva.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-10 py-5 bg-bg text-primary font-heading text-2xl rounded-3xl hover:scale-105 transition-all shadow-2xl group"
            >
              Visit Team Website
              <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
