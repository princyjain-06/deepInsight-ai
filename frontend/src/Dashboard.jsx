import React from 'react';
import {
  Search,
  MessageSquare,
  FileText,
  Github,
  Settings,
  LogOut,
  Plus,
  Code2,
  X,
  User,
  Trash2,
  LayoutDashboard,
  Book,
  History as HistoryIcon,
  Pin,
  Command,
  ArrowDown,
  Menu
} from 'lucide-react';
import './index.css';

const Dashboard = ({ userRole, onLogout, onNewChat, onEditProfile, onFileUpload, onOpenNotes }) => {
  const username = localStorage.getItem("username") || "Demo User";
  
  const [githubModalOpen, setGithubModalOpen] = React.useState(false);
  const [githubUrl, setGithubUrl] = React.useState('');
  const [githubSummary, setGithubSummary] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [historyItems, setHistoryItems] = React.useState([]);
  const [activeTab, setActiveTab] = React.useState('overview');
  const [selectedDocument, setSelectedDocument] = React.useState(null);
  const [dashboardSearchQuery, setDashboardSearchQuery] = React.useState('');
  const [editProfileName, setEditProfileName] = React.useState(username);
  const [editProfileEmail, setEditProfileEmail] = React.useState(localStorage.getItem('email') || '');
  const [editProfilePassword, setEditProfilePassword] = React.useState('');
  const fileInputRef = React.useRef(null);

  const filteredHistoryItems = historyItems.filter(item => 
    (item.title && item.title.toLowerCase().includes(dashboardSearchQuery.toLowerCase())) ||
    (item.type && item.type.toLowerCase().includes(dashboardSearchQuery.toLowerCase()))
  );

  const userEmail = localStorage.getItem('email') || '';

  React.useEffect(() => {
    fetchHistory();
  }, [userEmail]);

  const fetchHistory = async () => {
    try {
      const email = localStorage.getItem('email') || '';
      const res = await fetch('http://localhost:8081/api/research/history', {
        headers: { 'X-User-Email': email }
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryItems(data);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const handleDeleteHistory = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm("Are you sure you want to delete this item?")) {
      return;
    }

    try {
      const email = localStorage.getItem('email') || '';
      const res = await fetch(`http://localhost:8081/api/research/history/${id}`, {
        method: 'DELETE',
        headers: { 'X-User-Email': email }
      });
      if (res.ok) {
        setHistoryItems(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete history:', err);
    }
  };

  const handleGithubSubmit = async (e) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;
    setIsLoading(true);
    setGithubSummary('');
    setError('');

    try {
      const email = localStorage.getItem('email') || '';
      const response = await fetch('http://localhost:8081/api/research/github', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Email': email
        },
        body: JSON.stringify({ url: githubUrl })
      });
      if (!response.ok) {
        throw new Error('Failed to fetch summary');
      }
      const data = await response.text();
      setGithubSummary(data);
      // Refresh history so new GitHub entry appears
      fetchHistory();
    } catch (err) {
      console.error(err);
      setError('Could not process the GitHub repository. Please check the URL.');
    } finally {
      setIsLoading(false);
    }
  };

  // Compute stats
  const totalAnalyses = historyItems.filter(i => i.type && i.type.includes("Summary")).length;
  const totalDocs = historyItems.filter(i => i.type && (i.type.includes("Document") || i.type.includes("Image"))).length;
  const totalRepos = historyItems.filter(i => i.type && i.type.includes("GitHub")).length;

  return (
    <div className="relative min-h-screen w-full bg-[#06060c] overflow-hidden dashboard-layout">
      {/* Background radial glow */}
      <div className="absolute inset-x-0 bottom-0 top-1/2 -translate-y-1/2 z-0 flex justify-center pointer-events-none">
        <div className="w-full max-w-[1200px] h-[800px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 via-white/[0.02] to-transparent blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 flex h-full w-full">
        {/* Left Sidebar */}
        <aside className="dashboard-sidebar bg-[#06060c]/80 backdrop-blur-xl border-r border-white/5 flex flex-col" style={{ width: '260px', padding: '1.25rem 1rem' }}>
          <div className="sidebar-header" style={{ marginBottom: '1.5rem', padding: '0 0.5rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <rect x="3" y="3" width="7" height="7" rx="1"></rect>
              <rect x="14" y="3" width="7" height="7" rx="1"></rect>
              <rect x="14" y="14" width="7" height="7" rx="1"></rect>
              <rect x="3" y="14" width="7" height="7" rx="1"></rect>
            </svg>
            <span className="text-white font-semibold ml-2">InsightAI</span>
          </div>

          <button className="button-primary side-action bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md text-white transition-colors" onClick={onNewChat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem', width: '100%', padding: '0.6rem', borderRadius: '0.5rem' }}>
            <Plus size={16} /> New Chat
          </button>

          <nav className="sidebar-nav flex-1 overflow-y-auto">
            {/* WORKSPACE */}
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-3 mt-4">Workspace</div>
            <div 
              className={`nav-item ${activeTab === 'overview' ? 'active bg-white/10 text-white border border-white/20' : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'}`} 
              onClick={() => setActiveTab('overview')}
              style={{ cursor: 'pointer', borderRadius: '6px', padding: '0.5rem 0.75rem', marginBottom: '4px', border: activeTab === 'overview' ? undefined : '1px solid transparent' }}
            >
              <LayoutDashboard size={18} className={activeTab === 'overview' ? 'text-white' : ''} /> Dashboard
            </div>
            <div 
              className={`nav-item ${activeTab === 'documents' ? 'active bg-white/10 text-white border border-white/20' : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'}`} 
              onClick={() => setActiveTab('documents')}
              style={{ cursor: 'pointer', borderRadius: '6px', padding: '0.5rem 0.75rem', marginBottom: '4px', border: activeTab === 'documents' ? undefined : '1px solid transparent' }}
            >
              <FileText size={18} className={activeTab === 'documents' ? 'text-white' : ''} /> My Documents
            </div>
            <div 
              className={`nav-item ${activeTab === 'github' ? 'active bg-white/10 text-white border border-white/20' : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'}`}
              onClick={() => setActiveTab('github')}
              style={{ cursor: 'pointer', borderRadius: '6px', padding: '0.5rem 0.75rem', marginBottom: '4px', border: activeTab === 'github' ? undefined : '1px solid transparent' }}
            >
              <Github size={18} className={activeTab === 'github' ? 'text-white' : ''} /> GitHub Projects
            </div>

            {/* TOOLS */}
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-3 mt-6">Tools</div>
            <div 
              className="nav-item text-neutral-400 hover:text-neutral-200 hover:bg-white/5 flex items-center gap-3" 
              onClick={onOpenNotes}
              style={{ cursor: 'pointer', borderRadius: '6px', padding: '0.5rem 0.75rem', marginBottom: '4px', border: '1px solid transparent' }}
            >
              <Book size={18} /> Notes Workspace
            </div>
            <div 
              className={`nav-item ${activeTab === 'history' ? 'active bg-white/10 text-white border border-white/20' : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'}`}
              onClick={() => setActiveTab('history')}
              style={{ cursor: 'pointer', borderRadius: '6px', padding: '0.5rem 0.75rem', marginBottom: '4px', border: activeTab === 'history' ? undefined : '1px solid transparent' }}
            >
              <HistoryIcon size={18} className={activeTab === 'history' ? 'text-white' : ''} /> History
            </div>
            <div 
              className={`nav-item ${activeTab === 'settings' ? 'active bg-white/10 text-white border border-white/20' : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'}`}
              onClick={() => setActiveTab('settings')}
              style={{ cursor: 'pointer', borderRadius: '6px', padding: '0.5rem 0.75rem', marginBottom: '4px', border: activeTab === 'settings' ? undefined : '1px solid transparent' }}
            >
              <Settings size={18} className={activeTab === 'settings' ? 'text-white' : ''} /> Settings
            </div>
          </nav>

          <div className="sidebar-footer mt-auto pt-4 border-t border-white/10">
            <div className="user-profile flex items-center justify-between p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors" onClick={onEditProfile}>
              <div className="flex items-center gap-3">
                <div className="avatar bg-white/5 border border-white/10 text-white flex items-center justify-center rounded-full w-9 h-9 text-sm font-semibold">
                  {username.substring(0, 2).toUpperCase()}
                </div>
                <div className="user-info flex flex-col">
                  <span className="user-name text-sm text-neutral-200 font-medium">{username}</span>
                  <span className="user-role text-xs text-neutral-500">{userRole || 'Student'}</span>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onLogout(); }} className="text-neutral-500 hover:text-red-400 p-1 transition-colors" title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main bg-transparent flex-1 flex flex-col h-full overflow-hidden" style={{ padding: '0' }}>
          
          <header className="px-8 py-5 border-b border-white/5 flex items-center justify-between relative z-10 backdrop-blur-md bg-black/20">
            <div className="global-search relative max-w-md w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input 
                type="text" 
                placeholder="Search research, files, or chats..." 
                value={dashboardSearchQuery}
                onChange={(e) => setDashboardSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-full py-2 pl-10 pr-12 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all" 
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 text-neutral-400 text-[10px] px-1.5 py-0.5 rounded border border-white/5 flex items-center gap-0.5">
                <Command size={10} /> K
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
            
            {activeTab === 'overview' && (
              <div className="w-full max-w-5xl">
                {/* Stats Row */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex-1 flex flex-col">
                    <span className="text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-1">Analyses</span>
                    <span className="text-white text-xl font-medium">{totalAnalyses}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex-1 flex flex-col">
                    <span className="text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-1">Documents</span>
                    <span className="text-white text-xl font-medium">{totalDocs}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex-1 flex flex-col">
                    <span className="text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-1">Repos</span>
                    <span className="text-white text-xl font-medium">{totalRepos}</span>
                  </div>
                </div>

                {/* Quick Actions (Dense) */}
                <section className="mb-10">
                  <h2 className="text-lg font-semibold text-neutral-200 mb-4">Quick actions</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0 && onFileUpload) {
                          onFileUpload(e.target.files[0]);
                        }
                      }}
                    />
                    
                    <div onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 bg-neutral-900/50 border border-white/10 hover:border-white/20 hover:bg-neutral-800 p-3 rounded-xl cursor-pointer transition-all group backdrop-blur-sm">
                      <div className="w-10 h-10 rounded-lg bg-white/5 text-white flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors">
                        <FileText size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-neutral-200 leading-tight">Analyze Document</span>
                        <span className="text-xs text-neutral-500 truncate">PDF/Image insights</span>
                      </div>
                    </div>
                    
                    <div onClick={() => setGithubModalOpen(true)} className="flex items-center gap-3 bg-neutral-900/50 border border-white/10 hover:border-white/20 hover:bg-neutral-800 p-3 rounded-xl cursor-pointer transition-all group backdrop-blur-sm">
                      <div className="w-10 h-10 rounded-lg bg-white/5 text-white flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors">
                        <Github size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-neutral-200 leading-tight">Explore Repo</span>
                        <span className="text-xs text-neutral-500 truncate">Code architecture</span>
                      </div>
                    </div>
                    
                    <div onClick={onNewChat} className="flex items-center gap-3 bg-neutral-900/50 border border-white/10 hover:border-white/20 hover:bg-neutral-800 p-3 rounded-xl cursor-pointer transition-all group backdrop-blur-sm">
                      <div className="w-10 h-10 rounded-lg bg-white/5 text-white flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors">
                        <MessageSquare size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-neutral-200 leading-tight">Start Free Chat</span>
                        <span className="text-xs text-neutral-500 truncate">Ask the AI</span>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-neutral-200">Recent activity</h2>
                    <button className="text-xs text-neutral-400 hover:text-white font-medium">See all</button>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {filteredHistoryItems.length > 0 ? (
                      <>
                        {filteredHistoryItems.slice(0, 5).map((item) => {
                          const isGithub = item.type && item.type.includes("GitHub");
                          const isDoc = item.type && (item.type.includes("Document") || item.type.includes("Image"));
                          const isSummary = item.type && item.type.includes("Summary");
                          
                          let badgeText = "AI";
                          let badgeClass = "bg-neutral-700/50 text-neutral-300";
                          if (isDoc) { badgeText = "PDF"; badgeClass = "bg-orange-500/20 text-orange-500"; }
                          if (isGithub) { badgeText = "GH"; badgeClass = "bg-green-500/20 text-green-500"; }

                          return (
                            <div className="flex items-start gap-4 p-4 bg-neutral-900/40 border border-white/10 hover:border-white/20 rounded-xl transition-colors cursor-pointer group" key={item.id}>
                              <div className={`text-[10px] font-bold px-2 py-1 rounded w-10 text-center flex-shrink-0 mt-0.5 ${badgeClass}`}>
                                {badgeText}
                              </div>
                              <div className="flex-1 flex flex-col gap-1 min-w-0">
                                <span className="text-sm font-medium text-neutral-200 truncate">{item.title}</span>
                                <div className="text-xs text-neutral-500 flex items-center gap-2 flex-wrap">
                                  <span>{getTimeAgo(item.createdAt)}</span>
                                  <span className="w-1 h-1 rounded-full bg-neutral-700"></span>
                                  <span className="truncate">{item.type}</span>
                                </div>
                              </div>
                              <div className="hidden sm:flex items-center gap-2">
                                {isSummary && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-neutral-300 border border-white/10">Summary</span>}
                                {isGithub && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-neutral-300 border border-white/10">Structure</span>}
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-neutral-300 border border-white/10">Concepts</span>
                              </div>
                              <button
                                type="button" 
                                onClick={(e) => handleDeleteHistory(e, item.id)}
                                className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          );
                        })}
                        {/* Dashed placeholder at the bottom */}
                        <div className="flex flex-col items-center justify-center p-6 border border-dashed border-white/10 rounded-xl mt-2 mb-8 bg-white/[0.02]">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mb-2 text-neutral-500">
                            <ArrowDown size={14} />
                          </div>
                          <span className="text-xs text-neutral-500">No more activity yet — run your first analysis</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded-xl mb-8 bg-white/[0.02]">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3 text-neutral-400">
                          <MessageSquare size={18} />
                        </div>
                        <span className="text-sm font-medium text-neutral-300 mb-1">No items found</span>
                        <span className="text-xs text-neutral-500 text-center max-w-[250px]">Use the quick actions above to start analyzing.</span>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'documents' && (
              <section className="w-full max-w-5xl">
                <h2 className="section-title text-neutral-200">My Documents</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredHistoryItems.filter(item => item.type === 'Document Summary' || item.type === 'Image Analysis').length > 0 ? (
                    filteredHistoryItems.filter(item => item.type === 'Document Summary' || item.type === 'Image Analysis').map(item => (
                      <div 
                        className="bg-neutral-900/50 border border-white/10 hover:border-white/20 rounded-xl p-4 cursor-pointer relative group transition-colors backdrop-blur-sm" 
                        key={item.id} 
                        onClick={() => setSelectedDocument(item)}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-white/5 text-white`}>
                          <FileText size={18} />
                        </div>
                        <button
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); handleDeleteHistory(e, item.id); }}
                          className="absolute top-3 right-3 text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                        <h3 className="text-sm font-medium text-neutral-200 truncate pr-6">{item.title}</h3>
                        <p className="text-xs text-neutral-500 mt-1">{item.type} • {getTimeAgo(item.createdAt)}</p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                      <span className="text-sm font-medium text-neutral-300 mb-1">No documents found</span>
                      <span className="text-xs text-neutral-500 text-center max-w-[300px]">Upload PDFs or Images to see them listed here.</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'history' && (
              <section className="w-full max-w-5xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Full History</h2>
                </div>
                
                <div className="flex flex-col gap-3">
                  {filteredHistoryItems.length > 0 ? (
                    filteredHistoryItems.map((item) => {
                      const isGithub = item.type && item.type.includes("GitHub");
                      const isDoc = item.type && (item.type.includes("Document") || item.type.includes("Image"));
                      const isSummary = item.type && item.type.includes("Summary");
                      
                      let badgeText = "AI";
                      let badgeClass = "bg-neutral-700/50 text-neutral-300";
                      if (isDoc) { badgeText = "PDF"; badgeClass = "bg-orange-500/20 text-orange-500"; }
                      if (isGithub) { badgeText = "GH"; badgeClass = "bg-green-500/20 text-green-500"; }

                      return (
                        <div className="flex items-start gap-4 p-4 bg-neutral-900/40 border border-white/10 hover:border-white/20 rounded-xl transition-colors cursor-pointer group" key={item.id} onClick={() => { if(isDoc) setSelectedDocument(item); }}>
                          <div className={`text-[10px] font-bold px-2 py-1 rounded w-10 text-center flex-shrink-0 mt-0.5 ${badgeClass}`}>
                            {badgeText}
                          </div>
                          <div className="flex-1 flex flex-col gap-1 min-w-0">
                            <span className="text-sm font-medium text-neutral-200 truncate">{item.title}</span>
                            <div className="text-xs text-neutral-500 flex items-center gap-2 flex-wrap">
                              <span>{getTimeAgo(item.createdAt)}</span>
                              <span className="w-1 h-1 rounded-full bg-neutral-700"></span>
                              <span className="truncate">{item.type}</span>
                            </div>
                          </div>
                          <button
                            type="button" 
                            onClick={(e) => handleDeleteHistory(e, item.id)}
                            className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                      <HistoryIcon size={24} className="text-neutral-500 mb-3" />
                      <span className="text-sm font-medium text-neutral-300 mb-1">No history records found</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'github' && (
              <section className="w-full max-w-5xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">GitHub Projects</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredHistoryItems.filter(item => item.type && item.type.includes('GitHub')).length > 0 ? (
                    filteredHistoryItems.filter(item => item.type && item.type.includes('GitHub')).map(item => (
                      <div 
                        className="bg-neutral-900/50 border border-neutral-800 hover:border-neutral-600 rounded-xl p-5 cursor-pointer relative group transition-all backdrop-blur-sm flex flex-col" 
                        key={item.id} 
                        onClick={() => {
                          setGithubSummary("Loading analysis...\n\n" + item.title);
                          setGithubModalOpen(true);
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#24292e] text-white">
                            <Github size={20} />
                          </div>
                          <button
                            type="button" 
                            onClick={(e) => { e.stopPropagation(); handleDeleteHistory(e, item.id); }}
                            className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <h3 className="text-sm font-semibold text-neutral-200 break-words line-clamp-2 mb-2 leading-relaxed">{item.title}</h3>
                        <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                          <span className="text-xs text-neutral-500">{getTimeAgo(item.createdAt)}</span>
                          <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-neutral-400">Analysis</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                      <Github size={24} className="text-neutral-500 mb-3" />
                      <span className="text-sm font-medium text-neutral-300 mb-1">No GitHub projects analyzed</span>
                      <span className="text-xs text-neutral-500 text-center max-w-[300px]">Use the "Explore Repo" quick action on the dashboard to start analyzing projects.</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'settings' && (
              <section className="w-full max-w-2xl mx-auto">
                <div className="bg-[#0b0b0e] border border-white/10 rounded-2xl shadow-2xl p-8 relative">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Edit Profile</h2>
                    <p className="text-sm text-neutral-400">Update your personal information.</p>
                  </div>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    localStorage.setItem('username', editProfileName);
                    localStorage.setItem('email', editProfileEmail);
                    alert('Profile updated successfully!');
                  }} className="flex flex-col gap-6">
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-neutral-300">Display Name</label>
                      <input 
                        type="text" 
                        value={editProfileName}
                        onChange={(e) => setEditProfileName(e.target.value)}
                        className="w-full bg-[#030303] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-colors"
                        placeholder="Your name"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-neutral-300">Email Address</label>
                      <input 
                        type="email" 
                        value={editProfileEmail}
                        onChange={(e) => setEditProfileEmail(e.target.value)}
                        className="w-full bg-[#030303] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-colors"
                        placeholder="you@example.com"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-neutral-300">New Password (Optional)</label>
                      <input 
                        type="password" 
                        value={editProfilePassword}
                        onChange={(e) => setEditProfilePassword(e.target.value)}
                        className="w-full bg-[#030303] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-colors"
                        placeholder="••••••••"
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="mt-4 w-full bg-white hover:bg-neutral-200 text-black font-semibold rounded-xl py-3 px-4 transition-colors"
                    >
                      Save Changes
                    </button>
                  </form>
                </div>
              </section>
            )}
          </div>
        </main>

      </div>

      {/* GitHub Modal Overlay */}
      {githubModalOpen && (
        <div className="modal-overlay" onClick={() => { setGithubModalOpen(false); setGithubUrl(''); setGithubSummary(''); setError(''); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: githubSummary ? '800px' : '500px', width: '90%' }}>
            <button className="modal-close" onClick={() => { setGithubModalOpen(false); setGithubUrl(''); setGithubSummary(''); setError(''); }}>
              <X size={20} />
            </button>
            <div className="modal-header">
              <h3 className="text-xl text-white font-semibold mb-2">GitHub Repository Analysis</h3>
              <p className="text-sm text-neutral-400">Paste a repository link to generate a summary.</p>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleGithubSubmit} className="auth-form" style={{ marginBottom: githubSummary ? '20px' : '0' }}>
                <div className="form-group">
                  <input
                    type="url"
                    placeholder="https://github.com/facebook/react"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    required
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '15px' }}
                  />
                </div>
                {error && <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '8px' }}>{error}</p>}
                <button type="submit" className="button-primary bg-white/10 hover:bg-white/20 border border-white/10 text-white" style={{ width: '100%', marginTop: '12px' }} disabled={isLoading}>
                  {isLoading ? 'Analyzing...' : 'Generate Summary'}
                </button>
              </form>

              {githubSummary && !isLoading && (
                <div className="bg-neutral-900 border border-white/10 p-6 rounded-xl text-neutral-200 mt-4 custom-scrollbar max-h-[50vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">
                  {githubSummary}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document View Modal Overlay */}
      {selectedDocument && (
        <div className="modal-overlay" onClick={() => setSelectedDocument(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
            <button className="modal-close" onClick={() => setSelectedDocument(null)}>
              <X size={20} />
            </button>
            <div className="modal-header">
              <h3 className="text-xl text-white font-semibold mb-2">{selectedDocument.title}</h3>
              <p className="text-xs text-neutral-500">{selectedDocument.type} • {getTimeAgo(selectedDocument.createdAt)}</p>
            </div>
            
            <div className="modal-body flex flex-col gap-4">
              {(selectedDocument.type === 'Image Analysis' || selectedDocument.type === 'Document Summary') && (
                <div className="w-full flex justify-center bg-neutral-900 border border-white/10 rounded-xl p-3">
                  {selectedDocument.type === 'Image Analysis' ? (
                    <img 
                      src={`http://localhost:8081/api/research/history/${selectedDocument.id}/file`} 
                      alt={selectedDocument.title} 
                      className="max-w-full max-h-[70vh] object-contain rounded-lg"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <iframe 
                      src={`http://localhost:8081/api/research/history/${selectedDocument.id}/file`}
                      title={selectedDocument.title}
                      className="w-full h-[70vh] border-none rounded-lg"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
