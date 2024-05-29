'use client';
import { useEffect } from 'react';
import useScrollbarSize from 'react-scrollbar-size';
export const ScrollbarSize = () => {
    const { height, width } = useScrollbarSize();
    useEffect(() => {
        document.documentElement.style.setProperty(
            '--scrollbar_width',
            `${width}px`
        );
    }, [height, width]);
    return <></>;
};
