# Supabase: Password reset and confirmation emails

If users don’t receive **password reset** or **email confirmation** emails, use the steps below.

---

## Why you’re not getting the email (most likely)

**Without custom SMTP, Supabase only sends auth emails to your project’s team members.**

So if the email you’re testing with (e.g. your personal Gmail) is **not** in your Supabase organization’s team, Supabase will **not** send the reset email to it. The app can still show “Check your email” because the API call succeeds, but no email is delivered.

**Fix:** either add the address as a team member (quick test) or set up **custom SMTP** (required for real users).

---

## Option A: Quick test – allow your email as a team member

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your **organization** (org name top-left).
2. Open **Team** (or **Organization settings** → **Team**).
3. **Invite** the email address you use for testing (e.g. your Gmail) as a member.
4. Accept the invite from that inbox.
5. Try “Forgot password” again with that email. You should receive the reset email.

This is only for testing. For production, **Option B** is required so **all** users can receive emails.

---

## Option B: Production fix – set up custom SMTP (required for all users)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Project Settings** (gear) → **Auth** → **SMTP Settings** (or **Authentication** → **SMTP**).
3. Enable **Custom SMTP**.
4. Use an email provider that supports SMTP, for example:
   - **[Resend](https://resend.com)** – free tier, [Supabase guide](https://resend.com/docs/send-with-supabase-smtp): create account → API Keys → use SMTP (e.g. host `smtp.resend.com`, port `465`, user `resend`, password = your API key).
   - **SendGrid, Brevo, Mailgun, Postmark** – same idea: get SMTP host, port, user, password from the provider.
5. Set **Sender email** to an address on your domain (e.g. `no-reply@livvo.net`). With Resend you can use their sandbox domain first to test.
6. Save. After this, Supabase will send **all** auth emails (reset password, confirm email) via your SMTP to **any** user address.

---

## 1. Allow your site URLs (you did this)

- **Site URL:** `https://livvo.net`
- **Redirect URLs:** e.g. `https://livvo.net/landlord-login.html`, `https://livvo.net/flatmate-login.html`, `https://livvo.net/landlord-confirm-email.html`

If the flatmate URL was added as `flatmate-login.htm` (missing `l`), fix it to `flatmate-login.html`.

---

## 2. Check spam

Ask users to check **spam/junk**. With custom SMTP and a proper “from” domain, deliverability improves.
