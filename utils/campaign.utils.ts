import { Page } from "@playwright/test";
import { GeneralUtils } from "./general.utils";

export class CampaignUtils {
    page: Page;

    increaseAirlineReputation: boolean = false;
    campaignType: number = 1;
    campaignDuration: number = 4;

    constructor(page: Page) {
        if(process.env.INCREASE_AIRLINE_REPUTATION === 'true') {
            this.increaseAirlineReputation = true;
            this.campaignType = parseInt(process.env.CAMPAIGN_TYPE!);
            this.campaignDuration = parseInt(process.env.CAMPAIGN_DURATION!);
        }

        this.page = page;
    }

    /**
     * Menyimulasi pergerakan kursor mouse yang halus dari posisi saat ini ke koordinat target.
     * Mencegah kursor melompat instan dengan memberikan efek kurva/noise mikro.
     */
    private async humanMouseMove(targetX: number, targetY: number) {
        const steps = Math.floor(Math.random() * 5) + 5; // 5-10 langkah pergerakan kursor
        let currentX = targetX + (Math.random() * 200 - 100);
        let currentY = targetY + (Math.random() * 200 - 100);

        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const noiseX = (Math.random() - 0.5) * 5;
            const noiseY = (Math.random() - 0.5) * 5;
            
            const x = currentX + (targetX - currentX) * t + noiseX;
            const y = currentY + (targetY - currentY) * t + noiseY;

            await this.page.mouse.move(x, y);
            await this.page.waitForTimeout(Math.floor(Math.random() * 20) + 10);
        }
        await this.page.mouse.move(targetX, targetY);
    }

    /**
     * Helper privat untuk menggerakkan mouse ke elemen target secara acak di dalam area kotak,
     * lalu melakukan klik. Menghindari deteksi klik di titik tengah konstan.
     */
    private async moveAndClick(locator: any) {
        const box = await locator.boundingBox();
        if (box) {
            const paddingX = box.width * 0.15;
            const paddingY = box.height * 0.15;

            const randomX = box.x + paddingX + (Math.random() * (box.width - (paddingX * 2)));
            const randomY = box.y + paddingY + (Math.random() * (box.height - (paddingY * 2)));

            await this.humanMouseMove(randomX, randomY);
            await GeneralUtils.randomSleep(200, 500); 
        }
        await GeneralUtils.humanClick(this.page, locator);
    }

    /**
     * 🛠️ SOLUSI UNTUK DROP-DOWN (TIDAK LANGSUNG NEMBAK)
     * Menyimulasi tindakan manusia memilih opsi: Klik kotak drop-down, tunggu, lalu klik opsi di dalamnya.
     */
    private async moveAndSelectOption(selectLocator: any, optionValue: string) {
        // 1. Gerakkan mouse ke elemen kotak drop-down utama lalu klik untuk membukanya
        await this.moveAndClick(selectLocator);
        await GeneralUtils.randomSleep(500, 1000); // Jeda mata manusia melihat pilihan menu keluar

        // 2. Cari elemen opsi (<option>) yang berada di dalam select tersebut berdasarkan value-nya
        // Menggunakan Playwright locator untuk membidik opsi spesifik secara fisik di layar
        const optionLocator = selectLocator.locator(`option[value="${optionValue}"]`);
        
        // 3. Gunakan cara alternatif bawaan Playwright untuk memicu interaksi pilihan drop-down 
        // tapi didahului oleh klik fisik manusia agar event UI-nya terpicu sempurna secara sinkron.
        await selectLocator.selectOption(optionValue);
        
        // Berikan jeda sesaat seolah manusia melepas klik drop-down
        await GeneralUtils.randomSleep(400, 800);
    }

    private async createEcoFriendly() {
        const isEcoFriendExists = await this.page.getByRole('cell', { name: ' Eco friendly' }).isVisible();
        if(!isEcoFriendExists) {
            const newCampaignButton = this.page.getByRole('button', { name: ' New campaign' });
            await this.moveAndClick(newCampaignButton);
            await GeneralUtils.randomSleep(1000, 2000);
            
            const ecoFriendlyCell = this.page.getByRole('cell', { name: 'Eco-friendly Increases' });
            await this.moveAndClick(ecoFriendlyCell);
            await GeneralUtils.randomSleep(1000, 2000);
            
            const buyButton = this.page.getByRole('button', { name: '$' });
            await this.moveAndClick(buyButton);

            console.log("Eco Friendly Campaign Created Successfully!");
        }
    }

    private async createReputation() {
        const campaignType = this.campaignType.toString();
        const durationOption = (Math.floor(this.campaignDuration / 4) || 1).toString();

        const isAirlineReputationExists = await this.page.getByRole('cell', { name: ' Airline reputation' }).isVisible();
        if (!isAirlineReputationExists) {
            const newCampaignButton = this.page.getByRole('button', { name: ' New campaign' });
            await this.moveAndClick(newCampaignButton);
            await GeneralUtils.randomSleep(1000, 2000);
            
            const increaseReputationCell = this.page.getByRole('cell', { name: 'Increase airline reputation' });
            await this.moveAndClick(increaseReputationCell);
            await GeneralUtils.randomSleep(1000, 2000);
            
            // --- 🚀 FITUR SELEKSI DROP-DOWN HUMAN-LIKE BERAKSI ---
            const durationSelect = this.page.locator('#dSelector');
            await this.moveAndSelectOption(durationSelect, durationOption);
            await GeneralUtils.randomSleep(1000, 2000);
            
            const targetCampaignButton = this.page.locator(`tr:has(td:has-text("Campaign ${campaignType}")) .btn-danger`);
            await this.moveAndClick(targetCampaignButton);

            console.log("Increased Airline Reputation Successfully!");
        }
    }

    public async createCampaign() {
        console.log('Create Campaign Started...')

        const marketingButton = this.page.getByRole('button', { name: ' Marketing' });
        await this.moveAndClick(marketingButton);

        await GeneralUtils.randomSleep(1500, 3000);

        await this.createEcoFriendly();
        await GeneralUtils.randomSleep(1500, 3000);

        if(this.increaseAirlineReputation) {
            await this.createReputation();
        }

        console.log('Campaign Created Finished!');
    }
}
