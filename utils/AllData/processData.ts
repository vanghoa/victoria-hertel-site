import { fetchGithub } from '@/utils/AllData/githubClient';
import { contentpatharr } from '../constants/paths';

export const getCommitList = async () => {
    return await fetchGithub('fetchNavData');
};

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

        if (name.endsWith('.md')) {
            name = name.slice(0, -3);
            //
            obj[name] = {
                type: 'page',
                status: item.status || 'neutral',
            };
            added_counter += obj[name].status == 'added' ? 1 : 0;
            modified_counter += obj[name].status != 'neutral' ? 1 : 0;
            allfiles_counter++;
            funcIfFile({
                item,
                name,
                path: item.path,
                obj: obj[name],
            });
        } else if (item.object?.entries) {
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
            added_counter += obj[name].status == 'added' ? 1 : 0;
            modified_counter += obj[name].status != 'neutral' ? 1 : 0;
            allfiles_counter++;
            funcIfFolder({
                item,
                name,
                path: item.path,
                obj: obj[name],
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
    index_removed: number
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
    entries.splice(index_removed, 0, removedObjectGeneration(filename, level));
    //

    function removedObjectGeneration(filename: string, level: number): any {
        return {
            status: 'removed',
            path: filename
                .split('/')
                .slice(0, contentpatharr.length + level)
                .join('/'),
            object:
                filename.split('/').length < contentpatharr.length + level
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
    entries: any[],
    level: number = 1
) {
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
                return findIndexRemoved(
                    filename,
                    item.object.entries,
                    level + 1
                );
            } else {
                return i;
            }
        }
    }
}
