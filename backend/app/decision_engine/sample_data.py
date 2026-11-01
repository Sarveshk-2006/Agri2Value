"""
Curated Pilot Scenarios and Sample Market Parameters for Nashik Pilot.

Geography: Niphad / Pimpalgaon Baswant, Nashik, Maharashtra.
Crop: Tomato (Abhinav / Hybrid).

ALL DATA IN THIS MODULE IS EXPLICITLY TAGGED AS SAMPLE / ILLUSTRATIVE DATA.
NOT LIVE MARKET GUARANTEES.
"""
from decimal import Decimal
from typing import Dict, Any


PILOT_SAMPLE_DATA = {
    "mandi": {
        "mandi_name": "APMC Pimpalgaon (Nashik)",
        "rate_per_kg": Decimal("14.00"),
        "distance_km": Decimal("25"),
        "transport_rate_per_kg_km": Decimal("0.045"),
        "apmc_cess_pct": Decimal("0.0105"),
        "commission_pct": Decimal("0.0400"),
        "handling_per_kg": Decimal("0.35"),
        "crates_handling_per_kg": Decimal("0.25"),
        "sorting_loss_pct": Decimal("0.02"),
        "data_source": "APMC Pimpalgaon Daily Market Yard Bulletin (Sample Data)",
        "data_timestamp": "2026-11-01T08:30:00Z",
    },
    "direct_buyer": {
        "buyer_name": "Sahyadri Farms Contract (Mohadi Hub)",
        "offer_price_per_kg": Decimal("18.50"),
        "min_quantity_kg": Decimal("2000"),
        "max_capacity_kg": Decimal("6000"),
        "required_grade": "A",
        "distance_km": Decimal("32"),
        "transport_cost_per_kg": Decimal("1.25"),
        "quality_sorting_loss_pct": Decimal("0.04"),
        "crate_sanitization_per_kg": Decimal("0.35"),
        "handling_labour_per_kg": Decimal("0.30"),
        "platform_service_fee_pct": Decimal("0.015"),
        "payment_terms_days": 3,
        "data_source": "Sahyadri Farmer Producer Co. Purchase Quote (Sample Data)",
        "data_timestamp": "2026-11-01T09:00:00Z",
    },
    "processing": {
        "facility_name": "Nashik Agro Cluster Food Park (Dindori Hub)",
        "puree_wholesale_price_per_kg": Decimal("72.00"),
        "conversion_yield": Decimal("0.28"),
        "processing_charge_per_kg_raw": Decimal("4.50"),
        "packaging_cost_per_kg_output": Decimal("6.00"),
        "transport_to_facility_per_kg_raw": Decimal("0.85"),
        "output_delivery_per_kg_output": Decimal("2.50"),
        "quality_testing_fee_total": Decimal("1500.00"),
        "processing_loss_pct": Decimal("0.02"),
        "min_batch_kg": Decimal("1000"),
        "max_batch_kg": Decimal("10000"),
        "facility_operational": True,
        "yield_known": True,
        "output_buyer_identified": True,
        "data_source": "Nashik Food Processing Cluster Service Matrix (Sample Data)",
        "data_timestamp": "2026-11-01T09:30:00Z",
    },
    "storage": {
        "facility_name": "Nashik Cold Chain Logistics Hub",
        "holding_days": 21,
        "projected_future_price_per_kg": Decimal("19.50"),
        "cold_storage_rate_per_kg_month": Decimal("1.80"),
        "spoilage_loss_pct": Decimal("0.05"),
        "inbound_transport_per_kg": Decimal("0.60"),
        "outbound_transport_per_kg": Decimal("0.90"),
        "cold_handling_labour_per_kg": Decimal("0.30"),
        "cold_storage_available": True,
        "data_source": "Nashik Cold Chain Hub Tariff (Sample Data)",
        "data_timestamp": "2026-11-01T10:00:00Z",
    },
    "group_selling": {
        "group_name": "Niphad Tomato Farmers Collective (FPO Pool)",
        "destination_market": "Vashi Wholesale Terminal (Navi Mumbai)",
        "target_price_per_kg": Decimal("17.50"),
        "group_lot_data_exists": False,  # Default: requires active pool registration
        "active_pool_quantity_kg": None,
        "total_truck_freight_inr": Decimal("9500.00"),
        "fpo_handling_per_kg": Decimal("0.30"),
        "transit_wastage_pct": Decimal("0.025"),
        "data_source": "MahaFPC Collective Dispatch Registry (Sample Data)",
        "data_timestamp": "2026-11-01T10:00:00Z",
    },
}
