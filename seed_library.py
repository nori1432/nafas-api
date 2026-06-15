"""One-shot library seed — run with: python seed_library.py"""
import os, sys
sys.stdout.reconfigure(encoding='utf-8')

os.environ.setdefault(
    "NAFAS_DB_URI",
    "mysql+pymysql://avnadmin:AVNS_MHvvShYYDd29UIL9HgT@mysql-142985cc-nafas.b.aivencloud.com:17641/defaultdb",
)

from app import create_app, db
from app.models.library import MedicalBook

FREE_BOOKS = [
    {
        "title": "تشريح الجسم البشري — OpenStax",
        "description": "كتاب مفصّل ومصوَّر يغطي تشريح وفسيولوجيا جميع أجهزة جسم الإنسان. صادر عن OpenStax بترخيص Creative Commons مفتوح للجميع.",
        "cover_image": "https://assets.openstax.org/oscms-prodcms/media/documents/anatomy-physiology-cover_1.jpg",
        "file_url": "https://assets.openstax.org/oscms-prodcms/media/documents/AnatPhys2e-BOOK-ADA.pdf",
    },
    {
        "title": "علم الأحياء الدقيقة الطبية — OpenStax",
        "description": "مرجع شامل في علم الأحياء الدقيقة يتناول البكتيريا والفيروسات والفطريات والطفيليات وأسس المناعة. مجاني بترخيص CC.",
        "cover_image": "https://assets.openstax.org/oscms-prodcms/media/documents/microbiology-cover_1.jpg",
        "file_url": "https://assets.openstax.org/oscms-prodcms/media/documents/Microbiology-ADA.pdf",
    },
    {
        "title": "الإسعافات الأولية والرعاية الطارئة — WHO",
        "description": "دليل منظمة الصحة العالمية للإسعافات الأولية في الحالات الطارئة، يشمل الصدمات والحروق والاختناق وتوقف القلب.",
        "cover_image": "https://www.who.int/images/default-source/imported/health-topics/first-aid.jpg",
        "file_url": "https://www.who.int/publications/i/item/9789240023987",
    },
    {
        "title": "دليل الأمراض المعدية — WHO",
        "description": "المرجع الرسمي لمنظمة الصحة العالمية في الأمراض المعدية والوبائية، يشمل التشخيص والوقاية وبروتوكولات العلاج.",
        "cover_image": "https://www.who.int/images/default-source/imported/health-topics/infectious-diseases.jpg",
        "file_url": "https://www.who.int/publications/i/item/9789240083851",
    },
    {
        "title": "الصحة النفسية — دليل WHO للمختصين",
        "description": "دليل عملي من منظمة الصحة العالمية يتناول الاضطرابات النفسية الشائعة، أساليب التشخيص، والتدخلات العلاجية الموصى بها.",
        "cover_image": "https://www.who.int/images/default-source/imported/health-topics/mental-health.jpg",
        "file_url": "https://www.who.int/publications/i/item/9789241549257",
    },
    {
        "title": "أساسيات الكيمياء الحيوية الطبية — OpenStax",
        "description": "كتاب مجاني في الكيمياء يمهّد الطلاب لفهم الأسس الجزيئية للطب والأدوية. صادر عن OpenStax بترخيص مفتوح.",
        "cover_image": "https://assets.openstax.org/oscms-prodcms/media/documents/chemistry-2e-cover.jpg",
        "file_url": "https://assets.openstax.org/oscms-prodcms/media/documents/Chemistry2e-ADA.pdf",
    },
    {
        "title": "علم وظائف الأعضاء — مفاهيم أساسية",
        "description": "مرجع مبسّط في الفسيولوجيا البشرية يشرح آليات عمل الجهاز العصبي والقلب والرئتين والكلى والجهاز الهضمي.",
        "cover_image": "https://assets.openstax.org/oscms-prodcms/media/documents/anatomy-physiology-cover_1.jpg",
        "file_url": None,
    },
]

