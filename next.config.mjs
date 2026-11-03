/** @type {import('next').NextConfig} */
const nextConfig = {
  // La presentación (Slidev) se compila como sitio estático en public/presentacion.
  // Next no sirve index.html automáticamente en carpetas de public/, así que lo reescribimos.
  async rewrites() {
    return [{ source: '/presentacion', destination: '/presentacion/index.html' }];
  },
};

export default nextConfig;
