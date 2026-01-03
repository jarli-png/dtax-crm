// dTax CRM - Integrasjonsbibliotek
// Kobler sammen tax.salestext.no, invoice.dtax.no og CRM

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// KONFIGURASJON
// ============================================

export const CONFIG = {
  TAX_SYSTEM: {
    BASE_URL: process.env.TAX_SYSTEM_URL || 'https://tax.salestext.no',
    API_KEY: process.env.TAX_SYSTEM_API_KEY || '',
  },
  INVOICE_SYSTEM: {
    BASE_URL: process.env.INVOICE_SYSTEM_URL || 'https://invoice.dtax.no',
    API_KEY: process.env.INVOICE_SYSTEM_API_KEY || '',
  },
  EMAIL: {
    FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@dtax.no',
    BCC_EMAIL: process.env.BCC_EMAIL || 'arkiv@dtax.no',
    REGION: process.env.AWS_REGION || 'eu-north-1',
  },
  S3: {
    BUCKET: process.env.S3_BUCKET || 'dtax-crm-documents',
    REGION: process.env.AWS_REGION || 'eu-north-1',
  },
};

// ============================================
// TAX.SALESTEXT.NO INTEGRASJON
// ============================================

export interface TaxSystemUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: string;
  status: string;
}

export interface TaxSystemCase {
  id: string;
  userId: string;
  status: string;
  currentStep: number;
  submittedAt?: string;
  taxBenefit?: number;
  companies: {
    orgNumber: string;
    companyName: string;
    shareCapital: number;
  }[];
}

export interface CreateTaxUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  source: 'crm_import' | 'manual';
  prospectId: string;
  sendWelcomeEmail: boolean;
  bccEmail?: string;
}

export class TaxSystemAPI {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = CONFIG.TAX_SYSTEM.BASE_URL;
    this.apiKey = CONFIG.TAX_SYSTEM.API_KEY;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    // Logg integrasjonen
    await prisma.integrationLog.create({
      data: {
        system: 'tax_salestext',
        endpoint,
        method: options.method || 'GET',
        requestBody: options.body as string,
        statusCode: response.status,
        success: response.ok,
        errorMessage: response.ok ? null : await response.text(),
      },
    });

    if (!response.ok) {
      throw new Error(`Tax System API error: ${response.status}`);
    }

    return response.json();
  }

  // Opprett bruker i tax.salestext.no
  async createUser(data: CreateTaxUserRequest): Promise<TaxSystemUser> {
    return this.request<TaxSystemUser>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Hent bruker
  async getUser(userId: string): Promise<TaxSystemUser | null> {
    try {
      return await this.request<TaxSystemUser>(`/users/${userId}`);
    } catch {
      return null;
    }
  }

  // Hent bruker via e-post
  async getUserByEmail(email: string): Promise<TaxSystemUser | null> {
    try {
      return await this.request<TaxSystemUser>(`/users/by-email/${encodeURIComponent(email)}`);
    } catch {
      return null;
    }
  }

  // Hent alle saker for en bruker
  async getUserCases(userId: string): Promise<TaxSystemCase[]> {
    return this.request<TaxSystemCase[]>(`/users/${userId}/cases`);
  }

  // Hent spesifikk sak
  async getCase(caseId: string): Promise<TaxSystemCase> {
    return this.request<TaxSystemCase>(`/cases/${caseId}`);
  }

  // Hent signerte kontrakter for en bruker
  async getSignedContracts(userId: string): Promise<{
    id: string;
    type: string;
    signedAt: string;
    signatureRef: string;
    documentUrl: string;
  }[]> {
    return this.request(`/users/${userId}/contracts`);
  }

  // Hent status for en sak
  async getCaseStatus(caseId: string): Promise<{
    currentStep: number;
    status: string;
    submittedAt?: string;
    taxBenefit?: number;
  }> {
    return this.request(`/cases/${caseId}/status`);
  }

  // Webhook: Sak sendt til Skatteetaten (Steg 6 fullført)
  async handleStep6Complete(caseId: string): Promise<void> {
    const caseData = await this.getCase(caseId);
    
    // Finn prospect basert på taxSystemUserId
    const prospect = await prisma.prospect.findFirst({
      where: { taxSystemUserId: caseData.userId },
    });

    if (prospect) {
      // Oppdater status
      await prisma.prospect.update({
        where: { id: prospect.id },
        data: {
          status: 'STEP_6',
          taxSystemStatus: 'SUBMITTED',
          currentStep: 6,
        },
      });

      // Logg aktivitet
      await prisma.activity.create({
        data: {
          prospectId: prospect.id,
          type: 'TAX_SUBMITTED',
          subject: 'Skattemelding sendt til Skatteetaten',
          description: `Sak ${caseId} er sendt til Skatteetaten. Skattefordel: ${caseData.taxBenefit || 'Ikke beregnet'}`,
        },
      });

      // Trigger fakturering via invoice.dtax.no
      if (caseData.taxBenefit && caseData.taxBenefit > 0) {
        const invoiceAPI = new InvoiceSystemAPI();
        await invoiceAPI.createInvoiceFromTaxCase(prospect.id, caseData);
      }
    }
  }
}

