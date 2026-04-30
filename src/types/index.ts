import type { WASocket } from '@itsukichan/baileys'

export type SessionStatus = 'initializing' | 'qr' | 'connecting' | 'open' | 'close' | 'logout'

export interface SessionInfo {
  id: string
  status: SessionStatus
  qr?: string
  qrBase64?: string
  socket?: WASocket
  createdAt: string
  connectedAt?: string
  phoneNumber?: string
  name?: string
}

export interface SessionStore {
  [sessionId: string]: SessionInfo
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface TextMessagePayload {
  type: 'text'
  text: string
  quoted?: QuotedMessage
  mentions?: string[]
  linkPreview?: boolean
  ai?: boolean
}

export interface ImageMessagePayload {
  type: 'image'
  url?: string
  base64?: string
  caption?: string
  quoted?: QuotedMessage
  mentions?: string[]
  viewOnce?: boolean
}

export interface VideoMessagePayload {
  type: 'video'
  url?: string
  caption?: string
  gif?: boolean
  ptv?: boolean
  quoted?: QuotedMessage
  viewOnce?: boolean
}

export interface AudioMessagePayload {
  type: 'audio'
  url?: string
  mimetype?: string
  ptt?: boolean
  quoted?: QuotedMessage
}

export interface DocumentMessagePayload {
  type: 'document'
  url: string
  mimetype: string
  fileName: string
  caption?: string
  quoted?: QuotedMessage
}

export interface LocationMessagePayload {
  type: 'location'
  latitude: number
  longitude: number
  name?: string
  address?: string
  live?: boolean
  quoted?: QuotedMessage
}

export interface ContactMessagePayload {
  type: 'contact'
  displayName: string
  vcard: string
  quoted?: QuotedMessage
}

export interface ReactionMessagePayload {
  type: 'reaction'
  emoji: string
  targetMessageId: string
  targetFromMe: boolean
}

export interface PollMessagePayload {
  type: 'poll'
  name: string
  values: string[]
  selectableCount?: number
  toAnnouncementGroup?: boolean
  quoted?: QuotedMessage
}

export interface ButtonsMessagePayload {
  type: 'buttons'
  text?: string
  caption?: string
  footer?: string
  image?: string
  buttons: Array<{ id: string; text: string }>
  quoted?: QuotedMessage
}

export interface ListMessagePayload {
  type: 'list'
  text: string
  footer?: string
  title?: string
  buttonText: string
  sections: Array<{
    title: string
    rows: Array<{ title: string; rowId: string; description?: string }>
  }>
  quoted?: QuotedMessage
}

export interface InteractiveMessagePayload {
  type: 'interactive'
  text?: string
  caption?: string
  title?: string
  subtitle?: string
  footer?: string
  image?: string
  video?: string
  hasMediaAttachment?: boolean
  buttons: InteractiveButton[]
  quoted?: QuotedMessage
}

export interface InteractiveButton {
  name: string
  buttonParamsJson: string
}

export interface StickerMessagePayload {
  type: 'sticker'
  url: string
  quoted?: QuotedMessage
}

export interface ForwardMessagePayload {
  type: 'forward'
  messageId: string
  fromJid: string
  fromMe: boolean
  force?: boolean
}

export interface PinMessagePayload {
  type: 'pin'
  messageId: string
  fromMe: boolean
  duration: 86400 | 604800 | 2592000
  remove?: boolean
}

export interface DeleteMessagePayload {
  type: 'delete'
  messageId: string
  fromMe: boolean
}

export interface EditMessagePayload {
  type: 'edit'
  messageId: string
  fromMe: boolean
  newText: string
}

export interface EventMessagePayload {
  type: 'event'
  name: string
  description?: string
  latitude?: number
  longitude?: number
  locationName?: string
  callType?: 'audio' | 'video'
  startTime: number
  endTime: number
  isCanceled?: boolean
  extraGuestsAllowed?: boolean
  quoted?: QuotedMessage
}

export interface CardsMessagePayload {
  type: 'cards'
  text?: string
  title?: string
  subtitle?: string
  footer?: string
  cards: Array<{
    imageUrl?: string
    videoUrl?: string
    title?: string
    body?: string
    footer?: string
    buttons: Array<{ name: string; buttonParamsJson: string }>
  }>
  quoted?: QuotedMessage
}

export interface AlbumMessagePayload {
  type: 'album'
  items: Array<{
    imageUrl?: string
    videoUrl?: string
    caption?: string
  }>
  quoted?: QuotedMessage
}

export interface StatusMentionPayload {
  type: 'statusMention'
  mediaType: 'text' | 'image' | 'video' | 'audio'
  text?: string
  imageUrl?: string
  videoUrl?: string
  audioUrl?: string
  caption?: string
  font?: number
  textColor?: string
  backgroundColor?: string
  jids: string[]
}

export interface PaymentMessagePayload {
  type: 'payment'
  note?: string
  currency?: string
  amount?: string
  expiry?: number
  from?: string
  quoted?: QuotedMessage
}

export interface GroupInviteMessagePayload {
  type: 'groupInvite'
  groupJid: string
  groupName: string
  caption?: string
  code: string
  expiration?: number
  quoted?: QuotedMessage
}

export interface CallMessagePayload {
  type: 'call'
  name: string
  callType?: 1 | 2
  quoted?: QuotedMessage
}

export type MessagePayload =
  | TextMessagePayload
  | ImageMessagePayload
  | VideoMessagePayload
  | AudioMessagePayload
  | DocumentMessagePayload
  | LocationMessagePayload
  | ContactMessagePayload
  | ReactionMessagePayload
  | PollMessagePayload
  | ButtonsMessagePayload
  | ListMessagePayload
  | InteractiveMessagePayload
  | StickerMessagePayload
  | ForwardMessagePayload
  | PinMessagePayload
  | DeleteMessagePayload
  | EditMessagePayload
  | EventMessagePayload
  | CardsMessagePayload
  | AlbumMessagePayload
  | StatusMentionPayload
  | PaymentMessagePayload
  | GroupInviteMessagePayload
  | CallMessagePayload

export interface QuotedMessage {
  messageId: string
  fromJid: string
  fromMe: boolean
}

export interface SendMessageRequest {
  sessionId: string
  to: string
  message: MessagePayload
}