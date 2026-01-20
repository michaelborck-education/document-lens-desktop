# Analysis Workflows & Examples

Practical walkthroughs for common research scenarios.

---

## Workflow 1: Year-over-Year Trend Analysis

### Goal
Compare sustainability reporting maturity across years: Did companies strengthen their climate commitments from 2022 → 2023 → 2024?

### Setup

**Project**: "Climate Report Trends"

**Collections**:
- "2022 Reports" (15 documents)
- "2023 Reports" (18 documents)
- "2024 Reports" (20 documents)

**Profiles**:
- "TCFD Climate Risk" (active):
  - Keywords: climate risks, physical risks, transition risks, emissions, net zero
  - Domains: Governance, Strategy, Risk Management, Metrics

### Steps

#### 1. Create Collections
```
Collections → New Collection
→ Name: "2022 Reports"
→ Select all 2022 PDFs
→ Save

Repeat for 2023 and 2024
```

#### 2. Set Up Profile
```
Profiles → New Profile
→ Name: "TCFD Climate Risk"
→ Select TCFD keywords: climate risks, transition risks, emissions, net zero
→ Select domains: Governance, Strategy, Risk Management, Metrics
→ Make Active
```

#### 3. Keyword Search by Year
```
Keyword Search
→ Collection: "2022 Reports"
→ Run search
→ Note: "net zero" appears in 3/15 documents (20%)
→ Export results

Repeat for 2023: 8/18 documents (44%)
Repeat for 2024: 16/20 documents (80%)
```

**Finding**: Net zero commitments mentioned 4x more frequently in 2024 vs 2022

#### 4. Visualize Trend
```
Visualizations
→ View "Keyword Frequency" across years
→ Export chart showing increasing mention of:
  - Net zero targets
  - Science-based targets
  - Climate governance
```

#### 5. Comparative Analysis
```
Comparative Analysis
→ Collection A: "2022 Reports"
→ Collection B: "2024 Reports"
→ Compare tabs:

Sentiment: 2022 = 40% positive, 2024 = 75% positive
  → Companies sound more confident about climate action

Keywords: 2022 mentions emissions 150x, 2024 mentions 400x
  → Increased focus on measurement

Domains: 2024 scores higher on Metrics & Targets
  → Companies setting more quantified targets

Writing Quality: Both similar readability
  → Clarity hasn't changed, just depth
```

#### 6. Export Report
```
Project → Export
→ Include:
  ☑ Collections
  ☑ Profiles
  ☑ Analysis Results
  ☑ Extracted Text
→ Share .lens file with stakeholders
→ They can verify findings independently
```

### Key Insights
- Reporting maturity increasing year-over-year
- Net zero commitments becoming standard
- Governance focus strengthening
- Measurable metrics improving

---

## Workflow 2: Regional Comparison (EU vs US vs Asia)

### Goal
Compare how different regional markets approach sustainability reporting.

### Setup

**Project**: "Global Sustainability Reporting"

**Collections**:
- "EU Companies" (12 documents) - European registered
- "US Companies" (15 documents) - US-headquartered
- "APAC Companies" (10 documents) - Australia, Japan, Singapore

**Profiles**:
- "GRI Full" (active):
  - All GRI keywords
  - All domains
  - Sentiment analysis enabled

### Steps

#### 1. Import & Organize
```
Import 37 PDFs with company region metadata
Collections → New Collection → "EU Companies"
→ Select documents with region="EU"
→ Repeat for US and APAC
```

#### 2. Keyword Analysis by Region
```
Keyword Search
→ Collection: "EU Companies"
→ Search for GRI keywords
→ Note high emphasis on:
  - Human rights
  - Supply chain governance
  - Environmental compliance
→ Export

Repeat for US: Higher emphasis on energy efficiency, innovation
Repeat for APAC: Mixed, some companies weak on disclosure
```

#### 3. Regional Comparisons

**EU vs US**
```
Comparative Analysis
→ Collection A: "EU Companies"
→ Collection B: "US Companies"

Sentiment: Similar (both ~60% positive)

Keywords:
  EU: Environmental (200x), Human Rights (80x)
  US: Energy (250x), Innovation (120x)
  → EU stronger on ESG breadth, US on energy

Domains:
  EU: Well-balanced across all domains
  US: Heavy on Strategy & Metrics, lighter on Governance
  → EU more holistic approach

Writing: US slightly more technical language
```

