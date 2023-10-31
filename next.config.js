/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: true
    },
    images: {
        domains: [
            "res.cloudinary.com",
            "api.steamship.com"
        ],
    },
};

module.exports = nextConfig
