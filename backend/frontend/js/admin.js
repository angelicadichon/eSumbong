// reports-overview.js
lucide.createIcons();

// Chart instances
let categoryChart, teamChart, statusChart, trendChart;

// Initialize charts when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadReportsData();
    setupEventListeners();
});

// Load reports data from API
async function loadReportsData() {
    try {
        const response = await fetch('/api/complaints');
        const result = await response.json();
        
        if (result.success) {
            const complaints = result.complaints;
            const processedData = processComplaintsData(complaints);
            updateStats(processedData);
            initializeCharts(processedData);
        } else {
            console.error('Failed to load complaints:', result.error);
        }
    } catch (error) {
        console.error('Error loading reports data:', error);
    }
}

// Process complaints data for charts
function processComplaintsData(complaints) {
    // Get unique categories from complaints
    const categories = [...new Set(complaints.map(c => c.category).filter(Boolean))];
    
    // Count reports by category
    const categoryCounts = categories.map(category => 
        complaints.filter(c => c.category === category).length
    );

    // Get unique teams (including unassigned)
    const teams = [...new Set(complaints.map(c => c.assigned_team || 'Unassigned').filter(Boolean))];
    
    // Get last 6 months for trend data
    const last6Months = getLastMonths(6);
    
    // Count assignments by team and month
    const monthlyData = {};
    last6Months.forEach(month => {
        monthlyData[month] = {};
        teams.forEach(team => {
            monthlyData[month][team] = complaints.filter(c => {
                const complaintDate = new Date(c.created_at);
                const complaintMonth = complaintDate.toLocaleString('default', { month: 'short' });
                const complaintTeam = c.assigned_team || 'Unassigned';
                return complaintMonth === month && complaintTeam === team;
            }).length;
        });
    });

    // Count by status
    const statusData = {
        pending: complaints.filter(c => c.status === 'pending').length,
        'in-progress': complaints.filter(c => c.status === 'in-progress').length,
        resolved: complaints.filter(c => c.status === 'resolved').length
    };

    // Monthly trend (total reports per month)
    const monthlyTrend = last6Months.map(month => 
        complaints.filter(c => {
            const complaintDate = new Date(c.created_at);
            const complaintMonth = complaintDate.toLocaleString('default', { month: 'short' });
            return complaintMonth === month;
        }).length
    );

    return {
        categories,
        categoryCounts,
        teams,
        monthlyData,
        statusData,
        monthlyTrend,
        last6Months,
        totalComplaints: complaints.length
    };
}

// Get last N months as short names
function getLastMonths(count) {
    const months = [];
    const date = new Date();
    
    for (let i = count - 1; i >= 0; i--) {
        const monthDate = new Date();
        monthDate.setMonth(date.getMonth() - i);
        months.push(monthDate.toLocaleString('default', { month: 'short' }));
    }
    
    return months;
}

// Update statistics
function updateStats(data) {
    document.getElementById('totalReports').textContent = data.totalComplaints;
    document.getElementById('pendingReports').textContent = data.statusData.pending;
    document.getElementById('inProgressReports').textContent = data.statusData['in-progress'];
    document.getElementById('resolvedReports').textContent = data.statusData.resolved;
}

