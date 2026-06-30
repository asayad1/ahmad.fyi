<script lang="ts">
/** A single piece of media: provide one of image / video / embed. */
export interface MediaItem {
  image?: string;
  video?: string;
  poster?: string;
  embed?: string;
}

export interface Project {
  title: string;
  description: string;
  tags?: string[];
  link?: string;
  /** two colors used for the marching pixel border + media placeholder */
  accent?: [string, string];
  /** image shown on the card's cover (URL or /public path) */
  image?: string;
  /** direct video file (mp4/webm) used as the card cover */
  video?: string;
  /** poster image shown before a `video` plays */
  poster?: string;
  /** iframe embed URL (e.g. a YouTube/Vimeo embed link) used as the cover */
  embed?: string;
  /** photo / video gallery shown in the modal's right panel */
  gallery?: MediaItem[];
  /** a PDF (URL or /public path) rendered in the modal's right panel */
  paper?: string;
}
</script>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  useCssModule,
} from "vue";
import PixelPanel from "./PixelPanel.vue";
import ProjectModal from "./ProjectModal.vue";
import { FILTERABLE_TAGS } from "../data/filters";

const styles = useCssModule();

const selected = ref<Project | null>(null);
const openCard = (p: Project) => (selected.value = p);

// Same font stack the hero uses for "Ahmad is..."
const headingFont =
  '"Cal Sans", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const props = defineProps<{
  projects: Project[];
}>();

// Cards shown per page adapt to how many fit, capped so they don't get too wide.
const CARD_MIN = 300; // px — minimum comfortable card width
const GAP = 24; // px — gap between cards
const MAX_PER_PAGE = 3;

const stageRef = ref<HTMLElement | null>(null);
const perPage = ref(1);
const page = ref(0);
// 1 = next, -1 = previous; tracks direction for the slide transition.
const dir = ref(1);

// The currently selected tag filter; null shows every project.
const activeTag = ref<string | null>(null);

// The curated filter tags (see src/data/filters.ts), kept only when at least
// one project actually uses them so we never show a chip that filters to none.
const allTags = computed(() =>
  FILTERABLE_TAGS.filter((t) => props.projects.some((p) => p.tags?.includes(t))),
);

const filteredProjects = computed(() =>
  activeTag.value
    ? props.projects.filter((p) => p.tags?.includes(activeTag.value!))
    : props.projects,
);

// Clicking the active tag (or "All") clears the filter; otherwise apply it.
// Either way reset to the first page so the new set starts from the top.
const selectTag = (t: string | null) => {
  const next = t === activeTag.value ? null : t;
  activeTag.value = next;
  dir.value = 1;
  page.value = 0;
};

const pageCount = computed(() =>
  Math.max(1, Math.ceil(filteredProjects.value.length / perPage.value)),
);

const pageItems = computed(() => {
  const start = page.value * perPage.value;
  return filteredProjects.value.slice(start, start + perPage.value);
});

const recompute = () => {
  const w = stageRef.value?.clientWidth ?? 0;
  const fit = Math.floor((w + GAP) / (CARD_MIN + GAP));
  const next = Math.max(1, Math.min(MAX_PER_PAGE, fit || 1));
  if (next === perPage.value) return;
  // Keep the first currently-visible card visible after the column count changes.
  const firstVisible = page.value * perPage.value;
  perPage.value = next;
  page.value = Math.min(
    Math.floor(firstVisible / next),
    Math.max(0, Math.ceil(filteredProjects.value.length / next) - 1),
  );
};

const go = (step: 1 | -1) => {
  const n = pageCount.value;
  if (n <= 1) return;
  dir.value = step;
  page.value = (page.value + step + n) % n;
};

const setPage = (i: number) => {
  if (i === page.value) return;
  dir.value = i > page.value ? 1 : -1;
  page.value = i;
};

let observer: ResizeObserver | undefined;
onMounted(() => {
  recompute();
  observer = new ResizeObserver(recompute);
  if (stageRef.value) observer.observe(stageRef.value);
});
onUnmounted(() => observer?.disconnect());
</script>

