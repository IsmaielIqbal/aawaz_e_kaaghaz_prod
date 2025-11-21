let currentAdmin = null;

// Check if admin is already logged in
document.addEventListener('DOMContentLoaded', function() {
    const savedAdmin = localStorage.getItem('adminLoggedIn');
    if (savedAdmin) {
        currentAdmin = JSON.parse(savedAdmin);
        showDashboard();
        loadSubmissions();
    }
});

// Login form handler
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('../api/admin-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            currentAdmin = { username, loggedInAt: new Date().toISOString() };
            localStorage.setItem('adminLoggedIn', JSON.stringify(currentAdmin));
            showDashboard();
            loadSubmissions();
        } else {
            alert('Invalid credentials');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
});

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', function(e) {
    e.preventDefault();
    currentAdmin = null;
    localStorage.removeItem('adminLoggedIn');
    showLogin();
});

function showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
}

function showLogin() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('adminDashboard').style.display = 'none';
}

async function loadSubmissions() {
    try {
        const response = await fetch('../api/get-submissions');
        const data = await response.json();
        
        updateStats(data);
        displayPendingSubmissions(data.submissions);
        displayPublishedWorks(data.published_works);
    } catch (error) {
        console.error('Error loading submissions:', error);
    }
}

function updateStats(data) {
    const pending = data.submissions.filter(s => s.status === 'pending').length;
    const published = data.published_works.length;
    const total = data.submissions.length;
    
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('publishedCount').textContent = published;
    document.getElementById('totalCount').textContent = total;
}

function displayPendingSubmissions(submissions) {
    const container = document.getElementById('pendingSubmissions');
    const pending = submissions.filter(s => s.status === 'pending');
    
    if (pending.length === 0) {
        container.innerHTML = '<p>No pending submissions.</p>';
        return;
    }
    
    container.innerHTML = pending.map(submission => `
        <div class="submission-card pending">
            <h3>${submission.workTitle}</h3>
            <div class="submission-meta">
                <span><strong>By:</strong> ${submission.creatorName}</span>
                <span><strong>Category:</strong> ${submission.category}</span>
                <span><strong>Submitted:</strong> ${new Date(submission.submittedAt).toLocaleDateString()}</span>
            </div>
            <p>${submission.description || 'No description provided.'}</p>
            <div class="submission-actions">
                <button class="btn btn-sm btn-view" onclick="viewSubmission('${submission.id}')">View Details</button>
                <button class="btn btn-sm btn-approve" onclick="approveSubmission('${submission.id}')">Approve</button>
                <button class="btn btn-sm btn-reject" onclick="rejectSubmission('${submission.id}')">Reject</button>
            </div>
        </div>
    `).join('');
}

function displayPublishedWorks(works) {
    const container = document.getElementById('publishedWorks');
    
    if (works.length === 0) {
        container.innerHTML = '<p>No published works yet.</p>';
        return;
    }
    
    console.log('Published works:', works); // Debug log
    
    container.innerHTML = works.map(work => {
        console.log(`Work ID: ${work.publishedId}, Title: ${work.workTitle}`); // Debug each work
        return `
        <div class="work-card">
            <h3>${work.workTitle}</h3>
            <div class="submission-meta">
                <span><strong>By:</strong> ${work.creatorName}</span>
                <span><strong>Category:</strong> ${work.category}</span>
                <span><strong>Published:</strong> ${new Date(work.publishedAt).toLocaleDateString()}</span>
                <span><strong>ID:</strong> ${work.publishedId}</span>
            </div>
            <div class="submission-actions">
                <button class="btn btn-sm btn-view" onclick="viewWork('${work.publishedId}')">View</button>
                <button class="btn btn-sm btn-reject" onclick="unpublishWork('${work.publishedId}')">Unpublish</button>
            </div>
        </div>
    `}).join('');
}

