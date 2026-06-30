<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, useCssModule, nextTick } from "vue";

const styles = useCssModule();

interface Props {
  text: string;
  /** size of each square cell in px */
  pixelSize?: number;
  /** gap between cells in px */
  gap?: number;
  /** display font size used to lay out the text within the grid */
  fontSize?: number;
  fontWeight?: number | string;
  fontFamily?: string;
  /** cells of empty grid padding around the text */
  padding?: number;
  /** corner radius of each cell */
  radius?: number;
  /** fraction (0..1) of background cells that gently twinkle */
  twinkleDensity?: number;
  /** when false, the text is not lit into pixels — the grid is a plain
   *  twinkling field (use the default slot to overlay real text on top). */
  pixelateText?: boolean;
  /** color of the faint background grid cells */
  cellColor?: string;
  gradient?: [string, string, string];
}

const props = withDefaults(defineProps<Props>(), {
  pixelSize: 11,
  gap: 2,
  fontSize: 60,
  fontWeight: 700,
  fontFamily: '"Epilogue", system-ui, sans-serif',
  padding: 3,
  radius: 2,
  twinkleDensity: 0.18,
  pixelateText: true,
  cellColor: "#7c93b8",
  gradient: () => ["#60a5fa", "#22d3ee", "#a78bfa"],
});

const gradId = `pxpanel-${(Math.random() * 1e9) | 0}`;

const panelRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const dims = ref({ w: 0, h: 0 });

interface Cell {
  x: number;
  y: number;
  key: string;
  on: boolean;
  twinkle: boolean;
  twDelay: number;
  twDur: number;
}
const cells = ref<Cell[]>([]);

const COVERAGE_THRESHOLD = 0.5;
const SUPERSAMPLE = 6;

let lastWidth = 0;

const build = () => {
  const panel = panelRef.value;
  const canvas = canvasRef.value;
  if (!panel || !canvas) return;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  const cell = props.pixelSize + props.gap;
  const ss = SUPERSAMPLE;

  // 1) Measure the text with its real font metrics.
  ctx.font = `${props.fontWeight} ${props.fontSize}px ${props.fontFamily}`;
  const m = ctx.measureText(props.text);
  const ascent = m.actualBoundingBoxAscent || props.fontSize * 0.8;
  const descent = m.actualBoundingBoxDescent || props.fontSize * 0.25;

  const textCols = Math.ceil(m.width / cell);
  const textRows = Math.ceil((ascent + descent) / cell);

  // 2) Render the text at true metrics into a supersampled buffer.
  const scale = ss / cell;
  canvas.width = textCols * ss;
  canvas.height = textRows * ss;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, textCols * cell, textRows * cell);
  ctx.font = `${props.fontWeight} ${props.fontSize}px ${props.fontFamily}`;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(props.text, 0, ascent);
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const perCell = ss * ss;

  const isInked = (tr: number, tc: number) => {
    let sum = 0;
    for (let dy = 0; dy < ss; dy++) {
      const py = tr * ss + dy;
      for (let dx = 0; dx < ss; dx++) {
        sum += data[(py * canvas.width + (tc * ss + dx)) * 4 + 3];
      }
    }
    return sum / (perCell * 255) >= COVERAGE_THRESHOLD;
  };

  // 3) Build a full-width grid: fill the container, text left-aligned.
  const pad = props.padding;
  const availW = panel.clientWidth || (textCols + pad * 2) * cell;
  lastWidth = availW;
  const cols = Math.max(textCols + pad * 2, Math.floor(availW / cell));
  const rows = textRows + pad * 2;
  const startCol = pad;
  const startRow = pad;

  const out: Cell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tr = r - startRow;
      const tc = c - startCol;
      const on =
        props.pixelateText &&
        tr >= 0 &&
        tr < textRows &&
        tc >= 0 &&
        tc < textCols &&
        isInked(tr, tc);
      out.push({
        x: c * cell,
        y: r * cell,
        key: `${r}-${c}`,
        on,
        twinkle: !on && Math.random() < props.twinkleDensity,
        twDelay: Math.random() * 5,
        twDur: 3 + Math.random() * 3,
      });
    }
  }

  dims.value = { w: cols * cell, h: rows * cell };
  cells.value = out;
};

