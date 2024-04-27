'use client';

import { getPagePath } from '@/utils/constants/paths';
import { localDate } from '@/utils/smallUtils';
import Link from 'next/link';
import {
    useParams,
    usePathname,
    useRouter,
    useSearchParams,
} from 'next/navigation';
import {
    CSSProperties,
    ReactNode,
    useEffect,
    useRef,
    useState,
    MouseEvent,
} from 'react';

export const NavColumn = ({
    oid,
    tree,
    date,
    currentoid,
    pathname,
}: {
    oid: string;
    tree: any;
    date: string;
    currentoid: string;
    pathname: string;
}) => {
    return (
        <li className={`column ${currentoid == oid ? 'current' : ''}`}>
            <WalkReactDir tree={tree} oid={oid} />
            <NavFrame
                href={`${pathname}?open=true`}
                className="timestamp"
                pgName={
                    <>
                        <br></br> {localDate(date)}
                    </>
                }
            />
            <NavFrame className="extraspace" pgName={''} />
        </li>
    );
};

export const NavFrame = ({
    children = '',
    pgName = 'Victoria Hertel Velasco',
    style = {},
    href = false,
    className = '',
    status = 'UI',
}: {
    children?: ReactNode;
    pgName?: ReactNode;
    style?: CSSProperties;
    href?: string | false;
    className?: string;
    status?: string;
}) => {
    const Inner = (
        <>
            <div className="image">{children}</div>
            <div className="description">
                <span className="left">{pgName}</span>
            </div>
        </>
    );
    const onClick = (e: MouseEvent) => {
        e.stopPropagation();
    };
    return (
        <div className={`polaroid ${className} ${status}`}>
            {href && status != 'removed' ? (
                <Link
                    className={`outer textured_bg`}
                    style={style}
                    href={href}
                    onClick={onClick}
                >
                    {Inner}
                </Link>
            ) : (
                <div
                    className={`outer textured_bg`}
                    style={style}
                    onClick={onClick}
                >
                    {Inner}
                </div>
            )}
        </div>
    );
};

export const WalkReactDir = ({
    tree,
    level = 1,
    oid = '',
}: {
    tree: any;
    level?: number;
    oid?: string;
}) => {
    const treekeys = Object.keys(tree);
    return treekeys.map((key, i) => {
        const style = { zIndex: `${treekeys.length - i}` };
        if (tree[key].type === 'folder') {
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
                        status={tree[key].status}
                    ></NavFrame>
                    <WalkReactDir
                        oid={oid}
                        tree={tree[key].entries}
                        level={level + 1}
                    />
                </div>
            );
        }
        return (
            <NavFrame
                style={style}
                pgName={key}
                key={i}
                href={getPagePath(oid, key)}
                status={tree[key].status}
            ></NavFrame>
        );
    });
};

export const NavTimeline = ({
    commitList,
    oidOrder,
    children,
    pathname,
    oid,
}: {
    commitList: any[];
    oidOrder: any;
    children: ReactNode;
    pathname: string;
    oid: string;
}) => {
    const router = useRouter();
    const isOpen = useSearchParams().has('open');

    const [navCurrent, setNavCurrent] = useState<number>(oidOrder[oid]);

    const dblHandle = (e: MouseEvent, isBack: boolean = true) => {
        e.stopPropagation();
        setNavCurrent(isBack ? 0 : commitList.length - 1);
    };

    const singleHandle = (e: MouseEvent, offset: number) => {
        e.stopPropagation();
        setNavCurrent((cur: number) => {
            let newcur = cur + offset;
            if (newcur < 0) {
                newcur = 0;
            } else if (newcur > commitList.length - 1) {
                newcur = commitList.length - 1;
            }
            return newcur;
        });
    };

    useEffect(() => {
        setNavCurrent(oidOrder[oid]);
    }, [oid, isOpen]);

    return (
        <nav
            className={`${isOpen ? 'open' : ''}`}
            onClick={() => {
                router.push(pathname);
            }}
            style={{ '--nav_current': navCurrent } as CSSProperties}
        >
            {children}
            <section className="timeline_nav">
                <div>
                    <button
                        className="back_twice textured_bg"
                        onClick={(e) => dblHandle(e)}
                    ></button>
                    <button
                        className="back textured_bg"
                        onClick={(e) => singleHandle(e, -1)}
                    ></button>
                </div>
                <div>
                    <button
                        className="forward textured_bg"
                        onClick={(e) => singleHandle(e, 1)}
                    ></button>
                    <button
                        className="forward_twice textured_bg"
                        onClick={(e) => dblHandle(e, false)}
                    ></button>
                </div>
            </section>
        </nav>
    );
};

export const NavTimelineContent = ({
    commitList,
    pathname,
    oid,
}: {
    commitList: any[];
    pathname: string;
    oid: string;
}) => {
    return (
        <ul className="wrapper">
            {commitList.map(
                ({ tree, committedDate, oid: commitOid }, index) => {
                    return (
                        <NavColumn
                            key={index}
                            tree={tree}
                            oid={commitOid}
                            date={committedDate}
                            currentoid={oid}
                            pathname={pathname}
                        />
                    );
                }
            )}
        </ul>
    );
};

export const NavClient = ({
    commitList,
    oidOrder,
}: {
    commitList: any[];
    oidOrder: any;
}) => {
    const oid = useParams<{ oid: string; slug: string }>().oid || 'latest';
    const pathname = usePathname();
    return (
        <NavTimeline
            commitList={commitList}
            oidOrder={oidOrder}
            pathname={pathname}
            oid={oid}
        >
            <NavTimelineContent
                commitList={commitList}
                pathname={pathname}
                oid={oid}
            />
        </NavTimeline>
    );
};
