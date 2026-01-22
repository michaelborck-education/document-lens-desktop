# Document Lens User Guide

A desktop application for batch PDF analysis of corporate reports using research frameworks like TCFD, GRI, SDGs, and SASB.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Core Concepts](#core-concepts)
3. [Basic Workflow](#basic-workflow)
4. [Document Library](#document-library)
5. [Quick Filter](#quick-filter)
6. [Document Analysis](#document-analysis)
7. [Analysis Profiles](#analysis-profiles)
8. [Keyword Search](#keyword-search)
9. [Visualizations](#visualizations)
10. [Data Export](#data-export)
11. [Collaboration](#collaboration)

---

## Quick Start

### 1. Create a Project
- Click **"New Project"** on the home screen
- Enter project name (e.g., "2024 Sustainability Reports")
- Click **Create**

### 2. Import Documents (PDFs)
- Inside your project, click **"Import PDFs"** or drag files into the drop zone
- Alternatively, click **"Add from Library"** to use documents already in your library
- App automatically extracts text and stores metadata
- Documents appear in the project dashboard

### 3. Start Analyzing
- Click **"Keyword Search"** to find framework keywords
- Click **"Visualizations"** to see keyword frequency
- Click **"N-gram Analysis"** to find common phrases
- Use **Quick Filter** on any analysis page to focus on specific documents

---

## Core Concepts

### Document Library
**What**: A central repository of all PDFs you've imported into Document Lens.

**Why**: Documents can be reused across multiple projects without duplicating files. Import once, use everywhere.

**Key Points**:
- Access via **"Document Library"** from the home screen
- One document can belong to multiple projects
- Delete from library removes from all projects
- Remove from project keeps document in library

### Projects
**What**: Organizational containers for grouping related documents together.

**Why**: Separate different research efforts, time periods, or themes.

**Examples**:
- "2024 Climate Reports"
- "Banking Sector Analysis"
- "Regional Comparison Study"

### Quick Filter
**What**: Ad-hoc filtering on analysis pages to include/exclude specific documents.

**Why**: Analyze any subset of your project's documents without creating separate projects.

**Use Cases**:
- Compare just 3 specific companies
- Analyze only documents from 2023
- Focus on documents that mention certain topics

### Analysis Profiles
**What**: Saved sets of keyword searches and domain settings for repeated analysis.

**Why**: Reuse the same analysis configuration across different projects.

**Examples**:
- "TCFD Climate Risks" - TCFD keywords + climate domain focus
- "SDG Mapping" - SDG keywords + all domains
- "Board Governance" - SASB governance keywords + governance domain

---

## Basic Workflow

### Scenario: Analyzing Corporate Climate Reports

**Step 1: Create Project**
```
Home → New Project → Name: "2024 Climate Reports"
```

**Step 2: Import Documents**
```
Project Dashboard → Import PDFs → Select 10 PDFs
Wait for extraction complete (shows progress bar)

Or: Add from Library → Select existing documents
```

**Step 3: Add Document Metadata** (optional, but recommended)
```
Click document row → Edit → Add metadata:
- Company name
- Report year
- Industry
- Country
```

**Step 4: Run Keyword Search**
```
Keyword Search → Select framework (e.g., TCFD)
→ Click keywords to search for
→ View results showing which documents contain keywords
→ Export results as CSV/Excel
```

**Step 5: Use Quick Filter for Subset Analysis**
```
Visualizations → Click "All Documents" dropdown
→ Select "Select specific documents..."
→ Check the 3 companies you want to compare
→ Apply → Analysis updates to show only those documents
```

**Step 6: View Individual Document Stats**
```
Documents tab → Click "..." menu on document row
→ "View Stats"
→ See word count, readability scores, top keywords
```

---

## Document Library

### Accessing the Library
1. From home screen, click **"Document Library"**
2. Or click **"Library"** in the sidebar

### Library Features

**View All Documents**
- See every PDF you've ever imported
- Search/filter by filename, company, year
- Sort by any column

**Add to Projects**
- Select documents → **"Add to Project"**
- Choose one or more projects
- Documents remain in library and appear in projects

**Remove vs Delete**
- **Remove from Project**: Document stays in library, removed from one project
- **Delete from Library**: Permanently removes document from everywhere

### Importing New Documents

**Method 1: Import to Project**
```
Project Dashboard → Import PDFs
Documents added to both library AND current project
```

**Method 2: Import to Library Only**
```
Document Library → Import PDFs
Documents added to library, can assign to projects later
```

### Document Metadata

Each document can have:
- **Filename**: Auto-detected from PDF
- **Company Name**: For organizing by company
- **Report Year**: For temporal analysis
- **Industry**: For sector comparisons
- **Country**: For regional analysis
- **Report Type**: (e.g., Annual Report, Sustainability Report)

---

## Quick Filter

### What Is Quick Filter?

Quick Filter lets you analyze a subset of documents without modifying your project. Available on:
- Visualizations page
- N-gram Analysis page

### Using Quick Filter

1. Navigate to **Visualizations** or **N-gram Analysis**
2. Click the **filter dropdown** (shows "All Documents" by default)
3. Select **"Select specific documents..."**
4. In the dialog, check the documents you want to include
5. Click **Apply Filter**
6. Analysis re-runs with only selected documents

### Quick Filter vs Projects

| Feature | Quick Filter | Projects |
|---------|--------------|----------|
| Scope | Temporary, per-session | Permanent organization |
| Storage | Not saved | Saved to database |
| Use case | Ad-hoc exploration | Ongoing research |
| Sharing | Not exportable | Exportable in bundles |

### When to Use Quick Filter

**Good for:**
- "Let me just check these 3 documents quickly"
- "What if I exclude the outlier company?"
- "Compare documents from a single year"

**Better as a Project:**
- Repeated analysis on same subset
- Need to share with colleagues
- Part of your research methodology

---

## Document Analysis

### Viewing Individual Document Stats

1. Go to your project's **Documents** tab
2. Find the document you want to analyze
3. Click the **"..."** menu (three dots) on that row
4. Select **"View Stats"**

### Available Metrics

**Text Statistics**
- Word count
- Sentence count
- Paragraph count
- Average sentence length

**Readability Scores**
- Flesch Reading Ease (0-100, higher = easier to read)
- Flesch-Kincaid Grade Level
- Gunning Fog Index

**Writing Quality**
- Vocabulary richness (unique words / total words)
- Passive voice ratio

**Top Words**
- Most frequently used words in the document
- Excludes common stop words

### Interpreting Readability

| Flesch Score | Difficulty | Typical Audience |
|--------------|------------|------------------|
| 90-100 | Very Easy | 5th grade |
| 80-89 | Easy | 6th grade |
| 70-79 | Fairly Easy | 7th grade |
| 60-69 | Standard | 8th-9th grade |
| 50-59 | Fairly Difficult | College |
| 30-49 | Difficult | College graduate |
| 0-29 | Very Difficult | Professional |

### Running Analysis

Documents must be analyzed before stats are available:
1. Go to project **Analysis** section
2. Click **"Run Analysis"**
3. Select analysis types (text metrics, readability, etc.)
4. Analysis runs on all documents in project
5. Stats now available via "View Stats"

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

5. Select analysis domains
6. Save profile

### Making a Profile Active

```
Profiles → Click profile name
→ Click "Make Active" (star icon)
```

**Result**: This profile's settings are now used by default in Keyword Search.

### Profile Examples

#### Profile 1: Climate Risk Focus
```
Name: "TCFD Climate Analysis"
Frameworks: TCFD only
Keywords: climate risks, physical risks, transition risks, emissions
Domains: Governance, Strategy, Risk Management, Metrics
```

#### Profile 2: Holistic Sustainability
```
Name: "Full Sustainability"
Frameworks: TCFD + GRI + SDGs
Keywords: All (30+ keywords across frameworks)
Domains: All
```

---

## Keyword Search

### Basic Search

1. Go to **Keyword Search**
2. Your active profile's keywords are pre-selected
3. Modify keyword selection if needed:
   - Check/uncheck keywords to include/exclude
4. Click **"Search"**

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
→ File downloads
```

### Advanced: N-gram Analysis

Find common phrases in your documents:

1. Go to **N-gram Analysis**
2. (Optional) Use Quick Filter to select specific documents
3. Choose n-gram size:
   - 2-grams: "climate risk", "carbon emissions"
   - 3-grams: "climate risk management", "net zero target"
4. Set minimum frequency
5. Click **"Analyze"**

Results show most common phrases, helping identify:
- Common talking points
- Emerging terminology
- How language differs between documents

---

## Visualizations

### Available Charts

**Keyword Frequency**
- Word cloud or bar chart showing most mentioned keywords
- Use: Quick overview of document focus

**Keywords x Documents Heatmap**
- Grid showing which keywords appear in which documents
- Use: Identify patterns across your corpus

### Using Quick Filter with Visualizations

1. Go to Visualizations page
2. Click filter dropdown → "Select specific documents..."
3. Pick which documents to include
4. Charts update to show only those documents

### Exporting Charts

Each chart has an export button:
- PNG: High-quality image
- SVG: Vector format for publications
- CSV: Raw data for further analysis

---

## Data Export

### Export Formats

#### 1. CSV / Excel
Best for: Spreadsheet analysis, data science workflows

Contains: Document-level data with keywords, metrics

#### 2. JSON
Best for: API integration, programmatic analysis

Contains: Structured data for custom tools

#### 3. .lens Bundle (ZIP)
Best for: Sharing with colleagues, reproducibility

Contents:
- Project configuration
- Profiles configuration
- Document metadata
- Analysis results
- (Optional) Extracted text
- (Optional) Original PDFs

---

## Collaboration

### Share Projects & Profiles

#### Step 1: Export Bundle
```
Project Dashboard → Export Project
→ Select options:
  ☑ Profiles: Include your analysis profiles
  ☐ Analysis Results: Include cached analysis
  ☐ Extracted Text: Include PDF text
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
→ Home screen
→ "Import Bundle"
→ Select your .lens file
→ Preview shows what will import
→ Click "Import"
→ Project & profiles now in their app
```

### Privacy & Offline

- **No cloud required**: All processing happens locally
- **No login**: No accounts needed
- **No data sharing**: Only bundles you explicitly create
- **Complete privacy**: PDFs never leave your machine unless you explicitly include them

---

## Tips & Best Practices

### Organization
- Use meaningful project names
- Add metadata to documents (company, year) for better filtering
- Use Quick Filter for ad-hoc analysis, projects for permanent organization

### Performance
- Large projects (1000+ documents) may be slower
- Use Quick Filter to subset documents during analysis
- Disable unused domains in profiles to speed up analysis

### Quality
- Start with small dataset to test your workflow
- Verify results manually (keyword search shows context)
- Document your methodology for reproducibility

### Collaboration
- Always export with profiles included
- Use metadata (company, year, country) consistently
- Version your bundles (v1, v2) when sharing updates

---

## Troubleshooting

### Search Returns No Results
**Problem**: Keywords don't match documents

**Possible causes**:
1. Keywords not actually in documents (manually review)
2. Profile has wrong keywords selected

**Solution**:
1. View original PDF to verify content
2. Edit profile to include relevant keywords

### Slow Performance
**Problem**: Analysis taking too long

**Solution**:
1. Reduce document count with Quick Filter
2. Disable unused domains in profile
3. Run analysis in smaller batches

### Document Stats Not Available
**Problem**: "View Stats" shows no analysis

**Solution**:
1. Run analysis first: Analysis → Run Analysis
2. Wait for analysis to complete
3. Stats now available

---

## Glossary

| Term | Definition |
|------|-----------|
| **Project** | Container for organizing related documents |
| **Document Library** | Central repository of all imported PDFs |
| **Quick Filter** | Temporary filter to analyze subset of documents |
| **Profile** | Saved analysis configuration (keywords, domains, settings) |
| **Active Profile** | Currently selected profile used by default in searches |
| **Framework** | Research framework (TCFD, GRI, SDGs, SASB) |
| **Domain** | Subject area (Governance, Strategy, Risk, Metrics) |
| **Bundle** | .lens ZIP file for sharing projects with colleagues |
| **N-gram** | Common phrase (2-gram: "climate risk", 3-gram: "net zero target") |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + N` | New Project |
| `Cmd/Ctrl + O` | Open Project |
| `Cmd/Ctrl + E` | Export |
| `Cmd/Ctrl + /` | Open Help |

---

## Contact & Support

- **Repository**: [GitHub](https://github.com/michaelborck-education/document-lens-desktop)
- **Issues**: [Report a bug](https://github.com/michaelborck-education/document-lens-desktop/issues)
