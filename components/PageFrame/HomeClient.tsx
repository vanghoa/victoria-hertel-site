'use client';
import { pixelationhome } from '@/utils/constants/others';
import { blurPixelatedFs, fs, vs } from '@/utils/Curtains/shader';
import { Curtains, Plane, ShaderPass } from 'curtainsjs';
import {
    Fragment,
    SetStateAction,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';
import Image from 'next/image';
import { ISizeCalculationResult } from 'image-size/dist/types/interface';
import PageVisibility, { usePageVisibility } from 'react-page-visibility';

export const HomePageClient = ({
    slideshow
}: {
    slideshow: {
        src: string;
        size: ISizeCalculationResult;
    }[];
}) => {
    const firstUpdate = useRef(true);
    const canvasRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const curtainsRef = useRef<Curtains | null>(null);
    const [FrameClass, setFrameClass] = useState('init');
    const [current, setCurrent] = useState(0);
    const filteredSlideshow = useFilterSlideShow({ slideshow });

    const StopInterval = () => {
        curtainsRef.current && curtainsRef.current.dispose();
        intervalRef.current && clearInterval(intervalRef.current);
        curtainsRef.current = null;
    };

    const StartInterval = () => {
        // let curtains: Curtains | null = null;
        StopInterval();
        intervalRef.current = setInterval(() => {
            if (!contentRef.current || !canvasRef.current) {
                return;
            }
            const mediaEl = contentRef.current.querySelector('.home-plane > *');
            if (!mediaEl) {
                return;
            }
            curtainsRef.current = curtainGeneration(
                canvasRef.current,
                mediaEl,
                setFrameClass
            );
            /* postProcessing */
            let curtainsBBox = curtainsRef.current.getBoundingRect();
            const resUnit = [
                Math.ceil(curtainsBBox.width / pixelationhome.pixel_unit),
                Math.ceil(curtainsBBox.height / pixelationhome.pixel_unit)
            ];
            const pixelationPass = new ShaderPass(curtainsRef.current, {
                fragmentShader: blurPixelatedFs,
                uniforms: {
                    granularity: {
                        name: 'uGranularity',
                        type: '1f',
                        value: 1
                    },
                    resolution: {
                        name: 'uResolution',
                        type: '2f',
                        value: [curtainsBBox.width, curtainsBBox.height]
                    },
                    resUnit: {
                        name: 'uResUnit',
                        type: '2f',
                        value: [resUnit[0], resUnit[1]]
                    },
                    time: {
                        name: 'uTime',
                        type: '1f',
                        value: resUnit[0] * resUnit[1]
                    },
                    step: {
                        name: 'uStep',
                        type: '1f',
                        value: 1
                    }
                }
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
                        curtainsRef.current &&
                            curtainsRef.current.disableDrawing();
                        setTimeout(() => {
                            curtainsRef.current &&
                                curtainsRef.current.dispose();
                            curtainsRef.current = null;
                            setCurrent((cur) => {
                                if (cur >= filteredSlideshow.length - 1) {
                                    return 0;
                                } else {
                                    return cur + 1;
                                }
                            });
                        }, 100);
                    }
                })
                .onAfterResize(
                    onAfterResize(curtainsRef.current, pixelationPass)
                );
            //
        }, 12000);
    };

    const handleVisibilityChange = (isVisible: boolean) => {
        if (isVisible) {
            StartInterval();
        } else {
            StopInterval();
            setFrameClass('hide_canvas');
        }
    };

    useEffect(() => {
        StartInterval();
        return () => {
            StopInterval();
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
        let timeout: NodeJS.Timeout | null = null;
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
                        value: pixelationhome.max
                    },
                    resolution: {
                        name: 'uResolution',
                        type: '2f',
                        value: [curtainsBBox.width, curtainsBBox.height]
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
                            )
                        ]
                    },
                    time: {
                        name: 'uTime',
                        type: '1f',
                        value: 0
                    },
                    step: {
                        name: 'uStep',
                        type: '1f',
                        value: pixelationhome.step
                    }
                }
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
        <PageVisibility onChange={handleVisibilityChange}>
            <section id="page_section" className={`image ${FrameClass}`}>
                <div id="page_frame" className={`homepage`}>
                    <div ref={canvasRef} id="canvas"></div>
                    <div ref={contentRef} id="content" suppressHydrationWarning>
                        {filteredSlideshow.map((slide, i) => {
                            const width = slide.size.width || 0;
                            const height = slide.size.height || 0;
                            return (
                                <div
                                    key={i}
                                    className={`${
                                        i == current ? 'home-plane' : ''
                                    }`}
                                    suppressHydrationWarning
                                >
                                    <div
                                        style={{
                                            aspectRatio: ` ${width} / ${height}`,
                                            ...{
                                                [width > height
                                                    ? 'minHeight'
                                                    : 'minWidth']: 'unset'
                                            }
                                        }}
                                        className={`imageWrapper`}
                                        suppressHydrationWarning
                                    >
                                        <Image
                                            src={`/assets${slide.src}`}
                                            alt="image slideshow"
                                            sizes="100vw"
                                            fill={true}
                                            crossOrigin=""
                                            data-sampler="planeTexture"
                                            priority
                                            suppressHydrationWarning
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </PageVisibility>
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
        depth: false
    });
    curtains.onSuccess(async () => {
        const fonts = {
            list: ['normal 400 1em Arial, Helvetica, sans-serif'],
            loaded: 0
        };
        const plane =
            mediaEl &&
            new Plane(curtains, mediaEl, {
                vertexShader: vs,
                fragmentShader: fs,
                widthSegments: 25,
                heightSegments: 25,
                transparent: true,
                depthTest: false
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
            curtainsBBox.height
        ];
        pixelationPass.uniforms.resUnit.value = [
            Math.ceil(curtainsBBox.width / pixelationhome.pixel_unit),
            Math.ceil(curtainsBBox.height / pixelationhome.pixel_unit)
        ];
    };
};

const useFilterSlideShow = ({
    slideshow
}: {
    slideshow: {
        src: string;
        size: ISizeCalculationResult;
    }[];
}) => {
    const [sizeChange, setSizeChange] = useState<number | boolean>(0);
    const effectInnerWidth = useRef(0);
    const effectInnerHeight = useRef(0);
    useEffect(() => {
        const handleResize = () => {
            setSizeChange(innerWidth > innerHeight);
            effectInnerWidth.current = innerWidth;
            effectInnerHeight.current = innerHeight;
        };
        effectInnerWidth.current = innerWidth;
        effectInnerHeight.current = innerHeight;
        setSizeChange(1);

        window.addEventListener('resize', handleResize);

        // Clean up the event listener when the component unmounts
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);
    const filterSlideshow = useMemo(() => filterSlideShowFunc(), [sizeChange]);

    function filterSlideShowFunc() {
        const isVerticalScreen =
            effectInnerWidth.current < effectInnerHeight.current;
        const newSlideshow = slideshow.filter((slide) => {
            const width = slide.size.width || 0;
            const height = slide.size.height || 0;
            return isVerticalScreen == width < height;
        });
        console.log('calculate');
        return newSlideshow;
    }

    return filterSlideshow;
};
