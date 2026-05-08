import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text

from app.models.database import Base


class SadirModel(Base):
    __tablename__ = "sadir"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # قيد الصادر
    qaid_number = Column(String(100), nullable=False, index=True)
    qaid_date = Column(DateTime, nullable=False)
    destination_administration = Column(String(255), nullable=True)

    # رقم وتاريخ الكتاب
    letter_number = Column(String(100), nullable=True)
    letter_date = Column(DateTime, nullable=True)

    # رقم وتاريخ الوارد رئيس مجلس الإدارة
    chairman_incoming_number = Column(String(100), nullable=True)
    chairman_incoming_date = Column(DateTime, nullable=True)

    # رقم وتاريخ العودة من رئيس مجلس الإدارة
    chairman_return_number = Column(String(100), nullable=True)
    chairman_return_date = Column(DateTime, nullable=True)

    # عدد المرفقات
    attachment_count = Column(Integer, default=0, nullable=True)

    # الموضوع
    subject = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)

    # المرسل إليهم
    sent_to1_name = Column(String(255), nullable=True)
    sent_to1_delivery_date = Column(DateTime, nullable=True)
    sent_to2_name = Column(String(255), nullable=True)
    sent_to2_delivery_date = Column(DateTime, nullable=True)
    sent_to3_name = Column(String(255), nullable=True)
    sent_to3_delivery_date = Column(DateTime, nullable=True)

    # تصنيف الجهة
    is_ministry = Column(Boolean, default=False, nullable=False)
    is_authority = Column(Boolean, default=False, nullable=False)
    is_other = Column(Boolean, default=False, nullable=False)
    other_details = Column(String(255), nullable=True)

    # ملف المرفق
    file_name = Column(String(255), nullable=True)
    file_path = Column(String(255), nullable=True)

    # متابعة
    needs_followup = Column(Boolean, default=False, nullable=False)
    followup_notes = Column(Text, nullable=True)
    followup_status = Column(String(50), default="waiting_reply", nullable=False)
    followup_file_name = Column(String(255), nullable=True)
    followup_file_path = Column(String(255), nullable=True)

    # توقيع
    signature_status = Column(String(50), default="pending", nullable=False)
    signature_date = Column(DateTime, nullable=True)

    # audit
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.datetime.utcnow)
    created_by = Column(Integer, nullable=True)
    created_by_name = Column(String(255), nullable=True)
