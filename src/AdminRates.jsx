import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';

export default function AdminRates() {
  const [packs, setPacks] = useState([]);
  const [values, setValues] = useState({});
  const [busy, setBusy] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { let active = true; supabase.from('packages').select('label,price_ngn,sort_order').order('sort_order').then(({ data, error: err }) => { if (!active) return; if (err) setError('Could not load prices.'); else { setPacks(data || []); setValues(Object.fromEntries((data || []).map(p => [p.label, String(p.price_ngn)]))); } }); return () => { active = false; }; }, []);
  async function save(pack) {
    const price = Number(values[pack.label]); setFeedback(''); setError('');
    if (!Number.isInteger(price) || price < 1 || price > 10000000) { setError('Enter a whole naira amount between ₦1 and ₦10,000,000.'); return; }
    if (!window.confirm(`Change ${pack.label} to ₦${price.toLocaleString('en-NG')}? Existing checkout quotes keep their original price.`)) return;
    setBusy(pack.label);
    const { data, error: err } = await supabase.from('packages').update({ price_ngn: price }).eq('label', pack.label).select('label,price_ngn').maybeSingle();
    setBusy('');
    if (err || !data) setError('Could not save the price. Please try again.');
    else { setPacks(items => items.map(p => p.label === pack.label ? { ...p, price_ngn: data.price_ngn } : p)); setFeedback(`${pack.label} price updated.`); }
  }
  return <details className="password-settings rates-settings"><summary>Manage pack prices <span>Edit rates ↓</span></summary><div className="rates-content"><p>New checkout quotes use these rates. Existing quotes keep the price shown to the buyer. Old versions of the site may still submit their original prices.</p>{error && <p className="admin-error" role="alert">{error}</p>}{feedback && <p className="admin-message" role="status">{feedback}</p>}<div className="rates-list">{packs.map(pack => <div className="rates-row" key={pack.label}><strong>{pack.label}</strong><label>₦ <input type="number" min="1" max="10000000" step="1" value={values[pack.label] ?? ''} onChange={e => setValues({ ...values, [pack.label]: e.target.value })} aria-label={`${pack.label} price in naira`}/></label><button type="button" disabled={!!busy || Number(values[pack.label]) === pack.price_ngn} onClick={() => save(pack)}>{busy === pack.label ? 'Saving...' : 'Save'}</button></div>)}</div></div></details>;
}
