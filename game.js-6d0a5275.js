// Get the canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game dimensions and scaling
const BASE_WIDTH = 800;
const BASE_HEIGHT = 600;
let CANVAS_WIDTH = BASE_WIDTH;
let CANVAS_HEIGHT = BASE_HEIGHT;
const CHUNK_SIZE = 500; // Size of each chunk in pixels

// Store game objects
let chunks = {}; // Store generated chunks
let terrain = []; // Store terrain features like trees
let bullets = [];
let enemies = [];
let jewels = [];
let keys = {};
let score = 0;

// Game state
const GAME_STATE = {
    START_SCREEN: 0,
    SETTINGS: 1,
    PLAYING: 2,
    GAME_OVER: 3,
    PAUSED: 4,
    LOADING: 5,
    CONFIRM_DIALOG: 6
};

let currentGameState = GAME_STATE.START_SCREEN;
let previousGameState = null; // 일시정지 전 상태를 저장하기 위한 변수
let loadingStartTime = 0; // 로딩 시작 시간
let loadingMinDuration = 500; // 최소 로딩 시간 (0.5초)
let chunksLoaded = false; // 청크 로딩 완료 여부

// HUD 관련 변수들
let gameStartTime = 0;      // 게임 시작 시간
let totalPausedTime = 0;    // 총 일시정지 시간
let pauseStartTime = 0;     // 일시정지 시작 시간
let elapsedTime = 0;        // 경과 시간 (초)

// Get HUD elements
const healthElement = document.getElementById('health');
const levelElement = document.getElementById('level');
const scoreElement = document.getElementById('score');
const expElement = document.getElementById('exp');

// HUD를 캔버스에 그리는 함수
function drawHUD() {
    // 경과 시간 (화면 최상단 가운데)
    ctx.font = '20px Arial';
    ctx.fillStyle = '#66fcf1';
    ctx.textAlign = 'center';
    ctx.fillText(formatTime(elapsedTime), canvas.width / 2, 30);
    
    // 점수 (화면 왼쪽 위)
    ctx.font = '18px Arial';
    ctx.fillStyle = '#66fcf1';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 30);
    
    // 레벨 (화면 하단, 경험치 바 바로 위)
    ctx.font = '24px Arial';
    ctx.fillStyle = '#ffff00';
    ctx.textAlign = 'center';
    ctx.fillText(`LEVEL ${player.level}`, canvas.width / 2, canvas.height - 40);
    
    // 경험치 바 (화면 최하단에 전체 너비)
    const expBarHeight = 20;
    const expBarY = canvas.height - expBarHeight;
    
    // 경험치 바 배경 (검은색)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, expBarY, canvas.width, expBarHeight);
    
    // 경험치 바 (진행도)
    const expProgress = (player.exp - player.prevLevelExp) / (player.nextLevelExp - player.prevLevelExp);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(0, expBarY, canvas.width * expProgress, expBarHeight);
    
    // 경험치 바 테두리
    ctx.strokeStyle = '#66fcf1';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, expBarY, canvas.width, expBarHeight);
    
    // 경험치 텍스트 (바 중앙에)
    ctx.font = '14px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${player.exp} / ${player.nextLevelExp}`, canvas.width / 2, expBarY + 15);
}

// Start menu options
let selectedMenuOption = 0; // 0 = Start Game, 1 = Settings

// Pause menu options
let selectedPauseOption = 0; // 0 = Resume Game, 1 = To the Start Menu
let selectedConfirmOption = 0; // 0 = 예, 1 = 아니오
let confirmDialogType = ""; // 어떤 확인 대화상자인지 구분

// Player object
// 플레이어 객체
const player = {
    x: 0,
    y: 0,
    size: 15,
    speed: 3,
    health: 100,
    maxHealth: 100,
    level: 1,
    exp: 0,
    nextLevelExp: 100,
    prevLevelExp: 0,
    weapons: [],
    characterType: 1,
    image: null,
    
    // 애니메이션 관련 속성 추가
    animationState: 'idle', // 'idle' or 'walking'
    currentFrame: 0,
    frameCount: 4, // 스프라이트 시트의 프레임 수 (예: idle 4프레임, walking 4프레임)
    frameTime: 0,
    frameDuration: 150, // 각 프레임 지속 시간 (밀리초)
    spriteWidth: 32, // 스프라이트 한 프레임의 너비
    spriteHeight: 32, // 스프라이트 한 프레임의 높이
    lastMovementState: false // 이동 상태 추적용
};

// 미리보기 애니메이션을 위한 전역 변수
const previewAnimation = {
    currentFrame: 0,
    frameTime: 0,
    frameDuration: 150 // 각 프레임 지속 시간 (밀리초)
};

// 플레이어 캐릭터 이미지 배열 수정 - 스프라이트 시트 정보 추가
const playerImages = [
    { 
        name: '캐릭터 1', 
        image: new Image(),
        spriteWidth: 32, // 각 캐릭터별 스프라이트 크기 설정 가능
        spriteHeight: 32,
        frameCount: 4
    },
    { 
        name: '캐릭터 2', 
        image: new Image(),
        spriteWidth: 32,
        spriteHeight: 32,
        frameCount: 4
    },
    { 
        name: '캐릭터 3', 
        image: new Image(),
        spriteWidth: 32,
        spriteHeight: 32,
        frameCount: 4
    }
];

// 선택된 캐릭터 인덱스 (0, 1, 2 중 하나)
let currentCharacterIndex = 0;
let previousCharacterIndex = 0;

// 이미지 리소스 로딩 수정 - 스프라이트 시트 로드
function loadCharacterImages() {
    // 스프라이트 시트 이미지 경로 (idle과 walking이 포함된 이미지)
    playerImages[0].image.src = './img/player1_sprites.png';
    playerImages[1].image.src = './img/player2_sprites.png';
    playerImages[2].image.src = './img/player3_sprites.png';
    
    // 첫 번째 캐릭터로 기본 설정
    player.image = playerImages[0].image;
    player.spriteWidth = playerImages[0].spriteWidth;
    player.spriteHeight = playerImages[0].spriteHeight;
    player.frameCount = playerImages[0].frameCount;
    
    // 이미지 로드 확인용 로그
    playerImages.forEach((character, index) => {
        character.image.onload = function() {
            console.log(`캐릭터 ${index + 1} 스프라이트 시트 로드 완료`);
        };
    });
}

// 게임 초기화 시 이미지 로딩 호출
loadCharacterImages();

// 적 스폰 관련 변수 추가
const MAX_ENEMIES = 100; // 최대 적 수
const MIN_SPAWN_DISTANCE = 150; // 최소 스폰 거리
const MAX_SPAWN_DISTANCE = 450; // 최대 스폰 거리
const ENEMY_SPAWN_INTERVAL = 50; // 적 스폰 간격 (1초)
let lastEnemySpawnTime = 0; // 마지막 적 스폰 시간



// Handle window resizing
function resizeCanvas() {
    // Calculate the available window space
    let availableWidth = window.innerWidth - 40; // Account for margins
    let availableHeight = window.innerHeight - 150; // Account for headers and HUD

    // Maintain aspect ratio
    const ratio = BASE_WIDTH / BASE_HEIGHT;
    
    if (availableHeight < availableWidth / ratio) {
        CANVAS_WIDTH = availableHeight * ratio;
        CANVAS_HEIGHT = availableHeight;
    } else {
        CANVAS_WIDTH = availableWidth;
        CANVAS_HEIGHT = availableWidth / ratio;
    }

    // Set the canvas display size (CSS)
    canvas.style.width = CANVAS_WIDTH + 'px';
    canvas.style.height = CANVAS_HEIGHT + 'px';
    
    // Keep the drawing buffer size the same for consistency
    canvas.width = BASE_WIDTH;
    canvas.height = BASE_HEIGHT;
    
    // Reset font after resize
    ctx.font = '16px Arial';
    
    // Disable image smoothing for pixel art
    ctx.imageSmoothingEnabled = false;
}

