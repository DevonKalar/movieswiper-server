import dotenv from "dotenv";

dotenv.config();

interface config {
  port: number | string;
  apiKeys: {
    openai: string;
    tmdb: string;
  };
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
  jwtSecret: process.env.JWT_SECRET || "",
  databaseUrl: process.env.DATABASE_URL || "",
  nodeEnvironment: process.env.NODE_ENV || "development",
};
