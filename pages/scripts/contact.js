// Contact Form Functionality
class ContactForm {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.messageTextarea = document.getElementById('message');
        this.charCount = document.getElementById('messageCharCount');
        this.submitBtn = this.form.querySelector('.contact-submit');
        
        this.init();
    }
    
    init() {
        // Character count for message
        this.messageTextarea.addEventListener('input', () => {
            this.updateCharCount();
        });
        
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
        
        // FAQ toggle
        this.initFAQ();
    }
    
    updateCharCount() {
        const count = this.messageTextarea.value.length;
        this.charCount.textContent = count;
        
        if (count > 1000) {
            this.charCount.style.color = '#e74c3c';
        } else if (count > 800) {
            this.charCount.style.color = '#f39c12';
        } else {
            this.charCount.style.color = 'var(--text-light)';
        }
    }
    
    initFAQ() {
        const faqItems = document.querySelectorAll('.faq-item');
        
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            
            question.addEventListener('click', () => {
                // Close other items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });
                
                // Toggle current item
                item.classList.toggle('active');
            });
        });
    }
    
    validateForm() {
        let isValid = true;
        const formData = new FormData(this.form);
        
        // Clear previous errors
        this.clearErrors();
        
        // Validate required fields
        const requiredFields = ['firstName', 'lastName', 'email', 'subject', 'message'];
        requiredFields.forEach(field => {
            const value = formData.get(field);
            if (!value || value.trim() === '') {
                this.showError(field, 'This field is required');
                isValid = false;
            }
        });
        
        // Validate email format
        const email = formData.get('email');
        if (email && !this.isValidEmail(email)) {
            this.showError('email', 'Please enter a valid email address');
            isValid = false;
        }
        
        // Validate message length
        const message = formData.get('message');
        if (message && message.length > 1000) {
            this.showError('message', 'Message must be less than 1000 characters');
            isValid = false;
        }
        
        return isValid;
    }
    
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    showError(fieldName, message) {
        const field = document.getElementById(fieldName);
        const formGroup = field.closest('.form-group');
        
        formGroup.classList.add('error');
        
        let errorElement = formGroup.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('span');
            errorElement.className = 'error-message';
            formGroup.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
    }
    
    clearErrors() {
        const errorGroups = this.form.querySelectorAll('.form-group.error');
        errorGroups.forEach(group => {
            group.classList.remove('error');
            const errorElement = group.querySelector('.error-message');
            if (errorElement) {
                errorElement.remove();
            }
        });
    }
    
    setLoading(isLoading) {
        const btnText = this.submitBtn.querySelector('.btn-text');
        const btnLoader = this.submitBtn.querySelector('.btn-loader');
        
        if (isLoading) {
            this.submitBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoader.style.display = 'block';
            this.form.classList.add('loading');
        } else {
            this.submitBtn.disabled = false;
            btnText.style.display = 'block';
            btnLoader.style.display = 'none';
            this.form.classList.remove('loading');
        }
    }
    
    async handleSubmit() {
        if (!this.validateForm()) {
            return;
        }
        
        this.setLoading(true);
        
        try {
            const formData = new FormData(this.form);
            const data = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                subject: formData.get('subject'),
                message: formData.get('message'),
                timestamp: new Date().toISOString()
            };
            
            // Send email via backend API
            const response = await this.sendEmail(data);
            
            if (response.success) {
                this.showSuccessModal();
                this.form.reset();
                this.updateCharCount();
            } else {
                throw new Error(response.message || 'Failed to send message');
            }
            
        } catch (error) {
            console.error('Contact form error:', error);
            this.showNotification('Failed to send message. Please try again.', 'error');
        } finally {
            this.setLoading(false);
        }
    }
    
    async sendEmail(data) {
        // In a real application, this would call your backend API
        // For now, we'll simulate the API call
        
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate successful email sending
                console.log('Email would be sent to: contact@aawazekaaghaz.org');
                console.log('Email content:', data);
                
                resolve({
                    success: true,
                    message: 'Email sent successfully'
                });
                
                // In production, you would use:
                // return fetch('/api/contact', {
                //     method: 'POST',
                //     headers: {
                //         'Content-Type': 'application/json',
                //     },
                //     body: JSON.stringify(data)
                // }).then(response => response.json());
                
            }, 2000); // Simulate network delay
        });
    }
    
    showSuccessModal() {
        const modal = document.getElementById('successModal');
        modal.style.display = 'flex';
        modal.classList.add('active');
    }
    
    showNotification(message, type = 'info') {
        // You can use your existing notification system
        if (window.AawazApp && window.AawazApp.notifications) {
            window.AawazApp.notifications.show(message, type);
        } else {
            alert(message); // Fallback
        }
    }
}

// Global function to close success modal
function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.style.display = 'none';
    modal.classList.remove('active');
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('successModal');
    if (e.target === modal) {
        closeSuccessModal();
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ContactForm();
});