/**
 * The contact person, the speakers and the program of an event, as the
 * detail page shows them. The admin UI keeps all three on the whole event
 * (`eventOrganizer`, `schedules`); each part is shown only when it holds
 * something.
 */

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * The contact person of an event, or null when the event names none: the
 * admin UI switched it off (`addContactPerson` false) or left the name empty.
 *
 * @param {Object} event
 * @returns {{ name: string, phone: string, email: string, image: string } | null}
 */
export function contactPersonOf(event) {
  const organizer = event?.eventOrganizer;
  if (!organizer || organizer.addContactPerson === false) return null;

  const name = text(organizer.contactPersonName);
  if (!name) return null;

  return {
    name,
    phone: text(organizer.contactPersonPhoneNumber),
    email: text(organizer.contactPersonEmailAddress),
    image: text(organizer.contactPersonImage),
  };
}

/**
 * The speakers of an event with a name, in the order the admin UI keeps.
 *
 * @param {Object} event
 * @returns {{ name: string, email: string, image: string }[]}
 */
export function speakersOf(event) {
  const speakers = event?.eventOrganizer?.speakers;
  if (!Array.isArray(speakers)) return [];

  return speakers
    .map((speaker) => ({
      name: text(speaker?.name),
      email: text(speaker?.emailAddress),
      image: text(speaker?.image),
    }))
    .filter((speaker) => speaker.name);
}

/** Sorts by a string key; an empty key goes last, ties keep their order. */
function byKey(key) {
  return (a, b) => {
    if (!a[key] || !b[key]) return Number(!a[key]) - Number(!b[key]);
    return a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
  };
}

/**
 * The program of an event: its days by date and time, each with its items
 * by time. Empty items and days without anything to show are left out.
 *
 * @param {Object} event
 * @returns {{ date: string, time: string, description: string,
 *   items: { time: string, description: string }[] }[]}
 */
export function programOf(event) {
  const days = event?.schedules;
  if (!Array.isArray(days)) return [];

  return days
    .map((day) => ({
      date: text(day?.date),
      time: text(day?.time),
      description: text(day?.description),
      items: (Array.isArray(day?.schedules) ? day.schedules : [])
        .map((item) => ({
          time: text(item?.time),
          description: text(item?.description),
        }))
        .filter((item) => item.time || item.description)
        .sort(byKey("time")),
    }))
    .filter(
      (day) => day.date || day.time || day.description || day.items.length,
    )
    .sort((a, b) => byKey("date")(a, b) || byKey("time")(a, b));
}
