document.addEventListener('DOMContentLoaded', function() {
    const flipButton = document.querySelector('.flip-button');
    const nextButton = document.querySelector('.next-button');
    const addCardButton = document.querySelector('.add-button');
    const deleteButton = document.querySelector('.delete-button');

    const cardInner = document.querySelector('.card-inner');
    const cardFront = document.querySelector('.card-front');
    const cardBack = document.querySelector('.card-back');

    const newFormContainer = document.querySelector('.new_form');
    const newCardForm = document.getElementById('new-card-form');
    const frontInput = document.getElementById('front');
    const backTextarea = document.getElementById('back');

    // --- Helper function to update card content ---
    function updateCardContent(frontText, backText, cardId) {
        cardFront.textContent = frontText;
        cardBack.textContent = backText;
        // Update the data attribute on the body with the new card's ID
        document.body.dataset.currentCardId = cardId;

        // Ensure the card is showing the front and is not flipped
        cardInner.classList.remove('flipped');
        cardFront.classList.remove('hidden');
        cardBack.classList.add('hidden');
    }

    // --- Flip Card Functionality ---
    if (flipButton) {
        flipButton.addEventListener('click', () => {
            cardInner.classList.toggle('flipped');
            cardFront.classList.toggle('hidden');
            cardBack.classList.toggle('hidden');
        });
    }


    // --- Next Card Functionality (AJAX) ---
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            const currentCardId = document.body.dataset.currentCardId;

            if (!currentCardId) {
                alert('No cards available to navigate.');
                return;
            }

            fetch(`/next_card_data/${currentCardId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data && data.front && data.back && data.id) {
                        updateCardContent(data.front, data.back, data.id);
                    } else {
                        // This case might happen if backend returns empty or incomplete data
                        // It also happens if the only card is deleted and next is clicked
                        alert('No more cards, or an issue fetching the next one.');
                        // Optionally, disable next button or show a specific message
                    }
                })
                .catch(error => console.error('Error fetching next card:', error));
        });
    }

    // --- Toggle Add Card Form ---
    if (addCardButton && newFormContainer) {
        addCardButton.addEventListener('click', () => {
            newFormContainer.classList.toggle('show');
            // Clear form when opening
            if (newFormContainer.classList.contains('show')) {
                newCardForm.reset();
                frontInput.focus(); // Focus on the first input
            }
        });
    }

    // --- Add Card Form Submission (AJAX) ---
    if (newCardForm) {
        newCardForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            const front = frontInput.value.trim();
            const back = backTextarea.value.trim();

            if (!front || !back) {
                alert('Please fill in both front and back of the card.');
                return;
            }

            try {
                const response = await fetch('/add_card_ajax', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ front: front, back: back }),
                });

                const data = await response.json();

                if (data.success) {
                    alert('Card added successfully!');
                    newCardForm.reset(); // Clear the form
                    newFormContainer.classList.remove('show'); // Hide the form
                    // Optionally, update the card display immediately without a full reload
                    // If no cards were present before, display this one.
                    // If cards were present, the user will see it on next cycle or reload.
                    if (!document.body.dataset.currentCardId || document.body.dataset.currentCardId === '') {
                         updateCardContent(front, back, data.card_id);
                    } else {
                        // For simplicity, reload to ensure state is fresh
                        window.location.reload();
                    }

                } else {
                    alert('Error adding card: ' + (data.message || 'Unknown error.'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while adding the card.');
            }
        });
    }

    // --- Delete Card Functionality (AJAX) ---
    if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
            const currentCardId = document.body.dataset.currentCardId;

            if (!currentCardId || currentCardId === '') {
                alert('No card is currently displayed to delete.');
                return;
            }

            if (confirm('Are you sure you want to delete this card?')) {
                try {
                    const response = await fetch(`/delete/${currentCardId}`, {
                        method: 'POST', // Use POST for deletion for better practice
                        headers: {
                            'Content-Type': 'application/json', // Even for POST, you can indicate JSON if body is empty or simple
                        },
                        // body: JSON.stringify({}) // Optional: Send an empty JSON object if needed by Flask
                    });

                    const data = await response.json();

                    if (data.success) {
                        alert('Card deleted successfully!');
                        // After deleting, reload the page to get the updated card list
                        window.location.reload();
                    } else {
                        alert('Failed to delete card: ' + (data.message || 'Unknown error.'));
                    }
                } catch (error) {
                    console.error('Error deleting card:', error);
                    alert('An error occurred while deleting the card.');
                }
            }
        });
    }

    // Initial state check for cards
    if (!document.body.dataset.currentCardId || document.body.dataset.currentCardId === '') {
        // If no cards, hide flip/next/delete buttons
        if (flipButton) flipButton.style.display = 'none';
        if (nextButton) nextButton.style.display = 'none';
        if (deleteButton) deleteButton.style.display = 'none';
    }

});