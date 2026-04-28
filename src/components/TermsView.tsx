import React from 'react';
import { FileText, CheckCircle2, AlertCircle, Scale, Gavel, ArrowRight, ShoppingBag, Star, Percent } from 'lucide-react';
import { motion } from 'motion/react';

export const TermsView = () => {
  return (
    <div className="max-w-4xl mx-auto py-20 px-6 space-y-20">
      <header className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold uppercase tracking-widest border border-primary/20">
          <FileText size={16} />
          Legal Agreement
        </div>
        <h1 className="text-7xl font-heading text-primary leading-none tracking-tighter">Terms of Service</h1>
        <p className="text-2xl text-dark/50 font-medium max-w-2xl mx-auto">
          Please read these terms carefully before using the RE:Thriva platform.
        </p>
      </header>

      <div className="space-y-16">
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange/10 text-orange rounded-2xl flex items-center justify-center">
              <Scale size={24} />
            </div>
            <h2 className="text-4xl font-heading text-primary">Acceptance of Terms</h2>
          </div>
          <div className="bg-white p-10 rounded-[3rem] border border-black/5 shadow-xl space-y-6">
            <p className="text-xl text-dark/60 font-medium leading-relaxed">
              By accessing or using RE:Thriva, you agree to be bound by these Terms of Service and all applicable 
              laws and regulations. If you do not agree with any of these terms, you are prohibited from using 
              or accessing this site.
            </p>
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-pink/10 text-pink rounded-2xl flex items-center justify-center">
              <Gavel size={24} />
            </div>
            <h2 className="text-4xl font-heading text-primary">User Responsibilities</h2>
          </div>
          <div className="bg-white p-10 rounded-[3rem] border border-black/5 shadow-xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-primary">Account Security</h4>
                <p className="text-dark/50 font-medium">You are responsible for maintaining the confidentiality of your account and password.</p>
              </div>
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-primary">Content Ownership</h4>
                <p className="text-dark/50 font-medium">You retain ownership of the content you post, but grant us a license to display it on the platform.</p>
              </div>
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-primary">Prohibited Conduct</h4>
                <p className="text-dark/50 font-medium">You agree not to use the service for any illegal or unauthorized purpose.</p>
              </div>
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-primary">AI Usage</h4>
                <p className="text-dark/50 font-medium">AI-generated recommendations are for informational purposes only. We are not responsible for any outcome.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── NEW: Seller Terms Section ── */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-light-green/20 text-green-support rounded-2xl flex items-center justify-center">
              <ShoppingBag size={24} />
            </div>
            <h2 className="text-4xl font-heading text-primary">Seller Terms &amp; Commission</h2>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-black/5 shadow-xl space-y-10">
            <p className="text-xl text-dark/60 font-medium leading-relaxed">
              RE:Thriva operates a conscious community marketplace. By listing an item for sale, you agree 
              to the following seller terms, which differ based on your account tier.
            </p>

            {/* Tier comparison cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Free Tier */}
              <div className="relative rounded-3xl border-2 border-black/10 p-8 space-y-6 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-dark/20" />
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-dark/5 text-xs font-bold uppercase tracking-widest text-dark/50">
                    Free Account
                  </span>
                  <h3 className="text-3xl font-heading text-primary">15% Commission</h3>
                  <p className="text-dark/50 font-medium text-sm leading-relaxed">
                    Free-tier sellers contribute a 15% platform commission on each completed sale. 
                    This helps keep RE:Thriva running and supports our sustainable fashion mission.
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-dark/30">How it works</p>
                  <ul className="space-y-2.5">
                    {[
                      'You list your item at any price',
                      'Buyer purchases and payment is processed',
                      '15% is retained by RE:Thriva as a platform fee',
                      'You receive 85% of the final sale price',
                    ].map((point, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-dark/60 font-medium">
                        <span className="w-5 h-5 rounded-full bg-dark/10 text-dark/40 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 text-sm text-dark/50 font-medium">
                  <span className="font-bold text-dark/70">Example:</span> If you sell an item for $50, you keep <span className="font-bold text-dark/70">$42.50</span> and RE:Thriva receives $7.50.
                </div>
              </div>

              {/* Premium Tier */}
              <div className="relative rounded-3xl border-2 border-orange/40 p-8 space-y-6 overflow-hidden shadow-lg">
                <div className="absolute top-0 left-0 w-full h-1 bg-orange" />
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-orange/10 rounded-full" />
                <div className="space-y-2 relative">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange/10 text-xs font-bold uppercase tracking-widest text-orange">
                    <Star size={10} fill="currentColor" />
                    Premium Account
                  </span>
                  <h3 className="text-3xl font-heading text-primary">0% Commission</h3>
                  <p className="text-dark/50 font-medium text-sm leading-relaxed">
                    Premium sellers keep 100% of every sale. No platform fees, no hidden deductions — 
                    every dollar your buyers pay goes straight to you.
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-dark/30">What you get</p>
                  <ul className="space-y-2.5">
                    {[
                      'Zero commission on all sales',
                      'Priority listing placement in the marketplace',
                      'Premium seller badge on all listings',
                      'Unlimited items in your wardrobe & listings',
                      'Access to full analytics on your shop',
                    ].map((point, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-dark/60 font-medium">
                        <CheckCircle2 size={16} className="text-orange flex-shrink-0 mt-0.5" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-orange/5 rounded-2xl border border-orange/20 text-sm text-dark/50 font-medium">
                  <span className="font-bold text-orange">Example:</span> If you sell an item for $50, you keep <span className="font-bold text-dark/70">$50.00</span> — the full amount.
                </div>
              </div>
            </div>

            {/* Additional seller rules */}
            <div className="space-y-5">
              <h4 className="text-2xl font-heading text-primary">Additional Seller Rules</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    title: 'Accurate Listings',
                    body: 'Sellers must provide honest descriptions, accurate condition ratings, and clear photos of the actual item being sold.',
                  },
                  {
                    title: 'Cash Meetups',
                    body: 'For cash-on-meetup transactions, sellers are expected to respond to buyer requests within 48 hours and agree on a safe public location.',
                  },
                  {
                    title: 'Item Availability',
                    body: 'Once an item is marked as sold or a buyer has paid, sellers must not sell the same item to another buyer.',
                  },
                  {
                    title: 'Prohibited Items',
                    body: 'Counterfeit goods, unsafe items, or anything that violates local laws may not be listed. RE:Thriva may remove any listing at its discretion.',
                  },
                  {
                    title: 'Seller Ratings',
                    body: 'Buyers may leave ratings after a completed purchase. Consistent poor ratings may result in listing restrictions or account suspension.',
                  },
                  {
                    title: 'Dispute Resolution',
                    body: 'In the event of a dispute, RE:Thriva may mediate but is not liable for any losses resulting from in-person or peer-to-peer transactions.',
                  },
                ].map(({ title, body }) => (
                  <div key={title} className="space-y-2">
                    <h5 className="font-bold text-primary text-lg">{title}</h5>
                    <p className="text-dark/50 font-medium text-sm leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100 flex items-start gap-4">
              <Percent size={24} className="text-orange shrink-0 mt-1" />
              <p className="text-dark/50 font-medium italic text-sm leading-relaxed">
                Commission rates and seller terms are subject to change. RE:Thriva will notify sellers of any 
                material changes at least 14 days in advance via email or in-app notification. Continued use 
                of the platform after such notice constitutes acceptance of the updated terms.
              </p>
            </div>
          </div>
        </section>
        {/* ── END Seller Terms ── */}

        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <h2 className="text-4xl font-heading text-primary">Limitations of Liability</h2>
          </div>
          <div className="bg-white p-10 rounded-[3rem] border border-black/5 shadow-xl space-y-6">
            <p className="text-xl text-dark/60 font-medium leading-relaxed">
              In no event shall RE:Thriva or its suppliers be liable for any damages (including, without limitation, 
              damages for loss of data or profit, or due to business interruption) arising out of the use or inability 
              to use the materials on RE:Thriva's website.
            </p>
            <div className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100 flex items-start gap-4">
              <AlertCircle size={24} className="text-orange shrink-0 mt-1" />
              <p className="text-dark/50 font-medium italic">
                The materials on RE:Thriva's website are provided on an "as is" basis. RE:Thriva makes no warranties, 
                expressed or implied, and hereby disclaims and negates all other warranties.
              </p>
            </div>
          </div>
        </section>

        <div className="bg-primary rounded-[4rem] p-12 md:p-20 text-center space-y-8 shadow-2xl">
          <h2 className="text-5xl md:text-7xl font-heading text-bg leading-none">Questions?</h2>
          <p className="text-xl text-bg/70 max-w-2xl mx-auto font-medium">
            If you have any questions about these Terms, please contact us.
          </p>
          <div className="pt-4">
            <a 
              href="mailto:customerservice.rethriva@gmail.com" 
              className="inline-flex items-center gap-3 px-10 py-5 bg-bg text-primary font-heading text-2xl rounded-3xl hover:scale-105 transition-all shadow-2xl group"
            >
              Contact Support
              <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};