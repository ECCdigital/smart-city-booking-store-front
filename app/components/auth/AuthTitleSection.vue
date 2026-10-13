<template>
  <div>
    <!-- PROTOTYPE #513: Varianten A–D. Variante 0 ist der Stand von 1.2.x. -->
    <template v-if="variant !== '0'">
      <div
        v-if="isLargeVersion || placement !== 'page'"
        :class="placement === 'page' ? 'hidden lg:flex items-center justify-center' : 'flex'"
      >
        <div :class="boxClasses">
          <PrototypeLoginLogo
            :instance-logo="logo"
            :alt="title"
            :max-height="largeSize"
          />
          <p :class="titleClasses">
            {{ title }}
          </p>
        </div>
      </div>

      <div v-else class="flex flex-col items-center">
        <div :class="[boxClasses, 'mb-6']">
          <PrototypeLoginLogo
            :instance-logo="logo"
            :alt="title"
            :max-height="smallSize"
          />
          <p :class="titleClasses">
            {{ title }}
          </p>
        </div>
      </div>
    </template>

    <template v-else>
      <div
        v-if="isLargeVersion"
        class="hidden lg:flex items-center justify-center"
      >
        <div class="max-w-md text-center">
          <div class="mb-10 grid space-y-2 content-center justify-items-center">
            <PrototypeLoginLogo
              :instance-logo="logo"
              :alt="title"
              max-height="sm"
            />
            <p class="text-primary font-bold text-xl">
              {{ title }}
            </p>
          </div>
        </div>
      </div>

      <div v-else class="flex flex-col items-center">
        <PrototypeLoginLogo
          :instance-logo="logo"
          :alt="title"
          max-height="sm"
          class="mb-6"
        />
        <p class="text-primary font-bold text-xl text-center mb-6">
          {{ title }}
        </p>
      </div>
    </template>
  </div>
</template>
<script setup>
/**
 * The title above the auth forms: the logo and the Portal Name, both from
 * the Theme View the page already holds — nothing is fetched here. Without
 * a logo the Portal Name stands alone.
 *
 * PROTOTYPE #513: rendert je nach ?variant= anders. `placement` sagt, wo der
 * Titel steht: frei auf der Seite, in der Login-Karte (B) oder im Band (D).
 */
const props = defineProps({
  isLargeVersion: {
    type: Boolean,
    default: false,
  },
  placement: {
    type: String,
    default: "page",
  },
});

const { data: theme } = await useThemeBundle();
const logo = computed(() => theme.value?.logo ?? null);
const siteName = useSiteName();

const proto = useLoginPrototype();
const variant = proto.variant;
const title = computed(() =>
  proto.longName.value ? proto.longNameText : siteName.value,
);

const STEPS = ["xs", "sm", "md", "lg", "xl"];
/** Auf dem Telefon höchstens M. */
const largeSize = computed(() => proto.size.value);
const smallSize = computed(() =>
  STEPS.indexOf(proto.size.value) > STEPS.indexOf("md") ? "md" : proto.size.value,
);

const neutralText = "text-gray-900 dark:text-white";

const boxClasses = computed(() => {
  switch (props.placement) {
    case "card":
      return "grid gap-3 justify-items-center text-center pb-2";
    case "band":
      return "flex items-center gap-4 min-w-0";
  }
  switch (variant.value) {
    case "A":
      if (proto.panelLight.value) {
        return "bg-white/90 backdrop-blur-lg rounded-xl shadow-xl px-8 py-6 max-w-md grid gap-3 justify-items-center text-center";
      }
      return "glass rounded-xl shadow-xl px-8 py-6 max-w-md grid gap-3 justify-items-center text-center";
    case "C":
      return `max-w-md grid gap-3 justify-items-center text-center proto-halo-${proto.brightness.value}`;
  }
  return "max-w-md grid gap-3 justify-items-center text-center";
});

const titleClasses = computed(() => {
  const base = props.placement === "band" ? "font-semibold text-lg leading-tight" : "font-bold text-xl";
  if (variant.value === "C" && props.placement === "page") {
    return [base, proto.brightness.value === "dunkel" ? "text-white" : "text-gray-900 dark:text-white"];
  }
  if (variant.value === "A" && proto.panelLight.value) {
    return [base, proto.titlePrimary.value ? "text-primary" : "text-gray-900"];
  }
  return [base, proto.titlePrimary.value ? "text-primary" : neutralText];
});
</script>

<style>
/* PROTOTYPE #513, Variante C: Schein in der Gegenfarbe um Schrift und Logo. */
.proto-halo-hell p {
  text-shadow: 0 0 2px #fff, 0 0 8px #fff, 0 0 16px rgb(255 255 255 / 0.8);
}
.proto-halo-hell img {
  filter: drop-shadow(0 0 2px #fff) drop-shadow(0 0 8px rgb(255 255 255 / 0.9));
}
.dark .proto-halo-hell p,
.proto-halo-dunkel p {
  text-shadow: 0 0 2px #000, 0 0 8px #000, 0 0 16px rgb(0 0 0 / 0.7);
}
.dark .proto-halo-hell img,
.proto-halo-dunkel img {
  filter: drop-shadow(0 0 2px #000) drop-shadow(0 0 8px rgb(0 0 0 / 0.8));
}
/* Der Schein darf die Invertierung im Dunkelmodus nicht schlucken. */
.dark :is(.proto-halo-hell, .proto-halo-dunkel) img.dark\:invert {
  filter: invert(1) hue-rotate(180deg) drop-shadow(0 0 2px #000) drop-shadow(0 0 8px rgb(0 0 0 / 0.8));
}
</style>