// Initialize charts with real data
function initializeCharts(data) {
    // Category Distribution Chart (Bar Chart)
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    categoryChart = new Chart(categoryCtx, {
        type: 'bar',
        data: {
            labels: data.categories,
            datasets: [{
                label: 'Number of Reports',
                data: data.categoryCounts,
                backgroundColor: [
                    '#3498db', '#2ecc71', '#e74c3c', '#f39c12', 
                    '#9b59b6', '#1abc9c', '#34495e', '#e67e22',
                    '#27ae60', '#8e44ad', '#16a085', '#f1c40f'
                ],
                borderColor: [
                    '#2980b9', '#27ae60', '#c0392b', '#d35400',
                    '#8e44ad', '#16a085', '#2c3e50', '#d35400',
                    '#229954', '#7d3c98', '#138d75', '#f39c12'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Reports: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Reports'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Categories'
                    }
                }
            }
        }
    });

    // Team Assignments Chart (Line Chart)
    const teamCtx = document.getElementById('teamChart').getContext('2d');
    teamChart = new Chart(teamCtx, {
        type: 'line',
        data: {
            labels: data.last6Months,
            datasets: data.teams.map((team, index) => {
                const colors = [
                    { border: '#3498db', background: 'rgba(52, 152, 219, 0.1)' },
                    { border: '#2ecc71', background: 'rgba(46, 204, 113, 0.1)' },
                    { border: '#9b59b6', background: 'rgba(155, 89, 182, 0.1)' },
                    { border: '#e74c3c', background: 'rgba(231, 76, 60, 0.1)' },
                    { border: '#f39c12', background: 'rgba(243, 156, 18, 0.1)' },
                    { border: '#1abc9c', background: 'rgba(26, 188, 156, 0.1)' }
                ];
                
                return {
                    label: team,
                    data: data.last6Months.map(month => data.monthlyData[month][team] || 0),
                    borderColor: colors[index % colors.length].border,
                    backgroundColor: colors[index % colors.length].background,
                    borderWidth: 2,
                    tension: 0.4
                };
            })
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Assignments'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Months'
                    }
                }
            }
        }
    });

    // Status Distribution Chart (Doughnut Chart)
    const statusCtx = document.getElementById('statusChart').getContext('2d');
    statusChart = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'In Progress', 'Resolved'],
            datasets: [{
                data: [data.statusData.pending, data.statusData['in-progress'], data.statusData.resolved],
                backgroundColor: [
                    '#ffc107', // Pending - Yellow
                    '#17a2b8', // In Progress - Blue
                    '#28a745'  // Resolved - Green
                ],
                borderColor: [
                    '#e0a800', // Pending border
                    '#138496', // In Progress border
                    '#1e7e34'  // Resolved border
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((context.parsed / total) * 100);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    // Monthly Trend Chart (Line Chart)
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    trendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: data.last6Months,
            datasets: [{
                label: 'Reports Trend',
                data: data.monthlyTrend,
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Reports: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Reports'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Months'
                    }
                }
            }
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    const timeFilter = document.getElementById('timeFilter');
    if (timeFilter) {
        timeFilter.addEventListener('change', function(e) {
            filterDataByTime(e.target.value);
        });
    }
}

// Filter data by time period
async function filterDataByTime(period) {
    try {
        let url = '/api/complaints';
        
        // Add time filter to API call if needed
        if (period !== 'all') {
            url += `?timeFilter=${period}`;
        }
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            const complaints = result.complaints;
            const processedData = processComplaintsData(complaints);
            
            // Update charts with filtered data
            updateCharts(processedData);
            updateStats(processedData);
        }
    } catch (error) {
        console.error('Error filtering data:', error);
    }
}

// Update charts with new data
function updateCharts(data) {
    // Update category chart
    categoryChart.data.labels = data.categories;
    categoryChart.data.datasets[0].data = data.categoryCounts;
    categoryChart.update();

    // Update team chart
    teamChart.data.labels = data.last6Months;
    teamChart.data.datasets.forEach((dataset, index) => {
        if (data.teams[index]) {
            dataset.label = data.teams[index];
            dataset.data = data.last6Months.map(month => data.monthlyData[month][data.teams[index]] || 0);
        }
    });
    teamChart.update();

    // Update status chart
    statusChart.data.datasets[0].data = [data.statusData.pending, data.statusData['in-progress'], data.statusData.resolved];
    statusChart.update();

    // Update trend chart
    trendChart.data.labels = data.last6Months;
    trendChart.data.datasets[0].data = data.monthlyTrend;
    trendChart.update();
}

