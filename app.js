// Page Navigation
const landingPage = document.getElementById('landing-page');
const statsPage = document.getElementById('stats-page');
const usernameInput = document.getElementById('username-input');
const getStatsBtn = document.getElementById('get-stats-btn');
const backBtn = document.getElementById('back-btn');
const retryBtn = document.getElementById('retry-btn');
const landingError = document.getElementById('landing-error');

// Stats Page Elements
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const statsContent = document.getElementById('stats-content');
const errorMessage = document.getElementById('error-message');
const statsTitle = document.getElementById('stats-title');

// User Profile Elements
const userHandle = document.getElementById('user-handle');
const userRating = document.getElementById('user-rating');
const userMaxRating = document.getElementById('user-max-rating');
const userRank = document.getElementById('user-rank');
const userCountry = document.getElementById('user-country');
const userAvatar = document.getElementById('user-avatar');

// Analysis Elements
const getAnalysisBtn = document.getElementById('get-analysis-btn');
const btnText = document.querySelector('.btn-text');
const btnLoading = document.querySelector('.btn-loading');
const analysisContent = document.getElementById('analysis-content');

// Chart variables
let charts = {};
let currentUsername = '';
let userData = null;
let submissionsData = null;
let ratingData = null;

// API Configuration
const API_BASE = 'https://codeforces.com/api';
const API_ENDPOINTS = {
    userInfo: `${API_BASE}/user.info?handles=`,
    userStatus: `${API_BASE}/user.status?handle=`,
    userRating: `${API_BASE}/user.rating?handle=`
};

// Rating color mapping
const RATING_COLORS = {
    'newbie': '#808080',
    'pupil': '#008000',
    'specialist': '#03A89E',
    'expert': '#0000FF',
    'candidate master': '#AA00AA',
    'master': '#FF8C00',
    'international master': '#FF8C00',
    'grandmaster': '#FF0000',
    'international grandmaster': '#FF0000',
    'legendary grandmaster': '#FF0000'
};

// Event Listeners
getStatsBtn.addEventListener('click', handleGetStats);
backBtn.addEventListener('click', showLandingPage);
retryBtn.addEventListener('click', () => loadUserStats(currentUsername));
getAnalysisBtn.addEventListener('click', handleGetAnalysis);

usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleGetStats();
    }
});

usernameInput.addEventListener('input', () => {
    landingError.classList.add('hidden');
});

// Navigation Functions
function showLandingPage() {
    landingPage.classList.remove('hidden');
    statsPage.classList.add('hidden');
    usernameInput.focus();
}

function showStatsPage() {
    landingPage.classList.add('hidden');
    statsPage.classList.remove('hidden');
    showLoadingState();
}

function showLoadingState() {
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');
    statsContent.classList.add('hidden');
}

function showErrorState(message) {
    loadingState.classList.add('hidden');
    errorState.classList.remove('hidden');
    statsContent.classList.add('hidden');
    errorMessage.textContent = message;
}

function showStatsContent() {
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');
    statsContent.classList.remove('hidden');
    
    // Ensure loading spinner is completely stopped
    const loadingSpinner = document.querySelector('.loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.style.animation = 'none';
        loadingSpinner.style.display = 'none';
    }
}


// Main Handler Functions
function handleGetStats() {
    const username = usernameInput.value.trim();
    
    if (!username) {
        showError(landingError, 'Please enter a username');
        return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showError(landingError, 'Username can only contain letters, numbers, and underscores');
        return;
    }
    
    currentUsername = username;
    statsTitle.textContent = `${username}'s Statistics`;
    showStatsPage();
    loadUserStats(username);
}

