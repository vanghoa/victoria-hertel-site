'use client'; // Error components must be Client Components

import PageClient from '@/components/PageFrame/Client';
import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <main className="textured_bg">
            <PageClient>
                <h2 className="text-plane">Something went wrong!</h2>
                <button
                    className="text-plane"
                    onClick={
                        // Attempt to recover by trying to re-render the segment
                        () => reset()
                    }
                >
                    Try again
                </button>
            </PageClient>
            <section className="description">
                <span className="left">error</span>
                <span className="right">error</span>
            </section>
        </main>
    );
}
