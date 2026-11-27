import React from 'react';
import { ArrowLeft, ArrowUpRight, MessageCircle, ShieldCheck } from 'lucide-react';

const whatsappNumber = (import.meta.env.VITE_WHATSAPP_NUMBER || '2347075789600').replace(/[^0-9]/g, '');
const supportUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hello, I would like help with a refund for my Funds4LagosLife order.')}`;

export default function RefundPolicy() {
  return <div className="policy-page">
    <header className="admin-header">
      <a href="/" className="admin-brand"><span>f4</span> Funds4LagosLife</a>
      <a href="/" className="admin-back"><ArrowLeft size={16}/> Back to shop</a>
    </header>
    <main className="policy-content">
      <div className="policy-heading">
        <span className="eyebrow">THE IMPORTANT STUFF</span>
        <h1>Refund <em>policy.</em></h1>
        <p>Changed your mind? Here’s how to request a refund for your game funds.</p>
      </div>
      <div className="policy-card">
        <section><span className="policy-number">01</span><div><h2>Contact us</h2><p>Message us on WhatsApp with your order reference and Lagos Life username. Keep your order reference private and share it only with our support team.</p></div></section>
        <section><span className="policy-number">02</span><div><h2>Return delivered game funds</h2><p>If your game funds have already been delivered, contact us first on WhatsApp, then return the full amount you received to our Lagos Life account, Ayo_adeh. Check the username carefully before sending.</p></div></section>
        <section><span className="policy-number">03</span><div><h2>We confirm and refund</h2><p>Once we confirm that we’ve received the full amount of game funds, we’ll refund the original amount you paid. Refunds are reviewed and processed manually. Ask us on WhatsApp about the expected timeframe.</p></div></section>
        <section><span className="policy-number">04</span><div><h2>If your funds haven’t been delivered</h2><p>Contact us with your order reference so we can verify your payment and help with your request.</p></div></section>
        <div className="policy-safety"><ShieldCheck size={20}/><p>We may ask for bank account details to send a refund. Never share your bank PIN, password or one-time codes.</p></div>
        <a className="button primary policy-contact" href={supportUrl} target="_blank" rel="noopener noreferrer"><span><MessageCircle size={17}/> Contact us on WhatsApp</span><ArrowUpRight size={17}/></a>
      </div>
      <p className="policy-foot">Funds4LagosLife is independent of Lagos Life.</p>
    </main>
  </div>;
}
