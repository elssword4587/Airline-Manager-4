import { Page } from "@playwright/test";
import { GeneralUtils } from "./general.utils";

export class FleetUtils {
    page : Page;
    maxTry : number;

    constructor(page : Page) {
        this.page = page;
        this.maxTry = 8;
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
     * lalu melakukan klik fisik manusiawi (tidak konstan di tengah box).
     */
    private async moveAndClick(locator: any) {
        const box = await locator.boundingBox();
        if (box) {
            const paddingX = box.width * 0.15;
            const paddingY = box.height * 0.15;

            // Mengacak titik tujuan di dalam area aman kotak tombol
            const randomX = box.x + paddingX + (Math.random() * (box.width - (paddingX * 2)));
            const randomY = box.y + paddingY + (Math.random() * (box.height - (paddingY * 2)));

            await this.humanMouseMove(randomX, randomY);
            await GeneralUtils.randomSleep(200, 500); // Jeda sesaat setelah mouse mendarat
        }
        await GeneralUtils.humanClick(this.page, locator);
    }

    public async departPlanes() {
        let departAllVisible = await this.page.locator('#departAll').isVisible();
        console.log('Looking if there are any planes to be departed...')

        let count = 0; 
        while(departAllVisible && count < this.maxTry) {
            console.log('Departing 20 or less...');

            let departAll = this.page.locator('#departAll');
            
            // Tunggu respons API rute penerbangan asli selesai diproses jaringan,
            // dikombinasikan dengan fungsi moveAndClick yang meluncur halus secara acak.
            await Promise.all([
                this.page.waitForResponse(response => 
                    response.url().includes('route') && response.status() === 200, 
                    { timeout: 10000 }
                ).catch(() => console.log('Timeout waiting for API, doing fallback sleep')),
                this.moveAndClick(departAll)
            ]);

            // Tambahkan jeda santai manusia pasca-klik (proses berpikir/animasi)
            await GeneralUtils.randomSleep(1500, 3000);
            
            const cantDepartPlane = await this.page.getByText('×Unable to departSome A/C was').isVisible();
            if(cantDepartPlane)
                break;

            departAllVisible = await this.page.locator('#departAll').isVisible();
            count++;
        }
        console.log('Departed operations finished.');
    }
}
