import React, { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, Loader2 } from 'lucide-react';

/**
 * QuickPrint — Motor de impresión/PDF simplificado y robusto
 */
export function QuickPrint({ trigger, component: Component, props, className = "", autoPrint = false }) {
    const componentRef = useRef(null);
    const [isPreparing, setIsPreparing] = useState(false);
    const uniquePrintId = useRef(Date.now()).current;

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: props?.title || `Reporte_${uniquePrintId}`,
        onAfterPrint: () => {
            setIsPreparing(false);
        },
        onPrintError: (err) => {
            console.error('Print Error:', err);
            setIsPreparing(false);
        }
    });

    // Auto-impresión para flujos automatizados (comprobantes post-pago)
    useEffect(() => {
        if (autoPrint && props && Component) {
            const t = setTimeout(() => handlePrint(), 1000);
            return () => clearTimeout(t);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoPrint, !!props]);

    const manualPrint = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!props || !Component || isPreparing) return;

        setIsPreparing(true);

        // Ejecutamos la impresión con un pequeño delay para asegurar renderizado
        setTimeout(() => {
            try {
                handlePrint();
                // Timeout de seguridad por si el diálogo nativo no retorna foco a la ventana
                setTimeout(() => setIsPreparing(false), 5000);
            } catch (err) {
                console.error("Print Crash:", err);
                setIsPreparing(false);
            }
        }, 300);
    };

    const hasData = !!(Component && props);

    return (
        <div className="w-full">
            {/* Contenedor off-screen */}
            {hasData && (
                <div style={{
                    position: 'absolute',
                    left: '-9999px',
                    top: '-9999px',
                    pointerEvents: 'none',
                    opacity: 0
                }}>
                    <div ref={componentRef}>
                        <Component {...props} />
                    </div>
                </div>
            )}

            {/* Botón */}
            {trigger ? (
                <div onClick={hasData ? manualPrint : undefined} className={!hasData ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}>
                    {trigger}
                </div>
            ) : (
                <button
                    type="button"
                    onClick={manualPrint}
                    disabled={isPreparing || !hasData}
                    className={`flex items-center gap-3 bg-[#1A6FFF] hover:bg-[#00D4FF] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl w-full justify-center transition-all shadow-lg ${className}`}
                >
                    {isPreparing ? (
                        <Loader2 className="animate-spin" size={18} />
                    ) : (
                        <Printer size={18} />
                    )}
                    {isPreparing ? "GENERANDO..." : "DESCARGAR / IMPRIMIR"}
                </button>
            )}
        </div>
    );
}
