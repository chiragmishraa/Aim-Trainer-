const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const timerDisplay = document.getElementById('timer');
const scoreDisplay = document.getElementById('score');
const gameArea = document.getElementById('game-area');
const endScreen = document.getElementById('end-screen');
const finalScore = document.getElementById('final-score');
const avgReaction = document.getElementById('avg-reaction');
const restartBtn = document.getElementById('restart-btn');
const scoreCheckBtn = document.getElementById('score-check-btn');
const stopBtn = document.getElementById('stop-btn');
const scoreHistoryContainer = document.getElementById('score-history-container');
const closeHistoryBtn = document.getElementById('close-history-btn');
const startBtn = document.getElementById('start-btn');
const clearHistoryBtn = document.getElementById('clear-history-btn');

let timeLeft = 30;
let timerId;
let score = 0;
let reactionTimes = [];
let lastClickTime = null;
let gameRunning = false;
let speed = 'mid'; // default speed
let speedSettings = {
  low: { min: 900, max: 1300 },
  mid: { min: 600, max: 900 },
  high: { min: 350, max: 600 }
};

const speedLowBtn = document.getElementById('speed-low-btn');
const speedMidBtn = document.getElementById('speed-mid-btn');
const speedHighBtn = document.getElementById('speed-high-btn');

// Sound effect for scoring
const scoreAudio = new Audio('https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/acoustic_grand_piano-mp3/A4.mp3');
scoreAudio.volume = 0.4;

// Theme toggle functionality
themeToggle.addEventListener('click', () => {
  body.classList.toggle('light-mode');
  themeToggle.textContent = body.classList.contains('light-mode') ? '☼' : '⏾';
});

startBtn.addEventListener('click', () => {
  startGame();
  startBtn.disabled = true;
  stopBtn.disabled = false;
  // Disable speed and score check buttons while game is running
  speedLowBtn.disabled = true;
  speedMidBtn.disabled = true;
  speedHighBtn.disabled = true;
  scoreCheckBtn.disabled = true;
});

speedLowBtn.addEventListener('click', () => {
  speed = 'low';
  speedLowBtn.classList.add('active');
  speedMidBtn.classList.remove('active');
  speedHighBtn.classList.remove('active');
});
speedMidBtn.addEventListener('click', () => {
  speed = 'mid';
  speedLowBtn.classList.remove('active');
  speedMidBtn.classList.add('active');
  speedHighBtn.classList.remove('active');
});
speedHighBtn.addEventListener('click', () => {
  speed = 'high';
  speedLowBtn.classList.remove('active');
  speedMidBtn.classList.remove('active');
  speedHighBtn.classList.add('active');
});

function startGame() {
  timeLeft = 30;
  score = 0;
  reactionTimes = [];
  scoreDisplay.textContent = score;
  timerDisplay.textContent = timeLeft;
  endScreen.style.display = 'none';
  gameRunning = true;

  spawnTarget();
  lastClickTime = Date.now();

  timerId = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timerId);
      endGame();
    }
  }, 1000);
  stopBtn.disabled = false;
}

function spawnTarget() {
  const target = document.createElement('div');
  target.classList.add('target');

  const areaWidth = gameArea.clientWidth - 42; // 32px target + 10px margin
  const areaHeight = gameArea.clientHeight - 42;

  const x = Math.random() * areaWidth;
  const y = Math.random() * areaHeight;

  target.style.left = `${x}px`;
  target.style.top = `${y}px`;

  // Use speed setting for disappear time
  const setting = speedSettings[speed];
  const disappearTime = Math.floor(Math.random() * (setting.max - setting.min)) + setting.min;
  const disappearTimeout = setTimeout(() => {
    if (gameArea.contains(target)) {
      target.remove();
      spawnTarget();
    }
  }, disappearTime);

  target.addEventListener('click', () => {
    clearTimeout(disappearTimeout);
    const currentTime = Date.now();
    const reaction = currentTime - lastClickTime;
    reactionTimes.push(reaction);
    lastClickTime = currentTime;

    score++;
    scoreDisplay.textContent = score;
    // Play sound effect
    scoreAudio.currentTime = 0;
    scoreAudio.play();

    target.remove();
    spawnTarget();
  });

  gameArea.appendChild(target);
}

