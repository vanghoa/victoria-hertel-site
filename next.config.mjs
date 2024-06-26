import createMDX from '@next/mdx';

/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        console.log('redirects called');
        return [
            {
                source: '/',
                destination: '/latest/home',
                permanent: true,
            },
        ];
    },
    experimental: {
        outputFileTracingIncludes: {
            '/public': ['./public/**/*'],
        },
    },
    reactStrictMode: false,
    pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
    webpack: (config, options) => {
        config.module.rules.push({
            test: /\.(graphql|gql)/,
            exclude: /node_modules/,
            loader: 'graphql-raw-loader',
        });
        config.module.rules.push({
            test: /\.svg$/,
            use: ['@svgr/webpack'],
        });

        return config;
    },
};

const withMDX = createMDX({
    extension: /\.(md|mdx)$/,
});

export default withMDX(nextConfig);
