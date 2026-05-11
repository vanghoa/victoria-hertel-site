import { Octokit } from 'octokit';
import { graphql } from '@octokit/graphql';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { contentpath } from '../constants/paths';
import { mdxjs } from 'micromark-extension-mdxjs';
import { fromMarkdown } from 'mdast-util-from-markdown';
import {
    mdxFromMarkdown,
    mdxToMarkdown,
    MdxJsxAttribute,
} from 'mdast-util-mdx';
import { toMarkdown } from 'mdast-util-to-markdown';
import navQuery from './graphql/test.graphql';
import {
    findIndexRemoved,
    formatNavData,
    formatPageCommitDetails,
    formatPageCommitDetails_removed,
} from './processData';
import { localDate } from '../smallUtils';
import matter from 'gray-matter';
import parseGitDiff, { AnyChunk } from 'parse-git-diff';
import { CompileMDXFunc } from '@/components/PageFrame/Server';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const headers = {
    headers: {
        authorization: `token ${process.env.GITHUB_TOKEN}`,
    },
};

async function fetchNavDataImpl() {
    console.log('refetch NavData');
    const data: any = await graphql(navQuery, headers);
    const nodes: any[] =
        data?.repository?.defaultBranchRef?.target?.history?.nodes || [];
    const validNodes = nodes.filter(
        (item) => item?.file?.object?.entries && Array.isArray(item.file.object.entries)
    );

    await Promise.all(
        validNodes.map(async (item) => {
            const entries: [] | null | undefined = item?.file?.object?.entries;
            item.committedDate = localDate(item.committedDate);
            item.tree =
                entries &&
                formatNavData(entries, {}, () => {}, () => {}, true, {});
        })
    );

    return validNodes;
}

async function resolveCommitPathCaseImpl(oid?: string, path?: string) {
    if (!oid || !path) {
        return null;
    }

    const commitRes = await octokit.request(
        'GET /repos/{owner}/{repo}/git/commits/{commit_sha}',
        {
            owner: 'vanghoa',
            repo: 'victoria-hertel-site',
            commit_sha: oid,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28',
            },
        }
    );

    const treeSha = commitRes.data.tree.sha;
    if (!treeSha) {
        return null;
    }

    const treeRes = await octokit.request(
        'GET /repos/{owner}/{repo}/git/trees/{tree_sha}',
        {
            owner: 'vanghoa',
            repo: 'victoria-hertel-site',
            tree_sha: treeSha,
            recursive: '1',
            headers: {
                'X-GitHub-Api-Version': '2022-11-28',
            },
        }
    );

    const normalizedPath = path.toLowerCase();
    const matchedPath = treeRes.data.tree.find(
        (item) =>
            item.type == 'blob' && item.path?.toLowerCase() == normalizedPath
    );

    return matchedPath?.path || null;
}

