## Goal

In `/admin`, the "WADE'S TAKE — SUMMARY DRAWER" accordion currently shows an intermediate "Open Wade's Take" button that the admin has to click. Remove that step and move the accordion higher in the page.

## Changes (single file: `src/pages/Admin.tsx`)

1. **Auto-open behavior** — Replace the `WadeTakeDemo` helper. Instead of rendering a button + manual `open` state, drive the drawer's `open` state from the accordion's expanded state:
   - Track which accordion items are open in the "MATCH DETAILS" group (the `Accordion` there is already `type="multiple"`).
   - When `wades-take` is in the open list, mount `<DeadpoolRecapDrawer open={true} onOpenChange={...} />`. Closing the drawer collapses the accordion item, and collapsing the accordion item closes the drawer — they stay in sync.
   - The accordion content area itself just shows a one-line hint ("Drawer opens automatically.") so there's still something inside the expanded panel.

2. **Reposition** — Promote "WADE'S TAKE — SUMMARY DRAWER" out of the "MATCH DETAILS" group and render it as its own standalone accordion (same styling as the existing `AdminSeriesConfirmPanel` / `FLYER — THE SHOT` accordions) placed **directly below `<AdminSeriesConfirmPanel />`** and above the FLYER accordion. Remove the `wades-take` entry from the MATCH DETAILS group's items array.

## Out of scope

- No changes to `DeadpoolRecapDrawer.tsx` itself (logic, admin gating, save behavior all unchanged).
- No styling changes beyond matching the existing accordion shell.
