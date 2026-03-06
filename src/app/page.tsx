// src/app/page.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import Vapi from '@vapi-ai/web';
import './globals.css';

// Initialize Vapi SDK (Public Key should be in .env)
const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || 'your_public_key_here');

export default function Home() {
  const [callStatus, setCallStatus] = useState<'idle' | 'loading' | 'active'>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    vapi.on('call-start', () => setCallStatus('active'));
    vapi.on('call-end', () => setCallStatus('idle'));
    vapi.on('speech-start', () => setIsSpeaking(true));
    vapi.on('speech-end', () => setIsSpeaking(false));
    vapi.on('error', (e) => {
      console.error('Vapi Error Full Object:', e);
      setCallStatus('idle');

      let errorDisplay = 'Unknown error';
      if (typeof e === 'string') {
        errorDisplay = e;
      } else if (e.message) {
        errorDisplay = e.message;
      } else if (e.type === 'device-error') {
        errorDisplay = 'Microphone access denied or not found. Please check permissions.';
      } else if (e.type) {
        errorDisplay = `Error Type: ${e.type}`;
      }

      setMessage(errorDisplay);
    });

    return () => {
      vapi.stop();
    };
  }, []);

  const startTutorSession = async () => {
    setCallStatus('loading');
    setMessage('');

    try {
      // 1. Get dynamic config from backend (with RAG/Persona)
      const res = await fetch('/api/assistant/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: 'default-profile-uuid' }),
      });
      const assistantConfig = await res.json();

      if (assistantConfig.error) throw new Error(assistantConfig.error);

      // 2. Start WebRTC session
      await vapi.start(assistantConfig);
    } catch (err: any) {
      setCallStatus('idle');
      setMessage(err.message);
    }
  };

  const stopSession = () => {
    vapi.stop();
  };

  return (
    <main className="container">
      <header className="header">
        <div className="logo">Antigravity AI Tutor</div>
        <div className="status-badge" style={{
          background: callStatus === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.2)',
          color: callStatus === 'active' ? '#10b981' : '#94a3b8'
        }}>
          {callStatus === 'active' ? '● Session Live' : '○ Standby'}
        </div>
      </header>

      <section className="grid" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="card" style={{ width: '100%', maxWidth: '600px', textAlign: 'center' }}>
          <h2>WebRTC AI English Tutor</h2>
          <p style={{ color: '#94a3b8', margin: '1rem 0 2rem' }}>
            전화 통화 없이 브라우저에서 바로 음성으로 대화하세요. <br />
            마이크를 통해 초저지연 AI 튜터와 연습할 수 있습니다.
          </p>

          <div style={{ position: 'relative', height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {/* Voice Visualizer Mockup */}
            <div className={`visualizer ${callStatus === 'active' ? 'active' : ''} ${isSpeaking ? 'speaking' : ''}`}>
              {/* Animated Rings */}
              <div className="ring ring-1"></div>
              <div className="ring ring-2"></div>
              <div className="ring ring-3"></div>
              <div className="center-icon">🎙️</div>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            {callStatus === 'idle' && (
              <button className="button" onClick={startTutorSession}>
                Practice with AI Tutor
              </button>
            )}
            {callStatus === 'loading' && (
              <button className="button micro-animation" disabled>
                Connecting...
              </button>
            )}
            {callStatus === 'active' && (
              <button className="button" style={{ background: '#ef4444' }} onClick={stopSession}>
                End Session
              </button>
            )}
          </div>

          {message && <p style={{ marginTop: '1rem', color: '#f87171' }}>{message}</p>}
        </div>

        <div className="card" style={{ width: '100%', maxWidth: '600px', marginTop: '1.5rem' }}>
          <h3>Session Details</h3>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
            장치: Browser Microphone <br />
            기술: WebRTC (Secure Streaming) <br />
            엔진: LLama 3.3 (Groq) <br />
          </p>
        </div>
      </section>

      <style jsx>{`
        .visualizer {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--primary);
          display: flex;
          justify-content: center;
          align-items: center;
          transition: all 0.5s ease;
          position: relative;
        }
        .visualizer.active {
          background: var(--accent);
          box-shadow: 0 0 20px var(--accent);
        }
        .visualizer.speaking .ring {
          animation: ring-pulse 1.5s infinite ease-out;
        }
        .center-icon {
          font-size: 2rem;
          z-index: 2;
        }
        .ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 2px solid var(--accent);
          border-radius: 50%;
          opacity: 0;
        }
        @keyframes ring-pulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .ring-2 { animation-delay: 0.5s !important; }
        .ring-3 { animation-delay: 1s !important; }
      `}</style>
    </main>
  );
}
