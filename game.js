// Get the canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game dimensions and scaling
const BASE_WIDTH = 800;
const BASE_HEIGHT = 600;
let CANVAS_WIDTH = BASE_WIDTH;
let CANVAS_HEIGHT = BASE_HEIGHT;
const CHUNK_SIZE = 500; // Size of each chunk in pixels

// 게임 시간 시스템
const gameTimeSystem = {
  realStartTime: 0,          // 실제 게임 시작 시간
  gameTime: 0,               // 현재 게임 시간
  lastUpdateTime: 0,         // 마지막 업데이트 시간
  paused: false,             // 일시정지 상태
  
  // 초기화
  init() {
    const now = Date.now(); // 실제 시간으로 초기화
    this.realStartTime = now;
    this.gameTime = now;    // 시작 시간을 실제 타임스탬프로 설정
    this.lastUpdateTime = now;
    this.paused = false;
  },
  
  // 업데이트
  update() {
    if (!this.paused) {
      const now = Date.now(); // 실제 시간으로 델타타임 계산
      const deltaTime = now - this.lastUpdateTime;
      this.gameTime += deltaTime;
      this.lastUpdateTime = now;
    }
  },
  
  // 게임 시간 획득
  getTime() {
    return this.gameTime;
  },
  
  // 일시정지
  pause() {
    this.paused = true;
  },
  
  // 재개
  resume() {
    this.lastUpdateTime = Date.now(); // 실제 시간으로 업데이트
    this.paused = false;
  }
};

// 골드 저장 함수
function saveGold() {
  if (userProfileSystem.currentUser) {
    localStorage.setItem(`vampireSurvivorGold_${userProfileSystem.currentUser}`, gold.toString());
  }
}

// 골드 불러오기 함수
function loadGold() {
  if (userProfileSystem.currentUser) {
    const savedGold = localStorage.getItem(`vampireSurvivorGold_${userProfileSystem.currentUser}`);
    if (savedGold !== null) {
      return parseInt(savedGold);
    }
  }
  return 0; // 저장된 골드가 없거나 사용자가 없으면 0 반환
}

// 영구 업그레이드 시스템
const permanentUpgrades = {
  upgrades: [
    // 창조 (체술) - 경험치획득량, 아이템획득반경
    {
      id: 'creation_physical_exp',
      category: 'creation',
      type: 'physical',
      name: '경험치 성장',
      description: '경험치 +8%',
      maxLevel: 10,
      currentLevel: 0,
      baseCost: 110,
      costMultiplier: 1.7,
      effect: 0.08
    },
    {
      id: 'creation_physical_pickup',
      category: 'creation',
      type: 'physical', 
      name: '수집 범위',
      description: '획득반경 +7.5',
      maxLevel: 8,
      currentLevel: 0,
      baseCost: 40,
      costMultiplier: 1.3,
      effect: 7.5
    },
    
    // 창조 (마술) - 골드획득량, 행운
    {
      id: 'creation_magic_gold',
      category: 'creation',
      type: 'magic',
      name: '황금술',
      description: '골드 +15%',
      maxLevel: 8,
      currentLevel: 0,
      baseCost: 80,
      costMultiplier: 1.8,
      effect: 0.15
    },
    {
      id: 'creation_magic_luck',
      category: 'creation',
      type: 'magic',
      name: '행운의 별',
      description: '행운 +5%',
      maxLevel: 12,
      currentLevel: 0,
      baseCost: 100,
      costMultiplier: 1.6,
      effect: 0.05
    },
    
    // 파괴 (체술) - 근접무기 데미지, 공격력 증가 I, 공격속도
    {
      id: 'destruction_physical_melee',
      category: 'destruction',
      type: 'physical',
      name: '무예 수련',
      description: '근접무기 데미지 +12%',
      maxLevel: 10,
      currentLevel: 0,
      baseCost: 60,
      costMultiplier: 1.5,
      effect: 0.12
    },
    {
      id: 'destruction_physical_attack1',
      category: 'destruction',
      type: 'physical',
      name: '공격력 증가 I',
      description: '전체 공격력 +10%',
      maxLevel: 10,
      currentLevel: 0,
      baseCost: 50,
      costMultiplier: 1.5,
      effect: 0.10
    },
    {
      id: 'destruction_physical_speed',
      category: 'destruction',
      type: 'physical',
      name: '공격속도',
      description: '쿨타임 -5%',
      maxLevel: 10,
      currentLevel: 0,
      baseCost: 80,
      costMultiplier: 1.6,
      effect: 0.05
    },
    
    // 파괴 (마술) - 원거리무기 데미지, 공격력 증가 II, 공격범위
    {
      id: 'destruction_magic_ranged',
      category: 'destruction',
      type: 'magic',
      name: '마법 숙련',
      description: '원거리무기 데미지 +12%',
      maxLevel: 10,
      currentLevel: 0,
      baseCost: 60,
      costMultiplier: 1.5,
      effect: 0.12
    },
    {
      id: 'destruction_magic_attack2',
      category: 'destruction',
      type: 'magic',
      name: '공격력 증가 II',
      description: '전체 공격력 +10%',
      maxLevel: 10,
      currentLevel: 0,
      baseCost: 50,
      costMultiplier: 1.5,
      effect: 0.10
    },
    {
      id: 'destruction_magic_range',
      category: 'destruction',
      type: 'magic',
      name: '공격범위',
      description: '공격범위 +8%',
      maxLevel: 12,
      currentLevel: 0,
      baseCost: 90,
      costMultiplier: 1.7,
      effect: 0.08
    },
    
    // 의지 (체술) - 이동속도, 최대체력
    {
      id: 'will_physical_speed',
      category: 'will',
      type: 'physical',
      name: '신속함',
      description: '이동속도 +0.1',
      maxLevel: 10,
      currentLevel: 0,
      baseCost: 70,
      costMultiplier: 1.5,
      effect: 0.1
    },
    {
      id: 'will_physical_health',
      category: 'will',
      type: 'physical',
      name: '생명력',
      description: '최대체력 +20',
      maxLevel: 15,
      currentLevel: 0,
      baseCost: 60,
      costMultiplier: 1.4,
      effect: 20
    },
    
    // 의지 (마술) - 회피율, 체력회복
    {
      id: 'will_magic_dodge',
      category: 'will',
      type: 'magic',
      name: '회피술',
      description: '회피율 +3%',
      maxLevel: 15,
      currentLevel: 0,
      baseCost: 120,
      costMultiplier: 1.8,
      effect: 0.03
    },
    {
      id: 'will_magic_regen',
      category: 'will',
      type: 'magic',
      name: '재생술',
      description: '체력회복 +1%',
      maxLevel: 8,
      currentLevel: 0,
      baseCost: 150,
      costMultiplier: 2.0,
      effect: 0.01
    }
  ],

  // 카테고리별 업그레이드 목록 반환
  getUpgradesByCategory(category, type) {
    return this.upgrades.filter(upgrade => 
      upgrade.category === category && upgrade.type === type
    );
  },

  // 특성별 총 효과값 계산
  getUpgradeValue(upgradeId) {
    const upgrade = this.upgrades.find(u => u.id === upgradeId);
    return upgrade ? upgrade.effect * upgrade.currentLevel : 0;
  },

  // 업그레이드 비용 계산
  getCost(upgradeId) {
    const upgrade = this.upgrades.find(u => u.id === upgradeId);
    if (!upgrade || upgrade.currentLevel >= upgrade.maxLevel) return -1;
    
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.currentLevel));
  },

  // 업그레이드 가능 여부 확인
  canUpgrade(upgradeId) {
    const upgrade = this.upgrades.find(u => u.id === upgradeId);
    if (!upgrade || upgrade.currentLevel >= upgrade.maxLevel) return false;
    
    const cost = this.getCost(upgradeId);
    return cost !== -1 && gold >= cost;
  },

  // 업그레이드 구매
  purchaseUpgrade(upgradeId) {
    if (!this.canUpgrade(upgradeId)) return false;
    
    const cost = this.getCost(upgradeId);
    gold -= cost;
    
    const upgrade = this.upgrades.find(u => u.id === upgradeId);
    upgrade.currentLevel++;
    
    this.saveUpgrades();
    saveGold();
    return true;
  },

  // 업그레이드 저장
  saveUpgrades() {
    if (userProfileSystem.currentUser) {
      const upgradeData = this.upgrades.map(upgrade => ({
        id: upgrade.id,
        currentLevel: upgrade.currentLevel
      }));
      localStorage.setItem(`vampireSurvivorUpgrades_${userProfileSystem.currentUser}`, JSON.stringify(upgradeData));
    }
  },

  // 업그레이드 불러오기
  loadUpgrades() {
    // 먼저 모든 업그레이드를 초기 상태로 리셋
    this.upgrades.forEach(upgrade => {
      upgrade.currentLevel = 0;
    });
    
    // 그 다음 현재 사용자의 데이터 로드
    if (userProfileSystem.currentUser) {
      const savedData = localStorage.getItem(`vampireSurvivorUpgrades_${userProfileSystem.currentUser}`);
      if (savedData) {
        const upgradeData = JSON.parse(savedData);
        upgradeData.forEach(saved => {
          const upgrade = this.upgrades.find(u => u.id === saved.id);
          if (upgrade) {
            upgrade.currentLevel = saved.currentLevel;
          }
        });
      }
    }
  }
};

// Game objects
const gameObjects = {
  chunks: {}, 
  terrain: [],
  bullets: [],
  enemies: [],
  jewels: []
};

// Game state
let startingGold = 0;
let gold = 0;
let currentGameState = 8;
let previousGameState = null;
let loadingStartTime = 0;
let loadingMinDuration = 500;
let chunksLoaded = false;
let gameStartTime = 0;
let totalPausedTime = 0;
let pauseStartTime = 0;
let elapsedTime = 0;

// 마우스 상태 변수
let mouseX = 0;
let mouseY = 0;
let mouseWorldX = 0;
let mouseWorldY = 0;
let isMouseDown = false;
let hoveredLevelUpOption = -1;

// 메뉴 관련 변수들

let confirmDialogType = "";

// 캐릭터 선택 관련 변수
let currentCharacterIndex = 0; // 현재 선택 중인 캐릭터 인덱스
let previousCharacterIndex = 0; // 설정 화면 진입 전 캐릭터 인덱스

// 레벨업 관련 변수들 
let levelUpOptions = [];
let isArtifactSelection = false;

// 게임 효과 관련 변수들
let lastEnemySpawnTime = 0;
let screenShakeTime = 0;
let screenShakeIntensity = 0;
let lastFrameTime = 0;

// 게임 상태 상수
const GAME_STATE = {
  START_SCREEN: 0,
  SETTINGS: 1,
  PLAYING: 2,
  GAME_OVER: 3,
  PAUSED: 4,
  LOADING: 5,
  CONFIRM_DIALOG: 6,
  LEVEL_UP: 7,
  PROFILE_SELECT: 8,
  CREATE_USER: 9,
  UPGRADE: 10
};

// 사용자 이름 입력 관련 변수
let newUsername = '';
let inputCursorBlink = 0;

let showCreateUserError = false;
let errorTimeout = 0;

let createUserErrorMessage = '';

// 한글 입력 관련 변수
let hiddenInput;
let isFocusedOnInput = false;

function drawCreateUserScreen() {
  // 배경
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 제목
  ctx.fillStyle = '#55AAFF';
  ctx.font = '32px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('새 사용자 생성', canvas.width / 2, 80);
  
  // 입력 상자
  const inputBoxWidth = 400;
  const inputBoxHeight = 50;
  const inputBoxX = (canvas.width - inputBoxWidth) / 2;
  const inputBoxY = canvas.height / 2 - 40;
  
  // 입력 상자 배경
  ctx.fillStyle = '#1f2833';
  ctx.fillRect(inputBoxX, inputBoxY, inputBoxWidth, inputBoxHeight);
  
  // 입력 상자 테두리 (입력 필드가 포커스 되었을 때 테두리 색상 변경)
  ctx.strokeStyle = isFocusedOnInput ? '#66fcf1' : '#45a29e';
  ctx.lineWidth = 2;
  ctx.strokeRect(inputBoxX, inputBoxY, inputBoxWidth, inputBoxHeight);
  
  // 입력된 텍스트
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(newUsername, inputBoxX + 15, inputBoxY + 33);
  
  // 입력 커서 깜빡임 (입력 필드가 포커스 되었을 때만)
  if (isFocusedOnInput) {
    inputCursorBlink += 0.05;
    if (Math.sin(inputCursorBlink) > 0) {
      const textWidth = ctx.measureText(newUsername).width;
      ctx.fillRect(inputBoxX + 15 + textWidth, inputBoxY + 10, 2, 30);
    }
  }
  
  // 안내 텍스트
  ctx.fillStyle = '#c5c6c7';
  ctx.textAlign = 'center';
  ctx.font = '18px Arial';
  ctx.fillText('사용자 이름을 입력한 후 Enter를 누르세요', canvas.width / 2, inputBoxY + 80);
  ctx.fillText('취소하려면 ESC를 누르세요', canvas.width / 2, inputBoxY + 110);
  
  // 입력 제한 표시
  if (newUsername.length >= 12) {
    ctx.fillStyle = '#ff6b6b';
    ctx.fillText('최대 12자까지 입력 가능합니다', canvas.width / 2, inputBoxY + 140);
  }
  
  // 에러 메시지 표시
  if (showCreateUserError) {
    ctx.fillStyle = '#ff6b6b';
    ctx.fillText(createUserErrorMessage, canvas.width / 2, inputBoxY + 170);
    
    // 타임아웃 처리
    errorTimeout--;
    if (errorTimeout <= 0) {
      showCreateUserError = false;
    }
  }
}

// 사용자 프로필 관리 시스템
const userProfileSystem = {
  currentUser: '',
  users: [],
  MAX_PROFILES: 12, // 최대 프로필 수
  
  // 초기화
  init() {
    // 저장된 사용자 목록 불러오기
    const savedUsers = localStorage.getItem('vampireSurvivor_users');
    if (savedUsers) {
      this.users = JSON.parse(savedUsers);
    }
    
    // 마지막 사용자 불러오기
    const lastUser = localStorage.getItem('vampireSurvivor_lastUser');
    if (lastUser && this.users.includes(lastUser)) {
      this.currentUser = lastUser;
    }
  },
  
  // 사용자 추가
  addUser(username) {
    if (!username || username.trim() === '') return false;
    
    const cleanUsername = username.trim();
    
    this.users.push(cleanUsername);
    this.saveUserList();
    
    this.currentUser = cleanUsername;
    this.saveCurrentUser();
    return true;
  },
  
  // 최대 프로필 수 도달 여부 확인 메서드
  isProfileLimitReached() {
    return this.users.length >= this.MAX_PROFILES;
  },
  
  // 사용자 선택
  selectUser(username) {
    if (this.users.includes(username)) {
      this.currentUser = username;
      this.saveCurrentUser();
      
      // 새로운 사용자의 골드 로드
      gold = loadGold();
      
      // 새로운 사용자의 업그레이드 로드
      permanentUpgrades.loadUpgrades();

      // 영구 업그레이드 적용
      applyPermanentUpgrades();
      
      return true;
    }
    return false;
  },
  
  // 사용자 삭제
  deleteUser(username) {
    const index = this.users.indexOf(username);
    if (index !== -1) {
      this.users.splice(index, 1);
      this.saveUserList();
      
      // 삭제한 사용자 데이터도 제거
      localStorage.removeItem(`vampireSurvivorGold_${username}`);
      localStorage.removeItem(`vampireSurvivorUpgrades_${username}`); // 이 줄 추가
      
      // 현재 사용자가 삭제된 경우, 다른 사용자 선택 또는 빈 상태로
      if (this.currentUser === username) {
        this.currentUser = this.users.length > 0 ? this.users[0] : '';
        this.saveCurrentUser();
      }
      
      return true;
    }
    return false;
  },
  
  // 사용자 목록 저장
  saveUserList() {
    localStorage.setItem('vampireSurvivor_users', JSON.stringify(this.users));
  },
  
  // 현재 사용자 저장
  saveCurrentUser() {
    localStorage.setItem('vampireSurvivor_lastUser', this.currentUser);
  },
  
  // 현재 사용자 확인
  hasCurrentUser() {
    return this.currentUser !== '';
  }
};

// 적 관련 상수
const MAX_ENEMIES = 300;
const MIN_SPAWN_DISTANCE = 100;
const MAX_SPAWN_DISTANCE = 450;
const ENEMY_SPAWN_INTERVAL = 500;
const ENEMY_SPATIAL_GRID_SIZE = 50;
let enemySpatialGrid = {};
let totalKills = 0;


// 공통 애니메이션 관련 상수
const TARGET_FPS = 120;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

// 에셋 관리 시스템
class AssetManager {
  constructor() {
    this.images = {
      players: [],
      mapTiles: [],
      weapons: {},
      weaponIcons: {},
      levelUpIcons: {},
      artifactIcons: {},
      enemies: {},
      hitEffect: null,
      treasure: null,
      jewels: [],

      perkIcons: {},
      perkBackground: null
    };
    
    this.loaded = {
      players: false,
      mapTiles: false,
      weapons: false,
      weaponIcons: false,
      levelUpIcons: false,
      artifactIcons: false,
      enemies: false,
      hitEffect: false,
      treasure: false,
      jewels: false,

      perkIcons: false,
      perkBackground: false
    };
  }

  // 통합된 이미지 로딩 메서드
  loadImageSet(category, items, pathTemplate, options = {}) {
    let loadedCount = 0;
    const totalCount = items.length;
    const timeout = options.timeout || 5000;
    
    // 타임아웃 설정
    const timeoutId = setTimeout(() => {
      if (!this.loaded[category] && loadedCount > 0) {
        this.loaded[category] = true;
        console.log(`시간 초과로 인한 ${category} 이미지 로드 중단`);
      }
    }, timeout);
    
    items.forEach((item, index) => {
      const img = new Image();
      const path = pathTemplate.replace('{item}', item).replace('{index}', index);
      img.src = path;
      
      img.onload = () => {
        loadedCount++;
        if (loadedCount === totalCount) {
          clearTimeout(timeoutId);
          this.loaded[category] = true;
          console.log(`${category} 이미지 로드 완료`);
        }
      };
      
      img.onerror = () => {
        console.error(`${category} 이미지 로드 실패: ${item}`);
        loadedCount++;
        if (loadedCount === totalCount) {
          clearTimeout(timeoutId);
          this.loaded[category] = true;
        }
      };
      
      // 카테고리별 저장 방식
      this.storeImage(category, item, index, img, options);
    });
  }

  storeImage(category, item, index, img, options) {
    switch(category) {
      case 'players':
        this.images.players[index] = {
          name: `캐릭터 ${index + 1}`,
          image: img,
          spriteWidth: options.spriteWidth || 64,
          spriteHeight: options.spriteHeight || 64,
          frameCount: options.frameCount || 4
        };
        break;
      case 'mapTiles':
      case 'jewels':
        this.images[category][index] = img;
        break;
      default:
        this.images[category][item] = img;
        break;
    }
  }

  loadPlayerImages() {
    const playerCount = 3;
    this.images.players = [];
    
    for (let i = 0; i < playerCount; i++) {
      const img = new Image();
      img.src = `./img/player${i+1}_sprites.png`;
      img.onload = () => {
        console.log(`캐릭터 ${i+1} 스프라이트 시트 로드 완료`);
        if (this.images.players.filter(p => p).length === playerCount) {
          this.loaded.players = true;
        }
      };
      this.images.players[i] = {
        name: `캐릭터 ${i+1}`,
        image: img,
        spriteWidth: 64,
        spriteHeight: 64,
        frameCount: 4
      };
    }
  }

  loadMapTiles() {
    this.loadImageSet('mapTiles', 
      Array.from({length: 4}, (_, i) => i + 1), 
      './img/maps/map_tile_{item}.png',
      { timeout: 5000 }
    );
  }

  loadWeaponImages() {
    // 기존 무기들...
    const weaponList = ['wind', 'earth', 'flame', 'lightningChain', 'lightningImpact', 
                        'fist', 'sword', 'spear', 'magnetic', 'plasma', 'inferno', 
                        'supernova', 'supernovaParticle', 'lightningBolt'];
    
    // 폴터가이스트 이미지 8개 추가
    for (let i = 1; i <= 8; i++) {
      weaponList.push(`poltergeist_${i}`);
    }
    
    this.loadImageSet('weapons', weaponList, './img/weapons/{item}.png');
  }

  loadWeaponIcons() {
    this.loadImageSet('weaponIcons', 
      ['wind', 'earth', 'flame', 'lightning', 'fist', 'sword', 'spear', 'magnetic', 'plasma', 'inferno', 'supernova', 'lightningBolt', 'poltergeist'], 
      './img/weapon_icons/{item}_icon.png'
    );
  }
  
  loadLevelUpIcons() {
    this.loadImageSet('levelUpIcons', 
      ['attackPower', 'maxHealth', 'cooldownReduction', 'moveSpeed', 'pickupRadius', 'expMultiplier', 'dodgeRate', 'luck', 'attackRange'], 
      './img/levelup/{item}_icon.png'
    );
  }

  loadArtifactIcons() {
    const artifactIds = [
      // 커먼
      'four_leaf_clover', 'broccoli', 'log', 'cardboard_box', 'wax_wings',
      // 언커먼  
      'fortune_today', 'dead_underwear', 'learning_device', 'mustache', 
      'strong_attack', 'quick_hands', 'swift_feet',
      // 레어
      'cloak_and_dagger', 'bfg', 'bullet_time', 'wanted_poster', 
      'small_body', 'life_fountain', 'enemy_slowdown', 'enemy_weakness',
      // 에픽
      'spice_melange',
      // 레전더리
      'persona',
      // 기타
      'exp_gain'
    ];
    
    this.loadImageSet('artifactIcons', artifactIds, './img/artifacts/{item}_icon.png');
  }

  loadEnemyImages() {
    this.loadImageSet('enemies', 
      ['normal', 'fast', 'tank', 'shooter', 'boss'], 
      './img/enemies/{item}_enemy_sprites.png'
    );
    
    // 적 총알 이미지 별도 로드
    const bulletImg = new Image();
    bulletImg.src = './img/enemies/enemy_bullet.png';
    bulletImg.onload = () => console.log('적 총알 이미지 로드 완료');
    this.images.enemies.bullet = bulletImg;
  }
  
  loadMiscImages() {
    // 보물 이미지
    this.images.treasure = new Image();
    this.images.treasure.src = './img/miscs/treasure.png';
    this.images.treasure.onload = () => {
      this.loaded.treasure = true;
      console.log('보물 이미지 로드 완료');
    };

    // 특별 보물 이미지
    this.images.special_treasure = new Image();
    this.images.special_treasure.src = './img/miscs/special_treasure.png';
    this.images.special_treasure.onload = () => {
      this.loaded.special_treasure = true;
      console.log('특별 보물 이미지 로드 완료');
    };
    
    // 피격 효과 이미지
    this.images.hitEffect = new Image();
    this.images.hitEffect.src = './img/miscs/hit_effect.png';
    this.images.hitEffect.onload = () => {
      this.loaded.hitEffect = true;
      console.log('피격 효과 이미지 로드 완료');
    };
  }

  loadJewelImages() {
    this.loadImageSet('jewels', 
      Array.from({length: 5}, (_, i) => i), 
      './img/jewels/jewel_{item}.png',
      { timeout: 5000 }
    );
  }

  loadPerkIcons() {
    const perkIds = [
      'creation_physical_exp', 'creation_physical_pickup',
      'creation_magic_gold', 'creation_magic_luck',
      'destruction_physical_melee', 'destruction_physical_attack1', 'destruction_physical_speed',
      'destruction_magic_ranged', 'destruction_magic_attack2', 'destruction_magic_range', 
      'will_physical_speed', 'will_physical_health',
      'will_magic_dodge', 'will_magic_regen'
    ];
    
    this.loadImageSet('perkIcons', perkIds, './img/perks/{item}_icon.png');
  }

    loadPerkBackground() {
    this.images.perkBackground = new Image();
    this.images.perkBackground.src = './img/perks/perk_background.png'; // 800x600 이미지
    this.images.perkBackground.onload = () => {
      this.loaded.perkBackground = true;
      console.log('특성 배경 이미지 로드 완료');
    };
  }

  loadAll(callback) {
    this.loadPlayerImages();
    this.loadMapTiles();
    this.loadWeaponImages();
    this.loadWeaponIcons();
    this.loadLevelUpIcons();
    this.loadArtifactIcons();
    this.loadEnemyImages();
    this.loadMiscImages();
    this.loadJewelImages();
    this.loadPerkIcons();
    this.loadPerkBackground();
    
    // 모든 이미지가 로드되었는지 주기적으로 확인
    const checkAllLoaded = () => {
      const allLoaded = Object.values(this.loaded).every(status => status);
      if (allLoaded) {
        console.log('모든 이미지 로드 완료');
        if (callback) callback();
      } else {
        setTimeout(checkAllLoaded, 100);
      }
    };
    
    setTimeout(checkAllLoaded, 100);
  }

  isAllLoaded() {
    return Object.values(this.loaded).every(status => status);
  }
}

// 에셋 매니저 인스턴스 생성
const assetManager = new AssetManager();

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
  
  size: 7.5,
  
  // 기본값들
  baseAttackPower: 1,
  baseCooldownReduction: 0,
  baseAttackRange: 1,
  baseMoveSpeed: 1,
  baseMaxHealth: 100,
  basePickupRadius: 50,
  baseDodgeRate: 0,
  baseLuck: 0,
  baseHealthRegen: 0,
  baseGoldMultiplier: 1,
  baseExpMultiplier: 1,
  
  // 레벨업 보너스들
  levelAttackBonus: 0,
  levelCooldownBonus: 0,
  levelAttackRangeBonus: 0,
  levelMoveSpeedBonus: 0,
  levelMaxHealthBonus: 0,
  levelPickupRadiusBonus: 0,
  levelDodgeRateBonus: 0,
  levelLuckBonus: 0,
  levelHealthRegenBonus: 0,
  levelGoldMultiplierBonus: 0,
  levelExpMultiplierBonus: 0,

  // 능력치 레벨 시스템 추가
  statLevels: {
    attackPower: 0,
    cooldownReduction: 0,
    maxHealth: 0,
    moveSpeed: 0,
    attackRange: 0,
    pickupRadius: 0,
    dodgeRate: 0,
    luck: 0,
    expMultiplier: 0
  },
  
  // 능력치 최대 레벨
  maxStatLevel: 5,
  
  // 애니메이션 관련 속성들
  animationState: 'idle',
  currentFrame: 0,
  frameCount: 4,
  frameTime: 0,
  frameDuration: 150,
  spriteWidth: 64,
  spriteHeight: 64,
  
  // 방향 및 피격 효과 속성들
  direction: 'left',
  isHit: false,
  hitStartTime: 0,
  hitDuration: 500,
  hitFrame: 0,
  hitFrameTime: 0,
  hitFrameDuration: 50,
  
  // 아티팩트 관련 속성들
  acquiredArtifacts: [],
  enemySpeedReduction: 0,
  enemyHealthReduction: 0,

  // 합성된 무기 추적
  fusedWeapons: [], // 합성에 사용된 무기 타입들을 저장

  // 자석 효과 관련 속성들
  magnetActive: false,
  magnetDuration: 0,
  magnetMaxDuration: 2000,

  // 무적 상태 관련 속성들
  invincible: false,
  invincibilityDuration: 500,
  invincibilityStartTime: 0,
  isDodging: false,
  
  // 총 값 계산 메서드들
  getTotalAttackPower() {
    // 기본 공격력 보너스들 (공격력 증가 I, II)
    const attack1Bonus = permanentUpgrades.getUpgradeValue('destruction_physical_attack1');
    const attack2Bonus = permanentUpgrades.getUpgradeValue('destruction_magic_attack2');
    const basicAttackBonus = attack1Bonus + attack2Bonus;
    
    // 무기별 데미지 보너스 (추가로 적용)
    const meleeBonus = permanentUpgrades.getUpgradeValue('destruction_physical_melee');
    const rangedBonus = permanentUpgrades.getUpgradeValue('destruction_magic_ranged');
    const weaponBonus = meleeBonus + rangedBonus;
    
    return this.baseAttackPower * (1 + basicAttackBonus + weaponBonus + this.levelAttackBonus);
  },
  
  // 근접무기 전용 공격력 (무예 수련 + 공격력 증가 I,II)
  getTotalMeleeAttackPower() {
    const attack1Bonus = permanentUpgrades.getUpgradeValue('destruction_physical_attack1');
    const attack2Bonus = permanentUpgrades.getUpgradeValue('destruction_magic_attack2');
    const meleeBonus = permanentUpgrades.getUpgradeValue('destruction_physical_melee');
    
    const totalBonus = attack1Bonus + attack2Bonus + meleeBonus;
    return this.baseAttackPower * (1 + totalBonus + this.levelAttackBonus);
  },
  
  // 원거리무기 전용 공격력 (마법 숙련 + 공격력 증가 I,II)
  getTotalRangedAttackPower() {
    const attack1Bonus = permanentUpgrades.getUpgradeValue('destruction_physical_attack1');
    const attack2Bonus = permanentUpgrades.getUpgradeValue('destruction_magic_attack2');
    const rangedBonus = permanentUpgrades.getUpgradeValue('destruction_magic_ranged');
    
    const totalBonus = attack1Bonus + attack2Bonus + rangedBonus;
    return this.baseAttackPower * (1 + totalBonus + this.levelAttackBonus);
  },
  
  getTotalCooldownReduction() {
    const permanentBonus = permanentUpgrades.getUpgradeValue('destruction_physical_speed');
    return Math.min(this.baseCooldownReduction + permanentBonus + this.levelCooldownBonus, 0.8);
  },
  
  getTotalAttackRange() {
    const permanentBonus = permanentUpgrades.getUpgradeValue('destruction_magic_range');
    return this.baseAttackRange + permanentBonus + this.levelAttackRangeBonus;
  },
  
  getTotalMoveSpeed() {
    const permanentBonus = permanentUpgrades.getUpgradeValue('will_physical_speed');
    return this.baseMoveSpeed + permanentBonus + this.levelMoveSpeedBonus;
  },
  
  getTotalMaxHealth() {
    const permanentBonus = permanentUpgrades.getUpgradeValue('will_physical_health');
    return this.baseMaxHealth + permanentBonus + this.levelMaxHealthBonus;
  },
  
  getTotalPickupRadius() {
    const permanentBonus = permanentUpgrades.getUpgradeValue('creation_physical_pickup');
    return this.basePickupRadius + permanentBonus + this.levelPickupRadiusBonus;
  },
  
  getTotalDodgeRate() {
    const permanentBonus = permanentUpgrades.getUpgradeValue('will_magic_dodge');
    return Math.min(this.baseDodgeRate + permanentBonus + this.levelDodgeRateBonus, 0.8);
  },
  
  getTotalLuck() {
    const permanentBonus = permanentUpgrades.getUpgradeValue('creation_magic_luck');
    return this.baseLuck + permanentBonus + this.levelLuckBonus;
  },
  
  getTotalHealthRegen() {
    const permanentBonus = permanentUpgrades.getUpgradeValue('will_magic_regen');
    return this.baseHealthRegen + permanentBonus + this.levelHealthRegenBonus;
  },
  
  getTotalGoldMultiplier() {
    const permanentBonus = permanentUpgrades.getUpgradeValue('creation_magic_gold');
    return this.baseGoldMultiplier + permanentBonus + this.levelGoldMultiplierBonus;
  },
  
  getTotalExpMultiplier() {
    const permanentBonus = permanentUpgrades.getUpgradeValue('creation_physical_exp');
    return this.baseExpMultiplier + permanentBonus + this.levelExpMultiplierBonus;
  },

  getTotalMeleeAttackPower() {
    // 기본 공격력 + 공격력 증가 보너스 + 근접무기 전용 보너스
    const attack1Bonus = permanentUpgrades.getUpgradeValue('destruction_physical_attack1');
    const attack2Bonus = permanentUpgrades.getUpgradeValue('destruction_magic_attack2');
    const meleeBonus = permanentUpgrades.getUpgradeValue('destruction_physical_melee');
    const totalBonus = attack1Bonus + attack2Bonus + meleeBonus;
    
    return this.baseAttackPower * (1 + totalBonus + this.levelAttackBonus);
  },

  getTotalRangedAttackPower() {
    // 기본 공격력 + 공격력 증가 보너스 + 원거리무기 전용 보너스
    const attack1Bonus = permanentUpgrades.getUpgradeValue('destruction_physical_attack1');
    const attack2Bonus = permanentUpgrades.getUpgradeValue('destruction_magic_attack2');
    const rangedBonus = permanentUpgrades.getUpgradeValue('destruction_magic_ranged');
    const totalBonus = attack1Bonus + attack2Bonus + rangedBonus;
    
    return this.baseAttackPower * (1 + totalBonus + this.levelAttackBonus);
  },

  // 플레이어 초기화 메서드
  init(characterIndex) {
    this.characterType = characterIndex + 1;
    this.image = assetManager.images.players[characterIndex].image;
    this.spriteWidth = assetManager.images.players[characterIndex].spriteWidth;
    this.spriteHeight = assetManager.images.players[characterIndex].spriteHeight;
    this.frameCount = assetManager.images.players[characterIndex].frameCount;
  }
};

// 미리보기 애니메이션 객체
const previewAnimation = {
  currentFrame: 0,
  frameTime: 0,
  frameDuration: 300
};

// 기본 게임 오브젝트 클래스 (공통 속성/메서드)
class GameObject {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
  }
  
  update() {} // 오버라이드 필요
  
  draw(offsetX, offsetY) {} // 오버라이드 필요
}

//----------------------
// 보스전 시스템
//----------------------

let bossMode = false;
let bossCage = null;
let bossesKilled = 0;
let totalBosses = 3;
let lastBossDeathPosition = null;
let bossStartTime = 0;
let bossWarningActive = false;
let bossWarningStartTime = 0;
let bossWarningDuration = 5000; // 5초

// Boss 케이지 클래스
class BossCage {
  constructor(centerX, centerY) {
    this.centerX = centerX;
    this.centerY = centerY;
    this.size = 800;
    this.halfSize = this.size / 2;
    
    // 케이지 경계
    this.minX = centerX - this.halfSize;
    this.maxX = centerX + this.halfSize;
    this.minY = centerY - this.halfSize;
    this.maxY = centerY + this.halfSize;
  }
  
  // 플레이어가 케이지 안에 있는지 확인
  containsPlayer(player) {
    return player.x >= this.minX && player.x <= this.maxX &&
           player.y >= this.minY && player.y <= this.maxY;
  }
  
  // 플레이어를 케이지 안으로 제한
  constrainPlayer(player) {
    player.x = Math.max(this.minX + 15, Math.min(this.maxX - 15, player.x));
    player.y = Math.max(this.minY + 15, Math.min(this.maxY - 15, player.y));
  }
  
  // 케이지 그리기
  draw(ctx, offsetX, offsetY) {
    ctx.save();
    
    // 케이지 외벽
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 5;
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 10;
    
    ctx.strokeRect(
      this.minX + offsetX,
      this.minY + offsetY,
      this.size,
      this.size
    );
    
    // 내부 패턴
    ctx.strokeStyle = '#AA0000';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    
    ctx.strokeRect(
      this.minX + offsetX + 10,
      this.minY + offsetY + 10,
      this.size - 20,
      this.size - 20
    );
    
    ctx.setLineDash([]);
    ctx.restore();
  }
}

// 특별 상자 클래스
class SpecialTreasure extends GameObject {
  constructor(x, y) {
    super(x, y, 20);
    this.collected = false;
    this.isTreasure = true;
  }
  
  update() {
  }
  
  draw(offsetX, offsetY) {
    const drawX = this.x + offsetX;
    const drawY = this.y + offsetY;
    
    // 상자 그리기
    if (assetManager.loaded.special_treasure) {
      const imgSize = this.size * 2;
      ctx.drawImage(
        assetManager.images.special_treasure,
        drawX - imgSize/2,
        drawY - imgSize/2,
        imgSize,
        imgSize
      );
    } else {
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(drawX - this.size/2, drawY - this.size/2, this.size, this.size);
    }
  }
  
  collect() {
    if (!this.collected) {
      this.collected = true;
      
      // 자석 효과 활성화
      player.magnetActive = true;
      player.magnetDuration = player.magnetMaxDuration;
      
      // 레전더리 아티팩트 선택 화면
      currentGameState = GAME_STATE.LEVEL_UP;
      pauseStartTime = gameTimeSystem.getTime();
      previousGameState = GAME_STATE.PLAYING;
      generateLegendaryArtifactOptions();
    }
  }
}

// 레전더리 아티팩트 선택 함수
function generateLegendaryArtifactOptions() {
  isArtifactSelection = true;
  
  // 레전더리 아티팩트만 선택
  const legendaryArtifacts = artifactSystem.artifacts.filter(artifact => 
    artifact.rarity === ARTIFACT_RARITY.LEGENDARY && 
    !player.acquiredArtifacts.includes(artifact.id)
  );
  
  // 레전더리가 부족하면 에픽도 포함
  let availableArtifacts = [...legendaryArtifacts];
  if (availableArtifacts.length < 3) {
    const epicArtifacts = artifactSystem.artifacts.filter(artifact => 
      artifact.rarity === ARTIFACT_RARITY.EPIC && 
      !player.acquiredArtifacts.includes(artifact.id)
    );
    availableArtifacts = [...availableArtifacts, ...epicArtifacts];
  }
  
  // 3개 선택 (부족하면 있는 만큼)
  const selectedCount = Math.min(3, availableArtifacts.length);
  const selectedArtifacts = [];
  
  for (let i = 0; i < selectedCount; i++) {
    const randomIndex = Math.floor(Math.random() * availableArtifacts.length);
    selectedArtifacts.push(availableArtifacts[randomIndex]);
    availableArtifacts.splice(randomIndex, 1);
  }
  
  // 선택된 아티팩트가 3개 미만이면 경험치 옵션으로 채우기
  while (selectedArtifacts.length < 3) {
    const xpGain = Math.floor((player.nextLevelExp) * 0.3);
    selectedArtifacts.push({
      id: 'exp_gain',
      name: '경험치 획득',
      description: `${xpGain} 경험치 획득`,
      flavorText: '지식과 경험을 얻는다.',
      rarity: ARTIFACT_RARITY.COMMON,
      iconId: 'exp_gain',
      effects: [{ type: 'expGain', value: xpGain }]
    });
  }
  
  // 레벨업 옵션으로 변환
  levelUpOptions = selectedArtifacts.map(artifact => ({
    type: 'artifact',
    artifactId: artifact.id,
    name: artifact.name,
    description: artifact.description,
    flavorText: artifact.flavorText,
    rarity: artifact.rarity,
    iconId: artifact.iconId,
    effects: artifact.effects
  }));
  
  hoveredLevelUpOption = -1;
}

function startBossMode() {
  // 경고 종료
  endBossWarning();
  
  bossMode = true;
  bossesKilled = 0;
  bossStartTime = gameTimeSystem.getTime();
  
  // 케이지 생성 (플레이어 현재 위치 중심)
  bossCage = new BossCage(player.x, player.y);
  
  // Boss 몬스터 3마리 스폰
  for (let i = 0; i < totalBosses; i++) {
    const angle = (Math.PI * 2 * i) / totalBosses;
    const distance = 300;
    
    const bossX = player.x + Math.cos(angle) * distance;
    const bossY = player.y + Math.sin(angle) * distance;
    
    const boss = new BossEnemy(bossX, bossY);
    boss.isBossModeEnemy = true; // 보스전 몬스터 표시
    gameObjects.enemies.push(boss);
  }
  
  // 기존 적들 제거
  gameObjects.enemies = gameObjects.enemies.filter(enemy => 
    enemy.isBossModeEnemy || enemy.state === 'dying'
  );
  
  // 화면 흔들림 효과
  screenShakeTime = 500;
  screenShakeIntensity = 10;
}

