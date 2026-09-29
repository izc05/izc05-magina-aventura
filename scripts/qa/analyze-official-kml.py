#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import math
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

EARTH_RADIUS_M = 6_371_008.8


def haversine_m(a: tuple[float, float], b: tuple[float, float]) -> float:
    lon1, lat1 = a
    lon2, lat2 = b
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    h = (
        math.sin(dphi / 2) ** 2
        + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    )
    return 2 * EARTH_RADIUS_M * math.asin(min(1.0, math.sqrt(h)))


def parse_coordinate_text(text: str) -> list[tuple[float, float]]:
    coords: list[tuple[float, float]] = []
    for token in text.replace("\n", " ").replace("\t", " ").split():
        parts = token.split(",")
        if len(parts) < 2:
            continue
        lon = float(parts[0])
        lat = float(parts[1])
        if not (math.isfinite(lon) and math.isfinite(lat)):
            raise ValueError("Non-finite coordinate")
        if not (-180 <= lon <= 180 and -90 <= lat <= 90):
            raise ValueError(f"Coordinate outside WGS84 bounds: {(lon, lat)}")
        coords.append((lon, lat))
    return coords


def iter_line_strings(root: ET.Element) -> Iterable[list[tuple[float, float]]]:
    for element in root.iter():
        if element.tag.rsplit("}", 1)[-1] != "LineString":
            continue
        for child in element.iter():
            if child.tag.rsplit("}", 1)[-1] == "coordinates" and child.text:
                coords = parse_coordinate_text(child.text)
                if len(coords) >= 2:
                    yield coords
                break


def line_length_m(coords: list[tuple[float, float]]) -> float:
    return sum(haversine_m(coords[i - 1], coords[i]) for i in range(1, len(coords)))


def analyze(
    kml_path: Path,
    source_url: str,
    published_length_m: float,
    suspicious_jump_m: float,
) -> dict:
    payload = kml_path.read_bytes()
    sha256 = hashlib.sha256(payload).hexdigest()
    root = ET.fromstring(payload)

    lines = list(iter_line_strings(root))
    if not lines:
        raise ValueError("No KML LineString with at least two coordinates found")

    line_metrics = []
    for index, coords in enumerate(lines):
        segments = [
            haversine_m(coords[i - 1], coords[i])
            for i in range(1, len(coords))
        ]
        length_m = sum(segments)
        bounds = {
            "west": min(lon for lon, _ in coords),
            "south": min(lat for _, lat in coords),
            "east": max(lon for lon, _ in coords),
            "north": max(lat for _, lat in coords),
        }
        closure_distance_m = haversine_m(coords[0], coords[-1])
        suspicious = [
            {
                "segment_index": i,
                "distance_m": round(distance, 3),
                "from": coords[i - 1],
                "to": coords[i],
            }
            for i, distance in enumerate(segments, start=1)
            if distance > suspicious_jump_m
        ]
        line_metrics.append(
            {
                "index": index,
                "point_count": len(coords),
                "length_m": round(length_m, 3),
                "bounds": bounds,
                "start": coords[0],
                "end": coords[-1],
                "closure_distance_m": round(closure_distance_m, 3),
                "plausibly_circular": closure_distance_m <= 100,
                "suspicious_jump_threshold_m": suspicious_jump_m,
                "suspicious_jumps": suspicious,
            }
        )

    candidate = max(line_metrics, key=lambda item: item["length_m"])
    discrepancy_m = candidate["length_m"] - published_length_m
    discrepancy_pct = (
        discrepancy_m / published_length_m * 100 if published_length_m else None
    )

    return {
        "source_url": source_url,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "source_format": "KML",
        "crs_assumption": "KML coordinates interpreted as WGS84 lon,lat per OGC KML convention",
        "file_name": kml_path.name,
        "file_size_bytes": len(payload),
        "sha256": sha256,
        "line_string_count": len(lines),
        "candidate_rule": "longest LineString only; no segments concatenated or invented",
        "candidate_line_index": candidate["index"],
        "candidate": candidate,
        "published_length_m": published_length_m,
        "length_discrepancy_m": round(discrepancy_m, 3),
        "length_discrepancy_pct": (
            round(discrepancy_pct, 3) if discrepancy_pct is not None else None
        ),
        "all_lines": line_metrics,
        "geometry_version_proposal": 1,
        "qa_notes": [
            "This report does not publish or enable the route in product.",
            "The official route remains simulation_only while the source reports temporary closure.",
            "No community geometry was substituted and no missing segment was invented.",
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("kml")
    parser.add_argument("--source-url", required=True)
    parser.add_argument("--published-length-m", type=float, default=8720.0)
    parser.add_argument("--suspicious-jump-m", type=float, default=250.0)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    report = analyze(
        Path(args.kml),
        args.source_url,
        args.published_length_m,
        args.suspicious_jump_m,
    )
    Path(args.output).write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
