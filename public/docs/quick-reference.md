# Quick Reference Guide

Fast lookup for common tasks.

---

## Task Quick Links

### Create New Project
1. Home screen → **New Project**
2. Enter name → **Create**
3. Start importing PDFs

### Import PDFs
1. Project Dashboard → **Import Documents**
2. Select PDF files → **Open**
3. Wait for extraction (progress bar)

### Create Virtual Collection
1. **Collections** tab → **New Collection**
2. Enter name & description
3. Select documents from list
4. **Create**

### Create Analysis Profile
1. **Profiles** tab → **New Profile**
2. Enter name & description
3. Select frameworks & keywords
4. Select domains
5. **Save**
6. (Optional) **Make Active** to set as default

### Run Keyword Search
1. **Keyword Search** page
2. (Optional) Select collection to filter
3. Verify keywords are selected
4. **Search**
5. View results with document context
6. **Export** as CSV/JSON/PDF

### Compare Two Collections
1. **Comparative Analysis** page
2. Select Collection A & B
3. **Compare Collections**
4. View results in tabs:
   - Sentiment
   - Keywords
   - Domains
   - Writing Quality

### Export Project as Bundle
1. **Export** button (top right)
2. Select options:
   - Collections: Include your custom collections
   - Profiles: Include your analysis profiles
   - Analysis Results: Include cached analysis
   - Text: Include extracted PDF text
   - PDFs: Include original PDFs (large file)
3. **Export** → .lens file downloads

### Import Bundle from Colleague
1. **Import Bundle** button
2. Select .lens file
3. Preview shows what will import
4. **Import**
5. Collections & profiles now available

### View Visualizations
1. **Visualizations** page
2. View available charts:
   - Keyword frequency (word cloud)
   - Domain distribution (pie chart)
   - Sentiment (bar chart)
   - Trends (line chart)
3. **Export** chart as image/PDF

### N-gram Analysis
1. **N-gram Analysis** page
2. (Optional) Select collection
3. Choose n-gram size (2, 3, 4 words)
4. Set minimum frequency threshold
5. **Analyze**
6. View most common phrases

### Make Profile Active
1. **Profiles** tab → Click profile
2. **Make Active** (star icon)
3. Profile's keywords now used by default

### Edit Collection
1. **Collections** tab → Click collection
2. **Add/Remove Documents**
3. **Update Description**
4. **Save**

### Delete Collection (or Profile)
1. **Collections** (or **Profiles**) tab
2. Click collection name
3. **Delete** button
4. Confirm

---

## Keyboard Shortcuts

| Mac | Windows | Action |
|-----|---------|--------|
| `⌘ N` | `Ctrl N` | New Project |
| `⌘ O` | `Ctrl O` | Open Project |
| `⌘ E` | `Ctrl E` | Export |
| `⌘ ,` | `Ctrl ,` | Settings |
| `⌘ /` | `Ctrl /` | Help |

---

## Common Questions

### Q: What's the difference between Collections and Profiles?

**Collections** = Document groups
- "EU Companies", "2023 Reports", "Climate Leaders"
- Groups which documents to analyze together

**Profiles** = Analysis settings
- "TCFD Focus", "GRI Full", "Energy Efficiency"
- Configures which keywords to search for

### Q: I have 50 PDFs to import. How long will it take?

About **1-2 seconds per PDF** (extraction). So 50 PDFs ≈ 1-2 minutes.

### Q: Can I modify a collection after creation?

Yes! Click collection → **Add/Remove Documents**

### Q: Can I share my project with a colleague?

Yes! **Export → Collections** (+ other options) → Share the .lens file → They **Import Bundle**

### Q: What if my PDF has scanned images (not extractable text)?

Current version only works with PDFs that have extractable text.
Workaround: Use OCR tool first, or contact admin about image extraction feature.

### Q: Can I have multiple active profiles?

No, only one profile is active per project.
But you can quickly switch by clicking a profile and making it active.

### Q: Do I need the backend for keyword search?