// 보스전 종료 함수
function endBossMode() {
  // 보스전에 소요된 시간을 일시정지 시간에 추가
  if (bossStartTime > 0) {
    const bossElapsedTime = gameTimeSystem.getTime() - bossStartTime + 1000;
    totalPausedTime += bossElapsedTime;
  }
  
  // 특별 상자 생성
  if (lastBossDeathPosition) {
    const specialTreasure = new SpecialTreasure(
      lastBossDeathPosition.x,
      lastBossDeathPosition.y
    );
    gameObjects.terrain.push(specialTreasure);
  }
  
  // 케이지 제거 (약간의 지연 후)
  setTimeout(() => {
    bossMode = false;
    bossCage = null;
  }, 2000);

  // 스폰 시스템 상태 리셋
  spawnState.bossWarningActive = false;
  spawnState.currentPhase = 'normal';
  spawnState.waveStartTime = elapsedTime;
  spawnState.currentWaveIndex = 0;
  spawnState.enemiesThisWave = 0;
}

// 보스전 경고 시작 함수
function startBossWarning() {
  bossWarningActive = true;
  bossWarningStartTime = gameTimeSystem.getTime();
  
  // 화면 흔들림 효과
  screenShakeTime = 300;
  screenShakeIntensity = 3;
}

// 보스전 경고 종료 함수  
function endBossWarning() {
  bossWarningActive = false;
}

//----------------------
// 무기 시스템
//----------------------

// 무기 클래스
class Weapon {
  constructor(config = {}) {
    this.type = config.type || 'wind';
    this.baseCooldown = config.baseCooldown || 1000;
    this.cooldown = this.baseCooldown;
    this.lastAttackTime = gameTimeSystem.getTime();
    this.damage = config.damage || 10;
    
    // 레벨 시스템 추가
    this.level = 1;
    this.maxLevel = 10; // 최대 레벨
    
    // 무기별 추가 속성들
    Object.assign(this, config.properties || {});
  }

  updateCooldown(cooldownReduction) {
    this.cooldown = this.baseCooldown * (1 - cooldownReduction);
  }

  update() {
    const now = gameTimeSystem.getTime();
    if (now - this.lastAttackTime >= this.cooldown) {
      this.fire();
      this.lastAttackTime = now;
    }
  }

  fire() {
    // 하위 클래스에서 구현
  }
  
  // 업그레이드 메서드
  upgrade() {
    if (this.level < this.maxLevel) {
      this.level++;
      this.applyLevelBonus();
      return true;
    }
    return false;
  }
  
  // 레벨별 보너스 적용 (하위 클래스에서 오버라이드)
  applyLevelBonus() {
    // 기본: 데미지 10% 증가 (적용 보류)
    this.damage *= 1.0;
  }
  
  // 무기가 최대 레벨인지 확인
  isMaxLevel() {
    return this.level >= this.maxLevel;
  }
}

// 투사체 클래스
class Bullet {
  constructor(x, y, size, speed, angle, damage) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.baseSpeed = speed;
    this.speed = speed;
    this.angle = angle;
    this.baseDamage = damage;
    this.damage = damage * player.getTotalRangedAttackPower();
    this.used = false;
    
    // 회전 애니메이션을 위한 속성 추가
    this.rotation = 0;
    this.rotationSpeed = 0.2; // 회전 속도
  }

  update() {
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
    
    // 회전 애니메이션 업데이트
    this.rotation += this.rotationSpeed;

    // 적과 충돌 체크
    for (let enemy of gameObjects.enemies) {
      if (enemy.state === 'moving' && detectCollision(this, enemy)) {
        enemy.takeDamage(this.damage);
        this.used = true;
      }
    }
  }

  draw(offsetX, offsetY) {
    if (assetManager.loaded.weapons && assetManager.images.weapons.wind) {
      const scale = 0.4; // 크기 조절 (0.8 = 80% 크기)
      const drawSize = 64 * scale;
      
      ctx.save();
      
      // 투사체 위치로 이동
      ctx.translate(this.x + offsetX, this.y + offsetY);
      
      // 투사체 회전 (선택사항: 비행 방향으로 회전)
      ctx.rotate(this.angle);
      
      // 추가 회전 애니메이션 (선택사항)
      // ctx.rotate(this.rotation);
      
      // 이미지 그리기 (중앙 정렬)
      ctx.drawImage(
        assetManager.images.weapons.wind,
        -drawSize / 2,
        -drawSize / 2,
        drawSize,
        drawSize
      );
      
      ctx.restore();
    }
  }

  outOfBounds() {
    const maxDistance = 2000;
    return !isWithinDistance(this, player, maxDistance);
  }
}

// 공기탄 무기 클래스
class WindWeapon extends Weapon {
  constructor() {
    super({
      type: 'wind',
      baseCooldown: 1000,
      damage: 10
    });
    this.projectileCount = 1;
    this.baseProjectileSpeed = 3.5; // 기본 투사체 속도 (고정)
    
    // 연속 발사 관련 속성
    this.burstFiring = false; // 연속 발사 중인지 여부
    this.burstCount = 0; // 현재 연속 발사에서 몇 발 쐈는지
    this.burstInterval = 120; // 연속 발사 간격 (ms) - 빠른 연사
    this.lastBurstTime = 0; // 마지막 연속 발사 시간
    this.burstTarget = null; // 연속 발사 대상 (방향 고정용)
  }
  
  update() {
    const now = gameTimeSystem.getTime();
    
    // 연속 발사 중이 아닐 때 일반 쿨다운 체크
    if (!this.burstFiring && now - this.lastAttackTime >= this.cooldown) {
      this.fire();
      this.lastAttackTime = now;
    }
    
    // 연속 발사 처리
    if (this.burstFiring) {
      if (now - this.lastBurstTime >= this.burstInterval) {
        this.fireSingleBurst();
        this.lastBurstTime = now;
        this.burstCount++;
        
        // 연속 발사 완료 체크
        if (this.burstCount >= this.projectileCount) {
          this.burstFiring = false;
          this.burstCount = 0;
          this.burstTarget = null;
        }
      }
    }
  }
  
  fire() {
    // 가장 가까운 적을 향해 연속 발사 시작
    const nearestEnemy = findNearestEnemy();
    if (nearestEnemy) {
      this.burstTarget = {
        x: nearestEnemy.x,
        y: nearestEnemy.y
      };
      
      // 첫 번째 발사
      this.fireSingleBurst();
      this.burstCount = 1;
      this.lastBurstTime = gameTimeSystem.getTime();
      
      // 여러 발을 쏠 경우 연속 발사 모드 시작
      if (this.projectileCount > 1) {
        this.burstFiring = true;
      }
    }
  }
  
  fireSingleBurst() {
    if (this.burstTarget) {
      const angle = Math.atan2(
        this.burstTarget.y - player.y, 
        this.burstTarget.x - player.x
      );
      
      // 약간의 랜덤 각도 추가 (정확도 약간 감소)
      const randomSpread = (Math.random() - 0.5) * 0.15; // ±약 5도
      const finalAngle = angle + randomSpread;
      
      gameObjects.bullets.push(
        new Bullet(
          player.x, player.y, 2.5, this.baseProjectileSpeed,
          finalAngle,
          this.damage * player.getTotalRangedAttackPower() // 공격력 특성 적용
        )
      );
    }
  }
  
  applyLevelBonus() {
    super.applyLevelBonus();
    
    // 10레벨 시스템에 맞춘 균형잡힌 강화
    switch(this.level) {
      case 2:
        this.projectileCount = 2; // 2발
        break;
      case 3:
        this.baseCooldown *= 0.9; // 쿨타임 감소
        break;
      case 4:
        this.projectileCount = 3; // 3발
        break;
      case 5:
        this.damage += 5; // 데미지 증가
        break;
      case 6:
        this.projectileCount = 4; // 4발
        this.baseCooldown *= 0.85; // 쿨타임 추가 감소
        break;
      case 7:
        this.burstInterval = 100; // 연사 속도 증가
        break;
      case 8:
        this.projectileCount = 5; // 5발
        this.damage += 5; // 데미지 추가 증가
        break;
      case 9:
        this.baseCooldown *= 0.8; // 쿨타임 추가 감소
        break;
      case 10:
        this.projectileCount = 6; // 6발 (최대)
        this.burstInterval = 80; // 최대 연사 속도
        this.damage += 10; // 최종 데미지 보너스
        break;
    }
  }
}

class EarthWeapon extends Weapon {
  constructor() {
    super({
      type: 'earth',
      baseCooldown: 50,
      damage: 8
    });
    this.orbitRadius = 75; // 궤도 반지름
    this.orbitSpeed = 0.03;       
    this.orbitAngle = 0;          
    this.orbCount = 1;            
    this.damageCooldown = 100;    
    this.lastDamageTime = 0;
    this.baseOrbSize = 4; // 기본 구체 크기
    this.orbSize = this.baseOrbSize; // 현재 구체 크기
    
    // 구체를 게임 객체로 생성
    this.createOrbs();
  }
  
  // 공격 범위 특성 적용 - 구체 크기만 변경
  updateRange() {
    this.orbSize = this.baseOrbSize * player.getTotalAttackRange();
    this.createOrbs();
  }
  
  createOrbs() {
    // 기존 구체 제거
    this.removeOldOrbs();
    
    // 새 구체 생성
    for (let i = 0; i < this.orbCount; i++) {
      const angle = (Math.PI * 2 * i) / this.orbCount;
      const orb = new EarthOrb(
        player.x, 
        player.y,
        angle,
        this.orbitRadius, // 고정된 반지름
        this.orbSize, // 공격 범위 특성이 적용된 크기
        this.damage * player.getTotalRangedAttackPower(), // 공격력 특성 적용
        this
      );
      gameObjects.bullets.push(orb);
    }
  }
  
  removeOldOrbs() {
    // 이전 구체들 제거
    gameObjects.bullets = gameObjects.bullets.filter(b => !(b instanceof EarthOrb && b.parent === this));
  }
  
  update() {
    this.orbitAngle += this.orbitSpeed;
  }
  
  // 업그레이드 시 구체 재생성
  upgrade() {
    if (this.level < this.maxLevel) {
      this.level++;
      this.applyLevelBonus();
      this.createOrbs(); // 구체 재생성
      return true;
    }
    return false;
  }
  
  fire() {
    // 사용되지 않음
  }

  applyLevelBonus() {
    // 10레벨 시스템에 맞춘 균형잡힌 강화
    switch(this.level) {
      case 2:
        this.orbCount = 2; // 2개
        this.damage += 2;
        break;
      case 3:
        this.orbitSpeed = 0.035; // 회전 속도 증가
        break;
      case 4:
        this.orbCount = 3; // 3개
        this.damage += 3;
        break;
      case 5:
        this.baseOrbSize = 10; // 구체 크기 증가
        this.updateRange();
        break;
      case 6:
        this.orbCount = 4; // 4개
        this.damage += 3;
        this.damageCooldown = 80; // 데미지 간격 감소
        break;
      case 7:
        this.orbitSpeed = 0.04; // 회전 속도 추가 증가
        break;
      case 8:
        this.orbCount = 5; // 5개
        this.damage += 4;
        break;
      case 9:
        this.baseOrbSize = 12; // 구체 크기 추가 증가
        this.updateRange();
        break;
      case 10:
        this.orbCount = 6; // 6개 (최대)
        this.damage += 5; // 최종 데미지 보너스
        this.damageCooldown = 60; // 최소 데미지 간격
        this.orbitSpeed = 0.045; // 최대 회전 속도
        break;
    }
  }
}

// EarthOrb 클래스
class EarthOrb {
  constructor(x, y, baseAngle, radius, size, damage, parent) {
    this.x = x;
    this.y = y;
    this.baseAngle = baseAngle;
    this.radius = radius; // 고정된 궤도 반지름
    this.size = size; // 공격 범위 특성이 적용된 크기
    this.damage = damage;
    this.used = false;
    this.parent = parent;
    this.rotationAngle = Math.random() * Math.PI * 2;
    this.rotationSpeed = 0.05;
  }
  
  update() {
    if (this.used) return;
    
    // 플레이어 주변 회전 (고정된 반지름 사용)
    const totalAngle = this.parent.orbitAngle + this.baseAngle;
    this.x = player.x + Math.cos(totalAngle) * this.radius;
    this.y = player.y + Math.sin(totalAngle) * this.radius;
    
    // 구체 자체 회전
    this.rotationAngle += this.rotationSpeed;
    
    // 적과 충돌 검사
    const currentTime = gameTimeSystem.getTime();
    if (currentTime - this.parent.lastDamageTime >= this.parent.damageCooldown) {
      for (let enemy of gameObjects.enemies) {
        if (enemy.state === 'moving' && detectCollision(this, enemy)) {
          enemy.takeDamage(this.damage);
          this.parent.lastDamageTime = currentTime;
          break;
        }
      }
    }
  }
  
  draw(offsetX, offsetY) {
    // 첫 번째 구체(baseAngle이 0인 구체)만 궤도 링을 그리기
    if (this.baseAngle === 0 || Math.abs(this.baseAngle) < 0.1) {
      this.drawOrbitRing();
    }
    
    // 구체 그리기 - 크기가 공격 범위에 따라 조정됨
    const drawSize = this.size * 3; // 공격 범위가 적용된 크기
      
    ctx.save();
    ctx.translate(this.x + offsetX, this.y + offsetY);
    ctx.rotate(this.rotationAngle);
        
    // 이미지 그리기
    if (assetManager.loaded.weapons && assetManager.images.weapons.earth) {
      ctx.globalAlpha = 1;
      ctx.drawImage(
        assetManager.images.weapons.earth,
        -drawSize / 2,
        -drawSize / 2,
        drawSize,
        drawSize
      );
    }
    ctx.restore();
  }
  
  // 궤도 링 그리기 메서드 - 고정된 반지름과 두께
  drawOrbitRing() {
    ctx.save();
    
    // 고정된 두께로 유지
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.arc(
      canvas.width / 2,  // 플레이어 화면 중앙 X
      canvas.height / 2, // 플레이어 화면 중앙 Y
      this.radius,       // 고정된 궤도 반지름
      0, 
      Math.PI * 2
    );
    ctx.stroke();
    
    ctx.restore();
  }
  
  outOfBounds() {
    return false; // 플레이어 주변에 고정됨
  }
}


class FlameWeapon extends Weapon {
  constructor() {
    super({
      type: 'flame',
      baseCooldown: 5000,
      damage: 15
    });
    this.flameAngle = Math.PI / 3; // 60도 부채꼴
    this.baseRange = 100; // 기본 범위
    this.range = this.baseRange;
    this.duration = 3000;
    this.activeFlames = [];
    this.isFiring = false;
  }
  
  // 공격 범위 특성 적용
  updateRange() {
    this.range = this.baseRange * player.getTotalAttackRange();
  }
  
  update() {
    const now = gameTimeSystem.getTime();
    
    // 활성화된 화염 중 사용 완료된 것 제거
    this.activeFlames = this.activeFlames.filter(flame => !flame.used);
    
    // 발사 중인지 확인
    this.isFiring = this.activeFlames.length > 0;
    
    // 발사 중이 아니고 쿨다운이 지났으면 발사
    if (!this.isFiring && now - this.lastAttackTime - this.duration >= this.cooldown) {
      this.fire();
      this.lastAttackTime = now;
    }
  }
  
  fire() {
    const flame = new FlameEffect(
      player.x, 
      player.y,
      this.flameAngle,
      this.range, // 공격 범위 특성이 적용된 범위
      this.damage * player.getTotalRangedAttackPower(), // 공격력 특성 적용
      this.duration
    );
    
    this.activeFlames.push(flame);
    gameObjects.bullets.push(flame);
  }
  
  applyLevelBonus() {
    super.applyLevelBonus();
    
    // 10레벨 시스템에 맞춘 균형잡힌 강화
    switch(this.level) {
      case 2:
        this.baseRange += 25; // 범위 증가
        break;
      case 3:
        this.flameAngle += Math.PI / 12; // 각도 증가 (75도)
        break;
      case 4:
        this.damage += 5; // 데미지 증가
        this.duration += 300; // 지속시간 증가
        break;
      case 5:
        this.baseRange += 30; // 범위 추가 증가
        break;
      case 6:
        this.flameAngle += Math.PI / 12; // 각도 추가 증가 (90도)
        this.baseCooldown *= 0.85; // 쿨타임 감소
        break;
      case 7:
        this.damage += 7; // 데미지 추가 증가
        break;
      case 8:
        this.baseRange += 35; // 범위 추가 증가
        this.duration += 500; // 지속시간 추가 증가
        break;
      case 9:
        this.flameAngle += Math.PI / 12; // 각도 추가 증가 (105도)
        break;
      case 10:
        this.damage += 10; // 최종 데미지 보너스
        this.baseCooldown *= 0.7; // 최종 쿨타임 감소
        this.duration += 700; // 최종 지속시간 (5초)
        break;
    }
    
    this.updateRange();
    this.updateCooldown(player.getTotalCooldownReduction());
  }
}

// 화염 효과 클래스
class FlameEffect {
  constructor(x, y, angle, range, damage, duration) {
    this.x = x;
    this.y = y;
    this.angle = angle; // 부채꼴 각도
    this.range = range; // 최대 범위 (공격 범위 특성이 적용된 값)
    this.damage = damage; // 데미지
    this.duration = duration; // 지속 시간
    this.startTime = gameTimeSystem.getTime(); // 생성 시간
    this.used = false; // 사용 여부
    this.fadeOutStart = 0.85; // 지속 시간의 85%에서 페이드 아웃 시작
    
    // 애니메이션 관련 속성
    this.currentFrame = 0;
    this.frameCount = 4;
    this.frameWidth = 64;
    this.frameHeight = 64;
    this.frameTime = 0;
    this.frameDuration = 100;
  }
  
  update() {
    const currentTime = gameTimeSystem.getTime();
    const elapsedTime = currentTime - this.startTime;
    
    // 지속 시간 체크
    if (elapsedTime >= this.duration) {
      this.used = true;
      return;
    }
    
    // 애니메이션 프레임 업데이트
    this.frameTime += 16;
    if (this.frameTime >= this.frameDuration) {
      this.frameTime = 0;
      this.currentFrame = (this.currentFrame + 1) % this.frameCount;
    }
    
    // 플레이어 위치에 고정 (플레이어 따라다님)
    this.x = player.x;
    this.y = player.y;
    
    // 현재 마우스 방향으로 화염 방향 실시간 업데이트
    const dx = mouseWorldX - player.x;
    const dy = mouseWorldY - player.y;
    const currentDirection = Math.atan2(dy, dx);
    
    // 부채꼴 범위 내 적 데미지 처리
    for (let enemy of gameObjects.enemies) {
      if (enemy.state !== 'moving') continue;
      
      // 적과 플레이어 사이의 각도 계산
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const distanceToEnemy = Math.sqrt(dx * dx + dy * dy) - enemy.size;
      
      // 범위 내에 있는지 확인
      if (distanceToEnemy <= this.range) {
        // 각도 계산
        const angleToEnemy = Math.atan2(dy, dx);
        
        // 각도 차이 계산 (-PI ~ PI 사이로 정규화)
        let angleDiff = angleToEnemy - currentDirection;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        angleDiff = Math.abs(angleDiff);
        
        // 부채꼴 내에 있는지 확인
        if (angleDiff <= this.angle / 2) {
          // 데미지 적용 (초당 3회 = 16ms마다 데미지/20)
          enemy.takeDamage(this.damage / 20);
        }
      }
    }
  }
    
  draw(offsetX, offsetY) {
    if (!assetManager.loaded.weapons || !assetManager.images.weapons.flame) {
      return;
    }
    
    // 현재 마우스 방향으로 화염 방향 실시간 업데이트
    let currentDirection = this.lastDirection || 0;
    
    if (currentGameState === GAME_STATE.PLAYING) {
      const dx = mouseWorldX - player.x;
      const dy = mouseWorldY - player.y;
      currentDirection = Math.atan2(dy, dx);
      this.lastDirection = currentDirection;
    }
    
    // 화염 효과 그리기
    ctx.save();
    
    // 플레이어 위치로 이동 후 방향에 맞게 회전
    ctx.translate(this.x + offsetX, this.y + offsetY);
    ctx.rotate(currentDirection);
    
    // 투명도 설정
    let opacity;
    if (currentGameState === GAME_STATE.PLAYING) {
      const elapsed = gameTimeSystem.getTime() - this.startTime;
      const progress = elapsed / this.duration;
      
      if (progress >= this.fadeOutStart) {
        const fadeProgress = (progress - this.fadeOutStart) / (1 - this.fadeOutStart);
        opacity = Math.pow(1 - fadeProgress, 2);
      } else {
        opacity = 1.0;
      }
      
      this.currentOpacity = opacity;
    } else {
      opacity = this.currentOpacity || 1.0;
    }
    
    ctx.globalAlpha = opacity;
    
    // 화염 애니메이션 프레임 그리기 - 범위에 맞춰 크기 조정
    const frameX = this.currentFrame * this.frameWidth;
    const drawSize = this.range * 0.9; // 범위에 비례하여 크기 결정
    
    ctx.drawImage(
      assetManager.images.weapons.flame,
      frameX, 0,
      this.frameWidth, this.frameHeight,
      0, -drawSize/2, // 중앙 정렬
      drawSize, drawSize
    );
    
    ctx.restore();
  }
}

// 번개 무기 클래스
class LightningWeapon extends Weapon {
  constructor() {
    super({
      type: 'lightning',
      baseCooldown: 2000,
      damage: 15
    });
    this.chainCount = 3;
    this.baseChainRange = 75; // 기본 체인 범위
    this.chainRange = this.baseChainRange;
    this.baseMaxTargetDistance = 200; // 기본 최대 거리
    this.maxTargetDistance = this.baseMaxTargetDistance;
  }
  
  // 공격 범위 특성 적용
  updateRange() {
    this.chainRange = this.baseChainRange * player.getTotalAttackRange();
    this.maxTargetDistance = this.baseMaxTargetDistance * player.getTotalAttackRange();
  }
  
  fire() {
    // 공격 범위 내에서 가장 가까운 적 직접 찾기
    let nearestEnemy = null;
    let minDistance = this.maxTargetDistance; // 공격 범위 특성이 적용된 거리
    
    for (let enemy of gameObjects.enemies) {
      if (enemy.state === 'moving') {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distance = Math.hypot(dx, dy) - enemy.size;
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestEnemy = enemy;
        }
      }
    }
    
    if (nearestEnemy) {
      // 적을 찾으면 체인 라이트닝 효과 생성
      gameObjects.bullets.push(
        new ChainLightningEffect(
          player.x, player.y,
          nearestEnemy.x, nearestEnemy.y,
          this.damage * player.getTotalRangedAttackPower(), // 공격력 특성 적용
          this.chainCount,
          this.chainRange, // 공격 범위 특성이 적용된 체인 범위
          nearestEnemy
        )
      );
    }
  }
  
  applyLevelBonus() {
    super.applyLevelBonus();
    
    // 10레벨 시스템에 맞춘 균형잡힌 강화
    switch(this.level) {
      case 2:
        this.chainCount = 4; // 체인 +1
        break;
      case 3:
        this.baseChainRange += 20; // 체인 범위 증가
        break;
      case 4:
        this.damage += 5; // 데미지 증가
        this.baseCooldown *= 0.9; // 쿨타임 감소
        break;
      case 5:
        this.chainCount = 5; // 체인 +1
        break;
      case 6:
        this.baseMaxTargetDistance += 50; // 최대 사거리 증가
        break;
      case 7:
        this.chainCount = 6; // 체인 +1
        this.damage += 7; // 데미지 추가 증가
        break;
      case 8:
        this.baseChainRange += 30; // 체인 범위 추가 증가
        this.baseCooldown *= 0.85; // 쿨타임 추가 감소
        break;
      case 9:
        this.chainCount = 7; // 체인 +1
        break;
      case 10:
        this.chainCount = 8; // 최대 체인
        this.damage += 10; // 최종 데미지 보너스
        this.baseMaxTargetDistance += 100; // 최종 사거리 증가
        break;
    }
    
    this.updateRange();
    this.updateCooldown(player.getTotalCooldownReduction());
  }
}

// 체인 번개 이펙트 클래스
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
    this.maxAge = 45;
    this.fadeOutStart = 0.7; // 지속 시간의 70%에서 페이드 아웃 시작
    this.used = false;
    this.hasHit = false;
    
    // 스프라이트 애니메이션 관련 속성
    this.frameCount = 4;
    this.currentFrame = Math.floor(Math.random() * 4); // 랜덤 시작 프레임
    this.frameTime = 0;
    this.frameDuration = 80;
    this.frameWidth = 256; // 프레임 너비 (전체 스프라이트 시트 너비)
    this.frameHeight = 64; // 각 프레임 높이
  }
  
  update() {
    this.age++;
    
    // 애니메이션 프레임 업데이트 - 랜덤 프레임 선택
    this.frameTime += 16;
    if (this.frameTime >= this.frameDuration) {
      this.frameTime = 0;
      this.currentFrame = Math.floor(Math.random() * this.frameCount);
    }
    
    // 대상 적에게 데미지 입히기
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
    // 기존 체인 로직 유지
    // 범위 내 다른 적 찾기
    const nearbyEnemies = gameObjects.enemies.filter(enemy => {
      if (enemy === sourceEnemy || enemy === this.targetEnemy || enemy.state !== 'moving') return false;
      
      const dx = enemy.x - sourceEnemy.x;
      const dy = enemy.y - sourceEnemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy) - enemy.size;
      
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
      gameObjects.bullets.push(
        new ChainLightningEffect(
          sourceEnemy.x, sourceEnemy.y,
          nextEnemy.x, nextEnemy.y,
          this.damage * 0.8,
          this.chainCount - 1,
          this.chainRange,
          nextEnemy
        )
      );
    }
  }
  
  draw(offsetX, offsetY) {
    // 로드 상태 확인 및 디버깅
    if (!assetManager.loaded.weapons || !assetManager.images.weapons.lightningChain) {
      console.error("Lightning chain image not loaded or undefined");
      return;
    }
    
    // 투명도 계산 - 급격한 페이드아웃 적용
    let alpha;
    const lifeProgress = this.age / this.maxAge;
    
    // 시간의 70% 이후부터 급격하게 페이드아웃
    if (lifeProgress >= this.fadeOutStart) {
      // 페이드아웃 구간 내 진행률 계산 (0~1)
      const fadeProgress = (lifeProgress - this.fadeOutStart) / (1 - this.fadeOutStart);
      // 급격한 페이드아웃을 위한 제곱함수
      alpha = Math.pow(1 - fadeProgress, 2);
    } else {
      alpha = 1.0;
    }
    
    ctx.save();
    ctx.globalAlpha = alpha;
    
    // 두 끝점 사이의 중간점 찾기
    const midX = (this.startX + this.endX) / 2 + offsetX;
    const midY = (this.startY + this.endY) / 2 + offsetY;
    
    // 두 점 사이의 각도 계산
    const angle = Math.atan2(this.endY - this.startY, this.endX - this.startX);
    
    // 두 점 사이의 거리 계산
    const distance = Math.hypot(this.endX - this.startX, this.endY - this.startY);
    
    // 체인 번개 이미지 그리기
    const drawSize = 25;
    
    ctx.translate(midX, midY);
    ctx.rotate(angle);
    

    // 스프라이트 시트에서 현재 프레임 그리기
    // 가로 스트립
    ctx.drawImage(
      assetManager.images.weapons.lightningChain,
      0, this.currentFrame * this.frameHeight, // y축으로 프레임 선택
      this.frameWidth, this.frameHeight,
      -distance / 2,
      -drawSize / 2,
      distance,
      drawSize
    );
    
    // 충격 효과 그리기
    const impactSize = drawSize * 1.5;
    ctx.translate(distance / 2, 0);
    ctx.rotate(-angle);
    
    // 임팩트 효과도 무작위 프레임 사용
    ctx.drawImage(
      assetManager.images.weapons.lightningImpact,
      this.currentFrame * 64, 0, // 임팩트는 기존 스프라이트 사용
      64, 64,
      -impactSize / 2,
      -impactSize / 2,
      impactSize,
      impactSize
    );
    
    ctx.restore();
  }
}

// 무기 팩토리 - 무기 생성과 업그레이드 관리
const WeaponFactory = {
  createWeapon(type) {
    switch(type) {
      case 'wind':
        return new WindWeapon();
      case 'earth':
        return new EarthWeapon();
      case 'flame':
        return new FlameWeapon();
      case 'lightning':
        return new LightningWeapon();
      case 'fist':
        return new FistWeapon();
      case 'sword':
        return new SwordWeapon();
      case 'spear':
        return new SpearWeapon();
      case 'magnetic':
        return new MagneticWeapon();
      case 'plasma':
        return new PlasmaWeapon();
      case 'inferno':
        return new InfernoWeapon();
      case 'supernova':
        return new SupernovaWeapon();
      case 'lightningBolt':
        return new LightningBoltWeapon();
      case 'poltergeist':
        return new PoltergeistWeapon();
      default:
        return new WindWeapon();
    }
    
    // 무기에 updateRange 메서드가 있으면 초기 범위 적용
    if (weapon && weapon.updateRange) {
      weapon.updateRange();
    }
  }
};

//----------------------
// 근접 무기 시스템
//----------------------

// 기본 근접 무기 클래스
class MeleeWeapon extends Weapon {
  constructor(config = {}) {
    super(config);
    this.range = config.range || 50;
    this.effectDuration = config.effectDuration || 300;
    this.attackAngle = config.attackAngle || Math.PI; // 공격 각도 (라디안)
  }

  fire() {
    // 마우스 방향으로 공격
    const dx = mouseWorldX - player.x;
    const dy = mouseWorldY - player.y;
    const attackDirection = Math.atan2(dy, dx);
    
    // 공격 범위 내 적들 찾기
    const targets = this.findTargetsInRange(attackDirection);
    
    // 적들에게 데미지 적용
    targets.forEach(enemy => {
      enemy.takeDamage(this.damage * player.getTotalMeleeAttackPower());
    });
    
    // 시각적 효과 생성
    this.createEffect(attackDirection);
  }

  findTargetsInRange(attackDirection) {
    // 하위 클래스에서 오버라이드
    return [];
  }

  createEffect(attackDirection) {
    // 하위 클래스에서 오버라이드
  }
}

// 주먹 무기 클래스
class FistWeapon extends MeleeWeapon {
  constructor() {
    super({
      type: 'fist',
      baseCooldown: 400, // 빠른 공격속도
      damage: 15,
      range: 50,
      effectDuration: 300
    });
    this.baseRange = 50; // 기본 범위 저장
  }

  // 공격 범위 특성 적용
  updateRange() {
    this.range = this.baseRange * player.getTotalAttackRange();
  }

  // fire 메서드를 오버라이드해서 자동으로 가장 가까운 적 공격
  fire() {
    // 범위 내에서 가장 가까운 적 찾기
    let nearestEnemy = null;
    let minDistance = this.range; // 공격 범위 특성이 적용된 범위 사용
    
    for (let enemy of gameObjects.enemies) {
      if (enemy.state !== 'moving') continue;
      
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy) - enemy.size;
      
      if (distance <= this.range && distance < minDistance) {
        minDistance = distance;
        nearestEnemy = enemy;
      }
    }
    
    // 적이 있으면 공격
    if (nearestEnemy) {
      // 적에게 데미지 적용 (공격력 특성 적용)
      nearestEnemy.takeDamage(this.damage * player.getTotalMeleeAttackPower());
      
      // 적 방향 계산
      const dx = nearestEnemy.x - player.x;
      const dy = nearestEnemy.y - player.y;
      const attackDirection = Math.atan2(dy, dx);
      
      // 시각적 효과 생성
      this.createEffect(attackDirection, nearestEnemy);
    }
  }

  createEffect(attackDirection, targetEnemy) {
    const effect = new FistEffect(
      player.x, // 플레이어 위치에서 시작
      player.y,
      attackDirection,
      this.effectDuration,
      targetEnemy // 목표 적
    );
    gameObjects.bullets.push(effect);
  }

  applyLevelBonus() {
    super.applyLevelBonus();
    
    // 10레벨 시스템에 맞춘 균형잡힌 강화
    switch(this.level) {
      case 2:
        this.baseCooldown *= 0.9; // 공속 증가
        break;
      case 3:
        this.baseRange += 10; // 범위 증가
        break;
      case 4:
        this.damage += 5; // 데미지 증가
        break;
      case 5:
        this.baseCooldown *= 0.85; // 공속 추가 증가
        break;
      case 6:
        this.baseRange += 15; // 범위 추가 증가
        this.damage += 5; // 데미지 추가 증가
        break;
      case 7:
        this.baseCooldown *= 0.8; // 공속 추가 증가
        break;
      case 8:
        this.baseRange += 20; // 범위 추가 증가
        break;
      case 9:
        this.damage += 8; // 데미지 추가 증가
        break;
      case 10:
        this.baseCooldown *= 0.7; // 최종 공속 (280ms)
        this.damage += 10; // 최종 데미지 보너스
        this.baseRange += 25; // 최종 범위 (155)
        break;
    }
    
    this.updateRange();
    this.updateCooldown(player.getTotalCooldownReduction());
  }
}

// 검 무기 클래스
class SwordWeapon extends MeleeWeapon {
  constructor() {
    super({
      type: 'sword',
      baseCooldown: 800, // 중간 공격속도
      damage: 25,
      range: 75, // 중간 사거리
      attackAngle: Math.PI / 3, // 60도 부채꼴
      effectDuration: 400
    });
    this.baseRange = 75; // 기본 범위 저장
  }

  // 공격 범위 특성 적용
  updateRange() {
    this.range = this.baseRange * player.getTotalAttackRange();
  }

  // fire 메서드를 오버라이드해서 자동으로 가장 가까운 적 향해 공격
  fire() {
    // 범위 내에서 가장 가까운 적 찾기
    let nearestEnemy = null;
    let minDistance = this.range;
    
    for (let enemy of gameObjects.enemies) {
      if (enemy.state !== 'moving') continue;
      
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy) - enemy.size;
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestEnemy = enemy;
      }
    }
    
    // 적이 있으면 그 방향으로 공격
    if (nearestEnemy) {
      // 적 방향 계산
      const dx = nearestEnemy.x - player.x;
      const dy = nearestEnemy.y - player.y;
      const attackDirection = Math.atan2(dy, dx);
      
      // 부채꼴 범위 내 모든 적들 찾기
      const targets = this.findTargetsInRange(attackDirection);
      
      // 범위 내 모든 적들에게 데미지 적용 (공격력 특성 적용)
      targets.forEach(enemy => {
        enemy.takeDamage(this.damage * player.getTotalMeleeAttackPower());
      });
      
      // 시각적 효과 생성
      this.createEffect(attackDirection);
    }
  }

  findTargetsInRange(attackDirection) {
    const targets = [];
    
    for (let enemy of gameObjects.enemies) {
      if (enemy.state !== 'moving') continue;
      
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy) - enemy.size;
      
      if (distance <= this.range) { // 공격 범위 특성이 적용된 범위 사용
        // 적과 플레이어 사이의 각도
        const angleToEnemy = Math.atan2(dy, dx);
        
        // 각도 차이 계산
        let angleDiff = angleToEnemy - attackDirection;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        angleDiff = Math.abs(angleDiff);
        
        // 부채꼴 범위 내에 있는지 확인
        if (angleDiff <= this.attackAngle / 2) {
          targets.push(enemy);
        }
      }
    }
    
    return targets;
  }

  createEffect(attackDirection) {
    const effect = new SwordEffect(
      player.x,
      player.y,
      attackDirection,
      this.range, // 공격 범위 특성이 적용된 범위 사용
      this.attackAngle,
      this.effectDuration
    );
    gameObjects.bullets.push(effect);
  }

  applyLevelBonus() {
    super.applyLevelBonus();
    
    // 10레벨 시스템에 맞춘 균형잡힌 강화
    switch(this.level) {
      case 2:
        this.baseRange += 15; // 범위 증가
        break;
      case 3:
        this.attackAngle += Math.PI / 18; // 각도 증가 (70도)
        break;
      case 4:
        this.damage += 8; // 데미지 증가
        this.baseCooldown *= 0.9; // 쿨타임 감소
        break;
      case 5:
        this.baseRange += 20; // 범위 추가 증가
        break;
      case 6:
        this.attackAngle += Math.PI / 18; // 각도 추가 증가 (80도)
        this.damage += 10; // 데미지 추가 증가
        break;
      case 7:
        this.baseCooldown *= 0.85; // 쿨타임 추가 감소
        break;
      case 8:
        this.baseRange += 25; // 범위 추가 증가
        this.attackAngle += Math.PI / 18; // 각도 추가 증가 (90도)
        break;
      case 9:
        this.damage += 12; // 데미지 추가 증가
        break;
      case 10:
        this.attackAngle = Math.PI / 2; // 최종 각도 (90도)
        this.damage += 15; // 최종 데미지 보너스
        this.baseRange += 30; // 최종 범위 (240)
        this.baseCooldown *= 0.8; // 최종 쿨타임
        break;
    }
    
    this.updateRange();
    this.updateCooldown(player.getTotalCooldownReduction());
  }
}

// 창 무기 클래스
class SpearWeapon extends Weapon {
  constructor() {
    super({
      type: 'spear',
      baseCooldown: 1200, // 느린 공격속도
      damage: 35
    });
    this.projectileSpeed = 5; // 투사체 속도
    this.projectileRange = 150; // 최대 사거리
    this.projectileCount = 1; // 동시 발사 수
    this.projectileSpacing = 15; // 창 사이의 간격
  }
  
  fire() {
    // 마우스 방향으로 창 발사
    const dx = mouseWorldX - player.x;
    const dy = mouseWorldY - player.y;
    const angle = Math.atan2(dy, dx);
    
    // 발사 방향과 수직인 방향 계산 (90도 회전)
    const perpAngle = angle + Math.PI / 2;
    
    // 여러 개의 창을 수직 방향으로 배치
    for (let i = 0; i < this.projectileCount; i++) {
      // 중앙을 기준으로 위아래로 배치
      const offset = (i - (this.projectileCount - 1) / 2) * this.projectileSpacing;
      
      // 시작 위치 계산 (수직 방향으로 오프셋)
      const startX = player.x + Math.cos(perpAngle) * offset;
      const startY = player.y + Math.sin(perpAngle) * offset;
      
      const spear = new SpearProjectile(
        startX,
        startY,
        angle, // 모든 창은 같은 방향으로 발사
        this.projectileSpeed,
        this.projectileRange,
        this.damage * player.getTotalMeleeAttackPower()
      );
      gameObjects.bullets.push(spear);
    }
  }
  
