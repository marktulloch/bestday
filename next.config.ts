import path from "path";
import type { NextConfig } from "next";

/**
 * Pin Turbopack to this app when another lockfile exists higher in the tree (e.g. user home).
 * Otherwise Next may infer the wrong root and client env / resolution can break — including
 * `NEXT_PUBLIC_SUPABASE_*` for the browser, which surfaces as `signInWithPassword` "Failed to fetch".
 */
const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
