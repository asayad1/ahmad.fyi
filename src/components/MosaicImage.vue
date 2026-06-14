<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useCssModule } from "vue";

const styles = useCssModule();

interface ImageItem {
  url: string;
  title: string;
  description?: string;
}

interface Props {
  images: ImageItem[];
  pixelSize?: number;
  gap?: number;
  width?: number;
  height?: number;
  transitionDuration?: number;
  activeIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  pixelSize: 16,
  gap: 2,
  width: 800,
  height: 600,
  transitionDuration: 5000,
  activeIndex: 0,
});

const emit = defineEmits<{
  imageChange: [index: number, image: ImageItem];
}>();

const currentImageIndex = ref(0);
const pixels = ref<
  Array<{ x: number; y: number; color: string; key: string; delay: number }>
>([]);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const isLoaded = ref(false);

const currentImage = computed(() => props.images[currentImageIndex.value]);
const currentImageUrl = computed(() => currentImage.value?.url || "");

const cols = computed(() =>
  Math.floor(props.width / (props.pixelSize + props.gap)),
);
const rows = computed(() =>
  Math.floor(props.height / (props.pixelSize + props.gap)),
);

let timerId: ReturnType<typeof setTimeout> | undefined;
let loadToken = 0;

const imgCache = new Map<string, HTMLImageElement>();
const pending = new Map<string, Promise<HTMLImageElement>>();

const clearCycle = () => {
  if (timerId !== undefined) {
    clearTimeout(timerId);
    timerId = undefined;
  }
};

// Loads from cache (or in-flight promise), waits for decode when possible
const getImage = (src: string): Promise<HTMLImageElement> => {
  const cached = imgCache.get(src);
  if (cached) return Promise.resolve(cached);

  const inFlight = pending.get(src);
  if (inFlight) return inFlight;

  const p = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();

    // For same-origin local assets you can omit crossOrigin; leaving it doesn't help.
    // img.crossOrigin = 'anonymous'

    img.decoding = "async";

    img.onload = async () => {
      try {
        // decode() makes “ready to draw” more consistent when supported
        if ("decode" in img) await (img as any).decode();
      } catch {
        // decode can throw on some browsers; ignore and proceed
      }
      imgCache.set(src, img);
      pending.delete(src);
      resolve(img);
    };

    img.onerror = (e) => {
      pending.delete(src);
      reject(e);
    };

    img.src = src;
  });

  pending.set(src, p);
  return p;
};

const extractColors = (img: HTMLImageElement) => {
  if (!canvasRef.value) return;

  const canvas = canvasRef.value;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  canvas.width = cols.value;
  canvas.height = rows.value;

  // Draw the image scaled to match our grid
  ctx.drawImage(img, 0, 0, cols.value, rows.value);

  const imageData = ctx.getImageData(0, 0, cols.value, rows.value);
  const newPixels: Array<{
    x: number;
    y: number;
    color: string;
    key: string;
    delay: number;
  }> = [];

  for (let row = 0; row < rows.value; row++) {
    for (let col = 0; col < cols.value; col++) {
      const i = (row * cols.value + col) * 4;
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const a = imageData.data[i + 3] / 255;

      const x = col * (props.pixelSize + props.gap);
      const y = row * (props.pixelSize + props.gap);

      // Calculate stagger delay based on diagonal distance from top-left
      const diagonalIndex = row + col;
      const delay = diagonalIndex * 0.006; // Adjust multiplier for speed

      newPixels.push({
        x,
        y,
        color: `rgba(${r}, ${g}, ${b}, ${a})`,
        key: `${row}-${col}`,
        delay,
      });
    }
  }

  pixels.value = newPixels;
  isLoaded.value = true;
};

const loadImage = async (src: string) => {
  isLoaded.value = false;
  const myToken = ++loadToken;

  try {
    const img = await getImage(src);

    // If the user clicked to another image while we were loading, ignore this result
    if (myToken !== loadToken) return;

    extractColors(img);
    emit("imageChange", currentImageIndex.value, currentImage.value);

    // Start the countdown AFTER we actually display the image
    armNextTick();
  } catch {
    console.error("Failed to load image:", src);
    // Optional: skip to next; but be careful not to loop forever if multiple fail
    nextImage();
  }
};

const nextImage = () => {
  currentImageIndex.value = (currentImageIndex.value + 1) % props.images.length;
  loadImage(currentImageUrl.value);
};

const preloadAll = () => {
  // Preload everything (excluding current) in the background
  const urls = props.images.map((i) => i.url);
  const current = currentImageUrl.value;

  const work = () => {
    for (const u of urls) {
      if (u && u !== current) getImage(u).catch(() => {});
    }
  };

  // Prefer idle time if available
  const ric = (globalThis as any).requestIdleCallback as
    | undefined
    | ((cb: () => void) => void);

  if (ric) {
    ric(work);
  } else {
    setTimeout(work, 0);
  }
};

const armNextTick = () => {
  clearCycle();

  // Don’t schedule if there’s nothing to cycle
  if (props.images.length <= 1) return;

  timerId = setTimeout(() => {
    nextImage(); // auto advance
  }, props.transitionDuration);
};

onMounted(() => {
  if (props.images.length > 0) {
    currentImageIndex.value = Math.min(
      Math.max(props.activeIndex ?? 0, 0),
      props.images.length - 1,
    );
    loadImage(currentImageUrl.value).then(preloadAll);
  }
});

onUnmounted(() => {
  clearCycle();
});

watch(
  () => props.activeIndex,
  (idx) => {
    if (typeof idx !== "number") return;
    if (idx < 0 || idx >= props.images.length) return;
    if (idx === currentImageIndex.value) return;

    currentImageIndex.value = idx;
    loadImage(props.images[idx].url); // timer resets inside loadImage
  },
);
</script>

<template>
  <div :class="styles.container">
    <canvas ref="canvasRef" :class="styles.hiddenCanvas" />
    <svg
      :class="styles.mosaic"
      :width="width"
      :height="height"
      :viewBox="`0 0 ${width} ${height}`"
    >
      <TransitionGroup name="pixel">
        <rect
          v-for="pixel in pixels"
          :key="pixel.key"
          :x="pixel.x"
          :y="pixel.y"
          :width="pixelSize"
          :height="pixelSize"
          :fill="pixel.color"
          :class="styles.pixel"
          :style="{ transitionDelay: `${pixel.delay}s` }"
        />
      </TransitionGroup>
    </svg>
  </div>
</template>

<style module>
.container {
  position: relative;
  display: inline-block;

  /* No glow */
  background: transparent;

  border-radius: 8px;
  overflow: hidden;
}

.hiddenCanvas {
  display: none;
}

.mosaic {
  display: block;
  max-width: 100%;
  height: auto;
}

.pixel {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Transition effects for pixels */
:global(.pixel-enter-active) {
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

:global(.pixel-leave-active) {
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

:global(.pixel-enter-from) {
  opacity: 0;
  transform: scale(0);
}

:global(.pixel-leave-to) {
  opacity: 0;
  transform: scale(0);
}
</style>
