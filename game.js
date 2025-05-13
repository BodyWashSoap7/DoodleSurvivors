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

// 맵 타일 이미지 관련 변수 추가 (파일 상단에)
const mapTileImages = [];
const TILE_SIZE = 100; // 타일 크기
const MAP_TILES_COUNT = 4; // 맵 타일 이미지 개수
let tilesLoaded = false;

// Game state
const GAME_STATE = {
    START_SCREEN: 0,
    SETTINGS: 1,
    PLAYING: 2,
    GAME_OVER: 3,
    PAUSED: 4,
    LOADING: 5,
    CONFIRM_DIALOG: 6,
    LEVEL_UP: 7
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
    const expProgress = player.exp / player.nextLevelExp;
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

// 레벨업 선택 관련 변수
let levelUpOptions = [];
let selectedLevelUpOption = -1; // -1은 선택되지 않은 상태

// 레벨업 아이콘 이미지 관련 변수
const levelUpIcons = {};
let levelUpIconsLoaded = false;

// Player object
// 플레이어 객체
const player = {
    x: 0,
    y: 0,
    
    health: 100,
    level: 1,
    exp: 0,
    nextLevelExp: 50,
    prevLevelExp: 0,
    weapons: [],
    characterType: 1,
    image: null,
    
    size: 15,              // 크기
    speed: 3,              // 스피드
    maxHealth: 100,        // 최대체력
    attackPower: 1,        // 공격력 배율
    fireRate: 1,           // 공격속도 배율  
    projectileSpeed: 1,    // 투사체 속도 배율
    pickupRadius: 100,     // 아이템 획득 범위
    expMultiplier: 1,      // 경험치획득률
    
    // 애니메이션 관련 속성 추가
    animationState: 'idle', // 'idle' or 'walking'
    currentFrame: 0,
    frameCount: 4, // 스프라이트 시트의 프레임 수 (예: idle 4프레임, walking 4프레임)
    frameTime: 0,
    frameDuration: 150, // 각 프레임 지속 시간 (밀리초)
    spriteWidth: 64, // 스프라이트 한 프레임의 너비
    spriteHeight: 64, // 스프라이트 한 프레임의 높이
    lastMovementState: false, // 이동 상태 추적용
    
    // 방향 속성 추가
    direction: 'left', // 'left' or 'right'

    // 피격 효과 관련 속성 추가
    isHit: false,
    hitStartTime: 0,
    hitDuration: 500, // 0.5초 동안 빨간색 효과
    hitFrame: 0,
    hitFrameTime: 0,
    hitFrameDuration: 50 // 각 프레임 지속 시간 (밀리초)
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
        spriteWidth: 64, // 각 캐릭터별 스프라이트 크기 설정 가능
        spriteHeight: 64,
        frameCount: 4
    },
    { 
        name: '캐릭터 2', 
        image: new Image(),
        spriteWidth: 64,
        spriteHeight: 64,
        frameCount: 4
    },
    { 
        name: '캐릭터 3', 
        image: new Image(),
        spriteWidth: 64,
        spriteHeight: 64,
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

// 맵 타일 이미지 로드 함수
function loadMapTiles() {
    let loadedCount = 0;
    let errorCount = 0;
    
    // 모든 이미지가 로드되었거나 오류 발생 시 호출할 함수
    function checkAllLoaded() {
        if (loadedCount + errorCount === MAP_TILES_COUNT) {
            // 최소 하나 이상의 이미지가 로드되었으면 진행
            if (loadedCount > 0) {
                tilesLoaded = true;
                console.log(`맵 타일 이미지 로드 완료: ${loadedCount}개 성공, ${errorCount}개 실패`);
            } else {
                console.error('모든 맵 타일 이미지 로드 실패');
            }
        }
    }
    
    for (let i = 1; i <= MAP_TILES_COUNT; i++) {
        const img = new Image();
        
        // onload 핸들러 먼저 설정
        img.onload = function() {
            loadedCount++;
            checkAllLoaded();
        };
        
        // onerror 핸들러 추가
        img.onerror = function() {
            console.error(`맵 타일 이미지 로드 실패: map_tile_${i}.png`);
            errorCount++;
            
            // 실패 시 재시도 (최대 1회)
            setTimeout(() => {
                console.log(`맵 타일 이미지 재시도: map_tile_${i}.png`);
                img.src = `./img/map_tile_${i}.png?retry=${Date.now()}`;
            }, 1000);
        };
        
        // src 속성 설정은 이벤트 핸들러 설정 후에
        img.src = `./img/map_tile_${i}.png`;
        mapTileImages.push(img);
    }
    
    // 5초 후에도 로드가 안 되면 강제로 진행
    setTimeout(() => {
        if (!tilesLoaded && loadedCount > 0) {
            tilesLoaded = true;
            console.log(`시간 초과로 인한 맵 타일 이미지 로드 중단: ${loadedCount}개 성공`);
        }
    }, 5000);
}

// 이미지 로딩 관련 변수 추가
const treasureImage = new Image();
let treasureImageLoaded = false;

// 아티팩트 아이콘 이미지 관련 변수
const artifactIcons = {};
let artifactIconsLoaded = false;

// 피격 이미지 로드 변수 추가
const hitEffectImage = new Image();
let hitEffectLoaded = false;
const HIT_FRAME_COUNT = 4; // 프레임 수
const HIT_FRAME_WIDTH = 64; // 각 프레임 너비

// 이미지 로딩 함수 추가
function loadGameImages() {
    // 기존 이미지 로딩
    loadCharacterImages();
    loadMapTiles();
    loadLevelUpIcons();
    
    // Treasure 이미지 로드
    treasureImage.src = './img/treasure.png';
    treasureImage.onload = function() {
        treasureImageLoaded = true;
        console.log('보물 이미지 로드 완료');
    };
    
    // 피격 효과 이미지 로드
    hitEffectImage.src = './img/hit_effect.png';
    hitEffectImage.onload = function() {
        hitEffectLoaded = true;
        console.log('피격 효과 이미지 로드 완료');
    };
    hitEffectImage.onerror = function() {
        console.error('피격 효과 이미지 로드 실패');
    };
    
    // 아티팩트 아이콘 로드
    loadArtifactIcons();
}

// 아티팩트 아이콘 로드 함수
function loadArtifactIcons() {
    const artifactTypes = [
        'reducePlayerSize',
        'increaseAttackPower',
        'increaseFireRate',
        'increaseMoveSpeed',
        'enableHealthRegen',
        'reduceEnemySpeed',
        'reduceEnemyHealth',
        'expGain'  // 경험치 획득용 아이콘 추가
    ];
    
    let loadedCount = 0;
    
    artifactTypes.forEach(type => {
        artifactIcons[type] = new Image();
        artifactIcons[type].src = `./img/artifacts/${type}_icon.png`;
        
        artifactIcons[type].onload = function() {
            loadedCount++;
            if (loadedCount === artifactTypes.length) {
                artifactIconsLoaded = true;
                console.log('모든 아티팩트 아이콘 로드 완료');
            }
        };
        
        artifactIcons[type].onerror = function() {
            console.error(`아티팩트 아이콘 로드 실패: ${type}`);
            // 로드 실패 시 다음 이미지로 계속 진행
            loadedCount++;
            if (loadedCount === artifactTypes.length) {
                artifactIconsLoaded = true;
            }
        };
    });
}

// 게임 초기화 시 모든 이미지 로드 호출
loadGameImages();

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

    // 레벨업 화면에서의 키 입력 처리
    else if (currentGameState === GAME_STATE.LEVEL_UP) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
            e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            // 방향키로 선택
            selectLevelUpOption(e.key);
            e.preventDefault();
        } else if (e.key === 'Enter') {
            // 선택한 옵션이 있을 때만 적용
            if (selectedLevelUpOption !== -1) {
                applyLevelUpChoice();
            }
            e.preventDefault();
        }
    }

    // 레벨업/아티팩트 선택 화면에서의 키 입력 처리
    else if (currentGameState === GAME_STATE.LEVEL_UP) {
        // 옵션 수에 따라 다르게 처리
        if (levelUpOptions.length === 1) {
            selectedLevelUpOption = 0;
            if (e.key === 'Enter') {
                applyLevelUpChoice();
                e.preventDefault();
            }
        } else if (levelUpOptions.length === 2) {
            if (e.key === 'ArrowLeft') {
                selectedLevelUpOption = 0;
                e.preventDefault();
            } else if (e.key === 'ArrowRight') {
                selectedLevelUpOption = 1;
                e.preventDefault();
            } else if (e.key === 'Enter') {
                applyLevelUpChoice();
                e.preventDefault();
            }
        } else {
            // 3-4개 옵션의 경우 기존 방향키 처리 사용
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
                e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                selectLevelUpOption(e.key);
                e.preventDefault();
            } else if (e.key === 'Enter') {
                if (selectedLevelUpOption !== -1) {
                    applyLevelUpChoice();
                }
                e.preventDefault();
            }
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
        } else if (currentGameState === GAME_STATE.LEVEL_UP) {
            // 레벨업 화면에서 ESC를 누르면 일시정지 화면으로 전환
            previousGameState = currentGameState;
            currentGameState = GAME_STATE.PAUSED;
            pauseStartTime = Date.now(); // 일시정지 시작 시간 기록
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

// 레벨업 옵션 선택 함수
function selectLevelUpOption(key) {
    switch(key) {
        case 'ArrowUp':
            selectedLevelUpOption = 0;
            break;
        case 'ArrowLeft':
            selectedLevelUpOption = 1;
            break;
        case 'ArrowRight':
            selectedLevelUpOption = 2;
            break;
        case 'ArrowDown':
            selectedLevelUpOption = 3;
            break;
    }
}

// 레벨업 선택 적용 함수
function applyLevelUpChoice() {
    // 선택된 옵션이 없으면 리턴
    if (selectedLevelUpOption === -1 || !levelUpOptions[selectedLevelUpOption]) {
        return;
    }
    
    const option = levelUpOptions[selectedLevelUpOption];

    if (option.type === 'weapon') {
        // 새 무기 추가
        addWeapon(option.weaponType);
    } else {
        // 기존 능력치 업그레이드 (기존 코드)
        switch(option.type) {
            case 'attackPower':
                player.attackPower += option.value;
                break;
            case 'maxHealth':
                player.maxHealth += option.value;
                player.health = player.maxHealth;
                break;
            // ... 다른 옵션 처리
        }
    }

    
    if (isArtifactSelection) {
        // 아티팩트 효과 적용
        switch(option.type) {
            case 'reducePlayerSize':
                player.size *= 0.75;
                break;
            case 'increaseAttackPower':
                player.attackPower *= 1.5;
                break;
            case 'increaseFireRate':
                player.fireRate *= 1.5;
                player.weapons.forEach(weapon => {
                    weapon.updateFireRate(player.fireRate);
                });
                break;
            case 'increaseMoveSpeed':
                player.speed *= 1.5;
                break;
            case 'enableHealthRegen':
                player.healthRegeneration = 0.02; // 2% per second
                break;
            case 'reduceEnemySpeed':
                player.enemySpeedReduction = 0.5; // 50% reduction
                break;
            case 'reduceEnemyHealth':
                player.enemyHealthReduction = 0.25; // 25% reduction
                break;
            case 'expGain':
                // 경험치 획득
                player.exp += option.value;
                // 레벨업 체크
                const jewelTemp = new Jewel(0, 0);
                jewelTemp.checkLevelUp();
                break;
        }
        
        // 아티팩트 ID 기록 (경험치 옵션이 아닌 경우)
        if (option.artifactId && option.artifactId !== 0) {
            player.acquiredArtifacts.push(option.artifactId);
        }
        
        isArtifactSelection = false;
    } else {
        // 기존 레벨업 옵션 적용
        switch(option.type) {
            case 'attackPower':
                player.attackPower += option.value;
                break;
            case 'maxHealth':
                player.maxHealth += option.value;
                player.health = player.maxHealth; // 체력 회복
                break;
            case 'fireRate':
                player.fireRate += option.value;
                player.weapons.forEach(weapon => {
                    weapon.updateFireRate(player.fireRate);
                });
                break;
            case 'projectileSpeed':
                player.projectileSpeed += option.value;
                break;
            case 'moveSpeed':
                player.speed += option.value;
                break;
            case 'pickupRadius':
                player.pickupRadius += option.value;
                break;
            case 'expMultiplier':
                player.expMultiplier += option.value;
                break;
        }
    }
    
    // 게임 재개
    currentGameState = GAME_STATE.PLAYING;
    
    // 일시정지된 시간 업데이트
    totalPausedTime += Date.now() - pauseStartTime;
}

// 레벨업 옵션 생성 함수
function generateLevelUpOptions() {
    // 기존 레벨업 옵션에 무기 옵션 추가
    const allUpgrades = [
        { type: 'attackPower', name: '공격력 증가', value: 0.2, description: '공격력 +20%' },
        { type: 'maxHealth', name: '최대 체력 증가', value: 20, description: '최대 체력 +20' },
        { type: 'fireRate', name: '공격속도 증가', value: 0.15, description: '공격속도 +15%' },
        { type: 'projectileSpeed', name: '투사체 속도', value: 0.2, description: '투사체 속도 +20%' },
        { type: 'moveSpeed', name: '이동속도 증가', value: 0.3, description: '이동속도 +0.3' },
        { type: 'pickupRadius', name: '획득 범위 증가', value: 20, description: '아이템 획득 범위 +20' },
        { type: 'expMultiplier', name: '경험치 증가', value: 0.1, description: '경험치 획득량 +10%' },
        
        // 무기 옵션들
        { type: 'weapon', weaponType: 'orbit', name: '회전 구체', description: '플레이어 주변을 회전하며 공격' },
        { type: 'weapon', weaponType: 'flamethrower', name: '화염방사기', description: '넓은 범위의 지속 데미지' },
        { type: 'weapon', weaponType: 'lightning', name: '번개 사슬', description: '적들 사이를 튀는 번개' },
        { type: 'weapon', weaponType: 'boomerang', name: '부메랑', description: '던졌다가 돌아오는 무기' },
        { type: 'weapon', weaponType: 'soul', name: '영혼 폭발', description: '주변의 모든 적에게 데미지' },
        { type: 'weapon', weaponType: 'axe', name: '도끼 던지기', description: '회전하며 날아가는 도끼' },
        { type: 'weapon', weaponType: 'wave', name: '파동', description: '주변으로 퍼지는 충격파' },
        { type: 'weapon', weaponType: 'bible', name: '바이블', description: '주변을 회전하는 책' }
    ];
    
    // 플레이어가 이미 가지고 있는 무기 필터링
    const playerWeaponTypes = player.weapons.map(w => w.constructor.name);
    const availableUpgrades = allUpgrades.filter(upgrade => {
        if (upgrade.type === 'weapon') {
            // 이미 가지고 있는 무기 타입은 제외
            const weaponClassName = upgrade.weaponType.charAt(0).toUpperCase() + 
                                   upgrade.weaponType.slice(1) + 'Weapon';
            return !playerWeaponTypes.includes(weaponClassName);
        }
        return true;
    });
    
    // 랜덤하게 4개 선택
    levelUpOptions = [];
    const shuffled = [...availableUpgrades].sort(() => Math.random() - 0.5);
    levelUpOptions = shuffled.slice(0, 4);
    selectedLevelUpOption = -1; // 초기에는 아무것도 선택되지 않은 상태
}

// 레벨업 아이콘 이미지 로드 함수
function loadLevelUpIcons() {
    const iconTypes = [
        'attackPower',
        'maxHealth',
        'fireRate',
        'projectileSpeed',
        'moveSpeed',
        'pickupRadius',
        'expMultiplier'
    ];
    
    let loadedCount = 0;
    
    iconTypes.forEach(type => {
        levelUpIcons[type] = new Image();
        levelUpIcons[type].src = `./img/levelup/${type}_icon.png`;
        
        levelUpIcons[type].onload = function() {
            loadedCount++;
            if (loadedCount === iconTypes.length) {
                levelUpIconsLoaded = true;
                console.log('모든 레벨업 아이콘 로드 완료');
            }
        };
        
        levelUpIcons[type].onerror = function() {
            console.error(`레벨업 아이콘 로드 실패: ${type}`);
            // 로드 실패시 기본 이미지 사용하거나 null로 설정
            levelUpIcons[type] = null;
            loadedCount++;
            if (loadedCount === iconTypes.length) {
                levelUpIconsLoaded = true;
            }
        };
    });
}


// allArtifacts 배열
const allArtifacts = [
    { id: 1, name: '작은 체구', description: '크기 25% 감소', effect: 'reducePlayerSize' },
    { id: 2, name: '강력한 공격', description: '공격력 50% 증가', effect: 'increaseAttackPower' },
    { id: 3, name: '빠른 손놀림', description: '공격속도 50% 증가', effect: 'increaseFireRate' },
    { id: 4, name: '신속한 발걸음', description: '이동속도 50% 증가', effect: 'increaseMoveSpeed' },
    { id: 5, name: '생명의 샘', description: '초당 체력 2% 회복', effect: 'enableHealthRegen' },
    { id: 6, name: '적 둔화', description: '적 이동속도 50% 감소', effect: 'reduceEnemySpeed' },
    { id: 7, name: '약화된 적', description: '적 체력 25% 감소', effect: 'reduceEnemyHealth' }
];

// 아티팩트 관련 전역 변수 추가
let isArtifactSelection = false;

// 아티팩트 선택지 생성 함수
function generateArtifactOptions() {
    // 이미 획득한 아티팩트 제외
    const availableArtifacts = allArtifacts.filter(artifact => 
        !player.acquiredArtifacts.includes(artifact.id));
    
    // 가능한 아티팩트가 없으면 경험치 제공
    if (availableArtifacts.length === 0) {
        const xpGain = Math.floor((player.nextLevelExp) * 0.3);
        levelUpOptions = [{
            type: 'expGain',  // 이 타입에 맞는 아이콘 이미지 필요
            name: '경험치 획득',
            description: `${xpGain} 경험치 획득 (30%)`,
            value: xpGain,
            artifactId: 0
        }];
    } else {
        // 랜덤하게 4개 선택 (또는 가능한 모든 아티팩트)
        const shuffled = [...availableArtifacts].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(4, availableArtifacts.length));
        
        // 레벨업 옵션 형식으로 변환
        levelUpOptions = selected.map(artifact => ({
            type: artifact.effect,
            name: artifact.name,
            description: artifact.description,
            artifactId: artifact.id
        }));
    }
    
    selectedLevelUpOption = -1;
    isArtifactSelection = true;
}