// ============================================
// INVOICE.DTAX.NO INTEGRASJON
// ============================================

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  customerId: string;
  amount: number;
  vatAmount: number;
  totalAmount: number;
  status: string;
  dueDate: string;
  paidAt?: string;
  documentUrl?: string;
}

export class InvoiceSystemAPI {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = CONFIG.INVOICE_SYSTEM.BASE_URL;
    this.apiKey = CONFIG.INVOICE_SYSTEM.API_KEY;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    await prisma.integrationLog.create({
      data: {
        system: 'invoice_dtax',
        endpoint,
        method: options.method || 'GET',
        requestBody: options.body as string,
        statusCode: response.status,
        success: response.ok,
        errorMessage: response.ok ? null : await response.text(),
      },
    });

    if (!response.ok) {
      throw new Error(`Invoice System API error: ${response.status}`);
    }

    return response.json();
  }

  // Opprett kunde i fakturasystemet
  async createCustomer(prospectId: string): Promise<{ customerId: string }> {
    const prospect = await prisma.prospect.findUnique({
      where: { id: prospectId },
    });

    if (!prospect) throw new Error('Prospect not found');

    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: `${prospect.firstName} ${prospect.lastName}`,
        email: prospect.email,
        phone: prospect.phone,
        address: prospect.address,
        postalCode: prospect.postalCode,
        city: prospect.city,
        externalRef: prospect.id,
      }),
    });
  }

  // Opprett faktura basert på fullført skattesak
  async createInvoiceFromTaxCase(prospectId: string, taxCase: TaxSystemCase): Promise<InvoiceData> {
    let prospect = await prisma.prospect.findUnique({
      where: { id: prospectId },
    });

    if (!prospect) throw new Error('Prospect not found');

    // Opprett kunde hvis ikke eksisterer
    if (!prospect.invoiceCustomerId) {
      const customer = await this.createCustomer(prospectId);
      await prisma.prospect.update({
        where: { id: prospectId },
        data: { invoiceCustomerId: customer.customerId },
      });
      prospect = await prisma.prospect.findUnique({ where: { id: prospectId } });
    }

    // Beregn provisjon (30% av skattefordel)
    const commissionRate = 0.30;
    const taxBenefit = taxCase.taxBenefit || 0;
    const amount = taxBenefit * commissionRate;
    const vatAmount = amount * 0.25; // 25% MVA
    const totalAmount = amount + vatAmount;

    // Opprett faktura
    const invoice = await this.request<InvoiceData>('/invoices', {
      method: 'POST',
      body: JSON.stringify({
        customerId: prospect!.invoiceCustomerId,
        items: [{
          description: `Suksesshonorar - Skattemelding ${taxCase.id}`,
          quantity: 1,
          unitPrice: amount,
          vatRate: 0.25,
        }],
        taxBenefit,
        commissionRate,
        externalRef: taxCase.id,
      }),
    });

    // Lagre faktura i CRM
    await prisma.invoice.create({
      data: {
        prospectId,
        invoiceSystemId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount,
        vatAmount,
        totalAmount,
        taxBenefit,
        commissionRate,
        status: 'SENT',
        dueDate: new Date(invoice.dueDate),
      },
    });

    // Logg aktivitet
    await prisma.activity.create({
      data: {
        prospectId,
        type: 'INVOICE_CREATED',
        subject: `Faktura ${invoice.invoiceNumber} opprettet`,
        description: `Beløp: ${totalAmount.toFixed(2)} kr (inkl. mva). Skattefordel: ${taxBenefit.toFixed(2)} kr`,
      },
    });

    // Hent og lagre faktura-PDF
    await this.downloadAndStoreInvoice(prospectId, invoice.id);

    return invoice;
  }

  // Hent alle fakturaer for en kunde
  async getCustomerInvoices(customerId: string): Promise<InvoiceData[]> {
    return this.request(`/customers/${customerId}/invoices`);
  }

  // Hent faktura-PDF
  async getInvoicePdf(invoiceId: string): Promise<ArrayBuffer> {
    const response = await fetch(`${this.baseUrl}/api/v1/invoices/${invoiceId}/pdf`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });
    return response.arrayBuffer();
  }

  // Last ned og lagre faktura i S3
  async downloadAndStoreInvoice(prospectId: string, invoiceId: string): Promise<void> {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    
    const pdf = await this.getInvoicePdf(invoiceId);
    const s3Key = `prospects/${prospectId}/invoices/${invoiceId}.pdf`;
    
    const s3 = new S3Client({ region: CONFIG.S3.REGION });
    await s3.send(new PutObjectCommand({
      Bucket: CONFIG.S3.BUCKET,
      Key: s3Key,
      Body: Buffer.from(pdf),
      ContentType: 'application/pdf',
    }));

    // Lagre dokument-referanse
    await prisma.document.create({
      data: {
        prospectId,
        fileName: `Faktura_${invoiceId}.pdf`,
        fileType: 'invoice',
        mimeType: 'application/pdf',
        fileSize: pdf.byteLength,
        s3Key,
        source: 'invoice_system',
        sourceId: invoiceId,
      },
    });
  }

  // Synkroniser fakturastatuser
  async syncInvoiceStatuses(): Promise<void> {
    const invoices = await prisma.invoice.findMany({
      where: { status: { in: ['SENT', 'OVERDUE'] } },
    });

    for (const invoice of invoices) {
      try {
        const data = await this.request<InvoiceData>(`/invoices/${invoice.invoiceSystemId}`);
        
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            status: data.status.toUpperCase() as any,
            paidAt: data.paidAt ? new Date(data.paidAt) : null,
          },
        });
      } catch (error) {
        console.error(`Failed to sync invoice ${invoice.id}:`, error);
      }
    }
  }
}

