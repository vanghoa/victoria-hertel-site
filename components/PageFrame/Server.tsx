import { ReactNode } from 'react';
import PageClient from './Client';
import { MDXCustomComponents } from '@/mdx-components';
import rehypeImageSize from '@/utils/rehype-image-size.mjs';
import rehypeSlideShow from '@/utils/rehype-slideshow.mjs';
import rehypeVideoValidate, {
    asyncRehypeVideoValidate,
} from '@/utils/rehype-video-validate.mjs';
import rehypeSpanValidate from '@/utils/rehype-span-validate.mjs';
import { MDXRemote, MDXRemoteProps } from 'next-mdx-remote/rsc';
import remarkUnwrapImages from 'remark-unwrap-images';
import { compile, run } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import React from 'react';
import { AnyChunk } from 'parse-git-diff';

export default function PageServer({
    children,
    pgName = 'Victoria Hertel Velasco',
    date = 'XX/XX/XXXX',
    homepage = false,
    status = '',
}: {
    children: ReactNode;
    pgName?: string | ReactNode;
    date?: string | ReactNode;
    homepage?: boolean;
    status?: string;
}) {
    return (
        <main className={`textured_bg ${status}`}>
            {homepage ? children : <PageClient>{children}</PageClient>}
            <section className="description">
                <span className="left">
                    {' '}
                    Victoria Hertel&apos;s website | {pgName}
                </span>
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
        console.log('oid page compileMDX');
        code = compileMDX;
    } else {
        console.log('refetch compileMDX');
        code = String(await CompileMDXFunc(source));
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

export const CompileMDXFunc = async (source: string) => {
    return await compile(source, {
        outputFormat: 'function-body',
        rehypePlugins: [
            [rehypeImageSize, { root: process.cwd() }],
            asyncRehypeVideoValidate,
            rehypeSpanValidate,
            [rehypeSlideShow, { root: process.cwd() }],
        ],
        remarkPlugins: [remarkUnwrapImages],
    });
};
