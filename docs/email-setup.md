# Setup Email Auth (Lupa Password, Konfirmasi Daftar)

Email auth POHub **dikirim oleh Supabase Auth**, bukan oleh kode aplikasi:

| Email | Dipicu dari |
| --- | --- |
| Konfirmasi pendaftaran | `register` → `supabase.auth.signUp` (`src/actions/auth.ts`) |
| Lupa password | `forgotPassword` → `resetPasswordForEmail` (`src/actions/auth.ts`) |
| Reset password oleh admin | `triggerPasswordReset` (`src/actions/admin/users.ts`) |

Jadi sender (alamat pengirim, SMTP) diatur di **Supabase Dashboard**, bukan di `.env`.
Tanpa SMTP sendiri, Supabase memakai server email bawaan yang sangat dibatasi
(hanya beberapa email per jam, dan bisa hanya terkirim ke anggota tim project) —
**tidak layak untuk produksi**.

## 1. Domain pengirim di Resend

1. Buat akun di <https://resend.com> → **Domains → Add Domain** (mis. `pohub.app`).
2. Tambahkan record DNS (SPF, DKIM, opsional DMARC) yang diberikan Resend di DNS domain, tunggu status **Verified**.
3. **API Keys → Create API Key** (permission: *Sending access*). Simpan key `re_...`.

## 2. Custom SMTP di Supabase

Supabase Dashboard → **Authentication → Emails → SMTP Settings** → *Enable Custom SMTP*:

| Field | Nilai |
| --- | --- |
| Sender email | `noreply@pohub.app` (harus domain yang sudah verified) |
| Sender name | `POHub` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | API key Resend (`re_...`) |

Lalu **Authentication → Rate Limits**: naikkan *Rate limit for sending emails*
(default custom SMTP 30/jam) sesuai kebutuhan.

## 3. URL Configuration

**Authentication → URL Configuration**:

- **Site URL**: URL produksi, mis. `https://pohub.app` (sama dengan `NEXT_PUBLIC_APP_URL`).
- **Redirect URLs** (tambahkan semua environment):
  - `https://pohub.app/**`
  - `http://localhost:3000/**`
  - URL preview Vercel bila dipakai, mis. `https://*-namatim.vercel.app/**`

## 4. Template email (wajib untuk link lintas perangkat)

Template bawaan memakai `{{ .ConfirmationURL }}` (alur PKCE `?code=`). Link itu
**hanya berhasil jika dibuka di browser yang sama** tempat permintaan dibuat — gagal
kalau user minta reset di laptop tapi buka email di HP, dan selalu gagal untuk
reset yang dipicu admin. Ganti link di template agar memakai route
`/api/auth/confirm` (token hash):

**Authentication → Emails → Templates → Reset Password**

- Subject: `Reset password akun POHub kamu`
- Body:

```html
<h2>Reset password</h2>
<p>Hai, kami menerima permintaan untuk mengatur ulang password akun POHub kamu.</p>
<p><a href="{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Buat password baru</a></p>
<p>Link ini berlaku 1 jam. Abaikan email ini jika kamu tidak memintanya.</p>
```

**Confirm signup**

- Subject: `Konfirmasi email akun POHub kamu`
- Body:

```html
<h2>Selamat datang di POHub!</h2>
<p>Klik tombol di bawah untuk mengaktifkan akun kamu.</p>
<p><a href="{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=email">Aktifkan akun</a></p>
```

**Change Email Address** (bila dipakai): link
`{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=email_change`.

> Bila template belum diganti, alur tetap jalan untuk kasus browser yang sama:
> `redirectTo` lupa password sudah diarahkan ke `/api/auth/callback?next=/reset-password`,
> yang menukar `code` menjadi sesi sebelum membuka halaman reset.

## 5. Uji

1. `/lupa-password` → masukkan email terdaftar → email datang dari `POHub <noreply@pohub.app>` (cek juga folder spam).
2. Buka link (coba di perangkat lain) → masuk ke `/reset-password` → simpan password baru → diarahkan ke `/masuk`.
3. Link kedaluwarsa/sudah dipakai → diarahkan ke `/masuk` dengan pesan "Link reset password tidak valid".
4. Cek log pengiriman di Resend Dashboard → **Emails** dan Supabase → **Logs → Auth**.

## Catatan `RESEND_API_KEY` / `RESEND_FROM_EMAIL`

Variabel ini ada di `.env.example` dan package `resend` terpasang, tetapi **belum dipakai
kode aplikasi** (belum ada email transaksional seperti notifikasi pesanan). Email auth di
atas tidak membutuhkannya — cukup konfigurasi SMTP di Supabase.
