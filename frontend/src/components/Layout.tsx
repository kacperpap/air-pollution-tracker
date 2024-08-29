import Header from "./Header"
import {Outlet} from "react-router-dom"

export const Layout = () => {

  return (
    <div className="flex flex-col h-screen w-full">
      <header className="relative z-20">
        <Header />
      </header>
      <div className="grow relative relative z-10 h-screen">
        <Outlet />
      </div>
    </div>
  )
}