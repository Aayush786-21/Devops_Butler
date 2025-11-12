import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */class We{constructor(){this.routes={"/":"projects","/deploy":"deploy","/history":"history","/repositories":"repositories","/domain":"domain","/env-vars":"env-vars","/settings":"settings","/logs":"logs"},this.currentPage=null,this.init()}init(){document.querySelectorAll(".nav-item").forEach(e=>{e.addEventListener("click",t=>{t.preventDefault();const o=e.getAttribute("href");this.navigate(o)})}),window.addEventListener("popstate",()=>{this.loadPage(window.location.pathname)}),this.loadPage(window.location.pathname)}navigate(e){window.history.pushState({},"",e),this.loadPage(e)}loadPage(e){const t=this.routes[e]||"dashboard";if(t==="deploy"){i=null;const o=document.getElementById("projectSidebar");o&&(o.style.display="none");const s=document.getElementById("sidebar");s&&(s.style.display="block")}this.showPage(t),this.updateActiveNav(e),this.updatePageTitle(t),window.scrollTo({top:0,behavior:"smooth"})}showPage(e){document.querySelectorAll(".page").forEach(o=>{o.style.display="none"});const t=document.getElementById(`page-${e}`);if(t){if(t.style.display="block",e==="deploy"){const o=document.getElementById("deploy-status"),s=document.getElementById("deploy-success");o&&(o.textContent="",o.style.color=""),s&&(s.style.display="none")}}else{const o=document.getElementById("page-dashboard");o&&(o.style.display="block")}this.currentPage=e,this.loadPageData(e)}updateActiveNav(e){document.querySelectorAll(".nav-item").forEach(t=>{t.classList.remove("active"),t.getAttribute("href")===e&&t.classList.add("active")})}updatePageTitle(e){const t={projects:"Projects",deploy:"Deploy",history:"History",repositories:"Repositories",domain:"Domain","env-vars":"Environmental Variables",settings:"Settings",logs:"Logs"};document.getElementById("pageTitle").textContent=t[e]||"Dashboard"}loadPageData(e){switch(e){case"dashboard":he();break;case"projects":H(),he();break;case"history":je();break;case"repositories":Nt();break;case"domain":it();break;case"env-vars":Ce();break;case"settings":ze();break;case"logs":Jt();break}}}const T=new We;window.router=T;async function Ye(n){const e=await Je();if(!e)return;const t=L.find(a=>a.id==n),o=t?t.name:"this project";if(await Ke(o))try{console.log("Deleting project with token:",e.substring(0,20)+"...");const a=await fetch(`/projects/${n}`,{method:"DELETE",headers:{Authorization:`Bearer ${e}`}});if(console.log("Delete response status:",a.status),!a.ok){const r=await a.json().catch(()=>({}));if(console.error("Delete error response:",r),a.status===401){p("Session expired. Please login again.","error"),localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),setTimeout(()=>{window.location.href="/login"},2e3);return}throw new Error(r.detail||"Failed to delete project")}L=L.filter(r=>r.id!=n),V=V.filter(r=>r.id!=n),J(V),p("Project deleted","success")}catch(a){console.error("Delete project error:",a),p(`Delete failed: ${a.message}`,"error")}}function Ke(n){return new Promise(e=>{const t=document.createElement("div");t.className="modal-overlay";const o=document.createElement("div");o.className="delete-confirmation-modal",o.innerHTML=`
      <h3>Delete Project</h3>
      <p>
        Are you sure you want to delete <strong>${I(n)}</strong>?<br>
        This will stop the process and remove the project.
      </p>
      <div class="delete-confirmation-actions">
        <button class="cancel-btn">Cancel</button>
        <button class="delete-btn">Delete</button>
      </div>
    `,t.appendChild(o),document.body.appendChild(t);const s=o.querySelector(".cancel-btn"),a=o.querySelector(".delete-btn"),r=()=>{document.body.removeChild(t)};s.onclick=()=>{r(),e(!1)},a.onclick=()=>{r(),e(!0)},t.onclick=l=>{l.target===t&&(r(),e(!1))},a.focus()})}function Ze(n){try{const t=JSON.parse(atob(n.split(".")[1])).exp*1e3,o=Date.now();return t<o+5*60*1e3}catch{return!0}}async function Je(){const n=localStorage.getItem("access_token")||localStorage.getItem("authToken");return!n||Ze(n)?(p("Session expired. Please login again.","error"),localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),setTimeout(()=>{window.location.href="/login"},2e3),null):n}let te=localStorage.getItem("access_token")||localStorage.getItem("authToken"),me=localStorage.getItem("username");document.addEventListener("DOMContentLoaded",()=>{const n=document.getElementById("sidebarSearch");n&&(n.value="",n.setAttribute("autocomplete","off")),ue(),window.location.pathname==="/login"||window.location.pathname.includes("login.html")||setTimeout(()=>{if(te&&me){Qe(),Xt();const t=document.getElementById("sidebarSearch");t&&t.value===me&&(t.value="");const o=document.getElementById("page-projects");o&&window.location.pathname==="/"&&(o.style.display="block")}},100)});function ue(){const n=document.getElementById("userSection"),e=document.getElementById("authButtons"),t=document.getElementById("logoutBtn"),o=document.getElementById("newDeployBtn");document.getElementById("userName"),document.getElementById("userEmail"),document.getElementById("userAvatar");const s=window.location.pathname==="/login"||window.location.pathname.includes("login.html");te&&me?(n.style.display="flex",e.style.display="none",t.style.display="block",o.style.display="block",qe(),H(),s&&(window.location.href="/")):(n.style.display="none",e.style.display="block",t.style.display="none",o.style.display="none",s||(window.location.href="/login"))}function Qe(){var a,r;document.getElementById("logoutBtn").addEventListener("click",()=>{localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),te=null,me=null,ue(),p("Logged out successfully","success"),T.navigate("/")});const n=document.getElementById("projectsSearch");n&&n.addEventListener("input",l=>{const d=l.target.value.toLowerCase();V=L.filter(c=>c.name.toLowerCase().includes(d)||c.repository&&c.repository.toLowerCase().includes(d)),J(V)});const e=document.getElementById("addProjectBtn");e&&e.addEventListener("click",()=>{window.router&&window.router.navigate("/deploy")});const t=document.getElementById("browseUploadLink");t&&t.addEventListener("click",l=>{l.preventDefault(),window.router&&window.router.navigate("/deploy")}),document.getElementById("newDeployBtn").addEventListener("click",()=>{i=null;const l=document.getElementById("projectSidebar");l&&(l.style.display="none");const d=document.getElementById("sidebar");d&&(d.style.display="block"),T.navigate("/deploy")});const o=document.getElementById("deployForm");o&&o.addEventListener("submit",St),ht();const s=document.getElementById("deploy-type");s&&s.addEventListener("change",l=>{const d=document.getElementById("single-repo-group"),c=document.getElementById("git-url-section"),m=document.getElementById("split-deploy-layout"),u=document.getElementById("git-url");l.target.value==="split"?(d&&(d.style.display="none"),c&&(c.style.display="none"),m&&(m.style.display="block"),u&&u.removeAttribute("required")):(d&&(d.style.display="block"),c&&(c.style.display="block"),m&&(m.style.display="none"),u&&u.setAttribute("required","required"))}),(a=document.getElementById("clearHistoryBtn"))==null||a.addEventListener("click",Ct),(r=document.getElementById("searchReposBtn"))==null||r.addEventListener("click",Re),Xe(),tt()}function Xe(){const n=document.querySelector(".search-input"),e=document.getElementById("spotlightModal"),t=document.getElementById("spotlightSearch"),o=document.getElementById("spotlightResults");!n||!e||!t||!o||(n.addEventListener("click",et),e.addEventListener("click",s=>{s.target===e&&ve()}),t.addEventListener("input",nt),o.addEventListener("click",at),document.addEventListener("keydown",s=>{s.key==="Escape"&&e.style.display!=="none"&&ve()}))}function et(){const n=document.getElementById("spotlightModal"),e=document.getElementById("spotlightSearch");n.style.display="flex",setTimeout(()=>{e.focus()},100)}function ve(){const n=document.getElementById("spotlightModal"),e=document.getElementById("spotlightSearch"),t=document.getElementById("spotlightResults");n.style.display="none",e.value="",t.innerHTML=`
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
  `}function tt(){const n=document.getElementById("domainWarningModal");if(!n||n.dataset.bound==="true")return;n.dataset.bound="true";const e=document.getElementById("domainModalCancelBtn"),t=document.getElementById("domainModalOpenConfigBtn"),o=()=>{n.style.display="none"};e&&e.addEventListener("click",o),t&&t.addEventListener("click",()=>{o(),Be("domain-config"),Me()}),n.addEventListener("click",s=>{s.target===n&&o()})}function nt(n){const e=n.target.value.toLowerCase().trim(),t=document.getElementById("spotlightResults");if(!e){t.innerHTML=`
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
    `;return}const o=ot(e);st(o)}function ot(n){const e={projects:[],actions:[],navigation:[]};L&&L.length>0&&(e.projects=L.filter(s=>s.name.toLowerCase().includes(n)||s.repository&&s.repository.toLowerCase().includes(n)));const t=[{name:"New Deploy",action:"new-deploy",icon:"🚀"},{name:"Repositories",action:"repositories",icon:"📁"},{name:"History",action:"history",icon:"📜"},{name:"Settings",action:"settings",icon:"⚙️"},{name:"Domain",action:"domain",icon:"🌐"}];e.actions=t.filter(s=>s.name.toLowerCase().includes(n));const o=[{name:"Projects",action:"projects",icon:"📊"},{name:"Repositories",action:"repositories",icon:"📁"},{name:"History",action:"history",icon:"📜"},{name:"Domain",action:"domain",icon:"🌐"},{name:"Settings",action:"settings",icon:"⚙️"}];return e.navigation=o.filter(s=>s.name.toLowerCase().includes(n)),e}function st(n){const e=document.getElementById("spotlightResults");let t='<div class="search-results">';n.projects.length>0&&(t+='<div class="search-category">',t+='<div class="search-category-title">Projects</div>',n.projects.forEach(o=>{const s=o.status==="running"?"🚀":"📦",a=o.status==="running"?"RUNNING":o.status==="failed"?"FAILED":"IMPORTED";t+=`
        <div class="search-result-item" data-type="project" data-id="${o.id}">
          <span class="search-result-icon">${s}</span>
          <div class="search-result-content">
            <div class="search-result-title">${I(o.name)}</div>
            <div class="search-result-subtitle">${o.repository||"No repository"}</div>
          </div>
          <span class="search-result-badge">${a}</span>
        </div>
      `}),t+="</div>"),n.actions.length>0&&(t+='<div class="search-category">',t+='<div class="search-category-title">Actions</div>',n.actions.forEach(o=>{t+=`
        <div class="search-result-item" data-type="action" data-action="${o.action}">
          <span class="search-result-icon">${o.icon}</span>
          <div class="search-result-content">
            <div class="search-result-title">${o.name}</div>
          </div>
        </div>
      `}),t+="</div>"),n.navigation.length>0&&(t+='<div class="search-category">',t+='<div class="search-category-title">Navigation</div>',n.navigation.forEach(o=>{t+=`
        <div class="search-result-item" data-type="navigation" data-action="${o.action}">
          <span class="search-result-icon">${o.icon}</span>
          <div class="search-result-content">
            <div class="search-result-title">${o.name}</div>
          </div>
        </div>
      `}),t+="</div>"),n.projects.length===0&&n.actions.length===0&&n.navigation.length===0&&(t=`
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <p>No results found for "${I(document.getElementById("spotlightSearch").value)}"</p>
      </div>
    `),t+="</div>",e.innerHTML=t}function at(n){const e=n.target.closest(".suggestion-item, .search-result-item");if(!e)return;const t=e.dataset.action,o=e.dataset.type,s=e.dataset.id;if(ve(),o==="project"&&s)ke(parseInt(s));else if(t)switch(t){case"new-deploy":window.router&&window.router.navigate("/deploy");break;case"repositories":window.router&&window.router.navigate("/repositories");break;case"history":window.router&&window.router.navigate("/history");break;case"domain":window.router&&window.router.navigate("/domain");break;case"settings":window.router&&window.router.navigate("/settings");break;case"projects":window.router&&window.router.navigate("/projects");break}}function it(){document.getElementById("page-domain")}let re=null;async function he(){if(!(localStorage.getItem("access_token")||localStorage.getItem("authToken"))){const e=document.getElementById("vmStatusCard");e&&(e.style.display="none");return}try{const e=await fetch("/api/vm-status",{headers:D()});if(!e.ok){if(e.status===401){const o=document.getElementById("vmStatusCard");o&&(o.style.display="none");return}throw new Error("Failed to fetch VM status")}const t=await e.json();rt(t.vm_status,t.message),t.vm_status==="creating"?re||(re=setInterval(()=>{he()},5e3)):re&&(clearInterval(re),re=null)}catch(e){console.error("Error loading VM status:",e);const t=document.getElementById("vmStatusCard");t&&(t.style.display="none")}}function rt(n,e){Pe("vmStatusCard","vmStatusBadge","vmStatusDot","vmStatusText","vmStatusMessage","vmStatusDetails","dashboardActions",n,e),Pe("vmStatusCardProjects","vmStatusBadgeProjects","vmStatusDotProjects","vmStatusTextProjects","vmStatusMessageProjects","vmStatusDetailsProjects",null,n,e)}function Pe(n,e,t,o,s,a,r,l,d){const c=document.getElementById(n),m=document.getElementById(e),u=document.getElementById(t),y=document.getElementById(o),v=document.getElementById(s),g=document.getElementById(a),h=r?document.getElementById(r):null;c&&(c.style.display="block",v&&(v.textContent=d),l==="creating"?(m&&(m.className="status-badge creating"),u&&(u.className="status-dot creating"),y&&(y.textContent="Creating"),g&&(g.style.display="block",g.textContent="Estimated time remaining: 2-5 minutes"),h&&(h.style.display="none")):l==="ready"?(m&&(m.className="status-badge running"),u&&(u.className="status-dot running"),y&&(y.textContent="Running"),g&&(g.style.display="none"),h&&(h.style.display="grid")):l==="failed"?(m&&(m.className="status-badge failed"),u&&(u.className="status-dot failed"),y&&(y.textContent="Failed"),g&&(g.style.display="block",g.textContent="Please check that OrbStack is installed and running, then try again."),h&&(h.style.display="grid")):(m&&(m.className="status-badge creating"),u&&(u.className="status-dot creating"),y&&(y.textContent="Checking"),g&&(g.style.display="none"),h&&(h.style.display="none")))}function D(){const n={},e=localStorage.getItem("access_token")||localStorage.getItem("authToken");return e&&(n.Authorization=`Bearer ${e}`),n}let L=[],V=[];async function H(){const n=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!n){J([]);return}ct();try{const e=await fetch("/deployments",{headers:{Authorization:`Bearer ${n}`}});e.ok?(L=(await e.json()).map(o=>{var q;const s=o.git_url||"",a=s,r=s?(q=String(s).split("/").pop())==null?void 0:q.replace(/\.git$/,""):null,l=o.app_name||r||o.container_name||"Untitled Project",d=(o.status||"").toLowerCase();let c;d==="running"?c="running":d==="failed"||d==="error"?c="failed":c="imported";let m=!1,u="single",y=null,v=null;const g=String(o.git_url||""),h=g.startsWith("split::"),C=!o.parent_project_id&&!o.component_type;if(h){m=!0,u="split";try{const _=g.replace("split::","").split("|");_.length===2&&(y=_[0],v=_[1])}catch{}}else if(d==="imported_split")m=!0,u="split";else if(C&&g.includes("|")){m=!0,u="split";try{const _=g.split("|");_.length===2&&(y=_[0],v=_[1])}catch{}}const K=o.custom_domain&&o.domain_status&&o.domain_status.toLowerCase()==="active"?`https://${o.custom_domain}`:o.deployed_url||o.app_url||null;return{id:o.id,name:l,status:c,url:K,createdAt:o.created_at,updatedAt:o.updated_at,repository:a,repository_url:a,git_url:s,project_type:u,isSplit:m,frontend_url:y,backend_url:v,processPid:o.process_pid||null,port:o.port||null,startCommand:o.start_command||null,buildCommand:o.build_command||null,isRunning:o.is_running||!1,custom_domain:o.custom_domain||null,domain_status:o.domain_status||null,last_domain_sync:o.last_domain_sync||null}}),V=[...L],J(V)):J([])}catch(e){console.error("Error loading projects:",e),J([])}}function J(n){const e=document.getElementById("projectsGrid");if(e){if(n.length===0){e.innerHTML=`
      <div class="empty-state">
        <p>No projects found</p>
        <button class="btn-primary" onclick="if(window.router){window.router.navigate('/deploy');}else{window.location.href='/deploy';}">Create First Project</button>
      </div>
    `;return}e.innerHTML=n.map(t=>{const o=t.status==="running"?"status-success":t.status==="failed"?"status-error":"status-info",s=t.status==="running"?"Running":t.status==="failed"?"Failed":"Imported",a=t.status==="running"?"🚀":"📦",r=t.updatedAt?X(t.updatedAt):"Recently";return`
      <div class="project-card" data-project-id="${t.id}" onclick="selectProject(${t.id})">
        <div class="project-header">
          <div class="project-icon">${a}</div>
          <div class="project-status ${o}">${s}</div>
          </div>
        
        <div class="project-info">
          <h3 class="project-name">${I(t.name)}</h3>
          <div class="project-meta">
            <svg class="icon-clock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12,6 12,12 16,14"></polyline>
            </svg>
            <span>Updated ${r}</span>
        </div>
          
                 ${t.status==="running"?`
                 <div class="project-metrics">
                   ${t.port?`
                   <div class="metric">
                     <span class="metric-label">Port</span>
                     <span class="metric-value">${t.port}</span>
                   </div>
                   `:""}
                   ${t.processPid?`
                   <div class="metric">
                     <span class="metric-label">PID</span>
                     <span class="metric-value">${t.processPid}</span>
                   </div>
                   `:""}
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
      `}).join("")}}async function lt(n){try{const e=L.find(o=>o.id===n);if(!e){p("Project not found","error");return}const t=Ae(e.url);if(!t){p("Project URL not available. Make sure the project is deployed.","error");return}window.open(t,"_blank"),p(`Opening ${e.name}...`,"info")}catch(e){console.error("Error opening project site:",e),p("Failed to open project site: "+e.message,"error")}}function ct(){const n=document.getElementById("projectsGrid");n&&(n.innerHTML=`
    <div class="loading-skeleton">
      ${Array(3).fill(`
        <div class="skeleton-card">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line short"></div>
        </div>
      `).join("")}
    </div>
  `)}let i=null;function ke(n){H().then(()=>{const t=L.find(o=>o.id==n);if(!t){const o=V.find(s=>s.id==n);o&&(i=o,be(o));return}i=t,be(t)});const e=document.getElementById("page-project-config");e&&e.style.display!=="none"&&Ie()}function be(n){const e=document.getElementById("sidebar");e&&(e.style.display="none");let t=document.getElementById("projectSidebar");t||(t=dt(),document.body.appendChild(t));const o=t.querySelector("#projectSidebarName");o&&(o.textContent=n.name);const s=t.querySelector("#projectSidebarId");s&&(s.textContent=n.id);const a=t.querySelector('a[data-project-page="status"]');a&&(n.project_type==="split"?a.style.display="flex":a.style.display="none"),t.style.display="block",document.getElementById("pageTitle").textContent=n.name,Fe(),Be("deploy")}function dt(){const n=document.createElement("aside");return n.id="projectSidebar",n.className="sidebar project-sidebar",n.innerHTML=`
    <div class="sidebar-header">
      <div class="logo">
        <img src="/icons/devops.png" alt="DevOps Butler" class="logo-icon" style="width: 32px; height: 32px; border-radius: 6px;" />
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
      <a href="#" class="nav-item project-nav-item" data-project-page="status" style="display: none;">
        <span class="nav-icon">⚡️</span>
        <span class="nav-label">Status</span>
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
  `,n.querySelectorAll(".project-nav-item").forEach(e=>{e.addEventListener("click",async t=>{t.preventDefault();const o=e.getAttribute("data-project-page");if(await H(),i){const s=L.find(a=>a.id===i.id);s&&(i=s)}Be(o),n.querySelectorAll(".project-nav-item").forEach(s=>s.classList.remove("active")),e.classList.add("active")})}),n}function mt(){const n=document.getElementById("projectSidebar");n&&(n.style.display="none");const e=document.getElementById("sidebar");e&&(e.style.display="block"),i=null,document.getElementById("pageTitle").textContent="Projects",document.querySelectorAll(".page").forEach(o=>{o.style.display="none"});const t=document.getElementById("page-projects");t&&(t.style.display="block"),H()}function Be(n){switch(document.querySelectorAll(".page").forEach(e=>{e.style.display="none"}),n){case"deploy":const e=document.getElementById("page-deploy");if(e){e.style.display="block";const o=document.getElementById("deploy-status"),s=document.getElementById("deploy-success");o&&(o.textContent="",o.style.color=""),s&&(s.style.display="none");const a=document.getElementById("deploy-page-title"),r=document.getElementById("deploy-card-title"),l=document.getElementById("deploy-description");if(i){a&&(a.textContent=i.name||"Project"),r&&(r.textContent=i.name||"Project"),l&&(l.textContent="Update deployment settings and redeploy your project.");const b=document.getElementById("import-info"),x=document.getElementById("import-repo-name"),$=i.git_url||i.repository_url||"",S=document.getElementById("git-url");if(S&&$&&(S.value=$,console.log("Populated Git URL input in showProjectContent:",$),S.removeAttribute("required")),$&&b&&x)try{const w=$.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git|[/]|$)/);if(w){const B=w[1],j=w[2];x.textContent=`${B}/${j}`,b.style.display="flex";const k=document.getElementById("branch-badge"),M=document.getElementById("branch-name");k&&M&&(k.style.display="flex",M.textContent="main")}}catch(w){console.warn("Failed to parse GitHub URL:",w)}else b&&(b.style.display="none");console.log("showProjectContent - currentProject:",{id:i.id,name:i.name,git_url:i.git_url,repository_url:i.repository_url,gitUrl:$}),It(i.id,$)}else{a&&(a.textContent="New Project"),r&&(r.textContent="New Project"),l&&(l.textContent="Choose where you want to create the project and give it a name.");const b=document.getElementById("import-info");b&&(b.style.display="none")}const d=document.getElementById("project-components-section");d&&(d.style.display="none"),document.getElementById("deploy-type");const c=document.getElementById("deploy-type-group"),m=document.getElementById("single-repo-group"),u=document.getElementById("git-url-section"),y=document.getElementById("split-deploy-layout"),v=document.getElementById("git-url"),g=document.getElementById("project-name"),h=document.getElementById("framework-preset"),C=document.getElementById("root-directory"),O=document.getElementById("install-command"),K=document.getElementById("build-command"),q=document.getElementById("start-command"),_=document.getElementById("port"),A=document.getElementById("frontend-url"),U=document.getElementById("backend-url"),f=document.getElementById("deploy-submit-default"),ae=document.getElementById("edit-root-directory-btn");ae&&C&&(ae.onclick=()=>{C.removeAttribute("readonly"),C.focus(),C.select()});let N=i==null?void 0:i.project_type;const ne=(i==null?void 0:i.git_url)||(i==null?void 0:i.repository_url)||"",oe=ne.startsWith("split::");if(N||(i!=null&&i.isSplit||oe?N="split":N="single"),oe&&N!=="split"?N="split":!oe&&N==="split"&&ne&&(N="single"),i){if(c&&(c.style.display="none"),g&&(g.value=i.name||i.app_name||""),h){const b=i.buildCommand||i.build_command||"",x=i.startCommand||i.start_command||"";b.includes("next build")||x.includes("next start")?h.value="nextjs":b.includes("react-scripts")||x.includes("react-scripts")?h.value="react":x.includes("vue")||b.includes("vue")?h.value="vue":x.includes("flask")||b.includes("flask")?h.value="flask":x.includes("django")||b.includes("django")?h.value="django":x.includes("python")||b.includes("python")?h.value="python":x.includes("node")||b.includes("npm")?h.value="nodejs":h.value="auto"}if(C&&(C.value="./"),K&&(K.value=i.buildCommand||i.build_command||""),q&&(q.value=i.startCommand||i.start_command||""),_&&(_.value=i.port||""),O&&!O.value){const b=(h==null?void 0:h.value)||"auto";["nextjs","react","vue","nodejs"].includes(b)?O.placeholder="npm install":["python","flask","django"].includes(b)&&(O.placeholder="pip install -r requirements.txt")}if(N==="split"){m&&(m.style.display="none"),y&&(y.style.display="block"),A&&(A.value=i.frontend_url||""),U&&(U.value=i.backend_url||""),v&&v.removeAttribute("required"),f&&(f.style.display="none");const b=document.getElementById("deploy-frontend-btn"),x=document.getElementById("deploy-backend-btn"),$=document.getElementById("deploy-both-btn");b&&(b.onclick=async()=>{var j,k,M,z;const S=(j=A==null?void 0:A.value)==null?void 0:j.trim();if(!S||!S.startsWith("http"))return p("Enter a valid frontend URL","error");const w=ge(!1);document.getElementById("step-frontend").style.display="flex",w.updateFrontendStatus("deploying","Deploying your frontend now..."),(k=document.getElementById("build-command"))!=null&&k.value.trim(),(M=document.getElementById("start-command"))!=null&&M.value.trim(),(z=document.getElementById("port"))!=null&&z.value.trim();const B=await De(S,"frontend",w,!0);B&&B.success&&B.deployed_url?(w.showUrls(B.deployed_url,null),document.getElementById("close-deployment-dialog").onclick=()=>{w.close(),le(),Q()}):B&&!B.success&&setTimeout(()=>w.close(),3e3)}),x&&(x.onclick=async()=>{var j,k,M,z;const S=(j=U==null?void 0:U.value)==null?void 0:j.trim();if(!S||!S.startsWith("http"))return p("Enter a valid backend URL","error");const w=ge(!1);document.getElementById("step-backend").style.display="flex",w.updateBackendStatus("deploying","Deploying your backend now..."),(k=document.getElementById("build-command"))!=null&&k.value.trim(),(M=document.getElementById("start-command"))!=null&&M.value.trim(),(z=document.getElementById("port"))!=null&&z.value.trim();const B=await De(S,"backend",w,!0);B&&B.success&&B.deployed_url?(w.showUrls(null,B.deployed_url),document.getElementById("close-deployment-dialog").onclick=()=>{w.close(),le(),Q()}):B&&!B.success&&setTimeout(()=>w.close(),3e3)}),$&&($.onclick=async()=>{var M,z;const S=(M=A==null?void 0:A.value)==null?void 0:M.trim(),w=(z=U==null?void 0:U.value)==null?void 0:z.trim();if(!S||!S.startsWith("http")||!w||!w.startsWith("http")){p("Please enter valid Frontend and Backend repository URLs","error");return}let B=!1,j={};if(i&&i.id)try{const E=await fetch(`/api/env-vars?project_id=${i.id}`,{headers:D()});if(E.ok){const G=(await E.json()).variables||{};B=Object.keys(G).length>0,console.log("Existing env vars check:",{hasExistingEnvVars:B,count:Object.keys(G).length})}}catch(E){console.warn("Failed to check existing env vars:",E)}if(B){await k();return}try{const E=await fetch(`/api/env-vars/detect?frontend_url=${encodeURIComponent(S)}&backend_url=${encodeURIComponent(w)}`,{headers:D()});E.ok?(j=(await E.json()).suggestions||{},console.log("Env var detection result:",{count:Object.keys(j).length,vars:j})):console.warn("Env var detection API returned:",E.status)}catch(E){console.warn("Env var detection failed:",E)}gt(j,async()=>{if(Object.keys(j).length===0){i&&i.id?T.navigate("/env-vars"):(p("No env vars detected. Add them manually after deployment","info"),await k());return}if(p("Importing environment variables...","info"),i&&i.id){const E={};Object.keys(j).forEach(ie=>{E[ie]=""});const Z=localStorage.getItem("access_token")||localStorage.getItem("authToken"),G=await fetch(`/api/env-vars?project_id=${i.id}`,{headers:{Authorization:`Bearer ${Z}`}});if(G.ok){const ce={...(await G.json()).variables||{},...E};(await fetch("/api/env-vars",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${Z}`},body:JSON.stringify({variables:ce,project_id:i.id})})).ok?(p("Environment variables imported successfully!","success"),setTimeout(()=>k(),500)):(p("Failed to import environment variables","error"),await k())}else p("Failed to load existing environment variables","error"),await k()}else p("Save detected env vars after deployment","info"),await k()},()=>{i&&i.id?T.navigate("/env-vars"):p("Please add environment variables after deployment","info")},async()=>{await k()});async function k(){var Z,G,ie;const E=ge(!0);document.getElementById("step-backend").style.display="flex",document.getElementById("step-frontend").style.display="flex",E.updateBackendStatus("deploying","Deploying your backend now...");try{const F=new FormData;F.append("deploy_type","split"),F.append("frontend_url",S),F.append("backend_url",w),i&&i.id&&F.append("project_id",String(i.id));const ce=(Z=document.getElementById("build-command"))==null?void 0:Z.value.trim(),ye=(G=document.getElementById("start-command"))==null?void 0:G.value.trim(),Le=(ie=document.getElementById("port"))==null?void 0:ie.value.trim();ce&&F.append("build_command",ce),ye&&F.append("start_command",ye),Le&&F.append("port",Le);const $e=await fetch("/deploy",{method:"POST",headers:D(),body:F}),de=await $e.json();$e.ok&&de.deployed_url?(E.updateBackendStatus("success","Backend deployed! ✅"),E.updateFrontendStatus("success","Frontend deployed! ✅"),E.showUrls(de.deployed_url,null),document.getElementById("close-deployment-dialog").onclick=()=>{E.close(),H(),le(),Q()},p("Split deployment successful!","success")):(E.updateBackendStatus("failed",de.detail||"Deployment failed"),E.updateFrontendStatus("failed","Could not deploy"),p(de.detail||"Deployment failed","error"),setTimeout(()=>E.close(),3e3))}catch{E.updateBackendStatus("failed","Network error"),E.updateFrontendStatus("failed","Network error"),p("Network error during deployment","error"),setTimeout(()=>E.close(),3e3)}}}),f&&(f.style.display="none")}else if(N==="single"){if(m&&(m.style.display="block"),u&&(u.style.display="none"),y&&(y.style.display="none"),v&&i){const b=i.git_url||i.repository_url||"";b&&(v.value=b,v.removeAttribute("required"))}f&&(f.textContent="Deploy",f.style.display="")}}else c&&(c.style.display=""),splitGroup&&(splitGroup.style.display="none"),y&&(y.style.display="none"),m&&(m.style.display="block"),v&&(v.value=""),f&&(f.textContent="🚀 Deploy",f.style.display="")}document.getElementById("pageTitle").textContent="Deploy";break;case"status":ut();break;case"configuration":pt();break;case"domain-config":Me();break;case"env-vars":const t=document.getElementById("page-env-vars");t&&(t.style.display="block",Ce());break}}async function pt(){let n=document.getElementById("page-project-config");n||(n=document.createElement("div"),n.id="page-project-config",n.className="page",n.innerHTML=`
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
            <div class="config-label">Imported:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigCreated">${i!=null&&i.createdAt?Se(i.createdAt):"Unknown"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Last update:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigUpdated">${i!=null&&i.updatedAt?X(new Date(i.updatedAt)):"Unknown"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Port:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigPort">${(i==null?void 0:i.port)||"Not set"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Process PID:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigPid">${(i==null?void 0:i.processPid)||"Not running"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Start Command:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigStartCommand">${(i==null?void 0:i.startCommand)||"Not set"}</span>
            </div>
          </div>
          ${i!=null&&i.buildCommand?`
          <div class="config-row">
            <div class="config-label">Build Command:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigBuildCommand">${i.buildCommand}</span>
            </div>
          </div>
          `:""}
        </div>
        <div class="config-actions">
          <button class="btn-secondary" id="changeProjectNameBtn">Change project name</button>
        </div>
      </div>
    `,document.getElementById("pageContent").appendChild(n));const e=document.getElementById("project-components-section");e&&(e.style.display="none"),Ie();const t=document.getElementById("changeProjectNameBtn");t&&(t.onclick=()=>Ue()),n.style.display="block"}async function ut(){document.querySelectorAll(".page").forEach(e=>e.style.display="none");let n=document.getElementById("page-status");if(n||(n=document.createElement("div"),n.id="page-status",n.className="page",document.getElementById("pageContent").appendChild(n)),n.innerHTML="",i&&i.id)try{const e=await fetch(`/projects/${i.id}/components`,{headers:D()});if(e.ok){const o=(await e.json()).components||[],s=o.find(m=>m.component_type==="frontend"),a=o.find(m=>m.component_type==="backend"),r=s?s.status==="running"?"RUNNING":s.status.toUpperCase():"NOT DEPLOYED",l=a?a.status==="running"?"RUNNING":a.status.toUpperCase():"NOT DEPLOYED",d=(s==null?void 0:s.status)==="running"?"status-success":(s==null?void 0:s.status)==="failed"?"status-error":"status-info",c=(a==null?void 0:a.status)==="running"?"status-success":(a==null?void 0:a.status)==="failed"?"status-error":"status-info";n.innerHTML=`
          <div class="card">
            <h2 style="margin-bottom: 1.5rem;">Project Components</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
              <!-- Frontend Card -->
              <div class="project-card" style="margin: 0;">
                <div class="project-header">
                  <div class="project-icon">🌐</div>
                  <div class="project-status ${d}">${r}</div>
                </div>
                <div class="project-info">
                  <h3 class="project-name">Frontend</h3>
                  <div class="project-meta">
                    ${s?`
                      <svg class="icon-clock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12,6 12,12 16,14"></polyline>
                      </svg>
                      <span>Updated ${s.updated_at?X(new Date(s.updated_at)):"Recently"}</span>
                    `:"<span>Not deployed yet</span>"}
                  </div>
                  ${s&&s.status==="running"?`
                    <div class="project-metrics">
                      ${s.port?`
                      <div class="metric">
                        <span class="metric-label">Port</span>
                        <span class="metric-value">${s.port}</span>
                      </div>
                      `:""}
                      ${s.process_pid?`
                      <div class="metric">
                        <span class="metric-label">PID</span>
                        <span class="metric-value">${s.process_pid}</span>
                      </div>
                      `:""}
                    </div>
                  `:""}
                </div>
                ${s&&s.deployed_url?`
                  <div class="project-footer">
                    <button class="btn-dark btn-block btn-open-site" onclick="openSite('${s.deployed_url}')">Open Frontend</button>
                  </div>
                `:""}
              </div>
              
              <!-- Backend Card -->
              <div class="project-card" style="margin: 0;">
                <div class="project-header">
                  <div class="project-icon">💻</div>
                  <div class="project-status ${c}">${l}</div>
                </div>
                <div class="project-info">
                  <h3 class="project-name">Backend</h3>
                  <div class="project-meta">
                    ${a?`
                      <svg class="icon-clock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12,6 12,12 16,14"></polyline>
                      </svg>
                      <span>Updated ${a.updated_at?X(new Date(a.updated_at)):"Recently"}</span>
                    `:"<span>Not deployed yet</span>"}
                  </div>
                  ${a&&a.status==="running"?`
                    <div class="project-metrics">
                      ${a.port?`
                      <div class="metric">
                        <span class="metric-label">Port</span>
                        <span class="metric-value">${a.port}</span>
                      </div>
                      `:""}
                      ${a.process_pid?`
                      <div class="metric">
                        <span class="metric-label">PID</span>
                        <span class="metric-value">${a.process_pid}</span>
                      </div>
                      `:""}
                    </div>
                  `:""}
                </div>
                ${a&&a.deployed_url?`
                  <div class="project-footer">
                    <button class="btn-dark btn-block btn-open-site" onclick="openSite('${a.deployed_url}')">Open Backend</button>
                  </div>
                `:""}
              </div>
            </div>
          </div>
        `}}catch(e){console.error("Error loading project components:",e),n.innerHTML=`
        <div class="card">
          <p>Unable to load project components. Please try again later.</p>
        </div>
      `}n.style.display="block",document.getElementById("pageTitle").textContent="Status"}async function le(){if(!(!i||!i.id))try{const n=await fetch(`/projects/${i.id}/components`,{headers:D()});if(!n.ok)return;const t=(await n.json()).components||[],o=t.find(y=>y.component_type==="frontend"),s=t.find(y=>y.component_type==="backend"),a=o&&o.status&&o.status!=="imported"&&o.status!=="imported_split",r=s&&s.status&&s.status!=="imported"&&s.status!=="imported_split",l=a&&r;let d=document.getElementById("project-components-section");const c=document.getElementById("page-deploy"),m=document.getElementById("page-project-config"),u=m==null?void 0:m.querySelector("#project-components-section");if(u&&u.remove(),l&&c&&c.style.display!=="none"){if(!d){d=document.createElement("div"),d.id="project-components-section",d.className="card project-components-card";const C=c.querySelector(".card");C?c.insertBefore(d,C):c.appendChild(d)}d.style.display="block";const y=o?o.status==="running"?"RUNNING":o.status.toUpperCase():"NOT DEPLOYED",v=s?s.status==="running"?"RUNNING":s.status.toUpperCase():"NOT DEPLOYED",g=(o==null?void 0:o.status)==="running"?"status-success":(o==null?void 0:o.status)==="failed"?"status-error":"status-info",h=(s==null?void 0:s.status)==="running"?"status-success":(s==null?void 0:s.status)==="failed"?"status-error":"status-info";d.innerHTML=`
      <h2 style="margin-bottom: 1.5rem;">Project Components</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
        <!-- Frontend Card -->
        <div class="project-card" style="margin: 0;">
          <div class="project-header">
            <div class="project-icon">🌐</div>
            <div class="project-status ${g}">${y}</div>
          </div>
          <div class="project-info">
            <h3 class="project-name">Frontend</h3>
            <div class="project-meta">
              ${o?`
                <svg class="icon-clock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                <span>Updated ${o.updated_at?X(new Date(o.updated_at)):"Recently"}</span>
              `:"<span>Not deployed yet</span>"}
            </div>
            ${o&&o.status==="running"?`
              <div class="project-metrics">
                ${o.port?`
                <div class="metric">
                  <span class="metric-label">Port</span>
                  <span class="metric-value">${o.port}</span>
                </div>
                `:""}
                ${o.process_pid?`
                <div class="metric">
                  <span class="metric-label">PID</span>
                  <span class="metric-value">${o.process_pid}</span>
                </div>
                `:""}
              </div>
            `:""}
          </div>
          ${o&&o.deployed_url?`
            <div class="project-footer">
              <button class="btn-dark btn-block btn-open-site" onclick="openSite('${o.deployed_url}')">Open Frontend</button>
            </div>
          `:""}
        </div>
        
        <!-- Backend Card -->
        <div class="project-card" style="margin: 0;">
          <div class="project-header">
            <div class="project-icon">💻</div>
            <div class="project-status ${h}">${v}</div>
          </div>
          <div class="project-info">
            <h3 class="project-name">Backend</h3>
            <div class="project-meta">
              ${s?`
                <svg class="icon-clock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                <span>Updated ${s.updated_at?X(new Date(s.updated_at)):"Recently"}</span>
              `:"<span>Not deployed yet</span>"}
            </div>
            ${s&&s.status==="running"?`
              <div class="project-metrics">
                ${s.port?`
                <div class="metric">
                  <span class="metric-label">Port</span>
                  <span class="metric-value">${s.port}</span>
                </div>
                `:""}
                ${s.process_pid?`
                <div class="metric">
                  <span class="metric-label">PID</span>
                  <span class="metric-value">${s.process_pid}</span>
                </div>
                `:""}
              </div>
            `:""}
          </div>
          ${s&&s.deployed_url?`
            <div class="project-footer">
              <button class="btn-dark btn-block btn-open-site" onclick="openSite('${s.deployed_url}')">Open Backend</button>
            </div>
          `:""}
        </div>
      </div>
    `,requestAnimationFrame(()=>{d.classList.add("components-visible");const C=c.querySelector(".card:not(#project-components-section)");C&&C.classList.add("deploy-card-slide-down")})}else if(d){d.style.display="none",d.classList.remove("components-visible");const y=c==null?void 0:c.querySelector(".card:not(#project-components-section)");y&&y.classList.remove("deploy-card-slide-down")}}catch(n){console.error("Error loading project components:",n)}}function Ae(n){if(!n||n==="#")return null;const e=n.trim();return/^https?:\/\//i.test(e)?e:`https://${e}`}function yt(n){const e=Ae(n);e?window.open(e,"_blank"):p("Site URL is unavailable","error")}function gt(n,e,t,o){const s=document.createElement("div");s.className="modal-overlay",s.id="envVarsDetectionOverlay";const a=document.createElement("div");a.className="modal-content enhanced",a.style.maxWidth="600px";const r=Object.keys(n).length>0,l=r?Object.entries(n).map(([c,m])=>`
      <div class="env-var-suggestion" style="padding: 0.75rem; margin-bottom: 0.5rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="font-weight: 600; color: #111827; margin-bottom: 0.25rem;">${c}</div>
        <div style="font-size: 0.875rem; color: #6b7280;">
          Detected from: ${m.detected_from} (${m.source})
          ${m.component?` | Component: ${m.component}`:""}
        </div>
      </div>
    `).join(""):`
      <div style="padding: 2rem; text-align: center; color: #6b7280;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
        <p style="font-size: 1rem; margin-bottom: 0.5rem;">No environment variables detected in your code.</p>
        <p style="font-size: 0.875rem;">You can add them manually or proceed without them.</p>
      </div>
    `;a.innerHTML=`
    <div style="padding: 1.5rem; border-bottom: 1px solid #e5e7eb;">
      <h2 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">🔍 Environment Variables</h2>
      <p style="color: #6b7280; font-size: 0.875rem;">
        ${r?`We found ${Object.keys(n).length} environment variables in your code. Choose how to proceed:`:"No environment variables were detected. You can add them manually or proceed without them."}
      </p>
    </div>
    <div style="padding: 1.5rem; max-height: 400px; overflow-y: auto;">
      ${l}
    </div>
    <div style="padding: 1.5rem; border-top: 1px solid #e5e7eb; display: flex; gap: 0.75rem; justify-content: flex-end;">
      <button class="btn-secondary skip-env-btn" style="padding: 0.75rem 1.5rem;">No, Skip</button>
      <button class="btn-secondary add-manual-env-btn" style="padding: 0.75rem 1.5rem;">Add Manually</button>
      ${r?'<button class="btn-primary import-env-btn" style="padding: 0.75rem 1.5rem;">✅ Import All</button>':""}
    </div>
  `,s.appendChild(a),document.body.appendChild(s),document.querySelector(".skip-env-btn").onclick=()=>{s.remove(),o&&o()},document.querySelector(".add-manual-env-btn").onclick=()=>{s.remove(),t&&t()};const d=document.querySelector(".import-env-btn");return d&&(d.onclick=async()=>{s.remove(),e&&await e()}),s}function ge(n=!0){const e=document.createElement("div");e.className="modal-overlay deployment-progress-overlay",e.id="deploymentProgressOverlay";const t=document.createElement("div");return t.className="deployment-progress-modal",t.innerHTML=`
    <div class="deployment-progress-header">
      <h3>🚀 Deployment in Progress</h3>
    </div>
    <div class="deployment-progress-body">
      <div class="progress-steps">
        <div class="progress-step" id="step-backend" ${n?"":'style="display: none;"'}>
          <div class="step-icon">⏳</div>
          <div class="step-content">
            <div class="step-title">Backend</div>
            <div class="step-message" id="backend-message">Waiting...</div>
          </div>
          <div class="step-status" id="backend-status"></div>
        </div>
        <div class="progress-step" id="step-frontend" ${n?"":'style="display: none;"'}>
          <div class="step-icon">⏳</div>
          <div class="step-content">
            <div class="step-title">Frontend</div>
            <div class="step-message" id="frontend-message">Waiting...</div>
          </div>
          <div class="step-status" id="frontend-status"></div>
        </div>
      </div>
      <div class="deployment-urls" id="deployment-urls" style="display: none;">
        <div class="url-item">
          <span class="url-label">Visit your site:</span>
          <a href="#" id="frontend-url-link" target="_blank" class="url-link"></a>
        </div>
        <div class="url-item">
          <span class="url-label">Check your backend:</span>
          <a href="#" id="backend-url-link" target="_blank" class="url-link"></a>
        </div>
      </div>
    </div>
    <div class="deployment-progress-footer">
      <button class="btn-primary" id="close-deployment-dialog" style="display: none;">Done</button>
    </div>
  `,e.appendChild(t),document.body.appendChild(e),{overlay:e,updateBackendStatus:(o,s)=>{const a=document.getElementById("step-backend"),r=a.querySelector(".step-icon"),l=document.getElementById("backend-status"),d=document.getElementById("backend-message");d.textContent=s,o==="deploying"?(r.textContent="⏳",l.textContent="",a.classList.remove("completed","failed"),a.classList.add("active")):o==="success"?(r.textContent="✅",l.textContent="✓",a.classList.remove("active","failed"),a.classList.add("completed")):o==="failed"&&(r.textContent="❌",l.textContent="✗",a.classList.remove("active","completed"),a.classList.add("failed"))},updateFrontendStatus:(o,s)=>{const a=document.getElementById("step-frontend"),r=a.querySelector(".step-icon"),l=document.getElementById("frontend-status"),d=document.getElementById("frontend-message");d.textContent=s,o==="deploying"?(r.textContent="⏳",l.textContent="",a.classList.remove("completed","failed"),a.classList.add("active")):o==="success"?(r.textContent="✅",l.textContent="✓",a.classList.remove("active","failed"),a.classList.add("completed")):o==="failed"&&(r.textContent="❌",l.textContent="✗",a.classList.remove("active","completed"),a.classList.add("failed"))},showUrls:(o,s)=>{const a=document.getElementById("deployment-urls"),r=document.getElementById("frontend-url-link"),l=document.getElementById("backend-url-link"),d=document.getElementById("close-deployment-dialog");o?(r.href=o,r.textContent=o,r.closest(".url-item").style.display="flex"):r.closest(".url-item").style.display="none",s?(l.href=s,l.textContent=s,l.closest(".url-item").style.display="flex"):l.closest(".url-item").style.display="none",a.style.display="block",d.style.display="block"},close:()=>{const o=document.getElementById("deploymentProgressOverlay");o&&document.body.removeChild(o)}}}function Ue(){if(!i){p("No project selected","error");return}const n=document.createElement("div");n.className="modal-overlay";const e=document.createElement("div");e.className="modal-content enhanced",e.innerHTML=`
    <div class="project-name-modal-header">
      <h2 class="project-name-modal-title">Change Project Name</h2>
      <p class="project-name-modal-subtitle">
        Update the name for <strong>${I(i.name)}</strong>
      </p>
    </div>
    
    <div class="project-name-modal-form-group">
      <label class="project-name-modal-label">Project Name</label>
      <input 
        type="text" 
        id="newProjectNameInput"
        class="project-name-modal-input"
        value="${I(i.name)}"
        placeholder="Enter new project name"
      />
    </div>
    
    <div class="project-name-modal-actions">
      <button class="cancel-name-btn">Cancel</button>
      <button class="save-name-btn">Save Changes</button>
    </div>
  `,n.appendChild(e),document.body.appendChild(n);const t=document.getElementById("newProjectNameInput");t&&(t.focus(),t.select());const o=e.querySelector(".cancel-name-btn"),s=e.querySelector(".save-name-btn"),a=()=>{document.body.removeChild(n)};o.onclick=()=>{a()},s.onclick=async()=>{const l=t.value.trim();if(!l){p("Project name cannot be empty","error");return}if(l===i.name){a();return}try{const d=localStorage.getItem("access_token")||localStorage.getItem("authToken"),c=await fetch(`/projects/${i.id}/name`,{method:"PUT",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${d}`},body:new URLSearchParams({app_name:l})}),m=await c.json();if(c.ok){p("Project name updated successfully!","success"),i.name=l,a();const u=L.findIndex(v=>v.id===i.id);u>=0&&(L[u].name=l),Ie(),J(V);const y=document.getElementById("projectSidebarName");y&&(y.textContent=l),document.getElementById("pageTitle").textContent=l}else p(m.detail||"Failed to update project name","error")}catch(d){console.error("Error updating project name:",d),p("Failed to update project name: "+d.message,"error")}},n.onclick=l=>{l.target===n&&a()};const r=l=>{l.key==="Escape"&&(a(),document.removeEventListener("keydown",r))};document.addEventListener("keydown",r)}function ft(n){const e=document.getElementById("content"+n.charAt(0).toUpperCase()+n.slice(1)),t=document.getElementById("icon"+n.charAt(0).toUpperCase()+n.slice(1));e&&t&&(e.classList.toggle("active"),t.classList.toggle("active"))}function vt(){i&&i.id?typeof T<"u"&&T&&T.navigate?T.navigate("/env-vars"):window.router&&window.router.navigate?window.router.navigate("/env-vars"):window.location.hash="#/env-vars":p("Please create a project first before adding environment variables","info")}function ht(){const n=document.getElementById("framework-preset"),e=document.getElementById("install-command"),t=document.getElementById("build-command"),o=document.getElementById("start-command");n&&n.addEventListener("change",function(s){const a=s.target.value;if(e&&(["nextjs","react","vue","nuxt","gatsby","angular","svelte","vite","nodejs"].includes(a)?e.placeholder="npm install, yarn install, or pnpm install":["python","flask","django"].includes(a)?e.placeholder="pip install -r requirements.txt":e.placeholder="npm install, yarn install, pnpm install, or pip install -r requirements.txt"),t){const r={nextjs:"next build",react:"npm run build",vue:"npm run build",nuxt:"nuxt build",gatsby:"gatsby build",angular:"ng build",svelte:"npm run build",vite:"vite build",nodejs:"npm run build",python:"",flask:"",django:"python manage.py collectstatic --noinput",static:""};r[a]&&(t.placeholder=r[a]||"Leave empty for auto-detect")}if(o){const r={nextjs:"npm run start",react:"npm start",vue:"npm run serve",nuxt:"nuxt start",gatsby:"gatsby serve",angular:"ng serve",svelte:"npm run dev",vite:"vite preview",nodejs:"node server.js",python:"python app.py",flask:"flask run",django:"python manage.py runserver",static:"python -m http.server"};r[a]&&(o.placeholder=r[a]||"Leave empty for auto-detect")}})}window.toggleDeploySection=ft;window.navigateToEnvVars=vt;function Ie(){if(!i)return;const n=document.getElementById("projectConfigName"),e=document.getElementById("projectConfigOwner"),t=document.getElementById("projectConfigId"),o=document.getElementById("projectConfigCreated"),s=document.getElementById("projectConfigUpdated"),a=document.getElementById("projectConfigPort"),r=document.getElementById("projectConfigPid"),l=document.getElementById("projectConfigStartCommand"),d=document.getElementById("projectConfigBuildCommand");if(n&&(n.textContent=i.name||"Unknown"),e){const c=localStorage.getItem("username"),m=localStorage.getItem("displayName");e.textContent=m||c||"Unknown User"}t&&(t.textContent=i.id||"-"),o&&(o.textContent=i.createdAt?Se(i.createdAt):"Unknown"),s&&(s.textContent=i.updatedAt?X(new Date(i.updatedAt)):"Unknown"),a&&(a.textContent=(i==null?void 0:i.port)||"Not set"),r&&(r.textContent=(i==null?void 0:i.processPid)||"Not running"),l&&(l.textContent=(i==null?void 0:i.startCommand)||"Not set"),d&&(d.textContent=(i==null?void 0:i.buildCommand)||"Not set")}function Me(){let n=document.getElementById("page-project-domain");n||(n=document.createElement("div"),n.id="page-project-domain",n.className="page",n.innerHTML=`
      <div class="card">
        <h2>Domain Configuration</h2>
        <div class="domain-config">
          <div class="config-option">
            <h3>🌐 Use Custom Domain</h3>
            <p>Configure a custom domain for this project. You can use multiple labels in the prefix (e.g., "portfolio.app" or "my.project"). The platform domain is fixed.</p>
            <div class="form-group">
              <label for="customDomain">Custom Domain</label>
              <div class="domain-input-wrapper">
                <input type="text" id="domainPrefix" class="domain-prefix-input" placeholder="project-slug or my.project" />
                <span class="domain-separator">.</span>
                <span class="domain-platform" id="platformDomain">butler.example.com</span>
              </div>
              <p class="domain-hint" id="domainSuggestion"></p>
            </div>
            <div class="domain-actions">
              <button class="btn-primary" id="saveDomainBtn">Save Domain</button>
            </div>
            <div class="domain-status" id="domainStatus"></div>
          </div>
        </div>
      </div>
    `,document.getElementById("pageContent").appendChild(n)),n.style.display="block",bt(),pe()}function bt(){const n=document.getElementById("saveDomainBtn");n&&!n.dataset.bound&&(n.dataset.bound="true",n.addEventListener("click",Et))}function wt(n,e){if(!n)return;if(!e||!e.custom_domain){n.innerHTML='<span class="status-muted">No custom domain configured yet.</span>';return}const t=(e.domain_status||"unknown").toLowerCase(),o=e.last_domain_sync?Se(e.last_domain_sync):"Never";let s="Unknown",a="status-info",r="";t==="active"?(s="Active",a="status-success"):t==="error"?(s="Error",a="status-error",r="Resolve the issue and save the domain again."):t==="pending"&&(s="Pending",a="status-warning",r="Domain will be activated automatically after the next successful deployment."),n.innerHTML=`
    <div class="domain-status-line ${a}">
      <div class="domain-status-domain">
        <strong>${I(e.custom_domain)}</strong>
      </div>
      <div class="domain-status-meta">
        <span>${s}</span>
        <span>Last sync: ${I(o)}</span>
      </div>
      ${r?`<p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">${I(r)}</p>`:""}
    </div>
  `}async function pe(){const n=document.getElementById("domainSuggestion"),e=document.getElementById("domainStatus"),t=document.getElementById("domainPrefix"),o=document.getElementById("platformDomain");if(!i||!i.id){e&&(e.innerHTML='<span class="status-muted">Select a project to configure its domain.</span>');return}const s=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!s){e&&(e.innerHTML='<span class="status-error">Please login to manage domains.</span>');return}n&&(n.textContent="Loading domain details...");try{const a=await fetch(`/projects/${i.id}/domain`,{headers:{Authorization:`Bearer ${s}`}});if(!a.ok)throw new Error(`Failed to load domain info (${a.status})`);const r=await a.json(),l=r.butler_domain||"butler.example.com";o&&(o.textContent=l);let d="";const c=r.custom_domain||r.suggested_domain||"";if(c)if(c.endsWith(l))d=c.slice(0,-(l.length+1));else{const m=c.split(".");m.length>0&&(d=m[0])}if(t){t.value=d;const m=r.suggested_domain&&r.suggested_domain.endsWith(l)?r.suggested_domain.slice(0,-(l.length+1)):"";t.placeholder=m||"project-slug or my.project"}if(n){const m=r.suggested_domain&&r.suggested_domain.endsWith(l)?r.suggested_domain.slice(0,-(l.length+1)):"";n.textContent=m?`Suggested: ${m} (you can use multiple labels like "my.project" or "portfolio.app"). Leave blank to remove. Domains become active after a successful deploy.`:`Enter a subdomain prefix (can be multiple labels like "my.project" or "portfolio"). The platform domain ${l} is fixed and cannot be changed.`}wt(e,r),i&&(i.custom_domain=r.custom_domain,i.domain_status=r.domain_status)}catch(a){console.error("Failed to load project domain info:",a),e&&(e.innerHTML='<span class="status-error">Could not load domain configuration.</span>')}}async function Et(){if(!i||!i.id){p("Select a project first","error");return}const n=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!n){p("Please login to manage domains","error");return}const e=document.getElementById("domainPrefix"),t=document.getElementById("platformDomain");let o=e?e.value.trim():"";const s=t?t.textContent.trim():"";let a="";if(o){if(o=o.trim().replace(/^\.+|\.+$/g,""),!o){p("Please enter a subdomain prefix.","error");return}if(!/^[a-z0-9.-]+$/i.test(o)){p("Subdomain prefix can only contain letters, numbers, hyphens, and dots.","error");return}if(o.includes("..")){p("Subdomain prefix cannot contain consecutive dots.","error");return}if(o.startsWith(".")||o.endsWith(".")){p("Subdomain prefix cannot start or end with a dot.","error");return}a=`${o}.${s}`}if(!a){if(!i.custom_domain){p("Enter a subdomain prefix to save, or leave blank to remove the domain.","info");return}if(!confirm("Remove the custom domain and revert to the default internal URL?"))return;await kt(),await pe();return}const r={custom_domain:a,auto_generate:!1};try{const l=await fetch(`/projects/${i.id}/domain`,{method:"POST",headers:{Authorization:`Bearer ${n}`,"Content-Type":"application/json"},body:JSON.stringify(r)});if(!l.ok){const m=(await l.json().catch(()=>({}))).detail||"Failed to save domain";if(l.status===409){p(m,"error");const y=document.getElementById("domainStatus");y&&(y.innerHTML=`<span class="status-error">${I(m)}</span>`)}else throw new Error(m);return}const d=await l.json();p(`Domain saved: ${d.custom_domain}`,"success"),await pe()}catch(l){console.error("Failed to save domain:",l),p(l.message||"Failed to save domain","error");const d=document.getElementById("domainStatus");d&&l.message&&(d.innerHTML=`<span class="status-error">${I(l.message)}</span>`)}}async function kt(){if(!i||!i.id){p("Select a project first","error");return}const n=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!n){p("Please login to manage domains","error");return}try{const e=await fetch(`/projects/${i.id}/domain`,{method:"DELETE",headers:{Authorization:`Bearer ${n}`}});if(!e.ok){const o=(await e.json().catch(()=>({}))).detail||"Failed to reset domain";throw new Error(o)}p("Domain removed. Project will use its internal URL.","success"),i&&(i.custom_domain=null,i.domain_status=null),await pe()}catch(e){console.error("Failed to clear domain:",e),p(e.message||"Failed to clear domain","error")}}function Bt(n){ke(n)}async function Fe(){const n=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!n){console.log("No auth token found");return}try{const e=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${n}`}});if(e.ok){const t=await e.json(),o=document.getElementById("projectSidebar");if(o){const s=o.querySelector("#projectSidebarUserName"),a=o.querySelector("#projectSidebarUserEmail"),r=o.querySelector("#projectSidebarUserAvatar");if(s&&(s.textContent=t.display_name||t.username||"User"),a&&(a.textContent=t.email||"No email"),r)if(t.avatar_url){const l=new Image;l.onload=()=>{r.style.backgroundImage=`url(${t.avatar_url})`,r.style.backgroundSize="cover",r.style.backgroundPosition="center",r.textContent=""},l.onerror=()=>{r.style.backgroundImage="",r.textContent=(t.display_name||t.username||"U").charAt(0).toUpperCase()},l.src=t.avatar_url}else r.style.backgroundImage="",r.textContent=(t.display_name||t.username||"U").charAt(0).toUpperCase()}}else console.error("Failed to load user profile:",e.status)}catch(e){console.error("Error loading user profile:",e)}}function X(n){if(!n)return"Recently";const t=Date.now()-new Date(n).getTime(),o=Math.floor(t/6e4),s=Math.floor(t/36e5),a=Math.floor(t/864e5);if(o<1)return"Just now";if(o<60)return`${o}m ago`;if(s<24)return`${s}h ago`;if(a<7)return`${a}d ago`;const r=new Date(n);return r.toLocaleDateString("en-US",{month:"short",day:"numeric",year:r.getFullYear()!==new Date().getFullYear()?"numeric":void 0})}function Se(n){return n?new Date(n).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit",hour12:!0,timeZone:"Asia/Kathmandu"}):"Unknown"}async function It(n,e){const t=document.getElementById("monorepo-section"),o=document.getElementById("frontend-folder"),s=document.getElementById("backend-folder");if(!(!t||!o||!s))try{const a=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!a)return;const r=n?`/api/detect-monorepo?project_id=${n}`:`/api/detect-monorepo?git_url=${encodeURIComponent(e)}`,l=await fetch(r,{headers:{Authorization:`Bearer ${a}`}});if(l.ok){const d=await l.json();if(d.is_monorepo){if(t.style.display="block",d.frontend_folder){o.innerHTML='<option value="">None (skip frontend)</option>';const c=document.createElement("option");c.value=d.frontend_folder,c.textContent=d.frontend_folder,c.selected=!0,o.appendChild(c)}else o.innerHTML='<option value="">None (skip frontend)</option>';if(d.backend_folder){s.innerHTML='<option value="">None (skip backend)</option>';const c=document.createElement("option");c.value=d.backend_folder,c.textContent=d.backend_folder,c.selected=!0,s.appendChild(c)}else s.innerHTML='<option value="">None (skip backend)</option>'}else t.style.display="none"}}catch(a){console.error("Error detecting monorepo structure:",a),t.style.display="none"}}async function Q(){await H();try{const n=await fetch("/deployments",{headers:D()});if(n.ok){const e=await n.json();document.getElementById("totalDeployments").textContent=e.length,document.getElementById("runningApps").textContent=e.filter(o=>o.status==="success").length;const t=document.getElementById("recentActivity");e.length>0?t.innerHTML=e.slice(0,5).map(o=>{const s=o.app_name||o.container_name||"Untitled Project";return`
          <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
            <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 0.25rem;">${I(s)}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">
              ${new Date(o.created_at).toLocaleString("en-US",{timeZone:"Asia/Kathmandu"})}
            </div>
          </div>
        `}).join(""):t.innerHTML='<p class="recent-activity-empty">No recent activity</p>'}}catch(n){console.error("Error loading dashboard:",n)}}async function St(n){var m,u,y,v,g,h,C,O,K,q,_,A,U;if(n.preventDefault(),!te){p("Please login to deploy applications","error"),window.location.href="/login";return}const e=n.target,t=((m=document.getElementById("deploy-type"))==null?void 0:m.value)||"single",o=document.getElementById("deploy-status"),s=document.getElementById("deploy-success");s.style.display="none",o.textContent="";let a="";if(i&&i.id){a=i.git_url||i.repository_url||"",console.log("Deploying existing project:",{projectId:i.id,projectName:i.name,gitUrl:a,hasGitUrl:!!a});const f=document.getElementById("git-url");f&&a&&(f.value=a,console.log("Populated hidden Git URL input with:",a)),a||f&&(a=f.value.trim(),console.log("Got Git URL from input field (fallback):",a))}else{const f=document.getElementById("git-url");a=f?f.value.trim():"",console.log("Deploying new project, Git URL from input:",a)}const r=(u=document.getElementById("frontend-url"))==null?void 0:u.value.trim(),l=(y=document.getElementById("backend-url"))==null?void 0:y.value.trim(),d=i==null?void 0:i.custom_domain,c=i!=null&&i.domain_status?i.domain_status.toLowerCase():null;if(d?d&&c!=="active"&&p("Domain saved. It will activate after this deployment.","info"):console.log("No custom domain configured - deployment will use internal URL"),t==="split"){if(!r||!r.startsWith("http")||!l||!l.startsWith("http")){o.textContent="Please enter valid Frontend and Backend repository URLs",o.style.color="var(--error)";return}}else if(!a||!a.startsWith("http")){o.textContent=`Please enter a valid Git repository URL. Current project: ${(i==null?void 0:i.name)||"unknown"}, Git URL: ${a||"missing"}`,o.style.color="var(--error)",console.error("Git URL validation failed:",{currentProject:i,gitUrl:a,gitUrlInput:(v=document.getElementById("git-url"))==null?void 0:v.value});return}console.log("Git URL validation passed:",a),o.textContent="🚀 Deploying...",o.style.color="var(--primary)";try{const f=new FormData;t==="split"?(f.append("deploy_type","split"),f.append("frontend_url",r),f.append("backend_url",l)):(f.append("deploy_type","single"),f.append("git_url",a)),typeof i=="object"&&i&&i.id&&f.append("project_id",String(i.id));const ae=(g=document.getElementById("project-name"))==null?void 0:g.value.trim();ae&&f.append("project_name",ae);const N=((h=document.getElementById("root-directory"))==null?void 0:h.value.trim())||"./";N&&f.append("root_directory",N);const ne=(C=document.getElementById("framework-preset"))==null?void 0:C.value;ne&&ne!=="auto"&&f.append("framework_preset",ne);const oe=(O=document.getElementById("install-command"))==null?void 0:O.value.trim();oe&&f.append("install_command",oe);const b=(K=document.getElementById("build-command"))==null?void 0:K.value.trim(),x=(q=document.getElementById("start-command"))==null?void 0:q.value.trim(),$=(_=document.getElementById("port"))==null?void 0:_.value.trim();b&&f.append("build_command",b),x&&f.append("start_command",x),$&&f.append("port",$);const S=document.getElementById("monorepo-section"),w=(A=document.getElementById("frontend-folder"))==null?void 0:A.value.trim(),B=(U=document.getElementById("backend-folder"))==null?void 0:U.value.trim();S&&S.style.display!=="none"&&(w||B)&&(f.append("is_monorepo","true"),w&&f.append("frontend_folder",w),B&&f.append("backend_folder",B));const j=await fetch("/deploy",{method:"POST",headers:D(),body:f}),k=await j.json();j.ok?(o.textContent="✅ Deployment successful!",o.style.color="var(--success)",k.deployed_url&&(s.style.display="block",document.getElementById("openAppBtn").href=k.deployed_url,document.getElementById("openAppBtn").textContent=`Open ${k.deployed_url}`),e.reset(),i&&i.isSplit?setTimeout(()=>{le(),Q()},1500):setTimeout(()=>{Q(),T.navigate("/applications")},2e3)):j.status===423?(o.textContent=`⏳ ${k.detail||"Your virtual machine is being created. Please wait a few moments and try again."}`,o.style.color="var(--warning)",p(k.detail||"Your virtual machine is being created. Please wait a few moments and try again.","warning")):(o.textContent=`❌ Error: ${k.detail||"Deployment failed"}`,o.style.color="var(--error)",p(k.detail||"Deployment failed","error"))}catch{o.textContent="❌ Network error. Please try again.",o.style.color="var(--error)",p("Network error. Please try again.","error")}}async function De(n,e=null,t=null,o=!1){const s=document.getElementById("deploy-status"),a=document.getElementById("deploy-success");if(!te)return p("Please login to deploy applications","error"),window.location.href="/login",o?{success:!1,error:"Not authenticated"}:void 0;t||(a&&(a.style.display="none"),s&&(s.textContent="",s.style.color="var(--primary)"));try{const r=new FormData;r.append("deploy_type","single"),r.append("git_url",n),typeof i=="object"&&i&&i.id&&r.append("project_id",String(i.id)),e&&typeof i=="object"&&i&&i.project_type==="split"&&r.append("component_type",e),buildCommand&&r.append("build_command",buildCommand),startCommand&&r.append("start_command",startCommand),port&&r.append("port",port);const l=await fetch("/deploy",{method:"POST",headers:D(),body:r}),d=await l.json();if(l.ok){if(t){const c="success",m=e==="backend"?"Backend complete! ✅":"Frontend complete! ✅";e==="backend"?t.updateBackendStatus(c,m):e==="frontend"&&t.updateFrontendStatus(c,m)}else if(s&&(s.textContent="✅ Deployment successful!",s.style.color="var(--success)"),d.deployed_url&&a){a.style.display="block";const c=document.getElementById("openAppBtn");c&&(c.href=d.deployed_url,c.textContent=`Open ${d.deployed_url}`)}return o?{success:!0,deployed_url:d.deployed_url}:(i&&i.isSplit?setTimeout(()=>{le(),Q()},1500):setTimeout(()=>{Q(),T.navigate("/applications")},2e3),{success:!0,deployed_url:d.deployed_url})}else{const c=d.detail||"Deployment failed";if(t){const m="failed",u=`Error: ${c}`;e==="backend"?t.updateBackendStatus(m,u):e==="frontend"&&t.updateFrontendStatus(m,u)}else s&&(s.textContent=`❌ Error: ${c}`,s.style.color="var(--error)");if(o)return{success:!1,error:c}}}catch{const l="Network error. Please try again.";if(t){const d="failed",c=l;e==="backend"?t.updateBackendStatus(d,c):e==="frontend"&&t.updateFrontendStatus(d,c)}else s&&(s.textContent=`❌ ${l}`,s.style.color="var(--error)");if(o)return{success:!1,error:l}}}async function jt(){if(!te){document.getElementById("applicationsGrid").innerHTML=`
      <div class="empty-state">
        <p>Please login to view your applications</p>
        <a href="/login" class="btn-primary">Login</a>
      </div>
    `;return}try{const n=await fetch("/deployments",{headers:D()});if(n.ok){const e=await n.json(),t=document.getElementById("applicationsGrid");e.length===0?t.innerHTML=`
          <div class="empty-state">
            <p>No applications deployed yet</p>
            <a href="/deploy" class="btn-primary">Deploy Your First App</a>
          </div>
        `:t.innerHTML=e.map(o=>{const s=o.app_name||o.container_name||"Untitled Project";return`
          <div class="application-card" onclick="window.open('${o.deployed_url||"#"}', '_blank')">
            <h3>${I(s)}</h3>
            <p style="color: var(--text-secondary); margin: 0.5rem 0;">
              ${o.git_url}
            </p>
            <div style="margin-top: 1rem;">
              <span class="status-badge ${o.status}">
                ${o.status==="success"?"✅":o.status==="failed"?"❌":"🔄"} 
                ${o.status}
              </span>
            </div>
            ${o.deployed_url?`
              <div style="margin-top: 1rem;">
                <a href="${o.deployed_url}" target="_blank" class="btn-primary" style="width: 100%;">
                  Open Application
                </a>
              </div>
            `:""}
          </div>
        `}).join("")}}catch(n){console.error("Error loading applications:",n)}}async function je(){if(!te){document.getElementById("historyTableBody").innerHTML=`
      <tr>
        <td colspan="4" class="empty-state">Please login to view deployment history</td>
      </tr>
    `;return}try{const n=await fetch("/deployments",{headers:D()});if(n.ok){const e=await n.json(),t=document.getElementById("historyTableBody");e.length===0?t.innerHTML=`
          <tr>
            <td colspan="4" class="empty-state">No deployment history</td>
          </tr>
        `:t.innerHTML=e.map(o=>{const s=o.app_name||o.container_name||"Untitled Project";return`
          <tr>
            <td><strong>${I(s)}</strong></td>
            <td>
              <span class="status-badge ${o.status}">
                ${o.status==="success"?"✅":o.status==="failed"?"❌":"🔄"} 
                ${o.status}
              </span>
            </td>
            <td>
              ${o.deployed_url?`<a href="${o.deployed_url}" target="_blank">${o.deployed_url}</a>`:"N/A"}
            </td>
            <td>${new Date(o.created_at).toLocaleString("en-US",{timeZone:"Asia/Kathmandu"})}</td>
          </tr>
        `}).join("")}}catch(n){console.error("Error loading history:",n)}}async function Ct(){if(confirm("Are you sure you want to clear all deployment history?"))try{(await fetch("/deployments/clear",{method:"DELETE",headers:D()})).ok&&(p("History cleared successfully","success"),je())}catch{p("Error clearing history","error")}}async function xt(n){if(confirm(`Are you sure you want to destroy "${n}"?`))try{(await fetch(`/deployments/${n}`,{method:"DELETE",headers:D()})).ok?(p("Deployment destroyed successfully","success"),je(),jt()):p("Error destroying deployment","error")}catch{p("Network error","error")}}let P=[],Ne="";async function Re(){const n=document.getElementById("usernameSearch").value.trim();if(!n){p("Please enter a GitHub username","error");return}n!==Ne&&(P=[],Ne=n);const e=document.getElementById("repositoriesGrid");e.innerHTML='<div class="empty-state"><p>Loading repositories...</p></div>';try{const t=await fetch(`/api/repositories/${n}`),o=await t.json();t.ok&&o.repositories?o.repositories.length===0?e.innerHTML='<div class="empty-state"><p>No repositories found</p></div>':(e.innerHTML=o.repositories.map(s=>`
          <div class="repository-card ${P.some(r=>r.url===s.clone_url)?"selected":""}" data-repo-url="${s.clone_url}" onclick="toggleRepositorySelection('${s.clone_url}', '${s.name}')">
            <h3>${s.name}</h3>
            <p style="color: var(--text-secondary); margin: 0.5rem 0;">
              ${s.description||"No description"}
            </p>
            <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.875rem; color: var(--text-secondary);">
                ${s.language||"Unknown"} • ${s.stargazers_count||0} stars
              </span>
              <button class="btn-primary btn-small" onclick="event.stopPropagation(); importRepository('${s.clone_url}', '${s.name}')">
                📥 Import
              </button>
            </div>
        </div>
        `).join(""),we()):e.innerHTML=`<div class="empty-state"><p>${o.detail||"Error loading repositories"}</p></div>`}catch{e.innerHTML='<div class="empty-state"><p>Error loading repositories</p></div>'}}function _t(n,e){const t=P.findIndex(o=>o.url===n);if(t>=0)P.splice(t,1),we();else{if(P.length>=2){p("You can only select up to 2 repositories for a split repository","error");return}P.push({url:n,name:e}),P.length===2&&Lt(),we()}}function Lt(){const[n,e]=P,t=document.createElement("div");t.className="modal-overlay",t.id="splitImportModal";const o=document.createElement("div");o.className="modal-content enhanced",o.innerHTML=`
    <div class="split-import-modal-center">
      <div class="split-import-icon-wrapper">
        📦
      </div>
      <h2 class="split-import-modal-title">Import as Multi-Repository?</h2>
      <p class="split-import-modal-text">
        This will create a multi-repository project with frontend and backend components.
      </p>
    </div>
    
    <div class="split-import-repo-info">
      <div class="split-import-repo-item">
        <div class="split-import-repo-label">Frontend</div>
        <div class="split-import-repo-name">${I(n.name)}</div>
        <div class="split-import-repo-url">${I(n.url)}</div>
      </div>
      
      <div class="split-import-divider"></div>
      
      <div class="split-import-repo-item">
        <div class="split-import-repo-label">Backend</div>
        <div class="split-import-repo-name">${I(e.name)}</div>
        <div class="split-import-repo-url">${I(e.url)}</div>
      </div>
    </div>
    
    <div class="split-import-actions">
      <button class="cancel-btn">Cancel</button>
      <button class="confirm-btn">Import Multi-Repository</button>
    </div>
  `,t.appendChild(o),document.body.appendChild(t);const s=o.querySelector(".cancel-btn"),a=o.querySelector(".confirm-btn"),r=()=>{document.body.removeChild(t)};s.onclick=()=>{r()},a.onclick=()=>{r();const[d,c]=P;Ve(d.url,c.url,`${d.name}-${c.name}`)},t.onclick=d=>{d.target===t&&r()};const l=d=>{d.key==="Escape"&&(r(),document.removeEventListener("keydown",l))};document.addEventListener("keydown",l),a.focus()}function we(){const n=document.getElementById("repositoriesGrid");if(!n)return;n.querySelectorAll(".repository-card").forEach(t=>{const o=t.getAttribute("data-repo-url");P.some(a=>a.url===o)?t.classList.add("selected"):t.classList.remove("selected")})}function $t(){if(P.length!==2){p("Please select exactly 2 repositories","error");return}const[n,e]=P;confirm(`Import as Multi-Repository?

Frontend: ${n.name}
Backend: ${e.name}

Click OK to import these repositories as a multi-repository project.`)&&Ve(n.url,e.url,`${n.name}-${e.name}`)}async function Ve(n,e,t){const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o){p("Please login first","error");return}try{p("Importing multi-repositories...","info");const s=await fetch("/api/import-split",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${o}`},body:new URLSearchParams({frontend_url:n,backend_url:e,app_name:t})}),a=await s.json();if(s.ok){p("Multi-repository imported successfully! Navigate to Projects to see it.","success"),P=[];const r=document.getElementById("page-projects");r&&r.style.display!=="none"&&H(),document.getElementById("usernameSearch").value.trim()&&Re()}else s.status===423?p(a.detail||"Your virtual machine is being created. Please wait a few moments and try again.","warning"):p(a.detail||"Failed to import multi-repository","error")}catch(s){console.error("Error importing multi-repositories:",s),p("Failed to import multi-repository: "+s.message,"error")}}function Pt(n){document.getElementById("git-url").value=n,T.navigate("/deploy"),p("Repository selected","success")}async function Dt(n,e){const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t){p("Please login first","error");return}try{p("Importing repository...","info");const o=await fetch("/api/import",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${t}`},body:new URLSearchParams({git_url:n,app_name:e||n.split("/").pop()||"Untitled Project"})}),s=await o.json();if(o.ok){p("Repository imported successfully! Navigate to Projects to see it.","success");const a=document.getElementById("page-projects");a&&a.style.display!=="none"&&H()}else o.status===423?p(s.detail||"Your virtual machine is being created. Please wait a few moments and try again.","warning"):p(s.detail||"Failed to import repository","error")}catch(o){console.error("Error importing repository:",o),p("Failed to import repository: "+o.message,"error")}}function Nt(){document.getElementById("repositoriesGrid").innerHTML=`
    <div class="empty-state">
      <p>Search for a GitHub username to see their repositories</p>
            </div>
        `}function p(n,e="info"){const t=document.getElementById("toast");t.textContent=n,t.className=`toast show ${e}`,setTimeout(()=>{t.classList.remove("show")},3e3)}let ee={},Ee=[];async function Ce(){try{const n=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!n){const t=document.getElementById("envVarsList");t&&(t.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `),fe();return}if(!i||!i.id){const t=document.getElementById("envVarsList");t&&(t.innerHTML=`
          <div class="empty-state">
            <p>Please select a project from the Projects page to manage environment variables</p>
          </div>
        `),fe();return}const e=await fetch(`/api/env-vars?project_id=${i.id}`,{headers:{Authorization:`Bearer ${n}`}});if(e.ok){const t=await e.json();ee=t.variables||{},Ee=t.vars_list||[],Tt()}else if(e.status===401){localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),ue();const t=document.getElementById("envVarsList");t&&(t.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `)}else console.error("Failed to load environment variables")}catch(n){console.error("Error loading environment variables:",n)}fe()}function fe(){const n=document.getElementById("importEnvBtn"),e=document.getElementById("addEnvVarBtn"),t=document.getElementById("importEnvCard"),o=document.getElementById("cancelImportBtn"),s=document.getElementById("importEnvForm"),a=document.getElementById("envDropZone"),r=document.getElementById("envFileInput"),l=document.getElementById("envDropZoneBrowse"),d=document.getElementById("envDropZoneFileName");if(n&&(n.onclick=()=>{t.style.display=t.style.display==="none"?"block":"none"}),o&&(o.onclick=()=>{t.style.display="none",r&&(r.value=""),d&&(d.textContent="",d.style.display="none")}),e&&(e.onclick=()=>{At()}),r&&(r.onchange=c=>{var u;const m=(u=c.target.files)==null?void 0:u[0];d&&(m?(d.textContent=m.name,d.style.display="block"):(d.textContent="",d.style.display="none"))}),a&&r&&!a.dataset.bound){a.dataset.bound="true";const c=m=>{m.preventDefault(),m.stopPropagation()};["dragenter","dragover"].forEach(m=>{a.addEventListener(m,u=>{c(u),a.classList.add("is-dragover")})}),["dragleave","dragend"].forEach(m=>{a.addEventListener(m,u=>{c(u),a.classList.remove("is-dragover")})}),a.addEventListener("dragover",m=>{c(m),m.dataTransfer&&(m.dataTransfer.dropEffect="copy"),a.classList.add("is-dragover")}),a.addEventListener("drop",async m=>{var v;c(m),a.classList.remove("is-dragover");const u=(v=m.dataTransfer)==null?void 0:v.files;if(!u||!u.length)return;const[y]=u;if(d&&(d.textContent=y.name,d.style.display="block"),r)try{const g=new DataTransfer;g.items.add(y),r.files=g.files}catch(g){console.warn("Unable to sync dropped file with input element:",g)}try{await Te(y)}catch(g){console.error("Error importing dropped .env file:",g)}}),a.addEventListener("click",()=>{r.click()}),l&&l.addEventListener("click",m=>{m.preventDefault(),r.click()})}s&&(s.onsubmit=async c=>{var u;c.preventDefault();const m=(u=r==null?void 0:r.files)==null?void 0:u[0];m&&await Te(m)})}async function Te(n){try{if(!n){p("No file detected for import","error");return}p(`Importing ${n.name||".env"}...`,"info");const t=(await n.text()).split(`
`),o={};t.forEach(a=>{if(a=a.trim(),a&&!a.startsWith("#")&&a.includes("=")){const[r,...l]=a.split("="),d=l.join("=").trim().replace(/^["']|["']$/g,"");r.trim()&&(o[r.trim()]=d)}}),ee={...ee,...o},await _e(),document.getElementById("importEnvCard").style.display="none",document.getElementById("envFileInput").value="";const s=document.getElementById("envDropZoneFileName");s&&(s.textContent="",s.style.display="none"),p("Environment variables imported successfully!","success")}catch(e){console.error("Error importing .env file:",e),p("Failed to import .env file","error")}}function Tt(){const n=document.getElementById("envVarsList");if(n){if(Ee.length===0){n.innerHTML=`
      <div class="empty-state">
        <p>No environment variables configured</p>
        <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.5rem;">
          Click "Add Variable" to create one, or import from a .env file
        </p>
            </div>
        `;return}n.innerHTML=`
    <table class="env-vars-table">
      <thead>
        <tr>
          <th class="name-col">Name</th>
          <th class="updated-col">Last updated</th>
          <th class="actions-col"></th>
        </tr>
      </thead>
      <tbody>
        ${Ee.map((e,t)=>{const o=e.updated_at?new Date(e.updated_at).toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kathmandu"}):"Never updated",s=e.project_id?'<span style="font-size: 0.75rem; background: var(--primary); color: white; padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Project</span>':'<span style="font-size: 0.75rem; background: var(--bg-tertiary); color: var(--text-secondary); padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Global</span>';return`
            <tr>
              <td class="name-col">
                <span class="lock-icon">🔒</span>
                <span class="var-name">${I(e.key)}</span>
                ${s}
              </td>
              <td class="updated-col">
                <span class="updated-time">${o}</span>
              </td>
              <td class="actions-col">
                <button class="icon-btn edit-btn" onclick="editEnvVarModal('${I(e.key)}')" title="Edit">
                  ✏️
                </button>
                <button class="icon-btn delete-btn" onclick="deleteEnvVar('${I(e.key)}')" title="Delete">
                  🗑️
                </button>
              </td>
            </tr>
          `}).join("")}
      </tbody>
    </table>
  `}}function At(){xe()}function xe(n=null,e=""){const t=document.getElementById("envVarModal"),o=document.getElementById("modalVarKey"),s=document.getElementById("modalVarValue"),a=document.getElementById("modalTitle");n?(a.textContent="Update environment variable",o.value=n,o.readOnly=!0,s.value=e):(a.textContent="Add environment variable",o.value="",o.readOnly=!1,s.value=""),t.style.display="flex"}function He(){const n=document.getElementById("envVarModal");n.style.display="none"}async function Ut(){const n=document.getElementById("modalVarKey"),e=document.getElementById("modalVarValue"),t=n.value.trim(),o=e.value.trim();if(!t){p("Variable name is required","error");return}ee[t]=o,await _e(),He()}function Oe(n){const e=ee[n]||"";xe(n,e)}async function Mt(n){Oe(n)}async function Ft(n){confirm(`Are you sure you want to delete ${n}?`)&&(delete ee[n],await _e(),p("Environment variable deleted","success"))}function Rt(n){const t=document.querySelectorAll(".env-var-row")[n];if(!t)return;const o=t.querySelector(".env-var-value input");o.type==="password"?o.type="text":o.type="password"}async function _e(){try{const n=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!i||!i.id){p("No project selected","error");return}(await fetch("/api/env-vars",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${n}`},body:JSON.stringify({variables:ee,project_id:i.id})})).ok?(await Ce(),p("Environment variables saved successfully","success")):(console.error("Failed to save environment variables"),p("Failed to save environment variables","error"))}catch(n){console.error("Error saving environment variables:",n),p("Error saving environment variables","error")}}function Vt(){const n=document.getElementById("modalVarValue"),e=document.querySelector('#envVarModal button[onclick*="toggleModalValueVisibility"]');n&&e&&(n.type==="password"?(n.type="text",e.textContent="🙈 Hide"):(n.type="password",e.textContent="👁️ Show"))}function I(n){const e=document.createElement("div");return e.textContent=n,e.innerHTML}async function qe(){try{const n=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!n)return;const e=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${n}`}});if(e.ok){const t=await e.json(),o=document.getElementById("userName"),s=document.getElementById("userEmail"),a=document.getElementById("userAvatar");localStorage.setItem("displayName",t.display_name||""),localStorage.setItem("userEmail",t.email||""),o&&(o.textContent=t.display_name||t.username||"User"),Kt(t.display_name||t.username||"User");const r=document.getElementById("sidebarSearch");if(r){const l=r.value.trim();(l===(t.username||"")||l===(t.display_name||""))&&(r.value="")}s&&(s.textContent=t.email||"Logged in"),a&&(t.avatar_url?(a.style.backgroundImage=`url(${t.avatar_url})`,a.style.backgroundSize="cover",a.style.backgroundPosition="center",a.textContent=""):(a.style.backgroundImage="",a.textContent=(t.display_name||t.username||"U").charAt(0).toUpperCase()))}else e.status===401&&(localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),ue())}catch(n){console.error("Error loading user profile:",n)}}async function ze(){try{const n=localStorage.getItem("access_token")||localStorage.getItem("authToken"),e=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${n}`}});if(e.ok){const t=await e.json(),o=document.getElementById("username"),s=document.getElementById("email"),a=document.getElementById("displayName");o&&(o.value=t.username||""),s&&(s.value=t.email||""),a&&(a.value=t.display_name||"");const r=document.getElementById("avatarPreview"),l=document.getElementById("avatarInitial"),d=document.getElementById("removeAvatarBtn");if(t.avatar_url&&r)r.src=t.avatar_url,r.style.display="block",l&&(l.style.display="none"),d&&(d.style.display="block");else if(l){const c=t.display_name&&t.display_name.charAt(0).toUpperCase()||t.username&&t.username.charAt(0).toUpperCase()||"S";l.textContent=c,l.style.display="block"}}}catch(n){console.error("Error loading profile:",n)}Ht()}function Ht(){const n=document.getElementById("profileForm"),e=document.getElementById("avatarFile"),t=document.getElementById("removeAvatarBtn");n&&n.addEventListener("submit",Yt),e&&e.addEventListener("change",Gt),t&&t.addEventListener("click",Wt);const o=document.getElementById("changePasswordBtn"),s=document.getElementById("closePasswordModal"),a=document.getElementById("cancelPasswordBtn"),r=document.getElementById("updatePasswordBtn"),l=document.getElementById("passwordModal"),d=document.getElementById("modalNewPassword"),c=document.getElementById("strengthFill");o&&o.addEventListener("click",()=>{l&&(l.style.display="flex")}),s&&s.addEventListener("click",()=>{l&&(l.style.display="none")}),a&&a.addEventListener("click",()=>{l&&(l.style.display="none")}),l&&l.addEventListener("click",y=>{y.target===l&&(l.style.display="none")}),d&&d.addEventListener("input",y=>{const v=y.target.value;let g=0;v.length>=8&&(g+=25),/[a-z]/.test(v)&&/[A-Z]/.test(v)&&(g+=25),/\d/.test(v)&&(g+=25),/[!@#$%^&*(),.?":{}|<>]/.test(v)&&(g+=25),c&&(c.style.width=`${g}%`,g<50?c.style.background="#ef4444":g<75?c.style.background="#f59e0b":c.style.background="#10b981")}),r&&r.addEventListener("click",zt);const m=document.getElementById("cancelProfileBtn");m&&m.addEventListener("click",async()=>{await ze()});const u=document.getElementById("deleteAccountBtn");u&&u.addEventListener("click",async()=>{await Ot()})}async function Ot(){if(await qt())try{const e=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!e){p("You must be logged in to delete your account","error");return}const t=document.getElementById("deleteAccountBtn");t&&(t.disabled=!0,t.textContent="Deleting Account...");const o=await fetch("/api/user/account",{method:"DELETE",headers:{Authorization:`Bearer ${e}`}}),s=await o.json();o.ok?(p("Account deleted successfully","success"),localStorage.clear(),setTimeout(()=>{window.location.href="/login"},2e3)):(p(s.detail||s.message||"Failed to delete account","error"),t&&(t.disabled=!1,t.textContent="Delete Account"))}catch(e){console.error("Error deleting account:",e),p("Network error. Please try again.","error");const t=document.getElementById("deleteAccountBtn");t&&(t.disabled=!1,t.textContent="Delete Account")}}function qt(){return new Promise(n=>{const e=document.createElement("div");e.style.cssText=`
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;const t=document.createElement("div");t.style.cssText=`
      background: white;
      border-radius: 12px;
      padding: 2rem;
      max-width: 480px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `,t.innerHTML=`
      <h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem; color: var(--text-primary);">
        Delete Account
      </h2>
      <p style="font-size: 0.9375rem; color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.6;">
        Are you sure you want to delete your account? This action cannot be undone.
      </p>
      <div style="background: var(--color-error-bg); border: 1px solid var(--color-error); border-radius: 6px; padding: 1rem; margin-bottom: 1.5rem;">
        <p style="font-size: 0.875rem; color: var(--color-error); margin: 0; line-height: 1.6;">
          <strong>Warning:</strong> This will permanently delete:
        </p>
        <ul style="font-size: 0.875rem; color: var(--color-error); margin: 0.5rem 0 0 1.5rem; padding: 0;">
          <li>All your projects and deployments</li>
          <li>All environment variables</li>
          <li>Your virtual machine</li>
          <li>All account data</li>
        </ul>
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
        <button id="cancelDeleteBtn" class="btn-secondary" style="cursor: pointer;">
          Cancel
        </button>
        <button id="confirmDeleteBtn" class="btn-danger" style="cursor: pointer;">
          Delete Account
        </button>
      </div>
    `,e.appendChild(t),document.body.appendChild(e),t.querySelector("#cancelDeleteBtn").addEventListener("click",()=>{document.body.removeChild(e),n(!1)}),t.querySelector("#confirmDeleteBtn").addEventListener("click",()=>{document.body.removeChild(e),n(!0)}),e.addEventListener("click",r=>{r.target===e&&(document.body.removeChild(e),n(!1))});const a=r=>{r.key==="Escape"&&(document.body.removeChild(e),document.removeEventListener("keydown",a),n(!1))};document.addEventListener("keydown",a)})}async function zt(){const n=document.getElementById("modalCurrentPassword"),e=document.getElementById("modalNewPassword"),t=document.getElementById("modalConfirmPassword"),o=document.getElementById("passwordModal");if(!n||!e||!t)return;const s=n.value,a=e.value,r=t.value;if(!s||!a||!r){p("Please fill in all password fields","error");return}if(a!==r){p("New passwords do not match","error");return}if(a.length<8){p("Password must be at least 8 characters","error");return}try{const l=localStorage.getItem("access_token")||localStorage.getItem("authToken"),d=new FormData;d.append("current_password",s),d.append("new_password",a);const c=await fetch("/api/user/profile",{method:"PUT",headers:{Authorization:`Bearer ${l}`},body:d}),m=await c.json();if(c.ok){p("Password updated successfully!","success"),o&&(o.style.display="none"),n.value="",e.value="",t.value="";const u=document.getElementById("strengthFill");u&&(u.style.width="0%")}else p(m.detail||m.message||"Failed to update password","error")}catch(l){console.error("Error updating password:",l),p("Network error. Please try again.","error")}}function Gt(n){const e=n.target.files[0];if(e){const t=new FileReader;t.onload=o=>{const s=document.getElementById("avatarPreview"),a=document.getElementById("avatarInitial");s&&(s.src=o.target.result,s.style.display="block"),a&&(a.style.display="none");const r=document.getElementById("removeAvatarBtn");r&&(r.style.display="block")},t.readAsDataURL(e)}}function Wt(){const n=document.getElementById("avatarPreview"),e=document.getElementById("avatarInitial");n&&(n.src="",n.style.display="none"),e&&(e.style.display="block");const t=document.getElementById("removeAvatarBtn");t&&(t.style.display="none");const o=document.getElementById("avatarFile");o&&(o.value="")}async function Yt(n){n.preventDefault();const e=document.getElementById("profileMessage");e&&(e.style.display="none");const t=new FormData,o=document.getElementById("email"),s=document.getElementById("displayName");o&&t.append("email",o.value),s&&t.append("display_name",s.value);const a=document.getElementById("avatarFile");a&&a.files[0]&&t.append("avatar",a.files[0]);const r=document.getElementById("avatarPreview");r&&r.style.display==="none"&&t.append("remove_avatar","true");try{const l=localStorage.getItem("access_token")||localStorage.getItem("authToken"),d=await fetch("/api/user/profile",{method:"PUT",headers:{Authorization:`Bearer ${l}`},body:t}),c=await d.json();if(d.ok)e&&(e.textContent="Profile updated successfully!",e.className="profile-message success",e.style.display="block"),c.username&&localStorage.setItem("username",c.username),await qe(),p("Profile updated successfully!","success");else{const m=c.detail||c.message||"Failed to update profile";e&&(e.textContent=m,e.className="profile-message error",e.style.display="block"),p(m,"error"),console.error("Profile update failed:",c)}}catch(l){console.error("Error updating profile:",l),e&&(e.textContent="Network error. Please try again.",e.className="profile-message error",e.style.display="block"),p("Network error. Please try again.","error")}}window.destroyDeployment=xt;window.selectRepository=Pt;window.importRepository=Dt;window.editEnvVar=Mt;window.deleteEnvVar=Ft;window.toggleEnvVarVisibility=Rt;window.saveEnvVarFromModal=Ut;window.closeEnvVarModal=He;window.toggleModalValueVisibility=Vt;window.editEnvVarModal=Oe;window.showEnvVarModal=xe;window.selectProject=ke;window.showProjectSidebar=be;window.hideProjectSidebar=mt;window.openProject=Bt;window.loadUserProfileIntoProjectSidebar=Fe;window.openProjectSite=lt;window.deleteProject=Ye;window.toggleRepositorySelection=_t;window.confirmSplitImport=$t;window.openProjectNameModal=Ue;window.openSite=yt;function Kt(n){const e=document.getElementById("teamName");e&&(e.textContent=`${n}'s team`),document.querySelectorAll(".project-owner").forEach(o=>{o.textContent=`${n}'s team`})}let R=null,se=!1,Y=[];function Zt(n){if(n==null)return null;if(typeof n!="string")return n;const e=n.trim();if(!e)return null;const t=e.indexOf("{");if(t===-1)return{message:e};const o=e.slice(t);try{return JSON.parse(o)}catch{return{message:e}}}function Jt(){const n=document.getElementById("logsContent");n&&(n.innerHTML='<p class="logs-connecting">Connecting to WebSocket...</p>',Ge(),Qt())}function Ge(){R&&R.close();const e=`${window.location.protocol==="https:"?"wss:":"ws:"}//${window.location.host}/ws/logs`;R=new WebSocket(e),R.onopen=()=>{console.log("Logs WebSocket connected"),W("Connected to logs stream","success"),Y.length>0&&(Y.forEach(t=>W(t.message,t.type)),Y=[])},R.onmessage=t=>{const o=Zt(t.data);!o||!o.message||(se?Y.push({message:o.message,type:o.type||"info"}):W(o.message,o.type||"info"))},R.onerror=t=>{console.error("Logs WebSocket error:",t),W("WebSocket connection error","error")},R.onclose=()=>{console.log("Logs WebSocket disconnected"),W("Disconnected from logs stream","warning"),setTimeout(()=>{var t;((t=document.getElementById("page-logs"))==null?void 0:t.style.display)!=="none"&&Ge()},3e3)}}function W(n,e="info"){const t=document.getElementById("logsContent");if(!t)return;const o=new Date().toLocaleString("en-US",{timeZone:"Asia/Kathmandu",timeStyle:"medium",dateStyle:"short"}),s=document.createElement("div");s.className=`log-entry ${e}`,s.innerHTML=`
    <span class="log-timestamp">[${o}]</span>
    <span class="log-message">${I(n)}</span>
  `,t.appendChild(s),t.scrollTop=t.scrollHeight;const a=1e3,r=t.querySelectorAll(".log-entry");r.length>a&&r[0].remove()}function Qt(){const n=document.getElementById("clearLogsBtn"),e=document.getElementById("toggleLogsBtn");n&&n.addEventListener("click",()=>{const t=document.getElementById("logsContent");t&&(t.innerHTML="",Y=[],W("Logs cleared","info"))}),e&&e.addEventListener("click",()=>{se=!se,e.textContent=se?"Resume":"Pause",!se&&Y.length>0&&(Y.forEach(t=>W(t.message,t.type)),Y=[]),W(se?"Logs paused":"Logs resumed","info")})}window.addEventListener("beforeunload",()=>{R&&R.close()});function Xt(){const n=document.getElementById("sidebarSearch"),e=document.getElementById("commandPalette"),t=document.getElementById("commandSearchInput"),o=document.querySelectorAll(".command-item");let s=-1;function a(){e&&(e.style.display="flex",t&&(t.focus(),t.value=""),s=-1,l())}function r(){e&&(e.style.display="none",s=-1)}function l(){const c=Array.from(o).filter(m=>m.style.display!=="none");o.forEach((m,u)=>{c.indexOf(m)===s?(m.classList.add("selected"),m.scrollIntoView({block:"nearest",behavior:"smooth"})):m.classList.remove("selected")})}function d(c){switch(r(),c){case"deploy":case"nav-deploy":window.router&&window.router.navigate("/deploy");break;case"add-env-var":window.showEnvVarModal&&window.showEnvVarModal();break;case"search-repos":case"nav-repositories":window.router&&window.router.navigate("/repositories");break;case"nav-projects":window.router&&window.router.navigate("/");break;case"nav-applications":window.router&&window.router.navigate("/applications");break;case"nav-history":window.router&&window.router.navigate("/history");break;case"nav-env-vars":window.router&&window.router.navigate("/env-vars");break;case"nav-settings":window.router&&window.router.navigate("/settings");break}}document.addEventListener("keydown",c=>{var m;if((c.metaKey||c.ctrlKey)&&c.key==="k"&&(c.preventDefault(),e&&e.style.display==="none"?a():r()),c.key==="Escape"&&e&&e.style.display!=="none"&&r(),e&&e.style.display!=="none"){const u=Array.from(o).filter(y=>y.style.display!=="none");if(c.key==="ArrowDown")c.preventDefault(),s=Math.min(s+1,u.length-1),l();else if(c.key==="ArrowUp")c.preventDefault(),s=Math.max(s-1,-1),l();else if(c.key==="Enter"&&s>=0){c.preventDefault();const v=(m=Array.from(o).filter(g=>g.style.display!=="none")[s])==null?void 0:m.getAttribute("data-action");v&&d(v)}}}),n&&n.addEventListener("click",a),e&&e.addEventListener("click",c=>{c.target===e&&r()}),o.forEach(c=>{c.addEventListener("click",()=>{const m=c.getAttribute("data-action");m&&d(m)})}),t&&t.addEventListener("input",c=>{const m=c.target.value.toLowerCase();o.forEach(u=>{u.querySelector(".command-text").textContent.toLowerCase().includes(m)?u.style.display="flex":u.style.display="none"}),s=-1,l()})}
