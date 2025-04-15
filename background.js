let currentTabId = null;

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  currentTabId = activeInfo.tabId;
  console.log('[DEBUG] Tab activated:', activeInfo);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  if (request.type === 'getCredentials') {
    fetchCredentials(request.url)
      .then(credentials => {
        console.log('[DEBUG] Credentials fetched:', credentials);
        sendResponse({ success: true, credentials });
      })
      .catch(error => {
        console.error('[DEBUG] Error fetching credentials:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Required for async response
  }
});

async function fetchCredentials(url) {
  console.log('[DEBUG] Fetching credentials for URL:', url);
  
  const response = await fetch('http://localhost:5000/api/handle-credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ 
      action: 'get',
      url: url 
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('[DEBUG] Server error:', error);
    throw new Error(error.error || 'Failed to fetch credentials');
  }

  const data = await response.json();
  console.log('[DEBUG] Server response:', data);
  return data.credentials;
}
