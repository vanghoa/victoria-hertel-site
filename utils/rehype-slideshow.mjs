import getImageSize from 'image-size';
import { visit } from 'unist-util-visit';
import path from 'path';

export const rehypeSlideShow = (options) => {
    return (tree) => {
        const slug = path.resolve('./public', 'assets');
        // `${options?.root ?? ''}/public/assets`;
        visit(
            tree,
            { type: 'mdxJsxFlowElement', name: 'SlideShow' },
            (node) => {
                const srcArr = JSON.parse(
                    node.attributes
                        ?.find((attr) => attr.name === 'src')
                        ?.value.value.replaceAll("'", '"') || '[]'
                );
                const slideshow = srcArr.reduce((result, src) => {
                    try {
                        const imageSize = getImageSize(`${slug}${src}`);
                        result.push({
                            src,
                            size: imageSize,
                        });
                    } catch (error) {
                        console.log(error);
                    }
                    return result;
                }, []);
                node.attributes.push({
                    type: 'mdxJsxAttribute',
                    name: 'slideshow',
                    value: JSON.stringify(slideshow),
                });
            }
        );
    };
};

export default rehypeSlideShow;
