import { useContext, useEffect, useState } from 'react'
import { assets } from '../assets/assets'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
const RecruiterLogin = () => {
    const navigate = useNavigate()
    const [state, setState] = useState('Login')
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [email, setEmail] = useState('')
    const [image, setImage] = useState(false)
    const [isTextDataSubmited, setIsTextDataSubmited] = useState(false)
    const { setShowRecruiterLogin, backendUrl, setCompanyToken, setCompanyData } = useContext(AppContext)
    const onSubmitHandler = async (e) => {
        e.preventDefault()
        if (state === "Sign Up" && !isTextDataSubmited) {
            return setIsTextDataSubmited(true)
        }
        try {
            if (state === "Login") {
                const { data } = await axios.post(backendUrl + '/api/company/login', { email, password })
                if (data.success) {
                    setCompanyData(data.company)
                    setCompanyToken(data.token)
                    localStorage.setItem('companyToken', data.token)
                    setShowRecruiterLogin(false)
                    navigate('/dashboard')
                } else {
                    toast.error(data.message)
                }
            } else {
                const formData = new FormData()
                formData.append('name', name)
                formData.append('password', password)
                formData.append('email', email)
                formData.append('image', image)
                const { data } = await axios.post(backendUrl + '/api/company/register', formData)
                if (data.success) {
                    setCompanyData(data.company)
                    setCompanyToken(data.token)
                    localStorage.setItem('companyToken', data.token)
                    setShowRecruiterLogin(false)
                    navigate('/dashboard')
                } else {
                    toast.error(data.message)
                }
            }
        } catch (error) {
            toast.error(error.message)
        }
    }
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [])
    return (
        <div className='fixed inset-0 z-50 backdrop-blur-md bg-slate-900/60 flex justify-center items-center p-4 animate-fade-in'>
            <form 
                onSubmit={onSubmitHandler} 
                className='relative bg-white w-full max-w-md p-8 md:p-10 rounded-[32px] shadow-2xl border border-slate-100/80 animate-scale-up text-slate-500'
            >
                <div className="text-center mb-6">
                    <h1 className='text-2xl font-black text-slate-800 tracking-tight leading-none'>
                        Recruiter {state}
                    </h1>
                    <p className='text-xs text-slate-400 mt-2 font-medium'>
                        {state === "Login" ? "Welcome back! Please sign in to your company dashboard." : "Get started by creating a recruiter account."}
                    </p>
                </div>
                {state === "Sign Up" && isTextDataSubmited
                    ? (
                        <div className="my-6">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">Company Logo</label>
                            <label 
                                htmlFor="image" 
                                className='flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl p-6 cursor-pointer bg-slate-50/50 hover:bg-indigo-50/10 transition-all duration-200'
                            >
                                <img 
                                    className={`${image ? 'w-20 h-20 object-cover rounded-2xl shadow-md border' : 'w-16 opacity-60'} mb-3`} 
                                    src={image ? URL.createObjectURL(image) : assets.upload_area} 
                                    alt="" 
                                />
                                <span className="text-xs font-bold text-slate-500">
                                    {image ? "Change Logo" : "Upload Company Logo"}
                                </span>
                                <span className="text-[10px] text-slate-400 mt-1">PNG, JPG up to 5MB</span>
                                <input onChange={e => setImage(e.target.files[0])} type="file" id='image' hidden required />
                            </label>
                        </div>
                    )
                    : (
                        <div className="space-y-4">
                            {state !== 'Login' && (
                                <div className='border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100/50 px-4 py-3 flex items-center gap-2.5 rounded-2xl transition-all duration-200'>
                                    <img className="h-4.5 opacity-55" src={assets.person_icon} alt="" />
                                    <input 
                                        className='outline-none text-sm text-slate-800 placeholder-slate-400 w-full font-medium' 
                                        onChange={e => setName(e.target.value)} 
                                        value={name} 
                                        type="text" 
                                        placeholder='Company Name' 
                                        required 
                                    />
                                </div>
                            )}
                            <div className='border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100/50 px-4 py-3 flex items-center gap-2.5 rounded-2xl transition-all duration-200'>
                                <img className="h-4.5 opacity-55" src={assets.email_icon} alt="" />
                                <input 
                                    className='outline-none text-sm text-slate-800 placeholder-slate-400 w-full font-medium' 
                                    onChange={e => setEmail(e.target.value)} 
                                    value={email} 
                                    type="email" 
                                    placeholder='Email Address' 
                                    required 
                                />
                            </div>
                            <div className='border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100/50 px-4 py-3 flex items-center gap-2.5 rounded-2xl transition-all duration-200'>
                                <img className="h-4.5 opacity-55" src={assets.lock_icon} alt="" />
                                <input 
                                    className='outline-none text-sm text-slate-800 placeholder-slate-400 w-full font-medium' 
                                    onChange={e => setPassword(e.target.value)} 
                                    value={password} 
                                    type="password" 
                                    placeholder='Password' 
                                    required 
                                />
                            </div>
                        </div>
                    )
                }
                {state === "Login" && (
                    <div className="text-right mt-2">
                        <span className='text-xs text-indigo-600 hover:underline cursor-pointer font-bold'>
                            Forgot password?
                        </span>
                    </div>
                )}
                <button 
                    type='submit' 
                    className='bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-2xl mt-6 transition duration-200 active:scale-95 shadow-md shadow-indigo-600/10 hover:shadow-[0_0_15px_rgba(99,102,241,0.35)] w-full'
                >
                    {state === 'Login' ? 'Login' : isTextDataSubmited ? 'Create Account' : 'Next'}
                </button>
                <div className="text-center mt-6">
                    {state === 'Login'
                        ? (
                            <p className='text-xs text-slate-400 font-medium'>
                                Don't have a company account?{" "}
                                <span 
                                    className='text-indigo-600 cursor-pointer hover:underline font-bold' 
                                    onClick={() => setState("Sign Up")}
                                >
                                    Sign Up
                                </span>
                            </p>
                        )
                        : (
                            <p className='text-xs text-slate-400 font-medium'>
                                Already have a company account?{" "}
                                <span 
                                    className='text-indigo-600 cursor-pointer hover:underline font-bold' 
                                    onClick={() => { setState("Login"); setIsTextDataSubmited(false); }}
                                >
                                    Login
                                </span>
                            </p>
                        )
                    }
                </div>
                {/* Styled Close Button */}
                <button 
                    type="button"
                    onClick={() => setShowRecruiterLogin(false)} 
                    className='absolute top-6 right-6 bg-slate-100 hover:bg-slate-200 text-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition active:scale-90'
                >
                    <img className='w-3 h-3 opacity-60' src={assets.cross_icon} alt="Close" />
                </button>
            </form>
        </div>
    )
}
export default RecruiterLogin