async function fetchPageContentImpl(
    oid?: string,
    path?: string,
    contentOnly: boolean = false,
    slug?: string
) {
    console.log(`refetch PageContent ${oid} / ${path}:`);
    const fetchContentBlob = async (expressionPath: string) => {
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
                expression: `${oid}:${expressionPath}`,
                ...headers,
            }
        );

        return data?.repository?.content?.text;
    };

    let resolvedPath = path;
    let fileContent = path ? await fetchContentBlob(path) : undefined;

    if (fileContent === undefined && oid && path) {
        const matchedPath = await fetchResolvedCommitPath(oid, path);
        if (matchedPath && matchedPath != path) {
            resolvedPath = matchedPath;
            fileContent = await fetchContentBlob(matchedPath);
        }
    }

    if (fileContent === undefined) {
        console.log(`page content missing for ${oid}:${resolvedPath}`);
        return null;
    }

    if (contentOnly) {
        return fileContent;
    }

    if (slug != 'home') {
        const paramsPairObj: Awaited<ReturnType<typeof fetchParamsPairObj>> =
            await fetchGithub('fetchParamsPairObj');
        const gitdata = paramsPairObj?.[oid || '']?.[slug || ''];
        const patch = gitdata?.patch || [];
        const fileContentArr = fileContent.split('\n');

        const attr = (
            value: 'added' | 'deleted'
        ): {
            type: 'mdxJsxAttribute';
            name: 'status';
            value: 'added' | 'deleted';
        } => ({
            type: 'mdxJsxAttribute',
            name: 'status',
            value,
        });

        const diffParseContent = (content: string, mdxAttr: MdxJsxAttribute) => {
            try {
                const tree = fromMarkdown(content, {
                    extensions: [mdxjs()],
                    mdastExtensions: [mdxFromMarkdown()],
                });

                for (const index in tree.children) {
                    const node = tree.children[index];
                    const { type } = node;

                    if (type == 'mdxJsxFlowElement') {
                        node.attributes.push(mdxAttr);
                    } else if ('children' in node) {
                        let spanCounter = 0;

                        for (const childIndex in node.children) {
                            const child = node.children[childIndex] as any;
                            const { type: childType } = child;

                            if (childType == 'mdxJsxTextElement') {
                                child.attributes.push(mdxAttr);
                            } else if (childType == 'image') {
                                node.children[childIndex] = {
                                    type: 'mdxJsxTextElement',
                                    name: 'Image',
                                    attributes: [
                                        {
                                            type: 'mdxJsxAttribute',
                                            name: 'src',
                                            value: child.url,
                                        },
                                        {
                                            type: 'mdxJsxAttribute',
                                            name: 'alt',
                                            value: child.alt,
                                        },
                                        mdxAttr,
                                    ],
                                    children: [],
                                };
                            } else {
                                spanCounter++;
                                node.children[childIndex] = {
                                    type: 'mdxJsxTextElement',
                                    name: 'Span',
                                    attributes: [mdxAttr],
                                    children: [child],
                                    position: child.position,
                                };
                            }
                        }

                        if (
                            spanCounter == node.children.length &&
                            type == 'paragraph'
                        ) {
                            tree.children[index] = {
                                type: 'mdxJsxTextElement',
                                name: 'P',
                                attributes: [mdxAttr],
                                children: node.children,
                                position: node.position,
                            };
                        }
                    }
                }

                return toMarkdown(tree, {
                    extensions: [mdxToMarkdown()],
                });
            } catch (error) {
                console.log(error);
            }
        };

        for (const chunk of patch) {
            if (chunk.type != 'Chunk') {
                continue;
            }

            for (const change of chunk.changes) {
                if (change.type != 'AddedLine') {
                    continue;
                }

                const { lineAfter, content } = change;
                const index = lineAfter - 1;
                if (fileContentArr[index] == content) {
                    const out = diffParseContent(content, attr('added'));
                    if (out) {
                        fileContentArr[index] = out;
                    }
                }
            }
        }

        let indexOffset = 0;
        for (const chunk of patch) {
            if (chunk.type != 'Chunk') {
                continue;
            }

            for (const change of chunk.changes) {
                if (change.type != 'DeletedLine') {
                    continue;
                }

                const { lineBefore, content } = change;
                const index = lineBefore + indexOffset - 1;
                const out = diffParseContent(content, attr('deleted'));
                if (out != undefined) {
                    fileContentArr.splice(index, 0, out);
                    indexOffset++;
                }
            }
        }

        fileContent = fileContentArr.join('\n');
    }

    const fileMatter = matter(fileContent);
    return {
        matter: fileMatter,
        compileMDX: String(await CompileMDXFunc(fileMatter.content)),
    };
}

