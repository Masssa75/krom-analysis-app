/**
 * Determines the combined token type based on call and X analysis
 * Prioritizes call type over X type
 */
export function getCombinedTokenType(
  callType: string | null | undefined,
  xType: string | null | undefined
): 'meme' | 'utility' {
  // Use call type if available, otherwise use X type
  const type = callType || xType || 'meme';
  
  // Ensure we only return meme or utility
  if (type === 'utility') {
    return 'utility';
  }
  return 'meme';
}