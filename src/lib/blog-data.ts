export interface BlogPost {
  slug: string;
  titleHr: string;
  titleEn: string;
  excerptHr: string;
  excerptEn: string;
  image: string;
  date: string;
  readingTimeMin: number;
  category: "guide" | "news" | "tips";
  contentHr: string;
  contentEn: string;
  relatedSlugs: string[];
  seoKeywords: string[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "blue-lagoon-guide",
    titleHr: "Vodic kroz Plavu lagunu -- sve sto trebate znati",
    titleEn: "Blue Lagoon Guide -- Everything You Need to Know",
    excerptHr:
      "Plava laguna na otoku Drveniku Velikom jedna je od najljepsih uvala u Hrvatskoj. Saznajte sto vas ocekuje, kako doci i zasto je ovo must-visit destinacija.",
    excerptEn:
      "The Blue Lagoon on Drvenik Veli island is one of the most beautiful bays in Croatia. Find out what to expect, how to get there and why this is a must-visit destination.",
    image: "/images/tours/blue-lagoon-aerial.jpg",
    date: "2026-02-15",
    readingTimeMin: 7,
    category: "guide",
    contentHr: `## Sto je Plava laguna?

Plava laguna nalazi se na jugozapadnoj strani otoka Drvenika Velikog, otprilike sat vremena plovidbe iz Splita ili 50 minuta iz Trogira. Radi se o plitkozaljevnoj uvali izmedju Drvenika Velikog i malog otocica Krknjas Veli, gdje more poprima nevjerojatne nijanse tirkizne i smaragdne boje. Dno je pjescano s mjestimicnim travnatim livadama morske trave, sto stvara onaj jedinstveni kontrast boja koji Plavu lagunu cini jednom od najfotogenicnijih lokacija na cijelom Jadranu.

Za razliku od nekih turistickih "laguna" koje razocaravaju uzivo, Plava laguna zaista izgleda tocno onako kako ocekujete s fotografija -- kristalno cisto more u kojem vidite dno i na 5 metara dubine.

## Kako doci do Plave lagune?

Najjednostavniji nacin je organiziranim brodskim izletom iz Splita ili Trogira. Max Nautica organizira svakodnevne izlete tijekom sezone (svibanj -- listopad) s polascima iz oba grada. Izlet iz Splita traje 8 sati i ukljucuje tri postaje: plazu Borkko na Ciovu, Plavu lagunu i Maslinicu na Solti.

Ako zelite doci na vlastitu ruku, mozete uzeti trajekt iz Trogira do Drvenika Velikog (traje oko 50 minuta), a zatim pjesaciti ili uzeti taxi do same lagune. No, imajte na umu da na otoku nema mnogo usluga -- nema taxi sluzbe, a put do lagune je oko 3 km po suncu.

## Sto vas ocekuje na lokaciji?

Plava laguna nije divlja, neuredjenja uvala -- tu se nalazi restoran Skoy, smjesten pod stoljetnim borovima, koji nudi tradicionalni mediteranski rucak. Svjeza riba s rostilja, salate, domace vino i pogled na more. Na nasim izletima rucak je ukljucen u cijenu i posluzuje se u restoranu Skoy.

Osim restorana, u laguni ima i nekoliko manjih barova i pontona za suncanje. More je u pravilu mirno jer je uvala zasticena, sto je cini idealnom za obitelji s djecom.

## Savjeti za ronjenje s maskom

Plava laguna je odlicna za snorkeling, posebno uz rubove uvale gdje su kamene formacije. Mozete vidjeti razne vrste riba, morske zvijezde i, ako imate srece, poneku hobotnicu. Opremu za ronjenje mozete ponijeti svoju ili je posuditi na brodu -- na Max Nautica izletima oprema za ronjenje je ukljucena u cijenu.

Najbolji dio za ronjenje je uz sjevernu stranu lagune, blize otocicu Krknjas, gdje je dubina oko 2-4 metra i gdje je morsko dno najzanimljivije.

## Praktiene informacije

- **Sezona**: Izleti se odrzavaju od pocetka svibnja do kraja listopada
- **Cijena**: Od 65 EUR po osobi (ukljucuje rucak, pica, opremu za ronjenje)
- **Vrijeme provedeno u laguni**: Na nasim izletima oko 2 sata
- **Dubina mora**: 1-5 metara u samoj laguni
- **Temperatura mora**: 22-26 C ljeti
- **Savjet**: Dodjite ranije u sezoni (svibanj/lipanj) ili kasnije (rujan/listopad) za manje guzve`,
    contentEn: `## What Is the Blue Lagoon?

The Blue Lagoon is located on the southwestern side of Drvenik Veli island, approximately one hour by boat from Split or 50 minutes from Trogir. It is a shallow bay between Drvenik Veli and the small islet of Krknjas Veli, where the sea takes on incredible shades of turquoise and emerald. The bottom is sandy with occasional patches of seagrass meadows, creating that unique color contrast that makes the Blue Lagoon one of the most photogenic locations in the entire Adriatic.

Unlike some tourist "lagoons" that disappoint in person, the Blue Lagoon truly looks exactly as you would expect from photographs -- crystal-clear water where you can see the bottom even at 5 meters depth.

## How to Get to the Blue Lagoon?

The easiest way is by organized boat tour from Split or Trogir. Max Nautica runs daily tours during the season (May -- October) with departures from both cities. The tour from Split lasts 8 hours and includes three stops: Borkko Beach on Ciovo, the Blue Lagoon and Maslinica on Solta.

If you want to get there on your own, you can take a ferry from Trogir to Drvenik Veli (about 50 minutes), then walk or take a taxi to the lagoon itself. However, keep in mind that there are not many services on the island -- there is no taxi service, and the walk to the lagoon is about 3 km in the sun.

## What to Expect on Location?

The Blue Lagoon is not a wild, undeveloped cove -- Restaurant Skoy is located here, nestled under centuries-old pine trees, offering traditional Mediterranean lunch. Fresh grilled fish, salads, local wine and sea views. On our tours, lunch is included in the price and served at Restaurant Skoy.

Besides the restaurant, the lagoon has several smaller bars and pontoons for sunbathing. The sea is typically calm because the bay is sheltered, making it ideal for families with children.

## Snorkeling Tips

The Blue Lagoon is excellent for snorkeling, especially along the edges of the bay where there are rocky formations. You can spot various fish species, starfish and, if you are lucky, the occasional octopus. You can bring your own snorkeling gear or borrow it on the boat -- on Max Nautica tours, snorkeling equipment is included in the price.

The best snorkeling spot is along the northern side of the lagoon, closer to the Krknjas islet, where the depth is about 2-4 meters and the sea floor is most interesting.

## Practical Information

- **Season**: Tours run from early May to late October
- **Price**: From 65 EUR per person (includes lunch, drinks, snorkeling gear)
- **Time spent in the lagoon**: About 2 hours on our tours
- **Sea depth**: 1-5 meters in the lagoon itself
- **Water temperature**: 22-26 C in summer
- **Tip**: Come earlier in the season (May/June) or later (September/October) for fewer crowds`,
    relatedSlugs: ["maslinica-solta-hidden-gem", "top-5-islands-near-split"],
    seoKeywords: [
      "blue lagoon croatia",
      "blue lagoon split",
      "drvenik veli",
      "plava laguna",
      "blue lagoon boat tour",
      "snorkeling blue lagoon",
    ],
  },
  {
    slug: "what-to-bring-boat-tour",
    titleHr: "Sto ponijeti na brodski izlet -- ultimativna lista",
    titleEn: "What to Bring on a Boat Tour -- The Ultimate Checklist",
    excerptHr:
      "Priprema za savrseni dan na moru pocinje dobrom opremom. Evo sve sto trebate ponijeti na svoj brodski izlet iz Splita ili Trogira.",
    excerptEn:
      "Preparing for the perfect day at sea starts with good gear. Here's everything you need to bring on your boat tour from Split or Trogir.",
    image: "/images/boats/tamaris-sundeck-harbor.jpg",
    date: "2026-02-01",
    readingTimeMin: 5,
    category: "tips",
    contentHr: `## Zastita od sunca -- prioritet broj 1

Najveca greska koju turisti rade na brodskim izletima je podcjenjivanje mediteranskog sunca. Na moru nema sjene (osim na brodu), a refleksija vode pojacava UV zracenje. Obavezno ponesite:

- **Kremu za suncanje SPF 50+** -- nanijte je 30 minuta prije izleta i ponovo namazite svaka 2 sata. Vodootporne formule su obavezne jer cete se kupati.
- **Sesir ili kapu** -- sirokog oboda za zastitu lica i vrata
- **Kvalitetne suncane naocale** s UV zastitom -- na moru su nezamjenjive
- **Laku majicu s dugim rukavima** ili UV zastitnu majicu za plivanje

## Odijeca i obuca

Na brodski izlet odjenite se lagano i udobno. Kupacu kostimu obucite ispod odijece jer cete je sigurno trebati. Evo sto preporucujemo:

- **Kupaci kostim** (obucen ispod odijece)
- **Lagana ljetna odijeca** ili pokrivac za plazu
- **Rucnik** -- na Max Nautica izletima ne dajemo rucnike, pa ponesite svoj
- **Lagana jakna ili vjetrovka** -- na povratku uvece moze zapuhnuti
- **Vodene cipele ili sandale sa sigurnim remenom** -- klizavi podovi na brodu zahtijevaju obucu koja ne klizi. Izbjegavajte japanke jer lako spadaju.

## Tehnika i vrijednosti

- **Vodootporna torbica za mobitel** -- mozete ih kupiti u bilo kojem suvenirnici u Splitu za 5-10 EUR. Isplati se!
- **Kamera ili GoPro** -- Plava laguna i otoci su nevjerojatno fotogenicni
- **Powerbank** -- 8 sati na moru moze isprazniti bateriju. Na brodu postoji Wi-Fi, pa cete sigurno koristiti mobitel.
- **Mali ruksak** -- za osobne stvari, lako se nosi

## Zdravlje i udobnost

- **Tableta ili narukvica protiv morske bolesti** -- ako ste osjetljivi na njihanje, uzmite tabletu 30 minuta prije polaska. More u nasim vodama je uglavnom mirno ljeti, ali bolje sprijeciti nego lijeciti.
- **Boca vode** -- na nasim izletima su pica ukljucena (voda, vino, limunada), ali uvijek je dobro imati svoju bocu
- **Mala torbica s lijekovima** -- aspirin, tableta za alergiju, flasteri

## Sto NE trebate nositi

- Skupe naocale ili nakit -- riskirate gubitak u moru
- Puno gotovine -- na izletu je vecina stvari ukljucena, a za dodatna pica na brodu moze se platiti karticom
- Tesku opremu -- nema potrebe za ogromnim koferima, dovoljno je ono sto stane u mali ruksak`,
    contentEn: `## Sun Protection -- Priority Number 1

The biggest mistake tourists make on boat tours is underestimating the Mediterranean sun. There is no shade at sea (except on the boat), and water reflection intensifies UV radiation. Make sure to bring:

- **Sunscreen SPF 50+** -- apply 30 minutes before the trip and reapply every 2 hours. Waterproof formulas are a must since you will be swimming.
- **Hat or cap** -- wide-brimmed for face and neck protection
- **Quality sunglasses** with UV protection -- essential at sea
- **Light long-sleeve shirt** or UV protection swim shirt

## Clothing and Footwear

Dress light and comfortable for a boat tour. Wear your swimsuit under your clothes because you will definitely need it. Here is what we recommend:

- **Swimsuit** (worn under clothes)
- **Light summer clothing** or beach cover-up
- **Towel** -- Max Nautica tours do not provide towels, so bring your own
- **Light jacket or windbreaker** -- it can get breezy on the return trip in the evening
- **Water shoes or sandals with a secure strap** -- slippery boat decks require non-slip footwear. Avoid flip-flops as they easily fall off.

## Tech and Valuables

- **Waterproof phone pouch** -- you can buy them at any souvenir shop in Split for 5-10 EUR. Worth it!
- **Camera or GoPro** -- the Blue Lagoon and islands are incredibly photogenic
- **Power bank** -- 8 hours at sea can drain your battery. There is Wi-Fi on board, so you will likely use your phone.
- **Small backpack** -- for personal items, easy to carry

## Health and Comfort

- **Seasickness tablet or wristband** -- if you are sensitive to motion, take a tablet 30 minutes before departure. The sea in our waters is generally calm in summer, but better safe than sorry.
- **Water bottle** -- drinks are included on our tours (water, wine, lemonade), but it is always good to have your own bottle
- **Small medicine pouch** -- aspirin, allergy tablet, band-aids

## What NOT to Bring

- Expensive sunglasses or jewelry -- you risk losing them in the sea
- A lot of cash -- most things are included on the tour, and you can pay by card for extra drinks on board
- Heavy equipment -- no need for huge suitcases, everything you need fits in a small backpack`,
    relatedSlugs: ["blue-lagoon-guide", "season-2026-opening"],
    seoKeywords: [
      "boat tour packing list",
      "what to bring boat tour croatia",
      "brodski izlet oprema",
      "split boat tour tips",
      "boat tour checklist",
    ],
  },
  {
    slug: "maslinica-solta-hidden-gem",
    titleHr: "Maslinica na Solti -- skriveni dragulj Jadrana",
    titleEn: "Maslinica on Solta -- Hidden Gem of the Adriatic",
    excerptHr:
      "Malo ribarsko selo Maslinica na otoku Solti krije prekrasan dvorac iz 17. stoljeca, mirne plaze i autentican otocki nacin zivota.",
    excerptEn:
      "The small fishing village of Maslinica on Solta island hides a beautiful 17th-century castle, peaceful beaches and authentic island life.",
    image: "/images/boats/tamaris-group-photo.jpg",
    date: "2026-01-20",
    readingTimeMin: 6,
    category: "guide",
    contentHr: `## Kratka povijest Maslinice

Maslinica je malo selo na zapadnom vrhu otoka Solte, nastanjeno od antickih vremena. Ime je dobila po maslinama koje su stoljecima bile glavni izvor prihoda za lokalno stanovnistvo. Najveci biser sela je dvorac Martinis-Marchi, fortifikacija iz 18. stoljeca koju je sagradila splitska plemicka obitelj Marchi kao obranu od gusara.

Danas je dvorac pretvoren u luksuzni boutique hotel s restoranom, ali mozete ga slobodno razgledati izvana i setati njegovim vrtovima. Arhitektura savrseno spaja barokne elemente s mediteranskim stilom, a pogled s terase na otocic Stipansku i okolne otocice je nezaboravan.

## Plaze i kupanje

Maslinica ima nekoliko prekrasnih plazica u neposrednoj blizini sela:

- **Senjska** -- glavna plaza sela, mjesavina sljunka i kamena, s pogledom na zalazak sunca
- **Uvala Sesula** -- mirna uvala s borovom sumom do samog mora, idealna za obitelji
- **Uvala Tatinja** -- nesto udaljenija, ali jedna od najljepsih na cijeloj Solti. Kristalno cisto more i potpuni mir.

Na Max Nautica izletima iz Splita, Maslinica je treca postaja gdje provodite oko 1.5 sat. Dovoljno vremena za kupanje, kavu u luci ili kratku setnju do dvorca.

## Hrana i pice

Za tak malo selo, Maslinica iznenadujuce dobro hrani. Nekoliko konoba i restorana nudi svjezu ribu, dalmatinske specijalitete i domace vino. Posebno preporucujemo:

- **Konoba Martinis-Marchi** -- u samom dvorcu, fina kuhinja s lokalnim namirnicama
- **Restoran Pasarela** -- na samoj rivi, svjeza riba i domace tjestenine
- **Caffe bar Marinero** -- za kavu s pogledom na luku

Cijena kave u Maslinici je oko 2-3 EUR, a obrok za dvoje s vinom otprilike 50-70 EUR u konobama. Znacajno jeftinije od Hvara ili Braca.

## Kako doci u Maslinicu?

Najlaksi nacin je brodskim izletom iz Splita ili Trogira s Max Nauticom. Ako zelite doci sami, iz Splita ide katamaran do Rogaca (glavne luke na Solti), a odatle lokalni bus ili taxi do Maslinice (oko 15 minuta voznje).

Alternativno, mozete iznajmiti auto na Solti i istraziti cijeli otok -- osim Maslinice, vrijedi posjetiti i Gornje Selo, Necujam i Stomorsku.

## Zasto posjetiti Maslinicu?

Maslinica je savrsena alternativa pretrpanim turistickim mjestima poput Hvara ili Bola na Bracu. Ovdje nema ogromnih cruisera, guzvi ni turistickih zamki -- samo autentican dalmatinski ugodaj, lokalna hrana, cisto more i mir. Idealno za one koji zele dozivjeti pravu Dalmaciju.`,
    contentEn: `## A Brief History of Maslinica

Maslinica is a small village on the western tip of Solta island, inhabited since ancient times. Its name comes from olive trees (maslina in Croatian), which were the main source of income for the local population for centuries. The village's greatest treasure is the Martinis-Marchi castle, an 18th-century fortification built by the noble Marchi family from Split as a defense against pirates.

Today the castle has been converted into a luxury boutique hotel with a restaurant, but you can freely explore it from outside and walk through its gardens. The architecture perfectly blends baroque elements with Mediterranean style, and the view from the terrace over the Stipanska islet and surrounding islands is unforgettable.

## Beaches and Swimming

Maslinica has several beautiful small beaches in the immediate vicinity of the village:

- **Senjska** -- the main village beach, a mix of pebble and rock, with sunset views
- **Sesula Bay** -- a peaceful cove with pine forest reaching down to the sea, ideal for families
- **Tatinja Bay** -- a bit further away, but one of the most beautiful on all of Solta. Crystal-clear water and complete tranquility.

On Max Nautica tours from Split, Maslinica is the third stop where you spend about 1.5 hours. Enough time for swimming, coffee at the harbor or a short walk to the castle.

## Food and Drink

For such a small village, Maslinica has surprisingly good dining. Several taverns and restaurants offer fresh fish, Dalmatian specialties and local wine. We especially recommend:

- **Konoba Martinis-Marchi** -- inside the castle itself, fine dining with local ingredients
- **Restaurant Pasarela** -- right on the waterfront, fresh fish and homemade pasta
- **Cafe Bar Marinero** -- for coffee with a harbor view

A coffee in Maslinica costs about 2-3 EUR, and a meal for two with wine is approximately 50-70 EUR at the taverns. Significantly cheaper than Hvar or Brac.

## How to Get to Maslinica?

The easiest way is by boat tour from Split or Trogir with Max Nautica. If you want to go on your own, there is a catamaran from Split to Rogac (the main port on Solta), and from there a local bus or taxi to Maslinica (about a 15-minute drive).

Alternatively, you can rent a car on Solta and explore the entire island -- besides Maslinica, it is worth visiting Gornje Selo, Necujam and Stomorska.

## Why Visit Maslinica?

Maslinica is the perfect alternative to overcrowded tourist spots like Hvar or Bol on Brac. There are no massive cruise ships, crowds or tourist traps here -- just authentic Dalmatian atmosphere, local food, clean sea and peace. Ideal for those who want to experience the real Dalmatia.`,
    relatedSlugs: ["blue-lagoon-guide", "top-5-islands-near-split"],
    seoKeywords: [
      "maslinica solta",
      "solta island croatia",
      "maslinica beach",
      "martinis marchi castle",
      "solta boat tour",
      "hidden gems croatia",
    ],
  },
  {
    slug: "season-2026-opening",
    titleHr: "Sezona 2026 -- novi brod, nove rute, nova iskustva",
    titleEn: "Season 2026 -- New Boat, New Routes, New Experiences",
    excerptHr:
      "Nova sezona donosi uzbudljive novosti: novi brod Lovor sa DJ-em i ozvucenjem za sunset krstarenja, poboljsane rute i posebne ponude za rane rezervacije.",
    excerptEn:
      "The new season brings exciting news: new boat Lovor with DJ and sound system for sunset cruises, improved routes and special offers for early bookings.",
    image: "/images/boats/lovor-aerial-cruise.jpg",
    date: "2026-03-01",
    readingTimeMin: 3,
    category: "news",
    contentHr: `## Dobrodosli u sezonu 2026!

S velikim uzbudjenjem najavljujemo pocetak nove sezone Max Nautica brodskih izleta! Od 1. svibnja 2026. ponovno krece nasa svakodnevna plovidba iz Splita i Trogira do Plave lagune, otoka Solte i najljepsih skrivenih uvala srednjeg Jadrana.

Ove godine imamo posebno veliko iznenadjenje -- novi brod koji ce promijeniti nacin na koji dozivljavate more.

## Upoznajte M/Y Lovor

Lovor je sestra brodu Tamaris -- ista klasa, 27 metara duzine, 3 palube, kapaciteta 150 gostiju. Ali Lovor donosi nesto posebno: profesionalno ozvucenje i live DJ za sunset i vecernja krstarenja!

Zamislite: plovidba uz dalmatinsku obalu dok sunce zalazi, kokteli u ruci, DJ pusta chill house i balearic beats... To je iskustvo koje do sada niste mogli dozivjeti iz Splita, a sada je dostupno svakog vikenda od lipnja do rujna.

Lovor ce tijekom dana voziti klasicne izlete do Plave lagune (ista ruta kao Tamaris), a vikendom uvece pretvoriti se u plutajuci club za sunset partije.

## Poboljsane rute i iskustvo

Za sezonu 2026 smo fino podesili nase rute na temelju povratnih informacija gostiju iz prethodnih godina:

- **Duze vrijeme u Plavoj laguni** -- povecali smo vrijeme provedeno u laguni za 30 minuta
- **Vise opcija za rucak** -- uz ribu i piletinu, sada nudimo i potpuno veganski meni
- **Poboljsana oprema** -- nove maske za ronjenje, novi prsluci, bolji Wi-Fi sustav na svim brodovima

## Rane rezervacije -- ustedite do 15%

Rezervirajte svoj izlet do 30. travnja i ostvarite 15% popusta na redovnu cijenu. Rane rezervacije mozete napraviti direktno preko naseg partnera GetYourGuide ili nas kontaktirajte za grupne ponude.

Vidimo se na moru!`,
    contentEn: `## Welcome to Season 2026!

We are thrilled to announce the start of a new Max Nautica boat tour season! From May 1, 2026, our daily sailings from Split and Trogir to the Blue Lagoon, Solta island and the most beautiful hidden coves of the central Adriatic resume.

This year we have an especially big surprise -- a new boat that will change the way you experience the sea.

## Meet M/Y Lovor

Lovor is a sister ship to Tamaris -- same class, 27 meters long, 3 decks, capacity for 150 guests. But Lovor brings something special: a professional sound system and live DJ for sunset and evening cruises!

Imagine: sailing along the Dalmatian coast as the sun sets, cocktails in hand, DJ playing chill house and balearic beats... This is an experience you could not have from Split before, and now it is available every weekend from June to September.

During the day, Lovor will run the classic Blue Lagoon tours (same route as Tamaris), and on weekend evenings it transforms into a floating club for sunset parties.

## Improved Routes and Experience

For the 2026 season, we have fine-tuned our routes based on guest feedback from previous years:

- **More time at the Blue Lagoon** -- we increased the time spent in the lagoon by 30 minutes
- **More lunch options** -- in addition to fish and chicken, we now offer a fully vegan menu
- **Upgraded equipment** -- new snorkeling masks, new life vests, better Wi-Fi system on all boats

## Early Bookings -- Save Up to 15%

Book your tour by April 30 and get a 15% discount on the regular price. Early bookings can be made directly through our partner GetYourGuide or contact us for group offers.

See you at sea!`,
    relatedSlugs: ["meet-our-fleet", "what-to-bring-boat-tour"],
    seoKeywords: [
      "max nautica 2026",
      "split boat tour 2026",
      "sunset cruise split",
      "blue lagoon tour season",
      "croatia boat tour new season",
    ],
  },
  {
    slug: "meet-our-fleet",
    titleHr: "Upoznajte nasu flotu -- tri broda za savrseni dan",
    titleEn: "Meet Our Fleet -- Three Boats for the Perfect Day",
    excerptHr:
      "Od 27-metarske motorne jahte Tamaris do novog broda Lovor sa DJ-em -- upoznajte brodove koji ce vas provesti po najljepsim otocima srednje Dalmacije.",
    excerptEn:
      "From the 27-meter motor yacht Tamaris to the new boat Lovor with a DJ -- meet the boats that will take you to the most beautiful islands of central Dalmatia.",
    image: "/images/boats/tamaris-aerial-cruise.jpg",
    date: "2026-02-20",
    readingTimeMin: 5,
    category: "news",
    contentHr: `## M/Y Tamaris -- nasa zvijezda

Tamaris je 27-metarska motorna jahta i ponos nase flote. S tri palube, dva klimatizirana salona, potpuno opremljenim barom i prostranim sundekom, Tamaris pruza iskustvo koje nadmasuje vecinu brodova za grupne izlete na Jadranu.

Sto Tamaris cini posebnim:

- **3 palube** -- donja klimatizirana, glavna s barom, gornja suncaliste
- **Kapacitet 150 gostiju** -- dovoljno prostora da se nikad ne osjecate skuceno
- **4 toaleta i tusevi** -- komfor koji ne ocekujete na grupnom izletu
- **Profesionalni Wi-Fi** -- da, internet radi i nasred mora
- **Prostrana platforma za kupanje** -- lak ulaz i izlaz iz mora
- **Potpuno opremljen bar** -- kokteli, pivo, vino, bezalkoholna pica

Tamaris vozi svakodnevne izlete iz Splita na rutu: Borkko Beach (Ciovo) -- Plava laguna (Drvenik Veli) -- Maslinica (Solta). Polazak u 9:00, povratak oko 17:00.

## M/Y Lovor -- nova zvijezda za 2026.

Lovor je sestra brodu Tamaris -- iste dimenzije, isti komfor, ali s jednim velikim dodatkom: profesionalnim ozvucenjem i live DJ-em. Lovor je dizajniran za sunset i vecernja krstarenja koja kombiniraju ljepotu dalmatinske obale s party atmosferom.

Tijekom dana, Lovor vozi iste izlete kao Tamaris (idealno za dane kada je potraznja veca). Ali vikendom uvece, Lovor se pretvara u plutajuci club:

- **Sunset Cruise** -- petak i subota, 18:00-22:00
- **DJ** koji pusta chill house, deep house i balearic mixeve
- **Premium kokteli** -- mojito, aperol spritz, hugo i jos mnogo toga
- **Ruta**: polazak iz Splita, plovidba uz obalu do Braca i natrag

## M/B Solo -- drveni klasik iz Trogira

Solo je nas 20-metarski drveni motorni brod koji vozi izlete iz Trogira. Manji od Tamarisa, ali s posebnim sarmom koji samo drveni brodovi mogu pruziti.

Solo nudi:

- **Suncoliste** na krmenom dijelu
- **Ozvucenje** za ugodnu atmosferu
- **Platforma za kupanje**
- **Wi-Fi** na brodu

Solo vozi izlete iz Trogira na rutu: Plava laguna (Drvenik Veli) -- Maslinica (Solta). Polazak u 9:00, povratak oko 17:00. Rucak je ukljucen i posluzuje se u restoranu Skoy u Plavoj laguni.

## Koji brod odabrati?

- **Tamaris iz Splita** -- za one koji zele premium iskustvo s tri postaje i svim udobnostima
- **Lovor iz Splita** -- isti dnevni izlet kao Tamaris + opcija sunset krstarenja vikendom
- **Solo iz Trogira** -- za one koji polaze iz Trogira ili preferiraju manji, intimniji brod`,
    contentEn: `## M/Y Tamaris -- Our Star

Tamaris is a 27-meter motor yacht and the pride of our fleet. With three decks, two air-conditioned salons, a fully equipped bar and a spacious sun deck, Tamaris provides an experience that surpasses most group tour boats in the Adriatic.

What makes Tamaris special:

- **3 decks** -- lower air-conditioned, main with bar, upper sun deck
- **Capacity for 150 guests** -- enough space that you never feel cramped
- **4 toilets and showers** -- comfort you do not expect on a group tour
- **Professional Wi-Fi** -- yes, internet works even in the middle of the sea
- **Spacious swimming platform** -- easy entry and exit from the water
- **Fully equipped bar** -- cocktails, beer, wine, soft drinks

Tamaris runs daily tours from Split on the route: Borkko Beach (Ciovo) -- Blue Lagoon (Drvenik Veli) -- Maslinica (Solta). Departure at 9:00, return around 17:00.

## M/Y Lovor -- New Star for 2026

Lovor is a sister ship to Tamaris -- same dimensions, same comfort, but with one big addition: a professional sound system and live DJ. Lovor is designed for sunset and evening cruises that combine the beauty of the Dalmatian coast with a party atmosphere.

During the day, Lovor runs the same tours as Tamaris (ideal for days when demand is higher). But on weekend evenings, Lovor transforms into a floating club:

- **Sunset Cruise** -- Friday and Saturday, 18:00-22:00
- **DJ** playing chill house, deep house and balearic mixes
- **Premium cocktails** -- mojito, aperol spritz, hugo and much more
- **Route**: departure from Split, sailing along the coast to Brac and back

## M/B Solo -- Wooden Classic from Trogir

Solo is our 20-meter wooden motor boat running tours from Trogir. Smaller than Tamaris, but with a special charm that only wooden boats can provide.

Solo offers:

- **Sun deck** at the stern
- **Sound system** for a pleasant atmosphere
- **Swimming platform**
- **Wi-Fi** on board

Solo runs tours from Trogir on the route: Blue Lagoon (Drvenik Veli) -- Maslinica (Solta). Departure at 9:00, return around 17:00. Lunch is included and served at Restaurant Skoy in the Blue Lagoon.

## Which Boat to Choose?

- **Tamaris from Split** -- for those who want a premium experience with three stops and all amenities
- **Lovor from Split** -- same day tour as Tamaris + weekend sunset cruise option
- **Solo from Trogir** -- for those departing from Trogir or preferring a smaller, more intimate boat`,
    relatedSlugs: ["season-2026-opening", "blue-lagoon-guide"],
    seoKeywords: [
      "max nautica boats",
      "tamaris yacht split",
      "boat tour split fleet",
      "lovor sunset cruise",
      "solo trogir boat",
      "croatia boat tour",
    ],
  },
  {
    slug: "top-5-islands-near-split",
    titleHr: "Top 5 otoka blizu Splita koje morate posjetiti",
    titleEn: "Top 5 Islands Near Split You Must Visit",
    excerptHr:
      "Od tirkizne Plave lagune do skrivene Maslinice -- otkrijte pet otoka u blizini Splita koji zasluzuju mjesto na vasem popisu.",
    excerptEn:
      "From the turquoise Blue Lagoon to hidden Maslinica -- discover five islands near Split that deserve a spot on your bucket list.",
    image: "/images/tours/beach-aerial.jpg",
    date: "2026-01-10",
    readingTimeMin: 6,
    category: "guide",
    contentHr: `## 1. Drvenik Veli -- dom Plave lagune

Drvenik Veli je mali otok zapadno od Splita, a njegova najveca atrakcija je legendarna Plava laguna -- plitka uvala s tirkiznim morem koje izgleda kao da pripada Karibima, a ne Jadranu. Laguna se nalazi izmedju Drvenika Velikog i otocica Krknjas Veli, a dubina mora je samo 1-5 metara, sto je cini idealnom za plivanje i ronjenje s maskom.

Na samoj lokaciji nalazi se restoran Skoy, gdje mozete rucati svjezu ribu pod borovima s pogledom na more. Max Nautica brodovi posjcuju Plavu lagunu svakodnevno tijekom sezone -- to je glavna postaja i na izletu iz Splita i iz Trogira.

**Udaljenost od Splita**: 1 sat brodom
**Najbolje za**: Plivanje, ronjenje s maskom, fotografije, rucak na plazi

## 2. Solta -- Maslinica i skrivene uvale

Solta je otok koji vecina turista preskace na putu prema Hvaru ili Bracu, a to je ogromna greska. Zapadni dio otoka krije selo Maslinicu s dvorcem Martinis-Marchi iz 18. stoljeca, prekrasnim plazama i autenticnom dalmatinskom atmosferom bez guzvi.

Osim Maslinice, Solta nudi i Stomorsku (ribarsko selo s dobrim restoranima), Necujam (mirne uvale za kupanje) i odlicno domace maslinovo ulje i med.

Max Nautica izleti iz Splita zaustavljaju se u Maslinici na 1.5 sat -- dovoljno za kupanje, kavu i setnju.

**Udaljenost od Splita**: 45 minuta katamaranom do Rogaca
**Najbolje za**: Autentican otok bez guzvi, dvorac, lokalna hrana

## 3. Ciovo -- plaza Borkko i vise

Ciovo je otok spojen mostom s Trogirom, ali njegova juzna strana krije neke od najljepsih plaza u regiji. Plaza Borkko (ili Borko) je postala popularna zahvaljujuci svom beach baru, ljulaskama nad morem i kristalno cistom vodi.

Na Max Nautica izletu iz Splita, plaza Borkko je prva postaja gdje provodite oko sat vremena. Mozete se kupati, roniti s maskom ili jednostavno uzivati u beach bar atmosferi.

Osim Borkka, na Ciovu vrijedi posjetiti i plaze Okrug Gornji i Mavarstica.

**Udaljenost od Splita**: 30 minuta brodom
**Najbolje za**: Beach bar atmosfera, plivanje, pristupacnost

## 4. Brac -- Zlatni Rat i vise od toga

Brac je treci najveci hrvatski otok i mozda najpoznatiji zahvaljujuci plazi Zlatni Rat kod Bola -- ikonicni bijeli sljuncani rt koji mijenja oblik ovisno o vjetru i morskim strujama. Ali Brac je puno vise od jedne plaze.

Vidice i Bol nude super plaze, Supetar ima sarm malog mediteranskog gradica, a Pucisca je poznata po bijelom kamenu od kojeg je izgradjena cak i Bijela kuca u Washingtonu.

**Udaljenost od Splita**: 50 minuta trajektom do Supetra
**Najbolje za**: Zlatni Rat, kameni tradicijski gradici, lokalna kuhinja

## 5. Hvar -- glamur i lavanda

Hvar je vjerojatno najpoznatiji hrvatski otok u svijetu -- poznat po nocnom zivotu, lavandinim poljima, povijesnoj tvrdavi i prekrasnom Starom gradu. Ako trazite kombinaciju kulture, zabave i prirode, Hvar je pravi izbor.

No, treba napomenuti da je Hvar znatno skuplji od ostalih otoka na ovom popisu i da moze biti izuzetno guzva u srpnju i kolovozu. Za mirnije iskustvo, posjetite ga u lipnju ili rujnu.

**Udaljenost od Splita**: 1 sat katamaranom
**Najbolje za**: Nocni zivot, lavanda, povijest, glamur

## Koje otoke posjcuje Max Nautica?

Nasi svakodnevni izleti iz Splita posjcuju prva tri otoka na ovom popisu: Ciovo (plaza Borkko), Drvenik Veli (Plava laguna) i Soltu (Maslinica) -- sve u jednom danu za 65-75 EUR po osobi, s ruckom i picima uklucenim. Iz Trogira posjcujemo Drvenik Veli i Soltu.`,
    contentEn: `## 1. Drvenik Veli -- Home of the Blue Lagoon

Drvenik Veli is a small island west of Split, and its biggest attraction is the legendary Blue Lagoon -- a shallow bay with turquoise water that looks like it belongs in the Caribbean, not the Adriatic. The lagoon sits between Drvenik Veli and the small islet of Krknjas Veli, and the sea depth is only 1-5 meters, making it ideal for swimming and snorkeling.

Right on location you will find Restaurant Skoy, where you can have fresh fish for lunch under pine trees with a sea view. Max Nautica boats visit the Blue Lagoon daily during the season -- it is the main stop on both the Split and Trogir tours.

**Distance from Split**: 1 hour by boat
**Best for**: Swimming, snorkeling, photos, beach lunch

## 2. Solta -- Maslinica and Hidden Coves

Solta is an island that most tourists skip on their way to Hvar or Brac, and that is a huge mistake. The western part of the island hides the village of Maslinica with the 18th-century Martinis-Marchi castle, beautiful beaches and authentic Dalmatian atmosphere without the crowds.

Besides Maslinica, Solta offers Stomorska (a fishing village with good restaurants), Necujam (peaceful swimming coves) and excellent local olive oil and honey.

Max Nautica tours from Split stop in Maslinica for 1.5 hours -- enough for swimming, coffee and a walk.

**Distance from Split**: 45 minutes by catamaran to Rogac
**Best for**: Authentic island without crowds, castle, local food

## 3. Ciovo -- Borkko Beach and More

Ciovo is an island connected by bridge to Trogir, but its southern side hides some of the most beautiful beaches in the region. Borkko Beach (or Borko) has become popular thanks to its beach bar, swings over the sea and crystal-clear water.

On the Max Nautica tour from Split, Borkko Beach is the first stop where you spend about one hour. You can swim, snorkel or simply enjoy the beach bar atmosphere.

Besides Borkko, Ciovo is also worth visiting for Okrug Gornji and Mavarstica beaches.

**Distance from Split**: 30 minutes by boat
**Best for**: Beach bar atmosphere, swimming, accessibility

## 4. Brac -- Zlatni Rat and Beyond

Brac is the third largest Croatian island and perhaps the most famous thanks to Zlatni Rat beach near Bol -- the iconic white pebble cape that changes shape depending on wind and sea currents. But Brac is much more than one beach.

Vidice and Bol offer great beaches, Supetar has the charm of a small Mediterranean town, and Pucisca is famous for its white stone from which even the White House in Washington was built.

**Distance from Split**: 50 minutes by ferry to Supetar
**Best for**: Zlatni Rat, traditional stone towns, local cuisine

## 5. Hvar -- Glamour and Lavender

Hvar is probably the most famous Croatian island in the world -- known for its nightlife, lavender fields, historic fortress and beautiful Old Town. If you are looking for a combination of culture, entertainment and nature, Hvar is the right choice.

However, it should be noted that Hvar is significantly more expensive than the other islands on this list and can be extremely crowded in July and August. For a calmer experience, visit in June or September.

**Distance from Split**: 1 hour by catamaran
**Best for**: Nightlife, lavender, history, glamour

## Which Islands Does Max Nautica Visit?

Our daily tours from Split visit the first three islands on this list: Ciovo (Borkko Beach), Drvenik Veli (Blue Lagoon) and Solta (Maslinica) -- all in one day for 65-75 EUR per person, with lunch and drinks included. From Trogir, we visit Drvenik Veli and Solta.`,
    relatedSlugs: ["blue-lagoon-guide", "maslinica-solta-hidden-gem"],
    seoKeywords: [
      "islands near split",
      "best islands split croatia",
      "drvenik veli",
      "solta island",
      "ciovo beaches",
      "brac hvar split",
      "croatian islands day trip",
    ],
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getRelatedPosts(
  currentSlug: string,
  limit: number = 3
): BlogPost[] {
  const current = getBlogPostBySlug(currentSlug);
  if (!current) return [];

  const related = current.relatedSlugs
    .map((slug) => getBlogPostBySlug(slug))
    .filter((post): post is BlogPost => post !== undefined);

  // If we don't have enough related posts, fill with other posts
  if (related.length < limit) {
    const remaining = blogPosts
      .filter(
        (post) =>
          post.slug !== currentSlug &&
          !current.relatedSlugs.includes(post.slug)
      )
      .slice(0, limit - related.length);
    return [...related, ...remaining].slice(0, limit);
  }

  return related.slice(0, limit);
}
