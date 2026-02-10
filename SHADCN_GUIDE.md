# shadcn/ui Integration Guide

## Overview
This project uses shadcn/ui for all UI components instead of raw Tailwind CSS. This provides:
- Pre-built, accessible components
- Consistent design system
- Faster development for internal tools
- Easy customization via CSS variables

## Configuration

### Files
- `components.json` - shadcn/ui configuration
- `tailwind.config.js` - Extended with shadcn/ui theme
- `src/index.css` - CSS variables for theming
- `src/lib/utils.ts` - cn() utility for className merging

### CSS Variables
All colors use CSS variables defined in `src/index.css`:
- `--primary` - Primary brand color (blue)
- `--secondary` - Secondary color (gray)
- `--destructive` - Error states (red)
- `--muted` - Subdued elements
- `--accent` - Accent highlights
- `--border` - Border colors
- `--input` - Input field borders
- `--ring` - Focus rings

## Available Components

### Button (`src/components/ui/button.tsx`)
```tsx
import { Button } from '@/components/ui/button'

// Variants: default, destructive, outline, secondary, ghost, link
<Button variant="default">Click me</Button>
<Button variant="outline" size="sm">Small outline</Button>
<Button variant="destructive">Delete</Button>

// Sizes: default, sm, lg, icon
<Button size="lg">Large button</Button>
```

### Input (`src/components/ui/input.tsx`)
```tsx
import { Input } from '@/components/ui/input'

<Input type="email" placeholder="you@example.com" />
<Input type="password" disabled />
```

### Label (`src/components/ui/label.tsx`)
```tsx
import { Label } from '@/components/ui/label'

<Label htmlFor="email">Email address</Label>
<Input id="email" type="email" />
```

### Card (`src/components/ui/card.tsx`)
```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

## Design Tokens

### Colors
Use semantic color classes instead of specific colors:
- `bg-background` - Page background
- `text-foreground` - Primary text
- `bg-card` - Card backgrounds
- `text-muted-foreground` - Secondary text
- `border` - Borders

### Typography
- `text-sm` - Small text
- `text-base` - Normal text
- `text-lg` - Large text
- `font-medium` - Medium weight
- `font-semibold` - Semibold weight

### Spacing
Use Tailwind's spacing scale:
- `p-4` - Padding 1rem
- `m-2` - Margin 0.5rem
- `space-y-4` - Vertical spacing between children

## Adding New Components

To add more shadcn/ui components (when needed):
```bash
npx shadcn-ui@latest add [component-name]
```

Available components:
- accordion, alert-dialog, alert, avatar, badge, calendar
- checkbox, collapsible, command, context-menu, dialog
- dropdown-menu, form, hover-card, menubar, navigation-menu
- popover, progress, radio-group, scroll-area, select
- separator, sheet, skeleton, slider, switch, table
- tabs, textarea, toast, toggle, tooltip

## Examples in Codebase

### LoginForm
See `src/components/LoginForm.tsx` for a complete form using:
- Card components for layout
- Input for form fields
- Label for accessibility
- Button for submission

### PageLayout
See `src/components/PageLayout.tsx` for semantic color usage:
- `bg-background` for page
- `bg-card` for header
- `text-foreground` and `text-muted-foreground` for text

## Best Practices

1. **Always use shadcn/ui components** instead of raw HTML elements
2. **Use semantic colors** (`bg-card` not `bg-white`)
3. **Import components** from `@/components/ui/`
4. **Extend variants** if needed in component files
5. **Use cn() utility** for conditional className merging

## Dark Mode (Future)
The project is configured for dark mode via `darkMode: ["class"]` in tailwind config.
Add class="dark" to html element to enable.
