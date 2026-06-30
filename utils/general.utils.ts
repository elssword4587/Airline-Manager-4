import { Page } from "@playwright/test";

require('dotenv').config();

export class GeneralUtils {
    username : string;
    password : string;
    page : Page;

    constructor(page : Page) {
        this.username = process.env.EMAIL!;
        this.password = process.env.PASSWORD!;
        this.page = page;
    }

    public static async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public static async randomSleep(min: number, max: number) {
        const ms = Math.floor(Math.random() * (max - min + 1) + min);
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 🚀 PUSAT SIMULASI MOUSE MANUSIA (GLOBAL)
     * Menggerakkan kursor mouse secara halus dengan lintasan melengkung dan getaran mikro (noise).
     */
    public static async humanMouseMove(page: Page, targetX: number, targetY: number) {
        const steps = Math.floor(Math.random() * 5) + 6; // 6-10 langkah pergeseran koordinat
        
        // Simulasikan titik awal acak di sekitar target sebelum bergerak (jika posisi awal mouse belum set)
        let currentX = targetX + (Math.random() * 200 - 100);
        let currentY = targetY + (Math.random() * 200 - 100);

        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            
            // Rumus kelengkungan fana (noise mikro tangan gemetar)
            const noiseX = (Math.random() - 0.5) * 5;
            const noiseY = (Math.random() - 0.5) * 5;
            
            const x = currentX + (targetX - currentX) * t + noiseX;
            const y = currentY + (targetY - currentY) * t + noiseY;

            await page.mouse.move(x, y);
            // Jeda mikro antar koordinat agar pergeserannya terlihat organik
            await page.waitForTimeout(Math.floor(Math.random() * 15) + 10);
        }
        
        // Pastikan kursor benar-benar mendarat tepat di titik tujuan akhir
        await page.mouse.move(targetX, targetY);
    }

    /**
     * 🚀 PUSAT SELEKSI KLIK MANUSIA (GLOBAL)
     * Menggerakkan mouse ke elemen target secara acak di dalam area kotak aman (padding 15%),
     * lalu menekan tombol klik dengan durasi penekanan acak (mouse down & up).
     */
    public static async moveAndClick(page: Page, locator: any) {
        await locator.waitFor({ state: 'visible', timeout: 10000 });
        const box = await locator.boundingBox();
        
        if (box) {
            // Beri batas aman padding 15% dari tepi kotak agar tidak meleset keluar border
            const paddingX = box.width * 0.15;
            const paddingY = box.height * 0.15;

            // Mengacak titik pendaratan klik di dalam area aman kotak tombol/input
            const randomX = box.x + paddingX + (Math.random() * (box.width - (paddingX * 2)));
            const randomY = box.y + paddingY + (Math.random() * (box.height - (paddingY * 2)));

            // Jalankan pergerakan mouse melengkung menuju titik acak tersebut
            await this.humanMouseMove(page, randomX, randomY);
            await this.randomSleep(200, 500); // Jeda sesaat setelah mouse sampai (proses berpikir)

            // Lakukan klik fisik (menahan tombol mouse sesaat lalu melepasnya)
            await page.mouse.down();
            await this.randomSleep(80, 220); // Durasi menekan tombol mouse (80-220ms)
            await page.mouse.up();
        } else {
            // Fallback darurat jika bounding box gagal dideteksi
            await locator.click();
        }
    }

    /**
     * Metode fallback lama tetap dipertahankan agar tidak merusak dependensi kode lain jika ada,
     * tapi diarahkan langsung menggunakan teknologi moveAndClick yang baru.
     */
    public static async humanClick(page: Page, selectorOrLocator: any) {
        const locator = typeof selectorOrLocator === 'string' ? page.locator(selectorOrLocator) : selectorOrLocator;
        await this.moveAndClick(page, locator);
    }

    public async login(page: Page) {
        console.log('Logging in with enhanced keystroke and mouse dynamics...')

        await page.goto('https://www.airlinemanager.com/');
        await GeneralUtils.randomSleep(3000, 5000); // Manusia menunggu loading web selesai sepenuhnya

        // Gerakkan mouse melengkung dan klik "PLAY FREE NOW"
        const playFreeButton = page.getByRole('button', { name: 'PLAY FREE NOW' });
        await GeneralUtils.moveAndClick(page, playFreeButton);
        await GeneralUtils.randomSleep(2000, 3500);

        // Gerakkan mouse melengkung dan klik "Log in" pengalih modal
        const loginMenuButton = page.getByRole('button', { name: 'Log in' });
        await GeneralUtils.moveAndClick(page, loginMenuButton);
        await GeneralUtils.randomSleep(1500, 2500);

        // --- Proses Pengisian Email ---
        const emailInput = page.locator('#lEmail');
        await GeneralUtils.moveAndClick(page, emailInput);
        await GeneralUtils.randomSleep(600, 1200);
        // Mengetik email satu per satu karakter dengan delay acak 50-150ms
        await emailInput.pressSequentially(this.username, { delay: Math.floor(Math.random() * 100) + 50 });
        await GeneralUtils.randomSleep(800, 1800);
        
        // --- Proses Pengisian Password ---
        const passwordInput = page.locator('#lPass');
        await GeneralUtils.moveAndClick(page, passwordInput);
        await GeneralUtils.randomSleep(500, 1100);
        // Mengetik password dengan dynamic delay
        await passwordInput.pressSequentially(this.password, { delay: Math.floor(Math.random() * 100) + 50 });
        await GeneralUtils.randomSleep(1200, 2800); // Jeda ragu-ragu sesaat sebelum menekan submit final

        // Gerakkan mouse melengkung dan klik tombol submit "Log In" final
        const submitLoginButton = page.getByRole('button', { name: 'Log In', exact: true });
        await GeneralUtils.moveAndClick(page, submitLoginButton);
        
        console.log('Logged in successfully!');
    }
}