  applyLevelBonus() {
    super.applyLevelBonus();
    
    // 10레벨 시스템에 맞춘 균형잡힌 강화
    switch(this.level) {
      case 2:
        this.projectileCount = 2; // 2개
        break;
      case 3:
        this.projectileRange += 40; // 사거리 증가
        break;
      case 4:
        this.projectileCount = 3; // 3개
        this.damage += 10; // 데미지 증가
        break;
      case 5:
        this.projectileSpeed += 1; // 속도 증가
        this.baseCooldown *= 0.9; // 쿨타임 감소
        break;
      case 6:
        this.projectileCount = 4; // 4개
        break;
      case 7:
        this.projectileRange += 50; // 사거리 추가 증가
        this.damage += 12; // 데미지 추가 증가
        break;
      case 8:
        this.projectileCount = 5; // 5개
        this.projectileSpeed += 1; // 속도 추가 증가
        break;
      case 9:
        this.baseCooldown *= 0.85; // 쿨타임 추가 감소
        this.projectileSpacing = 25; // 더 촘촘하게
        break;
      case 10:
        this.projectileCount = 6; // 6개 (최대)
        this.damage += 20; // 최종 데미지 보너스
        this.projectileRange += 70; // 최종 사거리 (460)
        this.projectileSpeed += 2; // 최종 속도 (13)
        break;
    }
    
    this.updateCooldown(player.getTotalCooldownReduction());
  }
}

//----------------------
// 근접 무기 이펙트 클래스들
//----------------------

// 기본 근접 무기 이펙트 클래스
class MeleeEffect {
  constructor(x, y, direction, duration) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.duration = duration;
    this.startTime = gameTimeSystem.getTime();
    this.used = false;
  }

  update() {
    const elapsed = gameTimeSystem.getTime() - this.startTime;
    if (elapsed >= this.duration) {
      this.used = true;
    }
  }

  getProgress() {
    const elapsed = gameTimeSystem.getTime() - this.startTime;
    return Math.min(elapsed / this.duration, 1);
  }

  outOfBounds() {
    return false; // 근접 공격은 화면 밖으로 나가지 않음
  }
}

// 주먹 공격 이펙트
class FistEffect extends MeleeEffect {
  constructor(x, y, direction, duration, targetEnemy) {
    super(x, y, direction, duration);
    this.baseMaxSize = 48; // 기본 최대 크기
    this.maxSize = this.baseMaxSize * player.getTotalAttackRange(); // 공격 범위에 따라 크기 조정
    this.rotationAngle = direction;
    this.targetEnemy = targetEnemy;
    this.speed = 12;
    this.hasReachedTarget = false;
    this.impactStartTime = 0;
    this.impactDuration = 200;
    
    // 목표 위치 저장
    if (targetEnemy) {
      this.targetX = targetEnemy.x;
      this.targetY = targetEnemy.y;
    } else {
      this.targetX = x + Math.cos(direction) * 100;
      this.targetY = y + Math.sin(direction) * 100;
    }
    
    this.startX = x;
    this.startY = y;
  }

  update() {
    if (!this.hasReachedTarget) {
      // 목표를 향해 이동
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 목표에 도달했거나 아주 가까워졌을 때
      if (distance <= this.speed || distance < 5) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.hasReachedTarget = true;
        this.impactStartTime = gameTimeSystem.getTime();
      } else {
        // 계속 이동
        const normalizedX = dx / distance;
        const normalizedY = dy / distance;
        this.x += normalizedX * this.speed;
        this.y += normalizedY * this.speed;
      }
    } else {
      // 임팩트 효과 시간 체크
      const impactElapsed = gameTimeSystem.getTime() - this.impactStartTime;
      if (impactElapsed >= this.impactDuration) {
        this.used = true;
      }
    }
    
    // 기본 지속시간도 체크
    const elapsed = gameTimeSystem.getTime() - this.startTime;
    if (elapsed >= this.duration) {
      this.used = true;
    }
  }

  draw(offsetX, offsetY) {
    const drawX = this.x + offsetX;
    const drawY = this.y + offsetY;
    
    if (!this.hasReachedTarget) {
      // 이동 중일 때 - 주먹이 날아가는 모습
      this.drawMovingFist(drawX, drawY);
    } else {
      // 목표에 도달했을 때 - 임팩트 효과
      this.drawImpactEffect(drawX, drawY);
    }
  }
  
  drawMovingFist(drawX, drawY) {
    if (assetManager.loaded.weapons && assetManager.images.weapons.fist) {
      ctx.save();
      
      ctx.globalAlpha = 0.9;
      
      // 범위에 따라 조정된 크기
      const imageSize = this.maxSize * 0.8;
      
      ctx.translate(drawX, drawY);
      ctx.rotate(this.rotationAngle);
      
      ctx.drawImage(
        assetManager.images.weapons.fist,
        -imageSize / 2,
        -imageSize / 2,
        imageSize,
        imageSize
      );
      
      ctx.restore();
    }
  }
  
  drawImpactEffect(drawX, drawY) {
    const impactElapsed = gameTimeSystem.getTime() - this.impactStartTime;
    const impactProgress = Math.min(impactElapsed / this.impactDuration, 1);
    
    if (assetManager.loaded.weapons && assetManager.images.weapons.fist) {
      ctx.save();
      
      const alpha = Math.max(0, 1 - impactProgress);
      ctx.globalAlpha = alpha;

      // 범위에 따라 조정된 크기
      const imageSize = this.maxSize;
      
      ctx.translate(drawX, drawY);
      ctx.rotate(this.rotationAngle);
      
      ctx.drawImage(
        assetManager.images.weapons.fist,
        -imageSize / 2,
        -imageSize / 2,
        imageSize,
        imageSize
      );      
      ctx.restore();
    }
  }
}

// 검 공격 이펙트
class SwordEffect extends MeleeEffect {
  constructor(x, y, direction, range, angle, duration) {
    super(x, y, direction, duration);
    this.range = range; // 공격 범위 특성이 적용된 범위
    this.angle = angle;
    
    // 휘두르기 애니메이션 속성
    this.swingStartAngle = direction - angle / 2; // 시작 각도
    this.swingEndAngle = direction + angle / 2;   // 끝 각도
    this.currentSwingAngle = this.swingStartAngle; // 현재 휘두르는 각도
    this.swingProgress = 0; // 휘두르기 진행도 (0~1)
    
    // 투명도 애니메이션
    this.maxAlpha = 0.9;
    this.currentAlpha = 0.3;
    
    this.animationComplete = false;
  }

  update() {
    super.update(); // 기본 업데이트 (used 상태 체크)
    
    if (!this.animationComplete) {
      // 휘두르기 진행도 업데이트 (더 빠르게)
      this.swingProgress += 0.08; // 기존보다 빠른 속도
      
      if (this.swingProgress >= 1.0) {
        this.swingProgress = 1.0;
        this.animationComplete = true;
        this.used = true;
      }
      
      // 이징 함수 적용 (빠르게 시작해서 천천히 끝남)
      const easedProgress = 1 - Math.pow(1 - this.swingProgress, 3);
      
      // 각도 보간 (휘두르는 동작)
      this.currentSwingAngle = this.swingStartAngle + 
        (this.swingEndAngle - this.swingStartAngle) * easedProgress;
      
      // 투명도 애니메이션
      if (this.swingProgress < 0.2) {
        // 처음 20%: 빠르게 나타남
        this.currentAlpha = 0.3 + (this.maxAlpha - 0.3) * (this.swingProgress / 0.2);
      } else if (this.swingProgress < 0.8) {
        // 중간 60%: 최대 투명도 유지
        this.currentAlpha = this.maxAlpha;
      } else {
        // 마지막 20%: 빠르게 사라짐
        const fadeProgress = (this.swingProgress - 0.8) / 0.2;
        this.currentAlpha = this.maxAlpha * (1 - fadeProgress);
      }
    }
  }

  draw(offsetX, offsetY) {
    if (!assetManager.loaded.weapons || !assetManager.images.weapons.sword) {
      return;
    }
    
    ctx.save();
    
    // 투명도 설정
    ctx.globalAlpha = this.currentAlpha;
    
    // 플레이어 위치로 이동
    ctx.translate(this.x + offsetX, this.y + offsetY);
    
    // 현재 휘두르는 각도로 회전
    ctx.rotate(this.currentSwingAngle);
    
    // 이펙트 크기
    const drawSize = this.range / 1.3;
    
    // 검 이미지 그리기 (64*64 단일 이미지)
    // 검끝이 앞쪽으로 오도록 위치 조정
    ctx.drawImage(
      assetManager.images.weapons.sword,
      0, 0, // 단일 이미지이므로 0,0에서 시작
      64, 64, // 소스 크기 (64*64)
      drawSize * 0.2, -drawSize / 2, // 그리기 위치 (검끝이 앞쪽으로)
      drawSize, drawSize // 그리기 크기
    );
    
    // 잔상 효과 (선택사항)
    if (this.swingProgress > 0.1 && this.swingProgress < 0.9) {
      ctx.globalAlpha = this.currentAlpha * 0.3;
      
      // 이전 위치의 잔상
      const trailAngle = this.currentSwingAngle - 0.3;
      ctx.rotate(trailAngle - this.currentSwingAngle);
      
      ctx.drawImage(
        assetManager.images.weapons.sword,
        0, 0,
        64, 64,
        drawSize * 0.2, -drawSize / 2,
        drawSize * 0.8, drawSize * 0.8
      );
    }
    
    ctx.restore();
  }
}

class SpearProjectile {
  constructor(x, y, angle, speed, maxRange, damage) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = speed;
    this.maxRange = maxRange;
    this.damage = damage;
    this.distanceTraveled = 0;
    this.used = false;
    
    // 관통한 적 추적 (중복 데미지 방지)
    this.hitEnemies = new Set();
    
    // 페이드아웃 관련
    this.fadeStartDistance = maxRange * 0.8; // 80% 거리에서 페이드 시작
    this.alpha = 1.0;
    
    // 스프라이트 정보
    this.spriteWidth = 256;
    this.spriteHeight = 64;
    
    // 크기 (hitbox용)
    this.size = 15; // 충돌 판정용 크기
  }
  
  update() {
    // 이동
    const moveX = Math.cos(this.angle) * this.speed;
    const moveY = Math.sin(this.angle) * this.speed;
    
    this.x += moveX;
    this.y += moveY;
    this.distanceTraveled += this.speed;
    
    // 페이드아웃 처리
    if (this.distanceTraveled >= this.fadeStartDistance) {
      const fadeProgress = (this.distanceTraveled - this.fadeStartDistance) / (this.maxRange - this.fadeStartDistance);
      this.alpha = Math.max(0, 1 - fadeProgress);
    }
    
    // 최대 거리 도달 시 제거
    if (this.distanceTraveled >= this.maxRange) {
      this.used = true;
      return;
    }
    
    // 적과의 충돌 체크 (관통)
    for (let enemy of gameObjects.enemies) {
      if (enemy.state === 'moving' && !this.hitEnemies.has(enemy)) {
        // 창의 길이를 고려한 충돌 체크
        if (this.checkCollisionWithEnemy(enemy)) {
          enemy.takeDamage(this.damage);
          this.hitEnemies.add(enemy); // 이미 맞은 적으로 기록
        }
      }
    }
  }
  
  checkCollisionWithEnemy(enemy) {
    // 창의 중심점과 적 사이의 거리
    const dx = enemy.x - this.x;
    const dy = enemy.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy) - enemy.size;
    
    // 기본 원형 충돌 체크
    if (distance < this.size + enemy.size) {
      return true;
    }
    
    // 창의 길이를 고려한 선분 충돌 체크
    // 창의 끝점 계산
    const spearLength = 60; // 창의 실제 길이
    const endX = this.x + Math.cos(this.angle) * spearLength;
    const endY = this.y + Math.sin(this.angle) * spearLength;
    
    // 점과 선분 사이의 최단 거리 계산
    const lineDistance = this.pointToLineDistance(enemy.x, enemy.y, this.x, this.y, endX, endY);
    
    return lineDistance < enemy.size;
  }
  
  pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
      param = dot / lenSq;
    }
    
    let xx, yy;
    
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  draw(offsetX, offsetY) {
    if (assetManager.loaded.weapons && assetManager.images.weapons.spear) {
      ctx.save();
      
      // 투명도 적용
      ctx.globalAlpha = this.alpha;
      
      // 창 위치로 이동 및 회전
      ctx.translate(this.x + offsetX, this.y + offsetY);
      ctx.rotate(this.angle);
      
      // 창 이미지 그리기 (중심 정렬)
      const drawWidth = this.spriteWidth * 0.5; // 크기 조정
      const drawHeight = this.spriteHeight * 0.5;
      
      ctx.drawImage(
        assetManager.images.weapons.spear,
        -drawWidth * 0.3, // 창끝이 앞쪽에 오도록 조정
        -drawHeight / 2,
        drawWidth,
        drawHeight
      );
      
      ctx.restore();
    }
  }
  outOfBounds() {
    return this.used;
  }
}

//----------------------
// 무기 합성 시스템
//----------------------

const weaponFusionSystem = {
  recipes: [
    {
      ingredients: ['lightning', 'earth'],
      result: 'magnetic',
      name: '자기장',
      description: '플레이어 주변에 지속 피해',
      flavorText: 'dd.d.d'
    },
    {
      ingredients: ['flame', 'lightning'],
      result: 'plasma',
      name: '플라즈마 레이저',
      description: '적을 관통하는 지속 피해',
      flavorText: 'dd.d.d'
    },
    {
      ingredients: ['flame', 'wind'],
      result: 'inferno',
      name: '인페르노',
      description: '화염 투사체를 빠른 속도로 연속 발사',
      flavorText: 'dd.d.d'
    },
    {
      ingredients: ['flame', 'earth'],
      result: 'supernova',
      name: '슈퍼노바',
      description: '주변에 주기적으로 데미지를 주는 별 설치',
      flavorText: 'dd.d.d'
    },
    {
      ingredients: ['wind', 'lightning'],
      result: 'lightningBolt',
      name: '질풍신뢰',
      description: '적 사이에서 튀기는 번개 투사체 발사',
      flavorText: 'dd.d.d'
    },
    {
      ingredients: ['wind', 'earth'],
      result: 'poltergeist',
      name: '폴터가이스트',
      description: '주변을 돌며 데미지를 주는 물체 소환',
      flavorText: 'dd.d.d'
    }
  ],
  
  // 합성 가능 여부 확인
  canFuse(weapon1Type, weapon2Type) {
    return this.recipes.some(recipe => 
      (recipe.ingredients.includes(weapon1Type) && recipe.ingredients.includes(weapon2Type)) &&
      weapon1Type !== weapon2Type
    );
  },
  
  // 합성 결과 가져오기
  getFusionResult(weapon1Type, weapon2Type) {
    const recipe = this.recipes.find(r => 
      (r.ingredients.includes(weapon1Type) && r.ingredients.includes(weapon2Type)) &&
      weapon1Type !== weapon2Type
    );
    return recipe ? recipe : null;
  },
  
  // 합성 실행
  performFusion(weapon1, weapon2) {
    const result = this.getFusionResult(weapon1.type, weapon2.type);
    if (!result) return null;
    
    // 합성에 사용된 무기 타입들을 기록
    if (!player.fusedWeapons.includes(weapon1.type)) {
      player.fusedWeapons.push(weapon1.type);
    }
    if (!player.fusedWeapons.includes(weapon2.type)) {
      player.fusedWeapons.push(weapon2.type);
    }

    // 대지 무기의 구체 제거 처리
    if (weapon1.type === 'earth' && weapon1.removeOldOrbs) {
      weapon1.removeOldOrbs();
    }
    if (weapon2.type === 'earth' && weapon2.removeOldOrbs) {
      weapon2.removeOldOrbs();
    }
    
    // 기존 무기 제거
    const index1 = player.weapons.indexOf(weapon1);
    const index2 = player.weapons.indexOf(weapon2);
    
    if (index1 > index2) {
      player.weapons.splice(index1, 1);
      player.weapons.splice(index2, 1);
    } else {
      player.weapons.splice(index2, 1);
      player.weapons.splice(index1, 1);
    }
    
    // 새 무기 추가
    const newWeapon = WeaponFactory.createWeapon(result.result);
    player.weapons.push(newWeapon);
    
    return newWeapon;
  }
};

// 자기장 무기 클래스
class MagneticWeapon extends Weapon {
  constructor() {
    super({
      type: 'magnetic',
      baseCooldown: 100,
      damage: 5
    });
    this.baseFieldRadius = 100;
    this.fieldRadius = this.baseFieldRadius;
    this.tickDamage = 2;
    this.damageInterval = 100;
    this.magneticField = null; // 자기장 효과 객체
  }

  // 공격 범위 특성 적용
  updateRange() {
    this.fieldRadius = this.baseFieldRadius * player.getTotalAttackRange();
    
    // 현재 활성화된 자기장이 있으면 업데이트
    if (this.magneticField && !this.magneticField.used) {
      this.magneticField.updateStats(
        this.fieldRadius,
        this.tickDamage * player.getTotalAttackPower(),
        this.damageInterval
      );
    }
  }
  
  update() {
    // 자기장이 없거나 사용됐으면 새로 생성
    if (!this.magneticField || this.magneticField.used) {
      this.createMagneticField();
    }
  }
  
  createMagneticField() {
    // 기존 자기장 제거
    if (this.magneticField) {
      this.magneticField.used = true;
    }
    
    // 새 자기장 생성
    this.magneticField = new MagneticField(
      player.x, 
      player.y,
      this.fieldRadius,
      this.tickDamage * player.getTotalAttackPower(),
      this.damageInterval
    );
    
    gameObjects.bullets.push(this.magneticField);
  }
  
  fire() {
    // 사용하지 않음
  }
  
  applyLevelBonus() {
    super.applyLevelBonus();
    
    switch(this.level) {
      case 2:
        this.tickDamage += 1;
        break;
      case 3:
        this.baseFieldRadius += 20;
        break;
      case 4:
        this.damageInterval *= 0.9;
        break;
      case 5:
        this.tickDamage += 2;
        break;
      case 6:
        this.baseFieldRadius += 30;
        break;
      case 7:
        this.tickDamage += 2;
        break;
      case 8:
        this.damageInterval *= 0.8;
        break;
      case 9:
        this.baseFieldRadius += 40;
        break;
      case 10:
        this.tickDamage += 3;
        this.damageInterval *= 0.7;
        break;
    }
    
    // 레벨업 시 기존 자기장 업데이트
    this.updateRange();
  }
}

// 자기장 효과 클래스
class MagneticField {
  constructor(x, y, radius, damage, damageInterval) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.damage = damage;
    this.damageInterval = damageInterval;
    this.lastDamageTime = 0;
    this.used = false;

    // 애니메이션 관련 속성
    this.rotationAngle = 0;
    this.rotationSpeed = 0.02;
    this.currentFrame = 0;
    this.frameCount = 4;
    this.frameTime = 0;
    this.frameDuration = 100;
  }
  
  update() {
    // 플레이어 위치 추적
    this.x = player.x;
    this.y = player.y;

    // 회전 애니메이션
    this.rotationAngle += this.rotationSpeed;
    
    // 프레임 애니메이션
    this.frameTime += 16;
    if (this.frameTime >= this.frameDuration) {
      this.frameTime = 0;
      this.currentFrame = (this.currentFrame + 1) % this.frameCount;
    }
    
    // 데미지 처리
    const currentTime = gameTimeSystem.getTime();
    if (currentTime - this.lastDamageTime >= this.damageInterval) {
      this.dealAreaDamage();
      this.lastDamageTime = currentTime;
    }
  }
  
  dealAreaDamage() {
    const range = this.radius;
    
    for (let enemy of gameObjects.enemies) {
      if (enemy.state !== 'moving') continue;
      
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy) - enemy.size;
      
      if (distance <= range) {
        enemy.takeDamage(this.damage);
      }
    }
  }
  
  draw(offsetX, offsetY) {
    const centerX = this.x + offsetX;
    const centerY = this.y + offsetY;
    const range = this.radius;
    
    // 이미지로 자기장 효과 그리기
    if (assetManager.loaded.weapons && assetManager.images.weapons.magnetic) {
      ctx.save();
      
      // 중앙으로 이동하고 회전
      ctx.translate(centerX, centerY);
      ctx.rotate(this.rotationAngle);
      
      // 스프라이트 프레임 계산
      const frameWidth = 64;
      const frameHeight = 64;
      const frameX = this.currentFrame * frameWidth;
      
      // 공격 범위에 맞춰 크기 조정
      const drawSize = range * 2;
      
      // 약간의 투명도 적용
      ctx.globalAlpha = 0.8;
      
      // 이미지 그리기
      ctx.drawImage(
        assetManager.images.weapons.magnetic,
        frameX, 0, // 소스 x, y
        frameWidth, frameHeight, // 소스 크기
        -drawSize / 2, -drawSize / 2, // 대상 위치 (중앙 정렬)
        drawSize, drawSize // 대상 크기
      );
      
      ctx.restore();
    }
  }
  
  outOfBounds() {
    return this.used;
  }
  
  // 무기 레벨업 시 스탯 업데이트
  updateStats(radius, damage, damageInterval) {
    this.radius = radius;
    this.damage = damage;
    this.damageInterval = damageInterval;
  }
}

// 플라즈마 레이저 무기 클래스
class PlasmaWeapon extends Weapon {
  constructor() {
    super({
      type: 'plasma',
      baseCooldown: 100,
      damage: 20
    });
    
    this.baseBeamWidth = 3;      // 기본 빔 너비
    this.beamWidth = this.baseBeamWidth;
    this.baseBeamLength = 300;   // 기본 빔 길이
    this.beamLength = this.baseBeamLength;
    this.rotationSpeed = 0.02;
    this.currentAngle = 0;
    this.currentBeams = [];
    this.targetTracking = true;
    this.beamCount = 1;
  }

  // 공격 범위 특성 적용
  updateRange() {
    this.beamLength = this.baseBeamLength * player.getTotalAttackRange();
    this.beamWidth = this.baseBeamWidth * player.getTotalAttackRange();
    
    // 현재 빔들 업데이트
    this.currentBeams.forEach(beam => {
      if (beam && !beam.expired) {
        beam.updateStats(this.beamLength, this.beamWidth, this.damage * player.getTotalRangedAttackPower());
      }
    });
  }
  
  update() {
    // 모든 빔이 만료되었는지 확인
    const hasActiveBeam = this.currentBeams.some(beam => beam && !beam.expired);
    
    // 빔이 없거나 모두 만료되었으면 새로 생성
    if (!hasActiveBeam || this.currentBeams.length !== this.beamCount) {
      this.createContinuousBeams();
    }
    
    // 빔 각도 회전 (타겟이 없을 때만)
    if (!this.targetTracking || !findNearestEnemy()) {
      this.currentAngle += this.rotationSpeed;
    }
  }
  
  createContinuousBeams() {
    // 기존 빔들이 있으면 제거
    this.currentBeams.forEach(beam => {
      if (beam) beam.expired = true;
    });
    this.currentBeams = [];
    
    // 가장 가까운 적 찾기
    const nearestEnemy = findNearestEnemy();
    let baseAngle = this.currentAngle;
    
    if (nearestEnemy && this.targetTracking) {
      // 적 방향으로 레이저 조준
      baseAngle = Math.atan2(nearestEnemy.y - player.y, nearestEnemy.x - player.x);
    }
    
    // 빔 개수만큼 생성
    const angleStep = (Math.PI * 2) / this.beamCount; // 360도를 빔 개수로 나눔
    
    for (let i = 0; i < this.beamCount; i++) {
      const angle = baseAngle + (angleStep * i);
      
      // 지속형 빔 생성
      const beam = new ContinuousPlasmaBeam(
        player.x,
        player.y,
        angle,
        this.beamLength,
        this.beamWidth,
        this.damage * player.getTotalRangedAttackPower(),
        this,
        i // 빔 인덱스 추가
      );
      
      this.currentBeams.push(beam);
      gameObjects.bullets.push(beam);
    }
  }
  
  fire() {
    // 사용하지 않음 (지속형 빔이므로)
  }
  
  applyLevelBonus() {
    super.applyLevelBonus();
    
    const prevBeamCount = this.beamCount; // 이전 빔 개수 저장
    
    switch(this.level) {
      case 2:
        this.beamCount = 2;  // 2개 빔
        this.beamWidth += 1;
        break;
      case 3:
        this.beamLength += 50;
        break;
      case 4:
        this.beamCount = 3;  // 3개 빔
        this.damage += 3;
        break;
      case 5:
        this.rotationSpeed = 0.025;
        break;
      case 6:
        this.beamCount = 4;  // 4개 빔
        this.beamWidth += 2;
        this.damage += 4;
        break;
      case 7:
        this.beamLength += 75;
        break;
      case 8:
        this.beamCount = 5;  // 5개 빔
        this.beamWidth += 2;
        this.damage += 5;
        break;
      case 9:
        this.rotationSpeed = 0.03;
        break;
      case 10:
        this.beamCount = 6;  // 6개 빔 (최대)
        this.beamWidth += 3;
        this.beamLength += 100;
        this.damage += 8;
        break;
    }
    
    // 빔 개수가 변경되었으면 빔을 다시 생성
    if (prevBeamCount !== this.beamCount) {
      // 기존 빔들 제거
      this.currentBeams.forEach(beam => {
        if (beam) beam.expired = true;
      });
      this.currentBeams = [];
    }
    
    // 레벨업 시 범위 업데이트
    this.updateRange();
  }
}

// 플라즈마 빔 효과 클래스
class ContinuousPlasmaBeam {
  constructor(x, y, angle, length, width, damage, parentWeapon, beamIndex = 0) {
    this.startX = x;
    this.startY = y;
    this.angle = angle;
    this.previousAngle = angle;
    this.length = length;
    this.width = width;
    this.damage = damage;
    this.parentWeapon = parentWeapon;
    this.beamIndex = beamIndex;
    this.expired = false;
    this.used = false;
    
    // 스프라이트 애니메이션 속성
    this.currentFrame = 0;
    this.frameCount = 4; // 4개의 프레임
    this.frameTime = 0;
    this.frameDuration = 100; // 각 프레임 지속 시간 (ms)
    this.frameWidth = 256; // 각 프레임 너비
    this.frameHeight = 64; // 각 프레임 높이
    
    // 데미지 틱 속성
    this.damageTick = 50;
    this.lastDamageTime = 0;
    
    // 프레임당 한 번만 데미지를 받도록 추적
    this.hitEnemiesThisFrame = new Set();
  }
  
  update() {
    // 빔이 부모 무기에서 분리되었는지 확인
    if (!this.parentWeapon || !this.parentWeapon.currentBeams.includes(this)) {
      this.expired = true;
      this.used = true;
      return;
    }
    
    // 애니메이션 프레임 업데이트
    this.frameTime += 16;
    if (this.frameTime >= this.frameDuration) {
      this.frameTime = 0;
      this.currentFrame = (this.currentFrame + 1) % this.frameCount;
    }
    
    // 플레이어 위치에서 빔 시작
    this.startX = player.x;
    this.startY = player.y;
    
    // 이전 각도 저장 (스윕 데미지용)
    this.previousAngle = this.angle;
    
    // 타겟 추적 (첫 번째 빔만 추적, 나머지는 각도 유지)
    if (this.parentWeapon.targetTracking && this.beamIndex === 0) {
      const nearestEnemy = findNearestEnemy();
      if (nearestEnemy) {
        // 부드러운 각도 전환
        const targetAngle = Math.atan2(nearestEnemy.y - player.y, nearestEnemy.x - player.x);
        const angleDiff = targetAngle - this.angle;
        
        // 각도 정규화
        let normalizedDiff = angleDiff;
        while (normalizedDiff > Math.PI) normalizedDiff -= Math.PI * 2;
        while (normalizedDiff < -Math.PI) normalizedDiff += Math.PI * 2;
        
        // 부드러운 회전 (최대 회전 속도 제한)
        const maxRotation = 0.05;
        this.angle += Math.max(-maxRotation, Math.min(maxRotation, normalizedDiff * 0.1));
        
        // 다른 빔들의 각도도 업데이트
        const angleStep = (Math.PI * 2) / this.parentWeapon.beamCount;
        this.parentWeapon.currentBeams.forEach((beam, index) => {
          if (beam && index !== 0 && !beam.expired) {
            beam.angle = this.angle + (angleStep * index);
          }
        });
      }
    } else if (!this.parentWeapon.targetTracking) {
      // 타겟 추적이 꺼져있으면 회전
      const angleStep = (Math.PI * 2) / this.parentWeapon.beamCount;
      this.angle = this.parentWeapon.currentAngle + (angleStep * this.beamIndex);
    }
    
    // 데미지 처리
    const currentTime = gameTimeSystem.getTime();
    if (currentTime - this.lastDamageTime >= this.damageTick) {
      this.hitEnemiesThisFrame.clear();
      this.dealSweepDamage();
      this.lastDamageTime = currentTime;
    }
  }
  
  dealSweepDamage() {
    // 회전한 각도 계산
    let angleDiff = this.angle - this.previousAngle;
    
    // 각도 정규화 (-π ~ π)
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    
    // 스윕할 단계 수 계산 (각도 차이에 비례)
    const sweepSteps = Math.max(1, Math.ceil(Math.abs(angleDiff) * 10));
    
    // 각 단계별로 충돌 검사
    for (let step = 0; step <= sweepSteps; step++) {
      const t = step / sweepSteps;
      const checkAngle = this.previousAngle + angleDiff * t;
      
      // 해당 각도에서의 빔 끝점 계산
      const endX = this.startX + Math.cos(checkAngle) * this.length;
      const endY = this.startY + Math.sin(checkAngle) * this.length;
      
      // 모든 적과 충돌 검사
      for (let enemy of gameObjects.enemies) {
        if (enemy.state !== 'moving') continue;
        
        // 이미 이번 프레임에 맞은 적은 제외
        if (this.hitEnemiesThisFrame.has(enemy)) continue;
        
        // 선분과 원의 충돌 검사
        if (this.checkBeamCollision(enemy, endX, endY)) {
          enemy.takeDamage(this.damage / 20);  // 틱당 데미지
          this.hitEnemiesThisFrame.add(enemy); // 중복 방지
        }
      }
    }
  }
  
  checkBeamCollision(enemy, endX, endY) {
    // 점과 선분 사이의 최단 거리 계산
    const A = enemy.x - this.startX;
    const B = enemy.y - this.startY;
    const C = endX - this.startX;
    const D = endY - this.startY;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
      param = dot / lenSq;
    }
    
    let xx, yy;
    
    if (param < 0) {
      xx = this.startX;
      yy = this.startY;
    } else if (param > 1) {
      xx = endX;
      yy = endY;
    } else {
      xx = this.startX + param * C;
      yy = this.startY + param * D;
    }
    
    const dx = enemy.x - xx;
    const dy = enemy.y - yy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 빔 너비와 적 크기를 고려한 충돌 판정
    return distance <= this.width + enemy.size;
  }
  
  draw(offsetX, offsetY) {
    const drawStartX = this.startX + offsetX;
    const drawStartY = this.startY + offsetY;
    
    ctx.save();
    
    // 플라즈마 이미지가 로드되었는지 확인
    if (!assetManager.loaded.weapons || !assetManager.images.weapons.plasma) {
      ctx.restore();
      return;
    }
    
    // 빔의 끝점 계산
    const drawEndX = drawStartX + Math.cos(this.angle) * this.length;
    const drawEndY = drawStartY + Math.sin(this.angle) * this.length;
    
    // 빔의 중심점과 거리 계산
    const centerX = (drawStartX + drawEndX) / 2;
    const centerY = (drawStartY + drawEndY) / 2;
    const distance = Math.hypot(drawEndX - drawStartX, drawEndY - drawStartY);
    
    // 캔버스를 중심점으로 이동하고 회전
    ctx.translate(centerX, centerY);
    ctx.rotate(this.angle);
    
    // 스프라이트 시트에서 현재 프레임 위치 계산, 256x256 이미지에서 4개의 프레임이 세로로 배열됨
    const frameY = this.currentFrame * this.frameHeight;
    
    // 그리기 크기
    const drawWidth = distance;
    const drawHeight = this.width * 8;
    
    // 플라즈마 스프라이트 프레임 그리기
    ctx.globalAlpha = 1.0;
    ctx.drawImage(
      assetManager.images.weapons.plasma,
      0, frameY, // 소스 x, y (현재 프레임)
      this.frameWidth, this.frameHeight, // 소스 크기
      -drawWidth / 2, -drawHeight / 2, // 대상 위치 (중앙 정렬)
      drawWidth, drawHeight // 대상 크기
    );
    
    ctx.restore();
  }
  
  outOfBounds() {
    return this.used;
  }
  
  // 무기 레벨업 시 스탯 업데이트
  updateStats(length, width, damage) {
    this.length = length;
    this.width = width;
    this.damage = damage;
  }
}

// 인페르노 무기 클래스
class InfernoWeapon extends Weapon {
  constructor() {
    super({
      type: 'inferno',
      baseCooldown: 5000, // 3초 쿨타임
      damage: 12
    });
    
    // 연속 발사 관련
    this.burstCount = 16; // 연속 발사 횟수
    this.burstInterval = 50; // 발사 간격 (ms)
    this.burstFiring = false; // 연속 발사 중인지
    this.currentBurst = 0; // 현재 발사 횟수
    this.lastBurstTime = 0;
    
    // 투사체 속성
    this.projectileSpeed = 6; // 빠른 속도
    this.projectileRange = 500; // 사거리
    
    // 다방향 발사
    this.directions = 1; // 발사 방향 수
    this.spreadAngle = 72 * Math.PI / 180; // 72도를 라디안으로
  }
  
  update() {
    const now = gameTimeSystem.getTime();
    
    // 연속 발사 중이 아니고 쿨다운이 끝났으면 발사 시작
    if (!this.burstFiring && now - this.lastAttackTime >= this.cooldown) {
      this.startBurst();
      this.lastAttackTime = now;
    }
    
    // 연속 발사 처리
    if (this.burstFiring) {
      if (now - this.lastBurstTime >= this.burstInterval) {
        this.fireBurst();
        this.lastBurstTime = now;
        this.currentBurst++;
        
        // 연속 발사 완료
        if (this.currentBurst >= this.burstCount) {
          this.burstFiring = false;
          this.currentBurst = 0;
        }
      }
    }
  }
  
  startBurst() {
    this.burstFiring = true;
    this.currentBurst = 0;
    this.lastBurstTime = gameTimeSystem.getTime();
  }
  
  fireBurst() {
    // 마우스 방향 계산
    const baseAngle = Math.atan2(mouseWorldY - player.y, mouseWorldX - player.x);
    
    // 다방향 발사
    if (this.directions === 1) {
      // 단일 방향
      this.createProjectile(baseAngle);
    } else {
      // 다방향 (중앙 + 좌우 대칭)
      const halfDirections = Math.floor(this.directions / 2);
      
      for (let i = -halfDirections; i <= halfDirections; i++) {
        const angle = baseAngle + (i * this.spreadAngle);
        this.createProjectile(angle);
      }
    }
  }
  
  createProjectile(angle) {
    const projectile = new InfernoProjectile(
      player.x,
      player.y,
      angle,
      this.projectileSpeed,
      this.projectileRange,
      this.damage * player.getTotalRangedAttackPower(),
      player.getTotalAttackRange() // 공격 범위 전달
    );
    gameObjects.bullets.push(projectile);
  }
  
  fire() {
    // 사용하지 않음 (update에서 자동 발사)
  }
  
  applyLevelBonus() {
    super.applyLevelBonus();
    
    switch(this.level) {
      case 2:
        this.burstCount = 20; // 연속 발사 횟수 증가
        break;
      case 3:
        this.damage += 3;
        this.projectileSpeed = 7; // 속도 증가
        break;
      case 4:
        this.burstInterval = 45; // 연사 속도 증가
        break;
      case 5:
        this.directions = 3; // 3방향 발사
        this.damage += 3;
        break;
      case 6:
        this.burstCount = 24;
        this.baseCooldown *= 0.85; // 쿨타임 감소
        break;
      case 7:
        this.projectileRange += 100; // 사거리 증가
        this.damage += 4;
        break;
      case 8:
        this.burstInterval = 40; // 더 빠른 연사
        this.projectileSpeed = 8;
        break;
      case 9:
        this.burstCount = 28;
        this.damage += 5;
        break;
      case 10:
        this.directions = 5; // 5방향 발사
        this.burstCount = 32;
        this.burstInterval = 35; // 최대 연사 속도
        this.damage += 6;
        this.baseCooldown *= 0.7; // 최종 쿨타임
        break;
    }
    
    this.updateCooldown(player.getTotalCooldownReduction());
  }
}

// 인페르노 투사체 클래스
class InfernoProjectile {
  constructor(x, y, angle, speed, maxRange, damage, attackRangeMultiplier = 1) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = speed;
    this.maxRange = maxRange;
    this.damage = damage;
    this.distanceTraveled = 0;
    this.used = false;
    
    // 크기 관련 (거리에 따라 커지며, 공격 범위 특성 적용)
    this.baseSize = 8;
    this.size = this.baseSize * attackRangeMultiplier;
    this.maxSize = 20 * attackRangeMultiplier; // 최대 크기도 공격 범위에 비례
    this.attackRangeMultiplier = attackRangeMultiplier;
    
    // 관통한 적 추적 (중복 데미지 방지)
    this.hitEnemies = new Set();
    
    // 애니메이션
    this.animationTime = 0;
    this.currentFrame = 0;
    this.frameCount = 4;
    this.frameDuration = 50;
    this.frameTime = 0;
  }
  
  update() {
    // 이동
    const moveX = Math.cos(this.angle) * this.speed;
    const moveY = Math.sin(this.angle) * this.speed;
    
    this.x += moveX;
    this.y += moveY;
    this.distanceTraveled += this.speed;
    
    // 거리에 따라 크기 증가
    const sizeProgress = Math.min(this.distanceTraveled / this.maxRange, 1);
    this.size = (this.baseSize + (this.maxSize - this.baseSize) * sizeProgress) * this.attackRangeMultiplier;
    
    // 애니메이션 업데이트
    this.frameTime += 16;
    if (this.frameTime >= this.frameDuration) {
      this.frameTime = 0;
      this.currentFrame = (this.currentFrame + 1) % this.frameCount;
    }
    
    // 최대 거리 도달 시 제거
    if (this.distanceTraveled >= this.maxRange) {
      this.used = true;
      return;
    }
    
    // 적과의 충돌 체크 (관통형)
    for (let enemy of gameObjects.enemies) {
      if (enemy.state === 'moving' && !this.hitEnemies.has(enemy)) {
        // 커진 충돌 범위
        const distance = Math.sqrt(
          Math.pow(enemy.x - this.x, 2) + 
          Math.pow(enemy.y - this.y, 2)
        );
        
        if (distance < this.size + enemy.size) {
          enemy.takeDamage(this.damage);
          this.hitEnemies.add(enemy); // 이미 맞은 적으로 기록
        }
      }
    }
  }
  
  draw(offsetX, offsetY) {
    const drawX = this.x + offsetX;
    const drawY = this.y + offsetY;
    
    // 메인 투사체
    if (assetManager.loaded.weapons && assetManager.images.weapons.flame) {
      ctx.save();
      
      // 회전하는 화염 효과
      ctx.translate(drawX, drawY);
      ctx.rotate(this.angle + this.currentFrame * Math.PI / 2);
      
      const frameX = this.currentFrame * 64;
      const drawSize = this.size * 4; // 크기 증가
      
      // 화염 이미지 그리기
      ctx.globalAlpha = 0.9;
      ctx.drawImage(
        assetManager.images.weapons.flame,
        frameX, 0,
        64, 64,
        -drawSize / 2,
        -drawSize / 2,
        drawSize,
        drawSize
      );
      
      ctx.restore();
    }
  }
  
  outOfBounds() {
    return this.used;
  }
}

