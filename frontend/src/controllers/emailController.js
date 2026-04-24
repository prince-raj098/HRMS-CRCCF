const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

// ─── Create reusable transporter ───────────────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// ─── Generate PDF buffer from offer letter data ────────────────────────────
const generateOfferPDF = (formData, templateName) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 60, size: 'A4' });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const companyName = formData.companyName || 'CRCCF HRMS Tech Ltd.';
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Header
    doc.fontSize(22).font('Helvetica-Bold').text(companyName, { align: 'left' });
    doc.fontSize(10).font('Helvetica').fillColor('#666').text('Enabling the Future of Work', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#666').text(`Date: ${today}`, { align: 'right' });
    doc.text(`Location: ${formData.location || 'Headquarters'}`, { align: 'right' });

    doc.moveDown(1);
    doc
      .moveTo(60, doc.y)
      .lineTo(doc.page.width - 60, doc.y)
      .strokeColor('#0f172a')
      .lineWidth(1.5)
      .stroke();
    doc.moveDown(1.5);

    // Salutation
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#0f172a')
      .text(`Dear ${formData.candidateName || '[Candidate Name]'},`);
    doc.moveDown(0.8);

    // Body
    doc.fontSize(11).font('Helvetica').fillColor('#374151')
      .text(
        `We are absolutely delighted to extend to you an offer of employment at ${companyName}. ` +
        `We were thoroughly impressed by your background and believe you will be an outstanding addition to our team.`
      );
    doc.moveDown(0.8);
    doc.text(
      `You are being offered the position of `
    ).font('Helvetica-Bold').text(formData.role || '[Role]', { continued: true })
      .font('Helvetica').text(`, reporting to `)
      .font('Helvetica-Bold').text(formData.managerName || '[Manager]', { continued: true })
      .font('Helvetica').text(`. Your anticipated start date will be `)
      .font('Helvetica-Bold').text(
        formData.joiningDate
          ? new Date(formData.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : '[Joining Date]',
        { continued: true }
      ).font('Helvetica').text('.');

    doc.moveDown(1.2);
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#0f172a').text('1. Compensation & Benefits');
    doc.moveDown(0.4);
    doc.fontSize(11).font('Helvetica').fillColor('#374151')
      .text(
        `Your initial compensation will be `
      )
      .font('Helvetica-Bold').text(formData.salary || '[Salary]', { continued: true })
      .font('Helvetica').text(
        ` per annum, subject to standard legally required deductions. ` +
        `You will also be eligible to participate in the company's standard employee benefits program.`
      );

    doc.moveDown(1.2);
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#0f172a').text('2. Terms of Employment');
    doc.moveDown(0.4);
    doc.fontSize(11).font('Helvetica').fillColor('#374151')
      .text(
        `Your employment with ${companyName} will be "at-will," meaning that either you or the company may terminate your employment at any time, with or without cause or advance notice.`
      );

    doc.moveDown(1.5);
    doc.font('Helvetica').fillColor('#374151').fontSize(11)
      .text(
        `If you accept this offer, please sign and return this letter. We are excited to have you join our team.`
      );

    // Signatures
    doc.moveDown(3);
    const sigY = doc.y;
    doc.moveTo(60, sigY).lineTo(240, sigY).strokeColor('#0f172a').lineWidth(0.5).stroke();
    doc.moveTo(doc.page.width - 240, sigY).lineTo(doc.page.width - 60, sigY).stroke();
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a')
      .text(`For ${companyName}:`, 60, sigY + 6);
    doc.font('Helvetica').fillColor('#666').text('HR Management', 60, sigY + 20);
    doc.font('Helvetica-Bold').fillColor('#0f172a')
      .text('Accepted by:', doc.page.width - 240, sigY + 6);
    doc.font('Helvetica').fillColor('#666')
      .text(formData.candidateName || '[Candidate Name]', doc.page.width - 240, sigY + 20);

    doc.end();
  });
};

