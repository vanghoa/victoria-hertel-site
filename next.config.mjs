import createMDX from '@next/mdx';

/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        console.log('rewrites called');
        return [
            {
                source: '/',
                destination: '/latest/home',
            },
        ];
    },
    reactStrictMode: false,
    pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
    webpack: (config, options) => {
        config.module.rules.push({
            test: /\.(graphql|gql)/,
            exclude: /node_modules/,
            loader: 'graphql-raw-loader',
        });

        return config;
    },
};

const withMDX = createMDX({
    extension: /\.(md|mdx)$/,
});

export default withMDX(nextConfig);
