import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */class Y{constructor(){this.routes={"/":"projects","/deploy":"deploy","/history":"history","/repositories":"repositories","/domain":"domain","/env-vars":"env-vars","/settings":"settings","/logs":"logs"},this.currentPage=null,this.init()}init(){document.querySelectorAll(".nav-item").forEach(e=>{e.addEventListener("click",t=>{t.preventDefault();const n=e.getAttribute("href");this.navigate(n)})}),window.addEventListener("popstate",()=>{this.loadPage(window.location.pathname)}),this.loadPage(window.location.pathname)}navigate(e){window.history.pushState({},"",e),this.loadPage(e)}loadPage(e){const t=this.routes[e]||"dashboard";this.showPage(t),this.updateActiveNav(e),this.updatePageTitle(t),window.scrollTo({top:0,behavior:"smooth"})}showPage(e){document.querySelectorAll(".page").forEach(n=>{n.style.display="none"});const t=document.getElementById(`page-${e}`);if(t)t.style.display="block";else{const n=document.getElementById("page-dashboard");n&&(n.style.display="block")}this.currentPage=e,this.loadPageData(e)}updateActiveNav(e){document.querySelectorAll(".nav-item").forEach(t=>{t.classList.remove("active"),t.getAttribute("href")===e&&t.classList.add("active")})}updatePageTitle(e){const t={projects:"Projects",deploy:"Deploy",history:"History",repositories:"Repositories",domain:"Domain","env-vars":"Environmental Variables",settings:"Settings",logs:"Logs"};document.getElementById("pageTitle").textContent=t[e]||"Dashboard"}loadPageData(e){switch(e){case"projects":P();break;case"history":N();break;case"repositories":we();break;case"domain":ae();break;case"env-vars":T();break;case"settings":Ce();break;case"logs":K();break}}}const j=new Y;window.router=j;let k=localStorage.getItem("access_token")||localStorage.getItem("authToken"),M=localStorage.getItem("username");document.addEventListener("DOMContentLoaded",()=>{A(),window.location.pathname==="/login"||window.location.pathname.includes("login.html")||setTimeout(()=>{if(k&&M){Q(),_e();const e=document.getElementById("page-projects");e&&window.location.pathname==="/"&&(e.style.display="block")}},100)});function A(){const o=document.getElementById("userSection"),e=document.getElementById("authButtons"),t=document.getElementById("logoutBtn"),n=document.getElementById("newDeployBtn");document.getElementById("userName"),document.getElementById("userEmail"),document.getElementById("userAvatar");const a=window.location.pathname==="/login"||window.location.pathname.includes("login.html");k&&M?(o.style.display="flex",e.style.display="none",t.style.display="block",n.style.display="block",W(),P(),a&&(window.location.href="/")):(o.style.display="none",e.style.display="block",t.style.display="none",n.style.display="none",a||(window.location.href="/login"))}function Q(){var r,s;document.getElementById("logoutBtn").addEventListener("click",()=>{localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),k=null,M=null,A(),p("Logged out successfully","success"),j.navigate("/")});const o=document.getElementById("projectsSearch");o&&o.addEventListener("input",l=>{const c=l.target.value.toLowerCase();C=h.filter(i=>i.name.toLowerCase().includes(c)||i.repository&&i.repository.toLowerCase().includes(c)),L(C)});const e=document.getElementById("addProjectBtn");e&&e.addEventListener("click",()=>{window.router&&window.router.navigate("/deploy")});const t=document.getElementById("browseUploadLink");t&&t.addEventListener("click",l=>{l.preventDefault(),window.router&&window.router.navigate("/deploy")}),document.getElementById("newDeployBtn").addEventListener("click",()=>{j.navigate("/deploy")});const n=document.getElementById("deployForm");n&&n.addEventListener("submit",ue);const a=document.getElementById("deploy-type");a&&a.addEventListener("change",l=>{const c=document.getElementById("single-repo-group"),i=document.getElementById("split-repo-group"),d=document.getElementById("git-url");l.target.value==="split"?(c.style.display="none",i.style.display="block",d&&d.removeAttribute("required")):(c.style.display="block",i.style.display="none",d&&d.setAttribute("required","required"))}),(r=document.getElementById("clearHistoryBtn"))==null||r.addEventListener("click",ge),(s=document.getElementById("searchReposBtn"))==null||s.addEventListener("click",ve),X()}function X(){const o=document.querySelector(".search-input"),e=document.getElementById("spotlightModal"),t=document.getElementById("spotlightSearch"),n=document.getElementById("spotlightResults");!o||!e||!t||!n||(o.addEventListener("click",Z),e.addEventListener("click",a=>{a.target===e&&D()}),t.addEventListener("input",ee),n.addEventListener("click",ne),document.addEventListener("keydown",a=>{a.key==="Escape"&&e.style.display!=="none"&&D()}))}function Z(){const o=document.getElementById("spotlightModal"),e=document.getElementById("spotlightSearch");o.style.display="flex",setTimeout(()=>{e.focus()},100)}function D(){const o=document.getElementById("spotlightModal"),e=document.getElementById("spotlightSearch"),t=document.getElementById("spotlightResults");o.style.display="none",e.value="",t.innerHTML=`
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
  `}function ee(o){const e=o.target.value.toLowerCase().trim(),t=document.getElementById("spotlightResults");if(!e){t.innerHTML=`
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
    `;return}const n=te(e);oe(n)}function te(o){const e={projects:[],actions:[],navigation:[]};h&&h.length>0&&(e.projects=h.filter(a=>a.name.toLowerCase().includes(o)||a.repository&&a.repository.toLowerCase().includes(o)));const t=[{name:"New Deploy",action:"new-deploy",icon:"🚀"},{name:"Repositories",action:"repositories",icon:"📁"},{name:"History",action:"history",icon:"📜"},{name:"Settings",action:"settings",icon:"⚙️"},{name:"Domain",action:"domain",icon:"🌐"}];e.actions=t.filter(a=>a.name.toLowerCase().includes(o));const n=[{name:"Projects",action:"projects",icon:"📊"},{name:"Repositories",action:"repositories",icon:"📁"},{name:"History",action:"history",icon:"📜"},{name:"Domain",action:"domain",icon:"🌐"},{name:"Settings",action:"settings",icon:"⚙️"}];return e.navigation=n.filter(a=>a.name.toLowerCase().includes(o)),e}function oe(o){const e=document.getElementById("spotlightResults");let t='<div class="search-results">';o.projects.length>0&&(t+='<div class="search-category">',t+='<div class="search-category-title">Projects</div>',o.projects.forEach(n=>{const a=n.status==="running"?"🚀":"📦",r=n.status==="running"?"RUNNING":n.status==="failed"?"FAILED":"IMPORTED";t+=`
        <div class="search-result-item" data-type="project" data-id="${n.id}">
          <span class="search-result-icon">${a}</span>
          <div class="search-result-content">
            <div class="search-result-title">${w(n.name)}</div>
            <div class="search-result-subtitle">${n.repository||"No repository"}</div>
          </div>
          <span class="search-result-badge">${r}</span>
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
    `),t+="</div>",e.innerHTML=t}function ne(o){const e=o.target.closest(".suggestion-item, .search-result-item");if(!e)return;const t=e.dataset.action,n=e.dataset.type,a=e.dataset.id;if(D(),n==="project"&&a)V(parseInt(a));else if(t)switch(t){case"new-deploy":window.router&&window.router.navigate("/deploy");break;case"repositories":window.router&&window.router.navigate("/repositories");break;case"history":window.router&&window.router.navigate("/history");break;case"domain":window.router&&window.router.navigate("/domain");break;case"settings":window.router&&window.router.navigate("/settings");break;case"projects":window.router&&window.router.navigate("/projects");break}}function ae(){document.getElementById("page-domain")}function B(){const o={},e=localStorage.getItem("access_token")||localStorage.getItem("authToken");return e&&(o.Authorization=`Bearer ${e}`),o}let h=[],C=[];async function P(){const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o){L([]);return}se();try{const e=await fetch("/deployments",{headers:{Authorization:`Bearer ${o}`}});e.ok?(h=(await e.json()).map(n=>{var i;const a=n.repository_url||n.git_url,r=a?(i=String(a).split("/").pop())==null?void 0:i.replace(/\.git$/,""):null,s=n.app_name||r||n.container_name||"Untitled Project",l=(n.status||"").toLowerCase();let c;return l==="running"?c="running":l==="failed"||l==="error"?c="failed":c="imported",{id:n.id,name:s,status:c,url:n.deployed_url||n.app_url,createdAt:n.created_at,updatedAt:n.updated_at,repository:a}}),C=[...h],L(C)):L([])}catch(e){console.error("Error loading projects:",e),L([])}}function L(o){const e=document.getElementById("projectsGrid");if(e){if(o.length===0){e.innerHTML=`
      <div class="empty-state">
        <p>No projects found</p>
        <button class="btn-primary" onclick="if(window.router){window.router.navigate('/deploy');}else{window.location.href='/deploy';}">Create First Project</button>
      </div>
    `;return}e.innerHTML=o.map(t=>{const n=t.status==="running"?"status-success":t.status==="failed"?"status-error":"status-info",a=t.status==="running"?"Running":t.status==="failed"?"Failed":"Imported",r=t.status==="running"?"🚀":"📦",s=t.updatedAt?x(t.updatedAt):"Recently";return`
      <div class="project-card" data-project-id="${t.id}" onclick="selectProject(${t.id})">
        <div class="project-header">
          <div class="project-icon">${r}</div>
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
              <span class="metric-value">99.9%</span>
            </div>
            <div class="metric">
              <span class="metric-label">Status</span>
              <span class="metric-value">Active</span>
            </div>
          </div>
          `:""}
        </div>
        
        <div class="project-actions">
          <button class="btn-icon" title="View logs" onclick="event.stopPropagation(); viewProjectLogs(${t.id})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
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
    `}).join("")}}function se(){const o=document.getElementById("projectsGrid");o&&(o.innerHTML=`
    <div class="loading-skeleton">
      ${Array(3).fill(`
        <div class="skeleton-card">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line short"></div>
        </div>
      `).join("")}
    </div>
  `)}let u=null;function V(o){const e=h.find(t=>t.id==o);e&&(u=e,F(e))}function F(o){const e=document.getElementById("sidebar");e&&(e.style.display="none");let t=document.getElementById("projectSidebar");t||(t=re(),document.body.appendChild(t));const n=t.querySelector("#projectSidebarName");n&&(n.textContent=o.name);const a=t.querySelector("#projectSidebarId");a&&(a.textContent=o.id),t.style.display="block",document.getElementById("pageTitle").textContent=o.name,z(),q("deploy")}function re(){const o=document.createElement("aside");return o.id="projectSidebar",o.className="sidebar project-sidebar",o.innerHTML=`
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
  `,o.querySelectorAll(".project-nav-item").forEach(e=>{e.addEventListener("click",t=>{t.preventDefault();const n=e.getAttribute("data-project-page");q(n),o.querySelectorAll(".project-nav-item").forEach(a=>a.classList.remove("active")),e.classList.add("active")})}),o}function ie(){const o=document.getElementById("projectSidebar");o&&(o.style.display="none");const e=document.getElementById("sidebar");e&&(e.style.display="block"),u=null,document.getElementById("pageTitle").textContent="Projects",document.querySelectorAll(".page").forEach(n=>{n.style.display="none"});const t=document.getElementById("page-projects");t&&(t.style.display="block"),P()}function q(o){switch(document.querySelectorAll(".page").forEach(e=>{e.style.display="none"}),o){case"deploy":const e=document.getElementById("page-deploy");e&&(e.style.display="block"),document.getElementById("pageTitle").textContent="Deploy";break;case"configuration":le();break;case"logs":const t=document.getElementById("page-logs");t&&(t.style.display="block",K());break;case"domain-config":ce();break;case"env-vars":const n=document.getElementById("page-env-vars");n&&(n.style.display="block",T());break}}function le(){let o=document.getElementById("page-project-config");o||(o=document.createElement("div"),o.id="page-project-config",o.className="page",o.innerHTML=`
      <div class="card">
        <h2>Project Configuration</h2>
        <div class="project-config-grid">
          <div class="config-item">
            <label>Project Name</label>
            <div class="config-value">
              <span id="projectConfigName">${(u==null?void 0:u.name)||"Unknown"}</span>
              <button class="btn-secondary" id="changeProjectNameBtn">Change</button>
          </div>
            </div>
          <div class="config-item">
            <label>Project ID</label>
            <div class="config-value" id="projectConfigId">${(u==null?void 0:u.id)||"-"}</div>
          </div>
          <div class="config-item">
            <label>Created</label>
            <div class="config-value" id="projectConfigCreated">${u!=null&&u.createdAt?x(new Date(u.createdAt)):"Unknown"}</div>
          </div>
          <div class="config-item">
            <label>Last Updated</label>
            <div class="config-value" id="projectConfigUpdated">${u!=null&&u.updatedAt?x(new Date(u.updatedAt)):"Unknown"}</div>
          </div>
        </div>
      </div>
    `,document.getElementById("pageContent").appendChild(o)),o.style.display="block"}function ce(){let o=document.getElementById("page-project-domain");o||(o=document.createElement("div"),o.id="page-project-domain",o.className="page",o.innerHTML=`
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
    `,document.getElementById("pageContent").appendChild(o)),o.style.display="block"}function de(o){V(o)}async function z(){const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o){console.log("No auth token found");return}try{const e=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${o}`}});if(e.ok){const t=await e.json(),n=document.getElementById("projectSidebar");if(n){const a=n.querySelector("#projectSidebarUserName"),r=n.querySelector("#projectSidebarUserEmail"),s=n.querySelector("#projectSidebarUserAvatar");if(a&&(a.textContent=t.display_name||t.username||"User"),r&&(r.textContent=t.email||"No email"),s)if(t.avatar_url){const l=new Image;l.onload=()=>{s.style.backgroundImage=`url(${t.avatar_url})`,s.style.backgroundSize="cover",s.style.backgroundPosition="center",s.textContent=""},l.onerror=()=>{s.style.backgroundImage="",s.textContent=(t.display_name||t.username||"U").charAt(0).toUpperCase()},l.src=t.avatar_url}else s.style.backgroundImage="",s.textContent=(t.display_name||t.username||"U").charAt(0).toUpperCase()}}else console.error("Failed to load user profile:",e.status)}catch(e){console.error("Error loading user profile:",e)}}function x(o){if(!o)return"Recently";const t=Date.now()-new Date(o).getTime(),n=Math.floor(t/6e4),a=Math.floor(t/36e5),r=Math.floor(t/864e5);if(n<1)return"Just now";if(n<60)return`${n}m ago`;if(a<24)return`${a}h ago`;if(r<7)return`${r}d ago`;const s=new Date(o);return s.toLocaleDateString("en-US",{month:"short",day:"numeric",year:s.getFullYear()!==new Date().getFullYear()?"numeric":void 0})}async function pe(){await P();try{const o=await fetch("/deployments",{headers:B()});if(o.ok){const e=await o.json();document.getElementById("totalDeployments").textContent=e.length,document.getElementById("runningApps").textContent=e.filter(n=>n.status==="success").length;const t=document.getElementById("recentActivity");e.length>0?t.innerHTML=e.slice(0,5).map(n=>`
          <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
            <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 0.25rem;">${n.container_name}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">
              ${new Date(n.created_at).toLocaleString()}
            </div>
          </div>
        `).join(""):t.innerHTML='<p style="text-align: center; color: var(--text-secondary); padding: 1rem 0;">No recent activity</p>'}}catch(o){console.error("Error loading dashboard:",o)}}async function ue(o){var c,i,d,g;if(o.preventDefault(),!k){p("Please login to deploy applications","error"),window.location.href="/login";return}const e=o.target,t=((c=document.getElementById("deploy-type"))==null?void 0:c.value)||"single",n=(i=document.getElementById("git-url"))==null?void 0:i.value.trim(),a=(d=document.getElementById("frontend-url"))==null?void 0:d.value.trim(),r=(g=document.getElementById("backend-url"))==null?void 0:g.value.trim(),s=document.getElementById("deploy-status"),l=document.getElementById("deploy-success");if(l.style.display="none",s.textContent="",t==="split"){if(!a||!a.startsWith("http")||!r||!r.startsWith("http")){s.textContent="Please enter valid Frontend and Backend repository URLs",s.style.color="var(--error)";return}}else if(!n||!n.startsWith("http")){s.textContent="Please enter a valid Git repository URL",s.style.color="var(--error)";return}s.textContent="🚀 Deploying...",s.style.color="var(--primary)";try{const m=new FormData;t==="split"?(m.append("deploy_type","split"),m.append("frontend_url",a),m.append("backend_url",r)):(m.append("deploy_type","single"),m.append("git_url",n));const S=await fetch("/deploy",{method:"POST",headers:B(),body:m}),b=await S.json();S.ok?(s.textContent="✅ Deployment successful!",s.style.color="var(--success)",b.deployed_url&&(l.style.display="block",document.getElementById("openAppBtn").href=b.deployed_url,document.getElementById("openAppBtn").textContent=`Open ${b.deployed_url}`),e.reset(),setTimeout(()=>{pe(),j.navigate("/applications")},2e3)):(s.textContent=`❌ Error: ${b.detail||"Deployment failed"}`,s.style.color="var(--error)")}catch{s.textContent="❌ Network error. Please try again.",s.style.color="var(--error)"}}async function me(){if(!k){document.getElementById("applicationsGrid").innerHTML=`
      <div class="empty-state">
        <p>Please login to view your applications</p>
        <a href="/login" class="btn-primary">Login</a>
      </div>
    `;return}try{const o=await fetch("/deployments",{headers:B()});if(o.ok){const e=await o.json(),t=document.getElementById("applicationsGrid");e.length===0?t.innerHTML=`
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
        `).join("")}}catch(o){console.error("Error loading applications:",o)}}async function N(){if(!k){document.getElementById("historyTableBody").innerHTML=`
      <tr>
        <td colspan="5" class="empty-state">Please login to view deployment history</td>
      </tr>
    `;return}try{const o=await fetch("/deployments",{headers:B()});if(o.ok){const e=await o.json(),t=document.getElementById("historyTableBody");e.length===0?t.innerHTML=`
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
        `).join("")}}catch(o){console.error("Error loading history:",o)}}async function ge(){if(confirm("Are you sure you want to clear all deployment history?"))try{(await fetch("/deployments/clear",{method:"DELETE",headers:B()})).ok&&(p("History cleared successfully","success"),N())}catch{p("Error clearing history","error")}}async function ye(o){if(confirm(`Are you sure you want to destroy "${o}"?`))try{(await fetch(`/deployments/${o}`,{method:"DELETE",headers:B()})).ok?(p("Deployment destroyed successfully","success"),N(),me()):p("Error destroying deployment","error")}catch{p("Network error","error")}}async function ve(){const o=document.getElementById("usernameSearch").value.trim();if(!o){p("Please enter a GitHub username","error");return}const e=document.getElementById("repositoriesGrid");e.innerHTML='<div class="empty-state"><p>Loading repositories...</p></div>';try{const t=await fetch(`/api/repositories/${o}`),n=await t.json();t.ok&&n.repositories?n.repositories.length===0?e.innerHTML='<div class="empty-state"><p>No repositories found</p></div>':e.innerHTML=n.repositories.map(a=>`
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
    `).join(""):e.innerHTML=`<div class="empty-state"><p>${n.detail||"Error loading repositories"}</p></div>`}catch{e.innerHTML='<div class="empty-state"><p>Error loading repositories</p></div>'}}function fe(o){document.getElementById("git-url").value=o,j.navigate("/deploy"),p("Repository selected","success")}async function he(o,e){const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t){p("Please login first","error");return}try{p("Importing repository...","info");const n=await fetch("/deploy",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${t}`},body:new URLSearchParams({git_url:o,app_name:e||o.split("/").pop()||"Untitled Project"})}),a=await n.json();if(n.ok){p("Repository imported successfully! Navigate to Projects to see it.","success");const r=document.getElementById("page-projects");r&&r.style.display!=="none"&&P()}else p(a.detail||"Failed to import repository","error")}catch(n){console.error("Error importing repository:",n),p("Failed to import repository: "+n.message,"error")}}function we(){document.getElementById("repositoriesGrid").innerHTML=`
    <div class="empty-state">
      <p>Search for a GitHub username to see their repositories</p>
            </div>
        `}function p(o,e="info"){const t=document.getElementById("toast");t.textContent=o,t.className=`toast show ${e}`,setTimeout(()=>{t.classList.remove("show")},3e3)}let E={},_=[],$=null;async function Ee(){const o=document.getElementById("projectSelector");if(o)try{const e=localStorage.getItem("access_token")||localStorage.getItem("authToken"),t=await fetch("/deployments",{headers:{Authorization:`Bearer ${e}`}});if(t.ok){const n=await t.json();o.innerHTML='<option value="">All Projects (Global)</option>',n.forEach(a=>{var s;const r=document.createElement("option");r.value=a.id,r.textContent=a.app_name||((s=a.repository_url)==null?void 0:s.split("/").pop())||`Project ${a.id}`,o.appendChild(r)})}}catch(e){console.error("Error loading projects:",e)}}async function T(){await Ee();try{const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o){const n=document.getElementById("envVarsList");n&&(n.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `),R();return}const e=$?`/api/env-vars?project_id=${$}`:"/api/env-vars",t=await fetch(e,{headers:{Authorization:`Bearer ${o}`}});if(t.ok){const n=await t.json();E=n.variables||{},_=n.vars_list||[],Ie()}else if(t.status===401){localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),A();const n=document.getElementById("envVarsList");n&&(n.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `)}else console.error("Failed to load environment variables")}catch(o){console.error("Error loading environment variables:",o)}R()}function R(){const o=document.getElementById("importEnvBtn"),e=document.getElementById("addEnvVarBtn"),t=document.getElementById("importEnvCard"),n=document.getElementById("cancelImportBtn"),a=document.getElementById("importEnvForm"),r=document.getElementById("projectSelector");r&&r.addEventListener("change",async s=>{$=s.target.value?parseInt(s.target.value):null,await T()}),o&&(o.onclick=()=>{t.style.display=t.style.display==="none"?"block":"none"}),n&&(n.onclick=()=>{t.style.display="none",document.getElementById("envFileInput").value=""}),e&&(e.onclick=()=>{ke()}),a&&(a.onsubmit=async s=>{s.preventDefault();const c=document.getElementById("envFileInput").files[0];c&&await be(c)})}async function be(o){try{const t=(await o.text()).split(`
`),n={};t.forEach(a=>{if(a=a.trim(),a&&!a.startsWith("#")&&a.includes("=")){const[r,...s]=a.split("="),l=s.join("=").trim().replace(/^["']|["']$/g,"");r.trim()&&(n[r.trim()]=l)}}),E={...E,...n},await U(),document.getElementById("importEnvCard").style.display="none",document.getElementById("envFileInput").value="",p("Environment variables imported successfully!","success")}catch(e){console.error("Error importing .env file:",e),p("Failed to import .env file","error")}}function Ie(){const o=document.getElementById("envVarsList");if(o){if(_.length===0){o.innerHTML=`
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
        ${_.map((e,t)=>{const n=e.updated_at?x(new Date(e.updated_at)):"never",a=e.project_id?'<span style="font-size: 0.75rem; background: var(--primary); color: white; padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Project</span>':'<span style="font-size: 0.75rem; background: var(--bg-tertiary); color: var(--text-secondary); padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Global</span>';return`
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
  `}}function ke(){H()}function H(o=null,e=""){const t=document.getElementById("envVarModal"),n=document.getElementById("modalVarKey"),a=document.getElementById("modalVarValue"),r=document.getElementById("modalTitle");o?(r.textContent="Update environment variable",n.value=o,n.readOnly=!0,a.value=e):(r.textContent="Add environment variable",n.value="",n.readOnly=!1,a.value=""),t.style.display="flex"}function G(){const o=document.getElementById("envVarModal");o.style.display="none"}async function Be(){const o=document.getElementById("modalVarKey"),e=document.getElementById("modalVarValue"),t=o.value.trim(),n=e.value.trim();if(!t){p("Variable name is required","error");return}E[t]=n,await U(),G()}function O(o){const e=E[o]||"";H(o,e)}async function Se(o){O(o)}async function Le(o){confirm(`Are you sure you want to delete ${o}?`)&&(delete E[o],await U(),p("Environment variable deleted","success"))}function je(o){const t=document.querySelectorAll(".env-var-row")[o];if(!t)return;const n=t.querySelector(".env-var-value input");n.type==="password"?n.type="text":n.type="password"}async function U(){try{const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");(await fetch("/api/env-vars",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${o}`},body:JSON.stringify({variables:E,project_id:$})})).ok?(await T(),p("Environment variables saved successfully","success")):(console.error("Failed to save environment variables"),p("Failed to save environment variables","error"))}catch(o){console.error("Error saving environment variables:",o),p("Error saving environment variables","error")}}function Pe(){const o=document.getElementById("modalVarValue"),e=document.querySelector('#envVarModal button[onclick*="toggleModalValueVisibility"]');o&&e&&(o.type==="password"?(o.type="text",e.textContent="🙈 Hide"):(o.type="password",e.textContent="👁️ Show"))}function w(o){const e=document.createElement("div");return e.textContent=o,e.innerHTML}async function W(){try{const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o)return;const e=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${o}`}});if(e.ok){const t=await e.json(),n=document.getElementById("userName"),a=document.getElementById("userEmail"),r=document.getElementById("userAvatar");n&&(n.textContent=t.display_name||t.username||"User"),a&&(a.textContent=t.email||"Logged in"),r&&(t.avatar_url?(r.style.backgroundImage=`url(${t.avatar_url})`,r.style.backgroundSize="cover",r.style.backgroundPosition="center",r.textContent=""):(r.style.backgroundImage="",r.textContent=(t.display_name||t.username||"U").charAt(0).toUpperCase()))}else e.status===401&&(localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),A())}catch(o){console.error("Error loading user profile:",o)}}async function Ce(){try{const o=localStorage.getItem("access_token")||localStorage.getItem("authToken"),e=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${o}`}});if(e.ok){const t=await e.json();document.getElementById("username").value=t.username||"",document.getElementById("email").value=t.email||"",document.getElementById("displayName").value=t.display_name||"",t.avatar_url&&(document.getElementById("avatarPreview").src=t.avatar_url,document.getElementById("avatarPreview").style.display="block",document.getElementById("avatarPlaceholder").style.display="none",document.getElementById("removeAvatarBtn").style.display="block")}}catch(o){console.error("Error loading profile:",o)}xe()}function xe(){const o=document.getElementById("profileForm"),e=document.getElementById("avatarFile"),t=document.getElementById("removeAvatarBtn");o&&o.addEventListener("submit",Te),e&&e.addEventListener("change",$e),t&&t.addEventListener("click",Ae)}function $e(o){const e=o.target.files[0];if(e){const t=new FileReader;t.onload=n=>{document.getElementById("avatarPreview").src=n.target.result,document.getElementById("avatarPreview").style.display="block",document.getElementById("avatarPlaceholder").style.display="none",document.getElementById("removeAvatarBtn").style.display="block"},t.readAsDataURL(e)}}function Ae(){document.getElementById("avatarPreview").src="",document.getElementById("avatarPreview").style.display="none",document.getElementById("avatarPlaceholder").style.display="block",document.getElementById("removeAvatarBtn").style.display="none",document.getElementById("avatarFile").value=""}async function Te(o){o.preventDefault();const e=document.getElementById("profileMessage");e.style.display="none";const t=new FormData;t.append("email",document.getElementById("email").value),t.append("display_name",document.getElementById("displayName").value);const n=document.getElementById("currentPassword").value,a=document.getElementById("newPassword").value,r=document.getElementById("confirmPassword").value;if(a||n){if(a!==r){e.textContent="New passwords do not match",e.className="profile-message error",e.style.display="block";return}if(a.length<6){e.textContent="New password must be at least 6 characters",e.className="profile-message error",e.style.display="block";return}t.append("current_password",n),t.append("new_password",a)}const s=document.getElementById("avatarFile").files[0];s&&t.append("avatar",s),document.getElementById("avatarPreview").style.display==="none"&&t.append("remove_avatar","true");try{const l=localStorage.getItem("access_token")||localStorage.getItem("authToken"),c=await fetch("/api/user/profile",{method:"PUT",headers:{Authorization:`Bearer ${l}`},body:t}),i=await c.json();if(c.ok)e.textContent="Profile updated successfully!",e.className="profile-message success",e.style.display="block",i.username&&localStorage.setItem("username",i.username),document.getElementById("currentPassword").value="",document.getElementById("newPassword").value="",document.getElementById("confirmPassword").value="",await W(),p("Profile updated successfully!","success");else{const d=i.detail||i.message||"Failed to update profile";e.textContent=d,e.className="profile-message error",e.style.display="block",console.error("Profile update failed:",i)}}catch(l){console.error("Error updating profile:",l);try{const c=await response.json();e.textContent=c.detail||"Network error. Please try again."}catch{e.textContent="Network error. Please try again."}e.className="profile-message error",e.style.display="block"}}window.destroyDeployment=ye;window.selectRepository=fe;window.importRepository=he;window.editEnvVar=Se;window.deleteEnvVar=Le;window.toggleEnvVarVisibility=je;window.saveEnvVarFromModal=Be;window.closeEnvVarModal=G;window.toggleModalValueVisibility=Pe;window.editEnvVarModal=O;window.showEnvVarModal=H;window.selectProject=V;window.showProjectSidebar=F;window.hideProjectSidebar=ie;window.openProject=de;window.loadUserProfileIntoProjectSidebar=z;let y=null,I=!1,f=[];function K(){const o=document.getElementById("logsContent");o&&(o.innerHTML='<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Connecting to WebSocket...</p>',J(),De())}function J(){y&&y.close();const e=`${window.location.protocol==="https:"?"wss:":"ws:"}//${window.location.host}/ws/logs`;y=new WebSocket(e),y.onopen=()=>{console.log("Logs WebSocket connected"),v("Connected to logs stream","success"),f.length>0&&(f.forEach(t=>v(t.message,t.type)),f=[])},y.onmessage=t=>{try{const n=JSON.parse(t.data);I?f.push({message:n.message,type:n.type||"info"}):v(n.message,n.type||"info")}catch(n){console.error("Error parsing log message:",n),v(t.data,"info")}},y.onerror=t=>{console.error("Logs WebSocket error:",t),v("WebSocket connection error","error")},y.onclose=()=>{console.log("Logs WebSocket disconnected"),v("Disconnected from logs stream","warning"),setTimeout(()=>{var t;((t=document.getElementById("page-logs"))==null?void 0:t.style.display)!=="none"&&J()},3e3)}}function v(o,e="info"){const t=document.getElementById("logsContent");if(!t)return;const n=new Date().toLocaleTimeString(),a=document.createElement("div");a.className=`log-entry ${e}`,a.innerHTML=`
    <span class="log-timestamp">[${n}]</span>
    <span class="log-message">${w(o)}</span>
  `,t.appendChild(a),t.scrollTop=t.scrollHeight;const r=1e3,s=t.querySelectorAll(".log-entry");s.length>r&&s[0].remove()}function De(){const o=document.getElementById("clearLogsBtn"),e=document.getElementById("toggleLogsBtn");o&&o.addEventListener("click",()=>{const t=document.getElementById("logsContent");t&&(t.innerHTML="",f=[],v("Logs cleared","info"))}),e&&e.addEventListener("click",()=>{I=!I,e.textContent=I?"Resume":"Pause",!I&&f.length>0&&(f.forEach(t=>v(t.message,t.type)),f=[]),v(I?"Logs paused":"Logs resumed","info")})}window.addEventListener("beforeunload",()=>{y&&y.close()});function _e(){const o=document.getElementById("sidebarSearch"),e=document.getElementById("commandPalette"),t=document.getElementById("commandSearchInput"),n=document.querySelectorAll(".command-item");let a=-1;function r(){e&&(e.style.display="flex",t&&(t.focus(),t.value=""),a=-1,l())}function s(){e&&(e.style.display="none",a=-1)}function l(){const i=Array.from(n).filter(d=>d.style.display!=="none");n.forEach((d,g)=>{i.indexOf(d)===a?(d.classList.add("selected"),d.scrollIntoView({block:"nearest",behavior:"smooth"})):d.classList.remove("selected")})}function c(i){switch(s(),i){case"deploy":case"nav-deploy":window.router&&window.router.navigate("/deploy");break;case"add-env-var":window.showEnvVarModal&&window.showEnvVarModal();break;case"search-repos":case"nav-repositories":window.router&&window.router.navigate("/repositories");break;case"nav-projects":window.router&&window.router.navigate("/");break;case"nav-applications":window.router&&window.router.navigate("/applications");break;case"nav-history":window.router&&window.router.navigate("/history");break;case"nav-env-vars":window.router&&window.router.navigate("/env-vars");break;case"nav-settings":window.router&&window.router.navigate("/settings");break}}document.addEventListener("keydown",i=>{var d;if((i.metaKey||i.ctrlKey)&&i.key==="k"&&(i.preventDefault(),e&&e.style.display==="none"?r():s()),i.key==="Escape"&&e&&e.style.display!=="none"&&s(),e&&e.style.display!=="none"){const g=Array.from(n).filter(m=>m.style.display!=="none");if(i.key==="ArrowDown")i.preventDefault(),a=Math.min(a+1,g.length-1),l();else if(i.key==="ArrowUp")i.preventDefault(),a=Math.max(a-1,-1),l();else if(i.key==="Enter"&&a>=0){i.preventDefault();const S=(d=Array.from(n).filter(b=>b.style.display!=="none")[a])==null?void 0:d.getAttribute("data-action");S&&c(S)}}}),o&&o.addEventListener("click",r),e&&e.addEventListener("click",i=>{i.target===e&&s()}),n.forEach(i=>{i.addEventListener("click",()=>{const d=i.getAttribute("data-action");d&&c(d)})}),t&&t.addEventListener("input",i=>{const d=i.target.value.toLowerCase();n.forEach(g=>{g.querySelector(".command-text").textContent.toLowerCase().includes(d)?g.style.display="flex":g.style.display="none"}),a=-1,l()})}
