import bg from '@/components/Layout/pattern.png';

export default function SVGPattern() {
    return (
        <svg className="svgpattern">
            <defs>
                <pattern
                    id="svgbg"
                    patternUnits="userSpaceOnUse"
                    width="165"
                    height="50"
                >
                    <image href={bg.src} x="0" y="0" width="165" height="50" />
                </pattern>
            </defs>
        </svg>
    );
}