**EU vs APAC**
```
Comparative Analysis
→ Collection A: "EU Companies"
→ Collection B: "APAC Companies"

Sentiment: EU (65% positive), APAC (45% positive)
→ APAC companies more cautious/realistic tone

Keywords: EU mentions sustainability 3x more often
→ Stronger alignment with regional regulations (CSRD)

Domains: EU scores higher on Risk Management
→ Better awareness of climate risks

Writing: APAC reports shorter (8th vs 9th grade level)
→ Possible translation issue or simpler approach
```

#### 4. Key Findings
- **EU**: Regulation-driven, comprehensive approach, emphasis on human rights
- **US**: Market-driven, efficiency/innovation focus, less governance detail
- **APAC**: Emerging maturity, variable disclosure, fewer net zero targets

#### 5. Report
```
Export → Create report comparing:
- Regulatory environment impact
- Regional disclosure standards
- Competitive positioning
- Investor expectations
```

---

## Workflow 3: Company Deep-Dive Across Years

### Goal
Understand one company's sustainability evolution: How has [Company]'s reporting changed?

### Setup

**Project**: "Nike Sustainability Journey"

**Collections**:
- "Nike 2020" (1 document)
- "Nike 2021" (1 document)
- "Nike 2022" (1 document)
- "Nike 2023" (1 document)

**Profiles**:
- "SASB + GRI Combined":
  - Keywords: Labor practices, environmental impact, governance, supply chain, innovation
  - Domains: All
  - Sentiment analysis enabled

### Steps

#### 1. Single-Company Collections
```
Collections → New
→ Name: "Nike 2020"
→ Add Nike's 2020 sustainability report
→ Save

Repeat for 2021, 2022, 2023
```

#### 2. Keyword Trends
```
Keyword Search
→ Collection: "Nike 2020"
→ Search all keywords
→ Results: Labor practices mentioned 120x, environmental 90x, etc.

Export results

Repeat for each year
→ Create timeline showing keyword evolution
```

#### 3. Deep Analysis: 2020 vs 2023
```
Comparative Analysis
→ Collection A: "Nike 2020"
→ Collection B: "Nike 2023"

Sentiment: 2020 (50% positive), 2023 (70% positive)
→ More confident tone

Keywords:
  - "Sustainable materials" 25x → 120x (4.8x increase!)
  - "Carbon neutral" 5x → 45x (9x increase!)
  - "Worker welfare" 80x → 140x (1.75x increase)
  → Clear strategic shift toward environmental impact

Domains:
  - 2020: Balanced
  - 2023: Heavy on Metrics & Strategy
  → Company now leading on measurement

Writing: Consistent readability, more professional
```

#### 4. Interpretation
- Nike shifted from labor focus → environmental leadership
- Increased measurement/target-setting
- "Sustainable materials" becoming core strategy
- More confident public messaging

#### 5. Create Report
```
Show progression:
- 2020: Compliance-focused ("worker welfare")
- 2021: Transition year (new commitments)
- 2022: Execution phase (metrics rising)
- 2023: Leadership narrative (confidence up)

Hypothesis: Regulatory/investor pressure drove shift
```

---

## Workflow 4: Board Governance Focus (SASB)

### Goal
Analyze how well boards are addressing governance issues highlighted by SASB framework.

### Setup

**Project**: "SASB Governance Review"

**Collections**:
- "Financial Services" (8 companies)
- "Technology" (7 companies)
- "Manufacturing" (6 companies)

**Profile**:
- "SASB Governance" (active):
  - Keywords: Board composition, executive compensation, risk oversight, audit committee, shareholder rights
  - Domain: Governance only
  - Other analysis types disabled (for speed)

### Steps

#### 1. Governance-Only Collections
```
Collections grouped by industry (SASB material issues vary by sector)
```

#### 2. Governance Keyword Search
```
Keyword Search
→ Collection: "Financial Services"
→ Run SASB governance keywords

Results show:
- "Board composition" mentioned in 7/8 (87%)
- "Risk oversight" in 5/8 (62%)
- "Audit committee" in 8/8 (100%)
- "Shareholder rights" in 3/8 (37%)

Finding: All discuss audit, but few discuss shareholder engagement
```

#### 3. Inter-Sector Comparison
```
Comparative Analysis
→ Collection A: "Financial Services"
→ Collection B: "Technology"

Keywords:
- Financial: "Audit committee" 85x, "Risk oversight" 45x
- Tech: "Board diversity" 120x, "Compensation" 80x
→ Tech emphasizes diversity, Finance emphasizes risk

Governance focus differs by sector as expected
```

#### 4. Governance Gaps
```
Export results showing:
- Which governance topics each company addresses
- Comparative strength on different governance dimensions
- Gaps where companies lag peers
```

---

