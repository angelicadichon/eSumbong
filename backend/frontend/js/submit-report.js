// Submit Report functionality
document.addEventListener('DOMContentLoaded', function() {
    const complaintForm = document.getElementById('complaintForm');
    
    if (complaintForm) {
        complaintForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Refresh icons after form reset
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                lucide.createIcons();
            }
        });
    });
    
    if (complaintForm) {
        observer.observe(complaintForm, { childList: true, subtree: true });
    }
});

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const responseEl = document.getElementById('response');
    const formData = new FormData(this);
    
    // Validate file size
    const file = formData.get('file');
    if (file && file.size > 5 * 1024 * 1024) { // 5MB limit
        showErrorMessage(responseEl, '❌ File size must be less than 5MB');
        return;
    }
    
    // Show loading state
    setButtonLoadingState(submitBtn, true);
    clearResponseMessage(responseEl);
    
    try {
        const response = await fetch('/api/complaints', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccessMessage(responseEl, `✅ ${result.message} Reference: ${result.reference}`);
            this.reset(); // Clear form
            lucide.createIcons(); // Refresh icons after reset
        } else {
            throw new Error(result.message || 'Failed to submit report');
        }
    } catch (error) {
        showErrorMessage(responseEl, `❌ Error: ${error.message}`);
    } finally {
        setButtonLoadingState(submitBtn, false);
    }
}

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