process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION in BFF:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION in BFF:", reason);
});

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const dotenv = require("dotenv");
const path = require("path");

// 🌱 Load env based on NODE_ENV, from project root
const nodeEnv =
  process.env.NODE_ENV === "production" ? "production" : "development";

const envFile =
  nodeEnv === "production" ? ".env.production" : ".env.development";

const envPath = path.resolve(__dirname, "..", envFile);

console.log(`BFF starting with NODE_ENV=${nodeEnv}, loading env file: ${envPath}`);
dotenv.config({ path: envPath });

const BACKEND_BASE_URL =
  process.env.BACKEND_BASE_URL || "http://localhost:7071";
const API_TOKEN = (process.env.BACKEND_API_TOKEN || "").trim();
const PORT = process.env.BFF_PORT || 4000;

// Dev auth gate config
const DEV_AUTH_HEADER_NAME =
  (process.env.BFF_DEV_AUTH_HEADER_NAME || "x-admin-ui-token").toLowerCase();
const DEV_AUTH_TOKEN = (process.env.BFF_DEV_AUTH_TOKEN || "").trim();

// APP
const app = express();
app.use(express.json());

// HEALTH (left open on purpose)
app.get("/health", (_req, res) => {
  res.json({ ok: true, backend: BACKEND_BASE_URL });
});

// Dev auth middleware – required for all routes after /health
app.use((req, res, next) => {
  // If no token configured, skip check (useful in CI, etc.)
  if (!DEV_AUTH_TOKEN) {
    console.warn(
      "BFF_DEV_AUTH_TOKEN not set – dev auth gate is DISABLED for this instance."
    );
    return next();
  }

  const incomingToken = (req.headers[DEV_AUTH_HEADER_NAME] || "").toString().trim();

  if (!incomingToken || incomingToken !== DEV_AUTH_TOKEN) {
    return res.status(401).json({
      error: "Unauthorized",
      message: `Missing or invalid dev auth token. Please send header "${DEV_AUTH_HEADER_NAME}" with the correct value.`,
    });
  }

  next();
});

// 🔐 Dev auth middleware – (already added above)
app.use((req, res, next) => {
  if (!DEV_AUTH_TOKEN) {
    console.warn(
      "BFF_DEV_AUTH_TOKEN not set – dev auth gate is DISABLED for this instance."
    );
    return next();
  }

  const incomingToken = (req.headers[DEV_AUTH_HEADER_NAME] || "").toString().trim();

  if (!incomingToken || incomingToken !== DEV_AUTH_TOKEN) {
    return res.status(401).json({
      error: "Unauthorized",
      message: `Missing or invalid dev auth token. Please send header "${DEV_AUTH_HEADER_NAME}" with the correct value.`,
    });
  }

  next();
});

// ✅ NEW: simple “auth ok” endpoint under /bff
app.get("/bff/dev-auth-status", (req, res) => {
  res.json({ ok: true });
});

// Existing proxy
app.use(
  "/bff",
  (req, _res, next) => {
    const browserToken = req.headers["auth-token"];
    if (!browserToken || !browserToken.toString().trim()) {
      if (API_TOKEN) {
        req.headers["auth-token"] = API_TOKEN;
      }
    }
    next();
  },
  createProxyMiddleware({
    target: BACKEND_BASE_URL,
    changeOrigin: true,
    logLevel: "info",
    pathRewrite: (path) => {
      const withoutBff = path.replace(/^\/bff/, "");
      return `/api/public${withoutBff}`;
    },
  })
);


// BFF PROXY MIDDLEWARE
app.use(
  "/bff",
  // Inject backend auth-token if needed
  (req, _res, next) => {
    const browserToken = req.headers["auth-token"];

    // Use browser token if present, otherwise fallback to env token
    if (!browserToken || !browserToken.toString().trim()) {
      if (API_TOKEN) {
        req.headers["auth-token"] = API_TOKEN;
      }
    }

    next();
  },

  // Proxy to Spring Boot
  createProxyMiddleware({
    target: BACKEND_BASE_URL,
    changeOrigin: true,
    logLevel: "info",
    pathRewrite: (path) => {
      const withoutBff = path.replace(/^\/bff/, "");
      return `/api/public${withoutBff}`;
    },
  })
);

// START SERVER
app.listen(PORT, () => {
  console.log(
    `Admin BFF listening on port ${PORT}, proxying to ${BACKEND_BASE_URL}`
  );
  if (DEV_AUTH_TOKEN) {
    console.log(
      `Dev auth gate ENABLED. Expecting header "${DEV_AUTH_HEADER_NAME}".`
    );
  } else {
    console.log("Dev auth gate DISABLED (no BFF_DEV_AUTH_TOKEN set).");
  }
});
