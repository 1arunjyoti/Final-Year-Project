import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
from datetime import timedelta
from sqlalchemy.orm import sessionmaker
from statsmodels.tsa.holtwinters import ExponentialSmoothing


def get_connection(url):
    engine = create_engine(url)
    Session = sessionmaker(bind=engine)
    return engine.connect()

def get_transaction_data(engine):
    query = """
    SELECT date, "sellingPrice"
    FROM transactions
    WHERE "UserId" = 1
    """
    df = pd.read_sql(text(query), engine)
    df['date'] = pd.to_datetime(df['date'])
    df = df.groupby('date').sum().reset_index()
    df = df.set_index('date').resample('D').sum().fillna(0)
    return df

def forecast_sales(df):
    model = ExponentialSmoothing(df['sellingPrice'], seasonal='add', seasonal_periods=30)
    fit = model.fit()
    forecast = fit.forecast(180)

    next_month = forecast[:30].sum()
    next_quarter = forecast[:90].sum()
    next_6_months = forecast[:180].sum()

    print(next_month)
    print(next_quarter)
    print(next_6_months)

    return {
        "next_month": {"sales": round(next_month), "confidence": 90},
        "next_quarter": {"sales": round(next_quarter), "confidence": 85},
        "next_6_months": {"sales": round(next_6_months), "confidence": 80}
    }

def visualize(df):
    import matplotlib.pyplot as plt
    import seaborn as sns

    sns.set(style="whitegrid")
    plt.figure(figsize=(12, 6))
    plt.plot(df.index, df['sellingPrice'], label='Sales')
    plt.title("Daily Sales Over Time")
    plt.xlabel("Date")
    plt.ylabel("Total Sales")
    plt.legend()
    plt.tight_layout()
    plt.savefig("static/forecast_plot.png")
