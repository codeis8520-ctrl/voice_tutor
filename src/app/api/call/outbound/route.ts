// src/app/api/call/outbound/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { vapi, createOutboundCall } from '@/lib/vapi';
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

        if (!profileId) {
            return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
        }

        // 1. Fetch Profile Data
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', profileId)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // 2. Fetch Relevant Contextual Memory (RAG)
        // We fetch the last 5 memory items to inject as context
        const { data: memoryItems } = await supabase
            .from('contextual_memory')
            .select('content')
            .eq('profile_id', profileId)
            .order('created_at', { ascending: false })
            .limit(5);

        const memoryContext = memoryItems?.map((m: any) => `- ${m.content}`).join('\n');

        // 3. Compile System Prompt
        const systemPrompt = SYSTEM_PROMPT(
            profile.full_name || 'Student',
            profile.language_level || 'intermediate',
            profile.study_goal || 'conversational English',
            memoryContext || ''
        );

        const phoneNumber = profile.phone_number;
        const vapiPhoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;

        if (!phoneNumber) {
            return NextResponse.json({ error: 'Phone number not set for this profile' }, { status: 400 });
        }

        if (!vapiPhoneNumberId) {
            return NextResponse.json({ error: 'System configuration error: VAPI_PHONE_NUMBER_ID is not set' }, { status: 500 });
        }

        // 4. Trigger Outbound Call via Vapi
        const callResult = await createOutboundCall(phoneNumber, {
            systemPrompt,
            firstMessage: `Hi ${profile.full_name}! This is Antigravity, your English tutor. I'm calling to practice with you. How's your day going?`,
            phoneNumberId: vapiPhoneNumberId,
        });

        if (!callResult.success) {
            return NextResponse.json({ error: callResult.error }, { status: 500 });
        }

        // 5. Log the call initiation in DB
        const { error: logError } = await supabase.from('conversations').insert({
            profile_id: profileId,
            vapi_call_id: (callResult.data as any).id,
            status: 'scheduled',
            started_at: new Date().toISOString(),
        });

        if (logError) {
            console.error('Failed to log conversation initiation:', logError);
        }

        return NextResponse.json({
            message: 'Call initiated successfully',
            callId: (callResult.data as any).id,
        });
    } catch (err: any) {
        console.error('API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
