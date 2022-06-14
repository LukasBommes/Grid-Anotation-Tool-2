#!/bin/bash

mkdir -p docker/secrets

backend_access_token_secret_key=$(openssl rand -hex 32)
echo "$backend_access_token_secret_key" > docker/secrets/backend_access_token_secret_key.txt

db_postgres_user=$(openssl rand -hex 16)
echo "$db_postgres_user" > docker/secrets/db_postgres_user.txt

db_postgres_db=$(openssl rand -hex 16)
echo "$db_postgres_db" > docker/secrets/db_postgres_db.txt

db_postgres_password=$(openssl rand -hex 16)
echo "$db_postgres_password" > docker/secrets/db_postgres_password.txt

backend_database_url="postgresql://${db_postgres_user}:${db_postgres_password}@db/${db_postgres_db}"
echo "$backend_database_url" > docker/secrets/backend_database_url.txt
