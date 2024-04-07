// import + global config
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

// graphql queries
const test = importGraphql('./graphql/test.graphql');

// main func
main();
async function main() {
    await githubFile(test, 'test.json');
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
    beforewritefunc(res);
    fs.writeFileSync(`${dir_source}${filepath}`, JSON.stringify(res));
    return res;
}
function importGraphql(filepath, dirname = __dirname) {
    return fs.readFileSync(path.resolve(dirname, filepath), 'utf8');
}