function endGame() {
  gameRunning = false;
  gameArea.innerHTML = '';

  // Calculate average reaction time
  let avg = 0;
  if (reactionTimes.length > 0) {
    const total = reactionTimes.reduce((a, b) => a + b, 0);
    avg = Math.round(total / reactionTimes.length);
  }

  finalScore.textContent = score;
  avgReaction.textContent = avg;

  // Save score and avg reaction to history
  saveScore(score, avg, speed);

  endScreen.style.display = 'block';
  stopBtn.disabled = true;
  startBtn.disabled = false;
  // Enable speed and score check buttons after game ends
  speedLowBtn.disabled = false;
  speedMidBtn.disabled = false;
  speedHighBtn.disabled = false;
  scoreCheckBtn.disabled = false;
}

function saveScore(newScore, avgReaction, speedSetting) {
  let history = JSON.parse(localStorage.getItem('scoreHistory') || '[]');
  history.push({ score: newScore, avg: avgReaction, speed: speedSetting, date: new Date().toLocaleString() });
  localStorage.setItem('scoreHistory', JSON.stringify(history));
  // Update highest score if needed
  let high = parseInt(localStorage.getItem('highestScore'), 10);
  if (isNaN(high) || newScore > high) {
    localStorage.setItem('highestScore', newScore);
  }
  // Update best avg reaction if needed
  let bestAvg = parseInt(localStorage.getItem('bestAvgReaction'), 10);
  if ((bestAvg === 0 && avgReaction > 0) || (avgReaction > 0 && (isNaN(bestAvg) || avgReaction < bestAvg))) {
    localStorage.setItem('bestAvgReaction', avgReaction);
  }
}

function showScoreHistory() {
  let history = JSON.parse(localStorage.getItem('scoreHistory') || '[]');
  let high = parseInt(localStorage.getItem('highestScore'), 10);
  let bestAvg = parseInt(localStorage.getItem('bestAvgReaction'), 10);
  let highDisplay = (isNaN(high) || high <= 0) ? '-' : high;
  let bestAvgDisplay = (isNaN(bestAvg) || bestAvg <= 0) ? '-' : bestAvg + ' ms';
  // Find the speed for the highest score
  let highSpeed = '-';
  if (!isNaN(high) && high > 0 && history.length > 0) {
    // Find the most recent entry with the highest score
    const highEntry = history.filter(item => item.score === high).slice(-1)[0];
    if (highEntry && highEntry.speed) {
      highSpeed = highEntry.speed;
    }
  }
  let html = `<h3>Score History</h3><ul style="max-height:180px;overflow:auto;">`;
  if (history.length === 0) {
    html += '<li>No scores yet.</li>';
  } else {
    history.slice(-20).reverse().forEach(item => {
      html += `<li><span class='score'>Score: <b>${item.score}</b></span> | <span class='avg'>Avg: <b>${item.avg}</b> ms</span> | <span class='speed'>Speed: <b>${item.speed || 'mid'}</b></span> <span class='date'>(${item.date})</span></li>`;
    });
  }
  html += `</ul><div class='summary'>
    <div class='summary-row'><span class='summary-label'>Highest Score:</span> <span class='summary-value'>${highDisplay}</span></div>
    <div class='summary-row'><span class='summary-label'>Speed:</span> <span class='summary-value speed'>${highSpeed}</span></div>
    <div class='summary-row'><span class='summary-label'>Best Avg Reaction:</span> <span class='summary-value best'>${bestAvgDisplay}</span></div>
  </div>`;
  scoreHistoryContainer.querySelector('.score-history-content').innerHTML = html;
  scoreHistoryContainer.style.display = 'flex';
}

scoreCheckBtn.addEventListener('click', showScoreHistory);
closeHistoryBtn.addEventListener('click', () => {
  scoreHistoryContainer.style.display = 'none';
});

stopBtn.addEventListener('click', () => {
  if (gameRunning) {
    clearInterval(timerId);
    endGame();
  }
  // Enable speed and score check buttons after stop
  speedLowBtn.disabled = false;
  speedMidBtn.disabled = false;
  speedHighBtn.disabled = false;
  scoreCheckBtn.disabled = false;
});

restartBtn.addEventListener('click', () => {
  startGame();
  // Disable speed and score check buttons while game is running
  speedLowBtn.disabled = true;
  speedMidBtn.disabled = true;
  speedHighBtn.disabled = true;
  scoreCheckBtn.disabled = true;
});

clearHistoryBtn.addEventListener('click', () => {
  localStorage.removeItem('scoreHistory');
  localStorage.removeItem('highestScore');
  localStorage.removeItem('bestAvgReaction');
  showScoreHistory();
});
