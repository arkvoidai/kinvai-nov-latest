# Kinvai — Google OAuth & Supabase Authentication Setup

This guide configures persistent Google sign-in for Kinvai (`https://kinvai.arkvoid.com`) using Supabase Auth with PKCE, `persistSession: true`, and `autoRefreshToken: true`.

The application callback route is:

```text
/auth/callback
```

Because `src/lib/auth/authHelpers.ts` builds `redirectTo` dynamically from the active origin (`<origin>/auth/callback?next=<same-origin-path>`), every environment where users sign in must be listed in Supabase's **Redirect URLs**.

---

## 1. Prerequisites & Runtime Environment Variables

Confirm these secrets are configured in your hosting environment (AI Studio **Settings → Secrets**, Vercel/Cloud Run, or local `.env`):

| Variable | Visibility | Value |
| --- | --- | --- |
| `SITE_URL` | Public (injected into `window.__KINVAI__`) | `https://kinvai.arkvoid.com` |
| `SUPABASE_URL` | Public (injected into `window.__KINVAI__`) | `https://<YOUR_PROJECT_REF>.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Public (injected into `window.__KINVAI__`) | Your Supabase anon / publishable key (`sb_publishable_...` or JWT anon key) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only secret** | Your Supabase service role key (never exposed to browser) |

> **Project Reference note:** Replace `<YOUR_PROJECT_REF>` with your actual Supabase project reference from **Supabase Dashboard → Project Settings → General → Reference ID**. Do not paste keys into client files; configure all values via environment variables / Secrets.

---

## 2. Configure Supabase Authentication URLs

Open the **Supabase Dashboard** for your Kinvai project and navigate to **Authentication → URL Configuration**.

### A. Site URL
Set **Site URL** to the production storefront origin:

```text
https://kinvai.arkvoid.com
```

### B. Redirect URLs
Add every origin that can initiate OAuth sign-in, matching `/auth/callback` (Supabase matches exact paths or glob patterns; adding both explicit `/auth/callback` and wildcard `/**` for each trusted host prevents redirect rejection):

**Production**
```text
https://kinvai.arkvoid.com/auth/callback
https://kinvai.arkvoid.com/**
```

**Local Development**
```text
http://localhost:3000/auth/callback
http://localhost:3000/**
```

**AI Studio / Cloud Run Preview Environments**
Replace `<YOUR_CLOUD_RUN_HOST>` with your active AI Studio preview hostname (for example `ais-dev-...run.app` and `ais-pre-...run.app`, found in the browser address bar when opened in a new tab):

```text
https://<YOUR_CLOUD_RUN_DEV_HOST>/auth/callback
https://<YOUR_CLOUD_RUN_SHARED_HOST>/auth/callback
```

Click **Save**.

> **Important:** Google blocks OAuth inside embedded iframes. When previewing inside AI Studio, Kinvai detects `window.self !== window.top` in `SignInSheet` and displays an **"Open Kinvai in a new tab"** link so OAuth runs in a top-level browser tab.

---

## 3. Configure Google Cloud Console OAuth Client

Open **Google Cloud Console → APIs & Services → Credentials**.

1. If you have not configured the consent screen yet, open **OAuth consent screen** (or **Google Auth Platform → Branding / Audience**):
   - **App name:** `Kinvai`
   - **User support email:** `heyarkvoid@gmail.com`
   - **Authorized domains:** `arkvoid.com` and `supabase.co`
   - **App home page:** `https://kinvai.arkvoid.com`
   - **Privacy policy:** `https://kinvai.arkvoid.com/legal/privacy`
   - **Terms of service:** `https://kinvai.arkvoid.com/legal/terms`
   - **Scopes:** `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`

2. Go to **Credentials → + Create Credentials → OAuth client ID**:
   - **Application type:** `Web application`
   - **Name:** `Kinvai Web Auth`

3. Under **Authorized JavaScript origins**, add:
   ```text
   https://kinvai.arkvoid.com
   https://<YOUR_PROJECT_REF>.supabase.co
   http://localhost:3000
   ```
   *(Optionally add your Cloud Run preview origin `https://<YOUR_CLOUD_RUN_DEV_HOST>` if testing directly from a preview tab.)*

4. Under **Authorized redirect URIs**, add **Supabase's** OAuth callback URL (NOT `/auth/callback` on your app — Google redirects to Supabase first, and Supabase then redirects back to Kinvai's `/auth/callback`):
   ```text
   https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback
   ```

5. Click **Create** and copy the generated **Client ID** and **Client Secret**.

---

## 4. Enable Google Provider in Supabase

1. In the **Supabase Dashboard**, open **Authentication → Sign In / Providers → Google**.
2. Toggle **Enable Sign in with Google** to **ON**.
3. Paste the **Client ID** and **Client Secret** from Google Cloud Console.
4. Confirm the **Callback URL (for OAuth)** displayed by Supabase matches:
   ```text
   https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback
   ```
5. Click **Save**.

---

## 5. Session Persistence & Security Checklist

Verify these behaviors after connecting credentials:

- **PKCE & Persistence:** `src/lib/supabase/client.ts` initializes Supabase with `flowType: 'pkce'`, `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`, and `storageKey: 'kinvai.auth.session'`.
- **Safe `next` redirects:** `/auth/callback?next=...` passes `next` through `validateNextPath()` in `src/lib/auth/authHelpers.ts`, rejecting protocol-relative URLs (`//evil.com`), external origins (`https://...`), backslashes, and `/auth/callback` loops.
- **No premature sign-out:** Protected routes (`/account`, `/checkout`) and the header account slot wait for `AuthProvider` (`loading === false`) before rendering signed-out UI, preventing sign-in flicker on reload or browser restart.
- **Troubleshooting:**
  - `redirect_uri_mismatch` on Google's screen → Confirm **Authorized redirect URIs** in Google Cloud Console contains exact `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback`.
  - Redirect lands on `https://kinvai.arkvoid.com` instead of local/preview host → Confirm your local/preview `/auth/callback` URL is added under Supabase **Authentication → URL Configuration → Redirect URLs**.
  - `disallowed_useragent` or blocked frame → Open Kinvai in a standalone browser tab outside the preview iframe.
