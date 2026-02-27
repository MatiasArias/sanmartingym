/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Reduce tiempo de compilación: solo incluye los módulos que usas de estos paquetes
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },
}

module.exports = nextConfig
