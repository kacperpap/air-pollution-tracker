import { Navigate, RouteObject, useRoutes } from "react-router-dom"
import { Layout } from "../components/Layout"
import Map from "./map/Map"
import { Login } from "./login/Login"


const publicRoutes: RouteObject[] = [
    {
        path: '/',
        element: <Layout />,
        children: [
            {
                path: '/',
                element: <Map />
            }
        ]
    },
    {
        path: '/login',
        element: <Login />
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