## AuraSense 👁️‍🗨️

AuraSense is an accessibility-first project built to empower visually impaired users through smart, voice-driven, and assistive technologies.

The idea is simple: when vision fails, technology shouldn’t.

### 🚀 Features
- Voice-based interaction
- Screen-reader friendly UI
- AI-powered assistance for understanding text & images
- Accessibility-focused design principles

### 🎯 Goal
To reduce the digital gap by making web and app experiences usable without relying on sight.

Built with empathy, powered by code.

---

## Emergency & Safety 🔔

Small feature with real-world value: a standout Emergency button has been added.

- Tap the floating **🆘** button to call your saved emergency contact and attempt to send your location via SMS or the device's sharing options.
- Save or update the contact via the Emergency settings modal (open the modal if no contact is saved).
- Voice-trigger: enable the microphone (🎤) and say **"I need help"** to trigger the emergency action.

Notes & limitations:
- Location and microphone require user permission. If location is denied, a message without coordinates will be sent.
- SMS, tel: and Web Share behaviors depend on the user's device and browser (mobile browsers offer the best experience).
- Speech recognition support varies by browser; if not available, the voice toggle will indicate it's disabled.

Please test on the target device (mobile recommended) and let us know if you want this to also send a network alert to a server or emergency service (would require backend integration).

### Assistive demo updates

The **Assistive demo** now includes:

- **AI voice-guided navigation** — Start the assistant and speak commands like **"Read the page"**, **"Increase font"**, **"Go to contact"**, **"High contrast"**, or **"Open menu"**. Works best on browsers that support the Web Speech API and with microphone permission.
- **High-contrast preview** — Toggle a high-contrast theme to review visual accessibility of the site.

These are client-side demos. For deeper features (server-side logs, remote assistance), we can add backend integrations on request.

#### AI Image Description

- Upload an image and the assistant will describe it aloud in simple language.
- Flow: the client will first attempt to POST the image to `/api/describe` (if you provide a server-side integration that returns JSON `{ description: '...' }`). If no endpoint is available the page uses a local heuristic (dominant color, orientation, size) and speaks a simple summary.
- Privacy: images are not uploaded by default — only if you enable or provide a server endpoint. For production you can integrate a vision model (OpenAI, Azure Cognitive Services, or an on-prem model) and return a concise description; the client will read it aloud using Web Speech API.

Server example (Node/Express) included in `server/`:

- `server/index.js` — implements `POST /api/describe` and (if configured) forwards the image to Azure Computer Vision's Describe API and returns `{ description: '...' }`.
- Setup: copy `server/.env.example` → `server/.env`, set `AZURE_COMPUTER_VISION_ENDPOINT` and `AZURE_COMPUTER_VISION_KEY` and run `npm install` then `npm start` inside the `server` folder.
- CORS: the server includes CORS so your local frontend can call it during development.

If you prefer a different provider (OpenAI, Google, or a self-hosted model) I can add a second provider example.