// Call resize initially and add event listener
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// 키보드 이벤트 핸들러
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // 디버깅을 위한 콘솔 로그 추가
    console.log('키 입력:', e.key, '현재 게임 상태:', currentGameState);
    
    // 시작 화면 메뉴 네비게이션
    if (currentGameState === GAME_STATE.START_SCREEN) {
        if (e.key === 'ArrowUp') {
            selectedMenuOption = 0; // 게임 시작
            e.preventDefault();
        } else if (e.key === 'ArrowDown') {
            selectedMenuOption = 1; // 설정
            e.preventDefault();
        } else if (e.key === 'Enter') {
            if (selectedMenuOption === 0) {
                // 로딩 화면으로 게임 시작
                startGame();
            } else if (selectedMenuOption === 1) {
                // 설정 화면으로 이동
                currentGameState = GAME_STATE.SETTINGS;
            }
            e.preventDefault();
        }
    } 
    // 설정 화면에서 캐릭터 변경 시 스프라이트 정보도 업데이트
    // drawSettingsScreen 함수 내 캐릭터 선택
    else if (currentGameState === GAME_STATE.SETTINGS) {
        if (e.key === 'ArrowLeft') {
            // 이전 캐릭터로
            currentCharacterIndex = (currentCharacterIndex - 1 + playerImages.length) % playerImages.length;
            player.characterType = currentCharacterIndex + 1;
            player.image = playerImages[currentCharacterIndex].image;
            // 스프라이트 정보 업데이트
            player.spriteWidth = playerImages[currentCharacterIndex].spriteWidth;
            player.spriteHeight = playerImages[currentCharacterIndex].spriteHeight;
            player.frameCount = playerImages[currentCharacterIndex].frameCount;
            // 애니메이션 초기화
            previewAnimation.currentFrame = 0;
            previewAnimation.frameTime = 0;
            e.preventDefault();
        } else if (e.key === 'ArrowRight') {
            // 다음 캐릭터로
            currentCharacterIndex = (currentCharacterIndex + 1) % playerImages.length;
            player.characterType = currentCharacterIndex + 1;
            player.image = playerImages[currentCharacterIndex].image;
            // 스프라이트 정보 업데이트
            player.spriteWidth = playerImages[currentCharacterIndex].spriteWidth;
            player.spriteHeight = playerImages[currentCharacterIndex].spriteHeight;
            player.frameCount = playerImages[currentCharacterIndex].frameCount;
            // 애니메이션 초기화
            previewAnimation.currentFrame = 0;
            previewAnimation.frameTime = 0;
            e.preventDefault();
        } else if (e.key === 'Enter') {
            // 캐릭터 바뀐 채 시작 화면으로 돌아가기
            previousCharacterIndex = currentCharacterIndex;
            currentGameState = GAME_STATE.START_SCREEN;
            e.preventDefault();
        } else if (e.key === 'Escape') {
            // 캐릭터 바뀌지 않은 채 시작 화면으로 돌아가기
            currentCharacterIndex = previousCharacterIndex;
            player.characterType = previousCharacterIndex + 1;
            player.image = playerImages[previousCharacterIndex].image;
            currentGameState = GAME_STATE.START_SCREEN;
            e.preventDefault();
        }
    }
    // 일시정지 화면 네비게이션 추가
    else if (currentGameState === GAME_STATE.PAUSED) {
        if (e.key === 'ArrowUp') {
            selectedPauseOption = 0;
            e.preventDefault();
        } else if (e.key === 'ArrowDown') {
            selectedPauseOption = 1;
            e.preventDefault();
        } else if (e.key === 'Enter') {
            if (selectedPauseOption === 0) {
                // 게임 재개
                resumeGame();
            } else if (selectedPauseOption === 1) {
                // 메인 메뉴 선택 시 확인 대화상자 표시
                currentGameState = GAME_STATE.CONFIRM_DIALOG;
                confirmDialogType = "exit_to_menu";
                selectedConfirmOption = 1; // 기본값은 "취소" 선택
            }
            e.preventDefault();
        }
    }
    // 확인 대화상자 네비게이션 추가
    else if (currentGameState === GAME_STATE.CONFIRM_DIALOG) {
        if (e.key === 'ArrowLeft') {
            selectedConfirmOption = 0; // 예
            e.preventDefault();
        } else if (e.key === 'ArrowRight') {
            selectedConfirmOption = 1; // 아니오
            e.preventDefault();
        } else if (e.key === 'Enter') {
            if (confirmDialogType === "exit_to_menu") {
                if (selectedConfirmOption === 0) {
                    // 시작 화면으로 돌아가기
                    currentGameState = GAME_STATE.START_SCREEN;
                } else {
                    // 일시정지 화면으로 돌아가기
                    currentGameState = GAME_STATE.PAUSED;
                }
            }
            e.preventDefault();
        }
    }

    // ESC 키 이벤트 처리
    if (e.key === 'Escape') {
        if (currentGameState === GAME_STATE.PLAYING) {
            pauseGame();
        } else if (currentGameState === GAME_STATE.PAUSED) {
            resumeGame();
        } else if (currentGameState === GAME_STATE.SETTINGS) {
            currentGameState = GAME_STATE.START_SCREEN;
        } else if (currentGameState === GAME_STATE.CONFIRM_DIALOG) {
            currentGameState = GAME_STATE.PAUSED;
        }
        e.preventDefault();
    }
    // 게임 오버 화면에서 키 처리 (이전과 동일)
    else if (currentGameState === GAME_STATE.GAME_OVER) {
        if (e.key === 'Enter') {
            restartGame();
            e.preventDefault();
        }
    }
    
    // 스크롤 방지 (이전과 동일)
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter', 'Escape'].includes(e.key)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// 창이 비활성화될 때 게임 일시정지
// 창이 다시 활성화될 때 자동으로 게임 재개는 하지 않음 (사용자가 직접 ESC나 Enter 누르도록)
window.addEventListener('blur', () => {
    if (currentGameState === GAME_STATE.PLAYING) {
        pauseGame();
    }
});

// pauseGame 함수
function pauseGame() {
    if (currentGameState === GAME_STATE.PLAYING) {
        previousGameState = currentGameState;
        currentGameState = GAME_STATE.PAUSED;
        selectedPauseOption = 0;
        pauseStartTime = Date.now(); // 일시정지 시작 시간 기록
    }
}

// 게임 재개 기능
function resumeGame() {
    if (currentGameState === GAME_STATE.PAUSED && previousGameState !== null) {
        // 일시정지된 시간 계산
        const pausedDuration = Date.now() - pauseStartTime;
        totalPausedTime += pausedDuration;
        
        currentGameState = previousGameState;
    }
}

function drawPauseScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#66fcf1';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 80);
    
    // 메뉴 옵션 그리기
    ctx.font = '24px Arial';
    
    // Resume Game 옵션
    if (selectedPauseOption === 0) {
        ctx.fillStyle = '#FFFF00'; // 선택된 항목 색상
        // 화살표 인디케이터 그리기
        drawArrow(canvas.width / 2 - 100, canvas.height / 2 - 8);
    } else {
        ctx.fillStyle = '#FFFFFF';
    }
    ctx.fillText('RESUME', canvas.width / 2, canvas.height / 2);
    
    // Back to Main Menu 옵션
    if (selectedPauseOption === 1) {
        ctx.fillStyle = '#FFFF00'; // 선택된 항목 색상
        // 화살표 인디케이터 그리기
        drawArrow(canvas.width / 2 - 100, canvas.height / 2 + 42);
    } else {
        ctx.fillStyle = '#FFFFFF';
    }
    ctx.fillText('MAIN MENU', canvas.width / 2, canvas.height / 2 + 50);
    
    // 안내 메시지
    /*
    ctx.fillStyle = '#AAAAAA';
    ctx.font = '16px Arial';
    ctx.fillText('방향키로 선택하고 Enter를 눌러 확인하세요', canvas.width / 2, canvas.height / 2 + 100);
    */
}

