import pandas as pd
import numpy as np
from pathlib import Path

# ─── Configuration des chemins ───────────────────────────────────────────────
HERE = Path(__file__).parent
CLEANED_CSV_PATH = HERE.parent / "powerconsumption_cleaned.csv"
KPI_RESULTS_PATH = HERE.parent / "kpi_results.csv"

# Tarifs de l'énergie (exemple en DT/kWh - à adapter selon tarif réel)
TARIFFS = {
    'heure_pleine': 0.250,  # DT/kWh (selon backend)
    'heure_creuse': 0.150   # DT/kWh (selon backend)
}

def calculate_kpis():
    """
    S1.5 : Calcul des KPI
    Calcul de la consommation totale, énergie estimée et coût énergétique estimé.
    """
    if not CLEANED_CSV_PATH.exists():
        print(f"❌ Erreur : Le fichier nettoyé {CLEANED_CSV_PATH} est introuvable.")
        return None

    print("\n========== S1.5 - CALCUL DES KPI ==========")
    
    # 1. Chargement des données
    df = pd.read_csv(CLEANED_CSV_PATH)
    df['Datetime'] = pd.to_datetime(df['Datetime'])
    print(f"✓ Dataset chargé, shape : {df.shape}")
    
    # 2. Identification des colonnes de consommation
    consumption_cols = [col for col in df.columns if 'power' in col.lower() or 'consumption' in col.lower()]
    
    if not consumption_cols:
        print("❌ Aucune colonne de consommation trouvée.")
        return None
    
    print(f"✓ {len(consumption_cols)} colonnes de consommation trouvées")
    
    # 3. Calcul de l'énergie (Wh → kWh)
    # Dans le dataset, la consommation est souvent en Watts
    df['Total_PowerConsumption'] = df[consumption_cols].sum(axis=1)
    df['Energy_kWh'] = df['Total_PowerConsumption'] / 1000
    
    # 4. Détection des heures pleines vs creuses (exemple : 08h-20h = pleines)
    df['Heure'] = df['Datetime'].dt.hour
    df['Is_Heure_Pleine'] = ((df['Heure'] >= 8) & (df['Heure'] < 20)).astype(int)
    df['Tarif_kWh'] = np.where(df['Is_Heure_Pleine'], TARIFFS['heure_pleine'], TARIFFS['heure_creuse'])
    
    # 5. Calcul du coût
    df['Cost_DT'] = df['Energy_kWh'] * df['Tarif_kWh']
    
    # 6. Agrégation des KPI globaux
    total_energy = df['Energy_kWh'].sum()
    total_cost = df['Cost_DT'].sum()
    avg_power = df['Total_PowerConsumption'].mean()
    max_power = df['Total_PowerConsumption'].max()
    
    print(f"\n📊 KPI PRINCIPAUX :")
    print(f"   Énergie TOTALE : {total_energy:.2f} kWh")
    print(f"   Coût TOTAL estimé : {total_cost:.2f} DT")
    print(f"   Puissance MOYENNE : {avg_power:.2f} W")
    print(f"   Puissance MAXIMUM : {max_power:.2f} W")
    
    # Affichage mensuel
    print(f"\n=== MONTHLY COST EST (TND) (head) ===")
    df['Datetime'] = pd.to_datetime(df['Datetime'])
    monthly_data = df.resample('ME', on='Datetime').agg({
        'Energy_kWh': 'sum',
        'Cost_DT': 'sum'
    }).rename(columns={
        'Energy_kWh': 'Energy_est_kWh',
        'Cost_DT': 'Cost_est_TND'
    })
    print(monthly_data.head().to_string())
    
    # Affichage du tarif appliqué
    print(f"\nTarif Heure Pleine: {TARIFFS['heure_pleine']:.3f} TND/kWh")
    print(f"Tarif Heure Creuse: {TARIFFS['heure_creuse']:.3f} TND/kWh")
    
    # 7. Sauvegarde des résultats
    kpi_data = {
        'KPI': ['Total_Energy_kWh', 'Total_Cost_DT', 'Avg_Power_W', 'Max_Power_W'],
        'Value': [total_energy, total_cost, avg_power, max_power]
    }
    pd.DataFrame(kpi_data).to_csv(KPI_RESULTS_PATH, index=False)
    print(f"\n✅ KPI sauvegardés : {KPI_RESULTS_PATH}")
    
    print("========================================\n")
    return df

if __name__ == "__main__":
    calculate_kpis()
