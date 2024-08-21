import { useEffect, useState } from 'react';
import { NotificationProps } from '../types/NotificationPropsType';


export const Notification = ({ message, description = '', type, duration = 3000, onClose = ()=>{} }: NotificationProps) => {

    const [show, setShow] = useState(true);

    /*
    useEffect(() => {
        //effect code
        return () => {
            //clean code after
        }
    }, []) //dependency table
    Jeśli tablica zależności jest pusta [], efekt zostanie wykonany tylko raz, po pierwszym renderze komponentu
    (co jest     odpowiednikiem componentDidMount w komponentach klasowych).
    Jeśli tablica zależności zawiera jakieś zmienne, efekt będzie ponownie wykonywany tylko wtedy,
    gdy którakolwiek z tych zmiennych zmieni się pomiędzy renderami.
    Jeśli tablica zależności nie zostanie podana, efekt będzie wykonywany przy każdym renderze komponentu
    */

    useEffect(() => {
        const timer = setTimeout(() => {
            setShow(false);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    
    useEffect(() => {
        if (!show) {
            const fadeOutTimer = setTimeout(() => {
                onClose();
            }, 300); // Matching the CSS transition duration

            return () => clearTimeout(fadeOutTimer);
        }
    }, [show, onClose]);
    


    if (!show) {
        return null;
    }

    return (
        <div
            className={`fixed top-4 left-1/2 transform -translate-x-1/2 max-w-sm mx-auto bg-white border border-gray-200 rounded-md shadow-md p-4 flex items-start space-x-4 transition-opacity duration-300 ${!show ? 'opacity-0' : 'opacity-100'}`}
        >
            <div className="flex-shrink-0">
                <svg
                    className={`h-6 w-6 ${type === 'success' ? 'text-green-500' : 'text-red-500'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d={
                            type === 'success'
                                ? 'M9 12l2 2l4-4m6 6l-4-4m0 0h.01'
                                : 'M6 18L18 6M6 6l12 12'
                        }
                    />
                </svg>
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{message}</p>
                {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
            </div>
            <button className="text-gray-400 hover:text-gray-500" onClick={() => setShow(false)}>
                <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};
