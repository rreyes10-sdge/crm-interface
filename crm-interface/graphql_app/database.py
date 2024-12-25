import pymysql
import pandas as pd
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

def get_connection():
    """Establish a connection to the database."""
    return pymysql.connect(
        host=os.getenv('HOST'),
        user=os.getenv('USER'),
        password=os.getenv('PASSWORD'),
        database=os.getenv('DATABASE'),
        connect_timeout=20 
    )

def fetch_data(query):
    """Fetch data from the database."""
    connection = get_connection()
    try:
        return pd.read_sql_query(query, connection)
    finally:
        connection.close()