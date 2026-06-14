<script setup lang="ts">
import {
  ref,
  onMounted,
  onUnmounted,
  computed,
  useCssModule,
  watch,
} from "vue";
import MosaicImage from "./components/MosaicImage.vue";
import APL from "@/assets/images/APL.png";
import JHU from "@/assets/images/JHU.png";
import UMBC from "@/assets/images/UMBC.png";
import AHMAD from "@/assets/images/ahmad.png";
import GithubIcon from "@/assets/svgs/github.svg";
import LinkedinIcon from "@/assets/svgs/linkedin.svg";
import XIcon from "@/assets/svgs/x.svg";
import YoutTubeICon from "@/assets/svgs/youtube.svg";

const mosaicSize = computed(() => {
  const w = screenWidth.value;

  if (w > 1600) return 760; // large desktop
  if (w > 1200) return 620; // laptop
  if (w > 900) return 600; // small laptop / large tablet
  if (w > 600) return 480; // tablet
  return 340; // phones
});

const mosaicPixelSize = computed(() => {
  const size = mosaicSize.value;
  if (size > 700) return 9;
  if (size > 500) return 7;
  if (size > 400) return 6;
  return 5;
});

const ahmadIsFontSize = computed(() => {
  const w = screenWidth.value;
  if (w > 1600) return "2.85vw";
  if (w > 1200) return "3.85vw";
  if (w > 900) return "60px";
  if (w > 600) return "48px";
  return "38px";
});

const titleFontSize = computed(() => {
  const w = screenWidth.value;
  if (w > 1600) return "2.5vw";
  if (w > 1200) return "3.7vw";
  if (w > 900) return "60px";
  if (w > 600) return "48px";
  return "38px";
});

const descFontSize = computed(() => {
  const w = screenWidth.value;
  if (w > 1600) return "26px";
  if (w > 1400) return "24px";
  if (w > 1200) return "20px";
  if (w > 900) return "15px";
  if (w > 600) return "10px";
  return "16px";
});

const heroGridColumns = computed(() => {
  const w = screenWidth.value;

  if (w > 1600) return "1fr 1fr"; // wide screens → text dominates
  if (w > 1200) return "1.1fr 0.9fr"; // laptop
  if (w > 900) return "1fr 1fr"; // balanced
  if (w > 600) return "1fr"; // stacked (handled by media query too)
  return "1fr";
});

const styles = useCssModule();

const screenWidth = ref(window.innerWidth);

const updateScreen = () => {
  screenWidth.value = window.innerWidth;
};

onMounted(() => {
  window.addEventListener("resize", updateScreen);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateScreen);
});
const typedDescription = ref("");
const typingSpeed = 18; // ms per character typing
const deletingSpeed = 14; // ms per character deleting

let typingTimeout: number | null = null;

function typeText(newText: string) {
  if (typingTimeout) clearTimeout(typingTimeout);

  const oldText = typedDescription.value;

  // Step 1: delete old text
  let i = oldText.length;
  function deleteStep() {
    if (i > 0) {
      typedDescription.value = oldText.slice(0, i - 1);
      i--;
      typingTimeout = window.setTimeout(deleteStep, deletingSpeed);
    } else {
      typeNew();
    }
  }

  // Step 2: type new text
  let j = 0;
  function typeNew() {
    if (j < newText.length) {
      typedDescription.value += newText[j];
      j++;
      typingTimeout = window.setTimeout(typeNew, typingSpeed);
    }
  }

  deleteStep();
}

interface ImageItem {
  url: string;
  title: string;
  description?: string;
}

type Gradient3 = [string, string, string];

