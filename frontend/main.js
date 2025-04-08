// main.js
let foodItems = [];
const reminderTimeout = 5000;
let currentTrial = 0;
let ratings = {};
let chosenPairs = [];
let rejectedPairs = [];
let computerChosenPairs = [];
let finalRatings = {};
let timeoutCount = 0;
let reminderTimeoutId;
let currentTrials = [];
let currentPart = null;
let currentItemId = null;
let numItems = null;

const alertSound = document.getElementById('alert-sound');
const container = document.getElementById('experiment-container');
const content = document.getElementById('content');

function startExperiment() {
    currentTrial = 0;
    timeoutCount = 0;
    ratings = {};
    chosenPairs = [];
    rejectedPairs = [];
    computerChosenPairs = [];
    finalRatings = {};
    foodItems = [];
    currentPart = null;
    currentItemId = null;
    numItems = null;
    showItemCountInput();
    document.addEventListener('keydown', handleKeyPress);
}

function showItemCountInput() {
    document.getElementById('title').innerText = 'Set Number of Food Items';
    content.innerHTML = `
        <p class="text-gray-700 mb-4">Please enter the number of food items (1-${fullFoodItems.length}, min 50 recommended):</p>
        <input type="number" id="item-count" min="50" max="${fullFoodItems.length}" value="50" 
               class="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" />
        <button onclick="setItemCount()" 
                class="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition duration-200">
            Continue
        </button>
        <p id="error-message" class="text-red-500 mt-2"></p>
    `;
    currentPart = 'itemCount';
}

function setItemCount() {
    const input = document.getElementById('item-count').value;
    const count = parseInt(input);
    // const errorMessage = document.getElementById('error-message');

    // if (isNaN(count) || count < 50 || count > fullFoodItems.length) {
    //     errorMessage.innerText = `Please enter a number between 50 and ${fullFoodItems.length}.`;
    //     return;
    // }

    numItems = count;
    foodItems = shuffle([...fullFoodItems]).slice(0, numItems);
    showWelcome();
}

function showWelcome() {
    document.getElementById('title').innerText = 'Welcome to the Food Rating Test';
    content.innerHTML = `
        <p class="text-gray-700 mb-4">You will rate ${numItems} food items, make choices between them, and rate them again.</p>
        <button onclick="startPart1()" 
                class="w-full bg-green-500 text-white p-2 rounded-md hover:bg-green-600 transition duration-200">
            Start
        </button>
    `;
    currentPart = 'welcome';
}

function startPart1() {
    document.getElementById('title').innerText = 'Part 1: Rating Food Items (Press 1-8)';
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
    currentItemId = item.id;
    content.innerHTML = `
        <p class="text-grey-600 text-xl text-center">Please rate this item (Press 1-8)</p>
        <img src="${item.image}" class="item-image mx-auto block mb-4" alt="${item.name}">
        <div class="rating-buttons flex justify-center gap-2 flex-wrap">
            ${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `
                <button onclick="rateItem(${item.id}, ${n})" 
                        class="rating-button bg-blue-500 text-white w-10 h-10 rounded-full hover:bg-blue-600 transition duration-200">
                    ${n}
                </button>
            `).join('')}
        </div>
        <div id="reminder" class="text-red-600 text-3xl font-bold text-center"></div>
    `;
    startReminder();
}

function rateItem(id, rating) {
    clearTimeout(reminderTimeoutId);
    ratings[id] = rating;
    currentTrial++;
    showNextRating();
}

function startPart2() {
    document.getElementById('title').innerText = 'Part 2: Food Comparisons';
    currentTrial = 0;
    currentPart = 'part2';
    currentTrials = generateComparisonTrials();
    showNextComparison();
}

function generateComparisonTrials() {
    const usedItems = new Set();
    let hardTrials = [], easyTrials = [], computerTrials = [];
    const maxPairs = Math.floor(foodItems.length / 2);
    const basePairsPerType = Math.floor(maxPairs / 3);
    const minComputerPairs = Math.min(1, maxPairs);
    const maxHardEasyPairs = Math.max(0, maxPairs - minComputerPairs);
    const maxPerType = Math.min(basePairsPerType, Math.floor(maxHardEasyPairs / 2));
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
    computerTrials = pairs;
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
        <div class="comparison-container flex justify-center gap-4">
            <img src="${left.image}" class="comparison-image ${type === 'computer' && highlightLeft ? 'red-circle' : ''}" 
                 onclick="chooseItem(${left.id}, ${right.id}, '${type}', ${highlightLeft || false})" alt="${left.name}">
            <img src="${right.image}" class="comparison-image ${type === 'computer' && !highlightLeft ? 'red-circle' : ''}" 
                 onclick="chooseItem(${right.id}, ${left.id}, '${type}', ${highlightLeft || false})" alt="${right.name}">
        </div>
        <div id="reminder" class="text-red-600 text-3xl font-bold text-center"></div>
    `;
    startReminder();
}

function chooseItem(chosenId, rejectedId, type, highlightLeft) {
    clearTimeout(reminderTimeoutId);
    if (type === 'computer') {
        const correctId = highlightLeft ? rejectedId : chosenId;
        computerChosenPairs.push(correctId);
    } else {
        chosenPairs.push(chosenId);
        rejectedPairs.push(rejectedId);
    }
    currentTrial++;
    showNextComparison();
}

function startPart3() {
    document.getElementById('title').innerText = 'Part 3: Final Ratings (Press 1-8)';
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
    currentItemId = item.id;
    const context = chosenPairs.includes(item.id) ? 'You chose this' :
        rejectedPairs.includes(item.id) ? 'You rejected this' :
            computerChosenPairs.includes(item.id) ? 'The computer chose this' : '';

    content.innerHTML = `
        <p class="text-gray-700 mb-4">Please rate this item (Press 1-8)</p>
        <img src="${item.image}" class="item-image mx-auto block mb-4" alt="${item.name}">
        <div class="context-label text-gray-500 mb-2 text-center">${context}</div>
        <div class="rating-buttons flex justify-center gap-2 flex-wrap">
            ${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `
                <button onclick="rateFinalItem(${item.id}, ${n})" 
                        class="rating-button bg-blue-500 text-white w-10 h-10 rounded-full hover:bg-blue-600 transition duration-200">
                    ${n}
                </button>
            `).join('')}
        </div>
        <div id="reminder" class="text-red-600 text-3xl font-bold text-center"></div>
    `;
    startReminder();
}

function rateFinalItem(id, rating) {
    clearTimeout(reminderTimeoutId);
    finalRatings[id] = rating;
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

function endExperiment() {
    document.getElementById('title').innerText = 'Experiment Complete';
    content.innerHTML = `
        <p class="text-gray-700 mb-4">Thank you for participating!</p>
    `;
    currentPart = 'end';
    document.removeEventListener('keydown', handleKeyPress);
    saveData();
}

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
        ),
        timestamp: new Date().toISOString()
    };

    fetch('http://ec2-44-220-132-210.compute-1.amazonaws.com:3000/save-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.error) {
            throw new Error(result.error);
        }
        console.log('Data saved:', result.message);
        alert('Data saved successfully!');
    })
    .catch(err => {
        console.error('Error saving data:', err);
        alert('Failed to save data.');
    });
}


startExperiment();