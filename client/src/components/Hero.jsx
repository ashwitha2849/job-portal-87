import { useContext, useRef } from 'react'
import { assets } from '../assets/assets'
import { AppContext } from '../context/AppContext'
const Hero = () => {
    const { setSearchFilter, setIsSearched } = useContext(AppContext)
    const titleRef = useRef(null)
    const locationRef = useRef(null)
    const onSearch = () => {
        setSearchFilter({
            title: titleRef.current.value,
            location: locationRef.current.value
        })
        setIsSearched(true)
    }
    return (
        <div className='container 2xl:px-20 mx-auto my-8 px-4'>
            {/* Main Hero Card */}
            <div className='bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white py-20 text-center rounded-[32px] shadow-2xl relative overflow-hidden border border-indigo-900/30 px-6'>
                <div className='absolute right-0 top-0 w-[40%] h-[100%] bg-radial-gradient from-indigo-500/10 via-transparent to-transparent opacity-75 blur-3xl pointer-events-none'></div>
                <div className='absolute -left-12 -bottom-12 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none'></div>
                <div className='relative z-10 max-w-3xl mx-auto'>
                    <span className='inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-400/20 rounded-full px-3 py-1 text-xs font-semibold text-indigo-300 mb-6 uppercase tracking-wider'>
                        🚀 Explore & Apply Today
                    </span>
                    
                    <h2 className='text-3xl md:text-5xl font-black mb-4 tracking-tight leading-none bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent'>
                        Over 10,000+ Jobs Waiting For You
                    </h2>
                    <p className='mb-10 max-w-xl mx-auto text-sm md:text-base text-indigo-200/70 font-normal leading-relaxed'>
                        Your next big career move starts here. Explore tailored job opportunities from top companies and take the next step toward your future.
                    </p>
                    {/* Integrated Modern Search Bar */}
                    <div className='flex flex-col md:flex-row items-center bg-white/95 backdrop-blur-md rounded-2xl shadow-xl max-w-2xl mx-auto p-2 border border-slate-100/30 gap-2 md:gap-0'>
                        <div className='flex items-center w-full px-3 border-r-0 md:border-r border-slate-200 py-1.5'>
                            <img className='h-4.5 opacity-55 mr-2' src={assets.search_icon} alt="" />
                            <input 
                                type="text"
                                placeholder='Job title, keywords...'
                                className='text-sm p-2 rounded outline-none w-full text-slate-800 placeholder-slate-400 bg-transparent font-medium'
                                ref={titleRef}
                            />
                        </div>
                        <div className='flex items-center w-full px-3 py-1.5'>
                            <img className='h-4.5 opacity-55 mr-2' src={assets.location_icon} alt="" />
                            <input 
                                type="text"
                                placeholder='Location or Remote'
                                className='text-sm p-2 rounded outline-none w-full text-slate-800 placeholder-slate-400 bg-transparent font-medium'
                                ref={locationRef}
                            />
                        </div>
                        <button 
                            onClick={onSearch} 
                            className='bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition duration-300 w-full md:w-auto active:scale-95'
                        >
                            Search
                        </button>
                    </div>
                </div>
            </div>
            {/* Trusted By Monochrome Logos Section */}
            <div className='bg-white rounded-3xl border border-slate-100 shadow-sm mt-8 px-8 py-6'>
                <div className='flex flex-col md:flex-row items-center justify-between gap-6 max-w-6xl mx-auto'>
                    <p className='text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap'>
                        Trusted By Global Leaders
                    </p>
                    <div className='flex flex-wrap items-center justify-center gap-8 md:gap-12 lg:gap-16'>
                        {[
                          { logo: assets.microsoft_logo, name: "Microsoft" },
                          { logo: assets.walmart_logo, name: "Walmart" },
                          { logo: assets.accenture_logo, name: "Accenture" },
                          { logo: assets.samsung_logo, name: "Samsung" },
                          { logo: assets.amazon_logo, name: "Amazon" },
                          { logo: assets.adobe_logo, name: "Adobe" }
                        ].map((company, index) => (
                          <img 
                            key={index} 
                            className='h-5 md:h-6 object-contain grayscale opacity-30 hover:grayscale-0 hover:opacity-85 transition-all duration-300 cursor-pointer' 
                            src={company.logo} 
                            alt={company.name} 
                          />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
export default Hero