No! Local keyword search works offline.
Backend is only needed for sentiment analysis & domain mapping.

### Q: How large can my project be?

Tested with 1000+ documents. Performance degrades but still usable.
For large projects, use collections to subset documents during analysis.

### Q: Can I export individual documents?

Not yet. You can export keyword search results or full project bundles.

---

## Error Messages & Solutions

| Error | Solution |
|-------|----------|
| "Backend Offline" | Check Settings → Test Connection, or proceed with local features |
| "No results found" | Verify keywords in Settings, check collection filter, review original PDF |
| "PDF not available" | Check file path, re-import if missing, or use text-only import |
| "Database locked" | Close other instances of app, restart |
| "Import failed" | Verify .lens file is valid, check disk space, restart app |
| "Comparison won't start" | Ensure you selected 2 different collections with documents |

---

## Data Storage

### Where is my data stored?

**Local database**: `~/Library/Application Support/document-lens/document-lens.db` (Mac)

Or use Settings → Data Management → **Open Database Folder**

### What gets synced to cloud?

Nothing! All data stays on your machine.

### Can I backup my data?

Yes! Copy the database file. Or Export a .lens bundle.

### Can I migrate to another computer?

Yes! Copy the database file to new computer, or Export .lens + Import.

---

## Performance Tips

### Speed Up Large Projects

1. **Use collections**: Don't search all 1000 documents, search a 50-doc collection
2. **Disable unused domains**: Fewer domains = faster analysis
3. **Limit keyword count**: 20 keywords searches faster than 200
4. **Clear cache**: Settings → Data Management → May help if running slow

### Reduce File Size When Exporting

1. Export without PDFs (often 80% of file size)
2. Export without extracted text (if not needed)
3. Exclude analysis results (regenerate on import)
4. Use zipped .lens format

---

## Collaboration Templates

### Share-Ready Bundle (Colleague Download)

```
Export with:
✓ Collections
✓ Profiles
✓ Analysis Results
✓ Extracted Text
✗ PDFs (save bandwidth)
```

File size: Typically 5-50 MB

### Full Reproducibility (Academic/Publication)

```
Export with:
✓ Collections
✓ Profiles
✓ Analysis Results
✓ Extracted Text
✓ PDFs
```

File size: Can be 500 MB+ (include size warning)

### Configuration Only (Share Settings)

```
Export with:
✓ Collections
✓ Profiles
✗ Analysis Results
✗ Extracted Text
✗ PDFs
```

File size: Typically < 1 MB

---

## Terminology Cheat Sheet

| Term | Means | Example |
|------|-------|---------|
| Project | Top-level container | "Climate Survey 2024" |
| Collection | Subset of documents | "EU Companies" |
| Profile | Analysis configuration | "TCFD Focus" |
| Framework | Research standard | TCFD, GRI, SDGs, SASB |
| Domain | Subject area | Governance, Strategy, Risk, Metrics |
| Bundle | .lens ZIP file | "climate-survey-v2.lens" |
| Semantic | AI analysis (needs backend) | Sentiment, domain mapping |
| Keyword Search | Text matching (local) | Find "net zero" mentions |
| N-gram | Common phrase | "climate risk" is a 2-gram |

---

## Settings Menu Guide

| Setting | Purpose |
|---------|---------|
| **Backend URL** | API endpoint for sentiment/domain analysis |
| **Test Connection** | Verify backend is reachable |
| **Database Location** | Where your data is stored locally |
| **Data Stats** | How many projects/documents/analyses |
| **Country List** | Available countries for document metadata |
| **Industry List** | Available industries for document metadata |
| **Clear All Data** | ⚠️ Delete everything - use carefully |

---

## File Formats Explained

### .lens (Bundle)
- **What**: ZIP file with collections, profiles, documents
- **Size**: 1 MB - 1 GB (depending on options)
- **Use**: Share with colleagues, backup, reproducibility
- **Opened by**: Document Lens (Import Bundle)

### .csv (Spreadsheet)
- **What**: Comma-separated values
- **Size**: Small
- **Use**: Excel analysis, data science workflows
- **Opened by**: Excel, Python, R, etc.

