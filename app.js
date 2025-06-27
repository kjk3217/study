// 전역 상태 변수
let currentChapter = 1;
let currentSet = 0;         // 0-based index
let currentMode = 'question';  // 'question' | 'answer'
let studyData = [];
let buttonLocked = false;

// 슬라이드 애니메이션 트리거
let animateScreenIn = false;

// 문답 데이터 파일 파싱 함수
async function loadChapterQA(chapterNum) {
  const url = `data/chapter${chapterNum}.txt`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('파일을 찾을 수 없습니다.');
    const text = await response.text();

    // 문제+정답 블록 분리: 2개 이상 연속 줄바꿈(빈줄 포함)
    const itemBlocks = text.trim().split(/\n\s*\n/);

    // 각 문항에서 문제/정답 분리
    const qaList = itemBlocks.map(block => {
      const lines = block.trim().split(/\n/).map(line => line.trim()).filter(Boolean);
      // 첫 줄: 문제 (번호 제거)
      const qMatch = lines[0].match(/^\d+\.\s*(.*)$/);
      const q = qMatch ? qMatch[1] : lines[0];
      // 둘째 줄 이후: ▶로 시작하는 정답만
      const a = lines.slice(1).filter(line => line.startsWith('▶')).map(line => line.replace(/^▶\s*/, ''));
      return { q, a };
    }).filter(qa => qa.q && qa.a.length > 0);

    return qaList;
  } catch (err) {
    alert(`[에러] 문제 파일을 불러올 수 없습니다:\n${url}`);
    return [];
  }
}

// 화면 전환
async function renderScreen(screen, chapter) {
  const app = document.getElementById('app');
  if (screen === 'main') {
    app.innerHTML = `
      <div class="main-screen">
        <div class="main-header">요한계시록<br>문답 공부</div>
        <div class="main-logo-box">
          <img src="images/main-logo.png" alt="앱 로고" class="main-logo"/>
        </div>
        <button class="main-start-btn" id="main-start-btn">시작</button>
        <div class="main-footer">성경 공부 앱 v1.0</div>
      </div>
    `;
    if (animateScreenIn) {
      setTimeout(() => {
        document.querySelector('.main-screen').classList.add('screen-animate-in');
      }, 0);
      animateScreenIn = false;
    }
    // 메인에서 장 선택으로 이동: 슬라이드 인 적용!
    document.getElementById('main-start-btn').onclick = () => {
      animateScreenIn = true;
      renderScreen('chapter');
    };
  } else if (screen === 'chapter') {
    let chapterBtns = '';
    for (let i = 1; i <= 22; i++) {
      chapterBtns += `
        <button class="chapter-btn" onclick="renderScreen('quiz', ${i})" aria-label="계시록 ${i}장">
          📖 계시록 ${i}장
        </button>
      `;
    }
    app.innerHTML = `
      <div class="chapter-list-screen">
        <div class="chapter-list-scroll">${chapterBtns}</div>
      </div>
    `;
    if (animateScreenIn) {
      setTimeout(() => {
        document.querySelector('.chapter-list-screen').classList.add('screen-animate-in');
      }, 0);
      animateScreenIn = false;
    }
    // 각 장 선택시: 슬라이드 인 효과 적용!
    const btns = document.querySelectorAll('.chapter-btn');
    btns.forEach((btn, idx) => {
      btn.onclick = () => {
        animateScreenIn = true;
        renderScreen('quiz', idx + 1);
      };
    });
  } else if (screen === 'quiz') {
    currentChapter = chapter;
    currentSet = 0;
    currentMode = 'question';
    studyData = await loadChapterQA(currentChapter);
    if (!studyData.length) {
      app.innerHTML = `
        <div class="screen">
          <div class="quiz-title">계시록 ${chapter}장 문제</div>
          <p style="font-size:1.2rem; color:#e74c3c;">문제 데이터를 불러올 수 없습니다.<br>
          파일명, 폴더, 인코딩(UTF-8)을 확인하세요.</p>
          <button class="btn" onclick="renderScreen('chapter')">장 선택</button>
        </div>
      `;
      if (animateScreenIn) {
        setTimeout(() => {
          document.querySelector('.screen').classList.add('screen-animate-in');
        }, 0);
        animateScreenIn = false;
      }
      return;
    }
    renderQuizCard();
  }
}

// 문제/정답 카드 렌더링
function renderQuizCard() {
  const qa = studyData[currentSet];
  if (!qa) return;
  let cardContent = '';
  let cardTitle = '';
  if (currentMode === 'question') {
    cardTitle = '❓ 문제';
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
  if (animateScreenIn) {
    setTimeout(() => {
      document.querySelector('.quiz-wrap').classList.add('screen-animate-in');
    }, 0);
    animateScreenIn = false;
  }

  // 카드 텍스트 fade-in 애니메이션(문제/정답 전환)
  setTimeout(() => {
    const contentDiv = document.getElementById('quiz-card-content');
    if (contentDiv) {
      contentDiv.classList.add('fade-in');
      setTimeout(() => {
        contentDiv.classList.remove('fade-in');
      }, 400);
    }
  }, 20);

  // 카드 터치/클릭 차단(스크롤만 허용)
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

  // 버튼 이벤트 (중복 클릭 방지)
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
    renderQuizCard(); // 슬라이드 인 없이 카드만 전환
  };
  document.getElementById('btn-list').onclick = () => {
    animateScreenIn = true;
    renderScreen('chapter');
  };
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
    renderQuizCard(); // 슬라이드 인 없이 카드만 전환
  };
}

// 최초 진입
window.onload = () => { renderScreen('main'); };

// PWA 서비스워커 등록
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js');
  });
}
