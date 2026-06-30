import { Page } from "@playwright/test";
import { GeneralUtils } from "./general.utils";

export class MaintenanceUtils {
    page: Page;

    constructor(page: Page) {
        this.page = page;
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
        
        // 2. ⏱️ JEDA PSIKOLOGIS: Meniru waktu yang dibutuhkan mata dan otak manusia untuk mencari opsi '30'
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
        
        // --- 🚀 PROSES SELEKSI OPSI '30' SECARA HUMAN-LIKE BERAKSI ---
        console.log("Memilih ambang batas perbaikan 30% dengan jeda pencarian visual...");
        const repairPercentSelect = this.page.locator('#repairPct');
        await this.moveAndSelectOption(repairPercentSelect, '30');
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

        const dangerPlaneCards = this.page.locator('.bg-white:has(.text-danger)');
        const dangerChecksExists = await dangerPlaneCards.first().isVisible();
        
        if (dangerChecksExists) {
            let count = await dangerPlaneCards.count();        
            
            for (let i = 0; i < count; i++) {
                const cardElement = dangerPlaneCards.nth(i);

                const boxBefore = await cardElement.boundingBox();
                const viewport = this.page.viewportSize();
                if (boxBefore && viewport && (boxBefore.y + boxBefore.height > viewport.height || boxBefore.y < 0)) {
                    didScroll = true; 
                }

                await this.humanScrollToElement(cardElement);
                await cardElement.scrollIntoViewIfNeeded();
                await GeneralUtils.randomSleep(400, 800);

                // Gerakkan kursor ke kartu pesawat secara halus dan klik secara acak di area aman kartu
                await GeneralUtils.moveAndClick(this.page, cardElement);
                clicked = true;

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
        }
    }
}
