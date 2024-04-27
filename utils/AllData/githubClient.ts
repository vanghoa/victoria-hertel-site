// import + global config
import { Octokit, App } from 'octokit';
import { graphql } from '@octokit/graphql';
import { cache } from 'react';
import {
    contentpath,
    contentpatharr,
    getAPIRoutePath,
} from '../constants/paths';

// graphql query
import navQuery from './graphql/test.graphql';
import {
    findIndexRemoved,
    formatNavData,
    formatPageCommitDetails,
    formatPageCommitDetails_removed,
    getCommitList,
} from './processData';

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
        item.tree = formatNavData(entries);
    });
    return nodes;
});

export const fetchPageContent = cache(async (oid?: string, path?: string) => {
    console.log(`refetch PageContent ${oid} / ${path}:`);
    return await graphql(
        `
            query {
                repository(owner: "vanghoa", name: "victoria-hertel-site") {
                    folder: object(
                        expression: "${oid}:${path}"
                    ) {
                        ... on Blob {
                            text
                        }
                    }
                }
            }
        `,
        headers
    );
});

export const fetchOctokitPaginate = cache(
    async (route: string, params: string) => {
        console.log(`refetch OctokitPaginate`);
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
    const commitList: any[] = await getCommitList();
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
            for (const { filename, status } of files) {
                if (filename.startsWith(contentpath)) {
                    if (status == 'removed') {
                        formatPageCommitDetails_removed(
                            filename,
                            entries,
                            1,
                            findIndexRemoved(
                                filename,
                                commitList[i + 1]?.file?.object?.entries || []
                            ) || 0
                        );
                    } else {
                        formatPageCommitDetails(filename, status, entries);
                    }
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

export const cacheFunction = {
    fetchNavData: fetchNavData,
    fetchPageContent: fetchPageContent,
    fetchOctokitPaginate: fetchOctokitPaginate,
    fetchPageCommitDetails: fetchPageCommitDetails,
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
