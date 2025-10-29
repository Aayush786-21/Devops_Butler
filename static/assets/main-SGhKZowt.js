import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */class ge{constructor(){this.routes={"/":"projects","/deploy":"deploy","/history":"history","/repositories":"repositories","/domain":"domain","/env-vars":"env-vars","/settings":"settings","/logs":"logs"},this.currentPage=null,this.init()}init(){document.querySelectorAll(".nav-item").forEach(e=>{e.addEventListener("click",t=>{t.preventDefault();const n=e.getAttribute("href");this.navigate(n)})}),window.addEventListener("popstate",()=>{this.loadPage(window.location.pathname)}),this.loadPage(window.location.pathname)}navigate(e){window.history.pushState({},"",e),this.loadPage(e)}loadPage(e){const t=this.routes[e]||"dashboard";this.showPage(t),this.updateActiveNav(e),this.updatePageTitle(t),window.scrollTo({top:0,behavior:"smooth"})}showPage(e){document.querySelectorAll(".page").forEach(n=>{n.style.display="none"});const t=document.getElementById(`page-${e}`);if(t)t.style.display="block";else{const n=document.getElementById("page-dashboard");n&&(n.style.display="block")}this.currentPage=e,this.loadPageData(e)}updateActiveNav(e){document.querySelectorAll(".nav-item").forEach(t=>{t.classList.remove("active"),t.getAttribute("href")===e&&t.classList.add("active")})}updatePageTitle(e){const t={projects:"Projects",deploy:"Deploy",history:"History",repositories:"Repositories",domain:"Domain","env-vars":"Environmental Variables",settings:"Settings",logs:"Logs"};document.getElementById("pageTitle").textContent=t[e]||"Dashboard"}loadPageData(e){switch(e){case"projects":D();break;case"history":K();break;case"repositories":qe();break;case"domain":je();break;case"env-vars":M();break;case"settings":Ze();break;case"logs":me();break}}}const P=new ge;window.router=P;async function ye(o){const e=await he();if(!e)return;const t=E.find(s=>s.id==o),n=t?t.name:"this project";if(await ve(n))try{console.log("Deleting project with token:",e.substring(0,20)+"...");const s=await fetch(`/projects/${o}`,{method:"DELETE",headers:{Authorization:`Bearer ${e}`}});if(console.log("Delete response status:",s.status),!s.ok){const r=await s.json().catch(()=>({}));if(console.error("Delete error response:",r),s.status===401){d("Session expired. Please login again.","error"),localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),setTimeout(()=>{window.location.href="/login"},2e3);return}throw new Error(r.detail||"Failed to delete project")}E=E.filter(r=>r.id!=o),B=B.filter(r=>r.id!=o),C(B),d("Project deleted","success")}catch(s){console.error("Delete project error:",s),d(`Delete failed: ${s.message}`,"error")}}function ve(o){return new Promise(e=>{const t=document.createElement("div");t.className="modal-overlay";const n=document.createElement("div");n.className="delete-confirmation-modal",n.innerHTML=`
      <div class="delete-confirmation-modal-center">
        <div class="delete-confirmation-icon-wrapper">
          <svg class="delete-confirmation-icon" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
            <path d="M10 11v6"></path>
            <path d="M14 11v6"></path>
            <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
          </svg>
        </div>
        <h3 class="delete-confirmation-title">Delete Project</h3>
        <p class="delete-confirmation-text">
          Are you sure you want to delete <strong>${f(o)}</strong>?<br>
          This will stop and remove its container and image.
        </p>
      </div>
      <div class="delete-confirmation-actions">
        <button class="cancel-btn">Cancel</button>
        <button class="delete-btn">Delete</button>
      </div>
    `,t.appendChild(n),document.body.appendChild(t);const a=n.querySelector(".cancel-btn"),s=n.querySelector(".delete-btn"),r=()=>{document.body.removeChild(t)};a.onclick=()=>{r(),e(!1)},s.onclick=()=>{r(),e(!0)},t.onclick=c=>{c.target===t&&(r(),e(!1))},s.focus()})}function fe(o){try{const t=JSON.parse(atob(o.split(".")[1])).exp*1e3,n=Date.now();return t<n+5*60*1e3}catch{return!0}}async function he(){const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");return!o||fe(o)?(d("Session expired. Please login again.","error"),localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),setTimeout(()=>{window.location.href="/login"},2e3),null):o}let x=localStorage.getItem("access_token")||localStorage.getItem("authToken"),O=localStorage.getItem("username");document.addEventListener("DOMContentLoaded",()=>{U(),window.location.pathname==="/login"||window.location.pathname.includes("login.html")||setTimeout(()=>{if(x&&O){we(),rt();const e=document.getElementById("page-projects");e&&window.location.pathname==="/"&&(e.style.display="block")}},100)});function U(){const o=document.getElementById("userSection"),e=document.getElementById("authButtons"),t=document.getElementById("logoutBtn"),n=document.getElementById("newDeployBtn");document.getElementById("userName"),document.getElementById("userEmail"),document.getElementById("userAvatar");const a=window.location.pathname==="/login"||window.location.pathname.includes("login.html");x&&O?(o.style.display="flex",e.style.display="none",t.style.display="block",n.style.display="block",pe(),D(),a&&(window.location.href="/")):(o.style.display="none",e.style.display="block",t.style.display="none",n.style.display="none",a||(window.location.href="/login"))}function we(){var s,r;document.getElementById("logoutBtn").addEventListener("click",()=>{localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),x=null,O=null,U(),d("Logged out successfully","success"),P.navigate("/")});const o=document.getElementById("projectsSearch");o&&o.addEventListener("input",c=>{const p=c.target.value.toLowerCase();B=E.filter(l=>l.name.toLowerCase().includes(p)||l.repository&&l.repository.toLowerCase().includes(p)),C(B)});const e=document.getElementById("addProjectBtn");e&&e.addEventListener("click",()=>{window.router&&window.router.navigate("/deploy")});const t=document.getElementById("browseUploadLink");t&&t.addEventListener("click",c=>{c.preventDefault(),window.router&&window.router.navigate("/deploy")}),document.getElementById("newDeployBtn").addEventListener("click",()=>{P.navigate("/deploy")});const n=document.getElementById("deployForm");n&&n.addEventListener("submit",De);const a=document.getElementById("deploy-type");a&&a.addEventListener("change",c=>{const p=document.getElementById("single-repo-group"),l=document.getElementById("split-repo-group"),m=document.getElementById("git-url");c.target.value==="split"?(p.style.display="none",l.style.display="block",m&&m.removeAttribute("required")):(p.style.display="block",l.style.display="none",m&&m.setAttribute("required","required"))}),(s=document.getElementById("clearHistoryBtn"))==null||s.addEventListener("click",Ne),(r=document.getElementById("searchReposBtn"))==null||r.addEventListener("click",ie),Ee()}function Ee(){const o=document.querySelector(".search-input"),e=document.getElementById("spotlightModal"),t=document.getElementById("spotlightSearch"),n=document.getElementById("spotlightResults");!o||!e||!t||!n||(o.addEventListener("click",be),e.addEventListener("click",a=>{a.target===e&&H()}),t.addEventListener("input",ke),n.addEventListener("click",Se),document.addEventListener("keydown",a=>{a.key==="Escape"&&e.style.display!=="none"&&H()}))}function be(){const o=document.getElementById("spotlightModal"),e=document.getElementById("spotlightSearch");o.style.display="flex",setTimeout(()=>{e.focus()},100)}function H(){const o=document.getElementById("spotlightModal"),e=document.getElementById("spotlightSearch"),t=document.getElementById("spotlightResults");o.style.display="none",e.value="",t.innerHTML=`
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
  `}function ke(o){const e=o.target.value.toLowerCase().trim(),t=document.getElementById("spotlightResults");if(!e){t.innerHTML=`
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
    `;return}const n=Ie(e);Be(n)}function Ie(o){const e={projects:[],actions:[],navigation:[]};E&&E.length>0&&(e.projects=E.filter(a=>a.name.toLowerCase().includes(o)||a.repository&&a.repository.toLowerCase().includes(o)));const t=[{name:"New Deploy",action:"new-deploy",icon:"🚀"},{name:"Repositories",action:"repositories",icon:"📁"},{name:"History",action:"history",icon:"📜"},{name:"Settings",action:"settings",icon:"⚙️"},{name:"Domain",action:"domain",icon:"🌐"}];e.actions=t.filter(a=>a.name.toLowerCase().includes(o));const n=[{name:"Projects",action:"projects",icon:"📊"},{name:"Repositories",action:"repositories",icon:"📁"},{name:"History",action:"history",icon:"📜"},{name:"Domain",action:"domain",icon:"🌐"},{name:"Settings",action:"settings",icon:"⚙️"}];return e.navigation=n.filter(a=>a.name.toLowerCase().includes(o)),e}function Be(o){const e=document.getElementById("spotlightResults");let t='<div class="search-results">';o.projects.length>0&&(t+='<div class="search-category">',t+='<div class="search-category-title">Projects</div>',o.projects.forEach(n=>{const a=n.status==="running"?"🚀":"📦",s=n.status==="running"?"RUNNING":n.status==="failed"?"FAILED":"IMPORTED";t+=`
        <div class="search-result-item" data-type="project" data-id="${n.id}">
          <span class="search-result-icon">${a}</span>
          <div class="search-result-content">
            <div class="search-result-title">${f(n.name)}</div>
            <div class="search-result-subtitle">${n.repository||"No repository"}</div>
          </div>
          <span class="search-result-badge">${s}</span>
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
        <p>No results found for "${f(document.getElementById("spotlightSearch").value)}"</p>
      </div>
    `),t+="</div>",e.innerHTML=t}function Se(o){const e=o.target.closest(".suggestion-item, .search-result-item");if(!e)return;const t=e.dataset.action,n=e.dataset.type,a=e.dataset.id;if(H(),n==="project"&&a)z(parseInt(a));else if(t)switch(t){case"new-deploy":window.router&&window.router.navigate("/deploy");break;case"repositories":window.router&&window.router.navigate("/repositories");break;case"history":window.router&&window.router.navigate("/history");break;case"domain":window.router&&window.router.navigate("/domain");break;case"settings":window.router&&window.router.navigate("/settings");break;case"projects":window.router&&window.router.navigate("/projects");break}}function je(){document.getElementById("page-domain")}function S(){const o={},e=localStorage.getItem("access_token")||localStorage.getItem("authToken");return e&&(o.Authorization=`Bearer ${e}`),o}let E=[],B=[];async function D(){const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o){C([]);return}Pe();try{const e=await fetch("/deployments",{headers:{Authorization:`Bearer ${o}`}});e.ok?(E=(await e.json()).map(n=>{var h;const a=n.repository_url||n.git_url,s=a?(h=String(a).split("/").pop())==null?void 0:h.replace(/\.git$/,""):null,r=n.app_name||s||n.container_name||"Untitled Project",c=(n.status||"").toLowerCase();let p;c==="running"?p="running":c==="failed"||c==="error"?p="failed":p="imported";let l=!1,m=null,g=null;const u=String(n.git_url||"");if(c==="imported_split"||u.startsWith("split::")){l=!0;try{const v=u.replace("split::","").split("|");v.length===2&&(m=v[0],g=v[1])}catch{}}return{id:n.id,name:r,status:p,url:n.deployed_url||n.app_url,createdAt:n.created_at,updatedAt:n.updated_at,repository:a,repository_url:a,isSplit:l,frontend_url:m,backend_url:g,containerUptime:n.container_uptime||"Unknown",containerPorts:n.container_ports||"No ports",containerImage:n.container_image||"Unknown",containerStatus:n.container_status||"Unknown",isRunning:n.is_running||!1}}),B=[...E],C(B)):C([])}catch(e){console.error("Error loading projects:",e),C([])}}function C(o){const e=document.getElementById("projectsGrid");if(e){if(o.length===0){e.innerHTML=`
      <div class="empty-state">
        <p>No projects found</p>
        <button class="btn-primary" onclick="if(window.router){window.router.navigate('/deploy');}else{window.location.href='/deploy';}">Create First Project</button>
      </div>
    `;return}e.innerHTML=o.map(t=>{const n=t.status==="running"?"status-success":t.status==="failed"?"status-error":"status-info",a=t.status==="running"?"Running":t.status==="failed"?"Failed":"Imported",s=t.status==="running"?"🚀":"📦",r=t.updatedAt?T(t.updatedAt):"Recently";return`
      <div class="project-card" data-project-id="${t.id}" onclick="selectProject(${t.id})">
        <div class="project-header">
          <div class="project-icon">${s}</div>
          <div class="project-status ${n}">${a}</div>
          </div>
        
        <div class="project-info">
          <h3 class="project-name">${f(t.name)}</h3>
          <div class="project-meta">
            <svg class="icon-clock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12,6 12,12 16,14"></polyline>
            </svg>
            <span>Updated ${r}</span>
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
        
        <div class="project-footer">
          ${t.status==="running"&&t.url?`
          <button class="btn-dark btn-block btn-open-site" onclick="event.stopPropagation(); openProjectSite(${t.id})">Open Site</button>
          `:""}
          <button class="btn-icon btn-danger btn-delete" title="Delete project" onclick="event.stopPropagation(); deleteProject(${t.id})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
              <path d="M10 11v6"></path>
              <path d="M14 11v6"></path>
              <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
            </svg>
            </button>
          </div>
        </div>
      `}).join("")}}async function Ce(o){try{const e=E.find(t=>t.id===o);if(!e){d("Project not found","error");return}if(!e.url||e.url==="#"){d("Project URL not available. Make sure the project is deployed.","error");return}window.open(e.url,"_blank"),d(`Opening ${e.name}...`,"info")}catch(e){console.error("Error opening project site:",e),d("Failed to open project site: "+e.message,"error")}}function Pe(){const o=document.getElementById("projectsGrid");o&&(o.innerHTML=`
    <div class="loading-skeleton">
      ${Array(3).fill(`
        <div class="skeleton-card">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line short"></div>
        </div>
      `).join("")}
    </div>
  `)}let i=null;function z(o){const e=E.find(n=>n.id==o);if(!e)return;i=e,ne(e);const t=document.getElementById("page-project-config");t&&t.style.display!=="none"&&G()}function ne(o){const e=document.getElementById("sidebar");e&&(e.style.display="none");let t=document.getElementById("projectSidebar");t||(t=Le(),document.body.appendChild(t));const n=t.querySelector("#projectSidebarName");n&&(n.textContent=o.name);const a=t.querySelector("#projectSidebarId");a&&(a.textContent=o.id),t.style.display="block",document.getElementById("pageTitle").textContent=o.name,re(),ae("deploy")}function Le(){const o=document.createElement("aside");return o.id="projectSidebar",o.className="sidebar project-sidebar",o.innerHTML=`
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
  `,o.querySelectorAll(".project-nav-item").forEach(e=>{e.addEventListener("click",t=>{t.preventDefault();const n=e.getAttribute("data-project-page");ae(n),o.querySelectorAll(".project-nav-item").forEach(a=>a.classList.remove("active")),e.classList.add("active")})}),o}function xe(){const o=document.getElementById("projectSidebar");o&&(o.style.display="none");const e=document.getElementById("sidebar");e&&(e.style.display="block"),i=null,document.getElementById("pageTitle").textContent="Projects",document.querySelectorAll(".page").forEach(n=>{n.style.display="none"});const t=document.getElementById("page-projects");t&&(t.style.display="block"),D()}function ae(o){switch(document.querySelectorAll(".page").forEach(e=>{e.style.display="none"}),o){case"deploy":const e=document.getElementById("page-deploy");if(e){e.style.display="block",document.getElementById("deploy-type");const a=document.getElementById("deploy-type-group"),s=document.getElementById("single-repo-group"),r=document.getElementById("split-repo-group"),c=document.getElementById("split-deploy-layout"),p=document.getElementById("git-url"),l=document.getElementById("frontend-url"),m=document.getElementById("backend-url"),g=document.getElementById("deploy-submit-default");if(e.querySelectorAll(".dynamic-split-btn").forEach(u=>u.remove()),i&&i.isSplit){a&&(a.style.display="none"),s&&(s.style.display="none"),r&&(r.style.display="none"),c&&(c.style.display="block"),l&&(l.value=i.frontend_url||""),m&&(m.value=i.backend_url||""),p&&p.removeAttribute("required");const u=document.getElementById("deploy-frontend-btn"),h=document.getElementById("deploy-backend-btn"),v=document.getElementById("deploy-both-btn");u&&(u.onclick=async()=>{var j;const y=(j=l==null?void 0:l.value)==null?void 0:j.trim();if(!y||!y.startsWith("http"))return d("Enter a valid frontend URL","error");await ee(y)}),h&&(h.onclick=async()=>{var j;const y=(j=m==null?void 0:m.value)==null?void 0:j.trim();if(!y||!y.startsWith("http"))return d("Enter a valid backend URL","error");await ee(y)}),v&&(v.onclick=async()=>{var Q,X;const y=document.getElementById("deploy-status"),j=document.getElementById("deploy-success");j.style.display="none",y.textContent="";const V=(Q=l==null?void 0:l.value)==null?void 0:Q.trim(),R=(X=m==null?void 0:m.value)==null?void 0:X.trim();if(!V||!V.startsWith("http")||!R||!R.startsWith("http")){y.textContent="Please enter valid Frontend and Backend repository URLs",y.style.color="var(--error)";return}try{const $=new FormData;$.append("deploy_type","split"),$.append("frontend_url",V),$.append("backend_url",R),typeof i=="object"&&i&&i.id&&$.append("project_id",String(i.id));const Z=await fetch("/deploy",{method:"POST",headers:S(),body:$}),A=await Z.json();Z.ok?(y.textContent="✅ Deployment successful!",y.style.color="var(--success)",A.deployed_url&&(document.getElementById("deploy-success").style.display="block",document.getElementById("openAppBtn").href=A.deployed_url,document.getElementById("openAppBtn").textContent=`Open ${A.deployed_url}`),setTimeout(()=>{W(),P.navigate("/applications")},2e3)):(y.textContent=`❌ Error: ${A.detail||"Deployment failed"}`,y.style.color="var(--error)")}catch{y.textContent="❌ Network error. Please try again.",y.style.color="var(--error)"}}),g&&(g.style.display="none")}else a&&(a.style.display=""),r&&(r.style.display="none"),c&&(c.style.display="none"),s&&(s.style.display="block"),p&&i&&i.repository_url&&(p.value=i.repository_url),g&&(g.textContent="🚀 Deploy",g.style.display="")}document.getElementById("pageTitle").textContent="Deploy";break;case"configuration":$e();break;case"logs":const t=document.getElementById("page-logs");t&&(t.style.display="block",me());break;case"domain-config":_e();break;case"env-vars":const n=document.getElementById("page-env-vars");n&&(n.style.display="block",M());break}}function $e(){let o=document.getElementById("page-project-config");o||(o=document.createElement("div"),o.id="page-project-config",o.className="page",o.innerHTML=`
      <div class="card">
        <h2>Project information</h2>
        <hr class="config-divider">
        <div class="config-info-grid">
          <div class="config-row">
            <div class="config-label">Project name:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigName">${(i==null?void 0:i.name)||"Unknown"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Owner:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigOwner">${(i==null?void 0:i.owner)||"Unknown"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Project ID:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigId">${(i==null?void 0:i.id)||"-"}</span>
              <button class="copy-btn" onclick="copyToClipboard('${(i==null?void 0:i.id)||""}')">
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
              <span class="config-value-text" id="projectConfigCreated">${i!=null&&i.createdAt?T(new Date(i.createdAt)):"Unknown"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Last update:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigUpdated">${i!=null&&i.updatedAt?T(new Date(i.updatedAt)):"Unknown"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Container Ports:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigPorts">${(i==null?void 0:i.containerPorts)||"No ports"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Docker Image:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigImage">${(i==null?void 0:i.containerImage)||"Unknown"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Container Status:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigStatus">${(i==null?void 0:i.containerStatus)||"Unknown"}</span>
            </div>
          </div>
        </div>
        <div class="config-actions">
          <button class="btn-secondary" id="changeProjectNameBtn">Change project name</button>
        </div>
      </div>
    `,document.getElementById("pageContent").appendChild(o)),G();const e=document.getElementById("changeProjectNameBtn");e&&(e.onclick=()=>se()),o.style.display="block"}function se(){if(!i){d("No project selected","error");return}const o=document.createElement("div");o.className="modal-overlay";const e=document.createElement("div");e.className="modal-content enhanced",e.innerHTML=`
    <div class="project-name-modal-header">
      <h2 class="project-name-modal-title">Change Project Name</h2>
      <p class="project-name-modal-subtitle">
        Update the name for <strong>${f(i.name)}</strong>
      </p>
    </div>
    
    <div class="project-name-modal-form-group">
      <label class="project-name-modal-label">Project Name</label>
      <input 
        type="text" 
        id="newProjectNameInput"
        class="project-name-modal-input"
        value="${f(i.name)}"
        placeholder="Enter new project name"
      />
    </div>
    
    <div class="project-name-modal-actions">
      <button class="cancel-name-btn">Cancel</button>
      <button class="save-name-btn">Save Changes</button>
    </div>
  `,o.appendChild(e),document.body.appendChild(o);const t=document.getElementById("newProjectNameInput");t&&(t.focus(),t.select());const n=e.querySelector(".cancel-name-btn"),a=e.querySelector(".save-name-btn"),s=()=>{document.body.removeChild(o)};n.onclick=()=>{s()},a.onclick=async()=>{const c=t.value.trim();if(!c){d("Project name cannot be empty","error");return}if(c===i.name){s();return}try{const p=localStorage.getItem("access_token")||localStorage.getItem("authToken"),l=await fetch(`/projects/${i.id}/name`,{method:"PUT",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${p}`},body:new URLSearchParams({app_name:c})}),m=await l.json();if(l.ok){d("Project name updated successfully!","success"),i.name=c,s();const g=E.findIndex(h=>h.id===i.id);g>=0&&(E[g].name=c),G(),C(B);const u=document.getElementById("projectSidebarName");u&&(u.textContent=c),document.getElementById("pageTitle").textContent=c}else d(m.detail||"Failed to update project name","error")}catch(p){console.error("Error updating project name:",p),d("Failed to update project name: "+p.message,"error")}},o.onclick=c=>{c.target===o&&s()};const r=c=>{c.key==="Escape"&&(s(),document.removeEventListener("keydown",r))};document.addEventListener("keydown",r)}function G(){if(!i)return;const o=document.getElementById("projectConfigName"),e=document.getElementById("projectConfigOwner"),t=document.getElementById("projectConfigId"),n=document.getElementById("projectConfigCreated"),a=document.getElementById("projectConfigUpdated"),s=document.getElementById("projectConfigPorts"),r=document.getElementById("projectConfigImage"),c=document.getElementById("projectConfigStatus");if(o&&(o.textContent=i.name||"Unknown"),e){const p=localStorage.getItem("username"),l=localStorage.getItem("displayName");e.textContent=l||p||"Unknown User"}t&&(t.textContent=i.id||"-"),n&&(n.textContent=i.createdAt?T(new Date(i.createdAt)):"Unknown"),a&&(a.textContent=i.updatedAt?T(new Date(i.updatedAt)):"Unknown"),s&&(s.textContent=i.containerPorts||"No ports"),r&&(r.textContent=i.containerImage||"Unknown"),c&&(c.textContent=i.containerStatus||"Unknown")}function _e(){let o=document.getElementById("page-project-domain");o||(o=document.createElement("div"),o.id="page-project-domain",o.className="page",o.innerHTML=`
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
    `,document.getElementById("pageContent").appendChild(o)),o.style.display="block"}function Te(o){z(o)}async function re(){const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o){console.log("No auth token found");return}try{const e=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${o}`}});if(e.ok){const t=await e.json(),n=document.getElementById("projectSidebar");if(n){const a=n.querySelector("#projectSidebarUserName"),s=n.querySelector("#projectSidebarUserEmail"),r=n.querySelector("#projectSidebarUserAvatar");if(a&&(a.textContent=t.display_name||t.username||"User"),s&&(s.textContent=t.email||"No email"),r)if(t.avatar_url){const c=new Image;c.onload=()=>{r.style.backgroundImage=`url(${t.avatar_url})`,r.style.backgroundSize="cover",r.style.backgroundPosition="center",r.textContent=""},c.onerror=()=>{r.style.backgroundImage="",r.textContent=(t.display_name||t.username||"U").charAt(0).toUpperCase()},c.src=t.avatar_url}else r.style.backgroundImage="",r.textContent=(t.display_name||t.username||"U").charAt(0).toUpperCase()}}else console.error("Failed to load user profile:",e.status)}catch(e){console.error("Error loading user profile:",e)}}function T(o){if(!o)return"Recently";const t=Date.now()-new Date(o).getTime(),n=Math.floor(t/6e4),a=Math.floor(t/36e5),s=Math.floor(t/864e5);if(n<1)return"Just now";if(n<60)return`${n}m ago`;if(a<24)return`${a}h ago`;if(s<7)return`${s}d ago`;const r=new Date(o);return r.toLocaleDateString("en-US",{month:"short",day:"numeric",year:r.getFullYear()!==new Date().getFullYear()?"numeric":void 0})}async function W(){await D();try{const o=await fetch("/deployments",{headers:S()});if(o.ok){const e=await o.json();document.getElementById("totalDeployments").textContent=e.length,document.getElementById("runningApps").textContent=e.filter(n=>n.status==="success").length;const t=document.getElementById("recentActivity");e.length>0?t.innerHTML=e.slice(0,5).map(n=>`
          <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
            <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 0.25rem;">${n.container_name}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">
              ${new Date(n.created_at).toLocaleString()}
            </div>
          </div>
        `).join(""):t.innerHTML='<p class="recent-activity-empty">No recent activity</p>'}}catch(o){console.error("Error loading dashboard:",o)}}async function De(o){var p,l,m,g;if(o.preventDefault(),!x){d("Please login to deploy applications","error"),window.location.href="/login";return}const e=o.target,t=((p=document.getElementById("deploy-type"))==null?void 0:p.value)||"single",n=(l=document.getElementById("git-url"))==null?void 0:l.value.trim(),a=(m=document.getElementById("frontend-url"))==null?void 0:m.value.trim(),s=(g=document.getElementById("backend-url"))==null?void 0:g.value.trim(),r=document.getElementById("deploy-status"),c=document.getElementById("deploy-success");if(c.style.display="none",r.textContent="",t==="split"){if(!a||!a.startsWith("http")||!s||!s.startsWith("http")){r.textContent="Please enter valid Frontend and Backend repository URLs",r.style.color="var(--error)";return}}else if(!n||!n.startsWith("http")){r.textContent="Please enter a valid Git repository URL",r.style.color="var(--error)";return}r.textContent="🚀 Deploying...",r.style.color="var(--primary)";try{const u=new FormData;t==="split"?(u.append("deploy_type","split"),u.append("frontend_url",a),u.append("backend_url",s)):(u.append("deploy_type","single"),u.append("git_url",n)),typeof i=="object"&&i&&i.id&&u.append("project_id",String(i.id));const h=await fetch("/deploy",{method:"POST",headers:S(),body:u}),v=await h.json();h.ok?(r.textContent="✅ Deployment successful!",r.style.color="var(--success)",v.deployed_url&&(c.style.display="block",document.getElementById("openAppBtn").href=v.deployed_url,document.getElementById("openAppBtn").textContent=`Open ${v.deployed_url}`),e.reset(),setTimeout(()=>{W(),P.navigate("/applications")},2e3)):(r.textContent=`❌ Error: ${v.detail||"Deployment failed"}`,r.style.color="var(--error)")}catch{r.textContent="❌ Network error. Please try again.",r.style.color="var(--error)"}}async function ee(o){const e=document.getElementById("deploy-status"),t=document.getElementById("deploy-success");if(!x){d("Please login to deploy applications","error"),window.location.href="/login";return}t.style.display="none",e.textContent="",e.style.color="var(--primary)";try{const n=new FormData;n.append("deploy_type","single"),n.append("git_url",o),typeof i=="object"&&i&&i.id&&n.append("project_id",String(i.id));const a=await fetch("/deploy",{method:"POST",headers:S(),body:n}),s=await a.json();a.ok?(e.textContent="✅ Deployment successful!",e.style.color="var(--success)",s.deployed_url&&(document.getElementById("deploy-success").style.display="block",document.getElementById("openAppBtn").href=s.deployed_url,document.getElementById("openAppBtn").textContent=`Open ${s.deployed_url}`),setTimeout(()=>{W(),P.navigate("/applications")},2e3)):(e.textContent=`❌ Error: ${s.detail||"Deployment failed"}`,e.style.color="var(--error)")}catch{e.textContent="❌ Network error. Please try again.",e.style.color="var(--error)"}}async function Ae(){if(!x){document.getElementById("applicationsGrid").innerHTML=`
      <div class="empty-state">
        <p>Please login to view your applications</p>
        <a href="/login" class="btn-primary">Login</a>
      </div>
    `;return}try{const o=await fetch("/deployments",{headers:S()});if(o.ok){const e=await o.json(),t=document.getElementById("applicationsGrid");e.length===0?t.innerHTML=`
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
        `).join("")}}catch(o){console.error("Error loading applications:",o)}}async function K(){if(!x){document.getElementById("historyTableBody").innerHTML=`
      <tr>
        <td colspan="5" class="empty-state">Please login to view deployment history</td>
      </tr>
    `;return}try{const o=await fetch("/deployments",{headers:S()});if(o.ok){const e=await o.json(),t=document.getElementById("historyTableBody");e.length===0?t.innerHTML=`
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
        `).join("")}}catch(o){console.error("Error loading history:",o)}}async function Ne(){if(confirm("Are you sure you want to clear all deployment history?"))try{(await fetch("/deployments/clear",{method:"DELETE",headers:S()})).ok&&(d("History cleared successfully","success"),K())}catch{d("Error clearing history","error")}}async function Ue(o){if(confirm(`Are you sure you want to destroy "${o}"?`))try{(await fetch(`/deployments/${o}`,{method:"DELETE",headers:S()})).ok?(d("Deployment destroyed successfully","success"),K(),Ae()):d("Error destroying deployment","error")}catch{d("Network error","error")}}let w=[],te="";async function ie(){const o=document.getElementById("usernameSearch").value.trim();if(!o){d("Please enter a GitHub username","error");return}o!==te&&(w=[],te=o);const e=document.getElementById("repositoriesGrid");e.innerHTML='<div class="empty-state"><p>Loading repositories...</p></div>';try{const t=await fetch(`/api/repositories/${o}`),n=await t.json();t.ok&&n.repositories?n.repositories.length===0?e.innerHTML='<div class="empty-state"><p>No repositories found</p></div>':(e.innerHTML=n.repositories.map(a=>`
          <div class="repository-card ${w.some(r=>r.url===a.clone_url)?"selected":""}" data-repo-url="${a.clone_url}" onclick="toggleRepositorySelection('${a.clone_url}', '${a.name}')">
            <h3>${a.name}</h3>
            <p style="color: var(--text-secondary); margin: 0.5rem 0;">
              ${a.description||"No description"}
            </p>
            <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.875rem; color: var(--text-secondary);">
                ${a.language||"Unknown"} • ${a.stargazers_count||0} stars
              </span>
              <button class="btn-primary btn-small" onclick="event.stopPropagation(); importRepository('${a.clone_url}', '${a.name}')">
                📥 Import
              </button>
            </div>
        </div>
        `).join(""),F()):e.innerHTML=`<div class="empty-state"><p>${n.detail||"Error loading repositories"}</p></div>`}catch{e.innerHTML='<div class="empty-state"><p>Error loading repositories</p></div>'}}function Me(o,e){const t=w.findIndex(n=>n.url===o);if(t>=0)w.splice(t,1),F();else{if(w.length>=2){d("You can only select up to 2 repositories for a split repository","error");return}w.push({url:o,name:e}),w.length===2&&Ve(),F()}}function Ve(){const[o,e]=w,t=document.createElement("div");t.className="modal-overlay",t.id="splitImportModal";const n=document.createElement("div");n.className="modal-content enhanced",n.innerHTML=`
    <div class="split-import-modal-center">
      <div class="split-import-icon-wrapper">
        📦
      </div>
      <h2 class="split-import-modal-title">Import as Split Repository?</h2>
      <p class="split-import-modal-text">
        This will create a split project with frontend and backend components.
      </p>
    </div>
    
    <div class="split-import-repo-info">
      <div class="split-import-repo-item">
        <div class="split-import-repo-label">Frontend</div>
        <div class="split-import-repo-name">${f(o.name)}</div>
        <div class="split-import-repo-url">${f(o.url)}</div>
      </div>
      
      <div class="split-import-divider"></div>
      
      <div class="split-import-repo-item">
        <div class="split-import-repo-label">Backend</div>
        <div class="split-import-repo-name">${f(e.name)}</div>
        <div class="split-import-repo-url">${f(e.url)}</div>
      </div>
    </div>
    
    <div class="split-import-actions">
      <button class="cancel-btn">Cancel</button>
      <button class="confirm-btn">Import Split Repository</button>
    </div>
  `,t.appendChild(n),document.body.appendChild(t);const a=n.querySelector(".cancel-btn"),s=n.querySelector(".confirm-btn"),r=()=>{document.body.removeChild(t),document.head.removeChild(style)};a.onclick=()=>{r()},s.onclick=()=>{r();const[p,l]=w;le(p.url,l.url,`${p.name}-${l.name}`)},t.onclick=p=>{p.target===t&&r()};const c=p=>{p.key==="Escape"&&(r(),document.removeEventListener("keydown",c))};document.addEventListener("keydown",c),s.focus()}function F(){const o=document.getElementById("repositoriesGrid");if(!o)return;o.querySelectorAll(".repository-card").forEach(t=>{const n=t.getAttribute("data-repo-url");w.some(s=>s.url===n)?t.classList.add("selected"):t.classList.remove("selected")})}function Re(){if(w.length!==2){d("Please select exactly 2 repositories","error");return}const[o,e]=w;confirm(`Import as Split Repository?

Frontend: ${o.name}
Backend: ${e.name}

Click OK to import these repositories as a split project.`)&&le(o.url,e.url,`${o.name}-${e.name}`)}async function le(o,e,t){const n=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!n){d("Please login first","error");return}try{d("Importing split repositories...","info");const a=await fetch("/api/import-split",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${n}`},body:new URLSearchParams({frontend_url:o,backend_url:e,app_name:t})}),s=await a.json();if(a.ok){d("Split repository imported successfully! Navigate to Projects to see it.","success"),w=[];const r=document.getElementById("page-projects");r&&r.style.display!=="none"&&D(),document.getElementById("usernameSearch").value.trim()&&ie()}else d(s.detail||"Failed to import split repository","error")}catch(a){console.error("Error importing split repositories:",a),d("Failed to import split repository: "+a.message,"error")}}function He(o){document.getElementById("git-url").value=o,P.navigate("/deploy"),d("Repository selected","success")}async function Fe(o,e){const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t){d("Please login first","error");return}try{d("Importing repository...","info");const n=await fetch("/api/import",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${t}`},body:new URLSearchParams({git_url:o,app_name:e||o.split("/").pop()||"Untitled Project"})}),a=await n.json();if(n.ok){d("Repository imported successfully! Navigate to Projects to see it.","success");const s=document.getElementById("page-projects");s&&s.style.display!=="none"&&D()}else d(a.detail||"Failed to import repository","error")}catch(n){console.error("Error importing repository:",n),d("Failed to import repository: "+n.message,"error")}}function qe(){document.getElementById("repositoriesGrid").innerHTML=`
    <div class="empty-state">
      <p>Search for a GitHub username to see their repositories</p>
            </div>
        `}function d(o,e="info"){const t=document.getElementById("toast");t.textContent=o,t.className=`toast show ${e}`,setTimeout(()=>{t.classList.remove("show")},3e3)}let L={},q=[],N=null;async function Oe(){const o=document.getElementById("projectSelector");if(o)try{const e=localStorage.getItem("access_token")||localStorage.getItem("authToken"),t=await fetch("/deployments",{headers:{Authorization:`Bearer ${e}`}});if(t.ok){const n=await t.json();o.innerHTML='<option value="">All Projects (Global)</option>',n.forEach(a=>{var r;const s=document.createElement("option");s.value=a.id,s.textContent=a.app_name||((r=a.repository_url)==null?void 0:r.split("/").pop())||`Project ${a.id}`,o.appendChild(s)})}}catch(e){console.error("Error loading projects:",e)}}async function M(){await Oe();try{const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o){const n=document.getElementById("envVarsList");n&&(n.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `),oe();return}const e=N?`/api/env-vars?project_id=${N}`:"/api/env-vars",t=await fetch(e,{headers:{Authorization:`Bearer ${o}`}});if(t.ok){const n=await t.json();L=n.variables||{},q=n.vars_list||[],Ge()}else if(t.status===401){localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),U();const n=document.getElementById("envVarsList");n&&(n.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `)}else console.error("Failed to load environment variables")}catch(o){console.error("Error loading environment variables:",o)}oe()}function oe(){const o=document.getElementById("importEnvBtn"),e=document.getElementById("addEnvVarBtn"),t=document.getElementById("importEnvCard"),n=document.getElementById("cancelImportBtn"),a=document.getElementById("importEnvForm"),s=document.getElementById("projectSelector");s&&s.addEventListener("change",async r=>{N=r.target.value?parseInt(r.target.value):null,await M()}),o&&(o.onclick=()=>{t.style.display=t.style.display==="none"?"block":"none"}),n&&(n.onclick=()=>{t.style.display="none",document.getElementById("envFileInput").value=""}),e&&(e.onclick=()=>{We()}),a&&(a.onsubmit=async r=>{r.preventDefault();const p=document.getElementById("envFileInput").files[0];p&&await ze(p)})}async function ze(o){try{const t=(await o.text()).split(`
`),n={};t.forEach(a=>{if(a=a.trim(),a&&!a.startsWith("#")&&a.includes("=")){const[s,...r]=a.split("="),c=r.join("=").trim().replace(/^["']|["']$/g,"");s.trim()&&(n[s.trim()]=c)}}),L={...L,...n},await Y(),document.getElementById("importEnvCard").style.display="none",document.getElementById("envFileInput").value="",d("Environment variables imported successfully!","success")}catch(e){console.error("Error importing .env file:",e),d("Failed to import .env file","error")}}function Ge(){const o=document.getElementById("envVarsList");if(o){if(q.length===0){o.innerHTML=`
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
        ${q.map((e,t)=>{const n=e.updated_at?T(new Date(e.updated_at)):"never",a=e.project_id?'<span style="font-size: 0.75rem; background: var(--primary); color: white; padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Project</span>':'<span style="font-size: 0.75rem; background: var(--bg-tertiary); color: var(--text-secondary); padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Global</span>';return`
            <tr>
              <td class="name-col">
                <span class="lock-icon">🔒</span>
                <span class="var-name">${f(e.key)}</span>
                ${a}
              </td>
              <td class="updated-col">
                <span class="updated-time">${n}</span>
              </td>
              <td class="actions-col">
                <button class="icon-btn edit-btn" onclick="editEnvVarModal('${f(e.key)}')" title="Edit">
                  ✏️
                </button>
                <button class="icon-btn delete-btn" onclick="deleteEnvVar('${f(e.key)}')" title="Delete">
                  🗑️
                </button>
              </td>
            </tr>
          `}).join("")}
      </tbody>
    </table>
  `}}function We(){J()}function J(o=null,e=""){const t=document.getElementById("envVarModal"),n=document.getElementById("modalVarKey"),a=document.getElementById("modalVarValue"),s=document.getElementById("modalTitle");o?(s.textContent="Update environment variable",n.value=o,n.readOnly=!0,a.value=e):(s.textContent="Add environment variable",n.value="",n.readOnly=!1,a.value=""),t.style.display="flex"}function ce(){const o=document.getElementById("envVarModal");o.style.display="none"}async function Ke(){const o=document.getElementById("modalVarKey"),e=document.getElementById("modalVarValue"),t=o.value.trim(),n=e.value.trim();if(!t){d("Variable name is required","error");return}L[t]=n,await Y(),ce()}function de(o){const e=L[o]||"";J(o,e)}async function Je(o){de(o)}async function Ye(o){confirm(`Are you sure you want to delete ${o}?`)&&(delete L[o],await Y(),d("Environment variable deleted","success"))}function Qe(o){const t=document.querySelectorAll(".env-var-row")[o];if(!t)return;const n=t.querySelector(".env-var-value input");n.type==="password"?n.type="text":n.type="password"}async function Y(){try{const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");(await fetch("/api/env-vars",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${o}`},body:JSON.stringify({variables:L,project_id:N})})).ok?(await M(),d("Environment variables saved successfully","success")):(console.error("Failed to save environment variables"),d("Failed to save environment variables","error"))}catch(o){console.error("Error saving environment variables:",o),d("Error saving environment variables","error")}}function Xe(){const o=document.getElementById("modalVarValue"),e=document.querySelector('#envVarModal button[onclick*="toggleModalValueVisibility"]');o&&e&&(o.type==="password"?(o.type="text",e.textContent="🙈 Hide"):(o.type="password",e.textContent="👁️ Show"))}function f(o){const e=document.createElement("div");return e.textContent=o,e.innerHTML}async function pe(){try{const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o)return;const e=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${o}`}});if(e.ok){const t=await e.json(),n=document.getElementById("userName"),a=document.getElementById("userEmail"),s=document.getElementById("userAvatar");localStorage.setItem("displayName",t.display_name||""),localStorage.setItem("userEmail",t.email||""),n&&(n.textContent=t.display_name||t.username||"User"),at(t.display_name||t.username||"User"),a&&(a.textContent=t.email||"Logged in"),s&&(t.avatar_url?(s.style.backgroundImage=`url(${t.avatar_url})`,s.style.backgroundSize="cover",s.style.backgroundPosition="center",s.textContent=""):(s.style.backgroundImage="",s.textContent=(t.display_name||t.username||"U").charAt(0).toUpperCase()))}else e.status===401&&(localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),U())}catch(o){console.error("Error loading user profile:",o)}}async function Ze(){try{const o=localStorage.getItem("access_token")||localStorage.getItem("authToken"),e=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${o}`}});if(e.ok){const t=await e.json();document.getElementById("username").value=t.username||"",document.getElementById("email").value=t.email||"",document.getElementById("displayName").value=t.display_name||"",t.avatar_url&&(document.getElementById("avatarPreview").src=t.avatar_url,document.getElementById("avatarPreview").style.display="block",document.getElementById("avatarPlaceholder").style.display="none",document.getElementById("removeAvatarBtn").style.display="block")}}catch(o){console.error("Error loading profile:",o)}et()}function et(){const o=document.getElementById("profileForm"),e=document.getElementById("avatarFile"),t=document.getElementById("removeAvatarBtn");o&&o.addEventListener("submit",nt),e&&e.addEventListener("change",tt),t&&t.addEventListener("click",ot)}function tt(o){const e=o.target.files[0];if(e){const t=new FileReader;t.onload=n=>{document.getElementById("avatarPreview").src=n.target.result,document.getElementById("avatarPreview").style.display="block",document.getElementById("avatarPlaceholder").style.display="none",document.getElementById("removeAvatarBtn").style.display="block"},t.readAsDataURL(e)}}function ot(){document.getElementById("avatarPreview").src="",document.getElementById("avatarPreview").style.display="none",document.getElementById("avatarPlaceholder").style.display="block",document.getElementById("removeAvatarBtn").style.display="none",document.getElementById("avatarFile").value=""}async function nt(o){o.preventDefault();const e=document.getElementById("profileMessage");e.style.display="none";const t=new FormData;t.append("email",document.getElementById("email").value),t.append("display_name",document.getElementById("displayName").value);const n=document.getElementById("currentPassword").value,a=document.getElementById("newPassword").value,s=document.getElementById("confirmPassword").value;if(a||n){if(a!==s){e.textContent="New passwords do not match",e.className="profile-message error",e.style.display="block";return}if(a.length<6){e.textContent="New password must be at least 6 characters",e.className="profile-message error",e.style.display="block";return}t.append("current_password",n),t.append("new_password",a)}const r=document.getElementById("avatarFile").files[0];r&&t.append("avatar",r),document.getElementById("avatarPreview").style.display==="none"&&t.append("remove_avatar","true");try{const c=localStorage.getItem("access_token")||localStorage.getItem("authToken"),p=await fetch("/api/user/profile",{method:"PUT",headers:{Authorization:`Bearer ${c}`},body:t}),l=await p.json();if(p.ok)e.textContent="Profile updated successfully!",e.className="profile-message success",e.style.display="block",l.username&&localStorage.setItem("username",l.username),document.getElementById("currentPassword").value="",document.getElementById("newPassword").value="",document.getElementById("confirmPassword").value="",await pe(),d("Profile updated successfully!","success");else{const m=l.detail||l.message||"Failed to update profile";e.textContent=m,e.className="profile-message error",e.style.display="block",console.error("Profile update failed:",l)}}catch(c){console.error("Error updating profile:",c);try{const p=await response.json();e.textContent=p.detail||"Network error. Please try again."}catch{e.textContent="Network error. Please try again."}e.className="profile-message error",e.style.display="block"}}window.destroyDeployment=Ue;window.selectRepository=He;window.importRepository=Fe;window.editEnvVar=Je;window.deleteEnvVar=Ye;window.toggleEnvVarVisibility=Qe;window.saveEnvVarFromModal=Ke;window.closeEnvVarModal=ce;window.toggleModalValueVisibility=Xe;window.editEnvVarModal=de;window.showEnvVarModal=J;window.selectProject=z;window.showProjectSidebar=ne;window.hideProjectSidebar=xe;window.openProject=Te;window.loadUserProfileIntoProjectSidebar=re;window.openProjectSite=Ce;window.deleteProject=ye;window.toggleRepositorySelection=Me;window.confirmSplitImport=Re;window.openProjectNameModal=se;function at(o){const e=document.getElementById("teamName");e&&(e.textContent=`${o}'s team`),document.querySelectorAll(".project-owner").forEach(n=>{n.textContent=`${o}'s team`})}let b=null,_=!1,I=[];function me(){const o=document.getElementById("logsContent");o&&(o.innerHTML='<p class="logs-connecting">Connecting to WebSocket...</p>',ue(),st())}function ue(){b&&b.close();const e=`${window.location.protocol==="https:"?"wss:":"ws:"}//${window.location.host}/ws/logs`;b=new WebSocket(e),b.onopen=()=>{console.log("Logs WebSocket connected"),k("Connected to logs stream","success"),I.length>0&&(I.forEach(t=>k(t.message,t.type)),I=[])},b.onmessage=t=>{try{const n=JSON.parse(t.data);_?I.push({message:n.message,type:n.type||"info"}):k(n.message,n.type||"info")}catch(n){console.error("Error parsing log message:",n),k(t.data,"info")}},b.onerror=t=>{console.error("Logs WebSocket error:",t),k("WebSocket connection error","error")},b.onclose=()=>{console.log("Logs WebSocket disconnected"),k("Disconnected from logs stream","warning"),setTimeout(()=>{var t;((t=document.getElementById("page-logs"))==null?void 0:t.style.display)!=="none"&&ue()},3e3)}}function k(o,e="info"){const t=document.getElementById("logsContent");if(!t)return;const n=new Date().toLocaleTimeString(),a=document.createElement("div");a.className=`log-entry ${e}`,a.innerHTML=`
    <span class="log-timestamp">[${n}]</span>
    <span class="log-message">${f(o)}</span>
  `,t.appendChild(a),t.scrollTop=t.scrollHeight;const s=1e3,r=t.querySelectorAll(".log-entry");r.length>s&&r[0].remove()}function st(){const o=document.getElementById("clearLogsBtn"),e=document.getElementById("toggleLogsBtn");o&&o.addEventListener("click",()=>{const t=document.getElementById("logsContent");t&&(t.innerHTML="",I=[],k("Logs cleared","info"))}),e&&e.addEventListener("click",()=>{_=!_,e.textContent=_?"Resume":"Pause",!_&&I.length>0&&(I.forEach(t=>k(t.message,t.type)),I=[]),k(_?"Logs paused":"Logs resumed","info")})}window.addEventListener("beforeunload",()=>{b&&b.close()});function rt(){const o=document.getElementById("sidebarSearch"),e=document.getElementById("commandPalette"),t=document.getElementById("commandSearchInput"),n=document.querySelectorAll(".command-item");let a=-1;function s(){e&&(e.style.display="flex",t&&(t.focus(),t.value=""),a=-1,c())}function r(){e&&(e.style.display="none",a=-1)}function c(){const l=Array.from(n).filter(m=>m.style.display!=="none");n.forEach((m,g)=>{l.indexOf(m)===a?(m.classList.add("selected"),m.scrollIntoView({block:"nearest",behavior:"smooth"})):m.classList.remove("selected")})}function p(l){switch(r(),l){case"deploy":case"nav-deploy":window.router&&window.router.navigate("/deploy");break;case"add-env-var":window.showEnvVarModal&&window.showEnvVarModal();break;case"search-repos":case"nav-repositories":window.router&&window.router.navigate("/repositories");break;case"nav-projects":window.router&&window.router.navigate("/");break;case"nav-applications":window.router&&window.router.navigate("/applications");break;case"nav-history":window.router&&window.router.navigate("/history");break;case"nav-env-vars":window.router&&window.router.navigate("/env-vars");break;case"nav-settings":window.router&&window.router.navigate("/settings");break}}document.addEventListener("keydown",l=>{var m;if((l.metaKey||l.ctrlKey)&&l.key==="k"&&(l.preventDefault(),e&&e.style.display==="none"?s():r()),l.key==="Escape"&&e&&e.style.display!=="none"&&r(),e&&e.style.display!=="none"){const g=Array.from(n).filter(u=>u.style.display!=="none");if(l.key==="ArrowDown")l.preventDefault(),a=Math.min(a+1,g.length-1),c();else if(l.key==="ArrowUp")l.preventDefault(),a=Math.max(a-1,-1),c();else if(l.key==="Enter"&&a>=0){l.preventDefault();const h=(m=Array.from(n).filter(v=>v.style.display!=="none")[a])==null?void 0:m.getAttribute("data-action");h&&p(h)}}}),o&&o.addEventListener("click",s),e&&e.addEventListener("click",l=>{l.target===e&&r()}),n.forEach(l=>{l.addEventListener("click",()=>{const m=l.getAttribute("data-action");m&&p(m)})}),t&&t.addEventListener("input",l=>{const m=l.target.value.toLowerCase();n.forEach(g=>{g.querySelector(".command-text").textContent.toLowerCase().includes(m)?g.style.display="flex":g.style.display="none"}),a=-1,c()})}
