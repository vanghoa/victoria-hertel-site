import { PageFrame } from '@/components/PageFrame';
import { fetchGithub } from '@/utils/AllData/githubClient';
import { formatNavData, getCommitList } from '@/utils/AllData/processData';
import slug from 'slug';
import { unstable_cache } from 'next/cache';

export const dynamicParams = false;

export default async function Page({
    params: { oid, slug },
}: {
    params: { oid: string; slug: string };
}) {
    const name = await paramsPairObj();
    console.log(name[slug]);
    const data = await fetchGithub('fetchPageContent', oid, `${name[slug]}`);
    return <PageFrame>{JSON.stringify(data)}</PageFrame>;
}

export async function generateStaticParams() {
    const commitList = await getCommitList();
    const paramsArray: { oid: string; slug: string; path: string }[] = [];

    for (const commit of commitList) {
        const {
            oid,
            file: {
                object: { entries },
            },
        } = commit;
        formatNavData(
            entries,
            {},
            ({
                item,
                name,
                path,
            }: {
                item: any;
                name: string;
                path: string;
            }) => {
                paramsArray.push({ oid, slug: slug(name), path });
            }
        );
    }

    return paramsArray;
}

export const paramsPairObj = async () => {
    const paramsArray = await generateStaticParams();
    const objectPair: {
        [key: string]: string;
    } = {};
    paramsArray.map(({ slug, path }) => {
        objectPair[slug] = path;
    });
    return objectPair;
};
