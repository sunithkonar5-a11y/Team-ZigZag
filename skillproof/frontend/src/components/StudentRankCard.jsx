import React from 'react';
import { ShieldCheck, GitCommit, CheckCircle, XCircle, Mail, Github } from 'lucide-react';
import ScoreRing from './ScoreRing';

export default function StudentRankCard({ rankItem, rankNumber }) {
  const { student, score, matched_skills, missing_skills, fit_reasons, top_evidence } = rankItem;

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-start gap-3.5">
          <div className="flex-shrink-0 relative">
            <span className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center font-mono border-2 border-slate-900 shadow">
              #{rankNumber}
            </span>
            <img
              src={student.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
              alt={student.name}
              className="w-12 h-12 rounded-xl object-cover border border-slate-700"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">{student.name}</h3>
              <ShieldCheck className="w-4 h-4 text-emerald-400" title="Verified Skills" />
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              {student.github_username && (
                <a
                  href={`https://github.com/${student.github_username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>@{student.github_username}</span>
                </a>
              )}
              {student.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {student.email}
                </span>
              )}
            </div>
            {student.bio && (
              <p className="text-xs text-slate-300 mt-1.5 line-clamp-2 max-w-xl">
                {student.bio}
              </p>
            )}
          </div>
        </div>

        <div className="self-end sm:self-center">
          <ScoreRing score={score} size={64} strokeWidth={5} label="Candidate" />
        </div>
      </div>

      {/* Skills breakdown */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> Verified Matched Skills:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {matched_skills.map((s, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[11px]"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {missing_skills && missing_skills.length > 0 && (
          <div>
            <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
              <XCircle className="w-3.5 h-3.5" /> Unverified / Missing:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {missing_skills.map((s, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono text-[11px]"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top Code Evidence Quotes */}
      {top_evidence && top_evidence.length > 0 && (
        <div className="mt-3.5 bg-slate-900/70 border border-slate-800 rounded-xl p-3 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
            <GitCommit className="w-3.5 h-3.5 text-indigo-400" /> Key Code Evidence:
          </span>
          <ul className="space-y-1 text-slate-300 italic">
            {top_evidence.slice(0, 2).map((ev, idx) => (
              <li key={idx} className="line-clamp-2">
                • "{ev}"
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

