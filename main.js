let foodItems = shuffle(fullFoodItems).slice(0, numItems);
const reminderTimeout = 3000; // 3 seconds
let currentTrial = 0;
let ratings = {}; // Store as { id: rating }
let chosenPairs = []; // Store as [id]
let rejectedPairs = []; // Store as [id]
let computerChosenPairs = []; // Store as [id]
let finalRatings = {}; // Store as { id: rating }
let timeoutCount = 0;
let reminderTimeoutId;
let currentTrials = []; // Store trials globally to pass between functions

const alertSound = document.getElementById('alert-sound');
const container = document.getElementById('experiment-container');
const content = document.getElementById('content');



// Start experiment
function startExperiment() {
    currentTrial = 0;
    timeoutCount = 0;
    ratings = {};
    chosenPairs = [];
    rejectedPairs = [];
    computerChosenPairs = [];
    finalRatings = {};
    foodItems = shuffle([...fullFoodItems]).slice(0, numItems); // Re-shuffle each experiment
    currentPart = null;
    currentItemId = null;
    showItemCountInput(); // Show input screen first
    document.addEventListener('keydown', handleKeyPress); // Add keyboard listener    
}

function showWelcome() {
    document.getElementById('title').innerText = 'Welcome to the Food Rating Test';
    content.innerHTML = `
    <p>You will rate food items, make choices between them, and rate them again.</p>
    <button onclick="startPart1()">Start</button>
  `;
    currentPart = 'welcome';
}

// Part 1: Initial Ratings
function startPart1() {
    document.getElementById('title').innerText = 'Part 1: Rating Food Items';
    currentTrial = 0;
    currentPart = 'part1';
    showNextRating();
}

