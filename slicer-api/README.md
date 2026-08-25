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

- **Ilość sztuk** — MVP tnie **zawsze dokładnie 1 sztukę** i dla `quantity > 1`
  mnoży wynik naiwnie (cena, czas, materiał × ilość), oznaczając to wprost w
  odpowiedzi jako `orientacyjne: true` z komentarzem w `uwaga`. To nie
  uwzględnia, że drukowanie kilku sztuk razem bywa szybsze niż suma
  pojedynczych wydruków (mniej nagrzewań/dojazdów) — świadomy kompromis, patrz
  „Odrzucone podejście” niżej.
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

## Odrzucone podejście — auto-rozmieszczanie kilku sztuk na płycie

Wcześniejsza wersja próbowała realnie rozmieszczać N sztuk na płycie przez
`orca-slicer --load-assemble-list ...` (z `need_arrange: true`) i liczyć
prawdziwy, łączny czas/materiał dla całej partii naraz — działało świetnie na
prostej testowej kostce (12 trójkątów). **Na prawdziwym pliku klienta (68 814
trójkątów, breloczek na klucze) ten sam mechanizm kończył się crashem
programu** (`exit code -1073741819` / `0xC0000005`, access violation) —
niezależnie od tego, czy `need_arrange` było włączone czy wyłączone. Zwykłe
`--slice` bez `--load-assemble-list` na tym samym pliku działa bez zarzutu
(~7s). Wniosek: `--load-assemble-list` w tej wersji OrcaSlicera (2.4.2) jest
zbyt niestabilny na złożonych, prawdziwych plikach, żeby się na nim opierać —
dlatego MVP wrócił do prostego mnożenia. Do rozważenia w przyszłości: policzyć
pojemność płyty samemu na podstawie bounding boxa modelu (da się to wyciągnąć
bezpośrednio z pliku STL, bez angażowania tej niestabilnej funkcji), zamiast
polegać na aut-arrange OrcaSlicera.

## Co dalej

Gdy wyceny będą wyglądać dobrze na Twoich prawdziwych plikach i profilu:
1. Zbudujemy podstronę `/wydrukuj-projekt` na głównej stronie Astro, która
   będzie wołać to API
2. Wykupimy mały VPS i przeniesiemy tam dokładnie ten sam kod
3. Podepniemy publiczny adres API zamiast `localhost`
