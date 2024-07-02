import { walkDirectory } from '@/components/Nav/Server';
import PageServer, { MDXContent } from '@/components/PageFrame/Server';
import { contentpath } from '@/utils/constants/paths';
import dynamic from 'next/dynamic';
import fs from 'fs';
import { MDXCustomComponents } from '@/mdx-components';
import { MDXRemote } from 'next-mdx-remote/rsc';
import matter from 'gray-matter';

export const dynamicParams = false;

export function generateStaticParams() {
    const paramsArray: { slug: string }[] = [];
    // console.log('static params');
    treeWalk(walkDirectory());
    function treeWalk(tree: any) {
        Object.keys(tree).forEach((key) => {
            if (tree[key].type === 'folder') {
                return treeWalk(tree[key].entries);
            }
            paramsArray.push({ slug: tree[key].slug });
        });
    }
    return paramsArray;
}

export default async function Page({
    params: { slug },
}: {
    params: { slug: string };
}) {
    const data = fetchParamsPairObj()[slug];
    // const pagepath = data.path.substring(contentpath.length);
    // const Mdx = dynamic(() => import(`@/public/content${pagepath}`));
    const fileContent = fs.readFileSync(data.path, 'utf8');
    const matterContent = matter(fileContent);
    const asyncMDXContent = await MDXContent({ source: matterContent.content });
    return (
        <PageServer
            pgName={data.name}
            date={'latest'}
            homepage={slug === 'home'}
            slug={slug}
        >
            {/* <Mdx/> */}
            {asyncMDXContent}
        </PageServer>
    );
}

const fetchParamsPairObj = () => {
    // need cache
    const objectPair: {
        [key: string]: { path: string; name: string; status: string };
    } = {};
    // console.log('pair params');
    treeWalk(walkDirectory());
    function treeWalk(tree: any) {
        Object.keys(tree).forEach((key) => {
            if (tree[key].type === 'folder') {
                return treeWalk(tree[key].entries);
            }
            objectPair[tree[key].slug] = {
                path: tree[key].path,
                name: key,
                status: tree[key].status,
            };
        });
    }

    return objectPair;
};
