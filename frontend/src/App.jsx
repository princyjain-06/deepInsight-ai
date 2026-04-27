import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Github, LineChart, ChevronRight, ArrowRight, MessageSquare, X, Paperclip, User, Copy, Check, Maximize2, Minimize2, Image as ImageIcon, Mic, Plus } from 'lucide-react';
import Dashboard from './Dashboard';
import BotChat from './components/ui/BotChat';
import ScrollGlobe from './components/ui/landing-page';
import HoverBorderGradient from './components/ui/hover-border-gradient';
import NotesWorkspace from './NotesWorkspace';

function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [query, setQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewInfo, setPreviewInfo] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const fileInputRef = useRef(null);

  // Voice recording states
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const baseQueryRef = useRef('');

  // FAB Scroll State
  const [showNotesFab, setShowNotesFab] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current + 10) {
        setShowNotesFab(false);
      } else if (currentScrollY < lastScrollY.current - 10) {
        setShowNotesFab(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const storedName = localStorage.getItem("username");
    if (storedName) {
      setIsLoggedIn(true);
      setUsername(storedName);
    }
  }, []);

  useEffect(() => {
    if (isMaximized) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMaximized]);

  // Handle Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setQuery(baseQueryRef.current + (baseQueryRef.current && transcript ? ' ' : '') + transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      baseQueryRef.current = query;
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Speech recognition error:', err);
      }
    }
  };

  // Handle OAuth Success Redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('loginSuccess') === 'true') {
      fetchUserInfo();
    }
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/user/me', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setIsLoggedIn(true);
        setUsername(data.name);
        localStorage.setItem("username", data.name);
        // Also persist email so notes API can scope requests
        if (data.email) localStorage.setItem("email", data.email);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        setModalState('onboarding-role');
      }
    } catch (err) {
      console.error("Failed to fetch user info", err);
    }
  };

  // Modal states: null | 'login' | 'signup' | 'onboarding-role' | 'onboarding-use'
  const [modalState, setModalState] = useState(null);

  // Auth Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Onboarding State
  const [userRole, setUserRole] = useState(null); // 'Student' or 'Developer'

  const fetchChatResponse = async (text) => {
    if ((!text.trim() && !selectedFile) || !isLoggedIn) return;
    
    setIsLoading(true);
    setChatResponse('');
    
    const userEmail = localStorage.getItem('email') || '';

    // Set preview info if a file is attached
    if (selectedFile) {
      const isImg = selectedFile.type.startsWith('image/');
      setPreviewInfo({
        url: URL.createObjectURL(selectedFile),
        name: selectedFile.name,
        type: selectedFile.type,
        isImage: isImg
      });
    } else {
      setPreviewInfo(null);
    }
    
    try {
      let response;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("image", selectedFile);
        formData.append("operation", text.trim() ? "chat" : "Summarize");
        
        response = await fetch('http://localhost:8081/api/research/process-image', {
          method: 'POST',
          headers: { 'X-User-Email': userEmail },
          body: formData,
        });
      } else {
        response = await fetch('http://localhost:8081/api/research/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Email': userEmail,
          },
          body: JSON.stringify({
            content: text,
            operation: 'chat'
          }),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }

      const data = await response.text();
      setChatResponse(data);
    } catch (err) {
      console.error(err);
      setChatResponse("Error: Could not retrieve response from AI. Please try again later.");
    } finally {
      setIsLoading(false);
      setSelectedFile(null); // Clear file after sending
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if ((query.trim() || selectedFile) && !isLoggedIn) {
      setModalState('signup'); // Default to signup on first interaction
    } else if ((query.trim() || selectedFile) && isLoggedIn) {
      fetchChatResponse(query);
    }
  };

  const handlePromptClick = (text) => {
    setQuery(text);
    if (!isLoggedIn) {
      setModalState('signup');
    } else {
      fetchChatResponse(text);
    }
  };

  const handleCopy = () => {
    if (chatResponse) {
      navigator.clipboard.writeText(chatResponse);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const [error, setError] = useState('');

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (modalState === 'signup') {
      try {
        const response = await fetch('http://localhost:8081/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: fullName,
            email: email,
            password: password,
            role: 'Student' // Default to Student, or could add dropdown to form
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Save the name AND email into local storage
          localStorage.setItem("username", fullName);
          localStorage.setItem("email", email);
          
          // Proceed to onboarding
          setModalState('onboarding-role');
        } else {
          setError(data.message || 'Signup failed');
        }
      } catch {
        setError('Network error: Could not connect to the server');
      }
    } else if (modalState === 'login') {
      try {
        const response = await fetch('http://localhost:8081/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            password: password
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Backend now returns { success, message, name, email }
          const extractedName = data.name || data.message.replace("Login successful! Welcome ", "");
          localStorage.setItem("username", extractedName);
          localStorage.setItem("email", data.email || email); // always persist email

          // Stay on landing page for returning users
          setIsLoggedIn(true);
          setUsername(extractedName);
          setModalState(null);
        } else {
          setError(data.message || 'Login failed');
        }
      } catch {
        setError('Network error: Could not connect to the server');
      }
    }
  };

  const handleOAuthLogin = (provider) => {
    // Redirect to Spring Boot OAuth2 authorization endpoint
    window.location.href = `http://localhost:8081/oauth2/authorization/${provider}`;
  };

  const handleRoleSelection = (role) => {
    setUserRole(role);
    setModalState('onboarding-use');
  };

  const handleUseSelection = (use) => {
    // End of onboarding
    console.log("Onboarding complete", { role: userRole, use: use });
    setModalState(null);
    setQuery(''); // Clear query or proceed to app
    setIsLoggedIn(true);
    setUsername(localStorage.getItem("username") || "");
  };

  const closeModal = () => {
    setModalState(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("email");  // clear so next user gets clean state
    setIsLoggedIn(false);
    setUsername("");
    setChatResponse("");
    setIsMaximized(false);
    setCurrentView('landing');
  };

  const handleNewChat = () => {
    setChatResponse("");
    setQuery("");
    setPreviewInfo(null);
    setIsMaximized(false);
    setCurrentView('landing');
  }

  const handleStartResearch = () => {
    if (isLoggedIn) {
      setCurrentView('dashboard');
    } else {
      setModalState('signup');
    }
  };

  if (currentView === 'notes-workspace') {
    return <NotesWorkspace onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'dashboard') {
    return <Dashboard 
      userRole={userRole} 
      onLogout={handleLogout} 
      onNewChat={handleNewChat} 
      onEditProfile={() => setCurrentView('edit-profile')}
      onOpenNotes={() => setCurrentView('notes-workspace')}
      onFileUpload={(file) => {
        setSelectedFile(file);
        setCurrentView('landing');
      }}
    />;
  }

  return (
    <>
      <div className="page-background" />
      <nav className="navbar container" style={{ position: 'relative', zIndex: 1001 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div className="nav-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          InsightAI
        </div>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#documentation">Documentation</a>
          <a href="#github">GitHub</a>
        </div>
        {isLoggedIn ? (
          <div style={{ position: 'relative' }}>
            <div 
              className="user-profile-btn" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#e2e8f0', borderRadius: '24px', cursor: 'pointer' }} 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              <div style={{ backgroundColor: '#cbd5e1', borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={16} color="#475569" />
              </div>
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#334155' }}>{username}</span>
            </div>
            
            {showProfileDropdown && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '8px', width: '200px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)', zIndex: 1002, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button 
                  onClick={() => { setShowProfileDropdown(false); setCurrentView('edit-profile'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', width: '100%', textAlign: 'left', fontSize: '13px', color: '#cbd5e1', borderRadius: '6px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#1e293b'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  Edit Profile
                </button>
                <div style={{ height: '1px', backgroundColor: '#1e293b', margin: '4px 0' }} />
                <button 
                  onClick={() => { setShowProfileDropdown(false); handleLogout(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', width: '100%', textAlign: 'left', fontSize: '13px', color: '#ef4444', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: 'none', cursor: 'pointer', fontWeight: '500' }}
                  onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="button-primary" onClick={() => setModalState('signup')}>Get Started</button>
        )}
      </nav>

      {/* Perfectly Aligned Floating Action Buttons */}
      {isLoggedIn && (
        <div className={`fixed bottom-6 left-0 right-0 px-6 z-[100] pointer-events-none flex justify-between items-center transition-all duration-300 ${showNotesFab ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
          <button 
            className="button-primary pointer-events-auto" 
            onClick={() => setCurrentView('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              borderRadius: '24px',
              padding: '12px 20px',
              height: 'fit-content'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            Dashboard
          </button>

          <button
            onClick={() => setCurrentView('notes-workspace')}
            className={`pointer-events-auto flex flex-shrink-0 items-center justify-center rounded-[50%] transition-transform duration-300 shadow-2xl hover:scale-105 active:scale-95`}
            style={{
              width: '56px',
              height: '56px',
              backgroundColor: '#303247',
              color: '#ced3f5',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
            title="Open Notes Workspace"
          >
            <Plus size={28} strokeWidth={2} />
          </button>
        </div>
      )}

      <main>
        <ScrollGlobe 
          sections={[
            {
              id: "hero",
              badge: "InsightAI",
              title: "Research Smarter.",
              subtitle: "Discover Faster.",
              description: "",
              hideTitle: !!(isLoading || chatResponse),
              align: "left",
              customNode: (
                <div className={`flex flex-col gap-6 w-full transition-transform duration-700 ease-out ${(isLoading || chatResponse) ? '-translate-y-24 md:-translate-y-32' : ''}`}>
                  {(isLoading || chatResponse) && (
                    <div className="w-full max-w-3xl mb-3 animate-in fade-in zoom-in-95 duration-500">
                      <HoverBorderGradient
                        as="div"
                        containerClassName="w-full h-[55vh] max-h-[600px] !rounded-3xl shadow-[0_0_80px_-15px_rgba(168,85,247,0.3)] pointer-events-auto"
                        className="w-full h-full bg-[#06060c]/90 flex flex-col overflow-hidden !rounded-[inherit] !p-0 text-left backdrop-blur-2xl"
                        duration={2}
                      >
                        {chatResponse && !isLoading && (
                          <div className="flex justify-between items-center px-5 py-4 border-b border-white/10 bg-black/60">
                            <button onClick={handleCopy} className={`flex items-center gap-2 text-sm transition-colors ${isCopied ? 'text-green-500' : 'text-neutral-400 hover:text-white'}`} title="Copy to clipboard">
                              {isCopied ? <Check size={16} /> : <Copy size={16} />} {isCopied ? 'Copied' : 'Copy'}
                            </button>
                            <div className="flex gap-2.5">
                              <button onClick={() => { setChatResponse(''); setSelectedFile(null); }} className="text-red-500 hover:text-red-400 p-1" title="Close response">
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                        <div className="p-6 md:p-8 overflow-y-auto flex-1 leading-relaxed text-[15px] custom-scrollbar">
                          {isLoading ? (
                            <div className="flex items-center justify-center gap-3 text-neutral-400 h-32">
                              <div className="w-5 h-5 rounded-full border-2 border-neutral-700 border-t-purple-500 animate-spin" />
                              <span>InsightAI is analyzing...</span>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-5 text-neutral-200">
                              {previewInfo && (
                                <a href={previewInfo.url} target="_blank" rel="noopener noreferrer" className="p-3 bg-neutral-900/50 border border-purple-500/20 rounded-xl flex items-center gap-3 w-fit hover:bg-neutral-800 transition-colors cursor-pointer group">
                                  {previewInfo.isImage && previewInfo.url ? (
                                    <img src={previewInfo.url} alt={previewInfo.name} className="h-10 rounded object-cover" />
                                  ) : (
                                    <div className="w-10 h-10 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center shadow-inner group-hover:bg-purple-500/30 transition-colors">
                                      <FileText size={20} />
                                    </div>
                                  )}
                                  <span className="text-sm font-medium text-white group-hover:underline">{previewInfo.name}</span>
                                </a>
                              )}
                              <div className="whitespace-pre-wrap">{chatResponse}</div>
                            </div>
                          )}
                        </div>
                      </HoverBorderGradient>
                    </div>
                  )}

                  <BotChat 
                    query={query} 
                    setQuery={setQuery} 
                    isListening={isListening} 
                    toggleListening={toggleListening} 
                    handleSearch={handleSearch} 
                    selectedFile={selectedFile} 
                    setSelectedFile={setSelectedFile} 
                    fileInputRef={fileInputRef} 
                    baseQueryRef={baseQueryRef}
                  />
                </div>
              )
            },
            {
              id: "github",
              badge: "Repositories",
              title: "Analyze GitHub",
              subtitle: "Code Repositories",
              description: "Understand massive codebases in seconds. InsightAI automatically processes repository structures, maps out dependencies, and distills architectural decisions so you never get lost in undocumented legacy code again.",
              align: "right",
              features: [
                { title: "Dependency Mapping", description: "Instantly visualize inter-code relationships." },
                { title: "Architecture Summaries", description: "Receive high-level breakdowns of repos." }
              ]
            },
            {
              id: "documents",
              badge: "Documents",
              title: "Synthesize Papers",
              description: "Upload heavy research documents, scholarly articles, and lengthy PDFs. Our AI extracts core findings, aggregates reference materials, and distills the noise into directly actionable conclusions.",
              align: "left",
              features: [
                { title: "Rapid Extraction", description: "Pull out statistical data and main arguments perfectly." },
                { title: "Cross-Context Integration", description: "Tie insights from documents directly into your ongoing chat." }
              ]
            },
            {
              id: "future",
              badge: "Velocity",
              title: "Generate Insights",
              subtitle: "Instantly",
              description: "Stop wasting hours manually tracing literature reviews and undocumented algorithms. Accelerate your scientific or engineering flow by trusting InsightAI as your direct analytical partner.",
              align: "center",
              features: [
                { title: "Absolute Context", description: "Memory retention across queries." },
                { title: "Voice Supported", description: "Dictate queries natively to keep your hands on the keyboard." }
              ]
            }
          ]}
        />


      </main>

      {currentView === 'edit-profile' && (
        <div className="modal-overlay" onClick={() => setCurrentView('landing')}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setCurrentView('landing')}>
              <X size={20} />
            </button>
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <p>Update your personal information.</p>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => {
                e.preventDefault();
                localStorage.setItem("username", username);
                setCurrentView('landing');
              }} className="auth-form">
                <div className="form-group">
                  <label>Display Name</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <button type="submit" className="button-primary auth-submit-btn">Save Changes</button>
              </form>
            </div>
          </div>
        </div>
      )}

      <footer className="w-full flex justify-center pt-12 bg-transparent">
        <div className="relative w-full overflow-hidden border-t border-purple-500/20 bg-[#06060c] px-4 py-12 md:px-8 lg:px-16 shadow-[0_0_50px_-12px_rgba(168,85,247,0.15)]">
          {/* Internal Radial Purple Glow imitating the mockup */}
          <div className="absolute inset-x-0 bottom-0 top-1/2 -translate-y-1/2 z-0 flex justify-center pointer-events-none">
            <div className="w-full max-w-[1000px] h-[600px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/30 via-purple-900/10 to-transparent blur-[80px] rounded-full" />
          </div>

          <div className="relative z-10">
            <div className="container footer-grid">
              <div className="footer-brand">
                <h3 style={{ color: 'white' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  InsightAI
                </h3>
                <p>Your AI-powered research assistant to revolutionize document analysis and GitHub exploration.</p>
              </div>
              <div className="footer-column">
                <h4 style={{ color: 'white' }}>Product</h4>
                <ul>
                  <li><a href="#features">Features</a></li>
                  <li><a href="#">Pricing</a></li>
                  <li><a href="#documentation">Documentation</a></li>
                  <li><a href="#">API</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4 style={{ color: 'white' }}>Resources</h4>
                <ul>
                  <li><a href="#github">GitHub</a></li>
                  <li><a href="#">Blog</a></li>
                  <li><a href="#">Community</a></li>
                  <li><a href="#">Support</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4 style={{ color: 'white' }}>Company</h4>
                <ul>
                  <li><a href="#">About Us</a></li>
                  <li><a href="#">Careers</a></li>
                  <li><a href="#">Privacy</a></li>
                  <li><a href="#">Terms</a></li>
                </ul>
              </div>
            </div>
            
            <div className="container footer-bottom" style={{ borderTop: '1px solid rgba(168, 85, 247, 0.2)', marginTop: '2rem', paddingTop: '2rem' }}>
              <p>© 2026 InsightAI. All rights reserved.</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <a href="#"><Github size={20} /></a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth and Onboarding Modals */}
      {modalState && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <X size={20} />
            </button>

            {/* SIGNUP MODAL */}
            {modalState === 'signup' && (
              <>
                <div className="modal-header">
                  <h3>Create your account</h3>
                  <p>Join InsightAI to supercharge your research.</p>
                </div>
                {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem', padding: '0 2rem' }}>{error}</div>}
                <div className="modal-body">
                  <form onSubmit={handleAuthSubmit} className="auth-form">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="button-primary auth-submit-btn">Sign Up</button>
                  </form>

                  <div className="auth-divider">
                    <span>or</span>
                  </div>

                  <div className="oauth-buttons">
                    <button className="auth-btn google-btn" onClick={() => handleOAuthLogin('google')}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 14.536A8.966 8.966 0 013 10C3 5.029 7.029 1 12 1c2.14 0 4.106.75 5.65 1.996l-3.235 3.124A4.305 4.305 0 0012 5.517v.001C9.697 5.518 7.818 7.378 7.818 9.68c0 .878.271 1.693.738 2.37l-4.556 2.486z" />
                        <path d="M21 10h-9v4.5h5.182a4.576 4.576 0 01-1.996 3.003l3.235 3.125A8.98 8.98 0 0021 10z" />
                        <path d="M12 21c-2.14 0-4.106-.75-5.65-1.996l3.235-3.124a4.305 4.305 0 002.415.602v-.001c2.302 0 4.181-1.861 4.181-4.162 0-.879-.271-1.694-.738-2.371l4.556-2.486A8.966 8.966 0 0121 12c0 4.971-4.029 9-9 9z" />
                      </svg>
                      Continue with Google
                    </button>
                    <button className="auth-btn github-btn" onClick={() => handleOAuthLogin('github')}>
                      <Github size={20} />
                      Continue with GitHub
                    </button>
                  </div>

                  <p className="auth-switchText">
                    Already have an account? <button className="text-btn" onClick={() => setModalState('login')}>Log in</button>
                  </p>
                </div>
              </>
            )}

            {/* LOGIN MODAL */}
            {modalState === 'login' && (
              <>
                <div className="modal-header">
                  <h3>Welcome back</h3>
                  <p>Log in to continue your research.</p>
                </div>
                {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem', padding: '0 2rem' }}>{error}</div>}
                <div className="modal-body">
                  <form onSubmit={handleAuthSubmit} className="auth-form">
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="button-primary auth-submit-btn">Log In</button>
                  </form>

                  <div className="auth-divider">
                    <span>or</span>
                  </div>

                  <div className="oauth-buttons">
                    <button className="auth-btn google-btn" onClick={handleOAuthLogin}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 14.536A8.966 8.966 0 013 10C3 5.029 7.029 1 12 1c2.14 0 4.106.75 5.65 1.996l-3.235 3.124A4.305 4.305 0 0012 5.517v.001C9.697 5.518 7.818 7.378 7.818 9.68c0 .878.271 1.693.738 2.37l-4.556 2.486z" />
                        <path d="M21 10h-9v4.5h5.182a4.576 4.576 0 01-1.996 3.003l3.235 3.125A8.98 8.98 0 0021 10z" />
                        <path d="M12 21c-2.14 0-4.106-.75-5.65-1.996l3.235-3.124a4.305 4.305 0 002.415.602v-.001c2.302 0 4.181-1.861 4.181-4.162 0-.879-.271-1.694-.738-2.371l4.556-2.486A8.966 8.966 0 0121 12c0 4.971-4.029 9-9 9z" />
                      </svg>
                      Continue with Google
                    </button>
                    <button className="auth-btn github-btn" onClick={() => handleOAuthLogin('github')}>
                      <Github size={20} />
                      Continue with GitHub
                    </button>
                  </div>

                  <p className="auth-switchText">
                    Don't have an account? <button className="text-btn" onClick={() => setModalState('signup')}>Sign up</button>
                  </p>
                </div>
              </>
            )}

            {/* ONBOARDING QUESTION 1 */}
            {modalState === 'onboarding-role' && (
              <>
                <div className="modal-header">
                  <h3>Welcome to InsightAI 👋</h3>
                  <p>How do you plan to use our platform?</p>
                </div>
                <div className="modal-body onboarding-options">
                  <button className="onboarding-card" onClick={() => handleRoleSelection('Student')}>
                    <div className="onboarding-card-icon">📚</div>
                    <div className="onboarding-card-text">
                      <h4>I'm a Student / Academic</h4>
                      <p>Research, studies, and learning</p>
                    </div>
                  </button>
                  <button className="onboarding-card" onClick={() => handleRoleSelection('Developer')}>
                    <div className="onboarding-card-icon">💻</div>
                    <div className="onboarding-card-text">
                      <h4>I'm a Developer</h4>
                      <p>Code, APIs, and GitHub repos</p>
                    </div>
                  </button>
                </div>
              </>
            )}

            {/* ONBOARDING QUESTION 2 */}
            {modalState === 'onboarding-use' && (
              <>
                <div className="modal-header">
                  <h3>Almost there!</h3>
                  <p>What will you primarily use InsightAI for?</p>
                </div>
                <div className="modal-body user-type-options">
                  {userRole === 'Student' ? (
                    <>
                      <button className="option-btn" onClick={() => handleUseSelection('Research papers')}>Research papers</button>
                      <button className="option-btn" onClick={() => handleUseSelection('Assignments')}>Assignments</button>
                      <button className="option-btn" onClick={() => handleUseSelection('Learning concepts')}>Learning concepts</button>
                      <button className="option-btn" onClick={() => handleUseSelection('Academic projects')}>Academic projects</button>
                    </>
                  ) : (
                    <>
                      <button className="option-btn" onClick={() => handleUseSelection('Understanding GitHub repositories')}>Understanding GitHub repositories</button>
                      <button className="option-btn" onClick={() => handleUseSelection('Technical research')}>Technical research</button>
                      <button className="option-btn" onClick={() => handleUseSelection('Exploring new technologies')}>Exploring new technologies</button>
                      <button className="option-btn" onClick={() => handleUseSelection('Reading documentation')}>Reading documentation</button>
                    </>
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
}

export default App;
