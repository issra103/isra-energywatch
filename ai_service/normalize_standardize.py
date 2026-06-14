import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.preprocessing import StandardScaler, MinMaxScaler

# ─── Configuration des chemins ───────────────────────────────────────────────
HERE = Path(__file__).parent
CLEANED_CSV_PATH = HERE.parent / "powerconsumption_cleaned.csv"
NORMALIZED_CSV_PATH = HERE.parent / "powerconsumption_normalized.csv"

def normalize_and_standardize():
    """
    S1.4 : Normalisation et standardisation
    Application des transformations nécessaires pour homogénéiser les données.
    """
    if not CLEANED_CSV_PATH.exists():
        print(f"❌ Erreur : Le fichier nettoyé {CLEANED_CSV_PATH} est introuvable.")
        print("   Veuillez d'abord exécuter clean_data.py.")
        return None

    print("\n========== S1.4 - NORMALISATION ET STANDARDISATION ==========")
    
    # 1. Chargement du dataset nettoyé
    df = pd.read_csv(CLEANED_CSV_PATH)
    df['Datetime'] = pd.to_datetime(df['Datetime'])
    print(f"✓ Dataset chargé, shape : {df.shape}")
    
    # 2. Identification des colonnes numériques
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    # Retrait des colonnes de base
    for col in ['DateTime', 'datetime', 'Datetime', 'Date', 'Time']:
        if col in numeric_cols:
            numeric_cols.remove(col)
    
    print(f"✓ {len(numeric_cols)} colonnes numériques à traiter")
    
    # 3. Standardisation (Z-score) pour les colonnes météo
    weather_cols = [col for col in numeric_cols if any(keyword in col.lower() for keyword in ['temp', 'humid', 'wind', 'pressure', 'precip', 'diffuse', 'general'])]
    
    if weather_cols:
        scaler_standard = StandardScaler()
        df_standardized = df.copy()
        df_standardized[weather_cols] = scaler_standard.fit_transform(df[weather_cols])
        print(f"✓ Standardisation (Z-score) appliquée sur : {len(weather_cols)} colonnes météo")
    
    # 4. Normalisation Min-Max pour les consommations
    consumption_cols = [col for col in numeric_cols if 'power' in col.lower() or 'consumption' in col.lower()]
    
    if consumption_cols:
        scaler_minmax = MinMaxScaler()
        df_normalized = df_standardized.copy() if weather_cols else df.copy()
        df_normalized[consumption_cols] = scaler_minmax.fit_transform(df[consumption_cols])
        print(f"✓ Normalisation Min-Max appliquée sur : {len(consumption_cols)} colonnes consommation")
    else:
        df_normalized = df
    
    # 5. Sauvegarde
    df_normalized.to_csv(NORMALIZED_CSV_PATH, index=False)
    print(f"\n✅ Dataset normalisé sauvegardé : {NORMALIZED_CSV_PATH}")
    
    print("=============================================================\n")
    return df_normalized

if __name__ == "__main__":
    normalize_and_standardize()
