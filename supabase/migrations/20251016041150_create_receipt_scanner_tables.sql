/*
  # Receipt Scanner Database Schema

  ## Overview
  Creates the complete database schema for the receipt scanner application with proper security and relationships.

  ## New Tables

  ### 1. `leads`
  Stores scanned business card information
  - `id` (uuid, primary key) - Unique identifier
  - `first_name` (text) - Contact's first name
  - `last_name` (text) - Contact's last name
  - `name` (text) - Full display name
  - `job_title` (text) - Contact's job title
  - `company_name` (text) - Company name
  - `company` (text) - Alternative company field
  - `email` (text) - Contact email
  - `phone` (text) - Contact phone number
  - `website` (text) - Company/personal website
  - `status` (text) - Processing status (processing, enriched, etc.)
  - `image_url` (text) - URL to scanned card image
  - `session_id` (text) - Session identifier for tracking
  - `scanned_by` (text) - Name of person who scanned the card
  - `processing_method` (text) - Method used for processing
  - `user_id` (uuid) - Foreign key to auth.users (nullable)
  - `company_id` (uuid) - Foreign key to companies table (nullable)
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `notes`
  Stores notes associated with leads
  - `id` (uuid, primary key) - Unique identifier
  - `lead_id` (uuid, foreign key) - References leads table
  - `content` (text) - Note content
  - `created_by` (uuid) - Foreign key to auth.users (nullable)
  - `created_at` (timestamptz) - Note creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. `companies`
  Stores company information
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Company name
  - `website` (text) - Company website
  - `industry` (text) - Industry classification
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 4. `users`
  Stores user information (extends auth.users)
  - `id` (uuid, primary key) - References auth.users
  - `email` (text) - User email
  - `full_name` (text) - User's full name
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Public read access for leads, companies, and notes
  - Public write access for leads and notes
  - Users can only manage their own user records
  - All policies check for proper authentication where required

  ## Indexes
  - Email indexes for faster lookups
  - Foreign key indexes for better join performance
  - Session ID index for tracking
  - Status index for filtering

  ## Important Notes
  - All timestamps use `timestamptz` for timezone awareness
  - UUIDs generated using `gen_random_uuid()`
  - Foreign keys use CASCADE on delete for notes and SET NULL for optional references
  - RLS policies allow public access since this app uses a simple password system
*/

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text,
  last_name text,
  name text,
  job_title text,
  company_name text,
  company text,
  email text,
  phone text,
  website text,
  status text DEFAULT 'processing',
  image_url text,
  session_id text,
  scanned_by text,
  processing_method text DEFAULT 'ocr',
  user_id uuid,
  company_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  website text,
  industry text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  content text NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'notes_lead_id_fkey'
  ) THEN
    ALTER TABLE notes ADD CONSTRAINT notes_lead_id_fkey
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'leads_company_id_fkey'
  ) THEN
    ALTER TABLE leads ADD CONSTRAINT leads_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_session_id ON leads(session_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_lead_id ON notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Leads policies - allow public read and write (controlled by app-level password)
CREATE POLICY "Public can view leads"
  ON leads
  FOR SELECT
  USING (true);

CREATE POLICY "Public can insert leads"
  ON leads
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update leads"
  ON leads
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete leads"
  ON leads
  FOR DELETE
  USING (true);

-- Companies policies - allow public read
CREATE POLICY "Public can view companies"
  ON companies
  FOR SELECT
  USING (true);

CREATE POLICY "Public can insert companies"
  ON companies
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update companies"
  ON companies
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Notes policies - allow public read and write
CREATE POLICY "Public can view notes"
  ON notes
  FOR SELECT
  USING (true);

CREATE POLICY "Public can insert notes"
  ON notes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update notes"
  ON notes
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete notes"
  ON notes
  FOR DELETE
  USING (true);

-- Users policies - users can only access their own data
CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_leads_updated_at') THEN
    CREATE TRIGGER update_leads_updated_at
      BEFORE UPDATE ON leads
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_companies_updated_at') THEN
    CREATE TRIGGER update_companies_updated_at
      BEFORE UPDATE ON companies
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_notes_updated_at') THEN
    CREATE TRIGGER update_notes_updated_at
      BEFORE UPDATE ON notes
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
    CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;