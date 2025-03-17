// Define experiment parameters
var reminder_timeout = 3000; // 3 seconds in milliseconds
var reminder_count = 0;
var food_ratings = {};
var chosen_pairs = [];
var rejected_pairs = [];
var computer_chosen_pairs = [];

// Load your alert sound
var alert_sound = new Audio('sounds/alert.mp3');

// Sample food items (replace with your 223 items)
var food_items = [
  {id: 1, name: 'Banana', image: 'img/banana.jpg'},
  {id: 2, name: 'Grapes', image: 'img/grapes.jpg'},
  {id: 3, name: 'Tomato', image: 'img/tomato.jpg'},
  {id: 4, name: 'Chocolate', image: 'img/chocolate.jpg'},
  // Add all your 223 items here
];

// Preload all images
var preload = {
  type: 'preload',
  images: food_items.map(item => item.image),
  audio: ['sounds/alert.mp3']
};

// Welcome screen
var welcome = {
  type: 'html-button-response',
  stimulus: '<h1>Welcome to the Food Rating Study</h1><p>You will rate food items, make choices between them, and rate them again.</p>',
  choices: ['Start']
};

// Function to create Part 1: Initial rating trials
function createInitialRatingTrials() {
  var trials = [];
  
  // Instructions
  trials.push({
    type: 'html-button-response',
    stimulus: '<h2>Part 1: Rating Food Items</h2><p>Please rate each food item on a scale from 1 to 8.</p>',
    choices: ['Begin']
  });
  
  // For each food item
  food_items.forEach(item => {
    trials.push({
      type: 'image-button-response',
      stimulus: item.image,
      prompt: '<p>Please rate this item</p>',
      choices: ['1', '2', '3', '4', '5', '6', '7', '8'],
      button_html: '<button class="jspsych-btn">%choice%</button>',
      trial_duration: null, // No automatic timeout
      on_load: function() {
        // Set up reminder timeout
        setTimeout(function() {
          if (jsPsych.getDisplayElement().querySelector('.reminder') === null) {
            var reminderDiv = document.createElement('div');
            reminderDiv.className = 'reminder';
            reminderDiv.innerHTML = 'Please choose';
            jsPsych.getDisplayElement().querySelector('.jspsych-image-button-response-prompt').appendChild(reminderDiv);
            alert_sound.play();
            reminder_count++;
          }
        }, reminder_timeout);
      },
      on_finish: function(data) {
        // Store the rating
        food_ratings[item.id] = data.response + 1; // +1 because jsPsych indexes from 0
      }
    });
  });
  
  return trials;
}
// Function to create Part 2: Comparison trials
function createComparisonTrials() {
  var trials = [];
  
  // Instructions
  trials.push({
    type: 'html-button-response',
    stimulus: '<h2>Part 2: Food Comparisons</h2><p>You will now be asked to choose between pairs of food items.</p>',
    choices: ['Begin Part 2']
  });
  
  // Create hard comparison trials (items with similar ratings, ≤ 2 difference)
  function createHardTrials() {
    var hardTrials = [];
    var pairs = [];
    
    // Find pairs with similar ratings
    for (var i = 0; i < food_items.length; i++) {
      for (var j = i + 1; j < food_items.length; j++) {
        var id1 = food_items[i].id;
        var id2 = food_items[j].id;
        var rating1 = food_ratings[id1];
        var rating2 = food_ratings[id2];
        
        if (Math.abs(rating1 - rating2) <= 2) {
          pairs.push([food_items[i], food_items[j]]);
        }
      }
    }
    
    // Shuffle and take first 25-30 pairs
    pairs = jsPsych.randomization.shuffle(pairs);
    pairs = pairs.slice(0, 30);
    
    // Create trials for each pair
    pairs.forEach(pair => {
      hardTrials.push({
        type: 'html-keyboard-response',
        stimulus: function() {
          return `
            <h3>Please choose one</h3>
            <div class="comparison-container">
              <img src="${pair[0].image}" class="comparison-image" id="left-img" data-id="${pair[0].id}">
              <img src="${pair[1].image}" class="comparison-image" id="right-img" data-id="${pair[1].id}">
            </div>
          `;
        },
        choices: ['ArrowLeft', 'ArrowRight'],
        prompt: "<p>Press left arrow for left image, right arrow for right image</p>",
        trial_duration: null,
        on_load: function() {
          // Make images clickable
          document.getElementById('left-img').onclick = function() {
            jsPsych.finishTrial({response: 'ArrowLeft'});
          };
          document.getElementById('right-img').onclick = function() {
            jsPsych.finishTrial({response: 'ArrowRight'});
          };
          
          // Set up reminder timeout
          setTimeout(function() {
            if (jsPsych.getDisplayElement().querySelector('.reminder') === null) {
              var reminderDiv = document.createElement('div');
              reminderDiv.className = 'reminder';
              reminderDiv.innerHTML = 'Please choose';
              jsPsych.getDisplayElement().querySelector('.comparison-container').after(reminderDiv);
              alert_sound.play();
              reminder_count++;
            }
          }, reminder_timeout);
        },
        on_finish: function(data) {
          var chosen, rejected;
          if (data.response === 'ArrowLeft') {
            chosen = pair[0].id;
            rejected = pair[1].id;
          } else {
            chosen = pair[1].id;
            rejected = pair[0].id;
          }
          
          chosen_pairs.push(chosen);
          rejected_pairs.push(rejected);
        }
      });
    });
    
    return hardTrials;
  }
  
  // Create easy comparison trials (items with rating difference ≥ 4)
  function createEasyTrials() {
    // Similar to createHardTrials but with ≥4 rating difference
    var easyTrials = [];
    var pairs = [];
    
    for (var i = 0; i < food_items.length; i++) {
      for (var j = i + 1; j < food_items.length; j++) {
        var id1 = food_items[i].id;
        var id2 = food_items[j].id;
        var rating1 = food_ratings[id1];
        var rating2 = food_ratings[id2];
        
        if (Math.abs(rating1 - rating2) >= 4) {
          pairs.push([food_items[i], food_items[j]]);
        }
      }
    }
    
    pairs = jsPsych.randomization.shuffle(pairs);
    pairs = pairs.slice(0, 30);
    
    // Create trials for each pair (same structure as hard trials)
    // [Same code as in createHardTrials - omitted for brevity]
    
    return easyTrials;
  }
  
  // Computer-selected trials
  function createComputerTrials() {
    var computerTrials = [];
    var pairs = [];
    
    // Get random pairs
    for (var i = 0; i < 30; i++) {
      var randomPair = jsPsych.randomization.sampleWithoutReplacement(food_items, 2);
      pairs.push(randomPair);
    }
    
    // Create trials
    pairs.forEach(pair => {
      // Randomly decide which item to highlight
      var highlightLeft = Math.random() > 0.5;
      
      computerTrials.push({
        type: 'html-keyboard-response',
        stimulus: function() {
          return `
            <h3>Please choose the item highlighted in red</h3>
            <div class="comparison-container">
              <img src="${pair[0].image}" class="comparison-image ${highlightLeft ? 'red-circle' : ''}" id="left-img" data-id="${pair[0].id}">
              <img src="${pair[1].image}" class="comparison-image ${!highlightLeft ? 'red-circle' : ''}" id="right-img" data-id="${pair[1].id}">
            </div>
          `;
        },
        choices: ['ArrowLeft', 'ArrowRight'],
        prompt: "<p>Press left arrow for left image, right arrow for right image</p>",
        trial_duration: null,
        on_load: function() {
          // Make images clickable
          document.getElementById('left-img').onclick = function() {
            jsPsych.finishTrial({response: 'ArrowLeft'});
          };
          document.getElementById('right-img').onclick = function() {
            jsPsych.finishTrial({response: 'ArrowRight'});
          };
          
          // Set up reminder timeout
          setTimeout(function() {
            if (jsPsych.getDisplayElement().querySelector('.reminder') === null) {
              var reminderDiv = document.createElement('div');
              reminderDiv.className = 'reminder';
              reminderDiv.innerHTML = 'Please choose';
              jsPsych.getDisplayElement().querySelector('.comparison-container').after(reminderDiv);
              alert_sound.play();
              reminder_count++;
            }
          }, reminder_timeout);
        },
        on_finish: function(data) {
          // Record computer-chosen item
          var chosenId = highlightLeft ? pair[0].id : pair[1].id;
          computer_chosen_pairs.push(chosenId);
        }
      });
    });
    
    return computerTrials;
  }
  
  // Add all comparison trials
  trials = trials.concat(createHardTrials());
  trials = trials.concat(createEasyTrials());
  trials = trials.concat(createComputerTrials());
  
  return trials;
}

