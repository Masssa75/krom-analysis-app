'use client';

import React from 'react';

interface WebsiteAnalysisTooltipProps {
  fullAnalysis: {
    exceptional_signals?: string[];
    missing_elements?: string[];
    quick_take?: string;
    quick_assessment?: string;
    category_scores?: Record<string, number>;
    proceed_to_stage_2?: boolean;
    type_reasoning?: string;
    parsed_content?: {
      text_content?: string;
      links_with_context?: Array<{url: string, text: string, type: string}>;
      headers?: Array<{level: number, text: string}>;
    };
  } | null;
  children: React.ReactNode;
}

export function WebsiteAnalysisTooltip({ fullAnalysis, children }: WebsiteAnalysisTooltipProps) {
  const [showTooltip, setShowTooltip] = React.useState(false);

  if (!fullAnalysis) {
    return <>{children}</>;
  }

  const { 
    exceptional_signals = [], 
    missing_elements = [], 
    quick_take,
    quick_assessment,
    type_reasoning
  } = fullAnalysis;

  // Don't show tooltip if no data
  if (!quick_take && !quick_assessment && exceptional_signals.length === 0 && missing_elements.length === 0) {
    return <>{children}</>;
  }

  // Use AI-generated quick_take if available, otherwise fall back to pattern matching
  const getQuickTake = () => {
    // First, use the AI-generated quick_take if available
    if (quick_take) {
      // Format the quick_take with colored spans
      const parts = quick_take.split(', but ');
      if (parts.length === 2) {
        return `<span class="text-[#00ff88]">${parts[0]}</span>, but <span class="text-[#ff4444]">${parts[1]}</span>`;
      } else if (quick_take.toLowerCase().includes('no real content') || quick_take.toLowerCase().includes('placeholder')) {
        return `<span class="text-[#ff4444]">${quick_take}</span>`;
      } else {
        return `<span class="text-[#00ff88]">${quick_take}</span>`;
      }
    }
    
    // Fallback to pattern matching for old data without quick_take
    if (!quick_assessment) return null;
    
    // Extract key positive and negative points to create a concise summary
    const extractKeyPoints = (text: string) => {
      // Common patterns to extract
      const hasInstitutional = text.match(/\$[\d.,]+[MKB]?\s*(institutional|trade|volume|usage)/i);
      const hasRealProduct = text.match(/(real|working|functional|live)\s*(platform|product|trading|usage|infrastructure)/i);
      const hasUsers = text.match(/(\d+[MK]?)\s*(users?|holders?|trades?)/i);
      const hasRevenue = text.match(/\$[\d.,]+[MKB]?\s*(revenue|earnings|volume)/i);
      
      // Negative patterns
      const noTeam = text.match(/(no team|anonymous|team\s*(info|information)\s*missing|lacks?\s*team)/i);
      const noAudit = text.match(/(no audit|unaudited|lacks?\s*audit|no security)/i);
      const noDocs = text.match(/(no docs|no documentation|lacks?\s*documentation)/i);
      const noGithub = text.match(/(no github|no code|lacks?\s*github)/i);
      const noSocial = text.match(/(no social|no community|lacks?\s*community)/i);
      
      // Build concise summary
      let positive = '';
      let negative = '';
      
      // Prioritize most important positives
      if (hasInstitutional) {
        positive = hasInstitutional[0];
      } else if (hasRevenue) {
        positive = hasRevenue[0];
      } else if (hasRealProduct) {
        positive = hasRealProduct[0];
      } else if (hasUsers) {
        positive = hasUsers[0];
      } else if (text.includes('DeFi')) {
        positive = 'DeFi platform';
      } else if (text.includes('payment')) {
        positive = 'Payment system';
      } else if (text.includes('NFT')) {
        positive = 'NFT platform';
      } else {
        // Fallback: extract first few words that seem positive
        const match = text.match(/([\w\s]+ (platform|token|protocol|ecosystem|project))/i);
        positive = match ? match[1] : 'Project';
      }
      
      // Collect key negatives (max 2-3)
      const negatives = [];
      if (noTeam) negatives.push('no team info');
      if (noAudit) negatives.push('no audits');
      if (noDocs && negatives.length < 2) negatives.push('no docs');
      if (noGithub && negatives.length < 2) negatives.push('no GitHub');
      if (noSocial && negatives.length < 2) negatives.push('no community');
      
      if (negatives.length > 0) {
        negative = negatives.slice(0, 2).join(' or ');
      } else if (text.includes('lacks')) {
        const lacksMatch = text.match(/lacks?\s+([^,\.]+)/i);
        negative = lacksMatch ? `lacks ${lacksMatch[1]}` : '';
      }
      
      // Format the final quick take
      if (positive && negative) {
        return `<span class="text-[#00ff88]">${positive}</span>, but <span class="text-[#ff4444]">${negative}</span>`;
      } else if (positive) {
        return `<span class="text-[#00ff88]">${positive}</span>`;
      } else if (negative) {
        return `<span class="text-[#ff4444]">${negative}</span>`;
      }
      
      // Fallback to shortened first sentence
      const firstSentence = text.split('.')[0].trim();
      if (firstSentence.length > 80) {
        return firstSentence.substring(0, 77) + '...';
      }
      return firstSentence;
    };
    
    return extractKeyPoints(quick_assessment);
  };

  const quickTakeDisplay = getQuickTake();

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      
      {showTooltip && (
        <div className="absolute z-[9999] bottom-full left-1/2 transform -translate-x-1/2 mb-2">
          <div className="bg-[#1a1c1f] rounded-lg shadow-xl border border-[#333] p-4 min-w-[350px] max-w-[450px]">
            
            {/* Quick Take Section */}
            {quickTakeDisplay && (
              <div className="mb-3 pb-3 border-b border-[#2a2d31]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[#888] font-bold text-xs uppercase tracking-wider">💡 Quick Take</span>
                </div>
                <div className="text-xs text-[#ddd] leading-relaxed" dangerouslySetInnerHTML={{ __html: quickTakeDisplay }} />
              </div>
            )}

            {/* Found vs Missing Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* FOUND Section */}
              {exceptional_signals.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-[#00ff88] text-xs font-bold">✓ FOUND</span>
                  </div>
                  <ul className="space-y-1">
                    {exceptional_signals.slice(0, 3).map((signal, idx) => {
                      // Shorten signals if too long
                      const shortSignal = signal.length > 40 ? signal.substring(0, 37) + '...' : signal;
                      return (
                        <li key={idx} className="text-[11px] text-[#aaa] flex items-start">
                          <span className="text-[#00ff88] mr-1.5">•</span>
                          <span>{shortSignal}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* MISSING Section */}
              {missing_elements.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-[#ff4444] text-xs font-bold">✗ MISSING</span>
                  </div>
                  <ul className="space-y-1">
                    {missing_elements.slice(0, 3).map((element, idx) => {
                      // Clean up and shorten
                      let cleanElement = element;
                      if (cleanElement.toLowerCase().startsWith('no ')) {
                        cleanElement = cleanElement.substring(3);
                      }
                      const shortElement = cleanElement.length > 40 ? cleanElement.substring(0, 37) + '...' : cleanElement;
                      
                      return (
                        <li key={idx} className="text-[11px] text-[#aaa] flex items-start">
                          <span className="text-[#ff4444] mr-1.5">•</span>
                          <span>{shortElement}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* Why This Tier Section */}
            {type_reasoning && (
              <div className="mt-3 pt-3 border-t border-[#2a2d31]">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[#888] font-bold text-xs uppercase tracking-wider">🎯 Why This Tier?</span>
                </div>
                <div className="text-[11px] text-[#999] leading-relaxed italic">
                  "{type_reasoning.split('.')[0].trim()}"
                </div>
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