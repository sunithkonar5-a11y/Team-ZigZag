import React, { useState } from 'react';
import { Filter, Search, SlidersHorizontal, Sparkles, Building2, User } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import MatchCard from '../components/MatchCard';
import LoadingState from '../components/LoadingState';

export default function Matches() {
  const { matches, currentProfile, loading, loadDemo, setActiveTab, refreshMatches } = useProfile();
  const [selectedRoleType, setSelectedRoleType] = useState('all');
  const [selectedWorkMode, setSelectedWorkMode] = useState('all');
  const [minScore, setMinScore] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const roleTypes = [
    { id: 'all', label: 'All Opportunities' },
    { id: 'internship', label: 'Internships' },
    { id: 'research', label: 'Research' },
    { id: 'hackathon', label: 'Hackathons' },
    { id: 'open_source', label: 'Open Source / Fellowship' },
    { id: 'full_time', label: 'Full-time' },
  ];

  const workModes = [
    { id: 'all', label: 'All Modes' },
    { id: 'remote', label: 'Remote' },
    { id: 'hybrid', label: 'Hybrid' },
    { id: 'onsite', label: 'On-site' },
  ];

  const handleRoleTypeChange = (type) => {
    setSelectedRoleType(type);
    refreshMatches(type === 'all' ? null : type, minScore);
  };

  const handleScoreChange = (score) => {
    setMinScore(score);
    refreshMatches(selectedRoleType === 'all' ? null : selectedRoleType, score);
  };

  const filteredMatches = matches.filter((m) => {
    const opp = m.opportunity;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      opp.title?.toLowerCase().includes(q) ||
      opp.company_or_lab?.toLowerCase().includes(q) ||
      opp.description?.toLowerCase().includes(q) ||
      opp.location?.toLowerCase().includes(q) ||
      (opp.required_skills || []).some((s) => s.toLowerCase().includes(q)) ||
      (opp.preferred_skills || []).some((s) => s.toLowerCase().includes(q));

    const matchesType =
      selectedRoleType === 'all' || (opp.role_type && opp.role_type.toLowerCase() === selectedRoleType.toLowerCase());

    const matchesWorkMode =
      selectedWorkMode === 'all' || (opp.work_mode && opp.work_mode.toLowerCase() === selectedWorkMode.toLowerCase());

    const matchesScore = m.score >= minScore;

    return matchesSearch && matchesType && matchesWorkMode && matchesScore;
  });

  if (!currentProfile) {
    return (
      <div className="glass-panel rounded-2xl p-8 max-w-xl mx-auto my-12 text-center border border-slate-800">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4 text-indigo-400">
          <User className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No Profile Loaded</h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Please analyze your GitHub account or load the pre-cached demo profile first to calculate your verified matches and skill gaps.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={loadDemo}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Load Demo Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
          >
            Go to Profile Builder
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Opportunity Matches & Gap Analysis
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic weighted fit based on {currentProfile.name}'s evidence-backed and candidate-provided skills.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Targeting candidate:</span>
          <span className="text-xs font-semibold text-emerald-400 font-mono bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
            @{currentProfile.github_username || 'candidate'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by role, company, or tech stack (e.g. Python, Stripe, Docker)..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Min Score Filter */}
          <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 flex-shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Min Score: <strong className="font-mono text-emerald-400">{minScore}%</strong></span>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={minScore}
              onChange={(e) => handleScoreChange(Number(e.target.value))}
              className="w-24 accent-indigo-500 cursor-pointer ml-1"
            />
          </div>
        </div>

        {/* Role Type Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 flex-shrink-0" />
            {roleTypes.map((rt) => (
              <button
                key={rt.id}
                onClick={() => handleRoleTypeChange(rt.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                  selectedRoleType === rt.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {rt.label}
              </button>
            ))}
          </div>

          {/* Work Mode Pills */}
          <div className="flex items-center gap-1 text-xs overflow-x-auto self-start sm:self-auto">
            {workModes.map((wm) => (
              <button
                key={wm.id}
                onClick={() => setSelectedWorkMode(wm.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all ${
                  selectedWorkMode === wm.id
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white bg-slate-900/60'
                }`}
              >
                {wm.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingState stage="Re-scoring opportunities..." />
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl border border-slate-800">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white">No Matching Opportunities Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, lowering the minimum match score, or selecting another role category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredMatches.map((matchItem, idx) => (
            <MatchCard key={matchItem.opportunity.id || idx} match={matchItem} />
          ))}
        </div>
      )}
    </div>
  );
}

