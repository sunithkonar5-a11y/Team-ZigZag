import React, { useState, useRef } from 'react';
import {
  Github,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  FolderGit2,
  UploadCloud,
  FileCheck,
  X,
  FileUp,
  BrainCircuit,
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import SkillCard from '../components/SkillCard';
import CareerSuggestions from '../components/CareerSuggestions';
import LoadingState from '../components/LoadingState';
import ErrorBanner from '../components/ErrorBanner';

export default function ProfileBuilder() {
  const {
    currentProfile,
    personalizedSuggestions,
    loading,
    loadingStage,
    error,
    setError,
    loadDemo,
    handleAnalyzeProfile,
    handleUploadResume,
    setActiveTab,
  } = useProfile();

  // Mode: 'resume' (Upload Resume) or 'github' (GitHub / Manual Input)
  const [inputMode, setInputMode] = useState('resume');

  // Resume Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [resumeGithubHandle, setResumeGithubHandle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // GitHub / Manual Input State
  const [username, setUsername] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [manualSkillInput, setManualSkillInput] = useState('');

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    const validExts = ['.pdf', '.docx', '.txt', '.md'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExts.some((ext) => lowerName.endsWith(ext));

    if (!isValid) {
      setError('Unsupported file type. Please upload a PDF (.pdf), Word document (.docx), or plain text (.txt).');
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  const handleResumeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select or drop a resume file first.');
      return;
    }
    try {
      await handleUploadResume(selectedFile, resumeGithubHandle);
    } catch {
      // Error handled in context
    }
  };

  const handleGithubSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() && !resumeText.trim()) {
      setError('Please enter a GitHub username or paste your project highlights.');
      return;
    }

    const manualSkills = manualSkillInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    handleAnalyzeProfile(username, resumeText, manualSkills);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative text-center max-w-2xl mx-auto pt-4 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-3">
          <BrainCircuit className="w-3.5 h-3.5" />
          <span>AI-Powered Skill & Resume Advisor</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Show What You Have Built. <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-indigo-400 to-cyan-400">
            Tailored Career Suggestions.
          </span>
        </h1>
        <p className="mt-3 text-sm text-slate-400 max-w-lg mx-auto">
          Upload your resume or link your GitHub profile. Our intelligence engine analyzes your exact skill fingerprint to generate deeply customized recommendations that vary person-to-person.
        </p>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* Input Mode Selector & Forms */}
      <div className="glass-panel rounded-2xl p-6 max-w-3xl mx-auto border border-slate-800 shadow-2xl space-y-6">
        {/* Mode Toggle Tabs */}
        <div className="flex p-1 bg-slate-900/90 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setInputMode('resume')}
            className={`flex-1 py-2 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              inputMode === 'resume'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileUp className="w-4 h-4" />
            <span>Upload Resume (.pdf, .docx, .txt)</span>
          </button>
          <button
            type="button"
            onClick={() => setInputMode('github')}
            className={`flex-1 py-2 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              inputMode === 'github'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Github className="w-4 h-4" />
            <span>GitHub Profile & Highlights</span>
          </button>
        </div>

        {/* Option A: Resume File Upload */}
        {inputMode === 'resume' && (
          <form onSubmit={handleResumeSubmit} className="space-y-5">
            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-indigo-400 bg-indigo-500/10'
                  : selectedFile
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-slate-700/80 hover:border-slate-600 bg-slate-900/40 hover:bg-slate-900/70'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md"
                onChange={handleFileChange}
                className="hidden"
              />

              {selectedFile ? (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{selectedFile.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      className="text-slate-400 hover:text-rose-400 p-0.5 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready for AI extraction
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 text-indigo-400 flex items-center justify-center border border-slate-700">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-white">
                    Drag & drop your resume here, or <span className="text-indigo-400">browse</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Supports PDF (.pdf), Microsoft Word (.docx), or plain text (.txt)
                  </p>
                </div>
              )}
            </div>

            {/* Optional GitHub handle for dual correlation */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Github className="w-4 h-4 text-slate-400" />
                GitHub Username (Optional)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-mono text-sm">
                  @
                </span>
                <input
                  type="text"
                  value={resumeGithubHandle}
                  onChange={(e) => setResumeGithubHandle(e.target.value)}
                  placeholder="e.g. alexchen-dev (links your commit history to resume)"
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={loadDemo}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Load Demo Profile</span>
              </button>

              <button
                type="submit"
                disabled={loading || !selectedFile}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Resume...</span>
                  </>
                ) : (
                  <>
                    <span>Extract Skills & Get Personalized Advice</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Option B: GitHub Handle & Text Input */}
        {inputMode === 'github' && (
          <form onSubmit={handleGithubSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Github className="w-4 h-4 text-slate-400" />
                  GitHub Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-mono text-sm">
                    @
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. alexchen-dev"
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Additional Skills (Optional)
                </label>
                <input
                  type="text"
                  value={manualSkillInput}
                  onChange={(e) => setManualSkillInput(e.target.value)}
                  placeholder="Comma separated: Docker, PyTorch, Go"
                  className="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                Project / Resume Highlights (Optional)
              </label>
              <textarea
                rows={3}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste relevant coursework, architecture achievements, or project descriptions to bolster your evaluation..."
                className="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={loadDemo}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Load Demo Profile</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Extract & Verify Skills</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Loading state indicator */}
      {loading && <LoadingState stage={loadingStage} />}

      {/* Verified Profile Card, Career Suggestions, & Skills Grid */}
      {currentProfile && !loading && (
        <div className="space-y-8 animate-fadeIn">
          {/* Profile Overview Card */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <img
                src={
                  currentProfile.avatar_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160'
                }
                alt={currentProfile.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-md"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{currentProfile.name}</h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Skill Profile
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  @{currentProfile.github_username || 'developer'} •{' '}
                  {currentProfile.email || 'Email not provided'}
                </div>
                {currentProfile.bio && (
                  <p className="text-xs text-slate-300 mt-2 max-w-xl leading-relaxed">
                    {currentProfile.bio}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 self-stretch md:self-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-800">
              <div className="flex items-center gap-4 bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800 text-xs">
                <div>
                  <div className="text-slate-400 flex items-center gap-1">
                    <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" /> Repos Analyzed
                  </div>
                  <div className="text-base font-bold text-white font-mono mt-0.5">
                    {currentProfile.repos_analyzed ?? 0}
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div>
                  <div className="text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Profile Skills
                  </div>
                  <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                    {currentProfile.skills?.length || 0}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('matches')}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all"
              >
                <span>View Opportunity Matches</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Personalized Career Suggestions & Blueprints */}
          {personalizedSuggestions && (
            <CareerSuggestions
              suggestions={personalizedSuggestions}
              onViewMatches={() => setActiveTab('matches')}
            />
          )}

          {/* Skills Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Evidence-backed Skills
                </h3>
                <p className="text-xs text-slate-400">
                  Open a skill card to inspect its evidence, source, estimated level, and confidence.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {currentProfile.skills?.length || 0} Competencies
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentProfile.skills?.map((sk, idx) => (
                <SkillCard key={sk.id || idx} skill={sk} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
