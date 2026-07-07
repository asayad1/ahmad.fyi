<script lang="ts">
export interface Note {
  title: string;
  /** image shown on the card's cover */
  image?: string;
  /** the PDF (URL or /public path) opened in the modal's reader */
  pdf: string;
  /** two colors used for the card border + modal accent */
  accent?: [string, string];
}
</script>

<script setup lang="ts">
import { ref, useCssModule } from "vue";
import NoteModal from "./NoteModal.vue";

const styles = useCssModule();

defineProps<{ notes: Note[] }>();

const selected = ref<Note | null>(null);
</script>

<template>
  <div :class="styles.grid">
    <article
      v-for="(n, i) in notes"
      :key="i"
      :class="styles.card"
      role="button"
      tabindex="0"
      :aria-label="`Open ${n.title}`"
      :style="{
        '--a1': n.accent?.[0] ?? '#f59e0b',
        '--a2': n.accent?.[1] ?? '#fcd34d',
      }"
      @click="selected = n"
      @keydown.enter.prevent="selected = n"
      @keydown.space.prevent="selected = n"
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

      <h3 :class="styles.cardTitle">{{ n.title }}</h3>
    </article>
  </div>

  <NoteModal :note="selected" @close="selected = null" />
</template>

<style module>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;
  margin-top: 32px;
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

.cardMedia {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
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

.cardTitle {
  margin: 0;
  padding: 16px 18px;
  font-family: "Epilogue", system-ui, sans-serif;
  font-weight: 700;
  font-size: 17px;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.94);
}

@media (max-width: 560px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
  }
}
</style>
