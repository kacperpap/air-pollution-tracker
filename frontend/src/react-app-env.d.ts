/// <reference types="react-scripts" />

// environmental variables typing in typescript

// In React apps that are build using CRA (Create React App)
// env variables must start with REACT_APP_ to be available in app
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            REACT_APP_API_BASE_URL: string;
        }
    }
}

export {}
