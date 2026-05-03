import makeWASocket, {
   Browsers,
   DisconnectReason,
   fetchLatestBaileysVersion,
   makeInMemoryStore,
   WAMessageKey,
   downloadMediaMessage,
} from '@itsukichan/baileys'
import {Boom} from '@hapi/boom'
import * as qrcode from 'qrcode'
import qrcodeTerminal from 'qrcode-terminal'
import * as fs from 'fs'
import * as path from 'path'
import type {SessionInfo} from '../types'
import redisClient from './redisClient'
import {deleteRedisAuthState, useRedisAuthState} from './redisAuthState'
import {extractInboundContent, fireMessageWebhooks} from './webhookService'

function resolvePhone(jid: string, sessionId: string, altJid?: string): string | undefined {
   if (altJid?.endsWith('@s.whatsapp.net')) return altJid.split('@')[0]
   if (jid.endsWith('@s.whatsapp.net')) return jid.split('@')[0]
   if (jid.endsWith('@lid')) {
      const store = stores.get(sessionId)
      if (store?.contacts) {
         for (const [contactJid, contact] of Object.entries(store.contacts)) {
            if ((contact as any).lid === jid && contactJid.endsWith('@s.whatsapp.net')) {
               return contactJid.split('@')[0]
            }
         }
      }
   }
   return undefined
}

async function fireCallbacks(info: SessionInfo, status: string): Promise<void> {
   if (!info.callbackUrls?.length) return
   const payload = {
      sessionId: info.id,
      status,
      phoneNumber: info.phoneNumber,
      name: info.name,
   }
   await Promise.allSettled(
      info.callbackUrls.map((url) =>
         fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(5000),
         }).catch((err) => console.error(`[${info.id}] Callback failed for ${url}:`, err))
      )
   )
}

const SESSIONS_DIR = process.env.SESSIONS_DIR || './sessions'
const SESSIONS_FILE = path.join(SESSIONS_DIR, 'sessions.json')
const REDIS_SESSIONS_SET = 'wa:sessions'

if (!fs.existsSync(SESSIONS_DIR)) {
   fs.mkdirSync(SESSIONS_DIR, {recursive: true})
}

const sessions = new Map<string, SessionInfo>()
const stores = new Map<string, ReturnType<typeof makeInMemoryStore>>()


type SessionMeta = {
   id: string
   status: string
   createdAt: string
   connectedAt?: string
   disconnectedAt?: string
   phoneNumber?: string
   name?: string
   callbackUrls?: string[]
   messageWebhookUrls?: string[]
}

const STALE_THRESHOLD_MS = parseInt(process.env.SESSION_STALE_HOURS || '24') * 60 * 60 * 1000

function readSessionsFile(): SessionMeta[] {
   try {
      if (!fs.existsSync(SESSIONS_FILE)) return []
      return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'))
   } catch {
      return []
   }
}

function writeSessionsFile(data: SessionMeta[]): void {
   fs.writeFileSync(SESSIONS_FILE, JSON.stringify(data, null, 2))
}

function upsertSessionInFile(info: SessionInfo): void {
   const all = readSessionsFile()
   const idx = all.findIndex((s) => s.id === info.id)
   const entry: SessionMeta = {
      id: info.id,
      status: info.status,
      createdAt: info.createdAt,
      connectedAt: info.connectedAt,
      disconnectedAt: info.disconnectedAt,
      phoneNumber: info.phoneNumber,
      name: info.name,
      callbackUrls: info.callbackUrls,
      messageWebhookUrls: info.messageWebhookUrls,
   }
   if (idx >= 0) all[idx] = entry
   else all.push(entry)
   writeSessionsFile(all)
}

function removeSessionFromFile(sessionId: string): void {
   const all = readSessionsFile().filter((s) => s.id !== sessionId)
   writeSessionsFile(all)
}


async function registerSessionInRedis(sessionId: string): Promise<void> {
   await redisClient.sAdd(REDIS_SESSIONS_SET, sessionId)
}

async function unregisterSessionFromRedis(sessionId: string): Promise<void> {
   await redisClient.sRem(REDIS_SESSIONS_SET, sessionId)
}

export async function getRegisteredSessionIds(): Promise<string[]> {
   const members = await redisClient.sMembers(REDIS_SESSIONS_SET)
   const arr = Array.from(members)
   return arr.map((m) => (Buffer.isBuffer(m) ? m.toString() : String(m)))
}

