import { config as dotenvConfig } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Root of BLOG-AUTOMATION
export const ROOT_DIR = resolve(__dirname, '..');

// Load .env from project root
dotenvConfig({ path: resolve(ROOT_DIR, '.env') });

// Load config.json
const configPath = resolve(ROOT_DIR, 'config.json');
export const blogConfig = JSON.parse(readFileSync(configPath, 'utf-8'));

// Paths
export const CONTENT_DIR = resolve(ROOT_DIR, 'content');
export const BRIEFS_DIR = resolve(CONTENT_DIR, 'briefs');
export const DRAFTS_DIR = resolve(CONTENT_DIR, 'drafts');
export const REVIEW_DIR = resolve(CONTENT_DIR, 'review');
export const APPROVED_DIR = resolve(CONTENT_DIR, 'approved');
export const PUBLISHED_DIR = resolve(CONTENT_DIR, 'published');
export const TEMPLATES_DIR = resolve(CONTENT_DIR, 'templates');
export const OUTPUT_DIR = resolve(ROOT_DIR, 'output');
export const HTML_DIR = resolve(OUTPUT_DIR, 'html');
export const SOCIAL_DIR = resolve(OUTPUT_DIR, 'social');
export const EMAIL_DIR = resolve(OUTPUT_DIR, 'email');
export const REPORTS_DIR = resolve(OUTPUT_DIR, 'reports');
export const CALENDAR_DIR = resolve(ROOT_DIR, 'calendar');
export const DATA_DIR = resolve(ROOT_DIR, 'data');
export const TRACKER_PATH = resolve(DATA_DIR, 'blog-tracker.json');

// API Keys
export const WEBFLOW_API_KEY = process.env.WEBFLOW_API_KEY;
export const CMS_API_KEY = process.env.CMS_API_KEY;
export const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
export const FAL_KEY = process.env.FAL_KEY;
export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
export const OMNISEND_API_KEY = process.env.OMNISEND_API_KEY;
export const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID;
export const GSC_SITE_URL = process.env.GSC_SITE_URL;
export const GOOGLE_SERVICE_ACCOUNT_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;

// Export consolidated config object
export const config = {
  paths: {
    root: ROOT_DIR,
    content: CONTENT_DIR,
    briefs: BRIEFS_DIR,
    drafts: DRAFTS_DIR,
    review: REVIEW_DIR,
    approved: APPROVED_DIR,
    published: PUBLISHED_DIR,
    templates: TEMPLATES_DIR,
    output: OUTPUT_DIR,
    html: HTML_DIR,
    social: SOCIAL_DIR,
    email: EMAIL_DIR,
    reports: REPORTS_DIR,
    calendar: CALENDAR_DIR,
    data: DATA_DIR,
    tracker: TRACKER_PATH
  },
  env: {
    WEBFLOW_API_KEY,
    CMS_API_KEY,
    CLAUDE_API_KEY,
    OPENAI_API_KEY,
    FIRECRAWL_API_KEY,
    FAL_KEY,
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY,
    OMNISEND_API_KEY,
    GA_PROPERTY_ID,
    GSC_SITE_URL,
    GOOGLE_SERVICE_ACCOUNT_PATH
  },
  blog: blogConfig
};
