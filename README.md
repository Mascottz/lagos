# Funds4LagosLife

A storefront for manually fulfilled Lagos Life game fund orders. It is independent of Lagos Life. The Supabase project `funds4lagoslife` has the order migration applied. Anonymous visitors cannot read or update orders; the public RPC only submits pending orders.

## Run locally

Run `npm install`, copy `.env.example` to `.env.local`, and run `npm run dev`. Production build: `npm run build`.

## Before taking payments

1. The owner approved the current pack prices. To change rates, update `packs` in `src/main.jsx` and the price mapping in `public.submit_manual_order` in Supabase. Keep both in sync.
2. The supplied OPay account name and number are configured as public checkout defaults. You can override `VITE_OPAY_ACCOUNT_NAME` and the 10 digit `VITE_OPAY_ACCOUNT_NUMBER` in `.env.local` or in your hosting provider's environment settings. Verify the account details independently before launch. These values are deliberately public because customers must see them to transfer. Do not enter a password, PIN, API secret, or other private credential. Checkout is enabled by default. Set `VITE_STORE_ENABLED=false` to pause it. Rebuild/redeploy after changes.
3. Test the entire flow with a small real payment before launch. In Supabase, open Table Editor and view `orders`. Verify the sender, exact amount, and transfer independently in OPay before marking an order paid and sending game funds. Mark it delivered after fulfillment. The form does not verify payment, receive bank events, or transfer game funds automatically.
4. Add an accessible customer support channel and refund policy, check Lagos Life's rules on selling game currency, and confirm your OPay account permits this use. Add server-side abuse protection and rate limiting before accepting public traffic. The public submission function can be called directly, so every order must be considered untrusted and may be spam.

For automatic matching, contact OPay about merchant onboarding and available checkout/transfer APIs. That requires a separate server-side integration with verified callbacks and payment status checks. Never put merchant secrets in Vite environment variables or client-side code.

## Admin order desk and WhatsApp

The site has a private `/admin` page. Admins sign in with a Supabase Auth email and password. A signed-in account cannot see orders until its user ID is added to `public.admin_users`. Row level security restricts order reads and status updates to approved admins, and admins can update only the status column. An account is not automatically an admin just because it can sign in.

To set up the first admin, create a user from Supabase Dashboard > Authentication > Users, with the owner’s email and a password chosen privately by the owner. In the Dashboard, create and confirm the user manually. Then use the SQL Editor to add that user's ID to `public.admin_users`. For example, after replacing the email below with the exact user's email:

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'owner@example.com';
```

Verify that one row was added. Never put an admin password or service role key into the frontend or Git. The admin page loads up to the 500 most recent orders and can be refreshed manually. Status changes do not verify OPay payments or send game funds. Signed-in admins can change their password in Account settings after confirming their current password.

The supplied WhatsApp number is configured as `2347075789600`. Set `VITE_WHATSAPP_NUMBER` to override it with another public WhatsApp number in international format and rebuild. After an order is saved, buyers get a prefilled WhatsApp link. The buyer must actually press send in WhatsApp, and the site cannot verify that they did. If no number is configured, the order is still saved and the page explains WhatsApp is not set up.
