import React from 'react';
import {
  Compass,
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ArrowRight,
  Briefcase,
  FileCheck2,
  FileText
} from 'lucide-react';
import ScoreRing from './ScoreRing';

export default function CareerSuggestions({ suggestions, onViewMatches }) {
  if (!suggestions) return null;

  const {
    archetype,
    readiness_score = 75,
    top_strengths = [],
    tailored_blueprints = [],
    resume_advice = [],
    recommended_opportunities = [],
  } = suggestions;

  return (
    <div className="space-y-6 pt-4 border-t border-slate-800">
      {/* Archetype & Readiness Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/80 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>Personalized Career Archetype</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {archetype?.title || 'Technical Specialist'}
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              {archetype?.tagline ||
                'Your verified project history demonstrates high proficiency in core engineering domains.'}
            </p>

            {archetype?.target_roles && archetype.target_roles.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-slate-400 font-medium">Top Aligned Roles:</span>
                {archetype.target_roles.map((role, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/70 text-slate-200 text-xs font-medium shadow-sm"
                  >
                    {role}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/90 border border-slate-800/90 min-w-[150px] shadow-inner">
            <ScoreRing score={readiness_score} size={80} strokeWidth={7} />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-2">
              Profile Readiness
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Verified Top Strengths & Tailored Resume Advice */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verified Strengths */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Your Key Technical Strengths</h3>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Evidence-Backed
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Skills where your resume and project commits show the highest depth of execution.
          </p>

          <div className="space-y-3 pt-1">
            {top_strengths.length > 0 ? (
              top_strengths.map((str, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      {str.skill}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {str.level}
                      </span>
                      <span className="text-xs font-bold text-emerald-400 font-mono">
                        {str.confidence}%
                      </span>
                    </div>
                  </div>
                  {str.evidence && (
                    <p className="text-xs text-slate-300 italic pl-3 border-l-2 border-emerald-500/40 font-mono leading-relaxed">
                      "{str.evidence}"
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No verified strengths identified yet.</p>
            )}
          </div>
        </div>

        {/* Personalized Resume Advice */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Targeted Resume Advice</h3>
            </div>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              High Impact
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Specific improvements calculated to increase your call-back rate for target roles.
          </p>

          <div className="space-y-3 pt-1">
            {resume_advice.length > 0 ? (
              resume_advice.map((adv, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80"
                >
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-200 leading-relaxed">{adv}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">Add more project details to generate custom advice.</p>
            )}
          </div>
        </div>
      </div>

      {/* Tailored Mini-Project Blueprints (Bridge the gap) */}
      {tailored_blueprints && tailored_blueprints.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">
                Tailored Gap-Bridging Blueprints
              </h3>
            </div>
            <span className="text-xs text-cyan-400 font-mono bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
              Personalized to Your Missing Skills
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Complete one of these actionable project blueprints to eliminate missing requirements for your top-ranked opportunities.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {tailored_blueprints.map((bp, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-slate-900/90 border border-slate-800/90 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-xs font-semibold font-mono border border-cyan-500/30">
                      Target: {bp.missing_skill_targeted}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> {bp.estimated_effort}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white leading-snug">{bp.title}</h4>

                  <p className="text-xs text-slate-300 leading-relaxed">{bp.why_it_matters}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Execution Steps:
                  </span>
                  <div className="space-y-1.5">
                    {bp.action_steps?.map((step, sIdx) => (
                      <div key={sIdx} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Opportunities for this specific candidate */}
      {recommended_opportunities && recommended_opportunities.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">
                Opportunities Calibrated for Your Skills
              </h3>
            </div>
            {onViewMatches && (
              <button
                onClick={onViewMatches}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors"
              >
                <span>View All Opportunities</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {recommended_opportunities.map((opp) => (
              <div
                key={opp.id}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/90 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-400">{opp.company}</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {opp.score}%
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white leading-tight">{opp.title}</h4>
                  <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {opp.role_type}
                  </span>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] text-slate-300 italic">
                    {opp.why_you_fit?.[0] || 'High skill compatibility.'}
                  </div>
                  {opp.missing_skills?.length > 0 && (
                    <div className="text-[11px] text-amber-400/90 flex items-center gap-1 font-mono pt-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>Missing: {opp.missing_skills.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

