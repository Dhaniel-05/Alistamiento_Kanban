# src/scripts/db_connection.py

import mysql.connector
# **CORREGIR:** de dontev a dotenv
from dotenv import load_dotenv 
import os

load_dotenv()

db = mysql.connector.connect(
    host=os.getenv("DB_HOST"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database=os.getenv("DB_NAME")
)

cursor = db.cursor()