function showNextRating() {
    if (currentTrial >= foodItems.length) {
        startPart2();
        return;
    }

    const item = foodItems[currentTrial];
    currentItemId = item.id; // Set current item for keyboard input
    content.innerHTML = `
    <p>Please rate this item</p>
    <img src="${item.image}" class="item-image" alt="${item.name}">
    <div class="rating-buttons">
      ${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<button onclick="rateItem(${item.id}, ${n})">${n}</button>`).join('')}
    </div>
    <div id="reminder"></div>
  `;
    startReminder();
}

function rateItem(id, rating) {
    clearTimeout(reminderTimeoutId);
    ratings[id] = rating; // Store only ID
    currentTrial++;
    showNextRating();
}

// Part 2: Comparisons
function startPart2() {
    document.getElementById('title').innerText = 'Part 2: Food Comparisons';
    currentTrial = 0;
    currentPart = 'part2';
    currentTrials = generateComparisonTrials(); // Generate once and store globally
    console.log("Current trials", currentTrials)
    showNextComparison();
}

function generateComparisonTrials() {
    const usedItems = new Set();
    let hardTrials = [], easyTrials = [], computerTrials = [];
    const maxPairs = Math.floor(foodItems.length / 2); // e.g., 5 for 10 items
    const basePairsPerType = Math.floor(maxPairs / 3); // Base allocation per type
    const minComputerPairs = Math.min(1, maxPairs); // Ensure at least 1 computer pair if possible
    const maxHardEasyPairs = Math.max(0, maxPairs - minComputerPairs); // Leave room for computer trials
    const maxPerType = Math.min(basePairsPerType, Math.floor(maxHardEasyPairs / 2)); // Cap hard and easy
    let pairs = [];

    console.log(`Total items: ${foodItems.length}, Max pairs: ${maxPairs}, Base per type: ${basePairsPerType}, Max hard/easy: ${maxPerType}, Min computer: ${minComputerPairs}`);

    // Hard trials (difference ≤ 2)
    for (let i = 0; i < foodItems.length && usedItems.size < foodItems.length && pairs.length < maxPerType; i++) {
        for (let j = i + 1; j < foodItems.length && usedItems.size < foodItems.length && pairs.length < maxPerType; j++) {
            const id1 = foodItems[i].id, id2 = foodItems[j].id;
            if (usedItems.has(id1) || usedItems.has(id2)) continue;
            const rating1 = ratings[id1];
            const rating2 = ratings[id2];
            const diff = Math.abs(rating1 - rating2);
            if (diff <= 2) {
                pairs.push([foodItems[i], foodItems[j]]);
                usedItems.add(id1);
                usedItems.add(id2);
            }
        }
    }
    hardTrials = shuffle(pairs);
    console.log(`Hard trials: ${hardTrials.length} pairs, Used items: ${usedItems.size}`);

    // Easy trials (difference ≥ 4)
    pairs = [];
    for (let i = 0; i < foodItems.length && usedItems.size < foodItems.length && pairs.length < maxPerType; i++) {
        for (let j = i + 1; j < foodItems.length && usedItems.size < foodItems.length && pairs.length < maxPerType; j++) {
            const id1 = foodItems[i].id, id2 = foodItems[j].id;
            if (usedItems.has(id1) || usedItems.has(id2)) continue;
            const rating1 = ratings[id1];
            const rating2 = ratings[id2];
            const diff = Math.abs(rating1 - rating2);
            if (diff >= 4) {
                pairs.push([foodItems[i], foodItems[j]]);
                usedItems.add(id1);
                usedItems.add(id2);
            }
        }
    }
    easyTrials = shuffle(pairs);
    console.log(`Easy trials: ${easyTrials.length} pairs, Used items: ${usedItems.size}`);

    // Computer trials (random pairs from remaining items)
    pairs = [];
    const remainingItems = foodItems.filter(item => !usedItems.has(item.id));
    const shuffledRemaining = shuffle([...remainingItems]);
    for (let i = 0; i < shuffledRemaining.length - 1; i += 2) {
        pairs.push([shuffledRemaining[i], shuffledRemaining[i + 1]]);
        usedItems.add(shuffledRemaining[i].id);
        usedItems.add(shuffledRemaining[i + 1].id);
    }
    computerTrials = pairs; // Take all remaining pairs, no cap
    console.log(`Computer trials: ${computerTrials.length} pairs, Used items: ${usedItems.size}`);

    const allTrials = [
        ...hardTrials.map(pair => ({ type: 'hard', pair })),
        ...easyTrials.map(pair => ({ type: 'easy', pair })),
        ...computerTrials.map(pair => ({ type: 'computer', pair, highlightLeft: Math.random() > 0.5 }))
    ];
    console.log(`Total trials: ${allTrials.length} pairs`);
    return allTrials;
}

function showNextComparison() {
    if (currentTrial >= currentTrials.length) {
        startPart3();
        return;
    }

    const trial = currentTrials[currentTrial];
    const { type, pair, highlightLeft } = trial;
    const [left, right] = pair;

    const titleText = type === 'computer' ? 'Please choose the item highlighted in red' : 'Please choose one';
    document.getElementById('title').innerText = titleText;

    content.innerHTML = `
    <div class="comparison-container">
      <img src="${left.image}" class="comparison-image ${type === 'computer' && highlightLeft ? 'red-circle' : ''}" 
           onclick="chooseItem(${left.id}, ${right.id}, '${type}', ${highlightLeft || false})" alt="${left.name}">
      <img src="${right.image}" class="comparison-image ${type === 'computer' && !highlightLeft ? 'red-circle' : ''}" 
           onclick="chooseItem(${right.id}, ${left.id}, '${type}', ${highlightLeft || false})" alt="${right.name}">
    </div>
    <div id="reminder"></div>
  `;
    startReminder();
}

function chooseItem(chosenId, rejectedId, type, highlightLeft) {
    clearTimeout(reminderTimeoutId);
    if (type === 'computer') {
        const correctId = highlightLeft ? rejectedId : chosenId;
        computerChosenPairs.push(correctId); // Store only ID
    } else {
        chosenPairs.push(chosenId); // Store only ID
        rejectedPairs.push(rejectedId); // Store only ID
    }
    currentTrial++;
    showNextComparison();
}

// Part 3: Final Ratings
function startPart3() {
    document.getElementById('title').innerText = 'Part 3: Final Ratings';
    currentTrial = 0;
    currentPart = 'part3';
    showNextFinalRating();
}

function showNextFinalRating() {
    if (currentTrial >= foodItems.length) {
        endExperiment();
        return;
    }

    const item = foodItems[currentTrial];
    console.log("Last final items: ", foodItems)
    currentItemId = item.id; // Set current item for keyboard input
    const context = chosenPairs.includes(item.id) ? 'You chose this' :
        rejectedPairs.includes(item.id) ? 'You rejected this' :
            computerChosenPairs.includes(item.id) ? 'The computer chose this' : '';

    content.innerHTML = `
    <p>Please rate this item</p>
    <img src="${item.image}" class="item-image" alt="${item.name}">
    <div class="context-label">${context}</div>
    <div class="rating-buttons">
      ${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<button onclick="rateFinalItem(${item.id}, ${n})">${n}</button>`).join('')}
    </div>
    <div id="reminder"></div>
  `;
    startReminder();
}

