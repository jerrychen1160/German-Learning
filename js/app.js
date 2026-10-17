let selectedLesson = "all";
let vocabList = [...rawVocabulary];
let selectedVerbLevel = "all";
let verbList = [...allVerbsMaster];
let ndeklList = [...rawNDeklExercises];

let currentIndex = 0;
let currentVerbIndex = 0;
let currentNDeklIndex = 0;
let currentActiveInput = null;
let selectedPlural = null;
let isQuizAnswered = false;
let isVerbAnswered = false;
let isNDeklAnswered = false;
let isChineseFront = false;

// DOM 元素引用
const modeSelect = document.getElementById('modeSelect');
const lessonFilterBar = document.getElementById('lessonFilterBar');
const lessonFilterBtns = lessonFilterBar.querySelectorAll('.filter-btn');
const verbFilterBar = document.getElementById('verbFilterBar');
const verbFilterBtns = verbFilterBar.querySelectorAll('.filter-btn');

const cardSection = document.getElementById('cardSection');
const quizSection = document.getElementById('quizSection');
const verbSection = document.getElementById('verbSection');
const ndeklSection = document.getElementById('ndeklSection');
const progressBar = document.getElementById('progressBar');
const statusText = document.getElementById('status');

// 單字卡元素
const card = document.getElementById('card');
const cardContainer = document.getElementById('cardContainer');
const frontWord = document.getElementById('frontWord');
const backMeaning = document.getElementById('backMeaning');
const frontHint = document.getElementById('frontHint');
const backHint = document.getElementById('backHint');
const pageTag = document.getElementById('pageTag');
const audioBtnFront = document.getElementById('audioBtnFront');
const audioBtnBack = document.getElementById('audioBtnBack');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const flipModeToggleBtn = document.getElementById('flipModeToggleBtn');

// 單字測驗元素
const quizPageTag = document.getElementById('quizPageTag');
const quizPrompt = document.getElementById('quizPrompt');
const quizInput = document.getElementById('quizInput');
const pluralSection = document.getElementById('pluralSection');
const pluralOptions = document.getElementById('pluralOptions');
const resultBox = document.getElementById('resultBox');
const submitBtn = document.getElementById('submitBtn');
const nextQuizBtn = document.getElementById('nextQuizBtn');
const quizAudioBtn = document.getElementById('quizAudioBtn');

// 動詞測驗元素
const verbPageTag = document.getElementById('verbPageTag');
const verbInfinitive = document.getElementById('verbInfinitive');
const verbMeaning = document.getElementById('verbMeaning');
const inputPraesens = document.getElementById('inputPraesens');
const inputPraeteritum = document.getElementById('inputPraeteritum');
const inputPerfekt = document.getElementById('inputPerfekt');
const verbResultBox = document.getElementById('verbResultBox');
const submitVerbBtn = document.getElementById('submitVerbBtn');
const nextVerbBtn = document.getElementById('nextVerbBtn');
const verbAudioBtn = document.getElementById('verbAudioBtn');

// 弱變化測驗元素
const ndeklSentence = document.getElementById('ndeklSentence');
const ndeklInput = document.getElementById('ndeklInput');
const ndeklResultBox = document.getElementById('ndeklResultBox');
const submitNdeklBtn = document.getElementById('submitNdeklBtn');
const nextNdeklBtn = document.getElementById('nextNdeklBtn');
const ndeklAudioBtn = document.getElementById('ndeklAudioBtn');

