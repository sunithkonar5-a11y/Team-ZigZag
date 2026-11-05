import React from 'react';
import { Loader2, ShieldCheck, Sparkles } from 'lucide-react';

export default function LoadingState({ stage = 'Analyzing profile with AI...' }) {
  const steps = [
    { label: 'Connecting to GitHub API & downloading repositories', done: true },
    { label: 'Reviewing repository metadata and README evidence', done: stage.includes('Claude') || stage.includes('Normalizing') },
    { label: 'Extracting skills and estimating confidence from supplied evidence', done: stage.includes('Normalizing') || stage.includes('opportunities') },
    { label: 'Computing opportunity match scores & gap recommendations', done: stage.includes('opportunities') }
  ];

  return (
    <div className="glass-card rounded-2xl p-8 border border-slate-800 text-center max-w-lg mx-auto my-12">
      <div className="relative inline-flex items-center justify-center mb-5">
        <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
        <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full text-slate-950">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      </div>

      <h3 className="text-lg font-bold text-white mb-2">
        Verification & Matching in Progress
      </h3>
      <p className="text-sm text-indigo-300 font-medium mb-6 font-mono animate-pulse">
        {stage}
      </p>

      {/* Progressive hints checklist */}
      <div className="space-y-2.5 text-left border-t border-slate-800 pt-4">
        {steps.map((st, i) => (
          <div key={i} className="flex items-center gap-2.5 text-xs">
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                st.done ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {st.done ? '✓' : i + 1}
            </span>
            <span className={st.done ? 'text-slate-200' : 'text-slate-500'}>
              {st.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

