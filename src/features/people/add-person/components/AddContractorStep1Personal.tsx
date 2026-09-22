import { ImageIcon, InfoIcon } from "@/components/ui/icons";
import { ErrorText, fieldClasses, inputClasses, labelClasses } from "../form-field";
import { requiredMark } from "../wizard-parts";

interface AddContractorStep1PersonalProps {
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
  idOrPassportNumber: string;
  onIdOrPassportNumberChange: (value: string) => void;
  nationality: string;
  onNationalityChange: (value: string) => void;
  gender: string;
  onGenderChange: (value: string) => void;
  email: string;
  onEmailChange: (value: string) => void;
  phone: string;
  onPhoneChange: (value: string) => void;
  secondaryPhone: string;
  onSecondaryPhoneChange: (value: string) => void;
  address: string;
  onAddressChange: (value: string) => void;
  birthDate: string;
  onBirthDateChange: (value: string) => void;
  /** Derived from `birthDate` in the parent (`ageFromBirthDate`) — a
   *  read-only display field, no state of its own. */
  age: string;
  lineId: string;
  onLineIdChange: (value: string) => void;
  otherContact: string;
  onOtherContactChange: (value: string) => void;
  additionalNote: string;
  onAdditionalNoteChange: (value: string) => void;
  errors: Record<string, string>;
}

/** Step 1 of AddContractorWizardPage — presentational only, same convention
 *  as AddEmployeeStep1Personal. Extracted 2026-09-17 (readability audit), no
 *  behavior change. */
export function AddContractorStep1Personal({
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
  idOrPassportNumber,
  onIdOrPassportNumberChange,
  nationality,
  onNationalityChange,
  gender,
  onGenderChange,
  email,
  onEmailChange,
  phone,
  onPhoneChange,
  secondaryPhone,
  onSecondaryPhoneChange,
  address,
  onAddressChange,
  birthDate,
  onBirthDateChange,
  age,
  lineId,
  onLineIdChange,
  otherContact,
  onOtherContactChange,
  additionalNote,
  onAdditionalNoteChange,
  errors,
}: AddContractorStep1PersonalProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">1. ข้อมูลส่วนบุคคล (Personal Information)</h2>
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
          <label className={`${labelClasses} sm:col-span-1`}>
            <span>เลขบัตรประชาชน / เลขที่หนังสือเดินทาง</span>
            <input
              value={idOrPassportNumber}
              onChange={(e) => onIdOrPassportNumberChange(e.target.value)}
              placeholder="กรอกเลขบัตรประชาชน 13 หลัก หรือเลขหนังสือเดินทาง"
              className={fieldClasses(!!errors.idOrPassportNumber)}
            />
            <ErrorText message={errors.idOrPassportNumber} />
          </label>
          <label className={labelClasses}>
            สัญชาติ
            <input value={nationality} onChange={(e) => onNationalityChange(e.target.value)} className={inputClasses} />
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
          <label className={labelClasses}>
            เบอร์โทรศัพท์สำรอง
            <input
              value={secondaryPhone}
              onChange={(e) => onSecondaryPhoneChange(e.target.value)}
              className={fieldClasses(!!errors.secondaryPhone)}
            />
            <ErrorText message={errors.secondaryPhone} />
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <label className={labelClasses}>
            วันเกิด
            <input type="date" value={birthDate} onChange={(e) => onBirthDateChange(e.target.value)} className={inputClasses} />
          </label>
          <label className={labelClasses}>
            อายุ
            <input readOnly value={age} className={`${inputClasses} cursor-not-allowed opacity-70`} />
          </label>
          <label className={labelClasses}>
            ไลน์ไอดี (ถ้ามี)
            <input value={lineId} onChange={(e) => onLineIdChange(e.target.value)} placeholder="เช่น @somchai" className={inputClasses} />
          </label>
          <label className={labelClasses}>
            ช่องทางติดต่ออื่น (ถ้ามี)
            <input
              value={otherContact}
              onChange={(e) => onOtherContactChange(e.target.value)}
              placeholder="เช่น Telegram, WhatsApp"
              className={inputClasses}
            />
          </label>
        </div>
        <details className="rounded-lg border border-zinc-100 p-3 dark:border-zinc-800">
          <summary className="cursor-pointer text-xs font-medium text-zinc-500 dark:text-zinc-400">
            ข้อมูลเพิ่มเติม (ถ้ามี)
          </summary>
          <label className={`${labelClasses} mt-2`}>
            หมายเหตุ
            {/* Sent as-is into Core's `notes` column (≤2000 chars) — this
                page's only notes field, unlike Employee's two boxes. */}
            <textarea
              rows={2}
              maxLength={2000}
              value={additionalNote}
              onChange={(e) => onAdditionalNoteChange(e.target.value)}
              className={inputClasses}
            />
          </label>
        </details>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">รูปภาพผู้รับเหมา (ถ้ามี)</h3>
          <div
            title="ยังไม่เปิดใช้งาน"
            className="flex cursor-not-allowed flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-200 py-6 text-center dark:border-zinc-700"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
              <ImageIcon className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium text-indigo-500">อัปโหลดรูปภาพ</span>
            <span className="text-[11px] text-zinc-400">รองรับไฟล์ JPG, PNG (ขนาดไม่เกิน 2MB)</span>
          </div>
        </div>
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 text-xs text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <InfoIcon className="h-4 w-4" />
            คำแนะนำ
          </h3>
          <ul className="list-inside list-disc space-y-1">
            <li>กรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน</li>
            <li>อีเมลจะถูกใช้ในการเข้าสู่ระบบและรับการแจ้งเตือน</li>
            <li>ข้อมูลนี้จะถูกใช้ในกระบวนการ Onboarding และการออกเอกสารสัญญา</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">ข้อมูลที่จะสร้าง</h3>
          <ul className="flex flex-col gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <li>Person Profile — โปรไฟล์บุคคลพื้นฐาน</li>
            <li>Contractor Record (รอสร้าง) — บันทึกผู้รับเหมา</li>
            <li>Onboarding (รอเริ่ม) — กระบวนการเตรียมความพร้อม</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