// 슈퍼노바 무기 클래스
class SupernovaWeapon extends Weapon {
  constructor() {
    super({
      type: 'supernova',
      baseCooldown: 3000, // 3초 쿨타임
      damage: 25
    });
    
    this.activeStars = [];
    this.maxStars = 3;
    this.starDuration = 5000;
    this.baseStarRange = 100; // 기본 별 범위
    this.starRange = this.baseStarRange;
    this.tickInterval = 800;
  }

  // 공격 범위 특성 적용
  updateRange() {
    this.starRange = this.baseStarRange * player.getTotalAttackRange();
  }
  
  fire() {
    // 최대 별 개수 제한
    if (this.activeStars.length >= this.maxStars) {
      // 가장 오래된 별 제거
      const oldestStar = this.activeStars.shift();
      oldestStar.used = true;
    }
    
    // 플레이어 주변 랜덤 위치에 별 생성
    const angle = Math.random() * Math.PI * 2;
    const distance = 50 // 50~150 거리
    
    const starX = player.x + Math.cos(angle) * (distance + Math.random() * 100);
    const starY = player.y + Math.sin(angle) * (distance + Math.random() * 100);
    
    const star = new SupernovaStar(
      starX, 
      starY,
      this.starRange,
      this.damage * player.getTotalRangedAttackPower(),
      this.starDuration,
      this.tickInterval
    );
    
    this.activeStars.push(star);
    gameObjects.bullets.push(star);
  }
  
  update() {
    // 기본 무기 업데이트
    super.update();
    
    // 사용 완료된 별 제거
    this.activeStars = this.activeStars.filter(star => !star.used);
  }
  
  applyLevelBonus() {
    super.applyLevelBonus();
    
    switch(this.level) {
      case 2:
        this.maxStars = 4; // 최대 별 개수 증가
        break;
      case 3:
        this.starRange += 25; // 범위 증가
        this.distance += 25;
        break;
      case 4:
        this.damage += 8; // 데미지 증가
        this.starDuration += 1000; // 지속시간 증가
        break;
      case 5:
        this.maxStars = 5; // 최대 별 개수 증가
        this.baseCooldown *= 0.85; // 쿨타임 감소
        break;
      case 6:
        this.starRange += 30; // 범위 추가 증가
        this.tickInterval = 600; // 더 빠른 틱
        break;
      case 7:
        this.damage += 10; // 데미지 추가 증가
        this.maxStars = 6; // 최대 별 개수 증가
        break;
      case 8:
        this.starDuration += 1500; // 지속시간 추가 증가
        this.starRange += 35; // 범위 추가 증가
        this.distance += 35;
        break;
      case 9:
        this.baseCooldown *= 0.8; // 쿨타임 추가 감소
        this.damage += 12; // 데미지 추가 증가
        this.maxStars = 7;
        break;
      case 10:
        this.maxStars = 8; // 최대 별 개수 (최대)
        this.tickInterval = 400; // 최고속 틱
        this.damage += 15; // 최종 데미지 보너스
        this.starDuration = 8000; // 최종 지속시간
        break;
    }
    
    // 레벨업 시 범위 업데이트
    this.updateRange();
  }
}

class SupernovaStar {
  constructor(x, y, range, damage, duration, tickInterval) {
    this.x = x;
    this.y = y;
    this.range = range;
    this.damage = damage;
    this.duration = duration;
    this.tickInterval = tickInterval;
    this.startTime = gameTimeSystem.getTime();
    this.lastTickTime = this.startTime;
    this.used = false;
    
    // 애니메이션 속성
    this.pulseTime = 0;
    
    // 다중 파동 효과 속성
    this.waves = []; // 활성 파동들
    this.lastWaveTime = this.startTime;
    this.waveInterval = 800; // 파동 생성 간격
    this.maxWaves = 3; // 동시에 표시되는 최대 파동 수
    
    // 생성 애니메이션 속성
    this.spawnProgress = 0;
    this.spawnDuration = 500;
    this.isSpawning = true;
    this.spawnScale = 0;
  }
  
  update() {
    const currentTime = gameTimeSystem.getTime();
    const elapsedTime = currentTime - this.startTime;
    
    // 생성 애니메이션 업데이트
    if (this.isSpawning) {
      this.spawnProgress = Math.min(1, elapsedTime / this.spawnDuration);
      const easedProgress = 1 - Math.pow(1 - this.spawnProgress, 3);
      this.spawnScale = easedProgress;
      
      if (this.spawnProgress >= 1) {
        this.isSpawning = false;
        this.spawnScale = 1;
      }
    }
    
    // 지속시간 체크
    if (elapsedTime >= this.duration) {
      this.used = true;
      return;
    }
    
    // 애니메이션 업데이트
    this.pulseTime += 0.05;
    
    // 파동 효과 업데이트
    this.updateWaves(currentTime);
    
    // 주기적 데미지
    if (!this.isSpawning && currentTime - this.lastTickTime >= this.tickInterval) {
      this.dealDamage();
      this.lastTickTime = currentTime;
    }
  }
  
  updateWaves(currentTime) {
    // 기존 파동들 업데이트
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const wave = this.waves[i];
      wave.radius += wave.speed;
      wave.alpha = Math.max(0, 1 - (wave.radius / wave.maxRadius));
      
      // 파동이 최대 범위를 벗어나면 제거
      if (wave.radius >= wave.maxRadius) {
        this.waves.splice(i, 1);
      }
    }
    
