import React from 'react';
import { FileText, CheckCircle2, AlertCircle, Scale, Gavel, ArrowRight } from 'lucide-react';
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
                "The materials on RE:Thriva's website are provided on an 'as is' basis. RE:Thriva makes no warranties, 
                expressed or implied, and hereby disclaims and negates all other warranties."
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
