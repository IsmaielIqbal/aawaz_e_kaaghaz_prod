document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const workId = urlParams.get('id');
    
    if (workId) {
        await loadWorkDetail(workId);
    } else {
        document.getElementById('workContent').innerHTML = '<p>Work not found.</p>';
    }
});

async function loadWorkDetail(workId) {
    try {
        const response = await fetch(`../api/work/${workId}`);
        const work = await response.json();
        
        if (work) {
            displayWorkDetail(work);
        } else {
            document.getElementById('workContent').innerHTML = '<p>Work not found.</p>';
        }
    } catch (error) {
        console.error('Error loading work detail:', error);
        document.getElementById('workContent').innerHTML = '<p>Error loading work. Please try again later.</p>';
    }
}

function displayWorkDetail(work) {
    const workContent = document.getElementById('workContent');
    
    // Get first letter of author's name for avatar
    const authorInitial = work.creatorName.charAt(0).toUpperCase();
    
    workContent.innerHTML = `
        <a href="magazine.html" class="back-button">
            <i class="fas fa-arrow-left"></i> Back to Magazine
        </a>
        
        <div class="work-header">
            <span class="work-category">${getCategoryName(work.category)}</span>
            <h1 class="work-title">${work.workTitle}</h1>
            <div class="work-meta">
                <div class="work-author">
                    <div class="author-avatar">${authorInitial}</div>
                    <div>
                        <strong>${work.creatorName}</strong><br>
                        <span>${work.creatorEmail}</span>
                    </div>
                </div>
                <div class="work-date">
                    Published on ${new Date(work.publishedAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}
                </div>
            </div>
        </div>
        
        <div class="work-content ${work.category}">
            ${work.image ? `
                <div class="work-image">
                    <img src="${work.image}" alt="${work.workTitle}">
                </div>
            ` : ''}
            
            ${work.videoLink ? `
                <div class="work-video">
                    <div class="video-container">
                        <iframe src="${embedVideoLink(work.videoLink)}" 
                                frameborder="0" 
                                allowfullscreen>
                        </iframe>
                    </div>
                </div>
            ` : ''}
            
            ${work.workContent ? `
                <div class="work-text">
                    ${work.workContent}
                </div>
            ` : ''}
            
            ${work.description ? `
                <div class="work-description">
                    <h3>About this work</h3>
                    <p>${work.description}</p>
                </div>
            ` : ''}
        </div>
    `;
}

function getCategoryName(category) {
    const names = {
        poetry: 'Poetry',
        photography: 'Photography',
        art: 'Art & Craft',
        stories: 'Short Stories',
        filmmaking: 'Filmmaking'
    };
    return names[category] || category;
}

function embedVideoLink(url) {
    // Convert YouTube watch URL to embed URL
    if (url.includes('youtube.com/watch')) {
        const videoId = url.split('v=')[1];
        const ampersandPosition = videoId.indexOf('&');
        if (ampersandPosition !== -1) {
            return `https://www.youtube.com/embed/${videoId.substring(0, ampersandPosition)}`;
        }
        return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Convert Vimeo URL to embed URL
    if (url.includes('vimeo.com')) {
        const videoId = url.split('vimeo.com/')[1];
        return `https://player.vimeo.com/video/${videoId}`;
    }
    
    return url;
}