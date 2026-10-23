import supabase from '../lib/supabaseClient';
import { uploadDataUrlAsset } from './storage';
import { Profile, ProjectStatusConfig } from '../types';
import { MOBILE_UI_SCALE_DEFAULT, normalizeMobileUiScale } from '../utils/mobileUiScale';

const TABLE = 'profiles';

export const PROFILE_COLUMNS = 'id, admin_user_id, full_name, email, phone, company_name, website, instagram, address, bank_account, authorized_signer, id_number, bio, income_categories, expense_categories, project_types, event_types, asset_categories, sop_categories, package_categories, lead_sources, project_status_config, notification_settings, security_settings, briefing_template, terms_and_conditions, logo_base64, signature_base64, brand_color, public_page_config, package_share_template, booking_form_template, chat_templates, billing_templates, invoice_share_template, receipt_share_template, expense_share_template, portal_share_template, checklist_templates, contract_template, mobile_ui_scale';

const TEMPLATE_ENVELOPE_KEYS = [
  'bookingFormTemplate',
  'chatTemplates',
  'billingTemplates',
  'invoiceShareTemplate',
  'receiptShareTemplate',
  'expenseShareTemplate',
  'portalShareTemplate',
  'checklistTemplates',
] as const;

function asJsonObject<T = any>(value: any): T | null {
  if (!value) return null;
  if (typeof value === 'object') return value as T;
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { return null; }
  }
  return null;
}

function getTemplateEnvelope(value: any): Record<string, any> | null {
  const parsed = asJsonObject<Record<string, any>>(value);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  return TEMPLATE_ENVELOPE_KEYS.some(key => key in parsed) ? parsed : null;
}

