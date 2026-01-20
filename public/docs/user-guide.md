# Document Lens User Guide

A desktop application for batch PDF analysis of corporate reports using research frameworks like TCFD, GRI, SDGs, and SASB.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Core Concepts](#core-concepts)
3. [Basic Workflow](#basic-workflow)
4. [Virtual Collections](#virtual-collections)
5. [Analysis Profiles](#analysis-profiles)
6. [Keyword Search](#keyword-search)
7. [Comparative Analysis](#comparative-analysis)
8. [Visualizations](#visualizations)
9. [Data Export](#data-export)
10. [Collaboration](#collaboration)

---

## Quick Start

### 1. Create a Project
- Click **"New Project"** on the home screen
- Enter project name (e.g., "2024 Sustainability Reports")
- Click **Create**

### 2. Import Documents (PDFs)
- Inside your project, click **"Import Documents"**
- Select one or more PDF files
- App automatically extracts text and stores metadata
- Documents appear in the project dashboard

### 3. Start Analyzing
- Click **"Keyword Search"** to find framework keywords
- Click **"Visualizations"** to see keyword frequency
- Click **"Settings"** to configure the backend API

---

## Core Concepts

### Virtual Collections
**What**: Logical groupings of documents within a project.

**Why**: Organize documents by year, region, company, or analysis theme without duplicating files.

**Examples**:
- Year-based: "2023 Reports", "2024 Reports"
- Region-based: "EU Companies", "Asia-Pacific"
- Theme-based: "Climate Reports", "Energy Transition"

### Analysis Profiles
**What**: Saved sets of keyword searches and domain settings for repeated analysis.

**Why**: Reuse the same analysis configuration across different document collections without reconfiguring every time.

**Examples**:
- "TCFD Climate Risks" - TCFD keywords + climate domain focus
- "SDG Mapping" - SDG keywords + all domains
- "Board Governance" - SASB governance keywords + governance domain

### Research Lens (Active Profile)
Only one profile is "active" per project. This profile's settings are used by default in:
- Keyword Search page
- Comparative Analysis
- N-gram Analysis

---

## Basic Workflow

### Scenario: Analyzing Corporate Climate Reports

**Step 1: Create Project**
```
Projects → New Project → Name: "2024 Climate Reports"
```

**Step 2: Import Documents**
```
Project Dashboard → Import Documents → Select 10 PDFs
Wait for extraction complete (shows progress bar)
```

**Step 3: Create Virtual Collections** (optional, but recommended)
```
Collections → New Collection
- Name: "Europe 2024"
- Description: "EU-domiciled companies"
- Select documents from dashboard (auto-filters by region metadata)
- Save Collection
```

**Step 4: Set Up Analysis Profile**
```
Profiles → New Profile
- Name: "TCFD Climate Analysis"
- Select TCFD keywords:
  ☑ Climate risks
  ☑ Physical risks
  ☑ Transition risks
  ☑ Governance
- Select domains:
  ☑ Governance
  ☑ Strategy
  ☑ Risk Management
  ☑ Metrics & Targets
- Make Active (star icon)
```

**Step 5: Run Analysis**
```
Keyword Search → (Uses active profile)
→ Shows keyword occurrences by document
→ Export results as CSV/Excel
```

**Step 6: Compare Collections**
```
Comparative Analysis
→ Select Collection A: "Europe 2024"
→ Select Collection B: "Asia-Pacific 2024"
→ Click "Compare Collections"
→ See side-by-side metrics:
  - Sentiment distribution
  - Keyword coverage
  - Domain distribution
  - Writing quality scores
```

---

## Virtual Collections

### Creating a Collection

#### Method 1: From Dashboard (Recommended)
1. Go to project **Collections** tab
2. Click **"New Collection"**
3. Enter name & description
4. **Manually select documents** from the list
5. (Optional) Add filter criteria for documentation
6. Click **Create**

#### Method 2: From Filtered View (Future)
1. Go to **Keyword Search** or **Documents** tab
2. Apply filters (e.g., year=2023, company="Acme")
3. See 15 matching documents
4. Click **"Save as Collection"**
5. Name it, confirm documents, create

### Using Collections

**View Collection Details**
```
Collections → Click collection name
→ See all documents in collection
→ Add/remove documents
→ Run analysis on just this collection
```

**Analyze Within a Collection**
```
Keyword Search → Filter by Collection: "Europe 2024"
→ Search runs only on documents in that collection
→ Faster, more focused results
```

**Export Collection**
```
Collections → Right-click collection
→ Export as .lens bundle
→ Choose options:
  ☐ Include extracted text
  ☐ Include analysis results
  ☐ Include original PDFs
→ Share with colleagues
```

### Collection Use Cases

| Use Case | Collection Strategy | Benefits |
|----------|-------------------|----------|
| **Year-over-year analysis** | Create yearly collections (2022, 2023, 2024) | Compare trends across years |
| **Regional analysis** | Group by geography (EU, APAC, Americas) | Identify regional differences |
| **Company deep-dive** | Create separate collections per company | Focus on one company at a time |
| **Framework focus** | "Climate Reports", "Energy Reports" | Themed research |
| **Quality testing** | "Pilot" collection with small sample | Test analysis before full dataset |

---

## Analysis Profiles

### Creating a Profile

1. Go to project **Profiles** tab
2. Click **"New Profile"**
3. Name it (e.g., "TCFD Climate Risks")
4. Select keywords by framework:

```
Framework Options:
- TCFD (Governance, Strategy, Risk Management, Metrics)
- GRI (Environmental, Social, Economic)
- SDGs (17 Sustainable Development Goals)
- SASB (Governance, Risk Management, Strategic Planning)
- CUSTOM (User-defined keywords)

For each framework:
☐ Enable/disable
☑ Select specific keywords to search for
```

5. Select analysis domains:
```
Domains (affects domain mapping analysis):
☑ Governance
☑ Strategy
☑ Risk Management
☑ Metrics & Targets
☑ (Add custom domains)
```

6. Choose analysis types:
```
☑ Sentiment Analysis (if backend available)
☑ Domain Mapping
☑ Keyword Coverage
☑ Writing Quality
```

7. Save profile

### Making a Profile Active

```
Profiles → Click profile name
→ Click "Make Active" (star icon)
```

**Result**: This profile's settings are now used by default in:
- Keyword Search
- Comparative Analysis
- N-gram Analysis
- Exports

### Profile Examples

#### Profile 1: Climate Risk Focus
```
Name: "TCFD Climate Analysis"
Frameworks: TCFD only
  Keywords: climate risks, physical risks, transition risks, emissions
Domains: Governance, Strategy, Risk Management, Metrics
Use: For climate-focused reports
```

#### Profile 2: Holistic Sustainability
```
Name: "Full Sustainability"
Frameworks: TCFD + GRI + SDGs
Keywords: All (30+ keywords across frameworks)
Domains: All
Use: For comprehensive analysis across all reports
```

#### Profile 3: Governance Deep-Dive
```
Name: "Board Governance"
Frameworks: SASB (governance focus)
Keywords: Board composition, executive compensation, risk oversight
Domains: Governance only
Use: For governance-focused research
```

---

## Keyword Search

### Basic Search

1. Go to **Keyword Search**
2. (Optional) Select a collection to limit search scope
3. Your active profile's keywords are pre-selected
4. Modify keyword selection if needed:
   - Check/uncheck keywords to include/exclude
5. Click **"Search"**

### Results

Results show:
- **Document**: Which document contained keyword
- **Matches**: How many times keyword appears
- **Context**: Brief snippet around keyword
- **Page**: Which page(s) keyword appears on

### Export Results

```
Click "Export Results"
→ Choose format:
  • CSV (Excel-compatible)
  • JSON (for programmatic use)
  • PDF (formatted report)
→ File downloads
```

### Advanced: N-gram Analysis

Find common phrases in your documents:

1. Go to **N-gram Analysis**
2. Select collection (optional)
3. Choose n-gram size:
   - 2-grams: "climate risk", "carbon emissions"
   - 3-grams: "climate risk management", "net zero emissions target"
4. Set minimum frequency (e.g., "appear in at least 3 documents")
5. Click **"Analyze"**

Results show most common phrases, helping identify:
- How language differs between reports
- Common talking points
- Emerging terminology

---

## Comparative Analysis

### Purpose
Compare how two document collections differ in:
- Sentiment tone
- Keyword emphasis
- Domain focus
- Writing quality

### How to Compare

1. Go to **Comparative Analysis**
2. Select **Collection A**: "Europe 2024"
3. Select **Collection B**: "Asia-Pacific 2024"
4. Click **"Compare Collections"**

Wait for analysis (shows progress bar). Results display in tabs:

#### Sentiment Tab
- **Distribution Chart**: Positive/Negative/Neutral sentiment mix
- **Average Score**: Side-by-side comparison

*Interpretation*: Are European reports more positive about climate action than Asian reports?

#### Keywords Tab
- **Coverage Comparison**: How many documents in each collection mention key terms
- **Bar Chart**: Side-by-side keyword prevalence

*Interpretation*: Do Asian reports emphasize emissions more than Europeans?

#### Domains Tab
- **Radar Chart**: Multi-dimensional view of domain focus
- **Bar Chart**: Absolute domain coverage

*Interpretation*: Do governance reports focus on different domains?

#### Writing Quality Tab
- **Readability Scores**: Flesch-Kincaid, complexity metrics
- **Writing Metrics**: Average sentence length, vocabulary diversity

*Interpretation*: Which collection uses clearer language?

### Interpreting Results

**Scenario**: Comparing "Climate Leaders" vs "Laggards" collections

```
Sentiment: Leaders = 65% positive, Laggards = 30% positive
→ Interpretation: Leaders frame sustainability more positively

Keywords: Leaders mention "net zero" 250x, Laggards 50x
→ Interpretation: Leaders prioritize net zero commitment

Domains: Leaders score high on Metrics, Laggards on Governance
→ Interpretation: Leaders measure progress; laggards still building governance

Writing: Leaders = 8th grade level, Laggards = 10th grade
→ Interpretation: Leaders communicate more accessibly
```

---

## Visualizations

### Keyword Frequency
Visual: Word cloud or bar chart

Shows most frequently mentioned keywords across selected documents.

**Use**: Quick overview of document focus

### Domain Distribution
Visual: Pie or donut chart

Shows how space is allocated across domains (Governance, Strategy, Risk Management, Metrics).

**Use**: Understand report structure

### Sentiment Distribution
Visual: Stacked bar chart

Shows sentiment breakdown per document or per collection.

**Use**: Compare tone across reports

### Timeline Analysis
Visual: Line chart

Shows keyword frequency trends over time (if documents are dated).

**Use**: Track how emphasis changes year-over-year

### Custom Comparisons
Create side-by-side visualizations of any metrics.

---

## Data Export

### Export Formats

#### 1. CSV / Excel
Best for: Spreadsheet analysis, data science workflows

Contains: Document-level data with keywords, sentiment, domain scores

#### 2. JSON
Best for: API integration, programmatic analysis

Contains: Structured data for custom tools

#### 3. .lens Bundle (ZIP)
Best for: Sharing with colleagues, reproducibility

Contents:
- Collections configuration
- Profiles configuration
- Document metadata
- Analysis results
- (Optional) Extracted text
- (Optional) Original PDFs

---

## Collaboration

### Share Collections & Profiles

#### Step 1: Export Bundle
```
Project Dashboard → Export Project
→ Select format:
  ☑ Collections: Include all your collections
  ☑ Profiles: Include all your analysis profiles
  ☐ Analysis Results: Include cached analysis
  ☐ Extracted Text: Include PDF text (smaller than PDFs)
  ☐ PDF Files: Include original PDFs (larger file)
→ Click Export → .lens file downloads
```

#### Step 2: Share File
- Email .lens file to colleague
- Upload to cloud storage
- Share via file transfer service

#### Step 3: Colleague Imports
```
Their Document Lens App
→ Project Dashboard
→ "Import Bundle"
→ Select your .lens file
→ App shows preview:
  - Collections to import
  - Profiles to import
  - Documents (with matching PDFs by content hash)
→ Click "Import"
→ Collections & profiles now in their app
```

### Workflow Example: Research Team

**Researcher A (Lead)**
1. Creates project "2024 Climate Survey"
2. Imports 50 PDFs from major companies
3. Creates collections: "EU Companies", "US Companies", "Asian Companies"
4. Creates profile: "TCFD Climate Analysis"
5. Runs analysis on each collection
6. Exports bundle (with text, without PDFs)
→ Sends to Research Team

**Researcher B (Team Member)**
1. Imports the .lens bundle
2. Sees A's collections and profile
3. Checks A's analysis results
4. Creates own collection: "Energy Transition Leaders"
5. (Optional) Creates own profile: "Energy Focus"
6. Compares A's collections with own collection
7. Exports findings as bundle
→ Sends back to A

**Researcher A (Review)**
1. Imports B's bundle
2. Sees B's findings side-by-side with original
3. Both teams now synchronized
4. Create summary report with all findings

### Privacy & Offline

- **No cloud required**: All processing happens locally
- **No login**: No accounts needed
- **No data sharing**: Only bundles you explicitly create
- **Complete privacy**: PDFs never leave your machine unless you explicitly include them in export

---

## Tips & Best Practices

### Organization
- Use collections to organize by **domain** (company, region, time period)
- Use profiles to organize by **research lens** (framework, focus area)
- One profile per research question typically

### Performance
- Large projects (1000+ documents) may be slower
- Use collections to subset documents before analysis
- Disable unused domains in profiles to speed up analysis

### Quality
- Start with small pilot collection to test profile
- Verify results manually (keyword search shows context)
- Document your methodology (profile settings) for reproducibility

### Collaboration
- Always export with profiles included
- Use metadata (company, year, country) consistently
- Version your bundles (v1, v2) when sharing updates

---

## Troubleshooting

### "Backend Offline" Message
**Problem**: Backend API not responding

**Solution**:
1. Go to **Settings**
2. Check **Backend URL** (should be `http://127.0.0.1:8765`)
3. Click **"Test Connection"**
4. If error: Contact admin or check backend service

### Search Returns No Results
**Problem**: Keywords don't match documents

**Possible causes**:
1. Keywords not actually in documents (manually review collection)
2. Profile has wrong keywords selected
3. Collection filter is too restrictive

**Solution**:
1. View original PDF to verify content
2. Edit profile to include relevant keywords
3. Broaden collection filter or select all documents

### Comparison Won't Run
**Problem**: "Compare Collections" button disabled

**Possible causes**:
1. Haven't selected 2 different collections
2. Collections empty (no documents)

**Solution**:
1. Ensure Collection A ≠ Collection B
2. Add documents to empty collections

### Slow Performance
**Problem**: Analysis taking too long

**Solution**:
1. Reduce collection size (use filters/subsets)
2. Disable unused domains in profile
3. Ensure backend is running and responsive

---

## Glossary

| Term | Definition |
|------|-----------|
| **Collection** | Logical subset of documents within a project |
| **Profile** | Saved analysis configuration (keywords, domains, settings) |
| **Active Profile** | Currently selected profile used by default in searches |
| **Framework** | Research framework (TCFD, GRI, SDGs, SASB) |
| **Domain** | Subject area (Governance, Strategy, Risk, Metrics) |
| **Bundle** | .lens ZIP file for sharing projects with colleagues |
| **Semantic Analysis** | AI analysis (sentiment, domain mapping) requiring backend |
| **Keyword Search** | Local text matching (works offline) |
| **Sentiment** | Document tone (Positive, Negative, Neutral) |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + N` | New Project |
| `Cmd/Ctrl + O` | Open Project |
| `Cmd/Ctrl + E` | Export |
| `Cmd/Ctrl + S` | Save (auto-saved) |

---

## Contact & Support

- **Repository**: [GitHub](https://github.com/michaelborck-education/document-lens-desktop)
- **Issues**: [Report a bug](https://github.com/michaelborck-education/document-lens-desktop/issues)
- **Backend**: [document-lens API](https://github.com/michaelborck-education/document-lens)
