import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */class et{constructor(){this.routes={"/":"projects","/deploy":"deploy","/history":"history","/repositories":"repositories","/domain":"domain","/env-vars":"env-vars","/settings":"settings","/logs":"logs"},this.currentPage=null,this.init()}init(){document.querySelectorAll(".nav-item").forEach(t=>{t.addEventListener("click",n=>{n.preventDefault();const o=t.getAttribute("href");this.navigate(o)})}),window.addEventListener("popstate",()=>{this.loadPage(window.location.pathname)}),this.loadPage(window.location.pathname)}navigate(t){window.history.pushState({},"",t),this.loadPage(t)}loadPage(t){const n=this.routes[t]||"dashboard";if(n==="deploy"){r=null;const o=document.getElementById("projectSidebar");o&&(o.style.display="none");const s=document.getElementById("sidebar");s&&(s.style.display="block")}this.showPage(n),this.updateActiveNav(t),this.updatePageTitle(n),window.scrollTo({top:0,behavior:"smooth"})}showPage(t){document.querySelectorAll(".page").forEach(o=>{o.style.display="none"});const n=document.getElementById(`page-${t}`);if(n){if(n.style.display="block",t==="deploy"){const o=document.getElementById("deploy-status"),s=document.getElementById("deploy-success");o&&(o.textContent="",o.style.color=""),s&&(s.style.display="none")}}else{const o=document.getElementById("page-dashboard");o&&(o.style.display="block")}this.currentPage=t,this.loadPageData(t)}updateActiveNav(t){document.querySelectorAll(".nav-item").forEach(n=>{n.classList.remove("active"),n.getAttribute("href")===t&&n.classList.add("active")})}updatePageTitle(t){const n={projects:"Projects",deploy:"Deploy",history:"History",repositories:"Repositories",domain:"Domain","env-vars":"Environmental Variables",settings:"Settings",logs:"Logs"};document.getElementById("pageTitle").textContent=n[t]||"Dashboard"}loadPageData(t){switch(t){case"dashboard":Be();break;case"projects":O(),Be();break;case"history":_e();break;case"repositories":Gt();break;case"domain":ut();break;case"env-vars":Pe();break;case"settings":Qe();break}}}const U=new et;window.router=U;async function tt(e){const t=await st();if(!t)return;const n=P.find(a=>a.id==e),o=n?n.name:"this project";if(await nt(o))try{console.log("Deleting project with token:",t.substring(0,20)+"...");const a=await fetch(`/projects/${e}`,{method:"DELETE",headers:{Authorization:`Bearer ${t}`}});if(console.log("Delete response status:",a.status),!a.ok){const i=await a.json().catch(()=>({}));if(console.error("Delete error response:",i),a.status===401){p("Session expired. Please login again.","error"),localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),setTimeout(()=>{window.location.href="/login"},2e3);return}throw new Error(i.detail||"Failed to delete project")}P=P.filter(i=>i.id!=e),z=z.filter(i=>i.id!=e),X(z),p("Project deleted","success")}catch(a){console.error("Delete project error:",a),p(`Delete failed: ${a.message}`,"error")}}function nt(e){return new Promise(t=>{const n=document.createElement("div");n.className="modal-overlay";const o=document.createElement("div");o.className="delete-confirmation-modal",o.innerHTML=`
      <h3>Delete Project</h3>
      <p>
        Are you sure you want to delete <strong>${b(e)}</strong>?<br>
        This will stop the process and remove the project.
      </p>
      <div class="delete-confirmation-actions">
        <button class="cancel-btn">Cancel</button>
        <button class="delete-btn">Delete</button>
      </div>
    `,n.appendChild(o),document.body.appendChild(n);const s=o.querySelector(".cancel-btn"),a=o.querySelector(".delete-btn"),i=()=>{document.body.removeChild(n)};s.onclick=()=>{i(),t(!1)},a.onclick=()=>{i(),t(!0)},n.onclick=l=>{l.target===n&&(i(),t(!1))},a.focus()})}function ot(e){try{const n=JSON.parse(atob(e.split(".")[1])).exp*1e3,o=Date.now();return n<o+5*60*1e3}catch{return!0}}async function st(){const e=localStorage.getItem("access_token")||localStorage.getItem("authToken");return!e||ot(e)?(p("Session expired. Please login again.","error"),localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),setTimeout(()=>{window.location.href="/login"},2e3),null):e}let ne=localStorage.getItem("access_token")||localStorage.getItem("authToken"),ge=localStorage.getItem("username");document.addEventListener("DOMContentLoaded",()=>{const e=document.getElementById("sidebarSearch");e&&(e.value="",e.setAttribute("autocomplete","off")),he(),window.location.pathname==="/login"||window.location.pathname.includes("login.html")||setTimeout(()=>{if(ne&&ge){at(),fn();const n=document.getElementById("sidebarSearch");n&&n.value===ge&&(n.value="");const o=document.getElementById("page-projects");o&&window.location.pathname==="/"&&(o.style.display="block")}},100)});function he(){const e=document.getElementById("userSection"),t=document.getElementById("authButtons"),n=document.getElementById("logoutBtn"),o=document.getElementById("newDeployBtn");document.getElementById("userName"),document.getElementById("userEmail"),document.getElementById("userAvatar");const s=window.location.pathname==="/login"||window.location.pathname.includes("login.html");ne&&ge?(e.style.display="flex",t.style.display="none",n.style.display="block",o.style.display="block",Je(),O(),s&&(window.location.href="/")):(e.style.display="none",t.style.display="block",n.style.display="none",o.style.display="none",s||(window.location.href="/login"))}function at(){var a,i;document.getElementById("logoutBtn").addEventListener("click",()=>{localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),ne=null,ge=null,he(),p("Logged out successfully","success"),U.navigate("/")});const e=document.getElementById("projectsSearch");e&&e.addEventListener("input",l=>{const d=l.target.value.toLowerCase();z=P.filter(c=>c.name.toLowerCase().includes(d)||c.repository&&c.repository.toLowerCase().includes(d)),X(z)});const t=document.getElementById("addProjectBtn");t&&t.addEventListener("click",()=>{window.router&&window.router.navigate("/deploy")});const n=document.getElementById("browseUploadLink");n&&n.addEventListener("click",l=>{l.preventDefault(),window.router&&window.router.navigate("/deploy")}),document.getElementById("newDeployBtn").addEventListener("click",()=>{r=null;const l=document.getElementById("projectSidebar");l&&(l.style.display="none");const d=document.getElementById("sidebar");d&&(d.style.display="block"),vn()});const o=document.getElementById("deployForm");o&&o.addEventListener("submit",Mt),_t();const s=document.getElementById("deploy-type");s&&s.addEventListener("change",l=>{const d=document.getElementById("single-repo-group"),c=document.getElementById("git-url-section"),m=document.getElementById("split-deploy-layout"),u=document.getElementById("git-url");l.target.value==="split"?(d&&(d.style.display="none"),c&&(c.style.display="none"),m&&(m.style.display="block"),u&&u.removeAttribute("required")):(d&&(d.style.display="block"),c&&(c.style.display="block"),m&&(m.style.display="none"),u&&u.setAttribute("required","required"))}),(a=document.getElementById("clearHistoryBtn"))==null||a.addEventListener("click",Rt),(i=document.getElementById("searchReposBtn"))==null||i.addEventListener("click",Ge),it(),lt()}function it(){const e=document.querySelector(".search-input"),t=document.getElementById("spotlightModal"),n=document.getElementById("spotlightSearch"),o=document.getElementById("spotlightResults");!e||!t||!n||!o||(e.addEventListener("click",rt),t.addEventListener("click",s=>{s.target===t&&Ie()}),n.addEventListener("input",ct),o.addEventListener("click",pt),document.addEventListener("keydown",s=>{s.key==="Escape"&&t.style.display!=="none"&&Ie()}))}function rt(){const e=document.getElementById("spotlightModal"),t=document.getElementById("spotlightSearch");e.style.display="flex",setTimeout(()=>{t.focus()},100)}function Ie(){const e=document.getElementById("spotlightModal"),t=document.getElementById("spotlightSearch"),n=document.getElementById("spotlightResults");e.style.display="none",t.value="",n.innerHTML=`
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
  `}function lt(){const e=document.getElementById("domainWarningModal");if(!e||e.dataset.bound==="true")return;e.dataset.bound="true";const t=document.getElementById("domainModalCancelBtn"),n=document.getElementById("domainModalOpenConfigBtn"),o=()=>{e.style.display="none"};t&&t.addEventListener("click",o),n&&n.addEventListener("click",()=>{o(),Ce("domain-config"),qe()}),e.addEventListener("click",s=>{s.target===e&&o()})}function ct(e){const t=e.target.value.toLowerCase().trim(),n=document.getElementById("spotlightResults");if(!t){n.innerHTML=`
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
    `;return}const o=dt(t);mt(o)}function dt(e){const t={projects:[],actions:[],navigation:[]};P&&P.length>0&&(t.projects=P.filter(s=>s.name.toLowerCase().includes(e)||s.repository&&s.repository.toLowerCase().includes(e)));const n=[{name:"New Deploy",action:"new-deploy",icon:"🚀"},{name:"Repositories",action:"repositories",icon:"📁"},{name:"History",action:"history",icon:"📜"},{name:"Settings",action:"settings",icon:"⚙️"},{name:"Domain",action:"domain",icon:"🌐"}];t.actions=n.filter(s=>s.name.toLowerCase().includes(e));const o=[{name:"Projects",action:"projects",icon:"📊"},{name:"Repositories",action:"repositories",icon:"📁"},{name:"History",action:"history",icon:"📜"},{name:"Domain",action:"domain",icon:"🌐"},{name:"Settings",action:"settings",icon:"⚙️"}];return t.navigation=o.filter(s=>s.name.toLowerCase().includes(e)),t}function mt(e){const t=document.getElementById("spotlightResults");let n='<div class="search-results">';e.projects.length>0&&(n+='<div class="search-category">',n+='<div class="search-category-title">Projects</div>',e.projects.forEach(o=>{const s=o.status==="running"?"🚀":"📦",a=o.status==="running"?"RUNNING":o.status==="failed"?"FAILED":"IMPORTED";n+=`
        <div class="search-result-item" data-type="project" data-id="${o.id}">
          <span class="search-result-icon">${s}</span>
          <div class="search-result-content">
            <div class="search-result-title">${b(o.name)}</div>
            <div class="search-result-subtitle">${o.repository||"No repository"}</div>
          </div>
          <span class="search-result-badge">${a}</span>
        </div>
      `}),n+="</div>"),e.actions.length>0&&(n+='<div class="search-category">',n+='<div class="search-category-title">Actions</div>',e.actions.forEach(o=>{n+=`
        <div class="search-result-item" data-type="action" data-action="${o.action}">
          <span class="search-result-icon">${o.icon}</span>
          <div class="search-result-content">
            <div class="search-result-title">${o.name}</div>
          </div>
        </div>
      `}),n+="</div>"),e.navigation.length>0&&(n+='<div class="search-category">',n+='<div class="search-category-title">Navigation</div>',e.navigation.forEach(o=>{n+=`
        <div class="search-result-item" data-type="navigation" data-action="${o.action}">
          <span class="search-result-icon">${o.icon}</span>
          <div class="search-result-content">
            <div class="search-result-title">${o.name}</div>
          </div>
        </div>
      `}),n+="</div>"),e.projects.length===0&&e.actions.length===0&&e.navigation.length===0&&(n=`
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <p>No results found for "${b(document.getElementById("spotlightSearch").value)}"</p>
      </div>
    `),n+="</div>",t.innerHTML=n}function pt(e){const t=e.target.closest(".suggestion-item, .search-result-item");if(!t)return;const n=t.dataset.action,o=t.dataset.type,s=t.dataset.id;if(Ie(),o==="project"&&s)je(parseInt(s));else if(n)switch(n){case"new-deploy":window.router&&window.router.navigate("/deploy");break;case"repositories":window.router&&window.router.navigate("/repositories");break;case"history":window.router&&window.router.navigate("/history");break;case"domain":window.router&&window.router.navigate("/domain");break;case"settings":window.router&&window.router.navigate("/settings");break;case"projects":window.router&&window.router.navigate("/projects");break}}function ut(){document.getElementById("page-domain")}let ce=null;async function Be(){if(!(localStorage.getItem("access_token")||localStorage.getItem("authToken"))){const t=document.getElementById("vmStatusCard");t&&(t.style.display="none");return}try{const t=await fetch("/api/vm-status",{headers:N()});if(!t.ok){if(t.status===401){const o=document.getElementById("vmStatusCard");o&&(o.style.display="none");return}throw new Error("Failed to fetch VM status")}const n=await t.json();yt(n.vm_status,n.message),n.vm_status==="creating"?ce||(ce=setInterval(()=>{Be()},5e3)):ce&&(clearInterval(ce),ce=null)}catch(t){console.error("Error loading VM status:",t);const n=document.getElementById("vmStatusCard");n&&(n.style.display="none")}}function yt(e,t){Ue("vmStatusCard","vmStatusBadge","vmStatusDot","vmStatusText","vmStatusMessage","vmStatusDetails","dashboardActions",e,t),Ue("vmStatusCardProjects","vmStatusBadgeProjects","vmStatusDotProjects","vmStatusTextProjects","vmStatusMessageProjects","vmStatusDetailsProjects",null,e,t)}function Ue(e,t,n,o,s,a,i,l,d){const c=document.getElementById(e),m=document.getElementById(t),u=document.getElementById(n),y=document.getElementById(o),f=document.getElementById(s),g=document.getElementById(a),v=i?document.getElementById(i):null;c&&(c.style.display="block",f&&(f.textContent=d),l==="creating"?(m&&(m.className="status-badge creating"),u&&(u.className="status-dot creating"),y&&(y.textContent="Creating"),g&&(g.style.display="block",g.textContent="Estimated time remaining: 2-5 minutes"),v&&(v.style.display="none")):l==="ready"?(m&&(m.className="status-badge running"),u&&(u.className="status-dot running"),y&&(y.textContent="Running"),g&&(g.style.display="none"),v&&(v.style.display="grid")):l==="failed"?(m&&(m.className="status-badge failed"),u&&(u.className="status-dot failed"),y&&(y.textContent="Failed"),g&&(g.style.display="block",g.textContent="Please check that OrbStack is installed and running, then try again."),v&&(v.style.display="grid")):(m&&(m.className="status-badge creating"),u&&(u.className="status-dot creating"),y&&(y.textContent="Checking"),g&&(g.style.display="none"),v&&(v.style.display="none")))}function N(){const e={},t=localStorage.getItem("access_token")||localStorage.getItem("authToken");return t&&(e.Authorization=`Bearer ${t}`),e}let P=[],z=[];async function O(){const e=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!e){X([]);return}ft();try{const t=await fetch("/deployments",{headers:{Authorization:`Bearer ${e}`}});t.ok?(P=(await t.json()).map(o=>{var W;const s=o.git_url||"",a=s,i=s?(W=String(s).split("/").pop())==null?void 0:W.replace(/\.git$/,""):null,l=o.app_name||i||o.container_name||"Untitled Project",d=(o.status||"").toLowerCase();let c;d==="running"?c="running":d==="failed"||d==="error"?c="failed":c="imported";let m=!1,u="single",y=null,f=null;const g=String(o.git_url||""),v=g.startsWith("split::"),S=!o.parent_project_id&&!o.component_type;if(v){m=!0,u="split";try{const $=g.replace("split::","").split("|");$.length===2&&(y=$[0],f=$[1])}catch{}}else if(d==="imported_split")m=!0,u="split";else if(S&&g.includes("|")){m=!0,u="split";try{const $=g.split("|");$.length===2&&(y=$[0],f=$[1])}catch{}}const J=o.custom_domain&&o.domain_status&&o.domain_status.toLowerCase()==="active"?`https://${o.custom_domain}`:o.deployed_url||o.app_url||null;return{id:o.id,name:l,status:c,url:J,createdAt:o.created_at,updatedAt:o.updated_at,repository:a,repository_url:a,git_url:s,project_type:u,isSplit:m,frontend_url:y,backend_url:f,processPid:o.process_pid||null,port:o.port||null,startCommand:o.start_command||null,buildCommand:o.build_command||null,isRunning:o.is_running||!1,custom_domain:o.custom_domain||null,domain_status:o.domain_status||null,last_domain_sync:o.last_domain_sync||null}}),z=[...P],X(z)):X([])}catch(t){console.error("Error loading projects:",t),X([])}}function X(e){const t=document.getElementById("projectsGrid");if(t){if(e.length===0){t.innerHTML=`
      <div class="empty-state">
        <p>No projects found</p>
        <button class="btn-primary" onclick="if(window.router){window.router.navigate('/deploy');}else{window.location.href='/deploy';}">Create First Project</button>
      </div>
    `;return}t.innerHTML=e.map(n=>{const o=n.status==="running"?"status-success":n.status==="failed"?"status-error":"status-info",s=n.status==="running"?"Running":n.status==="failed"?"Failed":"Imported",a=n.status==="running"?"🚀":"📦",i=n.updatedAt?ee(n.updatedAt):"Recently";return`
      <div class="project-card" data-project-id="${n.id}" onclick="selectProject(${n.id})">
        <div class="project-header">
          <div class="project-icon">${a}</div>
          <div class="project-status ${o}">${s}</div>
          </div>
        
        <div class="project-info">
          <h3 class="project-name">${b(n.name)}</h3>
          <div class="project-meta">
            <svg class="icon-clock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12,6 12,12 16,14"></polyline>
            </svg>
            <span>Updated ${i}</span>
        </div>
          
                 ${n.status==="running"?`
                 <div class="project-metrics">
                   ${n.port?`
                   <div class="metric">
                     <span class="metric-label">Port</span>
                     <span class="metric-value">${n.port}</span>
                   </div>
                   `:""}
                   ${n.processPid?`
                   <div class="metric">
                     <span class="metric-label">PID</span>
                     <span class="metric-value">${n.processPid}</span>
                   </div>
                   `:""}
            </div>
            `:""}
            </div>
        
        <div class="project-footer">
          ${n.status==="running"&&n.url?`
          <button class="btn-dark btn-block btn-open-site" onclick="event.stopPropagation(); openProjectSite(${n.id})">Open Site</button>
          `:""}
          <button class="btn-icon btn-danger btn-delete" title="Delete project" onclick="event.stopPropagation(); deleteProject(${n.id})">
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
      `}).join("")}}async function gt(e){try{const t=P.find(o=>o.id===e);if(!t){p("Project not found","error");return}const n=ze(t.url);if(!n){p("Project URL not available. Make sure the project is deployed.","error");return}window.open(n,"_blank"),p(`Opening ${t.name}...`,"info")}catch(t){console.error("Error opening project site:",t),p("Failed to open project site: "+t.message,"error")}}function ft(){const e=document.getElementById("projectsGrid");e&&(e.innerHTML=`
    <div class="loading-skeleton">
      ${Array(3).fill(`
        <div class="skeleton-card">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line short"></div>
        </div>
      `).join("")}
    </div>
  `)}let r=null;function je(e){O().then(()=>{const n=P.find(o=>o.id==e);if(!n){const o=z.find(s=>s.id==e);o&&(r=o,Se(o));return}r=n,Se(n)});const t=document.getElementById("page-project-config");t&&t.style.display!=="none"&&Le()}function Se(e){const t=document.getElementById("sidebar");t&&(t.style.display="none");let n=document.getElementById("projectSidebar");n||(n=vt(),document.body.appendChild(n));const o=n.querySelector("#projectSidebarName");o&&(o.textContent=e.name);const s=n.querySelector("#projectSidebarId");s&&(s.textContent=e.id);const a=n.querySelector('a[data-project-page="status"]');a&&(e.project_type==="split"?a.style.display="flex":a.style.display="none"),n.style.display="block",document.getElementById("pageTitle").textContent=e.name,We(),Ce("deploy")}function vt(){const e=document.createElement("aside");return e.id="projectSidebar",e.className="sidebar project-sidebar",e.innerHTML=`
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
      <a href="#" class="nav-item project-nav-item" data-project-page="logs">
        <span class="nav-icon">📋</span>
        <span class="nav-label">Logs</span>
      </a>
      <a href="#" class="nav-item project-nav-item" data-project-page="files">
        <span class="nav-icon">📁</span>
        <span class="nav-label">Files</span>
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
  `,e.querySelectorAll(".project-nav-item").forEach(t=>{t.addEventListener("click",async n=>{n.preventDefault();const o=t.getAttribute("data-project-page");if(await O(),r){const s=P.find(a=>a.id===r.id);s&&(r=s)}Ce(o),e.querySelectorAll(".project-nav-item").forEach(s=>s.classList.remove("active")),t.classList.add("active")})}),e}function ht(){const e=document.getElementById("projectSidebar");e&&(e.style.display="none");const t=document.getElementById("sidebar");t&&(t.style.display="block"),r=null,document.getElementById("pageTitle").textContent="Projects",document.querySelectorAll(".page").forEach(o=>{o.style.display="none"});const n=document.getElementById("page-projects");n&&(n.style.display="block"),O()}function Ce(e){switch(document.querySelectorAll(".page").forEach(t=>{t.style.display="none"}),e){case"deploy":const t=document.getElementById("page-deploy");if(t){t.style.display="block";const o=document.getElementById("deploy-status"),s=document.getElementById("deploy-success");o&&(o.textContent="",o.style.color=""),s&&(s.style.display="none");const a=document.getElementById("deploy-page-title"),i=document.getElementById("deploy-card-title"),l=document.getElementById("deploy-description");if(r){a&&(a.textContent=r.name||"Project"),i&&(i.textContent=r.name||"Project"),l&&(l.textContent="Update deployment settings and redeploy your project.");const w=document.getElementById("import-info"),L=document.getElementById("import-repo-name"),T=r.git_url||r.repository_url||"",x=document.getElementById("git-url");if(x&&T&&(x.value=T,console.log("Populated Git URL input in showProjectContent:",T),x.removeAttribute("required")),T&&w&&L)try{const E=T.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git|[/]|$)/);if(E){const I=E[1],j=E[2];L.textContent=`${I}/${j}`,w.style.display="flex";const B=document.getElementById("branch-badge"),F=document.getElementById("branch-name");B&&F&&(B.style.display="flex",F.textContent="main")}}catch(E){console.warn("Failed to parse GitHub URL:",E)}else w&&(w.style.display="none");console.log("showProjectContent - currentProject:",{id:r.id,name:r.name,git_url:r.git_url,repository_url:r.repository_url,gitUrl:T}),Ut(r.id,T)}else{a&&(a.textContent="New Project"),i&&(i.textContent="New Project"),l&&(l.textContent="Choose where you want to create the project and give it a name.");const w=document.getElementById("import-info");w&&(w.style.display="none")}const d=document.getElementById("project-components-section");d&&(d.style.display="none"),document.getElementById("deploy-type");const c=document.getElementById("deploy-type-group"),m=document.getElementById("single-repo-group"),u=document.getElementById("git-url-section"),y=document.getElementById("split-deploy-layout"),f=document.getElementById("git-url"),g=document.getElementById("project-name"),v=document.getElementById("framework-preset"),S=document.getElementById("root-directory"),q=document.getElementById("install-command"),J=document.getElementById("build-command"),W=document.getElementById("start-command"),$=document.getElementById("port"),M=document.getElementById("frontend-url"),h=document.getElementById("backend-url"),C=document.getElementById("deploy-submit-default"),ie=document.getElementById("edit-root-directory-btn");ie&&S&&(ie.onclick=()=>{S.removeAttribute("readonly"),S.focus(),S.select()});let D=r==null?void 0:r.project_type;const re=(r==null?void 0:r.git_url)||(r==null?void 0:r.repository_url)||"",oe=re.startsWith("split::");if(D||(r!=null&&r.isSplit||oe?D="split":D="single"),oe&&D!=="split"?D="split":!oe&&D==="split"&&re&&(D="single"),r){if(c&&(c.style.display="none"),g&&(g.value=r.name||r.app_name||""),v){const w=r.buildCommand||r.build_command||"",L=r.startCommand||r.start_command||"";w.includes("next build")||L.includes("next start")?v.value="nextjs":w.includes("react-scripts")||L.includes("react-scripts")?v.value="react":L.includes("vue")||w.includes("vue")?v.value="vue":L.includes("flask")||w.includes("flask")?v.value="flask":L.includes("django")||w.includes("django")?v.value="django":L.includes("python")||w.includes("python")?v.value="python":L.includes("node")||w.includes("npm")?v.value="nodejs":v.value="auto"}if(S&&(S.value="./"),J&&(J.value=r.buildCommand||r.build_command||""),W&&(W.value=r.startCommand||r.start_command||""),$&&($.value=r.port||""),q&&!q.value){const w=(v==null?void 0:v.value)||"auto";["nextjs","react","vue","nodejs"].includes(w)?q.placeholder="npm install":["python","flask","django"].includes(w)&&(q.placeholder="pip install -r requirements.txt")}if(D==="split"){m&&(m.style.display="none"),y&&(y.style.display="block"),M&&(M.value=r.frontend_url||""),h&&(h.value=r.backend_url||""),f&&f.removeAttribute("required"),C&&(C.style.display="none");const w=document.getElementById("deploy-frontend-btn"),L=document.getElementById("deploy-backend-btn"),T=document.getElementById("deploy-both-btn");w&&(w.onclick=async()=>{var j,B,F,G;const x=(j=M==null?void 0:M.value)==null?void 0:j.trim();if(!x||!x.startsWith("http"))return p("Enter a valid frontend URL","error");const E=we(!1);document.getElementById("step-frontend").style.display="flex",E.updateFrontendStatus("deploying","Deploying your frontend now..."),(B=document.getElementById("build-command"))!=null&&B.value.trim(),(F=document.getElementById("start-command"))!=null&&F.value.trim(),(G=document.getElementById("port"))!=null&&G.value.trim();const I=await Fe(x,"frontend",E,!0);I&&I.success&&I.deployed_url?(E.showUrls(I.deployed_url,null),document.getElementById("close-deployment-dialog").onclick=()=>{E.close(),ye(),de()}):I&&!I.success&&setTimeout(()=>E.close(),3e3)}),L&&(L.onclick=async()=>{var j,B,F,G;const x=(j=h==null?void 0:h.value)==null?void 0:j.trim();if(!x||!x.startsWith("http"))return p("Enter a valid backend URL","error");const E=we(!1);document.getElementById("step-backend").style.display="flex",E.updateBackendStatus("deploying","Deploying your backend now..."),(B=document.getElementById("build-command"))!=null&&B.value.trim(),(F=document.getElementById("start-command"))!=null&&F.value.trim(),(G=document.getElementById("port"))!=null&&G.value.trim();const I=await Fe(x,"backend",E,!0);I&&I.success&&I.deployed_url?(E.showUrls(null,I.deployed_url),document.getElementById("close-deployment-dialog").onclick=()=>{E.close(),ye(),de()}):I&&!I.success&&setTimeout(()=>E.close(),3e3)}),T&&(T.onclick=async()=>{var F,G;const x=(F=M==null?void 0:M.value)==null?void 0:F.trim(),E=(G=h==null?void 0:h.value)==null?void 0:G.trim();if(!x||!x.startsWith("http")||!E||!E.startsWith("http")){p("Please enter valid Frontend and Backend repository URLs","error");return}let I=!1,j={};if(r&&r.id)try{const k=await fetch(`/api/env-vars?project_id=${r.id}`,{headers:N()});if(k.ok){const Y=(await k.json()).variables||{};I=Object.keys(Y).length>0,console.log("Existing env vars check:",{hasExistingEnvVars:I,count:Object.keys(Y).length})}}catch(k){console.warn("Failed to check existing env vars:",k)}if(I){await B();return}try{const k=await fetch(`/api/env-vars/detect?frontend_url=${encodeURIComponent(x)}&backend_url=${encodeURIComponent(E)}`,{headers:N()});k.ok?(j=(await k.json()).suggestions||{},console.log("Env var detection result:",{count:Object.keys(j).length,vars:j})):console.warn("Env var detection API returned:",k.status)}catch(k){console.warn("Env var detection failed:",k)}Ct(j,async()=>{if(Object.keys(j).length===0){r&&r.id?U.navigate("/env-vars"):(p("No env vars detected. Add them manually after deployment","info"),await B());return}if(p("Importing environment variables...","info"),r&&r.id){const k={};Object.keys(j).forEach(le=>{k[le]=""});const Q=localStorage.getItem("access_token")||localStorage.getItem("authToken"),Y=await fetch(`/api/env-vars?project_id=${r.id}`,{headers:{Authorization:`Bearer ${Q}`}});if(Y.ok){const me={...(await Y.json()).variables||{},...k};(await fetch("/api/env-vars",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${Q}`},body:JSON.stringify({variables:me,project_id:r.id})})).ok?(p("Environment variables imported successfully!","success"),setTimeout(()=>B(),500)):(p("Failed to import environment variables","error"),await B())}else p("Failed to load existing environment variables","error"),await B()}else p("Save detected env vars after deployment","info"),await B()},()=>{r&&r.id?U.navigate("/env-vars"):p("Please add environment variables after deployment","info")},async()=>{await B()});async function B(){var Q,Y,le;const k=we(!0);document.getElementById("step-backend").style.display="flex",document.getElementById("step-frontend").style.display="flex",k.updateBackendStatus("deploying","Deploying your backend now...");try{const R=new FormData;R.append("deploy_type","split"),R.append("frontend_url",x),R.append("backend_url",E),r&&r.id&&R.append("project_id",String(r.id));const me=(Q=document.getElementById("build-command"))==null?void 0:Q.value.trim(),be=(Y=document.getElementById("start-command"))==null?void 0:Y.value.trim(),Ne=(le=document.getElementById("port"))==null?void 0:le.value.trim();me&&R.append("build_command",me),be&&R.append("start_command",be),Ne&&R.append("port",Ne);const Ae=await fetch("/deploy",{method:"POST",headers:N(),body:R}),pe=await Ae.json();Ae.ok&&pe.deployed_url?(k.updateBackendStatus("success","Backend deployed! ✅"),k.updateFrontendStatus("success","Frontend deployed! ✅"),k.showUrls(pe.deployed_url,null),document.getElementById("close-deployment-dialog").onclick=()=>{k.close(),O(),ye(),de()},p("Split deployment successful!","success")):(k.updateBackendStatus("failed",pe.detail||"Deployment failed"),k.updateFrontendStatus("failed","Could not deploy"),p(pe.detail||"Deployment failed","error"),setTimeout(()=>k.close(),3e3))}catch{k.updateBackendStatus("failed","Network error"),k.updateFrontendStatus("failed","Network error"),p("Network error during deployment","error"),setTimeout(()=>k.close(),3e3)}}}),C&&(C.style.display="none")}else if(D==="single"){if(m&&(m.style.display="block"),u&&(u.style.display="none"),y&&(y.style.display="none"),f&&r){const w=r.git_url||r.repository_url||"";w&&(f.value=w,f.removeAttribute("required"))}C&&(C.textContent="Deploy",C.style.display="")}}else c&&(c.style.display=""),splitGroup&&(splitGroup.style.display="none"),y&&(y.style.display="none"),m&&(m.style.display="block"),f&&(f.value=""),C&&(C.textContent="🚀 Deploy",C.style.display="")}document.getElementById("pageTitle").textContent="Deploy";break;case"status":xt();break;case"configuration":St();break;case"domain-config":qe();break;case"env-vars":const n=document.getElementById("page-env-vars");n&&(n.style.display="block",Pe());break;case"logs":bt();break;case"files":document.getElementById("pageTitle").textContent="Repository Files",wt();break}}async function bt(){document.querySelectorAll(".page").forEach(t=>t.style.display="none");let e=document.getElementById("page-project-logs");e||(e=document.createElement("div"),e.id="page-project-logs",e.className="page",document.getElementById("pageContent").appendChild(e)),e.innerHTML="",e.innerHTML=`
    <div class="card">
      <div class="page-header">
        <h2>Container Logs</h2>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn-secondary" id="clearProjectLogsBtn">Clear</button>
          <button class="btn-secondary" id="toggleProjectLogsBtn">Pause</button>
        </div>
      </div>
      <div class="logs-container">
        <div id="projectLogsContent" class="logs-content">
          <p style="text-align: center; color: var(--text-secondary); padding: 2rem;">
            Connecting to logs stream...
          </p>
        </div>
      </div>
    </div>
  `,e.style.display="block",r&&r.id&&Xe(r.id)}async function wt(){document.querySelectorAll(".page").forEach(s=>s.style.display="none");let e=document.getElementById("page-project-files");if(e||(e=document.createElement("div"),e.id="page-project-files",e.className="page",document.getElementById("pageContent").appendChild(e)),!r||!r.git_url){e.innerHTML=`
      <div class="card">
        <div class="page-header">
          <h2>Repository Files</h2>
        </div>
        <div style="padding: 2rem; text-align: center; color: var(--text-secondary);">
          <p>No repository URL found for this project.</p>
        </div>
      </div>
    `,e.style.display="block";return}const t=r.git_url||r.repository_url||"",n=t.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git|[/]|$)/);if(!n){e.innerHTML=`
      <div class="card">
        <div class="page-header">
          <h2>Repository Files</h2>
        </div>
        <div style="padding: 2rem; text-align: center; color: var(--text-secondary);">
          <p>Could not parse repository URL: ${b(t)}</p>
        </div>
      </div>
    `,e.style.display="block";return}n[1];const o=n[2];e.innerHTML=`
    <div class="card">
      <div class="page-header">
        <h2>Repository Files</h2>
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div class="breadcrumb" id="filesBreadcrumb">
            <span class="breadcrumb-item" onclick="loadFilesPath('')">${b(o)}</span>
          </div>
          <button class="btn-secondary" id="filesBackButton" onclick="goBackInFiles()" style="display: none;">
            ← Back
          </button>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 300px 1fr; gap: 1rem; min-height: 500px;">
        <div style="background: var(--card-bg); border-radius: 12px; padding: 1rem; overflow-y: auto; max-height: 600px;">
          <div id="filesTreeLoading" style="display: flex; justify-content: center; align-items: center; height: 200px;">
            <div style="width: 40px; height: 40px; border: 4px solid var(--border-color); border-top: 4px solid var(--primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
          </div>
          <div id="filesTreeContainer" style="display: none;"></div>
        </div>
        <div style="background: var(--card-bg); border-radius: 12px; padding: 1.5rem; overflow-y: auto; max-height: 600px;">
          <div id="fileContentContainer">
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
              <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">📁</div>
              <p>Select a file to view its content</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,e.style.display="block",e.dataset.projectId=r.id,e.dataset.useVm="true",await Ve("")}async function Ve(e){const t=document.getElementById("page-project-files");if(!t)return;const n=t.dataset.useVm==="true",o=t.dataset.projectId,s=t.dataset.owner,a=t.dataset.repo;if(n&&!o){p("Project ID not found","error");return}if(!n&&(!s||!a)){p("Repository information not found","error");return}const i=document.getElementById("filesTreeContainer"),l=document.getElementById("filesTreeLoading"),d=document.getElementById("fileContentContainer");l&&(l.style.display="flex"),i&&(i.style.display="none"),d&&(d.innerHTML=`
      <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
        <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">📁</div>
        <p>Select a file to view its content</p>
      </div>
    `);try{const c=localStorage.getItem("access_token")||localStorage.getItem("authToken"),m={"Content-Type":"application/json"};c&&(m.Authorization=`Bearer ${c}`);let u;n?(u=`/projects/${o}/files`,e&&(u+=`?path=${encodeURIComponent(e)}`)):(u=`/api/repository/${s}/${a}/contents`,e&&(u+=`?path=${encodeURIComponent(e)}`)),console.log("Loading files from:",u);const y=await fetch(u,{headers:m});if(y.status===401){p("Authentication required","error"),l&&(l.style.display="none");return}if(!y.ok){const S=await y.json().catch(()=>({detail:"Unknown error"}));console.error("API error:",y.status,S),p(S.detail||`Failed to load repository contents (${y.status})`,"error"),l&&(l.style.display="none");return}const f=await y.json();console.log("API response:",f);const g=f.contents||(Array.isArray(f)?f:[]);if(console.log("Files loaded:",g.length,"items",g),!Array.isArray(g)){console.error("Invalid response format:",g),p("Invalid response format from server","error"),l&&(l.style.display="none");return}l&&(l.style.display="none"),i&&(i.style.display="block",Et(g,e));const v=a||(r==null?void 0:r.name)||"Repository";It(e,v),t&&(t.dataset.currentPath=e)}catch(c){console.error("Error loading files:",c),p("Failed to load repository contents: "+c.message,"error"),l&&(l.style.display="none")}}function Et(e,t){const n=document.getElementById("filesTreeContainer");if(!n)return;if(n.innerHTML="",!e||e.length===0){n.innerHTML=`
      <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
        <div style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5;">📁</div>
        <p>This directory is empty</p>
      </div>
    `;return}e.sort((s,a)=>s.type==="dir"&&a.type!=="dir"?-1:s.type!=="dir"&&a.type==="dir"?1:s.name.localeCompare(a.name)).forEach(s=>{const a=document.createElement("div");a.style.cssText="display: flex; align-items: center; padding: 0.5rem; margin: 0.25rem 0; border-radius: 6px; cursor: pointer; transition: all 0.2s; font-size: 0.9rem;",a.onmouseover=()=>a.style.background="var(--bg-secondary)",a.onmouseout=()=>a.style.background="transparent";const i=s.type==="dir"?"📁":Bt(s.name);a.innerHTML=`
      <span style="margin-right: 0.5rem; font-size: 1rem; ${s.type==="dir"?"color: var(--accent);":""}">${i}</span>
      <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${b(s.name)}</span>
    `,a.onclick=()=>{s.type==="dir"?Ve(s.path):kt(s)},n.appendChild(a)})}async function kt(e){const t=document.getElementById("page-project-files");if(!t)return;const n=t.dataset.useVm==="true",o=t.dataset.projectId,s=t.dataset.owner,a=t.dataset.repo;if(n&&!o){p("Project ID not found","error");return}if(!n&&(!s||!a)){p("Repository information not found","error");return}const i=document.getElementById("fileContentContainer");if(i){i.innerHTML=`
    <div style="display: flex; justify-content: center; align-items: center; height: 200px;">
      <div style="width: 40px; height: 40px; border: 4px solid var(--border-color); border-top: 4px solid var(--primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
    </div>
  `;try{const l=localStorage.getItem("access_token")||localStorage.getItem("authToken"),d={"Content-Type":"application/json"};l&&(d.Authorization=`Bearer ${l}`);let c;n?c=`/projects/${o}/files/content?file_path=${encodeURIComponent(e.path)}`:c=`/api/repository/${s}/${a}/contents/${e.path}`,console.log("Loading file content from:",c);const m=await fetch(c,{headers:d});if(m.status===401){p("Authentication required","error");return}if(!m.ok){const v=await m.json().catch(()=>({detail:"Unknown error"}));console.error("File content error:",m.status,v),p(v.detail||"Failed to load file content","error"),i.innerHTML=`
        <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
          <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">❌</div>
          <p>Error loading file: ${b(v.detail||"Unknown error")}</p>
        </div>
      `;return}const u=await m.json();if(u.is_binary||u.encoding==="binary"){const v=u.size||0;i.innerHTML=`
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color);">
          <div style="font-weight: 600; font-size: 1.1rem;">${b(e.name)}</div>
          <div style="color: var(--text-secondary); font-size: 0.9rem;">${Me(v)}</div>
        </div>
        <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
          <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">📄</div>
          <p>${b(u.message||"Binary file - cannot display as text")}</p>
          <p style="font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.7;">This file appears to be a binary file (image, executable, etc.) and cannot be displayed as text.</p>
        </div>
      `;return}let y;if(n)y=u.content||"";else if(u.type==="file"&&u.content)try{y=atob(u.content)}catch{i.innerHTML=`
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
              <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">⚠️</div>
              <p>Unable to display this file - it may be a binary file</p>
            </div>
          `;return}else{i.innerHTML=`
          <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
            <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">⚠️</div>
            <p>Unable to display this file type</p>
          </div>
        `;return}const f=e.name.split(".").pop().toLowerCase(),g=u.size||0;i.innerHTML=`
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color);">
        <div style="font-weight: 600; font-size: 1.1rem;">${b(e.name)}</div>
        <div style="color: var(--text-secondary); font-size: 0.9rem;">${Me(g)}</div>
      </div>
      <pre style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; overflow-x: auto; font-family: 'Consolas', 'Monaco', 'Lucida Console', monospace; font-size: 0.9rem; line-height: 1.5; white-space: pre-wrap; word-wrap: break-word;"><code class="language-${f}">${b(y)}</code></pre>
    `,window.Prism&&Prism.highlightAll()}catch(l){console.error("Error loading file content:",l),p("Failed to load file content: "+l.message,"error"),i.innerHTML=`
      <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
        <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">❌</div>
        <p>Error loading file: ${b(l.message)}</p>
      </div>
    `}}}function It(e,t){const n=document.getElementById("filesBreadcrumb"),o=document.getElementById("filesBackButton");if(!n)return;if(o&&(e&&e.split("/").filter(l=>l).length>0?o.style.display="block":o.style.display="none"),!e){n.innerHTML=`<span class="breadcrumb-item" onclick="loadFilesPath('')">${b(t)}</span>`;return}const s=e.split("/").filter(l=>l);let a=`<span class="breadcrumb-item" onclick="loadFilesPath('')">${b(t)}</span>`,i="";s.forEach((l,d)=>{i+=(d>0?"/":"")+l,a+=`
      <span style="color: var(--text-secondary); margin: 0 0.5rem;">/</span>
      <span class="breadcrumb-item" onclick="loadFilesPath('${i}')" style="color: var(--text-secondary); cursor: pointer; transition: color 0.2s;">${b(l)}</span>
    `}),n.innerHTML=a}function Bt(e){const t=e.split(".").pop().toLowerCase();return{js:"📄",jsx:"📄",ts:"📄",tsx:"📄",py:"🐍",java:"☕",cpp:"⚙️",c:"⚙️",html:"🌐",css:"🎨",scss:"🎨",sass:"🎨",json:"📋",xml:"📋",yml:"📋",yaml:"📋",md:"📝",txt:"📝",sql:"🗄️",sh:"🐚",bat:"🪟",dockerfile:"🐳",gitignore:"🚫"}[t]||"📄"}function Me(e){if(e===0)return"0 Bytes";const t=1024,n=["Bytes","KB","MB","GB"],o=Math.floor(Math.log(e)/Math.log(t));return parseFloat((e/Math.pow(t,o)).toFixed(2))+" "+n[o]}async function St(){let e=document.getElementById("page-project-config");e||(e=document.createElement("div"),e.id="page-project-config",e.className="page",e.innerHTML=`
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
            <div class="config-label">Imported:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigCreated">${r!=null&&r.createdAt?$e(r.createdAt):"Unknown"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Last update:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigUpdated">${r!=null&&r.updatedAt?ee(new Date(r.updatedAt)):"Unknown"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Port:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigPort">${(r==null?void 0:r.port)||"Not set"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Process PID:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigPid">${(r==null?void 0:r.processPid)||"Not running"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Start Command:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigStartCommand">${(r==null?void 0:r.startCommand)||"Not set"}</span>
            </div>
          </div>
          ${r!=null&&r.buildCommand?`
          <div class="config-row">
            <div class="config-label">Build Command:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigBuildCommand">${r.buildCommand}</span>
            </div>
          </div>
          `:""}
        </div>
        <div class="config-actions">
          <button class="btn-secondary" id="changeProjectNameBtn">Change project name</button>
        </div>
      </div>
    `,document.getElementById("pageContent").appendChild(e));const t=document.getElementById("project-components-section");t&&(t.style.display="none"),Le();const n=document.getElementById("changeProjectNameBtn");n&&(n.onclick=()=>Oe()),e.style.display="block"}async function xt(){document.querySelectorAll(".page").forEach(t=>t.style.display="none");let e=document.getElementById("page-status");if(e||(e=document.createElement("div"),e.id="page-status",e.className="page",document.getElementById("pageContent").appendChild(e)),e.innerHTML="",r&&r.id)try{const t=await fetch(`/projects/${r.id}/components`,{headers:N()});if(t.ok){const o=(await t.json()).components||[],s=o.find(m=>m.component_type==="frontend"),a=o.find(m=>m.component_type==="backend"),i=s?s.status==="running"?"RUNNING":s.status.toUpperCase():"NOT DEPLOYED",l=a?a.status==="running"?"RUNNING":a.status.toUpperCase():"NOT DEPLOYED",d=(s==null?void 0:s.status)==="running"?"status-success":(s==null?void 0:s.status)==="failed"?"status-error":"status-info",c=(a==null?void 0:a.status)==="running"?"status-success":(a==null?void 0:a.status)==="failed"?"status-error":"status-info";e.innerHTML=`
          <div class="card">
            <h2 style="margin-bottom: 1.5rem;">Project Components</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
              <!-- Frontend Card -->
              <div class="project-card" style="margin: 0;">
                <div class="project-header">
                  <div class="project-icon">🌐</div>
                  <div class="project-status ${d}">${i}</div>
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
        `}}catch(t){console.error("Error loading project components:",t),e.innerHTML=`
        <div class="card">
          <p>Unable to load project components. Please try again later.</p>
        </div>
      `}e.style.display="block",document.getElementById("pageTitle").textContent="Status"}async function ye(){if(!(!r||!r.id))try{const e=await fetch(`/projects/${r.id}/components`,{headers:N()});if(!e.ok)return;const n=(await e.json()).components||[],o=n.find(y=>y.component_type==="frontend"),s=n.find(y=>y.component_type==="backend"),a=o&&o.status&&o.status!=="imported"&&o.status!=="imported_split",i=s&&s.status&&s.status!=="imported"&&s.status!=="imported_split",l=a&&i;let d=document.getElementById("project-components-section");const c=document.getElementById("page-deploy"),m=document.getElementById("page-project-config"),u=m==null?void 0:m.querySelector("#project-components-section");if(u&&u.remove(),l&&c&&c.style.display!=="none"){if(!d){d=document.createElement("div"),d.id="project-components-section",d.className="card project-components-card";const S=c.querySelector(".card");S?c.insertBefore(d,S):c.appendChild(d)}d.style.display="block";const y=o?o.status==="running"?"RUNNING":o.status.toUpperCase():"NOT DEPLOYED",f=s?s.status==="running"?"RUNNING":s.status.toUpperCase():"NOT DEPLOYED",g=(o==null?void 0:o.status)==="running"?"status-success":(o==null?void 0:o.status)==="failed"?"status-error":"status-info",v=(s==null?void 0:s.status)==="running"?"status-success":(s==null?void 0:s.status)==="failed"?"status-error":"status-info";d.innerHTML=`
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
            <div class="project-status ${v}">${f}</div>
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
    `,requestAnimationFrame(()=>{d.classList.add("components-visible");const S=c.querySelector(".card:not(#project-components-section)");S&&S.classList.add("deploy-card-slide-down")})}else if(d){d.style.display="none",d.classList.remove("components-visible");const y=c==null?void 0:c.querySelector(".card:not(#project-components-section)");y&&y.classList.remove("deploy-card-slide-down")}}catch(e){console.error("Error loading project components:",e)}}function ze(e){if(!e||e==="#")return null;const t=e.trim();return/^https?:\/\//i.test(t)?t:`https://${t}`}function jt(e){const t=ze(e);t?window.open(t,"_blank"):p("Site URL is unavailable","error")}function Ct(e,t,n,o){const s=document.createElement("div");s.className="modal-overlay",s.id="envVarsDetectionOverlay";const a=document.createElement("div");a.className="modal-content enhanced",a.style.maxWidth="600px";const i=Object.keys(e).length>0,l=i?Object.entries(e).map(([c,m])=>`
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
        ${i?`We found ${Object.keys(e).length} environment variables in your code. Choose how to proceed:`:"No environment variables were detected. You can add them manually or proceed without them."}
      </p>
    </div>
    <div style="padding: 1.5rem; max-height: 400px; overflow-y: auto;">
      ${l}
    </div>
    <div style="padding: 1.5rem; border-top: 1px solid #e5e7eb; display: flex; gap: 0.75rem; justify-content: flex-end;">
      <button class="btn-secondary skip-env-btn" style="padding: 0.75rem 1.5rem;">No, Skip</button>
      <button class="btn-secondary add-manual-env-btn" style="padding: 0.75rem 1.5rem;">Add Manually</button>
      ${i?'<button class="btn-primary import-env-btn" style="padding: 0.75rem 1.5rem;">✅ Import All</button>':""}
    </div>
  `,s.appendChild(a),document.body.appendChild(s),document.querySelector(".skip-env-btn").onclick=()=>{s.remove(),o&&o()},document.querySelector(".add-manual-env-btn").onclick=()=>{s.remove(),n&&n()};const d=document.querySelector(".import-env-btn");return d&&(d.onclick=async()=>{s.remove(),t&&await t()}),s}function we(e=!0){const t=document.createElement("div");t.className="modal-overlay deployment-progress-overlay",t.id="deploymentProgressOverlay";const n=document.createElement("div");return n.className="deployment-progress-modal",n.innerHTML=`
    <div class="deployment-progress-header">
      <h3>🚀 Deployment in Progress</h3>
    </div>
    <div class="deployment-progress-body">
      <div class="progress-steps">
        <div class="progress-step" id="step-backend" ${e?"":'style="display: none;"'}>
          <div class="step-icon">⏳</div>
          <div class="step-content">
            <div class="step-title">Backend</div>
            <div class="step-message" id="backend-message">Waiting...</div>
          </div>
          <div class="step-status" id="backend-status"></div>
        </div>
        <div class="progress-step" id="step-frontend" ${e?"":'style="display: none;"'}>
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
  `,t.appendChild(n),document.body.appendChild(t),{overlay:t,updateBackendStatus:(o,s)=>{const a=document.getElementById("step-backend"),i=a.querySelector(".step-icon"),l=document.getElementById("backend-status"),d=document.getElementById("backend-message");d.textContent=s,o==="deploying"?(i.textContent="⏳",l.textContent="",a.classList.remove("completed","failed"),a.classList.add("active")):o==="success"?(i.textContent="✅",l.textContent="✓",a.classList.remove("active","failed"),a.classList.add("completed")):o==="failed"&&(i.textContent="❌",l.textContent="✗",a.classList.remove("active","completed"),a.classList.add("failed"))},updateFrontendStatus:(o,s)=>{const a=document.getElementById("step-frontend"),i=a.querySelector(".step-icon"),l=document.getElementById("frontend-status"),d=document.getElementById("frontend-message");d.textContent=s,o==="deploying"?(i.textContent="⏳",l.textContent="",a.classList.remove("completed","failed"),a.classList.add("active")):o==="success"?(i.textContent="✅",l.textContent="✓",a.classList.remove("active","failed"),a.classList.add("completed")):o==="failed"&&(i.textContent="❌",l.textContent="✗",a.classList.remove("active","completed"),a.classList.add("failed"))},showUrls:(o,s)=>{const a=document.getElementById("deployment-urls"),i=document.getElementById("frontend-url-link"),l=document.getElementById("backend-url-link"),d=document.getElementById("close-deployment-dialog");o?(i.href=o,i.textContent=o,i.closest(".url-item").style.display="flex"):i.closest(".url-item").style.display="none",s?(l.href=s,l.textContent=s,l.closest(".url-item").style.display="flex"):l.closest(".url-item").style.display="none",a.style.display="block",d.style.display="block"},close:()=>{const o=document.getElementById("deploymentProgressOverlay");o&&document.body.removeChild(o)}}}function Oe(){if(!r){p("No project selected","error");return}const e=document.createElement("div");e.className="modal-overlay";const t=document.createElement("div");t.className="modal-content enhanced",t.innerHTML=`
    <div class="project-name-modal-header">
      <h2 class="project-name-modal-title">Change Project Name</h2>
      <p class="project-name-modal-subtitle">
        Update the name for <strong>${b(r.name)}</strong>
      </p>
    </div>
    
    <div class="project-name-modal-form-group">
      <label class="project-name-modal-label">Project Name</label>
      <input 
        type="text" 
        id="newProjectNameInput"
        class="project-name-modal-input"
        value="${b(r.name)}"
        placeholder="Enter new project name"
      />
    </div>
    
    <div class="project-name-modal-actions">
      <button class="cancel-name-btn">Cancel</button>
      <button class="save-name-btn">Save Changes</button>
    </div>
  `,e.appendChild(t),document.body.appendChild(e);const n=document.getElementById("newProjectNameInput");n&&(n.focus(),n.select());const o=t.querySelector(".cancel-name-btn"),s=t.querySelector(".save-name-btn"),a=()=>{document.body.removeChild(e)};o.onclick=()=>{a()},s.onclick=async()=>{const l=n.value.trim();if(!l){p("Project name cannot be empty","error");return}if(l===r.name){a();return}try{const d=localStorage.getItem("access_token")||localStorage.getItem("authToken"),c=await fetch(`/projects/${r.id}/name`,{method:"PUT",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${d}`},body:new URLSearchParams({app_name:l})}),m=await c.json();if(c.ok){p("Project name updated successfully!","success"),r.name=l,a();const u=P.findIndex(f=>f.id===r.id);u>=0&&(P[u].name=l),Le(),X(z);const y=document.getElementById("projectSidebarName");y&&(y.textContent=l),document.getElementById("pageTitle").textContent=l}else p(m.detail||"Failed to update project name","error")}catch(d){console.error("Error updating project name:",d),p("Failed to update project name: "+d.message,"error")}},e.onclick=l=>{l.target===e&&a()};const i=l=>{l.key==="Escape"&&(a(),document.removeEventListener("keydown",i))};document.addEventListener("keydown",i)}function Lt(e){const t=document.getElementById("content"+e.charAt(0).toUpperCase()+e.slice(1)),n=document.getElementById("icon"+e.charAt(0).toUpperCase()+e.slice(1));t&&n&&(t.classList.toggle("active"),n.classList.toggle("active"))}function $t(){r&&r.id?typeof U<"u"&&U&&U.navigate?U.navigate("/env-vars"):window.router&&window.router.navigate?window.router.navigate("/env-vars"):window.location.hash="#/env-vars":p("Please create a project first before adding environment variables","info")}function _t(){const e=document.getElementById("framework-preset"),t=document.getElementById("install-command"),n=document.getElementById("build-command"),o=document.getElementById("start-command");e&&e.addEventListener("change",function(s){const a=s.target.value;if(t&&(["nextjs","react","vue","nuxt","gatsby","angular","svelte","vite","nodejs"].includes(a)?t.placeholder="npm install, yarn install, or pnpm install":["python","flask","django"].includes(a)?t.placeholder="pip install -r requirements.txt":t.placeholder="npm install, yarn install, pnpm install, or pip install -r requirements.txt"),n){const i={nextjs:"next build",react:"npm run build",vue:"npm run build",nuxt:"nuxt build",gatsby:"gatsby build",angular:"ng build",svelte:"npm run build",vite:"vite build",nodejs:"npm run build",python:"",flask:"",django:"python manage.py collectstatic --noinput",static:""};i[a]&&(n.placeholder=i[a]||"Leave empty for auto-detect")}if(o){const i={nextjs:"npm run start",react:"npm start",vue:"npm run serve",nuxt:"nuxt start",gatsby:"gatsby serve",angular:"ng serve",svelte:"npm run dev",vite:"vite preview",nodejs:"node server.js",python:"python app.py",flask:"flask run",django:"python manage.py runserver",static:"python -m http.server"};i[a]&&(o.placeholder=i[a]||"Leave empty for auto-detect")}})}window.toggleDeploySection=Lt;window.navigateToEnvVars=$t;function Le(){if(!r)return;const e=document.getElementById("projectConfigName"),t=document.getElementById("projectConfigOwner"),n=document.getElementById("projectConfigId"),o=document.getElementById("projectConfigCreated"),s=document.getElementById("projectConfigUpdated"),a=document.getElementById("projectConfigPort"),i=document.getElementById("projectConfigPid"),l=document.getElementById("projectConfigStartCommand"),d=document.getElementById("projectConfigBuildCommand");if(e&&(e.textContent=r.name||"Unknown"),t){const c=localStorage.getItem("username"),m=localStorage.getItem("displayName");t.textContent=m||c||"Unknown User"}n&&(n.textContent=r.id||"-"),o&&(o.textContent=r.createdAt?$e(r.createdAt):"Unknown"),s&&(s.textContent=r.updatedAt?ee(new Date(r.updatedAt)):"Unknown"),a&&(a.textContent=(r==null?void 0:r.port)||"Not set"),i&&(i.textContent=(r==null?void 0:r.processPid)||"Not running"),l&&(l.textContent=(r==null?void 0:r.startCommand)||"Not set"),d&&(d.textContent=(r==null?void 0:r.buildCommand)||"Not set")}function qe(){let e=document.getElementById("page-project-domain");e||(e=document.createElement("div"),e.id="page-project-domain",e.className="page",e.innerHTML=`
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
    `,document.getElementById("pageContent").appendChild(e)),e.style.display="block",Pt(),fe()}function Pt(){const e=document.getElementById("saveDomainBtn");e&&!e.dataset.bound&&(e.dataset.bound="true",e.addEventListener("click",Tt))}function Dt(e,t){if(!e)return;if(!t||!t.custom_domain){e.innerHTML='<span class="status-muted">No custom domain configured yet.</span>';return}const n=(t.domain_status||"unknown").toLowerCase(),o=t.last_domain_sync?$e(t.last_domain_sync):"Never";let s="Unknown",a="status-info",i="";n==="active"?(s="Active",a="status-success"):n==="error"?(s="Error",a="status-error",i="Resolve the issue and save the domain again."):n==="pending"&&(s="Pending",a="status-warning",i="Domain will be activated automatically after the next successful deployment."),e.innerHTML=`
    <div class="domain-status-line ${a}">
      <div class="domain-status-domain">
        <strong>${b(t.custom_domain)}</strong>
      </div>
      <div class="domain-status-meta">
        <span>${s}</span>
        <span>Last sync: ${b(o)}</span>
      </div>
      ${i?`<p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">${b(i)}</p>`:""}
    </div>
  `}async function fe(){const e=document.getElementById("domainSuggestion"),t=document.getElementById("domainStatus"),n=document.getElementById("domainPrefix"),o=document.getElementById("platformDomain");if(!r||!r.id){t&&(t.innerHTML='<span class="status-muted">Select a project to configure its domain.</span>');return}const s=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!s){t&&(t.innerHTML='<span class="status-error">Please login to manage domains.</span>');return}e&&(e.textContent="Loading domain details...");try{const a=await fetch(`/projects/${r.id}/domain`,{headers:{Authorization:`Bearer ${s}`}});if(!a.ok)throw new Error(`Failed to load domain info (${a.status})`);const i=await a.json(),l=i.butler_domain||"aayush786.xyz";o&&(o.textContent=l);let d="";const c=i.custom_domain||i.suggested_domain||"";if(c)if(c.endsWith(l))d=c.slice(0,-(l.length+1));else{const m=c.split(".");m.length>0&&(d=m[0])}if(n){n.value=d;const m=i.suggested_domain&&i.suggested_domain.endsWith(l)?i.suggested_domain.slice(0,-(l.length+1)):"";n.placeholder=m||"project-slug or my.project"}if(e){const m=i.suggested_domain&&i.suggested_domain.endsWith(l)?i.suggested_domain.slice(0,-(l.length+1)):"";e.textContent=m?`Suggested: ${m} (you can use multiple labels like "my.project" or "portfolio.app"). Leave blank to remove. Domains become active after a successful deploy.`:`Enter a subdomain prefix (can be multiple labels like "my.project" or "portfolio"). The platform domain ${l} is fixed and cannot be changed.`}Dt(t,i),r&&(r.custom_domain=i.custom_domain,r.domain_status=i.domain_status)}catch(a){console.error("Failed to load project domain info:",a),t&&(t.innerHTML='<span class="status-error">Could not load domain configuration.</span>')}}async function Tt(){if(!r||!r.id){p("Select a project first","error");return}const e=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!e){p("Please login to manage domains","error");return}const t=document.getElementById("domainPrefix"),n=document.getElementById("platformDomain");let o=t?t.value.trim():"";const s=n?n.textContent.trim():"";let a="";if(o){if(o=o.trim().replace(/^\.+|\.+$/g,""),!o){p("Please enter a subdomain prefix.","error");return}if(!/^[a-z0-9.-]+$/i.test(o)){p("Subdomain prefix can only contain letters, numbers, hyphens, and dots.","error");return}if(o.includes("..")){p("Subdomain prefix cannot contain consecutive dots.","error");return}if(o.startsWith(".")||o.endsWith(".")){p("Subdomain prefix cannot start or end with a dot.","error");return}a=`${o}.${s}`}if(!a){if(!r.custom_domain){p("Enter a subdomain prefix to save, or leave blank to remove the domain.","info");return}if(!confirm("Remove the custom domain and revert to the default internal URL?"))return;await Nt(),await fe();return}const i={custom_domain:a,auto_generate:!1};try{const l=await fetch(`/projects/${r.id}/domain`,{method:"POST",headers:{Authorization:`Bearer ${e}`,"Content-Type":"application/json"},body:JSON.stringify(i)});if(!l.ok){const m=(await l.json().catch(()=>({}))).detail||"Failed to save domain";if(l.status===409){p(m,"error");const y=document.getElementById("domainStatus");y&&(y.innerHTML=`<span class="status-error">${b(m)}</span>`)}else throw new Error(m);return}const d=await l.json();p(`Domain saved: ${d.custom_domain}`,"success"),await fe()}catch(l){console.error("Failed to save domain:",l),p(l.message||"Failed to save domain","error");const d=document.getElementById("domainStatus");d&&l.message&&(d.innerHTML=`<span class="status-error">${b(l.message)}</span>`)}}async function Nt(){if(!r||!r.id){p("Select a project first","error");return}const e=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!e){p("Please login to manage domains","error");return}try{const t=await fetch(`/projects/${r.id}/domain`,{method:"DELETE",headers:{Authorization:`Bearer ${e}`}});if(!t.ok){const o=(await t.json().catch(()=>({}))).detail||"Failed to reset domain";throw new Error(o)}p("Domain removed. Project will use its internal URL.","success"),r&&(r.custom_domain=null,r.domain_status=null),await fe()}catch(t){console.error("Failed to clear domain:",t),p(t.message||"Failed to clear domain","error")}}function At(e){je(e)}async function We(){const e=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!e){console.log("No auth token found");return}try{const t=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${e}`}});if(t.ok){const n=await t.json(),o=document.getElementById("projectSidebar");if(o){const s=o.querySelector("#projectSidebarUserName"),a=o.querySelector("#projectSidebarUserEmail"),i=o.querySelector("#projectSidebarUserAvatar");if(s&&(s.textContent=n.display_name||n.username||"User"),a&&(a.textContent=n.email||"No email"),i)if(n.avatar_url){const l=new Image;l.onload=()=>{i.style.backgroundImage=`url(${n.avatar_url})`,i.style.backgroundSize="cover",i.style.backgroundPosition="center",i.textContent=""},l.onerror=()=>{i.style.backgroundImage="",i.textContent=(n.display_name||n.username||"U").charAt(0).toUpperCase()},l.src=n.avatar_url}else i.style.backgroundImage="",i.textContent=(n.display_name||n.username||"U").charAt(0).toUpperCase()}}else console.error("Failed to load user profile:",t.status)}catch(t){console.error("Error loading user profile:",t)}}function ee(e){if(!e)return"Recently";const n=Date.now()-new Date(e).getTime(),o=Math.floor(n/6e4),s=Math.floor(n/36e5),a=Math.floor(n/864e5);if(o<1)return"Just now";if(o<60)return`${o}m ago`;if(s<24)return`${s}h ago`;if(a<7)return`${a}d ago`;const i=new Date(e);return i.toLocaleDateString("en-US",{month:"short",day:"numeric",year:i.getFullYear()!==new Date().getFullYear()?"numeric":void 0})}function $e(e){return e?new Date(e).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit",hour12:!0,timeZone:"Asia/Kathmandu"}):"Unknown"}async function Ut(e,t){const n=document.getElementById("monorepo-section"),o=document.getElementById("frontend-folder"),s=document.getElementById("backend-folder");if(!(!n||!o||!s))try{const a=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!a)return;const i=e?`/api/detect-monorepo?project_id=${e}`:`/api/detect-monorepo?git_url=${encodeURIComponent(t)}`,l=await fetch(i,{headers:{Authorization:`Bearer ${a}`}});if(l.ok){const d=await l.json();if(d.is_monorepo){if(n.style.display="block",d.frontend_folder){o.innerHTML='<option value="">None (skip frontend)</option>';const c=document.createElement("option");c.value=d.frontend_folder,c.textContent=d.frontend_folder,c.selected=!0,o.appendChild(c)}else o.innerHTML='<option value="">None (skip frontend)</option>';if(d.backend_folder){s.innerHTML='<option value="">None (skip backend)</option>';const c=document.createElement("option");c.value=d.backend_folder,c.textContent=d.backend_folder,c.selected=!0,s.appendChild(c)}else s.innerHTML='<option value="">None (skip backend)</option>'}else n.style.display="none"}}catch(a){console.error("Error detecting monorepo structure:",a),n.style.display="none"}}async function de(){await O();try{const e=await fetch("/deployments",{headers:N()});if(e.ok){const t=await e.json();document.getElementById("totalDeployments").textContent=t.length,document.getElementById("runningApps").textContent=t.filter(o=>o.status==="success").length;const n=document.getElementById("recentActivity");t.length>0?n.innerHTML=t.slice(0,5).map(o=>{const s=o.app_name||o.container_name||"Untitled Project";return`
          <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
            <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 0.25rem;">${b(s)}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">
              ${new Date(o.created_at).toLocaleString("en-US",{timeZone:"Asia/Kathmandu"})}
            </div>
          </div>
        `}).join(""):n.innerHTML='<p class="recent-activity-empty">No recent activity</p>'}}catch(e){console.error("Error loading dashboard:",e)}}async function Mt(e){var c,m,u,y,f,g,v,S,q,J,W,$,M;if(e.preventDefault(),!ne){p("Please login to deploy applications","error"),window.location.href="/login";return}e.target;const t=((c=document.getElementById("deploy-type"))==null?void 0:c.value)||"single",n=document.getElementById("deploy-status"),o=document.getElementById("deploy-success");o.style.display="none",n.textContent="";let s="";if(r&&r.id){s=r.git_url||r.repository_url||"",console.log("Deploying existing project:",{projectId:r.id,projectName:r.name,gitUrl:s,hasGitUrl:!!s});const h=document.getElementById("git-url");h&&s&&(h.value=s,console.log("Populated hidden Git URL input with:",s)),s||h&&(s=h.value.trim(),console.log("Got Git URL from input field (fallback):",s))}else{const h=document.getElementById("git-url");s=h?h.value.trim():"",console.log("Deploying new project, Git URL from input:",s)}const a=(m=document.getElementById("frontend-url"))==null?void 0:m.value.trim(),i=(u=document.getElementById("backend-url"))==null?void 0:u.value.trim(),l=r==null?void 0:r.custom_domain,d=r!=null&&r.domain_status?r.domain_status.toLowerCase():null;if(l?l&&d!=="active"&&p("Domain saved. It will activate after this deployment.","info"):console.log("No custom domain configured - deployment will use internal URL"),t==="split"){if(!a||!a.startsWith("http")||!i||!i.startsWith("http")){n.textContent="Please enter valid Frontend and Backend repository URLs",n.style.color="var(--error)";return}}else if(!s||!s.startsWith("http")){n.textContent=`Please enter a valid Git repository URL. Current project: ${(r==null?void 0:r.name)||"unknown"}, Git URL: ${s||"missing"}`,n.style.color="var(--error)",console.error("Git URL validation failed:",{currentProject:r,gitUrl:s,gitUrlInput:(y=document.getElementById("git-url"))==null?void 0:y.value});return}console.log("Git URL validation passed:",s),n.textContent="🚀 Starting deployment...",n.style.color="var(--primary)",pn(),un();try{const h=new FormData;t==="split"?(h.append("deploy_type","split"),h.append("frontend_url",a),h.append("backend_url",i)):(h.append("deploy_type","single"),h.append("git_url",s)),typeof r=="object"&&r&&r.id&&h.append("project_id",String(r.id));const C=(f=document.getElementById("project-name"))==null?void 0:f.value.trim();C&&h.append("project_name",C);const ie=((g=document.getElementById("root-directory"))==null?void 0:g.value.trim())||"./";ie&&h.append("root_directory",ie);const D=(v=document.getElementById("framework-preset"))==null?void 0:v.value;D&&D!=="auto"&&h.append("framework_preset",D);const re=(S=document.getElementById("install-command"))==null?void 0:S.value.trim();re&&h.append("install_command",re);const oe=(q=document.getElementById("build-command"))==null?void 0:q.value.trim(),w=(J=document.getElementById("start-command"))==null?void 0:J.value.trim(),L=(W=document.getElementById("port"))==null?void 0:W.value.trim();oe&&h.append("build_command",oe),w&&h.append("start_command",w),L&&h.append("port",L);const T=document.getElementById("monorepo-section"),x=($=document.getElementById("frontend-folder"))==null?void 0:$.value.trim(),E=(M=document.getElementById("backend-folder"))==null?void 0:M.value.trim();T&&T.style.display!=="none"&&(x||E)&&(h.append("is_monorepo","true"),x&&h.append("frontend_folder",x),E&&h.append("backend_folder",E));const I=await fetch("/deploy",{method:"POST",headers:N(),body:h}),j=await I.json();if(I.ok)setTimeout(()=>{gn(j)},2e3);else if(I.status===423){const B=j.detail||"Your virtual machine is being created. Please wait a few moments and try again.";V(`⏳ ${B}`,"warning"),ae("warning","VM Creating..."),p(B,"warning")}else{const B=j.detail||"Deployment failed";V(`❌ Error: ${B}`,"error"),ae("error","Deployment Failed"),p(B,"error")}}catch{const C="Network error. Please try again.";V(`❌ ${C}`,"error"),ae("error","Network Error"),p(C,"error")}}async function Fe(e,t=null,n=null,o=!1){const s=document.getElementById("deploy-status"),a=document.getElementById("deploy-success");if(!ne)return p("Please login to deploy applications","error"),window.location.href="/login",o?{success:!1,error:"Not authenticated"}:void 0;n||(a&&(a.style.display="none"),s&&(s.textContent="",s.style.color="var(--primary)"));try{const i=new FormData;i.append("deploy_type","single"),i.append("git_url",e),typeof r=="object"&&r&&r.id&&i.append("project_id",String(r.id)),t&&typeof r=="object"&&r&&r.project_type==="split"&&i.append("component_type",t),buildCommand&&i.append("build_command",buildCommand),startCommand&&i.append("start_command",startCommand),port&&i.append("port",port);const l=await fetch("/deploy",{method:"POST",headers:N(),body:i}),d=await l.json();if(l.ok){if(n){const c="success",m=t==="backend"?"Backend complete! ✅":"Frontend complete! ✅";t==="backend"?n.updateBackendStatus(c,m):t==="frontend"&&n.updateFrontendStatus(c,m)}else if(s&&(s.textContent="✅ Deployment successful!",s.style.color="var(--success)"),d.deployed_url&&a){a.style.display="block";const c=document.getElementById("openAppBtn");c&&(c.href=d.deployed_url,c.textContent=`Open ${d.deployed_url}`)}return o?{success:!0,deployed_url:d.deployed_url}:(r&&r.isSplit?setTimeout(()=>{ye(),de()},1500):setTimeout(()=>{de(),U.navigate("/applications")},2e3),{success:!0,deployed_url:d.deployed_url})}else{const c=d.detail||"Deployment failed";if(n){const m="failed",u=`Error: ${c}`;t==="backend"?n.updateBackendStatus(m,u):t==="frontend"&&n.updateFrontendStatus(m,u)}else s&&(s.textContent=`❌ Error: ${c}`,s.style.color="var(--error)");if(o)return{success:!1,error:c}}}catch{const l="Network error. Please try again.";if(n){const d="failed",c=l;t==="backend"?n.updateBackendStatus(d,c):t==="frontend"&&n.updateFrontendStatus(d,c)}else s&&(s.textContent=`❌ ${l}`,s.style.color="var(--error)");if(o)return{success:!1,error:l}}}async function Ft(){if(!ne){document.getElementById("applicationsGrid").innerHTML=`
      <div class="empty-state">
        <p>Please login to view your applications</p>
        <a href="/login" class="btn-primary">Login</a>
      </div>
    `;return}try{const e=await fetch("/deployments",{headers:N()});if(e.ok){const t=await e.json(),n=document.getElementById("applicationsGrid");t.length===0?n.innerHTML=`
          <div class="empty-state">
            <p>No applications deployed yet</p>
            <a href="/deploy" class="btn-primary">Deploy Your First App</a>
          </div>
        `:n.innerHTML=t.map(o=>{const s=o.app_name||o.container_name||"Untitled Project";return`
          <div class="application-card" onclick="window.open('${o.deployed_url||"#"}', '_blank')">
            <h3>${b(s)}</h3>
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
        `}).join("")}}catch(e){console.error("Error loading applications:",e)}}async function _e(){if(!ne){document.getElementById("historyTableBody").innerHTML=`
      <tr>
        <td colspan="4" class="empty-state">Please login to view deployment history</td>
      </tr>
    `;return}try{const e=await fetch("/deployments",{headers:N()});if(e.ok){const t=await e.json(),n=document.getElementById("historyTableBody");t.length===0?n.innerHTML=`
          <tr>
            <td colspan="4" class="empty-state">No deployment history</td>
          </tr>
        `:n.innerHTML=t.map(o=>{const s=o.app_name||o.container_name||"Untitled Project";return`
          <tr>
            <td><strong>${b(s)}</strong></td>
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
        `}).join("")}}catch(e){console.error("Error loading history:",e)}}async function Rt(){if(confirm("Are you sure you want to clear all deployment history?"))try{(await fetch("/deployments/clear",{method:"DELETE",headers:N()})).ok&&(p("History cleared successfully","success"),_e())}catch{p("Error clearing history","error")}}async function Ht(e){if(confirm(`Are you sure you want to destroy "${e}"?`))try{(await fetch(`/deployments/${e}`,{method:"DELETE",headers:N()})).ok?(p("Deployment destroyed successfully","success"),_e(),Ft()):p("Error destroying deployment","error")}catch{p("Network error","error")}}let _=[],Re="";async function Ge(){const e=document.getElementById("usernameSearch").value.trim();if(!e){p("Please enter a GitHub username","error");return}e!==Re&&(_=[],Re=e);const t=document.getElementById("repositoriesGrid");t.innerHTML='<div class="empty-state"><p>Loading repositories...</p></div>';try{const n=await fetch(`/api/repositories/${e}`),o=await n.json();if(n.ok&&o.repositories)if(o.repositories.length===0)t.innerHTML='<div class="empty-state"><p>No repositories found</p></div>';else{try{localStorage.setItem("repos.lastUsername",e),localStorage.setItem("repos.lastData",JSON.stringify(o.repositories))}catch{}t.innerHTML=o.repositories.map(s=>`
          <div class="repository-card ${_.some(i=>i.url===s.clone_url)?"selected":""}" data-repo-url="${s.clone_url}" onclick="toggleRepositorySelection('${s.clone_url}', '${s.name}')">
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
        `).join(""),ve()}else t.innerHTML=`<div class="empty-state"><p>${o.detail||"Error loading repositories"}</p></div>`}catch{t.innerHTML='<div class="empty-state"><p>Error loading repositories</p></div>'}}function Vt(e,t){const n=_.findIndex(o=>o.url===e);if(n>=0)_.splice(n,1),ve();else{if(_.length>=2){p("You can only select up to 2 repositories for a split repository","error");return}_.push({url:e,name:t}),_.length===2&&zt(),ve()}}function zt(){const[e,t]=_,n=document.createElement("div");n.className="modal-overlay",n.id="splitImportModal";const o=document.createElement("div");o.className="modal-content enhanced",o.innerHTML=`
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
        <div class="split-import-repo-name">${b(e.name)}</div>
        <div class="split-import-repo-url">${b(e.url)}</div>
      </div>
      
      <div class="split-import-divider"></div>
      
      <div class="split-import-repo-item">
        <div class="split-import-repo-label">Backend</div>
        <div class="split-import-repo-name">${b(t.name)}</div>
        <div class="split-import-repo-url">${b(t.url)}</div>
      </div>
    </div>
    
    <div class="split-import-actions">
      <button class="cancel-btn">Cancel</button>
      <button class="confirm-btn">Import Multi-Repository</button>
    </div>
  `,n.appendChild(o),document.body.appendChild(n);const s=o.querySelector(".cancel-btn"),a=o.querySelector(".confirm-btn"),i=()=>{document.body.removeChild(n)};s.onclick=()=>{i()},a.onclick=()=>{i();const[d,c]=_;Ye(d.url,c.url,`${d.name}-${c.name}`)},n.onclick=d=>{d.target===n&&i()};const l=d=>{d.key==="Escape"&&(i(),document.removeEventListener("keydown",l))};document.addEventListener("keydown",l),a.focus()}function ve(){const e=document.getElementById("repositoriesGrid");if(!e)return;e.querySelectorAll(".repository-card").forEach(n=>{const o=n.getAttribute("data-repo-url");_.some(a=>a.url===o)?n.classList.add("selected"):n.classList.remove("selected")})}function Ot(){if(_.length!==2){p("Please select exactly 2 repositories","error");return}const[e,t]=_;confirm(`Import as Multi-Repository?

Frontend: ${e.name}
Backend: ${t.name}

Click OK to import these repositories as a multi-repository project.`)&&Ye(e.url,t.url,`${e.name}-${t.name}`)}async function Ye(e,t,n){const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o){p("Please login first","error");return}try{p("Importing multi-repositories...","info");const s=await fetch("/api/import-split",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${o}`},body:new URLSearchParams({frontend_url:e,backend_url:t,app_name:n})}),a=await s.json();if(s.ok){p("Multi-repository imported successfully! Navigate to Projects to see it.","success"),_=[];const i=document.getElementById("page-projects");i&&i.style.display!=="none"&&O(),document.getElementById("usernameSearch").value.trim()&&Ge()}else s.status===423?p(a.detail||"Your virtual machine is being created. Please wait a few moments and try again.","warning"):p(a.detail||"Failed to import multi-repository","error")}catch(s){console.error("Error importing multi-repositories:",s),p("Failed to import multi-repository: "+s.message,"error")}}function qt(e){document.getElementById("git-url").value=e,U.navigate("/deploy"),p("Repository selected","success")}async function Wt(e,t){const n=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!n){p("Please login first","error");return}try{p("Importing repository...","info");const o=await fetch("/api/import",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${n}`},body:new URLSearchParams({git_url:e,app_name:t||e.split("/").pop()||"Untitled Project"})}),s=await o.json();if(o.ok){p("Repository imported successfully! Navigate to Projects to see it.","success");const a=document.getElementById("page-projects");a&&a.style.display!=="none"&&O()}else o.status===423?p(s.detail||"Your virtual machine is being created. Please wait a few moments and try again.","warning"):p(s.detail||"Failed to import repository","error")}catch(o){console.error("Error importing repository:",o),p("Failed to import repository: "+o.message,"error")}}function Gt(){const e=document.getElementById("repositoriesGrid"),t=document.getElementById("usernameSearch");if(!e)return;let n=!1;try{const o=localStorage.getItem("repos.lastUsername")||"",s=localStorage.getItem("repos.lastData");if(s){const a=JSON.parse(s);Array.isArray(a)&&a.length>=0&&(t&&(t.value=o),e.innerHTML=a.map(i=>`
          <div class="repository-card ${_.some(d=>d.url===i.clone_url)?"selected":""}" data-repo-url="${i.clone_url}" onclick="toggleRepositorySelection('${i.clone_url}', '${i.name||""}')">
            <h3>${i.name||"Unnamed"}</h3>
            <p style="color: var(--text-secondary); margin: 0.5rem 0;">
              ${i.description||"No description"}
            </p>
            <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.875rem; color: var(--text-secondary);">
                ${i.language||"Unknown"} • ${i.stargazers_count||0} stars
              </span>
              <button class="btn-primary btn-small" onclick="event.stopPropagation(); importRepository('${i.clone_url}', '${i.name||""}')">
                📥 Import
              </button>
            </div>
          </div>
          `).join(""),ve(),n=!0)}}catch{}n||(e.innerHTML=`
      <div class="empty-state">
        <p>Search for a GitHub username to see their repositories</p>
      </div>
    `)}function p(e,t="info"){const n=document.getElementById("toast");n.textContent=e,n.className=`toast show ${t}`,setTimeout(()=>{n.classList.remove("show")},3e3)}let te={},xe=[];async function Pe(){try{const e=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!e){const n=document.getElementById("envVarsList");n&&(n.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `),Ee();return}if(!r||!r.id){const n=document.getElementById("envVarsList");n&&(n.innerHTML=`
          <div class="empty-state">
            <p>Please select a project from the Projects page to manage environment variables</p>
          </div>
        `),Ee();return}const t=await fetch(`/api/env-vars?project_id=${r.id}`,{headers:{Authorization:`Bearer ${e}`}});if(t.ok){const n=await t.json();te=n.variables||{},xe=n.vars_list||[],Yt()}else if(t.status===401){localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),he();const n=document.getElementById("envVarsList");n&&(n.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `)}else console.error("Failed to load environment variables")}catch(e){console.error("Error loading environment variables:",e)}Ee()}function Ee(){const e=document.getElementById("importEnvBtn"),t=document.getElementById("addEnvVarBtn"),n=document.getElementById("importEnvCard"),o=document.getElementById("cancelImportBtn"),s=document.getElementById("importEnvForm"),a=document.getElementById("envDropZone"),i=document.getElementById("envFileInput"),l=document.getElementById("envDropZoneBrowse"),d=document.getElementById("envDropZoneFileName");if(e&&(e.onclick=()=>{n.style.display=n.style.display==="none"?"block":"none"}),o&&(o.onclick=()=>{n.style.display="none",i&&(i.value=""),d&&(d.textContent="",d.style.display="none")}),t&&(t.onclick=()=>{Kt()}),i&&(i.onchange=c=>{var u;const m=(u=c.target.files)==null?void 0:u[0];d&&(m?(d.textContent=m.name,d.style.display="block"):(d.textContent="",d.style.display="none"))}),a&&i&&!a.dataset.bound){a.dataset.bound="true";const c=m=>{m.preventDefault(),m.stopPropagation()};["dragenter","dragover"].forEach(m=>{a.addEventListener(m,u=>{c(u),a.classList.add("is-dragover")})}),["dragleave","dragend"].forEach(m=>{a.addEventListener(m,u=>{c(u),a.classList.remove("is-dragover")})}),a.addEventListener("dragover",m=>{c(m),m.dataTransfer&&(m.dataTransfer.dropEffect="copy"),a.classList.add("is-dragover")}),a.addEventListener("drop",async m=>{var f;c(m),a.classList.remove("is-dragover");const u=(f=m.dataTransfer)==null?void 0:f.files;if(!u||!u.length)return;const[y]=u;if(d&&(d.textContent=y.name,d.style.display="block"),i)try{const g=new DataTransfer;g.items.add(y),i.files=g.files}catch(g){console.warn("Unable to sync dropped file with input element:",g)}try{await He(y)}catch(g){console.error("Error importing dropped .env file:",g)}}),a.addEventListener("click",()=>{i.click()}),l&&l.addEventListener("click",m=>{m.preventDefault(),i.click()})}s&&(s.onsubmit=async c=>{var u;c.preventDefault();const m=(u=i==null?void 0:i.files)==null?void 0:u[0];m&&await He(m)})}async function He(e){try{if(!e){p("No file detected for import","error");return}p(`Importing ${e.name||".env"}...`,"info");const n=(await e.text()).split(`
`),o={};n.forEach(a=>{if(a=a.trim(),a&&!a.startsWith("#")&&a.includes("=")){const[i,...l]=a.split("="),d=l.join("=").trim().replace(/^["']|["']$/g,"");i.trim()&&(o[i.trim()]=d)}}),te={...te,...o},await Te(),document.getElementById("importEnvCard").style.display="none",document.getElementById("envFileInput").value="";const s=document.getElementById("envDropZoneFileName");s&&(s.textContent="",s.style.display="none"),p("Environment variables imported successfully!","success")}catch(t){console.error("Error importing .env file:",t),p("Failed to import .env file","error")}}function Yt(){const e=document.getElementById("envVarsList");if(e){if(xe.length===0){e.innerHTML=`
      <div class="empty-state">
        <p>No environment variables configured</p>
        <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.5rem;">
          Click "Add Variable" to create one, or import from a .env file
        </p>
            </div>
        `;return}e.innerHTML=`
    <table class="env-vars-table">
      <thead>
        <tr>
          <th class="name-col">Name</th>
          <th class="updated-col">Last updated</th>
          <th class="actions-col"></th>
        </tr>
      </thead>
      <tbody>
        ${xe.map((t,n)=>{const o=t.updated_at?new Date(t.updated_at).toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kathmandu"}):"Never updated",s=t.project_id?'<span style="font-size: 0.75rem; background: var(--primary); color: white; padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Project</span>':'<span style="font-size: 0.75rem; background: var(--bg-tertiary); color: var(--text-secondary); padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Global</span>';return`
            <tr>
              <td class="name-col">
                <span class="lock-icon">🔒</span>
                <span class="var-name">${b(t.key)}</span>
                ${s}
              </td>
              <td class="updated-col">
                <span class="updated-time">${o}</span>
              </td>
              <td class="actions-col">
                <button class="icon-btn edit-btn" onclick="editEnvVarModal('${b(t.key)}')" title="Edit">
                  ✏️
                </button>
                <button class="icon-btn delete-btn" onclick="deleteEnvVar('${b(t.key)}')" title="Delete">
                  🗑️
                </button>
              </td>
            </tr>
          `}).join("")}
      </tbody>
    </table>
  `}}function Kt(){De()}function De(e=null,t=""){const n=document.getElementById("envVarModal"),o=document.getElementById("modalVarKey"),s=document.getElementById("modalVarValue"),a=document.getElementById("modalTitle");e?(a.textContent="Update environment variable",o.value=e,o.readOnly=!0,s.value=t):(a.textContent="Add environment variable",o.value="",o.readOnly=!1,s.value=""),n.style.display="flex"}function Ke(){const e=document.getElementById("envVarModal");e.style.display="none"}async function Zt(){const e=document.getElementById("modalVarKey"),t=document.getElementById("modalVarValue"),n=e.value.trim(),o=t.value.trim();if(!n){p("Variable name is required","error");return}te[n]=o,await Te(),Ke()}function Ze(e){const t=te[e]||"";De(e,t)}async function Jt(e){Ze(e)}async function Qt(e){confirm(`Are you sure you want to delete ${e}?`)&&(delete te[e],await Te(),p("Environment variable deleted","success"))}function Xt(e){const n=document.querySelectorAll(".env-var-row")[e];if(!n)return;const o=n.querySelector(".env-var-value input");o.type==="password"?o.type="text":o.type="password"}async function Te(){try{const e=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!r||!r.id){p("No project selected","error");return}(await fetch("/api/env-vars",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e}`},body:JSON.stringify({variables:te,project_id:r.id})})).ok?(await Pe(),p("Environment variables saved successfully","success")):(console.error("Failed to save environment variables"),p("Failed to save environment variables","error"))}catch(e){console.error("Error saving environment variables:",e),p("Error saving environment variables","error")}}function en(){const e=document.getElementById("modalVarValue"),t=document.querySelector('#envVarModal button[onclick*="toggleModalValueVisibility"]');e&&t&&(e.type==="password"?(e.type="text",t.textContent="🙈 Hide"):(e.type="password",t.textContent="👁️ Show"))}function b(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}async function Je(){try{const e=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!e)return;const t=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${e}`}});if(t.ok){const n=await t.json(),o=document.getElementById("userName"),s=document.getElementById("userEmail"),a=document.getElementById("userAvatar");localStorage.setItem("displayName",n.display_name||""),localStorage.setItem("userEmail",n.email||""),o&&(o.textContent=n.display_name||n.username||"User"),cn(n.display_name||n.username||"User");const i=document.getElementById("sidebarSearch");if(i){const l=i.value.trim();(l===(n.username||"")||l===(n.display_name||""))&&(i.value="")}s&&(s.textContent=n.email||"Logged in"),a&&(n.avatar_url?(a.style.backgroundImage=`url(${n.avatar_url})`,a.style.backgroundSize="cover",a.style.backgroundPosition="center",a.textContent=""):(a.style.backgroundImage="",a.textContent=(n.display_name||n.username||"U").charAt(0).toUpperCase()))}else t.status===401&&(localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),he())}catch(e){console.error("Error loading user profile:",e)}}async function Qe(){try{const e=localStorage.getItem("access_token")||localStorage.getItem("authToken"),t=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${e}`}});if(t.ok){const n=await t.json(),o=document.getElementById("username"),s=document.getElementById("email"),a=document.getElementById("displayName");o&&(o.value=n.username||""),s&&(s.value=n.email||""),a&&(a.value=n.display_name||"");const i=document.getElementById("avatarPreview"),l=document.getElementById("avatarInitial"),d=document.getElementById("removeAvatarBtn");if(n.avatar_url&&i)i.src=n.avatar_url,i.style.display="block",l&&(l.style.display="none"),d&&(d.style.display="block");else if(l){const c=n.display_name&&n.display_name.charAt(0).toUpperCase()||n.username&&n.username.charAt(0).toUpperCase()||"S";l.textContent=c,l.style.display="block"}}}catch(e){console.error("Error loading profile:",e)}tn()}function tn(){const e=document.getElementById("profileForm"),t=document.getElementById("avatarFile"),n=document.getElementById("removeAvatarBtn");e&&e.addEventListener("submit",ln),t&&t.addEventListener("change",an),n&&n.addEventListener("click",rn);const o=document.getElementById("changePasswordBtn"),s=document.getElementById("closePasswordModal"),a=document.getElementById("cancelPasswordBtn"),i=document.getElementById("updatePasswordBtn"),l=document.getElementById("passwordModal"),d=document.getElementById("modalNewPassword"),c=document.getElementById("strengthFill");o&&o.addEventListener("click",()=>{l&&(l.style.display="flex")}),s&&s.addEventListener("click",()=>{l&&(l.style.display="none")}),a&&a.addEventListener("click",()=>{l&&(l.style.display="none")}),l&&l.addEventListener("click",y=>{y.target===l&&(l.style.display="none")}),d&&d.addEventListener("input",y=>{const f=y.target.value;let g=0;f.length>=8&&(g+=25),/[a-z]/.test(f)&&/[A-Z]/.test(f)&&(g+=25),/\d/.test(f)&&(g+=25),/[!@#$%^&*(),.?":{}|<>]/.test(f)&&(g+=25),c&&(c.style.width=`${g}%`,g<50?c.style.background="#ef4444":g<75?c.style.background="#f59e0b":c.style.background="#10b981")}),i&&i.addEventListener("click",sn);const m=document.getElementById("cancelProfileBtn");m&&m.addEventListener("click",async()=>{await Qe()});const u=document.getElementById("deleteAccountBtn");u&&u.addEventListener("click",async()=>{await nn()})}async function nn(){if(await on())try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t){p("You must be logged in to delete your account","error");return}const n=document.getElementById("deleteAccountBtn");n&&(n.disabled=!0,n.textContent="Deleting Account...");const o=await fetch("/api/user/account",{method:"DELETE",headers:{Authorization:`Bearer ${t}`}}),s=await o.json();o.ok?(p("Account deleted successfully","success"),localStorage.clear(),setTimeout(()=>{window.location.href="/login"},2e3)):(p(s.detail||s.message||"Failed to delete account","error"),n&&(n.disabled=!1,n.textContent="Delete Account"))}catch(t){console.error("Error deleting account:",t),p("Network error. Please try again.","error");const n=document.getElementById("deleteAccountBtn");n&&(n.disabled=!1,n.textContent="Delete Account")}}function on(){return new Promise(e=>{const t=document.createElement("div");t.style.cssText=`
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
    `;const n=document.createElement("div");n.style.cssText=`
      background: white;
      border-radius: 12px;
      padding: 2rem;
      max-width: 480px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `,n.innerHTML=`
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
    `,t.appendChild(n),document.body.appendChild(t),n.querySelector("#cancelDeleteBtn").addEventListener("click",()=>{document.body.removeChild(t),e(!1)}),n.querySelector("#confirmDeleteBtn").addEventListener("click",()=>{document.body.removeChild(t),e(!0)}),t.addEventListener("click",i=>{i.target===t&&(document.body.removeChild(t),e(!1))});const a=i=>{i.key==="Escape"&&(document.body.removeChild(t),document.removeEventListener("keydown",a),e(!1))};document.addEventListener("keydown",a)})}async function sn(){const e=document.getElementById("modalCurrentPassword"),t=document.getElementById("modalNewPassword"),n=document.getElementById("modalConfirmPassword"),o=document.getElementById("passwordModal");if(!e||!t||!n)return;const s=e.value,a=t.value,i=n.value;if(!s||!a||!i){p("Please fill in all password fields","error");return}if(a!==i){p("New passwords do not match","error");return}if(a.length<8){p("Password must be at least 8 characters","error");return}try{const l=localStorage.getItem("access_token")||localStorage.getItem("authToken"),d=new FormData;d.append("current_password",s),d.append("new_password",a);const c=await fetch("/api/user/profile",{method:"PUT",headers:{Authorization:`Bearer ${l}`},body:d}),m=await c.json();if(c.ok){p("Password updated successfully!","success"),o&&(o.style.display="none"),e.value="",t.value="",n.value="";const u=document.getElementById("strengthFill");u&&(u.style.width="0%")}else p(m.detail||m.message||"Failed to update password","error")}catch(l){console.error("Error updating password:",l),p("Network error. Please try again.","error")}}function an(e){const t=e.target.files[0];if(t){const n=new FileReader;n.onload=o=>{const s=document.getElementById("avatarPreview"),a=document.getElementById("avatarInitial");s&&(s.src=o.target.result,s.style.display="block"),a&&(a.style.display="none");const i=document.getElementById("removeAvatarBtn");i&&(i.style.display="block")},n.readAsDataURL(t)}}function rn(){const e=document.getElementById("avatarPreview"),t=document.getElementById("avatarInitial");e&&(e.src="",e.style.display="none"),t&&(t.style.display="block");const n=document.getElementById("removeAvatarBtn");n&&(n.style.display="none");const o=document.getElementById("avatarFile");o&&(o.value="")}async function ln(e){e.preventDefault();const t=document.getElementById("profileMessage");t&&(t.style.display="none");const n=new FormData,o=document.getElementById("email"),s=document.getElementById("displayName");o&&n.append("email",o.value),s&&n.append("display_name",s.value);const a=document.getElementById("avatarFile");a&&a.files[0]&&n.append("avatar",a.files[0]);const i=document.getElementById("avatarPreview");i&&i.style.display==="none"&&n.append("remove_avatar","true");try{const l=localStorage.getItem("access_token")||localStorage.getItem("authToken"),d=await fetch("/api/user/profile",{method:"PUT",headers:{Authorization:`Bearer ${l}`},body:n}),c=await d.json();if(d.ok)t&&(t.textContent="Profile updated successfully!",t.className="profile-message success",t.style.display="block"),c.username&&localStorage.setItem("username",c.username),await Je(),p("Profile updated successfully!","success");else{const m=c.detail||c.message||"Failed to update profile";t&&(t.textContent=m,t.className="profile-message error",t.style.display="block"),p(m,"error"),console.error("Profile update failed:",c)}}catch(l){console.error("Error updating profile:",l),t&&(t.textContent="Network error. Please try again.",t.className="profile-message error",t.style.display="block"),p("Network error. Please try again.","error")}}window.destroyDeployment=Ht;window.selectRepository=qt;window.importRepository=Wt;window.editEnvVar=Jt;window.deleteEnvVar=Qt;window.toggleEnvVarVisibility=Xt;window.saveEnvVarFromModal=Zt;window.closeEnvVarModal=Ke;window.toggleModalValueVisibility=en;window.editEnvVarModal=Ze;window.showEnvVarModal=De;window.selectProject=je;window.showProjectSidebar=Se;window.hideProjectSidebar=ht;window.openProject=At;window.loadUserProfileIntoProjectSidebar=We;window.openProjectSite=gt;window.deleteProject=tt;window.toggleRepositorySelection=Vt;window.confirmSplitImport=Ot;window.openProjectNameModal=Oe;window.openSite=jt;function cn(e){const t=document.getElementById("teamName");t&&(t.textContent=`${e}'s team`),document.querySelectorAll(".project-owner").forEach(o=>{o.textContent=`${e}'s team`})}function dn(e){if(e==null)return null;if(typeof e!="string")return e;const t=e.trim();if(!t)return null;const n=t.indexOf("{");if(n===-1)return{message:t};const o=t.slice(n);try{return JSON.parse(o)}catch{return{message:t}}}let H=null,se=!1,Z=[];function Xe(e){H&&H.close();const n=`${window.location.protocol==="https:"?"wss:":"ws:"}//${window.location.host}/ws/project/${e}/logs`;H=new WebSocket(n),H.onopen=()=>{console.log(`Project logs WebSocket connected for project ${e}`),K("Connected to container logs stream","success"),Z.length>0&&(Z.forEach(o=>K(o.message,o.type)),Z=[]),mn()},H.onmessage=o=>{const s=dn(o.data);!s||!s.message||(se?Z.push({message:s.message,type:s.type||"info"}):K(s.message,s.type||"info"))},H.onerror=o=>{console.error("Project logs WebSocket error:",o),K("WebSocket connection error","error")},H.onclose=()=>{console.log("Project logs WebSocket disconnected"),K("Disconnected from logs stream","warning"),setTimeout(()=>{const o=document.getElementById("page-project-logs");o&&o.style.display!=="none"&&r&&Xe(r.id)},3e3)}}function K(e,t="info"){const n=document.getElementById("projectLogsContent");if(!n)return;const o=new Date().toLocaleString("en-US",{timeZone:"Asia/Kathmandu",timeStyle:"medium",dateStyle:"short"}),s=document.createElement("div");s.className=`log-entry ${t}`,s.innerHTML=`
    <span class="log-timestamp">[${o}]</span>
    <span class="log-message">${b(e)}</span>
  `,n.appendChild(s),n.scrollTop=n.scrollHeight;const a=1e3,i=n.querySelectorAll(".log-entry");i.length>a&&i[0].remove()}function mn(){const e=document.getElementById("clearProjectLogsBtn"),t=document.getElementById("toggleProjectLogsBtn");if(e&&(e.replaceWith(e.cloneNode(!0)),document.getElementById("clearProjectLogsBtn").addEventListener("click",()=>{const o=document.getElementById("projectLogsContent");o&&(o.innerHTML="",Z=[],K("Logs cleared","info"))})),t){t.replaceWith(t.cloneNode(!0));const n=document.getElementById("toggleProjectLogsBtn");n.addEventListener("click",()=>{se=!se,n.textContent=se?"Resume":"Pause",!se&&Z.length>0&&(Z.forEach(o=>K(o.message,o.type)),Z=[]),K(se?"Logs paused":"Logs resumed","info")})}}window.addEventListener("beforeunload",()=>{logsWebSocket&&logsWebSocket.close(),H&&H.close(),A&&A.close()});let A=null,ue=!1,ke=[];function pn(){document.querySelectorAll(".page").forEach(t=>{t.style.display="none"});const e=document.getElementById("page-deployment-logs");if(e){e.style.display="block",document.getElementById("pageTitle").textContent="Deployment Logs";const t=document.getElementById("deploymentLogsContent");t&&(t.innerHTML='<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Connecting to deployment stream... Logs will appear here.</p>');const n=document.getElementById("deployment-status-badge"),o=document.getElementById("deployment-status-text");n&&(n.className="status-badge status-info"),o&&(o.textContent="Deploying...")}}function un(){A&&A.close();const e=window.location.protocol==="https:"?"wss:":"ws:",t=`deploy-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,n=`${e}//${window.location.host}/ws/${t}`;A=new WebSocket(n),A.onopen=()=>{console.log("Deployment logs WebSocket connected"),V("Connected to deployment stream","success")},A.onmessage=o=>{try{const s=JSON.parse(o.data);s.message&&(V(s.message,s.type||"info"),s.message.includes("Deployment successful")||s.message.includes("🎉")?ae("success","Deployment Successful"):s.message.includes("failed")||s.message.includes("❌")?ae("error","Deployment Failed"):(s.message.includes("Deploying")||s.message.includes("🚀"))&&ae("info","Deploying..."))}catch{V(o.data,"info")}},A.onerror=o=>{console.error("Deployment logs WebSocket error:",o),V("WebSocket connection error","error")},A.onclose=()=>{console.log("Deployment logs WebSocket disconnected"),V("Disconnected from deployment stream","warning")}}function V(e,t="info"){const n=document.getElementById("deploymentLogsContent");if(!n)return;n.querySelector('p[style*="text-align: center"]')&&(n.innerHTML="");const o=document.createElement("div");o.className=`log-entry log-${t}`,o.style.cssText="padding: 0.5rem; border-bottom: 1px solid var(--border-light); font-family: monospace; font-size: 0.875rem;";const s=new Date().toLocaleTimeString();o.innerHTML=`<span style="color: var(--text-secondary); margin-right: 0.5rem;">[${s}]</span><span>${b(e)}</span>`,n.appendChild(o),n.scrollTop=n.scrollHeight}function ae(e,t){const n=document.getElementById("deployment-status-badge"),o=document.getElementById("deployment-status-text");n&&(n.className=`status-badge status-${e}`),o&&(o.textContent=t)}async function yn(e){if(!e)return!1;try{const t=await fetch(e,{method:"HEAD",mode:"no-cors",cache:"no-cache"});return!0}catch{return new Promise(n=>{const o=new Image,s=setTimeout(()=>{n(!1)},5e3);o.onload=()=>{clearTimeout(s),n(!0)},o.onerror=()=>{clearTimeout(s),n(e.startsWith("http://")||e.startsWith("https://"))};const a=e.endsWith("/")?e+"favicon.ico":e+"/favicon.ico";o.src=a})}}function gn(e){A&&(A.close(),A=null),document.querySelectorAll(".page").forEach(s=>{s.style.display="none"});const t=document.getElementById("page-deployment-success");if(t){t.style.display="block",document.getElementById("pageTitle").textContent="Deployment Successful";const s=(r==null?void 0:r.name)||e.project_name||"Untitled Project",a=e.deployed_url||"";document.getElementById("success-project-name").textContent=s,document.getElementById("success-deployed-url").textContent=a||"Not available";const i=document.getElementById("success-status");if(a?(i.textContent="Checking...",i.style.color="var(--text-secondary)",yn(a).then(l=>{if(l)i.textContent="Running",i.style.color="var(--success)";else{i.textContent="Service Unavailable",i.style.color="var(--error)";const d=document.getElementById("deployment-info");if(d&&!d.querySelector(".service-warning")){const c=document.createElement("div");c.className="service-warning",c.style.cssText="margin-top: 1rem; padding: 1rem; background: var(--warning-bg, #fff3cd); border-left: 4px solid var(--warning, #ffc107); border-radius: 4px; color: var(--text-primary);",c.innerHTML=`
              <strong>⚠️ Service Check Failed</strong>
              <p style="margin: 0.5rem 0 0 0; font-size: 0.875rem;">
                The service may be starting up or experiencing issues. The auto-restart system will attempt to fix this automatically.
                You can try refreshing this page in a few moments.
              </p>
            `,d.appendChild(c)}}}).catch(()=>{i.textContent="Status Unknown",i.style.color="var(--text-secondary)"})):(i.textContent="Not Deployed",i.style.color="var(--text-secondary)"),a){const l=document.getElementById("website-preview");document.getElementById("website-preview-container");const d=document.getElementById("iframe-fallback"),c=document.getElementById("open-site-fallback-btn");if(l){let u;const y=()=>{d&&(d.style.display="flex"),l&&(l.style.display="none")};l.onload=()=>{var f;clearTimeout(u);try{!(l.contentDocument||((f=l.contentWindow)==null?void 0:f.document))&&l.contentWindow&&setTimeout(()=>{try{const v=l.contentWindow.location.href;(!v||v==="about:blank")&&y()}catch{y()}},1e3)}catch{setTimeout(y,2e3)}},l.onerror=()=>{clearTimeout(u),y()},u=setTimeout(()=>{var f;try{l.contentDocument||((f=l.contentWindow)==null?void 0:f.document)||y()}catch{y()}},3e3),l.src=a}c&&(c.onclick=()=>{window.open(a,"_blank")});const m=document.getElementById("open-deployed-site-btn");m&&(m.onclick=()=>{window.open(a,"_blank")})}else{const l=document.getElementById("website-preview-container");l&&(l.style.display="none")}}const n=document.getElementById("clearDeploymentLogsBtn"),o=document.getElementById("toggleDeploymentLogsBtn");n&&(n.onclick=()=>{const s=document.getElementById("deploymentLogsContent");s&&(s.innerHTML="")}),o&&(o.onclick=()=>{ue=!ue,o.textContent=ue?"Resume":"Pause",!ue&&ke.length>0&&(ke.forEach(s=>V(s.message,s.type)),ke=[])})}function fn(){const e=document.getElementById("sidebarSearch"),t=document.getElementById("commandPalette"),n=document.getElementById("commandSearchInput"),o=document.querySelectorAll(".command-item");let s=-1;function a(){t&&(t.style.display="flex",n&&(n.focus(),n.value=""),s=-1,l())}function i(){t&&(t.style.display="none",s=-1)}function l(){const c=Array.from(o).filter(m=>m.style.display!=="none");o.forEach((m,u)=>{c.indexOf(m)===s?(m.classList.add("selected"),m.scrollIntoView({block:"nearest",behavior:"smooth"})):m.classList.remove("selected")})}function d(c){switch(i(),c){case"deploy":case"nav-deploy":window.router&&window.router.navigate("/deploy");break;case"add-env-var":window.showEnvVarModal&&window.showEnvVarModal();break;case"search-repos":case"nav-repositories":window.router&&window.router.navigate("/repositories");break;case"nav-projects":window.router&&window.router.navigate("/");break;case"nav-applications":window.router&&window.router.navigate("/applications");break;case"nav-history":window.router&&window.router.navigate("/history");break;case"nav-env-vars":window.router&&window.router.navigate("/env-vars");break;case"nav-settings":window.router&&window.router.navigate("/settings");break}}document.addEventListener("keydown",c=>{var m;if((c.metaKey||c.ctrlKey)&&c.key==="k"&&(c.preventDefault(),t&&t.style.display==="none"?a():i()),c.key==="Escape"&&t&&t.style.display!=="none"&&i(),t&&t.style.display!=="none"){const u=Array.from(o).filter(y=>y.style.display!=="none");if(c.key==="ArrowDown")c.preventDefault(),s=Math.min(s+1,u.length-1),l();else if(c.key==="ArrowUp")c.preventDefault(),s=Math.max(s-1,-1),l();else if(c.key==="Enter"&&s>=0){c.preventDefault();const f=(m=Array.from(o).filter(g=>g.style.display!=="none")[s])==null?void 0:m.getAttribute("data-action");f&&d(f)}}}),e&&e.addEventListener("click",a),t&&t.addEventListener("click",c=>{c.target===t&&i()}),o.forEach(c=>{c.addEventListener("click",()=>{const m=c.getAttribute("data-action");m&&d(m)})}),n&&n.addEventListener("input",c=>{const m=c.target.value.toLowerCase();o.forEach(u=>{u.querySelector(".command-text").textContent.toLowerCase().includes(m)?u.style.display="flex":u.style.display="none"}),s=-1,l()})}function vn(){document.querySelectorAll(".page").forEach(n=>{n.style.display="none"});const e=document.getElementById("page-new-deploy");e&&(e.style.display="block",hn());const t=document.getElementById("pageTitle");t&&(t.textContent="New Deploy")}function hn(){const e=document.getElementById("single-repo-input"),t=document.getElementById("split-repo-inputs"),n=document.getElementById("split-toggle-btn"),o=document.getElementById("new-deploy-git-url"),s=document.getElementById("new-deploy-frontend-url"),a=document.getElementById("new-deploy-backend-url");e&&(e.style.display="block"),t&&(t.style.display="none"),n&&n.classList.remove("active"),o&&(o.value=""),s&&(s.value=""),a&&(a.value="")}window.toggleSplitMode=function(){const e=document.getElementById("single-repo-input"),t=document.getElementById("split-repo-inputs"),n=document.getElementById("split-toggle-btn");if(!e||!t||!n)return;t.style.display!=="none"?(e.style.display="block",t.style.display="none",n.classList.remove("active")):(e.style.display="none",t.style.display="block",n.classList.add("active"))};window.handleContinueDeploy=async function(){const e=document.getElementById("single-repo-input"),t=document.getElementById("split-repo-inputs"),n=document.getElementById("new-deploy-git-url"),o=document.getElementById("new-deploy-frontend-url"),s=document.getElementById("new-deploy-backend-url");if(!e||!t||!n||!o||!s)return;if(t.style.display!=="none"){const i=o.value.trim(),l=s.value.trim();if(!i||!l){p("Please enter both frontend and backend repository URLs","error");return}U.navigate("/deploy"),setTimeout(()=>{const d=document.getElementById("deploy-type"),c=document.getElementById("deploy-type-group"),m=document.getElementById("single-repo-group"),u=document.getElementById("split-deploy-layout"),y=document.getElementById("frontend-url"),f=document.getElementById("backend-url");d&&(d.value="split"),c&&(c.style.display="block"),m&&(m.style.display="none"),u&&(u.style.display="block"),y&&(y.value=i),f&&(f.value=l),d&&d.dispatchEvent(new Event("change"))},100)}else{const i=n.value.trim();if(!i){p("Please enter a Git repository URL","error");return}U.navigate("/deploy"),setTimeout(()=>{const l=document.getElementById("git-url"),d=document.getElementById("deploy-type"),c=document.getElementById("git-url-section");l&&(l.value=i),d&&(d.value="single"),c&&(c.style.display="block")},100)}};
