from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


OUTPUT_FILE = "sample-medical-report-demo.pdf"

content = """
SUNRISE DIAGNOSTICS LABORATORY
(ISO 15189:2012 Accredited) | Reg. No: SD-20481
Address: 21, MG Road, Bengaluru - 560001 | Phone: +91-80-4000-1234

PATIENT DETAILS
Name: Ajinkya Sharma
Age/Gender: 26 / Male
Patient ID: SD-26-0414-0098
Ref. Doctor: Dr. A. Mehta, MD (Medicine)
Sample Collected: 14-Apr-2026 09:12 AM
Reported On: 14-Apr-2026 03:40 PM
Specimen: EDTA Whole Blood, Serum (Fasting)
Fasting Status: 10 hours

TEST 1: COMPLETE BLOOD COUNT (CBC)
Method: Automated Hematology Analyzer
Hemoglobin (Hb): 11.2 g/dL (13.0 - 17.0)
RBC Count: 4.10 million/uL (4.50 - 5.90)
Hematocrit (PCV): 34.0 % (40.0 - 50.0)
MCV: 78 fL (80 - 100)
MCH: 25.5 pg (27.0 - 33.0)
MCHC: 31.0 g/dL (32.0 - 36.0)
RDW-CV: 16.8 % (11.5 - 14.5)
Total WBC Count: 12.6 x10^3/uL (4.0 - 10.0)
Neutrophils: 78 % (40 - 70)
Lymphocytes: 16 % (20 - 40)
Platelet Count: 520 x10^3/uL (150 - 450)

Peripheral Smear Comment:
Mild microcytic hypochromic anemia suggestive of iron deficiency.

TEST 2: LIPID PROFILE
Total Cholesterol: 248 mg/dL (< 200)
Triglycerides: 310 mg/dL (< 150)
HDL Cholesterol: 34 mg/dL (> 40)
LDL Cholesterol: 162 mg/dL (< 100)
Non-HDL Cholesterol: 214 mg/dL (< 130)

TEST 3: GLUCOSE
Fasting Plasma Glucose: 132 mg/dL (70 - 99)
HbA1c: 6.7 % (4.0 - 5.6)
Estimated Avg Glucose: 146 mg/dL

TEST 4: LIVER FUNCTION
ALT (SGPT): 92 U/L (0 - 45)
AST (SGOT): 58 U/L (0 - 40)

TEST 5: KIDNEY FUNCTION
Creatinine: 1.4 mg/dL (0.7 - 1.3)
Urea: 46 mg/dL (15 - 40)
eGFR: 68 mL/min/1.73m² (>= 90)

CLINICAL NOTE
Symptoms: fatigue, occasional dizziness, increased thirst, recent weight gain.
Lifestyle: sedentary job, high carbohydrate diet, sleeps ~6 hrs/night.

ADVICE / REMARKS
1) Consider iron studies (Serum Ferritin, Iron, TIBC) to evaluate anemia.
2) Lipids are significantly deranged; diet and lifestyle changes strongly advised.
3) Glucose values fall in diabetes range; clinical correlation and repeat testing advised.
4) If fever or infection symptoms persist, consult physician due to raised WBC.

IMPORTANT DISCLAIMER:
This report is for informational purposes and must be interpreted by a qualified clinician.
Do not self-medicate based on this report.
"""


def main() -> None:
    doc = SimpleDocTemplate(OUTPUT_FILE, pagesize=A4, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    body = styles["BodyText"]
    body.leading = 14
    body.fontSize = 10
    title = styles["Heading2"]

    story = [Paragraph("Sample Medical Report (Demo)", title), Spacer(1, 8)]
    for line in content.strip().splitlines():
        line = line.strip()
        if not line:
            story.append(Spacer(1, 6))
        else:
            safe = (
                line.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
            )
            story.append(Paragraph(safe, body))

    doc.build(story)


if __name__ == "__main__":
    main()
