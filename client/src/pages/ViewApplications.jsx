import { useContext, useEffect, useState } from 'react'
import { assets } from '../assets/assets'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import Loading from '../components/Loading'

const ViewApplications = () => {

  const { backendUrl, companyToken } = useContext(AppContext)

  const [applicants, setApplicants] = useState(false)
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedJob, setSelectedJob] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  // Function to fetch company Job Applications data 
  const fetchCompanyJobApplications = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/company/applicants',
        { headers: { token: companyToken } }
      )

      if (data.success) {
        setApplicants(data.applications.reverse())
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  // Function to Update Job Applications Status 
  const changeJobApplicationStatus = async (id, status) => {
    try {
      const { data } = await axios.post(backendUrl + '/api/company/change-status',
        { id, status },
        { headers: { token: companyToken } }
      )

      if (data.success) {
        toast.success(`Application status updated to ${status}`)
        fetchCompanyJobApplications()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (companyToken) {
      fetchCompanyJobApplications()
    }
  }, [companyToken])

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('')
    setSelectedJob('')
    setSelectedStatus('')
  }

  // Extract unique job titles for dropdown filter
  const uniqueJobs = applicants 
    ? Array.from(new Set(applicants.filter(item => item.jobId).map(item => item.jobId.title)))
    : []

  // Statistics calculation
  const stats = {
    total: applicants ? applicants.filter(item => item.jobId && item.userId).length : 0,
    pending: applicants ? applicants.filter(item => item.jobId && item.userId && item.status === 'Pending').length : 0,
    accepted: applicants ? applicants.filter(item => item.jobId && item.userId && item.status === 'Accepted').length : 0,
    rejected: applicants ? applicants.filter(item => item.jobId && item.userId && item.status === 'Rejected').length : 0
  }

  // Filtered applicants
  const filteredApplicants = applicants 
    ? applicants.filter(item => {
        if (!item.jobId || !item.userId) return false

        // 1. Job Title Filter
        if (selectedJob && item.jobId.title !== selectedJob) return false

        // 2. Status Filter
        if (selectedStatus && item.status !== selectedStatus) return false

        // 3. Search Term (Name, Email, Job Title, Location)
        if (searchTerm) {
          const term = searchTerm.toLowerCase()
          const nameMatch = item.userId.name?.toLowerCase().includes(term)
          const emailMatch = item.userId.email?.toLowerCase().includes(term)
          const titleMatch = item.jobId.title?.toLowerCase().includes(term)
          const locationMatch = item.jobId.location?.toLowerCase().includes(term)
          
          if (!nameMatch && !emailMatch && !titleMatch && !locationMatch) return false
        }

        return true
      })
    : []

  if (!applicants) {
    return <Loading />
  }

  return (
    <div className='container mx-auto p-4 sm:p-6 max-w-7xl animate-fade-in'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-800'>Applicant Management</h1>
        <p className='text-gray-500 text-sm'>View and filter resumes of applicants for your job postings.</p>
      </div>

      {applicants.length === 0 ? (
        <div className='flex flex-col items-center justify-center h-[50vh] bg-white rounded-xl border border-gray-100 shadow-sm p-8'>
          <div className='p-4 bg-blue-50 rounded-full mb-4'>
            <img className='w-12 h-12 text-blue-500' src={assets.person_tick_icon} alt="" />
          </div>
          <p className='text-xl font-semibold text-gray-700'>No Applications Received Yet</p>
          <p className='text-gray-400 text-sm mt-1 text-center max-w-md'>When candidates apply for your posted jobs, their applications and resumes will show up here.</p>
        </div>
      ) : (
        <>
          {/* Statistics Dashboard Badges */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
            <div onClick={() => setSelectedStatus('')} className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${selectedStatus === '' ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-gray-200'}`}>
              <div className='text-xs font-semibold text-gray-400 uppercase tracking-wider'>Total Applications</div>
              <div className='text-2xl font-bold text-gray-800 mt-1'>{stats.total}</div>
            </div>
            
            <div onClick={() => setSelectedStatus('Pending')} className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${selectedStatus === 'Pending' ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-white border-gray-200'}`}>
              <div className='text-xs font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-1.5'>
                <span className='w-2 h-2 rounded-full bg-amber-400 inline-block'></span>
                Pending Review
              </div>
              <div className='text-2xl font-bold text-gray-800 mt-1'>{stats.pending}</div>
            </div>

            <div onClick={() => setSelectedStatus('Accepted')} className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${selectedStatus === 'Accepted' ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-gray-200'}`}>
              <div className='text-xs font-semibold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5'>
                <span className='w-2 h-2 rounded-full bg-emerald-500 inline-block'></span>
                Accepted / Shortlisted
              </div>
              <div className='text-2xl font-bold text-gray-800 mt-1'>{stats.accepted}</div>
            </div>

            <div onClick={() => setSelectedStatus('Rejected')} className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${selectedStatus === 'Rejected' ? 'bg-rose-50 border-rose-200 shadow-sm' : 'bg-white border-gray-200'}`}>
              <div className='text-xs font-semibold text-rose-500 uppercase tracking-wider flex items-center gap-1.5'>
                <span className='w-2 h-2 rounded-full bg-rose-500 inline-block'></span>
                Rejected
              </div>
              <div className='text-2xl font-bold text-gray-800 mt-1'>{stats.rejected}</div>
            </div>
          </div>

          {/* Filtration Panel */}
          <div className='bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm flex flex-col md:flex-row md:items-center gap-4'>
            {/* Search Input */}
            <div className='flex-1 relative'>
              <input
                type="text"
                placeholder="Search name, email, job title or location..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
              />
              <div className='absolute left-3 top-2.5 text-gray-400'>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.636Z" />
                </svg>
              </div>
            </div>

            {/* Job Title Filter */}
            <div className='w-full md:w-56'>
              <select
                value={selectedJob}
                onChange={e => setSelectedJob(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
              >
                <option value="">All Jobs</option>
                {uniqueJobs.map((job, idx) => (
                  <option key={idx} value={job}>{job}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className='w-full md:w-48'>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Reset Button */}
            {(searchTerm || selectedJob || selectedStatus) && (
              <button
                onClick={resetFilters}
                className='px-4 py-2 text-sm font-semibold text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200 hover:border-blue-200'
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Filtering Summary / Count */}
          {(searchTerm || selectedJob || selectedStatus) && (
            <div className='mb-4 text-sm text-gray-500 flex items-center justify-between'>
              <span>Found <strong>{filteredApplicants.length}</strong> matching application{filteredApplicants.length !== 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Applicants Table */}
          {filteredApplicants.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm p-6'>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-300 mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <p className='text-lg font-semibold text-gray-700'>No Matching Applications Found</p>
              <p className='text-gray-400 text-sm mt-1 text-center'>Try adjusting your search query or filter settings.</p>
              <button
                onClick={resetFilters}
                className='mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm'
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className='bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden'>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm text-left text-gray-500'>
                  <thead className='text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200'>
                    <tr>
                      <th className='py-3.5 px-6 text-center w-12'>#</th>
                      <th className='py-3.5 px-6'>Candidate Details</th>
                      <th className='py-3.5 px-6'>Job Title</th>
                      <th className='py-3.5 px-6'>Location</th>
                      <th className='py-3.5 px-6 text-center'>Resume</th>
                      <th className='py-3.5 px-6 text-center'>Status</th>
                      <th className='py-3.5 px-6 text-center w-24'>Action</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-150'>
                    {filteredApplicants.map((applicant, index) => (
                      <tr key={applicant._id || index} className='hover:bg-gray-50 transition-colors'>
                        <td className='py-4 px-6 text-center font-medium text-gray-700'>{index + 1}</td>
                        <td className='py-4 px-6'>
                          <div className='flex items-center gap-3'>
                            <img className='w-10 h-10 rounded-full object-cover border border-gray-200' src={applicant.userId.image} alt={applicant.userId.name} />
                            <div className='flex flex-col'>
                              <span className='font-semibold text-gray-800 text-base leading-tight'>{applicant.userId.name}</span>
                              <span className='text-xs text-gray-400 mt-0.5'>{applicant.userId.email || 'No email provided'}</span>
                            </div>
                          </div>
                        </td>
                        <td className='py-4 px-6 font-medium text-gray-800'>{applicant.jobId.title}</td>
                        <td className='py-4 px-6 text-gray-600'>{applicant.jobId.location}</td>
                        <td className='py-4 px-6 text-center'>
                          {(applicant.resume || (applicant.userId && applicant.userId.resume)) ? (
                            <a
                              href={(applicant.resume || applicant.userId.resume).startsWith('http') ? (applicant.resume || applicant.userId.resume).replace('/upload/', '/upload/fl_attachment/') : `${backendUrl}/${applicant.resume || applicant.userId.resume}`}
                              target='_blank'
                              rel='noopener noreferrer'
                              download
                              className='bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-150 transition px-3 py-1.5 rounded-lg inline-flex gap-2 items-center text-xs font-semibold'
                            >
                              Resume 
                              <img className='w-3 h-3' src={assets.resume_download_icon} alt="download" />
                            </a>
                          ) : (
                            <span className='text-gray-400 text-xs italic font-medium'>No Resume</span>
                          )}
                        </td>
                        <td className='py-4 px-6 text-center'>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            applicant.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            applicant.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                            'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              applicant.status === 'Accepted' ? 'bg-emerald-500' :
                              applicant.status === 'Rejected' ? 'bg-rose-500' :
                              'bg-amber-400'
                            }`}></span>
                            {applicant.status}
                          </span>
                        </td>
                        <td className='py-4 px-6 text-center relative'>
                          <div className='relative inline-block text-left group'>
                            <button className='text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-150 transition duration-150'>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                              </svg>
                            </button>
                            
                            {/* Action Menu (dropdown hover) */}
                            <div className='z-10 hidden absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg group-hover:block transition-all duration-150 overflow-hidden'>
                              {applicant.status !== 'Accepted' && (
                                <button 
                                  onClick={() => changeJobApplicationStatus(applicant._id, 'Accepted')} 
                                  className='block w-full text-left px-4 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors'
                                >
                                  Accept Candidate
                                </button>
                              )}
                              {applicant.status !== 'Rejected' && (
                                <button 
                                  onClick={() => changeJobApplicationStatus(applicant._id, 'Rejected')} 
                                  className='block w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors'
                                >
                                  Reject Candidate
                                </button>
                              )}
                              {applicant.status !== 'Pending' && (
                                <button 
                                  onClick={() => changeJobApplicationStatus(applicant._id, 'Pending')} 
                                  className='block w-full text-left px-4 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-50 transition-colors border-t border-gray-100'
                                >
                                  Revert to Pending
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ViewApplications