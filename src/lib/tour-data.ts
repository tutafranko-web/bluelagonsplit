import { Tour, Boat } from "@/types/tour";

export const tours: Tour[] = [
  {
    id: "split-tour",
    slug: "split-tour",
    boatName: "M/Y Tamaris / M/Y Lovor",
    boatLength: "27m",
    departureCity: "Split",
    departureCityEn: "Split",
    duration: 8,
    priceFrom: 65,
    priceTo: 75,
    rating: 4.5,
    reviewCount: 760,
    heroImage: "/images/boats/tamaris-aerial-swimming.jpg",
    images: [
      "/images/boats/tamaris-aerial-swimming.jpg",
      "/images/boats/tamaris-aerial-cruise.jpg",
      "/images/boats/tamaris-deck-drinks.jpg",
      "/images/tours/blue-lagoon-aerial.jpg",
      "/images/tours/beach-swings.jpg",
      "/images/restaurant/skoy-outdoor-dining.jpg",
    ],
    stops: [
      {
        name: "Polazak iz Splita",
        nameEn: "Departure from Split",
        duration: "1h plovidba",
        activities: ["Kava i kroasan"],
        activitiesEn: ["Coffee and croissant"],
      },
      {
        name: "Bar na plaži Borkko",
        nameEn: "Borkko Beach Bar",
        duration: "1h",
        activities: ["Plivanje", "Ronjenje s maskom", "Opuštanje"],
        activitiesEn: ["Swimming", "Snorkeling", "Relaxing"],
      },
      {
        name: "Plava laguna (Drvenik Veli)",
        nameEn: "Blue Lagoon (Drvenik Veli)",
        duration: "2h",
        activities: ["Ručak", "Plivanje", "Ronjenje", "Razgledavanje"],
        activitiesEn: ["Lunch", "Swimming", "Snorkeling", "Sightseeing"],
      },
      {
        name: "Maslinica (Šolta)",
        nameEn: "Maslinica (Šolta)",
        duration: "1.5h",
        activities: ["Razgledavanje", "Plivanje", "Kava"],
        activitiesEn: ["Sightseeing", "Swimming", "Coffee"],
      },
      {
        name: "Povratak u Split",
        nameEn: "Return to Split",
        duration: "1h 15min",
        activities: ["Svježa lubenica"],
        activitiesEn: ["Fresh watermelon"],
      },
    ],
    inclusions: [
      { icon: "Coffee", text: "Kava i kroasan", textEn: "Coffee & croissant" },
      {
        icon: "UtensilsCrossed",
        text: "Mediteranski ručak (riba/piletina/vegan)",
        textEn: "Mediterranean lunch (fish/chicken/vegan)",
      },
      {
        icon: "Wine",
        text: "Neograničeno vino, voda, limunada",
        textEn: "Unlimited wine, water, lemonade",
      },
      {
        icon: "Beer",
        text: "Dodatna pića (pivo, kokteli, Coca-Cola)",
        textEn: "Extra drinks (beer, cocktails, Coca-Cola)",
      },
      {
        icon: "Waves",
        text: "Oprema za ronjenje i prsluci",
        textEn: "Snorkeling gear & swim vests",
      },
      { icon: "Wifi", text: "Wi-Fi na brodu", textEn: "On-board Wi-Fi" },
      {
        icon: "ShowerHead",
        text: "Tuševi i sefovi",
        textEn: "Showers & safes",
      },
      { icon: "Apple", text: "Desert od svježeg voća", textEn: "Fresh fruit dessert" },
    ],
    meetingPoint: {
      description:
        "Štand broj 8 na splitskoj Rivi. Mali bijeli stalak sa slikom broda, na sredini Rive, preko puta Dioklecijanove palače.",
      descriptionEn:
        "Stand #8 on Split Riva. Small white stand with boat picture, in the middle of the Riva, across from Diocletian's Palace.",
      lat: 43.5074,
      lng: 16.4406,
    },
    importantInfo: [
      "Dođite najmanje 30 minuta prije polaska",
      "Polog od 10€ za opremu za ronjenje (vraća se nakon upotrebe)",
      "Moramo krenuti točno na vrijeme zbog lučkog rasporeda",
    ],
    importantInfoEn: [
      "Arrive at least 30 minutes before departure",
      "€10 deposit for snorkeling equipment (refunded after use)",
      "We must depart on time due to harbor schedule",
    ],
    getYourGuideUrl:
      "https://www.getyourguide.com/split-l268/split-plava-laguna-plaza-borko-i-solta-s-hranom-i-picima-t639754/",
  },
  {
    id: "trogir-tour",
    slug: "trogir-tour",
    boatName: "M/B Solo",
    boatLength: "20m",
    departureCity: "Trogir",
    departureCityEn: "Trogir",
    duration: 8,
    priceFrom: 65,
    rating: 4.2,
    reviewCount: 365,
    heroImage: "/images/tours/blue-lagoon-aerial.jpg",
    images: [
      "/images/tours/blue-lagoon-aerial.jpg",
      "/images/tours/beach-aerial.jpg",
      "/images/tours/beach-deck-loungers.jpg",
      "/images/restaurant/skoy-friends-dining.jpg",
      "/images/tours/beach-hammock.jpg",
    ],
    stops: [
      {
        name: "Polazak iz Trogira",
        nameEn: "Departure from Trogir",
        duration: "50min plovidba",
        activities: ["Piće dobrodošlice"],
        activitiesEn: ["Welcome drink"],
      },
      {
        name: "Plava laguna",
        nameEn: "Blue Lagoon",
        duration: "3.5h",
        activities: [
          "Ručak",
          "Slobodno vrijeme",
          "Plivanje",
          "Ronjenje s maskom",
        ],
        activitiesEn: ["Lunch", "Free time", "Swimming", "Snorkeling"],
      },
      {
        name: "Maslinica (Šolta)",
        nameEn: "Maslinica (Šolta)",
        duration: "1.5h",
        activities: ["Kava", "Razgledavanje", "Plivanje"],
        activitiesEn: ["Coffee", "Sightseeing", "Swimming"],
      },
      {
        name: "Povratak u Trogir",
        nameEn: "Return to Trogir",
        duration: "1h plovidba",
        activities: ["Svježa lubenica"],
        activitiesEn: ["Fresh watermelon"],
      },
    ],
    inclusions: [
      {
        icon: "GlassWater",
        text: "Piće dobrodošlice",
        textEn: "Welcome drink",
      },
      {
        icon: "UtensilsCrossed",
        text: "Mediteranski ručak (riba/piletina/vegetarijanski)",
        textEn: "Mediterranean lunch (fish/chicken/vegetarian)",
      },
      {
        icon: "Wine",
        text: "Neograničeno bijelo vino, limunada, voda",
        textEn: "Unlimited white wine, lemonade, water",
      },
      {
        icon: "Waves",
        text: "Oprema za ronjenje",
        textEn: "Snorkeling equipment",
      },
      { icon: "Apple", text: "Desert od svježe lubenice", textEn: "Fresh watermelon dessert" },
      { icon: "Wifi", text: "Wi-Fi na brodu", textEn: "On-board Wi-Fi" },
      {
        icon: "Music",
        text: "Ozvučenje i sunčalište",
        textEn: "Sound system & sun deck",
      },
    ],
    meetingPoint: {
      description:
        "Motorni brod 'Solo' — 20m bijeli drveni brod sa smeđim detaljima i crvenim sunčanim krovom. Odmah preko puta hotela Vila Sikaa, uz Čiovski most. Posada nosi plave majice.",
      descriptionEn:
        "Motor boat 'Solo' — 20m white wooden boat with brown details and red sun roof. Right across from Hotel Vila Sikaa, by Čiovo bridge. Crew wearing blue shirts.",
      lat: 43.5169,
      lng: 16.2511,
    },
    importantInfo: [
      "Brod je opremljen sunčalištem, sanitarijama i ozvučenjem",
      "Posada govori engleski",
    ],
    importantInfoEn: [
      "Boat equipped with sun deck, toilets and sound system",
      "English-speaking crew",
    ],
    getYourGuideUrl:
      "https://www.getyourguide.com/trogir-l1300/trogir-plava-laguna-i-solta-s-ruckom-i-picem-u-restoranu-t647545/",
  },
];

