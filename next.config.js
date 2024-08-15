/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: "res.cloudinary.com",
                port: ''
            },
            {
                protocol: 'https',
                hostname: "api.steamship.com",
                port: ''
            },
        ],
    },
};

module.exports = nextConfig
