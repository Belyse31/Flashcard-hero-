// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const flashcardsContainer = document.getElementById('flashcards-container');
const emptyState = document.getElementById('empty-state');
const modalOverlay = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');
const addCardBtn = document.getElementById('add-card-btn');
const createFirstBtn = document.getElementById('create-first-btn');
const cancelBtn = document.getElementById('cancel-btn');
const submitBtn = document.getElementById('submit-btn');
const questionInput = document.getElementById('question');
const answerInput = document.getElementById('answer');
const categoryInput = document.getElementById('category');
const difficultySelect = document.getElementById('difficulty');
const searchInput = document.getElementById('search-input');
const categoryFilters = document.getElementById('category-filters');
const progressFill = document.getElementById('progress-fill');
const progressPercentage = document.getElementById('progress-percentage');
const progressStats = document.getElementById('progress-stats');
const modalTitle = document.getElementById('modal-title');
const studyModeOptions = document.querySelectorAll('.study-mode-option');
const studyTimer = document.getElementById('study-timer');
const timerValue = document.getElementById('timer-value');
const totalCardsElement = document.getElementById('total-cards');
const cardsDueElement = document.getElementById('cards-due');
const cardsMasteredElement = document.getElementById('cards-mastered');
const streakCountElement = document.getElementById('streak-count');

// State Variables
let flashcards = JSON.parse(localStorage.getItem('flashcards')) || [];
let editingCardId = null;
let currentFilter = 'all';
let searchQuery = '';
let studyMode = 'browse';
let studyTimerInterval = null;
let studyStartTime = null;
let userStreak = JSON.parse(localStorage.getItem('userStreak')) || { 
    count: 0, 
    lastStudyDate: null 
};

// Initialize Application
function init() {
    loadThemePreference();
    renderFlashcards();
    updateCategories();
    updateProgress();
    updateStudyStats();
    checkAndUpdateStreak();
    setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
    // Theme Toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Modal Controls
    addCardBtn.addEventListener('click', openCreateModal);
    createFirstBtn.addEventListener('click', openCreateModal);
    modalClose.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    submitBtn.addEventListener('click', handleFormSubmit);
    
    // Search and Filter
    searchInput.addEventListener('input', handleSearch);
    categoryFilters.addEventListener('click', handleCategoryFilter);
    
    // Study Mode
    studyModeOptions.forEach(option => {
        option.addEventListener('click', () => {
            setStudyMode(option.dataset.mode);
        });
    });
    
    // Close modal when clicking outside
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Keyboard Shortcuts
function handleKeyboardShortcuts(e) {
    // Escape key closes modal
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
        closeModal();
    }
    
    // Ctrl+N opens create card modal
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        openCreateModal();
    }
    
    // Ctrl+F focuses search
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        searchInput.focus();
    }
}

// Theme Functions
function loadThemePreference() {
    const darkThemePreferred = localStorage.getItem('darkTheme') === 'true';
    if (darkThemePreferred) {
        document.body.classList.add('dark-theme');
    }
}

function toggleTheme() {
    const isDarkTheme = document.body.classList.toggle('dark-theme');
    localStorage.setItem('darkTheme', isDarkTheme);
    
    // Add animation effect
    themeToggle.classList.add('rotate');
    setTimeout(() => themeToggle.classList.remove('rotate'), 300);
}

// Modal Functions
function openCreateModal() {
    modalOverlay.classList.add('active');
    modalTitle.textContent = 'Create New Flashcard';
    questionInput.value = '';
    answerInput.value = '';
    categoryInput.value = '';
    difficultySelect.value = 'medium';
    editingCardId = null;
    submitBtn.textContent = 'Create Flashcard';
    
    // Focus on first input with small delay for animation
    setTimeout(() => questionInput.focus(), 300);
}

function openEditModal(cardId) {
    const card = flashcards.find(card => card.id === cardId);
    if (!card) return;

    modalOverlay.classList.add('active');
    modalTitle.textContent = 'Edit Flashcard';
    questionInput.value = card.question;
    answerInput.value = card.answer;
    categoryInput.value = card.category || '';
    difficultySelect.value = card.difficulty || 'medium';
    editingCardId = cardId;
    submitBtn.textContent = 'Save Changes';
    
    setTimeout(() => questionInput.focus(), 300);
}

function closeModal() {
    modalOverlay.classList.remove('active');
    clearFormErrors();
}

// Form Handling
function handleFormSubmit() {
    if (!validateForm()) return;
    
    if (editingCardId) {
        updateCard();
    } else {
        createCard();
    }
    
    closeModal();
    showToast('Success', 'Flashcard saved successfully!', 'success');
}