    // 새로운 파동 생성
    if (currentTime - this.lastWaveTime >= this.waveInterval && this.waves.length < this.maxWaves) {
      this.createNewWave();
      this.lastWaveTime = currentTime;
    }
  }
  
  createNewWave() {
    this.waves.push({
      radius: 10,
      maxRadius: this.range * 1.5,
      speed: 3,
      alpha: 1,
      color: { r: 255, g: 165, b: 0 },
      thickness: 15 + Math.random() * 10
    });
  }
  
  dealDamage() {
    // 범위 내 모든 적에게 동일한 데미지
    for (let enemy of gameObjects.enemies) {
      if (enemy.state !== 'moving') continue;
      
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= this.range + enemy.size) {
        const finalDamage = this.damage / (1000 / this.tickInterval);
        enemy.takeDamage(finalDamage);
      }
    }
  }
  
  draw(offsetX, offsetY) {
    const drawX = this.x + offsetX;
    const drawY = this.y + offsetY;
    
    ctx.save();
    
    // 남은 시간에 따른 투명도
    const remainingTime = this.duration - (gameTimeSystem.getTime() - this.startTime);
    let alpha = 1.0;
    if (remainingTime < 1000) {
      alpha = remainingTime / 1000;
    }
    
    if (this.isSpawning) {
      alpha *= this.spawnProgress;
    }
    
    // 바닥 효과 (범위 표시)
    this.drawGroundEffect(drawX, drawY, alpha);
    
    // 파동 효과들 그리기
    this.drawWaves(drawX, drawY, alpha);
    
    // 중심 별 그리기
    this.drawCenterStar(drawX, drawY, alpha);
    
    ctx.restore();
  }
  
  drawGroundEffect(drawX, drawY, alpha) {
    // 바닥 그라디언트 효과
    const groundGradient = ctx.createRadialGradient(
      drawX, drawY, 0,
      drawX, drawY, this.range * this.spawnScale
    );
    
    groundGradient.addColorStop(0, `rgba(255, 215, 0, ${alpha * 0.3})`);
    groundGradient.addColorStop(0.5, `rgba(255, 165, 0, ${alpha * 0.2})`);
    groundGradient.addColorStop(0.8, `rgba(255, 100, 0, ${alpha * 0.1})`);
    groundGradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = groundGradient;
    ctx.beginPath();
    ctx.arc(drawX, drawY, this.range * this.spawnScale, 0, Math.PI * 2);
    ctx.fill();
    
    // 범위 테두리 (점선)
    ctx.globalAlpha = alpha * 0.4;
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.arc(drawX, drawY, this.range * this.spawnScale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  
  drawWaves(drawX, drawY, alpha) {
    // 각 파동 그리기
    this.waves.forEach((wave, index) => {
      ctx.globalAlpha = alpha * wave.alpha * 0.8;
      
      // 파동 그라디언트
      const waveGradient = ctx.createRadialGradient(
        drawX, drawY, Math.max(0, wave.radius - wave.thickness),
        drawX, drawY, wave.radius
      );
      
      const color = wave.color;
      waveGradient.addColorStop(0, 'transparent');
      waveGradient.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, 0.2)`);
      waveGradient.addColorStop(0.7, `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`);
      waveGradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0.2)`);
      
      ctx.strokeStyle = waveGradient;
      ctx.lineWidth = wave.thickness;
      ctx.beginPath();
      ctx.arc(drawX, drawY, wave.radius, 0, Math.PI * 2);
      ctx.stroke();
      
      // 파동 내부 빛
      ctx.globalAlpha = alpha * wave.alpha * 0.5;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(drawX, drawY, wave.radius, 0, Math.PI * 2);
      ctx.stroke();
      
      // 파동 외부 글로우
      if (wave.alpha > 0.5) {
        ctx.globalAlpha = alpha * wave.alpha * 0.3;
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`;
        ctx.lineWidth = wave.thickness * 1.5;
        ctx.shadowBlur = 20;
        ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
        ctx.beginPath();
        ctx.arc(drawX, drawY, wave.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    });
  }
  
  drawCenterStar(drawX, drawY, alpha) {
    ctx.globalAlpha = alpha;
    ctx.save();
    ctx.translate(drawX, drawY);
    
    // 외부 글로우
    const glowSize = 80 * this.spawnScale;
    const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
    glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    glowGradient.addColorStop(0.2, 'rgba(255, 215, 0, 0.7)');
    glowGradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.4)');
    glowGradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    // 별 이미지 그리기
    const pulseScale = 1 + Math.sin(this.pulseTime) * 0.1;
    const starSize = 64 * pulseScale * this.spawnScale;
    
    if (assetManager.loaded.weapons && assetManager.images.weapons.supernova) {
      ctx.save();
      ctx.translate(drawX, drawY);
      ctx.rotate(this.rotation);
      
      ctx.drawImage(
        assetManager.images.weapons.supernova,
        -starSize / 2,
        -starSize / 2,
        starSize,
        starSize
      );
      ctx.restore();
    }
  }
}

// 라이트닝볼트 무기 클래스
class LightningBoltWeapon extends Weapon {
  constructor() {
    super({
      type: 'lightningBolt',
      baseCooldown: 800,
      damage: 20
    });
    this.projectileSpeed = 7;
    this.maxBounces = 3; // 최대 반사 횟수
    this.projectileCount = 1; // 동시 발사 개수 추가
  }
  
  fire() {
    // projectileCount만큼 발사
    for (let i = 0; i < this.projectileCount; i++) {
      let angle;
      
      // 첫 번째 발사체는 가장 가까운 적을 향해
      if (i === 0) {
        const nearestEnemy = findNearestEnemy();
        if (nearestEnemy) {
          const dx = nearestEnemy.x - player.x;
          const dy = nearestEnemy.y - player.y;
          angle = Math.atan2(dy, dx);
        } else {
          // 적이 없으면 무작위 방향
          angle = Math.random() * Math.PI * 2;
        }
      } else {
        // 나머지 발사체들은 완전 무작위 방향으로
        angle = Math.random() * Math.PI * 2; // 0 ~ 2π 사이의 랜덤 각도
      }
      
      const bolt = new LightningBoltProjectile(
        player.x,
        player.y,
        angle,
        this.projectileSpeed,
        this.damage * player.getTotalRangedAttackPower(),
        this.maxBounces,
        player.getTotalAttackRange() // 공격 범위 전달
      );
      
      gameObjects.bullets.push(bolt);
    }
  }
  
  applyLevelBonus() {
    super.applyLevelBonus();
    
    switch(this.level) {
      case 2:
        this.projectileCount = 2; // 2발 동시 발사
        this.maxBounces = 4; // 반사 횟수 증가
        break;
      case 3:
        this.projectileSpeed += 1; // 속도 증가
        break;
      case 4:
        this.projectileCount = 3; // 3발 동시 발사
        this.damage += 8; // 데미지 증가
        this.baseCooldown *= 0.8; // 쿨타임 감소
        break;
      case 5:
        this.maxBounces = 5; // 반사 횟수 추가 증가
        break;
      case 6:
        this.projectileCount = 4; // 4발 동시 발사
        this.projectileSpeed += 1; // 속도 추가 증가
        break;
      case 7:
        this.maxBounces = 6; // 반사 횟수 추가 증가
        this.damage += 10; // 데미지 추가 증가
        break;
      case 8:
        this.projectileCount = 5; // 5발 동시 발사
        this.baseCooldown *= 0.7; // 쿨타임 추가 감소
        break;
      case 9:
        this.maxBounces = 7; // 반사 횟수 추가 증가
        break;
      case 10:
        this.projectileCount = 6; // 6발 동시 발사 (최대)
        this.maxBounces = 8; // 최대 반사 횟수
        this.damage += 15; // 최종 데미지 보너스
        this.baseCooldown *= 0.6;
        this.projectileSpeed += 2; // 최종 속도 증가
        break;
    }
    
    this.updateCooldown(player.getTotalCooldownReduction());
  }
}

// 라이트닝볼트 투사체 클래스
class LightningBoltProjectile {
  constructor(x, y, angle, speed, damage, maxBounces, attackRangeMultiplier = 1) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = speed;
    this.damage = damage;
    this.maxBounces = maxBounces;
    this.bounceCount = 0;
    this.used = false;
    this.baseSize = 8;
    this.size = this.baseSize * attackRangeMultiplier; // 충돌 판정용 크기
    this.attackRangeMultiplier = attackRangeMultiplier;
    
    // 256x256 스프라이트 정보
    this.spriteWidth = 256;
    this.spriteHeight = 256;
    
    // 애니메이션 관련
    this.frameWidth = 256;
    this.frameHeight = 64;
    this.frameCount = 4;
    this.currentFrame = 0;
    this.frameTime = 0;
    this.frameDuration = 100;
    
    // 이동 벡터
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    
    // 화면 경계 (카메라 오프셋 고려)
    this.screenMargin = 50; // 화면 경계에서의 여유 공간
    
    // 맞춘 적 추적 (중복 데미지 방지)
    this.hitEnemies = new Set();
    
    // 시각적 효과
    this.trail = []; // 잔상 효과
    this.maxTrailLength = 8;
  }
  
  update() {
    // 애니메이션 프레임 업데이트
    this.frameTime += 16;
    if (this.frameTime >= this.frameDuration) {
      this.frameTime = 0;
      this.currentFrame = (this.currentFrame + 1) % this.frameCount;
    }
    
    // 잔상 효과 업데이트
    this.trail.unshift({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.pop();
    }
    
    // 이동
    this.x += this.vx;
    this.y += this.vy;
    
    // 적과의 충돌 체크
    for (let enemy of gameObjects.enemies) {
      if (enemy.state === 'moving' && !this.hitEnemies.has(enemy)) {
        if (this.checkCollisionWithEnemy(enemy)) {
          enemy.takeDamage(this.damage);
          this.hitEnemies.add(enemy);
          
          // 적에 맞으면 반사
          this.bounceOffEnemy(enemy);
          break;
        }
      }
    }
    
    // 화면 경계 체크 및 반사
    this.checkScreenBounce();
    
    // 최대 반사 횟수 도달 시 제거
    if (this.bounceCount >= this.maxBounces) {
      this.used = true;
    }
  }
  
  checkCollisionWithEnemy(enemy) {
    const dx = enemy.x - this.x;
    const dy = enemy.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.size + enemy.size;
  }
  
  bounceOffEnemy(enemy) {
    // 적과의 충돌 지점에서 반사각 계산
    const dx = this.x - enemy.x;
    const dy = this.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      // 법선 벡터
      const nx = dx / distance;
      const ny = dy / distance;
      
      // 반사 공식: v' = v - 2(v·n)n
      const dot = this.vx * nx + this.vy * ny;
      this.vx = this.vx - 2 * dot * nx;
      this.vy = this.vy - 2 * dot * ny;
      
      // 각도 업데이트
      this.angle = Math.atan2(this.vy, this.vx);
      
      // 약간의 랜덤 변화 추가
      const randomAngle = (Math.random() - 0.5) * 0.3;
      this.angle += randomAngle;
      this.vx = Math.cos(this.angle) * this.speed;
      this.vy = Math.sin(this.angle) * this.speed;
      
      this.bounceCount++;
      
      // 반사할 때마다 새로운 적을 타겟팅할 수 있도록
      this.redirectToNearestEnemy();
    }
  }
  
  redirectToNearestEnemy() {
    // 맞지 않은 가장 가까운 적을 찾아서 방향 조정
    let nearestEnemy = null;
    let minDistance = 300; // 최대 유도 거리
    
    for (let enemy of gameObjects.enemies) {
      if (enemy.state === 'moving' && !this.hitEnemies.has(enemy)) {
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestEnemy = enemy;
        }
      }
    }
    
    if (nearestEnemy) {
      // 현재 방향과 타겟 방향을 혼합 (약간의 유도 효과)
      const targetAngle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
      const guidanceStrength = 0.3; // 유도 강도 (0~1)
      
      this.angle = this.angle * (1 - guidanceStrength) + targetAngle * guidanceStrength;
      this.vx = Math.cos(this.angle) * this.speed;
      this.vy = Math.sin(this.angle) * this.speed;
    }
  }
  
  checkScreenBounce() {
    // 현재 화면 경계 계산 (플레이어 기준)
    const screenLeft = player.x - canvas.width / 2 + this.screenMargin;
    const screenRight = player.x + canvas.width / 2 - this.screenMargin;
    const screenTop = player.y - canvas.height / 2 + this.screenMargin;
    const screenBottom = player.y + canvas.height / 2 - this.screenMargin;
    
    let bounced = false;
    
    // 좌우 경계 반사
    if (this.x <= screenLeft || this.x >= screenRight) {
      this.vx = -this.vx;
      this.x = Math.max(screenLeft, Math.min(screenRight, this.x));
      bounced = true;
    }
    
    // 상하 경계 반사
    if (this.y <= screenTop || this.y >= screenBottom) {
      this.vy = -this.vy;
      this.y = Math.max(screenTop, Math.min(screenBottom, this.y));
      bounced = true;
    }
    
    if (bounced) {
      this.angle = Math.atan2(this.vy, this.vx);
      this.bounceCount++;
      
      // 화면 경계에서 반사할 때도 새로운 적 타겟팅
      this.redirectToNearestEnemy();
    }
  }
  
  draw(offsetX, offsetY) {
    if (!assetManager.loaded.weapons || !assetManager.images.weapons.lightningBolt) {
      return;
    }
    
    ctx.save();
    
    // 잔상 효과 그리기
    this.trail.forEach((trailPoint, index) => {
      const alpha = (this.maxTrailLength - index) / this.maxTrailLength * 0.3;
      const scale = 0.5 + (this.maxTrailLength - index) / this.maxTrailLength * 0.5;
      
      ctx.globalAlpha = alpha;
      
      const trailSize = this.frameWidth * 0.5 * scale * this.attackRangeMultiplier;
      
      ctx.translate(trailPoint.x + offsetX, trailPoint.y + offsetY);
      ctx.rotate(this.angle);
      
      // 잔상은 현재 프레임보다 한 프레임 뒤
      const trailFrame = Math.max(0, this.currentFrame - 1);
      ctx.drawImage(
        assetManager.images.weapons.lightningBolt,
        0, trailFrame * this.frameHeight,
        this.frameWidth, this.frameHeight,
        -trailSize / 2, -trailSize / 8,
        trailSize, trailSize / 4
      );
      
      ctx.setTransform(1, 0, 0, 1, 0, 0); // 변환 초기화
    });
    
    // 번개 볼트 그리기
    ctx.globalAlpha = 1.0;
    ctx.translate(this.x + offsetX, this.y + offsetY);
    ctx.rotate(this.angle);
    
    // 현재 애니메이션 프레임
    const drawSize = this.frameWidth * 0.4 * this.attackRangeMultiplier;
    
    ctx.drawImage(
      assetManager.images.weapons.lightningBolt,
      0, this.currentFrame * this.frameHeight,
      this.frameWidth, this.frameHeight,
      -drawSize / 2, -drawSize / 8,
      drawSize, drawSize / 4
    );
    ctx.restore();
  }
  
  outOfBounds() {
    return this.used;
  }
}

// 폴터가이스트 무기 클래스
class PoltergeistWeapon extends Weapon {
  constructor() {
    super({
      type: 'poltergeist',
      baseCooldown: 5000, // 5초 쿨타임
      damage: 25
    });
    
    this.circleCount = 3;
    this.baseCircleRadius = 100; // 기본 원 반경
    this.circleRadius = this.baseCircleRadius;
    this.projectileDuration = 3000;
    this.projectilesPerCircle = 3;
    this.spawnDistance = 120;
    this.baseGhostSize = 15;
  }

  // 공격 범위 특성 적용
  updateRange() {
    this.circleRadius = this.baseCircleRadius * player.getTotalAttackRange();
  }
  
  fire() {
    // 여러 개의 원을 다른 위치에 생성
    for (let i = 0; i < this.circleCount; i++) {
      // 플레이어 주변에 원의 중심점 설정
      const angle = (Math.PI * 2 * i / this.circleCount) + Math.random() * Math.PI * 2;
      const spawnX = player.x + Math.cos(angle) * this.spawnDistance;
      const spawnY = player.y + Math.sin(angle) * this.spawnDistance;
      
      // 한 원에 속하는 여러 유령 생성 (균등하게 배치)
      for (let j = 0; j < this.projectilesPerCircle; j++) {
        const startAngle = (Math.PI * 2 * j) / this.projectilesPerCircle + Math.random() * Math.PI * 2;
        
        const ghost = new PoltergeistProjectile(
          spawnX,
          spawnY,
          startAngle,
          this.circleRadius, // 공격 범위 특성이 적용된 반경
          this.damage * player.getTotalRangedAttackPower(),
          this.projectileDuration,
          this.baseGhostSize * player.getTotalAttackRange() // 유령 크기도 범위에 비례
        );
        
        gameObjects.bullets.push(ghost);
      }
    }
  }
  
  applyLevelBonus() {
    super.applyLevelBonus();
    
    switch(this.level) {
      case 2:
        this.baseGhostSize = 18;
        break;
      case 3:
        this.circleRadius += 20; // 원 반경 증가
        this.damage += 10; // 데미지 증가
        break;
      case 4:
        this.baseGhostSize = 21;
        break;
      case 5:
        this.projectileDuration += 500; // 지속시간 증가
        this.baseCooldown *= 0.9; // 쿨타임 감소
        break;
      case 6:
        this.projectilesPerCircle = 4; // 원당 유령 수 증가
        this.damage += 10;
        this.baseGhostSize = 24;
        break;
      case 7:
        this.circleRadius += 25;
        break;
      case 8:
        this.projectileDuration += 700; // 지속시간 추가 증가
        this.damage += 10;
        this.baseGhostSize = 27;
        break;
      case 9:
        this.damage += 10;
        this.baseCooldown *= 0.9; // 쿨타임 추가 감소
        break;
      case 10:
        this.circleCount = 4;
        this.damage += 10; // 최종 데미지 보너스
        this.circleRadius += 30; // 최종 반경
        this.projectileDuration = 4000; // 최종 지속시간
        this.baseGhostSize = 30;
        break;
    }
    
    // 레벨업 시 범위 업데이트
    this.updateRange();
  }
}

// 폴터가이스트 투사체 클래스
class PoltergeistProjectile {
  constructor(centerX, centerY, startAngle, orbitRadius, damage, duration, size) {
    this.centerX = centerX; // 고정된 중심점 (소환 위치)
    this.centerY = centerY;
    this.angle = startAngle;
    this.orbitRadius = orbitRadius;
    this.damage = damage;
    this.duration = duration;
    this.startTime = gameTimeSystem.getTime();
    this.used = false;
    
    // 회전 속도 (개별 랜덤)
    this.rotationSpeed = 0.03 + Math.random() * 0.01; // 더 빠른 회전
    
    // 위치 계산
    this.updatePosition();
    
    // 크기
    this.size = size;
    
    // 이미 맞은 적 추적
    this.hitEnemies = new Map(); // enemy => lastHitTime
    this.hitCooldown = 500; // 0.5초마다 같은 적에게 데미지
    
    // 애니메이션
    this.fadeIn = true;
    this.fadeInDuration = 300;
    
    // 1~8 중 랜덤 이미지 선택
    this.imageIndex = Math.floor(Math.random() * 8) + 1;
  }
  
  updatePosition() {
    // 원형 궤도상의 위치 계산
    this.x = this.centerX + Math.cos(this.angle) * this.orbitRadius;
    this.y = this.centerY + Math.sin(this.angle) * this.orbitRadius;
  }
  
  update() {
    const currentTime = gameTimeSystem.getTime();
    const elapsed = currentTime - this.startTime;
    
    // 지속시간 체크
    if (elapsed >= this.duration) {
      this.used = true;
      return;
    }
    
    // 회전 각도 업데이트
    this.angle += this.rotationSpeed;
    
    // 새 위치 계산
    this.updatePosition();
    
    // 적과의 충돌 검사
    for (let enemy of gameObjects.enemies) {
      if (enemy.state !== 'moving') continue;
      
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.size + enemy.size) {
        // 마지막 히트 시간 확인
        const lastHitTime = this.hitEnemies.get(enemy) || 0;
        
        if (currentTime - lastHitTime >= this.hitCooldown) {
          enemy.takeDamage(this.damage);
          this.hitEnemies.set(enemy, currentTime);
        }
      }
    }
  }
  
  draw(offsetX, offsetY) {
    ctx.save();
    
    // 페이드 효과 계산
    let alpha = 1.0;
    const elapsed = gameTimeSystem.getTime() - this.startTime;
    
    if (this.fadeIn && elapsed < this.fadeInDuration) {
      alpha = elapsed / this.fadeInDuration;
    }
    
    const fadeOutStart = this.duration * 0.8;
    if (elapsed > fadeOutStart) {
      const fadeProgress = (elapsed - fadeOutStart) / (this.duration - fadeOutStart);
      alpha *= (1 - fadeProgress);
    }
    
    // 메인 유령 그리기
    const drawX = this.x + offsetX;
    const drawY = this.y + offsetY;
    
    ctx.globalAlpha = alpha;
    
    // 유령 이미지 그리기
    if (assetManager.loaded.weapons && assetManager.images.weapons[`poltergeist_${this.imageIndex}`]) {
      ctx.save();
      ctx.translate(drawX, drawY);
      
      const drawSize = this.size * 3;
      
      // 메인 이미지
      ctx.globalAlpha = alpha;
      ctx.drawImage(
        assetManager.images.weapons[`poltergeist_${this.imageIndex}`],
        -drawSize / 2,
        -drawSize / 2,
        drawSize,
        drawSize
      );
      
      ctx.restore();
    }
  }
  
  outOfBounds() {
    return this.used;
  }
}

//----------------------
// Enemy 클래스
//----------------------

// 적 타입 정의
const ENEMY_TYPES = {
  NORMAL: {
    name: "Normal",
    size: 10,
    speedBase: 0.25,
    speedVariance: 0.05,
    healthBase: 5,
    healthPerLevel: 1.5,
    attackBase: 10,
    attackPerLevel: 0.5,
    expValue: 3,
    goldValue: 10,
    spawnWeight: 70 // 스폰 가중치
  },
  FAST: {
    name: "Fast",
    size: 7.5,
    speedBase: 0.75,
    speedVariance: 0.1,
    healthBase: 3,
    healthPerLevel: 1.0,
    attackBase: 5,
    attackPerLevel: 0.3,
    expValue: 5,
    goldValue: 8,
    spawnWeight: 20
  },
  TANK: {
    name: "Tank",
    size: 12.5,
    speedBase: 0.15,
    speedVariance: 0.02,
    healthBase: 20,
    healthPerLevel: 2.5,
    attackBase: 15,
    attackPerLevel: 0.7,
    expValue: 15,
    goldValue: 15,
    spawnWeight: 10
  },
  SHOOTER: {
    name: "Shooter",
    size: 9,
    speedBase: 0.2,
    speedVariance: 0.05,
    healthBase: 4,       // 체력이 적음
    healthPerLevel: 1.0,
    attackBase: 8,
    attackPerLevel: 0.4,
    expValue: 5,
    goldValue: 12,
    spawnWeight: 15,
    canShoot: true,      // 발사 가능 표시
    shootCooldown: 2000  // 발사 간격(ms)
  },
  BOSS: {
    name: "Boss",
    size: 20,
    speedBase: 0.15,
    speedVariance: 0.0,
    healthBase: 100,
    healthPerLevel: 10,
    attackBase: 20,
    attackPerLevel: 1.5,
    expValue: 100,
    goldValue: 100,
    spawnWeight: 0, // 특별 조건에서만 스폰
    isBoss: true
  }
};

class Enemy {
  constructor(x, y, size, speed, health, attackStrength) {
    this.x = x;
    this.y = y;
    this.originalSize = size;
    this.size = size;
    this.speed = speed;
    this.health = health;
    this.maxHealth = health;
    
    // 애니메이션 관련 속성
    this.state = 'spawning';
    this.stateStartTime = gameTimeSystem.getTime();
    this.spawnDuration = 500;
    this.deathDuration = 500;
    this.currentFrame = 0;
    this.frameCount = 4;
    this.frameTime = 0;
    this.frameDuration = 150;
    this.spriteWidth = 64;
    this.spriteHeight = 64;
    this.direction = 'right';
    this.angle = 0;
    this.animationTime = 0;
    this.wobbleAmount = 0;
    this.currentSize = 0;

    // 공격 관련 속성
    this.attackStrength = attackStrength;
    this.lastAttackTime = 0;
    this.attackCooldown = 500;

    // 발사 관련 속성
    this.canShoot = false;
    this.shootRange = 150;
    this.shootCooldown = 2000;
    this.lastShotTime = 0;
    
    // 피격 효과 관련 속성
    this.isHit = false;
    this.hitTime = 0;
    this.hitDuration = 200;
    this.hitBrightness = 0;
  }
  
  update() {
    const currentTime = gameTimeSystem.getTime();
    const deltaTime = 16;
    this.animationTime += deltaTime;

    // 발사 로직
    if (this.canShoot && this.state === 'moving') {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= this.shootRange && currentTime - this.lastShotTime >= this.shootCooldown) {
        this.shoot();
        this.lastShotTime = currentTime;
      }
    }
    
    // 피격 효과 업데이트
    this.updateHitEffect(currentTime);
    
    // 상태별 업데이트
    this.updateByState(currentTime);
  }

  updateHitEffect(currentTime) {
    if (this.isHit) {
      const elapsedHitTime = currentTime - this.hitTime;
      if (elapsedHitTime >= this.hitDuration) {
        this.isHit = false;
        this.hitBrightness = 0;
      } else {
        this.hitBrightness = 1 - (elapsedHitTime / this.hitDuration);
      }
    }
  }

  updateByState(currentTime) {
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
    }
  }

  updateSpawning(currentTime) {
    const elapsedTime = currentTime - this.stateStartTime;
    const progress = Math.min(elapsedTime / this.spawnDuration, 1);
    
    this.currentSize = Math.max(0, this.size * this.easeOutBack(progress));
    
    if (progress >= 1) {
      this.state = 'moving';
      this.currentSize = this.size;
    }
  }
  
  updateMoving() {
    // 플레이어 방향으로 이동
    const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
    let moveX = Math.cos(angleToPlayer) * this.speed;
    let moveY = Math.sin(angleToPlayer) * this.speed;
    
    // 적 분리 기능
    const separationForce = this.calculateSeparation();
    const separationWeight = 4.5;
    moveX += separationForce.x * separationWeight;
    moveY += separationForce.y * separationWeight;
    
    // 움직임 정규화
    const magnitude = Math.sqrt(moveX * moveX + moveY * moveY);
    if (magnitude > 0) {
      moveX = (moveX / magnitude) * this.speed;
      moveY = (moveY / magnitude) * this.speed;
    }
    
    // 이동 적용
    this.x += moveX;
    this.y += moveY;
    
    // 방향 업데이트
    this.angle = Math.atan2(moveY, moveX);
    this.direction = moveX < 0 ? 'left' : 'right';
    
    // 애니메이션 효과 업데이트
    this.wobbleAmount = Math.sin(this.animationTime * 0.01) * 2;
    
    // 프레임 업데이트
    this.frameTime += 16;
    if (this.frameTime >= this.frameDuration) {
      this.frameTime = 0;
      this.currentFrame = (this.currentFrame + 1) % this.frameCount;
    }
  }
  
  updateDying(currentTime) {
    const elapsedTime = currentTime - this.stateStartTime;
    const progress = Math.min(elapsedTime / this.deathDuration, 1);
    
    this.currentSize = this.size * (1 - this.easeInQuad(progress));
    
    if (progress >= 1) {
      this.state = 'dead';
      this.die();
    }
  }

  shoot() {
    const angle = Math.atan2(player.y - this.y, player.x - this.x);
    const randomAngle = angle + (Math.random() * 0.2 - 0.1);
    
    gameObjects.bullets.push(
      new EnemyBullet(
        this.x,
        this.y,
        4,
        3,
        randomAngle,
        this.attackStrength / 2
      )
    );
  }

  // 통합된 그리기 메서드
  draw(offsetX, offsetY) {
    const drawX = this.x + offsetX;
    const drawY = this.y + offsetY;
    
    // 상태별 설정
    const stateConfig = this.getStateConfig();
    if (!stateConfig) return;
    
    ctx.globalAlpha = stateConfig.alpha;
    
    // 그림자 그리기
    if (stateConfig.showShadow) {
      this.drawShadow(drawX, drawY, stateConfig.size);
    }
    
    // 스폰 서클 효과
    if (stateConfig.showCircle) {
      this.drawSpawnCircle(drawX, drawY);
    }
    
    // 적 스프라이트 그리기
    this.drawSprite(drawX, drawY, stateConfig.size);
    
    // 체력바 그리기
    if (this.state === 'moving') {
      this.drawHealthBar(drawX, drawY);
    }
    
    ctx.globalAlpha = 1;
  }

  getStateConfig() {
    const currentTime = gameTimeSystem.getTime();
    
    switch(this.state) {
      case 'spawning':
        return {
          alpha: Math.min((currentTime - this.stateStartTime) / this.spawnDuration, 1),
          size: this.currentSize,
          showCircle: true,
          showShadow: false
        };
      case 'moving':
        const pulse = 1 + Math.sin(this.animationTime * 0.005) * 0.05;
        return {
          alpha: 1,
          size: Math.max(0.1, this.currentSize * pulse),
          showCircle: false,
          showShadow: true
        };
      case 'dying':
        return {
          alpha: 1 - Math.min((currentTime - this.stateStartTime) / this.deathDuration, 1),
          size: this.currentSize,
          showCircle: false,
          showShadow: false
        };
      default:
        return null;
    }
  }

  drawShadow(drawX, drawY, size) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(drawX + 3, drawY + 5, size * 0.8, size * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawSpawnCircle(drawX, drawY) {
    const progress = (gameTimeSystem.getTime() - this.stateStartTime) / this.spawnDuration;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(drawX, drawY, this.currentSize * 1.5, 0, Math.PI * 2 * progress);
    ctx.stroke();
  }

  drawSprite(drawX, drawY, size) {
    const enemyImage = this.getEnemyImage();
    if (!enemyImage) return;
    
    const spriteX = this.currentFrame * this.spriteWidth;
    const displaySize = this.size * 2.5;
    
    ctx.save();
    
    // 방향에 따른 변환 처리
    if (this.direction === 'right') {
      ctx.translate(drawX + displaySize / 2 + this.wobbleAmount, 0);
      ctx.scale(-1, 1);
    }
    
    // 피격 효과 처리
    if (this.isHit && this.hitBrightness > 0) {
      this.drawSpriteWithHitEffect(enemyImage, spriteX, drawX, drawY, displaySize);
    } else {
      this.drawNormalSprite(enemyImage, spriteX, drawX, drawY, displaySize);
    }
    
    ctx.restore();
  }

  getEnemyImage() {
    if (!assetManager.loaded.enemies) return null;
    
    const imageMap = {
      "Boss": assetManager.images.enemies.boss,
      "Fast": assetManager.images.enemies.fast,
      "Tank": assetManager.images.enemies.tank,
      "Shooter": assetManager.images.enemies.shooter,
      "Normal": assetManager.images.enemies.normal
    };
    
    return imageMap[this.type] || assetManager.images.enemies.normal;
  }

  drawSpriteWithHitEffect(enemyImage, spriteX, drawX, drawY, displaySize) {
    // 임시 캔버스 생성으로 피격 효과 적용
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = displaySize;
    tempCanvas.height = displaySize;
    const tempCtx = tempCanvas.getContext('2d');
    
    // 원본 이미지 그리기
    tempCtx.drawImage(
      enemyImage,
      spriteX, 0,
      this.spriteWidth, this.spriteHeight,
      0, 0,
      displaySize, displaySize
    );
    
    // 피격 효과 적용
    tempCtx.globalCompositeOperation = 'source-atop';
    tempCtx.fillStyle = 'white';
    tempCtx.globalAlpha = this.hitBrightness * 0.7;
    tempCtx.fillRect(0, 0, displaySize, displaySize);
    
    // 원본 이미지 그리기
    if (this.direction === 'right') {
      ctx.drawImage(
        enemyImage,
        spriteX, 0,
        this.spriteWidth, this.spriteHeight,
        0, drawY - displaySize / 2,
        displaySize, displaySize
      );
    } else {
      ctx.drawImage(
        enemyImage,
        spriteX, 0,
        this.spriteWidth, this.spriteHeight,
        drawX - displaySize / 2 + this.wobbleAmount,
        drawY - displaySize / 2,
        displaySize, displaySize
      );
    }
    
    // 효과 오버레이
    ctx.globalCompositeOperation = 'lighter';
    if (this.direction === 'right') {
      ctx.drawImage(tempCanvas, 0, drawY - displaySize / 2);
    } else {
      ctx.drawImage(tempCanvas, drawX - displaySize / 2 + this.wobbleAmount, drawY - displaySize / 2);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  drawNormalSprite(enemyImage, spriteX, drawX, drawY, displaySize) {
    if (this.direction === 'right') {
      ctx.drawImage(
        enemyImage,
        spriteX, 0,
        this.spriteWidth, this.spriteHeight,
        0, drawY - displaySize / 2,
        displaySize, displaySize
      );
    } else {
      ctx.drawImage(
        enemyImage,
        spriteX, 0,
        this.spriteWidth, this.spriteHeight,
        drawX - displaySize / 2 + this.wobbleAmount,
        drawY - displaySize / 2,
        displaySize, displaySize
      );
    }
  }

  drawHealthBar(drawX, drawY) {
    const barWidth = this.size * 2;
    const barHeight = 5;
    const barY = drawY - this.currentSize - 10;
    
    // 배경
    ctx.fillStyle = 'black';
    ctx.fillRect(drawX - barWidth/2, barY, barWidth, barHeight);
    
    // 체력바
    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle = healthPercent > 0.5 ? 'green' : healthPercent > 0.25 ? 'yellow' : 'red';
    ctx.fillRect(drawX - barWidth/2, barY, barWidth * healthPercent, barHeight);
  }

  takeDamage(damage) {
    if (this.state === 'moving') {
      let finalDamage = damage;
      
      // 보스 추가 데미지 적용
      if (this.isBoss && player.bossDamageBonus) {
        finalDamage *= (1 + player.bossDamageBonus);
      }
      
      this.health -= finalDamage;
      
      this.isHit = true;
      this.hitTime = gameTimeSystem.getTime();
      this.hitBrightness = 1;
      
      if (this.health <= 0) {
        this.startDying();
      }
    }
  }

  startDying() {
    this.state = 'dying';
    this.stateStartTime = gameTimeSystem.getTime();
    totalKills++;

    // 웨이브 시스템 업데이트
    if (spawnState.currentPhase === 'normal') {
      // 일반 적이 죽었을 때만 카운트 (보스 제외)
      if (!this.isBoss) {
        spawnState.enemiesThisWave = Math.max(0, spawnState.enemiesThisWave - 1);
      }
    }

    // 사망 이펙트 생성
    const deathEffect = new DeathEffect(this.x, this.y, this.size, this.type);
    gameObjects.bullets.push(deathEffect); // bullets 배열에 추가 (같은 업데이트/드로우 루프 사용)
    
    // 최대 레벨이 아닐 때만 경험치 획득
    if (player.level < MAX_PLAYER_LEVEL) {
      const expValue = this.expValue || 3;
      const finalExpGained = Math.floor(expValue * player.getTotalExpMultiplier());
      player.exp += finalExpGained;
    }
    
    let goldValue = this.goldValue || 10;
    goldValue = Math.floor(goldValue * player.getTotalGoldMultiplier());
    gold += goldValue;
    saveGold();
    
    // 행운이 보석 드롭 확률에 영향 (총 행운 사용)
    const baseDrop = 0.1;
    const luckBonus = player.getTotalLuck() * 0.5;
    const dropChance = Math.min(baseDrop * (1 + luckBonus), 0.8);
    
    if (!this.isBoss && Math.random() < dropChance) {
      const jewelType = getWeightedRandomJewelType();
      gameObjects.jewels.push(new Jewel(this.x, this.y, jewelType));
    }
  
    // 행운이 보물상자 드롭 확률에 영향 (5레벨 이상일 때만)
    if (player.level >= 5) {
      const baseTreasure = 0.005;
      const treasureLuckBonus = Math.min(player.getTotalLuck() * 0.5, 2.0);
      const treasureChance = Math.min(baseTreasure * (1 + treasureLuckBonus), 0.02);
      
      if (!this.isBoss && Math.random() < treasureChance) {
        gameObjects.terrain.push(new Treasure(this.x, this.y));
      }
    }
    
    checkLevelUp();
  }

  die() {
    const index = gameObjects.enemies.indexOf(this);
    if (index !== -1) gameObjects.enemies.splice(index, 1);
  }

  // 이징 함수들
  easeOutBack(t) {
    const c1 = 2;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
  
  easeInQuad(t) {
    return t * t;
  }

  calculateSeparation() {
    let separationX = 0;
    let separationY = 0;
    let neighborCount = 0;
    
    const separationRadius = this.size * 2;
    const gridX = Math.floor(this.x / ENEMY_SPATIAL_GRID_SIZE);
    const gridY = Math.floor(this.y / ENEMY_SPATIAL_GRID_SIZE);
    
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${gridX + dx},${gridY + dy}`;
        const nearbyEnemies = enemySpatialGrid[key] || [];
        
        for (let enemy of nearbyEnemies) {
          if (enemy === this || enemy.state !== 'moving') continue;
          
          const distX = this.x - enemy.x;
          const distY = this.y - enemy.y;
          const distance = Math.sqrt(distX * distX + distY * distY) - enemy.size;
          
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

  pushPlayer(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.hypot(dx, dy);
    
    if (distance > 0) {
      const pushX = (dx / distance) * 2;
      const pushY = (dy / distance) * 2;
      
      player.x += pushX;
      player.y += pushY;
    }
  }
  
  attackPlayer(player) {
    const currentTime = gameTimeSystem.getTime();
    
    if (currentTime - this.lastAttackTime >= this.attackCooldown && !player.invincible) {
      // 회피율 확률 체크
      if (Math.random() < player.getTotalDodgeRate()) {
        // 회피 성공 - 무적 상태 활성화 및 시각적 효과
        this.lastAttackTime = currentTime; // 쿨다운은 적용
        
        // 회피 시에도 무적 상태 활성화
        player.invincible = true;
        player.invincibilityStartTime = currentTime;
        player.isDodging = true; // 회피 상태 표시
        
        console.log("공격을 회피했습니다!");
        return;
      }
      
      // 회피 실패 - 기존 공격 로직
      player.health -= this.attackStrength;
      this.lastAttackTime = currentTime;
      
      player.isHit = true;
      player.hitStartTime = currentTime;
      player.hitFrame = 0;
      player.hitFrameTime = 0;
      
      player.invincible = true;
      player.invincibilityStartTime = currentTime;
      player.isDodging = false; // 피격 상태
      
      const damageRatio = this.attackStrength / player.maxHealth;
      screenShakeTime = 400 + damageRatio * 2000;
      screenShakeIntensity = 5 + damageRatio * 10;
    }
  }
}

// 보스급 적 클래스 
class BossEnemy extends Enemy {
  constructor(x, y) {
    // 보스는 더 크고, 느리고, 체력이 많음
    super(x, y, 40, 0.3, 100, 20);
    this.type = "Boss";
    this.isBoss = true;
    this.expValue = 50;
    this.goldValue = 100;
    
    // 보스 전용 속성 추가
    this.attackRange = 200;
    this.specialAttackCooldown = 5000;
    this.lastSpecialAttack = 0;
  }
  
  // 보스 전용 메서드 오버라이드
  update() {
    super.update(); // 기본 업데이트 실행
    
    // 특수 공격 로직
    const currentTime = gameTimeSystem.getTime();
    if (this.state === 'moving' && 
        currentTime - this.lastSpecialAttack >= this.specialAttackCooldown) {
      this.specialAttack();
      this.lastSpecialAttack = currentTime;
    }
  }
  
  specialAttack() {
    // 원형으로 8방향 총알 발사
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      gameObjects.bullets.push(
        new EnemyBullet(this.x, this.y, 5, 3, angle, 15)
      );
    }
  }
  
  // 보스 시각적 효과 재정의
  drawMoving(drawX, drawY) {
    // 부모 클래스의 drawMoving 메서드를 호출하기 전에 크기를 조정
    const originalSize = this.size;
    this.size = this.originalSize * 1.5; // 보스는 1.5배 크기
    
    super.drawMoving(drawX, drawY);
    
    // 크기 복원
    this.size = originalSize;
  }
  
  // 죽었을 때 추가 보상
  startDying() {
    // 부모 클래스의 메서드 실행
    super.startDying();
    
    // 보스전 모드에서의 보스인 경우
    if (this.isBossModeEnemy && bossMode) {
      bossesKilled++;
      lastBossDeathPosition = { x: this.x, y: this.y };
      
      // 모든 보스를 처치했는지 확인
      if (bossesKilled >= totalBosses) {
        endBossMode();
      }
    } else {
      // 기존 로직 (일반 보스 보상)
      gameObjects.jewels.push(new Jewel(this.x, this.y, 4));
      
      for (let i = 0; i < 3; i++) {
        if (Math.random() < 0.7) {
          const jewelType = getWeightedRandomJewelType();
          gameObjects.jewels.push(new Jewel(
            this.x + (Math.random() * 30 - 15), 
            this.y + (Math.random() * 30 - 15),
            jewelType
          ));
        }
      }
      
      if (Math.random() < 0.25) {
        gameObjects.terrain.push(new Treasure(this.x, this.y));
      }
    }
  }
}


// 적이 발사하는 총알 클래스
class EnemyBullet extends Bullet {
  constructor(x, y, size, speed, angle, damage) {
    super(x, y, size * 2, speed, angle, damage);
    this.fromEnemy = true; // 적의 총알 표시
  }
  
  update() {
    // 아티팩트 효과로 인한 속도 감소 적용
    const effectiveSpeed = this.speed * (1 - (player.enemyBulletSlowdown || 0));
    
    this.x += Math.cos(this.angle) * effectiveSpeed;
    this.y += Math.sin(this.angle) * effectiveSpeed;
    
    // 플레이어와 충돌 체크
    if (detectCollision(this, player) && !player.invincible) {
      const currentTime = gameTimeSystem.getTime();
      
      // 회피율 확률 체크
      if (Math.random() < player.getTotalDodgeRate()) {
        // 회피 성공 - 무적 상태 활성화 및 시각적 효과
        this.used = true; // 총알은 소모됨
        
        // 회피 시에도 무적 상태 활성화
        player.invincible = true;
        player.invincibilityStartTime = currentTime;
        player.isDodging = true; // 회피 상태 표시
        
        console.log("총알을 회피했습니다!");
        return;
      }
      
      // 회피 실패 - 기존 피격 로직
      player.health -= this.damage;
      this.used = true;
      
      // 플레이어 피격 효과
      player.isHit = true;
      player.hitStartTime = currentTime;
      
      // 무적 상태 활성화
      player.invincible = true;
      player.invincibilityStartTime = currentTime;
      player.isDodging = false; // 피격 상태
      
      // 화면 흔들림 효과 (총알 피격 시는 약간 덜하게)
      const damageRatio = this.damage / player.maxHealth;
      screenShakeTime = 200 + damageRatio * 1000; // 근접 공격보다 약간 덜함
      screenShakeIntensity = 3 + damageRatio * 5;
    }
  }
  
  draw(offsetX, offsetY) {
    if (assetManager.loaded.enemies && assetManager.images.enemies.bullet) {
      const drawSize = this.size * 3; // 크기 조정
      
      ctx.save();
      ctx.translate(this.x + offsetX, this.y + offsetY);
      ctx.rotate(this.angle); // 탄환 이동 방향으로 회전
      
      // 탄환 이미지 그리기
      ctx.drawImage(
        assetManager.images.enemies.bullet,
        -drawSize / 2,
        -drawSize / 2,
        drawSize,
        drawSize
      );
      
      ctx.restore();
    }
  }
}

// 사망 이펙트 클래스
class DeathEffect {
  constructor(x, y, enemySize, enemyType) {
    this.x = x;
    this.y = y;
    this.enemySize = enemySize;
    this.enemyType = enemyType;
    this.used = false;
    
    // 애니메이션 속성
    this.startTime = gameTimeSystem.getTime();
    this.duration = 500; // 0.5초 지속
    this.maxSize = enemySize * 4; // 최대 크기
    this.currentSize = 0;
    
    // 링 효과
    this.ringSize = 0;
    this.maxRingSize = enemySize * 5;
    
    // 파티클 효과
    this.particles = [];
    this.createParticles();
    
    // 색상 효과 (적 타입별로 다른 색상)
    this.getEffectColor();
    
    // 펄스 효과
    this.pulseTime = 0;
  }
  
  createParticles() {
    const particleCount = Math.min(12 + Math.floor(this.enemySize / 4), 20);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.8;
      const speed = 3 + Math.random() * 4;
      const size = 3 + Math.random() * 4;
      
      this.particles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: size,
        maxSize: size,
        life: 1.0,
        decay: 0.015 + Math.random() * 0.015,
        angle: angle
      });
    }
  }
  
  getEffectColor() {
    switch(this.enemyType) {
      case 'Boss':
        this.primaryColor = '#FF4500'; // 주황색
        this.secondaryColor = '#FFD700'; // 금색
        this.accentColor = '#FF8C00'; // 진한 주황색
        break;
      case 'Fast':
        this.primaryColor = '#00FFFF'; // 청록색
        this.secondaryColor = '#FFFFFF'; // 흰색
        this.accentColor = '#87CEEB'; // 하늘색
        break;
      case 'Tank':
        this.primaryColor = '#FF0000'; // 빨간색
        this.secondaryColor = '#FF6666'; // 연한 빨간색
        this.accentColor = '#DC143C'; // 진한 빨간색
        break;
      case 'Shooter':
        this.primaryColor = '#FF00FF'; // 자홍색
        this.secondaryColor = '#FFAAFF'; // 연한 자홍색
        this.accentColor = '#DA70D6'; // 난초색
        break;
      default: // Normal
        this.primaryColor = '#FFFF00'; // 노란색
        this.secondaryColor = '#FFAA00'; // 주황색
        this.accentColor = '#FFA500'; // 진한 주황색
        break;
    }
  }
  
  update() {
    const currentTime = gameTimeSystem.getTime();
    const elapsed = currentTime - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);
    
    // 펄스 시간 업데이트
    this.pulseTime += 0.3;
    
    // 메인 폭발 크기 애니메이션 (빠르게 커졌다가 천천히 작아짐)
    if (progress < 0.2) {
      this.currentSize = this.maxSize * (progress / 0.2);
    } else if (progress < 0.6) {
      this.currentSize = this.maxSize;
    } else {
      this.currentSize = this.maxSize * (1 - ((progress - 0.6) / 0.4));
    }
    
    // 링 효과 애니메이션
    if (progress < 0.8) {
      this.ringSize = this.maxRingSize * (progress / 0.8);
    } else {
      this.ringSize = this.maxRingSize;
    }
    
    // 파티클 업데이트
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= particle.decay;
      particle.vx *= 0.96; // 감속
      particle.vy *= 0.96;
      
      // 파티클 크기 애니메이션
      if (particle.life > 0.7) {
        particle.size = particle.maxSize * ((1 - particle.life) / 0.3);
      } else {
        particle.size = particle.maxSize * (particle.life / 0.7);
      }
      
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
    
    // 효과 종료
    if (progress >= 1) {
      this.used = true;
    }
  }
  
  draw(offsetX, offsetY) {
    const drawX = this.x + offsetX;
    const drawY = this.y + offsetY;
    const currentTime = gameTimeSystem.getTime();
    const elapsed = currentTime - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);
    
    ctx.save();
    
    // 투명도 계산
    let alpha;
    if (progress < 0.1) {
      alpha = progress / 0.1; // 빠르게 나타남
    } else if (progress < 0.7) {
      alpha = 1.0; // 유지
    } else {
      alpha = 1 - ((progress - 0.7) / 0.3); // 천천히 사라짐
    }
    
    // 외부 링 효과
    if (this.ringSize > 0) {
      ctx.globalAlpha = alpha * 0.4;
      ctx.strokeStyle = this.accentColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(drawX, drawY, this.ringSize, 0, Math.PI * 2);
      ctx.stroke();
      
      // 내부 링
      ctx.globalAlpha = alpha * 0.6;
      ctx.strokeStyle = this.secondaryColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(drawX, drawY, this.ringSize * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // 메인 폭발 효과 (다층 그라디언트)
    if (this.currentSize > 0) {
      // 외부 글로우
      ctx.globalAlpha = alpha * 0.3;
      const outerGradient = ctx.createRadialGradient(
        drawX, drawY, 0,
        drawX, drawY, this.currentSize
      );
      outerGradient.addColorStop(0, this.primaryColor);
      outerGradient.addColorStop(0.4, this.secondaryColor);
      outerGradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = outerGradient;
      ctx.beginPath();
      ctx.arc(drawX, drawY, this.currentSize, 0, Math.PI * 2);
      ctx.fill();
      
      // 중간 층
      ctx.globalAlpha = alpha * 0.7;
      const midGradient = ctx.createRadialGradient(
        drawX, drawY, 0,
        drawX, drawY, this.currentSize * 0.6
      );
      midGradient.addColorStop(0, this.secondaryColor);
      midGradient.addColorStop(0.6, this.primaryColor);
      midGradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = midGradient;
      ctx.beginPath();
      ctx.arc(drawX, drawY, this.currentSize * 0.6, 0, Math.PI * 2);
      ctx.fill();
      
      // 중심 밝은 점 (펄스 효과)
      const pulseScale = 1 + Math.sin(this.pulseTime) * 0.3;
      ctx.globalAlpha = alpha * 0.9;
      const centerGradient = ctx.createRadialGradient(
        drawX, drawY, 0,
        drawX, drawY, this.currentSize * 0.3 * pulseScale
      );
      centerGradient.addColorStop(0, '#FFFFFF');
      centerGradient.addColorStop(0.5, this.secondaryColor);
      centerGradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = centerGradient;
      ctx.beginPath();
      ctx.arc(drawX, drawY, this.currentSize * 0.3 * pulseScale, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 파티클 그리기
    this.particles.forEach(particle => {
      const particleAlpha = particle.life * alpha;
      ctx.globalAlpha = particleAlpha;
      
      // 파티클 그라디언트
      const particleGradient = ctx.createRadialGradient(
        particle.x + offsetX, particle.y + offsetY, 0,
        particle.x + offsetX, particle.y + offsetY, particle.size
      );
      particleGradient.addColorStop(0, this.primaryColor);
      particleGradient.addColorStop(0.7, this.secondaryColor);
      particleGradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = particleGradient;
      ctx.beginPath();
      ctx.arc(
        particle.x + offsetX, 
        particle.y + offsetY, 
        particle.size, 
        0, Math.PI * 2
      );
      ctx.fill();
      
      // 파티클 중심 밝은 점
      ctx.globalAlpha = particleAlpha * 0.8;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(
        particle.x + offsetX, 
        particle.y + offsetY, 
        particle.size * 0.3, 
        0, Math.PI * 2
      );
      ctx.fill();
    });
    
    ctx.restore();
  }
  
  outOfBounds() {
    return this.used;
  }
}

//----------------------
// 아이템 클래스들
//----------------------

// 보석 가중치
const JEWEL_WEIGHTS = {
  SMALL: 100,    // 작은 보석 (타입 0)
  MEDIUM: 20,    // 중간 보석 (타입 1) 
  LARGE: 5,     // 큰 보석 (타입 2)
  MAGNET: 0.3,    // 자석 보석 (타입 3)
  HEALTH: 1     // 체력 보석 (타입 4)
};

// 보석 타입과 인덱스 매핑
const JEWEL_TYPES = {
  SMALL: 0,
  MEDIUM: 1,
  LARGE: 2,
  MAGNET: 3,
  HEALTH: 4
};

class Jewel extends GameObject {
  constructor(x, y, type = 0) {
    super(x, y, 4);
    this.type = type; // 0: 소, 1: 중, 2: 대, 3: 자석, 4: 체력
    this.collected = false;
    
    // 타입별 속성 설정
    switch(this.type) {
      case 0: // 소 jewel
        this.size = 5;
        this.expValue = 20;
        break;
      case 1: // 중 jewel
        this.size = 7;
        this.expValue = 50;
        break;
      case 2: // 대 jewel
        this.size = 10;
        this.expValue = 250;
        break;
      case 3: // 자석 jewel
        this.size = 10;
        this.expValue = 0;
        break;
      case 4: // 체력 jewel
        this.size = 10;
        this.expValue = 0;
        break;
    }
  }

  update() {    
    let magnetRange;
    if (player.magnetActive) {
      magnetRange = 1000; // 자석 효과 시 대폭 증가된 범위
    } else {
      magnetRange = player.getTotalPickupRadius(); // 평소엔 업그레이드 적용 범위
    }
    const pickupRange = 12.5; // 고정된 획득 범위
    
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 끌어당기기 (자석 범위 내에서)
    if (distance <= magnetRange && distance > pickupRange) {
      const angle = Math.atan2(dy, dx);
      
      // 거리에 따른 속도 조절 (가까울수록 빨라짐)
      const distanceRatio = Math.max(0, (magnetRange - distance) / magnetRange);
      const baseSpeed = player.magnetActive ? 4 : 2; // 자석 아이템 사용 시 더 빠름
      const maxSpeed = player.magnetActive ? 12 : 8;
      const currentSpeed = baseSpeed + (maxSpeed - baseSpeed) * distanceRatio;
      
      // 이동 적용
      this.x += Math.cos(angle) * currentSpeed;
      this.y += Math.sin(angle) * currentSpeed;
    }
  }

  draw(offsetX, offsetY) {
    if (assetManager.loaded.jewels && assetManager.images.jewels[this.type]) {
      const drawSize = this.size * 3 // 이미지 크기 조정
      ctx.drawImage(
        assetManager.images.jewels[this.type],
        0, 0,
        64, 64,
        this.x + offsetX - drawSize/2,
        this.y + offsetY - drawSize/2,
        drawSize,
        drawSize
      );
    }
  }

  // Jewel 클래스의 collect() 메서드
  collect() {
    if (this.collected) return;
    this.collected = true;
    
    switch(this.type) {
      case 0: // 소 jewel
      case 1: // 중 jewel
      case 2: // 대 jewel

        if (player.level < MAX_PLAYER_LEVEL) {
          const finalExpGained = Math.floor(this.expValue * player.getTotalExpMultiplier());
          player.exp += finalExpGained;
        }
        
        let goldValue = this.type + 5;
        goldValue = Math.floor(goldValue * player.getTotalGoldMultiplier());
        gold += goldValue;
        saveGold();
        break;
        
      case 3: // 자석 jewel
        const magnetExpGained = Math.floor(this.expValue * player.getTotalExpMultiplier());
        player.exp += magnetExpGained;
        
        let magnetGold = 10;
        magnetGold = Math.floor(magnetGold * player.getTotalGoldMultiplier());
        gold += magnetGold;
        
        player.magnetActive = true;
        player.magnetDuration = player.magnetMaxDuration;
        break;
        
      case 4: // 체력 jewel
        const healAmount = Math.floor(player.maxHealth * 0.3);
        player.health = Math.min(player.health + healAmount, player.maxHealth);
        
        // 총 골드 배율 적용
        let healthGold = 15;
        healthGold = Math.floor(healthGold * player.getTotalGoldMultiplier());
        gold += healthGold;
        break;
    }
    
    checkLevelUp();
  }
}

// 가중치 기반으로 보석 타입을 결정하는 함수
function getWeightedRandomJewelType() {
  // 5레벨 미만일 때는 대형 보석 제외
  const weights = { ...JEWEL_WEIGHTS };
  if (player.level < 5) {
    weights.LARGE = 0; // 대형 보석 가중치를 0으로 설정
  }
  
  // 총 가중치 계산
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  
  // 0부터 총 가중치 사이의 랜덤 값 생성
  let random = Math.random() * totalWeight;
  
  // 가중치에 따른 선택
  if ((random -= weights.SMALL) <= 0) {
    return JEWEL_TYPES.SMALL;
  }
  if ((random -= weights.MEDIUM) <= 0) {
    return JEWEL_TYPES.MEDIUM;
  }
  if ((random -= weights.LARGE) <= 0) {
    return JEWEL_TYPES.LARGE;
  }
  if ((random -= weights.HEALTH) <= 0) {
    return JEWEL_TYPES.HEALTH;
  }
  return JEWEL_TYPES.MAGNET;
}

class Treasure extends GameObject {
  constructor(x, y) {
    super(x, y, 16);
    this.collected = false;
    this.isTreasure = true;
  }

  update() {
    // 애니메이션 효과 없음
  }

  draw(offsetX, offsetY) {
    const drawX = this.x + offsetX;
    const drawY = this.y + offsetY;
    
    if (assetManager.loaded.treasure) {
      const imgSize = this.size * 2;
      ctx.drawImage(
        assetManager.images.treasure,
        drawX - imgSize/2,
        drawY - imgSize/2,
        imgSize,
        imgSize
      );
    } else {
      ctx.fillStyle = '#DAA520';
      ctx.fillRect(drawX - this.size/2, drawY - this.size/2, this.size, this.size);
    }
  }

  collect() {
    if (!this.collected) {
      this.collected = true;
      // 아티팩트 선택 화면
      currentGameState = GAME_STATE.LEVEL_UP;
      pauseStartTime = gameTimeSystem.getTime();
      previousGameState = GAME_STATE.PLAYING;
      generateArtifactOptions();
    }
  }
}

//----------------------
// 아티팩트 시스템
//----------------------

// 레어리티 정의
const ARTIFACT_RARITY = {
  COMMON: {
    name: '일반',
    color: '#9CA3AF',      // 회색
    bgColor: 'rgba(156, 163, 175, 0.3)',
    borderColor: '#9CA3AF',
    weight: 70
  },
  UNCOMMON: {
    name: '고급',
    color: '#10B981',      // 녹색
    bgColor: 'rgba(16, 185, 129, 0.3)',
    borderColor: '#10B981',
    weight: 20
  },
  RARE: {
    name: '희귀',
    color: '#3B82F6',      // 파란색
    bgColor: 'rgba(59, 130, 246, 0.3)',
    borderColor: '#3B82F6',
    weight: 8
  },
  EPIC: {
    name: '서사',
    color: '#8B5CF6',      // 보라색
    bgColor: 'rgba(139, 92, 246, 0.3)',
    borderColor: '#8B5CF6',
    weight: 1.5
  },
  LEGENDARY: {
    name: '전설',
    color: '#F59E0B',      // 주황색/금색
    bgColor: 'rgba(245, 158, 11, 0.3)',
    borderColor: '#F59E0B',
    weight: 0.5
  }
};

// 아티팩트 시스템 클래스
class ArtifactSystem {
  constructor() {
    this.artifacts = this.initializeArtifacts();
  }

  initializeArtifacts() {
    return [
      // === 커먼 아티팩트 (70%) ===
      {
        id: 'four_leaf_clover',
        name: '네잎클로버',
        description: '행운 +15%',
        flavorText: 'dd',
        rarity: ARTIFACT_RARITY.COMMON,
        iconId: 'four_leaf_clover',
        effects: [
          { type: 'luck', value: 0.15 }
        ]
      },
      {
        id: 'broccoli',
        name: '브로콜리',
        description: '최대 체력 +30',
        flavorText: 'dd',
        rarity: ARTIFACT_RARITY.COMMON,
        iconId: 'broccoli',
        effects: [
          { type: 'maxHealth', value: 30 }
        ]
      },
      {
        id: 'log',
        name: '통나무',
        description: '회피율 +8%',
        flavorText: 'dd',
        rarity: ARTIFACT_RARITY.COMMON,
        iconId: 'log',
        effects: [
          { type: 'dodgeRate', value: 0.08 }
        ]
      },
      {
        id: 'cardboard_box',
        name: '뒤집어진 종이상자',
        description: '회피율 +6%',
        flavorText: 'dd',
        rarity: ARTIFACT_RARITY.COMMON,
        iconId: 'cardboard_box',
        effects: [
          { type: 'dodgeRate', value: 0.06 }
        ]
      },
      {
        id: 'wax_wings',
        name: '밀랍칠한 날개',
        description: '이동속도 +0.8',
        flavorText: 'dd',
        rarity: ARTIFACT_RARITY.COMMON,
        iconId: 'wax_wings',
        effects: [
          { type: 'moveSpeed', value: 0.8 }
        ]
      },

      // === 언커먼 아티팩트 (20%) ===
      {
        id: 'fortune_today',
        name: '오늘의 운세(대길)',
        description: '행운 +25%',
        flavorText: 'dd',
        rarity: ARTIFACT_RARITY.UNCOMMON,
        iconId: 'fortune_today',
        effects: [
          { type: 'luck', value: 0.25 }
        ]
      },
      {
        id: 'dead_underwear',
        name: '망자의 속옷',
        description: '회피율 +12%',
        flavorText: 'dd',
        rarity: ARTIFACT_RARITY.UNCOMMON,
        iconId: 'dead_underwear',
        effects: [
          { type: 'dodgeRate', value: 0.12 }
        ]
      },
      {
        id: 'learning_device',
        name: '학습장치',
        description: '경험치 획득량 +20%',
        flavorText: 'dd',
        rarity: ARTIFACT_RARITY.UNCOMMON,
        iconId: 'learning_device',
        effects: [
          { type: 'expMultiplier', value: 0.20 }
        ]
      },
      {
        id: 'mustache',
        name: '콧수염',
        description: '공격력 +25%',
        flavorText: 'dd',
        rarity: ARTIFACT_RARITY.UNCOMMON,
        iconId: 'mustache',
        effects: [
          { type: 'attackPower', value: 0.25 }
        ]
      },
      {
        id: 'strong_attack',
        name: '강력한 공격',
        description: '공격력 +35%',
        flavorText: 'dd',
        rarity: ARTIFACT_RARITY.UNCOMMON,
        iconId: 'strong_attack',
        effects: [
          { type: 'attackPower', value: 0.35 }
        ]
      },
      {
        id: 'quick_hands',
        name: '빠른 손놀림',
        description: '쿨타임 -30%',
        flavorText: 'dd',
        rarity: ARTIFACT_RARITY.UNCOMMON,
        iconId: 'quick_hands',
        effects: [
          { type: 'cooldownReduction', value: 0.30 }
        ]
      },
      {
        id: 'swift_feet',
        name: '신속한 발걸음',
        description: '이동속도 +1.2',
        flavorText: 'dd',
        rarity: ARTIFACT_RARITY.UNCOMMON,
        iconId: 'swift_feet',
        effects: [
          { type: 'moveSpeed', value: 1.2 }
        ]
      },

      // === 레어 아티팩트 (8%) ===
      {
        id: 'cloak_and_dagger',
        name: '망토와 단검',
        description: '회피율 +18%',
        flavorText: 'dd',
        rarity: ARTIFACT_RARITY.RARE,
        iconId: 'cloak_and_dagger',
        effects: [
          { type: 'dodgeRate', value: 0.18 }
        ]
      },
      {
        id: 'bfg',
        name: 'BFG 크고 멋진 총',
        description: '공격력 +60%',
        flavorText: 'dd',
        rarity: ARTIFACT_RARITY.RARE,
        iconId: 'bfg',
        effects: [
          { type: 'attackPower', value: 0.60 }
        ]
      },
      {
        id: 'bullet_time',
        name: '불렛 타임',
        description: '적 투사체 속도 -70%',
        flavorText: 'dd',
        rarity: ARTIFACT_RARITY.RARE,
        iconId: 'bullet_time',
        effects: [
          { type: 'enemyBulletSlowdown', value: 0.70 }
        ]
      },
      {
        id: 'wanted_poster',
        name: '현상수배지',
        description: '보스에게 추가 데미지 +100%',
        flavorText: 'dd',
        rarity: ARTIFACT_RARITY.RARE,
        iconId: 'wanted_poster',
        effects: [
          { type: 'bossDamage', value: 1.00 }
        ]
      },
      {
        id: 'small_body',
        name: '작은 체구',
        description: '크기 -25%',
        flavorText: 'dd',
        rarity: ARTIFACT_RARITY.RARE,
        iconId: 'small_body',
        effects: [
          { type: 'reducePlayerSize', value: 0.25 }
        ]
      },
      {
        id: 'life_fountain',
        name: '생명의 샘',
        description: '초당 체력 2% 회복',
        flavorText: 'dd',
        rarity: ARTIFACT_RARITY.RARE,
        iconId: 'life_fountain',
        effects: [
          { type: 'healthRegen', value: 0.02 }
        ]
      },
      {
        id: 'enemy_slowdown',
        name: '적 둔화',
        description: '적 이동속도 -50%',
        flavorText: 'dd',
        rarity: ARTIFACT_RARITY.RARE,
        iconId: 'enemy_slowdown',
        effects: [
          { type: 'reduceEnemySpeed', value: 0.50 }
        ]
      },
      {
        id: 'enemy_weakness',
        name: '약화된 적',
        description: '적 체력 -25%',
        flavorText: 'dd',
        rarity: ARTIFACT_RARITY.RARE,
        iconId: 'enemy_weakness',
        effects: [
          { type: 'reduceEnemyHealth', value: 0.25 }
        ]
      },

      // === 에픽 아티팩트 (1.5%) ===
      {
        id: 'spice_melange',
        name: '스파이스 멜란지',
        description: '최대 체력 -20, 쿨타임 -40%',
        flavorText: 'dd',
        rarity: ARTIFACT_RARITY.EPIC,
        iconId: 'spice_melange',
        effects: [
          { type: 'maxHealth', value: -20 },
          { type: 'cooldownReduction', value: 0.40 }
        ]
      },

      // === 레전더리 아티팩트 (0.5%) ===
      {
        id: 'persona',
        name: '페르소나',
        description: '공격력 +80%, 쿨타임 -35%',
        flavorText: 'dd',
        rarity: ARTIFACT_RARITY.LEGENDARY,
        iconId: 'persona',
        effects: [
          { type: 'attackPower', value: 0.80 },
          { type: 'cooldownReduction', value: 0.35 }
        ]
      }
    ];
  }

  // 가중치 기반 아티팩트 선택
  selectRandomArtifacts(count = 4, excludeIds = []) {
    const availableArtifacts = this.artifacts.filter(artifact => 
      !excludeIds.includes(artifact.id));
    
    if (availableArtifacts.length === 0) return [];
    
    const selectedArtifacts = [];
    
    for (let i = 0; i < count; i++) {
      const artifact = this.selectByWeight(availableArtifacts, selectedArtifacts.map(a => a.id));
      if (artifact) {
        selectedArtifacts.push(artifact);
      } else {
        // 더 이상 선택할 아티팩트가 없으면 경험치 옵션 추가
        const xpGain = Math.floor((player.nextLevelExp) * 0.3);
        selectedArtifacts.push({
          id: 'exp_gain',
          name: '경험치 획득',
          description: `${xpGain} 경험치 획득`,
          flavorText: '지식과 경험을 얻는다.',
          rarity: ARTIFACT_RARITY.COMMON,
          iconId: 'exp_gain',
          effects: [{ type: 'expGain', value: xpGain }]
        });
      }
    }
    
    return selectedArtifacts;
  }

  selectByWeight(availableArtifacts, excludeIds) {
    const filteredArtifacts = availableArtifacts.filter(artifact => 
      !excludeIds.includes(artifact.id));
    
    if (filteredArtifacts.length === 0) return null;
    
    // 총 가중치 계산
    const totalWeight = filteredArtifacts.reduce((sum, artifact) => 
      sum + artifact.rarity.weight, 0);
    
    // 랜덤 선택
    let randomWeight = Math.random() * totalWeight;
    
    for (const artifact of filteredArtifacts) {
      randomWeight -= artifact.rarity.weight;
      if (randomWeight <= 0) {
        return artifact;
      }
    }
    
    return filteredArtifacts[0]; // 폴백
  }

  // 아티팩트 효과 적용
  applyArtifactEffects(artifactId) {
    // 경험치 획득 아티팩트 특별 처리
    if (artifactId === 'exp_gain') {
      const option = levelUpOptions.find(opt => opt.artifactId === 'exp_gain');
      if (option && option.effects) {
        option.effects.forEach(effect => {
          this.applyEffect(effect);
        });
      }
      return true;
    }
  
    const artifact = this.artifacts.find(a => a.id === artifactId);
    if (!artifact) return false;
  
    // 플레이어 획득 아티팩트 목록에 추가
    if (!player.acquiredArtifacts.includes(artifactId)) {
      player.acquiredArtifacts.push(artifactId);
    }
  
    // 효과 적용
    artifact.effects.forEach(effect => {
      this.applyEffect(effect);
    });
  
    return true;
  }

  applyEffect(effect) {
    switch(effect.type) {
      case 'attackPower':
        player.levelAttackBonus += effect.value;
        break;
      case 'maxHealth':
        const oldMaxHealth = player.maxHealth;
        player.levelMaxHealthBonus += effect.value;
        player.maxHealth = player.getTotalMaxHealth();
        // 체력 증가인 경우에만 현재 체력도 회복
        if (effect.value > 0) {
          player.health += (player.maxHealth - oldMaxHealth);
        } else {
          // 체력 감소인 경우 비율 유지
          const healthRatio = player.health / oldMaxHealth;
          player.health = Math.max(1, player.maxHealth * healthRatio);
        }
        break;
      case 'cooldownReduction':
        player.levelCooldownBonus += effect.value;
        player.weapons.forEach(weapon => {
          weapon.updateCooldown(player.getTotalCooldownReduction());
        });
        break;
      case 'moveSpeed':
        player.levelMoveSpeedBonus += effect.value;
        break;
      case 'dodgeRate':
        player.levelDodgeRateBonus += effect.value;
        break;
      case 'luck':
        player.levelLuckBonus += effect.value;
        break;
      case 'expMultiplier':
        player.levelExpMultiplierBonus += effect.value;
        break;
      case 'healthRegen':
        player.levelHealthRegenBonus += effect.value;
        break;
      case 'reducePlayerSize':
        player.size *= (1 - effect.value);
        break;
      case 'reduceEnemySpeed':
        player.enemySpeedReduction = Math.max(player.enemySpeedReduction, effect.value);
        break;
      case 'reduceEnemyHealth':
        player.enemyHealthReduction = Math.max(player.enemyHealthReduction, effect.value);
        break;
      case 'enemyBulletSlowdown':
        player.enemyBulletSlowdown = Math.max(player.enemyBulletSlowdown || 0, effect.value);
        break;
      case 'bossDamage':
        player.bossDamageBonus = (player.bossDamageBonus || 0) + effect.value;
        break;
      case 'expGain':
        if (player.level < MAX_PLAYER_LEVEL) {
          player.exp += effect.value;
        }
        break;
    }
  }

  // 아티팩트 정보 가져오기
  getArtifactById(id) {
    return this.artifacts.find(a => a.id === id);
  }

  // 보유 아티팩트 목록 가져오기
  getOwnedArtifacts() {
    return player.acquiredArtifacts.map(id => this.getArtifactById(id)).filter(Boolean);
  }
}

// 아티팩트 시스템 인스턴스 생성
const artifactSystem = new ArtifactSystem();

//----------------------
// 게임 관리 기능들
//----------------------

// 레벨업 시스템
const MAX_PLAYER_LEVEL = 100;

function checkLevelUp() {
  let leveledUp = false;

  // 최대 레벨 체크 추가
  if (player.level >= MAX_PLAYER_LEVEL) {
    return; // 최대 레벨이면 더 이상 레벨업 불가
  }
  
  while (player.exp >= player.nextLevelExp && player.level < MAX_PLAYER_LEVEL) {
    // 초과 경험치 계산
    const excessExp = player.exp - player.nextLevelExp;
    
    // 레벨업
    player.level += 1;
    leveledUp = true;
    
    // 이전 레벨 경험치 저장
    player.prevLevelExp = player.nextLevelExp;
    
    // 다음 레벨 경험치 계산
    if (player.level < MAX_PLAYER_LEVEL) {
      player.nextLevelExp = getXPForNextLevel(player.level);
    } else {
      // 최대 레벨 도달 시
      player.nextLevelExp = Infinity; // 다음 레벨 불가능
    }
    
    // 초과 경험치 유지
    player.exp = excessExp;
  }
  
  // 레벨업 화면 띄우기
  if (leveledUp && player.level < MAX_PLAYER_LEVEL) {
    isArtifactSelection = false;
    currentGameState = GAME_STATE.LEVEL_UP;
    pauseStartTime = gameTimeSystem.getTime();
    generateLevelUpOptions();
  }
}

// 레벨업 옵션 생성
function generateLevelUpOptions() {
  isArtifactSelection = false;
  
  // 일반 특성 업그레이드 옵션들
  const statUpgrades = [
    { 
      type: 'attackPower', 
      name: '공격력 증가', 
      baseValue: 0.1, // 레벨당 10% 증가
      description: function(currentLevel) {
        return `공격력 +${(this.baseValue * 100).toFixed(0)}%`;
      },
      flavorText: '공격력 증가'
    },
    { 
      type: 'cooldownReduction', 
      name: '쿨타임 감소', 
      baseValue: 0.05, // 레벨당 5% 감소
      description: function(currentLevel) {
        return `쿨타임 -${(this.baseValue * 100).toFixed(0)}%`;
      },
      flavorText: '쿨타임 감소'
    },
    { 
      type: 'maxHealth', 
      name: '최대 체력 증가', 
      baseValue: 15, // 레벨당 15 증가
      description: function(currentLevel) {
        return `최대 체력 +${this.baseValue}`;
      },
      flavorText: '최대 체력 증가'
    },
    { 
      type: 'moveSpeed', 
      name: '이동속도 증가', 
      baseValue: 0.1, // 레벨당 0.1 증가
      description: function(currentLevel) {
        return `이동속도 +${this.baseValue}`;
      },
      flavorText: '이동속도 증가'
    },
    { 
      type: 'attackRange', 
      name: '공격 범위 증가', 
      baseValue: 0.1, // 레벨당 10% 증가
      description: function(currentLevel) {
        return `공격 범위 +${(this.baseValue * 100).toFixed(0)}%`;
      },
      flavorText: '공격 범위 증가'
    },
    { 
      type: 'pickupRadius', 
      name: '아이템 획득 반경 증가', 
      baseValue: 7.5, // 레벨당 7.5 증가
      description: function(currentLevel) {
        return `아이템 획득 범위 +${this.baseValue}`;
      },
      flavorText: '아이템 획득 반경 증가'
    },
    { 
      type: 'dodgeRate', 
      name: '회피율 증가', 
      baseValue: 0.03, // 레벨당 3% 증가
      description: function(currentLevel) {
        return `회피율 +${(this.baseValue * 100).toFixed(0)}%`;
      },
      flavorText: '회피율 증가'
    },
    { 
      type: 'luck', 
      name: '행운 증가', 
      baseValue: 0.05, // 레벨당 5% 증가
      description: function(currentLevel) {
        return `행운 +${(this.baseValue * 100).toFixed(0)}%`;
      },
      flavorText: '행운 증가'
    },
    { 
      type: 'expMultiplier', 
      name: '경험치 획득률 증가', 
      baseValue: 0.05, // 레벨당 5% 증가
      description: function(currentLevel) {
        return `경험치 획득량 +${(this.baseValue * 100).toFixed(0)}%`;
      },
      flavorText: '경험치 획득률 증가'
    }
  ];
  
  // 새로운 무기 옵션들
  const newWeaponOptions = [
    { 
      type: 'weapon', 
      weaponType: 'wind', 
      name: '바람', 
      description: '바람 투사체 공격',
      flavorText: 'dd..'
    },
    { 
      type: 'weapon', 
      weaponType: 'earth',
      name: '회전 구체', 
      description: '플레이어 주변을 회전하며 공격',
      flavorText: 'dd..'
    },
    { 
      type: 'weapon', 
      weaponType: 'flame', 
      name: '화염방사기', 
      description: '넓은 범위의 지속 데미지',
      flavorText: 'dd..'
    },
    { 
      type: 'weapon', 
      weaponType: 'lightning', 
      name: '번개 사슬', 
      description: '적들 사이를 튀는 번개',
      flavorText: 'dd..'
    },
    { 
      type: 'weapon', 
      weaponType: 'fist', 
      name: '주먹', 
      description: '빠른 단일 대상 근접 공격',
      flavorText: 'dd..'
    },
    { 
      type: 'weapon', 
      weaponType: 'sword', 
      name: '검', 
      description: '부채꼴 범위 근접 공격',
      flavorText: 'dd..'
    },
    { 
      type: 'weapon', 
      weaponType: 'spear', 
      name: '창', 
      description: '긴 사거리 관통 공격',
      flavorText: 'dd..'
    }
  ];

  // 기존 무기 업그레이드 옵션들
  const weaponUpgradeOptions = [];
  const weaponFlavorTexts = {
    'wind': 'dd.',
    'earth': 'dd.',
    'flame': 'dd.',
    'lightning': 'dd.',
    'fist': 'dd.',
    'sword': 'dd.',
    'spear': 'dd.',
    'magnetic': 'dd.',
    'plasma': 'dd.',
    'inferno': 'dd.',
    'supernova': 'dd.',
    'lightningBolt': 'dd.',
    'poltergeist': 'dd.'
  };

  for (let weapon of player.weapons) {
    if (!weapon.isMaxLevel()) {
      const weaponName = getWeaponDisplayName(weapon.type);
      weaponUpgradeOptions.push({
        type: 'weaponUpgrade',
        weaponType: weapon.type,
        name: weaponName, // 레벨 텍스트 제거
        levelText: `Lv.${weapon.level + 1}`, // 레벨 텍스트를 별도로 저장
        description: `레벨 ${weapon.level} → ${weapon.level + 1}`,
        flavorText: weaponFlavorTexts[weapon.type] || '무기가 더욱 강력해진다.',
        weapon: weapon,
        currentLevel: weapon.level, // 현재 레벨 추가
        nextLevel: weapon.level + 1, // 다음 레벨 추가
        maxLevel: weapon.maxLevel // 최대 레벨 추가
      });
    }
  }

  // 사용 가능한 새 무기들 필터링 (이미 보유하지 않은 무기들)
  const playerWeaponTypes = player.weapons.map(w => w.type);
  const availableNewWeapons = newWeaponOptions.filter(weapon => 
    !playerWeaponTypes.includes(weapon.weaponType) && 
    !player.fusedWeapons.includes(weapon.weaponType) // 합성된 무기 제외
  );

  // 최대 레벨에 도달하지 않은 능력치만 필터링
  const availableStats = statUpgrades.filter(stat => 
    player.statLevels[stat.type] < player.maxStatLevel
  );

  // 모든 무기 옵션 합치기 (새 무기 + 무기 업그레이드)
  const allWeaponOptions = [...availableNewWeapons, ...weaponUpgradeOptions];

  // 행운에 따른 4번째 선택지 확률 계산
  const baseLevelUpOptions = 3;
  const fourthOptionChance = Math.min(player.getTotalLuck() * 0.5, 1.0); // 최대 100% 확률
  const shouldShowFourthOption = Math.random() < fourthOptionChance;
  const optionCount = shouldShowFourthOption ? 4 : 3;

  // 합성 가능한 무기 체크
  const fusionOptions = [];
  const maxLevelWeapons = player.weapons.filter(w => w.level === w.maxLevel);
  
  if (maxLevelWeapons.length >= 2) {
    // 모든 가능한 조합 체크
    for (let i = 0; i < maxLevelWeapons.length; i++) {
      for (let j = i + 1; j < maxLevelWeapons.length; j++) {
        const result = weaponFusionSystem.getFusionResult(
          maxLevelWeapons[i].type, 
          maxLevelWeapons[j].type
        );
        
        if (result && !player.weapons.some(w => w.type === result.result)) {
          fusionOptions.push({
            type: 'fusion',
            weaponType: result.result,
            name: result.name,
            description: result.description || `${getWeaponDisplayName(maxLevelWeapons[i].type)} + ${getWeaponDisplayName(maxLevelWeapons[j].type)} 합성`,
            flavorText: result.flavorText || '무기 합성하기...',
            isNew: true,
            weapon1: maxLevelWeapons[i],
            weapon2: maxLevelWeapons[j]
          });
        }
      }
    }
  }
  
  // 레벨업 옵션 생성 (확률 기반)
  levelUpOptions = [];
  
  for (let i = 0; i < optionCount; i++) {
    let selectedOption = null;

    // 합성 무기가 있으면 무조건 첫 번째 옵션으로
    if (i === 0 && fusionOptions.length > 0) {
      selectedOption = fusionOptions[0];
    }
    
    // 무기 업그레이드가 있는 경우, 50% 확률로 기존 무기 업그레이드 우선 선택
    if (weaponUpgradeOptions.length > 0 && Math.random() < 0.5) {
      // 기존 무기 업그레이드 선택 (이미 선택된 것 제외)
      const availableUpgrades = weaponUpgradeOptions.filter(upgrade => 
        !levelUpOptions.some(option => 
          option.type === 'weaponUpgrade' && option.weaponType === upgrade.weaponType
        )
      );
      
      if (availableUpgrades.length > 0) {
        selectedOption = availableUpgrades[Math.floor(Math.random() * availableUpgrades.length)];
      }
    }
    
    // 기존 무기 업그레이드를 선택하지 못했거나 70% 확률에 해당하는 경우
    if (!selectedOption) {
      // 60% 확률로 새 무기, 40% 확률로 특성
      if (Math.random() < 0.6 && availableNewWeapons.length > 0) {
        // 새 무기 선택 (이미 선택된 무기는 제외)
        const availableWeapons = availableNewWeapons.filter(weapon => 
          !levelUpOptions.some(option => 
            option.type === 'weapon' && option.weaponType === weapon.weaponType
          )
        );
        
        if (availableWeapons.length > 0) {
          selectedOption = availableWeapons[Math.floor(Math.random() * availableWeapons.length)];
        }
      }
      
      // 새 무기를 선택하지 못했으면 특성 선택
      if (!selectedOption && availableStats.length > 0) {
        // 특성 선택 (이미 선택된 특성은 제외)
        const availableStatOptions = availableStats.filter(stat => 
          !levelUpOptions.some(option => option.type === stat.type)
        );
        
        if (availableStatOptions.length > 0) {
          const randomStat = availableStatOptions[Math.floor(Math.random() * availableStatOptions.length)];
          const currentLevel = player.statLevels[randomStat.type];
          
          selectedOption = {
            type: randomStat.type,
            name: randomStat.name,
            levelText: `Lv.${currentLevel + 1}`,
            value: randomStat.baseValue,
            description: randomStat.description(currentLevel),
            flavorText: randomStat.flavorText,
            currentLevel: currentLevel,
            nextLevel: currentLevel + 1
          };
        }
      }
    }
    
    // 선택된 옵션이 있으면 추가
    if (selectedOption) {
      levelUpOptions.push(selectedOption);
    }
  }

  // 옵션이 부족한 경우 나머지 슬롯을 채우기
  while (levelUpOptions.length < optionCount) {
    // 남은 특성 옵션
    const remainingStats = availableStats.filter(stat => 
      !levelUpOptions.some(option => option.type === stat.type)
    );
    
    // 남은 무기 옵션
    const remainingWeapons = allWeaponOptions.filter(weapon => 
      !levelUpOptions.some(option => 
        (option.type === 'weapon' && option.weaponType === weapon.weaponType) ||
        (option.type === 'weaponUpgrade' && option.weaponType === weapon.weaponType)
      )
    );
    
    const allRemaining = [...remainingStats.map(stat => {
      const currentLevel = player.statLevels[stat.type];
      return {
        type: stat.type,
        name: `${stat.name} Lv.${currentLevel + 1}`,
        value: stat.baseValue,
        description: stat.description(currentLevel),
        flavorText: stat.flavorText,
        currentLevel: currentLevel,
        nextLevel: currentLevel + 1
      };
    }), ...remainingWeapons];
    
    if (allRemaining.length > 0) {
      const randomOption = allRemaining[Math.floor(Math.random() * allRemaining.length)];
      levelUpOptions.push(randomOption);
    } else {
      break; // 더 이상 선택할 옵션이 없음
    }
  }
  
  hoveredLevelUpOption = -1;
}

// 무기 표시 이름 헬퍼 함수
function getWeaponDisplayName(weaponType) {
  const names = {
    'wind': '바람',
    'earth': '대지',
    'flame': '화염',
    'lightning': '번개',
    'fist': '주먹',
    'sword': '검',
    'spear': '창',
    'magnetic': '자기장',
    'plasma': '플라즈마 레이저',
    'inferno': '인페르노',
    'supernova': '슈퍼노바',
    'lightningBolt': '질풍신뢰',
    'poltergeist': '폴터가이스트'
  };
  return names[weaponType] || weaponType;
}

// 아티팩트 옵션 생성
function generateArtifactOptions() {
  isArtifactSelection = true;
  
  // 이미 획득한 아티팩트 제외
  const excludeIds = player.acquiredArtifacts || [];
  
  // 행운에 따른 4번째 선택지 확률 계산
  const baseLevelUpOptions = 3;
  const fourthOptionChance = Math.min(player.getTotalLuck() * 0.5, 1.0);
  const shouldShowFourthOption = Math.random() < fourthOptionChance;
  const optionCount = shouldShowFourthOption ? 4 : 3;
  
  // 아티팩트 시스템에서 계산된 개수만큼 선택
  const selectedArtifacts = artifactSystem.selectRandomArtifacts(optionCount, excludeIds);
  
  // 선택된 아티팩트가 없는 경우 (모든 아티팩트 획득) 경험치 옵션으로 채우기
  if (selectedArtifacts.length === 0) {
    for (let i = 0; i < optionCount; i++) {
      const xpGain = Math.floor((player.nextLevelExp) * 0.3);
      selectedArtifacts.push({
        id: 'exp_gain',
        name: '경험치 획득',
        description: `${xpGain} 경험치 획득`,
        flavorText: '지식과 경험을 얻는다.',
        rarity: ARTIFACT_RARITY.COMMON,
        iconId: 'exp_gain',
        effects: [{ type: 'expGain', value: xpGain }]
      });
    }
  }
  
  // 레벨업 옵션으로 변환
  levelUpOptions = selectedArtifacts.map(artifact => ({
    type: 'artifact',
    artifactId: artifact.id,
    name: artifact.name,
    description: artifact.description,
    flavorText: artifact.flavorText,
    rarity: artifact.rarity,
    iconId: artifact.iconId,
    effects: artifact.effects
  }));
  
  hoveredLevelUpOption = -1;
}

// 레벨업 선택 적용
function applyLevelUpChoice(optionIndex) {
  console.log("Applying level up choice:", optionIndex);
  
  if (optionIndex === undefined || optionIndex === -1 || !levelUpOptions[optionIndex]) {
    console.log("Invalid option index:", optionIndex);
    return;
  }
  
  const option = levelUpOptions[optionIndex];
  console.log("Selected option:", option);

  if (option.type === 'fusion') {
    // 무기 합성 실행
    weaponFusionSystem.performFusion(option.weapon1, option.weapon2);
    
    // 게임 재개
    currentGameState = GAME_STATE.PLAYING;
    totalPausedTime += gameTimeSystem.getTime() - pauseStartTime;
    gameTimeSystem.resume();
    return;
  }

  if (option.type === 'artifact') {
    // 경험치 획득 아티팩트 특별 처리
    if (option.artifactId === 'exp_gain') {
      // 경험치 적용
      if (option.effects) {
        option.effects.forEach(effect => {
          if (effect.type === 'expGain') {
            player.exp += effect.value;
          }
        });
      }
      
      // 레벨업 체크 후 상태 결정
      let leveledUp = false;
      while (player.exp >= player.nextLevelExp) {
        // 초과 경험치 계산
        const excessExp = player.exp - player.nextLevelExp;
        
        // 레벨업
        player.level += 1;
        leveledUp = true;
        
        // 이전 레벨 경험치 저장
        player.prevLevelExp = player.nextLevelExp;
        
        // 다음 레벨 경험치 계산
        player.nextLevelExp = getXPForNextLevel(player.level);
        
        // 초과 경험치 유지
        player.exp = excessExp;
      }
      
      // 레벨업이 일어났으면 새로운 레벨업 화면 표시
      if (leveledUp) {
        isArtifactSelection = false;
        generateLevelUpOptions();
        // 게임 상태는 LEVEL_UP으로 유지
        return;
      }
    } else {
      // 일반 아티팩트 처리
      artifactSystem.applyArtifactEffects(option.artifactId);
    }
    
    currentGameState = GAME_STATE.PLAYING;
    totalPausedTime += gameTimeSystem.getTime() - pauseStartTime;
    gameTimeSystem.resume();
    return;
  } else if (option.type === 'weapon') {
    addWeapon(option.weaponType);
  } else if (option.type === 'weaponUpgrade') {
    const weapon = option.weapon;
    if (weapon && weapon.upgrade()) {
      console.log(`${option.weaponType} upgraded to level ${weapon.level}`);
    }
  } else {
    // 일반 레벨업 옵션 적용
    switch(option.type) {
      case 'attackPower':
        player.levelAttackBonus += option.value;
        player.statLevels.attackPower++;
        break;
        
      case 'maxHealth':
        player.levelMaxHealthBonus += option.value;
        const oldMaxHealth = player.maxHealth;
        player.maxHealth = player.getTotalMaxHealth();
        player.health += (player.maxHealth - oldMaxHealth); // 체력 회복
        player.statLevels.maxHealth++;
        break;
        
      case 'cooldownReduction':
        player.levelCooldownBonus += option.value;
        // 모든 무기의 쿨다운 업데이트
        player.weapons.forEach(weapon => {
          weapon.updateCooldown(player.getTotalCooldownReduction());
        });
        player.statLevels.cooldownReduction++;
        break;
        
      case 'moveSpeed':
        player.levelMoveSpeedBonus += option.value;
        player.statLevels.moveSpeed++;
        break;
        
      case 'attackRange':
        player.levelAttackRangeBonus += option.value;
        // 모든 무기의 범위 업데이트
        player.weapons.forEach(weapon => {
          if (weapon.updateRange) {
            weapon.updateRange();
          }
        });
        player.statLevels.attackRange++;
        break;
        
      case 'pickupRadius':
        player.levelPickupRadiusBonus += option.value;
        player.statLevels.pickupRadius++;
        break;
        
      case 'dodgeRate':
        player.levelDodgeRateBonus += option.value;
        player.statLevels.dodgeRate++;
        break;
        
      case 'luck':
        player.levelLuckBonus += option.value;
        player.statLevels.luck++;
        break;
        
      case 'expMultiplier':
        player.levelExpMultiplierBonus += option.value;
        player.statLevels.expMultiplier++;
        break;
        
      default:
        break;
    }
  }
  
  // 게임 재개
  console.log("Resuming game after level up choice");
  currentGameState = GAME_STATE.PLAYING;
  totalPausedTime += gameTimeSystem.getTime() - pauseStartTime;
  
  gameTimeSystem.resume();
}

// 무기 추가
function addWeapon(weaponType) {
  const weapon = WeaponFactory.createWeapon(weaponType);
  weapon.updateCooldown(player.getTotalCooldownReduction());
  
  // 공격 범위 특성 적용
  if (weapon.updateRange) {
    weapon.updateRange();
  }
  
  player.weapons.push(weapon);
}

//----------------------
// 게임 상태 관리
//----------------------

function startGame() {
  currentGameState = GAME_STATE.LOADING;
  loadingStartTime = gameTimeSystem.getTime();
  chunksLoaded = false;
  
  resetGame();
  
  // 게임 시계 초기화
  gameTimeSystem.init();
  
  gameStartTime = gameTimeSystem.getTime();
  totalPausedTime = 0;
  elapsedTime = 0;
  
  setTimeout(() => {
    generateChunksAroundPlayer();
    chunksLoaded = true;
  }, 10);
}

function pauseGame() {
  if (currentGameState === GAME_STATE.PLAYING || 
      currentGameState === GAME_STATE.LEVEL_UP) {
    previousGameState = currentGameState;
    currentGameState = GAME_STATE.PAUSED;
    selectedPauseOption = 0;
    pauseStartTime = gameTimeSystem.getTime();
    
    // 게임 시계 일시정지
    gameTimeSystem.pause();
  }
}

function resumeGame() {
  if (currentGameState === GAME_STATE.PAUSED && previousGameState !== null) {
    const pausedDuration = gameTimeSystem.getTime() - pauseStartTime;
    totalPausedTime += pausedDuration;
    
    // 게임 시계 재개
    gameTimeSystem.resume();
    
    currentGameState = previousGameState;
  }
}

function restartGame() {
  startGame();
}

// 영구 업그레이드 적용 함수
function applyPermanentUpgrades() {
  // 영구 업그레이드 불러오기
  permanentUpgrades.loadUpgrades();
  
  // 최대 체력 설정 (영구 업그레이드 반영)
  player.maxHealth = player.getTotalMaxHealth();
  player.health = player.maxHealth;
}

function resetGame() {
  // 영구 업그레이드 적용
  applyPermanentUpgrades();

  // 시작 골드 저장
  startingGold = loadGold();
  gold = startingGold;
  
  // 플레이어 위치 및 상태 초기화
  player.x = 0;
  player.y = 0;
  player.health = player.maxHealth;
  player.level = 0;
  player.exp = 0;
  player.nextLevelExp = 50;
  player.prevLevelExp = 0;
  
  // 모든 레벨업 보너스 초기화
  player.levelAttackBonus = 0;
  player.levelCooldownBonus = 0;
  player.levelAttackRangeBonus = 0;
  player.levelMoveSpeedBonus = 0;
  player.levelMaxHealthBonus = 0;
  player.levelPickupRadiusBonus = 0;
  player.levelDodgeRateBonus = 0;
  player.levelLuckBonus = 0;
  player.levelHealthRegenBonus = 0;
  player.levelGoldMultiplierBonus = 0;
  player.levelExpMultiplierBonus = 0;

  player.weapons = [];
  player.fusedWeapons = [];
  
  const flameWeapon = WeaponFactory.createWeapon('poltergeist');
  for (let i = 1; i < 10; i++) {
    flameWeapon.upgrade();
  }
  player.weapons.push(flameWeapon);

  const lightningWeapon = WeaponFactory.createWeapon('earth');
  for (let i = 1; i < 10; i++) {
    lightningWeapon.upgrade();
  }
  player.weapons.push(lightningWeapon);

  // 능력치 레벨 초기화
  for (let stat in player.statLevels) {
    player.statLevels[stat] = 0;
  }

  // 무적 상태 초기화
  player.invincible = false;
  player.invincibilityStartTime = 0;
  
  // 아티팩트 초기화
  player.acquiredArtifacts = [];
  player.size = 7.5;
  player.enemySpeedReduction = 0;
  player.enemyHealthReduction = 0;
  player.enemyBulletSlowdown = 0;
  player.bossDamageBonus = 0;

  // 게임 오브젝트 초기화
  gameObjects.bullets = [];
  gameObjects.enemies = [];
  gameObjects.jewels = [];
  gameObjects.terrain = [];
  gameObjects.chunks = {};
  gold = loadGold();

  // 애니메이션 초기화
  player.animationState = 'idle';
  player.currentFrame = 0;
  player.frameTime = 0;
  player.isHit = false;
  player.hitStartTime = 0;
  player.hitFrame = 0;
  player.hitFrameTime = 0;
  player.direction = 'left';
  
  // 시간 초기화
  elapsedTime = 0;
  totalPausedTime = 0;
  
  // 게임 효과 변수 초기화
  lastEnemySpawnTime = gameTimeSystem.getTime();
  screenShakeTime = 0;
  screenShakeIntensity = 0;
  
  // 보스전 관련 변수 초기화
  bossMode = false;
  bossCage = null;
  bossesKilled = 0;
  totalBosses = 3;
  lastBossDeathPosition = null;
  bossStartTime = 0;
  bossWarningActive = false;
  bossWarningStartTime = 0;
  
  // 스폰 시스템 상태 리셋
  spawnState.nextBossTime = 180;
  spawnState.bossWarningActive = false;
  spawnState.currentPhase = 'normal';
  spawnState.waveStartTime = 0;
  spawnState.currentWaveIndex = 0;
  spawnState.spawnTimer = 0;
  spawnState.difficultyLevel = 1;
  spawnState.enemiesThisWave = 0;

  // 킬 카운트 초기화
  totalKills = 0;
  
  // 자석 효과 초기화
  player.magnetActive = false;
  player.magnetDuration = 0;
}

// 사용자 생성 프롬프트
function showCreateUserPrompt() {
  // 게임 내 입력 화면으로 전환
  newUsername = '';
  currentGameState = GAME_STATE.CREATE_USER;
  showCreateUserError = false;
  inputCursorBlink = 0;
  
  // 히든 입력 필드 초기화 및 포커스
  hiddenInput.value = '';
  setTimeout(() => {
    hiddenInput.focus();
    isFocusedOnInput = true;
  }, 100);
}

//----------------------
// 게임 렌더링 함수들
//----------------------

function drawLevelUpScreen() {
  // 배경
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 제목
  ctx.fillStyle = isArtifactSelection ? '#FFD700' : '#66fcf1';
  ctx.font = '36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(
    isArtifactSelection ? '아티팩트 발견!' : 'LEVEL UP!', 
    canvas.width / 2, 50
  );
  
  // 부제목
  if (!isArtifactSelection) {
    ctx.fillStyle = '#ffff00';
    ctx.font = '24px Arial';
    ctx.fillText(`LEVEL ${player.level}`, canvas.width / 2, canvas.height - 40);
  }
  
  // 중앙 위치 및 박스 크기 - 세로로 거의 화면에 꽉 차게
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const verticalMargin = 80; // 상단과 하단 여백
  const boxHeight = canvas.height - verticalMargin * 2; // 세로로 화면에 거의 꽉 차게
  const boxWidth = 180; // 너비는 좀 더 좁게 설정
  
  // 호버된 옵션 확인 변수
  let hoveredOption = -1;
  
  // 옵션 위치 계산 및 마우스 호버 검사
  // 간격 조정
  const spacing = 15;
  const optionCount = levelUpOptions.length;
  const totalWidth = (boxWidth * optionCount) + (spacing * (optionCount - 1));
  const startX = centerX - totalWidth / 2;
  
  // 각 옵션 박스 그리기
  for (let i = 0; i < optionCount; i++) {
    if (levelUpOptions[i]) {
      const optionX = startX + (boxWidth + spacing) * i;
      const optionY = verticalMargin; // 상단에 붙임
      
      if (mouseX >= optionX && mouseX <= optionX + boxWidth &&
          mouseY >= optionY && mouseY <= optionY + boxHeight) {
        hoveredOption = i;
      }
      
      drawOptionBox(optionX, optionY, boxWidth, boxHeight, 
                   levelUpOptions[i], hoveredOption === i);
    }
  }
  
  // 선택된 옵션 저장 (클릭 처리를 위해)
  if (hoveredOption !== -1) {
    hoveredLevelUpOption = hoveredOption;
  } else {
    hoveredLevelUpOption = -1;
  }
}

function drawOptionBox(x, y, width, height, option, isHovered) {
  // 레어리티에 따른 색상 설정
  let bgColor, borderColor, textColor;
  
  if (option.rarity) {
    // 아티팩트인 경우
    bgColor = isHovered ? 
      option.rarity.bgColor.replace('0.3', '0.6') : 
      option.rarity.bgColor;
    borderColor = option.rarity.borderColor;
    textColor = isHovered ? '#FFFFFF' : option.rarity.color;
  } else if (option.type === 'fusion' || (option.type === 'weaponUpgrade' && 
            weaponFusionSystem.recipes.some(recipe => recipe.result === option.weaponType))) {
    // 합성 무기인 경우 또는 합성 무기 레벨업인 경우 - 짙은 붉은색 계열로 변경
    bgColor = isHovered ? 'rgba(139, 0, 0, 0.7)' : 'rgba(80, 0, 0, 0.5)';
    borderColor = isHovered ? '#FF6B6B' : '#8B0000';
    textColor = isHovered ? '#FFFFFF' : '#FFB3B3';
  } else if (option.type === 'weapon' || option.type === 'weaponUpgrade') {
    // 일반 무기인 경우 - 청록색 계열
    bgColor = isHovered ? 'rgba(69, 162, 158, 0.5)' : 'rgba(31, 40, 51, 0.5)';
    borderColor = isHovered ? '#66fcf1' : '#45a29e';
    textColor = isHovered ? '#FFFFFF' : '#ffffff';
  } else {
    // 일반 능력치 옵션인 경우 - 로얄 블루 계열
    bgColor = isHovered ? 'rgba(5, 160, 255, 0.5)' : 'rgba(65, 105, 225, 0.5)';
    borderColor = isHovered ? '#B2FFFF' : '#1E90FF';
    textColor = isHovered ? '#FFFFFF' : '#ffffff';
  }
  
  // 박스 배경
  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y, width, height);
  
  // 박스 테두리
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = isHovered ? 3 : 2;
  ctx.strokeRect(x, y, width, height);

  // 특별 효과 추가 (새 무기, 무기 업그레이드, 아티팩트인 경우)
  if (option.type === 'weapon' || option.type === 'weaponUpgrade' || option.type === 'fusion' || option.rarity || 
      (option.currentLevel !== undefined && option.type !== 'weaponUpgrade')) {
    // 내부 글로우 효과
    ctx.save();
    
    // 아티팩트의 경우 레어리티에 따라 글로우 강도 조절
    let glowAlpha = 0.3;
    let glowColor = borderColor;

    if (option.type === 'fusion' || (option.type === 'weaponUpgrade' && 
            weaponFusionSystem.recipes.some(recipe => recipe.result === option.weaponType))) {
      glowAlpha = 0.5;
      glowColor = '#DC143C'; // 크림슨 색상
    } else if (option.rarity) {
      // 레어리티별 글로우 강도
      switch(option.rarity) {
        case ARTIFACT_RARITY.LEGENDARY:
          glowAlpha = 0.5;
          break;
        case ARTIFACT_RARITY.EPIC:
          glowAlpha = 0.4;
          break;
        case ARTIFACT_RARITY.RARE:
          glowAlpha = 0.35;
          break;
        case ARTIFACT_RARITY.UNCOMMON:
          glowAlpha = 0.3;
          break;
        default: // COMMON
          glowAlpha = 0.25;
          break;
      }
    }
    
    ctx.globalAlpha = glowAlpha;
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, glowColor);
    gradient.addColorStop(0.5, 'transparent');
    gradient.addColorStop(1, glowColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
    ctx.restore();
  }
  
  // 레어리티 표시 (아티팩트인 경우 상단에 표시)
  let iconY = y + 40; // 기본 아이콘 Y 위치
  if (option.rarity) {
    ctx.fillStyle = option.rarity.color;
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(option.rarity.name, x + width/2, y + 20);
    iconY = y + 50; // 레어리티가 있으면 아이콘 위치를 아래로
  }
  
  // 아이콘 위치 및 크기
  const iconSize = 64;
  const iconX = x + (width - iconSize) / 2;
  
  // 아이콘 그리기
  if (option.iconId && assetManager.loaded.artifactIcons && 
      assetManager.images.artifactIcons[option.iconId]) {
    // 아티팩트 아이콘
    ctx.drawImage(
      assetManager.images.artifactIcons[option.iconId], 
      iconX, iconY, iconSize, iconSize
    );
  } else if (option.type === 'weapon' || option.type === 'weaponUpgrade' || option.type === 'fusion') {
    // 무기 아이콘
    if (assetManager.loaded.weaponIcons && 
        assetManager.images.weaponIcons[option.weaponType]) {
      ctx.drawImage(assetManager.images.weaponIcons[option.weaponType], 
                   iconX, iconY, iconSize, iconSize);
    }
  } else {
    // 능력치 아이콘
    if (assetManager.loaded.levelUpIcons && 
        assetManager.images.levelUpIcons[option.type]) {
      ctx.drawImage(assetManager.images.levelUpIcons[option.type], 
                   iconX, iconY, iconSize, iconSize);
    }
  }
  
  // 텍스트 시작 위치
  const textStartY = iconY + iconSize + 30;
  
  // 이름 그리기
  ctx.fillStyle = textColor;
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';

  // 무기 합성인 경우
  if (option.isNew) {
    ctx.fillStyle = '#FFD700';
    ctx.fillText('NEW!', x + width/2, textStartY - 20);
    ctx.fillStyle = textColor;
  }
  
  // 레벨이 있는 옵션인 경우 (능력치 또는 무기 업그레이드)
  if (option.currentLevel !== undefined && option.nextLevel !== undefined) {
    // 이름 (레벨 제외)
    ctx.fillText(option.name, x + width/2, textStartY);
    
    // 레벨 텍스트를 다음 줄에 표시
    ctx.font = 'bold 16px Arial';
    
    // 레벨이 0이면 NEW! 표시
    if (option.currentLevel === 0) {
      ctx.fillStyle = '#FFD700'; // 골드색
      ctx.fillText('NEW!', x + width/2, textStartY + 20);
    } else {
      ctx.fillStyle = isHovered ? '#66fcf1' : '#45a29e';
      ctx.fillText(`Lv.${option.nextLevel}`, x + width/2, textStartY + 20);
    }
    
    // 레벨 진행 바 그리기
    const barWidth = width - 40;
    const barHeight = 8;
    const barX = x + 20;
    const barY = textStartY + 35;
    
    // 배경 바
    ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // 진행도 바
    const maxLevel = option.maxLevel || player.maxStatLevel; // 무기는 maxLevel, 능력치는 player.maxStatLevel
    const progress = option.currentLevel / maxLevel;
    ctx.fillStyle = isHovered ? '#66fcf1' : '#45a29e';
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    
    // 진행 바 테두리
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // 레벨 텍스트 (X/Y)
    ctx.fillStyle = isHovered ? textColor : '#c5c6c7';
    ctx.font = '12px Arial';
    ctx.fillText(`${option.currentLevel} / ${maxLevel}`, x + width/2, barY + 20);
    
    // 설명 텍스트
    ctx.fillStyle = isHovered ? textColor : '#c5c6c7';
    ctx.font = '14px Arial';
    
    // 설명 위치 조정
    let currentY = barY + 40;
    
    // 설명 (효과) - 줄바꿈 처리
    const maxLineWidth = width - 20;
    const words = option.description.split(' ');
    let line = '';
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxLineWidth && i > 0) {
        ctx.fillText(line, x + width/2, currentY);
        line = words[i] + ' ';
        currentY += 18;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x + width/2, currentY);
    currentY += 18;
    
    // 플레이버 텍스트
    if (option.flavorText) {
      ctx.fillStyle = isHovered ? '#FFD700' : '#D4AF37';
      ctx.font = 'italic 12px Arial';
      
      currentY += 5;
      const flavorWords = option.flavorText.split(' ');
      line = '';
      
      for (let i = 0; i < flavorWords.length; i++) {
        const testLine = line + flavorWords[i] + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxLineWidth && i > 0) {
          ctx.fillText(line, x + width/2, currentY);
          line = flavorWords[i] + ' ';
          currentY += 16;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x + width/2, currentY);
    }
  } else {
    // 새 무기나 아티팩트인 경우 (레벨 바 없음)
    ctx.fillText(option.name, x + width/2, textStartY);

    if (option.type === 'weapon') {
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#FFD700';
      ctx.fillText('NEW!', x + width/2, textStartY + 20);
      currentY = textStartY + 40; // NEW! 아래로 설명 위치 조정
    } else {
      currentY = textStartY + 20; // 아티팩트는 기존대로
    }
    
    // 설명
    ctx.fillStyle = isHovered ? textColor : '#c5c6c7';
    ctx.font = '14px Arial';
    
    // 설명 텍스트 그리기 (줄바꿈 처리)
    const maxLineWidth = width - 20;
    
    // 설명 (효과)
    const words = option.description.split(' ');
    let line = '';
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxLineWidth && i > 0) {
        ctx.fillText(line, x + width/2, currentY);
        line = words[i] + ' ';
        currentY += 18;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x + width/2, currentY);
    currentY += 18;
    
    // 플레이버 텍스트 (있는 경우만)
    if (option.flavorText) {
      ctx.fillStyle = isHovered ? '#FFD700' : '#D4AF37';
      ctx.font = 'italic 12px Arial';
      
      currentY += 5;
      const flavorWords = option.flavorText.split(' ');
      line = '';
      
      for (let i = 0; i < flavorWords.length; i++) {
        const testLine = line + flavorWords[i] + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxLineWidth && i > 0) {
          ctx.fillText(line, x + width/2, currentY);
          line = flavorWords[i] + ' ';
          currentY += 16;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x + width/2, currentY);
    }
  }
}

