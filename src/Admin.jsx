import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ClipboardList, LogOut, RefreshCw, ShieldCheck, WalletCards } from 'lucide-react';
import { supabase } from './supabase';
import AdminRates from './AdminRates';

const labels = { awaiting_transfer: 'Awaiting transfer details', pending_review: 'Pending review', paid: 'Payment confirmed', delivered: 'Delivered', cancelled: 'Cancelled' };
const money = amount => `₦${Number(amount).toLocaleString('en-NG')}`;

export default function Admin() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
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

  async function loadOrders(term = searchTerm) {
    setBusy(true); setError('');
    let query = supabase.from('orders').select('id,created_at,username,package_label,price_ngn,sender_name,transfer_reference,status,quoted_at').order('created_at', { ascending: false }).limit(500);
    if (term) { const value = term.trim().replace(/^@/, ''); if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) query = query.eq('id', value); else query = query.ilike('username', `%${value.replace(/[\\%_]/g, '\\$&')}%`); }
    const { data, error: err } = await query;
    if (err) setError('Could not load orders. Try refreshing.');
    else if (!data?.length && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(term.trim())) {
      const { data: quotes, error: quoteError } = await supabase.rpc('admin_get_unsubmitted_quote', { p_quote_id: term.trim() });
      if (quoteError) setError('Could not check this checkout reference.');
      else setOrders((quotes || []).map(q => ({ ...q, quoted_at: q.created_at, status: 'awaiting_transfer', quoteOnly: true })));
    } else setOrders(data || []);
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
    {checking ? <div className="admin-loading">Checking access...</div> : !session ? <main className="admin-login-layout"><section className="admin-login"><div className="admin-login-icon"><ShieldCheck size={25}/></div><span className="admin-eyebrow">FOR THE SHOP OWNER</span><h1>Welcome back.</h1><p>Sign in to review orders and keep track of deliveries.</p><form onSubmit={login}><label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" placeholder="you@example.com"/></label><label htmlFor="login-password">Password</label><div className="password-input"><input id="login-password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" placeholder="Your password"/><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide" : "Show"}</button></div>{error && <p className="admin-error" role="alert">{error}</p>}<button disabled={busy} className="admin-primary">{busy ? 'Signing in...' : 'Sign in to admin'}</button></form><div className="admin-login-foot"><ShieldCheck size={16}/><small>Only approved accounts can access this page.</small></div></section><aside className="admin-welcome" aria-label="About the order desk"><div className="welcome-top"><span>THE OWNER'S CORNER</span><span>✳</span></div><div className="welcome-copy"><div className="welcome-spark">✳</div><h2>All your orders.<br/><em>One easy spot.</em></h2><p>Your little corner of Lagos Life. Keep an eye on every order and get back to the game.</p></div><div className="welcome-list"><div><span className="welcome-icon"><ClipboardList size={18}/></span><div><strong>See new orders</strong><small>All the details, in one place</small></div><ArrowRight size={17}/></div><div><span className="welcome-icon"><WalletCards size={18}/></span><div><strong>Keep track of payments</strong><small>Review, confirm, then deliver</small></div><Check size={17}/></div></div><div className="welcome-bottom">FUNDS4LAGOSLIFE <span>✳ &nbsp; MADE FOR YOUR GAME</span></div></aside></main> : !isAdmin ? <main className="admin-login admin-access-denied"><div className="admin-login-icon"><ShieldCheck size={25}/></div><h1>Access not available.</h1><p role="alert">{error || 'This account does not have admin access.'}</p><button className="admin-primary" onClick={logout}>Sign out</button></main> : <main className="admin-content"><div className="admin-title-row"><div><span className="admin-eyebrow">YOUR SHOP, IN ONE PLACE</span><h1>Orders desk <span>✳</span></h1><p>Review payments and keep track of deliveries.</p></div><div className="admin-actions"><button onClick={() => loadOrders()} disabled={busy}><RefreshCw size={16}/> Refresh</button><button onClick={logout}><LogOut size={16}/> Sign out</button></div></div><PasswordSettings email={session.user.email}/><AdminRates/><div className="admin-warning"><strong>Check OPay first.</strong> An order is not proof of payment. Verify the amount and sender in OPay before marking it paid or sending game funds.</div><div className="admin-stats"><div><span>ORDERS LOADED</span><strong>{orders.length}</strong><small>Most recent 500 orders</small></div><div><span>NEEDS REVIEW</span><strong>{orders.filter(o => o.status === 'pending_review').length}</strong><small>Check these payments</small></div><div><span>READY TO SEND</span><strong>{orders.filter(o => o.status === 'paid').length}</strong><small>Payment marked confirmed</small></div><div><span>DELIVERED</span><strong>{orders.filter(o => o.status === 'delivered').length}</strong><small>Marked as sent</small></div></div><div className="admin-list-head"><div><h2>Your orders</h2><p>Newest first, up to 500 results. Search by username or full order ID.</p></div><label>Show <select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All orders</option>{Object.entries(labels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label></div><form className="admin-search" onSubmit={e => { e.preventDefault(); const term = searchInput.trim(); setSearchTerm(term); loadOrders(term); }}><label htmlFor="order-search">Find an order</label><div><input id="order-search" value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Username or full order ID"/><button disabled={busy}>Search</button>{searchTerm && <button type="button" onClick={() => {setSearchInput(''); setSearchTerm(''); loadOrders('');}}>Clear</button>}</div></form>{error && <p className="admin-error" role="alert">{error}</p>}{message && <p className="admin-message" role="status">{message}</p>}<div className="admin-orders">{busy && !orders.length ? <p className="admin-empty">Loading orders...</p> : !filtered.length ? <p className="admin-empty">No orders here yet.</p> : filtered.map(order => <article className="admin-order" key={order.id}><div className="admin-order-top"><div><span className="order-date">{new Date(order.created_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Lagos' })} WAT</span><h3>@{order.username}</h3></div><span className={`status status-${order.status}`}>{labels[order.status] || order.status}</span></div><div className="order-details"><div><small>PACK</small><strong>{order.package_label} game funds</strong></div><div><small>AMOUNT</small><strong>{money(order.price_ngn)}</strong></div><div><small>SENDER NAME</small><strong>{order.sender_name || 'Not submitted'}</strong></div><div><small>TRANSFER REFERENCE</small><strong>{order.transfer_reference || 'Not provided'}</strong></div><div className="order-id"><small>ORDER ID</small><strong>{order.id}</strong></div>{order.quoted_at && <div><small>PRICE QUOTED</small><strong>{new Date(order.quoted_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Lagos' })} WAT</strong></div>}</div><div className="order-footer">{order.quoteOnly ? <span>Checkout started, but transfer details have not been submitted. Contact the buyer to resolve it.</span> : <><span>Update after checking payment or delivery.</span><label>Status <select value={order.status} disabled={busy} onChange={e => updateStatus(order, e.target.value)}>{Object.entries(labels).filter(([key]) => key !== 'awaiting_transfer').map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label></>}</div></article>)}</div></main>}
  </div>;
}

function PasswordSettings({ email }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  async function changePassword(event) {
    event.preventDefault();
    setFeedback(null);
    if (next.length < 8) { setFeedback({ error: true, text: 'Choose a password with at least 8 characters.' }); return; }
    if (next !== confirm) { setFeedback({ error: true, text: 'The new passwords do not match.' }); return; }
    if (next === current) { setFeedback({ error: true, text: 'Choose a password different from your current one.' }); return; }
    setBusy(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password: current });
    if (authError) { setFeedback({ error: true, text: 'Current password could not be verified.' }); setBusy(false); return; }
    const { error: updateError } = await supabase.auth.updateUser({ password: next });
    if (updateError) setFeedback({ error: true, text: 'Password could not be changed. Try a stronger password and try again.' });
    else { setFeedback({ error: false, text: 'Password changed successfully.' }); setCurrent(''); setNext(''); setConfirm(''); setShow(false); }
    setBusy(false);
  }
  return <details className="password-settings"><summary>Account settings <span>Change password ↓</span></summary><div className="password-settings-content"><h2>Change your password</h2><p>Confirm your current password, then choose a new one.</p><form onSubmit={changePassword}><label htmlFor="current-password">Current password</label><input id="current-password" type={show ? 'text' : 'password'} value={current} onChange={e => setCurrent(e.target.value)} autoComplete="current-password" required/><label htmlFor="new-password">New password</label><input id="new-password" type={show ? 'text' : 'password'} value={next} onChange={e => setNext(e.target.value)} autoComplete="new-password" minLength={8} required/><label htmlFor="confirm-password">Confirm new password</label><input id="confirm-password" type={show ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" minLength={8} required/><label className="show-password"><input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)}/> Show passwords</label>{feedback && <p className={feedback.error ? 'admin-error' : 'admin-message'} role={feedback.error ? 'alert' : 'status'}>{feedback.text}</p>}<button className="admin-primary" disabled={busy}>{busy ? 'Updating...' : 'Update password'}</button></form></div></details>;
}
