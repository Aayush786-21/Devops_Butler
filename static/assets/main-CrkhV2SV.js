import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */class z{constructor(){this.routes={"/":"projects","/deploy":"deploy","/applications":"applications","/history":"history","/repositories":"repositories","/env-vars":"env-vars","/settings":"settings","/logs":"logs"},this.currentPage=null,this.init()}init(){document.querySelectorAll(".nav-item").forEach(e=>{e.addEventListener("click",t=>{t.preventDefault();const n=e.getAttribute("href");this.navigate(n)})}),window.addEventListener("popstate",()=>{this.loadPage(window.location.pathname)}),this.loadPage(window.location.pathname)}navigate(e){window.history.pushState({},"",e),this.loadPage(e)}loadPage(e){const t=this.routes[e]||"dashboard";this.showPage(t),this.updateActiveNav(e),this.updatePageTitle(t),window.scrollTo({top:0,behavior:"smooth"})}showPage(e){document.querySelectorAll(".page").forEach(n=>{n.style.display="none"});const t=document.getElementById(`page-${e}`);if(t)t.style.display="block";else{const n=document.getElementById("page-dashboard");n&&(n.style.display="block")}this.currentPage=e,this.loadPageData(e)}updateActiveNav(e){document.querySelectorAll(".nav-item").forEach(t=>{t.classList.remove("active"),t.getAttribute("href")===e&&t.classList.add("active")})}updatePageTitle(e){const t={projects:"Projects",deploy:"Deploy",applications:"Applications",history:"History",repositories:"Repositories","env-vars":"Environmental Variables",settings:"Settings",logs:"Logs"};document.getElementById("pageTitle").textContent=t[e]||"Dashboard"}loadPageData(e){switch(e){case"projects":T();break;case"applications":C();break;case"history":V();break;case"repositories":X();break;case"env-vars":j();break;case"settings":ie();break;case"logs":pe();break}}}const L=new z;window.router=L;let I=localStorage.getItem("access_token")||localStorage.getItem("authToken"),_=localStorage.getItem("username");document.addEventListener("DOMContentLoaded",()=>{$(),window.location.pathname==="/login"||window.location.pathname.includes("login.html")||setTimeout(()=>{if(I&&_){W(),ge();const e=document.getElementById("page-projects");e&&window.location.pathname==="/"&&(e.style.display="block")}},100)});function $(){const o=document.getElementById("userSection"),e=document.getElementById("authButtons"),t=document.getElementById("logoutBtn"),n=document.getElementById("newDeployBtn");document.getElementById("userName"),document.getElementById("userEmail"),document.getElementById("userAvatar");const a=window.location.pathname==="/login"||window.location.pathname.includes("login.html");I&&_?(o.style.display="flex",e.style.display="none",t.style.display="block",n.style.display="block",R(),T(),a&&(window.location.href="/")):(o.style.display="none",e.style.display="block",t.style.display="none",n.style.display="none",a||(window.location.href="/login"))}function W(){var s,r,d;document.getElementById("logoutBtn").addEventListener("click",()=>{localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),I=null,_=null,$(),u("Logged out successfully","success"),L.navigate("/")});const o=document.getElementById("projectsSearch");o&&o.addEventListener("input",c=>{const l=c.target.value.toLowerCase();P=x.filter(i=>i.name.toLowerCase().includes(l)||i.repository&&i.repository.toLowerCase().includes(l)),k(P)});const e=document.getElementById("addProjectBtn");e&&e.addEventListener("click",()=>{window.router&&window.router.navigate("/deploy")});const t=document.getElementById("browseUploadLink");t&&t.addEventListener("click",c=>{c.preventDefault(),window.router&&window.router.navigate("/deploy")}),document.getElementById("newDeployBtn").addEventListener("click",()=>{L.navigate("/deploy")});const n=document.getElementById("deployForm");n&&n.addEventListener("submit",O);const a=document.getElementById("deploy-type");a&&a.addEventListener("change",c=>{const l=document.getElementById("single-repo-group"),i=document.getElementById("split-repo-group"),m=document.getElementById("git-url");c.target.value==="split"?(l.style.display="none",i.style.display="block",m&&m.removeAttribute("required")):(l.style.display="block",i.style.display="none",m&&m.setAttribute("required","required"))}),(s=document.getElementById("refreshAppsBtn"))==null||s.addEventListener("click",C),(r=document.getElementById("clearHistoryBtn"))==null||r.addEventListener("click",K),(d=document.getElementById("searchReposBtn"))==null||d.addEventListener("click",Y)}function b(){const o={},e=localStorage.getItem("access_token")||localStorage.getItem("authToken");return e&&(o.Authorization=`Bearer ${e}`),o}let x=[],P=[];async function T(){const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o){k([]);return}try{const e=await fetch("/api/deployments",{headers:{Authorization:`Bearer ${o}`}});e.ok?(x=(await e.json()).map(n=>{var a;return{id:n.id,name:n.app_name||((a=n.repository_url)==null?void 0:a.split("/").pop())||"Untitled Project",status:n.status||"unknown",url:n.app_url,createdAt:n.created_at,updatedAt:n.updated_at,repository:n.repository_url}}),P=[...x],k(P)):k([])}catch(e){console.error("Error loading projects:",e),k([])}}function k(o){const e=document.getElementById("projectsList");if(e){if(o.length===0){e.innerHTML=`
      <div class="empty-state">
        <p>No projects found</p>
        <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.5rem;">
          Deploy your first project to get started
        </p>
      </div>
    `;return}e.innerHTML=o.map(t=>{const n=t.status==="running"?"status-success":t.status==="failed"?"status-error":"status-warning",a=t.status==="running"?"Running":t.status==="failed"?"Failed":"Unknown",s=t.status==="running"?"🚀":"📦",r=t.updatedAt?N(new Date(t.updatedAt)):"Recently";return`
      <div class="project-item" data-project-id="${t.id}">
        <div class="project-icon">${s}</div>
        <div class="project-info">
          <div class="project-name">${E(t.name)}</div>
          <div class="project-meta">
            <span class="status-badge ${n}">${a}</span>
            ${t.repository?`<span>• ${E(t.repository)}</span>`:""}
            ${r?`<span>• Updated ${r}</span>`:""}
          </div>
        </div>
        <div class="project-actions">
          <button class="project-star" title="Star project">⭐</button>
          <a href="${t.url||"#"}" target="_blank" class="btn-secondary" style="text-decoration: none;">
            View →
          </a>
        </div>
      </div>
    `}).join(""),e.querySelectorAll(".project-item").forEach(t=>{t.addEventListener("click",n=>{if(!n.target.closest(".project-actions")){const a=t.getAttribute("data-project-id"),s=o.find(r=>r.id==a);s&&s.url&&window.open(s.url,"_blank")}})})}}function N(o){const t=new Date-o,n=Math.floor(t/6e4),a=Math.floor(t/36e5),s=Math.floor(t/864e5);return n<1?"just now":n<60?`${n} minute${n>1?"s":""} ago`:a<24?`${a} hour${a>1?"s":""} ago`:s<30?`${s} day${s>1?"s":""} ago`:o.toLocaleDateString()}async function G(){await T();try{const o=await fetch("/deployments",{headers:b()});if(o.ok){const e=await o.json();document.getElementById("totalDeployments").textContent=e.length,document.getElementById("runningApps").textContent=e.filter(n=>n.status==="success").length;const t=document.getElementById("recentActivity");e.length>0?t.innerHTML=e.slice(0,5).map(n=>`
          <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
            <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 0.25rem;">${n.container_name}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">
              ${new Date(n.created_at).toLocaleString()}
            </div>
          </div>
        `).join(""):t.innerHTML='<p style="text-align: center; color: var(--text-secondary); padding: 1rem 0;">No recent activity</p>'}}catch(o){console.error("Error loading dashboard:",o)}}async function O(o){var c,l,i,m;if(o.preventDefault(),!I){u("Please login to deploy applications","error"),window.location.href="/login";return}const e=o.target,t=((c=document.getElementById("deploy-type"))==null?void 0:c.value)||"single",n=(l=document.getElementById("git-url"))==null?void 0:l.value.trim(),a=(i=document.getElementById("frontend-url"))==null?void 0:i.value.trim(),s=(m=document.getElementById("backend-url"))==null?void 0:m.value.trim(),r=document.getElementById("deploy-status"),d=document.getElementById("deploy-success");if(d.style.display="none",r.textContent="",t==="split"){if(!a||!a.startsWith("http")||!s||!s.startsWith("http")){r.textContent="Please enter valid Frontend and Backend repository URLs",r.style.color="var(--error)";return}}else if(!n||!n.startsWith("http")){r.textContent="Please enter a valid Git repository URL",r.style.color="var(--error)";return}r.textContent="🚀 Deploying...",r.style.color="var(--primary)";try{const p=new FormData;t==="split"?(p.append("deploy_type","split"),p.append("frontend_url",a),p.append("backend_url",s)):(p.append("deploy_type","single"),p.append("git_url",n));const B=await fetch("/deploy",{method:"POST",headers:b(),body:p}),w=await B.json();B.ok?(r.textContent="✅ Deployment successful!",r.style.color="var(--success)",w.deployed_url&&(d.style.display="block",document.getElementById("openAppBtn").href=w.deployed_url,document.getElementById("openAppBtn").textContent=`Open ${w.deployed_url}`),e.reset(),setTimeout(()=>{G(),L.navigate("/applications")},2e3)):(r.textContent=`❌ Error: ${w.detail||"Deployment failed"}`,r.style.color="var(--error)")}catch{r.textContent="❌ Network error. Please try again.",r.style.color="var(--error)"}}async function C(){if(!I){document.getElementById("applicationsGrid").innerHTML=`
      <div class="empty-state">
        <p>Please login to view your applications</p>
        <a href="/login" class="btn-primary">Login</a>
      </div>
    `;return}try{const o=await fetch("/deployments",{headers:b()});if(o.ok){const e=await o.json(),t=document.getElementById("applicationsGrid");e.length===0?t.innerHTML=`
          <div class="empty-state">
            <p>No applications deployed yet</p>
            <a href="/deploy" class="btn-primary">Deploy Your First App</a>
          </div>
        `:t.innerHTML=e.map(n=>`
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
        `).join("")}}catch(o){console.error("Error loading applications:",o)}}async function V(){if(!I){document.getElementById("historyTableBody").innerHTML=`
      <tr>
        <td colspan="5" class="empty-state">Please login to view deployment history</td>
      </tr>
    `;return}try{const o=await fetch("/deployments",{headers:b()});if(o.ok){const e=await o.json(),t=document.getElementById("historyTableBody");e.length===0?t.innerHTML=`
          <tr>
            <td colspan="5" class="empty-state">No deployment history</td>
          </tr>
        `:t.innerHTML=e.map(n=>`
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
        `).join("")}}catch(o){console.error("Error loading history:",o)}}async function K(){if(confirm("Are you sure you want to clear all deployment history?"))try{(await fetch("/deployments/clear",{method:"DELETE",headers:b()})).ok&&(u("History cleared successfully","success"),V())}catch{u("Error clearing history","error")}}async function J(o){if(confirm(`Are you sure you want to destroy "${o}"?`))try{(await fetch(`/deployments/${o}`,{method:"DELETE",headers:b()})).ok?(u("Deployment destroyed successfully","success"),V(),C()):u("Error destroying deployment","error")}catch{u("Network error","error")}}async function Y(){const o=document.getElementById("usernameSearch").value.trim();if(!o){u("Please enter a GitHub username","error");return}const e=document.getElementById("repositoriesGrid");e.innerHTML='<div class="empty-state"><p>Loading repositories...</p></div>';try{const t=await fetch(`/api/repositories/${o}`),n=await t.json();t.ok&&n.repositories?n.repositories.length===0?e.innerHTML='<div class="empty-state"><p>No repositories found</p></div>':e.innerHTML=n.repositories.map(a=>`
          <div class="repository-card" onclick="selectRepository('${a.clone_url}')">
            <h3>${a.name}</h3>
            <p style="color: var(--text-secondary); margin: 0.5rem 0;">
              ${a.description||"No description"}
            </p>
            <div style="margin-top: 1rem;">
              <span style="font-size: 0.875rem; color: var(--text-secondary);">
                ${a.language||"Unknown"} • ${a.stargazers_count||0} stars
                </span>
            </div>
        </div>
    `).join(""):e.innerHTML=`<div class="empty-state"><p>${n.detail||"Error loading repositories"}</p></div>`}catch{e.innerHTML='<div class="empty-state"><p>Error loading repositories</p></div>'}}function Q(o){document.getElementById("git-url").value=o,L.navigate("/deploy"),u("Repository selected","success")}function X(){document.getElementById("repositoriesGrid").innerHTML=`
    <div class="empty-state">
      <p>Search for a GitHub username to see their repositories</p>
            </div>
        `}function u(o,e="info"){const t=document.getElementById("toast");t.textContent=o,t.className=`toast show ${e}`,setTimeout(()=>{t.classList.remove("show")},3e3)}let f={},A=[],S=null;async function Z(){const o=document.getElementById("projectSelector");if(o)try{const e=localStorage.getItem("access_token")||localStorage.getItem("authToken"),t=await fetch("/api/deployments",{headers:{Authorization:`Bearer ${e}`}});if(t.ok){const n=await t.json();o.innerHTML='<option value="">All Projects (Global)</option>',n.forEach(a=>{var r;const s=document.createElement("option");s.value=a.id,s.textContent=a.app_name||((r=a.repository_url)==null?void 0:r.split("/").pop())||`Project ${a.id}`,o.appendChild(s)})}}catch(e){console.error("Error loading projects:",e)}}async function j(){await Z();try{const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o){const n=document.getElementById("envVarsList");n&&(n.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `),H();return}const e=S?`/api/env-vars?project_id=${S}`:"/api/env-vars",t=await fetch(e,{headers:{Authorization:`Bearer ${o}`}});if(t.ok){const n=await t.json();f=n.variables||{},A=n.vars_list||[],te()}else if(t.status===401){localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),$();const n=document.getElementById("envVarsList");n&&(n.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `)}else console.error("Failed to load environment variables")}catch(o){console.error("Error loading environment variables:",o)}H()}function H(){const o=document.getElementById("importEnvBtn"),e=document.getElementById("addEnvVarBtn"),t=document.getElementById("importEnvCard"),n=document.getElementById("cancelImportBtn"),a=document.getElementById("importEnvForm"),s=document.getElementById("projectSelector");s&&s.addEventListener("change",async r=>{S=r.target.value?parseInt(r.target.value):null,await j()}),o&&(o.onclick=()=>{t.style.display=t.style.display==="none"?"block":"none"}),n&&(n.onclick=()=>{t.style.display="none",document.getElementById("envFileInput").value=""}),e&&(e.onclick=()=>{oe()}),a&&(a.onsubmit=async r=>{r.preventDefault();const c=document.getElementById("envFileInput").files[0];c&&await ee(c)})}async function ee(o){try{const t=(await o.text()).split(`
`),n={};t.forEach(a=>{if(a=a.trim(),a&&!a.startsWith("#")&&a.includes("=")){const[s,...r]=a.split("="),d=r.join("=").trim().replace(/^["']|["']$/g,"");s.trim()&&(n[s.trim()]=d)}}),f={...f,...n},await D(),document.getElementById("importEnvCard").style.display="none",document.getElementById("envFileInput").value="",u("Environment variables imported successfully!","success")}catch(e){console.error("Error importing .env file:",e),u("Failed to import .env file","error")}}function te(){const o=document.getElementById("envVarsList");if(o){if(A.length===0){o.innerHTML=`
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
        ${A.map((e,t)=>{const n=e.updated_at?N(new Date(e.updated_at)):"never",a=e.project_id?'<span style="font-size: 0.75rem; background: var(--primary); color: white; padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Project</span>':'<span style="font-size: 0.75rem; background: var(--bg-tertiary); color: var(--text-secondary); padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Global</span>';return`
            <tr>
              <td class="name-col">
                <span class="lock-icon">🔒</span>
                <span class="var-name">${E(e.key)}</span>
                ${a}
              </td>
              <td class="updated-col">
                <span class="updated-time">${n}</span>
              </td>
              <td class="actions-col">
                <button class="icon-btn edit-btn" onclick="editEnvVarModal('${E(e.key)}')" title="Edit">
                  ✏️
                </button>
                <button class="icon-btn delete-btn" onclick="deleteEnvVar('${E(e.key)}')" title="Delete">
                  🗑️
                </button>
              </td>
            </tr>
          `}).join("")}
      </tbody>
    </table>
  `}}function oe(){M()}function M(o=null,e=""){const t=document.getElementById("envVarModal"),n=document.getElementById("modalVarKey"),a=document.getElementById("modalVarValue"),s=document.getElementById("modalTitle");o?(s.textContent="Update environment variable",n.value=o,n.readOnly=!0,a.value=e):(s.textContent="Add environment variable",n.value="",n.readOnly=!1,a.value=""),t.style.display="flex"}function F(){const o=document.getElementById("envVarModal");o.style.display="none"}async function ne(){const o=document.getElementById("modalVarKey"),e=document.getElementById("modalVarValue"),t=o.value.trim(),n=e.value.trim();if(!t){u("Variable name is required","error");return}f[t]=n,await D(),F()}function U(o){const e=f[o]||"";M(o,e)}async function ae(o){U(o)}async function se(o){confirm(`Are you sure you want to delete ${o}?`)&&(delete f[o],await D(),u("Environment variable deleted","success"))}function re(o){const t=document.querySelectorAll(".env-var-row")[o];if(!t)return;const n=t.querySelector(".env-var-value input");n.type==="password"?n.type="text":n.type="password"}async function D(){try{const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");(await fetch("/api/env-vars",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${o}`},body:JSON.stringify({variables:f,project_id:S})})).ok?(await j(),u("Environment variables saved successfully","success")):(console.error("Failed to save environment variables"),u("Failed to save environment variables","error"))}catch(o){console.error("Error saving environment variables:",o),u("Error saving environment variables","error")}}function le(){const o=document.getElementById("modalVarValue"),e=document.querySelector('#envVarModal button[onclick*="toggleModalValueVisibility"]');o&&e&&(o.type==="password"?(o.type="text",e.textContent="🙈 Hide"):(o.type="password",e.textContent="👁️ Show"))}function E(o){const e=document.createElement("div");return e.textContent=o,e.innerHTML}async function R(){try{const o=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!o)return;const e=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${o}`}});if(e.ok){const t=await e.json(),n=document.getElementById("userName"),a=document.getElementById("userEmail"),s=document.getElementById("userAvatar");n&&(n.textContent=t.display_name||t.username||"User"),a&&(a.textContent=t.email||"Logged in"),s&&(t.avatar_url?(s.style.backgroundImage=`url(${t.avatar_url})`,s.style.backgroundSize="cover",s.style.backgroundPosition="center",s.textContent=""):(s.style.backgroundImage="",s.textContent=(t.display_name||t.username||"U").charAt(0).toUpperCase()))}else e.status===401&&(localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),$())}catch(o){console.error("Error loading user profile:",o)}}async function ie(){try{const o=localStorage.getItem("access_token")||localStorage.getItem("authToken"),e=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${o}`}});if(e.ok){const t=await e.json();document.getElementById("username").value=t.username||"",document.getElementById("email").value=t.email||"",document.getElementById("displayName").value=t.display_name||"",t.avatar_url&&(document.getElementById("avatarPreview").src=t.avatar_url,document.getElementById("avatarPreview").style.display="block",document.getElementById("avatarPlaceholder").style.display="none",document.getElementById("removeAvatarBtn").style.display="block")}}catch(o){console.error("Error loading profile:",o)}ce()}function ce(){const o=document.getElementById("profileForm"),e=document.getElementById("avatarFile"),t=document.getElementById("removeAvatarBtn");o&&o.addEventListener("submit",me),e&&e.addEventListener("change",de),t&&t.addEventListener("click",ue)}function de(o){const e=o.target.files[0];if(e){const t=new FileReader;t.onload=n=>{document.getElementById("avatarPreview").src=n.target.result,document.getElementById("avatarPreview").style.display="block",document.getElementById("avatarPlaceholder").style.display="none",document.getElementById("removeAvatarBtn").style.display="block"},t.readAsDataURL(e)}}function ue(){document.getElementById("avatarPreview").src="",document.getElementById("avatarPreview").style.display="none",document.getElementById("avatarPlaceholder").style.display="block",document.getElementById("removeAvatarBtn").style.display="none",document.getElementById("avatarFile").value=""}async function me(o){o.preventDefault();const e=document.getElementById("profileMessage");e.style.display="none";const t=new FormData;t.append("email",document.getElementById("email").value),t.append("display_name",document.getElementById("displayName").value);const n=document.getElementById("currentPassword").value,a=document.getElementById("newPassword").value,s=document.getElementById("confirmPassword").value;if(a||n){if(a!==s){e.textContent="New passwords do not match",e.className="profile-message error",e.style.display="block";return}if(a.length<6){e.textContent="New password must be at least 6 characters",e.className="profile-message error",e.style.display="block";return}t.append("current_password",n),t.append("new_password",a)}const r=document.getElementById("avatarFile").files[0];r&&t.append("avatar",r),document.getElementById("avatarPreview").style.display==="none"&&t.append("remove_avatar","true");try{const d=localStorage.getItem("access_token")||localStorage.getItem("authToken"),c=await fetch("/api/user/profile",{method:"PUT",headers:{Authorization:`Bearer ${d}`},body:t}),l=await c.json();if(c.ok)e.textContent="Profile updated successfully!",e.className="profile-message success",e.style.display="block",l.username&&localStorage.setItem("username",l.username),document.getElementById("currentPassword").value="",document.getElementById("newPassword").value="",document.getElementById("confirmPassword").value="",await R(),u("Profile updated successfully!","success");else{const i=l.detail||l.message||"Failed to update profile";e.textContent=i,e.className="profile-message error",e.style.display="block",console.error("Profile update failed:",l)}}catch(d){console.error("Error updating profile:",d);try{const c=await response.json();e.textContent=c.detail||"Network error. Please try again."}catch{e.textContent="Network error. Please try again."}e.className="profile-message error",e.style.display="block"}}window.destroyDeployment=J;window.selectRepository=Q;window.editEnvVar=ae;window.deleteEnvVar=se;window.toggleEnvVarVisibility=re;window.saveEnvVarFromModal=ne;window.closeEnvVarModal=F;window.toggleModalValueVisibility=le;window.editEnvVarModal=U;window.showEnvVarModal=M;let y=null,h=!1,v=[];function pe(){const o=document.getElementById("logsContent");o&&(o.innerHTML='<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Connecting to WebSocket...</p>',q(),ye())}function q(){y&&y.close();const e=`${window.location.protocol==="https:"?"wss:":"ws:"}//${window.location.host}/ws/logs`;y=new WebSocket(e),y.onopen=()=>{console.log("Logs WebSocket connected"),g("Connected to logs stream","success"),v.length>0&&(v.forEach(t=>g(t.message,t.type)),v=[])},y.onmessage=t=>{try{const n=JSON.parse(t.data);h?v.push({message:n.message,type:n.type||"info"}):g(n.message,n.type||"info")}catch(n){console.error("Error parsing log message:",n),g(t.data,"info")}},y.onerror=t=>{console.error("Logs WebSocket error:",t),g("WebSocket connection error","error")},y.onclose=()=>{console.log("Logs WebSocket disconnected"),g("Disconnected from logs stream","warning"),setTimeout(()=>{var t;((t=document.getElementById("page-logs"))==null?void 0:t.style.display)!=="none"&&q()},3e3)}}function g(o,e="info"){const t=document.getElementById("logsContent");if(!t)return;const n=new Date().toLocaleTimeString(),a=document.createElement("div");a.className=`log-entry ${e}`,a.innerHTML=`
    <span class="log-timestamp">[${n}]</span>
    <span class="log-message">${E(o)}</span>
  `,t.appendChild(a),t.scrollTop=t.scrollHeight;const s=1e3,r=t.querySelectorAll(".log-entry");r.length>s&&r[0].remove()}function ye(){const o=document.getElementById("clearLogsBtn"),e=document.getElementById("toggleLogsBtn");o&&o.addEventListener("click",()=>{const t=document.getElementById("logsContent");t&&(t.innerHTML="",v=[],g("Logs cleared","info"))}),e&&e.addEventListener("click",()=>{h=!h,e.textContent=h?"Resume":"Pause",!h&&v.length>0&&(v.forEach(t=>g(t.message,t.type)),v=[]),g(h?"Logs paused":"Logs resumed","info")})}window.addEventListener("beforeunload",()=>{y&&y.close()});function ge(){const o=document.getElementById("sidebarSearch"),e=document.getElementById("commandPalette"),t=document.getElementById("commandSearchInput"),n=document.querySelectorAll(".command-item");let a=-1;function s(){e&&(e.style.display="flex",t&&(t.focus(),t.value=""),a=-1,d())}function r(){e&&(e.style.display="none",a=-1)}function d(){const l=Array.from(n).filter(i=>i.style.display!=="none");n.forEach((i,m)=>{l.indexOf(i)===a?(i.classList.add("selected"),i.scrollIntoView({block:"nearest",behavior:"smooth"})):i.classList.remove("selected")})}function c(l){switch(r(),l){case"deploy":case"nav-deploy":window.router&&window.router.navigate("/deploy");break;case"add-env-var":window.showEnvVarModal&&window.showEnvVarModal();break;case"search-repos":case"nav-repositories":window.router&&window.router.navigate("/repositories");break;case"nav-projects":window.router&&window.router.navigate("/");break;case"nav-applications":window.router&&window.router.navigate("/applications");break;case"nav-history":window.router&&window.router.navigate("/history");break;case"nav-env-vars":window.router&&window.router.navigate("/env-vars");break;case"nav-settings":window.router&&window.router.navigate("/settings");break}}document.addEventListener("keydown",l=>{var i;if((l.metaKey||l.ctrlKey)&&l.key==="k"&&(l.preventDefault(),e&&e.style.display==="none"?s():r()),l.key==="Escape"&&e&&e.style.display!=="none"&&r(),e&&e.style.display!=="none"){const m=Array.from(n).filter(p=>p.style.display!=="none");if(l.key==="ArrowDown")l.preventDefault(),a=Math.min(a+1,m.length-1),d();else if(l.key==="ArrowUp")l.preventDefault(),a=Math.max(a-1,-1),d();else if(l.key==="Enter"&&a>=0){l.preventDefault();const B=(i=Array.from(n).filter(w=>w.style.display!=="none")[a])==null?void 0:i.getAttribute("data-action");B&&c(B)}}}),o&&o.addEventListener("click",s),e&&e.addEventListener("click",l=>{l.target===e&&r()}),n.forEach(l=>{l.addEventListener("click",()=>{const i=l.getAttribute("data-action");i&&c(i)})}),t&&t.addEventListener("input",l=>{const i=l.target.value.toLowerCase();n.forEach(m=>{m.querySelector(".command-text").textContent.toLowerCase().includes(i)?m.style.display="flex":m.style.display="none"}),a=-1,d()})}
