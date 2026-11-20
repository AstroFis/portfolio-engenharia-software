import pandas as pd
import os

folder = os.path.join(os.path.dirname(__file__), "CAPITULOS")
files = [f for f in os.listdir(folder) if f.endswith('.xlsx')]

for f in files:
    path = os.path.join(folder, f)
    try:
        df = pd.read_excel(path, nrows=5)
        print(f"--- Arquivo: {f} ---")
        print("Colunas:", df.columns.tolist())
        print("Primeira linha:", df.iloc[0].to_dict() if not df.empty else "Vazio")
        print("\n")
    except Exception as e:
        print(f"Erro ao ler {f}: {e}")
