# INZ Kacper Pachut — strona wizytówka

Statyczna, jednostronicowa (one-page) strona wizytówkowa firmy inżynierskiej
INZ Kacper Pachut. Prezentuje zakres usług (druk 3D, projektowanie CAD, lampy
i oświetlenie, inne usługi inżynierskie), krótkie „o firmie", przebieg
współpracy, miejsce na realizacje oraz dane kontaktowe.

## Stos technologiczny

- [Astro](https://astro.build) (statyczny build, bez frameworka JS na froncie)
- Czysty CSS z customowymi właściwościami (bez frameworka CSS)

## Struktura projektu

```
/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/
│   │   └── logo/            # warianty logo SVG (finalne pliki firmy)
│   ├── components/          # jedna sekcja = jeden komponent .astro
│   ├── layouts/
│   │   └── Layout.astro     # szkielet HTML, meta tagi, importy CSS
│   ├── pages/
│   │   └── index.astro      # strona główna — składa komponenty sekcji
│   └── styles/
│       ├── variables.css    # paleta kolorów jako CSS custom properties
│       ├── base.css         # reset, typografia, layout pomocniczy
│       └── components.css   # przyciski, nagłówek, karty, formularz itd.
├── astro.config.mjs
└── package.json
```

## Uruchomienie lokalne

```sh
npm install
npm run dev
```

Strona dostępna pod `http://localhost:4321`.

| Komenda           | Działanie                                    |
| :----------------- | :-------------------------------------------- |
| `npm install`       | Instaluje zależności                          |
| `npm run dev`        | Uruchamia serwer developerski                 |
| `npm run build`      | Buduje wersję produkcyjną do `./dist/`        |
| `npm run preview`    | Podgląd builda produkcyjnego                  |

## Paleta kolorów

Zdefiniowana w [src/styles/variables.css](src/styles/variables.css):

| Zmienna              | Wartość   | Zastosowanie                              |
| --------------------- | --------- | ------------------------------------------ |
| `--ink-black`          | `#08141F` | tekst główny, tła ciemnych sekcji           |
| `--deep-sky-blue`      | `#55BDF2` | akcent marki, linki, ikony                  |
| `--bright-snow`        | `#F7FAFC` | tło strony (jasny motyw)                    |
| `--cool-steel`         | `#9CAFC0` | obramowania, tła neutralne                  |
| `--princeton-orange`   | `#FF8A24` | CTA („Zapytaj o wycenę")                     |

## Logo

`src/assets/logo/` zawiera finalne pliki SVG dostarczone przez klienta (wszystkie
warianty z briefu: horizontal na jasnym/ciemnym tle, navy, white, stacked,
lockup, mark, mark-navy, dark-bg). W użyciu na stronie:

- `logo-horizontal-on-light.svg` — nagłówek (jasne tło)
- `logo-horizontal-on-dark.svg` — stopka (ciemne tło)
- ścieżki mark (`logo-mark.svg`) — motyw graficzny w sekcji hero
- `public/favicon.svg` — favicon dostarczony przez klienta

Pozostałe warianty (navy, white, stacked, lockup, dark-bg) są zapisane w
`src/assets/logo/`, gotowe do wykorzystania przy rozbudowie strony (np.
social media, materiały drukowane, podstrony).

## Dane kontaktowe — do uzupełnienia

Lokalizacja firmy to Suwałki (potwierdzone przez tagline w plikach logo).
Sekcja kontaktowa ([src/components/Contact.astro](src/components/Contact.astro))
i stopka nadal zawierają placeholdery dla telefonu, e-maila i dokładnego adresu —
do podmiany na prawdziwe dane firmy przed publikacją.

## Formularz kontaktowy

Formularz w sekcji Kontakt nie wysyła jeszcze danych — strona jest statyczna i
nie ma własnego backendu. Przed wdrożeniem należy podpiąć obsługę (np.
Formspree, Netlify Forms albo własny endpoint) w atrybucie `action` formularza
w `Contact.astro`.

## Realizacje / Portfolio

Sekcja „Realizacje" zawiera obecnie placeholdery zamiast zdjęć — do podmiany na
prawdziwe fotografie realizacji, gdy będą dostępne.
