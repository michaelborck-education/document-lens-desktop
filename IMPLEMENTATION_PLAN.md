# document-lens-desktop Implementation Plan

## Overview

**document-lens-desktop** is a cross-platform Electron desktop application for batch PDF analysis, designed primarily for sustainability researchers analyzing corporate annual reports. It connects to the document-lens API backend for text extraction and analysis.

### Target Users
- Sustainability researchers analyzing corporate annual reports
- Non-technical users who need simple double-click installation
- Primary platform priority: **Windows > Mac > Linux**

### Core Use Case
Researchers upload batches of corporate annual report PDFs, analyze them for sustainability keywords and n-grams (using frameworks like TCFD, GRI, SDGs, SASB), compare across documents, identify trends over time, and export findings for research papers.

---

## Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Framework** | Electron 28+ | Cross-platform, robust, proven (VS Code, Slack) |
| **Frontend** | React 18 + TypeScript | Popular ecosystem, large community |
| **UI Components** | Shadcn/ui + Tailwind CSS | Modern, accessible, customizable |
| **State Management** | Zustand | Simple, lightweight, TypeScript-friendly |
| **Database** | SQLite (better-sqlite3) | Local, portable, no server needed |
| **Charts** | Recharts | React-friendly, good documentation |
| **Word Cloud** | react-wordcloud | Simple integration |
| **Build** | electron-builder | Cross-platform builds |
| **Auto-update** | electron-updater | GitHub Releases integration |

---

## Project Structure

