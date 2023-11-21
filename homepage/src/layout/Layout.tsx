
import { Outlet } from "react-router-dom";
import './Layout.css'

export default function Layout() {
  return (
    <>
      <div className="min-h-full bg-[url('./assets/dots.svg')]">
        <div className="py-10 ">
          <main>
            <div className=' mx-auto  sm:px-6 lg:px-8 leading-tight  tracking-normal font-wigrum bg-theme-layer-base bg-opacity-50'>
              <h1 className=" text-lg font-semibold  pl-4 text-theme-text-light "> ultra sound apps
              </h1>
              <p className=' text-md  leading-tight font-wigrum pl-4'>a browser homepage for navigating trading, investing, portfolio management & analytics apps.</p>
            </div>
            <div className="mx-auto  sm:px-6 lg:px-8 pb-4 "><Outlet></Outlet></div>
            <div className=' mx-auto  sm:px-6 lg:px-8 leading-tight  tracking-normal font-wigrum bg-theme-layer-base bg-opacity-50'>
              <a href="https://twitter.com/galleonlabs" target="_blank" className=' text-sm   pb-4 hover:text-theme-text-light  leading-tight font-wigrum pl-8'>created by @galleonlabs</a>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