function drawLevelUpScreen() {
    // 배경
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 제목
    ctx.fillStyle = isArtifactSelection ? '#FFD700' : '#66fcf1';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
        isArtifactSelection ? '보물 발견!' : 'LEVEL UP!', 
        canvas.width / 2, 50
    );
    
    // 부제목
    if (isArtifactSelection) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '24px Arial';
        ctx.fillText('아티팩트를 선택하세요', canvas.width / 2, 90);
    } else {
        // 레벨 표시
        ctx.fillStyle = '#ffff00';
        ctx.font = '24px Arial';
        ctx.fillText(`LEVEL ${player.level}`, canvas.width / 2, canvas.height - 40);
    }
    
    // 중앙 위치
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // 옵션 박스 크기
    const boxWidth = 320;
    const boxHeight = 150;
    
    // 옵션 그리기 - 옵션 수에 따라 다른 레이아웃 사용
    if (levelUpOptions.length === 1) {
        // 하나만 있는 경우 중앙에 표시
        drawOptionBox(centerX - boxWidth/2, centerY - boxHeight/2, 
                     boxWidth, boxHeight, levelUpOptions[0], selectedLevelUpOption === 0);
    } else if (levelUpOptions.length === 2) {
        // 둘인 경우 좌우로 표시
        drawOptionBox(centerX - boxWidth - 20, centerY - boxHeight/2,
                     boxWidth, boxHeight, levelUpOptions[0], selectedLevelUpOption === 0);
        drawOptionBox(centerX + 20, centerY - boxHeight/2,
                     boxWidth, boxHeight, levelUpOptions[1], selectedLevelUpOption === 1);
    } else {
        // 3-4개인 경우 원래 레이아웃 사용
        // 위쪽 옵션 (상)
        if (levelUpOptions[0]) {
            drawOptionBox(centerX - boxWidth/2, centerY - 160 - boxHeight/2, 
                         boxWidth, boxHeight, levelUpOptions[0], selectedLevelUpOption === 0);
        }
        
        // 왼쪽 옵션 (좌)
        if (levelUpOptions[1]) {
            drawOptionBox(centerX - 230 - boxWidth/2, centerY - boxHeight/2,
                         boxWidth, boxHeight, levelUpOptions[1], selectedLevelUpOption === 1);
        }
        
        // 오른쪽 옵션 (우)
        if (levelUpOptions[2]) {
            drawOptionBox(centerX + 230 - boxWidth/2, centerY - boxHeight/2,
                         boxWidth, boxHeight, levelUpOptions[2], selectedLevelUpOption === 2);
        }
        
        // 아래쪽 옵션 (하)
        if (levelUpOptions[3]) {
            drawOptionBox(centerX - boxWidth/2, centerY + 160 - boxHeight/2,
                         boxWidth, boxHeight, levelUpOptions[3], selectedLevelUpOption === 3);
        }
    }
    
    // 방향키 그리기
    if (levelUpOptions.length > 2) {
        drawArrowKeys(centerX, centerY);
    }

    // 플레이어 캐릭터 그리기 (중앙에)
    if (!isArtifactSelection && player.image && player.image.complete) {
        const playerDisplaySize = player.size * 4;
        const spriteX = player.currentFrame * player.spriteWidth;
        const spriteY = player.animationState === 'idle' ? 0 : player.spriteHeight;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        if (player.direction === 'right') ctx.scale(-1, 1);
        
        ctx.drawImage(
            player.image,
            spriteX, spriteY,
            player.spriteWidth, player.spriteHeight,
            -playerDisplaySize / 2,
            -playerDisplaySize / 2,
            playerDisplaySize,
            playerDisplaySize
        );
        
        ctx.restore();
    } else if (isArtifactSelection) {
        // PNG 이미지로 보물상자 그리기
        if (treasureImageLoaded) {
            const treasureSize = 64;
            ctx.drawImage(
                treasureImage,
                centerX - treasureSize/2,
                centerY - treasureSize/2,
                treasureSize,
                treasureSize
            );
        } else {
            // 이미지가 로드되지 않은 경우 기본 사각형
            ctx.fillStyle = '#DAA520';
            ctx.fillRect(centerX - 32, centerY - 32, 64, 64);
        }
    }
}

