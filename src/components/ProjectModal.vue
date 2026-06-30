<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, useCssModule } from "vue";
import type { Project } from "./ProjectsCarousel.vue";

const styles = useCssModule();

const props = defineProps<{ project: Project | null }>();
const emit = defineEmits<{ close: [] }>();

interface Viewable {
  kind: "image" | "video" | "embed" | "pdf";
  src: string;
  poster?: string;
}

// Normalize gallery + single media + paper into one list of viewable items.
const views = computed<Viewable[]>(() => {
  const p = props.project;
  if (!p) return [];
  const out: Viewable[] = [];
  const gallery =
    p.gallery && p.gallery.length
      ? p.gallery
      : [{ image: p.image, video: p.video, poster: p.poster, embed: p.embed }];

  for (const m of gallery) {
    if (m.embed) out.push({ kind: "embed", src: m.embed });
    else if (m.video) out.push({ kind: "video", src: m.video, poster: m.poster });
    else if (m.image) out.push({ kind: "image", src: m.image });
  }
  if (p.paper) out.push({ kind: "pdf", src: p.paper });
  return out;
});

const activeView = ref(0);
const current = computed(() => views.value[activeView.value]);

const accent = computed<[string, string]>(() => [
  props.project?.accent?.[0] ?? "#60a5fa",
  props.project?.accent?.[1] ?? "#a78bfa",
]);

// Reset to the first item whenever a different project opens.
watch(
  () => props.project,
  () => {
    activeView.value = 0;
  },
);

const close = () => emit("close");

const onKey = (e: KeyboardEvent) => {
  if (!props.project) return;
  if (e.key === "Escape") close();
};

// Lock body scroll while the modal is open.
watch(
  () => props.project,
  (p) => {
    document.body.style.overflow = p ? "hidden" : "";
  },
);

onMounted(() => window.addEventListener("keydown", onKey));
onUnmounted(() => {
  window.removeEventListener("keydown", onKey);
  document.body.style.overflow = "";
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modalFade">
      <div
        v-if="project"
        :class="styles.backdrop"
        @click.self="close"
      >
        <div
          :class="styles.modal"
          role="dialog"
          aria-modal="true"
          :aria-label="project.title"
          :style="{ '--a1': accent[0], '--a2': accent[1] }"
        >
          <button
            type="button"
            :class="styles.close"
            aria-label="Close"
            @click="close"
          >
            ✕
          </button>

          <!-- LEFT: info -->
          <div :class="styles.info">
            <h2 :class="styles.title">{{ project.title }}</h2>
            <p :class="styles.desc">{{ project.description }}</p>

            <div v-if="project.tags?.length" :class="styles.stack">
              <span :class="styles.stackLabel">Tech stack</span>
              <div :class="styles.tags">
                <span v-for="t in project.tags" :key="t" :class="styles.tag">{{
                  t
                }}</span>
              </div>
            </div>

            <a
              v-if="project.link"
              :class="styles.link"
              :href="project.link"
              target="_blank"
              rel="noopener noreferrer"
            >
              View project →
            </a>
          </div>

          <!-- RIGHT: gallery / pdf viewer -->
          <div :class="styles.gallery">
            <div :class="styles.viewer">
              <template v-if="current">
                <img
                  v-if="current.kind === 'image'"
                  :class="styles.viewMedia"
                  :src="current.src"
                  :alt="project.title"
                />
                <video
                  v-else-if="current.kind === 'video'"
                  :class="styles.viewMedia"
                  :src="current.src"
                  :poster="current.poster"
                  controls
                  playsinline
                />
                <iframe
                  v-else-if="current.kind === 'embed'"
                  :class="styles.viewMedia"
                  :src="current.src"
                  :title="project.title"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                />
                <iframe
                  v-else-if="current.kind === 'pdf'"
                  :class="styles.viewMedia"
                  :src="current.src"
                  title="PDF document"
                />
              </template>
              <div v-else :class="styles.viewEmpty">No media yet</div>
            </div>

            <!-- thumbnails -->
            <div v-if="views.length > 1" :class="styles.thumbs">
              <button
                v-for="(v, i) in views"
                :key="i"
                type="button"
                :class="[styles.thumb, i === activeView ? styles.thumbActive : '']"
                :aria-label="`View item ${i + 1}`"
                @click="activeView = i"
              >
                <img
                  v-if="v.kind === 'image' || (v.kind === 'video' && v.poster)"
                  :src="v.kind === 'image' ? v.src : v.poster"
                  alt=""
                />
                <span v-else-if="v.kind === 'pdf'" :class="styles.thumbBadge"
                  >PDF</span
                >
                <span v-else :class="styles.thumbBadge">▶</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style module>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.66);
  backdrop-filter: blur(6px);
}

