import { useContext, useState, useEffect, useRef } from "react";
import { AppContext } from "../context/AppContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
const ResumeBuilder = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { backendUrl, userData, fetchUserData } = useContext(AppContext);
  // Resume form state
  const [resumeData, setResumeData] = useState({
    personalInfo: {
      name: "",
      email: "",
      phone: "",
      location: "",
      portfolio: "",
      linkedin: "",
      github: "",
    },
    summary: "",
    skills: [],
    experience: [
      {
        title: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        description: "",
      },
    ],
    education: [
      {
        degree: "",
        school: "",
        year: "",
        details: "",
      },
    ],
    projects: [
      {
        title: "",
        technologies: "",
        link: "",
        description: "",
      },
    ],
  });
  // UI state
  const [activeFormTab, setActiveFormTab] = useState("personal");
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [quickPrompt, setQuickPrompt] = useState("");
  
  // Loading states for AI integrations
  const [isFullDraftLoading, setIsFullDraftLoading] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [experienceAILoading, setExperienceAILoading] = useState({});
  const [projectAILoading, setProjectAILoading] = useState({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  // Skill input string (converted to array on blur/change)
  const [skillsText, setSkillsText] = useState("");
  const previewRef = useRef(null);
  // Pre-fill user data from Clerk/DB when available
  useEffect(() => {
    if (user && resumeData.personalInfo.name === "") {
      setResumeData((prev) => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          email: user.primaryEmailAddress?.emailAddress || "",
        },
      }));
    }
  }, [user]);
  // Sync skills text field with skills array
  useEffect(() => {
    if (resumeData.skills.length > 0 && skillsText === "") {
      setSkillsText(resumeData.skills.join(", "));
    }
  }, [resumeData.skills]);
  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    setResumeData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [name]: value,
      },
    }));
  };
  const handleSkillsChange = (e) => {
    const value = e.target.value;
    setSkillsText(value);
    const skillsArray = value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "");
    setResumeData((prev) => ({
      ...prev,
      skills: skillsArray,
    }));
  };
  // List managers (experience, education, projects)
  const handleListChange = (section, index, field, value) => {
    setResumeData((prev) => {
      const updatedList = [...prev[section]];
      updatedList[index] = { ...updatedList[index], [field]: value };
      return { ...prev, [section]: updatedList };
    });
  };
  const addListItem = (section, templateObj) => {
    setResumeData((prev) => ({
      ...prev,
      [section]: [...prev[section], templateObj],
    }));
  };
  const removeListItem = (section, index) => {
    setResumeData((prev) => {
      if (prev[section].length <= 1) {
        toast.info(`Must have at least one ${section} item.`);
        return prev;
      }
      const updatedList = [...prev[section]];
      updatedList.splice(index, 1);
      return { ...prev, [section]: updatedList };
    });
  };
  // AI INTEGRATIONS (API Calls)
  const generateAiFullDraft = async () => {
    if (!quickPrompt.trim()) {
      return toast.warn("Please write a short prompt description.");
    }
    setIsFullDraftLoading(true);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        backendUrl + "/api/users/ai/full-draft",
        { promptText: quickPrompt },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        setResumeData(data.resume);
        if (data.resume.skills) {
          setSkillsText(data.resume.skills.join(", "));
        }
        toast.success(
          data.isMock
            ? "Generated Draft (Mock Mode: Please configure Gemini Key for live AI)"
            : "Successfully generated full resume draft!"
        );
      } else {
        toast.error(data.message || "Failed to generate draft.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsFullDraftLoading(false);
    }
  };
  const generateAiSummary = async () => {
    const title = resumeData.personalInfo.location || ""; // fallback
    const skills = resumeData.skills.join(", ");
    
    setIsSummaryLoading(true);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        backendUrl + "/api/users/ai/summary",
        {
          title: title || "Software Engineer",
          skills: skills || "JavaScript, HTML, CSS",
          experienceSummary: resumeData.experience.map(e => e.title).join(", ")
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        setResumeData((prev) => ({ ...prev, summary: data.summary }));
        toast.success(
          data.isMock
            ? "Generated Summary (Mock Mode)"
            : "Summary generated with AI!"
        );
      } else {
        toast.error(data.message || "Failed to generate summary.");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSummaryLoading(false);
    }
  };
  const enhanceExperienceDescription = async (index) => {
    const text = resumeData.experience[index].description;
    if (!text.trim()) {
      return toast.warn("Please write some rough details first before enhancing.");
    }
    setExperienceAILoading((prev) => ({ ...prev, [index]: true }));
    try {
      const token = await getToken();
      const { data } = await axios.post(
        backendUrl + "/api/users/ai/enhance",
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        handleListChange("experience", index, "description", data.enhancedText);
        toast.success(data.isMock ? "Enhanced Text (Mock Mode)" : "Enhanced experience description!");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setExperienceAILoading((prev) => ({ ...prev, [index]: false }));
    }
  };
  const enhanceProjectDescription = async (index) => {
    const text = resumeData.projects[index].description;
    if (!text.trim()) {
      return toast.warn("Please write some project details first before enhancing.");
    }
    setProjectAILoading((prev) => ({ ...prev, [index]: true }));
    try {
      const token = await getToken();
      const { data } = await axios.post(
        backendUrl + "/api/users/ai/enhance",
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        handleListChange("projects", index, "description", data.enhancedText);
        toast.success(data.isMock ? "Enhanced Text (Mock Mode)" : "Enhanced project description!");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProjectAILoading((prev) => ({ ...prev, [index]: false }));
    }
  };
  // PDF & EXPORTING ACTIONS
  const generatePDF = async () => {
    const element = previewRef.current;
    if (!element) return null;
    // Temporarily apply full-size styling so it renders cleanly
    const originalWidth = element.style.width;
    element.style.width = "794px"; // Standard A4 width
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      element.style.width = originalWidth;
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      return pdf;
    } catch (error) {
      element.style.width = originalWidth;
      console.error(error);
      return null;
    }
  };
  const handleDownloadPDF = async () => {
    const pdf = await generatePDF();
    if (pdf) {
      const filename = `${resumeData.personalInfo.name.replace(/\s+/g, "_") || "My"}_Resume.pdf`;
      pdf.save(filename);
      toast.success("PDF Downloaded successfully!");
    } else {
      toast.error("Failed to generate PDF");
    }
  };
  const handleSaveToProfile = async () => {
    if (!userData) {
      return toast.error("Please log in as job seeker to save resume.");
    }
    
    setIsSavingProfile(true);
    try {
      const pdf = await generatePDF();
      if (!pdf) {
        setIsSavingProfile(false);
        return toast.error("Failed to render resume PDF.");
      }
      const pdfBlob = pdf.output("blob");
      const filename = `${resumeData.personalInfo.name.replace(/\s+/g, "_") || "My"}_Resume.pdf`;
      const pdfFile = new File([pdfBlob], filename, { type: "application/pdf" });
      const formData = new FormData();
      formData.append("resume", pdfFile);
      const token = await getToken();
      const { data } = await axios.post(
        backendUrl + "/api/users/update-resume",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success("AI Resume updated and saved directly to your profile!");
        await fetchUserData();
      } else {
        toast.error(data.message || "Failed to update profile resume.");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSavingProfile(false);
    }
  };
  if (!user) {
    return (
      <>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[70vh] bg-slate-50 px-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center border border-slate-100 animate-fade-in">
            <h1 className="text-2xl font-bold text-neutral-800 mb-4">Job Seeker Login Required</h1>
            <p className="text-gray-600 mb-6">
              Please sign in as a Job Seeker to access the AI Resume Builder, enhance descriptions, download PDFs, and save to your profile.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.href = "/"}
                className="px-6 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-full hover:bg-slate-200 transition"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#f8fafc] bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:24px_24px] py-10 px-4 2xl:px-20 font-sans text-slate-800">
        
        {/* HERO SaaS HEADER */}
        <div className="max-w-7xl mx-auto mb-10 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-[32px] p-8 md:p-12 shadow-2xl relative overflow-hidden border border-indigo-900/30">
          <div className="absolute right-0 top-0 w-[40%] h-[100%] bg-radial-gradient from-violet-600/10 via-transparent to-transparent opacity-70 blur-3xl pointer-events-none"></div>
          <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-400/20 rounded-full px-3 py-1 text-xs font-semibold text-indigo-300 mb-4 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              Powered by Google Gemini AI
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight leading-none bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
              Create a Standout Resume
            </h1>
            <p className="text-sm md:text-base text-indigo-200/80 mb-8 max-w-2xl font-normal leading-relaxed">
              Design a professional, ATS-optimized resume in minutes. Let AI enhance your career highlights, draft summaries, and generate complete layouts automatically.
            </p>
            {/* SaaS Style AI input bar */}
            <div className="flex flex-col md:flex-row gap-3 bg-slate-900/60 backdrop-blur-md p-2.5 rounded-2xl border border-slate-800/80 shadow-xl max-w-3xl">
              <div className="flex-grow flex items-center gap-2 px-3">
                <span className="text-xl">✨</span>
                <input
                  type="text"
                  placeholder="Tell AI your target job (e.g. 'Senior Python Backend dev with AWS cloud experience')"
                  value={quickPrompt}
                  onChange={(e) => setQuickPrompt(e.target.value)}
                  className="w-full bg-transparent text-white placeholder-slate-400 outline-none text-sm focus:ring-0"
                />
              </div>
              <button
                onClick={generateAiFullDraft}
                disabled={isFullDraftLoading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
              >
                {isFullDraftLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Generate Full Resume"
                )}
              </button>
            </div>
          </div>
        </div>
        {/* WORKSPACE CONTAINER */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL: FORM EDITOR */}
          <div className="lg:col-span-5 bg-white rounded-3xl shadow-xl border border-slate-100/80 overflow-hidden backdrop-blur-md">
            
            {/* SaaS Tabs headers */}
            <div className="flex bg-slate-50 border-b border-slate-100 overflow-x-auto text-xs font-bold uppercase tracking-wider scrollbar-none">
              {[
                { id: "personal", label: "Contact", icon: "👤" },
                { id: "summary", label: "Summary", icon: "📝" },
                { id: "experience", label: "Work", icon: "💼" },
                { id: "education", label: "Studies", icon: "🎓" },
                { id: "projects", label: "Projects", icon: "🚀" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFormTab(tab.id)}
                  className={`flex-grow flex items-center justify-center gap-1.5 px-4 py-4.5 border-b-2 whitespace-nowrap transition-all duration-200 ${
                    activeFormTab === tab.id
                      ? "border-indigo-600 text-indigo-600 bg-white font-extrabold"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Forms Panel Body */}
            <div className="p-6">
              
              {/* TAB: CONTACT */}
              {activeFormTab === "personal" && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-bold text-slate-800">Contact Information</h3>
                    <p className="text-xs text-slate-400">Add details for hiring companies to reach you.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={resumeData.personalInfo.name}
                        onChange={handlePersonalInfoChange}
                        placeholder="John Doe"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 text-sm transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={resumeData.personalInfo.email}
                        onChange={handlePersonalInfoChange}
                        placeholder="johndoe@example.com"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 text-sm transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</label>
                      <input
                        type="text"
                        name="phone"
                        value={resumeData.personalInfo.phone}
                        onChange={handlePersonalInfoChange}
                        placeholder="+1 (555) 123-4567"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 text-sm transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Location</label>
                      <input
                        type="text"
                        name="location"
                        value={resumeData.personalInfo.location}
                        onChange={handlePersonalInfoChange}
                        placeholder="New York, NY"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 text-sm transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Website</label>
                      <input
                        type="text"
                        name="portfolio"
                        value={resumeData.personalInfo.portfolio}
                        onChange={handlePersonalInfoChange}
                        placeholder="https://johndoe.dev"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 text-sm transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">LinkedIn URL</label>
                      <input
                        type="text"
                        name="linkedin"
                        value={resumeData.personalInfo.linkedin}
                        onChange={handlePersonalInfoChange}
                        placeholder="https://linkedin.com/in/username"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 text-sm transition"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">GitHub URL</label>
                      <input
                        type="text"
                        name="github"
                        value={resumeData.personalInfo.github}
                        onChange={handlePersonalInfoChange}
                        placeholder="https://github.com/username"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 text-sm transition"
                      />
                    </div>
                  </div>
                </div>
              )}
              {/* TAB: SUMMARY & SKILLS */}
              {activeFormTab === "summary" && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Summary & Skills</h3>
                      <p className="text-xs text-slate-400">Describe yourself and list technologies.</p>
                    </div>
                    <button
                      onClick={generateAiSummary}
                      disabled={isSummaryLoading}
                      className="bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-600 font-bold px-3 py-1.5 rounded-xl text-xs tracking-wider uppercase transition active:scale-95 flex items-center gap-1.5"
                    >
                      {isSummaryLoading ? (
                        <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <><span>✨</span> AI Rewrite</>
                      )}
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Professional Summary</label>
                      <textarea
                        rows={6}
                        value={resumeData.summary}
                        onChange={(e) => setResumeData((prev) => ({ ...prev, summary: e.target.value }))}
                        placeholder="Describe your major achievements, experience and professional goals..."
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 text-sm transition leading-relaxed"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Skills (comma separated)</label>
                      <input
                        type="text"
                        value={skillsText}
                        onChange={handleSkillsChange}
                        placeholder="React, Node.js, MERN, Tailwind, AWS, Python"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 text-sm transition"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Separate skills with commas (e.g. JavaScript, Python, AWS).</p>
                    </div>
                  </div>
                </div>
              )}
              {/* TAB: EXPERIENCE */}
              {activeFormTab === "experience" && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Work History</h3>
                      <p className="text-xs text-slate-400">Add your previous job positions.</p>
                    </div>
                    <button
                      onClick={() =>
                        addListItem("experience", {
                          title: "",
                          company: "",
                          location: "",
                          startDate: "",
                          endDate: "",
                          description: "",
                        })
                      }
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs uppercase tracking-wider transition active:scale-95 shadow-sm"
                    >
                      + Add Role
                    </button>
                  </div>
                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                    {resumeData.experience.map((exp, index) => (
                      <div key={index} className="p-4 border border-slate-100 bg-slate-50/50 rounded-2xl relative space-y-4 shadow-sm">
                        <button
                          onClick={() => removeListItem("experience", index)}
                          className="absolute right-3 top-3 text-red-500 hover:text-red-700 text-xs font-bold transition"
                        >
                          ✕ Remove
                        </button>
                        
                        <span className="inline-block bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-2 py-0.5 rounded-lg uppercase tracking-wider">
                          Position {index + 1}
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <input
                              type="text"
                              value={exp.title}
                              onChange={(e) => handleListChange("experience", index, "title", e.target.value)}
                              placeholder="Job Title"
                              className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-sm transition"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => handleListChange("experience", index, "company", e.target.value)}
                              placeholder="Company"
                              className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-sm transition"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={exp.location}
                              onChange={(e) => handleListChange("experience", index, "location", e.target.value)}
                              placeholder="Location"
                              className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-sm transition"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={exp.startDate}
                              onChange={(e) => handleListChange("experience", index, "startDate", e.target.value)}
                              placeholder="Start Date"
                              className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-xs transition text-center"
                            />
                            <input
                              type="text"
                              value={exp.endDate}
                              onChange={(e) => handleListChange("experience", index, "endDate", e.target.value)}
                              placeholder="End Date"
                              className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-xs transition text-center"
                            />
                          </div>
                          <div className="md:col-span-2 space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Responsibilities</span>
                              <button
                                onClick={() => enhanceExperienceDescription(index)}
                                disabled={experienceAILoading[index]}
                                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold uppercase tracking-wider flex items-center gap-1 transition active:scale-95 disabled:opacity-50"
                              >
                                {experienceAILoading[index] ? (
                                  <div className="w-2.5 h-2.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  "✨ AI Enhance"
                                )}
                              </button>
                            </div>
                            <textarea
                              rows={3}
                              value={exp.description}
                              onChange={(e) => handleListChange("experience", index, "description", e.target.value)}
                              placeholder="- Developed scalable APIs using Express & Node...&#10;- Optimized SQL queries..."
                              className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-xs transition font-mono leading-relaxed"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* TAB: EDUCATION */}
              {activeFormTab === "education" && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Education</h3>
                      <p className="text-xs text-slate-400">Add degree levels and schools.</p>
                    </div>
                    <button
                      onClick={() =>
                        addListItem("education", {
                          degree: "",
                          school: "",
                          year: "",
                          details: "",
                        })
                      }
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs uppercase tracking-wider transition active:scale-95"
                    >
                      + Add School
                    </button>
                  </div>
                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                    {resumeData.education.map((edu, index) => (
                      <div key={index} className="p-4 border border-slate-100 bg-slate-50/50 rounded-2xl relative space-y-3 shadow-sm">
                        <button
                          onClick={() => removeListItem("education", index)}
                          className="absolute right-3 top-3 text-red-500 hover:text-red-700 text-xs font-bold transition"
                        >
                          ✕ Remove
                        </button>
                        
                        <span className="inline-block bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-2 py-0.5 rounded-lg uppercase tracking-wider">
                          Education {index + 1}
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <input
                              type="text"
                              value={edu.degree}
                              onChange={(e) => handleListChange("education", index, "degree", e.target.value)}
                              placeholder="Degree (e.g. B.S. in Computer Science)"
                              className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-sm transition"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={edu.school}
                              onChange={(e) => handleListChange("education", index, "school", e.target.value)}
                              placeholder="University / School"
                              className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-sm transition"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={edu.year}
                              onChange={(e) => handleListChange("education", index, "year", e.target.value)}
                              placeholder="Graduation Year"
                              className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-sm transition"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={edu.details}
                              onChange={(e) => handleListChange("education", index, "details", e.target.value)}
                              placeholder="Details (GPA: 3.8/4.0)"
                              className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-sm transition"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* TAB: PROJECTS */}
              {activeFormTab === "projects" && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Projects</h3>
                      <p className="text-xs text-slate-400">List personal or group projects.</p>
                    </div>
                    <button
                      onClick={() =>
                        addListItem("projects", {
                          title: "",
                          technologies: "",
                          link: "",
                          description: "",
                        })
                      }
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs uppercase tracking-wider transition active:scale-95"
                    >
                      + Add Project
                    </button>
                  </div>
                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                    {resumeData.projects.map((proj, index) => (
                      <div key={index} className="p-4 border border-slate-100 bg-slate-50/50 rounded-2xl relative space-y-3 shadow-sm">
                        <button
                          onClick={() => removeListItem("projects", index)}
                          className="absolute right-3 top-3 text-red-500 hover:text-red-700 text-xs font-bold transition"
                        >
                          ✕ Remove
                        </button>
                        
                        <span className="inline-block bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-2 py-0.5 rounded-lg uppercase tracking-wider">
                          Project {index + 1}
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <input
                              type="text"
                              value={proj.title}
                              onChange={(e) => handleListChange("projects", index, "title", e.target.value)}
                              placeholder="Project Title"
                              className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-sm transition"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={proj.technologies}
                              onChange={(e) => handleListChange("projects", index, "technologies", e.target.value)}
                              placeholder="Technologies Used"
                              className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-sm transition"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <input
                              type="text"
                              value={proj.link}
                              onChange={(e) => handleListChange("projects", index, "link", e.target.value)}
                              placeholder="Project Link (GitHub/Live URL)"
                              className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-sm transition"
                            />
                          </div>
                          
                          <div className="md:col-span-2 space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</span>
                              <button
                                onClick={() => enhanceProjectDescription(index)}
                                disabled={projectAILoading[index]}
                                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold uppercase tracking-wider flex items-center gap-1 transition active:scale-95 disabled:opacity-50"
                              >
                                {projectAILoading[index] ? (
                                  <div className="w-2.5 h-2.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  "✨ AI Enhance"
                                )}
                              </button>
                            </div>
                            <textarea
                              rows={3}
                              value={proj.description}
                              onChange={(e) => handleListChange("projects", index, "description", e.target.value)}
                              placeholder="- Built interactive dashboard using Chart.js...&#10;- Optimized API endpoints..."
                              className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-xs transition font-mono leading-relaxed"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* RIGHT PANEL: LIVE PREVIEW & CONTROLS */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* SaaS Preview Bar Controls */}
            <div className="bg-white p-4.5 rounded-3xl shadow-lg border border-slate-100/80 flex flex-wrap gap-4 items-center justify-between backdrop-blur-md">
              
              {/* Template Style Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Style:</span>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl p-2 outline-none cursor-pointer focus:border-indigo-500 transition"
                >
                  <option value="modern">Modern Minimalist</option>
                  <option value="executive">Professional Executive</option>
                </select>
              </div>
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleDownloadPDF}
                  className="bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs tracking-wider uppercase transition active:scale-95 flex items-center gap-2"
                >
                  📥 Export PDF
                </button>
                
                <button
                  onClick={handleSaveToProfile}
                  disabled={isSavingProfile}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs tracking-wider uppercase transition active:scale-95 disabled:opacity-50 flex items-center gap-2 hover:shadow-[0_0_15px_rgba(99,102,241,0.35)]"
                >
                  {isSavingProfile ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    "💾 Save to Profile"
                  )}
                </button>
              </div>
            </div>
            {/* PREVIEW CONTAINER */}
            <div className="bg-slate-900/5 backdrop-blur-md p-4 md:p-8 rounded-[36px] shadow-inner border border-slate-100/50 flex justify-center overflow-x-auto">
              
              {/* Live Preview Paper */}
              <div
                ref={previewRef}
                id="resume-preview-content"
                className="w-full bg-white shadow-2xl p-10 md:p-12 text-slate-800 font-sans relative border border-slate-200/50 select-text"
                style={{
                  minWidth: "680px",
                  minHeight: "920px",
                  borderRadius: "2px"
                }}
              >
                {/* -------------------- TEMPLATE: MODERN MINIMALIST -------------------- */}
                {selectedTemplate === "modern" && (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="border-b-2 border-indigo-600 pb-4 text-left">
                      <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none">
                        {resumeData.personalInfo.name || "YOUR NAME"}
                      </h2>
                      
                      {/* Contacts list */}
                      <div className="flex flex-wrap gap-y-1 gap-x-4 text-xs text-slate-500 mt-2.5 font-medium">
                        {resumeData.personalInfo.email && (
                          <span className="flex items-center gap-1">✉️ {resumeData.personalInfo.email}</span>
                        )}
                        {resumeData.personalInfo.phone && (
                          <span className="flex items-center gap-1">📞 {resumeData.personalInfo.phone}</span>
                        )}
                        {resumeData.personalInfo.location && (
                          <span className="flex items-center gap-1">📍 {resumeData.personalInfo.location}</span>
                        )}
                        {resumeData.personalInfo.portfolio && (
                          <a href={resumeData.personalInfo.portfolio} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                            🌐 Web
                          </a>
                        )}
                        {resumeData.personalInfo.linkedin && (
                          <a href={resumeData.personalInfo.linkedin} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                            🔗 LinkedIn
                          </a>
                        )}
                        {resumeData.personalInfo.github && (
                          <a href={resumeData.personalInfo.github} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                            🐙 GitHub
                          </a>
                        )}
                      </div>
                    </div>
                    {/* Summary */}
                    {resumeData.summary && (
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-black text-indigo-600 tracking-wider uppercase">Professional Summary</h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-sans text-justify">
                          {resumeData.summary}
                        </p>
                      </div>
                    )}
                    {/* Skills */}
                    {resumeData.skills.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-indigo-600 tracking-wider uppercase">Technical Skills</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {resumeData.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Experience */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-indigo-600 tracking-wider uppercase border-b border-slate-100 pb-1">
                        Professional Experience
                      </h4>
                      <div className="space-y-4">
                        {resumeData.experience.map((exp, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between items-start text-xs font-bold text-slate-800">
                              <span>
                                {exp.title || "Job Title"}{" "}
                                <span className="font-normal text-slate-500">at {exp.company || "Company"}</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold">
                                {exp.startDate || "Start"} – {exp.endDate || "End"}
                              </span>
                            </div>
                            {exp.location && (
                              <p className="text-[10px] text-slate-400 font-medium italic">{exp.location}</p>
                            )}
                            {exp.description && (
                              <div className="text-xs text-slate-600 space-y-1 pl-1">
                                {exp.description.split("\n").map((line, lIdx) => (
                                  <p key={lIdx} className="leading-relaxed">
                                    {line}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Projects */}
                    {resumeData.projects.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-indigo-600 tracking-wider uppercase border-b border-slate-100 pb-1">
                          Key Projects
                        </h4>
                        <div className="space-y-3">
                          {resumeData.projects.map((proj, index) => (
                            <div key={index} className="space-y-1">
                              <div className="flex justify-between items-baseline text-xs font-bold text-slate-800">
                                <span>
                                  {proj.title || "Project Title"}{" "}
                                  {proj.technologies && (
                                    <span className="font-normal text-[10px] text-slate-500 italic">
                                      ({proj.technologies})
                                    </span>
                                  )}
                                </span>
                                {proj.link && (
                                  <a href={proj.link} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 font-bold hover:underline">
                                    Link
                                  </a>
                                )}
                              </div>
                              {proj.description && (
                                <div className="text-xs text-slate-600 space-y-1 pl-1">
                                  {proj.description.split("\n").map((line, lIdx) => (
                                    <p key={lIdx} className="leading-relaxed">
                                      {line}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Education */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-indigo-600 tracking-wider uppercase border-b border-slate-100 pb-1">
                        Education
                      </h4>
                      <div className="space-y-2.5">
                        {resumeData.education.map((edu, index) => (
                          <div key={index} className="flex justify-between items-start text-xs">
                            <div>
                              <p className="font-bold text-slate-800">{edu.degree || "Degree"}</p>
                              <p className="text-[11px] text-slate-500 font-medium">{edu.school || "University"}</p>
                              {edu.details && <p className="text-[10px] text-slate-400 italic mt-0.5">{edu.details}</p>}
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold">{edu.year || "Year"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {/* -------------------- TEMPLATE: EXECUTIVE PROFESSIONAL -------------------- */}
                {selectedTemplate === "executive" && (
                  <div className="space-y-6 text-slate-900 font-serif">
                    {/* Header */}
                    <div className="text-center space-y-2 border-b-2 border-slate-900 pb-4.5">
                      <h2 className="text-3.5xl font-bold uppercase tracking-wider text-slate-950 font-serif">
                        {resumeData.personalInfo.name || "YOUR NAME"}
                      </h2>
                      <div className="flex flex-wrap justify-center gap-x-3 text-[11px] text-slate-600 font-medium font-sans">
                        {resumeData.personalInfo.email && <span>{resumeData.personalInfo.email}</span>}
                        {resumeData.personalInfo.email && <span>•</span>}
                        {resumeData.personalInfo.phone && <span>{resumeData.personalInfo.phone}</span>}
                        {resumeData.personalInfo.phone && <span>•</span>}
                        {resumeData.personalInfo.location && <span>{resumeData.personalInfo.location}</span>}
                      </div>
                      <div className="flex flex-wrap justify-center gap-x-4 text-[11px] text-indigo-800 font-bold font-sans">
                        {resumeData.personalInfo.portfolio && (
                          <a href={resumeData.personalInfo.portfolio} target="_blank" rel="noreferrer" className="hover:underline">
                            Website
                          </a>
                        )}
                        {resumeData.personalInfo.linkedin && (
                          <a href={resumeData.personalInfo.linkedin} target="_blank" rel="noreferrer" className="hover:underline">
                            LinkedIn
                          </a>
                        )}
                        {resumeData.personalInfo.github && (
                          <a href={resumeData.personalInfo.github} target="_blank" rel="noreferrer" className="hover:underline">
                            GitHub
                          </a>
                        )}
                      </div>
                    </div>
                    {/* Summary */}
                    {resumeData.summary && (
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-extrabold text-slate-900 tracking-wider uppercase border-b border-slate-300 pb-0.5 font-sans">
                          Professional Profile
                        </h4>
                        <p className="text-xs text-slate-800 leading-relaxed text-justify">
                          {resumeData.summary}
                        </p>
                      </div>
                    )}
                    {/* Skills list inline */}
                    {resumeData.skills.length > 0 && (
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-extrabold text-slate-900 tracking-wider uppercase border-b border-slate-300 pb-0.5 font-sans">
                          Expertise & Core Competencies
                        </h4>
                        <p className="text-xs text-slate-800 leading-relaxed">
                          {resumeData.skills.join("  |  ")}
                        </p>
                      </div>
                    )}
                    {/* Experience */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-extrabold text-slate-900 tracking-wider uppercase border-b border-slate-300 pb-0.5 font-sans">
                        Professional Background
                      </h4>
                      <div className="space-y-4">
                        {resumeData.experience.map((exp, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between items-baseline text-xs font-bold text-slate-900">
                              <span>
                                {exp.title || "Job Title"} — <span className="italic font-normal">{exp.company || "Company"}</span>
                              </span>
                              <span className="text-[10px] text-slate-500 font-semibold font-sans">
                                {exp.startDate || "Start"} – {exp.endDate || "End"}
                              </span>
                            </div>
                            {exp.location && (
                              <p className="text-[10px] text-slate-400 italic mt-0.5">{exp.location}</p>
                            )}
                            {exp.description && (
                              <div className="text-xs text-slate-700 space-y-1 pl-1 font-serif">
                                {exp.description.split("\n").map((line, lIdx) => (
                                  <p key={lIdx} className="leading-relaxed">
                                    {line}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Projects */}
                    {resumeData.projects.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-extrabold text-slate-900 tracking-wider uppercase border-b border-slate-300 pb-0.5 font-sans">
                          Key Projects
                        </h4>
                        <div className="space-y-3">
                          {resumeData.projects.map((proj, index) => (
                            <div key={index} className="space-y-1">
                              <div className="flex justify-between items-baseline text-xs font-bold text-slate-900">
                                <span>
                                  {proj.title || "Project Title"}{" "}
                                  {proj.technologies && (
                                    <span className="font-normal text-[10px] text-slate-500 italic font-sans">
                                      ({proj.technologies})
                                    </span>
                                  )}
                                </span>
                                {proj.link && (
                                  <a href={proj.link} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-800 font-bold hover:underline font-sans">
                                    View Project
                                  </a>
                                )}
                              </div>
                              {proj.description && (
                                <div className="text-xs text-slate-700 space-y-1 pl-1">
                                  {proj.description.split("\n").map((line, lIdx) => (
                                    <p key={lIdx} className="leading-relaxed">
                                      {line}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Education */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-extrabold text-slate-900 tracking-wider uppercase border-b border-slate-300 pb-0.5 font-sans">
                        Education & Qualifications
                      </h4>
                      <div className="space-y-2.5 border-t border-transparent">
                        {resumeData.education.map((edu, index) => (
                          <div key={index} className="flex justify-between items-start text-xs">
                            <div>
                              <p className="font-bold text-slate-900">{edu.degree || "Degree"}</p>
                              <p className="text-[11px] text-slate-500 italic mt-0.5">{edu.school || "University"}</p>
                              {edu.details && <p className="text-[10px] text-slate-400 mt-0.5">{edu.details}</p>}
                            </div>
                            <span className="text-[10px] text-slate-500 font-bold font-sans">{edu.year || "Year"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};
export default ResumeBuilder;
