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

          const response = await fetch("http://localhost:5000/get_passwords_ext");
          
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

  // Credentials loading code remains the same
  (async () => {
      console.log('[DEBUG] Popup opened');
      
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = tabs[0].url;
      console.log('[DEBUG] Current URL:', currentUrl);
  
      try {
          const response = await fetch('http://localhost:5000/api/handle-credentials', {
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
          console.log('[DEBUG] Received credentials:', data);
          
          if (data.credentials?.length > 0) {
              const credentialsList = document.getElementById('credentials-list');
              credentialsList.innerHTML = ''; // Clear any existing content
              
              data.credentials.forEach(cred => {
                  console.log('[DEBUG] Adding credential to list:', cred.username);
                  
                  const credItem = document.createElement('div');
                  credItem.className = 'credential-item list-group-item list-group-item-action';
                  credItem.innerHTML = `
                      <div class="d-flex w-100 justify-content-between">
                          <h5 class="mb-1">${cred.username}</h5>
                          <small>${cred.website}</small>
                      </div>
                  `;
                  
                  credItem.addEventListener('click', () => {
                      console.log('[DEBUG] Credential selected:', cred.username);
                      
                      chrome.tabs.sendMessage(tabs[0].id, {
                          type: 'fillCredentials',
                          credentials: cred
                      });
                      window.close();
                  });
                  
                  credentialsList.appendChild(credItem);
              });
          } else {
              console.log('[DEBUG] No credentials found');
              document.getElementById('credentials-list').innerHTML = '<p class="text-center text-muted">No saved credentials for this site</p>';
          }
      } catch (error) {
          console.error('[DEBUG] Error loading credentials:', error);
          document.getElementById('credentials-list').innerHTML = '<p class="text-center text-muted">Error loading credentials</p>';
      }
  })();
});