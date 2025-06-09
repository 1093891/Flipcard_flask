document.addEventListener('DOMContentLoaded', () => {
    const flipButton = document.querySelector('.flip-button');
    const nextButton = document.querySelector('.next-button');
    const cardInner = document.querySelector('.card-inner');
    const cardFront = document.querySelector('.card-front');
    const cardBack = document.querySelector('.card-back');
    const addCardButton = document.querySelector('.add-button');
    const deleteCardButton = document.querySelector('.delete-button');
    const newCardForm = document.querySelector('.new-card-form');


    // -- Flip Card Functionality --
    flipButton.addEventListener('click', () => {
        cardInner.classList.toggle('flipped');
        cardBack.classList.toggle('hidden');
        cardFront.classList.toggle('hidden');
    });


})