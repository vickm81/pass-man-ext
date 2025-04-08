// Create a dedicated debug logger for content script
const contentDebug = {
    log: (...args) => {
        console.log('%c[Content Script]', 'background: #e0f7fa; color: #006064; padding: 2px 5px; border-radius: 3px;', ...args);
    },
    error: (...args) => {
        console.error('%c[Content Script]', 'background: #ffebee; color: #c62828; padding: 2px 5px; border-radius: 3px;', ...args);
    }
};

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    contentDebug.log('Message received:', message);
    if (message.type === 'fillCredentials') {
        contentDebug.log('Filling credentials for:', message.credentials.website);
        autofillCredentials(message.credentials);
    }
});

let lastFocusedInput = null;

function findLoginFields() {
    contentDebug.log('Searching for login fields on page:', window.location.href);
    
    const usernameSelectors = [
        // Specific to this case
        'input[formcontrolname="email_address"]',
        'input[formcontrolname="email"]',
        
        // General selectors
        'input[type="email"]',
        'input[type="text"][id*="email"]',
        'input[type="text"][name*="email"]',
        'input[type="text"][formcontrolname*="mail"]',
        'input[autocomplete="username"]',
        'input[autocomplete="email"]'
    ];

    const passwordSelectors = [
        // Specific to this case
        'input[formcontrolname="password"]',
        
        // General selectors
        'input[type="password"]',
        'input[autocomplete="current-password"]',
        'input[name*="pass"]',
        'input[id*="pass"]',
        'input[formcontrolname*="pass"]'
    ];

    const usernameField = document.querySelector(usernameSelectors.join(','));
    const passwordField = document.querySelector(passwordSelectors.join(','));

    contentDebug.log('Fields found:', {
        usernameField: usernameField ? {
            type: usernameField.type,
            id: usernameField.id,
            name: usernameField.name
        } : null,
        passwordField: passwordField ? {
            type: passwordField.type,
            id: passwordField.id,
            name: passwordField.name
        } : null
    });

    return { usernameField, passwordField };
}

function autofillCredentials(credentials) {
    contentDebug.log('Starting autofill process');
    
    const { usernameField, passwordField } = findLoginFields();

    if (usernameField && passwordField) {
        contentDebug.log('Found both username and password fields, proceeding with autofill');
        
        try {
            // Simulate natural typing
            usernameField.value = credentials.username;
            usernameField.dispatchEvent(new Event('input', { bubbles: true }));
            usernameField.dispatchEvent(new Event('change', { bubbles: true }));
            contentDebug.log('Username field filled and events dispatched');

            passwordField.value = credentials.password;
            passwordField.dispatchEvent(new Event('input', { bubbles: true }));
            passwordField.dispatchEvent(new Event('change', { bubbles: true }));
            contentDebug.log('Password field filled and events dispatched');

            // Update last used timestamp
            updateLastUsed(credentials);
        } catch (error) {
            contentDebug.error('Error during autofill:', error);
        }
    } else {
        contentDebug.error('Could not find all required fields:', {
            hasUsernameField: !!usernameField,
            hasPasswordField: !!passwordField
        });
    }
}

async function updateLastUsed(credentials) {
    contentDebug.log('Updating last used timestamp for:', credentials.website);
    
    try {
        const response = await fetch('http://0.0.0.0:5000/api/handle-credentials', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                action: 'update',
                website: credentials.website,
                username: credentials.username
            })
        });

        const data = await response.json();
        contentDebug.log('Update response:', data);
    } catch (error) {
        contentDebug.error('Failed to update last used timestamp:', error);
    }
}

// Listen for focus on input fields
document.addEventListener('focusin', (e) => {
    if (e.target.tagName === 'INPUT') {
        contentDebug.log('Input field focused:', {
            type: e.target.type,
            id: e.target.id,
            name: e.target.name
        });
        
        lastFocusedInput = e.target;
        
        // Check if this is a login form
        const { usernameField, passwordField } = findLoginFields();
        if (usernameField || passwordField) {
            contentDebug.log('Login form detected, requesting credentials');
            
            chrome.runtime.sendMessage({
                type: 'getCredentials',
                url: window.location.href
            }, response => {
                contentDebug.log('Received credential response:', response);
                
                if (response?.success && response.credentials?.length > 0) {
                    if (response.credentials.length === 1) {
                        contentDebug.log('Single credential found, proceeding with autofill');
                        autofillCredentials(response.credentials[0]);
                    } else {
                        contentDebug.log('Multiple credentials found:', response.credentials.length);
                    }
                } else {
                    contentDebug.log('No credentials found or error in response');
                }
            });
        }
    }
});

// Monitor DOM changes for dynamically added login forms
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
            contentDebug.log('DOM changed, checking for new login fields');
            const { usernameField, passwordField } = findLoginFields();
            if (usernameField || passwordField) {
                contentDebug.log('Login form found in dynamic content');
            }
        }
    }
});

// Start observing DOM changes
observer.observe(document.body, {
    childList: true,
    subtree: true
});

contentDebug.log('Content script initialized on:', window.location.href);