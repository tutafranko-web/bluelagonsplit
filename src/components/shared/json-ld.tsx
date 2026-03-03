export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: "Max Nautica",
    description:
      "Boat tours from Split and Trogir to Blue Lagoon, Šolta and hidden coves of the Adriatic. Over 10 years of experience with 3 premium boats.",
    url: "https://maxnautica.hr",
    telephone: "+385911111154",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Split",
      addressRegion: "Splitsko-dalmatinska županija",
      addressCountry: "HR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 43.5074,
      longitude: 16.4406,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.5",
      reviewCount: "1125",
      bestRating: "5",
    },
    sameAs: [
      "https://www.facebook.com/maxnautica",
      "https://www.instagram.com/blue_lagoon_croatia",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function TourJsonLd({
  name,
  description,
  price,
  image,
  url,
}: {
  name: string;
  description: string;
  price: number;
  image: string;
  url: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name,
    description,
    image,
    url,
    offers: {
      "@type": "Offer",
      price: price.toString(),
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
    provider: {
      "@type": "Organization",
      name: "Max Nautica",
      url: "https://maxnautica.hr",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function BlogPostJsonLd({
  title,
  description,
  image,
  date,
  url,
}: {
  title: string;
  description: string;
  image: string;
  date: string;
  url: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    image,
    datePublished: date,
    author: {
      "@type": "Organization",
      name: "Max Nautica",
    },
    publisher: {
      "@type": "Organization",
      name: "Max Nautica",
      url: "https://maxnautica.hr",
    },
    url,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
