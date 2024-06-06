/**
 * rehype-image-size.js
 *
 * Requires:
 * - npm i image-size unist-util-visit
 */
import getImageSize from 'image-size';
import { visit } from 'unist-util-visit';
import path from 'path';

/**
 * Analyze local MDX images and add `width` and `height` attributes to the
 * generated `img` elements.
 * Supports both markdown-style images and MDX <Image /> components.
 * @param {string} options.root - The root path when reading the image file.
 */
export const rehypeImageSize = (options) => {
    return (tree) => {
        const slug = path.resolve('./public', 'assets');
        // `${options?.root ?? ''}/public/assets`;
        visit(tree, { type: 'element', tagName: 'img' }, (node) => {
            if (node.properties.width || node.properties.height) {
                return;
            }
            const imagePath = `${slug}${node.properties.src}`;
            try {
                const imageSize = getImageSize(imagePath);
                node.properties.width = imageSize.width;
                node.properties.height = imageSize.height;
            } catch (error) {
                console.log(error);
            }
        });
        // This matches all MDX' <Image /> components.
        visit(tree, { type: 'mdxJsxTextElement', name: 'Image' }, mdxJSXElem);
        visit(tree, { type: 'mdxJsxFlowElement', name: 'Image' }, mdxJSXElem);

        function mdxJSXElem(node) {
            const srcAttr = node.attributes?.find(
                (attr) => attr.name === 'src'
            );
            const imagePath = `${slug}${srcAttr.value}`;
            try {
                const imageSize = getImageSize(imagePath);
                const widthAttr = node.attributes?.find(
                    (attr) => attr.name === 'width'
                );
                const heightAttr = node.attributes?.find(
                    (attr) => attr.name === 'height'
                );
                if (widthAttr || heightAttr) {
                    return;
                }
                node.attributes.push({
                    type: 'mdxJsxAttribute',
                    name: 'width',
                    value: imageSize.width,
                });
                node.attributes.push({
                    type: 'mdxJsxAttribute',
                    name: 'height',
                    value: imageSize.height,
                });
            } catch (error) {
                console.log(error);
            }
        }
    };
};

export default rehypeImageSize;
