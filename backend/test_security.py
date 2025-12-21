# app/test_security.py
from app.utils.security import hash_password, verify_password

def test_password():
    password = "MotDePasse123!"
    hashed = hash_password(password)
    print(f"Mot de passe haché : {hashed}")

    assert verify_password(password, hashed), "Le mot de passe ne correspond pas !"
    print("Vérification du mot de passe réussie !")

if __name__ == "__main__":
    test_password()