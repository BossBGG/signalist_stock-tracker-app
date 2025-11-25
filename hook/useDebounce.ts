'use client';

import { useCallback , useRef } from "react";
export function useDebounce(callback: () => void, delay: number) {
    const timeoitRef = useRef<NodeJS.Timeout | null>(null);

    return useCallback(() => {
        if(timeoitRef.current){
            clearTimeout(timeoitRef.current);
        }

        timeoitRef.current = setTimeout(callback, delay);
    }, [callback, delay])
}