function fromRow(row: any): Profile {
  const templateEnvelope = getTemplateEnvelope(row.booking_form_template);
  return {
    id: row.id,
    adminUserId: row.admin_user_id || '',
    fullName: row.full_name || '',
    email: row.email || '',
    phone: row.phone || '',
    companyName: row.company_name || '',
    website: row.website || '',
    instagram: row.public_page_config?.socialMedia?.instagram || row.instagram || undefined,
    tiktok: row.public_page_config?.socialMedia?.tiktok || row.tiktok || undefined,
    facebook: row.public_page_config?.socialMedia?.facebook || row.facebook || undefined,
    youtube: row.public_page_config?.socialMedia?.youtube || row.youtube || undefined,
    secondaryPhone: row.public_page_config?.secondaryPhone || row.secondary_phone || undefined,
    address: row.address || '',
    bankAccount: row.bank_account || '',
    authorizedSigner: row.authorized_signer || '',
    idNumber: row.id_number || undefined,
    bio: row.bio || '',
    incomeCategories: row.income_categories || [],
    expenseCategories: row.expense_categories || [],
    projectTypes: row.project_types || [],
    eventTypes: row.event_types || [],
    assetCategories: row.asset_categories || [],
    sopCategories: row.sop_categories || [],
    packageCategories: row.package_categories || [],
    leadSources: row.lead_sources || [],
    projectStatusConfig: (row.public_page_config?.projectStatusConfig ?? row.project_status_config ?? []) as ProjectStatusConfig[],
    notificationSettings: row.notification_settings && typeof row.notification_settings === 'object'
      ? { newProject: !!row.notification_settings.newProject, paymentConfirmation: !!row.notification_settings.paymentConfirmation, deadlineReminder: !!row.notification_settings.deadlineReminder }
      : { newProject: true, paymentConfirmation: true, deadlineReminder: true },
    securitySettings: row.security_settings && typeof row.security_settings === 'object'
      ? { twoFactorEnabled: !!row.security_settings.twoFactorEnabled }
      : { twoFactorEnabled: false },
    briefingTemplate: row.briefing_template || '',
    termsAndConditions: row.terms_and_conditions || undefined,
    logoBase64: row.logo_base64 || undefined,
    signatureBase64: row.signature_base64 || undefined,
    brandColor: row.brand_color || undefined,
    publicPageConfig: row.public_page_config ? {
      template: row.public_page_config.template || 'classic',
      title: row.public_page_config.title || 'Filda Makeup',
      introduction: row.public_page_config.introduction || '',
      galleryImages: row.public_page_config.galleryImages || [],
      backgroundImages: row.public_page_config.backgroundImages || {},
      pricelistPdfUrl: row.public_page_config.pricelistPdfUrl || undefined,
      regionPricelists: row.public_page_config.regionPricelists || undefined,
      packageTerms: row.public_page_config.packageTerms || undefined,
      projectStatusConfig: row.public_page_config.projectStatusConfig || undefined,
      hiddenPackageRegions: row.public_page_config.hiddenPackageRegions || undefined,
      packageOrder: row.public_page_config.packageOrder || undefined,
      addOnOrder: row.public_page_config.addOnOrder || undefined,
      attireOrder: row.public_page_config.attireOrder || undefined,
      socialMedia: row.public_page_config.socialMedia || undefined,
      secondaryPhone: row.public_page_config.secondaryPhone || undefined,
    } : {
      template: (row.public_page_template || 'classic') as any,
      title: row.public_page_title || 'Filda Makeup',
      introduction: row.public_page_introduction || '',
      galleryImages: [],
      backgroundImages: {},
      pricelistPdfUrl: undefined,
      regionPricelists: undefined,
      packageTerms: undefined,
      hiddenPackageRegions: undefined,
      packageOrder: undefined,
      addOnOrder: undefined,
      attireOrder: undefined,
      socialMedia: undefined,
      secondaryPhone: undefined,
    },
    packageShareTemplate: row.package_share_template || undefined,
    bookingFormTemplate: templateEnvelope
      ? (typeof templateEnvelope.bookingFormTemplate === 'string' ? templateEnvelope.bookingFormTemplate : undefined)
      : (row.booking_form_template || undefined),
    // Prefer dedicated column; else, fallback to booking_form_template JSON envelope { chatTemplates: [...] }
    chatTemplates: row.chat_templates || (templateEnvelope?.chatTemplates ?? []),
    billingTemplates: templateEnvelope?.billingTemplates ?? undefined,
    invoiceShareTemplate: templateEnvelope?.invoiceShareTemplate ?? undefined,
    receiptShareTemplate: templateEnvelope?.receiptShareTemplate ?? undefined,
    expenseShareTemplate: templateEnvelope?.expenseShareTemplate ?? undefined,
    portalShareTemplate: templateEnvelope?.portalShareTemplate ?? undefined,
    checklistTemplates: templateEnvelope?.checklistTemplates ?? undefined,
    mobileUiScale: (row.mobile_ui_scale !== null && row.mobile_ui_scale !== undefined)
      ? normalizeMobileUiScale(Number(row.mobile_ui_scale))
      : MOBILE_UI_SCALE_DEFAULT,
  } as Profile;
}

