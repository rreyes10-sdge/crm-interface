from .queries import QUERIES
import pandas as pd
import pymysql
import os
from dotenv import load_dotenv
from dateutil.parser import parse

# Load environment variables from .env file
load_dotenv()

def get_connection():
    """Establish database connection using environment variables"""
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

# working fetch without processing data
def fetch_data(query, connection, params=None):
    """Execute SQL query and return results as DataFrame"""
    try:
        df = pd.read_sql_query(query, connection, params=params)
        # print(f"query name: ", {query})
        return df
    except Exception as e:
        print(f"Error executing query: {e}")
        return pd.DataFrame()
    

def is_iso_format_date(string):
    """Check if string is in ISO date format"""
    if string is None or isinstance(string, pd.Timestamp):
        return False
    try:
        if isinstance(string, str) and string.endswith('Z') and 'T' in string:
            parse(string)
            return True
        elif isinstance(string, str) and len(string) >= 26 and string[10] == ' ' and string[19] == '.':
            parse(string)
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

def get_project_service_attributes(connection, projectId, serviceName):
    df = fetch_data(QUERIES['project-service-attributes'], connection, params={'projectId': projectId, 'serviceName': f"%{serviceName}%"})
    return df