'use client';
import { useEffect, useState } from 'react';

interface ForwardContract {
  label: string;
  price: number | null;
  note?: string;
}

interface ForwardsData {
  months: ForwardContract[];
  aggregates: ForwardContract[];
}

export default function ForwardsWidget() {
  const [data, setData] = useState<ForwardsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/forwards')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const fmt = (p: number | null) =>
    p != null ? p.toFixed(3) : 'N/A';

  return (
    <div style={{
      background: 'var(--card-bg, #0d1117)',
      border: '1px solid var(--border, #21262d)',
      borderRadius: '12px',
      padding: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{ fontSize: '16px' }}>📈</span>
        <h2 style={{ margin: 0, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted, #8b949e)', textTransform: 'uppercase' }}>
          TTF FORWARD CURVE
        </h2>
        <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-muted, #8b949e)' }}>EUR/MWh · ICE via Yahoo</span>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted, #8b949e)', fontSize: '13px' }}>Loading…</p>
      ) : (
        <>
          {/* Monthly contracts */}
          <div style={{ marginBottom: '16px' }}>
            <p style={{ margin: '0 0 8px', fontSize: '10px', color: 'var(--text-muted, #8b949e)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Monthly</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {data?.months.map(({ label, price }) => {
                const isNA = price == null;
                return (
                  <div key={label} style={{
                    background: 'var(--card-inner-bg, #161b22)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    border: '1px solid var(--border, #21262d)',
                  }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted, #8b949e)', marginBottom: '4px', fontWeight: 600 }}>{label}</div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      color: isNA ? '#8b949e' : price! < 35 ? '#58a6ff' : '#3fb950',
                    }}>
                      {fmt(price)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Aggregate contracts */}
          <div>
            <p style={{ margin: '0 0 8px', fontSize: '10px', color: 'var(--text-muted, #8b949e)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Aggregates</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {data?.aggregates.map(({ label, price, note }) => {
                const isNA = price == null;
                return (
                  <div key={label} style={{
                    background: 'var(--card-inner-bg, #161b22)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    border: '1px solid var(--border, #21262d)',
                  }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted, #8b949e)', marginBottom: '2px', fontWeight: 600 }}>{label}</div>
                    {note && <div style={{ fontSize: '9px', color: '#6e7681', marginBottom: '4px' }}>{note}</div>}
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      color: isNA ? '#8b949e' : price! < 35 ? '#58a6ff' : '#3fb950',
                    }}>
                      {fmt(price)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
