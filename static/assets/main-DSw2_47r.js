import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */class D{constructor(){this.routes={"/":"dashboard","/deploy":"deploy","/applications":"applications","/history":"history","/repositories":"repositories","/env-vars":"env-vars","/settings":"settings"},this.currentPage=null,this.init()}init(){document.querySelectorAll(".nav-item").forEach(e=>{e.addEventListener("click",n=>{n.preventDefault();const o=e.getAttribute("href");this.navigate(o)})}),window.addEventListener("popstate",()=>{this.loadPage(window.location.pathname)}),this.loadPage(window.location.pathname)}navigate(e){window.history.pushState({},"",e),this.loadPage(e)}loadPage(e){const n=this.routes[e]||"dashboard";this.showPage(n),this.updateActiveNav(e),this.updatePageTitle(n),window.scrollTo({top:0,behavior:"smooth"})}showPage(e){document.querySelectorAll(".page").forEach(o=>{o.style.display="none"});const n=document.getElementById(`page-${e}`);if(n)n.style.display="block";else{const o=document.getElementById("page-dashboard");o&&(o.style.display="block")}this.currentPage=e,this.loadPageData(e)}updateActiveNav(e){document.querySelectorAll(".nav-item").forEach(n=>{n.classList.remove("active"),n.getAttribute("href")===e&&n.classList.add("active")})}updatePageTitle(e){const n={dashboard:"Dashboard",deploy:"Deploy",applications:"Applications",history:"History",repositories:"Repositories","env-vars":"Environmental Variables",settings:"Settings"};document.getElementById("pageTitle").textContent=n[e]||"Dashboard"}loadPageData(e){switch(e){case"dashboard":I();break;case"applications":B();break;case"history":b();break;case"repositories":R();break;case"env-vars":S();break;case"settings":Q();break}}}const p=new D;window.router=p;let g=localStorage.getItem("access_token")||localStorage.getItem("authToken"),V=localStorage.getItem("username");document.addEventListener("DOMContentLoaded",()=>{h(),M();const t=document.getElementById("page-dashboard");t&&window.location.pathname==="/"&&(t.style.display="block")});function h(){const t=document.getElementById("userSection"),e=document.getElementById("authButtons"),n=document.getElementById("logoutBtn"),o=document.getElementById("newDeployBtn");document.getElementById("userName"),document.getElementById("userEmail"),document.getElementById("userAvatar"),g&&V?(t.style.display="flex",e.style.display="none",n.style.display="block",o.style.display="block",A(),I()):(t.style.display="none",e.style.display="block",n.style.display="none",o.style.display="none")}function M(){var n,o,a;document.getElementById("logoutBtn").addEventListener("click",()=>{localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),g=null,V=null,h(),l("Logged out successfully","success"),p.navigate("/")}),document.getElementById("newDeployBtn").addEventListener("click",()=>{p.navigate("/deploy")});const t=document.getElementById("deployForm");t&&t.addEventListener("submit",C);const e=document.getElementById("deploy-type");e&&e.addEventListener("change",r=>{const s=document.getElementById("single-repo-group"),i=document.getElementById("split-repo-group"),c=document.getElementById("git-url");r.target.value==="split"?(s.style.display="none",i.style.display="block",c&&c.removeAttribute("required")):(s.style.display="block",i.style.display="none",c&&c.setAttribute("required","required"))}),(n=document.getElementById("refreshAppsBtn"))==null||n.addEventListener("click",B),(o=document.getElementById("clearHistoryBtn"))==null||o.addEventListener("click",H),(a=document.getElementById("searchReposBtn"))==null||a.addEventListener("click",F)}function y(){const t={},e=localStorage.getItem("access_token")||localStorage.getItem("authToken");return e&&(t.Authorization=`Bearer ${e}`),t}async function I(){if(!(localStorage.getItem("access_token")||localStorage.getItem("authToken"))){document.getElementById("totalDeployments").textContent="0",document.getElementById("runningApps").textContent="0";const e=document.getElementById("recentActivity");e&&(e.innerHTML='<p style="text-align: center; color: var(--text-secondary); padding: 1rem 0;">No recent activity</p>');return}try{const e=await fetch("/deployments",{headers:y()});if(e.ok){const n=await e.json();document.getElementById("totalDeployments").textContent=n.length,document.getElementById("runningApps").textContent=n.filter(a=>a.status==="success").length;const o=document.getElementById("recentActivity");n.length>0?o.innerHTML=n.slice(0,5).map(a=>`
          <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
            <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 0.25rem;">${a.container_name}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">
              ${new Date(a.created_at).toLocaleString()}
            </div>
          </div>
        `).join(""):o.innerHTML='<p style="text-align: center; color: var(--text-secondary); padding: 1rem 0;">No recent activity</p>'}}catch(e){console.error("Error loading dashboard:",e)}}async function C(t){var c,d,v,P;if(t.preventDefault(),!g){l("Please login to deploy applications","error"),window.location.href="/login";return}const e=t.target,n=((c=document.getElementById("deploy-type"))==null?void 0:c.value)||"single",o=(d=document.getElementById("git-url"))==null?void 0:d.value.trim(),a=(v=document.getElementById("frontend-url"))==null?void 0:v.value.trim(),r=(P=document.getElementById("backend-url"))==null?void 0:P.value.trim(),s=document.getElementById("deploy-status"),i=document.getElementById("deploy-success");if(i.style.display="none",s.textContent="",n==="split"){if(!a||!a.startsWith("http")||!r||!r.startsWith("http")){s.textContent="Please enter valid Frontend and Backend repository URLs",s.style.color="var(--error)";return}}else if(!o||!o.startsWith("http")){s.textContent="Please enter a valid Git repository URL",s.style.color="var(--error)";return}s.textContent="🚀 Deploying...",s.style.color="var(--primary)";try{const m=new FormData;n==="split"?(m.append("deploy_type","split"),m.append("frontend_url",a),m.append("backend_url",r)):(m.append("deploy_type","single"),m.append("git_url",o));const T=await fetch("/deploy",{method:"POST",headers:y(),body:m}),f=await T.json();T.ok?(s.textContent="✅ Deployment successful!",s.style.color="var(--success)",f.deployed_url&&(i.style.display="block",document.getElementById("openAppBtn").href=f.deployed_url,document.getElementById("openAppBtn").textContent=`Open ${f.deployed_url}`),e.reset(),setTimeout(()=>{I(),p.navigate("/applications")},2e3)):(s.textContent=`❌ Error: ${f.detail||"Deployment failed"}`,s.style.color="var(--error)")}catch{s.textContent="❌ Network error. Please try again.",s.style.color="var(--error)"}}async function B(){if(!g){document.getElementById("applicationsGrid").innerHTML=`
      <div class="empty-state">
        <p>Please login to view your applications</p>
        <a href="/login" class="btn-primary">Login</a>
      </div>
    `;return}try{const t=await fetch("/deployments",{headers:y()});if(t.ok){const e=await t.json(),n=document.getElementById("applicationsGrid");e.length===0?n.innerHTML=`
          <div class="empty-state">
            <p>No applications deployed yet</p>
            <a href="/deploy" class="btn-primary">Deploy Your First App</a>
          </div>
        `:n.innerHTML=e.map(o=>`
          <div class="application-card" onclick="window.open('${o.deployed_url||"#"}', '_blank')">
            <h3>${o.container_name}</h3>
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
        `).join("")}}catch(t){console.error("Error loading applications:",t)}}async function b(){if(!g){document.getElementById("historyTableBody").innerHTML=`
      <tr>
        <td colspan="5" class="empty-state">Please login to view deployment history</td>
      </tr>
    `;return}try{const t=await fetch("/deployments",{headers:y()});if(t.ok){const e=await t.json(),n=document.getElementById("historyTableBody");e.length===0?n.innerHTML=`
          <tr>
            <td colspan="5" class="empty-state">No deployment history</td>
          </tr>
        `:n.innerHTML=e.map(o=>`
          <tr>
            <td><strong>${o.container_name}</strong></td>
            <td>
              <span class="status-badge ${o.status}">
                ${o.status==="success"?"✅":o.status==="failed"?"❌":"🔄"} 
                ${o.status}
              </span>
            </td>
            <td>
              ${o.deployed_url?`<a href="${o.deployed_url}" target="_blank">${o.deployed_url}</a>`:"N/A"}
            </td>
            <td>${new Date(o.created_at).toLocaleString()}</td>
            <td>
              ${o.status==="success"?`<button class="btn-secondary" onclick="destroyDeployment('${o.container_name}')">Destroy</button>`:"-"}
            </td>
          </tr>
        `).join("")}}catch(t){console.error("Error loading history:",t)}}async function H(){if(confirm("Are you sure you want to clear all deployment history?"))try{(await fetch("/deployments/clear",{method:"DELETE",headers:y()})).ok&&(l("History cleared successfully","success"),b())}catch{l("Error clearing history","error")}}async function N(t){if(confirm(`Are you sure you want to destroy "${t}"?`))try{(await fetch(`/deployments/${t}`,{method:"DELETE",headers:y()})).ok?(l("Deployment destroyed successfully","success"),b(),B()):l("Error destroying deployment","error")}catch{l("Network error","error")}}async function F(){const t=document.getElementById("usernameSearch").value.trim();if(!t){l("Please enter a GitHub username","error");return}const e=document.getElementById("repositoriesGrid");e.innerHTML='<div class="empty-state"><p>Loading repositories...</p></div>';try{const n=await fetch(`/api/repositories/${t}`),o=await n.json();n.ok&&o.repositories?o.repositories.length===0?e.innerHTML='<div class="empty-state"><p>No repositories found</p></div>':e.innerHTML=o.repositories.map(a=>`
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
    `).join(""):e.innerHTML=`<div class="empty-state"><p>${o.detail||"Error loading repositories"}</p></div>`}catch{e.innerHTML='<div class="empty-state"><p>Error loading repositories</p></div>'}}function j(t){document.getElementById("git-url").value=t,p.navigate("/deploy"),l("Repository selected","success")}function R(){document.getElementById("repositoriesGrid").innerHTML=`
    <div class="empty-state">
      <p>Search for a GitHub username to see their repositories</p>
            </div>
        `}function l(t,e="info"){const n=document.getElementById("toast");n.textContent=t,n.className=`toast show ${e}`,setTimeout(()=>{n.classList.remove("show")},3e3)}let u={},w=[];async function S(){try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t){const n=document.getElementById("envVarsList");n&&(n.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `),$();return}const e=await fetch("/api/env-vars",{headers:{Authorization:`Bearer ${t}`}});if(e.ok){const n=await e.json();u=n.variables||{},w=n.vars_list||[],z()}else if(e.status===401){localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),h();const n=document.getElementById("envVarsList");n&&(n.innerHTML=`
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `)}else console.error("Failed to load environment variables")}catch(t){console.error("Error loading environment variables:",t)}$()}function $(){const t=document.getElementById("importEnvBtn"),e=document.getElementById("addEnvVarBtn"),n=document.getElementById("importEnvCard"),o=document.getElementById("cancelImportBtn"),a=document.getElementById("importEnvForm");t&&(t.onclick=()=>{n.style.display=n.style.display==="none"?"block":"none"}),o&&(o.onclick=()=>{n.style.display="none",document.getElementById("envFileInput").value=""}),e&&(e.onclick=()=>{G()}),a&&(a.onsubmit=async r=>{r.preventDefault();const i=document.getElementById("envFileInput").files[0];i&&await U(i)})}async function U(t){try{const n=(await t.text()).split(`
`),o={};n.forEach(a=>{if(a=a.trim(),a&&!a.startsWith("#")&&a.includes("=")){const[r,...s]=a.split("="),i=s.join("=").trim().replace(/^["']|["']$/g,"");r.trim()&&(o[r.trim()]=i)}}),u={...u,...o},await L(),document.getElementById("importEnvCard").style.display="none",document.getElementById("envFileInput").value="",l("Environment variables imported successfully!","success")}catch(e){console.error("Error importing .env file:",e),l("Failed to import .env file","error")}}function z(){const t=document.getElementById("envVarsList");if(t){if(w.length===0){t.innerHTML=`
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
        ${w.map((e,n)=>{const o=e.updated_at?q(new Date(e.updated_at)):"never";return`
            <tr>
              <td class="name-col">
                <span class="lock-icon">🔒</span>
                <span class="var-name">${E(e.key)}</span>
              </td>
              <td class="updated-col">
                <span class="updated-time">${o}</span>
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
  `}}function q(t){const n=new Date-t,o=Math.floor(n/6e4),a=Math.floor(n/36e5),r=Math.floor(n/864e5);return o<1?"just now":o<60?`${o} minute${o>1?"s":""} ago`:a<24?`${a} hour${a>1?"s":""} ago`:r<30?`${r} day${r>1?"s":""} ago`:t.toLocaleDateString()}function G(){k()}function k(t=null,e=""){const n=document.getElementById("envVarModal"),o=document.getElementById("modalVarKey"),a=document.getElementById("modalVarValue"),r=document.getElementById("modalTitle");t?(r.textContent="Update environment variable",o.value=t,o.readOnly=!0,a.value=e):(r.textContent="Add environment variable",o.value="",o.readOnly=!1,a.value=""),n.style.display="flex"}function _(){const t=document.getElementById("envVarModal");t.style.display="none"}async function O(){const t=document.getElementById("modalVarKey"),e=document.getElementById("modalVarValue"),n=t.value.trim(),o=e.value.trim();if(!n){l("Variable name is required","error");return}u[n]=o,await L(),_()}function x(t){const e=u[t]||"";k(t,e)}async function K(t){x(t)}async function W(t){confirm(`Are you sure you want to delete ${t}?`)&&(delete u[t],await L(),l("Environment variable deleted","success"))}function J(t){const n=document.querySelectorAll(".env-var-row")[t];if(!n)return;const o=n.querySelector(".env-var-value input");o.type==="password"?o.type="text":o.type="password"}async function L(){try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");(await fetch("/api/env-vars",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({variables:u})})).ok?(await S(),l("Environment variables saved successfully","success")):(console.error("Failed to save environment variables"),l("Failed to save environment variables","error"))}catch(t){console.error("Error saving environment variables:",t),l("Error saving environment variables","error")}}function Y(){const t=document.getElementById("modalVarValue"),e=document.querySelector('#envVarModal button[onclick*="toggleModalValueVisibility"]');t&&e&&(t.type==="password"?(t.type="text",e.textContent="🙈 Hide"):(t.type="password",e.textContent="👁️ Show"))}function E(t){const e=document.createElement("div");return e.textContent=t,e.innerHTML}async function A(){try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken");if(!t)return;const e=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${t}`}});if(e.ok){const n=await e.json(),o=document.getElementById("userName"),a=document.getElementById("userEmail"),r=document.getElementById("userAvatar");o&&(o.textContent=n.display_name||n.username||"User"),a&&(a.textContent=n.email||"Logged in"),r&&(n.avatar_url?(r.style.backgroundImage=`url(${n.avatar_url})`,r.style.backgroundSize="cover",r.style.backgroundPosition="center",r.textContent=""):(r.style.backgroundImage="",r.textContent=(n.display_name||n.username||"U").charAt(0).toUpperCase()))}else e.status===401&&(localStorage.removeItem("access_token"),localStorage.removeItem("authToken"),localStorage.removeItem("username"),h())}catch(t){console.error("Error loading user profile:",t)}}async function Q(){try{const t=localStorage.getItem("access_token")||localStorage.getItem("authToken"),e=await fetch("/api/user/profile",{headers:{Authorization:`Bearer ${t}`}});if(e.ok){const n=await e.json();document.getElementById("username").value=n.username||"",document.getElementById("email").value=n.email||"",document.getElementById("displayName").value=n.display_name||"",n.avatar_url&&(document.getElementById("avatarPreview").src=n.avatar_url,document.getElementById("avatarPreview").style.display="block",document.getElementById("avatarPlaceholder").style.display="none",document.getElementById("removeAvatarBtn").style.display="block")}}catch(t){console.error("Error loading profile:",t)}X()}function X(){const t=document.getElementById("profileForm"),e=document.getElementById("avatarFile"),n=document.getElementById("removeAvatarBtn");t&&t.addEventListener("submit",te),e&&e.addEventListener("change",Z),n&&n.addEventListener("click",ee)}function Z(t){const e=t.target.files[0];if(e){const n=new FileReader;n.onload=o=>{document.getElementById("avatarPreview").src=o.target.result,document.getElementById("avatarPreview").style.display="block",document.getElementById("avatarPlaceholder").style.display="none",document.getElementById("removeAvatarBtn").style.display="block"},n.readAsDataURL(e)}}function ee(){document.getElementById("avatarPreview").src="",document.getElementById("avatarPreview").style.display="none",document.getElementById("avatarPlaceholder").style.display="block",document.getElementById("removeAvatarBtn").style.display="none",document.getElementById("avatarFile").value=""}async function te(t){t.preventDefault();const e=document.getElementById("profileMessage");e.style.display="none";const n=new FormData;n.append("email",document.getElementById("email").value),n.append("display_name",document.getElementById("displayName").value);const o=document.getElementById("currentPassword").value,a=document.getElementById("newPassword").value,r=document.getElementById("confirmPassword").value;if(a||o){if(a!==r){e.textContent="New passwords do not match",e.className="profile-message error",e.style.display="block";return}if(a.length<6){e.textContent="New password must be at least 6 characters",e.className="profile-message error",e.style.display="block";return}n.append("current_password",o),n.append("new_password",a)}const s=document.getElementById("avatarFile").files[0];s&&n.append("avatar",s),document.getElementById("avatarPreview").style.display==="none"&&n.append("remove_avatar","true");try{const i=localStorage.getItem("access_token")||localStorage.getItem("authToken"),c=await fetch("/api/user/profile",{method:"PUT",headers:{Authorization:`Bearer ${i}`},body:n}),d=await c.json();if(c.ok)e.textContent="Profile updated successfully!",e.className="profile-message success",e.style.display="block",d.username&&localStorage.setItem("username",d.username),document.getElementById("currentPassword").value="",document.getElementById("newPassword").value="",document.getElementById("confirmPassword").value="",await A(),l("Profile updated successfully!","success");else{const v=d.detail||d.message||"Failed to update profile";e.textContent=v,e.className="profile-message error",e.style.display="block",console.error("Profile update failed:",d)}}catch(i){console.error("Error updating profile:",i);try{const c=await response.json();e.textContent=c.detail||"Network error. Please try again."}catch{e.textContent="Network error. Please try again."}e.className="profile-message error",e.style.display="block"}}window.destroyDeployment=N;window.selectRepository=j;window.editEnvVar=K;window.deleteEnvVar=W;window.toggleEnvVarVisibility=J;window.saveEnvVarFromModal=O;window.closeEnvVarModal=_;window.toggleModalValueVisibility=Y;window.editEnvVarModal=x;window.showEnvVarModal=k;
