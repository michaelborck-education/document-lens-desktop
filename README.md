# Document Lens Desktop

A cross-platform Electron desktop application for batch PDF analysis, designed primarily for sustainability researchers analyzing corporate annual reports.

## Overview

Document Lens Desktop enables researchers to:
- **Batch import** corporate annual report PDFs
- **Analyze** documents using pre-built sustainability framework keyword lists (TCFD, GRI, SDGs, SASB)
- **Search** across documents for keywords and n-grams
- **Compare** coverage across multiple frameworks
- **Visualize** trends over time with word clouds, heatmaps, and trend charts
- **Export** findings in CSV, Excel, and JSON formats

## Target Users

- Sustainability researchers analyzing corporate annual reports
- Non-technical users requiring simple installation
- Platform priority: Windows > Mac > Linux

## Features

### Core Features
- Project/collection management for organizing document batches
- Drag-and-drop PDF import with auto-metadata detection
- Pre-built keyword lists for TCFD (~68), SDGs (~412), GRI (~118), and SASB (~108) frameworks
- Custom keyword list creation with CSV import support
- Cross-document keyword search with context highlighting
- N-gram analysis (bigrams and trigrams)
- Cross-framework comparison with radar charts

### Visualizations
- Word clouds
- Keyword frequency bar charts
- Keywords x Documents heatmaps
- Year-over-year trend lines
- Framework comparison radar charts

### Data Management
- Local SQLite database for offline access to cached analysis
- Export to CSV, Excel, JSON, and full project ZIP bundles

## Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | Electron 28+ |
| Frontend | React 18 + TypeScript |
| UI Components | Shadcn/ui + Tailwind CSS |
| State Management | Zustand |
| Database | SQLite (better-sqlite3) |
| Charts | Recharts |
| Word Cloud | react-wordcloud |
| Build | electron-builder |
| Auto-update | electron-updater |

## Development

### Prerequisites
- Node.js 20+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Build for production
npm run build
```

### Project Structure

```
document-lens-desktop/
├── electron/           # Main process (Electron)
│   ├── main.ts
│   ├── preload.ts
│   ├── backend-manager.ts
│   └── database.ts
├── src/               # Renderer process (React)
│   ├── components/
│   ├── pages/
│   ├── stores/
│   ├── services/
│   └── data/frameworks/
├── resources/         # App icons
└── build/            # Build configuration
```

## Backend

This application connects to the [document-lens](https://github.com/yourusername/document-lens) API backend for text extraction and analysis. The backend can be:
- Run locally during development
- Bundled with the desktop app for distribution

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please read the implementation plan in `IMPLEMENTATION_PLAN.md` for details on the development roadmap.
