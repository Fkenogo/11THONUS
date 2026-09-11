#!/usr/bin/env bash
# Creates the local/test databases the official postgres image doesn't
# support natively (it only creates POSTGRES_DB). Runs once, automatically,
# on first container startup only (docker-entrypoint-initdb.d convention).
set -euo pipefail

if [ -n "${POSTGRES_MULTIPLE_DATABASES:-}" ]; then
  IFS=',' read -ra DATABASES <<< "$POSTGRES_MULTIPLE_DATABASES"
  for db in "${DATABASES[@]}"; do
    echo "Creating database: $db"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
      SELECT 'CREATE DATABASE "$db"' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$db')\gexec
EOSQL
  done
fi
