import type { MessagePayload } from '../types'

export interface MessageWebhookPayload {
  sessionId: string
  direction: 'inbound' | 'outbound'
  messageId?: string
  from: string
  to: string
  senderPhone?: string
  recipientPhone?: string
  timestamp: string
  type: string
  content: Record<string, any>
  pushName?: string
}

export function phoneFromJid(jid: string | undefined): string | undefined {
  if (!jid) return undefined
  if (jid.endsWith('@s.whatsapp.net')) return jid.split('@')[0]
  return undefined
}

export async function fireMessageWebhooks(urls: string[], payload: MessageWebhookPayload): Promise<void> {
  if (!urls.length) return
  await Promise.allSettled(
    urls.map((url) =>
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      }).catch((err) => console.error(`[Webhook] POST failed for ${url}:`, err.message))
    )
  )
}

export function extractInboundContent(message: any): { type: string; content: Record<string, any> } {
  if (!message) return { type: 'unknown', content: {} }

  if (message.conversation)
    return { type: 'text', content: { text: message.conversation } }

  if (message.extendedTextMessage)
    return { type: 'text', content: { text: message.extendedTextMessage.text } }

  if (message.imageMessage)
    return { type: 'image', content: { caption: message.imageMessage.caption ?? null, mimetype: message.imageMessage.mimetype ?? 'image/jpeg' } }

  if (message.videoMessage)
    return { type: 'video', content: { caption: message.videoMessage.caption ?? null, gif: message.videoMessage.gifPlayback ?? false, mimetype: message.videoMessage.mimetype ?? 'video/mp4' } }

  if (message.audioMessage)
    return { type: 'audio', content: { ptt: message.audioMessage.ptt ?? false, mimetype: message.audioMessage.mimetype ?? 'audio/ogg; codecs=opus' } }

  if (message.documentMessage)
    return { type: 'document', content: { fileName: message.documentMessage.fileName ?? null, mimetype: message.documentMessage.mimetype ?? 'application/octet-stream', caption: message.documentMessage.caption ?? null } }

  if (message.stickerMessage)
    return { type: 'sticker', content: { mimetype: message.stickerMessage.mimetype ?? 'image/webp' } }

  if (message.locationMessage)
    return { type: 'location', content: { latitude: message.locationMessage.degreesLatitude, longitude: message.locationMessage.degreesLongitude, name: message.locationMessage.name ?? null } }

  if (message.contactMessage)
    return { type: 'contact', content: { displayName: message.contactMessage.displayName } }

  if (message.contactsArrayMessage)
    return { type: 'contact', content: { displayName: message.contactsArrayMessage.displayName } }

  if (message.reactionMessage)
    return { type: 'reaction', content: { emoji: message.reactionMessage.text, targetMessageId: message.reactionMessage.key?.id } }

  if (message.pollCreationMessage)
    return { type: 'poll', content: { name: message.pollCreationMessage.name, options: message.pollCreationMessage.options?.map((o: any) => o.optionName) } }

  if (message.pollUpdateMessage)
    return { type: 'poll_update', content: { pollMessageId: message.pollUpdateMessage.pollCreationMessageKey?.id } }

  if (message.buttonsMessage)
    return { type: 'buttons', content: { text: message.buttonsMessage.contentText } }

  if (message.listMessage)
    return { type: 'list', content: { title: message.listMessage.title, description: message.listMessage.description } }

  if (message.listResponseMessage)
    return { type: 'list_response', content: { title: message.listResponseMessage.title, selectedRowId: message.listResponseMessage.singleSelectReply?.selectedRowId } }

  if (message.buttonsResponseMessage)
    return { type: 'buttons_response', content: { selectedButtonId: message.buttonsResponseMessage.selectedButtonId, selectedDisplayText: message.buttonsResponseMessage.selectedDisplayText } }

  if (message.interactiveResponseMessage)
    return { type: 'interactive_response', content: { body: message.interactiveResponseMessage.body } }

  if (message.templateMessage)
    return { type: 'template', content: {} }

  if (message.eventMessage)
    return { type: 'event', content: { name: message.eventMessage.name, startTime: message.eventMessage.startTime } }

  const firstKey = Object.keys(message)[0]
  return { type: firstKey ?? 'unknown', content: {} }
}

export function extractOutboundContent(payload: MessagePayload): Record<string, any> {
  switch (payload.type) {
    case 'text':
      return { text: payload.text }
    case 'image':
      return { caption: payload.caption ?? null, url: payload.url ?? null }
    case 'video':
      return { caption: payload.caption ?? null, url: payload.url ?? null, gif: payload.gif ?? false }
    case 'audio':
      return { ptt: payload.ptt ?? false, url: payload.url ?? null }
    case 'document':
      return { fileName: payload.fileName, mimetype: payload.mimetype, url: payload.url }
    case 'location':
      return { latitude: payload.latitude, longitude: payload.longitude, name: payload.name ?? null }
    case 'contact':
      return { displayName: payload.displayName }
    case 'reaction':
      return { emoji: payload.emoji, targetMessageId: payload.targetMessageId }
    case 'poll':
      return { name: payload.name, values: payload.values }
    case 'sticker':
      return { url: payload.url }
    case 'buttons':
      return { text: payload.text ?? null, buttons: payload.buttons }
    case 'list':
      return { text: payload.text, buttonText: payload.buttonText }
    case 'interactive':
      return { text: payload.text ?? null, buttons: payload.buttons }
    case 'cards':
      return { text: payload.text ?? null, cardCount: payload.cards.length }
    case 'album':
      return { itemCount: payload.items.length }
    case 'pin':
      return { messageId: payload.messageId, duration: payload.duration, remove: payload.remove ?? false }
    case 'delete':
      return { messageId: payload.messageId }
    case 'edit':
      return { messageId: payload.messageId, newText: payload.newText }
    case 'forward':
      return { messageId: payload.messageId, fromJid: payload.fromJid }
    case 'event':
      return { name: payload.name, startTime: payload.startTime, endTime: payload.endTime }
    case 'payment':
      return { note: payload.note ?? null, currency: payload.currency ?? null, amount: payload.amount ?? null }
    case 'groupInvite':
      return { groupJid: payload.groupJid, groupName: payload.groupName }
    case 'call':
      return { name: payload.name, callType: payload.callType ?? 1 }
    default:
      return {}
  }
}
