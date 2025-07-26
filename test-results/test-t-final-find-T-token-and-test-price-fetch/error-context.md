# Page snapshot

```yaml
- navigation:
  - heading "KROM Analysis" [level=1]
- main:
  - heading "KROM Historical Analysis Tool" [level=3]
  - paragraph: Analyze cryptocurrency calls with AI-powered scoring
  - text: 5,557 Call Analysis (100.0%) 5,557 X Analysis (100.0%) 474 Prices Fetched (8.5%) 5,557 Total Calls
  - heading "Call Analysis" [level=3]
  - paragraph: Analyze based on call messages
  - text: Number of calls to analyze (from oldest)
  - spinbutton "Number of calls to analyze (from oldest)": "5"
  - text: AI Model
  - combobox "AI Model": Kimi K2 (Good Value)
  - button "Start Analysis"
  - heading "X (Twitter) Analysis" [level=3]
  - paragraph: Analyze based on social media sentiment
  - text: Number of calls to analyze (from oldest)
  - spinbutton "Number of calls to analyze (from oldest)": "5"
  - paragraph: Batch analyzes using existing stored tweets (no new fetching)
  - paragraph: Starts from oldest calls • Scores 1-10 based on tweet quality
  - text: AI Model
  - combobox "AI Model": Kimi K2 (Good Value)
  - button "Start X Analysis"
  - heading "Filters" [level=3]
  - button:
    - img
- alert
```