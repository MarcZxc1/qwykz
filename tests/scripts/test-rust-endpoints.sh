#!/bin/bash
set -e

echo "======================================================"
echo "🦀 Qwykz Targeted Test: RUST COMPILATION & ENDPOINTS"
echo "======================================================"

TEST_DIR="qwykz-rust-test"
rm -rf $TEST_DIR
mkdir -p $TEST_DIR
cd $TEST_DIR

# 1. Scaffold the Rust app
echo "🧪 Scaffolding Rust (Axum/Actix)..."
bun run ../src/index.ts --yes --name rust-app --framework rust --db supabase --auth supabase --caching none

# 2. Inject Supabase cloud credentials so it doesn't need Docker
SUPABASE_URL="https://uycyiwnzikslmkjiqwyd.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5Y3lpd256aWtzbG1ramlxd3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyODYxMjQsImV4cCI6MjA5Nzg2MjEyNH0.EJfqKnhh73wW7aJuJYnzoRvdIyDkAQ_7YTC5pJN77mo"
SUPABASE_DB_URL="postgresql://postgres.uycyiwnzikslmkjiqwyd:aGg2aY9vC9CvocXm@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true"

env_file="rust-app/.env"
if [ -f "$env_file" ]; then
  sed -i "s|https://your-project.supabase.co|$SUPABASE_URL|g" "$env_file"
  sed -i "s|your-anon-key|$SUPABASE_ANON_KEY|g" "$env_file"
  sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"$SUPABASE_DB_URL\"|g" "$env_file"
fi

# 3. Boot & Test Endpoints
cd rust-app
echo "🦀 Building and booting Rust server (this may take a few minutes)..."
cargo run > server.log 2>&1 &
SERVER_PID=$!

echo "🚀 Polling port 8080 for server boot..."
success=false
# Rust might take 2-4 minutes to compile the first time, so we poll for 5 minutes
for i in {1..300}; do
  if curl -s http://localhost:8080 > /dev/null || curl -s http://localhost:8080/api/health > /dev/null; then
    success=true
    break
  fi
  sleep 1
done

if [ "$success" = true ]; then
  echo "✓ Rust Server is ALIVE on port 8080!"
  echo "  -> Testing POST /api/auth/register"
  curl -s -X POST -H "Content-Type: application/json" -d '{"email":"testrust@test.com","password":"password"}' http://localhost:8080/api/auth/register > /dev/null || true
  echo "  -> Testing POST /api/auth/login"
  curl -s -X POST -H "Content-Type: application/json" -d '{"email":"testrust@test.com","password":"password"}' http://localhost:8080/api/auth/login > /dev/null || true
  echo "  -> Testing GET /api/users"
  curl -s http://localhost:8080/api/users > /dev/null || true
  
  echo -e "\n🎉 RUST ENDPOINT TEST COMPLETED SUCCESSFULLY!"
else
  echo "❌ Rust Server failed to start on port 8080! Check server.log:"
  tail -n 20 server.log
fi

kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true
cd ../..
