import PageServer, {
    MDXContent,
    PageError,
} from '@/components/PageFrame/Server';
import { MDXCustomComponents } from '@/mdx-components';
import {
    fetchGithub,
    fetchNavData,
    fetchPageContent,
    fetchParamsPairObj,
    fetchParamsPairObjType,
} from '@/utils/AllData/githubClient';
import { formatNavData } from '@/utils/AllData/processData';

export const dynamicParams = false;

export default async function Page({
    params: { oid, slug },
}: {
    params: { oid: string; slug: string };
}) {
    const paramsPairObj: Awaited<ReturnType<typeof fetchParamsPairObj>> =
        await fetchGithub('fetchParamsPairObj');
    const gitdata = paramsPairObj?.[oid]?.[slug];
    if (!gitdata) {
        return <PageError />;
    }
    const {
        path,
        patch,
        committedDate: { date, time },
        name,
        status,
    } = gitdata;
    const pageContent: Awaited<ReturnType<typeof fetchPageContent>> =
        await fetchGithub('fetchPageContent', oid, `${path}`, false, slug);
    if (!pageContent || typeof pageContent == 'string') {
        return <PageError />;
    }
    /*
    for (const chunk of patch) {
        console.log(chunk);
    }
    console.log(matter.content);*/
    const asyncMDXContent = await MDXContent({
        source: pageContent.matter.content,
        compileMDX: pageContent.compileMDX,
    });
    return (
        <PageServer
            pgName={name}
            date={
                <>
                    {date}
                    <br></br> at {time}
                </>
            }
            homepage={slug === 'home'}
            status={status}
            slug={slug}
        >
            {asyncMDXContent}
        </PageServer>
    );
}

export async function generateStaticParams() {
    const commitList: Awaited<ReturnType<typeof fetchNavData>> =
        await fetchGithub('fetchNavData');
    const paramsArray: { oid: string; slug: string }[] = [];

    for (const commit of commitList) {
        const {
            oid,
            file: {
                object: { entries },
            },
        } = commit;
        formatNavData(entries, {}, ({ slug }: { slug: string }) => {
            paramsArray.push({ oid, slug });
        });
    }

    return paramsArray;
}
