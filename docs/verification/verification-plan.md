# Gesture Mask Studio Verification Plan

This document is the standing verification checklist for every feature, bug fix, and deployment change.

## Rule For Future Changes

Every new feature or bug fix must include a concrete verification plan before it is considered done.

The plan must state:

- what changed,
- what automated checks were run,
- what manual browser/device checks were run,
- what exact expected result proves the change,
- what evidence was captured or observed,
- what risks remain unverified.

## Baseline Commands

Run these from `app/` before merging or deploying production code:

```bash
npm test
npm run build
```

When the change touches dependencies or `package-lock.json`, also run:

```bash
npx npm@10.9.8 ci
```

This matches the current GitHub Actions runner npm version used by the Pages workflow.

## Deployment Verification

After pushing to `main`:

1. Open GitHub Actions.
2. Check workflow `Deploy GitHub Pages`.
3. Confirm both jobs are green:
   - `build`
   - `deploy`
4. Open:
   - `https://baldman-jyh.github.io/gesture-mask-studio/`
5. Hard refresh the page.
6. Confirm:
   - HTTP status is `200`,
   - page title is `Gesture Mask Studio`,
   - no missing JS/CSS/wasm assets in DevTools Network,
   - no console errors on first load.

## Realtime Camera Verification

Use Chrome or Edge on HTTPS deployment or local `127.0.0.1`.

1. Open the app URL.
2. Confirm first viewport:
   - top status bar is visible,
   - camera stage fills the page,
   - bottom dock is visible,
   - automatic gesture style status, Mirror, and Start camera controls are visible,
   - Blueprint, Cards, and Organic are not shown as manual tab buttons,
   - no horizontal scrolling.
3. Click `Start camera`.
4. Grant camera permission.
5. Confirm:
   - button changes to `Stop camera`,
   - live camera preview appears,
   - no console errors,
   - app remains responsive for at least 30 seconds.

## Gesture Effect Verification

The core effect is a realtime live-sampling light sheet. It must not behave like a static image overlay.

1. Show one hand to the camera.
2. Expected:
   - one-hand preview geometry appears or tracking status updates.
3. Show two hands.
4. Move hands left/right/up/down.
5. Expected:
   - light sheet follows hand anchors,
   - sheet stretches between hands,
   - sheet rotation changes with hand angle,
   - sheet size changes with openness.
6. Move a visible object or face behind the sheet area.
7. Expected:
   - content behind the sheet is sampled live,
   - movement behind the sheet is visible through the sheet,
   - the rendered content is not frozen and not a pre-generated image.
8. Change hand openness with two hands.
9. Expected:
   - style changes automatically according to the gesture-derived preset,
   - the bottom dock shows the active `Auto` style,
   - live camera sampling remains enabled for every style.

## Control Verification

1. Confirm the bottom dock shows `Auto` plus the current style name.
2. Expected:
   - there are no manual Blueprint/Cards/Organic tab buttons,
   - style changes are driven by hand tracking, not by manual selection.
5. Click `Mirror`.
6. Expected:
   - preview mirror state changes,
   - sampling alignment stays coherent.
7. Click `Stop camera`.
8. Expected:
   - camera stream stops,
   - button returns to `Start camera`,
   - no stale tracking state remains active.

## Permission And Failure Verification

1. Deny camera permission.
2. Expected:
   - app does not crash,
   - permission error state is shown,
   - controls remain usable.
3. Reload and grant permission.
4. Expected:
   - camera can start normally.
5. Test with no camera available when possible.
6. Expected:
   - unsupported/error state appears,
   - no unhandled exception appears in console.

## Mobile Verification

Test at least one mobile viewport or physical phone.

1. Open deployed URL on mobile.
2. Confirm:
   - no horizontal scroll,
   - top status bar does not overlap controls,
   - bottom dock remains usable,
   - text fits inside buttons,
   - camera permission flow opens,
   - Start/Stop camera remains reachable.

## Browser Automation Smoke

For layout regressions, run a browser smoke check with Playwright or equivalent:

- desktop viewport around `1440x900`,
- mobile viewport around `390x844`,
- confirm the `Auto` gesture style status is visible,
- toggle Mirror,
- start fake camera,
- confirm `Stop camera` appears,
- confirm WebGL canvas is mounted,
- confirm no console errors or failed requests.

## Shader And WebGL Regression Verification

When a change touches `features/light-sheet-renderer` shader code:

1. Add or update a shader-source unit test for the portability rule being protected.
2. Run `npm test -- src/features/light-sheet-renderer/shaderSource.test.ts`.
3. Run a browser-level WebGL compile check in Chrome or Edge when possible.
4. Expected:
   - fragment shader compiles in WebGL1 and WebGL2,
   - program links in WebGL1 and WebGL2,
   - console does not contain `THREE.WebGLProgram: Shader Error`.

## Change-Specific Verification Template

Use this template in future work summaries:

```text
Verification plan:
1. Automated checks:
   - ...
2. Manual browser checks:
   - ...
3. Real camera/gesture checks:
   - ...
4. Deployment checks:
   - ...
5. Expected results:
   - ...
6. Evidence:
   - ...
7. Not covered / residual risk:
   - ...
```

## Bug Fix Verification Template

For every bug fix:

1. Reproduce the bug before fixing, or state why it cannot be reproduced.
2. Add or update the smallest meaningful automated test when the bug is deterministic.
3. Apply the fix.
4. Re-run the reproduction steps.
5. Run the relevant automated checks.
6. Check one adjacent regression path.
7. Record the exact before/after behavior.
