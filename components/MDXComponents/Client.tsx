'use client';
import dynamic from 'next/dynamic';
import { ReactNode, useRef, useState } from 'react';
import { Fallback } from './Server';
import Image from 'next/image';
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
    localthumbnail,
    status,
}: any) => {
    function onPlay() {
        setPlaying(true);
        vidRef.current?.play();
    }
    const params = {
        url: src,
        className: 'video',
        width: '100%',
        height: '100%',
        controls: true,
        playsinline: true,
    };
    const [playing, setPlaying] = useState(false);
    const vidRef = useRef<null | HTMLVideoElement>(null);

    return (
        <figure
            style={{
                aspectRatio: `${width} / ${height}`,
            }}
            className={`videowrapper media-plane ${status || ''}`}
        >
            {thumbnail && (
                <div
                    onClick={onPlay}
                    className={`thumb ${playing ? 'start' : ''}`}
                >
                    <div className="playBtn">
                        <svg viewBox="0 0 47 53">
                            <path d="M43.5 20.4378C48.1667 23.1321 48.1667 29.8679 43.5 32.5622L11.25 51.1817C6.58333 53.876 0.749997 50.5081 0.749998 45.1195L0.749999 7.88045C0.749999 2.49185 6.58333 -0.876027 11.25 1.81827L43.5 20.4378Z" />
                        </svg>
                    </div>
                    {localthumbnail ? (
                        <Image
                            src={localthumbnail}
                            alt={`thumbnail`}
                            fill={true}
                            crossOrigin=""
                            data-sampler="planeTexture"
                            sizes="(max-width: 800px) 100vw, 800px"
                        />
                    ) : (
                        <img
                            src={thumbnail}
                            crossOrigin=""
                            data-sampler="planeTexture"
                        />
                    )}
                </div>
            )}
            {(() => {
                switch (type) {
                    case 'youtube':
                        return (
                            <ReactPlayerYoutube playing={playing} {...params} />
                        );
                        break;
                    case 'vimeo':
                        return (
                            <ReactPlayerVimeo playing={playing} {...params} />
                        );
                        break;
                    case 'googleapi':
                        return (
                            <video
                                className="video"
                                style={{ width: '100%', height: '100%' }}
                                controls
                                ref={vidRef}
                            >
                                <source src={src} type="video/mp4"></source>
                            </video>
                        );
                        break;
                    default:
                        return <Fallback>something is wrong</Fallback>;
                        break;
                }
            })()}
        </figure>
    );
};
