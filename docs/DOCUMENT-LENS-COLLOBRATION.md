  Conceptual Model ✅

  You're correct:
  - Virtual Collections = research workspaces within a project
  - Researchers import PDFs → create collections → analyze within collections → compare across collections
  - The goal is reproducible research and collaboration without infrastructure

  Bundle Strategy (Tiered Approach)

  .lens Bundle (ZIP file)
  ├── manifest.json              # Version, project info, what's included
  ├── collections/               # Collection definitions
  │   └── [collection-id].json   # Name, description, document IDs
  ├── profiles/                  # Analysis profiles (Research Lens)
  │   └── [profile-id].json      # Keywords, domains, preferences
  ├── documents/                 # Document metadata + optional layers
  │   └── [doc-id].json          # Metadata, hash, optional: text, analysis
  └── pdfs/                      # OPTIONAL - original PDF files
      └── [filename].pdf

  Export Options (user chooses):
  ┌────────────────────┬────────┬─────────────────────────────────────────────┬─────────────────────────────────┐
  │       Option       │  Size  │                  Contains                   │            Use Case             │
  ├────────────────────┼────────┼─────────────────────────────────────────────┼─────────────────────────────────┤
  │ Metadata Only      │ Tiny   │ Collections, profiles, doc metadata, hashes │ Share configuration/setup       │
  ├────────────────────┼────────┼─────────────────────────────────────────────┼─────────────────────────────────┤
  │ + Analysis Results │ Small  │ Above + cached analysis results             │ Share findings                  │
  ├────────────────────┼────────┼─────────────────────────────────────────────┼─────────────────────────────────┤
  │ + Extracted Text   │ Medium │ Above + full text                           │ Replicate analysis without PDFs │
  ├────────────────────┼────────┼─────────────────────────────────────────────┼─────────────────────────────────┤
  │ + PDF Files        │ Large  │ Everything                                  │ Complete reproducibility        │
  └────────────────────┴────────┴─────────────────────────────────────────────┴─────────────────────────────────┘
  PDF Deduplication Strategy ✅

  This now works because we fixed the hash to be content-based!

  Same PDF file → Same SHA-256 hash → regardless of machine/path

  Import Flow:
  For each document in bundle:
    1. Check: Does hash exist in local project?
       → YES: Link to existing document (skip import)
       → NO: Continue...

    2. Check: Is PDF included in bundle?
       → YES: Import PDF + metadata
       → NO: Continue...

    3. Check: Is text included in bundle?
       → YES: Import as "text-only" document
              Mark: pdf_status = "not_available"
              User can still view text and analysis
       → NO: Import metadata only
              Mark: pdf_status = "not_available"
              Limited functionality (can't re-analyze)

  For "PDF not found" documents:
  - Show indicator in UI: "PDF not available locally"
  - User can:
    - Manually locate/import the PDF
    - Request from bundle creator
    - Continue with text-only analysis (if text was included)

  Collaboration Workflow ✅

  Researcher A                          Researcher B
      │                                      │
      ├── Imports PDFs                       │
      ├── Creates collections                │
      ├── Sets up analysis profile           │
      ├── Runs analysis                      │
      │                                      │
      ├── Exports .lens bundle ──────────────┼──→ Downloads bundle
      │   (with text, without PDFs)          │
      │                                      ├── Imports bundle
      │                                      │   (PDFs matched by hash OR
      │                                      │    runs with text-only)
      │                                      ├── Views/verifies analysis
      │                                      ├── Creates new collection
      │                                      ├── Different analysis profile
      │                                      │
      │   ←──────────────────────────────────┼── Exports their .lens bundle
      │                                      │
      ├── Imports bundle                     │
      ├── Sees B's collections + findings    │
      └── Both apps now "in sync"            │

  Large Bundle Warning

  When exporting with PDFs:
  - Calculate total size before export
  - If > 100MB: Show warning with size estimate
  - Suggest "Export without PDFs" option
  - Progress bar during export

  What This Enables

  1. Reproducible Research: Share exact analysis setup
  2. Paper Supplements: Publish .lens bundle alongside paper
  3. Team Collaboration: Share findings without cloud infrastructure
  4. Privacy Preserved: No central server, no login required
  5. Version Compatible: manifest.json includes app version for compatibility checks