```
document-lens-desktop/
├── .github/
│   └── workflows/
│       ├── build.yml              # Build on PR for testing
│       └── release.yml            # Build + publish releases
├── electron/
│   ├── main.ts                    # Main process entry
│   ├── preload.ts                 # Secure IPC bridge
│   ├── backend-manager.ts         # Spawns/manages Python backend
│   └── database.ts                # SQLite operations
├── src/
│   ├── components/
│   │   ├── ui/                    # Shadcn components
│   │   ├── DocumentList.tsx
│   │   ├── KeywordHighlighter.tsx
│   │   ├── KeywordSelector.tsx    # Selectable keywords within frameworks
│   │   ├── WordCloud.tsx
│   │   ├── TrendChart.tsx
│   │   ├── Heatmap.tsx
│   │   ├── RadarChart.tsx         # For framework comparison
│   │   └── ...
│   ├── pages/
│   │   ├── ProjectList.tsx
│   │   ├── ProjectDashboard.tsx
│   │   ├── DocumentView.tsx
│   │   ├── KeywordExplorer.tsx
│   │   ├── NgramAnalysis.tsx
│   │   ├── ComparisonView.tsx
│   │   ├── FrameworkComparison.tsx # Cross-framework comparison
│   │   ├── TrendsView.tsx
│   │   └── Settings.tsx
│   ├── stores/
│   │   ├── projectStore.ts
│   │   ├── analysisStore.ts
│   │   ├── keywordStore.ts
│   │   └── settingsStore.ts
│   ├── services/
│   │   ├── api.ts                 # document-lens API client
│   │   ├── db.ts                  # SQLite queries
│   │   └── export.ts              # CSV/Excel export
│   ├── data/
│   │   └── frameworks/
│   │       ├── tcfd.json          # ~68 keywords
│   │       ├── sdgs.json          # ~412 keywords
│   │       ├── gri.json           # ~118 keywords
│   │       └── sasb.json          # ~108 keywords
│   ├── App.tsx
│   └── main.tsx
├── build/
│   └── pyinstaller/
│       └── document-lens.spec     # PyInstaller config
├── resources/
│   ├── icon.icns                  # Mac icon
│   ├── icon.ico                   # Windows icon
│   └── icon.png                   # Linux icon
├── package.json
├── electron-builder.yml
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## Data Model (SQLite)

```sql
-- Projects (collections of documents)
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Documents within projects
CREATE TABLE documents (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    file_size INTEGER,
    content_type TEXT,
    -- User-entered/auto-detected metadata (all editable)
    report_year INTEGER,
    company_name TEXT,
    industry TEXT,
    country TEXT,
    report_type TEXT,
    custom_tags TEXT,                -- JSON array of tags
    custom_metadata TEXT,            -- JSON object for extra fields
    -- Extracted content (cached from API)
    extracted_text TEXT,
    extracted_pages TEXT,            -- JSON: [{page_number, text}]
    pdf_metadata TEXT,               -- JSON: {author, title, creation_date, ...}
    inferred_metadata TEXT,          -- JSON: {probable_year, probable_company, ...}
    -- Analysis status
    analysis_status TEXT DEFAULT 'pending',  -- pending, analyzing, completed, failed
    analyzed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cached analysis results
CREATE TABLE analysis_results (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    analysis_type TEXT NOT NULL,     -- readability, writing_quality, word_analysis, etc.
    results TEXT NOT NULL,           -- JSON blob from API
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Keyword lists (user-defined and framework presets)
CREATE TABLE keyword_lists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    framework TEXT,                  -- tcfd, sdgs, gri, sasb, custom
    list_type TEXT NOT NULL,         -- simple, grouped, weighted
    keywords TEXT NOT NULL,          -- JSON structure
    is_builtin BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Keyword search results (cached)
CREATE TABLE keyword_results (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    keyword_list_id TEXT NOT NULL REFERENCES keyword_lists(id),
    selected_keywords TEXT,          -- JSON: keywords actually used (subset selection)
    results TEXT NOT NULL,           -- JSON: {keyword: {document_id: {count, contexts}}}
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- N-gram results (cached)
CREATE TABLE ngram_results (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    ngram_type INTEGER NOT NULL,     -- 2 for bigrams, 3 for trigrams
    filter_terms TEXT,               -- JSON: optional filter terms used
    results TEXT NOT NULL,           -- JSON: aggregated results
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Settings
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Default country list (editable)
CREATE TABLE countries (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_default BOOLEAN DEFAULT TRUE
);

-- Default industry list (editable)
CREATE TABLE industries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    is_default BOOLEAN DEFAULT TRUE
);

-- Indexes for performance
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_year ON documents(report_year);
CREATE INDEX idx_documents_company ON documents(company_name);
CREATE INDEX idx_analysis_document ON analysis_results(document_id);
CREATE INDEX idx_keyword_results_project ON keyword_results(project_id);
```

---

## Framework Keyword Lists

Pre-built keyword lists for sustainability frameworks are stored in `src/data/frameworks/`. See the JSON files in this handoff folder:

| Framework | File | Keywords | Categories |
|-----------|------|----------|------------|
| TCFD | `tcfd.json` | ~68 | 4 pillars |
| UN SDGs | `sdgs.json` | ~412 | 17 goals |
| GRI | `gri.json` | ~118 | 3 categories |
| SASB | `sasb.json` | ~108 | 5 dimensions |
| **Total** | | **~706** | |

### Keyword List Types Supported

1. **Simple**: Flat list of terms
   ```json
   ["carbon", "emissions", "renewable"]
   ```

2. **Grouped**: Terms organized by category
   ```json
   {
     "Environmental": ["carbon", "emissions"],
     "Social": ["diversity", "inclusion"]
   }
   ```

3. **Weighted**: Terms with importance scores
   ```json
   [
     {"term": "net zero", "weight": 1.0},
     {"term": "green", "weight": 0.5}
   ]
   ```

---

## Features

### Core Features (MVP)

1. **Project/Collection Management**
   - Create, rename, delete projects
   - Project dashboard with summary stats

2. **Batch PDF Import**
   - Drag-and-drop or file picker
   - Multiple file selection
   - Progress indicator during import

3. **Metadata Entry/Editing**
   - Auto-detection from PDF metadata and content (year, company, industry, country)
   - All fields user-editable
   - Bulk edit capability

4. **Document Text Extraction**
   - Page-level text display with navigation
   - "Open Original PDF" button (system viewer)

5. **Framework Keyword Presets**
   - TCFD, SDGs, GRI, SASB dropdown
   - Selectable keywords within frameworks (checkboxes)
   - "Select All", "Top 10", "Top 20" quick options

6. **Custom Keyword Lists**
   - Create from scratch
   - Copy and customize built-in lists
   - Import from CSV
   - Support simple, grouped, weighted types

7. **Cross-Document Keyword Search**
   - Search selected keywords across all project documents
   - Results table with counts per document
   - Context snippets with highlighting

8. **N-gram Analysis**
   - Bigrams (2-word phrases)
   - Trigrams (3-word phrases)
   - Optional filter by terms
   - Cross-document aggregation

9. **Cross-Framework Comparison**
   - Select multiple frameworks
   - Compare coverage scores across documents
   - Grouped bar charts
   - Radar/spider charts

### Visualizations

1. **Word Cloud**: Top terms across project/document
2. **Bar Chart**: Keyword frequency by document
3. **Heatmap**: Keywords (rows) × Documents (columns) matrix
4. **Trend Lines**: Year-over-year keyword frequency
5. **Radar Chart**: Framework category coverage comparison
6. **Grouped Bar Chart**: Framework comparison across documents

### Metadata Fields

| Field | Auto-detect | Source | User Editable |
|-------|-------------|--------|---------------|
| report_year | Yes | PDF metadata, filename, content | Yes |
| company_name | Yes | PDF metadata, content | Yes |
| industry | Yes | Content analysis | Yes (dropdown) |
| country | Yes | Content analysis | Yes (dropdown) |
| report_type | Yes | Filename, content | Yes (dropdown) |
| custom_tags | No | - | Yes |

### Export Options

- **Single Document**: Text + analysis as JSON
- **Project Summary**: CSV with document metadata and key metrics
- **Keyword Analysis**: CSV with all keyword results
- **N-gram Analysis**: CSV with phrase frequencies
- **Full Project**: ZIP bundle with all data

### Settings

- **Backend Configuration**: URL (default localhost), connection test
- **Offline Mode**: Auto-detect, show banner, disable unavailable features
- **Country List**: Default ~50 countries, editable
- **Industry List**: Default ~20 industries (GICS-based), editable
- **Data Management**: Database location, clear cache, export all data

---

## UI/UX Design Decisions

### Keyword Selection Within Frameworks

Users can select/deselect individual keywords before running analysis:

```
┌─────────────────────────────────────────────────────────────────┐
│  TCFD - Climate Disclosure                      [Select All]    │
├─────────────────────────────────────────────────────────────────┤
│  ▼ Governance (16 terms)                        [Select All]    │
│    ☑ board oversight                                            │
│    ☑ climate governance                                         │
│    ☐ management role        ← user unchecked                    │
│    ☑ climate committee                                          │
│    ...                                                          │
│                                                                 │
│  ▼ Strategy (32 terms)                          [Select All]    │
│    ☑ climate risks                                              │
│    ☑ physical risks                                             │
│    ...                                                          │
├─────────────────────────────────────────────────────────────────┤
│  Selected: 45 of 68 terms                                       │
│                                                                 │
│  Quick Select: [All] [Top 10] [Top 20] [None]                   │
│                                                                 │
│  [Use Selected]  [Save as Custom List]                          │
└─────────────────────────────────────────────────────────────────┘
```

### Cross-Framework Comparison View

```
┌─────────────────────────────────────────────────────────────────┐
│  Framework Comparison                                           │
├─────────────────────────────────────────────────────────────────┤
│  Select Frameworks:                                             │
│  ☑ TCFD    ☑ GRI    ☐ SASB    ☑ UN SDGs                        │
│                                                                 │
│  Documents: [All in project ▼]                                  │
│                                                                 │
│  [Run Comparison]                                               │
└─────────────────────────────────────────────────────────────────┘

Results:
┌─────────────────────────────────────────────────────────────────┐
│  Framework Coverage (keyword matches)                           │
├─────────────────────────────────────────────────────────────────┤
│                    │ TCFD    │ GRI     │ UN SDGs │              │
│  Company A 2023    │ 234     │ 156     │ 89      │              │
│  Company A 2022    │ 198     │ 142     │ 76      │              │
│  Company B 2023    │ 312     │ 201     │ 124     │              │
└─────────────────────────────────────────────────────────────────┘

[Grouped Bar Chart]  [Radar Chart]  [Heatmap]  [Export CSV]
```

### Document View

- **Tabs**: Text | Analysis | Keywords
- **Text Tab**: Extracted text with page navigation, keyword highlighting
- **Analysis Tab**: Readability scores, writing quality metrics
- **Keywords Tab**: Keyword matches with context snippets
- **Sidebar**: "Open Original PDF" button, metadata display

---

## Development Phases

### Phase 2.1: Project Setup & Infrastructure (8-10 hours)
- Initialize Electron + React + TypeScript project
- Configure Tailwind CSS + Shadcn/ui
- Set up SQLite with better-sqlite3
- Create database schema and migrations
- Implement backend manager (spawn Python backend)
- Create basic API client service
- **Deliverable**: Empty app that launches, creates database, communicates with API

### Phase 2.2: Project & Document Management (12-15 hours)
- Project list page (grid/list view)
- Create/edit/delete project
- Project dashboard with stats
- Document import (file picker, drag-drop)
- Document list table (sortable)
- Metadata entry modal (auto-detect + manual)
- Document deletion
- **Deliverable**: Can create projects, import PDFs, view document list

### Phase 2.3: Single Document Analysis (10-12 hours)
- Document view page with tabs
- Text display with page navigation
- Analysis results display
- Keyword highlighting in text
- "Analyze" button (calls API, caches results)
- "Open Original PDF" button
- **Deliverable**: Can view and analyze individual documents

### Phase 2.4: Keyword List Management (10-12 hours)
- Seed built-in framework lists on first run
- Keyword lists page
- Framework preset dropdown
- Keyword selector component (checkboxes within categories)
- "Select All", "Top N" quick options
- Custom list creation
- Copy/customize built-in lists
- CSV import for custom lists
- **Deliverable**: Can browse, select, and customize keyword lists

### Phase 2.5: Batch Analysis & Keyword Search (12-15 hours)
- "Analyze All" batch operation with progress
- Cross-document keyword search
- Keyword Explorer page
- Results table (keyword × document)
- Context snippet display
- Quick search input for ad-hoc terms
- **Deliverable**: Can run batch analysis and search keywords across project

### Phase 2.6: N-gram Analysis (6-8 hours)
- N-gram Analysis page
- Bigram/Trigram toggle
- Filter input (optional terms)
- Cross-document aggregation
- Context view for selected phrases
- **Deliverable**: Can extract and explore n-grams across project

### Phase 2.7: Visualizations (12-15 hours)
- Word Cloud component
- Bar Chart component (keyword frequency)
- Heatmap component (keywords × documents)
- Trend Line component (year-over-year)
- Radar Chart component (framework comparison)
- Grouped Bar Chart (framework comparison)
- Add charts to dashboard and analysis pages
- Chart export (PNG/SVG)
- **Deliverable**: All visualizations working

### Phase 2.8: Export & Reporting (6-8 hours)
- CSV export utility
- Excel export (xlsx)
- Export buttons throughout UI
- Export options modal
- Full project ZIP export
- **Deliverable**: Can export all data in multiple formats

### Phase 2.9: Settings & Offline Mode (6-8 hours)
- Settings page
- Backend URL configuration
- Connection test button
- Offline detection and banner
- Disable unavailable features when offline
- Country/industry list editors
- Data management (location, clear cache)
- **Deliverable**: Settings and offline mode working

### Phase 2.10: Build & Distribution (12-15 hours)
- PyInstaller spec for document-lens
- Test Python bundling on all platforms
- electron-builder configuration
- Windows: NSIS installer
- Mac: DMG with code signing + notarization
- Linux: AppImage
- GitHub Actions release workflow
- Auto-update configuration (electron-updater)
- **Deliverable**: Installable apps for all platforms

### Phase 2.11: Polish & Testing (10-12 hours)
- UI consistency review
- Error handling improvements
- Loading state polish
- Keyboard navigation
- Basic E2E tests for critical flows
- README and documentation
- First release preparation
- **Deliverable**: Release-ready application

---

## Effort Summary

| Phase | Description | Effort |
|-------|-------------|--------|
| 2.1 | Setup & Infrastructure | 8-10 hrs |
| 2.2 | Project & Document Management | 12-15 hrs |
| 2.3 | Single Document Analysis | 10-12 hrs |
| 2.4 | Keyword List Management | 10-12 hrs |
| 2.5 | Batch Analysis & Keyword Search | 12-15 hrs |
| 2.6 | N-gram Analysis | 6-8 hrs |
| 2.7 | Visualizations | 12-15 hrs |
| 2.8 | Export & Reporting | 6-8 hrs |
| 2.9 | Settings & Offline Mode | 6-8 hrs |
| 2.10 | Build & Distribution | 12-15 hrs |
| 2.11 | Polish & Testing | 10-12 hrs |
| **Total** | | **105-130 hrs** |

---

## Recommended Development Order

Since batch analysis and visualizations are critical for researchers:

1. **Phase 2.1** - Project setup (foundation)
2. **Phase 2.2** - Project/document management (core workflow)
3. **Phase 2.4** - Keyword lists (needed for batch analysis)
4. **Phase 2.5** - Batch analysis & keyword search (main use case)
5. **Phase 2.3** - Single document view (drill-down from batch)
6. **Phase 2.6** - N-gram analysis
7. **Phase 2.7** - Visualizations
8. **Phase 2.8** - Export
9. **Phase 2.9** - Settings
10. **Phase 2.10** - Build & distribution
11. **Phase 2.11** - Polish

---

## API Requirements from document-lens

The desktop app requires these API enhancements (to be implemented in the document-lens repo):

### 1. Page-level Text Extraction
Return extracted text with page boundaries:
```json
{
  "extracted_text": {
    "full_text": "...",
    "pages": [
      {"page_number": 1, "text": "..."},
      {"page_number": 2, "text": "..."}
    ],
    "total_pages": 45
  }
}
```

### 2. Include Extracted Text Parameter
Add `include_extracted_text: bool = False` parameter to `/files` endpoint.

### 3. Batch Keyword Search Endpoint
New `POST /search/keywords` (plural) endpoint:
```json
{
  "keywords": ["carbon", "emissions", "renewable"],
  "documents": ["text1...", "text2..."],
  "document_names": ["doc1.pdf", "doc2.pdf"],
  "context_chars": 100
}
```

### 4. N-gram Filter Parameter
Add optional `filter_terms` to `/ngrams` endpoint:
```json
{
  "text": "...",
  "n": 2,
  "top_k": 100,
  "filter_terms": ["carbon", "emission"]
}
```

### 5. Enhanced Metadata Inference
Return inferred metadata from content:
```json
{
  "inferred": {
    "probable_year": 2023,
    "probable_company": "Acme Corp",
    "document_type": "annual_report"
  }
}
```

---

## Default Country List (~50)

G20 + EU + major emerging markets:

```json
[
  "Argentina", "Australia", "Austria", "Belgium", "Brazil", "Canada", 
  "Chile", "China", "Colombia", "Czech Republic", "Denmark", "Egypt",
  "Finland", "France", "Germany", "Greece", "Hong Kong", "India", 
  "Indonesia", "Ireland", "Israel", "Italy", "Japan", "Malaysia",
  "Mexico", "Netherlands", "New Zealand", "Nigeria", "Norway", "Pakistan",
  "Peru", "Philippines", "Poland", "Portugal", "Russia", "Saudi Arabia",
  "Singapore", "South Africa", "South Korea", "Spain", "Sweden", 
  "Switzerland", "Taiwan", "Thailand", "Turkey", "UAE", "United Kingdom",
  "United States", "Vietnam"
]
```

---

## Default Industry List (~20)

Based on GICS sectors:

```json
[
  "Energy",
  "Materials",
  "Industrials",
  "Consumer Discretionary",
  "Consumer Staples",
  "Health Care",
  "Financials",
  "Information Technology",
  "Communication Services",
  "Utilities",
  "Real Estate",
  "Mining",
  "Oil & Gas",
  "Automotive",
  "Aerospace & Defense",
  "Banking",
  "Insurance",
  "Retail",
  "Transportation",
  "Agriculture"
]
```

---

## Build & Distribution

### GitHub Actions Release Workflow

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Checkout document-lens
        uses: actions/checkout@v4
        with:
          repository: your-username/document-lens
          ref: v1.0.0  # Specify backend version
          path: document-lens-backend
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Build Python Backend
        run: |
          cd document-lens-backend
          pip install pyinstaller
          pip install -e .
          pyinstaller --onefile --name document-lens-api app/main.py
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Electron app
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_ID_PASSWORD: ${{ secrets.APPLE_ID_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
        run: npm run build
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: release-${{ matrix.os }}
          path: dist/*
```

### Code Signing

**Mac** (you have Apple Developer account):
- Configure in electron-builder.yml
- Requires APPLE_ID, APPLE_ID_PASSWORD, APPLE_TEAM_ID secrets
- Notarization enabled for Gatekeeper approval

**Windows**:
- First run shows SmartScreen warning
- User clicks "More info" → "Run anyway"
- Only on first run (Windows remembers)

**Linux**:
- No signing required

---

## Offline Mode Handling

### Features Available Offline
- Browse previously analyzed documents
- View cached analysis results
- Create/manage keyword lists
- View visualizations from cached data
- Export cached data

### Features Requiring Connection
- Import new PDFs (needs text extraction)
- Run new analysis
- DOI resolution (in academic analysis)
- URL verification

### UI Indicators
- Banner at top when offline: "Offline Mode - some features unavailable"
- Disabled buttons with tooltips explaining why
- Auto-reconnect when connection restored

---

## Getting Started (For New Conversation)

1. Create new repository: `document-lens-desktop`
2. Copy this IMPLEMENTATION_PLAN.md to the repo
3. Copy framework JSON files from `desktop-handoff/framework-keywords/`
4. Follow Phase 2.1 to set up the project
5. Proceed through phases in recommended order

### Key Files to Create First
1. `package.json` with Electron + React dependencies
2. `electron/main.ts` - Main process
3. `electron/preload.ts` - IPC bridge
4. `electron/database.ts` - SQLite setup
5. `src/App.tsx` - React entry
6. Database schema migration

---

## Questions for Clarification During Development

If any of these arise during development:

1. **Exact API contract**: Coordinate with document-lens API development
2. **Chart library specifics**: Recharts vs Chart.js decision
3. **PDF viewer integration**: System viewer approach confirmed
4. **Offline storage limits**: How much cached data to retain
5. **Auto-update UX**: Full auto vs notification + manual download

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12-08 | Initial plan |