function validateForm() {
    let isValid = true;
    clearFormErrors();
    
    if (!questionInput.value.trim()) {
        showFormError('question-error', 'Question is required');
        questionInput.classList.add('error');
        isValid = false;
    }
    
    if (!answerInput.value.trim()) {
        showFormError('answer-error', 'Answer is required');
        answerInput.classList.add('error');
        isValid = false;
    }
    
    return isValid;
}

function showFormError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function clearFormErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.textContent = '';
        element.style.display = 'none';
    });
    
    questionInput.classList.remove('error');
    answerInput.classList.remove('error');
}

// Flashcard CRUD Operations
function createCard() {
    const newCard = {
        id: Date.now().toString(),
        question: questionInput.value.trim(),
        answer: answerInput.value.trim(),
        category: categoryInput.value.trim() || 'Uncategorized',
        difficulty: difficultySelect.value,
        dateCreated: new Date().toISOString(),
        lastReviewed: null,
        nextReviewDate: new Date().toISOString(), // Due immediately
        reviewCount: 0,
        masteryLevel: 0, // 0: New, 1-3: Learning, 4: Mastered
    };
    
    flashcards.push(newCard);
    saveFlashcards();
    renderFlashcards();
    updateCategories();
    updateProgress();
    updateStudyStats();
    
    // Show empty state if needed
    toggleEmptyState();
}

function updateCard() {
    const cardIndex = flashcards.findIndex(card => card.id === editingCardId);
    if (cardIndex === -1) return;
    
    flashcards[cardIndex].question = questionInput.value.trim();
    flashcards[cardIndex].answer = answerInput.value.trim();
    flashcards[cardIndex].category = categoryInput.value.trim() || 'Uncategorized';
    flashcards[cardIndex].difficulty = difficultySelect.value;
    
    saveFlashcards();
    renderFlashcards();
    updateCategories();
}

function deleteCard(cardId) {
    // Show confirmation dialog
    if (!confirm('Are you sure you want to delete this flashcard?')) return;
    
    flashcards = flashcards.filter(card => card.id !== cardId);
    saveFlashcards();
    renderFlashcards();
    updateCategories();
    updateProgress();
    updateStudyStats();
    
    // Show empty state if needed
    toggleEmptyState();
    
    showToast('Success', 'Flashcard deleted', 'success');
}

function markCardComplete(cardId) {
    const cardIndex = flashcards.findIndex(card => card.id === cardId);
    if (cardIndex === -1) return;
    
    const card = flashcards[cardIndex];
    card.reviewCount++;
    card.masteryLevel = Math.min(card.masteryLevel + 1, 4);
    card.lastReviewed = new Date().toISOString();
    
    // Calculate next review date based on spaced repetition algorithm
    const now = new Date();
    let nextReview = new Date(now);
    
    // Simple spaced repetition: 1 day → 3 days → 7 days → 14 days → 30 days
    switch (card.masteryLevel) {
        case 1: nextReview.setDate(now.getDate() + 1); break;
        case 2: nextReview.setDate(now.getDate() + 3); break;
        case 3: nextReview.setDate(now.getDate() + 7); break;
        case 4: nextReview.setDate(now.getDate() + 14); break;
        case 5: nextReview.setDate(now.getDate() + 30); break;
    }
    
    card.nextReviewDate = nextReview.toISOString();
    
    // If mastered, show a celebration
    if (card.masteryLevel === 4) {
        showConfetti();
    }
    
    saveFlashcards();
    updateProgress();
    updateStudyStats();
    checkAndUpdateStreak();
    
    // If in review mode, remove card from view and show next
    if (studyMode === 'review') {
        renderFlashcards();
    }
    
    showToast('Progress Saved', 'Card review recorded', 'success');
}

function saveFlashcards() {
    localStorage.setItem('flashcards', JSON.stringify(flashcards));
}

// Rendering Functions
function renderFlashcards() {
    flashcardsContainer.innerHTML = '';
    let filteredCards = filterFlashcards();
    
    if (filteredCards.length === 0) {
        toggleEmptyState(true);
        return;
    }
    
    toggleEmptyState(false);
    
    filteredCards.forEach(card => {
        const cardElement = createCardElement(card);
        flashcardsContainer.appendChild(cardElement);
    });
}

