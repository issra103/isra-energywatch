import sys
from pathlib import Path

# Ajout du chemin pour importer les modules
sys.path.insert(0, str(Path(__file__).parent))

from load_and_analyze import load_dataset, initial_analysis
from clean_data import clean_dataset
from normalize_standardize import normalize_and_standardize
from calculate_kpis import calculate_kpis
from zone_analysis import analyze_by_zone
from deep_exploration import deep_exploration

def run_full_pipeline():
    """
    Exécution complète du pipeline d'analyse du dataset
    de la section S1.1 à S1.7.
    """
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║    PIPELINE D'ANALYSE COMPLET ENERGYWATCH                    ║")
    print("╚══════════════════════════════════════════════════════════════╝")

    # Étape 1 : Chargement et analyse initiale (S1.1 et S1.2)
    df = load_dataset()
    if df is not None:
        initial_analysis(df)

    # Étape 2 : Nettoyage (S1.3)
    df_clean = clean_dataset()

    # Étape 3 : Normalisation (S1.4)
    if df_clean is not None:
        normalize_and_standardize()

    # Étape 4 : Calcul des KPI (S1.5)
    calculate_kpis()

    # Étape 5 : Analyse par zone (S1.6)
    analyze_by_zone()

    # Étape 6 : Exploration approfondie (S1.7)
    deep_exploration()

    print("\n✅ PIPELINE COMPLETÉ AVEC SUCCÈS !")
    print("   Tous les fichiers sont générés.")

if __name__ == "__main__":
    run_full_pipeline()
