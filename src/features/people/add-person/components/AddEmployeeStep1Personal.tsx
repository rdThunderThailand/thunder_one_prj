import { ImageIcon, InfoIcon } from "@/components/ui/icons";
import { ErrorText, fieldClasses, inputClasses, labelClasses } from "../form-field";
import { requiredMark } from "../wizard-parts";

interface AddEmployeeStep1PersonalProps {
  titlePrefix: string;
  onTitlePrefixChange: (value: string) => void;
  firstNameTh: string;
  onFirstNameThChange: (value: string) => void;
  lastNameTh: string;
  onLastNameThChange: (value: string) => void;
  firstNameEn: string;
  onFirstNameEnChange: (value: string) => void;
  lastNameEn: string;
  onLastNameEnChange: (value: string) => void;
  gender: string;
  onGenderChange: (value: string) => void;
  idCardNumber: string;
  onIdCardNumberChange: (value: string) => void;
  passportNumber: string;
  onPassportNumberChange: (value: string) => void;
  nationality: string;
  onNationalityChange: (value: string) => void;
  ethnicity: string;
  onEthnicityChange: (value: string) => void;
  birthDate: string;
  onBirthDateChange: (value: string) => void;
  email: string;
  onEmailChange: (value: string) => void;
  phone: string;
  onPhoneChange: (value: string) => void;
  address: string;
  onAddressChange: (value: string) => void;
  additionalNote: string;
  onAdditionalNoteChange: (value: string) => void;
  errors: Record<string, string>;
}

/** Step 1 of AddEmployeeWizardPage — presentational only. All state and
 *  error-clearing logic lives in the parent wizard (see its own header
 *  comment for which fields are real vs. cosmetic); this component just
 *  renders the form and calls the on*Change props it's given. Extracted
 *  2026-09-17 (readability audit) — pure structural split, no behavior
 *  change. */
