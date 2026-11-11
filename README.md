# Krishnajith C Vinod — Research Portfolio

An interactive 3D portfolio built with plain HTML, CSS and JavaScript, using [Three.js](https://threejs.org/) for the 3D graphics.
It covers my academic background, my research in **theoretical condensed matter physics** and **machine learning**, and a few physics demos you can play with.

**Live site:** https://Krishnajith-C-Vinod.github.io/Portfolio

---

## About Me

I'm from Kozhikode, Kerala, and a **PhD scholar in Physics at IIT Madras** in the
[Teraqata](https://www.teraqata.com/group-members) research group led by **Dr. Ayana Ghosh**.

- **PhD in Physics**: Indian Institute of Technology Madras (2026 – present)
- **MSc in Physics**: Govt. Arts & Science College, Meenchanda, University of Calicut (2023 – 2025), *First Rank Holder*
- **BSc in Physics**: Zamorins Guruvayurappan College, Kozhikode

### Research interests

- **Theoretical Condensed Matter**: lattice models, band structure, symmetry breaking and collective excitations
- **Machine Learning for Materials**: learning how structure maps to properties, and predicting a material's response from structures, spectra and images
- **AI for Physics Discovery**: symbolic regression, interpretable models, and recovering physical laws from data
- **Computational & Data-Driven Physics**: simulation, datasets and HPC workflows

---

## Publications & Projects

| Year | Title | Link |
|------|-------|------|
| 2026 | **Beyond Bell Teleportation: Machine-Learned Adaptive Protocols** | [arXiv:2605.16467](https://arxiv.org/abs/2605.16467) |
| 2025 | **Benchmarking Quantum Teleportation Schemes: A Noise-Based Comparative Approach** (MSc project) | [Document](https://drive.google.com/file/d/1suR7MZl9j9NUOKO_jsiFDkmreNdwkqBG/view?usp=sharing) |

## Achievements

- PhD Scholar, IIT Madras (2026)
- First Rank Holder, MSc Physics, University of Calicut (2025)
- University of Calicut PG Merit Scholarship (2023–24)
- Selected for KTPI Active Research Training (ART-3) Programme (2023)
- Third position with A grade in Electronics, Kerala State Work Experience Fair (2019–20)

---

## Website Features

### Interactive 3D
- **Spin-lattice crystal (hero):** a rotating cubic crystal with precessing spins, orbit rings and a glowing platform underneath.
  *Click the crystal* to send a spin wave through the lattice. It *tilts* as you move your cursor.
- **Scroll-driven scene:** the camera and crystal move as you scroll, and a neural-network shape with moving signal pulses fades in.
- **Band Structure Lab:** live tight-binding band structures you can rotate:
  - Honeycomb (graphene), square and triangular lattices
  - Sliders for hopping *t*, mass gap *Δ* (opens a gap at the Dirac points) and next-nearest hopping *t′*
  - Brillouin-zone outline with marked high-symmetry points
  - Hover over a band to read *k* and *E(k)*
- **Atomic cluster:** a 55-atom icosahedral cluster with an outer shell of ligands. Drag to rotate it, click to make it "breathe".

### Interface
- Dashboard layout with a top bar and side menu
- Bright pastel palette, with a **dark / light theme** switch that is remembered between visits
- Glass panels with 3D tilt and glare on hover
- Typewriter text, scroll-reveal animations and active-section highlighting
- Responsive layout for phones, tablets and desktops
- Respects `prefers-reduced-motion`, and the 3D canvases pause when they are off-screen or the tab is hidden

---

## Tech Stack

- **HTML5 / CSS3**: custom properties, `backdrop-filter`, CSS 3D transforms
- **JavaScript (ES modules)**
- **Three.js r160**: loaded from the jsDelivr CDN through an import map, so there is no build step
- **GitHub Pages**: deployed with GitHub Actions (`.github/workflows/static.yml`)

## Project Structure

```txt
.
├── index.html                  # page structure and content
├── style.css                   # theme, layout, animations
├── script.js                   # UI logic + all Three.js scenes
├── README.md
├── LICENSE
└── .github/workflows/static.yml  # GitHub Pages deployment
```

## Run Locally

The 3D scenes load ES modules from a CDN, so serve the folder over HTTP rather than opening `index.html` directly:

```bash
git clone https://github.com/Krishnajith-C-Vinod/portfolio.git
cd portfolio
python -m http.server 8000
# open http://localhost:8000
```

## Customising

- **Content:** edit the text in `index.html`. Each section is marked with a `<!-- ===== SECTION ===== -->` comment.
- **Colours:** change the pastel variables at the top of `style.css` (`--mint`, `--sky`, `--peach`, …) and the `PASTEL` object in `script.js`.
- **3D scenes:** `initBackground`, `initBandLab` and `initCluster` in `script.js` each set up one scene.

---

## Contact

- **Email:** krishnajithcvinod7@gmail.com
- **LinkedIn:** https://in.linkedin.com/in/krishnajith-c-vinod
- **GitHub:** https://github.com/Krishnajith-C-Vinod
- **YouTube:** https://youtube.com/KrishnajithCVinod
- **Instagram:** https://www.instagram.com/krishnajith_c_vinod

## License

This project is open for academic and personal inspiration purposes. See [LICENSE](LICENSE).
