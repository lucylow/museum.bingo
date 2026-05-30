export const createConfettiCanvas = (container) => {
  const canvas = document.createElement('canvas');
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const particles = Array.from({ length: 150 }, (_, idx) => ({
    x: Math.random() * canvas.width,
    y: -Math.random() * canvas.height,
    size: 2 + Math.random() * 5,
    speedY: 1 + Math.random() * 2,
    color: ['#ff5252', '#ffd740', '#69f0ae', '#40c4ff'][idx % 4],
  }));

  let rafId = null;
  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.y += p.speedY;
      if (p.y > canvas.height + 10) p.y = -10;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size * 1.5);
    });
    rafId = requestAnimationFrame(render);
  };

  render();

  canvas.destroy = () => {
    if (rafId) cancelAnimationFrame(rafId);
  };

  return canvas;
};
