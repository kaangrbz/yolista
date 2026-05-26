export const iconForGeocodingType = (type: string): string => {
  if (/(city|town|village|hamlet|municipality)/i.test(type)) {
    return 'city';
  }

  if (/(museum|castle|monument|memorial|ruins|archaeolog|historic)/i.test(type)) {
    return 'castle';
  }

  if (/(park|forest|nature|peak|mountain)/i.test(type)) {
    return 'tree';
  }

  if (/(restaurant|cafe|bar|food)/i.test(type)) {
    return 'silverware-fork-knife';
  }

  if (/(hotel|hostel|guest_house)/i.test(type)) {
    return 'bed';
  }

  return 'map-marker-outline';
};
