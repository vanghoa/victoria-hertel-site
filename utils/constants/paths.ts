import slug from 'slug';

export const getAPIRoutePath = (slug: string) =>
    `${process.env.FETCH_URL}/api/${slug}`;

export const contentpath = 'public/content';
export const contentpatharr = contentpath.split('/');

export const getPagePath = (oid: string, pgName: string) =>
    oid == 'latest'
        ? `/latest/${slug(pgName)}`
        : `/timeline/${oid}/${slug(pgName)}`;
