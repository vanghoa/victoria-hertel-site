'use client';
import dynamic from 'next/dynamic';
import { JSX, useState } from 'react';
import { VimeoPlayerProps } from 'react-player/vimeo';
import { YouTubePlayerProps } from 'react-player/youtube';
import { Fallback } from './Server';
const ReactPlayerYoutube = dynamic(() => import('react-player/youtube'), {
    ssr: false,
});
const ReactPlayerVimeo = dynamic(() => import('react-player/vimeo'), {
    ssr: false,
});

export const ReactPlayer = ({
    src,
    type,
    width,
    height,
    thumbnail,
    status,
}: any) => {
    const params = {
        url: src,
        className: 'video',
        width: '100%',
        height: '100%',
        controls: true,
        playsinline: true,
        onPlay: () => {
            setStart(true);
        },
    };
    const [start, setStart] = useState(false);

    return (
        <figure
            style={{
                aspectRatio: `${width} / ${height}`,
            }}
            className={`videowrapper media-plane ${status || ''}`}
        >
            {thumbnail && (
                <div className={`thumb ${start ? 'start' : ''}`}>
                    <div className="playBtn">
                        <svg viewBox="0 0 47 53">
                            <path d="M43.5 20.4378C48.1667 23.1321 48.1667 29.8679 43.5 32.5622L11.25 51.1817C6.58333 53.876 0.749997 50.5081 0.749998 45.1195L0.749999 7.88045C0.749999 2.49185 6.58333 -0.876027 11.25 1.81827L43.5 20.4378Z" />
                        </svg>
                    </div>
                    <img
                        src={thumbnail}
                        crossOrigin=""
                        data-sampler="planeTexture"
                    />
                </div>
            )}
            {(() => {
                switch (type) {
                    case 'youtube':
                        return <ReactPlayerYoutube {...params} />;
                        break;
                    case 'vimeo':
                        return <ReactPlayerVimeo {...params} />;
                        break;
                    default:
                        return <Fallback>something is wrong</Fallback>;
                        break;
                }
            })()}
        </figure>
    );
};
