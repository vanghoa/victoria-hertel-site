import { getCommitList } from '@/utils/AllData/processData';
import { NavClient } from './Client';
import { contentpath } from '@/utils/constants/paths';
import fs from 'fs';
import { fetchGithub } from '@/utils/AllData/githubClient';

export const walkDirectory = (path: string = contentpath, obj: any = {}) => {
    let dir = fs.readdirSync(path);
    for (let i = 0; i < dir.length; i++) {
        let name = dir[i];
        let target = path + '/' + name;
        let stats = fs.statSync(target);
        if (stats.isFile() && name.endsWith('.md')) {
            name = name.slice(0, -3);
            obj[name] = {
                type: 'page',
                status: 'latest',
            };
        } else if (stats.isDirectory()) {
            obj[name] = {
                type: 'folder',
                status: 'latest',
                entries: {},
            };
            walkDirectory(target, obj[name].entries);
        }
    }
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
    const commitList: any[] = await fetchGithub('fetchPageCommitDetails');
    commitList.unshift({
        committedDate: new Date().toISOString(),
        oid: 'latest',
        tree: walkDirectory(),
    });
    const oidOrder = commitList.reduce(
        (acc, cur, index) => ((acc[cur.oid] = index), acc),
        {}
    );
    return <NavClient commitList={commitList} oidOrder={oidOrder} />;
};
