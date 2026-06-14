import pandas as pd
from pathlib import Path

# ─── Configuration ──────────────────────────────────────────────────────────
HERE = Path(__file__).parent
CLEANED_CSV = HERE.parent / "powerconsumption_cleaned.csv"

def generate_kpis():
    print("=== DAILY KPI (head) ===")
    
    # Chargement
    df = pd.read_csv(CLEANED_CSV)
    df['Datetime'] = pd.to_datetime(df['Datetime'])
    
    # 1. KPI Quotidien
    daily_kpi = df.resample('D', on='Datetime').sum()[
        ['PowerConsumption_Zone1', 'PowerConsumption_Zone2', 'PowerConsumption_Zone3']
    ]
    daily_kpi['TotalConsumption'] = daily_kpi.sum(axis=1)
    print(daily_kpi.head().to_string())
    
    print("\n=== MONTHLY KPI (head) ===")
    
    # 2. KPI Mensuel
    monthly_kpi = df.resample('ME', on='Datetime').sum()[
        ['PowerConsumption_Zone1', 'PowerConsumption_Zone2', 'PowerConsumption_Zone3']
    ]
    monthly_kpi['TotalConsumption'] = monthly_kpi.sum(axis=1)
    print(monthly_kpi.head().to_string())
    
    # Sauvegarde
    daily_kpi.to_csv(HERE.parent / "daily_kpi.csv")
    monthly_kpi.to_csv(HERE.parent / "monthly_kpi.csv")
    
    print("\n✅ KPI sauvegardés !")

if __name__ == "__main__":
    generate_kpis()
