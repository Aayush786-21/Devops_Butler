import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */class ke{constructor(){this.routes={"/":"projects","/deploy":"deploy","/history":"history","/repositories":"repositories","/domain":"domain","/env-vars":"env-vars","/settings":"settings","/logs":"logs"},this.currentPage=null,this.init()}init(){document.querySelectorAll(".nav-item").forEach(t=>{t.addEventListener("click",e=>{e.preventDefault();const n=t.getAttribute("href");this.navigate(n)})}),window.addEventListener("popstate",()=>{this.loadPage(window.location.pathname)}),this.loadPage(window.location.pathname)}navigate(t){window.history.pushState({},"",t),this.loadPage(t)}loadPage(t){const e=this.routes[t]||"dashboard";if(e==="deploy"){r=null;const n=document.getElementById("projectSidebar");n&&(n.style.display="none");const s=document.getElementById("sidebar");s&&(s.style.display="block")}this.showPage(e),this.updateActiveNav(t),this.updatePageTitle(e),window.scrollTo({top:0,behavior:"smooth"})}showPage(t){document.querySelectorAll(".page").forEach(n=>{n.style.display="none"});const e=document.getElementById(`page-${t}`);if(e)e.style.display="block";else{const n=document.getElementById("page-dashboard");n&&(n.style.display="block")}this.currentPage=t,this.loadPageData(t)}updateActiveNav(t){document.querySelectorAll(".nav-item").forEach(e=>{e.classList.remove("active"),e.getAttribute("href")===t&&e.classList.add("active")})}updatePageTitle(t){const e={projects:"Projects",deploy:"Deploy",history:"History",repositories:"Repositories",domain:"Domain","env-vars":"Environmental Variables",settings:"Settings",logs:"Logs"};document.getElementById("pageTitle").textContent=e[t]||"Dashboard"}loadPageData(t){switch(t){case"projects":M();break;case"history":oe();break;case"repositories":Ze();break;case"domain":Ae();break;case"env-vars":W();break;case"settings":rt();break;case"logs":we();break}}}const H=new ke;window.router=H;async function Ie(o){const t=await je();if(!t)return;const e=I.find(a=>a.id==o),n=e?e.name:"this project";if(await Be(n))try{console.log("Deleting project with token:",t.substring(0,20)+"...");const a=await fetch(`/projects/${o}`,{method:"DELETE",headers:{Authorization:`Bearer ${t}`}});if(console.log("Delete response status:",a.status),!a.ok){const i=await a.json().catch(()=>({}));if(console.error("Delete error response:",i),a.status===401){u("Session expired. Please login again.","error"),localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),setTimeout(()=>{window.location.href="/login"},2e3);return}throw new Error(i.detail||"Failed to delete project")}I=I.filter(i=>i.id!=o),L=L.filter(i=>i.id!=o),A(L),u("Project deleted","success")}catch(a){console.error("Delete project error:",a),u(`Delete failed: ${a.message}`,"error")}}function Be(o){return new Promise(t=>{const e=document.createElement("div");e.className="modal-overlay";const n=document.createElement("div");n.className="delete-confirmation-modal",n.innerHTML=`
      <h3>Delete Project</h3>
      <p>
        Are you sure you want to delete <strong>${h(o)}</strong>?<br>
        This will stop and remove its container and image.
      </p>
      <div class="delete-confirmation-actions">
        <button class="cancel-btn">Cancel</button>
        <button class="delete-btn">Delete</button>
      </div>
    `,e.appendChild(n),document.body.appendChild(e);const s=n.querySelector(".cancel-btn"),a=n.querySelector(".delete-btn"),i=()=>{document.body.removeChild(e)};s.onclick=()=>{i(),t(!1)},a.onclick=()=>{i(),t(!0)},e.onclick=c=>{c.target===e&&(i(),t(!1))},a.focus()})}function Se(o){try{const e=JSON.parse(atob(o.split(".")[1])).exp*1e3,n=Date.now();return e<n+5*60*1e3}catch{return!0}}async function je(){const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");return!o||Se(o)?(u("Session expired. Please login again.","error"),localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),setTimeout(()=>{window.location.href="/login"},2e3),null):o}let U=localStorage.getItem("access_token")||localStorage.getItem("authToken"),X=localStorage.getItem("username");document.addEventListener("DOMContentLoaded",()=>{z(),window.location.pathname==="/login"||window.location.pathname.includes("login.html")||setTimeout(()=>{if(U&&X){Ce(),yt();const t=document.getElementById("page-projects");t&&window.location.pathname==="/"&&(t.style.display="block")}},100)});function z(){const o=document.getElementById("userSection"),t=document.getElementById("authButtons"),e=document.getElementById("logoutBtn"),n=document.getElementById("newDeployBtn");document.getElementById("userName"),document.getElementById("userEmail"),document.getElementById("userAvatar");const s=window.location.pathname==="/login"||window.location.pathname.includes("login.html");U&&X?(o.style.display="flex",t.style.display="none",e.style.display="block",n.style.display="block",he(),M(),s&&(window.location.href="/")):(o.style.display="none",t.style.display="block",e.style.display="none",n.style.display="none",s||(window.location.href="/login"))}function Ce(){var a,i;document.getElementById("logoutBtn").addEventListener("click",()=>{localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),U=null,X=null,z(),u("Logged out successfully","success"),H.navigate("/")});const o=document.getElementById("projectsSearch");o&&o.addEventListener("input",c=>{const d=c.target.value.toLowerCase();L=I.filter(l=>l.name.toLowerCase().includes(d)||l.repository&&l.repository.toLowerCase().includes(d)),A(L)});const t=document.getElementById("addProjectBtn");t&&t.addEventListener("click",()=>{window.router&&window.router.navigate("/deploy")});const e=document.getElementById("browseUploadLink");e&&e.addEventListener("click",c=>{c.preventDefault(),window.router&&window.router.navigate("/deploy")}),document.getElementById("newDeployBtn").addEventListener("click",()=>{r=null;const c=document.getElementById("projectSidebar");c&&(c.style.display="none");const d=document.getElementById("sidebar");d&&(d.style.display="block"),H.navigate("/deploy")});const n=document.getElementById("deployForm");n&&n.addEventListener("submit",He);const s=document.getElementById("deploy-type");s&&s.addEventListener("change",c=>{const d=document.getElementById("single-repo-group"),l=document.getElementById("split-repo-group"),p=document.getElementById("git-url");c.target.value==="split"?(d.style.display="none",l.style.display="block",p&&p.removeAttribute("required")):(d.style.display="block",l.style.display="none",p&&p.setAttribute("required","required"))}),(a=document.getElementById("clearHistoryBtn"))==null||a.addEventListener("click",Oe),(i=document.getElementById("searchReposBtn"))==null||i.addEventListener("click",ye),Le()}function Le(){const o=document.querySelector(".search-input"),t=document.getElementById("spotlightModal"),e=document.getElementById("spotlightSearch"),n=document.getElementById("spotlightResults");!o||!t||!e||!n||(o.addEventListener("click",xe),t.addEventListener("click",s=>{s.target===t&&Y()}),e.addEventListener("input",Pe),n.addEventListener("click",Te),document.addEventListener("keydown",s=>{s.key==="Escape"&&t.style.display!=="none"&&Y()}))}function xe(){const o=document.getElementById("spotlightModal"),t=document.getElementById("spotlightSearch");o.style.display="flex",setTimeout(()=>{t.focus()},100)}function Y(){const o=document.getElementById("spotlightModal"),t=document.getElementById("spotlightSearch"),e=document.getElementById("spotlightResults");o.style.display="none",t.value="",e.innerHTML=`
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
  `}function Pe(o){const t=o.target.value.toLowerCase().trim(),e=document.getElementById("spotlightResults");if(!t){e.innerHTML=`
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
    `;return}const n=_e(t);$e(n)}function _e(o){const t={projects:[],actions:[],navigation:[]};I&&I.length>0&&(t.projects=I.filter(s=>s.name.toLowerCase().includes(o)||s.repository&&s.repository.toLowerCase().includes(o)));const e=[{name:"New Deploy",action:"new-deploy",icon:"🚀"},{name:"Repositories",action:"repositories",icon:"📁"},{name:"History",action:"history",icon:"📜"},{name:"Settings",action:"settings",icon:"⚙️"},{name:"Domain",action:"domain",icon:"🌐"}];t.actions=e.filter(s=>s.name.toLowerCase().includes(o));const n=[{name:"Projects",action:"projects",icon:"📊"},{name:"Repositories",action:"repositories",icon:"📁"},{name:"History",action:"history",icon:"📜"},{name:"Domain",action:"domain",icon:"🌐"},{name:"Settings",action:"settings",icon:"⚙️"}];return t.navigation=n.filter(s=>s.name.toLowerCase().includes(o)),t}function $e(o){const t=document.getElementById("spotlightResults");let e='<div class="search-results">';o.projects.length>0&&(e+='<div class="search-category">',e+='<div class="search-category-title">Projects</div>',o.projects.forEach(n=>{const s=n.status==="running"?"🚀":"📦",a=n.status==="running"?"RUNNING":n.status==="failed"?"FAILED":"IMPORTED";e+=`
        <div class="search-result-item" data-type="project" data-id="${n.id}">
          <span class="search-result-icon">${s}</span>
          <div class="search-result-content">
            <div class="search-result-title">${h(n.name)}</div>
            <div class="search-result-subtitle">${n.repository||"No repository"}</div>
          </div>
          <span class="search-result-badge">${a}</span>
        </div>
      `}),e+="</div>"),o.actions.length>0&&(e+='<div class="search-category">',e+='<div class="search-category-title">Actions</div>',o.actions.forEach(n=>{e+=`
        <div class="search-result-item" data-type="action" data-action="${n.action}">
          <span class="search-result-icon">${n.icon}</span>
          <div class="search-result-content">
            <div class="search-result-title">${n.name}</div>
          </div>
        </div>
      `}),e+="</div>"),o.navigation.length>0&&(e+='<div class="search-category">',e+='<div class="search-category-title">Navigation</div>',o.navigation.forEach(n=>{e+=`
        <div class="search-result-item" data-type="navigation" data-action="${n.action}">
          <span class="search-result-icon">${n.icon}</span>
          <div class="search-result-content">
            <div class="search-result-title">${n.name}</div>
          </div>
        </div>
      `}),e+="</div>"),o.projects.length===0&&o.actions.length===0&&o.navigation.length===0&&(e=`
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <p>No results found for "${h(document.getElementById("spotlightSearch").value)}"</p>
      </div>
    `),e+="</div>",t.innerHTML=e}function Te(o){const t=o.target.closest(".suggestion-item, .search-result-item");if(!t)return;const e=t.dataset.action,n=t.dataset.type,s=t.dataset.id;if(Y(),n==="project"&&s)ee(parseInt(s));else if(e)switch(e){case"new-deploy":window.router&&window.router.navigate("/deploy");break;case"repositories":window.router&&window.router.navigate("/repositories");break;case"history":window.router&&window.router.navigate("/history");break;case"domain":window.router&&window.router.navigate("/domain");break;case"settings":window.router&&window.router.navigate("/settings");break;case"projects":window.router&&window.router.navigate("/projects");break}}function Ae(){document.getElementById("page-domain")}function _(){const o={},t=localStorage.getItem("access_token")||localStorage.getItem("authToken");return t&&(o.Authorization=`Bearer ${t}`),o}let I=[],L=[];async function M(){const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o){A([]);return}Ne();try{const t=await fetch("/deployments",{headers:{Authorization:`Bearer ${o}`}});t.ok?(I=(await t.json()).map(n=>{var b;const s=n.git_url||"",a=s,i=s?(b=String(s).split("/").pop())==null?void 0:b.replace(/\.git$/,""):null,c=n.app_name||i||n.container_name||"Untitled Project",d=(n.status||"").toLowerCase();let l;d==="running"?l="running":d==="failed"||d==="error"?l="failed":l="imported";let p=!1,y="single",m=null,v=null;const f=String(n.git_url||""),F=f.startsWith("split::"),B=!n.parent_project_id&&!n.component_type;if(F){p=!0,y="split";try{const E=f.replace("split::","").split("|");E.length===2&&(m=E[0],v=E[1])}catch{}}else if(d==="imported_split")p=!0,y="split";else if(B&&f.includes("|")){p=!0,y="split";try{const E=f.split("|");E.length===2&&(m=E[0],v=E[1])}catch{}}return{id:n.id,name:c,status:l,url:n.deployed_url||n.app_url,createdAt:n.created_at,updatedAt:n.updated_at,repository:a,repository_url:a,git_url:s,project_type:y,isSplit:p,frontend_url:m,backend_url:v,containerUptime:n.container_uptime||"Unknown",containerPorts:n.container_ports||"No ports",containerImage:n.container_image||"Unknown",containerStatus:n.container_status||"Unknown",isRunning:n.is_running||!1}}),L=[...I],A(L)):A([])}catch(t){console.error("Error loading projects:",t),A([])}}function A(o){const t=document.getElementById("projectsGrid");if(t){if(o.length===0){t.innerHTML=`
      <div class="empty-state">
        <p>No projects found</p>
        <button class="btn-primary" onclick="if(window.router){window.router.navigate('/deploy');}else{window.location.href='/deploy';}">Create First Project</button>
      </div>
    `;return}t.innerHTML=o.map(e=>{const n=e.status==="running"?"status-success":e.status==="failed"?"status-error":"status-info",s=e.status==="running"?"Running":e.status==="failed"?"Failed":"Imported",a=e.status==="running"?"🚀":"📦",i=e.updatedAt?q(e.updatedAt):"Recently";return`
      <div class="project-card" data-project-id="${e.id}" onclick="selectProject(${e.id})">
        <div class="project-header">
          <div class="project-icon">${a}</div>
          <div class="project-status ${n}">${s}</div>
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
      `}).join("")}}async function De(o){try{const t=I.find(e=>e.id===o);if(!t){u("Project not found","error");return}if(!t.url||t.url==="#"){u("Project URL not available. Make sure the project is deployed.","error");return}window.open(t.url,"_blank"),u(`Opening ${t.name}...`,"info")}catch(t){console.error("Error opening project site:",t),u("Failed to open project site: "+t.message,"error")}}function Ne(){const o=document.getElementById("projectsGrid");o&&(o.innerHTML=`
    <div class="loading-skeleton">
      ${Array(3).fill(`
        <div class="skeleton-card">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line short"></div>
        </div>
      `).join("")}
    </div>
  `)}let r=null;function ee(o){M().then(()=>{const e=I.find(n=>n.id==o);if(!e){const n=L.find(s=>s.id==o);n&&(r=n,J(n));return}r=e,J(e)});const t=document.getElementById("page-project-config");t&&t.style.display!=="none"&&te()}function J(o){const t=document.getElementById("sidebar");t&&(t.style.display="none");let e=document.getElementById("projectSidebar");e||(e=Ue(),document.body.appendChild(e));const n=e.querySelector("#projectSidebarName");n&&(n.textContent=o.name);const s=e.querySelector("#projectSidebarId");s&&(s.textContent=o.id),e.style.display="block",document.getElementById("pageTitle").textContent=o.name,pe(),ce("deploy")}function Ue(){const o=document.createElement("aside");return o.id="projectSidebar",o.className="sidebar project-sidebar",o.innerHTML=`
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
  `,o.querySelectorAll(".project-nav-item").forEach(t=>{t.addEventListener("click",e=>{e.preventDefault();const n=t.getAttribute("data-project-page");ce(n),o.querySelectorAll(".project-nav-item").forEach(s=>s.classList.remove("active")),t.classList.add("active")})}),o}function Me(){const o=document.getElementById("projectSidebar");o&&(o.style.display="none");const t=document.getElementById("sidebar");t&&(t.style.display="block"),r=null,document.getElementById("pageTitle").textContent="Projects",document.querySelectorAll(".page").forEach(n=>{n.style.display="none"});const e=document.getElementById("page-projects");e&&(e.style.display="block"),M()}function ce(o){var t;switch(document.querySelectorAll(".page").forEach(e=>{e.style.display="none"}),o){case"deploy":const e=document.getElementById("page-deploy");if(e){e.style.display="block";const a=(t=e.querySelector(".card h2"))==null?void 0:t.closest(".card");if(r){a&&(a.style.display="block");const b=document.getElementById("project-components-section");((r==null?void 0:r.project_type)||(r!=null&&r.isSplit?"split":"single"))==="split"?T():b&&(b.style.display="none")}else{a&&(a.style.display="block");const b=document.getElementById("project-components-section");b&&(b.style.display="none")}document.getElementById("deploy-type");const i=document.getElementById("deploy-type-group"),c=document.getElementById("single-repo-group"),d=document.getElementById("split-repo-group"),l=document.getElementById("split-deploy-layout"),p=document.getElementById("git-url"),y=document.getElementById("frontend-url"),m=document.getElementById("backend-url"),v=document.getElementById("deploy-submit-default");e.querySelectorAll(".dynamic-split-btn").forEach(b=>b.remove());let f=r==null?void 0:r.project_type;const F=(r==null?void 0:r.git_url)||(r==null?void 0:r.repository_url)||"",B=F.startsWith("split::");if(f||(r!=null&&r.isSplit||B?f="split":f="single"),B&&f!=="split"?(console.warn("Project type mismatch detected. git_url indicates split but project_type is",f),f="split"):!B&&f==="split"&&F&&(console.warn("Project type mismatch detected. git_url indicates single but project_type is split"),f="single"),r)if(i&&(i.style.display="none"),f==="split"){c&&(c.style.display="none"),d&&(d.style.display="none"),l&&(l.style.display="block"),y&&(y.value=r.frontend_url||""),m&&(m.value=r.backend_url||""),p&&p.removeAttribute("required"),v&&(v.style.display="none");const b=document.getElementById("deploy-frontend-btn"),E=document.getElementById("deploy-backend-btn"),ae=document.getElementById("deploy-both-btn");b&&(b.onclick=async()=>{var x;const S=(x=y==null?void 0:y.value)==null?void 0:x.trim();if(!S||!S.startsWith("http"))return u("Enter a valid frontend URL","error");const w=K(!1);document.getElementById("step-frontend").style.display="flex",w.updateFrontendStatus("deploying","Deploying your frontend now...");const g=await O(S,"frontend",w,!0);g&&g.success&&g.deployed_url?(w.showUrls(g.deployed_url,null),document.getElementById("close-deployment-dialog").onclick=()=>{w.close(),T(),D()}):g&&!g.success&&setTimeout(()=>w.close(),3e3)}),E&&(E.onclick=async()=>{var x;const S=(x=m==null?void 0:m.value)==null?void 0:x.trim();if(!S||!S.startsWith("http"))return u("Enter a valid backend URL","error");const w=K(!1);document.getElementById("step-backend").style.display="flex",w.updateBackendStatus("deploying","Deploying your backend now...");const g=await O(S,"backend",w,!0);g&&g.success&&g.deployed_url?(w.showUrls(null,g.deployed_url),document.getElementById("close-deployment-dialog").onclick=()=>{w.close(),T(),D()}):g&&!g.success&&setTimeout(()=>w.close(),3e3)}),ae&&(ae.onclick=async()=>{var x,ie;const S=(x=y==null?void 0:y.value)==null?void 0:x.trim(),w=(ie=m==null?void 0:m.value)==null?void 0:ie.trim();if(!S||!S.startsWith("http")||!w||!w.startsWith("http")){u("Please enter valid Frontend and Backend repository URLs","error");return}const g=K(!0);try{g.updateBackendStatus("deploying","Deploying your backend now...");const $=await O(w,"backend",g,!0);if(!$||!$.success){g.updateBackendStatus("failed",($==null?void 0:$.error)||"Backend deployment failed"),setTimeout(()=>g.close(),3e3);return}g.updateBackendStatus("success","Backend complete! ✅"),await new Promise(Ee=>setTimeout(Ee,500)),g.updateFrontendStatus("deploying","Deploying your frontend...");const V=await O(S,"frontend",g,!0);if(!V||!V.success){g.updateFrontendStatus("failed",(V==null?void 0:V.error)||"Frontend deployment failed"),setTimeout(()=>g.close(),3e3);return}g.updateFrontendStatus("success","Frontend complete! ✅"),g.showUrls(V.deployed_url,$.deployed_url),document.getElementById("close-deployment-dialog").onclick=()=>{g.close(),T(),D()}}catch{g.updateBackendStatus("failed","Network error"),g.updateFrontendStatus("failed","Network error"),setTimeout(()=>g.close(),3e3)}}),v&&(v.style.display="none"),T()}else f==="single"&&(c&&(c.style.display="block"),d&&(d.style.display="none"),l&&(l.style.display="none"),p&&r&&r.repository_url&&(p.value=r.repository_url),v&&(v.textContent="🚀 Deploy",v.style.display=""));else i&&(i.style.display=""),d&&(d.style.display="none"),l&&(l.style.display="none"),c&&(c.style.display="block"),p&&(p.value=""),v&&(v.textContent="🚀 Deploy",v.style.display="")}document.getElementById("pageTitle").textContent="Deploy";break;case"configuration":Fe();break;case"logs":const n=document.getElementById("page-logs");n&&(n.style.display="block",we());break;case"domain-config":Ve();break;case"env-vars":const s=document.getElementById("page-env-vars");s&&(s.style.display="block",W());break}}async function Fe(){let o=document.getElementById("page-project-config");o||(o=document.createElement("div"),o.id="page-project-config",o.className="page",o.innerHTML=`
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
              <span class="config-value-text" id="projectConfigUpdated">${r!=null&&r.updatedAt?q(new Date(r.updatedAt)):"Unknown"}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Container Ports:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigPorts">${r!=null&&r.containerPorts?me(r.containerPorts):"No ports"}</span>
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
    `,document.getElementById("pageContent").appendChild(o));const t=document.getElementById("project-components-section");t&&(t.style.display="none"),te();const e=document.getElementById("changeProjectNameBtn");e&&(e.onclick=()=>de()),o.style.display="block"}async function T(){if(!(!r||!r.id))try{const o=await fetch(`/projects/${r.id}/components`,{headers:_()});if(!o.ok)return;const e=(await o.json()).components||[],n=e.find(m=>m.component_type==="frontend"),s=e.find(m=>m.component_type==="backend"),a=n&&n.status&&n.status!=="imported"&&n.status!=="imported_split",i=s&&s.status&&s.status!=="imported"&&s.status!=="imported_split",c=a&&i;let d=document.getElementById("project-components-section");const l=document.getElementById("page-deploy"),p=document.getElementById("page-project-config"),y=p==null?void 0:p.querySelector("#project-components-section");if(y&&y.remove(),c&&l&&l.style.display!=="none"){if(!d){d=document.createElement("div"),d.id="project-components-section",d.className="card project-components-card";const B=l.querySelector(".card");B?l.insertBefore(d,B):l.appendChild(d)}d.style.display="block";const m=n?n.status==="running"?"RUNNING":n.status.toUpperCase():"NOT DEPLOYED",v=s?s.status==="running"?"RUNNING":s.status.toUpperCase():"NOT DEPLOYED",f=(n==null?void 0:n.status)==="running"?"status-success":(n==null?void 0:n.status)==="failed"?"status-error":"status-info",F=(s==null?void 0:s.status)==="running"?"status-success":(s==null?void 0:s.status)==="failed"?"status-error":"status-info";d.innerHTML=`
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
              ${n?`
                <svg class="icon-clock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                <span>Updated ${n.updated_at?q(new Date(n.updated_at)):"Recently"}</span>
              `:"<span>Not deployed yet</span>"}
            </div>
            ${n&&n.status==="running"?`
              <div class="project-metrics">
                <div class="metric">
                  <span class="metric-label">Uptime</span>
                  <span class="metric-value">${n.container_uptime||"Unknown"}</span>
                </div>
              </div>
            `:""}
          </div>
          ${n&&n.deployed_url?`
            <div class="project-footer">
              <button class="btn-dark btn-block btn-open-site" onclick="openSite('${n.deployed_url}')">Open Frontend</button>
            </div>
          `:""}
        </div>
        
        <!-- Backend Card -->
        <div class="project-card" style="margin: 0;">
          <div class="project-header">
            <div class="project-icon">💻</div>
            <div class="project-status ${F}">${v}</div>
          </div>
          <div class="project-info">
            <h3 class="project-name">Backend</h3>
            <div class="project-meta">
              ${s?`
                <svg class="icon-clock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                <span>Updated ${s.updated_at?q(new Date(s.updated_at)):"Recently"}</span>
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
    `,requestAnimationFrame(()=>{d.classList.add("components-visible");const B=l.querySelector(".card:not(#project-components-section)");B&&B.classList.add("deploy-card-slide-down")})}else if(d){d.style.display="none",d.classList.remove("components-visible");const m=l==null?void 0:l.querySelector(".card:not(#project-components-section)");m&&m.classList.remove("deploy-card-slide-down")}}catch(o){console.error("Error loading project components:",o)}}function K(o=!0){const t=document.createElement("div");t.className="modal-overlay deployment-progress-overlay",t.id="deploymentProgressOverlay";const e=document.createElement("div");return e.className="deployment-progress-modal",e.innerHTML=`
    <div class="deployment-progress-header">
      <h3>🚀 Deployment in Progress</h3>
    </div>
    <div class="deployment-progress-body">
      <div class="progress-steps">
        <div class="progress-step" id="step-backend" ${o?"":'style="display: none;"'}>
          <div class="step-icon">⏳</div>
          <div class="step-content">
            <div class="step-title">Backend</div>
            <div class="step-message" id="backend-message">Waiting...</div>
          </div>
          <div class="step-status" id="backend-status"></div>
        </div>
        <div class="progress-step" id="step-frontend" ${o?"":'style="display: none;"'}>
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
  `,t.appendChild(e),document.body.appendChild(t),{overlay:t,updateBackendStatus:(n,s)=>{const a=document.getElementById("step-backend"),i=a.querySelector(".step-icon"),c=document.getElementById("backend-status"),d=document.getElementById("backend-message");d.textContent=s,n==="deploying"?(i.textContent="⏳",c.textContent="",a.classList.remove("completed","failed"),a.classList.add("active")):n==="success"?(i.textContent="✅",c.textContent="✓",a.classList.remove("active","failed"),a.classList.add("completed")):n==="failed"&&(i.textContent="❌",c.textContent="✗",a.classList.remove("active","completed"),a.classList.add("failed"))},updateFrontendStatus:(n,s)=>{const a=document.getElementById("step-frontend"),i=a.querySelector(".step-icon"),c=document.getElementById("frontend-status"),d=document.getElementById("frontend-message");d.textContent=s,n==="deploying"?(i.textContent="⏳",c.textContent="",a.classList.remove("completed","failed"),a.classList.add("active")):n==="success"?(i.textContent="✅",c.textContent="✓",a.classList.remove("active","failed"),a.classList.add("completed")):n==="failed"&&(i.textContent="❌",c.textContent="✗",a.classList.remove("active","completed"),a.classList.add("failed"))},showUrls:(n,s)=>{const a=document.getElementById("deployment-urls"),i=document.getElementById("frontend-url-link"),c=document.getElementById("backend-url-link"),d=document.getElementById("close-deployment-dialog");n?(i.href=n,i.textContent=n,i.closest(".url-item").style.display="flex"):i.closest(".url-item").style.display="none",s?(c.href=s,c.textContent=s,c.closest(".url-item").style.display="flex"):c.closest(".url-item").style.display="none",a.style.display="block",d.style.display="block"},close:()=>{const n=document.getElementById("deploymentProgressOverlay");n&&document.body.removeChild(n)}}}function de(){if(!r){u("No project selected","error");return}const o=document.createElement("div");o.className="modal-overlay";const t=document.createElement("div");t.className="modal-content enhanced",t.innerHTML=`
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
  `,o.appendChild(t),document.body.appendChild(o);const e=document.getElementById("newProjectNameInput");e&&(e.focus(),e.select());const n=t.querySelector(".cancel-name-btn"),s=t.querySelector(".save-name-btn"),a=()=>{document.body.removeChild(o)};n.onclick=()=>{a()},s.onclick=async()=>{const c=e.value.trim();if(!c){u("Project name cannot be empty","error");return}if(c===r.name){a();return}try{const d=localStorage.getItem("access_token")||localStorage.getItem("authToken"),l=await fetch(`/projects/${r.id}/name`,{method:"PUT",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${d}`},body:new URLSearchParams({app_name:c})}),p=await l.json();if(l.ok){u("Project name updated successfully!","success"),r.name=c,a();const y=I.findIndex(v=>v.id===r.id);y>=0&&(I[y].name=c),te(),A(L);const m=document.getElementById("projectSidebarName");m&&(m.textContent=c),document.getElementById("pageTitle").textContent=c}else u(p.detail||"Failed to update project name","error")}catch(d){console.error("Error updating project name:",d),u("Failed to update project name: "+d.message,"error")}},o.onclick=c=>{c.target===o&&a()};const i=c=>{c.key==="Escape"&&(a(),document.removeEventListener("keydown",i))};document.addEventListener("keydown",i)}function te(){if(!r)return;const o=document.getElementById("projectConfigName"),t=document.getElementById("projectConfigOwner"),e=document.getElementById("projectConfigId"),n=document.getElementById("projectConfigCreated"),s=document.getElementById("projectConfigUpdated"),a=document.getElementById("projectConfigPorts"),i=document.getElementById("projectConfigImage"),c=document.getElementById("projectConfigStatus");if(o&&(o.textContent=r.name||"Unknown"),t){const d=localStorage.getItem("username"),l=localStorage.getItem("displayName");t.textContent=l||d||"Unknown User"}e&&(e.textContent=r.id||"-"),n&&(n.textContent=r.createdAt?ue(r.createdAt):"Unknown"),s&&(s.textContent=r.updatedAt?q(new Date(r.updatedAt)):"Unknown"),a&&(a.textContent=r.containerPorts?me(r.containerPorts):"No ports"),i&&(i.textContent=r.containerImage||"Unknown"),c&&(c.textContent=r.containerStatus||"Unknown")}function Ve(){let o=document.getElementById("page-project-domain");o||(o=document.createElement("div"),o.id="page-project-domain",o.className="page",o.innerHTML=`
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
    `,document.getElementById("pageContent").appendChild(o)),o.style.display="block"}function Re(o){ee(o)}async function pe(){const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o){console.log("No auth token found");return}try{const t=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${o}`}});if(t.ok){const e=await t.json(),n=document.getElementById("projectSidebar");if(n){const s=n.querySelector("#projectSidebarUserName"),a=n.querySelector("#projectSidebarUserEmail"),i=n.querySelector("#projectSidebarUserAvatar");if(s&&(s.textContent=e.display_name||e.username||"User"),a&&(a.textContent=e.email||"No email"),i)if(e.avatar_url){const c=new Image;c.onload=()=>{i.style.backgroundImage=`url(${e.avatar_url})`,i.style.backgroundSize="cover",i.style.backgroundPosition="center",i.textContent=""},c.onerror=()=>{i.style.backgroundImage="",i.textContent=(e.display_name||e.username||"U").charAt(0).toUpperCase()},c.src=e.avatar_url}else i.style.backgroundImage="",i.textContent=(e.display_name||e.username||"U").charAt(0).toUpperCase()}}else console.error("Failed to load user profile:",t.status)}catch(t){console.error("Error loading user profile:",t)}}function q(o){if(!o)return"Recently";const e=Date.now()-new Date(o).getTime(),n=Math.floor(e/6e4),s=Math.floor(e/36e5),a=Math.floor(e/864e5);if(n<1)return"Just now";if(n<60)return`${n}m ago`;if(s<24)return`${s}h ago`;if(a<7)return`${a}d ago`;const i=new Date(o);return i.toLocaleDateString("en-US",{month:"short",day:"numeric",year:i.getFullYear()!==new Date().getFullYear()?"numeric":void 0})}function ue(o){return o?new Date(o).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit",hour12:!0,timeZone:"Asia/Kathmandu"}):"Unknown"}function me(o){if(!o||o==="No ports")return"No ports";const t=new Set;return o.split(",").forEach(n=>{const s=n.match(/(\d+)->(\d+)/);if(s){const a=s[1],i=s[2];t.add(`${a}:${i}`)}}),t.size===0?o:Array.from(t).sort().join(", ")}async function D(){await M();try{const o=await fetch("/deployments",{headers:_()});if(o.ok){const t=await o.json();document.getElementById("totalDeployments").textContent=t.length,document.getElementById("runningApps").textContent=t.filter(n=>n.status==="success").length;const e=document.getElementById("recentActivity");t.length>0?e.innerHTML=t.slice(0,5).map(n=>{const s=n.app_name||n.container_name||"Untitled Project";return`
          <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
            <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 0.25rem;">${h(s)}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">
              ${new Date(n.created_at).toLocaleString("en-US",{timeZone:"Asia/Kathmandu"})}
            </div>
          </div>
        `}).join(""):e.innerHTML='<p class="recent-activity-empty">No recent activity</p>'}}catch(o){console.error("Error loading dashboard:",o)}}async function He(o){var d,l,p,y;if(o.preventDefault(),!U){u("Please login to deploy applications","error"),window.location.href="/login";return}const t=o.target,e=((d=document.getElementById("deploy-type"))==null?void 0:d.value)||"single",n=(l=document.getElementById("git-url"))==null?void 0:l.value.trim(),s=(p=document.getElementById("frontend-url"))==null?void 0:p.value.trim(),a=(y=document.getElementById("backend-url"))==null?void 0:y.value.trim(),i=document.getElementById("deploy-status"),c=document.getElementById("deploy-success");if(c.style.display="none",i.textContent="",e==="split"){if(!s||!s.startsWith("http")||!a||!a.startsWith("http")){i.textContent="Please enter valid Frontend and Backend repository URLs",i.style.color="var(--error)";return}}else if(!n||!n.startsWith("http")){i.textContent="Please enter a valid Git repository URL",i.style.color="var(--error)";return}i.textContent="🚀 Deploying...",i.style.color="var(--primary)";try{const m=new FormData;e==="split"?(m.append("deploy_type","split"),m.append("frontend_url",s),m.append("backend_url",a)):(m.append("deploy_type","single"),m.append("git_url",n)),typeof r=="object"&&r&&r.id&&m.append("project_id",String(r.id));const v=await fetch("/deploy",{method:"POST",headers:_(),body:m}),f=await v.json();v.ok?(i.textContent="✅ Deployment successful!",i.style.color="var(--success)",f.deployed_url&&(c.style.display="block",document.getElementById("openAppBtn").href=f.deployed_url,document.getElementById("openAppBtn").textContent=`Open ${f.deployed_url}`),t.reset(),r&&r.isSplit?setTimeout(()=>{T(),D()},1500):setTimeout(()=>{D(),H.navigate("/applications")},2e3)):(i.textContent=`❌ Error: ${f.detail||"Deployment failed"}`,i.style.color="var(--error)")}catch{i.textContent="❌ Network error. Please try again.",i.style.color="var(--error)"}}async function O(o,t=null,e=null,n=!1){const s=document.getElementById("deploy-status"),a=document.getElementById("deploy-success");if(!U)return u("Please login to deploy applications","error"),window.location.href="/login",n?{success:!1,error:"Not authenticated"}:void 0;e||(a&&(a.style.display="none"),s&&(s.textContent="",s.style.color="var(--primary)"));try{const i=new FormData;i.append("deploy_type","single"),i.append("git_url",o),typeof r=="object"&&r&&r.id&&i.append("project_id",String(r.id));const c=await fetch("/deploy",{method:"POST",headers:_(),body:i}),d=await c.json();if(c.ok){if(e){const l="success",p=t==="backend"?"Backend complete! ✅":"Frontend complete! ✅";t==="backend"?e.updateBackendStatus(l,p):t==="frontend"&&e.updateFrontendStatus(l,p)}else if(s&&(s.textContent="✅ Deployment successful!",s.style.color="var(--success)"),d.deployed_url&&a){a.style.display="block";const l=document.getElementById("openAppBtn");l&&(l.href=d.deployed_url,l.textContent=`Open ${d.deployed_url}`)}return n?{success:!0,deployed_url:d.deployed_url}:(r&&r.isSplit?setTimeout(()=>{T(),D()},1500):setTimeout(()=>{D(),H.navigate("/applications")},2e3),{success:!0,deployed_url:d.deployed_url})}else{const l=d.detail||"Deployment failed";if(e){const p="failed",y=`Error: ${l}`;t==="backend"?e.updateBackendStatus(p,y):t==="frontend"&&e.updateFrontendStatus(p,y)}else s&&(s.textContent=`❌ Error: ${l}`,s.style.color="var(--error)");if(n)return{success:!1,error:l}}}catch{const c="Network error. Please try again.";if(e){const d="failed",l=c;t==="backend"?e.updateBackendStatus(d,l):t==="frontend"&&e.updateFrontendStatus(d,l)}else s&&(s.textContent=`❌ ${c}`,s.style.color="var(--error)");if(n)return{success:!1,error:c}}}async function qe(){if(!U){document.getElementById("applicationsGrid").innerHTML=`
      <div class="empty-state">
        <p>Please login to view your applications</p>
        <a href="/login" class="btn-primary">Login</a>
      </div>
    `;return}try{const o=await fetch("/deployments",{headers:_()});if(o.ok){const t=await o.json(),e=document.getElementById("applicationsGrid");t.length===0?e.innerHTML=`
          <div class="empty-state">
            <p>No applications deployed yet</p>
            <a href="/deploy" class="btn-primary">Deploy Your First App</a>
          </div>
        `:e.innerHTML=t.map(n=>{const s=n.app_name||n.container_name||"Untitled Project";return`
          <div class="application-card" onclick="window.open('${n.deployed_url||"#"}', '_blank')">
            <h3>${h(s)}</h3>
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
        `}).join("")}}catch(o){console.error("Error loading applications:",o)}}async function oe(){if(!U){document.getElementById("historyTableBody").innerHTML=`
      <tr>
        <td colspan="4" class="empty-state">Please login to view deployment history</td>
      </tr>
    `;return}try{const o=await fetch("/deployments",{headers:_()});if(o.ok){const t=await o.json(),e=document.getElementById("historyTableBody");t.length===0?e.innerHTML=`
          <tr>
            <td colspan="4" class="empty-state">No deployment history</td>
          </tr>
        `:e.innerHTML=t.map(n=>{const s=n.app_name||n.container_name||"Untitled Project";return`
          <tr>
            <td><strong>${h(s)}</strong></td>
            <td>
              <span class="status-badge ${n.status}">
                ${n.status==="success"?"✅":n.status==="failed"?"❌":"🔄"} 
                ${n.status}
              </span>
            </td>
            <td>
              ${n.deployed_url?`<a href="${n.deployed_url}" target="_blank">${n.deployed_url}</a>`:"N/A"}
            </td>
            <td>${new Date(n.created_at).toLocaleString("en-US",{timeZone:"Asia/Kathmandu"})}</td>
          </tr>
        `}).join("")}}catch(o){console.error("Error loading history:",o)}}async function Oe(){if(confirm("Are you sure you want to clear all deployment history?"))try{(await fetch("/deployments/clear",{method:"DELETE",headers:_()})).ok&&(u("History cleared successfully","success"),oe())}catch{u("Error clearing history","error")}}async function Ge(o){if(confirm(`Are you sure you want to destroy "${o}"?`))try{(await fetch(`/deployments/${o}`,{method:"DELETE",headers:_()})).ok?(u("Deployment destroyed successfully","success"),oe(),qe()):u("Error destroying deployment","error")}catch{u("Network error","error")}}let k=[],re="";async function ye(){const o=document.getElementById("usernameSearch").value.trim();if(!o){u("Please enter a GitHub username","error");return}o!==re&&(k=[],re=o);const t=document.getElementById("repositoriesGrid");t.innerHTML='<div class="empty-state"><p>Loading repositories...</p></div>';try{const e=await fetch(`/api/repositories/${o}`),n=await e.json();e.ok&&n.repositories?n.repositories.length===0?t.innerHTML='<div class="empty-state"><p>No repositories found</p></div>':(t.innerHTML=n.repositories.map(s=>`
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
        `).join(""),Z()):t.innerHTML=`<div class="empty-state"><p>${n.detail||"Error loading repositories"}</p></div>`}catch{t.innerHTML='<div class="empty-state"><p>Error loading repositories</p></div>'}}function ze(o,t){const e=k.findIndex(n=>n.url===o);if(e>=0)k.splice(e,1),Z();else{if(k.length>=2){u("You can only select up to 2 repositories for a split repository","error");return}k.push({url:o,name:t}),k.length===2&&We(),Z()}}function We(){const[o,t]=k,e=document.createElement("div");e.className="modal-overlay",e.id="splitImportModal";const n=document.createElement("div");n.className="modal-content enhanced",n.innerHTML=`
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
        <div class="split-import-repo-name">${h(o.name)}</div>
        <div class="split-import-repo-url">${h(o.url)}</div>
      </div>
      
      <div class="split-import-divider"></div>
      
      <div class="split-import-repo-item">
        <div class="split-import-repo-label">Backend</div>
        <div class="split-import-repo-name">${h(t.name)}</div>
        <div class="split-import-repo-url">${h(t.url)}</div>
      </div>
    </div>
    
    <div class="split-import-actions">
      <button class="cancel-btn">Cancel</button>
      <button class="confirm-btn">Import Split Repository</button>
    </div>
  `,e.appendChild(n),document.body.appendChild(e);const s=n.querySelector(".cancel-btn"),a=n.querySelector(".confirm-btn"),i=()=>{document.body.removeChild(e)};s.onclick=()=>{i()},a.onclick=()=>{i();const[d,l]=k;ge(d.url,l.url,`${d.name}-${l.name}`)},e.onclick=d=>{d.target===e&&i()};const c=d=>{d.key==="Escape"&&(i(),document.removeEventListener("keydown",c))};document.addEventListener("keydown",c),a.focus()}function Z(){const o=document.getElementById("repositoriesGrid");if(!o)return;o.querySelectorAll(".repository-card").forEach(e=>{const n=e.getAttribute("data-repo-url");k.some(a=>a.url===n)?e.classList.add("selected"):e.classList.remove("selected")})}function Ke(){if(k.length!==2){u("Please select exactly 2 repositories","error");return}const[o,t]=k;confirm(`Import as Split Repository?

Frontend: ${o.name}
Backend: ${t.name}

Click OK to import these repositories as a split project.`)&&ge(o.url,t.url,`${o.name}-${t.name}`)}async function ge(o,t,e){const n=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!n){u("Please login first","error");return}try{u("Importing split repositories...","info");const s=await fetch("/api/import-split",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${n}`},body:new URLSearchParams({frontend_url:o,backend_url:t,app_name:e})}),a=await s.json();if(s.ok){u("Split repository imported successfully! Navigate to Projects to see it.","success"),k=[];const i=document.getElementById("page-projects");i&&i.style.display!=="none"&&M(),document.getElementById("usernameSearch").value.trim()&&ye()}else u(a.detail||"Failed to import split repository","error")}catch(s){console.error("Error importing split repositories:",s),u("Failed to import split repository: "+s.message,"error")}}function Ye(o){document.getElementById("git-url").value=o,H.navigate("/deploy"),u("Repository selected","success")}async function Je(o,t){const e=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!e){u("Please login first","error");return}try{u("Importing repository...","info");const n=await fetch("/api/import",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${e}`},body:new URLSearchParams({git_url:o,app_name:t||o.split("/").pop()||"Untitled Project"})}),s=await n.json();if(n.ok){u("Repository imported successfully! Navigate to Projects to see it.","success");const a=document.getElementById("page-projects");a&&a.style.display!=="none"&&M()}else u(s.detail||"Failed to import repository","error")}catch(n){console.error("Error importing repository:",n),u("Failed to import repository: "+n.message,"error")}}function Ze(){document.getElementById("repositoriesGrid").innerHTML=`
    <div class="empty-state">
      <p>Search for a GitHub username to see their repositories</p>
            </div>
        `}function u(o,t="info"){const e=document.getElementById("toast");e.textContent=o,e.className=`toast show ${t}`,setTimeout(()=>{e.classList.remove("show")},3e3)}let N={},Q=[],G=null;async function Qe(){const o=document.getElementById("projectSelector");if(o)try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken"),e=await fetch("/deployments",{headers:{Authorization:`Bearer ${t}`}});if(e.ok){const n=await e.json();o.innerHTML='<option value="">All Projects (Global)</option>',n.forEach(s=>{var i;const a=document.createElement("option");a.value=s.id,a.textContent=s.app_name||((i=s.repository_url)==null?void 0:i.split("/").pop())||`Project ${s.id}`,o.appendChild(a)})}}catch(t){console.error("Error loading projects:",t)}}async function W(){await Qe();try{const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o){const n=document.getElementById("envVarsList");n&&(n.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `),le();return}const t=G?`/api/env-vars?project_id=${G}`:"/api/env-vars",e=await fetch(t,{headers:{Authorization:`Bearer ${o}`}});if(e.ok){const n=await e.json();N=n.variables||{},Q=n.vars_list||[],et()}else if(e.status===401){localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),z();const n=document.getElementById("envVarsList");n&&(n.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `)}else console.error("Failed to load environment variables")}catch(o){console.error("Error loading environment variables:",o)}le()}function le(){const o=document.getElementById("importEnvBtn"),t=document.getElementById("addEnvVarBtn"),e=document.getElementById("importEnvCard"),n=document.getElementById("cancelImportBtn"),s=document.getElementById("importEnvForm"),a=document.getElementById("projectSelector");a&&a.addEventListener("change",async i=>{G=i.target.value?parseInt(i.target.value):null,await W()}),o&&(o.onclick=()=>{e.style.display=e.style.display==="none"?"block":"none"}),n&&(n.onclick=()=>{e.style.display="none",document.getElementById("envFileInput").value=""}),t&&(t.onclick=()=>{tt()}),s&&(s.onsubmit=async i=>{i.preventDefault();const d=document.getElementById("envFileInput").files[0];d&&await Xe(d)})}async function Xe(o){try{const e=(await o.text()).split(`
`),n={};e.forEach(s=>{if(s=s.trim(),s&&!s.startsWith("#")&&s.includes("=")){const[a,...i]=s.split("="),c=i.join("=").trim().replace(/^["']|["']$/g,"");a.trim()&&(n[a.trim()]=c)}}),N={...N,...n},await se(),document.getElementById("importEnvCard").style.display="none",document.getElementById("envFileInput").value="",u("Environment variables imported successfully!","success")}catch(t){console.error("Error importing .env file:",t),u("Failed to import .env file","error")}}function et(){const o=document.getElementById("envVarsList");if(o){if(Q.length===0){o.innerHTML=`
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
        ${Q.map((t,e)=>{const n=t.updated_at?q(new Date(t.updated_at)):"never",s=t.project_id?'<span style="font-size: 0.75rem; background: var(--primary); color: white; padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Project</span>':'<span style="font-size: 0.75rem; background: var(--bg-tertiary); color: var(--text-secondary); padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Global</span>';return`
            <tr>
              <td class="name-col">
                <span class="lock-icon">🔒</span>
                <span class="var-name">${h(t.key)}</span>
                ${s}
              </td>
              <td class="updated-col">
                <span class="updated-time">${n}</span>
              </td>
              <td class="actions-col">
                <button class="icon-btn edit-btn" onclick="editEnvVarModal('${h(t.key)}')" title="Edit">
                  ✏️
                </button>
                <button class="icon-btn delete-btn" onclick="deleteEnvVar('${h(t.key)}')" title="Delete">
                  🗑️
                </button>
              </td>
            </tr>
          `}).join("")}
      </tbody>
    </table>
  `}}function tt(){ne()}function ne(o=null,t=""){const e=document.getElementById("envVarModal"),n=document.getElementById("modalVarKey"),s=document.getElementById("modalVarValue"),a=document.getElementById("modalTitle");o?(a.textContent="Update environment variable",n.value=o,n.readOnly=!0,s.value=t):(a.textContent="Add environment variable",n.value="",n.readOnly=!1,s.value=""),e.style.display="flex"}function ve(){const o=document.getElementById("envVarModal");o.style.display="none"}async function ot(){const o=document.getElementById("modalVarKey"),t=document.getElementById("modalVarValue"),e=o.value.trim(),n=t.value.trim();if(!e){u("Variable name is required","error");return}N[e]=n,await se(),ve()}function fe(o){const t=N[o]||"";ne(o,t)}async function nt(o){fe(o)}async function st(o){confirm(`Are you sure you want to delete ${o}?`)&&(delete N[o],await se(),u("Environment variable deleted","success"))}function at(o){const e=document.querySelectorAll(".env-var-row")[o];if(!e)return;const n=e.querySelector(".env-var-value input");n.type==="password"?n.type="text":n.type="password"}async function se(){try{const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");(await fetch("/api/env-vars",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${o}`},body:JSON.stringify({variables:N,project_id:G})})).ok?(await W(),u("Environment variables saved successfully","success")):(console.error("Failed to save environment variables"),u("Failed to save environment variables","error"))}catch(o){console.error("Error saving environment variables:",o),u("Error saving environment variables","error")}}function it(){const o=document.getElementById("modalVarValue"),t=document.querySelector('#envVarModal button[onclick*="toggleModalValueVisibility"]');o&&t&&(o.type==="password"?(o.type="text",t.textContent="🙈 Hide"):(o.type="password",t.textContent="👁️ Show"))}function h(o){const t=document.createElement("div");return t.textContent=o,t.innerHTML}async function he(){try{const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o)return;const t=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${o}`}});if(t.ok){const e=await t.json(),n=document.getElementById("userName"),s=document.getElementById("userEmail"),a=document.getElementById("userAvatar");localStorage.setItem("displayName",e.display_name||""),localStorage.setItem("userEmail",e.email||""),n&&(n.textContent=e.display_name||e.username||"User"),ut(e.display_name||e.username||"User"),s&&(s.textContent=e.email||"Logged in"),a&&(e.avatar_url?(a.style.backgroundImage=`url(${e.avatar_url})`,a.style.backgroundSize="cover",a.style.backgroundPosition="center",a.textContent=""):(a.style.backgroundImage="",a.textContent=(e.display_name||e.username||"U").charAt(0).toUpperCase()))}else t.status===401&&(localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),z())}catch(o){console.error("Error loading user profile:",o)}}async function rt(){try{const o=localStorage.getItem("access_token")||localStorage.getItem("authToken"),t=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${o}`}});if(t.ok){const e=await t.json();document.getElementById("username").value=e.username||"",document.getElementById("email").value=e.email||"",document.getElementById("displayName").value=e.display_name||"",e.avatar_url&&(document.getElementById("avatarPreview").src=e.avatar_url,document.getElementById("avatarPreview").style.display="block",document.getElementById("avatarPlaceholder").style.display="none",document.getElementById("removeAvatarBtn").style.display="block")}}catch(o){console.error("Error loading profile:",o)}lt()}function lt(){const o=document.getElementById("profileForm"),t=document.getElementById("avatarFile"),e=document.getElementById("removeAvatarBtn");o&&o.addEventListener("submit",pt),t&&t.addEventListener("change",ct),e&&e.addEventListener("click",dt)}function ct(o){const t=o.target.files[0];if(t){const e=new FileReader;e.onload=n=>{document.getElementById("avatarPreview").src=n.target.result,document.getElementById("avatarPreview").style.display="block",document.getElementById("avatarPlaceholder").style.display="none",document.getElementById("removeAvatarBtn").style.display="block"},e.readAsDataURL(t)}}function dt(){document.getElementById("avatarPreview").src="",document.getElementById("avatarPreview").style.display="none",document.getElementById("avatarPlaceholder").style.display="block",document.getElementById("removeAvatarBtn").style.display="none",document.getElementById("avatarFile").value=""}async function pt(o){o.preventDefault();const t=document.getElementById("profileMessage");t.style.display="none";const e=new FormData;e.append("email",document.getElementById("email").value),e.append("display_name",document.getElementById("displayName").value);const n=document.getElementById("currentPassword").value,s=document.getElementById("newPassword").value,a=document.getElementById("confirmPassword").value;if(s||n){if(s!==a){t.textContent="New passwords do not match",t.className="profile-message error",t.style.display="block";return}if(s.length<6){t.textContent="New password must be at least 6 characters",t.className="profile-message error",t.style.display="block";return}e.append("current_password",n),e.append("new_password",s)}const i=document.getElementById("avatarFile").files[0];i&&e.append("avatar",i),document.getElementById("avatarPreview").style.display==="none"&&e.append("remove_avatar","true");try{const c=localStorage.getItem("access_token")||localStorage.getItem("authToken"),d=await fetch("/api/user/profile",{method:"PUT",headers:{Authorization:`Bearer ${c}`},body:e}),l=await d.json();if(d.ok)t.textContent="Profile updated successfully!",t.className="profile-message success",t.style.display="block",l.username&&localStorage.setItem("username",l.username),document.getElementById("currentPassword").value="",document.getElementById("newPassword").value="",document.getElementById("confirmPassword").value="",await he(),u("Profile updated successfully!","success");else{const p=l.detail||l.message||"Failed to update profile";t.textContent=p,t.className="profile-message error",t.style.display="block",console.error("Profile update failed:",l)}}catch(c){console.error("Error updating profile:",c);try{const d=await response.json();t.textContent=d.detail||"Network error. Please try again."}catch{t.textContent="Network error. Please try again."}t.className="profile-message error",t.style.display="block"}}window.destroyDeployment=Ge;window.selectRepository=Ye;window.importRepository=Je;window.editEnvVar=nt;window.deleteEnvVar=st;window.toggleEnvVarVisibility=at;window.saveEnvVarFromModal=ot;window.closeEnvVarModal=ve;window.toggleModalValueVisibility=it;window.editEnvVarModal=fe;window.showEnvVarModal=ne;window.selectProject=ee;window.showProjectSidebar=J;window.hideProjectSidebar=Me;window.openProject=Re;window.loadUserProfileIntoProjectSidebar=pe;window.openProjectSite=De;window.deleteProject=Ie;window.toggleRepositorySelection=ze;window.confirmSplitImport=Ke;window.openProjectNameModal=de;function ut(o){const t=document.getElementById("teamName");t&&(t.textContent=`${o}'s team`),document.querySelectorAll(".project-owner").forEach(n=>{n.textContent=`${o}'s team`})}let j=null,R=!1,P=[];function we(){const o=document.getElementById("logsContent");o&&(o.innerHTML='<p class="logs-connecting">Connecting to WebSocket...</p>',be(),mt())}function be(){j&&j.close();const t=`${window.location.protocol==="https:"?"wss:":"ws:"}//${window.location.host}/ws/logs`;j=new WebSocket(t),j.onopen=()=>{console.log("Logs WebSocket connected"),C("Connected to logs stream","success"),P.length>0&&(P.forEach(e=>C(e.message,e.type)),P=[])},j.onmessage=e=>{try{const n=JSON.parse(e.data);R?P.push({message:n.message,type:n.type||"info"}):C(n.message,n.type||"info")}catch(n){console.error("Error parsing log message:",n),C(e.data,"info")}},j.onerror=e=>{console.error("Logs WebSocket error:",e),C("WebSocket connection error","error")},j.onclose=()=>{console.log("Logs WebSocket disconnected"),C("Disconnected from logs stream","warning"),setTimeout(()=>{var e;((e=document.getElementById("page-logs"))==null?void 0:e.style.display)!=="none"&&be()},3e3)}}function C(o,t="info"){const e=document.getElementById("logsContent");if(!e)return;const n=new Date().toLocaleTimeString("en-US",{timeZone:"Asia/Kathmandu"}),s=document.createElement("div");s.className=`log-entry ${t}`,s.innerHTML=`
    <span class="log-timestamp">[${n}]</span>
    <span class="log-message">${h(o)}</span>
  `,e.appendChild(s),e.scrollTop=e.scrollHeight;const a=1e3,i=e.querySelectorAll(".log-entry");i.length>a&&i[0].remove()}function mt(){const o=document.getElementById("clearLogsBtn"),t=document.getElementById("toggleLogsBtn");o&&o.addEventListener("click",()=>{const e=document.getElementById("logsContent");e&&(e.innerHTML="",P=[],C("Logs cleared","info"))}),t&&t.addEventListener("click",()=>{R=!R,t.textContent=R?"Resume":"Pause",!R&&P.length>0&&(P.forEach(e=>C(e.message,e.type)),P=[]),C(R?"Logs paused":"Logs resumed","info")})}window.addEventListener("beforeunload",()=>{j&&j.close()});function yt(){const o=document.getElementById("sidebarSearch"),t=document.getElementById("commandPalette"),e=document.getElementById("commandSearchInput"),n=document.querySelectorAll(".command-item");let s=-1;function a(){t&&(t.style.display="flex",e&&(e.focus(),e.value=""),s=-1,c())}function i(){t&&(t.style.display="none",s=-1)}function c(){const l=Array.from(n).filter(p=>p.style.display!=="none");n.forEach((p,y)=>{l.indexOf(p)===s?(p.classList.add("selected"),p.scrollIntoView({block:"nearest",behavior:"smooth"})):p.classList.remove("selected")})}function d(l){switch(i(),l){case"deploy":case"nav-deploy":window.router&&window.router.navigate("/deploy");break;case"add-env-var":window.showEnvVarModal&&window.showEnvVarModal();break;case"search-repos":case"nav-repositories":window.router&&window.router.navigate("/repositories");break;case"nav-projects":window.router&&window.router.navigate("/");break;case"nav-applications":window.router&&window.router.navigate("/applications");break;case"nav-history":window.router&&window.router.navigate("/history");break;case"nav-env-vars":window.router&&window.router.navigate("/env-vars");break;case"nav-settings":window.router&&window.router.navigate("/settings");break}}document.addEventListener("keydown",l=>{var p;if((l.metaKey||l.ctrlKey)&&l.key==="k"&&(l.preventDefault(),t&&t.style.display==="none"?a():i()),l.key==="Escape"&&t&&t.style.display!=="none"&&i(),t&&t.style.display!=="none"){const y=Array.from(n).filter(m=>m.style.display!=="none");if(l.key==="ArrowDown")l.preventDefault(),s=Math.min(s+1,y.length-1),c();else if(l.key==="ArrowUp")l.preventDefault(),s=Math.max(s-1,-1),c();else if(l.key==="Enter"&&s>=0){l.preventDefault();const v=(p=Array.from(n).filter(f=>f.style.display!=="none")[s])==null?void 0:p.getAttribute("data-action");v&&d(v)}}}),o&&o.addEventListener("click",a),t&&t.addEventListener("click",l=>{l.target===t&&i()}),n.forEach(l=>{l.addEventListener("click",()=>{const p=l.getAttribute("data-action");p&&d(p)})}),e&&e.addEventListener("input",l=>{const p=l.target.value.toLowerCase();n.forEach(y=>{y.querySelector(".command-text").textContent.toLowerCase().includes(p)?y.style.display="flex":y.style.display="none"}),s=-1,c()})}
