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
│   │   └── logo/            # warianty logo SVG (placeholder — patrz niżej)
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

## Logo — placeholder do podmiany

Docelowe pliki logo (z ZIP-a w briefie: warianty horizontal/stacked/lockup/mark
na jasnym i ciemnym tle) nie znajdowały się w katalogu projektu w momencie
budowy strony. W `src/assets/logo/` znajdują się placeholdery odtwarzające opis
z briefu — stylizowana litera „K" złożona z ukośnych, grubych kresek w kolorze
`--deep-sky-blue`:

- `logo-mark.svg` — sam sygnet
- `logo-horizontal-on-light.svg` — sygnet + nazwa, do nagłówka (jasne tło)
- `logo-horizontal-on-dark.svg` — sygnet + nazwa, do stopki (ciemne tło)
- `public/favicon.svg` — favicon oparty o sygnet

**Po otrzymaniu docelowych plików SVG** wystarczy podmienić zawartość plików w
`src/assets/logo/` (i `public/favicon.svg`) zachowując te same nazwy — reszta
strony (import w [Header.astro](src/components/Header.astro) i
[Footer.astro](src/components/Footer.astro)) nie wymaga zmian.

## Dane kontaktowe — do uzupełnienia

Sekcja kontaktowa ([src/components/Contact.astro](src/components/Contact.astro))
i stopka zawierają placeholdery (telefon, e-mail, lokalizacja) — do podmiany na
prawdziwe dane firmy przed publikacją.

## Formularz kontaktowy

Formularz w sekcji Kontakt nie wysyła jeszcze danych — strona jest statyczna i
nie ma własnego backendu. Przed wdrożeniem należy podpiąć obsługę (np.
Formspree, Netlify Forms albo własny endpoint) w atrybucie `action` formularza
w `Contact.astro`.

## Realizacje / Portfolio

Sekcja „Realizacje" zawiera obecnie placeholdery zamiast zdjęć — do podmiany na
prawdziwe fotografie realizacji, gdy będą dostępne.