async function viewSubmission(submissionId) {
    try {
        const response = await fetch(`../api/get-submission/${submissionId}`);
        const submission = await response.json();
        
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <div class="submission-detail">
                <h2>${submission.workTitle}</h2>
                <div class="submission-meta">
                    <span><strong>By:</strong> ${submission.creatorName}</span>
                    <span><strong>Email:</strong> ${submission.creatorEmail}</span>
                    <span><strong>Category:</strong> ${submission.category}</span>
                    <span><strong>Submitted:</strong> ${new Date(submission.submittedAt).toLocaleString()}</span>
                </div>
                ${submission.image ? `<img src="${submission.image}" alt="${submission.workTitle}">` : ''}
                ${submission.videoLink ? `<p><strong>Video Link:</strong> <a href="${submission.videoLink}" target="_blank">${submission.videoLink}</a></p>` : ''}
                ${submission.workContent ? `<div class="content"><strong>Content:</strong><br>${submission.workContent}</div>` : ''}
                ${submission.description ? `<p><strong>Description:</strong> ${submission.description}</p>` : ''}
                <div class="submission-actions">
                    <button class="btn btn-approve" onclick="approveSubmission('${submission.id}')">Approve & Publish</button>
                    <button class="btn btn-reject" onclick="rejectSubmission('${submission.id}')">Reject</button>
                </div>
            </div>
        `;
        
        document.getElementById('submissionModal').style.display = 'block';
    } catch (error) {
        console.error('Error viewing submission:', error);
    }
}

async function approveSubmission(submissionId) {
    if (!confirm('Are you sure you want to approve and publish this work?')) return;
    
    try {
        const response = await fetch('../api/approve-submission', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ submissionId })
        });
        
        if (response.ok) {
            alert('Work approved and published successfully!');
            closeModal();
            loadSubmissions();
        } else {
            alert('Error approving work.');
        }
    } catch (error) {
        console.error('Error approving submission:', error);
        alert('Error approving work.');
    }
}

async function rejectSubmission(submissionId) {
    if (!confirm('Are you sure you want to reject this submission?')) return;
    
    try {
        const response = await fetch('../api/reject-submission', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ submissionId })
        });
        
        if (response.ok) {
            alert('Work rejected successfully.');
            closeModal();
            loadSubmissions();
        } else {
            alert('Error rejecting work.');
        }
    } catch (error) {
        console.error('Error rejecting submission:', error);
        alert('Error rejecting work.');
    }
}

function closeModal() {
    document.getElementById('submissionModal').style.display = 'none';
}

// Close modal when clicking X
document.querySelector('.close').addEventListener('click', closeModal);

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('submissionModal');
    if (event.target === modal) {
        closeModal();
    }
});

async function unpublishWork(workId) {
    console.log('=== UNPUBLISH DEBUG ===');
    console.log('Work ID being sent:', workId);
    console.log('Type of workId:', typeof workId);
    
    if (!confirm('Are you sure you want to unpublish this work? It will be removed from the magazine but kept in submissions.')) return;
    
    try {
        console.log('Sending unpublish request...');
        
        const response = await fetch('../api/unpublish-work', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ workId: workId.toString() }) // Ensure it's a string
        });
        
        console.log('Response status:', response.status);
        
        const result = await response.json();
        console.log('Response data:', result);
        
        if (response.ok && result.success) {
            alert('Work unpublished successfully!');
            loadSubmissions();
        } else {
            console.error('Unpublish failed. Full response:', result);
            alert('Error unpublishing work: ' + (result.message || 'Unknown error. Check console for details.'));
        }
    } catch (error) {
        console.error('Network error unpublishing work:', error);
        alert('Network error unpublishing work: ' + error.message);
    }
    
    console.log('=== END UNPUBLISH DEBUG ===');
}
// Also add the viewWork function if it's missing
async function viewWork(workId) {
    try {
        const response = await fetch(`../api/get-work/${workId}`);
        const work = await response.json();
        
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <div class="submission-detail">
                <h2>${work.workTitle}</h2>
                <div class="submission-meta">
                    <span><strong>By:</strong> ${work.creatorName}</span>
                    <span><strong>Email:</strong> ${work.creatorEmail}</span>
                    <span><strong>Category:</strong> ${work.category}</span>
                    <span><strong>Published:</strong> ${new Date(work.publishedAt).toLocaleString()}</span>
                </div>
                ${work.image ? `<img src="${work.image}" alt="${work.workTitle}">` : ''}
                ${work.videoLink ? `<p><strong>Video Link:</strong> <a href="${work.videoLink}" target="_blank">${work.videoLink}</a></p>` : ''}
                ${work.workContent ? `<div class="content"><strong>Content:</strong><br>${work.workContent}</div>` : ''}
                ${work.description ? `<p><strong>Description:</strong> ${work.description}</p>` : ''}
            </div>
        `;
        
        document.getElementById('submissionModal').style.display = 'block';
    } catch (error) {
        console.error('Error viewing work:', error);
    }
}