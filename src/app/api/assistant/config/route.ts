// src/app/api/assistant/config/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SYSTEM_PROMPT } from '@/prompts/system-prompt';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Supabase environment variables are missing.' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    try {
        const { profileId } = await req.json();

        // 1. Fetch Profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', profileId || 'default-profile-uuid')
            .single();

        // 2. Fetch Memory (RAG)
        const { data: memoryItems } = await supabase
            .from('contextual_memory')
            .select('content')
            .eq('profile_id', profileId || 'default-profile-uuid')
            .order('created_at', { ascending: false })
            .limit(5);

        const memoryContext = memoryItems?.map((m: any) => `- ${m.content}`).join('\n');

        // 3. Compile Prompt
        const systemPrompt = SYSTEM_PROMPT(
            profile?.full_name || 'Student',
            profile?.language_level || 'intermediate',
            profile?.study_goal || 'conversational English',
            memoryContext || ''
        );

        // 4. Return Assistant DTO for Web SDK
        return NextResponse.json({
            name: 'AI English Tutor (Production)',
            model: {
                provider: 'groq',
                model: 'llama3-70b-8192',
                messages: [{ role: 'system', content: systemPrompt }],
                temperature: 0.7,
                maxTokens: 500,
            },
            voice: {
                provider: 'cartesia',
                voiceId: 'a0e99855-b139-437e-a67f-27f9712b8443', // Susan in Cartesia
            },
            transcriber: {
                provider: 'deepgram',
                model: 'nova-2',
                language: 'en-US',
            },
            firstMessage: `Hi ${profile?.full_name || 'there'}! I'm Antigravity, your English tutor. Ready to practice?`,
            recordingEnabled: true,
            interruptible: true,
            fillerWordsEnabled: true,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
