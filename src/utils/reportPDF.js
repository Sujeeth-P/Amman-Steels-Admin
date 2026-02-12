import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const formatCurrency = (amt) => {
    const num = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amt || 0)
    return `Rs. ${num}`
}

const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
})

// Company header for all reports
const addHeader = (doc, title, subtitle = '') => {
    const pageWidth = doc.internal.pageSize.getWidth()

    // Header background
    doc.setFillColor(30, 41, 59) // slate-800
    doc.rect(0, 0, pageWidth, 42, 'F')

    // Accent line
    doc.setFillColor(59, 130, 246) // blue-500
    doc.rect(0, 42, pageWidth, 2, 'F')

    // Company name
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('SRI AMMAN STEELS & HARDWARE', 14, 18)

    // Report title
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(title, 14, 28)

    // Date on right
    doc.setFontSize(9)
    doc.text(`Generated: ${formatDate(new Date())}`, pageWidth - 14, 18, { align: 'right' })
    if (subtitle) {
        doc.text(subtitle, pageWidth - 14, 28, { align: 'right' })
    }

    // Reset text color
    doc.setTextColor(30, 41, 59)

    return 52 // Return Y position after header
}

// Footer with page numbers
const addFooter = (doc) => {
    const pageCount = doc.internal.getNumberOfPages()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)

        // Footer line
        doc.setDrawColor(203, 213, 225) // slate-300
        doc.setLineWidth(0.5)
        doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15)

        // Footer text
        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139) // slate-500
        doc.text('Sri Amman Steels & Hardware - Confidential Report', 14, pageHeight - 8)
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' })
    }
}

// Summary card row
const addSummaryCards = (doc, y, cards) => {
    const pageWidth = doc.internal.pageSize.getWidth()
    const cardWidth = (pageWidth - 28 - (cards.length - 1) * 6) / cards.length
    const colors = [
        [34, 197, 94],   // green
        [59, 130, 246],  // blue
        [245, 158, 11],  // amber
        [168, 85, 247],  // purple
    ]

    cards.forEach((card, i) => {
        const x = 14 + i * (cardWidth + 6)
        const color = colors[i % colors.length]

        // Card background
        doc.setFillColor(color[0], color[1], color[2])
        doc.roundedRect(x, y, cardWidth, 28, 3, 3, 'F')

        // Card label
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text(card.label, x + 8, y + 10)

        // Card value
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text(String(card.value), x + 8, y + 22)
    })

    doc.setTextColor(30, 41, 59)
    return y + 36
}

// Section heading
const addSectionTitle = (doc, y, title) => {
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.text(title, 14, y + 6)

    doc.setDrawColor(59, 130, 246)
    doc.setLineWidth(1)
    doc.line(14, y + 9, 60, y + 9)

    return y + 16
}