// 확인 대화상자 그리기 함수
function drawConfirmDialog() {
    // 배경 그리기 (반투명 검은색)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 대화상자 배경 그리기
    ctx.fillStyle = 'rgba(50, 50, 50, 0.9)';
    const dialogWidth = 500;
    const dialogHeight = 200;
    const dialogX = (canvas.width - dialogWidth) / 2;
    const dialogY = (canvas.height - dialogHeight) / 2;
    
    ctx.fillRect(dialogX, dialogY, dialogWidth, dialogHeight);
    
    // 테두리 그리기
    ctx.strokeStyle = '#66fcf1';
    ctx.lineWidth = 2;
    ctx.strokeRect(dialogX, dialogY, dialogWidth, dialogHeight);
    
    // 메시지 그리기
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    
    if (confirmDialogType === "exit_to_menu") {
        ctx.fillText('게임을 포기하고 나가겠습니까?', canvas.width / 2, dialogY + 70);
    }
    
    // 버튼 그리기
    const buttonY = dialogY + 130;
    const buttonSpacing = 150;
    
    // 예 버튼
    ctx.fillStyle = selectedConfirmOption === 0 ? '#FFFF00' : '#FFFFFF';
    ctx.fillText('확인', canvas.width / 2 - buttonSpacing / 2, buttonY);
    
    // 아니오 버튼
    ctx.fillStyle = selectedConfirmOption === 1 ? '#FFFF00' : '#FFFFFF';
    ctx.fillText('취소', canvas.width / 2 + buttonSpacing / 2, buttonY);
    
    // 화살표 인디케이터 그리기
    if (selectedConfirmOption === 0) {
        drawArrow(canvas.width / 2 - buttonSpacing / 2 - 30, buttonY - 8);
    } else {
        drawArrow(canvas.width / 2 + buttonSpacing / 2 - 30, buttonY - 8);
    }
}

// 로딩 화면 그리기 함수
function drawLoadingScreen() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 로딩 텍스트
    ctx.fillStyle = '#66fcf1';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LOADING...', canvas.width / 2, canvas.height / 2 - 20);
    
    // 로딩 바 배경
    ctx.fillStyle = '#333';
    ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2 + 20, 200, 20);
    
    // 로딩 진행 표시 (시간 기반으로 애니메이션)
    const elapsedTime = Date.now() - loadingStartTime;
    const progress = Math.min(elapsedTime / loadingMinDuration, 1);
    
    ctx.fillStyle = '#66fcf1';
    ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2 + 20, 200 * progress, 20);
}

// startGame 함수
function startGame() {
    // 로딩 상태로 변경
    currentGameState = GAME_STATE.LOADING;
    loadingStartTime = Date.now();
    chunksLoaded = false;
    
    // 게임 초기화
    resetGame();
    
    // 게임 시작 시간 초기화
    gameStartTime = Date.now();
    totalPausedTime = 0;
    elapsedTime = 0;
    
    // 비동기적으로 청크 생성
    setTimeout(() => {
        // 플레이어 주변 청크 생성
        generateChunksAroundPlayer();
        chunksLoaded = true;
    }, 10);
}

// Removed mouse event listeners to only use keyboard controls
// Instead, add automatic aiming toward the nearest enemy
function updatePlayerAim() {
    let nearestEnemy = findNearestEnemy();
    
    if (nearestEnemy) {
        const dx = nearestEnemy.x - player.x;
        const dy = nearestEnemy.y - player.y;
        player.aimAngle = Math.atan2(dy, dx);
    }
    // 첫 시작 시 aimAngle이 undefined일 수 있으므로 초기값 설정
    else if (player.aimAngle === undefined) {
        player.aimAngle = 0; // 기본값으로 오른쪽 방향
    }
}

function findNearestEnemy() {
    let nearestEnemy = null;
    let minDistance = 250;
    
    enemies.forEach((enemy) => {
        // moving 상태인 적만 조준 대상으로 고려 (수정된 부분)
        if (enemy.state === 'moving') {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const distance = Math.hypot(dx, dy);
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestEnemy = enemy;
            }
        }
    });
    
    return nearestEnemy;
}

// Auto-fire at the nearest enemy
function autoFireAtNearestEnemy() {
    const nearestEnemy = findNearestEnemy();
    
    if (nearestEnemy) {
        // Add auto-firing cooldown to control fire rate
        const now = Date.now();
        if (!player.lastFireTime || now - player.lastFireTime >= 500) { // Fire every 500ms
            fireWeapon();
            player.lastFireTime = now;
        }
    }
}

// Game Loop 변수
let lastGameState = null;
let lastFrameTime = 0;
const TARGET_FPS = 120;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

// Game Loop 함수
function gameLoop(timestamp) {
    // Calculate delta time and limit frame rate
    if (!lastFrameTime) lastFrameTime = timestamp;
    const deltaTime = timestamp - lastFrameTime;
    
    // Only update if enough time has passed (frame rate limiting)
    if (deltaTime >= FRAME_INTERVAL) {
        lastFrameTime = timestamp;
        
        // DOM HUD 표시/숨김 코드 제거
        
        // 로딩 상태 처리
        if (currentGameState === GAME_STATE.LOADING) {
            drawLoadingScreen();
            
            // 청크 로딩이 완료되고 최소 로딩 시간이 지났는지 확인
            const elapsedTime = Date.now() - loadingStartTime;
            if (chunksLoaded && elapsedTime >= loadingMinDuration) {
                // 로딩 완료, 게임 플레이 상태로 전환
                currentGameState = GAME_STATE.PLAYING;
            }
        }
        // Update game based on state
        else if (currentGameState === GAME_STATE.PLAYING) {
            update();
            draw();
            if (player.health <= 0) {
                currentGameState = GAME_STATE.GAME_OVER;
            }
        } else if (currentGameState === GAME_STATE.START_SCREEN) {
            drawStartScreen();
        } else if (currentGameState === GAME_STATE.SETTINGS) {
            drawSettingsScreen();
        } else if (currentGameState === GAME_STATE.GAME_OVER) {
            drawGameOverScreen();
        } else if (currentGameState === GAME_STATE.PAUSED) {
            // 배경 그리기 (플레이어가 어디에 있는지 볼 수 있게)
            draw();
            // 그 위에 일시정지 화면 그리기
            drawPauseScreen();
        } else if (currentGameState === GAME_STATE.CONFIRM_DIALOG) {
            // 게임 화면 그리기
            draw();
            // 일시정지 화면 그리기
            drawPauseScreen();
            // 확인 대화상자 그리기
            drawConfirmDialog();
        }
    }
    
    requestAnimationFrame(gameLoop);
}

