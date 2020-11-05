import { getGZD, getAllGZD } from '../src/gzd-utils';
import { Feature, Polygon, Position } from 'geojson';

function validateCoordinates(
  coordinates: Position[],
  longitudeMin: number,
  longitudeMax: number,
  latitudeMin: number,
  latitudeMax: number
): void {
  expect(coordinates[0]).toEqual([longitudeMin, latitudeMin]);
  expect(coordinates[1]).toEqual([longitudeMin, latitudeMax]);
  expect(coordinates[2]).toEqual([longitudeMax, latitudeMax]);
  expect(coordinates[3]).toEqual([longitudeMax, latitudeMin]);
  expect(coordinates[4]).toEqual(coordinates[0]); //Valid GeoJSON polygon should be a LinearRing
}

function validateDataTypesAndName(zone: Feature, name: string): Position[] {
  expect(zone.properties).toEqual(expect.objectContaining({ name: name }));
  expect(zone.geometry.type).toEqual('Polygon');
  const polygon = zone.geometry as Polygon;
  expect(polygon.coordinates.length).toEqual(1);
  const coordinates = polygon.coordinates[0];
  expect(coordinates.length).toEqual(5);
  return coordinates;
}
test('GZD count', () => {
  const gzdZones = getAllGZD();
  // 60 longitude bands, 20 latitude bands
  // Four polar regions, three non-existing around Svalbard
  const expectedZoneCount = 60 * 20 + 4 - 3;
  expect(gzdZones.features.length).toBe(expectedZoneCount);
});

test('Correct datatypes and sanity check', () => {
  const gzdZones = getAllGZD();
  expect(gzdZones.type).toBe('FeatureCollection');

  gzdZones.features.forEach((feature) => {
    expect(feature.type).toBe('Feature');
    expect(feature.properties).toHaveProperty('name');
    expect(feature.geometry.type).toBe('Polygon');
    const polygon = feature.geometry as Polygon;
    expect(polygon.coordinates.length).toBe(1);
    expect(polygon.coordinates[0].length).toBe(5);
    expect(polygon.coordinates[0][0]).toStrictEqual(polygon.coordinates[0][4]);

    polygon.coordinates[0].forEach((coordinate) => {
      expect(coordinate.length).toBe(2);
      expect(coordinate[0]).toBeGreaterThanOrEqual(-180);
      expect(coordinate[0]).toBeLessThanOrEqual(180);
      expect(coordinate[1]).toBeGreaterThanOrEqual(-90);
      expect(coordinate[1]).toBeLessThanOrEqual(90);
    });
  });
});

test('Expected zones', () => {
  const gzdZones = getAllGZD();
  expect(gzdZones.features).toEqual(
    expect.arrayContaining([
      //Expected zones
      expect.objectContaining({ properties: { name: '1C' } }),
      expect.objectContaining({ properties: { name: '1X' } }),
      expect.objectContaining({ properties: { name: '33V' } }),
      expect.objectContaining({ properties: { name: '60C' } }),
      expect.objectContaining({ properties: { name: '60X' } }),
      expect.objectContaining({ properties: { name: 'B' } }),

      //Invalid zones
      expect.not.objectContaining({ properties: { name: '0C' } }),
      expect.not.objectContaining({ properties: { name: '1B' } }),
      expect.not.objectContaining({ properties: { name: '30Z' } }),
      expect.not.objectContaining({ properties: { name: '61F' } }),
      expect.not.objectContaining({ properties: { name: '32X' } }),
      expect.not.objectContaining({ properties: { name: '34X' } }),
      expect.not.objectContaining({ properties: { name: '36X' } }),
    ])
  );
});

