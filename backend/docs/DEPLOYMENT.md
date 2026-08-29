# Deploying to cPanel shared hosting

This assumes a cPanel plan with **PHP support** ("Setup Node.js App" is
*not* needed — this backend is pure PHP) and a MySQL database, which every
cPanel shared plan includes. Ask your host to confirm the PHP version if
unsure; this app needs **PHP 8.2 or newer**.

## 1. Create the database

In cPanel → **MySQL® Databases**: create a database and a user, then add
that user to the database with **All Privileges**. cPanel usually prefixes
both with your account username, e.g. `youruser_quickorder` and
`youruser_qo`. Write down the database name, username, and password — they
go in `.env` in step 4.

## 2. Get the code onto the server

Pick whichever of these your host supports:

- **cPanel Git Version Control** (if your host offers it): point it at your
  repository and a target directory outside `public_html`, e.g.
  `/home/youruser/quickorder-backend`.
- **File Manager upload**: zip the `backend-laravel/` folder locally, upload
  the zip via cPanel's File Manager, extract it into
  `/home/youruser/quickorder-backend`.
- **SSH + git clone**, if your host provides SSH access (Terminal app in
  cPanel, or a real SSH client).

**Put the code outside `public_html`.** Only Laravel's `public/` folder
should ever be web-reachable — the rest (`app/`, `.env`, `database/`, your
secrets) must not be. Step 3 covers how to point a domain at just that
folder.

## 3. Point a (sub)domain at `public/`

The clean way: in cPanel → **Domains** (or **Subdomains**), create a
subdomain for the API (e.g. `api.your-domain.com`) and set its **Document
Root** directly to `quickorder-backend/public`. cPanel lets you type any
path here, not just one under `public_html`.

If your plan doesn't let you set a custom document root (some very basic
plans force everything under `public_html`), the fallback is: move the
*contents* of `public/` into `public_html/` (or a subfolder of it), then
edit the two `require`/`require_once` paths at the top of `index.php` to
point up to where `../vendor/autoload.php` and `../bootstrap/app.php`
actually live now. This works but is easy to get wrong — prefer a real
document-root subdomain if your host offers one.

## 4. Configure `.env`

```bash
cp .env.example .env
```

Then set at minimum:

```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.your-domain.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_DATABASE=youruser_quickorder
DB_USERNAME=youruser_qo
DB_PASSWORD=<the password you set in step 1>

CORS_ORIGIN=https://your-domain.com
SANCTUM_STATEFUL_DOMAINS=your-domain.com

VERIFICATION_SECRET=<a long random string>
ADMIN_EMAIL=you@your-domain.com
ADMIN_PASSWORD=<a real password — the .env.example default is not safe to ship>
```

**About cross-origin cookies (`SESSION_SAME_SITE` / `SESSION_DOMAIN`):**
the admin dashboard's login only works if the browser will actually send
the session cookie back on API requests from the frontend's origin.

- If the frontend and this API end up as subdomains of the *same*
  registrable domain (`your-domain.com` and `api.your-domain.com`), leave
  `SESSION_SAME_SITE=lax` and set `SESSION_DOMAIN=.your-domain.com` (leading
  dot) so the cookie is shared across both.
- If they're on genuinely different domains, set `SESSION_SAME_SITE=none`
  (browsers additionally require `SESSION_SECURE_COOKIE=true` and HTTPS for
  this to work at all — plan on both domains having valid SSL, which cPanel's
  free AutoSSL / Let's Encrypt integration covers).

Generate the app key and a verification secret:

```bash
php artisan key:generate
php artisan tinker --execute="echo bin2hex(random_bytes(32));"   # paste into VERIFICATION_SECRET
```

## 5. Install dependencies, migrate, seed

If your host gives you SSH or cPanel's Terminal app:

```bash
cd /home/youruser/quickorder-backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan db:seed --force
```

If your host has **no shell access at all** (some very basic plans): run
`composer install --no-dev` on your own machine, upload the resulting
`vendor/` folder alongside the rest of the code, and run the migration
by temporarily adding a one-off protected route or using a package like
`laravel/cashier`'s style webhook trick is overkill here — the simpler
answer is to ask your host to enable SSH, since almost every provider will
on request. Running migrations without a shell is the one step this guide
can't fully substitute for.

`db:seed` is idempotent (safe to re-run) — it creates the default business
+ menu and the superadmin only if they don't already exist, mirroring the
old NestJS backend's automatic first-boot seed. The GitHub Actions backend
deploy runs it after migrations for the same reason.

### GitHub Actions deploy

The repo includes `.github/workflows/deploy-backend.yml`, which deploys the
Laravel backend automatically when `backend/**` is pushed to `master`. It
runs the backend test suite first, then syncs `backend/` to the cPanel host
over SSH and runs Composer, migrations, seeders, and Laravel cache commands
there.

The server must already have its production `.env` file at `DEPLOY_PATH`.
The action intentionally does not upload or overwrite `.env`.

Add these GitHub repository secrets before enabling it:

```
SSH_HOST=your-domain.com
SSH_PORT=22
SSH_USER=youruser
SSH_PRIVATE_KEY=<private SSH key with access to the cPanel account>
DEPLOY_PATH=/home/youruser/quickorder-backend
BACKEND_HEALTHCHECK_URL=https://api.your-domain.com/api/health
```

`SSH_PORT` and `BACKEND_HEALTHCHECK_URL` are optional. If your cPanel
host exposes PHP or Composer under non-standard commands, also set:

```
CPANEL_PHP_BINARY=/opt/cpanel/ea-php83/root/usr/bin/php
CPANEL_COMPOSER_BINARY=/opt/cpanel/composer/bin/composer
```

## 6. File permissions

The web server user needs write access to two directories:

```bash
chmod -R 775 storage bootstrap/cache
```

(If your host runs PHP as your own cPanel user via `suPHP`/`suexec`/FPM —
the cPanel default — this is usually already satisfied; the `chmod` is a
safe no-op in that case.)

## 7. Go live with real WhatsApp delivery

`App\Services\MockWhatsAppNotifier` just logs the OTP code (`storage/logs/laravel.log`)
instead of sending it — exactly like the old backend's `MockWhatsAppNotifier`.
To send real messages, implement `App\Contracts\WhatsAppNotifier` against
your provider (WhatsApp Cloud API, Twilio, etc.) and change the one binding
in `App\Providers\AppServiceProvider::register()`:

```php
$this->app->bind(WhatsAppNotifier::class, RealWhatsAppNotifier::class);
```

Nothing else in the codebase needs to change — `VerificationOtpService` only
depends on the interface.

## 8. Smoke test

```
GET https://api.your-domain.com/api/health   →  {"status":"ok","db":"up",...}
GET https://api.your-domain.com/api/menu     →  the seeded menu
```

Then point the frontend's `VITE_API_BASE_URL` at
`https://api.your-domain.com/api` and rebuild it.