//옵션 그리기 함수
function drawOptionBox(x, y, width, height, option, isSelected) {
    // 아티팩트 선택인지 레벨업 선택인지에 따라 색상 변경
    const bgColor = isArtifactSelection ? 
        (isSelected ? 'rgba(218, 165, 32, 0.8)' : 'rgba(139, 69, 19, 0.8)') :
        (isSelected ? 'rgba(69, 162, 158, 0.8)' : 'rgba(31, 40, 51, 0.8)');
    
    const borderColor = isArtifactSelection ?
        (isSelected ? '#FFD700' : '#CD853F') :
        (isSelected ? '#66fcf1' : '#45a29e');
    
    // 박스 배경
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, width, height);
    
    // 박스 테두리
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = isSelected ? 3 : 1;
    ctx.strokeRect(x, y, width, height);
    
    // 아이콘 위치
    const iconSize = 64;
    const iconX = x + 20;
    const iconY = y + (height - iconSize) / 2;
    
    // 아이콘 그리기 (레벨업, 아티팩트 둘 다 PNG 사용)
    if (isArtifactSelection) {
        // 아티팩트 아이콘 (PNG 이미지)
        if (artifactIconsLoaded && artifactIcons[option.type]) {
            ctx.drawImage(artifactIcons[option.type], iconX, iconY, iconSize, iconSize);
        } else {
            // 대체 아이콘
            ctx.fillStyle = isSelected ? '#FFD700' : '#CD853F';
            ctx.fillRect(iconX, iconY, iconSize, iconSize);
            ctx.strokeStyle = '#FFFFFF';
            ctx.strokeRect(iconX, iconY, iconSize, iconSize);
            
            // 타입의 첫 글자
            ctx.fillStyle = '#000000';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            const letter = option.type.charAt(0).toUpperCase();
            ctx.fillText(letter, iconX + iconSize/2, iconY + iconSize/2 + 10);
        }
    } else {
        // 레벨업 아이콘 (기존과 동일)
        if (levelUpIconsLoaded && levelUpIcons[option.type]) {
            ctx.drawImage(levelUpIcons[option.type], iconX, iconY, iconSize, iconSize);
        } else {
            // 대체 아이콘
            ctx.fillStyle = isSelected ? '#ffff00' : '#66fcf1';
            ctx.fillRect(iconX, iconY, iconSize, iconSize);
            ctx.strokeStyle = '#ffffff';
            ctx.strokeRect(iconX, iconY, iconSize, iconSize);
            
            // 타입의 첫 글자
            ctx.fillStyle = '#000000';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            const letter = option.type.charAt(0).toUpperCase();
            ctx.fillText(letter, iconX + iconSize/2, iconY + iconSize/2 + 10);
        }
    }
    
    // 텍스트 영역
    const textX = x + 120;
    
    // 옵션 이름
    ctx.fillStyle = isSelected ? '#FFFFFF' : (isArtifactSelection ? '#F0E68C' : '#ffffff');
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(option.name, textX, y + height/2 - 10);
    
    // 옵션 설명
    ctx.fillStyle = isSelected ? (isArtifactSelection ? '#F0E68C' : '#ffffff') : '#c5c6c7';
    ctx.font = '18px Arial';
    ctx.fillText(option.description, textX, y + height/2 + 20);
}

// 방향키 안내 그리기 함수
function drawArrowKeys(centerX, centerY) {
    const keySize = 30;
    const keySpacing = 40;
    
    // 상
    drawKey(centerX - keySize/2, centerY - keySpacing - keySize/2, keySize, '↑', selectedLevelUpOption === 0);
    
    // 좌
    drawKey(centerX - keySpacing - keySize/2, centerY - keySize/2, keySize, '←', selectedLevelUpOption === 1);
    
    // 우
    drawKey(centerX + keySpacing - keySize/2, centerY - keySize/2, keySize, '→', selectedLevelUpOption === 2);
    
    // 하
    drawKey(centerX - keySize/2, centerY + keySpacing - keySize/2, keySize, '↓', selectedLevelUpOption === 3);
}

// 방향키 그리기 함수
function drawKey(x, y, size, arrow, isSelected) {
    // 선택되지 않은 상태도 고려
    ctx.fillStyle = isSelected ? '#ffff00' : '#666666';
    ctx.fillRect(x, y, size, size);
    
    ctx.strokeStyle = isSelected ? '#66fcf1' : '#999999';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);
    
    ctx.fillStyle = isSelected ? '#000000' : '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(arrow, x + size/2, y + size/2 + 6);
}

// pauseGame 함수
function pauseGame() {
    if (currentGameState === GAME_STATE.PLAYING || 
        currentGameState === GAME_STATE.LEVEL_UP) {
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
        
        // 이전 상태로 복귀 (레벨업 화면 또는 플레이 화면)
        currentGameState = previousGameState;
    }
}

