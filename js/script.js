
/* ============================================================
   MERIT PAYROLL — APPLICATION LOGIC
   ============================================================ */
(function () {
    'use strict';

    // ---------- DOM REFS ----------
    const $ = (id) => document.getElementById(id);

    // Inputs
    const empName = $('empName');
    const empId = $('empId');
    const designation = $('designation');
    const joiningDate = $('joiningDate');
    const locationInput = $('location');
    const tinNo = $('tinNo');
    const payMonth = $('payMonth');
    const payYear = $('payYear');
    const payDate = $('payDate');
    const bankName = $('bankName');
    const bankBranch = $('bankBranch');
    const bankAc = $('bankAc');
    const chequeNo = $('chequeNo');
    const workingDays = $('workingDays');
    const daysWorked = $('daysWorked');
    const lateCome = $('lateCome');
    const casualLeave = $('casualLeave');
    const sickLeave = $('sickLeave');
    const earnedLeave = $('earnedLeave');
    const basicSalary = $('basicSalary');
    const houseRent = $('houseRent');
    const medicalExp = $('medicalExp');
    const conveyance = $('conveyance');
    const othersAllowance = $('othersAllowance');
    const deductionTax = $('deductionTax');
    const deductionPF = $('deductionPF');
    const deductionLoan = $('deductionLoan');
    const deductionAdvance = $('deductionAdvance');
    const deductionPenalty = $('deductionPenalty');
    const deductionOther = $('deductionOther');

    // Salary mode states
    const salaryModes = {
        house: 'pct',     // 'pct' or 'fixed'
        medical: 'pct',
        conveyance: 'pct',
        others: 'fixed'
    };

    // Payment type
    let paymentType = 'Bank';

    // Payslip ID
    let currentPayslipId = 'MS-PAY-2026-05-0004';

    // ---------- UTILITY FUNCTIONS ----------
    function formatCurrency(num) {
        const n = parseFloat(num);
        if (isNaN(n)) return '0.00';
        return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function numberToWords(num) {
        const intPart = Math.floor(Math.abs(num));
        if (intPart === 0) return 'Zero Taka Only';
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven',
            'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
        ];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        function convertHundreds(n) {
            let str = '';
            if (n >= 100) {
                str += ones[Math.floor(n / 100)] + ' Hundred ';
                n %= 100;
            }
            if (n >= 20) {
                str += tens[Math.floor(n / 10)] + ' ';
                n %= 10;
            }
            if (n > 0) str += ones[n] + ' ';
            return str.trim();
        }

        let amount = intPart;
        let word = '';
        if (amount >= 10000000) {
            word += convertHundreds(Math.floor(amount / 10000000)) + ' Crore ';
            amount %= 10000000;
        }
        if (amount >= 100000) {
            word += convertHundreds(Math.floor(amount / 100000)) + ' Lakh ';
            amount %= 100000;
        }
        if (amount >= 1000) {
            word += convertHundreds(Math.floor(amount / 1000)) + ' Thousand ';
            amount %= 1000;
        }
        if (amount > 0) word += convertHundreds(amount);
        return word.trim() + ' Taka Only';
    }

    function getPayPeriod() {
        const month = payMonth.value;
        const year = parseInt(payYear.value) || 2026;
        const monthIdx = new Date(Date.parse(month + ' 1, ' + year)).getMonth();
        const lastDay = new Date(year, monthIdx + 1, 0).getDate();
        const shortMonth = month.substring(0, 3);
        return {
            start: `01-${shortMonth}-${year}`,
            end: `${lastDay}-${shortMonth}-${year}`,
            display: `${month} ${year}`,
            title: `Pay Slip for the Month ${month} – ${year}`
        };
    }

    function generatePayslipId() {
        const month = payMonth.value.substring(0, 3).toUpperCase();
        const year = payYear.value;
        const empIdVal = empId.value.trim() || '0000';
        const seq = String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0');
        return `MS-PAY-${year}-${month}-${seq}`;
    }

    // ---------- CALCULATIONS ----------
    function calculateSalaryComponents() {
        const basic = parseFloat(basicSalary.value) || 0;

        // House Rent
        let houseVal;
        if (salaryModes.house === 'pct') {
            const pct = parseFloat(houseRent.value) || 0;
            houseVal = (basic * pct) / 100;
        } else {
            houseVal = parseFloat(houseRent.value) || 0;
        }

        // Medical
        let medicalVal;
        if (salaryModes.medical === 'pct') {
            const pct = parseFloat(medicalExp.value) || 0;
            medicalVal = (basic * pct) / 100;
        } else {
            medicalVal = parseFloat(medicalExp.value) || 0;
        }

        // Conveyance
        let convVal;
        if (salaryModes.conveyance === 'pct') {
            const pct = parseFloat(conveyance.value) || 0;
            convVal = (basic * pct) / 100;
        } else {
            convVal = parseFloat(conveyance.value) || 0;
        }

        // Others
        let othersVal;
        if (salaryModes.others === 'pct') {
            const pct = parseFloat(othersAllowance.value) || 0;
            othersVal = (basic * pct) / 100;
        } else {
            othersVal = parseFloat(othersAllowance.value) || 0;
        }

        const gross = basic + houseVal + medicalVal + convVal + othersVal;
        return { basic, houseVal, medicalVal, convVal, othersVal, gross };
    }

    function calculateDeductions() {
        const tax = parseFloat(deductionTax.value) || 0;
        const pf = parseFloat(deductionPF.value) || 0;
        const loan = parseFloat(deductionLoan.value) || 0;
        const advance = parseFloat(deductionAdvance.value) || 0;
        const penalty = parseFloat(deductionPenalty.value) || 0;
        const other = parseFloat(deductionOther.value) || 0;
        const total = tax + pf + loan + advance + penalty + other;
        return { tax, pf, loan, advance, penalty, other, total };
    }

    function calculateNetSalary(gross, totalDeductions) {
        return Math.max(0, gross - totalDeductions);
    }

    // ---------- VALIDATION ----------
    function validateForm() {
        let valid = true;

        // Employee Name
        if (!empName.value.trim()) {
            empName.classList.add('error');
            $('empNameError').classList.add('show');
            valid = false;
        } else {
            empName.classList.remove('error');
            $('empNameError').classList.remove('show');
        }

        // Employee ID
        if (!empId.value.trim()) {
            empId.classList.add('error');
            $('empIdError').classList.add('show');
            valid = false;
        } else {
            empId.classList.remove('error');
            $('empIdError').classList.remove('show');
        }

        // Basic Salary >= 0
        if (parseFloat(basicSalary.value) < 0) {
            basicSalary.classList.add('error');
            valid = false;
        } else {
            basicSalary.classList.remove('error');
        }

        // Working Days >= 0
        if (parseFloat(workingDays.value) < 0) {
            workingDays.classList.add('error');
            valid = false;
        } else {
            workingDays.classList.remove('error');
        }

        // Days Worked cannot exceed Working Days
        const wd = parseFloat(workingDays.value) || 0;
        const dw = parseFloat(daysWorked.value) || 0;
        if (dw > wd) {
            daysWorked.classList.add('error');
            valid = false;
        } else {
            daysWorked.classList.remove('error');
        }

        // Leave cannot be negative
        [casualLeave, sickLeave, earnedLeave].forEach(el => {
            if (parseFloat(el.value) < 0) {
                el.classList.add('error');
                valid = false;
            } else {
                el.classList.remove('error');
            }
        });

        // Deductions cannot be negative
        [deductionTax, deductionPF, deductionLoan, deductionAdvance, deductionPenalty, deductionOther].forEach(el => {
            if (parseFloat(el.value) < 0) {
                el.classList.add('error');
                valid = false;
            } else {
                el.classList.remove('error');
            }
        });

        return valid;
    }

    // ---------- UPDATE PREVIEW ----------
    function updatePreview() {
        const basicVal = parseFloat(basicSalary.value) || 0;
        const { basic, houseVal, medicalVal, convVal, othersVal, gross } = calculateSalaryComponents();
        const deductions = calculateDeductions();
        const net = calculateNetSalary(gross, deductions.total);

        // Pay period
        const period = getPayPeriod();
        $('payPeriodDisplay').textContent = `Pay Period: ${period.start} – ${period.end}`;
        $('previewPayPeriod').textContent = period.display;
        $('previewPayPeriodDetail').textContent = `${period.start} – ${period.end}`;
        $('previewTitle').textContent = period.title;

        // Payslip ID
        currentPayslipId = generatePayslipId();
        $('previewPayslipId').textContent = currentPayslipId;

        // Employee info
        $('previewEmpName').textContent = empName.value.trim() || '—';
        $('previewEmpId').textContent = empId.value.trim() || '—';
        $('previewDesignation').textContent = designation.value.trim() || '—';
        $('previewJoiningDate').textContent = joiningDate.value.trim() || '—';
        $('previewLocation').textContent = locationInput.value.trim() || '—';
        $('previewTin').textContent = tinNo.value.trim() || '—';
        $('previewPayDate').textContent = payDate.value.trim() || '—';
        $('footerPayDate').textContent = payDate.value.trim() || '—';

        // Payment
        $('previewPaymentType').textContent = paymentType;
        $('previewBankName').textContent = bankName.value.trim() || 'N/A';
        $('previewBankBranch').textContent = bankBranch.value.trim() || 'N/A';
        $('previewBankAc').textContent = bankAc.value.trim() || 'N/A';
        $('previewChequeNo').textContent = chequeNo.value.trim() || 'N/A';

        // Attendance
        $('previewWorkingDays').textContent = workingDays.value || '0';
        $('previewDaysWorked').textContent = daysWorked.value || '0';
        $('previewLateCome').textContent = lateCome.value || '0';
        $('previewCasualLeave').textContent = casualLeave.value || '0';
        $('previewSickLeave').textContent = sickLeave.value || '0';
        $('previewEarnedLeave').textContent = earnedLeave.value || '0';

        // Attendance percentage
        const wd = parseFloat(workingDays.value) || 1;
        const dw = parseFloat(daysWorked.value) || 0;
        const attPct = wd > 0 ? Math.min(100, Math.round((dw / wd) * 100)) : 0;
        $('attendancePct').textContent = attPct + '%';
        $('lateDisplay').textContent = lateCome.value || '0';

        // Salary table
        $('previewBasic').textContent = formatCurrency(basic);
        $('previewHouse').textContent = formatCurrency(houseVal);
        $('previewMedical').textContent = formatCurrency(medicalVal);
        $('previewConveyance').textContent = formatCurrency(convVal);
        $('previewOthers').textContent = formatCurrency(othersVal);
        $('previewGross').textContent = formatCurrency(gross);

        // Calculation labels
        $('previewHouseCalcLabel').textContent = salaryModes.house === 'pct' ? `${houseRent.value}% of Basic` : 'Fixed';
        $('previewMedicalCalcLabel').textContent = salaryModes.medical === 'pct' ? `${medicalExp.value}% of Basic` : 'Fixed';
        $('previewConvCalcLabel').textContent = salaryModes.conveyance === 'pct' ? `${conveyance.value}% of Basic` : 'Fixed';

        // Deductions
        $('previewTax').textContent = formatCurrency(deductions.tax);
        $('previewPF').textContent = formatCurrency(deductions.pf);
        $('previewLoan').textContent = formatCurrency(deductions.loan);
        $('previewAdvance').textContent = formatCurrency(deductions.advance);
        $('previewPenalty').textContent = formatCurrency(deductions.penalty);
        $('previewOtherDeduction').textContent = formatCurrency(deductions.other);
        $('previewTotalDeduction').textContent = formatCurrency(deductions.total);
        $('totalDeductionDisplay').textContent = '৳' + formatCurrency(deductions.total);

        // Net
        $('previewNet').textContent = formatCurrency(net);
        $('previewNetBlock').textContent = '৳ ' + formatCurrency(net);
        $('previewNetWords').textContent = 'In Word: ' + numberToWords(net);

        // Update calculated labels
        $('basicCalc').textContent = '৳' + formatCurrency(basic);
        $('houseCalc').textContent = '৳' + formatCurrency(houseVal);
        $('medicalCalc').textContent = '৳' + formatCurrency(medicalVal);
        $('convCalc').textContent = '৳' + formatCurrency(convVal);
        $('othersCalc').textContent = '৳' + formatCurrency(othersVal);

        // Also update the salary input display values when in percentage mode
        // (the input keeps the percentage, the calculated span shows amount)
    }

    // ---------- TOAST ----------
    function showToast(message, type = 'success') {
        const container = $('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle' };
        toast.innerHTML = `<i class="fas ${icons[type] || icons.success}"></i> ${message}`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.25s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ---------- MODAL ----------
    function openModal() { $('resetModal').classList.add('open'); }
    function closeModal() { $('resetModal').classList.remove('open'); }

    // ---------- SAVE ----------
    function savePayslip() {
        if (!validateForm()) {
            showToast('Please fix the errors before saving.', 'error');
            return;
        }
        const data = {
            empName: empName.value,
            empId: empId.value,
            designation: designation.value,
            joiningDate: joiningDate.value,
            location: locationInput.value,
            tinNo: tinNo.value,
            payMonth: payMonth.value,
            payYear: payYear.value,
            payDate: payDate.value,
            bankName: bankName.value,
            bankBranch: bankBranch.value,
            bankAc: bankAc.value,
            chequeNo: chequeNo.value,
            workingDays: workingDays.value,
            daysWorked: daysWorked.value,
            lateCome: lateCome.value,
            casualLeave: casualLeave.value,
            sickLeave: sickLeave.value,
            earnedLeave: earnedLeave.value,
            basicSalary: basicSalary.value,
            houseRent: houseRent.value,
            medicalExp: medicalExp.value,
            conveyance: conveyance.value,
            othersAllowance: othersAllowance.value,
            salaryModes: JSON.parse(JSON.stringify(salaryModes)),
            paymentType: paymentType,
            deductionTax: deductionTax.value,
            deductionPF: deductionPF.value,
            deductionLoan: deductionLoan.value,
            deductionAdvance: deductionAdvance.value,
            deductionPenalty: deductionPenalty.value,
            deductionOther: deductionOther.value,
            payslipId: currentPayslipId,
            savedAt: new Date().toISOString()
        };
        try {
            localStorage.setItem('merit_payslip_data', JSON.stringify(data));
            showToast('✓ Payslip saved successfully', 'success');
        } catch (e) {
            showToast('Unable to save data. Storage may be full.', 'error');
        }
    }

    function loadPayslip() {
        try {
            const saved = localStorage.getItem('merit_payslip_data');
            if (!saved) return false;
            const data = JSON.parse(saved);
            if (data.empName) empName.value = data.empName;
            if (data.empId) empId.value = data.empId;
            if (data.designation) designation.value = data.designation;
            if (data.joiningDate) joiningDate.value = data.joiningDate;
            if (data.location) locationInput.value = data.location;
            if (data.tinNo) tinNo.value = data.tinNo;
            if (data.payMonth) payMonth.value = data.payMonth;
            if (data.payYear) payYear.value = data.payYear;
            if (data.payDate) payDate.value = data.payDate;
            if (data.bankName) bankName.value = data.bankName;
            if (data.bankBranch) bankBranch.value = data.bankBranch;
            if (data.bankAc) bankAc.value = data.bankAc;
            if (data.chequeNo) chequeNo.value = data.chequeNo;
            if (data.workingDays) workingDays.value = data.workingDays;
            if (data.daysWorked) daysWorked.value = data.daysWorked;
            if (data.lateCome) lateCome.value = data.lateCome;
            if (data.casualLeave) casualLeave.value = data.casualLeave;
            if (data.sickLeave) sickLeave.value = data.sickLeave;
            if (data.earnedLeave) earnedLeave.value = data.earnedLeave;
            if (data.basicSalary) basicSalary.value = data.basicSalary;
            if (data.houseRent) houseRent.value = data.houseRent;
            if (data.medicalExp) medicalExp.value = data.medicalExp;
            if (data.conveyance) conveyance.value = data.conveyance;
            if (data.othersAllowance) othersAllowance.value = data.othersAllowance;
            if (data.salaryModes) Object.assign(salaryModes, data.salaryModes);
            if (data.paymentType) paymentType = data.paymentType;
            if (data.deductionTax) deductionTax.value = data.deductionTax;
            if (data.deductionPF) deductionPF.value = data.deductionPF;
            if (data.deductionLoan) deductionLoan.value = data.deductionLoan;
            if (data.deductionAdvance) deductionAdvance.value = data.deductionAdvance;
            if (data.deductionPenalty) deductionPenalty.value = data.deductionPenalty;
            if (data.deductionOther) deductionOther.value = data.deductionOther;
            if (data.payslipId) currentPayslipId = data.payslipId;

            // Update UI modes
            updateSalaryModeUI();
            updatePaymentUI();
            updatePreview();
            return true;
        } catch (e) {
            return false;
        }
    }

    // ---------- RESET ----------
    function resetPayslip() {
        empName.value = 'Ridoana Tabassum Mithila';
        empId.value = 'MRS-04';
        designation.value = 'Assistant Teacher';
        joiningDate.value = '24-Nov-2025';
        locationInput.value = 'Merit Residential School, Narsingdi';
        tinNo.value = '451591449599';
        payMonth.value = 'May';
        payYear.value = '2026';
        payDate.value = '20-May-2026';
        bankName.value = 'Islami Bank Bangladesh PLC.';
        bankBranch.value = 'Narsingdi Sadar, Narsingdi';
        bankAc.value = '20501196700224100';
        chequeNo.value = 'N/A';
        workingDays.value = '26';
        daysWorked.value = '26';
        lateCome.value = '0';
        casualLeave.value = '1';
        sickLeave.value = '0';
        earnedLeave.value = '1';
        basicSalary.value = '13000';
        houseRent.value = '40';
        medicalExp.value = '10';
        conveyance.value = '8';
        othersAllowance.value = '700';
        deductionTax.value = '0';
        deductionPF.value = '0';
        deductionLoan.value = '0';
        deductionAdvance.value = '0';
        deductionPenalty.value = '0';
        deductionOther.value = '0';

        // Reset modes
        salaryModes.house = 'pct';
        salaryModes.medical = 'pct';
        salaryModes.conveyance = 'pct';
        salaryModes.others = 'fixed';

        paymentType = 'Bank';
        updateSalaryModeUI();
        updatePaymentUI();
        validateForm();
        updatePreview();
        showToast('Payslip reset to sample data', 'success');
    }

    // ---------- UI HELPERS ----------
    function updateSalaryModeUI() {
        // House
        const houseToggle = houseRent.closest('.salary-row').querySelector('.mode-toggle');
        houseToggle.querySelectorAll('button').forEach(b => {
            b.classList.toggle('active', b.dataset.mode === salaryModes.house);
        });
        // Medical
        const medToggle = medicalExp.closest('.salary-row').querySelector('.mode-toggle');
        medToggle.querySelectorAll('button').forEach(b => {
            b.classList.toggle('active', b.dataset.mode === salaryModes.medical);
        });
        // Conveyance
        const convToggle = conveyance.closest('.salary-row').querySelector('.mode-toggle');
        convToggle.querySelectorAll('button').forEach(b => {
            b.classList.toggle('active', b.dataset.mode === salaryModes.conveyance);
        });
        // Others
        const othersToggle = othersAllowance.closest('.salary-row').querySelector('.mode-toggle');
        othersToggle.querySelectorAll('button').forEach(b => {
            b.classList.toggle('active', b.dataset.mode === salaryModes.others);
        });
    }

    function updatePaymentUI() {
        // Segmented buttons
        document.querySelectorAll('#paymentTypeSegmented button').forEach(b => {
            b.classList.toggle('active', b.dataset.type === paymentType);
        });
        // Show/hide fields
        $('bankFields').style.display = (paymentType === 'Bank' || paymentType === 'Cheque') ? 'block' : 'none';
        $('chequeField').style.display = paymentType === 'Cheque' ? 'block' : 'none';
    }

    // ---------- PDF DOWNLOAD ----------
    function downloadPDF() {
        const element = $('payslipDoc');
        const btn = $('downloadPdfBtn');
        if (typeof html2pdf === 'undefined') {
            showToast('PDF library not loaded. Please use Print instead.', 'warning');
            return;
        }
        btn.classList.add('loading');
        btn.disabled = true;
        const opt = {
            margin: [0.2, 0.2, 0.2, 0.2],
            filename: `payslip_${empId.value || 'employee'}_${payMonth.value}_${payYear.value}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save().then(() => {
            btn.classList.remove('loading');
            btn.disabled = false;
            showToast('✓ PDF downloaded successfully', 'success');
        }).catch(() => {
            btn.classList.remove('loading');
            btn.disabled = false;
            showToast('Unable to generate PDF. Please try Print.', 'error');
        });
    }

    // ---------- EVENT BINDING ----------
    function bindEvents() {
        // Live preview on all inputs
        const inputs = [empName, empId, designation, joiningDate, locationInput, tinNo, payMonth, payYear,
            payDate, bankName, bankBranch, bankAc, chequeNo, workingDays, daysWorked, lateCome, casualLeave,
            sickLeave, earnedLeave, basicSalary, houseRent, medicalExp, conveyance, othersAllowance,
            deductionTax, deductionPF, deductionLoan, deductionAdvance, deductionPenalty, deductionOther
        ];
        inputs.forEach(el => {
            if (el) el.addEventListener('input', () => { validateForm(); updatePreview(); });
            if (el) el.addEventListener('change', () => { validateForm(); updatePreview(); });
        });

        // Salary mode toggles
        document.querySelectorAll('.mode-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn || btn.disabled) return;
                const row = toggle.closest('.salary-row');
                const input = row.querySelector('input');
                const inputId = input.id;
                let key;
                if (inputId === 'houseRent') key = 'house';
                else if (inputId === 'medicalExp') key = 'medical';
                else if (inputId === 'conveyance') key = 'conveyance';
                else if (inputId === 'othersAllowance') key = 'others';
                if (!key) return;
                salaryModes[key] = btn.dataset.mode;
                // Update active class
                toggle.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updatePreview();
            });
        });

        // Payment type segmented
        document.querySelectorAll('#paymentTypeSegmented button').forEach(btn => {
            btn.addEventListener('click', () => {
                paymentType = btn.dataset.type;
                updatePaymentUI();
                updatePreview();
            });
        });

        // Save
        $('saveBtn').addEventListener('click', savePayslip);

        // Print
        $('printBtn').addEventListener('click', () => window.print());

        // PDF
        $('downloadPdfBtn').addEventListener('click', downloadPDF);

        // Reset
        $('resetBtn').addEventListener('click', openModal);
        $('cancelResetBtn').addEventListener('click', closeModal);
        $('confirmResetBtn').addEventListener('click', () => {
            closeModal();
            resetPayslip();
        });

        // Close modal on overlay click
        $('resetModal').addEventListener('click', (e) => {
            if (e.target === $('resetModal')) closeModal();
        });

        // Sidebar toggle (mobile)
        // (Simplified: sidebar is always visible on desktop, collapsible on tablet via CSS)

        // Theme toggle
        $('themeToggle').addEventListener('click', () => {
            document.body.classList.toggle('dark');
            const isDark = document.body.classList.contains('dark');
            $('themeToggle').querySelector('i').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            $('themeToggle').querySelector('span').textContent = isDark ? 'Light Mode' : 'Dark Mode';
            try { localStorage.setItem('merit_theme', isDark ? 'dark' : 'light'); } catch (e) { }
        });

        // Load theme preference
        try {
            if (localStorage.getItem('merit_theme') === 'dark') {
                document.body.classList.add('dark');
                $('themeToggle').querySelector('i').className = 'fas fa-sun';
                $('themeToggle').querySelector('span').textContent = 'Light Mode';
            }
        } catch (e) { }

        // Set current date display
        const now = new Date();
        $('currentDateDisplay').textContent = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // ---------- INIT ----------
    function initApp() {
        // Try loading saved data, else reset to defaults
        if (!loadPayslip()) {
            resetPayslip();
        } else {
            // Ensure modes and payment are synced
            updateSalaryModeUI();
            updatePaymentUI();
            updatePreview();
        }

        bindEvents();

        // Initial validation
        validateForm();
        updatePreview();

        console.log('Merit Payroll initialized.');
    }

    // Start
    document.addEventListener('DOMContentLoaded', initApp);

})();