type HighlightParts = {
  before: string;
  highlight: string;
  after: string;
  gradient?: Gradient3;
};
const portfolioImages: ImageItem[] = [
  {
    url: APL,
    title: "an AI/ML Engineer at Johns Hopkins APL.",
    description:
      "I've designed, trained, and deployed machine learning models in production environments.",
  },
  {
    url: JHU,
    title: "pursuing a Master’s in AI at Johns Hopkins University.",
    description:
      "Graduate-level focus on machine learning, AI systems, and applied research.",
  },
  {
    url: UMBC,
    title: "a CS & Math graduate from UMBC.",
    description:
      "Dual-major foundation in algorithms, software engineering, and applied mathematics.",
  },
  {
    url: AHMAD,
    title: "an engineer, researcher, and lifelong learner.",
    description: "I'm also dashingly handsome.",
  },
];

const highlightForTitle = (title: string): HighlightParts => {
  // You define the colors here (3 per highlight).
  const rules: Array<{
    match: string;
    highlight: string;
    gradient: Gradient3;
  }> = [
    {
      match: "an AI/ML Engineer at Johns Hopkins APL.",
      highlight: "AI/ML Engineer",
      gradient: ["#0a35f6", "#5aaad8", "#06b6d4"],
    },
    {
      match: "pursuing a Master’s in AI at Johns Hopkins University.",
      highlight: "Master’s in AI",
      gradient: ["#16def9", "#fffeffe4", "#7d5be2"],
    },
    {
      match: "a CS & Math graduate from UMBC.",
      highlight: "CS & Math",
      gradient: ["#f59e0b", "#8b4d00", "#f9ec00"],
    },
    {
      match: "an engineer, researcher, and lifelong learner.",
      highlight: "lifelong learner.",
      gradient: ["#60a5fa", "#34d399", "#f472b6"],
    },
  ];

  const rule = rules.find((r) => r.match === title);
  if (!rule) return { before: title, highlight: "", after: "" };

  const idx = title.indexOf(rule.highlight);
  if (idx === -1) return { before: title, highlight: "", after: "" };

  return {
    before: title.slice(0, idx),
    highlight: rule.highlight,
    after: title.slice(idx + rule.highlight.length),
    gradient: rule.gradient,
  };
};

const currentImageTitle = ref(portfolioImages[0].title);
const currentImageDescription = ref(portfolioImages[0].description || "");
const currentTitleParts = ref(highlightForTitle(currentImageTitle.value));

const gradientStyleFor = (parts: HighlightParts) => {
  const g = parts.gradient;
  if (!g) return {};
  return {
    "--g1": g[0],
    "--g2": g[1],
    "--g3": g[2],
  } as Record<string, string>;
};

const currentImageIndex = ref(0);
const handleImageChange = (index: number, image: ImageItem) => {
  currentImageIndex.value = index;
  currentImageTitle.value = image.title;
  currentImageDescription.value = image.description || "";
  currentTitleParts.value = highlightForTitle(image.title);
};

watch(
  currentImageDescription,
  (newVal) => {
    typeText(newVal || "");
  },
  { immediate: true },
);
</script>

