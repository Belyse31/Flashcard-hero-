// DOM Elements
const flashcardForm = document.getElementById('flashcard-form');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const questionInput = document.getElementById('question');
const answerInput = document.getElementById('answer');
const categoryInput = document.getElementById('category');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const modalCloseBtn = document.getElementById('modal-close');
const addCardBtn = document.getElementById('add-card-btn');
const createFirstBtn = document.getElementById('create-first-btn');
const flashcardsContainer = document.getElementById('flashcards-container');
const emptyState = document.getElementById('empty-state');
const emptyMessage = document.getElementById('empty-message');
const searchInput = document.getElementById('search-input');
const categoryFilters = document.getElementById('category-filters');
const progressFill = document.getElementById('progress-fill');
const progressPercentage = document.getElementById('progress-percentage');
const progressStats = document.getElementById('progress-stats');
const themeToggle = document.getElementById('theme-toggle');
const toastContainer = document.getElementById('toast-container');

// State
let flashcards = [];
let editingCardId = null;
let selectedCategory = 'all';

// Initialize the app
function init() {
    loadFlashcards();
    loadTheme();
    renderFlashcards();
    updateCategories();
    updateProgress();
    
    // Event listeners
    addCardBtn.addEventListener('click', () => openModal());
    createFirstBtn.addEventListener('click', () => openModal());
    cancelBtn.addEventListener('click', closeModal);
    modalCloseBtn.addEventListener('click', closeModal);
    submitBtn.addEventListener('click', handleFormSubmit);
    searchInput.addEventListener('input', renderFlashcards);
    themeToggle.addEventListener('click', toggleTheme);
    
    // Close modal when clicking outside
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });
    
    // Category filter event delegation
    categoryFilters.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-btn')) {
            selectedCategory = e.target.dataset.category;
            
            // Update active state
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            e.target.classList.add('active');
            
            renderFlashcards();
        }
    });
}

// Load flashcards from local storage
function loadFlashcards() {
    const savedFlashcards = localStorage.getItem('flashcards');
    if (savedFlashcards) {
        flashcards = JSON.parse(savedFlashcards);
    }
}

// Save flashcards to local storage
function saveFlashcards() {
    localStorage.setItem('flashcards', JSON.stringify(flashcards));
    updateCategories();
    updateProgress();
}

// Load theme preference
function loadTheme() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-theme');
    }
}

// Toggle theme
function toggleTheme() {
    const isDarkMode = document.body.classList.toggle('dark-theme');
    localStorage.setItem('darkMode', isDarkMode);
}

// Open modal for creating/editing a flashcard
function openModal(cardId = null) {
    if (cardId) {
        // Edit mode
        const card = flashcards.find(card => card.id === cardId);
        if (card) {
            editingCardId = cardId;
            questionInput.value = card.question;
            answerInput.value = card.answer;
            categoryInput.value = card.category || '';
            
            modalTitle.textContent = 'Edit Flashcard';
            submitBtn.textContent = 'Update Flashcard';
        }
    } else {
        // Create mode
        resetForm();
    }
    
    modalOverlay.classList.add('active');
    setTimeout(() => {
        questionInput.focus();
    }, 300);
}

// Close modal
function closeModal() {
    modalOverlay.classList.remove('active');
    setTimeout(resetForm, 300);
}

// Reset the form fields and state
function resetForm() {
    flashcardForm.reset();
    editingCardId = null;
    modalTitle.textContent = 'Create New Flashcard';
    submitBtn.textContent = 'Create Flashcard';
    
    // Clear error states
    questionInput.classList.remove('error');
    answerInput.classList.remove('error');
    document.getElementById('question-error').style.display = 'none';
    document.getElementById('answer-error').style.display = 'none';
}

// Handle form submission
function handleFormSubmit() {
    // Validate form
    let isValid = true;
    
    if (!questionInput.value.trim()) {
        questionInput.classList.add('error');
        document.getElementById('question-error').textContent = 'Question is required';
        document.getElementById('question-error').style.display = 'block';
        isValid = false;
    } else {
        questionInput.classList.remove('error');
        document.getElementById('question-error').style.display = 'none';
    }
    
    if (!answerInput.value.trim()) {
        answerInput.classList.add('error');
        document.getElementById('answer-error').textContent = 'Answer is required';
        document.getElementById('answer-error').style.display = 'block';
        isValid = false;
    } else {
        answerInput.classList.remove('error');
        document.getElementById('answer-error').style.display = 'none';
    }
    
    if (!isValid) return;
    
    if (editingCardId) {
        // Update existing flashcard
        const index = flashcards.findIndex(card => card.id === editingCardId);
        if (index !== -1) {
            flashcards[index] = {
                ...flashcards[index],
                question: questionInput.value.trim(),
                answer: answerInput.value.trim(),
                category: categoryInput.value.trim()
            };
            showToast('success', 'Flashcard Updated', 'Your flashcard has been updated successfully.');
        }
    } else {
        // Create new flashcard
        const newFlashcard = {
            id: Date.now().toString(),
            question: questionInput.value.trim(),
            answer: answerInput.value.trim(),
            category: categoryInput.value.trim(),
            completed: false
        };
        
        flashcards.push(newFlashcard);
        showToast('success', 'Flashcard Created', 'Your new flashcard has been created successfully.');
    }
    
    saveFlashcards();
    renderFlashcards();
    closeModal();
}

