import React from 'react';

export default function ScoreRing({ score = 0, size = 68, strokeWidth = 6, label = "Match" }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const offset = circumference - (clampedScore / 100) * circumference;

  let strokeColor = '#10b981'; // emerald-500
  let textColor = 'text-emerald-400';
  let bgColor = 'bg-emerald-500/10';

  if (clampedScore < 45) {
    strokeColor = '#f43f5e'; // rose-500
    textColor = 'text-rose-400';
    bgColor = 'bg-rose-500/10';
  } else if (clampedScore < 70) {
    strokeColor = '#f59e0b'; // amber-500
    textColor = 'text-amber-400';
    bgColor = 'bg-amber-500/10';
  } else if (clampedScore < 85) {
    strokeColor = '#3b82f6'; // blue-500
    textColor = 'text-blue-400';
    bgColor = 'bg-blue-500/10';
  }

  return (
    <div className={`relative inline-flex flex-col items-center justify-center p-1 rounded-full ${bgColor}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-800"
          fill="transparent"
        />
        {/* Animated Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={`text-sm font-bold tracking-tight font-mono ${textColor}`}>
          {Math.round(clampedScore)}%
        </span>
        {size > 60 && (
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

