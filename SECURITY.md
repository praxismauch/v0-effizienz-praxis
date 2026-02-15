# Security Documentation

## Overview

This application implements multiple layers of security protection to prevent unauthorized access, bot attacks, and abuse. The security system includes origin validation, rate limiting, progressive CAPTCHA, and anomaly detection.

## Security Layers

### 1. Origin Header Validation

**Purpose:** Distinguish legitimate app traffic from direct API calls (curl, Postman, bots)

**How it works:**
- Server issues signed tokens via `/api/auth/origin-token`
- Tokens include timestamp and HMAC signature
- Tokens expire after 5 minutes
- Client automatically attaches `X-App-Origin` header to requests
- Server validates signature and timestamp

**Configuration:**
```bash
APP_ORIGIN_SECRET=<64-char-hex-string>  # Generate with: openssl rand -hex 32
```

**Usage in code:**
```typescript
import { api } from '@/lib/api/client'

// Automatically includes origin header
const response = await api.post('/api/endpoint', { data })
```

**Bypass for testing:**
Set `APP_ORIGIN_SECRET=` (empty) to disable validation in development

### 2. Rate Limiting

**Purpose:** Prevent brute force attacks and API abuse

**Implementation:**
- Redis-based distributed rate limiting (Upstash)
- Different limits for different operations
- Fallback to in-memory limits if Redis unavailable

**Rate Limits:**
- Auth operations: 5 requests/minute
- Password reset: 3 requests/5 minutes
- Standard API: 100 requests/minute
- AI operations: 10 requests/minute
- File uploads: 20 requests/minute
- Email sending: 10 requests/minute

**Usage:**
```typescript
import { withSecurity } from '@/lib/api/security'

export const POST = withSecurity(
  { rateLimit: 'auth' },
  async (request) => {
    // Your handler code
  }
)
```

### 3. Progressive CAPTCHA

**Purpose:** Human verification for suspicious traffic

**How it works:**
- Tracks failed attempts per IP in Redis
- Thresholds:
  - 0-3 failures: No CAPTCHA
  - 4-10 failures: CAPTCHA required (status 449)
  - 11+ failures: Temporary IP block (1 hour)

**Configuration:**
```bash
HCAPTCHA_SECRET_KEY=<secret-key>
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=<site-key>
```

**Get keys:** https://www.hcaptcha.com

**Client handling:**
```typescript
// The api client automatically handles 449 responses
// Shows CAPTCHA modal and retries with token
const response = await api.post('/api/auth/login', credentials)
```

### 4. Anomaly Detection

**Purpose:** Identify and respond to suspicious patterns

**Detects:**
- High frequency requests (>100/hour from single IP)
- Multiple endpoint scanning (>20 endpoints)
- Suspicious user-agents (curl, postman, bots)
- Repeated rate limit blocks

**Automatic responses:**
- Escalated rate limits for suspicious IPs
- Temporary IP blocks (configurable duration)
- Security event logging to Redis
- Alert generation for monitoring

### 5. CSRF Protection

**Purpose:** Prevent cross-site request forgery attacks

**Implementation:**
- Double Submit Cookie pattern
- Automatic validation for POST/PUT/PATCH/DELETE
- Constant-time comparison to prevent timing attacks

**Usage:**
```typescript
export const POST = withSecurity(
  { csrf: true },
  async (request) => {
    // CSRF automatically validated
  }
)
```

## Security Analytics

### Viewing Analytics

Access the security dashboard at: `/super-admin/security` (requires super admin role)

**Metrics available:**
- Total requests in last N hours
- Rate limit blocks
- CAPTCHA challenges issued/solved
- Top IPs by request volume
- Top endpoints by traffic
- Active security alerts
- Blocked IPs and reasons

### API Endpoint

```bash
GET /api/super-admin/security/analytics?hours=24
```

**Response:**
```json
{
  "totalRequests": 12453,
  "blockedRequests": 23,
  "captchaRequests": 45,
  "topIPs": [
    { "ip": "203.0.113.42", "count": 234 }
  ],
  "topEndpoints": [
    { "endpoint": "/api/practices/dashboard-stats", "count": 2341 }
  ],
  "alerts": [
    {
      "type": "high_frequency",
      "ip": "198.51.100.10",
      "severity": "high",
      "details": "125 requests in last hour",
      "timestamp": 1709654400000
    }
  ]
}
```

## Testing Security

### Automated Tests

Run the security test suite:

```bash
chmod +x scripts/test-security.sh
BASE_URL=https://your-domain.com ./scripts/test-security.sh
```

### Manual Testing

