# QuickOrder backend (Laravel) — local/dev Docker image.
#
# This is NOT how the app is meant to run in production — the whole point of
# the Laravel rewrite (see docs/DEPLOYMENT.md) is that it deploys on plain
# PHP/MySQL cPanel shared hosting with no Docker and no separate process
# manager. This image exists so `docker compose up --build` from the project
# root gives you the full stack (db + backend + frontend) for local
# development, matching the old NestJS backend's Docker workflow.
# Pin to Debian bookworm for local Docker builds. The moving php:8.3-apache
# tag currently resolves to trixie, which fails with "exec format error" on
# this Docker Desktop arm64 environment before any Laravel code runs.
FROM php:8.3-apache-bookworm

# System packages + PHP extensions Laravel/MySQL need.
# - pdo_mysql: talk to MySQL/MariaDB
# - zip/bcmath: required by laravel/framework
# - curl: used by the container healthcheck below
RUN apt-get update && apt-get install -y --no-install-recommends \
        libzip-dev \
        unzip \
        git \
        curl \
    && docker-php-ext-install pdo_mysql zip bcmath \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

# Laravel serves from public/, not the project root.
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e "s!/var/www/html!${APACHE_DOCUMENT_ROOT}!g" \
        /etc/apache2/sites-available/*.conf /etc/apache2/apache2.conf
RUN echo "ServerName localhost" > /etc/apache2/conf-available/servername.conf \
    && a2enconf servername

# Composer itself, copied straight from its official image.
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .

# No .env is baked into the image — every setting Laravel needs comes from
# real environment variables supplied by docker-compose.yml, the same way
# the old NestJS backend's Dockerfile never baked in a .env either.
RUN composer install --no-dev --optimize-autoloader \
    && mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]
