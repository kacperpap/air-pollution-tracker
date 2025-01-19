declare global {
    interface Window {
        __ENV__: {
            REACT_APP_API_BASE_URL: string;
        };
    }
}

export const API_URL = window.__ENV__?.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_BASE_URL;