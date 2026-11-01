# backend/scripts/seed.py
"""
Database Seeding Script for Agri2Value.

Seeds the canonical Phase 1 demo persona:
- Farmer: Ramesh Patil (Phone: 9876543210)
- Farm: Patil Krishi Farm (3.5 acres, Narayangaon, Pune, Maharashtra)
- Farm Resources: Storage shed, harvesting crates, seasonal labour
- Crop Lot: 4,000 kg Tomato (Abhinav variety, Grade A)
- Provenance tag: data_mode = 'demo'

Can be run standalone: python -m scripts.seed
"""
import asyncio
import os
import sys
from datetime import datetime, timezone
from decimal import Decimal

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.database.base import AsyncSessionLocal, Base, engine
from app.database.models import User, Farm, FarmResource, CropLot, CropLotEvent
from app.crop_lots.schemas import normalize_to_kg


async def seed_data():
    print("[SEED] Initializing Agri2Value database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("[SEED] Seeding demo persona & scenario...")
    async with AsyncSessionLocal() as session:
        # 1. Seed or find Farmer
        phone = "9876543210"
        result = await session.execute(select(User).where(User.phone == phone))
        farmer = result.scalar_one_or_none()

        if not farmer:
            farmer = User(
                full_name="Ramesh Patil",
                phone=phone,
                role="FARMER",
                preferred_language="en",
                is_active=True,
            )
            session.add(farmer)
            await session.flush()
            print(f"  [+] Created Farmer: {farmer.full_name} ({farmer.phone}) [ID: {farmer.id}]")
        else:
            print(f"  [i] Found existing Farmer: {farmer.full_name} [ID: {farmer.id}]")

        # 2. Seed or find Farm
        result = await session.execute(
            select(Farm).where(Farm.owner_user_id == farmer.id, Farm.farm_name == "Patil Krishi Farm")
        )
        farm = result.scalar_one_or_none()

        if not farm:
            farm = Farm(
                owner_user_id=farmer.id,
                farm_name="Patil Krishi Farm",
                state="Maharashtra",
                district="Nashik",
                village="Niphad",
                latitude=Decimal("20.0768"),
                longitude=Decimal("74.0375"),
                land_area=Decimal("3.5"),
                land_area_unit="acre",
                is_active=True,
            )
            session.add(farm)
            await session.flush()

            # Resources
            r1 = FarmResource(
                farm_id=farm.id,
                resource_type="storage",
                name="Shaded On-farm Shed (2 MT capacity)",
                quantity=Decimal("2000"),
                unit="kg",
                availability_status="available",
            )
            r2 = FarmResource(
                farm_id=farm.id,
                resource_type="equipment",
                name="Plastic Harvesting Crates (20 kg each)",
                quantity=Decimal("80"),
                unit="crates",
                availability_status="available",
            )
            r3 = FarmResource(
                farm_id=farm.id,
                resource_type="labour",
                name="Family + 2 Seasonal Labourers",
                quantity=Decimal("3"),
                unit="persons",
                availability_status="available",
            )
            session.add_all([r1, r2, r3])
            await session.flush()
            print(f"  [+] Created Farm: {farm.farm_name} with 3 resources [ID: {farm.id}]")
        else:
            # Non-destructively align geography to agreed pilot location: Nashik
            farm.district = "Nashik"
            farm.village = "Niphad"
            farm.latitude = Decimal("20.0768")
            farm.longitude = Decimal("74.0375")
            await session.flush()
            print(f"  [i] Found and aligned Farm geography to Nashik (Niphad) [ID: {farm.id}]")

        # 3. Seed or find Crop Lot
        result = await session.execute(
            select(CropLot).where(CropLot.farm_id == farm.id, CropLot.crop_name == "Tomato")
        )
        lot = result.scalar_one_or_none()

        if not lot:
            qty = Decimal("4000")
            qty_unit = "kg"
            qty_norm = normalize_to_kg(qty, qty_unit)

            lot = CropLot(
                farm_id=farm.id,
                owner_user_id=farmer.id,
                crop_name="Tomato",
                variety="Abhinav (Fresh Table & Processing)",
                quantity=qty,
                quantity_unit=qty_unit,
                quantity_kg_normalized=qty_norm,
                harvest_date=datetime.now(timezone.utc),
                quality_grade="A",
                status="DRAFT",
                data_mode="demo",
                notes="[DEMO_SEED] 4,000 kg Summer Tomato harvest ready for decision analysis. Grade A firm red tomatoes.",
            )
            session.add(lot)
            await session.flush()

            event = CropLotEvent(
                crop_lot_id=lot.id,
                event_type="CREATED",
                description="[DEMO_SEED] Initial demo crop lot seeded for Phase 1 demonstration.",
                actor_user_id=farmer.id,
            )
            session.add(event)
            await session.commit()
            print(f"  [+] Created Demo Crop Lot: {lot.crop_name} {lot.quantity}{lot.quantity_unit} [ID: {lot.id}]")
        else:
            print(f"  [i] Found existing Crop Lot: {lot.crop_name} [ID: {lot.id}]")

        await session.commit()
        print("[SUCCESS] Seeding completed successfully!\n")


if __name__ == "__main__":
    asyncio.run(seed_data())
