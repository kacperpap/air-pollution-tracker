import { CloudArrowUpIcon, LockClosedIcon, ServerIcon } from '@heroicons/react/20/solid'

export default function Quickstart() {
  return (
    <div className="relative isolate overflow-hidden bg-white px-6 py-24 sm:py-32 lg:overflow-visible lg:px-0">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <svg
          aria-hidden="true"
          className="absolute top-0 left-[max(50%,25rem)] h-[64rem] w-[128rem] -translate-x-1/2 stroke-gray-200 [mask-image:radial-gradient(64rem_64rem_at_top,white,transparent)]"
        >
          <defs>
            <pattern
              x="50%"
              y={-1}
              id="e813992c-7d03-4cc4-a2bd-151760b470a0"
              width={200}
              height={200}
              patternUnits="userSpaceOnUse"
            >
              <path d="M100 200V.5M.5 .5H200" fill="none" />
            </pattern>
          </defs>
          <svg x="50%" y={-1} className="overflow-visible fill-gray-50">
            <path
              d="M-100.5 0h201v201h-201Z M699.5 0h201v201h-201Z M499.5 400h201v201h-201Z M-300.5 600h201v201h-201Z"
              strokeWidth={0}
            />
          </svg>
          <rect fill="url(#e813992c-7d03-4cc4-a2bd-151760b470a0)" width="100%" height="100%" strokeWidth={0} />
        </svg>
      </div>
      <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:items-start lg:gap-y-10">
        <div className="lg:col-span-2 lg:col-start-1 lg:row-start-1 lg:mx-auto lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8">
          <div className="lg:pr-4">
            <div className="lg:max-w-lg">
              <p className="text-base/7 font-semibold text-indigo-600">Instrukcja użytkowania</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-5xl">
                Symulacja rozprzestrzeniania się zanieczyszczeń
              </h1>
              <p className="mt-6 text-xl/8 text-gray-700">
                Dokładny opis symulacji i aplikacji znajduje się w sekcji documentation. Poniżej przedstawiono krok po kroku proces przeprowadzania symulacji.
              </p>
            </div>
          </div>
        </div>
        <div className="-mt-12 -ml-12 p-12 lg:sticky lg:top-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:overflow-hidden">
          <img
            alt="Wizualizacja symulacji"
            src="/simulation.png"
            className="w-[48rem] max-w-none rounded-xl bg-gray-900 ring-1 shadow-xl ring-gray-400/10 sm:w-[57rem]"
          />
        </div>
        <div className="lg:col-span-2 lg:col-start-1 lg:row-start-2 lg:mx-auto lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8">
          <div className="lg:pr-4">
            <div className="max-w-xl text-base/7 text-gray-700 lg:max-w-lg">
              <ul role="list" className="mt-8 space-y-8 text-gray-600">
                <li className="flex gap-x-3">
                  <CloudArrowUpIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-600" />
                  <span>
                    <strong className="font-semibold text-gray-900">1. Dodanie lotu dronem</strong> poprzez zakładkę Features-Drone Flight. 
                    Wymagane dane to tytuł lotu (data pobierana automatycznie) oraz minimum 2 punkty pomiarowe. Każdy punkt wymaga nazwy i położenia 
                    geograficznego (długość i szerokość), danych środowiskowych (temperatura, ciśnienie) oraz danych o wietrze (prędkość i kierunek).
                  </span>
                </li>
                <li className="flex gap-x-3">
                  <LockClosedIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-600" />
                  <span>
                    <strong className="font-semibold text-gray-900">2. Import danych z pliku</strong> możliwy w formatach .txt oraz .xlsx. 
                    Format pliku .txt zawiera sekcje metadata i measurements, z wartościami oddzielonymi średnikami. Zalecane jest pobranie 
                    przykładowego pliku w celu sprawdzenia poprawności formatu.
                  </span>
                </li>
                <li className="flex gap-x-3">
                  <ServerIcon aria-hidden="true" className="mt-1 size-5 flex-none text-indigo-600" />
                  <span>
                    <strong className="font-semibold text-gray-900">3. Przegląd i edycja danych</strong> w zakładce Features - Data overview. 
                    Umożliwia edycję zapisanych danych, pobieranie w wybranym formacie oraz weryfikację poprzez wizualizację punktów na mapie.
                  </span>
                </li>
              </ul>
              
              <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">Parametry i wykonanie symulacji</h2>
              <p className="mt-6">
                Konfiguracja parametrów symulacji odbywa się w zakładce Features - Simulate data pollution spread. 
                Należy zwrócić uwagę na limity systemu: dla siatki przekraczającej 5000 pudełek symulacja zostanie oznaczona jako failed, 
                a dla czasu wykonania powyżej 10 minut jako timeExceeded.
              </p>
              
              <p className="mt-6">
                Po zatwierdzeniu parametrów można śledzić status symulacji, przeglądać parametry oraz pobrać dane w formacie JSON. 
                Animacja symulacji dostępna jest po rozwinięciu szczegółów danej symulacji. Poprawnie zakończona symulacja 
                powinna przedstawiać wizualizację podobną do tej na załączonym obrazku.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}