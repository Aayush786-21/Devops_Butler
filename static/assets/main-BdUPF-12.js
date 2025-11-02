import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */class ke{constructor(){this.routes={"/":"projects","/deploy":"deploy","/history":"history","/repositories":"repositories","/domain":"domain","/env-vars":"env-vars","/settings":"settings","/logs":"logs"},this.currentPage=null,this.init()}init(){document.querySelectorAll(".nav-item").forEach(n=>{n.addEventListener("click",e=>{e.preventDefault();const o=n.getAttribute("href");this.navigate(o)})}),window.addEventListener("popstate",()=>{this.loadPage(window.location.pathname)}),this.loadPage(window.location.pathname)}navigate(n){window.history.pushState({},"",n),this.loadPage(n)}loadPage(n){const e=this.routes[n]||"dashboard";if(e==="deploy"){r=null;const o=document.getElementById("projectSidebar");o&&(o.style.display="none");const s=document.getElementById("sidebar");s&&(s.style.display="block")}this.showPage(e),this.updateActiveNav(n),this.updatePageTitle(e),window.scrollTo({top:0,behavior:"smooth"})}showPage(n){document.querySelectorAll(".page").forEach(o=>{o.style.display="none"});const e=document.getElementById(`page-${n}`);if(e)e.style.display="block";else{const o=document.getElementById("page-dashboard");o&&(o.style.display="block")}this.currentPage=n,this.loadPageData(n)}updateActiveNav(n){document.querySelectorAll(".nav-item").forEach(e=>{e.classList.remove("active"),e.getAttribute("href")===n&&e.classList.add("active")})}updatePageTitle(n){const e={projects:"Projects",deploy:"Deploy",history:"History",repositories:"Repositories",domain:"Domain","env-vars":"Environmental Variables",settings:"Settings",logs:"Logs"};document.getElementById("pageTitle").textContent=e[n]||"Dashboard"}loadPageData(n){switch(n){case"projects":x();break;case"history":te();break;case"repositories":Xe();break;case"domain":Te();break;case"env-vars":z();break;case"settings":ct();break;case"logs":be();break}}}const R=new ke;window.router=R;async function Ie(t){const n=await je();if(!n)return;const e=b.find(a=>a.id==t),o=e?e.name:"this project";if(await Be(o))try{console.log("Deleting project with token:",n.substring(0,20)+"...");const a=await fetch(`/projects/${t}`,{method:"DELETE",headers:{Authorization:`Bearer ${n}`}});if(console.log("Delete response status:",a.status),!a.ok){const i=await a.json().catch(()=>({}));if(console.error("Delete error response:",i),a.status===401){u("Session expired. Please login again.","error"),localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),setTimeout(()=>{window.location.href="/login"},2e3);return}throw new Error(i.detail||"Failed to delete project")}b=b.filter(i=>i.id!=t),_=_.filter(i=>i.id!=t),T(_),u("Project deleted","success")}catch(a){console.error("Delete project error:",a),u(`Delete failed: ${a.message}`,"error")}}function Be(t){return new Promise(n=>{const e=document.createElement("div");e.className="modal-overlay";const o=document.createElement("div");o.className="delete-confirmation-modal",o.innerHTML=`
      <h3>Delete Project</h3>
      <p>
        Are you sure you want to delete <strong>${h(t)}</strong>?<br>
        This will stop and remove its container and image.
      </p>
      <div class="delete-confirmation-actions">
        <button class="cancel-btn">Cancel</button>
        <button class="delete-btn">Delete</button>
      </div>
    `,e.appendChild(o),document.body.appendChild(e);const s=o.querySelector(".cancel-btn"),a=o.querySelector(".delete-btn"),i=()=>{document.body.removeChild(e)};s.onclick=()=>{i(),n(!1)},a.onclick=()=>{i(),n(!0)},e.onclick=c=>{c.target===e&&(i(),n(!1))},a.focus()})}function Se(t){try{const e=JSON.parse(atob(t.split(".")[1])).exp*1e3,o=Date.now();return e<o+5*60*1e3}catch{return!0}}async function je(){const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");return!t||Se(t)?(u("Session expired. Please login again.","error"),localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),setTimeout(()=>{window.location.href="/login"},2e3),null):t}let A=localStorage.getItem("access_token")||localStorage.getItem("authToken"),Q=localStorage.getItem("username");document.addEventListener("DOMContentLoaded",()=>{G(),window.location.pathname==="/login"||window.location.pathname.includes("login.html")||setTimeout(()=>{if(A&&Q){Ce(),vt();const n=document.getElementById("page-projects");n&&window.location.pathname==="/"&&(n.style.display="block")}},100)});function G(){const t=document.getElementById("userSection"),n=document.getElementById("authButtons"),e=document.getElementById("logoutBtn"),o=document.getElementById("newDeployBtn");document.getElementById("userName"),document.getElementById("userEmail"),document.getElementById("userAvatar");const s=window.location.pathname==="/login"||window.location.pathname.includes("login.html");A&&Q?(t.style.display="flex",n.style.display="none",e.style.display="block",o.style.display="block",we(),x(),s&&(window.location.href="/")):(t.style.display="none",n.style.display="block",e.style.display="none",o.style.display="none",s||(window.location.href="/login"))}function Ce(){var a,i;document.getElementById("logoutBtn").addEventListener("click",()=>{localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),A=null,Q=null,G(),u("Logged out successfully","success"),R.navigate("/")});const t=document.getElementById("projectsSearch");t&&t.addEventListener("input",c=>{const d=c.target.value.toLowerCase();_=b.filter(l=>l.name.toLowerCase().includes(d)||l.repository&&l.repository.toLowerCase().includes(d)),T(_)});const n=document.getElementById("addProjectBtn");n&&n.addEventListener("click",()=>{window.router&&window.router.navigate("/deploy")});const e=document.getElementById("browseUploadLink");e&&e.addEventListener("click",c=>{c.preventDefault(),window.router&&window.router.navigate("/deploy")}),document.getElementById("newDeployBtn").addEventListener("click",()=>{r=null;const c=document.getElementById("projectSidebar");c&&(c.style.display="none");const d=document.getElementById("sidebar");d&&(d.style.display="block"),R.navigate("/deploy")});const o=document.getElementById("deployForm");o&&o.addEventListener("submit",Oe);const s=document.getElementById("deploy-type");s&&s.addEventListener("change",c=>{const d=document.getElementById("single-repo-group"),l=document.getElementById("split-repo-group"),p=document.getElementById("git-url");c.target.value==="split"?(d.style.display="none",l.style.display="block",p&&p.removeAttribute("required")):(d.style.display="block",l.style.display="none",p&&p.setAttribute("required","required"))}),(a=document.getElementById("clearHistoryBtn"))==null||a.addEventListener("click",ze),(i=document.getElementById("searchReposBtn"))==null||i.addEventListener("click",ge),Le()}function Le(){const t=document.querySelector(".search-input"),n=document.getElementById("spotlightModal"),e=document.getElementById("spotlightSearch"),o=document.getElementById("spotlightResults");!t||!n||!e||!o||(t.addEventListener("click",_e),n.addEventListener("click",s=>{s.target===n&&K()}),e.addEventListener("input",xe),o.addEventListener("click",Ne),document.addEventListener("keydown",s=>{s.key==="Escape"&&n.style.display!=="none"&&K()}))}function _e(){const t=document.getElementById("spotlightModal"),n=document.getElementById("spotlightSearch");t.style.display="flex",setTimeout(()=>{n.focus()},100)}function K(){const t=document.getElementById("spotlightModal"),n=document.getElementById("spotlightSearch"),e=document.getElementById("spotlightResults");t.style.display="none",n.value="",e.innerHTML=`
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
    `;return}const o=Pe(n);$e(o)}function Pe(t){const n={projects:[],actions:[],navigation:[]};b&&b.length>0&&(n.projects=b.filter(s=>s.name.toLowerCase().includes(t)||s.repository&&s.repository.toLowerCase().includes(t)));const e=[{name:"New Deploy",action:"new-deploy",icon:"🚀"},{name:"Repositories",action:"repositories",icon:"📁"},{name:"History",action:"history",icon:"📜"},{name:"Settings",action:"settings",icon:"⚙️"},{name:"Domain",action:"domain",icon:"🌐"}];n.actions=e.filter(s=>s.name.toLowerCase().includes(t));const o=[{name:"Projects",action:"projects",icon:"📊"},{name:"Repositories",action:"repositories",icon:"📁"},{name:"History",action:"history",icon:"📜"},{name:"Domain",action:"domain",icon:"🌐"},{name:"Settings",action:"settings",icon:"⚙️"}];return n.navigation=o.filter(s=>s.name.toLowerCase().includes(t)),n}function $e(t){const n=document.getElementById("spotlightResults");let e='<div class="search-results">';t.projects.length>0&&(e+='<div class="search-category">',e+='<div class="search-category-title">Projects</div>',t.projects.forEach(o=>{const s=o.status==="running"?"🚀":"📦",a=o.status==="running"?"RUNNING":o.status==="failed"?"FAILED":"IMPORTED";e+=`
        <div class="search-result-item" data-type="project" data-id="${o.id}">
          <span class="search-result-icon">${s}</span>
          <div class="search-result-content">
            <div class="search-result-title">${h(o.name)}</div>
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
        <p>No results found for "${h(document.getElementById("spotlightSearch").value)}"</p>
      </div>
    `),e+="</div>",n.innerHTML=e}function Ne(t){const n=t.target.closest(".suggestion-item, .search-result-item");if(!n)return;const e=n.dataset.action,o=n.dataset.type,s=n.dataset.id;if(K(),o==="project"&&s)X(parseInt(s));else if(e)switch(e){case"new-deploy":window.router&&window.router.navigate("/deploy");break;case"repositories":window.router&&window.router.navigate("/repositories");break;case"history":window.router&&window.router.navigate("/history");break;case"domain":window.router&&window.router.navigate("/domain");break;case"settings":window.router&&window.router.navigate("/settings");break;case"projects":window.router&&window.router.navigate("/projects");break}}function Te(){document.getElementById("page-domain")}function j(){const t={},n=localStorage.getItem("access_token")||localStorage.getItem("authToken");return n&&(t.Authorization=`Bearer ${n}`),t}let b=[],_=[];async function x(){const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t){T([]);return}Ue();try{const n=await fetch("/deployments",{headers:{Authorization:`Bearer ${t}`}});n.ok?(b=(await n.json()).map(o=>{var E;const s=o.git_url||"",a=s,i=s?(E=String(s).split("/").pop())==null?void 0:E.replace(/\.git$/,""):null,c=o.app_name||i||o.container_name||"Untitled Project",d=(o.status||"").toLowerCase();let l;d==="running"?l="running":d==="failed"||d==="error"?l="failed":l="imported";let p=!1,y="single",m=null,v=null;const f=String(o.git_url||""),M=f.startsWith("split::"),B=!o.parent_project_id&&!o.component_type;if(M){p=!0,y="split";try{const I=f.replace("split::","").split("|");I.length===2&&(m=I[0],v=I[1])}catch{}}else if(d==="imported_split")p=!0,y="split";else if(B&&f.includes("|")){p=!0,y="split";try{const I=f.split("|");I.length===2&&(m=I[0],v=I[1])}catch{}}return{id:o.id,name:c,status:l,url:o.deployed_url||o.app_url,createdAt:o.created_at,updatedAt:o.updated_at,repository:a,repository_url:a,git_url:s,project_type:y,isSplit:p,frontend_url:m,backend_url:v,containerUptime:o.container_uptime||"Unknown",containerPorts:o.container_ports||"No ports",containerImage:o.container_image||"Unknown",containerStatus:o.container_status||"Unknown",isRunning:o.is_running||!1}}),_=[...b],T(_)):T([])}catch(n){console.error("Error loading projects:",n),T([])}}function T(t){const n=document.getElementById("projectsGrid");if(n){if(t.length===0){n.innerHTML=`
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
          <h3 class="project-name">${h(e.name)}</h3>
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
      `}).join("")}}async function De(t){try{const n=b.find(e=>e.id===t);if(!n){u("Project not found","error");return}if(!n.url||n.url==="#"){u("Project URL not available. Make sure the project is deployed.","error");return}window.open(n.url,"_blank"),u(`Opening ${n.name}...`,"info")}catch(n){console.error("Error opening project site:",n),u("Failed to open project site: "+n.message,"error")}}function Ue(){const t=document.getElementById("projectsGrid");t&&(t.innerHTML=`
    <div class="loading-skeleton">
      ${Array(3).fill(`
        <div class="skeleton-card">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line short"></div>
        </div>
      `).join("")}
    </div>
  `)}let r=null;function X(t){x().then(()=>{const e=b.find(o=>o.id==t);if(!e){const o=_.find(s=>s.id==t);o&&(r=o,Y(o));return}r=e,Y(e)});const n=document.getElementById("page-project-config");n&&n.style.display!=="none"&&ee()}function Y(t){const n=document.getElementById("sidebar");n&&(n.style.display="none");let e=document.getElementById("projectSidebar");e||(e=Ae(),document.body.appendChild(e));const o=e.querySelector("#projectSidebarName");o&&(o.textContent=t.name);const s=e.querySelector("#projectSidebarId");s&&(s.textContent=t.id);const a=e.querySelector('a[data-project-page="status"]');a&&(t.project_type==="split"?a.style.display="flex":a.style.display="none"),e.style.display="block",document.getElementById("pageTitle").textContent=t.name,ue(),de("deploy")}function Ae(){const t=document.createElement("aside");return t.id="projectSidebar",t.className="sidebar project-sidebar",t.innerHTML=`
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
  `,t.querySelectorAll(".project-nav-item").forEach(n=>{n.addEventListener("click",async e=>{e.preventDefault();const o=n.getAttribute("data-project-page");if(await x(),r){const s=b.find(a=>a.id===r.id);s&&(r=s)}de(o),t.querySelectorAll(".project-nav-item").forEach(s=>s.classList.remove("active")),n.classList.add("active")})}),t}function Me(){const t=document.getElementById("projectSidebar");t&&(t.style.display="none");const n=document.getElementById("sidebar");n&&(n.style.display="block"),r=null,document.getElementById("pageTitle").textContent="Projects",document.querySelectorAll(".page").forEach(o=>{o.style.display="none"});const e=document.getElementById("page-projects");e&&(e.style.display="block"),x()}function de(t){var n;switch(document.querySelectorAll(".page").forEach(e=>{e.style.display="none"}),t){case"deploy":const e=document.getElementById("page-deploy");if(e){e.style.display="block";const a=(n=e.querySelector(".card h2"))==null?void 0:n.closest(".card");if(r){a&&(a.style.display="block");const E=document.getElementById("project-components-section");r!=null&&r.project_type||r!=null&&r.isSplit,E&&(E.style.display="none")}else{a&&(a.style.display="block");const E=document.getElementById("project-components-section");E&&(E.style.display="none")}document.getElementById("deploy-type");const i=document.getElementById("deploy-type-group"),c=document.getElementById("single-repo-group"),d=document.getElementById("split-repo-group"),l=document.getElementById("split-deploy-layout"),p=document.getElementById("git-url"),y=document.getElementById("frontend-url"),m=document.getElementById("backend-url"),v=document.getElementById("deploy-submit-default");e.querySelectorAll(".dynamic-split-btn").forEach(E=>E.remove());let f=r==null?void 0:r.project_type;const M=(r==null?void 0:r.git_url)||(r==null?void 0:r.repository_url)||"",B=M.startsWith("split::");if(f||(r!=null&&r.isSplit||B?f="split":f="single"),B&&f!=="split"?(console.warn("Project type mismatch detected. git_url indicates split but project_type is",f),f="split"):!B&&f==="split"&&M&&(console.warn("Project type mismatch detected. git_url indicates single but project_type is split"),f="single"),r)if(i&&(i.style.display="none"),f==="split"){c&&(c.style.display="none"),d&&(d.style.display="none"),l&&(l.style.display="block"),y&&(y.value=r.frontend_url||""),m&&(m.value=r.backend_url||""),p&&p.removeAttribute("required"),v&&(v.style.display="none");const E=document.getElementById("deploy-frontend-btn"),I=document.getElementById("deploy-backend-btn"),se=document.getElementById("deploy-both-btn");E&&(E.onclick=async()=>{var P;const S=(P=y==null?void 0:y.value)==null?void 0:P.trim();if(!S||!S.startsWith("http"))return u("Enter a valid frontend URL","error");const w=W(!1);document.getElementById("step-frontend").style.display="flex",w.updateFrontendStatus("deploying","Deploying your frontend now...");const g=await re(S,"frontend",w,!0);g&&g.success&&g.deployed_url?(w.showUrls(g.deployed_url,null),document.getElementById("close-deployment-dialog").onclick=()=>{w.close(),H(),D()}):g&&!g.success&&setTimeout(()=>w.close(),3e3)}),I&&(I.onclick=async()=>{var P;const S=(P=m==null?void 0:m.value)==null?void 0:P.trim();if(!S||!S.startsWith("http"))return u("Enter a valid backend URL","error");const w=W(!1);document.getElementById("step-backend").style.display="flex",w.updateBackendStatus("deploying","Deploying your backend now...");const g=await re(S,"backend",w,!0);g&&g.success&&g.deployed_url?(w.showUrls(null,g.deployed_url),document.getElementById("close-deployment-dialog").onclick=()=>{w.close(),H(),D()}):g&&!g.success&&setTimeout(()=>w.close(),3e3)}),se&&(se.onclick=async()=>{var P,ae;const S=(P=y==null?void 0:y.value)==null?void 0:P.trim(),w=(ae=m==null?void 0:m.value)==null?void 0:ae.trim();if(!S||!S.startsWith("http")||!w||!w.startsWith("http")){u("Please enter valid Frontend and Backend repository URLs","error");return}const g=W(!0);document.getElementById("step-backend").style.display="flex",document.getElementById("step-frontend").style.display="flex",g.updateBackendStatus("deploying","Deploying your backend now...");try{const F=new FormData;F.append("deploy_type","split"),F.append("frontend_url",S),F.append("backend_url",w),r&&r.id&&F.append("project_id",String(r.id));const ie=await fetch("/deploy",{method:"POST",headers:j(),body:F}),q=await ie.json();ie.ok&&q.deployed_url?(g.updateBackendStatus("success","Backend deployed! ✅"),g.updateFrontendStatus("success","Frontend deployed! ✅"),g.showUrls(q.deployed_url,null),document.getElementById("close-deployment-dialog").onclick=()=>{g.close(),x(),H(),D()},u("Split deployment successful!","success")):(g.updateBackendStatus("failed",q.detail||"Deployment failed"),g.updateFrontendStatus("failed","Could not deploy"),u(q.detail||"Deployment failed","error"),setTimeout(()=>g.close(),3e3))}catch{g.updateBackendStatus("failed","Network error"),g.updateFrontendStatus("failed","Network error"),u("Network error during deployment","error"),setTimeout(()=>g.close(),3e3)}}),v&&(v.style.display="none")}else f==="single"&&(c&&(c.style.display="block"),d&&(d.style.display="none"),l&&(l.style.display="none"),p&&r&&r.repository_url&&(p.value=r.repository_url),v&&(v.textContent="🚀 Deploy",v.style.display=""));else i&&(i.style.display=""),d&&(d.style.display="none"),l&&(l.style.display="none"),c&&(c.style.display="block"),p&&(p.value=""),v&&(v.textContent="🚀 Deploy",v.style.display="")}document.getElementById("pageTitle").textContent="Deploy";break;case"status":Ve();break;case"configuration":Fe();break;case"logs":const o=document.getElementById("page-logs");o&&(o.style.display="block",be());break;case"domain-config":He();break;case"env-vars":const s=document.getElementById("page-env-vars");s&&(s.style.display="block",z());break}}async function Fe(){let t=document.getElementById("page-project-config");t||(t=document.createElement("div"),t.id="page-project-config",t.className="page",t.innerHTML=`
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
              <span class="config-value-text" id="projectConfigCreated">${r!=null&&r.createdAt?me(r.createdAt):"Unknown"}</span>
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
              <span class="config-value-text" id="projectConfigPorts">${r!=null&&r.containerPorts?ye(r.containerPorts):"No ports"}</span>
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
    `,document.getElementById("pageContent").appendChild(t));const n=document.getElementById("project-components-section");n&&(n.style.display="none"),ee();const e=document.getElementById("changeProjectNameBtn");e&&(e.onclick=()=>pe()),t.style.display="block"}async function Ve(){document.querySelectorAll(".page").forEach(n=>n.style.display="none");let t=document.getElementById("page-status");if(t||(t=document.createElement("div"),t.id="page-status",t.className="page",document.getElementById("pageContent").appendChild(t)),t.innerHTML="",r&&r.id)try{const n=await fetch(`/projects/${r.id}/components`,{headers:j()});if(n.ok){const o=(await n.json()).components||[],s=o.find(p=>p.component_type==="frontend"),a=o.find(p=>p.component_type==="backend"),i=s?s.status==="running"?"RUNNING":s.status.toUpperCase():"NOT DEPLOYED",c=a?a.status==="running"?"RUNNING":a.status.toUpperCase():"NOT DEPLOYED",d=(s==null?void 0:s.status)==="running"?"status-success":(s==null?void 0:s.status)==="failed"?"status-error":"status-info",l=(a==null?void 0:a.status)==="running"?"status-success":(a==null?void 0:a.status)==="failed"?"status-error":"status-info";t.innerHTML=`
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
      `}t.style.display="block",document.getElementById("pageTitle").textContent="Status"}async function H(){if(!(!r||!r.id))try{const t=await fetch(`/projects/${r.id}/components`,{headers:j()});if(!t.ok)return;const e=(await t.json()).components||[],o=e.find(m=>m.component_type==="frontend"),s=e.find(m=>m.component_type==="backend"),a=o&&o.status&&o.status!=="imported"&&o.status!=="imported_split",i=s&&s.status&&s.status!=="imported"&&s.status!=="imported_split",c=a&&i;let d=document.getElementById("project-components-section");const l=document.getElementById("page-deploy"),p=document.getElementById("page-project-config"),y=p==null?void 0:p.querySelector("#project-components-section");if(y&&y.remove(),c&&l&&l.style.display!=="none"){if(!d){d=document.createElement("div"),d.id="project-components-section",d.className="card project-components-card";const B=l.querySelector(".card");B?l.insertBefore(d,B):l.appendChild(d)}d.style.display="block";const m=o?o.status==="running"?"RUNNING":o.status.toUpperCase():"NOT DEPLOYED",v=s?s.status==="running"?"RUNNING":s.status.toUpperCase():"NOT DEPLOYED",f=(o==null?void 0:o.status)==="running"?"status-success":(o==null?void 0:o.status)==="failed"?"status-error":"status-info",M=(s==null?void 0:s.status)==="running"?"status-success":(s==null?void 0:s.status)==="failed"?"status-error":"status-info";d.innerHTML=`
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
            <div class="project-status ${M}">${v}</div>
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
    `,requestAnimationFrame(()=>{d.classList.add("components-visible");const B=l.querySelector(".card:not(#project-components-section)");B&&B.classList.add("deploy-card-slide-down")})}else if(d){d.style.display="none",d.classList.remove("components-visible");const m=l==null?void 0:l.querySelector(".card:not(#project-components-section)");m&&m.classList.remove("deploy-card-slide-down")}}catch(t){console.error("Error loading project components:",t)}}function Re(t){t&&window.open(t,"_blank")}function W(t=!0){const n=document.createElement("div");n.className="modal-overlay deployment-progress-overlay",n.id="deploymentProgressOverlay";const e=document.createElement("div");return e.className="deployment-progress-modal",e.innerHTML=`
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
  `,n.appendChild(e),document.body.appendChild(n),{overlay:n,updateBackendStatus:(o,s)=>{const a=document.getElementById("step-backend"),i=a.querySelector(".step-icon"),c=document.getElementById("backend-status"),d=document.getElementById("backend-message");d.textContent=s,o==="deploying"?(i.textContent="⏳",c.textContent="",a.classList.remove("completed","failed"),a.classList.add("active")):o==="success"?(i.textContent="✅",c.textContent="✓",a.classList.remove("active","failed"),a.classList.add("completed")):o==="failed"&&(i.textContent="❌",c.textContent="✗",a.classList.remove("active","completed"),a.classList.add("failed"))},updateFrontendStatus:(o,s)=>{const a=document.getElementById("step-frontend"),i=a.querySelector(".step-icon"),c=document.getElementById("frontend-status"),d=document.getElementById("frontend-message");d.textContent=s,o==="deploying"?(i.textContent="⏳",c.textContent="",a.classList.remove("completed","failed"),a.classList.add("active")):o==="success"?(i.textContent="✅",c.textContent="✓",a.classList.remove("active","failed"),a.classList.add("completed")):o==="failed"&&(i.textContent="❌",c.textContent="✗",a.classList.remove("active","completed"),a.classList.add("failed"))},showUrls:(o,s)=>{const a=document.getElementById("deployment-urls"),i=document.getElementById("frontend-url-link"),c=document.getElementById("backend-url-link"),d=document.getElementById("close-deployment-dialog");o?(i.href=o,i.textContent=o,i.closest(".url-item").style.display="flex"):i.closest(".url-item").style.display="none",s?(c.href=s,c.textContent=s,c.closest(".url-item").style.display="flex"):c.closest(".url-item").style.display="none",a.style.display="block",d.style.display="block"},close:()=>{const o=document.getElementById("deploymentProgressOverlay");o&&document.body.removeChild(o)}}}function pe(){if(!r){u("No project selected","error");return}const t=document.createElement("div");t.className="modal-overlay";const n=document.createElement("div");n.className="modal-content enhanced",n.innerHTML=`
    <div class="project-name-modal-header">
      <h2 class="project-name-modal-title">Change Project Name</h2>
      <p class="project-name-modal-subtitle">
        Update the name for <strong>${h(r.name)}</strong>
      </p>
    </div>
    
    <div class="project-name-modal-form-group">
      <label class="project-name-modal-label">Project Name</label>
      <input 
        type="text" 
        id="newProjectNameInput"
        class="project-name-modal-input"
        value="${h(r.name)}"
        placeholder="Enter new project name"
      />
    </div>
    
    <div class="project-name-modal-actions">
      <button class="cancel-name-btn">Cancel</button>
      <button class="save-name-btn">Save Changes</button>
    </div>
  `,t.appendChild(n),document.body.appendChild(t);const e=document.getElementById("newProjectNameInput");e&&(e.focus(),e.select());const o=n.querySelector(".cancel-name-btn"),s=n.querySelector(".save-name-btn"),a=()=>{document.body.removeChild(t)};o.onclick=()=>{a()},s.onclick=async()=>{const c=e.value.trim();if(!c){u("Project name cannot be empty","error");return}if(c===r.name){a();return}try{const d=localStorage.getItem("access_token")||localStorage.getItem("authToken"),l=await fetch(`/projects/${r.id}/name`,{method:"PUT",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${d}`},body:new URLSearchParams({app_name:c})}),p=await l.json();if(l.ok){u("Project name updated successfully!","success"),r.name=c,a();const y=b.findIndex(v=>v.id===r.id);y>=0&&(b[y].name=c),ee(),T(_);const m=document.getElementById("projectSidebarName");m&&(m.textContent=c),document.getElementById("pageTitle").textContent=c}else u(p.detail||"Failed to update project name","error")}catch(d){console.error("Error updating project name:",d),u("Failed to update project name: "+d.message,"error")}},t.onclick=c=>{c.target===t&&a()};const i=c=>{c.key==="Escape"&&(a(),document.removeEventListener("keydown",i))};document.addEventListener("keydown",i)}function ee(){if(!r)return;const t=document.getElementById("projectConfigName"),n=document.getElementById("projectConfigOwner"),e=document.getElementById("projectConfigId"),o=document.getElementById("projectConfigCreated"),s=document.getElementById("projectConfigUpdated"),a=document.getElementById("projectConfigPorts"),i=document.getElementById("projectConfigImage"),c=document.getElementById("projectConfigStatus");if(t&&(t.textContent=r.name||"Unknown"),n){const d=localStorage.getItem("username"),l=localStorage.getItem("displayName");n.textContent=l||d||"Unknown User"}e&&(e.textContent=r.id||"-"),o&&(o.textContent=r.createdAt?me(r.createdAt):"Unknown"),s&&(s.textContent=r.updatedAt?N(new Date(r.updatedAt)):"Unknown"),a&&(a.textContent=r.containerPorts?ye(r.containerPorts):"No ports"),i&&(i.textContent=r.containerImage||"Unknown"),c&&(c.textContent=r.containerStatus||"Unknown")}function He(){let t=document.getElementById("page-project-domain");t||(t=document.createElement("div"),t.id="page-project-domain",t.className="page",t.innerHTML=`
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
    `,document.getElementById("pageContent").appendChild(t)),t.style.display="block"}function qe(t){X(t)}async function ue(){const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t){console.log("No auth token found");return}try{const n=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${t}`}});if(n.ok){const e=await n.json(),o=document.getElementById("projectSidebar");if(o){const s=o.querySelector("#projectSidebarUserName"),a=o.querySelector("#projectSidebarUserEmail"),i=o.querySelector("#projectSidebarUserAvatar");if(s&&(s.textContent=e.display_name||e.username||"User"),a&&(a.textContent=e.email||"No email"),i)if(e.avatar_url){const c=new Image;c.onload=()=>{i.style.backgroundImage=`url(${e.avatar_url})`,i.style.backgroundSize="cover",i.style.backgroundPosition="center",i.textContent=""},c.onerror=()=>{i.style.backgroundImage="",i.textContent=(e.display_name||e.username||"U").charAt(0).toUpperCase()},c.src=e.avatar_url}else i.style.backgroundImage="",i.textContent=(e.display_name||e.username||"U").charAt(0).toUpperCase()}}else console.error("Failed to load user profile:",n.status)}catch(n){console.error("Error loading user profile:",n)}}function N(t){if(!t)return"Recently";const e=Date.now()-new Date(t).getTime(),o=Math.floor(e/6e4),s=Math.floor(e/36e5),a=Math.floor(e/864e5);if(o<1)return"Just now";if(o<60)return`${o}m ago`;if(s<24)return`${s}h ago`;if(a<7)return`${a}d ago`;const i=new Date(t);return i.toLocaleDateString("en-US",{month:"short",day:"numeric",year:i.getFullYear()!==new Date().getFullYear()?"numeric":void 0})}function me(t){return t?new Date(t).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit",hour12:!0,timeZone:"Asia/Kathmandu"}):"Unknown"}function ye(t){if(!t||t==="No ports")return"No ports";const n=new Set;return t.split(",").forEach(o=>{const s=o.match(/(\d+)->(\d+)/);if(s){const a=s[1],i=s[2];n.add(`${a}:${i}`)}}),n.size===0?t:Array.from(n).sort().join(", ")}async function D(){await x();try{const t=await fetch("/deployments",{headers:j()});if(t.ok){const n=await t.json();document.getElementById("totalDeployments").textContent=n.length,document.getElementById("runningApps").textContent=n.filter(o=>o.status==="success").length;const e=document.getElementById("recentActivity");n.length>0?e.innerHTML=n.slice(0,5).map(o=>{const s=o.app_name||o.container_name||"Untitled Project";return`
          <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
            <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 0.25rem;">${h(s)}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">
              ${new Date(o.created_at).toLocaleString("en-US",{timeZone:"Asia/Kathmandu"})}
            </div>
          </div>
        `}).join(""):e.innerHTML='<p class="recent-activity-empty">No recent activity</p>'}}catch(t){console.error("Error loading dashboard:",t)}}async function Oe(t){var d,l,p,y;if(t.preventDefault(),!A){u("Please login to deploy applications","error"),window.location.href="/login";return}const n=t.target,e=((d=document.getElementById("deploy-type"))==null?void 0:d.value)||"single",o=(l=document.getElementById("git-url"))==null?void 0:l.value.trim(),s=(p=document.getElementById("frontend-url"))==null?void 0:p.value.trim(),a=(y=document.getElementById("backend-url"))==null?void 0:y.value.trim(),i=document.getElementById("deploy-status"),c=document.getElementById("deploy-success");if(c.style.display="none",i.textContent="",e==="split"){if(!s||!s.startsWith("http")||!a||!a.startsWith("http")){i.textContent="Please enter valid Frontend and Backend repository URLs",i.style.color="var(--error)";return}}else if(!o||!o.startsWith("http")){i.textContent="Please enter a valid Git repository URL",i.style.color="var(--error)";return}i.textContent="🚀 Deploying...",i.style.color="var(--primary)";try{const m=new FormData;e==="split"?(m.append("deploy_type","split"),m.append("frontend_url",s),m.append("backend_url",a)):(m.append("deploy_type","single"),m.append("git_url",o)),typeof r=="object"&&r&&r.id&&m.append("project_id",String(r.id));const v=await fetch("/deploy",{method:"POST",headers:j(),body:m}),f=await v.json();v.ok?(i.textContent="✅ Deployment successful!",i.style.color="var(--success)",f.deployed_url&&(c.style.display="block",document.getElementById("openAppBtn").href=f.deployed_url,document.getElementById("openAppBtn").textContent=`Open ${f.deployed_url}`),n.reset(),r&&r.isSplit?setTimeout(()=>{H(),D()},1500):setTimeout(()=>{D(),R.navigate("/applications")},2e3)):(i.textContent=`❌ Error: ${f.detail||"Deployment failed"}`,i.style.color="var(--error)")}catch{i.textContent="❌ Network error. Please try again.",i.style.color="var(--error)"}}async function re(t,n=null,e=null,o=!1){const s=document.getElementById("deploy-status"),a=document.getElementById("deploy-success");if(!A)return u("Please login to deploy applications","error"),window.location.href="/login",o?{success:!1,error:"Not authenticated"}:void 0;e||(a&&(a.style.display="none"),s&&(s.textContent="",s.style.color="var(--primary)"));try{const i=new FormData;i.append("deploy_type","single"),i.append("git_url",t),typeof r=="object"&&r&&r.id&&i.append("project_id",String(r.id)),n&&typeof r=="object"&&r&&r.project_type==="split"&&i.append("component_type",n);const c=await fetch("/deploy",{method:"POST",headers:j(),body:i}),d=await c.json();if(c.ok){if(e){const l="success",p=n==="backend"?"Backend complete! ✅":"Frontend complete! ✅";n==="backend"?e.updateBackendStatus(l,p):n==="frontend"&&e.updateFrontendStatus(l,p)}else if(s&&(s.textContent="✅ Deployment successful!",s.style.color="var(--success)"),d.deployed_url&&a){a.style.display="block";const l=document.getElementById("openAppBtn");l&&(l.href=d.deployed_url,l.textContent=`Open ${d.deployed_url}`)}return o?{success:!0,deployed_url:d.deployed_url}:(r&&r.isSplit?setTimeout(()=>{H(),D()},1500):setTimeout(()=>{D(),R.navigate("/applications")},2e3),{success:!0,deployed_url:d.deployed_url})}else{const l=d.detail||"Deployment failed";if(e){const p="failed",y=`Error: ${l}`;n==="backend"?e.updateBackendStatus(p,y):n==="frontend"&&e.updateFrontendStatus(p,y)}else s&&(s.textContent=`❌ Error: ${l}`,s.style.color="var(--error)");if(o)return{success:!1,error:l}}}catch{const c="Network error. Please try again.";if(e){const d="failed",l=c;n==="backend"?e.updateBackendStatus(d,l):n==="frontend"&&e.updateFrontendStatus(d,l)}else s&&(s.textContent=`❌ ${c}`,s.style.color="var(--error)");if(o)return{success:!1,error:c}}}async function Ge(){if(!A){document.getElementById("applicationsGrid").innerHTML=`
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
            <h3>${h(s)}</h3>
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
        `}).join("")}}catch(t){console.error("Error loading applications:",t)}}async function te(){if(!A){document.getElementById("historyTableBody").innerHTML=`
      <tr>
        <td colspan="4" class="empty-state">Please login to view deployment history</td>
      </tr>
    `;return}try{const t=await fetch("/deployments",{headers:j()});if(t.ok){const n=await t.json(),e=document.getElementById("historyTableBody");n.length===0?e.innerHTML=`
          <tr>
            <td colspan="4" class="empty-state">No deployment history</td>
          </tr>
        `:e.innerHTML=n.map(o=>{const s=o.app_name||o.container_name||"Untitled Project";return`
          <tr>
            <td><strong>${h(s)}</strong></td>
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
        `}).join("")}}catch(t){console.error("Error loading history:",t)}}async function ze(){if(confirm("Are you sure you want to clear all deployment history?"))try{(await fetch("/deployments/clear",{method:"DELETE",headers:j()})).ok&&(u("History cleared successfully","success"),te())}catch{u("Error clearing history","error")}}async function We(t){if(confirm(`Are you sure you want to destroy "${t}"?`))try{(await fetch(`/deployments/${t}`,{method:"DELETE",headers:j()})).ok?(u("Deployment destroyed successfully","success"),te(),Ge()):u("Error destroying deployment","error")}catch{u("Network error","error")}}let k=[],le="";async function ge(){const t=document.getElementById("usernameSearch").value.trim();if(!t){u("Please enter a GitHub username","error");return}t!==le&&(k=[],le=t);const n=document.getElementById("repositoriesGrid");n.innerHTML='<div class="empty-state"><p>Loading repositories...</p></div>';try{const e=await fetch(`/api/repositories/${t}`),o=await e.json();e.ok&&o.repositories?o.repositories.length===0?n.innerHTML='<div class="empty-state"><p>No repositories found</p></div>':(n.innerHTML=o.repositories.map(s=>`
          <div class="repository-card ${k.some(i=>i.url===s.clone_url)?"selected":""}" data-repo-url="${s.clone_url}" onclick="toggleRepositorySelection('${s.clone_url}', '${s.name}')">
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
        `).join(""),J()):n.innerHTML=`<div class="empty-state"><p>${o.detail||"Error loading repositories"}</p></div>`}catch{n.innerHTML='<div class="empty-state"><p>Error loading repositories</p></div>'}}function Ke(t,n){const e=k.findIndex(o=>o.url===t);if(e>=0)k.splice(e,1),J();else{if(k.length>=2){u("You can only select up to 2 repositories for a split repository","error");return}k.push({url:t,name:n}),k.length===2&&Ye(),J()}}function Ye(){const[t,n]=k,e=document.createElement("div");e.className="modal-overlay",e.id="splitImportModal";const o=document.createElement("div");o.className="modal-content enhanced",o.innerHTML=`
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
        <div class="split-import-repo-name">${h(t.name)}</div>
        <div class="split-import-repo-url">${h(t.url)}</div>
      </div>
      
      <div class="split-import-divider"></div>
      
      <div class="split-import-repo-item">
        <div class="split-import-repo-label">Backend</div>
        <div class="split-import-repo-name">${h(n.name)}</div>
        <div class="split-import-repo-url">${h(n.url)}</div>
      </div>
    </div>
    
    <div class="split-import-actions">
      <button class="cancel-btn">Cancel</button>
      <button class="confirm-btn">Import Split Repository</button>
    </div>
  `,e.appendChild(o),document.body.appendChild(e);const s=o.querySelector(".cancel-btn"),a=o.querySelector(".confirm-btn"),i=()=>{document.body.removeChild(e)};s.onclick=()=>{i()},a.onclick=()=>{i();const[d,l]=k;ve(d.url,l.url,`${d.name}-${l.name}`)},e.onclick=d=>{d.target===e&&i()};const c=d=>{d.key==="Escape"&&(i(),document.removeEventListener("keydown",c))};document.addEventListener("keydown",c),a.focus()}function J(){const t=document.getElementById("repositoriesGrid");if(!t)return;t.querySelectorAll(".repository-card").forEach(e=>{const o=e.getAttribute("data-repo-url");k.some(a=>a.url===o)?e.classList.add("selected"):e.classList.remove("selected")})}function Je(){if(k.length!==2){u("Please select exactly 2 repositories","error");return}const[t,n]=k;confirm(`Import as Split Repository?

Frontend: ${t.name}
Backend: ${n.name}

Click OK to import these repositories as a split project.`)&&ve(t.url,n.url,`${t.name}-${n.name}`)}async function ve(t,n,e){const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o){u("Please login first","error");return}try{u("Importing split repositories...","info");const s=await fetch("/api/import-split",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${o}`},body:new URLSearchParams({frontend_url:t,backend_url:n,app_name:e})}),a=await s.json();if(s.ok){u("Split repository imported successfully! Navigate to Projects to see it.","success"),k=[];const i=document.getElementById("page-projects");i&&i.style.display!=="none"&&x(),document.getElementById("usernameSearch").value.trim()&&ge()}else u(a.detail||"Failed to import split repository","error")}catch(s){console.error("Error importing split repositories:",s),u("Failed to import split repository: "+s.message,"error")}}function Ze(t){document.getElementById("git-url").value=t,R.navigate("/deploy"),u("Repository selected","success")}async function Qe(t,n){const e=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!e){u("Please login first","error");return}try{u("Importing repository...","info");const o=await fetch("/api/import",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${e}`},body:new URLSearchParams({git_url:t,app_name:n||t.split("/").pop()||"Untitled Project"})}),s=await o.json();if(o.ok){u("Repository imported successfully! Navigate to Projects to see it.","success");const a=document.getElementById("page-projects");a&&a.style.display!=="none"&&x()}else u(s.detail||"Failed to import repository","error")}catch(o){console.error("Error importing repository:",o),u("Failed to import repository: "+o.message,"error")}}function Xe(){document.getElementById("repositoriesGrid").innerHTML=`
    <div class="empty-state">
      <p>Search for a GitHub username to see their repositories</p>
            </div>
        `}function u(t,n="info"){const e=document.getElementById("toast");e.textContent=t,e.className=`toast show ${n}`,setTimeout(()=>{e.classList.remove("show")},3e3)}let U={},Z=[],O=null;async function et(){const t=document.getElementById("projectSelector");if(t)try{const n=localStorage.getItem("access_token")||localStorage.getItem("authToken"),e=await fetch("/deployments",{headers:{Authorization:`Bearer ${n}`}});if(e.ok){const o=await e.json();t.innerHTML='<option value="">All Projects (Global)</option>',o.forEach(s=>{var i;const a=document.createElement("option");a.value=s.id,a.textContent=s.app_name||((i=s.repository_url)==null?void 0:i.split("/").pop())||`Project ${s.id}`,t.appendChild(a)})}}catch(n){console.error("Error loading projects:",n)}}async function z(){await et();try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t){const o=document.getElementById("envVarsList");o&&(o.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `),ce();return}const n=O?`/api/env-vars?project_id=${O}`:"/api/env-vars",e=await fetch(n,{headers:{Authorization:`Bearer ${t}`}});if(e.ok){const o=await e.json();U=o.variables||{},Z=o.vars_list||[],nt()}else if(e.status===401){localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),G();const o=document.getElementById("envVarsList");o&&(o.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `)}else console.error("Failed to load environment variables")}catch(t){console.error("Error loading environment variables:",t)}ce()}function ce(){const t=document.getElementById("importEnvBtn"),n=document.getElementById("addEnvVarBtn"),e=document.getElementById("importEnvCard"),o=document.getElementById("cancelImportBtn"),s=document.getElementById("importEnvForm"),a=document.getElementById("projectSelector");a&&a.addEventListener("change",async i=>{O=i.target.value?parseInt(i.target.value):null,await z()}),t&&(t.onclick=()=>{e.style.display=e.style.display==="none"?"block":"none"}),o&&(o.onclick=()=>{e.style.display="none",document.getElementById("envFileInput").value=""}),n&&(n.onclick=()=>{ot()}),s&&(s.onsubmit=async i=>{i.preventDefault();const d=document.getElementById("envFileInput").files[0];d&&await tt(d)})}async function tt(t){try{const e=(await t.text()).split(`
`),o={};e.forEach(s=>{if(s=s.trim(),s&&!s.startsWith("#")&&s.includes("=")){const[a,...i]=s.split("="),c=i.join("=").trim().replace(/^["']|["']$/g,"");a.trim()&&(o[a.trim()]=c)}}),U={...U,...o},await oe(),document.getElementById("importEnvCard").style.display="none",document.getElementById("envFileInput").value="",u("Environment variables imported successfully!","success")}catch(n){console.error("Error importing .env file:",n),u("Failed to import .env file","error")}}function nt(){const t=document.getElementById("envVarsList");if(t){if(Z.length===0){t.innerHTML=`
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
        ${Z.map((n,e)=>{const o=n.updated_at?N(new Date(n.updated_at)):"never",s=n.project_id?'<span style="font-size: 0.75rem; background: var(--primary); color: white; padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Project</span>':'<span style="font-size: 0.75rem; background: var(--bg-tertiary); color: var(--text-secondary); padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Global</span>';return`
            <tr>
              <td class="name-col">
                <span class="lock-icon">🔒</span>
                <span class="var-name">${h(n.key)}</span>
                ${s}
              </td>
              <td class="updated-col">
                <span class="updated-time">${o}</span>
              </td>
              <td class="actions-col">
                <button class="icon-btn edit-btn" onclick="editEnvVarModal('${h(n.key)}')" title="Edit">
                  ✏️
                </button>
                <button class="icon-btn delete-btn" onclick="deleteEnvVar('${h(n.key)}')" title="Delete">
                  🗑️
                </button>
              </td>
            </tr>
          `}).join("")}
      </tbody>
    </table>
  `}}function ot(){ne()}function ne(t=null,n=""){const e=document.getElementById("envVarModal"),o=document.getElementById("modalVarKey"),s=document.getElementById("modalVarValue"),a=document.getElementById("modalTitle");t?(a.textContent="Update environment variable",o.value=t,o.readOnly=!0,s.value=n):(a.textContent="Add environment variable",o.value="",o.readOnly=!1,s.value=""),e.style.display="flex"}function fe(){const t=document.getElementById("envVarModal");t.style.display="none"}async function st(){const t=document.getElementById("modalVarKey"),n=document.getElementById("modalVarValue"),e=t.value.trim(),o=n.value.trim();if(!e){u("Variable name is required","error");return}U[e]=o,await oe(),fe()}function he(t){const n=U[t]||"";ne(t,n)}async function at(t){he(t)}async function it(t){confirm(`Are you sure you want to delete ${t}?`)&&(delete U[t],await oe(),u("Environment variable deleted","success"))}function rt(t){const e=document.querySelectorAll(".env-var-row")[t];if(!e)return;const o=e.querySelector(".env-var-value input");o.type==="password"?o.type="text":o.type="password"}async function oe(){try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");(await fetch("/api/env-vars",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({variables:U,project_id:O})})).ok?(await z(),u("Environment variables saved successfully","success")):(console.error("Failed to save environment variables"),u("Failed to save environment variables","error"))}catch(t){console.error("Error saving environment variables:",t),u("Error saving environment variables","error")}}function lt(){const t=document.getElementById("modalVarValue"),n=document.querySelector('#envVarModal button[onclick*="toggleModalValueVisibility"]');t&&n&&(t.type==="password"?(t.type="text",n.textContent="🙈 Hide"):(t.type="password",n.textContent="👁️ Show"))}function h(t){const n=document.createElement("div");return n.textContent=t,n.innerHTML}async function we(){try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t)return;const n=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${t}`}});if(n.ok){const e=await n.json(),o=document.getElementById("userName"),s=document.getElementById("userEmail"),a=document.getElementById("userAvatar");localStorage.setItem("displayName",e.display_name||""),localStorage.setItem("userEmail",e.email||""),o&&(o.textContent=e.display_name||e.username||"User"),yt(e.display_name||e.username||"User"),s&&(s.textContent=e.email||"Logged in"),a&&(e.avatar_url?(a.style.backgroundImage=`url(${e.avatar_url})`,a.style.backgroundSize="cover",a.style.backgroundPosition="center",a.textContent=""):(a.style.backgroundImage="",a.textContent=(e.display_name||e.username||"U").charAt(0).toUpperCase()))}else n.status===401&&(localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),G())}catch(t){console.error("Error loading user profile:",t)}}async function ct(){try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken"),n=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${t}`}});if(n.ok){const e=await n.json();document.getElementById("username").value=e.username||"",document.getElementById("email").value=e.email||"",document.getElementById("displayName").value=e.display_name||"",e.avatar_url&&(document.getElementById("avatarPreview").src=e.avatar_url,document.getElementById("avatarPreview").style.display="block",document.getElementById("avatarPlaceholder").style.display="none",document.getElementById("removeAvatarBtn").style.display="block")}}catch(t){console.error("Error loading profile:",t)}dt()}function dt(){const t=document.getElementById("profileForm"),n=document.getElementById("avatarFile"),e=document.getElementById("removeAvatarBtn");t&&t.addEventListener("submit",mt),n&&n.addEventListener("change",pt),e&&e.addEventListener("click",ut)}function pt(t){const n=t.target.files[0];if(n){const e=new FileReader;e.onload=o=>{document.getElementById("avatarPreview").src=o.target.result,document.getElementById("avatarPreview").style.display="block",document.getElementById("avatarPlaceholder").style.display="none",document.getElementById("removeAvatarBtn").style.display="block"},e.readAsDataURL(n)}}function ut(){document.getElementById("avatarPreview").src="",document.getElementById("avatarPreview").style.display="none",document.getElementById("avatarPlaceholder").style.display="block",document.getElementById("removeAvatarBtn").style.display="none",document.getElementById("avatarFile").value=""}async function mt(t){t.preventDefault();const n=document.getElementById("profileMessage");n.style.display="none";const e=new FormData;e.append("email",document.getElementById("email").value),e.append("display_name",document.getElementById("displayName").value);const o=document.getElementById("currentPassword").value,s=document.getElementById("newPassword").value,a=document.getElementById("confirmPassword").value;if(s||o){if(s!==a){n.textContent="New passwords do not match",n.className="profile-message error",n.style.display="block";return}if(s.length<6){n.textContent="New password must be at least 6 characters",n.className="profile-message error",n.style.display="block";return}e.append("current_password",o),e.append("new_password",s)}const i=document.getElementById("avatarFile").files[0];i&&e.append("avatar",i),document.getElementById("avatarPreview").style.display==="none"&&e.append("remove_avatar","true");try{const c=localStorage.getItem("access_token")||localStorage.getItem("authToken"),d=await fetch("/api/user/profile",{method:"PUT",headers:{Authorization:`Bearer ${c}`},body:e}),l=await d.json();if(d.ok)n.textContent="Profile updated successfully!",n.className="profile-message success",n.style.display="block",l.username&&localStorage.setItem("username",l.username),document.getElementById("currentPassword").value="",document.getElementById("newPassword").value="",document.getElementById("confirmPassword").value="",await we(),u("Profile updated successfully!","success");else{const p=l.detail||l.message||"Failed to update profile";n.textContent=p,n.className="profile-message error",n.style.display="block",console.error("Profile update failed:",l)}}catch(c){console.error("Error updating profile:",c);try{const d=await response.json();n.textContent=d.detail||"Network error. Please try again."}catch{n.textContent="Network error. Please try again."}n.className="profile-message error",n.style.display="block"}}window.destroyDeployment=We;window.selectRepository=Ze;window.importRepository=Qe;window.editEnvVar=at;window.deleteEnvVar=it;window.toggleEnvVarVisibility=rt;window.saveEnvVarFromModal=st;window.closeEnvVarModal=fe;window.toggleModalValueVisibility=lt;window.editEnvVarModal=he;window.showEnvVarModal=ne;window.selectProject=X;window.showProjectSidebar=Y;window.hideProjectSidebar=Me;window.openProject=qe;window.loadUserProfileIntoProjectSidebar=ue;window.openProjectSite=De;window.deleteProject=Ie;window.toggleRepositorySelection=Ke;window.confirmSplitImport=Je;window.openProjectNameModal=pe;window.openSite=Re;function yt(t){const n=document.getElementById("teamName");n&&(n.textContent=`${t}'s team`),document.querySelectorAll(".project-owner").forEach(o=>{o.textContent=`${t}'s team`})}let C=null,V=!1,$=[];function be(){const t=document.getElementById("logsContent");t&&(t.innerHTML='<p class="logs-connecting">Connecting to WebSocket...</p>',Ee(),gt())}function Ee(){C&&C.close();const n=`${window.location.protocol==="https:"?"wss:":"ws:"}//${window.location.host}/ws/logs`;C=new WebSocket(n),C.onopen=()=>{console.log("Logs WebSocket connected"),L("Connected to logs stream","success"),$.length>0&&($.forEach(e=>L(e.message,e.type)),$=[])},C.onmessage=e=>{try{const o=JSON.parse(e.data);V?$.push({message:o.message,type:o.type||"info"}):L(o.message,o.type||"info")}catch(o){console.error("Error parsing log message:",o),L(e.data,"info")}},C.onerror=e=>{console.error("Logs WebSocket error:",e),L("WebSocket connection error","error")},C.onclose=()=>{console.log("Logs WebSocket disconnected"),L("Disconnected from logs stream","warning"),setTimeout(()=>{var e;((e=document.getElementById("page-logs"))==null?void 0:e.style.display)!=="none"&&Ee()},3e3)}}function L(t,n="info"){const e=document.getElementById("logsContent");if(!e)return;const o=new Date().toLocaleTimeString("en-US",{timeZone:"Asia/Kathmandu"}),s=document.createElement("div");s.className=`log-entry ${n}`,s.innerHTML=`
    <span class="log-timestamp">[${o}]</span>
    <span class="log-message">${h(t)}</span>
  `,e.appendChild(s),e.scrollTop=e.scrollHeight;const a=1e3,i=e.querySelectorAll(".log-entry");i.length>a&&i[0].remove()}function gt(){const t=document.getElementById("clearLogsBtn"),n=document.getElementById("toggleLogsBtn");t&&t.addEventListener("click",()=>{const e=document.getElementById("logsContent");e&&(e.innerHTML="",$=[],L("Logs cleared","info"))}),n&&n.addEventListener("click",()=>{V=!V,n.textContent=V?"Resume":"Pause",!V&&$.length>0&&($.forEach(e=>L(e.message,e.type)),$=[]),L(V?"Logs paused":"Logs resumed","info")})}window.addEventListener("beforeunload",()=>{C&&C.close()});function vt(){const t=document.getElementById("sidebarSearch"),n=document.getElementById("commandPalette"),e=document.getElementById("commandSearchInput"),o=document.querySelectorAll(".command-item");let s=-1;function a(){n&&(n.style.display="flex",e&&(e.focus(),e.value=""),s=-1,c())}function i(){n&&(n.style.display="none",s=-1)}function c(){const l=Array.from(o).filter(p=>p.style.display!=="none");o.forEach((p,y)=>{l.indexOf(p)===s?(p.classList.add("selected"),p.scrollIntoView({block:"nearest",behavior:"smooth"})):p.classList.remove("selected")})}function d(l){switch(i(),l){case"deploy":case"nav-deploy":window.router&&window.router.navigate("/deploy");break;case"add-env-var":window.showEnvVarModal&&window.showEnvVarModal();break;case"search-repos":case"nav-repositories":window.router&&window.router.navigate("/repositories");break;case"nav-projects":window.router&&window.router.navigate("/");break;case"nav-applications":window.router&&window.router.navigate("/applications");break;case"nav-history":window.router&&window.router.navigate("/history");break;case"nav-env-vars":window.router&&window.router.navigate("/env-vars");break;case"nav-settings":window.router&&window.router.navigate("/settings");break}}document.addEventListener("keydown",l=>{var p;if((l.metaKey||l.ctrlKey)&&l.key==="k"&&(l.preventDefault(),n&&n.style.display==="none"?a():i()),l.key==="Escape"&&n&&n.style.display!=="none"&&i(),n&&n.style.display!=="none"){const y=Array.from(o).filter(m=>m.style.display!=="none");if(l.key==="ArrowDown")l.preventDefault(),s=Math.min(s+1,y.length-1),c();else if(l.key==="ArrowUp")l.preventDefault(),s=Math.max(s-1,-1),c();else if(l.key==="Enter"&&s>=0){l.preventDefault();const v=(p=Array.from(o).filter(f=>f.style.display!=="none")[s])==null?void 0:p.getAttribute("data-action");v&&d(v)}}}),t&&t.addEventListener("click",a),n&&n.addEventListener("click",l=>{l.target===n&&i()}),o.forEach(l=>{l.addEventListener("click",()=>{const p=l.getAttribute("data-action");p&&d(p)})}),e&&e.addEventListener("input",l=>{const p=l.target.value.toLowerCase();o.forEach(y=>{y.querySelector(".command-text").textContent.toLowerCase().includes(p)?y.style.display="flex":y.style.display="none"}),s=-1,c()})}
