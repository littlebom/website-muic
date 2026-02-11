import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/mysql-direct";
import { addCacheHeaders } from "@/lib/cache-headers";
import fs from 'fs';
import path from 'path';

/**
 * Update .env.local file with new API key
 */
async function updateEnvFile(geminiApiKey: string) {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';

    // Read existing .env.local if it exists
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    const keyName = 'GEMINI_API_KEY';
    const keyPattern = new RegExp(`^${keyName}=.*$`, 'm');

    if (!geminiApiKey) {
      // Remove key if empty
      if (keyPattern.test(envContent)) {
        envContent = envContent.replace(keyPattern, '');
        // Remove empty lines that might be left
        envContent = envContent.replace(/^\s*[\r\n]/gm, '');
      }
      process.env.GEMINI_API_KEY = '';
      console.log('[Settings] Removed GEMINI_API_KEY from .env.local');
    } else {
      // Update or add key
      if (keyPattern.test(envContent)) {
        envContent = envContent.replace(keyPattern, `${keyName}=${geminiApiKey}`);
      } else {
        envContent += `\n${keyName}=${geminiApiKey}\n`;
      }
      process.env.GEMINI_API_KEY = geminiApiKey;
      console.log('[Settings] Updated .env.local with new GEMINI_API_KEY');
    }

    // Write back to file
    fs.writeFileSync(envPath, envContent, 'utf-8');
    return true;
  } catch (error) {
    console.error('[Settings] Error updating .env.local:', error);
    return false;
  }
}

