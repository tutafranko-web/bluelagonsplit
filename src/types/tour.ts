export interface TourStop {
  name: string;
  nameEn: string;
  duration: string;
  activities: string[];
  activitiesEn: string[];
}

export interface TourInclusion {
  icon: string;
  text: string;
  textEn: string;
}

export interface MeetingPoint {
  description: string;
  descriptionEn: string;
  lat: number;
  lng: number;
}

export interface Tour {
  id: string;
  slug: string;
  boatName: string;
  boatLength: string;
  departureCity: string;
  departureCityEn: string;
  duration: number;
  priceFrom: number;
  priceTo?: number;
  rating: number;
  reviewCount: number;
  heroImage: string;
  images: string[];
  stops: TourStop[];
  inclusions: TourInclusion[];
  meetingPoint: MeetingPoint;
  importantInfo: string[];
  importantInfoEn: string[];
  getYourGuideUrl: string;
}

export interface Boat {
  id: string;
  name: string;
  length: string;
  description: string;
  descriptionEn: string;
  image: string;
  specs: { label: string; labelEn: string; value: string }[];
}
