import os
import firebase_admin
from firebase_admin import credentials, firestore as fs
from dotenv import load_dotenv

load_dotenv()

_cred_path = os.environ.get("FIREBASE_CREDENTIALS_PATH", "firebase-credentials.json")
cred = credentials.Certificate(_cred_path)
firebase_admin.initialize_app(cred)

db = fs.client()