function toRow(p: Partial<Profile>): any {
  return {
    ...(p.adminUserId !== undefined ? { admin_user_id: p.adminUserId } : {}),
    ...(p.fullName !== undefined ? { full_name: p.fullName } : {}),
    ...(p.email !== undefined ? { email: p.email } : {}),
    ...(p.phone !== undefined ? { phone: p.phone } : {}),
    ...(p.companyName !== undefined ? { company_name: p.companyName } : {}),
    ...(p.website !== undefined ? { website: p.website } : {}),
    ...(p.address !== undefined ? { address: p.address } : {}),
    ...(p.bankAccount !== undefined ? { bank_account: p.bankAccount } : {}),
    ...(p.authorizedSigner !== undefined ? { authorized_signer: p.authorizedSigner } : {}),
    ...(p.idNumber !== undefined ? { id_number: p.idNumber } : {}),
    ...(p.bio !== undefined ? { bio: p.bio } : {}),
    ...(p.incomeCategories !== undefined ? { income_categories: p.incomeCategories } : {}),
    ...(p.expenseCategories !== undefined ? { expense_categories: p.expenseCategories } : {}),
    ...(p.projectTypes !== undefined ? { project_types: p.projectTypes } : {}),
    ...(p.eventTypes !== undefined ? { event_types: p.eventTypes } : {}),
    ...(p.assetCategories !== undefined ? { asset_categories: p.assetCategories } : {}),
    ...(p.sopCategories !== undefined ? { sop_categories: p.sopCategories } : {}),
    ...(p.packageCategories !== undefined ? { package_categories: p.packageCategories } : {}),
    ...(p.leadSources !== undefined ? { lead_sources: p.leadSources } : {}),
    ...(p.termsAndConditions !== undefined ? { terms_and_conditions: p.termsAndConditions } : {}),
    ...(p.logoBase64 !== undefined ? { logo_base64: p.logoBase64 || null } : {}),
    ...(p.signatureBase64 !== undefined ? { signature_base64: p.signatureBase64 || null } : {}),
    ...(p.instagram !== undefined ? { instagram: p.instagram } : {}),
    ...(p.contractTemplate !== undefined ? { contract_template: p.contractTemplate } : {}),
    ...(p.brandColor !== undefined ? { brand_color: p.brandColor } : {}),
    ...(p.publicPageConfig !== undefined ? {
      // Only write to JSONB column that actually exists in the current schema
      public_page_config: p.publicPageConfig,
    } : {}),
    ...(p.projectStatusConfig !== undefined ? { project_status_config: p.projectStatusConfig } : {}),
    ...(p.packageShareTemplate !== undefined ? { package_share_template: p.packageShareTemplate } : {}),
    ...(p.bookingFormTemplate !== undefined ? { booking_form_template: p.bookingFormTemplate } : {}),
    ...(p.briefingTemplate !== undefined ? { briefing_template: p.briefingTemplate } : {}),
    ...(p.notificationSettings !== undefined ? { notification_settings: p.notificationSettings } : {}),
    ...(p.securitySettings !== undefined ? { security_settings: p.securitySettings } : {}),
    ...(p.chatTemplates !== undefined ? { chat_templates: p.chatTemplates } : {}),
    ...(p.mobileUiScale !== undefined
      ? { mobile_ui_scale: normalizeMobileUiScale(p.mobileUiScale) }
      : {}),
  };
}

export async function getProfile(): Promise<Profile | null> {
  const { data, error } = await supabase.from(TABLE).select(PROFILE_COLUMNS).limit(1).maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data ? fromRow(data) : null;
}

/**
 * Payload Realtime `profiles` sudah memuat seluruh kolom baris terbaru, jadi
 * cache bisa langsung ditambal tanpa menarik ulang kolom besar (logo base64
 * dan public_page_config) yang ada di baris ini.
 */
export function normalizeProfileRow(row: any): Profile {
  return fromRow(row);
}

/**
 * Hanya kolom yang benar-benar berubah dibanding profil tersimpan.
 * Mengirim seluruh objek profile berarti menulis ulang logo base64 (ratusan KB)
 * dan public_page_config setiap kali satu teks diedit.
 */
export function buildProfilePatch(
  saved: Partial<Profile> | null | undefined,
  next: Partial<Profile> & { id?: string },
): Partial<Profile> & { id?: string } {
  const patch: Record<string, any> = { id: next.id ?? (saved as any)?.id };
  if (!saved) return patch as Partial<Profile> & { id?: string };
  Object.keys(next).forEach(key => {
    if (key === 'id') return;
    const value = (next as any)[key];
    if (value === undefined) return;
    if (isSameProfileValue((saved as any)[key], value)) return;
    patch[key] = value;
  });
  return patch as Partial<Profile> & { id?: string };
}

function isSameProfileValue(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a === 'object' && typeof b === 'object') {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }
  return false;
}

function isMissingProjectStatusColumn(error: any): boolean {
  return (error?.code === 'PGRST204' || error?.code === '42703')
    && /project_status_config/i.test(String(error?.message || ''));
}

