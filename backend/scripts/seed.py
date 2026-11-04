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
    IoTDevice,
    IoTTelemetryReading,
    IoTAlert,
    ExecutionRequest,
    ExecutionRequestEvent,
    DealAgreement,
    AgreementAmendment,
    DeliveryRecord,
    PaymentRecord,
    FarmerDispute,
    DisputeEvent,
    FarmerRiskAlert,
    TransactionAuditEvent,
)
from app.crop_lots.schemas import normalize_to_kg


async def seed_data(reset: bool = False):
    print("[SEED] Initializing Agri2Value database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print(f"[SEED] Seeding demo persona & scenario (reset={reset})...")
    async with AsyncSessionLocal() as session:
        phone = "9876543210"

        if reset:
            print("[RESET] Safely purging demo transactions for farmer Ramesh Patil (phone 9876543210)...")
            from sqlalchemy import delete
            from app.database.models import DecisionOption, DecisionRun

            result = await session.execute(select(User).where(User.phone == phone))
            farmer = result.scalar_one_or_none()
            if farmer:
                agr_sub = select(DealAgreement.id).where(DealAgreement.farmer_user_id == farmer.id)
                disp_sub = select(FarmerDispute.id).where(FarmerDispute.farmer_user_id == farmer.id)
                exec_sub = select(ExecutionRequest.id).where(ExecutionRequest.farmer_user_id == farmer.id)
                lot_sub = select(CropLot.id).where(CropLot.owner_user_id == farmer.id)
                farm_sub = select(Farm.id).where(Farm.owner_user_id == farmer.id)
                drun_sub = select(DecisionRun.id).where(DecisionRun.owner_user_id == farmer.id)

                await session.execute(delete(TransactionAuditEvent).where(TransactionAuditEvent.agreement_id.in_(agr_sub)))
                await session.execute(delete(DisputeEvent).where(DisputeEvent.dispute_id.in_(disp_sub)))
                await session.execute(delete(FarmerDispute).where(FarmerDispute.farmer_user_id == farmer.id))
                await session.execute(delete(FarmerRiskAlert).where(FarmerRiskAlert.farmer_user_id == farmer.id))
                await session.execute(delete(PaymentRecord).where(PaymentRecord.agreement_id.in_(agr_sub)))
                await session.execute(delete(DeliveryRecord).where(DeliveryRecord.agreement_id.in_(agr_sub)))
                await session.execute(delete(AgreementAmendment).where(AgreementAmendment.agreement_id.in_(agr_sub)))
                await session.execute(delete(DealAgreement).where(DealAgreement.farmer_user_id == farmer.id))
                await session.execute(delete(ExecutionRequestEvent).where(ExecutionRequestEvent.request_id.in_(exec_sub)))
                await session.execute(delete(ExecutionRequest).where(ExecutionRequest.farmer_user_id == farmer.id))
                await session.execute(delete(DecisionOption).where(DecisionOption.decision_run_id.in_(drun_sub)))
                await session.execute(delete(DecisionRun).where(DecisionRun.owner_user_id == farmer.id))
                await session.execute(delete(IoTAlert).where(IoTAlert.farm_id.in_(farm_sub)))
                await session.execute(delete(IoTTelemetryReading).where(IoTTelemetryReading.farm_id.in_(farm_sub)))
                await session.execute(delete(IoTDevice).where(IoTDevice.farmer_user_id == farmer.id))
                await session.execute(delete(CropLotEvent).where(CropLotEvent.crop_lot_id.in_(lot_sub)))
                await session.execute(delete(CropLot).where(CropLot.owner_user_id == farmer.id))
                await session.execute(delete(FarmResource).where(FarmResource.farm_id.in_(farm_sub)))
                await session.execute(delete(Farm).where(Farm.owner_user_id == farmer.id))
                await session.commit()
                print("  [OK] Demo records purged cleanly.")

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

        # 6. Seed default Virtual IoT Edge Node (Phase 4A)
        res_device = await session.execute(
            select(IoTDevice).where(IoTDevice.device_code == "ESP32-NIPHAD-NODE-01")
        )
        existing_device = res_device.scalar_one_or_none()
        if not existing_device:
            import hashlib
            import json
            raw_demo_key = "a2v_dev_demo_key_niphad_node_01"
            hashed_demo_key = hashlib.sha256(raw_demo_key.encode("utf-8")).hexdigest()

            now_utc = datetime.now(timezone.utc)
            dev = IoTDevice(
                device_code="ESP32-NIPHAD-NODE-01",
                device_name="Niphad Tomato Polyhouse Node 1",
                farm_id=farm.id,
                farmer_user_id=farmer.id,
                device_type="ESP32_AGRI_NODE",
                firmware_version="v1.2.0-sim",
                sensor_capabilities="SOIL_MOISTURE,AIR_TEMP,HUMIDITY,RAINFALL,LIGHT_INTENSITY,BATTERY_VOLTAGE",
                status="ACTIVE",
                data_source="SIMULATED",
                api_key_hash=hashed_demo_key,
                api_key_prefix="a2v_dev_demo...",
                last_seen_at=now_utc,
                last_reading_summary=json.dumps({
                    "SOIL_MOISTURE": {"value": 52.4, "unit": "%", "timestamp": now_utc.isoformat(), "source_type": "SIMULATED"},
                    "AIR_TEMP": {"value": 28.5, "unit": "°C", "timestamp": now_utc.isoformat(), "source_type": "SIMULATED"},
                    "HUMIDITY": {"value": 64.0, "unit": "%", "timestamp": now_utc.isoformat(), "source_type": "SIMULATED"},
                    "RAINFALL": {"value": 0.0, "unit": "mm", "timestamp": now_utc.isoformat(), "source_type": "SIMULATED"},
                }),
                created_at=now_utc,
                updated_at=now_utc,
            )
            session.add(dev)
            await session.commit()
            await session.refresh(dev)

            # Seed a few baseline readings
            r1 = IoTTelemetryReading(
                device_id=dev.id,
                farm_id=farm.id,
                reading_id="seed-reading-01",
                sensor_type="SOIL_MOISTURE",
                value=Decimal("52.40"),
                unit="%",
                device_timestamp=now_utc,
                server_ingested_at=now_utc,
                source_type="SIMULATED",
                quality_flag="VALID",
            )
            r2 = IoTTelemetryReading(
                device_id=dev.id,
                farm_id=farm.id,
                reading_id="seed-reading-02",
                sensor_type="AIR_TEMP",
                value=Decimal("28.50"),
                unit="°C",
                device_timestamp=now_utc,
                server_ingested_at=now_utc,
                source_type="SIMULATED",
                quality_flag="VALID",
            )
            r3 = IoTTelemetryReading(
                device_id=dev.id,
                farm_id=farm.id,
                reading_id="seed-reading-03",
                sensor_type="HUMIDITY",
                value=Decimal("64.00"),
                unit="%",
                device_timestamp=now_utc,
                server_ingested_at=now_utc,
                source_type="SIMULATED",
                quality_flag="VALID",
            )
            session.add_all([r1, r2, r3])
            await session.commit()
            print("  [+] Created Virtual IoT Node: ESP32-NIPHAD-NODE-01 with baseline readings.")

        # 7. Seed Phase 5: Farmer Protection & Deal Records
        res_agr = await session.execute(
            select(DealAgreement).where(DealAgreement.agreement_number == "AGR-2026-0001")
        )
        existing_agr = res_agr.scalar_one_or_none()
        if not existing_agr:
            now_utc = datetime.now(timezone.utc)
            # Find buyer & offer
            b_res = await session.execute(select(Buyer).where(Buyer.company_name == "Sahyadri Agro-Retail Hub"))
            buyer = b_res.scalar_one_or_none()
            buyer_id = buyer.id if buyer else None

            bo_res = await session.execute(select(BuyerOffer).where(BuyerOffer.buyer_id == buyer_id))
            buyer_offer = bo_res.scalars().first()
            buyer_offer_id = buyer_offer.id if buyer_offer else None

            # Seed or find execution request
            ex_res = await session.execute(
                select(ExecutionRequest).where(
                    ExecutionRequest.farmer_user_id == farmer.id,
                    ExecutionRequest.crop_lot_id == lot.id,
                )
            )
            exec_req = ex_res.scalars().first()
            if not exec_req:
                exec_req = ExecutionRequest(
                    crop_lot_id=lot.id,
                    farmer_user_id=farmer.id,
                    route_type="DIRECT_BUYER",
                    status="CONFIRMED",
                    buyer_id=buyer_id,
                    buyer_offer_id=buyer_offer_id,
                    requested_quantity_kg=Decimal("4000.0000"),
                    indicative_unit_price=Decimal("16.50"),
                    indicative_total_value=Decimal("66000.00"),
                    indicative_logistics_cost=Decimal("3500.00"),
                    indicative_storage_cost=Decimal("0.00"),
                    indicative_processing_cost=Decimal("0.00"),
                    indicative_net_payout=Decimal("62500.00"),
                    pickup_location="Patil Krishi Farm, Gate No. 42, Niphad, Nashik",
                    delivery_location="Sahyadri Agro Hub, MIDC Ambad, Nashik 422010",
                    scheduled_date=now_utc,
                    notes="Canonical Phase 5 demo execution order linked to commercial agreement.",
                    data_mode="demo",
                )
                session.add(exec_req)
                await session.flush()

                ev = ExecutionRequestEvent(
                    request_id=exec_req.id,
                    from_status="SUBMITTED",
                    to_status="CONFIRMED",
                    actor_role="BUYER",
                    actor_user_id=None,
                    message="Buyer accepted terms and confirmed procurement order.",
                )
                session.add(ev)
                await session.flush()

            # Create Deal Agreement
            agr = DealAgreement(
                agreement_number="AGR-2026-0001",
                execution_request_id=exec_req.id,
                farmer_user_id=farmer.id,
                farm_id=farm.id,
                crop_lot_id=lot.id,
                partner_type="BUYER",
                partner_id=buyer_id,
                partner_name="Sahyadri Agro-Retail Hub",
                partner_contact="Vikram Shinde (+91 98220 11223)",
                commodity="Tomato",
                variety="Abhinav (Hybrid Red)",
                quality_grade="Grade A",
                agreed_quantity_kg=Decimal("4000.0000"),
                quantity_unit="kg",
                agreed_unit_price=Decimal("16.50"),
                pricing_unit="INR/kg",
                gross_amount=Decimal("66000.00"),
                logistics_deduction=Decimal("3500.00"),
                processing_deduction=Decimal("0.00"),
                quality_deduction=Decimal("0.00"),
                other_deductions=Decimal("500.00"),
                total_deductions=Decimal("4000.00"),
                estimated_net_payout=Decimal("62000.00"),
                quality_requirements="Grade A firm red tomatoes, max 2% transit surface blemishes, minimum Brix 4.5.",
                pickup_location="Patil Krishi Farm, Gate No. 42, Niphad, Nashik",
                delivery_location="Sahyadri Agro Hub, MIDC Ambad, Nashik 422010",
                expected_delivery_date=now_utc,
                payment_terms_days=3,
                expected_payment_date=now_utc,
                status="IN_PROGRESS",
                version=1,
                is_latest=True,
                farmer_accepted_at=now_utc,
                partner_accepted_at=now_utc,
                farmer_notes="Confirmed for pickup with 50% advance upon partial delivery.",
                terms_acknowledged=True,
                data_mode="demo",
                created_at=now_utc,
                updated_at=now_utc,
            )
            session.add(agr)
            await session.flush()

            # Create initial partial delivery record
            del_rec = DeliveryRecord(
                delivery_number="DEL-2026-0001",
                agreement_id=agr.id,
                execution_request_id=exec_req.id,
                expected_quantity_kg=Decimal("4000.0000"),
                delivered_quantity_kg=Decimal("2000.0000"),
                accepted_quantity_kg=Decimal("2000.0000"),
                rejected_quantity_kg=Decimal("0.0000"),
                quantity_unit="kg",
                delivery_timestamp=now_utc,
                delivery_location="Sahyadri Agro Hub, MIDC Ambad, Nashik 422010",
                farmer_confirmed=True,
                farmer_confirmed_at=now_utc,
                partner_confirmed=True,
                partner_confirmed_at=now_utc,
                quality_notes="Batch 1: 2,000 kg received in plastic crates. Visual and Brix inspection passed Grade A.",
                vehicle_number="MH-15-EG-4412",
                driver_contact="Eknath Shinde (+91 97654 32100)",
                evidence_notes="Demo weighbridge slip #WB-NIPHAD-8821 (simulated delivery evidence record).",
                evidence_data_mode="SIMULATED_DEMO_PROOF",
                status="CONFIRMED",
                created_at=now_utc,
                updated_at=now_utc,
            )
            session.add(del_rec)
            await session.flush()

            # Create partial payment record
            pay_rec = PaymentRecord(
                payment_reference="PAY-2026-0001",
                agreement_id=agr.id,
                execution_request_id=exec_req.id,
                amount_due=Decimal("62000.00"),
                amount_paid=Decimal("31000.00"),
                payment_date=now_utc,
                due_date=now_utc,
                payment_method="BANK_TRANSFER",
                payment_status="PARTIALLY_PAID",
                payer_name="Sahyadri Agro-Retail Hub",
                payee_name="Ramesh Patil",
                transaction_reference_id="SIM-UTR-9912048821",
                notes="Advance tranche (50%) credited against Delivery Batch 1.",
                data_mode="SIMULATED",
                created_at=now_utc,
                updated_at=now_utc,
            )
            session.add(pay_rec)
            await session.flush()

            # Create sample FarmerRiskAlert
            alert = FarmerRiskAlert(
                farmer_user_id=farmer.id,
                agreement_id=agr.id,
                risk_type="PAYMENT_OVERDUE",
                severity="WARNING",
                trigger_evidence="Remaining balance of INR 31,000.00 pending past agreed 3-day payment window for agreement AGR-2026-0001.",
                explanation="Expected second installment date elapsed for accepted delivery batch. Payment status currently shows Partially Paid.",
                recommended_action="Send a payment status inquiry to Vikram Shinde (Sahyadri Agro-Retail Hub) or file a formal payment dispute record.",
                is_resolved=False,
                created_at=now_utc,
            )
            session.add(alert)

            # Audit events
            ae1 = TransactionAuditEvent(
                agreement_id=agr.id,
                event_type="AGREEMENT_CREATED",
                actor_role="FARMER",
                actor_name="Ramesh Patil",
                summary="Digital agreement AGR-2026-0001 created from confirmed execution request.",
                details_json=None,
                created_at=now_utc,
            )
            ae2 = TransactionAuditEvent(
                agreement_id=agr.id,
                event_type="AGREEMENT_ACCEPTED",
                actor_role="BUYER",
                actor_name="Sahyadri Agro-Retail Hub",
                summary="Agreement accepted with net payout INR 62,000.00 and 3-day payment terms.",
                details_json=None,
                created_at=now_utc,
            )
            ae3 = TransactionAuditEvent(
                agreement_id=agr.id,
                event_type="DELIVERY_LOGGED",
                actor_role="TRANSPORTER",
                actor_name="Eknath Shinde (MH-15-EG-4412)",
                summary="Delivery DEL-2026-0001 recorded: 2,000 kg accepted.",
                details_json=None,
                created_at=now_utc,
            )
            ae4 = TransactionAuditEvent(
                agreement_id=agr.id,
                event_type="PAYMENT_RECORDED",
                actor_role="BUYER",
                actor_name="Sahyadri Agro-Retail Hub",
                summary="Partial payment of INR 31,000.00 recorded via Bank Transfer (Ref: SIM-UTR-9912048821).",
                details_json=None,
                created_at=now_utc,
            )
            session.add_all([ae1, ae2, ae3, ae4])

            await session.commit()
            print("  [+] Created Deal Agreement AGR-2026-0001 with delivery, payment, risk alert, and audit trail.")

        await session.commit()
        print("[SUCCESS] Seeding completed successfully!\n")


if __name__ == "__main__":
    reset_flag = "--reset" in sys.argv
    asyncio.run(seed_data(reset=reset_flag))
