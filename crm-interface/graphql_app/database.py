import pymysql
import pandas as pd
from dotenv import load_dotenv
import os
from dateutil.parser import parse as dateutil_parse
from .queries import QUERIES

# Load environment variables
load_dotenv()

def get_connection():
    """Establish a connection to the database."""
    conn_str = {
        'host': os.getenv('HOST'),
        'database': os.getenv('DATABASE'),
        'user': os.getenv('USER'),
        'password': os.getenv('PASSWORD')
    }
    
    try:
        connection = pymysql.connect(
            host=conn_str['host'],
            user=conn_str['user'],
            password=conn_str['password'],
            database=conn_str['database']
        )
        return connection
    except pymysql.MySQLError as e:
        print(f"Error connecting to database: {e}")
        return None

def fetch_data(query):
    """Fetch data from the database."""
    connection = get_connection()
    try:
        return pd.read_sql_query(query, connection)
    finally:
        connection.close()

def is_iso_format_date(string):
    """Check if string is in ISO date format"""
    if string is None or isinstance(string, pd.Timestamp):
        return False
    try:
        if isinstance(string, str) and string.endswith('Z') and 'T' in string:
            dateutil_parse(string)
            return True
        elif isinstance(string, str) and len(string) >= 26 and string[10] == ' ' and string[19] == '.':
            dateutil_parse(string)
            return True
        else:
            return False
    except (ValueError, TypeError):
        return False

def format_dates(df, date_columns):
    """Format date columns in DataFrame"""
    for col in date_columns:
        df[col] = df[col].apply(lambda x: pd.to_datetime(x).strftime('%Y-%m-%d') if is_iso_format_date(x) else x)
        df[col] = df[col].fillna('None')
    return df

def fetch_and_process_data():
    """Main function to fetch and process all required data"""
    connection = get_connection()
    if connection is None:
        return None
        
    try:
        results = {}
        
        # Fetch data for each query
        for query_name, query in QUERIES.items():
            df = fetch_data(query, connection)
            
            # Apply date formatting if needed
            if query_name in ['summary', 'duration']:  # Add conditions for date formatting
                date_columns = []  # Specify date columns for each query type
                if query_name == 'summary':
                    date_columns = ['CreateAt']  # Example date columns
                elif query_name == 'duration':
                    date_columns = ['CreateAt']  # Example date columns
                
                if date_columns:
                    df = format_dates(df, date_columns)
            
            results[query_name] = df
        
        return results
        
    finally:
        connection.close()