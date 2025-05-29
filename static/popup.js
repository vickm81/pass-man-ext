document.addEventListener("DOMContentLoaded", () => {

  const fetchPasswordsBtn = document.getElementById("passwords-tab");


  (async () => {
      console.log('[DEBUG] Popup opened');
      
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = tabs[0].url;
  
      try {
          const response = await fetch('http://localhost:8080/api/handle-credentials', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ 
                  action: 'get',
                  url: currentUrl 
              })
          });
  
          const data = await response.json();
          
          if (data.credentials?.length > 0) {
              const credentialsList = document.getElementById('credentials-list');
              credentialsList.innerHTML = ''; 
              
              data.credentials.forEach(cred => {
                  
                  const credItem = document.createElement('div');
                  credItem.className = 'credential-item list-group-item list-group-item-action';
                  credItem.innerHTML = `
                  <div class="d-flex w-100" style="gap: 8px">
                    <h6 class="mb-0 text-truncate flex-grow-1" style="min-width: 0">${cred.username}</h6>
                    <small class="text-muted flex-shrink-0">@ ${cred.website}</small>
                  </div>
                  `;
                  
                  credItem.addEventListener('click', () => {                      
                      chrome.tabs.sendMessage(tabs[0].id, {
                          type: 'fillCredentials',
                          credentials: cred
                      });
                      window.close();
                  });
                  
                  credentialsList.appendChild(credItem);
              });
          } else {
              document.getElementById('credentials-list').innerHTML = '<p class="text-center text-muted">No saved credentials for this site</p>';
          }
      } catch (error) {
          document.getElementById('credentials-list').innerHTML = '<p class="text-center text-muted">Error loading credentials</p>';
      }
  })();
});