function createCardElement(card) {
    const cardElement = document.createElement('div');
    cardElement.className = 'flashcard';
    cardElement.dataset.id = card.id;
    
    let statusClass = 'new';
    if (card.masteryLevel >= 4) {
        statusClass = 'mastered';
    } else if (card.masteryLevel > 0) {
        statusClass = 'learning';
    }
    
    cardElement.innerHTML = `
        <div class="card-status ${statusClass}"></div>
        <div class="flashcard-inner">
            <div class="flashcard-front">
                <div class="flashcard-content markdown-content">
                    ${card.question}
                </div>
                <div class="flashcard-category">
                    <i class="fas fa-tag"></i> ${card.category}
                </div>
                <div class="flashcard-hint">Click to flip</div>
                <div class="flashcard-actions">
                    <button class="icon-btn edit-btn" title="Edit flashcard">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn delete-btn" title="Delete flashcard">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            <div class="flashcard-back">
                <div class="flashcard-content markdown-content">
                    ${card.answer}
                </div>
                <div class="flashcard-hint">Click to flip back</div>
                <div class="flashcard-actions">
                    ${studyMode !== 'browse' ? 
                        `<button class="icon-btn mark-complete-btn" title="Mark as reviewed">
                            <i class="fas fa-check text-green-500"></i>
                        </button>` : ''}
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners
    const cardInner = cardElement.querySelector('.flashcard-inner');
    cardInner.addEventListener('click', (e) => {
        // Don't flip if clicked on a button
        if (e.target.closest('button')) return;
        cardElement.classList.toggle('flipped');
    });
    
    const editBtn = cardElement.querySelector('.edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => openEditModal(card.id));
    }
    
    const deleteBtn = cardElement.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => deleteCard(card.id));
    }
    
    const markCompleteBtn = cardElement.querySelector('.mark-complete-btn');
    if (markCompleteBtn) {
        markCompleteBtn.addEventListener('click', () => markCardComplete(card.id));
    }
    
    return cardElement;
}

function filterFlashcards() {
    let filtered = [...flashcards];
    
    // Filter by study mode
    if (studyMode === 'review') {
        const now = new Date().toISOString();
        filtered = filtered.filter(card => card.nextReviewDate <= now && card.masteryLevel < 4);
    } else if (studyMode === 'learn') {
        filtered = filtered.filter(card => card.masteryLevel === 0);
    }
    
    // Filter by category
    if (currentFilter !== 'all') {
        filtered = filtered.filter(card => card.category === currentFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(card => 
            card.question.toLowerCase().includes(query) || 
            card.answer.toLowerCase().includes(query) ||
            card.category.toLowerCase().includes(query)
        );
    }
    
    return filtered;
}

function toggleEmptyState(isEmpty = null) {
    if (isEmpty === null) {
        isEmpty = flashcards.length === 0;
    }
    
    if (isEmpty) {
        emptyState.style.display = 'flex';
        flashcardsContainer.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        flashcardsContainer.style.display = 'grid';
    }
}

// Category Functions
function updateCategories() {
    // Extract unique categories
    const categories = ['all', ...new Set(flashcards.map(card => card.category))];
    
    // Clear existing filters
    categoryFilters.innerHTML = '';
    
    // Create filter buttons
    categories.forEach(category => {
        const filterBtn = document.createElement('button');
        filterBtn.className = `category-filter ${category === currentFilter ? 'active' : ''}`;
        filterBtn.dataset.category = category;
        filterBtn.textContent = category === 'all' ? 'All Categories' : category;
        
        categoryFilters.appendChild(filterBtn);
    });
}

function handleCategoryFilter(e) {
    const filterBtn = e.target.closest('.category-filter');
    if (!filterBtn) return;
    
    // Update active filter
    document.querySelectorAll('.category-filter').forEach(btn => 
        btn.classList.remove('active')
    );
    filterBtn.classList.add('active');
    
    // Set filter and re-render
    currentFilter = filterBtn.dataset.category;
    renderFlashcards();
}

function handleSearch(e) {
    searchQuery = e.target.value;
    renderFlashcards();
}

// Study Mode Functions
function setStudyMode(mode) {
    // Update active study mode
    studyModeOptions.forEach(option => 
        option.classList.toggle('active', option.dataset.mode === mode)
    );
    
    studyMode = mode;
    renderFlashcards();
    
    // Start/stop timer
    if (mode === 'browse') {
        stopStudyTimer();
    } else if (!studyTimerInterval) {
        startStudyTimer();
    }
}

function startStudyTimer() {
    studyStartTime = Date.now();
    studyTimer.style.display = 'block';
    
    // Update timer every second
    studyTimerInterval = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - studyStartTime) / 1000);
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        
        timerValue.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function stopStudyTimer() {
    if (studyTimerInterval) {
        clearInterval(studyTimerInterval);
        studyTimerInterval = null;
    }
    
    studyTimer.style.display = 'none';
}

// Progress Functions
function updateProgress() {
    const totalCards = flashcards.length;
    const masteredCards = flashcards.filter(card => card.masteryLevel >= 4).length;
    const progressPercent = totalCards === 0 ? 0 : (masteredCards / totalCards) * 100;
    
    progressFill.style.width = `${progressPercent}%`;
    progressPercentage.textContent = `${Math.round(progressPercent)}%`;
    progressStats.textContent = `${masteredCards} of ${totalCards} cards mastered`;
}

function updateStudyStats() {
    const totalCards = flashcards.length;
    const masteredCards = flashcards.filter(card => card.masteryLevel >= 4).length;
    const dueCards = flashcards.filter(card => {
        const now = new Date().toISOString();
        return card.nextReviewDate <= now && card.masteryLevel < 4;
    }).length;
    
    totalCardsElement.textContent = totalCards;
    cardsDueElement.textContent = dueCards;
    cardsMasteredElement.textContent = masteredCards;
    streakCountElement.textContent = userStreak.count;
}

// Streak Functions
function checkAndUpdateStreak() {
    const today = new Date().toDateString();
    
    // If first study session ever
    if (!userStreak.lastStudyDate) {
        userStreak.count = 1;
        userStreak.lastStudyDate = today;
        saveStreak();
        return;
    }
    
    const lastDate = new Date(userStreak.lastStudyDate);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // If studied today already, do nothing
    if (today === userStreak.lastStudyDate) {
        return;
    }
    
    // If studied yesterday, increment streak
    if (yesterday.toDateString() === userStreak.lastStudyDate) {
        userStreak.count++;
        userStreak.lastStudyDate = today;
        
        // Celebrate milestones
        if (userStreak.count % 7 === 0) {
            showToast('Awesome!', `${userStreak.count} day streak! Keep it up!`, 'success');
            showConfetti();
        }
    } else {
        // Streak broken
        if (userStreak.count > 1) {
            showToast('Streak Reset', 'Your streak has been reset. Start a new one!', 'info');
        }
        userStreak.count = 1;
        userStreak.lastStudyDate = today;
    }
    
    saveStreak();
}

function saveStreak() {
    localStorage.setItem('userStreak', JSON.stringify(userStreak));
    streakCountElement.textContent = userStreak.count;
}

// UI Enhancement Functions
function showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-header">
            <strong>${title}</strong>
            <button class="toast-close">&times;</button>
        </div>
        <div class="toast-body">${message}</div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    });
    
    // Auto close after 3 seconds
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }
    }, 3000);
}

function showConfetti() {
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    document.body.appendChild(confettiContainer);
    
    // Create confetti elements
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.animationDelay = `${Math.random() * 3}s`;
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 80%, 60%)`;
        
        confettiContainer.appendChild(confetti);
    }
    
    // Remove after animation
    setTimeout(() => {
        confettiContainer.remove();
    }, 3000);
}

