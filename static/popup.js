document.addEventListener("DOMContentLoaded", () => {

  const fetchPasswordsBtn = document.getElementById("passwords-tab");
  const passwordList = document.getElementById("password-list");

  // Fetch saved passwords
  fetchPasswordsBtn.addEventListener("click", async () => {
      try {
          // Show loading spinner
          passwordList.innerHTML = `
              <div class="text-center py-3">
                  <div class="spinner-border" role="status">
                      <span class="visually-hidden">Loading...</span>
                  </div>
              </div>
          `;

          const response = await fetch("http://0.0.0.0:5000/get_passwords_ext");
          
          if (!response.ok) {
              throw new Error('Failed to fetch passwords');
          }
          
          // Use text() instead of json() for HTML template
          const htmlContent = await response.text();
          
          // Insert the HTML content
          passwordList.innerHTML = htmlContent;
          setupPasswordTableInteractions();
          
      } catch (error) {
          console.error("Error fetching passwords:", error);
          passwordList.innerHTML = `
              <div class="alert alert-danger text-center" role="alert">
                  Failed to load passwords. ${error.message}
              </div>
          `;
      }
  });
  
  // Setup interactions for password table (toggle and copy)
  function setupPasswordTableInteractions() {
    // Toggle password visibility
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const passwordCell = this.previousElementSibling;
            const isHidden = passwordCell.textContent.trim() === '••••••••';
            
            if (isHidden) {
                passwordCell.textContent = passwordCell.dataset.password;
                this.innerHTML = '<i class="bi bi-eye-slash"></i>';
            } else {
                passwordCell.textContent = '••••••••';
                this.innerHTML = '<i class="bi bi-eye"></i>';
            }
        });
    });


    // Copy credentials to clipboard
    document.querySelectorAll('.copy-credentials').forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const website = row.querySelector('td:nth-child(1)').textContent;
            const username = row.querySelector('td:nth-child(2)').textContent;
            const password = row.querySelector('.password-cell').dataset.password;

            const textToCopy = `Website: ${website}\nUsername: ${username}\nPassword: ${password}`;
            
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalIcon = button.innerHTML;
                button.innerHTML = '<i class="bi bi-check2"></i>';
                button.classList.remove('btn-outline-primary');
                button.classList.add('btn-success');
                
                setTimeout(() => {
                    button.innerHTML = originalIcon;
                    button.classList.add('btn-outline-primary');
                    button.classList.remove('btn-success');
                }, 2000);
            });
        });
    });

}

  (async () => {
      console.log('[DEBUG] Popup opened');
      
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = tabs[0].url;
  
      try {
          const response = await fetch('http://0.0.0.0:5000/api/handle-credentials', {
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