function drawPauseScreen() {
  // 배경이 어두워짐
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';
  
  // 마우스에 기반한 hover 효과
  const buttonX = canvas.width / 2 - 75;
  const resumeButtonY = canvas.height / 2 - 20;
  const menuButtonY = canvas.height / 2 + 30;
  const buttonWidth = 150;
  const buttonHeight = 40;
  
  // 마우스가 버튼 위에 있는지 확인
  const isResumeHovered = mouseX >= buttonX && mouseX <= buttonX + buttonWidth &&
                           mouseY >= resumeButtonY && mouseY <= resumeButtonY + buttonHeight;
  const isMenuHovered = mouseX >= buttonX && mouseX <= buttonX + buttonWidth &&
                         mouseY >= menuButtonY && mouseY <= menuButtonY + buttonHeight;
  
  // 재개 버튼 그리기
  ctx.fillStyle = isResumeHovered ? '#66fcf1' : '#45a29e';
  ctx.fillRect(buttonX, resumeButtonY, buttonWidth, buttonHeight);
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(buttonX, resumeButtonY, buttonWidth, buttonHeight);
  
  // 버튼 텍스트 폰트 크기 설정
  ctx.font = '18px Arial'; // 기존보다 작게 설정 (원하는 크기로 조정 가능)
  ctx.fillStyle = isResumeHovered ? '#0b0c10' : '#ffffff';
  ctx.fillText('RESUME', canvas.width / 2, resumeButtonY + buttonHeight/2 + 5);
  
  // 메인 메뉴 버튼 그리기
  ctx.fillStyle = isMenuHovered ? '#66fcf1' : '#45a29e';
  ctx.fillRect(buttonX, menuButtonY, buttonWidth, buttonHeight);
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(buttonX, menuButtonY, buttonWidth, buttonHeight);
  ctx.fillStyle = isMenuHovered ? '#0b0c10' : '#ffffff';
  ctx.fillText('MAIN MENU', canvas.width / 2, menuButtonY + buttonHeight/2 + 5);
}

function drawConfirmDialog() {
  // 배경
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 대화상자 배경
  ctx.fillStyle = 'rgba(50, 50, 50, 0.9)';
  const dialogWidth = 500;
  const dialogHeight = 200;
  const dialogX = (canvas.width - dialogWidth) / 2;
  const dialogY = (canvas.height - dialogHeight) / 2;
  
  ctx.fillRect(dialogX, dialogY, dialogWidth, dialogHeight);
  
  // 테두리
  ctx.strokeStyle = '#66fcf1';
  ctx.lineWidth = 2;
  ctx.strokeRect(dialogX, dialogY, dialogWidth, dialogHeight);
  
  // 메시지
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  
  if (confirmDialogType === "exit_to_menu") {
    ctx.fillText('게임을 포기하고 나가겠습니까?', canvas.width / 2, dialogY + 70);
  }
  
  // 버튼
  const buttonY = dialogY + 130;
  const buttonSpacing = 150;
  
  // 마우스에 기반한 hover 효과
  const buttonWidth = 100;
  const buttonHeight = 40;
  const yesButtonX = canvas.width / 2 - buttonSpacing / 2 - buttonWidth / 2;
  const noButtonX = canvas.width / 2 + buttonSpacing / 2 - buttonWidth / 2;
  const buttonsY = buttonY - 20;
  
  // 마우스가 버튼 위에 있는지 확인
  const isYesHovered = mouseX >= yesButtonX && mouseX <= yesButtonX + buttonWidth &&
                       mouseY >= buttonsY && mouseY <= buttonsY + buttonHeight;
  const isNoHovered = mouseX >= noButtonX && mouseX <= noButtonX + buttonWidth &&
                     mouseY >= buttonsY && mouseY <= buttonsY + buttonHeight;
  
  // 확인 버튼 그리기
  ctx.fillStyle = isYesHovered ? '#66fcf1' : '#45a29e';
  ctx.fillRect(yesButtonX, buttonsY, buttonWidth, buttonHeight);
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(yesButtonX, buttonsY, buttonWidth, buttonHeight);
  ctx.fillStyle = isYesHovered ? '#0b0c10' : '#ffffff';
  ctx.fillText('확인', canvas.width / 2 - buttonSpacing / 2, buttonY);
  
  // 취소 버튼 그리기
  ctx.fillStyle = isNoHovered ? '#66fcf1' : '#45a29e';
  ctx.fillRect(noButtonX, buttonsY, buttonWidth, buttonHeight);
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(noButtonX, buttonsY, buttonWidth, buttonHeight);
  ctx.fillStyle = isNoHovered ? '#0b0c10' : '#ffffff';
  ctx.fillText('취소', canvas.width / 2 + buttonSpacing / 2, buttonY);
}

