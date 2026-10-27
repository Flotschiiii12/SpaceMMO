import { MapData } from '../sim/types';

export const MAPS: Record<string, MapData> = {
  map_1: {
    id: 'map_1',
    name: 'Sector 01: Cradle',
    width: 6000,
    height: 3600,
    bgTint: '#0d1522', // Graphite / Blue
    homeStation: {
      id: 'cradle_station',
      name: 'Bastion Alpha',
      x: 3000,
      y: 1800,
      radius: 400,
    },
    portals: [
      {
        id: 'portal_1_to_2',
        name: 'Gate to Slagfield',
        x: 5500,
        y: 1800,
        radius: 90,
        targetMapId: 'map_2',
        targetX: 700,
        targetY: 1800,
      },
    ],
    asteroidCount: 22,
  },
  map_2: {
    id: 'map_2',
    name: 'Sector 02: Slagfield',
    width: 6000,
    height: 3600,
    bgTint: '#1c130b', // Rust / Orange
    portals: [
      {
        id: 'portal_2_to_1',
        name: 'Gate to Cradle',
        x: 500,
        y: 1800,
        radius: 90,
        targetMapId: 'map_1',
        targetX: 5300,
        targetY: 1800,
      },
      {
        id: 'portal_2_to_3',
        name: 'Gate to Ember Reach',
        x: 5500,
        y: 1800,
        radius: 90,
        targetMapId: 'map_3',
        targetX: 700,
        targetY: 1800,
      },
    ],
    asteroidCount: 45,
  },
  map_3: {
    id: 'map_3',
    name: 'Sector 03: Ember Reach',
    width: 6000,
    height: 3600,
    bgTint: '#220b0e', // Dark Ember Red
    portals: [
      {
        id: 'portal_3_to_2',
        name: 'Gate to Slagfield',
        x: 500,
        y: 1800,
        radius: 90,
        targetMapId: 'map_2',
        targetX: 5300,
        targetY: 1800,
      },
    ],
    asteroidCount: 38,
  },
};
