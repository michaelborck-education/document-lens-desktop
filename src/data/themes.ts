// Research themes - each theme bundles related keyword frameworks
// for specific research domains

export interface Theme {
  id: string
  name: string
  description: string
  icon: string // Lucide icon name
  color: string // Tailwind color class
}

export const THEMES: Theme[] = [
  {
    id: 'sustainability',
    name: 'Sustainability',
    description: 'ESG reporting, climate disclosures, and sustainable development frameworks (TCFD, GRI, SDGs, SASB)',
    icon: 'Leaf',
    color: 'text-green-600'
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    description: 'Security frameworks, compliance standards, and threat analysis (NIST CSF, ISO 27001, CIS Controls)',
    icon: 'Shield',
    color: 'text-blue-600'
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Financial analysis, regulatory compliance, and risk management (SEC, GAAP, Basel III)',
    icon: 'TrendingUp',
    color: 'text-amber-600'
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Clinical research, regulatory submissions, and healthcare compliance (FDA, HIPAA, Clinical Trials)',
    icon: 'Heart',
    color: 'text-red-600'
  },
  {
    id: 'legal',
    name: 'Legal',
    description: 'Contract analysis, regulatory language, and compliance review',
    icon: 'Scale',
    color: 'text-purple-600'
  },
  {
    id: 'academic',
    name: 'Academic Research',
    description: 'Research methodology, literature review, and scholarly analysis',
    icon: 'GraduationCap',
    color: 'text-indigo-600'
  },
  {
    id: 'project-management',
    name: 'Project Management',
    description: 'Agile, PMBOK, and project documentation analysis',
    icon: 'ClipboardList',
    color: 'text-orange-600'
  },
  {
    id: 'general',
    name: 'General',
    description: 'No pre-loaded frameworks - start with custom keywords only',
    icon: 'FileText',
    color: 'text-gray-600'
  }
]

export const DEFAULT_THEME = 'sustainability'

export function getTheme(id: string): Theme | undefined {
  return THEMES.find(t => t.id === id)
}

export function getThemeFrameworks(themeId: string): string[] {
  // Map theme IDs to their framework IDs
  const themeFrameworks: Record<string, string[]> = {
    'sustainability': ['tcfd', 'gri', 'sdgs', 'sasb'],
    'cybersecurity': ['nist-csf', 'iso-27001', 'cis-controls', 'mitre-attack'],
    'finance': ['financial-ratios', 'sec-regulations', 'basel-iii', 'risk-metrics'],
    'healthcare': ['clinical-trials', 'fda-regulations', 'hipaa', 'medical-terminology'],
    'legal': ['contract-terms', 'regulatory-language', 'legal-clauses', 'compliance-keywords'],
    'academic': ['research-methods', 'statistical-terms', 'literature-review', 'citation-analysis'],
    'project-management': ['agile-scrum', 'pmbok', 'risk-management', 'resource-planning'],
    'general': []
  }
  return themeFrameworks[themeId] || []
}
