import type {FastifyInstance} from 'fastify'
import {getSession} from '../services/sessionManager'
import {apiKeyMiddleware} from '../middleware/apiKey'

export async function utilityRoutes(fastify: FastifyInstance) {
   fastify.addHook('preHandler', apiKeyMiddleware)

   fastify.post<{ Body: { sessionId: string; jid: string } }>('/check-jid', async (req, reply) => {
      const {sessionId, jid} = req.body as any
      const session = getSession(sessionId)
      if (!session?.socket) return reply.code(404).send({success: false, error: 'Session not found or not connected'})
      try {
         const [result] = await (session.socket as any).onWhatsApp(jid)
         return reply.send({success: true, data: result})
      } catch (e: any) {
         return reply.code(500).send({success: false, error: e.message})
      }
   })


   fastify.get<{ Querystring: { sessionId: string; jid: string } }>('/profile-picture', async (req, reply) => {
      const {sessionId, jid} = req.query as any
      const session = getSession(sessionId)
      if (!session?.socket) return reply.code(404).send({success: false, error: 'Session not found or not connected'})
      try {
         const url = await session.socket.profilePictureUrl(jid)
         return reply.send({success: true, data: {url}})
      } catch (e: any) {
         return reply.code(500).send({success: false, error: e.message})
      }
   })


   fastify.get<{ Querystring: { sessionId: string; jid: string } }>('/status', async (req, reply) => {
      const {sessionId, jid} = req.query as any
      const session = getSession(sessionId)
      if (!session?.socket) return reply.code(404).send({success: false, error: 'Session not found'})
      try {
         const status = await session.socket.fetchStatus(jid)
         return reply.send({success: true, data: status})
      } catch (e: any) {
         return reply.code(500).send({success: false, error: e.message})
      }
   })


   fastify.get<{ Querystring: { sessionId: string } }>('/groups', async (req, reply) => {
      const {sessionId} = req.query as any
      const session = getSession(sessionId)
      if (!session?.socket) return reply.code(404).send({success: false, error: 'Session not found'})
      try {
         const groups = await session.socket.groupFetchAllParticipating()
         return reply.send({success: true, data: groups})
      } catch (e: any) {
         return reply.code(500).send({success: false, error: e.message})
      }
   })


   fastify.get<{ Querystring: { sessionId: string; jid: string } }>('/group-metadata', async (req, reply) => {
      const {sessionId, jid} = req.query as any
      const session = getSession(sessionId)
      if (!session?.socket) return reply.code(404).send({success: false, error: 'Session not found'})
      try {
         const metadata = await session.socket.groupMetadata(jid)
         return reply.send({success: true, data: metadata})
      } catch (e: any) {
         return reply.code(500).send({success: false, error: e.message})
      }
   })


   fastify.post<{ Body: { sessionId: string; jid: string; presence: string } }>(
      '/presence',
      async (req, reply) => {
         const {sessionId, jid, presence} = req.body as any
         const session = getSession(sessionId)
         if (!session?.socket) return reply.code(404).send({success: false, error: 'Session not found'})
         try {
            await session.socket.sendPresenceUpdate(presence as any, jid)
            return reply.send({success: true})
         } catch (e: any) {
            return reply.code(500).send({success: false, error: e.message})
         }
      }
   )


   fastify.post<{ Body: { sessionId: string; jid: string; messageId: string; fromMe: boolean } }>(
      '/read',
      async (req, reply) => {
         const {sessionId, jid, messageId, fromMe} = req.body as any
         const session = getSession(sessionId)
         if (!session?.socket) return reply.code(404).send({success: false, error: 'Session not found'})
         try {
            await session.socket.readMessages([{remoteJid: jid, id: messageId, fromMe}])
            return reply.send({success: true})
         } catch (e: any) {
            return reply.code(500).send({success: false, error: e.message})
         }
      }
   )


   fastify.post<{ Body: { sessionId: string; jid: string; action: 'block' | 'unblock' } }>(
      '/block',
      async (req, reply) => {
         const {sessionId, jid, action} = req.body as any
         const session = getSession(sessionId)
         if (!session?.socket) return reply.code(404).send({success: false, error: 'Session not found'})
         try {
            await session.socket.updateBlockStatus(jid, action)
            return reply.send({success: true})
         } catch (e: any) {
            return reply.code(500).send({success: false, error: e.message})
         }
      }
   )


   fastify.post<{ Body: { sessionId: string; name: string } }>('/profile/name', async (req, reply) => {
      const {sessionId, name} = req.body as any
      const session = getSession(sessionId)
      if (!session?.socket) return reply.code(404).send({success: false, error: 'Session not found'})
      try {
         await session.socket.updateProfileName(name)
         return reply.send({success: true})
      } catch (e: any) {
         return reply.code(500).send({success: false, error: e.message})
      }
   })


   fastify.post<{ Body: { sessionId: string; status: string } }>('/profile/status', async (req, reply) => {
      const {sessionId, status} = req.body as any
      const session = getSession(sessionId)
      if (!session?.socket) return reply.code(404).send({success: false, error: 'Session not found'})
      try {
         await session.socket.updateProfileStatus(status)
         return reply.send({success: true})
      } catch (e: any) {
         return reply.code(500).send({success: false, error: e.message})
      }
   })


   fastify.post<{ Body: { sessionId: string; name: string; participants: string[] } }>(
      '/groups/create',
      async (req, reply) => {
         const {sessionId, name, participants} = req.body as any
         const session = getSession(sessionId)
         if (!session?.socket) return reply.code(404).send({success: false, error: 'Session not found'})
         try {
            const group = await session.socket.groupCreate(name, participants)
            return reply.send({success: true, data: group})
         } catch (e: any) {
            return reply.code(500).send({success: false, error: e.message})
         }
      }
   )


   fastify.get<{ Querystring: { sessionId: string; jid: string } }>('/groups/invite-code', async (req, reply) => {
      const {sessionId, jid} = req.query as any
      const session = getSession(sessionId)
      if (!session?.socket) return reply.code(404).send({success: false, error: 'Session not found'})
      try {
         const code = await session.socket.groupInviteCode(jid)
         return reply.send({success: true, data: {code, link: `https://chat.whatsapp.com/${code}`}})
      } catch (e: any) {
         return reply.code(500).send({success: false, error: e.message})
      }
   })


   fastify.post<{ Body: { sessionId: string; code: string } }>('/groups/join', async (req, reply) => {
      const {sessionId, code} = req.body as any
      const session = getSession(sessionId)
      if (!session?.socket) return reply.code(404).send({success: false, error: 'Session not found'})
      try {
         const result = await session.socket.groupAcceptInvite(code)
         return reply.send({success: true, data: {jid: result}})
      } catch (e: any) {
         return reply.code(500).send({success: false, error: e.message})
      }
   })


   fastify.post<{ Body: { sessionId: string; callId: string; callFrom: string } }>(
      '/reject-call',
      async (req, reply) => {
         const {sessionId, callId, callFrom} = req.body as any
         const session = getSession(sessionId)
         if (!session?.socket) return reply.code(404).send({success: false, error: 'Session not found'})
         try {
            await session.socket.rejectCall(callId, callFrom)
            return reply.send({success: true})
         } catch (e: any) {
            return reply.code(500).send({success: false, error: e.message})
         }
      }
   )
}