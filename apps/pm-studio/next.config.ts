import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone-Output für ein schlankes Docker-Image (Compose-Profil `pms`, #10).
  output: "standalone",
};

export default nextConfig;
