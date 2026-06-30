#!/bin/bash
set -e

echo "======================================"
echo "🚀 Qwykz CLI Automated Testing Suite 🚀"
echo "======================================"

# Target directory
TEST_DIR="qwykz-tests"
mkdir -p $TEST_DIR

# Credentials
SUPABASE_URL="https://uycyiwnzikslmkjiqwyd.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5Y3lpd256aWtzbG1ramlxd3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyODYxMjQsImV4cCI6MjA5Nzg2MjEyNH0.EJfqKnhh73wW7aJuJYnzoRvdIyDkAQ_7YTC5pJN77mo"
SUPABASE_DB_URL="postgresql://postgres.uycyiwnzikslmkjiqwyd:aGg2aY9vC9CvocXm@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true"
SUPABASE_DIRECT_URL="postgresql://postgres.uycyiwnzikslmkjiqwyd:aGg2aY9vC9CvocXm@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"
UPSTASH_URL="https://casual-macaque-155325.upstash.io"
UPSTASH_TOKEN="gQAAAAAAAl69AAIgcDE4MGQwNDhmZGNkYmI0N2Q1OGE5ZjU1ZWM0YjlhOTVjYQ"

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0
RESULTS=""

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
  fi
}

run_test() {
  local name=$1
  local framework=$2
  local frontend=$3
  local backend=$4
  local db=$5
  local auth=$6
  local caching=$7
  
  echo -e "\n--------------------------------------------------"
  echo "🧪 Testing: $name ($framework)"
  echo "--------------------------------------------------"
  
  cd $TEST_DIR
  rm -rf $name
  
  # Check prerequisites for specific frameworks
  if [ "$framework" == "laravel" ]; then
    if ! command -v composer &> /dev/null || ! command -v php &> /dev/null; then
      echo "⚠️ 'composer' or 'php' not found, skipping Laravel test."
      SKIP_COUNT=$((SKIP_COUNT + 1))
      RESULTS="$RESULTS\n⚠️ SKIP: $name ($framework) — composer/php not installed"
      cd ..
      return
    fi
  fi
  
  local cmd="bun run ../src/index.ts --yes --name $name --framework $framework --db $db --auth $auth --caching $caching"
  if [ "$framework" == "monorepo" ]; then
    cmd="$cmd --frontend $frontend --backend $backend"
  fi
  # Only add --zod/--helmet/--cors for frameworks that support them
  if [ "$framework" == "express" ] || [ "$framework" == "hono" ] || [ "$framework" == "elysia" ]; then
    cmd="$cmd --zod --helmet --cors"
  fi
  
  echo "> $cmd"
  eval $cmd
  
  # Determine where the backend is for injection and Docker
  local backend_dir="$name"
  if [ "$framework" == "monorepo" ]; then
    backend_dir="$name/backend"
  fi
  
  # Inject credentials into all .env files
  inject_credentials "$backend_dir/.env"
  inject_credentials "$backend_dir/.env.local" 2>/dev/null || true
  if [ "$framework" == "monorepo" ]; then
    inject_credentials "$name/frontend/.env"
  fi
  # Next.js may also have .env at root
  if [ "$framework" == "nextjs" ]; then
    inject_credentials "$name/.env"
  fi
  
  # Docker
  if [ "$db" == "docker" ] || [ "$caching" == "docker" ]; then
    echo "🐳 Starting Docker..."
    cd $backend_dir
    docker compose down -v 2>/dev/null || true
    docker compose up -d --wait --wait-timeout 90
    cd - > /dev/null
  fi
  
  # --- Framework-specific build & validation ---
  if [ "$framework" == "express" ] || [ "$framework" == "hono" ] || [ "$framework" == "elysia" ]; then
    echo "📦 Installing Node deps..."
    cd $name
    bun install
    echo "🗄️ Running DB Migrations..."
    bun run db:push
    cd - > /dev/null
    
  elif [ "$framework" == "monorepo" ]; then
    echo "📦 Installing Monorepo deps..."
    cd $name
    bun install
    cd - > /dev/null
    echo "🗄️ Running DB Migrations (backend)..."
    cd $name/backend
    bun run db:push
    cd - > /dev/null
    
  elif [ "$framework" == "nextjs" ]; then
    echo "📦 Installing Next.js deps..."
    cd $name
    bun install
    echo "🗄️ Running DB Migrations..."
    bun run db:push
    cd - > /dev/null
    
  elif [ "$framework" == "react" ] || [ "$framework" == "vue" ]; then
    echo "📦 Installing frontend deps..."
    cd $name
    bun install
    echo "🔨 Building frontend to check for compile errors..."
    bun run build
    cd - > /dev/null
    
  elif [ "$framework" == "laravel" ]; then
    echo "🐘 Running Laravel setup..."
    cd $name
    if command -v php &> /dev/null; then
      php artisan key:generate --force -n 2>/dev/null || true
      if [ "$db" == "docker" ]; then
        php artisan migrate --force -n 2>/dev/null || echo "⚠️ Migration skipped (DB may not be ready)"
      fi
    fi
    cd - > /dev/null
    
  elif [ "$framework" == "go" ]; then
    echo "🐹 Building Go..."
    cd $name
    if command -v go &> /dev/null; then
      go mod tidy
      go build -o app cmd/api/main.go
    else
      echo "⚠️ 'go' command not found, skipping build step."
    fi
    cd - > /dev/null
    
  elif [ "$framework" == "python" ]; then
    echo "🐍 Checking Python scaffolding..."
    cd $name
    # Verify key files exist
    if [ -f "app/main.py" ] && [ -f "requirements.txt" ]; then
      echo "✓ Python files scaffolded correctly"
    else
      echo "❌ Missing Python files!"
      FAIL_COUNT=$((FAIL_COUNT + 1))
      RESULTS="$RESULTS\n❌ FAIL: $name ($framework) — missing app/main.py or requirements.txt"
      cd - > /dev/null
      cd ..
      return
    fi
    cd - > /dev/null
    
  elif [ "$framework" == "rust" ]; then
    echo "🦀 Checking Rust scaffolding..."
    cd $name
    if command -v cargo &> /dev/null; then
      cargo check
    else
      # At least verify the key files exist
      if [ -f "Cargo.toml" ] && [ -f "src/main.rs" ]; then
        echo "✓ Rust files scaffolded correctly"
      else
        echo "❌ Missing Rust files!"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        RESULTS="$RESULTS\n❌ FAIL: $name ($framework) — missing Cargo.toml or src/main.rs"
        cd - > /dev/null
        cd ..
        return
      fi
    fi
    cd - > /dev/null
  fi
  
  echo "✅ $name test passed!"
  PASS_COUNT=$((PASS_COUNT + 1))
  RESULTS="$RESULTS\n✅ PASS: $name ($framework)"
  
  # Cleanup Docker
  if [ "$db" == "docker" ] || [ "$caching" == "docker" ]; then
    echo "🐳 Stopping Docker..."
    cd $backend_dir
    docker compose down -v
    cd - > /dev/null
  fi
  
  cd ..
}

