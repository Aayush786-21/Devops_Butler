import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */class Te{constructor(){this.routes={"/":"projects","/deploy":"deploy","/history":"history","/repositories":"repositories","/domain":"domain","/env-vars":"env-vars","/settings":"settings","/logs":"logs"},this.currentPage=null,this.init()}init(){document.querySelectorAll(".nav-item").forEach(t=>{t.addEventListener("click",n=>{n.preventDefault();const o=t.getAttribute("href");this.navigate(o)})}),window.addEventListener("popstate",()=>{this.loadPage(window.location.pathname)}),this.loadPage(window.location.pathname)}navigate(t){window.history.pushState({},"",t),this.loadPage(t)}loadPage(t){const n=this.routes[t]||"dashboard";if(n==="deploy"){r=null;const o=document.getElementById("projectSidebar");o&&(o.style.display="none");const s=document.getElementById("sidebar");s&&(s.style.display="block")}this.showPage(n),this.updateActiveNav(t),this.updatePageTitle(n),window.scrollTo({top:0,behavior:"smooth"})}showPage(t){document.querySelectorAll(".page").forEach(o=>{o.style.display="none"});const n=document.getElementById(`page-${t}`);if(n){if(n.style.display="block",t==="deploy"){const o=document.getElementById("deploy-status"),s=document.getElementById("deploy-success");o&&(o.textContent="",o.style.color=""),s&&(s.style.display="none")}}else{const o=document.getElementById("page-dashboard");o&&(o.style.display="block")}this.currentPage=t,this.loadPageData(t)}updateActiveNav(t){document.querySelectorAll(".nav-item").forEach(n=>{n.classList.remove("active"),n.getAttribute("href")===t&&n.classList.add("active")})}updatePageTitle(t){const n={projects:"Projects",deploy:"Deploy",history:"History",repositories:"Repositories",domain:"Domain","env-vars":"Environmental Variables",settings:"Settings",logs:"Logs"};document.getElementById("pageTitle").textContent=n[t]||"Dashboard"}loadPageData(t){switch(t){case"projects":T();break;case"history":ye();break;case"repositories":ht();break;case"domain":Ze();break;case"env-vars":ge();break;case"settings":De();break;case"logs":Dt();break}}}const H=new Te;window.router=H;async function Ae(e){const t=await Fe();if(!t)return;const n=j.find(a=>a.id==e),o=n?n.name:"this project";if(await Ue(o))try{console.log("Deleting project with token:",t.substring(0,20)+"...");const a=await fetch(`/projects/${e}`,{method:"DELETE",headers:{Authorization:`Bearer ${t}`}});if(console.log("Delete response status:",a.status),!a.ok){const i=await a.json().catch(()=>({}));if(console.error("Delete error response:",i),a.status===401){m("Session expired. Please login again.","error"),localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),setTimeout(()=>{window.location.href="/login"},2e3);return}throw new Error(i.detail||"Failed to delete project")}j=j.filter(i=>i.id!=e),N=N.filter(i=>i.id!=e),q(N),m("Project deleted","success")}catch(a){console.error("Delete project error:",a),m(`Delete failed: ${a.message}`,"error")}}function Ue(e){return new Promise(t=>{const n=document.createElement("div");n.className="modal-overlay";const o=document.createElement("div");o.className="delete-confirmation-modal",o.innerHTML=`
      <h3>Delete Project</h3>
      <p>
        Are you sure you want to delete <strong>${w(e)}</strong>?<br>
        This will stop and remove its container and image.
      </p>
      <div class="delete-confirmation-actions">
        <button class="cancel-btn">Cancel</button>
        <button class="delete-btn">Delete</button>
      </div>
    `,n.appendChild(o),document.body.appendChild(n);const s=o.querySelector(".cancel-btn"),a=o.querySelector(".delete-btn"),i=()=>{document.body.removeChild(n)};s.onclick=()=>{i(),t(!1)},a.onclick=()=>{i(),t(!0)},n.onclick=l=>{l.target===n&&(i(),t(!1))},a.focus()})}function Me(e){try{const n=JSON.parse(atob(e.split(".")[1])).exp*1e3,o=Date.now();return n<o+5*60*1e3}catch{return!0}}async function Fe(){const e=localStorage.getItem("access_token")||localStorage.getItem("authToken");return!e||Me(e)?(m("Session expired. Please login again.","error"),localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),setTimeout(()=>{window.location.href="/login"},2e3),null):e}let K=localStorage.getItem("access_token")||localStorage.getItem("authToken"),ce=localStorage.getItem("username");document.addEventListener("DOMContentLoaded",()=>{te(),window.location.pathname==="/login"||window.location.pathname.includes("login.html")||setTimeout(()=>{if(K&&ce){Re(),Tt();const t=document.getElementById("page-projects");t&&window.location.pathname==="/"&&(t.style.display="block")}},100)});function te(){const e=document.getElementById("userSection"),t=document.getElementById("authButtons"),n=document.getElementById("logoutBtn"),o=document.getElementById("newDeployBtn");document.getElementById("userName"),document.getElementById("userEmail"),document.getElementById("userAvatar");const s=window.location.pathname==="/login"||window.location.pathname.includes("login.html");K&&ce?(e.style.display="flex",t.style.display="none",n.style.display="block",o.style.display="block",Pe(),T(),s&&(window.location.href="/")):(e.style.display="none",t.style.display="block",n.style.display="none",o.style.display="none",s||(window.location.href="/login"))}function Re(){var a,i;document.getElementById("logoutBtn").addEventListener("click",()=>{localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),K=null,ce=null,te(),m("Logged out successfully","success"),H.navigate("/")});const e=document.getElementById("projectsSearch");e&&e.addEventListener("input",l=>{const d=l.target.value.toLowerCase();N=j.filter(c=>c.name.toLowerCase().includes(d)||c.repository&&c.repository.toLowerCase().includes(d)),q(N)});const t=document.getElementById("addProjectBtn");t&&t.addEventListener("click",()=>{window.router&&window.router.navigate("/deploy")});const n=document.getElementById("browseUploadLink");n&&n.addEventListener("click",l=>{l.preventDefault(),window.router&&window.router.navigate("/deploy")}),document.getElementById("newDeployBtn").addEventListener("click",()=>{r=null;const l=document.getElementById("projectSidebar");l&&(l.style.display="none");const d=document.getElementById("sidebar");d&&(d.style.display="block"),H.navigate("/deploy")});const o=document.getElementById("deployForm");o&&o.addEventListener("submit",ct);const s=document.getElementById("deploy-type");s&&s.addEventListener("change",l=>{const d=document.getElementById("single-repo-group"),c=document.getElementById("split-repo-group"),p=document.getElementById("git-url");l.target.value==="split"?(d.style.display="none",c.style.display="block",p&&p.removeAttribute("required")):(d.style.display="block",c.style.display="none",p&&p.setAttribute("required","required"))}),(a=document.getElementById("clearHistoryBtn"))==null||a.addEventListener("click",pt),(i=document.getElementById("searchReposBtn"))==null||i.addEventListener("click",_e),Ve(),Oe()}function Ve(){const e=document.querySelector(".search-input"),t=document.getElementById("spotlightModal"),n=document.getElementById("spotlightSearch"),o=document.getElementById("spotlightResults");!e||!t||!n||!o||(e.addEventListener("click",He),t.addEventListener("click",s=>{s.target===t&&ae()}),n.addEventListener("input",ze),o.addEventListener("click",Ke),document.addEventListener("keydown",s=>{s.key==="Escape"&&t.style.display!=="none"&&ae()}))}function He(){const e=document.getElementById("spotlightModal"),t=document.getElementById("spotlightSearch");e.style.display="flex",setTimeout(()=>{t.focus()},100)}function ae(){const e=document.getElementById("spotlightModal"),t=document.getElementById("spotlightSearch"),n=document.getElementById("spotlightResults");e.style.display="none",t.value="",n.innerHTML=`
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
  `}function Oe(){const e=document.getElementById("domainWarningModal");if(!e||e.dataset.bound==="true")return;e.dataset.bound="true";const t=document.getElementById("domainModalCancelBtn"),n=document.getElementById("domainModalOpenConfigBtn"),o=()=>{e.style.display="none"};t&&t.addEventListener("click",o),n&&n.addEventListener("click",()=>{o(),pe("domain-config"),Se()}),e.addEventListener("click",s=>{s.target===e&&o()})}function qe(){const e=document.getElementById("domainWarningModal");e&&(e.style.display="flex")}function ze(e){const t=e.target.value.toLowerCase().trim(),n=document.getElementById("spotlightResults");if(!t){n.innerHTML=`
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
    `;return}const o=We(t);Ge(o)}function We(e){const t={projects:[],actions:[],navigation:[]};j&&j.length>0&&(t.projects=j.filter(s=>s.name.toLowerCase().includes(e)||s.repository&&s.repository.toLowerCase().includes(e)));const n=[{name:"New Deploy",action:"new-deploy",icon:"🚀"},{name:"Repositories",action:"repositories",icon:"📁"},{name:"History",action:"history",icon:"📜"},{name:"Settings",action:"settings",icon:"⚙️"},{name:"Domain",action:"domain",icon:"🌐"}];t.actions=n.filter(s=>s.name.toLowerCase().includes(e));const o=[{name:"Projects",action:"projects",icon:"📊"},{name:"Repositories",action:"repositories",icon:"📁"},{name:"History",action:"history",icon:"📜"},{name:"Domain",action:"domain",icon:"🌐"},{name:"Settings",action:"settings",icon:"⚙️"}];return t.navigation=o.filter(s=>s.name.toLowerCase().includes(e)),t}function Ge(e){const t=document.getElementById("spotlightResults");let n='<div class="search-results">';e.projects.length>0&&(n+='<div class="search-category">',n+='<div class="search-category-title">Projects</div>',e.projects.forEach(o=>{const s=o.status==="running"?"🚀":"📦",a=o.status==="running"?"RUNNING":o.status==="failed"?"FAILED":"IMPORTED";n+=`
        <div class="search-result-item" data-type="project" data-id="${o.id}">
          <span class="search-result-icon">${s}</span>
          <div class="search-result-content">
            <div class="search-result-title">${w(o.name)}</div>
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
        <p>No results found for "${w(document.getElementById("spotlightSearch").value)}"</p>
      </div>
    `),n+="</div>",t.innerHTML=n}function Ke(e){const t=e.target.closest(".suggestion-item, .search-result-item");if(!t)return;const n=t.dataset.action,o=t.dataset.type,s=t.dataset.id;if(ae(),o==="project"&&s)de(parseInt(s));else if(n)switch(n){case"new-deploy":window.router&&window.router.navigate("/deploy");break;case"repositories":window.router&&window.router.navigate("/repositories");break;case"history":window.router&&window.router.navigate("/history");break;case"domain":window.router&&window.router.navigate("/domain");break;case"settings":window.router&&window.router.navigate("/settings");break;case"projects":window.router&&window.router.navigate("/projects");break}}function Ze(){document.getElementById("page-domain")}function $(){const e={},t=localStorage.getItem("access_token")||localStorage.getItem("authToken");return t&&(e.Authorization=`Bearer ${t}`),e}let j=[],N=[];async function T(){const e=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!e){q([]);return}Je();try{const t=await fetch("/deployments",{headers:{Authorization:`Bearer ${e}`}});t.ok?(j=(await t.json()).map(o=>{var A;const s=o.git_url||"",a=s,i=s?(A=String(s).split("/").pop())==null?void 0:A.replace(/\.git$/,""):null,l=o.app_name||i||o.container_name||"Untitled Project",d=(o.status||"").toLowerCase();let c;d==="running"?c="running":d==="failed"||d==="error"?c="failed":c="imported";let p=!1,u="single",y=null,g=null;const f=String(o.git_url||""),b=f.startsWith("split::"),C=!o.parent_project_id&&!o.component_type;if(b){p=!0,u="split";try{const B=f.replace("split::","").split("|");B.length===2&&(y=B[0],g=B[1])}catch{}}else if(d==="imported_split")p=!0,u="split";else if(C&&f.includes("|")){p=!0,u="split";try{const B=f.split("|");B.length===2&&(y=B[0],g=B[1])}catch{}}const I=o.custom_domain&&o.domain_status&&o.domain_status.toLowerCase()==="active"?`https://${o.custom_domain}`:o.deployed_url||o.app_url||null;return{id:o.id,name:l,status:c,url:I,createdAt:o.created_at,updatedAt:o.updated_at,repository:a,repository_url:a,git_url:s,project_type:u,isSplit:p,frontend_url:y,backend_url:g,containerUptime:o.container_uptime||"Unknown",containerPorts:o.container_ports||"No ports",containerImage:o.container_image||"Unknown",containerStatus:o.container_status||"Unknown",isRunning:o.is_running||!1,custom_domain:o.custom_domain||null,domain_status:o.domain_status||null,last_domain_sync:o.last_domain_sync||null}}),N=[...j],q(N)):q([])}catch(t){console.error("Error loading projects:",t),q([])}}function q(e){const t=document.getElementById("projectsGrid");if(t){if(e.length===0){t.innerHTML=`
      <div class="empty-state">
        <p>No projects found</p>
        <button class="btn-primary" onclick="if(window.router){window.router.navigate('/deploy');}else{window.location.href='/deploy';}">Create First Project</button>
      </div>
    `;return}t.innerHTML=e.map(n=>{const o=n.status==="running"?"status-success":n.status==="failed"?"status-error":"status-info",s=n.status==="running"?"Running":n.status==="failed"?"Failed":"Imported",a=n.status==="running"?"🚀":"📦",i=n.updatedAt?W(n.updatedAt):"Recently";return`
      <div class="project-card" data-project-id="${n.id}" onclick="selectProject(${n.id})">
        <div class="project-header">
          <div class="project-icon">${a}</div>
          <div class="project-status ${o}">${s}</div>
          </div>
        
        <div class="project-info">
          <h3 class="project-name">${w(n.name)}</h3>
          <div class="project-meta">
            <svg class="icon-clock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12,6 12,12 16,14"></polyline>
            </svg>
            <span>Updated ${i}</span>
        </div>
          
                 ${n.status==="running"?`
                 <div class="project-metrics">
                   <div class="metric">
                     <span class="metric-label">Uptime</span>
                     <span class="metric-value">${n.containerUptime}</span>
            </div>
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
      `}).join("")}}async function Ye(e){try{const t=j.find(o=>o.id===e);if(!t){m("Project not found","error");return}const n=Ie(t.url);if(!n){m("Project URL not available. Make sure the project is deployed.","error");return}window.open(n,"_blank"),m(`Opening ${t.name}...`,"info")}catch(t){console.error("Error opening project site:",t),m("Failed to open project site: "+t.message,"error")}}function Je(){const e=document.getElementById("projectsGrid");e&&(e.innerHTML=`
    <div class="loading-skeleton">
      ${Array(3).fill(`
        <div class="skeleton-card">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line short"></div>
        </div>
      `).join("")}
    </div>
  `)}let r=null;function de(e){T().then(()=>{const n=j.find(o=>o.id==e);if(!n){const o=N.find(s=>s.id==e);o&&(r=o,ie(o));return}r=n,ie(n)});const t=document.getElementById("page-project-config");t&&t.style.display!=="none"&&me()}function ie(e){const t=document.getElementById("sidebar");t&&(t.style.display="none");let n=document.getElementById("projectSidebar");n||(n=Qe(),document.body.appendChild(n));const o=n.querySelector("#projectSidebarName");o&&(o.textContent=e.name);const s=n.querySelector("#projectSidebarId");s&&(s.textContent=e.id);const a=n.querySelector('a[data-project-page="status"]');a&&(e.project_type==="split"?a.style.display="flex":a.style.display="none"),n.style.display="block",document.getElementById("pageTitle").textContent=e.name,je(),pe("deploy")}function Qe(){const e=document.createElement("aside");return e.id="projectSidebar",e.className="sidebar project-sidebar",e.innerHTML=`
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
  `,e.querySelectorAll(".project-nav-item").forEach(t=>{t.addEventListener("click",async n=>{n.preventDefault();const o=t.getAttribute("data-project-page");if(await T(),r){const s=j.find(a=>a.id===r.id);s&&(r=s)}pe(o),e.querySelectorAll(".project-nav-item").forEach(s=>s.classList.remove("active")),t.classList.add("active")})}),e}function Xe(){const e=document.getElementById("projectSidebar");e&&(e.style.display="none");const t=document.getElementById("sidebar");t&&(t.style.display="block"),r=null,document.getElementById("pageTitle").textContent="Projects",document.querySelectorAll(".page").forEach(o=>{o.style.display="none"});const n=document.getElementById("page-projects");n&&(n.style.display="block"),T()}function pe(e){var t;switch(document.querySelectorAll(".page").forEach(n=>{n.style.display="none"}),e){case"deploy":const n=document.getElementById("page-deploy");if(n){n.style.display="block";const s=document.getElementById("deploy-status"),a=document.getElementById("deploy-success");s&&(s.textContent="",s.style.color=""),a&&(a.style.display="none");const i=(t=n.querySelector(".card h2"))==null?void 0:t.closest(".card");if(r){i&&(i.style.display="block");const I=document.getElementById("project-components-section");r!=null&&r.project_type||r!=null&&r.isSplit,I&&(I.style.display="none")}else{i&&(i.style.display="block");const I=document.getElementById("project-components-section");I&&(I.style.display="none")}document.getElementById("deploy-type");const l=document.getElementById("deploy-type-group"),d=document.getElementById("single-repo-group"),c=document.getElementById("split-repo-group"),p=document.getElementById("split-deploy-layout"),u=document.getElementById("git-url"),y=document.getElementById("frontend-url"),g=document.getElementById("backend-url"),f=document.getElementById("deploy-submit-default");n.querySelectorAll(".dynamic-split-btn").forEach(I=>I.remove());let b=r==null?void 0:r.project_type;const C=(r==null?void 0:r.git_url)||(r==null?void 0:r.repository_url)||"",k=C.startsWith("split::");if(b||(r!=null&&r.isSplit||k?b="split":b="single"),k&&b!=="split"?(console.warn("Project type mismatch detected. git_url indicates split but project_type is",b),b="split"):!k&&b==="split"&&C&&(console.warn("Project type mismatch detected. git_url indicates single but project_type is split"),b="single"),r)if(l&&(l.style.display="none"),b==="split"){d&&(d.style.display="none"),c&&(c.style.display="none"),p&&(p.style.display="block"),y&&(y.value=r.frontend_url||""),g&&(g.value=r.backend_url||""),u&&u.removeAttribute("required"),f&&(f.style.display="none");const I=document.getElementById("deploy-frontend-btn"),A=document.getElementById("deploy-backend-btn"),B=document.getElementById("deploy-both-btn");I&&(I.onclick=async()=>{var x,_,U,M;const S=(x=y==null?void 0:y.value)==null?void 0:x.trim();if(!S||!S.startsWith("http"))return m("Enter a valid frontend URL","error");const h=oe(!1);document.getElementById("step-frontend").style.display="flex",h.updateFrontendStatus("deploying","Deploying your frontend now..."),(_=document.getElementById("build-command"))!=null&&_.value.trim(),(U=document.getElementById("start-command"))!=null&&U.value.trim(),(M=document.getElementById("port"))!=null&&M.value.trim();const E=await be(S,"frontend",h,!0);E&&E.success&&E.deployed_url?(h.showUrls(E.deployed_url,null),document.getElementById("close-deployment-dialog").onclick=()=>{h.close(),J(),z()}):E&&!E.success&&setTimeout(()=>h.close(),3e3)}),A&&(A.onclick=async()=>{var x,_,U,M;const S=(x=g==null?void 0:g.value)==null?void 0:x.trim();if(!S||!S.startsWith("http"))return m("Enter a valid backend URL","error");const h=oe(!1);document.getElementById("step-backend").style.display="flex",h.updateBackendStatus("deploying","Deploying your backend now..."),(_=document.getElementById("build-command"))!=null&&_.value.trim(),(U=document.getElementById("start-command"))!=null&&U.value.trim(),(M=document.getElementById("port"))!=null&&M.value.trim();const E=await be(S,"backend",h,!0);E&&E.success&&E.deployed_url?(h.showUrls(null,E.deployed_url),document.getElementById("close-deployment-dialog").onclick=()=>{h.close(),J(),z()}):E&&!E.success&&setTimeout(()=>h.close(),3e3)}),B&&(B.onclick=async()=>{var U,M;const S=(U=y==null?void 0:y.value)==null?void 0:U.trim(),h=(M=g==null?void 0:g.value)==null?void 0:M.trim();if(!S||!S.startsWith("http")||!h||!h.startsWith("http")){m("Please enter valid Frontend and Backend repository URLs","error");return}let E=!1,x={};if(r&&r.id)try{const v=await fetch(`/api/env-vars?project_id=${r.id}`,{headers:$()});if(v.ok){const F=(await v.json()).variables||{};E=Object.keys(F).length>0,console.log("Existing env vars check:",{hasExistingEnvVars:E,count:Object.keys(F).length})}}catch(v){console.warn("Failed to check existing env vars:",v)}if(E){await _();return}try{const v=await fetch(`/api/env-vars/detect?frontend_url=${encodeURIComponent(S)}&backend_url=${encodeURIComponent(h)}`,{headers:$()});v.ok?(x=(await v.json()).suggestions||{},console.log("Env var detection result:",{count:Object.keys(x).length,vars:x})):console.warn("Env var detection API returned:",v.status)}catch(v){console.warn("Env var detection failed:",v)}ot(x,async()=>{if(Object.keys(x).length===0){r&&r.id?H.navigate("/env-vars"):(m("No env vars detected. Add them manually after deployment","info"),await _());return}if(m("Importing environment variables...","info"),r&&r.id){const v={};Object.keys(x).forEach(Y=>{v[Y]=""});const O=localStorage.getItem("access_token")||localStorage.getItem("authToken"),F=await fetch(`/api/env-vars?project_id=${r.id}`,{headers:{Authorization:`Bearer ${O}`}});if(F.ok){const Q={...(await F.json()).variables||{},...v};(await fetch("/api/env-vars",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${O}`},body:JSON.stringify({variables:Q,project_id:r.id})})).ok?(m("Environment variables imported successfully!","success"),setTimeout(()=>_(),500)):(m("Failed to import environment variables","error"),await _())}else m("Failed to load existing environment variables","error"),await _()}else m("Save detected env vars after deployment","info"),await _()},()=>{r&&r.id?H.navigate("/env-vars"):m("Please add environment variables after deployment","info")},async()=>{await _()});async function _(){var O,F,Y;const v=oe(!0);document.getElementById("step-backend").style.display="flex",document.getElementById("step-frontend").style.display="flex",v.updateBackendStatus("deploying","Deploying your backend now...");try{const P=new FormData;P.append("deploy_type","split"),P.append("frontend_url",S),P.append("backend_url",h),r&&r.id&&P.append("project_id",String(r.id));const Q=(O=document.getElementById("build-command"))==null?void 0:O.value.trim(),ne=(F=document.getElementById("start-command"))==null?void 0:F.value.trim(),he=(Y=document.getElementById("port"))==null?void 0:Y.value.trim();Q&&P.append("build_command",Q),ne&&P.append("start_command",ne),he&&P.append("port",he);const we=await fetch("/deploy",{method:"POST",headers:$(),body:P}),X=await we.json();we.ok&&X.deployed_url?(v.updateBackendStatus("success","Backend deployed! ✅"),v.updateFrontendStatus("success","Frontend deployed! ✅"),v.showUrls(X.deployed_url,null),document.getElementById("close-deployment-dialog").onclick=()=>{v.close(),T(),J(),z()},m("Split deployment successful!","success")):(v.updateBackendStatus("failed",X.detail||"Deployment failed"),v.updateFrontendStatus("failed","Could not deploy"),m(X.detail||"Deployment failed","error"),setTimeout(()=>v.close(),3e3))}catch{v.updateBackendStatus("failed","Network error"),v.updateFrontendStatus("failed","Network error"),m("Network error during deployment","error"),setTimeout(()=>v.close(),3e3)}}}),f&&(f.style.display="none")}else b==="single"&&(d&&(d.style.display="block"),c&&(c.style.display="none"),p&&(p.style.display="none"),u&&r&&r.repository_url&&(u.value=r.repository_url),f&&(f.textContent="🚀 Deploy",f.style.display=""));else l&&(l.style.display=""),c&&(c.style.display="none"),p&&(p.style.display="none"),d&&(d.style.display="block"),u&&(u.value=""),f&&(f.textContent="🚀 Deploy",f.style.display="")}document.getElementById("pageTitle").textContent="Deploy";break;case"status":tt();break;case"configuration":et();break;case"domain-config":Se();break;case"env-vars":const o=document.getElementById("page-env-vars");o&&(o.style.display="block",ge());break}}async function et(){let e=document.getElementById("page-project-config");e||(e=document.createElement("div"),e.id="page-project-config",e.className="page",e.innerHTML=`
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
              <span class="config-value-text" id="projectConfigCreated">${r!=null&&r.createdAt?ue(r.createdAt):"Unknown"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Last update:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigUpdated">${r!=null&&r.updatedAt?W(new Date(r.updatedAt)):"Unknown"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Container Ports:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigPorts">${r!=null&&r.containerPorts?Ce(r.containerPorts):"No ports"}</span>
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
    `,document.getElementById("pageContent").appendChild(e));const t=document.getElementById("project-components-section");t&&(t.style.display="none"),me();const n=document.getElementById("changeProjectNameBtn");n&&(n.onclick=()=>Be()),e.style.display="block"}async function tt(){document.querySelectorAll(".page").forEach(t=>t.style.display="none");let e=document.getElementById("page-status");if(e||(e=document.createElement("div"),e.id="page-status",e.className="page",document.getElementById("pageContent").appendChild(e)),e.innerHTML="",r&&r.id)try{const t=await fetch(`/projects/${r.id}/components`,{headers:$()});if(t.ok){const o=(await t.json()).components||[],s=o.find(p=>p.component_type==="frontend"),a=o.find(p=>p.component_type==="backend"),i=s?s.status==="running"?"RUNNING":s.status.toUpperCase():"NOT DEPLOYED",l=a?a.status==="running"?"RUNNING":a.status.toUpperCase():"NOT DEPLOYED",d=(s==null?void 0:s.status)==="running"?"status-success":(s==null?void 0:s.status)==="failed"?"status-error":"status-info",c=(a==null?void 0:a.status)==="running"?"status-success":(a==null?void 0:a.status)==="failed"?"status-error":"status-info";e.innerHTML=`
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
                      <span>Updated ${s.updated_at?W(new Date(s.updated_at)):"Recently"}</span>
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
                      <span>Updated ${a.updated_at?W(new Date(a.updated_at)):"Recently"}</span>
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
        `}}catch(t){console.error("Error loading project components:",t),e.innerHTML=`
        <div class="card">
          <p>Unable to load project components. Please try again later.</p>
        </div>
      `}e.style.display="block",document.getElementById("pageTitle").textContent="Status"}async function J(){if(!(!r||!r.id))try{const e=await fetch(`/projects/${r.id}/components`,{headers:$()});if(!e.ok)return;const n=(await e.json()).components||[],o=n.find(y=>y.component_type==="frontend"),s=n.find(y=>y.component_type==="backend"),a=o&&o.status&&o.status!=="imported"&&o.status!=="imported_split",i=s&&s.status&&s.status!=="imported"&&s.status!=="imported_split",l=a&&i;let d=document.getElementById("project-components-section");const c=document.getElementById("page-deploy"),p=document.getElementById("page-project-config"),u=p==null?void 0:p.querySelector("#project-components-section");if(u&&u.remove(),l&&c&&c.style.display!=="none"){if(!d){d=document.createElement("div"),d.id="project-components-section",d.className="card project-components-card";const C=c.querySelector(".card");C?c.insertBefore(d,C):c.appendChild(d)}d.style.display="block";const y=o?o.status==="running"?"RUNNING":o.status.toUpperCase():"NOT DEPLOYED",g=s?s.status==="running"?"RUNNING":s.status.toUpperCase():"NOT DEPLOYED",f=(o==null?void 0:o.status)==="running"?"status-success":(o==null?void 0:o.status)==="failed"?"status-error":"status-info",b=(s==null?void 0:s.status)==="running"?"status-success":(s==null?void 0:s.status)==="failed"?"status-error":"status-info";d.innerHTML=`
      <h2 style="margin-bottom: 1.5rem;">Project Components</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
        <!-- Frontend Card -->
        <div class="project-card" style="margin: 0;">
          <div class="project-header">
            <div class="project-icon">🌐</div>
            <div class="project-status ${f}">${y}</div>
          </div>
          <div class="project-info">
            <h3 class="project-name">Frontend</h3>
            <div class="project-meta">
              ${o?`
                <svg class="icon-clock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                <span>Updated ${o.updated_at?W(new Date(o.updated_at)):"Recently"}</span>
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
            <div class="project-status ${b}">${g}</div>
          </div>
          <div class="project-info">
            <h3 class="project-name">Backend</h3>
            <div class="project-meta">
              ${s?`
                <svg class="icon-clock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                <span>Updated ${s.updated_at?W(new Date(s.updated_at)):"Recently"}</span>
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
    `,requestAnimationFrame(()=>{d.classList.add("components-visible");const C=c.querySelector(".card:not(#project-components-section)");C&&C.classList.add("deploy-card-slide-down")})}else if(d){d.style.display="none",d.classList.remove("components-visible");const y=c==null?void 0:c.querySelector(".card:not(#project-components-section)");y&&y.classList.remove("deploy-card-slide-down")}}catch(e){console.error("Error loading project components:",e)}}function Ie(e){if(!e||e==="#")return null;const t=e.trim();return/^https?:\/\//i.test(t)?t:`https://${t}`}function nt(e){const t=Ie(e);t?window.open(t,"_blank"):m("Site URL is unavailable","error")}function ot(e,t,n,o){const s=document.createElement("div");s.className="modal-overlay",s.id="envVarsDetectionOverlay";const a=document.createElement("div");a.className="modal-content enhanced",a.style.maxWidth="600px";const i=Object.keys(e).length>0,l=i?Object.entries(e).map(([c,p])=>`
      <div class="env-var-suggestion" style="padding: 0.75rem; margin-bottom: 0.5rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="font-weight: 600; color: #111827; margin-bottom: 0.25rem;">${c}</div>
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
  `,s.appendChild(a),document.body.appendChild(s),document.querySelector(".skip-env-btn").onclick=()=>{s.remove(),o&&o()},document.querySelector(".add-manual-env-btn").onclick=()=>{s.remove(),n&&n()};const d=document.querySelector(".import-env-btn");return d&&(d.onclick=async()=>{s.remove(),t&&await t()}),s}function oe(e=!0){const t=document.createElement("div");t.className="modal-overlay deployment-progress-overlay",t.id="deploymentProgressOverlay";const n=document.createElement("div");return n.className="deployment-progress-modal",n.innerHTML=`
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
  `,t.appendChild(n),document.body.appendChild(t),{overlay:t,updateBackendStatus:(o,s)=>{const a=document.getElementById("step-backend"),i=a.querySelector(".step-icon"),l=document.getElementById("backend-status"),d=document.getElementById("backend-message");d.textContent=s,o==="deploying"?(i.textContent="⏳",l.textContent="",a.classList.remove("completed","failed"),a.classList.add("active")):o==="success"?(i.textContent="✅",l.textContent="✓",a.classList.remove("active","failed"),a.classList.add("completed")):o==="failed"&&(i.textContent="❌",l.textContent="✗",a.classList.remove("active","completed"),a.classList.add("failed"))},updateFrontendStatus:(o,s)=>{const a=document.getElementById("step-frontend"),i=a.querySelector(".step-icon"),l=document.getElementById("frontend-status"),d=document.getElementById("frontend-message");d.textContent=s,o==="deploying"?(i.textContent="⏳",l.textContent="",a.classList.remove("completed","failed"),a.classList.add("active")):o==="success"?(i.textContent="✅",l.textContent="✓",a.classList.remove("active","failed"),a.classList.add("completed")):o==="failed"&&(i.textContent="❌",l.textContent="✗",a.classList.remove("active","completed"),a.classList.add("failed"))},showUrls:(o,s)=>{const a=document.getElementById("deployment-urls"),i=document.getElementById("frontend-url-link"),l=document.getElementById("backend-url-link"),d=document.getElementById("close-deployment-dialog");o?(i.href=o,i.textContent=o,i.closest(".url-item").style.display="flex"):i.closest(".url-item").style.display="none",s?(l.href=s,l.textContent=s,l.closest(".url-item").style.display="flex"):l.closest(".url-item").style.display="none",a.style.display="block",d.style.display="block"},close:()=>{const o=document.getElementById("deploymentProgressOverlay");o&&document.body.removeChild(o)}}}function Be(){if(!r){m("No project selected","error");return}const e=document.createElement("div");e.className="modal-overlay";const t=document.createElement("div");t.className="modal-content enhanced",t.innerHTML=`
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
  `,e.appendChild(t),document.body.appendChild(e);const n=document.getElementById("newProjectNameInput");n&&(n.focus(),n.select());const o=t.querySelector(".cancel-name-btn"),s=t.querySelector(".save-name-btn"),a=()=>{document.body.removeChild(e)};o.onclick=()=>{a()},s.onclick=async()=>{const l=n.value.trim();if(!l){m("Project name cannot be empty","error");return}if(l===r.name){a();return}try{const d=localStorage.getItem("access_token")||localStorage.getItem("authToken"),c=await fetch(`/projects/${r.id}/name`,{method:"PUT",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${d}`},body:new URLSearchParams({app_name:l})}),p=await c.json();if(c.ok){m("Project name updated successfully!","success"),r.name=l,a();const u=j.findIndex(g=>g.id===r.id);u>=0&&(j[u].name=l),me(),q(N);const y=document.getElementById("projectSidebarName");y&&(y.textContent=l),document.getElementById("pageTitle").textContent=l}else m(p.detail||"Failed to update project name","error")}catch(d){console.error("Error updating project name:",d),m("Failed to update project name: "+d.message,"error")}},e.onclick=l=>{l.target===e&&a()};const i=l=>{l.key==="Escape"&&(a(),document.removeEventListener("keydown",i))};document.addEventListener("keydown",i)}function me(){if(!r)return;const e=document.getElementById("projectConfigName"),t=document.getElementById("projectConfigOwner"),n=document.getElementById("projectConfigId"),o=document.getElementById("projectConfigCreated"),s=document.getElementById("projectConfigUpdated"),a=document.getElementById("projectConfigPorts"),i=document.getElementById("projectConfigImage"),l=document.getElementById("projectConfigStatus");if(e&&(e.textContent=r.name||"Unknown"),t){const d=localStorage.getItem("username"),c=localStorage.getItem("displayName");t.textContent=c||d||"Unknown User"}n&&(n.textContent=r.id||"-"),o&&(o.textContent=r.createdAt?ue(r.createdAt):"Unknown"),s&&(s.textContent=r.updatedAt?W(new Date(r.updatedAt)):"Unknown"),a&&(a.textContent=r.containerPorts?Ce(r.containerPorts):"No ports"),i&&(i.textContent=r.containerImage||"Unknown"),l&&(l.textContent=r.containerStatus||"Unknown")}function Se(){let e=document.getElementById("page-project-domain");e||(e=document.createElement("div"),e.id="page-project-domain",e.className="page",e.innerHTML=`
      <div class="card">
        <h2>Domain Configuration</h2>
        <div class="domain-config">
          <div class="config-option">
            <h3>🌐 Use Custom Domain</h3>
            <p>Configure a custom domain for this project</p>
            <div class="form-group">
              <label for="customDomain">Custom Domain</label>
              <input type="text" id="customDomain" placeholder="project-butler.example.com" />
              <p class="domain-hint" id="domainSuggestion"></p>
            </div>
            <div class="domain-actions">
              <button class="btn-primary" id="saveDomainBtn">Save Domain</button>
            </div>
            <div class="domain-status" id="domainStatus"></div>
          </div>
        </div>
      </div>
    `,document.getElementById("pageContent").appendChild(e)),e.style.display="block",st(),ee()}function st(){const e=document.getElementById("saveDomainBtn");e&&!e.dataset.bound&&(e.dataset.bound="true",e.addEventListener("click",it))}function at(e,t){if(!e)return;if(!t||!t.custom_domain){e.innerHTML='<span class="status-muted">No custom domain configured yet.</span>';return}const n=(t.domain_status||"unknown").toLowerCase(),o=t.last_domain_sync?ue(t.last_domain_sync):"Never";let s="Unknown",a="status-info",i="";n==="active"?(s="Active",a="status-success"):n==="error"?(s="Error",a="status-error",i="Resolve the issue and save the domain again."):n==="pending"&&(s="Pending",a="status-warning",i="Domain will be activated automatically after the next successful deployment."),e.innerHTML=`
    <div class="domain-status-line ${a}">
      <div class="domain-status-domain">
        <strong>${w(t.custom_domain)}</strong>
      </div>
      <div class="domain-status-meta">
        <span>${s}</span>
        <span>Last sync: ${w(o)}</span>
      </div>
      ${i?`<p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">${w(i)}</p>`:""}
    </div>
  `}async function ee(){const e=document.getElementById("domainSuggestion"),t=document.getElementById("domainStatus"),n=document.getElementById("customDomain");if(!r||!r.id){t&&(t.innerHTML='<span class="status-muted">Select a project to configure its domain.</span>');return}const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o){t&&(t.innerHTML='<span class="status-error">Please login to manage domains.</span>');return}e&&(e.textContent="Loading domain details...");try{const s=await fetch(`/projects/${r.id}/domain`,{headers:{Authorization:`Bearer ${o}`}});if(!s.ok)throw new Error(`Failed to load domain info (${s.status})`);const a=await s.json();n&&(n.value=a.custom_domain||a.suggested_domain||"",n.placeholder=a.suggested_domain||`project-${a.butler_domain}`),e&&(e.textContent=a.suggested_domain?`Suggested: ${a.suggested_domain} (single label before ${a.butler_domain}). Leave blank to remove. Domains become active after a successful deploy.`:`Format: project-slug-${a.butler_domain}`),at(t,a),r&&(r.custom_domain=a.custom_domain,r.domain_status=a.domain_status)}catch(s){console.error("Failed to load project domain info:",s),t&&(t.innerHTML='<span class="status-error">Could not load domain configuration.</span>')}}async function it(){if(!r||!r.id){m("Select a project first","error");return}const e=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!e){m("Please login to manage domains","error");return}const t=document.getElementById("customDomain"),n=t?t.value.trim():"";if(!n){if(!r.custom_domain){m("Enter a domain to save, or keep the suggested value.","info");return}if(!confirm("Remove the custom domain and revert to the default internal URL?"))return;await rt(),await ee();return}const o={custom_domain:n,auto_generate:!1};try{const s=await fetch(`/projects/${r.id}/domain`,{method:"POST",headers:{Authorization:`Bearer ${e}`,"Content-Type":"application/json"},body:JSON.stringify(o)});if(!s.ok){const l=(await s.json().catch(()=>({}))).detail||"Failed to save domain";throw new Error(l)}const a=await s.json();m(`Domain saved: ${a.custom_domain}`,"success"),await ee()}catch(s){console.error("Failed to save domain:",s),m(s.message||"Failed to save domain","error")}}async function rt(){if(!r||!r.id){m("Select a project first","error");return}const e=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!e){m("Please login to manage domains","error");return}try{const t=await fetch(`/projects/${r.id}/domain`,{method:"DELETE",headers:{Authorization:`Bearer ${e}`}});if(!t.ok){const o=(await t.json().catch(()=>({}))).detail||"Failed to reset domain";throw new Error(o)}m("Domain removed. Project will use its internal URL.","success"),r&&(r.custom_domain=null,r.domain_status=null),await ee()}catch(t){console.error("Failed to clear domain:",t),m(t.message||"Failed to clear domain","error")}}function lt(e){de(e)}async function je(){const e=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!e){console.log("No auth token found");return}try{const t=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${e}`}});if(t.ok){const n=await t.json(),o=document.getElementById("projectSidebar");if(o){const s=o.querySelector("#projectSidebarUserName"),a=o.querySelector("#projectSidebarUserEmail"),i=o.querySelector("#projectSidebarUserAvatar");if(s&&(s.textContent=n.display_name||n.username||"User"),a&&(a.textContent=n.email||"No email"),i)if(n.avatar_url){const l=new Image;l.onload=()=>{i.style.backgroundImage=`url(${n.avatar_url})`,i.style.backgroundSize="cover",i.style.backgroundPosition="center",i.textContent=""},l.onerror=()=>{i.style.backgroundImage="",i.textContent=(n.display_name||n.username||"U").charAt(0).toUpperCase()},l.src=n.avatar_url}else i.style.backgroundImage="",i.textContent=(n.display_name||n.username||"U").charAt(0).toUpperCase()}}else console.error("Failed to load user profile:",t.status)}catch(t){console.error("Error loading user profile:",t)}}function W(e){if(!e)return"Recently";const n=Date.now()-new Date(e).getTime(),o=Math.floor(n/6e4),s=Math.floor(n/36e5),a=Math.floor(n/864e5);if(o<1)return"Just now";if(o<60)return`${o}m ago`;if(s<24)return`${s}h ago`;if(a<7)return`${a}d ago`;const i=new Date(e);return i.toLocaleDateString("en-US",{month:"short",day:"numeric",year:i.getFullYear()!==new Date().getFullYear()?"numeric":void 0})}function ue(e){return e?new Date(e).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit",hour12:!0,timeZone:"Asia/Kathmandu"}):"Unknown"}function Ce(e){if(!e||e==="No ports")return"No ports";const t=new Set;return e.split(",").forEach(o=>{const s=o.match(/(\d+)->(\d+)/);if(s){const a=s[1],i=s[2];t.add(`${a}:${i}`)}}),t.size===0?e:Array.from(t).sort().join(", ")}async function z(){await T();try{const e=await fetch("/deployments",{headers:$()});if(e.ok){const t=await e.json();document.getElementById("totalDeployments").textContent=t.length,document.getElementById("runningApps").textContent=t.filter(o=>o.status==="success").length;const n=document.getElementById("recentActivity");t.length>0?n.innerHTML=t.slice(0,5).map(o=>{const s=o.app_name||o.container_name||"Untitled Project";return`
          <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
            <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 0.25rem;">${w(s)}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">
              ${new Date(o.created_at).toLocaleString("en-US",{timeZone:"Asia/Kathmandu"})}
            </div>
          </div>
        `}).join(""):n.innerHTML='<p class="recent-activity-empty">No recent activity</p>'}}catch(e){console.error("Error loading dashboard:",e)}}async function ct(e){var p,u,y,g,f,b,C;if(e.preventDefault(),!K){m("Please login to deploy applications","error"),window.location.href="/login";return}const t=e.target,n=((p=document.getElementById("deploy-type"))==null?void 0:p.value)||"single",o=(u=document.getElementById("git-url"))==null?void 0:u.value.trim(),s=(y=document.getElementById("frontend-url"))==null?void 0:y.value.trim(),a=(g=document.getElementById("backend-url"))==null?void 0:g.value.trim(),i=document.getElementById("deploy-status"),l=document.getElementById("deploy-success");l.style.display="none",i.textContent="";const d=r==null?void 0:r.custom_domain,c=r!=null&&r.domain_status?r.domain_status.toLowerCase():null;if(!d){m("No custom domain configured. Configure one so end-users can reach the deployment.","warning"),qe(),i.textContent="Domain configuration required before deploy.",i.style.color="var(--error)";return}if(d&&c!=="active"&&m("Domain saved. It will activate after this deployment.","info"),n==="split"){if(!s||!s.startsWith("http")||!a||!a.startsWith("http")){i.textContent="Please enter valid Frontend and Backend repository URLs",i.style.color="var(--error)";return}}else if(!o||!o.startsWith("http")){i.textContent="Please enter a valid Git repository URL",i.style.color="var(--error)";return}i.textContent="🚀 Deploying...",i.style.color="var(--primary)";try{const k=new FormData;n==="split"?(k.append("deploy_type","split"),k.append("frontend_url",s),k.append("backend_url",a)):(k.append("deploy_type","single"),k.append("git_url",o)),typeof r=="object"&&r&&r.id&&k.append("project_id",String(r.id));const I=(f=document.getElementById("build-command"))==null?void 0:f.value.trim(),A=(b=document.getElementById("start-command"))==null?void 0:b.value.trim(),B=(C=document.getElementById("port"))==null?void 0:C.value.trim();I&&k.append("build_command",I),A&&k.append("start_command",A),B&&k.append("port",B);const S=await fetch("/deploy",{method:"POST",headers:$(),body:k}),h=await S.json();S.ok?(i.textContent="✅ Deployment successful!",i.style.color="var(--success)",h.deployed_url&&(l.style.display="block",document.getElementById("openAppBtn").href=h.deployed_url,document.getElementById("openAppBtn").textContent=`Open ${h.deployed_url}`),t.reset(),r&&r.isSplit?setTimeout(()=>{J(),z()},1500):setTimeout(()=>{z(),H.navigate("/applications")},2e3)):(i.textContent=`❌ Error: ${h.detail||"Deployment failed"}`,i.style.color="var(--error)")}catch{i.textContent="❌ Network error. Please try again.",i.style.color="var(--error)"}}async function be(e,t=null,n=null,o=!1){const s=document.getElementById("deploy-status"),a=document.getElementById("deploy-success");if(!K)return m("Please login to deploy applications","error"),window.location.href="/login",o?{success:!1,error:"Not authenticated"}:void 0;n||(a&&(a.style.display="none"),s&&(s.textContent="",s.style.color="var(--primary)"));try{const i=new FormData;i.append("deploy_type","single"),i.append("git_url",e),typeof r=="object"&&r&&r.id&&i.append("project_id",String(r.id)),t&&typeof r=="object"&&r&&r.project_type==="split"&&i.append("component_type",t),buildCommand&&i.append("build_command",buildCommand),startCommand&&i.append("start_command",startCommand),port&&i.append("port",port);const l=await fetch("/deploy",{method:"POST",headers:$(),body:i}),d=await l.json();if(l.ok){if(n){const c="success",p=t==="backend"?"Backend complete! ✅":"Frontend complete! ✅";t==="backend"?n.updateBackendStatus(c,p):t==="frontend"&&n.updateFrontendStatus(c,p)}else if(s&&(s.textContent="✅ Deployment successful!",s.style.color="var(--success)"),d.deployed_url&&a){a.style.display="block";const c=document.getElementById("openAppBtn");c&&(c.href=d.deployed_url,c.textContent=`Open ${d.deployed_url}`)}return o?{success:!0,deployed_url:d.deployed_url}:(r&&r.isSplit?setTimeout(()=>{J(),z()},1500):setTimeout(()=>{z(),H.navigate("/applications")},2e3),{success:!0,deployed_url:d.deployed_url})}else{const c=d.detail||"Deployment failed";if(n){const p="failed",u=`Error: ${c}`;t==="backend"?n.updateBackendStatus(p,u):t==="frontend"&&n.updateFrontendStatus(p,u)}else s&&(s.textContent=`❌ Error: ${c}`,s.style.color="var(--error)");if(o)return{success:!1,error:c}}}catch{const l="Network error. Please try again.";if(n){const d="failed",c=l;t==="backend"?n.updateBackendStatus(d,c):t==="frontend"&&n.updateFrontendStatus(d,c)}else s&&(s.textContent=`❌ ${l}`,s.style.color="var(--error)");if(o)return{success:!1,error:l}}}async function dt(){if(!K){document.getElementById("applicationsGrid").innerHTML=`
      <div class="empty-state">
        <p>Please login to view your applications</p>
        <a href="/login" class="btn-primary">Login</a>
      </div>
    `;return}try{const e=await fetch("/deployments",{headers:$()});if(e.ok){const t=await e.json(),n=document.getElementById("applicationsGrid");t.length===0?n.innerHTML=`
          <div class="empty-state">
            <p>No applications deployed yet</p>
            <a href="/deploy" class="btn-primary">Deploy Your First App</a>
          </div>
        `:n.innerHTML=t.map(o=>{const s=o.app_name||o.container_name||"Untitled Project";return`
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
        `}).join("")}}catch(e){console.error("Error loading applications:",e)}}async function ye(){if(!K){document.getElementById("historyTableBody").innerHTML=`
      <tr>
        <td colspan="4" class="empty-state">Please login to view deployment history</td>
      </tr>
    `;return}try{const e=await fetch("/deployments",{headers:$()});if(e.ok){const t=await e.json(),n=document.getElementById("historyTableBody");t.length===0?n.innerHTML=`
          <tr>
            <td colspan="4" class="empty-state">No deployment history</td>
          </tr>
        `:n.innerHTML=t.map(o=>{const s=o.app_name||o.container_name||"Untitled Project";return`
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
        `}).join("")}}catch(e){console.error("Error loading history:",e)}}async function pt(){if(confirm("Are you sure you want to clear all deployment history?"))try{(await fetch("/deployments/clear",{method:"DELETE",headers:$()})).ok&&(m("History cleared successfully","success"),ye())}catch{m("Error clearing history","error")}}async function mt(e){if(confirm(`Are you sure you want to destroy "${e}"?`))try{(await fetch(`/deployments/${e}`,{method:"DELETE",headers:$()})).ok?(m("Deployment destroyed successfully","success"),ye(),dt()):m("Error destroying deployment","error")}catch{m("Network error","error")}}let L=[],Ee="";async function _e(){const e=document.getElementById("usernameSearch").value.trim();if(!e){m("Please enter a GitHub username","error");return}e!==Ee&&(L=[],Ee=e);const t=document.getElementById("repositoriesGrid");t.innerHTML='<div class="empty-state"><p>Loading repositories...</p></div>';try{const n=await fetch(`/api/repositories/${e}`),o=await n.json();n.ok&&o.repositories?o.repositories.length===0?t.innerHTML='<div class="empty-state"><p>No repositories found</p></div>':(t.innerHTML=o.repositories.map(s=>`
          <div class="repository-card ${L.some(i=>i.url===s.clone_url)?"selected":""}" data-repo-url="${s.clone_url}" onclick="toggleRepositorySelection('${s.clone_url}', '${s.name}')">
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
        `).join(""),re()):t.innerHTML=`<div class="empty-state"><p>${o.detail||"Error loading repositories"}</p></div>`}catch{t.innerHTML='<div class="empty-state"><p>Error loading repositories</p></div>'}}function ut(e,t){const n=L.findIndex(o=>o.url===e);if(n>=0)L.splice(n,1),re();else{if(L.length>=2){m("You can only select up to 2 repositories for a split repository","error");return}L.push({url:e,name:t}),L.length===2&&yt(),re()}}function yt(){const[e,t]=L,n=document.createElement("div");n.className="modal-overlay",n.id="splitImportModal";const o=document.createElement("div");o.className="modal-content enhanced",o.innerHTML=`
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
        <div class="split-import-repo-name">${w(e.name)}</div>
        <div class="split-import-repo-url">${w(e.url)}</div>
      </div>
      
      <div class="split-import-divider"></div>
      
      <div class="split-import-repo-item">
        <div class="split-import-repo-label">Backend</div>
        <div class="split-import-repo-name">${w(t.name)}</div>
        <div class="split-import-repo-url">${w(t.url)}</div>
      </div>
    </div>
    
    <div class="split-import-actions">
      <button class="cancel-btn">Cancel</button>
      <button class="confirm-btn">Import Multi-Repository</button>
    </div>
  `,n.appendChild(o),document.body.appendChild(n);const s=o.querySelector(".cancel-btn"),a=o.querySelector(".confirm-btn"),i=()=>{document.body.removeChild(n)};s.onclick=()=>{i()},a.onclick=()=>{i();const[d,c]=L;Le(d.url,c.url,`${d.name}-${c.name}`)},n.onclick=d=>{d.target===n&&i()};const l=d=>{d.key==="Escape"&&(i(),document.removeEventListener("keydown",l))};document.addEventListener("keydown",l),a.focus()}function re(){const e=document.getElementById("repositoriesGrid");if(!e)return;e.querySelectorAll(".repository-card").forEach(n=>{const o=n.getAttribute("data-repo-url");L.some(a=>a.url===o)?n.classList.add("selected"):n.classList.remove("selected")})}function gt(){if(L.length!==2){m("Please select exactly 2 repositories","error");return}const[e,t]=L;confirm(`Import as Multi-Repository?

Frontend: ${e.name}
Backend: ${t.name}

Click OK to import these repositories as a multi-repository project.`)&&Le(e.url,t.url,`${e.name}-${t.name}`)}async function Le(e,t,n){const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o){m("Please login first","error");return}try{m("Importing multi-repositories...","info");const s=await fetch("/api/import-split",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${o}`},body:new URLSearchParams({frontend_url:e,backend_url:t,app_name:n})}),a=await s.json();if(s.ok){m("Multi-repository imported successfully! Navigate to Projects to see it.","success"),L=[];const i=document.getElementById("page-projects");i&&i.style.display!=="none"&&T(),document.getElementById("usernameSearch").value.trim()&&_e()}else m(a.detail||"Failed to import multi-repository","error")}catch(s){console.error("Error importing multi-repositories:",s),m("Failed to import multi-repository: "+s.message,"error")}}function ft(e){document.getElementById("git-url").value=e,H.navigate("/deploy"),m("Repository selected","success")}async function vt(e,t){const n=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!n){m("Please login first","error");return}try{m("Importing repository...","info");const o=await fetch("/api/import",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${n}`},body:new URLSearchParams({git_url:e,app_name:t||e.split("/").pop()||"Untitled Project"})}),s=await o.json();if(o.ok){m("Repository imported successfully! Navigate to Projects to see it.","success");const a=document.getElementById("page-projects");a&&a.style.display!=="none"&&T()}else m(s.detail||"Failed to import repository","error")}catch(o){console.error("Error importing repository:",o),m("Failed to import repository: "+o.message,"error")}}function ht(){document.getElementById("repositoriesGrid").innerHTML=`
    <div class="empty-state">
      <p>Search for a GitHub username to see their repositories</p>
            </div>
        `}function m(e,t="info"){const n=document.getElementById("toast");n.textContent=e,n.className=`toast show ${t}`,setTimeout(()=>{n.classList.remove("show")},3e3)}let G={},le=[];async function ge(){try{const e=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!e){const n=document.getElementById("envVarsList");n&&(n.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `),se();return}if(!r||!r.id){const n=document.getElementById("envVarsList");n&&(n.innerHTML=`
          <div class="empty-state">
            <p>Please select a project from the Projects page to manage environment variables</p>
          </div>
        `),se();return}const t=await fetch(`/api/env-vars?project_id=${r.id}`,{headers:{Authorization:`Bearer ${e}`}});if(t.ok){const n=await t.json();G=n.variables||{},le=n.vars_list||[],wt()}else if(t.status===401){localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),te();const n=document.getElementById("envVarsList");n&&(n.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `)}else console.error("Failed to load environment variables")}catch(e){console.error("Error loading environment variables:",e)}se()}function se(){const e=document.getElementById("importEnvBtn"),t=document.getElementById("addEnvVarBtn"),n=document.getElementById("importEnvCard"),o=document.getElementById("cancelImportBtn"),s=document.getElementById("importEnvForm"),a=document.getElementById("envDropZone"),i=document.getElementById("envFileInput"),l=document.getElementById("envDropZoneBrowse"),d=document.getElementById("envDropZoneFileName");if(e&&(e.onclick=()=>{n.style.display=n.style.display==="none"?"block":"none"}),o&&(o.onclick=()=>{n.style.display="none",i&&(i.value=""),d&&(d.textContent="",d.style.display="none")}),t&&(t.onclick=()=>{bt()}),i&&(i.onchange=c=>{var u;const p=(u=c.target.files)==null?void 0:u[0];d&&(p?(d.textContent=p.name,d.style.display="block"):(d.textContent="",d.style.display="none"))}),a&&i&&!a.dataset.bound){a.dataset.bound="true";const c=p=>{p.preventDefault(),p.stopPropagation()};["dragenter","dragover"].forEach(p=>{a.addEventListener(p,u=>{c(u),a.classList.add("is-dragover")})}),["dragleave","dragend"].forEach(p=>{a.addEventListener(p,u=>{c(u),a.classList.remove("is-dragover")})}),a.addEventListener("dragover",p=>{c(p),p.dataTransfer&&(p.dataTransfer.dropEffect="copy"),a.classList.add("is-dragover")}),a.addEventListener("drop",async p=>{var g;c(p),a.classList.remove("is-dragover");const u=(g=p.dataTransfer)==null?void 0:g.files;if(!u||!u.length)return;const[y]=u;if(d&&(d.textContent=y.name,d.style.display="block"),i)try{const f=new DataTransfer;f.items.add(y),i.files=f.files}catch(f){console.warn("Unable to sync dropped file with input element:",f)}try{await ke(y)}catch(f){console.error("Error importing dropped .env file:",f)}}),a.addEventListener("click",()=>{i.click()}),l&&l.addEventListener("click",p=>{p.preventDefault(),i.click()})}s&&(s.onsubmit=async c=>{var u;c.preventDefault();const p=(u=i==null?void 0:i.files)==null?void 0:u[0];p&&await ke(p)})}async function ke(e){try{if(!e){m("No file detected for import","error");return}m(`Importing ${e.name||".env"}...`,"info");const n=(await e.text()).split(`
`),o={};n.forEach(a=>{if(a=a.trim(),a&&!a.startsWith("#")&&a.includes("=")){const[i,...l]=a.split("="),d=l.join("=").trim().replace(/^["']|["']$/g,"");i.trim()&&(o[i.trim()]=d)}}),G={...G,...o},await ve(),document.getElementById("importEnvCard").style.display="none",document.getElementById("envFileInput").value="";const s=document.getElementById("envDropZoneFileName");s&&(s.textContent="",s.style.display="none"),m("Environment variables imported successfully!","success")}catch(t){console.error("Error importing .env file:",t),m("Failed to import .env file","error")}}function wt(){const e=document.getElementById("envVarsList");if(e){if(le.length===0){e.innerHTML=`
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
        ${le.map((t,n)=>{const o=t.updated_at?new Date(t.updated_at).toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kathmandu"}):"Never updated",s=t.project_id?'<span style="font-size: 0.75rem; background: var(--primary); color: white; padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Project</span>':'<span style="font-size: 0.75rem; background: var(--bg-tertiary); color: var(--text-secondary); padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Global</span>';return`
            <tr>
              <td class="name-col">
                <span class="lock-icon">🔒</span>
                <span class="var-name">${w(t.key)}</span>
                ${s}
              </td>
              <td class="updated-col">
                <span class="updated-time">${o}</span>
              </td>
              <td class="actions-col">
                <button class="icon-btn edit-btn" onclick="editEnvVarModal('${w(t.key)}')" title="Edit">
                  ✏️
                </button>
                <button class="icon-btn delete-btn" onclick="deleteEnvVar('${w(t.key)}')" title="Delete">
                  🗑️
                </button>
              </td>
            </tr>
          `}).join("")}
      </tbody>
    </table>
  `}}function bt(){fe()}function fe(e=null,t=""){const n=document.getElementById("envVarModal"),o=document.getElementById("modalVarKey"),s=document.getElementById("modalVarValue"),a=document.getElementById("modalTitle");e?(a.textContent="Update environment variable",o.value=e,o.readOnly=!0,s.value=t):(a.textContent="Add environment variable",o.value="",o.readOnly=!1,s.value=""),n.style.display="flex"}function xe(){const e=document.getElementById("envVarModal");e.style.display="none"}async function Et(){const e=document.getElementById("modalVarKey"),t=document.getElementById("modalVarValue"),n=e.value.trim(),o=t.value.trim();if(!n){m("Variable name is required","error");return}G[n]=o,await ve(),xe()}function $e(e){const t=G[e]||"";fe(e,t)}async function kt(e){$e(e)}async function It(e){confirm(`Are you sure you want to delete ${e}?`)&&(delete G[e],await ve(),m("Environment variable deleted","success"))}function Bt(e){const n=document.querySelectorAll(".env-var-row")[e];if(!n)return;const o=n.querySelector(".env-var-value input");o.type==="password"?o.type="text":o.type="password"}async function ve(){try{const e=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!r||!r.id){m("No project selected","error");return}(await fetch("/api/env-vars",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e}`},body:JSON.stringify({variables:G,project_id:r.id})})).ok?(await ge(),m("Environment variables saved successfully","success")):(console.error("Failed to save environment variables"),m("Failed to save environment variables","error"))}catch(e){console.error("Error saving environment variables:",e),m("Error saving environment variables","error")}}function St(){const e=document.getElementById("modalVarValue"),t=document.querySelector('#envVarModal button[onclick*="toggleModalValueVisibility"]');e&&t&&(e.type==="password"?(e.type="text",t.textContent="🙈 Hide"):(e.type="password",t.textContent="👁️ Show"))}function w(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}async function Pe(){try{const e=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!e)return;const t=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${e}`}});if(t.ok){const n=await t.json(),o=document.getElementById("userName"),s=document.getElementById("userEmail"),a=document.getElementById("userAvatar");localStorage.setItem("displayName",n.display_name||""),localStorage.setItem("userEmail",n.email||""),o&&(o.textContent=n.display_name||n.username||"User"),$t(n.display_name||n.username||"User"),s&&(s.textContent=n.email||"Logged in"),a&&(n.avatar_url?(a.style.backgroundImage=`url(${n.avatar_url})`,a.style.backgroundSize="cover",a.style.backgroundPosition="center",a.textContent=""):(a.style.backgroundImage="",a.textContent=(n.display_name||n.username||"U").charAt(0).toUpperCase()))}else t.status===401&&(localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),te())}catch(e){console.error("Error loading user profile:",e)}}async function De(){try{const e=localStorage.getItem("access_token")||localStorage.getItem("authToken"),t=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${e}`}});if(t.ok){const n=await t.json(),o=document.getElementById("username"),s=document.getElementById("email"),a=document.getElementById("displayName");o&&(o.value=n.username||""),s&&(s.value=n.email||""),a&&(a.value=n.display_name||"");const i=document.getElementById("avatarPreview"),l=document.getElementById("avatarInitial"),d=document.getElementById("removeAvatarBtn");if(n.avatar_url&&i)i.src=n.avatar_url,i.style.display="block",l&&(l.style.display="none"),d&&(d.style.display="block");else if(l){const c=n.display_name&&n.display_name.charAt(0).toUpperCase()||n.username&&n.username.charAt(0).toUpperCase()||"S";l.textContent=c,l.style.display="block"}}}catch(e){console.error("Error loading profile:",e)}jt()}function jt(){const e=document.getElementById("profileForm"),t=document.getElementById("avatarFile"),n=document.getElementById("removeAvatarBtn");e&&e.addEventListener("submit",xt),t&&t.addEventListener("change",_t),n&&n.addEventListener("click",Lt);const o=document.getElementById("changePasswordBtn"),s=document.getElementById("closePasswordModal"),a=document.getElementById("cancelPasswordBtn"),i=document.getElementById("updatePasswordBtn"),l=document.getElementById("passwordModal"),d=document.getElementById("modalNewPassword"),c=document.getElementById("strengthFill");o&&o.addEventListener("click",()=>{l&&(l.style.display="flex")}),s&&s.addEventListener("click",()=>{l&&(l.style.display="none")}),a&&a.addEventListener("click",()=>{l&&(l.style.display="none")}),l&&l.addEventListener("click",u=>{u.target===l&&(l.style.display="none")}),d&&d.addEventListener("input",u=>{const y=u.target.value;let g=0;y.length>=8&&(g+=25),/[a-z]/.test(y)&&/[A-Z]/.test(y)&&(g+=25),/\d/.test(y)&&(g+=25),/[!@#$%^&*(),.?":{}|<>]/.test(y)&&(g+=25),c&&(c.style.width=`${g}%`,g<50?c.style.background="#ef4444":g<75?c.style.background="#f59e0b":c.style.background="#10b981")}),i&&i.addEventListener("click",Ct);const p=document.getElementById("cancelProfileBtn");p&&p.addEventListener("click",async()=>{await De()})}async function Ct(){const e=document.getElementById("modalCurrentPassword"),t=document.getElementById("modalNewPassword"),n=document.getElementById("modalConfirmPassword"),o=document.getElementById("passwordModal");if(!e||!t||!n)return;const s=e.value,a=t.value,i=n.value;if(!s||!a||!i){m("Please fill in all password fields","error");return}if(a!==i){m("New passwords do not match","error");return}if(a.length<8){m("Password must be at least 8 characters","error");return}try{const l=localStorage.getItem("access_token")||localStorage.getItem("authToken"),d=new FormData;d.append("current_password",s),d.append("new_password",a);const c=await fetch("/api/user/profile",{method:"PUT",headers:{Authorization:`Bearer ${l}`},body:d}),p=await c.json();if(c.ok){m("Password updated successfully!","success"),o&&(o.style.display="none"),e.value="",t.value="",n.value="";const u=document.getElementById("strengthFill");u&&(u.style.width="0%")}else m(p.detail||p.message||"Failed to update password","error")}catch(l){console.error("Error updating password:",l),m("Network error. Please try again.","error")}}function _t(e){const t=e.target.files[0];if(t){const n=new FileReader;n.onload=o=>{const s=document.getElementById("avatarPreview"),a=document.getElementById("avatarInitial");s&&(s.src=o.target.result,s.style.display="block"),a&&(a.style.display="none");const i=document.getElementById("removeAvatarBtn");i&&(i.style.display="block")},n.readAsDataURL(t)}}function Lt(){const e=document.getElementById("avatarPreview"),t=document.getElementById("avatarInitial");e&&(e.src="",e.style.display="none"),t&&(t.style.display="block");const n=document.getElementById("removeAvatarBtn");n&&(n.style.display="none");const o=document.getElementById("avatarFile");o&&(o.value="")}async function xt(e){e.preventDefault();const t=document.getElementById("profileMessage");t&&(t.style.display="none");const n=new FormData,o=document.getElementById("email"),s=document.getElementById("displayName");o&&n.append("email",o.value),s&&n.append("display_name",s.value);const a=document.getElementById("avatarFile");a&&a.files[0]&&n.append("avatar",a.files[0]);const i=document.getElementById("avatarPreview");i&&i.style.display==="none"&&n.append("remove_avatar","true");try{const l=localStorage.getItem("access_token")||localStorage.getItem("authToken"),d=await fetch("/api/user/profile",{method:"PUT",headers:{Authorization:`Bearer ${l}`},body:n}),c=await d.json();if(d.ok)t&&(t.textContent="Profile updated successfully!",t.className="profile-message success",t.style.display="block"),c.username&&localStorage.setItem("username",c.username),await Pe(),m("Profile updated successfully!","success");else{const p=c.detail||c.message||"Failed to update profile";t&&(t.textContent=p,t.className="profile-message error",t.style.display="block"),m(p,"error"),console.error("Profile update failed:",c)}}catch(l){console.error("Error updating profile:",l),t&&(t.textContent="Network error. Please try again.",t.className="profile-message error",t.style.display="block"),m("Network error. Please try again.","error")}}window.destroyDeployment=mt;window.selectRepository=ft;window.importRepository=vt;window.editEnvVar=kt;window.deleteEnvVar=It;window.toggleEnvVarVisibility=Bt;window.saveEnvVarFromModal=Et;window.closeEnvVarModal=xe;window.toggleModalValueVisibility=St;window.editEnvVarModal=$e;window.showEnvVarModal=fe;window.selectProject=de;window.showProjectSidebar=ie;window.hideProjectSidebar=Xe;window.openProject=lt;window.loadUserProfileIntoProjectSidebar=je;window.openProjectSite=Ye;window.deleteProject=Ae;window.toggleRepositorySelection=ut;window.confirmSplitImport=gt;window.openProjectNameModal=Be;window.openSite=nt;function $t(e){const t=document.getElementById("teamName");t&&(t.textContent=`${e}'s team`),document.querySelectorAll(".project-owner").forEach(o=>{o.textContent=`${e}'s team`})}let D=null,Z=!1,V=[];function Pt(e){if(e==null)return null;if(typeof e!="string")return e;const t=e.trim();if(!t)return null;const n=t.indexOf("{");if(n===-1)return{message:t};const o=t.slice(n);try{return JSON.parse(o)}catch{return{message:t}}}function Dt(){const e=document.getElementById("logsContent");e&&(e.innerHTML='<p class="logs-connecting">Connecting to WebSocket...</p>',Ne(),Nt())}function Ne(){D&&D.close();const t=`${window.location.protocol==="https:"?"wss:":"ws:"}//${window.location.host}/ws/logs`;D=new WebSocket(t),D.onopen=()=>{console.log("Logs WebSocket connected"),R("Connected to logs stream","success"),V.length>0&&(V.forEach(n=>R(n.message,n.type)),V=[])},D.onmessage=n=>{const o=Pt(n.data);!o||!o.message||(Z?V.push({message:o.message,type:o.type||"info"}):R(o.message,o.type||"info"))},D.onerror=n=>{console.error("Logs WebSocket error:",n),R("WebSocket connection error","error")},D.onclose=()=>{console.log("Logs WebSocket disconnected"),R("Disconnected from logs stream","warning"),setTimeout(()=>{var n;((n=document.getElementById("page-logs"))==null?void 0:n.style.display)!=="none"&&Ne()},3e3)}}function R(e,t="info"){const n=document.getElementById("logsContent");if(!n)return;const o=new Date().toLocaleString("en-US",{timeZone:"Asia/Kathmandu",timeStyle:"medium",dateStyle:"short"}),s=document.createElement("div");s.className=`log-entry ${t}`,s.innerHTML=`
    <span class="log-timestamp">[${o}]</span>
    <span class="log-message">${w(e)}</span>
  `,n.appendChild(s),n.scrollTop=n.scrollHeight;const a=1e3,i=n.querySelectorAll(".log-entry");i.length>a&&i[0].remove()}function Nt(){const e=document.getElementById("clearLogsBtn"),t=document.getElementById("toggleLogsBtn");e&&e.addEventListener("click",()=>{const n=document.getElementById("logsContent");n&&(n.innerHTML="",V=[],R("Logs cleared","info"))}),t&&t.addEventListener("click",()=>{Z=!Z,t.textContent=Z?"Resume":"Pause",!Z&&V.length>0&&(V.forEach(n=>R(n.message,n.type)),V=[]),R(Z?"Logs paused":"Logs resumed","info")})}window.addEventListener("beforeunload",()=>{D&&D.close()});function Tt(){const e=document.getElementById("sidebarSearch"),t=document.getElementById("commandPalette"),n=document.getElementById("commandSearchInput"),o=document.querySelectorAll(".command-item");let s=-1;function a(){t&&(t.style.display="flex",n&&(n.focus(),n.value=""),s=-1,l())}function i(){t&&(t.style.display="none",s=-1)}function l(){const c=Array.from(o).filter(p=>p.style.display!=="none");o.forEach((p,u)=>{c.indexOf(p)===s?(p.classList.add("selected"),p.scrollIntoView({block:"nearest",behavior:"smooth"})):p.classList.remove("selected")})}function d(c){switch(i(),c){case"deploy":case"nav-deploy":window.router&&window.router.navigate("/deploy");break;case"add-env-var":window.showEnvVarModal&&window.showEnvVarModal();break;case"search-repos":case"nav-repositories":window.router&&window.router.navigate("/repositories");break;case"nav-projects":window.router&&window.router.navigate("/");break;case"nav-applications":window.router&&window.router.navigate("/applications");break;case"nav-history":window.router&&window.router.navigate("/history");break;case"nav-env-vars":window.router&&window.router.navigate("/env-vars");break;case"nav-settings":window.router&&window.router.navigate("/settings");break}}document.addEventListener("keydown",c=>{var p;if((c.metaKey||c.ctrlKey)&&c.key==="k"&&(c.preventDefault(),t&&t.style.display==="none"?a():i()),c.key==="Escape"&&t&&t.style.display!=="none"&&i(),t&&t.style.display!=="none"){const u=Array.from(o).filter(y=>y.style.display!=="none");if(c.key==="ArrowDown")c.preventDefault(),s=Math.min(s+1,u.length-1),l();else if(c.key==="ArrowUp")c.preventDefault(),s=Math.max(s-1,-1),l();else if(c.key==="Enter"&&s>=0){c.preventDefault();const g=(p=Array.from(o).filter(f=>f.style.display!=="none")[s])==null?void 0:p.getAttribute("data-action");g&&d(g)}}}),e&&e.addEventListener("click",a),t&&t.addEventListener("click",c=>{c.target===t&&i()}),o.forEach(c=>{c.addEventListener("click",()=>{const p=c.getAttribute("data-action");p&&d(p)})}),n&&n.addEventListener("input",c=>{const p=c.target.value.toLowerCase();o.forEach(u=>{u.querySelector(".command-text").textContent.toLowerCase().includes(p)?u.style.display="flex":u.style.display="none"}),s=-1,l()})}
