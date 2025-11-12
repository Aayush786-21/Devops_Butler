import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */class We{constructor(){this.routes={"/":"projects","/deploy":"deploy","/history":"history","/repositories":"repositories","/domain":"domain","/env-vars":"env-vars","/settings":"settings","/logs":"logs"},this.currentPage=null,this.init()}init(){document.querySelectorAll(".nav-item").forEach(e=>{e.addEventListener("click",n=>{n.preventDefault();const o=e.getAttribute("href");this.navigate(o)})}),window.addEventListener("popstate",()=>{this.loadPage(window.location.pathname)}),this.loadPage(window.location.pathname)}navigate(e){window.history.pushState({},"",e),this.loadPage(e)}loadPage(e){const n=this.routes[e]||"dashboard";if(n==="deploy"){i=null;const o=document.getElementById("projectSidebar");o&&(o.style.display="none");const s=document.getElementById("sidebar");s&&(s.style.display="block")}this.showPage(n),this.updateActiveNav(e),this.updatePageTitle(n),window.scrollTo({top:0,behavior:"smooth"})}showPage(e){document.querySelectorAll(".page").forEach(o=>{o.style.display="none"});const n=document.getElementById(`page-${e}`);if(n){if(n.style.display="block",e==="deploy"){const o=document.getElementById("deploy-status"),s=document.getElementById("deploy-success");o&&(o.textContent="",o.style.color=""),s&&(s.style.display="none")}}else{const o=document.getElementById("page-dashboard");o&&(o.style.display="block")}this.currentPage=e,this.loadPageData(e)}updateActiveNav(e){document.querySelectorAll(".nav-item").forEach(n=>{n.classList.remove("active"),n.getAttribute("href")===e&&n.classList.add("active")})}updatePageTitle(e){const n={projects:"Projects",deploy:"Deploy",history:"History",repositories:"Repositories",domain:"Domain","env-vars":"Environmental Variables",settings:"Settings",logs:"Logs"};document.getElementById("pageTitle").textContent=n[e]||"Dashboard"}loadPageData(e){switch(e){case"dashboard":ve();break;case"projects":O(),ve();break;case"history":je();break;case"repositories":Nt();break;case"domain":it();break;case"env-vars":Ce();break;case"settings":ze();break;case"logs":Kt();break}}}const U=new We;window.router=U;async function Ye(t){const e=await Je();if(!e)return;const n=P.find(a=>a.id==t),o=n?n.name:"this project";if(await Ke(o))try{console.log("Deleting project with token:",e.substring(0,20)+"...");const a=await fetch(`/projects/${t}`,{method:"DELETE",headers:{Authorization:`Bearer ${e}`}});if(console.log("Delete response status:",a.status),!a.ok){const r=await a.json().catch(()=>({}));if(console.error("Delete error response:",r),a.status===401){p("Session expired. Please login again.","error"),localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),setTimeout(()=>{window.location.href="/login"},2e3);return}throw new Error(r.detail||"Failed to delete project")}P=P.filter(r=>r.id!=t),H=H.filter(r=>r.id!=t),J(H),p("Project deleted","success")}catch(a){console.error("Delete project error:",a),p(`Delete failed: ${a.message}`,"error")}}function Ke(t){return new Promise(e=>{const n=document.createElement("div");n.className="modal-overlay";const o=document.createElement("div");o.className="delete-confirmation-modal",o.innerHTML=`
      <h3>Delete Project</h3>
      <p>
        Are you sure you want to delete <strong>${B(t)}</strong>?<br>
        This will stop the process and remove the project.
      </p>
      <div class="delete-confirmation-actions">
        <button class="cancel-btn">Cancel</button>
        <button class="delete-btn">Delete</button>
      </div>
    `,n.appendChild(o),document.body.appendChild(n);const s=o.querySelector(".cancel-btn"),a=o.querySelector(".delete-btn"),r=()=>{document.body.removeChild(n)};s.onclick=()=>{r(),e(!1)},a.onclick=()=>{r(),e(!0)},n.onclick=l=>{l.target===n&&(r(),e(!1))},a.focus()})}function Ze(t){try{const n=JSON.parse(atob(t.split(".")[1])).exp*1e3,o=Date.now();return n<o+5*60*1e3}catch{return!0}}async function Je(){const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");return!t||Ze(t)?(p("Session expired. Please login again.","error"),localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),setTimeout(()=>{window.location.href="/login"},2e3),null):t}let te=localStorage.getItem("access_token")||localStorage.getItem("authToken"),Ee=localStorage.getItem("username");document.addEventListener("DOMContentLoaded",()=>{pe(),window.location.pathname==="/login"||window.location.pathname.includes("login.html")||setTimeout(()=>{if(te&&Ee){Qe(),Jt();const e=document.getElementById("page-projects");e&&window.location.pathname==="/"&&(e.style.display="block")}},100)});function pe(){const t=document.getElementById("userSection"),e=document.getElementById("authButtons"),n=document.getElementById("logoutBtn"),o=document.getElementById("newDeployBtn");document.getElementById("userName"),document.getElementById("userEmail"),document.getElementById("userAvatar");const s=window.location.pathname==="/login"||window.location.pathname.includes("login.html");te&&Ee?(t.style.display="flex",e.style.display="none",n.style.display="block",o.style.display="block",qe(),O(),s&&(window.location.href="/")):(t.style.display="none",e.style.display="block",n.style.display="none",o.style.display="none",s||(window.location.href="/login"))}function Qe(){var a,r;document.getElementById("logoutBtn").addEventListener("click",()=>{localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),te=null,Ee=null,pe(),p("Logged out successfully","success"),U.navigate("/")});const t=document.getElementById("projectsSearch");t&&t.addEventListener("input",l=>{const d=l.target.value.toLowerCase();H=P.filter(c=>c.name.toLowerCase().includes(d)||c.repository&&c.repository.toLowerCase().includes(d)),J(H)});const e=document.getElementById("addProjectBtn");e&&e.addEventListener("click",()=>{window.router&&window.router.navigate("/deploy")});const n=document.getElementById("browseUploadLink");n&&n.addEventListener("click",l=>{l.preventDefault(),window.router&&window.router.navigate("/deploy")}),document.getElementById("newDeployBtn").addEventListener("click",()=>{i=null;const l=document.getElementById("projectSidebar");l&&(l.style.display="none");const d=document.getElementById("sidebar");d&&(d.style.display="block"),U.navigate("/deploy")});const o=document.getElementById("deployForm");o&&o.addEventListener("submit",St),ht();const s=document.getElementById("deploy-type");s&&s.addEventListener("change",l=>{const d=document.getElementById("single-repo-group"),c=document.getElementById("git-url-section"),m=document.getElementById("split-deploy-layout"),u=document.getElementById("git-url");l.target.value==="split"?(d&&(d.style.display="none"),c&&(c.style.display="none"),m&&(m.style.display="block"),u&&u.removeAttribute("required")):(d&&(d.style.display="block"),c&&(c.style.display="block"),m&&(m.style.display="none"),u&&u.setAttribute("required","required"))}),(a=document.getElementById("clearHistoryBtn"))==null||a.addEventListener("click",Ct),(r=document.getElementById("searchReposBtn"))==null||r.addEventListener("click",Re),Xe(),tt()}function Xe(){const t=document.querySelector(".search-input"),e=document.getElementById("spotlightModal"),n=document.getElementById("spotlightSearch"),o=document.getElementById("spotlightResults");!t||!e||!n||!o||(t.addEventListener("click",et),e.addEventListener("click",s=>{s.target===e&&fe()}),n.addEventListener("input",nt),o.addEventListener("click",at),document.addEventListener("keydown",s=>{s.key==="Escape"&&e.style.display!=="none"&&fe()}))}function et(){const t=document.getElementById("spotlightModal"),e=document.getElementById("spotlightSearch");t.style.display="flex",setTimeout(()=>{e.focus()},100)}function fe(){const t=document.getElementById("spotlightModal"),e=document.getElementById("spotlightSearch"),n=document.getElementById("spotlightResults");t.style.display="none",e.value="",n.innerHTML=`
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
  `}function tt(){const t=document.getElementById("domainWarningModal");if(!t||t.dataset.bound==="true")return;t.dataset.bound="true";const e=document.getElementById("domainModalCancelBtn"),n=document.getElementById("domainModalOpenConfigBtn"),o=()=>{t.style.display="none"};e&&e.addEventListener("click",o),n&&n.addEventListener("click",()=>{o(),Ie("domain-config"),Me()}),t.addEventListener("click",s=>{s.target===t&&o()})}function nt(t){const e=t.target.value.toLowerCase().trim(),n=document.getElementById("spotlightResults");if(!e){n.innerHTML=`
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
    `;return}const o=ot(e);st(o)}function ot(t){const e={projects:[],actions:[],navigation:[]};P&&P.length>0&&(e.projects=P.filter(s=>s.name.toLowerCase().includes(t)||s.repository&&s.repository.toLowerCase().includes(t)));const n=[{name:"New Deploy",action:"new-deploy",icon:"🚀"},{name:"Repositories",action:"repositories",icon:"📁"},{name:"History",action:"history",icon:"📜"},{name:"Settings",action:"settings",icon:"⚙️"},{name:"Domain",action:"domain",icon:"🌐"}];e.actions=n.filter(s=>s.name.toLowerCase().includes(t));const o=[{name:"Projects",action:"projects",icon:"📊"},{name:"Repositories",action:"repositories",icon:"📁"},{name:"History",action:"history",icon:"📜"},{name:"Domain",action:"domain",icon:"🌐"},{name:"Settings",action:"settings",icon:"⚙️"}];return e.navigation=o.filter(s=>s.name.toLowerCase().includes(t)),e}function st(t){const e=document.getElementById("spotlightResults");let n='<div class="search-results">';t.projects.length>0&&(n+='<div class="search-category">',n+='<div class="search-category-title">Projects</div>',t.projects.forEach(o=>{const s=o.status==="running"?"🚀":"📦",a=o.status==="running"?"RUNNING":o.status==="failed"?"FAILED":"IMPORTED";n+=`
        <div class="search-result-item" data-type="project" data-id="${o.id}">
          <span class="search-result-icon">${s}</span>
          <div class="search-result-content">
            <div class="search-result-title">${B(o.name)}</div>
            <div class="search-result-subtitle">${o.repository||"No repository"}</div>
          </div>
          <span class="search-result-badge">${a}</span>
        </div>
      `}),n+="</div>"),t.actions.length>0&&(n+='<div class="search-category">',n+='<div class="search-category-title">Actions</div>',t.actions.forEach(o=>{n+=`
        <div class="search-result-item" data-type="action" data-action="${o.action}">
          <span class="search-result-icon">${o.icon}</span>
          <div class="search-result-content">
            <div class="search-result-title">${o.name}</div>
          </div>
        </div>
      `}),n+="</div>"),t.navigation.length>0&&(n+='<div class="search-category">',n+='<div class="search-category-title">Navigation</div>',t.navigation.forEach(o=>{n+=`
        <div class="search-result-item" data-type="navigation" data-action="${o.action}">
          <span class="search-result-icon">${o.icon}</span>
          <div class="search-result-content">
            <div class="search-result-title">${o.name}</div>
          </div>
        </div>
      `}),n+="</div>"),t.projects.length===0&&t.actions.length===0&&t.navigation.length===0&&(n=`
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <p>No results found for "${B(document.getElementById("spotlightSearch").value)}"</p>
      </div>
    `),n+="</div>",e.innerHTML=n}function at(t){const e=t.target.closest(".suggestion-item, .search-result-item");if(!e)return;const n=e.dataset.action,o=e.dataset.type,s=e.dataset.id;if(fe(),o==="project"&&s)ke(parseInt(s));else if(n)switch(n){case"new-deploy":window.router&&window.router.navigate("/deploy");break;case"repositories":window.router&&window.router.navigate("/repositories");break;case"history":window.router&&window.router.navigate("/history");break;case"domain":window.router&&window.router.navigate("/domain");break;case"settings":window.router&&window.router.navigate("/settings");break;case"projects":window.router&&window.router.navigate("/projects");break}}function it(){document.getElementById("page-domain")}let re=null;async function ve(){if(!(localStorage.getItem("access_token")||localStorage.getItem("authToken"))){const e=document.getElementById("vmStatusCard");e&&(e.style.display="none");return}try{const e=await fetch("/api/vm-status",{headers:N()});if(!e.ok){if(e.status===401){const o=document.getElementById("vmStatusCard");o&&(o.style.display="none");return}throw new Error("Failed to fetch VM status")}const n=await e.json();rt(n.vm_status,n.message),n.vm_status==="creating"?re||(re=setInterval(()=>{ve()},5e3)):re&&(clearInterval(re),re=null)}catch(e){console.error("Error loading VM status:",e);const n=document.getElementById("vmStatusCard");n&&(n.style.display="none")}}function rt(t,e){$e("vmStatusCard","vmStatusIcon","vmStatusSpinner","vmStatusMessage","vmStatusProgress","vmProgressFill","vmProgressText","dashboardActions",t,e),$e("vmStatusCardProjects","vmStatusIconProjects","vmStatusSpinnerProjects","vmStatusMessageProjects","vmStatusProgressProjects","vmProgressFillProjects","vmProgressTextProjects",null,t,e)}function $e(t,e,n,o,s,a,r,l,d,c){const m=document.getElementById(t),u=document.getElementById(e),y=document.getElementById(n),f=document.getElementById(o),v=document.getElementById(s),k=document.getElementById(a),S=document.getElementById(r),_=l?document.getElementById(l):null;m&&(m.style.display="block",f&&(f.textContent=c),d==="creating"?(y&&(y.textContent="⏳",y.className="vm-status-spinner spinning"),u&&(u.className="vm-status-icon vm-status-creating"),v&&(v.style.display="block",k&&(k.style.width="100%",k.className="vm-progress-fill vm-progress-indeterminate"),S&&(S.textContent="Creating your virtual machine... This may take 2-5 minutes.")),_&&(_.style.display="none")):d==="ready"?(y&&(y.textContent="✅",y.className="vm-status-spinner"),u&&(u.className="vm-status-icon vm-status-ready"),v&&(v.style.display="none"),_&&(_.style.display="grid")):d==="failed"&&(y&&(y.textContent="❌",y.className="vm-status-spinner"),u&&(u.className="vm-status-icon vm-status-failed"),v&&(v.style.display="none"),_&&(_.style.display="grid")))}function N(){const t={},e=localStorage.getItem("access_token")||localStorage.getItem("authToken");return e&&(t.Authorization=`Bearer ${e}`),t}let P=[],H=[];async function O(){const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t){J([]);return}ct();try{const e=await fetch("/deployments",{headers:{Authorization:`Bearer ${t}`}});e.ok?(P=(await e.json()).map(o=>{var q;const s=o.git_url||"",a=s,r=s?(q=String(s).split("/").pop())==null?void 0:q.replace(/\.git$/,""):null,l=o.app_name||r||o.container_name||"Untitled Project",d=(o.status||"").toLowerCase();let c;d==="running"?c="running":d==="failed"||d==="error"?c="failed":c="imported";let m=!1,u="single",y=null,f=null;const v=String(o.git_url||""),k=v.startsWith("split::"),S=!o.parent_project_id&&!o.component_type;if(k){m=!0,u="split";try{const L=v.replace("split::","").split("|");L.length===2&&(y=L[0],f=L[1])}catch{}}else if(d==="imported_split")m=!0,u="split";else if(S&&v.includes("|")){m=!0,u="split";try{const L=v.split("|");L.length===2&&(y=L[0],f=L[1])}catch{}}const K=o.custom_domain&&o.domain_status&&o.domain_status.toLowerCase()==="active"?`https://${o.custom_domain}`:o.deployed_url||o.app_url||null;return{id:o.id,name:l,status:c,url:K,createdAt:o.created_at,updatedAt:o.updated_at,repository:a,repository_url:a,git_url:s,project_type:u,isSplit:m,frontend_url:y,backend_url:f,processPid:o.process_pid||null,port:o.port||null,startCommand:o.start_command||null,buildCommand:o.build_command||null,isRunning:o.is_running||!1,custom_domain:o.custom_domain||null,domain_status:o.domain_status||null,last_domain_sync:o.last_domain_sync||null}}),H=[...P],J(H)):J([])}catch(e){console.error("Error loading projects:",e),J([])}}function J(t){const e=document.getElementById("projectsGrid");if(e){if(t.length===0){e.innerHTML=`
      <div class="empty-state">
        <p>No projects found</p>
        <button class="btn-primary" onclick="if(window.router){window.router.navigate('/deploy');}else{window.location.href='/deploy';}">Create First Project</button>
      </div>
    `;return}e.innerHTML=t.map(n=>{const o=n.status==="running"?"status-success":n.status==="failed"?"status-error":"status-info",s=n.status==="running"?"Running":n.status==="failed"?"Failed":"Imported",a=n.status==="running"?"🚀":"📦",r=n.updatedAt?X(n.updatedAt):"Recently";return`
      <div class="project-card" data-project-id="${n.id}" onclick="selectProject(${n.id})">
        <div class="project-header">
          <div class="project-icon">${a}</div>
          <div class="project-status ${o}">${s}</div>
          </div>
        
        <div class="project-info">
          <h3 class="project-name">${B(n.name)}</h3>
          <div class="project-meta">
            <svg class="icon-clock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12,6 12,12 16,14"></polyline>
            </svg>
            <span>Updated ${r}</span>
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
      `}).join("")}}async function lt(t){try{const e=P.find(o=>o.id===t);if(!e){p("Project not found","error");return}const n=Ue(e.url);if(!n){p("Project URL not available. Make sure the project is deployed.","error");return}window.open(n,"_blank"),p(`Opening ${e.name}...`,"info")}catch(e){console.error("Error opening project site:",e),p("Failed to open project site: "+e.message,"error")}}function ct(){const t=document.getElementById("projectsGrid");t&&(t.innerHTML=`
    <div class="loading-skeleton">
      ${Array(3).fill(`
        <div class="skeleton-card">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line short"></div>
        </div>
      `).join("")}
    </div>
  `)}let i=null;function ke(t){O().then(()=>{const n=P.find(o=>o.id==t);if(!n){const o=H.find(s=>s.id==t);o&&(i=o,he(o));return}i=n,he(n)});const e=document.getElementById("page-project-config");e&&e.style.display!=="none"&&Be()}function he(t){const e=document.getElementById("sidebar");e&&(e.style.display="none");let n=document.getElementById("projectSidebar");n||(n=dt(),document.body.appendChild(n));const o=n.querySelector("#projectSidebarName");o&&(o.textContent=t.name);const s=n.querySelector("#projectSidebarId");s&&(s.textContent=t.id);const a=n.querySelector('a[data-project-page="status"]');a&&(t.project_type==="split"?a.style.display="flex":a.style.display="none"),n.style.display="block",document.getElementById("pageTitle").textContent=t.name,Fe(),Ie("deploy")}function dt(){const t=document.createElement("aside");return t.id="projectSidebar",t.className="sidebar project-sidebar",t.innerHTML=`
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
  `,t.querySelectorAll(".project-nav-item").forEach(e=>{e.addEventListener("click",async n=>{n.preventDefault();const o=e.getAttribute("data-project-page");if(await O(),i){const s=P.find(a=>a.id===i.id);s&&(i=s)}Ie(o),t.querySelectorAll(".project-nav-item").forEach(s=>s.classList.remove("active")),e.classList.add("active")})}),t}function mt(){const t=document.getElementById("projectSidebar");t&&(t.style.display="none");const e=document.getElementById("sidebar");e&&(e.style.display="block"),i=null,document.getElementById("pageTitle").textContent="Projects",document.querySelectorAll(".page").forEach(o=>{o.style.display="none"});const n=document.getElementById("page-projects");n&&(n.style.display="block"),O()}function Ie(t){switch(document.querySelectorAll(".page").forEach(e=>{e.style.display="none"}),t){case"deploy":const e=document.getElementById("page-deploy");if(e){e.style.display="block";const o=document.getElementById("deploy-status"),s=document.getElementById("deploy-success");o&&(o.textContent="",o.style.color=""),s&&(s.style.display="none");const a=document.getElementById("deploy-page-title"),r=document.getElementById("deploy-card-title"),l=document.getElementById("deploy-description");if(i){a&&(a.textContent=i.name||"Project"),r&&(r.textContent=i.name||"Project"),l&&(l.textContent="Update deployment settings and redeploy your project.");const h=document.getElementById("import-info"),x=document.getElementById("import-repo-name"),$=i.git_url||i.repository_url||"",j=document.getElementById("git-url");if(j&&$&&(j.value=$,console.log("Populated Git URL input in showProjectContent:",$),j.removeAttribute("required")),$&&h&&x)try{const b=$.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git|[/]|$)/);if(b){const I=b[1],C=b[2];x.textContent=`${I}/${C}`,h.style.display="flex";const E=document.getElementById("branch-badge"),F=document.getElementById("branch-name");E&&F&&(E.style.display="flex",F.textContent="main")}}catch(b){console.warn("Failed to parse GitHub URL:",b)}else h&&(h.style.display="none");console.log("showProjectContent - currentProject:",{id:i.id,name:i.name,git_url:i.git_url,repository_url:i.repository_url,gitUrl:$}),Bt(i.id,$)}else{a&&(a.textContent="New Project"),r&&(r.textContent="New Project"),l&&(l.textContent="Choose where you want to create the project and give it a name.");const h=document.getElementById("import-info");h&&(h.style.display="none")}const d=document.getElementById("project-components-section");d&&(d.style.display="none"),document.getElementById("deploy-type");const c=document.getElementById("deploy-type-group"),m=document.getElementById("single-repo-group"),u=document.getElementById("git-url-section"),y=document.getElementById("split-deploy-layout"),f=document.getElementById("git-url"),v=document.getElementById("project-name"),k=document.getElementById("framework-preset"),S=document.getElementById("root-directory"),_=document.getElementById("install-command"),K=document.getElementById("build-command"),q=document.getElementById("start-command"),L=document.getElementById("port"),A=document.getElementById("frontend-url"),M=document.getElementById("backend-url"),g=document.getElementById("deploy-submit-default"),ae=document.getElementById("edit-root-directory-btn");ae&&S&&(ae.onclick=()=>{S.removeAttribute("readonly"),S.focus(),S.select()});let T=i==null?void 0:i.project_type;const ne=(i==null?void 0:i.git_url)||(i==null?void 0:i.repository_url)||"",oe=ne.startsWith("split::");if(T||(i!=null&&i.isSplit||oe?T="split":T="single"),oe&&T!=="split"?T="split":!oe&&T==="split"&&ne&&(T="single"),i){if(c&&(c.style.display="none"),v&&(v.value=i.name||i.app_name||""),k){const h=i.buildCommand||i.build_command||"",x=i.startCommand||i.start_command||"";h.includes("next build")||x.includes("next start")?k.value="nextjs":h.includes("react-scripts")||x.includes("react-scripts")?k.value="react":x.includes("vue")||h.includes("vue")?k.value="vue":x.includes("flask")||h.includes("flask")?k.value="flask":x.includes("django")||h.includes("django")?k.value="django":x.includes("python")||h.includes("python")?k.value="python":x.includes("node")||h.includes("npm")?k.value="nodejs":k.value="auto"}if(S&&(S.value="./"),K&&(K.value=i.buildCommand||i.build_command||""),q&&(q.value=i.startCommand||i.start_command||""),L&&(L.value=i.port||""),_&&!_.value){const h=(k==null?void 0:k.value)||"auto";["nextjs","react","vue","nodejs"].includes(h)?_.placeholder="npm install":["python","flask","django"].includes(h)&&(_.placeholder="pip install -r requirements.txt")}if(T==="split"){m&&(m.style.display="none"),y&&(y.style.display="block"),A&&(A.value=i.frontend_url||""),M&&(M.value=i.backend_url||""),f&&f.removeAttribute("required"),g&&(g.style.display="none");const h=document.getElementById("deploy-frontend-btn"),x=document.getElementById("deploy-backend-btn"),$=document.getElementById("deploy-both-btn");h&&(h.onclick=async()=>{var C,E,F,z;const j=(C=A==null?void 0:A.value)==null?void 0:C.trim();if(!j||!j.startsWith("http"))return p("Enter a valid frontend URL","error");const b=ye(!1);document.getElementById("step-frontend").style.display="flex",b.updateFrontendStatus("deploying","Deploying your frontend now..."),(E=document.getElementById("build-command"))!=null&&E.value.trim(),(F=document.getElementById("start-command"))!=null&&F.value.trim(),(z=document.getElementById("port"))!=null&&z.value.trim();const I=await De(j,"frontend",b,!0);I&&I.success&&I.deployed_url?(b.showUrls(I.deployed_url,null),document.getElementById("close-deployment-dialog").onclick=()=>{b.close(),le(),Q()}):I&&!I.success&&setTimeout(()=>b.close(),3e3)}),x&&(x.onclick=async()=>{var C,E,F,z;const j=(C=M==null?void 0:M.value)==null?void 0:C.trim();if(!j||!j.startsWith("http"))return p("Enter a valid backend URL","error");const b=ye(!1);document.getElementById("step-backend").style.display="flex",b.updateBackendStatus("deploying","Deploying your backend now..."),(E=document.getElementById("build-command"))!=null&&E.value.trim(),(F=document.getElementById("start-command"))!=null&&F.value.trim(),(z=document.getElementById("port"))!=null&&z.value.trim();const I=await De(j,"backend",b,!0);I&&I.success&&I.deployed_url?(b.showUrls(null,I.deployed_url),document.getElementById("close-deployment-dialog").onclick=()=>{b.close(),le(),Q()}):I&&!I.success&&setTimeout(()=>b.close(),3e3)}),$&&($.onclick=async()=>{var F,z;const j=(F=A==null?void 0:A.value)==null?void 0:F.trim(),b=(z=M==null?void 0:M.value)==null?void 0:z.trim();if(!j||!j.startsWith("http")||!b||!b.startsWith("http")){p("Please enter valid Frontend and Backend repository URLs","error");return}let I=!1,C={};if(i&&i.id)try{const w=await fetch(`/api/env-vars?project_id=${i.id}`,{headers:N()});if(w.ok){const G=(await w.json()).variables||{};I=Object.keys(G).length>0,console.log("Existing env vars check:",{hasExistingEnvVars:I,count:Object.keys(G).length})}}catch(w){console.warn("Failed to check existing env vars:",w)}if(I){await E();return}try{const w=await fetch(`/api/env-vars/detect?frontend_url=${encodeURIComponent(j)}&backend_url=${encodeURIComponent(b)}`,{headers:N()});w.ok?(C=(await w.json()).suggestions||{},console.log("Env var detection result:",{count:Object.keys(C).length,vars:C})):console.warn("Env var detection API returned:",w.status)}catch(w){console.warn("Env var detection failed:",w)}gt(C,async()=>{if(Object.keys(C).length===0){i&&i.id?U.navigate("/env-vars"):(p("No env vars detected. Add them manually after deployment","info"),await E());return}if(p("Importing environment variables...","info"),i&&i.id){const w={};Object.keys(C).forEach(ie=>{w[ie]=""});const Z=localStorage.getItem("access_token")||localStorage.getItem("authToken"),G=await fetch(`/api/env-vars?project_id=${i.id}`,{headers:{Authorization:`Bearer ${Z}`}});if(G.ok){const ce={...(await G.json()).variables||{},...w};(await fetch("/api/env-vars",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${Z}`},body:JSON.stringify({variables:ce,project_id:i.id})})).ok?(p("Environment variables imported successfully!","success"),setTimeout(()=>E(),500)):(p("Failed to import environment variables","error"),await E())}else p("Failed to load existing environment variables","error"),await E()}else p("Save detected env vars after deployment","info"),await E()},()=>{i&&i.id?U.navigate("/env-vars"):p("Please add environment variables after deployment","info")},async()=>{await E()});async function E(){var Z,G,ie;const w=ye(!0);document.getElementById("step-backend").style.display="flex",document.getElementById("step-frontend").style.display="flex",w.updateBackendStatus("deploying","Deploying your backend now...");try{const R=new FormData;R.append("deploy_type","split"),R.append("frontend_url",j),R.append("backend_url",b),i&&i.id&&R.append("project_id",String(i.id));const ce=(Z=document.getElementById("build-command"))==null?void 0:Z.value.trim(),ue=(G=document.getElementById("start-command"))==null?void 0:G.value.trim(),Le=(ie=document.getElementById("port"))==null?void 0:ie.value.trim();ce&&R.append("build_command",ce),ue&&R.append("start_command",ue),Le&&R.append("port",Le);const Pe=await fetch("/deploy",{method:"POST",headers:N(),body:R}),de=await Pe.json();Pe.ok&&de.deployed_url?(w.updateBackendStatus("success","Backend deployed! ✅"),w.updateFrontendStatus("success","Frontend deployed! ✅"),w.showUrls(de.deployed_url,null),document.getElementById("close-deployment-dialog").onclick=()=>{w.close(),O(),le(),Q()},p("Split deployment successful!","success")):(w.updateBackendStatus("failed",de.detail||"Deployment failed"),w.updateFrontendStatus("failed","Could not deploy"),p(de.detail||"Deployment failed","error"),setTimeout(()=>w.close(),3e3))}catch{w.updateBackendStatus("failed","Network error"),w.updateFrontendStatus("failed","Network error"),p("Network error during deployment","error"),setTimeout(()=>w.close(),3e3)}}}),g&&(g.style.display="none")}else if(T==="single"){if(m&&(m.style.display="block"),u&&(u.style.display="none"),y&&(y.style.display="none"),f&&i){const h=i.git_url||i.repository_url||"";h&&(f.value=h,f.removeAttribute("required"))}g&&(g.textContent="Deploy",g.style.display="")}}else c&&(c.style.display=""),splitGroup&&(splitGroup.style.display="none"),y&&(y.style.display="none"),m&&(m.style.display="block"),f&&(f.value=""),g&&(g.textContent="🚀 Deploy",g.style.display="")}document.getElementById("pageTitle").textContent="Deploy";break;case"status":ut();break;case"configuration":pt();break;case"domain-config":Me();break;case"env-vars":const n=document.getElementById("page-env-vars");n&&(n.style.display="block",Ce());break}}async function pt(){let t=document.getElementById("page-project-config");t||(t=document.createElement("div"),t.id="page-project-config",t.className="page",t.innerHTML=`
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
    `,document.getElementById("pageContent").appendChild(t));const e=document.getElementById("project-components-section");e&&(e.style.display="none"),Be();const n=document.getElementById("changeProjectNameBtn");n&&(n.onclick=()=>Ae()),t.style.display="block"}async function ut(){document.querySelectorAll(".page").forEach(e=>e.style.display="none");let t=document.getElementById("page-status");if(t||(t=document.createElement("div"),t.id="page-status",t.className="page",document.getElementById("pageContent").appendChild(t)),t.innerHTML="",i&&i.id)try{const e=await fetch(`/projects/${i.id}/components`,{headers:N()});if(e.ok){const o=(await e.json()).components||[],s=o.find(m=>m.component_type==="frontend"),a=o.find(m=>m.component_type==="backend"),r=s?s.status==="running"?"RUNNING":s.status.toUpperCase():"NOT DEPLOYED",l=a?a.status==="running"?"RUNNING":a.status.toUpperCase():"NOT DEPLOYED",d=(s==null?void 0:s.status)==="running"?"status-success":(s==null?void 0:s.status)==="failed"?"status-error":"status-info",c=(a==null?void 0:a.status)==="running"?"status-success":(a==null?void 0:a.status)==="failed"?"status-error":"status-info";t.innerHTML=`
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
        `}}catch(e){console.error("Error loading project components:",e),t.innerHTML=`
        <div class="card">
          <p>Unable to load project components. Please try again later.</p>
        </div>
      `}t.style.display="block",document.getElementById("pageTitle").textContent="Status"}async function le(){if(!(!i||!i.id))try{const t=await fetch(`/projects/${i.id}/components`,{headers:N()});if(!t.ok)return;const n=(await t.json()).components||[],o=n.find(y=>y.component_type==="frontend"),s=n.find(y=>y.component_type==="backend"),a=o&&o.status&&o.status!=="imported"&&o.status!=="imported_split",r=s&&s.status&&s.status!=="imported"&&s.status!=="imported_split",l=a&&r;let d=document.getElementById("project-components-section");const c=document.getElementById("page-deploy"),m=document.getElementById("page-project-config"),u=m==null?void 0:m.querySelector("#project-components-section");if(u&&u.remove(),l&&c&&c.style.display!=="none"){if(!d){d=document.createElement("div"),d.id="project-components-section",d.className="card project-components-card";const S=c.querySelector(".card");S?c.insertBefore(d,S):c.appendChild(d)}d.style.display="block";const y=o?o.status==="running"?"RUNNING":o.status.toUpperCase():"NOT DEPLOYED",f=s?s.status==="running"?"RUNNING":s.status.toUpperCase():"NOT DEPLOYED",v=(o==null?void 0:o.status)==="running"?"status-success":(o==null?void 0:o.status)==="failed"?"status-error":"status-info",k=(s==null?void 0:s.status)==="running"?"status-success":(s==null?void 0:s.status)==="failed"?"status-error":"status-info";d.innerHTML=`
      <h2 style="margin-bottom: 1.5rem;">Project Components</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
        <!-- Frontend Card -->
        <div class="project-card" style="margin: 0;">
          <div class="project-header">
            <div class="project-icon">🌐</div>
            <div class="project-status ${v}">${y}</div>
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
            <div class="project-status ${k}">${f}</div>
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
    `,requestAnimationFrame(()=>{d.classList.add("components-visible");const S=c.querySelector(".card:not(#project-components-section)");S&&S.classList.add("deploy-card-slide-down")})}else if(d){d.style.display="none",d.classList.remove("components-visible");const y=c==null?void 0:c.querySelector(".card:not(#project-components-section)");y&&y.classList.remove("deploy-card-slide-down")}}catch(t){console.error("Error loading project components:",t)}}function Ue(t){if(!t||t==="#")return null;const e=t.trim();return/^https?:\/\//i.test(e)?e:`https://${e}`}function yt(t){const e=Ue(t);e?window.open(e,"_blank"):p("Site URL is unavailable","error")}function gt(t,e,n,o){const s=document.createElement("div");s.className="modal-overlay",s.id="envVarsDetectionOverlay";const a=document.createElement("div");a.className="modal-content enhanced",a.style.maxWidth="600px";const r=Object.keys(t).length>0,l=r?Object.entries(t).map(([c,m])=>`
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
        ${r?`We found ${Object.keys(t).length} environment variables in your code. Choose how to proceed:`:"No environment variables were detected. You can add them manually or proceed without them."}
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
  `,s.appendChild(a),document.body.appendChild(s),document.querySelector(".skip-env-btn").onclick=()=>{s.remove(),o&&o()},document.querySelector(".add-manual-env-btn").onclick=()=>{s.remove(),n&&n()};const d=document.querySelector(".import-env-btn");return d&&(d.onclick=async()=>{s.remove(),e&&await e()}),s}function ye(t=!0){const e=document.createElement("div");e.className="modal-overlay deployment-progress-overlay",e.id="deploymentProgressOverlay";const n=document.createElement("div");return n.className="deployment-progress-modal",n.innerHTML=`
    <div class="deployment-progress-header">
      <h3>🚀 Deployment in Progress</h3>
    </div>
    <div class="deployment-progress-body">
      <div class="progress-steps">
        <div class="progress-step" id="step-backend" ${t?"":'style="display: none;"'}>
          <div class="step-icon">⏳</div>
          <div class="step-content">
            <div class="step-title">Backend</div>
            <div class="step-message" id="backend-message">Waiting...</div>
          </div>
          <div class="step-status" id="backend-status"></div>
        </div>
        <div class="progress-step" id="step-frontend" ${t?"":'style="display: none;"'}>
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
  `,e.appendChild(n),document.body.appendChild(e),{overlay:e,updateBackendStatus:(o,s)=>{const a=document.getElementById("step-backend"),r=a.querySelector(".step-icon"),l=document.getElementById("backend-status"),d=document.getElementById("backend-message");d.textContent=s,o==="deploying"?(r.textContent="⏳",l.textContent="",a.classList.remove("completed","failed"),a.classList.add("active")):o==="success"?(r.textContent="✅",l.textContent="✓",a.classList.remove("active","failed"),a.classList.add("completed")):o==="failed"&&(r.textContent="❌",l.textContent="✗",a.classList.remove("active","completed"),a.classList.add("failed"))},updateFrontendStatus:(o,s)=>{const a=document.getElementById("step-frontend"),r=a.querySelector(".step-icon"),l=document.getElementById("frontend-status"),d=document.getElementById("frontend-message");d.textContent=s,o==="deploying"?(r.textContent="⏳",l.textContent="",a.classList.remove("completed","failed"),a.classList.add("active")):o==="success"?(r.textContent="✅",l.textContent="✓",a.classList.remove("active","failed"),a.classList.add("completed")):o==="failed"&&(r.textContent="❌",l.textContent="✗",a.classList.remove("active","completed"),a.classList.add("failed"))},showUrls:(o,s)=>{const a=document.getElementById("deployment-urls"),r=document.getElementById("frontend-url-link"),l=document.getElementById("backend-url-link"),d=document.getElementById("close-deployment-dialog");o?(r.href=o,r.textContent=o,r.closest(".url-item").style.display="flex"):r.closest(".url-item").style.display="none",s?(l.href=s,l.textContent=s,l.closest(".url-item").style.display="flex"):l.closest(".url-item").style.display="none",a.style.display="block",d.style.display="block"},close:()=>{const o=document.getElementById("deploymentProgressOverlay");o&&document.body.removeChild(o)}}}function Ae(){if(!i){p("No project selected","error");return}const t=document.createElement("div");t.className="modal-overlay";const e=document.createElement("div");e.className="modal-content enhanced",e.innerHTML=`
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
  `,t.appendChild(e),document.body.appendChild(t);const n=document.getElementById("newProjectNameInput");n&&(n.focus(),n.select());const o=e.querySelector(".cancel-name-btn"),s=e.querySelector(".save-name-btn"),a=()=>{document.body.removeChild(t)};o.onclick=()=>{a()},s.onclick=async()=>{const l=n.value.trim();if(!l){p("Project name cannot be empty","error");return}if(l===i.name){a();return}try{const d=localStorage.getItem("access_token")||localStorage.getItem("authToken"),c=await fetch(`/projects/${i.id}/name`,{method:"PUT",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${d}`},body:new URLSearchParams({app_name:l})}),m=await c.json();if(c.ok){p("Project name updated successfully!","success"),i.name=l,a();const u=P.findIndex(f=>f.id===i.id);u>=0&&(P[u].name=l),Be(),J(H);const y=document.getElementById("projectSidebarName");y&&(y.textContent=l),document.getElementById("pageTitle").textContent=l}else p(m.detail||"Failed to update project name","error")}catch(d){console.error("Error updating project name:",d),p("Failed to update project name: "+d.message,"error")}},t.onclick=l=>{l.target===t&&a()};const r=l=>{l.key==="Escape"&&(a(),document.removeEventListener("keydown",r))};document.addEventListener("keydown",r)}function ft(t){const e=document.getElementById("content"+t.charAt(0).toUpperCase()+t.slice(1)),n=document.getElementById("icon"+t.charAt(0).toUpperCase()+t.slice(1));e&&n&&(e.classList.toggle("active"),n.classList.toggle("active"))}function vt(){i&&i.id?typeof U<"u"&&U&&U.navigate?U.navigate("/env-vars"):window.router&&window.router.navigate?window.router.navigate("/env-vars"):window.location.hash="#/env-vars":p("Please create a project first before adding environment variables","info")}function ht(){const t=document.getElementById("framework-preset"),e=document.getElementById("install-command"),n=document.getElementById("build-command"),o=document.getElementById("start-command");t&&t.addEventListener("change",function(s){const a=s.target.value;if(e&&(["nextjs","react","vue","nuxt","gatsby","angular","svelte","vite","nodejs"].includes(a)?e.placeholder="npm install, yarn install, or pnpm install":["python","flask","django"].includes(a)?e.placeholder="pip install -r requirements.txt":e.placeholder="npm install, yarn install, pnpm install, or pip install -r requirements.txt"),n){const r={nextjs:"next build",react:"npm run build",vue:"npm run build",nuxt:"nuxt build",gatsby:"gatsby build",angular:"ng build",svelte:"npm run build",vite:"vite build",nodejs:"npm run build",python:"",flask:"",django:"python manage.py collectstatic --noinput",static:""};r[a]&&(n.placeholder=r[a]||"Leave empty for auto-detect")}if(o){const r={nextjs:"npm run start",react:"npm start",vue:"npm run serve",nuxt:"nuxt start",gatsby:"gatsby serve",angular:"ng serve",svelte:"npm run dev",vite:"vite preview",nodejs:"node server.js",python:"python app.py",flask:"flask run",django:"python manage.py runserver",static:"python -m http.server"};r[a]&&(o.placeholder=r[a]||"Leave empty for auto-detect")}})}window.toggleDeploySection=ft;window.navigateToEnvVars=vt;function Be(){if(!i)return;const t=document.getElementById("projectConfigName"),e=document.getElementById("projectConfigOwner"),n=document.getElementById("projectConfigId"),o=document.getElementById("projectConfigCreated"),s=document.getElementById("projectConfigUpdated"),a=document.getElementById("projectConfigPort"),r=document.getElementById("projectConfigPid"),l=document.getElementById("projectConfigStartCommand"),d=document.getElementById("projectConfigBuildCommand");if(t&&(t.textContent=i.name||"Unknown"),e){const c=localStorage.getItem("username"),m=localStorage.getItem("displayName");e.textContent=m||c||"Unknown User"}n&&(n.textContent=i.id||"-"),o&&(o.textContent=i.createdAt?Se(i.createdAt):"Unknown"),s&&(s.textContent=i.updatedAt?X(new Date(i.updatedAt)):"Unknown"),a&&(a.textContent=(i==null?void 0:i.port)||"Not set"),r&&(r.textContent=(i==null?void 0:i.processPid)||"Not running"),l&&(l.textContent=(i==null?void 0:i.startCommand)||"Not set"),d&&(d.textContent=(i==null?void 0:i.buildCommand)||"Not set")}function Me(){let t=document.getElementById("page-project-domain");t||(t=document.createElement("div"),t.id="page-project-domain",t.className="page",t.innerHTML=`
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
    `,document.getElementById("pageContent").appendChild(t)),t.style.display="block",bt(),me()}function bt(){const t=document.getElementById("saveDomainBtn");t&&!t.dataset.bound&&(t.dataset.bound="true",t.addEventListener("click",Et))}function wt(t,e){if(!t)return;if(!e||!e.custom_domain){t.innerHTML='<span class="status-muted">No custom domain configured yet.</span>';return}const n=(e.domain_status||"unknown").toLowerCase(),o=e.last_domain_sync?Se(e.last_domain_sync):"Never";let s="Unknown",a="status-info",r="";n==="active"?(s="Active",a="status-success"):n==="error"?(s="Error",a="status-error",r="Resolve the issue and save the domain again."):n==="pending"&&(s="Pending",a="status-warning",r="Domain will be activated automatically after the next successful deployment."),t.innerHTML=`
    <div class="domain-status-line ${a}">
      <div class="domain-status-domain">
        <strong>${B(e.custom_domain)}</strong>
      </div>
      <div class="domain-status-meta">
        <span>${s}</span>
        <span>Last sync: ${B(o)}</span>
      </div>
      ${r?`<p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">${B(r)}</p>`:""}
    </div>
  `}async function me(){const t=document.getElementById("domainSuggestion"),e=document.getElementById("domainStatus"),n=document.getElementById("domainPrefix"),o=document.getElementById("platformDomain");if(!i||!i.id){e&&(e.innerHTML='<span class="status-muted">Select a project to configure its domain.</span>');return}const s=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!s){e&&(e.innerHTML='<span class="status-error">Please login to manage domains.</span>');return}t&&(t.textContent="Loading domain details...");try{const a=await fetch(`/projects/${i.id}/domain`,{headers:{Authorization:`Bearer ${s}`}});if(!a.ok)throw new Error(`Failed to load domain info (${a.status})`);const r=await a.json(),l=r.butler_domain||"butler.example.com";o&&(o.textContent=l);let d="";const c=r.custom_domain||r.suggested_domain||"";if(c)if(c.endsWith(l))d=c.slice(0,-(l.length+1));else{const m=c.split(".");m.length>0&&(d=m[0])}if(n){n.value=d;const m=r.suggested_domain&&r.suggested_domain.endsWith(l)?r.suggested_domain.slice(0,-(l.length+1)):"";n.placeholder=m||"project-slug or my.project"}if(t){const m=r.suggested_domain&&r.suggested_domain.endsWith(l)?r.suggested_domain.slice(0,-(l.length+1)):"";t.textContent=m?`Suggested: ${m} (you can use multiple labels like "my.project" or "portfolio.app"). Leave blank to remove. Domains become active after a successful deploy.`:`Enter a subdomain prefix (can be multiple labels like "my.project" or "portfolio"). The platform domain ${l} is fixed and cannot be changed.`}wt(e,r),i&&(i.custom_domain=r.custom_domain,i.domain_status=r.domain_status)}catch(a){console.error("Failed to load project domain info:",a),e&&(e.innerHTML='<span class="status-error">Could not load domain configuration.</span>')}}async function Et(){if(!i||!i.id){p("Select a project first","error");return}const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t){p("Please login to manage domains","error");return}const e=document.getElementById("domainPrefix"),n=document.getElementById("platformDomain");let o=e?e.value.trim():"";const s=n?n.textContent.trim():"";let a="";if(o){if(o=o.trim().replace(/^\.+|\.+$/g,""),!o){p("Please enter a subdomain prefix.","error");return}if(!/^[a-z0-9.-]+$/i.test(o)){p("Subdomain prefix can only contain letters, numbers, hyphens, and dots.","error");return}if(o.includes("..")){p("Subdomain prefix cannot contain consecutive dots.","error");return}if(o.startsWith(".")||o.endsWith(".")){p("Subdomain prefix cannot start or end with a dot.","error");return}a=`${o}.${s}`}if(!a){if(!i.custom_domain){p("Enter a subdomain prefix to save, or leave blank to remove the domain.","info");return}if(!confirm("Remove the custom domain and revert to the default internal URL?"))return;await kt(),await me();return}const r={custom_domain:a,auto_generate:!1};try{const l=await fetch(`/projects/${i.id}/domain`,{method:"POST",headers:{Authorization:`Bearer ${t}`,"Content-Type":"application/json"},body:JSON.stringify(r)});if(!l.ok){const m=(await l.json().catch(()=>({}))).detail||"Failed to save domain";if(l.status===409){p(m,"error");const y=document.getElementById("domainStatus");y&&(y.innerHTML=`<span class="status-error">${B(m)}</span>`)}else throw new Error(m);return}const d=await l.json();p(`Domain saved: ${d.custom_domain}`,"success"),await me()}catch(l){console.error("Failed to save domain:",l),p(l.message||"Failed to save domain","error");const d=document.getElementById("domainStatus");d&&l.message&&(d.innerHTML=`<span class="status-error">${B(l.message)}</span>`)}}async function kt(){if(!i||!i.id){p("Select a project first","error");return}const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t){p("Please login to manage domains","error");return}try{const e=await fetch(`/projects/${i.id}/domain`,{method:"DELETE",headers:{Authorization:`Bearer ${t}`}});if(!e.ok){const o=(await e.json().catch(()=>({}))).detail||"Failed to reset domain";throw new Error(o)}p("Domain removed. Project will use its internal URL.","success"),i&&(i.custom_domain=null,i.domain_status=null),await me()}catch(e){console.error("Failed to clear domain:",e),p(e.message||"Failed to clear domain","error")}}function It(t){ke(t)}async function Fe(){const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t){console.log("No auth token found");return}try{const e=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${t}`}});if(e.ok){const n=await e.json(),o=document.getElementById("projectSidebar");if(o){const s=o.querySelector("#projectSidebarUserName"),a=o.querySelector("#projectSidebarUserEmail"),r=o.querySelector("#projectSidebarUserAvatar");if(s&&(s.textContent=n.display_name||n.username||"User"),a&&(a.textContent=n.email||"No email"),r)if(n.avatar_url){const l=new Image;l.onload=()=>{r.style.backgroundImage=`url(${n.avatar_url})`,r.style.backgroundSize="cover",r.style.backgroundPosition="center",r.textContent=""},l.onerror=()=>{r.style.backgroundImage="",r.textContent=(n.display_name||n.username||"U").charAt(0).toUpperCase()},l.src=n.avatar_url}else r.style.backgroundImage="",r.textContent=(n.display_name||n.username||"U").charAt(0).toUpperCase()}}else console.error("Failed to load user profile:",e.status)}catch(e){console.error("Error loading user profile:",e)}}function X(t){if(!t)return"Recently";const n=Date.now()-new Date(t).getTime(),o=Math.floor(n/6e4),s=Math.floor(n/36e5),a=Math.floor(n/864e5);if(o<1)return"Just now";if(o<60)return`${o}m ago`;if(s<24)return`${s}h ago`;if(a<7)return`${a}d ago`;const r=new Date(t);return r.toLocaleDateString("en-US",{month:"short",day:"numeric",year:r.getFullYear()!==new Date().getFullYear()?"numeric":void 0})}function Se(t){return t?new Date(t).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit",hour12:!0,timeZone:"Asia/Kathmandu"}):"Unknown"}async function Bt(t,e){const n=document.getElementById("monorepo-section"),o=document.getElementById("frontend-folder"),s=document.getElementById("backend-folder");if(!(!n||!o||!s))try{const a=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!a)return;const r=t?`/api/detect-monorepo?project_id=${t}`:`/api/detect-monorepo?git_url=${encodeURIComponent(e)}`,l=await fetch(r,{headers:{Authorization:`Bearer ${a}`}});if(l.ok){const d=await l.json();if(d.is_monorepo){if(n.style.display="block",d.frontend_folder){o.innerHTML='<option value="">None (skip frontend)</option>';const c=document.createElement("option");c.value=d.frontend_folder,c.textContent=d.frontend_folder,c.selected=!0,o.appendChild(c)}else o.innerHTML='<option value="">None (skip frontend)</option>';if(d.backend_folder){s.innerHTML='<option value="">None (skip backend)</option>';const c=document.createElement("option");c.value=d.backend_folder,c.textContent=d.backend_folder,c.selected=!0,s.appendChild(c)}else s.innerHTML='<option value="">None (skip backend)</option>'}else n.style.display="none"}}catch(a){console.error("Error detecting monorepo structure:",a),n.style.display="none"}}async function Q(){await O();try{const t=await fetch("/deployments",{headers:N()});if(t.ok){const e=await t.json();document.getElementById("totalDeployments").textContent=e.length,document.getElementById("runningApps").textContent=e.filter(o=>o.status==="success").length;const n=document.getElementById("recentActivity");e.length>0?n.innerHTML=e.slice(0,5).map(o=>{const s=o.app_name||o.container_name||"Untitled Project";return`
          <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
            <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 0.25rem;">${B(s)}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">
              ${new Date(o.created_at).toLocaleString("en-US",{timeZone:"Asia/Kathmandu"})}
            </div>
          </div>
        `}).join(""):n.innerHTML='<p class="recent-activity-empty">No recent activity</p>'}}catch(t){console.error("Error loading dashboard:",t)}}async function St(t){var m,u,y,f,v,k,S,_,K,q,L,A,M;if(t.preventDefault(),!te){p("Please login to deploy applications","error"),window.location.href="/login";return}const e=t.target,n=((m=document.getElementById("deploy-type"))==null?void 0:m.value)||"single",o=document.getElementById("deploy-status"),s=document.getElementById("deploy-success");s.style.display="none",o.textContent="";let a="";if(i&&i.id){a=i.git_url||i.repository_url||"",console.log("Deploying existing project:",{projectId:i.id,projectName:i.name,gitUrl:a,hasGitUrl:!!a});const g=document.getElementById("git-url");g&&a&&(g.value=a,console.log("Populated hidden Git URL input with:",a)),a||g&&(a=g.value.trim(),console.log("Got Git URL from input field (fallback):",a))}else{const g=document.getElementById("git-url");a=g?g.value.trim():"",console.log("Deploying new project, Git URL from input:",a)}const r=(u=document.getElementById("frontend-url"))==null?void 0:u.value.trim(),l=(y=document.getElementById("backend-url"))==null?void 0:y.value.trim(),d=i==null?void 0:i.custom_domain,c=i!=null&&i.domain_status?i.domain_status.toLowerCase():null;if(d?d&&c!=="active"&&p("Domain saved. It will activate after this deployment.","info"):console.log("No custom domain configured - deployment will use internal URL"),n==="split"){if(!r||!r.startsWith("http")||!l||!l.startsWith("http")){o.textContent="Please enter valid Frontend and Backend repository URLs",o.style.color="var(--error)";return}}else if(!a||!a.startsWith("http")){o.textContent=`Please enter a valid Git repository URL. Current project: ${(i==null?void 0:i.name)||"unknown"}, Git URL: ${a||"missing"}`,o.style.color="var(--error)",console.error("Git URL validation failed:",{currentProject:i,gitUrl:a,gitUrlInput:(f=document.getElementById("git-url"))==null?void 0:f.value});return}console.log("Git URL validation passed:",a),o.textContent="🚀 Deploying...",o.style.color="var(--primary)";try{const g=new FormData;n==="split"?(g.append("deploy_type","split"),g.append("frontend_url",r),g.append("backend_url",l)):(g.append("deploy_type","single"),g.append("git_url",a)),typeof i=="object"&&i&&i.id&&g.append("project_id",String(i.id));const ae=(v=document.getElementById("project-name"))==null?void 0:v.value.trim();ae&&g.append("project_name",ae);const T=((k=document.getElementById("root-directory"))==null?void 0:k.value.trim())||"./";T&&g.append("root_directory",T);const ne=(S=document.getElementById("framework-preset"))==null?void 0:S.value;ne&&ne!=="auto"&&g.append("framework_preset",ne);const oe=(_=document.getElementById("install-command"))==null?void 0:_.value.trim();oe&&g.append("install_command",oe);const h=(K=document.getElementById("build-command"))==null?void 0:K.value.trim(),x=(q=document.getElementById("start-command"))==null?void 0:q.value.trim(),$=(L=document.getElementById("port"))==null?void 0:L.value.trim();h&&g.append("build_command",h),x&&g.append("start_command",x),$&&g.append("port",$);const j=document.getElementById("monorepo-section"),b=(A=document.getElementById("frontend-folder"))==null?void 0:A.value.trim(),I=(M=document.getElementById("backend-folder"))==null?void 0:M.value.trim();j&&j.style.display!=="none"&&(b||I)&&(g.append("is_monorepo","true"),b&&g.append("frontend_folder",b),I&&g.append("backend_folder",I));const C=await fetch("/deploy",{method:"POST",headers:N(),body:g}),E=await C.json();C.ok?(o.textContent="✅ Deployment successful!",o.style.color="var(--success)",E.deployed_url&&(s.style.display="block",document.getElementById("openAppBtn").href=E.deployed_url,document.getElementById("openAppBtn").textContent=`Open ${E.deployed_url}`),e.reset(),i&&i.isSplit?setTimeout(()=>{le(),Q()},1500):setTimeout(()=>{Q(),U.navigate("/applications")},2e3)):C.status===423?(o.textContent=`⏳ ${E.detail||"Your virtual machine is being created. Please wait a few moments and try again."}`,o.style.color="var(--warning)",p(E.detail||"Your virtual machine is being created. Please wait a few moments and try again.","warning")):(o.textContent=`❌ Error: ${E.detail||"Deployment failed"}`,o.style.color="var(--error)",p(E.detail||"Deployment failed","error"))}catch{o.textContent="❌ Network error. Please try again.",o.style.color="var(--error)",p("Network error. Please try again.","error")}}async function De(t,e=null,n=null,o=!1){const s=document.getElementById("deploy-status"),a=document.getElementById("deploy-success");if(!te)return p("Please login to deploy applications","error"),window.location.href="/login",o?{success:!1,error:"Not authenticated"}:void 0;n||(a&&(a.style.display="none"),s&&(s.textContent="",s.style.color="var(--primary)"));try{const r=new FormData;r.append("deploy_type","single"),r.append("git_url",t),typeof i=="object"&&i&&i.id&&r.append("project_id",String(i.id)),e&&typeof i=="object"&&i&&i.project_type==="split"&&r.append("component_type",e),buildCommand&&r.append("build_command",buildCommand),startCommand&&r.append("start_command",startCommand),port&&r.append("port",port);const l=await fetch("/deploy",{method:"POST",headers:N(),body:r}),d=await l.json();if(l.ok){if(n){const c="success",m=e==="backend"?"Backend complete! ✅":"Frontend complete! ✅";e==="backend"?n.updateBackendStatus(c,m):e==="frontend"&&n.updateFrontendStatus(c,m)}else if(s&&(s.textContent="✅ Deployment successful!",s.style.color="var(--success)"),d.deployed_url&&a){a.style.display="block";const c=document.getElementById("openAppBtn");c&&(c.href=d.deployed_url,c.textContent=`Open ${d.deployed_url}`)}return o?{success:!0,deployed_url:d.deployed_url}:(i&&i.isSplit?setTimeout(()=>{le(),Q()},1500):setTimeout(()=>{Q(),U.navigate("/applications")},2e3),{success:!0,deployed_url:d.deployed_url})}else{const c=d.detail||"Deployment failed";if(n){const m="failed",u=`Error: ${c}`;e==="backend"?n.updateBackendStatus(m,u):e==="frontend"&&n.updateFrontendStatus(m,u)}else s&&(s.textContent=`❌ Error: ${c}`,s.style.color="var(--error)");if(o)return{success:!1,error:c}}}catch{const l="Network error. Please try again.";if(n){const d="failed",c=l;e==="backend"?n.updateBackendStatus(d,c):e==="frontend"&&n.updateFrontendStatus(d,c)}else s&&(s.textContent=`❌ ${l}`,s.style.color="var(--error)");if(o)return{success:!1,error:l}}}async function jt(){if(!te){document.getElementById("applicationsGrid").innerHTML=`
      <div class="empty-state">
        <p>Please login to view your applications</p>
        <a href="/login" class="btn-primary">Login</a>
      </div>
    `;return}try{const t=await fetch("/deployments",{headers:N()});if(t.ok){const e=await t.json(),n=document.getElementById("applicationsGrid");e.length===0?n.innerHTML=`
          <div class="empty-state">
            <p>No applications deployed yet</p>
            <a href="/deploy" class="btn-primary">Deploy Your First App</a>
          </div>
        `:n.innerHTML=e.map(o=>{const s=o.app_name||o.container_name||"Untitled Project";return`
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
        `}).join("")}}catch(t){console.error("Error loading applications:",t)}}async function je(){if(!te){document.getElementById("historyTableBody").innerHTML=`
      <tr>
        <td colspan="4" class="empty-state">Please login to view deployment history</td>
      </tr>
    `;return}try{const t=await fetch("/deployments",{headers:N()});if(t.ok){const e=await t.json(),n=document.getElementById("historyTableBody");e.length===0?n.innerHTML=`
          <tr>
            <td colspan="4" class="empty-state">No deployment history</td>
          </tr>
        `:n.innerHTML=e.map(o=>{const s=o.app_name||o.container_name||"Untitled Project";return`
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
        `}).join("")}}catch(t){console.error("Error loading history:",t)}}async function Ct(){if(confirm("Are you sure you want to clear all deployment history?"))try{(await fetch("/deployments/clear",{method:"DELETE",headers:N()})).ok&&(p("History cleared successfully","success"),je())}catch{p("Error clearing history","error")}}async function xt(t){if(confirm(`Are you sure you want to destroy "${t}"?`))try{(await fetch(`/deployments/${t}`,{method:"DELETE",headers:N()})).ok?(p("Deployment destroyed successfully","success"),je(),jt()):p("Error destroying deployment","error")}catch{p("Network error","error")}}let D=[],Ne="";async function Re(){const t=document.getElementById("usernameSearch").value.trim();if(!t){p("Please enter a GitHub username","error");return}t!==Ne&&(D=[],Ne=t);const e=document.getElementById("repositoriesGrid");e.innerHTML='<div class="empty-state"><p>Loading repositories...</p></div>';try{const n=await fetch(`/api/repositories/${t}`),o=await n.json();n.ok&&o.repositories?o.repositories.length===0?e.innerHTML='<div class="empty-state"><p>No repositories found</p></div>':(e.innerHTML=o.repositories.map(s=>`
          <div class="repository-card ${D.some(r=>r.url===s.clone_url)?"selected":""}" data-repo-url="${s.clone_url}" onclick="toggleRepositorySelection('${s.clone_url}', '${s.name}')">
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
        `).join(""),be()):e.innerHTML=`<div class="empty-state"><p>${o.detail||"Error loading repositories"}</p></div>`}catch{e.innerHTML='<div class="empty-state"><p>Error loading repositories</p></div>'}}function _t(t,e){const n=D.findIndex(o=>o.url===t);if(n>=0)D.splice(n,1),be();else{if(D.length>=2){p("You can only select up to 2 repositories for a split repository","error");return}D.push({url:t,name:e}),D.length===2&&Lt(),be()}}function Lt(){const[t,e]=D,n=document.createElement("div");n.className="modal-overlay",n.id="splitImportModal";const o=document.createElement("div");o.className="modal-content enhanced",o.innerHTML=`
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
        <div class="split-import-repo-name">${B(t.name)}</div>
        <div class="split-import-repo-url">${B(t.url)}</div>
      </div>
      
      <div class="split-import-divider"></div>
      
      <div class="split-import-repo-item">
        <div class="split-import-repo-label">Backend</div>
        <div class="split-import-repo-name">${B(e.name)}</div>
        <div class="split-import-repo-url">${B(e.url)}</div>
      </div>
    </div>
    
    <div class="split-import-actions">
      <button class="cancel-btn">Cancel</button>
      <button class="confirm-btn">Import Multi-Repository</button>
    </div>
  `,n.appendChild(o),document.body.appendChild(n);const s=o.querySelector(".cancel-btn"),a=o.querySelector(".confirm-btn"),r=()=>{document.body.removeChild(n)};s.onclick=()=>{r()},a.onclick=()=>{r();const[d,c]=D;Ve(d.url,c.url,`${d.name}-${c.name}`)},n.onclick=d=>{d.target===n&&r()};const l=d=>{d.key==="Escape"&&(r(),document.removeEventListener("keydown",l))};document.addEventListener("keydown",l),a.focus()}function be(){const t=document.getElementById("repositoriesGrid");if(!t)return;t.querySelectorAll(".repository-card").forEach(n=>{const o=n.getAttribute("data-repo-url");D.some(a=>a.url===o)?n.classList.add("selected"):n.classList.remove("selected")})}function Pt(){if(D.length!==2){p("Please select exactly 2 repositories","error");return}const[t,e]=D;confirm(`Import as Multi-Repository?

Frontend: ${t.name}
Backend: ${e.name}

Click OK to import these repositories as a multi-repository project.`)&&Ve(t.url,e.url,`${t.name}-${e.name}`)}async function Ve(t,e,n){const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o){p("Please login first","error");return}try{p("Importing multi-repositories...","info");const s=await fetch("/api/import-split",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${o}`},body:new URLSearchParams({frontend_url:t,backend_url:e,app_name:n})}),a=await s.json();if(s.ok){p("Multi-repository imported successfully! Navigate to Projects to see it.","success"),D=[];const r=document.getElementById("page-projects");r&&r.style.display!=="none"&&O(),document.getElementById("usernameSearch").value.trim()&&Re()}else s.status===423?p(a.detail||"Your virtual machine is being created. Please wait a few moments and try again.","warning"):p(a.detail||"Failed to import multi-repository","error")}catch(s){console.error("Error importing multi-repositories:",s),p("Failed to import multi-repository: "+s.message,"error")}}function $t(t){document.getElementById("git-url").value=t,U.navigate("/deploy"),p("Repository selected","success")}async function Dt(t,e){const n=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!n){p("Please login first","error");return}try{p("Importing repository...","info");const o=await fetch("/api/import",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${n}`},body:new URLSearchParams({git_url:t,app_name:e||t.split("/").pop()||"Untitled Project"})}),s=await o.json();if(o.ok){p("Repository imported successfully! Navigate to Projects to see it.","success");const a=document.getElementById("page-projects");a&&a.style.display!=="none"&&O()}else o.status===423?p(s.detail||"Your virtual machine is being created. Please wait a few moments and try again.","warning"):p(s.detail||"Failed to import repository","error")}catch(o){console.error("Error importing repository:",o),p("Failed to import repository: "+o.message,"error")}}function Nt(){document.getElementById("repositoriesGrid").innerHTML=`
    <div class="empty-state">
      <p>Search for a GitHub username to see their repositories</p>
            </div>
        `}function p(t,e="info"){const n=document.getElementById("toast");n.textContent=t,n.className=`toast show ${e}`,setTimeout(()=>{n.classList.remove("show")},3e3)}let ee={},we=[];async function Ce(){try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t){const n=document.getElementById("envVarsList");n&&(n.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `),ge();return}if(!i||!i.id){const n=document.getElementById("envVarsList");n&&(n.innerHTML=`
          <div class="empty-state">
            <p>Please select a project from the Projects page to manage environment variables</p>
          </div>
        `),ge();return}const e=await fetch(`/api/env-vars?project_id=${i.id}`,{headers:{Authorization:`Bearer ${t}`}});if(e.ok){const n=await e.json();ee=n.variables||{},we=n.vars_list||[],Tt()}else if(e.status===401){localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),pe();const n=document.getElementById("envVarsList");n&&(n.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `)}else console.error("Failed to load environment variables")}catch(t){console.error("Error loading environment variables:",t)}ge()}function ge(){const t=document.getElementById("importEnvBtn"),e=document.getElementById("addEnvVarBtn"),n=document.getElementById("importEnvCard"),o=document.getElementById("cancelImportBtn"),s=document.getElementById("importEnvForm"),a=document.getElementById("envDropZone"),r=document.getElementById("envFileInput"),l=document.getElementById("envDropZoneBrowse"),d=document.getElementById("envDropZoneFileName");if(t&&(t.onclick=()=>{n.style.display=n.style.display==="none"?"block":"none"}),o&&(o.onclick=()=>{n.style.display="none",r&&(r.value=""),d&&(d.textContent="",d.style.display="none")}),e&&(e.onclick=()=>{Ut()}),r&&(r.onchange=c=>{var u;const m=(u=c.target.files)==null?void 0:u[0];d&&(m?(d.textContent=m.name,d.style.display="block"):(d.textContent="",d.style.display="none"))}),a&&r&&!a.dataset.bound){a.dataset.bound="true";const c=m=>{m.preventDefault(),m.stopPropagation()};["dragenter","dragover"].forEach(m=>{a.addEventListener(m,u=>{c(u),a.classList.add("is-dragover")})}),["dragleave","dragend"].forEach(m=>{a.addEventListener(m,u=>{c(u),a.classList.remove("is-dragover")})}),a.addEventListener("dragover",m=>{c(m),m.dataTransfer&&(m.dataTransfer.dropEffect="copy"),a.classList.add("is-dragover")}),a.addEventListener("drop",async m=>{var f;c(m),a.classList.remove("is-dragover");const u=(f=m.dataTransfer)==null?void 0:f.files;if(!u||!u.length)return;const[y]=u;if(d&&(d.textContent=y.name,d.style.display="block"),r)try{const v=new DataTransfer;v.items.add(y),r.files=v.files}catch(v){console.warn("Unable to sync dropped file with input element:",v)}try{await Te(y)}catch(v){console.error("Error importing dropped .env file:",v)}}),a.addEventListener("click",()=>{r.click()}),l&&l.addEventListener("click",m=>{m.preventDefault(),r.click()})}s&&(s.onsubmit=async c=>{var u;c.preventDefault();const m=(u=r==null?void 0:r.files)==null?void 0:u[0];m&&await Te(m)})}async function Te(t){try{if(!t){p("No file detected for import","error");return}p(`Importing ${t.name||".env"}...`,"info");const n=(await t.text()).split(`
`),o={};n.forEach(a=>{if(a=a.trim(),a&&!a.startsWith("#")&&a.includes("=")){const[r,...l]=a.split("="),d=l.join("=").trim().replace(/^["']|["']$/g,"");r.trim()&&(o[r.trim()]=d)}}),ee={...ee,...o},await _e(),document.getElementById("importEnvCard").style.display="none",document.getElementById("envFileInput").value="";const s=document.getElementById("envDropZoneFileName");s&&(s.textContent="",s.style.display="none"),p("Environment variables imported successfully!","success")}catch(e){console.error("Error importing .env file:",e),p("Failed to import .env file","error")}}function Tt(){const t=document.getElementById("envVarsList");if(t){if(we.length===0){t.innerHTML=`
      <div class="empty-state">
        <p>No environment variables configured</p>
        <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.5rem;">
          Click "Add Variable" to create one, or import from a .env file
        </p>
            </div>
        `;return}t.innerHTML=`
    <table class="env-vars-table">
      <thead>
        <tr>
          <th class="name-col">Name</th>
          <th class="updated-col">Last updated</th>
          <th class="actions-col"></th>
        </tr>
      </thead>
      <tbody>
        ${we.map((e,n)=>{const o=e.updated_at?new Date(e.updated_at).toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kathmandu"}):"Never updated",s=e.project_id?'<span style="font-size: 0.75rem; background: var(--primary); color: white; padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Project</span>':'<span style="font-size: 0.75rem; background: var(--bg-tertiary); color: var(--text-secondary); padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Global</span>';return`
            <tr>
              <td class="name-col">
                <span class="lock-icon">🔒</span>
                <span class="var-name">${B(e.key)}</span>
                ${s}
              </td>
              <td class="updated-col">
                <span class="updated-time">${o}</span>
              </td>
              <td class="actions-col">
                <button class="icon-btn edit-btn" onclick="editEnvVarModal('${B(e.key)}')" title="Edit">
                  ✏️
                </button>
                <button class="icon-btn delete-btn" onclick="deleteEnvVar('${B(e.key)}')" title="Delete">
                  🗑️
                </button>
              </td>
            </tr>
          `}).join("")}
      </tbody>
    </table>
  `}}function Ut(){xe()}function xe(t=null,e=""){const n=document.getElementById("envVarModal"),o=document.getElementById("modalVarKey"),s=document.getElementById("modalVarValue"),a=document.getElementById("modalTitle");t?(a.textContent="Update environment variable",o.value=t,o.readOnly=!0,s.value=e):(a.textContent="Add environment variable",o.value="",o.readOnly=!1,s.value=""),n.style.display="flex"}function He(){const t=document.getElementById("envVarModal");t.style.display="none"}async function At(){const t=document.getElementById("modalVarKey"),e=document.getElementById("modalVarValue"),n=t.value.trim(),o=e.value.trim();if(!n){p("Variable name is required","error");return}ee[n]=o,await _e(),He()}function Oe(t){const e=ee[t]||"";xe(t,e)}async function Mt(t){Oe(t)}async function Ft(t){confirm(`Are you sure you want to delete ${t}?`)&&(delete ee[t],await _e(),p("Environment variable deleted","success"))}function Rt(t){const n=document.querySelectorAll(".env-var-row")[t];if(!n)return;const o=n.querySelector(".env-var-value input");o.type==="password"?o.type="text":o.type="password"}async function _e(){try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!i||!i.id){p("No project selected","error");return}(await fetch("/api/env-vars",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({variables:ee,project_id:i.id})})).ok?(await Ce(),p("Environment variables saved successfully","success")):(console.error("Failed to save environment variables"),p("Failed to save environment variables","error"))}catch(t){console.error("Error saving environment variables:",t),p("Error saving environment variables","error")}}function Vt(){const t=document.getElementById("modalVarValue"),e=document.querySelector('#envVarModal button[onclick*="toggleModalValueVisibility"]');t&&e&&(t.type==="password"?(t.type="text",e.textContent="🙈 Hide"):(t.type="password",e.textContent="👁️ Show"))}function B(t){const e=document.createElement("div");return e.textContent=t,e.innerHTML}async function qe(){try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t)return;const e=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${t}`}});if(e.ok){const n=await e.json(),o=document.getElementById("userName"),s=document.getElementById("userEmail"),a=document.getElementById("userAvatar");localStorage.setItem("displayName",n.display_name||""),localStorage.setItem("userEmail",n.email||""),o&&(o.textContent=n.display_name||n.username||"User"),Wt(n.display_name||n.username||"User"),s&&(s.textContent=n.email||"Logged in"),a&&(n.avatar_url?(a.style.backgroundImage=`url(${n.avatar_url})`,a.style.backgroundSize="cover",a.style.backgroundPosition="center",a.textContent=""):(a.style.backgroundImage="",a.textContent=(n.display_name||n.username||"U").charAt(0).toUpperCase()))}else e.status===401&&(localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),pe())}catch(t){console.error("Error loading user profile:",t)}}async function ze(){try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken"),e=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${t}`}});if(e.ok){const n=await e.json(),o=document.getElementById("username"),s=document.getElementById("email"),a=document.getElementById("displayName");o&&(o.value=n.username||""),s&&(s.value=n.email||""),a&&(a.value=n.display_name||"");const r=document.getElementById("avatarPreview"),l=document.getElementById("avatarInitial"),d=document.getElementById("removeAvatarBtn");if(n.avatar_url&&r)r.src=n.avatar_url,r.style.display="block",l&&(l.style.display="none"),d&&(d.style.display="block");else if(l){const c=n.display_name&&n.display_name.charAt(0).toUpperCase()||n.username&&n.username.charAt(0).toUpperCase()||"S";l.textContent=c,l.style.display="block"}}}catch(t){console.error("Error loading profile:",t)}Ht()}function Ht(){const t=document.getElementById("profileForm"),e=document.getElementById("avatarFile"),n=document.getElementById("removeAvatarBtn");t&&t.addEventListener("submit",Gt),e&&e.addEventListener("change",qt),n&&n.addEventListener("click",zt);const o=document.getElementById("changePasswordBtn"),s=document.getElementById("closePasswordModal"),a=document.getElementById("cancelPasswordBtn"),r=document.getElementById("updatePasswordBtn"),l=document.getElementById("passwordModal"),d=document.getElementById("modalNewPassword"),c=document.getElementById("strengthFill");o&&o.addEventListener("click",()=>{l&&(l.style.display="flex")}),s&&s.addEventListener("click",()=>{l&&(l.style.display="none")}),a&&a.addEventListener("click",()=>{l&&(l.style.display="none")}),l&&l.addEventListener("click",u=>{u.target===l&&(l.style.display="none")}),d&&d.addEventListener("input",u=>{const y=u.target.value;let f=0;y.length>=8&&(f+=25),/[a-z]/.test(y)&&/[A-Z]/.test(y)&&(f+=25),/\d/.test(y)&&(f+=25),/[!@#$%^&*(),.?":{}|<>]/.test(y)&&(f+=25),c&&(c.style.width=`${f}%`,f<50?c.style.background="#ef4444":f<75?c.style.background="#f59e0b":c.style.background="#10b981")}),r&&r.addEventListener("click",Ot);const m=document.getElementById("cancelProfileBtn");m&&m.addEventListener("click",async()=>{await ze()})}async function Ot(){const t=document.getElementById("modalCurrentPassword"),e=document.getElementById("modalNewPassword"),n=document.getElementById("modalConfirmPassword"),o=document.getElementById("passwordModal");if(!t||!e||!n)return;const s=t.value,a=e.value,r=n.value;if(!s||!a||!r){p("Please fill in all password fields","error");return}if(a!==r){p("New passwords do not match","error");return}if(a.length<8){p("Password must be at least 8 characters","error");return}try{const l=localStorage.getItem("access_token")||localStorage.getItem("authToken"),d=new FormData;d.append("current_password",s),d.append("new_password",a);const c=await fetch("/api/user/profile",{method:"PUT",headers:{Authorization:`Bearer ${l}`},body:d}),m=await c.json();if(c.ok){p("Password updated successfully!","success"),o&&(o.style.display="none"),t.value="",e.value="",n.value="";const u=document.getElementById("strengthFill");u&&(u.style.width="0%")}else p(m.detail||m.message||"Failed to update password","error")}catch(l){console.error("Error updating password:",l),p("Network error. Please try again.","error")}}function qt(t){const e=t.target.files[0];if(e){const n=new FileReader;n.onload=o=>{const s=document.getElementById("avatarPreview"),a=document.getElementById("avatarInitial");s&&(s.src=o.target.result,s.style.display="block"),a&&(a.style.display="none");const r=document.getElementById("removeAvatarBtn");r&&(r.style.display="block")},n.readAsDataURL(e)}}function zt(){const t=document.getElementById("avatarPreview"),e=document.getElementById("avatarInitial");t&&(t.src="",t.style.display="none"),e&&(e.style.display="block");const n=document.getElementById("removeAvatarBtn");n&&(n.style.display="none");const o=document.getElementById("avatarFile");o&&(o.value="")}async function Gt(t){t.preventDefault();const e=document.getElementById("profileMessage");e&&(e.style.display="none");const n=new FormData,o=document.getElementById("email"),s=document.getElementById("displayName");o&&n.append("email",o.value),s&&n.append("display_name",s.value);const a=document.getElementById("avatarFile");a&&a.files[0]&&n.append("avatar",a.files[0]);const r=document.getElementById("avatarPreview");r&&r.style.display==="none"&&n.append("remove_avatar","true");try{const l=localStorage.getItem("access_token")||localStorage.getItem("authToken"),d=await fetch("/api/user/profile",{method:"PUT",headers:{Authorization:`Bearer ${l}`},body:n}),c=await d.json();if(d.ok)e&&(e.textContent="Profile updated successfully!",e.className="profile-message success",e.style.display="block"),c.username&&localStorage.setItem("username",c.username),await qe(),p("Profile updated successfully!","success");else{const m=c.detail||c.message||"Failed to update profile";e&&(e.textContent=m,e.className="profile-message error",e.style.display="block"),p(m,"error"),console.error("Profile update failed:",c)}}catch(l){console.error("Error updating profile:",l),e&&(e.textContent="Network error. Please try again.",e.className="profile-message error",e.style.display="block"),p("Network error. Please try again.","error")}}window.destroyDeployment=xt;window.selectRepository=$t;window.importRepository=Dt;window.editEnvVar=Mt;window.deleteEnvVar=Ft;window.toggleEnvVarVisibility=Rt;window.saveEnvVarFromModal=At;window.closeEnvVarModal=He;window.toggleModalValueVisibility=Vt;window.editEnvVarModal=Oe;window.showEnvVarModal=xe;window.selectProject=ke;window.showProjectSidebar=he;window.hideProjectSidebar=mt;window.openProject=It;window.loadUserProfileIntoProjectSidebar=Fe;window.openProjectSite=lt;window.deleteProject=Ye;window.toggleRepositorySelection=_t;window.confirmSplitImport=Pt;window.openProjectNameModal=Ae;window.openSite=yt;function Wt(t){const e=document.getElementById("teamName");e&&(e.textContent=`${t}'s team`),document.querySelectorAll(".project-owner").forEach(o=>{o.textContent=`${t}'s team`})}let V=null,se=!1,Y=[];function Yt(t){if(t==null)return null;if(typeof t!="string")return t;const e=t.trim();if(!e)return null;const n=e.indexOf("{");if(n===-1)return{message:e};const o=e.slice(n);try{return JSON.parse(o)}catch{return{message:e}}}function Kt(){const t=document.getElementById("logsContent");t&&(t.innerHTML='<p class="logs-connecting">Connecting to WebSocket...</p>',Ge(),Zt())}function Ge(){V&&V.close();const e=`${window.location.protocol==="https:"?"wss:":"ws:"}//${window.location.host}/ws/logs`;V=new WebSocket(e),V.onopen=()=>{console.log("Logs WebSocket connected"),W("Connected to logs stream","success"),Y.length>0&&(Y.forEach(n=>W(n.message,n.type)),Y=[])},V.onmessage=n=>{const o=Yt(n.data);!o||!o.message||(se?Y.push({message:o.message,type:o.type||"info"}):W(o.message,o.type||"info"))},V.onerror=n=>{console.error("Logs WebSocket error:",n),W("WebSocket connection error","error")},V.onclose=()=>{console.log("Logs WebSocket disconnected"),W("Disconnected from logs stream","warning"),setTimeout(()=>{var n;((n=document.getElementById("page-logs"))==null?void 0:n.style.display)!=="none"&&Ge()},3e3)}}function W(t,e="info"){const n=document.getElementById("logsContent");if(!n)return;const o=new Date().toLocaleString("en-US",{timeZone:"Asia/Kathmandu",timeStyle:"medium",dateStyle:"short"}),s=document.createElement("div");s.className=`log-entry ${e}`,s.innerHTML=`
    <span class="log-timestamp">[${o}]</span>
    <span class="log-message">${B(t)}</span>
  `,n.appendChild(s),n.scrollTop=n.scrollHeight;const a=1e3,r=n.querySelectorAll(".log-entry");r.length>a&&r[0].remove()}function Zt(){const t=document.getElementById("clearLogsBtn"),e=document.getElementById("toggleLogsBtn");t&&t.addEventListener("click",()=>{const n=document.getElementById("logsContent");n&&(n.innerHTML="",Y=[],W("Logs cleared","info"))}),e&&e.addEventListener("click",()=>{se=!se,e.textContent=se?"Resume":"Pause",!se&&Y.length>0&&(Y.forEach(n=>W(n.message,n.type)),Y=[]),W(se?"Logs paused":"Logs resumed","info")})}window.addEventListener("beforeunload",()=>{V&&V.close()});function Jt(){const t=document.getElementById("sidebarSearch"),e=document.getElementById("commandPalette"),n=document.getElementById("commandSearchInput"),o=document.querySelectorAll(".command-item");let s=-1;function a(){e&&(e.style.display="flex",n&&(n.focus(),n.value=""),s=-1,l())}function r(){e&&(e.style.display="none",s=-1)}function l(){const c=Array.from(o).filter(m=>m.style.display!=="none");o.forEach((m,u)=>{c.indexOf(m)===s?(m.classList.add("selected"),m.scrollIntoView({block:"nearest",behavior:"smooth"})):m.classList.remove("selected")})}function d(c){switch(r(),c){case"deploy":case"nav-deploy":window.router&&window.router.navigate("/deploy");break;case"add-env-var":window.showEnvVarModal&&window.showEnvVarModal();break;case"search-repos":case"nav-repositories":window.router&&window.router.navigate("/repositories");break;case"nav-projects":window.router&&window.router.navigate("/");break;case"nav-applications":window.router&&window.router.navigate("/applications");break;case"nav-history":window.router&&window.router.navigate("/history");break;case"nav-env-vars":window.router&&window.router.navigate("/env-vars");break;case"nav-settings":window.router&&window.router.navigate("/settings");break}}document.addEventListener("keydown",c=>{var m;if((c.metaKey||c.ctrlKey)&&c.key==="k"&&(c.preventDefault(),e&&e.style.display==="none"?a():r()),c.key==="Escape"&&e&&e.style.display!=="none"&&r(),e&&e.style.display!=="none"){const u=Array.from(o).filter(y=>y.style.display!=="none");if(c.key==="ArrowDown")c.preventDefault(),s=Math.min(s+1,u.length-1),l();else if(c.key==="ArrowUp")c.preventDefault(),s=Math.max(s-1,-1),l();else if(c.key==="Enter"&&s>=0){c.preventDefault();const f=(m=Array.from(o).filter(v=>v.style.display!=="none")[s])==null?void 0:m.getAttribute("data-action");f&&d(f)}}}),t&&t.addEventListener("click",a),e&&e.addEventListener("click",c=>{c.target===e&&r()}),o.forEach(c=>{c.addEventListener("click",()=>{const m=c.getAttribute("data-action");m&&d(m)})}),n&&n.addEventListener("input",c=>{const m=c.target.value.toLowerCase();o.forEach(u=>{u.querySelector(".command-text").textContent.toLowerCase().includes(m)?u.style.display="flex":u.style.display="none"}),s=-1,l()})}
