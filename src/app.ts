import express from 'express';
import appRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint
// app.get("/", (req, res) => {
//   res.json({ message: "Hello, World!" });
// });

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('', appRouter);

// Error handler — must be registered after all routes
app.use(errorHandler);

export default app;
