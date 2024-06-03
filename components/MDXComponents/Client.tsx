'use client';
import dynamic from 'next/dynamic';
import { JSX } from 'react';
import { VimeoPlayerProps } from 'react-player/vimeo';
import { YouTubePlayerProps } from 'react-player/youtube';
const ReactPlayerYoutube = dynamic(() => import('react-player/youtube'), {
    ssr: false,
});
const ReactPlayerVimeo = dynamic(() => import('react-player/vimeo'), {
    ssr: false,
});

export const Vimeo = (params: JSX.IntrinsicAttributes & VimeoPlayerProps) => {
    return <ReactPlayerVimeo {...params} />;
};

export const Youtube = (
    params: JSX.IntrinsicAttributes & YouTubePlayerProps
) => {
    return <ReactPlayerYoutube {...params} />;
};