// Function to create Part 3: Final rating trials
function createFinalRatingTrials() {
  var trials = [];
  
  // Instructions
  trials.push({
    type: 'html-button-response',
    stimulus: '<h2>Part 3: Final Rating</h2><p>Please rate each food item again. The text will show your previous choices.</p>',
    choices: ['Begin Part 3']
  });
  
  // For each food item
  food_items.forEach(item => {
    // Determine context label
    var contextLabel = '';
    if (chosen_pairs.includes(item.id)) {
      contextLabel = 'You chose this';
    } else if (rejected_pairs.includes(item.id)) {
      contextLabel = 'You rejected this';
    } else if (computer_chosen_pairs.includes(item.id)) {
      contextLabel = 'The computer chose this';
    }
    
    trials.push({
      type: 'image-button-response',
      stimulus: item.image,
      prompt: `<p>Please rate this item</p><div class="context-label">${contextLabel}</div>`,
      choices: ['1', '2', '3', '4', '5', '6', '7', '8'],
      button_html: '<button class="jspsych-btn">%choice%</button>',
      trial_duration: null,
      on_load: function() {
        // Set up reminder timeout
        setTimeout(function() {
          if (jsPsych.getDisplayElement().querySelector('.reminder') === null) {
            var reminderDiv = document.createElement('div');
            reminderDiv.className = 'reminder';
            reminderDiv.innerHTML = 'Please choose';
            jsPsych.getDisplayElement().querySelector('.jspsych-image-button-response-prompt').appendChild(reminderDiv);
            alert_sound.play();
            reminder_count++;
          }
        }, reminder_timeout);
      },
      on_finish: function(data) {
        // Store the final rating
        var finalRatings = food_ratings.final || {};
        finalRatings[item.id] = data.response + 1; // +1 because jsPsych indexes from 0
        food_ratings.final = finalRatings;
      }
    });
  });
  
  return trials;
}
// Main experiment timeline
var timeline = [
  preload,
  welcome
];
// Add all parts
timeline = timeline.concat(createInitialRatingTrials());
timeline = timeline.concat(createComparisonTrials());
timeline = timeline.concat(createFinalRatingTrials());

// Initialize the experiment
jsPsych.init({
  timeline: timeline,
  display_element: 'jspsych-target',
  on_finish: function() {
    // Display completion message and save data
    document.getElementById('jspsych-target').innerHTML = '<h2>Thank you for participating!</h2>';
    
    // This would normally save to a server but for now just shows data in console
    console.log('Total reminders needed:', reminder_count);
    console.log('Food ratings:', food_ratings);
    console.log('Chosen pairs:', chosen_pairs);
    console.log('Rejected pairs:', rejected_pairs);
    console.log('Computer chosen pairs:', computer_chosen_pairs);
  }
});