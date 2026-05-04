## Hide the basketball icon on the pack

The center basketball (radial-gradient circle + seam SVG) is rendered in `src/components/SealedPackCard.tsx` at lines 320–342 inside `FullPackFace`.

### Change
- In `src/components/SealedPackCard.tsx`, remove (or comment out) the entire `{/* Basketball — kept but framed by Memphis shapes */}` block (lines 320–342), including the gradient circle div and the seams `<svg>`.

No other elements (title, watermark, banner) are affected.