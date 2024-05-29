import { ReactNode } from 'react';
import PageClient from './Client';
import { MDXCustomComponents } from '@/mdx-components';
import rehypeImageSize from '@/utils/rehype-image-size.mjs';
import { MDXRemote, MDXRemoteProps } from 'next-mdx-remote/rsc';
import remarkUnwrapImages from 'remark-unwrap-images';
import { compile, run } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';

export default function PageServer({
    children,
    pgName = 'Victoria Hertel Velasco',
    date = 'XX/XX/XXXX',
}: {
    children: ReactNode;
    pgName?: string | ReactNode;
    date?: string | ReactNode;
}) {
    return (
        <main className="textured_bg">
            <PageClient>{children}</PageClient>
            <section className="description">
                <span className="left">{pgName}</span>
                <span className="right">{date}</span>
            </section>
        </main>
    );
}

export function PageError({ children }: { children?: ReactNode }) {
    return (
        <PageServer>
            <h1 className="text-plane">
                {children ? children : 'some error...'}
            </h1>
        </PageServer>
    );
}

export async function MDXContent({
    source,
    compileMDX,
}: {
    source: string;
    compileMDX?: string;
}) {
    let code = '';
    if (compileMDX) {
        code = compileMDX;
    } else {
        console.log('refetch compileMDX');
        code = String(
            await compile(source, {
                outputFormat: 'function-body',
                rehypePlugins: [[rehypeImageSize, { root: process.cwd() }]],
                remarkPlugins: [remarkUnwrapImages],
            })
        );
    }

    const { default: MDX } = await run(code, {
        Fragment: undefined,
        ...runtime,
        baseUrl: import.meta.url,
    });

    return <MDX components={{ ...MDXCustomComponents }} />;

    console.log('refetch MDXContent');
    return (
        <MDXRemote
            components={{ ...MDXCustomComponents }}
            source={source}
            options={{
                mdxOptions: {
                    rehypePlugins: [[rehypeImageSize, { root: process.cwd() }]],
                    remarkPlugins: [remarkUnwrapImages],
                },
            }}
        />
    );
}
