// 자기장 무기 클래스
class MagneticWeapon extends Weapon {
  constructor() {
    super({
      type: 'magnetic',
      baseCooldown: 100,
      damage: 5
    });
    this.fieldRadius = 100;
    this.tickDamage = 2;
    this.damageInterval = 100;
    this.magneticField = null; // 자기장 효과 객체
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
        this.fieldRadius += 20;
        break;
      case 4:
        this.damageInterval *= 0.9;
        break;
      case 5:
        this.tickDamage += 2;
        break;
      case 6:
        this.fieldRadius += 30;
        break;
      case 7:
        this.tickDamage += 2;
        break;
      case 8:
        this.damageInterval *= 0.8;
        break;
      case 9:
        this.fieldRadius += 40;
        break;
      case 10:
        this.tickDamage += 3;
        this.damageInterval *= 0.7;
        break;
    }
    
    // 레벨업 시 기존 자기장 업데이트
    if (this.magneticField && !this.magneticField.used) {
      this.magneticField.updateStats(
        this.fieldRadius,
        this.tickDamage * player.getTotalAttackPower(),
        this.damageInterval
      );
    }
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
    const range = this.radius * player.getTotalAttackRange();
    
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
    const range = this.radius * player.getTotalAttackRange();
    
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
    
    this.beamWidth = 3;      // 레이저 빔 너비
    this.beamLength = 300;   // 레이저 빔 길이
    this.rotationSpeed = 0.02; // 회전 속도
    this.currentAngle = 0;   // 현재 빔 각도
    this.currentBeams = [];  // 현재 활성 빔들 (배열로 변경)
    this.targetTracking = true; // 타겟 추적 여부
    this.beamCount = 1;      // 빔 개수 추가
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
    
    // 현재 빔들 업데이트
    this.currentBeams.forEach(beam => {
      if (beam && !beam.expired) {
        beam.updateStats(this.beamLength, this.beamWidth, this.damage * player.getTotalRangedAttackPower());
      }
    });
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
      this.damage * player.getTotalRangedAttackPower()
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
  constructor(x, y, angle, speed, maxRange, damage) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = speed;
    this.maxRange = maxRange;
    this.damage = damage;
    this.distanceTraveled = 0;
    this.used = false;
    
    // 크기 관련 (거리에 따라 커짐)
    this.baseSize = 8; // 기본 크기 증가
    this.size = this.baseSize;
    this.maxSize = 20; // 최대 크기
    
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
    this.size = this.baseSize + (this.maxSize - this.baseSize) * sizeProgress;
    
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
    
    this.activeStars = []; // 활성화된 별들
    this.maxStars = 3; // 동시에 존재할 수 있는 최대 별 개수
    this.starDuration = 5000; // 별 지속시간 5초
    this.starRange = 100; // 별의 데미지 범위
    this.tickInterval = 800; // 0.2초마다 데미지
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
    
    this.updateCooldown(player.getTotalCooldownReduction());
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