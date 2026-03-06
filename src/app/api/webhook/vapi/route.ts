// src/app/api/webhook/vapi/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Supabase environment variables are missing.' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    try {
        const payload = await req.json();
        const { message } = payload;

        if (!message) return NextResponse.json({ status: 'ok' });

        console.log('Received Vapi Webhook:', message.type);

        switch (message.type) {
            case 'end-of-call-report': {
                const { call, summary, transcript, analysis } = message;
                const callId = call.id;

                // 1. Update Conversation Record
                const { data: conversation } = await supabase
                    .from('conversations')
                    .update({
                        status: 'completed',
                        ended_at: new Date().toISOString(),
                        duration_seconds: call.duration || 0,
                        transcript: transcript,
                        summary: summary,
                    })
                    .eq('vapi_call_id', callId)
                    .select('profile_id')
                    .single();

                if (conversation) {
                    // 2. Extract Grammar Feedback if analysis exists
                    // This assumes your Vapi analysis prompt is configured to return JSON
                    if (analysis && analysis.structuredData) {
                        const { grammar_errors } = analysis.structuredData;

                        if (Array.isArray(grammar_errors)) {
                            const mistakes = grammar_errors.map((err: any) => ({
                                profile_id: conversation.profile_id,
                                original_text: err.original,
                                corrected_text: err.corrected,
                                explanation: err.explanation,
                            }));

                            await supabase.from('learner_mistakes').insert(mistakes);

                            // 3. Add to contextual memory for future RAG
                            await supabase.from('contextual_memory').insert({
                                profile_id: conversation.profile_id,
                                content: `In the last session, we focused on correcting: ${grammar_errors.map((e: any) => e.original).join(', ')}`,
                                memory_type: 'weakness'
                            });
                        }
                    }
                }
                break;
            }

            default:
                // Handle other event types like 'call.started' if needed
                break;
        }

        return NextResponse.json({ status: 'success' });
    } catch (error: any) {
        console.error('Webhook processing failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