### .json (Data)
- **What**: Structured text format
- **Size**: Medium
- **Use**: API integration, custom tools
- **Opened by**: Any text editor, programmatically

### .pdf (Report)
- **What**: Formatted document
- **Size**: Medium
- **Use**: Sharing findings, printing
- **Opened by**: PDF reader

---

## Workflow Decision Tree

```
START: What do you want to do?

├─→ Analyze one collection?
│   └─→ Keyword Search (local, fast)
│       └─→ View results, export CSV
│
├─→ Analyze across time?
│   └─→ Create yearly collections
│       └─→ Keyword Search each
│           └─→ Compare results
│
├─→ Compare two groups?
│   └─→ Create collections for each group
│       └─→ Comparative Analysis (sentiment, keywords, domains)
│           └─→ Visualize differences
│
├─→ Share with colleague?
│   └─→ Export bundle
│       └─→ Share .lens file
│           └─→ They Import Bundle
│
├─→ Understand language patterns?
│   └─→ N-gram Analysis
│       └─→ Visualize common phrases
│
├─→ Research frameworks?
│   └─→ Create profiles (TCFD, GRI, SASB, SDGs)
│       └─→ Activate each profile
│           └─→ Keyword Search with each
│
└─→ Need semantic analysis?
    └─→ Check Backend URL in Settings
        └─→ Sentiment + Domain Mapping available
```

---

## When to Use Each Feature

| Task | Use | Time |
|------|-----|------|
| Quick scan of documents | Keyword Search | 5 min |
| Find trends over time | Multiple collections + comparisons | 15 min |
| Understand peer practices | Create collections per company, compare | 20 min |
| Share findings | Export bundle | 5 min |
| Deep linguistic analysis | N-gram Analysis | 10 min |
| Multi-dimensional view | Visualizations | 5 min |
| Reproducible research | Profile + Bundle + Documentation | 30 min |
| Academic paper | Full workflow with version control | 1+ hour |

---

## Accessibility & Support

### Built-in Help
- **Settings** page: About section with links
- **Repository**: GitHub for issues/feature requests
- **Keyboard shortcuts**: Cmd/Ctrl + / for quick help

### Reporting Issues
1. Note error message
2. Note steps to reproduce
3. Go to [GitHub Issues](https://github.com/michaelborck-education/document-lens-desktop/issues)
4. Click **New Issue**
5. Describe problem

### Getting Help
- Check USER-GUIDE.md for detailed explanations
- Check ANALYSIS-WORKFLOWS.md for examples
- Check DOCUMENT-LENS-COLLABORATION.md for backend/sharing info

---

## Pro Tips

### Tip 1: Use Profiles for Different Lenses
Create multiple profiles per project:
- "TCFD Focus" - climate risks only
- "GRI Full" - all ESG
- "Governance Focus" - SASB governance

Switch between profiles quickly to see different perspectives.

### Tip 2: Collection Naming
Use consistent naming: `[Year]_[Region]_[Focus]`
- "2024_EU_Climate"
- "2024_APAC_Governance"
- "2024_Global_Energy"

### Tip 3: Export Patterns
- **Collaborate**: Export with Text, without PDFs
- **Backup**: Export with everything
- **Share settings**: Export Collections + Profiles only

### Tip 4: Pilot Approach
Before analyzing 500 documents:
1. Create test collection with 10 docs
2. Test profile on small subset
3. Verify results make sense
4. Scale to full dataset

### Tip 5: Documentation
Add notes in collection descriptions:
- "EU Companies" - "Includes all FTSE100 companies, 2024 reports"
- "Climate Leaders" - "Companies with net zero targets by 2030"

Help future-you (and colleagues) understand your methodology.

---

## Version Info

**Current Version**: Check Settings → About

**Changelog**: [GitHub Releases](https://github.com/michaelborck-education/document-lens-desktop/releases)

**Compatibility**: .lens bundles include app version for compatibility checks

---

*Last updated: January 2026*