test('Special cases', () => {
  const gzdZones = getAllGZD();
  expect(gzdZones.features).toEqual(
    expect.arrayContaining([
      //Special case around Norway
      expect.objectContaining({ properties: { name: '31V' } }),
      expect.objectContaining({ properties: { name: '32V' } }),
      //Extra large zones around Svalbard
      expect.objectContaining({ properties: { name: '31X' } }),
      expect.objectContaining({ properties: { name: '33X' } }),
      expect.objectContaining({ properties: { name: '35X' } }),
      expect.objectContaining({ properties: { name: '37X' } }),
      //Zones not existing around Svalbard
      expect.not.objectContaining({ properties: { name: '32X' } }),
      expect.not.objectContaining({ properties: { name: '34X' } }),
      expect.not.objectContaining({ properties: { name: '36X' } }),
    ])
  );
});

test('Get info on 33V and validate', () => {
  const zone = getGZD('33V');
  const coordinates = validateDataTypesAndName(zone, '33V');
  validateCoordinates(coordinates, 12, 18, 56, 64);
});

test('Get info on 5D and validate', () => {
  const zone = getGZD(5, 'D');
  const coordinates = validateDataTypesAndName(zone, '5D');
  validateCoordinates(coordinates, -156, -150, -72, -64);
});

test('Get info on 60X and validate', () => {
  /*
   * Special case: latitude band X is extended 4° north
   */
  const zone = getGZD('60X');
  const coordinates = validateDataTypesAndName(zone, '60X');
  validateCoordinates(coordinates, 174, 180, 72, 84);
});

test('Get info on invalid band should throw Error', () => {
  expect(() => {
    getGZD('0F');
  }).toThrow();
  expect(() => {
    getGZD('61G');
  }).toThrow();
  expect(() => {
    getGZD('33Z');
  }).toThrow();
});

test('Special case around Norway', () => {
  /*
   * Special case around Norway:
   * Zone 32V is extended 3° west and 31V is shrunk 3°
   */
  let zone = getGZD(31, 'V');
  let coordinates = validateDataTypesAndName(zone, '31V');
  validateCoordinates(coordinates, 0, 3, 56, 64);
  zone = getGZD(32, 'V');
  coordinates = validateDataTypesAndName(zone, '32V');
  validateCoordinates(coordinates, 3, 12, 56, 64);
});

test('Special case around Svalbard', () => {
  /*
   * Special case around Svalbard:
   * - 31X and 37X extended 3°
   * - 33X and 35X extended 6°
   */
  let zone = getGZD(31, 'X');
  let coordinates = validateDataTypesAndName(zone, '31X');
  validateCoordinates(coordinates, 0, 9, 72, 84);

  zone = getGZD(33, 'X');
  coordinates = validateDataTypesAndName(zone, '33X');
  validateCoordinates(coordinates, 9, 21, 72, 84);

  zone = getGZD(35, 'X');
  coordinates = validateDataTypesAndName(zone, '35X');
  validateCoordinates(coordinates, 21, 33, 72, 84);

  zone = getGZD(37, 'X');
  coordinates = validateDataTypesAndName(zone, '37X');
  validateCoordinates(coordinates, 33, 42, 72, 84);
});

test('Invalid bands around Svalbard should throw Error', () => {
  expect(() => {
    getGZD('32X');
  }).toThrow();
  expect(() => {
    getGZD('34X');
  }).toThrow();
  expect(() => {
    getGZD('36X');
  }).toThrow();
  expect(() => {
    getGZD('Not valid!');
  }).toThrow();
  expect(() => {
    getGZD('33');
  }).toThrow();
  expect(() => {
    getGZD('G');
  }).toThrow();
});

test('Polar regions', () => {
  let zone = getGZD('A');
  let coordinates = validateDataTypesAndName(zone, 'A');
  validateCoordinates(coordinates, -180, 0, -90, -80);

  zone = getGZD('B');
  coordinates = validateDataTypesAndName(zone, 'B');
  validateCoordinates(coordinates, 0, 180, -90, -80);

  zone = getGZD('X');
  coordinates = validateDataTypesAndName(zone, 'X');
  validateCoordinates(coordinates, -180, 0, 84, 90);

  zone = getGZD('Y');
  coordinates = validateDataTypesAndName(zone, 'Y');
  validateCoordinates(coordinates, 0, 180, 84, 90);
});
