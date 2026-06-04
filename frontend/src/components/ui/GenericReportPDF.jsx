import React, { forwardRef } from 'react';
import logoYap from '../../assets/logo_yap_light.png';

export const GenericReportPDF = forwardRef(({ title, subtitle, infoRows = [], tableHeaders = [], tableRows = [], footerText = "" }, ref) => {
    const fechaHoy = new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: '2-digit'
    }).toUpperCase();

    return (
        <div ref={ref} className="p-8 bg-white text-black font-sans text-[9px]" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto' }}>
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
                <div className="flex flex-col">
                    <img src={logoYap} alt="YAP" className="w-20 h-20 object-contain" />
                    <p className="font-bold text-lg mt-1">YAP (CRÉDITOS POR LIBRANZA)</p>
                </div>
                <div className="text-right">
                    <h1 className="font-bold text-xl uppercase text-blue-900">{title}</h1>
                    <p className="text-sm font-bold uppercase text-gray-600 italic">{subtitle}</p>
                    <p className="text-[10px] mt-2">FECHA DE GENERACIÓN: {fechaHoy}</p>
                </div>
            </div>

            {/* General Information Section */}
            {infoRows.length > 0 && (
                <div className="mb-6 grid grid-cols-2 gap-x-8 gap-y-2 bg-gray-50 p-4 border border-black/10 rounded">
                    {infoRows.map((row, idx) => (
                        <div key={idx} className="flex justify-between border-b border-gray-200 py-1">
                            <span className="font-bold uppercase text-gray-700">{row.label}:</span>
                            <span className="font-normal text-black">{row.value}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Title Bar */}
            <div className="bg-gray-400 text-black font-black text-center py-1 mt-2 text-[10px] uppercase border border-black mb-1">
                DETALLE GENERAL DE OBLIGACIONES VIGENTES E HISTÓRICAS
            </div>

            {/* Table Section */}
            {tableHeaders.length > 0 && (
                <table className="w-full border-collapse border border-black">
                    <thead className="bg-gray-300 font-bold uppercase text-center border-b border-black text-[7px]">
                        <tr className="divide-x divide-black border-black border-b">
                            {tableHeaders.map((header, idx) => (
                                <th key={idx} className={`p-1 pt-2 pb-2 ${header.align || 'text-center'} ${header.width || ''}`}>
                                    {header.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-[8px] font-semibold divide-y divide-black border-black">
                        {tableRows.length > 0 ? (
                            tableRows.map((row, rowIdx) => (
                                <tr key={rowIdx} className={`divide-x divide-black ${rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"} text-center`}>
                                    {row.map((cell, cellIdx) => (
                                        <td key={cellIdx} className={`p-1 ${tableHeaders[cellIdx]?.align || 'text-center'} ${cell.style || ''} ${cell.textStyle || ''}`}>
                                            {cell.value}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={tableHeaders.length} className="border border-black p-8 text-center font-bold text-gray-400 italic">
                                    No se encontraron registros para este reporte.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}

            {/* Summary / Totalization if needed */}
            {footerText && (
                <div className="mt-4 p-2 bg-gray-100 border border-black text-black font-black uppercase text-center text-[10px]">
                    {footerText}
                </div>
            )}

            {/* Signature Area */}
            <div className="mt-16 flex justify-around px-20">
                <div className="flex flex-col items-center">
                    <div className="w-48 border-b border-black mb-1"></div>
                    <p className="text-[9px] font-bold uppercase tracking-widest">Aprobación Administrativa</p>
                    <p className="text-[7px] text-gray-500">DEPARTAMENTO DE CARTERA</p>
                </div>
                <div className="flex flex-col items-center">
                    <div className="w-56 border-b-2 border-black mb-1"></div>
                    <p className="text-[10px] font-bold uppercase tracking-widest">Sello De Veracidad</p>
                </div>
            </div>

            {/* System Tag */}
            <div className="mt-12 pt-4 border-t border-gray-200 text-center text-[8px] uppercase text-gray-400 tracking-tighter">
                Documento generado por el Sistema de Gestión YAP (CRÉDITOS POR LIBRANZA). Protegido bajo políticas de privacidad.
            </div>
        </div>
    );
});
