# Web Push Setup

Web Push requires one VAPID key pair. The public key is used by the browser; the private key must only be stored as a Supabase Edge Function secret.

## Generate and Configure Keys

Run this locally in a terminal. Keep the private key out of source control, frontend environment variables, screenshots, and chat:

```powershell
npx --yes web-push generate-vapid-keys --json
```

Configure the returned public key as `VITE_VAPID_PUBLIC_KEY` in the frontend `.env.local` (or the frontend deployment environment). Configure the same pair in Supabase Dashboard under **Project Settings → Edge Functions → Secrets**:

- `VAPID_PUBLIC_KEY`: generated public key
- `VAPID_PRIVATE_KEY`: generated private key
- `VAPID_SUBJECT`: a contact URI, for example `mailto:admin@example.com`

Never use a `VITE_` prefix for the private key. Variables with that prefix are bundled into browser code.

Deploy the function after setting its secrets:

```powershell
npx supabase functions deploy send-web-push --project-ref YOUR_PROJECT_REF
```

Restart the Vite server after changing `.env.local`; rebuild and redeploy the frontend for production.

## Enable on a Device

Open **Pengaturan → Notifikasi Web Push**, choose **Aktifkan Notifikasi**, then allow notifications in the browser prompt. Use **Kirim Uji Coba** to verify delivery.

The app must be served over HTTPS in production; `localhost` is permitted for local testing. On iPhone/iPad with iOS 16.4 or newer, first add the site to the Home Screen and open it from that icon, then enable notifications.

If rotating an existing VAPID pair, devices subscribed with the old public key must unsubscribe and subscribe again with the new key.