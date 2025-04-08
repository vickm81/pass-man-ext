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
    if (message.type === 'fillCredentials') {
        autofillCredentials(message.credentials);
    }
});

let lastFocusedInput = null;

function findLoginFields() {
    
    const usernameSelectors = [
        // Specific to this case
        'input[formcontrolname="email_address"]',
        'input[formcontrolname="email"]',
        
        // General selectors
        'input[type="email"]',
        'input[type="text"][id*="email"]',
        'input[type="text"][id*="name"]',
        'input[type="text"][name*="email"]',
        'input[type="text"][name*="name"]',
        'input[type="text"][formcontrolname*="mail"]',
        'input[autocomplete="username"]',
        'input[autocomplete="email"]',
        'input[type="text"][id*="user"]',
        'input[type="text"][name*="user"]'

    ];

    const passwordSelectors = [
        'input[formcontrolname="password"]',
        
        'input[type="password"]',
        'input[type="password"][id*="password"]',
        'input[autocomplete="current-password"]',
        'input[name*="password"]',
        'input[id*="password"]',
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
    const { usernameField, passwordField } = findLoginFields();

    if (usernameField && passwordField) {        
        try {
            // Simulate natural typing
            usernameField.value = credentials.username;
            usernameField.dispatchEvent(new Event('input', { bubbles: true }));
            usernameField.dispatchEvent(new Event('change', { bubbles: true }));

            passwordField.value = credentials.password;
            passwordField.dispatchEvent(new Event('input', { bubbles: true }));
            passwordField.dispatchEvent(new Event('change', { bubbles: true }));


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
            
            chrome.runtime.sendMessage({
                type: 'getCredentials',
                url: window.location.href
            }, response => {                
                if (response?.success && response.credentials?.length > 0) {
                    if (response.credentials.length === 1) {
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

