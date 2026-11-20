import { describe, expect, it } from "vitest";

import {
  contactPersonOf,
  programOf,
  speakersOf,
} from "~/utils/eventPeople.js";

function organizer(fields = {}) {
  return {
    eventOrganizer: {
      name: "Stadtbibliothek",
      addContactPerson: true,
      contactPersonName: "Erika Muster",
      contactPersonPhoneNumber: "0123 456",
      contactPersonEmailAddress: "erika@example.org",
      contactPersonImage: "https://media.example/erika.jpg",
      speakers: [],
      ...fields,
    },
  };
}

describe("contactPersonOf", () => {
  it("reads name, phone, email and photo", () => {
    expect(contactPersonOf(organizer())).toEqual({
      name: "Erika Muster",
      phone: "0123 456",
      email: "erika@example.org",
      image: "https://media.example/erika.jpg",
    });
  });

  it("is null when the contact person is switched off", () => {
    expect(contactPersonOf(organizer({ addContactPerson: false }))).toBeNull();
  });

  it("is null without a name", () => {
    expect(contactPersonOf(organizer({ contactPersonName: "  " }))).toBeNull();
    expect(contactPersonOf({})).toBeNull();
    expect(contactPersonOf(undefined)).toBeNull();
  });

  it("leaves missing details empty", () => {
    expect(
      contactPersonOf(
        organizer({
          contactPersonPhoneNumber: undefined,
          contactPersonEmailAddress: "",
          contactPersonImage: null,
        }),
      ),
    ).toEqual({ name: "Erika Muster", phone: "", email: "", image: "" });
  });
});

describe("speakersOf", () => {
  it("keeps speakers with a name in their order", () => {
    const event = organizer({
      speakers: [
        {
          id: "1",
          name: "Max",
          emailAddress: "max@example.org",
          image: "https://media.example/max.jpg",
        },
        { id: "2", name: "" },
        { id: "3", name: "Mia" },
      ],
    });

    expect(speakersOf(event)).toEqual([
      {
        name: "Max",
        email: "max@example.org",
        image: "https://media.example/max.jpg",
      },
      { name: "Mia", email: "", image: "" },
    ]);
  });

  it("is empty without speakers", () => {
    expect(speakersOf({})).toEqual([]);
    expect(speakersOf(organizer({ speakers: null }))).toEqual([]);
  });
});

describe("programOf", () => {
  it("sorts days by date and time and items by time", () => {
    const event = {
      schedules: [
        {
          id: "2",
          date: "2026-05-02",
          time: "09:00",
          description: "Tag 2",
          schedules: [],
        },
        {
          id: "1",
          date: "2026-05-01",
          time: "10:00",
          description: "Tag 1",
          schedules: [
            { id: "b", time: "11:00", description: "Workshop" },
            { id: "a", time: "10:00", description: "Begrüßung" },
            { id: "c", time: "", description: "Ausklang" },
          ],
        },
      ],
    };

    expect(programOf(event)).toEqual([
      {
        date: "2026-05-01",
        time: "10:00",
        description: "Tag 1",
        items: [
          { time: "10:00", description: "Begrüßung" },
          { time: "11:00", description: "Workshop" },
          { time: "", description: "Ausklang" },
        ],
      },
      { date: "2026-05-02", time: "09:00", description: "Tag 2", items: [] },
    ]);
  });

  it("leaves out empty items and empty days", () => {
    const event = {
      schedules: [
        { date: "", time: "", description: "", schedules: [] },
        {
          date: "2026-05-01",
          time: "",
          description: "",
          schedules: [{ time: "", description: "" }],
        },
      ],
    };

    expect(programOf(event)).toEqual([
      { date: "2026-05-01", time: "", description: "", items: [] },
    ]);
  });

  it("is empty without schedules", () => {
    expect(programOf({})).toEqual([]);
    expect(programOf({ schedules: null })).toEqual([]);
  });
});
