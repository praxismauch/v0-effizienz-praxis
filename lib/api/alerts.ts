/**
 * Security Alert System
 * Sends notifications when anomalies or security events are detected
 * Supports Slack webhooks and structured logging
 */
import { appLogger } from "@/lib/logger"

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL
const ALERT_EMAIL = process.env.ALERT_EMAIL

export type AlertSeverity = "info" | "warning" | "critical"

export interface SecurityAlert {
  severity: AlertSeverity
  title: string
  message: string
  details?: Record<string, unknown>
  timestamp?: number
}

const SEVERITY_EMOJI: Record<AlertSeverity, string> = {
  info: "INFO",
  warning: "WARN",
  critical: "CRIT",
}

/**
 * Send a security alert via all configured channels
 */
export async function sendSecurityAlert(alert: SecurityAlert): Promise<void> {
  const timestamp = alert.timestamp || Date.now()
  const logEntry = {
    ...alert,
    timestamp: new Date(timestamp).toISOString(),
  }

  // Always log to structured logger
  const logLevel = alert.severity === "critical" ? "error" : alert.severity === "warning" ? "warn" : "info"
  appLogger[logLevel]("security", `[Security Alert] ${alert.title}: ${alert.message}`, {
    severity: alert.severity,
    ...(alert.details || {}),
  })

  // Send to Slack if configured
  if (SLACK_WEBHOOK_URL) {
    await sendSlackAlert(alert, timestamp).catch((err) =>
      console.error("[Security Alerts] Failed to send Slack alert:", err)
    )
  }

  // Log email alert intent (actual email sending would require a mail service)
  if (ALERT_EMAIL) {
    appLogger.info("security", `Email alert queued for ${ALERT_EMAIL}: ${alert.title}`)
  }

  // Also log to console for server-side visibility
  console.log(`[Security ${SEVERITY_EMOJI[alert.severity]}] ${alert.title}: ${alert.message}`, logEntry.details || "")
}

/**
 * Send alert to Slack webhook
 */
async function sendSlackAlert(alert: SecurityAlert, timestamp: number): Promise<void> {
  if (!SLACK_WEBHOOK_URL) return

  const colorMap: Record<AlertSeverity, string> = {
    info: "#3b82f6",
    warning: "#f59e0b",
    critical: "#ef4444",
  }

  const payload = {
    attachments: [
      {
        color: colorMap[alert.severity],
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `[${SEVERITY_EMOJI[alert.severity]}] ${alert.title}`,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: alert.message,
            },
          },
          ...(alert.details
            ? [
                {
                  type: "section",
                  fields: Object.entries(alert.details).map(([key, value]) => ({
                    type: "mrkdwn",
                    text: `*${key}:*\n${String(value)}`,
                  })),
                },
              ]
            : []),
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `Effizienz Praxis Security | ${new Date(timestamp).toLocaleString("de-DE")}`,
              },
            ],
          },
        ],
      },
    ],
  }

  await fetch(SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

/**
 * Helper: Send rate limit exceeded alert
 */
export async function alertRateLimitExceeded(ip: string, endpoint: string, count: number): Promise<void> {
  await sendSecurityAlert({
    severity: count > 50 ? "critical" : "warning",
    title: "Rate Limit uberschritten",
    message: `IP ${ip} hat das Rate Limit fur ${endpoint} uberschritten`,
    details: { ip, endpoint, blocked_count: count },
  })
}

/**
 * Helper: Send suspicious user-agent alert
 */
export async function alertSuspiciousUserAgent(ip: string, userAgent: string): Promise<void> {
  await sendSecurityAlert({
    severity: "warning",
    title: "Verdachtiger User-Agent erkannt",
    message: `Automatisiertes Tool erkannt von IP ${ip}`,
    details: { ip, user_agent: userAgent },
  })
}

/**
 * Helper: Send RLS policy violation alert
 */
export async function alertRLSViolation(table: string, details: string): Promise<void> {
  await sendSecurityAlert({
    severity: "critical",
    title: "RLS-Richtlinienverletzung",
    message: `Mögliche RLS-Verletzung bei Tabelle "${table}"`,
    details: { table, details },
  })
}

/**
 * Helper: Send IP blocked alert
 */
export async function alertIPBlocked(ip: string, reason: string): Promise<void> {
  await sendSecurityAlert({
    severity: "critical",
    title: "IP-Adresse blockiert",
    message: `IP ${ip} wurde automatisch blockiert`,
    details: { ip, reason },
  })
}
