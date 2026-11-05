import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb, ExternalLink, ArrowRight } from 'lucide-react';

export default function GapAction({ gapActions = [], missingSkills = [] }) {
  const [expanded, setExpanded] = useState(false);

  if (!missingSkills || missingSkills.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 border border-amber-500/20 bg-amber-500/5 rounded-xl overflow-hidden transition-all duration-200">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-amber-500/10 transition-colors"
      >
        <div className="flex items-center gap-2 text-amber-300 font-medium text-xs">
          <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            {gapActions.length > 0
              ? `${gapActions.length} Actionable Next Steps to Bridge Skill Gaps`
              : 'Skill Gap Recommendations'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-amber-400 font-mono">
          <span>{expanded ? 'Hide' : 'View Steps'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {expanded && (
        <div className="px-3.5 py-3 border-t border-amber-500/20 bg-slate-900/60 text-xs space-y-2.5">
          <p className="text-slate-300">
            Address these capability gaps to increase your qualification for this role:
          </p>
          <ul className="space-y-2">
            {gapActions.map((action, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-200">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[10px] flex items-center justify-center font-bold mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

