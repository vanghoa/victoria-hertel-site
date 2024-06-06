import fs from 'node:fs/promises';
import { mdxjs } from 'micromark-extension-mdxjs';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { mdxFromMarkdown, mdxToMarkdown } from 'mdast-util-mdx';
import { toMarkdown } from 'mdast-util-to-markdown';

const doc = await fs.readFile('backend/example.mdx');

const tree = fromMarkdown(doc, {
    extensions: [mdxjs()],
    mdastExtensions: [mdxFromMarkdown()],
});

console.log(tree.children[0]);
tree.children[0].children[0].attributes = [
    {
        type: 'mdxJsxAttribute',
        name: 'title',
        value: 'Hypertext Markup Language',
    },
];

const out = toMarkdown(tree, { extensions: [mdxToMarkdown()] });

console.log(out);
