# WhatsApp Multi-Session API — Message Reference

Base URL: `http://localhost:2124`  
Auth header: `X-Api-Key: YOUR_API_KEY`

---

## Text

**POST** `/messages/:sessionId/send-text`

```json
{
  "to": "60182727119",
  "text": "Hello World!"
}
```

With mentions:
```json
{
  "to": "60182727119@g.us",
  "text": "Hey @60182727119 how are you?",
  "mentions": ["60182727119@s.whatsapp.net"]
}
```

With quoted message:
```json
{
  "to": "60182727119",
  "text": "Replying to your message",
  "quoted": {
    "messageId": "MESSAGE_ID_HERE",
    "fromJid": "60182727119@s.whatsapp.net",
    "fromMe": false
  }
}
```

---

## Image

**POST** `/messages/:sessionId/send-image`

```json
{
  "to": "60182727119",
  "url": "https://plus.unsplash.com/premium_photo-1776931377795-73b1693c2c34?w=400&auto=format&fit=crop&q=60",
  "caption": "Check this out!",
  "viewOnce": false
}
```

View once (disappears after viewing):
```json
{
  "to": "60182727119",
  "url": "https://example.com/image.jpg",
  "viewOnce": true
}
```

---

## Video

**POST** `/messages/:sessionId/send-video`

```json
{
  "to": "60182727119",
  "url": "https://example.com/video.mp4",
  "caption": "Watch this!",
  "gif": false,
  "ptv": false,
  "viewOnce": false
}
```

As GIF:
```json
{
  "to": "60182727119",
  "url": "https://example.com/clip.mp4",
  "gif": true
}
```

As video note (round video):
```json
{
  "to": "60182727119",
  "url": "https://example.com/clip.mp4",
  "ptv": true
}
```

---

## Audio

**POST** `/messages/:sessionId/send-audio`

As voice note (PTT):
```json
{
  "to": "60182727119",
  "url": "https://example.com/audio.ogg",
  "mimetype": "audio/ogg; codecs=opus",
  "ptt": true
}
```

As audio file:
```json
{
  "to": "60182727119",
  "url": "https://example.com/song.mp3",
  "mimetype": "audio/mp4",
  "ptt": false
}
```

---

## Document

**POST** `/messages/:sessionId/send-document`

```json
{
  "to": "60182727119",
  "url": "https://example.com/file.pdf",
  "mimetype": "application/pdf",
  "fileName": "document.pdf",
  "caption": "Here is the file"
}
```

Word document:
```json
{
  "to": "60182727119",
  "url": "https://example.com/report.docx",
  "mimetype": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "fileName": "report.docx"
}
```

---

## Location

**POST** `/messages/:sessionId/send-location`

```json
{
  "to": "60182727119",
  "latitude": 3.1390,
  "longitude": 101.6869,
  "name": "Kuala Lumpur City Centre",
  "address": "Kuala Lumpur, Malaysia"
}
```

Live location:
```json
{
  "to": "60182727119",
  "latitude": 3.1390,
  "longitude": 101.6869,
  "name": "My Location",
  "live": true
}
```

---

## Contact

**POST** `/messages/:sessionId/send-contact`

```json
{
  "to": "60182727119",
  "displayName": "John Doe",
  "vcard": "BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nORG:Company\nTEL;type=CELL;type=VOICE;waid=60182727119:+60 18-272 7119\nEND:VCARD"
}
```

---

## Reaction

**POST** `/messages/:sessionId/send-reaction`

```json
{
  "to": "60182727119",
  "emoji": "❤️",
  "targetMessageId": "MESSAGE_ID_HERE",
  "targetFromMe": false
}
```

Remove reaction:
```json
{
  "to": "60182727119",
  "emoji": "",
  "targetMessageId": "MESSAGE_ID_HERE",
  "targetFromMe": false
}
```

---

## Poll

**POST** `/messages/:sessionId/send-poll`

```json
{
  "to": "60182727119",
  "name": "Favorite Color?",
  "values": ["Red", "Blue", "Green", "Yellow"],
  "selectableCount": 1
}
```

Multiple choice:
```json
{
  "to": "60182727119@g.us",
  "name": "Which days work for the meeting?",
  "values": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "selectableCount": 3
}
```

---

## Sticker

**POST** `/messages/:sessionId/send-sticker`

```json
{
  "to": "60182727119",
  "url": "https://example.com/sticker.webp"
}
```

