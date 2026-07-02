import { Page } from "@playwright/test";
import { GeneralUtils } from "./general.utils";

require('dotenv').config();

export class MaintenanceUtils {
    page: Page;
    repairWear: string;
    hoursCheck: number;

    constructor(page: Page) {
        this.page = page;
        // Mengambil konfigurasi dari .env dengan nilai fallback default jika tidak diisi
        this.repairWear = process.env.REPAIR_WEAR || '30';
        this.hoursCheck = parseInt(process.env.HOURS_CHECK || '20', 10); // Default ke 20 jam jika .env kosong
    }

    /**
     * Helper privat untuk membuka panel perencanaan.
     * Menggunakan moveAndClick global untuk menjamin lintasan melengkung dan pendaratan acak.
     */
    private async openPlanPanel() {
        const planButton = this.page.getByRole('button', { name: ' Plan' });
        await planButton.waitFor({ state: 'visible', timeout: 15000 });
        
        // Panggil utilitas terpusat untuk simulasi gerak dan klik manusiawi
        await GeneralUtils.moveAndClick(this.page, planButton);
    }

    /**
     * 🛠️ FITUR BARU: SELEKSI DROP-DOWN MANUSIAWI (ANTI-TELEPORTASI)
     * Menyimulasi tindakan manusia memilih opsi: Bergerak ke kotak drop-down, mengkliknya,
     * menunggu panel opsi muncul di layar (jeda mata membaca), lalu memilih opsi target.
     */
    private async moveAndSelectOption(selectLocator: any, optionValue: string) {
        // 1. Gerakkan mouse secara halus dan klik kotak drop-down utama untuk membukanya
        await GeneralUtils.moveAndClick(this.page, selectLocator);
        
        // 2. ⏱️ JEDA PSIKOLOGIS: Meniru waktu yang dibutuhkan mata dan otak manusia untuk mencari opsi
        await GeneralUtils.randomSleep(700, 1400); 

        // 3. Eksekusi pemilihan opsi secara sinkron setelah UI-nya terpicu terbuka secara fisik
        await selectLocator.selectOption(optionValue);
        
        // Jeda sesaat seolah-olah manusia melepas fokus dari menu drop-down tersebut
        await GeneralUtils.randomSleep(500, 900);
    }

    /**
     * Menyimulasi pergerakan scroll manusia yang acak (chaotic smooth scrolling).
     * Bisa mendadak cepat, pelan, putus-putus, bahkan kelewatan lalu naik lagi.
     */
    private async chaoticHumanScroll(targetY: number) {
        const steps = Math.floor(Math.random() * 4) + 3; 
        const totalDistance = targetY > 0 ? targetY + 100 : targetY - 100; 
        const baseDelta = totalDistance / steps;

        for (let j = 0; j < steps; j++) {
            let deltaY = baseDelta;
            let delay = Math.floor(Math.random() * 100) + 50; 

            await this.page.mouse.wheel(0, deltaY);
            await this.page.waitForTimeout(delay);
        }
    }

    private async humanScrollToElement(element: any) {
        const box = await element.boundingBox();
        const viewport = this.page.viewportSize();

        if (box && viewport) {
            if (box.y + box.height > viewport.height || box.y < 0) {
                const targetY = box.y < 0 ? box.y - 50 : (box.y + box.height) - viewport.height + 100;
                await this.chaoticHumanScroll(targetY);
                await GeneralUtils.randomSleep(500, 1000);
            }
        }
    }

    /**
     * Melakukan scroll balik ke atas secara penuh (mentok) secara bertahap.
     */
    private async scrollBackToTop() {
        console.log("Melakukan scroll balik ke atas secara manusiawi...");
        const upSteps = Math.floor(Math.random() * 3) + 4; // 4 sampai 6 kali usapan ke atas
        for (let k = 0; k < upSteps; k++) {
            const scrollAmount = -(Math.floor(Math.random() * 200) + 200); 
            await this.page.mouse.wheel(0, scrollAmount);
            await GeneralUtils.randomSleep(100, 250); 
        }
        await GeneralUtils.randomSleep(800, 1500); 
    }

    public async repairPlanes() {
        await this.openPlanPanel();
        await GeneralUtils.randomSleep(1000, 2000);
        
        // Upgrade tombol bulk repair menggunakan moveAndClick terpusat
        const bulkRepairButton = this.page.getByRole('button', { name: ' Bulk repair' });
        await GeneralUtils.moveAndClick(this.page, bulkRepairButton);
        await GeneralUtils.randomSleep(1200, 2200);
        
        // --- 🚀 PROSES SELEKSI OPSI SECARA HUMAN-LIKE BERAKSI ---
        console.log(`Memilih ambang batas perbaikan ${this.repairWear}% dengan jeda pencarian visual...`);
        const repairPercentSelect = this.page.locator('#repairPct');
        await this.moveAndSelectOption(repairPercentSelect, this.repairWear);
        await GeneralUtils.randomSleep(1200, 2500);
        
        const noPlaneExists = await this.page.getByText('There are no aircraft worn to').isVisible();
        if (!noPlaneExists) {
            // Upgrade tombol final perbaikan massal menggunakan moveAndClick terpusat
            const planBulkRepairButton = this.page.getByRole('button', { name: 'Plan bulk repair' });
            await GeneralUtils.moveAndClick(this.page, planBulkRepairButton);
        }
    }

