'use client';

import { getPagePath } from '@/utils/constants/paths';
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
    currentoid,
    currentslug,
    pathname,
    commit,
}: {
    currentoid: string;
    currentslug: string;
    pathname: string;
    commit: any;
}) => {
    const columnRef = useRef<HTMLLIElement>(null);
    const {
        oid,
        tree,
        committedDate,
        message,
        changedFilesIfAvailable,
        additions,
        deletions,
        committer,
    } = commit;
    const isCurrentOid = currentoid == oid;
    const [msgShort, setMsgShort] = useState(true);
    return (
        <li
            className={`column ${isCurrentOid ? 'current' : ''}`}
            ref={columnRef}
        >
            <section className="flexcolumn">
                <div className="info">
                    <div className="indicator textured_bg"></div>
                    <div className="date">
                        <p>{oid}</p>
                        <p>{committer?.name || 'Victoria'}</p>
                        <p>{committedDate.date}</p>
                        <p>{committedDate.time}</p>
                        <p className="details">
                            <span className="changed">
                                {changedFilesIfAvailable || '0'}
                            </span>
                            <span className="additions">
                                {additions || '0'}
                            </span>
                            <span className="deletions">
                                {deletions || '0'}
                            </span>
                        </p>
                    </div>
                    <p
                        className={`message ${msgShort ? 'short' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setMsgShort((value) => !value);
                        }}
                    >
                        &ldquo;{message}&rdquo;
                    </p>
                </div>
                <NavFrame
                    href={`${pathname}?type=open`}
                    className="mobile"
                    style={{ zIndex: '1000' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        columnRef.current?.scrollTo({
                            top: 0,
                            behavior: 'smooth',
                        });
                    }}
                    pgName={'menu'}
                />
                <WalkReactDir
                    tree={tree}
                    oid={oid}
                    isCurrentOid={isCurrentOid}
                    currentslug={currentslug}
                />
                <NavFrame
                    href={`${pathname}?type=timeline`}
                    className="timestamp"
                    onClick={(e) => {
                        e.stopPropagation();
                        columnRef.current?.scrollTo({
                            top: 0,
                            behavior: 'smooth',
                        });
                    }}
                    pgName={
                        <>
                            {committedDate.date}
                            <br></br> at {committedDate.time}
                        </>
                    }
                />
                <NavFrame className="extraspace" pgName={''} />
            </section>
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
    onClick = (e: MouseEvent) => {
        e.stopPropagation();
    },
}: {
    children?: ReactNode;
    pgName?: ReactNode;
    style?: CSSProperties;
    href?: string | false;
    className?: string;
    status?: string;
    onClick?: (e: MouseEvent) => void;
}) => {
    const Inner = (
        <>
            <div className="image">{children}</div>
            <div className="description">
                <span className="left">{pgName}</span>
            </div>
        </>
    );
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

const NavFolder = ({
    tree,
    treekey,
    style,
    level,
    oid,
    currentslug,
    isCurrentOid,
}: {
    tree: any;
    treekey: string;
    style: CSSProperties;
    level: number;
    oid: string;
    currentslug: string;
    isCurrentOid: boolean;
}) => {
    const [isClose, setIsClose] = useState(false);
    return (
        <div
            className={`nested ${tree[treekey].status} ${
                isClose ? 'close' : ''
            }`}
            style={{
                left: `calc(0px - var(--left_offset_polaroid))`,
                ...style,
            }}
        >
            <NavFrame
                style={{
                    zIndex: '1000',
                    left: `var(--left_offset_polaroid)`,
                }}
                pgName={`${treekey}/...`}
                status={tree[treekey].status}
                onClick={(e) => {
                    e.stopPropagation();
                    setIsClose((value) => !value);
                }}
            />
            <WalkReactDir
                oid={oid}
                currentslug={currentslug}
                tree={tree[treekey].entries}
                level={level + 1}
                isCurrentOid={isCurrentOid}
            />
        </div>
    );
};

export const WalkReactDir = ({
    tree,
    level = 1,
    oid,
    currentslug,
    isCurrentOid,
}: {
    tree: any;
    level?: number;
    oid: string;
    currentslug: string;
    isCurrentOid: boolean;
}) => {
    const treekeys = tree.__treekeys || Object.keys(tree);
    return treekeys.map((key: string, i: number) => {
        const style = { zIndex: `${treekeys.length - i}` };
        if (tree[key].type === 'folder') {
            return (
                <NavFolder
                    key={i}
                    tree={tree}
                    treekey={key}
                    style={style}
                    level={level}
                    oid={oid}
                    currentslug={currentslug}
                    isCurrentOid={isCurrentOid}
                />
            );
        }
        return (
            <NavFrame
                style={style}
                pgName={key}
                key={i}
                href={getPagePath(oid, tree[key].slug)}
                status={tree[key].status}
                className={
                    isCurrentOid && currentslug == tree[key].slug
                        ? 'current_pg'
                        : ''
                }
            />
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
    const searchParams = useSearchParams().get('type');
    const navRef = useRef<HTMLElement>(null);
    const [isGreen, setIsGreen] = useState<boolean>(false);
    const [isRed, setIsRed] = useState<boolean>(false);
    const [isBlue, setIsBlue] = useState<boolean>(false);
    // const [navCurrent, setNavCurrent] = useState<number>(oidOrder[oid]);

    const dblHandle = (e: MouseEvent, isBack: boolean = true) => {
        e.stopPropagation();
        navRef.current &&
            navRef.current.style.setProperty(
                '--nav_current',
                `${isBack ? 0 : commitList.length - 1}`
            );
        // setNavCurrent(isBack ? 0 : commitList.length - 1);
    };

    const singleHandle = (e: MouseEvent, offset: number) => {
        e.stopPropagation();
        if (navRef.current) {
            let newcur =
                +navRef.current.style.getPropertyValue('--nav_current') +
                offset;
            if (newcur < 0) {
                newcur = 0;
            } else if (newcur > commitList.length - 1) {
                newcur = commitList.length - 1;
            }
            navRef.current.style.setProperty('--nav_current', `${newcur}`);
        }
        /*
        setNavCurrent((cur: number) => {
            let newcur = cur + offset;
            if (newcur < 0) {
                newcur = 0;
            } else if (newcur > commitList.length - 1) {
                newcur = commitList.length - 1;
            }
            return newcur;
        });*/
    };

    useEffect(() => {
        navRef.current &&
            navRef.current.style.setProperty(
                '--nav_current',
                `${oidOrder[oid]}`
            );
        // setNavCurrent(oidOrder[oid]);
    }, [oid, searchParams]);

    return (
        <nav
            className={`${searchParams || ''} ${isBlue ? 'blue' : ''} ${
                isGreen ? 'green' : ''
            } ${isRed ? 'red' : ''}`}
            onClick={() => {
                router.push(pathname);
            }}
            ref={navRef}
            style={
                {
                    '--nav_current': oidOrder[oid],
                } as CSSProperties
            }
            /*
            style={
                {
                    '--nav_current': navCurrent,
                } as CSSProperties
            }*/
        >
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
            {children}
            <section className="filter_nav">
                <button
                    className="blue textured_bg"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsBlue((value) => !value);
                    }}
                >
                    <span className="question_mark">
                        <span>?</span>
                    </span>
                    <NavFrame
                        className="instruction_hover"
                        pgName={'blue means it is modified'}
                    />
                </button>
                <button
                    className="green textured_bg"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsGreen((value) => !value);
                    }}
                >
                    <span className="question_mark">
                        <span>?</span>
                    </span>
                    <NavFrame
                        className="instruction_hover"
                        pgName={'green means it is added'}
                    />
                </button>
                <button
                    className="red textured_bg"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsRed((value) => !value);
                    }}
                >
                    <span className="question_mark">
                        <span>?</span>
                    </span>
                    <NavFrame
                        className="instruction_hover"
                        pgName={'red means it is removed'}
                    />
                </button>
            </section>
        </nav>
    );
};

export const NavTimelineContent = ({
    commitList,
    pathname,
    oid,
    slug,
}: {
    commitList: any[];
    pathname: string;
    oid: string;
    slug: string;
}) => {
    return (
        <ul className="wrapper">
            {commitList.map((commit, index) => {
                return (
                    <NavColumn
                        key={index}
                        currentoid={oid}
                        currentslug={slug}
                        pathname={pathname}
                        commit={commit}
                    />
                );
            })}
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
    const params = useParams<{ oid: string; slug: string }>();
    const oid = params.oid || 'latest';
    const slug = params.slug || '';
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
                slug={slug}
            />
        </NavTimeline>
    );
};
