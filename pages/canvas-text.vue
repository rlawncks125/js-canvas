<template>
  <!-- https://www.youtube.com/watch?v=2F2t1RJoGt8 -->
  <div>
    <button
      @click="() => textInputRef?.focus()"
      class="absolute border bg-white"
    >
      text포커스
    </button>
    <input
      class="w-0 h-0 absolute left-[1000px]"
      type="text"
      ref="textInputRef"
    />
    <canvas ref="canvasRef" class="w-[100vw] h-[100vh] mx-auto bg-yellow-100">
    </canvas>
  </div>
</template>

<script setup lang="ts">
const canvasRef = ref<HTMLCanvasElement>();
const textInputRef = ref<HTMLInputElement>();

let ctx: CanvasRenderingContext2D;
let effect: Effect;

class Particle {
  originX = 0;
  originY = 0;
  size = 0;
  x = 0;
  y = 0;
  dx = 0;
  dy = 0;
  vx = 0;
  vy = 0;
  force = 0;
  angle = 0;
  distance = 0;
  friction = Math.random() * 0.6 + 0.15;
  ease = Math.random() * 0.4 + 0.03;
  constructor(
    public effect: Effect,
    public _x: number,
    public _y: number,
    public color: string
  ) {
    this.x = Math.random() * this.effect.canvasWidth;
    this.y = 0;
    this.originX = _x;
    this.originY = _y;
    this.size = this.effect.gap;
  }

  draw() {
    this.effect.context.fillStyle = this.color;
    this.effect.context.fillRect(this.x, this.y, this.size, this.size);
  }

  update() {
    // 마우스 감지
    this.dx = this.effect.mouse.x! - this.x;
    this.dy = this.effect.mouse.y! - this.y;

    this.distance = this.dx * this.dx + this.dy * this.dy;
    this.force = -this.effect.mouse.radius / this.distance;

    if (this.distance < this.effect.mouse.radius) {
      this.angle = Math.atan2(this.dy, this.dx);
      this.vx += this.force * Math.cos(this.angle);
      this.vy += this.force * Math.sin(this.angle);
    } else {
      this.vx = 0;
      this.vy = 0;
    }

    // 위치 업데이트
    this.x += this.vx * this.friction + (this.originX - this.x) * this.ease;
    this.y += this.vy * this.friction + (this.originY - this.y) * this.ease;
  }
}

class Effect {
  fontSize = 120;
  maxTextWidth = 0.8;
  lineHeight = 1.0;
  textX = 0;
  textY = 0;
  // 파티클 텍스트
  particles: Particle[] = [];
  gap = 4;
  mouse = {
    radius: 5000,
    x: 0,
    y: 0,
  };
  bufferString = "";

  constructor(
    public context: CanvasRenderingContext2D,
    public canvasWidth: number,
    public canvasHeight: number,
    public textInput: HTMLInputElement
  ) {
    this.textX = canvasWidth / 2;
    this.textY = canvasHeight / 2;
    this.maxTextWidth *= this.canvasWidth;
    this.lineHeight *= this.fontSize;

    textInput.addEventListener("keyup", (e) => {
      if (e.key !== " ") {
        this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.wrapText((e.target as any).value);
      }
    });

    window.addEventListener("mousemove", (e) => {
      this.mouse.x = e.x;
      this.mouse.y = e.y;
    });
  }

  wrapText(text: string) {
    this.bufferString = text;
    // 캔버스 세팅
    const gradient = ctx.createLinearGradient(
      0,
      0,
      this.canvasWidth,
      this.canvasHeight
    );
    gradient.addColorStop(0.3, "red");
    gradient.addColorStop(0.5, "green");
    gradient.addColorStop(0.7, "purple");
    this.context.fillStyle = gradient;
    this.context.font = `${this.fontSize}px Helvetica`;
    this.context.textAlign = "center";
    this.context.textBaseline = "middle";
    // this.context.fillText(text, this.textX, this.textY);

    this.context.lineWidth = 4;
    this.context.strokeStyle = "black";
    // this.context.strokeText(text, this.textX, this.textY);

    // 텍스트 넘어갈시 줄바꿈 ( 강의 따라해서 영어만 잘됨 )
    let linesArray = [];
    let lineCounter = 0;
    let line = "";
    let words = text.split(" ");
    for (let i = 0; i < words.length; i++) {
      let testLine = line + words[i] + " ";

      if (ctx.measureText(testLine).width > this.maxTextWidth) {
        line = words[i] + " ";
        lineCounter++;
      } else {
        line = testLine;
      }
      linesArray[lineCounter] = line;
    }
    let textHeight = this.lineHeight * lineCounter;
    let textY = canvasRef.value!.height / 2 - textHeight / 2;
    linesArray.forEach((text, i) => {
      this.context.fillText(text, this.textX, textY + i * this.lineHeight);
      this.context.strokeText(text, this.textX, textY + i * this.lineHeight);
    });
    this.convertToParticles();
  }

  convertToParticles() {
    this.particles.length = 0;
    const pixels = this.context.getImageData(
      0,
      0,
      this.canvasWidth,
      this.canvasHeight
    ).data;
    this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    for (let y = 0; y < this.canvasHeight; y += this.gap) {
      for (let x = 0; x < this.canvasWidth; x += this.gap) {
        // 데이터 정보 파티클 로 변환
        const index = (y * this.canvasWidth + x) * 4;
        const red = pixels[index];
        const green = pixels[index + 1];
        const blue = pixels[index + 2];
        const alpha = pixels[index + 3];
        const color = `rgb(${red},${green},${blue})`;

        if (alpha > 0) {
          this.particles.push(new Particle(this, x, y, color));
        }
      }
    }
  }
  render() {
    this.particles.forEach((particle) => {
      particle.update();
      particle.draw();
    });
  }

  resize(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.textX = this.canvasWidth / 2;
    this.textY = this.canvasHeight / 2;
    this.maxTextWidth = this.canvasWidth * 0.8;
    this.wrapText(this.bufferString);
  }
}

onMounted(() => {
  if (!canvasRef.value) return;
  if (!textInputRef.value) return;
  canvasRef.value.width = canvasRef.value.clientWidth;
  canvasRef.value.height = canvasRef.value.clientHeight;

  ctx = canvasRef.value.getContext("2d")!;

  effect = new Effect(
    ctx,
    canvasRef.value.width,
    canvasRef.value.height,
    textInputRef.value
  );
  effect.wrapText("Hello how are you, I`am dodo axc");
  effect.render();
  animate();
  // text input
  textInputRef.value?.focus();

  window.addEventListener("resize", () => {
    if (!canvasRef.value) return;
    canvasRef.value.width = canvasRef.value.clientWidth;
    canvasRef.value.height = canvasRef.value.clientHeight;
    effect.resize(canvasRef.value.width, canvasRef.value.height);
  });
});

function animate() {
  ctx.clearRect(
    0,
    0,
    canvasRef.value?.width || 0,
    canvasRef.value?.height || 0
  );
  effect.render();
  requestAnimationFrame(animate);
}
</script>

<style scoped></style>
