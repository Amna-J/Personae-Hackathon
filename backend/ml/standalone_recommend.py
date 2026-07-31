import argparse
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BACKEND_DIR.parent
SQLITE_DB = REPO_ROOT / "db.sqlite3"

load_dotenv(BACKEND_DIR / ".env")

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django
from django.conf import settings


def configure_database() -> str:
    """Use the configured DB when possible, but fall back to the repo SQLite file for local proof-of-concept."""
    default_db = settings.DATABASES.get("default", {})
    engine = default_db.get("ENGINE", "")

    if engine.endswith("postgresql"):
        print(f"Configured database engine: {engine}")
        print(f"Configured Postgres target: {default_db.get('NAME')}@{default_db.get('HOST')}:{default_db.get('PORT')}")
        try:
            from django.db import connection
            connection.ensure_connection()
            print("Postgres connection succeeded; using configured database.")
            return "postgresql"
        except Exception as exc:
            print(f"Postgres connection failed: {exc}")
            if SQLITE_DB.exists():
                print(f"Falling back to repository SQLite DB at {SQLITE_DB}")
                settings.DATABASES["default"] = {
                    "ENGINE": "django.db.backends.sqlite3",
                    "NAME": str(SQLITE_DB),
                }
                return "sqlite"
            raise

    if engine.endswith("sqlite3"):
        print(f"Using configured SQLite database: {default_db.get('NAME')}")
        return "sqlite"

    raise RuntimeError(f"Unsupported database engine: {engine}")


def ensure_schema() -> None:
    """Create tables in the selected DB if needed."""
    from django.core.management import call_command

    call_command("migrate", run_syncdb=True, verbosity=0)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the fuzzy recommendation engine outside the request/response cycle")
    parser.add_argument("--user-id", required=True, type=int)
    args = parser.parse_args()

    configure_database()
    django.setup()

    ensure_schema()

    from users.models import PersonaUser
    from ml.predictors.fuzzy_recommendation_engine import FuzzyRecommendationEngine

    user = PersonaUser.objects.filter(id=args.user_id).first()
    if user is None:
        raise SystemExit(f"No PersonaUser found with id={args.user_id}")

    skin_tone = user.skin_tone
    undertone = user.undertone
    body_type = user.body_type

    print(json.dumps({
        "user_id": user.id,
        "username": user.username,
        "skin_tone": skin_tone,
        "undertone": undertone,
        "body_type": body_type,
    }, indent=2, ensure_ascii=False))

    engine = FuzzyRecommendationEngine()
    result = engine.recommend(
        skin_tone=skin_tone,
        under_tone=undertone,
        body_shape=body_type,
    )

    print("\nRecommendationResult(JSON):")
    print(json.dumps(result.to_dict(), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