function rateFinalItem(id, rating) {
    clearTimeout(reminderTimeoutId);
    finalRatings[id] = rating; // Store only ID
    currentTrial++;
    showNextFinalRating();
}

function startReminder() {
    if (reminderTimeoutId) clearTimeout(reminderTimeoutId);
    reminderTimeoutId = setTimeout(() => {
        const reminderDiv = document.getElementById('reminder');
        if (!reminderDiv.innerText) {
            reminderDiv.innerText = 'Please choose';
            alertSound.play();
            timeoutCount++;
        }
    }, reminderTimeout);
}

// End experiment
function endExperiment() {
    document.getElementById('title').innerText = 'Experiment Complete';
    content.innerHTML = '<p>Thank you for participating!</p>';
    currentPart = 'end';
    document.removeEventListener('keydown', handleKeyPress); // Remove listener
    saveData();
}

// Save data as JSON
function saveData() {
    const ratingDifferences = {};
    for (const id in finalRatings) {
        if (ratings[id] !== undefined) {
            ratingDifferences[id] = finalRatings[id] - ratings[id];
        }
    }

    const data = {
        initialRatings: Object.fromEntries(
            Object.entries(ratings).map(([id, val]) => [`${id}-${foodItems.find(i => i.id === Number(id)).name}`, val])
        ),
        chosenPairs: chosenPairs.map(id => `${id}-${foodItems.find(i => i.id === Number(id)).name}`),
        rejectedPairs: rejectedPairs.map(id => `${id}-${foodItems.find(i => i.id === Number(id)).name}`),
        computerChosenPairs: computerChosenPairs.map(id => `${id}-${foodItems.find(i => i.id === Number(id)).name}`),
        finalRatings: Object.fromEntries(
            Object.entries(finalRatings).map(([id, val]) => [`${id}-${foodItems.find(i => i.id === Number(id)).name}`, val])
        ),
        timeoutCount,
        ratingDifferences: Object.fromEntries(
            Object.entries(ratingDifferences).map(([id, val]) => [`${id}-${foodItems.find(i => i.id === Number(id)).name}`, val])
        )
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'experiment-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
function showItemCountInput() {
    document.getElementById('title').innerText = 'Set Number of Food Items';
    content.innerHTML = `
        <p>Please enter the number of food items (1-${fullFoodItems.length}):</p>
        <input type="number" id="item-count" min="1" max="${fullFoodItems.length}" value="100" />
        <button onclick="setItemCount()">Continue</button>
        <p id="error-message" style="color: red;"></p>
    `;
    currentPart = 'itemCount';
}

function setItemCount() {
    const input = document.getElementById('item-count').value;
    const count = parseInt(input);
    const errorMessage = document.getElementById('error-message');

    if (isNaN(count) || count < 1 || count > fullFoodItems.length) {
        errorMessage.innerText = `Please enter a number between 1 and ${fullFoodItems.length}.`;
        return;
    }

    numItems = count;
    foodItems = shuffle([...fullFoodItems]).slice(0, numItems); // Set foodItems based on user input
    console.log(foodItems)
    console.log(numItems)
    showWelcome(); // Proceed to welcome page
}

// Start the experiment
startExperiment();