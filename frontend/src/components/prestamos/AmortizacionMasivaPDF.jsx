import React, { forwardRef } from 'react';
import { AmortizacionPDF } from './AmortizacionPDF';
import { GenericReportPDF } from '../ui/GenericReportPDF';

export const AmortizacionMasivaPDF = forwardRef(({ prestamos, summaryProps }, ref) => {
    if (!prestamos || prestamos.length === 0) return null;

    return (
        <div ref={ref} className="print-content" style={{ margin: '0 auto', background: 'white' }}>
            {/* First Page: Summary Table */}
            {summaryProps && (
                <div style={{ pageBreakAfter: 'always' }}>
                    <GenericReportPDF {...summaryProps} />
                </div>
            )}

            {/* Following Pages: Each Individual Amortization */}
            {prestamos.map((prestamo, index) => (
                <div key={prestamo.id} style={{ pageBreakAfter: index === prestamos.length - 1 ? 'auto' : 'always' }}>
                    <AmortizacionPDF prestamo={prestamo} />
                </div>
            ))}
        </div>
    );
});
