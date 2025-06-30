// 전역 상태 변수
let currentChapter = 1;
let currentSet = 0;
let currentMode = 'question';
let studyData = [];
let buttonLocked = false;
let animateScreenIn = false;

// 설정값 기본값
let settings = {
  fontScale: 1,
  layoutScale: 1,
  buttonScale: 1
};

// 설정 로드
function loadSettings() {
  try {
    const saved = localStorage.getItem('bible-app-settings');
    if (saved) {
      settings = { ...settings, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.log('설정 로드 실패:', e);
  }
  applySettings();
}

// 설정 저장
function saveSettings() {
  try {
    localStorage.setItem('bible-app-settings', JSON.stringify(settings));
  } catch (e) {
    console.log('설정 저장 실패:', e);
  }
}

// 설정 적용
function applySettings() {
  const root = document.documentElement;
  root.style.setProperty('--font-scale', settings.fontScale);
  root.style.setProperty('--layout-scale', settings.layoutScale);
  root.style.setProperty('--button-scale', settings.buttonScale);
}

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

// 설정 화면 렌더링
function renderSettingsScreen() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="settings-screen">
      <div class="settings-header">⚙️ 화면 설정</div>
      
      <div class="settings-item">
        <label class="settings-label">📝 글자 크기</label>
        <input type="range" class="settings-range" id="font-scale" 
               min="0.7" max="1.5" step="0.1" value="${settings.fontScale}">
        <div class="settings-value" id="font-value">${Math.round(settings.fontScale * 100)}%</div>
      </div>

      <div class="settings-item">
        <label class="settings-label">📐 레이아웃 크기</label>
        <input type="range" class="settings-range" id="layout-scale" 
               min="0.7" max="1.3" step="0.1" value="${settings.layoutScale}">
        <div class="settings-value" id="layout-value">${Math.round(settings.layoutScale * 100)}%</div>
      </div>

      <div class="settings-item">
        <label class="settings-label">🔘 버튼 크기</label>
        <input type="range" class="settings-range" id="button-scale" 
               min="0.7" max="1.4" step="0.1" value="${settings.buttonScale}">
        <div class="settings-value" id="button-value">${Math.round(settings.buttonScale * 100)}%</div>
      </div>

      <div class="settings-buttons">
        <button class="settings-btn-item settings-btn-reset" id="reset-settings">초기화</button>
        <button class="settings-btn-item" id="save-settings">저장</button>
        <button class="settings-btn-item" id="close-settings">닫기</button>
      </div>
    </div>
  `;

  if (animateScreenIn) {
    setTimeout(() => {
      document.querySelector('.settings-screen').classList.add('screen-animate-in');
    }, 0);
    animateScreenIn = false;
  }

  // 슬라이더 이벤트
  const fontSlider = document.getElementById('font-scale');
  const layoutSlider = document.getElementById('layout-scale');
  const buttonSlider = document.getElementById('button-scale');

  fontSlider.oninput = () => {
    settings.fontScale = parseFloat(fontSlider.value);
    document.getElementById('font-value').textContent = Math.round(settings.fontScale * 100) + '%';
    applySettings();
  };

  layoutSlider.oninput = () => {
    settings.layoutScale = parseFloat(layoutSlider.value);
    document.getElementById('layout-value').textContent = Math.round(settings.layoutScale * 100) + '%';
    applySettings();
  };

  buttonSlider.oninput = () => {
    settings.buttonScale = parseFloat(buttonSlider.value);
    document.getElementById('button-value').textContent = Math.round(settings.buttonScale * 100) + '%';
    applySettings();
  };

  // 버튼 이벤트
  document.getElementById('reset-settings').onclick = () => {
    settings = { fontScale: 1, layoutScale: 1, buttonScale: 1 };
    applySettings();
    renderSettingsScreen();
  };

  document.getElementById('save-settings').onclick = () => {
    saveSettings();
    alert('설정이 저장되었습니다!');
  };

  document.getElementById('close-settings').onclick = () => {
    animateScreenIn = true;
    renderScreen('main');
  };
}

// 화면 전환
async function renderScreen(screen, chapter) {
  const app = document.getElementById('app');
  
  if (screen === 'main') {
    app.innerHTML = `
      <button class="settings-btn" id="settings-btn" aria-label="설정">⚙️</button>
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
    // 설정 버튼 이벤트
    document.getElementById('settings-btn').onclick = openSettings;
    // 메인에서 장 선택으로 이동: 슬라이드 인 적용!
    document.getElementById('main-start-btn').onclick = () => {
      animateScreenIn = true;
      renderScreen('chapter');
    };
  } else if (screen === 'chapter') {
    let chapterBtns = '';
    for (let i = 1; i <= 22; i++) {
      chapterBtns += `
        <button class="chapter-btn" onclick="selectChapter(${i})" aria-label="계시록 ${i}장">
          📖 계시록 ${i}장
        </button>
      `;
    }
    app.innerHTML = `
      <button class="settings-btn" id="settings-btn" aria-label="설정">⚙️</button>
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
    // 설정 버튼 이벤트
    document.getElementById('settings-btn').onclick = openSettings;
  } else if (screen === 'quiz') {
    currentChapter = chapter;
    currentSet = 0;
    currentMode = 'question';
    studyData = await loadChapterQA(currentChapter);
    if (!studyData.length) {
      app.innerHTML = `
        <button class="settings-btn" id="settings-btn" aria-label="설정">⚙️</button>
        <div class="chapter-list-screen">
          <div style="text-align: center; padding: 40px; font-size: calc(1.2rem * var(--font-scale)); color: #e74c3c;">
            계시록 ${chapter}장 문제<br><br>
            문제 데이터를 불러올 수 없습니다.<br>
            파일명, 폴더, 인코딩(UTF-8)을 확인하세요.
          </div>
          <button class="chapter-btn" onclick="renderScreen('chapter')" style="margin-top: 20px;">장 선택으로 돌아가기</button>
        </div>
      `;
      if (animateScreenIn) {
        setTimeout(() => {
          document.querySelector('.chapter-list-screen').classList.add('screen-animate-in');
        }, 0);
        animateScreenIn = false;
      }
      // 설정 버튼 이벤트
      document.getElementById('settings-btn').onclick = openSettings;
      return;
    }
    renderQuizCard();
  }
}

// 장 선택 함수
function selectChapter(chapterNum) {
  animateScreenIn = true;
  renderScreen('quiz', chapterNum);
}

// 문제/정답 카드 렌더링
function renderQuizCard() {
  const qa = studyData[currentSet];
  if (!qa) return;
  
  let cardContent = '';
  let cardTitle = '';
  if (currentMode === 'question') {
    cardTitle = '[ 문제 ]';
    cardContent = `${currentSet + 1}. ${qa.q}`;
  } else {
    cardTitle = '✅ 정답';
    cardContent = qa.a.map(ans => `▶ ${ans}`).join('<br>');
  }
  
  document.getElementById('app').innerHTML = `
    <button class="settings-btn" id="settings-btn" aria-label="설정">⚙️</button>
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

  // 설정 버튼 이벤트
  document.getElementById('settings-btn').onclick = openSettings;

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
  }

  // 버튼 이벤트 (중복 클릭 방지)
  const lockDelay = 300;
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
  
  document.getElementById('btn-list').onclick = () => {
    if (buttonLocked) return;
    buttonLocked = true;
    setTimeout(() => { buttonLocked = false; }, lockDelay);
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
    renderQuizCard();
  };
}

// 전역 함수로 설정 화면 렌더링 함수 노출
window.renderSettingsScreen = () => {
  animateScreenIn = true;
  renderSettingsScreen();
};

// 설정 버튼 클릭 핸들러
function openSettings() {
  animateScreenIn = true;
  renderSettingsScreen();
}

// 최초 진입
window.onload = () => { 
  loadSettings();
  renderScreen('main'); 
};

// PWA 서비스워커 등록
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.log('Service Worker 등록 실패:', err);
    });
  });
}

// 화면 회전 시 설정 재적용
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    applySettings();
  }, 100);
});

// 뒤로가기 방지 (선택사항)
window.addEventListener('beforeunload', (e) => {
  // PWA에서 실수로 나가는 것을 방지
  if (window.location.href.includes('standalone')) {
    e.preventDefault();
    e.returnValue = '';
  }
});
