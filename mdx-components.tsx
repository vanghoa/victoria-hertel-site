import type { MDXComponents } from 'mdx/types';
import Image from 'next/image';
import { ReactPlayer } from './components/MDXComponents/Client';
import { Fallback } from './components/MDXComponents/Server';
import { HomePageClient } from './components/PageFrame/HomeClient';
import { ISizeCalculationResult } from 'image-size/dist/types/interface';
import React from 'react';

export const MDXCustomComponents: MDXComponents = {
    Grid({ children }) {
        return <section className="grid">{children}</section>;
    },
    Col({ children, status }) {
        return (
            <div className={`col ${status || ''}`}>
                {splitChildrenByBr(children)}
            </div>
        );
    },
    Video(params) {
        return <ReactPlayer {...params} />;
    },
    SlideShow({ slideshow }: { slideshow: string }) {
        return <HomePageClient slideshow={JSON.parse(slideshow)} />;
    },
    Span: ({ children, status, isTop }) => {
        if (isTop)
            return <p className={`text-plane ${status || ''}`}>{children}</p>;
        return <span className={`${status || ''}`}>{children}</span>;
    },
    P: ({ children, status }) => {
        return <span className={`text-plane`}>{children}</span>;
    },
    Image: ({ src, alt, width, height, status }) => {
        if (!src) {
            return (
                <figure className={`${status || ''}`}>
                    <img src={src} alt={'empty source'}></img>
                </figure>
            );
        }
        if (!width || !height) {
            return (
                <figure className={`${status || ''}`}>
                    <img src={src} alt={`an image at ${src}`}></img>
                </figure>
            );
        }
        return (
            <figure
                style={{ aspectRatio: `${width} / ${height}` }}
                className={`media-plane ${status || ''}`}
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
                    <img src={src} alt={`an image at ${src}`}></img>
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
        } else if (typeof children == 'object') {
            // @ts-ignore
            if (children?.type == 'a') {
                return <li className="text-plane">{children}</li>;
            }
        }
        return <li>{children}</li>;
    },
    pre: ({ children }) => {
        return <code className="text-plane">{children}</code>;
    },
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        ...MDXCustomComponents,
        ...components,
    };
}

function splitChildrenByBr(children: React.ReactNode) {
    const result: React.ReactNode[][] = [];
    let currentGroup: React.ReactNode[] = [];

    const processChild = (child: React.ReactNode) => {
        if (child === null || child === undefined || typeof child === 'boolean')
            return;

        if (Array.isArray(child)) {
            child.forEach(processChild);
        } else if (
            React.isValidElement(child) &&
            (child.type === 'br' ||
                (typeof child.type === 'string' &&
                    child.type.toLowerCase() === 'br'))
        ) {
            // On <br />, push current group to result and start a new one
            if (currentGroup.length > 0) {
                result.push(currentGroup);
                currentGroup = [];
            }
        } else {
            currentGroup.push(child);
        }
    };

    processChild(children);

    if (currentGroup.length > 0) {
        result.push(currentGroup);
    }

    // Wrap each group with <p>
    return result.length > 1
        ? result.map((group, index) => (
              <p className="text-plane" key={index}>
                  {group}
              </p>
          ))
        : children;
}
