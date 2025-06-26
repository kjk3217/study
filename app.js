function renderQuizCard() {
  const qa = studyData[currentSet];
  if (!qa) return;
  let cardContent = '';
  let cardTitle = '';
  if (currentMode === 'question') {
    cardTitle = '❓ 문제'; // 이모지 및 텍스트 변경 가능
    cardContent = `${currentSet + 1}. ${qa.q}`;
  } else {
    cardTitle = '✅ 정답';
    cardContent = qa.a.map(ans => `▶ ${ans}`).join('<br>');
  }
  document.getElementById('app').innerHTML = `
    <div class="quiz-wrap">
      <div class="quiz-topbar">
        <span class="quiz-chapter">계시록${currentChapter}장</span>
        <span class="quiz-progress">${currentSet + 1}/${studyData.length}</span>
      </div>
      <div class="quiz-card-area">
        <div class="quiz-card quiz-no-touch">
          <div class="quiz-card-title">${cardTitle}</div>
          <hr class="quiz-card-divider"/>
          <div class="quiz-card-content" id="quiz-card-content">
            ${cardContent}
          </div>
        </div>
      </div>
      <div class="quiz-bottombar">
        <button class="quiz-btn quiz-btn-prev" id="btn-prev" aria-label="이전 문제">이전</button>
        <button class="quiz-btn quiz-btn-list" id="btn-list" aria-label="목록">목록</button>
        <button class="quiz-btn quiz-btn-next" id="btn-next" aria-label="다음 문제">다음</button>
      </div>
    </div>
  `;

  // [1] 카드 텍스트 fade-in 애니메이션 적용
  setTimeout(() => {
    const contentDiv = document.getElementById('quiz-card-content');
    if (contentDiv) {
      contentDiv.classList.add('fade-in');
      setTimeout(() => {
        contentDiv.classList.remove('fade-in');
      }, 400); // 애니메이션 지속시간
    }
  }, 20);

  // [2] 카드 터치/클릭 차단(스크롤만 허용)
  const card = document.querySelector('.quiz-card');
  if (card) {
    card.addEventListener('touchstart', e => e.stopPropagation(), { passive: false });
    card.addEventListener('touchmove', e => e.stopPropagation(), { passive: false });
    card.addEventListener('touchend', e => e.stopPropagation(), { passive: false });
    card.addEventListener('mousedown', e => e.stopPropagation());
    card.addEventListener('mouseup', e => e.stopPropagation());
    card.addEventListener('click', e => e.stopPropagation());
    card.style.pointerEvents = "none";
    const contentDiv = card.querySelector('.quiz-card-content');
    if (contentDiv) contentDiv.style.pointerEvents = "auto";
  }

  // [3] 버튼 이벤트 (중복 클릭 방지)
  const lockDelay = 200;
  document.getElementById('btn-prev').onclick = () => {
    if (buttonLocked) return;
    buttonLocked = true;
    setTimeout(() => { buttonLocked = false; }, lockDelay);
    if (currentMode === 'answer') {
      currentMode = 'question';
    } else {
      currentSet = (currentSet - 1 + studyData.length) % studyData.length;
      currentMode = 'answer';
    }
    renderQuizCard();
  };
  document.getElementById('btn-list').onclick = () => renderScreen('chapter');
  document.getElementById('btn-next').onclick = () => {
    if (buttonLocked) return;
    buttonLocked = true;
    setTimeout(() => { buttonLocked = false; }, lockDelay);
    if (currentMode === 'question') {
      currentMode = 'answer';
    } else {
      currentMode = 'question';
      currentSet = (currentSet + 1) % studyData.length;
    }
    renderQuizCard();
  };
}