---

## Buttons

**POST** `/messages/:sessionId/send-buttons`

Text with buttons:
```json
{
  "to": "60182727119",
  "text": "Choose an option:",
  "footer": "Powered by API",
  "buttons": [
    { "id": "btn1", "text": "Option 1" },
    { "id": "btn2", "text": "Option 2" },
    { "id": "btn3", "text": "Option 3" }
  ]
}
```

Image with buttons:
```json
{
  "to": "60182727119",
  "image": "https://example.com/image.jpg",
  "caption": "Pick one below:",
  "footer": "Powered by API",
  "buttons": [
    { "id": "yes", "text": "Yes" },
    { "id": "no", "text": "No" }
  ]
}
```

---

## List

**POST** `/messages/:sessionId/send-list`

```json
{
  "to": "60182727119",
  "text": "Choose from the list:",
  "footer": "Powered by API",
  "title": "Main Menu",
  "buttonText": "View Options",
  "sections": [
    {
      "title": "Food",
      "rows": [
        { "title": "Nasi Lemak", "rowId": "food_1", "description": "Classic Malaysian dish" },
        { "title": "Roti Canai", "rowId": "food_2", "description": "Crispy flatbread" }
      ]
    },
    {
      "title": "Drinks",
      "rows": [
        { "title": "Teh Tarik", "rowId": "drink_1", "description": "Pulled milk tea" },
        { "title": "Milo Ais", "rowId": "drink_2" }
      ]
    }
  ]
}
```

---

## Interactive

**POST** `/messages/:sessionId/send-interactive`

Quick reply buttons:
```json
{
  "to": "60182727119",
  "text": "Are you interested in our offer?",
  "footer": "Reply below",
  "buttons": [
    {
      "name": "quick_reply",
      "buttonParamsJson": "{\"display_text\":\"Yes, interested!\",\"id\":\"yes\"}"
    },
    {
      "name": "quick_reply",
      "buttonParamsJson": "{\"display_text\":\"No thanks\",\"id\":\"no\"}"
    }
  ]
}
```

URL button:
```json
{
  "to": "60182727119",
  "text": "Visit our website",
  "buttons": [
    {
      "name": "cta_url",
      "buttonParamsJson": "{\"display_text\":\"Open Website\",\"url\":\"https://example.com\",\"merchant_url\":\"https://example.com\"}"
    }
  ]
}
```

Copy code button:
```json
{
  "to": "60182727119",
  "text": "Use this promo code:",
  "buttons": [
    {
      "name": "cta_copy",
      "buttonParamsJson": "{\"display_text\":\"Copy Code\",\"copy_code\":\"PROMO2026\"}"
    }
  ]
}
```

Call button:
```json
{
  "to": "60182727119",
  "text": "Need help? Call us!",
  "buttons": [
    {
      "name": "cta_call",
      "buttonParamsJson": "{\"display_text\":\"Call Now\",\"phone_number\":\"60182727119\"}"
    }
  ]
}
```

Dropdown list:
```json
{
  "to": "60182727119",
  "text": "Select your city:",
  "buttons": [
    {
      "name": "single_select",
      "buttonParamsJson": "{\"title\":\"Pick a city\",\"sections\":[{\"title\":\"Malaysia\",\"rows\":[{\"header\":\"KL\",\"title\":\"Kuala Lumpur\",\"description\":\"Capital city\",\"id\":\"kl\"},{\"header\":\"PG\",\"title\":\"Penang\",\"description\":\"Pearl of the Orient\",\"id\":\"pg\"}]}]}"
    }
  ]
}
```

With image:
```json
{
  "to": "60182727119",
  "image": "https://example.com/promo.jpg",
  "caption": "Limited time offer!",
  "title": "SALE",
  "footer": "Valid until end of month",
  "buttons": [
    {
      "name": "quick_reply",
      "buttonParamsJson": "{\"display_text\":\"Claim Now\",\"id\":\"claim\"}"
    },
    {
      "name": "cta_url",
      "buttonParamsJson": "{\"display_text\":\"Learn More\",\"url\":\"https://example.com/promo\",\"merchant_url\":\"https://example.com\"}"
    }
  ]
}
```