let resizeTimer: ReturnType<typeof setTimeout> | undefined;
let observer: ResizeObserver | undefined;

onMounted(async () => {
  try {
    await (document as any).fonts?.ready;
  } catch {
    /* ignore */
  }
  build();

  observer = new ResizeObserver((entries) => {
    const w = entries[0]?.contentRect.width ?? 0;
    if (Math.abs(w - lastWidth) < 1) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 120);
  });
  if (panelRef.value) observer.observe(panelRef.value);
});

onUnmounted(() => {
  observer?.disconnect();
  clearTimeout(resizeTimer);
});

watch(
  () => [props.text, props.fontSize, props.pixelSize, props.gap, props.padding],
  () => nextTick(build),
);

defineExpose({ rebuild: build });
</script>

<template>
  <div ref="panelRef" :class="styles.panel" :style="{ '--cell-color': cellColor }">
    <canvas ref="canvasRef" :class="styles.hidden" />
    <svg
      :class="styles.svg"
      :width="dims.w"
      :height="dims.h"
      :viewBox="`0 0 ${dims.w} ${dims.h}`"
      role="img"
      :aria-label="text"
    >
      <defs>
        <linearGradient :id="gradId" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" :stop-color="gradient[0]" />
          <stop offset="50%" :stop-color="gradient[1]" />
          <stop offset="100%" :stop-color="gradient[2]" />
        </linearGradient>
      </defs>
      <rect
        v-for="cell in cells"
        :key="cell.key"
        :x="cell.x"
        :y="cell.y"
        :width="pixelSize"
        :height="pixelSize"
        :rx="radius"
        :ry="radius"
        :fill="cell.on ? `url(#${gradId})` : undefined"
        :class="[
          styles.cell,
          cell.on ? styles.cellOn : styles.cellOff,
          cell.twinkle ? styles.cellTwinkle : '',
        ]"
        :style="{
          '--tw-delay': `${cell.twDelay}s`,
          '--tw-dur': `${cell.twDur}s`,
        }"
      />
    </svg>
    <div :class="styles.overlay">
      <slot />
    </div>
  </div>
</template>

<style module>
.panel {
  position: relative;
  display: block;
  width: 100%;
  line-height: 0;
}

/* Holds real text laid over the pixel field. */
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  pointer-events: none;
  line-height: 1;
}

.hidden {
  display: none;
}

.svg {
  display: block;
  max-width: 100%;
  height: auto;
  overflow: visible;
}

/* Static background cells stay grey. */
.cellOff {
  fill: #2e1d0b;
  fill-opacity: 0.1;
}

/* Lit text cells. */
.cellOn {
  fill-opacity: 1;
  animation: cellGlow 4s ease-in-out infinite;
}

/* Active (twinkling) cells take the component's accent color. */
.cellTwinkle {
  fill: var(--cell-color, #7c93b8);
  animation: cellTwinkle var(--tw-dur) ease-in-out infinite;
  animation-delay: var(--tw-delay);
}

@keyframes cellTwinkle {
  0%,
  100% {
    fill-opacity: 0.07;
  }
  50% {
    fill-opacity: 0.3;
  }
}

@keyframes cellGlow {
  0%,
  100% {
    filter: drop-shadow(0 0 1px rgba(96, 165, 250, 0.25));
  }
  50% {
    filter: drop-shadow(0 0 4px rgba(167, 139, 250, 0.55));
  }
}

@media (prefers-reduced-motion: reduce) {
  .cellOn,
  .cellTwinkle {
    animation: none;
  }
}
</style>
