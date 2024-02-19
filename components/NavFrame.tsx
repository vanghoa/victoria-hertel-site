import { ReactNode } from 'react';
import fs from 'fs/promises';
import { contentpath } from './Paths';

export const NavColumn = async () => {
    const dir = await fs.readdir(contentpath, { recursive: true });
    console.log(dir);
    return (
        <nav>
            <ul></ul>
        </nav>
    );
};

export const NavFrame = ({
    children,
    pgName = 'Victoria Hertel Velasco',
}: {
    children: ReactNode;
    pgName?: string;
}) => {
    return (
        <li className=".outerframe">
            <section className="frame">{children}</section>
            <section className="description">
                <span className="left">{pgName}</span>
            </section>
        </li>
    );
};
