import { ReactNode } from 'react';

export const Fallback = ({ children }: { children: ReactNode }) => {
    return <p className="text-plane">{children}</p>;
};
