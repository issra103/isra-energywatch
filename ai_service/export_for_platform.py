import pandas as pd
import numpy as np
from pathlib import Path
import json

# ─── Configuration des chemins ───────────────────────────────────────────────
HERE = Path(__file__).parent
CLEANED_CSV_PATH = HERE.parent / "powerconsumption_cleaned.csv"
EXPORT_PATH = HERE.parent / "export_platform_data.json"

# Tarifs de l'énergie
TARIFFS = {
    'heure_pleine': 0.3,  # DT/kWh
    'heure_creuse': 0.3   # DT/kWh
}

def export_for_platform():
    """
    Exporte les données en format JSON pour la plateforme EnergyWatch
    """
    if not CLEANED_CSV_PATH.exists():
        print(f"❌ Erreur : Le fichier nettoyé {CLEANED_CSV_PATH} est introuvable")
        return None

    print(f"\n=== EXPORT DONNEES PLATEFORME ===")
    
    # 1. Chargement des données
    df = pd.read_csv(CLEANED_CSV_PATH)
    df['Datetime'] = pd.to_datetime(df['Datetime'])
    print(f"✓ Dataset chargé : {len(df)} lignes")
    
    # 2. Calcul des consommations totales et coûts par enregistrement
    df['Total_PowerConsumption'] = df[
        ['PowerConsumption_Zone1', 'PowerConsumption_Zone2', 'PowerConsumption_Zone3']
    ].sum(axis=1)
    
    # Calcul de l'énergie (kWh) - les données sont par pas de 10 minutes → / 1000 / 6
    df['Energy_est_kWh'] = df['Total_PowerConsumption'] / 1000 / 6
    df['Cost_est_TND'] = df['Energy_est_kWh'] * TARIFFS['heure_pleine']  # Tarif unique pour simplifier
    
    # 3. Agrégation mensuelle
    monthly_data = df.resample('ME', on='Datetime').agg({
        'PowerConsumption_Zone1': 'sum',
        'PowerConsumption_Zone2': 'sum',
        'PowerConsumption_Zone3': 'sum',
        'Total_PowerConsumption': 'sum',
        'Energy_est_kWh': 'sum',
        'Cost_est_TND': 'sum'
    }).reset_index()
    
    # 4. Calcul des détails par zone
    def get_monthly_details(row):
        # Déterminer la zone la plus consommatrice
        zones = {
            'Zone 1': row['PowerConsumption_Zone1'],
            'Zone 2': row['PowerConsumption_Zone2'],
            'Zone 3': row['PowerConsumption_Zone3']
        }
        top_zone = max(zones, key=zones.get)
        top_zone_value = zones[top_zone]
        
        # Calcul des coûts par zone
        cost_zone1 = (row['PowerConsumption_Zone1'] / 1000 / 6) * TARIFFS['heure_pleine']
        cost_zone2 = (row['PowerConsumption_Zone2'] / 1000 / 6) * TARIFFS['heure_pleine']
        cost_zone3 = (row['PowerConsumption_Zone3'] / 1000 / 6) * TARIFFS['heure_pleine']
        total_cost = cost_zone1 + cost_zone2 + cost_zone3
        
        # Calcul des pourcentages
        top_zone_share = (top_zone_value / row['Total_PowerConsumption']) * 100 if row['Total_PowerConsumption'] > 0 else 0
        top_cost_share = (
            (cost_zone1 if top_zone == 'Zone 1' else cost_zone2 if top_zone == 'Zone 2' else cost_zone3) / total_cost * 100 
            if total_cost > 0 else 0
        )
        
        return {
            'Datetime': row['Datetime'].strftime('%Y-%m-%d'),
            'PowerConsumption_Zone1': row['PowerConsumption_Zone1'],
            'PowerConsumption_Zone2': row['PowerConsumption_Zone2'],
            'PowerConsumption_Zone3': row['PowerConsumption_Zone3'],
            'Total_PowerConsumption': row['Total_PowerConsumption'],
            'Energy_est_kWh': row['Energy_est_kWh'],
            'Cost_est_TND': row['Cost_est_TND'],
            'Cost_Zone1_TND': cost_zone1,
            'Cost_Zone2_TND': cost_zone2,
            'Cost_Zone3_TND': cost_zone3,
            'TopZone': top_zone,
            'TopZoneValue': top_zone_value,
            'TopZoneSharePct': top_zone_share,
            'TopCostZone': top_zone,
            'TopCostValue_TND': cost_zone1 if top_zone == 'Zone 1' else cost_zone2 if top_zone == 'Zone 2' else cost_zone3,
            'TopCostSharePct': top_cost_share
        }
    
    monthly_records = monthly_data.apply(get_monthly_details, axis=1).tolist()
    
    # 5. Création de la structure finale JSON
    export_json = {
        'currency': 'TND',
        'tarif_tnd_per_kWh': TARIFFS['heure_pleine'],
        'monthly': monthly_records
    }
    
    # 6. Sauvegarde du fichier
    with open(EXPORT_PATH, 'w', encoding='utf-8') as f:
        json.dump(export_json, f, indent=4, ensure_ascii=False)
    
    print(f"✓ Export terminé !")
    print(f"📁 Fichier : {EXPORT_PATH}")
    print(f"📊 {len(monthly_records)} mois exportés")
    
    # Affiche le premier mois
    print(f"\n=== APERCU (premier mois) ===")
    print(json.dumps(monthly_records[0], indent=2, ensure_ascii=False))
    
    return export_json

if __name__ == "__main__":
    export_data = export_for_platform()
    
    # Demander à l'utilisateur le mois à afficher
    while True:
        try:
            choix = input("\n📅 Choisissez un mois à afficher (1 à 12, 'q' pour quitter) : ")
            
            if choix.lower() == 'q':
                print("👋 Au revoir !")
                break
            
            mois_num = int(choix)
            if 1 <= mois_num <= 12:
                idx = mois_num - 1
                if idx < len(export_data['monthly']):
                    print(f"\n=== MOIS {mois_num} ( {export_data['monthly'][idx]['Datetime']} ) ===")
                    print(json.dumps(export_data['monthly'][idx], indent=2, ensure_ascii=False))
                else:
                    print(f"⚠️ Mois {mois_num} non trouvé dans les données.")
            else:
                print("❌ Veuillez choisir un numéro entre 1 et 12.")
        except ValueError:
            print("❌ Veuillez entrer un numéro valide.")
