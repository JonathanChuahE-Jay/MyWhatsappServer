import 'dotenv/config'
import Fastify from 'fastify'
import websocket from '@fastify/websocket'
import { sessionRoutes } from './routes/sessions'
import { messageRoutes } from './routes/messages'
import { utilityRoutes } from './routes/utility'
import { connectRedis } from './services/redisClient'
import { restoreStoredSessions, getAllSessions, cleanupStaleSessions } from './services/sessionManager'

const PORT = parseInt(process.env.PORT || '3000')
const HOST = process.env.HOST || '0.0.0.0'
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

async function main() {
  const fastify = Fastify({ logger: { level: LOG_LEVEL } })

  await fastify.register(websocket)

  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, function (_req, body, done) {
    try {
      done(null, JSON.parse(body as string))
    } catch (err: any) {
      err.statusCode = 400
      done(err, undefined)
    }
  })

  fastify.get('/health', async (_req, reply) => {
    return reply.send({ status: 'ok', timestamp: new Date().toISOString(), sessions: getAllSessions().length })
  })

  fastify.get('/', async (_req, reply) => {
    return reply.send({
      name: 'WhatsApp Multi-Session API',
      version: '1.0.0',
      description: 'Multi-session WhatsApp API powered by Baileys',
      authentication: 'Include X-Api-Key header or Authorization: Bearer <key>',
      endpoints: {
        sessions: {
          'GET /sessions': 'List all sessions',
          'GET /sessions/:id': 'Get session info',
          'POST /sessions': 'Create new session (body: { sessionId })',
          'DELETE /sessions/:id': 'Delete/disconnect session',
          'POST /sessions/:id/logout': 'Logout from WhatsApp',
          'POST /sessions/:id/reconnect': 'Reconnect a disconnected/logged-out session',
          'GET /sessions/:id/qr': 'Get QR code (query: format=base64)',
        },
        messages: {
          'POST /messages/send': 'Send any message type',
          'POST /messages/send-text': 'Quick text shortcut',
          'POST /messages/send-image': 'Quick image shortcut',
          'GET /messages/types': 'List all message types with examples',
        },
        utility: {
          'POST /check-jid': 'Check if JID exists',
          'GET /profile-picture': 'Get profile picture URL',
          'GET /status': 'Get user status',
          'GET /groups': 'List all groups',
          'GET /group-metadata': 'Get group metadata',
          'POST /presence': 'Send presence update',
          'POST /read': 'Mark messages as read',
          'POST /block': 'Block/unblock user',
          'POST /profile/name': 'Update profile name',
          'POST /profile/status': 'Update profile status',
          'POST /groups/create': 'Create group',
          'GET /groups/invite-code': 'Get group invite code',
          'POST /groups/join': 'Join group via invite code',
          'POST /reject-call': 'Reject incoming call',
        },
        websocket: { 'WS /ws': 'Real-time events (query: api_key=<key>)' },
      },
    })
  })

  fastify.get('/ws', { websocket: true }, (socket, req) => {
    const apiKey = process.env.API_KEY
    const clientKey = (req.query as any)?.['api_key'] || req.headers['x-api-key']
    if (apiKey && clientKey !== apiKey) {
      socket.send(JSON.stringify({ error: 'Unauthorized' }))
      socket.close()
      return
    }
    socket.send(JSON.stringify({ type: 'connected', message: 'WebSocket connected' }))
    socket.on('message', (msg: any) => {
      try {
        const data = JSON.parse(msg.toString())
        if (data.type === 'ping') socket.send(JSON.stringify({ type: 'pong' }))
      } catch (_) {}
    })
  })

  await fastify.register(sessionRoutes)
  await fastify.register(messageRoutes)
  await fastify.register(utilityRoutes)

  fastify.setErrorHandler((error, _req, reply) => {
    fastify.log.error(error)
    const statusCode = (error as any).statusCode || 500
    reply.code(statusCode).send({ success: false, error: (error as any).message || 'Internal Server Error' })
  })

  fastify.setNotFoundHandler((_req, reply) => {
    reply.code(404).send({ success: false, error: 'Route not found' })
  })

  await connectRedis()
  console.log('🔄 Restoring saved sessions...')
  await restoreStoredSessions()
  await cleanupStaleSessions()
  setInterval(() => cleanupStaleSessions().catch(console.error), 60 * 60 * 1000)

  await fastify.listen({ port: PORT, host: HOST })
  console.log(`\n🚀 WhatsApp API running on http://${HOST}:${PORT}`)
  console.log(`🔑 API Key: ${process.env.API_KEY ? 'configured' : 'NOT SET (open access!)'}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})