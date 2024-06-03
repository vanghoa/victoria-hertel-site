'use client';
import { pixelation, pixelationhome } from '@/utils/constants/others';
import {
    blurPixelatedFs,
    fs,
    simplePixelatedFs,
    vs,
} from '@/utils/Curtains/shader';
import { TextTexture } from '@/utils/Curtains/TextTexture';
import { Curtains, Plane, ShaderPass } from 'curtainsjs';
import {
    ImgHTMLAttributes,
    ReactNode,
    RefObject,
    SetStateAction,
    useEffect,
    useRef,
    useState,
} from 'react';
import Image from 'next/image';
import { ISizeCalculationResult } from 'image-size/dist/types/interface';

export default function PageClient({ children }: { children: ReactNode }) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [FrameClass, setFrameClass] = useState('init');

    useEffect(() => {
        let curtains: Curtains | null = null;
        if (!contentRef.current) {
            return;
        }
        // filter which is in viewport
        const textEls = Array.from(
            contentRef.current.querySelectorAll('.text-plane')
        ).filter((el) => {
            const { top, left } = el.getBoundingClientRect();
            return top <= innerHeight && left <= innerWidth;
        });
        const mediaEls = Array.from(
            contentRef.current.querySelectorAll('.media-plane')
        ).filter((el) => {
            const { top, left } = el.getBoundingClientRect();
            return top <= innerHeight && left <= innerWidth;
        });
        //
        const timeout = setTimeout(
            textEls.length > 0 || mediaEls.length > 0
                ? () => {
                      if (!canvasRef.current) {
                          return;
                      }
                      // create curtains instance
                      curtains = new Curtains({
                          container: canvasRef.current,
                          antialias: false, // render targets will disable default antialiasing anyway
                          pixelRatio: pixelation.retina_scaling
                              ? Math.min(1.5, window.devicePixelRatio)
                              : 1, // limit pixel ratio for performance
                          renderingScale:
                              window.devicePixelRatio > 1
                                  ? pixelation.quality
                                  : 0.3,
                          premultipliedAlpha: true,
                          watchScroll: false,
                          depth: false,
                      });
                      /* postProcessing */
                      let curtainsBBox = curtains.getBoundingRect();
                      const pixelationPass = new ShaderPass(curtains, {
                          fragmentShader: blurPixelatedFs,
                          uniforms: {
                              granularity: {
                                  name: 'uGranularity',
                                  type: '1f',
                                  value: pixelation.max,
                              },
                              resolution: {
                                  name: 'uResolution',
                                  type: '2f',
                                  value: [
                                      curtainsBBox.width,
                                      curtainsBBox.height,
                                  ],
                              },
                              resUnit: {
                                  name: 'uResUnit',
                                  type: '2f',
                                  value: [
                                      Math.ceil(
                                          curtainsBBox.width /
                                              pixelation.pixel_unit
                                      ),
                                      Math.ceil(
                                          curtainsBBox.height /
                                              pixelation.pixel_unit
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
                                  value: pixelation.step,
                              },
                          },
                      });
                      pixelationPass
                          .onRender(() => {
                              /*
                percentage--;
                let granularity =
                    pixelation.min +
                    (Math.round(percentage / (10 * 0.5)) / (10 / 0.5)) *
                        (pixelation.max - pixelation.min);
                pixelationPass.uniforms.granularity.value = granularity;
                if (percentage == 5) {
                    setFrameClass('hide_canvas');
                }
                if (percentage == 0) {
                    //curtains.disableDrawing()
                    //curtains.clear();
                    curtains && curtains.dispose();
                }
                */
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
                                  u.step.value -= pixelation.step_;
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
                          .onAfterResize(() => {
                              if (!curtains) return;
                              curtainsBBox = curtains.getBoundingRect();
                              pixelationPass.uniforms.resolution.value = [
                                  curtainsBBox.width,
                                  curtainsBBox.height,
                              ];
                              pixelationPass.uniforms.resUnit.value = [
                                  Math.ceil(
                                      curtainsBBox.width / pixelation.pixel_unit
                                  ),
                                  Math.ceil(
                                      curtainsBBox.height /
                                          pixelation.pixel_unit
                                  ),
                              ];
                          });
                      // on success
                      curtains.onSuccess(async () => {
                          const fonts = {
                              list: [
                                  'normal 400 1em Arial, Helvetica, sans-serif',
                              ],
                              loaded: 0,
                          };
                          if (!contentRef.current || !curtains) {
                              return;
                          }
                          for (let i = 0; i < mediaEls.length; i++) {
                              const plane = new Plane(curtains, mediaEls[i], {
                                  vertexShader: vs,
                                  fragmentShader: fs,
                                  widthSegments: 25,
                                  heightSegments: 25,
                                  transparent: true,
                                  depthTest: false,
                              });
                          }
                          for (let i = 0; i < textEls.length; i++) {
                              const plane = new Plane(curtains, textEls[i], {
                                  vertexShader: vs,
                                  fragmentShader: fs,
                                  widthSegments: 25,
                                  heightSegments: 25,
                                  transparent: true,
                                  depthTest: false,
                              });
                              // create the text texture
                              const textTexture = new TextTexture({
                                  plane: plane,
                                  textElement: plane.htmlElement,
                                  sampler: 'planeTexture',
                                  resolution: 1.5,
                                  skipFontLoading: true,
                                  adjustAscenderRatio: 0,
                              });
                          }
                          setFrameClass('');
                          return;
                          // load the fonts first
                          await Promise.all(
                              fonts.list.map(async (font) => {
                                  await document.fonts.load(font);
                              })
                          );

                          fonts.list.forEach((font) => {
                              document.fonts.load(font).then(() => {
                                  fonts.loaded++;

                                  if (
                                      fonts.loaded === fonts.list.length &&
                                      contentRef.current
                                  ) {
                                      /*
                    // create our shader pass
                    const scrollPass = new ShaderPass(curtains, {
                        fragmentShader: scrollFs,
                        depth: false,
                        uniforms: {
                            scrollEffect: {
                                name: 'uScrollEffect',
                                type: '1f',
                                value: scroll.effect,
                            },
                            scrollStrength: {
                                name: 'uScrollStrength',
                                type: '1f',
                                value: 2.5,
                            },
                        },
                    });

                    // calculate the lerped scroll effect
                    scrollPass.onRender(() => {
                        scroll.lastValue = scroll.value;
                        scroll.value = curtains.getScrollValues().y;

                        // clamp delta
                        scroll.delta = Math.max(
                            -30,
                            Math.min(30, scroll.lastValue - scroll.value)
                        );

                        scroll.effect = curtains.lerp(
                            scroll.effect,
                            scroll.delta,
                            0.05
                        );
                        scrollPass.uniforms.scrollEffect.value = scroll.effect;
                    });
                    */
                                      // create our text planes
                                  }
                              });
                          });
                      });
                  }
                : () => {
                      setFrameClass('hide_canvas');
                  },
            1000
        );

        return () => {
            timeout && clearTimeout(timeout);
            curtains && curtains.dispose();
        };
    }, []);

    return (
        <section id="page_section" className={`image ${FrameClass}`}>
            <div id="page_frame">
                <div ref={canvasRef} id="canvas"></div>
                <div ref={contentRef} id="content">
                    {children}
                </div>
            </div>
        </section>
    );
}

const Fig = ({ src, alt }: { src: string; alt: string }) => {
    return (
        <figure className="media-plane">
            <Image
                src={src}
                alt={alt}
                crossOrigin=""
                fill
                data-sampler="planeTexture"
            />
        </figure>
    );
};
