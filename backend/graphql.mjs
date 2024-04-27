// import + global config
import { Octokit, App } from 'octokit';
import { graphql } from '@octokit/graphql';
import fs from 'fs';
//
import dotenv from 'dotenv';
dotenv.config();
//
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// graphql queries
const test = importGraphql('./graphql/test.graphql');

// main func
main();
async function main() {
    const commitResponse = await githubFile(test, 'nav.json');
    const {
        repository: {
            defaultBranchRef: {
                target: {
                    history: { nodes: commitArr },
                },
            },
        },
    } = commitResponse;
    for (const { oid } of commitArr) {
        const res = await octokit.paginate(
            `GET /repos/{owner}/{repo}/commits/{ref}`,
            {
                owner: 'vanghoa',
                repo: 'victoria-hertel-site',
                ref: oid,
                per_page: 100,
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28',
                    //Accept: 'application/vnd.github.patch+json',
                },
            }
        );
        writeFile(res, `commit/${oid}.json`);
    }
}

//utilities
async function githubRequest(query) {
    const res = await graphql(query, {
        headers: {
            authorization: `token ${process.env.GITHUB_TOKEN}`,
        },
    });
    return res;
}
async function githubFile(
    query,
    filepath,
    beforewritefunc = () => {},
    dir_source = './backend/data/'
) {
    const res = await githubRequest(query, filepath);
    writeFile(res, filepath, beforewritefunc, dir_source);
    return res;
}
function writeFile(
    res,
    filepath,
    beforewritefunc = () => {},
    dir_source = './backend/data/'
) {
    beforewritefunc(res);
    fs.writeFileSync(`${dir_source}${filepath}`, JSON.stringify(res));
}
function importGraphql(filepath, dirname = __dirname) {
    return fs.readFileSync(path.resolve(dirname, filepath), 'utf8');
}
