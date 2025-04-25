// export interface Listing {
//   id: string;
//   host: {
//     id: string;
//     firstName: string;
//     lastName: string;
//     profilePictureUrl: string;
//     bio: string;
//     isHost: boolean;
//     isVerified: boolean;
//   };
//   title: string;
//   description: string;
//   propertyTypeId: number;
//   roomTypeId: number;
//   capacity: number;
//   bedrooms: number;
//   bathrooms: number;
//   pricePerNight: number;
//   serviceFee: number;
//   addressLine1: string;
//   addressLine2: string;
//   city: string;
//   state: string;
//   country: string;
//   postalCode: string;
//   latitude: number;
//   longitude: number;
//   instantBooking: boolean;
//   createdAt: string;
//   updatedAt: string;
//   minNights: number;
//   maxNights: number;
//   cancellationPolicyId: number;
//   averageRating: number;
//   reviewCount: number;
//   isActive: boolean;
//   currencyId: number;
//   imageUrls: string[];
//   previewImageUrl: string;
//   amenities: {
//     id: string;
//     name: string;
//     categoryId: string;
//     icon: string;
//     createdAt: string;
//   }[];
//   reviews: {
//     id: string;
//     bookingId: string;
//     reviewer: {
//       id: string;
//       firstName: string;
//       lastName: string;
//       profilePictureUrl: string;
//       bio: string;
//       isHost: boolean;
//       isVerified: boolean;
//     };
//     hostId: string;
//     listingId: string;
//     comment: string;
//     hostReply: string;
//     hostReplyDate: string;
//     createdAt: string;
//     updatedAt: string;
//     rating: number;
//     cleanlinessRating: number;
//     accuracyRating: number;
//     communicationRating: number;
//     locationRating: number;
//     checkInRating: number;
//     valueRating: number;
//   }[];

// }


export interface Host {
  id: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string;
  bio: string;
  isHost: boolean;
  isVerified: boolean;
}

export interface CancellationPolicy {
  id: number;
  name: string;
  description: string;
  fullRefundDays: number | null;
  partialRefundDays: number | null;
  partialRefundPercentage: number | null;
}

export interface Listing {
  id: string;
  host: Host;
  title: string;
  description: string;
  propertyTypeId: string;
  roomTypeId: number;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  pricePerNight: number;
  serviceFee: number;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  instantBooking: boolean;
  createdAt: string; // You can use `Date` if you're parsing it
  updatedAt: string;
  minNights: number;
  maxNights: number;
  cancellationPolicy: CancellationPolicy;
  averageRating: number;
  reviewCount: number;
  isActive: boolean;
  currencyId: number;
  verificationStatusId: number;
  imageUrls: string[];
  previewImageUrl: string;
  amenities: any[]; // You can replace `any` with a specific `Amenity` type if available
  reviews: any[];   // Same here for `Review`
}
