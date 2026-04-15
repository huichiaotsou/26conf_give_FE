import { useEffect, useState } from "react";

export const TITLE_MAX_HEIGHT = 402;
export const TITLE_MIN_HEIGHT = 186;
export const TITLE_COLLAPSE_THRESHOLD = 240;
export const COLLAPSED_HEIGHT_RATIO = 0.5;
export const COLLAPSED_MIN_HEIGHT = 126;
export const COLLAPSED_TOP_OFFSET = 25;
export const COLLAPSED_WIDTH_RATIO = 0.5;
export const MOBILE_MEDIA_QUERY = "(max-width: 599px)";
export const MOBILE_TITLE_HEIGHT_RATIO = 0.5;

const RESULT_VIEW_HEIGHT_RATIO = 0.4;

export const getResponsiveTitleMetrics = (isMobile: boolean) => {
    const ratio = isMobile ? MOBILE_TITLE_HEIGHT_RATIO : 1;

    return {
        titleMaxHeight: Math.round(TITLE_MAX_HEIGHT * ratio),
        titleMinHeight: Math.round(TITLE_MIN_HEIGHT * ratio),
        titleCollapseThreshold: Math.round(TITLE_COLLAPSE_THRESHOLD * ratio),
        collapsedMinHeight: Math.round(COLLAPSED_MIN_HEIGHT * ratio),
        collapsedTopOffset: Math.round(COLLAPSED_TOP_OFFSET * ratio),
        resultViewHeight: Math.round(TITLE_MAX_HEIGHT * RESULT_VIEW_HEIGHT_RATIO * ratio),
    };
};

export const useIsMobileViewport = () => {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window === "undefined") return false;
        return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
        const handleChange = () => setIsMobile(mediaQuery.matches);

        handleChange();
        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    return isMobile;
};