function drawProfileSelectScreen() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 제목
  ctx.fillStyle = '#55AAFF';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('뱀파이어 서바이벌', canvas.width / 2, 80);
  
  // 안내 메시지
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '24px Arial';
  ctx.fillText('계속하려면 사용자 프로필을 선택하세요', canvas.width / 2, 130);
  
  // 현재 사용자 표시
  if (userProfileSystem.hasCurrentUser()) {
    ctx.fillStyle = '#FFFF00';
    ctx.fillText(`현재 사용자: ${userProfileSystem.currentUser}`, canvas.width / 2, 170);
    
    // 골드 표시
    ctx.fillStyle = '#66fcf1';
    ctx.fillText(`보유 골드: ${loadGold()}`, canvas.width / 2, 200);
  }
  
  // 왼쪽: 사용자 목록 박스
  const listX = 100; // 왼쪽으로 이동
  const listY = 230;
  const listWidth = 350; // 약간 줄임
  const listHeight = 300; // 높이 조정
  const itemHeight = 25; // 더 작게
  
  // 배경
  ctx.fillStyle = 'rgba(30, 30, 40, 0.8)';
  ctx.fillRect(listX, listY, listWidth, listHeight);
  
  // 테두리
  ctx.strokeStyle = '#45a29e';
  ctx.lineWidth = 2;
  ctx.strokeRect(listX, listY, listWidth, listHeight);
  
  // 사용자 목록
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.font = '16px Arial'; // 더 작은 폰트
  
  if (userProfileSystem.users.length === 0) {
    ctx.textAlign = 'center';
    ctx.fillText('사용자가 없습니다.', listX + listWidth/2, listY + listHeight/2 - 10);
    ctx.fillText('새 사용자를 만드세요.', listX + listWidth/2, listY + listHeight/2 + 10);
    ctx.textAlign = 'left';
  } else {
    for (let i = 0; i < userProfileSystem.users.length; i++) {
      const username = userProfileSystem.users[i];
      const isSelected = username === userProfileSystem.currentUser;
      
      // 선택된 사용자 강조
      if (isSelected) {
        ctx.fillStyle = 'rgba(102, 252, 241, 0.3)';
        ctx.fillRect(listX, listY + i * itemHeight, listWidth, itemHeight);
        ctx.fillStyle = '#66fcf1';
      } else {
        ctx.fillStyle = '#FFFFFF';
      }
      
      ctx.fillText(username, listX + 15, listY + i * itemHeight + 17);
    }
  }
  
  // 오른쪽: 버튼들
  const buttonAreaX = listX + listWidth + 50; // 프로필 박스 오른쪽
  const buttonWidth = 200;
  const buttonHeight = 50;
  const buttonSpacing = 20;
  
  let currentButtonY = listY; // 프로필 박스와 같은 높이에서 시작
  
  // 새 사용자 버튼
  drawButton(buttonAreaX, currentButtonY, buttonWidth, buttonHeight, '새 사용자', true);
  currentButtonY += buttonHeight + buttonSpacing;
  
  // 사용자 삭제 버튼 (선택된 사용자가 있을 때만 활성화)
  drawButton(buttonAreaX, currentButtonY, buttonWidth, buttonHeight, '사용자 삭제', 
             userProfileSystem.hasCurrentUser());
  currentButtonY += buttonHeight + buttonSpacing;
  
  // 시작하기 버튼 - 현재 사용자가 선택된 경우에만 활성화
  if (userProfileSystem.hasCurrentUser()) {
    drawButton(buttonAreaX, currentButtonY, buttonWidth, buttonHeight, '게임 시작', true);
  }
}

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
  
  // 로딩 진행 표시
  const elapsedTime = gameTimeSystem.getTime() - loadingStartTime;
  const progress = Math.min(elapsedTime / loadingMinDuration, 1);
  
  ctx.fillStyle = '#66fcf1';
  ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2 + 20, 200 * progress, 20);
}

function handleProfileSelectClick() {
  // 왼쪽: 사용자 목록 영역 클릭 처리
  const listX = 100;
  const listY = 230;
  const listWidth = 350;
  const listHeight = 300;
  const itemHeight = 25;
  
  // 사용자 목록에서 선택
  if (mouseX >= listX && mouseX <= listX + listWidth && 
      mouseY >= listY && mouseY <= listY + listHeight) {
    const clickedIndex = Math.floor((mouseY - listY) / itemHeight);
    if (clickedIndex >= 0 && clickedIndex < userProfileSystem.users.length) {
      userProfileSystem.selectUser(userProfileSystem.users[clickedIndex]);
      return;
    }
  }
  
  // 오른쪽: 버튼 클릭 처리
  const buttonAreaX = listX + listWidth + 50;
  const buttonWidth = 200;
  const buttonHeight = 50;
  const buttonSpacing = 20;
  
  let currentButtonY = listY;
  
  // 새 사용자 버튼
  if (mouseX >= buttonAreaX && mouseX <= buttonAreaX + buttonWidth &&
      mouseY >= currentButtonY && mouseY <= currentButtonY + buttonHeight) {
    showCreateUserPrompt();
    return;
  }
  currentButtonY += buttonHeight + buttonSpacing;
  
  // 사용자 삭제 버튼
  if (mouseX >= buttonAreaX && mouseX <= buttonAreaX + buttonWidth &&
      mouseY >= currentButtonY && mouseY <= currentButtonY + buttonHeight &&
      userProfileSystem.hasCurrentUser()) {
    confirmDeleteUser();
    return;
  }
  currentButtonY += buttonHeight + buttonSpacing;
  
  // 게임 시작 버튼 - 사용자가 선택된 경우에만
  if (userProfileSystem.hasCurrentUser()) {
    if (mouseX >= buttonAreaX && mouseX <= buttonAreaX + buttonWidth &&
        mouseY >= currentButtonY && mouseY <= currentButtonY + buttonHeight) {
      // 사용자가 선택되면 시작 화면으로 전환
      currentGameState = GAME_STATE.START_SCREEN;
      return;
    }
  }
}

// 사용자 삭제 확인
function confirmDeleteUser() {
  if (userProfileSystem.currentUser) {
    if (confirm(`${userProfileSystem.currentUser} 사용자를 삭제하시겠습니까?`)) {
      userProfileSystem.deleteUser(userProfileSystem.currentUser);
    }
  }
}

function drawStartScreen() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 제목
  ctx.fillStyle = '#55AAFF';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('뱀파이어 서바이벌', canvas.width / 2, canvas.height / 4);
  
  // 현재 사용자 및 골드 정보 표시
  ctx.fillStyle = '#FFFF00';
  ctx.font = '20px Arial';
  ctx.fillText(`사용자: ${userProfileSystem.currentUser}`, canvas.width / 2, canvas.height / 4 + 40);
  ctx.fillStyle = '#66fcf1';
  ctx.fillText(`보유 골드: ${loadGold()}`, canvas.width / 2, canvas.height / 4 + 70);
  
  // 캐릭터 미리보기
  const previewSize = player.size * 9;
  const previewX = canvas.width / 2;
  const previewY = canvas.height / 2 + 20;
  
  // 애니메이션 프레임 업데이트
  previewAnimation.frameTime += 16;
  if (previewAnimation.frameTime >= previewAnimation.frameDuration) {
    previewAnimation.frameTime = 0;
    previewAnimation.currentFrame = (previewAnimation.currentFrame + 1) % player.frameCount;
  }
  
  if (player.image && player.image.complete) {
    const spriteX = previewAnimation.currentFrame * player.spriteWidth;
    
    ctx.drawImage(
      player.image,
      spriteX, 0,
      player.spriteWidth, player.spriteHeight,
      previewX - previewSize,
      previewY - previewSize,
      previewSize * 2,
      previewSize * 2
    );
  }
  
  // 게임 버튼들 - 4개 버튼을 2x2로 배치
  const buttonY = canvas.height - 120;
  const buttonWidth = 150;
  const buttonHeight = 40;
  const spacing = 40;
  
  // 상단 버튼들
  // 게임 시작 버튼
  drawButton(canvas.width / 2 - buttonWidth - spacing/2, buttonY, buttonWidth, buttonHeight, '게임 시작', true);
  
  // 설정 버튼
  drawButton(canvas.width / 2 + spacing/2, buttonY, buttonWidth, buttonHeight, '설정', true);
  
  // 하단 버튼들
  // 특성 강화 버튼
  drawButton(canvas.width / 2 - buttonWidth - spacing/2, buttonY + 60, buttonWidth, buttonHeight, '특성 강화', true);
  
  // 프로필 변경 버튼
  drawButton(canvas.width / 2 + spacing/2, buttonY + 60, buttonWidth, buttonHeight, '프로필 변경', true);
}

// 버튼 그리기 함수
function drawButton(x, y, width, height, text, isSelected) {
  // 버튼 배경
  ctx.fillStyle = isSelected ? '#66fcf1' : '#45a29e';
  ctx.fillRect(x, y, width, height);
  
  // 버튼 테두리
  ctx.strokeStyle = '#1f2833';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
  
  // 버튼 텍스트
  ctx.fillStyle = isSelected ? '#0b0c10' : '#ffffff';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + width/2, y + height/2);
}

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
  
  // 선택된 캐릭터 이름
  ctx.fillStyle = '#FFFF00';
  const characterIndex = player.characterType - 1;
  ctx.fillText(assetManager.images.players[characterIndex].name, canvas.width / 2, canvas.height / 2 - 30);
  
  // 좌우 화살표
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '32px Arial';
  ctx.fillText('◀', canvas.width / 2 - 120, canvas.height / 2 + 70);
  ctx.fillText('▶', canvas.width / 2 + 120, canvas.height / 2 + 70);
  
  // 캐릭터 이미지 미리보기
  const previewSize = player.size * 8;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2 + 50;
  
  // 애니메이션 프레임 업데이트
  previewAnimation.frameTime += 16;
  if (previewAnimation.frameTime >= previewAnimation.frameDuration) {
    previewAnimation.frameTime = 0;
    previewAnimation.currentFrame = (previewAnimation.currentFrame + 1) % player.frameCount;
  }
  
  if (player.image && player.image.complete) {
    const spriteX = previewAnimation.currentFrame * player.spriteWidth;
    
    ctx.drawImage(
      player.image,
      spriteX, 0,
      player.spriteWidth, player.spriteHeight,
      centerX - previewSize,
      centerY - previewSize,
      previewSize * 2,
      previewSize * 2
    );
  }
}

function drawGameOverScreen() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = '#FF5555';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('게임 오버', canvas.width / 2, canvas.height / 2 - 50);

  // 이번 판에서 획득한 골드 계산
  const goldEarned = gold - startingGold;
  
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '24px Arial';
  ctx.fillText(`획득한 골드: ${goldEarned}`, canvas.width / 2, canvas.height / 2);
  
  // 두 가지 옵션 안내
  ctx.fillText('클릭하여 다시 시작', canvas.width / 2, canvas.height / 2 + 50);
  ctx.font = '20px Arial';
  ctx.fillStyle = '#c5c6c7';
  ctx.fillText('ESC를 눌러 메인 메뉴로', canvas.width / 2, canvas.height / 2 + 80);
}

// 업그레이드 화면 그리기 함수
function drawPerkScreen() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 배경 이미지 그리기 (800x600 전체 화면)
  if (assetManager.loaded.perkBackground && assetManager.images.perkBackground) {
    ctx.globalAlpha = 0.4; // 배경을 반투명하게
    ctx.drawImage(
      assetManager.images.perkBackground,
      0, 0,
      canvas.width, canvas.height
    );
    ctx.globalAlpha = 1.0;
  }
  
  // 제목
  ctx.fillStyle = '#FFD700';
  ctx.font = '36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('특성 강화', canvas.width / 2, 60);
  
  // 현재 골드 표시
  ctx.fillStyle = '#66fcf1';
  ctx.font = '20px Arial';
  ctx.fillText(`보유 골드: ${loadGold()}`, canvas.width / 2, 100);
  
  // 마우스 호버 감지를 위한 변수
  hoveredPerkId = null;
  let hoveredPosition = null;
  
  // 특성들을 3개 구역으로 배치
  const iconSize = 64;
  const startY = 120;
  
  const sections = [
    {
      color: '#00FF7F',
      x: 150, // 좌측
      y: startY,
      spacingY: 100,
      position: 'right', // 툴팁 위치
      perks: [
        'creation_magic_luck',
        'creation_magic_gold',
        'creation_physical_exp',
        'creation_physical_pickup'
      ]
    },
    {
      color: '#1E90FF', 
      x: canvas.width / 2, // 중앙
      y: startY + 32,
      spacingY: 80,
      position: 'right', // 툴팁 위치
      perks: [
        'will_magic_regen',
        'will_magic_dodge',
        'will_physical_speed',
        'will_physical_health'
      ]
    },
    {
      color: '#FF4500',
      x: canvas.width - 150, // 우측
      y: startY - 32,
      spacingY: 80,
      position: 'left', // 툴팁 위치
      perks: [
        'destruction_magic_ranged',
        'destruction_magic_range',
        'destruction_magic_attack2',
        'destruction_physical_attack1',
        'destruction_physical_speed',
        'destruction_physical_melee'
      ]
    }
  ];
  
  // 특성 아이콘 그리기 및 호버 감지
  sections.forEach(section => {
    section.perks.forEach((perkId, index) => {
      const upgrade = permanentUpgrades.upgrades.find(u => u.id === perkId);
      if (!upgrade) return;
      
      const x = section.x;
      const y = section.y + index * section.spacingY;
      
      // 마우스 호버 확인
      if (mouseX >= x - iconSize/2 && mouseX <= x + iconSize/2 &&
          mouseY >= y - iconSize/2 && mouseY <= y + iconSize/2) {
        hoveredPerkId = perkId;
        hoveredPosition = section.position;
      }
      
      drawPerkIcon(upgrade, x, y, iconSize);
    });
  });
  
  // 뒤로가기 버튼 (툴팁보다 먼저 그리기)
  const backButtonY = canvas.height - 60;
  drawButton(canvas.width / 2 - 75, backButtonY, 150, 40, '뒤로가기', true);
  
  // 호버된 특성의 툴팁 그리기 (가장 마지막에 그려서 모든 요소 위에 표시)
  if (hoveredPerkId) {
    const hoveredUpgrade = permanentUpgrades.upgrades.find(u => u.id === hoveredPerkId);
    if (hoveredUpgrade) {
      // 호버된 특성의 위치 찾기
      sections.forEach(section => {
        const index = section.perks.indexOf(hoveredPerkId);
        if (index !== -1) {
          const x = section.x;
          const y = section.y + index * section.spacingY;
          drawPerkTooltip(hoveredUpgrade, x, y, section.position);
        }
      });
    }
  }
}

function drawPerkCategories() {
  const iconSize = 64;
  const startY = 120;
  
  // 3개 구역으로 나누어 배치 (제목과 구분선 제거)
  const sections = [
    {
      color: '#00FF7F',
      x: 150, // 좌측
      y: startY,
      spacingY: 100, // 창조 부분 간격 늘림
      perks: [
        'creation_magic_luck',      // 행운의 별
        'creation_magic_gold',      // 황금술  
        'creation_physical_exp',    // 경험치 성장
        'creation_physical_pickup'  // 수집 범위
      ]
    },
    {
      color: '#1E90FF', 
      x: canvas.width / 2, // 중단
      y: startY + 32,
      spacingY: 80, // 의지 부분 기본 간격
      perks: [
        'will_magic_regen',    // 재생술
        'will_magic_dodge',    // 회피율
        'will_physical_speed', // 신속함
        'will_physical_health' // 생명력
      ]
    },
    {
      color: '#FF4500',
      x: canvas.width - 150, // 우측
      y: startY - 32,
      spacingY: 80, // 파괴 부분 간격 줄여서 6개가 모두 들어가도록
      perks: [
        'destruction_magic_ranged',     // 마법 숙련
        'destruction_magic_range',      // 공격범위
        'destruction_magic_attack2',    // 공격력 증가 II
        'destruction_physical_attack1', // 공격력 증가 I
        'destruction_physical_speed',   // 공격속도
        'destruction_physical_melee'    // 무예 수련
      ]
    }
  ];
  
  sections.forEach(section => {
    // 특성 아이콘들 세로로 배치 (제목과 구분선 제거)
    section.perks.forEach((perkId, index) => {
      const upgrade = permanentUpgrades.upgrades.find(u => u.id === perkId);
      if (!upgrade) return;
      
      const x = section.x;
      const y = section.y + index * section.spacingY;
      
      drawPerkIcon(upgrade, x, y, iconSize);
    });
  });
}

// 업그레이드 화면 변수
let selectedPerkId = null;
let hoveredPerkId = null; // 호버된 특성 ID 추가