All button types combined:
```json
{
  "to": "60182727119",
  "text": "Interactive message with all button types",
  "title": "Title",
  "subtitle": "Subtitle",
  "footer": "Footer",
  "buttons": [
    {
      "name": "quick_reply",
      "buttonParamsJson": "{\"display_text\":\"Quick Reply\",\"id\":\"qr1\"}"
    },
    {
      "name": "cta_url",
      "buttonParamsJson": "{\"display_text\":\"Visit Website\",\"url\":\"https://example.com\",\"merchant_url\":\"https://example.com\"}"
    },
    {
      "name": "cta_copy",
      "buttonParamsJson": "{\"display_text\":\"Copy Code\",\"copy_code\":\"PROMO123\"}"
    },
    {
      "name": "cta_call",
      "buttonParamsJson": "{\"display_text\":\"Call Us\",\"phone_number\":\"60182727119\"}"
    },
    {
      "name": "send_location",
      "buttonParamsJson": "{\"display_text\":\"Share Location\"}"
    },
    {
      "name": "address_message",
      "buttonParamsJson": "{\"display_text\":\"Enter Address\"}"
    }
  ]
}
```

---

## Cards (Carousel)

**POST** `/messages/:sessionId/send-cards`

```json
{
  "to": "60182727119",
  "text": "Browse our products",
  "title": "Product Catalog",
  "footer": "Tap to select",
  "cards": [
    {
      "imageUrl": "https://example.com/product1.jpg",
      "title": "Product 1",
      "body": "Great product description here",
      "footer": "RM 49.90",
      "buttons": [
        {
          "name": "quick_reply",
          "buttonParamsJson": "{\"display_text\":\"Buy Now\",\"id\":\"buy_1\"}"
        },
        {
          "name": "cta_url",
          "buttonParamsJson": "{\"display_text\":\"View Details\",\"url\":\"https://example.com/product1\"}"
        }
      ]
    },
    {
      "imageUrl": "https://example.com/product2.jpg",
      "title": "Product 2",
      "body": "Another amazing product",
      "footer": "RM 99.90",
      "buttons": [
        {
          "name": "quick_reply",
          "buttonParamsJson": "{\"display_text\":\"Buy Now\",\"id\":\"buy_2\"}"
        }
      ]
    },
    {
      "imageUrl": "https://example.com/product3.jpg",
      "title": "Product 3",
      "body": "Premium quality item",
      "footer": "RM 199.90",
      "buttons": [
        {
          "name": "quick_reply",
          "buttonParamsJson": "{\"display_text\":\"Buy Now\",\"id\":\"buy_3\"}"
        },
        {
          "name": "cta_url",
          "buttonParamsJson": "{\"display_text\":\"View Details\",\"url\":\"https://example.com/product3\"}"
        }
      ]
    }
  ]
}
```

---

## Album (Media Gallery)

**POST** `/messages/:sessionId/send-album`

Images only:
```json
{
  "to": "60182727119",
  "items": [
    { "imageUrl": "https://example.com/img1.jpg", "caption": "Photo 1" },
    { "imageUrl": "https://example.com/img2.jpg", "caption": "Photo 2" },
    { "imageUrl": "https://example.com/img3.jpg", "caption": "Photo 3" }
  ]
}
```

Mixed images and videos:
```json
{
  "to": "60182727119",
  "items": [
    { "imageUrl": "https://example.com/img1.jpg", "caption": "Opening shot" },
    { "videoUrl": "https://example.com/clip.mp4", "caption": "Product demo" },
    { "imageUrl": "https://example.com/img2.jpg", "caption": "Closing shot" }
  ]
}
```

---

## Pin Message

**POST** `/messages/:sessionId/send-pin`

Pin a message (86400 = 1 day, 604800 = 7 days, 2592000 = 30 days):
```json
{
  "to": "60182727119@g.us",
  "messageId": "MESSAGE_ID_HERE",
  "fromMe": true,
  "duration": 86400,
  "remove": false
}
```

Unpin:
```json
{
  "to": "60182727119@g.us",
  "messageId": "MESSAGE_ID_HERE",
  "fromMe": true,
  "duration": 86400,
  "remove": true
}
```

---

## Delete Message

**POST** `/messages/:sessionId/send-delete`

```json
{
  "to": "60182727119",
  "messageId": "MESSAGE_ID_HERE",
  "fromMe": true
}
```

---

## Edit Message

**POST** `/messages/:sessionId/send-edit`

```json
{
  "to": "60182727119",
  "messageId": "MESSAGE_ID_HERE",
  "fromMe": true,
  "newText": "This is the updated message text"
}
```