PAID_BOOKS = [
    {
        "title": "دليل الطبيب و الصيدلي",
        "description": "مرجع طبي وصيدلاني شامل يغطي الأدوية والجرعات والتداخلات الدوائية والموانع، لا غنى عنه لكل طبيب وصيدلاني.",
        "cover_image": "https://covers.openlibrary.org/b/id/8226198-L.jpg",
        "price": "1500 DZD",
        "buy_url": None,
    },
    {
        "title": "هاريسون في مبادئ الطب الباطني — الجزء الأول",
        "description": "الطبعة العربية لأشهر مرجع في الطب الباطني عالمياً. يتناول الفصل الأول التشخيص السريري وأمراض القلب والأوعية الدموية.",
        "cover_image": "https://covers.openlibrary.org/b/id/8231856-L.jpg",
        "price": "3500 DZD",
        "buy_url": "https://www.amazon.com/s?k=harrison+internal+medicine+arabic",
    },
    {
        "title": "أطلس نيتر للتشريح البشري",
        "description": "الأطلس التشريحي الأكثر استخداماً في كليات الطب حول العالم، بصور دقيقة وتوضيحات احترافية لكل منطقة من الجسم.",
        "cover_image": "https://covers.openlibrary.org/b/id/8239725-L.jpg",
        "price": "4200 DZD",
        "buy_url": "https://www.amazon.com/s?k=netter+atlas+anatomy+arabic",
    },
    {
        "title": "داويدسون في مبادئ وممارسة الطب",
        "description": "مرجع طبي متكامل وموثوق تستخدمه كليات الطب في الجزائر والعالم العربي. يشمل الباطنة والجراحة وطب الأطفال.",
        "cover_image": "https://covers.openlibrary.org/b/id/9171527-L.jpg",
        "price": "2800 DZD",
        "buy_url": "https://www.amazon.com/s?k=davidson+principles+medicine+arabic",
    },
    {
        "title": "موسوعة الأمراض الجلدية والتناسلية",
        "description": "مرجع متخصص في الأمراض الجلدية يتضمن الصور السريرية والتشخيص التفريقي وبروتوكولات العلاج الحديثة.",
        "cover_image": "https://covers.openlibrary.org/b/id/8737380-L.jpg",
        "price": "3100 DZD",
        "buy_url": None,
    },
    {
        "title": "طب وجراحة العيون — المرجع الشامل",
        "description": "كتاب متخصص في طب العيون يغطي الأمراض الشائعة والعمليات الجراحية وأحدث تقنيات التشخيص بالليزر.",
        "cover_image": "https://covers.openlibrary.org/b/id/8093538-L.jpg",
        "price": "2600 DZD",
        "buy_url": None,
    },
    {
        "title": "أساسيات طب الأطفال",
        "description": "مرجع عملي في طب الأطفال يغطي النمو والتطور، الأمراض الشائعة عند الرضّع والأطفال، والتطعيمات وفق الجدول الوطني.",
        "cover_image": "https://covers.openlibrary.org/b/id/8240283-L.jpg",
        "price": "2200 DZD",
        "buy_url": None,
    },
    {
        "title": "الجراحة العامة — المبادئ والتطبيقات",
        "description": "مرجع جراحي شامل يتناول المبادئ الأساسية للجراحة العامة، ما قبل وبعد العمليات، وإدارة المضاعفات.",
        "cover_image": "https://covers.openlibrary.org/b/id/9302166-L.jpg",
        "price": "3800 DZD",
        "buy_url": None,
    },
]


def run():
    app = create_app()
    with app.app_context():
        existing_titles = {b.title for b in MedicalBook.query.all()}
        added = 0

        for b in FREE_BOOKS:
            if b["title"] not in existing_titles:
                db.session.add(MedicalBook(category="free", **b))
                added += 1
                print(f"  + [free]  {b['title']}")

        for b in PAID_BOOKS:
            if b["title"] not in existing_titles:
                db.session.add(MedicalBook(category="paid", **b))
                added += 1
                print(f"  + [paid]  {b['title']}")

        db.session.commit()
        print(f"\nDone — {added} books added.")


if __name__ == "__main__":
    run()
