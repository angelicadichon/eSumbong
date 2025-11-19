// Initialize Lucide icons
lucide.createIcons();

// DOM Elements
const editToggleBtn = document.getElementById('editToggleBtn');
const profileForm = document.getElementById('profileForm');
const saveBtn = profileForm.querySelector('button[type="submit"]');
const passwordSection = document.querySelector('.password-section');
const profileUpload = document.getElementById('profileUpload');
const profileImage = document.getElementById('profileImage');
const statusMsg = document.getElementById('statusMsg');

// State
let isEditMode = false;
let originalFormData = {};
let currentUsername = '';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Profile page loaded');
    
    // Get username from localStorage or URL
    currentUsername = getCurrentUsername();
    console.log('Current username:', currentUsername);
    
    // Set up event listeners
    setupEventListeners();
    
    // Then load user data
    loadUserData();
});

function getCurrentUsername() {
    // Try to get username from localStorage (set during login)
    const username = localStorage.getItem('username') || 
                    sessionStorage.getItem('username') || 
                    'admin'; // fallback
    
    console.log('Retrieved username:', username);
    return username;
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Edit mode toggle
    editToggleBtn.addEventListener('click', toggleEditMode);
    
    // Form submission
    profileForm.addEventListener('submit', handleFormSubmit);
    
    // Profile image upload preview
    profileUpload.addEventListener('change', handleImageUpload);
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    console.log('Event listeners setup complete');
}

function toggleEditMode() {
    isEditMode = !isEditMode;
    console.log('Edit mode toggled:', isEditMode);

    // Toggle edit mode
    const profileCard = document.querySelector('.profile-card');
    if (profileCard) {
        profileCard.classList.toggle('edit-mode', isEditMode);
    }

    if (isEditMode) {
        // Entering edit mode
        profileForm.classList.remove('view-mode');
        editToggleBtn.textContent = 'Cancel';
        saveBtn.style.display = 'inline-block';
        passwordSection.style.display = 'block';
        
        // Save original data
        saveOriginalFormData();
    } else {
        // Canceling edit mode - RELOAD DATA FROM SERVER instead of resetting to old values
        profileForm.classList.add('view-mode');
        editToggleBtn.textContent = 'Edit Profile';
        saveBtn.style.display = 'none';
        passwordSection.style.display = 'none';
        
        // RELOAD FRESH DATA FROM SERVER instead of resetting to original
        reloadUserData();
        
        // Hide status message
        if (statusMsg) {
            statusMsg.style.display = 'none';
        }
    }
}

function saveOriginalFormData() {
    originalFormData = {
        fullName: document.getElementById('full_name').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        address: document.getElementById('address').value
    };
    console.log('Original data saved for cancel operation');
}

