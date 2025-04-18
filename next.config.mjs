/** @type {import('next').NextConfig} */
const nextConfig = {
    images:{
        domains: ['avatars.githubusercontent.com'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'media.licdn.com',
                port: '',
                pathname: '/dms/**',
            },
        ],
    },
};

export default nextConfig;
