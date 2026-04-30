import type {FastifyInstance} from 'fastify'
import {sendMessage} from '../services/messageSender'
import {getSession} from '../services/sessionManager'
import {apiKeyMiddleware} from '../middleware/apiKey'
import type {MessagePayload} from '../types'

export async function messageRoutes(fastify: FastifyInstance) {
   fastify.addHook('preHandler', apiKeyMiddleware)

   function getConnectedSession(sessionId: string, reply: any) {
      const session = getSession(sessionId)
      if (!session) {
         reply.code(404).send({success: false, error: `Session '${sessionId}' not found`})
         return null
      }
      if (session.status !== 'open') {
         reply.code(400).send({
            success: false,
            error: `Session '${sessionId}' is not connected. Status: ${session.status}`
         })
         return null
      }
      return session
   }


   fastify.post<{ Params: { sessionId: string }; Body: { to: string; message: MessagePayload } }>(
      '/messages/:sessionId/send',
      async (req, reply) => {
         const {sessionId} = req.params
         const {to, message} = req.body as any

         if (!to || !message) {
            return reply.code(400).send({success: false, error: 'Missing required fields: to, message'})
         }

         const session = getConnectedSession(sessionId, reply)
         if (!session) return

         try {
            const result = await sendMessage(sessionId, to, message)
            return reply.send({success: true, data: result, message: 'Message sent successfully'})
         } catch (err: any) {
            return reply.code(500).send({success: false, error: err.message})
         }
      }
   )


   fastify.post<{
      Params: { sessionId: string };
      Body: { to: string; text: string; quoted?: any; mentions?: string[]; ai?: boolean }
   }>(
      '/messages/:sessionId/send-text',
      async (req, reply) => {
         const {sessionId} = req.params
         const {to, text, quoted, mentions, ai} = req.body as any

         if (!to || !text) {
            return reply.code(400).send({success: false, error: 'Missing required fields: to, text'})
         }

         const session = getConnectedSession(sessionId, reply)
         if (!session) return

         try {
            const result = await sendMessage(sessionId, to, {type: 'text', text, quoted, mentions, ai})
            return reply.send({success: true, data: result})
         } catch (err: any) {
            return reply.code(500).send({success: false, error: err.message})
         }
      }
   )


   fastify.post<{
      Params: { sessionId: string };
      Body: { to: string; url?: string; base64?: string; caption?: string; viewOnce?: boolean; quoted?: any }
   }>(
      '/messages/:sessionId/send-image',
      async (req, reply) => {
         const {sessionId} = req.params
         const {to, url, base64, caption, viewOnce, quoted} = req.body as any

         if (!to || (!url && !base64)) {
            return reply.code(400).send({success: false, error: 'Missing required fields: to, url or base64'})
         }

         const session = getConnectedSession(sessionId, reply)
         if (!session) return

         try {
            const result = await sendMessage(sessionId, to, {type: 'image', url, base64, caption, viewOnce, quoted})
            return reply.send({success: true, data: result})
         } catch (err: any) {
            return reply.code(500).send({success: false, error: err.message})
         }
      }
   )


   fastify.post<{
      Params: { sessionId: string };
      Body: {
         to: string;
         url: string;
         caption?: string;
         gif?: boolean;
         ptv?: boolean;
         viewOnce?: boolean;
         quoted?: any
      }
   }>(
      '/messages/:sessionId/send-video',
      async (req, reply) => {
         const {sessionId} = req.params
         const {to, url, caption, gif, ptv, viewOnce, quoted} = req.body as any

         if (!to || !url) {
            return reply.code(400).send({success: false, error: 'Missing required fields: to, url'})
         }

         const session = getConnectedSession(sessionId, reply)
         if (!session) return

         try {
            const result = await sendMessage(sessionId, to, {type: 'video', url, caption, gif, ptv, viewOnce, quoted})
            return reply.send({success: true, data: result})
         } catch (err: any) {
            return reply.code(500).send({success: false, error: err.message})
         }
      }
   )


   fastify.post<{
      Params: { sessionId: string };
      Body: { to: string; url: string; mimetype?: string; ptt?: boolean; quoted?: any }
   }>(
      '/messages/:sessionId/send-audio',
      async (req, reply) => {
         const {sessionId} = req.params
         const {to, url, mimetype, ptt, quoted} = req.body as any

         if (!to || !url) {
            return reply.code(400).send({success: false, error: 'Missing required fields: to, url'})
         }

         const session = getConnectedSession(sessionId, reply)
         if (!session) return

         try {
            const result = await sendMessage(sessionId, to, {type: 'audio', url, mimetype, ptt, quoted})
            return reply.send({success: true, data: result})
         } catch (err: any) {
            return reply.code(500).send({success: false, error: err.message})
         }
      }
   )


   fastify.post<{
      Params: { sessionId: string };
      Body: { to: string; url: string; mimetype: string; fileName: string; caption?: string; quoted?: any }
   }>(
      '/messages/:sessionId/send-document',
      async (req, reply) => {
         const {sessionId} = req.params
         const {to, url, mimetype, fileName, caption, quoted} = req.body as any

         if (!to || !url || !mimetype || !fileName) {
            return reply.code(400).send({success: false, error: 'Missing required fields: to, url, mimetype, fileName'})
         }

         const session = getConnectedSession(sessionId, reply)
         if (!session) return

         try {
            const result = await sendMessage(sessionId, to, {
               type: 'document',
               url,
               mimetype,
               fileName,
               caption,
               quoted
            })
            return reply.send({success: true, data: result})
         } catch (err: any) {
            return reply.code(500).send({success: false, error: err.message})
         }
      }
   )


   fastify.post<{
      Params: { sessionId: string };
      Body: {
         to: string;
         latitude: number;
         longitude: number;
         name?: string;
         address?: string;
         live?: boolean;
         quoted?: any
      }
   }>(
      '/messages/:sessionId/send-location',
      async (req, reply) => {
         const {sessionId} = req.params
         const {to, latitude, longitude, name, address, live, quoted} = req.body as any

         if (!to || latitude === undefined || longitude === undefined) {
            return reply.code(400).send({success: false, error: 'Missing required fields: to, latitude, longitude'})
         }

         const session = getConnectedSession(sessionId, reply)
         if (!session) return

         try {
            const result = await sendMessage(sessionId, to, {
               type: 'location',
               latitude,
               longitude,
               name,
               address,
               live,
               quoted
            })
            return reply.send({success: true, data: result})
         } catch (err: any) {
            return reply.code(500).send({success: false, error: err.message})
         }
      }
   )


   fastify.post<{
      Params: { sessionId: string };
      Body: { to: string; displayName: string; vcard: string; quoted?: any }
   }>(
      '/messages/:sessionId/send-contact',
      async (req, reply) => {
         const {sessionId} = req.params
         const {to, displayName, vcard, quoted} = req.body as any

         if (!to || !displayName || !vcard) {
            return reply.code(400).send({success: false, error: 'Missing required fields: to, displayName, vcard'})
         }

         const session = getConnectedSession(sessionId, reply)
         if (!session) return

         try {
            const result = await sendMessage(sessionId, to, {type: 'contact', displayName, vcard, quoted})
            return reply.send({success: true, data: result})
         } catch (err: any) {
            return reply.code(500).send({success: false, error: err.message})
         }
      }
   )


   fastify.post<{
      Params: { sessionId: string };
      Body: { to: string; emoji: string; targetMessageId: string; targetFromMe: boolean }
   }>(
      '/messages/:sessionId/send-reaction',
      async (req, reply) => {
         const {sessionId} = req.params
         const {to, emoji, targetMessageId, targetFromMe} = req.body as any

         if (!to || !emoji || !targetMessageId) {
            return reply.code(400).send({success: false, error: 'Missing required fields: to, emoji, targetMessageId'})
         }

         const session = getConnectedSession(sessionId, reply)
         if (!session) return

         try {
            const result = await sendMessage(sessionId, to, {type: 'reaction', emoji, targetMessageId, targetFromMe})
            return reply.send({success: true, data: result})
         } catch (err: any) {
            return reply.code(500).send({success: false, error: err.message})
         }
      }
   )


   fastify.post<{
      Params: { sessionId: string };
      Body: { to: string; name: string; values: string[]; selectableCount?: number; quoted?: any }
   }>(
      '/messages/:sessionId/send-poll',
      async (req, reply) => {
         const {sessionId} = req.params
         const {to, name, values, selectableCount, quoted} = req.body as any

         if (!to || !name || !values?.length) {
            return reply.code(400).send({success: false, error: 'Missing required fields: to, name, values'})
         }

         const session = getConnectedSession(sessionId, reply)
         if (!session) return

         try {
            const result = await sendMessage(sessionId, to, {type: 'poll', name, values, selectableCount, quoted})
            return reply.send({success: true, data: result})
         } catch (err: any) {
            return reply.code(500).send({success: false, error: err.message})
         }
      }
   )


   fastify.post<{ Params: { sessionId: string }; Body: { to: string; url: string; quoted?: any } }>(
      '/messages/:sessionId/send-sticker',
      async (req, reply) => {
         const {sessionId} = req.params
         const {to, url, quoted} = req.body as any

         if (!to || !url) {
            return reply.code(400).send({success: false, error: 'Missing required fields: to, url'})
         }

         const session = getConnectedSession(sessionId, reply)
         if (!session) return

         try {
            const result = await sendMessage(sessionId, to, {type: 'sticker', url, quoted})
            return reply.send({success: true, data: result})
         } catch (err: any) {
            return reply.code(500).send({success: false, error: err.message})
         }
      }
   )


   fastify.post<{
      Params: { sessionId: string };
      Body: {
         to: string;
         text?: string;
         caption?: string;
         footer?: string;
         image?: string;
         buttons: Array<{ id: string; text: string }>;
         quoted?: any
      }
   }>(
      '/messages/:sessionId/send-buttons',
      async (req, reply) => {
         const {sessionId} = req.params
         const {to, text, caption, footer, image, buttons, quoted} = req.body as any

         if (!to || !buttons?.length) {
            return reply.code(400).send({success: false, error: 'Missing required fields: to, buttons'})
         }

         const session = getConnectedSession(sessionId, reply)
         if (!session) return

         try {
            const result = await sendMessage(sessionId, to, {
               type: 'buttons',
               text,
               caption,
               footer,
               image,
               buttons,
               quoted
            })
            return reply.send({success: true, data: result})
         } catch (err: any) {
            return reply.code(500).send({success: false, error: err.message})
         }
      }
   )


   fastify.post<{
      Params: { sessionId: string };
      Body: {
         to: string;
         text: string;
         buttonText: string;
         sections: any[];
         footer?: string;
         title?: string;
         quoted?: any
      }
   }>(
      '/messages/:sessionId/send-list',
      async (req, reply) => {
         const {sessionId} = req.params
         const {to, text, buttonText, sections, footer, title, quoted} = req.body as any

         if (!to || !text || !buttonText || !sections?.length) {
            return reply.code(400).send({
               success: false,
               error: 'Missing required fields: to, text, buttonText, sections'
            })
         }

         const session = getConnectedSession(sessionId, reply)
         if (!session) return

         try {
            const result = await sendMessage(sessionId, to, {
               type: 'list',
               text,
               buttonText,
               sections,
               footer,
               title,
               quoted
            })
            return reply.send({success: true, data: result})
         } catch (err: any) {
            return reply.code(500).send({success: false, error: err.message})
         }
      }
   )


   fastify.post<{
      Params: { sessionId: string };
      Body: {
         to: string;
         text?: string;
         caption?: string;
         title?: string;
         subtitle?: string;
         footer?: string;
         image?: string;
         video?: string;
         hasMediaAttachment?: boolean;
         buttons: any[];
         quoted?: any
      }
   }>(
      '/messages/:sessionId/send-interactive',
      async (req, reply) => {
         const {sessionId} = req.params
         const {
            to,
            text,
            caption,
            title,
            subtitle,
            footer,
            image,
            video,
            hasMediaAttachment,
            buttons,
            quoted
         } = req.body as any

         if (!to || !buttons?.length) {
            return reply.code(400).send({success: false, error: 'Missing required fields: to, buttons'})
         }

         const session = getConnectedSession(sessionId, reply)
         if (!session) return

         try {
            const result = await sendMessage(sessionId, to, {
               type: 'interactive',
               text,
               caption,
               title,
               subtitle,
               footer,
               image,
               video,
               hasMediaAttachment,
               buttons,
               quoted
            })
            return reply.send({success: true, data: result})
         } catch (err: any) {
            return reply.code(500).send({success: false, error: err.message})
         }
      }
   )


   fastify.post<{
      Params: { sessionId: string };
      Body: {
         to: string;
         text?: string;
         title?: string;
         subtitle?: string;
         footer?: string;
         cards: any[];
         quoted?: any
      }
   }>(
      '/messages/:sessionId/send-cards',
      async (req, reply) => {
         const {sessionId} = req.params
         const {to, text, title, subtitle, footer, cards, quoted} = req.body as any

         if (!to || !cards?.length) {
            return reply.code(400).send({success: false, error: 'Missing required fields: to, cards'})
         }

         const session = getConnectedSession(sessionId, reply)
         if (!session) return

         try {
            const result = await sendMessage(sessionId, to, {
               type: 'cards',
               text,
               title,
               subtitle,
               footer,
               cards,
               quoted
            })
            return reply.send({success: true, data: result})
         } catch (err: any) {
            return reply.code(500).send({success: false, error: err.message})
         }
      }
   )


   fastify.post<{ Params: { sessionId: string }; Body: { to: string; items: any[]; quoted?: any } }>(
      '/messages/:sessionId/send-album',
      async (req, reply) => {
         const {sessionId} = req.params
         const {to, items, quoted} = req.body as any

         if (!to || !items?.length) {
            return reply.code(400).send({success: false, error: 'Missing required fields: to, items'})
         }

         const session = getConnectedSession(sessionId, reply)
         if (!session) return

         try {
            const result = await sendMessage(sessionId, to, {type: 'album', items, quoted})
            return reply.send({success: true, data: result})
         } catch (err: any) {
            return reply.code(500).send({success: false, error: err.message})
         }
      }
   )


   fastify.post<{
      Params: { sessionId: string };
      Body: { to: string; messageId: string; fromMe: boolean; duration: 86400 | 604800 | 2592000; remove?: boolean }
   }>(
      '/messages/:sessionId/send-pin',
      async (req, reply) => {
         const {sessionId} = req.params
         const {to, messageId, fromMe, duration, remove} = req.body as any

         if (!to || !messageId) {
            return reply.code(400).send({success: false, error: 'Missing required fields: to, messageId'})
         }

         const session = getConnectedSession(sessionId, reply)
         if (!session) return

         try {
            const result = await sendMessage(sessionId, to, {type: 'pin', messageId, fromMe, duration, remove})
            return reply.send({success: true, data: result})
         } catch (err: any) {
            return reply.code(500).send({success: false, error: err.message})
         }
      }
   )


   fastify.post<{ Params: { sessionId: string }; Body: { to: string; messageId: string; fromMe: boolean } }>(
      '/messages/:sessionId/send-delete',
      async (req, reply) => {
         const {sessionId} = req.params
         const {to, messageId, fromMe} = req.body as any

         if (!to || !messageId) {
            return reply.code(400).send({success: false, error: 'Missing required fields: to, messageId'})
         }

         const session = getConnectedSession(sessionId, reply)
         if (!session) return

         try {
            const result = await sendMessage(sessionId, to, {type: 'delete', messageId, fromMe})
            return reply.send({success: true, data: result})
         } catch (err: any) {
            return reply.code(500).send({success: false, error: err.message})
         }
      }
   )


   fastify.post<{
      Params: { sessionId: string };
      Body: { to: string; messageId: string; fromMe: boolean; newText: string }
   }>(
      '/messages/:sessionId/send-edit',
      async (req, reply) => {
         const {sessionId} = req.params
         const {to, messageId, fromMe, newText} = req.body as any

         if (!to || !messageId || !newText) {
            return reply.code(400).send({success: false, error: 'Missing required fields: to, messageId, newText'})
         }

         const session = getConnectedSession(sessionId, reply)
         if (!session) return

         try {
            const result = await sendMessage(sessionId, to, {type: 'edit', messageId, fromMe, newText})
            return reply.send({success: true, data: result})
         } catch (err: any) {
            return reply.code(500).send({success: false, error: err.message})
         }
      }
   )


   fastify.post<{
      Params: { sessionId: string };
      Body: { to: string; messageId: string; fromJid: string; fromMe: boolean; force?: boolean }
   }>(
      '/messages/:sessionId/send-forward',
      async (req, reply) => {
         const {sessionId} = req.params
         const {to, messageId, fromJid, fromMe, force} = req.body as any

         if (!to || !messageId || !fromJid) {
            return reply.code(400).send({success: false, error: 'Missing required fields: to, messageId, fromJid'})
         }

         const session = getConnectedSession(sessionId, reply)
         if (!session) return

         try {
            const result = await sendMessage(sessionId, to, {type: 'forward', messageId, fromJid, fromMe, force})
            return reply.send({success: true, data: result})
         } catch (err: any) {
            return reply.code(500).send({success: false, error: err.message})
         }
      }
   )


   fastify.post<{
      Params: { sessionId: string };
      Body: {
         to: string;
         name: string;
         startTime: number;
         endTime: number;
         description?: string;
         latitude?: number;
         longitude?: number;
         locationName?: string;
         callType?: 'audio' | 'video';
         isCanceled?: boolean;
         extraGuestsAllowed?: boolean;
         quoted?: any
      }
   }>(
      '/messages/:sessionId/send-event',
      async (req, reply) => {
         const {sessionId} = req.params
         const {
            to,
            name,
            startTime,
            endTime,
            description,
            latitude,
            longitude,
            locationName,
            callType,
            isCanceled,
            extraGuestsAllowed,
            quoted
         } = req.body as any

         if (!to || !name || !startTime || !endTime) {
            return reply.code(400).send({
               success: false,
               error: 'Missing required fields: to, name, startTime, endTime'
            })
         }

         const session = getConnectedSession(sessionId, reply)
         if (!session) return

         try {
            const result = await sendMessage(sessionId, to, {
               type: 'event',
               name,
               startTime,
               endTime,
               description,
               latitude,
               longitude,
               locationName,
               callType,
               isCanceled,
               extraGuestsAllowed,
               quoted
            })
            return reply.send({success: true, data: result})
         } catch (err: any) {
            return reply.code(500).send({success: false, error: err.message})
         }
      }
   )


   fastify.post<{
      Params: { sessionId: string };
      Body: {
         to: string;
         note?: string;
         currency?: string;
         amount?: string;
         expiry?: number;
         from?: string;
         quoted?: any
      }
   }>(
      '/messages/:sessionId/send-payment',
      async (req, reply) => {
         const {sessionId} = req.params
         const {to, note, currency, amount, expiry, from, quoted} = req.body as any

         if (!to) {
            return reply.code(400).send({success: false, error: 'Missing required field: to'})
         }

         const session = getConnectedSession(sessionId, reply)
         if (!session) return

         try {
            const result = await sendMessage(sessionId, to, {
               type: 'payment',
               note,
               currency,
               amount,
               expiry,
               from,
               quoted
            })
            return reply.send({success: true, data: result})
         } catch (err: any) {
            return reply.code(500).send({success: false, error: err.message})
         }
      }
   )


   fastify.post<{
      Params: { sessionId: string };
      Body: {
         to: string;
         groupJid: string;
         groupName: string;
         code: string;
         caption?: string;
         expiration?: number;
         quoted?: any
      }
   }>(
      '/messages/:sessionId/send-group-invite',
      async (req, reply) => {
         const {sessionId} = req.params
         const {to, groupJid, groupName, code, caption, expiration, quoted} = req.body as any

         if (!to || !groupJid || !groupName || !code) {
            return reply.code(400).send({
               success: false,
               error: 'Missing required fields: to, groupJid, groupName, code'
            })
         }

         const session = getConnectedSession(sessionId, reply)
         if (!session) return

         try {
            const result = await sendMessage(sessionId, to, {
               type: 'groupInvite',
               groupJid,
               groupName,
               code,
               caption,
               expiration,
               quoted
            })
            return reply.send({success: true, data: result})
         } catch (err: any) {
            return reply.code(500).send({success: false, error: err.message})
         }
      }
   )


   fastify.post<{ Params: { sessionId: string }; Body: { to: string; name: string; callType?: 1 | 2; quoted?: any } }>(
      '/messages/:sessionId/send-call',
      async (req, reply) => {
         const {sessionId} = req.params
         const {to, name, callType, quoted} = req.body as any

         if (!to || !name) {
            return reply.code(400).send({success: false, error: 'Missing required fields: to, name'})
         }

         const session = getConnectedSession(sessionId, reply)
         if (!session) return

         try {
            const result = await sendMessage(sessionId, to, {type: 'call', name, callType, quoted})
            return reply.send({success: true, data: result})
         } catch (err: any) {
            return reply.code(500).send({success: false, error: err.message})
         }
      }
   )


   fastify.get('/messages/types', async (_req, reply) => {
      return reply.send({
         success: true,
         data: {
            routes: [
               'POST /messages/:sessionId/send',
               'POST /messages/:sessionId/send-text',
               'POST /messages/:sessionId/send-image',
               'POST /messages/:sessionId/send-video',
               'POST /messages/:sessionId/send-audio',
               'POST /messages/:sessionId/send-document',
               'POST /messages/:sessionId/send-location',
               'POST /messages/:sessionId/send-contact',
               'POST /messages/:sessionId/send-reaction',
               'POST /messages/:sessionId/send-poll',
               'POST /messages/:sessionId/send-sticker',
               'POST /messages/:sessionId/send-buttons',
               'POST /messages/:sessionId/send-list',
               'POST /messages/:sessionId/send-interactive',
               'POST /messages/:sessionId/send-cards',
               'POST /messages/:sessionId/send-album',
               'POST /messages/:sessionId/send-pin',
               'POST /messages/:sessionId/send-delete',
               'POST /messages/:sessionId/send-edit',
               'POST /messages/:sessionId/send-forward',
               'POST /messages/:sessionId/send-event',
               'POST /messages/:sessionId/send-payment',
               'POST /messages/:sessionId/send-group-invite',
               'POST /messages/:sessionId/send-call',
            ],
         },
      })
   })
}