// Draw Start Screen
function drawStartScreen() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Title
    ctx.fillStyle = '#55AAFF';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('뱀파이어 서바이벌', canvas.width / 2, canvas.height / 3 + 50);
    
    // Draw selected character preview with animation
    const previewSize = player.size * 3;
    const previewX = canvas.width / 2;
    const previewY = canvas.height / 3 + 70;
    
    // 애니메이션 프레임 업데이트
    previewAnimation.frameTime += 16; // 약 60fps 기준
    if (previewAnimation.frameTime >= previewAnimation.frameDuration) {
        previewAnimation.frameTime = 0;
        previewAnimation.currentFrame = (previewAnimation.currentFrame + 1) % player.frameCount;
    }
    
    // Draw character preview with idle animation
    if (player.image && player.image.complete) {
        // idle 애니메이션 프레임 그리기
        const spriteX = previewAnimation.currentFrame * player.spriteWidth;
        const spriteY = 0; // idle 애니메이션은 Y축 0
        
        ctx.drawImage(
            player.image,
            spriteX, spriteY,
            player.spriteWidth, player.spriteHeight,
            previewX - previewSize * 2,
            previewY - previewSize * 2 - 150,
            previewSize * 4,
            previewSize * 4
        );
    } else {
        // Fallback if image not loaded
        ctx.fillStyle = '#AAAAAA';
        ctx.beginPath();
        ctx.arc(previewX, previewY - 150, previewSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Menu options
    ctx.font = '24px Arial';
    
    // Start Game option
    if (selectedMenuOption === 0) {
        ctx.fillStyle = '#FFFF00'; // Highlighted color
        // Draw arrow indicator
        drawArrow(canvas.width / 2 - 80, canvas.height / 2 + 42);
    } else {
        ctx.fillStyle = '#FFFFFF';
    }
    ctx.fillText('시작', canvas.width / 2, canvas.height / 2 + 50);
    
    // Settings option
    if (selectedMenuOption === 1) {
        ctx.fillStyle = '#FFFF00'; // Highlighted color
        // Draw arrow indicator
        drawArrow(canvas.width / 2 - 80, canvas.height / 2 + 92);
    } else {
        ctx.fillStyle = '#FFFFFF';
    }
    ctx.fillText('설정', canvas.width / 2, canvas.height / 2 + 100);
    
    // Instructions
    ctx.fillStyle = '#AAAAAA';
    ctx.font = '16px Arial';
    ctx.fillText('방향키로 조작', canvas.width / 2, canvas.height * 3/4 + 50);
    ctx.fillText('Enter로 선택', canvas.width / 2, canvas.height * 3/4 + 80);
}

// 설정 화면 그리기 함수
function drawSettingsScreen() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 제목
    ctx.fillStyle = '#55AAFF';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('캐릭터 선택', canvas.width / 2, canvas.height / 3);
    
    // 캐릭터 선택 텍스트
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Arial';
    ctx.fillText('캐릭터:', canvas.width / 2, canvas.height / 2 - 70);
    
    // 현재 선택된 캐릭터 이름 표시
    ctx.fillStyle = '#FFFF00';
    ctx.fillText(playerImages[currentCharacterIndex].name, canvas.width / 2, canvas.height / 2 - 30);
    
    // 좌우 화살표 그리기
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '32px Arial';
    ctx.fillText('◀', canvas.width / 2 - 120, canvas.height / 2 + 70);
    ctx.fillText('▶', canvas.width / 2 + 120, canvas.height / 2 + 70);
    
    // 캐릭터 이미지 미리보기
    const previewSize = player.size * 4;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + 50;
    
    // 애니메이션 프레임 업데이트
    previewAnimation.frameTime += 16; // 약 60fps 기준
    if (previewAnimation.frameTime >= previewAnimation.frameDuration) {
        previewAnimation.frameTime = 0;
        previewAnimation.currentFrame = (previewAnimation.currentFrame + 1) % playerImages[currentCharacterIndex].frameCount;
    }
    
    // 현재 선택된 캐릭터 이미지 그리기 (idle 애니메이션)
    if (playerImages[currentCharacterIndex].image.complete) {
        const character = playerImages[currentCharacterIndex];
        const spriteX = previewAnimation.currentFrame * character.spriteWidth;
        const spriteY = 0; // idle 애니메이션은 Y축 0
        
        ctx.drawImage(
            character.image,
            spriteX, spriteY,
            character.spriteWidth, character.spriteHeight,
            centerX - previewSize,
            centerY - previewSize,
            previewSize * 2,
            previewSize * 2
        );
    } else {
        // 이미지가 로드되지 않은 경우 대체 표시
        ctx.fillStyle = '#AAAAAA';
        ctx.beginPath();
        ctx.arc(centerX, centerY, previewSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('로딩 중...', centerX, centerY);
    }
    
    // 안내 메시지
    ctx.fillStyle = '#AAAAAA';
    ctx.font = '16px Arial';
    ctx.fillText('Enter를 눌러 캐릭터 선택', canvas.width / 2, canvas.height * 3/4 + 20);
    ctx.fillText('ESC를 눌러 취소', canvas.width / 2, canvas.height * 3/4 + 50);
}

// update 함수
function update() {
    // 경과 시간 계산 (게임이 실행 중일 때만)
    if (currentGameState === GAME_STATE.PLAYING) {
        const currentTime = Date.now();
        const totalElapsed = currentTime - gameStartTime - totalPausedTime;
        elapsedTime = Math.floor(totalElapsed / 1000); // 초 단위로 변환
    }
    
    // Move Player
    let dx = 0;
    let dy = 0;
    let playerMoved = false;
    
    // 이동 방향 벡터 계산
    if (keys['ArrowUp']) { dy -= 1; }
    if (keys['ArrowDown']) { dy += 1; }
    if (keys['ArrowLeft']) { dx -= 1; }
    if (keys['ArrowRight']) { dx += 1; }
    
    // 벡터 정규화
    if (dx !== 0 || dy !== 0) {
        playerMoved = true;
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        dx = (dx / magnitude) * player.speed;
        dy = (dy / magnitude) * player.speed;
        player.x += dx;
        player.y += dy;
    }
    
    // 애니메이션 상태 업데이트
    if (playerMoved && player.animationState === 'idle') {
        player.animationState = 'walking';
        player.currentFrame = 0;
        player.frameTime = 0;
    } else if (!playerMoved && player.animationState === 'walking') {
        player.animationState = 'idle';
        player.currentFrame = 0;
        player.frameTime = 0;
    }
    
    // 애니메이션 프레임 업데이트
    player.frameTime += 16; // 약 60fps 기준
    if (player.frameTime >= player.frameDuration) {
        player.frameTime = 0;
        player.currentFrame = (player.currentFrame + 1) % player.frameCount;
    }
    
    // 플레이어가 움직였을 때만 청크를 생성
    if (playerMoved) {
        // Generate chunks around the player
        generateChunksAroundPlayer();
    }
    
    // 적 스폰 로직 실행
    spawnEnemyAroundPlayer();

    // 공간 분할 그리드 업데이트 (적들 업데이트 전에 실행)
    updateEnemySpatialGrid();
    
    // 플레이어 움직임과 상관없이 항상 가장 가까운 적을 조준
    updatePlayerAim();
    
    // Auto-fire at the nearest enemy (no spacebar needed)
    autoFireAtNearestEnemy();

    // Update Weapons
    player.weapons.forEach((weapon) => weapon.update());

    // Update Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();

        // Remove bullets that are off-screen or used
        if (bullets[i].used || bullets[i].outOfBounds()) {
            bullets.splice(i, 1);
        }
    }
    
    // 화면 밖으로 너무 멀리 벗어난 적은 제거 (최적화)
    const despawnDistance = MAX_SPAWN_DISTANCE * 3; // 스폰 거리의 3배 이상 떨어지면 제거
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distanceSquared = dx * dx + dy * dy;
        
        if (distanceSquared > despawnDistance * despawnDistance) {
            enemies.splice(i, 1);
        }
    }
    const activeRadius = CHUNK_SIZE * 1.5;

    // Update Enemies - only process enemies within active radius
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (isWithinDistance(enemy, player, activeRadius)) {
            enemy.update();

            // Check Collision with Player
            if (detectCollision(player, enemy) && enemy.state === 'moving') {
                // 플레이어를 밀어내기
                enemy.pushPlayer(player);
                
                // 일정 시간마다 데미지 주기
                enemy.attackPlayer(player);
                
                // 적을 제거하지 않음!
                // enemies.splice(i, 1); // 이 줄을 제거
            }
        }
    }

    // Update Jewels - only process jewels within active radius
    for (let i = jewels.length - 1; i >= 0; i--) {
        const jewel = jewels[i];
        if (isWithinDistance(jewel, player, activeRadius)) {
            // Move Jewel towards Player if close
            jewel.update();

            // Check collision with player
            if (detectCollision(player, jewel)) {
                jewel.collect();
                jewels.splice(i, 1);
            }
        }
    }
/*
    // Update HUD elements only when values change
    if (lastHealth !== player.health) {
        healthElement.textContent = `Health: ${player.health}`;
        lastHealth = player.health;
    }
    
    if (lastLevel !== player.level) {
        levelElement.textContent = `Level: ${player.level}`;
        lastLevel = player.level;
    }
    
    if (lastScore !== score) {
        scoreElement.textContent = `Score: ${score}`;
        lastScore = score;
    }
    
    if (lastExp !== player.exp) {
        expElement.textContent = `EXP: ${player.exp} / ${player.nextLevelExp}`;
        lastExp = player.exp;
    }
*/
}