async function fetchOctokitPaginateImpl(route?: string, params?: string) {
    console.log('refetch OctokitPaginate');
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

async function fetchPageMetaImpl(entries: any[], oid: string) {
    const hasMeta = entries.some(
        (entry: { path: string }) => entry.path == `${contentpath}/meta.json`
    );
    if (!hasMeta) {
        return null;
    }

    const metacontent = await fetchGithub(
        'fetchPageContent',
        oid,
        `${contentpath}/meta.json`,
        true
    );
    return (
        metacontent &&
        metacontent !== '' &&
        JSON.parse(metacontent)?.['page meta']
    );
}

async function fetchPageCommitDetailsImpl() {
    const commitList: Awaited<ReturnType<typeof fetchNavData>> =
        await fetchGithub('fetchNavData');
    console.log('refetch PageCommitDetails');

    for (let i = 0; i < commitList.length; i++) {
        const commit = commitList[i];
        const oid = commit?.oid;
        const entries = commit?.file?.object?.entries;
        if (!oid || !entries) {
            continue;
        }

        const res: any[] = await fetchGithub(
            'fetchOctokitPaginate',
            'GET /repos/{owner}/{repo}/commits/{ref}',
            JSON.stringify({ ref: oid })
        );

        for (const { files } of res || []) {
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
                } else if (
                    file.previous_filename?.startsWith(contentpath)
                ) {
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

    await Promise.all(
        commitList.map(async (item) => {
            const entries = item?.file?.object?.entries;
            if (!entries) {
                return;
            }
            const pagemeta =
                entries && (await fetchPageMetaImpl(entries, item.oid));
            item.tree =
                entries &&
                formatNavData(
                    entries,
                    {},
                    () => {},
                    () => {},
                    true,
                    pagemeta || {}
                );
        })
    );

    return commitList;
}

async function fetchParamsPairObjImpl() {
    console.log('refetch ParamsPairObj');
    const commitList: Awaited<ReturnType<typeof fetchPageCommitDetails>> =
        await fetchGithub('fetchPageCommitDetails');
    const objectPair: fetchParamsPairObjType = {};

    for (const commit of commitList) {
        const committedDate = commit?.committedDate;
        const oid = commit?.oid;
        const message = commit?.message;
        const entries = commit?.file?.object?.entries;
        if (!oid || !entries) {
            continue;
        }

        objectPair[oid] = {};
        const res: any[] = await fetchGithub(
            'fetchOctokitPaginate',
            'GET /repos/{owner}/{repo}/commits/{ref}',
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
                const nextEntry = {
                    path,
                    name,
                    status,
                    patch: status == 'modified' ? findPatch() : [],
                    committedDate,
                    commitMessage: message,
                };

                const existingEntry = objectPair[oid][slug];
                if (
                    existingEntry &&
                    existingEntry.status != 'removed' &&
                    nextEntry.status == 'removed'
                ) {
                    return;
                }

                if (
                    !existingEntry ||
                    existingEntry.status == 'removed' ||
                    nextEntry.status != 'removed'
                ) {
                    objectPair[oid][slug] = nextEntry;
                }

                function findPatch() {
                    for (const { files } of res || []) {
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
}

export const fetchNavData = unstable_cache(fetchNavDataImpl, ['fetchNavData'], {
    tags: ['fetchNavData'],
});

export const fetchPageContent = unstable_cache(
    fetchPageContentImpl,
    ['fetchPageContent'],
    {
        tags: ['fetchPageContent'],
    }
);

export const fetchResolvedCommitPath = unstable_cache(
    resolveCommitPathCaseImpl,
    ['fetchResolvedCommitPath'],
    {
        tags: ['fetchResolvedCommitPath'],
    }
);

export const fetchOctokitPaginate = unstable_cache(
    fetchOctokitPaginateImpl,
    ['fetchOctokitPaginate'],
    {
        tags: ['fetchOctokitPaginate'],
    }
);

export const fetchPageCommitDetails = unstable_cache(
    fetchPageCommitDetailsImpl,
    ['fetchPageCommitDetails'],
    {
        tags: ['fetchPageCommitDetails'],
    }
);

export const fetchParamsPairObj = unstable_cache(
    fetchParamsPairObjImpl,
    ['fetchParamsPairObj'],
    {
        tags: ['fetchParamsPairObj'],
    }
);

export const cacheFunction = {
    fetchNavData,
    fetchPageCommitDetails,
    fetchParamsPairObj,
    fetchOctokitPaginate,
    fetchPageContent,
    fetchResolvedCommitPath,
};

export type cacheType = keyof typeof cacheFunction;

export const fetchGithub = cache(
    async (type: cacheType, ...rest: (boolean | string)[]) => {
        try {
            if (!(type in cacheFunction)) {
                console.log(`co loi o fetchGithub: wrong type request: ${type}`);
                return null;
            }

            const handler = cacheFunction[type] as (
                ...args: (boolean | string)[]
            ) => Promise<any>;
            const data = await handler(...rest);
            console.log(`fetchGithub cached: ${type} / ${rest}`);
            return data;
        } catch (e) {
            console.log(`co loi o fetchGithub: ${e} | ${type} | ${rest}`);
            return null;
        }
    }
);

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
