document.addEventListener('DOMContentLoaded', function() {
    // Form and file upload functionality
    const form = document.getElementById('projectForm');
    const fileInput = document.getElementById('project_file');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const submitBtn = document.getElementById('submitBtn');
    
    // Delete functionality variables
    let currentSubmissionId = null;
    const modal = document.getElementById('deleteModal');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const cancelBtn = document.getElementById('cancelDeleteBtn');

    // Initialize all functionality
    initFileUpload();
    initFormValidation();
    initDeleteFunctionality();
    initFlashMessages();

    function initFileUpload() {
        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                if (this.files.length > 0) {
                    const file = this.files[0];
                    fileName.textContent = file.name;
                    
                    // Format file size
                    const size = file.size;
                    const sizeKB = size / 1024;
                    const sizeMB = sizeKB / 1024;
                    const sizeGB = sizeMB / 1024;
                    
                    if (sizeGB >= 1) {
                        fileSize.textContent = `${sizeGB.toFixed(2)} GB`;
                    } else if (sizeMB >= 1) {
                        fileSize.textContent = `${sizeMB.toFixed(2)} MB`;
                    } else {
                        fileSize.textContent = `${sizeKB.toFixed(2)} KB`;
                    }
                    
                    fileInfo.style.display = 'block';
                    
                    // Show warning for very large files (optional)
                    if (size > 100 * 1024 * 1024) { // 100MB
                        if (!document.querySelector('.large-file-warning')) {
                            const warning = document.createElement('div');
                            warning.className = 'large-file-warning';
                            warning.innerHTML = '⚠️ Large file detected. Upload may take longer depending on your internet connection.';
                            fileInfo.parentNode.insertBefore(warning, fileInfo.nextSibling);
                        }
                    }
                } else {
                    fileInfo.style.display = 'none';
                    const warning = document.querySelector('.large-file-warning');
                    if (warning) warning.remove();
                }
            });
        }
    }

    function initFormValidation() {
        if (form) {
            form.addEventListener('submit', function(e) {
                // Basic client-side validation
                const requiredFields = form.querySelectorAll('[required]');
                let isValid = true;
                
                requiredFields.forEach(field => {
                    if (!field.value.trim()) {
                        isValid = false;
                        field.style.borderColor = '#e74c3c';
                    } else {
                        field.style.borderColor = '#e1e8ed';
                    }
                });
                
                if (!isValid) {
                    e.preventDefault();
                    alert('Please fill all required fields.');
                    return;
                }
                
                // URL validation for project and LinkedIn URLs
                const projectUrl = document.getElementById('project_url').value;
                const linkedinUrl = document.getElementById('linkedin_url').value;
                
                if (projectUrl && !isValidUrl(projectUrl)) {
                    e.preventDefault();
                    alert('Please enter a valid Project URL.');
                    return;
                }
                
                if (linkedinUrl && !isValidUrl(linkedinUrl)) {
                    e.preventDefault();
                    alert('Please enter a valid LinkedIn URL.');
                    return;
                }
                
                // Show upload progress for large files
                if (fileInput && fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    if (file.size > 10 * 1024 * 1024) { // Show progress for files > 10MB
                        submitBtn.disabled = true;
                        submitBtn.classList.add('loading');
                        uploadProgress.style.display = 'block';
                        
                        // Simulate progress (actual progress would need XMLHttpRequest)
                        let progress = 0;
                        const interval = setInterval(() => {
                            progress += Math.random() * 10;
                            if (progress >= 90) {
                                clearInterval(interval);
                            }
                            updateProgress(progress);
                        }, 200);
                    }
                }
            });
            
            function updateProgress(percent) {
                if (progressFill && progressText) {
                    progressFill.style.width = percent + '%';
                    progressText.textContent = `Uploading... ${Math.round(percent)}%`;
                }
            }
            
            function isValidUrl(string) {
                try {
                    new URL(string);
                    return true;
                } catch (_) {
                    return false;
                }
            }
            
            // Real-time validation for required fields
            const requiredFields = form.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                field.addEventListener('input', function() {
                    if (this.value.trim()) {
                        this.style.borderColor = '#27ae60';
                    } else {
                        this.style.borderColor = '#e1e8ed';
                    }
                });
            });
        }
    }

    function initDeleteFunctionality() {
        // Initialize modal event listeners
        if (modal && confirmBtn && cancelBtn) {
            // Confirm delete
            confirmBtn.addEventListener('click', function() {
                if (currentSubmissionId === 'all') {
                    deleteAllSubmissions();
                } else {
                    deleteSubmission(currentSubmissionId);
                }
                modal.style.display = 'none';
            });
            
            // Cancel delete
            cancelBtn.addEventListener('click', function() {
                modal.style.display = 'none';
                currentSubmissionId = null;
            });
            
            // Close modal when clicking outside
            window.addEventListener('click', function(event) {
                if (event.target === modal) {
                    modal.style.display = 'none';
                    currentSubmissionId = null;
                }
            });
        }
    }

    function initFlashMessages() {
        // Auto-hide flash messages after 5 seconds
        const flashMessages = document.querySelectorAll('.flash');
        flashMessages.forEach(flash => {
            setTimeout(() => {
                flash.style.opacity = '0';
                flash.style.transition = 'opacity 0.5s';
                setTimeout(() => flash.remove(), 500);
            }, 5000);
        });
    }

    // Delete confirmation modal functions
    window.confirmDelete = function(submissionId) {
        currentSubmissionId = submissionId;
        if (modal) {
            const modalMessage = document.getElementById('modalMessage');
            if (modalMessage) {
                modalMessage.textContent = 'Are you sure you want to delete this submission? This action cannot be undone.';
            }
            modal.style.display = 'block';
        }
    }

    window.confirmDeleteAll = function() {
        currentSubmissionId = 'all';
        if (modal) {
            const modalMessage = document.getElementById('modalMessage');
            if (modalMessage) {
                const submissionCount = document.querySelectorAll('.submission-card').length;
                modalMessage.textContent = `Are you sure you want to delete ALL ${submissionCount} submissions? This action cannot be undone.`;
            }
            modal.style.display = 'block';
        }
    }

    // Delete single submission
    async function deleteSubmission(submissionId) {
        const submissionElement = document.getElementById(`submission-${submissionId}`);
        if (!submissionElement) return;

        const deleteBtn = submissionElement.querySelector('.delete-btn');
        
        // Show loading state
        submissionElement.classList.add('deleting');
        if (deleteBtn) {
            deleteBtn.classList.add('loading');
            deleteBtn.innerHTML = '⏳';
            deleteBtn.disabled = true;
        }
        
        try {
            const response = await fetch(`/delete_submission/${submissionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                // If not JSON, get the text and throw error
                const text = await response.text();
                throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || `HTTP error! status: ${response.status}`);
            }
            
            if (result.success) {
                // Show success animation and remove element
                submissionElement.classList.add('deleted');
                setTimeout(() => {
                    submissionElement.remove();
                    
                    // Show message if no submissions left
                    if (document.querySelectorAll('.submission-card').length === 0) {
                        location.reload();
                    }
                }, 300);
                
                // Show flash message
                showFlashMessage(result.message, 'success');
            } else {
                throw new Error(result.message || 'Unknown error occurred');
            }
        } catch (error) {
            console.error('Error deleting submission:', error);
            
            let errorMessage = 'Error deleting submission: ';
            if (error.message.includes('HTML instead of JSON')) {
                errorMessage += 'Server error. Please check if the backend is running correctly.';
            } else {
                errorMessage += error.message;
            }
            
            showFlashMessage(errorMessage, 'error');
            
            // Reset loading state
            submissionElement.classList.remove('deleting');
            if (deleteBtn) {
                deleteBtn.classList.remove('loading');
                deleteBtn.innerHTML = '🗑️';
                deleteBtn.disabled = false;
            }
        }
    }

    // Delete all submissions
    async function deleteAllSubmissions() {
        const deleteAllBtn = document.getElementById('deleteAllBtn');
        const submissionCards = document.querySelectorAll('.submission-card');
        
        if (submissionCards.length === 0) {
            showFlashMessage('No submissions to delete.', 'error');
            return;
        }
        
        // Show loading state
        if (deleteAllBtn) {
            deleteAllBtn.classList.add('loading');
            deleteAllBtn.innerHTML = '⏳ Deleting...';
            deleteAllBtn.disabled = true;
        }
        
        submissionCards.forEach(card => {
            card.classList.add('deleting');
        });
        
        try {
            const response = await fetch('/delete_all_submissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                // If not JSON, get the text and throw error
                const text = await response.text();
                throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || `HTTP error! status: ${response.status}`);
            }
            
            if (result.success) {
                // Show success animation and reload page
                submissionCards.forEach(card => {
                    card.classList.add('deleted');
                });
                
                setTimeout(() => {
                    location.reload();
                }, 500);
                
                showFlashMessage(result.message, 'success');
            } else {
                throw new Error(result.message || 'Unknown error occurred');
            }
        } catch (error) {
            console.error('Error deleting all submissions:', error);
            
            let errorMessage = 'Error deleting all submissions: ';
            if (error.message.includes('HTML instead of JSON')) {
                errorMessage += 'Server error. Please check if the backend is running correctly.';
            } else {
                errorMessage += error.message;
            }
            
            showFlashMessage(errorMessage, 'error');
            
            // Reset loading state
            if (deleteAllBtn) {
                deleteAllBtn.classList.remove('loading');
                deleteAllBtn.innerHTML = '🗑️ Delete All';
                deleteAllBtn.disabled = false;
            }
            
            submissionCards.forEach(card => {
                card.classList.remove('deleting');
            });
        }
    }

    // Helper function to show flash messages
    function showFlashMessage(message, type) {
        const flashContainer = document.querySelector('.flash-messages') || createFlashContainer();
        const flash = document.createElement('div');
        flash.className = `flash ${type}`;
        flash.textContent = message;
        
        flashContainer.appendChild(flash);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            flash.style.opacity = '0';
            flash.style.transition = 'opacity 0.5s';
            setTimeout(() => flash.remove(), 500);
        }, 5000);
    }

    function createFlashContainer() {
        const container = document.createElement('div');
        container.className = 'flash-messages';
        const submissionsList = document.querySelector('.submissions-list');
        const mainContainer = document.querySelector('.container');
        
        if (submissionsList && mainContainer) {
            mainContainer.insertBefore(container, submissionsList);
        } else if (mainContainer) {
            mainContainer.appendChild(container);
        }
        return container;
    }

    // Additional utility functions
    window.formatFileSize = function(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Enhanced URL validation
    window.isValidUrl = function(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    };

    // Debounce function for performance
    window.debounce = function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // Enhanced form reset functionality
    window.resetForm = function() {
        if (form) {
            form.reset();
            if (fileInfo) {
                fileInfo.style.display = 'none';
            }
            const warning = document.querySelector('.large-file-warning');
            if (warning) warning.remove();
            
            // Reset validation styles
            const requiredFields = form.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                field.style.borderColor = '#e1e8ed';
            });
        }
    };

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Escape key closes modal
        if (e.key === 'Escape' && modal && modal.style.display === 'block') {
            modal.style.display = 'none';
            currentSubmissionId = null;
        }
        
        // Ctrl+D focuses on delete all button (if present)
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            const deleteAllBtn = document.getElementById('deleteAllBtn');
            if (deleteAllBtn) {
                deleteAllBtn.focus();
            }
        }
    });

    // Enhanced error handling
    window.addEventListener('error', function(e) {
        console.error('JavaScript Error:', e.error);
        showFlashMessage('An unexpected error occurred. Please refresh the page.', 'error');
    });

    // Service Worker registration for PWA capabilities (optional)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/sw.js')
                .then(function(registration) {
                    console.log('SW registered: ', registration);
                })
                .catch(function(registrationError) {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }
});