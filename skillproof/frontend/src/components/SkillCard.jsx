import React from 'react';
import { ShieldCheck, Award, GitCommit, BadgeInfo } from 'lucide-react';

export default function SkillCard({ skill }) {
  const levelColors = {
    advanced: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    intermediate: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    beginner: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  };

  const levelKey = (skill.level || 'intermediate').toLowerCase();
  const badgeClass = levelColors[levelKey] || levelColors.intermediate;
  const confidencePercent = Math.round((skill.confidence ?? 0.75) * 100);

  return (
    <div className="glass-card rounded-xl p-4 transition-all duration-200 hover:border-slate-700 hover:shadow-lg hover:shadow-indigo-500/5 group flex flex-col justify-between">
      <div>
        {/* Header: Skill Name & Level Badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-slate-100 text-base group-hover:text-white">
              {skill.name}
            </h4>
            <span title={skill.source === 'self-reported' ? 'Self-reported, not independently verified' : 'Evidence found in supplied project or repository data'} className={skill.source === 'github' ? 'text-emerald-400' : 'text-amber-400'}>
              {skill.source === 'github' ? <ShieldCheck className="w-4 h-4" /> : <BadgeInfo className="w-4 h-4" />}
            </span>
          </div>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${badgeClass} uppercase tracking-wider text-[11px]`}>
            {skill.level || 'Intermediate'}
          </span>
        </div>

        {/* Confidence bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              {skill.source === 'self-reported' ? 'Self-reported confidence' : skill.source === 'resume' ? 'Project-text confidence' : 'Evidence Confidence'}
            </span>
            <span className="font-mono text-slate-300 font-semibold">{confidencePercent}%</span>
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
        </div>

        {/* Evidence Quote / Highlights */}
        {skill.evidence && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 leading-relaxed font-sans">
            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] mb-1">
              <GitCommit className="w-3.5 h-3.5 text-emerald-400" />
              <span>{skill.source === 'self-reported' ? 'Candidate-provided claim' : 'Supporting Evidence'}</span>
            </div>
            <p className="italic text-slate-300">"{skill.evidence}"</p>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <span>Source: <strong className="text-slate-300 uppercase">{skill.source || 'GitHub'}</strong> · {skill.category || 'tool'}</span>
        <span className="text-slate-400">Canonical: <code className="text-slate-300 font-mono">{skill.normalized_name}</code></span>
      </div>
    </div>
  );
}