<template>
  <div :class="styles.carousel">
    <div :class="styles.header">
      <h2 :class="styles.title">
        <PixelPanel
          text="Projects"
          :pixel-size="11"
          :gap="2"
          :font-size="120"
          :padding="2"
          :pixelate-text="false"
          :font-family="headingFont"
          cell-color="#ff8a00"
        >
          <span :class="styles.projectsLabel">Projects</span>
        </PixelPanel>
      </h2>
    </div>

    <div
      :class="styles.filters"
      role="group"
      aria-label="Filter projects by tag"
    >
      <button
        type="button"
        :class="[styles.filter, activeTag === null ? styles.filterActive : '']"
        :aria-pressed="activeTag === null"
        @click="selectTag(null)"
      >
        All
      </button>
      <button
        v-for="t in allTags"
        :key="t"
        type="button"
        :class="[styles.filter, activeTag === t ? styles.filterActive : '']"
        :aria-pressed="activeTag === t"
        @click="selectTag(t)"
      >
        {{ t }}
      </button>
    </div>

    <div :class="styles.stageRow">
      <button
        v-if="pageCount > 1"
        type="button"
        :class="styles.navBtn"
        aria-label="Previous projects"
        @click="go(-1)"
      >
        ‹
      </button>

      <div ref="stageRef" :class="styles.stage">
        <Transition :name="dir === 1 ? 'slideNext' : 'slidePrev'" mode="out-in">
          <div
            :key="`${activeTag}-${page}`"
            :class="styles.grid"
            :style="{ gridTemplateColumns: `repeat(${perPage}, minmax(0, 1fr))` }"
          >
            <article
              v-for="(p, i) in pageItems"
              :key="page * perPage + i"
              :class="styles.card"
              role="button"
              tabindex="0"
              :aria-label="`Open ${p.title}`"
              :style="{
                '--a1': p.accent?.[0] ?? '#60a5fa',
                '--a2': p.accent?.[1] ?? '#a78bfa',
              }"
              @click="openCard(p)"
              @keydown.enter.prevent="openCard(p)"
              @keydown.space.prevent="openCard(p)"
            >
              <div :class="styles.cardMedia">
                <iframe
                  v-if="p.embed"
                  :class="styles.media"
                  :src="p.embed"
                  :title="p.title"
                  loading="lazy"
                />
                <video
                  v-else-if="p.video"
                  :class="styles.media"
                  :src="p.video"
                  :poster="p.poster"
                  muted
                  playsinline
                  preload="metadata"
                />
                <img
                  v-else-if="p.image"
                  :class="styles.media"
                  :src="p.image"
                  :alt="p.title"
                  loading="lazy"
                />
                <div
                  v-else
                  :class="styles.mediaPlaceholder"
                  aria-hidden="true"
                />
              </div>

              <div :class="styles.cardBody">
                <h3 :class="styles.cardTitle">{{ p.title }}</h3>
                <p :class="styles.cardDesc">{{ p.description }}</p>

                <div v-if="p.tags?.length" :class="styles.tags">
                  <span v-for="t in p.tags" :key="t" :class="styles.tag">{{
                    t
                  }}</span>
                </div>
              </div>
            </article>
          </div>
        </Transition>
      </div>

      <button
        v-if="pageCount > 1"
        type="button"
        :class="styles.navBtn"
        aria-label="Next projects"
        @click="go(1)"
      >
        ›
      </button>
    </div>

    <div v-if="pageCount > 1" :class="styles.dots" aria-label="Select page">
      <button
        v-for="i in pageCount"
        :key="i"
        type="button"
        :class="[styles.dot, i - 1 === page ? styles.dotActive : '']"
        :aria-label="`Go to page ${i}`"
        :aria-current="i - 1 === page ? 'true' : undefined"
        @click="setPage(i - 1)"
      />
    </div>

    <ProjectModal :project="selected" @close="selected = null" />
  </div>
</template>

<style module>
.carousel {
  width: 100%;
  max-width: 1800px;
  margin: 0 auto;
  padding: 0 28px;
}

.header {
  margin-bottom: 22px;
}

/* Clickable tag chips that filter the carousel to matching projects. */
.filters {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-bottom: 28px;
}

.filter {
  font-size: 13px;
  letter-spacing: 0.02em;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  transition:
    color 160ms ease,
    border-color 160ms ease,
    background 160ms ease,
    transform 160ms ease,
    box-shadow 160ms ease;
}

.filter:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.32);
  background: rgba(255, 255, 255, 0.07);
  transform: translateY(-1px);
}

.filterActive,
.filterActive:hover {
  color: #0b0b0b;
  font-weight: 600;
  border-color: transparent;
  background: linear-gradient(90deg, #ff7a00, #ffb347);
  box-shadow: 0 6px 18px rgba(255, 110, 0, 0.25);
}

.title {
  margin: 0;
  line-height: 0;
  width: 100%;
}

/* Real "Projects" text laid over the pixel field, matching the hero heading,
   with an animated Fanta-orange gradient sweeping across it. */
.projectsLabel {
  font-family: "Cal Sans", system-ui, -apple-system, BlinkMacSystemFont,
    sans-serif;
  font-weight: 400;
  font-size: clamp(48px, 9vw, 120px);
  line-height: 1.25;
  padding-bottom: 0.12em;
  letter-spacing: 0.015em;

  background: linear-gradient(
    90deg,
    #ff5a00,
    #ff8a00,
    #ffb347,
    #ff7a00,
    #ff4e00
  );
  background-size: 250% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 1px 12px rgba(255, 110, 0, 0.2));
  animation: fantaShift 3.4s ease-in-out infinite;
}

