import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { supabase } from './supabase';

const statusLabels = { awaiting_transfer: 'Waiting for transfer details', pending_review: 'Waiting for payment review', paid: 'Payment confirmed, waiting for delivery', delivered: 'Delivered', cancelled: 'Cancelled' };
export default function Tracking() {
  const [reference, setReference] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function find(event) {
    event.preventDefault(); setResult(null); setError('');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reference.trim())) { setError('Enter the full order reference from checkout.'); return; }
    setBusy(true);
    const { data, error: err } = await supabase.rpc('get_order_status', { p_order_id: reference.trim() });
    setBusy(false);
    if (err) setError('Could not check this order. Please try again.');
    else if (!data?.length) setError('No order found. Check the reference and try again.');
    else setResult(data[0]);
  }
  return <section className="tracking-section wrap" id="track"><div className="tracking-card"><div><span className="eyebrow">CHECK YOUR ORDER</span><h2>Where are my funds?</h2><p>Enter the order reference you saved at checkout. Keep it private, anyone with it can see the order status.</p></div><form onSubmit={find}><label htmlFor="tracking-reference">Order reference</label><div className="tracking-row"><input id="tracking-reference" value={reference} onChange={e => setReference(e.target.value)} placeholder="Paste your order reference" autoComplete="off" required/><button className="button primary" disabled={busy}>{busy ? 'Checking...' : 'Check status'} <ArrowRight size={17}/></button></div>{error && <p className="error" role="alert">{error}</p>}{result && <div className="tracking-result" role="status"><small>ORDER STATUS</small><strong>{statusLabels[result.status] || 'Please contact support'}</strong><span>{result.package_label} game funds · ₦{Number(result.price_ngn).toLocaleString('en-NG')}</span>{result.status === 'awaiting_transfer' && <span>If you have paid but have not submitted your sender details, contact support with this reference.</span>}</div>}</form></div></section>;
}
