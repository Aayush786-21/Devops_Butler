# config.py
import os
from dotenv import load_dotenv

load_dotenv() # This loads the variables from your .env file

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")