async function loadUserStats(username) {
    try {
        showLoadingState();
        
        // Fetch user info first
        const userInfoResponse = await fetchWithRetry(`${API_ENDPOINTS.userInfo}${username}`);
        const userInfo = await userInfoResponse.json();
        
        if (userInfo.status !== 'OK') {
            throw new Error(userInfo.comment || 'User not found');
        }
        
        userData = userInfo.result[0];
        displayUserProfile(userData);
        
        // Fetch other data
        try {
            const [ratingsResponse, submissionsResponse] = await Promise.all([
                fetchWithRetry(`${API_ENDPOINTS.userRating}${username}`),
                fetchWithRetry(`${API_ENDPOINTS.userStatus}${username}`)
            ]);
            
            const ratings = await ratingsResponse.json();
            const submissions = await submissionsResponse.json();
            
            if (ratings.status === 'OK') {
                ratingData = ratings.result;
            } else {
                ratingData = [];
            }
            
            if (submissions.status === 'OK') {
                submissionsData = submissions.result;
            } else {
                submissionsData = [];
            }
            
        } catch (apiError) {
            console.warn('Some data could not be loaded:', apiError);
            ratingData = [];
            submissionsData = [];
        }
        
        // Create charts with available data
        createCharts();
        
        showStatsContent();
        

        
    } catch (error) {
        console.error('Error loading user stats:', error);
        showErrorState(error.message || 'Failed to load user statistics. Please try again.');
    }
}
// In app.js, replace the handleGetAnalysis function:
async function handleGetAnalysis() {
    if (getAnalysisBtn.disabled) return;
    
    // Show loading state properly
    getAnalysisBtn.disabled = true;
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');
    
    try {
        // Simulate analysis processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Calculate analysis data
        const analysis = calculateAnalysis();
        
        // Display analysis
        displayAnalysis(analysis);
        
        // Show analysis content
        analysisContent.classList.remove('hidden');
        
    } catch (error) {
        console.error('Error generating analysis:', error);
        // Show error state to user
        showError(document.createElement('div'), 'Failed to generate analysis. Please try again.');
    } finally {
        // Always reset button state
        setTimeout(() => {
            getAnalysisBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnLoading.classList.add('hidden');
        }, 100);
    }
}