// Download chart as image
function downloadChart(chartId) {
    const chart = getChartInstance(chartId);
    if (chart) {
        const link = document.createElement('a');
        link.download = `${chartId}-${new Date().toISOString().split('T')[0]}.png`;
        link.href = chart.toBase64Image();
        link.click();
    }
}

// Get chart instance by canvas ID
function getChartInstance(chartId) {
    switch (chartId) {
        case 'categoryChart':
            return categoryChart;
        case 'teamChart':
            return teamChart;
        case 'statusChart':
            return statusChart;
        case 'trendChart':
            return trendChart;
        default:
            return null;
    }
}

function redirectToProfile() {
    window.location.href = 'user-profile.html';
}

// Function to get user initials from name
function getUserInitials(name) {
    if (!name) return 'U';
    return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// Function to load user profile data for the header
async function loadUserProfile() {
    try {
        // Get username from localStorage (same as in profile page)
        const username = localStorage.getItem('username') || 
                        sessionStorage.getItem('username') || 
                        'admin';
        
        console.log('Loading profile for:', username);
        
        // Fetch user data from the same API endpoint used in profile page
        const response = await fetch(`/api/get-profile?username=${encodeURIComponent(username)}`);
        
        if (response.ok) {
            const userData = await response.json();
            console.log('User data loaded for header:', userData);
            
            if (userData.success) {
                updateProfileCircle(userData);
            } else {
                console.error('API returned error:', userData.message);
                setDefaultProfile();
            }
        } else {
            console.error('HTTP error loading profile:', response.status);
            setDefaultProfile();
        }
    } catch (error) {
        console.error('Error loading user profile for header:', error);
        setDefaultProfile();
    }
}

// Function to update the profile circle with user data
function updateProfileCircle(userData) {
    const profileCircle = document.getElementById('profileCircle');
    const profileInitials = document.getElementById('profileInitials');
    
    if (!profileCircle) return;
    
    // Get display name
    const displayName = userData.full_name || userData.username || 'User';
    
    // Check if user has an avatar
    if (userData.avatar_url) {
        console.log('User has avatar:', userData.avatar_url);
        
        // Create image element
        const profileImg = document.createElement('img');
        profileImg.src = userData.avatar_url;
        profileImg.alt = displayName;
        profileImg.onload = function() {
            console.log('Avatar image loaded successfully');
        };
        profileImg.onerror = function() {
            console.log('Avatar image failed to load, showing initials');
            // If image fails to load, show initials
            showInitialsFallback(displayName);
        };
        
        // Clear existing content and add image
        profileCircle.innerHTML = '';
        profileCircle.appendChild(profileImg);
        profileInitials.style.display = 'none';
        
    } else {
        console.log('No avatar URL, showing initials');
        // No avatar, show initials
        showInitialsFallback(displayName);
    }
}

// Function to show initials as fallback
function showInitialsFallback(displayName) {
    const profileCircle = document.getElementById('profileCircle');
    const profileInitials = document.getElementById('profileInitials');
    
    profileCircle.innerHTML = '';
    profileInitials.textContent = getUserInitials(displayName);
    profileInitials.style.display = 'flex';
    profileCircle.appendChild(profileInitials);
}

// Function to set default profile when data can't be loaded
function setDefaultProfile() {
    const username = localStorage.getItem('username') || 'User';
    showInitialsFallback(username);
}

// Load user profile when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadUserProfile();
    
    // Also set up click event for profile circle
    const profileCircle = document.getElementById('profileCircle');
    if (profileCircle) {
        profileCircle.addEventListener('click', redirectToProfile);
    }
});

// Optional: Add function to refresh profile picture when returning to dashboard
window.addEventListener('focus', function() {
    // Refresh profile data when user returns to this tab
    loadUserProfile();
});

// Logout function
function logout() {
    window.location.href = 'index.html';
}

