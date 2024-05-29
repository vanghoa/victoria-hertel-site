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

export function localDate(timestamp?: string) {
    const date = (timestamp ? new Date(timestamp) : new Date())
        .toLocaleString('en-GB', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        })
        .split(`, `);
    return {
        date: date[0],
        time: date[1],
    };
}

export function wait(delay: number) {
    return new Promise((resolve) => setTimeout(resolve, delay));
}
