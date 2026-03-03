export function useFormatting() {
    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }
    function formateDateToTimestamp(date, time="00:00") {
        const isoString = `${date}T${time}:00`;
        const isoDate = new Date(isoString);
        return isoDate.getTime();
    }

    function formatPrice(price) {
        return new Intl.NumberFormat("de-DE", {
            style: "currency",
            currency: "EUR",
        }).format(price);
    }

    return { formatDate, formatPrice,formateDateToTimestamp };
}