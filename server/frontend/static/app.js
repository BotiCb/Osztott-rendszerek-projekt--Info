// State
let questions = [];
let currentQuestionId = null;

// DOM Elements
const questionsContainer = document.getElementById('questions-container');
const resultsContainer = document.getElementById('results-container');
const backToQuestionsBtn = document.getElementById('back-to-questions');
const showQuestionsBtn = document.getElementById('show-questions-btn');
const addQuestionBtn = document.getElementById('add-question-btn');
const addQuestionContainer = document.getElementById('add-question-container');
const addQuestionForm = document.getElementById('add-question-form');

// Event Listeners
backToQuestionsBtn.addEventListener('click', showQuestions);
showQuestionsBtn.addEventListener('click', () => {
    addQuestionContainer.classList.add('hidden');
    resultsContainer.classList.add('hidden');
    questionsContainer.classList.remove('hidden');
});
addQuestionBtn.addEventListener('click', () => {
    questionsContainer.classList.add('hidden');
    resultsContainer.classList.add('hidden');
    addQuestionContainer.classList.remove('hidden');
});
addQuestionForm.addEventListener('submit', handleAddQuestion);

/**
 * Load all questions
 */
async function loadQuestions() {
    try {
        questions = await fetchQuestions();
        renderQuestions(questions, handleVote, showResults);
        questionsContainer.classList.remove('hidden');
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

/**
 * Handle vote action
 * @param {Event} event - Click event
 */
async function handleVote(event) {
    const questionId = parseInt(event.target.dataset.questionId);
    const optionId = parseInt(event.target.dataset.optionId);

    try {
        const data = await submitVote(questionId, optionId);

        // Highlight selected option
        const questionCard = event.target.closest('.question-card');
        const options = questionCard.querySelectorAll('.option-btn');
        options.forEach(opt => {
            opt.classList.remove('selected');
        });
        event.target.classList.add('selected');

        showMessage(`Vote ${data.status} successfully!`);

        // Show results after voting
        showResults(questionId);

    } catch (error) {
        showMessage(error.message, 'error');
    }
}

/**
 * Show results for a question
 * @param {number} questionId - Question ID
 */
async function showResults(questionId) {
    try {
        currentQuestionId = questionId;
        const question = questions.find(q => q.id === questionId);
        
        if (!question) {
            throw new Error('Question not found');
        }

        const data = await getQuestionResults(questionId);
        renderResults(data.results, question);

        questionsContainer.classList.add('hidden');
        addQuestionContainer.classList.add('hidden');
        resultsContainer.classList.remove('hidden');

    } catch (error) {
        showMessage(error.message, 'error');
    }
}

/**
 * Show questions view
 */
function showQuestions() {
    resultsContainer.classList.add('hidden');
    addQuestionContainer.classList.add('hidden');
    questionsContainer.classList.remove('hidden');
}

/**
 * Handle adding a new question
 * @param {Event} event - Form submit event
 */
async function handleAddQuestion(event) {
    event.preventDefault();

    const questionText = document.getElementById('question-text').value.trim();
    const optionOne = document.getElementById('option-one').value.trim();
    const optionTwo = document.getElementById('option-two').value.trim();

    if (!questionText || !optionOne || !optionTwo) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    try {
        await createQuestion(questionText, optionOne, optionTwo);
        
        showMessage('Question added successfully!');

        // Clear form
        document.getElementById('question-text').value = '';
        document.getElementById('option-one').value = '';
        document.getElementById('option-two').value = '';

        // Reload questions and show questions view
        await loadQuestions();
        showQuestions();

    } catch (error) {
        showMessage(error.message, 'error');
    }
}

/**
 * Setup real-time updates
 */
function setupRealTimeUpdates() {
    // Comment out or remove these intervals if you want to disable auto-refresh

    // setInterval(() => {
    //     if (!resultsContainer.classList.contains('hidden') && currentQuestionId) {
    //         showResults(currentQuestionId);
    //     }
    // }, 5000);

    // setInterval(() => {
    //     loadQuestions();
    // }, 30000);
}

// Initialize
loadQuestions();
setupRealTimeUpdates();