// ─── POST /api/email/offer-letter ──────────────────────────────────────────
exports.sendOfferLetter = async (req, res, next) => {
  try {
    const { formData, templateName } = req.body;

    if (!formData || !formData.email) {
      return res.status(400).json({ success: false, message: 'Recipient email is required.' });
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(503).json({
        success: false,
        message: 'Email service not configured. Please set SMTP_USER and SMTP_PASS in .env'
      });
    }

    const pdfBuffer = await generateOfferPDF(formData, templateName);
    const transporter = createTransporter();
    const companyName = formData.companyName || 'CRCCF HRMS Tech Ltd.';

    const mailOptions = {
      from: `"${companyName} HR" <${process.env.SMTP_USER}>`,
      to: formData.email,
      subject: `Offer Letter – ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0f172a; padding: 24px 32px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 22px;">${companyName}</h1>
            <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">Human Resources Department</p>
          </div>
          <div style="background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="color: #374151; font-size: 15px; margin: 0 0 16px;">Dear <strong>${formData.candidateName || 'Candidate'}</strong>,</p>
            <p style="color: #374151; font-size: 14px; line-height: 1.7; margin: 0 0 16px;">
              We are pleased to inform you that your application for the position of 
              <strong>${formData.role || 'the offered role'}</strong> has been successful.
              Please find your formal offer letter attached to this email.
            </p>
            <p style="color: #374151; font-size: 14px; line-height: 1.7; margin: 0 0 24px;">
              Please review the attached document carefully and sign and return it at your earliest convenience. 
              We look forward to having you on our team!
            </p>
            <div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
              <p style="color: #0369a1; font-size: 13px; margin: 0; font-weight: 600;">📎 Offer Letter – ${companyName}.pdf</p>
              <p style="color: #0369a1; font-size: 12px; margin: 4px 0 0;">Attached to this email</p>
            </div>
            <p style="color: #374151; font-size: 14px; margin: 0 0 8px;">Warm regards,</p>
            <p style="color: #0f172a; font-size: 14px; font-weight: 600; margin: 0;">HR Management Team</p>
            <p style="color: #64748b; font-size: 13px; margin: 2px 0 0;">${companyName}</p>
          </div>
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 16px;">
            This is an automated email from the HRMS platform. Please do not reply to this email directly.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `Offer_Letter_${(formData.candidateName || 'Candidate').replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: `Offer letter sent successfully to ${formData.email}` });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/email/bulk ──────────────────────────────────────────────────
exports.sendBulkEmail = async (req, res, next) => {
  try {
    const { recipients, subject, message, senderName } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one recipient is required.' });
    }
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject and message are required.' });
    }
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(503).json({
        success: false,
        message: 'Email service not configured. Please set SMTP_USER and SMTP_PASS in .env'
      });
    }

    const transporter = createTransporter();
    const companyName = process.env.COMPANY_NAME || 'CRCCF HRMS Tech Ltd.';
    const fromName = senderName || `${companyName} HR`;

    const results = [];
    for (const recipient of recipients) {
      try {
        await transporter.sendMail({
          from: `"${fromName}" <${process.env.SMTP_USER}>`,
          to: recipient.email,
          subject: subject.trim(),
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #0f172a; padding: 24px 32px; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 20px;">${companyName}</h1>
                <p style="color: #94a3b8; margin: 4px 0 0; font-size: 12px;">Human Resources Department</p>
              </div>
              <div style="background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                <p style="color: #374151; font-size: 15px; margin: 0 0 16px;">Dear <strong>${recipient.name || 'Team Member'}</strong>,</p>
                <div style="color: #374151; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</div>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="color: #374151; font-size: 14px; margin: 0 0 4px;">Best regards,</p>
                <p style="color: #0f172a; font-weight: 600; font-size: 14px; margin: 0;">HR Management Team</p>
                <p style="color: #64748b; font-size: 12px; margin: 2px 0 0;">${companyName}</p>
              </div>
              <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 16px;">
                This email was sent via the HRMS platform.
              </p>
            </div>
          `,
        });
        results.push({ email: recipient.email, status: 'sent' });
      } catch (err) {
        results.push({ email: recipient.email, status: 'failed', error: err.message });
      }
    }

    const sentCount = results.filter(r => r.status === 'sent').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    res.json({
      success: true,
      message: `Email sent to ${sentCount} recipient(s)${failedCount > 0 ? `, ${failedCount} failed` : ''}.`,
      results,
    });
  } catch (err) {
    next(err);
  }
};
