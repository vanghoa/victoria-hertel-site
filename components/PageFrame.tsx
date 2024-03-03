import { ReactNode } from 'react';

export const PageFrame = ({
    children,
    pgName = 'Victoria Hertel Velasco',
    date = 'XX/XX/XXXX',
}: {
    children: ReactNode;
    pgName?: string;
    date?: string;
}) => {
    return (
        <>
            <section className="image">{children}</section>
            <section className="description">
                <span className="left">{pgName}</span>
                <span className="right">{date}</span>
            </section>
        </>
    );
};
