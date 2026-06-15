"""
Tests de synchronisation : vérifie que chaque valeur des enums Python
est bien présente dans PostgreSQL.

Ce test aurait détecté le bug immobiliers_divers / villa_maison AVANT
qu'une vraie annonce soit créée en production.
"""
import pytest
from app.enums import TypeBienEnum, DeviseEnum, CategorieEnum, EtatBienEnum
from tests.conftest import pg_enum_values


class TestTypeBienEnumSync:
    """Chaque valeur de TypeBienEnum doit exister dans PostgreSQL typebienenum."""

    def test_all_python_values_in_postgres(self, db):
        pg_vals = pg_enum_values(db, "typebienenum")
        missing = []
        for member in TypeBienEnum:
            if member.value not in pg_vals:
                missing.append(member.value)
        assert not missing, (
            f"Valeurs manquantes dans PostgreSQL typebienenum : {missing}\n"
            f"Valeurs PG actuelles : {sorted(pg_vals)}\n"
            "Lancez : python -m app.migrate_typebien_enum"
        )

    @pytest.mark.parametrize("val", [m.value for m in TypeBienEnum])
    def test_each_value_individually(self, db, val):
        """Chaque valeur testée séparément pour un rapport d'erreur précis."""
        pg_vals = pg_enum_values(db, "typebienenum")
        assert val in pg_vals, (
            f"'{val}' absent de PostgreSQL typebienenum. "
            "Relancez la migration."
        )


class TestDeviseEnumSync:
    """DeviseEnum (TND legacy, DT, EUR, USD) doit être en phase avec PostgreSQL."""

    def test_dt_in_postgres(self, db):
        pg_vals = pg_enum_values(db, "deviseenum")
        assert "DT" in pg_vals, "DT absent de PostgreSQL deviseenum"

    def test_tnd_legacy_in_postgres(self, db):
        """TND est conservé pour les anciennes lignes — doit rester dans PG."""
        pg_vals = pg_enum_values(db, "deviseenum")
        assert "TND" in pg_vals, (
            "TND absent de PostgreSQL deviseenum. "
            "Lancez : python -m app.migrate_add_tnd_enum"
        )

    def test_eur_usd_in_postgres(self, db):
        pg_vals = pg_enum_values(db, "deviseenum")
        assert "EUR" in pg_vals
        assert "USD" in pg_vals


class TestCategorieEnumSync:
    def test_all_values_in_postgres(self, db):
        pg_vals = pg_enum_values(db, "categorieenum")
        for member in CategorieEnum:
            assert member.value in pg_vals, (
                f"'{member.value}' absent de PostgreSQL categorieenum"
            )


class TestNoOrphanPostgresValues:
    """Vérifie qu'il n'y a pas de valeurs PG inconnues du Python (signal de drift inversé)."""

    def test_typebien_no_unknown_pg_values(self, db):
        pg_vals  = pg_enum_values(db, "typebienenum")
        py_vals  = {m.value for m in TypeBienEnum}
        unknown  = pg_vals - py_vals
        # On alerte mais sans faire échouer : des anciennes valeurs peuvent exister en base
        if unknown:
            import warnings
            warnings.warn(
                f"Valeurs PostgreSQL typebienenum inconnues du Python : {unknown}. "
                "Vérifiez si elles doivent être ajoutées à l'enum Python."
            )