// Render all flashcards based on current filters
function renderFlashcards() {
    const searchTerm = searchInput.value.toLowerCase();
    
    // Filter flashcards based on search term and selected category
    const filteredFlashcards = flashcards.filter(card => {
        const matchesSearch = card.question.toLowerCase().includes(searchTerm) || 
                             card.answer.toLowerCase().includes(searchTerm);
        
        const matchesCategory = selectedCategory === 'all' || 
                               (selectedCategory === card.category);
        
        return matchesSearch && matchesCategory;
    });
    
    // Show empty state if no flashcards
    if (flashcards.length === 0) {
        flashcardsContainer.innerHTML = '';
        emptyState.classList.remove('hidden');
        emptyMessage.textContent = 'No flashcards yet. Create your first one!';
        createFirstBtn.style.display = 'inline-flex';
    } else if (filteredFlashcards.length === 0) {
        flashcardsContainer.innerHTML = '';
        emptyState.classList.remove('hidden');
        emptyMessage.textContent = 'No flashcards match your search.';
        createFirstBtn.style.display = 'none';
    } else {
        emptyState.classList.add('hidden');
        
        // Render the filtered flashcards
        flashcardsContainer.innerHTML = filteredFlashcards.map(card => `
            <div class="flashcard ${card.completed ? 'completed' : ''}" data-id="${card.id}">
                <div class="flashcard-inner">
                    <div class="flashcard-front">
                        <div class="flashcard-content">
                            <h3>${escapeHtml(card.question)}</h3>
                        </div>
                        <div class="flashcard-hint">Click to reveal answer</div>
                        ${card.category ? `
                            <div class="flashcard-category">
                                <i class="fas fa-tag"></i> ${escapeHtml(card.category)}
                            </div>
                        ` : ''}
                    </div>
                    <div class="flashcard-back">
                        <div class="flashcard-content">
                            <p>${escapeHtml(card.answer)}</p>
                        </div>
                        <div class="flashcard-hint">Click to see question</div>
                        ${card.category ? `
                            <div class="flashcard-category">
                                <i class="fas fa-tag"></i> ${escapeHtml(card.category)}
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="flashcard-actions">
                    <button class="btn icon-btn toggle-completion-btn" data-id="${card.id}" title="${card.completed ? 'Mark as incomplete' : 'Mark as complete'}">
                        <i class="fas fa-check ${card.completed ? 'text-green-500' : ''}"></i>
                    </button>
                    <div>
                        <button class="btn icon-btn edit-btn" data-id="${card.id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn icon-btn delete-btn" data-id="${card.id}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add event listeners to the flashcards
        document.querySelectorAll('.flashcard').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't flip if clicking on a button
                if (!e.target.closest('button')) {
                    card.classList.toggle('flipped');
                }
            });
        });
        
        // Add event listeners to the buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openModal(btn.dataset.id);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteFlashcard(btn.dataset.id);
            });
        });
        
        document.querySelectorAll('.toggle-completion-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleCompletion(btn.dataset.id);
            });
        });
    }
}

// Delete a flashcard
function deleteFlashcard(id) {
    const card = flashcards.find(card => card.id === id);
    if (confirm(`Are you sure you want to delete this flashcard: "${card.question}"?`)) {
        flashcards = flashcards.filter(card => card.id !== id);
        saveFlashcards();
        renderFlashcards();
        showToast('warning', 'Flashcard Deleted', 'Your flashcard has been deleted.');
    }
}

// Toggle completion status of a flashcard
function toggleCompletion(id) {
    const index = flashcards.findIndex(card => card.id === id);
    if (index !== -1) {
        flashcards[index].completed = !flashcards[index].completed;
        saveFlashcards();
        renderFlashcards();
        
        const status = flashcards[index].completed ? 'completed' : 'marked as incomplete';
        showToast('success', 'Status Updated', `Flashcard has been ${status}.`);
    }
}

// Update the category filters
function updateCategories() {
    // Get unique categories
    const categories = [...new Set(flashcards.map(card => card.category).filter(Boolean))];
    
    // Create category buttons
    const categoryButtons = categories.map(category => `
        <button class="category-btn ${selectedCategory === category ? 'active' : ''}" data-category="${category}">
            ${escapeHtml(category)}
        </button>
    `).join('');
    
    // Update the category filters
    const allButton = `<button class="category-btn ${selectedCategory === 'all' ? 'active' : ''}" data-category="all">All</button>`;
    categoryFilters.innerHTML = allButton + categoryButtons;
}

// Update the progress bar
function updateProgress() {
    const totalCards = flashcards.length;
    const completedCards = flashcards.filter(card => card.completed).length;
    const percentage = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;
    
    progressFill.style.width = `${percentage}%`;
    progressPercentage.textContent = `${percentage}%`;
    progressStats.textContent = `${completedCards} of ${totalCards} cards completed`;
    
    // Check if all cards are completed
    if (totalCards > 0 && completedCards === totalCards) {
        showToast('success', 'Congratulations!', 'You have completed all your flashcards!');
    }
}

// Show toast notification
function showToast(type, title, message) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icon}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s forwards';
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, 3000);
}

// Helper function to escape HTML to prevent XSS
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);