// Export function to start the app
function exportCards() {
    const dataStr = JSON.stringify(flashcards, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `flashcards_export_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast('Export Complete', 'Your flashcards have been exported to a JSON file', 'success');
}

// Import function
function importCards(files) {
    if (files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedCards = JSON.parse(e.target.result);
            
            if (!Array.isArray(importedCards)) {
                throw new Error('Invalid format');
            }
            
            // Validate imported cards
            const validCards = importedCards.filter(card => 
                card.question && card.answer && card.id
            );
            
            if (validCards.length === 0) {
                showToast('Import Failed', 'No valid flashcards found in the file', 'error');
                return;
            }
            
            // Merge with existing cards or replace them
            if (confirm(`Import ${validCards.length} flashcards? This will merge with your existing cards.`)) {
                // Prevent duplicates by ID
                const existingIds = new Set(flashcards.map(card => card.id));
                const newCards = validCards.filter(card => !existingIds.has(card.id));
                
                flashcards = [...flashcards, ...newCards];
                saveFlashcards();
                renderFlashcards();
                updateCategories();
                updateProgress();
                updateStudyStats();
                
                showToast('Import Complete', `${newCards.length} flashcards imported successfully`, 'success');
            }
        } catch (error) {
            showToast('Import Failed', 'Could not parse the imported file', 'error');
            console.error('Import error:', error);
        }
    };
    
    reader.readAsText(file);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Add global event listeners for import/export
document.getElementById('export-btn').addEventListener('click', exportCards);
document.getElementById('import-input').addEventListener('change', (e) => importCards(e.target.files));