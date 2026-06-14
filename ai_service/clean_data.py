import pandas as pd
import numpy as np
import os
from pathlib import Path

# ─── Configuration des chemins ───────────────────────────────────────────────
HERE = Path(__file__).parent
RAW_CSV_PATH = HERE.parent / "powerconsumption (12).csv"
CLEANED_CSV_PATH = HERE.parent / "powerconsumption_cleaned.csv"

def clean_dataset():
    """
    S1.3 : Nettoyage des données
    Suppression des enregistrements incorrects et préparation d'un dataset exploitable.
    """
    if not RAW_CSV_PATH.exists():
        print(f"❌ Erreur : Le fichier {RAW_CSV_PATH} est introuvable.")
        return None

    print("\n========== S1.3 - NETTOYAGE DES DONNÉES ==========")

    # 1. Chargement initial
    df = pd.read_csv(RAW_CSV_PATH)
    print(f"✓ Dataset chargé, shape initiale : {df.shape}")

    # 2. Conversion de la colonne Datetime
    df['Datetime'] = pd.to_datetime(df['Datetime'], errors='coerce')
    initial_count = len(df)
    df = df.dropna(subset=['Datetime'])
    print(f"✓ {initial_count - len(df)} lignes avec dates invalides supprimées")

    # 3. Suppression des doublons
    duplicates = df.duplicated().sum()
    df = df.drop_duplicates()
    print(f"✓ {duplicates} doublons supprimés")

    # 4. Gestion des valeurs manquantes
    missing_total = df.isna().sum().sum()
    if missing_total > 0:
        print(f"✓ {missing_total} valeurs manquantes trouvées")
        # Pour les valeurs restantes, forward fill + backward fill
        df = df.ffill().bfill()
    else:
        print("✓ Aucune valeur manquante à traiter")

    # 5. Sauvegarde du dataset nettoyé
    df.to_csv(CLEANED_CSV_PATH, index=False)
    print(f"\n✅ Dataset nettoyé sauvegardé : {CLEANED_CSV_PATH}")
    print(f"   Shape finale : {df.shape}")

    print("===========================================\n")
    return df

def data_quality_check():
    if not RAW_CSV_PATH.exists():
        print(f"❌ Erreur : Le fichier {RAW_CSV_PATH} est introuvable.")
        return

    df_raw = pd.read_csv(RAW_CSV_PATH)
    
    print("\n========== DATA QUALITY CHECK ==========")
    
    print(f"Shape avant nettoyage: {df_raw.shape}")
    df_raw['Datetime'] = pd.to_datetime(df_raw['Datetime'], errors='coerce')
    invalid_dates = df_raw['Datetime'].isna().sum()
    print(f"Dates invalides: {invalid_dates}")
    
    df = df_raw.dropna(subset=['Datetime'])
    df = df.drop_duplicates()
    
    print(f"\nShape après suppression dates invalides: {df.shape}")
    print(f"Doublons: {df_raw.duplicated().sum()}")
    print(f"Valeurs manquantes (total): {df.isna().sum().sum()}")
    
    print("\nValeurs manquantes par colonne:")
    print(df.isna().sum())
    
    print("\nTypes des colonnes:")
    print(df.dtypes)
    
    if not df.empty:
        start_date = df['Datetime'].min()
        end_date = df['Datetime'].max()
        print(f"\nPériode:")
        print(f"{start_date} -> {end_date}")
    
    print("========================================\n")

if __name__ == "__main__":
    clean_dataset()
