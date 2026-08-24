// Konfiguracja wyceny i profilu drukarki.
// TO JEST MIEJSCE DO EDYCJI, GDY BĘDZIESZ CHCIAŁ ZMIENIĆ CENNIK
// albo podmienić profil na swoją prawdziwą, skalibrowaną drukarkę.

export const pricing = {
	// Cena minimalna za wydruk (zł) — niezależnie od tego, jak mały/szybki jest projekt.
	minPricePLN: 5,

	// Cena za godzinę pracy drukarki (zł/h) — pokrywa zużycie sprzętu, prąd, Twój czas.
	pricePerHourPLN: 3.3,
};

// Wspólny profil drukarki i procesu (jakość druku) — używany dla każdego materiału.
// PLACEHOLDER — profil testowy (Bambu Lab A1, ustawienia standardowe 0.2mm).
// PODMIEŃ na ścieżki do swojego prawdziwego, wyeksportowanego profilu, gdy będziesz
// gotowy testować z realnymi ustawieniami.
export const profile = {
	machine: "D:\\OrcaSlicer\\resources\\profiles\\BBL\\machine\\Bambu Lab A1 0.4 nozzle.json",
	process: "D:\\OrcaSlicer\\resources\\profiles\\BBL\\process\\0.20mm Standard @BBL A1.json",
};

// Materiały do wyboru — każdy ma własny profil filamentu, gęstość i cenę za gram.
// PLACEHOLDER — profile testowe (ogólne/Bambu, wbudowane w OrcaSlicer).
// Gęstości: PLA ≈ 1.24, PETG ≈ 1.27, ABS ≈ 1.04, TPU ≈ 1.21 (g/cm³)
export const materials = {
	PLA: {
		label: "PLA",
		filament: "D:\\OrcaSlicer\\resources\\profiles\\BBL\\filament\\Bambu PLA Basic @BBL A1.json",
		densityGPerCm3: 1.24,
		pricePerGramPLN: 0.08,
	},
	PETG: {
		label: "PETG",
		filament: "D:\\OrcaSlicer\\resources\\profiles\\BBL\\filament\\Generic PETG @BBL A1.json",
		densityGPerCm3: 1.27,
		pricePerGramPLN: 0.1,
	},
	ABS: {
		label: "ABS",
		filament: "D:\\OrcaSlicer\\resources\\profiles\\BBL\\filament\\Generic ABS @BBL A1.json",
		densityGPerCm3: 1.04,
		pricePerGramPLN: 0.09,
	},
	TPU: {
		label: "TPU",
		filament: "D:\\OrcaSlicer\\resources\\profiles\\BBL\\filament\\Generic TPU @BBL A1.json",
		densityGPerCm3: 1.21,
		pricePerGramPLN: 0.15,
	},
};

// Kolory do wyboru — czysto informacyjne, nie wpływają na wycenę ani slicing.
export const colors = ["Czarny", "Biały", "Szary", "Czerwony", "Niebieski", "Zielony", "Żółty"];

// Dopuszczalny zakres wypełnienia (%) — do walidacji wejścia od klienta.
export const infillRange = { min: 5, max: 100, default: 15 };

// Dopuszczalny zakres liczby sztuk — do walidacji wejścia od klienta.
export const quantityRange = { min: 1, max: 100, default: 1 };

// Ścieżka do orca-slicer.exe
export const orcaSlicerPath = "D:\\OrcaSlicer\\orca-slicer.exe";
