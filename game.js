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
  localStorage.setItem('vampireSurvivorGold', gold.toString());
}

// 골드 불러오기 함수
function loadGold() {
  const savedGold = localStorage.getItem('vampireSurvivorGold');
  if (savedGold !== null) {
    return parseInt(savedGold);
  }
  return 0; // 저장된 골드가 없으면 0 반환
}

// Game objects
const gameObjects = {
  chunks: {}, 
  terrain: [],
  bullets: [],
  enemies: [],
  jewels: []
};

// Game state
let gold = 0;
let currentGameState = 0;
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
  LEVEL_UP: 7
};

// 적 관련 상수
const MAX_ENEMIES = 100;
const MIN_SPAWN_DISTANCE = 150;
const MAX_SPAWN_DISTANCE = 450;
const ENEMY_SPAWN_INTERVAL = 500;
const ENEMY_SPATIAL_GRID_SIZE = 100;
let enemySpatialGrid = {};

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
      jewels: []
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
      jewels: false
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

  loadPlayerImages() {
    const playerTypes = 3;
    this.images.players = [];
    
    for (let i = 0; i < playerTypes; i++) {
      const img = new Image();
      img.src = `./img/player${i+1}_sprites.png`;
      img.onload = () => {
        console.log(`캐릭터 ${i+1} 스프라이트 시트 로드 완료`);
        if (this.images.players.length === playerTypes) {
          this.loaded.players = true;
        }
      };
      this.images.players.push({
        name: `캐릭터 ${i+1}`,
        image: img,
        spriteWidth: 64,
        spriteHeight: 64,
        frameCount: 4
      });
    }
  }

  loadMapTiles() {
    const tileCount = 4;
    this.images.mapTiles = [];
    let loadedCount = 0;
    
    for (let i = 1; i <= tileCount; i++) {
      const img = new Image();
      img.src = `./img/maps/map_tile_${i}.png`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === tileCount) {
          this.loaded.mapTiles = true;
          console.log('맵 타일 이미지 로드 완료');
        }
      };
      img.onerror = () => {
        console.error(`맵 타일 이미지 로드 실패: map_tile_${i}.png`);
        loadedCount++;
      };
      this.images.mapTiles.push(img);
    }
    
    // 5초 후에도 로드가 안 되면 진행
    setTimeout(() => {
      if (!this.loaded.mapTiles && loadedCount > 0) {
        this.loaded.mapTiles = true;
        console.log('시간 초과로 인한 맵 타일 이미지 로드 중단');
      }
    }, 5000);
  }

  loadWeaponImages() {
    const weaponTypes = [
      'basic', 'orbit', 'flame', 'lightningChain', 
      'lightningImpact',
    ];
    
    let loadedCount = 0;
    
    for (const type of weaponTypes) {
      const img = new Image();
      img.src = `./img/weapons/${type}.png`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === weaponTypes.length) {
          this.loaded.weapons = true;
          console.log('무기 이미지 로드 완료');
        }
      };
      img.onerror = () => {
        console.error(`무기 이미지 로드 실패: ${type}`);
        loadedCount++;
      };
      this.images.weapons[type] = img;
    }
  }

  loadWeaponIcons() {
    const weaponTypes = [
      'basic', 'orbit', 'flame', 'lightning', 
    ];
    
    let loadedCount = 0;
    
    for (const type of weaponTypes) {
      const img = new Image();
      img.src = `./img/weapon_icons/${type}_icon.png`; // 무기 아이콘 경로
      img.onload = () => {
        loadedCount++;
        if (loadedCount === weaponTypes.length) {
          this.loaded.weaponIcons = true;
          console.log('무기 아이콘 로드 완료');
        }
      };
      img.onerror = () => {
        console.error(`무기 아이콘 로드 실패: ${type}`);
        loadedCount++;
      };
      this.images.weaponIcons[type] = img;
    }
  }
  
  loadLevelUpIcons() {
    const iconTypes = [
      'attackPower', 'maxHealth', 'cooldownReduction', 'projectileSpeed',
      'moveSpeed', 'pickupRadius', 'expMultiplier'
    ];
    
    let loadedCount = 0;
    
    for (const type of iconTypes) {
      const img = new Image();
      img.src = `./img/levelup/${type}_icon.png`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === iconTypes.length) {
          this.loaded.levelUpIcons = true;
          console.log('레벨업 아이콘 로드 완료');
        }
      };
      img.onerror = () => {
        console.error(`레벨업 아이콘 로드 실패: ${type}`);
        loadedCount++;
      };
      this.images.levelUpIcons[type] = img;
    }
  }

  loadArtifactIcons() {
    const artifactTypes = [
      'reducePlayerSize', 'increaseAttackPower', 'increaseCooldownReduction',
      'increaseMoveSpeed', 'enableHealthRegen', 'reduceEnemySpeed',
      'reduceEnemyHealth', 'expGain'
    ];
    
    let loadedCount = 0;
    
    for (const type of artifactTypes) {
      const img = new Image();
      img.src = `./img/artifacts/${type}_icon.png`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === artifactTypes.length) {
          this.loaded.artifactIcons = true;
          console.log('아티팩트 아이콘 로드 완료');
        }
      };
      img.onerror = () => {
        console.error(`아티팩트 아이콘 로드 실패: ${type}`);
        loadedCount++;
      };
      this.images.artifactIcons[type] = img;
    }
  }

  loadEnemyImages() {
    const enemyTypes = [
      'normal', 'fast', 'tank', 'shooter', 'boss'
    ];
    
    let loadedCount = 0;
    this.images.enemies = {}; // 초기화
    
    for (const type of enemyTypes) {
      const img = new Image();
      img.src = `./img/enemies/${type}_enemy_sprites.png`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === enemyTypes.length) {
          this.loaded.enemies = true;
          console.log('적 이미지 로드 완료');
        }
      };
      img.onerror = () => {
        console.error(`적 이미지 로드 실패: ${type}`);
        loadedCount++;
      };
      this.images.enemies[type] = img;
    }
    // 적 총알 이미지
    const bulletImg = new Image();
    bulletImg.src = './img/enemies/enemy_bullet.png';
    bulletImg.onload = () => {
      console.log('적 총알 이미지 로드 완료');
    };
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
    
    // 피격 효과 이미지
    this.images.hitEffect = new Image();
    this.images.hitEffect.src = './img/miscs/hit_effect.png';
    this.images.hitEffect.onload = () => {
      this.loaded.hitEffect = true;
      console.log('피격 효과 이미지 로드 완료');
    };
  }

  // jewel 이미지 로드 함수
  loadJewelImages() {
    const jewelTypes = 5; // 총 5가지 타입의 jewel
    this.images.jewels = [];
    let loadedCount = 0;
    
    for (let i = 0; i < jewelTypes; i++) {
      const img = new Image();
      img.src = `./img/jewels/jewel_${i}.png`; // 이미지 파일 경로: ./img/jewel_0.png, jewel_1.png, ...
      img.onload = () => {
        loadedCount++;
        if (loadedCount === jewelTypes) {
          this.loaded.jewels = true;
          console.log('보석 이미지 로드 완료');
        }
      };
      img.onerror = () => {
        console.error(`보석 이미지 로드 실패: jewel_${i}.png`);
        loadedCount++;
      };
      this.images.jewels.push(img);
    }
    
    // 5초 후에도 로드가 안 되면 진행
    setTimeout(() => {
      if (!this.loaded.jewels && loadedCount > 0) {
        this.loaded.jewels = true;
        console.log('시간 초과로 인한 보석 이미지 로드 중단');
      }
    }, 5000);
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
  maxHealth: 100,
  level: 1,
  exp: 0,
  nextLevelExp: 50,
  prevLevelExp: 0,
  weapons: [],
  characterType: 1,
  image: null,
  
  size: 15,
  speed: 2,
  attackPower: 1,
  cooldownReduction: 0,
  projectileSpeed: 1,
  pickupRadius: 30,
  expMultiplier: 1,
  
  // 애니메이션 관련 속성
  animationState: 'idle',
  currentFrame: 0,
  frameCount: 4,
  frameTime: 0,
  frameDuration: 150,
  spriteWidth: 64,
  spriteHeight: 64,
  
  // 방향 및 피격 효과 속성
  direction: 'left',
  isHit: false,
  hitStartTime: 0,
  hitDuration: 500,
  hitFrame: 0,
  hitFrameTime: 0,
  hitFrameDuration: 50,
  
  // 아티팩트 관련 속성
  acquiredArtifacts: [],
  healthRegeneration: 0,
  enemySpeedReduction: 0,
  enemyHealthReduction: 0,

    // 자석 효과 관련 속성
  magnetActive: false,
  magnetDuration: 0,
  magnetMaxDuration: 2000, // 2초

  // 무적 상태 관련 속성
  invincible: false,
  invincibilityDuration: 500, // 무적 시간 (0.5초)
  invincibilityStartTime: 0,
  
  // 플레이어 초기화
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
// 무기 시스템
//----------------------

// 기본 무기 클래스
class Weapon {
  constructor(config = {}) {
    this.type = config.type || 'basic';
    this.baseCooldown = config.baseCooldown || 1000;
    this.cooldown = this.baseCooldown;
    this.lastAttackTime = gameTimeSystem.getTime();
    this.damage = config.damage || 10;
    
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
}

// 기본 총알 클래스
class BasicWeapon extends Weapon {
  constructor() {
    super({
      type: 'basic',
      baseCooldown: 1000,
      damage: 10
    });
  }

  fire() {
    gameObjects.bullets.push(
      new Bullet(
        player.x,
        player.y,
        5,
        7,
        Math.random() * Math.PI * 2,
        10 * player.attackPower
      )
    );
  }
}

// 투사체 클래스
class Bullet {
  constructor(x, y, size, speed, angle, damage) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.baseSpeed = speed;
    this.speed = speed * player.projectileSpeed;
    this.angle = angle;
    this.baseDamage = damage;
    this.damage = damage * player.attackPower;
    this.used = false;
  }

  update() {
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;

    // 적과 충돌 체크
    for (let enemy of gameObjects.enemies) {
      if (enemy.state === 'moving' && detectCollision(this, enemy)) {
        enemy.takeDamage(this.damage);
        this.used = true;
      }
    }
  }

  draw(offsetX, offsetY) {
    if (assetManager.loaded.weapons && assetManager.images.weapons.bullet) {
      const drawSize = this.size * 2;
      ctx.save();
      ctx.translate(this.x + offsetX, this.y + offsetY);
      ctx.rotate(this.angle);
      ctx.drawImage(
        assetManager.images.weapons.bullet,
        -drawSize / 2,
        -drawSize / 2,
        drawSize,
        drawSize
      );
      ctx.restore();
    } else {
      ctx.fillStyle = 'yellow';
      ctx.beginPath();
      ctx.arc(this.x + offsetX, this.y + offsetY, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  outOfBounds() {
    const maxDistance = 1000;
    return !isWithinDistance(this, player, maxDistance);
  }
}

class OrbitWeapon extends Weapon {
  constructor() {
    super({
      type: 'orbit',
      baseCooldown: 50,
      damage: 8
    });
    this.orbitRadius = 150;        
    this.orbitSpeed = 0.03;       
    this.orbitAngle = 0;          
    this.orbCount = 1;            
    this.damageCooldown = 100;    
    this.lastDamageTime = 0;
    
    // 구체를 게임 객체로 생성
    this.createOrbs();
  }
  
  createOrbs() {
    // 기존 구체 제거
    this.removeOldOrbs();
    
    // 새 구체 생성
    for (let i = 0; i < this.orbCount; i++) {
      const angle = (Math.PI * 2 * i) / this.orbCount;
      const orb = new OrbitOrb(
        player.x, 
        player.y,
        angle,
        this.orbitRadius,
        this.damage * player.attackPower,
        this
      );
      gameObjects.bullets.push(orb);
    }
  }
  
  removeOldOrbs() {
    // 이전 구체들 제거
    gameObjects.bullets = gameObjects.bullets.filter(b => !(b instanceof OrbitOrb && b.parent === this));
  }
  
  update() {
    this.orbitAngle += this.orbitSpeed;
  }
  
  // 업그레이드 시 구체 재생성
  upgrade() {
    this.damage += 3;
    this.orbCount += 1;
    this.orbitRadius += 15;
    this.createOrbs();
  }
  
  fire() {
    // 오비트 무기에서는 사용되지 않음
  }
}

// OrbitOrb 클래스
class OrbitOrb {
  constructor(x, y, baseAngle, radius, damage, parent) {
    this.x = x;
    this.y = y;
    this.baseAngle = baseAngle;
    this.radius = radius;
    this.damage = damage;
    this.size = 8;
    this.used = false;
    this.parent = parent;
    this.rotationAngle = Math.random() * Math.PI * 2;
    this.rotationSpeed = 0.05;
  }
  
  update() {
    if (this.used) return;
    
    // 플레이어 주변 회전
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
    const drawSize = this.size * 3;
      
    ctx.save();
    ctx.translate(this.x + offsetX, this.y + offsetY);
    ctx.rotate(this.rotationAngle);
        
    // 이미지 그리기
    if (assetManager.loaded.weapons && assetManager.images.weapons.orbit) {
      ctx.globalAlpha = 1;
      ctx.drawImage(
        assetManager.images.weapons.orbit,
        -drawSize / 2,
        -drawSize / 2,
        drawSize,
        drawSize
      );
    }
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
      baseCooldown: 5000, // 쿨타임
      damage: 15 // 데미지
    });
    this.flameAngle = Math.PI / 3; // 60도 부채꼴
    this.range = 200; // 범위
    this.duration = 3000; // 지속시간
    this.activeFlames = []; // 활성화된 화염 효과 저장
    this.isFiring = false; // 발사 중인지 여부
  }
  
  update() {
    const now = gameTimeSystem.getTime();
    
    // 활성화된 화염 중 사용 완료된 것 제거
    this.activeFlames = this.activeFlames.filter(flame => !flame.used);
    
    // 발사 중인지 확인 (활성 화염이 있으면 발사 중)
    this.isFiring = this.activeFlames.length > 0;
    
    // 발사 중이 아니고 쿨다운이 지났으면 발사(발사 중엔 쿨타임 돌지 않음)
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
      this.range,
      this.damage * player.attackPower,
      this.duration
    );
    
    this.activeFlames.push(flame);
    gameObjects.bullets.push(flame);
  }
}

// 화염 효과 클래스
class FlameEffect {
  constructor(x, y, angle, range, damage, duration) {
    this.x = x;
    this.y = y;
    this.angle = angle; // 부채꼴 각도
    this.range = range; // 최대 범위
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
      const distanceToEnemy = Math.sqrt(dx * dx + dy * dy);
      
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
    let currentDirection = this.lastDirection || 0; // 저장된 마지막 방향 사용
    
    if (currentGameState === GAME_STATE.PLAYING) {
      const dx = mouseWorldX - player.x;
      const dy = mouseWorldY - player.y;
      currentDirection = Math.atan2(dy, dx);
      this.lastDirection = currentDirection; // 현재 방향 저장
    }
    
    // 화염 효과 그리기
    ctx.save();
    
    // 플레이어 위치로 이동 후 방향에 맞게 회전
    ctx.translate(this.x + offsetX, this.y + offsetY);
    ctx.rotate(currentDirection);
    
    // 투명도 설정 - PAUSED가 아닐 때만 페이드아웃 계산
    let opacity;
    if (currentGameState === GAME_STATE.PLAYING) {
      // 플레이 중일 때만 실제 경과 시간 계산
      const elapsed = gameTimeSystem.getTime() - this.startTime;
      const progress = elapsed / this.duration;
      
      // 페이드아웃 계산 (지속 시간의 85% 이후부터 페이드아웃)
      if (progress >= this.fadeOutStart) {
        // 페이드아웃 구간 내 진행률 계산 (0~1)
        const fadeProgress = (progress - this.fadeOutStart) / (1 - this.fadeOutStart);
        // 부드러운 S 커브 페이드아웃 (급격하게 사라지는 느낌)
        opacity = Math.pow(1 - fadeProgress, 2);
      } else {
        opacity = 1.0;
      }
      
      // 현재 불투명도 저장 (일시정지 시 사용)
      this.currentOpacity = opacity;
    } else {
      // 일시정지 상태에서는 저장된 불투명도 사용
      opacity = this.currentOpacity || 1.0;
    }
    
    ctx.globalAlpha = opacity;
    
    // 화염 애니메이션 프레임 그리기
    const frameX = this.currentFrame * this.frameWidth;
    const drawSize = this.range * 0.9; // 화면에 표시될 크기
    
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
    this.chainRange = 150;
    this.maxTargetDistance = 400;
  }
  
  fire() {
    // 가장 가까운 적 찾기
    const nearestEnemy = this.findNearestEnemy();
    
    if (nearestEnemy) {
      // 적을 찾으면 체인 라이트닝 효과 생성
      gameObjects.bullets.push(
        new ChainLightningEffect(
          player.x, player.y,
          nearestEnemy.x, nearestEnemy.y,
          15 * player.attackPower,
          this.chainCount,
          this.chainRange,
          nearestEnemy
        )
      );
    }
  }
  
  findNearestEnemy() {
    let closestEnemy = null;
    let minDistance = this.maxTargetDistance;
    
    for (let enemy of gameObjects.enemies) {
      if (enemy.state === 'moving') {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestEnemy = enemy;
        }
      }
    }
    
    return closestEnemy;
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
      case 'basic':
        return new BasicWeapon();
      case 'orbit':
        return new OrbitWeapon();
      case 'flame':
        return new FlameWeapon();
      case 'lightning':
        return new LightningWeapon();
      default:
        return new BasicWeapon();
    }
  },
  
  upgradeWeapon(weapon) {
    if (weapon instanceof OrbitWeapon) {
      weapon.bulletCount += 1;
      weapon.orbitRadius += 10;
    } else if (weapon instanceof FlameWeapon) {
      weapon.range += 50;
      weapon.coneAngle += Math.PI / 12;
    } else if (weapon instanceof LightningWeapon) {
      weapon.chainCount += 1;
      weapon.chainRange += 25;
    }     
    weapon.updateCooldown(player.cooldownReduction);
  }
};

