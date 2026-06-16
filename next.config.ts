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

module.exports = {
  allowedDevOrigins: [
    'blunt-venture-doornail.ngrok-free.dev',
    'superea.app'
  ]
}

export default nextConfig
