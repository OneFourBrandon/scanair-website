# ScanAir Hero 3DGS Captures

Place `.splat` or compatible `gsplat` capture files in this folder, then add them to `splats.json`.

Example:

```json
{
  "baseUrl": "/splats/",
  "rotationMs": 14000,
  "backgroundColor": "#090d11",
  "orbitSpeed": 0.06,
  "renderFps": 60,
  "items": [
    {
      "src": "exterior-capture.splat",
      "label": "Exterior capture",
      "positionOffset": [0, 0, 1.3],
      "rotation": [-0.05, -0.05, 0],
      "backgroundColor": "#101820",
      "orbitSpeed": -0.06,
      "renderFps": 60,
      "mousePositionAmplitude": 0.5
    }
  ]
}
```

Use the top-level `backgroundColor` for the default renderer backdrop, then add `backgroundColor` to an item only when that capture needs its own color.

The camera orbits around the splat center using `positionOffset` as the starting distance from the center. Set `rotation` to the view that faces the center, then use `orbitSpeed` for the slow turn. Positive and negative values reverse direction; `0` disables orbiting for a capture.

`renderFps` controls how often the splat renderer updates while motion is active. Lower values give the depth-sort worker more time and can reduce flicker on dense captures. Values are clamped between `12` and `60`.

`mousePositionAmplitude` controls only the camera position sway from mouse movement. It does not change the mouse-driven rotation. Use `1` for the default movement, lower values like `0.25` or `0.5` for smaller-scale captures, and `0` to disable mouse position sway for a capture.

## Camera Direction Reference

`positionOffset` is the camera position relative to the splat center:

```json
"positionOffset": [x, y, z]
```

- `x`: left/right from the splat center.
- `y`: up/down from the splat center.
- `z`: forward/back from the splat center.

Larger absolute values move the camera farther from the capture. For example, `[20, -10, 20]` starts the camera off to the side, lower than center, and farther back.

`rotation` is the camera's starting view direction in radians:

```json
"rotation": [x, y, z]
```

- `x`: tilt up/down.
- `y`: turn left/right.
- `z`: roll clockwise/counterclockwise.

Useful radian values:

- `45 degrees`: `0.7854`
- `90 degrees`: `1.5708`
- `180 degrees`: `3.1416`
- `360 degrees`: `6.2832`

If the camera is looking away from the subject, adjust the `y` value first. A 180 degree turn is usually `+3.1416` or `-3.1416` from the current `y` value.

`orbitSpeed` rotates the `positionOffset` around the splat center. Positive and negative values orbit in opposite directions. The code applies the opposite yaw to the camera while orbiting, so the original `rotation` should be the view that faces the center at the starting offset.

The splat switches after `rotationMs`. The camera can continue orbiting past a full turn if the timeout is longer than one orbit.

The live captures are served from the `scanair-website` Cloudflare R2 bucket through `https://cdn.scanair.ca/`.
Keep the same `items` list and set `r2BaseUrl` to the public R2 folder URL when moving between local files and R2.