## Workflow 5: Framework Comparison (TCFD vs GRI vs SASB)

### Goal
Compare how the same reports address different frameworks' requirements.

### Setup

**Project**: "Framework Analysis"

**Collections**:
- "All Company Reports" (25 documents)

**Profiles** (create 3 separate ones):
- "TCFD Focus": TCFD keywords only
- "GRI Focus": GRI keywords only
- "SASB Focus": SASB keywords only

### Steps

#### 1. Create All Three Profiles
```
Profiles → Create 3 profiles, each with single framework
Make "TCFD Focus" active initially
```

#### 2. Switch Profiles, Run Analysis
```
Profiles → Activate "TCFD Focus"
→ Keyword Search → Run → Export results

Profiles → Activate "GRI Focus"
→ Keyword Search → Run → Export results

Profiles → Activate "SASB Focus"
→ Keyword Search → Run → Export results
```

#### 3. Compare Framework Coverage
```
Analysis across all 25 companies:

TCFD Coverage:
- Climate risks: 88% of reports
- Governance: 76%
- Metrics: 64%
→ Most companies strong on climate risks, weak on metrics

GRI Coverage:
- Environmental: 92% of reports
- Social: 78%
- Economic: 45%
→ Companies stronger on E and S, neglect economic impacts

SASB Coverage:
- Governance: 95%
- Risk Management: 82%
- Strategy: 71%
→ Most address governance, fewer integrate SASB into strategy
```

#### 4. Interpretation
- **TCFD**: Companies good at identifying risks, weak on metrics/targets
- **GRI**: Environmental reporting well-developed, social less comprehensive
- **SASB**: Governance topics ubiquitous, but SASB not driving strategy

#### 5. Recommendation Report
```
For regulators/investors:
- Companies understand frameworks conceptually
- Weak on quantified commitments
- Need better integration with strategy/targets
```

---

## Workflow 6: M&A Due Diligence

### Goal
Quickly assess sustainability/governance health of acquisition target.

### Setup

**Project**: "Acme Corp - Acquisition Due Diligence"

**Collections**:
- "Acme 3-Year Reports" (3 documents) - Last 3 sustainability reports

**Profiles**:
- "Acquisition Risk Assessment":
  - Keywords: Governance, risk management, compliance, environmental liabilities, litigation
  - Domains: Governance, Risk Management
  - Analysis: Sentiment (tone indicates confidence/concern)

### Steps

#### 1. Import Target's Reports
```
Import last 3 years of sustainability reports
Group into single collection: "Acme 3-Year Reports"
```

#### 2. Quick Red Flag Scan
```
Keyword Search
→ High frequency of: "risk", "litigation", "compliance" = potential issues
→ Sentiment analysis: Negative tone = defensive posture

Run searches:
- "Litigation": Found in 2/3 reports → Red flag
- "Environmental liability": Found in 1/3 reports → Potential cost
- "Governance changes": Found 3x → Instability?
```

#### 3. Trend Analysis
```
Visualizations
→ Are governance mentions increasing (good) or decreasing (bad)?
→ Is sentiment getting more positive (improving) or negative (declining)?
→ Are environmental/social commitments strengthening?
```

#### 4. Due Diligence Report
```
Summary:
✓ Governance structure improving
✗ Environmental liabilities undisclosed
? Litigation history concerning

Recommendation:
- Conduct environmental site assessment
- Review litigation history
- Request full governance documentation
- Sensitivity: $X million potential liability
```

---

## Workflow 7: Materiality Assessment

### Goal
Determine which ESG issues matter most to your industry peers.

### Setup

**Project**: "Energy Sector Materiality"

**Collections**:
- "All Energy Companies" (20 reports from energy sector)

**Profiles** (create multiple):
- "Climate Materiality": Climate, emissions, energy efficiency
- "Social Materiality": Labor, community, supply chain
- "Governance Materiality": Board, exec comp, ethics
- "Business Materiality": R&D, supply chain resilience, digital

### Steps

#### 1. Keyword Frequency by Theme
```
For each profile, activate and run keyword search
→ Count frequency of each keyword
→ Higher frequency = more material to peers

Results:
Climate keywords: 4,200 mentions across 20 reports (avg 210/report)
Social keywords: 1,800 mentions (avg 90/report)
Governance keywords: 2,100 mentions (avg 105/report)
Business keywords: 3,200 mentions (avg 160/report)

Interpretation:
Climate = most material, Social = least material
```

#### 2. Consensus Check
```
What % of companies address each issue?
- Climate risks: 95% of companies mention
- Community engagement: 60% of companies mention
- Board diversity: 85% of companies mention

High consensus = table stakes, must address
Low consensus = differentiator, optional
```

