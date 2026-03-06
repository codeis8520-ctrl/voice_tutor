// src/lib/vapi.ts
import { VapiClient } from '@vapi-ai/server-sdk';

// Initialize the Vapi Client (backend only)
const vapiApiKey = process.env.VAPI_API_KEY;

if (!vapiApiKey) {
    process.env.VAPI_API_KEY && console.warn('VAPI_API_KEY is not defined in environment variables.');
}

export const vapi = new VapiClient({
    token: vapiApiKey || 'placeholder_vapi_token',
});

// Outbound Call Configuration
export async function createOutboundCall(phoneNumber: string, assistantConfig: any) {
    try {
        const call = await vapi.calls.create({
            assistantId: assistantConfig.assistantId, // If using a pre-configured assistant
            // OR define transient assistant inline
            assistant: {
                model: {
                    provider: 'groq',
                    model: 'llama-3.3-70b-versatile', // or 'llama3-70b-8192' or specify OpenAI
                    messages: [
                        {
                            role: 'system',
                            content: assistantConfig.systemPrompt,
                        },
                    ],
                    temperature: 0.7,
                },
                voice: {
                    provider: 'cartesia',
                    voiceId: 'a0e99855-b139-437e-a67f-27f9712b8443', // Default Cartesia voice
                },
                transcriber: {
                    provider: 'deepgram',
                    model: 'nova-2',
                    language: 'en-US',
                },
                name: 'AI Tutor - English',
                firstMessage: assistantConfig.firstMessage || "Hi there! I'm your English tutor. Let's practice!",
            },
            customer: {
                number: phoneNumber,
            },
            phoneNumberId: assistantConfig.phoneNumberId, // Twilio or Vapi-purchased number
        });

        return { success: true, data: call };
    } catch (error: any) {
        console.error('Vapi Call Creation Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Event Handler Template for Webhooks
 * Vapi can send POST requests to your server when calls start, end, or during the call.
 */
export async function handleVapiWebhook(payload: any) {
    const { message } = payload;

    switch (message.type) {
        case 'call.started':
            console.log('Call started:', message.call.id);
            // Update DB -> conversation status: 'in-progress'
            break;
        case 'call.ended':
            console.log('Call ended:', message.call.id);
            // Process transcript -> trigger analysis
            break;
        case 'transcript':
            // Real-time transcript processing if needed
            break;
        case 'analysis':
            // Post-call analysis from Vapi
            break;
        default:
            console.log('Unhandled Vapi event:', message.type);
    }
}
