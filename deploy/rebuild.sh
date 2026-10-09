#!/bin/sh
# Pulls the latest code and rebuilds the site from the tour API.
# Run by cron so new or edited tours appear without anyone deploying:
#   0 * * * * /code/vngt-ib/deploy/rebuild.sh >> /var/log/vngt-ib-build.log 2>&1
#
# Settings live in /code/vngt-ib/.env (not in git), for example:
#   SITE_URL=https://vngrouptourist.com
#   GA_ID=G-XXXXXXXXXX
# A failed build leaves the live site untouched (see scripts/build.mjs).

set -e
cd "$(dirname "$0")/.."

[ -f .env ] && set -a && . ./.env && set +a

echo "== $(date '+%Y-%m-%d %H:%M:%S')"
git pull --ff-only --quiet

# Reinstall only when dependencies changed
if [ ! -d node_modules ] || [ package-lock.json -nt node_modules ]; then
    npm ci --no-audit --no-fund
    touch node_modules
fi

npm run --silent build
