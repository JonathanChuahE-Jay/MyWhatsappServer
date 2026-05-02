import type {FastifyInstance} from 'fastify'
import {z} from 'zod'
import {createSession, deleteSession, getAllSessions, getSession, getSessionMetaFromFile, logoutSession,} from '../services/sessionManager'
import {apiKeyMiddleware} from '../middleware/apiKey'

const sessionIdSchema = z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/)

export async function sessionRoutes(fastify: FastifyInstance) {
   fastify.addHook('preHandler', apiKeyMiddleware)


   fastify.get('/sessions', async (_req, reply) => {
      const sessions = getAllSessions()
      return reply.send({success: true, data: sessions})
   })


   fastify.get<{ Params: { id: string } }>('/sessions/:id', async (req, reply) => {
      const {id} = req.params
      const session = getSession(id)
      if (!session) {
         return reply.code(404).send({success: false, error: 'Session not found'})
      }
      const {socket: _socket, ...safe} = session as any
      return reply.send({success: true, data: safe})
   })


   fastify.post<{ Body: { sessionId: string; callbackUrls?: string[] } }>('/sessions', async (req, reply) => {
      const body = req.body as any
      const parseResult = sessionIdSchema.safeParse(body?.sessionId)

      if (!parseResult.success) {
         return reply.code(400).send({
            success: false,
            error: 'Invalid sessionId. Use only alphanumeric, dash, underscore. Max 64 chars.',
         })
      }

      const callbackUrls: string[] = Array.isArray(body?.callbackUrls) ? body.callbackUrls : []
      const invalidUrl = callbackUrls.find((u) => {
         try { new URL(u); return false } catch { return true }
      })
      if (invalidUrl) {
         return reply.code(400).send({success: false, error: `Invalid callbackUrl: ${invalidUrl}`})
      }

      const sessionId = parseResult.data

      try {
         const session = await createSession(sessionId, callbackUrls)
         const {socket: _socket, ...safe} = session as any
         return reply.code(201).send({success: true, data: safe, message: 'Session created. Scan QR code to connect.'})
      } catch (err: any) {
         return reply.code(400).send({success: false, error: err.message})
      }
   })


   fastify.delete<{ Params: { id: string } }>('/sessions/:id', async (req, reply) => {
      const {id} = req.params
      const session = getSession(id)
      if (!session) {
         return reply.code(404).send({success: false, error: 'Session not found'})
      }
      await deleteSession(id)
      return reply.send({success: true, message: `Session ${id} deleted`})
   })


   fastify.post<{ Params: { id: string } }>('/sessions/:id/logout', async (req, reply) => {
      const {id} = req.params
      const session = getSession(id)
      if (!session) {
         return reply.code(404).send({success: false, error: 'Session not found'})
      }
      try {
         await logoutSession(id)
         return reply.send({success: true, message: `Session ${id} logged out`})
      } catch (err: any) {
         return reply.code(500).send({success: false, error: err.message})
      }
   })


   fastify.post<{ Params: { id: string } }>('/sessions/:id/reconnect', async (req, reply) => {
      const {id} = req.params

      const session = getSession(id)
      if (session?.status === 'open') {
         return reply.code(409).send({success: false, error: `Session ${id} is already connected`})
      }

      let existingCallbackUrls: string[] | undefined
      if (!session) {
         const meta = getSessionMetaFromFile(id)
         if (!meta) {
            return reply.code(404).send({success: false, error: 'Session not found'})
         }
         existingCallbackUrls = meta.callbackUrls
      } else {
         existingCallbackUrls = session.callbackUrls
      }

      try {
         const newSession = await createSession(id, existingCallbackUrls)
         const {socket: _socket, ...safe} = newSession as any
         return reply.send({success: true, data: safe, message: 'Session reconnecting. Scan QR code if needed.'})
      } catch (err: any) {
         return reply.code(400).send({success: false, error: err.message})
      }
   })


   fastify.get<{ Params: { id: string }; Querystring: { format?: string } }>(
      '/sessions/:id/qr',
      async (req, reply) => {
         const {id} = req.params
         const {format} = req.query as any

         const session = getSession(id)
         if (!session) {
            return reply.code(404).send({success: false, error: 'Session not found'})
         }

         if (session.status === 'open') {
            return reply.send({success: true, message: 'Session already connected', status: 'open'})
         }

         if (!session.qr) {
            return reply.send({
               success: false,
               error: 'No QR code available yet. Session may still be initializing.',
               status: session.status,
            })
         }

         if (format === 'base64') {
            return reply.send({success: true, data: {qrBase64: session.qrBase64, status: session.status}})
         }

         return reply.send({
            success: true,
            data: {qr: session.qr, qrBase64: session.qrBase64, status: session.status},
         })
      }
   )
}