/**
 * webhook-server.js — Lightweight GitHub webhook listener
 *
 * Listens for GitHub push events and triggers deploy.sh automatically.
 * Run with PM2:
 *   pm2 start /var/www/mawrid-dev/scripts/webhook-server.js --name mawrid-webhook
 *
 * On GitHub:
 *   Settings → Webhooks → Add webhook
 *   Payload URL: http://YOUR_SERVER_IP:9000/webhook
 *   Content type: application/json
 *   Secret: (same value as WEBHOOK_SECRET below)
 *   Events: Just the push event
 *
 * Environment variables:
 *   WEBHOOK_SECRET   GitHub webhook secret (required)
 *   WEBHOOK_PORT     Port to listen on (default: 9000)
 *   DEPLOY_BRANCH    Branch that triggers deploy (default: main)
 *   APP_DIR          Project root (default: /var/www/mawrid-dev)
 */

const http = require('http')
const crypto = require('crypto')
const { exec } = require('child_process')

const SECRET = process.env.WEBHOOK_SECRET || ''
const PORT   = parseInt(process.env.WEBHOOK_PORT || '9000', 10)
const BRANCH = process.env.DEPLOY_BRANCH || 'main'
const APP_DIR = process.env.APP_DIR || '/var/www/mawrid-dev'

function verifySignature(payload, signature) {
  if (!SECRET) return true  // Skip if no secret configured
  const hmac = crypto.createHmac('sha256', SECRET)
  hmac.update(payload)
  const digest = 'sha256=' + hmac.digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature || ''))
  } catch {
    return false
  }
}

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/webhook') {
    res.writeHead(404).end()
    return
  }

  let body = ''
  req.on('data', (chunk) => { body += chunk })
  req.on('end', () => {
    const signature = req.headers['x-hub-signature-256'] || ''

    if (!verifySignature(body, signature)) {
      console.error('[webhook] Invalid signature — rejected')
      res.writeHead(401).end('Unauthorized')
      return
    }

    let payload
    try { payload = JSON.parse(body) } catch {
      res.writeHead(400).end('Bad JSON')
      return
    }

    const pushedBranch = (payload.ref || '').replace('refs/heads/', '')
    if (pushedBranch !== BRANCH) {
      console.log(`[webhook] Push to ${pushedBranch}, ignoring (watching: ${BRANCH})`)
      res.writeHead(200).end('Ignored')
      return
    }

    const commit = payload.after ? payload.after.slice(0, 7) : 'unknown'
    console.log(`[webhook] Push to ${BRANCH} (${commit}) — triggering deploy`)
    res.writeHead(202).end('Deploying')

    const cmd = `BRANCH=${BRANCH} APP_DIR=${APP_DIR} bash ${APP_DIR}/scripts/deploy.sh >> /var/log/mawrid-deploy.log 2>&1`
    exec(cmd, (err) => {
      if (err) console.error('[webhook] Deploy failed:', err.message)
      else console.log('[webhook] Deploy completed successfully')
    })
  })
})

server.listen(PORT, () => {
  console.log(`[webhook] Listening on port ${PORT}, watching branch: ${BRANCH}`)
})
