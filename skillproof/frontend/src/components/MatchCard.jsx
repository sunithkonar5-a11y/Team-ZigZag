import React, { useState } from 'react';
import { Building2, MapPin, Briefcase, ExternalLink, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import ScoreRing from './ScoreRing';
import GapAction from './GapAction';
import TeammatePanel from './TeammatePanel';
import { useProfile } from '../context/ProfileContext';

export default function MatchCard({ match }) {
  const [showTeammates, setShowTeammates] = useState(false);
  const { currentProfile } = useProfile();
  const { opportunity, score, fit_reasons, missing_skills, gap_actions } = match;

  const roleBadges = {
    internship: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    research: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    hackathon: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    open_source: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    full_time: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  };

  const badgeClass = roleBadges[opportunity.role_type] || 'bg-slate-700/50 text-slate-300 border-slate-600';

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 transition-all duration-200 hover:border-slate-700 hover:shadow-xl hover:shadow-indigo-500/5">
      {/* Top Bar: Title & Score */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium border uppercase tracking-wider ${badgeClass}`}>
              {(opportunity.role_type || '').replace('_', ' ')}
            </span>
            {opportunity.work_mode && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 uppercase tracking-wider font-mono">
                {opportunity.work_mode}
              </span>
            )}
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {opportunity.location}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" />
              {opportunity.min_experience}
            </span>
          </div>

          <h3 className="text-lg font-bold text-white tracking-tight">
            {opportunity.title}
          </h3>
          <div className="text-sm font-medium text-indigo-400 flex items-center gap-1.5 mt-0.5">
            <Building2 className="w-4 h-4" />
            <span>{opportunity.company_or_lab}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <ScoreRing score={score} size={64} strokeWidth={5} label="Fit Score" />
        </div>
      </div>

      {/* Description */}
      <p className="mt-3 text-xs text-slate-300 leading-relaxed">
        {opportunity.description}
      </p>

      {/* Why You Fit Section */}
      {fit_reasons && fit_reasons.length > 0 && (
        <div className="mt-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3">
          <h4 className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5 mb-2 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Why You Fit (Evidence)
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {fit_reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span className="leading-snug">{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing Skills Chips */}
      {missing_skills && missing_skills.length > 0 && (
        <div className="mt-3">
          <h4 className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            Missing Skills / Requirements:
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {missing_skills.map((skill, idx) => (
              <span
                key={idx}
                className="text-xs px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Gap Action (P1) */}
      <GapAction gapActions={gap_actions} missingSkills={missing_skills} />

      {/* Actions: Teammate finder and Link */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => setShowTeammates(!showTeammates)}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition-colors"
        >
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          <span>{showTeammates ? 'Hide Teammates' : 'Find Complementary Teammates'}</span>
        </button>

        {opportunity.link && (
          <a
            href={opportunity.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>View Opportunity</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Teammate Panel Dropdown (P1) */}
      {showTeammates && (
        <TeammatePanel
          studentId={currentProfile?.id}
          opportunity={opportunity}
          onClose={() => setShowTeammates(false)}
        />
      )}
    </div>
  );
}

