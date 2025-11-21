// Magazine page functionality with API calls
document.addEventListener('DOMContentLoaded', function() {
    const worksGrid = document.getElementById('worksGrid');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    let currentFilter = 'all';
    let displayedWorks = 6;
    const worksPerLoad = 3;
    let allWorks = [];

    // Fetch works from server
    async function fetchWorks() {
        try {
            console.log('Fetching works from API...');
            const response = await fetch('/api/published-works');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const works = await response.json();
            console.log('Fetched works:', works);
            return Array.isArray(works) ? works : [];
        } catch (error) {
            console.error('Error fetching works:', error);
            showErrorMessage('Failed to load works. Please try again later.');
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
        filteredWorks.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        
        const worksToShow = filteredWorks.slice(0, displayedWorks);
        
        if (worksToShow.length === 0) {
            worksGrid.innerHTML = `
                <div class="no-works-message">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No works found</h3>
                    <p>No ${currentFilter === 'all' ? '' : currentFilter + ' '}works have been published yet.</p>
                    <a href="submit-work.html" class="btn btn-primary" style="margin-top: 1rem;">Be the first to share!</a>
                </div>
            `;
            loadMoreBtn.style.display = 'none';
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
        card.className = 'work-item';
        card.dataset.category = work.category;
        
        const categoryLabels = {
            'poetry': 'Poetry',
            'photography': 'Photography',
            'art': 'Art & Craft',
            'stories': 'Short Story',
            'filmmaking': 'Filmmaking'
        };
        
        // Get first letter of author's name for avatar
        const authorInitial = work.creatorName ? work.creatorName.charAt(0).toUpperCase() : 'A';
        
        // Format date
        const workDate = work.publishedAt ? new Date(work.publishedAt).toLocaleDateString() : 'Recently';
        
        card.innerHTML = `
            <div class="work-image">
                ${work.image ? 
                    `<img src="${work.image}" alt="${work.workTitle}" onclick="openWorkDetail('${work.publishedId}')">` : 
                    `<div class="work-placeholder" onclick="openWorkDetail('${work.publishedId}')">
                        <i class="fas fa-${getCategoryIcon(work.category)}"></i>
                    </div>`
                }
                <span class="work-category">${categoryLabels[work.category] || work.category}</span>
            </div>
            <div class="work-content">
                <h3 class="work-title">${work.workTitle}</h3>
                <div class="work-author">
                    <div class="author-avatar">${authorInitial}</div>
                    <span>${work.creatorName}</span>
                </div>
                <p class="work-excerpt">${work.description || 'No description available.'}</p>
                <div class="work-meta">
                    <div class="author">
                        <span>By ${work.creatorName}</span>
                    </div>
                    <span>${workDate}</span>
                </div>
                <button class="btn btn-outline" onclick="openWorkDetail('${work.publishedId}')">View Work</button>
            </div>
        `;
        
        return card;
    }

    // Get category icon
    function getCategoryIcon(category) {
        const icons = {
            poetry: 'pen-fancy',
            photography: 'camera',
            art: 'paint-brush',
            stories: 'book',
            filmmaking: 'film'
        };
        return icons[category] || 'file-alt';
    }

    // Show error message
    function showErrorMessage(message) {
        worksGrid.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; color: #e74c3c;"></i>
                <h3>Error Loading Content</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 1rem;">Try Again</button>
            </div>
        `;
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
    }

    // Initialize the magazine when DOM is loaded
    initMagazine();
});

// Global function to open work detail
function openWorkDetail(workId) {
    window.location.href = `work-detail.html?id=${workId}`;
}