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
  Trash2
} from 'lucide-react';
import './index.css';



const Dashboard = ({ userRole, onLogout, onNewChat, onEditProfile }) => {
  const username = localStorage.getItem("username") || "Demo User";
  
  const [githubModalOpen, setGithubModalOpen] = React.useState(false);
  const [githubUrl, setGithubUrl] = React.useState('');
  const [githubSummary, setGithubSummary] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [historyItems, setHistoryItems] = React.useState([]);
  const [activeTab, setActiveTab] = React.useState('overview');
  const [selectedDocument, setSelectedDocument] = React.useState(null);

  React.useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/research/history');
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
      const res = await fetch(`http://localhost:8080/api/research/history/${id}`, { method: 'DELETE' });
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
      const response = await fetch('http://localhost:8080/api/research/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: githubUrl })
      });
      if (!response.ok) {
        throw new Error('Failed to fetch summary');
      }
      const data = await response.text();
      setGithubSummary(data);
    } catch (err) {
      console.error(err);
      setError('Could not process the GitHub repository. Please check the URL.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          InsightAI
        </div>

        <nav className="sidebar-nav">
          <button className="button-primary side-action" onClick={onNewChat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem', width: '100%' }}>
            <Plus size={16} /> New Chat
          </button>

          <div 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} 
            onClick={() => setActiveTab('overview')}
            style={{ cursor: 'pointer' }}
          >
            <MessageSquare size={18} /> Chat Hub
          </div>
          <div 
            className={`nav-item ${activeTab === 'documents' ? 'active' : ''}`} 
            onClick={() => setActiveTab('documents')}
            style={{ cursor: 'pointer' }}
          >
            <FileText size={18} /> My Documents
          </div>
          <div className="nav-item">
            <Github size={18} /> GitHub Projects
          </div>
          <div className="nav-item">
            <Settings size={18} /> Settings
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="nav-item" onClick={onLogout} style={{ color: '#ef4444', marginBottom: '1rem' }}>
            <LogOut size={18} /> Log out
          </div>
          <div className="user-profile" onClick={onEditProfile} style={{ cursor: 'pointer' }}>
            <div className="avatar" style={{ backgroundColor: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} />
            </div>
            <div className="user-info">
              <span className="user-name">{username}</span>
              <span className="user-role">{userRole || 'Student'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="greeting">
            <h1>Welcome back! {username} 👋</h1>
            <p>What would you like to research today?</p>
          </div>
          <div className="global-search">
            <Search size={16} />
            <input type="text" placeholder="Search research, files, or chats..." />
          </div>
        </header>

        {activeTab === 'overview' ? (
          <>
            <section>
              <h2 className="section-title">Quick Actions</h2>
              <div className="quick-actions-grid">
                <div className="action-card">
                  <div className="action-icon">
                    <FileText size={20} />
                  </div>
                  <h3>Analyze Document</h3>
                  <p>Upload a PDF or paper to extract insights and summaries.</p>
                </div>
                <div className="action-card" onClick={() => setGithubModalOpen(true)} style={{ cursor: 'pointer' }}>
                  <div className="action-icon">
                    <Github size={20} />
                  </div>
                  <h3>Explore Repository</h3>
                  <p>Paste a GitHub link to understand the architecture and code.</p>
                </div>
                <div className="action-card">
                  <div className="action-icon">
                    <Code2 size={20} />
                  </div>
                  <h3>Start Free Chat</h3>
                  <p>Ask our AI model any technical or academic questions.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="section-title">Recent Activity</h2>
              <div className="recent-activity">
                <div className="activity-list">
                  {historyItems.length > 0 ? (
                    historyItems.slice(0, 5).map((item) => (
                      <div className="activity-item" key={item.id}>
                        <div className="activity-icon">
                          {item.type && item.type.includes("GitHub") ? (
                            <Github size={16} />
                          ) : item.type && (item.type.includes("Document") || item.type.includes("Image")) ? (
                            <FileText size={16} />
                          ) : (
                            <MessageSquare size={16} />
                          )}
                        </div>
                        <div className="activity-details">
                          <div className="activity-title">{item.title}</div>
                          <div className="activity-meta">
                            {item.type} • {getTimeAgo(item.createdAt)}
                          </div>
                        </div>
                        <button
                          type="button" 
                          onClick={(e) => handleDeleteHistory(e, item.id)}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', marginLeft: 'auto' }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#94a3b8', fontSize: '14px', fontStyle: 'italic', padding: '16px 0' }}>
                      No recent activity found. Start a new chat or analyze a document!
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        ) : (
          <section>
            <h2 className="section-title">My Documents</h2>
            <div className="quick-actions-grid">
              {historyItems.filter(item => item.type === 'Document Summary' || item.type === 'Image Analysis').length > 0 ? (
                historyItems.filter(item => item.type === 'Document Summary' || item.type === 'Image Analysis').map(item => (
                  <div 
                    className="action-card" 
                    key={item.id} 
                    style={{ cursor: 'pointer', position: 'relative' }}
                    onClick={() => setSelectedDocument(item)}
                  >
                    <div className="action-icon" style={{ backgroundColor: item.type === 'Document Summary' ? '#ef4444' : '#3b82f6' }}>
                      <FileText size={20} color="white" />
                    </div>
                    <button
                      type="button" 
                      onClick={(e) => handleDeleteHistory(e, item.id)}
                      style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', zIndex: 10 }}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                    <h3 style={{ marginTop: '12px', fontSize: '15px' }}>{item.title}</h3>
                    <p style={{ marginTop: '8px', fontSize: '13px' }}>{item.type} • {getTimeAgo(item.createdAt)}</p>
                  </div>
                ))
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '14px', fontStyle: 'italic', gridColumn: '1 / -1' }}>
                  No uploaded documents or photos found. Use the chat to upload and analyze your first file!
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* GitHub Modal Overlay */}
      {githubModalOpen && (
        <div className="modal-overlay" onClick={() => { setGithubModalOpen(false); setGithubUrl(''); setGithubSummary(''); setError(''); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: githubSummary ? '800px' : '500px', width: '90%' }}>
            <button className="modal-close" onClick={() => { setGithubModalOpen(false); setGithubUrl(''); setGithubSummary(''); setError(''); }}>
              <X size={20} />
            </button>
            <div className="modal-header">
              <h3>GitHub Repository Analysis</h3>
              <p>Paste a repository link to generate a summary.</p>
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
                <button type="submit" className="button-primary" style={{ width: '100%', marginTop: '12px' }} disabled={isLoading}>
                  {isLoading ? 'Analyzing...' : 'Generate Summary'}
                </button>
              </form>

              {githubSummary && !isLoading && (
                <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', color: '#f8fafc', maxHeight: '50vh', overflowY: 'auto', fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
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
              <h3>{selectedDocument.title}</h3>
              <p>{selectedDocument.type} • {getTimeAgo(selectedDocument.createdAt)}</p>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(selectedDocument.type === 'Image Analysis' || selectedDocument.type === 'Document Summary') && (
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', backgroundColor: '#e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  {selectedDocument.type === 'Image Analysis' ? (
                    <img 
                      src={`http://localhost:8080/api/research/history/${selectedDocument.id}/file`} 
                      alt={selectedDocument.title} 
                      style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '4px' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <iframe 
                      src={`http://localhost:8080/api/research/history/${selectedDocument.id}/file`}
                      title={selectedDocument.title}
                      style={{ width: '100%', height: '70vh', border: 'none', borderRadius: '4px' }}
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
