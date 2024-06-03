import { NavClient } from './Client';
import { contentpath, formatSlug } from '@/utils/constants/paths';
import fs from 'fs';
import {
    fetchGithub,
    fetchPageCommitDetails,
} from '@/utils/AllData/githubClient';
import { localDate } from '@/utils/smallUtils';
import meta from '@/public/content/meta.json';

type PageMeta = {
    [key: string]: {
        order: number;
        entries?: PageMeta;
    };
};

type WalkDirectoryObj = {
    __treekeys?: string[];
} & {
    [key: string]:
        | {
              order: number;
              status: string;
              type: 'folder' | 'page';
              slug?: string;
              path?: string;
              entries?: WalkDirectoryObj;
          }
        | string[];
};

export const walkDirectory = (
    path: string = contentpath,
    obj: WalkDirectoryObj = {},
    pagemeta: PageMeta = meta['page meta']
) => {
    // need cache
    // console.log('refetch walkdirectory');
    let dir = fs.readdirSync(path);
    for (let i = 0; i < dir.length; i++) {
        let name = dir[i];
        let target = path + '/' + name;
        let stats = fs.statSync(target);
        const isMD = name.endsWith('.md');
        const isMDX = name.endsWith('.mdx');

        if (stats.isFile() && (isMD || isMDX)) {
            name = name.slice(0, isMD ? -3 : -4);
            obj[name] = {
                type: 'page',
                status: 'latest',
                slug: formatSlug(target),
                path: target,
                order: pagemeta[name]?.order || 0,
            };
        } else if (stats.isDirectory()) {
            obj[name] = {
                type: 'folder',
                status: 'latest',
                order: pagemeta[name]?.order || 0,
                entries: {},
            };
            walkDirectory(
                target, // @ts-ignore
                obj[name]?.entries,
                pagemeta[name]?.entries || {}
            );
        }
    }
    obj.__treekeys = Object.keys(obj).sort(
        // @ts-ignore
        (a, b) => obj[a].order - obj[b].order
    );
    return obj;
};

/* sample object structure 
{
  about: '',
  contact: '',
  home: {},
  portfolio: {
    'core, 2021': '',
    'drop, 2022': '',
    'scent, 2022': '',
    'steps, 2022': '',
    'times, 2023': ''
  }
}
*/

export const NavServer = async () => {
    console.log('server rendered');
    const commitList: Awaited<ReturnType<typeof fetchPageCommitDetails>> =
        await fetchGithub('fetchPageCommitDetails');
    commitList.unshift({
        committedDate: localDate(),
        oid: 'latest',
        tree: walkDirectory(),
        message: 'this is the latest site! this is the latest site!',
    });
    const oidOrder = commitList.reduce(
        (acc, cur, index) => ((acc[cur.oid] = index), acc),
        {}
    );
    return <NavClient commitList={commitList} oidOrder={oidOrder} />;
};
