# AI Model Comparison Results

This document tracks comparison results of different AI models (GPT-4, Gemini 2.5 Pro, Kimi K2) analyzing the same cryptocurrency calls to understand their strengths and weaknesses.

## Test Date: July 22, 2025

### Test 1: VIRAL Token

**Call Message**: "Turns viral trends into coins in tiktok"

#### Results:
| Model | Score | Type | Legitimacy | Notes |
|-------|-------|------|------------|-------|
| **Kimi K2** | 4/10 | ✅ Utility | Medium | Correctly identified utility concept |
| **Gemini 2.5 Pro** | 2/10 | ✅ Utility | Low | Recognized utility but scored harshly |
| **GPT-4** | 2/10 | ❌ Meme | Low | Missed the obvious utility description |

**Key Insight**: Kimi K2 best understood the innovative utility concept. GPT-4 surprisingly failed to recognize the utility aspect despite clear description.

---

### Test 2: PETEY Token

**Call Message**: Contract address + link to 2013 Trump tweet about his dog Petey

#### Results:
| Model | Analysis Quality | Key Insight |
|-------|-----------------|-------------|
| **Gemini 2.5 Pro** | Exceptional | Recognized the specific 2013 Trump tweet without visiting the URL, identified it as exploiting an old tweet rather than endorsement |

**Key Insight**: Gemini 2.5 Pro demonstrated impressive knowledge of historical social media posts, understanding context without web access.

---

### Test 3: LAUNCHGRAM Token

**Call Message**: "🪙 $LAUNCHGRAM launch on telegram. hearing tek works. thats why i gambled here around $100k"  
**Group**: mewgambles

#### Call Analysis Results:
| Model | Score | Type | Legitimacy | Key Points |
|-------|-------|------|------------|------------|
| **Kimi K2** | 2/10 | Meme | Low | No verifiable info, gambling group, vague "tek works" |
| **Gemini 2.5 Pro** | 1/10 | Meme | Low | Harshest score, emphasized gambling context |
| **GPT-4** | 3/10 | Meme | Low | Slightly more lenient but still critical |

#### X (Twitter) Analysis Results:
| Model | Score | Type | Legitimacy | Key Points |
|-------|-------|------|------------|------------|
| **Kimi K2** | 2/10 | Meme | Low | Caught 27:1 volume/liquidity red flag |
| **Gemini 2.5 Pro** | 2/10 | Meme | Low | Understood Turkish tweet: "No wallet, no site" |
| **GPT-4** | 4/10 | Meme | Low | Noted bot-like behavior patterns |

**Key Insights**: 
- All models agreed on low legitimacy
- Gemini 2.5 Pro best at understanding multi-language context
- Kimi K2 good at catching technical red flags
- GPT-4 most lenient overall

---

## Model Strengths Summary

### GPT-4
- ✅ Generally accurate (except VIRAL miss)
- ✅ Balanced scoring
- ❌ Sometimes misses obvious utility indicators
- 💰 Most expensive (~$30/$60 per M tokens)

### Gemini 2.5 Pro
- ✅ Excellent context understanding
- ✅ Multi-language capability
- ✅ Recognizes historical references
- ⚠️ Tends to score harshly
- 💰 Good value (~$1.25/$10 per M tokens)
- 🔧 Requires 4000 max_tokens to work properly

### Kimi K2
- ✅ Best at recognizing utility tokens
- ✅ Good at technical analysis
- ✅ Catches liquidity red flags
- ✅ Very cost-effective (~$0.14/$2.49 per M tokens)
- ⚠️ Sometimes needs tweet context to identify utility

---

## Recommendations

1. **For Utility Token Detection**: Use Kimi K2 or Gemini 2.5 Pro
2. **For Historical Context**: Gemini 2.5 Pro excels
3. **For Cost-Effective Analysis**: Kimi K2 offers best value
4. **For Batch Processing**: Gemini 2.5 Pro with batch mode

## Notes on Testing

- All tests used the same legitimacy-focused prompt
- Temperature set to 0.1 for consistency
- Tests performed on calls marked as "coins of interest"
- Results may vary with different prompts or parameters