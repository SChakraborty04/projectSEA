import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'blunt-venture-doornail.ngrok-free.dev',
        'superea.app'
      ]
    }
  }
}

module.exports = {
  allowedDevOrigins: [
    'blunt-venture-doornail.ngrok-free.dev',
    'superea.app'
  ]
}

export default nextConfig