// Draw Game Objects
function draw() {
    // 화면 흔들림 효과 (더 천천히 감소)
    if (screenShake > 0) {
        // 흔들림 감소 속도를 더 느리게
        screenShake *= 0.96; // 기존 0.9에서 0.96으로 변경 (더 천천히 감소)
        
        // 시간에 따른 감소도 추가
        const shakeDecay = Math.max(0, 1 - (Date.now() % screenShakeDuration) / screenShakeDuration);
        
        // 흔들림 강도 계산
        const currentIntensity = screenShakeIntensity * screenShake * shakeDecay;
        
        // 랜덤 흔들림 + 사인파 흔들림 조합
        const time = Date.now() * 0.01;
        screenShakeX = (Math.random() - 0.5) * currentIntensity + 
                       Math.sin(time * 1.5) * currentIntensity * 0.3;
        screenShakeY = (Math.random() - 0.5) * currentIntensity + 
                       Math.cos(time * 1.7) * currentIntensity * 0.3;
        
        // 매우 작은 값이 되면 완전히 0으로
        if (screenShake < 0.01) {
            screenShake = 0;
            screenShakeX = 0;
            screenShakeY = 0;
        }
    } else {
        screenShakeX = 0;
        screenShakeY = 0;
    }
    
    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate camera offset to center the player (흔들림 효과 적용)
    const offsetX = canvas.width / 2 - player.x + screenShakeX;
    const offsetY = canvas.height / 2 - player.y + screenShakeY;

    // Draw Background
    drawBackground(offsetX, offsetY);

    // Draw Terrain
    terrain.forEach((feature) => {
        feature.draw(offsetX, offsetY);
    });

    // Draw Jewels
    jewels.forEach((jewel) => {
        jewel.draw(offsetX, offsetY);
    });

    // Draw Enemies
    enemies.forEach((enemy) => {
        enemy.draw(offsetX, offsetY);
    });

    // Draw Bullets
    bullets.forEach((bullet) => {
        bullet.draw(offsetX, offsetY);
    });

    // 플레이어 그리기
    if (player.image && player.image.complete) {
        const playerSize = player.size * 2;
        
        // 스프라이트 시트에서 현재 프레임 위치 계산
        const spriteX = player.currentFrame * player.spriteWidth;
        const spriteY = player.animationState === 'idle' ? 0 : player.spriteHeight;
        
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        
        // 스프라이트 시트에서 해당 프레임만 그리기
        ctx.drawImage(
            player.image,
            spriteX, spriteY,
            player.spriteWidth, player.spriteHeight,
            canvas.width / 2 - playerSize,
            canvas.height / 2 - playerSize,
            playerSize * 2,
            playerSize * 2
        );
        
        ctx.restore();
    } else {
        // 이미지가 로드되지 않은 경우 기존 원 그리기
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, player.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 플레이어 체력바 그리기 (플레이어 머리 위)
    const healthBarWidth = 50;
    const healthBarHeight = 6;
    const healthBarX = canvas.width / 2 - healthBarWidth / 2;
    const healthBarY = canvas.height / 2 - player.size * 2 - 20;
    
    // 체력바 배경 (검은색)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    
    // 체력바 (현재 체력)
    const healthPercentage = player.health / player.maxHealth;
    if (healthPercentage > 0.6) {
        ctx.fillStyle = '#00ff00'; // 초록색
    } else if (healthPercentage > 0.3) {
        ctx.fillStyle = '#ffff00'; // 노란색
    } else {
        ctx.fillStyle = '#ff0000'; // 빨간색
    }
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercentage, healthBarHeight);
    
    // 체력바 테두리
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    
    // 플레이어 방향 표시기
    if (player.aimAngle !== undefined) {
        const indicatorLength = player.size * 1.2;
        ctx.strokeStyle = 'cyan';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height / 2);
        ctx.lineTo(
            canvas.width / 2 + Math.cos(player.aimAngle) * indicatorLength,
            canvas.height / 2 + Math.sin(player.aimAngle) * indicatorLength
        );
        ctx.stroke();
    }
    
    // HUD 그리기 (마지막에 그려서 다른 요소들 위에 표시)
    drawHUD();
}

function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#FF5555';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('게임 오버', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Arial';
    ctx.fillText(`최종 점수: ${score}`, canvas.width / 2, canvas.height / 2);
    ctx.fillText('Enter를 눌러 다시 시작하세요', canvas.width / 2, canvas.height / 2 + 50);
}

// Helper Functions

// 시간을 MM:SS 형식으로 포맷팅하는 함수
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function getChunkCoord(x, y) {
    return {
        x: Math.floor(x / CHUNK_SIZE),
        y: Math.floor(y / CHUNK_SIZE),
    };
}

function generateChunksAroundPlayer() {
    const chunkCoords = getChunkCoord(player.x, player.y);
    const renderDistance = 5; // How many chunks around the player to generate

    const activeChunks = {};

    for (let dx = -renderDistance; dx <= renderDistance; dx++) {
        for (let dy = -renderDistance; dy <= renderDistance; dy++) {
            const chunkX = chunkCoords.x + dx;
            const chunkY = chunkCoords.y + dy;
            const chunkKey = `${chunkX},${chunkY}`;

            if (!chunks[chunkKey]) {
                generateChunk(chunkX, chunkY);
            }
            activeChunks[chunkKey] = true;
        }
    }

    // Unload chunks that are no longer active
    for (const chunkKey in chunks) {
        if (!activeChunks[chunkKey]) {
            unloadChunk(chunkKey);
        }
    }
}

// generateChunk 함수 수정
function generateChunk(chunkX, chunkY) {
    const chunk = {
        items: [],
        terrain: [],
    };

    // 적은 더 이상 청크 생성 시 스폰되지 않음
    // 대신 spawnEnemyAroundPlayer 함수를 통해 지속적으로 생성됨

    // Generate items (jewels)
    const itemCount = 3; // Adjust as needed
    for (let i = 0; i < itemCount; i++) {
        const x = chunkX * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
        const y = chunkY * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
        const jewel = new Jewel(x, y);
        chunk.items.push(jewel);
        jewels.push(jewel); // Add to the main jewels array
    }

    // Generate terrain features (e.g., trees)
    for (let x = 0; x < CHUNK_SIZE; x += 50) {
        for (let y = 0; y < CHUNK_SIZE; y += 50) {
            const worldX = chunkX * CHUNK_SIZE + x;
            const worldY = chunkY * CHUNK_SIZE + y;
            if ((worldX + worldY) % 200 === 0) {
                const tree = new Tree(worldX, worldY);
                chunk.terrain.push(tree);
                terrain.push(tree); // Add to the main terrain array
            }
        }
    }

    // Store the chunk
    const chunkKey = `${chunkX},${chunkY}`;
    chunks[chunkKey] = chunk;
}

// unloadChunk 함수 수정 - enemies 관련 부분 제거
function unloadChunk(chunkKey) {
    const chunk = chunks[chunkKey];
    if (chunk) {
        // 청크 언로드 시 적은 제거하지 않음 (플레이어 중심으로 관리하기 때문)

        // Remove items
        chunk.items.forEach((item) => {
            const index = jewels.indexOf(item);
            if (index !== -1) jewels.splice(index, 1);
        });

        // Remove terrain features
        chunk.terrain.forEach((feature) => {
            const index = terrain.indexOf(feature);
            if (index !== -1) terrain.splice(index, 1);
        });

        // Remove the chunk
        delete chunks[chunkKey];
    }
}

// 플레이어 주변에 적을 스폰하는 함수
function spawnEnemyAroundPlayer() {
    // 최대 적 수를 초과하지 않았는지 확인
    if (enemies.length >= MAX_ENEMIES) {
        return;
    }
    
    // 스폰 간격 확인
    const currentTime = Date.now();
    if (currentTime - lastEnemySpawnTime < ENEMY_SPAWN_INTERVAL) {
        return;
    }
    
    // 360도를 8개 섹터로 나누어 스폰 시도
    const sectors = 8;
    const sectorAngle = (Math.PI * 2) / sectors;
    let possibleAngles = [];
    
    // 각 섹터별로 적의 수 확인
    for (let i = 0; i < sectors; i++) {
        const angle = i * sectorAngle;
        const enemyCount = countEnemiesInSector(angle, sectorAngle);
        
        // 섹터에 적이 적으면 가능한 각도로 추가
        if (enemyCount < 5) { // 섹터당 최대 5마리
            possibleAngles.push(angle + Math.random() * sectorAngle);
        }
    }
    
    // 가능한 각도가 없으면 스폰하지 않음
    if (possibleAngles.length === 0) {
        return;
    }
    
    // 랜덤하게 각도 선택
    const spawnAngle = possibleAngles[Math.floor(Math.random() * possibleAngles.length)];
    const spawnDistance = MIN_SPAWN_DISTANCE + Math.random() * (MAX_SPAWN_DISTANCE - MIN_SPAWN_DISTANCE);
    
    const spawnX = player.x + Math.cos(spawnAngle) * spawnDistance;
    const spawnY = player.y + Math.sin(spawnAngle) * spawnDistance;
    
    // 최종적으로 해당 위치가 유효한지 한 번 더 확인
    if (isValidSpawnPosition(spawnX, spawnY)) {
        // 적 생성
        const enemySize = 20;
        const enemySpeed = 1 + Math.random() * 0.5 + (player.level - 1) * 0.1;
        const enemyHealth = 5 + Math.floor((player.level - 1) * 1.5);
        const enemyAttack = 10 + Math.floor((player.level - 1) * 0.5);
        
        const enemy = new Enemy(spawnX, spawnY, enemySize, enemySpeed, enemyHealth, enemyAttack);
        enemies.push(enemy);
        
        lastEnemySpawnTime = currentTime;
    }
}