async function reloadUserData() {
    try {
        console.log('Reloading user data after update...');
        const response = await fetch(`/api/get-profile?username=${encodeURIComponent(currentUsername)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const userData = await response.json();
        console.log('Reloaded user data:', userData);
        
        if (userData.success) {
            // Update form fields with fresh data from server
            updateFormFields(userData);
            console.log('Form fields updated with fresh data');
        } else {
            console.error('Failed to reload user data:', userData.message);
        }
    } catch (error) {
        console.error('Error reloading user data:', error);
    }
}

// Helper function to update form fields
function updateFormFields(userData) {
    document.getElementById('username').value = userData.username || currentUsername;
    document.getElementById('full_name').value = userData.full_name || '';
    document.getElementById('phone').value = userData.phone || '';
    document.getElementById('email').value = userData.email || '';
    document.getElementById('address').value = userData.address || '';
    
    // Update profile header
    document.getElementById('adminName').textContent = userData.full_name || userData.username || 'Your Name';
    document.getElementById('adminEmail').textContent = userData.email || 'No email set';
    
    // Update profile image
    if (userData.avatar_url) {
        profileImage.src = userData.avatar_url;
        console.log('Avatar reloaded:', userData.avatar_url);
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    console.log('Form submission started');
    
    // Show loading state
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    if (statusMsg) {
        statusMsg.style.display = 'block';
        statusMsg.textContent = 'Updating profile...';
        statusMsg.style.backgroundColor = '#d1ecf1';
        statusMsg.style.color = '#0c5460';
        statusMsg.style.border = '1px solid #bee5eb';
    }

    const formData = new FormData();
    formData.append("username", currentUsername);
    formData.append("full_name", document.getElementById("full_name").value); 
    formData.append("phone", document.getElementById("phone").value);
    formData.append("email", document.getElementById("email").value);
    formData.append("address", document.getElementById("address").value);
    
    // Only append password if provided
    const newPassword = document.getElementById("newPassword").value;
    const oldPassword = document.getElementById("oldPassword").value;
    if (newPassword) {
        formData.append("newPassword", newPassword);
        formData.append("currentPassword", oldPassword); // Add current password for verification
    }
    
    // Append avatar file if selected
    const avatarFile = document.getElementById("profileUpload").files[0];
    if (avatarFile) {
        console.log('Avatar file selected:', avatarFile.name);
        formData.append("avatar", avatarFile);
    }

    try {
        console.log('Sending request to /api/update-profile...');
        const response = await fetch("/api/update-profile", {
            method: "POST",
            body: formData,
        });

        console.log('Response status:', response.status);

        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            console.error('Non-JSON response:', text.substring(0, 200));
            throw new Error("Server returned HTML instead of JSON. Check if API endpoint exists.");
        }

        const result = await response.json();
        console.log('API response:', result);

        if (result.success) {
            if (statusMsg) {
                statusMsg.textContent = result.message || "Profile updated successfully!";
                statusMsg.style.backgroundColor = '#d4edda';
                statusMsg.style.color = '#155724';
                statusMsg.style.border = '1px solid #c3e6cb';
            }
            
            // Update profile image if new one was uploaded
            if (result.avatar_url) {
                profileImage.src = result.avatar_url;
                console.log('Avatar updated:', result.avatar_url);
            }
            
            // Update header information immediately
            document.getElementById('adminName').textContent = document.getElementById('full_name').value;
            document.getElementById('adminEmail').textContent = document.getElementById('email').value;
            
            // RELOAD DATA FROM SERVER to ensure consistency
            await reloadUserData();
            
            setTimeout(() => {
                isEditMode = true; 
                toggleEditMode();
            }, 1500);
            
        } else {
            console.error('API error:', result.message);
            if (statusMsg) {
                statusMsg.textContent = "Error: " + (result.message || "Unknown error");
                statusMsg.style.backgroundColor = '#f8d7da';
                statusMsg.style.color = '#721c24';
                statusMsg.style.border = '1px solid #f5c6cb';
            }
        }
    } catch (error) {
        console.error('Form submission error:', error);
        if (statusMsg) {
            statusMsg.textContent = "Failed to update profile: " + error.message;
            statusMsg.style.backgroundColor = '#f8d7da';
            statusMsg.style.color = '#721c24';
            statusMsg.style.border = '1px solid #f5c6cb';
        }
    } finally {
        // Reset button state
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
    }
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        console.log('Image selected for preview:', file.name);
        const reader = new FileReader();
        reader.onload = () => {
            // Update profile image preview immediately
            profileImage.src = reader.result;
            console.log('Image preview updated');
        };
        reader.readAsDataURL(file);
    }
}

async function loadUserData() {
    try {
        console.log('Loading user data for:', currentUsername);
        const response = await fetch(`/api/get-profile?username=${encodeURIComponent(currentUsername)}`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            console.warn('Non-JSON response received:', text.substring(0, 200));
            setDefaultValues();
            return;
        }

        const userData = await response.json();
        console.log('User data loaded:', userData);
        
        if (userData.success) {
            // Use the helper function to populate form fields
            updateFormFields(userData);
            console.log('User data populated successfully');
        } else {
            console.error('API returned error:', userData.message);
            setDefaultValues();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        setDefaultValues();
    }
}

function setDefaultValues() {
    console.log('Setting default values for:', currentUsername);
    // Set default values when API fails
    document.getElementById('username').value = currentUsername;
    document.getElementById('full_name').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('email').value = '';
    document.getElementById('address').value = '';
    
    document.getElementById('adminName').textContent = currentUsername;
    document.getElementById('adminEmail').textContent = 'No email set';
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('username');
        sessionStorage.removeItem('username');
        window.location.href = 'index.html';
    }
}

// Additional helper function to clear password fields
function clearPasswordFields() {
    document.getElementById('oldPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

// Add input validation for better UX
function setupInputValidation() {
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    
    if (emailInput) {
        emailInput.addEventListener('blur', validateEmail);
    }
    
    if (phoneInput) {
        phoneInput.addEventListener('blur', validatePhone);
    }
}

function validateEmail() {
    const email = document.getElementById('email').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && !emailRegex.test(email)) {
        showFieldError('email', 'Please enter a valid email address');
        return false;
    } else {
        clearFieldError('email');
        return true;
    }
}

function validatePhone() {
    const phone = document.getElementById('phone').value;
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    
    if (phone && !phoneRegex.test(phone)) {
        showFieldError('phone', 'Please enter a valid phone number');
        return false;
    } else {
        clearFieldError('phone');
        return true;
    }
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const existingError = field.parentNode.querySelector('.field-error');
    
    if (existingError) {
        existingError.textContent = message;
    } else {
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        errorElement.style.color = '#dc3545';
        errorElement.style.fontSize = '0.875rem';
        errorElement.style.marginTop = '0.25rem';
        field.parentNode.appendChild(errorElement);
    }
    
    field.style.borderColor = '#dc3545';
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const existingError = field.parentNode.querySelector('.field-error');
    
    if (existingError) {
        existingError.remove();
    }
    
    field.style.borderColor = '';
}

// Initialize input validation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupInputValidation();
});