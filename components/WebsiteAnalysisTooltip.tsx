'use client';

import React from 'react';

interface WebsiteAnalysisTooltipProps {
  fullAnalysis: {
    exceptional_signals?: string[];
    missing_elements?: string[];
    quick_assessment?: string;
    category_scores?: Record<string, number>;
    proceed_to_stage_2?: boolean;
  } | null;
  children: React.ReactNode;
}

export function WebsiteAnalysisTooltip({ fullAnalysis, children }: WebsiteAnalysisTooltipProps) {
  const [showTooltip, setShowTooltip] = React.useState(false);

  if (!fullAnalysis) {
    return <>{children}</>;
  }

  const { exceptional_signals = [], missing_elements = [] } = fullAnalysis;

  // Don't show tooltip if no data
  if (exceptional_signals.length === 0 && missing_elements.length === 0) {
    return <>{children}</>;
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      
      {showTooltip && (
        <div className="absolute z-[9999] bottom-full left-1/2 transform -translate-x-1/2 mb-2">
          <div className="bg-[#1a1c1f] rounded-lg shadow-xl border border-[#333] p-4 min-w-[320px] max-w-[400px]">
            {/* PROS Section */}
            {exceptional_signals.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[#00ff88] font-bold text-sm">✅ PROS</span>
                </div>
                <ul className="space-y-1">
                  {exceptional_signals.slice(0, 4).map((signal, idx) => (
                    <li key={idx} className="text-xs text-[#ccc] flex items-start">
                      <span className="text-[#00ff88] mr-2">•</span>
                      <span>{signal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CONS Section */}
            {missing_elements.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[#ff4444] font-bold text-sm">❌ CONS</span>
                </div>
                <ul className="space-y-1">
                  {missing_elements.slice(0, 4).map((element, idx) => (
                    <li key={idx} className="text-xs text-[#ccc] flex items-start">
                      <span className="text-[#ff4444] mr-2">•</span>
                      <span>No {element}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Arrow pointing down */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 
              border-l-[8px] border-l-transparent
              border-t-[8px] border-t-[#1a1c1f]
              border-r-[8px] border-r-transparent">
            </div>
          </div>
        </div>
      )}
    </div>
  );
}