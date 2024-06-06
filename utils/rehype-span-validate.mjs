import { visit } from 'unist-util-visit';

export const rehypeSpanValidate = () => {
    return (tree) => {
        visit(
            tree,
            { type: 'mdxJsxFlowElement', name: 'Span' },
            (node, index, parent) => {
                node.attributes.push({
                    type: 'mdxJsxAttribute',
                    name: 'isTop',
                    value: true,
                });
                console.log(parent, 'flow-elem');
            }
        );

        visit(
            tree,
            { type: 'mdxJsxTextElement', name: 'Span' },
            (node, index, parent) => {
                console.log(parent, 'text-elem');
            }
        );
    };
};

export default rehypeSpanValidate;
