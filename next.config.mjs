import createMDX from '@next/mdx';
import rehypeImageSize from './utils/rehype-image-size.mjs';
import remarkGfm from 'remark-gfm';

/** @type {import('next').NextConfig} */
const nextConfig = {
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
    options: {
        rehypePlugins: [[rehypeImageSize, { root: process.cwd() }]],
        remarkPlugins: [remarkGfm],
    },
});

export default withMDX(nextConfig);
