/**
 * remark-assets-src-redirect.js
 *
 * Requires:
 * - npm i image-size unist-util-visit
 */
import { visit } from 'unist-util-visit';

/**
 * Analyzes local markdown/MDX images & videos and rewrites their `src`.
 * Supports both markdown-style images, MDX <Image /> components, and `source`
 * elements. Can be easily adapted to support other sources too.
 * @param {string} options.root - The root path when reading the image file.
 */
const remarkSourceRedirect = () => {
    return (tree) => {
        // You need to grab a reference of your post's slug.
        // I'm using Contentlayer (https://www.contentlayer.dev/), which makes it
        // available under `file.data`.But if you're using something different, you
        // should be able to access it under `file.path`, or pass it as a parameter
        // the the plugin `options`.
        // This matches all images that use the markdown standard format ![label](path).
        visit(tree, 'paragraph', (node) => {
            const image = node.children.find((child) => child.type === 'image');
            if (image) {
                image.url = `assets/${image.url}`;
            }
        });
        // This matches all MDX' <Image /> components & source elements that I'm
        // using within a custom <Video /> component.
        // Feel free to update it if you're using a different component name.
        visit(tree, 'mdxJsxFlowElement', (node) => {
            if (node.name === 'Image' || node.name === 'source') {
                const srcAttr = node.attributes.find(
                    (attribute) => attribute.name === 'src'
                );
                srcAttr.value = `assets/${srcAttr.value}`;
            }
        });
    };
};

export default remarkSourceRedirect;
