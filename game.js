// Get the canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game dimensions and scaling
const BASE_WIDTH = 800;
const BASE_HEIGHT = 600;
let CANVAS_WIDTH = BASE_WIDTH;
let CANVAS_HEIGHT = BASE_HEIGHT;
const CHUNK_SIZE = 500; // Size of each chunk in pixels

// Game objects
const gameObjects = {
  chunks: {}, 
  terrain: [],
  bullets: [],
  enemies: [],
  jewels: []
};

// Game state
let score = 0;
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
const ENEMY_SPAWN_INTERVAL = 50;
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
      levelUpIcons: {},
      artifactIcons: {},
      hitEffect: null,
      treasure: null,
      enemy: null,
      jewels: []
    };
    this.loaded = {
      players: false,
      mapTiles: false,
      weapons: false,
      levelUpIcons: false,
      artifactIcons: false,
      hitEffect: false,
      treasure: false,
      enemy: false,
      jewels: false
    };
  }

  loadAll(callback) {
    this.loadPlayerImages();
    this.loadMapTiles();
    this.loadWeaponImages();
    this.loadLevelUpIcons();
    this.loadArtifactIcons();
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
      img.src = `./img/map_tile_${i}.png`;
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
      'bullet', 'orbit', 'flame', 'lightningChain', 
      'lightningImpact', 'boomerang', 'soul', 'axe', 'wave', 'bible'
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

  loadLevelUpIcons() {
    const iconTypes = [
      'attackPower', 'maxHealth', 'fireRate', 'projectileSpeed',
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
      'reducePlayerSize', 'increaseAttackPower', 'increaseFireRate',
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

  loadMiscImages() {
    // 보물 이미지
    this.images.treasure = new Image();
    this.images.treasure.src = './img/treasure.png';
    this.images.treasure.onload = () => {
      this.loaded.treasure = true;
      console.log('보물 이미지 로드 완료');
    };
    
    // 적 이미지 추가
    this.images.enemy = new Image();
    this.images.enemy.src = './img/enemy_sprites.png';
    this.images.enemy.onload = () => {
      this.loaded.enemy = true;
      console.log('적 스프라이트 시트 로드 완료');
    };
    
    // 피격 효과 이미지
    this.images.hitEffect = new Image();
    this.images.hitEffect.src = './img/hit_effect.png';
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
      img.src = `./img/jewel_${i}.png`; // 이미지 파일 경로: ./img/jewel_0.png, jewel_1.png, ...
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
  speed: 3,
  attackPower: 1,
  fireRate: 1,
  projectileSpeed: 1,
  pickupRadius: 100,
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
  frameDuration: 150
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
    this.baseAttackSpeed = config.baseAttackSpeed || 1000;
    this.attackSpeed = this.baseAttackSpeed;
    this.lastAttackTime = Date.now();
    this.damage = config.damage || 10;
    
    // 무기별 추가 속성들
    Object.assign(this, config.properties || {});
  }

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
    // 하위 클래스에서 구현
  }
}

// 기본 총알 클래스
class BasicWeapon extends Weapon {
  constructor() {
    super({
      type: 'basic',
      baseAttackSpeed: 1000,
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

// 오비트 무기 클래스
class OrbitWeapon extends Weapon {
  constructor() {
    super({
      type: 'orbit',
      baseAttackSpeed: 50,
      damage: 8
    });
    this.orbitRadius = 50;
    this.orbitSpeed = 0.05;
    this.orbitAngle = 0;
    this.bulletCount = 3;
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
      
      // 실제 총알 생성
      const bullet = new OrbitBullet(
        bulletX, bulletY, 8, 0, bulletAngle, 8 * player.attackPower
      );
      
      // 충돌 검사를 위해 배열에 추가
      gameObjects.bullets.push(bullet);
      
      // 적과 충돌 검사
      for (let enemy of gameObjects.enemies) {
        if (enemy.state === 'moving' && detectCollision(bullet, enemy)) {
          enemy.takeDamage(bullet.damage);
          bullet.used = true;
        }
      }
    });
  }
}

// 오비트 총알 클래스
class OrbitBullet extends Bullet {
  constructor(x, y, size, speed, angle, damage) {
    super(x, y, size, speed, angle, damage);
    this.lifeTime = 1;
    this.rotationAngle = Math.random() * Math.PI * 2;
    this.rotationSpeed = 0.05;
  }
  
  update() {
    // 기존 코드 유지
    this.lifeTime -= 0.1;
    if (this.lifeTime <= 0) {
      this.used = true;
    }
    
    // 구체 자체가 회전하는 효과
    this.rotationAngle += this.rotationSpeed;
  }
  
  draw(offsetX, offsetY) {
    if (assetManager.loaded.weapons && assetManager.images.weapons.orbit) {
      const drawSize = this.size * 3;
      
      ctx.save();
      ctx.translate(this.x + offsetX, this.y + offsetY);
      ctx.rotate(this.rotationAngle);
      
      // 광채 효과
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#66fcf1';
      ctx.beginPath();
      ctx.arc(0, 0, drawSize * 0.7, 0, Math.PI * 2);
      ctx.fill();
      
      // 이미지 그리기
      ctx.globalAlpha = 1;
      ctx.drawImage(
        assetManager.images.weapons.orbit,
        -drawSize / 2,
        -drawSize / 2,
        drawSize,
        drawSize
      );
      
      ctx.restore();
    }
  }
}

// 화염방사기 무기 클래스
class FlamethrowerWeapon extends Weapon {
  constructor() {
    super({
      type: 'flamethrower',
      baseAttackSpeed: 100,
      damage: 3
    });
    this.range = 150;
    this.coneAngle = Math.PI / 4;
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
      
      gameObjects.bullets.push(
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
    this.currentFrame = 0;
    this.frameTime = 0;
    this.frameDuration = 100;
    
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
    for (let enemy of gameObjects.enemies) {
      if (enemy.state === 'moving' && detectCollision(this, enemy)) {
        enemy.takeDamage(this.damage);
        // 불꽃은 관통함 (사라지지 않음)
      }
    }

    // 프레임 애니메이션 업데이트
    this.frameTime += 16;
    if (this.frameTime >= this.frameDuration) {
      this.frameTime = 0;
      this.currentFrame = (this.currentFrame + 1) % 4; // flameFrames = 4로 가정
    }
  }
  
  draw(offsetX, offsetY) {
    if (assetManager.loaded.weapons && assetManager.images.weapons.flame) {
      const drawSize = this.size * 4;
      
      ctx.save();
      ctx.translate(this.x + offsetX, this.y + offsetY);
      ctx.rotate(this.angle);
      ctx.globalAlpha = this.alpha;
      
      // 스프라이트 시트에서 현재 프레임 그리기
      ctx.drawImage(
        assetManager.images.weapons.flame,
        this.currentFrame * 64, 0, // flameFrameWidth = 64로 가정
        64, 64,
        -drawSize / 2,
        -drawSize / 2,
        drawSize,
        drawSize
      );
      
      ctx.restore();
    }
  }
}

// 번개 무기 클래스
class LightningWeapon extends Weapon {
  constructor() {
    super({
      type: 'lightning',
      baseAttackSpeed: 2000,
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
    
    // 투명도는 수명에 따라 감소
    const alpha = 1 - this.age / this.maxAge;
    
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

// 나머지 무기 클래스들 추가 (아래는 기본 구현)
class BoomerangWeapon extends Weapon {
  constructor() {
    super({
      type: 'boomerang',
      baseAttackSpeed: 3000,
      damage: 20
    });
    this.maxBoomerangs = 2;
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
    // 간단한 기본 구현
    const angle = player.aimAngle || Math.random() * Math.PI * 2;
    gameObjects.bullets.push(new Bullet(
      player.x, player.y, 10, 7, angle, this.damage * player.attackPower
    ));
    this.activeBoomerangs++;
  }
  
  boomerangReturned() {
    this.activeBoomerangs--;
  }
}

class SoulExplosionWeapon extends Weapon {
  constructor() {
    super({
      type: 'soul',
      baseAttackSpeed: 5000,
      damage: 30
    });
  }
  
  fire() {
    // 간단한 기본 구현
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      gameObjects.bullets.push(new Bullet(
        player.x, player.y, 8, 6, angle, this.damage * player.attackPower
      ));
    }
  }
}

class AxeWeapon extends Weapon {
  constructor() {
    super({
      type: 'axe',
      baseAttackSpeed: 1200,
      damage: 25
    });
  }
  
  fire() {
    // 간단한 기본 구현
    const angle = Math.random() * Math.PI * 2;
    gameObjects.bullets.push(new Bullet(
      player.x, player.y, 12, 8, angle, this.damage * player.attackPower
    ));
  }
}

class WaveWeapon extends Weapon {
  constructor() {
    super({
      type: 'wave',
      baseAttackSpeed: 4000,
      damage: 15
    });
  }
  
  fire() {
    // 간단한 기본 구현
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      gameObjects.bullets.push(new Bullet(
        player.x, player.y, 8, 4, angle, this.damage * player.attackPower
      ));
    }
  }
}

class BibleWeapon extends Weapon {
  constructor() {
    super({
      type: 'bible',
      baseAttackSpeed: 5000,
      damage: 15
    });
    this.maxBibles = 3;
  }
  
  fire() {
    // 간단한 기본 구현
    for (let i = 0; i < this.maxBibles; i++) {
      const angle = (Math.PI * 2 * i) / this.maxBibles;
      gameObjects.bullets.push(new Bullet(
        player.x, player.y, 8, 4, angle, this.damage * player.attackPower
      ));
    }
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
      case 'flamethrower':
        return new FlamethrowerWeapon();
      case 'lightning':
        return new LightningWeapon();
      case 'boomerang':
        return new BoomerangWeapon();
      case 'soul':
        return new SoulExplosionWeapon();
      case 'axe':
        return new AxeWeapon();
      case 'wave':
        return new WaveWeapon();
      case 'bible':
        return new BibleWeapon();
      default:
        return new BasicWeapon();
    }
  },
  
  upgradeWeapon(weapon) {
    if (weapon instanceof OrbitWeapon) {
      weapon.bulletCount += 1;
      weapon.orbitRadius += 10;
    } else if (weapon instanceof FlamethrowerWeapon) {
      weapon.range += 50;
      weapon.coneAngle += Math.PI / 12;
    } else if (weapon instanceof LightningWeapon) {
      weapon.chainCount += 1;
      weapon.chainRange += 25;
    } else if (weapon instanceof BoomerangWeapon) {
      weapon.maxBoomerangs += 1;
    }
    
    weapon.updateFireRate(player.fireRate);
  }
};

//----------------------
// Enemy 클래스
//----------------------

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
    this.stateStartTime = Date.now();
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
    
    // 피격 효과 관련 속성
    this.isHit = false;
    this.hitTime = 0;
    this.hitDuration = 200; // 피격 효과 지속 시간(ms)
    this.hitBrightness = 0; // 현재 밝기 효과 (0-1)
  }
  
  update() {
    const currentTime = Date.now();
    const deltaTime = 16;
    this.animationTime += deltaTime;
    
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
    this.stateStartTime = Date.now();
    
    // 경험치 및 점수 획득
    player.exp += Math.floor(3 * player.expMultiplier);
    score += 10;
    
    // 아이템 드롭
    if (Math.random() < 0.1) {
      gameObjects.jewels.push(new Jewel(this.x, this.y));
    }

    if (Math.random() < 0.05) {
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
    const progress = (Date.now() - this.stateStartTime) / this.spawnDuration;
    ctx.globalAlpha = Math.min(progress, 1);
    
    // 스폰 서클 효과
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(drawX, drawY, this.currentSize * 1.5, 0, Math.PI * 2 * progress);
    ctx.stroke();
    
    if (assetManager.loaded.enemy) {
      const displaySize = this.currentSize * 2.5;
      const defaultDirection = player.x < this.x ? 'left' : 'right';
      
      ctx.save();
      
      if (defaultDirection === 'right') {
        ctx.translate(drawX + displaySize / 2, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(
          assetManager.images.enemy,
          0, 0,
          this.spriteWidth, this.spriteHeight,
          0,
          drawY - displaySize / 2,
          displaySize,
          displaySize
        );
      } else {
        ctx.drawImage(
          assetManager.images.enemy,
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
    const currentSize = this.currentSize * pulse;
    
    // 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(drawX + 3, drawY + 5, currentSize * 0.8, currentSize * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    if (assetManager.loaded.enemy) {
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
            assetManager.images.enemy,
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
            assetManager.images.enemy,
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
            assetManager.images.enemy,
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
            assetManager.images.enemy,
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
            assetManager.images.enemy,
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
            assetManager.images.enemy,
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
    const progress = (Date.now() - this.stateStartTime) / this.deathDuration;
    ctx.globalAlpha = 1 - progress;
    
    // 간단하게 적 크기만 축소
    if (assetManager.loaded.enemy) {
      const displaySize = this.currentSize * 2.5;
      
      ctx.save();
      
      if (this.direction === 'right') {
        ctx.translate(drawX + displaySize / 2, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(
          assetManager.images.enemy,
          0, 0,
          this.spriteWidth, this.spriteHeight,
          0,
          drawY - displaySize / 2,
          displaySize,
          displaySize
        );
      } else {
        ctx.drawImage(
          assetManager.images.enemy,
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
      this.hitTime = Date.now();
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
    const currentTime = Date.now();
    
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

//----------------------
// 아이템 클래스들
//----------------------

class Jewel extends GameObject {
  constructor(x, y, type = 0) {
    super(x, y, 8);
    this.type = type; // 0: 소, 1: 중, 2: 대, 3: 자석, 4: 체력
    this.collected = false;
    this.pulseTime = 0;
    
    // 타입별 속성 설정
    switch(this.type) {
      case 0: // 소 jewel
        this.size = 6;
        this.expValue = 20;
        break;
      case 1: // 중 jewel
        this.size = 9;
        this.expValue = 100; // 5배
        break;
      case 2: // 대 jewel
        this.size = 12;
        this.expValue = 250;
        break;
      case 3: // 자석 jewel
        this.size = 10;
        this.expValue = 50;
        break;
      case 4: // 체력 jewel
        this.size = 10;
        this.expValue = 30;
        break;
    }
  }

  update() {
    // 맥동 애니메이션 효과
    this.pulseTime += 0.05;
    
    // 플레이어 주변 아이템 끌어당기기
    if (detectCollision(this, { x: player.x, y: player.y, size: player.pickupRadius })) {
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      
      // 기본 속도 계수 (자석 보석은 더 빠름)
      const speedFactor = this.type === 3 ? 3 : 2;
      
      // 최대 이동 속도 설정 (픽셀/프레임)
      const maxSpeed = 5;
      
      // 이동 거리 계산 및 상한 적용
      const moveDistance = Math.min(speedFactor, maxSpeed);
      
      // 이동 적용
      this.x += Math.cos(angle) * moveDistance;
      this.y += Math.sin(angle) * moveDistance;
    }
  }

  draw(offsetX, offsetY) {
    if (assetManager.loaded.jewels && assetManager.images.jewels[this.type]) {
      // 맥동 효과 계산
      const pulseFactor = 1 + Math.sin(this.pulseTime) * 0.2;
      const drawSize = this.size * 3 * pulseFactor; // 이미지 크기 조정
      
      ctx.drawImage(
        assetManager.images.jewels[this.type],
        0, 0,
        64, 64,
        this.x + offsetX - drawSize/2,
        this.y + offsetY - drawSize/2,
        drawSize,
        drawSize
      );
    } else {
      // 이미지가 로드되지 않았을 경우 기본 원으로 표시 (폴백)
      const colors = ['cyan', 'lightgreen', 'gold', 'magenta', 'red'];
      ctx.fillStyle = colors[this.type];
      ctx.beginPath();
      ctx.arc(this.x + offsetX, this.y + offsetY, this.size, 0, Math.PI * 2);
      ctx.fill();
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
        score += this.type + 5; // 큰 보석일수록 더 많은 점수
        break;
        
      case 3: // 자석 jewel - 자석 효과 활성화
        player.exp += Math.floor(this.expValue * player.expMultiplier);
        score += 10;
        
        // 자석 효과 활성화
        player.magnetActive = true;
        player.magnetDuration = player.magnetMaxDuration;
        
      case 4: // 체력 jewel - 최대 체력의 30% 회복
        const healAmount = Math.floor(player.maxHealth * 0.3);
        player.health = Math.min(player.health + healAmount, player.maxHealth);
        score += 15;
        break;
    }
    
    checkLevelUp();
  }
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
      pauseStartTime = Date.now();
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
    pauseStartTime = Date.now();
    generateLevelUpOptions();
  }
}

// 레벨업 옵션 생성
function generateLevelUpOptions() {
  isArtifactSelection = false;
  
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
    { id: 3, name: '빠른 손놀림', description: '공격속도 50% 증가', effect: 'increaseFireRate' },
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
          totalPausedTime += Date.now() - pauseStartTime;
          
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
  }
  
  // 게임 재개
  console.log("Resuming game after level up choice");
  currentGameState = GAME_STATE.PLAYING;
  totalPausedTime += Date.now() - pauseStartTime;
}

// 무기 추가
function addWeapon(weaponType) {
  const weapon = WeaponFactory.createWeapon(weaponType);
  weapon.updateFireRate(player.fireRate);
  player.weapons.push(weapon);
}

//----------------------
// 게임 상태 관리
//----------------------

function startGame() {
  currentGameState = GAME_STATE.LOADING;
  loadingStartTime = Date.now();
  chunksLoaded = false;
  
  resetGame();
  
  gameStartTime = Date.now();
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
    pauseStartTime = Date.now();
  }
}

function resumeGame() {
  if (currentGameState === GAME_STATE.PAUSED && previousGameState !== null) {
    const pausedDuration = Date.now() - pauseStartTime;
    totalPausedTime += pausedDuration;
    
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
  score = 0;

  // 능력치 초기화
  player.attackPower = 1;
  player.fireRate = 1;
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
  
  // 화면 효과 초기화
  screenShakeTime = 0;
  screenShakeIntensity = 0;
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
    isArtifactSelection ? '보물 발견!' : 'LEVEL UP!', 
    canvas.width / 2, 50
  );
  
  // 부제목
  if (isArtifactSelection) {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Arial';
    ctx.fillText('아티팩트를 선택하세요', canvas.width / 2, 90);
  } else {
    ctx.fillStyle = '#ffff00';
    ctx.font = '24px Arial';
    ctx.fillText(`LEVEL ${player.level}`, canvas.width / 2, canvas.height - 40);
  }
  
  // 중앙 위치 및 박스 크기
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const boxWidth = 320;
  const boxHeight = 150;
  
  // 호버된 옵션 확인 변수
  let hoveredOption = -1;
  
  // 옵션 위치 계산 및 마우스 호버 검사
  if (levelUpOptions.length === 1) {
    // 단일 옵션의 경우
    const optionX = centerX - boxWidth/2;
    const optionY = centerY - boxHeight/2;
    
    if (mouseX >= optionX && mouseX <= optionX + boxWidth &&
        mouseY >= optionY && mouseY <= optionY + boxHeight) {
      hoveredOption = 0;
    }
    
    drawOptionBox(optionX, optionY, boxWidth, boxHeight, 
                 levelUpOptions[0], hoveredOption === 0);
  } 
  else if (levelUpOptions.length === 2) {
    // 두 개 옵션의 경우
    const option1X = centerX - boxWidth - 20;
    const option1Y = centerY - boxHeight/2;
    const option2X = centerX + 20;
    const option2Y = centerY - boxHeight/2;
    
    if (mouseX >= option1X && mouseX <= option1X + boxWidth &&
        mouseY >= option1Y && mouseY <= option1Y + boxHeight) {
      hoveredOption = 0;
    }
    else if (mouseX >= option2X && mouseX <= option2X + boxWidth &&
             mouseY >= option2Y && mouseY <= option2Y + boxHeight) {
      hoveredOption = 1;
    }
    
    drawOptionBox(option1X, option1Y, boxWidth, boxHeight, 
                 levelUpOptions[0], hoveredOption === 0);
    drawOptionBox(option2X, option2Y, boxWidth, boxHeight, 
                 levelUpOptions[1], hoveredOption === 1);
  } 
  else {
    // 3-4개 옵션의 경우
    if (levelUpOptions[0]) {
      const option1X = centerX - boxWidth/2;
      const option1Y = centerY - 160 - boxHeight/2;
      
      if (mouseX >= option1X && mouseX <= option1X + boxWidth &&
          mouseY >= option1Y && mouseY <= option1Y + boxHeight) {
        hoveredOption = 0;
      }
      
      drawOptionBox(option1X, option1Y, boxWidth, boxHeight, 
                   levelUpOptions[0], hoveredOption === 0);
    }
    
    if (levelUpOptions[1]) {
      const option2X = centerX - 230 - boxWidth/2;
      const option2Y = centerY - boxHeight/2;
      
      if (mouseX >= option2X && mouseX <= option2X + boxWidth &&
          mouseY >= option2Y && mouseY <= option2Y + boxHeight) {
        hoveredOption = 1;
      }
      
      drawOptionBox(option2X, option2Y, boxWidth, boxHeight, 
                   levelUpOptions[1], hoveredOption === 1);
    }
    
    if (levelUpOptions[2]) {
      const option3X = centerX + 230 - boxWidth/2;
      const option3Y = centerY - boxHeight/2;
      
      if (mouseX >= option3X && mouseX <= option3X + boxWidth &&
          mouseY >= option3Y && mouseY <= option3Y + boxHeight) {
        hoveredOption = 2;
      }
      
      drawOptionBox(option3X, option3Y, boxWidth, boxHeight, 
                   levelUpOptions[2], hoveredOption === 2);
    }
    
    if (levelUpOptions[3]) {
      const option4X = centerX - boxWidth/2;
      const option4Y = centerY + 160 - boxHeight/2;
      
      if (mouseX >= option4X && mouseX <= option4X + boxWidth &&
          mouseY >= option4Y && mouseY <= option4Y + boxHeight) {
        hoveredOption = 3;
      }
      
      drawOptionBox(option4X, option4Y, boxWidth, boxHeight, 
                   levelUpOptions[3], hoveredOption === 3);
    }
  }
  
  // 플레이어 또는 보물 이미지
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
    if (assetManager.loaded.treasure) {
      const treasureSize = 64;
      ctx.drawImage(
        assetManager.images.treasure,
        centerX - treasureSize/2,
        centerY - treasureSize/2,
        treasureSize,
        treasureSize
      );
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
  const iconSize = 64;
  const iconX = x + 20;
  const iconY = y + (height - iconSize) / 2;
  
  // 아이콘 그리기
  if (isArtifactSelection) {
    if (assetManager.loaded.artifactIcons && assetManager.images.artifactIcons[option.type]) {
      ctx.drawImage(assetManager.images.artifactIcons[option.type], iconX, iconY, iconSize, iconSize);
    }
  } else {
    if (assetManager.loaded.levelUpIcons && assetManager.images.levelUpIcons[option.type]) {
      ctx.drawImage(assetManager.images.levelUpIcons[option.type], iconX, iconY, iconSize, iconSize);
    }
  }
  
  // 옵션 텍스트
  const textX = x + 120;
  
  // 이름
  ctx.fillStyle = isHovered ? '#FFFFFF' : (isArtifactSelection ? '#F0E68C' : '#ffffff');
  ctx.font = '24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(option.name, textX, y + height/2 - 10);
  
  // 설명
  ctx.fillStyle = isHovered ? (isArtifactSelection ? '#F0E68C' : '#ffffff') : '#c5c6c7';
  ctx.font = '18px Arial';
  ctx.fillText(option.description, textX, y + height/2 + 20);
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
  const elapsedTime = Date.now() - loadingStartTime;
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
  ctx.fillText(`최종 점수: ${score}`, canvas.width / 2, canvas.height / 2);
  ctx.fillText('클릭하여 다시 시작하세요', canvas.width / 2, canvas.height / 2 + 50);
}

function drawHUD() {
  // 경과 시간 (화면 상단 가운데)
  ctx.font = '20px Arial';
  ctx.fillStyle = '#66fcf1';
  ctx.textAlign = 'center';
  ctx.fillText(formatTime(elapsedTime), canvas.width / 2, 30);
  
  // 점수 (화면 왼쪽 위)
  ctx.font = '18px Arial';
  ctx.fillStyle = '#66fcf1';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}`, 20, 30);
  
  // 레벨 (화면 하단)
  ctx.font = '24px Arial';
  ctx.fillStyle = '#ffff00';
  ctx.textAlign = 'center';
  ctx.fillText(`LEVEL ${player.level}`, canvas.width / 2, canvas.height - 40);
  
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
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(`${player.exp} / ${player.nextLevelExp}`, canvas.width / 2, expBarY + 15);
}

function draw() {
  let screenOffsetX = 0;
  let screenOffsetY = 0;
  
  // 화면 흔들림 효과
  if (screenShakeTime > 0) {
    const vibrationSpeed = 0.08;
    const time = Date.now() * vibrationSpeed;
    
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

  // 총알 그리기
  gameObjects.bullets.forEach(bullet => {
    bullet.draw(offsetX, offsetY);
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
      const currentTime = Date.now();
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
    
    // 적절한 가중치로 보석 타입 무작위화
    let jewelType = 0; // 기본값: 소형 보석
    const rand = Math.random();
    
    if (rand < 0.7) {
      jewelType = 0; // 70% 확률로 소형 보석
    } else if (rand < 0.85) {
      jewelType = 1; // 15% 확률로 중형 보석
    } else if (rand < 0.93) {
      jewelType = 2; // 8% 확률로 대형 보석
    } else if (rand < 0.97) {
      jewelType = 4; // 4% 확률로 체력 회복 보석
    } else {
      jewelType = 3; // 3% 확률로 자석 보석
    }
    
    const jewel = new Jewel(x, y, jewelType);
    chunk.items.push(jewel);
    gameObjects.jewels.push(jewel);
  }

  // 보물 생성 (10% 확률)
  if (Math.random() < 0.1) {
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
  
  // 스폰 간격 체크
  const currentTime = Date.now();
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
    // 적 생성
    const enemySize = 20;
    // 아티팩트 효과 적용
    const enemySpeed = (0.5 + Math.random() * 0.1) * (1 - player.enemySpeedReduction);
    const enemyHealth = Math.floor((5 + Math.floor((player.level - 1) * 1.5)) * (1 - player.enemyHealthReduction));
    const enemyAttack = 10 + Math.floor((player.level - 1) * 0.5);
    
    const enemy = new Enemy(spawnX, spawnY, enemySize, enemySpeed, enemyHealth, enemyAttack);
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
    const now = Date.now();
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
    const currentTime = Date.now();
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
  if (distance > 15) {
    if (distance >= 50) {
      speedFactor = 1; // 최대 속도
    } else {
      // 15-50 범위에서 선형적으로 속도 증가
      speedFactor = (distance - 15) / (50 - 15);
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
    const currentTime = Date.now();
    
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
        
        if (dist < 1000) { // 자석 효과의 범위
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
    const currentTime = Date.now();
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
      pauseStartTime = Date.now();
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
  const centerY = canvas.height / 2;
  const boxWidth = 320;
  const boxHeight = 150;
  
  // 클릭한 옵션 찾기
  let clickedOption = -1;
  
  if (levelUpOptions.length === 1) {
    const optionX = centerX - boxWidth/2;
    const optionY = centerY - boxHeight/2;
    
    if (mouseX >= optionX && mouseX <= optionX + boxWidth &&
        mouseY >= optionY && mouseY <= optionY + boxHeight) {
      clickedOption = 0;
    }
  } 
  else if (levelUpOptions.length === 2) {
    const option1X = centerX - boxWidth - 20;
    const option1Y = centerY - boxHeight/2;
    const option2X = centerX + 20;
    const option2Y = centerY - boxHeight/2;
    
    if (mouseX >= option1X && mouseX <= option1X + boxWidth &&
        mouseY >= option1Y && mouseY <= option1Y + boxHeight) {
      clickedOption = 0;
    }
    else if (mouseX >= option2X && mouseX <= option2X + boxWidth &&
             mouseY >= option2Y && mouseY <= option2Y + boxHeight) {
      clickedOption = 1;
    }
  } 
  else {
    // 옵션 1 (상단)
    if (levelUpOptions[0]) {
      const option1X = centerX - boxWidth/2;
      const option1Y = centerY - 160 - boxHeight/2;
      
      if (mouseX >= option1X && mouseX <= option1X + boxWidth &&
          mouseY >= option1Y && mouseY <= option1Y + boxHeight) {
        clickedOption = 0;
      }
    }
    
    // 옵션 2 (좌측)
    if (levelUpOptions[1]) {
      const option2X = centerX - 230 - boxWidth/2;
      const option2Y = centerY - boxHeight/2;
      
      if (mouseX >= option2X && mouseX <= option2X + boxWidth &&
          mouseY >= option2Y && mouseY <= option2Y + boxHeight) {
        clickedOption = 1;
      }
    }
    
    // 옵션 3 (우측)
    if (levelUpOptions[2]) {
      const option3X = centerX + 230 - boxWidth/2;
      const option3Y = centerY - boxHeight/2;
      
      if (mouseX >= option3X && mouseX <= option3X + boxWidth &&
          mouseY >= option3Y && mouseY <= option3Y + boxHeight) {
        clickedOption = 2;
      }
    }
    
    // 옵션 4 (하단)
    if (levelUpOptions[3]) {
      const option4X = centerX - boxWidth/2;
      const option4Y = centerY + 160 - boxHeight/2;
      
      if (mouseX >= option4X && mouseX <= option4X + boxWidth &&
          mouseY >= option4Y && mouseY <= option4Y + boxHeight) {
        clickedOption = 3;
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
    
    // 로딩 상태 처리
    if (currentGameState === GAME_STATE.LOADING) {
      drawLoadingScreen();
      
      // 청크 로딩 완료 및 최소 로딩 시간 경과 확인
      const elapsedTime = Date.now() - loadingStartTime;
      if (chunksLoaded && elapsedTime >= loadingMinDuration) {
        currentGameState = GAME_STATE.PLAYING;
      }
    }
    // 게임 상태별 업데이트
    else if (currentGameState === GAME_STATE.PLAYING) {
      update();
      draw();
      if (player.health <= 0) {
        currentGameState = GAME_STATE.GAME_OVER;
      }
    } else if (currentGameState === GAME_STATE.LEVEL_UP) {
      draw(); // 배경으로 게임 화면 그리기
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
        draw();
        drawLevelUpScreen();
      } else {
        draw();
      }
      
      drawPauseScreen();
    } else if (currentGameState === GAME_STATE.CONFIRM_DIALOG) {
      if (previousGameState === GAME_STATE.LEVEL_UP) {
        draw();
        drawLevelUpScreen();
      } else {
        draw();
      }
      
      drawPauseScreen();
      drawConfirmDialog();
    }
  }
  
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
