import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */let s=null,l="",c=localStorage.getItem("authToken");document.addEventListener("DOMContentLoaded",function(){const e=new URLSearchParams(window.location.search),t=e.get("repo"),n=e.get("owner");t&&n?d(n,t):(i("No repository specified","error"),setTimeout(()=>{window.location.href="/"},2e3))});async function d(e,t,n=""){s={owner:e,repo:t},l=n,w();try{const o={"Content-Type":"application/json"};c&&(o.Authorization=`Bearer ${c}`);const r=await fetch(`/api/repository/${e}/${t}/contents${n?`/${n}`:""}`,{headers:o});if(r.status===401){p();return}const a=await r.json();r.ok?(E(),y(a.contents||a),b()):i(a.detail||"Failed to load repository contents","error")}catch(o){console.error("Error loading repository tree:",o),i("Failed to load repository contents","error")}}function y(e){const t=document.getElementById("tree-container");if(t.innerHTML="",!e||e.length===0){t.innerHTML=`
            <div class="empty-state">
                <div class="empty-state-icon">📁</div>
                <p>This directory is empty</p>
            </div>
        `;return}e.sort((o,r)=>o.type==="dir"&&r.type!=="dir"?-1:o.type!=="dir"&&r.type==="dir"?1:o.name.localeCompare(r.name)).forEach(o=>{const r=f(o);t.appendChild(r)})}function f(e){const t=document.createElement("div");t.className="tree-item",t.dataset.path=e.path,t.dataset.type=e.type;const n=e.type==="dir"?"📁":v(e.name),o=e.name;return t.innerHTML=`
        <span class="tree-item-icon">${n}</span>
        <span class="tree-item-name">${o}</span>
    `,t.addEventListener("click",()=>h(e)),t}function h(e){e.type==="dir"?d(s.owner,s.repo,e.path):g(e)}async function g(e){const t=document.getElementById("file-container"),n=document.getElementById("file-loading");n.style.display="block";try{const o={"Content-Type":"application/json"};c&&(o.Authorization=`Bearer ${c}`);const r=await fetch(`/api/repository/${s.owner}/${s.repo}/contents/${e.path}`,{headers:o});if(r.status===401){p();return}const a=await r.json();if(r.ok)if(n.style.display="none",a.type==="file"){const m=atob(a.content),u=e.name.split(".").pop().toLowerCase();t.innerHTML=`
                    <div class="file-header">
                        <div class="file-name">${e.name}</div>
                        <div class="file-size">${x(a.size)}</div>
                    </div>
                    <pre><code class="language-${u}">${B(m)}</code></pre>
                `,window.Prism&&Prism.highlightAll()}else t.innerHTML=`
                    <div class="empty-state">
                        <div class="empty-state-icon">⚠️</div>
                        <p>Unable to display this file type</p>
                    </div>
                `;else i(a.detail||"Failed to load file content","error")}catch(o){console.error("Error loading file content:",o),i("Failed to load file content","error")}}function v(e){const t=e.split(".").pop().toLowerCase();return{js:"📄",jsx:"📄",ts:"📄",tsx:"📄",py:"🐍",java:"☕",cpp:"⚙️",c:"⚙️",html:"🌐",css:"🎨",scss:"🎨",sass:"🎨",json:"📋",xml:"📋",yml:"📋",yaml:"📋",md:"📝",txt:"📝",sql:"🗄️",sh:"🐚",bat:"🪟",dockerfile:"🐳",gitignore:"🚫"}[t]||"📄"}function b(){const e=document.getElementById("breadcrumb");if(document.getElementById("current-repo"),l){const t=l.split("/");let n=`
            <span class="breadcrumb-item" onclick="navigateToRoot()">${s.repo}</span>
        `,o="";t.forEach((r,a)=>{r&&(o+=(a>0?"/":"")+r,n+=`
                    <span class="breadcrumb-separator">/</span>
                    <span class="breadcrumb-item" onclick="navigateToPath('${o}')">${r}</span>
                `)}),e.innerHTML=n}else e.innerHTML=`
            <span class="breadcrumb-item" onclick="navigateToRoot()">Repositories</span>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-item">${s.repo}</span>
        `}function T(){window.location.href="/"}function w(){document.getElementById("tree-loading").style.display="flex",document.getElementById("tree-container").style.display="none"}function E(){document.getElementById("tree-loading").style.display="none",document.getElementById("tree-container").style.display="block"}function p(){localStorage.removeItem("authToken"),localStorage.removeItem("username"),i("Session expired. Please login again.","error"),setTimeout(()=>{window.location.href="/login"},2e3)}function i(e,t="info"){const n=document.createElement("div");n.className="toast",n.textContent=e,n.style.cssText=`
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        z-index: 1000;
        background: ${t==="error"?"#ef4444":t==="success"?"#22c55e":"#3b82f6"};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.3s ease;
    `,document.body.appendChild(n),setTimeout(()=>{n.style.opacity="0",setTimeout(()=>n.remove(),300)},3e3)}function x(e){if(e===0)return"0 Bytes";const t=1024,n=["Bytes","KB","MB","GB"],o=Math.floor(Math.log(e)/Math.log(t));return parseFloat((e/Math.pow(t,o)).toFixed(2))+" "+n[o]}function B(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}document.addEventListener("DOMContentLoaded",function(){const e=document.querySelector(".back-button");e&&e.addEventListener("click",T)});
