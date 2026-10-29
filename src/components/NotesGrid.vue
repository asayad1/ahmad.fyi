<script lang="ts">
export interface Note {
  title: string;
  /** pill tags shown on the card */
  tags?: string[];
  /** image shown on the card's cover */
  image?: string;
  /** the PDF (URL or /public path) opened in the modal's reader */
  pdf: string;
  /** two colors used for the card border + modal accent */
  accent?: [string, string];
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
import NoteModal from "./NoteModal.vue";
import { NOTES_FILTERABLE_TAGS } from "../data/filters";

const styles = useCssModule();

const props = defineProps<{ notes: Note[] }>();

const selected = ref<Note | null>(null);
const openCard = (n: Note) => (selected.value = n);

// The currently selected tag filter; null shows every note.
const activeTag = ref<string | null>(null);

// Curated filter chips (see src/data/filters.ts). Unlike the projects
// carousel, these render even when no note uses them yet — e.g.
// "Generative Models" stays visible as a placeholder category.
const allTags = computed(() => NOTES_FILTERABLE_TAGS);

const filteredNotes = computed(() =>
  activeTag.value
    ? props.notes.filter((n) => n.tags?.includes(activeTag.value!))
    : props.notes,
);

// Clicking the active tag (or "All") clears the filter; otherwise apply it.
// Either way reset to the first page so the new set starts from the top.
const selectTag = (t: string | null) => {
  const next = t === activeTag.value ? null : t;
  activeTag.value = next;
  dir.value = 1;
  page.value = 0;
};

// Cards shown per page adapt to how many fit, capped so the cards keep the
// same width they had in the grid (~250–270px on desktop).
const CARD_MIN = 240; // px — minimum comfortable card width
const GAP = 24; // px — gap between cards
const MAX_PER_PAGE = 6;

const stageRef = ref<HTMLElement | null>(null);
const perPage = ref(1);
const page = ref(0);
// 1 = next, -1 = previous; tracks direction for the slide transition.
const dir = ref(1);

const pageCount = computed(() =>
  Math.max(1, Math.ceil(filteredNotes.value.length / perPage.value)),
);

const pageItems = computed(() => {
  const start = page.value * perPage.value;
  return filteredNotes.value.slice(start, start + perPage.value);
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
    Math.max(0, Math.ceil(filteredNotes.value.length / next) - 1),
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
    <div :class="styles.filters" role="group" aria-label="Filter notes by tag">
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
        aria-label="Previous notes"
        @click="go(-1)"
      >
        ‹
      </button>

      <div ref="stageRef" :class="styles.stage">
        <Transition :name="dir === 1 ? 'slideNext' : 'slidePrev'" mode="out-in">
          <div
            v-if="pageItems.length"
            :key="`${activeTag}-${page}`"
            :class="styles.grid"
            :style="{ gridTemplateColumns: `repeat(${perPage}, minmax(0, 1fr))` }"
          >
            <article
              v-for="(n, i) in pageItems"
              :key="page * perPage + i"
              :class="styles.card"
              role="button"
              tabindex="0"
              :aria-label="`Open ${n.title}`"
              :style="{
                '--a1': n.accent?.[0] ?? '#f59e0b',
                '--a2': n.accent?.[1] ?? '#fcd34d',
              }"
              @click="openCard(n)"
              @keydown.enter.prevent="openCard(n)"
              @keydown.space.prevent="openCard(n)"
            >
              <div :class="styles.cardMedia">
                <img
                  v-if="n.image"
                  :class="styles.media"
                  :src="n.image"
                  :alt="n.title"
                  loading="lazy"
                />
                <div v-else :class="styles.mediaPlaceholder" aria-hidden="true" />
              </div>

              <div :class="styles.cardBody">
                <h3 :class="styles.cardTitle">{{ n.title }}</h3>

                <div v-if="n.tags?.length" :class="styles.tags">
                  <span v-for="t in n.tags" :key="t" :class="styles.tag">{{
                    t
                  }}</span>
                </div>
              </div>
            </article>
          </div>

          <div
            v-else
            :key="`empty-${activeTag}`"
            :class="styles.empty"
          >
            No notes in this category yet — check back soon.
          </div>
        </Transition>
      </div>

      <button
        v-if="pageCount > 1"
        type="button"
        :class="styles.navBtn"
        aria-label="Next notes"
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

    <NoteModal :note="selected" @close="selected = null" />
  </div>
</template>

<style module>
.carousel {
  width: 100%;
}

/* Clickable tag chips that filter the carousel to matching notes. */
.filters {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin: 32px 0 30px;
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

/* Active chip — amber gradient to match the Notes header. */
.filterActive,
.filterActive:hover {
  color: #0b0b0b;
  font-weight: 600;
  border-color: transparent;
  background: linear-gradient(90deg, #d97706, #fcd34d);
  box-shadow: 0 6px 18px rgba(245, 158, 11, 0.25);
}

/* Shown when a tag filter matches no notes (e.g. "Generative Models"). */
.empty {
  padding: 72px 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.45);
  font-size: 15px;
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

.card {
  position: relative;
  display: flex;
  flex-direction: column;
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

.card:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
  border-color: color-mix(in srgb, var(--a1) 45%, rgba(255, 255, 255, 0.06));
}

/* Pixelated marching border: square dashes that travel clockwise around the
   perimeter, tinted with the card's accent colors (same as project cards). */
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
  animation: noteBorderMarch 1.6s linear infinite;
}

.card:hover::after {
  opacity: 1;
  animation-duration: 0.9s;
}

@keyframes noteBorderMarch {
  to {
    background-position:
      var(--period) 0,
      calc(-1 * var(--period)) 100%,
      0 calc(-1 * var(--period)),
      100% var(--period);
  }
}

@media (prefers-reduced-motion: reduce) {
  .card::after {
    animation: none;
  }
}

/* Media area: renders the first page of the note's PDF (portrait, ~3:4). */
.cardMedia {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  background: rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.media {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  background: #000;
  pointer-events: none;
}

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

.cardBody {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 16px 18px 18px;
}

.cardTitle {
  margin: 0 0 12px;
  font-family: "Epilogue", system-ui, sans-serif;
  font-weight: 700;
  font-size: 17px;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.94);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: auto;
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

/* Slide transitions between pages */
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
</style>
