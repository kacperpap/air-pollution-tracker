'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
} from '@headlessui/react'
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  Cog6ToothIcon,
  CursorArrowRaysIcon,
  DocumentChartBarIcon,
  XMarkIcon,
  VariableIcon
} from '@heroicons/react/24/outline'
import { ChevronDownIcon, PlayCircleIcon } from '@heroicons/react/20/solid'
import { useIsLogged } from '../hooks/useIsLogged'
import { useNavigate } from 'react-router-dom'
import { NotificationProps } from '../types/NotificationPropsType'
import { Notification } from './Notification'
import { logout } from '../features/login/api/logout'



const features = [
  { name: 'Drone flight', description: 'Set custom measurments points from your drone flight', href: '/drone-input', icon: CursorArrowRaysIcon },
  { name: 'Data overview', description: 'See your drone flight measurements saved in database', href: '/data-overview', icon: DocumentChartBarIcon},
  { name: 'Simulation overview', description: 'Peek your simulations, their parameters and results', href: '/simulation-overview', icon: VariableIcon}
]
const callsToAction = [
  { name: 'Simulate data pollution spread', href: '/simulation-input', icon: PlayCircleIcon }
]



export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notification, setNotification] = useState<NotificationProps>({ message: '', description: '', type: ''});

  const navigate = useNavigate()

  const isLogged = useIsLogged()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
    } catch (error) {
      setNotification({ message: 'Logout Failed', description: "" + error, type: 'error' })
    }
  }

  const handleCloseNotification = () => {
    setNotification({ message: '', description: '', type: '' })
  }

  return (
    <>
      {notification.type && (
        <Notification
          message={notification.message}
          description={notification.description}
          type={notification.type}
          duration={4000}
          onClose={handleCloseNotification}
        />
      )}

      <header className="bg-white relative z-20">
        <nav aria-label="Global" className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
          <div className="flex lg:flex-1">
            <a href="/" className="-m-1.5 p-1.5">
              <span className="sr-only">Your Company</span>
              <div className='flex justify-items '>
                <img alt="" src="/paper_plane.png" className="h-8 w-auto" />
                <span className="font-bold text-lg text-gray-900">Air Pollution Tracker</span>
              </div>
            </a>
          </div>
          <div className="flex lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            >
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="h-6 w-6" />
            </button>
          </div>
          <PopoverGroup className="hidden lg:flex lg:gap-x-12">
            {isLogged && (
              <Popover className="relative">
                <PopoverButton className="flex items-center gap-x-1 text-sm font-semibold leading-6 text-gray-900">
                  Features
                  <ChevronDownIcon aria-hidden="true" className="h-5 w-5 flex-none text-gray-400" />
                </PopoverButton>

                <PopoverPanel className="absolute -left-8 top-full z-10 mt-3 w-screen max-w-md overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-gray-900/5 transition data-[closed]:translate-y-1 data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-150 data-[enter]:ease-out data-[leave]:ease-in">
                  <div className="p-4">
                    {features.map((item) => (
                      <div
                        key={item.name}
                        className="group relative flex items-center gap-x-6 rounded-lg p-4 text-sm leading-6 hover:bg-gray-50"
                      >
                        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                          <item.icon aria-hidden="true" className="h-6 w-6 text-gray-600 group-hover:text-indigo-600" />
                        </div>
                        <div className="flex-auto">
                          <a href={item.href} className="block font-semibold text-gray-900">
                            {item.name}
                            <span className="absolute inset-0" />
                          </a>
                          <p className="mt-1 text-gray-600">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 divide-x divide-gray-900/5 bg-gray-50">
                    {callsToAction.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        className="flex items-center justify-center gap-x-2.5 p-3 text-sm font-semibold leading-6 text-gray-900 hover:bg-gray-100"
                      >
                        <item.icon aria-hidden="true" className="h-5 w-5 flex-none text-gray-400" />
                        {item.name}
                      </a>
                    ))}
                  </div>
                </PopoverPanel>
              </Popover>
            )}

            <a href="/quick-start" className="text-sm font-semibold leading-6 text-gray-900">
              Quick start
            </a>
            <a href="/documentation" className="text-sm font-semibold leading-6 text-gray-900">
              Documentation
            </a>
          </PopoverGroup>

          {!isLogged ? (
            <div className="hidden lg:flex lg:flex-1 lg:justify-end">
              <a href="/login" className="text-sm font-semibold leading-6 text-gray-900">
                Log in <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          ) : (
            <Popover className="relative hidden lg:flex lg:flex-1 lg:justify-end">
              <PopoverButton className="flex items-center gap-x-1 text-sm font-semibold leading-6 text-gray-900">
                Profile
                <ChevronDownIcon aria-hidden="true" className="h-5 w-5 flex-none text-gray-400" />
              </PopoverButton>
              <PopoverPanel className="absolute -right-24 top-full z-10 mt-3 w-48 overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-gray-900/5 transition data-[closed]:translate-y-1 data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-150 data-[enter]:ease-out data-[leave]:ease-in">
                <div className="p-4">
                  <div className="group relative flex items-center gap-x-4 rounded-lg p-4 text-sm leading-6 hover:bg-gray-50">
                    <div className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                      <Cog6ToothIcon aria-hidden="true" className="h-6 w-6 text-gray-600 group-hover:text-indigo-600" />
                    </div>
                    <div className="flex-auto">
                      <a href="/settings" className="block font-semibold text-gray-900">
                        Settings
                        <span className="absolute inset-0" />
                      </a>
                    </div>
                  </div>
                </div>
                <div className="grid bg-gray-50">
                  <a
                    href="/"
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-x-2.5 p-3 text-sm font-semibold leading-6 text-gray-900 hover:bg-gray-100"
                  >
                    <ArrowRightOnRectangleIcon aria-hidden="true" className="h-5 w-5 flex-none text-gray-400" />
                    Log out
                  </a>
                </div>
              </PopoverPanel>
            </Popover>
          )}

        </nav>
        <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
          <div className="fixed inset-0 z-10" />
          <DialogPanel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
              <a href="/" className="-m-1.5 p-1.5">
                <span className="sr-only">Your Company</span>
                <img alt="" src="/paper_plane.png" className="h-8 w-auto" />
              </a>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="-m-2.5 rounded-md p-2.5 text-gray-700"
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon aria-hidden="true" className="h-6 w-6" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  {isLogged && (
                    <Disclosure as="div" className="-mx-3">
                      {({ open }) => (
                        <>
                          <DisclosureButton className="flex w-full items-center justify-between rounded-lg py-2 pl-3 pr-3.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-400/10">
                            Features
                            <ChevronDownIcon
                              aria-hidden="true"
                              className={`h-5 w-5 flex-none ${open ? 'rotate-180' : ''}`}
                            />
                          </DisclosureButton>
                          <DisclosurePanel className="mt-2 space-y-2">
                            {features.map((item) => (
                              <a
                                key={item.name}
                                href={item.href}
                                className="block rounded-lg py-2 pl-6 pr-3 text-sm font-semibold leading-7 text-gray-900 hover:bg-gray-400/10"
                              >
                                {item.name}
                              </a>
                            ))}
                            {callsToAction.map((item) => (
                              <a
                                key={item.name}
                                href={item.href}
                                className="block rounded-lg py-2 pl-6 pr-3 text-sm font-semibold leading-7 text-gray-900 hover:bg-gray-400/10"
                              >
                                {item.name}
                              </a>
                            ))}
                          </DisclosurePanel>
                        </>
                      )}
                    </Disclosure>
                  )}

                  <a href="/quick-start" className="-mx-3 block rounded-lg py-2 px-3 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-400/10">
                    Quick start
                  </a>
                  <a href="/documentation" className="-mx-3 block rounded-lg py-2 px-3 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-400/10">
                    Documentation
                  </a>
                </div>
                <div className="py-6">
                  {!isLogged ? (
                    <a href="/login" className="-mx-3 block rounded-lg py-2.5 px-3 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-400/10">
                      Log in
                    </a>
                  ) : (
                    <a
                      href="/"
                      onClick={handleLogout}
                      className="-mx-3 block rounded-lg py-2.5 px-3 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-400/10"
                    >
                      Log out
                    </a>
                  )}
                </div>
              </div>
            </div>
          </DialogPanel>
        </Dialog>
      </header>
    </>
  )
}
