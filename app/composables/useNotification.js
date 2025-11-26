

const typeToColor = {
  success: "green",
  error: "red",
  warning: "amber",
  info: "blue",
};

function mapTitle(type) {
  switch (type) {
    case "success":
      return "Erfolg";
    case "error":
      return "Fehler";
    case "warning":
      return "Achtung";
    default:
      return "Info";
  }
}

export function useNotification() {
  const toast = useToast();

  function showNotification(payload) {
    const type = payload.type || "info";
    const title = payload.title || mapTitle(type);
    const message = payload.message;

    toast.add({
      title,
      description: message,
      color: typeToColor[type],
      icon: payload.icon || "info",
    });
  }

  function success(message, title) {
    showNotification({ message, title, type: "success", icon: "i-lucide-circle-check" });
  }

  function error(message, title) {
    showNotification({ message, title, type: "error", icon: "i-lucide-circle-x" });
  }

  function warning(message, title) {
    showNotification({ message, title, type: "warning", icon: "i-lucide-circle-alert" });
  }

  function info(message, title) {
    showNotification({ message, title, type: "info", icon: "i-lucide-info" });
  }

  return {
    show: showNotification,
    success,
    error,
    warning,
    info,
  };
}
