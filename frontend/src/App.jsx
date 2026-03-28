import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Github, LineChart, ChevronRight, ArrowRight, MessageSquare, X, Paperclip, User, Copy, Check, Maximize2, Minimize2, Image as ImageIcon, Mic } from 'lucide-react';
import Dashboard from './Dashboard';

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
  const fileInputRef = useRef(null);

  // Voice recording states
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const baseQueryRef = useRef('');

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
      const response = await fetch('http://localhost:8080/api/user/me', {
        headers: {
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setIsLoggedIn(true);
        setUsername(data.name);
        localStorage.setItem("username", data.name);
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
    
    // Set preview info if a file is attached
    if (selectedFile) {
      const isImg = selectedFile.type.startsWith('image/');
      setPreviewInfo({
        url: isImg ? URL.createObjectURL(selectedFile) : null,
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
        
        response = await fetch('http://localhost:8080/api/research/process-image', {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch('http://localhost:8080/api/research/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
        const response = await fetch('http://localhost:8080/api/auth/signup', {
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
          // Save the name into local storage so Dashboard can display it
          localStorage.setItem("username", fullName);
          
          // Proceed to onboarding
          setModalState('onboarding-role');
        } else {
          setError(data.message || 'Signup failed');
        }
      } catch (err) {
        setError('Network error: Could not connect to the server');
      }
    } else if (modalState === 'login') {
      try {
        const response = await fetch('http://localhost:8080/api/auth/login', {
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
          // The backend returns: "Login successful! Welcome [Name]"
          // So we can extract the name directly from the success message
          const extractedName = data.message.replace("Login successful! Welcome ", "");
          localStorage.setItem("username", extractedName);

          // Stay on landing page for returning users
          setIsLoggedIn(true);
          setUsername(extractedName);
          setModalState(null);
        } else {
          setError(data.message || 'Login failed');
        }
      } catch (err) {
        setError('Network error: Could not connect to the server');
      }
    }
  };

  const handleOAuthLogin = (provider) => {
    // Redirect to Spring Boot OAuth2 authorization endpoint
    window.location.href = `http://localhost:8080/oauth2/authorization/${provider}`;
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

  if (currentView === 'dashboard') {
    return <Dashboard userRole={userRole} onLogout={handleLogout} onNewChat={handleNewChat} onEditProfile={() => setCurrentView('edit-profile')} />;
  }

  return (
    <>
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
          <div className="user-profile-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#e2e8f0', borderRadius: '24px', cursor: 'pointer' }} onClick={() => setCurrentView('edit-profile')}>
            <div style={{ backgroundColor: '#cbd5e1', borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={16} color="#475569" />
            </div>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#334155' }}>{username}</span>
          </div>
        ) : (
          <button className="button-primary" onClick={() => setModalState('signup')}>Get Started</button>
        )}
      </nav>

      {/* Floating Dashboard Button (Bottom Left) */}
      {isLoggedIn && (
        <button 
          className="button-primary" 
          onClick={() => setCurrentView('dashboard')}
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderRadius: '24px',
            padding: '12px 20px'
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
      )}

      <main>
        <section className="hero container">
          <div className="hero-content">
            <h1>AI-Powered<br />Research Assistant</h1>
            <p className="hero-subtext">Analyze documents, summarize research, and explore GitHub repositories with AI.</p>

            <div className="chat-interface">
              <form onSubmit={handleSearch} className="chat-input-wrapper" style={{ display: 'flex', flexDirection: 'column' }}>
                {selectedFile && (
                  <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f1f5f9', borderRadius: '8px 8px 0 0', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '14px' }}>
                    <ImageIcon size={16} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</span>
                    <button type="button" onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} title="Remove image">
                      <X size={16} />
                    </button>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <input
                    type="text"
                    className="chat-input"
                    style={{ borderTopLeftRadius: selectedFile ? 0 : '24px' }}
                    placeholder="Ask anything about research, papers, or GitHub projects..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                  <button type="button" className="chat-upload-btn" title="Upload Photo" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip size={20} />
                  </button>
                  <button 
                    type="button" 
                    className="chat-upload-btn" 
                    title={isListening ? "Stop listening" : "Start Voice Input"} 
                    onClick={toggleListening}
                    style={{ color: isListening ? '#ef4444' : 'inherit' }}
                  >
                    <Mic size={20} />
                  </button>
                  <button type="submit" className="chat-submit-btn">
                    <ArrowRight size={20} />
                  </button>
                </div>
              </form>

              <div className="example-prompts">
                <button className="prompt-pill" onClick={() => handlePromptClick("Summarize this research paper")}>
                  <MessageSquare size={14} /> Summarize this research paper
                </button>
                <button className="prompt-pill" onClick={() => handlePromptClick("Explain reinforcement learning")}>
                  <MessageSquare size={14} /> Explain reinforcement learning
                </button>
                <button className="prompt-pill" onClick={() => handlePromptClick("Analyze this GitHub repository")}>
                  <MessageSquare size={14} /> Analyze this GitHub repository
                </button>
              </div>
            </div>
          </div>

          {/* Right Side Area */}
          {(isLoading || chatResponse) ? (
            <>
            {isMaximized && (
              <div 
                className="maximize-backdrop" 
                onClick={() => setIsMaximized(false)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: '#ffffff',
                  zIndex: 999
                }} 
              />
            )}
            <div className={`hero-response-container ${isMaximized ? 'maximized' : ''}`} style={isMaximized ? {
              position: 'fixed',
              top: '80px', // Below navbar
              left: '24px',
              right: '24px',
              bottom: '24px',
              zIndex: 1000,
              backgroundColor: '#1e293b',
              borderRadius: '16px',
              padding: '0',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              color: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            } : { 
              flex: 1, 
              backgroundColor: '#1e293b', 
              borderRadius: '16px', 
              padding: '0', 
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)', 
              color: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '600px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Header Box with Copy and Maximize Buttons */}
              {chatResponse && !isLoading && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #334155', backgroundColor: '#0f172a' }}>
                  <button 
                    onClick={handleCopy}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: isCopied ? '#22c55e' : '#94a3b8', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      fontSize: '14px'
                    }}
                    title="Copy to clipboard"
                  >
                    {isCopied ? <Check size={16} /> : <Copy size={16} />} 
                    {isCopied ? 'Copied' : 'Copy'}
                  </button>
                  <button 
                    onClick={() => setIsMaximized(!isMaximized)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#94a3b8', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      borderRadius: '4px'
                    }}
                    title={isMaximized ? "Restore down" : "Maximize"}
                  >
                    {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                </div>
              )}

              {/* Scrollable Response Box */}
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1, lineHeight: '1.7', fontSize: '15px' }}>
                {isLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#94a3b8', height: '100%' }}>
                    <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid #334155', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <style>
                      {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
                    </style>
                    <span>InsightAI is thinking...</span>
                  </div>
                ) : (
                  <div className="chat-response-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {previewInfo && (
                      <div style={{ padding: '12px', backgroundColor: '#334155', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', width: 'fit-content', border: '1px solid #475569' }}>
                        {previewInfo.isImage && previewInfo.url ? (
                          <img src={previewInfo.url} alt={previewInfo.name} style={{ width: 'auto', height: '60px', borderRadius: '4px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '40px', height: '40px', backgroundColor: '#ef4444', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <FileText size={20} />
                          </div>
                        )}
                        <span style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: '500' }}>{previewInfo.name}</span>
                      </div>
                    )}
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {chatResponse}
                    </div>
                  </div>
                )}
              </div>
            </div>
            </>
          ) : (
            <div className="hero-image-container">
              <img src="/hero-robot.png" alt="AI Robot Assistant" className="hero-image" />
            </div>
          )}
        </section>

        <section id="about" className="about-section container" style={{ display: chatResponse ? 'none' : 'block' }}>
          <div className="about-content">
            <h2>Research Smarter, Not Harder</h2>
            <p>
              InsightAI is the ultimate companion for students, researchers, and developers.
              By leveraging cutting-edge LLMs, we transform the way you digest complex information.
              Whether you are diving into a 50-page academic paper or exploring a deeply nested
              open-source codebase, InsightAI surfaces the structural insights you need instantly.
            </p>
          </div>
        </section>

        <section id="features" className="features container">
          <div className="features-header">
            <h2>Supercharge Your Research Workflow</h2>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Search size={24} />
              </div>
              <h3>Text Research</h3>
              <p>Search and extract structural insights and information from articles and scientific papers instantly.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <FileText size={24} />
              </div>
              <h3>Document Analysis</h3>
              <p>Upload PDFs and generate summaries, highlight key points, and synthesize data effortlessly.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Github size={24} />
              </div>
              <h3>GitHub Repo Overview</h3>
              <p>Understand complex projects, tech stacks, and source code quickly over diverse repositories.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <LineChart size={24} />
              </div>
              <h3>Research Insights</h3>
              <p>Generate data insights, trends, and visualizations to spot patterns in your research.</p>
            </div>
          </div>
        </section>

        <section className="cta-section container">
          <h2>Start researching smarter with AI</h2>
          {isLoggedIn ? (
            <button className="button-primary" onClick={() => setCurrentView('dashboard')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Go to Dashboard <ChevronRight size={16} />
            </button>
          ) : (
            <button className="button-primary" onClick={() => setModalState('signup')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Get Started <ChevronRight size={16} />
            </button>
          )}
        </section>
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

      <footer className="footer">
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
        <div className="container footer-bottom">
          <p>© 2026 InsightAI. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="#"><Github size={20} /></a>
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
