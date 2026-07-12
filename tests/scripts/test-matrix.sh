#!/bin/bash
set -e

echo "======================================================"
echo "🚀 Qwykz Exhaustive Matrix Test (ALL BACKENDS)"
echo "======================================================"

TEST_DIR="qwykz-matrix-tests"
mkdir -p $TEST_DIR

SUPABASE_URL="https://uycyiwnzikslmkjiqwyd.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5Y3lpd256aWtzbG1ramlxd3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyODYxMjQsImV4cCI6MjA5Nzg2MjEyNH0.EJfqKnhh73wW7aJuJYnzoRvdIyDkAQ_7YTC5pJN77mo"
SUPABASE_DB_URL="postgresql://postgres.uycyiwnzikslmkjiqwyd:aGg2aY9vC9CvocXm@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true"
SUPABASE_DIRECT_URL="postgresql://postgres.uycyiwnzikslmkjiqwyd:aGg2aY9vC9CvocXm@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"
UPSTASH_URL="https://casual-macaque-155325.upstash.io"
UPSTASH_TOKEN="gQAAAAAAAl69AAIgcDE4MGQwNDhmZGNkYmI0N2Q1OGE5ZjU1ZWM0YjlhOTVjYQ"
CLERK_PUB_KEY="pk_test_bHVja3ktamF5YmlyZC02Mi5jbGVyay5hY2NvdW50cy5kZXYk"
CLERK_SECRET_KEY="sk_test_dLa6ZN7GkUZ0UAgCfRBtU0w9zR074riqh8MfVolKKo"

inject_credentials() {
  local env_file=$1
  if [ -f "$env_file" ]; then
    sed -i "s|https://your-project.supabase.co|$SUPABASE_URL|g" "$env_file"
    sed -i "s|your-anon-key|$SUPABASE_ANON_KEY|g" "$env_file"
    sed -i "s|https://YOUR_PROJECT_REF.supabase.co|$SUPABASE_URL|g" "$env_file"
    sed -i "s|YOUR_ANON_KEY|$SUPABASE_ANON_KEY|g" "$env_file"
    sed -i "s|postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public|$SUPABASE_DB_URL|g" "$env_file"
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"$SUPABASE_DB_URL\"|g" "$env_file"
    sed -i "s|DIRECT_URL=.*|DIRECT_URL=\"$SUPABASE_DIRECT_URL\"|g" "$env_file"
    sed -i "s|https://your-endpoint.upstash.io|$UPSTASH_URL|g" "$env_file"
    sed -i "s|your-token|$UPSTASH_TOKEN|g" "$env_file"
    sed -i "s|CLERK_PUBLISHABLE_KEY=.*|CLERK_PUBLISHABLE_KEY=\"$CLERK_PUB_KEY\"|g" "$env_file"
    sed -i "s|CLERK_SECRET_KEY=.*|CLERK_SECRET_KEY=\"$CLERK_SECRET_KEY\"|g" "$env_file"
    sed -i "s|NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=.*|NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=\"$CLERK_PUB_KEY\"|g" "$env_file"
  fi
}

test_endpoints() {
  local port=$1
  local cmd=$2
  local framework=$3
  echo "🚀 Pinging $cmd on port $port..."
  eval "$cmd" > /dev/null 2>&1 &
  local SERVER_PID=$!
  
  local success=false
  for i in {1..20}; do
    if curl -s http://localhost:$port > /dev/null || curl -s http://localhost:$port/api/health > /dev/null; then
      success=true
      break
    fi
    sleep 1
  done
  
  if [ "$success" = true ]; then
    echo "✓ Server is alive on http://localhost:$port!"
    if [ "$framework" == "express" ] || [ "$framework" == "hono" ] || [ "$framework" == "elysia" ] || [ "$framework" == "go" ] || [ "$framework" == "python" ]; then
      echo "  -> Testing POST /api/auth/register"
      curl -s -X POST -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"password"}' http://localhost:$port/api/auth/register > /dev/null || true
      echo "  -> Testing POST /api/auth/login"
      curl -s -X POST -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"password"}' http://localhost:$port/api/auth/login > /dev/null || true
      echo "  -> Testing GET /api/users"
      curl -s http://localhost:$port/api/users > /dev/null || true
    fi
  else
    echo "❌ Server failed to start on port $port!"
  fi
  kill $SERVER_PID 2>/dev/null || true
  wait $SERVER_PID 2>/dev/null || true
}

run_matrix_test() {
  local name=$1
  local args=$2
  local db=$3
  local caching=$4
  local framework=$5

  echo -e "\n--------------------------------------------------"
  echo "🧪 Scaffolding: $name ($framework)"
  echo "--------------------------------------------------"
  cd $TEST_DIR
  rm -rf $name
  
  bun run ../src/index.ts --yes --name $name $args
  
  inject_credentials "$name/.env"
  
  if [ "$db" == "docker" ] || [ "$caching" == "docker" ]; then
    cd $name
    docker compose down -v 2>/dev/null || true
    docker compose up -d --wait --wait-timeout 60
    cd - > /dev/null
  fi
  
  cd $name
  if [ "$framework" == "hono" ] || [ "$framework" == "elysia" ]; then
    bun install
    bun run db:push
    test_endpoints 3000 "bun run dev" "$framework"
  elif [ "$framework" == "go" ]; then
    if command -v go &> /dev/null; then
      go mod tidy
      go build -o app cmd/api/main.go
      test_endpoints 3000 "./app" "$framework"
    fi
  elif [ "$framework" == "python" ]; then
    if command -v python3 &> /dev/null; then
      python3 -m venv venv
      source venv/bin/activate
      pip install -r requirements.txt > /dev/null 2>&1 || true
      test_endpoints 8000 "uvicorn app.main:app --port 8000" "$framework"
      deactivate
    fi
  elif [ "$framework" == "laravel" ]; then
    if command -v php &> /dev/null; then
      php artisan key:generate --force -n 2>/dev/null || true
      test_endpoints 8000 "php artisan serve" "$framework"
    fi
  fi
  cd - > /dev/null

  if [ "$db" == "docker" ] || [ "$caching" == "docker" ]; then
    cd $name
    docker compose down -v 2>/dev/null || true
    cd - > /dev/null
  fi
  cd ..
}

# 1. HONO
run_matrix_test "hono-supa-clerk" "--framework hono --db supabase --auth clerk --caching upstash" "supabase" "upstash" "hono"

# 2. ELYSIA
run_matrix_test "elysia-docker-local" "--framework elysia --db docker --auth local --caching none" "docker" "none" "elysia"

# 3. GO
run_matrix_test "go-docker-local" "--framework go --db docker --auth local --caching docker" "docker" "docker" "go"

# 4. PYTHON
run_matrix_test "python-supa-supa" "--framework python --db supabase --auth supabase --caching none" "supabase" "none" "python"

# 5. LARAVEL
run_matrix_test "laravel-local" "--framework laravel --db local --auth local --caching none" "local" "none" "laravel"

echo -e "\n🎉 ALL BACKEND MATRIX TESTS COMPLETE!"
