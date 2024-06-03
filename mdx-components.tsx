import type { MDXComponents } from 'mdx/types';
import Image from 'next/image';
import { Vimeo, Youtube } from './components/MDXComponents/Client';
import { Fallback } from './components/MDXComponents/Server';
import { HomePageClient } from './components/PageFrame/HomeClient';
import { ISizeCalculationResult } from 'image-size/dist/types/interface';

export const MDXCustomComponents: MDXComponents = {
    Grid({ children }) {
        return <section className="grid">{children}</section>;
    },
    Col({ children }) {
        return <div className="col">{children}</div>;
    },
    Video({ src, type, width, height, thumbnail }) {
        const params = {
            url: src,
            className: 'video',
            width: '100%',
            height: '100%',
            controls: true,
            playsinline: true,
        };

        return (
            <figure
                style={{
                    aspectRatio: `${width} / ${height}`,
                }}
                className="videowrapper media-plane"
            >
                {(() => {
                    switch (type) {
                        case 'youtube':
                            return (
                                <>
                                    <img
                                        src={thumbnail}
                                        crossOrigin=""
                                        data-sampler="planeTexture"
                                    />
                                    <Youtube {...params} />
                                </>
                            );
                            break;
                        case 'vimeo':
                            return (
                                <>
                                    <img
                                        src={thumbnail}
                                        crossOrigin=""
                                        data-sampler="planeTexture"
                                    />
                                    <Vimeo {...params} />
                                </>
                            );
                            break;
                        default:
                            return <Fallback>something is wrong</Fallback>;
                            break;
                    }
                })()}
            </figure>
        );
    },
    SlideShow({ slideshow }: { slideshow: string }) {
        return <HomePageClient slideshow={JSON.parse(slideshow)} />;
    },
    h1: ({ children }) => <h1 className="text-plane">{children}</h1>,
    h2: ({ children }) => <h2 className="text-plane">{children}</h2>,
    h3: ({ children }) => <h3 className="text-plane">{children}</h3>,
    h4: ({ children }) => <h4 className="text-plane">{children}</h4>,
    h5: ({ children }) => <h5 className="text-plane">{children}</h5>,
    h6: ({ children }) => <h6 className="text-plane">{children}</h6>,
    p: ({ children }) => <p className="text-plane">{children}</p>,
    img: ({ src, alt, width, height }) => {
        if (!src) {
            return (
                <figure>
                    <img src={src} alt={'empty source'}></img>
                </figure>
            );
        }
        if (!width || !height) {
            return (
                <figure>
                    <img src={src} alt={alt || `an image at ${src}`}></img>
                </figure>
            );
        }
        return (
            <figure
                style={{ aspectRatio: `${width} / ${height}` }}
                className="media-plane"
            >
                <Image
                    src={`/assets${src}`}
                    alt={alt || `an image at ${src}`}
                    fill={true}
                    crossOrigin=""
                    data-sampler="planeTexture"
                    sizes="(max-width: 800px) 100vw, 800px"
                />
            </figure>
        );
    },
    li: ({ children }) => {
        if (Array.isArray(children)) {
            return (
                <li>
                    {children.map((child, i) => {
                        if (typeof child == 'string' && child != '\n') {
                            return (
                                <p className="text-plane" key={i}>
                                    {child}
                                </p>
                            );
                        }
                        return child;
                    })}
                </li>
            );
        } else if (typeof children == 'string') {
            return <li className="text-plane">{children}</li>;
        }
        return <li>{children}</li>;
    },
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        ...MDXCustomComponents,
        ...components,
    };
}