<template>
  <div :class="styles.app">
    <main :class="styles.main">
      <section :class="styles.hero">
        <div
          :class="styles.heroGrid"
          :style="{ gridTemplateColumns: heroGridColumns }"
        >
          <!-- LEFT: intro copy -->
          <div :class="styles.left">
            <h1 :class="styles.heading">
              <span
                :class="styles.headingLine"
                :style="{ fontSize: ahmadIsFontSize }"
              >
                Ahmad is...
              </span>

              <div :class="styles.titleSlot">
                <Transition name="fall" mode="out-in">
                  <span
                    :key="currentImageTitle"
                    :class="styles.headingName"
                    :style="{ fontSize: titleFontSize }"
                  >
                    <span>{{ currentTitleParts.before }}</span>
                    <span
                      v-if="currentTitleParts.highlight"
                      :class="styles.gradientWord"
                      :style="gradientStyleFor(currentTitleParts)"
                    >
                      {{ currentTitleParts.highlight }}
                    </span>
                    <span>{{ currentTitleParts.after }}</span>
                  </span>
                </Transition>
              </div>
            </h1>

            <!-- Optional: keep your cycling title/desc as a subtle caption -->
            <div :class="styles.caption">
              <div
                :class="styles.captionDesc"
                :style="{ fontSize: descFontSize }"
              >
                {{ typedDescription }}
                <span :class="styles.cursor">|</span>
              </div>
            </div>

            <!-- Optional: social row placeholder -->
            <div :class="styles.socialRow" aria-label="social links">
              <a
                :class="styles.socialPill"
                href="https://github.com/asayad1"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <img :src="GithubIcon" :class="styles.socialIcon" alt="" />
              </a>

              <a
                :class="styles.socialPill"
                href="https://www.linkedin.com/in/ahmad-sayad/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <img :src="LinkedinIcon" :class="styles.socialIcon" alt="" />
              </a>

              <a
                :class="styles.socialPill"
                href="https://x.com/YOUR_USERNAME"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
              >
                <img :src="XIcon" :class="styles.socialIcon" alt="" />
              </a>

              <a
                :class="styles.socialPill"
                href="https://youtube.com/@asayad1"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
              >
                <img :src="YoutTubeICon" :class="styles.socialIcon" alt="" />
              </a>
            </div>
          </div>

          <!-- RIGHT: mosaic -->
          <div :class="styles.right">
            <div :class="styles.mosaicShell">
              <div :class="styles.mosaicFrame">
                <MosaicImage
                  :images="portfolioImages"
                  :active-index="currentImageIndex"
                  :pixel-size="mosaicPixelSize"
                  :gap="1"
                  :width="mosaicSize"
                  :height="mosaicSize"
                  :transition-duration="15000"
                  @image-change="handleImageChange"
                />
              </div>

              <!-- Vertical selector -->
              <div :class="styles.selector" aria-label="Image selector">
                <button
                  v-for="(_, i) in portfolioImages"
                  :key="i"
                  type="button"
                  :class="[
                    styles.selectorDot,
                    i === currentImageIndex ? styles.selectorDotActive : '',
                  ]"
                  :aria-label="`Go to image ${i + 1}`"
                  :aria-current="i === currentImageIndex ? 'true' : undefined"
                  @click="currentImageIndex = i"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style module>
.cursor {
  display: inline-block;
  margin-left: 4px;
  animation: blink 1s steps(1) infinite;
  color: rgba(255, 255, 255, 0.7);
}

@keyframes blink {
  0%,
  50%,
  100% {
    opacity: 1;
  }
  25%,
  75% {
    opacity: 0;
  }
}

:global(.descfade-enter-active),
:global(.descfade-leave-active) {
  transition:
    opacity 600ms ease,
    transform 600ms cubic-bezier(0.22, 1, 0.36, 1);
}

:global(.descfade-enter-from) {
  opacity: 0;
  transform: translateY(10px);
}

:global(.descfade-leave-to) {
  opacity: 0;
  transform: translateY(-10px);
}

.gradientWord {
  display: inline-block;

  /* defaults (used if you forget to provide per-title colors) */
  --g1: #7c3aed;
  --g2: #22c55e;
  --g3: #06b6d4;

  background: linear-gradient(90deg, var(--g1), var(--g2), var(--g3));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;

  background-size: 220% 220%;
  animation: gradientShift 3.2s ease-in-out infinite;
  filter: drop-shadow(0 0 14px rgba(255, 255, 255, 0.08));
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* Accessibility: respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .gradientWord {
    animation: none;
  }
}

:global(.fall-enter-active),
:global(.fall-leave-active) {
  transition:
    transform 520ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 360ms ease;
  transform-origin: bottom center; /* hinge at bottom */
  will-change: transform, opacity;
}

:global(.fall-enter-from) {
  opacity: 0;
  transform: translateY(-18px) rotateX(70deg); /* starts tipped AWAY, then comes forward */
}

:global(.fall-enter-to) {
  opacity: 1;
  transform: translateY(0) rotateX(0deg);
}

:global(.fall-leave-from) {
  opacity: 1;
  transform: translateY(0) rotateX(0deg);
}

