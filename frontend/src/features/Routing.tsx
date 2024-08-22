import { Navigate, RouteObject, useRoutes } from "react-router-dom"
import { Layout } from "../components/Layout"
import Map from "./map/Map"
import { Login } from "./login/Login"
import { DroneInput } from "./drone/DroneInput"
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
            {
                path: '/drone-input',
                element: <DroneInput />
            }
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

    }
]

export const Routing = () => {
    return useRoutes(publicRoutes)
}