    public async checkPlanes() {
        await this.openPlanPanel();
        await GeneralUtils.randomSleep(1000, 2000);
        
        // Upgrade tombol bulk check menggunakan moveAndClick terpusat
        const bulkCheckButton = this.page.getByRole('button', { name: ' Bulk check' });
        await GeneralUtils.moveAndClick(this.page, bulkCheckButton);
        
        await GeneralUtils.randomSleep(3000, 4500);
        
        let clicked = false;
        let didScroll = false; 

        // 🚀 STRATEGI UTAMA 1: Pre-Scroll ke bawah panel agar seluruh kartu pesawat (.bg-white) termuat penuh di layar
        console.log("[Maintenance] Melakukan pre-scroll ke bawah panel untuk memuat seluruh komponen kartu...");
        for (let s = 0; s < 5; s++) {
            await this.page.mouse.wheel(0, 450);
            await GeneralUtils.randomSleep(200, 450);
        }
        await GeneralUtils.randomSleep(1000, 1500);

        // Ambil penyeleksian seluruh kartu putih (.bg-white) setelah proses scroll selesai
        const allPlaneCards = this.page.locator('.bg-white');
        const cardsCount = await allPlaneCards.count();
        
        console.log(`[Task] Mengevaluasi ${cardsCount} kartu pesawat dari atas ke bawah (Ambang batas: < ${this.hoursCheck} jam)...`);

        // 🚀 STRATEGI UTAMA 2: Jalankan loop satu arah langsung dari indeks 0 hingga akhir tanpa interupsi rescan/break
        for (let i = 0; i < cardsCount; i++) {
            const cardElement = allPlaneCards.nth(i);
            
            if (!(await cardElement.isVisible())) {
                continue;
            }

            // Ambil text isi kartu secara keseluruhan untuk membaca sisa jam terbang
            const cardText = await cardElement.innerText();
            
            // Pengaman Tambahan: Deteksi apakah teks jam terbang di dalam kartu ini sudah menyala merah (.text-danger)
            const hasDangerText = await cardElement.locator('.text-danger').count() > 0;
            
            // Ekstrak angka jam penerbangan sebelum kata hr/hour/hours/jam
            const hourMatch = cardText.match(/(\d+)\s*(?=hr|hour|jam)/i);
            let hoursRemaining = 999; 
            
            if (hourMatch) {
                hoursRemaining = parseInt(hourMatch[1], 10);
            }

            // EVALUASI: Jika jam penerbangan <= hoursCheck (20 jam) ATAU teks jam sudah berwarna merah (.text-danger)
            if (hoursRemaining <= this.hoursCheck || hasDangerText) {
                let alasan = hasDangerText ? "Teks Angka Jam Berwarna Merah" : `Sisa ${hoursRemaining} jam (Di bawah batas ${this.hoursCheck} jam)`;
                console.log(`[Preventif] Klik kartu pesawat indeks ${i} karena: ${alasan}`);

                const boxBefore = await cardElement.boundingBox();
                const viewport = this.page.viewportSize();
                if (boxBefore && viewport && (boxBefore.y + boxBefore.height > viewport.height || boxBefore.y < 0)) {
                    didScroll = true; 
                }

                // Scroll fokus ke elemen kartu target sebelum melakukan klik halus
                await this.humanScrollToElement(cardElement);
                await cardElement.scrollIntoViewIfNeeded();
                await GeneralUtils.randomSleep(400, 800);

                // Gerakkan kursor ke kartu pesawat secara halus dan klik secara acak di area aman kartu
                await GeneralUtils.moveAndClick(this.page, cardElement);
                clicked = true;

                // Jeda ketukan jari manusia antar klik pesawat agar aman dari Anti-Cheat game
                await GeneralUtils.randomSleep(1000, 2000);
            }
        }

        if (clicked) {
            if (didScroll) {
                await this.scrollBackToTop();
            } else {
                await GeneralUtils.randomSleep(1000, 2000);
            }
            
            // Upgrade tombol final bulk check menggunakan moveAndClick terpusat
            const planBulkCheckButton = this.page.getByRole('button', { name: 'Plan bulk check' });
            await GeneralUtils.moveAndClick(this.page, planBulkCheckButton);
            console.log("[Maintenance] Batch bulk check berhasil dieksekusi!");
        } else {
            console.log("[Preventif] Selesai. Semua pesawat dalam kondisi aman di atas batas jam terbang.");
        }
    }
}

