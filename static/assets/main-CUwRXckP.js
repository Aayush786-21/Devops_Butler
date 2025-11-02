import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */class Ie{constructor(){this.routes={"/":"projects","/deploy":"deploy","/history":"history","/repositories":"repositories","/domain":"domain","/env-vars":"env-vars","/settings":"settings","/logs":"logs"},this.currentPage=null,this.init()}init(){document.querySelectorAll(".nav-item").forEach(n=>{n.addEventListener("click",e=>{e.preventDefault();const o=n.getAttribute("href");this.navigate(o)})}),window.addEventListener("popstate",()=>{this.loadPage(window.location.pathname)}),this.loadPage(window.location.pathname)}navigate(n){window.history.pushState({},"",n),this.loadPage(n)}loadPage(n){const e=this.routes[n]||"dashboard";if(e==="deploy"){r=null;const o=document.getElementById("projectSidebar");o&&(o.style.display="none");const s=document.getElementById("sidebar");s&&(s.style.display="block")}this.showPage(e),this.updateActiveNav(n),this.updatePageTitle(e),window.scrollTo({top:0,behavior:"smooth"})}showPage(n){document.querySelectorAll(".page").forEach(o=>{o.style.display="none"});const e=document.getElementById(`page-${n}`);if(e){if(e.style.display="block",n==="deploy"){const o=document.getElementById("deploy-status"),s=document.getElementById("deploy-success");o&&(o.textContent="",o.style.color=""),s&&(s.style.display="none")}}else{const o=document.getElementById("page-dashboard");o&&(o.style.display="block")}this.currentPage=n,this.loadPageData(n)}updateActiveNav(n){document.querySelectorAll(".nav-item").forEach(e=>{e.classList.remove("active"),e.getAttribute("href")===n&&e.classList.add("active")})}updatePageTitle(n){const e={projects:"Projects",deploy:"Deploy",history:"History",repositories:"Repositories",domain:"Domain","env-vars":"Environmental Variables",settings:"Settings",logs:"Logs"};document.getElementById("pageTitle").textContent=e[n]||"Dashboard"}loadPageData(n){switch(n){case"projects":_();break;case"history":te();break;case"repositories":et();break;case"domain":De();break;case"env-vars":z();break;case"settings":Ee();break;case"logs":ft();break}}}const R=new Ie;window.router=R;async function Be(t){const n=await Ce();if(!n)return;const e=k.find(a=>a.id==t),o=e?e.name:"this project";if(await Se(o))try{console.log("Deleting project with token:",n.substring(0,20)+"...");const a=await fetch(`/projects/${t}`,{method:"DELETE",headers:{Authorization:`Bearer ${n}`}});if(console.log("Delete response status:",a.status),!a.ok){const i=await a.json().catch(()=>({}));if(console.error("Delete error response:",i),a.status===401){u("Session expired. Please login again.","error"),localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),setTimeout(()=>{window.location.href="/login"},2e3);return}throw new Error(i.detail||"Failed to delete project")}k=k.filter(i=>i.id!=t),P=P.filter(i=>i.id!=t),T(P),u("Project deleted","success")}catch(a){console.error("Delete project error:",a),u(`Delete failed: ${a.message}`,"error")}}function Se(t){return new Promise(n=>{const e=document.createElement("div");e.className="modal-overlay";const o=document.createElement("div");o.className="delete-confirmation-modal",o.innerHTML=`
      <h3>Delete Project</h3>
      <p>
        Are you sure you want to delete <strong>${w(t)}</strong>?<br>
        This will stop and remove its container and image.
      </p>
      <div class="delete-confirmation-actions">
        <button class="cancel-btn">Cancel</button>
        <button class="delete-btn">Delete</button>
      </div>
    `,e.appendChild(o),document.body.appendChild(e);const s=o.querySelector(".cancel-btn"),a=o.querySelector(".delete-btn"),i=()=>{document.body.removeChild(e)};s.onclick=()=>{i(),n(!1)},a.onclick=()=>{i(),n(!0)},e.onclick=l=>{l.target===e&&(i(),n(!1))},a.focus()})}function je(t){try{const e=JSON.parse(atob(t.split(".")[1])).exp*1e3,o=Date.now();return e<o+5*60*1e3}catch{return!0}}async function Ce(){const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");return!t||je(t)?(u("Session expired. Please login again.","error"),localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),setTimeout(()=>{window.location.href="/login"},2e3),null):t}let U=localStorage.getItem("access_token")||localStorage.getItem("authToken"),Q=localStorage.getItem("username");document.addEventListener("DOMContentLoaded",()=>{G(),window.location.pathname==="/login"||window.location.pathname.includes("login.html")||setTimeout(()=>{if(U&&Q){Le(),ht();const n=document.getElementById("page-projects");n&&window.location.pathname==="/"&&(n.style.display="block")}},100)});function G(){const t=document.getElementById("userSection"),n=document.getElementById("authButtons"),e=document.getElementById("logoutBtn"),o=document.getElementById("newDeployBtn");document.getElementById("userName"),document.getElementById("userEmail"),document.getElementById("userAvatar");const s=window.location.pathname==="/login"||window.location.pathname.includes("login.html");U&&Q?(t.style.display="flex",n.style.display="none",e.style.display="block",o.style.display="block",be(),_(),s&&(window.location.href="/")):(t.style.display="none",n.style.display="block",e.style.display="none",o.style.display="none",s||(window.location.href="/login"))}function Le(){var a,i;document.getElementById("logoutBtn").addEventListener("click",()=>{localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),U=null,Q=null,G(),u("Logged out successfully","success"),R.navigate("/")});const t=document.getElementById("projectsSearch");t&&t.addEventListener("input",l=>{const d=l.target.value.toLowerCase();P=k.filter(c=>c.name.toLowerCase().includes(d)||c.repository&&c.repository.toLowerCase().includes(d)),T(P)});const n=document.getElementById("addProjectBtn");n&&n.addEventListener("click",()=>{window.router&&window.router.navigate("/deploy")});const e=document.getElementById("browseUploadLink");e&&e.addEventListener("click",l=>{l.preventDefault(),window.router&&window.router.navigate("/deploy")}),document.getElementById("newDeployBtn").addEventListener("click",()=>{r=null;const l=document.getElementById("projectSidebar");l&&(l.style.display="none");const d=document.getElementById("sidebar");d&&(d.style.display="block"),R.navigate("/deploy")});const o=document.getElementById("deployForm");o&&o.addEventListener("submit",Ge);const s=document.getElementById("deploy-type");s&&s.addEventListener("change",l=>{const d=document.getElementById("single-repo-group"),c=document.getElementById("split-repo-group"),p=document.getElementById("git-url");l.target.value==="split"?(d.style.display="none",c.style.display="block",p&&p.removeAttribute("required")):(d.style.display="block",c.style.display="none",p&&p.setAttribute("required","required"))}),(a=document.getElementById("clearHistoryBtn"))==null||a.addEventListener("click",We),(i=document.getElementById("searchReposBtn"))==null||i.addEventListener("click",fe),Pe()}function Pe(){const t=document.querySelector(".search-input"),n=document.getElementById("spotlightModal"),e=document.getElementById("spotlightSearch"),o=document.getElementById("spotlightResults");!t||!n||!e||!o||(t.addEventListener("click",_e),n.addEventListener("click",s=>{s.target===n&&K()}),e.addEventListener("input",xe),o.addEventListener("click",Te),document.addEventListener("keydown",s=>{s.key==="Escape"&&n.style.display!=="none"&&K()}))}function _e(){const t=document.getElementById("spotlightModal"),n=document.getElementById("spotlightSearch");t.style.display="flex",setTimeout(()=>{n.focus()},100)}function K(){const t=document.getElementById("spotlightModal"),n=document.getElementById("spotlightSearch"),e=document.getElementById("spotlightResults");t.style.display="none",n.value="",e.innerHTML=`
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
  `}function xe(t){const n=t.target.value.toLowerCase().trim(),e=document.getElementById("spotlightResults");if(!n){e.innerHTML=`
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
    `;return}const o=$e(n);Ne(o)}function $e(t){const n={projects:[],actions:[],navigation:[]};k&&k.length>0&&(n.projects=k.filter(s=>s.name.toLowerCase().includes(t)||s.repository&&s.repository.toLowerCase().includes(t)));const e=[{name:"New Deploy",action:"new-deploy",icon:"🚀"},{name:"Repositories",action:"repositories",icon:"📁"},{name:"History",action:"history",icon:"📜"},{name:"Settings",action:"settings",icon:"⚙️"},{name:"Domain",action:"domain",icon:"🌐"}];n.actions=e.filter(s=>s.name.toLowerCase().includes(t));const o=[{name:"Projects",action:"projects",icon:"📊"},{name:"Repositories",action:"repositories",icon:"📁"},{name:"History",action:"history",icon:"📜"},{name:"Domain",action:"domain",icon:"🌐"},{name:"Settings",action:"settings",icon:"⚙️"}];return n.navigation=o.filter(s=>s.name.toLowerCase().includes(t)),n}function Ne(t){const n=document.getElementById("spotlightResults");let e='<div class="search-results">';t.projects.length>0&&(e+='<div class="search-category">',e+='<div class="search-category-title">Projects</div>',t.projects.forEach(o=>{const s=o.status==="running"?"🚀":"📦",a=o.status==="running"?"RUNNING":o.status==="failed"?"FAILED":"IMPORTED";e+=`
        <div class="search-result-item" data-type="project" data-id="${o.id}">
          <span class="search-result-icon">${s}</span>
          <div class="search-result-content">
            <div class="search-result-title">${w(o.name)}</div>
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
        <p>No results found for "${w(document.getElementById("spotlightSearch").value)}"</p>
      </div>
    `),e+="</div>",n.innerHTML=e}function Te(t){const n=t.target.closest(".suggestion-item, .search-result-item");if(!n)return;const e=n.dataset.action,o=n.dataset.type,s=n.dataset.id;if(K(),o==="project"&&s)X(parseInt(s));else if(e)switch(e){case"new-deploy":window.router&&window.router.navigate("/deploy");break;case"repositories":window.router&&window.router.navigate("/repositories");break;case"history":window.router&&window.router.navigate("/history");break;case"domain":window.router&&window.router.navigate("/domain");break;case"settings":window.router&&window.router.navigate("/settings");break;case"projects":window.router&&window.router.navigate("/projects");break}}function De(){document.getElementById("page-domain")}function j(){const t={},n=localStorage.getItem("access_token")||localStorage.getItem("authToken");return n&&(t.Authorization=`Bearer ${n}`),t}let k=[],P=[];async function _(){const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t){T([]);return}Ue();try{const n=await fetch("/deployments",{headers:{Authorization:`Bearer ${t}`}});n.ok?(k=(await n.json()).map(o=>{var M;const s=o.git_url||"",a=s,i=s?(M=String(s).split("/").pop())==null?void 0:M.replace(/\.git$/,""):null,l=o.app_name||i||o.container_name||"Untitled Project",d=(o.status||"").toLowerCase();let c;d==="running"?c="running":d==="failed"||d==="error"?c="failed":c="imported";let p=!1,y="single",m=null,g=null;const v=String(o.git_url||""),E=v.startsWith("split::"),S=!o.parent_project_id&&!o.component_type;if(E){p=!0,y="split";try{const h=v.replace("split::","").split("|");h.length===2&&(m=h[0],g=h[1])}catch{}}else if(d==="imported_split")p=!0,y="split";else if(S&&v.includes("|")){p=!0,y="split";try{const h=v.split("|");h.length===2&&(m=h[0],g=h[1])}catch{}}return{id:o.id,name:l,status:c,url:o.deployed_url||o.app_url,createdAt:o.created_at,updatedAt:o.updated_at,repository:a,repository_url:a,git_url:s,project_type:y,isSplit:p,frontend_url:m,backend_url:g,containerUptime:o.container_uptime||"Unknown",containerPorts:o.container_ports||"No ports",containerImage:o.container_image||"Unknown",containerStatus:o.container_status||"Unknown",isRunning:o.is_running||!1}}),P=[...k],T(P)):T([])}catch(n){console.error("Error loading projects:",n),T([])}}function T(t){const n=document.getElementById("projectsGrid");if(n){if(t.length===0){n.innerHTML=`
      <div class="empty-state">
        <p>No projects found</p>
        <button class="btn-primary" onclick="if(window.router){window.router.navigate('/deploy');}else{window.location.href='/deploy';}">Create First Project</button>
      </div>
    `;return}n.innerHTML=t.map(e=>{const o=e.status==="running"?"status-success":e.status==="failed"?"status-error":"status-info",s=e.status==="running"?"Running":e.status==="failed"?"Failed":"Imported",a=e.status==="running"?"🚀":"📦",i=e.updatedAt?N(e.updatedAt):"Recently";return`
      <div class="project-card" data-project-id="${e.id}" onclick="selectProject(${e.id})">
        <div class="project-header">
          <div class="project-icon">${a}</div>
          <div class="project-status ${o}">${s}</div>
          </div>
        
        <div class="project-info">
          <h3 class="project-name">${w(e.name)}</h3>
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
      `}).join("")}}async function Ae(t){try{const n=k.find(e=>e.id===t);if(!n){u("Project not found","error");return}if(!n.url||n.url==="#"){u("Project URL not available. Make sure the project is deployed.","error");return}window.open(n.url,"_blank"),u(`Opening ${n.name}...`,"info")}catch(n){console.error("Error opening project site:",n),u("Failed to open project site: "+n.message,"error")}}function Ue(){const t=document.getElementById("projectsGrid");t&&(t.innerHTML=`
    <div class="loading-skeleton">
      ${Array(3).fill(`
        <div class="skeleton-card">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line short"></div>
        </div>
      `).join("")}
    </div>
  `)}let r=null;function X(t){_().then(()=>{const e=k.find(o=>o.id==t);if(!e){const o=P.find(s=>s.id==t);o&&(r=o,Y(o));return}r=e,Y(e)});const n=document.getElementById("page-project-config");n&&n.style.display!=="none"&&ee()}function Y(t){const n=document.getElementById("sidebar");n&&(n.style.display="none");let e=document.getElementById("projectSidebar");e||(e=Me(),document.body.appendChild(e));const o=e.querySelector("#projectSidebarName");o&&(o.textContent=t.name);const s=e.querySelector("#projectSidebarId");s&&(s.textContent=t.id);const a=e.querySelector('a[data-project-page="status"]');a&&(t.project_type==="split"?a.style.display="flex":a.style.display="none"),e.style.display="block",document.getElementById("pageTitle").textContent=t.name,me(),pe("deploy")}function Me(){const t=document.createElement("aside");return t.id="projectSidebar",t.className="sidebar project-sidebar",t.innerHTML=`
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
  `,t.querySelectorAll(".project-nav-item").forEach(n=>{n.addEventListener("click",async e=>{e.preventDefault();const o=n.getAttribute("data-project-page");if(await _(),r){const s=k.find(a=>a.id===r.id);s&&(r=s)}pe(o),t.querySelectorAll(".project-nav-item").forEach(s=>s.classList.remove("active")),n.classList.add("active")})}),t}function Fe(){const t=document.getElementById("projectSidebar");t&&(t.style.display="none");const n=document.getElementById("sidebar");n&&(n.style.display="block"),r=null,document.getElementById("pageTitle").textContent="Projects",document.querySelectorAll(".page").forEach(o=>{o.style.display="none"});const e=document.getElementById("page-projects");e&&(e.style.display="block"),_()}function pe(t){var n;switch(document.querySelectorAll(".page").forEach(e=>{e.style.display="none"}),t){case"deploy":const e=document.getElementById("page-deploy");if(e){e.style.display="block";const s=document.getElementById("deploy-status"),a=document.getElementById("deploy-success");s&&(s.textContent="",s.style.color=""),a&&(a.style.display="none");const i=(n=e.querySelector(".card h2"))==null?void 0:n.closest(".card");if(r){i&&(i.style.display="block");const h=document.getElementById("project-components-section");r!=null&&r.project_type||r!=null&&r.isSplit,h&&(h.style.display="none")}else{i&&(i.style.display="block");const h=document.getElementById("project-components-section");h&&(h.style.display="none")}document.getElementById("deploy-type");const l=document.getElementById("deploy-type-group"),d=document.getElementById("single-repo-group"),c=document.getElementById("split-repo-group"),p=document.getElementById("split-deploy-layout"),y=document.getElementById("git-url"),m=document.getElementById("frontend-url"),g=document.getElementById("backend-url"),v=document.getElementById("deploy-submit-default");e.querySelectorAll(".dynamic-split-btn").forEach(h=>h.remove());let E=r==null?void 0:r.project_type;const S=(r==null?void 0:r.git_url)||(r==null?void 0:r.repository_url)||"",M=S.startsWith("split::");if(E||(r!=null&&r.isSplit||M?E="split":E="single"),M&&E!=="split"?(console.warn("Project type mismatch detected. git_url indicates split but project_type is",E),E="split"):!M&&E==="split"&&S&&(console.warn("Project type mismatch detected. git_url indicates single but project_type is split"),E="single"),r)if(l&&(l.style.display="none"),E==="split"){d&&(d.style.display="none"),c&&(c.style.display="none"),p&&(p.style.display="block"),m&&(m.value=r.frontend_url||""),g&&(g.value=r.backend_url||""),y&&y.removeAttribute("required"),v&&(v.style.display="none");const h=document.getElementById("deploy-frontend-btn"),se=document.getElementById("deploy-backend-btn"),ae=document.getElementById("deploy-both-btn");h&&(h.onclick=async()=>{var x;const B=(x=m==null?void 0:m.value)==null?void 0:x.trim();if(!B||!B.startsWith("http"))return u("Enter a valid frontend URL","error");const b=W(!1);document.getElementById("step-frontend").style.display="flex",b.updateFrontendStatus("deploying","Deploying your frontend now...");const f=await le(B,"frontend",b,!0);f&&f.success&&f.deployed_url?(b.showUrls(f.deployed_url,null),document.getElementById("close-deployment-dialog").onclick=()=>{b.close(),H(),D()}):f&&!f.success&&setTimeout(()=>b.close(),3e3)}),se&&(se.onclick=async()=>{var x;const B=(x=g==null?void 0:g.value)==null?void 0:x.trim();if(!B||!B.startsWith("http"))return u("Enter a valid backend URL","error");const b=W(!1);document.getElementById("step-backend").style.display="flex",b.updateBackendStatus("deploying","Deploying your backend now...");const f=await le(B,"backend",b,!0);f&&f.success&&f.deployed_url?(b.showUrls(null,f.deployed_url),document.getElementById("close-deployment-dialog").onclick=()=>{b.close(),H(),D()}):f&&!f.success&&setTimeout(()=>b.close(),3e3)}),ae&&(ae.onclick=async()=>{var x,ie;const B=(x=m==null?void 0:m.value)==null?void 0:x.trim(),b=(ie=g==null?void 0:g.value)==null?void 0:ie.trim();if(!B||!B.startsWith("http")||!b||!b.startsWith("http")){u("Please enter valid Frontend and Backend repository URLs","error");return}const f=W(!0);document.getElementById("step-backend").style.display="flex",document.getElementById("step-frontend").style.display="flex",f.updateBackendStatus("deploying","Deploying your backend now...");try{const F=new FormData;F.append("deploy_type","split"),F.append("frontend_url",B),F.append("backend_url",b),r&&r.id&&F.append("project_id",String(r.id));const re=await fetch("/deploy",{method:"POST",headers:j(),body:F}),q=await re.json();re.ok&&q.deployed_url?(f.updateBackendStatus("success","Backend deployed! ✅"),f.updateFrontendStatus("success","Frontend deployed! ✅"),f.showUrls(q.deployed_url,null),document.getElementById("close-deployment-dialog").onclick=()=>{f.close(),_(),H(),D()},u("Split deployment successful!","success")):(f.updateBackendStatus("failed",q.detail||"Deployment failed"),f.updateFrontendStatus("failed","Could not deploy"),u(q.detail||"Deployment failed","error"),setTimeout(()=>f.close(),3e3))}catch{f.updateBackendStatus("failed","Network error"),f.updateFrontendStatus("failed","Network error"),u("Network error during deployment","error"),setTimeout(()=>f.close(),3e3)}}),v&&(v.style.display="none")}else E==="single"&&(d&&(d.style.display="block"),c&&(c.style.display="none"),p&&(p.style.display="none"),y&&r&&r.repository_url&&(y.value=r.repository_url),v&&(v.textContent="🚀 Deploy",v.style.display=""));else l&&(l.style.display=""),c&&(c.style.display="none"),p&&(p.style.display="none"),d&&(d.style.display="block"),y&&(y.value=""),v&&(v.textContent="🚀 Deploy",v.style.display="")}document.getElementById("pageTitle").textContent="Deploy";break;case"status":Re();break;case"configuration":Ve();break;case"domain-config":qe();break;case"env-vars":const o=document.getElementById("page-env-vars");o&&(o.style.display="block",z());break}}async function Ve(){let t=document.getElementById("page-project-config");t||(t=document.createElement("div"),t.id="page-project-config",t.className="page",t.innerHTML=`
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
              <span class="config-value-text" id="projectConfigCreated">${r!=null&&r.createdAt?ye(r.createdAt):"Unknown"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Last update:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigUpdated">${r!=null&&r.updatedAt?N(new Date(r.updatedAt)):"Unknown"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Container Ports:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigPorts">${r!=null&&r.containerPorts?ge(r.containerPorts):"No ports"}</span>
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
    `,document.getElementById("pageContent").appendChild(t));const n=document.getElementById("project-components-section");n&&(n.style.display="none"),ee();const e=document.getElementById("changeProjectNameBtn");e&&(e.onclick=()=>ue()),t.style.display="block"}async function Re(){document.querySelectorAll(".page").forEach(n=>n.style.display="none");let t=document.getElementById("page-status");if(t||(t=document.createElement("div"),t.id="page-status",t.className="page",document.getElementById("pageContent").appendChild(t)),t.innerHTML="",r&&r.id)try{const n=await fetch(`/projects/${r.id}/components`,{headers:j()});if(n.ok){const o=(await n.json()).components||[],s=o.find(p=>p.component_type==="frontend"),a=o.find(p=>p.component_type==="backend"),i=s?s.status==="running"?"RUNNING":s.status.toUpperCase():"NOT DEPLOYED",l=a?a.status==="running"?"RUNNING":a.status.toUpperCase():"NOT DEPLOYED",d=(s==null?void 0:s.status)==="running"?"status-success":(s==null?void 0:s.status)==="failed"?"status-error":"status-info",c=(a==null?void 0:a.status)==="running"?"status-success":(a==null?void 0:a.status)==="failed"?"status-error":"status-info";t.innerHTML=`
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
                      <span>Updated ${s.updated_at?N(new Date(s.updated_at)):"Recently"}</span>
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
                      <span>Updated ${a.updated_at?N(new Date(a.updated_at)):"Recently"}</span>
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
      `}t.style.display="block",document.getElementById("pageTitle").textContent="Status"}async function H(){if(!(!r||!r.id))try{const t=await fetch(`/projects/${r.id}/components`,{headers:j()});if(!t.ok)return;const e=(await t.json()).components||[],o=e.find(m=>m.component_type==="frontend"),s=e.find(m=>m.component_type==="backend"),a=o&&o.status&&o.status!=="imported"&&o.status!=="imported_split",i=s&&s.status&&s.status!=="imported"&&s.status!=="imported_split",l=a&&i;let d=document.getElementById("project-components-section");const c=document.getElementById("page-deploy"),p=document.getElementById("page-project-config"),y=p==null?void 0:p.querySelector("#project-components-section");if(y&&y.remove(),l&&c&&c.style.display!=="none"){if(!d){d=document.createElement("div"),d.id="project-components-section",d.className="card project-components-card";const S=c.querySelector(".card");S?c.insertBefore(d,S):c.appendChild(d)}d.style.display="block";const m=o?o.status==="running"?"RUNNING":o.status.toUpperCase():"NOT DEPLOYED",g=s?s.status==="running"?"RUNNING":s.status.toUpperCase():"NOT DEPLOYED",v=(o==null?void 0:o.status)==="running"?"status-success":(o==null?void 0:o.status)==="failed"?"status-error":"status-info",E=(s==null?void 0:s.status)==="running"?"status-success":(s==null?void 0:s.status)==="failed"?"status-error":"status-info";d.innerHTML=`
      <h2 style="margin-bottom: 1.5rem;">Project Components</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
        <!-- Frontend Card -->
        <div class="project-card" style="margin: 0;">
          <div class="project-header">
            <div class="project-icon">🌐</div>
            <div class="project-status ${v}">${m}</div>
          </div>
          <div class="project-info">
            <h3 class="project-name">Frontend</h3>
            <div class="project-meta">
              ${o?`
                <svg class="icon-clock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                <span>Updated ${o.updated_at?N(new Date(o.updated_at)):"Recently"}</span>
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
                <span>Updated ${s.updated_at?N(new Date(s.updated_at)):"Recently"}</span>
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
    `,requestAnimationFrame(()=>{d.classList.add("components-visible");const S=c.querySelector(".card:not(#project-components-section)");S&&S.classList.add("deploy-card-slide-down")})}else if(d){d.style.display="none",d.classList.remove("components-visible");const m=c==null?void 0:c.querySelector(".card:not(#project-components-section)");m&&m.classList.remove("deploy-card-slide-down")}}catch(t){console.error("Error loading project components:",t)}}function He(t){t&&window.open(t,"_blank")}function W(t=!0){const n=document.createElement("div");n.className="modal-overlay deployment-progress-overlay",n.id="deploymentProgressOverlay";const e=document.createElement("div");return e.className="deployment-progress-modal",e.innerHTML=`
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
  `,n.appendChild(e),document.body.appendChild(n),{overlay:n,updateBackendStatus:(o,s)=>{const a=document.getElementById("step-backend"),i=a.querySelector(".step-icon"),l=document.getElementById("backend-status"),d=document.getElementById("backend-message");d.textContent=s,o==="deploying"?(i.textContent="⏳",l.textContent="",a.classList.remove("completed","failed"),a.classList.add("active")):o==="success"?(i.textContent="✅",l.textContent="✓",a.classList.remove("active","failed"),a.classList.add("completed")):o==="failed"&&(i.textContent="❌",l.textContent="✗",a.classList.remove("active","completed"),a.classList.add("failed"))},updateFrontendStatus:(o,s)=>{const a=document.getElementById("step-frontend"),i=a.querySelector(".step-icon"),l=document.getElementById("frontend-status"),d=document.getElementById("frontend-message");d.textContent=s,o==="deploying"?(i.textContent="⏳",l.textContent="",a.classList.remove("completed","failed"),a.classList.add("active")):o==="success"?(i.textContent="✅",l.textContent="✓",a.classList.remove("active","failed"),a.classList.add("completed")):o==="failed"&&(i.textContent="❌",l.textContent="✗",a.classList.remove("active","completed"),a.classList.add("failed"))},showUrls:(o,s)=>{const a=document.getElementById("deployment-urls"),i=document.getElementById("frontend-url-link"),l=document.getElementById("backend-url-link"),d=document.getElementById("close-deployment-dialog");o?(i.href=o,i.textContent=o,i.closest(".url-item").style.display="flex"):i.closest(".url-item").style.display="none",s?(l.href=s,l.textContent=s,l.closest(".url-item").style.display="flex"):l.closest(".url-item").style.display="none",a.style.display="block",d.style.display="block"},close:()=>{const o=document.getElementById("deploymentProgressOverlay");o&&document.body.removeChild(o)}}}function ue(){if(!r){u("No project selected","error");return}const t=document.createElement("div");t.className="modal-overlay";const n=document.createElement("div");n.className="modal-content enhanced",n.innerHTML=`
    <div class="project-name-modal-header">
      <h2 class="project-name-modal-title">Change Project Name</h2>
      <p class="project-name-modal-subtitle">
        Update the name for <strong>${w(r.name)}</strong>
      </p>
    </div>
    
    <div class="project-name-modal-form-group">
      <label class="project-name-modal-label">Project Name</label>
      <input 
        type="text" 
        id="newProjectNameInput"
        class="project-name-modal-input"
        value="${w(r.name)}"
        placeholder="Enter new project name"
      />
    </div>
    
    <div class="project-name-modal-actions">
      <button class="cancel-name-btn">Cancel</button>
      <button class="save-name-btn">Save Changes</button>
    </div>
  `,t.appendChild(n),document.body.appendChild(t);const e=document.getElementById("newProjectNameInput");e&&(e.focus(),e.select());const o=n.querySelector(".cancel-name-btn"),s=n.querySelector(".save-name-btn"),a=()=>{document.body.removeChild(t)};o.onclick=()=>{a()},s.onclick=async()=>{const l=e.value.trim();if(!l){u("Project name cannot be empty","error");return}if(l===r.name){a();return}try{const d=localStorage.getItem("access_token")||localStorage.getItem("authToken"),c=await fetch(`/projects/${r.id}/name`,{method:"PUT",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${d}`},body:new URLSearchParams({app_name:l})}),p=await c.json();if(c.ok){u("Project name updated successfully!","success"),r.name=l,a();const y=k.findIndex(g=>g.id===r.id);y>=0&&(k[y].name=l),ee(),T(P);const m=document.getElementById("projectSidebarName");m&&(m.textContent=l),document.getElementById("pageTitle").textContent=l}else u(p.detail||"Failed to update project name","error")}catch(d){console.error("Error updating project name:",d),u("Failed to update project name: "+d.message,"error")}},t.onclick=l=>{l.target===t&&a()};const i=l=>{l.key==="Escape"&&(a(),document.removeEventListener("keydown",i))};document.addEventListener("keydown",i)}function ee(){if(!r)return;const t=document.getElementById("projectConfigName"),n=document.getElementById("projectConfigOwner"),e=document.getElementById("projectConfigId"),o=document.getElementById("projectConfigCreated"),s=document.getElementById("projectConfigUpdated"),a=document.getElementById("projectConfigPorts"),i=document.getElementById("projectConfigImage"),l=document.getElementById("projectConfigStatus");if(t&&(t.textContent=r.name||"Unknown"),n){const d=localStorage.getItem("username"),c=localStorage.getItem("displayName");n.textContent=c||d||"Unknown User"}e&&(e.textContent=r.id||"-"),o&&(o.textContent=r.createdAt?ye(r.createdAt):"Unknown"),s&&(s.textContent=r.updatedAt?N(new Date(r.updatedAt)):"Unknown"),a&&(a.textContent=r.containerPorts?ge(r.containerPorts):"No ports"),i&&(i.textContent=r.containerImage||"Unknown"),l&&(l.textContent=r.containerStatus||"Unknown")}function qe(){let t=document.getElementById("page-project-domain");t||(t=document.createElement("div"),t.id="page-project-domain",t.className="page",t.innerHTML=`
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
    `,document.getElementById("pageContent").appendChild(t)),t.style.display="block"}function Oe(t){X(t)}async function me(){const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t){console.log("No auth token found");return}try{const n=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${t}`}});if(n.ok){const e=await n.json(),o=document.getElementById("projectSidebar");if(o){const s=o.querySelector("#projectSidebarUserName"),a=o.querySelector("#projectSidebarUserEmail"),i=o.querySelector("#projectSidebarUserAvatar");if(s&&(s.textContent=e.display_name||e.username||"User"),a&&(a.textContent=e.email||"No email"),i)if(e.avatar_url){const l=new Image;l.onload=()=>{i.style.backgroundImage=`url(${e.avatar_url})`,i.style.backgroundSize="cover",i.style.backgroundPosition="center",i.textContent=""},l.onerror=()=>{i.style.backgroundImage="",i.textContent=(e.display_name||e.username||"U").charAt(0).toUpperCase()},l.src=e.avatar_url}else i.style.backgroundImage="",i.textContent=(e.display_name||e.username||"U").charAt(0).toUpperCase()}}else console.error("Failed to load user profile:",n.status)}catch(n){console.error("Error loading user profile:",n)}}function N(t){if(!t)return"Recently";const e=Date.now()-new Date(t).getTime(),o=Math.floor(e/6e4),s=Math.floor(e/36e5),a=Math.floor(e/864e5);if(o<1)return"Just now";if(o<60)return`${o}m ago`;if(s<24)return`${s}h ago`;if(a<7)return`${a}d ago`;const i=new Date(t);return i.toLocaleDateString("en-US",{month:"short",day:"numeric",year:i.getFullYear()!==new Date().getFullYear()?"numeric":void 0})}function ye(t){return t?new Date(t).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit",hour12:!0,timeZone:"Asia/Kathmandu"}):"Unknown"}function ge(t){if(!t||t==="No ports")return"No ports";const n=new Set;return t.split(",").forEach(o=>{const s=o.match(/(\d+)->(\d+)/);if(s){const a=s[1],i=s[2];n.add(`${a}:${i}`)}}),n.size===0?t:Array.from(n).sort().join(", ")}async function D(){await _();try{const t=await fetch("/deployments",{headers:j()});if(t.ok){const n=await t.json();document.getElementById("totalDeployments").textContent=n.length,document.getElementById("runningApps").textContent=n.filter(o=>o.status==="success").length;const e=document.getElementById("recentActivity");n.length>0?e.innerHTML=n.slice(0,5).map(o=>{const s=o.app_name||o.container_name||"Untitled Project";return`
          <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
            <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 0.25rem;">${w(s)}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">
              ${new Date(o.created_at).toLocaleString("en-US",{timeZone:"Asia/Kathmandu"})}
            </div>
          </div>
        `}).join(""):e.innerHTML='<p class="recent-activity-empty">No recent activity</p>'}}catch(t){console.error("Error loading dashboard:",t)}}async function Ge(t){var d,c,p,y;if(t.preventDefault(),!U){u("Please login to deploy applications","error"),window.location.href="/login";return}const n=t.target,e=((d=document.getElementById("deploy-type"))==null?void 0:d.value)||"single",o=(c=document.getElementById("git-url"))==null?void 0:c.value.trim(),s=(p=document.getElementById("frontend-url"))==null?void 0:p.value.trim(),a=(y=document.getElementById("backend-url"))==null?void 0:y.value.trim(),i=document.getElementById("deploy-status"),l=document.getElementById("deploy-success");if(l.style.display="none",i.textContent="",e==="split"){if(!s||!s.startsWith("http")||!a||!a.startsWith("http")){i.textContent="Please enter valid Frontend and Backend repository URLs",i.style.color="var(--error)";return}}else if(!o||!o.startsWith("http")){i.textContent="Please enter a valid Git repository URL",i.style.color="var(--error)";return}i.textContent="🚀 Deploying...",i.style.color="var(--primary)";try{const m=new FormData;e==="split"?(m.append("deploy_type","split"),m.append("frontend_url",s),m.append("backend_url",a)):(m.append("deploy_type","single"),m.append("git_url",o)),typeof r=="object"&&r&&r.id&&m.append("project_id",String(r.id));const g=await fetch("/deploy",{method:"POST",headers:j(),body:m}),v=await g.json();g.ok?(i.textContent="✅ Deployment successful!",i.style.color="var(--success)",v.deployed_url&&(l.style.display="block",document.getElementById("openAppBtn").href=v.deployed_url,document.getElementById("openAppBtn").textContent=`Open ${v.deployed_url}`),n.reset(),r&&r.isSplit?setTimeout(()=>{H(),D()},1500):setTimeout(()=>{D(),R.navigate("/applications")},2e3)):(i.textContent=`❌ Error: ${v.detail||"Deployment failed"}`,i.style.color="var(--error)")}catch{i.textContent="❌ Network error. Please try again.",i.style.color="var(--error)"}}async function le(t,n=null,e=null,o=!1){const s=document.getElementById("deploy-status"),a=document.getElementById("deploy-success");if(!U)return u("Please login to deploy applications","error"),window.location.href="/login",o?{success:!1,error:"Not authenticated"}:void 0;e||(a&&(a.style.display="none"),s&&(s.textContent="",s.style.color="var(--primary)"));try{const i=new FormData;i.append("deploy_type","single"),i.append("git_url",t),typeof r=="object"&&r&&r.id&&i.append("project_id",String(r.id)),n&&typeof r=="object"&&r&&r.project_type==="split"&&i.append("component_type",n);const l=await fetch("/deploy",{method:"POST",headers:j(),body:i}),d=await l.json();if(l.ok){if(e){const c="success",p=n==="backend"?"Backend complete! ✅":"Frontend complete! ✅";n==="backend"?e.updateBackendStatus(c,p):n==="frontend"&&e.updateFrontendStatus(c,p)}else if(s&&(s.textContent="✅ Deployment successful!",s.style.color="var(--success)"),d.deployed_url&&a){a.style.display="block";const c=document.getElementById("openAppBtn");c&&(c.href=d.deployed_url,c.textContent=`Open ${d.deployed_url}`)}return o?{success:!0,deployed_url:d.deployed_url}:(r&&r.isSplit?setTimeout(()=>{H(),D()},1500):setTimeout(()=>{D(),R.navigate("/applications")},2e3),{success:!0,deployed_url:d.deployed_url})}else{const c=d.detail||"Deployment failed";if(e){const p="failed",y=`Error: ${c}`;n==="backend"?e.updateBackendStatus(p,y):n==="frontend"&&e.updateFrontendStatus(p,y)}else s&&(s.textContent=`❌ Error: ${c}`,s.style.color="var(--error)");if(o)return{success:!1,error:c}}}catch{const l="Network error. Please try again.";if(e){const d="failed",c=l;n==="backend"?e.updateBackendStatus(d,c):n==="frontend"&&e.updateFrontendStatus(d,c)}else s&&(s.textContent=`❌ ${l}`,s.style.color="var(--error)");if(o)return{success:!1,error:l}}}async function ze(){if(!U){document.getElementById("applicationsGrid").innerHTML=`
      <div class="empty-state">
        <p>Please login to view your applications</p>
        <a href="/login" class="btn-primary">Login</a>
      </div>
    `;return}try{const t=await fetch("/deployments",{headers:j()});if(t.ok){const n=await t.json(),e=document.getElementById("applicationsGrid");n.length===0?e.innerHTML=`
          <div class="empty-state">
            <p>No applications deployed yet</p>
            <a href="/deploy" class="btn-primary">Deploy Your First App</a>
          </div>
        `:e.innerHTML=n.map(o=>{const s=o.app_name||o.container_name||"Untitled Project";return`
          <div class="application-card" onclick="window.open('${o.deployed_url||"#"}', '_blank')">
            <h3>${w(s)}</h3>
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
        `}).join("")}}catch(t){console.error("Error loading applications:",t)}}async function te(){if(!U){document.getElementById("historyTableBody").innerHTML=`
      <tr>
        <td colspan="4" class="empty-state">Please login to view deployment history</td>
      </tr>
    `;return}try{const t=await fetch("/deployments",{headers:j()});if(t.ok){const n=await t.json(),e=document.getElementById("historyTableBody");n.length===0?e.innerHTML=`
          <tr>
            <td colspan="4" class="empty-state">No deployment history</td>
          </tr>
        `:e.innerHTML=n.map(o=>{const s=o.app_name||o.container_name||"Untitled Project";return`
          <tr>
            <td><strong>${w(s)}</strong></td>
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
        `}).join("")}}catch(t){console.error("Error loading history:",t)}}async function We(){if(confirm("Are you sure you want to clear all deployment history?"))try{(await fetch("/deployments/clear",{method:"DELETE",headers:j()})).ok&&(u("History cleared successfully","success"),te())}catch{u("Error clearing history","error")}}async function Ke(t){if(confirm(`Are you sure you want to destroy "${t}"?`))try{(await fetch(`/deployments/${t}`,{method:"DELETE",headers:j()})).ok?(u("Deployment destroyed successfully","success"),te(),ze()):u("Error destroying deployment","error")}catch{u("Network error","error")}}let I=[],ce="";async function fe(){const t=document.getElementById("usernameSearch").value.trim();if(!t){u("Please enter a GitHub username","error");return}t!==ce&&(I=[],ce=t);const n=document.getElementById("repositoriesGrid");n.innerHTML='<div class="empty-state"><p>Loading repositories...</p></div>';try{const e=await fetch(`/api/repositories/${t}`),o=await e.json();e.ok&&o.repositories?o.repositories.length===0?n.innerHTML='<div class="empty-state"><p>No repositories found</p></div>':(n.innerHTML=o.repositories.map(s=>`
          <div class="repository-card ${I.some(i=>i.url===s.clone_url)?"selected":""}" data-repo-url="${s.clone_url}" onclick="toggleRepositorySelection('${s.clone_url}', '${s.name}')">
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
        `).join(""),Z()):n.innerHTML=`<div class="empty-state"><p>${o.detail||"Error loading repositories"}</p></div>`}catch{n.innerHTML='<div class="empty-state"><p>Error loading repositories</p></div>'}}function Ye(t,n){const e=I.findIndex(o=>o.url===t);if(e>=0)I.splice(e,1),Z();else{if(I.length>=2){u("You can only select up to 2 repositories for a split repository","error");return}I.push({url:t,name:n}),I.length===2&&Ze(),Z()}}function Ze(){const[t,n]=I,e=document.createElement("div");e.className="modal-overlay",e.id="splitImportModal";const o=document.createElement("div");o.className="modal-content enhanced",o.innerHTML=`
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
        <div class="split-import-repo-name">${w(t.name)}</div>
        <div class="split-import-repo-url">${w(t.url)}</div>
      </div>
      
      <div class="split-import-divider"></div>
      
      <div class="split-import-repo-item">
        <div class="split-import-repo-label">Backend</div>
        <div class="split-import-repo-name">${w(n.name)}</div>
        <div class="split-import-repo-url">${w(n.url)}</div>
      </div>
    </div>
    
    <div class="split-import-actions">
      <button class="cancel-btn">Cancel</button>
      <button class="confirm-btn">Import Split Repository</button>
    </div>
  `,e.appendChild(o),document.body.appendChild(e);const s=o.querySelector(".cancel-btn"),a=o.querySelector(".confirm-btn"),i=()=>{document.body.removeChild(e)};s.onclick=()=>{i()},a.onclick=()=>{i();const[d,c]=I;ve(d.url,c.url,`${d.name}-${c.name}`)},e.onclick=d=>{d.target===e&&i()};const l=d=>{d.key==="Escape"&&(i(),document.removeEventListener("keydown",l))};document.addEventListener("keydown",l),a.focus()}function Z(){const t=document.getElementById("repositoriesGrid");if(!t)return;t.querySelectorAll(".repository-card").forEach(e=>{const o=e.getAttribute("data-repo-url");I.some(a=>a.url===o)?e.classList.add("selected"):e.classList.remove("selected")})}function Je(){if(I.length!==2){u("Please select exactly 2 repositories","error");return}const[t,n]=I;confirm(`Import as Split Repository?

Frontend: ${t.name}
Backend: ${n.name}

Click OK to import these repositories as a split project.`)&&ve(t.url,n.url,`${t.name}-${n.name}`)}async function ve(t,n,e){const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o){u("Please login first","error");return}try{u("Importing split repositories...","info");const s=await fetch("/api/import-split",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${o}`},body:new URLSearchParams({frontend_url:t,backend_url:n,app_name:e})}),a=await s.json();if(s.ok){u("Split repository imported successfully! Navigate to Projects to see it.","success"),I=[];const i=document.getElementById("page-projects");i&&i.style.display!=="none"&&_(),document.getElementById("usernameSearch").value.trim()&&fe()}else u(a.detail||"Failed to import split repository","error")}catch(s){console.error("Error importing split repositories:",s),u("Failed to import split repository: "+s.message,"error")}}function Qe(t){document.getElementById("git-url").value=t,R.navigate("/deploy"),u("Repository selected","success")}async function Xe(t,n){const e=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!e){u("Please login first","error");return}try{u("Importing repository...","info");const o=await fetch("/api/import",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${e}`},body:new URLSearchParams({git_url:t,app_name:n||t.split("/").pop()||"Untitled Project"})}),s=await o.json();if(o.ok){u("Repository imported successfully! Navigate to Projects to see it.","success");const a=document.getElementById("page-projects");a&&a.style.display!=="none"&&_()}else u(s.detail||"Failed to import repository","error")}catch(o){console.error("Error importing repository:",o),u("Failed to import repository: "+o.message,"error")}}function et(){document.getElementById("repositoriesGrid").innerHTML=`
    <div class="empty-state">
      <p>Search for a GitHub username to see their repositories</p>
            </div>
        `}function u(t,n="info"){const e=document.getElementById("toast");e.textContent=t,e.className=`toast show ${n}`,setTimeout(()=>{e.classList.remove("show")},3e3)}let A={},J=[],O=null;async function tt(){const t=document.getElementById("projectSelector");if(t)try{const n=localStorage.getItem("access_token")||localStorage.getItem("authToken"),e=await fetch("/deployments",{headers:{Authorization:`Bearer ${n}`}});if(e.ok){const o=await e.json();t.innerHTML='<option value="">All Projects (Global)</option>',o.forEach(s=>{var i;const a=document.createElement("option");a.value=s.id,a.textContent=s.app_name||((i=s.repository_url)==null?void 0:i.split("/").pop())||`Project ${s.id}`,t.appendChild(a)})}}catch(n){console.error("Error loading projects:",n)}}async function z(){await tt();try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t){const o=document.getElementById("envVarsList");o&&(o.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `),de();return}const n=O?`/api/env-vars?project_id=${O}`:"/api/env-vars",e=await fetch(n,{headers:{Authorization:`Bearer ${t}`}});if(e.ok){const o=await e.json();A=o.variables||{},J=o.vars_list||[],ot()}else if(e.status===401){localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),G();const o=document.getElementById("envVarsList");o&&(o.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `)}else console.error("Failed to load environment variables")}catch(t){console.error("Error loading environment variables:",t)}de()}function de(){const t=document.getElementById("importEnvBtn"),n=document.getElementById("addEnvVarBtn"),e=document.getElementById("importEnvCard"),o=document.getElementById("cancelImportBtn"),s=document.getElementById("importEnvForm"),a=document.getElementById("projectSelector");a&&a.addEventListener("change",async i=>{O=i.target.value?parseInt(i.target.value):null,await z()}),t&&(t.onclick=()=>{e.style.display=e.style.display==="none"?"block":"none"}),o&&(o.onclick=()=>{e.style.display="none",document.getElementById("envFileInput").value=""}),n&&(n.onclick=()=>{st()}),s&&(s.onsubmit=async i=>{i.preventDefault();const d=document.getElementById("envFileInput").files[0];d&&await nt(d)})}async function nt(t){try{const e=(await t.text()).split(`
`),o={};e.forEach(s=>{if(s=s.trim(),s&&!s.startsWith("#")&&s.includes("=")){const[a,...i]=s.split("="),l=i.join("=").trim().replace(/^["']|["']$/g,"");a.trim()&&(o[a.trim()]=l)}}),A={...A,...o},await oe(),document.getElementById("importEnvCard").style.display="none",document.getElementById("envFileInput").value="",u("Environment variables imported successfully!","success")}catch(n){console.error("Error importing .env file:",n),u("Failed to import .env file","error")}}function ot(){const t=document.getElementById("envVarsList");if(t){if(J.length===0){t.innerHTML=`
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
        ${J.map((n,e)=>{const o=n.updated_at?N(new Date(n.updated_at)):"never",s=n.project_id?'<span style="font-size: 0.75rem; background: var(--primary); color: white; padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Project</span>':'<span style="font-size: 0.75rem; background: var(--bg-tertiary); color: var(--text-secondary); padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Global</span>';return`
            <tr>
              <td class="name-col">
                <span class="lock-icon">🔒</span>
                <span class="var-name">${w(n.key)}</span>
                ${s}
              </td>
              <td class="updated-col">
                <span class="updated-time">${o}</span>
              </td>
              <td class="actions-col">
                <button class="icon-btn edit-btn" onclick="editEnvVarModal('${w(n.key)}')" title="Edit">
                  ✏️
                </button>
                <button class="icon-btn delete-btn" onclick="deleteEnvVar('${w(n.key)}')" title="Delete">
                  🗑️
                </button>
              </td>
            </tr>
          `}).join("")}
      </tbody>
    </table>
  `}}function st(){ne()}function ne(t=null,n=""){const e=document.getElementById("envVarModal"),o=document.getElementById("modalVarKey"),s=document.getElementById("modalVarValue"),a=document.getElementById("modalTitle");t?(a.textContent="Update environment variable",o.value=t,o.readOnly=!0,s.value=n):(a.textContent="Add environment variable",o.value="",o.readOnly=!1,s.value=""),e.style.display="flex"}function he(){const t=document.getElementById("envVarModal");t.style.display="none"}async function at(){const t=document.getElementById("modalVarKey"),n=document.getElementById("modalVarValue"),e=t.value.trim(),o=n.value.trim();if(!e){u("Variable name is required","error");return}A[e]=o,await oe(),he()}function we(t){const n=A[t]||"";ne(t,n)}async function it(t){we(t)}async function rt(t){confirm(`Are you sure you want to delete ${t}?`)&&(delete A[t],await oe(),u("Environment variable deleted","success"))}function lt(t){const e=document.querySelectorAll(".env-var-row")[t];if(!e)return;const o=e.querySelector(".env-var-value input");o.type==="password"?o.type="text":o.type="password"}async function oe(){try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");(await fetch("/api/env-vars",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({variables:A,project_id:O})})).ok?(await z(),u("Environment variables saved successfully","success")):(console.error("Failed to save environment variables"),u("Failed to save environment variables","error"))}catch(t){console.error("Error saving environment variables:",t),u("Error saving environment variables","error")}}function ct(){const t=document.getElementById("modalVarValue"),n=document.querySelector('#envVarModal button[onclick*="toggleModalValueVisibility"]');t&&n&&(t.type==="password"?(t.type="text",n.textContent="🙈 Hide"):(t.type="password",n.textContent="👁️ Show"))}function w(t){const n=document.createElement("div");return n.textContent=t,n.innerHTML}async function be(){try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t)return;const n=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${t}`}});if(n.ok){const e=await n.json(),o=document.getElementById("userName"),s=document.getElementById("userEmail"),a=document.getElementById("userAvatar");localStorage.setItem("displayName",e.display_name||""),localStorage.setItem("userEmail",e.email||""),o&&(o.textContent=e.display_name||e.username||"User"),gt(e.display_name||e.username||"User"),s&&(s.textContent=e.email||"Logged in"),a&&(e.avatar_url?(a.style.backgroundImage=`url(${e.avatar_url})`,a.style.backgroundSize="cover",a.style.backgroundPosition="center",a.textContent=""):(a.style.backgroundImage="",a.textContent=(e.display_name||e.username||"U").charAt(0).toUpperCase()))}else n.status===401&&(localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),G())}catch(t){console.error("Error loading user profile:",t)}}async function Ee(){try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken"),n=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${t}`}});if(n.ok){const e=await n.json(),o=document.getElementById("username"),s=document.getElementById("email"),a=document.getElementById("displayName");o&&(o.value=e.username||""),s&&(s.value=e.email||""),a&&(a.value=e.display_name||"");const i=document.getElementById("avatarPreview"),l=document.getElementById("avatarInitial"),d=document.getElementById("removeAvatarBtn");if(e.avatar_url&&i)i.src=e.avatar_url,i.style.display="block",l&&(l.style.display="none"),d&&(d.style.display="block");else if(l){const c=e.display_name&&e.display_name.charAt(0).toUpperCase()||e.username&&e.username.charAt(0).toUpperCase()||"S";l.textContent=c,l.style.display="block"}}}catch(t){console.error("Error loading profile:",t)}dt()}function dt(){const t=document.getElementById("profileForm"),n=document.getElementById("avatarFile"),e=document.getElementById("removeAvatarBtn");t&&t.addEventListener("submit",yt),n&&n.addEventListener("change",ut),e&&e.addEventListener("click",mt);const o=document.getElementById("changePasswordBtn"),s=document.getElementById("closePasswordModal"),a=document.getElementById("cancelPasswordBtn"),i=document.getElementById("updatePasswordBtn"),l=document.getElementById("passwordModal"),d=document.getElementById("modalNewPassword"),c=document.getElementById("strengthFill");o&&o.addEventListener("click",()=>{l&&(l.style.display="flex")}),s&&s.addEventListener("click",()=>{l&&(l.style.display="none")}),a&&a.addEventListener("click",()=>{l&&(l.style.display="none")}),l&&l.addEventListener("click",y=>{y.target===l&&(l.style.display="none")}),d&&d.addEventListener("input",y=>{const m=y.target.value;let g=0;m.length>=8&&(g+=25),/[a-z]/.test(m)&&/[A-Z]/.test(m)&&(g+=25),/\d/.test(m)&&(g+=25),/[!@#$%^&*(),.?":{}|<>]/.test(m)&&(g+=25),c&&(c.style.width=`${g}%`,g<50?c.style.background="#ef4444":g<75?c.style.background="#f59e0b":c.style.background="#10b981")}),i&&i.addEventListener("click",pt);const p=document.getElementById("cancelProfileBtn");p&&p.addEventListener("click",async()=>{await Ee()})}async function pt(){const t=document.getElementById("modalCurrentPassword"),n=document.getElementById("modalNewPassword"),e=document.getElementById("modalConfirmPassword"),o=document.getElementById("passwordModal");if(!t||!n||!e)return;const s=t.value,a=n.value,i=e.value;if(!s||!a||!i){u("Please fill in all password fields","error");return}if(a!==i){u("New passwords do not match","error");return}if(a.length<8){u("Password must be at least 8 characters","error");return}try{const l=localStorage.getItem("access_token")||localStorage.getItem("authToken"),d=new FormData;d.append("current_password",s),d.append("new_password",a);const c=await fetch("/api/user/profile",{method:"PUT",headers:{Authorization:`Bearer ${l}`},body:d}),p=await c.json();if(c.ok){u("Password updated successfully!","success"),o&&(o.style.display="none"),t.value="",n.value="",e.value="";const y=document.getElementById("strengthFill");y&&(y.style.width="0%")}else u(p.detail||p.message||"Failed to update password","error")}catch(l){console.error("Error updating password:",l),u("Network error. Please try again.","error")}}function ut(t){const n=t.target.files[0];if(n){const e=new FileReader;e.onload=o=>{const s=document.getElementById("avatarPreview"),a=document.getElementById("avatarInitial");s&&(s.src=o.target.result,s.style.display="block"),a&&(a.style.display="none");const i=document.getElementById("removeAvatarBtn");i&&(i.style.display="block")},e.readAsDataURL(n)}}function mt(){const t=document.getElementById("avatarPreview"),n=document.getElementById("avatarInitial");t&&(t.src="",t.style.display="none"),n&&(n.style.display="block");const e=document.getElementById("removeAvatarBtn");e&&(e.style.display="none");const o=document.getElementById("avatarFile");o&&(o.value="")}async function yt(t){t.preventDefault();const n=document.getElementById("profileMessage");n&&(n.style.display="none");const e=new FormData,o=document.getElementById("email"),s=document.getElementById("displayName");o&&e.append("email",o.value),s&&e.append("display_name",s.value);const a=document.getElementById("avatarFile");a&&a.files[0]&&e.append("avatar",a.files[0]);const i=document.getElementById("avatarPreview");i&&i.style.display==="none"&&e.append("remove_avatar","true");try{const l=localStorage.getItem("access_token")||localStorage.getItem("authToken"),d=await fetch("/api/user/profile",{method:"PUT",headers:{Authorization:`Bearer ${l}`},body:e}),c=await d.json();if(d.ok)n&&(n.textContent="Profile updated successfully!",n.className="profile-message success",n.style.display="block"),c.username&&localStorage.setItem("username",c.username),await be(),u("Profile updated successfully!","success");else{const p=c.detail||c.message||"Failed to update profile";n&&(n.textContent=p,n.className="profile-message error",n.style.display="block"),u(p,"error"),console.error("Profile update failed:",c)}}catch(l){console.error("Error updating profile:",l),n&&(n.textContent="Network error. Please try again.",n.className="profile-message error",n.style.display="block"),u("Network error. Please try again.","error")}}window.destroyDeployment=Ke;window.selectRepository=Qe;window.importRepository=Xe;window.editEnvVar=it;window.deleteEnvVar=rt;window.toggleEnvVarVisibility=lt;window.saveEnvVarFromModal=at;window.closeEnvVarModal=he;window.toggleModalValueVisibility=ct;window.editEnvVarModal=we;window.showEnvVarModal=ne;window.selectProject=X;window.showProjectSidebar=Y;window.hideProjectSidebar=Fe;window.openProject=Oe;window.loadUserProfileIntoProjectSidebar=me;window.openProjectSite=Ae;window.deleteProject=Be;window.toggleRepositorySelection=Ye;window.confirmSplitImport=Je;window.openProjectNameModal=ue;window.openSite=He;function gt(t){const n=document.getElementById("teamName");n&&(n.textContent=`${t}'s team`),document.querySelectorAll(".project-owner").forEach(o=>{o.textContent=`${t}'s team`})}let C=null,V=!1,$=[];function ft(){const t=document.getElementById("logsContent");t&&(t.innerHTML='<p class="logs-connecting">Connecting to WebSocket...</p>',ke(),vt())}function ke(){C&&C.close();const n=`${window.location.protocol==="https:"?"wss:":"ws:"}//${window.location.host}/ws/logs`;C=new WebSocket(n),C.onopen=()=>{console.log("Logs WebSocket connected"),L("Connected to logs stream","success"),$.length>0&&($.forEach(e=>L(e.message,e.type)),$=[])},C.onmessage=e=>{try{const o=JSON.parse(e.data);V?$.push({message:o.message,type:o.type||"info"}):L(o.message,o.type||"info")}catch(o){console.error("Error parsing log message:",o),L(e.data,"info")}},C.onerror=e=>{console.error("Logs WebSocket error:",e),L("WebSocket connection error","error")},C.onclose=()=>{console.log("Logs WebSocket disconnected"),L("Disconnected from logs stream","warning"),setTimeout(()=>{var e;((e=document.getElementById("page-logs"))==null?void 0:e.style.display)!=="none"&&ke()},3e3)}}function L(t,n="info"){const e=document.getElementById("logsContent");if(!e)return;const o=new Date().toLocaleTimeString("en-US",{timeZone:"Asia/Kathmandu"}),s=document.createElement("div");s.className=`log-entry ${n}`,s.innerHTML=`
    <span class="log-timestamp">[${o}]</span>
    <span class="log-message">${w(t)}</span>
  `,e.appendChild(s),e.scrollTop=e.scrollHeight;const a=1e3,i=e.querySelectorAll(".log-entry");i.length>a&&i[0].remove()}function vt(){const t=document.getElementById("clearLogsBtn"),n=document.getElementById("toggleLogsBtn");t&&t.addEventListener("click",()=>{const e=document.getElementById("logsContent");e&&(e.innerHTML="",$=[],L("Logs cleared","info"))}),n&&n.addEventListener("click",()=>{V=!V,n.textContent=V?"Resume":"Pause",!V&&$.length>0&&($.forEach(e=>L(e.message,e.type)),$=[]),L(V?"Logs paused":"Logs resumed","info")})}window.addEventListener("beforeunload",()=>{C&&C.close()});function ht(){const t=document.getElementById("sidebarSearch"),n=document.getElementById("commandPalette"),e=document.getElementById("commandSearchInput"),o=document.querySelectorAll(".command-item");let s=-1;function a(){n&&(n.style.display="flex",e&&(e.focus(),e.value=""),s=-1,l())}function i(){n&&(n.style.display="none",s=-1)}function l(){const c=Array.from(o).filter(p=>p.style.display!=="none");o.forEach((p,y)=>{c.indexOf(p)===s?(p.classList.add("selected"),p.scrollIntoView({block:"nearest",behavior:"smooth"})):p.classList.remove("selected")})}function d(c){switch(i(),c){case"deploy":case"nav-deploy":window.router&&window.router.navigate("/deploy");break;case"add-env-var":window.showEnvVarModal&&window.showEnvVarModal();break;case"search-repos":case"nav-repositories":window.router&&window.router.navigate("/repositories");break;case"nav-projects":window.router&&window.router.navigate("/");break;case"nav-applications":window.router&&window.router.navigate("/applications");break;case"nav-history":window.router&&window.router.navigate("/history");break;case"nav-env-vars":window.router&&window.router.navigate("/env-vars");break;case"nav-settings":window.router&&window.router.navigate("/settings");break}}document.addEventListener("keydown",c=>{var p;if((c.metaKey||c.ctrlKey)&&c.key==="k"&&(c.preventDefault(),n&&n.style.display==="none"?a():i()),c.key==="Escape"&&n&&n.style.display!=="none"&&i(),n&&n.style.display!=="none"){const y=Array.from(o).filter(m=>m.style.display!=="none");if(c.key==="ArrowDown")c.preventDefault(),s=Math.min(s+1,y.length-1),l();else if(c.key==="ArrowUp")c.preventDefault(),s=Math.max(s-1,-1),l();else if(c.key==="Enter"&&s>=0){c.preventDefault();const g=(p=Array.from(o).filter(v=>v.style.display!=="none")[s])==null?void 0:p.getAttribute("data-action");g&&d(g)}}}),t&&t.addEventListener("click",a),n&&n.addEventListener("click",c=>{c.target===n&&i()}),o.forEach(c=>{c.addEventListener("click",()=>{const p=c.getAttribute("data-action");p&&d(p)})}),e&&e.addEventListener("input",c=>{const p=c.target.value.toLowerCase();o.forEach(y=>{y.querySelector(".command-text").textContent.toLowerCase().includes(p)?y.style.display="flex":y.style.display="none"}),s=-1,l()})}
