<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted, useCssModule } from "vue";
import type { Note } from "./NotesGrid.vue";

const styles = useCssModule();

const props = defineProps<{ note: Note | null }>();
const emit = defineEmits<{ close: [] }>();

const accent = computed<[string, string]>(() => [
  props.note?.accent?.[0] ?? "#f59e0b",
  props.note?.accent?.[1] ?? "#fcd34d",
]);

const close = () => emit("close");

const onKey = (e: KeyboardEvent) => {
  if (!props.note) return;
  if (e.key === "Escape") close();
};

// Lock body scroll while the modal is open.
watch(
  () => props.note,
  (n) => {
    document.body.style.overflow = n ? "hidden" : "";
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
      <div v-if="note" :class="styles.backdrop" @click.self="close">
        <div
          :class="styles.modal"
          role="dialog"
          aria-modal="true"
          :aria-label="note.title"
          :style="{ '--a1': accent[0], '--a2': accent[1] }"
        >
          <div :class="styles.header">
            <h2 :class="styles.title">{{ note.title }}</h2>
            <button
              type="button"
              :class="styles.close"
              aria-label="Close"
              @click="close"
            >
              ✕
            </button>
          </div>

          <div :class="styles.viewer">
            <iframe
              v-if="note.pdf"
              :class="styles.pdf"
              :src="note.pdf"
              title="PDF document"
            />
            <div v-else :class="styles.viewEmpty">No PDF yet</div>
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
  flex-direction: column;
  width: min(1400px, 96vw);
  height: min(920px, 92vh);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #0e0e10;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--a1) 14%, transparent),
    transparent 60%
  );
}

.title {
  margin: 0;
  font-family: "Epilogue", system-ui, sans-serif;
  font-weight: 700;
  font-size: clamp(18px, 2.2vw, 24px);
  line-height: 1.25;
  color: rgba(255, 255, 255, 0.97);
}

.close {
  flex-shrink: 0;
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

.viewer {
  flex: 1;
  min-height: 0;
  background: #000;
  display: grid;
  place-items: center;
}

.pdf {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

.viewEmpty {
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
}

@media (max-width: 640px) {
  .modal {
    border-radius: 0;
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
