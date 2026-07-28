'use client';
import { useEffect, useState } from 'react';
import { HEALTH_URL } from '@/config';

const BOOT_MESSAGES = [
  'Waking up servers…',
  'Loading AI models…',
  'Connecting to database…',
  'Almost ready…',
];

type Status = 'booting' | 'ready';

export default function StartupModal() {
  const [visible, setVisible] = useState(true);
  const [status, setStatus] = useState<Status>('booting');
  const [msgIndex, setMsgIndex] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (status !== 'booting') return;
    const t = setInterval(() => setMsgIndex((i) => (i + 1) % BOOT_MESSAGES.length), 2000);
    return () => clearInterval(t);
  }, [status]);

  useEffect(() => {
    if (status !== 'booting') return;
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? '' : d + '.')), 400);
    return () => clearInterval(t);
  }, [status]);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(HEALTH_URL, { cache: 'no-store' });
        if (cancelled) return;
        if (res.ok) {
          setStatus('ready');
          setTimeout(() => setVisible(false), 900);
          return;
        }
      } catch {
        // server not up yet — retry
      }
      if (!cancelled) setTimeout(check, 3000);
    };

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(10,10,12,0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: '#1c1c1e',
          borderRadius: '28px',
          padding: '44px 52px',
          width: '100%',
          maxWidth: '420px',
          margin: '0 16px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          textAlign: 'center',
          border: '1px solid #2c2c34',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 900,
              color: '#ffffff',
              flexShrink: 0,
            }}
          >
            E
          </div>
          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.5px',
                lineHeight: 1,
              }}
            >
              EduAI
            </div>
            <div style={{ fontSize: '11px', color: '#555a6a', marginTop: '3px', letterSpacing: '0.02em' }}>
              AI-Powered Learning Platform
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: '#2c2c34', marginBottom: '28px' }} />

        {status === 'booting' ? (
          <>
            {/* Spinner */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: '3px solid #2c2c34',
                  borderTopColor: '#7c3aed',
                  animation: 'spin 0.75s linear infinite',
                }}
              />
            </div>

            <h2
              style={{
                fontSize: '17px',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.3px',
                marginBottom: '8px',
              }}
            >
              Starting up (Please wait 1-2 minutes)
            </h2>

            <p
              style={{
                fontSize: '13px',
                color: '#555a6a',
                minHeight: '20px',
              }}
            >
              {BOOT_MESSAGES[msgIndex]}
              {dots}
            </p>

            {/* Pulse dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '24px' }}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#7c3aed',
                    display: 'inline-block',
                    animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#2e1a5e',
                border: '1px solid #7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '20px',
                color: '#a78bfa',
              }}
            >
              ✓
            </div>
            <h2
              style={{
                fontSize: '17px',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.3px',
                marginBottom: '6px',
              }}
            >
              Ready!
            </h2>
            <p style={{ fontSize: '13px', color: '#555a6a' }}>Taking you to the app…</p>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.55); opacity: 0.35; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