// 語音合成支援
let germanVoice = null;
function loadGermanVoice() {
  if (!('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    germanVoice = voices.find(v => v.lang.startsWith('de') && v.name.toLowerCase().includes('anna'))
               || voices.find(v => v.lang.startsWith('de') || v.lang.includes('DE'))
               || null;
  }
}
if ('speechSynthesis' in window) {
  loadGermanVoice();
  window.speechSynthesis.onvoiceschanged = loadGermanVoice;
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  if (!germanVoice) loadGermanVoice();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'de-DE';
  utterance.rate = 0.85;
  if (germanVoice) utterance.voice = germanVoice;
  window.speechSynthesis.speak(utterance);
}

// 單字篩選處理 (全部 / L1 / L2)
function updateVocabListByLesson() {
  if (selectedLesson === 'all') {
    vocabList = [...rawVocabulary];
  } else {
    vocabList = rawVocabulary.filter(item => item.lesson === selectedLesson);
  }
  vocabList.sort(() => 0.5 - Math.random());
  currentIndex = 0;
}

lessonFilterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    lessonFilterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedLesson = btn.getAttribute('data-lesson');
    updateVocabListByLesson();
    updateDisplay();
  });
});

// 模式切換邏輯
function switchMode(mode) {
  const isVocabMode = (mode === 'card' || mode === 'quiz');
  cardSection.classList.toggle('hidden', mode !== 'card');
  quizSection.classList.toggle('hidden', mode !== 'quiz');
  verbSection.classList.toggle('hidden', mode !== 'verb');
  ndeklSection.classList.toggle('hidden', mode !== 'ndekl');

  lessonFilterBar.classList.toggle('hidden', !isVocabMode);
  verbFilterBar.classList.toggle('hidden', mode !== 'verb');

  if (mode === 'verb') {
    updateVerbListByLevel();
    updateVerbDisplay();
    inputPraesens.focus();
  } else if (mode === 'ndekl') {
    updateNDeklDisplay();
    ndeklInput.focus();
  } else {
    updateDisplay();
    if (mode === 'quiz') quizInput.focus();
  }
}

modeSelect.addEventListener('change', (e) => switchMode(e.target.value));

// 動詞篩選邏輯
verbFilterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    verbFilterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedVerbLevel = btn.getAttribute('data-level');
    updateVerbListByLevel();
    updateVerbDisplay();
    inputPraesens.focus();
  });
});

function updateVerbListByLevel() {
  if (selectedVerbLevel === 'all') {
    verbList = [...allVerbsMaster];
  } else {
    verbList = allVerbsMaster.filter(v => v.level === selectedVerbLevel);
  }
  verbList.sort(() => 0.5 - Math.random());
  currentVerbIndex = 0;
}

flipModeToggleBtn.addEventListener('click', () => {
  isChineseFront = !isChineseFront;
  flipModeToggleBtn.textContent = isChineseFront ? "⇄ 正反翻轉：中文正面" : "⇄ 正反翻轉：德文正面";
  updateDisplay();
});

// 畫面更新：單字與測驗
function updateDisplay() {
  if (vocabList.length === 0) {
    statusText.textContent = "目前範圍無單字";
    return;
  }

  const item = vocabList[currentIndex];
  statusText.textContent = `第 ${currentIndex + 1} / ${vocabList.length} 個單字`;
  progressBar.style.width = `${((currentIndex + 1) / vocabList.length) * 100}%`;

  card.classList.remove('flipped');
  setTimeout(() => {
    if (!isChineseFront) {
      frontWord.textContent = item.de;
      backMeaning.textContent = item.zh;
      frontHint.textContent = "點擊翻面看中文";
      backHint.textContent = "點擊翻回德文";
      audioBtnFront.style.display = "flex";
      audioBtnBack.style.display = "none";
    } else {
      frontWord.textContent = item.zh;
      backMeaning.textContent = item.de;
      frontHint.textContent = "點擊翻面看德文";
      backHint.textContent = "點擊翻回中文";
      audioBtnFront.style.display = "none";
      audioBtnBack.style.display = "flex";
    }
    pageTag.textContent = item.page;
  }, 100);

  quizPageTag.textContent = item.page;
  quizPrompt.textContent = item.zh;
  quizInput.value = '';
  quizInput.placeholder = item.isNoun ? "請輸入完整德文（需包含冠詞）..." : "請輸入德文單字...";
  resultBox.className = 'result-box';
  resultBox.innerHTML = '';
  submitBtn.style.display = 'block';
  nextQuizBtn.style.display = 'none';
  quizAudioBtn.style.display = 'none';
  isQuizAnswered = false;
  selectedPlural = null;

  if (item.isNoun && item.plural) {
    pluralSection.style.display = 'block';
    pluralOptions.innerHTML = '';
    const options = [item.plural];
    const distractors = commonPluralPool.filter(p => p !== item.plural).sort(() => 0.5 - Math.random());
    while (options.length < 4 && distractors.length > 0) options.push(distractors.pop());
    options.sort(() => 0.5 - Math.random());

    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'plural-btn';
      btn.textContent = opt === "(Sg.)" ? "僅單數 (Sg.)" : (opt === "(Pl.)" ? "僅複數 (Pl.)" : opt);
      btn.onclick = () => {
        if (isQuizAnswered) return;
        document.querySelectorAll('.plural-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedPlural = opt;
      };
      pluralOptions.appendChild(btn);
    });
  } else {
    pluralSection.style.display = 'none';
  }
}

