// import + global config
import { Octokit, App } from 'octokit';
import { graphql } from '@octokit/graphql';
import { cache } from 'react';
import {
    contentpath,
    contentpatharr,
    getAPIRoutePath,
} from '../constants/paths';
import { compile } from '@mdx-js/mdx';

// graphql query
import navQuery from './graphql/test.graphql';
import {
    findIndexRemoved,
    formatNavData,
    formatPageCommitDetails,
    formatPageCommitDetails_removed,
} from './processData';
import { localDate } from '../smallUtils';
import { generateStaticParams as generateStaticParamsTimeline } from '@/app/timeline/[oid]/[slug]/page';
import matter from 'gray-matter';
import parseGitDiff, { AnyChunk, GitDiff } from 'parse-git-diff';
import { MDXContent } from '@/components/PageFrame/Server';
import rehypeImageSize from '../rehype-image-size.mjs';
import remarkUnwrapImages from 'remark-unwrap-images';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const headers = {
    headers: {
        authorization: `token ${process.env.GITHUB_TOKEN}`,
    },
};

export const fetchNavData = cache(async () => {
    console.log('refetch NavData (no cache)');
    const data: any = await graphql(navQuery, headers);
    const nodes: any[] =
        data?.repository?.defaultBranchRef?.target?.history?.nodes || [];
    nodes.map((item, index) => {
        const entries = item.file.object.entries;
        item.committedDate = localDate(item.committedDate);
        item.tree = formatNavData(entries);
    });
    return nodes;
});

export const fetchPageContent = cache(async (oid?: string, path?: string) => {
    console.log(`refetch PageContent ${oid} / ${path}:`);
    const data: any = await graphql(
        `
            query ($oid: String!, $expression: String!) {
                repository(owner: "vanghoa", name: "victoria-hertel-site") {
                    content: object(expression: $expression) {
                        ... on Blob {
                            text
                        }
                    }
                    date: object(expression: $oid) {
                        ... on Commit {
                            committedDate
                        }
                    }
                }
            }
        `,
        {
            oid,
            expression: `${oid}:${path}`,
            ...headers,
        }
    );
    const fileContent = data?.repository?.content?.text || '';
    const fileMatter = matter(fileContent);
    return {
        matter: fileMatter,
        compileMDX: String(
            await compile(fileMatter.content, {
                outputFormat: 'function-body',
                rehypePlugins: [[rehypeImageSize, { root: process.cwd() }]],
                remarkPlugins: [remarkUnwrapImages],
            })
        ),
    };
});

export const fetchOctokitPaginate = cache(
    async (route?: string, params?: string) => {
        console.log(`refetch OctokitPaginate`);
        if (!route || !params) {
            return null;
        }
        return await octokit.paginate(route, {
            owner: 'vanghoa',
            repo: 'victoria-hertel-site',
            per_page: 100,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28',
            },
            ...JSON.parse(params),
        });
    }
);

export const fetchPageCommitDetails = cache(async () => {
    const commitList: Awaited<ReturnType<typeof fetchNavData>> =
        await fetchGithub('fetchNavData');
    console.log('refetch PageCommitDetails');
    for (let i = 0; i < commitList.length; i++) {
        const {
            oid,
            file: {
                object: { entries },
            },
        } = commitList[i];
        const res: any[] = await fetchGithub(
            'fetchOctokitPaginate',
            `GET /repos/{owner}/{repo}/commits/{ref}`,
            JSON.stringify({ ref: oid })
        );
        for (const { files } of res) {
            for (const file of files) {
                const { filename, status } = file;
                if (filename.startsWith(contentpath)) {
                    if (status == 'removed') {
                        formatPageCommitDetails_removed(
                            filename,
                            entries,
                            1,
                            findIndexRemoved(
                                filename,
                                entries,
                                commitList[i + 1]?.file?.object?.entries || []
                            )
                        );
                    } else {
                        formatPageCommitDetails(filename, status, entries);
                    }
                }

                if (file.previous_filename?.startsWith(contentpath)) {
                    formatPageCommitDetails_removed(
                        file.previous_filename,
                        entries,
                        1,
                        findIndexRemoved(
                            file.previous_filename,
                            entries,
                            commitList[i + 1]?.file?.object?.entries || []
                        )
                    );
                }
            }
        }
    }
    commitList.map((item) => {
        const entries = item.file.object.entries;
        item.tree = formatNavData(entries);
    });

    return commitList;
});

export const fetchParamsPairObj = cache(async () => {
    console.log('refetch ParamsPairObj');
    const commitList: Awaited<ReturnType<typeof fetchPageCommitDetails>> =
        await fetchGithub('fetchPageCommitDetails');
    const objectPair: fetchParamsPairObjType = {};
    for (const commit of commitList) {
        const {
            committedDate,
            oid,
            message,
            file: {
                object: { entries },
            },
        } = commit;
        objectPair[oid] = {};
        const res: any[] = await fetchGithub(
            'fetchOctokitPaginate',
            `GET /repos/{owner}/{repo}/commits/{ref}`,
            JSON.stringify({ ref: oid })
        );
        formatNavData(
            entries,
            {},
            ({
                slug,
                path,
                name,
                status,
            }: {
                slug: string;
                path: string;
                name: string;
                status: string;
            }) => {
                objectPair[oid][slug] = {
                    path,
                    name,
                    status,
                    patch: status == 'modified' ? findPatch() : [],
                    committedDate,
                    commitMessage: message,
                };
                function findPatch() {
                    for (const { files } of res) {
                        for (const file of files) {
                            const {
                                filename,
                                patch,
                            }: { filename: string; patch: string } = file;
                            if (filename == path) {
                                return parseGitDiff(`diff
--- a
+++ a
${patch}`).files[0].chunks;
                            }
                        }
                    }
                    return [];
                }
            }
        );
    }
    return objectPair;
});

export const cacheFunction = {
    fetchNavData: fetchNavData, // need revalidate
    fetchPageCommitDetails: fetchPageCommitDetails, // need revalidate
    fetchParamsPairObj: fetchParamsPairObj, // need revalidate
    fetchOctokitPaginate: fetchOctokitPaginate,
    fetchPageContent: fetchPageContent,
};

export type cacheType = keyof typeof cacheFunction;

export const fetchGithub = cache(async (type: cacheType, ...rest: string[]) => {
    try {
        let tags: string[] = [type];
        switch (type) {
            case 'fetchNavData':
                break;
            case 'fetchPageCommitDetails':
                break;
            case 'fetchParamsPairObj':
                break;
            case 'fetchPageContent':
                tags.push(`fetchPageContent${rest.toString()}`, rest[0]);
                break;
            case 'fetchOctokitPaginate':
                tags.push(`fetchOctokitPaginate${rest.toString()}`, rest[0]);
                break;
            default:
                console.log(
                    `co loi o fetchGithub: wrong type request: ${type}`
                );
                return null;
        }
        const res = await (
            await fetch(
                `${getAPIRoutePath(
                    'githubFetch'
                )}?type=${type}&args=${JSON.stringify(rest)}`,
                {
                    cache: 'force-cache',
                    next: { tags },
                }
            )
        ).json();
        res.succeed && console.log(`fetchGithub from api: ${type} / ${rest}`);
        return res.message;
    } catch (e) {
        console.log(`co loi o fetchGithub: ${e}`);
        return null;
    }
});

export type fetchParamsPairObjType = {
    [key: string]: {
        [key: string]: {
            path: string;
            name: string;
            status: string;
            patch: AnyChunk[];
            committedDate: {
                date: string;
                time: string;
            };
            commitMessage: string;
        };
    };
};
