// Submit Report functionality
document.addEventListener('DOMContentLoaded', function() {
    const complaintForm = document.getElementById('complaintForm');
    
    if (complaintForm) {
        complaintForm.addEventListener('submit', handleFormSubmit);
    }
});

async function handleFormSubmit(e) {
    e.preventDefault();
    console.log('🔄 Form submission started');
    
    const submitBtn = document.getElementById('submitBtn');
    const responseEl = document.getElementById('response');
    const formData = new FormData(this);
    
    // Log form data for debugging
    for (let [key, value] of formData.entries()) {
        console.log(`📋 ${key}:`, value);
    }
    
    // Validate file size
    const file = formData.get('file');
    if (file && file.size > 5 * 1024 * 1024) {
        showErrorMessage(responseEl, '❌ File size must be less than 5MB');
        return;
    }
    
    // Show loading state
    setButtonLoadingState(submitBtn, true);
    clearResponseMessage(responseEl);
    
    try {
        console.log('📤 Sending request to /api/complaints');
        const response = await fetch('/api/complaints', {
            method: 'POST',
            body: formData
        });
        
        console.log('📥 Received response, status:', response.status);
        
        let result;
        try {
            result = await response.json();
            console.log('📄 Response data:', result);
        } catch (parseError) {
            console.error('❌ Failed to parse JSON response:', parseError);
            throw new Error('Invalid server response');
        }
        
        if (response.ok && result.success) {
            showSuccessMessage(responseEl, `✅ ${result.message} Reference: ${result.reference}`);
            this.reset();
            lucide.createIcons();
        } else {
            throw new Error(result.message || `Server error: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Form submission error:', error);
        showErrorMessage(responseEl, `❌ Error: ${error.message}`);
    } finally {
        setButtonLoadingState(submitBtn, false);
    }
}

// ... rest of the functions remain the same
function setButtonLoadingState(button, isLoading) {
    if (!button) return;
    
    button.disabled = isLoading;
    const span = button.querySelector('span');
    const spinner = button.querySelector('.loading-spinner');
    
    if (span) span.style.display = isLoading ? 'none' : 'block';
    if (spinner) spinner.style.display = isLoading ? 'flex' : 'none';
}

function clearResponseMessage(responseEl) {
    if (responseEl) {
        responseEl.textContent = '';
        responseEl.className = 'response-text';
    }
}

function showSuccessMessage(responseEl, message) {
    if (responseEl) {
        responseEl.textContent = message;
        responseEl.className = 'response-text success';
    }
}

function showErrorMessage(responseEl, message) {
    if (responseEl) {
        responseEl.textContent = message;
        responseEl.className = 'response-text error';
    }
}