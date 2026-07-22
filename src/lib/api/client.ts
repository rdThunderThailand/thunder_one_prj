import axios from "axios";
import { env } from "@/config/env";

// Shared axios instance. Feature services (src/features/*/services) should
// import this instead of creating their own axios instances.
export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});
