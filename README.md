<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/banner-dark.svg">
  <img src="assets/banner-light.svg" alt="Ashwin Pillanda Ravindra portfolio" width="100%">
</picture>

# Ashwin Pillanda Ravindra · Portfolio

Source for [ashwinpr15.github.io](https://ashwinpr15.github.io/): my BI experience at TCS, MSBA studies at BU Questrom, toolkit, projects and resume.

Hand-written HTML, CSS and JavaScript. No framework, no build step.

## Features

- **Signals → data → decisions** colour story: violet for engineering, teal for BI at TCS, orange for analytics
- Animated hero canvas that pauses off-screen and stops when reduced motion is on
- Count-up highlights, a scroll-linked career timeline and scroll-spy navigation
- Interactive toolkit: click a skill to see which projects use it, with professional (TCS) and project skills marked separately
- Filterable project grid with detail popups covering approach, results and limits
- Live "Latest on GitHub" feed from the GitHub API, with caching and a fallback
- `Ctrl` / `⌘` + `K` (or `/`) quick menu for sections, theme, email and links
- Light and dark themes that follow the system, with a manual toggle
- Responsive from 320 px phones to wide desktops; keyboard friendly, with a skip link and visible focus

## Local preview

```sh
python -m http.server 8000
```

Then open http://localhost:8000.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | Content, structure and metadata |
| `styles.css` | Design tokens, layout, themes and responsive rules |
| `script.js` | Theme, navigation, reveal, filters, popups, GitHub feed, quick menu and hero canvas |
| `assets/projects/` | Project cover art (light and dark) |
| `assets/Ashwin-Resume.pdf` | Downloadable resume |

## License

[MIT](LICENSE)
