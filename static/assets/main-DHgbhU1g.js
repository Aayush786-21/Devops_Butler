import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */class J{constructor(){this.routes={"/":"projects","/deploy":"deploy","/history":"history","/repositories":"repositories","/domain":"domain","/env-vars":"env-vars","/settings":"settings","/logs":"logs"},this.currentPage=null,this.init()}init(){document.querySelectorAll(".nav-item").forEach(e=>{e.addEventListener("click",o=>{o.preventDefault();const n=e.getAttribute("href");this.navigate(n)})}),window.addEventListener("popstate",()=>{this.loadPage(window.location.pathname)}),this.loadPage(window.location.pathname)}navigate(e){window.history.pushState({},"",e),this.loadPage(e)}loadPage(e){const o=this.routes[e]||"dashboard";this.showPage(o),this.updateActiveNav(e),this.updatePageTitle(o),window.scrollTo({top:0,behavior:"smooth"})}showPage(e){document.querySelectorAll(".page").forEach(n=>{n.style.display="none"});const o=document.getElementById(`page-${e}`);if(o)o.style.display="block";else{const n=document.getElementById("page-dashboard");n&&(n.style.display="block")}this.currentPage=e,this.loadPageData(e)}updateActiveNav(e){document.querySelectorAll(".nav-item").forEach(o=>{o.classList.remove("active"),o.getAttribute("href")===e&&o.classList.add("active")})}updatePageTitle(e){const o={projects:"Projects",deploy:"Deploy",history:"History",repositories:"Repositories",domain:"Domain","env-vars":"Environmental Variables",settings:"Settings",logs:"Logs"};document.getElementById("pageTitle").textContent=o[e]||"Dashboard"}loadPageData(e){switch(e){case"projects":I();break;case"history":V();break;case"repositories":pe();break;case"domain":X();break;case"env-vars":T();break;case"settings":Ie();break;case"logs":O();break}}}const L=new J;window.router=L;let E=localStorage.getItem("access_token")||localStorage.getItem("authToken"),D=localStorage.getItem("username");document.addEventListener("DOMContentLoaded",()=>{$(),window.location.pathname==="/login"||window.location.pathname.includes("login.html")||setTimeout(()=>{if(E&&D){Y(),Ce();const e=document.getElementById("page-projects");e&&window.location.pathname==="/"&&(e.style.display="block")}},100)});function $(){const t=document.getElementById("userSection"),e=document.getElementById("authButtons"),o=document.getElementById("logoutBtn"),n=document.getElementById("newDeployBtn");document.getElementById("userName"),document.getElementById("userEmail"),document.getElementById("userAvatar");const a=window.location.pathname==="/login"||window.location.pathname.includes("login.html");E&&D?(t.style.display="flex",e.style.display="none",o.style.display="block",n.style.display="block",K(),I(),a&&(window.location.href="/")):(t.style.display="none",e.style.display="block",o.style.display="none",n.style.display="none",a||(window.location.href="/login"))}function Y(){var r,s;document.getElementById("logoutBtn").addEventListener("click",()=>{localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),E=null,D=null,$(),u("Logged out successfully","success"),L.navigate("/")});const t=document.getElementById("projectsSearch");t&&t.addEventListener("input",l=>{const c=l.target.value.toLowerCase();C=P.filter(i=>i.name.toLowerCase().includes(c)||i.repository&&i.repository.toLowerCase().includes(c)),S(C)});const e=document.getElementById("addProjectBtn");e&&e.addEventListener("click",()=>{window.router&&window.router.navigate("/deploy")});const o=document.getElementById("browseUploadLink");o&&o.addEventListener("click",l=>{l.preventDefault(),window.router&&window.router.navigate("/deploy")}),document.getElementById("newDeployBtn").addEventListener("click",()=>{L.navigate("/deploy")});const n=document.getElementById("deployForm");n&&n.addEventListener("submit",re);const a=document.getElementById("deploy-type");a&&a.addEventListener("change",l=>{const c=document.getElementById("single-repo-group"),i=document.getElementById("split-repo-group"),d=document.getElementById("git-url");l.target.value==="split"?(c.style.display="none",i.style.display="block",d&&d.removeAttribute("required")):(c.style.display="block",i.style.display="none",d&&d.setAttribute("required","required"))}),(r=document.getElementById("clearHistoryBtn"))==null||r.addEventListener("click",le),(s=document.getElementById("searchReposBtn"))==null||s.addEventListener("click",de),Q()}function Q(){document.addEventListener("keydown",t=>{if((t.metaKey||t.ctrlKey)&&t.key==="k"){t.preventDefault();const e=document.querySelector(".search-input");e&&(e.focus(),e.select())}if((t.metaKey||t.ctrlKey)&&t.key==="n"){t.preventDefault();const e=document.querySelector(".new-deploy-btn");e&&e.click()}if(t.key==="Escape"){const e=document.querySelector(".modal-overlay");e&&e.remove()}if(t.key==="r"&&!t.metaKey&&!t.ctrlKey&&!t.altKey){const e=document.getElementById("page-projects");e&&e.style.display!=="none"&&(t.preventDefault(),I())}})}function X(){document.getElementById("page-domain")}function k(){const t={},e=localStorage.getItem("access_token")||localStorage.getItem("authToken");return e&&(t.Authorization=`Bearer ${e}`),t}let P=[],C=[];async function I(){const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t){S([]);return}Z();try{const e=await fetch("/deployments",{headers:{Authorization:`Bearer ${t}`}});e.ok?(P=(await e.json()).map(n=>{var i;const a=n.repository_url||n.git_url,r=a?(i=String(a).split("/").pop())==null?void 0:i.replace(/\.git$/,""):null,s=n.app_name||r||n.container_name||"Untitled Project",l=(n.status||"").toLowerCase();let c;return l==="running"?c="running":l==="failed"||l==="error"?c="failed":c="imported",{id:n.id,name:s,status:c,url:n.deployed_url||n.app_url,createdAt:n.created_at,updatedAt:n.updated_at,repository:a}}),C=[...P],S(C)):S([])}catch(e){console.error("Error loading projects:",e),S([])}}function S(t){const e=document.getElementById("projectsGrid");if(e){if(t.length===0){e.innerHTML=`
      <div class="empty-state">
        <p>No projects found</p>
        <button class="btn-primary" onclick="if(window.router){window.router.navigate('/deploy');}else{window.location.href='/deploy';}">Create First Project</button>
      </div>
    `;return}e.innerHTML=t.map(o=>{const n=o.status==="running"?"status-success":o.status==="failed"?"status-error":"status-info",a=o.status==="running"?"Running":o.status==="failed"?"Failed":"Imported",r=o.status==="running"?"🚀":"📦",s=o.updatedAt?x(o.updatedAt):"Recently";return`
      <div class="project-card" data-project-id="${o.id}" onclick="selectProject(${o.id})">
        <div class="project-header">
          <div class="project-icon">${r}</div>
          <div class="project-status ${n}">${a}</div>
        </div>
        
        <div class="project-info">
          <h3 class="project-name">${j(o.name)}</h3>
          <div class="project-meta">
            <svg class="icon-clock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12,6 12,12 16,14"></polyline>
            </svg>
            <span>Updated ${s}</span>
          </div>
          
          ${o.status==="running"?`
          <div class="project-metrics">
            <div class="metric">
              <span class="metric-label">Uptime</span>
              <span class="metric-value">99.9%</span>
            </div>
            <div class="metric">
              <span class="metric-label">Status</span>
              <span class="metric-value">Active</span>
            </div>
          </div>
          `:""}
        </div>
        
        <div class="project-actions">
          <button class="btn-icon" title="View logs" onclick="event.stopPropagation(); viewProjectLogs(${o.id})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
          </button>
          ${o.status==="running"?`
          <button class="btn-icon" title="Restart" onclick="event.stopPropagation(); restartProject(${o.id})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
            </svg>
          </button>
          `:""}
        </div>
      </div>
    `}).join("")}}function Z(){const t=document.getElementById("projectsGrid");t&&(t.innerHTML=`
    <div class="loading-skeleton">
      ${Array(3).fill(`
        <div class="skeleton-card">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line short"></div>
        </div>
      `).join("")}
    </div>
  `)}let m=null;function H(t){const e=P.find(o=>o.id==t);e&&(m=e,F(e))}function F(t){const e=document.getElementById("sidebar");e&&(e.style.display="none");let o=document.getElementById("projectSidebar");o||(o=ee(),document.body.appendChild(o));const n=o.querySelector("#projectSidebarName");n&&(n.textContent=t.name);const a=o.querySelector("#projectSidebarId");a&&(a.textContent=t.id),o.style.display="block",document.getElementById("pageTitle").textContent=t.name,R(),q("deploy")}function ee(){const t=document.createElement("aside");return t.id="projectSidebar",t.className="sidebar project-sidebar",t.innerHTML=`
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
  `,t.querySelectorAll(".project-nav-item").forEach(e=>{e.addEventListener("click",o=>{o.preventDefault();const n=e.getAttribute("data-project-page");q(n),t.querySelectorAll(".project-nav-item").forEach(a=>a.classList.remove("active")),e.classList.add("active")})}),t}function te(){const t=document.getElementById("projectSidebar");t&&(t.style.display="none");const e=document.getElementById("sidebar");e&&(e.style.display="block"),m=null,document.getElementById("pageTitle").textContent="Projects",document.querySelectorAll(".page").forEach(n=>{n.style.display="none"});const o=document.getElementById("page-projects");o&&(o.style.display="block"),I()}function q(t){switch(document.querySelectorAll(".page").forEach(e=>{e.style.display="none"}),t){case"deploy":const e=document.getElementById("page-deploy");e&&(e.style.display="block"),document.getElementById("pageTitle").textContent="Deploy";break;case"configuration":oe();break;case"logs":const o=document.getElementById("page-logs");o&&(o.style.display="block",O());break;case"domain-config":ne();break;case"env-vars":const n=document.getElementById("page-env-vars");n&&(n.style.display="block",T());break}}function oe(){let t=document.getElementById("page-project-config");t||(t=document.createElement("div"),t.id="page-project-config",t.className="page",t.innerHTML=`
      <div class="card">
        <h2>Project Configuration</h2>
        <div class="project-config-grid">
          <div class="config-item">
            <label>Project Name</label>
            <div class="config-value">
              <span id="projectConfigName">${(m==null?void 0:m.name)||"Unknown"}</span>
              <button class="btn-secondary" id="changeProjectNameBtn">Change</button>
          </div>
            </div>
          <div class="config-item">
            <label>Project ID</label>
            <div class="config-value" id="projectConfigId">${(m==null?void 0:m.id)||"-"}</div>
          </div>
          <div class="config-item">
            <label>Created</label>
            <div class="config-value" id="projectConfigCreated">${m!=null&&m.createdAt?x(new Date(m.createdAt)):"Unknown"}</div>
          </div>
          <div class="config-item">
            <label>Last Updated</label>
            <div class="config-value" id="projectConfigUpdated">${m!=null&&m.updatedAt?x(new Date(m.updatedAt)):"Unknown"}</div>
          </div>
        </div>
      </div>
    `,document.getElementById("pageContent").appendChild(t)),t.style.display="block"}function ne(){let t=document.getElementById("page-project-domain");t||(t=document.createElement("div"),t.id="page-project-domain",t.className="page",t.innerHTML=`
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
    `,document.getElementById("pageContent").appendChild(t)),t.style.display="block"}function ae(t){H(t)}async function R(){const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t){console.log("No auth token found");return}try{const e=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${t}`}});if(e.ok){const o=await e.json(),n=document.getElementById("projectSidebar");if(n){const a=n.querySelector("#projectSidebarUserName"),r=n.querySelector("#projectSidebarUserEmail"),s=n.querySelector("#projectSidebarUserAvatar");if(a&&(a.textContent=o.display_name||o.username||"User"),r&&(r.textContent=o.email||"No email"),s)if(o.avatar_url){const l=new Image;l.onload=()=>{s.style.backgroundImage=`url(${o.avatar_url})`,s.style.backgroundSize="cover",s.style.backgroundPosition="center",s.textContent=""},l.onerror=()=>{s.style.backgroundImage="",s.textContent=(o.display_name||o.username||"U").charAt(0).toUpperCase()},l.src=o.avatar_url}else s.style.backgroundImage="",s.textContent=(o.display_name||o.username||"U").charAt(0).toUpperCase()}}else console.error("Failed to load user profile:",e.status)}catch(e){console.error("Error loading user profile:",e)}}function x(t){if(!t)return"Recently";const o=Date.now()-new Date(t).getTime(),n=Math.floor(o/6e4),a=Math.floor(o/36e5),r=Math.floor(o/864e5);if(n<1)return"Just now";if(n<60)return`${n}m ago`;if(a<24)return`${a}h ago`;if(r<7)return`${r}d ago`;const s=new Date(t);return s.toLocaleDateString("en-US",{month:"short",day:"numeric",year:s.getFullYear()!==new Date().getFullYear()?"numeric":void 0})}async function se(){await I();try{const t=await fetch("/deployments",{headers:k()});if(t.ok){const e=await t.json();document.getElementById("totalDeployments").textContent=e.length,document.getElementById("runningApps").textContent=e.filter(n=>n.status==="success").length;const o=document.getElementById("recentActivity");e.length>0?o.innerHTML=e.slice(0,5).map(n=>`
          <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
            <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 0.25rem;">${n.container_name}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">
              ${new Date(n.created_at).toLocaleString()}
            </div>
          </div>
        `).join(""):o.innerHTML='<p style="text-align: center; color: var(--text-secondary); padding: 1rem 0;">No recent activity</p>'}}catch(t){console.error("Error loading dashboard:",t)}}async function re(t){var c,i,d,y;if(t.preventDefault(),!E){u("Please login to deploy applications","error"),window.location.href="/login";return}const e=t.target,o=((c=document.getElementById("deploy-type"))==null?void 0:c.value)||"single",n=(i=document.getElementById("git-url"))==null?void 0:i.value.trim(),a=(d=document.getElementById("frontend-url"))==null?void 0:d.value.trim(),r=(y=document.getElementById("backend-url"))==null?void 0:y.value.trim(),s=document.getElementById("deploy-status"),l=document.getElementById("deploy-success");if(l.style.display="none",s.textContent="",o==="split"){if(!a||!a.startsWith("http")||!r||!r.startsWith("http")){s.textContent="Please enter valid Frontend and Backend repository URLs",s.style.color="var(--error)";return}}else if(!n||!n.startsWith("http")){s.textContent="Please enter a valid Git repository URL",s.style.color="var(--error)";return}s.textContent="🚀 Deploying...",s.style.color="var(--primary)";try{const p=new FormData;o==="split"?(p.append("deploy_type","split"),p.append("frontend_url",a),p.append("backend_url",r)):(p.append("deploy_type","single"),p.append("git_url",n));const B=await fetch("/deploy",{method:"POST",headers:k(),body:p}),w=await B.json();B.ok?(s.textContent="✅ Deployment successful!",s.style.color="var(--success)",w.deployed_url&&(l.style.display="block",document.getElementById("openAppBtn").href=w.deployed_url,document.getElementById("openAppBtn").textContent=`Open ${w.deployed_url}`),e.reset(),setTimeout(()=>{se(),L.navigate("/applications")},2e3)):(s.textContent=`❌ Error: ${w.detail||"Deployment failed"}`,s.style.color="var(--error)")}catch{s.textContent="❌ Network error. Please try again.",s.style.color="var(--error)"}}async function ie(){if(!E){document.getElementById("applicationsGrid").innerHTML=`
      <div class="empty-state">
        <p>Please login to view your applications</p>
        <a href="/login" class="btn-primary">Login</a>
      </div>
    `;return}try{const t=await fetch("/deployments",{headers:k()});if(t.ok){const e=await t.json(),o=document.getElementById("applicationsGrid");e.length===0?o.innerHTML=`
          <div class="empty-state">
            <p>No applications deployed yet</p>
            <a href="/deploy" class="btn-primary">Deploy Your First App</a>
          </div>
        `:o.innerHTML=e.map(n=>`
          <div class="application-card" onclick="window.open('${n.deployed_url||"#"}', '_blank')">
            <h3>${n.container_name}</h3>
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
        `).join("")}}catch(t){console.error("Error loading applications:",t)}}async function V(){if(!E){document.getElementById("historyTableBody").innerHTML=`
      <tr>
        <td colspan="5" class="empty-state">Please login to view deployment history</td>
      </tr>
    `;return}try{const t=await fetch("/deployments",{headers:k()});if(t.ok){const e=await t.json(),o=document.getElementById("historyTableBody");e.length===0?o.innerHTML=`
          <tr>
            <td colspan="5" class="empty-state">No deployment history</td>
          </tr>
        `:o.innerHTML=e.map(n=>`
          <tr>
            <td><strong>${n.container_name}</strong></td>
            <td>
              <span class="status-badge ${n.status}">
                ${n.status==="success"?"✅":n.status==="failed"?"❌":"🔄"} 
                ${n.status}
              </span>
            </td>
            <td>
              ${n.deployed_url?`<a href="${n.deployed_url}" target="_blank">${n.deployed_url}</a>`:"N/A"}
            </td>
            <td>${new Date(n.created_at).toLocaleString()}</td>
            <td>
              ${n.status==="success"?`<button class="btn-secondary" onclick="destroyDeployment('${n.container_name}')">Destroy</button>`:"-"}
            </td>
          </tr>
        `).join("")}}catch(t){console.error("Error loading history:",t)}}async function le(){if(confirm("Are you sure you want to clear all deployment history?"))try{(await fetch("/deployments/clear",{method:"DELETE",headers:k()})).ok&&(u("History cleared successfully","success"),V())}catch{u("Error clearing history","error")}}async function ce(t){if(confirm(`Are you sure you want to destroy "${t}"?`))try{(await fetch(`/deployments/${t}`,{method:"DELETE",headers:k()})).ok?(u("Deployment destroyed successfully","success"),V(),ie()):u("Error destroying deployment","error")}catch{u("Network error","error")}}async function de(){const t=document.getElementById("usernameSearch").value.trim();if(!t){u("Please enter a GitHub username","error");return}const e=document.getElementById("repositoriesGrid");e.innerHTML='<div class="empty-state"><p>Loading repositories...</p></div>';try{const o=await fetch(`/api/repositories/${t}`),n=await o.json();o.ok&&n.repositories?n.repositories.length===0?e.innerHTML='<div class="empty-state"><p>No repositories found</p></div>':e.innerHTML=n.repositories.map(a=>`
          <div class="repository-card">
            <h3>${a.name}</h3>
            <p style="color: var(--text-secondary); margin: 0.5rem 0;">
              ${a.description||"No description"}
            </p>
            <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.875rem; color: var(--text-secondary);">
                ${a.language||"Unknown"} • ${a.stargazers_count||0} stars
              </span>
              <button class="btn-primary btn-small" onclick="importRepository('${a.clone_url}', '${a.name}')">
                📥 Import
              </button>
            </div>
        </div>
    `).join(""):e.innerHTML=`<div class="empty-state"><p>${n.detail||"Error loading repositories"}</p></div>`}catch{e.innerHTML='<div class="empty-state"><p>Error loading repositories</p></div>'}}function ue(t){document.getElementById("git-url").value=t,L.navigate("/deploy"),u("Repository selected","success")}async function me(t,e){const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o){u("Please login first","error");return}try{u("Importing repository...","info");const n=await fetch("/deploy",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Bearer ${o}`},body:new URLSearchParams({git_url:t,app_name:e||t.split("/").pop()||"Untitled Project"})}),a=await n.json();if(n.ok){u("Repository imported successfully! Navigate to Projects to see it.","success");const r=document.getElementById("page-projects");r&&r.style.display!=="none"&&I()}else u(a.detail||"Failed to import repository","error")}catch(n){console.error("Error importing repository:",n),u("Failed to import repository: "+n.message,"error")}}function pe(){document.getElementById("repositoriesGrid").innerHTML=`
    <div class="empty-state">
      <p>Search for a GitHub username to see their repositories</p>
            </div>
        `}function u(t,e="info"){const o=document.getElementById("toast");o.textContent=t,o.className=`toast show ${e}`,setTimeout(()=>{o.classList.remove("show")},3e3)}let h={},_=[],A=null;async function ye(){const t=document.getElementById("projectSelector");if(t)try{const e=localStorage.getItem("access_token")||localStorage.getItem("authToken"),o=await fetch("/deployments",{headers:{Authorization:`Bearer ${e}`}});if(o.ok){const n=await o.json();t.innerHTML='<option value="">All Projects (Global)</option>',n.forEach(a=>{var s;const r=document.createElement("option");r.value=a.id,r.textContent=a.app_name||((s=a.repository_url)==null?void 0:s.split("/").pop())||`Project ${a.id}`,t.appendChild(r)})}}catch(e){console.error("Error loading projects:",e)}}async function T(){await ye();try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t){const n=document.getElementById("envVarsList");n&&(n.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `),U();return}const e=A?`/api/env-vars?project_id=${A}`:"/api/env-vars",o=await fetch(e,{headers:{Authorization:`Bearer ${t}`}});if(o.ok){const n=await o.json();h=n.variables||{},_=n.vars_list||[],ve()}else if(o.status===401){localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),$();const n=document.getElementById("envVarsList");n&&(n.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `)}else console.error("Failed to load environment variables")}catch(t){console.error("Error loading environment variables:",t)}U()}function U(){const t=document.getElementById("importEnvBtn"),e=document.getElementById("addEnvVarBtn"),o=document.getElementById("importEnvCard"),n=document.getElementById("cancelImportBtn"),a=document.getElementById("importEnvForm"),r=document.getElementById("projectSelector");r&&r.addEventListener("change",async s=>{A=s.target.value?parseInt(s.target.value):null,await T()}),t&&(t.onclick=()=>{o.style.display=o.style.display==="none"?"block":"none"}),n&&(n.onclick=()=>{o.style.display="none",document.getElementById("envFileInput").value=""}),e&&(e.onclick=()=>{fe()}),a&&(a.onsubmit=async s=>{s.preventDefault();const c=document.getElementById("envFileInput").files[0];c&&await ge(c)})}async function ge(t){try{const o=(await t.text()).split(`
`),n={};o.forEach(a=>{if(a=a.trim(),a&&!a.startsWith("#")&&a.includes("=")){const[r,...s]=a.split("="),l=s.join("=").trim().replace(/^["']|["']$/g,"");r.trim()&&(n[r.trim()]=l)}}),h={...h,...n},await N(),document.getElementById("importEnvCard").style.display="none",document.getElementById("envFileInput").value="",u("Environment variables imported successfully!","success")}catch(e){console.error("Error importing .env file:",e),u("Failed to import .env file","error")}}function ve(){const t=document.getElementById("envVarsList");if(t){if(_.length===0){t.innerHTML=`
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
        ${_.map((e,o)=>{const n=e.updated_at?x(new Date(e.updated_at)):"never",a=e.project_id?'<span style="font-size: 0.75rem; background: var(--primary); color: white; padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Project</span>':'<span style="font-size: 0.75rem; background: var(--bg-tertiary); color: var(--text-secondary); padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Global</span>';return`
            <tr>
              <td class="name-col">
                <span class="lock-icon">🔒</span>
                <span class="var-name">${j(e.key)}</span>
                ${a}
              </td>
              <td class="updated-col">
                <span class="updated-time">${n}</span>
              </td>
              <td class="actions-col">
                <button class="icon-btn edit-btn" onclick="editEnvVarModal('${j(e.key)}')" title="Edit">
                  ✏️
                </button>
                <button class="icon-btn delete-btn" onclick="deleteEnvVar('${j(e.key)}')" title="Delete">
                  🗑️
                </button>
              </td>
            </tr>
          `}).join("")}
      </tbody>
    </table>
  `}}function fe(){M()}function M(t=null,e=""){const o=document.getElementById("envVarModal"),n=document.getElementById("modalVarKey"),a=document.getElementById("modalVarValue"),r=document.getElementById("modalTitle");t?(r.textContent="Update environment variable",n.value=t,n.readOnly=!0,a.value=e):(r.textContent="Add environment variable",n.value="",n.readOnly=!1,a.value=""),o.style.display="flex"}function z(){const t=document.getElementById("envVarModal");t.style.display="none"}async function he(){const t=document.getElementById("modalVarKey"),e=document.getElementById("modalVarValue"),o=t.value.trim(),n=e.value.trim();if(!o){u("Variable name is required","error");return}h[o]=n,await N(),z()}function G(t){const e=h[t]||"";M(t,e)}async function we(t){G(t)}async function be(t){confirm(`Are you sure you want to delete ${t}?`)&&(delete h[t],await N(),u("Environment variable deleted","success"))}function Ee(t){const o=document.querySelectorAll(".env-var-row")[t];if(!o)return;const n=o.querySelector(".env-var-value input");n.type==="password"?n.type="text":n.type="password"}async function N(){try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");(await fetch("/api/env-vars",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({variables:h,project_id:A})})).ok?(await T(),u("Environment variables saved successfully","success")):(console.error("Failed to save environment variables"),u("Failed to save environment variables","error"))}catch(t){console.error("Error saving environment variables:",t),u("Error saving environment variables","error")}}function ke(){const t=document.getElementById("modalVarValue"),e=document.querySelector('#envVarModal button[onclick*="toggleModalValueVisibility"]');t&&e&&(t.type==="password"?(t.type="text",e.textContent="🙈 Hide"):(t.type="password",e.textContent="👁️ Show"))}function j(t){const e=document.createElement("div");return e.textContent=t,e.innerHTML}async function K(){try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t)return;const e=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${t}`}});if(e.ok){const o=await e.json(),n=document.getElementById("userName"),a=document.getElementById("userEmail"),r=document.getElementById("userAvatar");n&&(n.textContent=o.display_name||o.username||"User"),a&&(a.textContent=o.email||"Logged in"),r&&(o.avatar_url?(r.style.backgroundImage=`url(${o.avatar_url})`,r.style.backgroundSize="cover",r.style.backgroundPosition="center",r.textContent=""):(r.style.backgroundImage="",r.textContent=(o.display_name||o.username||"U").charAt(0).toUpperCase()))}else e.status===401&&(localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),$())}catch(t){console.error("Error loading user profile:",t)}}async function Ie(){try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken"),e=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${t}`}});if(e.ok){const o=await e.json();document.getElementById("username").value=o.username||"",document.getElementById("email").value=o.email||"",document.getElementById("displayName").value=o.display_name||"",o.avatar_url&&(document.getElementById("avatarPreview").src=o.avatar_url,document.getElementById("avatarPreview").style.display="block",document.getElementById("avatarPlaceholder").style.display="none",document.getElementById("removeAvatarBtn").style.display="block")}}catch(t){console.error("Error loading profile:",t)}Be()}function Be(){const t=document.getElementById("profileForm"),e=document.getElementById("avatarFile"),o=document.getElementById("removeAvatarBtn");t&&t.addEventListener("submit",Le),e&&e.addEventListener("change",Se),o&&o.addEventListener("click",je)}function Se(t){const e=t.target.files[0];if(e){const o=new FileReader;o.onload=n=>{document.getElementById("avatarPreview").src=n.target.result,document.getElementById("avatarPreview").style.display="block",document.getElementById("avatarPlaceholder").style.display="none",document.getElementById("removeAvatarBtn").style.display="block"},o.readAsDataURL(e)}}function je(){document.getElementById("avatarPreview").src="",document.getElementById("avatarPreview").style.display="none",document.getElementById("avatarPlaceholder").style.display="block",document.getElementById("removeAvatarBtn").style.display="none",document.getElementById("avatarFile").value=""}async function Le(t){t.preventDefault();const e=document.getElementById("profileMessage");e.style.display="none";const o=new FormData;o.append("email",document.getElementById("email").value),o.append("display_name",document.getElementById("displayName").value);const n=document.getElementById("currentPassword").value,a=document.getElementById("newPassword").value,r=document.getElementById("confirmPassword").value;if(a||n){if(a!==r){e.textContent="New passwords do not match",e.className="profile-message error",e.style.display="block";return}if(a.length<6){e.textContent="New password must be at least 6 characters",e.className="profile-message error",e.style.display="block";return}o.append("current_password",n),o.append("new_password",a)}const s=document.getElementById("avatarFile").files[0];s&&o.append("avatar",s),document.getElementById("avatarPreview").style.display==="none"&&o.append("remove_avatar","true");try{const l=localStorage.getItem("access_token")||localStorage.getItem("authToken"),c=await fetch("/api/user/profile",{method:"PUT",headers:{Authorization:`Bearer ${l}`},body:o}),i=await c.json();if(c.ok)e.textContent="Profile updated successfully!",e.className="profile-message success",e.style.display="block",i.username&&localStorage.setItem("username",i.username),document.getElementById("currentPassword").value="",document.getElementById("newPassword").value="",document.getElementById("confirmPassword").value="",await K(),u("Profile updated successfully!","success");else{const d=i.detail||i.message||"Failed to update profile";e.textContent=d,e.className="profile-message error",e.style.display="block",console.error("Profile update failed:",i)}}catch(l){console.error("Error updating profile:",l);try{const c=await response.json();e.textContent=c.detail||"Network error. Please try again."}catch{e.textContent="Network error. Please try again."}e.className="profile-message error",e.style.display="block"}}window.destroyDeployment=ce;window.selectRepository=ue;window.importRepository=me;window.editEnvVar=we;window.deleteEnvVar=be;window.toggleEnvVarVisibility=Ee;window.saveEnvVarFromModal=he;window.closeEnvVarModal=z;window.toggleModalValueVisibility=ke;window.editEnvVarModal=G;window.showEnvVarModal=M;window.selectProject=H;window.showProjectSidebar=F;window.hideProjectSidebar=te;window.openProject=ae;window.loadUserProfileIntoProjectSidebar=R;let g=null,b=!1,f=[];function O(){const t=document.getElementById("logsContent");t&&(t.innerHTML='<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Connecting to WebSocket...</p>',W(),Pe())}function W(){g&&g.close();const e=`${window.location.protocol==="https:"?"wss:":"ws:"}//${window.location.host}/ws/logs`;g=new WebSocket(e),g.onopen=()=>{console.log("Logs WebSocket connected"),v("Connected to logs stream","success"),f.length>0&&(f.forEach(o=>v(o.message,o.type)),f=[])},g.onmessage=o=>{try{const n=JSON.parse(o.data);b?f.push({message:n.message,type:n.type||"info"}):v(n.message,n.type||"info")}catch(n){console.error("Error parsing log message:",n),v(o.data,"info")}},g.onerror=o=>{console.error("Logs WebSocket error:",o),v("WebSocket connection error","error")},g.onclose=()=>{console.log("Logs WebSocket disconnected"),v("Disconnected from logs stream","warning"),setTimeout(()=>{var o;((o=document.getElementById("page-logs"))==null?void 0:o.style.display)!=="none"&&W()},3e3)}}function v(t,e="info"){const o=document.getElementById("logsContent");if(!o)return;const n=new Date().toLocaleTimeString(),a=document.createElement("div");a.className=`log-entry ${e}`,a.innerHTML=`
    <span class="log-timestamp">[${n}]</span>
    <span class="log-message">${j(t)}</span>
  `,o.appendChild(a),o.scrollTop=o.scrollHeight;const r=1e3,s=o.querySelectorAll(".log-entry");s.length>r&&s[0].remove()}function Pe(){const t=document.getElementById("clearLogsBtn"),e=document.getElementById("toggleLogsBtn");t&&t.addEventListener("click",()=>{const o=document.getElementById("logsContent");o&&(o.innerHTML="",f=[],v("Logs cleared","info"))}),e&&e.addEventListener("click",()=>{b=!b,e.textContent=b?"Resume":"Pause",!b&&f.length>0&&(f.forEach(o=>v(o.message,o.type)),f=[]),v(b?"Logs paused":"Logs resumed","info")})}window.addEventListener("beforeunload",()=>{g&&g.close()});function Ce(){const t=document.getElementById("sidebarSearch"),e=document.getElementById("commandPalette"),o=document.getElementById("commandSearchInput"),n=document.querySelectorAll(".command-item");let a=-1;function r(){e&&(e.style.display="flex",o&&(o.focus(),o.value=""),a=-1,l())}function s(){e&&(e.style.display="none",a=-1)}function l(){const i=Array.from(n).filter(d=>d.style.display!=="none");n.forEach((d,y)=>{i.indexOf(d)===a?(d.classList.add("selected"),d.scrollIntoView({block:"nearest",behavior:"smooth"})):d.classList.remove("selected")})}function c(i){switch(s(),i){case"deploy":case"nav-deploy":window.router&&window.router.navigate("/deploy");break;case"add-env-var":window.showEnvVarModal&&window.showEnvVarModal();break;case"search-repos":case"nav-repositories":window.router&&window.router.navigate("/repositories");break;case"nav-projects":window.router&&window.router.navigate("/");break;case"nav-applications":window.router&&window.router.navigate("/applications");break;case"nav-history":window.router&&window.router.navigate("/history");break;case"nav-env-vars":window.router&&window.router.navigate("/env-vars");break;case"nav-settings":window.router&&window.router.navigate("/settings");break}}document.addEventListener("keydown",i=>{var d;if((i.metaKey||i.ctrlKey)&&i.key==="k"&&(i.preventDefault(),e&&e.style.display==="none"?r():s()),i.key==="Escape"&&e&&e.style.display!=="none"&&s(),e&&e.style.display!=="none"){const y=Array.from(n).filter(p=>p.style.display!=="none");if(i.key==="ArrowDown")i.preventDefault(),a=Math.min(a+1,y.length-1),l();else if(i.key==="ArrowUp")i.preventDefault(),a=Math.max(a-1,-1),l();else if(i.key==="Enter"&&a>=0){i.preventDefault();const B=(d=Array.from(n).filter(w=>w.style.display!=="none")[a])==null?void 0:d.getAttribute("data-action");B&&c(B)}}}),t&&t.addEventListener("click",r),e&&e.addEventListener("click",i=>{i.target===e&&s()}),n.forEach(i=>{i.addEventListener("click",()=>{const d=i.getAttribute("data-action");d&&c(d)})}),o&&o.addEventListener("input",i=>{const d=i.target.value.toLowerCase();n.forEach(y=>{y.querySelector(".command-text").textContent.toLowerCase().includes(d)?y.style.display="flex":y.style.display="none"}),a=-1,l()})}
