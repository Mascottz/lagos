# Funds4LagosLife

A storefront for manually fulfilled Lagos Life game fund orders. It is independent of Lagos Life. The Supabase project `funds4lagoslife` has the migrations applied. Anonymous visitors cannot read order or quote tables directly. A public status RPC returns only status, pack, price and date to anyone holding the full order reference.

## Run locally

Run `npm install`, copy `.env.example` to `.env.local`, and run `npm run dev`. Production build: `npm run build`.

## Before taking payments

1. The owner approved the current pack prices. Approved admins can edit prices in the order desk. New checkouts use the database prices, and each checkout quote preserves its price before the buyer pays. Older copies of the site may still submit their originally displayed fixed prices through the legacy RPC, so check the amount on every order.
2. The supplied OPay account name and number are configured as public checkout defaults. You can override `VITE_OPAY_ACCOUNT_NAME` and the 10 digit `VITE_OPAY_ACCOUNT_NUMBER` in `.env.local` or in your hosting provider's environment settings. Verify the account details independently before launch. These values are deliberately public because customers must see them to transfer. Do not enter a password, PIN, API secret, or other private credential. Checkout is enabled by default. Set `VITE_STORE_ENABLED=false` to pause it. Rebuild/redeploy after changes.
3. Test the entire flow with a small real payment before launch. In Supabase, open Table Editor and view `orders`. Verify the sender, exact amount, and transfer independently in OPay before marking an order paid and sending game funds. Mark it delivered after fulfillment. The form does not verify payment, receive bank events, or transfer game funds automatically.
4. Provide a clear refund policy and check Lagos Life's rules on selling game currency. Confirm your OPay account permits this use. A server-side global burst cap limits quote creation and order inserts to 60 each per minute, including the legacy RPC. This is not a per-user limit or bot protection and can be exhausted by an attacker. Add provider-enforced bot protection and per-client rate limits before relying on it. Every order is untrusted and may be spam.

For automatic matching, contact OPay about merchant onboarding and available checkout/transfer APIs. That requires a separate server-side integration with verified callbacks and payment status checks. Never put merchant secrets in Vite environment variables or client-side code.

## Admin order desk and WhatsApp

The site has a private `/admin` page. Admins sign in with a Supabase Auth email and password. A signed-in account cannot see orders until its user ID is added to `public.admin_users`. Row level security restricts order reads and status updates to approved admins, and admins can update only the status column. An account is not automatically an admin just because it can sign in.

To set up the first admin, create a user from Supabase Dashboard > Authentication > Users, with the owner’s email and a password chosen privately by the owner. In the Dashboard, create and confirm the user manually. Then use the SQL Editor to add that user's ID to `public.admin_users`. For example, after replacing the email below with the exact user's email:

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'owner@example.com';
```

Verify that one row was added. Never put an admin password or service role key into the frontend or Git. The admin page loads up to 500 results and can be refreshed manually. Search by username or full order reference. If a buyer paid but did not submit sender details, searching their full checkout reference can find the unsubmitted quote. Status changes do not verify OPay payments or send game funds. Signed-in admins can change their password in Account settings after confirming their current password.

The supplied WhatsApp number is configured as `2347075789600`. Set `VITE_WHATSAPP_NUMBER` to override it with another public WhatsApp number in international format and rebuild. After an order is saved, buyers get a prefilled WhatsApp link. The buyer must actually press send in WhatsApp, and the site cannot verify that they did. If no number is configured, the order is still saved and the page explains WhatsApp is not set up.

## Order tracking

Checkout creates a private random reference before payment and keeps the quoted price. Buyers should save the reference and keep it private: anyone with it can see the status, package, price and date. The same browser tab can resume checkout after a refresh when session storage is available. If the buyer loses the reference or cannot submit payment details, they should contact WhatsApp support. Orders remain pending until verified manually.