// 畫面更新：動詞
function updateVerbDisplay() {
  const verb = verbList[currentVerbIndex];
  const tagText = verb.level === 'B1' ? "動詞 B1 (p.11-13)" : (verb.level === 'A1-2' ? "動詞 A1-A2 (p.1-10)" : "動詞測驗");
  verbPageTag.textContent = tagText;
  statusText.textContent = `動詞測驗：第 ${currentVerbIndex + 1} / ${verbList.length} 題`;
  progressBar.style.width = `${((currentVerbIndex + 1) / verbList.length) * 100}%`;

  verbInfinitive.textContent = verb.inf;
  verbMeaning.textContent = verb.zh;
  inputPraesens.value = '';
  inputPraeteritum.value = '';
  inputPerfekt.value = '';
  verbResultBox.className = 'result-box';
  verbResultBox.innerHTML = '';
  submitVerbBtn.style.display = 'block';
  nextVerbBtn.style.display = 'none';
  verbAudioBtn.style.display = 'none';
  isVerbAnswered = false;
}

// 畫面更新：弱變化
function updateNDeklDisplay() {
  const q = ndeklList[currentNDeklIndex];
  statusText.textContent = `弱變化測驗：第 ${currentNDeklIndex + 1} / ${ndeklList.length} 題`;
  progressBar.style.width = `${((currentNDeklIndex + 1) / ndeklList.length) * 100}%`;

  ndeklSentence.textContent = q.sentence;
  ndeklInput.value = '';
  ndeklResultBox.className = 'result-box';
  ndeklResultBox.innerHTML = '';
  submitNdeklBtn.style.display = 'block';
  nextNdeklBtn.style.display = 'none';
  ndeklAudioBtn.style.display = 'none';
  isNDeklAnswered = false;
}

// 輸入盤與焦點管理
[quizInput, inputPraesens, inputPraeteritum, inputPerfekt, ndeklInput].forEach(input => {
  input.addEventListener('focus', () => { currentActiveInput = input; });
});

document.querySelectorAll('.char-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const char = btn.getAttribute('data-char');
    const target = currentActiveInput || quizInput;
    target.value += char;
    target.focus();
  });
});

cardContainer.addEventListener('click', (e) => {
  if (!e.target.closest('.btn-audio')) {
    card.classList.toggle('flipped');
  }
});

function triggerAudio(e) {
  e.stopPropagation();
  speak(vocabList[currentIndex].clean);
}
audioBtnFront.addEventListener('click', triggerAudio);
audioBtnBack.addEventListener('click', triggerAudio);
quizAudioBtn.addEventListener('click', () => speak(vocabList[currentIndex].clean));