export async function GET() {
  try {
    const settings = await queryOne(
      'SELECT * FROM webapp_settings LIMIT 1'
    );

    const response = settings
      ? NextResponse.json(settings)
      : NextResponse.json({
        siteName: "Thai MOOC",
        siteLogo: "",
        contactEmail: "contact@thaimooc.ac.th",
        contactPhone: "02-123-4567",
        address: "กรุงเทพมหานคร ประเทศไทย",
        facebookUrl: null,
        twitterUrl: null,
        youtubeUrl: null,
        instagramUrl: null,
        lineUrl: null,
      });

    // Settings rarely change, but for admin panel we want fresh data
    addCacheHeaders(response.headers, 'NO_CACHE');

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch settings",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Settings API] Received body:', JSON.stringify(body, null, 2)); // Debug log

    // Handle Gemini API Key update
    // If body.geminiApiKey is present (even empty string), update it
    if (body.geminiApiKey !== undefined && body.geminiApiKey !== '••••••••••••••••') {
      const updated = await updateEnvFile(body.geminiApiKey);
      if (!updated) {
        console.warn('[Settings] Failed to update .env.local, but continuing...');
      }
    }
    // Try to find existing settings
    let settings = await queryOne<{ id: string }>(
      'SELECT id FROM webapp_settings LIMIT 1'
    );

    const now = new Date();

    if (!settings) {
      // Create new settings if none exist
      const id = `settings-${Date.now()}`;
      await execute(
        `INSERT INTO webapp_settings (
          id, siteName, siteLogo, footerLogo, contactEmail, contactPhone, address,
          aboutUs, aboutUsEn, mapUrl,
          facebookUrl, twitterUrl, youtubeUrl, instagramUrl, lineUrl,
          geminiApiKey, classroomUrl,
          defaultCourseThumbnail, defaultInstitutionLogo, defaultNewsImage,
          chatbotEnabled, lineQrCodeUrl, lineOfficialId,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          body.siteName || "Thai MOOC",
          body.siteLogo || "",
          body.footerLogo || null,
          body.contactEmail || "contact@thaimooc.ac.th",
          body.contactPhone || "02-123-4567",
          body.address || "กรุงเทพมหานคร ประเทศไทย",
          body.aboutUs || null,
          body.aboutUsEn || null,
          body.mapUrl || null,
          body.facebookUrl || null,
          body.twitterUrl || null,
          body.youtubeUrl || null,
          body.instagramUrl || null,
          body.lineUrl || null,
          body.geminiApiKey || null,
          body.classroomUrl || null,
          body.defaultCourseThumbnail || null,
          body.defaultInstitutionLogo || null,
          body.defaultNewsImage || null,
          body.chatbotEnabled ?? true,
          body.lineQrCodeUrl || null,
          body.lineOfficialId || null,
          now,
          now
        ]
      );

      settings = await queryOne('SELECT * FROM webapp_settings WHERE id = ?', [id]);
    } else {
      // Update existing settings
      const updates: string[] = [];
      const values: any[] = [];

      if (body.siteName !== undefined) {
        updates.push('siteName = ?');
        values.push(body.siteName);
      }
      if (body.siteLogo !== undefined) {
        updates.push('siteLogo = ?');
        values.push(body.siteLogo);
      }
      if (body.footerLogo !== undefined) {
        updates.push('footerLogo = ?');
        values.push(body.footerLogo);
      }
      if (body.contactEmail !== undefined) {
        updates.push('contactEmail = ?');
        values.push(body.contactEmail);
      }
      if (body.contactPhone !== undefined) {
        updates.push('contactPhone = ?');
        values.push(body.contactPhone);
      }
      if (body.address !== undefined) {
        updates.push('address = ?');
        values.push(body.address);
      }
      if (body.addressEn !== undefined) {
        updates.push('addressEn = ?');
        values.push(body.addressEn);
      }
      if (body.aboutUs !== undefined) {
        updates.push('aboutUs = ?');
        values.push(body.aboutUs);
      }
      if (body.aboutUsEn !== undefined) {
        updates.push('aboutUsEn = ?');
        values.push(body.aboutUsEn);
      }
      if (body.mapUrl !== undefined) {
        updates.push('mapUrl = ?');
        values.push(body.mapUrl);
      }
      if (body.facebookUrl !== undefined) {
        updates.push('facebookUrl = ?');
        values.push(body.facebookUrl);
      }
      if (body.twitterUrl !== undefined) {
        updates.push('twitterUrl = ?');
        values.push(body.twitterUrl);
      }
      if (body.youtubeUrl !== undefined) {
        updates.push('youtubeUrl = ?');
        values.push(body.youtubeUrl);
      }
      if (body.instagramUrl !== undefined) {
        updates.push('instagramUrl = ?');
        values.push(body.instagramUrl);
      }
      if (body.lineUrl !== undefined) {
        updates.push('lineUrl = ?');
        values.push(body.lineUrl);
      }
      if (body.geminiApiKey !== undefined && body.geminiApiKey !== '••••••••••••••••') {
        updates.push('geminiApiKey = ?');
        values.push(body.geminiApiKey);
      }
      if (body.classroomUrl !== undefined) {
        updates.push('classroomUrl = ?');
        values.push(body.classroomUrl);
      }
      if (body.preloaderEnabled !== undefined) {
        updates.push('preloaderEnabled = ?');
        values.push(body.preloaderEnabled);
      }
      if (body.preloaderTitle !== undefined) {
        updates.push('preloaderTitle = ?');
        values.push(body.preloaderTitle);
      }
      if (body.preloaderSubtitle !== undefined) {
        updates.push('preloaderSubtitle = ?');
        values.push(body.preloaderSubtitle);
      }
      if (body.preloaderPrimaryColor !== undefined) {
        updates.push('preloaderPrimaryColor = ?');
        values.push(body.preloaderPrimaryColor);
      }
      if (body.preloaderBackgroundColor !== undefined) {
        updates.push('preloaderBackgroundColor = ?');
        values.push(body.preloaderBackgroundColor);
      }
      if (body.defaultCourseThumbnail !== undefined) {
        updates.push('defaultCourseThumbnail = ?');
        values.push(body.defaultCourseThumbnail);
      }
      if (body.defaultInstitutionLogo !== undefined) {
        updates.push('defaultInstitutionLogo = ?');
        values.push(body.defaultInstitutionLogo);
      }
      if (body.defaultNewsImage !== undefined) {
        updates.push('defaultNewsImage = ?');
        values.push(body.defaultNewsImage);
      }
      if (body.chatbotEnabled !== undefined) {
        updates.push('chatbotEnabled = ?');
        values.push(body.chatbotEnabled);
      }
      if (body.lineQrCodeUrl !== undefined) {
        updates.push('lineQrCodeUrl = ?');
        values.push(body.lineQrCodeUrl);
      }
      if (body.lineOfficialId !== undefined) {
        updates.push('lineOfficialId = ?');
        values.push(body.lineOfficialId);
      }

      // SMTP Configuration
      if (body.smtpHost !== undefined) {
        updates.push('smtpHost = ?');
        values.push(body.smtpHost);
      }
      if (body.smtpPort !== undefined) {
        updates.push('smtpPort = ?');
        values.push(body.smtpPort);
      }
      if (body.smtpUsername !== undefined) {
        updates.push('smtpUsername = ?');
        values.push(body.smtpUsername);
      }
      if (body.smtpPassword !== undefined) {
        updates.push('smtpPassword = ?');
        values.push(body.smtpPassword);
      }
      if (body.smtpFromEmail !== undefined) {
        updates.push('smtpFromEmail = ?');
        values.push(body.smtpFromEmail);
      }
      if (body.smtpFromName !== undefined) {
        updates.push('smtpFromName = ?');
        values.push(body.smtpFromName);
      }
      if (body.smtpSecure !== undefined) {
        updates.push('smtpSecure = ?');
        values.push(body.smtpSecure);
      }

      updates.push('updatedAt = ?');
      values.push(now);

      values.push(settings.id);

      await execute(
        `UPDATE webapp_settings SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      settings = await queryOne('SELECT * FROM webapp_settings WHERE id = ?', [settings.id]);
    }

    return NextResponse.json({
      success: true,
      settings: settings,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update settings",
      },
      { status: 500 }
    );
  }
}
