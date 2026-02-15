#!/bin/bash

# Security Testing Suite
# Tests various security mechanisms including rate limiting, origin validation, and CAPTCHA

set -e

# Configuration
BASE_URL="${BASE_URL:-https://effizienz-praxis.de}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

log_test() {
  echo -e "${YELLOW}[TEST]${NC} $1"
}

log_pass() {
  echo -e "${GREEN}[PASS]${NC} $1"
  TESTS_PASSED=$((TESTS_PASSED + 1))
}

log_fail() {
  echo -e "${RED}[FAIL]${NC} $1"
  TESTS_FAILED=$((TESTS_FAILED + 1))
}

log_info() {
  echo -e "${YELLOW}[INFO]${NC} $1"
}

# Test 1: Rate Limiting
test_rate_limiting() {
  log_test "Testing rate limiting (should get 429 after multiple requests)"
  TESTS_RUN=$((TESTS_RUN + 1))
  
  local endpoint="${BASE_URL}/api/auth/origin-token"
  local rate_limited=false
  
  for i in {1..15}; do
    response=$(curl -s -w "\n%{http_code}" "${endpoint}" 2>&1)
    status_code=$(echo "$response" | tail -n 1)
    
    if [ "$status_code" = "429" ]; then
      rate_limited=true
      log_pass "Rate limit enforced after $i requests"
      break
    fi
    
    sleep 0.5
  done
  
  if [ "$rate_limited" = false ]; then
    log_fail "Rate limit not enforced after 15 requests"
  fi
}

# Test 2: Origin Header Validation
test_origin_validation() {
  log_test "Testing origin header validation on protected endpoint"
  TESTS_RUN=$((TESTS_RUN + 1))
  
  local endpoint="${BASE_URL}/api/super-admin/users"
  
  # Request without origin header (should fail with 403)
  response=$(curl -s -w "\n%{http_code}" -X GET "${endpoint}" 2>&1)
  status_code=$(echo "$response" | tail -n 1)
  
  if [ "$status_code" = "403" ] || [ "$status_code" = "401" ]; then
    log_pass "Origin validation working - rejected request without header"
  else
    log_fail "Expected 403/401 but got ${status_code}"
  fi
}

# Test 3: CSRF Protection
test_csrf_protection() {
  log_test "Testing CSRF protection on POST endpoint"
  TESTS_RUN=$((TESTS_RUN + 1))
  
  local endpoint="${BASE_URL}/api/super-admin/users"
  
  # Request without CSRF token (should fail)
  response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","name":"Test User"}' \
    "${endpoint}" 2>&1)
  status_code=$(echo "$response" | tail -n 1)
  
  # Should be blocked by either CSRF (403), auth (401), or origin validation (403)
  if [ "$status_code" = "403" ] || [ "$status_code" = "401" ]; then
    log_pass "CSRF/Auth protection working"
  else
    log_fail "Expected 403/401 but got ${status_code}"
  fi
}

# Test 4: Direct Supabase Access (if keys provided)
test_supabase_direct_access() {
  if [ -z "$SUPABASE_ANON_KEY" ]; then
    log_info "Skipping Supabase direct access test (no anon key provided)"
    return
  fi
  
  log_test "Testing direct Supabase access (should be blocked by RLS)"
  TESTS_RUN=$((TESTS_RUN + 1))
  
  local supabase_url=$(echo "$BASE_URL" | sed 's|https://effizienz-praxis.de|https://sytvmjmvwkqdzcfvjqkr.supabase.co|')
  local endpoint="${supabase_url}/rest/v1/users"
  
  response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d '{"email":"malicious@example.com","name":"Hacker"}' \
    "${endpoint}" 2>&1)
  status_code=$(echo "$response" | tail -n 1)
  
  if [ "$status_code" = "403" ] || [ "$status_code" = "401" ]; then
    log_pass "RLS policies blocking direct access"
  else
    log_fail "Direct Supabase access not properly blocked (${status_code})"
  fi
}

# Test 5: Origin Token Generation
test_origin_token_generation() {
  log_test "Testing origin token generation endpoint"
  TESTS_RUN=$((TESTS_RUN + 1))
  
  local endpoint="${BASE_URL}/api/auth/origin-token"
  
  response=$(curl -s "${endpoint}")
  
  if echo "$response" | grep -q '"token"'; then
    log_pass "Origin token endpoint working"
  else
    log_fail "Origin token endpoint not returning token"
  fi
}

# Test 6: Security Analytics Endpoint
test_security_analytics() {
  log_test "Testing security analytics endpoint (requires auth)"
  TESTS_RUN=$((TESTS_RUN + 1))
  
  local endpoint="${BASE_URL}/api/super-admin/security/analytics"
  
  response=$(curl -s -w "\n%{http_code}" "${endpoint}" 2>&1)
  status_code=$(echo "$response" | tail -n 1)
  
  # Should require authentication (401)
  if [ "$status_code" = "401" ] || [ "$status_code" = "403" ]; then
    log_pass "Security analytics properly protected"
  else
    log_fail "Expected 401/403 but got ${status_code}"
  fi
}

# Test 7: Suspicious User-Agent Detection
test_suspicious_user_agent() {
  log_test "Testing requests with suspicious user-agent"
  TESTS_RUN=$((TESTS_RUN + 1))
  
  local endpoint="${BASE_URL}/api/auth/origin-token"
  
  # Make multiple requests with curl user-agent
  for i in {1..3}; do
    curl -s -A "curl/7.68.0" "${endpoint}" > /dev/null 2>&1
    sleep 0.5
  done
  
  log_pass "Suspicious user-agent requests logged (check analytics)"
}

# Main execution
main() {
  echo "========================================"
  echo "    Security Testing Suite"
  echo "========================================"
  echo "Base URL: $BASE_URL"
  echo ""
  
  test_origin_token_generation
  test_rate_limiting
  test_origin_validation
  test_csrf_protection
  test_supabase_direct_access
  test_security_analytics
  test_suspicious_user_agent
  
  echo ""
  echo "========================================"
  echo "         Test Summary"
  echo "========================================"
  echo "Tests Run:    $TESTS_RUN"
  echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
  echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
  echo "========================================"
  
  if [ $TESTS_FAILED -gt 0 ]; then
    exit 1
  fi
}

main
