# Approved Beta Drips raster assets

All brand assets derive from `beta-drips-icon-source.png`, the approved 1254 × 1254 RGB PNG. Its SHA-256 is `fb4b5da6f647998382aace5af4a048ba39b4913ef709915f7a3c2a6a36a05aa4`. The source is unchanged. These are raster exports, not vector artwork. No full wordmark is included in tiny icons; Beta Drips remains separate readable header text.

`generate-assets.py` uses Pillow to crop/resize the existing mark and remove only its green field for transparent exports. Opaque exports retain the source's cream artwork and green texture, using a centered square crop with additional padding for readability. Transparent exports preserve the cream shapes; antialiased edge pixels are unmatted to avoid green fringes. Android's monochrome layer uses the same silhouette/alpha, with a single white color for launcher theming. No image is redrawn or generated.

Regenerate from the repository root with `python3 branding/generate-assets.py` (Pillow is a local asset-generation tool, not an app dependency). The preview also uses the system DejaVu Sans font. Runtime assets do not require Python or this font.

| Asset | Location | Size / behavior |
| --- | --- | --- |
| Favicon | `public/favicon.ico`, `public/favicon-16.png`, `public/favicon-32.png` | ICO includes 16/32/48 px; PNG alternatives |
| Apple touch icon | `public/apple-touch-icon.png` | Opaque 180 × 180 |
| Website header | `public/branding/beta-drips-mark.png` | 256 × 256 source export, displayed at 44–64 px |
| Mobile header | `mobile/assets/brand-mark.png` | Byte-identical to website header, displayed at 44 dp |
| Expo app icon | `mobile/assets/icon.png` | Opaque 1024 × 1024 |
| Android foreground | `mobile/assets/android-icon-foreground.png` | Transparent 1024 × 1024; centered artwork approximately 572 × 487 |
| Android background | `mobile/assets/android-icon-background.png` | Solid `#004634`, 1024 × 1024 |
| Android monochrome | `mobile/assets/android-icon-monochrome.png` | White silhouette using the foreground alpha |
| Splash mark | `mobile/assets/splash-mark.png` | Transparent 1024 × 1024; Expo shows a 200 dp image on solid green |
| Review sheet | `asset-preview.png` | Raster asset/header-layout and simulated mask/splash previews |

The adaptive artwork is inside Android's central 66/108 safe circle (maximum visible-pixel radius 306.16 px, below 312.89 px). Foreground layers contain neither a baked mask nor a background rectangle. Simulated launcher previews crop the 72/108 viewport before applying circle/squircle masks. The source mark stays within both masks. Small-size review inspected actual 16/32/48 px exports and enlarged pixel views: the silhouette remains visible; detail at 16 px is necessarily limited. No claim is made that fine details or a wordmark are readable at that size.

`asset-preview.png` is not a device screenshot or proof of a native build. Verify the launcher icon, themed monochrome icon and cold-start splash on the planned standalone release APK. [Android adaptive-icon guidance](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive) specifies layers/safe areas; [Expo splash documentation](https://docs.expo.dev/versions/latest/sdk/splash-screen/) explains why development clients do not fully reproduce release splash screens.