---

## Forward Message

**POST** `/messages/:sessionId/send-forward`

```json
{
  "to": "60182727119",
  "messageId": "MESSAGE_ID_HERE",
  "fromJid": "60182727119@s.whatsapp.net",
  "fromMe": false,
  "force": true
}
```

---

## Event

**POST** `/messages/:sessionId/send-event`

```json
{
  "to": "60182727119@g.us",
  "name": "Team Meeting",
  "description": "Monthly sync meeting",
  "latitude": 3.1390,
  "longitude": 101.6869,
  "locationName": "KL Office",
  "callType": "video",
  "startTime": 1777600000,
  "endTime": 1777607200,
  "isCanceled": false,
  "extraGuestsAllowed": true
}
```

Online event (no location):
```json
{
  "to": "60182727119@g.us",
  "name": "Webinar: AI in 2026",
  "description": "Join us for an online session",
  "callType": "video",
  "startTime": 1777600000,
  "endTime": 1777614400
}
```

---

## Payment Request

**POST** `/messages/:sessionId/send-payment`

```json
{
  "to": "60182727119",
  "note": "Payment for order #1234",
  "currency": "MYR",
  "amount": "49.90",
  "expiry": 86400,
  "from": "60182727119@s.whatsapp.net"
}
```

---

## Group Invite

**POST** `/messages/:sessionId/send-group-invite`

```json
{
  "to": "60182727119",
  "groupJid": "123456789@g.us",
  "groupName": "My Awesome Group",
  "code": "INVITE_CODE_HERE",
  "caption": "Join our group!",
  "expiration": 86400
}
```

---

## Call

**POST** `/messages/:sessionId/send-call`

Voice call:
```json
{
  "to": "60182727119",
  "name": "Voice Call",
  "callType": 1
}
```

Video call:
```json
{
  "to": "60182727119",
  "name": "Video Call",
  "callType": 2
}
```

---

## Generic Send (any type)

**POST** `/messages/:sessionId/send`

You can send any message type using this single endpoint by wrapping the payload in a `message` object:

```json
{
  "to": "60182727119",
  "message": {
    "type": "text",
    "text": "Hello from generic send!"
  }
}
```

```json
{
  "to": "60182727119",
  "message": {
    "type": "image",
    "url": "https://example.com/image.jpg",
    "caption": "Via generic send"
  }
}
```

---

## JID Format Reference

| Recipient | Format |
|-----------|--------|
| Personal chat | `60182727119` or `60182727119@s.whatsapp.net` |
| Group chat | `123456789-987654321@g.us` |
| Broadcast | `status@broadcast` |
| Newsletter | `123456789@newsletter` |

> Numbers without `@` are auto-normalized: plain numbers → `@s.whatsapp.net`, numbers with `-` → `@g.us`

---

## All Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/messages/:sessionId/send` | Send any message type |
| POST | `/messages/:sessionId/send-text` | Text message |
| POST | `/messages/:sessionId/send-image` | Image |
| POST | `/messages/:sessionId/send-video` | Video |
| POST | `/messages/:sessionId/send-audio` | Audio / Voice note |
| POST | `/messages/:sessionId/send-document` | File / Document |
| POST | `/messages/:sessionId/send-location` | Location |
| POST | `/messages/:sessionId/send-contact` | Contact card |
| POST | `/messages/:sessionId/send-reaction` | Emoji reaction |
| POST | `/messages/:sessionId/send-poll` | Poll |
| POST | `/messages/:sessionId/send-sticker` | Sticker |
| POST | `/messages/:sessionId/send-buttons` | Button message |
| POST | `/messages/:sessionId/send-list` | List message |
| POST | `/messages/:sessionId/send-interactive` | Interactive message |
| POST | `/messages/:sessionId/send-cards` | Carousel cards |
| POST | `/messages/:sessionId/send-album` | Media album |
| POST | `/messages/:sessionId/send-pin` | Pin/unpin message |
| POST | `/messages/:sessionId/send-delete` | Delete message |
| POST | `/messages/:sessionId/send-edit` | Edit message |
| POST | `/messages/:sessionId/send-forward` | Forward message |
| POST | `/messages/:sessionId/send-event` | Event |
| POST | `/messages/:sessionId/send-payment` | Payment request |
| POST | `/messages/:sessionId/send-group-invite` | Group invite |
| POST | `/messages/:sessionId/send-call` | Initiate call |