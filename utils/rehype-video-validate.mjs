import { visit } from 'unist-util-visit';
import path from 'path';
const { promisify } = require('util');
const sizeOf = promisify(require('image-size'));

export const rehypeVideoValidate = () => {
    return (tree) => {
        // This matches all MDX' <Video /> components.
        visit(tree, { type: 'mdxJsxFlowElement', name: 'Video' }, (node) => {
            const srcAttr = node.attributes?.find(
                (attr) => attr.name === 'src'
            );
            if (!srcAttr?.value || typeof srcAttr?.value != 'string') {
                return;
            }
            const parseSrc = parseVideo(srcAttr.value);
            node.attributes.push({
                type: 'mdxJsxAttribute',
                name: 'type',
                value: parseSrc.type,
            });
        });
    };
};

export const asyncRehypeVideoValidate = () => async (tree) => {
    const promises = [];
    const Visitor = (node) => {
        const srcAttr = node.attributes?.find((attr) => attr.name === 'src');
        const thumbnail = node.attributes?.find(
            (attr) => attr.name === 'thumbnail'
        );
        if (!srcAttr?.value || typeof srcAttr?.value != 'string') {
            return;
        }
        const parseSrc = parseVideo(srcAttr.value);
        if (!parseSrc.type) {
            return;
        }
        if (parseSrc.type == 'googleapi') {
            node.attributes.push({
                type: 'mdxJsxAttribute',
                name: 'type',
                value: parseSrc.type,
            });
            const width = node.attributes?.find(
                (attr) => attr.name === 'width'
            );
            const height = node.attributes?.find(
                (attr) => attr.name === 'height'
            );
            if (thumbnail?.value && typeof thumbnail?.value == 'string') {
                const fullPath = path.join(
                    process.cwd(),
                    'public',
                    'assets',
                    thumbnail.value
                );
                node.attributes.push({
                    type: 'mdxJsxAttribute',
                    name: 'localthumbnail',
                    value: `/assets${thumbnail.value}`,
                });
                if (!width || !height) {
                    const promise = sizeOf(fullPath).then((d) => {
                        node.attributes.push({
                            type: 'mdxJsxAttribute',
                            name: 'width',
                            value: d.width,
                        });
                        node.attributes.push({
                            type: 'mdxJsxAttribute',
                            name: 'height',
                            value: d.height,
                        });
                    });
                    promises.push(promise);
                }
            }
            return;
        }
        const promise = fetch(`http://noembed.com/embed?url=${srcAttr.value}`, {
            cache: 'force-cache',
        })
            .then((response) => response.json())
            .then((noEmbed) => {
                node.attributes.push({
                    type: 'mdxJsxAttribute',
                    name: 'type',
                    value: parseSrc.type,
                });
                node.attributes.push({
                    type: 'mdxJsxAttribute',
                    name: 'width',
                    value: noEmbed.width,
                });
                node.attributes.push({
                    type: 'mdxJsxAttribute',
                    name: 'height',
                    value: noEmbed.height,
                });
                node.attributes.push({
                    type: 'mdxJsxAttribute',
                    name: 'thumbnail',
                    value: noEmbed.thumbnail_url,
                });
            })
            .catch(() => {});

        promises.push(promise);
    };

    visit(tree, { type: 'mdxJsxFlowElement', name: 'Video' }, Visitor);
    await Promise.all(promises);

    return;
};

export default rehypeVideoValidate;

function parseVideo(url) {
    // - Supported YouTube URL formats:
    //   - http://www.youtube.com/watch?v=My2FRPA3Gf8
    //   - http://youtu.be/My2FRPA3Gf8
    //   - https://youtube.googleapis.com/v/My2FRPA3Gf8
    // - Supported Vimeo URL formats:
    //   - http://vimeo.com/25451551
    //   - http://player.vimeo.com/video/25451551
    // - Also supports relative URLs:
    //   - //player.vimeo.com/video/25451551

    const match = url.match(
        /(https?:\/\/)?(player\.)?(www\.)?(vimeo\.com|youtu(be\.com|\.be|be\.googleapis\.com))\/(video\/|embed\/|watch\?v=|v\/)?([A-Za-z0-9._%-]*)/
    );

    if (match) {
        const [, , , , domain, , , id] = match;
        let type = null;

        if (domain.includes('youtu')) {
            type = 'youtube';
        } else if (domain.includes('vimeo')) {
            type = 'vimeo';
        }

        return { type, id };
    }

    // Detect Google Cloud Storage .mp4 links
    if (/^https?:\/\/storage\.googleapis\.com\/.+\.mp4$/i.test(url)) {
        return {
            type: 'googleapi',
        };
    }

    return null;
}