// 일시정지 화면 그리기 함수 수정
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
        } else if (currentGameState === GAME_STATE.LEVEL_UP) {
            // 게임 화면을 배경으로 그리기
            draw();
            // 레벨업 선택 화면 그리기
            drawLevelUpScreen();
        } else if (currentGameState === GAME_STATE.START_SCREEN) {
            drawStartScreen();
        } else if (currentGameState === GAME_STATE.SETTINGS) {
            drawSettingsScreen();
        } else if (currentGameState === GAME_STATE.GAME_OVER) {
            drawGameOverScreen();
        } else if (currentGameState === GAME_STATE.PAUSED) {
            // 일시정지 전 화면에 따라 배경 다르게 그리기
            if (previousGameState === GAME_STATE.LEVEL_UP) {
                // 레벨업 화면을 배경으로 그리기
                draw(); // 게임 화면 먼저 그리기
                drawLevelUpScreen(); // 그 위에 레벨업 화면 그리기
            } else {
                // 기존처럼 게임 화면만 그리기
                draw();
            }
            
            // 그 위에 일시정지 화면 그리기
            drawPauseScreen();
        } else if (currentGameState === GAME_STATE.CONFIRM_DIALOG) {
            // 확인 대화상자 배경도 동일하게 처리
            if (previousGameState === GAME_STATE.LEVEL_UP) {
                draw();
                drawLevelUpScreen();
            } else {
                draw();
            }
            
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
        
        // 방향 업데이트
        if (dx < 0) {
            player.direction = 'left';
        } else if (dx > 0) {
            player.direction = 'right';
        }
    }
    
    if (player.isHit) {
        const currentTime = Date.now();
        
        // 프레임 업데이트
        player.hitFrameTime += 16; // 약 60fps 기준
        if (player.hitFrameTime >= player.hitFrameDuration) {
            player.hitFrameTime = 0;
            player.hitFrame = (player.hitFrame + 1) % HIT_FRAME_COUNT;
            
            // 애니메이션이 한 사이클 완료되면 피격 상태 종료
            if (player.hitFrame === 0 && currentTime - player.hitStartTime >= player.hitDuration) {
                player.isHit = false;
            }
        }
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
        // outOfBounds 메서드가 있는지 확인하고 호출
        if (bullets[i].used || (typeof bullets[i].outOfBounds === 'function' && bullets[i].outOfBounds())) {
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

    // 체력 재생 적용 (아티팩트 효과)
    if (player.healthRegeneration > 0) {
        const regenAmount = player.maxHealth * player.healthRegeneration / 60; // 60fps 기준
        player.health = Math.min(player.health + regenAmount, player.maxHealth);
    }
    
    // Treasure와의 충돌 확인
    for (let i = terrain.length - 1; i >= 0; i--) {
        const feature = terrain[i];
        if (feature instanceof Treasure) {
            feature.update();
            if (detectCollision(player, feature) && !feature.collected) {
                feature.collect();
                terrain.splice(i, 1); // 획득 후 제거
            }
        }
    }
}

// Draw Game Objects
function draw() {
    let screenOffsetX = 0;
    let screenOffsetY = 0;
    
    // 단순한 좌우 진동 효과
    if (screenShakeTime > 0) {
        // 시간에 따라 좌우로 진동
        const vibrationSpeed = 0.08; // 진동 속도
        const time = Date.now() * vibrationSpeed;
        
        // 좌우로만 진동 (단순한 사인파)
        screenOffsetX = Math.sin(time) * screenShakeIntensity;
        
        // 시간이 지나면서 강도 감소
        const fadeProgress = screenShakeTime / 400;
        screenOffsetX *= fadeProgress;
        
        // 시간 감소
        screenShakeTime -= 16; // 약 60fps 기준
    }
    
    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate camera offset to center the player (흔들림 효과 적용)
    const offsetX = canvas.width / 2 - player.x + screenOffsetX;
    const offsetY = canvas.height / 2 - player.y + screenOffsetY;

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
        
        // 피격 상태일 때
        if (player.isHit) {
            // 임시 캔버스 생성
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = playerSize * 2;
            tempCanvas.height = playerSize * 2;
            const tempCtx = tempCanvas.getContext('2d');
            
            // 오른쪽 방향일 때 좌우반전 처리
            if (player.direction === 'right') {
                tempCtx.translate(tempCanvas.width, 0);
                tempCtx.scale(-1, 1);
            }
            
            // 플레이어 이미지를 임시 캔버스에 그리기
            tempCtx.drawImage(
                player.image,
                spriteX, spriteY,
                player.spriteWidth, player.spriteHeight,
                0, 0,
                playerSize * 2,
                playerSize * 2
            );
            
            // 좌우반전 원복
            if (player.direction === 'right') {
                tempCtx.setTransform(1, 0, 0, 1, 0, 0);
            }
            
            // 피격 효과의 진행도 계산 (깜빡임 효과)
            const currentTime = Date.now();
            const hitProgress = (currentTime - player.hitStartTime) / player.hitDuration;
            const blinkSpeed = 10; // 깜빡임 속도
            const alpha = Math.abs(Math.sin(hitProgress * Math.PI * blinkSpeed)) * 0.8;
            
            // 빨간색 오버레이 효과 (투명한 부분 제외)
            tempCtx.globalCompositeOperation = 'source-atop';
            tempCtx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
            tempCtx.fillRect(0, 0, playerSize * 2, playerSize * 2);
            
            // 최종 이미지를 메인 캔버스에 그리기
            ctx.drawImage(
                tempCanvas,
                canvas.width / 2 - playerSize,
                canvas.height / 2 - playerSize
            );
            
            // 피격 효과 이미지 그리기
            if (hitEffectLoaded) {
                // 히트 효과 이미지에서 현재 프레임 계산
                const hitFrameX = player.hitFrame * HIT_FRAME_WIDTH;
                const hitEffectSize = playerSize * 2; // 피격 효과 크기
                
                ctx.drawImage(
                    hitEffectImage,
                    hitFrameX, 0,
                    HIT_FRAME_WIDTH, HIT_FRAME_WIDTH,
                    canvas.width / 2 - hitEffectSize / 2,
                    canvas.height / 2 - hitEffectSize / 2,
                    hitEffectSize,
                    hitEffectSize
                );
            }
        } else {
            // 일반 상태일 때 기존 코드
            ctx.save();
            
            // 캔버스 중앙으로 이동
            ctx.translate(canvas.width / 2, canvas.height / 2);
            
            // 오른쪽 방향일 때 좌우반전
            if (player.direction === 'right') {
                ctx.scale(-1, 1);
            }
            
            // 이미지를 중앙에 그리기
            ctx.drawImage(
                player.image,
                spriteX, spriteY,
                player.spriteWidth, player.spriteHeight,
                -playerSize, // x를 -playerSize로 설정하여 중앙 정렬
                -playerSize, // y를 -playerSize로 설정하여 중앙 정렬
                playerSize * 2,
                playerSize * 2
            );
            
            ctx.restore();
        }
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

// generateChunk 함수
function generateChunk(chunkX, chunkY) {
    const chunk = {
        items: [],
        terrain: [],
    };

    // 아이템 생성 (jewels)
    const itemCount = 3; // 필요에 따라 조정
    for (let i = 0; i < itemCount; i++) {
        const x = chunkX * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
        const y = chunkY * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
        const jewel = new Jewel(x, y);
        chunk.items.push(jewel);
        jewels.push(jewel); // 메인 jewels 배열에 추가
    }

    // Treasure 생성 (10% 확률)
    if (Math.random() < 0.1) {
        const x = chunkX * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
        const y = chunkY * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
        const treasure = new Treasure(x, y);
        chunk.terrain.push(treasure);
        terrain.push(treasure); // 메인 terrain 배열에 추가
    }

    // 청크 저장
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
    // 아티팩트 효과 적용
        const enemySpeed = (0.5 + Math.random() * 0.1) * (1 - player.enemySpeedReduction);
        const enemyHealth = Math.floor((5 + Math.floor((player.level - 1) * 1.5)) * (1 - player.enemyHealthReduction));
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

// Add this function to calculate XP requirements based on levels
function getXPForNextLevel(currentLevel) {
    let xp;
    
    // Level 1 to 2: 50 XP
    if (currentLevel === 1) {
        xp = 50;
    }
    // Level 2 to 20: Increases by 100 XP each level
    else if (currentLevel <= 19) {
        xp = 50 + ((currentLevel - 1) * 100);
    }
    // Level 20 to 40: Increases by 130 XP each level
    else if (currentLevel <= 39) {
        xp = 50 + (19 * 100) + ((currentLevel - 20) * 130);
    }
    // Level 40 onwards: Increases by 160 XP each level
    else {
        xp = 50 + (19 * 100) + (20 * 130) + ((currentLevel - 40) * 160);
    }
    
    // Special cases: Additional XP at levels 10 and 30
    if (currentLevel === 9) {
        xp += 5000; // Additional 5000 XP to reach level 10
    }
    else if (currentLevel === 29) {
        xp += 20000; // Additional 20000 XP to reach level 30
    }
    
    return xp;
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
    //플레이어 능력치 초기화
    player.x = 0;
    player.y = 0;
    player.health = player.maxHealth;
    player.level = 1;
    player.exp = 0;
    player.nextLevelExp = 50;
    player.prevLevelExp = 0;
    player.weapons = [new BasicWeapon()];
    
    // 아티팩트 관련 속성 초기화
    player.acquiredArtifacts = [];
    player.healthRegeneration = 0;
    player.enemySpeedReduction = 0;
    player.enemyHealthReduction = 0;

    //오브젝트 초기화
    bullets = [];
    enemies = [];
    jewels = [];
    terrain = [];
    chunks = {};
    score = 0;
    
    // 능력치 초기화
    player.attackPower = 1;
    player.fireRate = 1;
    player.projectileSpeed = 1;
    player.pickupRadius = 100;
    player.expMultiplier = 1;
    
    // 애니메이션 상태 초기화
    player.animationState = 'idle';
    player.currentFrame = 0;
    player.frameTime = 0;
    
    // 피격 상태 초기화
    player.isHit = false;
    player.hitStartTime = 0;
    player.hitFrame = 0;
    player.hitFrameTime = 0;
    hitFrameDuration = 100;

    // 방향 초기화
    player.direction = 'left';
    
    // 시간 초기화
    elapsedTime = 0;
    totalPausedTime = 0;
    
    // 화면 흔들림 초기화
    screenShakeTime = 0;
    screenShakeIntensity = 0;
    screenShakeX = 0;
    screenShakeY = 0;
}

function restartGame() {
    resetGame();
    currentGameState = GAME_STATE.START_SCREEN;
}

// 위치 기반 랜덤 시드 함수 (같은 위치는 항상 같은 타일이 나오도록)
function getTileIndex(tileX, tileY) {
    // 간단한 해시 함수를 사용하여 랜덤하지만 일관된 타일 인덱스 생성
    const hash = Math.abs((tileX * 73856093) ^ (tileY * 19349663)) % MAP_TILES_COUNT;
    return hash;
}

// drawBackground 함수
function drawBackground(offsetX, offsetY) {
    if (!tilesLoaded) {
        drawGridBackground(offsetX, offsetY);
        return;
    }
    
    // 플레이어 위치를 기준으로 타일 시작 위치 계산
    const playerTileX = Math.floor(player.x / TILE_SIZE);
    const playerTileY = Math.floor(player.y / TILE_SIZE);
    
    // 화면에 보이는 타일 개수 계산 (여유 있게 더 많이 그림)
    const tilesX = Math.ceil(canvas.width / TILE_SIZE) + 3;
    const tilesY = Math.ceil(canvas.height / TILE_SIZE) + 3;
    
    // 시작 타일 위치
    const startTileX = playerTileX - Math.floor(tilesX / 2);
    const startTileY = playerTileY - Math.floor(tilesY / 2);
    
    // 타일 그리기
    for (let tileY = startTileY; tileY < startTileY + tilesY; tileY++) {
        for (let tileX = startTileX; tileX < startTileX + tilesX; tileX++) {
            const tileIndex = getTileIndex(tileX, tileY);
            const tileImage = mapTileImages[tileIndex];
            
            if (tileImage && tileImage.complete) {
                // 월드 좌표를 화면 좌표로 변환
                const worldX = tileX * TILE_SIZE;
                const worldY = tileY * TILE_SIZE;
                const screenX = worldX + offsetX;
                const screenY = worldY + offsetY;
                
                // 화면 밖의 타일은 그리지 않음 (성능 최적화)
                if (screenX + TILE_SIZE > 0 && screenX < canvas.width &&
                    screenY + TILE_SIZE > 0 && screenY < canvas.height) {
                    
                    ctx.drawImage(
                        tileImage,
                        0, 0,
                        tileImage.width, tileImage.height,
                        screenX, screenY,
                        TILE_SIZE, TILE_SIZE
                    );
                }
            }
        }
    }
}

// 기존 격자무늬 배경 함수 (폴백용)
function drawGridBackground(offsetX, offsetY) {
    const gridSize = 50;
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
        this.baseAttackSpeed = 1000; // 기본 공격속도
        this.attackSpeed = this.baseAttackSpeed;
        this.lastAttackTime = Date.now();
    }

    //fireRateMultiplier에 따른 공격속도 증가
    updateFireRate(fireRateMultiplier) {
        this.attackSpeed = this.baseAttackSpeed / fireRateMultiplier;
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
        this.baseSpeed = speed;
        this.speed = speed * player.projectileSpeed; // 투사체 속도 배율 적용
        this.angle = angle;
        this.baseDamage = damage;
        this.damage = damage * player.attackPower; // 공격력 배율 적용
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
let screenShakeTime = 0; // 흔들림 지속 시간
let screenShakeIntensity = 0; // 흔들림 강도

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
        this.spriteWidth = 64; // 스프라이트 한 프레임의 너비
        this.spriteHeight = 64; // 스프라이트 한 프레임의 높이
        
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
    }

    updateSpawning(currentTime) {
        const elapsedTime = currentTime - this.stateStartTime;
        const progress = Math.min(elapsedTime / this.spawnDuration, 1);
        
        // 크기가 0에서 정상 크기로 커지는 애니메이션
        // Math.max를 사용하여 최소값을 0으로 제한
        this.currentSize = Math.max(0, this.size * this.easeOutBack(progress));
        
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
        
        // 플레이어가 적을 죽였을 때 경험치 획득 (경험치 배율 적용)
        player.exp += Math.floor(3 * player.expMultiplier);
        score += 10;
        
        // 10% 확률로만 jewel 드롭
        if (Math.random() < 0.1) {
            jewels.push(new Jewel(this.x, this.y));
        }

        // 5% 확률로 보물 드롭
        if (Math.random() < 0.05) {
            terrain.push(new Treasure(this.x, this.y));
        }
        
        // 레벨업 체크 (Jewel 클래스의 checkLevelUp 메서드를 재사용)
        const jewelTemp = new Jewel(0, 0);
        jewelTemp.checkLevelUp();
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
            
            ctx.save();
            
            // 오른쪽 방향일 경우 좌우반전
            if (defaultDirection === 'right') {
                ctx.translate(drawX + displaySize / 2, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(
                    enemySprite,
                    0, 0, // 기본 프레임, 항상 첫 줄 사용
                    this.spriteWidth, this.spriteHeight,
                    0,
                    drawY - displaySize / 2,
                    displaySize,
                    displaySize
                );
            } else {
                // 왼쪽 방향일 경우 기존대로 그리기
                ctx.drawImage(
                    enemySprite,
                    0, 0, // 기본 프레임, 항상 첫 줄 사용
                    this.spriteWidth, this.spriteHeight,
                    drawX - displaySize / 2,
                    drawY - displaySize / 2,
                    displaySize,
                    displaySize
                );
            }
            
            ctx.restore();
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
            // 현재 프레임의 X 위치 (모든 방향이 왼쪽 방향 스프라이트 사용)
            const spriteX = this.currentFrame * this.spriteWidth;
            const spriteY = 0; // 항상 첫 번째 줄 사용
            
            // 스프라이트 크기 (적 크기에 맞춤)
            const displaySize = this.size * 2.5;
            
            ctx.save();
            
            // 오른쪽 방향일 경우 좌우반전
            if (this.direction === 'right') {
                ctx.translate(drawX + displaySize / 2 + this.wobbleAmount, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(
                    enemySprite,
                    spriteX, spriteY,
                    this.spriteWidth, this.spriteHeight,
                    0,
                    drawY - displaySize / 2,
                    displaySize,
                    displaySize
                );
            } else {
                // 왼쪽 방향일 경우 기존대로 그리기
                ctx.drawImage(
                    enemySprite,
                    spriteX, spriteY,
                    this.spriteWidth, this.spriteHeight,
                    drawX - displaySize / 2 + this.wobbleAmount,
                    drawY - displaySize / 2,
                    displaySize,
                    displaySize
                );
            }
            
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
                    Math.max(particle.size, 0.1), // 여기에 Math.max 추가
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
        ctx.arc(drawX, drawY, Math.max(this.currentSize, 0.1), 0, Math.PI * 2);
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
    // takeDamage 메서드, 적이 죽을 때의 처리가 자동으로 되도록 함
    takeDamage(damage) {
        // 이동 중일 때만 데미지 받음
        if (this.state === 'moving') {
            this.health -= damage;
            
            // 체력이 0 이하가 되면 자동으로 죽음 상태로 전환
            if (this.health <= 0) {
                this.startDying();
            }
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
        
        const separationRadius = this.size * 2;
        
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
            
            // 플레이어 피격 상태 설정
            player.isHit = true;
            player.hitStartTime = currentTime;
            
            // 공격 애니메이션 시작
            player.isHit = true;
            player.hitStartTime = currentTime;
            player.hitFrame = 0;
            player.hitFrameTime = 0;
            
            // 공격 파티클 생성
            this.createAttackParticles();
            
            // 충격파 효과 시작
            this.attackShockwave = 1;
            
            // 데미지가 강할수록 흔들림이 더 강하고 길게
            const damageHealthRatio = this.attackStrength / player.maxHealth;
            screenShakeTime = 400 + damageHealthRatio * 2000;
            screenShakeIntensity = 5 + damageHealthRatio * 10;
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
        // 플레이어의 pickupRadius에 따른 범위 내의 아이템 끌어당기기
        if (detectCollision(this, { x: player.x, y: player.y, size: player.pickupRadius })) {
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

    // jewel 획득시 메서드
    collect() {
        // 경험치 획득량에 배율 적용
        const expGained = Math.floor(20 * player.expMultiplier);
        player.exp += expGained;
        score += 5;
        this.checkLevelUp();
    }

    //레벨업 시의 메서드
    checkLevelUp() {
        while (player.exp >= player.nextLevelExp) {
            // Calculate excess XP
            const excessExp = player.exp - player.nextLevelExp;
            
            // Level up
            player.level += 1;
            
            // Store the previous level's XP threshold
            player.prevLevelExp = player.nextLevelExp;
            
            // Calculate the XP requirement for the next level
            player.nextLevelExp = getXPForNextLevel(player.level);
            
            // Reset XP for the next level, keeping excess
            player.exp = excessExp;
            
            // Trigger level up screen
            currentGameState = GAME_STATE.LEVEL_UP;
            pauseStartTime = Date.now();
            
            // Generate level up options
            generateLevelUpOptions();
        }
    }
}

// Treasure 클래스
class Treasure {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 32; // 이미지 크기의 절반
        this.collected = false;
    }

    update() {
        // 애니메이션 효과 제거
    }

    draw(offsetX, offsetY) {
        const drawX = this.x + offsetX;
        const drawY = this.y + offsetY;
        
        // 이미지가 로드되었으면 그리기
        if (treasureImageLoaded) {
            // 이미지 크기 (64x64)
            const imgSize = this.size * 2;
            
            ctx.drawImage(
                treasureImage,
                drawX - imgSize/2,
                drawY - imgSize/2,
                imgSize,
                imgSize
            );
        } else {
            // 이미지가 로드되지 않은 경우 기본 도형 그리기
            ctx.fillStyle = '#DAA520';
            ctx.fillRect(drawX - this.size/2, drawY - this.size/2, this.size, this.size);
        }
    }

    collect() {
        if (!this.collected) {
            this.collected = true;
            // 아티팩트 선택 화면 표시
            currentGameState = GAME_STATE.LEVEL_UP;
            pauseStartTime = Date.now();
            previousGameState = GAME_STATE.PLAYING;
            generateArtifactOptions();
        }
    }
}

// Additional Weapons

// 플레이어 무기 초기화 및 레벨업 시 무기 추가 방법
function initializeWeapons() {
    player.weapons = [new BasicWeapon()]; // 기본 무기로 시작
}

// 새 무기 추가 함수
function addWeapon(weaponType) {
    let newWeapon;
    
    switch (weaponType) {
        case 'orbit':
            newWeapon = new OrbitWeapon();
            break;
        case 'flamethrower':
            newWeapon = new FlamethrowerWeapon();
            break;
        case 'lightning':
            newWeapon = new LightningWeapon();
            break;
        case 'boomerang':
            newWeapon = new BoomerangWeapon();
            break;
        case 'soul':
            newWeapon = new SoulExplosionWeapon();
            break;
        case 'axe':
            newWeapon = new AxeWeapon();
            break;
        case 'wave':
            newWeapon = new WaveWeapon();
            break;
        case 'bible':
            newWeapon = new BibleWeapon();
            break;
        default:
            newWeapon = new BasicWeapon();
    }
    
    // 공격 속도에 플레이어 fireRate 적용
    newWeapon.updateFireRate(player.fireRate);
    
    // 무기 추가
    player.weapons.push(newWeapon);
    
    console.log(`새 무기 추가: ${weaponType}`);
}

// 무기 레벨업 함수
function upgradeWeapon(weaponIndex) {
    const weapon = player.weapons[weaponIndex];
    
    if (weapon) {
        // 기존 무기 강화 로직 (예: 공격 속도 증가, 투사체 수 증가 등)
        if (weapon instanceof OrbitWeapon) {
            weapon.bulletCount += 1;
            weapon.orbitRadius += 10;
        } else if (weapon instanceof FlamethrowerWeapon) {
            weapon.range += 50;
            weapon.coneAngle += Math.PI / 12; // 15도 추가
        } else if (weapon instanceof LightningWeapon) {
            weapon.chainCount += 1;
            weapon.chainRange += 25;
        } else if (weapon instanceof BoomerangWeapon) {
            weapon.maxBoomerangs += 1;
        }
        // 다른 무기들도 비슷하게 처리
        
        // 공격 속도 업데이트
        weapon.updateFireRate(player.fireRate);
        
        console.log(`무기 업그레이드: ${weapon.constructor.name}`);
    }
}

// 레벨업 옵션 생성 시 랜덤 무기 추가
function generateWeaponLevelUpOptions() {
    // 기존 레벨업 옵션에 무기 옵션 추가
    const allUpgrades = [
        { type: 'attackPower', name: '공격력 증가', value: 0.2, description: '공격력 +20%' },
        { type: 'maxHealth', name: '최대 체력 증가', value: 20, description: '최대 체력 +20' },
        // ... 기존 옵션들
        
        // 무기 옵션들
        { type: 'weapon', weaponType: 'orbit', name: '회전 구체', description: '플레이어 주변을 회전하며 공격' },
        { type: 'weapon', weaponType: 'flamethrower', name: '화염방사기', description: '넓은 범위의 지속 데미지' },
        { type: 'weapon', weaponType: 'lightning', name: '번개 사슬', description: '적들 사이를 튀는 번개' },
        { type: 'weapon', weaponType: 'boomerang', name: '부메랑', description: '던졌다가 돌아오는 무기' },
        { type: 'weapon', weaponType: 'soul', name: '영혼 폭발', description: '주변의 모든 적에게 데미지' },
        { type: 'weapon', weaponType: 'axe', name: '도끼 던지기', description: '회전하며 날아가는 도끼' },
        { type: 'weapon', weaponType: 'wave', name: '파동', description: '주변으로 퍼지는 충격파' },
        { type: 'weapon', weaponType: 'bible', name: '바이블', description: '주변을 회전하는 책' }
    ];
    
    // 플레이어가 이미 가지고 있는 무기 필터링
    const playerWeaponTypes = player.weapons.map(w => w.constructor.name);
    const availableUpgrades = allUpgrades.filter(upgrade => {
        if (upgrade.type === 'weapon') {
            // 이미 가지고 있는 무기 타입은 제외
            const weaponClassName = upgrade.weaponType.charAt(0).toUpperCase() + 
                                    upgrade.weaponType.slice(1) + 'Weapon';
            return !playerWeaponTypes.includes(weaponClassName);
        }
        return true;
    });
    
    // 랜덤하게 4개 선택 (변경 없음)
    levelUpOptions = [];
    const shuffled = [...availableUpgrades].sort(() => Math.random() - 0.5);
    levelUpOptions = shuffled.slice(0, 4);
    selectedLevelUpOption = -1;
}

class OrbitWeapon extends Weapon {
    constructor() {
        super();
        this.baseAttackSpeed = 50; // 빠른 업데이트 속도
        this.attackSpeed = this.baseAttackSpeed;
        this.orbitRadius = 50; // 회전 반경
        this.orbitSpeed = 0.05; // 회전 속도
        this.orbitAngle = 0;
        this.bulletCount = 3; // 회전하는 총알 개수
        this.bullets = [];
        
        // 초기 총알 생성
        for (let i = 0; i < this.bulletCount; i++) {
            const angle = (Math.PI * 2 * i) / this.bulletCount;
            this.bullets.push({
                angle: angle,
                active: true
            });
        }
    }

    update() {
        // 회전 각도 업데이트
        this.orbitAngle += this.orbitSpeed;
        
        // 총알이 비활성화되면 재생성
        this.bullets = this.bullets.filter(b => b.active);
        
        // 총알 부족하면 추가
        while (this.bullets.length < this.bulletCount) {
            this.bullets.push({
                angle: Math.random() * Math.PI * 2,
                active: true
            });
        }
        
        // 총알 발사 처리
        this.fire();
    }

    fire() {
        // 회전하는 총알 위치 업데이트 및 충돌 검사
        this.bullets.forEach((orbitBullet, index) => {
            // 총알의 실제 위치 계산
            const bulletAngle = this.orbitAngle + orbitBullet.angle;
            const bulletX = player.x + Math.cos(bulletAngle) * this.orbitRadius;
            const bulletY = player.y + Math.sin(bulletAngle) * this.orbitRadius;
            
            // 실제 총알 생성 (일시적으로 존재하는 총알)
            const bullet = new OrbitBullet(
                bulletX, bulletY, 8, 0, bulletAngle, 8 * player.attackPower
            );
            
            // 충돌 검사를 위해 배열에 추가
            bullets.push(bullet);
            
            // 적과 충돌 검사 (총알 자체적으로 처리)
            for (let enemy of enemies) {
                if (enemy.state === 'moving' && detectCollision(bullet, enemy)) {
                    enemy.takeDamage(bullet.damage);
                    bullet.used = true;
                }
            }
        });
    }
}

// 궤도 총알 클래스
class OrbitBullet extends Bullet {
    constructor(x, y, size, speed, angle, damage) {
        super(x, y, size, speed, angle, damage);
        this.lifeTime = 1; // 수명이 매우 짧음
    }
    
    update() {
        // 움직이지 않음, 단지 존재함
        this.lifeTime -= 0.1;
        if (this.lifeTime <= 0) {
            this.used = true;
        }
    }
    
    draw(offsetX, offsetY) {
        ctx.fillStyle = '#66fcf1'; // 청록색
        ctx.beginPath();
        ctx.arc(this.x + offsetX, this.y + offsetY, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 회전 효과 추가
        ctx.strokeStyle = 'rgba(102, 252, 241, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x + offsetX, this.y + offsetY, this.size + 5, 0, Math.PI * 2);
        ctx.stroke();
    }
}

class FlamethrowerWeapon extends Weapon {
    constructor() {
        super();
        this.baseAttackSpeed = 100; // 매우 빠른 발사 속도
        this.attackSpeed = this.baseAttackSpeed;
        this.range = 150; // 불꽃 최대 도달 거리
        this.coneAngle = Math.PI / 4; // 원뿔 각도 (45도)
    }
    
    fire() {
        // 플레이어가 바라보는 방향을 기준으로 불꽃 발사
        const baseAngle = player.aimAngle;
        
        // 3개의 불꽃 입자 생성
        for (let i = 0; i < 3; i++) {
            // 원뿔 내의 랜덤 각도
            const spreadAngle = baseAngle + (Math.random() * this.coneAngle * 2 - this.coneAngle);
            
            // 랜덤 거리와 크기로 불꽃 생성
            const distance = 20 + Math.random() * 30;
            const size = 4 + Math.random() * 4;
            const speed = 4 + Math.random() * 2;
            
            bullets.push(
                new FlameBullet(
                    player.x + Math.cos(baseAngle) * distance,
                    player.y + Math.sin(baseAngle) * distance,
                    size, speed, spreadAngle, 3 * player.attackPower, this.range
                )
            );
        }
    }
}

// 불꽃 총알 클래스
class FlameBullet extends Bullet {
    constructor(x, y, size, speed, angle, damage, maxRange) {
        super(x, y, size, speed, angle, damage);
        this.initialX = x;
        this.initialY = y;
        this.maxRange = maxRange;
        this.traveled = 0;
        this.fadeRate = 0.02 + Math.random() * 0.02;
        this.alpha = 1.0;
        
        // 불꽃 애니메이션용 속성
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 0.2 + Math.random() * 0.1;
        this.wobbleAmount = 2 + Math.random() * 2;
    }
    
    update() {
        // 기존 이동에 흔들림 추가
        this.wobble += this.wobbleSpeed;
        const wobbleX = Math.cos(this.wobble) * this.wobbleAmount;
        const wobbleY = Math.sin(this.wobble) * this.wobbleAmount;
        
        this.x += Math.cos(this.angle) * this.speed + wobbleX;
        this.y += Math.sin(this.angle) * this.speed + wobbleY;
        
        // 이동 거리 계산
        const dx = this.x - this.initialX;
        const dy = this.y - this.initialY;
        this.traveled = Math.sqrt(dx * dx + dy * dy);
        
        // 최대 거리 도달 시 사라짐
        if (this.traveled >= this.maxRange) {
            this.used = true;
            return;
        }
        
        // 점차 페이드 아웃
        this.alpha -= this.fadeRate;
        if (this.alpha <= 0) {
            this.used = true;
            return;
        }
        
        // 거리에 따라 크기 감소
        this.size = Math.max(1, this.size - 0.1);
        
        // 적과 충돌 검사
        for (let enemy of enemies) {
            if (enemy.state === 'moving' && detectCollision(this, enemy)) {
                enemy.takeDamage(this.damage);
                // 불꽃은 관통함 (사라지지 않음)
            }
        }
    }
    
    draw(offsetX, offsetY) {
        // 불꽃 그라데이션 효과
        const gradient = ctx.createRadialGradient(
            this.x + offsetX, this.y + offsetY, 0,
            this.x + offsetX, this.y + offsetY, this.size
        );
        gradient.addColorStop(0, `rgba(255, 255, 100, ${this.alpha})`);
        gradient.addColorStop(0.5, `rgba(255, 150, 50, ${this.alpha * 0.8})`);
        gradient.addColorStop(1, `rgba(255, 50, 50, ${this.alpha * 0.1})`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x + offsetX, this.y + offsetY, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class LightningWeapon extends Weapon {
    constructor() {
        super();
        this.baseAttackSpeed = 2000; // 2초마다 발사
        this.attackSpeed = this.baseAttackSpeed;
        this.chainCount = 3; // 체인 횟수
        this.chainRange = 150; // 체인 범위
    }
    
    fire() {
        // 가장 가까운 적 찾기
        const nearestEnemy = findNearestEnemy();
        
        if (nearestEnemy) {
            // 번개 발사
            bullets.push(
                new LightningBullet(
                    player.x, player.y, 
                    5, 15, // 크기, 속도
                    Math.atan2(nearestEnemy.y - player.y, nearestEnemy.x - player.x), 
                    15 * player.attackPower, // 데미지
                    this.chainCount,
                    this.chainRange
                )
            );
        }
    }
}

// 번개 총알 클래스
class LightningBullet extends Bullet {
    constructor(x, y, size, speed, angle, damage, chainCount, chainRange) {
        super(x, y, size, speed, angle, damage);
        this.chainCount = chainCount;
        this.chainRange = chainRange;
        this.targetEnemy = null;
        this.hasHit = false;
        this.lightningPoints = [];
        
        // 번개 지그재그 패턴 생성
        this.generateLightningPattern();
    }
    
    generateLightningPattern() {
        this.lightningPoints = [];
        this.lightningPoints.push({x: this.x, y: this.y});
        
        // 직선 경로에 지그재그 추가
        const steps = 10;
        const targetX = this.x + Math.cos(this.angle) * 1000; // 충분히 먼 거리
        const targetY = this.y + Math.sin(this.angle) * 1000;
        
        for (let i = 1; i <= steps; i++) {
            const ratio = i / steps;
            const pointX = this.x + (targetX - this.x) * ratio;
            const pointY = this.y + (targetY - this.y) * ratio;
            
            // 지그재그 효과
            const offset = 10 * (Math.random() - 0.5);
            const perpX = -Math.sin(this.angle) * offset;
            const perpY = Math.cos(this.angle) * offset;
            
            this.lightningPoints.push({
                x: pointX + perpX,
                y: pointY + perpY
            });
        }
    }
    
    update() {
        // 기본 이동
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        
        // 번개 패턴 업데이트
        this.generateLightningPattern();
        
        // 첫 번째 타겟을 맞히면 체인 효과 발동
        if (!this.hasHit) {
            for (let enemy of enemies) {
                if (enemy.state === 'moving' && detectCollision(this, enemy)) {
                    enemy.takeDamage(this.damage);
                    this.hasHit = true;
                    this.used = true;
                    
                    // 체인 효과 생성
                    if (this.chainCount > 0) {
                        this.chainLightning(enemy);
                    }
                    break;
                }
            }
        }
    }
    
    chainLightning(sourceEnemy) {
        // 범위 내에 있는 다른 적 찾기
        const nearbyEnemies = enemies.filter(enemy => {
            if (enemy === sourceEnemy || enemy.state !== 'moving') return false;
            
            const dx = enemy.x - sourceEnemy.x;
            const dy = enemy.y - sourceEnemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            return distance <= this.chainRange;
        });
        
        if (nearbyEnemies.length > 0) {
            // 가장 가까운 적 선택
            nearbyEnemies.sort((a, b) => {
                const distA = Math.hypot(a.x - sourceEnemy.x, a.y - sourceEnemy.y);
                const distB = Math.hypot(b.x - sourceEnemy.x, b.y - sourceEnemy.y);
                return distA - distB;
            });
            
            const nextEnemy = nearbyEnemies[0];
            
            // 체인 번개 효과 생성
            bullets.push(
                new ChainLightningEffect(
                    sourceEnemy.x, sourceEnemy.y,
                    nextEnemy.x, nextEnemy.y,
                    this.damage * 0.8, // 데미지 약간 감소
                    this.chainCount - 1,
                    this.chainRange,
                    nextEnemy
                )
            );
        }
    }
    
    draw(offsetX, offsetY) {
        // 번개 효과 그리기
        ctx.strokeStyle = '#88FFFF';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(this.lightningPoints[0].x + offsetX, this.lightningPoints[0].y + offsetY);
        
        for (let i = 1; i < this.lightningPoints.length; i++) {
            ctx.lineTo(
                this.lightningPoints[i].x + offsetX,
                this.lightningPoints[i].y + offsetY
            );
        }
        
        ctx.stroke();
        
        // 빛나는 효과
        ctx.strokeStyle = 'rgba(136, 255, 255, 0.5)';
        ctx.lineWidth = 6;
        ctx.stroke();
    }
}

// 체인 번개 효과 클래스
class ChainLightningEffect {
    constructor(startX, startY, endX, endY, damage, chainCount, chainRange, targetEnemy) {
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.damage = damage;
        this.chainCount = chainCount;
        this.chainRange = chainRange;
        this.targetEnemy = targetEnemy;
        this.age = 0;
        this.maxAge = 15;
        this.used = false;
        this.hasHit = false;
        this.lightningPoints = [];
        
        // 번개 지그재그 패턴 생성
        this.generateLightningPattern();
    }
    
    generateLightningPattern() {
        this.lightningPoints = [];
        this.lightningPoints.push({x: this.startX, y: this.startY});
        
        // 두 점 사이에 지그재그 패턴 생성
        const steps = 6;
        for (let i = 1; i <= steps; i++) {
            const ratio = i / steps;
            const pointX = this.startX + (this.endX - this.startX) * ratio;
            const pointY = this.startY + (this.endY - this.startY) * ratio;
            
            // 지그재그 효과
            const perpAngle = Math.atan2(this.endY - this.startY, this.endX - this.startX) + Math.PI/2;
            const offset = 15 * (Math.random() - 0.5) * (1 - ratio); // 도착점에 가까울수록 변동 감소
            const perpX = Math.cos(perpAngle) * offset;
            const perpY = Math.sin(perpAngle) * offset;
            
            this.lightningPoints.push({
                x: pointX + perpX,
                y: pointY + perpY
            });
        }
        
        this.lightningPoints.push({x: this.endX, y: this.endY});
    }
    
    update() {
        this.age++;
        
        // 대상 적에게 데미지 입히기 (한 번만)
        if (!this.hasHit && this.targetEnemy && this.targetEnemy.state === 'moving') {
            this.targetEnemy.takeDamage(this.damage);
            this.hasHit = true;
            
            // 체인 효과 계속
            if (this.chainCount > 0) {
                this.chainLightning(this.targetEnemy);
            }
        }
        
        // 수명이 다하면 제거
        if (this.age >= this.maxAge) {
            this.used = true;
        }
    }
    
    chainLightning(sourceEnemy) {
        // 범위 내 다른 적 찾기 (위와 동일)
        const nearbyEnemies = enemies.filter(enemy => {
            if (enemy === sourceEnemy || enemy === this.targetEnemy || enemy.state !== 'moving') return false;
            
            const dx = enemy.x - sourceEnemy.x;
            const dy = enemy.y - sourceEnemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            return distance <= this.chainRange;
        });
        
        if (nearbyEnemies.length > 0) {
            // 가장 가까운 적 선택
            nearbyEnemies.sort((a, b) => {
                const distA = Math.hypot(a.x - sourceEnemy.x, a.y - sourceEnemy.y);
                const distB = Math.hypot(b.x - sourceEnemy.x, b.y - sourceEnemy.y);
                return distA - distB;
            });
            
            const nextEnemy = nearbyEnemies[0];
            
            // 체인 번개 효과 생성
            bullets.push(
                new ChainLightningEffect(
                    sourceEnemy.x, sourceEnemy.y,
                    nextEnemy.x, nextEnemy.y,
                    this.damage * 0.8, // 데미지 약간 감소
                    this.chainCount - 1,
                    this.chainRange,
                    nextEnemy
                )
            );
        }
    }
    
    draw(offsetX, offsetY) {
        // 투명도는 수명에 따라 감소
        const alpha = 1 - this.age / this.maxAge;
        
        // 번개 효과 그리기
        ctx.strokeStyle = `rgba(136, 255, 255, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.lightningPoints[0].x + offsetX, this.lightningPoints[0].y + offsetY);
        
        for (let i = 1; i < this.lightningPoints.length; i++) {
            ctx.lineTo(
                this.lightningPoints[i].x + offsetX,
                this.lightningPoints[i].y + offsetY
            );
        }
        
        ctx.stroke();
        
        // 빛나는 효과
        ctx.strokeStyle = `rgba(136, 255, 255, ${alpha * 0.5})`;
        ctx.lineWidth = 6;
        ctx.stroke();
        
        // 끝점에 전기 효과 추가
        ctx.fillStyle = `rgba(200, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.endX + offsetX, this.endY + offsetY, 8, 0, Math.PI * 2);
        ctx.fill();
    }
}

class BoomerangWeapon extends Weapon {
    constructor() {
        super();
        this.baseAttackSpeed = 3000; // 3초마다 발사
        this.attackSpeed = this.baseAttackSpeed;
        this.maxBoomerangs = 2; // 최대 부메랑 개수
        this.activeBoomerangs = 0;
    }
    
    update() {
        const now = Date.now();
        if (now - this.lastAttackTime >= this.attackSpeed && this.activeBoomerangs < this.maxBoomerangs) {
            this.fire();
            this.lastAttackTime = now;
        }
    }
    
    fire() {
        // 부메랑 던지기
        const angle = player.aimAngle || Math.random() * Math.PI * 2;
        
        const boomerang = new BoomerangBullet(
            player.x, player.y, 
            12, 8, 
            angle, 
            20 * player.attackPower,
            250, // 최대 거리
            this
        );
        
        bullets.push(boomerang);
        this.activeBoomerangs++;
    }
    
    // 부메랑이 돌아왔을 때 호출
    boomerangReturned() {
        this.activeBoomerangs--;
    }
}

// 부메랑 총알 클래스
class BoomerangBullet extends Bullet {
    constructor(x, y, size, speed, angle, damage, maxDistance, weapon) {
        super(x, y, size, speed, angle, damage);
        this.weapon = weapon;
        this.maxDistance = maxDistance;
        this.returnPhase = false; // true면 돌아오는 중
        this.initialX = x;
        this.initialY = y;
        this.rotationAngle = 0;
        this.rotationSpeed = 0.2;
        this.hitEnemies = new Set(); // 이미 맞은 적 추적
    }
    
    update() {
        // 회전 각도 업데이트
        this.rotationAngle += this.rotationSpeed;
        
        if (!this.returnPhase) {
            // 방향으로 이동
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
            
            // 최대 거리 도달 시 반환 단계로 전환
            const dx = this.x - this.initialX;
            const dy = this.y - this.initialY;
            const distTraveled = Math.sqrt(dx * dx + dy * dy);
            
            if (distTraveled >= this.maxDistance) {
                this.returnPhase = true;
            }
        } else {
            // 플레이어를 향해 돌아오기
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // 플레이어와 충돌하면 제거
            if (dist < player.size) {
                this.used = true;
                this.weapon.boomerangReturned();
                return;
            }
            
            // 돌아오는 속도는 점점 빨라짐
            const returnSpeed = this.speed * (1 + (this.maxDistance / Math.max(dist, 50)));
            
            // 플레이어 방향으로 이동
            const returnAngle = Math.atan2(dy, dx);
            this.x += Math.cos(returnAngle) * returnSpeed;
            this.y += Math.sin(returnAngle) * returnSpeed;
        }
        
        // 적과 충돌 (한 번 나갈 때와 한 번 돌아올 때 각각 한 번씩 충돌 가능)
        for (let enemy of enemies) {
            if (enemy.state === 'moving' && detectCollision(this, enemy)) {
                // 이 적을 이미 맞혔는지 확인
                if (!this.hitEnemies.has(enemy)) {
                    enemy.takeDamage(this.damage);
                    this.hitEnemies.add(enemy);
                    
                    // 효과음이나 이펙트 추가 가능
                }
            }
        }
    }
    
    draw(offsetX, offsetY) {
        ctx.save();
        
        // 회전 애니메이션
        ctx.translate(this.x + offsetX, this.y + offsetY);
        ctx.rotate(this.rotationAngle);
        
        // X 모양 부메랑 그리기
        ctx.fillStyle = '#FFAA00';
        
        // 첫 번째 날개
        ctx.beginPath();
        ctx.moveTo(-this.size, -this.size);
        ctx.lineTo(-this.size/3, -this.size/3);
        ctx.lineTo(this.size/3, -this.size/3);
        ctx.lineTo(this.size, -this.size);
        ctx.lineTo(this.size/3, -this.size/3);
        ctx.lineTo(this.size/3, this.size/3);
        ctx.lineTo(this.size, this.size);
        ctx.lineTo(this.size/3, this.size/3);
        ctx.lineTo(-this.size/3, this.size/3);
        ctx.lineTo(-this.size, this.size);
        ctx.lineTo(-this.size/3, this.size/3);
        ctx.lineTo(-this.size/3, -this.size/3);
        ctx.closePath();
        ctx.fill();
        
        // 테두리
        ctx.strokeStyle = '#AA7700';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 중앙 원
        ctx.fillStyle = '#FFDD00';
        ctx.beginPath();
        ctx.arc(0, 0, this.size/4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class SoulExplosionWeapon extends Weapon {
    constructor() {
        super();
        this.baseAttackSpeed = 5000; // 5초마다 발동
        this.attackSpeed = this.baseAttackSpeed;
        this.radius = 150; // 폭발 범위
        this.explosionDuration = 30; // 프레임 단위 지속시간
    }
    
    fire() {
        // 폭발 효과 생성
        bullets.push(
            new SoulExplosion(
                player.x, player.y,
                this.radius,
                30 * player.attackPower,
                this.explosionDuration
            )
        );
    }
}

// 영혼 폭발 클래스
class SoulExplosion {
    constructor(x, y, radius, damage, duration) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.damage = damage;
        this.duration = duration;
        this.age = 0;
        this.used = false;
        this.hitEnemies = new Set();
        
        // 영혼 파티클 생성
        this.soulParticles = [];
        const particleCount = 30;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const distance = this.radius * 0.2 + Math.random() * this.radius * 0.6;
            const speed = 1 + Math.random() * 3;
            
            this.soulParticles.push({
                x: this.x,
                y: this.y,
                targetX: this.x + Math.cos(angle) * distance,
                targetY: this.y + Math.sin(angle) * distance,
                currentT: 0,
                speed: speed / 100,
                size: 5 + Math.random() * 10,
                opacity: 0.5 + Math.random() * 0.5,
                pulseSpeed: 0.05 + Math.random() * 0.05
            });
        }
    }
    
    update() {
        this.age++;
        
        // 수명이 다하면 제거
        if (this.age >= this.duration) {
            this.used = true;
            return;
        }
        
        // 파티클 업데이트
        for (let particle of this.soulParticles) {
            // 파티클이 목표 위치로 이동
            particle.currentT = Math.min(1, particle.currentT + particle.speed);
            particle.x = this.x + (particle.targetX - this.x) * particle.currentT;
            particle.y = this.y + (particle.targetY - this.y) * particle.currentT;
        }
        
        // 적과 충돌 검사
        for (let enemy of enemies) {
            if (enemy.state === 'moving' && !this.hitEnemies.has(enemy)) {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= this.radius) {
                    enemy.takeDamage(this.damage);
                    this.hitEnemies.add(enemy);
                }
            }
        }
    }
    
    draw(offsetX, offsetY) {
        // 영혼 파티클 그리기
        for (let particle of this.soulParticles) {
            const pulseSize = Math.sin(this.age * particle.pulseSpeed) * 0.3 + 0.7;
            const fadeOut = Math.min(1, (this.duration - this.age) / (this.duration * 0.3));
            
            ctx.fillStyle = `rgba(200, 200, 255, ${particle.opacity * fadeOut})`;
            ctx.beginPath();
            ctx.arc(
                particle.x + offsetX, 
                particle.y + offsetY, 
                particle.size * pulseSize, 
                0, Math.PI * 2
            );
            ctx.fill();
            
            // 영혼 꼬리 효과
            ctx.strokeStyle = `rgba(150, 150, 255, ${particle.opacity * fadeOut * 0.5})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x + offsetX, this.y + offsetY);
            ctx.lineTo(particle.x + offsetX, particle.y + offsetY);
            ctx.stroke();
        }
        
        // 중앙 효과
        const ringSize = Math.min(this.radius, (this.age / 5) * this.radius);
        const ringOpacity = Math.min(1, (this.duration - this.age) / this.duration);
        
        ctx.strokeStyle = `rgba(150, 150, 255, ${ringOpacity * 0.5})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x + offsetX, this.y + offsetY, ringSize, 0, Math.PI * 2);
        ctx.stroke();
    }
}

class AxeWeapon extends Weapon {
    constructor() {
        super();
        this.baseAttackSpeed = 1200; // 1.2초마다 발사
        this.attackSpeed = this.baseAttackSpeed;
        this.throwHeight = 200; // 최대 높이
    }
    
    fire() {
        // 플레이어 전방으로 도끼 던지기
        const direction = Math.random() * Math.PI * 2;
        
        bullets.push(
            new AxeBullet(
                player.x, player.y,
                12, 8,
                direction,
                25 * player.attackPower,
                this.throwHeight
            )
        );
    }
}

// 도끼 총알 클래스
class AxeBullet extends Bullet {
    constructor(x, y, size, speed, angle, damage, throwHeight) {
        super(x, y, size, speed, angle, damage);
        this.throwHeight = throwHeight;
        this.initialX = x;
        this.initialY = y;
        this.distance = 0;
        this.maxDistance = 200 + Math.random() * 50;
        this.rotationAngle = 0;
        this.rotationSpeed = 0.2;
        this.heightOffset = 0;
        this.hasHitGround = false;
    }
    
    update() {
        // 회전 각도 업데이트
        this.rotationAngle += this.rotationSpeed;
        
        // 계속 전진
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        
        // 이동 거리 계산
        const dx = this.x - this.initialX;
        const dy = this.y - this.initialY;
        this.distance = Math.sqrt(dx * dx + dy * dy);
        
        // 높이 효과 계산 (포물선)
        const normalizedDistance = Math.min(1, this.distance / this.maxDistance);
        this.heightOffset = Math.sin(normalizedDistance * Math.PI) * this.throwHeight;
        
        // 최대 거리에 도달하면 땅에 박힘
        if (this.distance >= this.maxDistance && !this.hasHitGround) {
            this.hasHitGround = true;
            // 땅에 박히고 3초 후 사라짐
            setTimeout(() => {
                this.used = true;
            }, 3000);
        }
        
        // 적과 충돌 처리 (공중에서만)
        if (!this.hasHitGround) {
            for (let enemy of enemies) {
                if (enemy.state === 'moving' && detectCollision(this, enemy)) {
                    enemy.takeDamage(this.damage);
                    this.hasHitGround = true; // 적에게 맞으면 더 이상 충돌하지 않음
                    // 적에게 박히고 1초 후 사라짐
                    setTimeout(() => {
                        this.used = true;
                    }, 1000);
                }
            }
        }
    }
    
    draw(offsetX, offsetY) {
        ctx.save();
        
        // 도끼 그리기 위치에 높이 효과 추가
        const drawY = this.y + offsetY - this.heightOffset;
        
        // 회전 효과 적용
        ctx.translate(this.x + offsetX, drawY);
        ctx.rotate(this.rotationAngle);
        
        // 도끼 머리
        ctx.fillStyle = '#999999';
        ctx.beginPath();
        
        if (this.hasHitGround) {
            // 땅에 박힌 모습
            ctx.fillRect(-this.size/6, -this.size, this.size/3, this.size*2);
        } else {
            // 도끼 자루
            ctx.fillRect(-this.size/6, -this.size, this.size/3, this.size*2);
            
            // 도끼 날
            ctx.fillStyle = '#DDDDDD';
            ctx.beginPath();
            ctx.moveTo(0, -this.size);
            ctx.lineTo(-this.size, -this.size*0.6);
            ctx.lineTo(-this.size, -this.size*0.2);
            ctx.lineTo(0, -this.size*0.4);
            ctx.lineTo(this.size, -this.size*0.2);
            ctx.lineTo(this.size, -this.size*0.6);
            ctx.closePath();
            ctx.fill();
            
            // 테두리
            ctx.strokeStyle = '#555555';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        ctx.restore();
        
        // 그림자 (돌아가는 도끼의 경우에만)
        if (!this.hasHitGround) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.ellipse(
                this.x + offsetX, 
                this.y + offsetY, 
                this.size * 0.8, 
                this.size * 0.4, 
                0, 0, Math.PI * 2
            );
            ctx.fill();
        }
    }
}

class WaveWeapon extends Weapon {
    constructor() {
        super();
        this.baseAttackSpeed = 4000; // 4초마다 발동
        this.attackSpeed = this.baseAttackSpeed;
    }
    
    fire() {
        // 파동 효과 생성
        bullets.push(
            new WaveBullet(
                player.x, player.y,
                20, 
                3, // 속도
                0, // 각도 (파동은 전방향)
                15 * player.attackPower
            )
        );
    }
}

// 파동 총알 클래스
class WaveBullet {
    constructor(x, y, size, speed, angle, damage) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.currentRadius = 0;
        this.speed = speed;
        this.maxRadius = 200;
        this.damage = damage;
        this.used = false;
        this.hitEnemies = new Set();
        this.waveWidth = 15;
        this.waveColor = 'rgba(100, 255, 255, 0.6)';
    }
    
    update() {
        // 반경 확장
        this.currentRadius += this.speed;
        
        // 최대 반경 도달 시 사라짐
        if (this.currentRadius >= this.maxRadius) {
            this.used = true;
            return;
        }
        
        // 파동 범위에 있는 적들 검사
        for (let enemy of enemies) {
            if (enemy.state === 'moving' && !this.hitEnemies.has(enemy)) {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // 적이 현재 파동 반경 내에 있는지 확인
                const innerRadius = this.currentRadius - this.waveWidth;
                if (distance >= innerRadius && distance <= this.currentRadius) {
                    enemy.takeDamage(this.damage);
                    this.hitEnemies.add(enemy);
                }
            }
        }
    }
    
    draw(offsetX, offsetY) {
        // 파동 그리기 (원환)
        const innerRadius = Math.max(0, this.currentRadius - this.waveWidth);
        
        // 그라데이션 생성
        const gradient = ctx.createRadialGradient(
            this.x + offsetX, this.y + offsetY, innerRadius,
            this.x + offsetX, this.y + offsetY, this.currentRadius
        );
        gradient.addColorStop(0, 'rgba(100, 255, 255, 0.7)');
        gradient.addColorStop(1, 'rgba(100, 255, 255, 0)');
        
        // 원환 그리기
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x + offsetX, this.y + offsetY, this.currentRadius, 0, Math.PI * 2);
        ctx.arc(this.x + offsetX, this.y + offsetY, innerRadius, 0, Math.PI * 2, true);
        ctx.fill();
        
        // 안쪽 윤곽선
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x + offsetX, this.y + offsetY, innerRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // 바깥쪽 윤곽선
        ctx.strokeStyle = 'rgba(50, 200, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(this.x + offsetX, this.y + offsetY, this.currentRadius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

class BibleWeapon extends Weapon {
    constructor() {
        super();
        this.baseAttackSpeed = 5000; // 5초마다 활성화
        this.attackSpeed = this.baseAttackSpeed;
        this.bibles = [];
        this.maxBibles = 3;
        this.activeDuration = 180; // 3초 (60fps 기준)
    }
    
    update() {
        const now = Date.now();
        
        // 비활성화 상태일 때만 새로운 공격 체크
        if (this.bibles.length === 0 && now - this.lastAttackTime >= this.attackSpeed) {
            this.fire();
            this.lastAttackTime = now;
        }
        
        // 각 바이블 업데이트
        for (let bible of this.bibles) {
            bible.update();
        }
        
        // 사용된 바이블 제거
        this.bibles = this.bibles.filter(bible => !bible.used);
    }
    
    fire() {
        // 최대 바이블 수만큼 생성
        for (let i = 0; i < this.maxBibles; i++) {
            const startAngle = (Math.PI * 2 * i) / this.maxBibles;
            
            const bible = new BibleBullet(
                player.x, player.y,
                15, // 크기
                20, // 공전 반경
                startAngle,
                15 * player.attackPower,
                this.activeDuration
            );
            
            this.bibles.push(bible);
            bullets.push(bible);
        }
    }
}

// 바이블(책) 총알 클래스
class BibleBullet {
    constructor(x, y, size, orbitRadius, startAngle, damage, duration) {
        this.centerX = x;
        this.centerY = y;
        this.x = x;
        this.y = y;
        this.size = size;
        this.orbitRadius = orbitRadius;
        this.angle = startAngle;
        this.orbitSpeed = 0.1;
        this.damage = damage;
        this.age = 0;
        this.duration = duration;
        this.used = false;
        this.hitCooldown = 30; // 동일한 적을 다시 공격하기까지의 대기 시간
        this.hitEnemies = new Map(); // 적 ID와 마지막 타격 시간
        this.bookOpenAngle = 0;
        this.openSpeed = 0.05;
        this.openState = 'opening'; // 'opening', 'closing'
        this.maxOpenAngle = Math.PI * 0.6;
        this.glowIntensity = 0;
        this.targetGlowIntensity = 1;
    }
    
    update() {
        // 플레이어 위치 추적
        this.centerX = player.x;
        this.centerY = player.y;
        
        // 나이 증가
        this.age++;
        
        // 수명이 다하면 사라짐
        if (this.age >= this.duration) {
            this.used = true;
            return;
        }
        
        // 책 열고 닫는 애니메이션
        if (this.openState === 'opening') {
            this.bookOpenAngle += this.openSpeed;
            if (this.bookOpenAngle >= this.maxOpenAngle) {
                this.bookOpenAngle = this.maxOpenAngle;
                this.openState = 'closing';
            }
        } else {
            this.bookOpenAngle -= this.openSpeed;
            if (this.bookOpenAngle <= 0) {
                this.bookOpenAngle = 0;
                this.openState = 'opening';
            }
        }
        
        // 빛나는 효과 업데이트
        this.glowIntensity += (this.targetGlowIntensity - this.glowIntensity) * 0.1;
        
        // 공전 각도 업데이트
        this.angle += this.orbitSpeed;
        
        // 위치 업데이트
        this.x = this.centerX + Math.cos(this.angle) * this.orbitRadius;
        this.y = this.centerY + Math.sin(this.angle) * this.orbitRadius;
        
        // 적과 충돌 처리
        for (let enemy of enemies) {
            if (enemy.state === 'moving' && detectCollision(this, enemy)) {
                // 재공격 대기 시간 확인
                const lastHitTime = this.hitEnemies.get(enemy) || -Infinity;
                if (this.age - lastHitTime > this.hitCooldown) {
                    enemy.takeDamage(this.damage);
                    this.hitEnemies.set(enemy, this.age);
                    this.targetGlowIntensity = 0; // 빛 효과 깜빡임
                    setTimeout(() => {
                        this.targetGlowIntensity = 1;
                    }, 100);
                }
            }
        }
    }
    
    draw(offsetX, offsetY) {
        ctx.save();
        
        // 책 위치로 이동 및 회전
        ctx.translate(this.x + offsetX, this.y + offsetY);
        ctx.rotate(this.angle + Math.PI / 2);
        
        // 빛나는 효과
        const glowSize = this.size * (1 + this.glowIntensity * 0.3);
        ctx.fillStyle = `rgba(255, 255, 200, ${this.glowIntensity * 0.3})`;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 책 표지 그리기
        ctx.fillStyle = '#996633';
        
        // 왼쪽 페이지
        ctx.save();
        ctx.rotate(-this.bookOpenAngle / 2);
        ctx.fillRect(-this.size, -this.size * 0.7, this.size, this.size * 1.4);
        
        // 페이지 내부 (좌)
        ctx.fillStyle = '#FFFFEE';
        ctx.fillRect(-this.size + 3, -this.size * 0.7 + 3, this.size - 6, this.size * 1.4 - 6);
        
        // 텍스트 라인
        ctx.fillStyle = '#CCCCAA';
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(-this.size + 6, -this.size * 0.5 + i * 12, this.size - 12, 2);
        }
        ctx.restore();
        
        // 오른쪽 페이지
        ctx.save();
        ctx.rotate(this.bookOpenAngle / 2);
        ctx.fillStyle = '#996633';
        ctx.fillRect(0, -this.size * 0.7, this.size, this.size * 1.4);
        
        // 페이지 내부 (우)
        ctx.fillStyle = '#FFFFEE';
        ctx.fillRect(3, -this.size * 0.7 + 3, this.size - 6, this.size * 1.4 - 6);
        
        // 텍스트 라인
        ctx.fillStyle = '#CCCCAA';
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(6, -this.size * 0.5 + i * 12, this.size - 12, 2);
        }
        ctx.restore();
        
        // 책 등 부분 (중앙)
        ctx.fillStyle = '#AA7744';
        ctx.fillRect(-2, -this.size * 0.7, 4, this.size * 1.4);
        
        ctx.restore();
    }
}



// Initialize the game
gameLoop();
