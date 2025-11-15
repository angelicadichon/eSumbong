// Initialize Lucide icons
lucide.createIcons();

// API base URL
const API_BASE = "http://localhost:5200";

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
    currentUsername = getCurrentUsername();
    setupEventListeners();
    loadUserData();
});

function getCurrentUsername() {
    return localStorage.getItem('username') || sessionStorage.getItem('username') || 'admin';
}

function setupEventListeners() {
    editToggleBtn.addEventListener('click', toggleEditMode);
    profileForm.addEventListener('submit', handleFormSubmit);
    profileUpload.addEventListener('change', handleImageUpload);
}

function toggleEditMode() {
    isEditMode = !isEditMode;
    const profileCard = document.querySelector('.profile-card');
    profileCard.classList.toggle('edit-mode', isEditMode);

    if (isEditMode) {
        profileForm.classList.remove('view-mode');
        editToggleBtn.textContent = 'Cancel';
        saveBtn.style.display = 'inline-block';
        passwordSection.style.display = 'block';
        saveOriginalFormData();
    } else {
        profileForm.classList.add('view-mode');
        editToggleBtn.textContent = 'Edit Profile';
        saveBtn.style.display = 'none';
        passwordSection.style.display = 'none';
        reloadUserData();
        statusMsg.style.display = 'none';
    }
}

function saveOriginalFormData() {
    originalFormData = {
        fullName: document.getElementById('fullName').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        address: document.getElementById('address').value
    };
}

async function reloadUserData() {
    const response = await fetch(`${API_BASE}/api/get-profile?username=${encodeURIComponent(currentUsername)}`);
    const userData = await response.json();
    if (userData.success) updateFormFields(userData);
}

function updateFormFields(userData) {
    document.getElementById('username').value = userData.username;
    document.getElementById('fullName').value = userData.full_name || '';
    document.getElementById('phone').value = userData.phone || '';
    document.getElementById('email').value = userData.email || '';
    document.getElementById('address').value = userData.address || '';
    document.getElementById('adminName').textContent = userData.full_name || userData.username;
    document.getElementById('adminEmail').textContent = userData.email || '';

    if (userData.avatar_url) profileImage.src = userData.avatar_url;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const formData = new FormData();
    formData.append("username", currentUsername);
    formData.append("full_name", document.getElementById("fullName").value);
    formData.append("phone", document.getElementById("phone").value);
    formData.append("email", document.getElementById("email").value);
    formData.append("address", document.getElementById("address").value);

    const newPassword = document.getElementById("newPassword").value;
    const oldPassword = document.getElementById("oldPassword").value;

    if (newPassword) {
        formData.append("currentPassword", oldPassword);
        formData.append("newPassword", newPassword);
    }

    const avatarFile = profileUpload.files[0];
    if (avatarFile) formData.append("avatar", avatarFile);

    try {
        const response = await fetch(`${API_BASE}/api/update-profile`, {
            method: "POST",
            body: formData,
        });

        const result = await response.json();

        if (result.success) {
            statusMsg.textContent = "Profile updated successfully!";
            statusMsg.style.display = "block";
            await reloadUserData();
            setTimeout(() => {
                isEditMode = true;
                toggleEditMode();
            }, 1000);
        } else {
            statusMsg.textContent = "Error: " + result.message;
            statusMsg.style.display = "block";
        }
    } catch (err) {
        statusMsg.textContent = "Failed to update profile: " + err.message;
        statusMsg.style.display = "block";
    }

    saveBtn.disabled = false;
    saveBtn.textContent = "Save Changes";
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => profileImage.src = reader.result;
        reader.readAsDataURL(file);
    }
}

async function loadUserData() {
    const response = await fetch(`${API_BASE}/api/get-profile?username=${currentUsername}`);
    const userData = await response.json();
    if (userData.success) updateFormFields(userData);
}
