import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */class je{constructor(){this.routes={"/":"projects","/deploy":"deploy","/history":"history","/repositories":"repositories","/domain":"domain","/env-vars":"env-vars","/settings":"settings","/logs":"logs"},this.currentPage=null,this.init()}init(){document.querySelectorAll(".nav-item").forEach(n=>{n.addEventListener("click",e=>{e.preventDefault();const o=n.getAttribute("href");this.navigate(o)})}),window.addEventListener("popstate",()=>{this.loadPage(window.location.pathname)}),this.loadPage(window.location.pathname)}navigate(n){window.history.pushState({},"",n),this.loadPage(n)}loadPage(n){const e=this.routes[n]||"dashboard";if(e==="deploy"){r=null;const o=document.getElementById("projectSidebar");o&&(o.style.display="none");const s=document.getElementById("sidebar");s&&(s.style.display="block")}this.showPage(e),this.updateActiveNav(n),this.updatePageTitle(e),window.scrollTo({top:0,behavior:"smooth"})}showPage(n){document.querySelectorAll(".page").forEach(o=>{o.style.display="none"});const e=document.getElementById(`page-${n}`);if(e){if(e.style.display="block",n==="deploy"){const o=document.getElementById("deploy-status"),s=document.getElementById("deploy-success");o&&(o.textContent="",o.style.color=""),s&&(s.style.display="none")}}else{const o=document.getElementById("page-dashboard");o&&(o.style.display="block")}this.currentPage=n,this.loadPageData(n)}updateActiveNav(n){document.querySelectorAll(".nav-item").forEach(e=>{e.classList.remove("active"),e.getAttribute("href")===n&&e.classList.add("active")})}updatePageTitle(n){const e={projects:"Projects",deploy:"Deploy",history:"History",repositories:"Repositories",domain:"Domain","env-vars":"Environmental Variables",settings:"Settings",logs:"Logs"};document.getElementById("pageTitle").textContent=e[n]||"Dashboard"}loadPageData(n){switch(n){case"projects":N();break;case"history":oe();break;case"repositories":st();break;case"domain":Me();break;case"env-vars":se();break;case"settings":Ie();break;case"logs":wt();break}}}const A=new je;window.router=A;async function Ce(t){const n=await Pe();if(!n)return;const e=I.find(a=>a.id==t),o=e?e.name:"this project";if(await xe(o))try{console.log("Deleting project with token:",n.substring(0,20)+"...");const a=await fetch(`/projects/${t}`,{method:"DELETE",headers:{Authorization:`Bearer ${n}`}});if(console.log("Delete response status:",a.status),!a.ok){const i=await a.json().catch(()=>({}));if(console.error("Delete error response:",i),a.status===401){p("Session expired. Please login again.","error"),localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),setTimeout(()=>{window.location.href="/login"},2e3);return}throw new Error(i.detail||"Failed to delete project")}I=I.filter(i=>i.id!=t),_=_.filter(i=>i.id!=t),V(_),p("Project deleted","success")}catch(a){console.error("Delete project error:",a),p(`Delete failed: ${a.message}`,"error")}}function xe(t){return new Promise(n=>{const e=document.createElement("div");e.className="modal-overlay";const o=document.createElement("div");o.className="delete-confirmation-modal",o.innerHTML=`
      <h3>Delete Project</h3>
      <p>
        Are you sure you want to delete <strong>${b(t)}</strong>?<br>
        This will stop and remove its container and image.
      </p>
      <div class="delete-confirmation-actions">
        <button class="cancel-btn">Cancel</button>
        <button class="delete-btn">Delete</button>
      </div>
    `,e.appendChild(o),document.body.appendChild(e);const s=o.querySelector(".cancel-btn"),a=o.querySelector(".delete-btn"),i=()=>{document.body.removeChild(e)};s.onclick=()=>{i(),n(!1)},a.onclick=()=>{i(),n(!0)},e.onclick=l=>{l.target===e&&(i(),n(!1))},a.focus()})}function Le(t){try{const e=JSON.parse(atob(t.split(".")[1])).exp*1e3,o=Date.now();return e<o+5*60*1e3}catch{return!0}}async function Pe(){const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");return!t||Le(t)?(p("Session expired. Please login again.","error"),localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),setTimeout(()=>{window.location.href="/login"},2e3),null):t}let O=localStorage.getItem("access_token")||localStorage.getItem("authToken"),ee=localStorage.getItem("username");document.addEventListener("DOMContentLoaded",()=>{W(),window.location.pathname==="/login"||window.location.pathname.includes("login.html")||setTimeout(()=>{if(O&&ee){$e(),kt();const n=document.getElementById("page-projects");n&&window.location.pathname==="/"&&(n.style.display="block")}},100)});function W(){const t=document.getElementById("userSection"),n=document.getElementById("authButtons"),e=document.getElementById("logoutBtn"),o=document.getElementById("newDeployBtn");document.getElementById("userName"),document.getElementById("userEmail"),document.getElementById("userAvatar");const s=window.location.pathname==="/login"||window.location.pathname.includes("login.html");O&&ee?(t.style.display="flex",n.style.display="none",e.style.display="block",o.style.display="block",Ee(),N(),s&&(window.location.href="/")):(t.style.display="none",n.style.display="block",e.style.display="none",o.style.display="none",s||(window.location.href="/login"))}function $e(){var a,i;document.getElementById("logoutBtn").addEventListener("click",()=>{localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),O=null,ee=null,W(),p("Logged out successfully","success"),A.navigate("/")});const t=document.getElementById("projectsSearch");t&&t.addEventListener("input",l=>{const d=l.target.value.toLowerCase();_=I.filter(c=>c.name.toLowerCase().includes(d)||c.repository&&c.repository.toLowerCase().includes(d)),V(_)});const n=document.getElementById("addProjectBtn");n&&n.addEventListener("click",()=>{window.router&&window.router.navigate("/deploy")});const e=document.getElementById("browseUploadLink");e&&e.addEventListener("click",l=>{l.preventDefault(),window.router&&window.router.navigate("/deploy")}),document.getElementById("newDeployBtn").addEventListener("click",()=>{r=null;const l=document.getElementById("projectSidebar");l&&(l.style.display="none");const d=document.getElementById("sidebar");d&&(d.style.display="block"),A.navigate("/deploy")});const o=document.getElementById("deployForm");o&&o.addEventListener("submit",Ye);const s=document.getElementById("deploy-type");s&&s.addEventListener("change",l=>{const d=document.getElementById("single-repo-group"),c=document.getElementById("split-repo-group"),u=document.getElementById("git-url");l.target.value==="split"?(d.style.display="none",c.style.display="block",u&&u.removeAttribute("required")):(d.style.display="block",c.style.display="none",u&&u.setAttribute("required","required"))}),(a=document.getElementById("clearHistoryBtn"))==null||a.addEventListener("click",Ze),(i=document.getElementById("searchReposBtn"))==null||i.addEventListener("click",he),_e()}function _e(){const t=document.querySelector(".search-input"),n=document.getElementById("spotlightModal"),e=document.getElementById("spotlightSearch"),o=document.getElementById("spotlightResults");!t||!n||!e||!o||(t.addEventListener("click",Ne),n.addEventListener("click",s=>{s.target===n&&J()}),e.addEventListener("input",De),o.addEventListener("click",Ue),document.addEventListener("keydown",s=>{s.key==="Escape"&&n.style.display!=="none"&&J()}))}function Ne(){const t=document.getElementById("spotlightModal"),n=document.getElementById("spotlightSearch");t.style.display="flex",setTimeout(()=>{n.focus()},100)}function J(){const t=document.getElementById("spotlightModal"),n=document.getElementById("spotlightSearch"),e=document.getElementById("spotlightResults");t.style.display="none",n.value="",e.innerHTML=`
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
  `}function De(t){const n=t.target.value.toLowerCase().trim(),e=document.getElementById("spotlightResults");if(!n){e.innerHTML=`
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
    `;return}const o=Te(n);Ae(o)}function Te(t){const n={projects:[],actions:[],navigation:[]};I&&I.length>0&&(n.projects=I.filter(s=>s.name.toLowerCase().includes(t)||s.repository&&s.repository.toLowerCase().includes(t)));const e=[{name:"New Deploy",action:"new-deploy",icon:"🚀"},{name:"Repositories",action:"repositories",icon:"📁"},{name:"History",action:"history",icon:"📜"},{name:"Settings",action:"settings",icon:"⚙️"},{name:"Domain",action:"domain",icon:"🌐"}];n.actions=e.filter(s=>s.name.toLowerCase().includes(t));const o=[{name:"Projects",action:"projects",icon:"📊"},{name:"Repositories",action:"repositories",icon:"📁"},{name:"History",action:"history",icon:"📜"},{name:"Domain",action:"domain",icon:"🌐"},{name:"Settings",action:"settings",icon:"⚙️"}];return n.navigation=o.filter(s=>s.name.toLowerCase().includes(t)),n}function Ae(t){const n=document.getElementById("spotlightResults");let e='<div class="search-results">';t.projects.length>0&&(e+='<div class="search-category">',e+='<div class="search-category-title">Projects</div>',t.projects.forEach(o=>{const s=o.status==="running"?"🚀":"📦",a=o.status==="running"?"RUNNING":o.status==="failed"?"FAILED":"IMPORTED";e+=`
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
    `),e+="</div>",n.innerHTML=e}function Ue(t){const n=t.target.closest(".suggestion-item, .search-result-item");if(!n)return;const e=n.dataset.action,o=n.dataset.type,s=n.dataset.id;if(J(),o==="project"&&s)te(parseInt(s));else if(e)switch(e){case"new-deploy":window.router&&window.router.navigate("/deploy");break;case"repositories":window.router&&window.router.navigate("/repositories");break;case"history":window.router&&window.router.navigate("/history");break;case"domain":window.router&&window.router.navigate("/domain");break;case"settings":window.router&&window.router.navigate("/settings");break;case"projects":window.router&&window.router.navigate("/projects");break}}function Me(){document.getElementById("page-domain")}function C(){const t={},n=localStorage.getItem("access_token")||localStorage.getItem("authToken");return n&&(t.Authorization=`Bearer ${n}`),t}let I=[],_=[];async function N(){const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t){V([]);return}Ve();try{const n=await fetch("/deployments",{headers:{Authorization:`Bearer ${t}`}});n.ok?(I=(await n.json()).map(o=>{var q;const s=o.git_url||"",a=s,i=s?(q=String(s).split("/").pop())==null?void 0:q.replace(/\.git$/,""):null,l=o.app_name||i||o.container_name||"Untitled Project",d=(o.status||"").toLowerCase();let c;d==="running"?c="running":d==="failed"||d==="error"?c="failed":c="imported";let u=!1,y="single",m=null,g=null;const f=String(o.git_url||""),E=f.startsWith("split::"),L=!o.parent_project_id&&!o.component_type;if(E){u=!0,y="split";try{const h=f.replace("split::","").split("|");h.length===2&&(m=h[0],g=h[1])}catch{}}else if(d==="imported_split")u=!0,y="split";else if(L&&f.includes("|")){u=!0,y="split";try{const h=f.split("|");h.length===2&&(m=h[0],g=h[1])}catch{}}return{id:o.id,name:l,status:c,url:o.deployed_url||o.app_url,createdAt:o.created_at,updatedAt:o.updated_at,repository:a,repository_url:a,git_url:s,project_type:y,isSplit:u,frontend_url:m,backend_url:g,containerUptime:o.container_uptime||"Unknown",containerPorts:o.container_ports||"No ports",containerImage:o.container_image||"Unknown",containerStatus:o.container_status||"Unknown",isRunning:o.is_running||!1}}),_=[...I],V(_)):V([])}catch(n){console.error("Error loading projects:",n),V([])}}function V(t){const n=document.getElementById("projectsGrid");if(n){if(t.length===0){n.innerHTML=`
      <div class="empty-state">
        <p>No projects found</p>
        <button class="btn-primary" onclick="if(window.router){window.router.navigate('/deploy');}else{window.location.href='/deploy';}">Create First Project</button>
      </div>
    `;return}n.innerHTML=t.map(e=>{const o=e.status==="running"?"status-success":e.status==="failed"?"status-error":"status-info",s=e.status==="running"?"Running":e.status==="failed"?"Failed":"Imported",a=e.status==="running"?"🚀":"📦",i=e.updatedAt?U(e.updatedAt):"Recently";return`
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
      `}).join("")}}async function Fe(t){try{const n=I.find(e=>e.id===t);if(!n){p("Project not found","error");return}if(!n.url||n.url==="#"){p("Project URL not available. Make sure the project is deployed.","error");return}window.open(n.url,"_blank"),p(`Opening ${n.name}...`,"info")}catch(n){console.error("Error opening project site:",n),p("Failed to open project site: "+n.message,"error")}}function Ve(){const t=document.getElementById("projectsGrid");t&&(t.innerHTML=`
    <div class="loading-skeleton">
      ${Array(3).fill(`
        <div class="skeleton-card">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line short"></div>
        </div>
      `).join("")}
    </div>
  `)}let r=null;function te(t){N().then(()=>{const e=I.find(o=>o.id==t);if(!e){const o=_.find(s=>s.id==t);o&&(r=o,Z(o));return}r=e,Z(e)});const n=document.getElementById("page-project-config");n&&n.style.display!=="none"&&ne()}function Z(t){const n=document.getElementById("sidebar");n&&(n.style.display="none");let e=document.getElementById("projectSidebar");e||(e=Re(),document.body.appendChild(e));const o=e.querySelector("#projectSidebarName");o&&(o.textContent=t.name);const s=e.querySelector("#projectSidebarId");s&&(s.textContent=t.id);const a=e.querySelector('a[data-project-page="status"]');a&&(t.project_type==="split"?a.style.display="flex":a.style.display="none"),e.style.display="block",document.getElementById("pageTitle").textContent=t.name,ge(),me("deploy")}function Re(){const t=document.createElement("aside");return t.id="projectSidebar",t.className="sidebar project-sidebar",t.innerHTML=`
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
  `,t.querySelectorAll(".project-nav-item").forEach(n=>{n.addEventListener("click",async e=>{e.preventDefault();const o=n.getAttribute("data-project-page");if(await N(),r){const s=I.find(a=>a.id===r.id);s&&(r=s)}me(o),t.querySelectorAll(".project-nav-item").forEach(s=>s.classList.remove("active")),n.classList.add("active")})}),t}function He(){const t=document.getElementById("projectSidebar");t&&(t.style.display="none");const n=document.getElementById("sidebar");n&&(n.style.display="block"),r=null,document.getElementById("pageTitle").textContent="Projects",document.querySelectorAll(".page").forEach(o=>{o.style.display="none"});const e=document.getElementById("page-projects");e&&(e.style.display="block"),N()}function me(t){var n;switch(document.querySelectorAll(".page").forEach(e=>{e.style.display="none"}),t){case"deploy":const e=document.getElementById("page-deploy");if(e){e.style.display="block";const s=document.getElementById("deploy-status"),a=document.getElementById("deploy-success");s&&(s.textContent="",s.style.color=""),a&&(a.style.display="none");const i=(n=e.querySelector(".card h2"))==null?void 0:n.closest(".card");if(r){i&&(i.style.display="block");const h=document.getElementById("project-components-section");r!=null&&r.project_type||r!=null&&r.isSplit,h&&(h.style.display="none")}else{i&&(i.style.display="block");const h=document.getElementById("project-components-section");h&&(h.style.display="none")}document.getElementById("deploy-type");const l=document.getElementById("deploy-type-group"),d=document.getElementById("single-repo-group"),c=document.getElementById("split-repo-group"),u=document.getElementById("split-deploy-layout"),y=document.getElementById("git-url"),m=document.getElementById("frontend-url"),g=document.getElementById("backend-url"),f=document.getElementById("deploy-submit-default");e.querySelectorAll(".dynamic-split-btn").forEach(h=>h.remove());let E=r==null?void 0:r.project_type;const L=(r==null?void 0:r.git_url)||(r==null?void 0:r.repository_url)||"",q=L.startsWith("split::");if(E||(r!=null&&r.isSplit||q?E="split":E="single"),q&&E!=="split"?(console.warn("Project type mismatch detected. git_url indicates split but project_type is",E),E="split"):!q&&E==="split"&&L&&(console.warn("Project type mismatch detected. git_url indicates single but project_type is split"),E="single"),r)if(l&&(l.style.display="none"),E==="split"){d&&(d.style.display="none"),c&&(c.style.display="none"),u&&(u.style.display="block"),m&&(m.value=r.frontend_url||""),g&&(g.value=r.backend_url||""),y&&y.removeAttribute("required"),f&&(f.style.display="none");const h=document.getElementById("deploy-frontend-btn"),re=document.getElementById("deploy-backend-btn"),le=document.getElementById("deploy-both-btn");h&&(h.onclick=async()=>{var j;const S=(j=m==null?void 0:m.value)==null?void 0:j.trim();if(!S||!S.startsWith("http"))return p("Enter a valid frontend URL","error");const k=K(!1);document.getElementById("step-frontend").style.display="flex",k.updateFrontendStatus("deploying","Deploying your frontend now...");const w=await pe(S,"frontend",k,!0);w&&w.success&&w.deployed_url?(k.showUrls(w.deployed_url,null),document.getElementById("close-deployment-dialog").onclick=()=>{k.close(),G(),R()}):w&&!w.success&&setTimeout(()=>k.close(),3e3)}),re&&(re.onclick=async()=>{var j;const S=(j=g==null?void 0:g.value)==null?void 0:j.trim();if(!S||!S.startsWith("http"))return p("Enter a valid backend URL","error");const k=K(!1);document.getElementById("step-backend").style.display="flex",k.updateBackendStatus("deploying","Deploying your backend now...");const w=await pe(S,"backend",k,!0);w&&w.success&&w.deployed_url?(k.showUrls(null,w.deployed_url),document.getElementById("close-deployment-dialog").onclick=()=>{k.close(),G(),R()}):w&&!w.success&&setTimeout(()=>k.close(),3e3)}),le&&(le.onclick=async()=>{var ce,de;const S=(ce=m==null?void 0:m.value)==null?void 0:ce.trim(),k=(de=g==null?void 0:g.value)==null?void 0:de.trim();if(!S||!S.startsWith("http")||!k||!k.startsWith("http")){p("Please enter valid Frontend and Backend repository URLs","error");return}let w=!1,j={};if(r&&r.id)try{const v=await fetch(`/api/env-vars?project_id=${r.id}`,{headers:C()});if(v.ok){const D=(await v.json()).variables||{};w=Object.keys(D).length>0,console.log("Existing env vars check:",{hasExistingEnvVars:w,count:Object.keys(D).length})}}catch(v){console.warn("Failed to check existing env vars:",v)}if(w){await M();return}try{const v=await fetch(`/api/env-vars/detect?frontend_url=${encodeURIComponent(S)}&backend_url=${encodeURIComponent(k)}`,{headers:C()});v.ok?(j=(await v.json()).suggestions||{},console.log("Env var detection result:",{count:Object.keys(j).length,vars:j})):console.warn("Env var detection API returned:",v.status)}catch(v){console.warn("Env var detection failed:",v)}Ge(j,async()=>{if(Object.keys(j).length===0){r&&r.id?A.navigate("/env-vars"):(p("No env vars detected. Add them manually after deployment","info"),await M());return}if(p("Importing environment variables...","info"),r&&r.id){const v={};Object.keys(j).forEach(F=>{v[F]=""});const x=localStorage.getItem("access_token")||localStorage.getItem("authToken"),D=await fetch(`/api/env-vars?project_id=${r.id}`,{headers:{Authorization:`Bearer ${x}`}});if(D.ok){const Se={...(await D.json()).variables||{},...v};(await fetch("/api/env-vars",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${x}`},body:JSON.stringify({variables:Se,project_id:r.id})})).ok?(p("Environment variables imported successfully!","success"),setTimeout(()=>M(),500)):(p("Failed to import environment variables","error"),await M())}else p("Failed to load existing environment variables","error"),await M()}else p("Save detected env vars after deployment","info"),await M()},()=>{r&&r.id?A.navigate("/env-vars"):p("Please add environment variables after deployment","info")},async()=>{await M()});async function M(){const v=K(!0);document.getElementById("step-backend").style.display="flex",document.getElementById("step-frontend").style.display="flex",v.updateBackendStatus("deploying","Deploying your backend now...");try{const x=new FormData;x.append("deploy_type","split"),x.append("frontend_url",S),x.append("backend_url",k),r&&r.id&&x.append("project_id",String(r.id));const D=await fetch("/deploy",{method:"POST",headers:C(),body:x}),F=await D.json();D.ok&&F.deployed_url?(v.updateBackendStatus("success","Backend deployed! ✅"),v.updateFrontendStatus("success","Frontend deployed! ✅"),v.showUrls(F.deployed_url,null),document.getElementById("close-deployment-dialog").onclick=()=>{v.close(),N(),G(),R()},p("Split deployment successful!","success")):(v.updateBackendStatus("failed",F.detail||"Deployment failed"),v.updateFrontendStatus("failed","Could not deploy"),p(F.detail||"Deployment failed","error"),setTimeout(()=>v.close(),3e3))}catch{v.updateBackendStatus("failed","Network error"),v.updateFrontendStatus("failed","Network error"),p("Network error during deployment","error"),setTimeout(()=>v.close(),3e3)}}}),f&&(f.style.display="none")}else E==="single"&&(d&&(d.style.display="block"),c&&(c.style.display="none"),u&&(u.style.display="none"),y&&r&&r.repository_url&&(y.value=r.repository_url),f&&(f.textContent="🚀 Deploy",f.style.display=""));else l&&(l.style.display=""),c&&(c.style.display="none"),u&&(u.style.display="none"),d&&(d.style.display="block"),y&&(y.value=""),f&&(f.textContent="🚀 Deploy",f.style.display="")}document.getElementById("pageTitle").textContent="Deploy";break;case"status":qe();break;case"configuration":Oe();break;case"domain-config":We();break;case"env-vars":const o=document.getElementById("page-env-vars");o&&(o.style.display="block",se());break}}async function Oe(){let t=document.getElementById("page-project-config");t||(t=document.createElement("div"),t.id="page-project-config",t.className="page",t.innerHTML=`
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
              <span class="config-value-text" id="projectConfigCreated">${r!=null&&r.createdAt?ve(r.createdAt):"Unknown"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Last update:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigUpdated">${r!=null&&r.updatedAt?U(new Date(r.updatedAt)):"Unknown"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Container Ports:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigPorts">${r!=null&&r.containerPorts?fe(r.containerPorts):"No ports"}</span>
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
    `,document.getElementById("pageContent").appendChild(t));const n=document.getElementById("project-components-section");n&&(n.style.display="none"),ne();const e=document.getElementById("changeProjectNameBtn");e&&(e.onclick=()=>ye()),t.style.display="block"}async function qe(){document.querySelectorAll(".page").forEach(n=>n.style.display="none");let t=document.getElementById("page-status");if(t||(t=document.createElement("div"),t.id="page-status",t.className="page",document.getElementById("pageContent").appendChild(t)),t.innerHTML="",r&&r.id)try{const n=await fetch(`/projects/${r.id}/components`,{headers:C()});if(n.ok){const o=(await n.json()).components||[],s=o.find(u=>u.component_type==="frontend"),a=o.find(u=>u.component_type==="backend"),i=s?s.status==="running"?"RUNNING":s.status.toUpperCase():"NOT DEPLOYED",l=a?a.status==="running"?"RUNNING":a.status.toUpperCase():"NOT DEPLOYED",d=(s==null?void 0:s.status)==="running"?"status-success":(s==null?void 0:s.status)==="failed"?"status-error":"status-info",c=(a==null?void 0:a.status)==="running"?"status-success":(a==null?void 0:a.status)==="failed"?"status-error":"status-info";t.innerHTML=`
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
                      <span>Updated ${s.updated_at?U(new Date(s.updated_at)):"Recently"}</span>
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
                      <span>Updated ${a.updated_at?U(new Date(a.updated_at)):"Recently"}</span>
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
      `}t.style.display="block",document.getElementById("pageTitle").textContent="Status"}async function G(){if(!(!r||!r.id))try{const t=await fetch(`/projects/${r.id}/components`,{headers:C()});if(!t.ok)return;const e=(await t.json()).components||[],o=e.find(m=>m.component_type==="frontend"),s=e.find(m=>m.component_type==="backend"),a=o&&o.status&&o.status!=="imported"&&o.status!=="imported_split",i=s&&s.status&&s.status!=="imported"&&s.status!=="imported_split",l=a&&i;let d=document.getElementById("project-components-section");const c=document.getElementById("page-deploy"),u=document.getElementById("page-project-config"),y=u==null?void 0:u.querySelector("#project-components-section");if(y&&y.remove(),l&&c&&c.style.display!=="none"){if(!d){d=document.createElement("div"),d.id="project-components-section",d.className="card project-components-card";const L=c.querySelector(".card");L?c.insertBefore(d,L):c.appendChild(d)}d.style.display="block";const m=o?o.status==="running"?"RUNNING":o.status.toUpperCase():"NOT DEPLOYED",g=s?s.status==="running"?"RUNNING":s.status.toUpperCase():"NOT DEPLOYED",f=(o==null?void 0:o.status)==="running"?"status-success":(o==null?void 0:o.status)==="failed"?"status-error":"status-info",E=(s==null?void 0:s.status)==="running"?"status-success":(s==null?void 0:s.status)==="failed"?"status-error":"status-info";d.innerHTML=`
      <h2 style="margin-bottom: 1.5rem;">Project Components</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
        <!-- Frontend Card -->
        <div class="project-card" style="margin: 0;">
          <div class="project-header">
            <div class="project-icon">🌐</div>
            <div class="project-status ${f}">${m}</div>
          </div>
          <div class="project-info">
            <h3 class="project-name">Frontend</h3>
            <div class="project-meta">
              ${o?`
                <svg class="icon-clock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                <span>Updated ${o.updated_at?U(new Date(o.updated_at)):"Recently"}</span>
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
                <span>Updated ${s.updated_at?U(new Date(s.updated_at)):"Recently"}</span>
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
    `,requestAnimationFrame(()=>{d.classList.add("components-visible");const L=c.querySelector(".card:not(#project-components-section)");L&&L.classList.add("deploy-card-slide-down")})}else if(d){d.style.display="none",d.classList.remove("components-visible");const m=c==null?void 0:c.querySelector(".card:not(#project-components-section)");m&&m.classList.remove("deploy-card-slide-down")}}catch(t){console.error("Error loading project components:",t)}}function ze(t){t&&window.open(t,"_blank")}function Ge(t,n,e,o){const s=document.createElement("div");s.className="modal-overlay",s.id="envVarsDetectionOverlay";const a=document.createElement("div");a.className="modal-content enhanced",a.style.maxWidth="600px";const i=Object.keys(t).length>0,l=i?Object.entries(t).map(([c,u])=>`
      <div class="env-var-suggestion" style="padding: 0.75rem; margin-bottom: 0.5rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="font-weight: 600; color: #111827; margin-bottom: 0.25rem;">${c}</div>
        <div style="font-size: 0.875rem; color: #6b7280;">
          Detected from: ${u.detected_from} (${u.source})
          ${u.component?` | Component: ${u.component}`:""}
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
      ${l}
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
  `,n.appendChild(e),document.body.appendChild(n),{overlay:n,updateBackendStatus:(o,s)=>{const a=document.getElementById("step-backend"),i=a.querySelector(".step-icon"),l=document.getElementById("backend-status"),d=document.getElementById("backend-message");d.textContent=s,o==="deploying"?(i.textContent="⏳",l.textContent="",a.classList.remove("completed","failed"),a.classList.add("active")):o==="success"?(i.textContent="✅",l.textContent="✓",a.classList.remove("active","failed"),a.classList.add("completed")):o==="failed"&&(i.textContent="❌",l.textContent="✗",a.classList.remove("active","completed"),a.classList.add("failed"))},updateFrontendStatus:(o,s)=>{const a=document.getElementById("step-frontend"),i=a.querySelector(".step-icon"),l=document.getElementById("frontend-status"),d=document.getElementById("frontend-message");d.textContent=s,o==="deploying"?(i.textContent="⏳",l.textContent="",a.classList.remove("completed","failed"),a.classList.add("active")):o==="success"?(i.textContent="✅",l.textContent="✓",a.classList.remove("active","failed"),a.classList.add("completed")):o==="failed"&&(i.textContent="❌",l.textContent="✗",a.classList.remove("active","completed"),a.classList.add("failed"))},showUrls:(o,s)=>{const a=document.getElementById("deployment-urls"),i=document.getElementById("frontend-url-link"),l=document.getElementById("backend-url-link"),d=document.getElementById("close-deployment-dialog");o?(i.href=o,i.textContent=o,i.closest(".url-item").style.display="flex"):i.closest(".url-item").style.display="none",s?(l.href=s,l.textContent=s,l.closest(".url-item").style.display="flex"):l.closest(".url-item").style.display="none",a.style.display="block",d.style.display="block"},close:()=>{const o=document.getElementById("deploymentProgressOverlay");o&&document.body.removeChild(o)}}}function ye(){if(!r){p("No project selected","error");return}const t=document.createElement("div");t.className="modal-overlay";const n=document.createElement("div");n.className="modal-content enhanced",n.innerHTML=`
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
  `,t.appendChild(n),document.body.appendChild(t);const e=document.getElementById("newProjectNameInput");e&&(e.focus(),e.select());const o=n.querySelector(".cancel-name-btn"),s=n.querySelector(".save-name-btn"),a=()=>{document.body.removeChild(t)};o.onclick=()=>{a()},s.onclick=async()=>{const l=e.value.trim();if(!l){p("Project name cannot be empty","error");return}if(l===r.name){a();return}try{const d=localStorage.getItem("access_token")||localStorage.getItem("authToken"),c=await fetch(`/projects/${r.id}/name`,{method:"PUT",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${d}`},body:new URLSearchParams({app_name:l})}),u=await c.json();if(c.ok){p("Project name updated successfully!","success"),r.name=l,a();const y=I.findIndex(g=>g.id===r.id);y>=0&&(I[y].name=l),ne(),V(_);const m=document.getElementById("projectSidebarName");m&&(m.textContent=l),document.getElementById("pageTitle").textContent=l}else p(u.detail||"Failed to update project name","error")}catch(d){console.error("Error updating project name:",d),p("Failed to update project name: "+d.message,"error")}},t.onclick=l=>{l.target===t&&a()};const i=l=>{l.key==="Escape"&&(a(),document.removeEventListener("keydown",i))};document.addEventListener("keydown",i)}function ne(){if(!r)return;const t=document.getElementById("projectConfigName"),n=document.getElementById("projectConfigOwner"),e=document.getElementById("projectConfigId"),o=document.getElementById("projectConfigCreated"),s=document.getElementById("projectConfigUpdated"),a=document.getElementById("projectConfigPorts"),i=document.getElementById("projectConfigImage"),l=document.getElementById("projectConfigStatus");if(t&&(t.textContent=r.name||"Unknown"),n){const d=localStorage.getItem("username"),c=localStorage.getItem("displayName");n.textContent=c||d||"Unknown User"}e&&(e.textContent=r.id||"-"),o&&(o.textContent=r.createdAt?ve(r.createdAt):"Unknown"),s&&(s.textContent=r.updatedAt?U(new Date(r.updatedAt)):"Unknown"),a&&(a.textContent=r.containerPorts?fe(r.containerPorts):"No ports"),i&&(i.textContent=r.containerImage||"Unknown"),l&&(l.textContent=r.containerStatus||"Unknown")}function We(){let t=document.getElementById("page-project-domain");t||(t=document.createElement("div"),t.id="page-project-domain",t.className="page",t.innerHTML=`
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
    `,document.getElementById("pageContent").appendChild(t)),t.style.display="block"}function Ke(t){te(t)}async function ge(){const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t){console.log("No auth token found");return}try{const n=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${t}`}});if(n.ok){const e=await n.json(),o=document.getElementById("projectSidebar");if(o){const s=o.querySelector("#projectSidebarUserName"),a=o.querySelector("#projectSidebarUserEmail"),i=o.querySelector("#projectSidebarUserAvatar");if(s&&(s.textContent=e.display_name||e.username||"User"),a&&(a.textContent=e.email||"No email"),i)if(e.avatar_url){const l=new Image;l.onload=()=>{i.style.backgroundImage=`url(${e.avatar_url})`,i.style.backgroundSize="cover",i.style.backgroundPosition="center",i.textContent=""},l.onerror=()=>{i.style.backgroundImage="",i.textContent=(e.display_name||e.username||"U").charAt(0).toUpperCase()},l.src=e.avatar_url}else i.style.backgroundImage="",i.textContent=(e.display_name||e.username||"U").charAt(0).toUpperCase()}}else console.error("Failed to load user profile:",n.status)}catch(n){console.error("Error loading user profile:",n)}}function U(t){if(!t)return"Recently";const e=Date.now()-new Date(t).getTime(),o=Math.floor(e/6e4),s=Math.floor(e/36e5),a=Math.floor(e/864e5);if(o<1)return"Just now";if(o<60)return`${o}m ago`;if(s<24)return`${s}h ago`;if(a<7)return`${a}d ago`;const i=new Date(t);return i.toLocaleDateString("en-US",{month:"short",day:"numeric",year:i.getFullYear()!==new Date().getFullYear()?"numeric":void 0})}function ve(t){return t?new Date(t).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit",hour12:!0,timeZone:"Asia/Kathmandu"}):"Unknown"}function fe(t){if(!t||t==="No ports")return"No ports";const n=new Set;return t.split(",").forEach(o=>{const s=o.match(/(\d+)->(\d+)/);if(s){const a=s[1],i=s[2];n.add(`${a}:${i}`)}}),n.size===0?t:Array.from(n).sort().join(", ")}async function R(){await N();try{const t=await fetch("/deployments",{headers:C()});if(t.ok){const n=await t.json();document.getElementById("totalDeployments").textContent=n.length,document.getElementById("runningApps").textContent=n.filter(o=>o.status==="success").length;const e=document.getElementById("recentActivity");n.length>0?e.innerHTML=n.slice(0,5).map(o=>{const s=o.app_name||o.container_name||"Untitled Project";return`
          <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
            <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 0.25rem;">${b(s)}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">
              ${new Date(o.created_at).toLocaleString("en-US",{timeZone:"Asia/Kathmandu"})}
            </div>
          </div>
        `}).join(""):e.innerHTML='<p class="recent-activity-empty">No recent activity</p>'}}catch(t){console.error("Error loading dashboard:",t)}}async function Ye(t){var d,c,u,y;if(t.preventDefault(),!O){p("Please login to deploy applications","error"),window.location.href="/login";return}const n=t.target,e=((d=document.getElementById("deploy-type"))==null?void 0:d.value)||"single",o=(c=document.getElementById("git-url"))==null?void 0:c.value.trim(),s=(u=document.getElementById("frontend-url"))==null?void 0:u.value.trim(),a=(y=document.getElementById("backend-url"))==null?void 0:y.value.trim(),i=document.getElementById("deploy-status"),l=document.getElementById("deploy-success");if(l.style.display="none",i.textContent="",e==="split"){if(!s||!s.startsWith("http")||!a||!a.startsWith("http")){i.textContent="Please enter valid Frontend and Backend repository URLs",i.style.color="var(--error)";return}}else if(!o||!o.startsWith("http")){i.textContent="Please enter a valid Git repository URL",i.style.color="var(--error)";return}i.textContent="🚀 Deploying...",i.style.color="var(--primary)";try{const m=new FormData;e==="split"?(m.append("deploy_type","split"),m.append("frontend_url",s),m.append("backend_url",a)):(m.append("deploy_type","single"),m.append("git_url",o)),typeof r=="object"&&r&&r.id&&m.append("project_id",String(r.id));const g=await fetch("/deploy",{method:"POST",headers:C(),body:m}),f=await g.json();g.ok?(i.textContent="✅ Deployment successful!",i.style.color="var(--success)",f.deployed_url&&(l.style.display="block",document.getElementById("openAppBtn").href=f.deployed_url,document.getElementById("openAppBtn").textContent=`Open ${f.deployed_url}`),n.reset(),r&&r.isSplit?setTimeout(()=>{G(),R()},1500):setTimeout(()=>{R(),A.navigate("/applications")},2e3)):(i.textContent=`❌ Error: ${f.detail||"Deployment failed"}`,i.style.color="var(--error)")}catch{i.textContent="❌ Network error. Please try again.",i.style.color="var(--error)"}}async function pe(t,n=null,e=null,o=!1){const s=document.getElementById("deploy-status"),a=document.getElementById("deploy-success");if(!O)return p("Please login to deploy applications","error"),window.location.href="/login",o?{success:!1,error:"Not authenticated"}:void 0;e||(a&&(a.style.display="none"),s&&(s.textContent="",s.style.color="var(--primary)"));try{const i=new FormData;i.append("deploy_type","single"),i.append("git_url",t),typeof r=="object"&&r&&r.id&&i.append("project_id",String(r.id)),n&&typeof r=="object"&&r&&r.project_type==="split"&&i.append("component_type",n);const l=await fetch("/deploy",{method:"POST",headers:C(),body:i}),d=await l.json();if(l.ok){if(e){const c="success",u=n==="backend"?"Backend complete! ✅":"Frontend complete! ✅";n==="backend"?e.updateBackendStatus(c,u):n==="frontend"&&e.updateFrontendStatus(c,u)}else if(s&&(s.textContent="✅ Deployment successful!",s.style.color="var(--success)"),d.deployed_url&&a){a.style.display="block";const c=document.getElementById("openAppBtn");c&&(c.href=d.deployed_url,c.textContent=`Open ${d.deployed_url}`)}return o?{success:!0,deployed_url:d.deployed_url}:(r&&r.isSplit?setTimeout(()=>{G(),R()},1500):setTimeout(()=>{R(),A.navigate("/applications")},2e3),{success:!0,deployed_url:d.deployed_url})}else{const c=d.detail||"Deployment failed";if(e){const u="failed",y=`Error: ${c}`;n==="backend"?e.updateBackendStatus(u,y):n==="frontend"&&e.updateFrontendStatus(u,y)}else s&&(s.textContent=`❌ Error: ${c}`,s.style.color="var(--error)");if(o)return{success:!1,error:c}}}catch{const l="Network error. Please try again.";if(e){const d="failed",c=l;n==="backend"?e.updateBackendStatus(d,c):n==="frontend"&&e.updateFrontendStatus(d,c)}else s&&(s.textContent=`❌ ${l}`,s.style.color="var(--error)");if(o)return{success:!1,error:l}}}async function Je(){if(!O){document.getElementById("applicationsGrid").innerHTML=`
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
        `}).join("")}}catch(t){console.error("Error loading history:",t)}}async function Ze(){if(confirm("Are you sure you want to clear all deployment history?"))try{(await fetch("/deployments/clear",{method:"DELETE",headers:C()})).ok&&(p("History cleared successfully","success"),oe())}catch{p("Error clearing history","error")}}async function Qe(t){if(confirm(`Are you sure you want to destroy "${t}"?`))try{(await fetch(`/deployments/${t}`,{method:"DELETE",headers:C()})).ok?(p("Deployment destroyed successfully","success"),oe(),Je()):p("Error destroying deployment","error")}catch{p("Network error","error")}}let B=[],ue="";async function he(){const t=document.getElementById("usernameSearch").value.trim();if(!t){p("Please enter a GitHub username","error");return}t!==ue&&(B=[],ue=t);const n=document.getElementById("repositoriesGrid");n.innerHTML='<div class="empty-state"><p>Loading repositories...</p></div>';try{const e=await fetch(`/api/repositories/${t}`),o=await e.json();e.ok&&o.repositories?o.repositories.length===0?n.innerHTML='<div class="empty-state"><p>No repositories found</p></div>':(n.innerHTML=o.repositories.map(s=>`
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
        `).join(""),Q()):n.innerHTML=`<div class="empty-state"><p>${o.detail||"Error loading repositories"}</p></div>`}catch{n.innerHTML='<div class="empty-state"><p>Error loading repositories</p></div>'}}function Xe(t,n){const e=B.findIndex(o=>o.url===t);if(e>=0)B.splice(e,1),Q();else{if(B.length>=2){p("You can only select up to 2 repositories for a split repository","error");return}B.push({url:t,name:n}),B.length===2&&et(),Q()}}function et(){const[t,n]=B,e=document.createElement("div");e.className="modal-overlay",e.id="splitImportModal";const o=document.createElement("div");o.className="modal-content enhanced",o.innerHTML=`
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
  `,e.appendChild(o),document.body.appendChild(e);const s=o.querySelector(".cancel-btn"),a=o.querySelector(".confirm-btn"),i=()=>{document.body.removeChild(e)};s.onclick=()=>{i()},a.onclick=()=>{i();const[d,c]=B;we(d.url,c.url,`${d.name}-${c.name}`)},e.onclick=d=>{d.target===e&&i()};const l=d=>{d.key==="Escape"&&(i(),document.removeEventListener("keydown",l))};document.addEventListener("keydown",l),a.focus()}function Q(){const t=document.getElementById("repositoriesGrid");if(!t)return;t.querySelectorAll(".repository-card").forEach(e=>{const o=e.getAttribute("data-repo-url");B.some(a=>a.url===o)?e.classList.add("selected"):e.classList.remove("selected")})}function tt(){if(B.length!==2){p("Please select exactly 2 repositories","error");return}const[t,n]=B;confirm(`Import as Multi-Repository?

Frontend: ${t.name}
Backend: ${n.name}

Click OK to import these repositories as a multi-repository project.`)&&we(t.url,n.url,`${t.name}-${n.name}`)}async function we(t,n,e){const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o){p("Please login first","error");return}try{p("Importing multi-repositories...","info");const s=await fetch("/api/import-split",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${o}`},body:new URLSearchParams({frontend_url:t,backend_url:n,app_name:e})}),a=await s.json();if(s.ok){p("Multi-repository imported successfully! Navigate to Projects to see it.","success"),B=[];const i=document.getElementById("page-projects");i&&i.style.display!=="none"&&N(),document.getElementById("usernameSearch").value.trim()&&he()}else p(a.detail||"Failed to import multi-repository","error")}catch(s){console.error("Error importing multi-repositories:",s),p("Failed to import multi-repository: "+s.message,"error")}}function nt(t){document.getElementById("git-url").value=t,A.navigate("/deploy"),p("Repository selected","success")}async function ot(t,n){const e=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!e){p("Please login first","error");return}try{p("Importing repository...","info");const o=await fetch("/api/import",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${e}`},body:new URLSearchParams({git_url:t,app_name:n||t.split("/").pop()||"Untitled Project"})}),s=await o.json();if(o.ok){p("Repository imported successfully! Navigate to Projects to see it.","success");const a=document.getElementById("page-projects");a&&a.style.display!=="none"&&N()}else p(s.detail||"Failed to import repository","error")}catch(o){console.error("Error importing repository:",o),p("Failed to import repository: "+o.message,"error")}}function st(){document.getElementById("repositoriesGrid").innerHTML=`
    <div class="empty-state">
      <p>Search for a GitHub username to see their repositories</p>
            </div>
        `}function p(t,n="info"){const e=document.getElementById("toast");e.textContent=t,e.className=`toast show ${n}`,setTimeout(()=>{e.classList.remove("show")},3e3)}let H={},X=[];async function se(){try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t){const e=document.getElementById("envVarsList");e&&(e.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `),Y();return}if(!r||!r.id){const e=document.getElementById("envVarsList");e&&(e.innerHTML=`
          <div class="empty-state">
            <p>Please select a project from the Projects page to manage environment variables</p>
          </div>
        `),Y();return}const n=await fetch(`/api/env-vars?project_id=${r.id}`,{headers:{Authorization:`Bearer ${t}`}});if(n.ok){const e=await n.json();H=e.variables||{},X=e.vars_list||[],it()}else if(n.status===401){localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),W();const e=document.getElementById("envVarsList");e&&(e.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `)}else console.error("Failed to load environment variables")}catch(t){console.error("Error loading environment variables:",t)}Y()}function Y(){const t=document.getElementById("importEnvBtn"),n=document.getElementById("addEnvVarBtn"),e=document.getElementById("importEnvCard"),o=document.getElementById("cancelImportBtn"),s=document.getElementById("importEnvForm");t&&(t.onclick=()=>{e.style.display=e.style.display==="none"?"block":"none"}),o&&(o.onclick=()=>{e.style.display="none",document.getElementById("envFileInput").value=""}),n&&(n.onclick=()=>{rt()}),s&&(s.onsubmit=async a=>{a.preventDefault();const l=document.getElementById("envFileInput").files[0];l&&await at(l)})}async function at(t){try{const e=(await t.text()).split(`
`),o={};e.forEach(s=>{if(s=s.trim(),s&&!s.startsWith("#")&&s.includes("=")){const[a,...i]=s.split("="),l=i.join("=").trim().replace(/^["']|["']$/g,"");a.trim()&&(o[a.trim()]=l)}}),H={...H,...o},await ie(),document.getElementById("importEnvCard").style.display="none",document.getElementById("envFileInput").value="",p("Environment variables imported successfully!","success")}catch(n){console.error("Error importing .env file:",n),p("Failed to import .env file","error")}}function it(){const t=document.getElementById("envVarsList");if(t){if(X.length===0){t.innerHTML=`
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
        ${X.map((n,e)=>{const o=n.updated_at?U(new Date(n.updated_at)):"never",s=n.project_id?'<span style="font-size: 0.75rem; background: var(--primary); color: white; padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Project</span>':'<span style="font-size: 0.75rem; background: var(--bg-tertiary); color: var(--text-secondary); padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Global</span>';return`
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
  `}}function rt(){ae()}function ae(t=null,n=""){const e=document.getElementById("envVarModal"),o=document.getElementById("modalVarKey"),s=document.getElementById("modalVarValue"),a=document.getElementById("modalTitle");t?(a.textContent="Update environment variable",o.value=t,o.readOnly=!0,s.value=n):(a.textContent="Add environment variable",o.value="",o.readOnly=!1,s.value=""),e.style.display="flex"}function be(){const t=document.getElementById("envVarModal");t.style.display="none"}async function lt(){const t=document.getElementById("modalVarKey"),n=document.getElementById("modalVarValue"),e=t.value.trim(),o=n.value.trim();if(!e){p("Variable name is required","error");return}H[e]=o,await ie(),be()}function ke(t){const n=H[t]||"";ae(t,n)}async function ct(t){ke(t)}async function dt(t){confirm(`Are you sure you want to delete ${t}?`)&&(delete H[t],await ie(),p("Environment variable deleted","success"))}function pt(t){const e=document.querySelectorAll(".env-var-row")[t];if(!e)return;const o=e.querySelector(".env-var-value input");o.type==="password"?o.type="text":o.type="password"}async function ie(){try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!r||!r.id){p("No project selected","error");return}(await fetch("/api/env-vars",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({variables:H,project_id:r.id})})).ok?(await se(),p("Environment variables saved successfully","success")):(console.error("Failed to save environment variables"),p("Failed to save environment variables","error"))}catch(t){console.error("Error saving environment variables:",t),p("Error saving environment variables","error")}}function ut(){const t=document.getElementById("modalVarValue"),n=document.querySelector('#envVarModal button[onclick*="toggleModalValueVisibility"]');t&&n&&(t.type==="password"?(t.type="text",n.textContent="🙈 Hide"):(t.type="password",n.textContent="👁️ Show"))}function b(t){const n=document.createElement("div");return n.textContent=t,n.innerHTML}async function Ee(){try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t)return;const n=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${t}`}});if(n.ok){const e=await n.json(),o=document.getElementById("userName"),s=document.getElementById("userEmail"),a=document.getElementById("userAvatar");localStorage.setItem("displayName",e.display_name||""),localStorage.setItem("userEmail",e.email||""),o&&(o.textContent=e.display_name||e.username||"User"),ht(e.display_name||e.username||"User"),s&&(s.textContent=e.email||"Logged in"),a&&(e.avatar_url?(a.style.backgroundImage=`url(${e.avatar_url})`,a.style.backgroundSize="cover",a.style.backgroundPosition="center",a.textContent=""):(a.style.backgroundImage="",a.textContent=(e.display_name||e.username||"U").charAt(0).toUpperCase()))}else n.status===401&&(localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),W())}catch(t){console.error("Error loading user profile:",t)}}async function Ie(){try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken"),n=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${t}`}});if(n.ok){const e=await n.json(),o=document.getElementById("username"),s=document.getElementById("email"),a=document.getElementById("displayName");o&&(o.value=e.username||""),s&&(s.value=e.email||""),a&&(a.value=e.display_name||"");const i=document.getElementById("avatarPreview"),l=document.getElementById("avatarInitial"),d=document.getElementById("removeAvatarBtn");if(e.avatar_url&&i)i.src=e.avatar_url,i.style.display="block",l&&(l.style.display="none"),d&&(d.style.display="block");else if(l){const c=e.display_name&&e.display_name.charAt(0).toUpperCase()||e.username&&e.username.charAt(0).toUpperCase()||"S";l.textContent=c,l.style.display="block"}}}catch(t){console.error("Error loading profile:",t)}mt()}function mt(){const t=document.getElementById("profileForm"),n=document.getElementById("avatarFile"),e=document.getElementById("removeAvatarBtn");t&&t.addEventListener("submit",ft),n&&n.addEventListener("change",gt),e&&e.addEventListener("click",vt);const o=document.getElementById("changePasswordBtn"),s=document.getElementById("closePasswordModal"),a=document.getElementById("cancelPasswordBtn"),i=document.getElementById("updatePasswordBtn"),l=document.getElementById("passwordModal"),d=document.getElementById("modalNewPassword"),c=document.getElementById("strengthFill");o&&o.addEventListener("click",()=>{l&&(l.style.display="flex")}),s&&s.addEventListener("click",()=>{l&&(l.style.display="none")}),a&&a.addEventListener("click",()=>{l&&(l.style.display="none")}),l&&l.addEventListener("click",y=>{y.target===l&&(l.style.display="none")}),d&&d.addEventListener("input",y=>{const m=y.target.value;let g=0;m.length>=8&&(g+=25),/[a-z]/.test(m)&&/[A-Z]/.test(m)&&(g+=25),/\d/.test(m)&&(g+=25),/[!@#$%^&*(),.?":{}|<>]/.test(m)&&(g+=25),c&&(c.style.width=`${g}%`,g<50?c.style.background="#ef4444":g<75?c.style.background="#f59e0b":c.style.background="#10b981")}),i&&i.addEventListener("click",yt);const u=document.getElementById("cancelProfileBtn");u&&u.addEventListener("click",async()=>{await Ie()})}async function yt(){const t=document.getElementById("modalCurrentPassword"),n=document.getElementById("modalNewPassword"),e=document.getElementById("modalConfirmPassword"),o=document.getElementById("passwordModal");if(!t||!n||!e)return;const s=t.value,a=n.value,i=e.value;if(!s||!a||!i){p("Please fill in all password fields","error");return}if(a!==i){p("New passwords do not match","error");return}if(a.length<8){p("Password must be at least 8 characters","error");return}try{const l=localStorage.getItem("access_token")||localStorage.getItem("authToken"),d=new FormData;d.append("current_password",s),d.append("new_password",a);const c=await fetch("/api/user/profile",{method:"PUT",headers:{Authorization:`Bearer ${l}`},body:d}),u=await c.json();if(c.ok){p("Password updated successfully!","success"),o&&(o.style.display="none"),t.value="",n.value="",e.value="";const y=document.getElementById("strengthFill");y&&(y.style.width="0%")}else p(u.detail||u.message||"Failed to update password","error")}catch(l){console.error("Error updating password:",l),p("Network error. Please try again.","error")}}function gt(t){const n=t.target.files[0];if(n){const e=new FileReader;e.onload=o=>{const s=document.getElementById("avatarPreview"),a=document.getElementById("avatarInitial");s&&(s.src=o.target.result,s.style.display="block"),a&&(a.style.display="none");const i=document.getElementById("removeAvatarBtn");i&&(i.style.display="block")},e.readAsDataURL(n)}}function vt(){const t=document.getElementById("avatarPreview"),n=document.getElementById("avatarInitial");t&&(t.src="",t.style.display="none"),n&&(n.style.display="block");const e=document.getElementById("removeAvatarBtn");e&&(e.style.display="none");const o=document.getElementById("avatarFile");o&&(o.value="")}async function ft(t){t.preventDefault();const n=document.getElementById("profileMessage");n&&(n.style.display="none");const e=new FormData,o=document.getElementById("email"),s=document.getElementById("displayName");o&&e.append("email",o.value),s&&e.append("display_name",s.value);const a=document.getElementById("avatarFile");a&&a.files[0]&&e.append("avatar",a.files[0]);const i=document.getElementById("avatarPreview");i&&i.style.display==="none"&&e.append("remove_avatar","true");try{const l=localStorage.getItem("access_token")||localStorage.getItem("authToken"),d=await fetch("/api/user/profile",{method:"PUT",headers:{Authorization:`Bearer ${l}`},body:e}),c=await d.json();if(d.ok)n&&(n.textContent="Profile updated successfully!",n.className="profile-message success",n.style.display="block"),c.username&&localStorage.setItem("username",c.username),await Ee(),p("Profile updated successfully!","success");else{const u=c.detail||c.message||"Failed to update profile";n&&(n.textContent=u,n.className="profile-message error",n.style.display="block"),p(u,"error"),console.error("Profile update failed:",c)}}catch(l){console.error("Error updating profile:",l),n&&(n.textContent="Network error. Please try again.",n.className="profile-message error",n.style.display="block"),p("Network error. Please try again.","error")}}window.destroyDeployment=Qe;window.selectRepository=nt;window.importRepository=ot;window.editEnvVar=ct;window.deleteEnvVar=dt;window.toggleEnvVarVisibility=pt;window.saveEnvVarFromModal=lt;window.closeEnvVarModal=be;window.toggleModalValueVisibility=ut;window.editEnvVarModal=ke;window.showEnvVarModal=ae;window.selectProject=te;window.showProjectSidebar=Z;window.hideProjectSidebar=He;window.openProject=Ke;window.loadUserProfileIntoProjectSidebar=ge;window.openProjectSite=Fe;window.deleteProject=Ce;window.toggleRepositorySelection=Xe;window.confirmSplitImport=tt;window.openProjectNameModal=ye;window.openSite=ze;function ht(t){const n=document.getElementById("teamName");n&&(n.textContent=`${t}'s team`),document.querySelectorAll(".project-owner").forEach(o=>{o.textContent=`${t}'s team`})}let P=null,z=!1,T=[];function wt(){const t=document.getElementById("logsContent");t&&(t.innerHTML='<p class="logs-connecting">Connecting to WebSocket...</p>',Be(),bt())}function Be(){P&&P.close();const n=`${window.location.protocol==="https:"?"wss:":"ws:"}//${window.location.host}/ws/logs`;P=new WebSocket(n),P.onopen=()=>{console.log("Logs WebSocket connected"),$("Connected to logs stream","success"),T.length>0&&(T.forEach(e=>$(e.message,e.type)),T=[])},P.onmessage=e=>{try{const o=JSON.parse(e.data);z?T.push({message:o.message,type:o.type||"info"}):$(o.message,o.type||"info")}catch(o){console.error("Error parsing log message:",o),$(e.data,"info")}},P.onerror=e=>{console.error("Logs WebSocket error:",e),$("WebSocket connection error","error")},P.onclose=()=>{console.log("Logs WebSocket disconnected"),$("Disconnected from logs stream","warning"),setTimeout(()=>{var e;((e=document.getElementById("page-logs"))==null?void 0:e.style.display)!=="none"&&Be()},3e3)}}function $(t,n="info"){const e=document.getElementById("logsContent");if(!e)return;const o=new Date().toLocaleTimeString("en-US",{timeZone:"Asia/Kathmandu"}),s=document.createElement("div");s.className=`log-entry ${n}`,s.innerHTML=`
    <span class="log-timestamp">[${o}]</span>
    <span class="log-message">${b(t)}</span>
  `,e.appendChild(s),e.scrollTop=e.scrollHeight;const a=1e3,i=e.querySelectorAll(".log-entry");i.length>a&&i[0].remove()}function bt(){const t=document.getElementById("clearLogsBtn"),n=document.getElementById("toggleLogsBtn");t&&t.addEventListener("click",()=>{const e=document.getElementById("logsContent");e&&(e.innerHTML="",T=[],$("Logs cleared","info"))}),n&&n.addEventListener("click",()=>{z=!z,n.textContent=z?"Resume":"Pause",!z&&T.length>0&&(T.forEach(e=>$(e.message,e.type)),T=[]),$(z?"Logs paused":"Logs resumed","info")})}window.addEventListener("beforeunload",()=>{P&&P.close()});function kt(){const t=document.getElementById("sidebarSearch"),n=document.getElementById("commandPalette"),e=document.getElementById("commandSearchInput"),o=document.querySelectorAll(".command-item");let s=-1;function a(){n&&(n.style.display="flex",e&&(e.focus(),e.value=""),s=-1,l())}function i(){n&&(n.style.display="none",s=-1)}function l(){const c=Array.from(o).filter(u=>u.style.display!=="none");o.forEach((u,y)=>{c.indexOf(u)===s?(u.classList.add("selected"),u.scrollIntoView({block:"nearest",behavior:"smooth"})):u.classList.remove("selected")})}function d(c){switch(i(),c){case"deploy":case"nav-deploy":window.router&&window.router.navigate("/deploy");break;case"add-env-var":window.showEnvVarModal&&window.showEnvVarModal();break;case"search-repos":case"nav-repositories":window.router&&window.router.navigate("/repositories");break;case"nav-projects":window.router&&window.router.navigate("/");break;case"nav-applications":window.router&&window.router.navigate("/applications");break;case"nav-history":window.router&&window.router.navigate("/history");break;case"nav-env-vars":window.router&&window.router.navigate("/env-vars");break;case"nav-settings":window.router&&window.router.navigate("/settings");break}}document.addEventListener("keydown",c=>{var u;if((c.metaKey||c.ctrlKey)&&c.key==="k"&&(c.preventDefault(),n&&n.style.display==="none"?a():i()),c.key==="Escape"&&n&&n.style.display!=="none"&&i(),n&&n.style.display!=="none"){const y=Array.from(o).filter(m=>m.style.display!=="none");if(c.key==="ArrowDown")c.preventDefault(),s=Math.min(s+1,y.length-1),l();else if(c.key==="ArrowUp")c.preventDefault(),s=Math.max(s-1,-1),l();else if(c.key==="Enter"&&s>=0){c.preventDefault();const g=(u=Array.from(o).filter(f=>f.style.display!=="none")[s])==null?void 0:u.getAttribute("data-action");g&&d(g)}}}),t&&t.addEventListener("click",a),n&&n.addEventListener("click",c=>{c.target===n&&i()}),o.forEach(c=>{c.addEventListener("click",()=>{const u=c.getAttribute("data-action");u&&d(u)})}),e&&e.addEventListener("input",c=>{const u=c.target.value.toLowerCase();o.forEach(y=>{y.querySelector(".command-text").textContent.toLowerCase().includes(u)?y.style.display="flex":y.style.display="none"}),s=-1,l()})}
