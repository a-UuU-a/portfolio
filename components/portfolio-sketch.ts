import type { P5Instance } from "./P5Sketch";

export const portfolioSketch = (p: P5Instance) => {
  // レスポンシブなキャンバスサイズ
  let canvasWidth: number;
  let canvasHeight: number;

  let autoRotate = true;
  let rotationAngle = 0;
  let rotationSpeed = 0.005;
  let cameraRadius = 1200;
  let cameraHeight = -200;
  let roomSize = 400;
  let wallHeight = 300;
  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let mouseIdleTime = 0;
  let maxIdleTime = 120;

  // タッチ関連の変数
  let touchStartX = 0;
  let touchStartY = 0;
  let isTouch = false;

  // キャンバスサイズを計算する関数
  const calculateCanvasSize = () => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      // スマホの場合はビューポートの90%、最大400px
      canvasWidth = Math.min(window.innerWidth * 0.9, 400);
      canvasHeight = Math.min(window.innerHeight * 0.5, 400);
    } else {
      // デスクトップの場合は元のサイズ
      canvasWidth = 800;
      canvasHeight = 600;
    }
  };

  p.setup = () => {
    calculateCanvasSize();
    const canvas = p.createCanvas(canvasWidth, canvasHeight, p.WEBGL);

    // キャンバス要素にタッチイベントリスナーを追加
    const canvasElement = canvas.elt as HTMLCanvasElement;

    // タッチイベントでのスクロール防止
    canvasElement.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isTouch = true;
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      autoRotate = false;
      mouseIdleTime = 0;
    }, { passive: false });

    canvasElement.addEventListener('touchmove', (e) => {
      e.preventDefault();
      isDragging = true;
    }, { passive: false });

    canvasElement.addEventListener('touchend', (e) => {
      e.preventDefault();
      isTouch = false;
      isDragging = false;
      mouseIdleTime = 0;
    }, { passive: false });

    // 初期カメラ位置を設定
    let x = p.cos(rotationAngle) * cameraRadius;
    let z = p.sin(rotationAngle) * cameraRadius;
    p.camera(x, cameraHeight, z, 0, 0, 0, 0, 1, 0);

    // 初期マウス位置を設定
    lastMouseX = p.mouseX;
    lastMouseY = p.mouseY;
  };

  // ウィンドウリサイズ時の処理
  p.windowResized = () => {
    calculateCanvasSize();
    p.resizeCanvas(canvasWidth, canvasHeight);
  };

  p.draw = () => {
    p.background(0, 0, 0);
    p.ambientLight(100);
    p.directionalLight(255, 255, 255, -1, 0.5, -1);

    // マウス操作の検出（デスクトップ用）
    if (!isTouch && p.mouseIsPressed) {
      if (p.mouseX !== lastMouseX || p.mouseY !== lastMouseY) {
        isDragging = true;
        autoRotate = false;
        mouseIdleTime = 0;
      }
    } else if (!isTouch && !p.mouseIsPressed) {
      if (isDragging) {
        isDragging = false;
        mouseIdleTime = 0;
      }
    }

    // マウスが動いていない時間をカウント
    if (!autoRotate && !isDragging && !isTouch) {
      mouseIdleTime++;
      if (mouseIdleTime > maxIdleTime) {
        autoRotate = true;
      }
    }

    // 自動回転の実行
    if (autoRotate && !isDragging && !isTouch) {
      rotationAngle += rotationSpeed;
      let x = p.cos(rotationAngle) * cameraRadius;
      let z = p.sin(rotationAngle) * cameraRadius;
      p.camera(x, cameraHeight, z, 0, 0, 0, 0, 1, 0);
    }

    // インタラクション時のみorbitControlを有効にする
    if (isDragging || (!autoRotate && !isTouch)) {
      p.orbitControl();
    }

    drawRoom();
    drawFurniture();

    if (!isTouch) {
      lastMouseX = p.mouseX;
      lastMouseY = p.mouseY;
    }
  };

  const drawRoom = () => {
    // Floor
    p.push();
    p.translate(0, wallHeight / 2, 0);
    p.rotateX(p.PI / 2);
    p.noFill();
    p.stroke(255);
    p.plane(roomSize, roomSize);
    p.pop();

    // Ceiling
    p.push();
    p.translate(0, -wallHeight / 2, 0);
    p.rotateX(p.PI / 2);
    p.noFill();
    p.stroke(255);
    p.plane(roomSize, roomSize);
    p.pop();

    // Left wall
    p.push();
    p.translate(-roomSize / 2, 0, 0);
    p.rotateY(p.PI / 2);
    p.noFill();
    p.stroke(255);
    p.plane(roomSize, wallHeight);
    p.pop();

    // Right wall
    p.push();
    p.translate(roomSize / 2, 0, 0);
    p.rotateY(-p.PI / 2);
    p.noFill();
    p.stroke(255);
    p.plane(roomSize, wallHeight);
    p.pop();

    // Back wall
    p.push();
    p.translate(0, 0, -roomSize / 2);
    p.noFill();
    p.stroke(255);
    p.plane(roomSize, wallHeight);
    p.pop();

    // Front wall (with door opening)
    p.push();
    p.translate(0, 0, roomSize / 2);
    p.noFill();
    p.stroke(255);
    p.push();
    p.translate(-roomSize / 4, 0, 0);
    p.plane(roomSize / 2, wallHeight);
    p.pop();
    p.push();
    p.translate(roomSize / 4, 0, 0);
    p.plane(roomSize / 2, wallHeight);
    p.pop();
    p.push();
    p.translate(0, -wallHeight / 3, 0);
    p.plane(roomSize / 2, wallHeight / 3);
    p.pop();
    p.pop();
  };

  const drawFurniture = () => {
    // Table
    p.push();
    p.translate(-80, 60, -50);
    p.noFill();
    p.stroke(255);
    p.push();
    p.translate(0, -20, 0);
    p.box(120, 10, 60);
    p.pop();
    for (let x = -50; x <= 50; x += 100) {
      for (let z = -25; z <= 25; z += 50) {
        p.push();
        p.translate(x, 15, z);
        p.box(8, 50, 8);
        p.pop();
      }
    }
    p.pop();

    // Chair
    p.push();
    p.translate(-80, 80, 20);
    p.noFill();
    p.stroke(255);
    p.push();
    p.translate(0, -10, 0);
    p.box(40, 5, 40);
    p.pop();
    p.push();
    p.translate(0, -30, 20);
    p.box(40, 35, 5);
    p.pop();
    for (let x = -15; x <= 15; x += 30) {
      for (let z = -15; z <= 15; z += 30) {
        p.push();
        p.translate(x, 15, z);
        p.box(5, 30, 5);
        p.pop();
      }
    }
    p.pop();

    // Bookshelf
    p.push();
    p.translate(150, 0, -150);
    p.noFill();
    p.stroke(255);
    p.box(80, 200, 30);
    for (let i = 0; i < 4; i++) {
      p.push();
      p.translate(0, -75 + i * 50, 0);
      p.box(75, 3, 28);
      p.pop();
    }
    for (let shelf = 0; shelf < 4; shelf++) {
      for (let book = 0; book < 6; book++) {
        p.push();
        p.translate(-30 + book * 12, -60 + shelf * 50, 5);
        p.box(10, 25, 15);
        p.pop();
      }
    }
    p.pop();

    // Lamp
    p.push();
    p.translate(50, -80, 80);
    p.noFill();
    p.stroke(255);
    p.cylinder(20, 10);
    p.push();
    p.translate(0, -30, 0);
    p.cylinder(3, 60);
    p.pop();
    p.push();
    p.translate(0, -70, 0);
    p.cone(25, 30);
    p.pop();
    p.pop();
  };
};
