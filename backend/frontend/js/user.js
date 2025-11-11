lucide.createIcons();

let categoryChart, teamChart, statusChart, trendChart;

document.addEventListener('DOMContentLoaded', function() {
    loadReportsData();
    setupEventListeners();
});

// Loading reports data from API in server.js
async function loadReportsData() {
    try {
        const username = localStorage.getItem('username');
        const role = localStorage.getItem('role');

        // Fetch complaints from API, filtered by role and username so the analytics displays their own data
        const response = await fetch(`/api/complaints?username=${encodeURIComponent(username)}&role=${encodeURIComponent(role)}`);
        const result = await response.json();

        if (result.success) {
            const complaints = result.complaints;
            const processedData = processComplaintsData(complaints);
            updateStats(processedData);
            initializeCharts(processedData);
        } else {
            console.error('Failed to load complaints:', result.message);
        }
    } catch (error) {
        console.error('Error loading reports data:', error);
    }
}


// Process complaints data for charts
function processComplaintsData(complaints) {
    const categories = [...new Set(complaints.map(c => c.category).filter(Boolean))];
    
    const categoryCounts = categories.map(category => 
        complaints.filter(c => c.category === category).length
    );

    const teams = [...new Set(complaints.map(c => c.assigned_team || 'Unassigned').filter(Boolean))];
    
    const last6Months = getLastMonths(6);
    
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

    // Counting by status
    const statusData = {
        pending: complaints.filter(c => c.status === 'pending').length,
        'in-progress': complaints.filter(c => c.status === 'in-progress').length,
        resolved: complaints.filter(c => c.status === 'resolved').length
    };

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

// Updating statistics
function updateStats(data) {
    document.getElementById('totalReports').textContent = data.totalComplaints;
    document.getElementById('pendingReports').textContent = data.statusData.pending;
    document.getElementById('inProgressReports').textContent = data.statusData['in-progress'];
    document.getElementById('resolvedReports').textContent = data.statusData.resolved;
}

// Initialize charts with real data
function initializeCharts(data) {
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

    // Team Assignments Chart using Line Chart
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

    // Status Distribution Chart using Doughnut Chart
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

    // Monthly Trend Chart using Line Chart
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
        
        if (period !== 'all') {
            url += `?timeFilter=${period}`;
        }
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            const complaints = result.complaints;
            const processedData = processComplaintsData(complaints);
            
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

// Download/extract chart as image 
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

// Logout function
function logout() {
    window.location.href = 'index.html';
}