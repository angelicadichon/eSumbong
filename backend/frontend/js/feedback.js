let selectedComplaintId = null;
let currentRating = 0;
let resolvedComplaints = [];

// Load resolved complaints for the logged-in user
async function loadResolvedComplaints() {
    try {
        const username = localStorage.getItem('username');
        
        if (!username) {
            window.location.href = 'index.html';
            return;
        }

        const response = await fetch(`/api/complaints?username=${encodeURIComponent(username)}`);
        const result = await response.json();
        
        if (result.success) {
            // Filter only resolved complaints that don't have feedback yet
            resolvedComplaints = result.complaints.filter(complaint => 
                complaint.status === 'resolved' && 
                complaint.username === username &&
                !complaint.rating // Only show complaints that haven't been rated yet
            );
            
            displayResolvedComplaints(resolvedComplaints);
            setupStarRating();
        } else {
            showResponse('Failed to load complaints', 'error');
        }
    } catch (error) {
        console.error('Error loading resolved complaints:', error);
        showResponse('Failed to load complaints', 'error');
    }
}

// Display resolved complaints
function displayResolvedComplaints(complaints) {
    const container = document.getElementById('resolvedComplaints');
    const feedbackForm = document.getElementById('feedbackForm');
    const noComplaints = document.getElementById('noComplaints');

    if (complaints.length === 0) {
        container.innerHTML = '';
        feedbackForm.style.display = 'none';
        noComplaints.style.display = 'block';
        return;
    }

    noComplaints.style.display = 'none';
    
    container.innerHTML = complaints.map(complaint => `
        <div class="complaint-item" data-id="${complaint.id}" onclick="selectComplaint(${complaint.id})">
            <div class="complaint-header">
                <div class="complaint-category">${complaint.category || 'General Complaint'}</div>
                <div class="complaint-date">${formatDate(complaint.created_at)}</div>
            </div>
            <div class="complaint-description">${complaint.description || 'No description provided'}</div>
            <div class="complaint-location">📍 ${complaint.location || 'Location not specified'}</div>
            <div class="complaint-team">Assigned to: ${complaint.assigned_team || 'No team assigned'}</div>
            ${complaint.rating ? `<div class="complaint-feedback">⭐ Rated: ${complaint.rating}/5</div>` : ''}
        </div>
    `).join('');
}

// Select a complaint for feedback
function selectComplaint(complaintId) {
    // Remove selection from all items
    document.querySelectorAll('.complaint-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Add selection to clicked item
    const selectedItem = document.querySelector(`.complaint-item[data-id="${complaintId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
    }
    
    selectedComplaintId = complaintId;
    document.getElementById('feedbackForm').style.display = 'block';
    
    // Scroll to feedback form
    document.getElementById('feedbackForm').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

// Clear selection
function clearSelection() {
    selectedComplaintId = null;
    currentRating = 0;
    document.querySelectorAll('.complaint-item').forEach(item => {
        item.classList.remove('selected');
    });
    document.getElementById('feedbackForm').style.display = 'none';
    resetStars();
    document.getElementById('feedbackText').value = '';
}

// Setup star rating functionality
function setupStarRating() {
    const stars = document.querySelectorAll('.star-btn');
    
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.getAttribute('data-value'));
            setRating(rating);
        });
        
        star.addEventListener('mouseover', () => {
            const rating = parseInt(star.getAttribute('data-value'));
            highlightStars(rating);
        });
    });
    
    // Reset stars when mouse leaves the star container
    document.getElementById('starRow').addEventListener('mouseleave', () => {
        highlightStars(currentRating);
    });
}

// Set rating
function setRating(rating) {
    currentRating = rating;
    highlightStars(rating);
}

// Highlight stars up to the given rating
function highlightStars(rating) {
    const stars = document.querySelectorAll('.star-btn');
    
    stars.forEach(star => {
        const starValue = parseInt(star.getAttribute('data-value'));
        if (starValue <= rating) {
            star.textContent = '★';
            star.classList.add('active');
        } else {
            star.textContent = '☆';
            star.classList.remove('active');
        }
    });
}

// Reset stars to empty
function resetStars() {
    const stars = document.querySelectorAll('.star-btn');
    stars.forEach(star => {
        star.textContent = '☆';
        star.classList.remove('active');
    });
}

// Submit feedback directly to complaints table
async function submitFeedback() {
    if (!selectedComplaintId) {
        showResponse('Please select a complaint first', 'error');
        return;
    }
    
    if (currentRating === 0) {
        showResponse('Please provide a rating', 'error');
        return;
    }
    
    try {
        const feedbackData = {
            rating: currentRating,
            feedback_message: document.getElementById('feedbackText').value.trim(),
            feedback_submitted_at: new Date().toISOString()
        };
        
        // Update the complaint with feedback data
        const response = await fetch(`/api/complaints/${selectedComplaintId}/feedback`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(feedbackData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showResponse('Thank you for your feedback!', 'success');
            
            // Remove the submitted complaint from the list
            resolvedComplaints = resolvedComplaints.filter(complaint => complaint.id !== selectedComplaintId);
            
            // Clear form and reset
            setTimeout(() => {
                clearSelection();
                displayResolvedComplaints(resolvedComplaints);
            }, 2000);
        } else {
            showResponse('Failed to submit feedback: ' + (result.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error submitting feedback:', error);
        showResponse('Failed to submit feedback', 'error');
    }
}

// Show response message
function showResponse(message, type) {
    const responseEl = document.getElementById('fbResponse');
    responseEl.textContent = message;
    responseEl.className = `response-text ${type}`;
    responseEl.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            responseEl.style.display = 'none';
        }, 5000);
    }
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Logout function
function logout() {
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    window.location.href = 'index.html';
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadResolvedComplaints();
});