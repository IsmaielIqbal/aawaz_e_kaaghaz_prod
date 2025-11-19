// Admin Panel Functionality

document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const userForm = document.getElementById('userForm');
    const workMedia = document.getElementById('workMedia');
    const userAvatar = document.getElementById('userAvatar');
    const uploadPreview = document.getElementById('uploadPreview');
    const avatarPreview = document.getElementById('avatarPreview');
    const worksList = document.getElementById('worksList');
    const usersList = document.getElementById('usersList');
    const workAuthorSelect = document.getElementById('workAuthor');
    
    // Get works from localStorage
    function getWorksData() {
        const savedWorks = localStorage.getItem('aawazekaaghaz_works');
        return savedWorks ? JSON.parse(savedWorks) : [];
    }
    
    // Save works to localStorage
    function saveWorksData(works) {
        localStorage.setItem('aawazekaaghaz_works', JSON.stringify(works));
    }
    
    // Get users from localStorage
    function getUsersData() {
        const savedUsers = localStorage.getItem('aawazekaaghaz_users');
        return savedUsers ? JSON.parse(savedUsers) : [];
    }
    
    // Save users to localStorage
    function saveUsersData(users) {
        localStorage.setItem('aawazekaaghaz_users', JSON.stringify(users));
    }
    
    // Initialize admin panel
    function initAdminPanel() {
        setupEventListeners();
        loadExistingUsers();
        loadExistingWorks();
        populateAuthorSelect();
    }
    
    // Populate author dropdown with existing users
    function populateAuthorSelect() {
        const users = getUsersData();
        workAuthorSelect.innerHTML = '<option value="">Select an author</option>';
        
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.username;
            option.textContent = user.displayName || user.username;
            workAuthorSelect.appendChild(option);
        });
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Media upload preview
        workMedia.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    uploadPreview.innerHTML = '';
                    
                    if (file.type.startsWith('image/')) {
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        uploadPreview.appendChild(img);
                    } else if (file.type.startsWith('video/')) {
                        const video = document.createElement('video');
                        video.src = e.target.result;
                        video.controls = true;
                        uploadPreview.appendChild(video);
                    }
                };
                
                reader.readAsDataURL(file);
            }
        });
        
        // Avatar upload preview
        userAvatar.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    avatarPreview.innerHTML = '';
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    avatarPreview.appendChild(img);
                };
                
                reader.readAsDataURL(file);
            }
        });
        
        // User form submission
        userForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const usersData = getUsersData();
            
            const userData = {
                username: formData.get('username'),
                displayName: formData.get('displayName') || formData.get('username'),
                bio: formData.get('bio') || '',
                worksCount: 0,
                createdAt: new Date().toISOString()
            };
            
            // Handle avatar upload
            const file = userAvatar.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    userData.avatar = e.target.result;
                    completeUserSubmission(userData, usersData);
                };
                reader.readAsDataURL(file);
            } else {
                // Use default avatar if no file is uploaded
                userData.avatar = `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 70)}.jpg`;
                completeUserSubmission(userData, usersData);
            }
        });
        
        // Work form submission
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const worksData = getWorksData();
            const usersData = getUsersData();
            
            // Get selected author
            const authorUsername = formData.get('author');
            const author = usersData.find(u => u.username === authorUsername);
            
            if (!author) {
                alert('Please select a valid author from the list. If no authors exist, please add a user first.');
                return;
            }
            
            // Generate a unique ID
            const newId = worksData.length > 0 ? Math.max(...worksData.map(w => w.id)) + 1 : 1;
            
            const workData = {
                id: newId,
                title: formData.get('title'),
                author: author.displayName || author.username,
                authorUsername: author.username,
                authorImage: author.avatar,
                category: formData.get('category'),
                description: formData.get('description'),
                tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : [],
                likes: 0,
                date: 'Just now',
                liked: false,
                timestamp: Date.now()
            };
            
            // Handle file upload
            const file = workMedia.files[0];
            if (file) {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        workData.image = e.target.result;
                        workData.video = null;
                        completeWorkSubmission(workData, worksData, authorUsername, usersData);
                    };
                    reader.readAsDataURL(file);
                    return;
                } else if (file.type.startsWith('video/')) {
                    workData.video = 'https://example.com/video-placeholder.mp4';
                    workData.image = 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80';
                }
            } else {
                workData.image = 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80';
            }
            
            completeWorkSubmission(workData, worksData, authorUsername, usersData);
        });
        
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                window.location.href = '../index.html';
            }
        });
    }
    
    // Complete user submission
    function completeUserSubmission(userData, usersData) {
        // Check if user already exists
        const existingUserIndex = usersData.findIndex(u => u.username === userData.username);
        
        if (existingUserIndex !== -1) {
            // Update existing user
            usersData[existingUserIndex] = {
                ...usersData[existingUserIndex],
                displayName: userData.displayName,
                bio: userData.bio,
                avatar: userData.avatar
            };
        } else {
            // Add new user
            usersData.push(userData);
        }
        
        // Save to localStorage
        saveUsersData(usersData);
        
        // Update UI
        loadExistingUsers();
        populateAuthorSelect();
        
        // Reset form
        userForm.reset();
        avatarPreview.innerHTML = `
            <div class="avatar-placeholder">
                <i class="fas fa-user"></i>
                <span>No image selected</span>
            </div>
        `;
        
        // Show success message
        alert(`User ${existingUserIndex !== -1 ? 'updated' : 'added'} successfully!`);
    }
    
    // Complete work submission
    function completeWorkSubmission(workData, worksData, authorUsername, usersData) {
        // Update user's works count
        const userIndex = usersData.findIndex(u => u.username === authorUsername);
        if (userIndex !== -1) {
            if (!usersData[userIndex].worksCount) {
                usersData[userIndex].worksCount = 0;
            }
            usersData[userIndex].worksCount++;
            saveUsersData(usersData);
        }
        
        // Add to works array
        worksData.unshift(workData);
        
        // Save to localStorage
        saveWorksData(worksData);
        
        // Update UI
        loadExistingWorks();
        
        // Reset form
        uploadForm.reset();
        uploadPreview.innerHTML = '';
        
        // Show success message
        alert('Work published successfully! It will now appear on the magazine page.');
    }
    
    // Load existing users
    function loadExistingUsers() {
        const usersData = getUsersData();
        usersList.innerHTML = '';
        
        if (usersData.length === 0) {
            usersList.innerHTML = '<p class="no-users">No users added yet. Start by adding your first user!</p>';
            return;
        }
        
        usersData.forEach(user => {
            addUserToList(user);
        });
    }
    
    // Add user to the list
    function addUserToList(user) {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        userCard.dataset.username = user.username;
        
        userCard.innerHTML = `
            <div class="user-avatar">
                <img src="${user.avatar}" alt="${user.username}">
            </div>
            <div class="user-info">
                <h4>${user.displayName}</h4>
                <p>@${user.username}</p>
                ${user.bio ? `<p class="user-bio">${user.bio}</p>` : ''}
                <div class="user-stats">
                    <span>${user.worksCount || 0} works</span>
                </div>
                <div class="user-actions">
                    <button class="btn btn-primary btn-sm edit-user-btn" data-username="${user.username}">Edit</button>
                    <button class="btn btn-danger btn-sm delete-user-btn" data-username="${user.username}">Delete</button>
                </div>
            </div>
        `;
        
        usersList.appendChild(userCard);
        
        // Add event listeners
        userCard.querySelector('.edit-user-btn').addEventListener('click', function() {
            editUser(user.username);
        });
        
        userCard.querySelector('.delete-user-btn').addEventListener('click', function() {
            deleteUser(user.username);
        });
    }
    
    // Edit user
    function editUser(username) {
        const usersData = getUsersData();
        const user = usersData.find(u => u.username === username);
        
        if (user) {
            // Populate form with user data
            document.getElementById('userUsername').value = user.username;
            document.getElementById('userUsername').readOnly = true; // Can't change username
            document.getElementById('userDisplayName').value = user.displayName;
            document.getElementById('userBio').value = user.bio || '';
            
            // Show avatar preview
            avatarPreview.innerHTML = `<img src="${user.avatar}" alt="${user.username}">`;
            
            // Scroll to form
            document.querySelector('.user-form-container').scrollIntoView();
            
            // Change submit button text
            const submitBtn = userForm.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Update User';
        }
    }
    
    // Delete user
    function deleteUser(username) {
        if (confirm(`Are you sure you want to delete user "${username}"? This will also remove all their works.`)) {
            const usersData = getUsersData();
            const worksData = getWorksData();
            
            // Remove user
            const updatedUsers = usersData.filter(user => user.username !== username);
            
            // Remove user's works
            const updatedWorks = worksData.filter(work => work.authorUsername !== username);
            
            // Save updated data
            saveUsersData(updatedUsers);
            saveWorksData(updatedWorks);
            
            // Update UI
            loadExistingUsers();
            loadExistingWorks();
            populateAuthorSelect();
            
            alert('User deleted successfully!');
        }
    }
    
    // Load existing works
    function loadExistingWorks() {
        const worksData = getWorksData();
        worksList.innerHTML = '';
        
        if (worksData.length === 0) {
            worksList.innerHTML = '<p class="no-works">No works published yet. Start by uploading your first work!</p>';
            return;
        }
        
        worksData.sort((a, b) => b.id - a.id).forEach(work => {
            addWorkToList(work);
        });
    }
    
    // Add work to the list
    function addWorkToList(work) {
        const workItem = document.createElement('div');
        workItem.className = 'work-item';
        workItem.dataset.id = work.id;
        
        const categoryLabels = {
            'poetry': 'Poetry',
            'photography': 'Photography',
            'art': 'Art & Craft',
            'stories': 'Short Story',
            'filmmaking': 'Filmmaking'
        };
        
        workItem.innerHTML = `
            <div class="work-thumbnail">
                ${work.video ? 
                    `<video poster="${work.image || ''}">
                        <source src="${work.video}" type="video/mp4">
                    </video>` : 
                    `<img src="${work.image}" alt="${work.title}">`
                }
            </div>
            <div class="work-details">
                <h3>${work.title}</h3>
                <div class="work-meta">
                    <span><strong>Author:</strong> ${work.author}</span>
                    <span><strong>Category:</strong> ${categoryLabels[work.category]}</span>
                    <span><strong>Likes:</strong> ${work.likes}</span>
                    <span><strong>Published:</strong> ${work.date}</span>
                </div>
                <p>${work.description}</p>
                <div class="work-tags">
                    ${work.tags.map(tag => `<span class="work-tag">#${tag}</span>`).join('')}
                </div>
                <div class="work-actions">
                    <button class="btn btn-primary btn-sm edit-btn" data-id="${work.id}">Edit</button>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${work.id}">Delete</button>
                </div>
            </div>
        `;
        
        worksList.appendChild(workItem);
        
        // Add event listeners to action buttons
        workItem.querySelector('.edit-btn').addEventListener('click', function() {
            editWork(work.id);
        });
        
        workItem.querySelector('.delete-btn').addEventListener('click', function() {
            deleteWork(work.id);
        });
    }
    
    // Edit work
    function editWork(id) {
        const worksData = getWorksData();
        const work = worksData.find(w => w.id === id);
        
        if (work) {
            // Populate form with work data
            document.getElementById('workTitle').value = work.title;
            document.getElementById('workAuthor').value = work.authorUsername;
            document.getElementById('workCategory').value = work.category;
            document.getElementById('workDescription').value = work.description;
            document.getElementById('workTags').value = work.tags.join(', ');
            
            // Show preview
            uploadPreview.innerHTML = work.video ? 
                `<video src="${work.video}" controls></video>` : 
                `<img src="${work.image}" alt="${work.title}">`;
            
            // Scroll to form
            document.querySelector('.upload-form-container').scrollIntoView();
            
            // Change submit button text
            const submitBtn = uploadForm.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Update Work';
            submitBtn.dataset.editing = id;
            
            // Remove previous edit listener and add new one
            uploadForm.onsubmit = function(e) {
                e.preventDefault();
                updateWork(id);
            };
        }
    }
    
    // Update work
    function updateWork(id) {
        const worksData = getWorksData();
        const workIndex = worksData.findIndex(w => w.id === id);
        
        if (workIndex !== -1) {
            const formData = new FormData(uploadForm);
            const usersData = getUsersData();
            
            // Get selected author
            const authorUsername = formData.get('author');
            const author = usersData.find(u => u.username === authorUsername);
            
            if (!author) {
                alert('Please select a valid author from the list.');
                return;
            }
            
            worksData[workIndex] = {
                ...worksData[workIndex],
                title: formData.get('title'),
                author: author.displayName || author.username,
                authorUsername: author.username,
                authorImage: author.avatar,
                category: formData.get('category'),
                description: formData.get('description'),
                tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : [],
                date: 'Updated just now'
            };
            
            // Handle new file upload
            const file = workMedia.files[0];
            if (file) {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        worksData[workIndex].image = e.target.result;
                        worksData[workIndex].video = null;
                        completeWorkUpdate(worksData);
                    };
                    reader.readAsDataURL(file);
                    return;
                } else if (file.type.startsWith('video/')) {
                    worksData[workIndex].video = 'https://example.com/video-placeholder.mp4';
                    worksData[workIndex].image = 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80';
                }
            }
            
            completeWorkUpdate(worksData);
        }
    }
    
    function completeWorkUpdate(worksData) {
        saveWorksData(worksData);
        loadExistingWorks();
        
        // Reset form
        uploadForm.reset();
        uploadPreview.innerHTML = '';
        
        // Reset submit button
        const submitBtn = uploadForm.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Publish Work';
        delete submitBtn.dataset.editing;
        
        // Restore original submit handler
        uploadForm.onsubmit = function(e) {
            e.preventDefault();
            // Original submit logic
            const event = new Event('submit', { cancelable: true });
            uploadForm.dispatchEvent(event);
        };
        
        alert('Work updated successfully!');
    }
    
    // Delete work
    function deleteWork(id) {
        if (confirm('Are you sure you want to delete this work? This action cannot be undone.')) {
            const worksData = getWorksData();
            const work = worksData.find(w => w.id === id);
            const updatedWorks = worksData.filter(work => work.id !== id);
            
            // Update user's works count
            if (work && work.authorUsername) {
                const usersData = getUsersData();
                const userIndex = usersData.findIndex(u => u.username === work.authorUsername);
                if (userIndex !== -1 && usersData[userIndex].worksCount > 0) {
                    usersData[userIndex].worksCount--;
                    saveUsersData(usersData);
                }
            }
            
            // Save updated works data
            saveWorksData(updatedWorks);
            
            // Remove from UI
            document.querySelector(`.work-item[data-id="${id}"]`).remove();
            
            // Update message if no works left
            if (updatedWorks.length === 0) {
                worksList.innerHTML = '<p class="no-works">No works published yet. Start by uploading your first work!</p>';
            }
            
            alert('Work deleted successfully!');
        }
    }
    
    // Initialize the admin panel
    initAdminPanel();
});