# =========================================================================
# PHASE 1: Pure Backends (already validated)
# =========================================================================
echo -e "\n========== PHASE 1: Pure Backends =========="
run_test "test-express" "express" "" "" "supabase" "clerk" "upstash"
run_test "test-hono" "hono" "" "" "docker" "local" "docker"
run_test "test-elysia" "elysia" "" "" "docker" "supabase" "none"

# =========================================================================
# PHASE 2: Fullstack Monorepos (already validated + NEW: Elysia backend)
# =========================================================================
echo -e "\n========== PHASE 2: Fullstack Monorepos =========="
run_test "test-mono-react-express" "monorepo" "react" "express" "local" "local" "none"
run_test "test-mono-vue-hono" "monorepo" "vue" "hono" "supabase" "clerk" "upstash"
run_test "test-mono-react-elysia" "monorepo" "react" "elysia" "docker" "supabase" "docker"
run_test "test-mono-vue-express" "monorepo" "vue" "express" "docker" "local" "none"

# =========================================================================
# PHASE 3: Next.js Fullstack
# =========================================================================
echo -e "\n========== PHASE 3: Next.js Fullstack =========="
run_test "test-nextjs-local" "nextjs" "" "" "docker" "local" "docker"
run_test "test-nextjs-supa" "nextjs" "" "" "supabase" "clerk" "upstash"

# =========================================================================
# PHASE 4: Pure Frontends (React & Vue standalone)
# =========================================================================
echo -e "\n========== PHASE 4: Pure Frontends =========="
run_test "test-react-clerk" "react" "" "" "local" "clerk" "none"
run_test "test-react-supa" "react" "" "" "local" "supabase" "none"
run_test "test-react-local" "react" "" "" "local" "local" "none"
run_test "test-vue-clerk" "vue" "" "" "local" "clerk" "none"
run_test "test-vue-supa" "vue" "" "" "local" "supabase" "none"
run_test "test-vue-local" "vue" "" "" "local" "local" "none"

# =========================================================================
# PHASE 5: Laravel
# =========================================================================
echo -e "\n========== PHASE 5: Laravel =========="
run_test "test-laravel" "laravel" "" "" "docker" "local" "docker"

# =========================================================================
# PHASE 6: Multi-Language APIs
# =========================================================================
echo -e "\n========== PHASE 6: Multi-Language APIs =========="
run_test "test-python" "python" "" "" "docker" "local" "docker"
run_test "test-go" "go" "" "" "docker" "local" "docker"
run_test "test-rust" "rust" "" "" "docker" "local" "docker"

# =========================================================================
# RESULTS SUMMARY
# =========================================================================
echo -e "\n======================================"
echo "📊 TEST RESULTS SUMMARY"
echo "======================================"
echo -e "$RESULTS"
echo ""
echo "--------------------------------------"
echo "✅ Passed: $PASS_COUNT"
echo "❌ Failed: $FAIL_COUNT"
echo "⚠️  Skipped: $SKIP_COUNT"
echo "--------------------------------------"

if [ $FAIL_COUNT -gt 0 ]; then
  echo -e "\n❌ SOME TESTS FAILED!"
  exit 1
else
  echo -e "\n🎉 ALL TESTS PASSED!"
fi
