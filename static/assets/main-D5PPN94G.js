import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */class Ce{constructor(){this.routes={"/":"projects","/deploy":"deploy","/history":"history","/repositories":"repositories","/domain":"domain","/env-vars":"env-vars","/settings":"settings","/logs":"logs"},this.currentPage=null,this.init()}init(){document.querySelectorAll(".nav-item").forEach(n=>{n.addEventListener("click",e=>{e.preventDefault();const o=n.getAttribute("href");this.navigate(o)})}),window.addEventListener("popstate",()=>{this.loadPage(window.location.pathname)}),this.loadPage(window.location.pathname)}navigate(n){window.history.pushState({},"",n),this.loadPage(n)}loadPage(n){const e=this.routes[n]||"dashboard";if(e==="deploy"){r=null;const o=document.getElementById("projectSidebar");o&&(o.style.display="none");const s=document.getElementById("sidebar");s&&(s.style.display="block")}this.showPage(e),this.updateActiveNav(n),this.updatePageTitle(e),window.scrollTo({top:0,behavior:"smooth"})}showPage(n){document.querySelectorAll(".page").forEach(o=>{o.style.display="none"});const e=document.getElementById(`page-${n}`);if(e){if(e.style.display="block",n==="deploy"){const o=document.getElementById("deploy-status"),s=document.getElementById("deploy-success");o&&(o.textContent="",o.style.color=""),s&&(s.style.display="none")}}else{const o=document.getElementById("page-dashboard");o&&(o.style.display="block")}this.currentPage=n,this.loadPageData(n)}updateActiveNav(n){document.querySelectorAll(".nav-item").forEach(e=>{e.classList.remove("active"),e.getAttribute("href")===n&&e.classList.add("active")})}updatePageTitle(n){const e={projects:"Projects",deploy:"Deploy",history:"History",repositories:"Repositories",domain:"Domain","env-vars":"Environmental Variables",settings:"Settings",logs:"Logs"};document.getElementById("pageTitle").textContent=e[n]||"Dashboard"}loadPageData(n){switch(n){case"projects":_();break;case"history":oe();break;case"repositories":at();break;case"domain":Fe();break;case"env-vars":se();break;case"settings":Be();break;case"logs":bt();break}}}const A=new Ce;window.router=A;async function xe(t){const n=await $e();if(!n)return;const e=I.find(a=>a.id==t),o=e?e.name:"this project";if(await Le(o))try{console.log("Deleting project with token:",n.substring(0,20)+"...");const a=await fetch(`/projects/${t}`,{method:"DELETE",headers:{Authorization:`Bearer ${n}`}});if(console.log("Delete response status:",a.status),!a.ok){const i=await a.json().catch(()=>({}));if(console.error("Delete error response:",i),a.status===401){m("Session expired. Please login again.","error"),localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),setTimeout(()=>{window.location.href="/login"},2e3);return}throw new Error(i.detail||"Failed to delete project")}I=I.filter(i=>i.id!=t),$=$.filter(i=>i.id!=t),F($),m("Project deleted","success")}catch(a){console.error("Delete project error:",a),m(`Delete failed: ${a.message}`,"error")}}function Le(t){return new Promise(n=>{const e=document.createElement("div");e.className="modal-overlay";const o=document.createElement("div");o.className="delete-confirmation-modal",o.innerHTML=`
      <h3>Delete Project</h3>
      <p>
        Are you sure you want to delete <strong>${b(t)}</strong>?<br>
        This will stop and remove its container and image.
      </p>
      <div class="delete-confirmation-actions">
        <button class="cancel-btn">Cancel</button>
        <button class="delete-btn">Delete</button>
      </div>
    `,e.appendChild(o),document.body.appendChild(e);const s=o.querySelector(".cancel-btn"),a=o.querySelector(".delete-btn"),i=()=>{document.body.removeChild(e)};s.onclick=()=>{i(),n(!1)},a.onclick=()=>{i(),n(!0)},e.onclick=c=>{c.target===e&&(i(),n(!1))},a.focus()})}function Pe(t){try{const e=JSON.parse(atob(t.split(".")[1])).exp*1e3,o=Date.now();return e<o+5*60*1e3}catch{return!0}}async function $e(){const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");return!t||Pe(t)?(m("Session expired. Please login again.","error"),localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),setTimeout(()=>{window.location.href="/login"},2e3),null):t}let O=localStorage.getItem("access_token")||localStorage.getItem("authToken"),ee=localStorage.getItem("username");document.addEventListener("DOMContentLoaded",()=>{W(),window.location.pathname==="/login"||window.location.pathname.includes("login.html")||setTimeout(()=>{if(O&&ee){_e(),Et();const n=document.getElementById("page-projects");n&&window.location.pathname==="/"&&(n.style.display="block")}},100)});function W(){const t=document.getElementById("userSection"),n=document.getElementById("authButtons"),e=document.getElementById("logoutBtn"),o=document.getElementById("newDeployBtn");document.getElementById("userName"),document.getElementById("userEmail"),document.getElementById("userAvatar");const s=window.location.pathname==="/login"||window.location.pathname.includes("login.html");O&&ee?(t.style.display="flex",n.style.display="none",e.style.display="block",o.style.display="block",Ie(),_(),s&&(window.location.href="/")):(t.style.display="none",n.style.display="block",e.style.display="none",o.style.display="none",s||(window.location.href="/login"))}function _e(){var a,i;document.getElementById("logoutBtn").addEventListener("click",()=>{localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),O=null,ee=null,W(),m("Logged out successfully","success"),A.navigate("/")});const t=document.getElementById("projectsSearch");t&&t.addEventListener("input",c=>{const d=c.target.value.toLowerCase();$=I.filter(l=>l.name.toLowerCase().includes(d)||l.repository&&l.repository.toLowerCase().includes(d)),F($)});const n=document.getElementById("addProjectBtn");n&&n.addEventListener("click",()=>{window.router&&window.router.navigate("/deploy")});const e=document.getElementById("browseUploadLink");e&&e.addEventListener("click",c=>{c.preventDefault(),window.router&&window.router.navigate("/deploy")}),document.getElementById("newDeployBtn").addEventListener("click",()=>{r=null;const c=document.getElementById("projectSidebar");c&&(c.style.display="none");const d=document.getElementById("sidebar");d&&(d.style.display="block"),A.navigate("/deploy")});const o=document.getElementById("deployForm");o&&o.addEventListener("submit",Ye);const s=document.getElementById("deploy-type");s&&s.addEventListener("change",c=>{const d=document.getElementById("single-repo-group"),l=document.getElementById("split-repo-group"),p=document.getElementById("git-url");c.target.value==="split"?(d.style.display="none",l.style.display="block",p&&p.removeAttribute("required")):(d.style.display="block",l.style.display="none",p&&p.setAttribute("required","required"))}),(a=document.getElementById("clearHistoryBtn"))==null||a.addEventListener("click",Qe),(i=document.getElementById("searchReposBtn"))==null||i.addEventListener("click",we),Ne()}function Ne(){const t=document.querySelector(".search-input"),n=document.getElementById("spotlightModal"),e=document.getElementById("spotlightSearch"),o=document.getElementById("spotlightResults");!t||!n||!e||!o||(t.addEventListener("click",De),n.addEventListener("click",s=>{s.target===n&&Y()}),e.addEventListener("input",Te),o.addEventListener("click",Me),document.addEventListener("keydown",s=>{s.key==="Escape"&&n.style.display!=="none"&&Y()}))}function De(){const t=document.getElementById("spotlightModal"),n=document.getElementById("spotlightSearch");t.style.display="flex",setTimeout(()=>{n.focus()},100)}function Y(){const t=document.getElementById("spotlightModal"),n=document.getElementById("spotlightSearch"),e=document.getElementById("spotlightResults");t.style.display="none",n.value="",e.innerHTML=`
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
  `}function Te(t){const n=t.target.value.toLowerCase().trim(),e=document.getElementById("spotlightResults");if(!n){e.innerHTML=`
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
    `;return}const o=Ae(n);Ue(o)}function Ae(t){const n={projects:[],actions:[],navigation:[]};I&&I.length>0&&(n.projects=I.filter(s=>s.name.toLowerCase().includes(t)||s.repository&&s.repository.toLowerCase().includes(t)));const e=[{name:"New Deploy",action:"new-deploy",icon:"🚀"},{name:"Repositories",action:"repositories",icon:"📁"},{name:"History",action:"history",icon:"📜"},{name:"Settings",action:"settings",icon:"⚙️"},{name:"Domain",action:"domain",icon:"🌐"}];n.actions=e.filter(s=>s.name.toLowerCase().includes(t));const o=[{name:"Projects",action:"projects",icon:"📊"},{name:"Repositories",action:"repositories",icon:"📁"},{name:"History",action:"history",icon:"📜"},{name:"Domain",action:"domain",icon:"🌐"},{name:"Settings",action:"settings",icon:"⚙️"}];return n.navigation=o.filter(s=>s.name.toLowerCase().includes(t)),n}function Ue(t){const n=document.getElementById("spotlightResults");let e='<div class="search-results">';t.projects.length>0&&(e+='<div class="search-category">',e+='<div class="search-category-title">Projects</div>',t.projects.forEach(o=>{const s=o.status==="running"?"🚀":"📦",a=o.status==="running"?"RUNNING":o.status==="failed"?"FAILED":"IMPORTED";e+=`
        <div class="search-result-item" data-type="project" data-id="${o.id}">
          <span class="search-result-icon">${s}</span>
          <div class="search-result-content">
            <div class="search-result-title">${b(o.name)}</div>
            <div class="search-result-subtitle">${o.repository||"No repository"}</div>
          </div>
          <span class="search-result-badge">${a}</span>
        </div>
      `}),e+="</div>"),t.actions.length>0&&(e+='<div class="search-category">',e+='<div class="search-category-title">Actions</div>',t.actions.forEach(o=>{e+=`
        <div class="search-result-item" data-type="action" data-action="${o.action}">
          <span class="search-result-icon">${o.icon}</span>
          <div class="search-result-content">
            <div class="search-result-title">${o.name}</div>
          </div>
        </div>
      `}),e+="</div>"),t.navigation.length>0&&(e+='<div class="search-category">',e+='<div class="search-category-title">Navigation</div>',t.navigation.forEach(o=>{e+=`
        <div class="search-result-item" data-type="navigation" data-action="${o.action}">
          <span class="search-result-icon">${o.icon}</span>
          <div class="search-result-content">
            <div class="search-result-title">${o.name}</div>
          </div>
        </div>
      `}),e+="</div>"),t.projects.length===0&&t.actions.length===0&&t.navigation.length===0&&(e=`
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <p>No results found for "${b(document.getElementById("spotlightSearch").value)}"</p>
      </div>
    `),e+="</div>",n.innerHTML=e}function Me(t){const n=t.target.closest(".suggestion-item, .search-result-item");if(!n)return;const e=n.dataset.action,o=n.dataset.type,s=n.dataset.id;if(Y(),o==="project"&&s)te(parseInt(s));else if(e)switch(e){case"new-deploy":window.router&&window.router.navigate("/deploy");break;case"repositories":window.router&&window.router.navigate("/repositories");break;case"history":window.router&&window.router.navigate("/history");break;case"domain":window.router&&window.router.navigate("/domain");break;case"settings":window.router&&window.router.navigate("/settings");break;case"projects":window.router&&window.router.navigate("/projects");break}}function Fe(){document.getElementById("page-domain")}function C(){const t={},n=localStorage.getItem("access_token")||localStorage.getItem("authToken");return n&&(t.Authorization=`Bearer ${n}`),t}let I=[],$=[];async function _(){const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t){F([]);return}Re();try{const n=await fetch("/deployments",{headers:{Authorization:`Bearer ${t}`}});n.ok?(I=(await n.json()).map(o=>{var q;const s=o.git_url||"",a=s,i=s?(q=String(s).split("/").pop())==null?void 0:q.replace(/\.git$/,""):null,c=o.app_name||i||o.container_name||"Untitled Project",d=(o.status||"").toLowerCase();let l;d==="running"?l="running":d==="failed"||d==="error"?l="failed":l="imported";let p=!1,u="single",y=null,g=null;const v=String(o.git_url||""),E=v.startsWith("split::"),L=!o.parent_project_id&&!o.component_type;if(E){p=!0,u="split";try{const h=v.replace("split::","").split("|");h.length===2&&(y=h[0],g=h[1])}catch{}}else if(d==="imported_split")p=!0,u="split";else if(L&&v.includes("|")){p=!0,u="split";try{const h=v.split("|");h.length===2&&(y=h[0],g=h[1])}catch{}}return{id:o.id,name:c,status:l,url:o.deployed_url||o.app_url,createdAt:o.created_at,updatedAt:o.updated_at,repository:a,repository_url:a,git_url:s,project_type:u,isSplit:p,frontend_url:y,backend_url:g,containerUptime:o.container_uptime||"Unknown",containerPorts:o.container_ports||"No ports",containerImage:o.container_image||"Unknown",containerStatus:o.container_status||"Unknown",isRunning:o.is_running||!1}}),$=[...I],F($)):F([])}catch(n){console.error("Error loading projects:",n),F([])}}function F(t){const n=document.getElementById("projectsGrid");if(n){if(t.length===0){n.innerHTML=`
      <div class="empty-state">
        <p>No projects found</p>
        <button class="btn-primary" onclick="if(window.router){window.router.navigate('/deploy');}else{window.location.href='/deploy';}">Create First Project</button>
      </div>
    `;return}n.innerHTML=t.map(e=>{const o=e.status==="running"?"status-success":e.status==="failed"?"status-error":"status-info",s=e.status==="running"?"Running":e.status==="failed"?"Failed":"Imported",a=e.status==="running"?"🚀":"📦",i=e.updatedAt?R(e.updatedAt):"Recently";return`
      <div class="project-card" data-project-id="${e.id}" onclick="selectProject(${e.id})">
        <div class="project-header">
          <div class="project-icon">${a}</div>
          <div class="project-status ${o}">${s}</div>
          </div>
        
        <div class="project-info">
          <h3 class="project-name">${b(e.name)}</h3>
          <div class="project-meta">
            <svg class="icon-clock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12,6 12,12 16,14"></polyline>
            </svg>
            <span>Updated ${i}</span>
        </div>
          
                 ${e.status==="running"?`
                 <div class="project-metrics">
                   <div class="metric">
                     <span class="metric-label">Uptime</span>
                     <span class="metric-value">${e.containerUptime}</span>
            </div>
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
      `}).join("")}}async function Ve(t){try{const n=I.find(e=>e.id===t);if(!n){m("Project not found","error");return}if(!n.url||n.url==="#"){m("Project URL not available. Make sure the project is deployed.","error");return}window.open(n.url,"_blank"),m(`Opening ${n.name}...`,"info")}catch(n){console.error("Error opening project site:",n),m("Failed to open project site: "+n.message,"error")}}function Re(){const t=document.getElementById("projectsGrid");t&&(t.innerHTML=`
    <div class="loading-skeleton">
      ${Array(3).fill(`
        <div class="skeleton-card">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line short"></div>
        </div>
      `).join("")}
    </div>
  `)}let r=null;function te(t){_().then(()=>{const e=I.find(o=>o.id==t);if(!e){const o=$.find(s=>s.id==t);o&&(r=o,J(o));return}r=e,J(e)});const n=document.getElementById("page-project-config");n&&n.style.display!=="none"&&ne()}function J(t){const n=document.getElementById("sidebar");n&&(n.style.display="none");let e=document.getElementById("projectSidebar");e||(e=He(),document.body.appendChild(e));const o=e.querySelector("#projectSidebarName");o&&(o.textContent=t.name);const s=e.querySelector("#projectSidebarId");s&&(s.textContent=t.id);const a=e.querySelector('a[data-project-page="status"]');a&&(t.project_type==="split"?a.style.display="flex":a.style.display="none"),e.style.display="block",document.getElementById("pageTitle").textContent=t.name,ve(),ye("deploy")}function He(){const t=document.createElement("aside");return t.id="projectSidebar",t.className="sidebar project-sidebar",t.innerHTML=`
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
  `,t.querySelectorAll(".project-nav-item").forEach(n=>{n.addEventListener("click",async e=>{e.preventDefault();const o=n.getAttribute("data-project-page");if(await _(),r){const s=I.find(a=>a.id===r.id);s&&(r=s)}ye(o),t.querySelectorAll(".project-nav-item").forEach(s=>s.classList.remove("active")),n.classList.add("active")})}),t}function Oe(){const t=document.getElementById("projectSidebar");t&&(t.style.display="none");const n=document.getElementById("sidebar");n&&(n.style.display="block"),r=null,document.getElementById("pageTitle").textContent="Projects",document.querySelectorAll(".page").forEach(o=>{o.style.display="none"});const e=document.getElementById("page-projects");e&&(e.style.display="block"),_()}function ye(t){var n;switch(document.querySelectorAll(".page").forEach(e=>{e.style.display="none"}),t){case"deploy":const e=document.getElementById("page-deploy");if(e){e.style.display="block";const s=document.getElementById("deploy-status"),a=document.getElementById("deploy-success");s&&(s.textContent="",s.style.color=""),a&&(a.style.display="none");const i=(n=e.querySelector(".card h2"))==null?void 0:n.closest(".card");if(r){i&&(i.style.display="block");const h=document.getElementById("project-components-section");r!=null&&r.project_type||r!=null&&r.isSplit,h&&(h.style.display="none")}else{i&&(i.style.display="block");const h=document.getElementById("project-components-section");h&&(h.style.display="none")}document.getElementById("deploy-type");const c=document.getElementById("deploy-type-group"),d=document.getElementById("single-repo-group"),l=document.getElementById("split-repo-group"),p=document.getElementById("split-deploy-layout"),u=document.getElementById("git-url"),y=document.getElementById("frontend-url"),g=document.getElementById("backend-url"),v=document.getElementById("deploy-submit-default");e.querySelectorAll(".dynamic-split-btn").forEach(h=>h.remove());let E=r==null?void 0:r.project_type;const L=(r==null?void 0:r.git_url)||(r==null?void 0:r.repository_url)||"",q=L.startsWith("split::");if(E||(r!=null&&r.isSplit||q?E="split":E="single"),q&&E!=="split"?(console.warn("Project type mismatch detected. git_url indicates split but project_type is",E),E="split"):!q&&E==="split"&&L&&(console.warn("Project type mismatch detected. git_url indicates single but project_type is split"),E="single"),r)if(c&&(c.style.display="none"),E==="split"){d&&(d.style.display="none"),l&&(l.style.display="none"),p&&(p.style.display="block"),y&&(y.value=r.frontend_url||""),g&&(g.value=r.backend_url||""),u&&u.removeAttribute("required"),v&&(v.style.display="none");const h=document.getElementById("deploy-frontend-btn"),re=document.getElementById("deploy-backend-btn"),le=document.getElementById("deploy-both-btn");h&&(h.onclick=async()=>{var j;const S=(j=y==null?void 0:y.value)==null?void 0:j.trim();if(!S||!S.startsWith("http"))return m("Enter a valid frontend URL","error");const k=K(!1);document.getElementById("step-frontend").style.display="flex",k.updateFrontendStatus("deploying","Deploying your frontend now...");const w=await pe(S,"frontend",k,!0);w&&w.success&&w.deployed_url?(k.showUrls(w.deployed_url,null),document.getElementById("close-deployment-dialog").onclick=()=>{k.close(),G(),V()}):w&&!w.success&&setTimeout(()=>k.close(),3e3)}),re&&(re.onclick=async()=>{var j;const S=(j=g==null?void 0:g.value)==null?void 0:j.trim();if(!S||!S.startsWith("http"))return m("Enter a valid backend URL","error");const k=K(!1);document.getElementById("step-backend").style.display="flex",k.updateBackendStatus("deploying","Deploying your backend now...");const w=await pe(S,"backend",k,!0);w&&w.success&&w.deployed_url?(k.showUrls(null,w.deployed_url),document.getElementById("close-deployment-dialog").onclick=()=>{k.close(),G(),V()}):w&&!w.success&&setTimeout(()=>k.close(),3e3)}),le&&(le.onclick=async()=>{var ce,de;const S=(ce=y==null?void 0:y.value)==null?void 0:ce.trim(),k=(de=g==null?void 0:g.value)==null?void 0:de.trim();if(!S||!S.startsWith("http")||!k||!k.startsWith("http")){m("Please enter valid Frontend and Backend repository URLs","error");return}let w=!1,j={};if(r&&r.id)try{const f=await fetch(`/api/env-vars?project_id=${r.id}`,{headers:C()});if(f.ok){const N=(await f.json()).variables||{};w=Object.keys(N).length>0,console.log("Existing env vars check:",{hasExistingEnvVars:w,count:Object.keys(N).length})}}catch(f){console.warn("Failed to check existing env vars:",f)}if(w){await U();return}try{const f=await fetch(`/api/env-vars/detect?frontend_url=${encodeURIComponent(S)}&backend_url=${encodeURIComponent(k)}`,{headers:C()});f.ok?(j=(await f.json()).suggestions||{},console.log("Env var detection result:",{count:Object.keys(j).length,vars:j})):console.warn("Env var detection API returned:",f.status)}catch(f){console.warn("Env var detection failed:",f)}We(j,async()=>{if(Object.keys(j).length===0){r&&r.id?A.navigate("/env-vars"):(m("No env vars detected. Add them manually after deployment","info"),await U());return}if(m("Importing environment variables...","info"),r&&r.id){const f={};Object.keys(j).forEach(M=>{f[M]=""});const x=localStorage.getItem("access_token")||localStorage.getItem("authToken"),N=await fetch(`/api/env-vars?project_id=${r.id}`,{headers:{Authorization:`Bearer ${x}`}});if(N.ok){const je={...(await N.json()).variables||{},...f};(await fetch("/api/env-vars",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${x}`},body:JSON.stringify({variables:je,project_id:r.id})})).ok?(m("Environment variables imported successfully!","success"),setTimeout(()=>U(),500)):(m("Failed to import environment variables","error"),await U())}else m("Failed to load existing environment variables","error"),await U()}else m("Save detected env vars after deployment","info"),await U()},()=>{r&&r.id?A.navigate("/env-vars"):m("Please add environment variables after deployment","info")},async()=>{await U()});async function U(){const f=K(!0);document.getElementById("step-backend").style.display="flex",document.getElementById("step-frontend").style.display="flex",f.updateBackendStatus("deploying","Deploying your backend now...");try{const x=new FormData;x.append("deploy_type","split"),x.append("frontend_url",S),x.append("backend_url",k),r&&r.id&&x.append("project_id",String(r.id));const N=await fetch("/deploy",{method:"POST",headers:C(),body:x}),M=await N.json();N.ok&&M.deployed_url?(f.updateBackendStatus("success","Backend deployed! ✅"),f.updateFrontendStatus("success","Frontend deployed! ✅"),f.showUrls(M.deployed_url,null),document.getElementById("close-deployment-dialog").onclick=()=>{f.close(),_(),G(),V()},m("Split deployment successful!","success")):(f.updateBackendStatus("failed",M.detail||"Deployment failed"),f.updateFrontendStatus("failed","Could not deploy"),m(M.detail||"Deployment failed","error"),setTimeout(()=>f.close(),3e3))}catch{f.updateBackendStatus("failed","Network error"),f.updateFrontendStatus("failed","Network error"),m("Network error during deployment","error"),setTimeout(()=>f.close(),3e3)}}}),v&&(v.style.display="none")}else E==="single"&&(d&&(d.style.display="block"),l&&(l.style.display="none"),p&&(p.style.display="none"),u&&r&&r.repository_url&&(u.value=r.repository_url),v&&(v.textContent="🚀 Deploy",v.style.display=""));else c&&(c.style.display=""),l&&(l.style.display="none"),p&&(p.style.display="none"),d&&(d.style.display="block"),u&&(u.value=""),v&&(v.textContent="🚀 Deploy",v.style.display="")}document.getElementById("pageTitle").textContent="Deploy";break;case"status":ze();break;case"configuration":qe();break;case"domain-config":Ke();break;case"env-vars":const o=document.getElementById("page-env-vars");o&&(o.style.display="block",se());break}}async function qe(){let t=document.getElementById("page-project-config");t||(t=document.createElement("div"),t.id="page-project-config",t.className="page",t.innerHTML=`
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
              <span class="config-value-text" id="projectConfigCreated">${r!=null&&r.createdAt?fe(r.createdAt):"Unknown"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Last update:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigUpdated">${r!=null&&r.updatedAt?R(new Date(r.updatedAt)):"Unknown"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Container Ports:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigPorts">${r!=null&&r.containerPorts?he(r.containerPorts):"No ports"}</span>
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
    `,document.getElementById("pageContent").appendChild(t));const n=document.getElementById("project-components-section");n&&(n.style.display="none"),ne();const e=document.getElementById("changeProjectNameBtn");e&&(e.onclick=()=>ge()),t.style.display="block"}async function ze(){document.querySelectorAll(".page").forEach(n=>n.style.display="none");let t=document.getElementById("page-status");if(t||(t=document.createElement("div"),t.id="page-status",t.className="page",document.getElementById("pageContent").appendChild(t)),t.innerHTML="",r&&r.id)try{const n=await fetch(`/projects/${r.id}/components`,{headers:C()});if(n.ok){const o=(await n.json()).components||[],s=o.find(p=>p.component_type==="frontend"),a=o.find(p=>p.component_type==="backend"),i=s?s.status==="running"?"RUNNING":s.status.toUpperCase():"NOT DEPLOYED",c=a?a.status==="running"?"RUNNING":a.status.toUpperCase():"NOT DEPLOYED",d=(s==null?void 0:s.status)==="running"?"status-success":(s==null?void 0:s.status)==="failed"?"status-error":"status-info",l=(a==null?void 0:a.status)==="running"?"status-success":(a==null?void 0:a.status)==="failed"?"status-error":"status-info";t.innerHTML=`
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
                      <span>Updated ${s.updated_at?R(new Date(s.updated_at)):"Recently"}</span>
                    `:"<span>Not deployed yet</span>"}
                  </div>
                  ${s&&s.status==="running"?`
                    <div class="project-metrics">
                      <div class="metric">
                        <span class="metric-label">Uptime</span>
                        <span class="metric-value">${s.container_uptime||"Unknown"}</span>
                      </div>
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
                  <div class="project-status ${l}">${c}</div>
                </div>
                <div class="project-info">
                  <h3 class="project-name">Backend</h3>
                  <div class="project-meta">
                    ${a?`
                      <svg class="icon-clock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12,6 12,12 16,14"></polyline>
                      </svg>
                      <span>Updated ${a.updated_at?R(new Date(a.updated_at)):"Recently"}</span>
                    `:"<span>Not deployed yet</span>"}
                  </div>
                  ${a&&a.status==="running"?`
                    <div class="project-metrics">
                      <div class="metric">
                        <span class="metric-label">Uptime</span>
                        <span class="metric-value">${a.container_uptime||"Unknown"}</span>
                      </div>
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
        `}}catch(n){console.error("Error loading project components:",n),t.innerHTML=`
        <div class="card">
          <p>Unable to load project components. Please try again later.</p>
        </div>
      `}t.style.display="block",document.getElementById("pageTitle").textContent="Status"}async function G(){if(!(!r||!r.id))try{const t=await fetch(`/projects/${r.id}/components`,{headers:C()});if(!t.ok)return;const e=(await t.json()).components||[],o=e.find(y=>y.component_type==="frontend"),s=e.find(y=>y.component_type==="backend"),a=o&&o.status&&o.status!=="imported"&&o.status!=="imported_split",i=s&&s.status&&s.status!=="imported"&&s.status!=="imported_split",c=a&&i;let d=document.getElementById("project-components-section");const l=document.getElementById("page-deploy"),p=document.getElementById("page-project-config"),u=p==null?void 0:p.querySelector("#project-components-section");if(u&&u.remove(),c&&l&&l.style.display!=="none"){if(!d){d=document.createElement("div"),d.id="project-components-section",d.className="card project-components-card";const L=l.querySelector(".card");L?l.insertBefore(d,L):l.appendChild(d)}d.style.display="block";const y=o?o.status==="running"?"RUNNING":o.status.toUpperCase():"NOT DEPLOYED",g=s?s.status==="running"?"RUNNING":s.status.toUpperCase():"NOT DEPLOYED",v=(o==null?void 0:o.status)==="running"?"status-success":(o==null?void 0:o.status)==="failed"?"status-error":"status-info",E=(s==null?void 0:s.status)==="running"?"status-success":(s==null?void 0:s.status)==="failed"?"status-error":"status-info";d.innerHTML=`
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
                <span>Updated ${o.updated_at?R(new Date(o.updated_at)):"Recently"}</span>
              `:"<span>Not deployed yet</span>"}
            </div>
            ${o&&o.status==="running"?`
              <div class="project-metrics">
                <div class="metric">
                  <span class="metric-label">Uptime</span>
                  <span class="metric-value">${o.container_uptime||"Unknown"}</span>
                </div>
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
            <div class="project-status ${E}">${g}</div>
          </div>
          <div class="project-info">
            <h3 class="project-name">Backend</h3>
            <div class="project-meta">
              ${s?`
                <svg class="icon-clock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                <span>Updated ${s.updated_at?R(new Date(s.updated_at)):"Recently"}</span>
              `:"<span>Not deployed yet</span>"}
            </div>
            ${s&&s.status==="running"?`
              <div class="project-metrics">
                <div class="metric">
                  <span class="metric-label">Uptime</span>
                  <span class="metric-value">${s.container_uptime||"Unknown"}</span>
                </div>
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
    `,requestAnimationFrame(()=>{d.classList.add("components-visible");const L=l.querySelector(".card:not(#project-components-section)");L&&L.classList.add("deploy-card-slide-down")})}else if(d){d.style.display="none",d.classList.remove("components-visible");const y=l==null?void 0:l.querySelector(".card:not(#project-components-section)");y&&y.classList.remove("deploy-card-slide-down")}}catch(t){console.error("Error loading project components:",t)}}function Ge(t){t&&window.open(t,"_blank")}function We(t,n,e,o){const s=document.createElement("div");s.className="modal-overlay",s.id="envVarsDetectionOverlay";const a=document.createElement("div");a.className="modal-content enhanced",a.style.maxWidth="600px";const i=Object.keys(t).length>0,c=i?Object.entries(t).map(([l,p])=>`
      <div class="env-var-suggestion" style="padding: 0.75rem; margin-bottom: 0.5rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="font-weight: 600; color: #111827; margin-bottom: 0.25rem;">${l}</div>
        <div style="font-size: 0.875rem; color: #6b7280;">
          Detected from: ${p.detected_from} (${p.source})
          ${p.component?` | Component: ${p.component}`:""}
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
        ${i?`We found ${Object.keys(t).length} environment variables in your code. Choose how to proceed:`:"No environment variables were detected. You can add them manually or proceed without them."}
      </p>
    </div>
    <div style="padding: 1.5rem; max-height: 400px; overflow-y: auto;">
      ${c}
    </div>
    <div style="padding: 1.5rem; border-top: 1px solid #e5e7eb; display: flex; gap: 0.75rem; justify-content: flex-end;">
      <button class="btn-secondary skip-env-btn" style="padding: 0.75rem 1.5rem;">No, Skip</button>
      <button class="btn-secondary add-manual-env-btn" style="padding: 0.75rem 1.5rem;">Add Manually</button>
      ${i?'<button class="btn-primary import-env-btn" style="padding: 0.75rem 1.5rem;">✅ Import All</button>':""}
    </div>
  `,s.appendChild(a),document.body.appendChild(s),document.querySelector(".skip-env-btn").onclick=()=>{s.remove(),o&&o()},document.querySelector(".add-manual-env-btn").onclick=()=>{s.remove(),e&&e()};const d=document.querySelector(".import-env-btn");return d&&(d.onclick=async()=>{s.remove(),n&&await n()}),s}function K(t=!0){const n=document.createElement("div");n.className="modal-overlay deployment-progress-overlay",n.id="deploymentProgressOverlay";const e=document.createElement("div");return e.className="deployment-progress-modal",e.innerHTML=`
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
  `,n.appendChild(e),document.body.appendChild(n),{overlay:n,updateBackendStatus:(o,s)=>{const a=document.getElementById("step-backend"),i=a.querySelector(".step-icon"),c=document.getElementById("backend-status"),d=document.getElementById("backend-message");d.textContent=s,o==="deploying"?(i.textContent="⏳",c.textContent="",a.classList.remove("completed","failed"),a.classList.add("active")):o==="success"?(i.textContent="✅",c.textContent="✓",a.classList.remove("active","failed"),a.classList.add("completed")):o==="failed"&&(i.textContent="❌",c.textContent="✗",a.classList.remove("active","completed"),a.classList.add("failed"))},updateFrontendStatus:(o,s)=>{const a=document.getElementById("step-frontend"),i=a.querySelector(".step-icon"),c=document.getElementById("frontend-status"),d=document.getElementById("frontend-message");d.textContent=s,o==="deploying"?(i.textContent="⏳",c.textContent="",a.classList.remove("completed","failed"),a.classList.add("active")):o==="success"?(i.textContent="✅",c.textContent="✓",a.classList.remove("active","failed"),a.classList.add("completed")):o==="failed"&&(i.textContent="❌",c.textContent="✗",a.classList.remove("active","completed"),a.classList.add("failed"))},showUrls:(o,s)=>{const a=document.getElementById("deployment-urls"),i=document.getElementById("frontend-url-link"),c=document.getElementById("backend-url-link"),d=document.getElementById("close-deployment-dialog");o?(i.href=o,i.textContent=o,i.closest(".url-item").style.display="flex"):i.closest(".url-item").style.display="none",s?(c.href=s,c.textContent=s,c.closest(".url-item").style.display="flex"):c.closest(".url-item").style.display="none",a.style.display="block",d.style.display="block"},close:()=>{const o=document.getElementById("deploymentProgressOverlay");o&&document.body.removeChild(o)}}}function ge(){if(!r){m("No project selected","error");return}const t=document.createElement("div");t.className="modal-overlay";const n=document.createElement("div");n.className="modal-content enhanced",n.innerHTML=`
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
  `,t.appendChild(n),document.body.appendChild(t);const e=document.getElementById("newProjectNameInput");e&&(e.focus(),e.select());const o=n.querySelector(".cancel-name-btn"),s=n.querySelector(".save-name-btn"),a=()=>{document.body.removeChild(t)};o.onclick=()=>{a()},s.onclick=async()=>{const c=e.value.trim();if(!c){m("Project name cannot be empty","error");return}if(c===r.name){a();return}try{const d=localStorage.getItem("access_token")||localStorage.getItem("authToken"),l=await fetch(`/projects/${r.id}/name`,{method:"PUT",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${d}`},body:new URLSearchParams({app_name:c})}),p=await l.json();if(l.ok){m("Project name updated successfully!","success"),r.name=c,a();const u=I.findIndex(g=>g.id===r.id);u>=0&&(I[u].name=c),ne(),F($);const y=document.getElementById("projectSidebarName");y&&(y.textContent=c),document.getElementById("pageTitle").textContent=c}else m(p.detail||"Failed to update project name","error")}catch(d){console.error("Error updating project name:",d),m("Failed to update project name: "+d.message,"error")}},t.onclick=c=>{c.target===t&&a()};const i=c=>{c.key==="Escape"&&(a(),document.removeEventListener("keydown",i))};document.addEventListener("keydown",i)}function ne(){if(!r)return;const t=document.getElementById("projectConfigName"),n=document.getElementById("projectConfigOwner"),e=document.getElementById("projectConfigId"),o=document.getElementById("projectConfigCreated"),s=document.getElementById("projectConfigUpdated"),a=document.getElementById("projectConfigPorts"),i=document.getElementById("projectConfigImage"),c=document.getElementById("projectConfigStatus");if(t&&(t.textContent=r.name||"Unknown"),n){const d=localStorage.getItem("username"),l=localStorage.getItem("displayName");n.textContent=l||d||"Unknown User"}e&&(e.textContent=r.id||"-"),o&&(o.textContent=r.createdAt?fe(r.createdAt):"Unknown"),s&&(s.textContent=r.updatedAt?R(new Date(r.updatedAt)):"Unknown"),a&&(a.textContent=r.containerPorts?he(r.containerPorts):"No ports"),i&&(i.textContent=r.containerImage||"Unknown"),c&&(c.textContent=r.containerStatus||"Unknown")}function Ke(){let t=document.getElementById("page-project-domain");t||(t=document.createElement("div"),t.id="page-project-domain",t.className="page",t.innerHTML=`
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
    `,document.getElementById("pageContent").appendChild(t)),t.style.display="block"}function Ze(t){te(t)}async function ve(){const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t){console.log("No auth token found");return}try{const n=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${t}`}});if(n.ok){const e=await n.json(),o=document.getElementById("projectSidebar");if(o){const s=o.querySelector("#projectSidebarUserName"),a=o.querySelector("#projectSidebarUserEmail"),i=o.querySelector("#projectSidebarUserAvatar");if(s&&(s.textContent=e.display_name||e.username||"User"),a&&(a.textContent=e.email||"No email"),i)if(e.avatar_url){const c=new Image;c.onload=()=>{i.style.backgroundImage=`url(${e.avatar_url})`,i.style.backgroundSize="cover",i.style.backgroundPosition="center",i.textContent=""},c.onerror=()=>{i.style.backgroundImage="",i.textContent=(e.display_name||e.username||"U").charAt(0).toUpperCase()},c.src=e.avatar_url}else i.style.backgroundImage="",i.textContent=(e.display_name||e.username||"U").charAt(0).toUpperCase()}}else console.error("Failed to load user profile:",n.status)}catch(n){console.error("Error loading user profile:",n)}}function R(t){if(!t)return"Recently";const e=Date.now()-new Date(t).getTime(),o=Math.floor(e/6e4),s=Math.floor(e/36e5),a=Math.floor(e/864e5);if(o<1)return"Just now";if(o<60)return`${o}m ago`;if(s<24)return`${s}h ago`;if(a<7)return`${a}d ago`;const i=new Date(t);return i.toLocaleDateString("en-US",{month:"short",day:"numeric",year:i.getFullYear()!==new Date().getFullYear()?"numeric":void 0})}function fe(t){return t?new Date(t).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit",hour12:!0,timeZone:"Asia/Kathmandu"}):"Unknown"}function he(t){if(!t||t==="No ports")return"No ports";const n=new Set;return t.split(",").forEach(o=>{const s=o.match(/(\d+)->(\d+)/);if(s){const a=s[1],i=s[2];n.add(`${a}:${i}`)}}),n.size===0?t:Array.from(n).sort().join(", ")}async function V(){await _();try{const t=await fetch("/deployments",{headers:C()});if(t.ok){const n=await t.json();document.getElementById("totalDeployments").textContent=n.length,document.getElementById("runningApps").textContent=n.filter(o=>o.status==="success").length;const e=document.getElementById("recentActivity");n.length>0?e.innerHTML=n.slice(0,5).map(o=>{const s=o.app_name||o.container_name||"Untitled Project";return`
          <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
            <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 0.25rem;">${b(s)}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">
              ${new Date(o.created_at).toLocaleString("en-US",{timeZone:"Asia/Kathmandu"})}
            </div>
          </div>
        `}).join(""):e.innerHTML='<p class="recent-activity-empty">No recent activity</p>'}}catch(t){console.error("Error loading dashboard:",t)}}async function Ye(t){var d,l,p,u;if(t.preventDefault(),!O){m("Please login to deploy applications","error"),window.location.href="/login";return}const n=t.target,e=((d=document.getElementById("deploy-type"))==null?void 0:d.value)||"single",o=(l=document.getElementById("git-url"))==null?void 0:l.value.trim(),s=(p=document.getElementById("frontend-url"))==null?void 0:p.value.trim(),a=(u=document.getElementById("backend-url"))==null?void 0:u.value.trim(),i=document.getElementById("deploy-status"),c=document.getElementById("deploy-success");if(c.style.display="none",i.textContent="",e==="split"){if(!s||!s.startsWith("http")||!a||!a.startsWith("http")){i.textContent="Please enter valid Frontend and Backend repository URLs",i.style.color="var(--error)";return}}else if(!o||!o.startsWith("http")){i.textContent="Please enter a valid Git repository URL",i.style.color="var(--error)";return}i.textContent="🚀 Deploying...",i.style.color="var(--primary)";try{const y=new FormData;e==="split"?(y.append("deploy_type","split"),y.append("frontend_url",s),y.append("backend_url",a)):(y.append("deploy_type","single"),y.append("git_url",o)),typeof r=="object"&&r&&r.id&&y.append("project_id",String(r.id));const g=await fetch("/deploy",{method:"POST",headers:C(),body:y}),v=await g.json();g.ok?(i.textContent="✅ Deployment successful!",i.style.color="var(--success)",v.deployed_url&&(c.style.display="block",document.getElementById("openAppBtn").href=v.deployed_url,document.getElementById("openAppBtn").textContent=`Open ${v.deployed_url}`),n.reset(),r&&r.isSplit?setTimeout(()=>{G(),V()},1500):setTimeout(()=>{V(),A.navigate("/applications")},2e3)):(i.textContent=`❌ Error: ${v.detail||"Deployment failed"}`,i.style.color="var(--error)")}catch{i.textContent="❌ Network error. Please try again.",i.style.color="var(--error)"}}async function pe(t,n=null,e=null,o=!1){const s=document.getElementById("deploy-status"),a=document.getElementById("deploy-success");if(!O)return m("Please login to deploy applications","error"),window.location.href="/login",o?{success:!1,error:"Not authenticated"}:void 0;e||(a&&(a.style.display="none"),s&&(s.textContent="",s.style.color="var(--primary)"));try{const i=new FormData;i.append("deploy_type","single"),i.append("git_url",t),typeof r=="object"&&r&&r.id&&i.append("project_id",String(r.id)),n&&typeof r=="object"&&r&&r.project_type==="split"&&i.append("component_type",n);const c=await fetch("/deploy",{method:"POST",headers:C(),body:i}),d=await c.json();if(c.ok){if(e){const l="success",p=n==="backend"?"Backend complete! ✅":"Frontend complete! ✅";n==="backend"?e.updateBackendStatus(l,p):n==="frontend"&&e.updateFrontendStatus(l,p)}else if(s&&(s.textContent="✅ Deployment successful!",s.style.color="var(--success)"),d.deployed_url&&a){a.style.display="block";const l=document.getElementById("openAppBtn");l&&(l.href=d.deployed_url,l.textContent=`Open ${d.deployed_url}`)}return o?{success:!0,deployed_url:d.deployed_url}:(r&&r.isSplit?setTimeout(()=>{G(),V()},1500):setTimeout(()=>{V(),A.navigate("/applications")},2e3),{success:!0,deployed_url:d.deployed_url})}else{const l=d.detail||"Deployment failed";if(e){const p="failed",u=`Error: ${l}`;n==="backend"?e.updateBackendStatus(p,u):n==="frontend"&&e.updateFrontendStatus(p,u)}else s&&(s.textContent=`❌ Error: ${l}`,s.style.color="var(--error)");if(o)return{success:!1,error:l}}}catch{const c="Network error. Please try again.";if(e){const d="failed",l=c;n==="backend"?e.updateBackendStatus(d,l):n==="frontend"&&e.updateFrontendStatus(d,l)}else s&&(s.textContent=`❌ ${c}`,s.style.color="var(--error)");if(o)return{success:!1,error:c}}}async function Je(){if(!O){document.getElementById("applicationsGrid").innerHTML=`
      <div class="empty-state">
        <p>Please login to view your applications</p>
        <a href="/login" class="btn-primary">Login</a>
      </div>
    `;return}try{const t=await fetch("/deployments",{headers:C()});if(t.ok){const n=await t.json(),e=document.getElementById("applicationsGrid");n.length===0?e.innerHTML=`
          <div class="empty-state">
            <p>No applications deployed yet</p>
            <a href="/deploy" class="btn-primary">Deploy Your First App</a>
          </div>
        `:e.innerHTML=n.map(o=>{const s=o.app_name||o.container_name||"Untitled Project";return`
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
        `}).join("")}}catch(t){console.error("Error loading applications:",t)}}async function oe(){if(!O){document.getElementById("historyTableBody").innerHTML=`
      <tr>
        <td colspan="4" class="empty-state">Please login to view deployment history</td>
      </tr>
    `;return}try{const t=await fetch("/deployments",{headers:C()});if(t.ok){const n=await t.json(),e=document.getElementById("historyTableBody");n.length===0?e.innerHTML=`
          <tr>
            <td colspan="4" class="empty-state">No deployment history</td>
          </tr>
        `:e.innerHTML=n.map(o=>{const s=o.app_name||o.container_name||"Untitled Project";return`
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
        `}).join("")}}catch(t){console.error("Error loading history:",t)}}async function Qe(){if(confirm("Are you sure you want to clear all deployment history?"))try{(await fetch("/deployments/clear",{method:"DELETE",headers:C()})).ok&&(m("History cleared successfully","success"),oe())}catch{m("Error clearing history","error")}}async function Xe(t){if(confirm(`Are you sure you want to destroy "${t}"?`))try{(await fetch(`/deployments/${t}`,{method:"DELETE",headers:C()})).ok?(m("Deployment destroyed successfully","success"),oe(),Je()):m("Error destroying deployment","error")}catch{m("Network error","error")}}let B=[],me="";async function we(){const t=document.getElementById("usernameSearch").value.trim();if(!t){m("Please enter a GitHub username","error");return}t!==me&&(B=[],me=t);const n=document.getElementById("repositoriesGrid");n.innerHTML='<div class="empty-state"><p>Loading repositories...</p></div>';try{const e=await fetch(`/api/repositories/${t}`),o=await e.json();e.ok&&o.repositories?o.repositories.length===0?n.innerHTML='<div class="empty-state"><p>No repositories found</p></div>':(n.innerHTML=o.repositories.map(s=>`
          <div class="repository-card ${B.some(i=>i.url===s.clone_url)?"selected":""}" data-repo-url="${s.clone_url}" onclick="toggleRepositorySelection('${s.clone_url}', '${s.name}')">
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
        `).join(""),Q()):n.innerHTML=`<div class="empty-state"><p>${o.detail||"Error loading repositories"}</p></div>`}catch{n.innerHTML='<div class="empty-state"><p>Error loading repositories</p></div>'}}function et(t,n){const e=B.findIndex(o=>o.url===t);if(e>=0)B.splice(e,1),Q();else{if(B.length>=2){m("You can only select up to 2 repositories for a split repository","error");return}B.push({url:t,name:n}),B.length===2&&tt(),Q()}}function tt(){const[t,n]=B,e=document.createElement("div");e.className="modal-overlay",e.id="splitImportModal";const o=document.createElement("div");o.className="modal-content enhanced",o.innerHTML=`
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
        <div class="split-import-repo-name">${b(t.name)}</div>
        <div class="split-import-repo-url">${b(t.url)}</div>
      </div>
      
      <div class="split-import-divider"></div>
      
      <div class="split-import-repo-item">
        <div class="split-import-repo-label">Backend</div>
        <div class="split-import-repo-name">${b(n.name)}</div>
        <div class="split-import-repo-url">${b(n.url)}</div>
      </div>
    </div>
    
    <div class="split-import-actions">
      <button class="cancel-btn">Cancel</button>
      <button class="confirm-btn">Import Multi-Repository</button>
    </div>
  `,e.appendChild(o),document.body.appendChild(e);const s=o.querySelector(".cancel-btn"),a=o.querySelector(".confirm-btn"),i=()=>{document.body.removeChild(e)};s.onclick=()=>{i()},a.onclick=()=>{i();const[d,l]=B;be(d.url,l.url,`${d.name}-${l.name}`)},e.onclick=d=>{d.target===e&&i()};const c=d=>{d.key==="Escape"&&(i(),document.removeEventListener("keydown",c))};document.addEventListener("keydown",c),a.focus()}function Q(){const t=document.getElementById("repositoriesGrid");if(!t)return;t.querySelectorAll(".repository-card").forEach(e=>{const o=e.getAttribute("data-repo-url");B.some(a=>a.url===o)?e.classList.add("selected"):e.classList.remove("selected")})}function nt(){if(B.length!==2){m("Please select exactly 2 repositories","error");return}const[t,n]=B;confirm(`Import as Multi-Repository?

Frontend: ${t.name}
Backend: ${n.name}

Click OK to import these repositories as a multi-repository project.`)&&be(t.url,n.url,`${t.name}-${n.name}`)}async function be(t,n,e){const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o){m("Please login first","error");return}try{m("Importing multi-repositories...","info");const s=await fetch("/api/import-split",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${o}`},body:new URLSearchParams({frontend_url:t,backend_url:n,app_name:e})}),a=await s.json();if(s.ok){m("Multi-repository imported successfully! Navigate to Projects to see it.","success"),B=[];const i=document.getElementById("page-projects");i&&i.style.display!=="none"&&_(),document.getElementById("usernameSearch").value.trim()&&we()}else m(a.detail||"Failed to import multi-repository","error")}catch(s){console.error("Error importing multi-repositories:",s),m("Failed to import multi-repository: "+s.message,"error")}}function ot(t){document.getElementById("git-url").value=t,A.navigate("/deploy"),m("Repository selected","success")}async function st(t,n){const e=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!e){m("Please login first","error");return}try{m("Importing repository...","info");const o=await fetch("/api/import",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${e}`},body:new URLSearchParams({git_url:t,app_name:n||t.split("/").pop()||"Untitled Project"})}),s=await o.json();if(o.ok){m("Repository imported successfully! Navigate to Projects to see it.","success");const a=document.getElementById("page-projects");a&&a.style.display!=="none"&&_()}else m(s.detail||"Failed to import repository","error")}catch(o){console.error("Error importing repository:",o),m("Failed to import repository: "+o.message,"error")}}function at(){document.getElementById("repositoriesGrid").innerHTML=`
    <div class="empty-state">
      <p>Search for a GitHub username to see their repositories</p>
            </div>
        `}function m(t,n="info"){const e=document.getElementById("toast");e.textContent=t,e.className=`toast show ${n}`,setTimeout(()=>{e.classList.remove("show")},3e3)}let H={},X=[];async function se(){try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t){const e=document.getElementById("envVarsList");e&&(e.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `),Z();return}if(!r||!r.id){const e=document.getElementById("envVarsList");e&&(e.innerHTML=`
          <div class="empty-state">
            <p>Please select a project from the Projects page to manage environment variables</p>
          </div>
        `),Z();return}const n=await fetch(`/api/env-vars?project_id=${r.id}`,{headers:{Authorization:`Bearer ${t}`}});if(n.ok){const e=await n.json();H=e.variables||{},X=e.vars_list||[],it()}else if(n.status===401){localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),W();const e=document.getElementById("envVarsList");e&&(e.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `)}else console.error("Failed to load environment variables")}catch(t){console.error("Error loading environment variables:",t)}Z()}function Z(){const t=document.getElementById("importEnvBtn"),n=document.getElementById("addEnvVarBtn"),e=document.getElementById("importEnvCard"),o=document.getElementById("cancelImportBtn"),s=document.getElementById("importEnvForm"),a=document.getElementById("envDropZone"),i=document.getElementById("envFileInput"),c=document.getElementById("envDropZoneBrowse"),d=document.getElementById("envDropZoneFileName");if(t&&(t.onclick=()=>{e.style.display=e.style.display==="none"?"block":"none"}),o&&(o.onclick=()=>{e.style.display="none",i&&(i.value=""),d&&(d.textContent="",d.style.display="none")}),n&&(n.onclick=()=>{rt()}),i&&(i.onchange=l=>{var u;const p=(u=l.target.files)==null?void 0:u[0];d&&(p?(d.textContent=p.name,d.style.display="block"):(d.textContent="",d.style.display="none"))}),a&&i&&!a.dataset.bound){a.dataset.bound="true";const l=p=>{p.preventDefault(),p.stopPropagation()};["dragenter","dragover"].forEach(p=>{a.addEventListener(p,u=>{l(u),a.classList.add("is-dragover")})}),["dragleave","dragend"].forEach(p=>{a.addEventListener(p,u=>{l(u),a.classList.remove("is-dragover")})}),a.addEventListener("dragover",p=>{l(p),p.dataTransfer&&(p.dataTransfer.dropEffect="copy"),a.classList.add("is-dragover")}),a.addEventListener("drop",async p=>{var g;l(p),a.classList.remove("is-dragover");const u=(g=p.dataTransfer)==null?void 0:g.files;if(!u||!u.length)return;const[y]=u;if(d&&(d.textContent=y.name,d.style.display="block"),i)try{const v=new DataTransfer;v.items.add(y),i.files=v.files}catch(v){console.warn("Unable to sync dropped file with input element:",v)}try{await ue(y)}catch(v){console.error("Error importing dropped .env file:",v)}}),a.addEventListener("click",()=>{i.click()}),c&&c.addEventListener("click",p=>{p.preventDefault(),i.click()})}s&&(s.onsubmit=async l=>{var u;l.preventDefault();const p=(u=i==null?void 0:i.files)==null?void 0:u[0];p&&await ue(p)})}async function ue(t){try{if(!t){m("No file detected for import","error");return}m(`Importing ${t.name||".env"}...`,"info");const e=(await t.text()).split(`
`),o={};e.forEach(a=>{if(a=a.trim(),a&&!a.startsWith("#")&&a.includes("=")){const[i,...c]=a.split("="),d=c.join("=").trim().replace(/^["']|["']$/g,"");i.trim()&&(o[i.trim()]=d)}}),H={...H,...o},await ie(),document.getElementById("importEnvCard").style.display="none",document.getElementById("envFileInput").value="";const s=document.getElementById("envDropZoneFileName");s&&(s.textContent="",s.style.display="none"),m("Environment variables imported successfully!","success")}catch(n){console.error("Error importing .env file:",n),m("Failed to import .env file","error")}}function it(){const t=document.getElementById("envVarsList");if(t){if(X.length===0){t.innerHTML=`
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
        ${X.map((n,e)=>{const o=n.updated_at?new Date(n.updated_at).toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kathmandu"}):"Never updated",s=n.project_id?'<span style="font-size: 0.75rem; background: var(--primary); color: white; padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Project</span>':'<span style="font-size: 0.75rem; background: var(--bg-tertiary); color: var(--text-secondary); padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Global</span>';return`
            <tr>
              <td class="name-col">
                <span class="lock-icon">🔒</span>
                <span class="var-name">${b(n.key)}</span>
                ${s}
              </td>
              <td class="updated-col">
                <span class="updated-time">${o}</span>
              </td>
              <td class="actions-col">
                <button class="icon-btn edit-btn" onclick="editEnvVarModal('${b(n.key)}')" title="Edit">
                  ✏️
                </button>
                <button class="icon-btn delete-btn" onclick="deleteEnvVar('${b(n.key)}')" title="Delete">
                  🗑️
                </button>
              </td>
            </tr>
          `}).join("")}
      </tbody>
    </table>
  `}}function rt(){ae()}function ae(t=null,n=""){const e=document.getElementById("envVarModal"),o=document.getElementById("modalVarKey"),s=document.getElementById("modalVarValue"),a=document.getElementById("modalTitle");t?(a.textContent="Update environment variable",o.value=t,o.readOnly=!0,s.value=n):(a.textContent="Add environment variable",o.value="",o.readOnly=!1,s.value=""),e.style.display="flex"}function ke(){const t=document.getElementById("envVarModal");t.style.display="none"}async function lt(){const t=document.getElementById("modalVarKey"),n=document.getElementById("modalVarValue"),e=t.value.trim(),o=n.value.trim();if(!e){m("Variable name is required","error");return}H[e]=o,await ie(),ke()}function Ee(t){const n=H[t]||"";ae(t,n)}async function ct(t){Ee(t)}async function dt(t){confirm(`Are you sure you want to delete ${t}?`)&&(delete H[t],await ie(),m("Environment variable deleted","success"))}function pt(t){const e=document.querySelectorAll(".env-var-row")[t];if(!e)return;const o=e.querySelector(".env-var-value input");o.type==="password"?o.type="text":o.type="password"}async function ie(){try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!r||!r.id){m("No project selected","error");return}(await fetch("/api/env-vars",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({variables:H,project_id:r.id})})).ok?(await se(),m("Environment variables saved successfully","success")):(console.error("Failed to save environment variables"),m("Failed to save environment variables","error"))}catch(t){console.error("Error saving environment variables:",t),m("Error saving environment variables","error")}}function mt(){const t=document.getElementById("modalVarValue"),n=document.querySelector('#envVarModal button[onclick*="toggleModalValueVisibility"]');t&&n&&(t.type==="password"?(t.type="text",n.textContent="🙈 Hide"):(t.type="password",n.textContent="👁️ Show"))}function b(t){const n=document.createElement("div");return n.textContent=t,n.innerHTML}async function Ie(){try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t)return;const n=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${t}`}});if(n.ok){const e=await n.json(),o=document.getElementById("userName"),s=document.getElementById("userEmail"),a=document.getElementById("userAvatar");localStorage.setItem("displayName",e.display_name||""),localStorage.setItem("userEmail",e.email||""),o&&(o.textContent=e.display_name||e.username||"User"),ht(e.display_name||e.username||"User"),s&&(s.textContent=e.email||"Logged in"),a&&(e.avatar_url?(a.style.backgroundImage=`url(${e.avatar_url})`,a.style.backgroundSize="cover",a.style.backgroundPosition="center",a.textContent=""):(a.style.backgroundImage="",a.textContent=(e.display_name||e.username||"U").charAt(0).toUpperCase()))}else n.status===401&&(localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),W())}catch(t){console.error("Error loading user profile:",t)}}async function Be(){try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken"),n=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${t}`}});if(n.ok){const e=await n.json(),o=document.getElementById("username"),s=document.getElementById("email"),a=document.getElementById("displayName");o&&(o.value=e.username||""),s&&(s.value=e.email||""),a&&(a.value=e.display_name||"");const i=document.getElementById("avatarPreview"),c=document.getElementById("avatarInitial"),d=document.getElementById("removeAvatarBtn");if(e.avatar_url&&i)i.src=e.avatar_url,i.style.display="block",c&&(c.style.display="none"),d&&(d.style.display="block");else if(c){const l=e.display_name&&e.display_name.charAt(0).toUpperCase()||e.username&&e.username.charAt(0).toUpperCase()||"S";c.textContent=l,c.style.display="block"}}}catch(t){console.error("Error loading profile:",t)}ut()}function ut(){const t=document.getElementById("profileForm"),n=document.getElementById("avatarFile"),e=document.getElementById("removeAvatarBtn");t&&t.addEventListener("submit",ft),n&&n.addEventListener("change",gt),e&&e.addEventListener("click",vt);const o=document.getElementById("changePasswordBtn"),s=document.getElementById("closePasswordModal"),a=document.getElementById("cancelPasswordBtn"),i=document.getElementById("updatePasswordBtn"),c=document.getElementById("passwordModal"),d=document.getElementById("modalNewPassword"),l=document.getElementById("strengthFill");o&&o.addEventListener("click",()=>{c&&(c.style.display="flex")}),s&&s.addEventListener("click",()=>{c&&(c.style.display="none")}),a&&a.addEventListener("click",()=>{c&&(c.style.display="none")}),c&&c.addEventListener("click",u=>{u.target===c&&(c.style.display="none")}),d&&d.addEventListener("input",u=>{const y=u.target.value;let g=0;y.length>=8&&(g+=25),/[a-z]/.test(y)&&/[A-Z]/.test(y)&&(g+=25),/\d/.test(y)&&(g+=25),/[!@#$%^&*(),.?":{}|<>]/.test(y)&&(g+=25),l&&(l.style.width=`${g}%`,g<50?l.style.background="#ef4444":g<75?l.style.background="#f59e0b":l.style.background="#10b981")}),i&&i.addEventListener("click",yt);const p=document.getElementById("cancelProfileBtn");p&&p.addEventListener("click",async()=>{await Be()})}async function yt(){const t=document.getElementById("modalCurrentPassword"),n=document.getElementById("modalNewPassword"),e=document.getElementById("modalConfirmPassword"),o=document.getElementById("passwordModal");if(!t||!n||!e)return;const s=t.value,a=n.value,i=e.value;if(!s||!a||!i){m("Please fill in all password fields","error");return}if(a!==i){m("New passwords do not match","error");return}if(a.length<8){m("Password must be at least 8 characters","error");return}try{const c=localStorage.getItem("access_token")||localStorage.getItem("authToken"),d=new FormData;d.append("current_password",s),d.append("new_password",a);const l=await fetch("/api/user/profile",{method:"PUT",headers:{Authorization:`Bearer ${c}`},body:d}),p=await l.json();if(l.ok){m("Password updated successfully!","success"),o&&(o.style.display="none"),t.value="",n.value="",e.value="";const u=document.getElementById("strengthFill");u&&(u.style.width="0%")}else m(p.detail||p.message||"Failed to update password","error")}catch(c){console.error("Error updating password:",c),m("Network error. Please try again.","error")}}function gt(t){const n=t.target.files[0];if(n){const e=new FileReader;e.onload=o=>{const s=document.getElementById("avatarPreview"),a=document.getElementById("avatarInitial");s&&(s.src=o.target.result,s.style.display="block"),a&&(a.style.display="none");const i=document.getElementById("removeAvatarBtn");i&&(i.style.display="block")},e.readAsDataURL(n)}}function vt(){const t=document.getElementById("avatarPreview"),n=document.getElementById("avatarInitial");t&&(t.src="",t.style.display="none"),n&&(n.style.display="block");const e=document.getElementById("removeAvatarBtn");e&&(e.style.display="none");const o=document.getElementById("avatarFile");o&&(o.value="")}async function ft(t){t.preventDefault();const n=document.getElementById("profileMessage");n&&(n.style.display="none");const e=new FormData,o=document.getElementById("email"),s=document.getElementById("displayName");o&&e.append("email",o.value),s&&e.append("display_name",s.value);const a=document.getElementById("avatarFile");a&&a.files[0]&&e.append("avatar",a.files[0]);const i=document.getElementById("avatarPreview");i&&i.style.display==="none"&&e.append("remove_avatar","true");try{const c=localStorage.getItem("access_token")||localStorage.getItem("authToken"),d=await fetch("/api/user/profile",{method:"PUT",headers:{Authorization:`Bearer ${c}`},body:e}),l=await d.json();if(d.ok)n&&(n.textContent="Profile updated successfully!",n.className="profile-message success",n.style.display="block"),l.username&&localStorage.setItem("username",l.username),await Ie(),m("Profile updated successfully!","success");else{const p=l.detail||l.message||"Failed to update profile";n&&(n.textContent=p,n.className="profile-message error",n.style.display="block"),m(p,"error"),console.error("Profile update failed:",l)}}catch(c){console.error("Error updating profile:",c),n&&(n.textContent="Network error. Please try again.",n.className="profile-message error",n.style.display="block"),m("Network error. Please try again.","error")}}window.destroyDeployment=Xe;window.selectRepository=ot;window.importRepository=st;window.editEnvVar=ct;window.deleteEnvVar=dt;window.toggleEnvVarVisibility=pt;window.saveEnvVarFromModal=lt;window.closeEnvVarModal=ke;window.toggleModalValueVisibility=mt;window.editEnvVarModal=Ee;window.showEnvVarModal=ae;window.selectProject=te;window.showProjectSidebar=J;window.hideProjectSidebar=Oe;window.openProject=Ze;window.loadUserProfileIntoProjectSidebar=ve;window.openProjectSite=Ve;window.deleteProject=xe;window.toggleRepositorySelection=et;window.confirmSplitImport=nt;window.openProjectNameModal=ge;window.openSite=Ge;function ht(t){const n=document.getElementById("teamName");n&&(n.textContent=`${t}'s team`),document.querySelectorAll(".project-owner").forEach(o=>{o.textContent=`${t}'s team`})}let P=null,z=!1,T=[];function wt(t){if(t==null)return null;if(typeof t!="string")return t;const n=t.trim();if(!n)return null;const e=n.indexOf("{");if(e===-1)return{message:n};const o=n.slice(e);try{return JSON.parse(o)}catch{return{message:n}}}function bt(){const t=document.getElementById("logsContent");t&&(t.innerHTML='<p class="logs-connecting">Connecting to WebSocket...</p>',Se(),kt())}function Se(){P&&P.close();const n=`${window.location.protocol==="https:"?"wss:":"ws:"}//${window.location.host}/ws/logs`;P=new WebSocket(n),P.onopen=()=>{console.log("Logs WebSocket connected"),D("Connected to logs stream","success"),T.length>0&&(T.forEach(e=>D(e.message,e.type)),T=[])},P.onmessage=e=>{const o=wt(e.data);!o||!o.message||(z?T.push({message:o.message,type:o.type||"info"}):D(o.message,o.type||"info"))},P.onerror=e=>{console.error("Logs WebSocket error:",e),D("WebSocket connection error","error")},P.onclose=()=>{console.log("Logs WebSocket disconnected"),D("Disconnected from logs stream","warning"),setTimeout(()=>{var e;((e=document.getElementById("page-logs"))==null?void 0:e.style.display)!=="none"&&Se()},3e3)}}function D(t,n="info"){const e=document.getElementById("logsContent");if(!e)return;const o=new Date().toLocaleString("en-US",{timeZone:"Asia/Kathmandu",timeStyle:"medium",dateStyle:"short"}),s=document.createElement("div");s.className=`log-entry ${n}`,s.innerHTML=`
    <span class="log-timestamp">[${o}]</span>
    <span class="log-message">${b(t)}</span>
  `,e.appendChild(s),e.scrollTop=e.scrollHeight;const a=1e3,i=e.querySelectorAll(".log-entry");i.length>a&&i[0].remove()}function kt(){const t=document.getElementById("clearLogsBtn"),n=document.getElementById("toggleLogsBtn");t&&t.addEventListener("click",()=>{const e=document.getElementById("logsContent");e&&(e.innerHTML="",T=[],D("Logs cleared","info"))}),n&&n.addEventListener("click",()=>{z=!z,n.textContent=z?"Resume":"Pause",!z&&T.length>0&&(T.forEach(e=>D(e.message,e.type)),T=[]),D(z?"Logs paused":"Logs resumed","info")})}window.addEventListener("beforeunload",()=>{P&&P.close()});function Et(){const t=document.getElementById("sidebarSearch"),n=document.getElementById("commandPalette"),e=document.getElementById("commandSearchInput"),o=document.querySelectorAll(".command-item");let s=-1;function a(){n&&(n.style.display="flex",e&&(e.focus(),e.value=""),s=-1,c())}function i(){n&&(n.style.display="none",s=-1)}function c(){const l=Array.from(o).filter(p=>p.style.display!=="none");o.forEach((p,u)=>{l.indexOf(p)===s?(p.classList.add("selected"),p.scrollIntoView({block:"nearest",behavior:"smooth"})):p.classList.remove("selected")})}function d(l){switch(i(),l){case"deploy":case"nav-deploy":window.router&&window.router.navigate("/deploy");break;case"add-env-var":window.showEnvVarModal&&window.showEnvVarModal();break;case"search-repos":case"nav-repositories":window.router&&window.router.navigate("/repositories");break;case"nav-projects":window.router&&window.router.navigate("/");break;case"nav-applications":window.router&&window.router.navigate("/applications");break;case"nav-history":window.router&&window.router.navigate("/history");break;case"nav-env-vars":window.router&&window.router.navigate("/env-vars");break;case"nav-settings":window.router&&window.router.navigate("/settings");break}}document.addEventListener("keydown",l=>{var p;if((l.metaKey||l.ctrlKey)&&l.key==="k"&&(l.preventDefault(),n&&n.style.display==="none"?a():i()),l.key==="Escape"&&n&&n.style.display!=="none"&&i(),n&&n.style.display!=="none"){const u=Array.from(o).filter(y=>y.style.display!=="none");if(l.key==="ArrowDown")l.preventDefault(),s=Math.min(s+1,u.length-1),c();else if(l.key==="ArrowUp")l.preventDefault(),s=Math.max(s-1,-1),c();else if(l.key==="Enter"&&s>=0){l.preventDefault();const g=(p=Array.from(o).filter(v=>v.style.display!=="none")[s])==null?void 0:p.getAttribute("data-action");g&&d(g)}}}),t&&t.addEventListener("click",a),n&&n.addEventListener("click",l=>{l.target===n&&i()}),o.forEach(l=>{l.addEventListener("click",()=>{const p=l.getAttribute("data-action");p&&d(p)})}),e&&e.addEventListener("input",l=>{const p=l.target.value.toLowerCase();o.forEach(u=>{u.querySelector(".command-text").textContent.toLowerCase().includes(p)?u.style.display="flex":u.style.display="none"}),s=-1,c()})}