// ==========================================
// SALES REPORT PDF
// ==========================================
export const generateSalesReportPDF = (salesData, productData, customerData = {}) => {
    const doc = new jsPDF()

    let y = addHeader(doc, 'Sales Report', 'Last 30 Days Overview')

    // Summary Cards
    y = addSummaryCards(doc, y, [
        { label: 'Total Revenue', value: formatCurrency(salesData.summary.totalRevenue) },
        { label: 'Amount Collected', value: formatCurrency(salesData.summary.totalPaid) },
        { label: 'Total Orders', value: String(salesData.summary.totalOrders || 0) },
    ])

    // Outstanding
    const outstanding = (salesData.summary.totalRevenue || 0) - (salesData.summary.totalPaid || 0)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(`Outstanding Amount: ${formatCurrency(outstanding)}`, 14, y)
    y += 10

    // Daily Sales Table
    if (salesData.chart?.length) {
        y = addSectionTitle(doc, y, 'Daily Sales Breakdown')

        autoTable(doc, {
            startY: y,
            head: [['Date', 'Orders', 'Revenue', 'Amount Collected']],
            body: salesData.chart.map(day => [
                day._id,
                day.orders,
                formatCurrency(day.revenue),
                formatCurrency(day.paid)
            ]),
            headStyles: {
                fillColor: [30, 41, 59],
                textColor: [255, 255, 255],
                fontSize: 9,
                fontStyle: 'bold',
                halign: 'left'
            },
            bodyStyles: {
                fontSize: 9,
                cellPadding: 4,
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            margin: { left: 14, right: 14 },
            styles: {
                lineColor: [226, 232, 240],
                lineWidth: 0.25
            }
        })

        y = doc.lastAutoTable.finalY + 12
    }

    // Top Products Table
    if (productData?.topProducts?.length) {
        // Check if we need a new page
        if (y > 200) {
            doc.addPage()
            y = 20
        }

        y = addSectionTitle(doc, y, 'Top Selling Products')

        autoTable(doc, {
            startY: y,
            head: [['#', 'Product Name', 'Qty Sold', 'Revenue']],
            body: productData.topProducts.map((prod, i) => [
                i + 1,
                prod._id,
                prod.totalSold,
                formatCurrency(prod.revenue)
            ]),
            headStyles: {
                fillColor: [30, 41, 59],
                textColor: [255, 255, 255],
                fontSize: 9,
                fontStyle: 'bold',
                halign: 'left'
            },
            bodyStyles: {
                fontSize: 9,
                cellPadding: 4,
            },
            columnStyles: {
                0: { cellWidth: 12, halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'right' }
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            margin: { left: 14, right: 14 },
            styles: {
                lineColor: [226, 232, 240],
                lineWidth: 0.25
            }
        })

        y = doc.lastAutoTable.finalY + 12
    }

    // Customer Purchase Details
    if (customerData?.customers?.length) {
        // Always start customer section on a new page
        doc.addPage()
        y = 20

        y = addSectionTitle(doc, y, 'Customer Purchase Details')

        // Customer summary table
        autoTable(doc, {
            startY: y,
            head: [['#', 'Customer Name', 'Phone', 'Email', 'Orders', 'Total Spent', 'Last Order']],
            body: customerData.customers.map((cust, i) => [
                i + 1,
                cust._id || 'Unknown',
                cust.phone || '—',
                cust.email || '—',
                cust.totalOrders || 0,
                formatCurrency(cust.totalSpent),
                cust.lastOrderDate ? formatDate(cust.lastOrderDate) : '—'
            ]),
            headStyles: {
                fillColor: [30, 41, 59],
                textColor: [255, 255, 255],
                fontSize: 8,
                fontStyle: 'bold',
                halign: 'left'
            },
            bodyStyles: {
                fontSize: 8,
                cellPadding: 3,
            },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                4: { halign: 'center' },
                5: { halign: 'right' },
                6: { halign: 'right' }
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            margin: { left: 14, right: 14 },
            styles: {
                lineColor: [226, 232, 240],
                lineWidth: 0.25
            }
        })

        y = doc.lastAutoTable.finalY + 12

        // Per-customer product breakdown
        customerData.customers.forEach((cust) => {
            if (!cust.products?.length) return

            // Check if we need a new page
            if (y > 220) {
                doc.addPage()
                y = 20
            }

            // Customer name as sub-heading
            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(30, 41, 59)
            doc.text(`${cust._id || 'Unknown Customer'}`, 14, y + 4)

            // Customer contact info line
            doc.setFontSize(8)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(100, 116, 139)
            const contactParts = []
            if (cust.phone) contactParts.push(`Phone: ${cust.phone}`)
            if (cust.email) contactParts.push(`Email: ${cust.email}`)
            if (cust.gstin) contactParts.push(`GSTIN: ${cust.gstin}`)
            if (contactParts.length) {
                doc.text(contactParts.join('  |  '), 14, y + 10)
                y += 14
            } else {
                y += 8
            }

            // Products table for this customer
            autoTable(doc, {
                startY: y,
                head: [['Product', 'Qty', 'Unit Price', 'Total']],
                body: cust.products.map(p => [
                    p.productName,
                    p.quantity,
                    formatCurrency(p.unitPrice),
                    formatCurrency(p.totalAmount)
                ]),
                headStyles: {
                    fillColor: [71, 85, 105], // slate-600
                    textColor: [255, 255, 255],
                    fontSize: 8,
                    fontStyle: 'bold',
                },
                bodyStyles: {
                    fontSize: 8,
                    cellPadding: 3,
                },
                columnStyles: {
                    1: { halign: 'center' },
                    2: { halign: 'right' },
                    3: { halign: 'right' }
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
                },
                margin: { left: 20, right: 14 },
                styles: {
                    lineColor: [226, 232, 240],
                    lineWidth: 0.25
                }
            })

            y = doc.lastAutoTable.finalY + 10
        })
    }

    addFooter(doc)
    doc.save(`Sales_Report_${new Date().toISOString().split('T')[0]}.pdf`)
}

// ==========================================
// FULL ANALYTICS REPORT PDF (Super Admin)
// ==========================================
export const generateFullReportPDF = (salesData, productData, analytics) => {
    const doc = new jsPDF()

    let y = addHeader(doc, 'Complete Business Report', 'Analytics & Performance Overview')

    // Summary Cards
    y = addSummaryCards(doc, y, [
        { label: 'Total Revenue', value: formatCurrency(salesData.summary.totalRevenue) },
        { label: 'Amount Collected', value: formatCurrency(salesData.summary.totalPaid) },
        { label: 'Total Orders', value: String(salesData.summary.totalOrders || 0) },
    ])

    // Daily Sales Table
    if (salesData.chart?.length) {
        y = addSectionTitle(doc, y, 'Daily Sales Breakdown')

        autoTable(doc, {
            startY: y,
            head: [['Date', 'Orders', 'Revenue', 'Collected']],
            body: salesData.chart.map(day => [
                day._id,
                day.orders,
                formatCurrency(day.revenue),
                formatCurrency(day.paid)
            ]),
            headStyles: {
                fillColor: [30, 41, 59],
                textColor: [255, 255, 255],
                fontSize: 9,
                fontStyle: 'bold',
            },
            bodyStyles: { fontSize: 9, cellPadding: 4 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 14, right: 14 },
            styles: { lineColor: [226, 232, 240], lineWidth: 0.25 }
        })

        y = doc.lastAutoTable.finalY + 12
    }

    // Top Products
    if (productData?.topProducts?.length) {
        if (y > 200) { doc.addPage(); y = 20 }

        y = addSectionTitle(doc, y, 'Top Selling Products')

        autoTable(doc, {
            startY: y,
            head: [['#', 'Product', 'Qty Sold', 'Revenue']],
            body: productData.topProducts.map((p, i) => [
                i + 1, p._id, p.totalSold, formatCurrency(p.revenue)
            ]),
            headStyles: {
                fillColor: [30, 41, 59],
                textColor: [255, 255, 255],
                fontSize: 9,
                fontStyle: 'bold',
            },
            bodyStyles: { fontSize: 9, cellPadding: 4 },
            columnStyles: {
                0: { cellWidth: 12, halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'right' }
            },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 14, right: 14 },
            styles: { lineColor: [226, 232, 240], lineWidth: 0.25 }
        })

        y = doc.lastAutoTable.finalY + 12
    }

    // Category Stats
    if (productData?.categoryStats?.length) {
        if (y > 220) { doc.addPage(); y = 20 }

        y = addSectionTitle(doc, y, 'Products by Category')

        autoTable(doc, {
            startY: y,
            head: [['Category', 'Number of Products']],
            body: productData.categoryStats.map(c => [
                (c._id || 'Uncategorized').charAt(0).toUpperCase() + (c._id || 'uncategorized').slice(1),
                c.count
            ]),
            headStyles: {
                fillColor: [30, 41, 59],
                textColor: [255, 255, 255],
                fontSize: 9,
                fontStyle: 'bold',
            },
            bodyStyles: { fontSize: 9, cellPadding: 4 },
            columnStyles: { 1: { halign: 'center' } },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 14, right: 14 },
            styles: { lineColor: [226, 232, 240], lineWidth: 0.25 }
        })

        y = doc.lastAutoTable.finalY + 12
    }

    // Stock Movement Summary
    if (analytics?.stockMovements?.length) {
        if (y > 220) { doc.addPage(); y = 20 }

        y = addSectionTitle(doc, y, 'Stock Movement Summary (Last 30 Days)')

        autoTable(doc, {
            startY: y,
            head: [['Movement Type', 'Count', 'Total Quantity']],
            body: analytics.stockMovements.map(m => [
                (m._id || '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                m.count,
                `${m.totalQty} units`
            ]),
            headStyles: {
                fillColor: [30, 41, 59],
                textColor: [255, 255, 255],
                fontSize: 9,
                fontStyle: 'bold',
            },
            bodyStyles: { fontSize: 9, cellPadding: 4 },
            columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' } },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 14, right: 14 },
            styles: { lineColor: [226, 232, 240], lineWidth: 0.25 }
        })

        y = doc.lastAutoTable.finalY + 12
    }

    // User Statistics
    if (analytics?.userStats?.length) {
        if (y > 230) { doc.addPage(); y = 20 }

        y = addSectionTitle(doc, y, 'Staff Distribution')

        autoTable(doc, {
            startY: y,
            head: [['Role', 'Count']],
            body: analytics.userStats.map(u => [
                (u._id || '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                u.count
            ]),
            headStyles: {
                fillColor: [30, 41, 59],
                textColor: [255, 255, 255],
                fontSize: 9,
                fontStyle: 'bold',
            },
            bodyStyles: { fontSize: 9, cellPadding: 4 },
            columnStyles: { 1: { halign: 'center' } },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 14, right: 14 },
            styles: { lineColor: [226, 232, 240], lineWidth: 0.25 }
        })
    }

    addFooter(doc)
    doc.save(`Full_Business_Report_${new Date().toISOString().split('T')[0]}.pdf`)
}
