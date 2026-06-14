"""Aggregate SQLAlchemy models."""
from .user import User
from .geo import Wilaya, Commune
from .hospital import Hospital, HospitalSpecialty, BedHistory
from .appointment import Appointment, DoctorSchedule
from .medical_record import MedicalRecord
from .equipment import Equipment, MaintenanceReport, RepairCenter
from .company import MaintenanceCompany, MaintenanceNeed, ServiceOffer, Subscription
from .donation import (
    BloodCampaign,
    BloodDonation,
    OrganDonation,
    FinancialDonation,
    DonationTracking,
)
from .complaint import Complaint, HospitalRating
from .community import CommunityQuestion, QuestionReply, ForumPost, ForumReply
from .notification import Notification
from .subscription_request import SubscriptionRequest

__all__ = [
    "User",
    "Wilaya",
    "Commune",
    "Hospital",
    "HospitalSpecialty",
    "BedHistory",
    "Appointment",
    "DoctorSchedule",
    "MedicalRecord",
    "Equipment",
    "MaintenanceReport",
    "RepairCenter",
    "MaintenanceCompany",
    "MaintenanceNeed",
    "ServiceOffer",
    "Subscription",
    "BloodCampaign",
    "BloodDonation",
    "OrganDonation",
    "FinancialDonation",
    "DonationTracking",
    "Complaint",
    "HospitalRating",
    "CommunityQuestion",
    "QuestionReply",
    "ForumPost",
    "ForumReply",
    "Notification",
]
