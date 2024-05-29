'use client';
import { useEffect, useRef } from 'react';

export default function SVGFilter() {
    const pixelateRef = useRef<SVGFilterElement>(null);
    /*
    useEffect(() => {
        function pixelate(tileSize: number = 10, sigmaGauss: number = 2) {
            if (!pixelateRef.current) {
                return;
            }
            tileSize = tileSize < 1 ? 1 : tileSize;
            sigmaGauss = sigmaGauss < 1 ? 1 : sigmaGauss;

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return;
            }
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // only to make the output visible
            // document.body.appendChild(canvas);

            const rows = canvas.height / tileSize;
            const cols = canvas.width / tileSize;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    ctx.fillStyle = 'white';

                    ctx.fillRect(
                        c * tileSize - 1 + Math.floor(tileSize / 2),
                        r * tileSize - 1 + Math.floor(tileSize / 2),
                        1,
                        1
                    );
                }
            }

            const pixelate = pixelateRef.current;
            pixelate.innerHTML = '';

            const blur = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'feGaussianBlur'
            );
            blur.setAttribute('in', 'SourceGraphic');
            blur.setAttribute('stdDeviation', `${sigmaGauss}`);
            blur.setAttribute('result', 'blurred');

            const hmap = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'feImage'
            );
            const hmapUrl = canvas.toDataURL();
            hmap.setAttribute('href', hmapUrl);
            hmap.setAttribute('result', 'hmap');

            const blend = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'feBlend'
            );
            // blend.setAttribute("mode", "lighten");
            blend.setAttribute('mode', 'multiply');
            blend.setAttribute('in', 'blurred');
            blend.setAttribute('in2', 'hmap');

            const morph = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'feMorphology'
            );
            morph.setAttribute('operator', 'dilate');
            morph.setAttribute('radius', `${tileSize / 2}`);

            pixelate.setAttribute('width', `${canvas.width}`);
            pixelate.setAttribute('height', `${canvas.height}`);
            pixelate.appendChild(blur);
            pixelate.appendChild(hmap);
            pixelate.appendChild(blend);
            pixelate.appendChild(morph);
        }
        pixelate(5, 1);
    }, []);
    */
    return <></>;
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            version="1.1"
            width="0"
            height="0"
        >
            <filter
                ref={pixelateRef}
                id="pixelate2"
                x="0"
                y="0"
                width="100%"
                height="100%"
                filterUnits="userSpaceOnUse"
            ></filter>
            <filter id="pixelate1" x="0%" y="0%" width="100%" height="100%">
                <feGaussianBlur
                    stdDeviation="4"
                    in="SourceGraphic"
                    result="smoothed"
                />
                <feImage
                    width="5"
                    height="5"
                    xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAIAAAACDbGyAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAWSURBVAgdY1ywgOEDAwKxgJhIgFQ+AP/vCNK2s+8LAAAAAElFTkSuQmCC"
                    result="displacement-map"
                />
                <feTile in="displacement-map" result="pixelate-map" />
                <feDisplacementMap
                    in="smoothed"
                    in2="pixelate-map"
                    xChannelSelector="R"
                    yChannelSelector="G"
                    scale="50"
                    result="pre-final"
                />
                <feComposite operator="in" in2="SourceGraphic" />
            </filter>
            <filter id="pixelate3" x="0" y="0">
                <feFlood x="4" y="4" height="0.1" width="0.1" />
                <feComposite width="10" height="10" />
                <feTile result="a" />
                <feComposite in="SourceGraphic" in2="a" operator="in" />
                <feMorphology operator="dilate" radius="5" />
            </filter>
        </svg>
    );
}
