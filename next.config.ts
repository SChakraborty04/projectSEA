import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'blunt-venture-doornail.ngrok-free.dev',
        'superea.app'
      ]
    }
  },
  serverExternalPackages: ["@mastra/core", "@mastra/ai-sdk"]
}

export default nextConfig
