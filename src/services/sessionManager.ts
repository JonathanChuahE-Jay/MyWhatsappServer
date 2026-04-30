import makeWASocket, {
   Browsers,
   DisconnectReason,
   fetchLatestBaileysVersion,
   makeInMemoryStore,
   WAMessageKey,
} from '@itsukichan/baileys'
import {Boom} from '@hapi/boom'
import * as qrcode from 'qrcode'
import qrcodeTerminal from 'qrcode-terminal'
import * as fs from 'fs'
import * as path from 'path'
import type {SessionInfo} from '../types'
import redisClient from './redisClient'
import {deleteRedisAuthState, useRedisAuthState} from './redisAuthState'

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
   phoneNumber?: string
   name?: string
}

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
      phoneNumber: info.phoneNumber,
      name: info.name,
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

export async function createSession(sessionId: string): Promise<SessionInfo> {
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
      }

      if (connection === 'close') {
         const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
         const shouldReconnect = statusCode !== DisconnectReason.loggedOut

         console.log(`[${sessionId}] Connection closed. Code: ${statusCode}, Reconnect: ${shouldReconnect}`)

         if (shouldReconnect) {
            info.status = 'connecting'
            sessions.set(sessionId, info)
            upsertSessionInFile(info)
            setTimeout(() => createSession(sessionId), 3000)
         } else {
            info.status = 'logout'
            sessions.set(sessionId, info)
            upsertSessionInFile(info)
            await unregisterSessionFromRedis(sessionId)
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
      }
   })

   socket.ev.on('creds.update', saveCreds)

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
            await createSession(sessionId)
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