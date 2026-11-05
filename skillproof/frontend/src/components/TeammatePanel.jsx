import React, { useState, useEffect } from 'react';
import { Users, Sparkles, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { getTeammates } from '../api/client';
import ScoreRing from './ScoreRing';

export default function TeammatePanel({ studentId, opportunity, onClose }) {
  const [teammates, setTeammates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPeers() {
      if (!studentId) return;
      try {
        setLoading(true);
        setError(null);
        const data = await getTeammates({
          student_id: studentId,
          opportunity_id: opportunity?.id,
          target_skills: opportunity?.required_skills || []
        });
        setTeammates(data);
      } catch (err) {
        console.error('Failed to fetch complementary teammates:', err);
        setError('Could not load complementary teammates at this time.');
      } finally {
        setLoading(false);
      }
    }
    fetchPeers();
  }, [studentId, opportunity?.id]);

  return (
    <div className="mt-4 pt-4 border-t border-slate-800 bg-slate-900/90 rounded-xl p-4 border border-indigo-500/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
              Complementary Teammates for {opportunity?.title}
              <span className="text-xs font-normal text-indigo-300 font-mono">(P1 Synergy)</span>
            </h4>
            <p className="text-xs text-slate-400">
              Peers from your cohort who cover your skill gaps for this opportunity
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
          >
            Close
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6 text-slate-400 gap-2 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          Analyzing cohort complementarity matrix...
        </div>
      ) : error ? (
        <p className="text-xs text-rose-400 py-2">{error}</p>
      ) : teammates.length === 0 ? (
        <p className="text-xs text-slate-400 py-2">No complementary peers found for this role criteria.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          {teammates.map((item, idx) => {
            const peer = item.teammate;
            return (
              <div
                key={peer.id || idx}
                className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 flex flex-col justify-between hover:border-indigo-500/30 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={peer.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={peer.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <div className="font-semibold text-xs text-white flex items-center gap-1">
                          {peer.name}
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">@{peer.github_username}</div>
                      </div>
                    </div>
                    <ScoreRing score={item.complementarity_score} size={48} strokeWidth={4} label="Synergy" />
                  </div>

                  {/* Skills they cover */}
                  {item.skills_they_cover && item.skills_they_cover.length > 0 && (
                    <div className="mb-2">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-400 flex items-center gap-1 mb-1">
                        <CheckCircle2 className="w-3 h-3" /> Fills Your Gaps:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {item.skills_they_cover.map((s, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Synergy rationale */}
                  <p className="text-[11px] text-slate-300 italic mb-2 leading-relaxed">
                    "{item.synergy_reason}"
                  </p>
                </div>

                {/* Shared skills */}
                {item.shared_skills && item.shared_skills.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                    <span>Common Foundation: </span>
                    <span className="text-slate-300">{item.shared_skills.join(', ')}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

