import React from 'react';
import { Shield, Eye, Lock, Globe, FileText, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export const PrivacyView = () => {
  return (
    <div className="max-w-4xl mx-auto py-20 px-6 space-y-20">
      <header className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold uppercase tracking-widest border border-primary/20">
          <Shield size={16} />
          Your Privacy Matters
        </div>
        <h1 className="text-7xl font-heading text-primary leading-none tracking-tighter">Privacy Policy</h1>
        <p className="text-2xl text-dark/50 font-medium max-w-2xl mx-auto">
          Last updated: April 6, 2026. We're committed to protecting your personal information and your right to privacy.
        </p>
      </header>

      <div className="space-y-16">
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange/10 text-orange rounded-2xl flex items-center justify-center">
              <Eye size={24} />
            </div>
            <h2 className="text-4xl font-heading text-primary">Information We Collect</h2>
          </div>
          <div className="bg-white p-10 rounded-[3rem] border border-black/5 shadow-xl space-y-6">
            <p className="text-xl text-dark/60 font-medium leading-relaxed">
              We collect personal information that you voluntarily provide to us when you register on the Services, 
              express an interest in obtaining information about us or our products and Services, when you participate 
              in activities on the Services, or otherwise when you contact us.
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Personal Identifiers (Name, Email)',
                'Social Media Profiles (via Google Login)',
                'User-Generated Content (Outfits, Comments)',
                'Usage Data (Interactions with AI Lab)',
                'Device Information (IP, Browser Type)',
                'Marketing Preferences'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-dark/70 font-medium">
                  <CheckCircle2 size={20} className="text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-pink/10 text-pink rounded-2xl flex items-center justify-center">
              <Lock size={24} />
            </div>
            <h2 className="text-4xl font-heading text-primary">How We Use Your Information</h2>
          </div>
          <div className="bg-white p-10 rounded-[3rem] border border-black/5 shadow-xl space-y-6">
            <p className="text-xl text-dark/60 font-medium leading-relaxed">
              We use personal information collected via our Services for a variety of business purposes described below. 
              We process your personal information for these purposes in reliance on our legitimate business interests, 
              in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-primary">Service Delivery</h4>
                <p className="text-dark/50 font-medium">To facilitate account creation and logon process, and to manage user accounts.</p>
              </div>
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-primary">AI Personalization</h4>
                <p className="text-dark/50 font-medium">To provide tailored style recommendations and upcycling tutorials based on your wardrobe.</p>
              </div>
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-primary">Communication</h4>
                <p className="text-dark/50 font-medium">To send you administrative information, marketing communications, and service updates.</p>
              </div>
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-primary">Security</h4>
                <p className="text-dark/50 font-medium">To keep our Services safe and secure, including fraud monitoring and prevention.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
              <Globe size={24} />
            </div>
            <h2 className="text-4xl font-heading text-primary">Your Rights</h2>
          </div>
          <div className="bg-white p-10 rounded-[3rem] border border-black/5 shadow-xl space-y-6">
            <p className="text-xl text-dark/60 font-medium leading-relaxed">
              Depending on your location, you may have certain rights regarding your personal information. 
              These may include the right to access, correct, or delete your data, as well as the right to 
              object to or restrict certain processing activities.
            </p>
            <div className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100">
              <p className="text-dark/50 font-medium italic">
                "We believe your data belongs to you. You can request a full export of your data or account deletion 
                at any time by contacting us at customerservice.rethriva@gmail.com."
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
