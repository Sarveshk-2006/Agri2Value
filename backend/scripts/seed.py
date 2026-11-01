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
from app.database.models import (
    User,
    Farm,
    FarmResource,
    CropLot,
    CropLotEvent,
    Buyer,
    BuyerOffer,
    LogisticsProvider,
    ColdStorageFacility,
    ProcessingFacility,
)
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
        # 4. Seed Phase 3 Execution Network (Buyers & Infrastructure)
        b_res = await session.execute(select(Buyer).limit(1))
        if not b_res.scalars().first():
            print("[SEED] Seeding Smart Execution Network entities (Buyers & Infrastructure)...")
            # Buyers
            b1 = Buyer(
                company_name="Sahyadri Agro-Retail Hub",
                contact_person="Vikram Shinde (Procurement Lead)",
                phone="9822011223",
                email="procure@sahyadriagro.in",
                district="Nashik",
                state="Maharashtra",
                address="MIDC Ambad, Nashik 422010",
                buyer_type="DIRECT_RETAIL",
                service_radius_km=Decimal("80.0"),
                is_verified=False,
                verification_badge="DEMO_SIMULATION",
                rating=Decimal("4.8"),
                data_mode="demo",
            )
            b2 = Buyer(
                company_name="MahaFresh Wholesale Trading Corp",
                contact_person="Sunil Kulkarni",
                phone="9890123456",
                email="orders@mahafresh.com",
                district="Mumbai",
                state="Maharashtra",
                address="Sector 19, APMC Vashi Terminal, Navi Mumbai 400703",
                buyer_type="WHOLESALER",
                service_radius_km=Decimal("200.0"),
                is_verified=False,
                verification_badge="DEMO_SIMULATION",
                rating=Decimal("4.6"),
                data_mode="demo",
            )
            b3 = Buyer(
                company_name="Deccan Organic Exports Pvt Ltd",
                contact_person="Anita Deshmukh",
                phone="9850987654",
                email="procurement@deccanexports.com",
                district="Pune",
                state="Maharashtra",
                address="Bhosari Industrial Estate, Pune 411026",
                buyer_type="EXPORTER",
                service_radius_km=Decimal("150.0"),
                is_verified=False,
                verification_badge="DEMO_SIMULATION",
                rating=Decimal("4.9"),
                data_mode="demo",
            )
            session.add_all([b1, b2, b3])
            await session.flush()

            # Buyer Offers
            valid_dt = datetime(2026, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
            o1 = BuyerOffer(
                buyer_id=b1.id,
                commodity="Tomato",
                variety="Hybrid (Abhinav / Desi Red)",
                accepted_grades="A,B",
                min_quantity_kg=Decimal("1000"),
                max_quantity_kg=Decimal("25000"),
                offered_price_per_kg=Decimal("16.50"),
                price_unit="INR/kg",
                logistics_requirement="PICKUP_AT_FARM",
                payment_terms_days=3,
                valid_until=valid_dt,
                status="OPEN",
                data_mode="demo",
            )
            o2 = BuyerOffer(
                buyer_id=b2.id,
                commodity="Tomato",
                variety="Commercial Red",
                accepted_grades="A,B,C",
                min_quantity_kg=Decimal("2500"),
                max_quantity_kg=Decimal("50000"),
                offered_price_per_kg=Decimal("15.80"),
                price_unit="INR/kg",
                logistics_requirement="DELIVERY_TO_BUYER",
                payment_terms_days=7,
                valid_until=valid_dt,
                status="OPEN",
                data_mode="demo",
            )
            o3 = BuyerOffer(
                buyer_id=b3.id,
                commodity="Tomato",
                variety="Residue-free Table Grade",
                accepted_grades="A",
                min_quantity_kg=Decimal("2000"),
                max_quantity_kg=Decimal("15000"),
                offered_price_per_kg=Decimal("19.00"),
                price_unit="INR/kg",
                logistics_requirement="PICKUP_AT_FARM",
                payment_terms_days=2,
                valid_until=valid_dt,
                status="OPEN",
                data_mode="demo",
            )
            o4 = BuyerOffer(
                buyer_id=b1.id,
                commodity="Onion",
                variety="Garwa Red",
                accepted_grades="A,B",
                min_quantity_kg=Decimal("2000"),
                max_quantity_kg=Decimal("40000"),
                offered_price_per_kg=Decimal("18.50"),
                price_unit="INR/kg",
                logistics_requirement="PICKUP_AT_FARM",
                payment_terms_days=3,
                valid_until=valid_dt,
                status="OPEN",
                data_mode="demo",
            )
            session.add_all([o1, o2, o3, o4])

            # Logistics Providers
            l1 = LogisticsProvider(
                provider_name="Niphad Agri-Express Tempo Fleet",
                contact_phone="9823100111",
                vehicle_type="TEMPO_3T",
                capacity_kg=Decimal("3000"),
                current_available_capacity_kg=Decimal("3000"),
                base_district="Nashik",
                service_districts="Nashik,Pune,Ahmednagar",
                per_km_rate_per_kg=Decimal("0.0450"),
                minimum_fare=Decimal("800.00"),
                pricing_unit="INR/kg/km",
                is_temperature_controlled=False,
                availability_status="AVAILABLE",
                data_mode="demo",
            )
            l2 = LogisticsProvider(
                provider_name="Godavari Reefer & Chilled Transport",
                contact_phone="9823100222",
                vehicle_type="REEFER_VAN_4T",
                capacity_kg=Decimal("4000"),
                current_available_capacity_kg=Decimal("4000"),
                base_district="Nashik",
                service_districts="Nashik,Mumbai,Thane,Pune",
                per_km_rate_per_kg=Decimal("0.0650"),
                minimum_fare=Decimal("1800.00"),
                pricing_unit="INR/kg/km",
                is_temperature_controlled=True,
                availability_status="AVAILABLE",
                data_mode="demo",
            )
            l3 = LogisticsProvider(
                provider_name="Sahyadri Heavy Agri-Freight Carrier",
                contact_phone="9823100333",
                vehicle_type="MEDIUM_TRUCK_7T",
                capacity_kg=Decimal("7500"),
                current_available_capacity_kg=Decimal("7500"),
                base_district="Nashik",
                service_districts="Nashik,Vashi,Pune,Surat",
                per_km_rate_per_kg=Decimal("0.0380"),
                minimum_fare=Decimal("2500.00"),
                pricing_unit="INR/kg/km",
                is_temperature_controlled=False,
                availability_status="AVAILABLE",
                data_mode="demo",
            )
            session.add_all([l1, l2, l3])

            # Cold Storage Facilities
            c1 = ColdStorageFacility(
                facility_name="Niphad Multi-Commodity Cold Chain Hub",
                contact_phone="9823200111",
                location_district="Nashik",
                location_taluka="Niphad",
                compatible_commodities="Tomato,Onion,Grapes,Pomegranate",
                total_capacity_kg=Decimal("200000"),
                available_capacity_kg=Decimal("45000"),
                storage_rate_per_kg_per_month=Decimal("0.70"),
                pricing_unit="INR/kg/month",
                min_holding_days=7,
                max_holding_days=90,
                temperature_range_celsius="8°C - 12°C",
                humidity_range_pct="85% - 90%",
                availability_status="AVAILABLE",
                data_mode="demo",
            )
            c2 = ColdStorageFacility(
                facility_name="Dindori Agri-Cold Warehouse",
                contact_phone="9823200222",
                location_district="Nashik",
                location_taluka="Dindori",
                compatible_commodities="Tomato,Grapes,Vegetables",
                total_capacity_kg=Decimal("150000"),
                available_capacity_kg=Decimal("30000"),
                storage_rate_per_kg_per_month=Decimal("0.65"),
                pricing_unit="INR/kg/month",
                min_holding_days=7,
                max_holding_days=60,
                temperature_range_celsius="6°C - 10°C",
                humidity_range_pct="88% - 92%",
                availability_status="AVAILABLE",
                data_mode="demo",
            )
            session.add_all([c1, c2])

            # Processing Facilities
            p1 = ProcessingFacility(
                facility_name="Sahyadri Tomato Puree & Pulp Works",
                contact_phone="9823300111",
                facility_type="TOMATO_PUREE_PULP",
                accepted_commodities="Tomato",
                accepted_grades="A,B,C,processing_grade",
                daily_capacity_kg=Decimal("15000"),
                available_capacity_kg=Decimal("6000"),
                processing_charge_per_kg=Decimal("3.20"),
                pricing_unit="INR/input_kg",
                output_recovery_ratio=Decimal("0.2800"),
                output_product_name="Aseptic Tomato Puree (28-30 Brix)",
                location_district="Nashik",
                location_taluka="Dindori",
                availability_status="OPERATIONAL",
                data_mode="demo",
            )
            p2 = ProcessingFacility(
                facility_name="Pimpalgaon Onion & Vegetable Dehydration Unit",
                contact_phone="9823300222",
                facility_type="ONION_DEHYDRATION",
                accepted_commodities="Onion,Garlic",
                accepted_grades="A,B,C",
                daily_capacity_kg=Decimal("10000"),
                available_capacity_kg=Decimal("4500"),
                processing_charge_per_kg=Decimal("4.50"),
                pricing_unit="INR/input_kg",
                output_recovery_ratio=Decimal("0.1200"),
                output_product_name="Dehydrated Onion Flakes & Powder",
                location_district="Nashik",
                location_taluka="Niphad",
                availability_status="OPERATIONAL",
                data_mode="demo",
            )
            session.add_all([p1, p2])
            await session.commit()
            print("  [+] Created 3 Buyers, 4 Offers, 3 Logistics Providers, 2 Cold Stores, 2 Processing Units.")

        await session.commit()
        print("[SUCCESS] Seeding completed successfully!\n")


if __name__ == "__main__":
    asyncio.run(seed_data())