export const boats: Boat[] = [
  {
    id: "tamaris",
    name: "M/Y Tamaris",
    length: "27m",
    description:
      "27-metarska motorna jahta s 3 palube, 2 klimatizirana salona, potpuno opremljenim barom i sunčanom terasom. Opremljena s 4 toaleta, tuševima, prostranom platformom za kupanje i profesionalnim Wi-Fi sustavom.",
    descriptionEn:
      "27-meter motor yacht with 3 decks, 2 air-conditioned salons, a fully equipped bar and sun terrace. Equipped with 4 toilets, showers, spacious swimming platform and professional Wi-Fi system.",
    image: "/images/boats/tamaris-aerial-cruise.jpg",
    specs: [
      { label: "Duljina", labelEn: "Length", value: "27 m" },
      { label: "Palube", labelEn: "Decks", value: "3" },
      { label: "Kapacitet", labelEn: "Capacity", value: "150" },
      { label: "Toaleti", labelEn: "Toilets", value: "4" },
      { label: "Klima", labelEn: "A/C", value: "2 salona" },
      { label: "Wi-Fi", labelEn: "Wi-Fi", value: "Da / Yes" },
    ],
  },
  {
    id: "lovor",
    name: "M/Y Lovor",
    length: "27m",
    description:
      "27-metarska motorna jahta, sestra brodu Tamaris. S 3 palube, klimatiziranim salonima, barom i prostranim sunčalištem. Opremljena profesionalnim ozvučenjem i live DJ-em za sunset i večernja krstarenja.",
    descriptionEn:
      "27-meter motor yacht, sister ship to Tamaris. With 3 decks, air-conditioned salons, bar and spacious sun terrace. Equipped with professional sound system and live DJ for sunset and evening cruises.",
    image: "/images/boats/lovor-aerial-cruise.jpg",
    specs: [
      { label: "Duljina", labelEn: "Length", value: "27 m" },
      { label: "Palube", labelEn: "Decks", value: "3" },
      { label: "Kapacitet", labelEn: "Capacity", value: "150" },
      { label: "DJ & Sound", labelEn: "DJ & Sound", value: "Da / Yes" },
      { label: "Klima", labelEn: "A/C", value: "2 salona" },
      { label: "Wi-Fi", labelEn: "Wi-Fi", value: "Da / Yes" },
    ],
  },
  {
    id: "solo",
    name: "M/B Solo",
    length: "20m",
    description:
      "20-metarski drveni motorni brod sa sunčalištem, ozvučenjem i platformom za kupanje. Udoban i opremljen za grupne izlete.",
    descriptionEn:
      "20-meter wooden motor boat with sun deck, sound system and swimming platform. Comfortable and equipped for group tours.",
    image: "/images/tours/beach-aerial.jpg",
    specs: [
      { label: "Duljina", labelEn: "Length", value: "20 m" },
      { label: "Tip", labelEn: "Type", value: "Drveni / Wooden" },
      { label: "Sunčalište", labelEn: "Sun Deck", value: "Da / Yes" },
      { label: "Ozvučenje", labelEn: "Sound System", value: "Da / Yes" },
      { label: "Wi-Fi", labelEn: "Wi-Fi", value: "Da / Yes" },
    ],
  },
];

export function getTourBySlug(slug: string): Tour | undefined {
  return tours.find((t) => t.slug === slug);
}
