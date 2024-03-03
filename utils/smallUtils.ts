import seedrandom from 'seedrandom';

export function useFixedRandom() {
    seedrandom('fixed random', { global: true });
    return null;
}

export function scale(
    number: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number
) {
    return ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}
