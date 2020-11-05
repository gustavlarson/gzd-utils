import { FeatureCollection, Feature } from 'geojson';

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

/*
 * Latitude bands C..X 8° each, covering 80°S to 84°N
 * Except band X covering 12°
 */
const latitudeBands = 'CDEFGJKJLMNPQRSTUVWX';

/*
 * From https://en.wikipedia.org/wiki/Universal_Transverse_Mercator_coordinate_system
 */
export const getAllGZD = (): FeatureCollection => {
  const features: Feature[] = [];

  /*
   * Longitude bands 1..60 6° each, covering -180W to 180E
   */
  for (let longitudeBand = 1; longitudeBand <= 60; longitudeBand++) {
    for (let i = 0; i < latitudeBands.length; i++) {
      let longitudeMin = -180 + (longitudeBand - 1) * 6;
      let longitudeMax = longitudeMin + 6;
      const latitudeBand = latitudeBands[i];
      const latitudeMin = -80 + i * 8;
      let latitudeMax = latitudeMin + 8;
      /*
       * Special case: latitude band X is extended 4° north
       */
      if (latitudeBand === 'X') {
        latitudeMax += 4;
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
       * - 32X, 34X, 36X removed
       */
      if (longitudeBand === 31 && latitudeBand === 'X') {
        longitudeMax += 3;
      } else if (longitudeBand === 32 && latitudeBand === 'X') {
        continue;
      } else if (longitudeBand === 33 && latitudeBand === 'X') {
        longitudeMin -= 3;
        longitudeMax += 3;
      } else if (longitudeBand === 34 && latitudeBand === 'X') {
        continue;
      } else if (longitudeBand === 35 && latitudeBand === 'X') {
        longitudeMin -= 3;
        longitudeMax += 3;
      } else if (longitudeBand === 36 && latitudeBand === 'X') {
        continue;
      } else if (longitudeBand === 37 && latitudeBand === 'X') {
        longitudeMin -= 3;
      }
      const name = `${longitudeBand}${latitudeBand}`;
      features.push(
        toPolygonFeature(
          name,
          longitudeMin,
          longitudeMax,
          latitudeMin,
          latitudeMax
        )
      );
    }
  }
  /*
   * Polar regions
   */
  features.push(toPolygonFeature('A', -180, 0, -80, -90));
  features.push(toPolygonFeature('B', 180, 0, -80, -90));
  features.push(toPolygonFeature('X', -180, 0, 84, 90));
  features.push(toPolygonFeature('Y', 180, 0, 84, 90));

  return {
    type: 'FeatureCollection',
    features,
  };
};
