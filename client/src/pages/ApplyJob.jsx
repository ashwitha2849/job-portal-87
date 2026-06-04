import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import Loading from '../components/Loading'
import Navbar from '../components/Navbar'
import { assets } from '../assets/assets'
import kconvert from 'k-convert';
import moment from 'moment';
import JobCard from '../components/JobCard'
import Footer from '../components/Footer'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useAuth } from '@clerk/clerk-react'
const ApplyJob = () => {
  const { id } = useParams()
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const [JobData, setJobData] = useState(null)
  const [isAlreadyApplied, setIsAlreadyApplied] = useState(false)
  // Custom application states
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [useDefaultResume, setUseDefaultResume] = useState(true)
  const [customResumeFile, setCustomResumeFile] = useState(null)
  const [isApplying, setIsApplying] = useState(false)
  const { jobs, backendUrl, userData, userApplications, fetchUserApplications } = useContext(AppContext)
  const fetchJob = async () => {
    try {
      const { data } = await axios.get(backendUrl + `/api/jobs/${id}`)
      if (data.success) {
        setJobData(data.job)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }
  const onApplyClick = () => {
    if (!userData) {
      return toast.error('Login to apply for jobs')
    }
    if (isAlreadyApplied) {
      return toast.info('Already applied for this job')
    }
    // Pre-select saved default resume if they have one
    setUseDefaultResume(!!userData.resume)
    setShowApplyModal(true)
  }
  const applyHandler = async (e) => {
    if (e) e.preventDefault()
    
    try {
      if (!userData) {
        return toast.error('Login to apply for jobs')
      }
      setIsApplying(true)
      const token = await getToken()
      
      const formData = new FormData()
      formData.append('jobId', JobData._id)
      if (useDefaultResume) {
        if (!userData.resume) {
          setIsApplying(false)
          return toast.error('Please upload a resume first or select a file to upload.')
        }
        formData.append('resume', userData.resume)
      } else {
        if (!customResumeFile) {
          setIsApplying(false)
          return toast.error('Please select a PDF resume file to upload.')
        }
        formData.append('resume', customResumeFile)
      }
      const { data } = await axios.post(backendUrl + '/api/users/apply',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (data.success) {
        toast.success(data.message)
        fetchUserApplications()
        setShowApplyModal(false)
        setCustomResumeFile(null)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setIsApplying(false)
    }
  }
  const checkAlreadyApplied = () => {
    const hasApplied = userApplications.some(item => item.jobId._id === JobData._id)
    setIsAlreadyApplied(hasApplied)
  }
  useEffect(() => {
    fetchJob()
  }, [id])
  useEffect(() => {
    if (userApplications.length > 0 && JobData) {
      checkAlreadyApplied()
    }
  }, [JobData, userApplications, id])
  return JobData ? (
    <>
      <Navbar />
      <div className='min-h-screen flex flex-col py-10 container px-4 2xl:px-20 mx-auto'>
        <div className='bg-white text-black rounded-lg w-ful'>
          <div className='flex justify-center md:justify-between flex-wrap gap-8 px-14 py-20 mb-6 bg-sky-50 border border-sky-400 rounded-xl'>
            <div className='flex flex-col md:flex-row items-center'>
              <img className='h-24 bg-white rounded-lg p-4 mr-4 max-md:mb-4 border' src={JobData.companyId.image} alt="" />
              <div className='text-center md:text-left text-neutral-700'>
                <h1 className='text-2xl sm:text-4xl font-medium'>{JobData.title}</h1>
                <div className='flex flex-row flex-wrap max-md:justify-center gap-y-2 gap-6 items-center text-gray-600 mt-2'>
                  <span className='flex items-center gap-1'>
                    <img src={assets.suitcase_icon} alt="" />
                    {JobData.companyId.name}
                  </span>
                  <span className='flex items-center gap-1'>
                    <img src={assets.location_icon} alt="" />
                    {JobData.location}
                  </span>
                  <span className='flex items-center gap-1'>
                    <img src={assets.person_icon} alt="" />
                    {JobData.level}
                  </span>
                  <span className='flex items-center gap-1'>
                    <img src={assets.money_icon} alt="" />
                    CTC: {kconvert.convertTo(JobData.salary)}
                  </span>
                </div>
              </div>
            </div>
            <div className='flex flex-col justify-center text-end text-sm max-md:mx-auto max-md:text-center'>
              <button 
                onClick={onApplyClick} 
                className={`p-2.5 px-10 text-white rounded transition active:scale-95 ${
                  isAlreadyApplied ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 shadow-sm shadow-blue-500/10'
                }`}
                disabled={isAlreadyApplied}
              >
                {isAlreadyApplied ? 'Already Applied' : 'Apply Now'}
              </button>
              <p className='mt-1 text-gray-600'>Posted {moment(JobData.date).fromNow()}</p>
            </div>
          </div>
          <div className='flex flex-col lg:flex-row justify-between items-start'>
            <div className='w-full lg:w-2/3'>
              <h2 className='font-bold text-2xl mb-4'>Job description</h2>
              <div className='rich-text' dangerouslySetInnerHTML={{ __html: JobData.description }}></div>
              <button 
                onClick={onApplyClick} 
                className={`p-2.5 px-10 text-white rounded mt-10 transition active:scale-95 ${
                  isAlreadyApplied ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'
                }`}
                disabled={isAlreadyApplied}
              >
                {isAlreadyApplied ? 'Already Applied' : 'Apply Now'}
              </button>
            </div>
            {/* Right Section More Jobs */}
            <div className='w-full lg:w-1/3 mt-8 lg:mt-0 lg:ml-8 space-y-5'>
              <h2>More jobs from {JobData.companyId.name}</h2>
              {jobs.filter(job => job._id !== JobData._id && job.companyId._id === JobData.companyId._id)
                .filter(job => {
                  const appliedJobsIds = new Set(userApplications.map(app => app.jobId && app.jobId._id))
                  return !appliedJobsIds.has(job._id)
                }).slice(0, 4)
                .map((job, index) => <JobCard key={index} job={job} />)}
            </div>
          </div>
        </div>
      </div>
      <Footer />
      {/* Modern custom application resume selector modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 backdrop-blur-md bg-slate-900/60 flex justify-center items-center p-4 animate-fade-in text-slate-700">
          <div className="relative bg-white w-full max-w-md p-8 md:p-10 rounded-[32px] shadow-2xl border border-slate-100/80 animate-scale-up">
            <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-2">Apply for Job</h2>
            <p className="text-xs text-slate-400 mb-6 font-medium">Select or upload a resume to submit your application.</p>
            
            <form onSubmit={applyHandler} className="space-y-4">
              
              {/* Option 1: Use Saved Resume */}
              {userData && userData.resume && (
                <div 
                  onClick={() => setUseDefaultResume(true)}
                  className={`border-2 p-4 rounded-2xl cursor-pointer transition ${
                    useDefaultResume 
                      ? 'border-indigo-600 bg-indigo-50/10' 
                      : 'border-slate-150 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="resumeOption" 
                      checked={useDefaultResume} 
                      onChange={() => setUseDefaultResume(true)}
                      className="text-indigo-600 focus:ring-indigo-500" 
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Use Saved Default Resume</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Your profile resume will be submitted.</p>
                    </div>
                  </div>
                </div>
              )}
              {/* Option 2: Upload Custom Resume */}
              <div 
                onClick={() => setUseDefaultResume(false)}
                className={`border-2 p-4 rounded-2xl cursor-pointer transition ${
                  !useDefaultResume 
                    ? 'border-indigo-600 bg-indigo-50/10' 
                    : 'border-slate-150 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input 
                    type="radio" 
                    name="resumeOption" 
                    checked={!useDefaultResume} 
                    onChange={() => setUseDefaultResume(false)}
                    className="text-indigo-600 focus:ring-indigo-500 mt-0.5" 
                  />
                  <div className="flex-grow">
                    <h4 className="text-xs font-bold text-slate-800">Upload Specific Resume</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 mb-2">Upload a tailored resume for this job role.</p>
                    
                    {!useDefaultResume && (
                      <div className="mt-2.5">
                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-xl p-4 bg-slate-50/50 hover:bg-indigo-50/10 transition-all duration-200 cursor-pointer">
                          <span className="text-xs font-bold text-slate-500 text-center leading-none">
                            {customResumeFile ? customResumeFile.name : "Select PDF File"}
                          </span>
                          <span className="text-[9px] text-slate-400 mt-1 font-medium">PDF files only</span>
                          <input 
                            type="file" 
                            accept="application/pdf" 
                            onChange={(e) => setCustomResumeFile(e.target.files[0])}
                            className="hidden" 
                            required={!useDefaultResume} 
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-50 mt-6">
                <button 
                  type="button" 
                  onClick={() => { setShowApplyModal(false); setCustomResumeFile(null); }}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isApplying}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5 hover:shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                >
                  {isApplying ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Applying...
                    </>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  ) : (
    <Loading />
  )
}
export default ApplyJob