// 특정 섹터 내의 적 수를 세는 함수
function countEnemiesInSector(centerAngle, sectorAngle) {
    let count = 0;
    
    for (let enemy of enemies) {
        if (enemy.state === 'dying' || enemy.state === 'dead') continue;
        
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const enemyAngle = Math.atan2(dy, dx);
        
        // 각도를 0-2π 범위로 정규화
        let normalizedEnemyAngle = enemyAngle;
        if (normalizedEnemyAngle < 0) normalizedEnemyAngle += Math.PI * 2;
        
        // 섹터 범위 확인
        const sectorStart = centerAngle - sectorAngle / 2;
        const sectorEnd = centerAngle + sectorAngle / 2;
        
        if (normalizedEnemyAngle >= sectorStart && normalizedEnemyAngle <= sectorEnd) {
            count++;
        }
    }
    
    return count;
}

// 스폰 위치가 유효한지 확인하는 함수
function isValidSpawnPosition(x, y) {
    const minDistance = 40; // 다른 적과의 최소 거리
    
    for (let enemy of enemies) {
        if (enemy.state === 'dying' || enemy.state === 'dead') continue;
        
        const dx = enemy.x - x;
        const dy = enemy.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
            return false;
        }
    }
    
    return true;
}

function detectCollision(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.hypot(dx, dy);

    return distance < obj1.size + obj2.size;
}

function isWithinDistance(obj1, obj2, distance) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    return dx * dx + dy * dy <= distance * distance;
}

function fireWeapon() {
    // Create a bullet in the direction player is aiming
    if (player.aimAngle !== undefined) {
        bullets.push(
            new Bullet(
                player.x,
                player.y,
                5,
                7,
                player.aimAngle,
                10 // Damage
            )
        );
    }
}

function resetGame() {
    player.x = 0;
    player.y = 0;
    player.health = player.maxHealth;
    player.level = 1;
    player.exp = 0;
    player.nextLevelExp = 100;
    player.prevLevelExp = 0;
    player.weapons = [new BasicWeapon()];
    // 애니메이션 상태 초기화
    player.animationState = 'idle';
    player.currentFrame = 0;
    player.frameTime = 0;
    bullets = [];
    enemies = [];
    jewels = [];
    terrain = [];
    chunks = {};
    score = 0;
    
    // 시간 초기화
    elapsedTime = 0;
    totalPausedTime = 0;
    
}

function restartGame() {
    resetGame();
    currentGameState = GAME_STATE.START_SCREEN;
}