.modal {
  position: relative;
  display: flex;
  width: min(1120px, 94vw);
  height: min(700px, 88vh);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #0e0e10;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

.close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 3;
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(0, 0, 0, 0.4);
  color: rgba(255, 255, 255, 0.85);
  font-size: 15px;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition:
    transform 160ms ease,
    background 160ms ease,
    border-color 160ms ease;
}

.close:hover {
  transform: scale(1.06);
  background: rgba(0, 0, 0, 0.6);
  border-color: rgba(255, 255, 255, 0.4);
}

/* LEFT */
.info {
  flex: 0 0 40%;
  max-width: 460px;
  padding: 40px 34px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--a1) 10%, transparent),
    transparent 40%
  );
}

.title {
  margin: 0 0 16px;
  font-family: "Epilogue", system-ui, sans-serif;
  font-weight: 700;
  font-size: clamp(24px, 3vw, 34px);
  line-height: 1.15;
  color: rgba(255, 255, 255, 0.97);
}

.desc {
  margin: 0;
  font-size: 16px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.66);
}

.stack {
  margin-top: 28px;
}

.stackLabel {
  display: block;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
  margin-bottom: 12px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  font-size: 13px;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--a1) 45%, rgba(255, 255, 255, 0.14));
  color: rgba(255, 255, 255, 0.82);
  background: color-mix(in srgb, var(--a1) 12%, transparent);
}

.link {
  margin-top: auto;
  padding-top: 28px;
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.92);
  text-decoration: none;
  width: fit-content;
  transition:
    color 160ms ease,
    transform 160ms ease;
}

.link:hover {
  color: #fff;
  transform: translateX(3px);
}

/* RIGHT */
.gallery {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 20px;
  gap: 14px;
  background: #0a0a0c;
}

.viewer {
  position: relative;
  flex: 1;
  min-height: 0;
  border-radius: 10px;
  overflow: hidden;
  background: #000;
  display: grid;
  place-items: center;
}

.viewMedia {
  width: 100%;
  height: 100%;
  border: 0;
  object-fit: contain;
  background: #000;
  display: block;
}

.viewEmpty {
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
}

.thumbs {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.thumb {
  width: 72px;
  height: 48px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
  padding: 0;
  display: grid;
  place-items: center;
  transition:
    border-color 160ms ease,
    transform 160ms ease;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumb:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.4);
}

.thumbActive {
  border-color: var(--a1);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--a1) 60%, transparent);
}

.thumbBadge {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.8);
}

@media (max-width: 820px) {
  .modal {
    flex-direction: column;
    height: min(88vh, 760px);
  }
  .info {
    flex: 0 0 auto;
    max-width: none;
    border-right: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding: 28px 24px;
  }
}

/* enter/leave */
:global(.modalFade-enter-active),
:global(.modalFade-leave-active) {
  transition: opacity 220ms ease;
}
:global(.modalFade-enter-active) .modal,
:global(.modalFade-leave-active) .modal {
  transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
}
:global(.modalFade-enter-from),
:global(.modalFade-leave-to) {
  opacity: 0;
}
:global(.modalFade-enter-from) .modal {
  transform: translateY(18px) scale(0.98);
}
</style>
