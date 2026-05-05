## Add burned check mark next to card recipient name

In `src/components/AdminFlyerAwardPanel.tsx`, the Card Assignments list shows each card label and the assigned user. Add a green check mark next to the card name when the assigned user has burned (opened) their pack.

### Changes

- Import `Check` from `lucide-react`.
- Pull `burned` from `useDemoFlyerState()` (already used for `winners`).
- In the `<li>` row, when `burned[card.id]` is true, render a small `Check` icon (text-primary) inline after the card label.

### Snippet

```tsx
const { winners: demoWinners, burned } = useDemoFlyerState();

<p className="font-display tracking-wider text-sm flex items-center gap-1.5">
  {card.label}
  {burned[card.id] && <Check size={14} className="text-primary" />}
</p>
```

No other changes needed — `burned` already reflects the recipient burning their card via the receiver drawer.