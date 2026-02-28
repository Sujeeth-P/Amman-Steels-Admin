/**
 * Generate a professional store invoice PDF and trigger download
 * Uses a print-friendly HTML template rendered in a hidden iframe
 */

const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
}).format(amt || 0)

const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
})

const numberToWords = (num) => {
    if (num === 0) return 'Zero'
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

    const convert = (n) => {
        if (n < 20) return ones[n]
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
        if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '')
        if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '')
        if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '')
        return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '')
    }

    const rupees = Math.floor(num)
    const paise = Math.round((num - rupees) * 100)
    let result = convert(rupees) + ' Rupees'
    if (paise > 0) result += ' and ' + convert(paise) + ' Paise'
    result += ' Only'
    return result
}

export const generateInvoicePDF = (order) => {
    const invoiceNo = order.invoiceNumber || order.orderNumber
    const invoiceDate = formatDate(order.createdAt)

    const itemRows = order.items?.map((item, index) => `
        <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 13px;">${index + 1}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">
                <strong>${item.productName}</strong>
                ${item.sku ? `<br><span style="color: #94a3b8; font-size: 11px;">SKU: ${item.sku}</span>` : ''}
            </td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 13px;">${item.quantity} ${item.unit || ''}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 13px;">${formatCurrency(item.unitPrice)}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 13px;">${item.gstRate || 18}%</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 13px;">${formatCurrency(item.gstAmount)}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 13px; font-weight: 600;">${formatCurrency(item.totalAmount)}</td>
        </tr>
    `).join('')

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Invoice ${invoiceNo}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; }
            .invoice-container { max-width: 800px; margin: 0 auto; padding: 30px; }
            
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #1e40af; }
            .store-info h1 { font-size: 24px; color: #1e40af; margin-bottom: 2px; letter-spacing: 1px; }
            .store-info h2 { font-size: 13px; color: #f59e0b; font-weight: 600; margin-bottom: 10px; letter-spacing: 2px; }
            .store-info p { font-size: 12px; color: #64748b; line-height: 1.6; }
            
            .invoice-title { text-align: right; }
            .invoice-title h3 { font-size: 28px; color: #1e40af; font-weight: 800; letter-spacing: 2px; }
            .invoice-title .invoice-no { font-size: 13px; color: #64748b; margin-top: 6px; }
            .invoice-title .invoice-date { font-size: 13px; color: #64748b; margin-top: 2px; }
            
            .details-row { display: flex; justify-content: space-between; margin-bottom: 25px; gap: 30px; }
            .detail-box { flex: 1; background: #f8fafc; border-radius: 8px; padding: 15px 18px; border: 1px solid #e2e8f0; }
            .detail-box h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 8px; }
            .detail-box p { font-size: 13px; line-height: 1.6; }
            .detail-box .name { font-weight: 700; font-size: 15px; color: #1e293b; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            thead th { background: #1e40af; color: white; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
            thead th:first-child { border-radius: 6px 0 0 0; }
            thead th:last-child { border-radius: 0 6px 0 0; }
            
            .summary-section { display: flex; justify-content: space-between; gap: 30px; margin-bottom: 25px; }
            .amount-words { flex: 1.5; background: #f8fafc; border-radius: 8px; padding: 15px 18px; border: 1px solid #e2e8f0; }
            .amount-words h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 6px; }
            .amount-words p { font-size: 13px; font-style: italic; color: #475569; line-height: 1.5; }
            
            .totals { flex: 1; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; }
            .total-row.grand { border-top: 2px solid #1e40af; margin-top: 8px; padding-top: 12px; font-size: 18px; font-weight: 800; color: #1e40af; }
            .total-row.paid { color: #16a34a; }
            .total-row.due { color: #dc2626; font-weight: 700; }
            
            .footer { border-top: 2px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .footer-left p { font-size: 11px; color: #94a3b8; line-height: 1.8; }
            .footer-right { text-align: center; }
            .footer-right .sig-line { border-top: 1px solid #94a3b8; width: 180px; margin-top: 40px; padding-top: 6px; }
            .footer-right p { font-size: 12px; color: #64748b; }
            
            .payment-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
            .badge-paid { background: #dcfce7; color: #16a34a; }
            .badge-partial { background: #fef3c7; color: #d97706; }
            .badge-pending { background: #fee2e2; color: #dc2626; }
            
            @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .invoice-container { padding: 15px; }
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <!-- Header -->
            <div class="header">
                <div class="store-info">
                    <h1>SRI AMMAN</h1>
                    <h2>STEELS & HARDWARES</h2>
                    <p>
                        159/109, Kamaraj Street, Karukkampalayam<br>
                        Coimbatore - 641014, Tamil Nadu<br>
                        Phone: +91 98765 43210<br>
                        Email: sales@sriammansteels.com
                    </p>
                </div>
                <div class="invoice-title">
                    <h3>INVOICE</h3>
                    <p class="invoice-no"><strong>Invoice #:</strong> ${invoiceNo}</p>
                    <p class="invoice-date"><strong>Date:</strong> ${invoiceDate}</p>
                    <p class="invoice-date" style="margin-top: 8px;">
                        <span class="payment-badge ${order.paymentStatus === 'paid' ? 'badge-paid' : order.paymentStatus === 'partial' ? 'badge-partial' : 'badge-pending'}">
                            ${order.paymentStatus || 'pending'}
                        </span>
                    </p>
                </div>
            </div>
            
            <!-- Customer & Payment Details -->
            <div class="details-row">
                <div class="detail-box">
                    <h4>Bill To</h4>
                    <p class="name">${order.customer?.name || 'Walk-in Customer'}</p>
                    ${order.customer?.phone ? `<p>📞 ${order.customer.phone}</p>` : ''}
                    ${order.customer?.address ? `<p>📍 ${order.customer.address}</p>` : ''}
                    ${order.customer?.gstin ? `<p><strong>GSTIN:</strong> ${order.customer.gstin}</p>` : ''}
                </div>
                <div class="detail-box">
                    <h4>Payment Details</h4>
                    <p><strong>Method:</strong> ${(order.paymentMethod || 'Cash').toUpperCase()}</p>
                    <p><strong>Status:</strong> ${(order.paymentStatus || 'pending').toUpperCase()}</p>
                    <p><strong>Order #:</strong> ${order.orderNumber}</p>
                </div>
            </div>
            
            <!-- Items Table -->
            <table>
                <thead>
                    <tr>
                        <th style="text-align: center; width: 40px;">#</th>
                        <th style="text-align: left;">Item Description</th>
                        <th style="text-align: center;">Qty</th>
                        <th style="text-align: right;">Unit Price</th>
                        <th style="text-align: center;">GST</th>
                        <th style="text-align: right;">GST Amt</th>
                        <th style="text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemRows}
                </tbody>
            </table>
            
            <!-- Summary -->
            <div class="summary-section">
                <div class="amount-words">
                    <h4>Amount in Words</h4>
                    <p>${numberToWords(Math.round(order.grandTotal || 0))}</p>
                </div>
                <div class="totals">
                    <div class="total-row">
                        <span>Subtotal</span>
                        <span>${formatCurrency(order.subtotal)}</span>
                    </div>
                    <div class="total-row">
                        <span>GST (18%)</span>
                        <span>${formatCurrency(order.totalGst)}</span>
                    </div>
                    ${order.totalDiscount > 0 ? `
                    <div class="total-row">
                        <span>Discount</span>
                        <span>-${formatCurrency(order.totalDiscount)}</span>
                    </div>` : ''}
                    <div class="total-row grand">
                        <span>Grand Total</span>
                        <span>${formatCurrency(order.grandTotal)}</span>
                    </div>
                    <div class="total-row paid">
                        <span>Amount Paid</span>
                        <span>${formatCurrency(order.amountPaid)}</span>
                    </div>
                    ${(order.amountDue || 0) > 0 ? `
                    <div class="total-row due">
                        <span>Balance Due</span>
                        <span>${formatCurrency(order.amountDue)}</span>
                    </div>` : ''}
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <div class="footer-left">
                    <p><strong>Terms & Conditions:</strong></p>
                    <p>• Goods once sold will not be taken back or exchanged.</p>
                    <p>• All disputes are subject to Coimbatore jurisdiction.</p>
                    <p>• E. & O.E. (Errors and Omissions Excepted)</p>
                </div>
                <div class="footer-right">
                    <p><strong>For Sri Amman Steels & Hardwares</strong></p>
                    <div class="sig-line">
                        <p>Authorized Signatory</p>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>`

    // Create a hidden iframe, write the HTML, and trigger print
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow.document
    doc.open()
    doc.write(html)
    doc.close()

    // Wait for content to render, then print
    iframe.contentWindow.onload = () => {
        setTimeout(() => {
            iframe.contentWindow.print()
            // Clean up after printing
            setTimeout(() => document.body.removeChild(iframe), 1000)
        }, 250)
    }

    // Fallback if onload doesn't fire
    setTimeout(() => {
        try {
            iframe.contentWindow.print()
            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe)
                }
            }, 1000)
        } catch (e) { /* ignore */ }
    }, 1000)
}

export default generateInvoicePDF
