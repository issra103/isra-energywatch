import pandas as pd
import numpy as np
from pathlib import Path

# ─── Configuration des chemins ───────────────────────────────────────────────
HERE = Path(__file__).parent
CLEANED_CSV_PATH = HERE.parent / "powerconsumption_cleaned.csv"

def deep_exploration():
    """
    S1.7 : Exploration approfondie
    Analyse détaillée du dataset après préparation pour interpréter tendances et caractéristiques.
    """
    if not CLEANED_CSV_PATH.exists():
        print(f"❌ Erreur : Le fichier nettoyé {CLEANED_CSV_PATH} est introuvable.")
        return None

    print("\n========== S1.7 - EXPLORATION APPROFONDIE ==========")
    
    df = pd.read_csv(CLEANED_CSV_PATH)
    df['Datetime'] = pd.to_datetime(df['Datetime'])
    print(f"✓ Dataset chargé, shape : {df.shape}")
    
    # 1. Extraction des features temporelles
    df['Année'] = df['Datetime'].dt.year
    df['Mois'] = df['Datetime'].dt.month
    df['Jour'] = df['Datetime'].dt.day
    df['Jour_Semaine'] = df['Datetime'].dt.dayofweek
    df['Heure'] = df['Datetime'].dt.hour
    df['Est_Weekend'] = (df['Jour_Semaine'] >= 5).astype(int)
    
    # 2. Identification des colonnes de consommation
    consumption_cols = [col for col in df.columns if 'Zone' in col and 'Power' in col]
    zone_names = [f"Zone {i+1}" for i in range(len(consumption_cols))]
    
    # 3. Analyse par période (Journalière)
    print("\n--- 1. ANALYSE PAR HEURE ---")
    hourly_analysis = df.groupby('Heure')[consumption_cols].mean()
    for i, col in enumerate(consumption_cols):
        peak_hour = hourly_analysis[col].idxmax()
        min_hour = hourly_analysis[col].idxmin()
        print(f"   {zone_names[i]} : Pic à {peak_hour:02d}h, Minimum à {min_hour:02d}h")
    
    # 4. Analyse par jour de semaine
    print("\n--- 2. ANALYSE PAR JOUR DE SEMAINE ---")
    weekday_names = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
    daily_analysis = df.groupby('Jour_Semaine')[consumption_cols].mean()
    for i, col in enumerate(consumption_cols):
        max_day = daily_analysis[col].idxmax()
        min_day = daily_analysis[col].idxmin()
        print(f"   {zone_names[i]} : Jour max = {weekday_names[max_day]}, Jour min = {weekday_names[min_day]}")
    
    # 5. Analyse weekend vs semaine
    print("\n--- 3. WEEKEND VS SEMAINE ---")
    weekend_avg = df[df['Est_Weekend'] == 1][consumption_cols].mean()
    weekday_avg = df[df['Est_Weekend'] == 0][consumption_cols].mean()
    
    for i, col in enumerate(consumption_cols):
        diff_pct = ((weekend_avg[col] - weekday_avg[col]) / weekday_avg[col]) * 100
        print(f"   {zone_names[i]} : Différence weekend : {diff_pct:.1f}%")
    
    # 6. Corrélation entre zones
    print("\n--- 4. CORRÉLATION ENTRE ZONES ---")
    if len(consumption_cols) > 1:
        correlation_matrix = df[consumption_cols].corr()
        print(correlation_matrix.to_string())
    
    # 7. Tendances mensuelles
    print("\n--- 5. TENDANCES MENSUELLES ---")
    monthly_avg = df.resample('ME', on='Datetime')[consumption_cols].mean()
    print(f"   3 mois les plus énergivores :")
    for i, col in enumerate(consumption_cols):
        top_months = monthly_avg[col].nlargest(3)
        print(f"   {zone_names[i]} : {', '.join([str(m.date()) for m in top_months.index])}")
    
    print("\n============================================\n")
    return df

if __name__ == "__main__":
    deep_exploration()
