import axios from "axios";
import { config } from "@/config/env.js";

export const tmdbAxios = axios.create({
  baseURL: "https://api.themoviedb.org/3/",
  headers: {
    Authorization: `Bearer ${config.apiKeys.tmdb}`,
    Accept: "application/json",
  },
});
