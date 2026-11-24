// Tekstovi poruka gostima na HR / EN / DE.

export type Lang = 'hr' | 'en' | 'de';
export function lang(l?: string | null): Lang {
  return l === 'en' || l === 'de' ? l : 'hr';
}

export type MessageKind = 'confirmation' | 'reminder' | 'cancellation' | 'review_request' | 'guarantee_link' | 'modified';

export interface MessageData {
  restaurantName: string;
  guestName: string;
  date: string;      // lokalni datum YYYY-MM-DD
  time: string;      // HH:MM
  partySize: number;
  code: string;
  manageUrl?: string;
  guaranteeUrl?: string;
  reviewUrl?: string;
  noShowFee?: string; // npr. "20,00 €"
}

function fmtDate(date: string, l: Lang): string {
  const [y, m, d] = date.split('-');
  return l === 'en' ? `${d}/${m}/${y}` : `${Number(d)}.${Number(m)}.${y}.`;
}

const T: Record<Lang, Record<MessageKind, (d: MessageData) => { subject: string; text: string }>> = {
  hr: {
    confirmation: (d) => ({
      subject: `Rezervacija potvrđena – ${d.restaurantName}`,
      text: `Poštovani/a ${d.guestName},\n\nvaša rezervacija u ${d.restaurantName} je potvrđena: ${fmtDate(d.date, 'hr')} u ${d.time}, ${d.partySize} os.\nŠifra rezervacije: ${d.code}\n${d.manageUrl ? `Izmjena ili otkaz: ${d.manageUrl}\n` : ''}\nVidimo se!`,
    }),
    modified: (d) => ({
      subject: `Rezervacija izmijenjena – ${d.restaurantName}`,
      text: `Poštovani/a ${d.guestName},\n\nvaša rezervacija je izmijenjena: ${fmtDate(d.date, 'hr')} u ${d.time}, ${d.partySize} os.\nŠifra: ${d.code}`,
    }),
    reminder: (d) => ({
      subject: `Podsjetnik: ${d.restaurantName} sutra u ${d.time}`,
      text: `Poštovani/a ${d.guestName},\n\npodsjećamo vas na rezervaciju u ${d.restaurantName}: ${fmtDate(d.date, 'hr')} u ${d.time}, ${d.partySize} os.\n${d.manageUrl ? `Ako ne možete doći, otkažite ovdje: ${d.manageUrl}` : ''}`,
    }),
    cancellation: (d) => ({
      subject: `Rezervacija otkazana – ${d.restaurantName}`,
      text: `Poštovani/a ${d.guestName},\n\nvaša rezervacija ${d.code} za ${fmtDate(d.date, 'hr')} u ${d.time} je otkazana.`,
    }),
    guarantee_link: (d) => ({
      subject: `Potvrdite rezervaciju – ${d.restaurantName}`,
      text: `Poštovani/a ${d.guestName},\n\nza potvrdu rezervacije (${fmtDate(d.date, 'hr')} u ${d.time}, ${d.partySize} os.) ostavite karticu kao garanciju: ${d.guaranteeUrl}\nNišta se ne naplaćuje ako dođete ili otkažete na vrijeme.${d.noShowFee ? ` U slučaju nedolaska naplaćuje se ${d.noShowFee} po osobi.` : ''}\nLink vrijedi 30 minuta.`,
    }),
    review_request: (d) => ({
      subject: `Hvala na posjetu – ${d.restaurantName}`,
      text: `Hvala vam što ste bili naši gosti, ${d.guestName}! Ako vam se svidjelo, bit ćemo zahvalni na recenziji: ${d.reviewUrl}`,
    }),
  },
  en: {
    confirmation: (d) => ({
      subject: `Booking confirmed – ${d.restaurantName}`,
      text: `Dear ${d.guestName},\n\nyour table at ${d.restaurantName} is confirmed: ${fmtDate(d.date, 'en')} at ${d.time}, ${d.partySize} guests.\nBooking code: ${d.code}\n${d.manageUrl ? `Change or cancel: ${d.manageUrl}\n` : ''}\nSee you soon!`,
    }),
    modified: (d) => ({
      subject: `Booking changed – ${d.restaurantName}`,
      text: `Dear ${d.guestName},\n\nyour booking has been changed: ${fmtDate(d.date, 'en')} at ${d.time}, ${d.partySize} guests.\nCode: ${d.code}`,
    }),
    reminder: (d) => ({
      subject: `Reminder: ${d.restaurantName} tomorrow at ${d.time}`,
      text: `Dear ${d.guestName},\n\na reminder of your booking at ${d.restaurantName}: ${fmtDate(d.date, 'en')} at ${d.time}, ${d.partySize} guests.\n${d.manageUrl ? `If you can't make it, please cancel here: ${d.manageUrl}` : ''}`,
    }),
    cancellation: (d) => ({
      subject: `Booking cancelled – ${d.restaurantName}`,
      text: `Dear ${d.guestName},\n\nyour booking ${d.code} for ${fmtDate(d.date, 'en')} at ${d.time} has been cancelled.`,
    }),
    guarantee_link: (d) => ({
      subject: `Confirm your booking – ${d.restaurantName}`,
      text: `Dear ${d.guestName},\n\nto confirm your booking (${fmtDate(d.date, 'en')} at ${d.time}, ${d.partySize} guests) please leave a card as a guarantee: ${d.guaranteeUrl}\nNothing is charged if you come or cancel in time.${d.noShowFee ? ` A no-show fee of ${d.noShowFee} per person applies.` : ''}\nThe link is valid for 30 minutes.`,
    }),
    review_request: (d) => ({
      subject: `Thank you for visiting ${d.restaurantName}`,
      text: `Thank you for dining with us, ${d.guestName}! If you enjoyed it, a review would mean a lot: ${d.reviewUrl}`,
    }),
  },
  de: {
    confirmation: (d) => ({
      subject: `Reservierung bestätigt – ${d.restaurantName}`,
      text: `Hallo ${d.guestName},\n\nIhre Reservierung im ${d.restaurantName} ist bestätigt: ${fmtDate(d.date, 'de')} um ${d.time} Uhr, ${d.partySize} Pers.\nReservierungscode: ${d.code}\n${d.manageUrl ? `Ändern oder stornieren: ${d.manageUrl}\n` : ''}\nBis bald!`,
    }),
    modified: (d) => ({
      subject: `Reservierung geändert – ${d.restaurantName}`,
      text: `Hallo ${d.guestName},\n\nIhre Reservierung wurde geändert: ${fmtDate(d.date, 'de')} um ${d.time} Uhr, ${d.partySize} Pers.\nCode: ${d.code}`,
    }),
    reminder: (d) => ({
      subject: `Erinnerung: ${d.restaurantName} morgen um ${d.time} Uhr`,
      text: `Hallo ${d.guestName},\n\nwir erinnern an Ihre Reservierung im ${d.restaurantName}: ${fmtDate(d.date, 'de')} um ${d.time} Uhr, ${d.partySize} Pers.\n${d.manageUrl ? `Falls Sie nicht kommen können, stornieren Sie bitte hier: ${d.manageUrl}` : ''}`,
    }),
    cancellation: (d) => ({
      subject: `Reservierung storniert – ${d.restaurantName}`,
      text: `Hallo ${d.guestName},\n\nIhre Reservierung ${d.code} für ${fmtDate(d.date, 'de')} um ${d.time} Uhr wurde storniert.`,
    }),
    guarantee_link: (d) => ({
      subject: `Reservierung bestätigen – ${d.restaurantName}`,
      text: `Hallo ${d.guestName},\n\nbitte hinterlegen Sie zur Bestätigung (${fmtDate(d.date, 'de')} um ${d.time} Uhr, ${d.partySize} Pers.) eine Karte als Garantie: ${d.guaranteeUrl}\nEs wird nichts belastet, wenn Sie kommen oder rechtzeitig stornieren.${d.noShowFee ? ` Bei Nichterscheinen werden ${d.noShowFee} pro Person berechnet.` : ''}\nDer Link ist 30 Minuten gültig.`,
    }),
    review_request: (d) => ({
      subject: `Danke für Ihren Besuch im ${d.restaurantName}`,
      text: `Danke für Ihren Besuch, ${d.guestName}! Wenn es Ihnen gefallen hat, freuen wir uns über eine Bewertung: ${d.reviewUrl}`,
    }),
  },
};

export function renderMessage(kind: MessageKind, l: string | null | undefined, d: MessageData) {
  return T[lang(l)][kind](d);
}

/** Nazivi WhatsApp predložaka koje treba odobriti u Meta Business Manageru (vidi docs/whatsapp-predlosci.md). */
export const WHATSAPP_TEMPLATES: Record<MessageKind, string> = {
  confirmation: 'opsis_potvrda',
  modified: 'opsis_izmjena',
  reminder: 'opsis_podsjetnik',
  cancellation: 'opsis_otkaz',
  guarantee_link: 'opsis_garancija',
  review_request: 'opsis_recenzija',
};

export function formatEur(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €';
}
