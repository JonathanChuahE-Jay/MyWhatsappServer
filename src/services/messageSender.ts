import type { WASocket, WAMessage } from '@itsukichan/baileys'
import { getSession, getStore } from './sessionManager'
import type { MessagePayload, QuotedMessage } from '../types'

async function getQuotedMessage(socket: WASocket, sessionId: string, quoted?: QuotedMessage) {
  if (!quoted) return undefined
  const store = getStore(sessionId)
  if (store) {
    const msg = await store.loadMessage(quoted.fromJid, quoted.messageId)
    if (msg) return msg
  }

  return {
    key: {
      remoteJid: quoted.fromJid,
      fromMe: quoted.fromMe,
      id: quoted.messageId,
    },
    message: { conversation: '' },
  } as unknown as WAMessage
}

export async function sendMessage(
  sessionId: string,
  to: string,
  payload: MessagePayload
): Promise<{ id?: string }> {
  const session = getSession(sessionId)
  if (!session) throw new Error(`Session '${sessionId}' not found`)
  if (session.status !== 'open') throw new Error(`Session '${sessionId}' is not connected (status: ${session.status})`)

  const socket = session.socket!


  const jid = normalizeJid(to)

  switch (payload.type) {
    case 'text': {
      const quoted = await getQuotedMessage(socket, sessionId, payload.quoted)
      const result = await socket.sendMessage(
        jid,
        {
          text: payload.text,
          mentions: payload.mentions,
        },
        { quoted: quoted as any, ...(payload.ai ? { ai: payload.ai } : {}) } as any
      )
      return { id: result?.key?.id }
    }

    case 'image': {
      const quoted = await getQuotedMessage(socket, sessionId, payload.quoted)
      const imageContent: any = { caption: payload.caption, viewOnce: payload.viewOnce }
      if (payload.url) imageContent.image = { url: payload.url }
      else if (payload.base64) {
        const buf = Buffer.from(payload.base64, 'base64')
        imageContent.image = buf
      }
      const result = await socket.sendMessage(jid, imageContent, { quoted: quoted as any })
      return { id: result?.key?.id }
    }

    case 'video': {
      const quoted = await getQuotedMessage(socket, sessionId, payload.quoted)
      const videoContent: any = {
        video: { url: payload.url },
        caption: payload.caption,
        gifPlayback: payload.gif,
        ptv: payload.ptv,
        viewOnce: payload.viewOnce,
      }
      const result = await socket.sendMessage(jid, videoContent, { quoted: quoted as any })
      return { id: result?.key?.id }
    }

    case 'audio': {
      const quoted = await getQuotedMessage(socket, sessionId, payload.quoted)
      const result = await socket.sendMessage(
        jid,
        {
          audio: { url: payload.url! },
          mimetype: payload.mimetype || 'audio/mp4',
          ptt: payload.ptt,
        },
        { quoted: quoted as any }
      )
      return { id: result?.key?.id }
    }

    case 'document': {
      const quoted = await getQuotedMessage(socket, sessionId, payload.quoted)
      const result = await socket.sendMessage(
        jid,
        {
          document: { url: payload.url },
          mimetype: payload.mimetype,
          fileName: payload.fileName,
          caption: payload.caption,
        },
        { quoted: quoted as any }
      )
      return { id: result?.key?.id }
    }

    case 'location': {
      const quoted = await getQuotedMessage(socket, sessionId, payload.quoted)
      const result = await socket.sendMessage(
        jid,
        {
          location: {
            degreesLatitude: payload.latitude,
            degreesLongitude: payload.longitude,
            name: payload.name,
            address: payload.address,
          },
          live: payload.live,
        } as any,
        { quoted: quoted as any }
      )
      return { id: result?.key?.id }
    }

    case 'contact': {
      const quoted = await getQuotedMessage(socket, sessionId, payload.quoted)
      const result = await socket.sendMessage(
        jid,
        {
          contacts: {
            displayName: payload.displayName,
            contacts: [{ vcard: payload.vcard }],
          },
        },
        { quoted: quoted as any }
      )
      return { id: result?.key?.id }
    }

    case 'reaction': {
      const result = await socket.sendMessage(jid, {
        react: {
          text: payload.emoji,
          key: {
            remoteJid: jid,
            fromMe: payload.targetFromMe,
            id: payload.targetMessageId,
          },
        },
      })
      return { id: result?.key?.id }
    }

    case 'poll': {
      const quoted = await getQuotedMessage(socket, sessionId, payload.quoted)
      const result = await socket.sendMessage(
        jid,
        {
          poll: {
            name: payload.name,
            values: payload.values,
            selectableCount: payload.selectableCount ?? 1,
            toAnnouncementGroup: payload.toAnnouncementGroup ?? false,
          },
        },
        { quoted: quoted as any }
      )
      return { id: result?.key?.id }
    }

    case 'buttons': {
      const quoted = await getQuotedMessage(socket, sessionId, payload.quoted)
      const content: any = {
        footer: payload.footer,
        buttons: payload.buttons.map((b) => ({
          buttonId: b.id,
          buttonText: { displayText: b.text },
        })),
      }
      if (payload.image) {
        content.image = { url: payload.image }
        content.caption = payload.text || payload.caption
      } else {
        content.text = payload.text
      }
      const result = await socket.sendMessage(jid, content, { quoted: quoted as any })
      return { id: result?.key?.id }
    }

    case 'list': {
      const quoted = await getQuotedMessage(socket, sessionId, payload.quoted)
      const result = await socket.sendMessage(
        jid,
        {
          text: payload.text,
          footer: payload.footer,
          title: payload.title,
          buttonText: payload.buttonText,
          sections: payload.sections,
        } as any,
        { quoted: quoted as any }
      )
      return { id: result?.key?.id }
    }

    case 'interactive': {
      const quoted = await getQuotedMessage(socket, sessionId, payload.quoted)
      const content: any = {
        title: payload.title,
        subtitle: payload.subtitle,
        footer: payload.footer,
        interactiveButtons: payload.buttons,
        hasMediaAttachment: payload.hasMediaAttachment ?? false,
      }
      if (payload.image) {
        content.image = { url: payload.image }
        content.caption = payload.text || payload.caption
      } else if (payload.video) {
        content.video = { url: payload.video }
        content.caption = payload.text || payload.caption
      } else {
        content.text = payload.text || ''
      }
      const result = await socket.sendMessage(jid, content, { quoted: quoted as any })
      return { id: result?.key?.id }
    }

    case 'sticker': {
      const quoted = await getQuotedMessage(socket, sessionId, payload.quoted)
      const result = await socket.sendMessage(
        jid,
        { sticker: { url: payload.url } },
        { quoted: quoted as any }
      )
      return { id: result?.key?.id }
    }

    case 'forward': {
      const store = getStore(sessionId)
      if (!store) throw new Error('Store not available')
      const msg = await store.loadMessage(payload.fromJid, payload.messageId)
      if (!msg) throw new Error('Message to forward not found in store')
      const result = await socket.sendMessage(jid, {
        forward: msg,
        force: payload.force !== undefined ? payload.force : true,
      } as any)
      return { id: result?.key?.id }
    }

    case 'pin': {
      const result = await socket.sendMessage(jid, {
        pin: {
          type: payload.remove ? 2 : 1,
          time: payload.duration,
          key: {
            remoteJid: jid,
            fromMe: payload.fromMe,
            id: payload.messageId,
          },
        },
      } as any)
      return { id: result?.key?.id }
    }

    case 'delete': {
      const result = await socket.sendMessage(jid, {
        delete: {
          remoteJid: jid,
          fromMe: payload.fromMe,
          id: payload.messageId,
        },
      })
      return { id: result?.key?.id }
    }

    case 'edit': {
      const result = await socket.sendMessage(jid, {
        text: payload.newText,
        edit: {
          remoteJid: jid,
          fromMe: payload.fromMe,
          id: payload.messageId,
        },
      } as any)
      return { id: result?.key?.id }
    }

    case 'event': {
      const quoted = await getQuotedMessage(socket, sessionId, payload.quoted)
      const eventContent: any = {
        event: {
          isCanceled: payload.isCanceled ?? false,
          name: payload.name,
          description: payload.description,
          location: payload.latitude !== undefined
            ? {
                degreesLatitude: payload.latitude,
                degreesLongitude: payload.longitude!,
                name: payload.locationName,
              }
            : undefined,
          call: payload.callType,
          startTime: payload.startTime,
          endTime: payload.endTime,
          extraGuestsAllowed: payload.extraGuestsAllowed ?? true,
        },
      }
      const result = await socket.sendMessage(jid, eventContent, { quoted: quoted as any })
      return { id: result?.key?.id }
    }

    case 'cards': {
      const quoted = await getQuotedMessage(socket, sessionId, payload.quoted)
      const content: any = {
        text: payload.text,
        title: payload.title,
        subtitle: payload.subtitle,
        footer: payload.footer,
        cards: payload.cards.map((c) => {
          const card: any = {
            title: c.title,
            body: c.body,
            footer: c.footer,
            buttons: c.buttons,
          }
          if (c.imageUrl) card.image = { url: c.imageUrl }
          else if (c.videoUrl) card.video = { url: c.videoUrl }
          return card
        }),
      }
      const result = await socket.sendMessage(jid, content, { quoted: quoted as any })
      return { id: result?.key?.id }
    }

    case 'album': {
      const quoted = await getQuotedMessage(socket, sessionId, payload.quoted)
      const album = payload.items.map((item) => {
        if (item.imageUrl) return { image: { url: item.imageUrl }, caption: item.caption }
        if (item.videoUrl) return { video: { url: item.videoUrl }, caption: item.caption }
        return {}
      })
      const result = await socket.sendMessage(jid, { album } as any, { quoted: quoted as any })
      return { id: result?.key?.id }
    }

    case 'statusMention': {
      const content: any = {}
      const opts: any = { statusJidList: payload.jids }

      if (payload.mediaType === 'text') {
        content.text = payload.text
        if (payload.font) content.font = payload.font
        if (payload.textColor) content.textColor = payload.textColor
        if (payload.backgroundColor) content.backgroundColor = payload.backgroundColor
      } else if (payload.mediaType === 'image') {
        content.image = { url: payload.imageUrl }
        if (payload.caption) content.caption = payload.caption
      } else if (payload.mediaType === 'video') {
        content.video = { url: payload.videoUrl }
        if (payload.caption) content.caption = payload.caption
      } else if (payload.mediaType === 'audio') {
        content.audio = { url: payload.audioUrl }
        content.mimetype = 'audio/mp4'
        content.ptt = true
        if (payload.backgroundColor) content.backgroundColor = payload.backgroundColor
      }

      const result = await (socket as any).sendStatusMentions(content, payload.jids)
      return { id: result?.key?.id }
    }

    case 'payment': {
      const quoted = await getQuotedMessage(socket, sessionId, payload.quoted)
      const result = await socket.sendMessage(
        jid,
        {
          payment: {
            note: payload.note,
            currency: payload.currency,
            amount: payload.amount,
            expiry: payload.expiry,
            from: payload.from,
          },
        } as any,
        { quoted: quoted as any }
      )
      return { id: result?.key?.id }
    }

    case 'groupInvite': {
      const quoted = await getQuotedMessage(socket, sessionId, payload.quoted)
      const result = await socket.sendMessage(
        jid,
        {
          groupInvite: {
            jid: payload.groupJid,
            name: payload.groupName,
            caption: payload.caption,
            code: payload.code,
            expiration: payload.expiration ?? 86400,
          },
        } as any,
        { quoted: quoted as any }
      )
      return { id: result?.key?.id }
    }

    case 'call': {
      const quoted = await getQuotedMessage(socket, sessionId, payload.quoted)
      const result = await socket.sendMessage(
        jid,
        {
          call: {
            name: payload.name,
            type: payload.callType ?? 1,
          },
        } as any,
        { quoted: quoted as any }
      )
      return { id: result?.key?.id }
    }

    default:
      throw new Error(`Unknown message type: ${(payload as any).type}`)
  }
}

function normalizeJid(jid: string): string {
  if (jid.includes('@')) return jid

  if (jid.includes('-')) return `${jid}@g.us`

  return `${jid}@s.whatsapp.net`
}