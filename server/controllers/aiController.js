import { GoogleGenerativeAI } from "@google/generative-ai";
// Initialize Gemini API
const getGeminiModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not configured. AI Resume Builder is running in Mock Mode.");
    return null;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
};
// 1. Generate Summary
export const aiGenerateSummary = async (req, res) => {
  const { title, skills, experienceSummary } = req.body;
  if (!title && !skills) {
    return res.json({ success: false, message: "Please provide job title or skills" });
  }
  const model = getGeminiModel();
  if (!model) {
    // Mock Response
    const mockSummary = `Dedicated and results-driven ${title || "Professional"} with expertise in ${skills || "relevant technologies"}. Experienced in developing efficient solutions, collaborating in agile environments, and translating project requirements into high-performance web applications. Proven track record of delivering clean, scalable code and enhancing user experiences.`;
    return res.json({ success: true, summary: mockSummary, isMock: true });
  }
  try {
    const prompt = `Act as an expert resume writer. Write a concise, professional 3-4 sentence professional summary/objective for a resume.
    Job Title: ${title || "Not Specified"}
    Key Skills: ${skills || "Not Specified"}
    Brief experience details or career context: ${experienceSummary || "Not Specified"}
    
    Make it highly engaging, highlighting key strengths and professional value proposition. Do not use generic filler words. Return only the generated summary text.`;
    const result = await model.generateContent(prompt);
    const summary = result.response.text().trim();
    res.json({ success: true, summary });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
// 2. Enhance Bullet Point
export const aiEnhanceBulletPoint = async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.json({ success: false, message: "Please provide some text to enhance" });
  }
  const model = getGeminiModel();
  if (!model) {
    // Mock Response
    const mockEnhancement = `- Designed and implemented clean, responsive user interfaces using modern web technologies, boosting customer engagement by 20%.\n- Collaborated with cross-functional teams to define requirements, design features, and deliver stable software deployments.\n- Optimized database structure and API endpoints, improving server response times by 30%.`;
    return res.json({ success: true, enhancedText: mockEnhancement, isMock: true });
  }
  try {
    const prompt = `Act as an expert resume writer. Enhance the following description of a job or project to make it sound professional, accomplishment-focused, and impactful.
    Rewrite it into 2-4 professional bullet points. Use the STAR method (Situation, Task, Action, Result) implicitly.
    Ensure each bullet point starts with a strong action verb (e.g. Developed, Orchestrated, Optimized, Designed) and includes measurable impact where possible.
    Do NOT use markdown formatting (like bolding or italics) in the bullets.
    
    Raw description to enhance:
    "${text}"`;
    const result = await model.generateContent(prompt);
    const enhancedText = result.response.text().trim();
    res.json({ success: true, enhancedText });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
// 3. Generate Full Resume from Prompt
export const aiGenerateFullResume = async (req, res) => {
  const { promptText } = req.body;
  if (!promptText) {
    return res.json({ success: false, message: "Please provide a description or prompt for the resume" });
  }
  const model = getGeminiModel();
  if (!model) {
    // Mock Response based on generic prompt
    const isBackend = /back/i.test(promptText) || /node/i.test(promptText) || /python/i.test(promptText);
    const isFrontend = /front/i.test(promptText) || /react/i.test(promptText) || /ui/i.test(promptText);
    
    let mockResume = {
      personalInfo: {
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "+1 (555) 019-2834",
        location: "San Francisco, CA",
        portfolio: "https://johndoe.dev",
        linkedin: "https://linkedin.com/in/johndoe",
        github: "https://github.com/johndoe"
      },
      summary: "",
      skills: [],
      experience: [],
      education: [
        {
          degree: "Bachelor of Science in Computer Science",
          school: "State University",
          year: "2022",
          details: "GPA: 3.8/4.0. Core coursework: Data Structures, Web Development."
        }
      ],
      projects: []
    };
    if (isBackend) {
      mockResume.summary = "Passionate Node.js Backend Engineer with 2+ years of experience building secure, scalable microservices and APIs. Highly skilled in MongoDB, Express, AWS, and database optimization. Dedicated to writing clean, maintainable code and improving application performance.";
      mockResume.skills = ["Node.js", "Express.js", "MongoDB", "Mongoose", "REST APIs", "AWS", "Docker", "Git"];
      mockResume.experience = [
        {
          title: "Backend Developer",
          company: "DataSync Systems",
          location: "San Francisco, CA",
          startDate: "June 2023",
          endDate: "Present",
          description: "- Engineered scalable microservices using Express.js and MongoDB, handling 100k+ daily API requests.\n- Optimized MongoDB database queries, reducing API latency by 35% and saving server costs.\n- Implemented secure JWT authentication and role-based access control across all APIs."
        }
      ];
      mockResume.projects = [
        {
          title: "Real-time Chat Engine",
          technologies: "Node.js, Socket.io, Redis, MongoDB",
          link: "https://github.com/johndoe/chat-engine",
          description: "- Developed a real-time messaging server supporting concurrent room channels and typing indicators.\n- Integrated Redis for horizontal scaling and message caching, ensuring sub-100ms message delivery."
        }
      ];
    } else {
      // Default to Frontend / Fullstack
      mockResume.summary = "Enthusiastic React Frontend Developer with experience building highly interactive, responsive web applications. Expert in Javascript, modern CSS frameworks (TailwindCSS), state management (Redux/Context), and API integration. Focused on pixel-perfect details and intuitive user experiences.";
      mockResume.skills = ["React.js", "JavaScript (ES6+)", "TailwindCSS", "HTML5/CSS3", "Vite", "REST APIs", "Git", "Redux Toolkit"];
      mockResume.experience = [
        {
          title: "Frontend React Developer",
          company: "PixelCraft Solutions",
          location: "Remote",
          startDate: "May 2022",
          endDate: "Present",
          description: "- Designed and developed 15+ highly responsive user interfaces using React.js and Tailwind CSS.\n- Integrated RESTful APIs and optimized state management, increasing app speed and responsiveness.\n- Implemented interactive dashboards and visual charts, improving client user retention by 15%."
        }
      ];
      mockResume.projects = [
        {
          title: "E-Commerce Frontend Showcase",
          technologies: "React, Context API, TailwindCSS, Axios",
          link: "https://github.com/johndoe/shop-ui",
          description: "- Developed a responsive storefront with dynamic product sorting, cart management, and checkout wizard.\n- Styled using glassmorphism components and Tailwind animations, achieving a 98% Google Lighthouse accessibility score."
        }
      ];
    }
    return res.json({ success: true, resume: mockResume, isMock: true });
  }
  try {
    const prompt = `Act as an expert resume builder AI. Create a complete, highly professional resume draft based on this request: "${promptText}".
    Provide realistic, detailed placeholder data. Make sure it sounds extremely professional and tailored to the request.
    
    You MUST output only a raw JSON object matching the following structure exactly. Do not include markdown code block syntax (like \`\`\`json). Just return the JSON object:
    {
      "personalInfo": {
        "name": "Full Name",
        "email": "email@example.com",
        "phone": "+1 (123) 456-7890",
        "location": "City, State",
        "portfolio": "https://portfolio.dev",
        "linkedin": "https://linkedin.com/in/username",
        "github": "https://github.com/username"
      },
      "summary": "3-4 sentence professional summary",
      "skills": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5", "Skill6"],
      "experience": [
        {
          "title": "Job Title",
          "company": "Company Name",
          "location": "Location",
          "startDate": "Month Year",
          "endDate": "Month Year or Present",
          "description": "- First bullet point describing action and impact\\n- Second bullet point describing action and impact"
        }
      ],
      "education": [
        {
          "degree": "Degree (e.g. B.S. in Computer Science)",
          "school": "University Name",
          "year": "Year of Graduation",
          "details": "GPA or honours (optional)"
        }
      ],
      "projects": [
        {
          "title": "Project Title",
          "technologies": "List of technologies used",
          "link": "https://github.com/username/project",
          "description": "- First bullet describing project\\n- Second bullet describing project"
        }
      ]
    }`;
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });
    const jsonString = result.response.text().trim();
    const resume = JSON.parse(jsonString);
    res.json({ success: true, resume });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
