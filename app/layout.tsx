import type { Metadata } from 'next';
import { DM_Mono } from 'next/font/google';
import '../styles/globals.css';
import '../styles/page.scss';
import '../styles/responsive.css';
import { NavServer } from '@/components/Nav/Server';
import { ScrollbarSize } from '@/components/Layout/ScrollbarSize';
import SVGFilter from '@/components/Layout/SVGFilter';
import bg from '@/components/Layout/pattern.png';
import { CSSProperties } from 'react';

const font = DM_Mono({
    weight: ['400', '500'],
    style: ['normal', 'italic'],
    subsets: ['latin'],
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Victoria Hertel',
    description: 'Victoria Hertel website, created by Bao Anh Bui',
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            style={
                {
                    '--background_url': `url(${bg.src})`,
                } as CSSProperties
            }
        >
            <body className={font.className}>
                {/*<SVGFilter />*/}
                <ScrollbarSize />
                <NavServer />
                {children}
            </body>
        </html>
    );
}
