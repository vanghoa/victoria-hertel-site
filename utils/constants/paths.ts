import slug from 'slug';

export const getAPIRoutePath = (slug: string) =>
    `${process.env.FETCH_URL}/api/${slug}`;

export const contentpath = 'public/content';
export const contentpatharr = contentpath.split('/');

export const getPagePath = (oid: string, slug: string) =>
    oid == 'latest' ? `/latest/${slug}` : `/timeline/${oid}/${slug}`;

slug.charmap['/'] = '-';

export const formatSlug = (path: string) => {
    path = path.replace(contentpath, '');
    ['.md', '.mdx'].some((str) => {
        if (path.endsWith(str)) {
            path = path.slice(0, -str.length);
            return true;
        }
    });
    return slug(path);
};