@keyframes fantaShift {
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

.stageRow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.navBtn {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.85);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    background 160ms ease;
}

.navBtn:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.07);
}

.stage {
  flex: 1;
  min-width: 0;
}

.grid {
  display: grid;
  gap: 24px;
  align-items: stretch;
}

/* Dot selectors */
.dots {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 26px;
}

.dot {
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

.dot:hover {
  background: rgba(255, 255, 255, 0.16);
  border-color: rgba(255, 255, 255, 0.32);
  transform: scale(1.08);
}

.dotActive {
  background: rgba(255, 255, 255, 0.85);
  border-color: rgba(255, 255, 255, 0.85);
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.1);
  transform: scale(1.12);
}

/* Slide transitions between cards */
:global(.slideNext-enter-active),
:global(.slideNext-leave-active),
:global(.slidePrev-enter-active),
:global(.slidePrev-leave-active) {
  transition:
    transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 280ms ease;
}

:global(.slideNext-enter-from) {
  opacity: 0;
  transform: translateX(44px);
}
:global(.slideNext-leave-to) {
  opacity: 0;
  transform: translateX(-44px);
}
:global(.slidePrev-enter-from) {
  opacity: 0;
  transform: translateX(-44px);
}
:global(.slidePrev-leave-to) {
  opacity: 0;
  transform: translateX(44px);
}

.card {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  cursor: pointer;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.025);
  overflow: hidden;
  transition:
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
    border-color 220ms ease,
    box-shadow 220ms ease;
}

/* Media area: holds an image, a video, or an iframe embed (16:9). */
.cardMedia {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.media {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  object-fit: cover;
  display: block;
  background: #000;
  pointer-events: none; /* clicks fall through to the card */
}

/* Shown when a project has no media yet — a subtle accent-tinted fill. */
.mediaPlaceholder {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      120% 120% at 0% 0%,
      color-mix(in srgb, var(--a1) 45%, transparent),
      transparent 60%
    ),
    radial-gradient(
      120% 120% at 100% 100%,
      color-mix(in srgb, var(--a2) 40%, transparent),
      transparent 60%
    ),
    repeating-linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.03) 0 10px,
      rgba(255, 255, 255, 0) 10px 20px
    );
}

/* Pixelated marching border: square dashes that travel clockwise around the
   perimeter, tinted with the card's accent colors. */
.card::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 2;
  --ps: 6px; /* pixel length */
  --pg: 5px; /* gap between pixels */
  --pb: 4px; /* border thickness */
  --period: 11px; /* must equal ps + pg */
  background-image:
    repeating-linear-gradient(
      90deg,
      var(--a1) 0,
      var(--a1) var(--ps),
      transparent var(--ps),
      transparent var(--period)
    ),
    repeating-linear-gradient(
      90deg,
      var(--a1) 0,
      var(--a1) var(--ps),
      transparent var(--ps),
      transparent var(--period)
    ),
    repeating-linear-gradient(
      0deg,
      var(--a2) 0,
      var(--a2) var(--ps),
      transparent var(--ps),
      transparent var(--period)
    ),
    repeating-linear-gradient(
      0deg,
      var(--a2) 0,
      var(--a2) var(--ps),
      transparent var(--ps),
      transparent var(--period)
    );
  background-size: 100% var(--pb), 100% var(--pb), var(--pb) 100%, var(--pb) 100%;
  background-position: 0 0, 0 100%, 0 0, 100% 0;
  background-repeat: no-repeat;
  opacity: 0.8;
  animation: cardBorderMarch 1.6s linear infinite;
}

.card:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
}

.card:hover::after {
  opacity: 1;
  animation-duration: 0.9s;
}

@keyframes cardBorderMarch {
  to {
    background-position:
      var(--period) 0,
      calc(-1 * var(--period)) 100%,
      0 calc(-1 * var(--period)),
      100% var(--period);
  }
}

@media (prefers-reduced-motion: reduce) {
  .card::after,
  .projectsLabel {
    animation: none;
  }
}

.cardBody {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 24px 22px;
}

.cardTitle {
  margin: 0 0 12px;
  font-family: "Epilogue", system-ui, sans-serif;
  font-weight: 700;
  font-size: 22px;
  color: rgba(255, 255, 255, 0.96);
}

.cardDesc {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.6);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.tag {
  font-size: 12px;
  letter-spacing: 0.02em;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.03);
}

.cardLink {
  margin-top: auto;
  padding-top: 18px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  width: fit-content;
  transition: color 160ms ease, transform 160ms ease;
}

.cardLink:hover {
  color: #fff;
  transform: translateX(3px);
}

@media (max-width: 560px) {
  .carousel {
    padding: 0 18px;
  }
}
</style>
