import { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import { assets, JobCategories, JobLocations } from '../assets/assets'
import JobCard from './JobCard'
const JobListing = () => {
    const { isSearched, searchFilter, setSearchFilter, jobs } = useContext(AppContext)
    const [showFilter, setShowFilter] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedCategories, setSelectedCategories] = useState([])
    const [selectedLocations, setSelectedLocations] = useState([])
    const [filteredJobs, setFilteredJobs] = useState(jobs)
    const handleCategoryChange = (category) => {
        setSelectedCategories(
            prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
        )
    }
    const handleLocationChange = (location) => {
        setSelectedLocations(
            prev => prev.includes(location) ? prev.filter(c => c !== location) : [...prev, location]
        )
    }
    useEffect(() => {
        const matchesCategory = job => selectedCategories.length === 0 || selectedCategories.includes(job.category)
        const matchesLocation = job => selectedLocations.length === 0 || selectedLocations.includes(job.location)
        const matchesTitle = job => searchFilter.title === "" || job.title.toLowerCase().includes(searchFilter.title.toLowerCase())
        const matchesSearchLocation = job => searchFilter.location === "" || job.location.toLowerCase().includes(searchFilter.location.toLowerCase())
        const newFilteredJobs = jobs.slice().reverse().filter(
            job => matchesCategory(job) && matchesLocation(job) && matchesTitle(job) && matchesSearchLocation(job)
        )
        setFilteredJobs(newFilteredJobs)
        setCurrentPage(1)
    }, [jobs, selectedCategories, selectedLocations, searchFilter])
    return (
        <div className='container 2xl:px-20 mx-auto flex flex-col lg:flex-row gap-8 py-10 px-4'>
            {/* Sidebar Filters */}
            <div className='w-full lg:w-1/4 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-fit space-y-6'>
                
                {/* Search tags if search has run */}
                {
                    isSearched && (searchFilter.title !== "" || searchFilter.location !== "") && (
                        <div className="border-b border-slate-100 pb-5">
                            <h3 className='font-bold text-xs uppercase tracking-wider text-slate-400 mb-3'>Current Search</h3>
                            <div className='flex flex-wrap gap-2'>
                                {searchFilter.title && (
                                    <span className='inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl text-xs font-semibold text-indigo-700'>
                                        {searchFilter.title}
                                        <img onClick={e => setSearchFilter(prev => ({ ...prev, title: "" }))} className='cursor-pointer w-2 h-2 opacity-60 hover:opacity-100' src={assets.cross_icon} alt="" />
                                    </span>
                                )}
                                {searchFilter.location && (
                                    <span className='inline-flex items-center gap-2 bg-rose-50 border border-rose-100 px-3 py-1 rounded-xl text-xs font-semibold text-rose-700'>
                                        {searchFilter.location}
                                        <img onClick={e => setSearchFilter(prev => ({ ...prev, location: "" }))} className='cursor-pointer w-2 h-2 opacity-60 hover:opacity-100' src={assets.cross_icon} alt="" />
                                    </span>
                                )}
                            </div>
                        </div>
                    )
                }
                <div className="flex items-center justify-between lg:hidden border-b border-slate-100 pb-3">
                    <span className="font-bold text-slate-800 text-sm uppercase tracking-wider">Filters</span>
                    <button onClick={e => setShowFilter(prev => !prev)} className='px-4 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition'>
                        {showFilter ? "Close" : "Adjust"}
                    </button>
                </div>
                {/* Category Filter */}
                <div className={showFilter ? "space-y-3" : "max-lg:hidden space-y-3"}>
                    <h4 className='font-bold text-xs uppercase tracking-wider text-slate-400'>Categories</h4>
                    <ul className='space-y-2.5 text-sm font-medium text-slate-600'>
                        {
                            JobCategories.map((category, index) => (
                                <li className='flex gap-2.5 items-center cursor-pointer hover:text-slate-900 transition' key={index}>
                                    <input
                                        className='rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 w-4 h-4 cursor-pointer'
                                        type="checkbox"
                                        id={`cat-${index}`}
                                        onChange={() => handleCategoryChange(category)}
                                        checked={selectedCategories.includes(category)}
                                    />
                                    <label htmlFor={`cat-${index}`} className="cursor-pointer select-none">{category}</label>
                                </li>
                            ))
                        }
                    </ul>
                </div>
                {/* Location Filter */}
                <div className={showFilter ? "space-y-3 pt-2" : "max-lg:hidden space-y-3 pt-2"}>
                    <h4 className='font-bold text-xs uppercase tracking-wider text-slate-400'>Locations</h4>
                    <ul className='space-y-2.5 text-sm font-medium text-slate-600'>
                        {
                            JobLocations.map((location, index) => (
                                <li className='flex gap-2.5 items-center cursor-pointer hover:text-slate-900 transition' key={index}>
                                    <input
                                        className='rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 w-4 h-4 cursor-pointer'
                                        type="checkbox"
                                        id={`loc-${index}`}
                                        onChange={() => handleLocationChange(location)}
                                        checked={selectedLocations.includes(location)}
                                    />
                                    <label htmlFor={`loc-${index}`} className="cursor-pointer select-none">{location}</label>
                                </li>
                            ))
                        }
                    </ul>
                </div>
            </div>
            {/* Job Listings Grid */}
            <section className='w-full lg:w-3/4 text-slate-800'>
                <div className="mb-8 border-b border-slate-100 pb-4">
                    <h3 className='font-black text-2xl md:text-3xl text-slate-800 tracking-tight' id='job-list'>
                        Latest Openings
                    </h3>
                    <p className='text-xs md:text-sm text-slate-400 mt-1 font-medium'>
                        Find your next career move among the top opportunities.
                    </p>
                </div>
                
                <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
                    {filteredJobs.slice((currentPage - 1) * 6, currentPage * 6).map((job, index) => (
                        <JobCard key={index} job={job} />
                    ))}
                </div>
                {/* ATS/Premium Style Pagination */}
                {filteredJobs.length > 0 && (
                    <div className='flex items-center justify-center space-x-1.5 mt-12 border-t border-slate-100 pt-6'>
                        <a href="#job-list">
                          <button 
                            onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))} 
                            disabled={currentPage === 1}
                            className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition disabled:opacity-40 disabled:hover:bg-transparent"
                          >
                            <img className="h-3 w-3 opacity-60" src={assets.left_arrow_icon} alt="Prev" />
                          </button>
                        </a>
                        
                        {Array.from({ length: Math.ceil(filteredJobs.length / 6) }).map((_, index) => (
                            <a key={index} href="#job-list">
                                <button 
                                  onClick={() => setCurrentPage(index + 1)} 
                                  className={`w-10 h-10 flex items-center justify-center font-bold text-xs rounded-xl border transition ${
                                    currentPage === index + 1 
                                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm hover:bg-indigo-500' 
                                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  {index + 1}
                                </button>
                            </a>
                        ))}
                        
                        <a href="#job-list">
                          <button 
                            onClick={() => setCurrentPage(Math.min(currentPage + 1, Math.ceil(filteredJobs.length / 6)))} 
                            disabled={currentPage === Math.ceil(filteredJobs.length / 6)}
                            className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition disabled:opacity-40 disabled:hover:bg-transparent"
                          >
                            <img className="h-3 w-3 opacity-60" src={assets.right_arrow_icon} alt="Next" />
                          </button>
                        </a>
                    </div>
                )}
            </section>
        </div>
    )
}
export default JobListing