#!/usr/bin/env python3
"""
Key Wrapping Module - Hail Mary
Uses PBKDF2-HMAC-SHA256 (200k iterations) + AES-256-GCM for secure DEK wrapping.
Input/Output via stdin JSON for security (no sensitive data in process args).
"""
import sys
import json
import os
import base64

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.exceptions import InvalidTag

PBKDF2_ITERATIONS = 200_000
AAD = b"hail-mary-v1-key-wrap"  # Domain separation - ties ciphertext to this app


def derive_master_key(passphrase: str, salt: bytes) -> bytes:
    """Stretch passphrase into 256-bit key via PBKDF2-HMAC-SHA256."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=PBKDF2_ITERATIONS,
    )
    return kdf.derive(passphrase.encode("utf-8"))


def wrap_key(dek_hex: str, passphrase: str) -> dict:
    """Encrypt a DEK with a passphrase-derived key. Returns the wrapped key bundle."""
    dek = bytes.fromhex(dek_hex)
    salt  = os.urandom(16)  # 128-bit random salt
    nonce = os.urandom(12)  # 96-bit random nonce for AES-GCM

    master_key = derive_master_key(passphrase, salt)
    aesgcm = AESGCM(master_key)

    # AES-GCM: ciphertext includes 16-byte auth tag appended automatically
    ciphertext = aesgcm.encrypt(nonce, dek, AAD)

    return {
        "version": 1,
        "kdf": "PBKDF2-HMAC-SHA256",
        "iterations": PBKDF2_ITERATIONS,
        "salt":       base64.b64encode(salt).decode(),
        "nonce":      base64.b64encode(nonce).decode(),
        "ciphertext": base64.b64encode(ciphertext).decode(),
    }


def unwrap_key(wrapped: dict, passphrase: str) -> str:
    """Decrypt the DEK from a wrapped key bundle. Raises ValueError on wrong passphrase."""
    salt       = base64.b64decode(wrapped["salt"])
    nonce      = base64.b64decode(wrapped["nonce"])
    ciphertext = base64.b64decode(wrapped["ciphertext"])
    iterations = wrapped.get("iterations", PBKDF2_ITERATIONS)

    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=iterations,
    )
    master_key = kdf.derive(passphrase.encode("utf-8"))
    aesgcm = AESGCM(master_key)

    try:
        dek = aesgcm.decrypt(nonce, ciphertext, AAD)
        return dek.hex()
    except InvalidTag:
        # Wrong passphrase → authentication tag mismatch → fail BEFORE touching image
        raise ValueError("Authentication failed: master passphrase is incorrect.")


if __name__ == "__main__":
    try:
        payload = json.loads(sys.stdin.read())
        command = payload.get("command")

        if command == "wrap":
            result = wrap_key(payload["dek"], payload["passphrase"])
            print(json.dumps({"status": "success", "wrapped": result}))

        elif command == "unwrap":
            dek_hex = unwrap_key(payload["wrapped"], payload["passphrase"])
            print(json.dumps({"status": "success", "dek": dek_hex}))

        else:
            print(json.dumps({"status": "error", "message": "Unknown command"}))

    except ValueError as e:
        # Wrong passphrase - controlled failure
        print(json.dumps({"status": "error", "message": str(e)}))
    except Exception as e:
        print(json.dumps({"status": "error", "message": f"Unexpected error: {str(e)}"}))
