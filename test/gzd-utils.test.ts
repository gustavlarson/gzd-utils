import { getAllGZD } from '../src/gzd-utils';
import { Polygon } from 'geojson';

test('Number of features', () => {
  const gzdZones = getAllGZD();
  expect(gzdZones.features.length).toBe(1201);
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
