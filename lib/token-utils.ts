/**
 * Determines the combined token type based on call and X analysis
 * If they disagree, returns 'hybrid'
 */
export function getCombinedTokenType(
  callType: string | null | undefined,
  xType: string | null | undefined
): 'meme' | 'utility' | 'hybrid' {
  // If no X analysis yet, use call type
  if (!xType) {
    return (callType as 'meme' | 'utility' | 'hybrid') || 'meme';
  }
  
  // If no call type for some reason, use X type
  if (!callType) {
    return (xType as 'meme' | 'utility' | 'hybrid') || 'meme';
  }
  
  // If they match, return that type
  if (callType === xType) {
    return callType as 'meme' | 'utility' | 'hybrid';
  }
  
  // If they disagree, it's a hybrid
  return 'hybrid';
}