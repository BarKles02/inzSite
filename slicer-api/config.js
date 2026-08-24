// Konfiguracja wyceny i profilu drukarki.
// TO JEST MIEJSCE DO EDYCJI, GDY BĘDZIESZ CHCIAŁ ZMIENIĆ CENNIK
// albo podmienić profil na swoją prawdziwą, skalibrowaną drukarkę.

export const pricing = {
	// Cena minimalna za wydruk (zł) — niezależnie od tego, jak mały/szybki jest projekt.
	minPricePLN: 15,

	// Cena za godzinę pracy drukarki (zł/h) — pokrywa zużycie sprzętu, prąd, Twój czas.
	pricePerHourPLN: 8,

	// Cena filamentu za gram (zł/g) — dopasuj do tego, ile faktycznie płacisz za szpulę.
	// Przykład: szpula PLA 1kg za 80 zł = 0.08 zł/g.
	pricePerGramPLN: 0.08,
};

// Gęstość filamentu (g/cm³) — używana do przeliczenia objętości z G-code na gramy.
// PLA ≈ 1.24, PETG ≈ 1.27, ABS ≈ 1.04, TPU ≈ 1.21
export const filamentDensityGPerCm3 = 1.24;

// Ścieżka do orca-slicer.exe
export const orcaSlicerPath = "D:\\OrcaSlicer\\orca-slicer.exe";

// PLACEHOLDER — profil testowy (Bambu Lab A1 + PLA Basic, wbudowany w OrcaSlicer).
// PODMIEŃ na ścieżki do swojego prawdziwego, wyeksportowanego profilu drukarki/filamentu,
// gdy będziesz gotowy testować z realnymi ustawieniami.
export const profile = {
	machine: "D:\\OrcaSlicer\\resources\\profiles\\BBL\\machine\\Bambu Lab A1 0.4 nozzle.json",
	process: "D:\\OrcaSlicer\\resources\\profiles\\BBL\\process\\0.20mm Standard @BBL A1.json",
	filament: "D:\\OrcaSlicer\\resources\\profiles\\BBL\\filament\\Bambu PLA Basic @BBL A1.json",
};
