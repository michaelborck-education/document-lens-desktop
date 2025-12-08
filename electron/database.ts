import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let db: Database.Database | null = null

const SCHEMA = `
-- Projects (collections of documents)
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Documents within projects
CREATE TABLE IF NOT EXISTS documents (
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
CREATE TABLE IF NOT EXISTS analysis_results (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    analysis_type TEXT NOT NULL,     -- readability, writing_quality, word_analysis, etc.
    results TEXT NOT NULL,           -- JSON blob from API
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Keyword lists (user-defined and framework presets)
CREATE TABLE IF NOT EXISTS keyword_lists (
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
CREATE TABLE IF NOT EXISTS keyword_results (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    keyword_list_id TEXT NOT NULL REFERENCES keyword_lists(id),
    selected_keywords TEXT,          -- JSON: keywords actually used (subset selection)
    results TEXT NOT NULL,           -- JSON: {keyword: {document_id: {count, contexts}}}
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- N-gram results (cached)
CREATE TABLE IF NOT EXISTS ngram_results (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    ngram_type INTEGER NOT NULL,     -- 2 for bigrams, 3 for trigrams
    filter_terms TEXT,               -- JSON: optional filter terms used
    results TEXT NOT NULL,           -- JSON: aggregated results
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Default country list (editable)
CREATE TABLE IF NOT EXISTS countries (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_default BOOLEAN DEFAULT TRUE
);

-- Default industry list (editable)
CREATE TABLE IF NOT EXISTS industries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    is_default BOOLEAN DEFAULT TRUE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_year ON documents(report_year);
CREATE INDEX IF NOT EXISTS idx_documents_company ON documents(company_name);
CREATE INDEX IF NOT EXISTS idx_analysis_document ON analysis_results(document_id);
CREATE INDEX IF NOT EXISTS idx_keyword_results_project ON keyword_results(project_id);
`

const DEFAULT_COUNTRIES = [
  { code: 'AR', name: 'Argentina' },
  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },
  { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EG', name: 'Egypt' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'GR', name: 'Greece' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'NO', name: 'Norway' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'PE', name: 'Peru' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RU', name: 'Russia' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'KR', name: 'South Korea' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TR', name: 'Turkey' },
  { code: 'AE', name: 'UAE' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'VN', name: 'Vietnam' }
]

const DEFAULT_INDUSTRIES = [
  { id: 'energy', name: 'Energy', category: 'Energy' },
  { id: 'materials', name: 'Materials', category: 'Materials' },
  { id: 'industrials', name: 'Industrials', category: 'Industrials' },
  { id: 'consumer_disc', name: 'Consumer Discretionary', category: 'Consumer' },
  { id: 'consumer_staples', name: 'Consumer Staples', category: 'Consumer' },
  { id: 'healthcare', name: 'Health Care', category: 'Health Care' },
  { id: 'financials', name: 'Financials', category: 'Financials' },
  { id: 'it', name: 'Information Technology', category: 'Technology' },
  { id: 'communication', name: 'Communication Services', category: 'Technology' },
  { id: 'utilities', name: 'Utilities', category: 'Utilities' },
  { id: 'real_estate', name: 'Real Estate', category: 'Real Estate' },
  { id: 'mining', name: 'Mining', category: 'Materials' },
  { id: 'oil_gas', name: 'Oil & Gas', category: 'Energy' },
  { id: 'automotive', name: 'Automotive', category: 'Industrials' },
  { id: 'aerospace', name: 'Aerospace & Defense', category: 'Industrials' },
  { id: 'banking', name: 'Banking', category: 'Financials' },
  { id: 'insurance', name: 'Insurance', category: 'Financials' },
  { id: 'retail', name: 'Retail', category: 'Consumer' },
  { id: 'transportation', name: 'Transportation', category: 'Industrials' },
  { id: 'agriculture', name: 'Agriculture', category: 'Consumer' }
]

export function initDatabase(): Database.Database {
  if (db) return db

  // Get user data directory
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'document-lens.db')

  // Ensure directory exists
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true })
  }

  console.log('Initializing database at:', dbPath)

  // Create database
  db = new Database(dbPath)
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON')
  
  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL')

  // Create schema
  db.exec(SCHEMA)

  // Seed default data if needed
  seedDefaultData(db)

  return db
}

function seedDefaultData(database: Database.Database) {
  // Check if countries are already seeded
  const countryCount = database.prepare('SELECT COUNT(*) as count FROM countries').get() as { count: number }
  
  if (countryCount.count === 0) {
    console.log('Seeding default countries...')
    const insertCountry = database.prepare('INSERT INTO countries (code, name, is_default) VALUES (?, ?, 1)')
    const insertMany = database.transaction((countries: typeof DEFAULT_COUNTRIES) => {
      for (const country of countries) {
        insertCountry.run(country.code, country.name)
      }
    })
    insertMany(DEFAULT_COUNTRIES)
  }

  // Check if industries are already seeded
  const industryCount = database.prepare('SELECT COUNT(*) as count FROM industries').get() as { count: number }
  
  if (industryCount.count === 0) {
    console.log('Seeding default industries...')
    const insertIndustry = database.prepare('INSERT INTO industries (id, name, category, is_default) VALUES (?, ?, ?, 1)')
    const insertMany = database.transaction((industries: typeof DEFAULT_INDUSTRIES) => {
      for (const industry of industries) {
        insertIndustry.run(industry.id, industry.name, industry.category)
      }
    })
    insertMany(DEFAULT_INDUSTRIES)
  }

  // Seed default settings
  const settingsCount = database.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number }
  
  if (settingsCount.count === 0) {
    console.log('Seeding default settings...')
    const insertSetting = database.prepare('INSERT INTO settings (key, value) VALUES (?, ?)')
    insertSetting.run('backend_url', 'http://localhost:8000')
    insertSetting.run('theme', 'system')
  }
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}