export async function createSession(sessionId: string, callbackUrls?: string[], messageWebhookUrls?: string[]): Promise<SessionInfo> {
   if (sessions.has(sessionId)) {
      const existing = sessions.get(sessionId)!
      if (existing.status === 'open') {
         throw new Error(`Session ${sessionId} is already connected`)
      }
      await deleteSession(sessionId, false)
   }

   const sessionInfo: SessionInfo = {
      id: sessionId,
      status: 'initializing',
      createdAt: new Date().toISOString(),
      callbackUrls: callbackUrls ?? [],
      messageWebhookUrls: messageWebhookUrls ?? [],
   }

   sessions.set(sessionId, sessionInfo)
   await registerSessionInRedis(sessionId)
   upsertSessionInFile(sessionInfo)

   const store = makeInMemoryStore({})
   stores.set(sessionId, store)

   const {state, saveCreds} = await useRedisAuthState(sessionId)
   const {version} = await fetchLatestBaileysVersion()

   const socket = makeWASocket({
      version,
      auth: state,
      browser: Browsers.ubuntu('WhatsApp API'),
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      getMessage: async (key: WAMessageKey) => {
         const s = stores.get(sessionId)
         if (s) {
            const msg = await s.loadMessage(key.remoteJid!, key.id!)
            return msg?.message || undefined
         }
         return undefined
      },
   })

   store.bind(socket.ev)
   sessionInfo.socket = socket

   socket.ev.on('connection.update', async (update) => {
      const {connection, lastDisconnect, qr} = update
      const info = sessions.get(sessionId)
      if (!info) return

      if (qr) {
         info.status = 'qr'
         info.qr = qr
         qrcodeTerminal.generate(qr, {small: true}, (qrStr) => {
            console.log(`[${sessionId}] QR Code:\n${qrStr}`)
         })
         try {
            info.qrBase64 = await qrcode.toDataURL(qr)
         } catch (_) {
         }
         upsertSessionInFile(info)
         fireCallbacks(info, 'qr').catch(() => {})
      }

      if (connection === 'close') {
         const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
         const shouldReconnect = statusCode !== DisconnectReason.loggedOut

         console.log(`[${sessionId}] Connection closed. Code: ${statusCode}, Reconnect: ${shouldReconnect}`)

         if (shouldReconnect) {
            info.status = 'connecting'
            sessions.set(sessionId, info)
            upsertSessionInFile(info)
            fireCallbacks(info, 'connecting').catch(() => {})
            setTimeout(() => createSession(sessionId, info.callbackUrls, info.messageWebhookUrls), 3000)
         } else {
            info.status = 'logout'
            info.disconnectedAt = new Date().toISOString()
            sessions.set(sessionId, info)
            upsertSessionInFile(info)
            fireCallbacks(info, 'logout').catch(() => {})
            await unregisterSessionFromRedis(sessionId)
            await deleteRedisAuthState(sessionId)
         }
      }

      if (connection === 'open') {
         info.status = 'open'
         info.qr = undefined
         info.qrBase64 = undefined
         info.connectedAt = new Date().toISOString()

         const user = socket.user
         if (user) {
            info.phoneNumber = user.id.split(':')[0]
            info.name = user.name
         }

         console.log(`[${sessionId}] Connected! Phone: ${info.phoneNumber}`)
         sessions.set(sessionId, info)
         upsertSessionInFile(info)
         fireCallbacks(info, 'open').catch(() => {})
      }
   })

   socket.ev.on('creds.update', saveCreds)

   socket.ev.on('messages.upsert', async ({messages, type}) => {
      if (type !== 'notify') return
      const info = sessions.get(sessionId)

      for (const msg of messages) {
         if (msg.key.fromMe) continue

         const fromJid = msg.key.remoteJid!
         const altJid = (msg.key as any).remoteJidAlt as string | undefined
         // group messages carry the real sender in participant; fall back to remoteJid / altJid
         const senderJid = msg.key.participant ?? fromJid
         const senderPhone = resolvePhone(senderJid, sessionId, altJid)

         if (!info?.messageWebhookUrls?.length) continue

         const {type: msgType, content} = extractInboundContent(msg.message)

         if (['image', 'video', 'audio', 'document', 'sticker'].includes(msgType)) {
            try {
               const buffer = await downloadMediaMessage(msg, 'buffer', {}) as Buffer
               if (buffer?.length) content.data = buffer.toString('base64')
            } catch (err: any) {
               console.error(`[${sessionId}] Media download failed (${msgType}):`, err.message)
            }
         }

         const ts = msg.messageTimestamp
            ? new Date(Number(msg.messageTimestamp) * 1000).toISOString()
            : new Date().toISOString()
         fireMessageWebhooks(info.messageWebhookUrls, {
            sessionId,
            direction: 'inbound',
            messageId: msg.key.id,
            from: fromJid,
            to: info.phoneNumber ? `${info.phoneNumber}@s.whatsapp.net` : sessionId,
            senderPhone,
            timestamp: ts,
            type: msgType,
            content,
            pushName: msg.pushName,
         }).catch((err) => console.error(`[${sessionId}] Inbound webhook error:`, err.message))
      }
   })

   socket.ws.on('error', (err) => {
      console.error(`[${sessionId}] WebSocket error (non-fatal):`, err.message)
   })

   return sessionInfo
}

