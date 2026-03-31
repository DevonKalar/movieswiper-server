import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { config } from "./config/env.js";
import appRouter from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Trust proxy for production environments (needed for rate limiting behind proxies)
app.set("trust proxy", 1);

// CORS configuration
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Global rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
  }),
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api", appRouter);

// Error handler — must be registered after all routes
app.use(errorHandler);

export default app;
