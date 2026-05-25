# AI Assistant

Chat aplikácia s AI asistentom, ktorá komunikuje s n8n backendom cez webhook.

## Stack

- **Vite** + **React** + **TypeScript**
- **Tailwind CSS v4**
- **PWA** podpora (service worker, manifest)
- **Session pamäť** — konverzácie si zachovávajú kontext cez session ID

## Spustenie lokálne

```bash
npm install
cp .env.example .env
# Uprav .env a nastav reálnu webhook URL
npm run dev
```

## Konfigurácia

Skopíruj `.env.example` do `.env` a nastav `VITE_WEBHOOK_URL` na URL svojho n8n webhooku.

Aplikácia očakáva n8n workflow s webhook triggerom, ktorý prijíma POST request s telom:

```json
{
  "message": "text správy",
  "session_id": "uuid"
}
```

A vracia odpoveď vo formáte:

```json
{
  "message": "odpoveď asistenta"
}
```
