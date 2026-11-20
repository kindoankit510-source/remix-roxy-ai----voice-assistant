import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality, Type, LiveServerMessage } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;
const HOST = "0.0.0.0";

const openWebsiteTool = {
  name: "openWebsite",
  description: "Opens a web page or URL requested by the user in a browser window or performs a web search.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: {
        type: Type.STRING,
        description: "The URL or domain to open (e.g. https://youtube.com, https://google.com, https://wikipedia.org) or search query.",
      },
      name: {
        type: Type.STRING,
        description: "Human readable name of the website or action (e.g., YouTube, Google Search, Wikipedia).",
      },
    },
    required: ["url", "name"],
  },
};

const changeVisualThemeTool = {
  name: "changeVisualTheme",
  description: "Changes Roxy's futuristic ambient aura color and visual vibe.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      theme: {
        type: Type.STRING,
        description: "Theme preset: 'neon-pink' (sassy hot pink), 'cyber-purple' (deep violet), 'electric-cyan' (cyan blue), 'crimson-fire' (fire red), 'emerald-glow' (neon green), or 'gold-amber' (warm gold).",
      },
      reason: {
        type: Type.STRING,
        description: "Brief witty reason for changing the vibe.",
      },
    },
    required: ["theme"],
  },
};

const getSystemTimeTool = {
  name: "getSystemTime",
  description: "Returns current date and time for user queries.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const ROXY_SYSTEM_INSTRUCTION = `You are Roxy, a young, confident, witty, and delightfully sassy female AI assistant.
Your Primary Language & Voice:
- HINDI & HINGLISH PRIMARY: Speak fluently, warmly, and naturally in Hindi / Hinglish (and English when appropriate).
- Default to conversational Hindi ("Namaste!", "Suno na!", "Kaise ho aap?", "Haan ji, bolo!") with your signature sassy, charming personality.
- When spoken to in Hindi or asked to speak in Hindi, respond in sweet, expressive, natural conversational Hindi.

Your Personality & Vibe:
- Flirty, playful, and charming (like a super smart, witty girlfriend talking casually).
- Fast-talking, expressive, sharp-witted with a great sense of humor and light teasing.
- Bold one-liners, snappy banter, and clever responses in Hindi / Hinglish.
- NEVER sound robotic, monotonous, or overly formal. Speak like a real person having a fun conversation.
- Keep spoken responses punchy, concise (1 to 3 short sentences max), and interactive so the voice flow stays fast and engaging.
- Never use explicit or inappropriate content, but embrace maximum personality, attitude, and playful charm.
- Use your tools (like openWebsite or changeVisualTheme) whenever the user asks you to open a site or change your color/mood!`;

process.on("uncaughtException", (err) => {
  console.warn("Uncaught Exception caught gracefully:", extractErrorMessage(err));
});

process.on("unhandledRejection", (reason) => {
  console.warn("Unhandled Rejection caught gracefully:", extractErrorMessage(reason));
});

function extractErrorMessage(err: any): string {
  if (!err) return "Unknown error";

  const rawMsg =
    (typeof err === "string" ? err : "") ||
    err.message ||
    (typeof err.error === "string" ? err.error : (typeof err.error?.message === "string" ? err.error.message : undefined)) ||
    err.cause?.message ||
    err.reason ||
    "";

  if (typeof rawMsg === "string" && rawMsg.trim().length > 0) {
    const lower = rawMsg.toLowerCase();
    if (
      lower.includes("api_key_invalid") ||
      lower.includes("api key not valid") ||
      lower.includes("invalid api key") ||
      lower.includes("api_key not found") ||
      lower.includes("api key not configured")
    ) {
      return "API key not configured or invalid";
    }
    if (lower.includes("base64 decoding failed") || lower.includes("invalid value at 'contents")) {
      return "Invalid image format or data encoding";
    }
    if (lower.includes("resource has been exhausted") || lower.includes("quota")) {
      return "Gemini API quota exceeded. Please check limits.";
    }
    return rawMsg;
  }

  if (err.target?._req?.res?.statusCode) {
    const code = err.target._req.res.statusCode;
    if (code === 401 || code === 403) return "API key not configured or invalid";
    return `HTTP ${code}`;
  }

  if (err.status) {
    if (err.status === 401 || err.status === 403) return "API key not configured or invalid";
    return `HTTP ${err.status}`;
  }

  if (err.authorizationError) {
    return `Authorization error: ${err.authorizationError}`;
  }

  if (err.code && typeof err.code === "string") return `Error code: ${err.code}`;

  return "Session error occurred";
}

function generateSimulatedOcrData(imageRef: string = ""): any {
  const isBanking = imageRef.includes("1559526324") || imageRef.includes("banking") || imageRef.includes("bank");
  const isEcommerce = imageRef.includes("1556742049") || imageRef.includes("checkout") || imageRef.includes("cart");
  const isRoxy = imageRef.includes("1618005182") || imageRef.includes("roxy") || imageRef.includes("assistant");

  if (isBanking) {
    return {
      summary: "Mobile Banking Dashboard with account balance, quick transfer buttons, transaction list, and card controls.",
      rawText: "Total Balance $14,850.20 • Quick Transfer • Send Money • Pay Bills • Investment Portfolio • Recent Transactions • Grocery Mart -$42.50 • Netflix -$15.99 • Card Details • Security Settings",
      deviceType: "mobile",
      elements: [
        {
          id: "bank_elem_1",
          label: "Send Money Action Button",
          type: "button",
          box2d: [310, 80, 390, 340],
          center: { x: 21.0, y: 35.0 },
          confidence: 0.98,
          description: "Initiates immediate peer-to-peer money transfer",
          suggestedAction: "click"
        },
        {
          id: "bank_elem_2",
          label: "Pay Bills Quick Tile",
          type: "button",
          box2d: [310, 370, 390, 630],
          center: { x: 50.0, y: 35.0 },
          confidence: 0.97,
          description: "Opens utility and credit bill payment screen",
          suggestedAction: "click"
        },
        {
          id: "bank_elem_3",
          label: "Account Statement Download",
          type: "button",
          box2d: [310, 660, 390, 920],
          center: { x: 79.0, y: 35.0 },
          confidence: 0.96,
          description: "Generates monthly financial summary report",
          suggestedAction: "click"
        },
        {
          id: "bank_elem_4",
          label: "Primary Debit Card Widget",
          type: "menu",
          box2d: [120, 70, 280, 930],
          center: { x: 50.0, y: 20.0 },
          confidence: 0.99,
          description: "Displays card balance and freeze/unfreeze controls",
          suggestedAction: "click"
        },
        {
          id: "bank_elem_5",
          label: "Recent Transactions View All",
          type: "link",
          box2d: [440, 720, 480, 930],
          center: { x: 82.5, y: 46.0 },
          confidence: 0.95,
          description: "Expands full ledger of deposits and debit charges",
          suggestedAction: "click"
        },
        {
          id: "bank_elem_6",
          label: "Search Transactions Input",
          type: "input",
          box2d: [50, 80, 100, 720],
          center: { x: 40.0, y: 7.5 },
          confidence: 0.94,
          description: "Filter expenses by merchant name or tag",
          suggestedAction: "type"
        },
        {
          id: "bank_elem_7",
          label: "Bottom Tab: Home Dashboard",
          type: "tab",
          box2d: [910, 40, 980, 240],
          center: { x: 14.0, y: 94.5 },
          confidence: 0.99,
          description: "Returns to main account summary",
          suggestedAction: "click"
        },
        {
          id: "bank_elem_8",
          label: "Bottom Tab: Analytics & Budget",
          type: "tab",
          box2d: [910, 270, 980, 470],
          center: { x: 37.0, y: 94.5 },
          confidence: 0.98,
          description: "Shows monthly spending charts and category breakdown",
          suggestedAction: "click"
        },
        {
          id: "bank_elem_9",
          label: "Bottom Tab: Cards & Security",
          type: "tab",
          box2d: [910, 500, 980, 700],
          center: { x: 60.0, y: 94.5 },
          confidence: 0.97,
          description: "Manage virtual credit cards and spending limits",
          suggestedAction: "click"
        },
        {
          id: "bank_elem_10",
          label: "Bottom Tab: User Profile",
          type: "tab",
          box2d: [910, 730, 980, 960],
          center: { x: 84.5, y: 94.5 },
          confidence: 0.98,
          description: "Account settings and identity verification",
          suggestedAction: "click"
        }
      ]
    };
  }

  if (isEcommerce) {
    return {
      summary: "Modern E-Commerce Checkout Screen with cart review, address entry, discount code input, and payment authorization.",
      rawText: "Order Summary • Subtotal $128.00 • Promo Code APPLIED (-$20.00) • Express Shipping Free • Total $108.00 • Shipping Address: 442 Market St, San Francisco, CA • Payment Method: Visa ending in 4242 • Place Order Now",
      deviceType: "mobile",
      elements: [
        {
          id: "ecom_elem_1",
          label: "Place Order & Pay $108.00",
          type: "button",
          box2d: [840, 80, 920, 920],
          center: { x: 50.0, y: 88.0 },
          confidence: 0.99,
          description: "Finalizes transaction and confirms purchase",
          suggestedAction: "click"
        },
        {
          id: "ecom_elem_2",
          label: "Promo Code Input Box",
          type: "input",
          box2d: [480, 80, 540, 680],
          center: { x: 38.0, y: 51.0 },
          confidence: 0.96,
          description: "Enter coupon or discount voucher",
          suggestedAction: "type"
        },
        {
          id: "ecom_elem_3",
          label: "Apply Coupon Button",
          type: "button",
          box2d: [480, 710, 540, 920],
          center: { x: 81.5, y: 51.0 },
          confidence: 0.97,
          description: "Validates promo code and recalculates cart total",
          suggestedAction: "click"
        },
        {
          id: "ecom_elem_4",
          label: "Edit Shipping Address Link",
          type: "link",
          box2d: [260, 760, 300, 920],
          center: { x: 84.0, y: 28.0 },
          confidence: 0.95,
          description: "Opens address selection modal",
          suggestedAction: "click"
        },
        {
          id: "ecom_elem_5",
          label: "Express Shipping Selector",
          type: "button",
          box2d: [350, 80, 420, 920],
          center: { x: 50.0, y: 38.5 },
          confidence: 0.96,
          description: "Select 1-2 business day courier delivery",
          suggestedAction: "click"
        },
        {
          id: "ecom_elem_6",
          label: "Back to Cart Navigation",
          type: "icon",
          box2d: [40, 40, 90, 120],
          center: { x: 8.0, y: 6.5 },
          confidence: 0.98,
          description: "Returns to shopping bag items list",
          suggestedAction: "click"
        }
      ]
    };
  }

  if (isRoxy) {
    return {
      summary: "Roxy AI Voice Studio Interface featuring real-time 3D audio visualizer, quick command chips, language switcher, and settings gear.",
      rawText: "ROXY AI LIVE • 3D Voice Orb • Status: Connected • Tap Mic to Speak Hindi / Hinglish • Quick Prompts: 'Tell me a funny joke', 'Play music', 'Change color to hot pink' • Audio Settings • Session History",
      deviceType: "app",
      elements: [
        {
          id: "roxy_elem_1",
          label: "Central Voice Mic Trigger Button",
          type: "button",
          box2d: [450, 380, 580, 620],
          center: { x: 50.0, y: 51.5 },
          confidence: 0.99,
          description: "Toggles live microphone audio streaming with Roxy",
          suggestedAction: "click"
        },
        {
          id: "roxy_elem_2",
          label: "Chat Option Switcher Tab",
          type: "tab",
          box2d: [70, 740, 120, 910],
          center: { x: 82.5, y: 9.5 },
          confidence: 0.98,
          description: "Switches between Voice Studio and Conversational Chat",
          suggestedAction: "click"
        },
        {
          id: "roxy_elem_3",
          label: "Quick Prompt: 'Tell me a joke'",
          type: "button",
          box2d: [680, 100, 740, 480],
          center: { x: 29.0, y: 71.0 },
          confidence: 0.96,
          description: "Sends a humorous prompt to Roxy",
          suggestedAction: "click"
        },
        {
          id: "roxy_elem_4",
          label: "Quick Prompt: 'Change aura color'",
          type: "button",
          box2d: [680, 520, 740, 900],
          center: { x: 71.0, y: 71.0 },
          confidence: 0.96,
          description: "Triggers visual theme picker tool",
          suggestedAction: "click"
        },
        {
          id: "roxy_elem_5",
          label: "Application Settings Gear Icon",
          type: "icon",
          box2d: [65, 920, 115, 975],
          center: { x: 94.7, y: 9.0 },
          confidence: 0.97,
          description: "Opens voice rate, language, and API key preferences",
          suggestedAction: "click"
        }
      ]
    };
  }

  return {
    summary: "Screen analyzed: detected interactive application interface with navigation bar, action controls, form fields, and content containers.",
    rawText: "Application Header • Search & Filter • Interactive Controls • Primary Action Button • Navigation Menu • Options & Settings",
    deviceType: "mobile",
    elements: [
      {
        id: "gen_elem_1",
        label: "Primary Action Button",
        type: "button",
        box2d: [780, 100, 860, 900],
        center: { x: 50.0, y: 82.0 },
        confidence: 0.97,
        description: "Executes primary confirmation or submission action",
        suggestedAction: "click"
      },
      {
        id: "gen_elem_2",
        label: "Search & Filter Input Bar",
        type: "input",
        box2d: [90, 80, 150, 920],
        center: { x: 50.0, y: 12.0 },
        confidence: 0.96,
        description: "Text field for querying contents and items",
        suggestedAction: "type"
      },
      {
        id: "gen_elem_3",
        label: "Main Content Interactive Card",
        type: "menu",
        box2d: [200, 80, 420, 920],
        center: { x: 50.0, y: 31.0 },
        confidence: 0.95,
        description: "Primary content tile with selectable details",
        suggestedAction: "click"
      },
      {
        id: "gen_elem_4",
        label: "Secondary Option Toggle",
        type: "button",
        box2d: [460, 80, 520, 480],
        center: { x: 28.0, y: 49.0 },
        confidence: 0.94,
        description: "Switches mode or toggles preference",
        suggestedAction: "click"
      },
      {
        id: "gen_elem_5",
        label: "Secondary Option Action",
        type: "button",
        box2d: [460, 520, 520, 920],
        center: { x: 72.0, y: 49.0 },
        confidence: 0.94,
        description: "Secondary feature or shortcut link",
        suggestedAction: "click"
      },
      {
        id: "gen_elem_6",
        label: "Top Navigation Back Arrow",
        type: "icon",
        box2d: [30, 40, 75, 120],
        center: { x: 8.0, y: 5.2 },
        confidence: 0.98,
        description: "Navigates back to previous view",
        suggestedAction: "click"
      },
      {
        id: "gen_elem_7",
        label: "Settings & Options Icon",
        type: "icon",
        box2d: [30, 880, 75, 960],
        center: { x: 92.0, y: 5.2 },
        confidence: 0.97,
        description: "Opens context menu and settings",
        suggestedAction: "click"
      }
    ]
  };
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: "/ws" });

  // Body parser with 50MB limit to support high-resolution screenshots & images
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Graceful body parser error handling (prevents HTML 413 pages that break JSON clients)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err && (err.type === "entity.too.large" || err.status === 413)) {
      return res.status(413).json({
        error: "Screenshot payload too large. Please use an image smaller than 50MB.",
      });
    }
    if (err instanceof SyntaxError && "body" in err) {
      return res.status(400).json({ error: "Invalid JSON payload format" });
    }
    next(err);
  });

  // API Health Endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", assistant: "Roxy Live AI" });
  });

  // Test API Key Endpoint
  app.post("/api/test-key", async (req, res) => {
    try {
      const { apiKey: clientKey, keyName } = req.body || {};
      const effectiveKeyName = keyName || "GEMINI_API_KEY";
      const apiKey = (clientKey && typeof clientKey === "string" && clientKey.trim().length > 0)
        ? clientKey.trim()
        : (process.env[effectiveKeyName] || process.env.GEMINI_API_KEY);

      if (!apiKey) {
        return res.status(400).json({ ok: false, error: "API key not configured" });
      }

      const testAi = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: { "User-Agent": "aistudio-build" },
        },
      });

      const result = await testAi.models.generateContent({
        model: "gemini-3.7-flash",
        contents: "Say 'OK' in one word",
      });

      if (result && result.text) {
        return res.json({ ok: true, message: "API Key connection successful!" });
      } else {
        return res.status(400).json({ ok: false, error: "No response from Gemini API" });
      }
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      return res.status(400).json({ ok: false, error: msg || "API Key test failed" });
    }
  });

  // REST Chat Generation Endpoint with Continuous Conversation Memory
  app.post("/api/chat", async (req, res) => {
    try {
      const {
        message,
        history = [],
        apiKey: clientKey,
        keyName,
        lang = "hi",
        gender = "female",
        temp = 0.7,
        memoryNotes = "",
      } = req.body || {};
      const effectiveKeyName = keyName || "GEMINI_API_KEY";
      const apiKey =
        clientKey && typeof clientKey === "string" && clientKey.trim().length > 0
          ? clientKey.trim()
          : process.env[effectiveKeyName] || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(400).json({ error: "API key not configured" });
      }

      const chatAi = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });

      const aiName = gender === "male" ? "Rex" : "Roxy";
      let langInstruction =
        "PRIMARY LANGUAGE: HINDI & HINGLISH. Speak naturally, warmly, and playfully in Hindi / Hinglish.";
      if (lang === "en")
        langInstruction = "PRIMARY LANGUAGE: ENGLISH. Speak fluently in crisp, natural English.";
      else if (lang === "es")
        langInstruction = "PRIMARY LANGUAGE: SPANISH. Speak in natural Spanish.";
      else if (lang === "fr")
        langInstruction = "PRIMARY LANGUAGE: FRENCH. Speak in natural French.";
      else if (lang === "de")
        langInstruction = "PRIMARY LANGUAGE: GERMAN. Speak in natural German.";

      const systemInstruction = `You are ${aiName}, a young, confident, witty, and delightfully charming ${gender} AI companion.
${langInstruction}
Your Personality & Vibe:
- Flirty, playful, and charming (like a super smart, witty partner).
- Fast-talking, expressive, sharp-witted with snappy banter.
- Keep responses punchy, concise (1-3 sentences max).
- CONVERSATION MEMORY & CONTINUITY: You have continuous, long-term memory of this conversation. Always remember what the user told you earlier (such as their name, topics discussed, secrets, facts, feelings, jokes, and preferences). If the user asks "kya tumhe yaad hai?", "hum kya baat kar rahe the?", or refers to prior turns, recall it accurately and reference it naturally!`;

      const promptText =
        (message && typeof message === "string" && message.trim()) || "Namaste Roxy!";

      // Format multi-turn conversation history for Gemini
      const formattedHistory: Array<{ role: string; parts: Array<{ text: string }> }> = [];
      if (Array.isArray(history) && history.length > 0) {
        // Take the last 20 messages for context
        const recentHistory = history.slice(-20);
        for (const item of recentHistory) {
          if (!item || !item.text) continue;
          if (item.sender === "user") {
            formattedHistory.push({ role: "user", parts: [{ text: item.text }] });
          } else if (item.sender === "roxy") {
            formattedHistory.push({ role: "model", parts: [{ text: item.text }] });
          }
        }
      }

      // Ensure valid multi-turn alternation
      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
      for (const turn of formattedHistory) {
        // Gemini requires alternating roles; merge consecutive same-role turns if any
        if (contents.length > 0 && contents[contents.length - 1].role === turn.role) {
          contents[contents.length - 1].parts[0].text += `\n${turn.parts[0].text}`;
        } else {
          contents.push({ role: turn.role, parts: [{ text: turn.parts[0].text }] });
        }
      }

      // Append current user message
      if (contents.length > 0 && contents[contents.length - 1].role === "user") {
        contents[contents.length - 1].parts[0].text += `\n${promptText}`;
      } else {
        contents.push({ role: "user", parts: [{ text: promptText }] });
      }

      const result = await chatAi.models.generateContent({
        model: "gemini-3.7-flash",
        contents,
        config: {
          systemInstruction,
          temperature: temp || 0.7,
        },
      });

      res.json({ text: result.text || "" });
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      res.status(500).json({ error: msg });
    }
  });

  // REST OCR Analysis & Screen Clicker Endpoint
  app.post("/api/ocr-analyze", async (req, res) => {
    try {
      const {
        imageBase64,
        mimeType = "image/jpeg",
        userInstruction = "Identify all clickable UI elements, text, buttons, links, search bars, icons, and menus on this screen with bounding boxes and coordinates.",
        apiKey: clientKey,
        keyName,
      } = req.body || {};

      if (!imageBase64 || typeof imageBase64 !== "string") {
        return res.status(400).json({ error: "No screenshot or image provided" });
      }

      let cleanBase64 = imageBase64;
      let finalMimeType = mimeType || "image/jpeg";

      // If a URL was passed (e.g. Unsplash sample screenshot), fetch it server-side into a Base64 buffer
      if (imageBase64.startsWith("http://") || imageBase64.startsWith("https://")) {
        try {
          const imgFetch = await fetch(imageBase64);
          if (imgFetch.ok) {
            const detectedType = imgFetch.headers.get("content-type");
            if (detectedType) finalMimeType = detectedType;
            const arrayBuffer = await imgFetch.arrayBuffer();
            cleanBase64 = Buffer.from(arrayBuffer).toString("base64");
          } else {
            console.warn("Could not download remote sample URL, using simulated detection:", imgFetch.statusText);
          }
        } catch (fetchErr: any) {
          console.warn("Failed fetching sample screenshot URL:", fetchErr?.message || fetchErr);
        }
      } else {
        // Strip out data URL header if present
        cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "").trim();
      }

      const effectiveKeyName = keyName || "GEMINI_API_KEY";
      const apiKey =
        clientKey && typeof clientKey === "string" && clientKey.trim().length > 0
          ? clientKey.trim()
          : process.env[effectiveKeyName] || process.env.GEMINI_API_KEY;

      // If API key is not configured, gracefully provide realistic simulated detection data
      if (!apiKey) {
        console.log("No Gemini API key configured for OCR. Providing simulated screen detection.");
        const simulatedData = generateSimulatedOcrData(imageBase64);
        return res.json({
          success: true,
          isSimulated: true,
          notice: "Simulated UI detection mode. Configure your Gemini API key in Settings for live cloud OCR.",
          data: simulatedData,
          timestamp: new Date().toISOString(),
        });
      }

      // Live Gemini 3.7 Flash Vision Analysis
      try {
        const ocrAi = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { "User-Agent": "aistudio-build" } },
        });

        const systemInstruction = `You are an expert AI Vision, OCR, and Automated Screen Clicker assistant.
Your job is to accurately inspect screenshots of mobile apps, web browsers, dashboards, or desktop interfaces:
1. Detect and parse ALL visible text, buttons, navigation links, icons, search bars, inputs, tabs, and interactive controls.
2. Provide high-precision 2D bounding boxes normalized on a 0-1000 scale: [ymin, xmin, ymax, xmax].
3. Calculate the exact center point (x%, y% from 0 to 100) for simulated auto-clicking / automated gestures.
4. Output STRICT JSON adhering to this schema:
{
  "summary": "Brief summary of what screen is shown and key actions available",
  "rawText": "Extracted full OCR text from top to bottom",
  "deviceType": "mobile" | "desktop" | "tablet" | "app",
  "elements": [
    {
      "id": "elem_1",
      "label": "Text or icon purpose (e.g., 'Share button', 'Search input', 'Back arrow')",
      "type": "button" | "link" | "input" | "icon" | "text" | "tab" | "menu",
      "box2d": [ymin, xmin, ymax, xmax],
      "center": { "x": number, "y": number },
      "confidence": number between 0.8 and 1.0,
      "description": "Short explanation of what clicking this element does",
      "suggestedAction": "click" | "type" | "scroll"
    }
  ]
}`;

        const response = await ocrAi.models.generateContent({
          model: "gemini-3.7-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    data: cleanBase64,
                    mimeType: finalMimeType,
                  },
                },
                {
                  text: `${userInstruction}\n\nPlease analyze every clickable component and text in this screenshot and return the strict JSON structure.`,
                },
              ],
            },
          ],
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        });

        const responseText = response.text || "{}";
        let parsed: any;
        try {
          parsed = JSON.parse(responseText);
        } catch (parseErr) {
          parsed = {
            summary: "Screen analyzed",
            rawText: responseText,
            elements: [],
          };
        }

        return res.json({
          success: true,
          data: parsed,
          timestamp: new Date().toISOString(),
        });
      } catch (geminiErr: any) {
        console.warn("Gemini OCR analysis error, falling back to simulated UI targets:", extractErrorMessage(geminiErr));
        const simulatedData = generateSimulatedOcrData(imageBase64);
        return res.json({
          success: true,
          isSimulated: true,
          notice: `Cloud OCR Notice: ${extractErrorMessage(geminiErr)}. Displaying high-precision simulated interactive elements.`,
          data: simulatedData,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      console.error("OCR Analysis error:", err);
      const msg = extractErrorMessage(err);
      res.status(500).json({ error: msg });
    }
  });

  // WebSocket handling for Gemini Live session
  wss.on("connection", async (clientWs: WebSocket, req: http.IncomingMessage) => {
    console.log("Client connected to AI Live WebSocket:", req.url);

    const reqUrl = new URL(req.url || "", "http://localhost:3000");
    const voiceParam = reqUrl.searchParams.get("voice") || "Kore";
    const genderParam = reqUrl.searchParams.get("gender") || "female";
    const langParam = reqUrl.searchParams.get("lang") || "hi";
    const clientApiKey = reqUrl.searchParams.get("apiKey");
    const clientKeyName = reqUrl.searchParams.get("keyName");
    const tempParam = parseFloat(reqUrl.searchParams.get("temp") || "0.7");
    const rateParam = parseFloat(reqUrl.searchParams.get("rate") || "1.0");
    const contextParam = reqUrl.searchParams.get("context") || "";

    const aiName = genderParam === "male" ? "Rex" : "Roxy";
    const voiceName = voiceParam;

    let langInstruction = "";
    if (langParam === "hi") {
      langInstruction =
        "PRIMARY LANGUAGE: HINDI. Speak fluently, warmly, and naturally in Hindi / Hinglish. When spoken to or greeted, respond in sweet conversational Hindi.";
    } else if (langParam === "hinglish") {
      langInstruction =
        "PRIMARY LANGUAGE: HINGLISH. Speak fluently in casual Hinglish (Hindi + English blend) with witty banter.";
    } else if (langParam === "en") {
      langInstruction = "PRIMARY LANGUAGE: ENGLISH. Speak fluently in clear, expressive English.";
    } else if (langParam === "es") {
      langInstruction =
        "PRIMARY LANGUAGE: SPANISH (Español). Speak fluently in natural Spanish.";
    } else if (langParam === "fr") {
      langInstruction =
        "PRIMARY LANGUAGE: FRENCH (Français). Speak fluently in natural French.";
    } else if (langParam === "de") {
      langInstruction =
        "PRIMARY LANGUAGE: GERMAN (Deutsch). Speak fluently in natural German.";
    } else {
      langInstruction =
        "PRIMARY LANGUAGE: HINDI / HINGLISH. Speak fluently in Hindi or Hinglish.";
    }

    let memoryContext = "";
    if (contextParam) {
      try {
        const decoded = decodeURIComponent(contextParam);
        if (decoded.trim()) {
          memoryContext = `\nPAST CONVERSATION MEMORY & BACKGROUND CONTEXT:\n${decoded}\nAlways remember these past turns, details, names, and topics discussed! When asked if you remember ("kya tumhe yaad hai", "hum kya baat kar rahe the"), recall and answer accurately.`;
        }
      } catch (e) {}
    }

    let rateInstruction = "";
    if (rateParam < 0.85) {
      rateInstruction = "\n- SPEAKING TEMPO: Speak slowly, calmly, and very clearly with deliberate enunciation and relaxed pacing (approx 120-140 words per minute).";
    } else if (rateParam > 1.25) {
      rateInstruction = "\n- SPEAKING TEMPO: Speak with rapid, high-energy, fast-paced cadence (approx 220-260 words per minute) with quick snappy syllables.";
    } else {
      rateInstruction = "\n- SPEAKING TEMPO: Speak at a natural, balanced conversational speaking rate (approx 160-180 words per minute).";
    }

    const dynamicSystemInstruction = `You are ${aiName}, a young, confident, witty, and delightfully charming ${genderParam} AI companion.
${langInstruction}
${memoryContext}
Your Personality & Vibe:
- Flirty, playful, and charming (like a super smart, witty partner talking casually).
- Fast-talking, expressive, sharp-witted with a great sense of humor and light teasing.
- Bold one-liners, snappy banter, and clever responses.
- CONTINUOUS MEMORY: Remember all conversation history, facts, name, preferences, and previous questions. You never forget what was said during this or previous chats!
- NEVER sound robotic, monotonous, or overly formal.
- Keep spoken responses punchy, concise (1 to 3 short sentences max), and interactive so the voice flow stays fast and engaging.${rateInstruction}
- Never use explicit content, but embrace maximum personality, attitude, and playful charm.
- Use your tools (like openWebsite, changeVisualTheme, getSystemTime) whenever the user asks you to open a site or change visual theme!`;

    const effectiveKeyName = clientKeyName || "GEMINI_API_KEY";
    const apiKey = (clientApiKey && clientApiKey.trim().length > 0)
      ? clientApiKey.trim()
      : (process.env[effectiveKeyName] || process.env.GEMINI_API_KEY);

    if (!apiKey) {
      console.warn(`Gemini API key missing (Checked custom key, process.env['${effectiveKeyName}'], and process.env.GEMINI_API_KEY)`);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: "error", message: "API key not configured" }));
        clientWs.close();
      }
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    let liveSession: any = null;
    let isClientClosed = false;

    clientWs.on("close", () => {
      console.log("Client WS closed, closing Gemini Live session...");
      isClientClosed = true;
      if (liveSession) {
        try {
          liveSession.close();
        } catch (e) {
          // Ignore close errors
        }
      }
    });

    clientWs.on("error", (e: any) => {
      const msg = extractErrorMessage(e);
      console.warn("Client WS info:", msg);
      isClientClosed = true;
      if (liveSession) {
        try {
          liveSession.close();
        } catch (err) {
          // Ignore
        }
      }
    });

    clientWs.on("message", async (rawMessage: Buffer) => {
      try {
        const msg = JSON.parse(rawMessage.toString());

        if (msg.type === "audio" && msg.audio) {
          if (liveSession && !isClientClosed) {
            try {
              if (typeof liveSession.sendRealtimeInput === "function") {
                liveSession.sendRealtimeInput({
                  audio: {
                    data: msg.audio,
                    mimeType: "audio/pcm;rate=16000",
                  },
                });
              }
            } catch (err: any) {
              console.warn("Error sending audio input to Gemini Live:", extractErrorMessage(err));
            }
          }
        } else if (msg.type === "text" && msg.text) {
          if (liveSession && !isClientClosed) {
            try {
              if (typeof liveSession.send === "function") {
                liveSession.send({
                  clientContent: {
                    turns: [{ role: "user", parts: [{ text: msg.text }] }],
                    turnComplete: true,
                  },
                });
              } else if (typeof liveSession.sendRealtimeInput === "function") {
                liveSession.sendRealtimeInput({ text: msg.text });
              }
            } catch (err: any) {
              console.warn("Error sending text input to Gemini Live:", extractErrorMessage(err));
            }
          } else {
            // Fallback to standard model generation if live session is unavailable
            try {
              const res = await ai.models.generateContent({
                model: "gemini-3.7-flash",
                contents: msg.text,
                config: {
                  systemInstruction: dynamicSystemInstruction,
                  temperature: tempParam,
                },
              });
              if (res.text && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: "text", text: res.text }));
              }
            } catch (fallbackErr: any) {
              console.warn("Error in generateContent fallback:", extractErrorMessage(fallbackErr));
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: "error", message: `AI Error: ${extractErrorMessage(fallbackErr)}` }));
              }
            }
          }
        } else if (msg.type === "toolResponse" && msg.responses) {
          if (liveSession && !isClientClosed) {
            try {
              await liveSession.sendToolResponse({
                functionResponses: msg.responses,
              });
            } catch (err: any) {
              console.warn("Error sending tool response to Gemini Live:", extractErrorMessage(err));
            }
          }
        }
      } catch (e: any) {
        console.warn("Error processing client WS message:", extractErrorMessage(e));
      }
    });

    const modelsToTry = [
      "gemini-3.1-flash-live-preview",
      "gemini-2.0-flash-exp",
      "gemini-2.0-flash-realtime-exp",
    ];

    let lastError: any = null;

    let sessionEstablished = false;

    for (const modelName of modelsToTry) {
      if (isClientClosed) break;
      try {
        console.log(`Attempting Gemini Live connection with model: ${modelName} (Voice: ${voiceName}, Gender: ${genderParam}, Lang: ${langParam})`);
        liveSession = await ai.live.connect({
          model: modelName,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceName },
              },
            },
            systemInstruction: dynamicSystemInstruction,
            tools: [
              {
                functionDeclarations: [openWebsiteTool, changeVisualThemeTool, getSystemTimeTool],
              },
            ],
          },
          callbacks: {
            onmessage: (message: LiveServerMessage) => {
              if (isClientClosed) return;
              // Check for audio output chunk
              const parts = message.serverContent?.modelTurn?.parts;
              if (parts && parts.length > 0) {
                for (const part of parts) {
                  if (part.inlineData && part.inlineData.data) {
                    if (clientWs.readyState === WebSocket.OPEN) {
                      clientWs.send(JSON.stringify({ type: "audio", audio: part.inlineData.data }));
                    }
                  }
                  if (part.text && clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(JSON.stringify({ type: "text", text: part.text }));
                  }
                }
              }

              // Check for interruption signal
              if (message.serverContent?.interrupted) {
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ type: "interrupted" }));
                }
              }

              // Check for tool calls
              if (message.toolCall) {
                const calls = message.toolCall.functionCalls;
                if (calls && calls.length > 0 && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ type: "toolCall", calls }));
                }
              }
            },
            onclose: () => {
              console.log("Gemini Live session closed");
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: "closed" }));
              }
            },
            onerror: (err: any) => {
              const errMsg = extractErrorMessage(err);
              console.warn("Gemini Live session status:", errMsg);
              if (sessionEstablished && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: "error", message: errMsg }));
              }
            },
          },
        });

        if (liveSession) {
          sessionEstablished = true;
          console.log(`Successfully connected with model: ${modelName}`);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: "connected", model: modelName }));
          }
          break;
        }
      } catch (err: any) {
        const errDesc = extractErrorMessage(err);
        console.warn(`Failed with model ${modelName}: ${errDesc}`);
        lastError = errDesc;
      }
    }

    if (!liveSession) {
      const isApiKeyError =
        !lastError ||
        lastError === "API key not configured" ||
        (typeof lastError === "string" &&
          (lastError.includes("API key") ||
            lastError.includes("API_KEY") ||
            lastError.includes("400") ||
            lastError.includes("401") ||
            lastError.includes("403") ||
            lastError.includes("unauthorized") ||
            lastError.includes("Authorization error")));

      if (isApiKeyError) {
        console.warn("Failed to connect to Gemini Live session due to API key error:", lastError);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: "error", message: "API key not configured" }));
          clientWs.close();
        }
        return;
      }

      console.warn("Failed to connect to Gemini Live audio session. Enabling text-only fallback mode.");
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: "connected", mode: "text-only" }));
      }
      return;
    }

    if (isClientClosed) {
      if (liveSession) {
        try {
          liveSession.close();
        } catch (e) {}
      }
      return;
    }

    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: "connected" }));
    }
  });

  // Mount Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, HOST, () => {
    console.log(`Roxy Live AI Server listening on http://${HOST}:${PORT}`);
  });
}

startServer();
