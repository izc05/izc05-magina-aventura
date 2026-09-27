# Map Data, Tiles & Attribution

## Rule

MapLibre is only the renderer. The style/tiles/data source has its own license and attribution obligations.

Do not remove attribution because the map is being styled as a game.

## Current architecture

The repository supports a versioned MapLibre style + PMTiles asset pipeline.

Before publishing a map asset, the manifest/publishing process must know:
- data provider;
- tile/archive producer;
- source dataset license;
- attribution text;
- attribution URL;
- additional provider attribution if required.

## OpenStreetMap-derived data

If the PMTiles data is derived from OpenStreetMap, provide visible OpenStreetMap attribution and make the ODbL/license information accessible.

Canonical source:
- https://www.openstreetmap.org/copyright

Typical interactive-map credit is based on `© OpenStreetMap contributors` with the license/copyright destination available to the user.

Do not import data from Google Maps or other copyrighted map products into OSM-derived/custom data without permission.

## Protomaps-derived archives

If a future PMTiles archive comes from Protomaps/OpenStreetMap-derived downloads, review:
- https://protomaps.com/legal

Protomaps states that many downloads are produced from OpenStreetMap data and require OpenStreetMap attribution/license compliance.

## MapLibre UI

MapLibre React Native supports its own attribution control and `showAttribution()`.

If product design uses a custom attribution affordance:
- it must remain discoverable;
- it must not be automatically hidden solely for aesthetics;
- it must work offline where the attribution/license information still needs to be readable.

## Contract extension recommended

Extend future `OfflineMapAsset` / map manifest with an attribution structure similar to:

```ts
interface MapAttribution {
  providerId: string;
  displayText: string;
  licenseName?: string;
  licenseUrl?: string;
  providerUrl?: string;
}
```

A route map package should carry this metadata alongside its immutable style/map archive.

## QA

GAME-06 cannot close until:
- attribution is visible/reachable on map;
- offline package preserves required attribution metadata;
- provider/source is documented;
- visual gamification has not covered or disabled the attribution path.