// Utility Functions
function fetchWithRetry(url, retries = 2, timeout = 10000) {
    return new Promise(async (resolve, reject) => {
        for (let i = 0; i <= retries; i++) {
            try {
                const response = await Promise.race([
                    fetch(url),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Request timed out')), timeout)
                    )
                ]);
                
                if (response.ok) {
                    resolve(response);
                    return;
                }
                
                if (i === retries) {
                    reject(new Error(`HTTP ${response.status}: ${response.statusText}`));
                }
            } catch (error) {
                if (i === retries) {
                    reject(error);
                }
                // Wait before retry
                if (i < retries) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
    });
}

function showError(element, message) {
    element.textContent = message;
    element.classList.remove('hidden');
    
    // Auto-hide error after 5 seconds
    setTimeout(() => {
        element.classList.add('hidden');
    }, 5000);
}

function getRankClass(rank) {
    if (!rank) return 'newbie';
    return rank.toLowerCase().replace(/\s+/g, '-');
}

function getRatingColor(rating) {
    if (rating < 1200) return RATING_COLORS.newbie;
    if (rating < 1400) return RATING_COLORS.pupil;
    if (rating < 1600) return RATING_COLORS.specialist;
    if (rating < 1900) return RATING_COLORS.expert;
    if (rating < 2100) return RATING_COLORS['candidate master'];
    if (rating < 2300) return RATING_COLORS.master;
    if (rating < 2400) return RATING_COLORS['international master'];
    if (rating < 2600) return RATING_COLORS.grandmaster;
    if (rating < 3000) return RATING_COLORS['international grandmaster'];
    return RATING_COLORS['legendary grandmaster'];
}

// Display Functions
function displayUserProfile(user) {
    userHandle.textContent = user.handle;
    userRating.textContent = user.rating || 'Unrated';
    userMaxRating.textContent = user.maxRating || 'N/A';
    userRank.textContent = user.rank || 'Unrated';
    userCountry.textContent = user.country || 'N/A';
    
    // Set avatar
    userAvatar.textContent = user.handle.charAt(0).toUpperCase();
    
    // Apply rating colors
    const rankClass = getRankClass(user.rank);
    userRating.className = `stat-value rating-badge rating-${rankClass}`;
}

function createCharts() {
    // Destroy existing charts
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    charts = {};
    
    // Create all charts
    createRatingChart();
    createDifficultyChart();
    createVerdictChart();
    createTopicsChart();
}

function createRatingChart() {
    const ctx = document.getElementById('rating-chart').getContext('2d');
    
    if (!ratingData || ratingData.length === 0) {
        // Show placeholder chart
        charts.rating = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['No Data'],
                datasets: [{
                    label: 'Rating',
                    data: [0],
                    borderColor: '#1FB8CD',
                    backgroundColor: 'rgba(31, 184, 205, 0.1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        return;
    }
    
    const labels = ratingData.map((_, index) => `Contest ${index + 1}`);
    const data = ratingData.map(contest => contest.newRating);
    
    charts.rating = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Rating',
                data: data,
                borderColor: '#1FB8CD',
                backgroundColor: 'rgba(31, 184, 205, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    display: true
                },
                y: {
                    beginAtZero: false
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function createDifficultyChart() {
    const ctx = document.getElementById('difficulty-chart').getContext('2d');
    
    if (!submissionsData || submissionsData.length === 0) {
        // Show placeholder chart
        charts.difficulty = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['No Data'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#1FB8CD']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
        return;
    }
    
    const difficultyMap = {};
    submissionsData.forEach(submission => {
        if (submission.verdict === 'OK' && submission.problem.rating) {
            const rating = submission.problem.rating;
            const range = Math.floor(rating / 100) * 100;
            difficultyMap[range] = (difficultyMap[range] || 0) + 1;
        }
    });
    
    if (Object.keys(difficultyMap).length === 0) {
        difficultyMap['Unknown'] = 1;
    }
    
    const labels = Object.keys(difficultyMap).sort((a, b) => a - b);
    const data = labels.map(label => difficultyMap[label]);
    
    charts.difficulty = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.map(l => isNaN(l) ? l : `${l}+`),
            datasets: [{
                data: data,
                backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createVerdictChart() {
    const ctx = document.getElementById('verdict-chart').getContext('2d');
    
    if (!submissionsData || submissionsData.length === 0) {
        // Show placeholder chart
        charts.verdict = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['No Data'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#1FB8CD']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
        return;
    }
    
    const verdictMap = {};
    submissionsData.forEach(submission => {
        const verdict = submission.verdict;
        verdictMap[verdict] = (verdictMap[verdict] || 0) + 1;
    });
    
    const labels = Object.keys(verdictMap);
    const data = labels.map(label => verdictMap[label]);
    
    charts.verdict = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createTopicsChart() {
    const ctx = document.getElementById('topics-chart').getContext('2d');
    
    if (!submissionsData || submissionsData.length === 0) {
        // Show placeholder chart
        charts.topics = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['No Data'],
                datasets: [{
                    label: 'Solved Problems',
                    data: [0],
                    backgroundColor: '#1FB8CD'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y'
            }
        });
        return;
    }
    
    const topicsMap = {};
    submissionsData.forEach(submission => {
        if (submission.verdict === 'OK' && submission.problem.tags) {
            submission.problem.tags.forEach(tag => {
                topicsMap[tag] = (topicsMap[tag] || 0) + 1;
            });
        }
    });
    
    if (Object.keys(topicsMap).length === 0) {
        topicsMap['No topics available'] = 0;
    }
    
    const sortedTopics = Object.entries(topicsMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const labels = sortedTopics.map(([tag]) => tag);
    const data = sortedTopics.map(([, count]) => count);
    
    charts.topics = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Solved Problems',
                data: data,
                backgroundColor: '#1FB8CD',
                borderColor: '#1FB8CD',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });
}

function calculateAnalysis() {
    if (!submissionsData || submissionsData.length === 0) {
        return {
            successRate: 'N/A',
            avgRating: userData?.rating || 'N/A',
            contestCount: ratingData?.length || 0,
            totalSubmissions: 0
        };
    }
    
    const acceptedSubmissions = submissionsData.filter(s => s.verdict === 'OK');
    const totalSubmissions = submissionsData.length;
    const successRate = ((acceptedSubmissions.length / totalSubmissions) * 100).toFixed(1);
    
    const avgRating = ratingData && ratingData.length > 0 
        ? Math.round(ratingData.reduce((sum, r) => sum + r.newRating, 0) / ratingData.length)
        : userData?.rating || 'N/A';
    
    const contestCount = ratingData?.length || 0;
    
    return {
        successRate: `${successRate}%`,
        avgRating: avgRating,
        contestCount: contestCount,
        totalSubmissions: totalSubmissions
    };
}

function displayAnalysis(analysis) {
    document.getElementById('success-rate').textContent = analysis.successRate;
    document.getElementById('avg-rating').textContent = analysis.avgRating;
    document.getElementById('contest-count').textContent = analysis.contestCount;
    document.getElementById('total-submissions').textContent = analysis.totalSubmissions;
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    usernameInput.focus();
});