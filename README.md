# Klick och Klart Website

Static one-page website for Klick och Klart, focused on small Fortnox automation services and the future SaaS direction.

## Files

- `index.html` - page structure and content
- `reset-password.html` - password reset page for account users
- `profile-settings.html` - signed-in profile settings page
- `style.css` - layout, responsive design, and styling
- `script.js` - mobile navigation, scroll animations, account auth, and Fortnox connect flow
- `reset-password.js` - forgot-password reset-code flow
- `profile-settings.js` - profile loading, password reset start, and account deletion
- `icon.svg` - company icon and favicon
- `Fortnox_logo.png` - Fortnox wordmark used in the hero workflow card
- `sitemap.xml` - search engine sitemap for `https://klickochklart.se/`
- `robots.txt` - crawler rules and sitemap location

## Publish with GitHub Pages

1. Copy these files into the root of the `klickochklart` repository.
2. Commit and push them to the `main` branch.
3. Open repository Settings > Pages.
4. Select `Deploy from a branch`.
5. Select `main` and `/(root)`.
6. Add `klickochklart.se` as the custom domain.

## Contact form

The form submits through FormSubmit to:

`yadhukrishnan@klickochklart.se`

FormSubmit may require a one-time activation from the destination email address before messages are forwarded.

## Fortnox connection

The Connect Fortnox section uses the Klick och Klart backend API for signup, sign-in, and Fortnox OAuth.

Signup requires email verification before sign-in. The sign-in tab links to `reset-password.html`, which sends a 4-character reset code through the backend email service. Password resets require at least 8 characters, 1 capital letter, 1 number, and 1 special character, and old passwords cannot be reused.

For local development, `index.html` currently points to:

`http://localhost:3000`

Before deploying production, update `window.KOK_API_BASE` in `index.html` to the Render backend URL.

## Positioning

The page intentionally presents Klick och Klart as an independent automation service starting with narrow Fortnox-related automation projects. The copy avoids claiming deep Fortnox expertise and frames the Python backend/SaaS product as the planned direction after real workflow validation.
