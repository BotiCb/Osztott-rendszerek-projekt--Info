/**
 * Display a message to the user
 * @param {string} message - Message text
 * @param {string} type - Message type ('success' or 'error')
 */
function showMessage(message, type = 'success') {
    const messageContainer = document.getElementById('message-container');
    messageContainer.innerHTML = `<div class="message ${type}">${message}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 5000);
}

/**
 * Render the list of questions
 * @param {Array} questions - Array of question objects
 * @param {Function} handleVoteCallback - Callback for vote buttons
 * @param {Function} showResultsCallback - Callback for results buttons
 */
function renderQuestions(questions, handleVoteCallback, showResultsCallback) {
    const questionsList = document.getElementById('questions-list');
    const questionCount = document.getElementById('question-count');
    
    questionsList.innerHTML = '';
    questionCount.textContent = questions.length;

    if (questions.length === 0) {
        questionsList.innerHTML = '<p>No questions available. Add one using the "Add New Question" button!</p>';
        return;
    }

    questions.forEach(question => {
        const questionCard = document.createElement('div');
        questionCard.className = 'question-card';
        questionCard.innerHTML = `
            <h3>${question.text}</h3>
            <div class="options">
                <button class="option-btn" data-question-id="${question.id}" data-option-id="${question.options[0].id}">
                    ${question.options[0].text}
                </button>
                <button class="option-btn" data-question-id="${question.id}" data-option-id="${question.options[1].id}">
                    ${question.options[1].text}
                </button>
            </div>
            <div class="vote-count">
                <button class="view-results-btn" data-question-id="${question.id}">View Results</button>
            </div>
        `;

        questionsList.appendChild(questionCard);

        // Add event listeners for voting
        const optionBtns = questionCard.querySelectorAll('.option-btn');
        optionBtns.forEach(btn => {
            btn.addEventListener('click', handleVoteCallback);
        });

        // Add event listener for viewing results
        const viewResultsBtn = questionCard.querySelector('.view-results-btn');
        viewResultsBtn.addEventListener('click', () => {
            showResultsCallback(question.id);
        });

        // Remove highlighting of previous vote (no user tracking)
        // checkUserVote(question.id, questionCard);
    });
}

/**
 * Render results for a question
 * @param {Array} results - Results data
 * @param {Object} question - Question object
 */
function renderResults(results, question) {
    const resultsContent = document.getElementById('results-content');
    
    let totalVotes = 0;
    results.forEach(result => {
        totalVotes += result.votes;
    });

    resultsContent.innerHTML = `
        <h3>${question.text}</h3>
        <div class="results-data">
            ${results.map(result => {
                const percentage = totalVotes > 0 ? (result.votes / totalVotes * 100).toFixed(1) : 0;
                return `
                    <div class="results-item">
                        <div class="results-label">
                            <span>${result.option_text}</span>
                            <span>${result.votes} votes (${percentage}%)</span>
                        </div>
                        <div class="results-bar" style="width: ${percentage}%;"></div>
                    </div>
                `;
            }).join('')}
        </div>
        <p>Total votes: ${totalVotes}</p>
    `;
}