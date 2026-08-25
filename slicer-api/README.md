# Slicer API — lokalny prototyp wyceny druku 3D

Osobna, niezależna od strony Astro usługa. Przyjmuje plik STL, tnie go
lokalnie zainstalowanym OrcaSlicerem (bez GUI, z linii poleceń), czyta z
G-code czas druku i zużycie filamentu, i liczy cenę.

**To jest wersja lokalna do testów — nie jest jeszcze podłączona do
publicznej strony ani nigdzie wystawiona w internecie.**

## Uruchomienie

```sh
cd slicer-api
npm install
npm start
```

Otwórz `http://localhost:3001` w przeglądarce — prosty formularz do wgrania
pliku `.stl` i podglądu wyniku.

## Co klient może wybrać

- **Ilość sztuk** — program **naprawdę rozmieszcza tyle sztuk na płycie
  drukarki** (auto-arrange, `--load-assemble-list`) i liczy realny czas/
  materiał dla całej partii naraz — to nie jest naiwne pomnożenie wyniku
  jednej sztuki. Sprawdzone empirycznie: 4 sztuki naraz wyszły taniej per
  sztuka niż 1 sztuka osobno (mniej nagrzewań/dojazdów).
  Jeśli podana ilość **fizycznie nie mieści się na jednej płycie**, program
  to wykrywa (OrcaSlicer kończy się błędem zamiast nakładać elementy na
  siebie) i **szuka wyszukiwaniem binarnym**, ile sztuk faktycznie wchodzi
  razem na płytę — a potem liczy realny harmonogram (ile pełnych płyt +
  ewentualna reszta) i sumuje prawdziwy czas/materiał dla całości. Przykład
  z testów: 50 sztuk 40mm kostki → 16 szt./płytę → 4 wydruki (3×16 + 1×2) →
  244 zł, zamiast 528 zł przy naiwnym pomnożeniu jednej sztuki × 50 (które
  ignorowało, że drukarka nie nagrzewa się od zera dla każdej sztuki).
  Odpowiedź zawiera `sztukNaPlyte`, `liczbaWydrukow` i
  `mieszczySieNaJednejPlycie: false` z wyjaśnieniem.
- **Materiał** (PLA / PETG / ABS / TPU) — każdy ma swój profil filamentu,
  gęstość i cenę za gram
- **Kolor** — czysto informacyjne, nie wpływa na slicing ani cenę
- **Wypełnienie (%)** — realnie zmienia wynik slicowania (nadpisywane przez
  `--sparse-infill-density`, sprawdzone empirycznie: 10% vs 90% wypełnienia
  dało 13.94 cm³ / 2h19m vs 56.53 cm³ / 8h19m na tym samym modelu)

## Konfiguracja

Wszystko do zmiany jest w [config.js](config.js):

- `pricing` — cena minimalna, cena za godzinę pracy drukarki
- `materials` — mapa materiałów: profil filamentu, gęstość, cena za gram dla
  każdego
- `colors` — lista kolorów do wyboru (informacyjne)
- `infillRange`, `quantityRange` — dopuszczalne zakresy do walidacji
- `profile` — ścieżki do wspólnych plików ustawień drukarki/procesu

## Profil drukarki — obecnie testowy

`profile` i `materials` w `config.js` wskazują teraz na **wbudowane w
OrcaSlicer profile testowe** (Bambu Lab A1, ustawienia standardowe 0.2mm,
generyczne filamenty) — nie na Twoją prawdziwą, skalibrowaną drukarkę.
Wyceny będą orientacyjne, dopóki się to nie podmieni.

**Żeby podpiąć swój prawdziwy profil:**
1. Otwórz OrcaSlicer, wybierz drukarkę/proces, których faktycznie używasz
2. W menu **File → Export → Export Configs** wyeksportuj ustawienia do pliku
3. Podmień ścieżki w `profile.machine` / `profile.process` (w `config.js`)
   na wyeksportowane pliki
4. Zrób to samo dla każdego materiału, którego faktycznie używasz, i podmień
   ścieżkę `filament` w odpowiednim wpisie w `materials`

## Jak to działa pod maską

1. Zapisuje wgrany STL do folderu tymczasowego
2. Odpala `orca-slicer.exe --slice 1 --load-settings "maszyna;proces" --load-filaments "filament dla wybranego materiału" --sparse-infill-density <%> --outputdir ...`
3. Czyta wynikowy `plate_1.gcode`, wyciąga z nagłówka:
   - `total estimated time: ...`
   - `filament used [cm3] = ...`
4. Liczy cenę za sztukę: `max(cena_minimalna, gramy × cena_za_gram_dla_materiału + godziny × cena_za_h)`,
   potem mnoży przez ilość sztuk
5. Usuwa pliki tymczasowe i zwraca wynik jako JSON

## Co dalej

Gdy wyceny będą wyglądać dobrze na Twoich prawdziwych plikach i profilu:
1. Zbudujemy podstronę `/wydrukuj-projekt` na głównej stronie Astro, która
   będzie wołać to API
2. Wykupimy mały VPS i przeniesiemy tam dokładnie ten sam kod
3. Podepniemy publiczny adres API zamiast `localhost`