// ============================================
// E-POST TJENESTE (AWS SES)
// ============================================

export interface SendEmailParams {
  to: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  prospectId?: string;
  campaignId?: string;
  userId?: string;
}

export class EmailService {
  async sendEmail(params: SendEmailParams): Promise<string> {
    const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
    
    const ses = new SESClient({ region: CONFIG.EMAIL.REGION });
    
    const destinations = [params.to];
    const bccAddresses = CONFIG.EMAIL.BCC_EMAIL ? [CONFIG.EMAIL.BCC_EMAIL] : [];

    const command = new SendEmailCommand({
      Source: CONFIG.EMAIL.FROM_EMAIL,
      Destination: {
        ToAddresses: destinations,
        BccAddresses: bccAddresses,
      },
      Message: {
        Subject: { Data: params.subject },
        Body: {
          Html: { Data: params.bodyHtml },
          Text: { Data: params.bodyText || params.bodyHtml.replace(/<[^>]*>/g, '') },
        },
      },
    });

    const result = await ses.send(command);
    const messageId = result.MessageId || '';

    // Logg e-post
    if (params.prospectId) {
      await prisma.emailLog.create({
        data: {
          prospectId: params.prospectId,
          campaignId: params.campaignId,
          sentById: params.userId,
          toEmail: params.to,
          fromEmail: CONFIG.EMAIL.FROM_EMAIL,
          subject: params.subject,
          bodyPreview: params.bodyHtml.substring(0, 500),
          status: 'SENT',
          sesMessageId: messageId,
          bccEmail: CONFIG.EMAIL.BCC_EMAIL,
        },
      });

      // Logg aktivitet
      await prisma.activity.create({
        data: {
          prospectId: params.prospectId,
          userId: params.userId,
          type: 'EMAIL',
          subject: `E-post sendt: ${params.subject}`,
          description: `Sendt til ${params.to}`,
        },
      });
    }

    return messageId;
  }

