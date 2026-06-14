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

    print("\n========== S1.6 - ANALYSE PAR ZONE ==========")
    
    df = pd.read_csv(CLEANED_CSV_PATH)
    df['Datetime'] = pd.to_datetime(df['Datetime'])
    print(f"✓ Dataset chargé, shape : {df.shape}")
    
    # 1. Détection des colonnes de zone
    zone_cols = [col for col in df.columns if 'Zone' in col and 'Power' in col]
    
    if not zone_cols:
        print("❌ Aucune colonne de zone trouvée.")
        return None
    
    zone_names = [f"Zone {i+1}" for i in range(len(zone_cols))]
    print(f"✓ {len(zone_cols)} zones détectées : {zone_names}")
    
    # 2. Calcul de l'énergie par zone (Wh → kWh)
    for i, col in enumerate(zone_cols):
        df[f'{zone_names[i]}_Energy_kWh'] = df[col] / 1000
    
    # 3. Calcul des tarifs par heure
    df['Heure'] = df['Datetime'].dt.hour
    df['Is_Heure_Pleine'] = ((df['Heure'] >= 8) & (df['Heure'] < 20)).astype(int)
    df['Tarif_kWh'] = np.where(df['Is_Heure_Pleine'], TARIFFS['heure_pleine'], TARIFFS['heure_creuse'])
    
    # 4. Calcul des coûts par zone
    for i, col in enumerate(zone_cols):
        df[f'{zone_names[i]}_Cost_DT'] = df[f'{zone_names[i]}_Energy_kWh'] * df['Tarif_kWh']
    
    # 5. Agrégation des résultats par zone
    zone_results = []
    for i, col in enumerate(zone_cols):
        total_energy = df[f'{zone_names[i]}_Energy_kWh'].sum()
        total_cost = df[f'{zone_names[i]}_Cost_DT'].sum()
        avg_power = df[col].mean()
        max_power = df[col].max()
        
        zone_results.append({
            'Zone': zone_names[i],
            'Total_Energy_kWh': total_energy,
            'Total_Cost_DT': total_cost,
            'Avg_Power_W': avg_power,
            'Max_Power_W': max_power
        })
    
    results_df = pd.DataFrame(zone_results)
    
    # 6. Identification des zones critiques
    most_energy_zone = results_df.loc[results_df['Total_Energy_kWh'].idxmax(), 'Zone']
    most_costly_zone = results_df.loc[results_df['Total_Cost_DT'].idxmax(), 'Zone']
    
    print(f"\n📊 RÉSULTATS PAR ZONE :")
    print(results_df.to_string(index=False))
    
    print(f"\n🏆 ZONES CRITIQUES :")
    print(f"   Zone la plus énergivore : {most_energy_zone}")
    print(f"   Zone la plus coûteuse : {most_costly_zone}")
    
    # 7. Sauvegarde des résultats
    results_df.to_csv(HERE.parent / "zone_analysis_results.csv", index=False)
    print(f"\n✅ Résultats sauvegardés : zone_analysis_results.csv")
    
    print("==========================================\n")
    return results_df

if __name__ == "__main__":
    analyze_by_zone()
