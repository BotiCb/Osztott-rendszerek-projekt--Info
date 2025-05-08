// API Configuration
const API_BASE_URL = `http://localhost:8080/api`;

/**
 * Fetch all questions from the server
 * @returns {Promise<Array>} - Array of question objects
 */
async function fetchQuestions() {
    const response = await fetch(`${API_BASE_URL}/questions`);
    if (!response.ok) {
        throw new Error('Failed to load questions');
    }
    const data = await response.json();
    return data.questions;
}

/**
 * Submit a vote for a question option
 * @param {number} questionId - Question ID
 * @param {number} optionId - Option ID
 * @returns {Promise<Object>} - Vote result
 */
async function submitVote(questionId, optionId) {
    const response = await fetch(`${API_BASE_URL}/vote`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user_id: 0,
            question_id: questionId,
            option_id: optionId
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Voting failed');
    }

    return await response.json();
}

/**
 * Get results for a specific question
 * @param {number} questionId - Question ID
 * @returns {Promise<Object>} - Question results
 */
async function getQuestionResults(questionId) {
    const response = await fetch(`${API_BASE_URL}/results?question_id=${questionId}`);
    if (!response.ok) {
        throw new Error('Failed to load results');
    }
    return await response.json();
}

/**
 * Create a new question
 * @param {string} questionText - Question text
 * @param {string} optionOne - First option text
 * @param {string} optionTwo - Second option text
 * @returns {Promise<Object>} - Created question
 */
async function createQuestion(questionText, optionOne, optionTwo) {
    const response = await fetch(`${API_BASE_URL}/questions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text: questionText,
            option_one: optionOne,
            option_two: optionTwo,
            user_id: 0
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add question');
    }

    return await response.json();
}