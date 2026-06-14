import pandas as pd
import numpy as np
from pathlib import Path

# ─── Configuration des chemins ───────────────────────────────────────────────
HERE = Path(__file__).parent
RAW_CSV_PATH = HERE.parent / "powerconsumption (12).csv"

def load_dataset():
    """
    S1.1 : Chargement du dataset
    Importation de powerconsumption.csv depuis le dataset Kaggle.
    """
    print("\n========== S1.1 - CHARGEMENT DU DATASET ==========")
    
    if not RAW_CSV_PATH.exists():
        print(f"❌ Erreur : Le fichier {RAW_CSV_PATH} est introuvable.")
        return None
    
    df = pd.read_csv(RAW_CSV_PATH)
    print(f"✅ Dataset chargé avec succès !")
    print(f"   Fichier : {RAW_CSV_PATH.name}")
    print(f"   Nombre de lignes : {df.shape[0]}")
    print(f"   Nombre de colonnes : {df.shape[1]}")
    
    print("===================================================\n")
    return df

def initial_analysis(df):
    """
    S1.2 : Analyse initiale
    Vérification de la structure générale, des colonnes disponibles, premières lignes.
    """
    if df is None or df.empty:
        print("❌ Dataset vide, impossible de faire l'analyse initiale.")
        return
    
    print("\n========== S1.2 - ANALYSE INITIALE ==========")
    
    # 1. Première ligne (head)
    print("\n--- 1. Aperçu des 5 premières lignes ---")
    print(df.head())
    
    # 2. Liste des colonnes
    print("\n--- 2. Liste des colonnes disponibles ---")
    for i, col in enumerate(df.columns, 1):
        print(f"   {i}. {col}")
    
    # 3. Types des colonnes et mémoire utilisée
    print("\n--- 3. Types des colonnes et mémoire ---")
    print(df.info(memory_usage='deep'))
    
    # 4. Statistiques descriptives
    print("\n--- 4. Statistiques descriptives ---")
    print(df.describe())
    
    # 5. Vérification des dates
    print("\n--- 5. Vérification des dates ---")
    if 'Datetime' in df.columns:
        df['Datetime'] = pd.to_datetime(df['Datetime'], errors='coerce')
        if not df.empty:
            start_date = df['Datetime'].min()
            end_date = df['Datetime'].max()
            print(f"   Période couverte : {start_date} -> {end_date}")
            print(f"   Nombre de dates valides : {df['Datetime'].count()}")
    
    print("===========================================\n")

if __name__ == "__main__":
    df = load_dataset()
    if df is not None:
        initial_analysis(df)
