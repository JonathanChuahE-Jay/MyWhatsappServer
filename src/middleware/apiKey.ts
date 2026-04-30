import type {FastifyReply, FastifyRequest} from 'fastify'

export async function apiKeyMiddleware(request: FastifyRequest, reply: FastifyReply) {
   const apiKey = process.env.API_KEY
   if (!apiKey) {
      return
   }

   const headerKey =
      request.headers['x-api-key'] ||
      request.headers['authorization']?.replace('Bearer ', '')

   if (!headerKey || headerKey !== apiKey) {
      return reply.code(401).send({
         success: false,
         error: 'Unauthorized',
         message: 'Invalid or missing API key. Provide it via X-Api-Key header or Authorization: Bearer <key>',
      })
   }
}