verbAudioBtn.addEventListener('click', () => {
  const v = verbList[currentVerbIndex];
  speak(`${v.inf}. ${v.praesens[0]}. ${v.praet}. ${v.perfekt[0]}`);
});
ndeklAudioBtn.addEventListener('click', () => {
  const q = ndeklList[currentNDeklIndex];
  speak(q.accepted[0]);
});

prevBtn.addEventListener('click', () => {
  currentIndex = (currentIndex - 1 + vocabList.length) % vocabList.length;
  updateDisplay();
});
nextBtn.addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % vocabList.length;
  updateDisplay();
});
shuffleBtn.addEventListener('click', () => {
  vocabList.sort(() => 0.5 - Math.random());
  currentIndex = 0;
  updateDisplay();
});

// 單字測驗判定
submitBtn.addEventListener('click', () => {
  if (isQuizAnswered) return;
  const item = vocabList[currentIndex];
  const userInput = quizInput.value.trim().toLowerCase();
  let isSpellingCorrect = false;
  let missingArticle = false;

  if (item.isNoun) {
    const hasArticle = /^(der|die|das)\s+/.test(userInput);
    const singularOnly = item.singular.toLowerCase();
    if (!hasArticle && userInput === singularOnly) {
      missingArticle = true;
      isSpellingCorrect = false;
    } else {
      if (item.article === "der/die") {
        isSpellingCorrect = (userInput === `der ${singularOnly}` || userInput === `die ${singularOnly}`);
      } else {
        isSpellingCorrect = (userInput === `${item.article} ${singularOnly}`);
      }
    }
  } else {
    isSpellingCorrect = (userInput === item.clean.toLowerCase());
  }

  let isPluralCorrect = true;
  if (item.isNoun && item.plural) isPluralCorrect = (selectedPlural === item.plural);

  if (isSpellingCorrect && isPluralCorrect) {
    resultBox.className = 'result-box correct';
    resultBox.innerHTML = `🎉 <strong>完全正確！</strong><br>正確解答：${item.de}`;
  } else {
    resultBox.className = 'result-box incorrect';
    let errorMsg = `❌ <strong>需要加強！</strong><br>`;
    if (missingArticle) errorMsg += `⚠️ <strong>冠詞漏寫了！</strong>名詞必須填寫冠詞。<br>`;
    else if (!isSpellingCorrect) errorMsg += `⚠️ <strong>單字拼寫有誤。</strong>你的回答：${quizInput.value || '(未填寫)'}<br>`;
    if (item.isNoun && item.plural && !isPluralCorrect) errorMsg += `⚠️ <strong>複數選錯了！</strong>你選了「${selectedPlural || '未選擇'}」，正確複數為「${item.plural}」。<br>`;
    errorMsg += `標準解答：<strong>${item.de}</strong>`;
    resultBox.innerHTML = errorMsg;
  }

  speak(item.clean);
  quizAudioBtn.style.display = 'flex';
  submitBtn.style.display = 'none';
  nextQuizBtn.style.display = 'block';
  isQuizAnswered = true;
});

nextQuizBtn.addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % vocabList.length;
  updateDisplay();
  quizInput.focus();
});

quizInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (!isQuizAnswered) submitBtn.click();
    else nextQuizBtn.click();
  }
});