**Test 1: Rate Limiting**
```bash
# Should get 429 after 5 requests
for i in {1..10}; do
  curl https://your-domain.com/api/auth/origin-token
  sleep 0.5
done
```

**Test 2: Origin Validation**
```bash
# Should get 403 (no origin header)
curl -X POST https://your-domain.com/api/super-admin/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Test 3: CAPTCHA Trigger**
```bash
# Make multiple failed login attempts
for i in {1..12}; do
  curl -X POST https://your-domain.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  sleep 0.5
done
# 11th attempt should return 449 (CAPTCHA required)
```

**Test 4: Supabase RLS**
```bash
# Should get 403 (RLS blocks unauthorized insert)
curl -X POST https://[PROJECT_REF].supabase.co/rest/v1/users \
  -H "apikey: [ANON_KEY]" \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"email":"malicious@example.com"}'
```

## Configuration Options

### Security Middleware Options

```typescript
interface SecurityOptions {
  /** Rate limit type */
  rateLimit?: 'auth' | 'api' | 'ai' | 'upload' | 'email' | false
  
  /** Custom rate limit config */
  rateLimitConfig?: RateLimitConfig
  
  /** Enable CSRF validation */
  csrf?: boolean
  
  /** Zod schema for body validation */
  bodySchema?: z.ZodSchema
  
  /** Zod schema for query params validation */
  querySchema?: z.ZodSchema
  
  /** Enable origin header validation */
  originValidation?: boolean | 'auto'  // 'auto' = smart detection
  
  /** Enable progressive CAPTCHA */
  captcha?: boolean
}
```

### Environment Variables

```bash
# Required for rate limiting
KV_REST_API_URL=<upstash-redis-url>
KV_REST_API_TOKEN=<upstash-redis-token>

# Required for origin validation
APP_ORIGIN_SECRET=<64-char-hex-string>

# Required for CAPTCHA
HCAPTCHA_SECRET_KEY=<secret-key>
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=<site-key>

# Optional for alerts
SLACK_WEBHOOK_URL=<webhook-url>
ALERT_EMAIL=<admin-email>
```

## Common Scenarios

### Protecting a New API Route

```typescript
import { withSecurity } from '@/lib/api/security'

export const POST = withSecurity(
  {
    rateLimit: 'api',           // 100 req/min
    csrf: true,                 // Validate CSRF token
    originValidation: true,     // Require X-App-Origin
    captcha: true,              // Progressive CAPTCHA
  },
  async (request, { body }) => {
    // Your secure handler code
    return NextResponse.json({ success: true })
  }
)
```

### Handling Blocked Users

If a legitimate user is blocked:

1. Check security analytics for their IP
2. Use Redis CLI to unblock:
   ```bash
   redis-cli -u $KV_REST_API_URL --pass $KV_REST_API_TOKEN
   DEL security:block:203.0.113.42
   DEL captcha:failures:203.0.113.42
   ```

### Adjusting Thresholds

Edit `/lib/api/captcha.ts`:
```typescript
const CAPTCHA_THRESHOLD = 4   // Require CAPTCHA after N failures
const BLOCK_THRESHOLD = 11     // Block IP after N failures
```

Edit `/lib/api/rate-limit-redis.ts` for rate limits:
```typescript
auth: new Ratelimit({
  limiter: Ratelimit.slidingWindow(5, "60 s"),  // 5 per minute
})
```

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Monitor analytics daily** - Check for unusual patterns
3. **Keep dependencies updated** - Run `npm audit` regularly
4. **Test after changes** - Run security test suite
5. **Document exemptions** - If bypassing security, document why
6. **Use HTTPS only** - Never disable SSL/TLS
7. **Validate all inputs** - Use Zod schemas
8. **Log security events** - Essential for forensics
9. **Have an incident response plan** - Know what to do if breached
10. **Regular security audits** - Schedule quarterly reviews

## Incident Response

If you detect a security breach:

1. **Immediate Actions:**
   - Block the attacking IP
   - Review security logs
   - Check for data exfiltration
   - Rotate secrets/tokens if compromised

2. **Investigation:**
   - Check `/api/super-admin/security/analytics`
   - Review Supabase logs
   - Examine Redis security events
   - Identify attack vector

3. **Mitigation:**
   - Patch vulnerability
   - Update security rules
   - Notify affected users
   - Document incident

4. **Recovery:**
   - Restore from backups if needed
   - Verify system integrity
   - Implement additional monitoring
   - Update security policies

## Support

For security concerns or questions:
- **Internal:** Contact the development team
- **Security issues:** Report to security@your-domain.com
- **Documentation:** See `/v0_plans/innovative-plan.md`

## Updates

Last updated: 2026-02-16
Security framework version: 1.0.0
