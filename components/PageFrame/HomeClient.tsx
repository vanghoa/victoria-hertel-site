'use client';
import { pixelationhome } from '@/utils/constants/others';
import { blurPixelatedFs, fs, vs } from '@/utils/Curtains/shader';
import { Curtains, Plane, ShaderPass } from 'curtainsjs';
import { SetStateAction, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ISizeCalculationResult } from 'image-size/dist/types/interface';

export const HomePageClient = ({
    slideshow,
}: {
    slideshow: {
        src: string;
        size: ISizeCalculationResult;
    }[];
}) => {
    const firstUpdate = useRef(true);
    const canvasRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [FrameClass, setFrameClass] = useState('init');
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        let curtains: Curtains | null = null;
        const intervalId = setInterval(() => {
            if (!contentRef.current || !canvasRef.current) {
                return;
            }
            const mediaEl = contentRef.current.querySelector('.home-plane > *');
            if (!mediaEl) {
                return;
            }
            curtains = curtainGeneration(
                canvasRef.current,
                mediaEl,
                setFrameClass
            );
            /* postProcessing */
            let curtainsBBox = curtains.getBoundingRect();
            const resUnit = [
                Math.ceil(curtainsBBox.width / pixelationhome.pixel_unit),
                Math.ceil(curtainsBBox.height / pixelationhome.pixel_unit),
            ];
            const pixelationPass = new ShaderPass(curtains, {
                fragmentShader: blurPixelatedFs,
                uniforms: {
                    granularity: {
                        name: 'uGranularity',
                        type: '1f',
                        value: 1,
                    },
                    resolution: {
                        name: 'uResolution',
                        type: '2f',
                        value: [curtainsBBox.width, curtainsBBox.height],
                    },
                    resUnit: {
                        name: 'uResUnit',
                        type: '2f',
                        value: [resUnit[0], resUnit[1]],
                    },
                    time: {
                        name: 'uTime',
                        type: '1f',
                        value: resUnit[0] * resUnit[1],
                    },
                    step: {
                        name: 'uStep',
                        type: '1f',
                        value: 1,
                    },
                },
            });
            pixelationPass
                .onRender(() => {
                    const u = pixelationPass.uniforms;
                    // @ts-ignore
                    u.time.value -= 3.5 * u.resUnit.value[0];
                    // @ts-ignore
                    if (
                        // @ts-ignore
                        u.time.value <= 0
                    ) {
                        // @ts-ignore
                        u.time.value = u.resUnit.value[0] * u.resUnit.value[1];
                        // @ts-ignore
                        u.step.value += pixelationhome.step_;
                        // @ts-ignore
                        u.step.value > pixelationhome.step &&
                            (u.step.value = pixelationhome.step);
                        // @ts-ignore
                        u.granularity.value += u.step.value;
                    }
                    // @ts-ignore
                    if (u.granularity.value > pixelationhome.max) {
                        curtains && curtains.disableDrawing();
                        setTimeout(() => {
                            curtains && curtains.dispose();
                            setCurrent((cur) => {
                                if (cur >= slideshow.length - 1) {
                                    return 0;
                                } else {
                                    return cur + 1;
                                }
                            });
                        }, 100);
                    }
                })
                .onAfterResize(onAfterResize(curtains, pixelationPass));
            //
        }, 12000);
        return () => {
            curtains && curtains.dispose();
            clearInterval(intervalId);
        }; //This is important
    }, []);

    useEffect(() => {
        let curtains: Curtains | null = null;
        if (!contentRef.current) {
            return;
        }
        const mediaEl = contentRef.current.querySelector('.home-plane > *');
        if (!mediaEl) {
            return;
        }
        let timeout = null;
        if (firstUpdate.current) {
            firstUpdate.current = false;
            timeout = setTimeout(setUpCurtain, 1500);
        } else {
            setUpCurtain();
        }
        //
        function setUpCurtain() {
            if (!canvasRef.current) {
                return;
            }
            // create curtains instance
            curtains = curtainGeneration(
                canvasRef.current,
                mediaEl,
                setFrameClass
            );
            /* postProcessing */
            let curtainsBBox = curtains.getBoundingRect();
            const pixelationPass = new ShaderPass(curtains, {
                fragmentShader: blurPixelatedFs,
                uniforms: {
                    granularity: {
                        name: 'uGranularity',
                        type: '1f',
                        value: pixelationhome.max,
                    },
                    resolution: {
                        name: 'uResolution',
                        type: '2f',
                        value: [curtainsBBox.width, curtainsBBox.height],
                    },
                    resUnit: {
                        name: 'uResUnit',
                        type: '2f',
                        value: [
                            Math.ceil(
                                curtainsBBox.width / pixelationhome.pixel_unit
                            ),
                            Math.ceil(
                                curtainsBBox.height / pixelationhome.pixel_unit
                            ),
                        ],
                    },
                    time: {
                        name: 'uTime',
                        type: '1f',
                        value: 0,
                    },
                    step: {
                        name: 'uStep',
                        type: '1f',
                        value: pixelationhome.step,
                    },
                },
            });
            pixelationPass
                .onRender(() => {
                    const u = pixelationPass.uniforms;
                    // @ts-ignore
                    u.time.value += 3.5 * u.resUnit.value[0];
                    // @ts-ignore
                    if (
                        // @ts-ignore
                        u.time.value > // @ts-ignore
                        u.resUnit.value[0] * u.resUnit.value[1]
                    ) {
                        u.time.value = 0;
                        // @ts-ignore
                        u.step.value -= pixelationhome.step_;
                        // @ts-ignore
                        u.step.value < 1 && (u.step.value = 1);
                        // @ts-ignore
                        u.granularity.value -= u.step.value;
                    }
                    // @ts-ignore
                    if (u.granularity.value <= 2) {
                        setFrameClass('hide_canvas');
                        curtains && curtains.disableDrawing();
                        setTimeout(() => {
                            curtains && curtains.dispose();
                        }, 100);
                    }
                })
                .onAfterResize(onAfterResize(curtains, pixelationPass));
        }

        return () => {
            setFrameClass('init');
            timeout && clearTimeout(timeout);
            curtains && curtains.dispose();
        };
    }, [current]);

    return (
        <section id="page_section" className={`image ${FrameClass}`}>
            <div id="page_frame" className={`homepage`}>
                <div ref={canvasRef} id="canvas"></div>
                <div ref={contentRef} id="content">
                    {slideshow.map((slide, i) => {
                        return (
                            <div
                                key={i}
                                className={`${
                                    i == current ? 'home-plane' : ''
                                }`}
                            >
                                <div
                                    style={{
                                        aspectRatio: `${slide.size.width} / ${slide.size.height}`,
                                    }}
                                >
                                    <Image
                                        src={`/assets${slide.src}`}
                                        alt="image slideshow"
                                        sizes="(max-width: 800px) 100vw, 800px"
                                        fill={true}
                                        crossOrigin=""
                                        data-sampler="planeTexture"
                                        priority
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

const curtainGeneration = (
    container: HTMLDivElement,
    mediaEl: Element | null,
    setFrameClass: (value: SetStateAction<string>) => void
) => {
    const curtains = new Curtains({
        container,
        antialias: false, // render targets will disable default antialiasing anyway
        pixelRatio: pixelationhome.retina_scaling
            ? Math.min(1.5, window.devicePixelRatio)
            : 1, // limit pixel ratio for performance
        renderingScale:
            window.devicePixelRatio > 1 ? pixelationhome.quality : 0.3,
        premultipliedAlpha: true,
        watchScroll: false,
        depth: false,
    });
    curtains.onSuccess(async () => {
        const fonts = {
            list: ['normal 400 1em Arial, Helvetica, sans-serif'],
            loaded: 0,
        };
        const plane =
            mediaEl &&
            new Plane(curtains, mediaEl, {
                vertexShader: vs,
                fragmentShader: fs,
                widthSegments: 25,
                heightSegments: 25,
                transparent: true,
                depthTest: false,
            });
        setFrameClass('');
        return;
    });
    return curtains;
};

const onAfterResize = (
    curtains: Curtains | null,
    pixelationPass: ShaderPass
) => {
    return () => {
        if (!curtains) return;
        const curtainsBBox = curtains.getBoundingRect();
        pixelationPass.uniforms.resolution.value = [
            curtainsBBox.width,
            curtainsBBox.height,
        ];
        pixelationPass.uniforms.resUnit.value = [
            Math.ceil(curtainsBBox.width / pixelationhome.pixel_unit),
            Math.ceil(curtainsBBox.height / pixelationhome.pixel_unit),
        ];
    };
};
