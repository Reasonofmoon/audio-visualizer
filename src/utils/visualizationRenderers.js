export const renderOcean = (canvasCtx, canvas, dataArray, analyser, particlesRef) => {
  if (!canvasCtx) return;

  const width = canvas.width;
  const height = canvas.height;

  canvasCtx.clearRect(0, 0, width, height);

  const gradient = canvasCtx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#87CEEB');
  gradient.addColorStop(1, '#1E90FF');
  canvasCtx.fillStyle = gradient;
  canvasCtx.fillRect(0, 0, width, height);

  drawOceanWave(canvasCtx, dataArray, width, height, analyser.frequencyBinCount);
  drawOceanParticles(canvasCtx, dataArray, width, height, analyser.frequencyBinCount, particlesRef);
};

const drawOceanWave = (ctx, dataArray, width, height, bufferLength) => {
  let x = 0;
  const sliceWidth = width / bufferLength;

  ctx.beginPath();
  ctx.moveTo(0, height / 2);

  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 255;
    const y = v * height;
    const midX = x + sliceWidth / 2;
    const midY = (y + (dataArray[i + 1] / 255) * height) / 2;
    ctx.quadraticCurveTo(x, y, midX, midY);
    x += sliceWidth;
  }

  ctx.lineTo(width, height / 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.stroke();

  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fill();
};

const drawOceanParticles = (ctx, dataArray, width, height, bufferLength, particlesRef) => {
  const particles = particlesRef.current;
  const numParticles = particles.length; // Cache length
  const movementScale = 2;
  const sinInputScale = 1 / 20;
  const dataNormalizationFactor = 1 / 255;

  for (let i = 0; i < numParticles; i++) {
    const particle = particles[i];
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fillStyle = particle.color;
    ctx.fill();

    // Optimized movement calculation
    const dataValue = dataArray[i % bufferLength];
    const normalizedMovement = (dataValue * dataNormalizationFactor) * 2 - 1; // Range: -1 to 1
    
    particle.y += normalizedMovement * movementScale;
    particle.x += Math.sin(particle.y * sinInputScale) * movementScale;

    // Boundary checks (wrapping)
    if (particle.y > height) {
      particle.y = 0;
    } else if (particle.y < 0) {
      particle.y = height;
    }

    if (particle.x > width) {
      particle.x = 0;
    } else if (particle.x < 0) {
      particle.x = width;
    }
  }
};

export const renderBars = (canvasCtx, canvas, dataArray, analyser) => {
  if (!canvasCtx) return;

  const width = canvas.width;
  const height = canvas.height;

  canvasCtx.clearRect(0, 0, width, height);

  canvasCtx.fillStyle = '#000';
  canvasCtx.fillRect(0, 0, width, height);

  const barWidth = (width / analyser.frequencyBinCount) * 2.5;
  let x = 0;

  for (let i = 0; i < analyser.frequencyBinCount; i++) {
    const v = dataArray[i];
    const y = (v / 255) * height;

    canvasCtx.fillStyle = `rgb(${v + 100},50,50)`;
    canvasCtx.fillRect(x, height - y, barWidth, y);

    x += barWidth + 1;
  }
};

export const renderCircle = (canvasCtx, canvas, dataArray, analyser) => {
  if (!canvasCtx) return;

  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;

  canvasCtx.clearRect(0, 0, width, height);

  canvasCtx.fillStyle = '#000';
  canvasCtx.fillRect(0, 0, width, height);

  const radius = Math.min(width, height) / 4;
  const bars = analyser.frequencyBinCount;

  for (let i = 0; i < bars; i++) {
    const angle = (i / bars) * Math.PI * 2;
    const v = dataArray[i];
    const length = (v / 255) * radius;

    const x = centerX + Math.cos(angle) * (radius + length);
    const y = centerY + Math.sin(angle) * (radius + length);

    canvasCtx.beginPath();
    canvasCtx.moveTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
    canvasCtx.lineTo(x, y);
    canvasCtx.strokeStyle = `hsl(${(i / bars) * 360}, 100%, 50%)`;
    canvasCtx.lineWidth = 2;
    canvasCtx.stroke();
  }
};

export const renderWaveform = (canvasCtx, canvas, audioBuffer, analyser, animationRef) => {
  if (!audioBuffer || !canvas) return;

  const ctx = canvasCtx;
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
 
  const draw = () => {
    animationRef.current = requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgb(0, 255, 0)';
    ctx.beginPath();

    const sliceWidth = (width * 1.0) / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * height) / 2;

      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);

      x += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.stroke();
  };

  draw();
};
  
export const renderSpectrogram = (spectrogramCtx, analyser, spectrogramBufferLength, spectrogramData, spectrogramWidth, spectrogramHeight) => {
  if (!spectrogramCtx) return;

  const width = spectrogramWidth;
  const height = spectrogramHeight;

  // Optimization: Use drawImage for faster GPU-based scrolling instead of getImageData/putImageData
  spectrogramCtx.drawImage(
    spectrogramCtx.canvas,
    1,
    0,
    width - 1,
    height,
    0,
    0,
    width - 1,
    height
  );

  const barHeight = height / spectrogramBufferLength;

  analyser.getByteFrequencyData(spectrogramData);

  for (let i = 0; i < spectrogramBufferLength; i++) {
    const value = spectrogramData[i];
    const percent = value / 255;
    const hue = (i / spectrogramBufferLength) * 360;
    const saturation = '100%';
    const lightness = `${percent * 50}%`;

    spectrogramCtx.fillStyle = `hsl(${hue}, ${saturation}, ${lightness})`;
    spectrogramCtx.fillRect(width - 1, height - i * barHeight, 1, barHeight);
  }
};
