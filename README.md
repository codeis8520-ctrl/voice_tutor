# 2026 AI Voice English Tutor MVP

This is a production-ready AI Voice Tutoring platform built with Next.js 15, Vapi, Groq, and Supabase.

## 🚀 Key Features
- **Ultra-Low Latency (<500ms)**: Direct WebRTC streaming from browser to AI (Groq + Cartesia).
- **No Physical Phone Required**: Pure browser-based voice interaction (Microphone).
- **Contextual Memory (RAG)**: Automatically injects past conversation context and grammar mistakes.
- **Post-Call Analytics**: Full transcript, summary, and grammar correction stored in Supabase.

## 🛠 Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Voice Orchestration**: [Vapi](https://vapi.ai)
- **LLM**: Groq (Llama 3.3 70B)
- **TTS**: Cartesia (Sonic)
- **Database**: Supabase (PostgreSQL)
- **Telephony**: Twilio (connected via Vapi)

## 📦 Setup Instructions

### 1. Database Setup
1. Create a new project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** and run the contents of `./supabase/schema.sql`.
3. Obtain your `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.

### 2. Vapi & Voice Setup
1. Create an account on [Vapi](https://vapi.ai).
2. Go to **Phone Numbers** and import your Twilio number or buy one.
3. Note your `VAPI_API_KEY` and the `VAPI_PHONE_NUMBER_ID`.
4. (Optional) In Vapi Assistant settings, ensure you have an analysis prompt that returns structured JSON for grammar mistakes if you want automatic tracking.

### 3. Environment Variables
1. Copy `.env.example` to `.env.local`.
2. Fill in the keys from Supabase and Vapi.

### 4. Running the App
```bash
npm install
npm run dev
```

## 📂 Project Structure
- `/src/lib/vapi.ts`: Vapi server-side integration.
- `/src/prompts/system-prompt.ts`: The 'Warm Tutor' persona definition.
- `/src/app/api/call/outbound/route.ts`: API to trigger calls.
- `/src/app/api/webhook/vapi/route.ts`: Post-call analytics processor.
- `/src/app/page.tsx`: Premium dashboard UI.

## 📝 Post-Call Analysis Configuration
To make the analytics work, configure your Vapi Assistant with an **Analysis Plan**:
- **Structured Data Schema**: 
  ```json
  {
    "grammar_errors": [
      { "original": "string", "corrected": "string", "explanation": "string" }
    ]
  }
  ```
This will allow the webhook to automatically populate the `learner_mistakes` table.