function drawBackground(offsetX, offsetY) {
    const gridSize = 50; // Size of each grid cell
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;

    const startX = -offsetX % gridSize;
    const startY = -offsetY % gridSize;

    for (let x = startX; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = startY; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// Helper function to draw an arrow
function drawArrow(x, y) {
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    // Draw triangle pointing right
    ctx.moveTo(x, y);
    ctx.lineTo(x - 15, y - 8);
    ctx.lineTo(x - 15, y + 8);
    ctx.closePath();
    ctx.fill();
}
// Classes

class Weapon {
    constructor() {
        this.attackSpeed = 1000; // ms
        this.lastAttackTime = Date.now();
    }

    update() {
        const now = Date.now();
        if (now - this.lastAttackTime >= this.attackSpeed) {
            this.fire();
            this.lastAttackTime = now;
        }
    }

    fire() {
        // To be implemented in subclasses
    }
}

class BasicWeapon extends Weapon {
    constructor() {
        super();
        this.attackSpeed = 1000;
    }

    fire() {
        bullets.push(
            new Bullet(
                player.x,
                player.y,
                5,
                7,
                Math.random() * Math.PI * 2, // Random direction
                10 // Damage
            )
        );
    }
}

class Bullet {
    constructor(x, y, size, speed, angle, damage) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = speed;
        this.angle = angle;
        this.damage = damage;
        this.used = false;
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // Check collision with enemies
        enemies.forEach((enemy) => {
            // 적이 'moving' 상태일 때만 충돌 체크
            if (enemy.state === 'moving' && detectCollision(this, enemy)) {
                enemy.takeDamage(this.damage);
                this.used = true;
            }
        });
    }

    draw(offsetX, offsetY) {
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(this.x + offsetX, this.y + offsetY, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    outOfBounds() {
        const maxDistance = 1000; // Max distance bullet can travel from player
        return !isWithinDistance(this, player, maxDistance);
    }
}

// 전역 변수로 적 스프라이트 이미지 추가
const enemySprite = new Image();
enemySprite.src = './img/enemy_sprites.png'; // 적 스프라이트 시트 경로

// 적 공간 분할
const ENEMY_SPATIAL_GRID_SIZE = 100; // 공간 분할 그리드 크기
let enemySpatialGrid = {};

// 플레이어가 공격받을 때 화면 흔들림 효과
let screenShake = 0;
let screenShakeX = 0;
let screenShakeY = 0;
let screenShakeIntensity = 0; // 흔들림 강도
let screenShakeDuration = 0; // 흔들림 지속 시간

// 적들의 공간 분할 그리드 업데이트 함수
function updateEnemySpatialGrid() {
    enemySpatialGrid = {};
    
    for (let enemy of enemies) {
        if (enemy.state === 'moving') {
            const gridX = Math.floor(enemy.x / ENEMY_SPATIAL_GRID_SIZE);
            const gridY = Math.floor(enemy.y / ENEMY_SPATIAL_GRID_SIZE);
            const key = `${gridX},${gridY}`;
            
            if (!enemySpatialGrid[key]) {
                enemySpatialGrid[key] = [];
            }
            enemySpatialGrid[key].push(enemy);
        }
    }
}

// Enemy 클래스 전체 수정
class Enemy {
    constructor(x, y, size, speed, health, attackStrength) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = speed;
        this.health = health;
        this.maxHealth = health;
        
        // 애니메이션 관련 속성
        this.state = 'spawning'; // 'spawning', 'moving', 'dying', 'dead'
        this.stateStartTime = Date.now();
        this.spawnDuration = 500;
        this.deathDuration = 500;
        
        // 스프라이트 애니메이션 속성
        this.currentFrame = 0;
        this.frameCount = 4; // 프레임 수
        this.frameTime = 0;
        this.frameDuration = 150; // 각 프레임 지속 시간
        this.spriteWidth = 32; // 스프라이트 한 프레임의 너비
        this.spriteHeight = 32; // 스프라이트 한 프레임의 높이
        
        // 방향 관련 (왼쪽/오른쪽만)
        this.direction = 'right'; // 'left' or 'right'
        this.angle = 0;
        
        // 애니메이션 효과
        this.animationTime = 0;
        this.wobbleAmount = 0;
        this.currentSize = 0;
        this.deathParticles = [];

        // 공격 관련 속성
        this.attackStrength = attackStrength;
        this.lastAttackTime = 0;
        this.attackCooldown = 500; // 0.5초마다 공격
        this.isAttacking = false;

        // 공격 애니메이션 속성 추가
        this.attackAnimationProgress = 0;
        this.attackAnimationDuration = 300; // 공격 애니메이션 지속 시간
        this.attackStartTime = 0;
        this.attackParticles = [];
        this.attackShockwave = 0;
        this.originalSize = size;
    }

    update() {
        const currentTime = Date.now();
        const deltaTime = 16; // 약 60fps 기준
        this.animationTime += deltaTime;
        
        // 상태에 따른 업데이트
        switch(this.state) {
            case 'spawning':
                this.updateSpawning(currentTime);
                break;
            case 'moving':
                this.updateMoving();
                break;
            case 'dying':
                this.updateDying(currentTime);
                break;
            case 'dead':
                // 죽음 상태에서는 제거 대기
                break;
        }

        // 체력이 0 이하가 되면 죽음 상태로 전환
        if (this.health <= 0 && this.state === 'moving') {
            this.startDying();
        }
    }

    updateSpawning(currentTime) {
        const elapsedTime = currentTime - this.stateStartTime;
        const progress = Math.min(elapsedTime / this.spawnDuration, 1);
        
        // 크기가 0에서 정상 크기로 커지는 애니메이션
        this.currentSize = this.size * this.easeOutBack(progress);
        
        // 스폰 애니메이션이 끝나면 이동 상태로 전환
        if (progress >= 1) {
            this.state = 'moving';
            this.currentSize = this.size;
        }
    }
    
    updateMoving() {
        // 플레이어를 향한 기본 방향 계산
        const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
        let moveX = Math.cos(angleToPlayer) * this.speed;
        let moveY = Math.sin(angleToPlayer) * this.speed;
        
        // 다른 적들과의 분리 벡터 계산
        const separationForce = this.calculateSeparation();
        
        // 분리 벡터를 이동 벡터에 적용 (가중치 적용)
        const separationWeight = 4.5; // 분리 힘의 강도 조절
        moveX += separationForce.x * separationWeight;
        moveY += separationForce.y * separationWeight;
        
        // 움직임 정규화 (속도 유지)
        const magnitude = Math.sqrt(moveX * moveX + moveY * moveY);
        if (magnitude > 0) {
            moveX = (moveX / magnitude) * this.speed;
            moveY = (moveY / magnitude) * this.speed;
        }
        
        // 실제 이동
        this.x += moveX;
        this.y += moveY;
        
        // 실제 이동 방향 계산 (UI 표시용)
        this.angle = Math.atan2(moveY, moveX);
        
        // 방향 설정 (왼쪽/오른쪽만)
        if (moveX < 0) {
            this.direction = 'left';
        } else {
            this.direction = 'right';
        }
        
        // 움직일 때 약간의 흔들림 효과
        this.wobbleAmount = Math.sin(this.animationTime * 0.01) * 2;
        
        // 스프라이트 애니메이션 프레임 업데이트
        this.frameTime += 16; // 약 60fps 기준
        if (this.frameTime >= this.frameDuration) {
            this.frameTime = 0;
            this.currentFrame = (this.currentFrame + 1) % this.frameCount;
        }

        // 공격 애니메이션 업데이트
        if (this.isAttacking) {
            const currentTime = Date.now();
            const elapsed = currentTime - this.attackStartTime;
            this.attackAnimationProgress = Math.min(elapsed / this.attackAnimationDuration, 1);
            
            // 공격 중 크기 변화 (찌그러지고 커지는 효과)
            const sizeMultiplier = 1 + Math.sin(this.attackAnimationProgress * Math.PI) * 0.5;
            this.currentSize = this.originalSize * sizeMultiplier;
            
            // 공격 애니메이션 종료
            if (this.attackAnimationProgress >= 1) {
                this.isAttacking = false;
                this.currentSize = this.originalSize;
            }
            
            // 파티클 업데이트
            this.updateAttackParticles();
            
            // 충격파 업데이트
            this.attackShockwave *= 0.9;
        }
    }
    
    // 공격 파티클 업데이트 메서드
    updateAttackParticles() {
        for (let particle of this.attackParticles) {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.05;
            particle.size *= 0.95;
            particle.vx *= 0.93;
            particle.vy *= 0.93;
        }
        
        // 죽은 파티클 제거
        this.attackParticles = this.attackParticles.filter(p => p.life > 0);
    }
    
    updateDying(currentTime) {
        const elapsedTime = currentTime - this.stateStartTime;
        const progress = Math.min(elapsedTime / this.deathDuration, 1);
        
        // 크기가 작아지면서 사라지는 애니메이션
        this.currentSize = this.size * (1 - this.easeInQuad(progress));
        
        // 파티클 업데이트
        this.updateDeathParticles();
        
        // 죽음 애니메이션이 끝나면 완전히 제거
        if (progress >= 1) {
            this.state = 'dead';
            this.die();
        }
    }

    startDying() {
        this.state = 'dying';
        this.stateStartTime = Date.now();
        
        // 죽음 파티클 생성
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            this.deathParticles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                size: 5,
                life: 1
            });
        }
        
        // 죽을 때 바로 보석 드랍
        jewels.push(new Jewel(this.x, this.y));
        score += 10;
    }

    updateDeathParticles() {
        for (let particle of this.deathParticles) {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.05;
            particle.size *= 0.95;
            particle.vx *= 0.95;
            particle.vy *= 0.95;
        }
    }

    draw(offsetX, offsetY) {
        const drawX = this.x + offsetX;
        const drawY = this.y + offsetY;
        
        // 상태에 따른 그리기
        switch(this.state) {
            case 'spawning':
                this.drawSpawning(drawX, drawY);
                break;
            case 'moving':
                this.drawMoving(drawX, drawY);
                break;
            case 'dying':
                this.drawDying(drawX, drawY, offsetX, offsetY);
                break;
        }

        // 공격 파티클 그리기
        if (this.attackParticles.length > 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            
            for (let particle of this.attackParticles) {
                ctx.fillStyle = particle.color;
                ctx.globalAlpha = particle.life;
                ctx.beginPath();
                ctx.arc(
                    particle.x + offsetX,
                    particle.y + offsetY,
                    particle.size,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
            
            ctx.restore();
        }
    }

    drawSpawning(drawX, drawY) {
        // 스폰 중일 때 - 반투명하게 나타나면서 커지는 효과
        const progress = (Date.now() - this.stateStartTime) / this.spawnDuration;
        ctx.globalAlpha = Math.min(progress, 1);
        
        // 스폰 서클 효과
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(drawX, drawY, this.currentSize * 1.5, 0, Math.PI * 2 * progress);
        ctx.stroke();
        
        // 스프라이트 또는 기본 형태
        if (enemySprite.complete) {
            const displaySize = this.currentSize * 2.5;
            
            // 스폰 시 기본 방향 설정
            const defaultDirection = player.x < this.x ? 'left' : 'right';
            const spriteY = defaultDirection === 'left' ? 0 : this.spriteHeight;
            
            ctx.drawImage(
                enemySprite,
                0, spriteY, // 기본 프레임, 적절한 방향
                this.spriteWidth, this.spriteHeight,
                drawX - displaySize / 2,
                drawY - displaySize / 2,
                displaySize,
                displaySize
            );
        } else {
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(drawX, drawY, this.currentSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1;
    }

    drawMoving(drawX, drawY) {
        // 이동 중일 때 스프라이트 그리기
        const pulse = 1 + Math.sin(this.animationTime * 0.005) * 0.05;
        const currentSize = this.currentSize * pulse;
        
        // 그림자 효과
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(drawX + 3, drawY + 5, currentSize * 0.8, currentSize * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 스프라이트 그리기
        if (enemySprite.complete) {
            // 방향에 따른 스프라이트 시트 Y 위치 (2줄만 사용)
            const spriteY = this.direction === 'left' ? 0 : this.spriteHeight;
            
            // 현재 프레임의 X 위치
            const spriteX = this.currentFrame * this.spriteWidth;
            
            // 스프라이트 크기 (적 크기에 맞춤)
            const displaySize = this.size * 2.5;
            
            ctx.save();
            ctx.drawImage(
                enemySprite,
                spriteX, spriteY,
                this.spriteWidth, this.spriteHeight,
                drawX - displaySize / 2 + this.wobbleAmount,
                drawY - displaySize / 2,
                displaySize,
                displaySize
            );
            ctx.restore();
        } else {
            // 스프라이트가 로드되지 않은 경우 기존 원 그리기
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(drawX + this.wobbleAmount, drawY, currentSize, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#8B0000';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // 체력바는 스폰 완료 후에만 표시
        if (this.state === 'moving') {
            this.drawHealthBar(drawX, drawY);
        }

        // 공격 중일 때 붉은 광선 효과
        if (this.isAttacking) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(drawX, drawY, this.size * 1.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // 공격 효과 그리기
        if (this.isAttacking) {
            // 충격파 효과
            if (this.attackShockwave > 0.1) {
                ctx.save();
                ctx.strokeStyle = `rgba(255, 0, 0, ${this.attackShockwave * 0.5})`;
                ctx.lineWidth = 5;
                ctx.beginPath();
                const shockwaveRadius = this.size * 2 * (1 + (1 - this.attackShockwave));
                ctx.arc(drawX, drawY, shockwaveRadius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
            
            // 공격 시 몸체 색상 변화
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = `rgba(255, 0, 0, ${0.5 * Math.sin(this.attackAnimationProgress * Math.PI)})`;
            ctx.beginPath();
            ctx.arc(drawX, drawY, this.currentSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // 에너지 링 효과
            const ringCount = 3;
            for (let i = 0; i < ringCount; i++) {
                const ringProgress = (this.attackAnimationProgress + i * 0.2) % 1;
                const ringRadius = this.size * (1 + ringProgress * 2);
                const ringAlpha = (1 - ringProgress) * 0.7;
                
                ctx.save();
                ctx.strokeStyle = `rgba(255, 100, 0, ${ringAlpha})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(drawX, drawY, ringRadius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        }
    }

    drawDying(drawX, drawY, offsetX, offsetY) {
        // 죽을 때 - 폭발 효과
        const progress = (Date.now() - this.stateStartTime) / this.deathDuration;
        ctx.globalAlpha = 1 - progress;
        
        // 파티클 그리기
        ctx.fillStyle = 'orange';
        for (let particle of this.deathParticles) {
            if (particle.life > 0) {
                ctx.globalAlpha = particle.life;
                ctx.beginPath();
                ctx.arc(
                    particle.x + offsetX, 
                    particle.y + offsetY, 
                    particle.size, 
                    0, 
                    Math.PI * 2
                );
                ctx.fill();
            }
        }
        
        // 축소되는 적 본체
        ctx.globalAlpha = 1 - progress;
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(drawX, drawY, this.currentSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
    }

    drawHealthBar(drawX, drawY) {
        // 체력바 그리기
        const barWidth = this.size * 2;
        const barHeight = 5;
        const barY = drawY - this.currentSize - 10;
        
        // 체력바 배경
        ctx.fillStyle = 'black';
        ctx.fillRect(
            drawX - barWidth/2,
            barY,
            barWidth,
            barHeight
        );
        
        // 체력바
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? 'green' : healthPercent > 0.25 ? 'yellow' : 'red';
        ctx.fillRect(
            drawX - barWidth/2,
            barY,
            barWidth * healthPercent,
            barHeight
        );
    }

    takeDamage(damage) {
        // 이동 중일 때만 데미지 받음
        if (this.state === 'moving') {
            this.health -= damage;
        }
    }

    die() {
        // 적 제거만 수행
        const index = enemies.indexOf(this);
        if (index !== -1) enemies.splice(index, 1);
    }

    // 이징 함수들(자연스러운 모션 전환)
    easeOutBack(t) {
        const c1 = 2;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
    
    easeInQuad(t) {
        return t * t;
    }

    // 적 분리 메서드
    calculateSeparation() {
        let separationX = 0;
        let separationY = 0;
        let neighborCount = 0;
        
        const separationRadius = this.size * 5;
        
        // 현재 적의 그리드 위치와 주변 그리드만 검사
        const gridX = Math.floor(this.x / ENEMY_SPATIAL_GRID_SIZE);
        const gridY = Math.floor(this.y / ENEMY_SPATIAL_GRID_SIZE);
        
        // 주변 9개 그리드만 검사 (현재 그리드 포함)
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const key = `${gridX + dx},${gridY + dy}`;
                const nearbyEnemies = enemySpatialGrid[key] || [];
                
                for (let enemy of nearbyEnemies) {
                    if (enemy === this || enemy.state !== 'moving') continue;
                    
                    const distX = this.x - enemy.x;
                    const distY = this.y - enemy.y;
                    const distance = Math.sqrt(distX * distX + distY * distY);
                    
                    if (distance < separationRadius && distance > 0) {
                        const force = (separationRadius - distance) / separationRadius;
                        separationX += (distX / distance) * force;
                        separationY += (distY / distance) * force;
                        neighborCount++;
                    }
                }
            }
        }
        
        if (neighborCount > 0) {
            separationX /= neighborCount;
            separationY /= neighborCount;
        }
        
        return { x: separationX, y: separationY };
    }

    //플레이어 밀어내기
    pushPlayer(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance > 0) {
            // 적이 플레이어를 미는 방향 (정규화)
            const pushX = (dx / distance) * 2; // 밀어내는 힘
            const pushY = (dy / distance) * 2;
            
            player.x += pushX;
            player.y += pushY;
        }
    }
    
    //플레이어 공격
    attackPlayer(player) {
        const currentTime = Date.now();
        
        if (currentTime - this.lastAttackTime >= this.attackCooldown) {
            player.health -= this.attackStrength;
            this.lastAttackTime = currentTime;
            
            // 공격 애니메이션 시작
            this.isAttacking = true;
            this.attackStartTime = currentTime;
            this.attackAnimationProgress = 0;
            
            // 공격 파티클 생성
            this.createAttackParticles();
            
            // 충격파 효과 시작
            this.attackShockwave = 1;
            
        // 화면 흔들림 효과 (데미지에 비례)
        screenShake = 2;
        screenShakeIntensity = Math.min(25, 10 + this.attackStrength * 0.5); // 데미지에 따라 흔들림 강도 조절
        screenShakeDuration = 1200; // 1.2초 동안 지속
        }
    }

    // 공격 파티클 생성 메서드
    createAttackParticles() {
        this.attackParticles = [];
        const particleCount = 12;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 2 + Math.random() * 3;
            
            this.attackParticles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 4,
                life: 1,
                color: Math.random() > 0.5 ? '#ff0000' : '#ff6600'
            });
        }
    }
}

class Jewel {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 8;
        this.collected = false;
    }

    update() {
        // Move towards the player if within attraction radius
        const attractionRadius = 100;
        if (detectCollision(this, { x: player.x, y: player.y, size: attractionRadius })) {
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.x += Math.cos(angle) * 2;
            this.y += Math.sin(angle) * 2;
        }
    }

    draw(offsetX, offsetY) {
        ctx.fillStyle = 'cyan';
        ctx.beginPath();
        ctx.arc(this.x + offsetX, this.y + offsetY, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    collect() {
        // Increase player's EXP
        const expGained = 20;
        player.exp += expGained;
        score += 5;
        this.checkLevelUp();
    }

    checkLevelUp() {
        if (player.exp >= player.nextLevelExp) {
            player.level += 1;
            player.prevLevelExp = player.nextLevelExp;
            player.nextLevelExp = Math.floor(player.nextLevelExp * 1.5);
            player.health = player.maxHealth; // Restore health on level up
            player.speed += 0.1; // Increase speed
            // Optionally, add new weapons or increase stats
            // For example, add a new weapon at certain levels
            if (player.level === 3) {
                player.weapons.push(new ShotgunWeapon());
            }
        }
    }
}

class Tree {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 20;
    }

    draw(offsetX, offsetY) {
        ctx.fillStyle = 'green';
        ctx.beginPath();
        ctx.arc(this.x + offsetX, this.y + offsetY, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Additional Weapons

class ShotgunWeapon extends Weapon {
    constructor() {
        super();
        this.attackSpeed = 2000;
    }

    fire() {
        const spread = 0.2;
        for (let i = -2; i <= 2; i++) {
            bullets.push(
                new Bullet(
                    player.x,
                    player.y,
                    5,
                    7,
                    Math.random() * Math.PI * 2 + spread * i,
                    8 // Damage
                )
            );
        }
    }
}

// Initialize the game
gameLoop();
