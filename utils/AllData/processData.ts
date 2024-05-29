import { fetchGithub } from '@/utils/AllData/githubClient';
import { contentpath, contentpatharr, formatSlug } from '../constants/paths';

export const formatNavData = (
    arr: any[],
    obj: any = {},
    funcIfFile: any = () => {},
    funcIfFolder: any = () => {},
    isFirst: boolean = true
) => {
    let added_counter = 0;
    let modified_counter = 0;
    let allfiles_counter = 0;
    for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        const name_split = item.path.split('/');
        let name = name_split[name_split.length - 1];
        const isMD = name.endsWith('.md');
        const isMDX = name.endsWith('.mdx');

        if (item.object?.entries) {
            const entries = {};
            const folder_status = formatNavData(
                item.object.entries,
                entries,
                funcIfFile,
                funcIfFolder,
                false
            );
            //
            obj[name] = {
                type: 'folder',
                entries: entries,
                status: item.status || folder_status,
            };
            added_counter +=
                obj[name].status == 'added' || obj[name].status == 'renamed'
                    ? 1
                    : 0;
            modified_counter += obj[name].status != 'neutral' ? 1 : 0;
            allfiles_counter++;
            funcIfFolder({
                item,
                name,
                path: item.path,
                obj: obj[name],
                status: obj[name].status,
            });
        } else if (isMD || isMDX) {
            name = name.slice(0, isMD ? -3 : -4);
            //
            if (item.status == 'removed' && name in obj) {
                continue;
            }
            obj[name] = {
                type: 'page',
                status: item.status || 'neutral',
                slug: formatSlug(item.path),
            };
            added_counter +=
                obj[name].status == 'added' || obj[name].status == 'renamed'
                    ? 1
                    : 0;
            modified_counter += obj[name].status != 'neutral' ? 1 : 0;
            allfiles_counter++;
            funcIfFile({
                item,
                name,
                path: item.path,
                slug: obj[name].slug,
                obj: obj[name],
                status: obj[name].status,
            });
        }
    }
    let status = 'neutral';
    if (added_counter >= allfiles_counter) {
        status = 'added';
    } else if (modified_counter > 0) {
        status = 'modified';
    }
    return isFirst ? obj : status;
};

export const formatPageCommitDetails = (
    filename: string,
    status: string,
    arr: any[]
) => {
    for (let i = 0; i < arr.length; i++) {
        const item = arr[i];

        if (item.path == filename) {
            item.status = status;
            return true;
        }

        if (item.object?.entries) {
            if (formatPageCommitDetails(filename, status, item.object.entries))
                return true;
        }
    }
    return false;
};
export const formatPageCommitDetails_removed = (
    filename: string,
    entries: any[],
    level: number = 1,
    index_removed: { index: number; prevpath: string }
) => {
    for (let i = 0; i < entries.length; i++) {
        let item = entries[i];
        if (
            item.path ==
            filename
                .split('/')
                .slice(0, contentpatharr.length + level)
                .join('/')
        ) {
            if (item.object?.entries) {
                formatPageCommitDetails_removed(
                    filename,
                    item.object.entries,
                    level + 1,
                    index_removed
                );
            } else {
                item = removedObjectGeneration(filename, level);
            }
            return;
            //
        }
    }
    const foundIndex =
        entries.findIndex(({ path }) => path == index_removed.prevpath) + 1;
    entries.splice(
        foundIndex == 0 ? index_removed.index : foundIndex,
        0,
        removedObjectGeneration(filename, level)
    );
    //

    function removedObjectGeneration(filename: string, level: number): any {
        return {
            status: 'removed',
            path: filename
                .split('/')
                .slice(0, contentpatharr.length + level)
                .join('/'),
            object:
                contentpatharr.length + level < filename.split('/').length
                    ? {
                          entries: [
                              removedObjectGeneration(filename, level + 1),
                          ],
                      }
                    : {},
        };
    }
};
export function findIndexRemoved(
    filename: string,
    entriespre: any[],
    entries: any[],
    level: number = 1
) {
    const processed_filename = filename
        .split('/')
        .slice(0, contentpatharr.length + level)
        .join('/');
    for (let i = 0; i < entries.length; i++) {
        let item = entries[i];
        let itempre = entriespre[i];
        if (item.path == processed_filename) {
            if (
                item.object?.entries &&
                itempre?.path == processed_filename &&
                itempre?.object?.entries
            ) {
                return findIndexRemoved(
                    filename,
                    itempre.object.entries,
                    item.object.entries,
                    level + 1
                );
            } else {
                const prevpath: string = entries[i - 1]?.path || '';
                return { index: i, prevpath };
            }
        }
    }
    return { index: 0, prevpath: '' };
}
