-- supabase/schema.sql
-- Run this in your Supabase SQL Editor

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  phone_number TEXT UNIQUE, -- format: +1234567890
  language_level TEXT CHECK (language_level IN ('beginner', 'intermediate', 'advanced')),
  study_goal TEXT,
  preferred_timezone TEXT DEFAULT 'UTC',
  preferred_call_time TIME, -- HH:MM:SS
  call_days TEXT[], -- e.g. ['monday', 'wednesday', 'friday']
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Conversations Table (Main history)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  vapi_call_id TEXT UNIQUE,
  status TEXT DEFAULT 'scheduled', -- scheduled, in-progress, completed, failed
  transcript TEXT,
  summary TEXT,
  grammar_feedback JSONB, -- Array of { original, corrected, explanation }
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Contextual Memory (Facts for RAG)
CREATE TABLE IF NOT EXISTS public.contextual_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL, -- e.g. "User likes to talk about soccer."
  memory_type TEXT CHECK (memory_type IN ('preference', 'topic', 'weakness')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Learner Mistakes (Specific grammar/vocab issues)
CREATE TABLE IF NOT EXISTS public.learner_mistakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  original_text TEXT,
  corrected_text TEXT,
  explanation TEXT,
  mastery_score FLOAT DEFAULT 0.0, -- Used for spaced repetition or priority
  last_practiced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contextual_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_mistakes ENABLE ROW LEVEL SECURITY;
