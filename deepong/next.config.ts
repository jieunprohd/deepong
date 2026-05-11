import path from "path";
import type {NextConfig} from "next";

const nextConfig: NextConfig = {
    outputFileTracingRoot: path.join(__dirname),
    turbopack: {
        root: __dirname,
    },
    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**.kakaocdn.net",
            },
            {
                protocol: "http",
                hostname: "**.kakaocdn.net",
            },
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
            },
        ],
    },
};

export default nextConfig;