function drawPerkIcon(upgrade, x, y, size) {
  const isSelected = selectedPerkId === upgrade.id;
  const canUpgrade = permanentUpgrades.canUpgrade(upgrade.id);
  const isMaxLevel = upgrade.currentLevel >= upgrade.maxLevel;
  
  // 아이콘 배경
  let bgColor;
  if (isMaxLevel) {
    bgColor = 'rgba(255, 215, 0, 0.7)'; // 골드색 (최대레벨)
  } else if (canUpgrade) {
    bgColor = 'rgba(0, 255, 0, 0.4)'; // 초록색 (구매가능)
  } else {
    bgColor = 'rgba(128, 128, 128, 0.4)'; // 회색 (구매불가)
  }
  
  if (isSelected) {
    bgColor = 'rgba(102, 252, 241, 0.7)'; // 청록색 (선택됨)
  }
  
  ctx.fillStyle = bgColor;
  ctx.fillRect(x - size/2, y - size/2, size, size);
  
  // 아이콘 테두리
  ctx.strokeStyle = isSelected ? '#66fcf1' : (isMaxLevel ? '#FFD700' : '#45a29e');
  ctx.lineWidth = isSelected ? 3 : (isMaxLevel ? 2 : 1);
  ctx.strokeRect(x - size/2, y - size/2, size, size);
  
  // 아이콘 이미지
  if (assetManager.loaded.perkIcons && assetManager.images.perkIcons[upgrade.id]) {
    ctx.drawImage(
      assetManager.images.perkIcons[upgrade.id],
      x - size/2 + 4,
      y - size/2 + 4,
      size - 8, size - 8
    );
  }
  
  // 레벨 표시 (아이콘 우측 하단)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.beginPath();
  ctx.arc(x + size/2 - 15, y + size/2 - 5, 12, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = isMaxLevel ? '#FFD700' : '#FFFFFF';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${upgrade.currentLevel}/${upgrade.maxLevel}`, x + size/2 - 15, y + size/2 - 1);
}

function drawPerkTooltip(upgrade, x, y, position) {
  const padding = 15;
  const tooltipWidth = 250;
  const lineHeight = 20;
  
  // 툴팁 내용 준비
  const lines = [
    upgrade.name,
    '',
    upgrade.description,
    '',
    `현재 레벨: ${upgrade.currentLevel}/${upgrade.maxLevel}`
  ];
  
  // 현재 효과 표시
  if (upgrade.currentLevel > 0) {
    const currentEffect = upgrade.effect * upgrade.currentLevel;
    if (upgrade.id.includes('speed') || upgrade.id.includes('pickup') || upgrade.id.includes('health')) {
      lines.push(`현재 효과: +${currentEffect}`);
    } else {
      lines.push(`현재 효과: +${(currentEffect * 100).toFixed(1)}%`);
    }
  }
  
  // 다음 레벨 효과
  if (upgrade.currentLevel < upgrade.maxLevel) {
    const nextEffect = upgrade.effect;
    if (upgrade.id.includes('speed') || upgrade.id.includes('pickup') || upgrade.id.includes('health')) {
      lines.push(`다음 레벨: +${nextEffect} 추가`);
    } else {
      lines.push(`다음 레벨: +${(nextEffect * 100).toFixed(1)}% 추가`);
    }
    
    // 비용 표시
    const cost = permanentUpgrades.getCost(upgrade.id);
    const canUpgrade = permanentUpgrades.canUpgrade(upgrade.id);
    lines.push('');
    lines.push(`비용: ${cost} 골드`);
  } else {
    lines.push('');
    lines.push('최대 레벨 도달!');
  }
  
  const tooltipHeight = lines.length * lineHeight + padding * 2;
  
  // 툴팁 위치 계산 (position에 따라)
  let tooltipX, tooltipY;
  tooltipY = y - tooltipHeight / 2;
  
  if (position === 'left') {
    tooltipX = x - 70 - tooltipWidth; // 아이콘 왼쪽
  } else {
    tooltipX = x + 70; // 아이콘 오른쪽
  }
  
  // 화면 경계 체크
  if (tooltipX < 10) tooltipX = 10;
  if (tooltipX + tooltipWidth > canvas.width - 10) tooltipX = canvas.width - tooltipWidth - 10;
  if (tooltipY < 10) tooltipY = 10;
  if (tooltipY + tooltipHeight > canvas.height - 10) tooltipY = canvas.height - tooltipHeight - 10;
  
  // 툴팁 배경
  ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
  ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
  
  // 툴팁 테두리
  ctx.strokeStyle = '#66fcf1';
  ctx.lineWidth = 2;
  ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
  
  // 툴팁 텍스트
  ctx.textAlign = 'left';
  lines.forEach((line, index) => {
    if (index === 0) {
      // 제목
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 16px Arial';
    } else if (line.includes('비용:')) {
      // 비용
      const canUpgrade = permanentUpgrades.canUpgrade(upgrade.id);
      ctx.fillStyle = canUpgrade ? '#00FF00' : '#FF0000';
      ctx.font = 'bold 14px Arial';
    } else if (line.includes('최대 레벨')) {
      // 최대 레벨
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 14px Arial';
    } else {
      // 일반 텍스트
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '14px Arial';
    }
    
    if (line !== '') {
      ctx.fillText(line, tooltipX + padding, tooltipY + padding + (index + 0.5) * lineHeight);
    }
  });
}

function handlePerkScreenClick() {
  const iconSize = 64;
  const startY = 120;
  
  const sections = [
    {
      x: 150,
      y: startY,
      spacingY: 100,
      perks: [
        'creation_magic_luck', 'creation_magic_gold',
        'creation_physical_exp', 'creation_physical_pickup'
      ]
    },
    {
      x: canvas.width / 2,
      y: startY + 32,
      spacingY: 80,
      perks: [
        'will_magic_regen', 'will_magic_dodge',
        'will_physical_speed', 'will_physical_health'
      ]
    },
    {
      x: canvas.width - 150,
      y: startY - 32,
      spacingY: 80,
      perks: [
        'destruction_magic_ranged', 'destruction_magic_range',
        'destruction_magic_attack2', 'destruction_physical_attack1',
        'destruction_physical_speed', 'destruction_physical_melee'
      ]
    }
  ];
  
  // 특성 아이콘 클릭 확인
  for (let section of sections) {
    for (let i = 0; i < section.perks.length; i++) {
      const perkId = section.perks[i];
      const x = section.x;
      const y = section.y + i * section.spacingY;
      
      if (mouseX >= x - iconSize/2 && mouseX <= x + iconSize/2 &&
          mouseY >= y - iconSize/2 && mouseY <= y + iconSize/2) {
        // 바로 업그레이드 시도
        if (permanentUpgrades.canUpgrade(perkId)) {
          permanentUpgrades.purchaseUpgrade(perkId);
        }
        return;
      }
    }
  }
  
  // 뒤로가기 버튼 클릭 확인
  const backButtonY = canvas.height - 60;
  if (mouseX >= canvas.width / 2 - 75 && mouseX <= canvas.width / 2 + 75 &&
      mouseY >= backButtonY && mouseY <= backButtonY + 40) {
    currentGameState = GAME_STATE.START_SCREEN;
    return;
  }
}

function drawHUD() {
  // 텍스트에 테두리를 그리는 헬퍼 함수
  function drawTextWithStroke(text, x, y, fillColor, strokeColor, lineWidth = 3) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    
    // 테두리 그리기
    ctx.strokeText(text, x, y);
    // 실제 텍스트 그리기
    ctx.fillText(text, x, y);
  }
  
  // 경과 시간 (화면 상단 가운데)
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  drawTextWithStroke(formatTime(elapsedTime), canvas.width / 2, 30, '#66fcf1', '#000000');
  
  // 골드 (화면 왼쪽 위)
  const goldEarned = gold - startingGold;
  ctx.font = '18px Arial';
  ctx.textAlign = 'left';
  drawTextWithStroke(`Gold: ${goldEarned}`, 20, 30, '#66fcf1', '#000000');
  
  // 레벨 (화면 하단)
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  if (player.level >= MAX_PLAYER_LEVEL) {
    // 최대 레벨 도달 시 특별 표시
    drawTextWithStroke(`LEVEL MAX`, canvas.width / 2, canvas.height - 40, '#FFD700', '#000000');
  } else {
    drawTextWithStroke(`LEVEL ${player.level}`, canvas.width / 2, canvas.height - 40, '#ffff00', '#000000');
  }
  
  // 경험치 바 (화면 최하단)
  const expBarHeight = 20;
  const expBarY = canvas.height - expBarHeight;
  
  // 경험치 바 배경
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, expBarY, canvas.width, expBarHeight);
  
  // 최대 레벨이 아닐 때만 경험치 바 표시
  if (player.level < MAX_PLAYER_LEVEL) {
    // 경험치 바 진행도
    const expProgress = player.exp / player.nextLevelExp;
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(0, expBarY, canvas.width * expProgress, expBarHeight);
    
    // 경험치 텍스트
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    drawTextWithStroke(`${player.exp} / ${player.nextLevelExp}`, canvas.width / 2, expBarY + 15, '#ffffff', '#000000', 2);
  } else {
    // 최대 레벨일 때는 금색 바로 가득 채움
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(0, expBarY, canvas.width, expBarHeight);
    
    // 최대 레벨 텍스트
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    drawTextWithStroke('MAX LEVEL', canvas.width / 2, expBarY + 15, '#000000', '#FFD700', 2);
  }
  
  // 테두리
  ctx.strokeStyle = '#66fcf1';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, expBarY, canvas.width, expBarHeight);
  
  // 경험치 텍스트
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  drawTextWithStroke(`${player.exp} / ${player.nextLevelExp}`, canvas.width / 2, expBarY + 15, '#ffffff', '#000000', 2);

  // 총 처치 수 표시
  ctx.font = '16px Arial';
  ctx.textAlign = 'right';
  drawTextWithStroke(`Kills: ${totalKills}`, canvas.width - 20, 50, '#ffffff', '#000000');

  // 스폰 시스템 정보
  if (!bossMode && !spawnState.bossWarningActive) {
    const timeUntilBoss = Math.max(0, spawnState.nextBossTime - elapsedTime);
    const minutes = Math.floor(timeUntilBoss / 60);
    const seconds = Math.floor(timeUntilBoss % 60);
    
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    drawTextWithStroke(
      `다음 보스: ${minutes}:${seconds.toString().padStart(2, '0')}`, 
      20, 60, '#ffaa00', '#000000'
    );
    
    drawTextWithStroke(
      `웨이브 ${spawnState.currentWaveIndex + 1} (x${spawnState.difficultyLevel.toFixed(1)})`, 
      20, 80, '#ffffff', '#000000'
    );
  }

  // 보스전 경고 메시지
  if (bossWarningActive) {
    const elapsedWarningTime = gameTimeSystem.getTime() - bossWarningStartTime;
    const remainingTime = Math.ceil((bossWarningDuration - elapsedWarningTime) / 1000);
    
    if (remainingTime > 0) {
      // 깜빡이는 효과
      const blinkSpeed = 0.01;
      const alpha = (Math.sin(elapsedWarningTime * blinkSpeed) + 1) / 2;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      
      // WARNING 텍스트
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      drawTextWithStroke(
        'WARNING', 
        canvas.width / 2, 
        canvas.height / 2 - 80, 
        '#FF0000', 
        '#000000', 
        4
      );
      
      // 보스전 안내 텍스트
      ctx.font = 'bold 24px Arial';
      drawTextWithStroke(
        'BOSS FIGHT INCOMING', 
        canvas.width / 2, 
        canvas.height / 2 - 40, 
        '#FFFF00', 
        '#000000', 
        3
      );
      
      // 카운트다운
      ctx.font = 'bold 32px Arial';
      drawTextWithStroke(
        `${remainingTime}`, 
        canvas.width / 2, 
        canvas.height / 2, 
        '#FF0000', 
        '#FFFFFF', 
        3
      );
      
      ctx.restore();
    } else {
      // 시간이 다 되면 경고 종료
      endBossWarning();
    }
  }
  
  // 보스전 정보
  if (bossMode) {
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    drawTextWithStroke(
      `BOSS FIGHT - ${totalBosses - bossesKilled} / ${totalBosses}`, 
      canvas.width / 2, 
      60, 
      '#FF0000', 
      '#000000'
    );
  }
}

function draw() {
  let screenOffsetX = 0;
  let screenOffsetY = 0;
  
  // 화면 흔들림 효과
  if (screenShakeTime > 0) {
    const vibrationSpeed = 0.08;
    const time = gameTimeSystem.getTime() * vibrationSpeed;
    
    screenOffsetX = Math.sin(time) * screenShakeIntensity;
    
    const fadeProgress = screenShakeTime / 400;
    screenOffsetX *= fadeProgress;
    
    screenShakeTime -= 16;
  }
  
  // 캔버스 초기화
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 카메라 오프셋 계산
  const offsetX = canvas.width / 2 - player.x + screenOffsetX;
  const offsetY = canvas.height / 2 - player.y + screenOffsetY;

  // 배경 그리기
  drawBackground(offsetX, offsetY);

  // 보스 케이지 그리기
  if (bossMode && bossCage) {
    bossCage.draw(ctx, offsetX, offsetY);
  }

  // 지형 그리기
  gameObjects.terrain.forEach(feature => {
    feature.draw(offsetX, offsetY);
  });

  // 보석 그리기
  gameObjects.jewels.forEach(jewel => {
    jewel.draw(offsetX, offsetY);
  });

  // 플레이어 총알 그리기 (플레이어 총알만)
  gameObjects.bullets.forEach(bullet => {
    if (!bullet.fromEnemy) {
      bullet.draw(offsetX, offsetY);
    }
  });

  // 플레이어 그리기
  if (player.image && player.image.complete) {
    const playerSize = player.size;
    
    // 현재 프레임 위치 계산
    const spriteX = player.currentFrame * player.spriteWidth;
    const spriteY = player.animationState === 'idle' ? 0 : player.spriteHeight;
    
    // 피격 효과 또는 회피 효과 처리
    if (player.isHit || (player.invincible && player.isDodging)) {
      // 임시 캔버스 사용
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = playerSize * 2;
      tempCanvas.height = playerSize * 2;
      const tempCtx = tempCanvas.getContext('2d');
      
      // 좌우반전 처리
      if (player.direction === 'right') {
        tempCtx.translate(tempCanvas.width, 0);
        tempCtx.scale(-1, 1);
      }
      
      // 플레이어 이미지 그리기
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
      
      // 효과 오버레이
      const currentTime = gameTimeSystem.getTime();
      let alpha = 0;
      
      if (player.isHit) {
        // 피격 효과 (빨간색 깜빡임)
        const hitProgress = (currentTime - player.hitStartTime) / player.hitDuration;
        const blinkSpeed = 10;
        alpha = Math.abs(Math.sin(hitProgress * Math.PI * blinkSpeed)) * 0.8;
        
        tempCtx.globalCompositeOperation = 'source-atop';
        tempCtx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
        tempCtx.fillRect(0, 0, playerSize * 2, playerSize * 2);
      } else if (player.invincible && player.isDodging) {
        // 회피 효과 (하얀색 빛남)
        const dodgeProgress = (currentTime - player.invincibilityStartTime) / player.invincibilityDuration;
        const glowIntensity = Math.sin(dodgeProgress * Math.PI * 8) * 0.5 + 0.5; // 부드러운 깜빡임
        alpha = glowIntensity * 0.9;
        
        tempCtx.globalCompositeOperation = 'source-atop';
        tempCtx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        tempCtx.fillRect(0, 0, playerSize * 2, playerSize * 2);
      }
      
      // 최종 이미지 그리기
      ctx.drawImage(
        tempCanvas,
        canvas.width / 2 - playerSize,
        canvas.height / 2 - playerSize
      );
      
      // 피격 효과 이미지 (피격 시에만)
      if (player.isHit && assetManager.loaded.hitEffect) {
        const hitFrameX = player.hitFrame * 64; // 프레임 너비 64
        const hitEffectSize = playerSize * 2;
        
        ctx.drawImage(
          assetManager.images.hitEffect,
          hitFrameX, 0,
          64, 64,
          canvas.width / 2 - hitEffectSize / 2,
          canvas.height / 2 - hitEffectSize / 2,
          hitEffectSize,
          hitEffectSize
        );
      }
    } else {
      // 일반 상태 그리기 (기존 코드와 동일)
      ctx.save();
      
      // 캔버스 중앙으로 이동
      ctx.translate(canvas.width / 2, canvas.height / 2);
      
      // 오른쪽 방향일 때 좌우반전
      if (player.direction === 'right') {
        ctx.scale(-1, 1);
      }
      
      // 이미지 그리기
      ctx.drawImage(
        player.image,
        spriteX, spriteY,
        player.spriteWidth, player.spriteHeight,
        -playerSize,
        -playerSize,
        playerSize * 2,
        playerSize * 2
      );
      
      ctx.restore();
    }
  }
  
  // 플레이어 체력바
  const healthBarWidth = 50;
  const healthBarHeight = 6;
  const healthBarX = canvas.width / 2 - healthBarWidth / 2;
  const healthBarY = canvas.height / 2 - player.size * 2 - 10;
  
  // 체력바 배경
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
  
  // 체력바
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
  
  // 조준 방향 표시
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

  // 적 그리기 (가장 우선적으로 보이도록 나중에 그리기)
  gameObjects.enemies.forEach(enemy => {
    enemy.draw(offsetX, offsetY);
  });

  // 적 총알 그리기 (가장 우선적으로 보이도록 마지막에 그리기)
  gameObjects.bullets.forEach(bullet => {
    if (bullet.fromEnemy) {
      bullet.draw(offsetX, offsetY);
    }
  });

  // HUD 그리기
  drawHUD();

  // 디버깅: 마우스 위치 표시
  if (currentGameState === GAME_STATE.PLAYING) {
      // 화면 좌표에서 마우스 커서 표시
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 5, 0, Math.PI * 2);
      ctx.fill();
  }
}

// 배경 그리기
function drawBackground(offsetX, offsetY) {
  
  // 타일 위치 계산
  const playerTileX = Math.floor(player.x / 100); // TILE_SIZE 100
  const playerTileY = Math.floor(player.y / 100);
  
  // 화면에 그릴 타일 수
  const tilesX = Math.ceil(canvas.width / 100) + 3;
  const tilesY = Math.ceil(canvas.height / 100) + 3;
  
  // 시작 타일 위치
  const startTileX = playerTileX - Math.floor(tilesX / 2);
  const startTileY = playerTileY - Math.floor(tilesY / 2);
  
  // 타일 그리기
  for (let tileY = startTileY; tileY < startTileY + tilesY; tileY++) {
    for (let tileX = startTileX; tileX < startTileX + tilesX; tileX++) {
      const tileIndex = getTileIndex(tileX, tileY);
      const tileImage = assetManager.images.mapTiles[tileIndex];
      
      if (tileImage && tileImage.complete) {
        // 월드 좌표 -> 화면 좌표 변환
        const worldX = tileX * 100;
        const worldY = tileY * 100;
        const screenX = worldX + offsetX;
        const screenY = worldY + offsetY;
        
        // 화면 안에 있는 타일만 그리기
        if (screenX + 100 > 0 && screenX < canvas.width &&
            screenY + 100 > 0 && screenY < canvas.height) {
          
          ctx.drawImage(
            tileImage,
            0, 0,
            tileImage.width, tileImage.height,
            screenX, screenY,
            100, 100
          );
        }
      }
    }
  }
}

// 시간 포맷팅 함수
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// 타일 인덱스 결정
function getTileIndex(tileX, tileY) {
  const hash = Math.abs((tileX * 73856093) ^ (tileY * 19349663)) % 4; // MAP_TILES_COUNT=4
  return hash;
}

//----------------------
// 충돌 감지 및 유틸 함수
//----------------------

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

// 경험치 계산 함수
function getXPForNextLevel(currentLevel) {
  let xp;
  
  if (currentLevel === 1) {
    xp = 50;
  } else if (currentLevel <= 19) {
    xp = 50 + ((currentLevel - 1) * 100);
  } else if (currentLevel <= 39) {
    xp = 50 + (19 * 100) + ((currentLevel - 20) * 130);
  } else {
    xp = 50 + (19 * 100) + (20 * 130) + ((currentLevel - 40) * 160);
  }
  
  // 특별 케이스
  if (currentLevel === 14) {
    xp += 1000; // 레벨 15 도달용 추가 경험치
  } else if (currentLevel === 29) {
    xp += 5000; // 레벨 30 도달용 추가 경험치
  }
  
  return xp;
}

// 가장 가까운 적 찾기
function findNearestEnemy() {
  let nearestEnemy = null;
  let minDistance = 250;
  
  for (let enemy of gameObjects.enemies) {
    if (enemy.state === 'moving') {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = Math.hypot(dx, dy) - enemy.size;
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestEnemy = enemy;
      }
    }
  }
  
  return nearestEnemy;
}

//----------------------
// 게임 업데이트 및 적 스폰
//----------------------

// 청크 관리
function getChunkCoord(x, y) {
  return {
    x: Math.floor(x / CHUNK_SIZE),
    y: Math.floor(y / CHUNK_SIZE),
  };
}

function generateChunksAroundPlayer() {
  const chunkCoords = getChunkCoord(player.x, player.y);
  const renderDistance = 5;
  const activeChunks = {};

  for (let dx = -renderDistance; dx <= renderDistance; dx++) {
    for (let dy = -renderDistance; dy <= renderDistance; dy++) {
      const chunkX = chunkCoords.x + dx;
      const chunkY = chunkCoords.y + dy;
      const chunkKey = `${chunkX},${chunkY}`;

      if (!gameObjects.chunks[chunkKey]) {
        generateChunk(chunkX, chunkY);
      }
      activeChunks[chunkKey] = true;
    }
  }

  // 불필요한 청크 제거
  for (const chunkKey in gameObjects.chunks) {
    if (!activeChunks[chunkKey]) {
      unloadChunk(chunkKey);
    }
  }
}

function generateChunk(chunkX, chunkY) {
  const chunk = {
    items: [],
    terrain: [],
  };
  // 기본 보석 생성
  const itemCount = 3;
  for (let i = 0; i < itemCount; i++) {
    const x = chunkX * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
    const y = chunkY * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
    
    const jewelType = getWeightedRandomJewelType();
    const jewel = new Jewel(x, y, jewelType);
    chunk.items.push(jewel);
    gameObjects.jewels.push(jewel);
  }
  
  // 보물 생성 (5% 확률, 5레벨 이상, 킬수 25 이상일 때만)
  if (player.level >= 1 && Math.random() < 0.05 && totalKills >= 25) {
    const x = chunkX * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
    const y = chunkY * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
    const treasure = new Treasure(x, y);
    chunk.terrain.push(treasure);
    gameObjects.terrain.push(treasure);
  }
  
  // 청크 저장
  const chunkKey = `${chunkX},${chunkY}`;
  gameObjects.chunks[chunkKey] = chunk;
}

function unloadChunk(chunkKey) {
  const chunk = gameObjects.chunks[chunkKey];
  if (chunk) {
    // 아이템 제거
    chunk.items.forEach((item) => {
      const index = gameObjects.jewels.indexOf(item);
      if (index !== -1) gameObjects.jewels.splice(index, 1);
    });

    // 지형 제거
    chunk.terrain.forEach((feature) => {
      const index = gameObjects.terrain.indexOf(feature);
      if (index !== -1) gameObjects.terrain.splice(index, 1);
    });

    // 청크 제거
    delete gameObjects.chunks[chunkKey];
  }
}

// 통합 스폰 시스템 설정
const SPAWN_CONFIG = {
  // 3분 보스전 사이클 설정
  bossCycle: {
    interval: 180, // 3분 (180초)
    warningTime: 5, // 5초 전 경고
    enabled: true
  },
  
  // 웨이브 설정 (보스전 사이의 일반 웨이브들)
  normalWaves: {
    duration: 30, // 각 웨이브 30초 지속
    escalation: true, // 시간에 따른 난이도 증가
    baseSpawnRate: 60,
    minSpawnRate: 20
  }
};

// 통합 스폰 상태 관리
let spawnState = {
  // 보스전 관련
  nextBossTime: 180, // 다음 보스전 시간
  bossWarningActive: false,
  bossMode: false,
  
  // 일반 웨이브 관련
  currentPhase: 'normal', // 'normal', 'boss_warning', 'boss_fight'
  waveStartTime: 0,
  currentWaveIndex: 0,
  spawnTimer: 0,
  
  // 난이도 조절
  difficultyLevel: 1,
  enemiesThisWave: 0,
  maxEnemiesPerWave: 50
};

// 메인 스폰 업데이트 함수
function updateSpawnSystem() {
  // 보스전 모드면 기존 로직 사용
  if (bossMode) {
    return; // 보스전 중에는 추가 스폰 없음
  }
  
  // 보스전 타이밍 체크
  checkBossFightTiming();
  
  // 현재 페이즈에 따른 스폰 처리
  switch (spawnState.currentPhase) {
    case 'normal':
      updateNormalWaveSpawning();
      break;
    case 'boss_warning':
      // 경고 중에는 스폰 중단
      break;
    case 'boss_fight':
      // 보스전 중에는 기존 보스전 로직 사용
      break;
  }
}

// 보스전 타이밍 체크
function checkBossFightTiming() {
  const timeUntilBoss = spawnState.nextBossTime - elapsedTime;
  
  // 보스전 경고 시작
  if (!spawnState.bossWarningActive && timeUntilBoss <= 5 && timeUntilBoss > 0) {
    startBossWarning();
    spawnState.bossWarningActive = true;
    spawnState.currentPhase = 'boss_warning';
    
    // 기존 적들을 빠르게 정리
    clearRemainingEnemies();
  }
  
  // 보스전 시작
  if (!bossMode && elapsedTime >= spawnState.nextBossTime) {
    startBossMode();
    spawnState.currentPhase = 'boss_fight';
    spawnState.nextBossTime += SPAWN_CONFIG.bossCycle.interval; // 다음 보스전 시간 설정
  }
}

// 일반 웨이브 스폰
function updateNormalWaveSpawning() {
  // 현재 웨이브의 남은 시간 계산
  const waveElapsed = elapsedTime - spawnState.waveStartTime;
  const timeUntilBoss = spawnState.nextBossTime - elapsedTime;
  
  // 보스전 임박 시 스폰 중단 (10초 전부터)
  if (timeUntilBoss <= 10) {
    return;
  }
  
  // 웨이브 전환 체크 (30초마다)
  if (waveElapsed >= SPAWN_CONFIG.normalWaves.duration) {
    transitionToNextWave();
  }
  
  // 적 스폰 실행
  executeWaveSpawning();
}

// 다음 웨이브로 전환
function transitionToNextWave() {
  spawnState.currentWaveIndex++;
  spawnState.waveStartTime = elapsedTime;
  spawnState.enemiesThisWave = 0;
  
  // 난이도 증가 (3분마다 리셋되어 적당한 수준 유지)
  const cycleProgress = (elapsedTime % 180) / 180;
  spawnState.difficultyLevel = 1 + cycleProgress * 2; // 1~3배 난이도
  
  console.log(`웨이브 ${spawnState.currentWaveIndex} 시작 (난이도: ${spawnState.difficultyLevel.toFixed(1)})`);
}

// 웨이브 스폰 실행
function executeWaveSpawning() {
  spawnState.spawnTimer++;
  
  // 동적 스폰 간격 (시간이 지날수록 빨라짐)
  const baseRate = SPAWN_CONFIG.normalWaves.baseSpawnRate;
  const minRate = SPAWN_CONFIG.normalWaves.minSpawnRate;
  const currentRate = Math.max(minRate, baseRate - (spawnState.difficultyLevel - 1) * 15);
  
  if (spawnState.spawnTimer >= currentRate) {
    spawnState.spawnTimer = 0;
    
    // 최대 적 수 제한
    if (gameObjects.enemies.length < spawnState.maxEnemiesPerWave * spawnState.difficultyLevel) {
      spawnWaveEnemies();
    }
  }
}

// 웨이브 적 스폰
function spawnWaveEnemies() {
  const spawnGroup = selectSpawnGroupByDifficulty();
  
  for (let i = 0; i < spawnGroup.count; i++) {
    const spawnPos = getRandomSpawnPosition();
    if (spawnPos && spawnEnemyAtPosition(spawnPos.x, spawnPos.y, spawnGroup.type, spawnGroup.scale)) {
      spawnState.enemiesThisWave++;
    }
  }
}

// 난이도에 따른 스폰 그룹 선택
function selectSpawnGroupByDifficulty() {
  const timeUntilBoss = spawnState.nextBossTime - elapsedTime;
  const difficulty = spawnState.difficultyLevel;
  
  // 보스전 임박 시 더 강한 적들
  const urgencyBonus = timeUntilBoss < 60 ? 0.5 : 0;
  const finalDifficulty = difficulty + urgencyBonus;
  
  // 난이도별 스폰 패턴
  if (finalDifficulty < 1.5) {
    // 초급 (주로 일반 적)
    const patterns = [
      { type: 'NORMAL', count: 2, weight: 70, scale: 1.0 },
      { type: 'FAST', count: 1, weight: 30, scale: 1.0 }
    ];
    return selectRandomSpawnGroup(patterns);
  } else if (finalDifficulty < 2.5) {
    // 중급 (다양한 적 혼합)
    const patterns = [
      { type: 'NORMAL', count: 3, weight: 50, scale: 1.1 },
      { type: 'FAST', count: 2, weight: 30, scale: 1.0 },
      { type: 'TANK', count: 1, weight: 20, scale: 1.0 }
    ];
    return selectRandomSpawnGroup(patterns);
  } else {
    // 고급 (강한 적들)
    const patterns = [
      { type: 'NORMAL', count: 2, weight: 30, scale: 1.2 },
      { type: 'FAST', count: 3, weight: 35, scale: 1.1 },
      { type: 'TANK', count: 1, weight: 20, scale: 1.0 },
      { type: 'SHOOTER', count: 2, weight: 15, scale: 1.0 }
    ];
    return selectRandomSpawnGroup(patterns);
  }
}

// 가중치 기반 스폰 그룹 선택
function selectRandomSpawnGroup(spawnGroups) {
  const totalWeight = spawnGroups.reduce((sum, group) => sum + group.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const group of spawnGroups) {
    random -= group.weight;
    if (random <= 0) {
      return group;
    }
  }
  
  return spawnGroups[0]; // 기본값
}

// 기존 적들 빠르게 정리 (보스전 전)
function clearRemainingEnemies() {
  // 기존 적들의 체력을 크게 감소시켜 빠르게 정리
  gameObjects.enemies.forEach(enemy => {
    if (!enemy.isBoss && enemy.state === 'moving') {
      enemy.health = Math.min(enemy.health, enemy.maxHealth * 0.1);
    }
  });
}

// 랜덤 스폰 위치 생성
function getRandomSpawnPosition() {
  const attempts = 10;
  
  for (let i = 0; i < attempts; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = MIN_SPAWN_DISTANCE + Math.random() * (MAX_SPAWN_DISTANCE - MIN_SPAWN_DISTANCE);
    
    const x = player.x + Math.cos(angle) * distance;
    const y = player.y + Math.sin(angle) * distance;
    
    if (isValidSpawnPosition(x, y)) {
      return { x, y };
    }
  }
  
  return null;
}

// 보스전 종료 후 정리
function onBossFightEnd() {
  // 기존 endBossMode 함수에 추가
  spawnState.bossWarningActive = false;
  spawnState.currentPhase = 'normal';
  spawnState.waveStartTime = elapsedTime;
  spawnState.currentWaveIndex = 0;
  spawnState.enemiesThisWave = 0;
  
  console.log("보스전 종료, 일반 웨이브 재개");
}

// 특정 위치에 적 스폰하는 헬퍼 함수
function spawnEnemyAtPosition(x, y, enemyTypeName = null, scale = 1.0) {
  // 스폰 위치 유효성 확인
  if (!isValidSpawnPosition(x, y)) {
    return false;
  }
  
  // 적 타입 선택 - 매개변수로 받은 타입이 있으면 사용, 없으면 시간 기반 선택
  let enemyType;
  if (enemyTypeName && ENEMY_TYPES[enemyTypeName]) {
    enemyType = ENEMY_TYPES[enemyTypeName];
  } else {
    enemyType = selectEnemyTypeByTime();
  }
  
  // 선택된 타입으로 적 생성
  let enemy;
  
  if (enemyType.isBoss) {
    enemy = new BossEnemy(x, y);
  } else {
    // 시간에 따른 스탯 보정
    const timeMultiplier = 1 + (elapsedTime / 300); // 5분마다 2배
    
    // scale 매개변수 적용
    const enemySpeed = (enemyType.speedBase + Math.random() * enemyType.speedVariance) 
                       * (1 - player.enemySpeedReduction)
                       * scale; // scale 적용
    
    const enemyHealth = Math.floor((enemyType.healthBase + Math.floor((player.level - 1) * enemyType.healthPerLevel)) 
                       * (1 - player.enemyHealthReduction)
                       * timeMultiplier
                       * scale); // scale 적용
    
    const enemyAttack = (enemyType.attackBase + Math.floor((player.level - 1) * enemyType.attackPerLevel))
                       * timeMultiplier
                       * scale; // scale 적용
    
    enemy = new Enemy(x, y, enemyType.size * scale, enemySpeed, enemyHealth, enemyAttack);
    
    // 추가 속성 설정
    enemy.type = enemyType.name;
    enemy.expValue = Math.floor(enemyType.expValue * scale);
    enemy.goldValue = Math.floor(enemyType.goldValue * scale);
    
    if (enemyType.canShoot) {
      enemy.canShoot = true;
      enemy.shootCooldown = enemyType.shootCooldown;
    }
  }
  
  gameObjects.enemies.push(enemy);
  return true;
}

// 시간에 따른 적 타입 선택
function selectEnemyTypeByTime() {
  // 시간에 따라 가중치 동적 조정
  const weights = { ...ENEMY_TYPES };
  
  if (elapsedTime < 30) {
    // 초반: 주로 일반 적
    weights.NORMAL.spawnWeight = 80;
    weights.FAST.spawnWeight = 15;
    weights.TANK.spawnWeight = 5;
    weights.SHOOTER.spawnWeight = 0;
  } else if (elapsedTime < 60) {
    // 30초-1분: 슈터 등장
    weights.NORMAL.spawnWeight = 60;
    weights.FAST.spawnWeight = 20;
    weights.TANK.spawnWeight = 10;
    weights.SHOOTER.spawnWeight = 10;
  } else if (elapsedTime < 120) {
    // 1-2분: 균형잡힌 분포
    weights.NORMAL.spawnWeight = 40;
    weights.FAST.spawnWeight = 25;
    weights.TANK.spawnWeight = 20;
    weights.SHOOTER.spawnWeight = 15;
  } else if (elapsedTime < 180) {
    // 2-3분: 어려운 적 증가
    weights.NORMAL.spawnWeight = 30;
    weights.FAST.spawnWeight = 30;
    weights.TANK.spawnWeight = 25;
    weights.SHOOTER.spawnWeight = 15;
  } else {
    // 3분 이후: 극한 난이도
    weights.NORMAL.spawnWeight = 20;
    weights.FAST.spawnWeight = 35;
    weights.TANK.spawnWeight = 30;
    weights.SHOOTER.spawnWeight = 15;
  }
  
  // 가중치 기반 선택
  const totalWeight = Object.values(weights)
    .filter(type => type.spawnWeight > 0)
    .reduce((sum, type) => sum + type.spawnWeight, 0);
  
  let randomWeight = Math.random() * totalWeight;
  
  for (const type of Object.values(weights)) {
    if (type.spawnWeight <= 0) continue;
    
    randomWeight -= type.spawnWeight;
    if (randomWeight <= 0) {
      return type;
    }
  }
  
  return ENEMY_TYPES.NORMAL; // 기본값
}


function countEnemiesInSector(centerAngle, sectorAngle) {
  let count = 0;
  
  for (let enemy of gameObjects.enemies) {
    if (enemy.state === 'dying' || enemy.state === 'dead') continue;
    
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const enemyAngle = Math.atan2(dy, dx);
    
    // 각도 정규화 (0-2π)
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

function isValidSpawnPosition(x, y) {
  const minDistance = 40; // 다른 적과의 최소 거리
  
  for (let enemy of gameObjects.enemies) {
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

// 적 공간 분할 그리드 업데이트
function updateEnemySpatialGrid() {
  enemySpatialGrid = {};
  
  for (let enemy of gameObjects.enemies) {
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

// 플레이어 조준 업데이트
function updatePlayerAim() {
  let nearestEnemy = findNearestEnemy();
  
  if (nearestEnemy) {
    const dx = nearestEnemy.x - player.x;
    const dy = nearestEnemy.y - player.y;
    player.aimAngle = Math.atan2(dy, dx);
  } else if (player.aimAngle === undefined) {
    player.aimAngle = 0; // 기본값 (오른쪽)
  }
}

// 게임 메인 업데이트
function update() {
  // 경과 시간 계산 (보스전 중에는 업데이트 안함)
  if (currentGameState === GAME_STATE.PLAYING && !bossMode) {
    const currentTime = gameTimeSystem.getTime();
    const totalElapsed = currentTime - gameStartTime - totalPausedTime;
    elapsedTime = Math.floor(totalElapsed / 1000);
  }

  // 마우스 월드 좌표 재계산
  const rect = canvas.getBoundingClientRect();
  mouseWorldX = player.x + (mouseX - canvas.width / 2);
  mouseWorldY = player.y + (mouseY - canvas.height / 2);
  
  // 플레이어 이동 (getTotalMoveSpeed() 사용)
  let dx = 0;
  let dy = 0;
  let playerMoved = false;
  
  const targetX = mouseWorldX;
  const targetY = mouseWorldY;
  
  const distX = targetX - player.x;
  const distY = targetY - player.y;
  const distance = Math.sqrt(distX * distX + distY * distY);
  
  let speedFactor = 0;
  if (distance > 30) {
    if (distance >= 80) {
      speedFactor = 1;
    } else {
      speedFactor = (distance - 30) / (80 - 30);
    }
    
    playerMoved = true;
    
    dx = distX / distance;
    dy = distY / distance;
    
    // 총 이동속도 사용
    player.x += dx * player.getTotalMoveSpeed() * speedFactor;
    player.y += dy * player.getTotalMoveSpeed() * speedFactor;
    
    if (dx < 0) {
      player.direction = 'left';
    } else if (dx > 0) {
      player.direction = 'right';
    }
  }
  
  // 피격 효과 업데이트
  if (player.isHit) {
    const currentTime = gameTimeSystem.getTime();
    
    // 프레임 업데이트
    player.hitFrameTime += 16;
    if (player.hitFrameTime >= player.hitFrameDuration) {
      player.hitFrameTime = 0;
      player.hitFrame = (player.hitFrame + 1) % 4; // HIT_FRAME_COUNT = 4
      
      // 애니메이션 완료 확인
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
  player.frameTime += 16;
  if (player.frameTime >= player.frameDuration) {
    player.frameTime = 0;
    player.currentFrame = (player.currentFrame + 1) % player.frameCount;
  }
  
  // 플레이어 이동 시 청크 생성
  if (playerMoved) {
    generateChunksAroundPlayer();
  }
  
  // 적 스폰
  updateSpawnSystem();

  // 보스전 경고 체크 (보스전 시작 5초 전)
  if (!bossMode && !bossWarningActive && elapsedTime % 15 == 10 && 
      gameObjects.enemies.filter(e => e.isBossModeEnemy).length === 0) {
    startBossWarning();
  }

  // 3분(180초) 체크 및 보스전 시작
  if (!bossMode && bossWarningActive && elapsedTime % 15 == 0 && elapsedTime !== 0 && gameObjects.enemies.filter(e => e.isBossModeEnemy).length === 0) {
    startBossMode();
  }
  
  // 보스전 중 플레이어 이동 제한
  if (bossMode && bossCage) {
    bossCage.constrainPlayer(player);
  }

  // 공간 분할 그리드 업데이트
  updateEnemySpatialGrid();
  
  // 플레이어 조준
  updatePlayerAim();

  // 무기 업데이트
  player.weapons.forEach(weapon => weapon.update());

  // 총알 업데이트
  for (let i = gameObjects.bullets.length - 1; i >= 0; i--) {
    gameObjects.bullets[i].update();
    
    // 화면 밖이나 사용된 총알 제거
    if (gameObjects.bullets[i].used || 
        (typeof gameObjects.bullets[i].outOfBounds === 'function' && 
         gameObjects.bullets[i].outOfBounds())) {
      gameObjects.bullets.splice(i, 1);
    }
  }
  
  // 화면 밖 적 제거
  const despawnDistance = MAX_SPAWN_DISTANCE * 3;
  for (let i = gameObjects.enemies.length - 1; i >= 0; i--) {
    const enemy = gameObjects.enemies[i];
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const distanceSquared = dx * dx + dy * dy;
    
    if (distanceSquared > despawnDistance * despawnDistance) {
      gameObjects.enemies.splice(i, 1);
    }
  }
  
  // 적 업데이트 (활성 범위 내에서만)
  const activeRadius = CHUNK_SIZE * 1.5;
  for (let i = gameObjects.enemies.length - 1; i >= 0; i--) {
    const enemy = gameObjects.enemies[i];
    if (isWithinDistance(enemy, player, activeRadius)) {
      enemy.update();

      // 플레이어 충돌 체크
      if (detectCollision(player, enemy) && enemy.state === 'moving') {
        // 밀어내기, 공격
        enemy.pushPlayer(player);
        enemy.attackPlayer(player);
      }
    }
  }

  // 보석 업데이트
  for (let i = gameObjects.jewels.length - 1; i >= 0; i--) {
    const jewel = gameObjects.jewels[i];
    if (isWithinDistance(jewel, player, activeRadius)) {
      jewel.update();
  
      // 플레이어 충돌 체크 (고정된 획득 반경 사용)
      const pickupRange = 12.5; // 고정된 획득 범위
      if (detectCollision(jewel, { x: player.x, y: player.y, size: pickupRange })) {
        jewel.collect();
        gameObjects.jewels.splice(i, 1);
      }
    }
  }

  // 자석 효과 업데이트
  if (player.magnetActive) {
    player.magnetDuration -= 16;
    if (player.magnetDuration <= 0) {
      player.magnetActive = false;
    }
  }

  // 플레이어 무적 상태 업데이트
  if (player.invincible) {
    const currentTime = gameTimeSystem.getTime();
    const invincibilityElapsed = currentTime - player.invincibilityStartTime;
    
    // 무적 시간이 끝났는지 확인
    if (invincibilityElapsed >= player.invincibilityDuration) {
      player.invincible = false;
    }
  }

  // 체력 재생 적용 (getTotalHealthRegen() 사용)
  if (player.getTotalHealthRegen() > 0) {
    const regenAmount = player.maxHealth * player.getTotalHealthRegen() / 60;
    player.health = Math.min(player.health + regenAmount, player.maxHealth);
  }
  
  // 보물 충돌 체크
  for (let i = gameObjects.terrain.length - 1; i >= 0; i--) {
    const feature = gameObjects.terrain[i];
    if (feature.isTreasure) { // 공통 속성으로 체크
      feature.update();
      if (detectCollision(player, feature) && !feature.collected) {
        feature.collect();
        gameObjects.terrain.splice(i, 1);
      }
    }
  }
}

//----------------------
// 키보드, 마우스 입력 처리
//----------------------

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (currentGameState === GAME_STATE.PLAYING) {
      pauseGame();
    } else if (currentGameState === GAME_STATE.PAUSED) {
      resumeGame();
    } else if (currentGameState === GAME_STATE.CONFIRM_DIALOG) {
      currentGameState = GAME_STATE.PAUSED;
    } else if (currentGameState === GAME_STATE.LEVEL_UP) {
      previousGameState = currentGameState;
      currentGameState = GAME_STATE.PAUSED;
      pauseStartTime = gameTimeSystem.getTime();
    } else if (currentGameState === GAME_STATE.CREATE_USER) {
      // 입력 취소
      newUsername = '';
      hiddenInput.value = '';
      hiddenInput.blur();
      currentGameState = GAME_STATE.PROFILE_SELECT;
    } else if (currentGameState === GAME_STATE.GAME_OVER) {
      // 게임 오버 상태에서 ESC 키로 메인 메뉴로
      saveGold(); // 골드 저장
      currentGameState = GAME_STATE.START_SCREEN;
    }
    e.preventDefault();
  }
});

document.removeEventListener('keyup', (e) => {
  keys[e.key] = false;
});

// 입력 핸들러 설정 함수
function setupInputHandlers() {
  // 입력 이벤트
  hiddenInput.addEventListener('input', function(e) {
    if (currentGameState === GAME_STATE.CREATE_USER) {
      // 최대 길이 제한 (12자)
      if (e.target.value.length <= 12) {
        newUsername = e.target.value;
      } else {
        // 제한 초과 시 잘라내기
        newUsername = e.target.value.substring(0, 12);
        e.target.value = newUsername;
      }
    }
  });
  
  // 포커스 이벤트
  hiddenInput.addEventListener('focus', function() {
    isFocusedOnInput = true;
  });
  
  hiddenInput.addEventListener('blur', function() {
    isFocusedOnInput = false;
  });
  
  // 키 이벤트 (Enter와 Escape 처리)
  hiddenInput.addEventListener('keydown', function(e) {
    if (currentGameState === GAME_STATE.CREATE_USER) {
      if (e.key === 'Enter') {
        // 입력 완료
        if (newUsername.trim()) {
          // 최대 프로필 수 체크
          if (userProfileSystem.users.length >= userProfileSystem.MAX_PROFILES) {
            showCreateUserError = true;
            createUserErrorMessage = "최대 프로필 수(12개)에 도달했습니다";
            errorTimeout = 120; // 약 2초
          }
          // 사용자 이름 중복 체크
          else if (userProfileSystem.users.includes(newUsername.trim())) {
            showCreateUserError = true;
            createUserErrorMessage = "이미 존재하는 사용자 이름입니다";
            errorTimeout = 120; // 약 2초
          }
          // 성공 케이스
          else if (userProfileSystem.addUser(newUsername.trim())) {
            // 사용자 추가 성공
            newUsername = '';
            hiddenInput.value = '';
            hiddenInput.blur();
            currentGameState = GAME_STATE.PROFILE_SELECT;
          }
        }
        e.preventDefault();
      } else if (e.key === 'Escape') {
        // 입력 취소
        newUsername = '';
        hiddenInput.value = '';
        hiddenInput.blur();
        currentGameState = GAME_STATE.PROFILE_SELECT;
        e.preventDefault();
      }
    }
  });
}

// 마우스 조작

function setupMouseHandlers() {
  // 드래그 감지용 변수 추가
  let isDragging = false;
  let isMouseDown = false;
  
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    // 캔버스 스케일링을 고려한 마우스 좌표 계산
    mouseX = (e.clientX - rect.left) * (canvas.width / parseInt(canvas.style.width, 10));
    mouseY = (e.clientY - rect.top) * (canvas.height / parseInt(canvas.style.height, 10));
    
    // 월드 좌표 계산
    mouseWorldX = player.x + (mouseX - canvas.width / 2);
    mouseWorldY = player.y + (mouseY - canvas.height / 2);
    
    // 마우스 다운 상태에서 움직이면 드래그 상태로 설정
    if (isMouseDown) {
      isDragging = true;
    }
  });
  
  // 마우스 다운 이벤트
  canvas.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    isDragging = false; // 드래그 상태 초기화
    e.preventDefault();
  });
  
  // 마우스 업 이벤트
  canvas.addEventListener('mouseup', (e) => {
    // 드래그 상태가 아닐 때만 클릭으로 처리
    if (isMouseDown && !isDragging) {
      handleMouseClick();
    }
    
    // 상태 초기화
    isMouseDown = false;
    isDragging = false;
    e.preventDefault();
  });
  
  // 마우스가 캔버스를 벗어나면 상태 초기화
  canvas.addEventListener('mouseout', (e) => {
    isMouseDown = false;
    isDragging = false;
  });
}

function handleMouseClick() {
  console.log("Mouse clicked, game state:", currentGameState);

  switch(currentGameState) {
    case GAME_STATE.PROFILE_SELECT:
      handleProfileSelectClick();
      break;
    case GAME_STATE.START_SCREEN:
      handleStartScreenClick();
      break;
    case GAME_STATE.SETTINGS:
      handleSettingsScreenClick();
      break;
    case GAME_STATE.UPGRADE:
      handlePerkScreenClick();
      break;
    case GAME_STATE.PAUSED:
      handlePauseScreenClick();
      break;
    case GAME_STATE.CONFIRM_DIALOG:
      handleConfirmDialogClick();
      break;
    case GAME_STATE.LEVEL_UP:
      handleLevelUpScreenClick();
      break;
    case GAME_STATE.GAME_OVER:
      restartGame();
      break;
  }
}

function handleStartScreenClick() {
  const buttonY = canvas.height - 120;
  const buttonWidth = 150;
  const buttonHeight = 40;
  const spacing = 40;
  
  // 상단 버튼들
  // 시작 버튼
  if (mouseX >= canvas.width / 2 - buttonWidth - spacing/2 && 
      mouseX <= canvas.width / 2 - spacing/2 &&
      mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {
    startGame();
    return;
  }
  
  // 설정 버튼
  if (mouseX >= canvas.width / 2 + spacing/2 && 
      mouseX <= canvas.width / 2 + spacing/2 + buttonWidth &&
      mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {
    previousCharacterIndex = player.characterType - 1;
    currentCharacterIndex = previousCharacterIndex;
    currentGameState = GAME_STATE.SETTINGS;
    return;
  }
  
  // 하단 버튼들
  // 특성 강화 버튼
  if (mouseX >= canvas.width / 2 - buttonWidth - spacing/2 && 
      mouseX <= canvas.width / 2 - spacing/2 &&
      mouseY >= buttonY + 60 && mouseY <= buttonY + 60 + buttonHeight) {
    permanentUpgrades.loadUpgrades();
    gold = loadGold();
    currentGameState = GAME_STATE.UPGRADE;
    selectedPerkId = null; // 선택 초기화
    return;
  }
  
  // 프로필 변경 버튼
  if (mouseX >= canvas.width / 2 + spacing/2 && 
      mouseX <= canvas.width / 2 + spacing/2 + buttonWidth &&
      mouseY >= buttonY + 60 && mouseY <= buttonY + 60 + buttonHeight) {
    currentGameState = GAME_STATE.PROFILE_SELECT;
    return;
  }
}

function handleSettingsScreenClick() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2 + 70;
  const buttonSize = 40;
  
  // 왼쪽 화살표 클릭 감지
  if (mouseX > centerX - 120 - buttonSize/2 && mouseX < centerX - 120 + buttonSize/2 &&
      mouseY > centerY - buttonSize/2 && mouseY < centerY + buttonSize/2) {
    // 이전 캐릭터
    currentCharacterIndex = (currentCharacterIndex - 1 + assetManager.images.players.length) % assetManager.images.players.length;
    updatePreviewCharacter();
  }
  // 오른쪽 화살표 클릭 감지
  else if (mouseX > centerX + 120 - buttonSize/2 && mouseX < centerX + 120 + buttonSize/2 &&
           mouseY > centerY - buttonSize/2 && mouseY < centerY + buttonSize/2) {
    // 다음 캐릭터
    currentCharacterIndex = (currentCharacterIndex + 1) % assetManager.images.players.length;
    updatePreviewCharacter();
  }
  // 캐릭터 이미지 클릭 감지 (확인으로 처리)
  else if (mouseX > centerX - 100 && mouseX < centerX + 100 &&
           mouseY > centerY - 100 && mouseY < centerY + 100) {
    previousCharacterIndex = currentCharacterIndex;
    currentGameState = GAME_STATE.START_SCREEN;
  }
}

function updatePreviewCharacter() {
  // 캐릭터 미리보기 업데이트
  player.characterType = currentCharacterIndex + 1;
  player.image = assetManager.images.players[currentCharacterIndex].image;
  player.spriteWidth = assetManager.images.players[currentCharacterIndex].spriteWidth;
  player.spriteHeight = assetManager.images.players[currentCharacterIndex].spriteHeight;
  player.frameCount = assetManager.images.players[currentCharacterIndex].frameCount;
  
  // 애니메이션 초기화
  previewAnimation.currentFrame = 0;
  previewAnimation.frameTime = 0;
}

function handlePauseScreenClick() {
  const centerX = canvas.width / 2;
  const resumeY = canvas.height / 2;
  const menuY = canvas.height / 2 + 50;
  const buttonWidth = 150;
  const buttonHeight = 40;
  
  // 'RESUME' 버튼 클릭 감지
  if (mouseX > centerX - buttonWidth/2 && mouseX < centerX + buttonWidth/2 &&
      mouseY > resumeY - buttonHeight/2 && mouseY < resumeY + buttonHeight/2) {
    resumeGame();
  }
  // 'MAIN MENU' 버튼 클릭 감지
  else if (mouseX > centerX - buttonWidth/2 && mouseX < centerX + buttonWidth/2 &&
           mouseY > menuY - buttonHeight/2 && mouseY < menuY + buttonHeight/2) {
    currentGameState = GAME_STATE.CONFIRM_DIALOG;
    confirmDialogType = "exit_to_menu";
    selectedConfirmOption = 1; // 기본값: "취소" 선택
  }
}

function handleConfirmDialogClick() {
  const centerX = canvas.width / 2;
  const buttonSpacing = 150;
  const buttonWidth = 100;
  const buttonHeight = 40;
  
  // Get the actual button y-position (matching what's drawn in drawConfirmDialog)
  const dialogY = (canvas.height - 200) / 2; // The dialog Y position
  const buttonsY = dialogY + 130 - 20; // Same as in drawConfirmDialog
  
  // '확인' 버튼 클릭 감지 (left button)
  const yesButtonX = centerX - buttonSpacing / 2 - buttonWidth / 2;
  if (mouseX >= yesButtonX && mouseX <= yesButtonX + buttonWidth &&
      mouseY >= buttonsY && mouseY <= buttonsY + buttonHeight) {
    if (confirmDialogType === "exit_to_menu") {
      currentGameState = GAME_STATE.START_SCREEN;
    }
  }
  
  // '취소' 버튼 클릭 감지 (right button)
  const noButtonX = centerX + buttonSpacing / 2 - buttonWidth / 2;
  if (mouseX >= noButtonX && mouseX <= noButtonX + buttonWidth &&
      mouseY >= buttonsY && mouseY <= buttonsY + buttonHeight) {
    currentGameState = GAME_STATE.PAUSED;
  }
}

function handleLevelUpScreenClick() {
  console.log("Level up screen clicked, hovered option:", hoveredLevelUpOption); // 디버깅용
  
  // 각 옵션의 위치와 크기 계산
  const centerX = canvas.width / 2;
  const verticalMargin = 80; // drawLevelUpScreen과 일치시킴
  const boxHeight = canvas.height - verticalMargin * 2;
  const boxWidth = 180; // drawLevelUpScreen과 일치시킴
  
  // 클릭한 옵션 찾기
  let clickedOption = -1;
  
  // 간격 조정
  const spacing = 15;
  const optionCount = levelUpOptions.length;
  const totalWidth = (boxWidth * optionCount) + (spacing * (optionCount - 1));
  const startX = centerX - totalWidth / 2;
  
  // 각 옵션 박스 클릭 감지
  for (let i = 0; i < optionCount; i++) {
    if (levelUpOptions[i]) {
      const optionX = startX + (boxWidth + spacing) * i;
      const optionY = verticalMargin;
      
      if (mouseX >= optionX && mouseX <= optionX + boxWidth &&
          mouseY >= optionY && mouseY <= optionY + boxHeight) {
        clickedOption = i;
        break; // 하나만 선택 가능하므로 찾으면 루프 종료
      }
    }
  }
  
  // 클릭한 옵션이 있으면 적용
  if (clickedOption !== -1) {
    console.log("Applying level up option:", clickedOption, levelUpOptions[clickedOption]); // 디버깅용
    applyLevelUpChoice(clickedOption);
  }
}

// 창이 비활성화될 때 게임 일시정지
window.addEventListener('blur', () => {
  if (currentGameState === GAME_STATE.PLAYING) {
    pauseGame();
  }
});

// 화면 크기 조정
function resizeCanvas() {
  // 사용 가능한 창 공간 계산
  let availableWidth = window.innerWidth - 40;
  let availableHeight = window.innerHeight - 150;

  // 종횡비 유지
  const ratio = BASE_WIDTH / BASE_HEIGHT;
  
  if (availableHeight < availableWidth / ratio) {
    CANVAS_WIDTH = availableHeight * ratio;
    CANVAS_HEIGHT = availableHeight;
  } else {
    CANVAS_WIDTH = availableWidth;
    CANVAS_HEIGHT = availableWidth / ratio;
  }

  // 캔버스 표시 크기 설정 (CSS)
  canvas.style.width = CANVAS_WIDTH + 'px';
  canvas.style.height = CANVAS_HEIGHT + 'px';
  
  // 드로잉 버퍼 크기는 일관성을 위해 유지
  canvas.width = BASE_WIDTH;
  canvas.height = BASE_HEIGHT;
  
  // 폰트 초기화
  ctx.font = '16px Arial';
  
  // 이미지 스무딩 비활성화
  ctx.imageSmoothingEnabled = false;
}

//----------------------
// 게임 루프
//----------------------

function gameLoop(timestamp) {
  // 프레임 시간 계산 및 제한
  if (!lastFrameTime) lastFrameTime = timestamp;
  const deltaTime = timestamp - lastFrameTime;
  
  // 충분한 시간이 지났을 때만 업데이트
  if (deltaTime >= FRAME_INTERVAL) {
    lastFrameTime = timestamp;
    
    // 게임 시계 업데이트 (PLAYING 상태일 때만)
    if (currentGameState === GAME_STATE.PLAYING) {
      gameTimeSystem.update();
    }

    if (currentGameState === GAME_STATE.PROFILE_SELECT) {
        drawProfileSelectScreen();
      }

    else if (currentGameState === GAME_STATE.CREATE_USER) {
      drawCreateUserScreen();
    }
    
    // 로딩 상태 처리
    else if (currentGameState === GAME_STATE.LOADING) {
      drawLoadingScreen();
      
      // 청크 로딩 완료 및 최소 로딩 시간 경과 확인
      const elapsedTime = Date.now() - loadingStartTime;
      if (chunksLoaded && elapsedTime >= loadingMinDuration) {
        currentGameState = GAME_STATE.PLAYING;
        // 게임 시작시 시계 초기화
        gameTimeSystem.init();
      }
    }
    // 게임 상태별 업데이트
    else if (currentGameState === GAME_STATE.PLAYING) {
      // 경과 시간 계산 - 게임 시계 기반 (보스전 중에는 업데이트 안함)
      if (!bossMode) {
        const currentGameTime = gameTimeSystem.getTime();
        elapsedTime = Math.floor(currentGameTime / 1000);
      }
      
      update();
      draw();
      
      if (player.health <= 0) {
        saveGold();
        currentGameState = GAME_STATE.GAME_OVER;
      }
    } 
    else if (currentGameState === GAME_STATE.LEVEL_UP) {
      draw(); // 배경으로 게임 화면 그리기
      drawLevelUpScreen();
    } 
    else if (currentGameState === GAME_STATE.START_SCREEN) {
      drawStartScreen();
      
      // 시작 화면에서 애니메이션 프레임 업데이트 - 게임 시계와 무관하게 처리
      previewAnimation.frameTime += 16;
      if (previewAnimation.frameTime >= previewAnimation.frameDuration) {
        previewAnimation.frameTime = 0;
        previewAnimation.currentFrame = (previewAnimation.currentFrame + 1) % player.frameCount;
      }
    } 
    else if (currentGameState === GAME_STATE.SETTINGS) {
      drawSettingsScreen();
      
      // 설정 화면에서도 애니메이션 계속 - 게임 시계와 무관하게 처리
      previewAnimation.frameTime += 16;
      if (previewAnimation.frameTime >= previewAnimation.frameDuration) {
        previewAnimation.frameTime = 0;
        previewAnimation.currentFrame = (previewAnimation.currentFrame + 1) % player.frameCount;
      }
    }
    else if (currentGameState === GAME_STATE.UPGRADE) {
      drawPerkScreen();
    }
    else if (currentGameState === GAME_STATE.GAME_OVER) {
      drawGameOverScreen();
    } 
    else if (currentGameState === GAME_STATE.PAUSED) {
      // 일시정지 전 화면에 따라 배경 다르게 그리기
      if (previousGameState === GAME_STATE.LEVEL_UP) {
        draw();
        drawLevelUpScreen();
      } else {
        draw();
      }
      
      drawPauseScreen();
    } 
    else if (currentGameState === GAME_STATE.CONFIRM_DIALOG) {
      if (previousGameState === GAME_STATE.LEVEL_UP) {
        draw();
        drawLevelUpScreen();
      } else {
        draw();
      }
      
      drawPauseScreen();
      drawConfirmDialog();
    }
    
    // 화면 흔들림 효과 업데이트 - 오직 PLAYING 상태에서만
    if (currentGameState === GAME_STATE.PLAYING && screenShakeTime > 0) {
      screenShakeTime -= 16;
    }
  }
  
  // 다음 프레임 요청
  requestAnimationFrame(gameLoop);
}

// 게임 초기화 및 시작
window.onload = function() {
  // 사용자 프로필 시스템 초기화
  userProfileSystem.init();
  
  // 초기 상태를 프로필 선택으로 설정
  currentGameState = GAME_STATE.PROFILE_SELECT;
  
  // 히든 입력 필드 초기화
  hiddenInput = document.getElementById('hiddenInput');
  
  // 입력 핸들러 설정
  setupInputHandlers();
  
  assetManager.loadAll(() => {
    // 플레이어 첫 번째 캐릭터로 초기화
    player.init(0); 
    
    // 마우스 핸들러 설정
    setupMouseHandlers();
    
    // 게임 루프 시작
    requestAnimationFrame(gameLoop);
  });

  // 캔버스 크기 초기화
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
};
