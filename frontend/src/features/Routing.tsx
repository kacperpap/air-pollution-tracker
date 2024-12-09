import { RouteObject, useRoutes } from "react-router-dom"
import { useIsLogged } from "../hooks/useIsLogged"
import { Layout } from "../components/Layout"
import Map from "./map/Map"
import { Login } from "./login/Login"
import { DroneInput } from "./drone/DroneInput"
import { SimulationInput } from "./simulation/SimulationInput"
import { Overview } from "./overview/Overview"
import { ErrorPage } from "./error/ErrorPage"
import { SimulationOverview } from "./simulation/SimulationOverview"
import MapSimulation from "./animation/MapSimulation"


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
                path: '/simulation-input',
                element: <SimulationInput />
            },
            {
                path: '/data-overview',
                element: <Overview />
            },
            {
                path: '/simulation-overview',
                element: <SimulationOverview />
            },
            {
                path: '/simulation-overview/:simulationId',
                element: <SimulationOverview />
            },
            {
                path: '/map/:flightId',
                element: <Map />
            },
            {
                path: '/map/run-simulation/:simulationId',
                element: <MapSimulation />
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