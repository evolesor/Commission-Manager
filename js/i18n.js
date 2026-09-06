/* ===========================================================
   i18n.js
   Small translation layer. Add a new language later by adding
   a new key to DICTS (e.g. 'ja') — no other code changes needed
   as long as every key used in the app exists in that dict.
   =========================================================== */

const I18n = (() => {
  const DICTS = {
    th: {
      appName: 'Commission Manager',
      nav: { dashboard: 'ภาพรวม', products: 'สินค้า', invoices: 'ใบแจ้งหนี้', calendar: 'ตารางงาน', settings: 'ตั้งค่า' },

      common: {
        save: 'บันทึก', cancel: 'ยกเลิก', delete: 'ลบ', edit: 'แก้ไข',
        close: 'ปิด', discard: 'ไม่บันทึก', confirm: 'ยืนยัน',
        optional: 'ไม่บังคับ', active: 'เปิดใช้งาน', inactive: 'ปิดใช้งาน',
        archived: 'เก็บถาวรแล้ว', saved: 'บันทึกแล้ว', undo: 'เลิกทำ',
      },

      category: { Commission: 'คอมมิชชั่น', 'Add-on': 'ส่วนเสริม', Other: 'อื่น ๆ' },

      dashboard: {
        title: 'ภาพรวม', subtitle: 'สรุปสถานะร้านคอมมิชชั่นของคุณโดยย่อ',
        statProducts: 'สินค้าทั้งหมด', statInvoices: 'ใบแจ้งหนี้ทั้งหมด',
        statOutstanding: 'ยอดค้างชำระ', statPaid: 'ยอดรับชำระแล้ว',
        recentInvoicesTitle: 'ใบแจ้งหนี้ล่าสุด', viewAll: 'ดูทั้งหมด →',
        emptyTitle: 'ยินดีต้อนรับสู่ Commission Manager',
        emptyDesc: 'เริ่มต้นด้วยการเพิ่มสินค้าที่คุณรับวาด แล้วค่อยสร้างใบแจ้งหนี้ให้ลูกค้า',
        emptyCta: '+ เพิ่มสินค้า',
        noInvoicesYet: 'ยังไม่มีใบแจ้งหนี้',
      },

      products: {
        title: 'สินค้า', subtitle: 'จัดการสินค้าและบริการที่คุณเปิดรับให้ลูกค้า',
        addProduct: '+ เพิ่มสินค้า', searchPlaceholder: 'ค้นหาสินค้า...', filterAll: 'ทั้งหมด',
        emptyTitle: 'ยังไม่มีสินค้า', emptyDesc: 'เพิ่มสินค้าคอมมิชชั่นชิ้นแรกของคุณเพื่อเริ่มต้นใช้งาน',
        emptySearchTitle: 'ไม่พบสินค้าที่ค้นหา', emptySearchDesc: 'ลองใช้คำค้นหรือหมวดหมู่อื่น',
        formAddTitle: 'เพิ่มสินค้า', formEditTitle: 'แก้ไขสินค้า',
        fieldName: 'ชื่อสินค้า', fieldNamePlaceholder: 'เช่น ภาพวาดเต็มตัว',
        fieldCategory: 'หมวดหมู่', fieldPrice: 'ราคา',
        fieldDescription: 'รายละเอียด', fieldDescPlaceholder: 'คำอธิบายสั้น ๆ ที่แสดงให้ลูกค้าหรือในรายการสินค้า',
        fieldActiveLabel: 'เปิดใช้งาน', fieldActiveSub: 'แสดงให้เลือกได้ตอนสร้างใบแจ้งหนี้',
        fieldIsAddonLabel: 'เป็นส่วนเสริม', fieldIsAddonSub: 'ทำเครื่องหมายว่างานนี้เป็นส่วนเสริมของคอมมิชชั่นหลัก ไม่ใช่งานเดี่ยว',
        fieldPricingType: 'รูปแบบราคา',
        pricingTypeFixed: 'ราคาคงที่', pricingTypeCustom: 'ราคากำหนดเอง',
        pricingTypeFixedHint: 'ใช้ราคาที่ตั้งไว้นี้ทุกครั้งที่เลือกส่วนเสริมนี้',
        pricingTypeCustomHint: 'ไม่ต้องตั้งราคาไว้ล่วงหน้า — ผู้ใช้จะกรอกราคาเองตอนสร้างคอมมิชชั่นแต่ละครั้ง',
        subTypeMain: 'งานหลัก', subTypeAddon: 'ส่วนเสริม',
        errName: 'กรุณากรอกชื่อสินค้า', errPrice: 'กรุณากรอกราคาให้ถูกต้อง (0 ขึ้นไป)',
        toastAdded: 'เพิ่มสินค้าแล้ว', toastSaved: 'บันทึกการแก้ไขแล้ว',
        toastDeleted: 'ลบสินค้าแล้ว', toastArchived: 'เก็บถาวรสินค้าแล้ว', toastUnarchived: 'นำสินค้ากลับมาแล้ว',
        menuEdit: '✎ แก้ไข', menuSetInactive: '○ ปิดใช้งาน', menuSetActive: '● เปิดใช้งาน',
        menuArchive: '⌂ เก็บถาวร', menuUnarchive: '↺ นำกลับมาใช้', menuDelete: '🗑 ลบ',
        confirmArchiveTitle: 'เก็บถาวรสินค้านี้ใช่ไหม?',
        confirmArchiveDesc: '"{name}" จะถูกซ่อนจากรายการเลือกตอนสร้างใบแจ้งหนี้ใหม่ ใบแจ้งหนี้เก่าที่ใช้สินค้านี้จะไม่ได้รับผลกระทบ',
        confirmDeleteTitle: 'ลบสินค้านี้ใช่ไหม?',
        confirmDeleteDesc: '"{name}" จะถูกลบอย่างถาวร การลบนี้จะไม่กระทบใบแจ้งหนี้เก่า เพราะแต่ละรายการเก็บราคา ณ เวลานั้นไว้แยกต่างหาก การกระทำนี้ไม่สามารถย้อนกลับได้',
        confirmDiscardTitle: 'ไม่บันทึกการเปลี่ยนแปลง?',
        confirmDiscardDesc: 'คุณมีข้อมูลที่ยังไม่ได้บันทึก หากออกตอนนี้ข้อมูลจะหายไป',
      },

      invoices: {
        title: 'ใบแจ้งหนี้', subtitle: 'สร้างและจัดการใบแจ้งค่าคอมมิชชั่นให้ลูกค้า',
        newInvoice: '+ สร้างใบแจ้งหนี้', searchPlaceholder: 'ค้นหาด้วยชื่อลูกค้าหรือเลขที่...', filterAll: 'ทั้งหมด',
        statusDraft: 'แบบร่าง', statusUnpaid: 'ยังไม่ชำระ', statusPaid: 'ชำระแล้ว', statusCancelled: 'ยกเลิก',
        emptyTitle: 'ยังไม่มีใบแจ้งหนี้', emptyDesc: 'สร้างใบแจ้งหนี้ใบแรกจากสินค้าที่คุณเพิ่มไว้',
        emptySearchTitle: 'ไม่พบใบแจ้งหนี้ที่ค้นหา', emptySearchDesc: 'ลองใช้คำค้นหรือตัวกรองอื่น',
        emptyNoProductsTitle: 'ยังไม่มีสินค้า', emptyNoProductsDesc: 'เพิ่มสินค้าก่อนเริ่มสร้างใบแจ้งหนี้',
        colClient: 'ลูกค้า', colTotal: 'ยอดรวม', colStatus: 'สถานะ', colDate: 'วันที่',
        menuOpen: 'เปิดดู / แก้ไข', menuDuplicate: 'ทำสำเนา', menuDelete: 'ลบ',
        confirmDeleteTitle: 'ลบใบแจ้งหนี้นี้ใช่ไหม?',
        confirmDeleteDesc: 'ใบแจ้งหนี้ "{number}" จะถูกลบอย่างถาวร การกระทำนี้ไม่สามารถย้อนกลับได้',
        toastDeleted: 'ลบใบแจ้งหนี้แล้ว', toastDuplicated: 'ทำสำเนาใบแจ้งหนี้แล้ว', toastStatusUpdated: 'อัปเดตสถานะแล้ว',
      },

      calendar: {
        title: 'ตารางงาน', subtitle: 'วางแผนและติดตามงานคอมมิชชั่นตามวันที่นัดหมาย',
        addJob: '+ เพิ่มงาน',
        today: 'วันนี้',
        filterAll: 'ทั้งหมด',
        statusPending: 'รอดำเนินการ', statusInprogress: 'กำลังทำ', statusDone: 'เสร็จแล้ว', statusCancelled: 'ยกเลิก',
        weekdayShort: ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'],
        monthNames: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'],
        moreCount: '+{count} เพิ่มเติม',
        upcomingTitle: 'งานที่กำลังจะถึง',
        noUpcoming: 'ไม่มีงานที่กำลังจะถึง',
        noJobsOnDay: 'ไม่มีงานในวันนี้',
        emptyTitle: 'ยังไม่มีงานในตาราง',
        emptyDesc: 'เพิ่มงานคอมมิชชั่นแรกของคุณเพื่อเริ่มวางแผนตารางงาน',
        formAddTitle: 'เพิ่มงาน', formEditTitle: 'แก้ไขงาน',
        fieldTitle: 'ชื่องาน', fieldTitlePlaceholder: 'เช่น ภาพวาดครึ่งตัว - คุณนัท',
        fieldClient: 'ลูกค้า', fieldClientPlaceholder: 'ชื่อลูกค้า',
        fieldDate: 'วันที่', fieldTime: 'เวลา',
        fieldStatus: 'สถานะ', fieldNotes: 'หมายเหตุ',
        fieldNotesPlaceholder: 'รายละเอียดเพิ่มเติมเกี่ยวกับงานนี้',
        errTitle: 'กรุณากรอกชื่องาน', errDate: 'กรุณาเลือกวันที่',
        menuEdit: '✎ แก้ไข', menuDelete: '🗑 ลบ',
        confirmDeleteTitle: 'ลบงานนี้ใช่ไหม?',
        confirmDeleteDesc: '"{title}" จะถูกลบออกจากตารางงานอย่างถาวร การกระทำนี้ไม่สามารถย้อนกลับได้',
        confirmDiscardTitle: 'ไม่บันทึกการเปลี่ยนแปลง?',
        confirmDiscardDesc: 'คุณมีข้อมูลที่ยังไม่ได้บันทึก หากออกตอนนี้ข้อมูลจะหายไป',
        toastAdded: 'เพิ่มงานแล้ว', toastSaved: 'บันทึกการแก้ไขแล้ว', toastDeleted: 'ลบงานแล้ว', toastMoved: 'ย้ายงานแล้ว', toastReordered: 'จัดลำดับใหม่แล้ว',
      },

      invoiceEditor: {
        newTitle: 'สร้างใบแจ้งหนี้', editTitle: 'แก้ไขใบแจ้งหนี้',
        backToList: '← กลับไปที่ใบแจ้งหนี้',
        sectionClient: 'ข้อมูลลูกค้า',
        fieldClientName: 'ชื่อลูกค้า', fieldClientContact: 'ช่องทางติดต่อ',
        fieldInvoiceNumber: 'เลขที่ใบแจ้งหนี้', fieldIssueDate: 'วันที่ออก', fieldDueDate: 'ครบกำหนดชำระ',
        sectionItems: 'รายการสินค้า',
        addItemButton: '+ เพิ่มสินค้า', pickerTitle: 'เลือกสินค้า', pickerSearchPlaceholder: 'ค้นหาสินค้า...',
        pickerNoProductsTitle: 'ยังไม่มีสินค้า', pickerNoProductsDesc: 'เพิ่มสินค้าก่อนสร้างใบแจ้งหนี้', pickerAddProductCta: '+ เพิ่มสินค้า',
        pickerEmptySearch: 'ไม่พบสินค้าที่ค้นหา',
        colProduct: 'สินค้า', colQty: 'จำนวน', colUnitPrice: 'ราคาต่อหน่วย', colSubtotal: 'ยอดย่อย',
        noItemsYet: 'ยังไม่มีรายการสินค้าในใบแจ้งหนี้นี้',
        sectionNotes: 'หมายเหตุ',
        fieldNotes: 'หมายเหตุ', fieldPaymentTerms: 'เงื่อนไขการชำระเงิน',
        summaryTotal: 'ยอดรวมทั้งหมด',
        statusLabel: 'สถานะ',
        previewTitle: 'ตัวอย่างใบแจ้งหนี้',
        previewFrom: 'จาก', previewBillTo: 'เรียกเก็บเงินจาก',
        previewInvoiceNo: 'เลขที่', previewIssueDate: 'วันที่ออก', previewDueDate: 'ครบกำหนด',
        previewTotal: 'ยอดรวม', previewNotes: 'หมายเหตุ', previewPaymentInfo: 'ข้อมูลการชำระเงิน',
        previewEmptyItems: 'ยังไม่มีรายการสินค้า',
        btnSave: 'บันทึกใบแจ้งหนี้', btnCancel: 'ยกเลิก', btnExport: '🖨 พิมพ์ / ส่งออก PDF', btnDelete: 'ลบ',
        btnExportPng: '🖼 ส่งออกเป็น PNG', btnExportPngWorking: 'กำลังสร้างรูปภาพ...',
        toastPngExported: 'ส่งออกเป็น PNG แล้ว', toastPngExportFailed: 'ส่งออก PNG ไม่สำเร็จ ลองอีกครั้ง',
        errClientName: 'กรุณากรอกชื่อลูกค้า', errNoItems: 'กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ',
        toastSaved: 'บันทึกใบแจ้งหนี้แล้ว', toastCreated: 'สร้างใบแจ้งหนี้แล้ว',
        confirmDiscardTitle: 'ไม่บันทึกการเปลี่ยนแปลง?',
        confirmDiscardDesc: 'คุณมีข้อมูลที่ยังไม่ได้บันทึก หากออกตอนนี้ข้อมูลจะหายไป',
        confirmRemoveItemTitle: 'นำสินค้านี้ออก?',
        confirmRemoveItemDesc: 'รายการนี้จะถูกนำออกจากใบแจ้งหนี้',
        templateLabel: 'เทมเพลต',
        addonSelectorTitle: 'เลือกส่วนเสริม',
        addonSelectorBasePrice: 'ราคาพื้นฐาน',
        addonSelectorAddonsTotal: 'ส่วนเสริม',
        addonSelectorGrandTotal: 'รวมทั้งหมด',
        addonSelectorNoAddonsTitle: 'ยังไม่มีส่วนเสริมให้เลือก',
        addonSelectorNoAddonsDesc: 'คุณสามารถเพิ่มส่วนเสริมได้ในหน้าสินค้า โดยตั้งค่าสินค้าประเภทคอมมิชชั่นให้เป็น "ส่วนเสริม"',
        addonSelectorGotoProducts: '+ ไปเพิ่มส่วนเสริม',
        addonSelectorConfirm: '+ เพิ่มรายการนี้',
        addonSelectorCancel: 'ยกเลิก',
        addonSelectorCustomPriceError: 'กรุณากรอกราคาให้ถูกต้อง (0 ขึ้นไป)',
        itemAddonsLabel: 'ส่วนเสริม',
        usageLicenseLabel: 'Usage / License',
        usagePersonalOption: 'Personal ×1',
        usageCommercialOption: 'Commercial ×{multiplier}',
        usageCommercialLabel: 'Commercial',
        breakdownCommissionLabel: 'Commission',
        breakdownSubtotalLabel: 'Subtotal',
        breakdownCommercialLabel: 'Commercial Use ×{multiplier}',
        breakdownTotalLabel: 'Total',
      },

      settings: {
        title: 'ตั้งค่า', subtitle: 'โปรไฟล์ ข้อมูลการชำระเงิน และค่าเริ่มต้นของแอป',
        languageSection: 'ภาษา', languageLabel: 'ภาษาที่ใช้แสดงผล',
        languageHint: 'เปลี่ยนภาษาของหน้าจอทั้งหมด — ระบบจะรองรับภาษาเพิ่มเติมในอนาคต',
        themeSection: 'ธีม', themeLabel: 'โหมดสี',
        themeHint: 'เปลี่ยนโทนสีของทั้งแอป',
        themeLight: 'สว่าง', themeDark: 'มืด', themeBlue: 'ฟ้าขาว', themePink: 'ชมพูขาว',
        artistSection: 'โปรไฟล์นักวาด',
        artistName: 'ชื่อ (สำหรับใบแจ้งหนี้)', displayName: 'ชื่อที่ใช้แสดง',
        contact: 'ช่องทางติดต่อ', socialLinks: 'ลิงก์โซเชียล',
        paymentSection: 'ข้อมูลการชำระเงิน',
        paymentMethod: 'ช่องทางการชำระเงิน', paymentDetail: 'รายละเอียด (เลขบัญชี / พร้อมเพย์ / อีเมล PayPal)',
        methodBank: 'โอนธนาคาร', methodPromptpay: 'พร้อมเพย์', methodPaypal: 'PayPal', methodOther: 'อื่น ๆ',
        invoiceDefaultsSection: 'ค่าเริ่มต้นของใบแจ้งหนี้',
        currency: 'สกุลเงิน', defaultNotes: 'หมายเหตุเริ่มต้น', paymentTerms: 'เงื่อนไขการชำระเงิน',
        dataSection: 'สำรองข้อมูล',
        dataHint: 'ส่งออกข้อมูลทั้งหมดเป็นไฟล์ JSON เพื่อสำรองไว้ หรือย้ายไปใช้งานเครื่องอื่น',
        exportData: '↓ ส่งออกข้อมูล (JSON)', importData: '↑ นำเข้าข้อมูล (JSON)',
        saveSettings: 'บันทึกการตั้งค่า', toastSaved: 'บันทึกการตั้งค่าแล้ว',
        toastImported: 'นำเข้าข้อมูลเรียบร้อย', toastImportError: 'ไม่สามารถอ่านไฟล์นี้ได้ กรุณาตรวจสอบไฟล์',
        importConfirmTitle: 'นำเข้าข้อมูล?',
        importConfirmDesc: 'การนำเข้าจะแทนที่สินค้าทั้งหมดที่มีอยู่ในเครื่องนี้ด้วยข้อมูลจากไฟล์ที่เลือก การกระทำนี้ไม่สามารถย้อนกลับได้',
        appearanceSection: 'รูปแบบใบแจ้งหนี้',
        templateLabel: 'เทมเพลตใบแจ้งหนี้',
        templateHint: 'เลือกรูปแบบที่ใช้แสดงในหน้าตัวอย่างและตอนพิมพ์/ส่งออก PDF ใช้เป็นค่าเริ่มต้นสำหรับใบแจ้งหนี้ใหม่ (เปลี่ยนเฉพาะใบได้จากหน้าสร้าง/แก้ไขใบแจ้งหนี้)',
        templateMinimal: 'Minimal', templateClassic: 'Classic', templateReceipt: 'Receipt',
        templateMinimalDesc: 'เรียบ สะอาด อ่านง่าย',
        templateClassicDesc: 'ทางการ มีกรอบชัดเจน',
        templateReceiptDesc: 'กระชับ สไตล์ใบเสร็จ เส้นประคั่น',
        usageSection: 'Usage / License',
        usageHint: 'Commercial Use คิดเป็นตัวคูณจากราคารวม (ราคาพื้นฐาน + ส่วนเสริม) ไม่ใช่ส่วนเสริม — ตั้งค่าตัวคูณเริ่มต้นที่นี่ได้ ใบงานเก่าจะไม่เปลี่ยนราคาตามค่านี้ในภายหลัง',
        usagePersonalLabel: 'Personal', usagePersonalHint: 'ตัวคูณ ×1 (คงที่ ไม่สามารถแก้ไขได้)',
        commercialMultiplierLabel: 'Commercial Multiplier',
        commercialMultiplierHint: 'ใช้เมื่อเลือก Commercial ตอนสร้างงาน เช่น 1.5, 2, 3',
        errCommercialMultiplier: 'กรุณากรอกตัวคูณให้ถูกต้อง (มากกว่า 0)',
      },
    },

    en: {
      appName: 'Commission Manager',
      nav: { dashboard: 'Dashboard', products: 'Products', invoices: 'Invoices', calendar: 'Calendar', settings: 'Settings' },

      common: {
        save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit',
        close: 'Close', discard: 'Discard', confirm: 'Confirm',
        optional: 'optional', active: 'Active', inactive: 'Inactive',
        archived: 'Archived', saved: 'Saved', undo: 'Undo',
      },

      category: { Commission: 'Commission', 'Add-on': 'Add-on', Other: 'Other' },

      dashboard: {
        title: 'Dashboard', subtitle: 'A quick summary of your commission business.',
        statProducts: 'Total Products', statInvoices: 'Total Invoices',
        statOutstanding: 'Outstanding', statPaid: 'Paid Revenue',
        recentInvoicesTitle: 'Recent Invoices', viewAll: 'View all →',
        emptyTitle: 'Welcome to Commission Manager',
        emptyDesc: 'Start by adding a product you offer, then create your first invoice for a client.',
        emptyCta: '+ Add Product',
        noInvoicesYet: 'No invoices yet',
      },

      products: {
        title: 'Products', subtitle: 'Manage the products and services you offer to your clients.',
        addProduct: '+ Add Product', searchPlaceholder: 'Search products...', filterAll: 'All',
        emptyTitle: 'No products yet', emptyDesc: 'Add your first commission product to get started.',
        emptySearchTitle: 'No products match your search', emptySearchDesc: 'Try a different keyword or category filter.',
        formAddTitle: 'Add Product', formEditTitle: 'Edit Product',
        fieldName: 'Product Name', fieldNamePlaceholder: 'e.g. Full body illustration',
        fieldCategory: 'Category', fieldPrice: 'Price',
        fieldDescription: 'Description', fieldDescPlaceholder: 'Short description shown to clients or on the product list',
        fieldActiveLabel: 'Active', fieldActiveSub: 'Available to select when creating invoices',
        fieldIsAddonLabel: 'This is an add-on', fieldIsAddonSub: 'Mark this as an add-on to a main commission, not a standalone job.',
        fieldPricingType: 'Pricing type',
        pricingTypeFixed: 'Fixed price', pricingTypeCustom: 'Custom price',
        pricingTypeFixedHint: 'This price is used every time this add-on is selected.',
        pricingTypeCustomHint: 'No default price — the price is entered per commission when this add-on is used.',
        subTypeMain: 'Main', subTypeAddon: 'Add-on',
        errName: 'Product name is required.', errPrice: 'Enter a valid price (0 or more).',
        toastAdded: 'Product added', toastSaved: 'Changes saved',
        toastDeleted: 'Product deleted', toastArchived: 'Product archived', toastUnarchived: 'Product unarchived',
        menuEdit: '✎ Edit', menuSetInactive: '○ Set inactive', menuSetActive: '● Set active',
        menuArchive: '⌂ Archive', menuUnarchive: '↺ Unarchive', menuDelete: '🗑 Delete',
        confirmArchiveTitle: 'Archive this product?',
        confirmArchiveDesc: '"{name}" will be hidden from the product picker when creating new invoices. Existing invoices that use it will not be affected.',
        confirmDeleteTitle: 'Delete this product?',
        confirmDeleteDesc: '"{name}" will be permanently deleted. This won\'t change any past invoices, since invoice line items keep their own price snapshot. This can\'t be undone.',
        confirmDiscardTitle: 'Discard changes?',
        confirmDiscardDesc: 'You have unsaved changes. If you leave now, they will be lost.',
      },

      invoices: {
        title: 'Invoices', subtitle: 'Create and manage commission invoices for your clients.',
        newInvoice: '+ New Invoice', searchPlaceholder: 'Search by client or invoice number...', filterAll: 'All',
        statusDraft: 'Draft', statusUnpaid: 'Unpaid', statusPaid: 'Paid', statusCancelled: 'Cancelled',
        emptyTitle: 'No invoices yet', emptyDesc: 'Create your first invoice from the products you offer.',
        emptySearchTitle: 'No invoices match your search', emptySearchDesc: 'Try a different keyword or filter.',
        emptyNoProductsTitle: 'No products available', emptyNoProductsDesc: 'Add a product before creating an invoice.',
        colClient: 'Client', colTotal: 'Total', colStatus: 'Status', colDate: 'Date',
        menuOpen: 'Open / Edit', menuDuplicate: 'Duplicate', menuDelete: 'Delete',
        confirmDeleteTitle: 'Delete this invoice?',
        confirmDeleteDesc: 'Invoice "{number}" will be permanently deleted. This can\'t be undone.',
        toastDeleted: 'Invoice deleted', toastDuplicated: 'Invoice duplicated', toastStatusUpdated: 'Status updated',
      },

      calendar: {
        title: 'Calendar', subtitle: 'Plan and track your commission work by date.',
        addJob: '+ Add Job',
        today: 'Today',
        filterAll: 'All',
        statusPending: 'Pending', statusInprogress: 'In Progress', statusDone: 'Done', statusCancelled: 'Cancelled',
        weekdayShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        moreCount: '+{count} more',
        upcomingTitle: 'Upcoming Jobs',
        noUpcoming: 'No upcoming jobs',
        noJobsOnDay: 'No jobs on this day',
        emptyTitle: 'No jobs scheduled yet',
        emptyDesc: 'Add your first commission job to start planning your schedule.',
        formAddTitle: 'Add Job', formEditTitle: 'Edit Job',
        fieldTitle: 'Job title', fieldTitlePlaceholder: 'e.g. Half body illustration - Nat',
        fieldClient: 'Client', fieldClientPlaceholder: 'Client name',
        fieldDate: 'Date', fieldTime: 'Time',
        fieldStatus: 'Status', fieldNotes: 'Notes',
        fieldNotesPlaceholder: 'Extra details about this job',
        errTitle: 'Job title is required.', errDate: 'Please pick a date.',
        menuEdit: '✎ Edit', menuDelete: '🗑 Delete',
        confirmDeleteTitle: 'Delete this job?',
        confirmDeleteDesc: '"{title}" will be permanently removed from your schedule. This can\'t be undone.',
        confirmDiscardTitle: 'Discard changes?',
        confirmDiscardDesc: 'You have unsaved changes. If you leave now, they will be lost.',
        toastAdded: 'Job added', toastSaved: 'Changes saved', toastDeleted: 'Job deleted', toastMoved: 'Job moved', toastReordered: 'Jobs reordered',
      },

      invoiceEditor: {
        newTitle: 'Create Invoice', editTitle: 'Edit Invoice',
        backToList: '← Back to invoices',
        sectionClient: 'Client Information',
        fieldClientName: 'Client name', fieldClientContact: 'Contact',
        fieldInvoiceNumber: 'Invoice number', fieldIssueDate: 'Issue date', fieldDueDate: 'Due date',
        sectionItems: 'Items',
        addItemButton: '+ Add Product', pickerTitle: 'Select Product', pickerSearchPlaceholder: 'Search products...',
        pickerNoProductsTitle: 'No products available', pickerNoProductsDesc: 'Add a product before creating an invoice.', pickerAddProductCta: '+ Add Product',
        pickerEmptySearch: 'No products match your search',
        colProduct: 'Product', colQty: 'Qty', colUnitPrice: 'Unit Price', colSubtotal: 'Subtotal',
        noItemsYet: 'No items added to this invoice yet.',
        sectionNotes: 'Notes',
        fieldNotes: 'Notes', fieldPaymentTerms: 'Payment terms',
        summaryTotal: 'Total',
        statusLabel: 'Status',
        previewTitle: 'Invoice Preview',
        previewFrom: 'From', previewBillTo: 'Bill To',
        previewInvoiceNo: 'Invoice #', previewIssueDate: 'Issue date', previewDueDate: 'Due date',
        previewTotal: 'Total', previewNotes: 'Notes', previewPaymentInfo: 'Payment Information',
        previewEmptyItems: 'No items yet',
        btnSave: 'Save Invoice', btnCancel: 'Cancel', btnExport: '🖨 Print / Export PDF', btnDelete: 'Delete',
        btnExportPng: '🖼 Export as PNG', btnExportPngWorking: 'Generating image...',
        toastPngExported: 'Exported as PNG', toastPngExportFailed: 'PNG export failed, please try again',
        errClientName: 'Client name is required.', errNoItems: 'Add at least one product.',
        toastSaved: 'Invoice saved', toastCreated: 'Invoice created',
        confirmDiscardTitle: 'Discard changes?',
        confirmDiscardDesc: 'You have unsaved changes. If you leave now, they will be lost.',
        confirmRemoveItemTitle: 'Remove this item?',
        confirmRemoveItemDesc: 'This line item will be removed from the invoice.',
        templateLabel: 'Template',
        addonSelectorTitle: 'Choose Add-ons',
        addonSelectorBasePrice: 'Base price',
        addonSelectorAddonsTotal: 'Add-ons',
        addonSelectorGrandTotal: 'Total',
        addonSelectorNoAddonsTitle: 'No add-ons available yet',
        addonSelectorNoAddonsDesc: 'Add some in Products — set a Commission product as an "Add-on".',
        addonSelectorGotoProducts: '+ Go add add-ons',
        addonSelectorConfirm: '+ Add this item',
        addonSelectorCancel: 'Cancel',
        addonSelectorCustomPriceError: 'Enter a valid price (0 or more).',
        itemAddonsLabel: 'Add-ons',
        usageLicenseLabel: 'Usage / License',
        usagePersonalOption: 'Personal ×1',
        usageCommercialOption: 'Commercial ×{multiplier}',
        usageCommercialLabel: 'Commercial',
        breakdownCommissionLabel: 'Commission',
        breakdownSubtotalLabel: 'Subtotal',
        breakdownCommercialLabel: 'Commercial Use ×{multiplier}',
        breakdownTotalLabel: 'Total',
      },

      settings: {
        title: 'Settings', subtitle: 'Your profile, payment details, and app preferences.',
        languageSection: 'Language', languageLabel: 'Display language',
        languageHint: 'Changes the language across the whole app — more languages can be added later.',
        themeSection: 'Theme', themeLabel: 'Color mode',
        themeHint: 'Changes the color scheme across the whole app.',
        themeLight: 'Light', themeDark: 'Dark', themeBlue: 'Blue & White', themePink: 'Pink & White',
        artistSection: 'Artist Profile',
        artistName: 'Artist name (for invoices)', displayName: 'Display name',
        contact: 'Contact', socialLinks: 'Social links',
        paymentSection: 'Payment Information',
        paymentMethod: 'Payment method', paymentDetail: 'Details (account no. / PromptPay / PayPal email)',
        methodBank: 'Bank transfer', methodPromptpay: 'PromptPay', methodPaypal: 'PayPal', methodOther: 'Other',
        invoiceDefaultsSection: 'Invoice Defaults',
        currency: 'Currency', defaultNotes: 'Default notes', paymentTerms: 'Payment terms',
        dataSection: 'Data Backup',
        dataHint: 'Export all your data as a JSON file to back it up or move it to another device.',
        exportData: '↓ Export data (JSON)', importData: '↑ Import data (JSON)',
        saveSettings: 'Save Settings', toastSaved: 'Settings saved',
        toastImported: 'Data imported successfully', toastImportError: 'Could not read this file. Please check the file and try again.',
        importConfirmTitle: 'Import data?',
        importConfirmDesc: 'Importing will replace all products currently stored on this device with the data from the selected file. This can\'t be undone.',
        appearanceSection: 'Invoice Appearance',
        templateLabel: 'Invoice template',
        templateHint: 'Choose the layout used for the preview and when printing / exporting to PDF. This is the default for new invoices (each invoice can override it from its own editor).',
        templateMinimal: 'Minimal', templateClassic: 'Classic', templateReceipt: 'Receipt',
        templateMinimalDesc: 'Clean and easy to read',
        templateClassicDesc: 'Formal, clearly bordered',
        templateReceiptDesc: 'Compact, receipt-style with dashed dividers',
        usageSection: 'Usage / License',
        usageHint: 'Commercial Use is a multiplier applied to the total (base price + add-ons), not an add-on — set the default multiplier here. Changing it later never affects already-saved commissions.',
        usagePersonalLabel: 'Personal', usagePersonalHint: '×1 multiplier (fixed, not editable)',
        commercialMultiplierLabel: 'Commercial Multiplier',
        commercialMultiplierHint: 'Used when Commercial is selected while creating a commission, e.g. 1.5, 2, 3',
        errCommercialMultiplier: 'Enter a valid multiplier (greater than 0).',
      },
    },
  };

  const LANG_ORDER = ['en', 'th']; // display order in the picker; extend here later

  function getLocale() {
    const settings = Storage.getSettings();
    return DICTS[settings.language] ? settings.language : 'en';
  }

  function setLocale(lang) {
    if (!DICTS[lang]) return;
    Storage.updateSettings({ language: lang });
    applyStatic();
    document.documentElement.lang = lang;
    window.dispatchEvent(new CustomEvent('localechange'));
  }

  function t(path, vars) {
    const dict = DICTS[getLocale()] || DICTS.en;
    const parts = path.split('.');
    let node = dict;
    for (const p of parts) {
      node = node?.[p];
    }
    let str = node ?? path;
    if (vars) {
      Object.keys(vars).forEach(k => { str = str.replace(`{${k}}`, vars[k]); });
    }
    return str;
  }

  function categoryLabel(cat) {
    return t('category.' + cat) === 'category.' + cat ? cat : (DICTS[getLocale()].category[cat] || cat);
  }

  function applyStatic() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });
    document.documentElement.lang = getLocale();
  }

  return { t, categoryLabel, getLocale, setLocale, applyStatic, LANG_ORDER, langName: (l) => (l === 'th' ? 'ไทย' : l === 'en' ? 'English' : l) };
})();