#### 3. Materiality Matrix
```
Create matrix:
         Low Frequency | High Frequency
Low Consensus |   Ignore   | Emerging
High Consensus| Table      | Critical
              | Stakes     |

Position each ESG issue:
Climate risks: High/High → CRITICAL (must address)
Board diversity: High/High → CRITICAL
Labor practices: Medium/High → Important but less discussed
Community: Low/Low → Nice-to-have
```

#### 4. Strategic Implications
```
- Allocate resources to critical materiality items
- Monitor emerging issues
- De-prioritize low-consensus items
- Communicate materiality to stakeholders
```

---

## Workflow 8: Academic Research - Comparing Disclosure Standards

### Goal
Research paper: "Do mandatory climate disclosures improve target-setting?"

Hypothesis: Companies in mandatory disclosure jurisdictions (EU-CSRD) set more ambitious climate targets than voluntary disclosure markets (US).

### Setup

**Project**: "Disclosure Standards Study"

**Collections**:
- "EU Companies (Mandatory)" (25 reports)
- "US Companies (Voluntary)" (25 reports)

**Profiles**:
- "Climate Target Analysis": Keywords focused on net zero, carbon reduction, renewable energy, science-based targets

### Steps

#### 1. Target-Setting Frequency
```
Keyword Search
→ Collection: "EU Companies"
→ Search for target keywords
→ 24/25 (96%) have quantified targets
→ Average 8.3 targets per company

Keyword Search
→ Collection: "US Companies"
→ Search for target keywords
→ 18/25 (72%) have quantified targets
→ Average 4.2 targets per company

Finding: Mandatory disclosure correlates with more targets
```

#### 2. Target Specificity
```
Manual review of target details:
- EU: Typically science-based, 2030 + 2050 roadmap
- US: More varied, some vague ("reduce emissions significantly")

EU targets more specific and science-aligned
```

#### 3. Comparative Analysis
```
Comparative Analysis
→ Collection A: "EU Companies"
→ Collection B: "US Companies"

Keywords:
- EU: "Net zero" 340x, "Science-based" 280x, "2050" 210x
- US: "Net zero" 95x, "Reduce emissions" 150x, "2050" 60x
→ EU much more explicit on net zero science-based pathway

Sentiment:
- EU: Confident about targets
- US: More cautious tone

Writing:
- EU: More technical language (indicates serious analysis)
- US: More marketing language
```

#### 4. Paper Structure
```
Introduction: Research question
Methods: 50 reports, 2 regions, keyword analysis
Results: Data showing EU leads on target-setting
Discussion: Regulatory mandate drives disclosure quality
Conclusion: Policy works - mandatory disclosure improves targets

Appendix: .lens bundle with all data, profiles, analysis
→ Allows peer verification and extension
```

#### 5. Publish with Reproducibility
```
Export .lens bundle with:
✓ All collections
✓ All profiles
✓ All analysis results
✓ Extracted text

Publish alongside paper
→ Other researchers can verify/extend your work
→ True reproducibility
```

---

## Key Takeaways

### When to Use Each Analysis Type

| Analysis | Best For | Time | Complexity |
|----------|----------|------|-----------|
| Keyword Search | Quick scans, trend spotting | 5 min | Low |
| Collections | Organizing large datasets | 10-30 min | Low |
| Comparative | Understanding differences | 15-30 min | Medium |
| Visualizations | Presenting to stakeholders | 10 min | Low |
| N-gram Analysis | Deep linguistic analysis | 20 min | High |
| Profiles + Switch | Multi-lens research | Varies | Medium |

### Analysis Checklist

Before starting research:
- [ ] Define research question clearly
- [ ] Organize documents into collections
- [ ] Create profile(s) matching framework(s)
- [ ] Run pilot analysis on small subset
- [ ] Document methodology for reproducibility
- [ ] Plan export/sharing strategy
- [ ] Identify when backend/offline affects results

### Collaboration Tips

When sharing .lens bundles:
- Include detailed collection descriptions
- Name profiles clearly ("TCFD Focus" vs "GRI Focus")
- Write quick README about your methodology
- Version your bundles (v1, v2) if iterating
- Export with analysis results + profiles for reproducibility

---

## Next Steps

1. Start with Workflow 1 (Year-over-Year) - simplest entry point
2. Move to Workflow 2 (Regional) - manageable complexity
3. Try Workflow 7 (Materiality) - directly useful for strategy
4. Explore others based on your research needs

Questions? Check USER-GUIDE.md or open an issue on GitHub.
