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
        this.hoursCheck = parseInt(process.env.HOURS_CHECK || '20', 10);
    }

    /**
     * Helper privat untuk membuka panel perencanaan.
     */
    private async openPlanPanel() {
        const planButton = this.page.getByRole('button', { name: ' Plan' });
        await planButton.waitFor({ state: 'visible', timeout: 15000 });
        await GeneralUtils.moveAndClick(this.page, planButton);
    }

    /**
     * SELEKSI DROP-DOWN MANUSIAWI
     */
    private async moveAndSelectOption(selectLocator: any, optionValue: string) {
        await GeneralUtils.moveAndClick(this.page, selectLocator);
        await GeneralUtils.randomSleep(700, 1400); 
        await selectLocator.selectOption(optionValue);
        await GeneralUtils.randomSleep(500, 900);
    }

    /**
     * SIMULASI SMOOTH SCROLLING
     */
    private async chaoticHumanScroll(targetY: number) {
        const steps = Math.floor(Math.random() * 4) + 3; 
        let currentScroll = 0;
        const scrollStyle = Math.floor(Math.random() * 4);
        const totalDistance = targetY > 0 ? targetY + 100 : targetY - 100; 
        const baseDelta = totalDistance / steps;

        for (let j = 0; j < steps; j++) {
            let deltaY = baseDelta;
            let delay = Math.floor(Math.random() * 100) + 50; 

            switch (scrollStyle) {
                case 0: 
                    if (j === Math.floor(steps / 2)) {
                        await GeneralUtils.randomSleep(400, 800); 
                    }
                    break;
                case 1: 
                    deltaY = baseDelta * (0.5 + (j / steps));
                    delay = Math.max(30, delay - (j * 15));
                    break;
                case 2: 
                    deltaY = baseDelta * (1.5 - (j / steps));
                    delay = delay + (j * 20);
                    break;
                case 3: 
                    if (j === steps - 1) {
                        await this.page.mouse.wheel(0, baseDelta + (targetY > 0 ? 80 : -80));
                        await GeneralUtils.randomSleep(300, 600); 
                        await this.page.mouse.wheel(0, targetY > 0 ? -80 : 80);
                        continue;
                    }
                    break;
            }

            await this.page.mouse.wheel(0, deltaY);
            currentScroll += deltaY;
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

    private async scrollBackToTop() {
        console.log("Melakukan scroll balik ke atas secara manusiawi...");
        const upSteps = Math.floor(Math.random() * 3) + 4; 
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
        
        const bulkRepairButton = this.page.getByRole('button', { name: ' Bulk repair' });
        await GeneralUtils.moveAndClick(this.page, bulkRepairButton);
        await GeneralUtils.randomSleep(1200, 2200);
        
        console.log(`Memilih ambang batas perbaikan ${this.repairWear}% berdasarkan konfigurasi .env...`);
        const repairPercentSelect = this.page.locator('#repairPct');
        await this.moveAndSelectOption(repairPercentSelect, this.repairWear);
        await GeneralUtils.randomSleep(1200, 2500);
        
        const noPlaneExists = await this.page.getByText('There are no aircraft worn to').isVisible();
        if (!noPlaneExists) {
            const planBulkRepairButton = this.page.getByRole('button', { name: 'Plan bulk repair' });
            await GeneralUtils.moveAndClick(this.page, planBulkRepairButton);
        }
    }

    public async checkPlanes() {
        await this.openPlanPanel();
        await GeneralUtils.randomSleep(1000, 2000);
        
        const bulkCheckButton = this.page.getByRole('button', { name: ' Bulk check' });
        await GeneralUtils.moveAndClick(this.page, bulkCheckButton);
        
        await GeneralUtils.randomSleep(3000, 4500);
        
        let clickedAny = false;
        let didScroll = false; 
        const maxClicksPerSession = 5; // Batasi maksimal klik beruntun per sesi demi keamanan akun

        console.log(`[Task] Memulai evaluasi kartu pesawat secara preventif (Maksimal per sesi: ${maxClicksPerSession})...`);

        for (let attempt = 0; attempt < maxClicksPerSession; attempt++) {
            // 🚀 STRATEGI UTAMA: Selalu ambil list elemen yang paling baru di setiap awal perulangan
            const allPlaneCards = this.page.locator('.bg-white');
            const cardsCount = await allPlaneCards.count();
            
            let targetCard: any = null;
            let alasanLog = "";
            let targetIndex = -1;

            // Cari kartu pertama yang lolos kriteria kelayakan dari snapshot DOM terbaru
            for (let i = 0; i < cardsCount; i++) {
                const cardElement = allPlaneCards.nth(i);
                
                if (!(await cardElement.isVisible())) {
                    continue;
                }

                const cardText = await cardElement.innerText();
                
                // Jaring pengaman: Cek jika ada class teks bahaya / tombol merah di dalam kartu ini
                const hasDangerText = await cardElement.locator('.text-danger').count() > 0;
                
                // Ekstrak angka jam penerbangan sebelum teks hr/hour/hours
                const hourMatch = cardText.match(/(\d+)\s*(?=hr|hour)/i);
                let hoursRemaining = 999; 
                
                if (hourMatch) {
                    hoursRemaining = parseInt(hourMatch[1], 10);
                }

                // Periksa apakah jam berada di bawah batas .env ATAU memiliki indikator merah
                if (hoursRemaining <= this.hoursCheck || hasDangerText) {
                    targetCard = cardElement;
                    targetIndex = i;
                    alasanLog = hasDangerText ? "Teks Merah Terdeteksi" : `Sisa ${hoursRemaining} jam (Batas .env: ${this.hoursCheck} jam)`;
                    break; // Keluar dari pencarian internal untuk mengeklik target terpilih ini
                }
            }

            // Jika dari pengecekan ulang tidak ditemukan lagi pesawat kritis, hentikan pencarian seluruhnya
            if (!targetCard) {
                break;
            }

            console.log(`[Preventif] Menandai pesawat indeks ${targetIndex} karena: ${alasanLog}`);

            const boxBefore = await targetCard.boundingBox();
            const viewport = this.page.viewportSize();
            if (boxBefore && viewport && (boxBefore.y + boxBefore.height > viewport.height || boxBefore.y < 0)) {
                didScroll = true; 
            }

            await this.humanScrollToElement(targetCard);
            await targetCard.scrollIntoViewIfNeeded();
            await GeneralUtils.randomSleep(400, 800);

            // Jalankan klik halus ke pesawat target
            await GeneralUtils.moveAndClick(this.page, targetCard);
            clickedAny = true;

            // Jeda kamuflase: memberi jeda bagi server game untuk merefresh UI kartu sebelum perulangan berikutnya
            await GeneralUtils.randomSleep(1500, 3000);
        }

        if (clickedAny) {
            if (didScroll) {
                await this.scrollBackToTop();
            } else {
                await GeneralUtils.randomSleep(1000, 2000);
            }
            
            const planBulkCheckButton = this.page.getByRole('button', { name: 'Plan bulk check' });
            await GeneralUtils.moveAndClick(this.page, planBulkCheckButton);
            console.log("[Maintenance] Berhasil memproses batch pemeriksaan preventif.");
        } else {
            console.log("[Preventif] Semua armada aman, belum ada pesawat yang menyentuh batas kritis jam atau teks merah.");
        }
    }
}
