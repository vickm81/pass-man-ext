document.addEventListener("DOMContentLoaded", () => {
    const generatePasswordBtn = document.getElementById("generate-password");
    const generatedPasswordField = document.getElementById("save-password-input");
    const fetchPasswordsBtn = document.getElementById("fetch-passwords");
    const passwordList = document.getElementById("password-list");
    const savePasswordBtn = document.getElementById("save-password");
    const home  = document.getElementById("home");
  
  
    // Fetch saved passwords
    fetchPasswordsBtn.addEventListener("click", async () => {
      home.classList.remove("active");
      fetchPasswordsBtn.classList.add("active");
      try {
          const response = await fetch("http://localhost:5000/get_passwords");
          if (response.ok) {
              passwordList.innerHTML = "<p>Loading passwords...</p>";
              const html = await response.text(); // Await response.text()
              passwordList.innerHTML = html; // Assign the resolved HTML content
              document.addEventListener("click", (event) => {
                if (event.target.classList.contains("copy-btn")) {
                    const value = event.target.getAttribute("data-value"); // Get the value to copy
            
                    navigator.clipboard.writeText(value).then(() => {
                        // Change icon color temporarily to indicate success
                        event.target.classList.add("text-success");
                        setTimeout(() => event.target.classList.remove("text-success"), 1000);
                    }).catch(err => {
                        console.error("Failed to copy:", err);
                    });
                }
            });
            
          } else {
              passwordList.innerHTML = "<p>Failed to load passwords.</p>";
          }
      } catch (error) {
          console.error("Error fetching passwords:", error);
          passwordList.innerHTML = "<p>Error loading passwords.</p>";
      }
  });

    
  });

  document.addEventListener('DOMContentLoaded', async () => {
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
        
        data.credentials.forEach(cred => {
          console.log('[DEBUG] Adding credential to list:', cred.username);
          
          const credItem = document.createElement('div');
          credItem.className = 'credential-item';
          credItem.textContent = `${cred.username} (${cred.website})`;
          
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
        document.getElementById('credentials-list').textContent = 'No saved credentials for this site';
      }
    } catch (error) {
      console.error('[DEBUG] Error loading credentials:', error);
      document.getElementById('credentials-list').textContent = 'Error loading credentials';
    }
  });
  
  