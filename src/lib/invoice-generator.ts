'use client';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

export const generateInvoicePDF = (order: any, user: any) => {
  const doc = new jsPDF() as any;

  // Header - Brand Info
  doc.setFontSize(22);
  doc.setTextColor(239, 68, 68); // Primary Color (Red)
  doc.text('DRIVERGY', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Learn. Drive. Live.', 14, 26);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text('Gurugaon sector 33, Haryana, India', 140, 20);
  doc.text('Email: support@drivergy.in', 140, 25);
  doc.text('Web: www.drivergy.in', 140, 30);

  doc.setLineWidth(0.5);
  doc.line(14, 35, 196, 35);

  // Invoice Title
  doc.setFontSize(18);
  doc.text('TAX INVOICE', 14, 45);

  // Customer & Order Info
  doc.setFontSize(10);
  doc.text(`Customer Name: ${user.name}`, 14, 55);
  doc.text(`Customer ID: ${user.uniqueId || 'N/A'}`, 14, 60);
  doc.text(`Contact: ${user.contact}`, 14, 65);
  doc.text(`Phone: ${user.phone || 'N/A'}`, 14, 70);

  doc.text(`Order ID: ${order.orderId}`, 120, 55);
  doc.text(`Transaction ID: ${order.transactionId || 'Pending'}`, 120, 60);
  doc.text(`Date: ${format(new Date(order.createdAt), 'PPP')}`, 120, 65);
  doc.text(`Payment Status: ${order.status}`, 120, 70);

  // Bill Table
  doc.autoTable({
    startY: 80,
    head: [['Description', 'Plan Type', 'Amount (INR)']],
    body: [
      [`Driving Education Subscription`, order.plan, `INR ${order.amount.toLocaleString('en-IN')}.00`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [239, 68, 68] },
  });

  // Summary Section - Fixed Overlapping
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  const labelX = 135;
  const valueX = 196;

  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  
  doc.text(`Subtotal:`, labelX, finalY);
  doc.text(`INR ${order.amount.toLocaleString('en-IN')}.00`, valueX, finalY, { align: 'right' });
  
  doc.text(`Tax (0%):`, labelX, finalY + 8);
  doc.text(`INR 0.00`, valueX, finalY + 8, { align: 'right' });

  doc.setLineWidth(0.3);
  doc.setDrawColor(200, 200, 200);
  doc.line(labelX, finalY + 12, valueX, finalY + 12);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(`Total Amount:`, labelX, finalY + 20);
  doc.text(`INR ${order.amount.toLocaleString('en-IN')}.00`, valueX, finalY + 20, { align: 'right' });

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text('Thank you for choosing Drivergy. Hit the road to safer driving!', 14, pageHeight - 20);
  doc.text('This is a computer-generated invoice and does not require a signature.', 14, pageHeight - 15);

  // Save the PDF
  doc.save(`Drivergy_Invoice_${order.orderId}.pdf`);
};