import pandas as pd
import numpy as np
from pathlib import Path

# ─── Configuration des chemins ───────────────────────────────────────────────
HERE = Path(__file__).parent
CLEANED_CSV_PATH = HERE.parent / "powerconsumption_cleaned.csv"

# Tarifs (réutilisés)
TARIFFS = {
    'heure_pleine': 0.35,
    'heure_creuse': 0.15
}

def analyze_by_zone():
    """
    S1.6 : Analyse par zone
    Identification de la zone la plus énergivore et la plus coûteuse.
    """
    if not CLEANED_CSV_PATH.exists():
        print(f"❌ Erreur : Le fichier nettoyé {CLEANED_CSV_PATH} est introuvable.")
        return None
    
    # Chargement
    df = pd.read_csv(CLEANED_CSV_PATH)
    df['Datetime'] = pd.to_datetime(df['Datetime'])
    
    # 1. Détection des colonnes de zone
    zone_cols = [col for col in df.columns if 'Zone' in col and 'Power' in col]
    
    if not zone_cols:
        print("❌ Aucune colonne de zone trouvée.")
        return None
    
    print("=== DAILY ZONE KPI (head) ===")
    
    # 2. KPI Quotidien par Zone
    daily_zone_kpi = df.resample('D', on='Datetime').sum()[zone_cols]
    daily_zone_kpi['TotalConsumption'] = daily_zone_kpi.sum(axis=1)
    print(daily_zone_kpi.head().to_string())
    
    print("\n=== MONTHLY ZONE KPI (head) ===")
    
    # 3. KPI Mensuel par Zone
    monthly_zone_kpi = df.resample('ME', on='Datetime').sum()[zone_cols]
    monthly_zone_kpi['TotalConsumption'] = monthly_zone_kpi.sum(axis=1)
    print(monthly_zone_kpi.head().to_string())
    
    # 4. Sauvegarde
    daily_zone_kpi.to_csv(HERE.parent / "daily_zone_kpi.csv")
    monthly_zone_kpi.to_csv(HERE.parent / "monthly_zone_kpi.csv")
    
    print("\n✅ Zone KPI sauvegardés !")
    return df

if __name__ == "__main__":
    analyze_by_zone()
