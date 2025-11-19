// Magazine page functionality with API calls

document.addEventListener('DOMContentLoaded', function() {
    const worksGrid = document.getElementById('worksGrid');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    let currentFilter = 'all';
    let displayedWorks = 6;
    const worksPerLoad = 3;
    let allWorks = [];

    // API base URL - change this to your server URL
    const API_BASE = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api' 
        : '/api'; // Relative path for production

    // Fetch works from server
    async function fetchWorks() {
        try {
            const response = await fetch(`${API_BASE}/works`);
            const works = await response.json();
            return works;
        } catch (error) {
            console.error('Error fetching works:', error);
            return [];
        }
    }

    // Initialize the magazine
    async function initMagazine() {
        allWorks = await fetchWorks();
        renderWorks();
        setupEventListeners();
    }

    // Render works based on current filter and display count
    function renderWorks() {
        worksGrid.innerHTML = '';
        
        const filteredWorks = currentFilter === 'all' 
            ? allWorks 
            : allWorks.filter(work => work.category === currentFilter);
        
        // Sort by date (newest first)
        filteredWorks.sort((a, b) => b.timestamp - a.timestamp);
        
        const worksToShow = filteredWorks.slice(0, displayedWorks);
        
        if (worksToShow.length === 0) {
            worksGrid.innerHTML = `
                <div class="no-works-message">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No works found</h3>
                    <p>No ${currentFilter === 'all' ? '' : currentFilter + ' '}works have been published yet.</p>
                </div>
            `;
            return;
        }
        
        worksToShow.forEach(work => {
            const workCard = createWorkCard(work);
            worksGrid.appendChild(workCard);
        });
        
        // Show/hide load more button
        if (displayedWorks >= filteredWorks.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'inline-block';
        }
    }

    // Create a work card element
    function createWorkCard(work) {
        const card = document.createElement('div');
        card.className = 'work-card';
        card.dataset.category = work.category;
        
        const categoryLabels = {
            'poetry': 'Poetry',
            'photography': 'Photography',
            'art': 'Art & Craft',
            'stories': 'Short Story',
            'filmmaking': 'Filmmaking'
        };
        
        const mediaElement = work.mediaType === 'video' 
            ? `<video poster="${work.image || ''}" controls>
                  <source src="${work.mediaUrl}" type="video/mp4">
                  Your browser does not support the video tag.
               </video>`
            : `<img src="${work.mediaUrl || work.image}" alt="${work.title}">`;
        
        card.innerHTML = `
            <div class="work-image">
                ${mediaElement}
                <span class="work-category">${categoryLabels[work.category]}</span>
            </div>
            <div class="work-content">
                <h3 class="work-title">${work.title}</h3>
                <div class="work-author">
                    <img src="${work.authorImage}" alt="${work.author}">
                    <span>${work.author}</span>
                </div>
                <p class="work-description">${work.description}</p>
                <div class="work-tags">
                    ${work.tags.map(tag => `<span class="work-tag">#${tag}</span>`).join('')}
                </div>
                <div class="work-actions">
                    <button class="like-btn" data-id="${work.id}">
                        <i class="fas fa-heart"></i>
                        <span class="like-count">${work.likes || 0}</span>
                    </button>
                    <span class="work-date">${work.date}</span>
                </div>
            </div>
        `;
        
        return card;
    }

    // Like a work
    async function likeWork(workId) {
        try {
            const response = await fetch(`${API_BASE}/works/${workId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Update the like count in our local data
                const work = allWorks.find(w => w.id == workId);
                if (work) {
                    work.likes = result.likes;
                }
                
                // Update the UI
                const likeBtn = document.querySelector(`.like-btn[data-id="${workId}"]`);
                if (likeBtn) {
                    likeBtn.querySelector('.like-count').textContent = result.likes;
                    likeBtn.classList.add('liked');
                }
            }
        } catch (error) {
            console.error('Error liking work:', error);
        }
    }

    // Set up event listeners
    function setupEventListeners() {
        // Filter buttons
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const filter = this.dataset.filter;
                
                // Update active button
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Update filter and reset display count
                currentFilter = filter;
                displayedWorks = 6;
                
                // Re-render works
                renderWorks();
            });
        });
        
        // Load more button
        loadMoreBtn.addEventListener('click', function() {
            displayedWorks += worksPerLoad;
            renderWorks();
        });
        
        // Like buttons (delegated event handling)
        worksGrid.addEventListener('click', function(e) {
            if (e.target.closest('.like-btn')) {
                const likeBtn = e.target.closest('.like-btn');
                const workId = likeBtn.dataset.id;
                likeWork(workId);
            }
        });
    }

    // Initialize the magazine when DOM is loaded
    initMagazine();
});