export async function upsertProfile(rawInput: Partial<Profile> & { id?: string }): Promise<Profile> {
  let logoBase64 = rawInput.logoBase64;
  if (logoBase64 && logoBase64.startsWith('data:')) {
    try {
      logoBase64 = await uploadDataUrlAsset(logoBase64, 'profiles/logo');
    } catch (e) {
      console.warn('[upsertProfile] Failed to upload logo dataUrl to storage:', e);
    }
  }

  let signatureBase64 = rawInput.signatureBase64;
  if (signatureBase64 && signatureBase64.startsWith('data:')) {
    try {
      signatureBase64 = await uploadDataUrlAsset(signatureBase64, 'profiles/signature');
    } catch (e) {
      console.warn('[upsertProfile] Failed to upload signature dataUrl to storage:', e);
    }
  }

  const input = {
    ...rawInput,
    ...(logoBase64 !== undefined ? { logoBase64 } : {}),
    ...(signatureBase64 !== undefined ? { signatureBase64 } : {}),
  };

  let bookingFormTemplatePayload: string | undefined = undefined;

  // If any of the templates are provided, merge into booking_form_template JSON envelope
  if (
    input.chatTemplates !== undefined ||
    input.bookingFormTemplate !== undefined ||
    input.billingTemplates !== undefined ||
    input.invoiceShareTemplate !== undefined ||
    input.receiptShareTemplate !== undefined ||
    input.expenseShareTemplate !== undefined ||
    input.portalShareTemplate !== undefined ||
    input.checklistTemplates !== undefined
  ) {
    let existingEnvelope: any = {};
    const hasCompleteEnvelope = TEMPLATE_ENVELOPE_KEYS.every(key =>
      Object.prototype.hasOwnProperty.call(input, key),
    );
    if (hasCompleteEnvelope) {
      existingEnvelope = Object.fromEntries(
        TEMPLATE_ENVELOPE_KEYS
          .filter(key => input[key] !== undefined)
          .map(key => [key, input[key]]),
      );
    } else if (input.id) {
      const { data: current, error: readError } = await supabase
        .from(TABLE)
        .select('booking_form_template')
        .eq('id', input.id)
        .maybeSingle();
      if (readError) throw readError;
      const parsed = getTemplateEnvelope(current?.booking_form_template);
      if (parsed) {
        existingEnvelope = parsed;
      } else if (typeof current?.booking_form_template === 'string' && current.booking_form_template) {
        existingEnvelope = { bookingFormTemplate: current.booking_form_template };
      }
    }
    const merged: any = { ...existingEnvelope };
    if (input.bookingFormTemplate !== undefined) merged.bookingFormTemplate = input.bookingFormTemplate;
    if (input.chatTemplates !== undefined) merged.chatTemplates = input.chatTemplates;
    if (input.billingTemplates !== undefined) merged.billingTemplates = input.billingTemplates;
    if (input.invoiceShareTemplate !== undefined) merged.invoiceShareTemplate = input.invoiceShareTemplate;
    if (input.receiptShareTemplate !== undefined) merged.receiptShareTemplate = input.receiptShareTemplate;
    if (input.expenseShareTemplate !== undefined) merged.expenseShareTemplate = input.expenseShareTemplate;
    if (input.portalShareTemplate !== undefined) merged.portalShareTemplate = input.portalShareTemplate;
    if (input.checklistTemplates !== undefined) merged.checklistTemplates = input.checklistTemplates;

    bookingFormTemplatePayload = JSON.stringify(merged);
  }

  let publicPageConfigPayload = input.publicPageConfig ? { ...input.publicPageConfig } : undefined;
  const hasProjectStatusConfig = input.projectStatusConfig !== undefined;
  const hasSocialOrExtra = (
    input.instagram !== undefined ||
    input.tiktok !== undefined ||
    input.facebook !== undefined ||
    input.youtube !== undefined ||
    input.secondaryPhone !== undefined
  );

  if ((hasProjectStatusConfig || hasSocialOrExtra) && !publicPageConfigPayload && input.id) {
    const { data: current, error } = await supabase
      .from(TABLE)
      .select('public_page_config')
      .eq('id', input.id)
      .maybeSingle();
    if (error) throw error;
    publicPageConfigPayload = current?.public_page_config && typeof current.public_page_config === 'object'
      ? { ...current.public_page_config }
      : {};
  }

  if (hasProjectStatusConfig) {
    publicPageConfigPayload = {
      ...(publicPageConfigPayload || {}),
      projectStatusConfig: input.projectStatusConfig,
    } as any;
  }

  if (hasSocialOrExtra) {
    const existingConfig: any = publicPageConfigPayload || {};
    const existingSocial = existingConfig.socialMedia || {};
    publicPageConfigPayload = {
      ...existingConfig,
      socialMedia: {
        ...existingSocial,
        ...(input.instagram !== undefined ? { instagram: input.instagram } : {}),
        ...(input.tiktok !== undefined ? { tiktok: input.tiktok } : {}),
        ...(input.facebook !== undefined ? { facebook: input.facebook } : {}),
        ...(input.youtube !== undefined ? { youtube: input.youtube } : {}),
      },
      ...(input.secondaryPhone !== undefined ? { secondaryPhone: input.secondaryPhone } : (existingConfig.secondaryPhone !== undefined ? { secondaryPhone: existingConfig.secondaryPhone } : {})),
    };
  }

  const row = toRow({
    ...input,
    bookingFormTemplate: bookingFormTemplatePayload ?? input.bookingFormTemplate,
    ...(publicPageConfigPayload !== undefined ? { publicPageConfig: publicPageConfigPayload } : {}),
  } as any);
  if (!input.id && !row.admin_user_id) {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error('Sesi autentikasi tidak ditemukan.');
    row.admin_user_id = data.user.id;
  }
  if (input.id) {
    // Jika tidak ada kolom yang berubah (misalnya user menekan simpan tanpa mengubah input),
    // jangan panggil update({}) karena PostgREST akan mengembalikan 0 baris dan memicu error 406.
    if (Object.keys(row).length === 0) {
      const { data: existing, error: fetchErr } = await supabase
        .from(TABLE)
        .select('*')
        .eq('id', input.id)
        .maybeSingle();
      if (fetchErr) throw fetchErr;
      if (existing) return fromRow(existing);
      const current = await getProfile();
      if (current) return current;
      throw new Error('Profil tidak ditemukan.');
    }

    const query = supabase
      .from(TABLE)
      .update(row)
      .eq('id', input.id)
      .select('*');

    let { data, error } = typeof (query as any).maybeSingle === 'function'
      ? await (query as any).maybeSingle()
      : await (query as any).single();

    if (error && hasProjectStatusConfig && isMissingProjectStatusColumn(error)) {
      const { project_status_config: _legacyStatusConfig, ...compatibleRow } = row;
      const retryQuery = supabase
        .from(TABLE)
        .update(compatibleRow)
        .eq('id', input.id)
        .select('*');
      const retry = typeof (retryQuery as any).maybeSingle === 'function'
        ? await (retryQuery as any).maybeSingle()
        : await (retryQuery as any).single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      if (error.code === 'PGRST116') {
        const current = await getProfile();
        if (current) return current;
      }
      throw error;
    }
    if (!data) {
      const current = await getProfile();
      if (current) return current;
      throw new Error('Profil tidak ditemukan atau Anda tidak memiliki akses untuk mengubahnya.');
    }
    return fromRow(data);
  } else {
    let { data, error } = await supabase.from(TABLE).insert(row).select('*').single();
    if (error && hasProjectStatusConfig && isMissingProjectStatusColumn(error)) {
      const { project_status_config: _legacyStatusConfig, ...compatibleRow } = row;
      const retry = await supabase.from(TABLE).insert(compatibleRow).select('*').single();
      data = retry.data;
      error = retry.error;
    }
    if (error) throw error;
    return fromRow(data);
  }
}

export async function updateProfile(patch: Partial<Profile>): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) throw new Error('Profile tidak ditemukan');

  return upsertProfile({ ...profile, ...patch });
}
