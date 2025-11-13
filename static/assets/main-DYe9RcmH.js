import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */class Qe{constructor(){this.routes={"/":"projects","/deploy":"deploy","/history":"history","/repositories":"repositories","/domain":"domain","/env-vars":"env-vars","/settings":"settings","/logs":"logs"},this.currentPage=null,this.init()}init(){document.querySelectorAll(".nav-item").forEach(t=>{t.addEventListener("click",e=>{e.preventDefault();const o=t.getAttribute("href");this.navigate(o)})}),window.addEventListener("popstate",()=>{this.loadPage(window.location.pathname)}),this.loadPage(window.location.pathname)}navigate(t){window.history.pushState({},"",t),this.loadPage(t)}loadPage(t){const e=this.routes[t]||"dashboard";if(e==="deploy"){i=null;const o=document.getElementById("projectSidebar");o&&(o.style.display="none");const s=document.getElementById("sidebar");s&&(s.style.display="block")}this.showPage(e),this.updateActiveNav(t),this.updatePageTitle(e),window.scrollTo({top:0,behavior:"smooth"})}showPage(t){document.querySelectorAll(".page").forEach(o=>{o.style.display="none"});const e=document.getElementById(`page-${t}`);if(e){if(e.style.display="block",t==="deploy"){const o=document.getElementById("deploy-status"),s=document.getElementById("deploy-success");o&&(o.textContent="",o.style.color=""),s&&(s.style.display="none")}}else{const o=document.getElementById("page-dashboard");o&&(o.style.display="block")}this.currentPage=t,this.loadPageData(t)}updateActiveNav(t){document.querySelectorAll(".nav-item").forEach(e=>{e.classList.remove("active"),e.getAttribute("href")===t&&e.classList.add("active")})}updatePageTitle(t){const e={projects:"Projects",deploy:"Deploy",history:"History",repositories:"Repositories",domain:"Domain","env-vars":"Environmental Variables",settings:"Settings",logs:"Logs"};document.getElementById("pageTitle").textContent=e[t]||"Dashboard"}loadPageData(t){switch(t){case"dashboard":Be();break;case"projects":V(),Be();break;case"history":$e();break;case"repositories":Ft();break;case"domain":mt();break;case"env-vars":Pe();break;case"settings":Ze();break;case"logs":nn();break}}}const U=new Qe;window.router=U;async function Xe(n){const t=await nt();if(!t)return;const e=$.find(a=>a.id==n),o=e?e.name:"this project";if(await et(o))try{console.log("Deleting project with token:",t.substring(0,20)+"...");const a=await fetch(`/projects/${n}`,{method:"DELETE",headers:{Authorization:`Bearer ${t}`}});if(console.log("Delete response status:",a.status),!a.ok){const r=await a.json().catch(()=>({}));if(console.error("Delete error response:",r),a.status===401){p("Session expired. Please login again.","error"),localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),setTimeout(()=>{window.location.href="/login"},2e3);return}throw new Error(r.detail||"Failed to delete project")}$=$.filter(r=>r.id!=n),q=q.filter(r=>r.id!=n),X(q),p("Project deleted","success")}catch(a){console.error("Delete project error:",a),p(`Delete failed: ${a.message}`,"error")}}function et(n){return new Promise(t=>{const e=document.createElement("div");e.className="modal-overlay";const o=document.createElement("div");o.className="delete-confirmation-modal",o.innerHTML=`
      <h3>Delete Project</h3>
      <p>
        Are you sure you want to delete <strong>${B(n)}</strong>?<br>
        This will stop the process and remove the project.
      </p>
      <div class="delete-confirmation-actions">
        <button class="cancel-btn">Cancel</button>
        <button class="delete-btn">Delete</button>
      </div>
    `,e.appendChild(o),document.body.appendChild(e);const s=o.querySelector(".cancel-btn"),a=o.querySelector(".delete-btn"),r=()=>{document.body.removeChild(e)};s.onclick=()=>{r(),t(!1)},a.onclick=()=>{r(),t(!0)},e.onclick=l=>{l.target===e&&(r(),t(!1))},a.focus()})}function tt(n){try{const e=JSON.parse(atob(n.split(".")[1])).exp*1e3,o=Date.now();return e<o+5*60*1e3}catch{return!0}}async function nt(){const n=localStorage.getItem("access_token")||localStorage.getItem("authToken");return!n||tt(n)?(p("Session expired. Please login again.","error"),localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),setTimeout(()=>{window.location.href="/login"},2e3),null):n}let ne=localStorage.getItem("access_token")||localStorage.getItem("authToken"),ge=localStorage.getItem("username");document.addEventListener("DOMContentLoaded",()=>{const n=document.getElementById("sidebarSearch");n&&(n.value="",n.setAttribute("autocomplete","off")),ve(),window.location.pathname==="/login"||window.location.pathname.includes("login.html")||setTimeout(()=>{if(ne&&ge){ot(),ln();const e=document.getElementById("sidebarSearch");e&&e.value===ge&&(e.value="");const o=document.getElementById("page-projects");o&&window.location.pathname==="/"&&(o.style.display="block")}},100)});function ve(){const n=document.getElementById("userSection"),t=document.getElementById("authButtons"),e=document.getElementById("logoutBtn"),o=document.getElementById("newDeployBtn");document.getElementById("userName"),document.getElementById("userEmail"),document.getElementById("userAvatar");const s=window.location.pathname==="/login"||window.location.pathname.includes("login.html");ne&&ge?(n.style.display="flex",t.style.display="none",e.style.display="block",o.style.display="block",Ke(),V(),s&&(window.location.href="/")):(n.style.display="none",t.style.display="block",e.style.display="none",o.style.display="none",s||(window.location.href="/login"))}function ot(){var a,r;document.getElementById("logoutBtn").addEventListener("click",()=>{localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),ne=null,ge=null,ve(),p("Logged out successfully","success"),U.navigate("/")});const n=document.getElementById("projectsSearch");n&&n.addEventListener("input",l=>{const d=l.target.value.toLowerCase();q=$.filter(c=>c.name.toLowerCase().includes(d)||c.repository&&c.repository.toLowerCase().includes(d)),X(q)});const t=document.getElementById("addProjectBtn");t&&t.addEventListener("click",()=>{window.router&&window.router.navigate("/deploy")});const e=document.getElementById("browseUploadLink");e&&e.addEventListener("click",l=>{l.preventDefault(),window.router&&window.router.navigate("/deploy")}),document.getElementById("newDeployBtn").addEventListener("click",()=>{i=null;const l=document.getElementById("projectSidebar");l&&(l.style.display="none");const d=document.getElementById("sidebar");d&&(d.style.display="block"),U.navigate("/deploy")});const o=document.getElementById("deployForm");o&&o.addEventListener("submit",_t),Bt();const s=document.getElementById("deploy-type");s&&s.addEventListener("change",l=>{const d=document.getElementById("single-repo-group"),c=document.getElementById("git-url-section"),m=document.getElementById("split-deploy-layout"),u=document.getElementById("git-url");l.target.value==="split"?(d&&(d.style.display="none"),c&&(c.style.display="none"),m&&(m.style.display="block"),u&&u.removeAttribute("required")):(d&&(d.style.display="block"),c&&(c.style.display="block"),m&&(m.style.display="none"),u&&u.setAttribute("required","required"))}),(a=document.getElementById("clearHistoryBtn"))==null||a.addEventListener("click",Pt),(r=document.getElementById("searchReposBtn"))==null||r.addEventListener("click",ze),st(),it()}function st(){const n=document.querySelector(".search-input"),t=document.getElementById("spotlightModal"),e=document.getElementById("spotlightSearch"),o=document.getElementById("spotlightResults");!n||!t||!e||!o||(n.addEventListener("click",at),t.addEventListener("click",s=>{s.target===t&&ke()}),e.addEventListener("input",rt),o.addEventListener("click",dt),document.addEventListener("keydown",s=>{s.key==="Escape"&&t.style.display!=="none"&&ke()}))}function at(){const n=document.getElementById("spotlightModal"),t=document.getElementById("spotlightSearch");n.style.display="flex",setTimeout(()=>{t.focus()},100)}function ke(){const n=document.getElementById("spotlightModal"),t=document.getElementById("spotlightSearch"),e=document.getElementById("spotlightResults");n.style.display="none",t.value="",e.innerHTML=`
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
  `}function it(){const n=document.getElementById("domainWarningModal");if(!n||n.dataset.bound==="true")return;n.dataset.bound="true";const t=document.getElementById("domainModalCancelBtn"),e=document.getElementById("domainModalOpenConfigBtn"),o=()=>{n.style.display="none"};t&&t.addEventListener("click",o),e&&e.addEventListener("click",()=>{o(),xe("domain-config"),Oe()}),n.addEventListener("click",s=>{s.target===n&&o()})}function rt(n){const t=n.target.value.toLowerCase().trim(),e=document.getElementById("spotlightResults");if(!t){e.innerHTML=`
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
    `;return}const o=lt(t);ct(o)}function lt(n){const t={projects:[],actions:[],navigation:[]};$&&$.length>0&&(t.projects=$.filter(s=>s.name.toLowerCase().includes(n)||s.repository&&s.repository.toLowerCase().includes(n)));const e=[{name:"New Deploy",action:"new-deploy",icon:"🚀"},{name:"Repositories",action:"repositories",icon:"📁"},{name:"History",action:"history",icon:"📜"},{name:"Settings",action:"settings",icon:"⚙️"},{name:"Domain",action:"domain",icon:"🌐"}];t.actions=e.filter(s=>s.name.toLowerCase().includes(n));const o=[{name:"Projects",action:"projects",icon:"📊"},{name:"Repositories",action:"repositories",icon:"📁"},{name:"History",action:"history",icon:"📜"},{name:"Domain",action:"domain",icon:"🌐"},{name:"Settings",action:"settings",icon:"⚙️"}];return t.navigation=o.filter(s=>s.name.toLowerCase().includes(n)),t}function ct(n){const t=document.getElementById("spotlightResults");let e='<div class="search-results">';n.projects.length>0&&(e+='<div class="search-category">',e+='<div class="search-category-title">Projects</div>',n.projects.forEach(o=>{const s=o.status==="running"?"🚀":"📦",a=o.status==="running"?"RUNNING":o.status==="failed"?"FAILED":"IMPORTED";e+=`
        <div class="search-result-item" data-type="project" data-id="${o.id}">
          <span class="search-result-icon">${s}</span>
          <div class="search-result-content">
            <div class="search-result-title">${B(o.name)}</div>
            <div class="search-result-subtitle">${o.repository||"No repository"}</div>
          </div>
          <span class="search-result-badge">${a}</span>
        </div>
      `}),e+="</div>"),n.actions.length>0&&(e+='<div class="search-category">',e+='<div class="search-category-title">Actions</div>',n.actions.forEach(o=>{e+=`
        <div class="search-result-item" data-type="action" data-action="${o.action}">
          <span class="search-result-icon">${o.icon}</span>
          <div class="search-result-content">
            <div class="search-result-title">${o.name}</div>
          </div>
        </div>
      `}),e+="</div>"),n.navigation.length>0&&(e+='<div class="search-category">',e+='<div class="search-category-title">Navigation</div>',n.navigation.forEach(o=>{e+=`
        <div class="search-result-item" data-type="navigation" data-action="${o.action}">
          <span class="search-result-icon">${o.icon}</span>
          <div class="search-result-content">
            <div class="search-result-title">${o.name}</div>
          </div>
        </div>
      `}),e+="</div>"),n.projects.length===0&&n.actions.length===0&&n.navigation.length===0&&(e=`
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <p>No results found for "${B(document.getElementById("spotlightSearch").value)}"</p>
      </div>
    `),e+="</div>",t.innerHTML=e}function dt(n){const t=n.target.closest(".suggestion-item, .search-result-item");if(!t)return;const e=t.dataset.action,o=t.dataset.type,s=t.dataset.id;if(ke(),o==="project"&&s)je(parseInt(s));else if(e)switch(e){case"new-deploy":window.router&&window.router.navigate("/deploy");break;case"repositories":window.router&&window.router.navigate("/repositories");break;case"history":window.router&&window.router.navigate("/history");break;case"domain":window.router&&window.router.navigate("/domain");break;case"settings":window.router&&window.router.navigate("/settings");break;case"projects":window.router&&window.router.navigate("/projects");break}}function mt(){document.getElementById("page-domain")}let ce=null;async function Be(){if(!(localStorage.getItem("access_token")||localStorage.getItem("authToken"))){const t=document.getElementById("vmStatusCard");t&&(t.style.display="none");return}try{const t=await fetch("/api/vm-status",{headers:T()});if(!t.ok){if(t.status===401){const o=document.getElementById("vmStatusCard");o&&(o.style.display="none");return}throw new Error("Failed to fetch VM status")}const e=await t.json();pt(e.vm_status,e.message),e.vm_status==="creating"?ce||(ce=setInterval(()=>{Be()},5e3)):ce&&(clearInterval(ce),ce=null)}catch(t){console.error("Error loading VM status:",t);const e=document.getElementById("vmStatusCard");e&&(e.style.display="none")}}function pt(n,t){Ue("vmStatusCard","vmStatusBadge","vmStatusDot","vmStatusText","vmStatusMessage","vmStatusDetails","dashboardActions",n,t),Ue("vmStatusCardProjects","vmStatusBadgeProjects","vmStatusDotProjects","vmStatusTextProjects","vmStatusMessageProjects","vmStatusDetailsProjects",null,n,t)}function Ue(n,t,e,o,s,a,r,l,d){const c=document.getElementById(n),m=document.getElementById(t),u=document.getElementById(e),y=document.getElementById(o),v=document.getElementById(s),g=document.getElementById(a),h=r?document.getElementById(r):null;c&&(c.style.display="block",v&&(v.textContent=d),l==="creating"?(m&&(m.className="status-badge creating"),u&&(u.className="status-dot creating"),y&&(y.textContent="Creating"),g&&(g.style.display="block",g.textContent="Estimated time remaining: 2-5 minutes"),h&&(h.style.display="none")):l==="ready"?(m&&(m.className="status-badge running"),u&&(u.className="status-dot running"),y&&(y.textContent="Running"),g&&(g.style.display="none"),h&&(h.style.display="grid")):l==="failed"?(m&&(m.className="status-badge failed"),u&&(u.className="status-dot failed"),y&&(y.textContent="Failed"),g&&(g.style.display="block",g.textContent="Please check that OrbStack is installed and running, then try again."),h&&(h.style.display="grid")):(m&&(m.className="status-badge creating"),u&&(u.className="status-dot creating"),y&&(y.textContent="Checking"),g&&(g.style.display="none"),h&&(h.style.display="none")))}function T(){const n={},t=localStorage.getItem("access_token")||localStorage.getItem("authToken");return t&&(n.Authorization=`Bearer ${t}`),n}let $=[],q=[];async function V(){const n=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!n){X([]);return}yt();try{const t=await fetch("/deployments",{headers:{Authorization:`Bearer ${n}`}});t.ok?($=(await t.json()).map(o=>{var W;const s=o.git_url||"",a=s,r=s?(W=String(s).split("/").pop())==null?void 0:W.replace(/\.git$/,""):null,l=o.app_name||r||o.container_name||"Untitled Project",d=(o.status||"").toLowerCase();let c;d==="running"?c="running":d==="failed"||d==="error"?c="failed":c="imported";let m=!1,u="single",y=null,v=null;const g=String(o.git_url||""),h=g.startsWith("split::"),j=!o.parent_project_id&&!o.component_type;if(h){m=!0,u="split";try{const _=g.replace("split::","").split("|");_.length===2&&(y=_[0],v=_[1])}catch{}}else if(d==="imported_split")m=!0,u="split";else if(j&&g.includes("|")){m=!0,u="split";try{const _=g.split("|");_.length===2&&(y=_[0],v=_[1])}catch{}}const J=o.custom_domain&&o.domain_status&&o.domain_status.toLowerCase()==="active"?`https://${o.custom_domain}`:o.deployed_url||o.app_url||null;return{id:o.id,name:l,status:c,url:J,createdAt:o.created_at,updatedAt:o.updated_at,repository:a,repository_url:a,git_url:s,project_type:u,isSplit:m,frontend_url:y,backend_url:v,processPid:o.process_pid||null,port:o.port||null,startCommand:o.start_command||null,buildCommand:o.build_command||null,isRunning:o.is_running||!1,custom_domain:o.custom_domain||null,domain_status:o.domain_status||null,last_domain_sync:o.last_domain_sync||null}}),q=[...$],X(q)):X([])}catch(t){console.error("Error loading projects:",t),X([])}}function X(n){const t=document.getElementById("projectsGrid");if(t){if(n.length===0){t.innerHTML=`
      <div class="empty-state">
        <p>No projects found</p>
        <button class="btn-primary" onclick="if(window.router){window.router.navigate('/deploy');}else{window.location.href='/deploy';}">Create First Project</button>
      </div>
    `;return}t.innerHTML=n.map(e=>{const o=e.status==="running"?"status-success":e.status==="failed"?"status-error":"status-info",s=e.status==="running"?"Running":e.status==="failed"?"Failed":"Imported",a=e.status==="running"?"🚀":"📦",r=e.updatedAt?ee(e.updatedAt):"Recently";return`
      <div class="project-card" data-project-id="${e.id}" onclick="selectProject(${e.id})">
        <div class="project-header">
          <div class="project-icon">${a}</div>
          <div class="project-status ${o}">${s}</div>
          </div>
        
        <div class="project-info">
          <h3 class="project-name">${B(e.name)}</h3>
          <div class="project-meta">
            <svg class="icon-clock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12,6 12,12 16,14"></polyline>
            </svg>
            <span>Updated ${r}</span>
        </div>
          
                 ${e.status==="running"?`
                 <div class="project-metrics">
                   ${e.port?`
                   <div class="metric">
                     <span class="metric-label">Port</span>
                     <span class="metric-value">${e.port}</span>
                   </div>
                   `:""}
                   ${e.processPid?`
                   <div class="metric">
                     <span class="metric-label">PID</span>
                     <span class="metric-value">${e.processPid}</span>
                   </div>
                   `:""}
            </div>
            `:""}
            </div>
        
        <div class="project-footer">
          ${e.status==="running"&&e.url?`
          <button class="btn-dark btn-block btn-open-site" onclick="event.stopPropagation(); openProjectSite(${e.id})">Open Site</button>
          `:""}
          <button class="btn-icon btn-danger btn-delete" title="Delete project" onclick="event.stopPropagation(); deleteProject(${e.id})">
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
      `}).join("")}}async function ut(n){try{const t=$.find(o=>o.id===n);if(!t){p("Project not found","error");return}const e=Ve(t.url);if(!e){p("Project URL not available. Make sure the project is deployed.","error");return}window.open(e,"_blank"),p(`Opening ${t.name}...`,"info")}catch(t){console.error("Error opening project site:",t),p("Failed to open project site: "+t.message,"error")}}function yt(){const n=document.getElementById("projectsGrid");n&&(n.innerHTML=`
    <div class="loading-skeleton">
      ${Array(3).fill(`
        <div class="skeleton-card">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line short"></div>
        </div>
      `).join("")}
    </div>
  `)}let i=null;function je(n){V().then(()=>{const e=$.find(o=>o.id==n);if(!e){const o=q.find(s=>s.id==n);o&&(i=o,Ie(o));return}i=e,Ie(e)});const t=document.getElementById("page-project-config");t&&t.style.display!=="none"&&Le()}function Ie(n){const t=document.getElementById("sidebar");t&&(t.style.display="none");let e=document.getElementById("projectSidebar");e||(e=gt(),document.body.appendChild(e));const o=e.querySelector("#projectSidebarName");o&&(o.textContent=n.name);const s=e.querySelector("#projectSidebarId");s&&(s.textContent=n.id);const a=e.querySelector('a[data-project-page="status"]');a&&(n.project_type==="split"?a.style.display="flex":a.style.display="none"),e.style.display="block",document.getElementById("pageTitle").textContent=n.name,qe(),xe("deploy")}function gt(){const n=document.createElement("aside");return n.id="projectSidebar",n.className="sidebar project-sidebar",n.innerHTML=`
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
  `,n.querySelectorAll(".project-nav-item").forEach(t=>{t.addEventListener("click",async e=>{e.preventDefault();const o=t.getAttribute("data-project-page");if(await V(),i){const s=$.find(a=>a.id===i.id);s&&(i=s)}xe(o),n.querySelectorAll(".project-nav-item").forEach(s=>s.classList.remove("active")),t.classList.add("active")})}),n}function ft(){const n=document.getElementById("projectSidebar");n&&(n.style.display="none");const t=document.getElementById("sidebar");t&&(t.style.display="block"),i=null,document.getElementById("pageTitle").textContent="Projects",document.querySelectorAll(".page").forEach(o=>{o.style.display="none"});const e=document.getElementById("page-projects");e&&(e.style.display="block"),V()}function xe(n){switch(document.querySelectorAll(".page").forEach(t=>{t.style.display="none"}),n){case"deploy":const t=document.getElementById("page-deploy");if(t){t.style.display="block";const o=document.getElementById("deploy-status"),s=document.getElementById("deploy-success");o&&(o.textContent="",o.style.color=""),s&&(s.style.display="none");const a=document.getElementById("deploy-page-title"),r=document.getElementById("deploy-card-title"),l=document.getElementById("deploy-description");if(i){a&&(a.textContent=i.name||"Project"),r&&(r.textContent=i.name||"Project"),l&&(l.textContent="Update deployment settings and redeploy your project.");const b=document.getElementById("import-info"),L=document.getElementById("import-repo-name"),D=i.git_url||i.repository_url||"",S=document.getElementById("git-url");if(S&&D&&(S.value=D,console.log("Populated Git URL input in showProjectContent:",D),S.removeAttribute("required")),D&&b&&L)try{const w=D.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git|[/]|$)/);if(w){const k=w[1],C=w[2];L.textContent=`${k}/${C}`,b.style.display="flex";const I=document.getElementById("branch-badge"),F=document.getElementById("branch-name");I&&F&&(I.style.display="flex",F.textContent="main")}}catch(w){console.warn("Failed to parse GitHub URL:",w)}else b&&(b.style.display="none");console.log("showProjectContent - currentProject:",{id:i.id,name:i.name,git_url:i.git_url,repository_url:i.repository_url,gitUrl:D}),Lt(i.id,D)}else{a&&(a.textContent="New Project"),r&&(r.textContent="New Project"),l&&(l.textContent="Choose where you want to create the project and give it a name.");const b=document.getElementById("import-info");b&&(b.style.display="none")}const d=document.getElementById("project-components-section");d&&(d.style.display="none"),document.getElementById("deploy-type");const c=document.getElementById("deploy-type-group"),m=document.getElementById("single-repo-group"),u=document.getElementById("git-url-section"),y=document.getElementById("split-deploy-layout"),v=document.getElementById("git-url"),g=document.getElementById("project-name"),h=document.getElementById("framework-preset"),j=document.getElementById("root-directory"),z=document.getElementById("install-command"),J=document.getElementById("build-command"),W=document.getElementById("start-command"),_=document.getElementById("port"),M=document.getElementById("frontend-url"),f=document.getElementById("backend-url"),x=document.getElementById("deploy-submit-default"),ie=document.getElementById("edit-root-directory-btn");ie&&j&&(ie.onclick=()=>{j.removeAttribute("readonly"),j.focus(),j.select()});let P=i==null?void 0:i.project_type;const re=(i==null?void 0:i.git_url)||(i==null?void 0:i.repository_url)||"",oe=re.startsWith("split::");if(P||(i!=null&&i.isSplit||oe?P="split":P="single"),oe&&P!=="split"?P="split":!oe&&P==="split"&&re&&(P="single"),i){if(c&&(c.style.display="none"),g&&(g.value=i.name||i.app_name||""),h){const b=i.buildCommand||i.build_command||"",L=i.startCommand||i.start_command||"";b.includes("next build")||L.includes("next start")?h.value="nextjs":b.includes("react-scripts")||L.includes("react-scripts")?h.value="react":L.includes("vue")||b.includes("vue")?h.value="vue":L.includes("flask")||b.includes("flask")?h.value="flask":L.includes("django")||b.includes("django")?h.value="django":L.includes("python")||b.includes("python")?h.value="python":L.includes("node")||b.includes("npm")?h.value="nodejs":h.value="auto"}if(j&&(j.value="./"),J&&(J.value=i.buildCommand||i.build_command||""),W&&(W.value=i.startCommand||i.start_command||""),_&&(_.value=i.port||""),z&&!z.value){const b=(h==null?void 0:h.value)||"auto";["nextjs","react","vue","nodejs"].includes(b)?z.placeholder="npm install":["python","flask","django"].includes(b)&&(z.placeholder="pip install -r requirements.txt")}if(P==="split"){m&&(m.style.display="none"),y&&(y.style.display="block"),M&&(M.value=i.frontend_url||""),f&&(f.value=i.backend_url||""),v&&v.removeAttribute("required"),x&&(x.style.display="none");const b=document.getElementById("deploy-frontend-btn"),L=document.getElementById("deploy-backend-btn"),D=document.getElementById("deploy-both-btn");b&&(b.onclick=async()=>{var C,I,F,G;const S=(C=M==null?void 0:M.value)==null?void 0:C.trim();if(!S||!S.startsWith("http"))return p("Enter a valid frontend URL","error");const w=be(!1);document.getElementById("step-frontend").style.display="flex",w.updateFrontendStatus("deploying","Deploying your frontend now..."),(I=document.getElementById("build-command"))!=null&&I.value.trim(),(F=document.getElementById("start-command"))!=null&&F.value.trim(),(G=document.getElementById("port"))!=null&&G.value.trim();const k=await Me(S,"frontend",w,!0);k&&k.success&&k.deployed_url?(w.showUrls(k.deployed_url,null),document.getElementById("close-deployment-dialog").onclick=()=>{w.close(),ye(),de()}):k&&!k.success&&setTimeout(()=>w.close(),3e3)}),L&&(L.onclick=async()=>{var C,I,F,G;const S=(C=f==null?void 0:f.value)==null?void 0:C.trim();if(!S||!S.startsWith("http"))return p("Enter a valid backend URL","error");const w=be(!1);document.getElementById("step-backend").style.display="flex",w.updateBackendStatus("deploying","Deploying your backend now..."),(I=document.getElementById("build-command"))!=null&&I.value.trim(),(F=document.getElementById("start-command"))!=null&&F.value.trim(),(G=document.getElementById("port"))!=null&&G.value.trim();const k=await Me(S,"backend",w,!0);k&&k.success&&k.deployed_url?(w.showUrls(null,k.deployed_url),document.getElementById("close-deployment-dialog").onclick=()=>{w.close(),ye(),de()}):k&&!k.success&&setTimeout(()=>w.close(),3e3)}),D&&(D.onclick=async()=>{var F,G;const S=(F=M==null?void 0:M.value)==null?void 0:F.trim(),w=(G=f==null?void 0:f.value)==null?void 0:G.trim();if(!S||!S.startsWith("http")||!w||!w.startsWith("http")){p("Please enter valid Frontend and Backend repository URLs","error");return}let k=!1,C={};if(i&&i.id)try{const E=await fetch(`/api/env-vars?project_id=${i.id}`,{headers:T()});if(E.ok){const Y=(await E.json()).variables||{};k=Object.keys(Y).length>0,console.log("Existing env vars check:",{hasExistingEnvVars:k,count:Object.keys(Y).length})}}catch(E){console.warn("Failed to check existing env vars:",E)}if(k){await I();return}try{const E=await fetch(`/api/env-vars/detect?frontend_url=${encodeURIComponent(S)}&backend_url=${encodeURIComponent(w)}`,{headers:T()});E.ok?(C=(await E.json()).suggestions||{},console.log("Env var detection result:",{count:Object.keys(C).length,vars:C})):console.warn("Env var detection API returned:",E.status)}catch(E){console.warn("Env var detection failed:",E)}wt(C,async()=>{if(Object.keys(C).length===0){i&&i.id?U.navigate("/env-vars"):(p("No env vars detected. Add them manually after deployment","info"),await I());return}if(p("Importing environment variables...","info"),i&&i.id){const E={};Object.keys(C).forEach(le=>{E[le]=""});const Q=localStorage.getItem("access_token")||localStorage.getItem("authToken"),Y=await fetch(`/api/env-vars?project_id=${i.id}`,{headers:{Authorization:`Bearer ${Q}`}});if(Y.ok){const me={...(await Y.json()).variables||{},...E};(await fetch("/api/env-vars",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${Q}`},body:JSON.stringify({variables:me,project_id:i.id})})).ok?(p("Environment variables imported successfully!","success"),setTimeout(()=>I(),500)):(p("Failed to import environment variables","error"),await I())}else p("Failed to load existing environment variables","error"),await I()}else p("Save detected env vars after deployment","info"),await I()},()=>{i&&i.id?U.navigate("/env-vars"):p("Please add environment variables after deployment","info")},async()=>{await I()});async function I(){var Q,Y,le;const E=be(!0);document.getElementById("step-backend").style.display="flex",document.getElementById("step-frontend").style.display="flex",E.updateBackendStatus("deploying","Deploying your backend now...");try{const R=new FormData;R.append("deploy_type","split"),R.append("frontend_url",S),R.append("backend_url",w),i&&i.id&&R.append("project_id",String(i.id));const me=(Q=document.getElementById("build-command"))==null?void 0:Q.value.trim(),he=(Y=document.getElementById("start-command"))==null?void 0:Y.value.trim(),Te=(le=document.getElementById("port"))==null?void 0:le.value.trim();me&&R.append("build_command",me),he&&R.append("start_command",he),Te&&R.append("port",Te);const Ae=await fetch("/deploy",{method:"POST",headers:T(),body:R}),pe=await Ae.json();Ae.ok&&pe.deployed_url?(E.updateBackendStatus("success","Backend deployed! ✅"),E.updateFrontendStatus("success","Frontend deployed! ✅"),E.showUrls(pe.deployed_url,null),document.getElementById("close-deployment-dialog").onclick=()=>{E.close(),V(),ye(),de()},p("Split deployment successful!","success")):(E.updateBackendStatus("failed",pe.detail||"Deployment failed"),E.updateFrontendStatus("failed","Could not deploy"),p(pe.detail||"Deployment failed","error"),setTimeout(()=>E.close(),3e3))}catch{E.updateBackendStatus("failed","Network error"),E.updateFrontendStatus("failed","Network error"),p("Network error during deployment","error"),setTimeout(()=>E.close(),3e3)}}}),x&&(x.style.display="none")}else if(P==="single"){if(m&&(m.style.display="block"),u&&(u.style.display="none"),y&&(y.style.display="none"),v&&i){const b=i.git_url||i.repository_url||"";b&&(v.value=b,v.removeAttribute("required"))}x&&(x.textContent="Deploy",x.style.display="")}}else c&&(c.style.display=""),splitGroup&&(splitGroup.style.display="none"),y&&(y.style.display="none"),m&&(m.style.display="block"),v&&(v.value=""),x&&(x.textContent="🚀 Deploy",x.style.display="")}document.getElementById("pageTitle").textContent="Deploy";break;case"status":ht();break;case"configuration":vt();break;case"domain-config":Oe();break;case"env-vars":const e=document.getElementById("page-env-vars");e&&(e.style.display="block",Pe());break}}async function vt(){let n=document.getElementById("page-project-config");n||(n=document.createElement("div"),n.id="page-project-config",n.className="page",n.innerHTML=`
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
              <span class="config-value-text" id="projectConfigCreated">${i!=null&&i.createdAt?_e(i.createdAt):"Unknown"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Last update:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigUpdated">${i!=null&&i.updatedAt?ee(new Date(i.updatedAt)):"Unknown"}</span>
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
    `,document.getElementById("pageContent").appendChild(n));const t=document.getElementById("project-components-section");t&&(t.style.display="none"),Le();const e=document.getElementById("changeProjectNameBtn");e&&(e.onclick=()=>He()),n.style.display="block"}async function ht(){document.querySelectorAll(".page").forEach(t=>t.style.display="none");let n=document.getElementById("page-status");if(n||(n=document.createElement("div"),n.id="page-status",n.className="page",document.getElementById("pageContent").appendChild(n)),n.innerHTML="",i&&i.id)try{const t=await fetch(`/projects/${i.id}/components`,{headers:T()});if(t.ok){const o=(await t.json()).components||[],s=o.find(m=>m.component_type==="frontend"),a=o.find(m=>m.component_type==="backend"),r=s?s.status==="running"?"RUNNING":s.status.toUpperCase():"NOT DEPLOYED",l=a?a.status==="running"?"RUNNING":a.status.toUpperCase():"NOT DEPLOYED",d=(s==null?void 0:s.status)==="running"?"status-success":(s==null?void 0:s.status)==="failed"?"status-error":"status-info",c=(a==null?void 0:a.status)==="running"?"status-success":(a==null?void 0:a.status)==="failed"?"status-error":"status-info";n.innerHTML=`
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
                      <span>Updated ${s.updated_at?ee(new Date(s.updated_at)):"Recently"}</span>
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
                      <span>Updated ${a.updated_at?ee(new Date(a.updated_at)):"Recently"}</span>
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
        `}}catch(t){console.error("Error loading project components:",t),n.innerHTML=`
        <div class="card">
          <p>Unable to load project components. Please try again later.</p>
        </div>
      `}n.style.display="block",document.getElementById("pageTitle").textContent="Status"}async function ye(){if(!(!i||!i.id))try{const n=await fetch(`/projects/${i.id}/components`,{headers:T()});if(!n.ok)return;const e=(await n.json()).components||[],o=e.find(y=>y.component_type==="frontend"),s=e.find(y=>y.component_type==="backend"),a=o&&o.status&&o.status!=="imported"&&o.status!=="imported_split",r=s&&s.status&&s.status!=="imported"&&s.status!=="imported_split",l=a&&r;let d=document.getElementById("project-components-section");const c=document.getElementById("page-deploy"),m=document.getElementById("page-project-config"),u=m==null?void 0:m.querySelector("#project-components-section");if(u&&u.remove(),l&&c&&c.style.display!=="none"){if(!d){d=document.createElement("div"),d.id="project-components-section",d.className="card project-components-card";const j=c.querySelector(".card");j?c.insertBefore(d,j):c.appendChild(d)}d.style.display="block";const y=o?o.status==="running"?"RUNNING":o.status.toUpperCase():"NOT DEPLOYED",v=s?s.status==="running"?"RUNNING":s.status.toUpperCase():"NOT DEPLOYED",g=(o==null?void 0:o.status)==="running"?"status-success":(o==null?void 0:o.status)==="failed"?"status-error":"status-info",h=(s==null?void 0:s.status)==="running"?"status-success":(s==null?void 0:s.status)==="failed"?"status-error":"status-info";d.innerHTML=`
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
                <span>Updated ${o.updated_at?ee(new Date(o.updated_at)):"Recently"}</span>
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
                <span>Updated ${s.updated_at?ee(new Date(s.updated_at)):"Recently"}</span>
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
    `,requestAnimationFrame(()=>{d.classList.add("components-visible");const j=c.querySelector(".card:not(#project-components-section)");j&&j.classList.add("deploy-card-slide-down")})}else if(d){d.style.display="none",d.classList.remove("components-visible");const y=c==null?void 0:c.querySelector(".card:not(#project-components-section)");y&&y.classList.remove("deploy-card-slide-down")}}catch(n){console.error("Error loading project components:",n)}}function Ve(n){if(!n||n==="#")return null;const t=n.trim();return/^https?:\/\//i.test(t)?t:`https://${t}`}function bt(n){const t=Ve(n);t?window.open(t,"_blank"):p("Site URL is unavailable","error")}function wt(n,t,e,o){const s=document.createElement("div");s.className="modal-overlay",s.id="envVarsDetectionOverlay";const a=document.createElement("div");a.className="modal-content enhanced",a.style.maxWidth="600px";const r=Object.keys(n).length>0,l=r?Object.entries(n).map(([c,m])=>`
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
  `,s.appendChild(a),document.body.appendChild(s),document.querySelector(".skip-env-btn").onclick=()=>{s.remove(),o&&o()},document.querySelector(".add-manual-env-btn").onclick=()=>{s.remove(),e&&e()};const d=document.querySelector(".import-env-btn");return d&&(d.onclick=async()=>{s.remove(),t&&await t()}),s}function be(n=!0){const t=document.createElement("div");t.className="modal-overlay deployment-progress-overlay",t.id="deploymentProgressOverlay";const e=document.createElement("div");return e.className="deployment-progress-modal",e.innerHTML=`
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
  `,t.appendChild(e),document.body.appendChild(t),{overlay:t,updateBackendStatus:(o,s)=>{const a=document.getElementById("step-backend"),r=a.querySelector(".step-icon"),l=document.getElementById("backend-status"),d=document.getElementById("backend-message");d.textContent=s,o==="deploying"?(r.textContent="⏳",l.textContent="",a.classList.remove("completed","failed"),a.classList.add("active")):o==="success"?(r.textContent="✅",l.textContent="✓",a.classList.remove("active","failed"),a.classList.add("completed")):o==="failed"&&(r.textContent="❌",l.textContent="✗",a.classList.remove("active","completed"),a.classList.add("failed"))},updateFrontendStatus:(o,s)=>{const a=document.getElementById("step-frontend"),r=a.querySelector(".step-icon"),l=document.getElementById("frontend-status"),d=document.getElementById("frontend-message");d.textContent=s,o==="deploying"?(r.textContent="⏳",l.textContent="",a.classList.remove("completed","failed"),a.classList.add("active")):o==="success"?(r.textContent="✅",l.textContent="✓",a.classList.remove("active","failed"),a.classList.add("completed")):o==="failed"&&(r.textContent="❌",l.textContent="✗",a.classList.remove("active","completed"),a.classList.add("failed"))},showUrls:(o,s)=>{const a=document.getElementById("deployment-urls"),r=document.getElementById("frontend-url-link"),l=document.getElementById("backend-url-link"),d=document.getElementById("close-deployment-dialog");o?(r.href=o,r.textContent=o,r.closest(".url-item").style.display="flex"):r.closest(".url-item").style.display="none",s?(l.href=s,l.textContent=s,l.closest(".url-item").style.display="flex"):l.closest(".url-item").style.display="none",a.style.display="block",d.style.display="block"},close:()=>{const o=document.getElementById("deploymentProgressOverlay");o&&document.body.removeChild(o)}}}function He(){if(!i){p("No project selected","error");return}const n=document.createElement("div");n.className="modal-overlay";const t=document.createElement("div");t.className="modal-content enhanced",t.innerHTML=`
    <div class="project-name-modal-header">
      <h2 class="project-name-modal-title">Change Project Name</h2>
      <p class="project-name-modal-subtitle">
        Update the name for <strong>${B(i.name)}</strong>
      </p>
    </div>
    
    <div class="project-name-modal-form-group">
      <label class="project-name-modal-label">Project Name</label>
      <input 
        type="text" 
        id="newProjectNameInput"
        class="project-name-modal-input"
        value="${B(i.name)}"
        placeholder="Enter new project name"
      />
    </div>
    
    <div class="project-name-modal-actions">
      <button class="cancel-name-btn">Cancel</button>
      <button class="save-name-btn">Save Changes</button>
    </div>
  `,n.appendChild(t),document.body.appendChild(n);const e=document.getElementById("newProjectNameInput");e&&(e.focus(),e.select());const o=t.querySelector(".cancel-name-btn"),s=t.querySelector(".save-name-btn"),a=()=>{document.body.removeChild(n)};o.onclick=()=>{a()},s.onclick=async()=>{const l=e.value.trim();if(!l){p("Project name cannot be empty","error");return}if(l===i.name){a();return}try{const d=localStorage.getItem("access_token")||localStorage.getItem("authToken"),c=await fetch(`/projects/${i.id}/name`,{method:"PUT",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${d}`},body:new URLSearchParams({app_name:l})}),m=await c.json();if(c.ok){p("Project name updated successfully!","success"),i.name=l,a();const u=$.findIndex(v=>v.id===i.id);u>=0&&($[u].name=l),Le(),X(q);const y=document.getElementById("projectSidebarName");y&&(y.textContent=l),document.getElementById("pageTitle").textContent=l}else p(m.detail||"Failed to update project name","error")}catch(d){console.error("Error updating project name:",d),p("Failed to update project name: "+d.message,"error")}},n.onclick=l=>{l.target===n&&a()};const r=l=>{l.key==="Escape"&&(a(),document.removeEventListener("keydown",r))};document.addEventListener("keydown",r)}function Et(n){const t=document.getElementById("content"+n.charAt(0).toUpperCase()+n.slice(1)),e=document.getElementById("icon"+n.charAt(0).toUpperCase()+n.slice(1));t&&e&&(t.classList.toggle("active"),e.classList.toggle("active"))}function kt(){i&&i.id?typeof U<"u"&&U&&U.navigate?U.navigate("/env-vars"):window.router&&window.router.navigate?window.router.navigate("/env-vars"):window.location.hash="#/env-vars":p("Please create a project first before adding environment variables","info")}function Bt(){const n=document.getElementById("framework-preset"),t=document.getElementById("install-command"),e=document.getElementById("build-command"),o=document.getElementById("start-command");n&&n.addEventListener("change",function(s){const a=s.target.value;if(t&&(["nextjs","react","vue","nuxt","gatsby","angular","svelte","vite","nodejs"].includes(a)?t.placeholder="npm install, yarn install, or pnpm install":["python","flask","django"].includes(a)?t.placeholder="pip install -r requirements.txt":t.placeholder="npm install, yarn install, pnpm install, or pip install -r requirements.txt"),e){const r={nextjs:"next build",react:"npm run build",vue:"npm run build",nuxt:"nuxt build",gatsby:"gatsby build",angular:"ng build",svelte:"npm run build",vite:"vite build",nodejs:"npm run build",python:"",flask:"",django:"python manage.py collectstatic --noinput",static:""};r[a]&&(e.placeholder=r[a]||"Leave empty for auto-detect")}if(o){const r={nextjs:"npm run start",react:"npm start",vue:"npm run serve",nuxt:"nuxt start",gatsby:"gatsby serve",angular:"ng serve",svelte:"npm run dev",vite:"vite preview",nodejs:"node server.js",python:"python app.py",flask:"flask run",django:"python manage.py runserver",static:"python -m http.server"};r[a]&&(o.placeholder=r[a]||"Leave empty for auto-detect")}})}window.toggleDeploySection=Et;window.navigateToEnvVars=kt;function Le(){if(!i)return;const n=document.getElementById("projectConfigName"),t=document.getElementById("projectConfigOwner"),e=document.getElementById("projectConfigId"),o=document.getElementById("projectConfigCreated"),s=document.getElementById("projectConfigUpdated"),a=document.getElementById("projectConfigPort"),r=document.getElementById("projectConfigPid"),l=document.getElementById("projectConfigStartCommand"),d=document.getElementById("projectConfigBuildCommand");if(n&&(n.textContent=i.name||"Unknown"),t){const c=localStorage.getItem("username"),m=localStorage.getItem("displayName");t.textContent=m||c||"Unknown User"}e&&(e.textContent=i.id||"-"),o&&(o.textContent=i.createdAt?_e(i.createdAt):"Unknown"),s&&(s.textContent=i.updatedAt?ee(new Date(i.updatedAt)):"Unknown"),a&&(a.textContent=(i==null?void 0:i.port)||"Not set"),r&&(r.textContent=(i==null?void 0:i.processPid)||"Not running"),l&&(l.textContent=(i==null?void 0:i.startCommand)||"Not set"),d&&(d.textContent=(i==null?void 0:i.buildCommand)||"Not set")}function Oe(){let n=document.getElementById("page-project-domain");n||(n=document.createElement("div"),n.id="page-project-domain",n.className="page",n.innerHTML=`
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
                <span class="domain-platform" id="platformDomain">aayush786.xyz</span>
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
    `,document.getElementById("pageContent").appendChild(n)),n.style.display="block",It(),fe()}function It(){const n=document.getElementById("saveDomainBtn");n&&!n.dataset.bound&&(n.dataset.bound="true",n.addEventListener("click",Ct))}function St(n,t){if(!n)return;if(!t||!t.custom_domain){n.innerHTML='<span class="status-muted">No custom domain configured yet.</span>';return}const e=(t.domain_status||"unknown").toLowerCase(),o=t.last_domain_sync?_e(t.last_domain_sync):"Never";let s="Unknown",a="status-info",r="";e==="active"?(s="Active",a="status-success"):e==="error"?(s="Error",a="status-error",r="Resolve the issue and save the domain again."):e==="pending"&&(s="Pending",a="status-warning",r="Domain will be activated automatically after the next successful deployment."),n.innerHTML=`
    <div class="domain-status-line ${a}">
      <div class="domain-status-domain">
        <strong>${B(t.custom_domain)}</strong>
      </div>
      <div class="domain-status-meta">
        <span>${s}</span>
        <span>Last sync: ${B(o)}</span>
      </div>
      ${r?`<p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">${B(r)}</p>`:""}
    </div>
  `}async function fe(){const n=document.getElementById("domainSuggestion"),t=document.getElementById("domainStatus"),e=document.getElementById("domainPrefix"),o=document.getElementById("platformDomain");if(!i||!i.id){t&&(t.innerHTML='<span class="status-muted">Select a project to configure its domain.</span>');return}const s=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!s){t&&(t.innerHTML='<span class="status-error">Please login to manage domains.</span>');return}n&&(n.textContent="Loading domain details...");try{const a=await fetch(`/projects/${i.id}/domain`,{headers:{Authorization:`Bearer ${s}`}});if(!a.ok)throw new Error(`Failed to load domain info (${a.status})`);const r=await a.json(),l=r.butler_domain||"aayush786.xyz";o&&(o.textContent=l);let d="";const c=r.custom_domain||r.suggested_domain||"";if(c)if(c.endsWith(l))d=c.slice(0,-(l.length+1));else{const m=c.split(".");m.length>0&&(d=m[0])}if(e){e.value=d;const m=r.suggested_domain&&r.suggested_domain.endsWith(l)?r.suggested_domain.slice(0,-(l.length+1)):"";e.placeholder=m||"project-slug or my.project"}if(n){const m=r.suggested_domain&&r.suggested_domain.endsWith(l)?r.suggested_domain.slice(0,-(l.length+1)):"";n.textContent=m?`Suggested: ${m} (you can use multiple labels like "my.project" or "portfolio.app"). Leave blank to remove. Domains become active after a successful deploy.`:`Enter a subdomain prefix (can be multiple labels like "my.project" or "portfolio"). The platform domain ${l} is fixed and cannot be changed.`}St(t,r),i&&(i.custom_domain=r.custom_domain,i.domain_status=r.domain_status)}catch(a){console.error("Failed to load project domain info:",a),t&&(t.innerHTML='<span class="status-error">Could not load domain configuration.</span>')}}async function Ct(){if(!i||!i.id){p("Select a project first","error");return}const n=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!n){p("Please login to manage domains","error");return}const t=document.getElementById("domainPrefix"),e=document.getElementById("platformDomain");let o=t?t.value.trim():"";const s=e?e.textContent.trim():"";let a="";if(o){if(o=o.trim().replace(/^\.+|\.+$/g,""),!o){p("Please enter a subdomain prefix.","error");return}if(!/^[a-z0-9.-]+$/i.test(o)){p("Subdomain prefix can only contain letters, numbers, hyphens, and dots.","error");return}if(o.includes("..")){p("Subdomain prefix cannot contain consecutive dots.","error");return}if(o.startsWith(".")||o.endsWith(".")){p("Subdomain prefix cannot start or end with a dot.","error");return}a=`${o}.${s}`}if(!a){if(!i.custom_domain){p("Enter a subdomain prefix to save, or leave blank to remove the domain.","info");return}if(!confirm("Remove the custom domain and revert to the default internal URL?"))return;await jt(),await fe();return}const r={custom_domain:a,auto_generate:!1};try{const l=await fetch(`/projects/${i.id}/domain`,{method:"POST",headers:{Authorization:`Bearer ${n}`,"Content-Type":"application/json"},body:JSON.stringify(r)});if(!l.ok){const m=(await l.json().catch(()=>({}))).detail||"Failed to save domain";if(l.status===409){p(m,"error");const y=document.getElementById("domainStatus");y&&(y.innerHTML=`<span class="status-error">${B(m)}</span>`)}else throw new Error(m);return}const d=await l.json();p(`Domain saved: ${d.custom_domain}`,"success"),await fe()}catch(l){console.error("Failed to save domain:",l),p(l.message||"Failed to save domain","error");const d=document.getElementById("domainStatus");d&&l.message&&(d.innerHTML=`<span class="status-error">${B(l.message)}</span>`)}}async function jt(){if(!i||!i.id){p("Select a project first","error");return}const n=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!n){p("Please login to manage domains","error");return}try{const t=await fetch(`/projects/${i.id}/domain`,{method:"DELETE",headers:{Authorization:`Bearer ${n}`}});if(!t.ok){const o=(await t.json().catch(()=>({}))).detail||"Failed to reset domain";throw new Error(o)}p("Domain removed. Project will use its internal URL.","success"),i&&(i.custom_domain=null,i.domain_status=null),await fe()}catch(t){console.error("Failed to clear domain:",t),p(t.message||"Failed to clear domain","error")}}function xt(n){je(n)}async function qe(){const n=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!n){console.log("No auth token found");return}try{const t=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${n}`}});if(t.ok){const e=await t.json(),o=document.getElementById("projectSidebar");if(o){const s=o.querySelector("#projectSidebarUserName"),a=o.querySelector("#projectSidebarUserEmail"),r=o.querySelector("#projectSidebarUserAvatar");if(s&&(s.textContent=e.display_name||e.username||"User"),a&&(a.textContent=e.email||"No email"),r)if(e.avatar_url){const l=new Image;l.onload=()=>{r.style.backgroundImage=`url(${e.avatar_url})`,r.style.backgroundSize="cover",r.style.backgroundPosition="center",r.textContent=""},l.onerror=()=>{r.style.backgroundImage="",r.textContent=(e.display_name||e.username||"U").charAt(0).toUpperCase()},l.src=e.avatar_url}else r.style.backgroundImage="",r.textContent=(e.display_name||e.username||"U").charAt(0).toUpperCase()}}else console.error("Failed to load user profile:",t.status)}catch(t){console.error("Error loading user profile:",t)}}function ee(n){if(!n)return"Recently";const e=Date.now()-new Date(n).getTime(),o=Math.floor(e/6e4),s=Math.floor(e/36e5),a=Math.floor(e/864e5);if(o<1)return"Just now";if(o<60)return`${o}m ago`;if(s<24)return`${s}h ago`;if(a<7)return`${a}d ago`;const r=new Date(n);return r.toLocaleDateString("en-US",{month:"short",day:"numeric",year:r.getFullYear()!==new Date().getFullYear()?"numeric":void 0})}function _e(n){return n?new Date(n).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit",hour12:!0,timeZone:"Asia/Kathmandu"}):"Unknown"}async function Lt(n,t){const e=document.getElementById("monorepo-section"),o=document.getElementById("frontend-folder"),s=document.getElementById("backend-folder");if(!(!e||!o||!s))try{const a=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!a)return;const r=n?`/api/detect-monorepo?project_id=${n}`:`/api/detect-monorepo?git_url=${encodeURIComponent(t)}`,l=await fetch(r,{headers:{Authorization:`Bearer ${a}`}});if(l.ok){const d=await l.json();if(d.is_monorepo){if(e.style.display="block",d.frontend_folder){o.innerHTML='<option value="">None (skip frontend)</option>';const c=document.createElement("option");c.value=d.frontend_folder,c.textContent=d.frontend_folder,c.selected=!0,o.appendChild(c)}else o.innerHTML='<option value="">None (skip frontend)</option>';if(d.backend_folder){s.innerHTML='<option value="">None (skip backend)</option>';const c=document.createElement("option");c.value=d.backend_folder,c.textContent=d.backend_folder,c.selected=!0,s.appendChild(c)}else s.innerHTML='<option value="">None (skip backend)</option>'}else e.style.display="none"}}catch(a){console.error("Error detecting monorepo structure:",a),e.style.display="none"}}async function de(){await V();try{const n=await fetch("/deployments",{headers:T()});if(n.ok){const t=await n.json();document.getElementById("totalDeployments").textContent=t.length,document.getElementById("runningApps").textContent=t.filter(o=>o.status==="success").length;const e=document.getElementById("recentActivity");t.length>0?e.innerHTML=t.slice(0,5).map(o=>{const s=o.app_name||o.container_name||"Untitled Project";return`
          <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
            <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 0.25rem;">${B(s)}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">
              ${new Date(o.created_at).toLocaleString("en-US",{timeZone:"Asia/Kathmandu"})}
            </div>
          </div>
        `}).join(""):e.innerHTML='<p class="recent-activity-empty">No recent activity</p>'}}catch(n){console.error("Error loading dashboard:",n)}}async function _t(n){var c,m,u,y,v,g,h,j,z,J,W,_,M;if(n.preventDefault(),!ne){p("Please login to deploy applications","error"),window.location.href="/login";return}n.target;const t=((c=document.getElementById("deploy-type"))==null?void 0:c.value)||"single",e=document.getElementById("deploy-status"),o=document.getElementById("deploy-success");o.style.display="none",e.textContent="";let s="";if(i&&i.id){s=i.git_url||i.repository_url||"",console.log("Deploying existing project:",{projectId:i.id,projectName:i.name,gitUrl:s,hasGitUrl:!!s});const f=document.getElementById("git-url");f&&s&&(f.value=s,console.log("Populated hidden Git URL input with:",s)),s||f&&(s=f.value.trim(),console.log("Got Git URL from input field (fallback):",s))}else{const f=document.getElementById("git-url");s=f?f.value.trim():"",console.log("Deploying new project, Git URL from input:",s)}const a=(m=document.getElementById("frontend-url"))==null?void 0:m.value.trim(),r=(u=document.getElementById("backend-url"))==null?void 0:u.value.trim(),l=i==null?void 0:i.custom_domain,d=i!=null&&i.domain_status?i.domain_status.toLowerCase():null;if(l?l&&d!=="active"&&p("Domain saved. It will activate after this deployment.","info"):console.log("No custom domain configured - deployment will use internal URL"),t==="split"){if(!a||!a.startsWith("http")||!r||!r.startsWith("http")){e.textContent="Please enter valid Frontend and Backend repository URLs",e.style.color="var(--error)";return}}else if(!s||!s.startsWith("http")){e.textContent=`Please enter a valid Git repository URL. Current project: ${(i==null?void 0:i.name)||"unknown"}, Git URL: ${s||"missing"}`,e.style.color="var(--error)",console.error("Git URL validation failed:",{currentProject:i,gitUrl:s,gitUrlInput:(y=document.getElementById("git-url"))==null?void 0:y.value});return}console.log("Git URL validation passed:",s),e.textContent="🚀 Starting deployment...",e.style.color="var(--primary)",sn(),an();try{const f=new FormData;t==="split"?(f.append("deploy_type","split"),f.append("frontend_url",a),f.append("backend_url",r)):(f.append("deploy_type","single"),f.append("git_url",s)),typeof i=="object"&&i&&i.id&&f.append("project_id",String(i.id));const x=(v=document.getElementById("project-name"))==null?void 0:v.value.trim();x&&f.append("project_name",x);const ie=((g=document.getElementById("root-directory"))==null?void 0:g.value.trim())||"./";ie&&f.append("root_directory",ie);const P=(h=document.getElementById("framework-preset"))==null?void 0:h.value;P&&P!=="auto"&&f.append("framework_preset",P);const re=(j=document.getElementById("install-command"))==null?void 0:j.value.trim();re&&f.append("install_command",re);const oe=(z=document.getElementById("build-command"))==null?void 0:z.value.trim(),b=(J=document.getElementById("start-command"))==null?void 0:J.value.trim(),L=(W=document.getElementById("port"))==null?void 0:W.value.trim();oe&&f.append("build_command",oe),b&&f.append("start_command",b),L&&f.append("port",L);const D=document.getElementById("monorepo-section"),S=(_=document.getElementById("frontend-folder"))==null?void 0:_.value.trim(),w=(M=document.getElementById("backend-folder"))==null?void 0:M.value.trim();D&&D.style.display!=="none"&&(S||w)&&(f.append("is_monorepo","true"),S&&f.append("frontend_folder",S),w&&f.append("backend_folder",w));const k=await fetch("/deploy",{method:"POST",headers:T(),body:f}),C=await k.json();if(k.ok)setTimeout(()=>{rn(C)},2e3);else if(k.status===423){const I=C.detail||"Your virtual machine is being created. Please wait a few moments and try again.";O(`⏳ ${I}`,"warning"),ae("warning","VM Creating..."),p(I,"warning")}else{const I=C.detail||"Deployment failed";O(`❌ Error: ${I}`,"error"),ae("error","Deployment Failed"),p(I,"error")}}catch{const x="Network error. Please try again.";O(`❌ ${x}`,"error"),ae("error","Network Error"),p(x,"error")}}async function Me(n,t=null,e=null,o=!1){const s=document.getElementById("deploy-status"),a=document.getElementById("deploy-success");if(!ne)return p("Please login to deploy applications","error"),window.location.href="/login",o?{success:!1,error:"Not authenticated"}:void 0;e||(a&&(a.style.display="none"),s&&(s.textContent="",s.style.color="var(--primary)"));try{const r=new FormData;r.append("deploy_type","single"),r.append("git_url",n),typeof i=="object"&&i&&i.id&&r.append("project_id",String(i.id)),t&&typeof i=="object"&&i&&i.project_type==="split"&&r.append("component_type",t),buildCommand&&r.append("build_command",buildCommand),startCommand&&r.append("start_command",startCommand),port&&r.append("port",port);const l=await fetch("/deploy",{method:"POST",headers:T(),body:r}),d=await l.json();if(l.ok){if(e){const c="success",m=t==="backend"?"Backend complete! ✅":"Frontend complete! ✅";t==="backend"?e.updateBackendStatus(c,m):t==="frontend"&&e.updateFrontendStatus(c,m)}else if(s&&(s.textContent="✅ Deployment successful!",s.style.color="var(--success)"),d.deployed_url&&a){a.style.display="block";const c=document.getElementById("openAppBtn");c&&(c.href=d.deployed_url,c.textContent=`Open ${d.deployed_url}`)}return o?{success:!0,deployed_url:d.deployed_url}:(i&&i.isSplit?setTimeout(()=>{ye(),de()},1500):setTimeout(()=>{de(),U.navigate("/applications")},2e3),{success:!0,deployed_url:d.deployed_url})}else{const c=d.detail||"Deployment failed";if(e){const m="failed",u=`Error: ${c}`;t==="backend"?e.updateBackendStatus(m,u):t==="frontend"&&e.updateFrontendStatus(m,u)}else s&&(s.textContent=`❌ Error: ${c}`,s.style.color="var(--error)");if(o)return{success:!1,error:c}}}catch{const l="Network error. Please try again.";if(e){const d="failed",c=l;t==="backend"?e.updateBackendStatus(d,c):t==="frontend"&&e.updateFrontendStatus(d,c)}else s&&(s.textContent=`❌ ${l}`,s.style.color="var(--error)");if(o)return{success:!1,error:l}}}async function $t(){if(!ne){document.getElementById("applicationsGrid").innerHTML=`
      <div class="empty-state">
        <p>Please login to view your applications</p>
        <a href="/login" class="btn-primary">Login</a>
      </div>
    `;return}try{const n=await fetch("/deployments",{headers:T()});if(n.ok){const t=await n.json(),e=document.getElementById("applicationsGrid");t.length===0?e.innerHTML=`
          <div class="empty-state">
            <p>No applications deployed yet</p>
            <a href="/deploy" class="btn-primary">Deploy Your First App</a>
          </div>
        `:e.innerHTML=t.map(o=>{const s=o.app_name||o.container_name||"Untitled Project";return`
          <div class="application-card" onclick="window.open('${o.deployed_url||"#"}', '_blank')">
            <h3>${B(s)}</h3>
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
        `}).join("")}}catch(n){console.error("Error loading applications:",n)}}async function $e(){if(!ne){document.getElementById("historyTableBody").innerHTML=`
      <tr>
        <td colspan="4" class="empty-state">Please login to view deployment history</td>
      </tr>
    `;return}try{const n=await fetch("/deployments",{headers:T()});if(n.ok){const t=await n.json(),e=document.getElementById("historyTableBody");t.length===0?e.innerHTML=`
          <tr>
            <td colspan="4" class="empty-state">No deployment history</td>
          </tr>
        `:e.innerHTML=t.map(o=>{const s=o.app_name||o.container_name||"Untitled Project";return`
          <tr>
            <td><strong>${B(s)}</strong></td>
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
        `}).join("")}}catch(n){console.error("Error loading history:",n)}}async function Pt(){if(confirm("Are you sure you want to clear all deployment history?"))try{(await fetch("/deployments/clear",{method:"DELETE",headers:T()})).ok&&(p("History cleared successfully","success"),$e())}catch{p("Error clearing history","error")}}async function Dt(n){if(confirm(`Are you sure you want to destroy "${n}"?`))try{(await fetch(`/deployments/${n}`,{method:"DELETE",headers:T()})).ok?(p("Deployment destroyed successfully","success"),$e(),$t()):p("Error destroying deployment","error")}catch{p("Network error","error")}}let N=[],Fe="";async function ze(){const n=document.getElementById("usernameSearch").value.trim();if(!n){p("Please enter a GitHub username","error");return}n!==Fe&&(N=[],Fe=n);const t=document.getElementById("repositoriesGrid");t.innerHTML='<div class="empty-state"><p>Loading repositories...</p></div>';try{const e=await fetch(`/api/repositories/${n}`),o=await e.json();e.ok&&o.repositories?o.repositories.length===0?t.innerHTML='<div class="empty-state"><p>No repositories found</p></div>':(t.innerHTML=o.repositories.map(s=>`
          <div class="repository-card ${N.some(r=>r.url===s.clone_url)?"selected":""}" data-repo-url="${s.clone_url}" onclick="toggleRepositorySelection('${s.clone_url}', '${s.name}')">
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
        `).join(""),Se()):t.innerHTML=`<div class="empty-state"><p>${o.detail||"Error loading repositories"}</p></div>`}catch{t.innerHTML='<div class="empty-state"><p>Error loading repositories</p></div>'}}function Nt(n,t){const e=N.findIndex(o=>o.url===n);if(e>=0)N.splice(e,1),Se();else{if(N.length>=2){p("You can only select up to 2 repositories for a split repository","error");return}N.push({url:n,name:t}),N.length===2&&Tt(),Se()}}function Tt(){const[n,t]=N,e=document.createElement("div");e.className="modal-overlay",e.id="splitImportModal";const o=document.createElement("div");o.className="modal-content enhanced",o.innerHTML=`
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
        <div class="split-import-repo-name">${B(n.name)}</div>
        <div class="split-import-repo-url">${B(n.url)}</div>
      </div>
      
      <div class="split-import-divider"></div>
      
      <div class="split-import-repo-item">
        <div class="split-import-repo-label">Backend</div>
        <div class="split-import-repo-name">${B(t.name)}</div>
        <div class="split-import-repo-url">${B(t.url)}</div>
      </div>
    </div>
    
    <div class="split-import-actions">
      <button class="cancel-btn">Cancel</button>
      <button class="confirm-btn">Import Multi-Repository</button>
    </div>
  `,e.appendChild(o),document.body.appendChild(e);const s=o.querySelector(".cancel-btn"),a=o.querySelector(".confirm-btn"),r=()=>{document.body.removeChild(e)};s.onclick=()=>{r()},a.onclick=()=>{r();const[d,c]=N;We(d.url,c.url,`${d.name}-${c.name}`)},e.onclick=d=>{d.target===e&&r()};const l=d=>{d.key==="Escape"&&(r(),document.removeEventListener("keydown",l))};document.addEventListener("keydown",l),a.focus()}function Se(){const n=document.getElementById("repositoriesGrid");if(!n)return;n.querySelectorAll(".repository-card").forEach(e=>{const o=e.getAttribute("data-repo-url");N.some(a=>a.url===o)?e.classList.add("selected"):e.classList.remove("selected")})}function At(){if(N.length!==2){p("Please select exactly 2 repositories","error");return}const[n,t]=N;confirm(`Import as Multi-Repository?

Frontend: ${n.name}
Backend: ${t.name}

Click OK to import these repositories as a multi-repository project.`)&&We(n.url,t.url,`${n.name}-${t.name}`)}async function We(n,t,e){const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o){p("Please login first","error");return}try{p("Importing multi-repositories...","info");const s=await fetch("/api/import-split",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${o}`},body:new URLSearchParams({frontend_url:n,backend_url:t,app_name:e})}),a=await s.json();if(s.ok){p("Multi-repository imported successfully! Navigate to Projects to see it.","success"),N=[];const r=document.getElementById("page-projects");r&&r.style.display!=="none"&&V(),document.getElementById("usernameSearch").value.trim()&&ze()}else s.status===423?p(a.detail||"Your virtual machine is being created. Please wait a few moments and try again.","warning"):p(a.detail||"Failed to import multi-repository","error")}catch(s){console.error("Error importing multi-repositories:",s),p("Failed to import multi-repository: "+s.message,"error")}}function Ut(n){document.getElementById("git-url").value=n,U.navigate("/deploy"),p("Repository selected","success")}async function Mt(n,t){const e=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!e){p("Please login first","error");return}try{p("Importing repository...","info");const o=await fetch("/api/import",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${e}`},body:new URLSearchParams({git_url:n,app_name:t||n.split("/").pop()||"Untitled Project"})}),s=await o.json();if(o.ok){p("Repository imported successfully! Navigate to Projects to see it.","success");const a=document.getElementById("page-projects");a&&a.style.display!=="none"&&V()}else o.status===423?p(s.detail||"Your virtual machine is being created. Please wait a few moments and try again.","warning"):p(s.detail||"Failed to import repository","error")}catch(o){console.error("Error importing repository:",o),p("Failed to import repository: "+o.message,"error")}}function Ft(){document.getElementById("repositoriesGrid").innerHTML=`
    <div class="empty-state">
      <p>Search for a GitHub username to see their repositories</p>
            </div>
        `}function p(n,t="info"){const e=document.getElementById("toast");e.textContent=n,e.className=`toast show ${t}`,setTimeout(()=>{e.classList.remove("show")},3e3)}let te={},Ce=[];async function Pe(){try{const n=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!n){const e=document.getElementById("envVarsList");e&&(e.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `),we();return}if(!i||!i.id){const e=document.getElementById("envVarsList");e&&(e.innerHTML=`
          <div class="empty-state">
            <p>Please select a project from the Projects page to manage environment variables</p>
          </div>
        `),we();return}const t=await fetch(`/api/env-vars?project_id=${i.id}`,{headers:{Authorization:`Bearer ${n}`}});if(t.ok){const e=await t.json();te=e.variables||{},Ce=e.vars_list||[],Rt()}else if(t.status===401){localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),ve();const e=document.getElementById("envVarsList");e&&(e.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `)}else console.error("Failed to load environment variables")}catch(n){console.error("Error loading environment variables:",n)}we()}function we(){const n=document.getElementById("importEnvBtn"),t=document.getElementById("addEnvVarBtn"),e=document.getElementById("importEnvCard"),o=document.getElementById("cancelImportBtn"),s=document.getElementById("importEnvForm"),a=document.getElementById("envDropZone"),r=document.getElementById("envFileInput"),l=document.getElementById("envDropZoneBrowse"),d=document.getElementById("envDropZoneFileName");if(n&&(n.onclick=()=>{e.style.display=e.style.display==="none"?"block":"none"}),o&&(o.onclick=()=>{e.style.display="none",r&&(r.value=""),d&&(d.textContent="",d.style.display="none")}),t&&(t.onclick=()=>{Vt()}),r&&(r.onchange=c=>{var u;const m=(u=c.target.files)==null?void 0:u[0];d&&(m?(d.textContent=m.name,d.style.display="block"):(d.textContent="",d.style.display="none"))}),a&&r&&!a.dataset.bound){a.dataset.bound="true";const c=m=>{m.preventDefault(),m.stopPropagation()};["dragenter","dragover"].forEach(m=>{a.addEventListener(m,u=>{c(u),a.classList.add("is-dragover")})}),["dragleave","dragend"].forEach(m=>{a.addEventListener(m,u=>{c(u),a.classList.remove("is-dragover")})}),a.addEventListener("dragover",m=>{c(m),m.dataTransfer&&(m.dataTransfer.dropEffect="copy"),a.classList.add("is-dragover")}),a.addEventListener("drop",async m=>{var v;c(m),a.classList.remove("is-dragover");const u=(v=m.dataTransfer)==null?void 0:v.files;if(!u||!u.length)return;const[y]=u;if(d&&(d.textContent=y.name,d.style.display="block"),r)try{const g=new DataTransfer;g.items.add(y),r.files=g.files}catch(g){console.warn("Unable to sync dropped file with input element:",g)}try{await Re(y)}catch(g){console.error("Error importing dropped .env file:",g)}}),a.addEventListener("click",()=>{r.click()}),l&&l.addEventListener("click",m=>{m.preventDefault(),r.click()})}s&&(s.onsubmit=async c=>{var u;c.preventDefault();const m=(u=r==null?void 0:r.files)==null?void 0:u[0];m&&await Re(m)})}async function Re(n){try{if(!n){p("No file detected for import","error");return}p(`Importing ${n.name||".env"}...`,"info");const e=(await n.text()).split(`
`),o={};e.forEach(a=>{if(a=a.trim(),a&&!a.startsWith("#")&&a.includes("=")){const[r,...l]=a.split("="),d=l.join("=").trim().replace(/^["']|["']$/g,"");r.trim()&&(o[r.trim()]=d)}}),te={...te,...o},await Ne(),document.getElementById("importEnvCard").style.display="none",document.getElementById("envFileInput").value="";const s=document.getElementById("envDropZoneFileName");s&&(s.textContent="",s.style.display="none"),p("Environment variables imported successfully!","success")}catch(t){console.error("Error importing .env file:",t),p("Failed to import .env file","error")}}function Rt(){const n=document.getElementById("envVarsList");if(n){if(Ce.length===0){n.innerHTML=`
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
        ${Ce.map((t,e)=>{const o=t.updated_at?new Date(t.updated_at).toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kathmandu"}):"Never updated",s=t.project_id?'<span style="font-size: 0.75rem; background: var(--primary); color: white; padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Project</span>':'<span style="font-size: 0.75rem; background: var(--bg-tertiary); color: var(--text-secondary); padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Global</span>';return`
            <tr>
              <td class="name-col">
                <span class="lock-icon">🔒</span>
                <span class="var-name">${B(t.key)}</span>
                ${s}
              </td>
              <td class="updated-col">
                <span class="updated-time">${o}</span>
              </td>
              <td class="actions-col">
                <button class="icon-btn edit-btn" onclick="editEnvVarModal('${B(t.key)}')" title="Edit">
                  ✏️
                </button>
                <button class="icon-btn delete-btn" onclick="deleteEnvVar('${B(t.key)}')" title="Delete">
                  🗑️
                </button>
              </td>
            </tr>
          `}).join("")}
      </tbody>
    </table>
  `}}function Vt(){De()}function De(n=null,t=""){const e=document.getElementById("envVarModal"),o=document.getElementById("modalVarKey"),s=document.getElementById("modalVarValue"),a=document.getElementById("modalTitle");n?(a.textContent="Update environment variable",o.value=n,o.readOnly=!0,s.value=t):(a.textContent="Add environment variable",o.value="",o.readOnly=!1,s.value=""),e.style.display="flex"}function Ge(){const n=document.getElementById("envVarModal");n.style.display="none"}async function Ht(){const n=document.getElementById("modalVarKey"),t=document.getElementById("modalVarValue"),e=n.value.trim(),o=t.value.trim();if(!e){p("Variable name is required","error");return}te[e]=o,await Ne(),Ge()}function Ye(n){const t=te[n]||"";De(n,t)}async function Ot(n){Ye(n)}async function qt(n){confirm(`Are you sure you want to delete ${n}?`)&&(delete te[n],await Ne(),p("Environment variable deleted","success"))}function zt(n){const e=document.querySelectorAll(".env-var-row")[n];if(!e)return;const o=e.querySelector(".env-var-value input");o.type==="password"?o.type="text":o.type="password"}async function Ne(){try{const n=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!i||!i.id){p("No project selected","error");return}(await fetch("/api/env-vars",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${n}`},body:JSON.stringify({variables:te,project_id:i.id})})).ok?(await Pe(),p("Environment variables saved successfully","success")):(console.error("Failed to save environment variables"),p("Failed to save environment variables","error"))}catch(n){console.error("Error saving environment variables:",n),p("Error saving environment variables","error")}}function Wt(){const n=document.getElementById("modalVarValue"),t=document.querySelector('#envVarModal button[onclick*="toggleModalValueVisibility"]');n&&t&&(n.type==="password"?(n.type="text",t.textContent="🙈 Hide"):(n.type="password",t.textContent="👁️ Show"))}function B(n){const t=document.createElement("div");return t.textContent=n,t.innerHTML}async function Ke(){try{const n=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!n)return;const t=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${n}`}});if(t.ok){const e=await t.json(),o=document.getElementById("userName"),s=document.getElementById("userEmail"),a=document.getElementById("userAvatar");localStorage.setItem("displayName",e.display_name||""),localStorage.setItem("userEmail",e.email||""),o&&(o.textContent=e.display_name||e.username||"User"),en(e.display_name||e.username||"User");const r=document.getElementById("sidebarSearch");if(r){const l=r.value.trim();(l===(e.username||"")||l===(e.display_name||""))&&(r.value="")}s&&(s.textContent=e.email||"Logged in"),a&&(e.avatar_url?(a.style.backgroundImage=`url(${e.avatar_url})`,a.style.backgroundSize="cover",a.style.backgroundPosition="center",a.textContent=""):(a.style.backgroundImage="",a.textContent=(e.display_name||e.username||"U").charAt(0).toUpperCase()))}else t.status===401&&(localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),ve())}catch(n){console.error("Error loading user profile:",n)}}async function Ze(){try{const n=localStorage.getItem("access_token")||localStorage.getItem("authToken"),t=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${n}`}});if(t.ok){const e=await t.json(),o=document.getElementById("username"),s=document.getElementById("email"),a=document.getElementById("displayName");o&&(o.value=e.username||""),s&&(s.value=e.email||""),a&&(a.value=e.display_name||"");const r=document.getElementById("avatarPreview"),l=document.getElementById("avatarInitial"),d=document.getElementById("removeAvatarBtn");if(e.avatar_url&&r)r.src=e.avatar_url,r.style.display="block",l&&(l.style.display="none"),d&&(d.style.display="block");else if(l){const c=e.display_name&&e.display_name.charAt(0).toUpperCase()||e.username&&e.username.charAt(0).toUpperCase()||"S";l.textContent=c,l.style.display="block"}}}catch(n){console.error("Error loading profile:",n)}Gt()}function Gt(){const n=document.getElementById("profileForm"),t=document.getElementById("avatarFile"),e=document.getElementById("removeAvatarBtn");n&&n.addEventListener("submit",Xt),t&&t.addEventListener("change",Jt),e&&e.addEventListener("click",Qt);const o=document.getElementById("changePasswordBtn"),s=document.getElementById("closePasswordModal"),a=document.getElementById("cancelPasswordBtn"),r=document.getElementById("updatePasswordBtn"),l=document.getElementById("passwordModal"),d=document.getElementById("modalNewPassword"),c=document.getElementById("strengthFill");o&&o.addEventListener("click",()=>{l&&(l.style.display="flex")}),s&&s.addEventListener("click",()=>{l&&(l.style.display="none")}),a&&a.addEventListener("click",()=>{l&&(l.style.display="none")}),l&&l.addEventListener("click",y=>{y.target===l&&(l.style.display="none")}),d&&d.addEventListener("input",y=>{const v=y.target.value;let g=0;v.length>=8&&(g+=25),/[a-z]/.test(v)&&/[A-Z]/.test(v)&&(g+=25),/\d/.test(v)&&(g+=25),/[!@#$%^&*(),.?":{}|<>]/.test(v)&&(g+=25),c&&(c.style.width=`${g}%`,g<50?c.style.background="#ef4444":g<75?c.style.background="#f59e0b":c.style.background="#10b981")}),r&&r.addEventListener("click",Zt);const m=document.getElementById("cancelProfileBtn");m&&m.addEventListener("click",async()=>{await Ze()});const u=document.getElementById("deleteAccountBtn");u&&u.addEventListener("click",async()=>{await Yt()})}async function Yt(){if(await Kt())try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t){p("You must be logged in to delete your account","error");return}const e=document.getElementById("deleteAccountBtn");e&&(e.disabled=!0,e.textContent="Deleting Account...");const o=await fetch("/api/user/account",{method:"DELETE",headers:{Authorization:`Bearer ${t}`}}),s=await o.json();o.ok?(p("Account deleted successfully","success"),localStorage.clear(),setTimeout(()=>{window.location.href="/login"},2e3)):(p(s.detail||s.message||"Failed to delete account","error"),e&&(e.disabled=!1,e.textContent="Delete Account"))}catch(t){console.error("Error deleting account:",t),p("Network error. Please try again.","error");const e=document.getElementById("deleteAccountBtn");e&&(e.disabled=!1,e.textContent="Delete Account")}}function Kt(){return new Promise(n=>{const t=document.createElement("div");t.style.cssText=`
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
    `;const e=document.createElement("div");e.style.cssText=`
      background: white;
      border-radius: 12px;
      padding: 2rem;
      max-width: 480px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `,e.innerHTML=`
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
    `,t.appendChild(e),document.body.appendChild(t),e.querySelector("#cancelDeleteBtn").addEventListener("click",()=>{document.body.removeChild(t),n(!1)}),e.querySelector("#confirmDeleteBtn").addEventListener("click",()=>{document.body.removeChild(t),n(!0)}),t.addEventListener("click",r=>{r.target===t&&(document.body.removeChild(t),n(!1))});const a=r=>{r.key==="Escape"&&(document.body.removeChild(t),document.removeEventListener("keydown",a),n(!1))};document.addEventListener("keydown",a)})}async function Zt(){const n=document.getElementById("modalCurrentPassword"),t=document.getElementById("modalNewPassword"),e=document.getElementById("modalConfirmPassword"),o=document.getElementById("passwordModal");if(!n||!t||!e)return;const s=n.value,a=t.value,r=e.value;if(!s||!a||!r){p("Please fill in all password fields","error");return}if(a!==r){p("New passwords do not match","error");return}if(a.length<8){p("Password must be at least 8 characters","error");return}try{const l=localStorage.getItem("access_token")||localStorage.getItem("authToken"),d=new FormData;d.append("current_password",s),d.append("new_password",a);const c=await fetch("/api/user/profile",{method:"PUT",headers:{Authorization:`Bearer ${l}`},body:d}),m=await c.json();if(c.ok){p("Password updated successfully!","success"),o&&(o.style.display="none"),n.value="",t.value="",e.value="";const u=document.getElementById("strengthFill");u&&(u.style.width="0%")}else p(m.detail||m.message||"Failed to update password","error")}catch(l){console.error("Error updating password:",l),p("Network error. Please try again.","error")}}function Jt(n){const t=n.target.files[0];if(t){const e=new FileReader;e.onload=o=>{const s=document.getElementById("avatarPreview"),a=document.getElementById("avatarInitial");s&&(s.src=o.target.result,s.style.display="block"),a&&(a.style.display="none");const r=document.getElementById("removeAvatarBtn");r&&(r.style.display="block")},e.readAsDataURL(t)}}function Qt(){const n=document.getElementById("avatarPreview"),t=document.getElementById("avatarInitial");n&&(n.src="",n.style.display="none"),t&&(t.style.display="block");const e=document.getElementById("removeAvatarBtn");e&&(e.style.display="none");const o=document.getElementById("avatarFile");o&&(o.value="")}async function Xt(n){n.preventDefault();const t=document.getElementById("profileMessage");t&&(t.style.display="none");const e=new FormData,o=document.getElementById("email"),s=document.getElementById("displayName");o&&e.append("email",o.value),s&&e.append("display_name",s.value);const a=document.getElementById("avatarFile");a&&a.files[0]&&e.append("avatar",a.files[0]);const r=document.getElementById("avatarPreview");r&&r.style.display==="none"&&e.append("remove_avatar","true");try{const l=localStorage.getItem("access_token")||localStorage.getItem("authToken"),d=await fetch("/api/user/profile",{method:"PUT",headers:{Authorization:`Bearer ${l}`},body:e}),c=await d.json();if(d.ok)t&&(t.textContent="Profile updated successfully!",t.className="profile-message success",t.style.display="block"),c.username&&localStorage.setItem("username",c.username),await Ke(),p("Profile updated successfully!","success");else{const m=c.detail||c.message||"Failed to update profile";t&&(t.textContent=m,t.className="profile-message error",t.style.display="block"),p(m,"error"),console.error("Profile update failed:",c)}}catch(l){console.error("Error updating profile:",l),t&&(t.textContent="Network error. Please try again.",t.className="profile-message error",t.style.display="block"),p("Network error. Please try again.","error")}}window.destroyDeployment=Dt;window.selectRepository=Ut;window.importRepository=Mt;window.editEnvVar=Ot;window.deleteEnvVar=qt;window.toggleEnvVarVisibility=zt;window.saveEnvVarFromModal=Ht;window.closeEnvVarModal=Ge;window.toggleModalValueVisibility=Wt;window.editEnvVarModal=Ye;window.showEnvVarModal=De;window.selectProject=je;window.showProjectSidebar=Ie;window.hideProjectSidebar=ft;window.openProject=xt;window.loadUserProfileIntoProjectSidebar=qe;window.openProjectSite=ut;window.deleteProject=Xe;window.toggleRepositorySelection=Nt;window.confirmSplitImport=At;window.openProjectNameModal=He;window.openSite=bt;function en(n){const t=document.getElementById("teamName");t&&(t.textContent=`${n}'s team`),document.querySelectorAll(".project-owner").forEach(o=>{o.textContent=`${n}'s team`})}let H=null,se=!1,Z=[];function tn(n){if(n==null)return null;if(typeof n!="string")return n;const t=n.trim();if(!t)return null;const e=t.indexOf("{");if(e===-1)return{message:t};const o=t.slice(e);try{return JSON.parse(o)}catch{return{message:t}}}function nn(){const n=document.getElementById("logsContent");n&&(n.innerHTML='<p class="logs-connecting">Connecting to WebSocket...</p>',Je(),on())}function Je(){H&&H.close();const t=`${window.location.protocol==="https:"?"wss:":"ws:"}//${window.location.host}/ws/logs`;H=new WebSocket(t),H.onopen=()=>{console.log("Logs WebSocket connected"),K("Connected to logs stream","success"),Z.length>0&&(Z.forEach(e=>K(e.message,e.type)),Z=[])},H.onmessage=e=>{const o=tn(e.data);!o||!o.message||(se?Z.push({message:o.message,type:o.type||"info"}):K(o.message,o.type||"info"))},H.onerror=e=>{console.error("Logs WebSocket error:",e),K("WebSocket connection error","error")},H.onclose=()=>{console.log("Logs WebSocket disconnected"),K("Disconnected from logs stream","warning"),setTimeout(()=>{var e;((e=document.getElementById("page-logs"))==null?void 0:e.style.display)!=="none"&&Je()},3e3)}}function K(n,t="info"){const e=document.getElementById("logsContent");if(!e)return;const o=new Date().toLocaleString("en-US",{timeZone:"Asia/Kathmandu",timeStyle:"medium",dateStyle:"short"}),s=document.createElement("div");s.className=`log-entry ${t}`,s.innerHTML=`
    <span class="log-timestamp">[${o}]</span>
    <span class="log-message">${B(n)}</span>
  `,e.appendChild(s),e.scrollTop=e.scrollHeight;const a=1e3,r=e.querySelectorAll(".log-entry");r.length>a&&r[0].remove()}function on(){const n=document.getElementById("clearLogsBtn"),t=document.getElementById("toggleLogsBtn");n&&n.addEventListener("click",()=>{const e=document.getElementById("logsContent");e&&(e.innerHTML="",Z=[],K("Logs cleared","info"))}),t&&t.addEventListener("click",()=>{se=!se,t.textContent=se?"Resume":"Pause",!se&&Z.length>0&&(Z.forEach(e=>K(e.message,e.type)),Z=[]),K(se?"Logs paused":"Logs resumed","info")})}window.addEventListener("beforeunload",()=>{H&&H.close(),A&&A.close()});let A=null,ue=!1,Ee=[];function sn(){document.querySelectorAll(".page").forEach(t=>{t.style.display="none"});const n=document.getElementById("page-deployment-logs");if(n){n.style.display="block",document.getElementById("pageTitle").textContent="Deployment Logs";const t=document.getElementById("deploymentLogsContent");t&&(t.innerHTML='<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Connecting to deployment stream... Logs will appear here.</p>');const e=document.getElementById("deployment-status-badge"),o=document.getElementById("deployment-status-text");e&&(e.className="status-badge status-info"),o&&(o.textContent="Deploying...")}}function an(){A&&A.close();const n=window.location.protocol==="https:"?"wss:":"ws:",t=`deploy-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,e=`${n}//${window.location.host}/ws/${t}`;A=new WebSocket(e),A.onopen=()=>{console.log("Deployment logs WebSocket connected"),O("Connected to deployment stream","success")},A.onmessage=o=>{try{const s=JSON.parse(o.data);s.message&&(O(s.message,s.type||"info"),s.message.includes("Deployment successful")||s.message.includes("🎉")?ae("success","Deployment Successful"):s.message.includes("failed")||s.message.includes("❌")?ae("error","Deployment Failed"):(s.message.includes("Deploying")||s.message.includes("🚀"))&&ae("info","Deploying..."))}catch{O(o.data,"info")}},A.onerror=o=>{console.error("Deployment logs WebSocket error:",o),O("WebSocket connection error","error")},A.onclose=()=>{console.log("Deployment logs WebSocket disconnected"),O("Disconnected from deployment stream","warning")}}function O(n,t="info"){const e=document.getElementById("deploymentLogsContent");if(!e)return;e.querySelector('p[style*="text-align: center"]')&&(e.innerHTML="");const o=document.createElement("div");o.className=`log-entry log-${t}`,o.style.cssText="padding: 0.5rem; border-bottom: 1px solid var(--border-light); font-family: monospace; font-size: 0.875rem;";const s=new Date().toLocaleTimeString();o.innerHTML=`<span style="color: var(--text-secondary); margin-right: 0.5rem;">[${s}]</span><span>${B(n)}</span>`,e.appendChild(o),e.scrollTop=e.scrollHeight}function ae(n,t){const e=document.getElementById("deployment-status-badge"),o=document.getElementById("deployment-status-text");e&&(e.className=`status-badge status-${n}`),o&&(o.textContent=t)}function rn(n){A&&(A.close(),A=null),document.querySelectorAll(".page").forEach(s=>{s.style.display="none"});const t=document.getElementById("page-deployment-success");if(t){t.style.display="block",document.getElementById("pageTitle").textContent="Deployment Successful";const s=(i==null?void 0:i.name)||n.project_name||"Untitled Project",a=n.deployed_url||"";if(document.getElementById("success-project-name").textContent=s,document.getElementById("success-deployed-url").textContent=a||"Not available",document.getElementById("success-status").textContent="Running",a){const l=document.getElementById("website-preview");l&&(l.src=a);const d=document.getElementById("open-deployed-site-btn");d&&(d.onclick=()=>{window.open(a,"_blank")})}else{const l=document.getElementById("website-preview-container");l&&(l.style.display="none")}const r=document.getElementById("view-projects-btn");r&&(r.onclick=()=>{U.navigate("/applications"),V()})}const e=document.getElementById("clearDeploymentLogsBtn"),o=document.getElementById("toggleDeploymentLogsBtn");e&&(e.onclick=()=>{const s=document.getElementById("deploymentLogsContent");s&&(s.innerHTML="")}),o&&(o.onclick=()=>{ue=!ue,o.textContent=ue?"Resume":"Pause",!ue&&Ee.length>0&&(Ee.forEach(s=>O(s.message,s.type)),Ee=[])})}function ln(){const n=document.getElementById("sidebarSearch"),t=document.getElementById("commandPalette"),e=document.getElementById("commandSearchInput"),o=document.querySelectorAll(".command-item");let s=-1;function a(){t&&(t.style.display="flex",e&&(e.focus(),e.value=""),s=-1,l())}function r(){t&&(t.style.display="none",s=-1)}function l(){const c=Array.from(o).filter(m=>m.style.display!=="none");o.forEach((m,u)=>{c.indexOf(m)===s?(m.classList.add("selected"),m.scrollIntoView({block:"nearest",behavior:"smooth"})):m.classList.remove("selected")})}function d(c){switch(r(),c){case"deploy":case"nav-deploy":window.router&&window.router.navigate("/deploy");break;case"add-env-var":window.showEnvVarModal&&window.showEnvVarModal();break;case"search-repos":case"nav-repositories":window.router&&window.router.navigate("/repositories");break;case"nav-projects":window.router&&window.router.navigate("/");break;case"nav-applications":window.router&&window.router.navigate("/applications");break;case"nav-history":window.router&&window.router.navigate("/history");break;case"nav-env-vars":window.router&&window.router.navigate("/env-vars");break;case"nav-settings":window.router&&window.router.navigate("/settings");break}}document.addEventListener("keydown",c=>{var m;if((c.metaKey||c.ctrlKey)&&c.key==="k"&&(c.preventDefault(),t&&t.style.display==="none"?a():r()),c.key==="Escape"&&t&&t.style.display!=="none"&&r(),t&&t.style.display!=="none"){const u=Array.from(o).filter(y=>y.style.display!=="none");if(c.key==="ArrowDown")c.preventDefault(),s=Math.min(s+1,u.length-1),l();else if(c.key==="ArrowUp")c.preventDefault(),s=Math.max(s-1,-1),l();else if(c.key==="Enter"&&s>=0){c.preventDefault();const v=(m=Array.from(o).filter(g=>g.style.display!=="none")[s])==null?void 0:m.getAttribute("data-action");v&&d(v)}}}),n&&n.addEventListener("click",a),t&&t.addEventListener("click",c=>{c.target===t&&r()}),o.forEach(c=>{c.addEventListener("click",()=>{const m=c.getAttribute("data-action");m&&d(m)})}),e&&e.addEventListener("input",c=>{const m=c.target.value.toLowerCase();o.forEach(u=>{u.querySelector(".command-text").textContent.toLowerCase().includes(m)?u.style.display="flex":u.style.display="none"}),s=-1,l()})}