export function getSession(sessionId: string): SessionInfo | undefined {
   return sessions.get(sessionId)
}

export function getAllSessions(): SessionInfo[] {
   return Array.from(sessions.values()).map((s) => ({
      id: s.id,
      status: s.status,
      createdAt: s.createdAt,
      connectedAt: s.connectedAt,
      phoneNumber: s.phoneNumber,
      name: s.name,
      qrBase64: s.qrBase64,
      callbackUrls: s.callbackUrls ?? [],
   }))
}

export async function deleteSession(sessionId: string, deleteFiles = true): Promise<void> {
   const session = sessions.get(sessionId)
   if (session?.socket) {
      try {
         await session.socket.logout()
      } catch (_) {
         try {
            session.socket.end(undefined)
         } catch (_) {
         }
      }
   }
   sessions.delete(sessionId)
   stores.delete(sessionId)
   await unregisterSessionFromRedis(sessionId)

   if (deleteFiles) {
      await deleteRedisAuthState(sessionId)
      removeSessionFromFile(sessionId)
   }
}

export async function logoutSession(sessionId: string): Promise<void> {
   const session = sessions.get(sessionId)
   if (!session) throw new Error(`Session ${sessionId} not found`)
   if (!session.socket) throw new Error(`Session ${sessionId} has no active socket`)

   await session.socket.logout()
   sessions.delete(sessionId)
   stores.delete(sessionId)
   await unregisterSessionFromRedis(sessionId)
   await deleteRedisAuthState(sessionId)
   removeSessionFromFile(sessionId)
}

export function getStore(sessionId: string) {
   return stores.get(sessionId)
}

export async function restoreStoredSessions(): Promise<void> {
   const sessionIds = await getRegisteredSessionIds()

   if (sessionIds.length === 0) {
      console.log('No sessions to restore from Redis')
      return
   }

   for (const sessionId of sessionIds) {
      const creds = await redisClient.get(`wa:auth:${sessionId}:creds`)
      const credsStr = Buffer.isBuffer(creds) ? creds.toString() : creds
      if (credsStr) {
         console.log(`Restoring session: ${sessionId}`)
         try {
            const meta = readSessionsFile().find((s) => s.id === sessionId)
            await createSession(sessionId, meta?.callbackUrls, meta?.messageWebhookUrls)
         } catch (e) {
            console.error(`Failed to restore session ${sessionId}:`, e)
         }
      } else {
         console.log(`Session ${sessionId} has no creds in Redis, removing`)
         await unregisterSessionFromRedis(sessionId)
         removeSessionFromFile(sessionId)
      }
   }
}

export function getSessionMetaFromFile(sessionId: string): SessionMeta | undefined {
   return readSessionsFile().find((s) => s.id === sessionId)
}

export async function cleanupStaleSessions(): Promise<void> {
   const now = Date.now()
   const all = readSessionsFile()
   const stale = all.filter(
      (s) =>
         s.status === 'logout' &&
         s.disconnectedAt &&
         now - new Date(s.disconnectedAt).getTime() > STALE_THRESHOLD_MS,
   )

   for (const s of stale) {
      console.log(`[Cleanup] Removing stale session ${s.id} (disconnected at ${s.disconnectedAt})`)
      await unregisterSessionFromRedis(s.id)
      await deleteRedisAuthState(s.id)
      removeSessionFromFile(s.id)
      sessions.delete(s.id)
      stores.delete(s.id)
   }

   if (stale.length > 0) {
      console.log(`[Cleanup] Removed ${stale.length} stale session(s)`)
   }
}