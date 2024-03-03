import { CSSProperties, ReactNode } from 'react';
import fs from 'fs';
import { contentpath } from './Paths';
import { useFixedRandom, scale } from '@/utils/smallUtils';

function walkDirectory(path: string, obj: any) {
    let dir = fs.readdirSync(path);
    for (let i = 0; i < dir.length; i++) {
        let name = dir[i];
        let target = path + '/' + name;
        let stats = fs.statSync(target);
        if (stats.isFile()) {
            if (name.slice(-3) === '.md') {
                obj[name.slice(0, -3)] = '';
            }
        } else if (stats.isDirectory()) {
            obj[name] = {};
            walkDirectory(target, obj[name]);
        }
    }
}

const WalkReactDir = ({ tree, level = 1 }: { tree: any; level?: number }) => {
    const treekeys = Object.keys(tree);
    return treekeys.map((key, i) => {
        const style = { zIndex: `${treekeys.length - i}` };
        if (typeof tree[key] === 'object') {
            return (
                <div
                    className="nested"
                    style={{
                        left: `calc(0px - var(--left_offset_polaroid))`,
                        ...style,
                    }}
                    key={i}
                >
                    <NavFrame
                        style={{
                            zIndex: '1000',
                            left: `var(--left_offset_polaroid)`,
                        }}
                        pgName={key}
                        key={i}
                    ></NavFrame>
                    <WalkReactDir tree={tree[key]} level={level + 1} />
                </div>
            );
        }
        return <NavFrame style={style} pgName={key} key={i}></NavFrame>;
    });
};

export const NavColumn = async () => {
    let tree = {};
    walkDirectory(contentpath, tree);
    console.log(tree);
    return (
        <nav>
            <section>
                <WalkReactDir tree={tree} />
                <NavFrame
                    pgName={
                        <>
                            Current timestamp: <br></br> 01.23.2024
                        </>
                    }
                ></NavFrame>
            </section>
        </nav>
    );
};

export const NavFrame = ({
    children = '',
    pgName = 'Victoria Hertel Velasco',
    style = {},
}: {
    children?: ReactNode;
    pgName?: ReactNode;
    style?: CSSProperties;
}) => {
    return (
        <div className="polaroid">
            <div className="outer" style={style}>
                <div className="image">{children}</div>
                <div className="description">
                    <span className="left">{pgName}</span>
                </div>
            </div>
        </div>
    );
};