// 動詞測驗判定
function checkVerbAnswer() {
  if (isVerbAnswered) return;
  const v = verbList[currentVerbIndex];
  const p1 = inputPraesens.value.trim().toLowerCase();
  const p2 = inputPraeteritum.value.trim().toLowerCase();
  const p3 = inputPerfekt.value.trim().toLowerCase();

  const okPraesens = v.praesens.some(ans => p1 === ans.toLowerCase() || p1 === ans.replace(/^er\s+/, '').toLowerCase());
  const okPraeteritum = (p2 === v.praet.toLowerCase());
  const okPerfekt = v.perfekt.some(ans => {
    const full = ans.toLowerCase();
    const partizipOnly = full.replace(/^(hat|ist)\s+/, '');
    return p3 === full || p3 === partizipOnly;
  });

  const allCorrect = okPraesens && okPraeteritum && okPerfekt;

  if (allCorrect) {
    verbResultBox.className = 'result-box correct';
    verbResultBox.innerHTML = `🎉 <strong>三態變化全部正確！</strong><br>
    • 現在式：<strong>${v.praesens[0]}</strong><br>
    • 過去式：<strong>${v.praet}</strong><br>
    • 完成式：<strong>${v.perfekt[0]}</strong>`;
  } else {
    verbResultBox.className = 'result-box incorrect';
    let detail = `❌ <strong>有些型態需要修正：</strong><br>`;
    detail += `• 現在式：${okPraesens ? '✅' : '❌'} 正確為 <strong>${v.praesens[0]}</strong><br>`;
    detail += `• 過去式：${okPraeteritum ? '✅' : '❌'} 正確為 <strong>${v.praet}</strong><br>`;
    detail += `• 完成式：${okPerfekt ? '✅' : '❌'} 正確為 <strong>${v.perfekt[0]}</strong>`;
    verbResultBox.innerHTML = detail;
  }

  speak(`${v.inf}, ${v.praesens[0]}, ${v.praet}, ${v.perfekt[0]}`);
  verbAudioBtn.style.display = 'flex';
  submitVerbBtn.style.display = 'none';
  nextVerbBtn.style.display = 'block';
  isVerbAnswered = true;
}

submitVerbBtn.addEventListener('click', checkVerbAnswer);
[inputPraesens, inputPraeteritum, inputPerfekt].forEach(inp => {
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (!isVerbAnswered) checkVerbAnswer();
      else nextVerbBtn.click();
    }
  });
});

nextVerbBtn.addEventListener('click', () => {
  currentVerbIndex = (currentVerbIndex + 1) % verbList.length;
  updateVerbDisplay();
  inputPraesens.focus();
});

// 弱變化測驗判定
function checkNDeklAnswer() {
  if (isNDeklAnswered) return;
  const q = ndeklList[currentNDeklIndex];
  const userVal = ndeklInput.value.trim().toLowerCase();
  const isCorrect = q.accepted.some(ans => ans.toLowerCase() === userVal);

  if (isCorrect) {
    ndeklResultBox.className = 'result-box correct';
    ndeklResultBox.innerHTML = `🎉 <strong>回答正確！</strong><br>
    標準解答：<strong>${q.accepted[0]}</strong><br>
    📝 <strong>中文翻譯：</strong>${q.translation}<br>
    💡 <strong>文法解析：</strong>${q.explanation}`;
  } else {
    ndeklResultBox.className = 'result-box incorrect';
    ndeklResultBox.innerHTML = `❌ <strong>答案有誤！</strong><br>
    你的回答：${ndeklInput.value || '(未填寫)'}<br>
    標準解答：<strong>${q.accepted[0]}</strong><br>
    📝 <strong>中文翻譯：</strong>${q.translation}<br>
    💡 <strong>文法解析：</strong>${q.explanation}`;
  }

  speak(q.accepted[0]);
  ndeklAudioBtn.style.display = 'flex';
  submitNdeklBtn.style.display = 'none';
  nextNdeklBtn.style.display = 'block';
  isNDeklAnswered = true;
}

submitNdeklBtn.addEventListener('click', checkNDeklAnswer);
ndeklInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (!isNDeklAnswered) checkNDeklAnswer();
    else nextNdeklBtn.click();
  }
});

nextNdeklBtn.addEventListener('click', () => {
  currentNDeklIndex = (currentNDeklIndex + 1) % ndeklList.length;
  updateNDeklDisplay();
  ndeklInput.focus();
});

// 初始化
updateVocabListByLesson();
updateVerbListByLevel();
ndeklList.sort(() => 0.5 - Math.random());
updateDisplay();