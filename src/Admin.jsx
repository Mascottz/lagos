import React, { useEffect, useState } from 'react';
import { ArrowLeft, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import { supabase } from './supabase';

const labels = { pending_review: 'Pending review', paid: 'Payment confirmed', delivered: 'Delivered', cancelled: 'Cancelled' };
const money = amount => `₦${Number(amount).toLocaleString('en-NG')}`;

export default function Admin() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('admin@funds4lagoslife.com');
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => { if (alive) { setSession(data.session); setChecking(false); } });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, current) => { if (alive) setSession(current); });
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    let alive = true;
    setIsAdmin(false); setOrders([]); setError(''); setMessage('');
    if (!session) return;
    setChecking(true);
    supabase.from('admin_users').select('user_id').eq('user_id', session.user.id).maybeSingle().then(({ data, error: err }) => {
      if (!alive) return;
      if (err) setError('Could not check admin access. Please try again.');
      else if (!data) setError('This account does not have admin access.');
      else setIsAdmin(true);
      setChecking(false);
    });
    return () => { alive = false; };
  }, [session?.user?.id]);

  async function loadOrders() {
    setBusy(true); setError('');
    const { data, error: err } = await supabase.from('orders').select('id,created_at,username,package_label,price_ngn,sender_name,transfer_reference,status').order('created_at', { ascending: false }).limit(500);
    if (err) setError('Could not load orders. Try refreshing.'); else setOrders(data || []);
    setBusy(false);
  }
  useEffect(() => { if (isAdmin) loadOrders(); }, [isAdmin]);
  async function login(e) {
    e.preventDefault(); setBusy(true); setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) setError('Could not sign in. Check your email and password.');
    setPassword(''); setBusy(false);
  }
  async function updateStatus(order, status) {
    if (status === order.status) return;
    if (status === 'paid' && !window.confirm('Have you verified this exact payment in OPay?')) return;
    if (status === 'delivered' && !window.confirm('Have you sent the game funds to this player?')) return;
    setBusy(true); setError(''); setMessage('');
    const { data, error: err } = await supabase.from('orders').update({ status }).eq('id', order.id).select('id,status').maybeSingle();
    if (err || !data) setError('Could not update the order. Please refresh and try again.');
    else { setOrders(items => items.map(item => item.id === order.id ? { ...item, status: data.status } : item)); setMessage('Order status updated.'); }
    setBusy(false);
  }
  async function logout() { await supabase.auth.signOut(); setSession(null); }
  const filtered = filter === 'all' ? orders : orders.filter(order => order.status === filter);

  return <div className="admin-page"><header className="admin-header"><a href="/" className="admin-brand"><span>f4</span> Funds4LagosLife</a><a href="/" className="admin-back"><ArrowLeft size={16}/> Back to shop</a></header>
    {checking ? <div className="admin-loading">Checking access...</div> : !session ? <main className="admin-login"><div className="admin-login-icon"><ShieldCheck size={25}/></div><span className="admin-eyebrow">FOR THE SHOP OWNER</span><h1>Welcome back.</h1><p>Sign in to review orders and keep track of deliveries.</p><form onSubmit={login}><label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" placeholder="you@example.com"/></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" placeholder="Your password"/></label>{error && <p className="admin-error" role="alert">{error}</p>}<button disabled={busy} className="admin-primary">{busy ? 'Signing in...' : 'Sign in to admin'}</button></form><small>Only accounts approved by the shop owner can access orders.</small></main> : !isAdmin ? <main className="admin-login"><div className="admin-login-icon"><ShieldCheck size={25}/></div><h1>Access not available.</h1><p role="alert">{error || 'This account does not have admin access.'}</p><button className="admin-primary" onClick={logout}>Sign out</button></main> : <main className="admin-content"><div className="admin-title-row"><div><span className="admin-eyebrow">YOUR SHOP, IN ONE PLACE</span><h1>Orders desk <span>✳</span></h1><p>Review payments and keep track of deliveries.</p></div><div className="admin-actions"><button onClick={loadOrders} disabled={busy}><RefreshCw size={16}/> Refresh</button><button onClick={logout}><LogOut size={16}/> Sign out</button></div></div><div className="admin-warning"><strong>Check OPay first.</strong> An order is not proof of payment. Verify the amount and sender in OPay before marking it paid or sending game funds.</div><div className="admin-stats"><div><span>ORDERS LOADED</span><strong>{orders.length}</strong><small>Most recent 500 orders</small></div><div><span>NEEDS REVIEW</span><strong>{orders.filter(o => o.status === 'pending_review').length}</strong><small>Check these payments</small></div><div><span>READY TO SEND</span><strong>{orders.filter(o => o.status === 'paid').length}</strong><small>Payment marked confirmed</small></div><div><span>DELIVERED</span><strong>{orders.filter(o => o.status === 'delivered').length}</strong><small>Marked as sent</small></div></div><div className="admin-list-head"><div><h2>Your orders</h2><p>Newest orders first. Refresh to check for new ones.</p></div><label>Show <select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All orders</option>{Object.entries(labels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label></div>{error && <p className="admin-error" role="alert">{error}</p>}{message && <p className="admin-message" role="status">{message}</p>}<div className="admin-orders">{busy && !orders.length ? <p className="admin-empty">Loading orders...</p> : !filtered.length ? <p className="admin-empty">No orders here yet.</p> : filtered.map(order => <article className="admin-order" key={order.id}><div className="admin-order-top"><div><span className="order-date">{new Date(order.created_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Lagos' })} WAT</span><h3>@{order.username}</h3></div><span className={`status status-${order.status}`}>{labels[order.status] || order.status}</span></div><div className="order-details"><div><small>PACK</small><strong>{order.package_label} game funds</strong></div><div><small>AMOUNT</small><strong>{money(order.price_ngn)}</strong></div><div><small>SENDER NAME</small><strong>{order.sender_name}</strong></div><div><small>TRANSFER REFERENCE</small><strong>{order.transfer_reference || 'Not provided'}</strong></div><div className="order-id"><small>ORDER ID</small><strong>{order.id}</strong></div></div><div className="order-footer"><span>Update after checking payment or delivery.</span><label>Status <select value={order.status} disabled={busy} onChange={e => updateStatus(order, e.target.value)}>{Object.entries(labels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label></div></article>)}</div></main>}
  </div>;
}