//----------------------
// Enemy 클래스
//----------------------

// 적 타입 정의
const ENEMY_TYPES = {
  NORMAL: {
    name: "Normal",
    size: 20,
    speedBase: 0.5,
    speedVariance: 0.1,
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
    size: 15,
    speedBase: 1.5,
    speedVariance: 0.2,
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
    size: 25,
    speedBase: 0.3,
    speedVariance: 0.05,
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
    size: 18,
    speedBase: 0.4,
    speedVariance: 0.1,
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
    size: 40,
    speedBase: 0.3,
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
    this.canShoot = false;  // 기본값은 발사 불가
    this.shootRange = 300;
    this.shootCooldown = 2000;
    this.lastShotTime = 0;
    
    // 피격 효과 관련 속성
    this.isHit = false;
    this.hitTime = 0;
    this.hitDuration = 200; // 피격 효과 지속 시간(ms)
    this.hitBrightness = 0; // 현재 밝기 효과 (0-1)
  }
  
  update() {
    const currentTime = gameTimeSystem.getTime();
    const deltaTime = 16;
    this.animationTime += deltaTime;

    // 발사 로직
    if (this.canShoot && this.state === 'moving') {
      // 플레이어와의 거리 계산
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 시야 내이고 쿨다운이 지났으면 발사
      if (distance <= this.shootRange && currentTime - this.lastShotTime >= this.shootCooldown) {
        this.shoot();
        this.lastShotTime = currentTime;
      }
    }
    
    // 피격 효과 업데이트
    if (this.isHit) {
      const elapsedHitTime = currentTime - this.hitTime;
      if (elapsedHitTime >= this.hitDuration) {
        this.isHit = false;
        this.hitBrightness = 0;
      } else {
        // 시간에 따라 밝기 감소 (1에서 0으로)
        this.hitBrightness = 1 - (elapsedHitTime / this.hitDuration);
      }
    }
    
    // 상태별 업데이트
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

  // 발사 메서드 추가
  shoot() {
    // 각도 계산 (플레이어 방향)
    const angle = Math.atan2(player.y - this.y, player.x - this.x);
    
    // 약간의 랜덤성 추가
    const randomAngle = angle + (Math.random() * 0.2 - 0.1);
    
    // 총알 생성
    gameObjects.bullets.push(
      new EnemyBullet(
        this.x,
        this.y,
        4,                   // 크기
        3,                   // 속도
        randomAngle,         // 각도
        this.attackStrength / 2  // 데미지
      )
    );
    
    // 발사 효과
    this.isHit = true;
    this.hitTime = gameTimeSystem.getTime();
  }

  updateSpawning(currentTime) {
    const elapsedTime = currentTime - this.stateStartTime;
    const progress = Math.min(elapsedTime / this.spawnDuration, 1);
    
    // 크기 애니메이션
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
    
    // 크기 감소 애니메이션
    this.currentSize = this.size * (1 - this.easeInQuad(progress));
    
    if (progress >= 1) {
      this.state = 'dead';
      this.die();
    }
  }

  startDying() {
    this.state = 'dying';
    this.stateStartTime = gameTimeSystem.getTime();
    
    // 경험치 및 골드 획득 (타입별로 다른 값 적용)
    const expValue = this.expValue || 3; // 기본값 3
    const goldValue = this.goldValue || 10; // 기본값 10
    
    player.exp += Math.floor(expValue * player.expMultiplier);
    gold += goldValue;
    saveGold();
    
    // 아이템 드롭
    // 일반 보석 드롭 확률 (보스는 BossEnemy 클래스에서 처리)
    if (!this.isBoss && Math.random() < 0.1) {
      const jewelType = getWeightedRandomJewelType();
      gameObjects.jewels.push(new Jewel(this.x, this.y, jewelType));
    }
  
    // 보물 드롭 (보스가 아닌 경우 더 낮은 확률)
    if (!this.isBoss && Math.random() < 0.01) {
      gameObjects.terrain.push(new Treasure(this.x, this.y));
    }
    
    // 레벨업 체크
    checkLevelUp();
  }

  draw(offsetX, offsetY) {
    const drawX = this.x + offsetX;
    const drawY = this.y + offsetY;
    
    switch(this.state) {
      case 'spawning':
        this.drawSpawning(drawX, drawY);
        break;
      case 'moving':
        this.drawMoving(drawX, drawY);
        break;
      case 'dying':
        this.drawDying(drawX, drawY);
        break;
    }
  }

  drawSpawning(drawX, drawY) {
      const progress = (gameTimeSystem.getTime() - this.stateStartTime) / this.spawnDuration;
      ctx.globalAlpha = Math.min(progress, 1);
      
      // 스폰 서클 효과
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(drawX, drawY, this.currentSize * 1.5, 0, Math.PI * 2 * progress);
      ctx.stroke();
      
      // 적 유형에 따른 이미지 선택
      let enemyImage;
      
      if (this.type === "Boss" && assetManager.loaded.enemies) {
          enemyImage = assetManager.images.enemies.boss;
      } else if (this.type === "Fast" && assetManager.loaded.enemies) {
          enemyImage = assetManager.images.enemies.fast;
      } else if (this.type === "Tank" && assetManager.loaded.enemies) {
          enemyImage = assetManager.images.enemies.tank;
      } else if (this.type === "Shooter" && assetManager.loaded.enemies) {
          enemyImage = assetManager.images.enemies.shooter;
      } else if (this.type === "Normal" && assetManager.loaded.enemies) {
          enemyImage = assetManager.images.enemies.normal;
      } else {
          // 이미지가 로드되지 않았을 경우
          ctx.globalAlpha = 1;
          return;
      }
      
      if (enemyImage) {
          const displaySize = this.currentSize * 2.5;
          const defaultDirection = player.x < this.x ? 'left' : 'right';
          
          ctx.save();
          
          if (defaultDirection === 'right') {
              ctx.translate(drawX + displaySize / 2, 0);
              ctx.scale(-1, 1);
              ctx.drawImage(
                  enemyImage,
                  0, 0,
                  this.spriteWidth, this.spriteHeight,
                  0,
                  drawY - displaySize / 2,
                  displaySize,
                  displaySize
              );
          } else {
              ctx.drawImage(
                  enemyImage,
                  0, 0,
                  this.spriteWidth, this.spriteHeight,
                  drawX - displaySize / 2,
                  drawY - displaySize / 2,
                  displaySize,
                  displaySize
              );
          }
          
          ctx.restore();
      }
      
      ctx.globalAlpha = 1;
  }

  drawMoving(drawX, drawY) {
    const pulse = 1 + Math.sin(this.animationTime * 0.005) * 0.05;
    let currentSize = this.currentSize * pulse;
    currentSize = Math.max(0.1, currentSize);
    
    // 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(drawX + 3, drawY + 5, currentSize * 0.8, currentSize * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 적 유형에 따른 이미지 선택
    let enemyImage;
    
    if (this.type === "Boss" && assetManager.loaded.enemies) {
      enemyImage = assetManager.images.enemies.boss;
    } else if (this.type === "Fast" && assetManager.loaded.enemies) {
      enemyImage = assetManager.images.enemies.fast;
    } else if (this.type === "Tank" && assetManager.loaded.enemies) {
      enemyImage = assetManager.images.enemies.tank;
    } else if (this.type === "Shooter" && assetManager.loaded.enemies) {
      enemyImage = assetManager.images.enemies.shooter;
    } else if (this.type === "Normal" && assetManager.loaded.enemies) {
      enemyImage = assetManager.images.enemies.normal;
    } else {
      // 이미지가 로드되지 않았을 경우
      return;
    }
    
    if (enemyImage) {
      const spriteX = this.currentFrame * this.spriteWidth;
      const displaySize = this.size * 2.5;
      
      ctx.save();
      
      // 방향에 따라 다르게 처리
      if (this.direction === 'right') {
        ctx.translate(drawX + displaySize / 2 + this.wobbleAmount, 0);
        ctx.scale(-1, 1);
        
        // 피격 효과를 위한 캔버스 생성
        if (this.isHit && this.hitBrightness > 0) {
          // 임시 캔버스 생성
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = displaySize;
          tempCanvas.height = displaySize;
          const tempCtx = tempCanvas.getContext('2d');
          
          // 1. 임시 캔버스에 원본 이미지 그리기
          tempCtx.drawImage(
            enemyImage,
            spriteX, 0,
            this.spriteWidth, this.spriteHeight,
            0,
            0,
            displaySize,
            displaySize
          );
          
          // 2. 이미지가 있는 부분에만 밝기 효과 적용
          tempCtx.globalCompositeOperation = 'source-atop';
          tempCtx.fillStyle = 'white';
          tempCtx.globalAlpha = this.hitBrightness * 0.7;
          tempCtx.fillRect(0, 0, displaySize, displaySize);
          
          // 3. 원본 이미지 그리기
          ctx.drawImage(
            enemyImage,
            spriteX, 0,
            this.spriteWidth, this.spriteHeight,
            0,
            drawY - displaySize / 2,
            displaySize,
            displaySize
          );
          
          // 4. 효과가 적용된 이미지 오버레이
          ctx.globalCompositeOperation = 'lighter';
          ctx.drawImage(
            tempCanvas,
            0,
            drawY - displaySize / 2
          );
          ctx.globalCompositeOperation = 'source-over';
        } else {
          // 일반 상태: 그냥 이미지만 그리기
          ctx.drawImage(
            enemyImage,
            spriteX, 0,
            this.spriteWidth, this.spriteHeight,
            0,
            drawY - displaySize / 2,
            displaySize,
            displaySize
          );
        }
      } else {
        // 왼쪽 방향일 때 처리
        if (this.isHit && this.hitBrightness > 0) {
          // 임시 캔버스 생성
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = displaySize;
          tempCanvas.height = displaySize;
          const tempCtx = tempCanvas.getContext('2d');
          
          // 1. 임시 캔버스에 원본 이미지 그리기
          tempCtx.drawImage(
            enemyImage,
            spriteX, 0,
            this.spriteWidth, this.spriteHeight,
            0,
            0,
            displaySize,
            displaySize
          );
          
          // 2. 이미지가 있는 부분에만 밝기 효과 적용
          tempCtx.globalCompositeOperation = 'source-atop';
          tempCtx.fillStyle = 'white';
          tempCtx.globalAlpha = this.hitBrightness * 0.7;
          tempCtx.fillRect(0, 0, displaySize, displaySize);
          
          // 3. 원본 이미지 그리기
          ctx.drawImage(
            enemyImage,
            spriteX, 0,
            this.spriteWidth, this.spriteHeight,
            drawX - displaySize / 2 + this.wobbleAmount,
            drawY - displaySize / 2,
            displaySize,
            displaySize
          );
          
          // 4. 효과가 적용된 이미지 오버레이
          ctx.globalCompositeOperation = 'lighter';
          ctx.drawImage(
            tempCanvas,
            drawX - displaySize / 2 + this.wobbleAmount,
            drawY - displaySize / 2
          );
          ctx.globalCompositeOperation = 'source-over';
        } else {
          // 일반 상태: 그냥 이미지만 그리기
          ctx.drawImage(
            enemyImage,
            spriteX, 0,
            this.spriteWidth, this.spriteHeight,
            drawX - displaySize / 2 + this.wobbleAmount,
            drawY - displaySize / 2,
            displaySize,
            displaySize
          );
        }
      }
      
      ctx.restore();
    }
    
    // 체력바
    if (this.state === 'moving') {
      this.drawHealthBar(drawX, drawY);
    }
  }

  drawDying(drawX, drawY) {
      // 페이드 아웃 효과
      const progress = (gameTimeSystem.getTime() - this.stateStartTime) / this.deathDuration;
      ctx.globalAlpha = 1 - progress;
      
      // 현재 이동 상태 그리기 함수를 재활용 (코드 중복 제거)
      this.drawMoving(drawX, drawY);
      
      // 투명도 복원
      ctx.globalAlpha = 1;
  }

  drawHealthBar(drawX, drawY) {
    const barWidth = this.size * 2;
    const barHeight = 5;
    const barY = drawY - this.currentSize - 10;
    
    // 배경
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
    if (this.state === 'moving') {
      this.health -= damage;
      
      // 피격 효과 시작
      this.isHit = true;
      this.hitTime = gameTimeSystem.getTime();
      this.hitBrightness = 1;
      
      if (this.health <= 0) {
        this.startDying();
      }
    }
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

  // 적 분리 계산
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

  // 플레이어 상호작용
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
    
    // 공격 쿨다운 확인 + 플레이어가 무적 상태가 아닌 경우에만 데미지
    if (currentTime - this.lastAttackTime >= this.attackCooldown && !player.invincible) {
      player.health -= this.attackStrength;
      this.lastAttackTime = currentTime;
      
      // 피격 효과
      player.isHit = true;
      player.hitStartTime = currentTime;
      player.hitFrame = 0;
      player.hitFrameTime = 0;
      
      // 무적 상태 활성화
      player.invincible = true;
      player.invincibilityStartTime = currentTime;
      
      // 화면 흔들림
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
    
    // 체력 회복 보석 100% 드롭
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
    
    // 보물 상자 드롭 확률 증가
    if (Math.random() < 0.25) {
      gameObjects.terrain.push(new Treasure(this.x, this.y));
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
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
    
    // 플레이어와 충돌 체크
    if (detectCollision(this, player) && !player.invincible) {
      player.health -= this.damage;
      this.used = true;
      
      // 플레이어 피격 효과
      player.isHit = true;
      player.hitStartTime = gameTimeSystem.getTime();
      
      // 무적 상태 활성화
      player.invincible = true;
      player.invincibilityStartTime = gameTimeSystem.getTime();
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
    super(x, y, 8);
    this.type = type; // 0: 소, 1: 중, 2: 대, 3: 자석, 4: 체력
    this.collected = false;
    
    // 타입별 속성 설정
    switch(this.type) {
      case 0: // 소 jewel
        this.size = 10;
        this.expValue = 20;
        break;
      case 1: // 중 jewel
        this.size = 14;
        this.expValue = 50;
        break;
      case 2: // 대 jewel
        this.size = 20;
        this.expValue = 250;
        break;
      case 3: // 자석 jewel
        this.size = 20;
        this.expValue = 0;
        break;
      case 4: // 체력 jewel
        this.size = 20;
        this.expValue = 0;
        break;
    }
  }

  update() {    
    // 플레이어 주변 아이템 끌어당기기
    if (detectCollision(this, { x: player.x, y: player.y, size: player.pickupRadius })) {
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      
      // 기본 속도 계수 (자석 보석은 더 빠름)
      const speedFactor = 4;
      
      // 최대 이동 속도 설정 (픽셀/프레임)
      const maxSpeed = 6;
      
      // 이동 거리 계산 및 상한 적용
      const moveDistance = Math.min(speedFactor, maxSpeed);
      
      // 이동 적용
      this.x += Math.cos(angle) * moveDistance;
      this.y += Math.sin(angle) * moveDistance;
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

  collect() {
    if (this.collected) return;
    this.collected = true;
    
    // 보석 타입에 따른 효과 적용
    switch(this.type) {
      case 0: // 소 jewel
      case 1: // 중 jewel
      case 2: // 대 jewel
        const expGained = Math.floor(this.expValue * player.expMultiplier);
        player.exp += expGained;
        gold += this.type + 5; // 큰 보석일수록 더 많은 골드
        saveGold();
        break;
        
      case 3: // 자석 jewel - 자석 효과 활성화
        player.exp += Math.floor(this.expValue * player.expMultiplier);
        gold += 10;
        
        // 자석 효과 활성화
        player.magnetActive = true;
        player.magnetDuration = player.magnetMaxDuration;
        
      case 4: // 체력 jewel - 최대 체력의 30% 회복
        const healAmount = Math.floor(player.maxHealth * 0.3);
        player.health = Math.min(player.health + healAmount, player.maxHealth);
        gold += 15;
        break;
    }
    
    checkLevelUp();
  }
}

// 가중치 기반으로 보석 타입을 결정하는 함수
function getWeightedRandomJewelType() {
  // 총 가중치 계산
  const totalWeight = Object.values(JEWEL_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
  
  // 0부터 총 가중치 사이의 랜덤 값 생성
  let random = Math.random() * totalWeight;
  
  // 가중치에 따른 선택
  if ((random -= JEWEL_WEIGHTS.SMALL) <= 0) {
    return JEWEL_TYPES.SMALL;
  }
  if ((random -= JEWEL_WEIGHTS.MEDIUM) <= 0) {
    return JEWEL_TYPES.MEDIUM;
  }
  if ((random -= JEWEL_WEIGHTS.LARGE) <= 0) {
    return JEWEL_TYPES.LARGE;
  }
  if ((random -= JEWEL_WEIGHTS.HEALTH) <= 0) {
    return JEWEL_TYPES.HEALTH;
  }
  return JEWEL_TYPES.MAGNET;
}

class Treasure extends GameObject {
  constructor(x, y) {
    super(x, y, 32);
    this.collected = false;
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
// 게임 관리 기능들
//----------------------

// 레벨업 시스템
function checkLevelUp() {
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
  
  // 레벨업 화면 띄우기
  if (leveledUp) {
    isArtifactSelection = false;
    currentGameState = GAME_STATE.LEVEL_UP;
    pauseStartTime = gameTimeSystem.getTime();
    generateLevelUpOptions();
  }
}

// 레벨업 옵션 생성
function generateLevelUpOptions() {
  isArtifactSelection = false;
  
  const allUpgrades = [
    { type: 'attackPower', name: '공격력 증가', value: 0.2, description: '공격력 +20%' },
    { type: 'maxHealth', name: '최대 체력 증가', value: 20, description: '최대 체력 +20' },
    { type: 'cooldownReduction', name: '쿨타임 감소', value: 0.1, description: '쿨타임 -10%' },
    { type: 'projectileSpeed', name: '투사체 속도', value: 0.2, description: '투사체 속도 +20%' },
    { type: 'moveSpeed', name: '이동속도 증가', value: 0.3, description: '이동속도 +0.3' },
    { type: 'pickupRadius', name: '획득 범위 증가', value: 20, description: '아이템 획득 범위 +20' },
    { type: 'expMultiplier', name: '경험치 증가', value: 0.1, description: '경험치 획득량 +10%' },
    
    // 무기 옵션들
    { type: 'weapon', weaponType: 'orbit', name: '회전 구체', description: '플레이어 주변을 회전하며 공격' },
    { type: 'weapon', weaponType: 'flame', name: '화염방사기', description: '넓은 범위의 지속 데미지' },
    { type: 'weapon', weaponType: 'lightning', name: '번개 사슬', description: '적들 사이를 튀는 번개' },
  ];
  
  // 플레이어가 이미 가지고 있는 무기 필터링
  const playerWeaponTypes = player.weapons.map(w => w.constructor.name);
  const availableUpgrades = allUpgrades.filter(upgrade => {
    if (upgrade.type === 'weapon') {
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
  hoveredLevelUpOption = -1; // 초기에는 선택된 옵션 없음
}

// 아티팩트 옵션 생성
function generateArtifactOptions() {
  const allArtifacts = [
    { id: 1, name: '작은 체구', description: '크기 25% 감소', effect: 'reducePlayerSize' },
    { id: 2, name: '강력한 공격', description: '공격력 50% 증가', effect: 'increaseAttackPower' },
    { id: 3, name: '빠른 손놀림', description: '쿨타임 50% 감소', effect: 'increaseCooldownReduction' },
    { id: 4, name: '신속한 발걸음', description: '이동속도 50% 증가', effect: 'increaseMoveSpeed' },
    { id: 5, name: '생명의 샘', description: '초당 체력 2% 회복', effect: 'enableHealthRegen' },
    { id: 6, name: '적 둔화', description: '적 이동속도 50% 감소', effect: 'reduceEnemySpeed' },
    { id: 7, name: '약화된 적', description: '적 체력 25% 감소', effect: 'reduceEnemyHealth' }
  ];
  
  // 이미 획득한 아티팩트 제외
  const availableArtifacts = allArtifacts.filter(artifact => 
    !player.acquiredArtifacts.includes(artifact.id));
  
  levelUpOptions = [];
  
  if (availableArtifacts.length === 0) {
    // 가능한 아티팩트가 없으면 경험치 제공 옵션만 생성
    for (let i = 0; i < 4; i++) {
      const xpGain = Math.floor((player.nextLevelExp) * 0.3);
      levelUpOptions.push({
        type: 'expGain',
        name: '경험치 획득',
        description: `${xpGain} 경험치 획득 (30%)`,
        value: xpGain,
        artifactId: 0
      });
    }
  } else {
    // 랜덤하게 아티팩트 선택
    const shuffled = [...availableArtifacts].sort(() => Math.random() - 0.5);
    const artifactCount = Math.min(4, availableArtifacts.length);
    
    // 선택 가능한 아티팩트 추가
    for (let i = 0; i < artifactCount; i++) {
      const artifact = shuffled[i];
      levelUpOptions.push({
        type: artifact.effect,
        name: artifact.name,
        description: artifact.description,
        artifactId: artifact.id
      });
    }
    
    // 부족한 선택지를 경험치 획득 옵션으로 채우기
    const remainingSlots = 4 - artifactCount;
    if (remainingSlots > 0) {
      for (let i = 0; i < remainingSlots; i++) {
        const xpGain = Math.floor((player.nextLevelExp) * 0.3);
        levelUpOptions.push({
          type: 'expGain',
          name: '경험치 획득',
          description: `${xpGain} 경험치 획득 (30%)`,
          value: xpGain,
          artifactId: 0
        });
      }
    }
  }
  
  hoveredLevelUpOption = -1; // 초기에는 선택된 옵션 없음
  isArtifactSelection = true;
}

// 레벨업 선택 적용
function applyLevelUpChoice(optionIndex) {
  console.log("Applying level up choice:", optionIndex); // 디버깅용
  
  if (optionIndex === undefined || optionIndex === -1 || !levelUpOptions[optionIndex]) {
    console.log("Invalid option index:", optionIndex);
    return;
  }
  
  const option = levelUpOptions[optionIndex];
  console.log("Selected option:", option);

  if (option.type === 'weapon') {
    addWeapon(option.weaponType);
  } else {
    if (isArtifactSelection) {
      // 아티팩트 효과 적용
      switch(option.type) {
        case 'reducePlayerSize':
          player.size *= 0.75;
          break;
        case 'increaseAttackPower':
          player.attackPower *= 1.5;
          break;
        case 'increaseCooldownReduction':
          player.cooldownReduction += 0.3; // 쿨타임 30% 감소
          player.cooldownReduction = Math.min(player.cooldownReduction, 0.8); // 최대 값 제한
          player.weapons.forEach(weapon => {
            weapon.updateCooldown(player.cooldownReduction);
          });
          break;
        case 'increaseMoveSpeed':
          player.speed *= 1.5;
          break;
        case 'enableHealthRegen':
          player.healthRegeneration = 0.02;
          break;
        case 'reduceEnemySpeed':
          player.enemySpeedReduction = 0.5;
          break;
        case 'reduceEnemyHealth':
          player.enemyHealthReduction = 0.25;
          break;
        case 'expGain':
          player.exp += option.value;
          
          currentGameState = GAME_STATE.PLAYING;
          totalPausedTime += gameTimeSystem.getTime() - pauseStartTime;
          
          // 경험치 획득 후 레벨업 체크
          checkLevelUp();
          return;
      }
      
      // 아티팩트 ID 기록
      if (option.artifactId && option.artifactId !== 0) {
        player.acquiredArtifacts.push(option.artifactId);
      }
      
      isArtifactSelection = false;
    } else {
      // 일반 레벨업 옵션 적용
      switch(option.type) {
        case 'attackPower':
          player.attackPower += option.value;
          break;
        case 'maxHealth':
          player.maxHealth += option.value;
          player.health = player.maxHealth;
          break;
        case 'cooldownReduction':
          player.cooldownReduction += option.value;
          // 최대 값 제한 (80% 이상 감소 방지)
          player.cooldownReduction = Math.min(player.cooldownReduction, 0.8);
          player.weapons.forEach(weapon => {
            weapon.updateCooldown(player.cooldownReduction);
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
  }
  
  // 게임 재개
  console.log("Resuming game after level up choice");
  currentGameState = GAME_STATE.PLAYING;
  totalPausedTime += gameTimeSystem.getTime() - pauseStartTime;
}

// 무기 추가
function addWeapon(weaponType) {
  const weapon = WeaponFactory.createWeapon(weaponType);
  weapon.updateCooldown(player.cooldownReduction);
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

function resetGame() {
  // 플레이어 초기화
  player.x = 0;
  player.y = 0;
  player.health = player.maxHealth;
  player.level = 1;
  player.exp = 0;
  player.nextLevelExp = 50;
  player.prevLevelExp = 0;
  player.weapons = [new BasicWeapon()];

  // 무적 상태 초기화
  player.invincible = false;
  player.invincibilityStartTime = 0;
  
  // 아티팩트 초기화
  player.acquiredArtifacts = [];
  player.healthRegeneration = 0;
  player.enemySpeedReduction = 0;
  player.enemyHealthReduction = 0;

  // 게임 오브젝트 초기화
  gameObjects.bullets = [];
  gameObjects.enemies = [];
  gameObjects.jewels = [];
  gameObjects.terrain = [];
  gameObjects.chunks = {};
  gold = loadGold(); // 저장된 골드 불러오기

  // 능력치 초기화
  player.attackPower = 1;
  player.cooldownReduction = 0;
  player.projectileSpeed = 1;
  player.pickupRadius = 100;
  player.expMultiplier = 1;
  
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
  lastEnemySpawnTime = gameTimeSystem.getTime(); // 게임 시간으로 초기화
  screenShakeTime = 0;
  screenShakeIntensity = 0;
  
  // 자석 효과 초기화
  player.magnetActive = false;
  player.magnetDuration = 0;
}

function restartGame() {
  resetGame();
  currentGameState = GAME_STATE.START_SCREEN;
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
  // 아티팩트/레벨업에 따른 색상
  const bgColor = isArtifactSelection ? 
    (isHovered ? 'rgba(218, 165, 32, 0.8)' : 'rgba(139, 69, 19, 0.8)') :
    (isHovered ? 'rgba(69, 162, 158, 0.8)' : 'rgba(31, 40, 51, 0.8)');
  
  const borderColor = isArtifactSelection ?
    (isHovered ? '#FFD700' : '#CD853F') :
    (isHovered ? '#66fcf1' : '#45a29e');
  
  // 박스 배경
  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y, width, height);
  
  // 박스 테두리
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = isHovered ? 3 : 1;
  ctx.strokeRect(x, y, width, height);
  
  // 아이콘 위치 및 크기
  const iconSize = 80; // 더 크게
  const iconX = x + (width - iconSize) / 2; // 가운데 정렬
  const iconY = y + 40; // 상단에 위치하되 약간 여백 줌
  
  // 아이콘 그리기
  if (isArtifactSelection) {
    if (assetManager.loaded.artifactIcons && assetManager.images.artifactIcons[option.type]) {
      ctx.drawImage(assetManager.images.artifactIcons[option.type], iconX, iconY, iconSize, iconSize);
    }
  } else {
    // 무기 옵션인 경우
    if (option.type === 'weapon' && assetManager.loaded.weaponIcons && assetManager.images.weaponIcons[option.weaponType]) {
      ctx.drawImage(assetManager.images.weaponIcons[option.weaponType], iconX, iconY, iconSize, iconSize);
    } 
    // 일반 레벨업 옵션인 경우
    else if (assetManager.loaded.levelUpIcons && assetManager.images.levelUpIcons[option.type]) {
      ctx.drawImage(assetManager.images.levelUpIcons[option.type], iconX, iconY, iconSize, iconSize);
    }
  }
  
  // 옵션 텍스트 - 아이콘 아래에 위치
  const textStartY = iconY + iconSize + 30; // 아이콘과 텍스트 사이 간격
  
  // 이름
  ctx.fillStyle = isHovered ? '#FFFFFF' : (isArtifactSelection ? '#F0E68C' : '#ffffff');
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(option.name, x + width/2, textStartY);
  
  // 설명
  ctx.fillStyle = isHovered ? (isArtifactSelection ? '#F0E68C' : '#ffffff') : '#c5c6c7';
  ctx.font = '18px Arial';
  ctx.textAlign = 'center';
  
  // 설명이 길면 여러 줄로 나누기
  const maxLineWidth = width - 20;
  const words = option.description.split(' ');
  let line = '';
  let lineY = textStartY + 30;
  
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxLineWidth && i > 0) {
      ctx.fillText(line, x + width/2, lineY);
      line = words[i] + ' ';
      lineY += 25; // 줄 간격
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x + width/2, lineY);
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

function drawStartScreen() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 제목
  ctx.fillStyle = '#55AAFF';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('뱀파이어 서바이벌', canvas.width / 2, canvas.height / 3 + 50);
  
  // 캐릭터 미리보기
  const previewSize = player.size * 3;
  const previewX = canvas.width / 2;
  const previewY = canvas.height / 3 + 70;
  
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
      previewX - previewSize * 2,
      previewY - previewSize * 2 - 150,
      previewSize * 4,
      previewSize * 4
    );
  }
  
  // 메뉴 옵션
  ctx.font = '24px Arial';
  
  // 마우스에 기반한 hover 효과
  const startButtonX = canvas.width / 2 - 75;
  const startButtonY = canvas.height / 2 + 30;
  const buttonWidth = 150;
  const buttonHeight = 40;
  const settingsButtonY = canvas.height / 2 + 80;
  
  // 마우스가 시작 버튼 위에 있는지 확인
  const isStartHovered = mouseX >= startButtonX && mouseX <= startButtonX + buttonWidth &&
                         mouseY >= startButtonY && mouseY <= startButtonY + buttonHeight;
  
  // 마우스가 설정 버튼 위에 있는지 확인
  const isSettingsHovered = mouseX >= startButtonX && mouseX <= startButtonX + buttonWidth &&
                           mouseY >= settingsButtonY && mouseY <= settingsButtonY + buttonHeight;
  
  // 시작 버튼 그리기
  ctx.fillStyle = isStartHovered ? '#66fcf1' : '#45a29e';
  ctx.fillRect(startButtonX, startButtonY, buttonWidth, buttonHeight);
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(startButtonX, startButtonY, buttonWidth, buttonHeight);
  ctx.fillStyle = isStartHovered ? '#0b0c10' : '#ffffff';
  ctx.fillText('시작', canvas.width / 2, startButtonY + buttonHeight/2 + 5);
  
  // 설정 버튼 그리기
  ctx.fillStyle = isSettingsHovered ? '#66fcf1' : '#45a29e';
  ctx.fillRect(startButtonX, settingsButtonY, buttonWidth, buttonHeight);
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(startButtonX, settingsButtonY, buttonWidth, buttonHeight);
  ctx.fillStyle = isSettingsHovered ? '#0b0c10' : '#ffffff';
  ctx.fillText('설정', canvas.width / 2, settingsButtonY + buttonHeight/2 + 5);
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
  const previewSize = player.size * 4;
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
  
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '24px Arial';
  ctx.fillText(`최종 골드: ${gold}`, canvas.width / 2, canvas.height / 2);
  ctx.fillText('클릭하여 다시 시작하세요', canvas.width / 2, canvas.height / 2 + 50);
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
  ctx.font = '18px Arial';
  ctx.textAlign = 'left';
  drawTextWithStroke(`Gold: ${gold}`, 20, 30, '#66fcf1', '#000000');
  
  // 레벨 (화면 하단)
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  drawTextWithStroke(`LEVEL ${player.level}`, canvas.width / 2, canvas.height - 40, '#ffff00', '#000000');
  
  // 경험치 바 (화면 최하단)
  const expBarHeight = 20;
  const expBarY = canvas.height - expBarHeight;
  
  // 경험치 바 배경
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, expBarY, canvas.width, expBarHeight);
  
  // 경험치 바 진행도
  const expProgress = player.exp / player.nextLevelExp;
  ctx.fillStyle = '#00ff00';
  ctx.fillRect(0, expBarY, canvas.width * expProgress, expBarHeight);
  
  // 테두리
  ctx.strokeStyle = '#66fcf1';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, expBarY, canvas.width, expBarHeight);
  
  // 경험치 텍스트
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  drawTextWithStroke(`${player.exp} / ${player.nextLevelExp}`, canvas.width / 2, expBarY + 15, '#ffffff', '#000000', 2);
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

  // 지형 그리기
  gameObjects.terrain.forEach(feature => {
    feature.draw(offsetX, offsetY);
  });

  // 보석 그리기
  gameObjects.jewels.forEach(jewel => {
    jewel.draw(offsetX, offsetY);
  });

  // 적 그리기
  gameObjects.enemies.forEach(enemy => {
    enemy.draw(offsetX, offsetY);
  });

  // 플레이어 그리기
  if (player.image && player.image.complete) {
    const playerSize = player.size * 2;
    
    // 현재 프레임 위치 계산
    const spriteX = player.currentFrame * player.spriteWidth;
    const spriteY = player.animationState === 'idle' ? 0 : player.spriteHeight;
    
    // 피격 효과 처리
    if (player.isHit) {
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
      
      // 피격 효과 (빨간색 오버레이)
      const currentTime = gameTimeSystem.getTime();
      const hitProgress = (currentTime - player.hitStartTime) / player.hitDuration;
      const blinkSpeed = 10;
      const alpha = Math.abs(Math.sin(hitProgress * Math.PI * blinkSpeed)) * 0.8;
      
      tempCtx.globalCompositeOperation = 'source-atop';
      tempCtx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
      tempCtx.fillRect(0, 0, playerSize * 2, playerSize * 2);
      
      // 최종 이미지 그리기
      ctx.drawImage(
        tempCanvas,
        canvas.width / 2 - playerSize,
        canvas.height / 2 - playerSize
      );
      
      // 피격 효과 이미지
      if (assetManager.loaded.hitEffect) {
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
      // 일반 상태 그리기
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
  const healthBarY = canvas.height / 2 - player.size * 2 - 20;
  
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
  
  // HUD 그리기
  drawHUD();

  // 총알 그리기(draw 함수 마지막에 그려서 가장 우선적으로 보이게 하기)
  gameObjects.bullets.forEach(bullet => {
    bullet.draw(offsetX, offsetY);
  });
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
  if (currentLevel === 9) {
    xp += 5000; // 레벨 10 도달용 추가 경험치
  } else if (currentLevel === 29) {
    xp += 20000; // 레벨 30 도달용 추가 경험치
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
      const distance = Math.hypot(dx, dy);
      
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
  } // 닫는 중괄호 추가
  
  // 보물 생성 (5% 확률)
  if (Math.random() < 0.05) {
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

// 적 스폰 시스템
function spawnEnemyAroundPlayer() {
  // 최대 적 수 체크
  if (gameObjects.enemies.length >= MAX_ENEMIES) {
    return;
  }

  // 경과 시간에 따른 스폰 간격 조정 (시간이 지날수록 빨라짐)
  let currentSpawnInterval = ENEMY_SPAWN_INTERVAL;
  if (elapsedTime > 60) {
    currentSpawnInterval = Math.max(200, ENEMY_SPAWN_INTERVAL - (elapsedTime - 60) / 10);
  }
  
  // 스폰 간격 체크
  const currentTime = gameTimeSystem.getTime();
  if (currentTime - lastEnemySpawnTime < ENEMY_SPAWN_INTERVAL) {
    return;
  }
  
  // 360도를 8개 섹터로 나누기
  const sectors = 8;
  const sectorAngle = (Math.PI * 2) / sectors;
  let possibleAngles = [];
  
  // 각 섹터별 적 수 확인
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
  
  // 랜덤 각도 선택
  const spawnAngle = possibleAngles[Math.floor(Math.random() * possibleAngles.length)];
  const spawnDistance = MIN_SPAWN_DISTANCE + Math.random() * (MAX_SPAWN_DISTANCE - MIN_SPAWN_DISTANCE);
  
  const spawnX = player.x + Math.cos(spawnAngle) * spawnDistance;
  const spawnY = player.y + Math.sin(spawnAngle) * spawnDistance;
  
  // 스폰 위치 유효성 확인
  if (isValidSpawnPosition(spawnX, spawnY)) {
    // 적 타입 선택
    let selectedType;
    
    // 보스는 일정 시간/레벨 이후 5% 확률로 등장
    if (elapsedTime > 180 && player.level >= 10 && Math.random() < 0.05) {
      selectedType = ENEMY_TYPES.BOSS;
    } else {
      // 가중치 기반 선택
      const totalWeight = Object.values(ENEMY_TYPES)
        .filter(type => type.spawnWeight > 0)
        .reduce((sum, type) => sum + type.spawnWeight, 0);
      
      let randomWeight = Math.random() * totalWeight;
      for (const type of Object.values(ENEMY_TYPES)) {
        if (type.spawnWeight <= 0) continue;
        
        randomWeight -= type.spawnWeight;
        if (randomWeight <= 0) {
          selectedType = type;
          break;
        }
      }
      // 기본값
      if (!selectedType) selectedType = ENEMY_TYPES.NORMAL;
    }
    
    // 선택된 타입으로 적 생성
    let enemy;
    
    // 보스 타입인 경우
    if (selectedType.isBoss) {
      enemy = new BossEnemy(spawnX, spawnY);
    } 
    // 일반 적 타입
    else {
      // 아티팩트 효과 적용
      const enemySpeed = (selectedType.speedBase + Math.random() * selectedType.speedVariance) 
                         * (1 - player.enemySpeedReduction);
      const enemyHealth = Math.floor((selectedType.healthBase + Math.floor((player.level - 1) * selectedType.healthPerLevel)) 
                         * (1 - player.enemyHealthReduction));
      const enemyAttack = selectedType.attackBase + Math.floor((player.level - 1) * selectedType.attackPerLevel);
      
      enemy = new Enemy(spawnX, spawnY, selectedType.size, enemySpeed, enemyHealth, enemyAttack);
      
      // 추가 속성 설정
      enemy.type = selectedType.name;
      enemy.expValue = selectedType.expValue;
      enemy.goldValue = selectedType.goldValue;

      // SHOOTER 타입 속성 추가
      if (selectedType.canShoot) {
        enemy.canShoot = true;
        enemy.shootCooldown = selectedType.shootCooldown;
      }
      
      // 적 타입별 스프라이트 설정
      if (selectedType.name === "Fast") {
        enemy.spriteIndex = 1;      // 스프라이트 시트에서의 인덱스
      } else if (selectedType.name === "Tank") {
        enemy.spriteIndex = 2;
      } else if (selectedType.name === "Shooter") {
        enemy.spriteIndex = 3;
      } else {
        enemy.spriteIndex = 0;
      }
    }
    
    gameObjects.enemies.push(enemy);
    lastEnemySpawnTime = currentTime;
  }
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

// 자동 발사
function autoFireAtNearestEnemy() {
  const nearestEnemy = findNearestEnemy();
  
  if (nearestEnemy) {
    const now = gameTimeSystem.getTime();
    if (!player.lastFireTime || now - player.lastFireTime >= 500) {
      fireWeapon();
      player.lastFireTime = now;
    }
  }
}

function fireWeapon() {
  if (player.aimAngle !== undefined) {
    gameObjects.bullets.push(
      new Bullet(
        player.x,
        player.y,
        5,
        7,
        player.aimAngle,
        10 // 기본 데미지
      )
    );
  }
}

// 게임 메인 업데이트
function update() {
  // 경과 시간 계산
  if (currentGameState === GAME_STATE.PLAYING) {
    const currentTime = gameTimeSystem.getTime();
    const totalElapsed = currentTime - gameStartTime - totalPausedTime;
    elapsedTime = Math.floor(totalElapsed / 1000);
  }

  // 마우스 월드 좌표 재계산 - 이 코드를 추가
  const rect = canvas.getBoundingClientRect();
  mouseWorldX = player.x + (mouseX - canvas.width / 2);
  mouseWorldY = player.y + (mouseY - canvas.height / 2);
  
  // 플레이어 이동
  let dx = 0;
  let dy = 0;
  let playerMoved = false;
  
  // 월드 좌표와 플레이어 좌표 차이로 방향 계산
  const targetX = mouseWorldX;
  const targetY = mouseWorldY;
  
  // 플레이어와 마우스 사이의 거리 계산
  const distX = targetX - player.x;
  const distY = targetY - player.y;
  const distance = Math.sqrt(distX * distX + distY * distY);
  
  // 거리에 따른 속도 계수 계산
  let speedFactor = 0;
  if (distance > 30) {
    if (distance >= 80) {
      speedFactor = 1; // 최대 속도
    } else {
      // 15-50 범위에서 선형적으로 속도 증가
      speedFactor = (distance - 30) / (80 - 30);
    }
    
    playerMoved = true;
    
    // 정규화된 방향 벡터 계산
    dx = distX / distance;
    dy = distY / distance;
    
    // 플레이어 이동 (속도 계수 적용)
    player.x += dx * player.speed * speedFactor;
    player.y += dy * player.speed * speedFactor;
    
    // 방향 업데이트
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
  spawnEnemyAroundPlayer();

  // 공간 분할 그리드 업데이트
  updateEnemySpatialGrid();
  
  // 플레이어 조준
  updatePlayerAim();
  
  // 자동 발사
  autoFireAtNearestEnemy();

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

      // 플레이어 충돌 체크
      if (detectCollision(player, jewel)) {
        jewel.collect();
        gameObjects.jewels.splice(i, 1);
      }
    }
  }

  // 자석 효과 업데이트
  if (player.magnetActive) {
    // 지속 시간 감소
    player.magnetDuration -= 16; // 프레임당 시간 감소 (60fps 기준)
    
    if (player.magnetDuration <= 0) {
      player.magnetActive = false;
    } else {
      // 모든 보석을 플레이어에게 끌어당기기
      for (let jewel of gameObjects.jewels) {
        const dx = player.x - jewel.x;
        const dy = player.y - jewel.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 800) { // 자석 효과의 범위
          // 거리에 따라 끌어당김 강도 조절
          const strength = 0.1 + (1 - Math.min(dist, 500) / 500) * 0.3;
          
          // 최대 속도 상한 설정 (픽셀/프레임)
          const maxSpeed = 8;
          
          // 이동량 계산 및 상한 적용
          const moveX = dx * strength;
          const moveY = dy * strength;
          const moveDistance = Math.sqrt(moveX * moveX + moveY * moveY);
          
          // 속도가 최대값을 초과하는 경우 정규화
          if (moveDistance > maxSpeed && moveDistance > 0) {
            const normalizedX = moveX / moveDistance * maxSpeed;
            const normalizedY = moveY / moveDistance * maxSpeed;
            jewel.x += normalizedX;
            jewel.y += normalizedY;
          } else {
            // 속도가 최대값 이하인 경우 그대로 적용
            jewel.x += moveX;
            jewel.y += moveY;
          }
        }
      }
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

  // 체력 재생 적용
  if (player.healthRegeneration > 0) {
    const regenAmount = player.maxHealth * player.healthRegeneration / 60;
    player.health = Math.min(player.health + regenAmount, player.maxHealth);
  }
  
  // 보물 충돌 체크
  for (let i = gameObjects.terrain.length - 1; i >= 0; i--) {
    const feature = gameObjects.terrain[i];
    if (feature instanceof Treasure) {
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
  
  // 키보드 조작
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
    }
    e.preventDefault();
  }
});

document.removeEventListener('keyup', (e) => {
  keys[e.key] = false;
});

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
  console.log("Mouse clicked, game state:", currentGameState); // 디버깅용

  switch(currentGameState) {
    case GAME_STATE.START_SCREEN:
      handleStartScreenClick();
      break;
    case GAME_STATE.SETTINGS:
      handleSettingsScreenClick();
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
  const centerX = canvas.width / 2;
  const startY = canvas.height / 2 + 50;
  const settingsY = canvas.height / 2 + 100;
  const buttonWidth = 150;
  const buttonHeight = 40;
  
  // '시작' 버튼 클릭 감지
  if (mouseX > centerX - buttonWidth/2 && mouseX < centerX + buttonWidth/2 &&
      mouseY > startY - buttonHeight/2 && mouseY < startY + buttonHeight/2) {
    startGame();
  }
  // '설정' 버튼 클릭 감지
  else if (mouseX > centerX - buttonWidth/2 && mouseX < centerX + buttonWidth/2 &&
           mouseY > settingsY - buttonHeight/2 && mouseY < settingsY + buttonHeight/2) {
    previousCharacterIndex = player.characterType - 1;
    currentCharacterIndex = previousCharacterIndex;
    currentGameState = GAME_STATE.SETTINGS;
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
    
    // 로딩 상태 처리
    if (currentGameState === GAME_STATE.LOADING) {
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
      // 경과 시간 계산 - 게임 시계 기반
      const currentGameTime = gameTimeSystem.getTime();
      elapsedTime = Math.floor(currentGameTime / 1000);
      
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
