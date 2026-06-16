#!/usr/bin/env python3
"""Create admin user in Supabase (production setup).

Usage:
  export SUPABASE_URL=https://xxx.supabase.co
  export SUPABASE_SERVICE_KEY=your-service-role-key
  python scripts/create-admin-user.py support@docuforge.pro

Optional password via env ADMIN_PASSWORD, otherwise one is generated.
"""
from __future__ import annotations

import os
import secrets
import string
import sys

import httpx


def generate_password(length: int = 16) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python scripts/create-admin-user.py <email>")
        sys.exit(1)

    email = sys.argv[1].strip().lower()
    password = os.environ.get("ADMIN_PASSWORD") or generate_password()
    supabase_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    service_key = os.environ.get("SUPABASE_SERVICE_KEY", "")

    if not supabase_url or not service_key:
        print("Error: Set SUPABASE_URL and SUPABASE_SERVICE_KEY")
        sys.exit(1)

    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }

    # Create auth user
    r = httpx.post(
        f"{supabase_url}/auth/v1/admin/users",
        headers=headers,
        json={"email": email, "password": password, "email_confirm": True},
        timeout=30,
    )
    if r.status_code not in (200, 201):
        print(f"Auth error ({r.status_code}): {r.text}")
        sys.exit(1)

    user_id = r.json()["id"]
    print(f"Created auth user: {user_id}")

    # Grant admin in public.users
    r2 = httpx.patch(
        f"{supabase_url}/rest/v1/users?id=eq.{user_id}",
        headers={**headers, "Prefer": "return=minimal"},
        json={"is_admin": True, "email": email},
        timeout=30,
    )
    if r2.status_code not in (200, 204):
        # User row may be created by trigger — try upsert via RPC or insert
        r3 = httpx.post(
            f"{supabase_url}/rest/v1/users",
            headers={**headers, "Prefer": "resolution=merge-duplicates"},
            json={"id": user_id, "email": email, "is_admin": True},
            timeout=30,
        )
        if r3.status_code not in (200, 201):
            print(f"DB error: {r2.text} / {r3.text}")
            print(f"\nRun manually in Supabase SQL:")
            print(f"  UPDATE public.users SET is_admin = true WHERE email = '{email}';")
            sys.exit(1)

    print("\n=== Admin credentials ===")
    print(f"Email:    {email}")
    print(f"Password: {password}")
    print("\nLogin at: https://docuforge.pro/auth/login")
    print("Admin at: https://docuforge.pro/admin")


if __name__ == "__main__":
    main()
