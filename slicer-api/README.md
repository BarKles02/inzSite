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

## Konfiguracja

Wszystko do zmiany jest w [config.js](config.js):

- `pricing` — cena minimalna, cena za godzinę pracy drukarki, cena za gram
  filamentu
- `filamentDensityGPerCm3` — gęstość materiału (do przeliczenia objętości z
  G-code na gramy)
- `profile` — ścieżki do plików ustawień drukarki/procesu/filamentu

## Profil drukarki — obecnie testowy

`profile` w `config.js` wskazuje teraz na **wbudowany w OrcaSlicer profil
testowy** (Bambu Lab A1 + PLA Basic, ustawienia standardowe 0.2mm) — nie na
Twoją prawdziwą, skalibrowaną drukarkę. Wyceny będą orientacyjne, dopóki się
to nie podmieni.

**Żeby podpiąć swój prawdziwy profil:**
1. Otwórz OrcaSlicer, wybierz drukarkę/filament/proces, których faktycznie
   używasz do druku
2. W menu **File → Export → Export Configs** wyeksportuj ustawienia do pliku
3. Podmień ścieżki w `profile` (w `config.js`) na wyeksportowane pliki

## Jak to działa pod maską

1. Zapisuje wgrany STL do folderu tymczasowego
2. Odpala `orca-slicer.exe --slice 1 --load-settings ... --load-filaments ... --outputdir ...`
3. Czyta wynikowy `plate_1.gcode`, wyciąga z nagłówka:
   - `total estimated time: ...`
   - `filament used [cm3] = ...`
4. Liczy cenę: `max(cena_minimalna, gramy × cena_za_gram + godziny × cena_za_h)`
5. Usuwa pliki tymczasowe i zwraca wynik jako JSON

## Co dalej

Gdy wyceny będą wyglądać dobrze na Twoich prawdziwych plikach i profilu:
1. Zbudujemy podstronę `/wydrukuj-projekt` na głównej stronie Astro, która
   będzie wołać to API
2. Wykupimy mały VPS i przeniesiemy tam dokładnie ten sam kod
3. Podepniemy publiczny adres API zamiast `localhost`
