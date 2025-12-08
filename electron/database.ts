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

// Framework keyword data embedded directly (from src/data/frameworks/*.json)
interface FrameworkData {
  id: string
  name: string
  description: string
  list_type: string
  keywords: Record<string, string[]>
}

const FRAMEWORK_KEYWORDS: FrameworkData[] = [
  {
    id: 'tcfd',
    name: 'TCFD - Climate-related Financial Disclosures',
    description: "Keywords aligned with TCFD's four pillars for climate-related financial risk disclosure. The Task Force on Climate-related Financial Disclosures provides recommendations for companies to report on climate-related risks and opportunities.",
    list_type: 'grouped',
    keywords: {
      "Governance": ["board oversight", "climate governance", "management role", "climate committee", "board responsibility", "governance structure", "executive compensation", "climate expertise", "board composition", "climate oversight", "management accountability", "climate leadership", "sustainability committee", "risk committee", "board-level review", "management processes"],
      "Strategy": ["climate risks", "physical risks", "transition risks", "climate opportunities", "scenario analysis", "2 degree pathway", "1.5 degree", "net zero", "climate strategy", "decarbonization", "low carbon", "climate resilience", "stranded assets", "carbon transition", "business model resilience", "climate scenarios", "strategic planning", "long-term risks", "medium-term risks", "short-term risks", "climate-related opportunities", "resource efficiency", "energy source", "new products", "new markets", "acute risks", "chronic risks", "policy risks", "legal risks", "technology risks", "market risks", "reputation risks"],
      "Risk Management": ["risk identification", "risk assessment", "climate risk integration", "materiality", "risk mitigation", "climate risk management", "enterprise risk", "risk processes", "risk framework", "climate risk exposure", "risk monitoring", "due diligence", "supply chain risk", "operational risk", "financial planning risk", "risk appetite"],
      "Metrics and Targets": ["scope 1", "scope 2", "scope 3", "ghg emissions", "greenhouse gas", "carbon intensity", "emission targets", "carbon neutral", "carbon footprint", "science based targets", "emission reduction", "carbon offset", "climate metrics", "energy consumption", "renewable energy percentage", "water usage", "waste metrics", "carbon pricing", "internal carbon price", "emissions intensity", "absolute emissions", "target baseline", "progress against targets"]
    }
  },
  {
    id: 'sdgs',
    name: 'UN Sustainable Development Goals',
    description: 'Keywords for the 17 UN Sustainable Development Goals adopted in 2015 as part of the 2030 Agenda for Sustainable Development. These goals provide a shared blueprint for peace and prosperity for people and the planet.',
    list_type: 'grouped',
    keywords: {
      "SDG 1 - No Poverty": ["poverty", "poverty eradication", "extreme poverty", "poverty line", "social protection", "economic resources", "basic services", "financial inclusion", "microfinance", "vulnerable", "income equality", "wealth distribution", "quality of life", "developing countries", "disadvantaged", "poor and vulnerable", "resources", "social protection systems"],
      "SDG 2 - Zero Hunger": ["hunger", "food security", "malnutrition", "sustainable agriculture", "agricultural productivity", "food production", "crop diversity", "genetic diversity", "resilient agriculture", "small-scale food producers", "rural infrastructure", "food gap", "food reserves", "nutrition", "nutritious", "undernourished", "stunting", "wasting", "trade restrictions"],
      "SDG 3 - Good Health and Well-being": ["health", "wellbeing", "well-being", "mortality", "life expectancy", "universal health coverage", "mental health", "occupational health", "workplace safety", "disease prevention", "health services", "employee health", "maternal mortality", "child mortality", "neonatal mortality", "communicable diseases", "non-communicable diseases", "road traffic accidents", "substance abuse", "reproductive health", "vaccines", "health workforce", "air pollution health", "water contamination"],
      "SDG 4 - Quality Education": ["education", "training", "skills development", "lifelong learning", "vocational training", "literacy", "equal education", "inclusive education", "scholarships", "teacher training", "workforce development", "early childhood development", "primary education", "secondary education", "technical education", "numeracy", "gender equality education", "education for sustainable development", "school enrollment"],
      "SDG 5 - Gender Equality": ["gender equality", "women empowerment", "empower women", "equal opportunities", "discrimination", "women in leadership", "gender parity", "equal pay", "workplace equality", "diversity", "inclusion", "women's rights", "female representation", "violence against women", "gender-based violence", "female genital mutilation", "forced marriage", "unpaid care work", "reproductive rights", "sexual harassment", "women in management"],
      "SDG 6 - Clean Water and Sanitation": ["clean water", "water access", "sanitation", "water quality", "water efficiency", "wastewater", "water treatment", "water scarcity", "water management", "water stewardship", "water recycling", "freshwater", "water conservation", "drinking water", "hygiene", "open defecation", "water-related ecosystems", "water harvesting", "transboundary water", "water pollution", "aquifer", "groundwater"],
      "SDG 7 - Affordable and Clean Energy": ["renewable energy", "clean energy", "energy efficiency", "solar energy", "solar power", "wind energy", "wind power", "sustainable energy", "energy access", "modern energy", "green energy", "low carbon energy", "energy transition", "fossil fuel", "hydroelectric", "hydropower", "geothermal", "biofuel", "bioenergy", "energy infrastructure", "clean fuel", "energy research", "battery storage", "energy intensity", "electricity access"],
      "SDG 8 - Decent Work and Economic Growth": ["economic growth", "decent work", "employment", "job creation", "labor rights", "labour rights", "safe work", "productive employment", "youth employment", "forced labor", "forced labour", "child labor", "child labour", "modern slavery", "living wage", "fair wages", "working conditions", "sustainable economic growth", "gdp growth", "economic productivity", "resource efficiency", "full employment", "equal pay for equal work", "migrant workers", "workers rights", "unemployment"],
      "SDG 9 - Industry Innovation and Infrastructure": ["innovation", "infrastructure", "industrialization", "sustainable infrastructure", "research and development", "r&d", "technology", "manufacturing", "resilient infrastructure", "industrial processes", "clean technologies", "digitalization", "internet access", "broadband", "information technology", "small-scale industries", "value addition", "industrial diversification", "technology transfer", "scientific research"],
      "SDG 10 - Reduced Inequalities": ["inequality", "inequalities", "equal opportunity", "social inclusion", "discrimination", "income inequality", "social protection", "migration", "migrants", "inclusion", "accessibility", "marginalized groups", "vulnerable populations", "fiscal policy", "wage policy", "developing countries representation", "remittances", "safe migration", "orderly migration", "income growth", "reduce disparities"],
      "SDG 11 - Sustainable Cities and Communities": ["sustainable cities", "urban development", "affordable housing", "public transport", "public transportation", "urban planning", "resilient cities", "air quality", "green spaces", "public spaces", "waste management", "sustainable urbanization", "smart cities", "cultural heritage", "natural heritage", "disaster resilience", "slums", "informal settlements", "urban sprawl", "sustainable buildings", "green buildings", "urban air pollution", "municipal waste"],
      "SDG 12 - Responsible Consumption and Production": ["sustainable consumption", "sustainable production", "resource efficiency", "circular economy", "waste reduction", "recycling", "sustainable sourcing", "product lifecycle", "sustainable procurement", "food waste", "food loss", "chemical management", "sustainable packaging", "eco-design", "extended producer responsibility", "sustainable practices", "sustainability reporting", "sustainable tourism", "fossil fuel subsidies", "material footprint", "domestic material consumption", "hazardous chemicals", "waste generation", "reuse", "reduce"],
      "SDG 13 - Climate Action": ["climate change", "climate action", "carbon emissions", "greenhouse gas", "ghg", "global warming", "climate adaptation", "climate mitigation", "climate resilience", "carbon reduction", "emission reduction", "paris agreement", "climate risk", "extreme weather", "sea level rise", "decarbonization", "net zero", "carbon neutral", "climate strategy", "climate finance", "climate education", "climate policy", "nationally determined contributions", "ndc", "climate hazards", "climate disasters", "low-carbon", "climate-related", "temperature rise", "cop", "unfccc"],
      "SDG 14 - Life Below Water": ["ocean", "oceans", "marine", "marine conservation", "ocean acidification", "sustainable fisheries", "marine pollution", "coral reef", "coral bleaching", "coastal ecosystems", "marine biodiversity", "overfishing", "illegal fishing", "plastic pollution", "ocean health", "marine resources", "fish stocks", "aquaculture", "marine protected areas", "blue economy", "ocean governance", "marine debris", "sea"],
      "SDG 15 - Life on Land": ["biodiversity", "deforestation", "forest", "forests", "land degradation", "ecosystem", "ecosystems", "conservation", "habitat", "habitats", "endangered species", "reforestation", "afforestation", "sustainable forestry", "sustainable forest management", "land use", "soil degradation", "protected areas", "wildlife", "invasive species", "desertification", "drought", "terrestrial ecosystems", "mountain ecosystems", "wetlands", "biodiversity loss", "poaching", "wildlife trafficking", "genetic resources", "species extinction"],
      "SDG 16 - Peace Justice and Strong Institutions": ["governance", "transparency", "accountability", "anti-corruption", "corruption", "bribery", "rule of law", "human rights", "ethical business", "whistleblower", "compliance", "fair business practices", "justice", "inclusive institutions", "effective institutions", "accountable institutions", "violence reduction", "abuse", "exploitation", "trafficking", "organized crime", "illicit financial flows", "arms trafficking", "torture", "access to justice", "legal identity", "fundamental freedoms", "public access to information"],
      "SDG 17 - Partnerships for the Goals": ["partnership", "partnerships", "collaboration", "stakeholder engagement", "public-private partnership", "multi-stakeholder", "knowledge sharing", "capacity building", "technology transfer", "international cooperation", "development assistance", "oda", "foreign direct investment", "fdi", "debt sustainability", "trade", "global partnership", "south-south cooperation", "north-south cooperation", "policy coherence", "data monitoring", "statistical capacity"]
    }
  },
  {
    id: 'gri',
    name: 'GRI - Global Reporting Initiative Standards',
    description: "Keywords aligned with GRI Universal, Economic (200 series), Environmental (300 series), and Social (400 series) Standards. GRI provides the world's most widely used standards for sustainability reporting.",
    list_type: 'grouped',
    keywords: {
      "Economic (GRI 200)": ["economic performance", "economic value generated", "economic value distributed", "revenue", "operating costs", "employee wages", "employee benefits", "payments to providers of capital", "payments to government", "community investments", "market presence", "local hiring", "senior management local", "minimum wage", "indirect economic impacts", "infrastructure investments", "services supported", "significant indirect impacts", "procurement practices", "local suppliers", "spending on local suppliers", "anti-corruption", "corruption risk assessment", "corruption training", "confirmed corruption incidents", "anti-competitive behavior", "legal actions anti-competitive", "anti-trust", "monopoly practices", "tax", "tax payments by country", "tax governance"],
      "Environmental (GRI 300)": ["materials", "materials used", "raw materials", "recycled input materials", "reclaimed products", "energy", "energy consumption", "energy intensity", "energy reduction", "renewable energy", "water", "water withdrawal", "water discharge", "water consumption", "water stress areas", "water recycled", "water reused", "biodiversity", "operational sites biodiversity", "protected areas", "significant biodiversity impacts", "habitats protected", "habitats restored", "iucn red list", "conservation list species", "emissions", "direct ghg emissions", "scope 1 emissions", "indirect ghg emissions", "scope 2 emissions", "other indirect emissions", "scope 3 emissions", "ghg emissions intensity", "ghg reduction", "ozone-depleting substances", "nitrogen oxides", "nox", "sulfur oxides", "sox", "particulate matter", "air emissions", "waste", "waste generated", "waste by type", "hazardous waste", "non-hazardous waste", "waste diverted", "waste recycled", "waste composted", "waste disposed", "waste to landfill", "waste incinerated", "effluents", "water discharge quality", "spills", "significant spills", "environmental compliance", "environmental fines", "environmental sanctions", "supplier environmental assessment", "new suppliers environmental criteria"],
      "Social (GRI 400)": ["employment", "new employee hires", "employee turnover", "benefits", "full-time employees", "part-time employees", "temporary employees", "parental leave", "return to work", "labor management relations", "collective bargaining", "collective agreements", "minimum notice period", "occupational health and safety", "occupational health management", "hazard identification", "risk assessment", "worker training health", "occupational health services", "worker health promotion", "work-related injuries", "work-related ill health", "work-related fatalities", "recordable injuries", "lost time injuries", "training and education", "training hours", "employee training", "skills management", "career development", "performance reviews", "diversity and equal opportunity", "diversity of governance bodies", "diversity of employees", "gender diversity", "age diversity", "minority groups", "equal remuneration", "pay equity", "gender pay gap", "non-discrimination", "discrimination incidents", "freedom of association", "collective bargaining rights", "child labor", "child labor risk", "young workers", "forced or compulsory labor", "forced labor risk", "security practices", "security personnel trained", "human rights", "human rights training", "human rights assessment", "human rights screening", "rights of indigenous peoples", "indigenous rights", "free prior informed consent", "local communities", "community engagement", "community impact assessment", "local community programs", "supplier social assessment", "new suppliers social criteria", "negative social impacts supply chain", "public policy", "political contributions", "lobbying", "customer health and safety", "product health safety assessment", "product safety incidents", "marketing and labeling", "product information", "marketing communications", "customer privacy", "customer data breaches", "data protection", "socioeconomic compliance", "non-compliance fines"]
    }
  },
  {
    id: 'sasb',
    name: 'SASB - Sustainability Accounting Standards',
    description: "Keywords across SASB's five sustainability dimensions. SASB Standards identify the sustainability-related risks and opportunities most likely to affect a company's financial condition and operating performance. Now maintained by the ISSB (International Sustainability Standards Board).",
    list_type: 'grouped',
    keywords: {
      "Environment": ["ghg emissions", "greenhouse gas emissions", "scope 1 emissions", "scope 2 emissions", "scope 3 emissions", "carbon emissions", "air quality", "air emissions", "air pollutants", "criteria pollutants", "energy management", "energy consumption", "energy efficiency", "grid electricity", "renewable energy", "water management", "water withdrawal", "water consumption", "water discharge", "water stress", "water recycling", "waste management", "hazardous waste", "non-hazardous waste", "waste disposal", "waste diversion", "ecological impacts", "biodiversity impacts", "land use", "habitat", "environmental incidents", "spills", "releases", "remediation", "environmental compliance"],
      "Social Capital": ["human rights", "human rights policy", "community relations", "community engagement", "community investment", "access and affordability", "product access", "customer welfare", "customer satisfaction", "customer privacy", "data security", "data breach", "cybersecurity", "personal data", "fair marketing", "responsible marketing", "product labeling", "fair disclosure", "selling practices", "responsible lending", "financial inclusion", "financial literacy"],
      "Human Capital": ["labor practices", "fair labor", "employee health", "employee safety", "workplace safety", "occupational health", "employee engagement", "employee satisfaction", "diversity and inclusion", "workforce diversity", "gender diversity", "ethnic diversity", "equal opportunity", "employee development", "training", "talent management", "talent retention", "compensation and benefits", "fair compensation", "benefits", "collective bargaining", "labor relations", "union relations", "labor disputes", "workforce management"],
      "Business Model and Innovation": ["product lifecycle", "lifecycle management", "lifecycle assessment", "product design", "design for environment", "packaging lifecycle", "sustainable packaging", "product end-of-life", "materials sourcing", "raw materials", "sustainable materials", "supply chain management", "supply chain standards", "supplier code of conduct", "responsible sourcing", "conflict minerals", "physical supply chain", "supply chain resilience", "business model resilience", "climate adaptation", "resource scarcity", "critical materials", "materials efficiency", "product innovation", "sustainable innovation"],
      "Leadership and Governance": ["business ethics", "ethical conduct", "code of conduct", "competitive behavior", "anti-competitive practices", "antitrust", "regulatory compliance", "legal compliance", "regulatory capture", "critical incident", "crisis management", "risk management", "enterprise risk", "systemic risk management", "governance", "corporate governance", "board oversight", "board independence", "executive compensation", "incentive alignment", "lobbying", "political contributions", "political spending", "corruption", "bribery", "anti-corruption", "management of legal environment", "policy influence"]
    }
  }
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

  // Seed framework keyword lists
  const keywordListCount = database.prepare('SELECT COUNT(*) as count FROM keyword_lists WHERE is_builtin = 1').get() as { count: number }
  
  if (keywordListCount.count === 0) {
    console.log('Seeding framework keyword lists...')
    const insertKeywordList = database.prepare(
      `INSERT INTO keyword_lists (id, name, description, framework, list_type, keywords, is_builtin)
       VALUES (?, ?, ?, ?, ?, ?, 1)`
    )
    const insertMany = database.transaction((frameworks: typeof FRAMEWORK_KEYWORDS) => {
      for (const framework of frameworks) {
        const id = `builtin-${framework.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        insertKeywordList.run(
          id,
          framework.name,
          framework.description,
          framework.id,
          framework.list_type,
          JSON.stringify(framework.keywords)
        )
        console.log(`  Seeded: ${framework.name}`)
      }
    })
    insertMany(FRAMEWORK_KEYWORDS)
    console.log(`Seeded ${FRAMEWORK_KEYWORDS.length} framework keyword lists`)
  } else {
    console.log(`Framework keyword lists already seeded (${keywordListCount.count} found)`)
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
