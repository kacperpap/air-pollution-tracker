import { Navigate, RouteObject, useRoutes } from "react-router-dom"
import { useIsLogged } from "../hooks/useIsLogged"
import { Layout } from "../components/Layout"
import Map from "./map/Map"
import { Login } from "./login/Login"
import { DroneInput } from "./drone/DroneInput"
import { Overview } from "./overview/Overview"
import { ErrorPage } from "./error/ErrorPage"


const publicRoutes: RouteObject[] = [
    {
        path: '/',
        element: <Layout />,
        children: [
            {
                path: '/',
                element: <Map />
            },
        ]
    },
    {
        path: '/login',
        element: <Login />
    },
    {
        path: '*',
        element: <ErrorPage />
    }
]

const privateRoutes: RouteObject[] = [
    {
        path: '/',
        element: <Layout />,
        children: [
            {
                path: '/',
                element: <Map />
            },
            {
                path: '/drone-input',
                element: <DroneInput />
            },
            {
                path: '/drone-input/:flightId',
                element: <DroneInput />
            },
            {
                path: '/data-overview',
                element: <Overview />
            },
            {
                path: '/map/:flightId',
                element: <Map />
            }
        ]
    },
    {
        path: '*',
        element: <ErrorPage />
    }
]

export const Routing = () => {
    const isLogged = useIsLogged()
    const routes = isLogged ? privateRoutes : publicRoutes
    return useRoutes(routes)
}