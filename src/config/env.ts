import dotenv from "dotenv";

dotenv.config();

interface config {
  port: number | string;
  apiKeys: {
    openai: string;
    tmdb: string;
  };
  corsOrigins: string[];
  jwtSecret: string;
  databaseUrl: string;
  nodeEnvironment: string;
}

export const config: config = {
  port: process.env.PORT || 3000,
  apiKeys: {
    openai: process.env.OPENAI_API_KEY || "",
    tmdb: process.env.TMDB_API_KEY || "",
  },
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
    : ["http://localhost:5173"],
  jwtSecret: process.env.JWT_SECRET || "",
  databaseUrl: process.env.DATABASE_URL || "",
  nodeEnvironment: process.env.NODE_ENV || "development",
};
