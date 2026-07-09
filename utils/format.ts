export function formatDistance(miles: number) {
  return `${miles.toFixed(1)} mi`;
}

export function formatRating(rating: string | number) {
  return String(rating);
}
