# Replacing the logo with your image

The header currently uses an inline SVG mark and the text “best day” with the correct colors (**#4EDD00** green, **#333333** dark grey). To use your actual logo image instead:

## Option A: Use a single logo image (SVG or PNG)

1. **Add the logo file** to the `public` folder:
   - `public/logo.svg` (recommended for sharpness), or  
   - `public/logo.png` (e.g. 2x size for retina, e.g. 160×64px or 200×80px).

2. **Update the header** in `app/components/layout/Header.tsx`:
   - Find the logo section (the `<Link href="/">` that contains the SVG and “best day” text).
   - Replace the entire logo content (the `<span>` with the SVG and the `<span>` with “best day”) with an image:

   **If using Next.js Image component:**
   ```tsx
   import Image from "next/image";
   // ... inside the Link:
   <Image
     src="/logo.svg"
     alt="Best Day"
     width={120}
     height={40}
     className="h-8 w-auto"
     priority
   />
   ```

   **If using a plain img tag:**
   ```tsx
   <img src="/logo.svg" alt="Best Day" className="h-8 w-auto" />
   ```

3. **Adjust size** with the `className` (e.g. `h-8`, `h-10`) or `width`/`height` so it matches your layout.

## Option B: Use separate mark + text (like now, but with your graphic)

If you have the green mark as a separate file (e.g. `public/logo-mark.svg`):

1. Put `logo-mark.svg` in `public/`.
2. In `Header.tsx`, replace the inline `<svg>…</svg>` with:
   ```tsx
   <img src="/logo-mark.svg" alt="" className="w-8 h-8" aria-hidden />
   ```
3. Keep the existing “best day” text span; its color is already **#333333**.

## Brand colors (for reference)

- **Logo green:** `#4EDD00`
- **Logo text grey:** `#333333`
- **Hover green:** `#3db800` (used for buttons/links)

These are already set in `app/globals.css` and in the header/footer components.
