import * as THREE from 'three';

export function createTileTexture(type) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (type === 'hall') {
    ctx.fillStyle = '#172230';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#1e2c3e';
    ctx.fillRect(6, 6, 244, 244);
    ctx.fillRect(262, 6, 244, 244);
    ctx.fillRect(6, 262, 244, 244);
    ctx.fillRect(262, 262, 244, 244);
    ctx.strokeStyle = 'rgba(0, 136, 238, 0.15)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(10, 120); ctx.lineTo(240, 60);
    ctx.moveTo(270, 380); ctx.lineTo(500, 310);
    ctx.stroke();
  } else if (type === 'ai_lab') {
    ctx.fillStyle = '#0f1722';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    for (let x = 0; x < 512; x += 64) {
      for (let y = 0; y < 512; y += 64) {
        ctx.strokeRect(x + 4, y + 4, 56, 56);
        ctx.fillStyle = 'rgba(0, 229, 255, 0.04)';
        ctx.fillRect(x + 8, y + 8, 48, 48);
      }
    }
  } else if (type === 'crypto') {
    ctx.fillStyle = '#131b24';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1.5;
    for (let i = 20; i < 512; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 20); ctx.lineTo(i, 492);
      ctx.stroke();
    }
  } else if (type === 'library') {
    ctx.fillStyle = '#141d27';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#0b2a4a';
    ctx.fillRect(32, 32, 448, 448);
    ctx.strokeStyle = '#0088ee';
    ctx.lineWidth = 2;
    ctx.strokeRect(32, 32, 448, 448);
  } else {
    ctx.fillStyle = '#121820';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#243447';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 512; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, 512);
      ctx.moveTo(0, i); ctx.lineTo(512, i);
      ctx.stroke();
    }
    ctx.strokeStyle = '#0088ee';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 512, 512);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
