#!/bin/sh
set -e

# docker-compose gates container start on the db healthcheck, so by the time
# this runs MySQL/MariaDB is already accepting connections — no wait-loop
# needed here.

echo "Running database migrations..."
php artisan migrate --force

echo "Seeding (idempotent — creates the default business/menu/superadmin/business admin and the second test business/admin, only if missing)..."
php artisan db:seed --force

exec "$@"
