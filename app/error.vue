<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps({
  error: Object as () => NuxtError,
});

const handleError = () => clearError({ redirect: "/" });

const errorConfig: Record<
  number,
  { title: string; icon: string; message: string }
> = {
  404: {
    title: "Seite nicht gefunden",
    icon: "i-lucide-search",
    message: "Die angeforderte Seite existiert nicht oder wurde verschoben.",
  },
  403: {
    title: "Zugriff verweigert",
    icon: "i-lucide-lock",
    message: "Sie haben keine Berechtigung, diese Seite aufzurufen.",
  },
  500: {
    title: "Serverfehler",
    icon: "i-lucide-cog",
    message:
      "Ein interner Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
  },
};

const getErrorInfo = (code?: number) =>
  errorConfig[code ?? 500] ?? {
    title: "Ein Fehler ist aufgetreten",
    icon: "i-lucide-bug",
    message: "Etwas ist schiefgelaufen.",
  };

const { t } = useI18n();

const pageTitle = computed(() => {
  const code = props.error?.statusCode;
  if (code === 404) return t("meta.pages.notFound");
  if (code === 403) return t("meta.pages.forbidden");
  if (code === 500) return t("meta.pages.serverError");
  return t("meta.pages.error");
});

usePageTitle(pageTitle);
</script>

<template>
  <PageBackground class="error-page" theme="dark" variant="poly" :vignette="true" intensity="normal" >
    <div class="error-card">
      <UIcon
        size="48"
        :name="getErrorInfo(error?.statusCode).icon"
        class="mb-4"
      />
      <h1 class="error-code">{{ error?.statusCode ?? "Fehler" }}</h1>
      <h2 class="error-title">{{ getErrorInfo(error?.statusCode).title }}</h2>
      <p class="error-message">{{ getErrorInfo(error?.statusCode).message }}</p>

      <div class="error-details" v-if="error?.url">
        <code>{{ error.url }}</code>
      </div>

      <div class="error-actions">
        <button class="btn-primary" @click="handleError">Zur Startseite</button>
        <button class="btn-secondary" @click="$router.back()">Zurück</button>
      </div>
    </div>
  </PageBackground>
</template>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  font-family: system-ui, -apple-system, sans-serif;
}

.error-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.5rem;
  padding: 3rem 2.5rem;
  text-align: center;
  height: 600px;
  max-width: 480px;
  width: 100%;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 1rem;
}

.error-code {
  font-size: 5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  line-height: 1;
}

.error-title {
  color: #fff;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 1rem 0 0.5rem;
}

.error-message {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 1.5rem;
}

.error-details {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  margin-bottom: 2rem;
}

.error-details code {
  color: #f472b6;
  font-size: 0.875rem;
  word-break: break-all;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  padding: 0.875rem 1.75rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}
</style>