export function AddEmployeeStep1Personal({
  titlePrefix,
  onTitlePrefixChange,
  firstNameTh,
  onFirstNameThChange,
  lastNameTh,
  onLastNameThChange,
  firstNameEn,
  onFirstNameEnChange,
  lastNameEn,
  onLastNameEnChange,
  gender,
  onGenderChange,
  idCardNumber,
  onIdCardNumberChange,
  passportNumber,
  onPassportNumberChange,
  nationality,
  onNationalityChange,
  ethnicity,
  onEthnicityChange,
  birthDate,
  onBirthDateChange,
  email,
  onEmailChange,
  phone,
  onPhoneChange,
  address,
  onAddressChange,
  additionalNote,
  onAdditionalNoteChange,
  errors,
}: AddEmployeeStep1PersonalProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
        <h2 className="text-sm font-semibold text-foreground">1. ข้อมูลส่วนบุคคล (Personal Information)</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className={labelClasses}>
            คำนำหน้าชื่อ
            <select value={titlePrefix} onChange={(e) => onTitlePrefixChange(e.target.value)} className={inputClasses}>
              <option>นาย</option>
              <option>นาง</option>
              <option>นางสาว</option>
            </select>
          </label>
          <label className={labelClasses}>
            <span>ชื่อ (ภาษาไทย) {requiredMark}</span>
            <input
              required
              value={firstNameTh}
              onChange={(e) => onFirstNameThChange(e.target.value)}
              className={fieldClasses(!!errors.firstNameTh)}
            />
            <ErrorText message={errors.firstNameTh} />
          </label>
          <label className={labelClasses}>
            <span>นามสกุล (ภาษาไทย) {requiredMark}</span>
            <input
              required
              value={lastNameTh}
              onChange={(e) => onLastNameThChange(e.target.value)}
              className={fieldClasses(!!errors.lastNameTh)}
            />
            <ErrorText message={errors.lastNameTh} />
          </label>
          <label className={labelClasses}>
            ชื่อ (ภาษาอังกฤษ)
            <input value={firstNameEn} onChange={(e) => onFirstNameEnChange(e.target.value)} className={inputClasses} />
          </label>
          <label className={labelClasses}>
            นามสกุล (ภาษาอังกฤษ)
            <input value={lastNameEn} onChange={(e) => onLastNameEnChange(e.target.value)} className={inputClasses} />
          </label>
          <label className={labelClasses}>
            เพศ
            <select value={gender} onChange={(e) => onGenderChange(e.target.value)} className={inputClasses}>
              <option>ชาย</option>
              <option>หญิง</option>
              <option>ไม่ระบุ</option>
            </select>
          </label>
          <label className={labelClasses}>
            <span>เลขบัตรประชาชน</span>
            <input
              value={idCardNumber}
              onChange={(e) => onIdCardNumberChange(e.target.value)}
              className={fieldClasses(!!errors.idCardNumber)}
            />
            <ErrorText message={errors.idCardNumber} />
          </label>
          <label className={labelClasses}>
            เลขหนังสือเดินทาง (ถ้ามี)
            <input value={passportNumber} onChange={(e) => onPassportNumberChange(e.target.value)} className={inputClasses} />
          </label>
          <label className={labelClasses}>
            สัญชาติ
            <input value={nationality} onChange={(e) => onNationalityChange(e.target.value)} className={inputClasses} />
          </label>
          <label className={labelClasses}>
            เชื้อชาติ
            <input value={ethnicity} onChange={(e) => onEthnicityChange(e.target.value)} className={inputClasses} />
          </label>
          <label className={labelClasses}>
            วันเกิด
            <input type="date" value={birthDate} onChange={(e) => onBirthDateChange(e.target.value)} className={inputClasses} />
          </label>
          <label className={labelClasses}>
            <span>อีเมล (สำหรับการเข้าสู่ระบบ) {requiredMark}</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className={fieldClasses(!!errors.email)}
            />
            <ErrorText message={errors.email} />
          </label>
          <label className={labelClasses}>
            เบอร์โทรศัพท์มือถือ
            <input
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              className={fieldClasses(!!errors.phone)}
            />
            <ErrorText message={errors.phone} />
          </label>
        </div>
        <label className={labelClasses}>
          ที่อยู่ปัจจุบัน
          <textarea
            rows={2}
            maxLength={200}
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            className={inputClasses}
          />
        </label>
        <details className="rounded-lg border border-border p-3">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
            ข้อมูลเพิ่มเติม (ถ้ามี)
          </summary>
          <label className={`${labelClasses} mt-2`}>
            หมายเหตุ
            <textarea
              rows={2}
              maxLength={1798}
              value={additionalNote}
              onChange={(e) => onAdditionalNoteChange(e.target.value)}
              className={inputClasses}
            />
          </label>
        </details>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-foreground">รูปภาพพนักงาน (ถ้ามี)</h3>
          <div
            title="ยังไม่เปิดใช้งาน"
            className="flex cursor-not-allowed flex-col items-center gap-2 rounded-xl border border-dashed border-border py-6 text-center"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-t1-gray-400">
              <ImageIcon className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium text-primary">อัปโหลดรูปภาพ</span>
            <span className="text-[11px] text-t1-gray-400">รองรับไฟล์ JPG, PNG (ขนาดไม่เกิน 2MB)</span>
          </div>
        </div>
        <div className="rounded-2xl border border-primary bg-accent/50 p-5 text-xs text-accent-foreground">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <InfoIcon className="h-4 w-4" />
            คำแนะนำ
          </h3>
          <ul className="list-inside list-disc space-y-1">
            <li>กรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน</li>
            <li>ข้อมูลจะถูกใช้ในการสร้างบัญชีผู้ใช้และเริ่มกระบวนการ Onboarding</li>
            <li>คุณสามารถบันทึกชั่วคราว และกลับมาแก้ไขภายหลังได้</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