  // Send kampanje til flere mottakere
  async sendCampaign(campaignId: string, prospectIds: string[]): Promise<void> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) throw new Error('Campaign not found');

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'SENDING' },
    });

    let sentCount = 0;

    for (const prospectId of prospectIds) {
      const prospect = await prisma.prospect.findUnique({
        where: { id: prospectId },
      });

      if (prospect?.email) {
        try {
          // Personaliser innhold
          const personalizedHtml = campaign.bodyHtml
            .replace('{{firstName}}', prospect.firstName)
            .replace('{{lastName}}', prospect.lastName)
            .replace('{{email}}', prospect.email);

          await this.sendEmail({
            to: prospect.email,
            subject: campaign.subject,
            bodyHtml: personalizedHtml,
            prospectId,
            campaignId,
            userId: campaign.createdById,
          });

          sentCount++;
        } catch (error) {
          console.error(`Failed to send to ${prospect.email}:`, error);
        }
      }
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'SENT',
        sentCount,
        sentAt: new Date(),
      },
    });
  }
}

// ============================================
// DOKUMENT-TJENESTE
// ============================================

export class DocumentService {
  async uploadDocument(
    prospectId: string,
    file: Buffer,
    fileName: string,
    mimeType: string,
    fileType: string,
    uploadedById?: string
  ): Promise<string> {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const { v4: uuidv4 } = await import('uuid');

    const documentId = uuidv4();
    const s3Key = `prospects/${prospectId}/${fileType}/${documentId}_${fileName}`;

    const s3 = new S3Client({ region: CONFIG.S3.REGION });
    await s3.send(new PutObjectCommand({
      Bucket: CONFIG.S3.BUCKET,
      Key: s3Key,
      Body: file,
      ContentType: mimeType,
    }));

    await prisma.document.create({
      data: {
        id: documentId,
        prospectId,
        fileName,
        fileType,
        mimeType,
        fileSize: file.length,
        s3Key,
        source: 'upload',
        uploadedById,
      },
    });

    // Logg aktivitet
    await prisma.activity.create({
      data: {
        prospectId,
        userId: uploadedById,
        type: 'DOCUMENT_UPLOADED',
        subject: `Dokument lastet opp: ${fileName}`,
      },
    });

    return documentId;
  }

  async getDocumentUrl(documentId: string): Promise<string> {
    const { S3Client } = await import('@aws-sdk/client-s3');
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) throw new Error('Document not found');

    const s3 = new S3Client({ region: CONFIG.S3.REGION });
    const command = new GetObjectCommand({
      Bucket: document.s3Bucket,
      Key: document.s3Key,
    });

    return getSignedUrl(s3, command, { expiresIn: 3600 });
  }

  // Hent og lagre kontrakt fra tax.salestext.no
  async syncContractsFromTaxSystem(prospectId: string): Promise<void> {
    const prospect = await prisma.prospect.findUnique({
      where: { id: prospectId },
    });

    if (!prospect?.taxSystemUserId) return;

    const taxAPI = new TaxSystemAPI();
    const contracts = await taxAPI.getSignedContracts(prospect.taxSystemUserId);

    for (const contract of contracts) {
      // Sjekk om kontrakt allerede er lagret
      const existing = await prisma.contract.findFirst({
        where: { taxSystemRef: contract.id },
      });

      if (!existing) {
        // Last ned kontrakt-PDF
        const response = await fetch(contract.documentUrl, {
          headers: { 'Authorization': `Bearer ${CONFIG.TAX_SYSTEM.API_KEY}` },
        });
        const pdf = await response.arrayBuffer();

        // Last opp til S3
        const documentId = await this.uploadDocument(
          prospectId,
          Buffer.from(pdf),
          `Kontrakt_${contract.type}_${contract.id}.pdf`,
          'application/pdf',
          'contract'
        );

        // Lagre kontrakt-referanse
        await prisma.contract.create({
          data: {
            prospectId,
            contractType: contract.type,
            status: 'SIGNED',
            signedAt: new Date(contract.signedAt),
            signatureRef: contract.signatureRef,
            taxSystemRef: contract.id,
            documentId,
          },
        });
      }
    }
  }
}

// ============================================
// EKSPORTER
// ============================================

export const taxSystemAPI = new TaxSystemAPI();
export const invoiceSystemAPI = new InvoiceSystemAPI();
export const emailService = new EmailService();
export const documentService = new DocumentService();
