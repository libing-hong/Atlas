export type AcceptedVisaOffer = {
  applicationId: string;
  universityName: string;
  programName: string;
  country: string;
  acceptedAt: string;
};

type VisaSelectionState = {
  current: AcceptedVisaOffer | null;
  archived: AcceptedVisaOffer[];
};

const storageKey = "atlas.visa.accepted-offer.v1";
const eventName = "atlas-visa-selection-change";

function emptyState(): VisaSelectionState {
  return { current: null, archived: [] };
}

export function readVisaSelection(): VisaSelectionState {
  if (typeof window === "undefined") return emptyState();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? "null") as VisaSelectionState | null;
    return parsed?.current !== undefined && Array.isArray(parsed.archived) ? parsed : emptyState();
  } catch {
    return emptyState();
  }
}

export function getVisaSelectionSnapshot() {
  return typeof window === "undefined" ? "server" : JSON.stringify(readVisaSelection());
}

export function getServerVisaSelectionSnapshot() {
  return "server";
}

export function subscribeToVisaSelection(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(eventName, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(eventName, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function confirmAcceptedOffer(offer: Omit<AcceptedVisaOffer, "acceptedAt">) {
  const previous = readVisaSelection();
  const current = { ...offer, acceptedAt: new Date().toISOString() };
  const changedCountry = previous.current && previous.current.country !== current.country;
  const archived = changedCountry && previous.current
    ? [previous.current, ...previous.archived]
    : previous.archived;
  window.localStorage.setItem(storageKey, JSON.stringify({ current, archived }));
  window.dispatchEvent(new Event(eventName));
}
