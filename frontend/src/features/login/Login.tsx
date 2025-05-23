import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { LoginFormType } from "../../types/LoginFormType"
import { RegisterFormType } from "../../types/RegisterFormType"
import { login } from "./api/login"
import { register } from "./api/register"
import { Notification } from "../../components/Notification";
import { NotificationProps } from "../../types/NotificationPropsType";




export function Login() {

    const navigate = useNavigate();

    const [type, setType] = useState<'login' | 'register'>('login')

    const [isLoading, setIsLoading] = useState(false);

    const [notification, setNotification] = useState<NotificationProps>({ message: '', description: '', type: ''});

    const [formData, setFormData] = useState<LoginFormType | RegisterFormType>({
        email: '',
        password: '',
        name: ''  
    })

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }))
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isLoading) return;

        setIsLoading(true);
        try {
            if (type === 'login') {
                const { email, password } = formData as LoginFormType;
                await login(email, password);
                navigate('/');
            } else if (type === 'register') {
                await register(formData as RegisterFormType);
                setNotification({ message: 'Registration successful!', description: 'You can now log in with your credentials.', type: 'success'});
                setType('login');
            }
        } catch (error: any) {
            console.error(error);
            const errorMessage = error.message || 'Invalid credentials or registration failed';
            setNotification({ 
                message: 'Error', 
                description: errorMessage, 
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseNotification = () => {
        setNotification({ message: '', description: '', type: ''});
    };

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

            <div className="flex min-h-full flex-1 flex-col justify-center px-6 pt-32 pb-12 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-lg">
                    <img
                        alt="Air Pollution Tracker"
                        src="/paper_plane.png"
                        className="mx-auto h-12 w-auto"
                    />
                    <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
                        {type === 'register' ? 'Register new account' : 'Sign in to your account'}
                    </h2>
                </div>

                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-lg">
                    <form onSubmit={handleSubmit} method="POST" className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                                Email address
                            </label>
                            <div className="mt-2">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={(formData as LoginFormType).email || (formData as RegisterFormType).email}
                                    onChange={handleChange}
                                    required
                                    disabled={isLoading}
                                    autoComplete="email"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        { type === 'register' && (
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                                Name
                            </label>
                            <div className="mt-2">
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={(formData as RegisterFormType).name}
                                    onChange={handleChange}
                                    required
                                    disabled={isLoading}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>
                        )}

                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                                    Password
                                </label>
                            </div>
                            <div className="mt-2">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={(formData as LoginFormType).password || (formData as RegisterFormType).password}
                                    onChange={handleChange}
                                    required
                                    disabled={isLoading}
                                    autoComplete="current-password"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className={`flex w-full justify-center rounded-md px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600
                                    ${isLoading 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-indigo-600 hover:bg-indigo-500'}`}
                            >
                                {isLoading 
                                    ? (type === 'register' ? 'Signing up...' : 'Signing in...') 
                                    : (type === 'register' ? 'Sign up' : 'Sign in')}
                            </button>
                        </div>
                    </form>

                    <p className="mt-10 text-center text-sm text-gray-500">
                        { type === 'login' ? (
                            <>
                            Not a member?{' '}
                            <button
                                disabled={isLoading}
                                className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500 disabled:text-gray-400 disabled:cursor-not-allowed"
                                onClick={() => setType('register')}
                            >
                                Register account
                            </button>
                            </>
                        ) : (
                            <>
                             Already have an account?{' '}
                            <button
                                disabled={isLoading}
                                className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500 disabled:text-gray-400 disabled:cursor-not-allowed"
                                onClick={() => setType('login')}
                            >
                                Log in
                            </button>
                            </>
                        )}                    
                    </p>
                </div>
            </div>
        </>
    )
}