:global(.fall-leave-to) {
  opacity: 0;
  transform: translateY(34px) rotateX(-80deg); /* NEGATIVE = falls TOWARD you */
}

.app {
  position: relative;
  min-height: 100vh;
  background: #0b0b0b; /* deep black */
  color: rgba(255, 255, 255, 0.92);
  overflow: hidden;
}

.titleSlot {
  display: block;
  line-height: 1.12;

  /* Reserve enough space so different titles don’t change the overall height */
  min-height: 1.25em; /* tweak 1.15–1.4em based on your font */
  padding-bottom: 0.12em; /* also helps descenders */
  overflow: visible;

  /* isolates reflow from affecting siblings (prevents “Ahmad is...” nudges) */
  contain: layout paint;
}

.topbar {
  position: relative;
  z-index: 2;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.iconButton {
  position: absolute;
  right: 28px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.sunDot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.75);
}

.main {
  position: relative;
  z-index: 1;
}

.hero {
  padding: 56px 28px 72px;
}

.heroGrid {
  max-width: 1800px;
  margin: 0 auto;

  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
}

.left {
  min-width: 0;
  margin-left: 8%;
}

.heading {
  margin: 0;
  font-family:
    "Cal Sans",
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  font-weight: 400;
  letter-spacing: -0.02em;
  perspective: 1000px;

  /* IMPORTANT: don’t use a single line-height for the whole h1 */
  line-height: normal;
}

.headingLine {
  display: block;
  line-height: 1.05; /* fixed, stable top line */
  color: rgba(255, 255, 255, 0.96);
  letter-spacing: 0.015em;
}

.headingName {
  display: inline-block;
  transform-style: preserve-3d;
  letter-spacing: 0.03em;
  overflow: visible;
}

.subheading {
  margin-top: 14px;
  margin-bottom: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.caption {
  margin-top: 34px;
  min-height: 56px;
}

.captionTitle {
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.68);
}

.captionDesc {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.5);

  font-family: "JetBrains Mono", monospace;
  font-weight: 400;
  letter-spacing: 0.02em;
}
.socialRow {
  margin-top: 36px;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.socialPill {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  display: grid;
  place-items: center;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.02);
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    background 160ms ease,
    box-shadow 160ms ease;
}

.socialPill:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
}

.socialIcon {
  width: 21px;
  height: 21px;
  object-fit: contain;
  opacity: 0.85;
  filter: brightness(0) invert(1); /* makes dark SVGs white */
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.socialPill:hover .socialIcon {
  opacity: 1;
  transform: scale(1.08);
}

.right {
  display: flex;
  justify-content: center;
}

.mosaicShell {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 14px; /* space between mosaic and selector */
}

.selector {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-self: stretch; /* make it span the mosaic height */
  justify-content: center; /* center the dots vertically */
  padding-right: 6px; /* small breathing room to the right */
}

.selectorDot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  padding: 0;
  transition:
    transform 140ms ease,
    background 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease;
}

.selectorDot:hover {
  background: rgba(255, 255, 255, 0.16);
  border-color: rgba(255, 255, 255, 0.32);
  transform: scale(1.08);
}

.selectorDotActive {
  background: rgba(255, 255, 255, 0.85);
  border-color: rgba(255, 255, 255, 0.85);
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.1);
  transform: scale(1.12);
}

.mosaicFrame {
  border-radius: 16px;
  overflow: hidden;
  /* border: 1px solid rgba(17, 17, 17, 0.6); */
  /* background: rgba(14, 14, 14, 0.65); */
  padding: 12px;
}

/* your fade transition still works with CSS Modules */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 240ms ease,
    transform 240ms ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 980px) {
  .heroGrid {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .right {
    justify-content: flex-start;
  }
}

@media (max-width: 560px) {
  .hero {
    padding: 40px 18px 64px;
  }

  .iconButton {
    right: 18px;
  }

  .mosaicFrame {
    padding: 8px;
  }
}
</style>
