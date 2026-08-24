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

## Wdrożenie (GitHub Pages)

Strona jest publikowana automatycznie pod
[barkles02.github.io/inzSite](https://barkles02.github.io/inzSite/) przez
GitHub Actions ([.github/workflows/deploy.yml](.github/workflows/deploy.yml))
przy każdym pushu na branch `master`. Konfiguracja `site`/`base` w
[astro.config.mjs](astro.config.mjs) jest dopasowana do ścieżki tego
repozytorium (`/inzSite`) — w razie zmiany nazwy repo lub przeniesienia na
własną domenę trzeba te wartości zaktualizować.

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

## Dane kontaktowe

- E-mail: `kontakt@inz-pachut.pl`
- Telefon: `+48 690 154 554`
- Adres: ul. Waryńskiego 5, 16-400 Suwałki

## Formularz kontaktowy

Formularz w sekcji Kontakt wysyła zgłoszenia przez
[FormSubmit](https://formsubmit.co) (`action="https://formsubmit.co/kontakt@inz-pachut.pl"`)
— bez własnego backendu, e-maile trafiają bezpośrednio na skrzynkę kontaktową.

**Ważne — jednorazowa aktywacja:** pierwsze wysłanie formularza z tej strony
spowoduje, że FormSubmit wyśle e-mail aktywacyjny na `kontakt@inz-pachut.pl` z
prośbą o potwierdzenie — dopiero po kliknięciu w link aktywacyjny kolejne
zgłoszenia będą przechodzić automatycznie.

## Realizacje / Portfolio

Sekcja „Realizacje" zawiera obecnie placeholdery zamiast zdjęć — do podmiany na
prawdziwe fotografie realizacji, gdy będą dostępne.
