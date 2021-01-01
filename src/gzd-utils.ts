import { FeatureCollection, Feature } from 'geojson';

const latitudeBands = 'CDEFGHJKLMNPQRSTUVWX';

export const getAllGZD = (): FeatureCollection => {
  const features: Feature[] = [];

  for (let longitudeBand = 1; longitudeBand <= 60; longitudeBand++) {
    for (let i = 0; i < latitudeBands.length; i++) {
      const latitudeBand = latitudeBands[i];
      /*
       * Special case around Svalbard:
       * - 32X, 34X, 36X removed
       */
      if (longitudeBand === 32 && latitudeBand === 'X') {
        continue;
      } else if (longitudeBand === 34 && latitudeBand === 'X') {
        continue;
      } else if (longitudeBand === 36 && latitudeBand === 'X') {
        continue;
      }
      features.push(getFeature(longitudeBand, latitudeBand));
    }
  }

  /*
   * Polar regions
   */
  features.push(getPolarRegionFeature('A'));
  features.push(getPolarRegionFeature('B'));
  features.push(getPolarRegionFeature('X'));
  features.push(getPolarRegionFeature('Y'));

  return {
    type: 'FeatureCollection',
    features,
  };
};

/**
 * Get a GZD as GeoJson Feature
 * @param longitudeBand Longitude band, range 1-60 or NaN for polar region
 * @param latitudeBand Latitude band
 */
export function getGZD(longitudeBand: number, latitudeBand: string): Feature;
/**
 * Get a GZD as GeoJson Feature
 * @param name Name of GZD in format <longitudeBand><latitudeBand>, e.g. 33V
 */
export function getGZD(name: string): Feature;
export function getGZD(paramOne: string | number, paramTwo?: string): Feature {
  // Handle case when called only with string, parse it into latitudeBand/longitudeBand
  if (typeof paramOne === 'string') {
    const name: string = paramOne;
    const longitudeBand = parseInt(name, 10);
    const latitudeBand = name.replace(longitudeBand.toString(), '');
    return getFeature(longitudeBand, latitudeBand);
  } else {
    return getFeature(paramOne as number, paramTwo as string);
  }
}

function getFeature(longitudeBand: number, latitudeBand: string): Feature {
  // Handle special case around polar regions
  if (isNaN(longitudeBand)) {
    return getPolarRegionFeature(latitudeBand);
  }

  // Validate input
  validateGZD(longitudeBand, latitudeBand);

  const name = `${longitudeBand}${latitudeBand}`;
  /*
   * Longitude bands 1..60 6° each, covering -180W to 180E
   */
  let longitudeMin = -180 + (longitudeBand - 1) * 6;
  let longitudeMax = longitudeMin + 6;

  /*
   * Latitude bands C..X 8° each, covering 80°S to 84°N
   * Except band X covering 12°
   */
  const i = latitudeBands.indexOf(latitudeBand);
  const latitudeMin = -80 + i * 8;
  let latitudeMax: number;
  if (latitudeBand !== 'X') {
    latitudeMax = latitudeMin + 8;
  } else {
    latitudeMax = latitudeMin + 12;
  }

  /*
   * Special case around Norway:
   * Zone 32V is extended 3° west and 31V is shrunk 3°
   */
  if (longitudeBand === 31 && latitudeBand === 'V') {
    longitudeMax -= 3;
  } else if (longitudeBand === 32 && latitudeBand === 'V') {
    longitudeMin -= 3;
  }

  /*
   * Special case around Svalbard:
   * - 31X and 37X extended 3°
   * - 33X and 35X extended 6°
   */
  if (longitudeBand === 31 && latitudeBand === 'X') {
    longitudeMax += 3;
  } else if (longitudeBand === 33 && latitudeBand === 'X') {
    longitudeMin -= 3;
    longitudeMax += 3;
  } else if (longitudeBand === 35 && latitudeBand === 'X') {
    longitudeMin -= 3;
    longitudeMax += 3;
  } else if (longitudeBand === 37 && latitudeBand === 'X') {
    longitudeMin -= 3;
  }

  return toPolygonFeature(name, longitudeMin, longitudeMax, latitudeMin, latitudeMax);
}

function validateGZD(longitudeBand: number, latitudeBand: string) {
  if (longitudeBand < 1 || longitudeBand > 60) {
    throw new RangeError('longitudeBand must be between 1 and 60');
  }
  if (latitudeBand.length !== 1) {
    throw new RangeError('Invalid latitudeBand provided, should be one letter');
  }
  if (!latitudeBands.includes(latitudeBand)) {
    throw new RangeError(`Invalid latitudeBand provided, valid bands: ${latitudeBands}`);
  }
  // Handle invalid zones 32X, 34X, 36X around Svalbard
  if (latitudeBand === 'X' && (longitudeBand === 32 || longitudeBand === 34 || longitudeBand === 36)) {
    throw new RangeError('Invalid band');
  }
}

function getPolarRegionFeature(band: string): Feature {
  switch (band) {
    case 'A':
      return toPolygonFeature('A', -180, 0, -90, -80);
    case 'B':
      return toPolygonFeature('B', 0, 180, -90, -80);
    case 'X':
      return toPolygonFeature('X', -180, 0, 84, 90);
    case 'Y':
      return toPolygonFeature('Y', 0, 180, 84, 90);
    default:
      throw new RangeError('Invalid band');
  }
}

const toPolygonFeature = (
  name: string,
  longitudeMin: number,
  longitudeMax: number,
  latitudeMin: number,
  latitudeMax: number
): Feature => {
  return {
    type: 'Feature',
    properties: {
      name,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [longitudeMin, latitudeMin], // SW corner
          [longitudeMin, latitudeMax], // NW corner
          [longitudeMax, latitudeMax], // NE corner
          [longitudeMax, latitudeMin], // SE corner
          [longitudeMin, latitudeMin], // Back to SW to make valid GeoJson polygon
        ],
      ],
    },
  };
};
