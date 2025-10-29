import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */class Q{constructor(){this.routes={"/":"projects","/deploy":"deploy","/history":"history","/repositories":"repositories","/domain":"domain","/env-vars":"env-vars","/settings":"settings","/logs":"logs"},this.currentPage=null,this.init()}init(){document.querySelectorAll(".nav-item").forEach(e=>{e.addEventListener("click",t=>{t.preventDefault();const n=e.getAttribute("href");this.navigate(n)})}),window.addEventListener("popstate",()=>{this.loadPage(window.location.pathname)}),this.loadPage(window.location.pathname)}navigate(e){window.history.pushState({},"",e),this.loadPage(e)}loadPage(e){const t=this.routes[e]||"dashboard";this.showPage(t),this.updateActiveNav(e),this.updatePageTitle(t),window.scrollTo({top:0,behavior:"smooth"})}showPage(e){document.querySelectorAll(".page").forEach(n=>{n.style.display="none"});const t=document.getElementById(`page-${e}`);if(t)t.style.display="block";else{const n=document.getElementById("page-dashboard");n&&(n.style.display="block")}this.currentPage=e,this.loadPageData(e)}updateActiveNav(e){document.querySelectorAll(".nav-item").forEach(t=>{t.classList.remove("active"),t.getAttribute("href")===e&&t.classList.add("active")})}updatePageTitle(e){const t={projects:"Projects",deploy:"Deploy",history:"History",repositories:"Repositories",domain:"Domain","env-vars":"Environmental Variables",settings:"Settings",logs:"Logs"};document.getElementById("pageTitle").textContent=t[e]||"Dashboard"}loadPageData(e){switch(e){case"projects":P();break;case"history":U();break;case"repositories":Se();break;case"domain":ce();break;case"env-vars":A();break;case"settings":_e();break;case"logs":Y();break}}}const L=new Q;window.router=L;async function X(o){const e=await te();if(!e)return;const t=g.find(i=>i.id==o),n=t?t.name:"this project";if(await Z(n))try{console.log("Deleting project with token:",e.substring(0,20)+"...");const i=await fetch(`/projects/${o}`,{method:"DELETE",headers:{Authorization:`Bearer ${e}`}});if(console.log("Delete response status:",i.status),!i.ok){const s=await i.json().catch(()=>({}));if(console.error("Delete error response:",s),i.status===401){d("Session expired. Please login again.","error"),localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),setTimeout(()=>{window.location.href="/login"},2e3);return}throw new Error(s.detail||"Failed to delete project")}g=g.filter(s=>s.id!=o),b=b.filter(s=>s.id!=o),B(b),d("Project deleted","success")}catch(i){console.error("Delete project error:",i),d(`Delete failed: ${i.message}`,"error")}}function Z(o){return new Promise(e=>{const t=document.createElement("div");t.className="modal-overlay",t.style.cssText=`
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;const n=document.createElement("div");n.className="delete-confirmation-modal",n.style.cssText=`
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      animation: modalSlideIn 0.2s ease-out;
    `,n.innerHTML=`
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="width: 48px; height: 48px; background: #fef2f2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
            <path d="M10 11v6"></path>
            <path d="M14 11v6"></path>
            <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
          </svg>
        </div>
        <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #111827;">Delete Project</h3>
        <p style="margin: 0; color: #6b7280; line-height: 1.5;">
          Are you sure you want to delete <strong>${w(o)}</strong>?<br>
          This will stop and remove its container and image.
        </p>
      </div>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button class="cancel-btn" style="
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        ">Cancel</button>
        <button class="delete-btn" style="
          padding: 8px 16px;
          border: none;
          background: #ef4444;
          color: white;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        ">Delete</button>
      </div>
    `;const a=document.createElement("style");a.textContent=`
      @keyframes modalSlideIn {
        from { opacity: 0; transform: scale(0.95) translateY(-10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      .cancel-btn:hover { background: #f9fafb; border-color: #9ca3af; }
      .delete-btn:hover { background: #dc2626; }
    `,document.head.appendChild(a),t.appendChild(n),document.body.appendChild(t);const i=n.querySelector(".cancel-btn"),s=n.querySelector(".delete-btn"),c=()=>{document.body.removeChild(t),document.head.removeChild(a)};i.onclick=()=>{c(),e(!1)},s.onclick=()=>{c(),e(!0)},t.onclick=p=>{p.target===t&&(c(),e(!1))},s.focus()})}function ee(o){try{const t=JSON.parse(atob(o.split(".")[1])).exp*1e3,n=Date.now();return t<n+5*60*1e3}catch{return!0}}async function te(){const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");return!o||ee(o)?(d("Session expired. Please login again.","error"),localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),setTimeout(()=>{window.location.href="/login"},2e3),null):o}let x=localStorage.getItem("access_token")||localStorage.getItem("authToken"),M=localStorage.getItem("username");document.addEventListener("DOMContentLoaded",()=>{T(),window.location.pathname==="/login"||window.location.pathname.includes("login.html")||setTimeout(()=>{if(x&&M){oe(),Fe();const e=document.getElementById("page-projects");e&&window.location.pathname==="/"&&(e.style.display="block")}},100)});function T(){const o=document.getElementById("userSection"),e=document.getElementById("authButtons"),t=document.getElementById("logoutBtn"),n=document.getElementById("newDeployBtn");document.getElementById("userName"),document.getElementById("userEmail"),document.getElementById("userAvatar");const a=window.location.pathname==="/login"||window.location.pathname.includes("login.html");x&&M?(o.style.display="flex",e.style.display="none",t.style.display="block",n.style.display="block",K(),P(),a&&(window.location.href="/")):(o.style.display="none",e.style.display="block",t.style.display="none",n.style.display="none",a||(window.location.href="/login"))}function oe(){var i,s;document.getElementById("logoutBtn").addEventListener("click",()=>{localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),x=null,M=null,T(),d("Logged out successfully","success"),L.navigate("/")});const o=document.getElementById("projectsSearch");o&&o.addEventListener("input",c=>{const p=c.target.value.toLowerCase();b=g.filter(l=>l.name.toLowerCase().includes(p)||l.repository&&l.repository.toLowerCase().includes(p)),B(b)});const e=document.getElementById("addProjectBtn");e&&e.addEventListener("click",()=>{window.router&&window.router.navigate("/deploy")});const t=document.getElementById("browseUploadLink");t&&t.addEventListener("click",c=>{c.preventDefault(),window.router&&window.router.navigate("/deploy")}),document.getElementById("newDeployBtn").addEventListener("click",()=>{L.navigate("/deploy")});const n=document.getElementById("deployForm");n&&n.addEventListener("submit",he);const a=document.getElementById("deploy-type");a&&a.addEventListener("change",c=>{const p=document.getElementById("single-repo-group"),l=document.getElementById("split-repo-group"),u=document.getElementById("git-url");c.target.value==="split"?(p.style.display="none",l.style.display="block",u&&u.removeAttribute("required")):(p.style.display="block",l.style.display="none",u&&u.setAttribute("required","required"))}),(i=document.getElementById("clearHistoryBtn"))==null||i.addEventListener("click",be),(s=document.getElementById("searchReposBtn"))==null||s.addEventListener("click",ke),ne()}function ne(){const o=document.querySelector(".search-input"),e=document.getElementById("spotlightModal"),t=document.getElementById("spotlightSearch"),n=document.getElementById("spotlightResults");!o||!e||!t||!n||(o.addEventListener("click",ae),e.addEventListener("click",a=>{a.target===e&&D()}),t.addEventListener("input",se),n.addEventListener("click",le),document.addEventListener("keydown",a=>{a.key==="Escape"&&e.style.display!=="none"&&D()}))}function ae(){const o=document.getElementById("spotlightModal"),e=document.getElementById("spotlightSearch");o.style.display="flex",setTimeout(()=>{e.focus()},100)}function D(){const o=document.getElementById("spotlightModal"),e=document.getElementById("spotlightSearch"),t=document.getElementById("spotlightResults");o.style.display="none",e.value="",t.innerHTML=`
    <div class="spotlight-empty">
      <div class="empty-icon">🔍</div>
      <p>Start typing to search...</p>
      <div class="search-suggestions">
        <div class="suggestion-category">
          <h4>Quick Actions</h4>
          <div class="suggestion-item" data-action="new-deploy">
            <span class="suggestion-icon">🚀</span>
            <span class="suggestion-text">New Deploy</span>
          </div>
          <div class="suggestion-item" data-action="repositories">
            <span class="suggestion-icon">📁</span>
            <span class="suggestion-text">Repositories</span>
          </div>
          <div class="suggestion-item" data-action="history">
            <span class="suggestion-icon">📜</span>
            <span class="suggestion-text">History</span>
          </div>
        </div>
      </div>
    </div>
  `}function se(o){const e=o.target.value.toLowerCase().trim(),t=document.getElementById("spotlightResults");if(!e){t.innerHTML=`
      <div class="spotlight-empty">
        <div class="empty-icon">🔍</div>
        <p>Start typing to search...</p>
        <div class="search-suggestions">
          <div class="suggestion-category">
            <h4>Quick Actions</h4>
            <div class="suggestion-item" data-action="new-deploy">
              <span class="suggestion-icon">🚀</span>
              <span class="suggestion-text">New Deploy</span>
            </div>
            <div class="suggestion-item" data-action="repositories">
              <span class="suggestion-icon">📁</span>
              <span class="suggestion-text">Repositories</span>
            </div>
            <div class="suggestion-item" data-action="history">
              <span class="suggestion-icon">📜</span>
              <span class="suggestion-text">History</span>
            </div>
          </div>
        </div>
      </div>
    `;return}const n=ie(e);re(n)}function ie(o){const e={projects:[],actions:[],navigation:[]};g&&g.length>0&&(e.projects=g.filter(a=>a.name.toLowerCase().includes(o)||a.repository&&a.repository.toLowerCase().includes(o)));const t=[{name:"New Deploy",action:"new-deploy",icon:"🚀"},{name:"Repositories",action:"repositories",icon:"📁"},{name:"History",action:"history",icon:"📜"},{name:"Settings",action:"settings",icon:"⚙️"},{name:"Domain",action:"domain",icon:"🌐"}];e.actions=t.filter(a=>a.name.toLowerCase().includes(o));const n=[{name:"Projects",action:"projects",icon:"📊"},{name:"Repositories",action:"repositories",icon:"📁"},{name:"History",action:"history",icon:"📜"},{name:"Domain",action:"domain",icon:"🌐"},{name:"Settings",action:"settings",icon:"⚙️"}];return e.navigation=n.filter(a=>a.name.toLowerCase().includes(o)),e}function re(o){const e=document.getElementById("spotlightResults");let t='<div class="search-results">';o.projects.length>0&&(t+='<div class="search-category">',t+='<div class="search-category-title">Projects</div>',o.projects.forEach(n=>{const a=n.status==="running"?"🚀":"📦",i=n.status==="running"?"RUNNING":n.status==="failed"?"FAILED":"IMPORTED";t+=`
        <div class="search-result-item" data-type="project" data-id="${n.id}">
          <span class="search-result-icon">${a}</span>
          <div class="search-result-content">
            <div class="search-result-title">${w(n.name)}</div>
            <div class="search-result-subtitle">${n.repository||"No repository"}</div>
          </div>
          <span class="search-result-badge">${i}</span>
        </div>
      `}),t+="</div>"),o.actions.length>0&&(t+='<div class="search-category">',t+='<div class="search-category-title">Actions</div>',o.actions.forEach(n=>{t+=`
        <div class="search-result-item" data-type="action" data-action="${n.action}">
          <span class="search-result-icon">${n.icon}</span>
          <div class="search-result-content">
            <div class="search-result-title">${n.name}</div>
          </div>
        </div>
      `}),t+="</div>"),o.navigation.length>0&&(t+='<div class="search-category">',t+='<div class="search-category-title">Navigation</div>',o.navigation.forEach(n=>{t+=`
        <div class="search-result-item" data-type="navigation" data-action="${n.action}">
          <span class="search-result-icon">${n.icon}</span>
          <div class="search-result-content">
            <div class="search-result-title">${n.name}</div>
          </div>
        </div>
      `}),t+="</div>"),o.projects.length===0&&o.actions.length===0&&o.navigation.length===0&&(t=`
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <p>No results found for "${w(document.getElementById("spotlightSearch").value)}"</p>
      </div>
    `),t+="</div>",e.innerHTML=t}function le(o){const e=o.target.closest(".suggestion-item, .search-result-item");if(!e)return;const t=e.dataset.action,n=e.dataset.type,a=e.dataset.id;if(D(),n==="project"&&a)N(parseInt(a));else if(t)switch(t){case"new-deploy":window.router&&window.router.navigate("/deploy");break;case"repositories":window.router&&window.router.navigate("/repositories");break;case"history":window.router&&window.router.navigate("/history");break;case"domain":window.router&&window.router.navigate("/domain");break;case"settings":window.router&&window.router.navigate("/settings");break;case"projects":window.router&&window.router.navigate("/projects");break}}function ce(){document.getElementById("page-domain")}function j(){const o={},e=localStorage.getItem("access_token")||localStorage.getItem("authToken");return e&&(o.Authorization=`Bearer ${e}`),o}let g=[],b=[];async function P(){const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o){B([]);return}pe();try{const e=await fetch("/deployments",{headers:{Authorization:`Bearer ${o}`}});e.ok?(g=(await e.json()).map(n=>{var l;const a=n.repository_url||n.git_url,i=a?(l=String(a).split("/").pop())==null?void 0:l.replace(/\.git$/,""):null,s=n.app_name||i||n.container_name||"Untitled Project",c=(n.status||"").toLowerCase();let p;return c==="running"?p="running":c==="failed"||c==="error"?p="failed":p="imported",{id:n.id,name:s,status:p,url:n.deployed_url||n.app_url,createdAt:n.created_at,updatedAt:n.updated_at,repository:a,repository_url:a,containerUptime:n.container_uptime||"Unknown",containerPorts:n.container_ports||"No ports",containerImage:n.container_image||"Unknown",containerStatus:n.container_status||"Unknown",isRunning:n.is_running||!1}}),b=[...g],B(b)):B([])}catch(e){console.error("Error loading projects:",e),B([])}}function B(o){const e=document.getElementById("projectsGrid");if(e){if(o.length===0){e.innerHTML=`
      <div class="empty-state">
        <p>No projects found</p>
        <button class="btn-primary" onclick="if(window.router){window.router.navigate('/deploy');}else{window.location.href='/deploy';}">Create First Project</button>
      </div>
    `;return}e.innerHTML=o.map(t=>{const n=t.status==="running"?"status-success":t.status==="failed"?"status-error":"status-info",a=t.status==="running"?"Running":t.status==="failed"?"Failed":"Imported",i=t.status==="running"?"🚀":"📦",s=t.updatedAt?S(t.updatedAt):"Recently";return`
      <div class="project-card" data-project-id="${t.id}" onclick="selectProject(${t.id})">
        <div class="project-header">
          <div class="project-icon">${i}</div>
          <div class="project-status ${n}">${a}</div>
          </div>
        
        <div class="project-info">
          <h3 class="project-name">${w(t.name)}</h3>
          <div class="project-meta">
            <svg class="icon-clock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12,6 12,12 16,14"></polyline>
            </svg>
            <span>Updated ${s}</span>
        </div>
          
                 ${t.status==="running"?`
                 <div class="project-metrics">
                   <div class="metric">
                     <span class="metric-label">Uptime</span>
                     <span class="metric-value">${t.containerUptime}</span>
            </div>
            </div>
            `:""}
            </div>
        
        <div class="project-actions">
          <button class="btn-icon btn-text" title="Open site" onclick="event.stopPropagation(); openProjectSite(${t.id})">
            Open site
            </button>
          <button class="btn-icon btn-danger" title="Delete project" onclick="event.stopPropagation(); deleteProject(${t.id})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
              <path d="M10 11v6"></path>
              <path d="M14 11v6"></path>
              <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
            </svg>
            </button>
          ${t.status==="running"?`
          <button class="btn-icon" title="Restart" onclick="event.stopPropagation(); restartProject(${t.id})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
            </svg>
            </button>
          `:""}
          </div>
        </div>
      `}).join("")}}async function de(o){try{const e=g.find(t=>t.id===o);if(!e){d("Project not found","error");return}if(!e.url||e.url==="#"){d("Project URL not available. Make sure the project is deployed.","error");return}window.open(e.url,"_blank"),d(`Opening ${e.name}...`,"info")}catch(e){console.error("Error opening project site:",e),d("Failed to open project site: "+e.message,"error")}}function pe(){const o=document.getElementById("projectsGrid");o&&(o.innerHTML=`
    <div class="loading-skeleton">
      ${Array(3).fill(`
        <div class="skeleton-card">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line short"></div>
        </div>
      `).join("")}
    </div>
  `)}let r=null;function N(o){const e=g.find(n=>n.id==o);if(!e)return;r=e,F(e);const t=document.getElementById("page-project-config");t&&t.style.display!=="none"&&O()}function F(o){const e=document.getElementById("sidebar");e&&(e.style.display="none");let t=document.getElementById("projectSidebar");t||(t=ue(),document.body.appendChild(t));const n=t.querySelector("#projectSidebarName");n&&(n.textContent=o.name);const a=t.querySelector("#projectSidebarId");a&&(a.textContent=o.id),t.style.display="block",document.getElementById("pageTitle").textContent=o.name,z(),q("deploy")}function ue(){const o=document.createElement("aside");return o.id="projectSidebar",o.className="sidebar project-sidebar",o.innerHTML=`
    <div class="sidebar-header">
      <div class="logo">
        <span class="logo-icon">DB</span>
        <span class="logo-text">DevOps Butler</span>
      </div>
      <button class="btn-back" onclick="hideProjectSidebar()">← Back to Projects</button>
    </div>
    
    <div class="project-info">
      <h3 id="projectSidebarName">Project Name</h3>
      <p class="project-id">ID: <span id="projectSidebarId">-</span></p>
    </div>
    
    <nav class="sidebar-nav">
      <a href="#" class="nav-item project-nav-item" data-project-page="deploy">
        <span class="nav-icon">🚀</span>
        <span class="nav-label">Deploy</span>
      </a>
      <a href="#" class="nav-item project-nav-item" data-project-page="configuration">
        <span class="nav-icon">⚙️</span>
        <span class="nav-label">Configuration</span>
      </a>
      <a href="#" class="nav-item project-nav-item" data-project-page="domain-config">
        <span class="nav-icon">🌐</span>
        <span class="nav-label">Domain Configuration</span>
      </a>
      <a href="#" class="nav-item project-nav-item" data-project-page="env-vars">
        <span class="nav-icon">🔐</span>
        <span class="nav-label">Environment Variables</span>
      </a>
    </nav>
    
    <div class="sidebar-footer">
      <div class="user-section">
        <div class="user-avatar" id="projectSidebarUserAvatar">G</div>
        <div class="user-info">
          <div class="user-name" id="projectSidebarUserName">Guest</div>
          <div class="user-email" id="projectSidebarUserEmail">Not logged in</div>
        </div>
      </div>
    </div>
  `,o.querySelectorAll(".project-nav-item").forEach(e=>{e.addEventListener("click",t=>{t.preventDefault();const n=e.getAttribute("data-project-page");q(n),o.querySelectorAll(".project-nav-item").forEach(a=>a.classList.remove("active")),e.classList.add("active")})}),o}function me(){const o=document.getElementById("projectSidebar");o&&(o.style.display="none");const e=document.getElementById("sidebar");e&&(e.style.display="block"),r=null,document.getElementById("pageTitle").textContent="Projects",document.querySelectorAll(".page").forEach(n=>{n.style.display="none"});const t=document.getElementById("page-projects");t&&(t.style.display="block"),P()}function q(o){switch(document.querySelectorAll(".page").forEach(e=>{e.style.display="none"}),o){case"deploy":const e=document.getElementById("page-deploy");if(e&&(e.style.display="block",r&&r.repository_url)){const a=document.getElementById("git-url");a&&(a.value=r.repository_url)}document.getElementById("pageTitle").textContent="Deploy";break;case"configuration":ge();break;case"logs":const t=document.getElementById("page-logs");t&&(t.style.display="block",Y());break;case"domain-config":ye();break;case"env-vars":const n=document.getElementById("page-env-vars");n&&(n.style.display="block",A());break}}function ge(){let o=document.getElementById("page-project-config");o||(o=document.createElement("div"),o.id="page-project-config",o.className="page",o.innerHTML=`
      <div class="card">
        <h2>Project information</h2>
        <hr class="config-divider">
        <div class="config-info-grid">
          <div class="config-row">
            <div class="config-label">Project name:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigName">${(r==null?void 0:r.name)||"Unknown"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Owner:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigOwner">${(r==null?void 0:r.owner)||"Unknown"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Project ID:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigId">${(r==null?void 0:r.id)||"-"}</span>
              <button class="copy-btn" onclick="copyToClipboard('${(r==null?void 0:r.id)||""}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
            <div class="config-subtext">Also known as Site ID</div>
          </div>
          <div class="config-row">
            <div class="config-label">Created:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigCreated">${r!=null&&r.createdAt?S(new Date(r.createdAt)):"Unknown"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Last update:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigUpdated">${r!=null&&r.updatedAt?S(new Date(r.updatedAt)):"Unknown"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Container Ports:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigPorts">${(r==null?void 0:r.containerPorts)||"No ports"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Docker Image:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigImage">${(r==null?void 0:r.containerImage)||"Unknown"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Container Status:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigStatus">${(r==null?void 0:r.containerStatus)||"Unknown"}</span>
            </div>
          </div>
        </div>
        <div class="config-actions">
          <button class="btn-secondary" id="changeProjectNameBtn">Change project name</button>
        </div>
      </div>
    `,document.getElementById("pageContent").appendChild(o)),O(),o.style.display="block"}function O(){if(!r)return;const o=document.getElementById("projectConfigName"),e=document.getElementById("projectConfigOwner"),t=document.getElementById("projectConfigId"),n=document.getElementById("projectConfigCreated"),a=document.getElementById("projectConfigUpdated"),i=document.getElementById("projectConfigPorts"),s=document.getElementById("projectConfigImage"),c=document.getElementById("projectConfigStatus");if(o&&(o.textContent=r.name||"Unknown"),e){const p=localStorage.getItem("username"),l=localStorage.getItem("displayName");e.textContent=l||p||"Unknown User"}t&&(t.textContent=r.id||"-"),n&&(n.textContent=r.createdAt?S(new Date(r.createdAt)):"Unknown"),a&&(a.textContent=r.updatedAt?S(new Date(r.updatedAt)):"Unknown"),i&&(i.textContent=r.containerPorts||"No ports"),s&&(s.textContent=r.containerImage||"Unknown"),c&&(c.textContent=r.containerStatus||"Unknown")}function ye(){let o=document.getElementById("page-project-domain");o||(o=document.createElement("div"),o.id="page-project-domain",o.className="page",o.innerHTML=`
      <div class="card">
        <h2>Domain Configuration</h2>
        <div class="domain-config">
          <div class="config-option">
            <h3>🌐 Use Custom Domain</h3>
            <p>Configure a custom domain for this project</p>
            <div class="form-group">
              <label for="customDomain">Custom Domain</label>
              <input type="text" id="customDomain" placeholder="example.com" />
          </div>
            <button class="btn-primary">Save Domain</button>
            </div>
          <div class="config-option">
            <h3>🏠 Use Localhost</h3>
            <p>Deploy to localhost with dynamic port</p>
            <button class="btn-secondary">Use Localhost</button>
          </div>
        </div>
      </div>
    `,document.getElementById("pageContent").appendChild(o)),o.style.display="block"}function ve(o){N(o)}async function z(){const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o){console.log("No auth token found");return}try{const e=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${o}`}});if(e.ok){const t=await e.json(),n=document.getElementById("projectSidebar");if(n){const a=n.querySelector("#projectSidebarUserName"),i=n.querySelector("#projectSidebarUserEmail"),s=n.querySelector("#projectSidebarUserAvatar");if(a&&(a.textContent=t.display_name||t.username||"User"),i&&(i.textContent=t.email||"No email"),s)if(t.avatar_url){const c=new Image;c.onload=()=>{s.style.backgroundImage=`url(${t.avatar_url})`,s.style.backgroundSize="cover",s.style.backgroundPosition="center",s.textContent=""},c.onerror=()=>{s.style.backgroundImage="",s.textContent=(t.display_name||t.username||"U").charAt(0).toUpperCase()},c.src=t.avatar_url}else s.style.backgroundImage="",s.textContent=(t.display_name||t.username||"U").charAt(0).toUpperCase()}}else console.error("Failed to load user profile:",e.status)}catch(e){console.error("Error loading user profile:",e)}}function S(o){if(!o)return"Recently";const t=Date.now()-new Date(o).getTime(),n=Math.floor(t/6e4),a=Math.floor(t/36e5),i=Math.floor(t/864e5);if(n<1)return"Just now";if(n<60)return`${n}m ago`;if(a<24)return`${a}h ago`;if(i<7)return`${i}d ago`;const s=new Date(o);return s.toLocaleDateString("en-US",{month:"short",day:"numeric",year:s.getFullYear()!==new Date().getFullYear()?"numeric":void 0})}async function fe(){await P();try{const o=await fetch("/deployments",{headers:j()});if(o.ok){const e=await o.json();document.getElementById("totalDeployments").textContent=e.length,document.getElementById("runningApps").textContent=e.filter(n=>n.status==="success").length;const t=document.getElementById("recentActivity");e.length>0?t.innerHTML=e.slice(0,5).map(n=>`
          <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
            <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 0.25rem;">${n.container_name}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">
              ${new Date(n.created_at).toLocaleString()}
            </div>
          </div>
        `).join(""):t.innerHTML='<p style="text-align: center; color: var(--text-secondary); padding: 1rem 0;">No recent activity</p>'}}catch(o){console.error("Error loading dashboard:",o)}}async function he(o){var p,l,u,y;if(o.preventDefault(),!x){d("Please login to deploy applications","error"),window.location.href="/login";return}const e=o.target,t=((p=document.getElementById("deploy-type"))==null?void 0:p.value)||"single",n=(l=document.getElementById("git-url"))==null?void 0:l.value.trim(),a=(u=document.getElementById("frontend-url"))==null?void 0:u.value.trim(),i=(y=document.getElementById("backend-url"))==null?void 0:y.value.trim(),s=document.getElementById("deploy-status"),c=document.getElementById("deploy-success");if(c.style.display="none",s.textContent="",t==="split"){if(!a||!a.startsWith("http")||!i||!i.startsWith("http")){s.textContent="Please enter valid Frontend and Backend repository URLs",s.style.color="var(--error)";return}}else if(!n||!n.startsWith("http")){s.textContent="Please enter a valid Git repository URL",s.style.color="var(--error)";return}s.textContent="🚀 Deploying...",s.style.color="var(--primary)";try{const m=new FormData;t==="split"?(m.append("deploy_type","split"),m.append("frontend_url",a),m.append("backend_url",i)):(m.append("deploy_type","single"),m.append("git_url",n)),typeof r=="object"&&r&&r.id&&m.append("project_id",String(r.id));const C=await fetch("/deploy",{method:"POST",headers:j(),body:m}),k=await C.json();C.ok?(s.textContent="✅ Deployment successful!",s.style.color="var(--success)",k.deployed_url&&(c.style.display="block",document.getElementById("openAppBtn").href=k.deployed_url,document.getElementById("openAppBtn").textContent=`Open ${k.deployed_url}`),e.reset(),setTimeout(()=>{fe(),L.navigate("/applications")},2e3)):(s.textContent=`❌ Error: ${k.detail||"Deployment failed"}`,s.style.color="var(--error)")}catch{s.textContent="❌ Network error. Please try again.",s.style.color="var(--error)"}}async function we(){if(!x){document.getElementById("applicationsGrid").innerHTML=`
      <div class="empty-state">
        <p>Please login to view your applications</p>
        <a href="/login" class="btn-primary">Login</a>
      </div>
    `;return}try{const o=await fetch("/deployments",{headers:j()});if(o.ok){const e=await o.json(),t=document.getElementById("applicationsGrid");e.length===0?t.innerHTML=`
          <div class="empty-state">
            <p>No applications deployed yet</p>
            <a href="/deploy" class="btn-primary">Deploy Your First App</a>
          </div>
        `:t.innerHTML=e.map(n=>`
          <div class="application-card" onclick="window.open('${n.deployed_url||"#"}', '_blank')">
            <h3>${n.container_name}</h3>
            <p style="color: var(--text-secondary); margin: 0.5rem 0;">
              ${n.git_url}
            </p>
            <div style="margin-top: 1rem;">
              <span class="status-badge ${n.status}">
                ${n.status==="success"?"✅":n.status==="failed"?"❌":"🔄"} 
                ${n.status}
              </span>
            </div>
            ${n.deployed_url?`
              <div style="margin-top: 1rem;">
                <a href="${n.deployed_url}" target="_blank" class="btn-primary" style="width: 100%;">
                  Open Application
                </a>
              </div>
            `:""}
          </div>
        `).join("")}}catch(o){console.error("Error loading applications:",o)}}async function U(){if(!x){document.getElementById("historyTableBody").innerHTML=`
      <tr>
        <td colspan="5" class="empty-state">Please login to view deployment history</td>
      </tr>
    `;return}try{const o=await fetch("/deployments",{headers:j()});if(o.ok){const e=await o.json(),t=document.getElementById("historyTableBody");e.length===0?t.innerHTML=`
          <tr>
            <td colspan="5" class="empty-state">No deployment history</td>
          </tr>
        `:t.innerHTML=e.map(n=>`
          <tr>
            <td><strong>${n.container_name}</strong></td>
            <td>
              <span class="status-badge ${n.status}">
                ${n.status==="success"?"✅":n.status==="failed"?"❌":"🔄"} 
                ${n.status}
              </span>
            </td>
            <td>
              ${n.deployed_url?`<a href="${n.deployed_url}" target="_blank">${n.deployed_url}</a>`:"N/A"}
            </td>
            <td>${new Date(n.created_at).toLocaleString()}</td>
            <td>
              ${n.status==="success"?`<button class="btn-secondary" onclick="destroyDeployment('${n.container_name}')">Destroy</button>`:"-"}
            </td>
          </tr>
        `).join("")}}catch(o){console.error("Error loading history:",o)}}async function be(){if(confirm("Are you sure you want to clear all deployment history?"))try{(await fetch("/deployments/clear",{method:"DELETE",headers:j()})).ok&&(d("History cleared successfully","success"),U())}catch{d("Error clearing history","error")}}async function Ee(o){if(confirm(`Are you sure you want to destroy "${o}"?`))try{(await fetch(`/deployments/${o}`,{method:"DELETE",headers:j()})).ok?(d("Deployment destroyed successfully","success"),U(),we()):d("Error destroying deployment","error")}catch{d("Network error","error")}}async function ke(){const o=document.getElementById("usernameSearch").value.trim();if(!o){d("Please enter a GitHub username","error");return}const e=document.getElementById("repositoriesGrid");e.innerHTML='<div class="empty-state"><p>Loading repositories...</p></div>';try{const t=await fetch(`/api/repositories/${o}`),n=await t.json();t.ok&&n.repositories?n.repositories.length===0?e.innerHTML='<div class="empty-state"><p>No repositories found</p></div>':e.innerHTML=n.repositories.map(a=>`
          <div class="repository-card">
            <h3>${a.name}</h3>
            <p style="color: var(--text-secondary); margin: 0.5rem 0;">
              ${a.description||"No description"}
            </p>
            <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.875rem; color: var(--text-secondary);">
                ${a.language||"Unknown"} • ${a.stargazers_count||0} stars
              </span>
              <button class="btn-primary btn-small" onclick="importRepository('${a.clone_url}', '${a.name}')">
                📥 Import
              </button>
            </div>
        </div>
    `).join(""):e.innerHTML=`<div class="empty-state"><p>${n.detail||"Error loading repositories"}</p></div>`}catch{e.innerHTML='<div class="empty-state"><p>Error loading repositories</p></div>'}}function Ie(o){document.getElementById("git-url").value=o,L.navigate("/deploy"),d("Repository selected","success")}async function Be(o,e){const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t){d("Please login first","error");return}try{d("Importing repository...","info");const n=await fetch("/api/import",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${t}`},body:new URLSearchParams({git_url:o,app_name:e||o.split("/").pop()||"Untitled Project"})}),a=await n.json();if(n.ok){d("Repository imported successfully! Navigate to Projects to see it.","success");const i=document.getElementById("page-projects");i&&i.style.display!=="none"&&P()}else d(a.detail||"Failed to import repository","error")}catch(n){console.error("Error importing repository:",n),d("Failed to import repository: "+n.message,"error")}}function Se(){document.getElementById("repositoriesGrid").innerHTML=`
    <div class="empty-state">
      <p>Search for a GitHub username to see their repositories</p>
            </div>
        `}function d(o,e="info"){const t=document.getElementById("toast");t.textContent=o,t.className=`toast show ${e}`,setTimeout(()=>{t.classList.remove("show")},3e3)}let E={},_=[],$=null;async function xe(){const o=document.getElementById("projectSelector");if(o)try{const e=localStorage.getItem("access_token")||localStorage.getItem("authToken"),t=await fetch("/deployments",{headers:{Authorization:`Bearer ${e}`}});if(t.ok){const n=await t.json();o.innerHTML='<option value="">All Projects (Global)</option>',n.forEach(a=>{var s;const i=document.createElement("option");i.value=a.id,i.textContent=a.app_name||((s=a.repository_url)==null?void 0:s.split("/").pop())||`Project ${a.id}`,o.appendChild(i)})}}catch(e){console.error("Error loading projects:",e)}}async function A(){await xe();try{const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o){const n=document.getElementById("envVarsList");n&&(n.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `),R();return}const e=$?`/api/env-vars?project_id=${$}`:"/api/env-vars",t=await fetch(e,{headers:{Authorization:`Bearer ${o}`}});if(t.ok){const n=await t.json();E=n.variables||{},_=n.vars_list||[],Ce()}else if(t.status===401){localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),T();const n=document.getElementById("envVarsList");n&&(n.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `)}else console.error("Failed to load environment variables")}catch(o){console.error("Error loading environment variables:",o)}R()}function R(){const o=document.getElementById("importEnvBtn"),e=document.getElementById("addEnvVarBtn"),t=document.getElementById("importEnvCard"),n=document.getElementById("cancelImportBtn"),a=document.getElementById("importEnvForm"),i=document.getElementById("projectSelector");i&&i.addEventListener("change",async s=>{$=s.target.value?parseInt(s.target.value):null,await A()}),o&&(o.onclick=()=>{t.style.display=t.style.display==="none"?"block":"none"}),n&&(n.onclick=()=>{t.style.display="none",document.getElementById("envFileInput").value=""}),e&&(e.onclick=()=>{Le()}),a&&(a.onsubmit=async s=>{s.preventDefault();const p=document.getElementById("envFileInput").files[0];p&&await je(p)})}async function je(o){try{const t=(await o.text()).split(`
`),n={};t.forEach(a=>{if(a=a.trim(),a&&!a.startsWith("#")&&a.includes("=")){const[i,...s]=a.split("="),c=s.join("=").trim().replace(/^["']|["']$/g,"");i.trim()&&(n[i.trim()]=c)}}),E={...E,...n},await H(),document.getElementById("importEnvCard").style.display="none",document.getElementById("envFileInput").value="",d("Environment variables imported successfully!","success")}catch(e){console.error("Error importing .env file:",e),d("Failed to import .env file","error")}}function Ce(){const o=document.getElementById("envVarsList");if(o){if(_.length===0){o.innerHTML=`
      <div class="empty-state">
        <p>No environment variables configured</p>
        <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.5rem;">
          Click "Add Variable" to create one, or import from a .env file
        </p>
            </div>
        `;return}o.innerHTML=`
    <table class="env-vars-table">
      <thead>
        <tr>
          <th class="name-col">Name</th>
          <th class="updated-col">Last updated</th>
          <th class="actions-col"></th>
        </tr>
      </thead>
      <tbody>
        ${_.map((e,t)=>{const n=e.updated_at?S(new Date(e.updated_at)):"never",a=e.project_id?'<span style="font-size: 0.75rem; background: var(--primary); color: white; padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Project</span>':'<span style="font-size: 0.75rem; background: var(--bg-tertiary); color: var(--text-secondary); padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Global</span>';return`
            <tr>
              <td class="name-col">
                <span class="lock-icon">🔒</span>
                <span class="var-name">${w(e.key)}</span>
                ${a}
              </td>
              <td class="updated-col">
                <span class="updated-time">${n}</span>
              </td>
              <td class="actions-col">
                <button class="icon-btn edit-btn" onclick="editEnvVarModal('${w(e.key)}')" title="Edit">
                  ✏️
                </button>
                <button class="icon-btn delete-btn" onclick="deleteEnvVar('${w(e.key)}')" title="Delete">
                  🗑️
                </button>
              </td>
            </tr>
          `}).join("")}
      </tbody>
    </table>
  `}}function Le(){V()}function V(o=null,e=""){const t=document.getElementById("envVarModal"),n=document.getElementById("modalVarKey"),a=document.getElementById("modalVarValue"),i=document.getElementById("modalTitle");o?(i.textContent="Update environment variable",n.value=o,n.readOnly=!0,a.value=e):(i.textContent="Add environment variable",n.value="",n.readOnly=!1,a.value=""),t.style.display="flex"}function G(){const o=document.getElementById("envVarModal");o.style.display="none"}async function Pe(){const o=document.getElementById("modalVarKey"),e=document.getElementById("modalVarValue"),t=o.value.trim(),n=e.value.trim();if(!t){d("Variable name is required","error");return}E[t]=n,await H(),G()}function W(o){const e=E[o]||"";V(o,e)}async function $e(o){W(o)}async function Te(o){confirm(`Are you sure you want to delete ${o}?`)&&(delete E[o],await H(),d("Environment variable deleted","success"))}function Ae(o){const t=document.querySelectorAll(".env-var-row")[o];if(!t)return;const n=t.querySelector(".env-var-value input");n.type==="password"?n.type="text":n.type="password"}async function H(){try{const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");(await fetch("/api/env-vars",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${o}`},body:JSON.stringify({variables:E,project_id:$})})).ok?(await A(),d("Environment variables saved successfully","success")):(console.error("Failed to save environment variables"),d("Failed to save environment variables","error"))}catch(o){console.error("Error saving environment variables:",o),d("Error saving environment variables","error")}}function De(){const o=document.getElementById("modalVarValue"),e=document.querySelector('#envVarModal button[onclick*="toggleModalValueVisibility"]');o&&e&&(o.type==="password"?(o.type="text",e.textContent="🙈 Hide"):(o.type="password",e.textContent="👁️ Show"))}function w(o){const e=document.createElement("div");return e.textContent=o,e.innerHTML}async function K(){try{const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o)return;const e=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${o}`}});if(e.ok){const t=await e.json(),n=document.getElementById("userName"),a=document.getElementById("userEmail"),i=document.getElementById("userAvatar");localStorage.setItem("displayName",t.display_name||""),localStorage.setItem("userEmail",t.email||""),n&&(n.textContent=t.display_name||t.username||"User"),He(t.display_name||t.username||"User"),a&&(a.textContent=t.email||"Logged in"),i&&(t.avatar_url?(i.style.backgroundImage=`url(${t.avatar_url})`,i.style.backgroundSize="cover",i.style.backgroundPosition="center",i.textContent=""):(i.style.backgroundImage="",i.textContent=(t.display_name||t.username||"U").charAt(0).toUpperCase()))}else e.status===401&&(localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),T())}catch(o){console.error("Error loading user profile:",o)}}async function _e(){try{const o=localStorage.getItem("access_token")||localStorage.getItem("authToken"),e=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${o}`}});if(e.ok){const t=await e.json();document.getElementById("username").value=t.username||"",document.getElementById("email").value=t.email||"",document.getElementById("displayName").value=t.display_name||"",t.avatar_url&&(document.getElementById("avatarPreview").src=t.avatar_url,document.getElementById("avatarPreview").style.display="block",document.getElementById("avatarPlaceholder").style.display="none",document.getElementById("removeAvatarBtn").style.display="block")}}catch(o){console.error("Error loading profile:",o)}Me()}function Me(){const o=document.getElementById("profileForm"),e=document.getElementById("avatarFile"),t=document.getElementById("removeAvatarBtn");o&&o.addEventListener("submit",Ve),e&&e.addEventListener("change",Ne),t&&t.addEventListener("click",Ue)}function Ne(o){const e=o.target.files[0];if(e){const t=new FileReader;t.onload=n=>{document.getElementById("avatarPreview").src=n.target.result,document.getElementById("avatarPreview").style.display="block",document.getElementById("avatarPlaceholder").style.display="none",document.getElementById("removeAvatarBtn").style.display="block"},t.readAsDataURL(e)}}function Ue(){document.getElementById("avatarPreview").src="",document.getElementById("avatarPreview").style.display="none",document.getElementById("avatarPlaceholder").style.display="block",document.getElementById("removeAvatarBtn").style.display="none",document.getElementById("avatarFile").value=""}async function Ve(o){o.preventDefault();const e=document.getElementById("profileMessage");e.style.display="none";const t=new FormData;t.append("email",document.getElementById("email").value),t.append("display_name",document.getElementById("displayName").value);const n=document.getElementById("currentPassword").value,a=document.getElementById("newPassword").value,i=document.getElementById("confirmPassword").value;if(a||n){if(a!==i){e.textContent="New passwords do not match",e.className="profile-message error",e.style.display="block";return}if(a.length<6){e.textContent="New password must be at least 6 characters",e.className="profile-message error",e.style.display="block";return}t.append("current_password",n),t.append("new_password",a)}const s=document.getElementById("avatarFile").files[0];s&&t.append("avatar",s),document.getElementById("avatarPreview").style.display==="none"&&t.append("remove_avatar","true");try{const c=localStorage.getItem("access_token")||localStorage.getItem("authToken"),p=await fetch("/api/user/profile",{method:"PUT",headers:{Authorization:`Bearer ${c}`},body:t}),l=await p.json();if(p.ok)e.textContent="Profile updated successfully!",e.className="profile-message success",e.style.display="block",l.username&&localStorage.setItem("username",l.username),document.getElementById("currentPassword").value="",document.getElementById("newPassword").value="",document.getElementById("confirmPassword").value="",await K(),d("Profile updated successfully!","success");else{const u=l.detail||l.message||"Failed to update profile";e.textContent=u,e.className="profile-message error",e.style.display="block",console.error("Profile update failed:",l)}}catch(c){console.error("Error updating profile:",c);try{const p=await response.json();e.textContent=p.detail||"Network error. Please try again."}catch{e.textContent="Network error. Please try again."}e.className="profile-message error",e.style.display="block"}}window.destroyDeployment=Ee;window.selectRepository=Ie;window.importRepository=Be;window.editEnvVar=$e;window.deleteEnvVar=Te;window.toggleEnvVarVisibility=Ae;window.saveEnvVarFromModal=Pe;window.closeEnvVarModal=G;window.toggleModalValueVisibility=De;window.editEnvVarModal=W;window.showEnvVarModal=V;window.selectProject=N;window.showProjectSidebar=F;window.hideProjectSidebar=me;window.openProject=ve;window.loadUserProfileIntoProjectSidebar=z;window.openProjectSite=de;window.deleteProject=X;function He(o){const e=document.getElementById("teamName");e&&(e.textContent=`${o}'s team`),document.querySelectorAll(".project-owner").forEach(n=>{n.textContent=`${o}'s team`})}let v=null,I=!1,h=[];function Y(){const o=document.getElementById("logsContent");o&&(o.innerHTML='<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Connecting to WebSocket...</p>',J(),Re())}function J(){v&&v.close();const e=`${window.location.protocol==="https:"?"wss:":"ws:"}//${window.location.host}/ws/logs`;v=new WebSocket(e),v.onopen=()=>{console.log("Logs WebSocket connected"),f("Connected to logs stream","success"),h.length>0&&(h.forEach(t=>f(t.message,t.type)),h=[])},v.onmessage=t=>{try{const n=JSON.parse(t.data);I?h.push({message:n.message,type:n.type||"info"}):f(n.message,n.type||"info")}catch(n){console.error("Error parsing log message:",n),f(t.data,"info")}},v.onerror=t=>{console.error("Logs WebSocket error:",t),f("WebSocket connection error","error")},v.onclose=()=>{console.log("Logs WebSocket disconnected"),f("Disconnected from logs stream","warning"),setTimeout(()=>{var t;((t=document.getElementById("page-logs"))==null?void 0:t.style.display)!=="none"&&J()},3e3)}}function f(o,e="info"){const t=document.getElementById("logsContent");if(!t)return;const n=new Date().toLocaleTimeString(),a=document.createElement("div");a.className=`log-entry ${e}`,a.innerHTML=`
    <span class="log-timestamp">[${n}]</span>
    <span class="log-message">${w(o)}</span>
  `,t.appendChild(a),t.scrollTop=t.scrollHeight;const i=1e3,s=t.querySelectorAll(".log-entry");s.length>i&&s[0].remove()}function Re(){const o=document.getElementById("clearLogsBtn"),e=document.getElementById("toggleLogsBtn");o&&o.addEventListener("click",()=>{const t=document.getElementById("logsContent");t&&(t.innerHTML="",h=[],f("Logs cleared","info"))}),e&&e.addEventListener("click",()=>{I=!I,e.textContent=I?"Resume":"Pause",!I&&h.length>0&&(h.forEach(t=>f(t.message,t.type)),h=[]),f(I?"Logs paused":"Logs resumed","info")})}window.addEventListener("beforeunload",()=>{v&&v.close()});function Fe(){const o=document.getElementById("sidebarSearch"),e=document.getElementById("commandPalette"),t=document.getElementById("commandSearchInput"),n=document.querySelectorAll(".command-item");let a=-1;function i(){e&&(e.style.display="flex",t&&(t.focus(),t.value=""),a=-1,c())}function s(){e&&(e.style.display="none",a=-1)}function c(){const l=Array.from(n).filter(u=>u.style.display!=="none");n.forEach((u,y)=>{l.indexOf(u)===a?(u.classList.add("selected"),u.scrollIntoView({block:"nearest",behavior:"smooth"})):u.classList.remove("selected")})}function p(l){switch(s(),l){case"deploy":case"nav-deploy":window.router&&window.router.navigate("/deploy");break;case"add-env-var":window.showEnvVarModal&&window.showEnvVarModal();break;case"search-repos":case"nav-repositories":window.router&&window.router.navigate("/repositories");break;case"nav-projects":window.router&&window.router.navigate("/");break;case"nav-applications":window.router&&window.router.navigate("/applications");break;case"nav-history":window.router&&window.router.navigate("/history");break;case"nav-env-vars":window.router&&window.router.navigate("/env-vars");break;case"nav-settings":window.router&&window.router.navigate("/settings");break}}document.addEventListener("keydown",l=>{var u;if((l.metaKey||l.ctrlKey)&&l.key==="k"&&(l.preventDefault(),e&&e.style.display==="none"?i():s()),l.key==="Escape"&&e&&e.style.display!=="none"&&s(),e&&e.style.display!=="none"){const y=Array.from(n).filter(m=>m.style.display!=="none");if(l.key==="ArrowDown")l.preventDefault(),a=Math.min(a+1,y.length-1),c();else if(l.key==="ArrowUp")l.preventDefault(),a=Math.max(a-1,-1),c();else if(l.key==="Enter"&&a>=0){l.preventDefault();const C=(u=Array.from(n).filter(k=>k.style.display!=="none")[a])==null?void 0:u.getAttribute("data-action");C&&p(C)}}}),o&&o.addEventListener("click",i),e&&e.addEventListener("click",l=>{l.target===e&&s()}),n.forEach(l=>{l.addEventListener("click",()=>{const u=l.getAttribute("data-action");u&&p(u)})}),t&&t.addEventListener("input",l=>{const u=l.target.value.toLowerCase();n.forEach(y=>{y.querySelector(".command-text").textContent.toLowerCase().includes(u)?y.style.display="flex":y.style.display="none"}),a=-1,c()})}
