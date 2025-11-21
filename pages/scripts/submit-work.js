// Handle category change to show/hide relevant fields
document.getElementById('category').addEventListener('change', function() {
    const category = this.value;
    const contentField = document.getElementById('contentField');
    const imageField = document.getElementById('imageField');
    const videoField = document.getElementById('videoField');
    
    // Reset all fields
    contentField.style.display = 'block';
    imageField.style.display = 'none';
    videoField.style.display = 'none';
    
    switch(category) {
        case 'photography':
        case 'art':
            contentField.style.display = 'none';
            imageField.style.display = 'block';
            break;
        case 'filmmaking':
            contentField.style.display = 'none';
            videoField.style.display = 'block';
            break;
        case 'poetry':
        case 'stories':
            contentField.querySelector('label').textContent = 'Your ' + (category === 'poetry' ? 'Poetry' : 'Story') + ' *';
            break;
    }
});

// Handle form submission
document.getElementById('submissionForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        creatorName: document.getElementById('creatorName').value,
        creatorEmail: document.getElementById('creatorEmail').value,
        workTitle: document.getElementById('workTitle').value,
        category: document.getElementById('category').value,
        workContent: document.getElementById('workContent').value,
        description: document.getElementById('description').value,
        videoLink: document.getElementById('videoLink').value,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        id: Date.now().toString() // Simple ID generation
    };
    
    // Handle image upload
    const imageFile = document.getElementById('workImage').files[0];
    if (imageFile) {
        formData.image = await convertImageToBase64(imageFile);
    }
    
    try {
        // Save to database
        const response = await fetch('../api/submit-work', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            alert('Thank you for your submission! Your work is under review and will be published soon if approved.');
            document.getElementById('submissionForm').reset();
        } else {
            alert('There was an error submitting your work. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('There was an error submitting your work. Please try again.');
    }
});

// Convert image to base64 for storage
function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}