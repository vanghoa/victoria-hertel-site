import Image from 'next/image';
import React from 'react';
import { ReactNode } from 'react';
import bg from '@/components/MDXComponents/contact frame.png';

export const Fallback = ({ children }: { children: ReactNode }) => {
    return <p className="text-plane">{children}</p>;
};

export const ContactCard = ({ children }: { children: ReactNode }) => {
    return (
        <div className="contactCard">
            <figure className="media-plane">
                <Image
                    src={bg.src}
                    alt={``}
                    fill={true}
                    crossOrigin=""
                    data-sampler="planeTexture"
                    sizes="(max-width: 800px) 100vw, 800px"
                />
            </figure>
            <div className="wrapper">{children}</div>
        </div>
    );
};
