# GZD Utils for Nodejs

Utilities for calculating [MGRS GZDs](https://en.wikipedia.org/wiki/Military_Grid_Reference_System) in Nodejs.

## Installation

    $ npm install gzd-utils

## Usage

```typescript
import { Polygon } from 'geojson';
import { getAllGZD, getGZD } from 'gzd-utils';

// Get all GZDs
const gzdZones = getAllGZD();
gzdZones.features.forEach((zone) => {
  console.log(`Zone: ${zone.properties['name']}`);
  const polygon = zone.geometry as Polygon;
  console.log(`Coordinates: ${polygon.coordinates}`);
};

// Get a specific GZD
let zone = getGZD('33V');
console.log(`Zone: ${zone.properties['name']}`);
let polygon = zone.geometry as Polygon;
console.log(`Coordinates: ${polygon.coordinates}`);

// Alternate way of getting a specific GZD
zone = getGZD(33, 'V');
console.log(`Zone: ${zone.properties['name']}`);
polygon = zone.geometry as Polygon;
console.log(`Coordinates: ${polygon.coordinates}`);
```