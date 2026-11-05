import React, { useState, useEffect } from 'react';
import { Building2, Search, SlidersHorizontal, Users, Sparkles, Filter, Briefcase } from 'lucide-react';
import { getOpportunities, orgMatch } from '../api/client';
import StudentRankCard from '../components/StudentRankCard';
import LoadingState from '../components/LoadingState';

export default function OrgView() {
  const [opportunities, setOpportunities] = useState([]);
  const [selectedOppId, setSelectedOppId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customRequiredSkills, setCustomRequiredSkills] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const [rankedCandidates, setRankedCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [minScore, setMinScore] = useState(0);

  // Fetch seeded opportunities for dropdown
  useEffect(() => {
    async function loadOpps() {
      try {
        const data = await getOpportunities();
        setOpportunities(data);
        if (data.length > 0) {
          setSelectedOppId(data[0].id.toString());
          // Auto-run ranking for first opportunity
          runRanking({ opportunity_id: data[0].id });
        }
      } catch (err) {
        console.error('Failed to load opportunities:', err);
      }
    }
    loadOpps();
  }, []);

  const runRanking = async (payload) => {
    try {
      setLoading(true);
      setError(null);
      const results = await orgMatch({
        ...payload,
        min_score: minScore
      });
      setRankedCandidates(results);
    } catch (err) {
      console.error('Org match failed:', err);
      setError(err?.response?.data?.detail || 'Failed to rank candidates for this role.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOpp = (e) => {
    const oppId = e.target.value;
    setSelectedOppId(oppId);
    if (oppId) {
      runRanking({ opportunity_id: parseInt(oppId, 10) });
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const reqSkills = customRequiredSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    runRanking({
      role_title: customTitle || 'Custom Technical Role',
      role_description: customDescription,
      required_skills: reqSkills.length > 0 ? reqSkills : undefined
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-2">
          <Building2 className="w-3.5 h-3.5" />
          <span>Organization & Recruiter Portal</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Evidence-Verified Candidate Ranking
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Screen students using repository metadata, README excerpts, and clearly labeled candidate-provided information rather than relying only on resume keywords.
        </p>
      </div>

      {/* Role Selector Card */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCustomMode(false)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                !isCustomMode
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              Select Seeded Opportunity
            </button>
            <button
              onClick={() => setIsCustomMode(true)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                isCustomMode
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              Paste Custom Role Description
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span>Min Fit: <strong className="font-mono text-emerald-400">{minScore}%</strong></span>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-20 accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {!isCustomMode ? (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Choose Target Role / Project
            </label>
            <select
              value={selectedOppId}
              onChange={handleSelectOpp}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {opportunities.map((opp) => (
                <option key={opp.id} value={opp.id}>
                  {opp.title} — {opp.company_or_lab} ({opp.role_type})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Role Title</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Distributed Systems Intern"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Required Skills (Comma separated)</label>
                <input
                  type="text"
                  value={customRequiredSkills}
                  onChange={(e) => setCustomRequiredSkills(e.target.value)}
                  placeholder="e.g. Go, PostgreSQL, Docker"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Role Description / Mission</label>
              <textarea
                rows={2}
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Paste key responsibilities or tech requirements to automatically parse skills..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow transition-colors flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Rank Cohort Candidates</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" />
          Ranked Candidates ({rankedCandidates.length})
        </h2>
        <span className="text-xs text-slate-400">
          Sorted deterministically by verified skill alignment
        </span>
      </div>

      {loading ? (
        <LoadingState stage="Calculating candidate alignment and evidence ranking..." />
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      ) : rankedCandidates.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-400 text-xs border border-slate-800">
          No candidates matched with minimum score of {minScore}%. Try lowering the score threshold.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {rankedCandidates.map((candidateRank, idx) => (
            <StudentRankCard
              key={candidateRank.student.id || idx}
              rankItem={candidateRank}
              rankNumber={idx + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

