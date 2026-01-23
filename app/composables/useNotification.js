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

function mapIcon(type) {
  switch (type) {
    case "success":
      return "i-lucide-circle-check";
    case "error":
      return "i-lucide-circle-x";
    case "warning":
      return "i-lucide-circle-alert";
    default:
      return "i-lucide-info";
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
      variant: type,
      icon: payload.icon || mapIcon(type),
      ui: {
        root: "bg-white/60 dark:bg-gray-900/80 backdrop-blur-lg",
      },
    });
  }

  function success(message, title) {
    showNotification({
      message,
      title,
      type: "success",
      icon: "i-lucide-circle-check",
    });
  }

  function error(message, title) {
    showNotification({
      message,
      title,
      type: "error",
      icon: "i-lucide-circle-x",
    });
  }

  function warning(message, title) {
    showNotification({
      message,
      title,
      type: "warning",
      icon: "i-lucide-circle-alert",
    });
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
