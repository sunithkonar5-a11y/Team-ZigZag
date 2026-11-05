import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getDemoProfile,
  analyzeProfile,
  matchOpportunities,
  uploadResume,
  getPersonalizedSuggestions,
} from '../api/client';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [currentProfile, setCurrentProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [personalizedSuggestions, setPersonalizedSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'matches', 'org'

  // Automatically load verified demo profile on mount so the frontend is immediately interactive
  useEffect(() => {
    loadDemo();
  }, []);

  const loadDemo = async () => {
    try {
      setLoading(true);
      setError(null);
      setLoadingStage('Loading pre-cached verified student profile...');

      const profile = await getDemoProfile();
      setCurrentProfile(profile);

      setLoadingStage('Computing opportunity matches and personalized recommendations...');
      const matchResults = await matchOpportunities({
        student_id: profile.id,
        skills: profile.skills,
        min_score: 0.0,
      });
      setMatches(matchResults);

      try {
        const suggestions = await getPersonalizedSuggestions({
          student_id: profile.id,
          name: profile.name,
          skills: profile.skills,
        });
        setPersonalizedSuggestions(suggestions);
      } catch (sugErr) {
        console.warn('Failed to load personalized suggestions for demo:', sugErr);
      }

      setActiveTab('profile');
    } catch (err) {
      console.error('Failed to load demo profile:', err);
      setError(
        err?.response?.data?.detail ||
          'Failed to connect to backend server. Make sure FastAPI is running on port 8000.'
      );
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const handleAnalyzeProfile = async (githubUsername, resumeText, manualSkills) => {
    try {
      setLoading(true);
      setError(null);
      setLoadingStage('Querying GitHub API for repositories and README files...');

      const stageTimer1 = setTimeout(() => {
        setLoadingStage('Extracting skills from available repository and project evidence...');
      }, 1500);

      const stageTimer2 = setTimeout(() => {
        setLoadingStage('Normalizing canonical skills and persisting verified evidence...');
      }, 3000);

      const profile = await analyzeProfile({
        github_username: githubUsername,
        resume_text: resumeText,
        manual_skills: manualSkills,
      });

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);

      setCurrentProfile(profile);

      setLoadingStage('Matching profile against opportunities and generating personalized trajectory...');
      const matchResults = await matchOpportunities({
        student_id: profile.id,
        skills: profile.skills,
        min_score: 0.0,
      });
      setMatches(matchResults);

      try {
        const suggestions = await getPersonalizedSuggestions({
          student_id: profile.id,
          name: profile.name,
          skills: profile.skills,
        });
        setPersonalizedSuggestions(suggestions);
      } catch (sugErr) {
        console.warn('Failed to compute personalized suggestions:', sugErr);
      }

      setActiveTab('profile');
    } catch (err) {
      console.error('Profile analysis failed:', err);
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        'Error analyzing profile. Please check username or try demo.';
      setError(detail);
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const handleUploadResume = async (file, githubUsername = '') => {
    try {
      setLoading(true);
      setError(null);
      setLoadingStage('Parsing resume document (.pdf / .docx / .txt)...');

      const formData = new FormData();
      formData.append('file', file);
      if (githubUsername && githubUsername.trim()) {
        formData.append('github_username', githubUsername.trim());
      }

      const stageTimer1 = setTimeout(() => {
        setLoadingStage('Extracting verified technical competencies and project citations...');
      }, 1200);

      const stageTimer2 = setTimeout(() => {
        setLoadingStage('Synthesizing individualized career archetype and gap-bridging blueprints...');
      }, 2400);

      const result = await uploadResume(formData);

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);

      if (result.profile) {
        setCurrentProfile(result.profile);
      }
      if (result.suggestions) {
        setPersonalizedSuggestions(result.suggestions);
      }

      setLoadingStage('Ranking career opportunities from database...');
      const matchResults = await matchOpportunities({
        student_id: result.profile?.id,
        skills: result.profile?.skills || [],
        min_score: 0.0,
      });
      setMatches(matchResults);

      setActiveTab('profile');
      return result;
    } catch (err) {
      console.error('Resume upload failed:', err);
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to process resume. Please ensure it is a valid PDF, DOCX, or text file.';
      setError(detail);
      throw err;
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const refreshMatches = async (roleType = null, minScore = 0.0) => {
    if (!currentProfile) return;
    try {
      setLoading(true);
      const matchResults = await matchOpportunities({
        student_id: currentProfile.id,
        skills: currentProfile.skills,
        role_type: roleType,
        min_score: minScore,
      });
      setMatches(matchResults);
    } catch (err) {
      console.error('Failed to refresh matches:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        currentProfile,
        setCurrentProfile,
        matches,
        setMatches,
        personalizedSuggestions,
        setPersonalizedSuggestions,
        loading,
        loadingStage,
        error,
        setError,
        activeTab,
        setActiveTab,
        loadDemo,
        handleAnalyzeProfile,
        handleUploadResume,
        refreshMatches,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}


