import { test } from '@playwright/test';
import { GeneralUtils } from '../utils/general.utils';
import { FuelUtils } from '../utils/fuel.utils';
import { CampaignUtils } from '../utils/campaign.utils';
import { FleetUtils } from '../utils/fleet.utils';
import { MaintenanceUtils } from '../utils/maintenance.utils';
import * as fs from 'fs';
import * as path from 'path';

require('dotenv').config();

test('All Operations', async ({ page }) => {
  // Timeout 3 menit karena simulasi gerakan kursor dan delay manusia butuh waktu lebih lama
  test.setTimeout(180000);

  // ==============================================================
  // ⏱️ LOGIKA AUTOMATIC KEEPALIVE LOG (.TXT) - HANYA 1X DI TANGGAL 1
  // ==============================================================
  const hariIni = new Date();
  const tanggalUTC = hariIni.getUTCDate();

  if (tanggalUTC === 1) {
    const formatBulanIni = `${hariIni.getUTCFullYear()}-${String(hariIni.getUTCMonth() + 1).padStart(2, '0')}`;
    const logFilePath = path.join(__dirname, '../last-commit.txt'); 

    let sudahCommitBulanIni = false;

    if (fs.existsSync(logFilePath)) {
      const isiLog = fs.readFileSync(logFilePath, 'utf8');
      if (isiLog.includes(formatBulanIni)) {
        sudahCommitBulanIni = true;
      }
    }

    if (!sudahCommitBulanIni) {
      console.log(`[Keepalive] Sesi pertama Tanggal 1 terdeteksi. Menulis log baru untuk bulan: ${formatBulanIni}`);
      const kontenLogBaru = `Last Successful Keepalive Commit: ${formatBulanIni} (Executed at: ${hariIni.toISOString()} WIB/UTC)\n`;
      fs.writeFileSync(logFilePath, kontenLogBaru, 'utf8');
      console.log("[Keepalive] File 'last-commit.txt' berhasil diperbarui. Langkah .yml akhir yang akan melakukan push.");
    } else {
      console.log(`[Keepalive] Bot sudah menulis log sukses untuk bulan ${formatBulanIni} pada sesi sebelumnya. Melewati pembaruan file agar git bersih.`);
    }
  } else {
    console.log(`[Keepalive] Hari ini Tanggal ${tanggalUTC} UTC. Pembaruan log keepalive dilewati.`);
  }
  // ==============================================================

  // Variable Initialization
  const fuelUtils = new FuelUtils(page);
  const generalUtils = new GeneralUtils(page);
  const campaignUtils = new CampaignUtils(page);
  const fleetUtils = new FleetUtils(page);
  const maintenanceUtils = new MaintenanceUtils(page);
  // End //

  /**
   * FIX KOREKSI 1: Mengubah penutupan menu area kosong atas layar menjadi human-like.
   * Menggunakan fungsi pergerakan mouse melengkung dan mengacak durasi klik (bukan teleportasi kaku).
   */
  const clickBlankSpaceTop = async () => {
    console.log('Mengeklik area kosong di atas layar untuk menutup menu...');
    const randomX = Math.floor(Math.random() * (600 - 200 + 1) + 200);
    const randomY = Math.floor(Math.random() * (30 - 15 + 1) + 15);
    
    // Gunakan fungsi mouse melengkung dari GeneralUtils
    await GeneralUtils.humanMouseMove(page, randomX, randomY);
    await GeneralUtils.randomSleep(150, 400); // Jeda sesaat ancang-ancang sebelum ketuk layar
    
    await page.mouse.down();
    await GeneralUtils.randomSleep(80, 180); // Durasi tahan klik bervariasi
    await page.mouse.up();
  };

  // Kumpulan lokator ubin menu utama di peta untuk pancingan anti-freeze
  const menuTiles = {
    fuel: page.locator('#mapMaint > img').first(),
    maintenance: page.locator('div:nth-child(4) > #mapMaint > img'),
    campaign: page.locator('div:nth-child(5) > #mapMaint > img'),
    depart: page.locator('#mapRoutes').getByRole('img')
  };

  // Fungsi pembantu untuk membuka-tutup menu lain secara acak jika modul utama freeze/lag
  const triggerRandomMenuPoke = async (currentMenuKey: string) => {
    const keys = Object.keys(menuTiles).filter(key => key !== currentMenuKey);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    
    console.log(`[Anti-Freeze] Pancingan aktif! Membuka sekilas menu [${randomKey}] untuk me-refresh halaman...`);
    await clickBlankSpaceTop();
    await GeneralUtils.randomSleep(1000, 1800);
    
    // FIX KOREKSI 2: Upgrade klik ubin pancingan menjadi moveAndClick yang acak area amannya
    await GeneralUtils.moveAndClick(page, menuTiles[randomKey]);
    await GeneralUtils.randomSleep(2000, 3500);
    
    // Keluar seketika tanpa melakukan operasi apa pun di dalamnya
    await clickBlankSpaceTop();
    await GeneralUtils.randomSleep(1200, 2000);
  };

  // 1. Login (Bypass Stealth & Keystroke Dynamics terpusat)
  await generalUtils.login(page);
  await GeneralUtils.randomSleep(5000, 8000);

  // ==================== DEFINISI FUNGSI MODUL ====================

  const runFuel = async (attempt = 1) => {
    console.log(`[Task] Memulai Modul Bahan Bakar & CO2 (Percobaan ${attempt})...`);
    const currentBalance = await fuelUtils.getCurrentBalance();
    console.log('[Task] Current account balance before opening Fuel: ' + currentBalance);

    // FIX KOREKSI 3: Buka ubin menu Fuel dengan pergerakan kursor melengkung acak
    await GeneralUtils.moveAndClick(page, menuTiles.fuel);
    await GeneralUtils.randomSleep(2000, 4000);

    try {
      // Validasi penanda halaman fuel sukses dimuat
      await page.getByPlaceholder('Amount to purchase').waitFor({ state: 'visible', timeout: 8000 });
    } catch (error) {
      console.log('[Task] Modul Fuel gagal terbuka/freeze.');
      if (attempt < 2) {
        await triggerRandomMenuPoke('fuel');
        await runFuel(attempt + 1);
        return;
      } else {
        throw new Error('Modul Fuel tetap gagal dimuat setelah pemancingan menu.');
      }
    }
    
    await fuelUtils.buyFuel();
    await GeneralUtils.randomSleep(1500, 3000);

    // FIX KOREKSI 4: Klik tab CO2 secara human-like
    const co2TabButton = page.getByRole('button', { name: ' Co2' });
    await GeneralUtils.moveAndClick(page, co2TabButton);
    await GeneralUtils.randomSleep(2000, 4000);
    
    await fuelUtils.buyCo2();
    await GeneralUtils.randomSleep(1500, 3000);

    await clickBlankSpaceTop();
    console.log('[Task] Modul Bahan Bakar Selesai.');
  };

  const runMaintenance = async (attempt = 1) => {
    console.log(`[Task] Memulai Modul Pemeliharaan & Perbaikan Pesawat (Percobaan ${attempt})...`);
    await clickBlankSpaceTop();
    await GeneralUtils.randomSleep(1000, 1800);

    // FIX KOREKSI 5: Buka ubin menu Maintenance secara human-like
    await GeneralUtils.moveAndClick(page, menuTiles.maintenance);

    try {
      await page.getByRole('button', { name: ' Plan' }).waitFor({ state: 'visible', timeout: 15000 });
    } catch (error) {
      console.log('[Task] Modul Maintenance gagal terbuka/freeze.');
      if (attempt < 2) {
        await triggerRandomMenuPoke('maintenance');
        await runMaintenance(attempt + 1);
        return;
      } else {
        throw new Error('Modul Maintenance tetap gagal dimuat setelah pemancingan menu.');
      }
    }

    await GeneralUtils.randomSleep(1200, 2200);
    await maintenanceUtils.checkPlanes();
    await GeneralUtils.randomSleep(2000, 4000);
    
    await maintenanceUtils.repairPlanes();
    await GeneralUtils.randomSleep(2000, 4000);

    await clickBlankSpaceTop();
    console.log('[Task] Modul Pemeliharaan Selesai.');
  };

  const runCampaign = async (attempt = 1) => {
    console.log(`[Task] Memulai Modul Kampanye Pemasaran (Sebelum Depart) (Percobaan ${attempt})...`);
    
    // FIX KOREKSI 6: Buka ubin menu Kampanye secara human-like
    await GeneralUtils.moveAndClick(page, menuTiles.campaign);
    await GeneralUtils.randomSleep(2500, 4500);

    try {
      // Pastikan tombol internal marketing siap diakses
      await page.getByRole('button', { name: ' Marketing' }).waitFor({ state: 'visible', timeout: 8000 });
    } catch (error) {
      console.log('[Task] Modul Kampanye gagal terbuka/freeze.');
      if (attempt < 2) {
        await triggerRandomMenuPoke('campaign');
        await runCampaign(attempt + 1);
        return;
      } else {
        throw new Error('Modul Kampanye tetap gagal dimuat setelah pemancingan menu.');
      }
    }
    
    await campaignUtils.createCampaign();
    await GeneralUtils.randomSleep(1500, 3000);

    await clickBlankSpaceTop();
    console.log('[Task] Modul Kampanye Pemasaran Selesai.');
  };

  const runDepart = async () => {
    console.log('[Task] Memulai Modul Pelepasan Armada (Depart All)...');
    
    // FIX KOREKSI 7: Klik ubin menu Depart dengan gerakan mouse melengkung
    await GeneralUtils.moveAndClick(page, menuTiles.depart);
    
    // Jeda stabilisasi menunggu animasi panel rute terbuka sempurna
    await GeneralUtils.randomSleep(4000, 6000);

    try {
      // Jalankan fungsi depart bawaan fleetUtils (yang di dalamnya sudah di-upgrade)
      await fleetUtils.departPlanes();
      await GeneralUtils.randomSleep(2000, 4000);
    } catch (error) {
      console.log('[Task] Eksekusi di dalam menu depart mendeteksi kondisi normal/selesai.');
    }

    // Keluar dari panel rute menuju peta utama
    await clickBlankSpaceTop();
    console.log('[Task] Modul Pelepasan Armada Selesai.');
  };

  // ==================== LOGIKA PENGACAKAN SEMI-STATIS ====================
  const initialTasks = [runFuel, runMaintenance];

  // Acak urutan antara Fuel atau Maintenance duluan
  for (let i = initialTasks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [initialTasks[i], initialTasks[j]] = [initialTasks[j], initialTasks[i]];
  }

  // --- EKSEKUSI ALUR AMAN ---
  console.log('--- Memulai Urutan Operasi Maskapai ---');

  // 1. Jalankan tugas awal yang sudah diacak (Fuel / Maintenance)
  for (const task of initialTasks) {
    await task();
    // Jeda ditingkatkan ke 5-9 detik agar transisi penutupan pop-up menu stabil di server GitHub Actions
    await GeneralUtils.randomSleep(5000, 9000); 
  }

  // 2. Kunci: Selalu jalankan Marketing tepat sebelum armada terbang
  await runCampaign();
  await GeneralUtils.randomSleep(5000, 8000);

  // 3. Kunci: Terbangkan semua pesawat di bagian paling akhir
  await runDepart();

  console.log('--- Seluruh Operasi Sukses Dieksekusi ---');

  // Selesai
  await GeneralUtils.randomSleep(3000, 5000);
  page.close();
});

