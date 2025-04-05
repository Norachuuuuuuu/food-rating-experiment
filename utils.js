// Custom shuffle function
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
// Keyboard handler
function handleKeyPress(event) {
    const key = event.key;
    const rating = parseInt(key);
    if (rating >= 1 && rating <= 8 && currentItemId !== null) {
        event.preventDefault(); // Prevent default browser behavior
        if (currentPart === 'part1') {
            rateItem(currentItemId, rating);
        } else if (currentPart === 'part3') {
            rateFinalItem(currentItemId, rating);
        }
    }
}