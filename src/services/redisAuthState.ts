import {AuthenticationState, BufferJSON, initAuthCreds, proto} from '@itsukichan/baileys'
import redisClient from './redisClient'

const KEY_MAP: Record<string, string> = {
   'pre-key': 'preKeys',
   'session': 'sessions',
   'sender-key': 'senderKeys',
   'app-state-sync-key': 'appStateSyncKeys',
   'app-state-sync-version': 'appStateVersions',
   'sender-key-memory': 'senderKeyMemory',
}

export async function useRedisAuthState(sessionId: string): Promise<{
   state: AuthenticationState
   saveCreds: () => Promise<void>
}> {
   const prefix = `wa:auth:${sessionId}`

   async function readData(key: string): Promise<any> {
      try {
         const raw = await redisClient.get(`${prefix}:${key}`)
         if (!raw) return null
         const data = Buffer.isBuffer(raw) ? raw.toString('utf-8') : String(raw)
         return JSON.parse(data, BufferJSON.reviver)
      } catch {
         return null
      }
   }

   async function writeData(key: string, value: any): Promise<void> {
      await redisClient.set(`${prefix}:${key}`, JSON.stringify(value, BufferJSON.replacer))
   }

   async function removeData(key: string): Promise<void> {
      await redisClient.del(`${prefix}:${key}`)
   }

   const creds = (await readData('creds')) || initAuthCreds()

   const state: AuthenticationState = {
      creds,
      keys: {
         get: async (type, ids) => {
            const data: Record<string, any> = {}
            await Promise.all(
               ids.map(async (id) => {
                  let value = await readData(`${KEY_MAP[type] || type}:${id}`)
                  if (type === 'app-state-sync-key' && value) {
                     value = proto.Message.AppStateSyncKeyData.fromObject(value)
                  }
                  data[id] = value
               })
            )
            return data
         },
         set: async (data) => {
            await Promise.all(
               Object.entries(data).flatMap(([type, ids]) =>
                  Object.entries(ids as Record<string, any>).map(([id, value]) => {
                     const key = `${KEY_MAP[type] || type}:${id}`
                     return value ? writeData(key, value) : removeData(key)
                  })
               )
            )
         },
      },
   }

   return {
      state,
      saveCreds: async () => {
         await writeData('creds', state.creds)
      },
   }
}

export async function deleteRedisAuthState(sessionId: string): Promise<void> {
   const prefix = `wa:auth:${sessionId}`
   const keys = await redisClient.keys(`${prefix}:*`)
   if (keys.length > 0) {
      await redisClient.del(keys)
   }
}